
(function(){
 'use strict';
 var VERSION='v615';
 var SAFETY_DB='tcp_sales_tracker_full_state_safety';
 var SAFETY_DB_VERSION=1;
 var SNAP_STORE='snapshots';
 var META_STORE='meta';
 var MAX_SNAPSHOTS=5;
 var MIRROR_KEY='_tcp_v615_critical_mirror';
 var TOMBSTONE_KEY='_tcp_v615_tombstones';
 var CLEAR_AUTH_KEY='_tcp_v615_clear_authorizations';
 var CLOUD_VERIFY_KEY='_tcp_v615_cloud_verified';
 var persistent=window.TCP_PERSISTENT_DATA_V550||null;
 var durable=window.TCP_DURABLE_AUTOSAVE_V614||null;
 var baseCapture=durable&&typeof durable.captureFullState==='function'?durable.captureFullState.bind(durable):function(){return clone(window.S||{})};
 var basePersistentSave=persistent&&typeof persistent.saveNow==='function'?persistent.saveNow.bind(persistent):null;
 var baseMarkDirty=typeof window.markDirty==='function'?window.markDirty:null;
 var baseLoadCloud=typeof window.loadFromCloud==='function'?window.loadFromCloud:null;
 var baseSaveCloud=typeof window.saveToCloud==='function'?window.saveToCloud:null;
 var baseImportData=typeof window.importData==='function'?window.importData:null;
 var baseDeleteCM=typeof window.deleteCM==='function'?window.deleteCM:null;
 var baseDeleteAE=typeof window.deleteAE==='function'?window.deleteAE:null;
 var baseDeleteHR=typeof window.deleteHR==='function'?window.deleteHR:null;
 var baseDeleteCN=typeof window.deleteCN==='function'?window.deleteCN:null;
 var baseDeleteDaily=typeof window.deleteDailyEntry==='function'?window.deleteDailyEntry:null;
 var baseClearDaily=typeof window.clearDailyLog==='function'?window.clearDailyLog:null;
 var saveQueue=Promise.resolve(true);
 var baselinePool=[];
 var latestGood=null;
 var safetyReady=null;
 var inProtectedSave=false;
 var pendingRepairSave=false;
 var verifyTimer=null;
 var lastCloudVerifyAttempt=0;
 var uiState={ready:false,lastSnapshot:'',snapshotCount:0,lastRepair:'',repairCount:0,lastError:'',cloudVerified:'',cloudError:''};

 var MERGE_ARRAYS=[
  'cms','artErrors','hrViolations','coachingNotes','dailySales',
  'activities','crmActivities','customerActivities','accountActivities',
  'contacts','crmContacts','customerContacts','accountContacts',
  'quotes','crmQuotes','customerQuotes','opportunities','crmOpportunities','accountOpportunities',
  'documents','files'
 ];
 var MERGE_MAPS=['dailyRep','dailyCalls','dailyLiveBridge','dailyLiveReconciliation'];
 var ZERO_GUARD=['reps','goals','data','cms','artErrors','hrViolations','coachingNotes','dailySales','dailyRep','dailyCalls','dailyLiveBridge','dailyLiveReconciliation','customers','orders','orderLineItems','reviews','repPortal','activities','contacts','quotes','opportunities','documents'];
 var CRITICAL_MIRROR_FIELDS=MERGE_ARRAYS.concat(MERGE_MAPS).concat(['data','goals','repPortal']);

 function own(obj,key){return !!obj&&Object.prototype.hasOwnProperty.call(obj,key)}
 function clean(value){return String(value==null?'':value).trim()}
 function clone(value){
  if(value==null||typeof value!=='object')return value;
  if(typeof structuredClone==='function'){try{return structuredClone(value)}catch(e){}}
  try{return JSON.parse(JSON.stringify(value))}catch(e){return value}
 }
 function nativeSet(key,value){
  try{var setter=typeof window._originalSetItem==='function'?window._originalSetItem:Storage.prototype.setItem.bind(localStorage);setter(key,value);return true}catch(e){return false}
 }
 function parseLocal(key,fallback){try{var raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(e){return fallback}}
 function nowISO(){return new Date().toISOString()}
 function count(value){if(Array.isArray(value))return value.length;if(value&&typeof value==='object')return Object.keys(value).length;return 0}
 function meaningful(value){return count(value)>0||(['string','number','boolean'].indexOf(typeof value)>=0&&String(value)!=='')}
 function fnv(text){var hash=2166136261;for(var i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash+=(hash<<1)+(hash<<4)+(hash<<7)+(hash<<8)+(hash<<24)}return('00000000'+(hash>>>0).toString(16)).slice(-8)}
 function fingerprint(state){var raw='';try{raw=JSON.stringify(state)}catch(e){raw=String(state)}return{hash:fnv(raw),bytes:raw.length}}
 function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
 function recordIdentity(field,row,index){
  if(row==null)return field+':null:'+index;
  if(typeof row!=='object')return field+':value:'+String(row);
  if(row.id!=null&&String(row.id)!=='')return field+':id:'+String(row.id);
  if(row.key!=null&&String(row.key)!=='')return field+':key:'+String(row.key);
  if(field==='dailySales'&&row.date)return field+':date:'+String(row.date);
  if(field==='cms')return field+':'+[row.soNum||row.so||'',row.invNum||'',row.amount||0,row.date||'',row.rep||''].join('|');
  if(field==='artErrors')return field+':'+[row.so||row.soNum||'',row.type||row.issueType||'',row.date||'',row.rep||''].join('|');
  var stable={};Object.keys(row).sort().slice(0,18).forEach(function(k){if(k!=='photo'&&k!=='profile')stable[k]=row[k]});
  var raw='';try{raw=JSON.stringify(stable)}catch(e){raw=String(index)}
  return field+':hash:'+fnv(raw)
 }
 function tombstones(){
  var data=parseLocal(TOMBSTONE_KEY,{version:1,fields:{}})||{version:1,fields:{}};
  if(!data.fields)data.fields={};
  var cutoff=Date.now()-180*86400000;
  Object.keys(data.fields).forEach(function(field){Object.keys(data.fields[field]||{}).forEach(function(id){if(Number(data.fields[field][id])<cutoff)delete data.fields[field][id]})});
  nativeSet(TOMBSTONE_KEY,JSON.stringify(data));
  return data
 }
 function addTombstone(field,id){
  var data=tombstones();if(!data.fields[field])data.fields[field]={};data.fields[field][String(id)]=Date.now();nativeSet(TOMBSTONE_KEY,JSON.stringify(data))
 }
 function isTombstoned(field,id,data){return !!(data&&data.fields&&data.fields[field]&&data.fields[field][String(id)])}
 function authorizeClear(field,minutes){var data=parseLocal(CLEAR_AUTH_KEY,{})||{};data[field||'*']=Date.now()+Math.max(1,Number(minutes)||10)*60000;nativeSet(CLEAR_AUTH_KEY,JSON.stringify(data))}
 function clearAuthorized(field){var data=parseLocal(CLEAR_AUTH_KEY,{})||{},now=Date.now(),allowed=(Number(data['*'])||0)>now||(Number(data[field])||0)>now;Object.keys(data).forEach(function(k){if(Number(data[k])<=now)delete data[k]});nativeSet(CLEAR_AUTH_KEY,JSON.stringify(data));return allowed}
 function readMirror(){var record=parseLocal(MIRROR_KEY,null);return record&&record.state&&typeof record.state==='object'?record.state:null}
 function writeMirror(state,source){
  var mirror={};CRITICAL_MIRROR_FIELDS.forEach(function(field){if(own(state,field))mirror[field]=clone(state[field])});
  var record={version:VERSION,savedAt:nowISO(),source:source||'autosave',counts:{},state:mirror};
  Object.keys(mirror).forEach(function(field){record.counts[field]=count(mirror[field])});
  var raw=JSON.stringify(record);
  if(raw.length>3900000){
   var priority=['cms','artErrors','hrViolations','coachingNotes','dailySales','dailyRep','dailyCalls','dailyLiveBridge','dailyLiveReconciliation'];
   mirror={};priority.forEach(function(field){if(own(state,field))mirror[field]=clone(state[field])});record.state=mirror;record.counts={};Object.keys(mirror).forEach(function(field){record.counts[field]=count(mirror[field])});raw=JSON.stringify(record)
  }
  nativeSet(MIRROR_KEY,raw);return record
 }
 function rawCapture(){var state={};try{state=baseCapture()||{}}catch(e){state=clone(window.S||{})||{}}return clone(state)||{}}
 function captureAuxiliary(){
  var data={};try{for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(!key||key===(typeof STORE_KEY!=='undefined'?STORE_KEY:'salesTracker_v2')||key===MIRROR_KEY||key===TOMBSTONE_KEY||key===CLEAR_AUTH_KEY||key===CLOUD_VERIFY_KEY)continue;if(typeof _isTrackerKey==='function'&&!_isTrackerKey(key))continue;if(typeof GIST_TOKEN_STORE!=='undefined'&&key===GIST_TOKEN_STORE)continue;if(typeof GIST_ID_STORE!=='undefined'&&key===GIST_ID_STORE)continue;if(typeof API_KEY_STORE!=='undefined'&&key===API_KEY_STORE)continue;data[key]=localStorage.getItem(key)}}catch(e){}return data
 }
 function sourceValues(field,current){var values=[];[current].concat(baselinePool).forEach(function(source){if(source&&own(source,field))values.push(source[field])});return values}
 function bestValue(values){var best=null,bestScore=-1;values.forEach(function(value){var score=count(value);if(score>bestScore){bestScore=score;best=value}});return clone(best)}
 function mergeArrayField(field,current,sources,tombs){
  var out=Array.isArray(current)?clone(current):[],seen={};
  out.forEach(function(row,index){seen[recordIdentity(field,row,index)]=true});
  var added=0;
  sources.forEach(function(value){(Array.isArray(value)?value:[]).forEach(function(row,index){var id=recordIdentity(field,row,index);if(!seen[id]&&!isTombstoned(field,id,tombs)){seen[id]=true;out.push(clone(row));added++}})});
  return{value:out,added:added}
 }
 function mergeMapField(field,current,sources,tombs){
  var out=current&&typeof current==='object'&&!Array.isArray(current)?clone(current):{},added=0;
  sources.forEach(function(value){if(!value||typeof value!=='object'||Array.isArray(value))return;Object.keys(value).forEach(function(key){
   var id=field+':key:'+key;if(isTombstoned(field,id,tombs))return;
   if(!own(out,key)){out[key]=clone(value[key]);added++;return}
   if(out[key]&&typeof out[key]==='object'&&!Array.isArray(out[key])&&value[key]&&typeof value[key]==='object'&&!Array.isArray(value[key])){
    Object.keys(value[key]).forEach(function(child){var childId=id+':'+child;if(!own(out[key],child)&&!isTombstoned(field,childId,tombs)){out[key][child]=clone(value[key][child]);added++}})
   }
  })});
  return{value:out,added:added}
 }
 function reconcile(current){
  current=clone(current||{});var repaired=clone(current),changes=[],tombs=tombstones();
  MERGE_ARRAYS.forEach(function(field){
   if(clearAuthorized(field))return;
   var values=sourceValues(field,current),merged=mergeArrayField(field,current[field],values,tombs);
   if(merged.added){repaired[field]=merged.value;changes.push({field:field,added:merged.added,kind:'records'})}
  });
  MERGE_MAPS.forEach(function(field){
   if(clearAuthorized(field))return;
   var values=sourceValues(field,current),merged=mergeMapField(field,current[field],values,tombs);
   if(merged.added){repaired[field]=merged.value;changes.push({field:field,added:merged.added,kind:'values'})}
  });
  ZERO_GUARD.forEach(function(field){
   if(clearAuthorized(field)||meaningful(repaired[field]))return;
   var best=bestValue(sourceValues(field,current));
   if(meaningful(best)){repaired[field]=best;changes.push({field:field,added:count(best),kind:'whole field'})}
  });
  return{state:repaired,changes:changes,changed:changes.length>0}
 }
 function applyRepaired(result){
  if(!result||!result.changed||!window.S)return false;
  result.changes.forEach(function(change){S[change.field]=clone(result.state[change.field])});
  uiState.lastRepair=nowISO();uiState.repairCount=result.changes.reduce(function(sum,row){return sum+(Number(row.added)||0)},0);
  return true
 }
 function safeCapture(){
  var result=reconcile(rawCapture());
  if(result.changed){applyRepaired(result);writeMirror(result.state,'anti-wipe-capture-v615');scheduleRepairSave()}
  return result.state
 }
 function scheduleRepairSave(){
  if(inProtectedSave||pendingRepairSave||!persistent||typeof persistent.saveNow!=='function')return;
  pendingRepairSave=true;setTimeout(function(){pendingRepairSave=false;try{persistent.saveNow('automatic-anti-wipe-repair-v615')}catch(e){}},80)
 }

 function openSafetyDb(){
  return new Promise(function(resolve,reject){
   if(typeof indexedDB==='undefined')return reject(new Error('IndexedDB is unavailable.'));
   var request=indexedDB.open(SAFETY_DB,SAFETY_DB_VERSION);
   request.onupgradeneeded=function(){var db=request.result;if(!db.objectStoreNames.contains(SNAP_STORE))db.createObjectStore(SNAP_STORE,{keyPath:'id'});if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE)};
   request.onsuccess=function(){resolve(request.result)};request.onerror=function(){reject(request.error||new Error('Could not open full-state safety database.'))}
  })
 }
 function listSnapshots(){
  return openSafetyDb().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction(SNAP_STORE,'readonly'),req=tx.objectStore(SNAP_STORE).getAll();req.onsuccess=function(){var rows=(req.result||[]).sort(function(a,b){return String(b.savedAt).localeCompare(String(a.savedAt))});db.close();resolve(rows)};req.onerror=function(){var e=req.error||new Error('Could not read recovery points.');db.close();reject(e)}})})
 }
 function deleteSnapshot(id){return openSafetyDb().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction(SNAP_STORE,'readwrite');tx.objectStore(SNAP_STORE).delete(id);tx.oncomplete=function(){db.close();resolve(true)};tx.onerror=function(){var e=tx.error||new Error('Could not trim recovery points.');db.close();reject(e)}})})}
 function saveSnapshot(state,source){
  state=clone(state||safeCapture());var fp=fingerprint(state);
  return listSnapshots().then(function(rows){
   if(rows[0]&&rows[0].hash===fp.hash&&rows[0].bytes===fp.bytes)return rows[0];
   var record={id:Date.now()+'-'+Math.random().toString(36).slice(2,8),version:VERSION,savedAt:nowISO(),source:source||'autosave',hash:fp.hash,bytes:fp.bytes,auxiliary:captureAuxiliary(),counts:{reps:count(state.reps),weekly:count(state.data),customers:count(state.customers),orders:count(state.orders),lineItems:count(state.orderLineItems),creditMemos:count(state.cms),artErrors:count(state.artErrors),coaching:count(state.coachingNotes),dailySales:count(state.dailySales)},state:state};
   return openSafetyDb().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction(SNAP_STORE,'readwrite');tx.objectStore(SNAP_STORE).put(record);tx.oncomplete=function(){db.close();resolve(record)};tx.onerror=function(){var e=tx.error||new Error('Could not create a full recovery point.');db.close();reject(e)}})}).then(async function(saved){var all=await listSnapshots();for(var i=MAX_SNAPSHOTS;i<all.length;i++){try{await deleteSnapshot(all[i].id)}catch(e){}}uiState.lastSnapshot=saved.savedAt;uiState.snapshotCount=Math.min(all.length,MAX_SNAPSHOTS);return saved})
  }).catch(function(error){uiState.lastError=(error&&error.message)||String(error);return null})
 }
 function updateBaseline(state){latestGood=clone(state);baselinePool=[latestGood].concat(baselinePool.filter(function(item){return item&&item!==latestGood})).slice(0,8);writeMirror(state,'verified-full-state-v615')}

 async function initSafety(){
  try{
   if(persistent&&typeof persistent.ready==='function')await persistent.ready();
   var current=rawCapture(),active=null,previous=null,snapshots=[];
   try{if(persistent&&typeof persistent.loadActive==='function')active=await persistent.loadActive()}catch(e){}
   try{if(persistent&&typeof persistent.loadPrevious==='function')previous=await persistent.loadPrevious()}catch(e){}
   try{snapshots=await listSnapshots()}catch(e){uiState.lastError=(e&&e.message)||String(e)}
   baselinePool=[readMirror(),active,previous].concat(snapshots.map(function(row){return row&&row.state})).filter(Boolean);
   var result=reconcile(current);
   if(result.changed){
    await saveSnapshot(current,'pre-repair-on-startup-v615');
    applyRepaired(result);
    current=result.state;
    if(basePersistentSave)await basePersistentSave('startup-anti-wipe-repair-v615');
   }
   updateBaseline(current);
   await saveSnapshot(current,'startup-recovery-point-v615');
   var rows=await listSnapshots();uiState.snapshotCount=rows.length;uiState.lastSnapshot=rows[0]&&rows[0].savedAt||'';uiState.ready=true;renderSafetyPanel();
   return current
  }catch(error){uiState.lastError=(error&&error.message)||String(error);uiState.ready=true;renderSafetyPanel();console.warn('[v615 safety startup]',error);return rawCapture()}
 }

 window._liveTrackerStateForCloud=safeCapture;
 if(window._tcpStorageV528)window._tcpStorageV528.currentFullState=safeCapture;
 if(durable)durable.captureFullState=safeCapture;

 if(persistent&&basePersistentSave&&!persistent.__tcpV615Protected){
  persistent.__tcpV615Protected=true;
  persistent.saveNow=function(source){
   saveQueue=saveQueue.catch(function(){return true}).then(async function(){
    if(safetyReady)await safetyReady.catch(function(){return true});
    inProtectedSave=true;
    try{
     var before=latestGood||rawCapture();await saveSnapshot(before,'before-'+(source||'autosave')+'-v615');
     var repaired=reconcile(rawCapture());if(repaired.changed)applyRepaired(repaired);
     var result=await basePersistentSave(source||'protected-autosave-v615');
     var after=safeCapture();updateBaseline(after);await saveSnapshot(after,source||'protected-autosave-v615');renderSafetyPanel();return result
    }finally{inProtectedSave=false}
   });
   return saveQueue
  }
 }

 if(baseMarkDirty&&!window.__tcpV615MarkDirty){
  window.markDirty=function(){var repaired=reconcile(rawCapture());if(repaired.changed)applyRepaired(repaired);writeMirror(repaired.state,'immediate-change-journal-v615');return baseMarkDirty.apply(this,arguments)};
  window.__tcpV615MarkDirty=true
 }

 function wrapDelete(name,base,field,idPrefix){
  if(typeof base!=='function')return;
  window[name]=function(id){
   var current=rawCapture();saveSnapshot(current,'before-'+field+'-delete-v615');
   addTombstone(field,field+':id:'+String(id));
   return base.apply(this,arguments)
  }
 }
 wrapDelete('deleteCM',baseDeleteCM,'cms');
 wrapDelete('deleteAE',baseDeleteAE,'artErrors');
 wrapDelete('deleteHR',baseDeleteHR,'hrViolations');
 wrapDelete('deleteCN',baseDeleteCN,'coachingNotes');
 if(baseDeleteDaily){window.deleteDailyEntry=function(date){saveSnapshot(rawCapture(),'before-daily-delete-v615');addTombstone('dailySales','dailySales:date:'+String(date));addTombstone('dailyRep','dailyRep:key:'+String(date));return baseDeleteDaily.apply(this,arguments)}}
 if(baseClearDaily){window.clearDailyLog=function(){saveSnapshot(rawCapture(),'before-daily-clear-v615');authorizeClear('dailySales',10);authorizeClear('dailyRep',10);return baseClearDaily.apply(this,arguments)}}

 if(baseSaveCloud){
  window.saveToCloud=async function(){if(persistent&&typeof persistent.saveNow==='function')await persistent.saveNow('before-manual-cloud-save-v615');await saveSnapshot(safeCapture(),'before-manual-cloud-save-v615');return baseSaveCloud.apply(this,arguments)}
 }
 if(baseLoadCloud){
  window.loadFromCloud=async function(){await saveSnapshot(safeCapture(),'before-cloud-load-v615');return baseLoadCloud.apply(this,arguments)}
 }
 if(baseImportData){
  window.importData=function(){saveSnapshot(safeCapture(),'before-file-import-v615');return baseImportData.apply(this,arguments)}
 }

 function cloudCredentials(){var token='',id='';try{token=clean(localStorage.getItem(typeof GIST_TOKEN_STORE!=='undefined'?GIST_TOKEN_STORE:'salesTracker_gistToken'));id=clean(localStorage.getItem(typeof GIST_ID_STORE!=='undefined'?GIST_ID_STORE:'salesTracker_gistId'))}catch(e){}return{token:token,id:id}}
 async function readCloudState(){
  var creds=cloudCredentials();if(!creds.token||!creds.id)throw new Error('Cloud credentials are not configured.');
  if(typeof _gistFetch!=='function'||typeof _readCloudContentFromGist!=='function')throw new Error('Cloud verification engine is unavailable.');
  var response=await _gistFetch('https://api.github.com/gists/'+creds.id,creds.token);if(!response.ok)throw new Error('Cloud verification failed with GitHub '+response.status+'.');
  var gist=await response.json(),content=await _readCloudContentFromGist(gist);if(typeof _decompressPayload==='function')content=await _decompressPayload(content);
  var parsed=JSON.parse(content);if(!parsed||!parsed.data||parsed.version!=='TCP_Tracker_Backup_v1')throw new Error('Cloud backup format is invalid.');
  var raw=parsed.data[typeof STORE_KEY!=='undefined'?STORE_KEY:'salesTracker_v2'];if(!raw)throw new Error('Cloud backup is missing the full tracker state.');
  return typeof raw==='string'?JSON.parse(raw):raw
 }
 async function verifyCloud(){
  if(Date.now()-lastCloudVerifyAttempt<45000)return false;lastCloudVerifyAttempt=Date.now();
  try{
   var cloud=await readCloudState(),local=safeCapture(),problems=[];
   ZERO_GUARD.forEach(function(field){if(meaningful(local[field])&&!meaningful(cloud[field]))problems.push(field)});
   ['cms','artErrors','hrViolations','coachingNotes','dailySales'].forEach(function(field){if(count(cloud[field])<count(local[field]))problems.push(field+' '+count(cloud[field])+'/'+count(local[field]))});
   if(problems.length)throw new Error('Cloud copy is missing or behind: '+problems.join(', '));
   uiState.cloudVerified=nowISO();uiState.cloudError='';nativeSet(CLOUD_VERIFY_KEY,JSON.stringify({verifiedAt:uiState.cloudVerified,counts:{creditMemos:count(cloud.cms),artErrors:count(cloud.artErrors),dailySales:count(cloud.dailySales)},hash:fingerprint(cloud).hash}));renderSafetyPanel();return true
  }catch(error){uiState.cloudError=(error&&error.message)||String(error);renderSafetyPanel();console.warn('[v615 cloud verification]',error);return false}
 }
 function scheduleCloudVerify(){if(verifyTimer)clearTimeout(verifyTimer);verifyTimer=setTimeout(function(){verifyTimer=null;verifyCloud()},1800)}
 try{
  var priorSetItem=localStorage.setItem.bind(localStorage);
  localStorage.setItem=function(key,value){priorSetItem(key,value);if(String(key)==='_tcp_last_cloud_save')scheduleCloudVerify()}
 }catch(e){}

 function formatStamp(value){if(!value)return'Not yet';var date=new Date(value);return isNaN(date.getTime())?'Not yet':date.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
 async function renderSafetyPanel(){
  var page=document.getElementById('pg-admin');if(!page)return;
  var panel=document.getElementById('tcp-v615-safety-panel');
  if(!panel){panel=document.createElement('section');panel.id='tcp-v615-safety-panel';var first=page.firstElementChild;if(first)page.insertBefore(panel,first);else page.appendChild(panel)}
  var state=safeCapture(),snapshots=[];try{snapshots=await listSnapshots()}catch(e){}
  uiState.snapshotCount=snapshots.length;uiState.lastSnapshot=snapshots[0]&&snapshots[0].savedAt||uiState.lastSnapshot;
  var cloudRecord=parseLocal(CLOUD_VERIFY_KEY,null);if(!uiState.cloudVerified&&cloudRecord)uiState.cloudVerified=cloudRecord.verifiedAt||'';
  panel.className=uiState.lastError||uiState.cloudError?'warn':'';
  panel.innerHTML='<div class="v615-head"><div><div class="v615-kick">Full-state data vault</div><div class="v615-title">Every tracker module is protected across code updates</div><div class="v615-copy">The complete in-memory tracker is saved to the persistent database and rotating recovery points. Credit memos, art errors, HR/coaching records, daily activity, customer records, orders, and portal data are checked before any local or cloud save can replace a richer verified copy.</div></div><div class="v615-badge">'+(uiState.lastError||uiState.cloudError?'Needs attention':'Protection active')+'</div></div>'
   +'<div class="v615-grid">'
   +'<div class="v615-metric"><span>Credit memos</span><strong>'+count(state.cms)+'</strong></div>'
   +'<div class="v615-metric"><span>Customers</span><strong>'+count(state.customers)+'</strong></div>'
   +'<div class="v615-metric"><span>Orders</span><strong>'+count(state.orders)+'</strong></div>'
   +'<div class="v615-metric"><span>Daily sales</span><strong>'+count(state.dailySales)+'</strong></div>'
   +'<div class="v615-metric"><span>Recovery points</span><strong>'+snapshots.length+'</strong></div>'
   +'<div class="v615-metric"><span>Cloud verified</span><strong>'+esc(formatStamp(uiState.cloudVerified))+'</strong></div>'
   +'</div><div class="v615-actions"><button class="v615-btn primary" onclick="_tcpV615CreateRecoveryPoint()">Create recovery point</button><button class="v615-btn" onclick="_tcpV615RestorePrevious()">Restore previous safe copy</button><button class="v615-btn" onclick="_tcpV615DownloadFullBackup()">Download full backup</button><button class="v615-btn" onclick="_tcpV615VerifyCloud()">Verify cloud copy</button><div class="v615-status">Last local recovery point: '+esc(formatStamp(uiState.lastSnapshot))+(uiState.lastRepair?'<br>Automatic repair: '+uiState.repairCount+' value'+(uiState.repairCount===1?'':'s')+' restored '+esc(formatStamp(uiState.lastRepair)):'')+(uiState.cloudError?'<br><span style="color:#FFD27A">'+esc(uiState.cloudError)+'</span>':'')+(uiState.lastError?'<br><span style="color:#FFD27A">'+esc(uiState.lastError)+'</span>':'')+'</div></div>'
 }

 window._tcpV615CreateRecoveryPoint=async function(){
  var state=safeCapture(),saved=await saveSnapshot(state,'manual-recovery-point-v615');
  if(persistent&&typeof persistent.saveNow==='function')await persistent.saveNow('manual-recovery-point-v615');
  if(durable&&typeof durable.syncCloud==='function')durable.syncCloud('manual-recovery-point-v615');
  renderSafetyPanel();alert(saved?'Full tracker recovery point created.':'The main save completed, but the extra recovery point could not be created. Check Admin status.');return true
 };
 window._tcpV615RestorePrevious=async function(){
  var snapshots=await listSnapshots(),currentFp=fingerprint(safeCapture()),candidate=snapshots.find(function(row){return row&&row.hash!==currentFp.hash});
  if(!candidate){alert('No different previous recovery point is available on this device.');return false}
  var c=candidate.counts||{};
  if(!confirm('Restore the previous full tracker recovery point from '+formatStamp(candidate.savedAt)+'?\n\nCredit memos: '+(c.creditMemos||0)+'\nCustomers: '+(c.customers||0)+'\nOrders: '+(c.orders||0)+'\nDaily sales entries: '+(c.dailySales||0)+'\n\nThe current tracker will be saved as another recovery point first.'))return false;
  await saveSnapshot(safeCapture(),'before-manual-restore-v615');
  if(persistent&&typeof persistent.restoreState==='function')await persistent.restoreState(candidate.state,candidate.auxiliary||{},'full-safety-restore-v615');
  else{Object.keys(candidate.state||{}).forEach(function(key){if(key.indexOf('__tcp')!==0)S[key]=clone(candidate.state[key])});if(persistent&&typeof persistent.saveNow==='function')await persistent.saveNow('full-safety-restore-v615')}
  updateBaseline(candidate.state);writeMirror(candidate.state,'full-safety-restore-v615');alert('Previous full tracker recovery point restored. The page will reload now.');location.reload();return true
 };
 window._tcpV615DownloadFullBackup=function(){
  var state=safeCapture(),payload={version:'TCP_Full_State_Backup_v615',exportedAt:nowISO(),auxiliary:captureAuxiliary(),counts:{creditMemos:count(state.cms),customers:count(state.customers),orders:count(state.orders),dailySales:count(state.dailySales)},state:state};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sales_tracker_full_backup_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)
 };
 window._tcpV615VerifyCloud=function(){verifyCloud().then(function(ok){alert(ok?'Cloud copy verified against the current protected tracker.':'Cloud verification needs attention. Open Admin to see the reason.')})};

 var observer=new MutationObserver(function(){var page=document.getElementById('pg-admin');if(page&&page.classList.contains('active'))renderSafetyPanel()});
 if(document.body)observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'){var state=safeCapture();writeMirror(state,'visibility-hidden-v615');saveSnapshot(state,'visibility-hidden-v615')}});
 window.addEventListener('pagehide',function(){var state=safeCapture();writeMirror(state,'pagehide-v615');saveSnapshot(state,'pagehide-v615')});

 window.TCP_FULL_STATE_SAFETY_V615={
  version:VERSION,ready:function(){return safetyReady},capture:safeCapture,reconcile:reconcile,createSnapshot:function(source){return saveSnapshot(safeCapture(),source||'manual-v615')},listSnapshots:listSnapshots,verifyCloud:verifyCloud,status:function(){return clone(uiState)},diagnostics:async function(){var state=safeCapture(),rows=await listSnapshots();return{version:VERSION,ready:uiState.ready,counts:{reps:count(state.reps),weekly:count(state.data),creditMemos:count(state.cms),artErrors:count(state.artErrors),customers:count(state.customers),orders:count(state.orders),lineItems:count(state.orderLineItems),dailySales:count(state.dailySales)},recoveryPoints:rows.map(function(row){return{id:row.id,savedAt:row.savedAt,source:row.source,hash:row.hash,bytes:row.bytes,counts:row.counts}}),lastRepair:uiState.lastRepair,repairCount:uiState.repairCount,lastError:uiState.lastError,cloudVerified:uiState.cloudVerified,cloudError:uiState.cloudError}}
 };

 safetyReady=initSafety();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(renderSafetyPanel,200)},{once:true});else setTimeout(renderSafetyPanel,200)
})();
