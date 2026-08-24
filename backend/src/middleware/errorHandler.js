/**
 * Express recognises a middleware with FOUR arguments as an error handler.
 * Anything passed to next(err), or thrown in an async route that calls next(err),
 * lands here instead of crashing the process.
 */
function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong on the server",
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;