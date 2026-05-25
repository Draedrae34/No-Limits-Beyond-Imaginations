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
    const body = req.body || {};
    const password = (body.password || "").trim();
    const email = body.email || "";
    const adminPass = (process.env.QUANTUM_ADMIN_PASS || "").trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (!password) {
      return res.status(400).json({ success: false, error: "Password is required." });
    }

    // Temporary bypass: Allowing any login attempt to succeed.
    res.setHeader("Set-Cookie", `nlbl_auth=authenticated; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${isProd ? '; Secure' : ''}`);
    return res.status(200).json({ success: true, message: "Bypass active. Welcome.", user: email || "admin" });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", "nlbl_auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
    return res.status(200).json({ success: true, message: "Logged out." });
  }

  return res.status(405).json({ error: "Method not allowed." });
};
