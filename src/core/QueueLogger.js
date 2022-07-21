import { unlink } from '../utils/helpers.js';

/**
 * Queue Logger class.
 */
export class QueueLogger {
  /**
   * @type {Record<string, any>[]}
   */
  #logs;
  /**
   * @type {number}
   */
  #logLimit;
  /**
   * @type {boolean}
   */
  #saveLogs;
  /**
   * @type {boolean}
   */
  #showLogs;

  /**
   * Creates new instance of `QueueLogger` class.
   *
   * @param {{
   *    logLimit?: number
   *    saveLogs?: boolean
   *    showLogs?: boolean
   * }} params `QueueLogger` parameters.
   */
  constructor(params = {}) {
    this.#logs = [];
    this.#logLimit = params.logLimit ?? 50;
    this.#saveLogs = params.saveLogs ?? false;
    this.#showLogs = params.showLogs ?? true;
  }

  /**
   * @returns {Record<string, any>[]}
   */
  get logs() {
    return this.#logs;
  }

  /**
   * Displays provided data in the console.
   * Saves logs if `QueueLogger.#saveLogs` is enabled.
   *
   * @param  {...any} data Data to be logged.
   * @returns {void}
   */
  log(...data) {
    const unlinkedData = unlink(data);
    const timestamp = Date.now();
    if (this.#showLogs) console.log(...unlinkedData, timestamp);
    if (!this.#saveLogs) return;
    const logObj = Object.entries(unlinkedData).reduce(
      (logObj, [key, val]) => ({
        ...logObj,
        [key]: val,
      }),
      {},
    );
    logObj.timestamp = timestamp;
    if (this.#logs.length === this.#logLimit) {
      this.#logs.pop();
    }
    this.#logs.unshift(logObj);
  }
}
