const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');

function requestJson(method, path, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const payload = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
              }
            : undefined
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            server.close();
            resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : null });
          });
        }
      );
      req.on('error', (error) => {
        server.close();
        reject(error);
      });
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

test('analyze endpoint returns metadata and format options', async () => {
  const response = await requestJson('POST', '/api/analyze', {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.title);
  assert.ok(response.body.data.thumbnail);
  assert.ok(Array.isArray(response.body.data.videoFormats));
  assert.ok(Array.isArray(response.body.data.audioFormats));
});

test('download endpoint accepts a selected quality and file type', async () => {
  const response = await requestJson('POST', '/api/download', {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    selectedFormat: 'video',
    quality: '1080p',
    fileType: 'mp4'
  });

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.id);
});
