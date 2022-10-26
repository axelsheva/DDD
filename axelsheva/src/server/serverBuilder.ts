import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
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

            connection.ack();
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

        try {
            await connection.send({ data: res });
        } catch (error) {
            console.error(`[connection][send] Can not send response`, error);
            return;
        }
    });
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
};

export const createServer = async (
    routing: ServerRouting,
    url: string,
    serviceName: string,
) => {
    const rabbit = amqp.connect(url);

    if (routing.query) {
        await buildQueryServer(routing.query, serviceName, rabbit);
    }
    if (routing.event) {
        await buildEventServer(routing.event, serviceName, rabbit);
    }

    return {
        close: () => rabbit.close(),
    };
};
