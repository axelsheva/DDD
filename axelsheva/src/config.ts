export const CONFIG: Config = {
    db: { url: '' },
    messageBroker: {
        url: 'amqp://localhost:5672',
        timeout: 5_000,
    },
    service: {
        name: 'app',
        instanceId: Date.now().toString(),
    },
    sandbox: { timeout: 5000, displayErrors: false },
    api: { port: 8888 },
};
