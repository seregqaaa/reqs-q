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
class RequestsQueue {
  /**
   * @type {RequestModel[]}
   */
  #queue;
  /**
   * @type {string[]}
   */
  #allowedPropNames;

  /**
   * Creates new instance of `RequestsQueue` class.
   */
  constructor() {
    this.#queue = [];
    this.#allowedPropNames = ['length'];
    this.readOnlyError = new Error('Requests queue is read-only');
    this.isQueueBusy = false;
  }

  // Getters
  get queue() {
    return new Proxy(this.#queue, {
      get: (queue, propName) => {
        if (this.#allowedPropNames.includes(propName)) {
          return queue[propName];
        }
        throw this.readOnlyError;
      },
      set: () => {
        throw this.readOnlyError;
      },
    });
  }

  // Methods

  /**
   * Performs provided request.
   *
   * @param {RequestModel} request Request to be performed.
   * @returns {Promise<RequestModel>}
   */
  request(request) {
    const isRequest = request instanceof RequestModel;
    if (!isRequest) throw notRequestInstanceError;
    const promise = new Promise(r => {
      request.done = r;
    });
    this.#queue.push(request);
    if (!this.isQueueBusy) this.#handleQueue();
    return promise;
  }

  /**
   *
   */
  async #handleQueue() {
    const queue = this.#queue;
    if (queue.length === 0) {
      this.isQueueBusy = false;
      return;
    }

    this.isQueueBusy = true;
    queue.sort((a, b) => b.priority - a.priority);
    const currentRequest = queue.shift();
    await this.#handleRequest(currentRequest);
    return this.#handleQueue();
  }

  /**
   *
   * @param {RequestModel} request
   */
  async #handleRequest(request) {
    request.timestamps.startedAt = Date.now();
    const response = await this.#getResponse(request);
    request.timestamps.doneAt = Date.now();
    request.status = requestsStatuses.done;
    request.response = response;
    request.done(request);
  }

  /**
   *
   * @param {RequestModel} request
   * @param {number} retriesDone
   * @returns
   */
  async #getResponse(request, retriesDone = 0) {
    const shouldRetry =
      request.retryAfter !== null && request.retriesCount !== null;
    const retryAfter = shouldRetry ? retriesDone * request.retryAfter : 0;
    const response = await new Promise(resolve =>
      setTimeout(
        async () => resolve(await this.#makeRequest(request, retriesDone)),
        retryAfter,
      ),
    );
    return shouldRetry && response.isError && retriesDone < request.retriesCount
      ? await this.#getResponse(request, retriesDone + 1)
      : response;
  }

  /**
   *
   * @param {RequestModel} request
   * @param {number} retriesDone
   * @returns
   */
  async #makeRequest(request, retriesDone = 0) {
    try {
      const result = await Promise.race([
        request.callback(),
        this.#throwTimeout(request.timeout),
      ]);
      if (
        !result ||
        result === ERR_TIMEOUT ||
        !(result.status && result.status >= 200 && result.status <= 299)
      ) {
        throw (
          (result instanceof Response ? result.statusText : result) ||
          ERR_UNKNOWN_NETWORK_ERROR
        );
      }
      return result;
    } catch (e) {
      console.error(e);
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

  #throwTimeout(timeout) {
    return new Promise((_, r) => setTimeout(() => r('ERR_TIMEOUT'), timeout));
  }
}

export const requestsQueue = new RequestsQueue();
