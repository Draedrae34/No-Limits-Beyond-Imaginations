function unauthorized() {
    return new Response('Unauthorized', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Owner Workshop"',
        },
    });
}

export function middleware(request) {
    const password = process.env.WORKSHOP_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!password) return unauthorized();

    const auth = request.headers.get('authorization') || '';
    if (!auth.toLowerCase().startsWith('basic ')) return unauthorized();

    try {
        const encoded = auth.slice(6).trim();
        const decoded = atob(encoded);
        const idx = decoded.indexOf(':');
        const user = idx >= 0 ? decoded.slice(0, idx) : decoded;
        const pass = idx >= 0 ? decoded.slice(idx + 1) : '';

        if (user !== 'owner' || pass !== password) return unauthorized();
        return;
    } catch {
        return unauthorized();
    }
}

export const config = {
    matcher: [
        '/workshop/:path*',
        '/private.html',
        '/dashboard.html',
        '/business_dash.html',
        '/music_studio.html',
        '/control_panel.html',
    ],
};
