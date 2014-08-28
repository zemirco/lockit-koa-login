
var seed = require('couchdb-seed-design');

module.exports = function(db, cb) {

  // all necessary views
  var views = {
    email: {
      map: function(doc) {
        emit(doc.email);
      }
    },
    signupToken: {
      map: function(doc) {
        emit(doc.signupToken);
      }
    },
    pwdResetToken: {
      map: function(doc) {
        emit(doc.pwdResetToken);
      }
    }
  };

  // save to db
  seed(db, {'lockit-user': {views: views}}, cb);

};
