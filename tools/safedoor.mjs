// Safehouse door rules (Left 4 Dead). Zero deps: node tools/safedoor.mjs [file-or-url]
// Solo host run, bots teleported outside and downed so they stay put:
// 1. hold E inside with teammates outside: the door closes and the chapter does NOT end.
// 2. an upright bot walks up to the closed door from outside: it opens.
// 3. close again, then the outside survivors bleed out: the chapter ends.
// 4. a survivor standing in the doorway blocks the close (and says so).
import {launch, sleep, until} from './cdp.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const arg = process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html';
const target = /^https?:/.test(arg) ? arg : pathToFileURL(resolve(arg)).href;
const results = [];
const check = (name, ok, detail = '') => { results.push({name, ok: !!ok, detail}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };
const page = await launch({port: Number(process.env.PORT || 9411), width: 1280, height: 800});
const seal = () => page.eval('(()=>{const v=DEAD_ENDS.getV19();const s=DEAD_ENDS.state;return {closed:v.seal.closed,closing:v.seal.closing,amount:+v.seal.amount.toFixed(2),phase:s.phase,door:v.finalDoor&&{x:v.finalDoor.x,y:v.finalDoor.y,w:v.finalDoor.w,h:v.finalDoor.h,solid:v.finalDoor.solid,open:v.finalDoor.open},prompt:document.getElementById("prompt")?.querySelector("span")?.textContent}})()');
const clearDoor = () => page.eval('(()=>{const v=DEAD_ENDS.getV19().finalDoor,cx=v.x+v.w/2,cy=v.y+v.h/2;let n=0;for(const z of DEAD_ENDS.state.zombies){if(Math.hypot(z.x-cx,z.y-cy)<320){z.hp=0;n++;}}return n})()');
const holdE = async (sec) => { const n = await clearDoor(); if (n) console.log('  (cleared ' + n + ' infected near the door)'); await sleep(150); await page.eval('DEAD_ENDS.press("e",true)'); await sleep(sec * 1000); await page.eval('DEAD_ENDS.press("e",false)'); };
try {
  await page.goto(target);
  await until(() => page.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot'});
  await page.eval('DEAD_ENDS.startMap(0, 31987)');
  await until(() => page.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 20000, label: 'play'});
  await page.eval('DEAD_ENDS.setInvincible(true); DEAD_ENDS.setAuto(false)');
  await sleep(500);
  const s0 = await seal();
  check('setup: final door exists and is open', s0.door && s0.door.open && !s0.door.solid, JSON.stringify(s0.door));
  const d = s0.door, cy = d.y + d.h / 2, inside = {x: d.x + d.w + 60, y: cy}, outsideNear = {x: d.x - 34, y: cy}, outsideFar = {x: d.x - 520, y: cy};
  // Everyone outside and downed (alive, immobile); the local survivor inside by the door.
  await page.eval(`(()=>{const s=DEAD_ENDS.state;for(const i of [1,2,3]){DEAD_ENDS.teleport(${outsideFar.x},${outsideFar.y + 0}+i*30,i);const p=s.players[i];p.down=true;p.bleed=60;p.hp=30;}DEAD_ENDS.teleport(${inside.x},${inside.y},0);})()`);
  await sleep(400);
  const before = await seal();
  check('prompt: seal offered with teammates outside', /SEAL|HOLD/i.test(before.prompt || ''), before.prompt);

  // 1. Close with friends outside: door shuts, run continues.
  await holdE(2.2);
  await until(() => page.eval('DEAD_ENDS.getV19().seal.closed'), {timeout: 5000, label: 'closed'}).catch(() => {});
  const s1 = await seal();
  check('1: door closes with teammates outside', s1.closed && s1.door.solid && !s1.door.open, JSON.stringify(s1));
  await sleep(1200);
  check('1: chapter does not end while survivors are alive outside', (await seal()).phase === 'play', 'phase=' + (await seal()).phase);

  // 2. An upright bot at the door from outside opens it.
  await page.eval(`(()=>{const p=DEAD_ENDS.state.players[1];p.down=false;p.hp=100;DEAD_ENDS.teleport(${outsideNear.x},${outsideNear.y},1);})()`);
  const opened = await until(() => page.eval('!DEAD_ENDS.getV19().seal.closed'), {timeout: 4000, label: 'reopen'}).then(() => true).catch(() => false);
  const s2 = await seal();
  check('2: a survivor outside can open the closed door', opened && s2.door.open && !s2.door.solid, JSON.stringify(s2));
  await page.eval(`(()=>{const p=DEAD_ENDS.state.players[1];DEAD_ENDS.teleport(${outsideFar.x},${outsideFar.y},1);p.down=true;p.bleed=60;})()`);
  await sleep(300);

  // 4. Doorway blocked: bot 2 stands in the door rect.
  await page.eval(`(()=>{const p=DEAD_ENDS.state.players[2];p.down=false;DEAD_ENDS.teleport(${d.x + d.w / 2},${cy},2);})()`);
  await sleep(300);
  const blockedPrompt = (await seal()).prompt;
  await holdE(1.2);
  const s4 = await seal();
  check('4: a survivor in the doorway blocks the close', !s4.closed && /DOORWAY/i.test(blockedPrompt || ''), `prompt=${blockedPrompt} closed=${s4.closed}`);
  await page.eval(`(()=>{const p=DEAD_ENDS.state.players[2];DEAD_ENDS.teleport(${outsideFar.x},${outsideFar.y - 40},2);p.down=true;p.bleed=60;})()`);
  await sleep(300);

  // 3. Close again, then the outside survivors bleed out: chapter ends.
  await holdE(2.2);
  await until(() => page.eval('DEAD_ENDS.getV19().seal.closed'), {timeout: 5000, label: 'closed again'}).catch(() => {});
  check('3: door closes again', (await seal()).closed);
  await sleep(800);
  check('3: still playing while downed survivors are outside', (await seal()).phase === 'play');
  await page.eval('(()=>{for(const i of [1,2,3]){const p=DEAD_ENDS.state.players[i];p.dead=true;p.down=false;p.hp=0;}})()');
  const won = await until(() => page.eval('DEAD_ENDS.state.phase==="win"'), {timeout: 4000, label: 'win'}).then(() => true).catch(() => false);
  check('3: chapter ends once everyone alive is inside', won, 'phase=' + (await seal()).phase);
} catch (e) {
  check('harness', false, e.message);
} finally {
  const bad = page.logs.filter(l => l.startsWith('EXCEPTION') || l.startsWith('error'));
  check('console: no exceptions or errors', bad.length === 0, bad.slice(0, 3).join(' | '));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  page.kill();
  process.exitCode = passed === results.length ? 0 : 1;
}
