const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;
  fs.appendFileSync(path.join(logDir, 'app.log'), entry, 'utf8');
  console.log(entry.trim());
}

module.exports = {
  info(message) { writeLog('info', message); },
  warn(message) { writeLog('warn', message); },
  error(message) { writeLog('error', message); }
};
