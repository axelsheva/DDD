/**
 * Пример транспорта для получения сообщений, их обработки и отправки результата
 */

import amqp = require('amqp-connection-manager');
import { OnRequestCallback, Request } from '../types/transport';
import { sleep } from '../utils/sleep';

export class RabbitQueryServer {
    private inputChannel?: amqp.ChannelWrapper;
    private outputChannel: amqp.ChannelWrapper;
    private activeMessages: number;

    constructor(private readonly amqp: amqp.AmqpConnectionManager) {
        console.log('[RabbitQueryServer][constructor]');

        this.outputChannel = this.amqp.createChannel({
            json: true,
        });

        this.activeMessages = 0;
    }

    async onRequest(queue: string, callback: OnRequestCallback) {
        // TODO: split this channel to input and output
        const inputChannel = this.amqp.createChannel({
            json: true,
            setup: function (channel: amqp.Channel) {
                return channel.assertQueue(queue, {
                    durable: true,
                });
            },
        });

        await inputChannel.consume(queue, (item) => {
            let message: Omit<Request, 'send'>;
            try {
                message = JSON.parse(item.content.toString());
            } catch (error) {
                this.outputChannel.sendToQueue(
                    item.properties.replyTo,
                    'Invalid arguments',
                );

                return;
            }

            // TODO: validate message

            this.activeMessages += 1;

            const decreaseActiveMessage = () => (this.activeMessages -= 1);

            callback(
                {
                    send: async (data: any) => {
                        await this.outputChannel.sendToQueue(
                            item.properties.replyTo,
                            data,
                            {
                                correlationId: item.properties.correlationId,
                            },
                        );
                    },
                    ack() {
                        inputChannel.ack(item);

                        decreaseActiveMessage();
                    },
                    nack() {
                        inputChannel.nack(item);

                        decreaseActiveMessage();
                    },
                },
                message,
            );
        });

        await inputChannel.waitForConnect();

        this.inputChannel = inputChannel;
    }

    async close() {
        console.log('[RabbitQueryServer][close]');

        if (!this.inputChannel) {
            console.error(
                '[RabbitQueryServer][close] Input channel is not available',
            );
            throw new Error();
        }

        await this.inputChannel.close();

        while (this.activeMessages > 0) {
            console.log(
                `[RabbitQueryServer][close] Active messages: ${this.activeMessages}, wait...`,
            );

            await sleep(200);
        }

        await this.outputChannel.close();
    }
}
