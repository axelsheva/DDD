export type TransportError = {
    errorCode: number;
    message: string;
};

export type TransportSuccessResponse = { data: any };

export type TransportResponse = TransportSuccessResponse | TransportError;

export type Connection = {
    send(data: TransportError | TransportSuccessResponse): Promise<void>;
    ack(): void;
    nack(): void;
};

export type SendMessageArgs = {
    // type: 'query' | 'mutation';
    destination: string;
    method: string;
    data: any;
};

export type Request = {
    method: string;
    data: any;
};

export type OnRequestCallback = (
    connection: Connection,
    request: Request,
) => void;

export type PendingRequest<T = unknown> = {
    resolve(value: T | PromiseLike<T>): void;
    reject(reason?: any): void;
};
