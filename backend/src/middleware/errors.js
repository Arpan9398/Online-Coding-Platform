import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Lets async route handlers throw; Express 4 needs the rejection forwarded to next(). */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ message: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const fieldErrors = {};
    for (const issue of err.issues) fieldErrors[issue.path.join('.') || 'body'] ??= issue.message;
    return res.status(400).json({ message: 'Validation failed', fieldErrors });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: 'That value is already in use' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body is not valid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}
