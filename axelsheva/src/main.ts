import { promises as fs } from 'node:fs';
import { CONFIG } from './config';
import db from './core/db';
import load from './core/load';
import http from './core/server/http';
import { rabbit } from './core/server/serverBuilder';
import { TransportQuery } from './core/transport/rabbitmq/transportQuery';
import { sleep } from './utils/sleep';
import path = require('path');

const sandbox = {
    db: Object.freeze(db(CONFIG.db)),
    transport: {
        query: new TransportQuery(CONFIG),
    },
    console,
    utils: {
        sleep,
    },
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
        routing[serviceName] = await load(CONFIG.sandbox)(
            filePath,
            CONFIG.sandbox,
        );

        console.log(
            `[API] loaded: ${serviceName}, methods: ${Object.keys(
                routing[serviceName],
            )}`,
        );
    }

    await sandbox.transport.query.initialize();

    http(routing, CONFIG.api.port);
    rabbit(routing);
})();
