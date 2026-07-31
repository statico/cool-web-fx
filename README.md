# cool-web-fx

**Cool web interaction effects that Ian likes** — a static gallery of front-end
effects, each recreated from scratch as a single self-contained, copy-pasteable
HTML/CSS/JS file.

Built with [Astro](https://astro.build), **generated with
[Claude Code](https://claude.com/claude-code)**, and inspired by
[reactbits.dev](https://reactbits.dev).

Every effect is a **faithful recreation** of something seen on another site, with
credit to the original. Where a site ships its effect as plain client-side
CSS / JS / shaders, the demo ports that real browser-delivered code (distilled into
a clean standalone file); where it ships a binary scene or video, the demo is an
independent recreation of the look. Credit always goes to the original site.

## Effects

| Effect | What it is | Seen on |
|--------|------------|---------|
| Cyber Ambient Overlay | A matrix field of monospace glyphs that ripple and rainbow as invisible circular waves wash outward across the header. | [ChatGPT](https://chatgpt.com/cyber) |
| On-Command Grid Bloom | A skewed white grid blooms out of a lime light haze behind a bold heading, with a flowing gradient CTA whose conic border ring spins. | [Meshy](https://www.meshy.ai/) |
| Midjourney Prompt Vortex | A wall of real Midjourney prompts swirled into a slow CRT vortex with the wordmark fading up at its eye. | [Midjourney](https://www.midjourney.com/home) |
| Sneakers Text Decode | Characters scramble through random glyphs then snap left-to-right into readable text — like a cipher decode from the movie Sneakers. | [Infisical](https://infisical.com/) |
| Electron Pulse Lines | Bright electron pulses race along circuit-board Bézier paths between glowing connected nodes. | [Schematic](https://schematichq.com/), [Portkey](https://portkey.ai/) |
| Particle Text Vortex | Luminous particles spiral out of a vortex and settle into glowing typographic forms, then dissolve and reform the next word. | Original effect |
| Black Rubik's Cube | An all-black Rubik's cube with mixed matte/glossy finishes, slowly turning under studio light (Three.js). | [Resend](https://resend.com/home) |
| Rotating Rainbow Border Button | A pill button whose thin gradient outline spins forever, with a blurred glow that blooms on hover. | [Resend](https://resend.com/home) |
| Conic Gradient Sweep Border | A card whose border is a bright arc that sweeps around the perimeter, painted with a rotating conic gradient. | [Resend](https://resend.com/home) |
| Vertical-Line Glyph Dither | A slowly tumbling extruded glyph, raymarched and re-rendered as vertical ASCII-style bars whose width tracks brightness, with a headline in front. | [CodeRabbit](https://app.coderabbit.ai/login) |
| Warped Text Wall | A wall of text in tall draggable columns, crisp at the top and smeared into hot-pink weather at the bottom as a flow field resamples every character. | [Nell](https://nell.ai/) |
| ASCII Cloud Banner | A coral ASCII-art field of concentric arcs shimmers behind the OpenClaw hero banner while a bright wave radiates outward along the arcs — monospace glyphs reading as horizontal wavy lines, behind a bold heading. | [OpenClaw](https://openclaw.ai/) |

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

Live at **[fx.statico.io](https://fx.statico.io)**, deployed on Vercel. The
Vercel Git integration builds every push to `main`; framework preset **Astro**,
no config needed. Since the site is served from the domain root there is no
base path to set (see `astro.config.mjs`).

## License

The code in this repository is released into the public domain under
[the Unlicense](UNLICENSE) — take it, change it, ship it, no attribution
needed.

That covers this gallery's own code only. **The original code, designs, and
techniques belong to their respective creators**, and every site credited above
retains all rights to its own implementation. The effects here are independent
recreations offered for **educational use** — to show how something is built —
and each one names the site that inspired it.

---

Generated with [Claude Code](https://claude.com/claude-code).
