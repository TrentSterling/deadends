/* Read-only diagnostics and explicit sandbox hooks for repeatable regression tests. */
const reportBefore19=report8;report8=function(...a){const r=reportBefore19(...a);r.build='DEAD ENDS v19';
 r.v19={basis:'Tront / Claude edited v18.5',senses:sensesSummary19(),network:getNetwork19(),
  safehouse:{preparationShots:sim19.prepShots,worldRunsDuringPreparation:true,closedDoorGunPort:true,sealsCancelled:sim19.sealsCancelled},
  fixes:{validShoveInterrupts:sim19.interrupts,blockedMelee:sim19.blockedMelee,upgrades:players.map(p=>({id:p.id,...cleanUpgrades19(p.upgrade14)}))}};
 return r;
};
function getNetwork19(){return {...netReport13(),protocol:19,transport:netTransport,public:net19.public,publicRoom:net19.publicIndex+1,
 ready:net19.ready,cloud:net19.cloud,registering:net19.registering,seeking:net19.seeking,localOnly:net19.cloud==='local',
 expectedEpoch:net19.stream,epoch:net13.epoch,malformedPackets:net19.malformed,stalePackets:net19.stale,
 chunksReassembled:v15.reassembled,chunkedMessages:v15.chunked,readyPeers:[...slotOwners].map(([slot,o])=>({slot,ready:!!o.ready19,transport:o.transport})),
 hostMigration:false,publicHostLoss:'Find another public round; no in-flight world migration',log:net19.log.slice()};}
Object.assign(DEAD_ENDS,{build:'19',makeSnapshot,getPerformance:report8,getNetwork:getNetwork19,
 getPerception:()=>sensesSummary19(),getInfectedMind:id=>{const z=zombies.find(z=>z.id===id);return z?.ai19?JSON.parse(JSON.stringify(z.ai19)):null;},
 getV19:()=>({basis:'uploaded edited v18.5',network:getNetwork19(),senses:sensesSummary19(),seal:{...v14.safe},finalDoor:sim19.finalDoor?{...sim19.finalDoor}:null,staging:staging10()}),
 spawn:(...a)=>spawnZombie(...a),shove:()=>shove(players[localSlot]),canSee:sightClear19,
 startMap:(map,s=31987)=>{disconnectNet();setRun12('classic');campaignLeg=campaignKills=campaignTime=0;chapterCarry=null;selectMap(map,false);startRun(s);},
 startRemix:(map=0,s=123456)=>{disconnectNet();setRun12('remix',s);campaignLeg=campaignKills=campaignTime=0;chapterCarry=null;selectMap(map,false);startRun();},
 quickPlay:quickPlay19,hostPrivate:hostRoom,joinPrivate:code=>{$('joinCode').value=code;return joinRoom();},
 goMenu,next:()=>nextChapter(),continueCampaign:()=>continueCampaign7(),exportSave:exportSave13,
 qa19:{
  render:()=>{motion9.alpha=1;resetMotion9();drawScreen(0);updateUI(true);},
  setAudio:v=>{audio.muted=!v;if(audio.master)audio.master.gain.value=v?.4:0;},
  pauseAnimation:()=>{paused=true;},
  noise:(kind,x,y,r=500)=>{v11.sandbox=true;emitNoise19(kind,x,y,r);},
  ray:(kind,x,y,dx,dy,max)=>{const v=purposeRay19(kind,x,y,dx,dy,max);return{d:v.d,obj:v.obj?.type||null};},
  observe:id=>{const z=zombies.find(z=>z.id===id);if(z)observeInfected19(z);},
  setSandbox:v=>v11.sandbox=!!v,
  use:slot=>{v11.sandbox=true;const p=players[slot??localSlot];p.lastInteract=false;return interact(p,true,.2);},
  refill:slot=>{v11.sandbox=true;const p=players[slot??localSlot];addPickup('ammo',p.x,p.y);return interact(p,true,.2);},
  setDoor:(open)=>{v11.sandbox=true;return setDoor10(open);},
  seal:(slot=localSlot,abandon=false)=>{v11.sandbox=true;return beginSeal14(players[slot],abandon);},
  stepSeal:n=>{v11.sandbox=true;for(let i=0;i<n;i++)updateFinalSafe14(1/60);},
  injectPacket:m=>handlePacket(m),reassemble:m=>reassemble15(m),
  doors:()=>props.filter(p=>['door','shelterDoor','finalDoor19'].includes(p.type)).map(p=>({...p})),
  rawSave:()=>({checkpoint:checkpoint7,clears:[...clears7]}),
  forceCheckpoint:()=>{v11.sandbox=false;writeSafehouse7();return saveEnvelope13();},
  wireRoundTrip:()=>{
   const rx=net13.rxKey,seq=net13.rxSequence,need=net13.needKey;try{
    const state=makeSnapshot(false),s={seq:0,base:null},key=JSON.parse(JSON.stringify(encodeState13(state,s,true))),wireBytes=payloadBytes13(key),decoded=decodeState13(key);
    return{encoded:wireBytes,decoded:decoded.zs.length,source:state.zs.length,propFields:decoded.pr[0]?.length,keys:s.seq};
   }finally{net13.rxKey=rx;net13.rxSequence=seq;net13.needKey=need;}
  }
 }
});
DEAD_ENDS.ready.then(()=>{assignCallsign15();syncOnlineUI19();});
// Keep downloadable reports on the same build/schema as the live inspector.
export8=function(){
 const now=report8(),r=perf8.lastCapture?{...now,...perf8.lastCapture,build:'DEAD ENDS v19',
  raster:now.raster,network:now.network,v19:now.v19,events13:now.events13,
  trace13:now.trace13,stateHashes13:now.stateHashes13,blastEvents:burstReport11()}:now;
 downloadJSON13('dead-ends-v19-'+(perf8.lastCapture?'capture':'rolling')+'.json',r);toast('Report saved.');
};
DEAD_ENDS.exportPerformance=export8;exportPerf6=export8;
$('perfExport').onclick=export8;$('devExport11').onclick=export8;
