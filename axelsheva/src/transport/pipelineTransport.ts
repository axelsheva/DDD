import { Channel } from 'amqp-connection-manager';
import { randomUUID } from 'crypto';
import { Request, SendMessageArgs } from '../types/transport';
import amqp = require('amqp-connection-manager');

// Отправляет сообщение на обработку сервису обработчику и не ожидает ответа
// TODO: добавить обработчик ответов
// - ответ должен возвращаться в общую очередь для всех инстансов

export class PipelineTransport {
    private readonly channelMap: Map<string, amqp.ChannelWrapper>;
    private readonly amqp: amqp.AmqpConnectionManager;
    private readonly mutationResponseQueueName: string;

    constructor(url: string, service: string) {
        this.channelMap = new Map();

        this.mutationResponseQueueName = `${service}.response.mutation.shared`;

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

    // Отправляет запрос на мутацию данных на удаленный сервис
    async call(message: SendMessageArgs): Promise<void> {
        const correlationId = randomUUID(); // нужен ли?
        const channel = await this.getChannel(message.destination);

        const content: Request = {
            method: message.method,
            data: message.data,
        };

        const res = await channel.sendToQueue(message.destination, content, {
            correlationId,
            replyTo: this.mutationResponseQueueName,
        });

        if (!res) {
            throw new Error('message did not sent');
        }
    }

    // Отправляет событие на удаленный сервис не ожидая ответа
    async event(message: SendMessageArgs) {
        return;
    }
}
