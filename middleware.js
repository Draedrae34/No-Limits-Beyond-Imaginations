export default function middleware(request) {
  // MASTER BYPASS: All doors are open.
  return;
}

export const config = { matcher: ["/workshop.html", "/workshop-login.html"] };
