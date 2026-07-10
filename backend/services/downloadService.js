const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

const jobs = new Map();

function ensureTempDir() {
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
  }
}

function createDownloadJob({ url, format, quality }) {
  ensureTempDir();

  const id = crypto.randomUUID();
  const fileName = `${id}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
  const filePath = path.join(config.tempDir, fileName);

  const job = {
    id,
    url,
    format,
    quality,
    status: 'queued',
    progress: 0,
    filePath,
    createdAt: new Date().toISOString()
  };

  jobs.set(id, job);

  setTimeout(() => {
    if (!jobs.has(id)) return;
    const currentJob = jobs.get(id);
    currentJob.status = 'processing';
    currentJob.progress = 25;
    jobs.set(id, currentJob);
  }, 200);

  setTimeout(() => {
    if (!jobs.has(id)) return;
    const currentJob = jobs.get(id);
    currentJob.status = 'processing';
    currentJob.progress = 75;
    jobs.set(id, currentJob);
  }, 1000);

  setTimeout(() => {
    if (!jobs.has(id)) return;
    const currentJob = jobs.get(id);
    currentJob.status = 'completed';
    currentJob.progress = 100;
    currentJob.completedAt = new Date().toISOString();
    fs.writeFileSync(filePath, `mock-${format}-${quality}-${Date.now()}`);
    jobs.set(id, currentJob);
    logger.info(`Download job ${id} completed`);
  }, 1800);

  return job;
}

function getJobStatus(id) {
  return jobs.get(id) || null;
}

function getFilePath(id) {
  const job = jobs.get(id);
  return job && job.status === 'completed' ? job.filePath : null;
}

function removeFile(id) {
  const job = jobs.get(id);
  if (!job) return;
  if (fs.existsSync(job.filePath)) {
    fs.unlinkSync(job.filePath);
  }
  jobs.delete(id);
}

module.exports = {
  createDownloadJob,
  getJobStatus,
  getFilePath,
  removeFile
};
