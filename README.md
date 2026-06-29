# cool-web-fx

**Cool web interaction effects that Ian likes** — a static gallery of front-end
effects, each recreated from scratch as a single self-contained, copy-pasteable
HTML/CSS/JS file.

Built with [Astro](https://astro.build), **generated with
[Claude Code](https://claude.com/claude-code)**, and inspired by
[reactbits.dev](https://reactbits.dev).

Every effect is an **independent recreation** of something seen on another site,
with credit to the original. No proprietary source code was copied.

## Effects

| Effect | Seen on |
|--------|---------|
| Cyber Canvas — particle/network background | [chatgpt.com/cyber](https://chatgpt.com/cyber) |
| Lighting, Dust & Grid — perspective grid + bloom + motes | [meshy.ai](https://www.meshy.ai/) |
| Sneakers Text Decode — gibberish→readable text | [infisical.com](https://infisical.com/) |
| Midjourney Text Swirl — particles swirling into text | [midjourney.com](https://www.midjourney.com/home) |
| Electron Pulse Lines — pulses along SVG paths | [schematichq.com](https://schematichq.com/), [portkey.ai](https://portkey.ai/) |
| Rotating Rubik's Cube — CSS 3D | [resend.com](https://resend.com/home) |

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
npm run preview  # serve the built site
```

## How it's structured

- `public/effects/<slug>.html` — the canonical, runnable, copy-paste source for
  each effect. Self-contained: no external scripts, fonts, or images.
- `src/demos/<slug>.json` — metadata (title, source, credit, blurb, technique
  writeup).
- `src/pages/index.astro` — the gallery index.
- `src/pages/demos/[slug].astro` — per-effect page: live `<iframe>` preview, a
  copy button + code modal, the full code printed inline (for humans and LLMs),
  the technique writeup, and source/credit.
- `public/skill.md` + `public/llms.txt` — LLM/agent guides.

The same `<slug>.html` file is the live preview, the copy-paste block, and the
screenshot source — so the code shown can never drift from the code running.

## Regenerate thumbnails

```bash
npm i -D playwright && npx playwright install chromium   # one-time
npm run thumbs                                           # -> public/thumbs/<slug>.png
```

## Add a new effect

1. Create `public/effects/<slug>.html` (fully self-contained, no external
   resources).
2. Create `src/demos/<slug>.json` (copy the schema from any existing one; set a
   unique `order`).
3. `npm run thumbs` to capture the thumbnail.

The index and demo page are generated automatically.

## Deploy

Static output in `dist/` — host anywhere.

- **Vercel:** import the repo; framework preset **Astro**; no config needed.
- **GitHub Pages:** set `SITE_URL` and `BASE_PATH` for the project path, e.g.

  ```bash
  SITE_URL=https://<user>.github.io BASE_PATH=/cool-web-fx/ npm run build
  ```

  then publish `dist/`. (See `astro.config.mjs`.)

---

Generated with [Claude Code](https://claude.com/claude-code).
