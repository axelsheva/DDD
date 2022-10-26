import assert = require('node:assert');
import { describe, test } from 'node:test';
import { TransportQuery } from '../transportQuery';

describe('TransportQuery', () => {
    const url = 'amqp://localhost:5672';

    test('should be rejected by timeout', async (t) => {
        const serverTestName = `test.${Date.now().toString()}`;
        const serverMethod = 'f1';
        const queryArgs = 'ping';

        const transport = new TransportQuery(
            url,
            1_000,
            `test.${Date.now().toString()}`,
        );

        await transport.initialize();

        assert.rejects(
            () =>
                transport.call<string>({
                    args: queryArgs,
                    method: serverMethod,
                    service: serverTestName,
                }),
            'timeout',
        );

        await transport.close();
    });
});
