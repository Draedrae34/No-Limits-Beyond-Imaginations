const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const API_DIR = path.join(__dirname, 'api');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    // Basic API support for CommonJS static server.
    // Playwright tests hit: /api/payments
    if (req.url && req.url.startsWith('/api/')) {
      const apiName = req.url.replace(/^\/api\//, '').split('?')[0];
      // Expect: /api/payments -> api/payments.js
      const handlerPath = path.join(API_DIR, `${apiName}.js`);

      if (!fs.existsSync(handlerPath)) {
        return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' });
      }

      // Convert incoming request to a Next-like signature: (req, res)
      // but implement it minimally for our tests.
      const rawBody = await readBody(req);
      let jsonBody = undefined;
      if (rawBody && rawBody.length) {
        try {
          jsonBody = JSON.parse(rawBody);
        } catch {
          // ignore
        }
      }

      // Load handler as ESM (project uses type: module)
      const mod = await import(pathToFileUrl(handlerPath));
      const handler = mod.default;

      // Provide minimal fetch-like req/res objects.
      const apiReq = {
        method: req.method,
        headers: req.headers,
        body: jsonBody
      };

      const apiRes = {
        setHeader: (...args) => res.setHeader?.(...args),
        status(code) {
          res.statusCode = code;
          return {
            json(payload) {
              res.writeHead(code, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(payload));
            }
          };
        },
        json(payload) {
          res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(payload));
        },
        end(body) {
          res.end(body);
        }
      };

      await handler(apiReq, apiRes);
      return;

    }

    // Static files
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(PUBLIC_DIR, requestPath === '/' ? 'index.html' : requestPath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (err) {
    console.error('Server error:', err);
    send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain' });
  }
});

function pathToFileUrl(p) {
  let absolute = p;
  // windows -> file:///<path>
  absolute = absolute.replace(/\\/g, '/');
  if (!absolute.startsWith('/')) absolute = '/' + absolute;
  return `file://${absolute}`;
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

