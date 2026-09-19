/* ---------------- V19: doors, chapter carry, bounded packet recovery ---------------- */
function buildFinalDoor19(){
 const y=Math.floor(SAFE.doorY/T)*T;
 sim19.finalDoor=addProp('finalDoor19',SAFE.x-44,y,25,T*2,{solid:false,open:true,amount:1,hp:0,vertical:true});
 ensureSpatial6();
}
const worldBefore19=makeWorld;makeWorld=function(...args){
 sim19.fields.clear();sim19.noises.length=0;sim19.finalDoor=null;sim19.doorRevision++;
 const r=worldBefore19(...args);buildFinalDoor19();return r;
};
function safeDoorCenter19(){const d=sim19.finalDoor;return d?{x:d.x+d.w/2,y:d.y+d.h/2}:{x:SAFE.doorX,y:SAFE.doorY};}
function cancelSeal19(reason){
 if(!v14.safe.closing)return;v14.safe.closing=false;v14.safe.amount=0;v14.safe.closed=false;
 if(sim19.finalDoor){sim19.finalDoor.open=true;sim19.finalDoor.amount=1;sim19.finalDoor.solid=false;}
 sim19.sealsCancelled++;event13('seal-cancelled',{reason});toast(reason,2);
 if(netMode==='host')netEvents.push({type:'notice',title:'DOOR BLOCKED',sub:reason});
}
beginSeal14=function(p,abandon=false){
 if(netMode==='client'||phase!=='play'||!p||p.dead||p.down||p.pinnedBy>=0||v14.safe.closing||v14.safe.closed)return false;
 const d=sim19.finalDoor;if(!d||dist(p,safeDoorCenter19())>135||!inSafeGeom14(p))return false;
 if(zombies.some(z=>z.hp>0&&inSafeGeom14(z))){toast('Clear the infected out of the safehouse.');return false;}
 if(!canCloseDoor14(d)){toast('Clear the doorway first.');return false;}
 v14.safe.closing=true;v14.safe.amount=0;v14.safe.closer=p.id;p.interactHold=0;
 d.open=false;cue19('seal-start',d.x,d.y);event13('safehouse-seal',{slot:p.id,abandon});
 return true;
};
updateFinalSafe14=function(dt){
 if(netMode==='client'||!v14.safe.closing||v14.safe.closed)return;
 const p=players[v14.safe.closer],d=sim19.finalDoor;
 if(!p||p.dead||p.down||p.pinnedBy>=0||!inSafeGeom14(p)||dist(p,safeDoorCenter19())>150){cancelSeal19('The survivor sealing the door was interrupted.');return;}
 if(!d||!canCloseDoor14(d)||zombies.some(z=>z.hp>0&&inSafeGeom14(z))){cancelSeal19('Get the doorway and room clear.');return;}
 v14.safe.amount=clamp(v14.safe.amount+dt/0.6,0,1);d.amount=1-v14.safe.amount;
 if(v14.safe.amount>=1){
  v14.safe.closed=true;d.solid=true;d.open=false;d.amount=0;sim19.doorRevision++;
  cue19('seal-close',d.x,d.y);event13('safehouse-closed',{inside:players.filter(p=>!p.dead&&inSafeGeom14(p)).length});finishRun(true);
 }
};
const nearestBefore19=nearestAction;nearestAction=function(p){
 const a=nearestBefore19(p);
 if(a?.kind==='safe14'){
  if(dist(p,safeDoorCenter19())>135)return null;
  if(zombies.some(z=>z.hp>0&&inSafeGeom14(z)))return{kind:'safeBlocked19',text:'CLEAR THE INFECTED INSIDE'};
  return a;
 }return a;
};
const botBefore19=botControls;botControls=function(p){
 const input=botBefore19(p);
 if((autoPilot||players.every(q=>q.bot||q.dead))&&inSafeGeom14(p)&&players.every(q=>q.dead||inSafeGeom14(q))){
  if(p.id===getLeader()?.id){
   const d=safeDoorCenter19(),goal={x:SAFE.x+70,y:d.y};
   if(dist(p,d)>121&&!v14.safe.closing){const n=navTo(p,goal,12);input.mx=n.x;input.my=n.y;input.e=false;}
   else {input.mx=input.my=0;input.e=!v14.safe.closed;}
  }else if(nearestAction(p)?.kind==='safe14')input.e=false;
 }
 return input;
};
const applySealBefore19=applySeal15;applySeal15=function(s){
 applySealBefore19(s);const d=sim19.finalDoor;if(!d)return;
 d.open=!v14.safe.closing&&!v14.safe.closed;d.amount=v14.safe.closed?0:1-v14.safe.amount;d.solid=v14.safe.closed;
};
const startBefore19=startRun;startRun=function(s,fromNet=false){
 sim19.time=0;sim19.noises.length=0;sim19.fields.clear();
 if(netMode==='host')for(const o of slotOwners.values())o.ready19=false;
 if(netMode==='client'){net19.ready=false;receivedWorld=false;}
 const r=startBefore19(s,fromNet);
 for(const p of players){p.upgrade14=cleanUpgrades19(p.upgrade14);if(netMode==='host'&&slotOwners.has(p.id))p.bot=!slotOwners.get(p.id).ready19;}
 if(netMode==='client'){net19.ready=false;show('coop');show('roomSetup',false);netStatus('Synchronizing the squad…');}
 if(netMode==='host'){net19.ready=true;sendAll(makeSnapshot(false));}
 return r;
};
// The visible weapon find replaces a slot, so local equipment selection must follow it.
const interactBefore19=interact;interact=function(p,...args){
 const old=p.weapon,u0=!!p.upgrade14?.rifle,u1=!!p.upgrade14?.auto,r=interactBefore19(p,...args);
 if((!u0&&p.upgrade14?.rifle)||(!u1&&p.upgrade14?.auto)){
  p.equip10=p.lastGun10=p.weapon;p.reload=0;
  if(p.id===localSlot&&netMode!=='client'){gear10.selected=gear10.lastGun=p.weapon;gear10.seq++;p.equipAck10=gear10.seq;gear10.uiKey='';}
 }return r;
};
// Chunking is Claude's JSON-safe transport, now with size/time bounds and no
// allocation from an untrusted advertised n until the header is validated.
reassemble15=function(m){
 const fail=()=>{net19.malformed++;return null;};
 if(!Number.isSafeInteger(m.id)||m.id<0||!Number.isInteger(m.n)||m.n<1||m.n>192||!Number.isInteger(m.i)||m.i<0||m.i>=m.n||typeof m.d!=='string'||m.d.length>CHUNK15)return fail();
 const now=performance.now();for(const [id,e]of chunks15)if(now-e.at>7000)chunks15.delete(id);
 let e=chunks15.get(m.id);
 if(!e){if(chunks15.size>=4)chunks15.delete(chunks15.keys().next().value);e={parts:new Array(m.n),got:0,bytes:0,at:now};chunks15.set(m.id,e);}
 if(e.parts.length!==m.n)return fail();
 if(e.parts[m.i]===undefined){e.parts[m.i]=m.d;e.got++;e.bytes+=m.d.length;}
 if(e.bytes>1048576){chunks15.delete(m.id);return fail();}
 if(e.got<m.n)return null;chunks15.delete(m.id);v15.reassembled++;net19.chunkBytes+=e.bytes;
 try{return JSON.parse(e.parts.join(''));}catch(_){return fail();}
};
// Compact-state metadata carries the world epoch too. A delayed previous-run
// keyframe is not a new world, and cannot overwrite a client's current chapter.
const sendBefore19=sendTo;sendTo=function(slot,m){
 if(['world','lobby','finish'].includes(m?.t))m={...m,protocol19:19,epoch19:net13.epoch,run19:worldSeed,public19:net19.public};
 if(m?.t==='world'){const o=slotOwners.get(slot);if(o)o.ready19=false;}
 return sendBefore19(slot,m);
};
const snapshotBefore19=makeSnapshot;makeSnapshot=function(...a){const m=snapshotBefore19(...a);m.protocol19=19;m.run19=worldSeed;return m;};
