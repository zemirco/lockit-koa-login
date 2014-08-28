
# Lockit Login for Koa

[![Build Status](https://travis-ci.org/zemirco/lockit-koa-login.svg?branch=master)](https://travis-ci.org/zemirco/lockit-koa-login)
[![NPM version](https://badge.fury.io/js/lockit-koa-login.svg)](http://badge.fury.io/js/lockit-koa-login)
[![Dependency Status](https://david-dm.org/zemirco/lockit-koa-login.svg)](https://david-dm.org/zemirco/lockit-koa-login)

Module is part of [Lockit for Koa](https://github.com/zemirco/lockit-koa).

## Installation

```
npm install lockit-koa-login
```

## Usage

```js
var koa = require('koa');
var session = require('koa-session');
var mount = require('koa-mount');
var login = require('lockit-koa-login');
var Adapter = require('lockit-koa-couchdb');
var config = require('./config.js');

var adapter = new Adapter(config);

var app = koa();
app.keys = ['a'];
app.use(session());
app.use(mount(login(adapter)));

app.listen(3000);
```

## Test

```
npm test
```

## License

MIT
