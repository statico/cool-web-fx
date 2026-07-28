// Postbuild: emit the machine-readable surface that Astro doesn't produce —
// sitemap.xml, sitemap.md, and a Markdown mirror of every HTML page.
//
// The mirrors are rendered from the same sources the Astro pages use
// (src/demos/*.json, public/effects/*.html, src/data/glossary.json), not by
// scraping the built HTML, so they can't drift from what the pages show.
//
// Run automatically via `npm run build` (postbuild). Writes into dist/.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://fx.statico.io').replace(/\/$/, '');

const url = (p) => {
  const clean = p.replace(/\/+$/, '');
  return clean === '' ? `${SITE}/` : `${SITE}${clean}`;
};

/** Last commit date for a file, ISO-8601. Mirrors src/lib/site.ts — see the
 *  note there about shallow clones on Vercel. */
function lastModified(relPath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', relPath], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) return out;
  } catch {
    /* not a git checkout, or shallow */
  }
  try {
    return fs.statSync(path.join(ROOT, relPath)).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

const write = (rel, body) => {
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body);
  return rel;
};

const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const xmlEscape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// YAML needs quoting for anything with a colon, quote or leading special char.
const yamlString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// ---------------------------------------------------------------- load data

const demos = fs
  .readdirSync(path.join(ROOT, 'src/demos'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/demos', f), 'utf-8')))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

const glossary = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/glossary.json'), 'utf-8'));

const SITE_DESCRIPTION =
  'A gallery of cool web interaction effects, recreated as copy-pasteable HTML/CSS/JS. Generated with Claude Code. Inspired by reactbits.dev.';

// Version of the *mirror format* (frontmatter keys + section layout), not of the
// site. Bump when the shape of a generated .md changes.
const DOC_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')).version;

const demoModified = Object.fromEntries(
  demos.map((d) => [d.slug, lastModified(`public/effects/${d.slug}.html`)]),
);
const newest = (dates) => dates.slice().sort().pop() || new Date().toISOString();
const siteModified = newest(Object.values(demoModified));

// --------------------------------------------------------- markdown mirrors

/** Standard frontmatter + canonical header shared by every mirror. */
function mirrorHeader({ title, description, canonical, modified }) {
  return [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `canonical: ${yamlString(canonical)}`,
    `doc_version: ${yamlString(DOC_VERSION)}`,
    `last_updated: ${yamlString(modified.slice(0, 10))}`,
    `date_modified: ${yamlString(modified)}`,
    `source: ${yamlString('https://github.com/statico/cool-web-fx')}`,
    `license: ${yamlString('Unlicense')}`,
    '---',
    '',
    `> Canonical HTML version: <${canonical}>`,
    '',
  ].join('\n');
}

/** Cross-links appended to every mirror, so any single .md file is a usable
 *  entry point into the rest of the machine-readable surface. */
function mirrorFooter() {
  return [
    '',
    '## Sitemap',
    '',
    `- [All effects](${url('/index.md')}) — gallery index`,
    `- [Site map](${url('/sitemap.md')}) — every page, grouped`,
    `- [sitemap.xml](${url('/sitemap.xml')}) — machine-readable, with lastmod`,
    `- [AGENTS.md](${url('/AGENTS.md')}) — how to grab and reuse an effect`,
    `- [skill.md](${url('/skill.md')}) — full agent skill file`,
    `- [llms.txt](${url('/llms.txt')}) — short index of every effect`,
    `- [Glossary](${url('/glossary.md')}) — terminology used in the writeups`,
    '',
  ].join('\n');
}

function demoMirror(d) {
  const canonical = url(`/demos/${d.slug}`);
  const code = fs.readFileSync(path.join(ROOT, `public/effects/${d.slug}.html`), 'utf-8');

  return [
    mirrorHeader({
      title: d.title,
      description: d.blurb,
      canonical,
      modified: demoModified[d.slug],
    }),
    `# ${d.title}`,
    '',
    d.blurb,
    '',
    `Seen on [${d.sourceName}](${d.sourceUrl})${d.credit ? ` · credit ${d.credit}` : ''}.`,
    '',
    '## How it works',
    '',
    d.technique || '_No writeup yet._',
    '',
    '## Code',
    '',
    `Copy this whole file. It is a complete, runnable HTML document — also served`,
    `verbatim at <${url(`/effects/${d.slug}.html`)}>.`,
    '',
    '```html',
    code.replace(/\n$/, ''),
    '```',
    '',
    '## Source & credit',
    '',
    `Effect seen on <${d.sourceUrl}>${d.credit ? ` — credit to ${d.credit}.` : '.'}`,
    '',
    'This is an independent recreation of the effect built from scratch for',
    'educational use. No proprietary source code was copied.',
    mirrorFooter(),
  ].join('\n');
}

/** Mirror for a standalone /effects/<slug>.html. Narrower than the demo mirror:
 *  this URL is the raw artifact, so the mirror leads with the code. */
function effectMirror(d) {
  const canonical = url(`/effects/${d.slug}.html`);
  const code = fs.readFileSync(path.join(ROOT, `public/effects/${d.slug}.html`), 'utf-8');

  return [
    mirrorHeader({
      title: `${d.title} — standalone source`,
      description: d.blurb,
      canonical,
      modified: demoModified[d.slug],
    }),
    `# ${d.title} — standalone source`,
    '',
    d.blurb,
    '',
    `This is the raw, runnable artifact. The writeup, live preview and credit live`,
    `on the demo page: <${url(`/demos/${d.slug}`)}> (Markdown: <${url(`/demos/${d.slug}.md`)}>).`,
    '',
    '## Code',
    '',
    '```html',
    code.replace(/\n$/, ''),
    '```',
    '',
    '## Source & credit',
    '',
    `Effect seen on <${d.sourceUrl}>${d.credit ? ` — credit to ${d.credit}.` : '.'}`,
    'Independent recreation, built from scratch for educational use.',
    mirrorFooter(),
  ].join('\n');
}

function indexMirror() {
  const canonical = url('/');
  return [
    mirrorHeader({
      title: 'Cool web interaction effects that Ian likes',
      description: SITE_DESCRIPTION,
      canonical,
      modified: siteModified,
    }),
    '# Cool web interaction effects that Ian likes',
    '',
    'A growing gallery of web interaction effects, each recreated from scratch as',
    'copy-pasteable HTML/CSS/JS. Every demo is a single self-contained file you can',
    'lift straight into your own page.',
    '',
    '## How to use an effect',
    '',
    'Fetch the effect file, copy it verbatim into your project, and keep the credit',
    'to the site where it was first seen. Every effect is dependency-free except',
    '`resend-cube`, which loads Three.js from a CDN via an import map.',
    '',
    '## All effects',
    '',
    ...demos.map(
      (d) =>
        `- [${d.title}](${url(`/demos/${d.slug}.md`)}) — ${d.blurb} ` +
        `Seen on ${d.sourceName} (${d.sourceUrl}). ` +
        `Source: ${url(`/effects/${d.slug}.html`)}`,
    ),
    mirrorFooter(),
  ].join('\n');
}

function glossaryMirror() {
  const canonical = url('/glossary');
  return [
    mirrorHeader({
      title: 'Glossary',
      description:
        'Definitions of the rendering and animation terms used across the cool-web-fx effect writeups.',
      canonical,
      modified: lastModified('src/data/glossary.json'),
    }),
    '# Glossary',
    '',
    "Terms used in the effect writeups, defined once so you don't have to infer",
    'them from context.',
    '',
    '## Terminology',
    '',
    ...glossary.flatMap((t) => [`### ${stripTags(t.term)}`, '', stripTags(t.def), '']),
    mirrorFooter(),
  ].join('\n');
}

// ------------------------------------------------------------------ sitemaps

const pages = [
  { loc: url('/'), lastmod: siteModified, priority: '1.0' },
  { loc: url('/glossary'), lastmod: lastModified('src/data/glossary.json'), priority: '0.5' },
  ...demos.map((d) => ({
    loc: url(`/demos/${d.slug}`),
    lastmod: demoModified[d.slug],
    priority: '0.8',
  })),
  ...demos.map((d) => ({
    loc: url(`/effects/${d.slug}.html`),
    lastmod: demoModified[d.slug],
    priority: '0.6',
  })),
];

function sitemapXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...pages.map((p) =>
      [
        '  <url>',
        `    <loc>${xmlEscape(p.loc)}</loc>`,
        `    <lastmod>${p.lastmod}</lastmod>`,
        `    <priority>${p.priority}</priority>`,
        // Announce the Markdown mirror as an alternate representation.
        p.loc.endsWith('.html')
          ? ''
          : `    <xhtml:link rel="alternate" type="text/markdown" href="${xmlEscape(
              p.loc === url('/') ? url('/index.md') : `${p.loc}.md`,
            )}"/>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');
}

function sitemapMd() {
  return [
    '# Site map — cool-web-fx',
    '',
    `> Every page on <${SITE}>, grouped by section. Machine-readable equivalent:`,
    `> <${url('/sitemap.xml')}>. Last updated ${siteModified.slice(0, 10)}.`,
    '',
    '## Pages',
    '',
    `- [Home](${url('/')}) — gallery index of every effect. Markdown: [/index.md](${url('/index.md')})`,
    `- [Glossary](${url('/glossary')}) — terminology used in the writeups. Markdown: [/glossary.md](${url('/glossary.md')})`,
    '',
    '## Effect demo pages',
    '',
    'Each page carries a live iframe, the full source, a technique writeup, and credit.',
    '',
    ...demos.map(
      (d) =>
        `- [${d.title}](${url(`/demos/${d.slug}`)}) — ${d.blurb} ` +
        `Markdown: [/demos/${d.slug}.md](${url(`/demos/${d.slug}.md`)})`,
    ),
    '',
    '## Standalone effect sources',
    '',
    'Complete, runnable HTML documents — copy these verbatim.',
    '',
    ...demos.map(
      (d) =>
        `- [${d.title}](${url(`/effects/${d.slug}.html`)}) — \`${d.slug}.html\`. ` +
        `Markdown: [/effects/${d.slug}.html.md](${url(`/effects/${d.slug}.html.md`)})`,
    ),
    '',
    '## Agent resources',
    '',
    `- [AGENTS.md](${url('/AGENTS.md')}) — entry point: what this is, how to grab an effect`,
    `- [skill.md](${url('/skill.md')}) — full agent skill file`,
    `- [llms.txt](${url('/llms.txt')}) — short index of every effect`,
    `- [robots.txt](${url('/robots.txt')}) — crawl policy (everything allowed)`,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------- run

if (!fs.existsSync(DIST)) {
  console.error('generate-agent-files: dist/ not found — run `astro build` first.');
  process.exit(1);
}

const written = [
  write('sitemap.xml', sitemapXml()),
  write('sitemap.md', sitemapMd()),
  write('index.md', indexMirror()),
  write('glossary.md', glossaryMirror()),
  ...demos.map((d) => write(`demos/${d.slug}.md`, demoMirror(d))),
  // One spelling only: <url>.md, i.e. effects/<slug>.html.md. Also emitting
  // effects/<slug>.md made the canonical Link rule in vercel.json ambiguous —
  // a single `:file.md` pattern cannot map both spellings back to the same
  // .html URL, and the greedy match produced `<...resend-cube.html.html>`.
  ...demos.map((d) => write(`effects/${d.slug}.html.md`, effectMirror(d))),
];

console.log(`generate-agent-files: wrote ${written.length} files to dist/`);
for (const f of written) console.log(`  ${f}`);
