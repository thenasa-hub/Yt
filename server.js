const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve frontend static files from project root (index.html, script.js, styles.css)
app.use(express.static(path.join(__dirname)));

// Sample API endpoints
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend' });
});

app.post('/api/echo', (req, res) => {
  res.json({ youSent: req.body });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
