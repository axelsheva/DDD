export const buildConfig = (): Config => ({
    db: {
        url: '',
    },
    service: {
        name: `test.${Date.now().toString()}`,
        instanceId: Date.now().toString(),
    },
    transport: {
        timeout: 5_000,
        url: 'amqp://localhost:5672',
    },
});
