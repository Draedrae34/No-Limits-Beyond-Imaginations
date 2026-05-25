const OWNER_COOKIE = "nlbl_auth=authenticated";

const privatePages = new Set(["/private.html", "/workshop.html", "/monitor.html"]);
const privateAssets = new Set([
  "/css/workshop.css",
  "/js/workshop.js",
  "/js/workshop-heartbeat.js",
  "/js/lil-mystic.js"
]);

export default function middleware(request) {
  // TEMPORARY BYPASS: Allowing all access to the workshop while authentication issues are being resolved.
  return;

  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  const isOwner = cookie.split(";").some((part) => part.trim() === OWNER_COOKIE);

  if (isOwner) return;

  if (privatePages.has(url.pathname)) {
    return Response.redirect(new URL("/workshop-login.html", request.url), 302);
  }

  if (privateAssets.has(url.pathname)) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-robots-tag": "noindex, nofollow, noarchive"
      }
    });
  }
}

export const config = {
  matcher: [
    "/private.html",
    "/workshop.html",
    "/monitor.html",
    "/css/workshop.css",
    "/js/workshop.js",
    "/js/workshop-heartbeat.js",
    "/js/lil-mystic.js"
  ]
};
