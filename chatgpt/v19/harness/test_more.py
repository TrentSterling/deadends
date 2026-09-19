from playwright.sync_api import sync_playwright
from pathlib import Path
import json
W=Path('/mnt/data/dead_ends_v19_work');html=Path('/mnt/data/dead_ends_v19.html').read_text();prefix='<script>window.requestAnimationFrame=f=>(window._queuedRAF=f,1);window.cancelAnimationFrame=()=>{};</script>'
out={'checks':[],'errors':[]}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:out['errors'].append(str(e)));p.set_content(prefix+html,wait_until='domcontentloaded');p.wait_for_function('window.DEAD_ENDS && !document.querySelector("#playBtn").disabled')
 def run(name,f):
  try:r=f();out['checks'].append({'name':name,'pass':True,'detail':r});print('PASS',name,r,flush=True)
  except Exception as e:out['checks'].append({'name':name,'pass':False,'error':str(e)});print('FAIL',name,e,flush=True)
 def j(s):return p.evaluate(s)
 def rescue():
  r=j('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();DEAD_ENDS.setDown(0);DEAD_ENDS.simulate(10);const p=DEAD_ENDS.state.players[0];return{down:p.down,hp:p.hp,rescues:DEAD_ENDS.state.stats.rescues,stage:DEAD_ENDS.getV19().staging,door:DEAD_ENDS.getShelter().door.open};}''');assert not r['down'] and r['rescues']>0 and r['stage'] and not r['door'];return r
 run('bots rescue downed teammate during live preparation',rescue)
 def refill():
  r=j('''()=>{DEAD_ENDS.startMap(0,31987);const p=DEAD_ENDS.state.players[0];p.upgrade14={rifle:true,auto:true};const a=DEAD_ENDS.state.pickups.find(p=>p.type==='ammo');DEAD_ENDS.teleport(a.x,a.y+10);p.reserves[0]=0;p.ammo[0]=0;DEAD_ENDS.qa19.use(0);return{ammo:p.ammo,reserves:p.reserves};}''');assert r['ammo'][0]==14 and r['reserves'][0]==140;return r
 run('ammo pickup cannot overfill 14-round upgraded rifle',refill)
 def old():
  r=j('''()=>{const old={schema:1,map:1,difficulty:1,leg:1,kills:20,time:30,carry:Array.from({length:4},()=>({hp:65,meds:1,bombs:1,molotovs:1,weapon:0}))};const ok=DEAD_ENDS.validateSave(old);old.carry[0].upgrade14={rifle:'yes'};let rejected=false;try{DEAD_ENDS.validateSave(old);}catch(_){rejected=true;}return{old:ok.checkpoint.carry[0],rejected};}''');assert r['old']['upgrade14']=={'rifle':False,'auto':False} and r['rejected'];return r
 run('legacy checkpoints migrate, invalid upgrade flags rejected',old)
 def wire():
  j('DEAD_ENDS.startMap(0,31987)');r=j('DEAD_ENDS.qa19.wireRoundTrip()');assert r['source']>150 and r['source']==r['decoded'] and r['encoded']>16000,r;return r
 run('crowded nonempty snapshot survives Claude JSON/base64 wire codec',wire)
 def shortMelee():
  r=j('''()=>{DEAD_ENDS.clearThreats();const d=DEAD_ENDS.getShelter().door,cy=d.y+d.h/2;DEAD_ENDS.teleport(d.x-18,cy);const q=DEAD_ENDS.spawn(d.x+d.w+36,cy,'brute',true);q.wind=.7;const p=DEAD_ENDS.state.players[0];p.a=0;p.shove=0;const valid=DEAD_ENDS.shove();return{valid,wind:q.wind,hp:q.hp};}''');assert r['valid'] and r['wind']>.6 and r['hp']==730;return r
 run('valid shove cannot interrupt a special through closed steel',shortMelee)
 def downedDoor():
  r=j('''()=>{DEAD_ENDS.startMap(1,31987);DEAD_ENDS.clearThreats();DEAD_ENDS.qa19.setDoor(true);DEAD_ENDS.simulate(.4);const d=DEAD_ENDS.getShelter().door;DEAD_ENDS.teleport(d.x+d.w/2,d.y+d.h/2,1);DEAD_ENDS.setDown(1);const closed=DEAD_ENDS.qa19.setDoor(false);return{closed,open:DEAD_ENDS.getShelter().door.open};}''');assert not r['closed'] and r['open'];return r
 run('downed teammate physically prevents starting shutter closure',downedDoor)
 def finishDamage():
  r=j('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();const s=DEAD_ENDS.getExtra().safe;DEAD_ENDS.teleport(s.x+100,s.y+200);DEAD_ENDS.damage(0,10);return{hp:DEAD_ENDS.state.players[0].hp,phase:DEAD_ENDS.state.phase};}''');assert r['hp']==90 and r['phase']=='play';return r
 run('destination remains vulnerable until closed',finishDamage)
 def nativeMenu():
  j('DEAD_ENDS.goMenu()');p.click('#playBtn');p.keyboard.press('Escape');assert p.locator('#pause').is_visible();p.click('#resumeBtn');assert not p.locator('#pause').is_visible();p.keyboard.press('F2');p.click('[data-tab="senses"]');p.check('#senseToggle19');j('DEAD_ENDS.simulate(.2);DEAD_ENDS.qa19.render()');p.screenshot(path=str(W/'senses19.png'));return {'F2_senses':'visible','pauseResume':True}
 run('native menu/pause/resume/F2 Senses controls render',nativeMenu)
 out['pass']=all(r['pass'] for r in out['checks']) and not out['errors'];(W/'qa_more.json').write_text(json.dumps(out,indent=2));b.close()
