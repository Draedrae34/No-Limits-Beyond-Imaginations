let bcrypt = null;
let Pool = null;

try {
  bcrypt = require("bcryptjs");
} catch (e) {
  console.warn("[auth] bcryptjs not installed");
}

try {
  Pool = require("pg").Pool;
} catch (e) {
  console.warn("[auth] pg not installed");
}

let pool = null;
if (Pool && process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 3
    });
  } catch (e) {
    console.error("[auth] Pool creation failed:", e.message);
    pool = null;
  }
}

function sendAuthSuccess(res, email) {
  var token = process.env.SESSION_SECRET || "nlbl-authenticated";
  res.setHeader("Set-Cookie", "nlbl_auth=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400");
  return res.status(200).json({
    success: true,
    message: "Welcome to the Workshop.",
    user: email
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    var authToken = null;
    if (req.cookies && req.cookies.nlbl_auth) {
      authToken = req.cookies.nlbl_auth;
    } else if (req.headers && req.headers["x-auth-token"]) {
      authToken = req.headers["x-auth-token"];
    }
    var expected = process.env.SESSION_SECRET || "nlbl-authenticated";
    return res.status(200).json({ authenticated: authToken === expected });
  }

  if (req.method === "POST") {
    try {
      var body = req.body || {};
      var email = body.email || "";
      var password = body.password || "";

      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Password is required."
        });
      }

      var adminPass = process.env.QUANTUM_ADMIN_PASS;

      if (adminPass && password === adminPass) {
        console.log("[auth] Authenticated via QUANTUM_ADMIN_PASS");
        return sendAuthSuccess(res, email || "admin");
      }

      if (pool && bcrypt && email) {
        try {
          var result = await pool.query(
            "SELECT email, password_hash FROM admins WHERE email = $1",
            [email]
          );
          if (result.rows.length > 0) {
            var match = await bcrypt.compare(password, result.rows[0].password_hash);
            if (match) {
              console.log("[auth] Authenticated via database:", email);
              return sendAuthSuccess(res, email);
            }
            console.log("[auth] DB password mismatch for:", email);
            return res.status(401).json({
              success: false,
              error: "Invalid credentials."
            });
          }
          console.log("[auth] Email not found in DB:", email);
        } catch (dbErr) {
          console.error("[auth] DB query failed:", dbErr.message);
        }
      }

      if (!adminPass) {
        console.error("[auth] QUANTUM_ADMIN_PASS is NOT set!");
        return res.status(500).json({
          success: false,
          error: "Workshop login not configured. Set QUANTUM_ADMIN_PASS in Vercel env vars."
        });
      }

      console.log("[auth] Invalid credentials");
      return res.status(401).json({
        success: false,
        error: "Invalid credentials."
      });

    } catch (err) {
      console.error("[auth] Unexpected error:", err.message);
      return res.status(500).json({
        success: false,
        error: "Server error. Check Vercel function logs."
      });
    }
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", "nlbl_auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
    return res.status(200).json({ success: true, message: "Logged out." });
  }

  return res.status(405).json({ error: "Method not allowed." });
};
