import { decodeb64, encodeb64 } from '../utils/b64';
import { getDeepField } from '../utils/object';

import { RequestModel } from '../models/Request';

export const enum Stores {
  LocalStorage = 'localStorage',
}
export type BaseStoreData = {
  actionPath: string;
  args: any[];
};

export type StoreData = BaseStoreData & { storageDuration: number };

type LoadedStoreData = StoreData & { timestamp: number };

type QueueStoreManagerParams = {
  restoreObject?: Record<string, any>;
  store?: Stores;
  showWarn?: boolean;
  shouldEncode?: boolean;
};

/**
 * Queue Store Manager class.
 */
export class QueueStoreManager {
  static LOCAL_STORAGE_KEY = `__reqs-q-v1.2.0__`;

  /**
   * @type {Stores}
   */
  #store: Stores;
  #restoreObject: Record<string, any> | null;
  /**
   * @type {boolean}
   */
  #showWarn: boolean;
  /**
   * @type {boolean}
   */
  #shouldEncode: boolean;

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
  constructor(params: QueueStoreManagerParams = {}) {
    this.#store = params.store ?? Stores.LocalStorage;
    this.#restoreObject = params.restoreObject ?? null;
    this.#showWarn = params.showWarn ?? true;
    this.#shouldEncode = params.shouldEncode ?? true;
  }

  /**
   * Saves queue to chosen storage.
   *
   * @param {RequestModel[]} queue
   */
  save(queue: RequestModel[]) {
    switch (this.#store) {
      case Stores.LocalStorage:
        this.#saveToLocalStorage(queue);
        break;
      default:
        return null;
    }
  }

  /**
   * Loads queue from chosen storage.
   *
   * @returns {BaseStoreData[]}
   */
  load(): BaseStoreData[] | null {
    switch (this.#store) {
      case Stores.LocalStorage:
        return this.#loadFromLocalStorage();
      default:
        return null;
    }
  }

  /**
   * Loads queue from storage and restarts it.
   */
  async restart(): Promise<any[] | void> {
    const restoreObject = this.#restoreObject;
    if (!restoreObject) return;
    const actions = this.load();
    if (!actions) return;
    const promises = actions.map(async ({ actionPath, args }) => {
      const field = getDeepField(restoreObject, actionPath);
      const isFn = typeof field === 'function';
      if (!isFn) {
        console.error('Incorrect field type', { actionPath, args, field });
      }
      return isFn ? await field(...args) : field;
    });
    const results = await Promise.all(promises);
    this.save([]);
    return results;
  }

  /**
   * Saves queue to local storage.
   *
   * @param {RequestModel[]} rawQueue Queue to be stored.
   */
  #saveToLocalStorage(rawQueue: RequestModel[]) {
    const queue = this.#prepareForStore(rawQueue);
    localStorage.setItem(QueueStoreManager.LOCAL_STORAGE_KEY, queue);
  }

  /**
   * Gets queue from local storage and decodes queue string from base64.
   * Also deletes expired elements from array.
   *
   * @returns {BaseStoreData[]}
   */
  #loadFromLocalStorage(): BaseStoreData[] {
    const localStorageQueue =
      localStorage.getItem(QueueStoreManager.LOCAL_STORAGE_KEY) ??
      (this.#shouldEncode ? encodeb64('[]') : '[]');
    const decodedQueue = this.#shouldEncode
      ? decodeb64(localStorageQueue)
      : localStorageQueue;
    const parsedQueue: LoadedStoreData[] = JSON.parse(decodedQueue);
    const filteredQueue = parsedQueue.filter(
      item => item.timestamp + item.storageDuration >= Date.now(),
    );
    const mappedQueue: BaseStoreData[] = filteredQueue.map(item => ({
      actionPath: item.actionPath,
      args: this.#checkArgsSafety(item.args),
    }));
    return mappedQueue;
  }

  /**
   * Stringifies queue and encodes to base64 string.
   *
   * @param {RequestModel[]} queue
   */
  #prepareForStore(queue: RequestModel[]): string {
    const mappedQueue = queue.map(r => ({
      ...r.storeData,
      args: this.#checkArgsSafety(r.storeData.args ?? []),
      timestamp: Date.now(),
    }));
    const filteredQueue = mappedQueue.filter(item => Boolean(item.actionPath));
    const stringifiedQueue = JSON.stringify(filteredQueue);
    const encodedQueue = this.#shouldEncode
      ? encodeb64(stringifiedQueue)
      : stringifiedQueue;
    return encodedQueue;
  }

  /**
   * Checks action arguments for safety.
   *
   * @param {any[]} args Arguments to be checked.
   */
  #checkArgsSafety(args: any[]) {
    return this.#showWarn
      ? args.map(arg => {
          try {
            new URL(arg);
            console.warn(`Saving argument "${arg}" may be not safe`);
          } catch (_) {
          } finally {
            return arg;
          }
        })
      : args;
  }
}
