// Headless smoke test for DEAD ENDS. Zero deps: node tools/verify.mjs [url]
// Boots the real page in headless Chrome, waits for the live AI menu to be
// ready (Play Solo enabled), screenshots it, starts a solo run through the
// public DEAD_ENDS hook, simulates a few seconds, reloads, and checks that
// nothing threw and PeerJS loaded. A regression gate, not a playtest.
import {launch, sleep, until} from './cdp.mjs';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const arg = process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html';
const target = /^https?:/.test(arg) ? arg : pathToFileURL(resolve(arg)).href;
const out = resolve('tools/out'); mkdirSync(out, {recursive: true});
const page = await launch({port: Number(process.env.PORT || 9334), width: 1280, height: 800});
const results = [];
const check = (name, ok, detail = '') => { results.push({name, ok: !!ok, detail}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };
const fatalShown = () => page.eval('getComputedStyle(document.getElementById("fatal")).display!=="none"');
try {
  console.log('goto', target);
  await page.goto(target);
  await until(() => page.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot (Play Solo enabled)'});
  check('boot: Play Solo enabled', true);
  check('boot: bootState ready', await page.eval('document.getElementById("bootState")?.classList.contains("ready")'));
  check('boot: no fatal overlay', !(await fatalShown()));
  check('menu: chapter select present', await page.eval('!!document.getElementById("chapterSelect") && document.querySelectorAll("#chapterRail button, #chapterRail [role=button]").length>=5'), 'chapters=' + await page.eval('document.querySelectorAll("#chapterRail button, #chapterRail [role=button]").length'));
  check('menu: tront.xyz links', await page.eval('[...document.querySelectorAll("a[href^=\'https://tront.xyz\']")].length>=1'), 'links=' + await page.eval('[...document.querySelectorAll("a[href^=\'https://tront.xyz\']")].map(a=>a.getAttribute("href")).join(" ")'));
  check('menu: no root-relative asset paths', await page.eval('![...document.querySelectorAll("[src],[href]")].some(e=>/^\\/[^\\/]/.test(e.getAttribute("src")||e.getAttribute("href")||""))'));
  await sleep(4000);
  const menuPhase = await page.eval('DEAD_ENDS.state.phase');
  check('menu: live simulation running', await page.eval('DEAD_ENDS.state.players.length>=4 && DEAD_ENDS.state.zombies.length>=0'), 'phase=' + menuPhase + ' players=' + await page.eval('DEAD_ENDS.state.players.length') + ' zombies=' + await page.eval('DEAD_ENDS.state.zombies.length'));
  await page.shot(`${out}/menu.png`);
  // The game lazy-loads PeerJS when hosting or joining. Load the same pinned CDN file from the page origin to prove it can.
  const peerOk = await page.eval('new Promise(r=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js";s.onload=()=>r(typeof Peer==="function");s.onerror=()=>r(false);document.head.appendChild(s)})');
  check('net: PeerJS loads from CDN on this origin', peerOk);
  await page.eval('document.getElementById("coopBtn").click()');
  await sleep(500);
  const coop = await page.eval('({shown:getComputedStyle(document.getElementById("coop")).display!=="none",copyLink:!document.getElementById("copyLinkBtn").disabled,context:document.getElementById("connectionContext")?.textContent||""})');
  check('net: co-op overlay opens', coop.shown, coop.context.slice(0, 90));
  check('net: shareable invite link available', /^https?:/.test(target) ? coop.copyLink : true, /^https?:/.test(target) ? 'copyLink=' + coop.copyLink : 'file:// (skipped)');
  await page.eval('document.getElementById("coopClose").click()');
  await sleep(300);

  await page.eval('document.getElementById("playBtn").click()');
  await until(() => page.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 30000, label: 'solo run start'});
  check('play: solo run started', true, 'map=' + await page.eval('DEAD_ENDS.state.progress?.map ?? DEAD_ENDS.state.progress ?? ""').then(String).then(s => s.slice(0, 40)));
  await page.eval('DEAD_ENDS.simulate(5)');
  await sleep(1500);
  check('play: still alive after 5 s simulation', await page.eval('DEAD_ENDS.state.phase==="play"'), 'elapsed=' + await page.eval('DEAD_ENDS.state.elapsed?.toFixed?.(1)') + ' zombies=' + await page.eval('DEAD_ENDS.state.zombies.length'));
  check('play: no fatal overlay', !(await fatalShown()));
  await page.shot(`${out}/play.png`);

  await page.goto(target);
  await until(() => page.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'reload boot'});
  check('reload: menu boots again', true);
  check('reload: no fatal overlay', !(await fatalShown()));
  check('reload: origin storage usable (saves can persist)', await page.eval('(()=>{try{localStorage.setItem("de-verify","1");const ok=localStorage.getItem("de-verify")==="1";localStorage.removeItem("de-verify");return ok}catch{return false}})()'), 'keys=' + await page.eval('(()=>{try{return Object.keys(localStorage).join(",")||"(none yet)"}catch{return "n/a"}})()'));

  const bad = page.logs.filter(l => l.startsWith('EXCEPTION') || l.startsWith('error'));
  check('console: no exceptions or errors', bad.length === 0, bad.slice(0, 3).join(' | '));
} catch (e) {
  check('harness', false, e.message);
} finally {
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  writeFileSync(`${out}/verify.json`, JSON.stringify({target, results, logs: page.logs}, null, 2));
  console.log('--- console (' + page.logs.length + ')');
  for (const l of page.logs.slice(0, 40)) console.log(' ', l.slice(0, 300));
  page.kill();
  process.exitCode = passed === results.length ? 0 : 1;
}
