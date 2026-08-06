
(function(){
 'use strict';

 var VERSION='v614';
 var JOURNAL_KEY='salesTracker_daily_autosave_journal_v614';
 var LOCAL_TS_KEY='_tcp_v614_last_local_save';
 var CLOUD_ATTEMPT_KEY='_tcp_v614_last_cloud_attempt';
 var cloudTimer=null;
 var localQueue=Promise.resolve(true);
 var cloudQueue=Promise.resolve(true);
 var state={local:'ready',cloud:'idle',message:'',error:'',lastLocal:'',lastCloud:''};
 var persistent=window.TCP_PERSISTENT_DATA_V550||null;
 var originalPersistentSaveNow=persistent&&typeof persistent.saveNow==='function'?persistent.saveNow.bind(persistent):null;
 var originalLiveCapture=typeof window._liveTrackerStateForCloud==='function'?window._liveTrackerStateForCloud:null;
 var originalMarkDirty=typeof window.markDirty==='function'?window.markDirty:null;
 var originalAutoSave=typeof window._gistAutoSave==='function'?window._gistAutoSave:null;
 var originalSaveDailyEntry=typeof window.saveDailyEntry==='function'?window.saveDailyEntry:null;
 var originalSaveRepDay=typeof window.drSaveRepDay==='function'?window.drSaveRepDay:null;
 var originalSaveCalls=typeof window._v552SaveCalls==='function'?window._v552SaveCalls:null;
 var originalRenderDailyLog=typeof window.renderDailyLog==='function'?window.renderDailyLog:null;
 var originalSetupDailyTab=typeof window.setupDailyTab==='function'?window.setupDailyTab:null;

 function own(obj,key){return !!obj&&Object.prototype.hasOwnProperty.call(obj,key)}
 function clean(value){return String(value==null?'':value).trim()}
 function clone(value){
  if(value==null||typeof value!=='object')return value;
  if(typeof structuredClone==='function'){
   try{return structuredClone(value)}catch(e){}
  }
  try{return JSON.parse(JSON.stringify(value))}catch(e){return value}
 }
 function nowISO(){return new Date().toISOString()}
 function stampLabel(value){
  if(!value)return'not yet';
  var date=new Date(value);
  if(isNaN(date.getTime()))return'not yet';
  var diff=Math.max(0,Date.now()-date.getTime());
  if(diff<60000)return'just now';
  if(diff<3600000)return Math.max(1,Math.round(diff/60000))+'m ago';
  if(diff<86400000)return Math.max(1,Math.round(diff/3600000))+'h ago';
  return date.toLocaleDateString()+' '+date.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
 }
 function signature(value){
  var raw='';
  try{raw=JSON.stringify(value)}catch(e){raw=String(value)}
  var hash=2166136261;
  for(var i=0;i<raw.length;i++){
   hash^=raw.charCodeAt(i);
   hash+=(hash<<1)+(hash<<4)+(hash<<7)+(hash<<8)+(hash<<24)
  }
  return(raw.length+':'+(hash>>>0).toString(16))
 }
 function dailySnapshot(){
  var source=window.S||{};
  return{
   dailySales:clone(source.dailySales||[]),
   dailyRep:clone(source.dailyRep||{}),
   dailyCalls:clone(source.dailyCalls||{}),
   dailyLiveBridge:clone(source.dailyLiveBridge||{}),
   dailyLiveReconciliation:clone(source.dailyLiveReconciliation||{})
  }
 }
 function captureFullState(){
  var full={};
  try{full=originalLiveCapture?clone(originalLiveCapture())||{}:clone(window.S||{})||{}}catch(e){full=clone(window.S||{})||{}}
  var daily=dailySnapshot();
  full.dailySales=daily.dailySales;
  full.dailyRep=daily.dailyRep;
  full.dailyCalls=daily.dailyCalls;
  full.dailyLiveBridge=daily.dailyLiveBridge;
  full.dailyLiveReconciliation=daily.dailyLiveReconciliation;
  return full
 }
 function writeJournal(source){
  var snapshot=dailySnapshot(),record={
   version:VERSION,
   savedAt:nowISO(),
   source:source||'change',
   signature:signature(snapshot),
   data:snapshot
  };
  try{
   var set=(typeof window._originalSetItem==='function')?window._originalSetItem:localStorage.setItem.bind(localStorage);
   set(JOURNAL_KEY,JSON.stringify(record));
   set(LOCAL_TS_KEY,record.savedAt)
  }catch(e){console.warn('[v614 journal]',e)}
  state.lastLocal=record.savedAt;
  return record
 }
 function readJournal(){
  try{
   var record=JSON.parse(localStorage.getItem(JOURNAL_KEY)||'null');
   return record&&record.version===VERSION&&record.data?record:null
  }catch(e){return null}
 }
 function applyDailySnapshot(snapshot){
  if(!window.S||!snapshot)return false;
  S.dailySales=clone(snapshot.dailySales||[]);
  S.dailyRep=clone(snapshot.dailyRep||{});
  S.dailyCalls=clone(snapshot.dailyCalls||{});
  S.dailyLiveBridge=clone(snapshot.dailyLiveBridge||{});
  S.dailyLiveReconciliation=clone(snapshot.dailyLiveReconciliation||{});
  return true
 }
 function credentialState(){
  var token='',id='';
  try{
   token=clean(localStorage.getItem(typeof GIST_TOKEN_STORE!=='undefined'?GIST_TOKEN_STORE:'salesTracker_gistToken'));
   id=clean(localStorage.getItem(typeof GIST_ID_STORE!=='undefined'?GIST_ID_STORE:'salesTracker_gistId'))
  }catch(e){}
  return{token:token,id:id,ready:!!(token&&id)}
 }
 function setActionMessage(id,text,color){
  var el=document.getElementById(id);
  if(!el)return;
  el.textContent=text;
  el.style.color=color||'#5DCAA5';
  el.style.display='block'
 }
 function renderStatus(){
  var host=document.getElementById('tcp-v614-save-state');
  if(!host)return;
  var creds=credentialState();
  var cloudTs=state.lastCloud||function(){try{return localStorage.getItem('_tcp_last_cloud_save')||''}catch(e){return''}}();
  var localTs=state.lastLocal||function(){try{return localStorage.getItem(LOCAL_TS_KEY)||''}catch(e){return''}}();
  var title='Auto-save protected';
  var detail='Local '+stampLabel(localTs)+' · Cloud '+(creds.ready?stampLabel(cloudTs):'not configured');
  var tone='';
  if(state.local==='saving'||state.cloud==='saving'){
   title=state.cloud==='saving'?'Saving locally, then syncing cloud…':'Saving locally…';
   detail='Do not refresh until this finishes.';
   tone='saving'
  }else if(state.cloud==='error'){
   title='Saved locally · cloud sync failed';
   detail=(state.error||'The GitHub Gist save did not complete.')+' Use Sync now after checking the token/network.';
   tone='error'
  }else if(!creds.ready){
   title='Saved locally · cloud needs setup';
   detail='The daily recovery journal and IndexedDB are active. Add the GitHub token in Admin to enable cloud autosave.';
   tone='warn'
  }else if(state.cloud==='saved'){
   title='Saved locally and synced to cloud';
   detail='Local '+stampLabel(localTs)+' · Cloud '+stampLabel(cloudTs)
  }else if(state.message){
   title=state.message
  }
  host.className='v614-save-state '+tone;
  var strong=host.querySelector('.v614-save-copy strong');
  var span=host.querySelector('.v614-save-copy span');
  if(strong)strong.textContent=title;
  if(span)span.textContent=detail
 }
 function mountStatus(){
  var page=document.getElementById('pg-daily');
  if(!page)return;
  var panel=page.querySelector('.daily-entry-married-panel');
  var body=page.querySelector('.daily-entry-married-body');
  if(!panel||!body)return;
  var host=document.getElementById('tcp-v614-save-state');
  if(!host){
   host=document.createElement('div');
   host.id='tcp-v614-save-state';
   host.className='v614-save-state';
   host.innerHTML='<span class="v614-save-dot" aria-hidden="true"></span><div class="v614-save-copy"><strong>Auto-save protected</strong><span>Checking local and cloud status…</span></div><button type="button" class="v614-save-btn primary" onclick="_tcpV614SyncNow()">Sync now</button><button type="button" class="v614-save-btn" onclick="_tcpV614RecoverDaily()">Check recovery</button>';
   panel.insertBefore(host,body)
  }
  var pill=page.querySelector('.daily-entry-married-head .daily-status-pill');
  if(pill)pill.textContent='Local + cloud autosave';
  renderStatus()
 }

 /* Make every persistent save use one chain. The prior implementation exposed
    saveNow directly, so two rapid Daily Sales & Calls saves could commit out of
    order. Existing callers now receive the serialized promise automatically. */
 if(persistent&&originalPersistentSaveNow&&!persistent.__tcpV614Serialized){
  persistent.__tcpV614Serialized=true;
  persistent.saveNow=function(source){
   localQueue=localQueue.catch(function(){return true}).then(function(){
    return originalPersistentSaveNow(source||'autosave-v614')
   });
   return localQueue
  }
 }

 /* Keep all daily fields in the authoritative state used by IndexedDB and the
    Gist payload, even if an older compatibility function omits one of them. */
 window._liveTrackerStateForCloud=captureFullState;
 if(window._tcpStorageV528)window._tcpStorageV528.currentFullState=captureFullState;

 function durableLocal(source){
  writeJournal(source);
  state.local='saving';state.error='';renderStatus();
  var task;
  try{
   if(persistent&&typeof persistent.saveNow==='function')task=Promise.resolve(persistent.saveNow(source||'durable-save-v614'));
   else if(typeof window.persist==='function'){window.persist();task=Promise.resolve(true)}
   else task=Promise.reject(new Error('No persistent save engine is available.'))
  }catch(e){task=Promise.reject(e)}
  return task.then(function(result){
   state.local='saved';state.lastLocal=nowISO();
   try{var set=(typeof window._originalSetItem==='function')?window._originalSetItem:localStorage.setItem.bind(localStorage);set(LOCAL_TS_KEY,state.lastLocal)}catch(e){}
   renderStatus();return result
  }).catch(function(error){
   state.local='error';state.error=(error&&error.message)||String(error);renderStatus();throw error
  })
 }
 function runCloud(source,skipLocal){
  cloudQueue=cloudQueue.catch(function(){return true}).then(async function(){
   if(!skipLocal)await durableLocal(source||'cloud-autosave-v614');
   try{if(window._tcpGistCredentialsReady)await window._tcpGistCredentialsReady}catch(e){}
   var creds=credentialState();
   if(!creds.ready){
    state.cloud='not-configured';state.error='';renderStatus();
    return{local:true,cloud:false,reason:'not-configured'}
   }
   if(!originalAutoSave)throw new Error('Cloud autosave engine is unavailable.');
   state.cloud='saving';state.error='';renderStatus();
   var before='';
   try{before=localStorage.getItem('_tcp_last_cloud_save')||'';localStorage.setItem(CLOUD_ATTEMPT_KEY,nowISO())}catch(e){}
   var started=Date.now();
   await Promise.resolve(originalAutoSave.call(window));
   var after='';
   try{after=localStorage.getItem('_tcp_last_cloud_save')||''}catch(e){}
   var afterTime=after?new Date(after).getTime():0;
   if(!after||after===before||!afterTime||afterTime<started-1500){
    throw new Error('GitHub Gist did not confirm a new cloud save.')
   }
   state.cloud='saved';state.lastCloud=after;state.error='';renderStatus();
   return{local:true,cloud:true,savedAt:after}
  }).catch(function(error){
   state.cloud='error';state.error=(error&&error.message)||String(error);renderStatus();
   console.warn('[v614 cloud autosave]',error);
   return{local:state.local==='saved',cloud:false,error:state.error}
  });
  return cloudQueue
 }
 function saveEverything(source){
  if(cloudTimer){clearTimeout(cloudTimer);cloudTimer=null}
  return durableLocal(source).then(function(){return runCloud(source,true)})
 }
 function scheduleCloud(source,delay){
  writeJournal(source||'change');
  if(cloudTimer)clearTimeout(cloudTimer);
  state.message='Changes queued for autosave';renderStatus();
  cloudTimer=setTimeout(function(){cloudTimer=null;saveEverything(source||'change')},Math.max(250,Number(delay)||1100))
 }

 /* Replace the old delayed portal cloud queue and wrap markDirty so every
    business-state edit receives the same verified save path. */
 window._queuePortalCloudSync=function(){scheduleCloud('business-change-v614',900)};
 if(originalMarkDirty){
  window.markDirty=function(){
   var result=originalMarkDirty.apply(this,arguments);
   scheduleCloud('business-change-v614',900);
   return result
  }
 }

 /* Scheduled five-minute saves and manual queue calls now use verification. */
 window._gistAutoSave=function(){return runCloud('scheduled-cloud-autosave-v614',false)};

 /* Auxiliary rep-portal stores often write directly to localStorage. Preserve
    the existing file-autosave hook, then queue cloud sync for business keys. */
 if(!window.__tcpV614StorageHook){
  try{
   var priorSetItem=localStorage.setItem.bind(localStorage);
   localStorage.setItem=function(key,value){
    priorSetItem(key,value);
    var text=String(key||'');
    if(!text||text===STORE_KEY||text===JOURNAL_KEY||text.indexOf('_tcp_')===0)return;
    if(text===GIST_TOKEN_STORE||text===GIST_ID_STORE||(typeof API_KEY_STORE!=='undefined'&&text===API_KEY_STORE))return;
    if(text.indexOf('salesTracker_photo_')===0||text.indexOf('.viewMode.')>=0)return;
    if(typeof _isTrackerKey==='function'&&_isTrackerKey(text))scheduleCloud('auxiliary-store-v614',1200)
   };
   window.__tcpV614StorageHook=true
  }catch(e){console.warn('[v614 storage hook]',e)}
 }

 function dailyChanged(before){return before!==signature(dailySnapshot())}
 function finishDailyAction(source,messageId){
  setActionMessage(messageId,'Saving locally and syncing to cloud…','#8EDCFA');
  return saveEverything(source).then(function(result){
   if(result&&result.cloud)setActionMessage(messageId,'✓ Saved locally and synced to cloud','#5DCAA5');
   else if(result&&result.reason==='not-configured')setActionMessage(messageId,'✓ Saved locally · cloud token is not configured','#EF9F27');
   else setActionMessage(messageId,'✓ Saved locally · cloud sync needs attention','#EF9F27');
   return result
  }).catch(function(error){
   setActionMessage(messageId,'⚠ Save failed: '+((error&&error.message)||String(error)),'#F09595');
   return false
  })
 }
 if(originalSaveDailyEntry){
  window.saveDailyEntry=function(){
   var before=signature(dailySnapshot()),result=originalSaveDailyEntry.apply(this,arguments);
   if(dailyChanged(before))finishDailyAction('daily-total-v614','dailyMsg');
   return result
  }
 }
 if(originalSaveRepDay){
  window.drSaveRepDay=function(){
   var before=signature(dailySnapshot()),result=originalSaveRepDay.apply(this,arguments);
   if(dailyChanged(before))finishDailyAction('daily-sales-v614','dr-msg');
   return result
  }
 }
 if(originalSaveCalls){
  window._v552SaveCalls=function(){
   var before=signature(dailySnapshot()),result=originalSaveCalls.apply(this,arguments);
   if(dailyChanged(before))finishDailyAction('daily-calls-v614','v552-call-msg');
   return result
  }
 }

 function mergeMissing(current,previous){
  var merged=clone(current||{}),added=0;
  Object.keys(previous||{}).forEach(function(date){
   if(!own(merged,date)){merged[date]=clone(previous[date]);added++;return}
   if(merged[date]&&typeof merged[date]==='object'&&previous[date]&&typeof previous[date]==='object'){
    Object.keys(previous[date]).forEach(function(key){if(!own(merged[date],key)){merged[date][key]=clone(previous[date][key]);added++}})
   }
  });
  return{value:merged,added:added}
 }
 function mergePreviousDaily(previous){
  var added=0;
  var currentSales=Array.isArray(S.dailySales)?S.dailySales:[],previousSales=Array.isArray(previous.dailySales)?previous.dailySales:[];
  var byDate={};currentSales.forEach(function(row){if(row&&row.date)byDate[row.date]=clone(row)});
  previousSales.forEach(function(row){if(row&&row.date&&!own(byDate,row.date)){byDate[row.date]=clone(row);added++}});
  var rep=mergeMissing(S.dailyRep||{},previous.dailyRep||{});added+=rep.added;
  var calls=mergeMissing(S.dailyCalls||{},previous.dailyCalls||{});added+=calls.added;
  var bridge=mergeMissing(S.dailyLiveBridge||{},previous.dailyLiveBridge||{});added+=bridge.added;
  var recon=mergeMissing(S.dailyLiveReconciliation||{},previous.dailyLiveReconciliation||{});added+=recon.added;
  return{
   added:added,
   data:{
    dailySales:Object.keys(byDate).sort().map(function(date){return byDate[date]}),
    dailyRep:rep.value,dailyCalls:calls.value,dailyLiveBridge:bridge.value,dailyLiveReconciliation:recon.value
   }
  }
 }
 async function recoverPrevious(){
  if(!persistent||typeof persistent.loadPrevious!=='function'){
   alert('No previous persistent snapshot is available in this browser.');return false
  }
  var previous=await persistent.loadPrevious();
  if(!previous){alert('No previous verified snapshot was found on this device.');return false}
  var candidate=mergePreviousDaily(previous);
  if(!candidate.added){alert('The previous snapshot does not contain any Daily Sales & Calls records missing from the current tracker.');return false}
  if(!confirm('Recovery found '+candidate.added+' missing Daily Sales & Calls value'+(candidate.added===1?'':'s')+' in the previous verified snapshot.\n\nMerge only those missing values into the current tracker? Existing current values will not be replaced.'))return false;
  applyDailySnapshot(candidate.data);
  writeJournal('previous-snapshot-recovery-v614');
  await saveEverything('previous-snapshot-recovery-v614');
  try{if(typeof window.renderDailyLog==='function')window.renderDailyLog();if(typeof window._drRenderForm==='function')window._drRenderForm()}catch(e){}
  alert('Recovered '+candidate.added+' missing Daily Sales & Calls value'+(candidate.added===1?'':'s')+' and saved the repaired data.');
  return true
 }
 window._tcpV614RecoverDaily=function(){recoverPrevious().catch(function(error){alert('Recovery check failed: '+((error&&error.message)||String(error)))})};
 window._tcpV614SyncNow=function(){
  mountStatus();
  saveEverything('manual-sync-v614').then(function(result){
   if(result&&result.cloud)state.message='Manual sync completed';
   renderStatus()
  })
 };

 if(originalRenderDailyLog){
  window.renderDailyLog=function(){var result=originalRenderDailyLog.apply(this,arguments);setTimeout(mountStatus,0);return result}
 }
 if(originalSetupDailyTab){
  window.setupDailyTab=function(){var result=originalSetupDailyTab.apply(this,arguments);setTimeout(mountStatus,0);return result}
 }

 async function recoverJournalIfNeeded(){
  try{
   if(persistent&&typeof persistent.ready==='function')await persistent.ready();
   var source=clean(window._tcpPersistentMeta&&window._tcpPersistentMeta.source).toLowerCase();
   if(source.indexOf('restore')>=0)return false;
   var journal=readJournal();if(!journal)return false;
   var current=dailySnapshot();
   if(signature(current)===journal.signature)return false;
   applyDailySnapshot(journal.data);
   state.message='Recovered the latest daily autosave journal';
   await durableLocal('daily-journal-recovery-v614');
   scheduleCloud('daily-journal-recovery-v614',500);
   try{if(typeof window.renderDailyLog==='function')window.renderDailyLog();if(typeof window._drRenderForm==='function')window._drRenderForm()}catch(e){}
   return true
  }catch(error){console.warn('[v614 journal recovery]',error);return false}
 }

 function startup(){
  state.lastLocal=function(){try{return localStorage.getItem(LOCAL_TS_KEY)||''}catch(e){return''}}();
  state.lastCloud=function(){try{return localStorage.getItem('_tcp_last_cloud_save')||''}catch(e){return''}}();
  mountStatus();
  recoverJournalIfNeeded().then(function(){
   mountStatus();
   var localTime=state.lastLocal?new Date(state.lastLocal).getTime():0;
   var cloudTime=state.lastCloud?new Date(state.lastCloud).getTime():0;
   if(localTime>cloudTime+1000&&credentialState().ready)scheduleCloud('startup-cloud-catchup-v614',900)
  })
 }

 document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden'){
   writeJournal('visibility-hidden-v614');
   durableLocal('visibility-hidden-v614').catch(function(){})
  }
 });
 window.addEventListener('pagehide',function(){
  writeJournal('pagehide-v614');
  try{if(persistent&&typeof persistent.saveNow==='function')persistent.saveNow('pagehide-v614')}catch(e){}
 });

 var observer=new MutationObserver(function(){
  var page=document.getElementById('pg-daily');
  if(page&&page.classList.contains('active'))mountStatus()
 });
 if(document.body)observer.observe(document.body,{childList:true,subtree:true});

 window.TCP_DURABLE_AUTOSAVE_V614={
  version:VERSION,
  captureFullState:captureFullState,
  dailySnapshot:dailySnapshot,
  writeJournal:writeJournal,
  readJournal:readJournal,
  saveNow:saveEverything,
  syncCloud:function(source){return runCloud(source||'manual-v614',false)},
  recoverPrevious:recoverPrevious,
  status:function(){return clone(state)},
  diagnostics:function(){
   var full=captureFullState(),creds=credentialState(),journal=readJournal();
   return{
    version:VERSION,
    credentialsConfigured:creds.ready,
    gistId:creds.id,
    persistentReady:!!(persistent&&typeof persistent.isReady==='function'&&persistent.isReady()),
    dailySalesCount:(full.dailySales||[]).length,
    dailyRepDates:Object.keys(full.dailyRep||{}).length,
    dailyCallDates:Object.keys(full.dailyCalls||{}).length,
    dailyBridgeWeeks:Object.keys(full.dailyLiveBridge||{}).length,
    journalSavedAt:journal&&journal.savedAt||'',
    journalMatchesCurrent:!!(journal&&journal.signature===signature(dailySnapshot())),
    lastLocalSave:state.lastLocal||'',
    lastCloudSave:state.lastCloud||'',
    cloudState:state.cloud,
    error:state.error||''
   }
  }
 };

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startup,{once:true});
 else setTimeout(startup,0)
})();
