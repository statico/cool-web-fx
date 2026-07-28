// Content negotiation for the Markdown mirrors.
//
// `vercel.json` rewrites cannot do this: Vercel resolves the filesystem BEFORE
// applying rewrites, so a rewrite never fires for a path that already has a
// static file — and every one of these paths does. Edge middleware runs before
// the filesystem check, so it is the only place this can happen.
//
// An agent asking for Markdown gets the mirror; a browser gets the HTML.
//
//   curl -H 'Accept: text/markdown' https://fx.statico.io/demos/resend-cube
//
// Everything else about the site stays static — this only rewrites the path.

import { next, rewrite } from '@vercel/edge';

export const config = {
  matcher: ['/', '/glossary', '/demos/:slug', '/effects/:file'],
};

/** Map a page path to its Markdown mirror. Returns null if there isn't one. */
function mirrorFor(pathname: string): string | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return '/index.md';
  if (p === '/glossary') return '/glossary.md';
  if (/^\/demos\/[^/]+$/.test(p)) return `${p}.md`;
  // /effects/<slug>.html -> /effects/<slug>.html.md
  if (/^\/effects\/[^/]+\.html$/.test(p)) return `${p}.md`;
  return null;
}

// True when the client asked for markdown *over* html, not merely alongside it.
// Browsers send an Accept of `text/html,...,<star>/<star>` — that must not be
// treated as a request for Markdown, so an explicit text/markdown has to
// outrank any text/html by q-value.
function prefersMarkdown(accept: string): boolean {
  if (!accept) return false;

  let markdownQ = -1;
  let htmlQ = -1;

  for (const part of accept.split(',')) {
    const [rawType, ...params] = part.trim().split(';');
    const type = rawType.trim().toLowerCase();
    if (!type) continue;

    let q = 1;
    for (const param of params) {
      const [k, v] = param.split('=');
      if (k && k.trim().toLowerCase() === 'q') {
        const parsed = Number.parseFloat(v);
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }

    if (type === 'text/markdown' || type === 'text/x-markdown') {
      markdownQ = Math.max(markdownQ, q);
    } else if (type === 'text/html' || type === 'application/xhtml+xml') {
      htmlQ = Math.max(htmlQ, q);
    }
  }

  return markdownQ > 0 && markdownQ >= htmlQ;
}

export default function middleware(request: Request) {
  const accept = request.headers.get('accept') || '';
  if (!prefersMarkdown(accept)) return next();

  const url = new URL(request.url);
  const mirror = mirrorFor(url.pathname);
  if (!mirror) return next();

  url.pathname = mirror;
  return rewrite(url);
}
