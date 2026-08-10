(function(){
 'use strict';

 var DB_NAME='tcp_sales_tracker_persistent';
 var DB_VERSION=1;
 var DB_STORE='records';
 var ACTIVE_KEY='active';
 var PREVIOUS_KEY='previous';
 var STAGING_KEY='staging';
 var AUX_KEY='auxiliary';
 var SCHEMA='tcp-persistent-state-v1';
 var bootStarted=false;
 var ready=false;
 var bootPromise=null;
 var saveTimer=null;
 var pendingState=null;
 var pendingSource='autosave';
 var saveChain=Promise.resolve(true);
 var lastError='';
 var originalSaveToCloud=window.saveToCloud;

 window._tcpPersistentMeta=window._tcpPersistentMeta||{
  version:'v550',
  ready:false,
  mode:'initializing',
  lastSaved:'',
  lastLoaded:'',
  lastError:'',
  source:''
 };

 function own(obj,key){return !!obj&&Object.prototype.hasOwnProperty.call(obj,key)}
 function arr(value){return Array.isArray(value)?value:[]}
 function clean(value){return String(value==null?'':value).trim()}
 function count(value){
  if(Array.isArray(value))return value.length;
  if(value&&typeof value==='object')return Object.keys(value).length;
  return 0
 }
 function clone(value){
  if(value==null||typeof value!=='object')return value;
  if(typeof structuredClone==='function'){
   try{return structuredClone(value)}catch(e){}
  }
  return JSON.parse(JSON.stringify(value))
 }
 function currentState(){
  if(window._tcpStorageV528&&typeof _tcpStorageV528.currentFullState==='function'){
   return _tcpStorageV528.currentFullState()
  }
  if(typeof _liveTrackerStateForCloud==='function')return _liveTrackerStateForCloud();
  return clone(window.S||{})
 }
 function validState(state){
  return !!state&&typeof state==='object'&&Array.isArray(state.reps)
 }
 function stateCounts(state){
  return{
   reps:count(state&&state.reps),
   weekly:count(state&&state.data),
   customers:count(state&&state.customers),
   orders:count(state&&state.orders),
   lineItems:count(state&&state.orderLineItems),
   reviews:count(state&&state.reviews&&state.reviews.rows),
   artErrors:count(state&&state.artErrors),
   coaching:count(state&&state.coachingNotes)
  }
 }
 function fnv1a(text){
  var hash=2166136261;
  for(var i=0;i<text.length;i++){
   hash^=text.charCodeAt(i);
   hash+=(hash<<1)+(hash<<4)+(hash<<7)+(hash<<8)+(hash<<24)
  }
  return('00000000'+(hash>>>0).toString(16)).slice(-8)
 }
 function fingerprint(state){
  var raw=JSON.stringify(state);
  return{hash:fnv1a(raw),bytes:raw.length}
 }
 function envelope(state,source){
  if(!validState(state))throw new Error('Tracker state is invalid.');
  var copy=clone(state),fp=fingerprint(copy);
  return{
   schema:SCHEMA,
   savedAt:new Date().toISOString(),
   source:source||'autosave',
   hash:fp.hash,
   bytes:fp.bytes,
   counts:stateCounts(copy),
   state:copy
  }
 }
 function verifyEnvelope(record){
  if(!record||record.schema!==SCHEMA||!validState(record.state))return false;
  var fp=fingerprint(record.state);
  return fp.hash===record.hash&&fp.bytes===record.bytes
 }
 function openDb(){
  return new Promise(function(resolve,reject){
   if(typeof indexedDB==='undefined')return reject(new Error('IndexedDB is unavailable.'));
   var request=indexedDB.open(DB_NAME,DB_VERSION);
   request.onupgradeneeded=function(){
    var db=request.result;
    if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)
   };
   request.onsuccess=function(){resolve(request.result)};
   request.onerror=function(){reject(request.error||new Error('Could not open persistent database.'))}
  })
 }
 function dbGet(key){
  return openDb().then(function(db){
   return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readonly');
    var request=tx.objectStore(DB_STORE).get(key);
    request.onsuccess=function(){var value=request.result;db.close();resolve(value||null)};
    request.onerror=function(){var error=request.error||new Error('Persistent database read failed.');db.close();reject(error)}
   })
  })
 }
 function dbPut(key,value){
  return openDb().then(function(db){
   return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).put(value,key);
    tx.oncomplete=function(){db.close();resolve(true)};
    tx.onerror=function(){var error=tx.error||new Error('Persistent database write failed.');db.close();reject(error)};
    tx.onabort=function(){var error=tx.error||new Error('Persistent database write was aborted.');db.close();reject(error)}
   })
  })
 }
 function commitStaging(staged,auxiliary){
  return openDb().then(function(db){
   return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readwrite');
    var store=tx.objectStore(DB_STORE);
    var currentRequest=store.get(ACTIVE_KEY);
    currentRequest.onsuccess=function(){
     var current=currentRequest.result;
     if(current&&verifyEnvelope(current))store.put(current,PREVIOUS_KEY);
     store.put(staged,ACTIVE_KEY);
     if(auxiliary)store.put({schema:'tcp-persistent-aux-v1',savedAt:new Date().toISOString(),data:auxiliary},AUX_KEY);
     store.delete(STAGING_KEY)
    };
    currentRequest.onerror=function(){tx.abort()};
    tx.oncomplete=function(){db.close();resolve(true)};
    tx.onerror=function(){var error=tx.error||new Error('Could not activate the verified tracker state.');db.close();reject(error)};
    tx.onabort=function(){var error=tx.error||new Error('Persistent state activation was aborted.');db.close();reject(error)}
   })
  })
 }
 function collectAuxiliary(){
  var data={};
  try{
   for(var i=0;i<localStorage.length;i++){
    var key=localStorage.key(i);
    if(!key||key===STORE_KEY)continue;
    if(typeof _isTrackerKey==='function'&&!_isTrackerKey(key))continue;
    if(key===GIST_TOKEN_STORE||key===GIST_ID_STORE||key===API_KEY_STORE)continue;
    data[key]=localStorage.getItem(key)
   }
  }catch(e){}
  return data
 }
 function applyAuxiliary(data,mode){
  data=data||{};
  var skipped=[];
  Object.keys(data).forEach(function(key){
   if(!key||key===STORE_KEY||key===GIST_TOKEN_STORE||key===GIST_ID_STORE||key===API_KEY_STORE)return;
   try{
    if(mode==='missing'&&localStorage.getItem(key)!=null)return;
    localStorage.setItem(key,data[key])
   }catch(e){skipped.push(key)}
  });
  try{
   Object.keys(data).forEach(function(key){
    if(key.indexOf('salesTracker_photo_')!==0)return;
    var name=key.substring('salesTracker_photo_'.length);
    var rep=arr(S&&S.reps).find(function(row){return row&&row.name===name});
    if(rep){
     rep.profile=rep.profile||{};
     if(!rep.profile.photo)rep.profile.photo=data[key]
    }
   })
  }catch(e){}
  return skipped
 }
 function writeCompatibility(state){
  try{
   if(!window._tcpStorageV528||typeof _tcpStorageV528.splitState!=='function')return Promise.resolve(false);
   var parts=_tcpStorageV528.splitState(state);
   parts.core.__tcpPersistentState={
    schema:SCHEMA,
    database:DB_NAME,
    activeKey:ACTIVE_KEY,
    updatedAt:new Date().toISOString()
   };
   try{
    localStorage.setItem(STORE_KEY,JSON.stringify(parts.core))
   }catch(e){
    /* The persistent database is already committed. A compatibility mirror
       failure must never invalidate the real save. */
    console.warn('[v550 compatibility core]',e)
   }
   if(typeof _tcpStorageV528.largePut==='function'){
    return _tcpStorageV528.largePut('manager',parts.heavy).then(function(){return true}).catch(function(){return false})
   }
  }catch(e){console.warn('[v550 compatibility]',e)}
  return Promise.resolve(false)
 }
 async function stageAndCommit(state,source,auxiliary){
  var staged=envelope(state,source);
  await dbPut(STAGING_KEY,staged);
  var readBack=await dbGet(STAGING_KEY);
  if(!verifyEnvelope(readBack))throw new Error('The staged tracker state did not pass verification.');
  await commitStaging(readBack,auxiliary||collectAuxiliary());
  await writeCompatibility(readBack.state);
  window._tcpPersistentMeta.mode='persistent';
  window._tcpPersistentMeta.lastSaved=readBack.savedAt;
  window._tcpPersistentMeta.source=source||'autosave';
  window._tcpPersistentMeta.lastError='';
  return readBack
 }
 function applyState(state){
  if(!validState(state))throw new Error('Cannot apply an invalid tracker state.');
  if(window._tcpStorageV528&&typeof _tcpStorageV528.applyState==='function'){
   _tcpStorageV528.applyState(state)
  }else{
   Object.keys(state).forEach(function(key){S[key]=state[key]})
  }
 }
 function rerender(){
  try{if(typeof popSel==='function')popSel()}catch(e){}
  try{if(typeof renderDash==='function')renderDash()}catch(e){}
  try{if(typeof renderRL==='function')renderRL()}catch(e){}
  try{if(typeof renderProfiles==='function'&&document.getElementById('pg-profiles'))renderProfiles()}catch(e){}
  try{if(typeof renderLB==='function'&&document.getElementById('pg-lb'))renderLB()}catch(e){}
  try{
   var session=typeof _rpSession==='function'?_rpSession():null;
   if(session&&session.role==='rep'&&typeof _rp2Go==='function')_rp2Go((_rp2&&_rp2.page)||'home')
  }catch(e){}
  try{
   var chip=document.getElementById('tcp-storage-chip');
   if(chip){chip.textContent='Persistent data · IndexedDB';chip.classList.remove('warn')}
  }catch(e){}
 }
 async function legacyState(){
  var core=null;
  try{
   var raw=localStorage.getItem(STORE_KEY);
   if(raw)core=JSON.parse(raw)
  }catch(e){}
  if(core&&validState(core)){
   if(core.__tcpLargeState&&window._tcpStorageV528&&typeof _tcpStorageV528.largeGet==='function'){
    try{
     var heavy=await _tcpStorageV528.largeGet(core.__tcpLargeState.key||'manager');
     return Object.assign({},core,heavy||{})
    }catch(e){}
   }
   var meaningful=['customers','orders','orderLineItems','data','goals','cms','artErrors','coachingNotes'];
   if(meaningful.some(function(key){return own(core,key)}))return core
  }
  if(window._tcpStorageV528&&typeof _tcpStorageV528.largeGet==='function'){
   try{
    var legacyHeavy=await _tcpStorageV528.largeGet('manager');
    if(core&&validState(core)&&legacyHeavy)return Object.assign({},core,legacyHeavy);
    if(legacyHeavy&&validState(legacyHeavy))return legacyHeavy
   }catch(e){}
  }
  return null
 }
 async function loadBestRecord(){
  var active=await dbGet(ACTIVE_KEY);
  if(verifyEnvelope(active))return{record:active,key:ACTIVE_KEY};
  var previous=await dbGet(PREVIOUS_KEY);
  if(verifyEnvelope(previous))return{record:previous,key:PREVIOUS_KEY};
  return null
 }
 async function startBoot(){
  if(bootStarted)return bootPromise;
  bootStarted=true;
  bootPromise=(async function(){
   window._tcpPersistentMeta.mode='loading';
   try{
    var found=await loadBestRecord();
    if(!found){
     var legacy=await legacyState();
     if(legacy&&validState(legacy)){
      var migrated=await stageAndCommit(legacy,'legacy-migration',collectAuxiliary());
      found={record:migrated,key:ACTIVE_KEY}
     }
    }
    if(found&&verifyEnvelope(found.record)){
     applyState(found.record.state);
     var auxRecord=await dbGet(AUX_KEY);
     if(auxRecord&&auxRecord.data)applyAuxiliary(auxRecord.data,'missing');
     window._tcpPersistentMeta.lastLoaded=new Date().toISOString();
     window._tcpPersistentMeta.source=found.record.source||found.key;
     window._tcpPersistentMeta.mode=found.key===PREVIOUS_KEY?'rollback':'persistent';
    }else{
     window._tcpPersistentMeta.mode='new';
    }
    ready=true;
    window._tcpPersistentMeta.ready=true;
    rerender();
    return found&&found.record&&found.record.state||null
   }catch(error){
    lastError=(error&&error.message)||String(error);
    window._tcpPersistentMeta.lastError=lastError;
    window._tcpPersistentMeta.mode='memory';
    ready=true;
    window._tcpPersistentMeta.ready=true;
    console.warn('[v550 boot]',error);
    return null
   }
  })();
  window._tcpPersistentReadyPromise=bootPromise;
  return bootPromise
 }
 function setSaveStatus(message,color){
  var element=document.getElementById('saveStatus');
  if(element){element.textContent=message;element.style.color=color||'#5DCAA5'}
 }
 function flushSave(){
  if(!pendingState)return saveChain;
  var state=pendingState,source=pendingSource;
  pendingState=null;
  saveChain=saveChain.then(function(){
   return stageAndCommit(state,source,collectAuxiliary()).then(function(){
    _dataDirty=false;
    setSaveStatus('Auto-saved ✓','#5DCAA5');
    return true
   })
  }).catch(function(error){
   _dataDirty=true;
   lastError=(error&&error.message)||String(error);
   window._tcpPersistentMeta.lastError=lastError;
   window._tcpPersistentMeta.mode='save-failed';
   setSaveStatus('Save failed — previous data preserved','#F09595');
   console.warn('[v550 save]',error);
   return false
  });
  window._tcpPersistentSavePromise=saveChain;
  return saveChain
 }
 window.persist=function(){
  try{
   if(!ready){
    startBoot();
    setSaveStatus('Loading persistent data…','#00AFEF');
    return true
   }
   pendingState=clone(currentState());
   pendingSource='autosave';
   if(saveTimer)clearTimeout(saveTimer);
   saveTimer=setTimeout(function(){saveTimer=null;flushSave()},280);
   setSaveStatus('Saving…','#00AFEF');
   return true
  }catch(error){
   _dataDirty=true;
   lastError=(error&&error.message)||String(error);
   window._tcpPersistentMeta.lastError=lastError;
   setSaveStatus('Save failed — previous data preserved','#F09595');
   return false
  }
 };
 window.loadFromStorage=function(){
  startBoot();
  return true
 };
 window._restoreTrackerKeys=function(data){
  if(!data||typeof data!=='object')throw new Error('No tracker data found to restore.');
  var raw=data[STORE_KEY];
  if(!raw)throw new Error('Cloud backup is missing '+STORE_KEY+'.');
  var state=typeof raw==='string'?JSON.parse(raw):raw;
  if(!validState(state))throw new Error('Cloud tracker state is invalid.');
  var auxiliary={};
  Object.keys(data).forEach(function(key){
   if(key!==STORE_KEY&&key!==GIST_TOKEN_STORE&&key!==GIST_ID_STORE&&key!==API_KEY_STORE)auxiliary[key]=data[key]
  });
  window._tcpPersistentRestorePromise=stageAndCommit(state,'cloud-restore',auxiliary).then(function(record){
   applyState(record.state);
   applyAuxiliary(auxiliary,'replace');
   rerender();
   return true
  });
  return true
 };
 window.loadFromCloud=async function(){
  var token=clean(((document.getElementById('gistTokenInput')||{}).value||'')).replace(/\s+/g,'');
  var gistId=clean((document.getElementById('gistIdInput')||{}).value||'');
  if(!gistId){_gistStatus('⚠ Enter the Gist ID to load from.','#EF9F27');return}
  if(!confirm('LOAD FROM CLOUD:\n\nThis replaces the active tracker data with the cloud copy. The current local database is retained automatically as the rollback copy.\n\nContinue?'))return;
  var button=document.getElementById('gistLoadBtn');
  if(button){button.disabled=true;button.textContent='Loading...'}
  _gistStatus('Pulling data from the cloud...','#8EDCFA');
  try{
   await startBoot();
   var response=await _gistFetch('https://api.github.com/gists/'+gistId,token);
   if(!response.ok){
    var errorText=await response.text();
    throw new Error('GitHub API '+response.status+': '+errorText.substring(0,200))
   }
   var gist=await response.json();
   var content=await _readCloudContentFromGist(gist);
   content=await _decompressPayload(content);
   var parsed=JSON.parse(content);
   if(!parsed||!parsed.data||parsed.version!=='TCP_Tracker_Backup_v1')throw new Error('Cloud data is not a valid TCP Tracker backup.');
   var raw=parsed.data[STORE_KEY];
   if(!raw)throw new Error('Cloud backup is missing '+STORE_KEY+'.');
   var cloudState=typeof raw==='string'?JSON.parse(raw):raw;
   if(!validState(cloudState))throw new Error('Cloud tracker state is invalid.');
   var auxiliary={};
   Object.keys(parsed.data).forEach(function(key){
    if(key!==STORE_KEY&&key!==GIST_TOKEN_STORE&&key!==API_KEY_STORE)auxiliary[key]=parsed.data[key]
   });
   var committed=await stageAndCommit(cloudState,'cloud-restore',auxiliary);
   applyState(committed.state);
   applyAuxiliary(auxiliary,'replace');
   rerender();
   _gistStatus('✅ Loaded from cloud (saved '+(parsed.exportedAt?new Date(parsed.exportedAt).toLocaleString():'?')+'). Reloading...','#5DCAA5');
   setTimeout(function(){location.reload()},700)
  }catch(error){
   console.error('[v550 cloud load]',error);
   _gistStatus('❌ Load failed: '+esc_html((error&&error.message)||String(error)),'#F09595');
   if(button){button.disabled=false;button.innerHTML='☁️⬆ Load from cloud'}
  }
 };
 window.saveToCloud=async function(){
  await startBoot();
  if(!ready)throw new Error('Persistent data is still loading.');
  return originalSaveToCloud.apply(this,arguments)
 };

 window.TCP_PERSISTENT_DATA_V550={
  version:'v550',
  database:DB_NAME,
  ready:function(){return startBoot()},
  isReady:function(){return ready},
  currentState:currentState,
  verifyEnvelope:verifyEnvelope,
  stageAndCommit:stageAndCommit,
  restoreState:async function(state,auxiliary,source){
   await startBoot();
   var record=await stageAndCommit(state,source||'manual-restore',auxiliary||{});
   applyState(record.state);
   applyAuxiliary(auxiliary||{},'replace');
   rerender();
   return record
  },
  loadActive:async function(){
   var found=await loadBestRecord();
   return found&&found.record&&found.record.state||null
  },
  loadPrevious:async function(){
   var record=await dbGet(PREVIOUS_KEY);
   return verifyEnvelope(record)?record.state:null
  },
  saveNow:async function(source){
   await startBoot();
   var record=await stageAndCommit(currentState(),source||'manual-save',collectAuxiliary());
   setSaveStatus('Auto-saved ✓','#5DCAA5');
   return record
  },
  diagnostics:async function(){
   var active=await dbGet(ACTIVE_KEY),previous=await dbGet(PREVIOUS_KEY),aux=await dbGet(AUX_KEY);
   return{
    ready:ready,
    mode:window._tcpPersistentMeta.mode,
    database:DB_NAME,
    activeValid:verifyEnvelope(active),
    previousValid:verifyEnvelope(previous),
    activeCounts:active&&active.counts||null,
    previousCounts:previous&&previous.counts||null,
    auxiliaryKeys:aux&&aux.data?Object.keys(aux.data).length:0,
    lastSaved:window._tcpPersistentMeta.lastSaved,
    lastLoaded:window._tcpPersistentMeta.lastLoaded,
    lastError:window._tcpPersistentMeta.lastError
   }
  },
  _testPutRecord:dbPut,
  _testGetRecord:dbGet
 };

 startBoot();
})();
