export function buildSearchFilter(search, fields = []) {
  if (!search) return {};
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    })),
  };
}

export function buildListQuery({ search, filters = {}, sortBy = '-createdAt' }, searchableFields = []) {
  return {
    filter: {
      ...filters,
      ...buildSearchFilter(search, searchableFields),
    },
    sort: sortBy,
  };
}
