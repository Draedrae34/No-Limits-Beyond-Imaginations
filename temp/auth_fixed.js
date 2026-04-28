// /api/auth.js — Bulletproof Workshop Authentication
// No Limits Beyond Limitations — Silent Spirits Legacy
// ====================================================
// ✅ Works WITHOUT a database (env-var-only mode)
// ✅ Works WITH a database if DATABASE_URL is set
// ✅ Gracefully handles missing dependencies (bcryptjs, pg)
// ✅ Never crashes — every error path returns proper JSON
// ✅ Detailed server-side logging (not exposed to client)

// --- Safely load optional dependencies ---
let bcrypt = null;
let Pool = null;

try { bcrypt = require('bcryptjs'); } catch (e) {
  console.warn('[auth] bcryptjs not installed — env-var-only auth mode');
}

try { Pool = require('pg').Pool; } catch (e) {
  console.warn('[auth] pg not installed — skipping database auth');
}

// --- Database pool (only if pg is available AND DATABASE_URL is set) ---
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
    console.log('[auth] Database pool created');
  } catch (e) {
    console.error('[auth] Failed to create DB pool:', e.message);
    pool = null;
  }
}

module.exports = async (req, res) => {
  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // =====================
  //  GET — Check auth status
  // =====================
  if (req.method === 'GET') {
    const authToken = req.cookies?.nlbl_auth || req.headers['x-auth-token'];
    const isAuth = authToken === (process.env.SESSION_SECRET || 'nlbl-authenticated');
    return res.status(200).json({ authenticated: isAuth });
  }

  // =====================
  //  POST — Login
  // =====================
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body || {};

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required.'
        });
      }

      // AUTH METHOD 1: Environment variable (always available)
      const adminPass = process.env.QUANTUM_ADMIN_PASS;

      if (adminPass && password === adminPass) {
        console.log('[auth] ✅ Authenticated via QUANTUM_ADMIN_PASS');
        return sendAuthSuccess(res, email || 'admin');
      }

      // AUTH METHOD 2: Database lookup (only if DB is configured)
      if (pool && bcrypt && email) {
        try {
          const result = await pool.query(
            'SELECT email, password_hash FROM admins WHERE email = $1',
            [email]
          );

          if (result.rows.length > 0) {
            const admin = result.rows[0];
            const match = await bcrypt.compare(password, admin.password_hash);

            if (match) {
              console.log('[auth] ✅ Authenticated via database:', email);
              return sendAuthSuccess(res, email);
            } else {
              console.log('[auth] ❌ DB password mismatch for:', email);
              return res.status(401).json({
                success: false,
                error: 'Invalid credentials.'
              });
            }
          } else {
            console.log('[auth] ❌ Email not found in DB:', email);
          }
        } catch (dbErr) {
          console.error('[auth] ⚠️ Database query failed:', dbErr.message);
          console.error('[auth] Falling through to auth failure (DB unavailable)');
        }
      } else {
        if (!pool) console.log('[auth] ℹ️ No database pool — skipping DB auth');
        if (!bcrypt) console.log('[auth] ℹ️ bcryptjs not available — skipping DB auth');
        if (!email) console.log('[auth] ℹ️ No email provided — skipping DB auth');
      }

      // Nothing matched
      if (!adminPass) {
        console.error('[auth] ⚠️ QUANTUM_ADMIN_PASS is NOT set!');
        return res.status(500).json({
          success: false,
          error: 'Workshop login is not configured. Please set QUANTUM_ADMIN_PASS in Vercel environment variables.'
        });
      }

      console.log('[auth] ❌ Invalid credentials');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.'
      });

    } catch (err) {
      console.error('[auth] 💥 Unexpected error:', err.message);
      console.error('[auth] Stack:', err.stack);
      return res.status(500).json({
        success: false,
        error: 'Server error. Check Vercel function logs for details.'
      });
    }
  }

  // =====================
  //  DELETE — Logout
  // =====================
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', 'nlbl_auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    return res.status(200).json({ success: true, message: 'Logged out.' });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};

function sendAuthSuccess(res, email) {
  const token = process.env.SESSION_SECRET || 'nlbl-authenticated';
  res.setHeader('Set-Cookie',
    `nlbl_auth=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
  );
  return res.status(200).json({
    success: true,
    message: 'Welcome to the Workshop.',
    user: email
  });
}
