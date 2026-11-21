#!/usr/bin/env python3
"""Regenerate the /*FONT-BEGIN*/…/*FONT-END*/ @font-face block in ../index.html.
Fonts are subset to Latin+Cyrillic woff2 (see README in commit). OFL 1.1."""
import base64, pathlib, re
here = pathlib.Path(__file__).parent
fonts = [('Tiny5', 'Tiny5.woff2'), ('Press Start 2P', 'PressStart2P.woff2')]
css = ''.join(
    "@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2');font-display:block}\n"
    % (name, base64.b64encode((here / f).read_bytes()).decode()) for name, f in fonts)
p = here.parent / 'index.html'
s = p.read_text()
s, n = re.subn(r'/\*FONT-BEGIN\*/.*?/\*FONT-END\*/', lambda m: '/*FONT-BEGIN*/\n' + css + '/*FONT-END*/', s, flags=re.S)
assert n == 1, n
p.write_text(s)
print('embedded', len(css), 'bytes')
