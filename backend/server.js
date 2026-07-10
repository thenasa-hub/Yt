const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const logger = require('./utils/logger');
const { helmetMiddleware, corsMiddleware, limiter } = require('./middleware/security');
const requestLogger = require('./middleware/requestLogger');
const sanitize = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const staticDir = path.join(__dirname, '..');

if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(requestLogger);
app.use(sanitize);

app.use(express.static(staticDir));
app.use('/api', routes);

app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  logger.info('Shutting down server');
  server.close(() => {
    process.exit(0);
  });
}
