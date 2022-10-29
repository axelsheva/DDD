type DBTable = {
    get<T = any>(id: number): Promise<T>;
};

declare const db: (table: string) => DBTable;
declare const transport: {
    query: any;
};
declare const utils: {
    sleep: (ms: number) => Promise<void>;
};

type Routing = Record<string, Record<string, Function | undefined>>;

type SandboxConfig = { timeout: number; displayErrors: boolean };

type Config = {
    db: { url: string };
    messageBroker: { url: string; timeout: number };
    service: { name: string; instanceId: string };
    api: { port: number };
    sandbox: SandboxConfig;
};
