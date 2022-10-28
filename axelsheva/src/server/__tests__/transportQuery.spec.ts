import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import { transport } from '../../transport/transport';
import { TransportQuery } from '../../transport/transportQuery';
import { createServer } from '../serverBuilder';

describe('server', () => {
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
            serverTestName,
        );

        const transportQuery = new TransportQuery(
            2_000,
            `test.${Date.now().toString()}`,
        );

        await transportQuery.initialize();

        console.time('response');
        const res = await transportQuery.call<string>({
            args: queryArgs,
            method: serverMethod,
            service: serverTestName,
        });
        console.timeEnd('response');

        assert.strictEqual(res, expectedResponse);

        await server.close();
        await transportQuery.close();
        await transport.close();
    });
});
