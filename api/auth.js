import bcrypt from "bcryptjs";
import pool from "../src/utils/db.js";
import { clearSessionCookie, getSessionFromReq, setSessionCookie } from "../src/utils/session.js";

function getAction(req) {
  return (req.query?.action || req.body?.action || "").toLowerCase();
}

export default async function handler(req, res) {
  const action = getAction(req);

  if (req.method === "GET") {
    if (action && action !== "verify") {
      return res.status(400).json({ success: false, error: "Invalid action for GET." });
    }

    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ authenticated: false });
    }
    return res.status(200).json({ authenticated: true, email: session.email });
  }

  if (req.method === "POST") {
    if (!action || action === "login") {
      const { email, password } = req.body || {};

      if (!password) {
        return res.status(400).json({ success: false, error: "Password required." });
      }

      if (email) {
        try {
          const result = await pool.query("SELECT email, password_hash FROM admins WHERE email = $1", [email]);
          if (!result.rows.length) {
            return res.status(401).json({ success: false, error: "Invalid credentials." });
          }

          const admin = result.rows[0];
          const ok = await bcrypt.compare(password, admin.password_hash);
          if (!ok) {
            return res.status(401).json({ success: false, error: "Invalid credentials." });
          }

          setSessionCookie(res, admin.email);
          return res.status(200).json({ success: true, authenticated: true, email: admin.email });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: "Server error." });
        }
      }

      const expected = process.env.QUANTUM_ADMIN_PASS || "legendary";
      if (password === expected) {
        setSessionCookie(res, "legacy-admin@silentspirits.local");
        return res.status(200).json({ success: true, authenticated: true });
      }

      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    if (action === "logout") {
      clearSessionCookie(res);
      return res.status(200).json({ success: true });
    }

    if (action === "verify") {
      const session = getSessionFromReq(req);
      if (!session) {
        return res.status(401).json({ authenticated: false });
      }
      return res.status(200).json({ authenticated: true, email: session.email });
    }

    return res.status(400).json({ success: false, error: "Unknown action." });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
