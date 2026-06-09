import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function getAction(req) {
  try {
    return new URL(req.url, `https://${req.headers.host}`).searchParams.get('action');
  } catch {
    return null;
  }
}

function setAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  res.setHeader('Set-Cookie', `nlbl_auth=authenticated; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'nlbl_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

function getConfiguredPassword() {
  return process.env.WORKSHOP_OVERRIDE_PASSWORD || process.env.WORKSHOP_PASSWORD || '';
}

function getResetCode() {
  return process.env.WORKSHOP_RESET_CODE || '';
}

function persistWorkshopPassword(password) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    const updated = lines.map((line) => {
      if (line.startsWith('WORKSHOP_PASSWORD=')) {
        return `WORKSHOP_PASSWORD=${password}`;
      }
      return line;
    });

    if (!updated.some((line) => line.startsWith('WORKSHOP_PASSWORD='))) {
      updated.push(`WORKSHOP_PASSWORD=${password}`);
    }

    fs.writeFileSync(envPath, updated.join('\n'));
  } catch {
    // Ignore persistence failures; runtime override still allows the reset.
  }
}

export default function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const action = getAction(req);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const cookies = req.headers.cookie || '';
    const authenticated = cookies.split(';').some((c) => c.trim() === 'nlbl_auth=authenticated');
    return res.status(200).json({ authenticated });
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
    const password = body.password || '';
    const configuredPassword = getConfiguredPassword();
    const loginAction = action === 'login' || body.action === 'login' || !action;

    if (action === 'reset' || body.action === 'reset') {
      const resetCode = body.resetCode || req.headers['x-workshop-reset-code'] || '';
      const configuredResetCode = getResetCode();

      if (!configuredResetCode) {
        return res.status(500).json({ success: false, message: 'Password reset is not configured. Set WORKSHOP_RESET_CODE.' });
      }

      if (resetCode !== configuredResetCode) {
        return res.status(403).json({ success: false, message: 'Invalid reset code.' });
      }

      const newPassword = body.newPassword || '';
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New workshop password must be at least 6 characters.' });
      }

      process.env.WORKSHOP_OVERRIDE_PASSWORD = newPassword;
      persistWorkshopPassword(newPassword);

      return res.status(200).json({ success: true, message: 'Workshop password reset for this runtime.' });
    }

    if (action === 'logout' || action === 'signout' || body.action === 'logout') {
      clearAuthCookie(res);
      return res.status(200).json({ success: true, message: 'Logged out.' });
    }

    if (!loginAction) {
      return res.status(400).json({ success: false, message: 'Invalid auth action.' });
    }

    if (!configuredPassword) {
      return res.status(500).json({ success: false, message: 'Workshop password is not configured. Set WORKSHOP_PASSWORD.' });
    }

    if (password !== configuredPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    setAuthCookie(res);
    return res.status(200).json({ success: true, message: 'Authenticated.' });
  }

  if (req.method === 'DELETE') {
    clearAuthCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out.' });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};
