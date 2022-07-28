export declare type Log = {
    [x: string]: any;
    timestamp: number;
};
declare type QueueLoggerParams = {
    logLimit?: number;
    saveLogs?: boolean;
    showLogs?: boolean;
};
/**
 * Queue Logger class.
 */
export declare class QueueLogger {
    #private;
    /**
     * Creates new instance of `QueueLogger` class.
     *
     * @param {{
     *    logLimit?: number
     *    saveLogs?: boolean
     *    showLogs?: boolean
     * }} params `QueueLogger` parameters.
     */
    constructor(params?: QueueLoggerParams);
    /**
     * @returns {Record<string, any>[]}
     */
    get logs(): Log[];
    /**
     * Displays provided data in the console.
     * Saves logs if `QueueLogger.#saveLogs` is enabled.
     *
     * @param  {...any} data Data to be logged.
     * @returns {void}
     */
    log(...data: any[]): void;
}
export {};
//# sourceMappingURL=QueueLogger.d.ts.map