/* ============================================================================
   SALES TRACKER v613 · CLOUD RELIABILITY REPAIR
   - One authoritative, serialized GitHub Gist save path
   - Honest connection state and visible failure reporting
   - Consistent credential normalization
   - Automatic retry queue and online recovery
   - HR/coaching edit persistence fixes
   - Startup persistence retry and unload protection
   ============================================================================ */
(function(){
 'use strict';

 var VERSION='v613';
 var LAST_SUCCESS_KEY='_tcp_last_cloud_save';
 var LAST_ATTEMPT_KEY='_tcp_last_cloud_attempt';
 var LAST_ERROR_KEY='_tcp_last_cloud_error';
 var LAST_ERROR_AT_KEY='_tcp_last_cloud_error_at';
 var FAILURE_COUNT_KEY='_tcp_cloud_failure_count';
 var CLOUD_STATE_KEY='_tcp_cloud_state_v613';
 var patchLoadedAt=Date.now();
 var saveInFlight=null;
 var queuedSave=false;
 var queuedManual=false;
 var bootPersistQueued=false;

 var previousSaveGistToken=window.saveGistToken;
 var previousSaveGistId=window.saveGistId;
 var previousLoadFromCloud=window.loadFromCloud;
 var previousInitAdmin=window.initAdmin;
 var previousLoadAdminHealth=window.loadAdminHealth;
 var previousPersist=window.persist;
 var previousSaveHREdit=window.saveHREdit;
 var previousSaveCNEdit=window.saveCNEdit;

 function text(value){return String(value==null?'':value)}
 function cleanId(value){return text(value).trim()}
 function cleanToken(value){return text(value).replace(/\s+/g,'')}
 function nowIso(){return new Date().toISOString()}
 function getLocal(key){try{return localStorage.getItem(key)||''}catch(e){return ''}}
 function setLocal(key,value){try{localStorage.setItem(key,text(value));return true}catch(e){return false}}
 function removeLocal(key){try{localStorage.removeItem(key)}catch(e){}}
 function safeHtml(value){
  if(typeof window.esc_html==='function')return window.esc_html(text(value));
  return text(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
 }
 function formatWhen(value){
  if(!value)return 'never';
  var date=new Date(value);
  if(!isFinite(date.getTime()))return 'unknown';
  var diff=Math.max(0,Date.now()-date.getTime());
  var mins=Math.floor(diff/60000);
  if(mins<1)return 'just now';
  if(mins<60)return mins+'m ago';
  var hours=Math.floor(mins/60);
  if(hours<24)return hours+'h ago';
  return Math.floor(hours/24)+'d ago'
 }
 function credentials(){
  var tokenInput=document.getElementById('gistTokenInput');
  var idInput=document.getElementById('gistIdInput');
  var token=cleanToken((tokenInput&&tokenInput.value)||getLocal(window.GIST_TOKEN_STORE||'salesTracker_gistToken'));
  var id=cleanId((idInput&&idInput.value)||getLocal(window.GIST_ID_STORE||'salesTracker_gistId'));
  return{token:token,id:id}
 }
 function writeCredentials(creds,writeVault){
  creds=creds||{};
  var token=cleanToken(creds.token),id=cleanId(creds.id);
  var tokenKey=window.GIST_TOKEN_STORE||'salesTracker_gistToken';
  var idKey=window.GIST_ID_STORE||'salesTracker_gistId';
  if(token)setLocal(tokenKey,token);else removeLocal(tokenKey);
  if(id)setLocal(idKey,id);else removeLocal(idKey);
  var tokenInput=document.getElementById('gistTokenInput');
  var idInput=document.getElementById('gistIdInput');
  if(tokenInput&&tokenInput.value!==token)tokenInput.value=token;
  if(idInput&&idInput.value!==id)idInput.value=id;
  if(writeVault!==false){
   try{if(typeof previousSaveGistToken==='function')previousSaveGistToken()}catch(e){console.warn('[v613 credential token vault]',e)}
   try{if(typeof previousSaveGistId==='function')previousSaveGistId()}catch(e){console.warn('[v613 credential id vault]',e)}
  }
  return{token:token,id:id}
 }
 function stateRecord(next,detail){
  var record={state:next,at:nowIso(),detail:detail||''};
  setLocal(CLOUD_STATE_KEY,JSON.stringify(record));
  return record
 }
 function readStateRecord(){
  try{return JSON.parse(getLocal(CLOUD_STATE_KEY)||'{}')||{}}catch(e){return{}}
 }
 function lastError(){return getLocal(LAST_ERROR_KEY)}
 function lastErrorAt(){return getLocal(LAST_ERROR_AT_KEY)}
 function lastSuccess(){return getLocal(LAST_SUCCESS_KEY)}
 function failureCount(){return Number(getLocal(FAILURE_COUNT_KEY)||0)||0}
 function setFailure(message){
  message=text(message||'Unknown cloud save error').slice(0,600);
  setLocal(LAST_ERROR_KEY,message);
  setLocal(LAST_ERROR_AT_KEY,nowIso());
  setLocal(FAILURE_COUNT_KEY,String(failureCount()+1));
  stateRecord('error',message);
  renderCloudStatus()
 }
 function clearFailure(){
  removeLocal(LAST_ERROR_KEY);removeLocal(LAST_ERROR_AT_KEY);setLocal(FAILURE_COUNT_KEY,'0')
 }
 function statusModel(){
  var creds=credentials();
  var record=readStateRecord();
  var success=lastSuccess();
  var error=lastError();
  var errorAt=lastErrorAt();
  var successTime=success?new Date(success).getTime():0;
  var errorTime=errorAt?new Date(errorAt).getTime():0;
  if(!creds.token)return{key:'off',label:'Off',sub:'GitHub token required',color:'#F09595',problem:true};
  if(!creds.id)return{key:'setup',label:'Setup needed',sub:'Enter a Gist ID or use manual Save to create one',color:'#EF9F27',problem:true};
  var recordTime=record.at?new Date(record.at).getTime():0;
  var recentRecordedSave=record.state==='saving'&&recordTime&&Date.now()-recordTime<2*60*1000;
  if(saveInFlight||recentRecordedSave)return{key:'saving',label:'Saving…',sub:'Cloud update in progress',color:'#8EDCFA',problem:false};
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return{key:'offline',label:'Offline',sub:'Cloud save will retry when internet returns',color:'#EF9F27',problem:true};
  if(error&&errorTime>=successTime)return{key:'error',label:'Save failed',sub:error,detail:'Failed '+formatWhen(errorAt)+' · '+failureCount()+' consecutive',color:'#F09595',problem:true};
  if(success){
   var age=Date.now()-successTime;
   if(age>60*60*1000)return{key:'stale',label:'Delayed',sub:'Last cloud save '+formatWhen(success),color:'#F09595',problem:true};
   if(age>12*60*1000)return{key:'stale',label:'Delayed',sub:'Last cloud save '+formatWhen(success),color:'#EF9F27',problem:true};
   return{key:'active',label:'Active',sub:'Last cloud save '+formatWhen(success),color:'#5DCAA5',problem:false}
  }
  return{key:'ready',label:'Ready',sub:'Configured · waiting for first successful save',color:'#8EDCFA',problem:false}
 }
 function ensureAdminAutoStatus(){
  var gistStatus=document.getElementById('gistStatus');
  if(!gistStatus||document.getElementById('tcpCloudAutoStatus'))return;
  var box=document.createElement('div');
  box.id='tcpCloudAutoStatus';
  box.style.cssText='margin-top:10px;padding:10px 12px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(0,0,0,.18);font-size:11px;line-height:1.45;';
  gistStatus.insertAdjacentElement('afterend',box)
 }
 function ensureProblemChip(){
  var model=statusModel();
  var chip=document.getElementById('tcp-cloud-v613-chip');
  if(!model.problem){if(chip)chip.remove();return}
  if(!chip){
   chip=document.createElement('button');
   chip.type='button';chip.id='tcp-cloud-v613-chip';
   chip.style.cssText='position:fixed;right:14px;bottom:54px;z-index:10001;border:1px solid rgba(240,149,149,.55);border-radius:999px;background:#3A1717;color:#FFD2D2;padding:8px 13px;font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.42);cursor:pointer;max-width:360px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
   chip.onclick=function(){
    try{
     var buttons=document.querySelectorAll('#tabBar button,.tabs button');
     for(var i=0;i<buttons.length;i++){
      if((buttons[i].getAttribute('onclick')||'').indexOf("gt('admin'")>=0){buttons[i].click();return}
     }
    }catch(e){}
   };
   document.body.appendChild(chip)
  }
  chip.textContent='☁ '+model.label+' · '+model.sub;
  chip.style.borderColor=model.color;
  chip.style.color=model.color
 }
 function renderCloudStatus(){
  var model=statusModel();
  var status=document.getElementById('adminCloudStatus');
  var sub=document.getElementById('adminCloudSub');
  if(status){status.textContent=model.label;status.style.color=model.color}
  if(sub){sub.textContent=model.detail?model.sub+' · '+model.detail:model.sub}
  ensureAdminAutoStatus();
  var auto=document.getElementById('tcpCloudAutoStatus');
  if(auto){
   auto.style.borderColor=model.color;
   auto.innerHTML='<strong style="color:'+model.color+';">Automatic cloud save: '+safeHtml(model.label)+'</strong><br><span style="color:var(--color-text-secondary);">'+safeHtml(model.sub)+'</span>'+(model.detail?'<br><span style="color:var(--color-text-secondary);">'+safeHtml(model.detail)+'</span>':'')
  }
  var legacy=document.getElementById('cloudSaveBadge');
  if(legacy){legacy.textContent=model.sub;legacy.style.color=model.color}
  var cards=document.querySelectorAll('.admin-status-card');
  for(var i=0;i<cards.length;i++){
   var label=cards[i].querySelector('.as-label');
   if(label&&label.textContent.trim()==='App Version'){
    var value=cards[i].querySelector('.as-value'),sub=cards[i].querySelector('.as-sub'),meta=window.TCP_RELEASE||{version:VERSION,sub:'Cloud reliability'};
    if(value&&value.textContent!==meta.version)value.textContent=meta.version;
    if(sub&&sub.textContent!==meta.sub)sub.textContent=meta.sub
   }
  }
  ensureProblemChip()
 }
 function setGistMessage(message,color){
  if(typeof window._gistStatus==='function')window._gistStatus(message,color)
 }
 async function responseMessage(response){
  var raw='';
  try{raw=await response.text()}catch(e){}
  if(raw){
   try{var parsed=JSON.parse(raw);if(parsed&&parsed.message)raw=parsed.message}catch(e){}
  }
  return 'GitHub API '+response.status+(raw?': '+text(raw).replace(/\s+/g,' ').slice(0,260):'')
 }
 async function ensurePersistentReady(){
  try{
   if(window.TCP_PERSISTENT_DATA_V550&&typeof TCP_PERSISTENT_DATA_V550.ready==='function')await TCP_PERSISTENT_DATA_V550.ready()
  }catch(e){console.warn('[v613 persistent readiness]',e)}
 }
 function updateManualButton(active){
  var button=document.getElementById('gistSaveBtn');
  if(!button)return;
  button.disabled=!!active;
  button.innerHTML=active?'Saving…':'☁ Save to cloud'
 }
 async function performCloudSave(options){
  options=options||{};
  var manual=!!options.manual;
  await ensurePersistentReady();
  var creds=writeCredentials(credentials(),true);
  if(!creds.token){
   stateRecord('off','missing-token');renderCloudStatus();
   if(manual)setGistMessage('⚠ Enter a GitHub token before saving.','#EF9F27');
   return false
  }
  if(!creds.id&&!manual){
   stateRecord('setup','missing-gist-id');renderCloudStatus();
   return false
  }
  if(typeof navigator!=='undefined'&&navigator.onLine===false){
   stateRecord('offline','browser-offline');renderCloudStatus();
   if(manual)setGistMessage('⚠ This browser is offline. Cloud save will retry after the connection returns.','#EF9F27');
   return false
  }
  if(typeof window._trackerHasRealData==='function'&&!window._trackerHasRealData()){
   stateRecord('blocked','empty-starter');renderCloudStatus();
   if(manual)setGistMessage('⚠ Cloud save blocked because this appears to be the empty starter tracker. Load or enter real data first.','#EF9F27');
   return false
  }
  if(typeof window._buildCloudPayload!=='function'||typeof window._gistFetch!=='function'){
   throw new Error('Cloud save helpers are unavailable. Reload the tracker and try again.')
  }
  try{if(typeof window.persist==='function')window.persist()}catch(e){console.warn('[v613 local persist before cloud]',e)}
  setLocal(LAST_ATTEMPT_KEY,nowIso());
  stateRecord('saving',manual?'manual':'automatic');
  renderCloudStatus();
  if(manual){updateManualButton(true);setGistMessage('Pushing the latest tracker data to GitHub…','#8EDCFA')}
  try{
   var payload=window._buildCloudPayload();
   var payloadString=JSON.stringify(payload,null,2);
   var compressed=typeof window._compressPayload==='function'?await window._compressPayload(payloadString):null;
   var finalContent=compressed||payloadString;
   var files=typeof window._buildGistFilesFromContent==='function'?window._buildGistFilesFromContent(finalContent):{};
   if(!Object.keys(files).length){
    var filename=window.GIST_FILENAME||'tcp_tracker_data.json';
    files[filename]={content:finalContent}
   }
   var body={description:'TCP Sales Tracker data — '+(manual?'manual save ':'automatic save ')+new Date().toLocaleString(),files:files};
   var url='https://api.github.com/gists'+(creds.id?'/'+creds.id:'');
   var method=creds.id?'PATCH':'POST';
   if(!creds.id)body.public=false;
   var response=await window._gistFetch(url,creds.token,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok)throw new Error(await responseMessage(response));
   var result=await response.json();
   if(result&&result.id&&!creds.id){
    creds.id=cleanId(result.id);
    writeCredentials(creds,true)
   }
   var savedAt=nowIso();
   setLocal(LAST_SUCCESS_KEY,savedAt);
   clearFailure();
   stateRecord('saved',manual?'manual':'automatic');
   renderCloudStatus();
   if(manual){
    var rawKB=Math.round(payloadString.length/1024);
    var finalKB=Math.round(finalContent.length/1024);
    setGistMessage('✅ Saved to cloud at '+new Date(savedAt).toLocaleTimeString()+'. Gist ID: <strong style="font-family:monospace;">'+safeHtml(creds.id)+'</strong><br><span style="font-size:11px;color:var(--color-text-secondary);">'+rawKB.toLocaleString()+'KB raw → '+finalKB.toLocaleString()+'KB '+(compressed?'compressed':'uploaded')+'</span>','#5DCAA5')
   }
   return true
  }catch(error){
   var message=(error&&error.message)||text(error);
   console.error('[v613 cloud save]',error);
   setFailure(message);
   if(manual)setGistMessage('❌ Save failed: '+safeHtml(message),'#F09595');
   return false
  }finally{
   if(manual)updateManualButton(false)
  }
 }
 function requestCloudSave(options){
  options=options||{};
  if(saveInFlight){
   queuedSave=true;
   queuedManual=queuedManual||!!options.manual;
   stateRecord('saving','queued');renderCloudStatus();
   return saveInFlight
  }
  saveInFlight=performCloudSave(options).catch(function(error){
   setFailure((error&&error.message)||text(error));
   return false
  }).finally(function(){
   saveInFlight=null;
   var runAgain=queuedSave;
   var manualAgain=queuedManual;
   queuedSave=false;queuedManual=false;
   renderCloudStatus();
   if(runAgain)setTimeout(function(){requestCloudSave({manual:manualAgain,reason:'queued'})},250)
  });
  return saveInFlight
 }

 window.saveGistToken=function(){
  var input=document.getElementById('gistTokenInput');
  var token=cleanToken(input&&input.value);
  var id=credentials().id;
  writeCredentials({token:token,id:id},true);
  stateRecord(token?'ready':'off',token?'token-updated':'token-removed');
  renderCloudStatus()
 };
 window.saveGistId=function(){
  var input=document.getElementById('gistIdInput');
  var id=cleanId(input&&input.value);
  var token=credentials().token;
  writeCredentials({token:token,id:id},true);
  stateRecord(id?'ready':'setup',id?'gist-id-updated':'gist-id-removed');
  renderCloudStatus()
 };
 window.saveToCloud=function(){return requestCloudSave({manual:true,reason:'manual'})};
 window._gistAutoSave=function(){return requestCloudSave({manual:false,reason:'automatic'})};

 window.testGistToken=async function(){
  var creds=writeCredentials(credentials(),true);
  var button=document.getElementById('gistTestBtn');
  if(!creds.token){setGistMessage('⚠ Enter a token first, then test.','#EF9F27');renderCloudStatus();return}
  if(button){button.disabled=true;button.textContent='Testing…'}
  setGistMessage('Testing GitHub access…','#8EDCFA');
  try{
   var url=creds.id?'https://api.github.com/gists/'+creds.id:'https://api.github.com/user';
   var response=await window._gistFetch(url,creds.token);
   if(!response.ok)throw new Error(await responseMessage(response));
   var data=await response.json();
   clearFailure();stateRecord('ready','token-test-passed');renderCloudStatus();
   if(creds.id){
    setGistMessage('✅ Token accepted and Gist <strong style="font-family:monospace;">'+safeHtml(creds.id)+'</strong> is reachable. Use <strong>Save to cloud</strong> to confirm write access.','#5DCAA5')
   }else{
    setGistMessage('✅ Token accepted'+(data&&data.login?' for <strong>'+safeHtml(data.login)+'</strong>':'')+'. Manual Save to cloud can create a new Gist.','#5DCAA5')
   }
  }catch(error){
   var message=(error&&error.message)||text(error);
   setFailure(message);
   setGistMessage('❌ GitHub test failed: '+safeHtml(message),'#F09595')
  }finally{
   if(button){button.disabled=false;button.textContent='🧪 Test token'}
  }
 };

 if(typeof previousLoadFromCloud==='function'){
  window.loadFromCloud=async function(){
   writeCredentials(credentials(),true);
   try{return await previousLoadFromCloud.apply(this,arguments)}
   finally{setTimeout(renderCloudStatus,200)}
  }
 }

 window.loadAdminHealth=function(){
  var result;
  if(typeof previousLoadAdminHealth==='function')result=previousLoadAdminHealth.apply(this,arguments);
  renderCloudStatus();
  return result
 };
 window.initAdmin=function(){
  var result;
  if(typeof previousInitAdmin==='function')result=previousInitAdmin.apply(this,arguments);
  setTimeout(renderCloudStatus,0);
  setTimeout(renderCloudStatus,180);
  return result
 };

 if(typeof previousSaveHREdit==='function'){
  window.saveHREdit=function(id){
   var result=previousSaveHREdit.apply(this,arguments);
   try{if(typeof window.markDirty==='function')window.markDirty()}catch(e){console.warn('[v613 HR edit save]',e)}
   return result
  }
 }
 if(typeof previousSaveCNEdit==='function'){
  window.saveCNEdit=function(id){
   var result=previousSaveCNEdit.apply(this,arguments);
   try{if(typeof window.markDirty==='function')window.markDirty()}catch(e){console.warn('[v613 coaching edit save]',e)}
   return result
  }
 }

 if(typeof previousPersist==='function'){
  window.persist=function(){
   var ready=true;
   try{ready=!(window.TCP_PERSISTENT_DATA_V550&&typeof TCP_PERSISTENT_DATA_V550.isReady==='function')||TCP_PERSISTENT_DATA_V550.isReady()}catch(e){}
   var result=previousPersist.apply(this,arguments);
   if(!ready&&!bootPersistQueued&&window.TCP_PERSISTENT_DATA_V550&&typeof TCP_PERSISTENT_DATA_V550.ready==='function'){
    bootPersistQueued=true;
    Promise.resolve(TCP_PERSISTENT_DATA_V550.ready()).then(function(){
     bootPersistQueued=false;
     try{previousPersist()}catch(e){console.warn('[v613 startup persistence retry]',e)}
    }).catch(function(e){bootPersistQueued=false;console.warn('[v613 startup persistence readiness]',e)})
   }
   return result
  }
 }

 window.addEventListener('online',function(){
  renderCloudStatus();
  var creds=credentials();
  if(creds.token&&creds.id)setTimeout(function(){requestCloudSave({manual:false,reason:'online-retry'})},1000)
 });
 window.addEventListener('offline',renderCloudStatus);
 window.addEventListener('beforeunload',function(event){
  if(saveInFlight||window._dataDirty===true){event.preventDefault();event.returnValue=''}
 });
 window.addEventListener('load',function(){
  writeCredentials(credentials(),true);
  renderCloudStatus();
  setTimeout(renderCloudStatus,800);
  setInterval(renderCloudStatus,30000)
 });
 document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='visible')renderCloudStatus()
 });

 if(!window.TCP_RELEASE){document.title=document.title.replace(/v612\b/,'v613');}
 window.TCP_CLOUD_RELIABILITY_V613={
  version:VERSION,
  save:function(manual){return requestCloudSave({manual:manual!==false,reason:'api'})},
  status:statusModel,
  render:renderCloudStatus,
  credentials:credentials,
  normalizeToken:cleanToken,
  inFlight:function(){return !!saveInFlight}
 };

 renderCloudStatus();
})();
