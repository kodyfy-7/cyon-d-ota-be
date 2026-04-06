exports.pagination = ({ page = 1, perPage = 25 }) => {
  const offset = (page - 1) * perPage;
  const limit = perPage;

  return { offset, limit };
};

exports.paginationLink = ({ page = 1, perPage = 50, total }) => {
  // Prepare Paginationation Links
  const lastPage = Math.ceil(total / Number(perPage));

  let nextPage = Number(page) + 1;

  let prevPage = Number(page) - 1;
  const from = prevPage * Number(perPage) + 1;
  const to = Number(
    total < Number(perPage)
      ? total
      : prevPage * Number(perPage) + Number(perPage)
  );

  if (prevPage < 1) {
    prevPage = null;
  }
  if (nextPage > lastPage) {
    nextPage = null;
  }

  return {
    total,
    page,
    lastPage,
    nextPage,
    prevPage,
    from,
    to,
    perPage
  };
};

exports.sortList = ({ sort, sortBy, order = "DESC" }) => {
  // Single column sorting
  if (sortBy) {
    return [[sortBy, order]];
  }

  // Multiple columns sorting
  if (sort) {
    return sort.split(",").map(item => item.split(":"));
  }

  // Default sorting
  return [];
};
