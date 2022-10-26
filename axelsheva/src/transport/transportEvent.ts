import { Channel } from 'amqp-connection-manager';
import { Request, SendMessageArgs } from '../types/transport';
import amqp = require('amqp-connection-manager');

export class TransportEvent {
    private readonly channelMap: Map<string, amqp.ChannelWrapper>;
    private readonly amqp: amqp.AmqpConnectionManager;

    constructor(url: string) {
        this.channelMap = new Map();

        this.amqp = amqp.connect(url);
    }

    private async getChannel(name: string) {
        const channel = this.channelMap.get(name);
        if (channel) {
            return channel;
        }

        const newChannel = this.amqp.createChannel({
            json: true,
            setup: function (c: Channel) {
                return c.assertQueue(name, {
                    durable: true,
                });
            },
        });

        this.channelMap.set(name, newChannel);

        await newChannel.waitForConnect();

        return newChannel;
    }

    // Отправляет событие на удаленный сервис не ожидая ответа
    async call(message: SendMessageArgs) {
        console.log(`[Transport][event]`, message);

        const destination = `${message.service}.event`;
        const channel = await this.getChannel(destination);

        const content: Request = {
            method: message.method,
            data: message.args,
        };

        const res = await channel.sendToQueue(destination, content);
        if (!res) {
            throw new Error('Can not to send event');
        }

        return;
    }

    async close() {
        await this.amqp.close();
    }
}
