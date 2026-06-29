# cool-web-fx Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Astro gallery of copy-pasteable web-effect recreations, LLM-scrapable, deployable to Vercel/GitHub Pages.

**Architecture:** Each effect is one self-contained `public/effects/<slug>.html` (the canonical runnable + copy-paste block + screenshot + iframe target). A sibling `src/demos/<slug>.json` holds metadata. Astro reads both at build time to generate the index and per-demo pages, injecting the raw HTML into the DOM so shown code never drifts from running code. Visual effects are verified in a real browser (Playwright MCP on :8931), not unit tests.

**Tech Stack:** Astro (static output), vanilla HTML/CSS/JS in demos, Playwright for verification + thumbnails. No client framework, no CSS framework.

## Global Constraints

- Node-based Astro project; `output: 'static'`. Must build to `dist/` with `npm run build`.
- Demos are **independent recreations**, never copied proprietary source. Each page states this.
- Full demo code MUST appear verbatim in the static HTML (`<pre><code>`), not behind JS/an API.
- Site chrome: dark background, monospace, minimal. Chrome must not leak into demos (iframe isolation).
- "Generated with Claude Code" badge in header AND footer; credit reactbits.dev as inspiration.
- Each demo cites `sourceUrl` + `sourceName` and (if known) `credit`.
- The 6 v1 slugs are exactly: `cyber-canvas`, `meshy-grid`, `sneakers-text`, `midjourney-swirl`, `electron-lines`, `resend-cube`.

---

## Data Contract (shared by all tasks)

**`src/demos/<slug>.json`:**
```json
{
  "title": "Cyber Canvas",
  "slug": "cyber-canvas",
  "order": 1,
  "sourceUrl": "https://chatgpt.com/cyber",
  "sourceName": "ChatGPT /cyber",
  "credit": "OpenAI",
  "blurb": "Animated particle/grid background canvas from the page header.",
  "technique": "Markdown prose describing how the effect works..."
}
```

**`public/effects/<slug>.html`:** a complete standalone HTML document — `<!doctype html>`, inline `<style>`, inline `<script>`, a full-viewport effect on a dark background. Must run when opened directly with no server, no external network requests (no CDN scripts; everything inline). Must use `requestAnimationFrame` and stay performant. No console errors.

---

### Task 1: Scaffold Astro project + site chrome

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`
- Create: `src/layouts/Base.astro`, `src/styles/site.css`
- Create: `src/pages/index.astro` (placeholder reading globbed metas)
- Create: `src/pages/demos/[slug].astro`
- Create: `public/favicon.svg`

- [ ] **Step 1:** `npm create astro@latest . -- --template minimal --no-install --no-git --skip-houston` (or hand-write the files below if interactive). Then ensure `astro.config.mjs` sets `output: 'static'` and a configurable `site`/`base` (comment explaining GitHub Pages base path).
- [ ] **Step 2:** Write `src/styles/site.css` — dark (`#0a0b0e`-ish) background, monospace stack (`ui-monospace, "SF Mono", Menlo, monospace`), styles for: header bar with title + "Generated with Claude Code" badge, gallery grid/table, thumbnail cards, demo page (iframe frame, code block, modal), footer.
- [ ] **Step 3:** Write `src/layouts/Base.astro` — `<html>` head (title, meta, favicon, `site.css`), header (site title "Cool web interaction effects that Ian likes", Claude Code badge linking to https://claude.com/claude-code), `<slot/>`, footer (Claude Code badge, "inspired by reactbits.dev", link to `/skill.md` and repo). Accept `title` prop.
- [ ] **Step 4:** Write `src/pages/index.astro` — `const metas = Object.values(import.meta.glob('../demos/*.json', { eager: true })).map(m => m.default).sort((a,b)=>a.order-b.order)`. Render a gallery: each card links to `/demos/<slug>/`, shows `<img src={`${base}thumbs/<slug>.png`}>`, title, sourceName, blurb. Handle missing thumbnail gracefully (placeholder).
- [ ] **Step 5:** Write `src/pages/demos/[slug].astro` — `getStaticPaths` globs `../../demos/*.json`; for each, read `public/effects/<slug>.html` via `fs.readFileSync` at module top. Render: `<iframe src={`${base}effects/<slug>.html`}>` in a framed preview, a "Copy code" button, the raw HTML in `<pre><code>` (HTML-escaped), a smui-style modal (full-screen, blurred backdrop, Esc + click-outside close, body scroll lock) containing the same code, a **How it works** section (render `technique` — keep it simple: preformatted or a tiny markdown render), and a **Source & credit** section with the recreation disclaimer. Include a small inline `<script>` for copy + modal behavior.
- [ ] **Step 6:** Add one throwaway demo (`src/demos/test.json` + `public/effects/test.html` with a colored animated box) so build has data. `npm run build`. Expected: `dist/` with `index.html`, `demos/test/index.html`, no errors. Then delete the throwaway files.
- [ ] **Step 7:** Commit: `git add -A && git commit -m "feat: scaffold Astro site chrome, index and demo page templates"`.

**Interfaces produced:** the `src/demos/<slug>.json` schema and `public/effects/<slug>.html` location that Tasks 2–7 populate; `base`-aware asset URLs.

---

### Tasks 2–7: The six effect demos (independent — build in parallel)

Each task creates exactly two files and nothing else:
- Create: `public/effects/<slug>.html`
- Create: `src/demos/<slug>.json`

Each demo must: be a complete standalone document, run with no network, fill the viewport on a dark bg, animate via rAF, have no console errors, and degrade gracefully on resize. Write a clear, honest `technique` describing the approach. Do NOT copy proprietary source — recreate the effect.

- [ ] **Task 2 — `cyber-canvas`** (`https://chatgpt.com/cyber`, credit OpenAI): canvas particle/network or scanning-grid background as seen in the page header. Recreate the vibe (dark, techy, animated nodes/lines or flowing grid).
- [ ] **Task 3 — `meshy-grid`** (`https://www.meshy.ai/`, "3D, On Command", credit Meshy): a perspective floor grid receding to a horizon, soft volumetric lighting glow, and drifting dust-mote particles.
- [ ] **Task 4 — `sneakers-text`** (`https://infisical.com/`, credit Infisical): text that resolves from random gibberish characters into readable words (the *Sneakers* decode effect), per-character scramble settling left-to-right.
- [ ] **Task 5 — `midjourney-swirl`** (`https://www.midjourney.com/home`, credit Midjourney): hero text whose letters/pixels swirl/flow into place (text swirl only — no CRT). Canvas or per-glyph transform approach.
- [ ] **Task 6 — `electron-lines`** (`https://schematichq.com/` + `https://portkey.ai/`, credit Schematic / Portkey): an SVG circuit/path diagram with bright "electron" pulses traveling along the paths (animated `stroke-dashoffset` or moving gradient/dot along `<path>`).
- [ ] **Task 7 — `resend-cube`** (`https://resend.com/home`, credit Resend): a 3D Rubik's cube rotating slowly, classic colors (white/red/blue/orange/green/yellow), light/neutral background. CSS 3D transforms or canvas.

Each task ends with: open the file directly to sanity-check, then `git add public/effects/<slug>.html src/demos/<slug>.json && git commit -m "feat: add <slug> demo"`.

---

### Task 8: LLM guides — skill.md + llms.txt

**Files:**
- Create: `public/skill.md`, `public/llms.txt`

- [ ] **Step 1:** `public/skill.md` — "STOP — read this first" agent banner; what the project is; repo layout; "To use an effect, copy `public/effects/<slug>.html` — it is fully self-contained"; the attribution expectation (keep the credit); list all slugs with source URLs; note it was generated with Claude Code.
- [ ] **Step 2:** `public/llms.txt` — short machine index: project one-liner, link to `/skill.md`, list of `<slug>: <sourceUrl>`.
- [ ] **Step 3:** Commit.

---

### Task 9: Thumbnail screenshot script

**Files:**
- Create: `scripts/take-screenshots.mjs`, `README.md`

- [ ] **Step 1:** `scripts/take-screenshots.mjs` — start a static server for `public/` (or `dist/`), use Playwright (`playwright` dep or the running MCP) to load each `effects/<slug>.html`, set viewport 1200×750 @ deviceScaleFactor 2, wait ~1.5s for warm-up, screenshot to `public/thumbs/<slug>.png`. Loop over slugs derived from `src/demos/*.json`.
- [ ] **Step 2:** `README.md` — project intro, "Generated with Claude Code", how to dev (`npm run dev`), build, regenerate thumbnails, add a new demo (new `public/effects/<slug>.html` + `src/demos/<slug>.json`), and deploy (Vercel / GitHub Pages base-path note).
- [ ] **Step 3:** Commit.

---

### Task 10: Generate thumbnails, full build, and browser verification

- [ ] **Step 1:** Run the screenshot script (or drive the Playwright MCP on :8931) to produce all 6 `public/thumbs/<slug>.png`.
- [ ] **Step 2:** For EACH demo: load `effects/<slug>.html` in Playwright, confirm (a) no console errors, (b) the effect is animating (e.g. evaluate that canvas pixels change between two frames, or DOM/text mutates), (c) it fills the viewport. Fix any demo that fails.
- [ ] **Step 3:** `npm run build`; serve `dist/` and load `/` — confirm all 6 thumbnails render and each demo page shows live preview + a non-empty `<pre><code>` block + credit. Confirm `/skill.md` and `/llms.txt` are reachable.
- [ ] **Step 4:** Commit thumbnails + any fixes: `git commit -m "feat: add thumbnails and verify all demos"`.

---

## Self-Review

- **Spec coverage:** index (T1/T4-step), demo pages w/ iframe+code+technique+credit (T1), single-source-of-truth html (data contract + T2-7), modal (T1-step5), skill.md/llms.txt (T8), thumbnails via Playwright (T9/T10), Claude Code badge + reactbits credit (T1/global), 6 named demos (T2-7), deploy notes (T9 README). Covered.
- **Placeholders:** none — each demo task names source, credit, and concrete technique.
- **Type consistency:** all tasks use the one `src/demos/<slug>.json` schema and `public/effects/<slug>.html` path defined in the Data Contract.
