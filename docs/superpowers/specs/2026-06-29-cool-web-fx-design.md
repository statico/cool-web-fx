# cool-web-fx — Design

A standalone, statically-hosted gallery of "cool web interaction effects that Ian likes,"
each reproduced as copy-pasteable HTML/CSS/JS with attribution. Inspired by
[reactbits.dev](https://reactbits.dev) and modeled on the LLM-friendly patterns of
[smui.statico.io](https://smui.statico.io). Prominently marked as generated with Claude Code.

## Goals

- A browsable index of web-effect demos with thumbnails and credit.
- Each demo has its own page: live preview, copy-pasteable code, a "how it works"
  technique writeup, and source attribution.
- **LLM-friendly**: the full demo code is present in the static HTML (no JS execution or
  API call required to scrape it), plus a public `skill.md` / `llms.txt` agent guide.
- Deployable as static files to Vercel or GitHub Pages.

## Non-Goals

- Not a component library or npm package. No runtime framework shipped to the browser.
- No per-demo author accounts, comments, or submission flow.
- Demos are **independent recreations** of the named effects, not copies of proprietary
  source. Each cites where the effect was seen and who to credit.

## Stack

- **Astro** with static output (`output: 'static'`). Astro renders to plain HTML at build
  time; no client framework is shipped. Deploys to Vercel or GitHub Pages unchanged.
- **Playwright** (the user runs an MCP server at `http://localhost:8931`) for verification
  and for generating thumbnail screenshots.
- No CSS framework; a small hand-written stylesheet for the dark/monospace site chrome.

## Single Source of Truth Per Demo

Each demo is **one self-contained file**: `src/demos/<slug>/demo.html`, containing all of its
HTML, CSS, and JS inline. This file:

1. **Runs standalone** — it is exactly the block a user copies and pastes.
2. Is embedded **live** in the demo page via `<iframe>` (isolated; no style/JS bleed into
   site chrome).
3. Is read at build time (Astro `?raw` import or `fs.readFileSync`) and injected verbatim
   into the demo page DOM as a `<pre><code>` block — so the shown code and the running code
   can never drift, and an LLM scraping the static HTML gets the real, complete code.
4. Is screenshotted by Playwright to produce `public/thumbs/<slug>.png`.

A small `meta.js`/frontmatter per demo holds: `title`, `slug`, `sourceUrl`, `sourceName`
(site/company), `credit` (author if known), `blurb` (one-liner for the index), and
`technique` (the "how it works" prose, Markdown).

## Pages

- **`/` (index)** — table/grid of demos: thumbnail, title, source name, one-line blurb.
  Header shows the site title and a "Generated with Claude Code" badge; footer repeats it
  and links the GitHub repo and `skill.md`.
- **`/demos/<slug>/`** — live `<iframe>` preview at top; a "Copy code" button and a
  smui-style code modal (full-screen, blurred backdrop, Esc / click-outside to close, body
  scroll lock); the full code in a `<pre><code>` block; a **How it works** section; and a
  **Source & credit** section (original URL, site/company, author if known, and an explicit
  note that this is an independent recreation).
- **`public/skill.md`** — agent guide: a "STOP — read this first" banner, repo layout, how to
  copy a single demo's code (`src/demos/<slug>/demo.html`), and the attribution expectation.
- **`public/llms.txt`** — short machine index pointing at `skill.md` and listing demo slugs +
  source URLs.

## Site Chrome / Visual Style

Dark background, monospace type, minimal "terminal" feel (smui-like) so the colorful effects
pop against neutral chrome. One stylesheet in `src/styles/site.css`. The chrome must never
leak into demos — demos render inside iframes precisely to guarantee this.

## Demos (v1)

All are independent recreations; each credited on its page.

1. **`cyber-canvas`** — ChatGPT `/cyber` header background canvas effect.
   Source: `https://chatgpt.com/cyber`.
2. **`meshy-grid`** — Meshy "3D, On Command" section: lighting, dust motes, perspective grid.
   Source: `https://www.meshy.ai/`.
3. **`sneakers-text`** — Infisical gibberish→readable text decode (the *Sneakers* movie effect).
   Source: `https://infisical.com/`.
4. **`midjourney-swirl`** — Midjourney hero text swirl (text swirl only, no CRT).
   Source: `https://www.midjourney.com/home`.
5. **`electron-lines`** — Pulsing "electron" pulses traveling along animated SVG paths.
   Sources: `https://schematichq.com/` ("How it works") and `https://portkey.ai/`
   ("AI gateway").
6. **`resend-cube`** — Rotating Rubik's cube hero (normal/classic colors, light theme).
   Source: `https://resend.com/home`.

The structure is additive — new demos are a new `src/demos/<slug>/` folder plus a thumbnail.

## Thumbnails

A re-runnable script (`scripts/take-screenshots.mjs`) drives Playwright to load each
`demo.html`, wait for the effect to animate, and capture `public/thumbs/<slug>.png` at a
fixed size (e.g. 1200×750, deviceScaleFactor 2). Re-run when demos change.

## Build, Verify, Deploy

- **Build**: `npm run build` → static `dist/`.
- **Implementation**: demos are independent, so build them in parallel via subagents.
- **Verify**: Playwright MCP (`:8931`) loads each demo and confirms it animates (canvas
  drawing / DOM mutation / requestAnimationFrame activity) and has no console errors, then
  captures the thumbnail.
- **Deploy**: static `dist/` to Vercel or GitHub Pages (Astro static adapter; include a
  GitHub Pages base-path note).

## Risks / Notes

- **Effect fidelity**: we approximate the *technique*, not pixel-identical output. The
  writeup should describe the approach honestly.
- **Attribution/IP**: recreations + credit only; no scraping of proprietary bundles into the
  repo. Each page states it is an independent recreation.
- **Thumbnail determinism**: animated effects vary frame-to-frame; capture after a fixed
  warm-up delay for reasonable consistency.
