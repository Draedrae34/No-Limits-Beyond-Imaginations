import pool from '../src/utils/db.js';

export async function auditLog(req, user, action, meta = {}) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || '';
    await pool.query(
      `INSERT INTO action_logs (user_email, action, outcome, ip, user_agent, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [user || 'unknown', action, meta?.result || null, ip, ua, JSON.stringify(meta || {})]
    );
  } catch (err) {
    // Non-fatal: log and continue
    console.error('auditLog failed:', err?.message || err);
  }
}
