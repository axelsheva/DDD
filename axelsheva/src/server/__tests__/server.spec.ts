import assert = require('node:assert');
import { describe, it } from 'node:test';
import { Transport } from '../../transport/transport';
import { createServer } from '../rabbitServer';

describe('server', () => {
    it('should consume messages', async () => {
        const url = 'amqp://localhost:5672';
        const serverTestName = 'test.A';
        const serverMethod = 'f1';
        const server = await createServer(
            {
                [serverMethod]: () => {
                    return 'ack';
                },
            },
            url,
            serverTestName,
        );

        const transport = new Transport(url, 1_000, 'test.B');

        await transport.initialize();

        const res = await transport.call<string>({
            data: 'hello world!',
            method: serverMethod,
            destination: `${serverTestName}.rpc.query`,
            // type: 'query',
        });

        assert.strictEqual(res, 'ack');
    });
});
