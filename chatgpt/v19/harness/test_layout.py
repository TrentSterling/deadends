from pathlib import Path
from playwright.sync_api import sync_playwright
import json
W=Path('/mnt/data/dead_ends_v19_work');out={'checks':[],'errors':[]}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:out['errors'].append(str(e)));p.set_content('<script>window.requestAnimationFrame=f=>1;</script>'+Path('/mnt/data/dead_ends_v19.html').read_text(),wait_until='domcontentloaded');p.wait_for_function('window.DEAD_ENDS && !document.querySelector("#playBtn").disabled')
 for w,h in [(1920,1080),(1200,800),(390,844),(320,650)]:
  p.set_viewport_size({'width':w,'height':h});p.evaluate('DEAD_ENDS.goMenu();DEAD_ENDS.debugV10.drawPreview(.02)');p.wait_for_timeout(100)
  buttons=p.evaluate('''()=>Object.fromEntries(['playBtn','publicBtn','coopBtn','optionsBtn'].map(id=>{const a=document.getElementById(id),r=a.getBoundingClientRect();return[id,{x:r.x,y:r.y,w:r.width,h:r.height,enabled:!a.disabled}]}))''')
  ok=all(r['enabled'] and r['x']>=0 and r['x']+r['w']<=w+1 and r['y']>=0 and r['y']+r['h']<=h+1 for r in buttons.values())
  out['checks'].append({'name':f'{w}x{h} menu controls reachable','pass':ok,'buttons':buttons});print(w,h,ok,flush=True)
  if w in [390,1920]:p.screenshot(path=str(W/f'menu_{w}.png'))
 out['pass']=all(t['pass'] for t in out['checks']) and not out['errors'];(W/'qa_layout.json').write_text(json.dumps(out,indent=2));b.close()
