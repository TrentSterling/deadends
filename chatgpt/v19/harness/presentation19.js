/* ---------------- V19: safehouse feedback and opt-in senses inspector ---------------- */
function audioPan19(x,y){
 if(!audio.ctx||!audio.master)return null;
 if(!sound19.buses){sound19.buses=Array.from({length:5},(_,i)=>{const g=audio.ctx.createGain(),p=audio.ctx.createStereoPanner();p.pan.value=(i-2)*.4;g.connect(p);p.connect(audio.master);return g;});}
 const p=players[localSlot];if(!p||!Number.isFinite(x+y))return sound19.buses[2];
 const side=clamp((x-p.x)/620,-1,1),index=clamp(Math.round(side*2)+2,0,4);return sound19.buses[index];
}
function cue19(kind,x,y){
 if(!audio.ctx||audio.muted)return;
 const now=audio.ctx.currentTime,last=sound19.cues.get(kind)||-99;
 if(now-last<(['metal','wood'].includes(kind)?.13:.08))return;sound19.cues.set(kind,now);
 const p=players[localSlot],gain=p?clamp(1-dist(p,{x,y})/1100,0,1):.3;if(gain<.02)return;
 const old=soundBus19;soundBus19=audioPan19(x,y);
 try{
  if(kind==='seal-start'||kind==='door'){noiseSound(.24,.24*gain,750);tone(165,67,.18,.17*gain,'sawtooth');}
  else if(kind==='seal-close'){noiseSound(.16,.48*gain,530);tone(70,25,.26,.37*gain,'sine');noiseSound(.09,.21*gain,3300,'bandpass',1,.18);tone(880,170,.06,.08*gain,'square',.18);}
  else if(kind==='brute'){noiseSound(.36,.26*gain,390,'lowpass',.7);tone(95,58,.33,.18*gain,'sawtooth');}
  else if(kind==='leaper'){noiseSound(.21,.15*gain,2700,'bandpass',1.1);tone(610,1130,.21,.1*gain,'triangle');}
  else if(kind==='screamer'){tone(470,1230,.37,.13*gain,'sawtooth');noiseSound(.4,.16*gain,1500,'bandpass');}
  else if(kind==='interrupt'){noiseSound(.07,.21*gain,1300);tone(420,110,.11,.12*gain,'triangle');}
  else if(kind==='metal'){noiseSound(.095,.16*gain,1850,'bandpass');tone(410,220,.085,.07*gain,'triangle');}
  else if(kind==='wood'){noiseSound(.085,.20*gain,850);tone(120,70,.075,.07*gain);}
 }finally{soundBus19=old;}
}
const sfxBefore19=sfx;sfx=function(type,x,y,variant){
 const previous=soundBus19;soundBus19=audioPan19(x,y);
 try{
  if(type==='gun'&&audio.ctx&&!audio.muted){
   const shooter=players.find(p=>Math.hypot(p.x-x,p.y-y)<5),up=shooter&&upgrade14(shooter,variant);
   if(up){const local=players[localSlot],v=local?clamp(1-Math.hypot(local.x-x,local.y-y)/1100,0,1):1;
    if(variant===0){noiseSound(.17,.46*v,1650);tone(94,29,.19,.54*v);noiseSound(.035,.12*v,4400,'highpass',1,.12);}
    else{noiseSound(.17,.62*v,2050);tone(92,25,.17,.56*v);noiseSound(.045,.11*v,4200,'bandpass',1,.11);}
    return;
   }
  }
  return sfxBefore19(type,x,y,variant);
 }finally{soundBus19=previous;}

};
function drawSafeBeacon19(){
 if(art18.view==='actors'||art18.view==='silhouette')return;
 const d=sim19.finalDoor;if(!d||!visible(d.x,d.y,180))return;
 const c=ctx,cy=d.y+d.h/2;c.save();
 box18(c,d.x-12,d.y-36,49,21,'#1b3e33','#658a70',1,2);c.fillStyle='#c1e4ae';c.font='bold 11px Arial';c.textAlign='center';c.fillText('SAFE',d.x+12,d.y-21);c.restore();
}
function drawSteelDoor19(p){
 const c=ctx;if(!visible(p.x+p.w/2,p.y+p.h/2,200))return;
 c.save();c.translate(p.x,p.y);if(p.h>p.w){c.translate(p.w,0);c.rotate(Math.PI/2);}
 const len=Math.max(p.w,p.h),thick=Math.min(p.w,p.h),a=p.amount||0;
 box18(c,-7,-7,len+14,thick+14,'#101d25','#657173',2,2);
 c.save();c.beginPath();c.rect(0,-2,len,thick+4);c.clip();c.translate(-len*a+(p.hit19?Math.sin(p.hit19*135)*1.2:0),0);
 box18(c,0,0,len,thick,p.type==='finalDoor19'?'#924b3a':'#98543b','#281c1b',1.5,2);
 box18(c,3,2,len-6,3,'#cf9270');box18(c,3,thick-5,len-6,3,'#5c3028');
 if(p.type==='shelterDoor'){
  const x=len*.23,w=len*.54;box18(c,x,6,w,thick-12,'#08161d','#d0b996',1.4,1);
  for(let xx=x+5;xx<x+w-2;xx+=11){box18(c,xx,6,2.5,thick-12,'#91a9a5');box18(c,xx+2.5,6,1,thick-12,'#344b51');}
 }else{for(let x=15;x<len;x+=20)artLine(c,[x,6,x,thick-6],'#b77654',1);}
 for(const x of [8,len-8])for(const y of [6,thick-6])circle(c,x,y,1.7,'#d0b994');
 box18(c,len-18,thick*.55,10,4,'#d5c4a0','#352b25',.8,1);c.restore();
 box18(c,len+3,5,4,7,p.open?'#a5cf85':'#db9e6b');c.restore();
}
const propBefore19=drawProp;drawProp=function(p){
 if((p.type==='shelterDoor'||p.type==='finalDoor19')&&art18.view!=='actors'&&art18.view!=='silhouette')return drawSteelDoor19(p);
 return propBefore19(p);
};
const setDoorBefore19=setDoor10;setDoor10=function(open,quiet=false){const d=shelter10?.door,was=d?.open,r=setDoorBefore19(open,quiet);if(r&&was!==open){sim19.doorRevision++;if(!quiet){cue19('door',d.x,d.y);emitNoise19('door',d.x,d.y,165);}}return r;};
const uiBefore19=updateUI;updateUI=function(force=false){const r=uiBefore19(force);
 if(phase==='play'&&staging10()){
  const p=players[localSlot];$('objective').textContent=shelter10.door.open?'Leave when ready':'Prepare, or clear the street through the bars';
  for(const q of players){const el=$('survivor'+q.id);if(el&&q.bot&&!q.down&&!q.dead)el.querySelector('.sub').textContent=q.intent==='Covering'?'COVERING':q.intent==='Healing'?'HEALING':'';}
 }
 if(force||performance.now()-net19.lastLobbyUI>700){net19.lastLobbyUI=performance.now();syncOnlineUI19();}
 return r;
};
function sensesSummary19(){const states={};for(const z of zombies){const key=z.ai19?.state||(z.awake?'alert':'ambient');states[key]=(states[key]||0)+1;}return{states,noises:sim19.noises.map(n=>({...n})),heard:sim19.heard,seen:sim19.seen,sightTests:sim19.sightTests,sharedFields:sim19.fields.size,fieldBuilds:sim19.fieldBuilds,prepShots:sim19.prepShots,staging:staging10(),time:sim19.time};}
function installV19UI(){
 const style=document.createElement('style');style.textContent=`
 #coop[data-public19="true"] .room-label,#coop[data-public19="true"] .roomrow,#coop[data-public19="true"] #roomDisplay,#coop[data-public19="true"] #roomSetup,#coop[data-public19="true"] .connection-help{display:none!important}
 #coop[data-public19="true"] .lobby-mission{display:none}#coop[data-public19="true"] .coop-connect{align-self:center}
 #onlineStatus19{position:fixed;top:59px;right:27px;color:#adbdb4;font:12px Arial;pointer-events:none;z-index:2}
 body:has(.overlay:not(.hidden)) #onlineStatus19{display:none}
 #senseReadout19{font:12px/1.7 monospace;white-space:pre-wrap;color:#d6ded0}
 #senseHelp19{font:12px/1.5 Arial;color:#a6b7ad}.sense-toggle19{display:flex;gap:9px;align-items:center;padding:12px 0}
 @media(max-width:650px){#onlineStatus19{top:49px;right:14px;font-size:10px}}
 `;document.head.append(style);
 const badge=document.createElement('span');badge.id='onlineStatus19';document.body.append(badge);
 const tab=document.createElement('button');tab.dataset.tab='senses';tab.textContent='Senses';tab.onclick=()=>devTab11('senses');$('devTabs11').append(tab);
 const page=document.createElement('section');page.dataset.page='senses';page.className='hidden';page.innerHTML='<label class="sense-toggle19"><input type="checkbox" id="senseToggle19">Sight, hearing and remembered targets</label><pre id="senseReadout19"></pre><p id="senseHelp19">Blue: ambient. Amber: investigating a sound. Red: pursuing. Lines show the actual remembered goal. Alt-click an infected to inspect it. Host-side information only.</p>';
 $('devPanel11').append(page);$('senseToggle19').onchange=()=>{sim19.sensesVisible=$('senseToggle19').checked;frozenFrameKey7='';preview8.rendered=false;};
 const help=$('coop').querySelector('.connection-help');help.innerHTML='<summary>Connection help</summary><p>Play online joins or opens a public squad. Full squads spill into another public room. Private rooms use a code or invite link. All players must use v19.</p><p>PeerJS provides global discovery; the host browser runs the game. If discovery is unavailable, the status explicitly says Local tabs only. Public host loss finds a new round, not a migrated copy of the old fight.</p><p>For sharing, serve index.html on HTTPS. Public services and restrictive networks can still prevent a connection; no always-on game server is bundled.</p>';
 $('coop').querySelector('.coop-roster .note').textContent='Four survivors. AI holds your slot until your world is synchronized.';
 $('guide').querySelector('.guide-notes').innerHTML='<p><b>Safehouse freedom.</b> Shoot through the barred center of the closed exit, heal, reload, or open it with E. The world keeps moving. Gunfire alerts nearby infected; timed hordes wait until you leave.</p><p><b>The last door.</b> Get everyone inside, clear any infected, then seal the red door from nearby. An open room is not invulnerable. Found weapons carry to the next chapter.</p><details><summary>More controls</summary><p>Space / RMB: shove · V: drag · X: squad order · Tab: map · Ctrl + wheel: zoom · F2: developer tools · F4: profiler · F8: record · F9: export</p></details>';
 buildCredit111.textContent='Build 19 · Living streets / one-click co-op';$('menu').dataset.build='19';
}
const updateDevBefore19=updateDev11;updateDev11=function(force=false){const r=updateDevBefore19(force);
 if(!dev11.enabled||performance.now()-sim19.lastSenseUI<220&&!force)return r;sim19.lastSenseUI=performance.now();
 const s=sensesSummary19(),z=devEntity11(),b=z?.ai19;
 if($('senseReadout19'))$('senseReadout19').textContent=netMode==='client'?'Infected planning runs on the host.\nUse F2 on the host to inspect intent.':
  Object.entries(s.states).map(([k,v])=>k.padEnd(14)+v).join('\n')+'\n\n'+s.noises.length+' live sound stimuli\n'+s.sightTests+' sight tests\n'+s.sharedFields+' shared goal fields\n'+s.prepShots+' preparation shots\n\n'+(b?z.type+' #'+z.id+'\n'+b.state+' · '+b.reason+'\nTarget '+b.target+' · visible '+b.seen+'\nMemory '+Math.max(0,b.until-sim19.time).toFixed(1)+'s':'Alt-click an infected to inspect it.');
 if(b){$('devPlan11').textContent=z.type+' #'+z.id+'\n'+b.state.toUpperCase();$('devFacts11').textContent=b.reason+'\nTarget '+b.target+' · seen '+b.seen+'\n'+(b.goal?'Last known '+Math.round(b.goal.x)+', '+Math.round(b.goal.y):'No target')+'\nNo per-agent A*: local steering + shared fields.';}
 return r;
};
const drawDevBefore19=drawDev11;drawDev11=function(){drawDevBefore19();if(!dev11.enabled||!sim19.sensesVisible||netMode==='client')return;
 const at=performance.now(),c=ctx;c.save();
 for(const n of sim19.noises)if(visible(n.x,n.y,n.r)){c.strokeStyle='#e8ba7260';c.lineWidth=1/viewScale;c.setLineDash([5,8]);c.beginPath();c.arc(n.x,n.y,n.r,0,TAU);c.stroke();c.setLineDash([]);}
 for(const z of zombies){if(!visible(z.x,z.y,90)||!z.ai19)continue;const b=z.ai19,col=b.state==='hunt'?'#ed947f':b.state==='investigate'||b.state==='mob'?'#deb86a':'#76aab3';
  c.strokeStyle=col;c.lineWidth=1/viewScale;c.beginPath();c.arc(z.x,z.y,z.r+4,0,TAU);c.stroke();
  if(b.goal&&z===devEntity11())devLine11(c,z,b.goal,col,1.7);
 }
 c.restore();perf8.work[P8I.devDraw]+=performance.now()-at;
};
// No rendering in the hidden host. Only the authoritative fixed-step simulation
// and snapshots continue. rAF remains the sole driver when the tab is visible.
function hiddenHostTick19(){
 const now=performance.now(),old=net19.hiddenAt||now;net19.hiddenAt=now;
 if(!document.hidden||netMode!=='host'||phase!=='play'){net19.hiddenAccum=0;return;}
 const dt=Math.min(.12,Math.max(0,(now-old)/1000));clock+=dt;last=now;updateEffects(dt);
 net19.hiddenAccum=(net19.hiddenAccum||0)+dt;let n=0;
 while(net19.hiddenAccum>=1/60&&n++<8&&phase==='play'){update(1/60);net19.hiddenAccum-=1/60;}
 flushCritical13();perf8.pending=null;
}
function startHostClock19(){
 try{const url=URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),33);'],{type:'text/javascript'}));
  const worker=new Worker(url);URL.revokeObjectURL(url);worker.onmessage=hiddenHostTick19;net19.worker=worker;
 }catch(_){net19.worker=null;setInterval(hiddenHostTick19,50);}
 document.addEventListener('visibilitychange',()=>{net19.hiddenAt=performance.now();net19.hiddenAccum=0;accum=0;last=performance.now();});
}
// Hidden hosts are driven by the timer above, never twice by a background rAF.
const frameBefore19=frame;frame=function(now){
 if(document.hidden&&netMode==='host'){last=now;perf8.pending=null;requestAnimationFrame(frame);return;}
 return frameBefore19(now);
};
installV19UI();startHostClock19();
