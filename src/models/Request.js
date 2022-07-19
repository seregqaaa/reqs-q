import { priorities, requestsStatuses } from '../global/constants.js';
import { getRandomString } from '../utils/string.js';

/**
 *  Request model.
 */
export class RequestModel {
  /**
   * Creates new instance of `RequestModel` class.
   *
   * @param {{
   *    callback: Promise<Function>
   *    errors?: any[]
   *    status?: string
   *    timeout?: number
   *    priority?: number
   *    id?: number|string
   *    timestamps?: Timestamps
   *    retryAfter?: number | null
   *    retriesCount?: number | null
   *    response?: Record<string, any> | null
   *    propsToStore?: {
   *      actionPath: string
   *      args: any[]
   *      storageDuration?: number
   *    }
   * }} props Request parameters.
   */
  constructor(props = { callback: () => ({}) }) {
    // self
    this.done = null;
    this.timestamps = new Timestamps(props.timestamps);
    this.timestamps.createdAt = Date.now();

    // required
    this.callback = props.callback;

    // not-required
    this.errors = props.errors ?? [];
    this.timeout = props.timeout ?? 15_000;
    this.response = props.response ?? null;
    this.id = props.id ?? getRandomString();
    this.retryAfter = props.retryAfter ?? null;
    this.retriesCount = props.retriesCount ?? null;
    this.propsToStore = props.propsToStore ?? {};
    this.priority = props.priority ?? priorities.low;
    this.status = props.status ?? requestsStatuses.waiting;

    this.propsToStore.storageDuration = this.propsToStore.storageDuration
      ? this.propsToStore.storageDuration
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
