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

## Dev files that are publicly served
Pages serves the whole repo, so these dev files are public URLs: `original.html`, `cat-variants.html`, `cat-variants.png`, `chibi_rows.js`, `cat-sounds-demo.mp3`, plus the raw `audio/*.mp3`, `fonts/*` and the embed scripts. Suggestion (not done): move the prototypes and demos into `dev/` (or out of the Pages branch) so only `index.html` is the game.
