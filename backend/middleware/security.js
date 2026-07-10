const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config/env');

const corsMiddleware = cors({
  origin: config.corsOrigin.split(',').map((item) => item.trim()),
  methods: ['GET', 'POST'],
  credentials: true
});

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

module.exports = {
  helmetMiddleware: helmet(),
  corsMiddleware,
  limiter
};
