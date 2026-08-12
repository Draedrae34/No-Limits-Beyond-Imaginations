import fs from 'fs';
import path from 'path';
import { verifyAdmin } from '../src/utils/auth.js';
import { auditLog } from '../src/utils/audit.js';

export default async function handler(req, res) {
  try {
    const workshopPrivate = (process.env.WORKSHOP_PRIVATE || 'true') === 'true';
    // Deny if private mode disabled
    if (!workshopPrivate) {
      return res.status(404).end();
    }

    if (!(await verifyAdmin(req))) {
      await auditLog(req, 'unknown', 'lil-mystic-client.forbidden', {}).catch(()=>{});
      return res.status(403).json({ error: 'Forbidden' });
    }

    const filePath = path.join(process.cwd(), 'src', 'private', 'lil-mystic.js');
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: 'Lil Mystic client bundle not found.' });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store');
    await auditLog(req, (await verifyAdmin(req) ? 'admin' : 'unknown'), 'lil-mystic-client.serve', { size: String(content.length) }).catch(()=>{});
    return res.status(200).send(content);
  } catch (err) {
    console.error('Lil Mystic client serve error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
