const fs=require('fs'),vm=require('vm'),path=require('path');

class MemoryLocalStorage{
  constructor(){this.m=new Map()}
  get length(){return this.m.size}
  key(i){return Array.from(this.m.keys())[i]??null}
  getItem(k){return this.m.has(String(k))?this.m.get(String(k)):null}
  setItem(k,v){this.m.set(String(k),String(v))}
  removeItem(k){this.m.delete(String(k))}
  clear(){this.m.clear()}
}
function makeIndexedDB(){
  const dbs=new Map();
  function ensureDB(name){if(!dbs.has(name))dbs.set(name,{stores:new Map()});return dbs.get(name)}
  return {
    _dbs:dbs,
    open(name,version){
      const req={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null};
      setTimeout(()=>{
        try{
          const raw=ensureDB(name);
          const db={
            objectStoreNames:{contains:n=>raw.stores.has(n)},
            createObjectStore(n){if(!raw.stores.has(n))raw.stores.set(n,new Map());return{}},
            transaction(storeName,mode){
              if(!raw.stores.has(storeName))throw new Error('store missing');
              const map=raw.stores.get(storeName),tx={error:null,oncomplete:null,onerror:null,onabort:null,_pending:0,_done:false};
              let completionScheduled=false;
              function scheduleComplete(){
                if(completionScheduled)return; completionScheduled=true;
                setTimeout(()=>{completionScheduled=false;if(tx._pending===0&&!tx._done){tx._done=true; if(tx.oncomplete)tx.oncomplete()}},0)
              }
              function store(){return{
                get(key){
                  const r={result:undefined,error:null,onsuccess:null,onerror:null};tx._pending++;
                  setTimeout(()=>{try{r.result=map.get(key);if(r.onsuccess)r.onsuccess()}catch(e){r.error=e;if(r.onerror)r.onerror()}finally{tx._pending--;scheduleComplete()}},0);return r
                },
                put(value,key){tx._pending++;setTimeout(()=>{map.set(key,structuredClone(value));tx._pending--;scheduleComplete()},0)},
                delete(key){tx._pending++;setTimeout(()=>{map.delete(key);tx._pending--;scheduleComplete()},0)}
              }}
              const tstore=store();tx.objectStore=()=>tstore;scheduleComplete();return tx
            },
            close(){}
          };
          req.result=db;
          if(raw.stores.size===0&&req.onupgradeneeded)req.onupgradeneeded();
          setTimeout(()=>req.onsuccess&&req.onsuccess(),0);
        }catch(e){req.error=e;if(req.onerror)req.onerror()}
      },0);return req
    }
  }
}

const root=path.resolve(__dirname,'..');
global.window=global;
global.localStorage=new MemoryLocalStorage();
global.indexedDB=makeIndexedDB();
global.document={getElementById(){return null},querySelector(){return null},createElement(){return {style:{},appendChild(){},setAttribute(){},innerHTML:''}}};
global.location={reload(){}};
global.confirm=()=>true;
global.alert=()=>{};
global._gistStatus=()=>{};
global.esc_html=s=>String(s);
global._gistFetch=async()=>({ok:false,status:500,text:async()=>''});
global._readCloudContentFromGist=async()=>'';
global._decompressPayload=async x=>x;
global._dataDirty=false;
global.STORE_KEY='salesTracker_state';
global.GIST_TOKEN_STORE='salesTracker_gistToken';
global.GIST_ID_STORE='salesTracker_gistId';
global.API_KEY_STORE='salesTracker_apiKey';
global.S={reps:[{name:'Alpha'}],goals:{Alpha:{'2026':{Q3:{rev:100000,hrs:40,calls:100,setSize:300}}}},data:{'Alpha|2026_Q3_W1':{revenue:1000,calls:10,acctsCalled:8}},cms:[],artErrors:[],hrViolations:[],coachingNotes:[]};
global.saveToCloud=async()=>true;
global.loadFromCloud=async()=>true;
global.addEventListener=()=>{};
global.dispatchEvent=()=>{};
global.CustomEvent=function(name,opts){this.type=name;this.detail=opts&&opts.detail};

function run(file){vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file})}
run(path.join(root,'assets/js/services/tcp-persistence-engine-v550.js'));

(async()=>{
  const p=global.TCP_PERSISTENT_DATA_V550;
  await p.ready();
  if(!p.isReady())throw new Error('persistence did not become ready');
  const first=await p.saveNow('test-first');
  if(!p.verifyEnvelope(first))throw new Error('first envelope failed verification');
  const firstRevenue=first.state.data['Alpha|2026_Q3_W1'].revenue;
  global.S.data['Alpha|2026_Q3_W1'].revenue=2500;
  global.S.coachingNotes.push({id:1,rep:'Alpha',note:'test'});
  const second=await p.saveNow('test-second');
  if(!p.verifyEnvelope(second))throw new Error('second envelope failed verification');
  const active=await p.loadActive();
  const previous=await p.loadPrevious();
  if(active.data['Alpha|2026_Q3_W1'].revenue!==2500)throw new Error('active record did not preserve latest state');
  if(!previous||previous.data['Alpha|2026_Q3_W1'].revenue!==firstRevenue)throw new Error('previous rollback record missing');
  await p.restoreState(previous,{},'test-rollback');
  if(global.S.data['Alpha|2026_Q3_W1'].revenue!==firstRevenue)throw new Error('rollback did not apply prior state');
  const diag=await p.diagnostics();
  if(!diag.activeValid||!diag.previousValid)throw new Error('diagnostics did not verify snapshots');

  // Load the new canonical data facade over the retained v550 engine.
  global.TCP_RUNTIME_V6183={events:{emit(){}}};
  let cloudSawRevenue=null;
  global.TCP_CLOUD_RELIABILITY_V613={version:'v613',save:async()=>{const snap=await p.loadActive();cloudSawRevenue=snap&&snap.data['Alpha|2026_Q3_W1'].revenue;return true},status:()=>({key:'ready',label:'Ready',sub:'test',problem:false}),credentials:()=>({token:'x',id:'y'}),inFlight:()=>false};
  run(path.join(root,'assets/js/services/tcp-data-v618.3.js'));
  await global.TCP_DATA_V6183.ready();
  global.S.data['Alpha|2026_Q3_W1'].revenue=3333;
  await global.TCP_DATA_V6183.cloudSave(true);
  if(cloudSawRevenue!==3333)throw new Error('cloud save did not wait for verified local persistence first');
  const cert=await global.TCP_DATA_V6183.certify({write:true});
  if(cert.failures!==0)throw new Error('canonical certification returned failures: '+JSON.stringify(cert));
  const app=global.TCP_APP;
  if(!app||app.persistence.engine!=='v550'||app.cloud.engine!=='v613')throw new Error('canonical app data facade not installed');
  global.TCP_DATA_V6183.stopCloudSchedule();
  console.log(JSON.stringify({ok:true,first:first.source,second:second.source,activeValid:diag.activeValid,previousValid:diag.previousValid,certPasses:cert.passes,certWarnings:cert.warnings,cloudSawRevenue,appPersistence:app.persistence.engine,appCloud:app.cloud.engine},null,2));
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
