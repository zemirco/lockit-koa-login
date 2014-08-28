
# Lockit CouchDB adapter for Koa

Lockit CouchDB adapter for [Koa](https://github.com/koajs/koa).

## Installation

```
npm install lockit-koa-couchdb
```

## Configuration

The adapter automatically saves the necessary views to your CouchDB.
You only need the connection string in your config.js.

```js
exports.db = 'http://127.0.0.1:5984/';
```

or (long format with custom per-user-db prefix)

```js
exports.db = {
  url: 'http://127.0.0.1:5984/',
  prefix: 'custom/'               // default is 'lockit/'
}
```

## Usage

```js
var co = require('co');
var Adapter = require('lockit-koa-couchdb');
var config = require('./config.js');
var adapter = new Adapter(config);

co(function *() {
  var user = yield adapter.save('john', 'john@email.com', 'secret');
})();
```

## Development

Use Tracuer to compile all ECMAScript 6 code.

```
npm run compile
```

## Test

Tests are also written in ECMAScript 6 and compiled on the fly.

```
npm test
```

## License

MIT
