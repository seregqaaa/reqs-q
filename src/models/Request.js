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
   *    id?: number|string
   *    timeout?: number
   *    retryAfter?: number | null
   *    retriesCount?: number | null
   *    priority?: number
   *    response?: Record<string, any> | null
   *    status?: string
   *    errors?: any[]
   *    timestamps?: Timestamps
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
    this.response = props.response ?? null;
    this.status = props.status ?? requestsStatuses.waiting;
    this.id = props.id ?? getRandomString();
    this.timeout = props.timeout ?? 15_000;
    this.retryAfter = props.retryAfter ?? null;
    this.retriesCount = props.retriesCount ?? null;
    this.priority = props.priority ?? priorities.low;
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
