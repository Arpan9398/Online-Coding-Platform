import 'dotenv/config';

const DEV_SECRET = 'dev-only-secret-change-me-before-deploying-1234567890';

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coding_platform',
  jwtSecret: process.env.JWT_SECRET || DEV_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || '12h',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  judgeConcurrency: Number(process.env.JUDGE_CONCURRENCY) || 2
};

if (process.env.NODE_ENV === 'production' && config.jwtSecret === DEV_SECRET) {
  throw new Error('Set JWT_SECRET before running in production.');
}
