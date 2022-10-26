import { Channel } from 'amqp-connection-manager';
import { randomUUID } from 'crypto';
import {
    PendingRequest,
    Request,
    SendMessageArgs,
    TransportResponse,
    TransportSuccessResponse,
} from '../types/transport';
import amqp = require('amqp-connection-manager');

// может иметь встроенную систему обозревателя, или обозреватель может использовать этот класс?
// ответ должен возвращаться на инстанс который сделал запрос

export class TransportQuery {
    private readonly pendingRequestMap: Map<string, PendingRequest>;
    private readonly channelMap: Map<string, amqp.ChannelWrapper>;
    private readonly amqp: amqp.AmqpConnectionManager;
    private readonly queryResponseQueueName: string;
    private readonly instanceId: string;

    constructor(
        url: string,
        private readonly timeout: number,
        service: string,
    ) {
        this.pendingRequestMap = new Map();
        this.channelMap = new Map();

        this.instanceId = Date.now().toString();
        this.queryResponseQueueName = `${service}.response.query.${this.instanceId}`;

        this.amqp = amqp.connect(url);
    }

    async initialize() {
        const responseChannel = this.amqp.createChannel({
            json: true,
            setup: (c: Channel) => {
                return c.assertQueue(this.queryResponseQueueName, {
                    durable: false,
                });
            },
        });

        await responseChannel.consume(this.queryResponseQueueName, (item) => {
            const { correlationId } = item.properties;

            const pendingRequest = this.pendingRequestMap.get(correlationId);
            if (!pendingRequest) {
                responseChannel.ack(item);
                return;
            }

            // TODO: validate schema
            const message: TransportResponse = JSON.parse(
                item.content.toString(),
            );

            console.log('[Transport][response]', message);
            if (message.hasOwnProperty('errorCode')) {
                pendingRequest.reject(message);
            } else {
                pendingRequest.resolve(
                    (message as TransportSuccessResponse).data,
                );
            }

            responseChannel.ack(item);
        });

        await responseChannel.waitForConnect();
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

    // Вызывает удаленную процедуру
    async call<T>(message: SendMessageArgs): Promise<T> {
        console.log(`[Transport][call]`, message);

        const destination = `${message.service}.rpc.query`;
        const correlationId = randomUUID();
        const channel = await this.getChannel(destination);

        return new Promise<T>((resolve, reject) => {
            const flushTimeout = setTimeout(() => {
                this.pendingRequestMap.delete(correlationId);
                reject('timeout');
            }, this.timeout);

            const rejectWrapper = (reason?: any) => {
                clearTimeout(flushTimeout);
                this.pendingRequestMap.delete(correlationId);
                reject(reason);
            };
            this.pendingRequestMap.set(correlationId, {
                resolve: (value: T | PromiseLike<T>) => {
                    clearTimeout(flushTimeout);
                    this.pendingRequestMap.delete(correlationId);
                    resolve(value);
                },
                reject: rejectWrapper,
            });

            const content: Request = {
                method: message.method,
                data: message.args,
            };

            channel
                .sendToQueue(destination, content, {
                    correlationId,
                    replyTo: this.queryResponseQueueName,
                    timeout: this.timeout,
                })
                .catch(rejectWrapper);
        });
    }

    async close() {
        await this.amqp.close();
    }
}
