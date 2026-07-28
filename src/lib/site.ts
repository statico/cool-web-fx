import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const SITE_URL = (process.env.SITE_URL || 'https://fx.statico.io').replace(/\/$/, '');

export const SITE_NAME = 'cool web fx';
export const SITE_TAGLINE = 'Cool web interaction effects that Ian likes';
export const SITE_DESCRIPTION =
  'A gallery of cool web interaction effects, recreated as copy-pasteable HTML/CSS/JS. Generated with Claude Code. Inspired by reactbits.dev.';

/** Canonical URLs are emitted without a trailing slash (except "/"), which is
 *  how the site is actually served — see `trailingSlash: 'ignore'` in
 *  astro.config.mjs. Keeping the two in sync avoids a redirect hop. */
export function canonicalUrl(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '');
  return clean === '' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}

/** Last commit date for a file, as an ISO-8601 string.
 *
 *  Falls back to the file's mtime, and then to build time. Vercel checks out a
 *  shallow clone, so a file older than the clone depth has no reachable commit
 *  — the fallback keeps the build working instead of throwing. */
export function lastModified(relPath: string): string {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', relPath], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) return out;
  } catch {
    // not a git checkout, or no commit touches this path in a shallow clone
  }
  try {
    return fs.statSync(path.resolve(relPath)).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/** Newest lastModified across several files — used for index/collection pages. */
export function newestModified(relPaths: string[]): string {
  const dates = relPaths.map(lastModified).sort();
  return dates[dates.length - 1] || new Date().toISOString();
}
