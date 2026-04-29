export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const cookies = req.headers.cookie || "";
    const isAuthenticated = cookies.split(';').some(c => c.trim() === 'nlbl_auth=authenticated');
    return res.status(200).json({ authenticated: isAuthenticated });
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const password = body.password || "";
    const email = body.email || "";
    const adminPass = process.env.QUANTUM_ADMIN_PASS || "";

    if (!password) {
      return res.status(400).json({ success: false, error: "Password is required." });
    }

    if (adminPass && password === adminPass) {
      res.setHeader("Set-Cookie", "nlbl_auth=authenticated; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400; Secure");
      return res.status(200).json({ success: true, message: "Welcome to the Workshop.", user: email || "admin" });
    }

    if (!adminPass) {
      return res.status(500).json({ success: false, error: "Workshop login not configured. Set QUANTUM_ADMIN_PASS in Vercel env vars." });
    }

    return res.status(401).json({ success: false, error: "Invalid credentials." });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", "nlbl_auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
    return res.status(200).json({ success: true, message: "Logged out." });
  }

  return res.status(405).json({ error: "Method not allowed." });
};
