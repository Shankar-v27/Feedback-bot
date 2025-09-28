export function notFound (req, res, next) {
  res.status(404).json({ error: 'Not Found' })
}

export function errorHandler (err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500
  const payload = {
    error: err.message || 'Internal Server Error'
  }
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack
  }
  res.status(status).json(payload)
}
