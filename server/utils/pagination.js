function getPagination(query, defaultLimit = 10) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function getSort(query, allowed, fallback, fallbackOrder = 'desc') {
  const field = allowed.includes(query.sort) ? query.sort : fallback;
  const order = query.order === 'asc' || query.order === 'desc' ? query.order : fallbackOrder;
  return { [field]: order === 'asc' ? 1 : -1 };
}

module.exports = { getPagination, getSort };
