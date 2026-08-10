// Keep browser requests same-origin so the HTTP-only admin cookie remains first-party
// on mobile browsers. Next.js proxies /api to the configured server endpoint.
export const API_BASE_URL = '/api';
