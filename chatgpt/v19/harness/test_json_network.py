from pathlib import Path
from playwright.async_api import async_playwright
import asyncio,json,time,traceback
W=Path('/mnt/data/dead_ends_v19_work');html=Path('/mnt/data/dead_ends_v19.html').read_text();adapter=(W/'json_peer_broker.js').read_text()
out={'method':'Peer-compatible simulated channel via test broker; distinct browser contexts; real JSON stringify/parse and <=16KiB messages enforced. NOT native RTC, PeerJS cloud, or separate-network NAT test.','checks':[],'errors':[]};owners={};tasks=set()
async def signal(source,m):
 page=source['page'];t=m['type']
 if t=='register':
  if m['id'] in owners and owners[m['id']] is not page:return {'ok':False}
  owners[m['id']]=page;return {'ok':True}
 if t=='unregister':
  if owners.get(m['id']) is page:owners.pop(m['id'],None)
  return {'ok':True}
 dest=owners.get(m['to'])
 if dest is None:return {'ok':False}
 task=asyncio.create_task(dest.evaluate('(m)=>rtcQA.receive(m)',m));tasks.add(task);task.add_done_callback(lambda t:(tasks.discard(t),t.exception() if not t.cancelled() else None))
 return {'ok':True}
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-features=WebRtcHideLocalIpsWithMdns','--force-webrtc-ip-handling-policy=default_public_and_private_interfaces'])
  async def page():
   context=await b.new_context(viewport={'width':1200,'height':800});await context.expose_binding('signalQA',signal);p=await context.new_page();p.on('pageerror',lambda e:out['errors'].append(str(e)));p.set_default_timeout(18000)
   await p.set_content('<script>'+adapter+'</script>'+html,wait_until='domcontentloaded');await p.wait_for_function('window.DEAD_ENDS && !document.querySelector("#playBtn").disabled');return p
  h=await page();c=await page()
  async def run(name,f):
   try:
    d=await f();out['checks'].append({'name':name,'pass':True,'detail':d});print('PASS',name,str(d)[:180],flush=True)
   except Exception as e:
    out['checks'].append({'name':name,'pass':False,'error':str(e)});print('FAIL',name,str(e),flush=True)
    print('HOST',await h.evaluate('({s:DEAD_ENDS.sample(),n:DEAD_ENDS.getNetwork(),rtc:rtcQA.counts,pcs:rtcQA.states()})'),flush=True)
    print('CLIENT',await c.evaluate('({s:DEAD_ENDS.sample(),n:DEAD_ENDS.getNetwork(),rtc:rtcQA.counts,pcs:rtcQA.states()})'),flush=True)
   (W/'qa_json_network.json').write_text(json.dumps(out,indent=2))
  async def public():
   await h.click('#publicBtn');await h.wait_for_function('DEAD_ENDS.state.phase==="play" && DEAD_ENDS.state.netMode==="host"')
   await c.click('#publicBtn');await c.wait_for_function('DEAD_ENDS.state.phase==="play" && DEAD_ENDS.state.netMode==="client" && DEAD_ENDS.getNetwork().ready')
   a=await h.evaluate('({mode:DEAD_ENDS.state.netMode,players:DEAD_ENDS.getNetwork().readyPeers,z:DEAD_ENDS.state.zombies.length,chunked:DEAD_ENDS.getNetwork().chunkedMessages,counts:rtcQA.counts})')
   d=await c.evaluate('({mode:DEAD_ENDS.state.netMode,transport:DEAD_ENDS.state.netTransport,z:DEAD_ENDS.state.zombies.length,chunks:DEAD_ENDS.getNetwork().chunksReassembled,counts:rtcQA.counts})')
   assert d['transport']=='peer';assert d['z']>100 and abs(d['z']-a['z'])<3;assert d['chunks']>0;return {'host':a,'client':d}
  await run('two clicks find same public room via JSON test broker; base64 keyframe arrives',public)
  if not out['checks'][-1]['pass']: await b.close();return
  async def movement():
   before=await h.evaluate('DEAD_ENDS.state.players[1].y');await c.bring_to_front();await c.keyboard.down('s');await asyncio.sleep(.65);await c.keyboard.up('s');await asyncio.sleep(.25);after=await h.evaluate('DEAD_ENDS.state.players[1].y');assert after-before>20;return {'authoritativeDistance':after-before}
  await run('native remote keyboard input moves authoritative survivor',movement)
  async def door():
   await h.evaluate('DEAD_ENDS.qa19.setDoor(true)');await c.wait_for_function('DEAD_ENDS.getShelter().door.open && !DEAD_ENDS.getShelter().door.solid')
   await h.evaluate('DEAD_ENDS.qa19.setDoor(false)');await c.wait_for_function('!DEAD_ENDS.getShelter().door.open && DEAD_ENDS.getShelter().door.solid')
   id=await h.evaluate('()=>{const d=DEAD_ENDS.state.props.find(p=>p.type==="door");DEAD_ENDS.debugV14.door(d.id);return d.id}')
   await c.wait_for_function('(id)=>DEAD_ENDS.state.props.find(p=>p.id===id)?.open14',arg=id)
   return {'tacticalDoor':id,'startDoor':'open -> close replicated'}
  await run('starting shutter and Claude tactical-door states over JSON test transport',door)
  async def population():
   id=await h.evaluate('()=>{const z=DEAD_ENDS.spawn(1400,1900,"brute",true);return z?.id}')
   assert id
   await c.wait_for_function('(id)=>DEAD_ENDS.state.zombies.some(z=>z.id===id)',arg=id)
   await h.evaluate('(id)=>DEAD_ENDS.hurtZ(id,10000)',id);await c.wait_for_function('(id)=>!DEAD_ENDS.state.zombies.some(z=>z.id===id)',arg=id)
   return {'addedThenRemoved':id,'errors':await c.evaluate('DEAD_ENDS.getNet15().errors')}
  await run('spawn after keyframe + delta death without missing-base crash',population)

  async def lateHistory():
   await h.evaluate('()=>{for(const z of DEAD_ENDS.state.zombies.slice())DEAD_ENDS.hurtZ(z.id,10000)}')
   await asyncio.sleep(1.7)
   guest=await page();await guest.click('#publicBtn');await guest.wait_for_function('DEAD_ENDS.getNetwork().ready && DEAD_ENDS.state.netMode==="client"')
   r=await guest.evaluate('({transport:DEAD_ENDS.state.netTransport,history:DEAD_ENDS.makeSnapshot(false).af.length,reassembled:DEAD_ENDS.getNetwork().chunksReassembled,errors:DEAD_ENDS.getNet15().errors})')
   assert r['history']>100 and r['reassembled']>0 and not r['errors'],r
   await guest.evaluate('DEAD_ENDS.goMenu()');return r
  await run('late join reconstructs over 100 persistent deaths from chunked keyframe',lateHistory)
  async def transition():
   await h.evaluate('''()=>{DEAD_ENDS.clearThreats();const s=DEAD_ENDS.getExtra().safe,d=DEAD_ENDS.getV19().finalDoor;for(let i=0;i<4;i++){DEAD_ENDS.teleport(s.x+70+(i%2)*110,d.y+44+Math.floor(i/2)*55,i);DEAD_ENDS.state.players[i].upgrade14={rifle:true,auto:i===1};}DEAD_ENDS.qa19.seal(0);}''')
   await h.wait_for_function('DEAD_ENDS.state.phase==="win"');await c.wait_for_function('DEAD_ENDS.state.phase==="win"')
   old=await c.evaluate('DEAD_ENDS.makeSnapshot(false)');await h.click('#nextBtn');await c.wait_for_function('DEAD_ENDS.getExtra().selectedMap===1 && DEAD_ENDS.state.phase==="play" && DEAD_ENDS.getNetwork().ready')
   state=await c.evaluate('({map:DEAD_ENDS.getExtra().selectedMap,u:DEAD_ENDS.state.players[1].upgrade14,clip:DEAD_ENDS.state.players[1].ammo[0],epoch:DEAD_ENDS.getNetwork().expectedEpoch})');assert state['u']['rifle'] and state['u']['auto'];assert state['clip']==14
   stale=await c.evaluate('(m)=>{const before=DEAD_ENDS.getNetwork().stalePackets;DEAD_ENDS.qa19.injectPacket({t:"state13",stream:-10,run19:m.run19,zdata:""});return DEAD_ENDS.getNetwork().stalePackets-before}',old);assert stale==1
   return state
  await run('safehouse seal -> real Next button -> new ready handshake + upgrades + stale rejection',transition)
  async def stats():
   await asyncio.sleep(2.2);r=await h.evaluate('DEAD_ENDS.getNetwork()');assert r['outBytes']>20000;return {'appBytes':r['outBytes'],'maxMessage':await h.evaluate('rtcQA.counts.maxMessage'),'errors':await c.evaluate('rtcQA.counts.errors')}
  await run('application-byte counters + chunk size bound on JSON test transport',stats)
  async def dropout():
   await c.evaluate('DEAD_ENDS.goMenu()');await h.wait_for_function('DEAD_ENDS.state.remotePlayers===0 && DEAD_ENDS.state.players[1].bot');return {'takeover':True}
  await run('JSON client leaves; bot takes over same survivor',dropout)
  out['pass']=all(t['pass'] for t in out['checks']) and not out['errors'];(W/'qa_json_network.json').write_text(json.dumps(out,indent=2));await b.close()
asyncio.run(main())
