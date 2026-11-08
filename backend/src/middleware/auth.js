import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from './errors.js';

export function signToken(user) {
  return jwt.sign({ role: user.role, name: user.name }, config.jwtSecret, {
    subject: String(user._id),
    expiresIn: config.jwtExpires
  });
}

function readUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    return { id: payload.sub, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

/** Attaches req.user when a valid token is present, but never rejects. */
export function optionalAuth(req, res, next) {
  req.user = readUser(req);
  next();
}

export function requireAuth(req, res, next) {
  req.user = readUser(req);
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue'));
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') return next(new HttpError(403, 'Admin access required'));
    next();
  });
}
