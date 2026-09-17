"""Apply the v16 edits on top of the v15 file (versions/dead_ends_v15.html -> index.html).
Every replacement must match exactly once or the script aborts. Run from the repo root:
    python tools/polish-v16.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'versions' / 'dead_ends_v15.html'
DST = ROOT / 'index.html'
html = SRC.read_text(encoding='utf-8')

def rep(old, new, count=1):
    global html
    n = html.count(old)
    if n != count:
        sys.exit(f'ABORT: expected {count} match(es), found {n} for: {old[:90]!r}')
    html = html.replace(old, new)

# ---- room namespace ----
rep("new BroadcastChannel('dead-ends-coop-v15')", "new BroadcastChannel('dead-ends-coop-v16')")
rep("'deadends-v15-'+roomCode", "'deadends-v16-'+roomCode")
rep("'deadends-v15-'+code", "'deadends-v16-'+code")

# ---- main menu: PLAY ONLINE goes straight to the public room; codes live under PRIVATE ROOM ----
rep('<button class="menu-action major" id="playBtn">PLAY SOLO</button><button class="menu-action" id="coopBtn">PLAY CO-OP</button>',
    '<button class="menu-action major" id="playBtn">PLAY SOLO</button><button class="menu-action" id="publicBtn">PLAY ONLINE</button><button class="menu-action" id="coopBtn">PRIVATE ROOM</button>')

# ---- co-op panel: public room first, private tools below ----
rep('<div id="roomSetup"><button class="primary" id="hostBtn">HOST GAME</button>',
    '<div id="roomSetup"><button class="primary" id="publicBtn2">PLAY ONLINE · PUBLIC ROOM</button><div class="room-label" style="margin-top:14px">PRIVATE ROOM</div><button class="secondary" id="hostBtn">HOST WITH A CODE</button>')
rep('<p class="note">Open slots use AI. Friends can join mid-run.</p>',
    '<p class="note">Open slots use AI. Anyone can drop into the public room mid-run. Private rooms need the code or invite link.</p>')
rep('data-state="idle">Host a game or enter a room code.</div>', 'data-state="idle">Play online, host a private room, or enter a code.</div>')
rep("netStatus('Host a game or enter a room code.')", "netStatus('Play online, host a private room, or enter a code.')")

# ---- build credit + v16 block ----
rep("buildCredit111.textContent='Build 15 · Co-op polish';$('menu').dataset.build='15';",
    "buildCredit111.textContent='Build 16 · Public room';$('menu').dataset.build='16';")
block = (ROOT / 'tools' / 'v16-block.js').read_text(encoding='utf-8')
if 'DEAD ENDS v16' in html:
    sys.exit('ABORT: v16 block already present')
rep('DEAD_ENDS.ready.then(()=>{assignCallsign15();joinFromHash15();});\n',
    'DEAD_ENDS.ready.then(()=>{assignCallsign15();joinFromHash15();});\n\n' + block)

DST.write_text(html, encoding='utf-8', newline='\n')
print(f'wrote {DST} ({len(html)} chars)')
