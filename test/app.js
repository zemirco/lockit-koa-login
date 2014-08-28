
var koa = require('koa');
var session = require('koa-session');
var mount = require('koa-mount');
var route = require('koa-route');
var Adapter = require('lockit-koa-couchdb');
var utils = require('lockit-koa-utils');

var login = require('..');

var config = {
  db: 'http://127.0.0.1:5984/',
  signup: {
    tokenExpiration: '1 day'
  }
};
var adapter = new Adapter(config);

var app = koa();
app.keys = ['a'];
app.use(session());
app.use(mount(login(adapter)));

app.use(utils.restrict);

app.use(route.get('/test', function *() {
  this.body = 'well done';
}));

exports.app = app;
exports.adapter = adapter;

if (!module.parent) app.listen(3000);
