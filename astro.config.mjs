// @ts-check
import { defineConfig } from 'astro/config';

const base = process.env.DEPLOY_TARGET === 'gh-pages' ? '/PDFOnlineLib' : '/';

export default defineConfig({
  output: 'static',
  site: 'https://alienamigo.github.io',
  base,
});
