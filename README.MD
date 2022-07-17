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

  const yourURL = 'baseUrl';
  const yourEndpoints = ['firstEndpoint', 'secondEndpoint'];

  const results = yourEndpoints.map(async endpoint => {
    const request = new RequestModel({
      callback: () => fetch(`${yourURL}/${endpoint}`).then(r => r.json()),
    });

    const result = await requestsQueue.request(request);
    return result.response;
  });
  ```

- ### Advanced

  ```js
  import { RequestsQueue, RequestModel, QueueLogger } from 'reqs-q';

  const requestsQueue = new RequestsQueue({
    logger: new QueueLogger({ saveLogs: true }),
  });

  const yourURL = 'baseUrl';
  const yourEndpoints = ['firstEndpoint', 'secondEndpoint'];

  const results = yourEndpoints.map(async endpoint => {
    const request = new RequestModel({
      callback: () => fetch(`${yourURL}/${endpoint}`).then(r => r.json()),
      timeout: 5000,
      retryAfter: 2000,
      retriesCount: 3,
      priority: 4,
    });

    const result = await requestsQueue.request(request);
    return result.response;
  });
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
