import http = require('node:http');

const HEADERS = {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=UTF-8',
};

const receiveArgs = async (req: any) => {
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const data = Buffer.concat(buffers).toString();
    return JSON.parse(data);
};

export default (routing: Routing, port: number) => {
    http.createServer(async (req: any, res: any) => {
        res.writeHead(200, HEADERS);
        if (req.method !== 'POST') return res.end('Not found');
        const { url, socket } = req;
        const [name, method, id] = url.substring(1).split('/');
        const entity = routing[name];
        if (!entity) return res.end('Not found');
        const handler = entity[method];
        if (!handler) return res.end('Not found');
        const src = handler.toString();
        const signature = src.substring(0, src.indexOf(')'));
        const args = [];
        if (signature.includes('(id') || signature.includes('(mask'))
            args.push(id);
        if (signature.includes('{')) args.push(await receiveArgs(req));
        const result = await handler(...args);
        console.log(`${socket.remoteAddress} ${method} ${url}, ${result}`);
        res.end(JSON.stringify(result));
    }).listen(port);

    console.log(`[HTTP] API on port ${port}`);
};
