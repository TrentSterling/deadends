// Client tracer repro. Zero deps: node tools/tracer.mjs [file-or-url] [--ports=9401,9402]
// A hosts the public room, C joins from a separate Chrome over WebRTC. Both hold the mouse
// button while aiming right, and we count tracer-coloured pixels in a screenshot of each,
// plus probe the v19 bullet ray from each local survivor. A client must see its own tracers.
import {launch, sleep, until} from './cdp.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync, mkdirSync} from 'node:fs';
import zlib from 'node:zlib';
mkdirSync(resolve('tools/out'), {recursive: true});

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const arg = args.find(a => !a.startsWith('--')) || 'index.html';
import {writeFileSync} from 'node:fs';
// Function scope is closed, so for a local file we build a debug copy that exposes the tracer list and
// counts the client's own predicted tracer pushes. Against a URL the harness falls back to screenshot pixels.
function debugCopy(file) {
  let s = readFileSync(file, 'utf8');
  const anchor = s.match(/Object\.assign\(DEAD_ENDS,\{build:'[0-9.]+',makeSnapshot,/);
  if (!anchor) return null;
  const dbg = "Object.assign(DEAD_ENDS,{dbgTracers:()=>tracers.map(t=>({x:t.x,y:t.y,ex:t.ex,ey:t.ey,life:t.life,max:t.max,color:t.color,who:t.who}))," +
    "dbgNext:()=>({next:nextPredictedShot,clock,netMode,localSlot})," +
    "dbgArm:()=>{const arr=tracers;DEAD_ENDS.__armed=arr;DEAD_ENDS.__pushes=0;DEAD_ENDS.__mine=0;DEAD_ENDS.__removed=[];DEAD_ENDS.__lastPush=null;" +
    "arr.push=function(...a){DEAD_ENDS.__pushes+=a.length;for(const t of a)if(t.color==='#ffe3a3')DEAD_ENDS.__mine++;DEAD_ENDS.__lastPush=JSON.parse(JSON.stringify(a[0]));return Array.prototype.push.apply(this,a);};" +
    "arr.splice=function(i,n){const r=Array.prototype.splice.call(this,i,n);for(const t of r)DEAD_ENDS.__removed.push(+t.life.toFixed(4));return r;};}," +
    "dbgReport:()=>({same:tracers===DEAD_ENDS.__armed,len:tracers.length,pushes:DEAD_ENDS.__pushes,mine:DEAD_ENDS.__mine,removedTotal:DEAD_ENDS.__removed.length,lastPush:DEAD_ENDS.__lastPush,phase})});" + "\n";
  s = s.replace(anchor[0], dbg + anchor[0]);
  const out = resolve('tools/out/tracer-debug.html'); writeFileSync(out, s); return out;
}
const local = /^https?:/.test(arg) ? null : debugCopy(resolve(arg));
const target = /^https?:/.test(arg) ? arg : pathToFileURL(local || resolve(arg)).href;
const [pa, pc] = opt('ports', '9401,9402').split(',').map(Number);
const out = resolve('tools/out');
const results = [];
const check = (name, ok, detail = '') => { results.push({name, ok: !!ok, detail}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };
const boot = p => until(() => p.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot'});
const W = 1280, H = 800;
const A = await launch({port: pa, width: W, height: H});
const C = await launch({port: pc, width: W, height: H});

// Minimal PNG reader (8-bit RGBA, non-interlaced) so we can count pixels without deps.
function readPng(file) {
  const buf = readFileSync(file); let pos = 8; const idat = []; let w = 0, h = 0, ct = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(w * h * bpp);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0, x = line[i];
      let v;
      if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[i] = v & 255;
    }
    cur.copy(px, y * stride); prev = cur;
  }
  return {w, h, bpp, px};
}
// Tracer colours: predicted '#ffe3a3' (255,227,163), host '#ffe0a0' / '#f4f2be'. Count warm bright pixels
// in a band to the right of the screen centre (where the survivor aims), excluding the HUD strip.
function tracerPixels(file) {
  // The survivor sits at screen centre aiming right. The muzzle flash lives within ~70 px of it; a tracer
  // runs on along the aim row, so count tracer-coloured pixels in a thin band well past the flash.
  const {w, h, bpp, px} = readPng(file); let n = 0;
  const cy = Math.floor(h / 2), near = c => (r, g, b) => Math.abs(r - c[0]) < 22 && Math.abs(g - c[1]) < 22 && Math.abs(b - c[2]) < 30;
  const cols = [near([255, 227, 163]), near([255, 224, 160]), near([244, 242, 190])];
  for (let y = cy - 10; y <= cy + 10; y++) for (let x = Math.floor(w / 2) + 90; x < w - 40; x++) {
    const i = (y * w + x) * bpp, r = px[i], g = px[i + 1], b = px[i + 2];
    if (cols.some(f => f(r, g, b))) n++;
  }
  return n;
}
async function fireAndShoot(page, tag) {
  // Aim right of centre, hold fire, screenshot mid-burst.
  await page.mouse('mouseMoved', W * .8, H * .5);
  await sleep(150);
  await page.mouse('mouseMoved', W * .8 + 1, H * .5);
  const before = await page.eval('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].ammo.slice()');
  await page.eval('DEAD_ENDS.dbgArm&&DEAD_ENDS.dbgArm()');
  await page.mouse('mousePressed', W * .8, H * .5);
  const samples = []; for (let i = 0; i < 12; i++) { await sleep(25); samples.push(await page.eval('DEAD_ENDS.dbgTracers?DEAD_ENDS.dbgTracers().map(t=>({len:+Math.hypot(t.ex-t.x,t.ey-t.y).toFixed(1),life:+t.life.toFixed(3),who:t.who,mine:t.color==="#ffe3a3"})):null')); }
  console.log(tag, 'tracer samples:', JSON.stringify(samples));
  console.log(tag, 'dbg:', JSON.stringify(await page.eval('DEAD_ENDS.dbgNext?DEAD_ENDS.dbgNext():null')));
  console.log(tag, 'local player:', JSON.stringify(await page.eval('(()=>{const s=DEAD_ENDS.state,p=s.players[s.localSlot];const c=DEAD_ENDS.debugV10&&DEAD_ENDS.debugV10.controls?DEAD_ENDS.debugV10.controls(p):null;const n=DEAD_ENDS.getNetwork?DEAD_ENDS.getNetwork():{};return {slot:s.localSlot,bot:p.bot,reload:p.reload,cool:p.cool,heal:p.heal,down:p.down,weapon:p.weapon,name:p.name,ctlShoot:c&&c.shoot,bots:s.players.map(q=>q.bot),ready:n.ready,expectedEpoch:n.expectedEpoch,epoch:n.epoch,stale:n.stalePackets,malformed:n.malformedPackets,readyPeers:n.readyPeers,paused:s.paused,log:(n.log||[]).slice(-6)}})()')));
  console.log(tag, 'report:', JSON.stringify(await page.eval('DEAD_ENDS.dbgReport?DEAD_ENDS.dbgReport():null')));
  const f = `${out}/tracer-${tag}.png`;
  await page.shot(f);
  const p = await page.eval('(()=>{const s=DEAD_ENDS.state,p=s.players[s.localSlot];return {firing:p.firing,x:p.x|0,y:p.y|0,a:+p.a.toFixed(2),weapon:p.weapon,ammo:p.ammo.slice(),down:p.down,dead:p.dead,netMode:s.netMode}})()');
  console.log(tag, 'held:', JSON.stringify(await page.eval('(()=>{const s=DEAD_ENDS.state,p=s.players[s.localSlot];const c=DEAD_ENDS.debugV10&&DEAD_ENDS.debugV10.controls?DEAD_ENDS.debugV10.controls(p):null;return {bot:p.bot,ctlShoot:c&&c.shoot}})()')));
  await sleep(600);
  await page.mouse('mouseReleased', W * .8, H * .5);
  const after = await page.eval('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].ammo.slice()');
  const ray = await page.eval('(()=>{const s=DEAD_ENDS.state,p=s.players[s.localSlot],dx=Math.cos(p.a),dy=Math.sin(p.a),sx=p.x+dx*23,sy=p.y+dy*23;const q=DEAD_ENDS.qa19;if(!q)return null;return {lead:q.ray("bullet",p.x,p.y,dx,dy,23),flight:q.ray("bullet",sx,sy,dx,dy,940),sight:q.ray("sight",sx,sy,dx,dy,940)}})()');
  return {pixels: tracerPixels(f), file: f, p, before, after, ray};
}
try {
  // Private room: PeerJS ids are global, so PLAY ONLINE from a harness would join whoever is hosting LOBBY right now.
  await A.goto(target); await boot(A);
  await A.eval('document.getElementById("coopBtn").click(); document.getElementById("hostBtn").click()');
  const code = await until(() => A.eval('(document.getElementById("roomCode").textContent||"").trim()'), {timeout: 10000, label: 'room code'});
  await until(() => A.eval('DEAD_ENDS.state.peerOpen'), {timeout: 20000, label: 'A peer open'});
  // Drop-in: the host is already playing (bots on) when the client arrives, like PLAY ONLINE mid-run.
  await A.eval('document.getElementById("hostStart").click()');
  await until(() => A.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 15000, label: 'host play'});
  await A.eval('DEAD_ENDS.setAuto(true)');
  await sleep(Number(process.env.LEAD || 6000));
  await C.goto(target); await boot(C);
  await C.eval(`document.getElementById("coopBtn").click(); document.getElementById("joinCode").value=${JSON.stringify(code)}; document.getElementById("joinBtn").click()`);
  await until(() => C.eval('DEAD_ENDS.state.netConnected'), {timeout: 45000, label: 'client connect'});
  await until(() => C.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 30000, label: 'client play'});
  check('setup: client dropped into a running private room over WebRTC', (await C.eval('DEAD_ENDS.state.netTransport')) === 'peer', 'code=' + code + ' slot=' + await C.eval('DEAD_ENDS.state.localSlot'));
  await sleep(2500);
  const host = await fireAndShoot(A, 'host');
  console.log('host', JSON.stringify(host));
  console.log('host (autopilot, informational): pixels=' + host.pixels);
  // Deterministic: drain a clip so the client goes through a reload, wait it out, then fire again.
  await C.mouse('mouseMoved', W * .8, H * .5); await C.mouse('mousePressed', W * .8, H * .5);
  await until(() => C.eval('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].ammo[0]===0'), {timeout: 15000, label: 'clip drained'}).catch(() => {});
  await sleep(700); // an empty-clip trigger pull is what starts the reload
  await C.mouse('mouseReleased', W * .8, H * .5);
  await until(() => C.eval('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].ammo[0]>0'), {timeout: 8000, label: 'reloaded'}).catch(() => {});
  await sleep(500);
  console.log('client after reload:', JSON.stringify(await C.eval('(()=>{const p=DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot];return {reload:p.reload,ammo:p.ammo}})()')));
  const client = await fireAndShoot(C, 'client');
  console.log('client', JSON.stringify(client));
  check('client: muzzle flash fired (prediction ran)', client.p.firing > 0 || client.after[client.p.weapon] < client.before[client.p.weapon], `firing=${client.p.firing} ammo ${client.before}->${client.after}`);
  const mine = await C.eval('DEAD_ENDS.dbgReport?DEAD_ENDS.dbgReport().mine:null');
  check('client: sees its own tracers', mine === null ? client.pixels > 8 : mine > 0, mine === null ? `pixels=${client.pixels}` : `own tracers pushed during burst=${mine}, pixels=${client.pixels}`);
} catch (e) {
  check('harness', false, e.message);
} finally {
  const bad = [...A.logs.map(l => 'A ' + l), ...C.logs.map(l => 'C ' + l)].filter(l => /EXCEPTION|^. error/.test(l));
  check('console: no exceptions', bad.length === 0, bad.slice(0, 3).join(' | '));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  A.kill(); C.kill();
  process.exitCode = passed === results.length ? 0 : 1;
}
