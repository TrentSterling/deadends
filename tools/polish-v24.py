"""Build index.html for v24.1: ChatGPT's v24.1 drop (versions/dead_ends_v24.1-chatgpt.html),
built on its v24 -> v23 -> v22.1, which descends from our shipped v19.6 (tracer fix, L4D safehouse door
and og-image ?v=2 are all already inside). The only thing it lacks is the SEO About block,
which lives outside the game script; carry it over verbatim from the current index.html.
Aborts without writing if any anchor is missing. Run from the repo root:
    python tools/polish-v24.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'versions' / 'dead_ends_v24.1-chatgpt.html'
DST = ROOT / 'index.html'
html = SRC.read_text(encoding='utf-8')
live = DST.read_text(encoding='utf-8')

m = re.search(r'<!-- tront-about:start -->.*?<!-- tront-about:end -->\n', live, re.S)
if not m:
    sys.exit('ABORT: no tront-about block in current index.html')
if 'tront-about:start' in html:
    sys.exit('ABORT: drop already has an About block')
if html.count('</body>') != 1:
    sys.exit('ABORT: expected exactly one </body>')
html = html.replace('</body>', m.group(0) + '</body>')

DST.write_text(html, encoding='utf-8', newline='')
print(f'wrote {DST} ({len(html)} chars)')
