({
    get: async (id: number) => {
        return await db('user').get(id);
    },
});
