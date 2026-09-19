from playwright.sync_api import sync_playwright
from pathlib import Path
import json,subprocess
W=Path('/mnt/data/dead_ends_v19_work');F=W/'clip';F.mkdir(exist_ok=True)
html=Path('/mnt/data/dead_ends_v19.html').read_text();prefix='<script>window.requestAnimationFrame=f=>(window._queuedRAF=f,1);window.cancelAnimationFrame=()=>{};</script>'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.set_content(prefix+html,wait_until='domcontentloaded');p.wait_for_function('window.DEAD_ENDS && !document.querySelector("#playBtn").disabled')
 p.evaluate('''()=>{DEAD_ENDS.startMap(0,31987);DEAD_ENDS.clearThreats();DEAD_ENDS.qa19.setAudio(false);DEAD_ENDS.qa19.setSandbox(true);const d=DEAD_ENDS.getShelter().door;const cy=d.y+d.h/2;DEAD_ENDS.teleport(d.x-104,cy);DEAD_ENDS.teleport(d.x-225,cy+73,1);DEAD_ENDS.teleport(d.x-155,cy-57,2);DEAD_ENDS.teleport(d.x-170,cy+140,3);window.target19=DEAD_ENDS.spawn(d.x+75,cy,'brute',false);if(!target19)throw Error('Invalid showcase spawn');for(const dy of [-100,70,100,140]){const z=DEAD_ENDS.spawn(d.x+190,cy+dy,'common',false);if(z)z.a=Math.PI*.5;}DEAD_ENDS.qa19.render();DEAD_ENDS.aimAt(d.x+75,cy);DEAD_ENDS.qa19.render();}''')
 p.screenshot(path='/mnt/data/dead_ends_v19_safehouse.png')
 for i in range(60):
  p.evaluate('(i)=>{DEAD_ENDS.shoot(i>=10&&i<44);DEAD_ENDS.simulate(1/15);DEAD_ENDS.qa19.render()}',i)
  p.screenshot(path=str(F/f'{i:03d}.png'))
  if i==26:p.screenshot(path='/mnt/data/dead_ends_v19_firing_port.png')
 result=p.evaluate('({doorOpen:DEAD_ENDS.getShelter().door.open,elapsed:DEAD_ENDS.state.elapsed,kills:DEAD_ENDS.state.stats.kills,ammo:DEAD_ENDS.state.players[0].ammo[0],senses:DEAD_ENDS.getPerception()})')
 p.keyboard.press('F2');p.click('[data-tab="senses"]');p.check('#senseToggle19');p.evaluate('DEAD_ENDS.qa19.render()');p.screenshot(path='/mnt/data/dead_ends_v19_senses.png')
 (W/'safehouse_clip.json').write_text(json.dumps({'type':'Staged close-door firing test. Actors positioned before test; then native simulation, shooting and renderer. 60 frames at 15 simulation steps per second.','result':result,'errors':errors},indent=2));b.close()
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','15','-i',str(F/'%03d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','22','-movflags','+faststart','/mnt/data/dead_ends_v19_safehouse_test.mp4'],check=True)
