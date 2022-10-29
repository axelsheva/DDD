import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import { buildConfig } from '../../../server/__tests__/test';
import { transport } from '../transport';
import { TransportQuery } from '../transportQuery';

describe('TransportQuery', async () => {
    await test('should be rejected by timeout', async () => {
        const entity = 'f1';
        const serverMethod = 'f1';
        const queryArgs = 'ping';

        const config = buildConfig();

        const transportQuery = new TransportQuery(config);

        await transportQuery.initialize();

        await assert.rejects(
            () =>
                transportQuery.call<string>({
                    args: queryArgs,
                    entity,
                    method: serverMethod,
                    service: config.service.name,
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
