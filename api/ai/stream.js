import { verifyAdmin } from '../src/utils/auth.js';
import { auditLog } from '../../src/utils/audit.js';
import { allowRequest } from '../../src/utils/rate_limiter.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ success: false, error: 'Authentication required' });
    }

    // Rate limiting by IP
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const rlKey = `ai:stream:${ip}`;
    const rlCheck = allowRequest(rlKey);
    if (!rlCheck.allowed) {
      // send SSE error and close
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      sendSSE(res, 'error', { error: 'Rate limit exceeded. Try again later.' });
      sendSSE(res, 'done', { success: false });
      await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.stream.rate_limited', { remaining: rlCheck.remaining }).catch(()=>{});
      return res.end();
    }
    await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.stream.request', { method: req.method }).catch(()=>{});
    // messages can be sent in POST body or as query param 'message'
    let messages = [];
    if (req.method === 'POST') {
      messages = req.body?.messages || (req.body?.message ? [{ role: 'user', content: String(req.body.message) }] : []);
    } else {
      const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      const m = url.searchParams.get('message');
      if (m) messages = [{ role: 'user', content: m }];
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!OPENAI_API_KEY) {
      // Fallback: send single canned reply and finish
      const { buildLilMysticCreativeReply } = await import('../src/lil-mystic-persona.js');
      const reply = buildLilMysticCreativeReply(messages.map(m => m.content).join('\n'));
      sendSSE(res, 'token', { token: reply });
      await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.stream.fallback', { replyLength: String((reply||'').length) }).catch(()=>{});
      sendSSE(res, 'done', { success: true });
      return res.end();
    }

    // Build OpenAI streaming request
    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: 800,
        temperature: 0.9,
        stream: true
      }),
    });

    if (!openaiResp.ok || !openaiResp.body) {
      const txt = await openaiResp.text();
      console.error('OpenAI stream failed:', openaiResp.status, txt);
      await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.stream.error', { status: openaiResp.status, text: txt }).catch(()=>{});
      sendSSE(res, 'error', { error: 'OpenAI stream failed' });
      sendSSE(res, 'done', { success: false });
      return res.end();
    }

    const reader = openaiResp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Read chunks from OpenAI and forward token deltas as SSE tokens
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // OpenAI streams with lines prefixed by 'data: '
      let lines = buffer.split(/\n/);
      buffer = lines.pop(); // incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') {
          sendSSE(res, 'done', { success: true });
          res.end();
          return;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) sendSSE(res, 'token', { token: delta });
          // function call handling or tool events could be sent as specific events here
        } catch (e) {
          // ignore parse errors
        }
      }
    }

    await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'ai.stream.done', {}).catch(()=>{});
    sendSSE(res, 'done', { success: true });
    return res.end();
  } catch (err) {
    console.error('AI stream handler error:', err);
    try { sendSSE(res, 'error', { error: String(err) }); } catch (e) {}
    try { sendSSE(res, 'done', { success: false }); } catch (e) {}
    try { res.end(); } catch (e) {}
  }
}
