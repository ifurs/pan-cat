# Пиріжок проти гравітації: notes for Claude

Pixel-art phone game in one file, `index.html`, served as-is by GitHub Pages (https://ifurs.github.io/pan-cat/). Public repo: no secrets or private notes in any file.

## Single-file build
- `index.html` is the source and the build: edit it directly. It has no dependencies, and sounds and fonts are base64 inside it.
- The embed scripts rewrite only the block between markers, in place:
  - `python3 audio/embed.py`: `audio/*.mp3` → `/*SND-BEGIN*/…/*SND-END*/`
  - `python3 audio/embed_music.py [--remove]`: optional background song (`MUS_SRC`)
  - `python3 fonts/embed_fonts.py`: `fonts/*.woff2` → `/*FONT-BEGIN*/…/*FONT-END*/`
- Never hand-edit inside those markers. Avoid reading the whole file (about 250 KB, mostly base64): grep for what you need.
- Credits: `audio/CREDITS.txt` (CC0), `fonts/CREDITS.txt` (OFL).
- Test hooks: `window.__pz` (step, SAVE, wardrobe, btn, run, ...) for headless checks.

## Save format rule (localStorage)
- `pyrizhok_save`: fish 🐟, wardrobe (`coat/eyes/head/neck`, `owned`), skill, settings. Versioned with `v` (currently 1). Unversioned saves are treated as v1 by `migrate()`.
- `pyrizhok_run`: the run in progress, `v: 1`. `pyrizhok_best`: best score.
- Changing the shape of a saved field means: bump `v`, add a step to `migrate()` (or the `loadRun` check) and keep existing players' fish and wardrobe. Never rename or drop a key without migrating it. Verify headless with an old-format save seeded in localStorage.

## Design rules
- Phone-first: portrait, touch, logical canvas 180×320; test at 375×812. Desktop is secondary.
- User-facing text is Ukrainian.

## Tests and CI
- `npm install` once (installs `playwright-core`; uses the cached Chromium headless shell, or `npx playwright-core install chromium-headless-shell`).
- `npm test` (= `node tests/smoke.mjs`): loads the game at 375×812 with touch, seeds an unversioned save and checks it migrates, taps «ГРАТИ», plays, checks the run (`pyrizhok_run`) and the fish/wardrobe save (`pyrizhok_save`) survive a reload, and fails on any console error, page error or failed request. It uses `window.__pz` only; the game has no extra test code.
- `.github/workflows/smoke.yml` runs it on every push and PR.

## Publishing (GitHub Pages)
- `node tools/build-site.mjs` builds `_site/`: `index.html`, `LICENSE` and the credit/OFL files. Nothing else is published.
- `.github/workflows/pages.yml` (on push to main): build `_site/`, smoke-test that folder (`SITE_DIR=_site`), deploy with `actions/deploy-pages`.
- The deploy job runs only when Settings → Pages → Source is "GitHub Actions". While it is "Deploy from a branch", Pages keeps serving the whole `main` branch as before and the workflow skips the deploy with a notice.
- If a new shipped file is ever added (unlikely for a one-file game), add it to `SHIP` in `tools/build-site.mjs`.

## Dev files
Prototypes and demos live in `dev/` (`original.html`, `cat-variants.*`, `chibi_rows.js`, `cat-sounds-demo.mp3`). With the Pages workflow they are not published; with branch deploy they are still public under `/dev/`.
