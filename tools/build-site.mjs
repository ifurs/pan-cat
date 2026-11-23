#!/usr/bin/env node
// Builds the GitHub Pages site into _site/: the game (index.html) plus the license and credit files.
// Prototypes in dev/, raw audio and fonts, embed scripts and tests are not published.
//   node tools/build-site.mjs [outDir]     (default _site)
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// index.html embeds the sounds and fonts; the credit and OFL files travel with it.
export const SHIP = ['index.html', 'LICENSE', 'audio/CREDITS.txt', 'fonts/CREDITS.txt', 'fonts/OFL-PressStart2P.txt', 'fonts/OFL-Tiny5.txt'];

export function buildSite(out = join(root, '_site')) {
  out = resolve(out);
  if (!relative(root, out) || root.startsWith(out)) throw new Error(`refusing to build into ${out}`);
  rmSync(out, { recursive: true, force: true });
  for (const f of SHIP) {
    mkdirSync(dirname(join(out, f)), { recursive: true });
    cpSync(join(root, f), join(out, f));
  }
  const count = (d) => readdirSync(d).reduce((n, f) => n + (statSync(join(d, f)).isDirectory() ? count(join(d, f)) : 1), 0);
  return { out, files: count(out) };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const r = buildSite(process.argv[2] ? resolve(process.argv[2]) : undefined);
  console.log(`built ${relative(process.cwd(), r.out) || '.'}: ${r.files} files`);
}
