/* ---------------- V19: a living street, not a frozen shooting gallery ---------------- */
function cleanUpgrades19(v,strict=false){
 if(v==null)return {rifle:false,auto:false};
 if(typeof v!=='object'||Array.isArray(v))throw Error('Invalid weapon carryover.');
 if(strict)for(const k of ['rifle','auto'])if(v[k]!==undefined&&typeof v[k]!=='boolean')throw Error('Invalid weapon upgrade flag.');
 return {rifle:v.rifle===true,auto:v.auto===true};
}
function portPass19(p,x,y,dx,dy,max){
 if(p.type!=='shelterDoor'||!p.solid||p.destroyed||(p.amount||0)>.025)return false;
 const v=p.h>p.w,origin=v?x:y,dir=v?dx:dy,lo=v?p.x:p.y,hi=lo+(v?p.w:p.h);
 if(Math.abs(dir)<1e-7)return false;
 let t0=(lo-origin)/dir,t1=(hi-origin)/dir;if(t0>t1)[t0,t1]=[t1,t0];
 if(t1<0||t0>max)return false;t0=Math.max(0,t0);t1=Math.min(max,t1);
 const side=v?y:x,ds=v?dy:dx,start=v?p.y:p.x,len=v?p.h:p.w;
 const a=side+ds*t0,b=side+ds*t1;
 return Math.min(a,b)>start+len*.23&&Math.max(a,b)<start+len*.77;
}
function purposeRay19(kind,x,y,dx,dy,max){const old=sim19.rayKind;sim19.rayKind=kind;try{return rayWorld(x,y,dx,dy,max);}finally{sim19.rayKind=old;}}
function sightClear19(a,b){const d=dist(a,b);if(d<2)return true;sim19.sightTests++;return purposeRay19('sight',a.x,a.y,(b.x-a.x)/d,(b.y-a.y)/d,d).d>=d-3;}
function bulletRay19(p,sx,sy,dx,dy,max){
 const lead=Math.hypot(sx-p.x,sy-p.y),m=lead?purposeRay19('bullet',p.x,p.y,(sx-p.x)/lead,(sy-p.y)/lead,lead):null;
 if(m&&m.d<lead-.1)return{d:0,obj:m.obj};
 return purposeRay19('bullet',sx,sy,dx,dy,max);
}
function aiRand19(z){const b=z.ai19;b.rng=(Math.imul(b.rng,1664525)+1013904223)>>>0;return b.rng/4294967296;}
function initInfected19(z,mob=!!z.awake){
 if(z.ai19)return z.ai19;
 const b=z.ai19={state:mob?'mob':'idle',reason:mob?'Director pressure':'ambient',seen:false,
  target:-1,goal:null,until:sim19.time+(mob?24:0),nextSense:sim19.time+(z.id%13)*.019,
  nextIdle:sim19.time+.3+((z.id*17)%33)*.1,homeX:z.x,homeY:z.y,goalX:z.x,goalY:z.y,
  lastNoise:0,mob,stuck:0,rng:(worldSeed^Math.imul(z.id,2654435761))>>>0,lastCue:-99};
 z.target=-1;return b;
}
function prepareAmbient19(){
 sim19.fields.clear();sim19.noises.length=0;sim19.time=0;sim19.lastShot=-99;sim19.prepShots=0;
 if(!shelter10)return;
 const d=doorPoint10();
 for(const z of zombies){
  // Keep the initial threshold clear. Move ambient actors farther down the existing
  // road instead of reducing the authored population or teleporting during play.
  if(dist(z,d)<185){
   for(let j=0;j<40;j++){
    const h=fxHash(z.id*97+j*113+worldSeed),r=230+fxHash(z.id+j*239)*300,
     a=(shelter10.north?-Math.PI/2:0)+(h-.5)*2.2,q={x:d.x+Math.cos(a)*r,y:d.y+Math.sin(a)*r};
    if(positionFree(q.x,q.y,z.r+3)&&!inStart10(q,T*.5)){z.x=q.x;z.y=q.y;break;}
   }
  }
  delete z.ai19;initInfected19(z);z.ndx=z.ndy=undefined;
 }
}
function emitNoise19(kind,x,y,r,who=-1){
 if(netMode==='client'||!Number.isFinite(x+y+r)||r<=0)return;
 const now=sim19.time,last=sim19.noises.at(-1);
 if(kind==='gunshot'){sim19.lastShot=now;if(staging10())sim19.prepShots++;}
 // Sustained fire updates one stimulus, rather than making every round another AI query.
 if(last&&last.kind===kind&&last.who===who&&now-last.at<.14&&Math.hypot(last.x-x,last.y-y)<65){last.id=++sim19.noiseId;last.at=now;last.expires=now+2.2;last.x=x;last.y=y;last.r=Math.max(last.r,r);return;}
 const n={id:++sim19.noiseId,kind,x,y,r,who,at:now,expires:now+(kind==='explosion'?4:2.2)};
 sim19.noises.push(n);if(sim19.noises.length>40)sim19.noises.shift();
 if(kind!=='gunshot')event13('world-noise',{kind,x:Math.round(x),y:Math.round(y),radius:r});
}
function observeInfected19(z){
 const b=initInfected19(z),now=sim19.time;b.nextSense=now+(z.awake?.17:.27)+(z.id%5)*.011;
 let best=null,score=Infinity;
 for(const p of players){
  if(p.dead)continue;const d=dist(p,z),range=b.state==='hunt'||b.mob?780:480;
  if(d>range)continue;
  if(!z.awake&&d>105&&Math.cos(wrap(angle(z,p)-z.a))<.12)continue;
  if(!sightClear19(z,p))continue;
  const s=d*(p.down?1.15:1)-(b.target===p.id?60:0);if(s<score){best=p;score=s;}
 }
 if(best){
  if(b.state!=='hunt')sim19.seen++;
  b.state='hunt';b.reason='saw '+best.name;b.seen=true;b.target=z.target=best.id;
  b.goal={x:best.x,y:best.y};b.until=now+6.5;z.awake=true;z.ndx=undefined;return;
 }
 b.seen=false;
 let heard=null,strength=0;
 for(const n of sim19.noises){
  if(n.id<=b.lastNoise||n.expires<now)continue;const d=dist(z,n);if(d>n.r)continue;
  const clear=sightClear19(z,n),reach=n.r*(clear?1:.52);if(d>reach)continue;
  const s=(1-d/reach)+(n.kind==='explosion'?.5:0);if(s>strength){strength=s;heard=n;}
 }
 if(heard){
  b.lastNoise=heard.id;sim19.heard++;b.goal={x:heard.x,y:heard.y};b.reason='heard '+heard.kind;
  b.state='investigate';b.until=now+7;b.target=z.target=-1;z.awake=true;z.ndx=undefined;
 }
 if(b.mob&&now<b.until&&!b.goal){const p=getLeader();if(p)b.goal={x:p.x,y:p.y};}
 if(b.mob&&b.state==='mob'&&now<b.until){const p=getLeader();if(p)b.goal={x:p.x,y:p.y};}
 if(!b.seen&&(b.state==='hunt'||b.state==='investigate'||b.state==='mob')&&now>=b.until){
  b.state='search';b.reason='lost contact';b.until=now+2.5;b.target=z.target=-1;b.mob=false;
  b.nextIdle=now;z.awake=false;z.ndx=z.ndy=undefined;
 }
 if(b.state==='search'&&now>=b.until){b.state='idle';b.reason='quiet again';b.goal=null;b.homeX=z.x;b.homeY=z.y;}
}
function infectedTarget19(z){
 const b=initInfected19(z);
 if(b.seen&&players[b.target]&&!players[b.target].dead)return players[b.target];
 return b.goal;
}
function outsideGoal19(z,target){
 if(shelter10?.door.solid&&!inStart10(z)&&inStart10(target,T*.35)){
  const d=doorPoint10();return{x:d.x+(shelter10.north?0:52),y:d.y+(shelter10.north?-52:0)};
 }
 return target;
}
function steerInfected19(z,target){
 if(target.flight!==undefined)return pathToward(z,target,flow);
 const q=outsideGoal19(z,target),d=dist(z,q);
 if(d<10)return{x:0,y:0};
 if(lineClear(z,q,true))return{x:(q.x-z.x)/d,y:(q.y-z.y)/d};
 const key=Math.floor(q.x/T)+','+Math.floor(q.y/T)+':'+navRevision+':'+sim19.doorRevision;
 let entry=sim19.fields.get(key);
 if(!entry&&sim19.fieldBudget>0){
  sim19.fieldBudget--;const out=new Int16Array(COLS*ROWS);buildFlow(out,[q]);
  entry={out,at:sim19.time};sim19.fields.set(key,entry);sim19.fieldBuilds++;
  if(sim19.fields.size>16)sim19.fields.delete(sim19.fields.keys().next().value);
 }
 if(entry){entry.at=sim19.time;return flowDirection(z,entry.out);}
 return{x:z.ndx||0,y:z.ndy||0};
}
function idleStep19(z,dt){
 const b=z.ai19,now=sim19.time;sim19.ambientSteps++;
 for(const key of ['cool','stun','hit','special'])z[key]=Math.max(key==='special'?-1:0,(z[key]||0)-dt);
 if(now>=b.nextIdle){
  const wander=aiRand19(z)>.35;b.state=b.state==='search'?'search':wander?'wander':'idle';
  const a=aiRand19(z)*TAU,r=38+aiRand19(z)*85;
  const x=z.x+Math.cos(a)*r,y=z.y+Math.sin(a)*r;
  if(wander&&positionFree(x,y,z.r+3)&&lineClear(z,{x,y})&&(!inStart10({x,y},T*.25)||!shelter10?.door.solid)){
   b.goalX=x;b.goalY=y;b.nextIdle=now+3+aiRand19(z)*3;
  }else{b.goalX=z.x;b.goalY=z.y;b.nextIdle=now+1.2+aiRand19(z)*3.4;z.wa=a;}
 }
 let vx=0,vy=0,d=Math.hypot(b.goalX-z.x,b.goalY-z.y);
 if(d>7&&z.stun<=0){const speed=13+(z.id%9);vx=(b.goalX-z.x)/d*speed;vy=(b.goalY-z.y)/d*speed;}
 const hx=Math.floor(z.x/80),hy=Math.floor(z.y/80);
 for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)for(const q of zHash.get(hx+xx+(hy+yy)*100)||[]){
  if(q===z||q.hp<=0)continue;const dx=z.x-q.x,dy=z.y-q.y,ds=dx*dx+dy*dy,rr=z.r+q.r+1;
  if(ds>.1&&ds<rr*rr){const dd=Math.sqrt(ds),f=(rr-dd)/rr*22;vx+=dx/dd*f;vy+=dy/dd*f;}
 }
 const ox=z.x,oy=z.y;moveEntity(z,(vx+(z.kx||0))*dt,(vy+(z.ky||0))*dt);
 z.kx*=Math.exp(-dt*6);z.ky*=Math.exp(-dt*6);
 const moved=Math.hypot(z.x-ox,z.y-oy);z.walk+=moved*.11;
 if(moved>.02)z.a+=wrap(Math.atan2(vy,vx)-z.a)*Math.min(1,dt*3);
 else z.a+=wrap((z.wa||z.a)-z.a)*Math.min(1,dt*.2);
 if(d>7&&moved<.01){b.stuck+=dt;if(b.stuck>.6){b.nextIdle=now;b.stuck=0;}}else b.stuck=0;
 for(const f of firePools)if(fireTouches(f,z.x,z.y,z.r*.5)){z.burning=.16;if((tickNo+z.id)%12===0)hurtZombie(z,19,0,0,0,f.who);}
 z.burning=Math.max(0,(z.burning||0)-dt);
}
function tryBatter19(z,target){
 const d=dist(z,target);if(d<1)return;
 const hit=rayWorld(z.x,z.y,(target.x-z.x)/d,(target.y-z.y)/d,Math.min(d,z.r+35));
 const p=hit.obj;if(!p||!p.solid||p.destroyed)return;
 if(p.type==='door'){damageProp(p,16,z.x,z.y);z.cool=.7;sim19.doorHits++;cue19('wood',z.x,z.y);}
 else if(p.type==='shelterDoor'||p.type==='finalDoor19'){p.hit19=.12;z.cool=1.25;sim19.doorHits++;cue19('metal',z.x,z.y);}
}
function stagingBot19(p){
 // Preparation is live gameplay: rescue/pin response must still work.
 if(players.some(q=>!q.dead&&(q.down||q.pinnedBy>=0)))return botControls(p);
 if(!p.brain)p.brain=makeBrain(p);
 const b=p.brain;
 if(clock>=b.nextThink){senseBot(p);b.nextThink=clock+.27;}
 const enemy=b.visible.filter(z=>z.hp>0&&z.awake).sort((a,b)=>dist(p,a)-dist(p,b))[0];
 const input={mx:0,my:0,a:p.a,w:-1,reload:p.ammo[p.weapon]<weaponStats14(p,p.weapon).clip&&!p.reload};
 if(p.down)return{...input,w:2,shoot:!!enemy,a:enemy?angle(p,enemy):p.a};
 if(enemy&&dist(p,enemy)<weaponStats14(p,p.weapon).range&&sightClear19(p,enemy)){
  input.a=angle(p,enemy);input.shoot=true;input.shove=dist(p,enemy)<95&&lineClear(p,enemy);
  p.intent='Covering';
 }else{input.f=p.hp<95&&p.meds>0;p.intent=input.f?'Healing':'Ready';}
 return input;
}
const spawnBefore19=spawnZombie;spawnZombie=function(...args){const z=spawnBefore19(...args);if(z)initInfected19(z,!!args[3]);return z;};
const hurtZBefore19=hurtZombie;hurtZombie=function(z,...args){
 const alive=z.hp>0,r=hurtZBefore19(z,...args);
 if(alive&&z.hp>0){const b=initInfected19(z),p=players[args[4]];
  b.state='investigate';b.reason='injured';b.seen=false;b.mob=false;b.until=sim19.time+8;
  b.goal=p&&!p.dead?{x:p.x,y:p.y}:{x:z.x+(args[1]||0)*-90,y:z.y+(args[2]||0)*-90};
  b.nextSense=0;z.awake=true;z.ndx=undefined;
 }return r;
};
const stepInfectedBefore19=updateZombie;updateZombie=function(z,dt){
 if(z.hp<=0)return stepInfectedBefore19(z,dt);
 const b=initInfected19(z);
 // A landed lure is a physical world event; it also wakes ambient listeners.
 const bomb=grenades.find(g=>!g.acid&&!g.fire&&g.flight<=0&&dist(z,g)<680&&(z.type==='common'||z.type==='runner'));
 if(bomb){b.state='investigate';b.reason='pipe bomb';b.goal={x:bomb.x,y:bomb.y};b.until=sim19.time+3;z.awake=true;}
 else if(sim19.time>=b.nextSense)observeInfected19(z);
 const wind=z.wind,scream=z.screaming;
 if(['idle','wander','search'].includes(b.state)&&z.victim<0&&!z.lunge&&!z.charge)idleStep19(z,dt);
 else stepInfectedBefore19(z,dt);
 if(z.wind>0&&!wind)cue19(z.type==='brute'?'brute':'leaper',z.x,z.y);
 if(z.screaming>0&&!scream)cue19('screamer',z.x,z.y);
};
const explosionBefore19=explosion;explosion=function(x,y,...args){emitNoise19('explosion',x,y,1150,args[2]);return explosionBefore19(x,y,...args);};
const damagePropBefore19=damageProp;damageProp=function(p,...args){
 if(p.type==='shelterDoor'||p.type==='finalDoor19'){p.hit19=.12;cue19('metal',p.x+p.w/2,p.y+p.h/2);return;}
 const alarm=p.alarm,r=damagePropBefore19(p,...args);if(alarm)emitNoise19('alarm',p.x,p.y,1250);return r;
};
const navBefore19=buildNav;buildNav=function(){sim19.fields.clear();return navBefore19();};
const doorBefore19=toggleDoor14;toggleDoor14=function(d,by){const old=d.open14,r=doorBefore19(d,by);if(old!==d.open14){sim19.doorRevision++;emitNoise19('door',d.x+d.w/2,d.y+d.h/2,180,by?.id);cue19('door',d.x,d.y);}return r;};
const updateBefore19=update;update=function(dt){
 sim19.time+=dt;sim19.fieldBudget=2;
 if(staging10())sim19.stagingSteps++;
 for(let i=sim19.noises.length-1;i>=0;i--)if(sim19.noises[i].expires<sim19.time)sim19.noises.splice(i,1);
 const r=updateBefore19(dt);
 for(const p of props)if(p.hit19>0)p.hit19=Math.max(0,p.hit19-dt);
 if(tickNo%60===0)for(const p of props)if(p.alarming>0)emitNoise19('alarm',p.x,p.y,1250);
 return r;
};

// Preparation suppresses automatic pacing, not consequences. Shooting an alarm
// can still call a forced mob; ordinary gunfire only alerts existing listeners.
function stagingFlow19(){
 const key=worldSeed+':'+selectedMap+':'+navRevision+':'+sim19.doorRevision;
 if(sim19.prepField?.key===key)return sim19.prepField.out;
 const d=doorPoint10(),q=nearestWalkPoint(d.x+(shelter10.north?0:80),d.y+(shelter10.north?-80:0));
 const out=new Int16Array(COLS*ROWS);out.fill(-1);if(q)buildFlow(out,[q]);sim19.prepField={key,out};return out;
}
function updateStagingPressure19(dt){
 if(!director)return;director.spawnClock-=dt;
 if(director.spawnClock>0)return;
 const index=director.pending.findIndex(w=>w.forced);if(index<0)return;
 director.spawnClock=.1;const wave=director.pending[index];wave.age+=.1;
 const type=directorCommon12(wave.left),point=hiddenSpawnPoint(wave.behind,type)||hiddenSpawnPoint(!wave.behind,type);
 if(point){const z=spawnZombie(point.x,point.y,type,true);if(z){wave.left--;metrics.spawned++;}}
 if(wave.left<=0||wave.age>12)director.pending.splice(index,1);
}

const departBefore19=depart10;depart10=function(){
 if(!shelter10||shelter10.departed)return;
 const forced=director?.pending.filter(w=>w.forced)||[];departBefore19();
 if(forced.length){director.pending=forced;director.eventUntil=elapsed+7;}
};
