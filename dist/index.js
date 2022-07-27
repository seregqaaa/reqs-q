var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value,
      })
    : (obj[key] = value);
var __name = (target, value) =>
  __defProp(target, 'name', { value, configurable: !0 });
var __publicField = (obj, key, value) => (
    __defNormalProp(obj, typeof key != 'symbol' ? key + '' : key, value), value
  ),
  __accessCheck = (obj, member, msg) => {
    if (!member.has(obj)) throw TypeError('Cannot ' + msg);
  };
var __privateGet = (obj, member, getter) => (
    __accessCheck(obj, member, 'read from private field'),
    getter ? getter.call(obj) : member.get(obj)
  ),
  __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError('Cannot add the same private member more than once');
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  },
  __privateSet = (obj, member, value, setter) => (
    __accessCheck(obj, member, 'write to private field'),
    setter ? setter.call(obj, value) : member.set(obj, value),
    value
  );
var __privateMethod = (obj, member, method) => (
  __accessCheck(obj, member, 'access private method'), method
);
var priorities = { low: 1, medium: 2, high: 3, critical: 4 },
  requestsStatuses = {
    waiting: 'WAITING',
    inProgress: 'IN_PROGRESS',
    done: 'DONE',
  },
  ERR_TIMEOUT = 'ERR_TIMEOUT',
  ERR_UNKNOWN_NETWORK_ERROR = 'ERR_UNKNOWN_NETWORK_ERROR';
function unlink(data) {
  return JSON.parse(JSON.stringify(data));
}
__name(unlink, 'unlink');
function getDeepField(currentObj, rawPath) {
  let path = [];
  if (
    (path.push(...(typeof rawPath == 'string' ? rawPath.split('.') : rawPath)),
    path.length === 0 || typeof currentObj != 'object')
  )
    return currentObj;
  let currentField = path[0];
  return path.shift(), getDeepField(currentObj[currentField], path);
}
__name(getDeepField, 'getDeepField');
function protectObject(
  object,
  allowedPropNames = ['length'],
  error = new Error('This object is read-only'),
) {
  return new Proxy(object, {
    get: (queue, propName) => {
      if (allowedPropNames.includes(propName)) return queue[propName];
      throw error;
    },
    set: () => {
      throw error;
    },
  });
}
__name(protectObject, 'protectObject');
function getRandomFloat(max = 2 ** 48) {
  return Math.random() * max;
}
__name(getRandomFloat, 'getRandomFloat');
function getRandomInt(max = 2 ** 48) {
  return Math.ceil(getRandomFloat(max));
}
__name(getRandomInt, 'getRandomInt');
function getRandomString(length = 16, prevString = '') {
  let string = getRandomInt().toString(16) + prevString;
  return string.length < length
    ? getRandomString(length, string)
    : string.substring(0, length);
}
__name(getRandomString, 'getRandomString');
var RequestModel = class {
  constructor(params = { callback: () => ({}) }) {
    if (!params.callback)
      throw new Error('Required parameter "callback" was not provided');
    (this.done = null),
      (this.timestamps = new Timestamps(params.timestamps)),
      (this.timestamps.createdAt = Date.now()),
      (this.callback = params.callback),
      (this.errors = params.errors ?? []),
      (this.timeout = params.timeout ?? 15e3),
      (this.response = params.response ?? null),
      (this.id = params.id ?? getRandomString()),
      (this.retryAfter = params.retryAfter ?? null),
      (this.retriesCount = params.retriesCount ?? null),
      (this.storeData = params.storeData ?? {}),
      (this.priority = params.priority ?? priorities.low),
      (this.status = params.status ?? requestsStatuses.waiting),
      (this.storeData.storageDuration = this.storeData.storageDuration
        ? this.storeData.storageDuration
        : 1e3 * 60 * 60);
  }
};
__name(RequestModel, 'RequestModel');
var Timestamps = class {
  constructor(props) {
    (this.createdAt = props?.createdAt ?? null),
      (this.startedAt = props?.startedAt ?? null),
      (this.doneAt = props?.doneAt ?? null);
  }
};
__name(Timestamps, 'Timestamps');
var notRequestInstanceError = new Error('Expected to get instance of Request');
var RequestsQueueCore = class {
  #queue;
  #isQueueBusy;
  #showErrors;
  constructor(params) {
    (this.#queue = []),
      (this.#isQueueBusy = !1),
      (this.#showErrors = params.showErrors ?? !0);
  }
  get _queue() {
    return this.#queue;
  }
  get queue() {
    return protectObject(this.#queue);
  }
  request(rawRequest) {
    let request =
      typeof rawRequest == 'function'
        ? new RequestModel({ callback: rawRequest })
        : rawRequest;
    if (!(request instanceof RequestModel)) throw notRequestInstanceError;
    let promise = new Promise(r => {
      request.done = r;
    });
    return (
      this.#queue.push(request),
      this.onRequestAdd(request),
      this.#isQueueBusy || this.#handleQueue(),
      promise
    );
  }
  async #handleQueue() {
    let queue = this.#queue;
    if (queue.length === 0) {
      (this.#isQueueBusy = !1), this.onQueueEmpty();
      return;
    }
    return (
      (this.#isQueueBusy = !0),
      queue.sort((a, b) => b.priority - a.priority),
      this.beforeRequestHandle(),
      await this.#handleRequest(queue[0]),
      queue.shift(),
      this.afterRequestHandle(),
      this.#handleQueue()
    );
  }
  async #handleRequest(request) {
    (request.timestamps.startedAt = Date.now()),
      (request.status = requestsStatuses.inProgress),
      this.onRequestStartExecute(request);
    let response = await this.#getResponse(request);
    (request.timestamps.doneAt = Date.now()),
      (request.status = requestsStatuses.done),
      (request.response = response),
      request.done(request),
      this.onRequestDone(request);
  }
  async #getResponse(request, retriesDone = 0) {
    let shouldRetryByConfig =
        request.retryAfter !== null && request.retriesCount !== null,
      retryAfter = shouldRetryByConfig ? retriesDone * request.retryAfter : 0,
      response = await new Promise(resolve =>
        setTimeout(
          async () => resolve(await this.#makeRequest(request, retriesDone)),
          retryAfter,
        ),
      ),
      shouldRetry =
        shouldRetryByConfig &&
        response.isError &&
        retriesDone < request.retriesCount;
    return (
      shouldRetry
        ? this.onRetry(request, retriesDone)
        : response.isError
        ? this.onRequestFail(request)
        : this.onRequestSuccess(request),
      shouldRetry ? await this.#getResponse(request, retriesDone + 1) : response
    );
  }
  async #makeRequest(request, retriesDone = 0) {
    this.onRequestProgress(request, retriesDone);
    try {
      let result = await Promise.race([
        request.callback(),
        this.#throwTimeout(request.timeout),
      ]);
      if (
        !result ||
        result === ERR_TIMEOUT ||
        (result.status && !(result.status >= 200 && result.status <= 299))
      )
        throw new Error(
          (result instanceof Response
            ? result.statusText || result.status
            : result) || ERR_UNKNOWN_NETWORK_ERROR,
        );
      return result;
    } catch (e) {
      this.#showErrors && console.error(e);
      let error = {
        retriesDone,
        isError: !0,
        details: e,
        timestamp: Date.now(),
      };
      return request.errors.push(error), error;
    }
  }
  #throwTimeout(timeout) {
    return new Promise((_, r) => setTimeout(() => r(ERR_TIMEOUT), timeout));
  }
  onRequestAdd(request) {}
  beforeRequestHandle() {}
  onRequestStartExecute(request) {}
  onRequestProgress(request, retriesDone) {}
  onRetry(request, retriesDone) {}
  onRequestFail(request) {}
  onRequestSuccess(request) {}
  onRequestDone(request) {}
  afterRequestHandle() {}
  onQueueEmpty() {}
};
__name(RequestsQueueCore, 'RequestsQueueCore');
var RequestsQueue = class extends RequestsQueueCore {
  #logger;
  #storeManager;
  constructor(params = {}) {
    super({ showErrors: params.showErrors ?? !0 }),
      (this.#logger = params.logger ?? null),
      (this.#storeManager = params.storeManager ?? null);
  }
  get logs() {
    if (!this.#logger)
      throw new Error('Logger was not provided when the instance was created');
    return protectObject(this.#logger.logs);
  }
  onRequestAdd(request) {
    this.save(unlink(this._queue)),
      this.log('Request has been added to the queue', request);
  }
  afterRequestHandle() {
    let queue = this._queue;
    queue.length > 0 &&
      this.log(
        `${queue.length} request${
          queue.length === 1 ? '' : 's'
        } left in the queue`,
        queue,
      ),
      this.save(unlink(queue));
  }
  onQueueEmpty() {
    this.log('Queue is empty, waiting for new requests...');
  }
  beforeRequestHandle() {
    this.log('Queue has been sorted by request priority', this._queue);
  }
  onRequestStartExecute(request) {
    this.log('New request starts executing', request);
  }
  onRequestDone(request) {
    this.log('Request result:', request);
  }
  onRetry(request, retriesDone) {
    this.log(`Retrying: attempt ${retriesDone}`, request);
  }
  onRequestFail(request) {
    this.log('Request has been failed', request);
  }
  onRequestSuccess(request) {
    this.log('Request has been completed', request);
  }
  onRequestProgress(request, retriesDone) {
    this.log(`Request in progress: attempt ${retriesDone}`, request);
  }
  log(...data) {
    !this.#logger || this.#logger.log(...data);
  }
  save(queue) {
    !this.#storeManager || this.#storeManager.save(unlink(queue));
  }
  load() {
    if (!!this.#storeManager) return this.#storeManager.load();
  }
  async restart() {
    if (!!this.#storeManager) return await this.#storeManager.restart();
  }
};
__name(RequestsQueue, 'RequestsQueue');
var QueueLogger = class {
  #logs;
  #logLimit;
  #saveLogs;
  #showLogs;
  constructor(params = {}) {
    (this.#logs = []),
      (this.#logLimit = params.logLimit ?? 50),
      (this.#saveLogs = params.saveLogs ?? !1),
      (this.#showLogs = params.showLogs ?? !0);
  }
  get logs() {
    return this.#logs;
  }
  log(...data) {
    let unlinkedData = unlink(data),
      timestamp = Date.now();
    if (
      (this.#showLogs && console.log(...unlinkedData, timestamp),
      !this.#saveLogs)
    )
      return;
    let logObj = Object.entries(unlinkedData).reduce(
      (logObj2, [key, val]) => ({ ...logObj2, [key]: val }),
      {},
    );
    (logObj.timestamp = timestamp),
      this.#logs.length === this.#logLimit && this.#logs.pop(),
      this.#logs.unshift(logObj);
  }
};
__name(QueueLogger, 'QueueLogger');
function encodeb64(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode('0x' + p1),
    ),
  );
}
__name(encodeb64, 'encodeb64');
function decodeb64(str) {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}
__name(decodeb64, 'decodeb64');
var stores = { localStorage: 'localStorage' },
  _store,
  _restoreObject,
  _showWarn,
  _shouldEncode,
  _saveToLocalStorage,
  saveToLocalStorage_fn,
  _loadFromLocalStorage,
  loadFromLocalStorage_fn,
  _prepareForStore,
  prepareForStore_fn,
  _checkArgsSafety,
  checkArgsSafety_fn,
  _QueueStoreManager = class {
    constructor(params = {}) {
      __privateAdd(this, _saveToLocalStorage);
      __privateAdd(this, _loadFromLocalStorage);
      __privateAdd(this, _prepareForStore);
      __privateAdd(this, _checkArgsSafety);
      __privateAdd(this, _store, void 0);
      __privateAdd(this, _restoreObject, void 0);
      __privateAdd(this, _showWarn, void 0);
      __privateAdd(this, _shouldEncode, void 0);
      __privateSet(this, _store, params.store ?? stores.localStorage),
        __privateSet(this, _restoreObject, params.restoreObject ?? null),
        __privateSet(this, _showWarn, params.showWarn ?? !0),
        __privateSet(this, _shouldEncode, params.shouldEncode ?? !0);
    }
    save(queue) {
      switch (__privateGet(this, _store)) {
        case stores.localStorage:
          __privateMethod(
            this,
            _saveToLocalStorage,
            saveToLocalStorage_fn,
          ).call(this, queue);
          break;
        default:
          return null;
      }
    }
    load() {
      switch (__privateGet(this, _store)) {
        case stores.localStorage:
          return __privateMethod(
            this,
            _loadFromLocalStorage,
            loadFromLocalStorage_fn,
          ).call(this);
        default:
          return null;
      }
    }
    async restart() {
      if (!__privateGet(this, _restoreObject)) return;
      let promises = this.load().map(
          async ({ actionPath, args }) =>
            await getDeepField(
              __privateGet(this, _restoreObject),
              actionPath,
            )(...args),
        ),
        results = await Promise.all(promises);
      return this.save([]), results;
    }
  },
  QueueStoreManager = _QueueStoreManager;
__name(QueueStoreManager, 'QueueStoreManager'),
  (_store = new WeakMap()),
  (_restoreObject = new WeakMap()),
  (_showWarn = new WeakMap()),
  (_shouldEncode = new WeakMap()),
  (_saveToLocalStorage = new WeakSet()),
  (saveToLocalStorage_fn = __name(function (rawQueue) {
    let queue = __privateMethod(
      this,
      _prepareForStore,
      prepareForStore_fn,
    ).call(this, rawQueue);
    localStorage.setItem(_QueueStoreManager.LOCAL_STORAGE_KEY, queue);
  }, '#saveToLocalStorage')),
  (_loadFromLocalStorage = new WeakSet()),
  (loadFromLocalStorage_fn = __name(function () {
    let localStorageQueue =
        localStorage.getItem(_QueueStoreManager.LOCAL_STORAGE_KEY) ?? '[]',
      decodedQueue = __privateGet(this, _shouldEncode)
        ? decodeb64(localStorageQueue)
        : localStorageQueue;
    return JSON.parse(decodedQueue)
      .filter(item => item.timestamp + item.storageDuration >= Date.now())
      .map(item => ({
        actionPath: item.actionPath,
        args: __privateMethod(this, _checkArgsSafety, checkArgsSafety_fn).call(
          this,
          item.args,
        ),
      }));
  }, '#loadFromLocalStorage')),
  (_prepareForStore = new WeakSet()),
  (prepareForStore_fn = __name(function (queue) {
    let filteredQueue = queue
        .map(r => ({
          ...r.storeData,
          args: __privateMethod(
            this,
            _checkArgsSafety,
            checkArgsSafety_fn,
          ).call(this, r.storeData.args ?? []),
          timestamp: Date.now(),
        }))
        .filter(item => Boolean(item.actionPath)),
      stringifiedQueue = JSON.stringify(filteredQueue);
    return __privateGet(this, _shouldEncode)
      ? encodeb64(stringifiedQueue)
      : stringifiedQueue;
  }, '#prepareForStore')),
  (_checkArgsSafety = new WeakSet()),
  (checkArgsSafety_fn = __name(function (args) {
    return __privateGet(this, _showWarn)
      ? args.map(arg => {
          try {
            new URL(arg),
              console.warn(`Saving argument "${arg}" may be not safe`);
          } catch {
          } finally {
            return arg;
          }
        })
      : args;
  }, '#checkArgsSafety')),
  __publicField(QueueStoreManager, 'LOCAL_STORAGE_KEY', '__reqs-q-v1.1.0__');
export {
  QueueLogger,
  QueueStoreManager,
  RequestModel,
  RequestsQueue,
  RequestsQueueCore,
  priorities,
  stores,
};
