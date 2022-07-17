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
   * Creates new instance of `QueueLogger` class.
   *
   * @param {{
   *  logLimit?: number
   *  saveLogs?: boolean
   * }} props
   */
  constructor(props = {}) {
    this.#logs = [];
    this.#logLimit = props.logLimit ?? 50;
    this.#saveLogs = props.saveLogs ?? false;
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
    console.log(...unlinkedData, timestamp);
    if (!this.saveLogs) return;
    const logObj = Object.entries(unlinkedData).reduce(
      (logObj, [key, val]) => ({
        ...logObj,
        [key]: val,
      }),
      {},
    );
    logObj.timestamp = timestamp;
    if (this.#logs.length === logLimit) {
      this.#logs.pop();
    }
    this.#logs.unshift(logObj);
  }
}
