const user = db('user');

({
    get: async (id: number) => {
        return await user.get(id);
    },
});
