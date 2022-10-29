export const CONFIG: Config = {
    db: { url: '' },
    transport: {
        url: 'amqp://localhost:5672',
        timeout: 5_000,
    },
    service: {
        name: 'app',
        instanceId: Date.now().toString(),
    },
};
