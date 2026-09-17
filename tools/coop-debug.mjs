// Diagnose client state application over PeerJS. node tools/coop-debug.mjs [file] [--ports=9371,9372] [--secs=25]
import {launch, sleep, until} from './cdp.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const arg = args.find(a => !a.startsWith('--')) || 'index.html';
const target = /^https?:/.test(arg) ? arg : pathToFileURL(resolve(arg)).href;
const [pa, pb] = opt('ports', '9371,9372').split(',').map(Number);
const boot = p => until(() => p.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot'});
const A = await launch({port: pa}); const B = await launch({port: pb});
try {
  await A.goto(target); await boot(A);
  await A.eval('document.getElementById("coopBtn").click(); document.getElementById("hostBtn").click()');
  const code = await until(() => A.eval('(document.getElementById("roomCode").textContent||"").trim()'), {timeout: 10000, label: 'code'});
  await until(() => A.eval('DEAD_ENDS.state.peerOpen'), {timeout: 30000, label: 'peer open'});
  await B.goto(target); await boot(B);
  // Instrument the client before it connects: count packet types and surface handler exceptions.
  await B.eval(`document.getElementById("coopBtn").click(); document.getElementById("joinCode").value=${JSON.stringify(code)}; document.getElementById("joinBtn").click()`);
  await until(() => B.eval('DEAD_ENDS.state.netConnected'), {timeout: 45000, label: 'client connect'});
  console.log('client connected via', await B.eval('DEAD_ENDS.state.netTransport'));
  await A.eval('document.getElementById("hostStart").click()');
  await until(() => A.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 15000, label: 'host play'});
  await A.eval('DEAD_ENDS.setAuto(true)');
  await until(() => B.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 20000, label: 'client play'});
  for (let i = 0; i < Number(opt('secs', 25)) / 5; i++) {
    await sleep(5000);
    const c = await B.eval('({net:DEAD_ENDS.getNet15?DEAD_ENDS.getNet15():null,p0:DEAD_ENDS.state.players[0].x|0,z:DEAD_ENDS.state.zombies.length,connected:DEAD_ENDS.state.netConnected,peerOpen:DEAD_ENDS.state.peerOpen,me:DEAD_ENDS.state.players[DEAD_ENDS.state.localSlot].bot})');
    const h = await A.eval('({net:DEAD_ENDS.getNet15?DEAD_ENDS.getNet15():null,p0:DEAD_ENDS.state.players[0].x|0,z:DEAD_ENDS.state.zombies.length,remotePlayers:DEAD_ENDS.state.remotePlayers,p1bot:DEAD_ENDS.state.players[1].bot,snapshotJson:JSON.stringify(DEAD_ENDS.makeSnapshot(false)).length,afRows:(DEAD_ENDS.makeSnapshot(false).af||[]).length,remoteInputs:[...(DEAD_ENDS.netInputs().remote)].map(([k,v])=>[k,v&&v.resync13,v&&v.sent13])})');
    console.log(JSON.stringify({t: (i + 1) * 5, client: {...c, net: {seq:c.net?.seq,key:c.net?.keySeq,needKey:c.net?.needKey,rx:c.net?.rx}}, host: {...h, net: {out:h.net?.outMessages,keys:h.net?.keyframes,deltas:h.net?.deltas,peers:h.net?.peers}}}));
  }
  console.log('client console:', B.logs.slice(0, 15)); console.log('toasts host:', await A.eval('document.getElementById("toast")?.textContent||[...document.querySelectorAll(".toast, #toasts *")].map(e=>e.textContent).join(" | ")'));
  console.log('host console:', A.logs.slice(0, 15));
} catch (e) { console.log('ERR', e.message); } finally { A.kill(); B.kill(); }
