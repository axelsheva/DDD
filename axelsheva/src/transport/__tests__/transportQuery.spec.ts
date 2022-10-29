import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import { transport } from '../transport';
import { TransportQuery } from '../transportQuery';

describe('TransportQuery', async () => {
    await test('should be rejected by timeout', async () => {
        const serverTestName = `test.${Date.now().toString()}`;
        const entity = 'f1';
        const serverMethod = 'f1';
        const queryArgs = 'ping';

        const transportQuery = new TransportQuery(
            1_000,
            `test.${Date.now().toString()}`,
        );

        await transportQuery.initialize();

        await assert.rejects(
            () =>
                transportQuery.call<string>({
                    args: queryArgs,
                    entity,
                    method: serverMethod,
                    service: serverTestName,
                }),
            (err: string) => {
                assert.strictEqual(err, 'timeout');
                return true;
            },
        );

        await transportQuery.close();
    });

    await transport.close();
});
