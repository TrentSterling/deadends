// Public room harness. Zero deps: node tools/lobby.mjs [file-or-url] [--ports=9391,9392]
// 1. Tab A clicks PLAY ONLINE with nobody around: it must host LOBBY and be in play within seconds.
// 2. Tab B (same browser, second tab) clicks PLAY ONLINE: it must join A over BroadcastChannel.
// 3. Chrome C (separate browser) clicks PLAY ONLINE: it must join A over WebRTC, mid-run.
// 4. Tab A closes. B and C must recover on their own: one hosts LOBBY, the other joins it.
import {launch, sleep, until} from './cdp.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const arg = args.find(a => !a.startsWith('--')) || 'index.html';
const target = /^https?:/.test(arg) ? arg : pathToFileURL(resolve(arg)).href;
const [pa, pc] = opt('ports', '9391,9392').split(',').map(Number);
const results = [];
const check = (name, ok, detail = '') => { results.push({name, ok: !!ok, detail}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };
const boot = p => until(() => p.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot'});
const lobby = p => p.eval('DEAD_ENDS.getLobby16()');
const A = await launch({port: pa});
const C = await launch({port: pc});
let B;
try {
  await A.goto(target); await boot(A);
  let t0 = Date.now();
  await A.eval('document.getElementById("publicBtn").click()');
  const aPlay = await until(() => A.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 30000, label: 'A play'}).then(() => true).catch(() => false);
  let la = await lobby(A);
  check('A: PLAY ONLINE alone hosts the public room and starts', aPlay && la.netMode === 'host' && la.code === 'LOBBY', `${Date.now() - t0} ms ${JSON.stringify(la)}`);
  await until(() => A.eval('DEAD_ENDS.state.peerOpen'), {timeout: 20000, label: 'A peer open'}).catch(() => {});

  B = await A.sibling();
  await B.goto(target); await boot(B);
  t0 = Date.now();
  await B.eval('document.getElementById("publicBtn").click()');
  const bPlay = await until(() => B.eval('DEAD_ENDS.state.phase==="play"&&DEAD_ENDS.state.netConnected'), {timeout: 30000, label: 'B join'}).then(() => true).catch(() => false);
  const lb = await lobby(B);
  check('B: second tab joins the public room', bPlay && lb.netMode === 'client', `${Date.now() - t0} ms transport=${await B.eval('DEAD_ENDS.state.netTransport')} ${JSON.stringify(lb)}`);

  await C.goto(target); await boot(C);
  t0 = Date.now();
  await C.eval('document.getElementById("publicBtn").click()');
  const cPlay = await until(() => C.eval('DEAD_ENDS.state.phase==="play"&&DEAD_ENDS.state.netConnected'), {timeout: 40000, label: 'C join'}).then(() => true).catch(() => false);
  check('C: separate browser joins mid-run over WebRTC', cPlay && (await C.eval('DEAD_ENDS.state.netTransport')) === 'peer', `${Date.now() - t0} ms ${JSON.stringify(await lobby(C))}`);
  check('A: sees 3 players', (await A.eval('DEAD_ENDS.state.remotePlayers')) === 2, 'remote=' + await A.eval('DEAD_ENDS.state.remotePlayers'));
  await sleep(3000);
  const cMoves = await C.eval('DEAD_ENDS.state.players[0].x');
  await sleep(3000);
  check('C: receives state', (await C.eval('DEAD_ENDS.state.players[0].x')) !== cMoves || (await C.eval('DEAD_ENDS.state.zombies.length')) > 0);

  // Host vanishes.
  await A.close();
  t0 = Date.now();
  const recovered = await until(async () => {
    const b = await lobby(B), c = await lobby(C);
    const hosts = [b, c].filter(x => x.netMode === 'host' && x.code === 'LOBBY' && x.phase === 'play');
    const clients = [b, c].filter(x => x.netMode === 'client' && x.netConnected && x.phase === 'play');
    return hosts.length === 1 && clients.length === 1 ? {b, c} : null;
  }, {timeout: 60000, every: 1000, label: 'rehost'}).catch(() => null);
  check('B+C: recover without the host, one hosts and one joins', !!recovered, `${Date.now() - t0} ms ${JSON.stringify(recovered && {b: [recovered.b.netMode, recovered.b.rehosts], c: [recovered.c.netMode, recovered.c.rehosts]})}`);
} catch (e) {
  check('harness', false, e.message);
} finally {
  const bad = [...A.logs.map(l => 'A ' + l), ...(B ? B.logs.map(l => 'B ' + l) : []), ...C.logs.map(l => 'C ' + l)].filter(l => /EXCEPTION|^. error/.test(l));
  check('console: no exceptions', bad.length === 0, bad.slice(0, 3).join(' | '));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  A.kill(); C.kill();
  process.exitCode = passed === results.length ? 0 : 1;
}
