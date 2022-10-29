import { Channel } from 'amqp-connection-manager';
import { randomUUID } from 'crypto';
import {
    PendingRequest,
    Request,
    SendMessageArgs,
    TransportResponse,
    TransportSuccessResponse,
} from '../types/transport';
import { sleep } from '../utils/sleep';
import { transport } from './transport';
import amqp = require('amqp-connection-manager');

// может иметь встроенную систему обозревателя, или обозреватель может использовать этот класс?
// ответ должен возвращаться на инстанс который сделал запрос

export class TransportQuery {
    private readonly pendingRequestMap: Map<string, PendingRequest>;
    private readonly channelMap: Map<string, amqp.ChannelWrapper>;
    private readonly queryResponseQueueName: string;
    private readonly responseChannel: amqp.ChannelWrapper;
    private readonly timeout: number;

    constructor(config: Config) {
        this.pendingRequestMap = new Map();
        this.channelMap = new Map();
        this.timeout = config.transport.timeout;
        this.queryResponseQueueName = `${config.service.name}.response.query.${config.service.instanceId}`;

        this.responseChannel = transport.createChannel({
            json: true,
            setup: (c: Channel) => {
                return c.assertQueue(this.queryResponseQueueName, {
                    durable: false,
                });
            },
        });
    }

    async initialize() {
        console.log('[TransportQuery][initialize]');

        await this.responseChannel.consume(
            this.queryResponseQueueName,
            (item) => {
                const { correlationId } = item.properties;

                const pendingRequest =
                    this.pendingRequestMap.get(correlationId);
                if (!pendingRequest) {
                    this.responseChannel.ack(item);
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

                this.responseChannel.ack(item);
            },
        );

        await this.responseChannel.waitForConnect();
    }

    // can be race condition for the same queue
    private async getChannel(name: string) {
        const channel = this.channelMap.get(name);
        if (channel) {
            return channel;
        }

        const newChannel = transport.createChannel({
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
                entity: message.entity,
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

    // must be closed after closing input queue
    async close() {
        console.log('[TransportQuery][close]');

        while (this.pendingRequestMap.size) {
            await sleep(200);
        }

        if (this.responseChannel) {
            await this.responseChannel.close();
        }

        await Promise.all(
            [...this.channelMap.values()].map((channel) => channel.close()),
        );
    }
}
