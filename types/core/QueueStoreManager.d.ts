import { RequestModel } from '../models/Request';
export declare const enum Stores {
    LocalStorage = "localStorage"
}
export declare type BaseStoreData = {
    actionPath: string;
    args: any[];
};
export declare type StoreData = BaseStoreData & {
    storageDuration: number;
};
declare type QueueStoreManagerParams = {
    restoreObject?: Record<string, any>;
    store?: Stores;
    showWarn?: boolean;
    shouldEncode?: boolean;
};
/**
 * Queue Store Manager class.
 */
export declare class QueueStoreManager {
    #private;
    static LOCAL_STORAGE_KEY: string;
    /**
     * Creates new instance of `QueueStoreManager` class.
     *
     * @param {{
     *    restoreObject?: any
     *    store?: keyof stores
     *    showWarn?: boolean
     *    shouldEncode?: boolean
     * }} params `QueueStoreManager` parameters.
     */
    constructor(params?: QueueStoreManagerParams);
    /**
     * Saves queue to chosen storage.
     *
     * @param {RequestModel[]} queue
     */
    save(queue: RequestModel[]): null | undefined;
    /**
     * Loads queue from chosen storage.
     *
     * @returns {BaseStoreData[]}
     */
    load(): BaseStoreData[] | null;
    /**
     * Loads queue from storage and restarts it.
     */
    restart(): Promise<any[] | void>;
}
export {};
//# sourceMappingURL=QueueStoreManager.d.ts.map