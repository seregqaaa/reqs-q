# reqs-q

reqs-q is a simple and lightweight JavaScript library to help you control the
order of requests.

## Installation

```
npm install reqs-q
```

## Usage

- ### Base

  ```js
  import { RequestsQueueCore } from 'reqs-q';

  const requestsQueue = new RequestsQueueCore();

  const myURL = 'baseUrl';
  const myEndpoints = ['firstEndpoint', 'secondEndpoint'];

  const results = myEndpoints.map(async endpoint => {
    const request = new RequestModel({
      callback: () => fetch(`${myURL}/${endpoint}`).then(r => r.json()),
    });

    const result = await requestsQueue.request(request);
    return result.response;
  });
  ```

- ### Advanced

  ```js
  import {
    RequestsQueue,
    RequestModel,
    QueueLogger,
    QueueStoreManager,
    stores,
  } from 'reqs-q';

  function sendRequest(endpoint) {
    const newRequest = new RequestModel({
      callback: () => fetch(`${myURL}/${endpoint}`).then(r => r.json()),
      timeout: 5000,
      retryAfter: 2000,
      retriesCount: 3,
      priority: 4,
      propsToStore: {
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
    logger: new QueueLogger({ saveLogs: true, showLogs: true }),

    // using this feature may be not safe.
    storeManager: new QueueStoreManager({
      store: stores.localStorage,
      restoreObject: myApiManager,
      showWarn: true,
    }),
  });

  for (const enpdoint of myEndpoints) {
    myApiManager.sendRequest(endpoint);
  }
  ```

## API

- #### `RequestsQueue.prototype.request(request: RequestModel): Promise<RequestModel>`

  - Adds provided request to the queue.

- #### `RequestsQueue.prototype.queue: RequestsQueue[]`

  - Returns read-only requests queue.

- #### `RequestsQueue.prototype.logs: Record<string, any>[]`

  - Returns read-only logs.

## License

[MIT](https://choosealicense.com/licenses/mit/)
