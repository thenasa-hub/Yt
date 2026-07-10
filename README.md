# Yt Backend

Minimal Node.js + Express backend to serve the frontend and provide example API endpoints.

Run locally:

```bash
npm install
npm start
```

Endpoints:
- `GET /api/hello` — returns a greeting JSON
- `POST /api/echo` — echoes posted JSON

The server serves static files from project root, so the existing `index.html`, `script.js`, and `styles.css` will be available.
