from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time
W=Path('/mnt/data/dead_ends_v19_work');source=Path('/mnt/data/dead_ends_v19.html').read_text()
prefix='<script>window.requestAnimationFrame=f=>(window._queuedRAF=f,1);window.cancelAnimationFrame=()=>{};</script>'
out={'runs':[],'errors':[],'kind':'Actual shipping AI, controls, navigation and objective execution; accelerated fixed ticks, no teleport or forced gates.'}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:out['errors'].append(str(e)));p.set_content(prefix+source,wait_until='domcontentloaded');p.wait_for_function('!!window.DEAD_ENDS && !document.querySelector("#playBtn").disabled')
 for mode in ['classic']:
  for m in range(5):
   start=time.time();p.evaluate('(v)=>{DEAD_ENDS[v.mode===\'classic\'?\'startMap\':\'startRemix\'](v.map, v.mode===\'classic\'?31987:123456);DEAD_ENDS.qa19.setAudio(false);DEAD_ENDS.setInvincible(false);DEAD_ENDS.setAuto(true);DEAD_ENDS.qa19.setSandbox(true)}',{'mode':mode,'map':m})
   trace=[]
   for step in range(30):
    r=p.evaluate('()=>{DEAD_ENDS.simulate(5);return{...DEAD_ENDS.sample(),simTime:DEAD_ENDS.getPerception().time,seal:DEAD_ENDS.getV19().seal,staging:DEAD_ENDS.getV19().staging}}')
    if step%6==0 or r['phase']!='play':trace.append(r)
    if r['phase']!='play':break
   row={'mode':mode,'map':m,'seed':31987 if mode=='classic' else 123456,'invulnerable':False,'pass':r['phase']=='win','secondsWall':round(time.time()-start,2),'final':r,'trace':trace};out['runs'].append(row)
   (W/'qa_normal_damage.json').write_text(json.dumps(out,indent=2));print(mode,m,'PASS' if row['pass'] else 'FAIL',round(r['progress'],3),round(r['t'],2),r['mission'],flush=True)
   if not row['pass']:
    p.evaluate('DEAD_ENDS.qa19.render()');p.screenshot(path=str(W/f'stall_{mode}_{m}.png'))
 out['pass']=all(r['pass'] for r in out['runs']) and not out['errors'];(W/'qa_normal_damage.json').write_text(json.dumps(out,indent=2));b.close()
