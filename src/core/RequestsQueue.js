// Constants
import {
  ERR_TIMEOUT,
  ERR_UNKNOWN_NETWORK_ERROR,
  requestsStatuses,
} from '../global/constants.js';

// Models
import { notRequestInstanceError, RequestModel } from '../models/Request.js';

/**
 * Requests queue class.
 */
export class RequestsQueue {
  static showErrors = true;
  static showLogs = false;
  static saveLogs = false;
  static logLimit = 50;

  static #readOnlyError = new Error('Requests queue is read-only');

  /**
   * @type {RequestsQueue}
   */
  static #instance;

  /**
   * @type {RequestModel[]}
   */
  #queue;
  /**
   * @type {string[]}
   */
  #allowedPropNames;
  /**
   * @type {any[]}
   */
  #logs;

  /**
   * Returns an instance of the Requests Queue, or creates one if not already
   * created.
   */
  constructor() {
    this.#queue = [];
    this.#logs = [];
    this.#allowedPropNames = ['length'];
    this.isQueueBusy = false;

    if (!RequestsQueue.#instance) {
      RequestsQueue.#instance = this;
      this.#log('Requests Queue initialized');
    }
    return RequestsQueue.#instance;
  }

  // Getters
  /**
   * @returns {RequestModel[]} Read-only requests queue.
   */
  get queue() {
    return new Proxy(this.#queue, {
      get: (queue, propName) => {
        if (this.#allowedPropNames.includes(propName)) {
          return queue[propName];
        }
        throw RequestsQueue.#readOnlyError;
      },
      set: () => {
        throw RequestsQueue.#readOnlyError;
      },
    });
  }

  // Methods

  /**
   * Adds provided request to the queue.
   *
   * @param {RequestModel} request Request to be added to queue.
   * @returns {Promise<RequestModel>}
   */
  request(request) {
    const isRequest = request instanceof RequestModel;
    if (!isRequest) throw notRequestInstanceError;
    const promise = new Promise(r => {
      request.done = r;
    });
    this.#queue.push(request);
    this.#log('Request has been added to the queue', request);
    if (!this.isQueueBusy) this.#handleQueue();
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
      this.isQueueBusy = false;
      this.#log('Queue is empty, waiting for new requests...');
      return;
    }

    this.isQueueBusy = true;
    queue.sort((a, b) => b.priority - a.priority);

    this.#log('Queue has been sorted by request priority', queue);

    const currentRequest = queue.shift();
    await this.#handleRequest(currentRequest);

    if (queue.length > 0) {
      this.#log(
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

    this.#log('New request starts executing', request);

    const response = await this.#getResponse(request);
    request.timestamps.doneAt = Date.now();
    request.status = requestsStatuses.done;
    request.response = response;
    request.done(request);
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
      this.#log(`Retrying: attempt ${retriesDone}`, request);
    } else {
      this.#log(
        `Request has been ${response.isError ? 'failed' : 'completed'}`,
        request,
      );
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
    this.#log(`Request in progress: attempt ${retriesDone}`, request);

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
      if (RequestsQueue.showErrors) {
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

  /**
   * Displays provided data in the console.
   * Saves logs if `RequestsQueue.saveLogs` is enabled.
   *
   * @param  {...any} data Data to be logged.
   * @returns {void}
   */
  #log(...data) {
    if (!RequestsQueue.showLogs) return;
    const unlinkedData = JSON.parse(JSON.stringify(data));
    const timestamp = Date.now();
    console.log(...unlinkedData, timestamp);
    if (!RequestsQueue.saveLogs) return;
    const logObj = Object.entries(unlinkedData).reduce(
      (logObj, [key, val]) => ({
        ...logObj,
        [key]: val,
      }),
      {},
    );
    logObj.timestamp = timestamp;
    if (this.#logs.length + 1 === RequestsQueue.logLimit) {
      this.#logs.pop();
    }
    this.#logs.unshift(logObj);
  }
}
