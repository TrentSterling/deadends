from pathlib import Path
from playwright.sync_api import sync_playwright
import json
W=Path('/mnt/data/dead_ends_v19_work');out={'checks':[],'errors':[]}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:out['errors'].append(str(e)));p.set_content('<script>window.requestAnimationFrame=f=>1;</script>'+Path('/mnt/data/dead_ends_v19.html').read_text(),wait_until='domcontentloaded');p.wait_for_function('window.DEAD_ENDS && !document.querySelector("#playBtn").disabled')
 for alarm in [False,True]:
  r=p.evaluate('''(alarm)=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();DEAD_ENDS.qa19.setAudio(false);DEAD_ENDS.qa19.setSandbox(true);const d=DEAD_ENDS.getShelter().door,cy=d.y+d.h/2;DEAD_ENDS.teleport(d.x-105,cy);const car=DEAD_ENDS.state.props.find(p=>p.type==='car'&&p.x>d.x&&p.x<d.x+300);car.alarm=alarm;DEAD_ENDS.aimAt(car.x+30,car.y+car.h/2);DEAD_ENDS.shoot(true);DEAD_ENDS.simulate(.3);DEAD_ENDS.shoot(false);DEAD_ENDS.simulate(9);return{alarm,carAlarm:car.alarming||0,stage:DEAD_ENDS.getV19().staging,elapsed:DEAD_ENDS.state.elapsed,spawned:DEAD_ENDS.getExtra().metrics.spawned,alive:DEAD_ENDS.state.zombies.length,doorOpen:DEAD_ENDS.getShelter().door.open};}''',alarm)
  ok=r['stage'] and r['elapsed']==0 and not r['doorOpen'] and (r['spawned']>0 if alarm else r['spawned']==0)
  out['checks'].append({'name':'Shot alarm calls a mob before departure' if alarm else 'Ordinary prep fire creates no scripted horde','pass':ok,'detail':r});print(ok,r)
 out['pass']=all(t['pass'] for t in out['checks']) and not out['errors'];(W/'qa_alarm.json').write_text(json.dumps(out,indent=2));b.close()
