"""Apply the v15 edits to index.html. Every replacement must match exactly once
(or the stated count) or the script aborts without writing. Run from the repo root:
    python tools/polish-v15.py
"""
import re, sys, io
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'index.html'
html = SRC.read_text(encoding='utf-8')
orig = html

def rep(old, new, count=1):
    global html
    n = html.count(old)
    if n != count:
        sys.exit(f'ABORT: expected {count} match(es), found {n} for: {old[:90]!r}')
    html = html.replace(old, new)

# ---- social meta + canonical -------------------------------------------------
rep('<title>DEAD ENDS — a game by Tront</title>', '<title>DEAD ENDS by Tront</title>')
rep('<meta property="og:title" content="DEAD ENDS — by Tront">',
    '<meta property="og:title" content="DEAD ENDS by Tront">\n'
    '<meta property="og:url" content="https://tront.xyz/deadends/">\n'
    '<meta property="og:image" content="https://tront.xyz/deadends/og-image.png?v=1">\n'
    '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">\n'
    '<link rel="canonical" href="https://tront.xyz/deadends/">')
rep('<meta name="twitter:card" content="summary">',
    '<meta name="twitter:card" content="summary_large_image">\n'
    '<meta name="twitter:title" content="DEAD ENDS by Tront">\n'
    '<meta name="twitter:description" content="Top-down co-op zombie escape. Four survivors, huge hordes, one red door. Free in the browser.">\n'
    '<meta name="twitter:image" content="https://tront.xyz/deadends/og-image.png?v=1">')

# ---- em dashes out of player-facing strings -----------------------------------
rep('<span id="distance">— m</span>', '<span id="distance">0 m</span>')
rep('id="endEyebrow">THE LAST BLOCK — COMPLETE</div>', 'id="endEyebrow">THE LAST BLOCK · COMPLETE</div>')
rep("'Downed — keep firing. Wait for a revive.'", "'Downed. Keep firing and wait for a revive.'")
rep("'/4 players — share the room code.'", "'/4 players. Share the room code or invite link.'")
rep("'Downed — fire your pistol. Wait for a revive.'", "'Downed. Fire your pistol and wait for a revive.'")
rep("text:'OPENING — '+", "text:'OPENING: '+")
rep("'FUEL CAN — PISTOL ONLY. TAKE IT TO THE GENERATOR.'", "'FUEL CAN: PISTOL ONLY. TAKE IT TO THE GENERATOR.'")
rep("mapInfo().name+(win?' — COMPLETE':'')", "mapInfo().name+(win?' · COMPLETE':'')")
rep("'Hold out — '+", "'Hold out: '+")
rep("'Fuel the generator — '+", "'Fuel the generator: '+")
rep("'Pinned — a teammate must shoot or shove the leaper'", "'Pinned. A teammate must shoot or shove the leaper.'")
rep("rows.push('\\n'+q.name+' — '+(q.intent||'Idle'))", "rows.push('\\n'+q.name+': '+(q.intent||'Idle'))")
rep("e.title=names10[n]+' — select, then use mouse'", "e.title=names10[n]+': select, then use mouse'")
rep('<option value="30">30 — low power</option>', '<option value="30">30 (low power)</option>')
rep("rows.map(r=>r.label+' — '+r.saved+'/4 · '", "rows.map(r=>r.label+' · '+r.saved+'/4 · '")
rep("(net.roundTripEstimateMs===null?'—':", "(net.roundTripEstimateMs===null?'n/a':")
rep("'Seal the door — keep them back'", "'Seal the door. Keep them back.'")
rep("' / 05 — REACH THE SAFEHOUSE'", "' / 05 · REACH THE SAFEHOUSE'")
rep("'FIND FUEL CANS — '+", "'FIND FUEL CANS: '+")
rep("'PINNED — HELP!'", "'PINNED. HELP!'")
rep("document.title='DEAD ENDS — made by Tront';", "document.title='DEAD ENDS by Tront';", 3)
rep("toast('Capture ready — Save report or press F9.',5)", "toast('Capture ready. Save report or press F9.',5)")
rep("text:'OPEN LOCKED SUPPLIES — ALARM WILL SOUND'", "text:'OPEN LOCKED SUPPLIES. ALARM WILL SOUND'")

# ---- co-op: replicate tactical door state and the safehouse seal --------------
rep("pr:props.map(p=>[p.id,p.destroyed,p.hp,!!p.alarm,p.alarming||0])",
    "pr:props.map(p=>[p.id,p.destroyed,p.hp,!!p.alarm,p.alarming||0,p.open14===undefined?-1:(p.open14?1:0)])")
rep("if(p.destroyed!==a[1]){p.destroyed=a[1];p.solid=!a[1];rebuild=true}p.hp=a[2];p.alarm=a[3];p.alarming=a[4]}",
    "if(p.destroyed!==a[1]){p.destroyed=a[1];p.solid=!a[1];rebuild=true}p.hp=a[2];p.alarm=a[3];p.alarming=a[4];"
    "if(a[5]!==undefined&&a[5]>=0&&p.open14!==undefined){const o=a[5]===1;if(p.open14!==o){p.open14=o;p.solid=!p.destroyed&&!o;flowTimer=0}}}"
    "if(Array.isArray(m.seal))applySeal15(m.seal);")

# ---- co-op: PeerJS JSON channel refuses messages over 16 KB (keyframes are ~26 KB) ----
rep("else c.send(m);s.events=[];recordNetwork13('out',m,raw);", "else sendPeer15(c,m);s.events=[];recordNetwork13('out',m,raw);")

# ---- room namespace: v15 clients only meet v15 hosts ---------------------------
rep("new BroadcastChannel('dead-ends-coop-v13')", "new BroadcastChannel('dead-ends-coop-v15')")
rep("'deadends-v13-'+roomCode", "'deadends-v15-'+roomCode")
rep("'deadends-v13-'+code", "'deadends-v15-'+code")

# ---- squad roster: room for a real name next to the health number --------------
rep(".survivor{--hp:var(--health);position:relative;width:147px;", ".survivor{--hp:var(--health);position:relative;width:168px;")

# ---- build credit --------------------------------------------------------------
rep("buildCredit111.textContent='Build 14 · Combat / escape polish';$('menu').dataset.build='14';",
    "buildCredit111.textContent='Build 15 · Co-op polish';$('menu').dataset.build='15';")

# ---- v15 block ----------------------------------------------------------------
block = (ROOT / 'tools' / 'v15-block.js').read_text(encoding='utf-8')
if 'DEAD ENDS v15' in html:
    sys.exit('ABORT: v15 block already present')
marker = "buildCredit111.textContent='Build 15 · Co-op polish';$('menu').dataset.build='15';\n"
rep(marker, marker + '\n' + block)

left = [(i + 1, l[:120]) for i, l in enumerate(html.split('\n')) if '—' in l and not l.lstrip().startswith(('/*', '//', '*'))]
print('em-dash lines outside comments:', left)
SRC.write_text(html, encoding='utf-8', newline='\n')
print(f'wrote {SRC} ({len(orig)} -> {len(html)} bytes)')
