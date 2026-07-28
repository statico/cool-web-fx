// Inject a machine-readable metadata block into each public/effects/<slug>.html.
//
// These files are served directly AND are the thing people copy-paste, so the
// injected block is fenced by `a14y:begin` / `a14y:end` comments that say it is
// safe to delete. Re-running replaces whatever is between the fences, so this is
// idempotent and safe to run after editing an effect or adding a new one.
//
//   node scripts/inject-effect-metadata.mjs          # rewrite all effect files
//   node scripts/inject-effect-metadata.mjs --check  # exit 1 if any are stale

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://fx.statico.io').replace(/\/$/, '');
const CHECK = process.argv.includes('--check');

const BEGIN_HEAD = '<!-- a14y:begin head — machine-readable metadata; safe to delete when copying -->';
const END_HEAD = '<!-- a14y:end head -->';
const BEGIN_BODY = '<!-- a14y:begin body — visually hidden description; safe to delete when copying -->';
const END_BODY = '<!-- a14y:end body -->';

const attr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Strip the light markdown used in demo `technique` prose. */
const demarkdown = (s) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');

/** Last commit date for a file, ISO-8601.
 *
 *  Deliberately keyed off src/demos/<slug>.json rather than the effect file
 *  itself: this script rewrites the effect file, so using its own timestamp
 *  would make every run produce a different byte and break `--check`. */
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

const demos = fs
  .readdirSync(path.join(ROOT, 'src/demos'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/demos', f), 'utf-8')));

function headBlock(d) {
  const effectUrl = `${SITE}/effects/${d.slug}.html`;
  const demoUrl = `${SITE}/demos/${d.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${effectUrl}#effect`,
        name: d.title,
        url: effectUrl,
        abstract: d.blurb,
        description: d.blurb,
        programmingLanguage: 'HTML',
        codeSampleType: 'full solution',
        runtimePlatform: 'Web browser',
        codeRepository: 'https://github.com/statico/cool-web-fx',
        license: 'https://unlicense.org/',
        isBasedOn: d.sourceUrl,
        mainEntityOfPage: demoUrl,
        dateModified: lastModified(`src/demos/${d.slug}.json`),
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${effectUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: d.title, item: demoUrl },
          { '@type': 'ListItem', position: 3, name: 'Standalone source', item: effectUrl },
        ],
      },
    ],
  };

  return [
    BEGIN_HEAD,
    `<meta name="description" content="${attr(d.blurb)}">`,
    `<link rel="canonical" href="${effectUrl}">`,
    `<link rel="alternate" type="text/markdown" href="${effectUrl}.md" title="${attr(d.title)} (Markdown)">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="cool web fx">`,
    `<meta property="og:title" content="${attr(d.title)}">`,
    `<meta property="og:description" content="${attr(d.blurb)}">`,
    `<meta property="og:url" content="${effectUrl}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${attr(d.title)}">`,
    `<meta name="twitter:description" content="${attr(d.blurb)}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    `<style>.a14y-doc{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}</style>`,
    END_HEAD,
  ].join('\n  ');
}

function bodyBlock(d) {
  const demoUrl = `${SITE}/demos/${d.slug}`;
  const effectUrl = `${SITE}/effects/${d.slug}.html`;
  // The whole writeup, not just the opening paragraph: these standalone files
  // are mostly script, and the prose is what makes them readable out of context.
  const paras = demarkdown(d.technique || d.blurb)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const credit = d.credit
    ? `Effect originally seen on ${d.sourceName} (${d.sourceUrl}) — credit to ${d.credit}.`
    : `Effect originally seen on ${d.sourceName} (${d.sourceUrl}).`;

  return [
    BEGIN_BODY,
    `<div class="a14y-doc">`,
    `  <h1>${text(d.title)}</h1>`,
    `  <p>${text(d.blurb)}</p>`,
    `  <h2>How it works</h2>`,
    ...paras.map((p) => `  <p>${text(p)}</p>`),
    `  <h2>How to use this file</h2>`,
    `  <p>This is a complete, self-contained HTML document — copy it verbatim rather than reconstructing it. Markdown version: <a href="${effectUrl}.md">${effectUrl}.md</a>. Full writeup and live preview: <a href="${demoUrl}">${demoUrl}</a>.</p>`,
    `  <h2>Source and credit</h2>`,
    `  <p>${text(credit)} This is an independent recreation built from scratch for educational use; no proprietary source code was copied. Released under the Unlicense.</p>`,
    `  <h2>More</h2>`,
    `  <p>Terms used above are defined in the <a href="${SITE}/glossary">glossary</a>. See also the <a href="${SITE}/sitemap.md">site map</a>, <a href="${SITE}/AGENTS.md">AGENTS.md</a> and <a href="${SITE}/llms.txt">llms.txt</a>.</p>`,
    `</div>`,
    END_BODY,
  ].join('\n  ');
}

/** Replace an existing fenced block, or insert after `anchorRe`'s match. */
function upsert(src, begin, end, block, anchorRe, label, file) {
  const bi = src.indexOf(begin);
  if (bi !== -1) {
    const ei = src.indexOf(end, bi);
    if (ei === -1) throw new Error(`${file}: found ${begin} without its closing fence`);
    return src.slice(0, bi) + block + src.slice(ei + end.length);
  }
  const m = src.match(anchorRe);
  if (!m) throw new Error(`${file}: no ${label} anchor found`);
  const at = m.index + m[0].length;
  return `${src.slice(0, at)}\n  ${block}${src.slice(at)}`;
}

let changed = 0;
const stale = [];

for (const d of demos) {
  const file = path.join(ROOT, `public/effects/${d.slug}.html`);
  if (!fs.existsSync(file)) {
    console.warn(`  skip ${d.slug} — no effect file`);
    continue;
  }
  const before = fs.readFileSync(file, 'utf-8');

  let after = upsert(before, BEGIN_HEAD, END_HEAD, headBlock(d), /<\/title>/i, '</title>', d.slug);
  after = upsert(after, BEGIN_BODY, END_BODY, bodyBlock(d), /<body[^>]*>/i, '<body>', d.slug);

  if (after === before) continue;
  if (CHECK) {
    stale.push(d.slug);
    continue;
  }
  fs.writeFileSync(file, after);
  console.log(`  updated public/effects/${d.slug}.html`);
  changed++;
}

if (CHECK) {
  if (stale.length) {
    console.error(`inject-effect-metadata: stale — ${stale.join(', ')}`);
    console.error('Run: node scripts/inject-effect-metadata.mjs');
    process.exit(1);
  }
  console.log('inject-effect-metadata: all effect files up to date');
} else {
  console.log(`inject-effect-metadata: ${changed} file(s) updated`);
}
