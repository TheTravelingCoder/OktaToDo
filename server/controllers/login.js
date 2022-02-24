const jwt = require('jsonwebtoken');
const config = require("../config/keys.js");
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
var JsonWebTokenError = require('./lib/JsonWebTokenError');
var jws               = require('jws');
var ms                = require('ms');
var xtend             = require('xtend');

// Models
const User = require('../models/User');
const Todo = require('../models/Todo');

// Allows email verification
module.exports.tokenConfirmation = async (req, res) => {
  try {
    const { user: email } = jwt.verify(req.params.token, config.EMAIL_SECRET);
    await User.findOneAndUpdate({email: email }, {isVerified: true});
  }
  catch (e){
    res.send('error_msg');
    console.log(e);
  }
};

// Handles JWT Issuance/API Login
module.exports.login = async (req, res) => {
  console.log(req.body)
  if(req.body.accessToken){
    let accessToken = req.body.accessToken.accessToken;
    let idToken = req.body.idToken.idToken;
    let email = req.body.idToken.claims.email;
    let body = {
      email: email,
      accessToken: accessToken,
      idToken: idToken
    }
    let token = jwt.sign(body, "SoSoSecretMyGuy");
    User.findOne({ email: email }).then(user => {
      if(!user){
        createUser(email, token);
        res.status(200).send(token);
        return;
      }else{
        res.status(200).send(token);
        return;
      }
    })
  }else{
    res.status(201).send('BadCreds');
    return;
  }
};

// Handles add todo
module.exports.addTodo = async (req, res) => {
  if(req.body.todo){
    let todoNote = req.body.todo;
    let jwt = req.body.jwt;
    let decoded = verify(jwt, "SoSoSecretMyGuy");
    Todo.findOne({ todo: todoNote }).then(todo => {
      if(todo){
        res.status(400).send('error');
      }else{
        let todo = new Todo;
        todo.todo = todoNote;
        todo.email = decoded.email;
        todo.save(function(err, res){
          if(err) return err;
        })
        res.status(200).send(todoNote);
      }
    })
  }else{
    res.status(201).send('BadCreds');
    return;
  }
};

// Handles get todo
module.exports.getTodo = async (req, res) => {
  if(req.body.jwt){
    let jwt = req.body.jwt;
    let decoded = verify(jwt, "SoSoSecretMyGuy");
    let email = decoded.email; 
    Todo.find({ email: email }).then(todo => {
      if(todo.length > 0){
        res.status(200).send(todo);
      }else{
        res.status(400).send('error');
      }
    })
  }else{
    res.status(201).send('BadCreds');
    return;
  }
};

function createUser(email, token) {
  var user = new User();
  user.email = email;
  user.jwt = token;
  user.save(function(err, user){
    if(err) return err;
  });
}









function verify(jwtString, secretOrPublicKey, options, callback) {
  if ((typeof options === 'function') && !callback) {
    callback = options;
    options = {};
  }

  if (!options) {
    options = {};
  }

  //clone this object since we are going to mutate it.
  options = xtend(options);
  var done;

  if (callback) {
    done = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      return process.nextTick(function() {
        callback.apply(null, args);
      });
    };
  } else {
    done = function(err, data) {
      if (err) throw err;
      return data;
    };
  }

  if (options.clockTimestamp && typeof options.clockTimestamp !== 'number') {
    return done(new JsonWebTokenError('clockTimestamp must be a number'));
  }

  var clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1000);

  if (!jwtString){
    return done(new JsonWebTokenError('jwt must be provided'));
  }

  if (typeof jwtString !== 'string') {
    return done(new JsonWebTokenError('jwt must be a string'));
  }

  var parts = jwtString.split('.');

  if (parts.length !== 3){
    return done(new JsonWebTokenError('jwt malformed'));
  }

  var hasSignature = parts[2].trim() !== '';

  if (!hasSignature && secretOrPublicKey){
    return done(new JsonWebTokenError('jwt signature is required'));
  }

  if (hasSignature && !secretOrPublicKey) {
    return done(new JsonWebTokenError('secret or public key must be provided'));
  }

  if (!hasSignature && !options.algorithms) {
    options.algorithms = ['none'];
  }

  if (!options.algorithms) {
    options.algorithms = ~secretOrPublicKey.toString().indexOf('BEGIN CERTIFICATE') ||
                         ~secretOrPublicKey.toString().indexOf('BEGIN PUBLIC KEY') ?
                          [ 'RS256','RS384','RS512','ES256','ES384','ES512' ] :
                         ~secretOrPublicKey.toString().indexOf('BEGIN RSA PUBLIC KEY') ?
                          [ 'RS256','RS384','RS512' ] :
                          [ 'HS256','HS384','HS512' ];

  }

  var decodedToken;
  try {
    decodedToken = jws.decode(jwtString);
  } catch(err) {
    return done(err);
  }

  if (!decodedToken) {
    return done(new JsonWebTokenError('invalid token'));
  }

  var header = decodedToken.header;

  if (!~options.algorithms.indexOf(header.alg)) {
    return done(new JsonWebTokenError('invalid algorithm'));
  }

  var valid;

  try {
    valid = jws.verify(jwtString, header.alg, secretOrPublicKey);
  } catch (e) {
    return done(e);
  }

  if (!valid)
    return done(new JsonWebTokenError('invalid signature'));

  var payload;

  try {
    payload = decode(jwtString);
  } catch(err) {
    return done(err);
  }

  if (typeof payload.nbf !== 'undefined' && !options.ignoreNotBefore) {
    if (typeof payload.nbf !== 'number') {
      return done(new JsonWebTokenError('invalid nbf value'));
    }
    if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
      return done(new NotBeforeError('jwt not active', new Date(payload.nbf * 1000)));
    }
  }

  if (typeof payload.exp !== 'undefined' && !options.ignoreExpiration) {
    if (typeof payload.exp !== 'number') {
      return done(new JsonWebTokenError('invalid exp value'));
    }
    if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
      return done(new TokenExpiredError('jwt expired', new Date(payload.exp * 1000)));
    }
  }

  if (options.audience) {
    var audiences = Array.isArray(options.audience)? options.audience : [options.audience];
    var target = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

    var match = target.some(function(aud) { return audiences.indexOf(aud) != -1; });

    if (!match)
      return done(new JsonWebTokenError('jwt audience invalid. expected: ' + audiences.join(' or ')));
  }

  if (options.issuer) {
    var invalid_issuer =
        (typeof options.issuer === 'string' && payload.iss !== options.issuer) ||
        (Array.isArray(options.issuer) && options.issuer.indexOf(payload.iss) === -1);

    if (invalid_issuer) {
      return done(new JsonWebTokenError('jwt issuer invalid. expected: ' + options.issuer));
    }
  }

  if (options.subject) {
    if (payload.sub !== options.subject) {
      return done(new JsonWebTokenError('jwt subject invalid. expected: ' + options.subject));
    }
  }

  if (options.jwtid) {
    if (payload.jti !== options.jwtid) {
      return done(new JsonWebTokenError('jwt jwtid invalid. expected: ' + options.jwtid));
    }
  }

  if (options.maxAge) {
    var maxAge = ms(options.maxAge);
    if (typeof payload.iat !== 'number') {
      return done(new JsonWebTokenError('iat required when maxAge is specified'));
    }
    // We have to compare against either options.clockTimestamp or the currentDate _with_ millis
    // to not change behaviour (version 7.2.1). Should be resolve somehow for next major.
    var nowOrClockTimestamp = ((options.clockTimestamp || 0) * 1000) || Date.now();
    if (nowOrClockTimestamp - (payload.iat * 1000) > maxAge + (options.clockTolerance || 0) * 1000) {
      return done(new TokenExpiredError('maxAge exceeded', new Date(payload.iat * 1000 + maxAge)));
    }
  }

  return done(null, payload);
};

function decode(jwt, options) {
  options = options || {};
  var decoded = jws.decode(jwt, options);
  if (!decoded) { return null; }
  var payload = decoded.payload;

  //try parse the payload
  if(typeof payload === 'string') {
    try {
      var obj = JSON.parse(payload);
      if(typeof obj === 'object') {
        payload = obj;
      }
    } catch (e) { }
  }

  //return header if `complete` option is enabled.  header includes claims
  //such as `kid` and `alg` used to select the key within a JWKS needed to
  //verify the signature
  if (options.complete === true) {
    return {
      header: decoded.header,
      payload: payload,
      signature: decoded.signature
    };
  }
  return payload;
};