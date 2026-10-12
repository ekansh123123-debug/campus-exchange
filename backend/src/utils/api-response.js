export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginated(res, data, meta, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: Math.max(1, Math.ceil(meta.total / meta.limit)),
    },
  });
}
