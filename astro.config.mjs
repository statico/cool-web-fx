// @ts-check
import { defineConfig } from 'astro/config';

// Static output, deployed to Vercel at https://fx.statico.io. The site is
// served from the domain root, so `base` stays at '/'. SITE_URL is here only
// so preview builds can override the canonical/absolute URLs.
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://fx.statico.io',
  trailingSlash: 'ignore',
});
