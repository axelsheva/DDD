import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { transport } from '../../transport/transport';
import { TransportEvent } from '../../transport/transportEvent';
import { createServer } from '../serverBuilder';

test('server', async (t) => {
    await t.test('should process event', async () => {
        const serverTestName = `test.${Date.now().toString()}`;
        const serverMethod = 'f1';
        const eventArgs = 'ping';

        const server = await createServer(
            {
                event: {
                    [serverMethod]: async (args: string) => {
                        assert.strictEqual(args, eventArgs);

                        await server.close();
                        await transportEvent.close();
                    },
                },
            },
            serverTestName,
        );

        const transportEvent = new TransportEvent();

        await transportEvent.call({
            args: eventArgs,
            method: serverMethod,
            service: serverTestName,
        });
    });

    await transport.close();
});
