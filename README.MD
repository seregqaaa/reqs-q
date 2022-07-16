# req-q

req-q is a simple and lightweight JavaScript library to help you control the
order of requests.

## Installation

```
npm install requests-queue
```

## Usage

p

```js
import { requestsQueue, RequestModel } from 'requests-queue';

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

## License

[MIT](https://choosealicense.com/licenses/mit/)
