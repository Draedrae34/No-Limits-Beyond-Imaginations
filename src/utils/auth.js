export async function verifyAdmin(req) {
  const cookies = req.headers.cookie || '';
  if (cookies.split(';').some((c) => c.trim() === 'nlbl_auth=authenticated')) {
    return true;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return Boolean(token && process.env.ADMIN_API_TOKEN && token === process.env.ADMIN_API_TOKEN);
}
