'use strict';

const http = require('node:http');

const receiveArgs = async (req) => {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const data = Buffer.concat(buffers).toString();

  console.log('data', data);

  try {
    return JSON.parse(data);
  } catch (error) {
    return data;
  }
};

module.exports = (routing, port) => {
  http
    .createServer(async (req, res) => {
      const { url, socket } = req;
      const [name, method, id] = url.substring(1).split('/');
      const entity = routing[name];
      if (!entity) return res.end('Not found');
      const handler = entity[method];
      if (!handler) return res.end('Not found');
      const src = handler.toString();
      const signature = src.substring(0, src.indexOf(')'));
      const args = [];

      console.log('signature', signature);

      if (signature.includes('(id') || signature.includes('(mask')) args.push(id);
      if (signature.includes('{')) args.push(await receiveArgs(req));

      console.log('args', args);

      console.log(`${socket.remoteAddress} ${method} ${url}`);
      const result = await handler(...args);
      res.end(JSON.stringify(result.rows));
    })
    .listen(port);

  console.log(`API on port ${port}`);
};
