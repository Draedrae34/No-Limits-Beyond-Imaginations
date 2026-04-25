import { clearSessionCookie } from "../src/utils/session.js";

export default function handler(req, res) {
  clearSessionCookie(res);
  return res.status(200).json({ success: true });
}