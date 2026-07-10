const downloadService = require('../services/downloadService');

function analyzeVideo(req, res, next) {
  try {
    const result = downloadService.analyzeVideo(req.body.url);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

function createDownload(req, res, next) {
  try {
    const { url, selectedFormat, quality, fileType } = req.body;
    const job = downloadService.createDownloadJob({ url, selectedFormat, quality, fileType });
    res.status(202).json({ success: true, data: { id: job.id, status: job.status, progress: job.progress } });
  } catch (error) {
    next(error);
  }
}

function getStatus(req, res, next) {
  try {
    const job = downloadService.getJobStatus(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

function getFile(req, res, next) {
  try {
    const filePath = downloadService.getFilePath(req.params.id);
    if (!filePath) {
      return res.status(404).json({ success: false, error: 'File not ready or not found.' });
    }

    res.download(filePath, (err) => {
      if (err) {
        return next(err);
      }
      downloadService.removeFile(req.params.id);
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeVideo,
  createDownload,
  getStatus,
  getFile
};
