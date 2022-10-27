/**
 * Пример транспорта для получения сообщений, их обработки и отправки результата
 */

import amqp = require('amqp-connection-manager');
import { OnEventCallback, Request } from '../types/transport';

export class RabbitEventServer {
    private inputChannel?: amqp.ChannelWrapper;

    constructor(private readonly amqp: amqp.AmqpConnectionManager) {}

    async onEvent(queue: string, callback: OnEventCallback) {
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

        this.inputChannel = channel;
    }

    async close() {
        console.log('[RabbitEventServer][close]');

        if (!this.inputChannel) {
            console.error(
                '[RabbitEventServer][close] Input channel is not available',
            );
            throw new Error();
        }

        await this.inputChannel.close();
    }
}
