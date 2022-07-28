import { RequestModel } from '../models/Request.js';
import { Log, QueueLogger } from './QueueLogger';
import { QueueStoreManager, BaseStoreData } from './QueueStoreManager';
declare type RequestsQueueCoreParams = {
    showErrors?: boolean;
};
/**
 * Core class of Requests Queue.
 */
export declare class RequestsQueueCore {
    #private;
    /**
     * Creates new instance of `RequestsQueueCore` class.
     *
     * @param {
     *    showErrors?: boolean
     * } params `RequestsQueueCore` parameters.
     */
    constructor(params: RequestsQueueCoreParams);
    /**
     * @returns {RequestModel[]} Read-only requests queue.
     */
    protected get _queue(): RequestModel[];
    /**
     * @returns {RequestModel[]} Read-only requests queue.
     */
    get queue(): RequestModel[];
    /**
     * Adds provided request to the queue.
     *
     * @param {RequestModel | ((...args: any[]) => Promise<any | void>)} rawRequest Request to be added to queue.
     * @returns {Promise<RequestModel>}
     */
    request(rawRequest: RequestModel | ((...args: any[]) => Promise<any | void>)): Promise<RequestModel>;
    /**
     * @param {RequestModel} request
     */
    protected onRequestAdd(request: RequestModel): void;
    protected beforeRequestHandle(): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestStartExecute(request: RequestModel): void;
    /**
     * @param {RequestModel} request
     * @param {number} retriesDone
     */
    protected onRequestProgress(request: RequestModel, retriesDone: number): void;
    /**
     * @param {RequestModel} request
     * @param {number} retriesDone
     */
    protected onRetry(request: RequestModel, retriesDone: number): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestFail(request: RequestModel): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestSuccess(request: RequestModel): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestDone(request: RequestModel): void;
    protected afterRequestHandle(): void;
    protected onQueueEmpty(): void;
}
declare type RequestsQueueParams = {
    logger?: QueueLogger;
    storeManager?: QueueStoreManager;
    showErrors?: boolean;
};
/**
 * Requests queue class.
 */
export declare class RequestsQueue extends RequestsQueueCore {
    #private;
    /**
     * Creates new instance of `RequestsQueue` class.
     *
     * @param {{
     *    logger?: QueueLogger
     *    storeManager?: QueueStoreManager
     *    showErrors?: boolean
     * }} params `RequestsQueue` parameters.
     */
    constructor(params?: RequestsQueueParams);
    /**
     * @returns {Record<string, any>[]} Read-only logs.
     */
    get logs(): Log[];
    /**
     * Saves queue when request added.
     *
     * @param {RequestModel} request
     */
    protected onRequestAdd(request: RequestModel): void;
    /**
     * Saves queue after request handled.
     */
    protected afterRequestHandle(): void;
    protected onQueueEmpty(): void;
    protected beforeRequestHandle(): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestStartExecute(request: RequestModel): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestDone(request: RequestModel): void;
    /**
     * @param {RequestModel} request
     * @param {number} retriesDone
     */
    protected onRetry(request: RequestModel, retriesDone: number): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestFail(request: RequestModel): void;
    /**
     * @param {RequestModel} request
     */
    protected onRequestSuccess(request: RequestModel): void;
    /**
     * @param {RequestModel} request
     * @param {number} retriesDone
     */
    protected onRequestProgress(request: RequestModel, retriesDone: number): void;
    /**
     * Displays provided data in the console.
     * Saves logs if `this.#logger` exists.
     *
     * @param  {...any} data Data to be logged.
     * @returns {void}
     */
    protected log(...data: any[]): void;
    /**
     * Saves queue with `QueueStoreManager`.
     *
     * @param {RequestModel[]} queue Queue to be stored.
     * @returns {void}
     */
    protected save(queue: RequestModel[]): void;
    /**
     * Loads queue with `QueueStoreManager`.
     *
     * @returns {BaseStoreData[]}
     */
    load(): BaseStoreData[] | void | null;
    /**
     * Restarts queue with `QueueStoreManager`.
     *
     * @returns {Promise<any[] | void>}
     */
    restart(): Promise<any[] | void>;
}
export {};
//# sourceMappingURL=RequestsQueue.d.ts.map