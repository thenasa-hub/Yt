const express = require('express');
const downloadController = require('../controllers/downloadController');
const { validateDownloadRequest, validateAnalyzeRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Backend is healthy', timestamp: new Date().toISOString() });
});

router.post('/analyze', validateAnalyzeRequest, downloadController.analyzeVideo);
router.post('/download', validateDownloadRequest, downloadController.createDownload);
router.get('/status/:id', downloadController.getStatus);
router.get('/file/:id', downloadController.getFile);

module.exports = router;
