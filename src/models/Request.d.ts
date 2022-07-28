import { StoreData } from '../core/QueueStoreManager';
import { Priorities, RequestsStatuses } from '../global/constants';
export declare type RequestModelError = {
    isError: true;
    retriesDone: number;
    details: Error | unknown;
    timestamp: Date | number;
};
interface RequestModelParams {
    callback: () => Promise<any | void>;
    retriesCount?: number | null;
    retryAfter?: number | null;
    id?: string | number;
    timeout?: number;
    done?: null | ((request: RequestModel) => Promise<any | void>);
    response?: Record<string, any> | null;
    status?: RequestsStatuses;
    timestamps?: Timestamps;
    storeData?: StoreData;
    priority?: Priorities;
    errors?: RequestModelError[];
}
/**
 *  Request model.
 */
export declare class RequestModel implements RequestModelParams {
    done: null | ((request: RequestModel) => Promise<any | void>);
    timestamps: Timestamps;
    callback: () => Promise<any | void>;
    errors: RequestModelError[];
    timeout: number;
    response: Record<string, any> | null;
    retriesCount: number | null;
    retryAfter: number | null;
    id: string | number;
    storeData: StoreData;
    priority: Priorities;
    status: RequestsStatuses;
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
    constructor(params?: RequestModelParams);
}
interface ITimestamps {
    createdAt: null | number | Date;
    startedAt: null | number | Date;
    doneAt: null | number | Date;
}
declare type TimestampsParams = ITimestamps | undefined;
declare class Timestamps implements ITimestamps {
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
    constructor(props: TimestampsParams);
}
export declare const notRequestInstanceError: Error;
export {};
//# sourceMappingURL=Request.d.ts.map