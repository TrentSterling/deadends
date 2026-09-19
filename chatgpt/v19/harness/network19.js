/* ---------------- V19: one-click public rounds; private codes remain optional ----------------
   Discovery uses a bounded set of well-known PeerJS IDs, not a hidden game server.
   Local tabs discover/elect over BroadcastChannel. PeerJS is the global arbiter
   for each public room ID; a full room spills into the next public room.
   Claude's base64 + 8k JSON fragments remain the wire representation. */
const PUBLIC_ROOMS19=['LOBBY',...Array.from({length:15},(_,i)=>'PUB'+String(i+2).padStart(2,'0'))];
function logNet19(event,detail=''){net19.log.push({at:+performance.now().toFixed(1),event,detail});if(net19.log.length>80)net19.log.shift();}
function codeOK19(code){return typeof code==='string'&&/^[A-Z0-9]{5}$/.test(code);}
function pause19(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function isCurrent19(op){return net19.operation===op;}
function cancelSearch19(){net19.operation++;net19.seeking=false;net19.public=false;net19.manual=false;net19.cancel?.({ok:false,why:'cancelled'});net19.cancel=null;clearTimeout(net19.reconnectTimer);clearTimeout(net19.publicTimer);net19.reconnectTimer=net19.publicTimer=null;}
const disconnectBefore19=disconnectNet;disconnectNet=function(...a){
 if(!net19.internal)cancelSearch19();
 net19.ready=false;net19.awaiting=null;net19.stream=null;net19.run=null;net19.registering=false;
 net19.joinResolve?.({ok:false,why:'cancelled'});net19.joinResolve=null;chunks15.clear();net13.rxKey=null;
 return disconnectBefore19(...a);
};
function transitionNet19(){net19.internal++;try{disconnectNet(false);}finally{net19.internal--;}}
function announcePublic19(to){
 if(netMode!=='host'||!net19.public)return;
 broadcast?.postMessage({t:'offer19',protocol19:19,from:localToken,to,code:roomCode,
  free:3-slotOwners.size,playing:phase==='play',map:selectedMap,cloud:net19.cloud,at:Date.now()});
}
setupBroadcast=function(){
 if(broadcast)return;
 try{broadcast=new BroadcastChannel('dead-ends-coop-v19');broadcast.onmessage=({data:m})=>{
  if(!m||m.from===localToken||m.to&&m.to!==localToken)return;
  if(m.t==='discover19'){announcePublic19(m.from);return;}
  if(m.t==='candidate19'){if(PUBLIC_ROOMS19.includes(m.code)&&typeof m.from==='string')net19.candidates.set(m.from,{code:m.code,at:performance.now()});return;}
  if(m.t==='offer19'){if(PUBLIC_ROOMS19.includes(m.code)&&Number.isInteger(m.free))net19.offers.set(m.code,{...m,seen:performance.now()});return;}
  if(m.room!==roomCode)return;
  if(netMode==='host'){
   if(m.t==='bc-join'){
    if(m.protocol19!==19){broadcast.postMessage({t:'reject',room:roomCode,from:localToken,to:m.from,reason:'This room needs DEAD ENDS v19.',why19:'version'});return;}
    let slot=[...slotOwners].find(([,o])=>o.token===m.from)?.[0];
    if(slot===undefined)slot=claimSlot({token:m.from,name:cleanName(m.name),transport:'bc',ready19:false,lastReal19:performance.now()});
    if(slot===null){broadcast.postMessage({t:'reject',room:roomCode,from:localToken,to:m.from,reason:'This squad is full.',why19:'full'});return;}
    welcome19(slot);return;
   }
   const slot=[...slotOwners].find(([,o])=>o.token===m.from)?.[0];
   if(slot!==undefined)hostMessage19(slot,m);return;
  }
  if(netMode==='client')handlePacket(m);
 };}catch(e){logNet19('local discovery unavailable',e.message);}
};
const claimSlotBefore19=claimSlot;claimSlot=function(owner){
 // Prefer a living AI. Do not invent a fresh full-health survivor for a late join.
 const available=[1,2,3].filter(s=>!slotOwners.has(s)).sort((a,b)=>(players[a]?.dead?2:players[a]?.down?1:0)-(players[b]?.dead?2:players[b]?.down?1:0));
 if(!available.length)return null;
 const slot=available[0];owner.ready19=false;owner.lastSeq19=-1;owner.lastReal19=performance.now();slotOwners.set(slot,owner);
 const p=players[slot];if(p){p.bot=true;p.name=owner.name;p.equipAck10=0;p.attackSeen10=p.useSeen10=p.reloadSeen10=0;p.equip10=p.weapon;p.lastGun10=p.weapon;p.holdBlock10=false;}
 updateLobby();return slot;
};
function welcome19(slot){
 sendTo(slot,{t:'welcome',slot,room:roomCode,playing:phase!=='menu',protocol19:19,public19:net19.public,cloud19:net19.cloud});
 if(phase!=='menu'){
  sendTo(slot,{t:'world',seed:worldSeed,difficulty,map:selectedMap,campaign:campaignMode});sendTo(slot,makeSnapshot(false));
  if(phase==='win'||phase==='loss')sendTo(slot,{t:'finish',win:phase==='win',elapsed,stats,saved:players.filter(p=>!p.dead&&inSafeGeom14(p)).length,survivors:players.map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,dead:p.dead,down:p.down,name:p.name,bot:p.bot}))});
 }
 updateNetStatus();announcePublic19();
}
function hostMessage19(slot,m){
 const owner=slotOwners.get(slot);if(!owner||!m||typeof m!=='object')return;
 owner.lastReal19=performance.now();
 if(m.t==='ready19'){
  if(m.run!==worldSeed||m.stream!==net13.epoch){net19.stale++;return;}
  const p=players[slot];if(!p)return;
  if(!owner.ready19){owner.ready19=true;p.bot=false;p.name=owner.name;p.brain=null;
   p.equipAck10=0;p.attackSeen10=p.useSeen10=p.reloadSeen10=0;p.holdBlock10=false;
   owner.lastInput=clock;logNet19('player ready',String(slot));toast(owner.name+' joined the squad',2);
  }
  sendTo(slot,{t:'ready-ack19',run:worldSeed,stream:net13.epoch,slot});sendTo(slot,makeSnapshot(false));updateNetStatus();return;
 }
 if(m.t==='input'){
  if(!owner.ready19){if(m.input?.resync13&&performance.now()-(owner.lastResync19||0)>1200){owner.lastResync19=performance.now();sendTo(slot,makeSnapshot(false));}return;}
  if(!Number.isSafeInteger(m.seq)||m.seq<=owner.lastSeq19){net19.stale++;return;}
  owner.lastSeq19=m.seq;remoteInputs.set(slot,sanitizeInput(m.input));owner.lastInput=clock;return;
 }
 if(m.t==='leave')releaseSlot(slot);
}
function acceptPeer19(c,myPeer){
 let assigned=null;
 c.on('open',()=>{
  if(peer!==myPeer||netMode!=='host'){c.close();return;}
  if(c.metadata?.protocol19!==19){sendPeer15(c,{t:'reject',reason:'This room needs DEAD ENDS v19.',why19:'version'});setTimeout(()=>c.close(),200);return;}
  assigned=claimSlot({name:cleanName(c.metadata?.name),transport:'peer',token:c.peer,ready19:false});
  if(assigned===null){sendPeer15(c,{t:'reject',reason:'This squad is full.',why19:'full'});setTimeout(()=>c.close(),200);return;}
  connections.set(assigned,c);welcome19(assigned);
 });
 c.on('data',m=>{if(peer===myPeer&&assigned!==null)hostMessage19(assigned,m);});
 const close=()=>{if(peer===myPeer&&assigned!==null&&connections.get(assigned)===c){releaseSlot(assigned);announcePublic19();}};
 c.on('close',close);c.on('error',close);
}
async function createPeer19(id,op){
 const Peer=await loadPeer();if(!isCurrent19(op))throw{type:'cancelled'};
 return new Promise((resolve,reject)=>{
  let done=false;const p=peer=new Peer(id,{debug:0,secure:true});
  const finish=(err)=>{if(done)return;done=true;clearTimeout(timer);if(err)reject(err);else resolve(p);};
  const timer=setTimeout(()=>finish({type:'network-timeout'}),6500);
  p.on('open',()=>{if(peer!==p||!isCurrent19(op))return finish({type:'cancelled'});net19.cloud='online';finish();});
  p.on('connection',c=>acceptPeer19(c,p));
  p.on('error',e=>{if(peer!==p)return;if(!done)return finish(e);logNet19('peer error',e.type||e.message);
   net19.peerError?.(e);
   if(e.type==='network'||e.type==='server-error'||e.type==='socket-error'){net19.cloud='offline';if(netMode==='host')updateNetStatus();}
  });
  p.on('disconnected',()=>{if(peer!==p)return;net19.cloud='reconnecting';logNet19('signalling disconnected');
   setTimeout(()=>{if(peer===p&&!p.destroyed&&p.disconnected)try{p.reconnect();}catch(_){}},1600);
  });
 });
}
function waitJoin19(ms=8000){
 return new Promise(resolve=>{
  const timer=setTimeout(()=>{if(net19.joinResolve===done)net19.joinResolve=null;resolve({ok:false,why:'timeout'});},ms);
  function done(value){clearTimeout(timer);if(net19.joinResolve===done)net19.joinResolve=null;resolve(value);}
  net19.joinResolve=done;
 });
}
async function connectRoom19(code,op,forcePeer=false){
 transitionNet19();if(!isCurrent19(op))return{ok:false,why:'cancelled'};
 netMode='client';roomCode=code;net19.ready=false;netConnected=false;receivedWorld=false;setupBroadcast();
 netStatus(net19.public?'Joining a public squad…':'Joining private room…');
 show('roomDisplay',!net19.public);show('hostStart',false);$('hostBtn').disabled=$('joinBtn').disabled=true;
 if(!forcePeer&&broadcast){
  const joined=waitJoin19(550);
  broadcast.postMessage({t:'bc-join',protocol19:19,room:code,from:localToken,name:cleanName($('callsign').value)});
  const result=await joined;if(result.ok||result.why==='full'||result.why==='version')return result;
 }
 if(!isCurrent19(op))return{ok:false,why:'cancelled'};
 try{
  const p=await createPeer19(undefined,op);if(!isCurrent19(op))return{ok:false,why:'cancelled'};
  const joined=waitJoin19(6500);
  net19.peerError=e=>{if(e.type==='peer-unavailable')net19.joinResolve?.({ok:false,why:'missing'});else if(['network','webrtc','server-error'].includes(e.type))net19.joinResolve?.({ok:false,why:e.type});};
  const c=p.connect('deadends-v19-'+code,{reliable:true,serialization:'json',metadata:{name:cleanName($('callsign').value),protocol19:19}});
  connections.set(0,c);
  c.on('data',m=>{if(peer===p&&netMode==='client')handlePacket(m);});
  c.on('close',()=>{if(peer===p&&netMode==='client'){netConnected=false;net19.ready=false;net19.joinResolve?.({ok:false,why:'closed'});lostHost19();}});
  c.on('error',()=>{if(peer===p)net19.joinResolve?.({ok:false,why:'connection'});});
  return await joined;
 }catch(e){logNet19('join failed',e.type||e.message);return{ok:false,why:e.type==='cancelled'?'cancelled':'service'};}
}
async function createRoom19(code,op,auto=false,localOnly=false){
 transitionNet19();if(!isCurrent19(op))return{ok:false,why:'cancelled'};
 netMode='host';localSlot=0;roomCode=code;net19.registering=true;net19.ready=true;net19.cloud=localOnly?'local':'connecting';setupBroadcast();
 show('roomDisplay',!net19.public);$('roomCode').textContent=code;$('hostBtn').disabled=$('joinBtn').disabled=true;
 netStatus(net19.public?'Opening a public squad…':'Opening private room…');
 if(!localOnly){try{await createPeer19('deadends-v19-'+code,op);}catch(e){
   if(!isCurrent19(op))return{ok:false,why:'cancelled'};
   if(e.type==='unavailable-id'){sendAll({t:'redirect19',code,public19:net19.public,forcePeer:true});return{ok:false,why:'taken'};}
   net19.cloud='local';net19.localOnly=true;logNet19('local fallback',e.type||e.message);
  }}
 if(!isCurrent19(op))return{ok:false,why:'cancelled'};
 net19.registering=false;net19.seeking=false;net19.ready=true;updateNetStatus();announcePublic19();
 if(auto&&phase==='menu')startRun();else show('hostStart',true);
 syncOnlineUI19();return{ok:true,host:true,local:net19.cloud!=='online'};
}
function randomCode19(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=alphabet[Math.floor(Math.random()*alphabet.length)];return s;}
hostRoom=async function(){cancelSearch19();const op=net19.operation;net19.manual=true;openCoop();const r=await createRoom19(randomCode19(),op,false);if(r.why==='taken'&&isCurrent19(op))await createRoom19(randomCode19(),op,false);};
joinRoom=async function(){
 const code=$('joinCode').value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
 if(!codeOK19(code)){netStatus('Enter the five-character private room code.');return false;}
 cancelSearch19();net19.manual=true;const op=net19.operation;openCoop();const r=await connectRoom19(code,op);
 if(!r.ok&&isCurrent19(op)){netStatus(r.why==='full'?'This private squad is full.':'Could not join. Check that the host is online and both copies are v19.');$('hostBtn').disabled=$('joinBtn').disabled=false;}
 return r.ok;
};
async function quickPlay19(){
 if(phase!=='menu'){toast('Return to the menu to change squads.');return;}
 cancelSearch19();const op=net19.operation;net19.public=true;net19.seeking=true;net19.localOnly=false;net19.offers.clear();net19.candidates.clear();
 openCoop();syncOnlineUI19();setupBroadcast();netStatus('Finding a squad…');
 broadcast?.postMessage({t:'discover19',protocol19:19,from:localToken});await pause19(240);
 if(!isCurrent19(op))return;
 const offers=[...net19.offers.values()].filter(o=>o.free>0).sort((a,b)=>PUBLIC_ROOMS19.indexOf(a.code)-PUBLIC_ROOMS19.indexOf(b.code));
 if(offers.length){const r=await connectRoom19(offers[0].code,op);if(r.ok||!isCurrent19(op))return;}
 for(let i=0;i<PUBLIC_ROOMS19.length&&isCurrent19(op);i++){
  const code=PUBLIC_ROOMS19[i];net19.publicIndex=i;
  if(net19.offers.get(code)?.free===0)continue;
  // Same-origin contenders pick one candidate before contacting global discovery.
  setupBroadcast();net19.candidates.set(localToken,{code,at:performance.now()});
  broadcast?.postMessage({t:'candidate19',protocol19:19,from:localToken,code});await pause19(220);
  if(!isCurrent19(op))return;
  const older=[...net19.candidates].filter(([token,c])=>token<localToken&&c.code===code&&performance.now()-c.at<10000);
  if(older.length){
   netStatus('Another tab is opening the squad…');
   const r=await connectRoom19(code,op);if(r.ok)return;
   if(!isCurrent19(op))return;
  }
  // Claiming a well-known ID is an atomic global election. An existing owner
  // sends unavailable-id; then we join it instead of starting a competing match.
  const made=await createRoom19(code,op,true);
  if(made.ok||!isCurrent19(op))return;
  if(made.why==='taken'){
   const r=await connectRoom19(code,op,true);if(r.ok)return;
   if(r.why!=='full'&&r.why!=='missing'){net19.retries++;await pause19(350);}
  }
 }
 if(isCurrent19(op)){net19.seeking=false;netStatus('Public squads are busy or unreachable. Retry online, or start a private room.');syncOnlineUI19();}
}
function sendHost19(m){
 try{const c=connections.get(0);if(c?.open)c.send(m);else broadcast?.postMessage({...m,room:roomCode,from:localToken});}catch(e){logNet19('control send failed',e.message);}
}
function sendReady19(){if(netMode!=='client'||!receivedWorld||!net13.rxKey||performance.now()-net19.lastReady<150)return;net19.lastReady=performance.now();sendHost19({t:'ready19',run:worldSeed,stream:net13.rxKey.stream});}
function lostHost19(){
 if(netMode!=='client')return;net19.ready=false;netConnected=false;paused=true;keys={};mouse.down=mouse.right=false;
 show('pause');$('pauseTitle').textContent='HOST DISCONNECTED';
 $('pauseText').textContent=net19.public?'Finding another public round…':'The host left. Return to the menu to join or host a room.';
 if(net19.public&&!net19.reconnectTimer){net19.rejoins++;net19.reconnectTimer=setTimeout(()=>{
   net19.reconnectTimer=null;goMenu();quickPlay19();
  },900+Math.random()*500);}
}
const packetBefore19=handlePacket;handlePacket=function(packet){
 let m=packet;if(!m||typeof m!=='object')return;
 if(m.t==='chunk15'){m=reassemble15(m);if(!m)return;}
 if(netMode==='client'){
  net19.hostSeen=performance.now();
  if(m.t==='reject'){net19.joinResolve?.({ok:false,why:m.why19||'rejected'});return packetBefore19(m);}
  if(m.t==='redirect19'&&codeOK19(m.code)){
   const op=net19.operation;net19.public=!!m.public19;connectRoom19(m.code,op,!!m.forcePeer);return;
  }
  if(m.t==='welcome'){
   if(m.protocol19!==19){net19.joinResolve?.({ok:false,why:'version'});netStatus('This room is running another build. Use v19 on every machine.');return;}
   const r=packetBefore19(m);net19.public=!!m.public19;net19.cloud=m.cloud19||net19.cloud;net19.joinResolve?.({ok:true});syncOnlineUI19();return r;
  }
  if(m.t==='world'){
   if(m.protocol19!==19||!Number.isInteger(m.epoch19)||!Number.isFinite(m.seed)){net19.malformed++;return;}
   if(net19.stream===m.epoch19&&net19.run===m.seed&&receivedWorld){sendReady19();return;}
   net19.stream=m.epoch19;net19.run=m.seed;net19.ready=false;net19.awaiting={at:performance.now()};chunks15.clear();
  }
  if(m.t==='state13'&&(m.stream!==net19.stream||m.run19!==net19.run)){net19.stale++;return;}
  if(m.t==='finish'&&(m.epoch19!==net19.stream||m.run19!==net19.run)){net19.stale++;return;}
  if(m.t==='ready-ack19'){
   if(m.run!==worldSeed||m.stream!==net19.stream){net19.stale++;return;}
   net19.ready=true;net19.awaiting=null;net19.seeking=false;paused=false;netConnected=true;
   if(players[localSlot]){players[localSlot].bot=false;gear10.selected=players[localSlot].equip10??players[localSlot].weapon;gear10.lastGun=players[localSlot].weapon;gear10.uiKey='';}
   for(const id of ['coop','menu','pause'])show(id,false);if(phase==='play')show('ui');canvas.focus({preventScroll:true});syncOnlineUI19();return;
  }
  if(m.t==='host-left'){packetBefore19(m);lostHost19();return;}
 }
 try{
  const r=packetBefore19(m);
  if(netMode==='client'&&(m.t==='state13'||m.t==='state')&&net19.awaiting&&net13.rxKey&&receivedWorld)sendReady19();
  return r;
 }catch(e){net19.malformed++;net13.needKey=true;logNet19('packet rejected',e.message);if(netMode==='client')sendHost19({t:'input',seq:netSequence++,input:{run:worldSeed,resync13:true}});}
};
const clientBefore19=updateClient;updateClient=function(dt){if(!net19.ready)return;return clientBefore19(dt);};
updateNetStatus=function(){
 if(netMode!=='host')return;
 const online=peer?.open&&net19.cloud==='online';
 netStatus(net19.public?(online?'Public squad · anyone can join':net19.registering?'Opening public squad…':'Local tabs only · online discovery unavailable'):(online?'Private room ready. Share its invite link.':'Private room · local tabs only'));
 $('roomCode').textContent=roomCode;
 sendAll({t:'lobby',map:selectedMap,campaign:campaignMode,players:[{id:0,name:cleanName($('callsign').value),bot:false},...[1,2,3].map(id=>({id,name:slotOwners.get(id)?.name||NAMES[id],bot:!slotOwners.has(id),loading:slotOwners.has(id)&&!slotOwners.get(id).ready19}))]});
 syncOnlineUI19();
};
function syncOnlineUI19(){
 if(!$('coop'))return;
 $('coop').dataset.public19=net19.public?'true':'false';
 $('coop').querySelector('.screen-heading').textContent=net19.public?'PUBLIC CO-OP':'PRIVATE CO-OP';
 $('publicBtn').textContent='Play online';$('coopBtn').querySelector('span').textContent='Private room';
 if(net19.public){show('roomDisplay',false);show('roomSetup',false);show('hostStart',false);show('disconnectBtn',net19.seeking||netMode!=='solo');$('disconnectBtn').textContent='Cancel / leave';}
 if($('onlineStatus19')){
  const count=netMode==='host'?1+slotOwners.size:players.filter(p=>!p.bot).length;
  $('onlineStatus19').textContent=netMode==='solo'?'':net19.public?(net19.cloud==='local'?'Local co-op': 'Public co-op')+' · '+Math.max(1,count)+'/4': 'Private co-op';
 }
}
const lobbyBefore19=updateLobby;updateLobby=function(){const r=lobbyBefore19();syncOnlineUI19();return r;};
const closeCoopBefore19=closeCoop;closeCoop=function(){if(net19.seeking||!net19.ready&&netMode==='client'){disconnectNet();}return closeCoopBefore19();};
const menuBefore19=goMenu;goMenu=function(...a){cancelSearch19();return menuBefore19(...a);};
joinFromHash15=function(){
 const m=/(?:#|&)join=([a-z0-9]{5})(?:&|$)/i.exec(location.hash),pub=/(?:#|&)public(?:=1)?(?:&|$)/i.test(location.hash);
 if(!m&&!pub)return false;if(phase!=='menu'){toast('Return to the menu to change squads.');return false;}
 try{history.replaceState(null,'',location.pathname+location.search);}catch(_){}
 if(m){$('joinCode').value=m[1].toUpperCase();openCoop();joinRoom();}else quickPlay19();return true;
};
const copyBefore19=copyInvite;copyInvite=async function(link){if(net19.public&&link&&/^https?:$/.test(location.protocol)){
 const url=new URL(location.href);url.hash='join='+roomCode;try{await navigator.clipboard.writeText(url.href);netStatus('Squad link copied.');return;}catch(_){}
 }return copyBefore19(link);};
$('hostBtn').onclick=hostRoom;$('joinBtn').onclick=joinRoom;$('coopBtn').onclick=openCoop;$('coopClose').onclick=closeCoop;
for(const id of ['publicBtn','publicBtn2'])$(id).onclick=quickPlay19;
$('disconnectBtn').onclick=()=>{disconnectNet();updateLobby();};
for(const id of ['quitBtn','endMenu'])$(id).onclick=goMenu;
setInterval(()=>{
 const now=performance.now();
 if(netMode==='host'){
  if(now-net19.heartbeat>2000){net19.heartbeat=now;announcePublic19();}
  for(const [s,o]of slotOwners)if(o.ready19&&now-(o.lastReal19||now)>20000){connections.get(s)?.close();releaseSlot(s);}
 }else if(netMode==='client'){
  if(net19.awaiting&&receivedWorld&&now-net19.lastReady>1500)sendReady19();
  if(netConnected&&phase==='play'&&now-net19.hostSeen>16000)lostHost19();
 }
},600);
Object.assign(DEAD_ENDS,{quickPlay:quickPlay19,goMenu,joinFromHash:joinFromHash15});
