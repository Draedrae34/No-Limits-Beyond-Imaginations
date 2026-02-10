const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function generateToken(username) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    username,
    exp: Date.now() + TOKEN_EXPIRY,
    iat: Date.now()
  })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    const payloadData = JSON.parse(Buffer.from(payload, 'base64url'));
    if (Date.now() > payloadData.exp) return null;
    
    return payloadData;
    } catch (error) {
        return null;
    }
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!JWT_SECRET || !ADMIN_PASSWORD) {
    return res.status(500).json({
      success: false,
      error: 'Server auth not configured (set JWT_SECRET and ADMIN_PASSWORD).'
    });
  }

  try {
    const { action, username, password, token } = req.body;

    if (action === 'login') {
      if (username === 'admin' && password === ADMIN_PASSWORD) {
        const newToken = generateToken(username);
        return res.status(200).json({
          success: true,
          token: newToken,
          user: { username, role: 'admin' }
        });
      }
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (action === 'verify') {
      const payload = verifyToken(token);
      if (payload) {
        return res.status(200).json({ success: true, user: payload });
      }
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    if (action === 'logout') {
      return res.status(200).json({ success: true, message: 'Logged out' });
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch {
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

module.exports = handler;
module.exports.default = handler;
