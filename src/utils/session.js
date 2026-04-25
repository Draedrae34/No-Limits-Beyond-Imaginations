import crypto from "crypto";

const COOKIE_NAME = "workshop_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";

export function createSessionToken(email) {
  const payload = JSON.stringify({ email, ts: Date.now() });
  const base = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(base).digest("base64url");
  return `${base}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token) return null;
  const [base, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(base).digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8"));
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromReq(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifySessionToken(match[1]);
}

export function setSessionCookie(res, email) {
  const token = createSessionToken(email);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure`);
}