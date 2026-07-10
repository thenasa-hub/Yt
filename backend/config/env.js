const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 60),
  downloadTimeoutMs: Number(process.env.DOWNLOAD_TIMEOUT_MS || 60000),
  tempDir: process.env.TEMP_DIR || path.join(__dirname, '..', 'temp'),
  apiKey: process.env.API_KEY || 'demo-api-key',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret'
};
