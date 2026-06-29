// @ts-check
import { defineConfig } from 'astro/config';

// Static output so this deploys unchanged to Vercel or GitHub Pages.
//
// GitHub Pages note: when hosting at https://<user>.github.io/<repo>/, set
//   site: 'https://<user>.github.io',
//   base: '/<repo>/',
// and the BASE_PATH below picks it up. For Vercel / a custom domain, leave
// base unset (defaults to '/').
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://cool-web-fx.example.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
});
