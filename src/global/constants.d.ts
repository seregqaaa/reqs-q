/**
 * Requests with high priority will be added to the front of queue.
 */
export declare const enum Priorities {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}
/**
 * All possible requests statuses.
 */
export declare const enum RequestsStatuses {
    Waiting = "WAITING",
    InProgress = "IN_PROGRESS",
    Done = "DONE"
}
export declare const ERR_TIMEOUT = "ERR_TIMEOUT";
export declare const ERR_UNKNOWN_NETWORK_ERROR = "ERR_UNKNOWN_NETWORK_ERROR";
//# sourceMappingURL=constants.d.ts.map