export function createBaseRepository(model) {
  return {
    create: (payload) => model.create(payload),
    findById: (id) => model.findById(id),
    findOne: (filter) => model.findOne(filter),
    find: (filter = {}, options = {}) => {
      const query = model.find(filter);
      if (options.sort) query.sort(options.sort);
      if (options.skip !== undefined) query.skip(options.skip);
      if (options.limit !== undefined) query.limit(options.limit);
      return query;
    },
    countDocuments: (filter = {}) => model.countDocuments(filter),
    updateById: (id, payload) => model.findByIdAndUpdate(id, payload, { new: true, runValidators: true }),
    deleteById: (id) => model.findByIdAndDelete(id),
  };
}
