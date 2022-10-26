export type Routing = Record<string, Function | undefined>;

export type ServerRouting = {
    query?: Routing;
    event?: Routing;
};
