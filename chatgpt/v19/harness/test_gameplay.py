from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,traceback
W=Path('/mnt/data/dead_ends_v19_work');out={'checks':[],'errors':[],'limitations':['Deterministic tests use native game simulation with requestAnimationFrame held by harness.','Complete HTML executed with set_content because URL navigation is blocked.']}
source=Path('/mnt/data/dead_ends_v19.html').read_text()
prefix="""<script>window.requestAnimationFrame=f=>(window._queuedRAF=f,1);window.cancelAnimationFrame=()=>{};</script>"""
def run(name,fn):
 try:
  detail=fn();out['checks'].append({'name':name,'pass':True,'detail':detail});print('PASS',name,json.dumps(detail)[:120],flush=True)
 except Exception as e:out['checks'].append({'name':name,'pass':False,'error':str(e)});print('FAIL',name,str(e),flush=True)
def js(script):return page.evaluate(script)
def check(v,msg):
 if not v:raise AssertionError(msg)
 return v
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.set_default_timeout(10000)
 page.on('pageerror',lambda e:out['errors'].append(str(e)))
 page.set_content(prefix+source,wait_until='domcontentloaded');page.wait_for_function('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled')
 def boot():
  page.click('#playBtn');s=js('({build:DEAD_ENDS.build,phase:DEAD_ENDS.state.phase})');check(s['phase']=='play','Solo failed');return s
 run('actual Play Solo',boot)
 def staging():
  r=js('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.qa19.setAudio(false);const old=DEAD_ENDS.state.zombies.map(z=>[z.id,z.x,z.y]);DEAD_ENDS.simulate(30);let moves=0;for(const z of DEAD_ENDS.state.zombies){const o=old.find(a=>a[0]===z.id);if(o&&Math.hypot(z.x-o[1],z.y-o[2])>4)moves++;}return{elapsed:DEAD_ENDS.state.elapsed,states:DEAD_ENDS.getPerception().states,moves,health:DEAD_ENDS.state.players.map(p=>p.hp),door:DEAD_ENDS.getShelter().door.open};}''')
  check(r['elapsed']==0,'staging clock runs');check(r['moves']>15,'ambient frozen');check(not r['door'],'bots opened exit');return r
 run('30 seconds live ambient prep; timer held; bots stay',staging)
 def port():
  r=js('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();const d=DEAD_ENDS.getShelter().door,cx=d.x+d.w/2,cy=d.y+d.h/2;DEAD_ENDS.teleport(cx-115,cy);const z=DEAD_ENDS.spawn(cx+63,cy,'brute',false);window.portZombie=z.id;DEAD_ENDS.aimAt(z.x,z.y);const before={hp:z.hp,ammo:DEAD_ENDS.state.players[0].ammo[0]};DEAD_ENDS.shoot(true);DEAD_ENDS.simulate(.6);DEAD_ENDS.shoot(false);return{before,hp:z.hp,ammo:DEAD_ENDS.state.players[0].ammo[0],door:DEAD_ENDS.getShelter().door.open,elapsed:DEAD_ENDS.state.elapsed,port:DEAD_ENDS.qa19.ray('bullet',cx-50,cy,1,0,200),metal:DEAD_ENDS.qa19.ray('bullet',cx-50,d.y+9,1,0,200),physical:DEAD_ENDS.qa19.ray('',cx-50,cy,1,0,200)};}''')
  check(r['hp']<r['before']['hp'],'no damage through bars');check(r['ammo']<r['before']['ammo'],'gun not allowed');check(not r['door'],'door opened');check(r['elapsed']==0,'run timer started');check(r['port']['obj']!='shelterDoor' and r['port']['d']>64,'bullet port blocked');check(r['metal']['obj']=='shelterDoor','solid panel not solid');check(r['physical']['obj']=='shelterDoor','port passes bodies');return r
 run('closed port fires; steel and physical door still block',port)
 def grenade():
  r=js('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();const d=DEAD_ENDS.getShelter().door,cx=d.x+d.w/2,cy=d.y+d.h/2;DEAD_ENDS.teleport(cx-115,cy);DEAD_ENDS.aimAt(cx+180,cy);DEAD_ENDS.throwBomb(cx+180,cy);const target=DEAD_ENDS.state.grenades[0].tx;DEAD_ENDS.simulate(4);return{target,doorX:d.x,grenades:DEAD_ENDS.state.grenades.length,elapsed:DEAD_ENDS.state.elapsed};}''')
  check(r['target']<r['doorX'],'grenade passes port');check(r['grenades']==0,'fuse frozen in prep');return r
 run('throwable allowed but cannot pass barred port; fuse runs in prep',grenade)
 def distance():
  r=js('''()=>{DEAD_ENDS.startMap(1,31987);DEAD_ENDS.clearThreats();const p=DEAD_ENDS.state.players[0];let spot=null;for(let x=p.x+1000;x<4500&&!spot;x+=64)for(let y=1300;y<2500;y+=64)if(DEAD_ENDS.free(x,y,20)&&Math.hypot(x-p.x,y-p.y)>1000){spot={x,y};break;}const z=DEAD_ENDS.spawn(spot.x,spot.y,'common',false);z.a=0;DEAD_ENDS.qa19.noise('gunshot',p.x,p.y,650);DEAD_ENDS.simulate(8);return{distance:Math.hypot(z.x-p.x,z.y-p.y),mind:DEAD_ENDS.getInfectedMind(z.id),awake:z.awake};}''')
  check(not r['awake'],'distant infected woke');check(r['mind']['target']==-1,'remote target acquired');return r
 run('distant infected ignore safehouse and out-of-range gunshot',distance)
 def unseenNoise():
  r=js('''()=>{DEAD_ENDS.startMap(1,31987);DEAD_ENDS.clearThreats();const z=DEAD_ENDS.spawn(1400,1824,'common',false);if(!z)throw Error('spawn fixture');z.a=0;DEAD_ENDS.qa19.noise('impact',z.x+100,z.y,360);DEAD_ENDS.qa19.observe(z.id);const before=DEAD_ENDS.getInfectedMind(z.id);DEAD_ENDS.simulate(15);return{before,after:DEAD_ENDS.getInfectedMind(z.id)};}''')
  check(r['before']['state']=='investigate','not investigating');check(r['before']['target']==-1,'noise granted target');check(r['after']['state'] in ['idle','wander','search'],'permanent omniscience');return r
 run('hearing investigates a point then loses interest',unseenNoise)
 def openDamage():
  r=js('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();const p=DEAD_ENDS.state.players[0],d=DEAD_ENDS.getShelter().door;DEAD_ENDS.qa19.setDoor(true);DEAD_ENDS.simulate(.4);const z=DEAD_ENDS.spawn(d.x+65,d.y+d.h/2,'common',true);DEAD_ENDS.teleport(d.x-30,d.y+d.h/2);for(let i=1;i<4;i++){DEAD_ENDS.state.players[i].dead=true;}DEAD_ENDS.simulate(1.8);return{hp:p.hp,staging:DEAD_ENDS.getV19().staging,entered:z.x<d.x,elapsed:DEAD_ENDS.state.elapsed};}''')
  check(r['hp']<100,'starting room magical immunity remains');return r
 run('open starting room can be invaded and hurt before departure',openDamage)
 def shove():
  r=js('''()=>{DEAD_ENDS.startMap(1,31987);DEAD_ENDS.clearThreats();DEAD_ENDS.teleport(1400,1900);const p=DEAD_ENDS.state.players[0];p.a=0;const z=DEAD_ENDS.spawn(1480,1900,'brute',true);z.wind=.7;p.shove=.4;const denied=DEAD_ENDS.shove(),before=z.wind;p.shove=0;const valid=DEAD_ENDS.shove(),after=z.wind;return{denied,before,valid,after,stun:z.stun};}''')
  check(r['denied']==False and r['before']>0,'cooldown bypass');check(r['valid'] and r['after']==0,'valid interrupt missing');return r
 run('shove cooldown prevents interrupt; valid shove interrupts',shove)
 def saves():
  r=js('''()=>{DEAD_ENDS.startMap(0,31987);const p=DEAD_ENDS.state.players[0];p.upgrade14={rifle:true,auto:true};const save=DEAD_ENDS.qa19.forceCheckpoint();DEAD_ENDS.goMenu();const imported=DEAD_ENDS.importSave(JSON.stringify(save));DEAD_ENDS.continueCampaign();const n=DEAD_ENDS.state.players[0];return{save:save.data.checkpoint.carry[0],upgrade:n.upgrade14,ammo:n.ammo,phase:DEAD_ENDS.state.phase,map:DEAD_ENDS.getExtra().selectedMap};}''')
  check(r['upgrade']['rifle'] and r['upgrade']['auto'],'upgrades lost');check(r['ammo'][0]==14,'wrong upgraded magazine');check(r['map']==1,'continue wrong chapter');return r
 run('export/import/Continue preserves found weapons and correct clip',saves)
 def finalDoor():
  r=js('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();const safe=DEAD_ENDS.getExtra().safe,d=DEAD_ENDS.getV19().finalDoor;for(let i=0;i<4;i++)DEAD_ENDS.teleport(safe.x+70+(i%2)*90,d.y+45+Math.floor(i/2)*55,i);const began=DEAD_ENDS.qa19.seal(0);DEAD_ENDS.qa19.stepSeal(40);return{began,phase:DEAD_ENDS.state.phase,seal:DEAD_ENDS.getV19().seal,door:DEAD_ENDS.getV19().finalDoor};}''')
  check(r['began'],'cannot close near door');check(r['phase']=='win','door failed finish');check(r['door']['solid'],'no physical final door');return r
 run('physical final door seals and wins only when clear',finalDoor)
 def obstruction():
  r=js('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();const safe=DEAD_ENDS.getExtra().safe,d=DEAD_ENDS.getV19().finalDoor;for(let i=0;i<4;i++)DEAD_ENDS.teleport(safe.x+70+(i%2)*100,d.y+40+Math.floor(i/2)*55,i);const begun=DEAD_ENDS.qa19.seal(0);DEAD_ENDS.teleport(d.x+12,d.y+64,3);DEAD_ENDS.qa19.stepSeal(40);return{begun,phase:DEAD_ENDS.state.phase,seal:DEAD_ENDS.getV19().seal};}''')
  check(r['begun'],'setup seal');check(r['phase']=='play' and not r['seal']['closing'],'door crushed actor');return r
 run('actor blocking final door cancels seal without winning',obstruction)
 def malformed():
  r=js('''()=>{const before=DEAD_ENDS.getNetwork().malformedPackets;for(const m of [{id:1,n:1000000,i:0,d:'x'},{id:2,n:2,i:-1,d:'x'},{id:3,n:2,i:0,d:'x'.repeat(8001)}])DEAD_ENDS.qa19.reassemble(m);return{rejected:DEAD_ENDS.getNetwork().malformedPackets-before,wire:DEAD_ENDS.qa19.wireRoundTrip()};}''')
  check(r['rejected']==3,'malformed fragments accepted');check(r['wire']['decoded']==r['wire']['source'],'json wire roundtrip failed');return r
 run('bounded chunk rejection and Claude-compatible JSON wire roundtrip',malformed)
 # A genuine renderer capture from the same game, not regenerated artwork.
 js('DEAD_ENDS.startMap(1,31987);DEAD_ENDS.simulate(8);DEAD_ENDS.qa19.render()');page.screenshot(path=str(W/'safehouse19.png'))
 out['runtimeErrors']=len(out['errors']);out['pass']=all(c['pass'] for c in out['checks']) and not out['errors']
 (W/'qa_gameplay.json').write_text(json.dumps(out,indent=2));browser.close()
print('RESULT',out['pass'],flush=True)
