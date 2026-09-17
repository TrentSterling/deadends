/* ========================================================================
   DEAD ENDS v16 — public room.
   PLAY ONLINE joins the always-on public room, or hosts it when nobody is
   there, and starts the run at once so later arrivals drop in mid-chapter.
   Codes and invite links still make private rooms. If the public host
   vanishes, guests find or re-host the room on their own.
   ======================================================================== */
const PUBLIC16='LOBBY';
const lobby16={active:false,attempt:0,timer:0,rehosting:false,joins:0,hosts:0,rehosts:0};
function publicStop16(){lobby16.active=false;lobby16.rehosting=false;clearTimeout(lobby16.timer);}
function publicHostReady16(){if(!lobby16.active||netMode!=='host'||phase!=='menu')return;lobby16.hosts++;netStatus('Public room open. Anyone can drop in, friends can use code '+PUBLIC16+'.\nStarting.');startRun();}
function tryPublic16(mode){if(!lobby16.active)return;clearTimeout(lobby16.timer);lobby16.attempt++;if(lobby16.attempt>8){publicStop16();netStatus('Could not reach the public room. Try again, or host a private game.');$('hostBtn').disabled=false;$('joinBtn').disabled=false;return;}
 if(mode==='join'){$('joinCode').value=PUBLIC16;joinRoom();netStatus('Looking for the public room…');lobby16.timer=setTimeout(()=>{if(lobby16.active&&netMode==='client'&&!netConnected)tryPublic16('host');},7000);}
 else{hostRoom();netStatus('Nobody is hosting. Opening the public room…');}}
function quickPlay16(){if(phase!=='menu'){toast('LEAVE THIS RUN TO CHANGE ROOMS');return;}publicStop16();lobby16.active=true;lobby16.attempt=0;openCoop();tryPublic16('join');}
function rehost16(){if(!lobby16.active||lobby16.rehosting)return;lobby16.rehosting=true;lobby16.rehosts++;$('pauseTitle').textContent='HOST LEFT';$('pauseText').textContent='Finding the next public game…';lobby16.timer=setTimeout(()=>{if(!lobby16.active)return;goMenu();lobby16.active=true;lobby16.rehosting=false;lobby16.attempt=0;openCoop();tryPublic16('join');},700+Math.random()*1100);}

// The public room uses the fixed code. hostRoom picks a random one synchronously, before its first await.
const hostRoomBefore16=hostRoom;hostRoom=function(){const r=hostRoomBefore16();if(lobby16.active){roomCode=PUBLIC16;$('roomCode').textContent=roomCode;}return r;};
// Status strings are the only signal the host/join flows emit. Read them to drive the public room state machine.
const netStatusBefore16=netStatus;netStatus=function(s){const r=netStatusBefore16(s);if(!lobby16.active||lobby16.rehosting)return r;
 if(netMode==='client'&&/^(Room not found|No response from the host|Connection failed|Online connection failed|Online library failed)/.test(s)){lobby16.timer=setTimeout(()=>tryPublic16('host'),250+Math.random()*500);}
 else if(netMode==='host'&&/unavailable-id/.test(s)){lobby16.timer=setTimeout(()=>tryPublic16('join'),900+Math.random()*1200);}
 else if(netMode==='host'&&phase==='menu'&&(/^Online room ready/.test(s)||/timed out|unavailable\.|Online discovery failed/.test(s))){lobby16.timer=setTimeout(publicHostReady16,50);}
 return r;};
const handlePacketBefore16=handlePacket;handlePacket=function(m){const r=handlePacketBefore16(m);if(m?.t==='welcome'&&lobby16.active&&netMode==='client')lobby16.joins++;return r;};
// Public guests never sit on the "host disconnected" screen: they go find the room again.
setInterval(()=>{if(lobby16.active&&!lobby16.rehosting&&netMode==='client'&&phase==='play'&&!netConnected)rehost16();},1000);
// Any manual room action, or leaving to the menu by hand, ends public mode.
for(const id of['hostBtn','joinBtn','disconnectBtn','coopClose','quitBtn','endMenu'])$(id)?.addEventListener('click',()=>{if(!lobby16.rehosting)publicStop16();},true);
const goMenuBefore16=goMenu;goMenu=function(...a){if(!lobby16.rehosting)publicStop16();return goMenuBefore16(...a);};
for(const id of['publicBtn','publicBtn2'])$(id)?.addEventListener('click',quickPlay16);

Object.assign(DEAD_ENDS,{build:'16',quickPlay:quickPlay16,getLobby16:()=>({...lobby16,code:roomCode,netMode,netConnected,phase})});
