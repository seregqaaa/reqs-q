import { unlink } from '../utils/helpers';

type Log = {
  [x: string]: any;
  timestamp: number;
};

type QueueLoggerParams = {
  logLimit?: number;
  saveLogs?: boolean;
  showLogs?: boolean;
};

/**
 * Queue Logger class.
 */
export class QueueLogger {
  /**
   * @type {Log[]}
   */
  #logs: Log[];
  /**
   * @type {number}
   */
  #logLimit: number;
  /**
   * @type {boolean}
   */
  #saveLogs: boolean;
  /**
   * @type {boolean}
   */
  #showLogs: boolean;

  /**
   * Creates new instance of `QueueLogger` class.
   *
   * @param {{
   *    logLimit?: number
   *    saveLogs?: boolean
   *    showLogs?: boolean
   * }} params `QueueLogger` parameters.
   */
  constructor(params: QueueLoggerParams = {}) {
    this.#logs = [];
    this.#logLimit = params.logLimit ?? 50;
    this.#saveLogs = params.saveLogs ?? false;
    this.#showLogs = params.showLogs ?? true;
  }

  /**
   * @returns {Record<string, any>[]}
   */
  get logs(): Log[] {
    return this.#logs;
  }

  /**
   * Displays provided data in the console.
   * Saves logs if `QueueLogger.#saveLogs` is enabled.
   *
   * @param  {...any} data Data to be logged.
   * @returns {void}
   */
  log(...data: any[]): void {
    const unlinkedData = unlink(data);
    const timestamp = Date.now();
    if (this.#showLogs) console.log(...unlinkedData, timestamp);
    if (!this.#saveLogs) return;
    const logObj: Log = Object.entries(unlinkedData).reduce(
      (logObj, [key, val]) => ({
        ...logObj,
        [key]: val,
      }),
      { timestamp },
    );
    if (this.#logs.length === this.#logLimit) {
      this.#logs.pop();
    }
    this.#logs.unshift(logObj);
  }
}
