import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import { transport } from '../../transport/rabbitmq/transport';
import { TransportQuery } from '../../transport/rabbitmq/transportQuery';
import { _createServer } from '../serverBuilder';
import { buildConfig } from './test';

describe('server', () => {
    test('should process query', async (t) => {
        const config = buildConfig();

        const entity = 'user';
        const serverMethod = 'f1';
        const expectedResponse = 'pong';
        const queryArgs = 'ping';

        const server = await _createServer(
            {
                query: {
                    user: {
                        [serverMethod]: (args: string) => {
                            assert.strictEqual(args, queryArgs);

                            return expectedResponse;
                        },
                    },
                },
            },
            config.service.name,
        );

        const transportQuery = new TransportQuery(config);

        await transportQuery.initialize();

        console.time('response');
        const res = await transportQuery.call<string>({
            args: queryArgs,
            entity,
            method: serverMethod,
            service: config.service.name,
        });
        console.timeEnd('response');

        assert.strictEqual(res, expectedResponse);

        await server.close();
        await transportQuery.close();
        await transport.close();
    });
});
