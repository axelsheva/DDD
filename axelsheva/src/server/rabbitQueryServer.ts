/**
 * Пример транспорта для получения сообщений, их обработки и отправки результата
 */

import amqp = require('amqp-connection-manager');
import { OnRequestCallback, Request } from '../types/transport';

export class RabbitQueryServer {
    constructor(private readonly amqp: amqp.AmqpConnectionManager) {}

    async onRequest(queue: string, callback: OnRequestCallback) {
        const channel = this.amqp.createChannel({
            json: true,
            setup: function (channel: amqp.Channel) {
                return channel.assertQueue(queue, {
                    durable: true,
                });
            },
        });

        await channel.consume(queue, (item) => {
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
