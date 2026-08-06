
(function(){
 var DB_NAME='tcp_sales_tracker_large_v528',DB_VERSION=1,DB_STORE='snapshots';
 var HEAVY_FIELDS=['customers','orders','orderLineItems','orderLineItemsUnmatched','reviews','artErrors','cms','dailySales','coachingNotes','hrViolations'];
 window._tcpStorageMeta=window._tcpStorageMeta||{mode:'initializing',lastSaved:'',lastHydrated:'',cacheError:''};

 function own(o,k){return !!o&&Object.prototype.hasOwnProperty.call(o,k)}
 function arr(v){return Array.isArray(v)?v:[]}
 function setIf(saved,key,fn){if(own(saved,key))fn(saved[key])}
 function countOf(v){if(Array.isArray(v))return v.length;if(v&&typeof v==='object')return Object.keys(v).length;return 0}
 function cloneObject(o){var x={};Object.keys(o||{}).forEach(function(k){x[k]=o[k]});return x}

 function openDb(){
  return new Promise(function(resolve,reject){
   if(typeof indexedDB==='undefined')return reject(new Error('IndexedDB is unavailable'));
   var req=indexedDB.open(DB_NAME,DB_VERSION);
   req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};
   req.onsuccess=function(){resolve(req.result)};
   req.onerror=function(){reject(req.error||new Error('Could not open IndexedDB'))}
  })
 }
 function largePut(key,value){
  return openDb().then(function(db){
   return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readwrite'),store=tx.objectStore(DB_STORE);
    store.put(value,key);
    tx.oncomplete=function(){db.close();resolve(true)};
    tx.onerror=function(){var e=tx.error||new Error('IndexedDB write failed');db.close();reject(e)};
    tx.onabort=function(){var e=tx.error||new Error('IndexedDB write aborted');db.close();reject(e)}
   })
  })
 }
 function largeGet(key){
  return openDb().then(function(db){
   return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readonly'),req=tx.objectStore(DB_STORE).get(key);
    req.onsuccess=function(){var v=req.result;db.close();resolve(v||null)};
    req.onerror=function(){var e=req.error||new Error('IndexedDB read failed');db.close();reject(e)}
   })
  })
 }
 function largeDelete(key){
  return openDb().then(function(db){
   return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete=function(){db.close();resolve(true)};
    tx.onerror=function(){var e=tx.error||new Error('IndexedDB delete failed');db.close();reject(e)}
   })
  })
 }

 function splitState(full){
  var core=cloneObject(full),heavy={},counts={};
  HEAVY_FIELDS.forEach(function(k){
   if(own(core,k)){heavy[k]=core[k];counts[k]=countOf(core[k]);delete core[k]}
  });
  core.__tcpLargeState={
   version:1,
   key:'manager',
   fields:HEAVY_FIELDS.slice(),
   counts:counts,
   updatedAt:new Date().toISOString()
  };
  return{core:core,heavy:heavy}
 }

 function applyState(saved){
  if(!saved||typeof saved!=='object')throw new Error('Invalid tracker state');
  setIf(saved,'reps',function(v){S.reps=arr(v).filter(function(r){return r&&typeof r.name==='string'&&r.name.trim().length>0})});
  setIf(saved,'goals',function(v){S.goals=v||{}});
  setIf(saved,'data',function(v){S.data=v||{}});
  setIf(saved,'cms',function(v){S.cms=arr(v)});
  setIf(saved,'artErrors',function(v){S.artErrors=arr(v)});
  setIf(saved,'artErrorSource',function(v){S.artErrorSource=v||{url:'',lastSync:null,lastCount:0}});
  setIf(saved,'artErrorIgnored',function(v){S.artErrorIgnored=arr(v)});
  setIf(saved,'hrViolations',function(v){S.hrViolations=arr(v).map(function(x){if(x&&x.points!==undefined&&x.pts===undefined)x.pts=x.points;return x})});
  setIf(saved,'coachingNotes',function(v){S.coachingNotes=arr(v)});
  setIf(saved,'dailySales',function(v){S.dailySales=arr(v)});
  setIf(saved,'customers',function(v){S.customers=arr(v)});
  setIf(saved,'reviews',function(v){S.reviews=v||{url:'',rows:[],lastFetched:null,decisions:{},unmatchFix:{}}});
  setIf(saved,'orders',function(v){S.orders=arr(v)});
  setIf(saved,'ordersMeta',function(v){S.ordersMeta=v||{}});
  setIf(saved,'orderLineItems',function(v){S.orderLineItems=arr(v)});
  setIf(saved,'orderLineItemsMeta',function(v){S.orderLineItemsMeta=v||{version:1,imports:[]}});
  setIf(saved,'orderLineItemsUnmatched',function(v){S.orderLineItemsUnmatched=arr(v)});
  setIf(saved,'gamestorm',function(v){S.gamestorm=v||{projects:[],activeId:null}});
  setIf(saved,'priorYear',function(v){S.priorYear=v||{}});
  setIf(saved,'repPortal',function(v){S.repPortal=v||{managerHash:'',accounts:{},sections:['sales','orders','art','credits','reviews','coaching','rank'],enabled:false}});
  setIf(saved,'dailyRep',function(v){S.dailyRep=v||{}});
  setIf(saved,'companyKnowledge',function(v){S.companyKnowledge=v||{categories:{},freeform:'',lastUpdated:null}});
  setIf(saved,'teamGoals',function(v){S.teamGoals=v||{}});
  if(!Array.isArray(S.customers))S.customers=[];
  if(!Array.isArray(S.orders))S.orders=[];
  if(!Array.isArray(S.orderLineItems))S.orderLineItems=[];
  if(!Array.isArray(S.orderLineItemsUnmatched))S.orderLineItemsUnmatched=[];
  if(!S.orderLineItemsMeta)S.orderLineItemsMeta={version:1,imports:[]};
  arr(S.reps).forEach(function(r){if(!r.profile)r.profile={};if(r.retired===undefined)r.retired=false});
  try{if(typeof loadPhotos==='function')loadPhotos()}catch(e){}
  try{window._cw4DirectoryCache=null;window._cw4ProfileCache={}}catch(e){}
  return true
 }

 function currentFullState(){
  if(typeof _liveTrackerStateForCloud==='function')return _liveTrackerStateForCloud();
  return{
   reps:S.reps||[],goals:S.goals||{},data:S.data||{},cms:S.cms||[],artErrors:S.artErrors||[],
   artErrorSource:S.artErrorSource||{url:'',lastSync:null,lastCount:0},artErrorIgnored:S.artErrorIgnored||[],
   hrViolations:S.hrViolations||[],coachingNotes:S.coachingNotes||[],dailySales:S.dailySales||[],
   customers:S.customers||[],reviews:S.reviews||{},orders:S.orders||[],ordersMeta:S.ordersMeta||{},
   orderLineItems:S.orderLineItems||[],orderLineItemsMeta:S.orderLineItemsMeta||{version:1,imports:[]},
   orderLineItemsUnmatched:S.orderLineItemsUnmatched||[],gamestorm:S.gamestorm||{projects:[],activeId:null},
   priorYear:S.priorYear||{},repPortal:S.repPortal||{},dailyRep:S.dailyRep||{},
   companyKnowledge:S.companyKnowledge||{categories:{},freeform:'',lastUpdated:null},teamGoals:S.teamGoals||{}
  }
 }

 function rerenderAfterHydration(){
  try{
   if(typeof popSel==='function')popSel();
   if(typeof renderDash==='function')renderDash();
   if(document.getElementById('cust-page')&&typeof renderCustomersPage==='function')renderCustomersPage();
   if(document.getElementById('ord-page')&&typeof renderOrdersPage==='function')renderOrdersPage();
   var sess=typeof _rpSession==='function'?_rpSession():null;
   if(sess&&sess.role==='rep'&&typeof _rp2Go==='function')_rp2Go((_rp2&&_rp2.page)||'home')
  }catch(e){console.warn('[v528 hydration render]',e)}
 }

 function saveStatus(message,color){
  var el=document.getElementById('saveStatus');if(el){el.textContent=message;el.style.color=color||'#5DCAA5'}
 }

 window.persist=function(){
  var el=document.getElementById('saveStatus');
  try{
   if(typeof _lsAvailable==='function'&&!_lsAvailable()){
    _dataDirty=true;
    if(el){el.innerHTML='⚠️ Storage blocked — use <strong style="color:#EF9F27;">Export JSON</strong> to save.';el.style.color='#EF9F27'}
    return false
   }
   var full=currentFullState(),parts=splitState(full),json=JSON.stringify(parts.core);
   localStorage.setItem(STORE_KEY,json);
   _dataDirty=false;
   window._tcpStorageMeta.mode='core-saved';
   window._tcpStorageMeta.lastSaved=new Date().toISOString();
   saveStatus('Auto-saved core · syncing large data…','#00AFEF');
   window._tcpLargeSavePromise=largePut('manager',parts.heavy).then(function(){
    window._tcpStorageMeta.mode='indexeddb';
    window._tcpStorageMeta.cacheError='';
    saveStatus('Auto-saved ✓','#5DCAA5');
    return true
   }).catch(function(e){
    window._tcpStorageMeta.mode='memory-only';
    window._tcpStorageMeta.cacheError=(e&&e.message)||String(e);
    saveStatus('Core saved · large cache unavailable','#EF9F27');
    console.warn('[v528 IndexedDB save]',e);
    return false
   });
   return true
  }catch(e){
   _dataDirty=true;
   window._tcpStorageMeta.mode='save-failed';
   window._tcpStorageMeta.cacheError=(e&&e.message)||String(e);
   if(el){el.textContent='Save failed — use Export JSON.';el.style.color='#F09595'}
   console.warn('[v528 persist]',e);
   return false
  }
 };

 window.loadFromStorage=function(){
  if(typeof _lsAvailable==='function'&&!_lsAvailable())return false;
  try{
   var raw=localStorage.getItem(STORE_KEY);
   if(!raw)return false;
   var saved=JSON.parse(raw);
   if(!saved||!saved.reps)return false;
   applyState(saved);
   if(saved.__tcpLargeState){
    window._tcpStorageMeta.mode='hydrating';
    window._tcpLargeHydrationPromise=largeGet(saved.__tcpLargeState.key||'manager').then(function(heavy){
     if(heavy){applyState(heavy);window._tcpStorageMeta.mode='indexeddb';window._tcpStorageMeta.lastHydrated=new Date().toISOString();rerenderAfterHydration()}
     else window._tcpStorageMeta.mode='core-only';
     return heavy
    }).catch(function(e){
     window._tcpStorageMeta.mode='core-only';
     window._tcpStorageMeta.cacheError=(e&&e.message)||String(e);
     console.warn('[v528 IndexedDB hydrate]',e);
     return null
    })
   }else{
    window._tcpStorageMeta.mode='legacy-full';
    /* Migrate a successful legacy full snapshot into the split store without blocking startup. */
    try{
     var migrated=splitState(saved);
     localStorage.setItem(STORE_KEY,JSON.stringify(migrated.core));
     window._tcpLargeHydrationPromise=largePut('manager',migrated.heavy).then(function(){window._tcpStorageMeta.mode='indexeddb';return migrated.heavy}).catch(function(){return null})
    }catch(_migrationError){}
   }
   return true
  }catch(e){
   console.warn('Load from storage failed:',e);
   return false
  }
 };

 async function restoreAuxiliaryCloudKeys(data){
  var skipped=[],written=0;
  Object.keys(data||{}).forEach(function(k){
   if(k===STORE_KEY)return;
   try{
    if(typeof _isTrackerKey==='function'&&_isTrackerKey(k)){localStorage.setItem(k,data[k]);written++}
   }catch(e){skipped.push({key:k,error:(e&&e.message)||String(e)})}
  });
  return{written:written,skipped:skipped}
 }

 async function restoreRepCloudSnapshot(data,gistId){
  if(!data||typeof data!=='object')throw new Error('Cloud snapshot is missing tracker keys.');
  var raw=data[STORE_KEY];
  if(!raw)throw new Error('Cloud snapshot is missing '+STORE_KEY+'.');
  var saved=typeof raw==='string'?JSON.parse(raw):raw;
  if(!saved||!saved.reps)throw new Error('Cloud tracker state is invalid.');
  var aux=await restoreAuxiliaryCloudKeys(data);
  applyState(saved);
  window._tcpStorageMeta.mode='rep-memory';
  window._tcpStorageMeta.lastHydrated=new Date().toISOString();
  window._tcpStorageMeta.cloudCounts={
   customers:countOf(saved.customers),orders:countOf(saved.orders),
   lineItems:countOf(saved.orderLineItems),reviews:countOf(saved.reviews&&saved.reviews.rows)
  };
  try{
   await largePut('rep:'+String(gistId||'default'),saved);
   window._tcpStorageMeta.mode='rep-indexeddb';
   window._tcpStorageMeta.cacheError=''
  }catch(e){
   /* Offline cache failure is not a cloud-refresh failure. The live portal is already hydrated. */
   window._tcpStorageMeta.mode='rep-memory';
   window._tcpStorageMeta.cacheError=(e&&e.message)||String(e);
   console.warn('[v528 rep cache]',e)
  }
  return{saved:saved,aux:aux}
 }

 async function loadRepCache(gistId){
  try{
   var saved=await largeGet('rep:'+String(gistId||'default'));
   if(saved&&saved.reps){applyState(saved);window._tcpStorageMeta.mode='rep-cache';window._tcpStorageMeta.lastHydrated=new Date().toISOString();return true}
  }catch(e){console.warn('[v528 rep cache load]',e)}
  return false
 }

 window._rpPullGist=async function(gistId){
  try{
   var resp=await _gistFetch('https://api.github.com/gists/'+gistId,'');
   if(!resp||!resp.ok){
    window._rpCloudMeta={gistId:gistId||'',loadedAt:new Date().toISOString(),ok:false,error:'GitHub API '+(resp&&resp.status||'unavailable')};
    return false
   }
   var data=await resp.json();
   var content=await _readCloudContentFromGist(data);
   content=await _decompressPayload(content);
   var parsed=JSON.parse(content);
   if(!parsed||!parsed.data){
    window._rpCloudMeta={gistId:gistId||'',loadedAt:new Date().toISOString(),ok:false,error:'Invalid cloud payload'};
    return false
   }
   await restoreRepCloudSnapshot(parsed.data,gistId);
   window._rpCloudMeta={
    gistId:gistId||'',exportedAt:parsed.exportedAt||'',loadedAt:new Date().toISOString(),ok:true,error:'',
    weeklyDataCount:Number(parsed.weeklyDataCount)||0,
    latestWeeklyKeys:Array.isArray(parsed.latestWeeklyKeys)?parsed.latestWeeklyKeys:[],
    selectedWeekKey:parsed.selectedWeekKey||'',
    storageMode:window._tcpStorageMeta.mode,
    customerCount:countOf(S.customers),orderCount:countOf(S.orders),lineItemCount:countOf(S.orderLineItems)
   };
   return true
  }catch(e){
   window._rpCloudMeta={gistId:gistId||'',loadedAt:new Date().toISOString(),ok:false,error:(e&&e.message)||String(e)};
   console.warn('[rep portal cloud pull v528]',e);
   return false
  }
 };

 /* Use an IndexedDB snapshot immediately when available, while the network refresh runs. */
 var originalBoot=window._rpBoot;
 window._rpBoot=function(){
  try{
   var gid=typeof _rpUrlGist==='function'?_rpUrlGist():'';
   if(!gid)return originalBoot();
   loadRepCache(gid).then(function(hit){
    if(hit){try{_rpEnsure();_rpApply()}catch(e){}}
   });
   return originalBoot()
  }catch(e){return originalBoot()}
 };

 /* Data Safety: keep the heavy half of the daily snapshot beside the core snapshot. */
 var originalSnapshot=window._dsSnapshot;
 window._dsSnapshot=function(){
  try{
   var today=typeof _dcToday==='function'?_dcToday():new Date().toISOString().slice(0,10);
   var meta=null;try{meta=JSON.parse(localStorage.getItem('tcp_autosnap_meta')||'null')}catch(e){}
   if(meta&&meta.date===today)return;
   var full=currentFullState(),parts=splitState(full),raw=JSON.stringify(parts.core);
   localStorage.setItem('tcp_autosnap',raw);
   localStorage.setItem('tcp_autosnap_meta',JSON.stringify({date:today,bytes:raw.length,taken:new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}),largeKey:'autosnap:'+today}));
   largePut('autosnap:'+today,parts.heavy).catch(function(e){console.warn('[v528 autosnap cache]',e)})
  }catch(e){console.warn('autosnap:',e)}
 };

 window._tcpStorageV528={
  splitState:splitState,
  applyState:applyState,
  currentFullState:currentFullState,
  largePut:largePut,
  largeGet:largeGet,
  largeDelete:largeDelete,
  restoreRep:restoreRepCloudSnapshot,
  loadRepCache:loadRepCache,
  diagnostics:function(){
   return{
    mode:window._tcpStorageMeta.mode,
    cacheError:window._tcpStorageMeta.cacheError,
    localCoreBytes:(function(){try{return(localStorage.getItem(STORE_KEY)||'').length}catch(e){return 0}})(),
    customers:countOf(S&&S.customers),orders:countOf(S&&S.orders),lineItems:countOf(S&&S.orderLineItems),
    unmatched:countOf(S&&S.orderLineItemsUnmatched),reviews:countOf(S&&S.reviews&&S.reviews.rows)
   }
  }
 };

 setTimeout(function(){
  try{
   var top=document.querySelector('#rp-overlay .rp2-top-left');
   if(!top||document.getElementById('tcp-storage-chip'))return;
   var chip=document.createElement('span');chip.id='tcp-storage-chip';chip.className='tcp-storage-chip';
   chip.textContent='Large-data cache · IndexedDB';
   top.appendChild(chip)
  }catch(e){}
 },900)
})();
