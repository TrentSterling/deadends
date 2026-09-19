from pathlib import Path
import re,hashlib,json
W=Path('/mnt/data/dead_ends_v19_work'); src=(W/'baseline_v18_5.html').read_text(); edits=[]
def replace(old,new,label,count=1):
 global src
 n=src.count(old)
 if n!=count: raise Exception(f'{label}: expected {count}, got {n}')
 src=src.replace(old,new);edits.append({'label':label,'occurrences':n})
def region(start,end,new,label):
 global src
 a=src.index(start);b=src.index(end,a)
 src=src[:a]+new+'\n'+src[b:];edits.append({'label':label,'removed_chars':b-a})
replace("(() => {\n// V13", "(() => {\n"+(W/'state19.js').read_text()+"\n// V13",'v19 state declared before callbacks')
# Staging becomes full simulation with scheduled pacing withheld, not a frozen world.
replace('elapsed+=dt;tickNo++;botTalkTimer-=dt;flowTimer-=dt;','if(!staging10())elapsed+=dt;tickNo++;botTalkTimer-=dt;flowTimer-=dt;', 'keep campaign clock separate from staging')
region('const updateBefore10=update;update=function(dt){','const spawnBefore10=spawnZombie;', '''const updateBefore10=update;update=function(dt){
 updateDoor10(dt); if(staging10())shelter10.waitTime+=dt;
 return updateBefore10(dt);
};''','simulate full world in preparation')
replace('shoot:primary&&eq<3&&!gear10.blocked&&!staging10()', 'shoot:primary&&eq<3&&!gear10.blocked', 'client can fire during preparation')
replace('if(staging10()){i.shoot=i.g=i.c=i.shove=false;}','', 'allow equipment during preparation')
replace('const hurtBefore10=hurtPlayer;hurtPlayer=function(p,...args){if(staging10()&&inStart10(p,T*.5))return;return hurtBefore10(p,...args);};','const hurtBefore10=hurtPlayer;hurtPlayer=function(p,...args){return hurtBefore10(p,...args);};','walls protect, not staging immunity')
replace("if(!director)resetDirector();const leader=getLeader();if(!leader)return;", "if(!director)resetDirector();const leader=getLeader();if(!leader)return;\n if(staging10()){updateStagingPressure19(dt);if(players.every(p=>p.dead||p.down))finishRun(false);return;}", 'scheduled director waits for departure')
replace("||flow[cellId]<0||inSafe(point)","||(staging10()?stagingFlow19():flow)[cellId]<0||inSafe(point)",'alarm hordes use the reachable exterior while the starting door is closed')
# initial ambient distribution: relocate rather than delete the doorway crowd
replace('populate();buildFlow(flow,players);', 'populate();prepareAmbient19();buildFlow(flow,players);','initialize awareness after population')
replace('for(const z of zombies)if(!z.awake&&dist(z,p)<780)z.awake=true;', "emitNoise19('gunshot',p.x+Math.cos(p.a)*30,p.y+Math.sin(p.a)*30,wi===2?490:wi===1?790:650,p.id);", 'replace omniscient gunshot wake-up with hearing')
replace('const wall=rayWorld(sx,sy,vx,vy,w.range);let max=wall.d,hits=[];', 'const wall=bulletRay19(p,sx,sy,vx,vy,w.range);let max=wall.d,hits=[];', 'bullets and firing port geometry')
replace('let wi=p.down?2:p.weapon,w=WEAPONS[wi],dx=', 'let wi=p.down?2:p.weapon,w=weaponStats14(p,wi),dx=', 'predict upgraded weapons with correct cadence')
replace('d=rayWorld(sx,sy,vx,vy,w.range).d;for(const z of zombies)', 'd=bulletRay19(p,sx,sy,vx,vy,w.range).d;for(const z of zombies)', 'predict port shot geometry')
# use actual perception target, not nearest survivor anywhere through buildings
old='let target=players[z.target];if(!target||target.dead||tickNo%12===z.id%12){let best=Infinity;for(const p of players){if(p.dead||inSafe(p))continue;let d=dist(z,p)*(p.down?1.1:1);if(d<best){best=d;target=p}}if(target)z.target=target.id}if(!target)return;'
replace(old,'let target=infectedTarget19(z);if(!target)return;','use acquired targets and last-known positions')
replace('if(!z.awake&&d<440)z.awake=true;', '// Awareness is acquired by sight, sound, injury or a Director mob, not proximity through walls.','remove through-wall proximity waking')
replace('let dir=pathToward(z,target,flow);z.ndx=dir.x;z.ndy=dir.y','let dir=steerInfected19(z,target);z.ndx=dir.x;z.ndy=dir.y','reuse goal flowfields for investigators')
replace("if(z.awake&&moved<.2&&d>60&&z.cool<=0){for(const p of props)if(p.type==='door'&&!p.destroyed&&circleRect(z.x,z.y,z.r+12,p)){damageProp(p,16,z.x,z.y);z.cool=.65;break}}", "if(z.awake&&moved<.35&&d>35&&z.cool<=0)tryBatter19(z,target);",'only attack a door actually blocking a known goal')
replace("if(!lure&&d<z.r+(target.r||16)+13&&z.cool<=0&&z.stun<=0&&!inSafe(target))", "if(!lure&&Number.isInteger(target.id)&&players[target.id]===target&&d<z.r+(target.r||16)+13&&z.cool<=0&&z.stun<=0&&!inSafe(target)&&lineClear(z,target))",'no melee against remembered points or through walls')
replace("if(!p.dead&&!inSafe(p)&&dist(z,p)<z.r+p.r+8)","if(!p.dead&&!inSafe(p)&&dist(z,p)<z.r+p.r+8&&lineClear(z,p))",'brute does not hit through doors')
replace("&&dist(z,p)<z.r+p.r+12){z.victim", "&&dist(z,p)<z.r+p.r+12&&lineClear(z,p)){z.victim",'leaper cannot pin through doors')
replace("if(p&&dist(z,p)<165){const a=angle(p,z);","if(p&&z.ai19?.seen&&dist(z,p)<165){const a=angle(p,z);",'spitter retreat requires perceived survivor')
replace("else if(p&&dist(z,p)<470&&lineClear(z,p)&&z.special<0)","else if(p&&dist(z,p)<470&&sightClear19(z,p)&&z.special<0)",'a screamer can call when it sees a survivor through the bars')
# vision for bot gunfire can use port, not explosives/melee
replace('if(z.hp<=0||dist(p,z)>760||!lineClear(p,z))continue;b.visible.push(z);', 'if(z.hp<=0||dist(p,z)>760||!sightClear19(p,z))continue;b.visible.push(z);','bot visibility uses explicit sight rays')
replace('for(const z of b.visible){const d=dist(p,z),q=players[z.target]',"for(const z of b.visible){if(!z.awake&&!autoPilot&&!preview8.stepping&&dist(p,z)>220&&squadPing?.targetId!==z.id)continue;const d=dist(p,z),q=players[z.target]",'bots do not start every distant ambient fight')
replace('input.shoot=input.shoot||lineClear(p,enemy)&&dist(p,enemy)<WEAPONS[p.weapon].range;', 'input.shoot=input.shoot||sightClear19(p,enemy)&&dist(p,enemy)<weaponStats14(p,p.weapon).range;','bots can support through firing ports')
# leave old auto pilot staged movement, add smart cover in staging for human-led bots
replace(" if(bot&&staging10()){\n  p.intent", "  if(bot&&staging10()&&!(autoPilot&&p.id===localSlot))return stagingBot19(p);\n if(bot&&staging10()){\n  p.intent", 'staging bots heal, cover, do not leave')
# downed survivor in doorway must not be crushed
replace("!p.dead&&p.hp>0&&p.x>d.x-p.r-6", "!p.dead&&(p.hp>0||p.down)&&p.x>d.x-p.r-6",'downed body blocks closing starting door')
# A real valid shove gates every special interrupt.
region('function shove(p){if(p.dead||p.down||p.shove>0)', 'function throwBomb(p,tx,ty)', (W/'shove19.js').read_text(),'replace shove narrowphase')
region('const shoveBefore14=shove;shove=function(p){', 'const drawZombieBefore14=drawZombie;', 'const shoveBefore14=shove; // v19: interrupts are part of a valid shove, not a post-cooldown wrapper.', 'remove cooldown-bypass wrapper')
# weapon persistence, refill and portable save migration
replace('p.weapon=old.weapon===2?0:old.weapon;', 'p.weapon=old.weapon===2?0:old.weapon;p.upgrade14=cleanUpgrades19(old.upgrade14);p.ammo=[weaponStats14(p,0).clip,weaponStats14(p,1).clip,15];p.reserves[0]=p.upgrade14.rifle?98:180;','carry found weapons between chapters')
replace('for(const p of players)p.upgrade14={};','for(const p of players)p.upgrade14=cleanUpgrades19(p.upgrade14);','do not erase carry after start')
replace('weapon:p.weapon,dead:!!p.dead};});','weapon:p.weapon,dead:!!p.dead,upgrade14:cleanUpgrades19(p.upgrade14,true)};});', 'validate optional upgrade flags in old and new saves')
# both obsolete and current writer include optional flags for exact compatibility
replace('molotovs:p.molotovs,weapon:p.weapon}))','molotovs:p.molotovs,weapon:p.weapon,upgrade14:cleanUpgrades19(p.upgrade14)}))','checkpoint writer includes weapons',count=2)
replace("return{format:'dead-ends-save',schema:2,build:13,data", "return{format:'dead-ends-save',schema:2,build:19,data",'identify save build')
replace("if(p.reserves[0]>=240&&p.reserves[1]>=56)return;p.reserves[0]=240;p.reserves[1]=56;p.ammo=[30,8,15];p.reload=0;", "const cap=p.upgrade14?.rifle?140:240;if(p.reserves[0]>=cap&&p.reserves[1]>=56&&p.ammo[0]>=weaponStats14(p,0).clip&&p.ammo[1]>=weaponStats14(p,1).clip)return;p.reserves[0]=cap;p.reserves[1]=56;p.ammo=[weaponStats14(p,0).clip,weaponStats14(p,1).clip,15];p.reload=0;",'ammo rack respects heavy-rifle magazine')
# Keep Claude's door field/base64/chunk transport. Switch namespace intentionally.
replace('dead-ends-coop-v16','dead-ends-coop-v19','separate new simulation namespace')
replace('deadends-v16-','deadends-v19-','separate PeerJS namespace',count=2)
# Starting/ending barrier perception and physical gun ports use same ray walker.
replace("if(p.destroyed||!p.solid||(ignoreDoors&&p.type==='door'))continue;perf6.propTests++;", "if(p.destroyed||!p.solid||(ignoreDoors&&p.type==='door'))continue;if(sim19.rayKind&&portPass19(p,x,y,dx,dy,stop))continue;perf6.propTests++;", 'barred aperture ray handling')
# physical ending door replaces double-rendered decorative doors, no teleporting the player
region(' // The shelter has one recognizable, physically narrow entrance.', ' // Flashlight under actors:', " // Physical destination door is rendered by drawProp, with a wall-mounted exit lamp.\n drawSafeBeacon19();",'destination doorway single renderer')
region('const drawWorldBefore14=drawWorld;drawWorld=function(){','const nearestActionBefore14=nearestAction;', 'const drawWorldBefore14=drawWorld;', 'remove second decorative final door')
# network wrapper code is extended below; replace the fragile status-string public automaton only.
region('/* ========================================================================\n   DEAD ENDS v16 — public room.', "Object.assign(DEAD_ENDS,{build:'18'});buildCredit111.textContent='Build 18 · Readable by design';$('menu').dataset.build='18';", '', 'replace public room state machine, retain Claude wire fixes')
# Scripted credit remains as in uploaded source; all runtime v19 changes come after it.
# Audio buses are shared panners; noise/tone voices connect synchronously.
replace('g.connect(audio.master);','g.connect(soundBus19||audio.master);','shared positional audio bus',count=5)
# Idle infected have lowered, swaying arms. Cache keys distinguish active and idle.
replace("+':'+(z.hit>0?1:0);let spr=art5.actors.get(key);", "+':'+(z.hit>0?1:0)+':'+(z.awake?1:0);let spr=art5.actors.get(key);",'cache idle poses separately',count=2)
replace("const hx=leap?15:brute?12:14+asym,hy=side*(leap?16:brute?13:9)+st*side*2;", "const hx=!z.awake?-5+st:leap?15:brute?12:14+asym,hy=side*(!z.awake?14:leap?16:brute?13:9)+st*side*2;",'lower idle arms',count=2)
needle="goMenu();const joinHash=location.hash.match(/^#join=([A-Z0-9]{5})$/i);if(joinHash){$('joinCode').value=joinHash[1].toUpperCase();openCoop();}requestAnimationFrame(frame);"
block='\n'.join((W/f).read_text() for f in ['simulation19.js','readiness19.js','network19.js','presentation19.js','qa_api19.js'])
replace(needle,block+"\n\ngoMenu();requestAnimationFrame(frame);",'install v19 before startup')
Path('/mnt/data/dead_ends_v19.html').write_text(src)
(W/'edits.json').write_text(json.dumps({'baseline_sha256':hashlib.sha256((W/'baseline_v18_5.html').read_bytes()).hexdigest(),'edits':edits},indent=2))
(W/'shipping.js').write_text(src[src.rfind('<script>')+8:src.rfind('</script>')])
print('Build:',len(src),'characters;',len(edits),'checked edits')
