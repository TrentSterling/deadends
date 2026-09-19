"""Build index.html for v19.5: ChatGPT's v19 drop (versions/dead_ends_v19-chatgpt.html),
which was built ON the shipped v18 (its base sha256 matches commit 3e8807d), so the
v15 co-op transport and the v14 door/seal replication are already inside it, and v19
replaced the v16 public room with its own 16-room discovery. What it lacks is only
what shipped after that base: the reshot og-image meta. Every replacement must match
exactly once (or the stated count) or the script aborts without writing. Run from the
repo root:
    python tools/polish-v19.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'versions' / 'dead_ends_v19-chatgpt.html'
DST = ROOT / 'index.html'
html = SRC.read_text(encoding='utf-8')
orig = html

def rep(old, new, count=1):
    global html
    n = html.count(old)
    if n != count:
        sys.exit(f'ABORT: expected {count} match(es), found {n} for: {old[:90]!r}')
    html = html.replace(old, new)

# ---- social meta: og-image was reshot from the v18 art after ChatGPT took its base ----
rep('og-image.png?v=1', 'og-image.png?v=2', 2)

# ---- build credit: 19.5 = ChatGPT v19 as hosted by Tront. The wire check is protocol19, not this string. ----
rep("buildCredit111.textContent='Build 19 · Living streets / one-click co-op';$('menu').dataset.build='19';",
    "buildCredit111.textContent='Build 19.5 · Living streets / one-click co-op';$('menu').dataset.build='19.5';")
rep("Object.assign(DEAD_ENDS,{build:'19',makeSnapshot,", "Object.assign(DEAD_ENDS,{build:'19.5',makeSnapshot,")

left = [(i + 1, l[:120]) for i, l in enumerate(html.split('\n')) if '—' in l and not l.lstrip().startswith(('/*', '//', '*'))]
print('em-dash lines outside comments:', left)
DST.write_text(html, encoding='utf-8', newline='\n')
print(f'wrote {DST} ({len(orig)} -> {len(html)} bytes)')
