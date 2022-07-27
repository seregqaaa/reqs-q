import { priorities, requestsStatuses } from '../global/constants';
import { getRandomString } from '../utils/string';

/**
 *  Request model.
 */
export class RequestModel {
  /**
   * Creates new instance of `RequestModel` class.
   *
   * @param {{
   *    callback: () => Promise<any>
   *    timeout?: number
   *    priority?: number
   *    id?: number|string
   *    retryAfter?: number | null
   *    retriesCount?: number | null
   *    storeData?: {
   *      actionPath: string
   *      args: any[]
   *      storageDuration?: number
   *    }
   * }} params Request parameters.
   */
  constructor(params = { callback: () => ({}) }) {
    if (!params.callback) {
      throw new Error('Required parameter "callback" was not provided');
    }

    // self
    this.done = null;
    this.timestamps = new Timestamps(params.timestamps);
    this.timestamps.createdAt = Date.now();

    // required
    this.callback = params.callback;

    // not-required
    this.errors = params.errors ?? [];
    this.timeout = params.timeout ?? 15_000;
    this.response = params.response ?? null;
    this.id = params.id ?? getRandomString();
    this.retryAfter = params.retryAfter ?? null;
    this.retriesCount = params.retriesCount ?? null;
    this.storeData = params.storeData ?? {};
    this.priority = params.priority ?? priorities.low;
    this.status = params.status ?? requestsStatuses.waiting;

    this.storeData.storageDuration = this.storeData.storageDuration
      ? this.storeData.storageDuration
      : 1000 * 60 * 60;
  }
}

class Timestamps {
  /**
   *
   * @param {{
   *    createdAt: null|number|Date
   *    startedAt: null|number|Date
   *    doneAt: null|number|Date
   * }} props
   */
  constructor(props) {
    this.createdAt = props?.createdAt ?? null;
    this.startedAt = props?.startedAt ?? null;
    this.doneAt = props?.doneAt ?? null;
  }
}

export const notRequestInstanceError = new Error(
  'Expected to get instance of Request',
);
