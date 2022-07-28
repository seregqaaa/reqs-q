import { StoreData } from '../core/QueueStoreManager';

import { Priorities, RequestsStatuses } from '../global/constants';

import { getRandomString } from '../utils/string';

export type RequestModelError = {
  isError: true;
  retriesDone: number;
  details: Error | unknown;
  timestamp: Date | number;
};

type RequestModelParams = {
  callback: () => Promise<any | void>;
  retriesCount?: number;
  id?: string | number;
  retryAfter?: number;
  timeout?: number;
  done?: null | ((request: RequestModel) => Promise<any | void>);
  response?: Record<string, any> | null;
  status?: RequestsStatuses;
  timestamps?: Timestamps;
  storeData?: StoreData;
  priority?: Priorities;
  errors?: RequestModelError[];
};

/**
 *  Request model.
 */
export class RequestModel {
  public done: null | ((request: RequestModel) => Promise<any | void>);
  public timestamps: Timestamps;
  public callback: () => Promise<any | void>;
  public errors: RequestModelError[];
  public timeout: number;
  public response: Record<string, any> | null;
  public retriesCount: number | null;
  public retryAfter: number | null;
  public id: string | number;
  public storeData: StoreData;
  public priority: Priorities;
  public status: RequestsStatuses;

  /**
   * Creates new instance of `RequestModel` class.
   *
   * @param {{
   *    callback: () => Promise<any | void>
   *    timeout?: number
   *    priority?: Priorities
   *    id?: number | string
   *    retryAfter?: number | null
   *    retriesCount?: number | null
   *    storeData?: StoreData
   * }} params Request parameters.
   */
  constructor(
    params: RequestModelParams = { callback: () => Promise.resolve() },
  ) {
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
    this.storeData = params.storeData ?? <StoreData>{};
    this.priority = params.priority ?? Priorities.Low;
    this.status = params.status ?? RequestsStatuses.Waiting;

    this.storeData.storageDuration = this.storeData.storageDuration
      ? this.storeData.storageDuration
      : 1000 * 60 * 60;
  }
}

type TimestampsParams =
  | {
      createdAt: null | number | Date;
      startedAt: null | number | Date;
      doneAt: null | number | Date;
    }
  | undefined;

class Timestamps {
  createdAt: number | null | Date;
  startedAt: number | null | Date;
  doneAt: number | null | Date;
  /**
   *
   * @param {{
   *    createdAt: null|number|Date
   *    startedAt: null|number|Date
   *    doneAt: null|number|Date
   * }} props
   */
  constructor(props: TimestampsParams) {
    this.createdAt = props?.createdAt ?? null;
    this.startedAt = props?.startedAt ?? null;
    this.doneAt = props?.doneAt ?? null;
  }
}

export const notRequestInstanceError = new Error(
  'Expected to get instance of Request',
);
