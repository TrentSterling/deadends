// Autopilot campaign run for regression comparison. Zero deps:
//   node tools/campaign.mjs [file-or-url] [--maps=0,1,2,3,4] [--seed=31987] [--max=420] [--port=9340]
// Boots the page headlessly, hands the local survivor to the bot AI (DEAD_ENDS.setAuto),
// simulates each chapter at 60 Hz in 10 s chunks until the run ends or the time cap hits,
// and prints one row per chapter: result, sim seconds, squad state, zombies killed.
// This proves routes complete under the AI. It says nothing about fun or balance.
import {launch, sleep, until} from './cdp.mjs';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve, basename} from 'node:path';
import {pathToFileURL} from 'node:url';

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const arg = args.find(a => !a.startsWith('--')) || 'index.html';
const target = /^https?:/.test(arg) ? arg : pathToFileURL(resolve(arg)).href;
const maps = opt('maps', '0,1,2,3,4').split(',').map(Number);
const seed = Number(opt('seed', 31987));
const cap = Number(opt('max', 420));
const tag = basename(arg).replace(/\.html$/, '');
const out = resolve('tools/out'); mkdirSync(out, {recursive: true});
const page = await launch({port: Number(opt('port', 9340)), width: 1280, height: 800});
const rows = [];
try {
  await page.goto(target);
  await until(() => page.eval('!!window.DEAD_ENDS && !document.getElementById("playBtn").disabled'), {timeout: 90000, label: 'boot'});
  const build = await page.eval('DEAD_ENDS.build || document.getElementById("menu")?.dataset.build || "?"');
  console.log(`${tag}: build ${build}, seed ${seed}, cap ${cap}s`);
  for (const m of maps) {
    await page.eval(`DEAD_ENDS.startMap(${m}, ${seed}); DEAD_ENDS.setAuto(true);`);
    await until(() => page.eval('DEAD_ENDS.state.phase==="play"'), {timeout: 20000, label: 'map ' + m + ' start'});
    const t0 = Date.now();
    let sim = 0, last = null, log = [];
    while (sim < cap) {
      await page.eval('DEAD_ENDS.simulate(10)');
      sim += 10;
      last = await page.eval('DEAD_ENDS.sample()');
      const v14 = await page.eval('DEAD_ENDS.getV14 ? DEAD_ENDS.getV14() : null');
      log.push({sim, ...last, safe: v14?.safe});
      const phase = await page.eval('DEAD_ENDS.state.phase');
      if (phase !== 'play') break;
    }
    const st = await page.eval('({phase:DEAD_ENDS.state.phase,progress:DEAD_ENDS.state.progress,elapsed:DEAD_ENDS.state.elapsed,stats:DEAD_ENDS.state.stats,zombies:DEAD_ENDS.state.zombies.length,win:(()=>{try{return document.getElementById("endEyebrow")?.textContent}catch{return ""}})()})');
    const squad = last.players.map(p => `${p.id}:${p.dead ? 'DEAD' : p.down ? 'DOWN' : p.hp}`).join(' ');
    const row = {map: m, name: await page.eval('DEAD_ENDS.MAPS?.[' + m + ']?.name || ""'), phase: st.phase, result: st.phase === 'play' ? 'TIMEOUT' : (String(st.win).includes('COMPLETE') ? 'WIN' : 'LOSS ' + String(st.win).slice(0, 40)), sim, elapsed: +Number(st.elapsed).toFixed(1), progress: st.progress, squad, kills: st.stats?.kills ?? st.stats?.killed ?? JSON.stringify(st.stats).slice(0, 80), wallMs: Date.now() - t0};
    rows.push(row);
    console.log(JSON.stringify(row));
    await page.shot(`${out}/campaign-${tag}-map${m}.png`);
    writeFileSync(`${out}/campaign-${tag}-map${m}.json`, JSON.stringify(log, null, 1));
    await page.eval('DEAD_ENDS.setAuto(false); DEAD_ENDS.goMenu && DEAD_ENDS.goMenu()');
    await sleep(500);
  }
} catch (e) {
  console.log('HARNESS ERROR', e.message);
} finally {
  const bad = page.logs.filter(l => l.startsWith('EXCEPTION') || l.startsWith('error'));
  console.log(`${tag}: ${rows.filter(r => r.result === 'WIN').length}/${rows.length} chapters won, ${bad.length} console errors`);
  for (const l of bad.slice(0, 10)) console.log('  ', l.slice(0, 300));
  writeFileSync(`${out}/campaign-${tag}.json`, JSON.stringify({target, rows, errors: bad}, null, 2));
  page.kill();
}
