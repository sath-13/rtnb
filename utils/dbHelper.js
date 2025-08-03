export const findOrCreate = async (Model, query, data) => {
    try {
        const existing = await Model.findOne(query);
        if (existing) return existing._id;

        const newDocument = new Model(data);
        await newDocument.save();
        return newDocument._id;
    } catch (error) {
        console.error(`Error in findOrCreate (${Model.modelName}):`, error);
        throw error;
    }
};
