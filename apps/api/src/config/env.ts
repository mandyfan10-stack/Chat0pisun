import dotenv from 'dotenv';

dotenv.config();

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:19006',
];

const nodeEnv = process.env.NODE_ENV ?? 'development';
const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
process.env.DATABASE_URL = databaseUrl;

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

const s3Enabled = process.env.S3_ENABLED === 'true';
const s3Region = process.env.S3_REGION ?? 'us-east-1';
const s3Bucket = process.env.S3_BUCKET ?? '';
const s3Endpoint = process.env.S3_ENDPOINT;
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const s3PublicUrl = process.env.S3_PUBLIC_URL;

const jwtSecret =
  process.env.JWT_SECRET ??
  (nodeEnv === 'test' ? 'test-jwt-secret-with-enough-length' : undefined);

if (!jwtSecret || jwtSecret.length < 16) {
  throw new Error('JWT_SECRET must be set to a long random value.');
}

const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('PORT must be a positive integer.');
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  nodeEnv,
  isTest: nodeEnv === 'test',
  port,
  databaseUrl,
  redisUrl,
  s3: {
    enabled: s3Enabled,
    region: s3Region,
    bucket: s3Bucket,
    endpoint: s3Endpoint,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
    publicUrl: s3PublicUrl,
  },
  jwtSecret,
  allowedOrigins,
  accessTokenExpiresIn: '15m' as const,
  refreshTokenExpiresDays: 30,
  authRateLimitWindowMs: 15 * 60 * 1000,
  authRateLimitMax: 60,
};
