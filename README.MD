# reqs-q

reqs-q is a simple and lightweight JavaScript library to help you control the
order of requests.

## Installation

```
npm install reqs-q
```

## Usage

```js
import { RequestsQueue, RequestModel } from 'reqs-q';

const yourURL = 'baseUrl';
const yourEndpoints = ['firstEndpoint', 'secondEndpoint'];

RequestsQueue.showLogs = true;
const requestsQueue = new RequestsQueue();

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

- #### `RequestsQueue.showLogs: boolean`

  - Indicator whether show logs.
  - Default `false`.

- #### `RequestsQueue.showErrors: boolean`

  - Adds provided request to the queue.
  - Default `true`.

- #### `RequestsQueue.saveLogs: boolean`

  - Adds provided request to the queue.
  - Default `false`.

- #### `RequestsQueue.logsLimit: number`

  - Adds provided request to the queue.
  - Default `50`.

## License

[MIT](https://choosealicense.com/licenses/mit/)
