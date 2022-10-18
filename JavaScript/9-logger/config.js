module.exports = {
  db: {
    host: '127.0.0.1',
    port: 5432,
    database: 'example',
    user: 'marcus',
    password: 'marcus',
  },
  crypto: {
    saltLength: 16,
    keyLength: 64,
    encoding: 'base64',
    separator: ':',
  },
  transport: 'http',
  logger: {
    type: 'console',
  },
};
