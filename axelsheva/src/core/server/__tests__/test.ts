export const buildConfig = (): Config => ({
    db: {
        url: '',
    },
    service: {
        name: `test.${Date.now().toString()}`,
        instanceId: Date.now().toString(),
    },
    messageBroker: {
        timeout: 5_000,
        url: 'amqp://localhost:5672',
    },
    sandbox: { timeout: 5000, displayErrors: false },
    api: { port: 8888 },
});
