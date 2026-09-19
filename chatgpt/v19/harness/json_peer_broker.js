/* TEST ONLY: JSON-serialized Peer-compatible channel over harness signalling.
   Enforces 16KiB messages and bufferedAmount. NOT real WebRTC/NAT validation. */
(()=>{
 class E{constructor(){this.h={};}on(k,f){(this.h[k]??=[]).push(f);return this;}emit(k,...v){for(const f of this.h[k]||[])f(...v);}}
 const peers=new Map(),conns=new Map();let serial=0;const counts={sent:0,received:0,maxMessage:0,connections:0,errors:[]};
 class C extends E{constructor(owner,remote,id,metadata){super();Object.assign(this,{owner,peer:remote,id,metadata,open:false});this.queue=Promise.resolve();this.dataChannel={bufferedAmount:0};conns.set(id,this);}
  send(m){if(!this.open)throw Error('connection not open');const text=JSON.stringify(m),len=new TextEncoder().encode(text).length;counts.maxMessage=Math.max(counts.maxMessage,len);if(len>16384)throw Error('JSON >16KiB: chunking bypassed');this.dataChannel.bufferedAmount+=len;counts.sent++;
   this.queue=this.queue.then(()=>signalQA({type:'message',to:this.peer,id:this.id,from:this.owner,text})).finally(()=>{this.dataChannel.bufferedAmount-=len;});}
  close(){if(!this.open)return;this.open=false;signalQA({type:'close',to:this.peer,id:this.id});this.emit('close');}}
 class Peer extends E{constructor(id){super();this.id=id||'qa-'+Math.random().toString(36).slice(2);this.open=false;this.destroyed=false;peers.set(this.id,this);setTimeout(async()=>{const r=await signalQA({type:'register',id:this.id});if(this.destroyed)return;if(!r.ok)return this.emit('error',{type:'unavailable-id'});this.open=true;this.emit('open',this.id);},1);}
  connect(to,opt){const id=this.id+':'+(++serial),c=new C(this.id,to,id,opt.metadata||{});setTimeout(async()=>{const r=await signalQA({type:'dial',to,from:this.id,id,meta:c.metadata});if(!r.ok)this.emit('error',{type:'peer-unavailable'});},1);return c;}
  destroy(){this.open=false;this.destroyed=true;for(const c of conns.values())if(c.owner===this.id)c.close();signalQA({type:'unregister',id:this.id}).catch(()=>{});peers.delete(this.id);}
  reconnect(){this.open=true;this.emit('open',this.id);}}
 window.Peer=Peer;window.rtcQA={counts,states:()=>[],async receive(m){
  if(m.type==='dial'){const p=peers.get(m.to);if(!p||p.destroyed)return;const c=new C(m.to,m.from,m.id,m.meta);p.emit('connection',c);c.open=true;await signalQA({type:'opened',to:m.from,id:m.id});c.emit('open');counts.connections++;}
  else if(m.type==='opened'){const c=conns.get(m.id);if(c){c.open=true;c.emit('open');counts.connections++;}}
  else if(m.type==='message'){const c=conns.get(m.id);if(c?.open){counts.received++;try{c.emit('data',JSON.parse(m.text));}catch(e){counts.errors.push(e.message);throw e;}}}
  else if(m.type==='close'){const c=conns.get(m.id);if(c?.open){c.open=false;c.emit('close');}}
 }};
})();
