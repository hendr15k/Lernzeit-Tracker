'use strict';
// Prints a scrypt hash for AUTH_PASSWORD_HASH. Read the password from the
// environment, never from an argument that leaks into shell history.
const crypto = require('crypto');
const password = process.env.PASSWORD;
if (!password) {
  console.error('PASSWORD is required');
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
console.log(`scrypt$${salt.toString('base64')}$${derived.toString('base64')}`);
