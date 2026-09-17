// Two-browser co-op run over the real PeerJS path. Zero deps:
//   node tools/coop.mjs [file-or-url] [--map=0] [--max=300] [--ports=9351,9352]
// Chrome A hosts a room, Chrome B opens the copied invite link (#join=CODE),
// the host hands both human survivors to the bot AI (client stays connected), and both pages run in real time
// until the chapter ends. Checks: link join, WebRTC transport, snapshots flowing,
// door state agreement, seal visible on the client, end screen on both.
// Separate Chrome profiles on one machine: proves the wire path, not internet latency.
import {launch, sleep, until} from './cdp.mjs';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const arg = args.find(a => !a.startsWith('--')) || 'index.html';
const target = /^https?:/.test(arg) ? arg : pathToFileURL(resolve(arg)).href;
const map = Number(opt('map', 0));
const cap = Number(opt('max', 300)) * 1000;
const [pa, pb] = opt('ports', '9351,9352').split(',').map(Number);
const out = resolve('tools/out'); mkdirSync(out, {recursive: true});
const results = [];
const check = (name, ok, detail = '') => { results.push({name, ok: !!ok, detail}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };
const boot = p => until(() => p.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot'});

const A = await launch({port: pa, width: 1280, height: 800});
const B = await launch({port: pb, width: 1280, height: 800});
const samples = [];
try {
  await A.goto(target); await boot(A);
  await A.eval(`DEAD_ENDS.selectMap(${map}, true)`);
  await A.eval('document.getElementById("coopBtn").click(); document.getElementById("hostBtn").click()');
  const code = await until(() => A.eval('(document.getElementById("roomCode").textContent||"").trim()'), {timeout: 10000, label: 'room code'});
  check('host: room code', /^[A-Z0-9]{5}$/.test(code), code);
  const online = await until(() => A.eval('DEAD_ENDS.state.peerOpen'), {timeout: 30000, label: 'peer open'}).then(() => true).catch(() => false);
  check('host: PeerJS signalling open', online);
  const invite = await A.eval('(()=>{const u=new URL(location.href);u.hash="join="+document.getElementById("roomCode").textContent.trim();return u.href})()');
  console.log('invite', invite);

  const t0 = Date.now();
  await B.goto(invite); await boot(B);
  const joined = await until(() => B.eval('DEAD_ENDS.state.netConnected'), {timeout: 45000, label: 'client connect'}).then(() => true).catch(() => false);
  check('client: joined through the invite link', joined, `${Date.now() - t0} ms, fromLink=${await B.eval('DEAD_ENDS.getV15?.().joinedFromLink')}`);
  check('client: hash cleared after join', await B.eval('location.hash===""'), await B.eval('location.hash'));
  check('client: transport is WebRTC', (await B.eval('DEAD_ENDS.state.netTransport')) === 'peer', await B.eval('DEAD_ENDS.state.netTransport'));
  const names = await A.eval('({host:document.getElementById("callsign").value, remote:[...DEAD_ENDS.state.players].map(p=>p.name)})');
  check('names: host callsign is not SURVIVOR', names.host !== 'SURVIVOR', JSON.stringify(names));
  check('lobby: host sees 2 players', (await A.eval('DEAD_ENDS.state.remotePlayers')) === 1, 'remote=' + await A.eval('DEAD_ENDS.state.remotePlayers'));

  await A.eval('document.getElementById("hostStart").click()');
  await until(() => A.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 15000, label: 'host play'});
  await A.eval('DEAD_ENDS.setAuto(true)');
  const clientPlaying = await until(() => B.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 20000, label: 'client play'}).then(() => true).catch(() => false);
  check('client: entered play from the world packet', clientPlaying);
  await sleep(1500);
  const inGame = await A.eval('({host:document.getElementById("callsign").value,names:DEAD_ENDS.state.players.map(p=>p.name)})');
  const clientName = await B.eval('document.getElementById("callsign").value');
  check('names: both callsigns on the host roster', inGame.names[0] === inGame.host && inGame.names.includes(clientName) && inGame.host !== clientName, JSON.stringify({...inGame, client: clientName}));
  check('names: client sees its own callsign', (await B.eval('DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].name')) === clientName, clientName);
  // Client input reaches the host: hold a movement key on the client for 3 s and watch the host move that survivor.
  const slotB = await B.eval('DEAD_ENDS.state.localSlot');
  const before = await A.eval(`[DEAD_ENDS.state.players[${slotB}].x, DEAD_ENDS.state.players[${slotB}].y]`);
  await B.eval('DEAD_ENDS.press("w",true); DEAD_ENDS.press("d",true)');
  await sleep(3000);
  await B.eval('DEAD_ENDS.press("w",false); DEAD_ENDS.press("d",false)');
  const after = await A.eval(`[DEAD_ENDS.state.players[${slotB}].x, DEAD_ENDS.state.players[${slotB}].y]`);
  check('input: client keys move its survivor on the host', Math.hypot(after[0] - before[0], after[1] - before[1]) > 20, `${before.map(Math.round)} -> ${after.map(Math.round)}`);
  // Hand the client's survivor to the host AI while it stays connected, so the squad runs the route and the seal and finish get exercised end to end.
  await A.eval(`DEAD_ENDS.state.players[${slotB}].bot=true`);
  // Deterministic door replication: the host opens the first closed tactical door; the client must see it open within two snapshots' worth of time.
  await sleep(2000);
  const doorId = await A.eval('(DEAD_ENDS.getV14().doors.find(d=>d.open===false&&!d.destroyed)||{}).id ?? null');
  let doorSeen = null;
  if (doorId !== null) {
    await A.eval(`DEAD_ENDS.debugV14.door(${doorId})`);
    await sleep(1500);
    doorSeen = await B.eval(`(DEAD_ENDS.getV14().doors.find(d=>d.id===${doorId})||{}).open`);
    check('sync: host-opened door shows open on the client', doorSeen === true, `door ${doorId} client open=${doorSeen}`);
  }
  const t1 = Date.now();
  let doorAgree = 0, doorDisagree = 0, doorOpenSeen = 0, sealSeen = 0, snapshotsMoved = 0, lastPos = null, weaponSeen = false;
  while (Date.now() - t1 < cap) {
    await sleep(2000);
    const h = await A.eval('({phase:DEAD_ENDS.state.phase,elapsed:DEAD_ENDS.state.elapsed,z:DEAD_ENDS.state.zombies.length,doors:DEAD_ENDS.getV14().doors,seal:DEAD_ENDS.getV14().safe,weapons:DEAD_ENDS.getV14().weapons,p:DEAD_ENDS.state.players.map(p=>[Math.round(p.x),Math.round(p.y),Math.ceil(p.hp),p.down,p.dead])})');
    const c = await B.eval('({phase:DEAD_ENDS.state.phase,z:DEAD_ENDS.state.zombies.length,doors:DEAD_ENDS.getV14().doors,seal:DEAD_ENDS.getV14().safe,weapons:DEAD_ENDS.getV14().weapons,slot:DEAD_ENDS.state.localSlot,p:DEAD_ENDS.state.players.map(p=>[Math.round(p.x),Math.round(p.y),Math.ceil(p.hp),p.down,p.dead])})');
    samples.push({t: Date.now() - t1, h, c});
    const hd = new Map(h.doors.map(d => [d.id, d])), cd = new Map(c.doors.map(d => [d.id, d]));
    for (const [id, d] of hd) { const e = cd.get(id); if (!e || d.open === undefined) continue; if (d.open === e.open) doorAgree++; else doorDisagree++; if (d.open) doorOpenSeen++; }
    if (c.seal.amount > 0) sealSeen++;
    if (h.weapons.some(w => w.upgrade.rifle || w.upgrade.auto) && c.weapons.some(w => w.upgrade.rifle || w.upgrade.auto)) weaponSeen = true;
    const pos = c.p[0].join(','); if (lastPos && pos !== lastPos) snapshotsMoved++; lastPos = pos;
    if (h.phase !== 'play') break;
  }
  await A.shot(`${out}/coop-host.png`); await B.shot(`${out}/coop-client.png`);
  const hEnd = await A.eval('({phase:DEAD_ENDS.state.phase,eyebrow:document.getElementById("endEyebrow")?.textContent||""})');
  const cEnd = await B.eval('({phase:DEAD_ENDS.state.phase,eyebrow:document.getElementById("endEyebrow")?.textContent||"",endShown:getComputedStyle(document.getElementById("end")||document.body).display!=="none"})');
  check('play: host finished the chapter', hEnd.phase !== 'play', JSON.stringify(hEnd));
  check('play: client received the finish', cEnd.phase !== 'play' && /COMPLETE|DOWN|LOST|FELL|DEAD/i.test(cEnd.eyebrow + ' '), JSON.stringify(cEnd));
  check('sync: client survivor positions update from snapshots', snapshotsMoved > 5, 'moves=' + snapshotsMoved);
  check('sync: door state agrees host vs client', doorDisagree === 0 && doorAgree > 0, `agree=${doorAgree} disagree=${doorDisagree} openSamples=${doorOpenSeen}`);
  console.log('open-door samples during the run:', doorOpenSeen);
  check('sync: seal progress reached the client', sealSeen > 0, `sealSamples=${sealSeen} packets=${await B.eval('DEAD_ENDS.getV15().sealPackets')}`);
  console.log('weapon find replicated:', weaponSeen);
} catch (e) {
  check('harness', false, e.message);
} finally {
  const bad = [...A.logs.map(l => 'A ' + l), ...B.logs.map(l => 'B ' + l)].filter(l => /EXCEPTION|^. error/.test(l));
  check('console: no exceptions on either side', bad.length === 0, bad.slice(0, 3).join(' | '));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  writeFileSync(`${out}/coop.json`, JSON.stringify({target, results, samples, logsA: A.logs, logsB: B.logs}, null, 1));
  A.kill(); B.kill();
  process.exitCode = passed === results.length ? 0 : 1;
}
