'use strict';

const crypto = require('node:crypto');
const config = require('./config');

const hash = (password) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(config.crypto.saltLength).toString(config.crypto.encoding);
    crypto.scrypt(password, salt, config.crypto.keyLength, (err, result) => {
      if (err) reject(err);
      resolve(salt + config.crypto.separator + result.toString(config.crypto.encoding));
    });
  });

module.exports = hash;
