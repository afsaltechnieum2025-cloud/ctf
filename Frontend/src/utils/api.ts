const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error('VITE_API_URL is not set. Create a .env.development file.');
}

export const API = API_BASE;

/**
 * Base URL for static files served by the backend (/uploads, /docs).
 * Always ends with `/` when using an absolute API origin.
 * Use `${STATIC_BASE}docs/foo.pdf` (no extra slash) to avoid `//docs`.
 */
function computeStaticBase(): string {
  const raw = API_BASE.trim();
  if (raw.startsWith('/')) {
    return '/';
  }
  const origin = raw.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  return `${origin}/`;
}

export const STATIC_BASE = computeStaticBase();

/** PDF under backend /docs — correct URL for both absolute and same-origin API. */
export function docsPdfUrl(baseName: string): string {
  const name = baseName.endsWith('.pdf') ? baseName.slice(0, -4) : baseName;
  return `${STATIC_BASE}docs/${name}.pdf`;
}