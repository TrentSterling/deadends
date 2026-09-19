/* V19 is a surgical continuation of Tront/Claude's uploaded 18.5.
   Simulation, discovery and rendering stay separate. No art cache gates Play. */
const sim19={time:0,noises:[],noiseId:0,fields:new Map(),fieldBudget:2,doorRevision:0,
  finalDoor:null,lastShot:-99,prepShots:0,sightTests:0,heard:0,seen:0,fieldBuilds:0,
  ambientSteps:0,stagingSteps:0,doorHits:0,blockedMelee:0,interrupts:0,sealsCancelled:0,
  rayKind:'',sensesVisible:false,lastSenseUI:0,events:[],cueUntil:0};
const net19={protocol:19,public:false,publicIndex:0,operation:0,internal:0,discovery:null,
  offers:new Map(),candidates:new Map(),seeking:false,registering:false,cloud:'idle',
  ready:false,awaiting:null,lastReady:0,hostSeen:0,readyPeers:0,deadline:0,heartbeat:0,
  retries:0,rejoins:0,malformed:0,stale:0,chunkBytes:0,wireBytes:0,log:[],cancel:null,
  stream:null,run:null,instance:Math.random().toString(36).slice(2),manual:false,
  reconnectTimer:null,publicTimer:null,lastLobbyUI:0,localOnly:false};
let soundBus19=null;const sound19={buses:null,cues:new Map(),ambientUntil:0};
