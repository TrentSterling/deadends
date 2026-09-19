"""Build index.html for v19.6: ChatGPT's v19 drop (versions/dead_ends_v19-chatgpt.html),
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
    "buildCredit111.textContent='Build 19.6 · Living streets / one-click co-op';$('menu').dataset.build='19.6';")
rep("Object.assign(DEAD_ENDS,{build:'19',makeSnapshot,", "Object.assign(DEAD_ENDS,{build:'19.6',makeSnapshot,")

# ---- 19.6: a client never saw its own tracers after its first reload. The reload countdown (v13 sim)
# ---- ends one step below zero and stays there (-1/60), the value rides to the client in snapshots,
# ---- and the client's predicted shot tested it for truthiness, so a slightly negative reload blocked
# ---- local prediction forever (flash and ammo still arrived from the host, so the gun looked alive).
# ---- Fix both ends: clamp the countdown to 0 when it completes, and compare numerically.
rep("p.reserves[wi]-=need;sfx('click',p.x,p.y)}}}",
    "p.reserves[wi]-=need;sfx('click',p.x,p.y)}if(p.reload<0)p.reload=0;}}")
rep("if(input.shoot&&clock>=nextPredictedShot&&!p.dead&&(!p.reload||p.weapon===1)&&",
    "if(input.shoot&&clock>=nextPredictedShot&&!p.dead&&(!(p.reload>0)||p.weapon===1)&&")
rep("if(act==='reload'){input.reload=true;if(p.ammo[p.weapon]>0&&!p.reload)complete();}",
    "if(act==='reload'){input.reload=true;if(p.ammo[p.weapon]>0&&!(p.reload>0))complete();}")


# ---- 19.6: safehouse door works like Left 4 Dead. v19 refused to close while any infected stood in the
# ---- room and ended the chapter the instant the door shut, so "close it early and leave them outside"
# ---- was impossible. Now: anyone inside can close it whenever the doorway itself is clear; a closed door
# ---- is solid and any survivor (or a bot walking up to it) can open it from either side; the chapter ends
# ---- only when every survivor who is still alive is inside. Downed survivors outside keep the run going
# ---- until they bleed out. Host-authoritative; clients get door state through the v15 seal rows.
rep(" if(zombies.some(z=>z.hp>0&&inSafeGeom14(z))){toast('Clear the infected out of the safehouse.');return false;}\n"
    " if(!canCloseDoor14(d)){toast('Clear the doorway first.');return false;}\n",
    " if(!canCloseDoor14(d)){toast('Clear the doorway first.');return false;}\n")
rep("updateFinalSafe14=function(dt){\n"
    " if(netMode==='client'||!v14.safe.closing||v14.safe.closed)return;\n"
    " const p=players[v14.safe.closer],d=sim19.finalDoor;\n"
    " if(!p||p.dead||p.down||p.pinnedBy>=0||!inSafeGeom14(p)||dist(p,safeDoorCenter19())>150){cancelSeal19('The survivor sealing the door was interrupted.');return;}\n"
    " if(!d||!canCloseDoor14(d)||zombies.some(z=>z.hp>0&&inSafeGeom14(z))){cancelSeal19('Get the doorway and room clear.');return;}\n"
    " v14.safe.amount=clamp(v14.safe.amount+dt/0.6,0,1);d.amount=1-v14.safe.amount;\n"
    " if(v14.safe.amount>=1){\n"
    "  v14.safe.closed=true;d.solid=true;d.open=false;d.amount=0;sim19.doorRevision++;\n"
    "  cue19('seal-close',d.x,d.y);event13('safehouse-closed',{inside:players.filter(p=>!p.dead&&inSafeGeom14(p)).length});finishRun(true);\n"
    " }\n"
    "};\n",
    "function openSeal19(p){\n"
    " if(netMode==='client'||phase!=='play'||!v14.safe.closed)return false;const d=sim19.finalDoor;if(!d)return false;\n"
    " v14.safe.closed=false;v14.safe.closing=false;v14.safe.amount=0;v14.safe.closer=-1;\n"
    " d.open=true;d.solid=false;d.amount=1;sim19.doorRevision++;buildNav();\n"
    " cue19('seal-start',d.x,d.y);event13('safehouse-opened',{slot:p?p.id:-1});\n"
    " if(netMode==='host')netEvents.push({type:'notice',title:'DOOR OPENED',sub:(p&&p.name?p.name:'A SURVIVOR')+' OPENED THE SAFEHOUSE'});\n"
    " return true;\n"
    "}\n"
    "function survivorsOutside19(){return players.filter(q=>!q.dead&&!inSafeGeom14(q));}\n"
    "updateFinalSafe14=function(dt){\n"
    " if(netMode==='client'||phase!=='play')return;const d=sim19.finalDoor;\n"
    " if(v14.safe.closed){\n"
    "  if(!d)return;const out=survivorsOutside19();\n"
    "  if(!out.length){finishRun(true);return;}\n"
    "  for(const q of out)if(q.bot&&!q.down&&q.pinnedBy<0&&dist(q,safeDoorCenter19())<70){openSeal19(q);return;}\n"
    "  return;\n"
    " }\n"
    " if(!v14.safe.closing)return;\n"
    " const p=players[v14.safe.closer];\n"
    " if(!p||p.dead||p.down||p.pinnedBy>=0||!inSafeGeom14(p)||dist(p,safeDoorCenter19())>150){cancelSeal19('The survivor closing the door was interrupted.');return;}\n"
    " if(!d||!canCloseDoor14(d)){cancelSeal19('Something is in the doorway.');return;}\n"
    " v14.safe.amount=clamp(v14.safe.amount+dt/0.6,0,1);d.amount=1-v14.safe.amount;\n"
    " if(v14.safe.amount>=1){\n"
    "  v14.safe.closed=true;d.solid=true;d.open=false;d.amount=0;sim19.doorRevision++;buildNav();\n"
    "  const out=survivorsOutside19();\n"
    "  cue19('seal-close',d.x,d.y);event13('safehouse-closed',{inside:players.filter(q=>!q.dead&&inSafeGeom14(q)).length,outside:out.length});\n"
    "  if(out.length){announce('DOOR CLOSED',out.length+' STILL OUT THERE. THEY CAN OPEN IT.',2.2);if(netMode==='host')netEvents.push({type:'notice',title:'DOOR CLOSED',sub:'SURVIVORS OUTSIDE CAN STILL OPEN IT'});}\n"
    " }\n"
    "};\n")
rep(" if(a?.kind==='safe14'){\n"
    "  if(dist(p,safeDoorCenter19())>135)return null;\n"
    "  if(zombies.some(z=>z.hp>0&&inSafeGeom14(z)))return{kind:'safeBlocked19',text:'CLEAR THE INFECTED INSIDE'};\n"
    "  return a;\n"
    " }return a;\n",
    " if(v14.safe.closed&&!p.dead&&!p.down&&dist(p,safeDoorCenter19())<=135)return{kind:'safeOpen19',text:'OPEN THE SAFEHOUSE DOOR'};\n"
    " if(a?.kind==='safe14'){\n"
    "  if(dist(p,safeDoorCenter19())>135)return null;\n"
    "  if(!canCloseDoor14(sim19.finalDoor))return{kind:'safeBlocked19',text:'CLEAR THE DOORWAY'};\n"
    "  return a;\n"
    " }return a;\n")
rep("const interactBefore19=interact;interact=function(p,...args){\n",
    "const interactBefore19=interact;interact=function(p,...args){\n"
    " if(args[0]&&!p.lastInteract&&nearestAction(p)?.kind==='safeOpen19'){p.interactHold=0;openSeal19(p);return;}\n")
rep(" d.open=!v14.safe.closing&&!v14.safe.closed;d.amount=v14.safe.closed?0:1-v14.safe.amount;d.solid=v14.safe.closed;\n",
    " d.open=!v14.safe.closing&&!v14.safe.closed;d.amount=v14.safe.closed?0:1-v14.safe.amount;\n"
    " if(d.solid!==v14.safe.closed){d.solid=v14.safe.closed;sim19.doorRevision++;buildNav();}\n")

left = [(i + 1, l[:120]) for i, l in enumerate(html.split('\n')) if '—' in l and not l.lstrip().startswith(('/*', '//', '*'))]
print('em-dash lines outside comments:', left)
DST.write_text(html, encoding='utf-8', newline='\n')
print(f'wrote {DST} ({len(orig)} -> {len(html)} bytes)')
# ---- SEO About block (prose, crosslinks, JSON-LD) so the page is not just a canvas to Google ----
import subprocess
subprocess.run([sys.executable, 'C:/trontstack/seo/about.py', 'deadends'], check=True)
