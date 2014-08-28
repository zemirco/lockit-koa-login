
var totp = require('notp').totp;
var assert = require('assert');
var co = require('co');
var koa = require('./app.js');

var request = require('supertest').agent(koa.app.listen());

describe('login', function() {

  before(function(done) {
    co(function *() {
      var a = yield koa.adapter.save('john', 'john@email.com', 'secret');
      var b = yield koa.adapter.save('steve', 'steve@email.com', 'hidden');
      b.emailVerified = true;
      yield koa.adapter.update(b);
      var c = yield koa.adapter.save('tf', 'tf@email.com', 'twofactor');
      c.emailVerified = true;
      c.twoFactorAuth = true;
      yield koa.adapter.update(c);
      done();
    })();
  });

  describe('GET /login', function() {

    it('should render login view', function(done) {
      request
      .get('/login')
      .expect(200)
      .expect(/Email or Username/, done);
    });

  });

  describe('POST /login', function() {

    it('should return an error when login field is empty', function(done){
      request
      .post('/login')
      .send({login: '', password: 'secret'})
      .expect(400)
      .expect(/Please enter your email\/username and password/, done);
    });

    it('should return an error when password field is empty', function(done){
      request
      .post('/login')
      .send({login: 'john', password: ''})
      .expect(400)
      .expect(/Please enter your email\/username and password/, done);
    });

    it('should return an error when email is not verified yet', function(done) {
      request
      .post('/login')
      .send({login: 'john', password: 'secret'})
      .expect(403)
      .expect(/Invalid user or password/, done);
    });

    it('should return an error when user is not in db', function(done) {
      request
      .post('/login')
      .send({login: 'jim', password: 'beep'})
      .expect(403)
      .expect(/Invalid user or password/, done);
    });

    it('should render an error message when password is false', function(done) {
      request
      .post('/login')
      .send({login: 'john', password: 'public'})
      .expect(403)
      .expect(/Invalid user or password/, done);
    });

    it('should allow login with name', function(done) {
      request
      .post('/login')
      .send({login: 'steve', password: 'hidden'})
      .expect(302)
      .expect('Redirecting to <a href="/">/</a>.', done);
    });

    it('should allow login with an email', function(done) {
      request
      .post('/login')
      .send({login: 'steve@email.com', password: 'hidden'})
      .expect(302)
      .expect('Redirecting to <a href="/">/</a>.', done);
    });

    it('should redirect to original url', function(done) {
      request
      .get('/logout')
      .end(function() {

        process.nextTick(function() {
          request
          .get('/secret')
          .end(function() {

            process.nextTick(function() {
              request
              .post('/login')
              .send({login: 'steve@email.com', password: 'hidden'})
              .expect(302)
              .expect('Redirecting to <a href="/secret">/secret</a>.', done);
            });

          });
        });

      });
    });

    it('should render two-factor view when it is enabled', function(done) {
      request
      .post('/login')
      .send({login: 'tf', password: 'twofactor'})
      .expect(200)
      .expect(/Two-Factor Authentication/, done);
    });

    it('should prevent login when two-factor auth is enabled', function(done) {
      request
      .get('/logout')
      .end(function() {

        process.nextTick(function() {
          request
          .post('/login')
          .send({login: 'tf', password: 'twofactor'})
          .end(function() {

            process.nextTick(function() {
              request
              .get('/test')
              .expect(302)
              .expect('Redirecting to <a href="/login">/login</a>.', done);
            });

          });
        });

      });

    });

  });

  describe('POST /login/two-factor-auth', function() {

    it('should redirect to /login when token is invalid', function(done) {
      request
      .post('/login')
      .send({login: 'tf', password: 'twofactor'})
      .end(function() {

        process.nextTick(function() {
          request
          .post('/login/two-factor-auth')
          .send({token: '123456'})
          .expect(302)
          .expect('Redirecting to <a href="/login">/login</a>.', done);
        });

      });

    });

    it('should allow login when token is valid', function(done) {
      co(function *() {
        var key = 'abcd1234';
        var user = yield koa.adapter.find('name', 'tf');
        user.twoFactorAuthKey = key;
        var awesome = yield koa.adapter.update(user);

        request
        .post('/login')
        .send({login: 'tf', password: 'twofactor'})
        .end(function() {

          process.nextTick(function() {
            var token = totp.gen(key, {});
            request
            .post('/login/two-factor-auth')
            .send({token: token})
            .expect(302)
            .expect('Redirecting to <a href="/">/</a>.', done);
          });

        });
      })();
    });

  });

  describe('GET /logout', function() {

    it('should start with login', function(done) {
      request
      .post('/login')
      .send({login: 'steve', password: 'hidden'})
      .expect(302)
      .expect('Redirecting to <a href="/">/</a>.', done);
    });

    it('should then allow access to restricted pages', function(done) {
      request
      .get('/test')
      .expect(200)
      .expect('well done', done);
    });

    it('should render a success message and destroy the session', function(done) {
      request
      .get('/logout')
      .expect(200)
      .expect(/You've successfully logged out/, done);
    });

    it('should then disallow access to restricted pages', function(done) {
      request
      .get('/test')
      .expect(302)
      .expect('Redirecting to <a href="/login">/login</a>.', done);
    });

  });

  after(function(done) {
    co(function *() {
      yield koa.adapter.remove('john');
      yield koa.adapter.remove('steve');
      yield koa.adapter.remove('tf');
      done();
    })();
  });

});
