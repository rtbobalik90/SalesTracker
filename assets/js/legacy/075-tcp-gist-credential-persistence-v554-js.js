
(function(){
 'use strict';

 var VERSION='v554';
 var DEVICE_DB='tcp_sales_tracker_device_settings';
 var DEVICE_DB_VERSION=1;
 var DEVICE_STORE='settings';
 var DEVICE_KEY='github-gist-credentials';
 var baseSaveToCloud=window.saveToCloud;
 var baseLoadFromCloud=window.loadFromCloud;
 var baseTestGistToken=window.testGistToken;
 var baseInitAdmin=window.initAdmin;
 var baseAutoSave=window._gistAutoSave;
 var writeChain=Promise.resolve();
 var readyPromise=null;

 function clean(value){return String(value==null?'':value).trim()}
 function localCreds(){
  var token='',id='';
  try{
   token=clean(localStorage.getItem(GIST_TOKEN_STORE));
   id=clean(localStorage.getItem(GIST_ID_STORE))
  }catch(e){}
  return{token:token,id:id}
 }
 function uiCreds(){
  var tokenInput=document.getElementById('gistTokenInput');
  var idInput=document.getElementById('gistIdInput');
  return{
   token:clean(tokenInput&&tokenInput.value),
   id:clean(idInput&&idInput.value)
  }
 }
 function mergeCreds(){
  var args=[].slice.call(arguments),out={token:'',id:''};
  args.forEach(function(value){
   value=value||{};
   if(!out.token&&clean(value.token))out.token=clean(value.token);
   if(!out.id&&clean(value.id))out.id=clean(value.id)
  });
  if(!out.id&&typeof BAKED_GIST_ID!=='undefined')out.id=clean(BAKED_GIST_ID);
  return out
 }
 function openDeviceDb(){
  return new Promise(function(resolve,reject){
   if(typeof indexedDB==='undefined')return reject(new Error('IndexedDB is unavailable.'));
   var request=indexedDB.open(DEVICE_DB,DEVICE_DB_VERSION);
   request.onupgradeneeded=function(){
    var db=request.result;
    if(!db.objectStoreNames.contains(DEVICE_STORE))db.createObjectStore(DEVICE_STORE)
   };
   request.onsuccess=function(){resolve(request.result)};
   request.onerror=function(){reject(request.error||new Error('Could not open the device credential vault.'))}
  })
 }
 function vaultGet(){
  return openDeviceDb().then(function(db){
   return new Promise(function(resolve,reject){
    var tx=db.transaction(DEVICE_STORE,'readonly');
    var request=tx.objectStore(DEVICE_STORE).get(DEVICE_KEY);
    request.onsuccess=function(){var value=request.result||null;db.close();resolve(value)};
    request.onerror=function(){var error=request.error||new Error('Credential vault read failed.');db.close();reject(error)}
   })
  }).catch(function(){return null})
 }
 function vaultPut(creds){
  creds=creds||{};
  var record={
   version:1,
   token:clean(creds.token),
   id:clean(creds.id),
   updatedAt:new Date().toISOString()
  };
  writeChain=writeChain.then(function(){
   return openDeviceDb().then(function(db){
    return new Promise(function(resolve,reject){
     var tx=db.transaction(DEVICE_STORE,'readwrite');
     tx.objectStore(DEVICE_STORE).put(record,DEVICE_KEY);
     tx.oncomplete=function(){db.close();resolve(record)};
     tx.onerror=function(){var error=tx.error||new Error('Credential vault write failed.');db.close();reject(error)};
     tx.onabort=function(){var error=tx.error||new Error('Credential vault write was aborted.');db.close();reject(error)}
    })
   })
  }).catch(function(error){
   console.warn('[v554 credential vault]',error);
   return record
  });
  return writeChain
 }
 function writeLocal(creds){
  creds=creds||{};
  try{
   if(clean(creds.token))localStorage.setItem(GIST_TOKEN_STORE,clean(creds.token));
   if(clean(creds.id))localStorage.setItem(GIST_ID_STORE,clean(creds.id))
  }catch(e){console.warn('[v554 local credentials]',e)}
  return creds
 }
 function writeUi(creds){
  creds=creds||{};
  var tokenInput=document.getElementById('gistTokenInput');
  var idInput=document.getElementById('gistIdInput');
  if(tokenInput&&clean(creds.token)&&clean(tokenInput.value)!==clean(creds.token))tokenInput.value=clean(creds.token);
  if(idInput&&clean(creds.id)&&clean(idInput.value)!==clean(creds.id))idInput.value=clean(creds.id);
  return creds
 }
 async function restoreCredentials(){
  var vault=await vaultGet();
  var creds=mergeCreds(uiCreds(),localCreds(),vault);
  writeLocal(creds);
  writeUi(creds);
  if(clean(creds.token)||clean(creds.id))await vaultPut(creds);
  return creds
 }
 async function captureCredentials(){
  var vault=await vaultGet();
  var creds=mergeCreds(uiCreds(),localCreds(),vault);
  writeLocal(creds);
  writeUi(creds);
  await vaultPut(creds);
  return creds
 }
 async function reassertCredentials(creds){
  creds=mergeCreds(creds,localCreds(),await vaultGet());
  writeLocal(creds);
  writeUi(creds);
  await vaultPut(creds);
  return creds
 }

 /*
   These two global functions are still used by the existing input oninput
   attributes. They now update both localStorage and the device-only vault.
 */
 window.saveGistToken=function(){
  var ui=uiCreds(),existing=localCreds();
  var creds={token:ui.token,id:ui.id||existing.id};
  try{
   if(ui.token)localStorage.setItem(GIST_TOKEN_STORE,ui.token);
   else localStorage.removeItem(GIST_TOKEN_STORE)
  }catch(e){}
  vaultPut(creds)
 };
 window.saveGistId=function(){
  var ui=uiCreds(),existing=localCreds();
  var creds={token:ui.token||existing.token,id:ui.id};
  try{
   if(ui.id)localStorage.setItem(GIST_ID_STORE,ui.id);
   else localStorage.removeItem(GIST_ID_STORE)
  }catch(e){}
  vaultPut(creds)
 };

 window.saveToCloud=async function(){
  var creds=await restoreCredentials();
  if(!creds.id){
   _gistStatus('⚠ No Gist ID is available. Enter the existing Gist ID before saving.','#EF9F27');
   return
  }
  try{
   return await baseSaveToCloud.apply(this,arguments)
  }finally{
   await reassertCredentials(creds)
  }
 };

 window.loadFromCloud=async function(){
  var creds=await restoreCredentials();
  if(!creds.id){
   _gistStatus('⚠ No Gist ID is available. Enter the existing Gist ID before loading.','#EF9F27');
   return
  }
  try{
   return await baseLoadFromCloud.apply(this,arguments)
  }finally{
   /*
     The existing loader schedules a page reload after success. Reasserting here
     happens before that reload and prevents restored tracker data from changing
     the device's cloud connection.
   */
   await reassertCredentials(creds)
  }
 };

 if(typeof baseTestGistToken==='function'){
  window.testGistToken=async function(){
   var creds=await restoreCredentials();
   try{return await baseTestGistToken.apply(this,arguments)}
   finally{await reassertCredentials(creds)}
  }
 }

 if(typeof baseAutoSave==='function'){
  window._gistAutoSave=async function(){
   var creds=await restoreCredentials();
   if(!creds.token||!creds.id)return;
   try{return await baseAutoSave.apply(this,arguments)}
   finally{await reassertCredentials(creds)}
  }
 }

 if(typeof baseInitAdmin==='function'){
  window.initAdmin=function(){
   var result=baseInitAdmin.apply(this,arguments);
   setTimeout(function(){restoreCredentials()},0);
   setTimeout(function(){restoreCredentials()},150);
   return result
  }
 }

 /*
   If another module redraws the Admin page, restore the two fields without
   requiring another save/load click.
 */
 var observer=new MutationObserver(function(){
  var tokenInput=document.getElementById('gistTokenInput');
  var idInput=document.getElementById('gistIdInput');
  if((tokenInput&&!clean(tokenInput.value))||(idInput&&!clean(idInput.value))){
   restoreCredentials()
  }
 });
 if(document.body)observer.observe(document.body,{childList:true,subtree:true});

 window.addEventListener('pagehide',function(){
  captureCredentials()
 });
 document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden')captureCredentials()
 });

 readyPromise=restoreCredentials();
 window._tcpGistCredentialsReady=readyPromise;

 window.TCP_GIST_CREDENTIALS_V554={
  version:VERSION,
  database:DEVICE_DB,
  ready:function(){return readyPromise||restoreCredentials()},
  restore:restoreCredentials,
  capture:captureCredentials,
  diagnostics:async function(){
   var vault=await vaultGet(),local=localCreds(),ui=uiCreds();
   return{
    version:VERSION,
    localHasToken:!!local.token,
    localGistId:local.id,
    vaultHasToken:!!(vault&&vault.token),
    vaultGistId:clean(vault&&vault.id),
    uiHasToken:!!ui.token,
    uiGistId:ui.id,
    cloudPayloadExcludesCredentials:
     typeof _isTrackerKey==='function'&&!_isTrackerKey(GIST_TOKEN_STORE)&&!_isTrackerKey(GIST_ID_STORE)
   }
  },
  _vaultGet:vaultGet,
  _vaultPut:vaultPut
 };
})();
