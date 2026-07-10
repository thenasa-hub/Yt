const { URL } = require('url');

function isValidYouTubeUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be');
  } catch {
    return false;
  }
}

function validateAnalyzeRequest(req, res, next) {
  const { url } = req.body || {};
  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid YouTube URL.' });
  }
  next();
}

function validateDownloadRequest(req, res, next) {
  const { url, selectedFormat, quality, fileType } = req.body || {};

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid YouTube URL.' });
  }

  const allowedSelectedFormats = ['video', 'audio'];
  const normalizedSelectedFormat = String(selectedFormat || 'video').toLowerCase();
  if (!allowedSelectedFormats.includes(normalizedSelectedFormat)) {
    return res.status(400).json({ success: false, error: 'Selected format must be video or audio.' });
  }

  if (typeof quality !== 'string' || !quality.trim()) {
    return res.status(400).json({ success: false, error: 'Quality is required.' });
  }

  const allowedFileTypes = ['mp4', 'mp3', 'm4a', 'webm'];
  const normalizedFileType = String(fileType || (normalizedSelectedFormat === 'audio' ? 'mp3' : 'mp4')).toLowerCase();
  if (!allowedFileTypes.includes(normalizedFileType)) {
    return res.status(400).json({ success: false, error: 'File type is not supported.' });
  }

  req.body.selectedFormat = normalizedSelectedFormat;
  req.body.fileType = normalizedFileType;
  next();
}

module.exports = { validateAnalyzeRequest, validateDownloadRequest, isValidYouTubeUrl };
