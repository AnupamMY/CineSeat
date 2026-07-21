export const notFound = (req, res) =>
  res.status(404).json({ success: false, message: "Route not found" });

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error?.code === 11000)
    return res
      .status(409)
      .json({ success: false, message: "That record already exists" });
  const status = error.statusCode || 500;
  if (status >= 500) console.error(error);
  res
    .status(status)
    .json({
      success: false,
      message: status >= 500 ? "Internal server error" : error.message,
      details: error.details,
    });
}
