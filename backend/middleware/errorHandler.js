const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Terjadi kesalahan pada server.',
    ...(process.env.NODE_ENV !== 'production' && { error: err })
  });
};

module.exports = errorHandler;
