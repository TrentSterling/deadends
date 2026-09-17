/* ========================================================================
   DEAD ENDS v15 — co-op polish.
   Invite links actually join. Tactical doors and the safehouse seal are
   replicated to clients. Players get a callsign instead of SURVIVOR.
   ======================================================================== */
const v15={joinedFromLink:false,sealPackets:0,rx:{},rxErrors:[],chunkSeq:0,chunked:0,reassembled:0};
const CHUNK15=8000,chunks15=new Map();
const CALLSIGNS15=['DUKE','NOVA','REX','JUNO','SLIM','TANK','MOSS','VEGA','FINCH','HOLT','BRICK','SAGE','RUDY','LARK','COLE','WREN','PIKE','DASH','ZED','IVY','BEAR','FLINT','ROXY','OTIS','NELL'];

// Clients apply the host's seal state so the red door swings shut for everybody. The notice itself already arrives as a host event.
function applySeal15(s){if(netMode!=='client')return;v15.sealPackets++;const wasClosing=v14.safe.closing;v14.safe.closing=!!s[0];v14.safe.amount=clamp(+s[1]||0,0,1);v14.safe.closer=s[2]??-1;v14.safe.closed=!!s[3];if(v14.safe.closing&&!wasClosing)sfx('gate',SAFE.doorX,SAFE.doorY);}
const makeSnapshotBefore15=makeSnapshot;makeSnapshot=function(clear=true){const m=makeSnapshotBefore15(clear);m.seal=[v14.safe.closing?1:0,+v14.safe.amount.toFixed(3),v14.safe.closer,v14.safe.closed?1:0];return m;};
// Client-side door toggles come only from the host; never let a stale hold re-toggle locally.
const startRunBefore15=startRun;startRun=function(...a){const r=startRunBefore15(...a);if(netMode==='client')resetFinalSafe14();return r;};

// #join=CODE in the URL opens co-op and joins the room. This is what the copied invite link carries.
function joinFromHash15(){const m=/[#&]join=([A-Za-z0-9]{5})(?:&|$)/.exec(location.hash||'');if(!m)return false;const code=m[1].toUpperCase();try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}if(phase!=='menu'){toast('FINISH OR LEAVE THIS RUN TO JOIN ROOM '+code);return false;}v15.joinedFromLink=true;openCoop();$('joinCode').value=code;joinRoom();return true;}
addEventListener('hashchange',()=>{joinFromHash15();});

// Everybody was SURVIVOR. Give first-time players a callsign they can still change.
function assignCallsign15(){const el=$('callsign');if(!el)return;if(cleanName(el.value)!=='SURVIVOR')return;el.value=CALLSIGNS15[Math.floor(Math.random()*CALLSIGNS15.length)];}

// v13 replication ships zombie rows as ArrayBuffers, but the PeerJS connection is opened with JSON
// serialization, which turns them into {} in transit. The client then rejects every state packet and
// stands at spawn forever (BroadcastChannel preserves binary, so local tab tests never saw it).
// Carry the two buffers as base64 over every transport.
function b64enc15(buf){const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s);}
function b64dec15(str){const s=atob(str),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer;}
const encodeStateBefore15=encodeState13;encodeState13=function(m,s,force){const p=encodeStateBefore15(m,s,force);if(p.zdata instanceof ArrayBuffer)p.zdata=b64enc15(p.zdata);if(p.zids instanceof ArrayBuffer)p.zids=b64enc15(p.zids);return p;};
const decodeStateBefore15=decodeState13;decodeState13=function(m){if(m&&typeof m.zdata==='string')m.zdata=b64dec15(m.zdata);if(m&&typeof m.zids==='string')m.zids=b64dec15(m.zids);return decodeStateBefore15(m);};
// A zombie that spawned after the last keyframe has no base row. Treat it as changed instead of throwing out of the host's update.
const sameBytesBefore15=sameBytes13;sameBytes13=function(a,b){return !!a&&!!b&&sameBytesBefore15(a,b);};

// Count what the client receives and keep handler exceptions visible instead of silently dropping a packet.
// PeerJS with JSON serialization drops any message over 16 KB and raises an error the host treats as a
// disconnect. Keyframes run ~26 KB, so split big packets and reassemble them on the far side.
function sendPeer15(c,m){const text=JSON.stringify(m);if(text.length<CHUNK15){c.send(m);return;}const id=++v15.chunkSeq,n=Math.ceil(text.length/CHUNK15);for(let i=0;i<n;i++)c.send({t:'chunk15',id,i,n,d:text.slice(i*CHUNK15,(i+1)*CHUNK15)});v15.chunked++;}
function reassemble15(m){let e=chunks15.get(m.id);if(!e){if(chunks15.size>=8)chunks15.delete(chunks15.keys().next().value);e={parts:new Array(m.n),got:0};chunks15.set(m.id,e);}if(e.parts[m.i]===undefined&&m.i<m.n){e.parts[m.i]=String(m.d);e.got++;}if(e.got<m.n)return null;chunks15.delete(m.id);v15.reassembled++;try{return JSON.parse(e.parts.join(''));}catch(err){v15.rxErrors.push('chunk: '+err.message);return null;}}
const handlePacketBefore15=handlePacket;handlePacket=function(m){if(m&&m.t==='chunk15'){m=reassemble15(m);if(!m)return;}const t=m?.t;v15.rx[t]=(v15.rx[t]||0)+1;try{return handlePacketBefore15(m);}catch(e){v15.rxErrors.push(t+': '+(e&&e.message||e));if(v15.rxErrors.length>20)v15.rxErrors.shift();console.error('DEAD ENDS packet',t,e);throw e;}};
Object.assign(DEAD_ENDS,{build:'15',getNet15:()=>({rx:{...v15.rx},errors:v15.rxErrors.slice(),chunked:v15.chunked,reassembled:v15.reassembled,seq:net13.rxSequence,keySeq:net13.rxKey?.seq??null,stream:net13.rxKey?.stream??null,needKey:net13.needKey,resyncs:net13.resyncs,deltas:net13.deltas,keyframes:net13.keyframes,inMessages:net13.inMessages,outMessages:net13.messages,epoch:net13.epoch,peers:[...net13.peers.keys()]}),joinFromHash:joinFromHash15,assignCallsign:assignCallsign15,getV15:()=>({...v15,callsign:$('callsign')?.value,seal:{...v14.safe}})});
DEAD_ENDS.ready.then(()=>{assignCallsign15();joinFromHash15();});
