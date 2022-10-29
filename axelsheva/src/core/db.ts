export default (table: string): DBTable => ({
    get: async <T>(id: number) => {
        return 'hello world!' as T;
    },
});
