#!/usr/bin/env node
// Smoke test for Пиріжок проти гравітації.
// Opens index.html on a phone screen (375×812, touch), checks that an old unversioned save
// migrates, taps "play" and plays a little, and that both saves survive a reload:
// the run in progress (pyrizhok_run) and the fish/wardrobe save (pyrizhok_save).
// Fails on any console error, page error or failed request.
//   npm test                        (= node tests/smoke.mjs, serves the repo)
//   SITE_DIR=_site node tests/smoke.mjs   (serves the Pages build instead)
// Needs `npm install` once and the Chromium headless shell: npx playwright-core install chromium-headless-shell
// Uses the game's own test hooks in window.__pz; the game is not changed for this test.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(REPO, process.env.SITE_DIR || '.');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(buf);
  });
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;

let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? '  ok  ' : '  FAIL'} ${msg}`); if (!ok) failed++; };

// The game maps a touch with (clientX * DPR - OX) / S on a 180×320 logical canvas (see resize() in index.html).
// This is the inverse, so the test can tap a button by its logical rectangle from __pz.btn().
const tapLogical = async (page, lx, ly) => {
  const { x, y } = await page.evaluate(([lx, ly]) => {
    const LW = 180, LH = 320, dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = Math.round(innerWidth * dpr), ch = Math.round(innerHeight * dpr);
    const s = Math.min(cw / LW, ch / LH), ox = (cw - LW * s) / 2, oy = (ch - LH * s) / 2;
    return { x: (lx * s + ox) / dpr, y: (ly * s + oy) / dpr };
  }, [lx, ly]);
  await page.touchscreen.tap(x, y);
};
const ready = (page) => page.waitForFunction(() => window.__pz && __pz.st(), null, { timeout: 10000 });
const RUN_FIELDS = ['score', 'lives', 'room', 'roomCount', 'broken'];
const pickRun = (r) => r && Object.fromEntries(RUN_FIELDS.map((k) => [k, r[k]]));

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  await ready(page);
  check(await page.evaluate(() => __pz.st()) === 'title', `title screen at 375×812 in ${Date.now() - t0} ms`);

  // An old save from before `v` existed, with the tutorial already seen.
  await page.evaluate(() => localStorage.setItem('pyrizhok_save', JSON.stringify({ fish: 12, coat: 'ginger', owned: ['head:bow'], tut: 1 })));
  await page.reload({ waitUntil: 'load' });
  await ready(page);
  const migrated = await page.evaluate(() => __pz.SAVE());
  check(migrated.v === 1 && migrated.fish === 12 && migrated.owned.includes('head:bow'), `unversioned save migrates to v1 (fish ${migrated.fish})`);

  // "Play" is the wide button under the logo.
  const play = await page.evaluate(() => __pz.btn().map(({ x, y, w, h }) => ({ x, y, w, h })).find((b) => b.w >= 90 && b.h <= 30));
  check(!!play, 'play button found');
  if (play) await tapLogical(page, play.x + play.w / 2, play.y + play.h / 2);
  await page.waitForFunction(() => __pz.st() === 'play', null, { timeout: 3000 }).catch(() => {});
  check(await page.evaluate(() => __pz.st()) === 'play', 'tapping «ГРАТИ» starts a run');

  for (const [x, y] of [[90, 150], [60, 180], [120, 140], [90, 200], [70, 160], [110, 170]]) {
    await tapLogical(page, x, y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => { for (let i = 0; i < 180; i++) __pz.step(1 / 60); });
  check(await page.evaluate(() => __pz.G().lives > 0 || __pz.st() === 'over'), 'six taps and three seconds of play');

  // Run in progress survives a reload (the game also autosaves on pagehide).
  if (await page.evaluate(() => __pz.st()) === 'play') {
    // Distinctive values, so a run that silently fell back to defaults can't pass.
    await page.evaluate(() => { __pz.pause(true); Object.assign(__pz.G(), { score: 37, broken: 2 }); __pz.save(); });
    const before = pickRun(await page.evaluate(() => __pz.run()));
    await page.reload({ waitUntil: 'load' });
    await ready(page);
    const after = pickRun(await page.evaluate(() => __pz.run()));
    check(JSON.stringify(before) === JSON.stringify(after), `run survives a reload ${JSON.stringify(after)}`);
    await page.evaluate(() => __pz.resume());
    check(await page.evaluate(() => __pz.st() === 'play' && __pz.G().score) === before.score, 'the saved run resumes with the same score');
  } else {
    check(false, 'run ended before it could be saved');
  }

  // Finishing a run pays fish into the main save, and that survives a reload too.
  await page.evaluate(() => __pz.finish());
  const fish = await page.evaluate(() => __pz.SAVE().fish);
  await page.reload({ waitUntil: 'load' });
  await ready(page);
  const reloaded = await page.evaluate(() => __pz.SAVE());
  check(reloaded.fish === fish && fish > 12 && reloaded.owned.includes('head:bow'), `the run pays fish and they survive a reload with the wardrobe (12 → ${reloaded.fish})`);
  check(await page.evaluate(() => __pz.run()) === null, 'a finished run is not offered again');

  check(!errors.length, 'no console errors, page errors or failed requests');
  for (const e of [...new Set(errors)].slice(0, 10)) console.log('    ' + e.slice(0, 300));
} catch (e) {
  check(false, 'test crashed: ' + e.message.split('\n')[0]);
} finally {
  await browser.close();
  server.close();
}
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
