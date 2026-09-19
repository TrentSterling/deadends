from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,traceback
W=Path('/mnt/data/dead_ends_v19_work');src=Path('/mnt/data/dead_ends_v19.html').read_text()
failure='''<script>window.Peer=class {constructor(){this.open=false;this.destroyed=false;this.handlers={};setTimeout(()=>this.handlers.error?.({type:'network'}),5);}on(k,f){this.handlers[k]=f;return this;}destroy(){this.destroyed=true;} };</script>'''
out={'checks':[],'errors':[],'notes':['Native BroadcastChannel between opener/popup about:blank pages sharing an inherited origin.','PeerJS discovery failure injected to exercise offline local fallback. Not an internet test.']}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding']);c=b.new_context(viewport={'width':1280,'height':800});pages=[]
 def new():
  if not pages:p=c.new_page()
  else:
   with pages[0].expect_popup() as pop:pages[0].evaluate('window.open("about:blank")')
   p=pop.value
  p.set_default_timeout(10000);p.on('pageerror',lambda e:out['errors'].append(str(e)))
  p.set_content(failure+src,wait_until='domcontentloaded');p.wait_for_function('window.DEAD_ENDS && !document.getElementById("playBtn").disabled');pages.append(p);return p
 def test(name,fn):
  try:r=fn();out['checks'].append({'name':name,'pass':True,'detail':r});print('PASS',name,r,flush=True)
  except Exception as e:out['checks'].append({'name':name,'pass':False,'error':str(e)});print('FAIL',name,e,flush=True)
 def state(p):return p.evaluate('({phase:DEAD_ENDS.state.phase,mode:DEAD_ENDS.state.netMode,slot:DEAD_ENDS.state.localSlot,room:DEAD_ENDS.state.roomCode,ready:DEAD_ENDS.getNetwork().ready,connected:DEAD_ENDS.state.netConnected,humans:DEAD_ENDS.state.players.filter(p=>!p.bot).length,log:DEAD_ENDS.getNetwork().log})')
 a=new()
 def first():
  t=time.time();a.click('#publicBtn');a.wait_for_function('DEAD_ENDS.state.netMode==="host" && DEAD_ENDS.state.phase==="play"');return {'seconds':round(time.time()-t,2),**state(a)}
 test('one-click first player opens local public squad',first)
 d=new()
 def second():
  t=time.time();d.click('#publicBtn');d.wait_for_function('DEAD_ENDS.state.netMode==="client" && DEAD_ENDS.getNetwork().ready',timeout=16000);a.wait_for_function('DEAD_ENDS.state.players.filter(p=>!p.bot).length===2');return {'seconds':round(time.time()-t,2),**state(d)}
 test('one-click second tab joins and ACKs readiness',second)
 def move():
  before=d.evaluate('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].y');d.keyboard.down('s');d.wait_for_timeout(500);d.keyboard.up('s');d.wait_for_timeout(150);after=d.evaluate('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].y');assert after-before>15,(before,after);return {'delta':round(after-before,1)}
 test('remote native keyboard input moves host-authoritative survivor',move)
 def door():
  a.evaluate('DEAD_ENDS.qa19.setDoor(true)');d.wait_for_function('DEAD_ENDS.getShelter().door.open');a.wait_for_timeout(400);a.evaluate('DEAD_ENDS.qa19.setDoor(false)');d.wait_for_function('!DEAD_ENDS.getShelter().door.open');return d.evaluate('DEAD_ENDS.getShelter().door')
 test('starting door open-close replicated',door)
 def tactic():
  id=a.evaluate('DEAD_ENDS.state.props.find(p=>p.type==="door").id');a.evaluate('(id)=>DEAD_ENDS.debugV14.door(id)',id);d.wait_for_function('(id)=>DEAD_ENDS.state.props.find(p=>p.id===id).open14',arg=id);return {'id':id,'open':True}
 test('Claude tactical door field retained',tactic)
 def four():
  for i in range(2):
   p=new();p.click('#publicBtn');p.wait_for_function('DEAD_ENDS.getNetwork().ready&&DEAD_ENDS.state.netMode==="client"',timeout=20000)
  return state(a)
 test('four players automatically share one room',four)
 def fifth():
  p=new();p.click('#publicBtn');p.wait_for_function('DEAD_ENDS.state.netMode==="host"&&DEAD_ENDS.state.phase==="play"',timeout=20000);assert p.evaluate('DEAD_ENDS.state.roomCode')!='LOBBY';return state(p)
 test('fifth player opens overflow public squad instead of full-room loop',fifth)
 def disconnect():
  slot=d.evaluate('DEAD_ENDS.state.localSlot');d.evaluate('DEAD_ENDS.goMenu()');a.wait_for_function('(s)=>DEAD_ENDS.state.players[s].bot',arg=slot);return {'slot':slot,'bot':True}
 test('client leaves, AI takes over',disconnect)
 a.screenshot(path=str(W/'two_tab_host.png'));pages[2].screenshot(path=str(W/'two_tab_client.png'))
 out['states']=[state(p) for p in pages];out['pass']=all(r['pass'] for r in out['checks']) and not out['errors'];(W/'qa_public.json').write_text(json.dumps(out,indent=2));b.close()
print('RESULT',out['pass'],flush=True)
