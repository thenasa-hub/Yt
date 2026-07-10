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

function validateDownloadRequest(req, res, next) {
  const { url, format, quality } = req.body || {};

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid YouTube URL.' });
  }

  const allowedFormats = ['mp3', 'mp4'];
  if (!allowedFormats.includes(String(format || '').toLowerCase())) {
    return res.status(400).json({ success: false, error: 'Format must be mp3 or mp4.' });
  }

  if (typeof quality !== 'string' || !quality.trim()) {
    return res.status(400).json({ success: false, error: 'Quality is required.' });
  }

  next();
}

module.exports = { validateDownloadRequest, isValidYouTubeUrl };
