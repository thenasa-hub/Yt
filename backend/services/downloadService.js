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

function analyzeVideo(url) {
  const parsedUrl = new URL(url);
  const videoId = parsedUrl.searchParams.get('v') || 'demo';
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    title: 'The Future of Premium Downloads',
    thumbnail,
    channelName: 'Studio Nine',
    duration: '06:42',
    views: '1.2M',
    uploadDate: '2 weeks ago',
    videoFormats: [
      { label: '2160p (4K)', quality: '2160p', fileType: 'mp4', size: '~320 MB', audio: 'AAC' },
      { label: '1440p', quality: '1440p', fileType: 'mp4', size: '~220 MB', audio: 'AAC' },
      { label: '1080p', quality: '1080p', fileType: 'mp4', size: '~180 MB', audio: 'AAC' },
      { label: '720p', quality: '720p', fileType: 'mp4', size: '~100 MB', audio: 'AAC' },
      { label: '480p', quality: '480p', fileType: 'mp4', size: '~70 MB', audio: 'AAC' }
    ],
    audioFormats: [
      { label: 'MP3 320 kbps', format: 'MP3', bitrate: '320 kbps', size: '~9.4 MB', fileType: 'mp3' },
      { label: 'MP3 256 kbps', format: 'MP3', bitrate: '256 kbps', size: '~7.4 MB', fileType: 'mp3' },
      { label: 'MP3 192 kbps', format: 'MP3', bitrate: '192 kbps', size: '~5.6 MB', fileType: 'mp3' },
      { label: 'MP3 128 kbps', format: 'MP3', bitrate: '128 kbps', size: '~3.7 MB', fileType: 'mp3' },
      { label: 'M4A', format: 'M4A', bitrate: '256 kbps', size: '~6.4 MB', fileType: 'm4a' },
      { label: 'WebM Audio', format: 'WebM', bitrate: '160 kbps', size: '~4.4 MB', fileType: 'webm' }
    ]
  };
}

function createDownloadJob({ url, selectedFormat, quality, fileType }) {
  ensureTempDir();

  const id = crypto.randomUUID();
  const extension = String(fileType || (selectedFormat === 'audio' ? 'mp3' : 'mp4')).toLowerCase();
  const fileName = `${id}.${extension}`;
  const filePath = path.join(config.tempDir, fileName);

  const job = {
    id,
    url,
    selectedFormat,
    quality,
    fileType: extension,
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
    fs.writeFileSync(filePath, `mock-${selectedFormat}-${quality}-${Date.now()}`);
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
  analyzeVideo,
  createDownloadJob,
  getJobStatus,
  getFilePath,
  removeFile
};
