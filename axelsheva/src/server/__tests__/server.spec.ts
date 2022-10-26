import assert = require('node:assert');
import { describe, it, test } from 'node:test';
import { TransportEvent } from '../../transport/transportEvent';
import { TransportQuery } from '../../transport/transportQuery';
import { createServer } from '../serverBuilder';

describe('server', () => {
    const url = 'amqp://localhost:5672';

    test('should process query', async (t) => {
        const serverTestName = `test.${Date.now().toString()}`;
        const serverMethod = 'f1';
        const expectedResponse = 'pong';
        const queryArgs = 'ping';

        const server = await createServer(
            {
                query: {
                    [serverMethod]: (args: string) => {
                        assert.strictEqual(args, queryArgs);

                        return expectedResponse;
                    },
                },
            },
            url,
            serverTestName,
        );

        const transport = new TransportQuery(
            url,
            1_000,
            `test.${Date.now().toString()}`,
        );

        await transport.initialize();

        const res = await transport.call<string>({
            args: queryArgs,
            method: serverMethod,
            service: serverTestName,
        });

        assert.strictEqual(res, expectedResponse);

        await server.close();
        await transport.close();
    });

    it('should process event', async () => {
        const serverTestName = `test.${Date.now().toString()}`;
        const serverMethod = 'f1';
        const eventArgs = 'ping';

        const server = await createServer(
            {
                event: {
                    [serverMethod]: async (args: string) => {
                        assert.strictEqual(args, eventArgs);

                        await server.close();
                    },
                },
            },
            url,
            serverTestName,
        );

        const transport = new TransportEvent(url);

        await transport.call({
            args: eventArgs,
            method: serverMethod,
            service: serverTestName,
        });

        await transport.close();
    });
});
