import { promises as fs } from 'node:fs';
import db from './db';
import http from './http';
import load from './load';
import { rabbit } from './server/serverBuilder';
import { TransportQuery } from './transport/transportQuery';
import path = require('path');

const sandbox = {
    db: Object.freeze(db),
    transport: {
        query: new TransportQuery(),
    },
    console,
};

const extension = __dirname.endsWith('dist') ? '.js' : '.ts';

const apiPath = path.join(__dirname, './api');
const routing: Routing = {};

(async () => {
    const files = await fs.readdir(apiPath);
    for (const fileName of files) {
        if (!fileName.endsWith(extension)) continue;
        const filePath = path.join(apiPath, fileName);
        const serviceName = path.basename(fileName, extension);
        routing[serviceName] = await load(filePath, sandbox);

        console.log(
            `[API] loaded: ${serviceName}, methods: ${Object.keys(
                routing[serviceName],
            )}`,
        );
    }

    await sandbox.transport.query.initialize();

    http(routing, 8888);
    await rabbit(routing);
})();
