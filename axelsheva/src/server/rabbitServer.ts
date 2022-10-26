/**
 * Пример транспорта для получения сообщений, их обработки и отправки результата
 */

import amqp = require('amqp-connection-manager');
import { OnRequestCallback, Request } from '../types/transport';
import { ServerRouting } from './types';

class RabbitServer {
    private readonly amqp: amqp.AmqpConnectionManager;

    constructor(url: string) {
        this.amqp = amqp.connect(url);
    }

    async onRequest(name: string, callback: OnRequestCallback) {
        const channel = this.amqp.createChannel({
            json: true,
            setup: function (channel: amqp.Channel) {
                return channel.assertQueue(name, {
                    durable: true,
                });
            },
        });

        await channel.consume(name, (item) => {
            let message: Omit<Request, 'send'>;
            try {
                message = JSON.parse(item.content.toString());
            } catch (error) {
                channel.sendToQueue(
                    item.properties.replyTo,
                    'Invalid arguments',
                );

                return;
            }

            // TODO: validate message

            callback(
                {
                    send: async (data: any) => {
                        await channel.sendToQueue(
                            item.properties.replyTo,
                            data,
                            {
                                correlationId: item.properties.correlationId,
                            },
                        );
                    },
                    ack() {
                        channel.ack(item);
                    },
                    nack() {
                        channel.nack(item);
                    },
                },
                message,
            );
        });

        await channel.waitForConnect();
    }
}

export const createServer = async (
    routing: ServerRouting,
    url: string,
    serviceName: string,
) => {
    const server = new RabbitServer(url);
    const queryQueueName = `${serviceName}.rpc.query`;
    const mutationQueueName = `${serviceName}.rpc.mutation`;

    await server.onRequest(queryQueueName, async (connection, message) => {
        const handler = routing[message.method];
        if (!handler) {
            console.error(`Handler not found for method: ${message.method}`);
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
            res = await handler(message);

            connection.ack();
        } catch (error) {
            // TODO: в зависимости от ошибки нужно выбирать поведение
            connection.nack();

            console.error(`[Handler]`, error);
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
