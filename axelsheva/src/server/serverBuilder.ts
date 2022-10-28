import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { transport } from '../transport/transport';
import { RabbitEventServer } from './rabbitEventServer';
import { RabbitQueryServer } from './rabbitQueryServer';
import { Routing, ServerRouting } from './types';

export const buildQueryServer = async (
    routing: Routing,
    serviceName: string,
    rabbit: IAmqpConnectionManager,
) => {
    const server = new RabbitQueryServer(rabbit);
    const queue = `${serviceName}.rpc.query`;

    await server.onRequest(queue, async (connection, message) => {
        const handler = routing[message.method];
        if (!handler) {
            console.error(
                `[Server][onRequest] Handler not found for method: ${message.method}`,
            );
            connection.ack();
            connection.send({
                errorCode: 404,
                message: 'Not found!',
            });
            return;
        }

        console.log('[Server][onRequest]', message);

        let res;
        try {
            res = await handler(message.data);
        } catch (error) {
            // TODO: в зависимости от ошибки нужно выбирать поведение
            connection.nack();

            console.error(`[Server][onRequest]`, error);
            connection.send({
                message: 'Server error',
                errorCode: 500,
            });
            return;
        }

        console.log(`[server][query] res`, res);

        try {
            // TODO: check response
            await connection.send({ data: res });

            connection.ack();
        } catch (error) {
            console.error(`[connection][send] Can not send response`, error);
            return;
        }
    });

    return {
        close: () => server.close(),
    };
};

export const buildEventServer = async (
    routing: Routing,
    serviceName: string,
    rabbit: IAmqpConnectionManager,
) => {
    const server = new RabbitEventServer(rabbit);
    const queue = `${serviceName}.event`;

    await server.onEvent(queue, async (connection, message) => {
        const handler = routing[message.method];
        if (!handler) {
            console.error(
                `[Server][onEvent] Handler not found for method: ${message.method}`,
            );
            return;
        }

        console.log('[Server][onEvent]', message);

        try {
            await handler(message.data);

            connection.ack();
        } catch (error) {
            // TODO: в зависимости от ошибки нужно выбирать поведение
            connection.nack();

            console.error(`[Handler]`, error);

            return;
        }
    });

    return {
        close: () => server.close(),
    };
};

export const createServer = async (
    routing: ServerRouting,
    serviceName: string,
) => {
    const servers: Array<{ close: () => Promise<void> }> = [];

    if (routing.query) {
        const server = await buildQueryServer(
            routing.query,
            serviceName,
            transport,
        );

        servers.push(server);
    }
    if (routing.event) {
        const server = await buildEventServer(
            routing.event,
            serviceName,
            transport,
        );

        servers.push(server);
    }

    return {
        close: () => Promise.all(servers.map((server) => server.close())),
    };
};
