export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Temporary bypass: Always reporting as authenticated.
    return res.status(200).json({ authenticated: true });
  }

  if (req.method === "POST") {
    const isProd = process.env.NODE_ENV === 'production';

    // MASTER BYPASS: Grant the cookie regardless of input.
    res.setHeader("Set-Cookie", `nlbl_auth=authenticated; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${isProd ? '; Secure' : ''}`);
    return res.status(200).json({ success: true, message: "Bypass active. Welcome." });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", "nlbl_auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
    return res.status(200).json({ success: true, message: "Logged out." });
  }

  return res.status(405).json({ error: "Method not allowed." });
};
