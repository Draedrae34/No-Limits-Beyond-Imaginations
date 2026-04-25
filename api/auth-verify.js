import { getSessionFromReq } from "../src/utils/session.js";

export default function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }
  return res.status(200).json({ authenticated: true, email: session.email });
}