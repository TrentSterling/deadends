from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time
W=Path('/mnt/data/dead_ends_v19_work');src=Path('/mnt/data/dead_ends_v19.html').read_text()
failure='''<script>window.Peer=class{constructor(){this.open=false;this.destroyed=false;this.handlers={};setTimeout(()=>this.handlers.error?.({type:'network'}),12);}on(k,f){this.handlers[k]=f;return this;}destroy(){this.destroyed=true;}};</script>'''
out={'checks':[],'errors':[],'method':'Native BroadcastChannel; network-library outage injected. Document.hidden override for host-background branch, not OS-throttling certification.'}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);c=b.new_context(viewport={'width':1200,'height':800});a=c.new_page()
 with a.expect_popup() as pop:a.evaluate('window.open("about:blank")')
 d=pop.value
 for p in [a,d]:
  p.set_default_timeout(12000);p.on('pageerror',lambda e:out['errors'].append(str(e)));p.set_content(failure+src,wait_until='domcontentloaded');p.wait_for_function('window.DEAD_ENDS && !document.querySelector("#playBtn").disabled')
 def run(name,f):
  try:r=f();out['checks'].append({'name':name,'pass':True,'detail':r});print('PASS',name,r,flush=True)
  except Exception as e:out['checks'].append({'name':name,'pass':False,'error':str(e)});print('FAIL',name,e,flush=True)
  (W/'qa_public_edges.json').write_text(json.dumps(out,indent=2))
 def race():
  a.click('#publicBtn');d.click('#publicBtn')
  d.wait_for_function('DEAD_ENDS.getNetwork().ready && DEAD_ENDS.state.phase==="play"');a.wait_for_function('DEAD_ENDS.getNetwork().ready && DEAD_ENDS.state.phase==="play"')
  a.wait_for_timeout(800);x=[p.evaluate('({mode:DEAD_ENDS.state.netMode,room:DEAD_ENDS.state.roomCode,n:DEAD_ENDS.state.players.filter(p=>!p.bot).length})') for p in [a,d]]
  assert sorted(q['mode'] for q in x)==['client','host'],x;assert x[0]['room']==x[1]['room'];return x
 run('simultaneous one-button public election yields one host, one client',race)
 h=a if a.evaluate('DEAD_ENDS.state.netMode')=='host' else d;g=d if h==a else a
 def hidden():
  before=g.evaluate('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].y');h.evaluate('window.qaHidden=true;Object.defineProperty(document,"hidden",{configurable:true,get:()=>window.qaHidden});document.dispatchEvent(new Event("visibilitychange"))')
  g.keyboard.down('s');g.wait_for_timeout(550);g.keyboard.up('s');g.wait_for_timeout(200);after=h.evaluate('DEAD_ENDS.state.players[1].y');h.evaluate('window.qaHidden=false;document.dispatchEvent(new Event("visibilitychange"))');assert after-before>30;return {'remoteMovementWhileHostHidden':after-before}
 run('hidden-host worker branch continues simulation and client input',hidden)
 def loss():
  g.evaluate('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].hp=37');h.evaluate('DEAD_ENDS.goMenu()');g.wait_for_function('DEAD_ENDS.state.netMode==="host" && DEAD_ENDS.state.phase==="play" && DEAD_ENDS.getNetwork().ready',timeout=20000)
  return {'newRound':g.evaluate('DEAD_ENDS.state.players[0].hp'),'mode':g.evaluate('DEAD_ENDS.state.netMode')}
 run('public host loss finds a new round, not a fake preserved-world migration',loss)
 def private():
  for p in [a,d]:p.evaluate('DEAD_ENDS.goMenu()')
  a.click('#coopBtn');a.click('#hostBtn');a.wait_for_function('DEAD_ENDS.state.netMode==="host" && !DEAD_ENDS.getNetwork().registering');code=a.evaluate('DEAD_ENDS.state.roomCode')
  d.click('#coopBtn');d.fill('#joinCode',code);d.click('#joinBtn');d.wait_for_function('DEAD_ENDS.state.netConnected')
  a.click('#hostStart');d.wait_for_function('DEAD_ENDS.getNetwork().ready && DEAD_ENDS.state.phase==="play"');assert not d.evaluate('DEAD_ENDS.getNetwork().public');return {'privateCode':code,'ready':True}
 run('private room retains code join and explicit Start',private)
 def cancel():
  for p in [a,d]:p.evaluate('DEAD_ENDS.goMenu()')
  d.click('#publicBtn');d.click('#disconnectBtn');d.wait_for_timeout(1800);s=d.evaluate('({phase:DEAD_ENDS.state.phase,mode:DEAD_ENDS.state.netMode,seeking:DEAD_ENDS.getNetwork().seeking})');assert s['phase']=='menu' and s['mode']=='solo' and not s['seeking'];return s
 run('cancel search stops outstanding async join/host work',cancel)
 out['pass']=all(x['pass'] for x in out['checks']) and not out['errors'];(W/'qa_public_edges.json').write_text(json.dumps(out,indent=2));b.close()
