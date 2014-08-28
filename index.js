
var koa = require('koa');
var compose = require('koa-compose');
var session = require('koa-session');
var route = require('koa-route');
var views = require('co-views');
var bodyParser = require('koa-bodyparser');
var thunkify = require('thunkify');
var debug = require('debug')('login');
var pwd = require('couch-pwd');
var utils = require('lockit-koa-utils');

var render = views('node_modules/lockit-views/login', {
  default: 'jade'
});

// regexp from https://github.com/angular/angular.js/blob/master/src/ng/directive/input.js#L12
var EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
var MESSAGE_EMPTY = 'Please enter your email/username and password';
var MESSAGE_INVALID = 'Invalid user or password';

module.exports = function(adapter) {

  var app = koa();

  app.use(function *(next) {
    try {
      yield next;
    } catch (error) {
      debug(error);
      this.status = error.status;
      this.body = yield render('login', {
        error: error.message,
        login: this.login,
        basedir: './views'
      });
    }
  });

  app.keys = ['a'];
  app.use(session());
  app.use(bodyParser());

  app.use(route.get('/login', login));
  var composedLogin = compose([
    validateInput,
    findUser,
    validateUser,
    validatePassword,
    success,
    twoFactor
  ]);
  app.use(route.post('/login', composedLogin));
  app.use(route.post('/login/two-factor-auth', twoFactorAuth));
  app.use(route.get('/logout', logout));



  /**
   * GET /login
   */
  function *login() {
    this.body = yield render('login', {
      basedir: './views'
    });
  }



  /**
   * POST /login
   *
   * Validate form input fields.
   */
  function *validateInput(next) {
    this.login = this.request.body.login;
    this.password = this.request.body.password;
    if (this.login && this.password) return yield next;
    debug('invalid input: login "%s", password "%s"', this.login, this.password);
    this.throw(400, MESSAGE_EMPTY);
  }



  /**
   * POST /login
   *
   * Find user in database.
   */
  function *findUser(next) {
    try {
      var query = EMAIL_REGEXP.test(this.login) ? 'email' : 'name';
      this.user = yield adapter.find(query, this.login);
      yield next;
    } catch(error) {
      debug(error);
      this.throw(403, MESSAGE_INVALID);
    }
  }



  /**
   * POST /login
   *
   * Validate user.
   */
  function *validateUser(next) {
    if (this.user.emailVerified) return yield next;
    debug('email not verified');
    this.throw(403, MESSAGE_INVALID);
  }



  /**
   * POST /login
   *
   * Validate password.
   */
  function *validatePassword(next) {
    var encrypt = thunkify(pwd.hash);
    var hash = yield encrypt(this.password, this.user.salt);
    if (hash === this.user.derived_key) return yield next;
    debug('invalid password');
    this.throw(403, MESSAGE_INVALID);
  }



  /**
   * POST /login
   *
   * Send success message if no two-factor auth.
   */
  function *success(next) {
    this.session.email = this.user.email;
    this.session.name = this.user.name;
    if (this.user.twoFactorAuth) return yield next;
    this.session.loggedIn = true;
    var target = this.session.redirect ? this.session.redirect : '/';
    this.session.redirect = null;
    this.redirect(target);
  }



  /**
   * POST /login
   *
   * Render two-factor authentication view.
   */
  function *twoFactor() {
    this.body = yield render('two-factor', {
      basedir: './views',
      action: '/login/two-factor-auth'
    });
  }



  /**
   * POST /login/two-factor-auth
   *
   * Handle two-factor authentication.
   */
  function *twoFactorAuth() {
    var token = this.request.body.token;
    var user = yield adapter.find('name', this.session.name);
    var key = user && user.twoFactorAuthKey;
    var valid = utils.verify(token, key);
    if (!valid) {
      debug('two-factor auth token invalid');
      this.session = null;
      return this.redirect('/login');
    }
    this.session.loggedIn = true;
    var target = this.session.redirect ? this.session.redirect : '/';
    this.session.redirect = null;
    this.redirect(target);
  }



  /**
   * GET /logout
   */
  function *logout() {
    this.session = null;
    this.body = yield render('logout', {
      basedir: './views'
    });
  }

  return app;

};
