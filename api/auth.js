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
    const configuredPassword = process.env.WORKSHOP_PASSWORD || '';
    const loginAction = action === 'login' || body.action === 'login' || !action;

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
