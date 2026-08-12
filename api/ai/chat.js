import { verifyAdmin } from '../src/utils/auth.js';
import { auditLog } from '../../src/utils/audit.js';
import { allowRequest } from '../../src/utils/rate_limiter.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export default async function handler(req, res) {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ success: false, error: 'Authentication required' });
    }

    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const body = req.body || {};
    const messages = body.messages || (body.message ? [{ role: 'user', content: String(body.message) }] : []);
    // Rate limiting by IP (admin access still limited)
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const rlKey = `ai:chat:${ip}`;
    const rl = allowRequest(rlKey);
    if (!rl.allowed) {
      await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.chat.rate_limited', { remaining: rl.remaining }).catch(()=>{});
      return res.status(429).json({ success: false, error: 'Rate limit exceeded. Try again later.' });
    }
    await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.chat.request', { messageSize: String(messages.map(m=>m.content).join('\n').length) }).catch(()=>{});

    if (!OPENAI_API_KEY) {
      // no key configured, fallback to canned reply via persona
      const { buildLilMysticCreativeReply } = await import('../src/lil-mystic-persona.js');
      const reply = buildLilMysticCreativeReply(messages.map(m => m.content).join('\n'));
      await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.chat.fallback', { replyLength: String((reply||'').length) }).catch(()=>{});
      return res.status(200).json({ success: true, reply });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        max_tokens: 512,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenAI error:', response.status, text);
      return res.status(500).json({ success: false, error: 'OpenAI error' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || null;
    await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.chat.reply', { replyLength: String((reply||'').length) }).catch(()=>{});
    return res.status(200).json({ success: true, reply, raw: data });
  } catch (err) {
    console.error('AI chat handler error:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
}
