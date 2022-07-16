/**
 * Requests with high priority will be added to the front of queue.
 */
export const priorities = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * All possible requests statuses.
 */
export const requestsStatuses = {
  waiting: 'WAITING',
  inProgress: 'IN_PROGRESS',
  done: 'DONE',
};

export const ERR_TIMEOUT = 'ERR_TIMEOUT';
