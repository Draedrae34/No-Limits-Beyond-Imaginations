export function isAuthCookieValid(req) {
  const cookies = req.headers.cookie || '';
  return cookies.split(';').some((c) => c.trim() === 'nlbl_auth=authenticated');
}

export function isBearerTokenValid(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const validTokens = [process.env.ADMIN_API_TOKEN, process.env.WORKSHOP_INTERNAL_TOKEN].filter(Boolean);
  return Boolean(token && validTokens.includes(token));
}

export async function verifyAdmin(req) {
  if (isAuthCookieValid(req)) return true;
  return isBearerTokenValid(req);
}
