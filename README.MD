# reqs-q

reqs-q is a simple and lightweight JavaScript library to help you control the
order of requests.

[Live example](https://seregqaaa.github.io/reqs-q/)

## Installation

```
npm install reqs-q
```

or

```
yarn add reqs-q
```

## Usage

- ### Base

  ```ts
  import { RequestsQueueCore } from 'reqs-q';

  const requestsQueue = new RequestsQueueCore();

  const myURL = 'baseUrl';
  const myEndpoints = ['firstEndpoint', 'secondEndpoint'];

  const results = myEndpoints.map(async endpoint => {
    const result = await requestsQueue.request(() =>
      fetch(`${myURL}/${endpoint}`).then(r => r.json()),
    );
    return result.response;
  });
  ```

- ### Advanced

  ```ts
  import {
    RequestsQueue,
    RequestModel,
    QueueLogger,
    QueueStoreManager,
    Stores,
    Priorities,
  } from 'reqs-q';

  function sendRequest(endpoint) {
    const newRequest = new RequestModel({
      callback: () => fetch(`${myURL}/${endpoint}`).then(r => r.json()),
      timeout: 5000,
      retryAfter: 2000,
      retriesCount: 3,
      priority: Priorities.high,
      storeData: {
        actionPath: sendRequest.name,
        args: [...arguments],
      },
    });

    requestsQueue.request(newRequest).then(console.log);
  }

  const myApiManager = {
    sendRequest,
  };
  const myURL = 'baseUrl';
  const myEndpoints = ['firstEndpoint', 'secondEndpoint'];

  const requestsQueue = new RequestsQueue({
    logger: new QueueLogger({ saveLogs: true, showLogs: false }),

    // using this feature may be not safe.
    storeManager: new QueueStoreManager({
      store: Stores.LocalStorage,
      restoreObject: myApiManager,
      showWarn: true,
    }),
  });

  for (const enpdoint of myEndpoints) {
    myApiManager.sendRequest(endpoint);
  }
  ```

## API

- #### `RequestsQueueCore`

  - ##### `RequestsQueueCore.constructor`

    - Creates new instance of `RequestsQueueCore`.
    - `RequestsQueueCore` parameters.
      ```ts
      showErrors?: boolean // default is true
      ```

  - ##### `RequestsQueueCore.prototype.request(request: RequestModel | (...args: any[]) => Promise<any>): Promise<RequestModel>`

    - Adds provided request to the queue.

  - ##### Lifecycle hooks.
    - ```ts
      // 1
      onRequestAdd(request: RequestModel) {}
      // 2
      beforeRequestHandle() {}
      // 3
      onRequestStartExecute(request: RequestModel) {}
      // 4
      onRequestProgress(request: RequestModel, retriesDone: number) {}
      // 5
      onRetry(request: RequestModel, retriesDone: number) {}
      // 6
      onRequestFail(request: RequestModel) {}
      onRequestSuccess(request: RequestModel) {}
      // 7
      onRequestDone(request: RequestModel) {}
      // 8
      afterRequestHandle() {}
      // 9
      onQueueEmpty() {}
      ```

- #### `RequestsQueue` (extends `RequestsQueueCore`)

  - ##### `RequestsQueue.constructor`

    - Creates new instance of `RequestsQueue`.
    - `RequestsQueue` parameters.
      ```ts
      logger?: QueueLogger // default is null
      storeManager?: QueueStoreManager // default is null
      showErrors?: boolean // default is true
      ```

  - ##### `RequestsQueue.prototype.queue: RequestsQueue[]`

    - Returns read-only requests queue.

  - ##### `RequestsQueue.prototype.logs: Log[]`

    - Returns read-only logs.

  - ##### `RequestsQueue.prototype.save(queue: RequestModel[]): void`

    - Saves queue with `QueueStoreManager`.

  - ##### `RequestsQueue.prototype.load(): BaseStoreData[]`

    - Loads queue with `QueueStoreManager`.

  - ##### `RequestsQueue.prototype.restart(): Promise<any[]>`

    - Restarts queue with `QueueStoreManager`.

- #### `RequestModel`

  - ##### `RequestModel.constructor`
    - Creates new request that can be submitted to the `RequestsQueue`.
    - `RequestModel` Constructor parameters.
      ```ts
      callback: () => Promise<any | void>
      callback: () => Promise<any>
      timeout?: number // default is 15000 (ms)
      priority?: Priorities | number // default is 1
      id?: number | string // default is random string
      retryAfter?: number | null // default is null
      retriesCount?: number | null // default is null
      storeData?: StoreData // can be used only with `QueueStoreManager`
      ```

- #### `QueueLogger`

  - ##### `QueueLogger.contructor`
    - `QueueLogger` constructor parameters.
      ```ts
      logLimit?: number // default is 50
      saveLogs?: boolean // default is false
      showLogs?: boolean // default is true
      ```
  - ##### `QueueLogger.prototype.logs: Log[]`
    - Returns saved logs.

- #### `QueueStoreManager`

  - ##### `QueueStoreManager.contructor`
    - `QueueStoreManager` constructor parameters.
      ```ts
      // Object whose methods should be called after the queue is restored.
      restoreObject?: Record<string, any>
      store?: Stores // default is 'localStorage'
      showWarn?: boolean // default is true
      shouldEncode?: boolean // default is true
      ```
  - ##### `QueueStoreManager.prototype.save(queue: RequestModel[]): void`

    - Saves queue to chosen storage.

  - ##### `QueueStoreManager.prototype.load(): { actionPath: string, args: any[] }[]`

    - Loads queue from chosen storage.

  - ##### `QueueStoreManager.prototype.restart(): Promise<any[]>`
    - Loads queue from storage and restarts it.

## License

[MIT](https://choosealicense.com/licenses/mit/)
