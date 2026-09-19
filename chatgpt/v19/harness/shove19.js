function shove(p){
 if(!p||p.dead||p.down||p.pinnedBy>=0||p.shove>0)return false;
 p.shove=.65;p.shoveFX=.2;p.heal=0;let hits=0;
 for(const z of queryEnemies11(p.x-146,p.y-146,p.x+146,p.y+146)){
  if(z.hp<=0||dist(z,p)>100+z.r)continue;
  const a=angle(p,z);if(Math.cos(wrap(a-p.a))<.05)continue;
  if(!lineClear(p,z)){sim19.blockedMelee++;continue;}
  const interrupt=(z.type==='brute'&&z.wind>0)||(z.type==='screamer'&&z.screaming>0);
  hurtZombie(z,12,Math.cos(a),Math.sin(a),z.type==='brute'?120:450,p.id);
  z.stun=Math.max(z.stun,z.type==='brute'?.08:.65);hits++;
  if(interrupt&&z.hp>0){z.wind=0;z.charge=0;z.screaming=0;z.stun=Math.max(z.stun,1.05);
   z.special=Math.max(z.special,z.type==='brute'?3.5:5);v14.specialInterrupts++;sim19.interrupts++;
   cue19('interrupt',z.x,z.y);event13('special-interrupt',{type:z.type,slot:p.id});
   if(p.id===localSlot)toast(z.type==='brute'?'Charge interrupted':'Scream interrupted',1.2);
  }
 }
 if(hits&&p.id===localSlot)camera.shake=Math.max(camera.shake,3);
 sfx('shove',p.x,p.y);if(netMode==='host')netEvents.push({type:'shove',who:p.id});return true;
}
