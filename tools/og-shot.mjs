// Renders og-image.png (1200x630): the DEAD ENDS logo over a staged horde fight on the live menu.
// Zero deps: node tools/og-shot.mjs [file-or-url] [--probe] [--keep]
// The menu simulation is the real game with an AI squad. We spawn a big awake horde around the
// squad, let the bots fight for a few seconds so blood, bodies and muzzle flashes accumulate,
// hide every menu control except the logo, lighten the overlay gradient, and shoot candidates.
import {launch, sleep, until} from './cdp.mjs';
import {mkdirSync, copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const args = process.argv.slice(2);
const arg = args.find(a => !a.startsWith('--')) || 'index.html';
const target = /^https?:/.test(arg) ? arg : pathToFileURL(resolve(arg)).href;
const out = resolve('tools/out'); mkdirSync(out, {recursive: true});
// Tall viewport: the game's view scale grows with window height (capped at 1.35 near 1100 px), and the
// menu is vertically centred, so clipping the middle 630 rows keeps the logo and enlarges the action.
const H = 1100, CLIP = {x: 0, y: (H - 630) / 2, width: 1200, height: 630};
const page = await launch({port: 9360, width: 1200, height: H});
try {
  await page.goto(target);
  await until(() => page.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot'});
  if (args.includes('--probe')) {
    console.log(await page.eval('[...document.getElementById("menu").querySelectorAll("*")].slice(0,60).map(e=>e.tagName+(e.id?"#"+e.id:"")+(e.className&&typeof e.className==="string"?"."+e.className.split(" ").join("."):"")).join("\\n")'));
    console.log(await page.eval('JSON.stringify({p:DEAD_ENDS.state.players.map(p=>[p.x|0,p.y|0,p.bot,p.name]),cam:[DEAD_ENDS.state.camera.x|0,DEAD_ENDS.state.camera.y|0],scale:DEAD_ENDS.state.viewScale,z:DEAD_ENDS.state.zombies.length,phase:DEAD_ENDS.state.phase})'));
  }
  await sleep(5000);
  // Menu chrome off, logo on. Lighter gradient so the carnage reads on the right two thirds.
  await page.eval(`(()=>{const s=document.createElement('style');s.id='og15';s.textContent='#menu .menu>*:not(.brand),#menu .menu-main>*:not(.brand),#menu .menu-action,#menu .menu-tagline,#menu .menu-footer,#menu .author,#menu #chapterSelect,#menu #difficultyRow,#menu .menu-rows,#menu .menu-links,#menu [data-og-hide]{visibility:hidden!important}#menu .brand{visibility:visible!important}#menu.overlay{background:linear-gradient(90deg,rgba(8,12,11,.86),rgba(8,12,11,.42) 30%,rgba(8,12,11,.04) 56%,rgba(8,12,11,0))!important}#menu.overlay:before{opacity:.02!important}';document.head.appendChild(s);})()`);
  console.log('viewScale', await page.eval('DEAD_ENDS.state.viewScale'));
  // Stage the fight: waves of awake infected around the squad for ~9 s, plus a molotov for light.
  for (let i = 0; i < 6; i++) {
    if (i === 1 || i === 3 || i === 5) await page.eval('(()=>{const p=DEAD_ENDS.state.players[Math.floor(Math.random()*4)];const x=p.x+(Math.random()-.5)*360,y=p.y+(Math.random()-.5)*300;try{DEAD_ENDS.ignite(x,y,70)}catch(e){try{DEAD_ENDS.throwFire(x,y)}catch(e2){}}})()');
    await page.eval(`(()=>{const ps=DEAD_ENDS.state.players.filter(p=>!p.dead);const c=ps[Math.floor(Math.random()*ps.length)]||{x:0,y:0};for(let k=0;k<28;k++){const a=Math.random()*Math.PI*2,d=170+Math.random()*230;const x=c.x+Math.cos(a)*d,y=c.y+Math.sin(a)*d;if(DEAD_ENDS.free&&!DEAD_ENDS.free(x,y,14))continue;DEAD_ENDS.spawn(x,y,k%9===0?'runner':'common',true);}})()`);
    await sleep(1500);
  }
  const shots = [];
  for (let i = 0; i < Number(process.env.SHOTS || 8); i++) {
    await sleep(Number(process.env.GAP || 900));
    if (i % 3 === 2) await page.eval(`(()=>{const ps=DEAD_ENDS.state.players.filter(p=>!p.dead);const c=ps[Math.floor(Math.random()*ps.length)]||{x:0,y:0};for(let k=0;k<18;k++){const a=Math.random()*Math.PI*2,d=150+Math.random()*200;const x=c.x+Math.cos(a)*d,y=c.y+Math.sin(a)*d;if(DEAD_ENDS.free&&!DEAD_ENDS.free(x,y,14))continue;DEAD_ENDS.spawn(x,y,'common',true);}})()`);
    const f = `${out}/og-candidate-${i}.png`;
    await page.shot(f, CLIP);
    // Score: live infected within 420 px of the squad centre, plus a bonus for active fire near it.
    const sc = await page.eval('(()=>{const ps=DEAD_ENDS.state.players.filter(p=>!p.dead);const cx=ps.reduce((a,p)=>a+p.x,0)/ps.length,cy=ps.reduce((a,p)=>a+p.y,0)/ps.length;const near=DEAD_ENDS.state.zombies.filter(z=>z.hp>0&&Math.hypot(z.x-cx,z.y-cy)<420).length;const fire=(DEAD_ENDS.getExtra().firePools||[]).filter(f=>f.life>1&&Math.hypot(f.x-cx,f.y-cy)<500).length;const firing=ps.filter(p=>p.firing||p.recoil>0||p.cool>0).length;return {near,fire,firing,score:near+(fire?25:0)+firing*12}})()');
    shots.push({f, ...sc});
    console.log('candidate', i, JSON.stringify(sc));
  }
  const best = shots.slice().sort((a, b) => b.score - a.score)[0];
  const dest = process.env.OUT || 'og-image.png';
  copyFileSync(best.f, resolve(dest));
  console.log('wrote', dest, 'from', best.f, JSON.stringify(best));
} finally { page.kill(); }
