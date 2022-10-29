type DBTable = {
    get<T = any>(id: number): Promise<T>;
};

declare const db: (table: string) => DBTable;
declare const transport: {
    query: any;
};

declare var dbTable: DBTable;

type Routing = Record<string, Record<string, Function | undefined>>;

type Config = {
    db: { url: string };
    transport: { url: string; timeout: number };
    service: { name: string; instanceId: string };
};
