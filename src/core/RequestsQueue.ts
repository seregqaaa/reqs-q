// Constants
import {
  ERR_TIMEOUT,
  ERR_UNKNOWN_NETWORK_ERROR,
  RequestsStatuses,
} from '../global/constants';

// Utils
import { unlink } from '../utils/helpers';
import { protectObject } from '../utils/object';

// Models
import {
  notRequestInstanceError,
  RequestModel,
  RequestModelError,
} from '../models/Request.js';
import { QueueLogger } from './QueueLogger';
import { QueueStoreManager, BaseStoreData } from './QueueStoreManager';

type RequestsQueueCoreParams = {
  showErrors?: boolean;
};

/**
 * Core class of Requests Queue.
 */
export class RequestsQueueCore {
  /**
   * @type {RequestModel[]}
   */
  #queue: RequestModel[];

  /**
   * @type {boolean}
   */
  #isQueueBusy: boolean;

  /**
   * @type {boolean}
   */
  #showErrors: boolean;

  /**
   * Creates new instance of `RequestsQueueCore` class.
   *
   * @param {
   *    showErrors?: boolean
   * } params `RequestsQueueCore` parameters.
   */
  constructor(params: RequestsQueueCoreParams) {
    this.#queue = [];
    this.#isQueueBusy = false;
    this.#showErrors = params.showErrors ?? true;
  }

  /**
   * @returns {RequestModel[]} Read-only requests queue.
   */
  get _queue(): RequestModel[] {
    return this.#queue;
  }

  /**
   * @returns {RequestModel[]} Read-only requests queue.
   */
  get queue(): RequestModel[] {
    return protectObject(this.#queue);
  }

  /**
   * Adds provided request to the queue.
   *
   * @param {RequestModel | ((...args: any[]) => Promise<any | void>)} rawRequest Request to be added to queue.
   * @returns {Promise<RequestModel>}
   */
  public request(
    rawRequest: RequestModel | ((...args: any[]) => Promise<any | void>),
  ): Promise<RequestModel> {
    const request =
      typeof rawRequest === 'function'
        ? new RequestModel({ callback: rawRequest })
        : rawRequest;
    const isRequest = request instanceof RequestModel;
    if (!isRequest) throw notRequestInstanceError;

    const promise: Promise<RequestModel> = new Promise(r => {
      request.done = <(request: RequestModel) => Promise<any>>r;
    });
    this.#queue.push(request);
    this.onRequestAdd(request);
    if (!this.#isQueueBusy) this.#handleQueue();
    return promise;
  }

  /**
   * Handles queue requests. Sorts requests by priority.
   * Receives the first request of the queue and executes it.
   *
   * @returns {Promise<void>}
   */
  async #handleQueue(): Promise<void> {
    const queue = this.#queue;
    if (queue.length === 0) {
      this.#isQueueBusy = false;
      this.onQueueEmpty();
      return;
    }

    this.#isQueueBusy = true;
    queue.sort((a, b) => b.priority - a.priority);

    this.beforeRequestHandle();
    await this.#handleRequest(queue[0]);
    queue.shift();
    this.afterRequestHandle();

    return this.#handleQueue();
  }

  /**
   * Sends provided request to the execution process.
   *
   * @param {RequestModel} request Request to be sent.
   * @returns {Promise<void>}
   */
  async #handleRequest(request: RequestModel): Promise<void> {
    request.timestamps.startedAt = Date.now();
    request.status = RequestsStatuses.InProgress;

    this.onRequestStartExecute(request);

    const response = await this.#getResponse(request);
    request.timestamps.doneAt = Date.now();
    request.status = RequestsStatuses.Done;
    request.response = response;

    if (request.done) {
      request.done(request);
    }

    this.onRequestDone(request);
  }

  /**
   * Executes provided request with retries.
   *
   * @param {RequestModel} request Request to be executed.
   * @param {number} retriesDone Number of retries performed.
   * @returns {Promise<Record<string, any>>}
   */
  async #getResponse(
    request: RequestModel,
    retriesDone: number = 0,
  ): Promise<Record<string, any> | RequestModelError> {
    const { retryAfter, retriesCount } = request;
    const shouldRetryByConfig = retryAfter !== null && retriesCount !== null;
    const retryAfterTimeout = shouldRetryByConfig
      ? retriesDone * retryAfter
      : 0;
    const response: RequestModelError | Record<string, any> = await new Promise(
      resolve =>
        setTimeout(
          async () => resolve(await this.#makeRequest(request, retriesDone)),
          retryAfterTimeout,
        ),
    );
    const shouldRetry =
      shouldRetryByConfig && response.isError && retriesDone < retriesCount;

    if (shouldRetry) {
      this.onRetry(request, retriesDone);
    } else {
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
   * @returns {Promise<Record<string, any> | RequestModelError>} Request result.
   */
  async #makeRequest(
    request: RequestModel,
    retriesDone: number = 0,
  ): Promise<Record<string, any> | RequestModelError> {
    this.onRequestProgress(request, retriesDone);

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
      const error: RequestModelError = {
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
  #throwTimeout(timeout: number): Promise<never> {
    return new Promise((_, r) => setTimeout(() => r(ERR_TIMEOUT), timeout));
  }

  // Lifecycle hooks.

  // 1
  /**
   * @param {RequestModel} request
   */
  public onRequestAdd(request: RequestModel): void {}

  // 2
  public beforeRequestHandle(): void {}

  // 3
  /**
   * @param {RequestModel} request
   */
  public onRequestStartExecute(request: RequestModel): void {}

  // 4
  /**
   * @param {RequestModel} request
   * @param {number} retriesDone
   */
  public onRequestProgress(request: RequestModel, retriesDone: number): void {}

  // 5
  /**
   * @param {RequestModel} request
   * @param {number} retriesDone
   */
  public onRetry(request: RequestModel, retriesDone: number): void {}

  // 6
  /**
   * @param {RequestModel} request
   */
  public onRequestFail(request: RequestModel): void {}
  /**
   * @param {RequestModel} request
   */
  public onRequestSuccess(request: RequestModel): void {}

  // 7
  /**
   * @param {RequestModel} request
   */
  public onRequestDone(request: RequestModel): void {}

  // 8
  public afterRequestHandle(): void {}

  // 9
  public onQueueEmpty(): void {}
}

type RequestsQueueParams = {
  logger?: QueueLogger;
  storeManager?: QueueStoreManager;
  showErrors?: boolean;
};

/**
 * Requests queue class.
 */
export class RequestsQueue extends RequestsQueueCore {
  /**
   * @type {QueueLogger}
   */
  #logger: QueueLogger | null;
  /**
   * @type {QueueStoreManager}
   */
  #storeManager: QueueStoreManager | null;

  /**
   * Creates new instance of `RequestsQueue` class.
   *
   * @param {{
   *    logger?: QueueLogger
   *    storeManager?: QueueStoreManager
   *    showErrors?: boolean
   * }} params `RequestsQueue` parameters.
   */
  constructor(params: RequestsQueueParams = {}) {
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
   *
   * @param {RequestModel} request
   */
  onRequestAdd(request: RequestModel): void {
    this.save(unlink(this._queue));
    this.log('Request has been added to the queue', request);
  }

  /**
   * Saves queue after request handled.
   */
  afterRequestHandle() {
    const queue = this._queue;
    if (queue.length > 0) {
      this.log(
        `${queue.length} request${
          queue.length === 1 ? '' : 's'
        } left in the queue`,
        queue,
      );
    }
    this.save(unlink(queue));
  }

  onQueueEmpty() {
    this.log('Queue is empty, waiting for new requests...');
  }

  beforeRequestHandle() {
    this.log('Queue has been sorted by request priority', this._queue);
  }

  /**
   * @param {RequestModel} request
   */
  onRequestStartExecute(request: RequestModel) {
    this.log('New request starts executing', request);
  }

  /**
   * @param {RequestModel} request
   */
  onRequestDone(request: RequestModel) {
    this.log('Request result:', request);
  }

  /**
   * @param {RequestModel} request
   * @param {number} retriesDone
   */
  onRetry(request: RequestModel, retriesDone: number) {
    this.log(`Retrying: attempt ${retriesDone}`, request);
  }

  /**
   * @param {RequestModel} request
   */
  onRequestFail(request: RequestModel) {
    this.log('Request has been failed', request);
  }

  /**
   * @param {RequestModel} request
   */
  onRequestSuccess(request: RequestModel) {
    this.log('Request has been completed', request);
  }

  /**
   * @param {RequestModel} request
   * @param {number} retriesDone
   */
  onRequestProgress(request: RequestModel, retriesDone: number) {
    this.log(`Request in progress: attempt ${retriesDone}`, request);
  }

  /**
   * Displays provided data in the console.
   * Saves logs if `this.#logger` exists.
   *
   * @param  {...any} data Data to be logged.
   * @returns {void}
   */
  log(...data: any[]): void {
    if (!this.#logger) return;
    this.#logger.log(...data);
  }

  /**
   * Saves queue with `QueueStoreManager`.
   *
   * @param {RequestModel[]} queue Queue to be stored.
   * @returns {void}
   */
  save(queue: RequestModel[]): void {
    if (!this.#storeManager) return;
    this.#storeManager.save(unlink(queue));
  }

  /**
   * Loads queue with `QueueStoreManager`.
   *
   * @returns {BaseStoreData[]}
   */
  load(): BaseStoreData[] | void | null {
    if (!this.#storeManager) return;
    return this.#storeManager.load();
  }

  /**
   * Restarts queue with `QueueStoreManager`.
   *
   * @returns {Promise<any[] | void>}
   */
  async restart(): Promise<any[] | void> {
    if (!this.#storeManager) return;
    return await this.#storeManager.restart();
  }
}
