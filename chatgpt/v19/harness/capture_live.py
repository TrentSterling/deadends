from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time
W=Path('/mnt/data/dead_ends_v19_work');html=Path('/mnt/data/dead_ends_v19.html').read_text();out={'errors':[]}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);c=b.new_context(viewport={'width':1600,'height':900},accept_downloads=True);p=c.new_page();p.on('pageerror',lambda e:out['errors'].append(str(e)));p.set_default_timeout(25000)
 p.set_content(html,wait_until='domcontentloaded');p.wait_for_function('window.DEAD_ENDS && !document.querySelector("#playBtn").disabled');p.wait_for_timeout(2000);p.screenshot(path='/mnt/data/dead_ends_v19_menu.png')
 p.evaluate('DEAD_ENDS.startMap(1,31987);DEAD_ENDS.setInvincible(true);DEAD_ENDS.setAuto(true);DEAD_ENDS.qa19.setSandbox(true)');p.wait_for_function('DEAD_ENDS.state.elapsed>12',timeout=35000)
 out['start']=p.evaluate('DEAD_ENDS.sample()');p.keyboard.press('F4');p.keyboard.press('F8');p.wait_for_timeout(15750);out['end']=p.evaluate('DEAD_ENDS.sample()');cap=p.evaluate('DEAD_ENDS.getCapture()');assert cap and cap['capture']['foregroundSeconds']>=15
 p.screenshot(path='/mnt/data/dead_ends_v19_profiler.png');p.keyboard.press('F4');p.screenshot(path='/mnt/data/dead_ends_v19_combat.png')
 with p.expect_download() as item:p.keyboard.press('F9')
 d=item.value;d.save_as('/mnt/data/dead_ends_v19_combat_capture.json');saved=json.loads(Path('/mnt/data/dead_ends_v19_combat_capture.json').read_text());assert saved['build']=='DEAD ENDS v19';assert saved.get('v19')
 out['summary']=saved['summary'];out['capture']=saved['capture'];out['download']=d.suggested_filename;out['pass']=not out['errors'];out['limitations']=['Headless Chromium Linux, 1600x900; not Windows/5070Ti GPU timings.','Invulnerable AI campaign navigation and native rAF; no teleports or forced mission gates.']
 (W/'qa_live_capture.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2));b.close()
