import { Registry, collectDefaultMetrics, Counter, Gauge, Histogram } from 'prom-client';

export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register, prefix: 'messenger_' });

// Active Sockets
export const activeSocketsGauge = new Gauge({
  name: 'messenger_active_sockets',
  help: 'Number of active socket connections',
  registers: [register],
});

// HTTP Request Duration
export const httpRequestDuration = new Histogram({
  name: 'messenger_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

// Redis Ops
export const redisCacheCounter = new Counter({
  name: 'messenger_redis_cache_ops_total',
  help: 'Total number of redis cache operations',
  labelNames: ['operation', 'result'], // e.g., 'get', 'hit' | 'miss'
  registers: [register],
});

// Database Query Duration
export const dbQueryDuration = new Histogram({
  name: 'messenger_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});
