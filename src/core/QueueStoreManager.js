import { decodeb64, encodeb64 } from '../utils/b64.js';
import { getDeepField } from '../utils/object.js';

export const stores = {
  localStorage: 'localStorage',
};

/**
 * Queue Store Manager class.
 */
export class QueueStoreManager {
  static LOCAL_STORAGE_KEY = '__reqs-q-v0.1.5__';

  /**
   * @type {keyof stores}
   */
  #store;
  #restoreObject;

  /**
   * Creates new instance of `QueueStoreManager` class.
   *
   * @param {{
   *    restoreObject: any
   *    store?: keyof stores,
   * }} params `QueueStoreManager` parameters.
   */
  constructor(params = {}) {
    this.#store = params.store ?? stores.localStorage;
    this.#restoreObject = params.restoreObject ?? null;
  }

  /**
   * Saves queue to chosen storage.
   *
   * @param {RequestModel[]} queue
   */
  save(queue) {
    switch (this.#store) {
      case stores.localStorage:
        this.#saveToLocalStorage(queue);
        break;
      default:
        return null;
    }
  }

  /**
   * Loads queue from chosen storage.
   *
   * @returns {{ actionPath: string, args: any[] }[]}
   */
  load() {
    switch (this.#store) {
      case stores.localStorage:
        return this.#loadFromLocalStorage();
      default:
        return null;
    }
  }

  /**
   * Loads queue from storage and restarts it.
   */
  async restart() {
    if (!this.#restoreObject) return;
    const actions = this.load();
    const promises = actions.map(
      async ({ actionPath, args }) =>
        await getDeepField(this.#restoreObject, actionPath)(...args),
    );
    const results = await Promise.all(promises);
    this.save([]);
    return results;
  }

  /**
   * Saves queue to local storage.
   *
   * @param {RequestModel[]} rawQueue Queue to be stored.
   */
  #saveToLocalStorage(rawQueue) {
    const queue = this.#prepareForStore(rawQueue);
    localStorage.setItem(QueueStoreManager.LOCAL_STORAGE_KEY, queue);
  }

  /**
   * Gets queue from local storage and decodes queue string from base64.
   * Also deletes expired elements from array.
   *
   * @returns {{ actionPath: string, args: any[] }[]}
   */
  #loadFromLocalStorage() {
    const localStorageQueue =
      localStorage.getItem(QueueStoreManager.LOCAL_STORAGE_KEY) ?? '[]';
    const decodedQueue = decodeb64(localStorageQueue);
    const parsedQueue = JSON.parse(decodedQueue);
    const filteredQueue = parsedQueue.filter(
      item => item.timestamp + item.storageDuration >= Date.now(),
    );
    const mappedQueue = filteredQueue.map(item => ({
      actionPath: item.actionPath,
      args: item.args,
    }));
    return mappedQueue;
  }

  /**
   * Stringifies queue and encodes to base64 string.
   *
   * @param {RequestModel[]} queue
   */
  #prepareForStore(queue) {
    const mappedQueue = queue.map(r => ({
      ...r.propsToStore,
      timestamp: Date.now(),
    }));
    const filteredQueue = mappedQueue.filter(
      item => Object.keys(item).length > 2,
    );
    const stringifiedQueue = JSON.stringify(filteredQueue);
    const encodedQueue = encodeb64(stringifiedQueue);
    return encodedQueue;
  }
}
