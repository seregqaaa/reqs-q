// Constants
import {
  ERR_TIMEOUT,
  ERR_UNKNOWN_NETWORK_ERROR,
  requestsStatuses,
} from '../global/constants.js';

// Utils
import { unlink } from '../utils/helpers.js';
import { protectObject } from '../utils/object.js';

// Models
import { notRequestInstanceError, RequestModel } from '../models/Request.js';

/**
 * Core class of Requests Queue.
 */
export class RequestsQueueCore {
  /**
   * @type {RequestModel[]}
   */
  #queue;

  /**
   * @type {boolean}
   */
  #isQueueBusy;

  /**
   * @type {boolean}
   */
  #showErrors;

  /**
   * Creates new instance of `RequestsQueueCore` class.
   *
   * @param {
   *    showErrors?: boolean
   * } params `RequestsQueueCore` parameters.
   */
  constructor(params) {
    this.#queue = [];
    this.#isQueueBusy = false;
    this.#showErrors = params.showErrors ?? true;
  }

  /**
   * @returns {RequestModel[]} Read-only requests queue.
   */
  get _queue() {
    return unlink(this.#queue);
  }

  /**
   * @returns {RequestModel[]} Read-only requests queue.
   */
  get queue() {
    return protectObject(this.#queue);
  }

  /**
   * Adds provided request to the queue.
   *
   * @param {RequestModel | Promise<Function>} rawRequest Request to be added to queue.
   * @returns {Promise<RequestModel>}
   */
  request(rawRequest) {
    const request =
      typeof rawRequest === 'function'
        ? new RequestModel({ callback: rawRequest })
        : rawRequest;
    const isRequest = request instanceof RequestModel;
    if (!isRequest) throw notRequestInstanceError;

    const promise = new Promise(r => {
      request.done = r;
    });
    this.#queue.push(request);
    this.onRequestAdd();
    this.log('Request has been added to the queue', request);
    if (!this.#isQueueBusy) this.#handleQueue();
    return promise;
  }

  /**
   * Handles queue requests. Sorts requests by priority.
   * Receives the first request of the queue and executes it.
   *
   * @returns {Promise<void>}
   */
  async #handleQueue() {
    const queue = this.#queue;
    if (queue.length === 0) {
      this.#isQueueBusy = false;
      this.onQueueEmpty();
      this.log('Queue is empty, waiting for new requests...');
      return;
    }

    this.#isQueueBusy = true;
    queue.sort((a, b) => b.priority - a.priority);

    this.log('Queue has been sorted by request priority', queue);
    this.onQueueSorted();

    this.beforeRequestHandle();
    await this.#handleRequest(queue[0]);
    queue.shift();
    this.afterRequestHandle();

    if (queue.length > 0) {
      this.log(
        `${queue.length} request${
          queue.length === 1 ? '' : 's'
        } left in the queue`,
        queue,
      );
    }

    return this.#handleQueue();
  }

  /**
   * Sends provided request to the execution process.
   *
   * @param {RequestModel} request Request to be sent.
   * @returns {Promise<void>}
   */
  async #handleRequest(request) {
    request.timestamps.startedAt = Date.now();
    request.status = requestsStatuses.inProgress;

    this.log('New request starts executing', request);
    this.onRequestStartExecute(request);

    const response = await this.#getResponse(request);
    request.timestamps.doneAt = Date.now();
    request.status = requestsStatuses.done;
    request.response = response;
    request.done(request);
    this.log('Request result:', request);
    this.onRequestDone(request);
  }

  /**
   * Executes provided request with retries.
   *
   * @param {RequestModel} request Request to be executed.
   * @param {number} retriesDone Number of retries performed.
   * @returns {Promise<Record<string, any>>}
   */
  async #getResponse(request, retriesDone = 0) {
    const shouldRetryByConfig =
      request.retryAfter !== null && request.retriesCount !== null;
    const retryAfter = shouldRetryByConfig
      ? retriesDone * request.retryAfter
      : 0;
    const response = await new Promise(resolve =>
      setTimeout(
        async () => resolve(await this.#makeRequest(request, retriesDone)),
        retryAfter,
      ),
    );
    const shouldRetry =
      shouldRetryByConfig &&
      response.isError &&
      retriesDone < request.retriesCount;

    if (shouldRetry) {
      this.log(`Retrying: attempt ${retriesDone}`, request);
      this.onRetry(request);
    } else {
      this.log(
        `Request has been ${response.isError ? 'failed' : 'completed'}`,
        request,
      );
      response.isError
        ? this.onRequestFail(request)
        : this.onRequestSuccess(request);
    }

    return shouldRetry
      ? await this.#getResponse(request, retriesDone + 1)
      : response;
  }

  /**
   * Executes provided request with a timeout.
   *
   * @param {RequestModel} request Request to be executed.
   * @param {number} retriesDone Number of retries performed.
   * @returns {Promise<Record<string, any>>} Request result.
   */
  async #makeRequest(request, retriesDone = 0) {
    this.log(`Request in progress: attempt ${retriesDone}`, request);
    this.onRequestProgress(request);

    try {
      const result = await Promise.race([
        request.callback(),
        this.#throwTimeout(request.timeout),
      ]);
      if (
        !result ||
        result === ERR_TIMEOUT ||
        (result.status && !(result.status >= 200 && result.status <= 299))
      ) {
        throw new Error(
          (result instanceof Response
            ? result.statusText || result.status
            : result) || ERR_UNKNOWN_NETWORK_ERROR,
        );
      }

      return result;
    } catch (e) {
      if (this.#showErrors) {
        console.error(e);
      }
      const error = {
        retriesDone,
        isError: true,
        details: e,
        timestamp: Date.now(),
      };
      request.errors.push(error);

      return error;
    }
  }

  /**
   * Rejects the promise after the provided timeout.
   *
   * @param {number} timeout Timeout after which promise must be rejected.
   */
  #throwTimeout(timeout) {
    return new Promise((_, r) => setTimeout(() => r(ERR_TIMEOUT), timeout));
  }

  // Lifecycle hooks.

  // 1
  /**
   * @param {RequestModel} request
   */
  onRequestAdd(request) {}

  // 2
  onQueueSorted() {}

  // 3
  beforeRequestHandle() {}

  // 4
  /**
   * @param {RequestModel} request
   */
  onRequestStartExecute(request) {}

  // 5
  /**
   * @param {RequestModel} request
   */
  onRequestProgress(request) {}

  // 6
  /**
   * @param {RequestModel} request
   */
  onRetry(request) {}

  // 7
  /**
   * @param {RequestModel} request
   */
  onRequestFail(request) {}
  /**
   * @param {RequestModel} request
   */
  onRequestSuccess(request) {}

  // 8
  /**
   * @param {RequestModel} request
   */
  onRequestDone(request) {}

  // 9
  afterRequestHandle() {}

  // 10
  onQueueEmpty() {}

  log() {}
}

/**
 * Requests queue class.
 */
export class RequestsQueue extends RequestsQueueCore {
  /**
   * @type {QueueLogger}
   */
  #logger;
  /**
   * @type {QueueStoreManager}
   */
  #storeManager;

  /**
   * Creates new instance of `RequestsQueue` class.
   *
   * @param {{
   *    logger?: QueueLogger
   *    storeManager?: QueueStoreManager
   *    showErrors?: boolean
   * }} params `RequestsQueue` parameters.
   */
  constructor(params = {}) {
    super({ showErrors: params.showErrors ?? true });
    this.#logger = params.logger ?? null;
    this.#storeManager = params.storeManager ?? null;
  }

  /**
   * @returns {Record<string, any>[]} Read-only logs.
   */
  get logs() {
    if (!this.#logger) {
      throw new Error('Logger was not provided when the instance was created');
    }
    return protectObject(this.#logger.logs);
  }

  /**
   * Saves queue when request added.
   */
  onRequestAdd() {
    this.save(unlink(this._queue));
  }

  /**
   * Saves queue after request handled.
   */
  afterRequestHandle() {
    this.save(unlink(this._queue));
  }

  /**
   * Displays provided data in the console.
   * Saves logs if `this.#logger` exists.
   *
   * @param  {...any} data Data to be logged.
   * @returns {void}
   */
  log(...data) {
    if (!this.#logger) return;
    this.#logger.log(...data);
  }

  /**
   * Saves queue with `QueueStoreManager`.
   *
   * @param {RequestModel[]} queue Queue to be stored.
   * @returns {void}
   */
  save(queue) {
    if (!this.#storeManager) return;
    this.#storeManager.save(unlink(queue));
  }

  /**
   * Loads queue with `QueueStoreManager`.
   *
   * @returns {{ actionPath: string, args: any[] }[]}
   */
  load() {
    if (!this.#storeManager) return;
    return this.#storeManager.load();
  }

  /**
   * Restarts queue with `QueueStoreManager`.
   *
   * @returns {Promise<any[] | undefined>}
   */
  async restart() {
    if (!this.#storeManager) return;
    return await this.#storeManager.restart();
  }
}
