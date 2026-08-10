(function(){
 'use strict';
 if(window.TCP_DATA_V6183)return;

 var VERSION='v618.3.1';
 var runtime=window.TCP_RUNTIME_V6183||window.TCP_RUNTIME_V6182||null;
 var events=runtime&&runtime.events;
 var AUTO_CLOUD_MS=5*60*1000;
 var INITIAL_CLOUD_MS=60*1000;
 var schedule={started:false,initialTimer:null,autoTimer:null,lastAttempt:'',lastResult:null};

 function now(){return new Date().toISOString()}
 function clean(v){return String(v==null?'':v).trim()}
 function clone(v){
  if(v==null||typeof v!=='object')return v;
  if(typeof structuredClone==='function'){try{return structuredClone(v)}catch(e){}}
  return JSON.parse(JSON.stringify(v))
 }
 function arr(v){return Array.isArray(v)?v:[]}
 function obj(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
 function count(v){return Array.isArray(v)?v.length:(obj(v)?Object.keys(v).length:0)}
 function persistence(){return window.TCP_PERSISTENT_DATA_V550||null}
 function cloud(){return window.TCP_CLOUD_RELIABILITY_V613||null}
 function liveState(){
  var p=persistence();
  try{if(p&&typeof p.currentState==='function')return p.currentState()}catch(e){}
  try{if(window.TCP_DATA_INTEGRITY_V564&&typeof TCP_DATA_INTEGRITY_V564.captureState==='function')return TCP_DATA_INTEGRITY_V564.captureState()}catch(e){}
  try{return clone(window.S||{})}catch(e){return{}}
 }
 function fnv1a(text){
  var hash=2166136261;
  for(var i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash+=(hash<<1)+(hash<<4)+(hash<<7)+(hash<<8)+(hash<<24)}
  return('00000000'+(hash>>>0).toString(16)).slice(-8)
 }
 function fingerprint(state){var raw=JSON.stringify(state||{});return{hash:fnv1a(raw),bytes:raw.length}}
 function counts(state){
  state=state||liveState();
  return{
   reps:count(state.reps),weekly:count(state.data),goals:count(state.goals),customers:count(state.customers),orders:count(state.orders),lineItems:count(state.orderLineItems),
   credits:count(state.cms),artErrors:count(state.artErrors),hr:count(state.hrViolations),coaching:count(state.coachingNotes),reports:count(state.reportHistory),
   dailySales:count(state.dailyRep),dailyCalls:count(state.dailyCalls),dailyBridge:count(state.dailyLiveBridge),managerActions:count(state.managerOS&&state.managerOS.actions)
  }
 }
 function stateContract(state){
  state=state||liveState();
  var checks=[];
  function push(level,key,detail){checks.push({level:level,key:key,detail:detail})}
  push(Array.isArray(state.reps)?'pass':'fail','reps',Array.isArray(state.reps)?state.reps.length+' reps':'Expected reps to be an array');
  push(obj(state.data)?'pass':'fail','weekly-data',obj(state.data)?Object.keys(state.data).length+' weekly records':'Expected data to be an object');
  push(obj(state.goals)?'pass':'fail','goals',obj(state.goals)?Object.keys(state.goals).length+' rep goal groups':'Expected goals to be an object');
  ['cms','artErrors','hrViolations','coachingNotes'].forEach(function(k){push(Array.isArray(state[k])?'pass':'fail',k,Array.isArray(state[k])?state[k].length+' records':'Expected '+k+' to be an array')});
  if(state.reportHistory!=null)push(Array.isArray(state.reportHistory)?'pass':'fail','report-history',Array.isArray(state.reportHistory)?state.reportHistory.length+' reports':'reportHistory is present but is not an array');
  else push('warn','report-history','reportHistory has not been hydrated into state yet');
  var names=arr(state.reps).map(function(r){return clean(typeof r==='string'?r:r&&r.name)}).filter(Boolean),seen={},dupes=[];
  names.forEach(function(n){var k=n.toLowerCase();if(seen[k])dupes.push(n);seen[k]=1});
  push(dupes.length?'fail':'pass','rep-identity',dupes.length?'Duplicate rep names: '+dupes.join(', '):'Rep names are unique');
  var badWeekly=0,aliasWeekly=0,totalWeekly=0;
  if(obj(state.data))Object.keys(state.data).forEach(function(k){totalWeekly++;var d=state.data[k];if(!obj(d)||k.indexOf('|')<1)badWeekly++;if(obj(d)&&d.calls!=null&&d.acctsCalled!=null&&Number(d.calls)===Number(d.acctsCalled)&&Number(d.calls)>0)aliasWeekly++});
  push(badWeekly?'warn':'pass','weekly-record-shape',badWeekly?badWeekly+' weekly keys/records have a nonstandard shape':totalWeekly+' weekly records have expected key/object shape');
  push(aliasWeekly?'info':'pass','calls-coverage-legacy-alias',aliasWeekly?aliasWeekly+' weekly records store calls and customers-called as the same value; preserved for backward compatibility and not auto-migrated in v618.3':'No calls/coverage legacy aliases detected');
  var failures=checks.filter(function(x){return x.level==='fail'}).length,warnings=checks.filter(function(x){return x.level==='warn'}).length;
  return{version:VERSION,at:now(),checks:checks,failures:failures,warnings:warnings,passes:checks.filter(function(x){return x.level==='pass'}).length,info:checks.filter(function(x){return x.level==='info'}).length}
 }
 async function ready(){var p=persistence();if(!p||typeof p.ready!=='function')throw new Error('Verified persistence engine v550 is unavailable.');return p.ready()}
 async function saveNow(reason){
  var p=persistence();await ready();
  if(!p||typeof p.saveNow!=='function')throw new Error('Verified persistence save is unavailable.');
  var record=await p.saveNow(reason||'v618.3-save');
  if(events)events.emit('data:saved',{version:VERSION,reason:reason||'v618.3-save',savedAt:record&&record.savedAt||now(),counts:record&&record.counts||counts()});
  return record
 }
 async function loadActive(){var p=persistence();await ready();return p&&typeof p.loadActive==='function'?p.loadActive():null}
 async function loadPrevious(){var p=persistence();await ready();return p&&typeof p.loadPrevious==='function'?p.loadPrevious():null}
 async function restore(state,auxiliary,source){
  var p=persistence();await ready();
  if(!p||typeof p.restoreState!=='function')throw new Error('Verified restore is unavailable.');
  var r=await p.restoreState(state,auxiliary||{},source||'v618.3-restore');
  if(events)events.emit('data:restored',{version:VERSION,source:source||'v618.3-restore',savedAt:r&&r.savedAt||now()});
  return r
 }
 async function restorePrevious(){var prior=await loadPrevious();if(!prior)throw new Error('No verified previous snapshot is available.');return restore(prior,{},'v618.3-rollback')}
 function cloudStatus(){var c=cloud();try{return c&&typeof c.status==='function'?c.status():{key:'unavailable',label:'Unavailable',sub:'Cloud coordinator v613 not loaded',problem:true}}catch(e){return{key:'error',label:'Error',sub:e.message||String(e),problem:true}}}
 async function cloudSave(manual){
  await saveNow(manual===false?'v618.3-before-auto-cloud':'v618.3-before-manual-cloud');
  var c=cloud();if(!c||typeof c.save!=='function')throw new Error('Cloud coordinator v613 is unavailable.');
  schedule.lastAttempt=now();
  var result=await c.save(manual!==false);
  schedule.lastResult={at:now(),ok:result!==false,manual:manual!==false};
  if(events)events.emit('data:cloud-save',schedule.lastResult);
  return result
 }
 async function cloudLoad(){
  if(typeof window.loadFromCloud!=='function')throw new Error('Cloud restore is unavailable.');
  return window.loadFromCloud()
 }
 function stopCloudSchedule(){
  if(schedule.initialTimer){clearTimeout(schedule.initialTimer);schedule.initialTimer=null}
  if(schedule.autoTimer){clearInterval(schedule.autoTimer);schedule.autoTimer=null}
  schedule.started=false
 }
 function startCloudSchedule(){
  if(schedule.started)return;
  schedule.started=true;
  schedule.initialTimer=setTimeout(function(){
   schedule.initialTimer=null;
   if(typeof document!=='undefined'&&document.visibilityState==='hidden')return;
   cloudSave(false).catch(function(e){schedule.lastResult={at:now(),ok:false,error:e&&e.message||String(e),manual:false};console.warn('[v618.3 startup cloud safety]',e)})
  },INITIAL_CLOUD_MS);
  schedule.autoTimer=setInterval(function(){
   if(typeof document!=='undefined'&&document.visibilityState==='hidden')return;
   var c=cloud();if(c&&typeof c.inFlight==='function'&&c.inFlight())return;
   cloudSave(false).catch(function(e){schedule.lastResult={at:now(),ok:false,error:e&&e.message||String(e),manual:false};console.warn('[v618.3 periodic cloud safety]',e)})
  },AUTO_CLOUD_MS)
 }
 async function asyncDiagnostics(){
  var p=persistence(),pd=null,active=null,previous=null;
  try{await ready()}catch(e){}
  try{pd=p&&typeof p.diagnostics==='function'?await p.diagnostics():null}catch(e){pd={error:e&&e.message||String(e)}}
  try{active=await loadActive()}catch(e){}
  try{previous=await loadPrevious()}catch(e){}
  var current=liveState(),cf=fingerprint(current),af=active?fingerprint(active):null,pf=previous?fingerprint(previous):null;
  return{
   version:VERSION,at:now(),counts:counts(current),contract:stateContract(current),currentFingerprint:cf,activeFingerprint:af,previousFingerprint:pf,
   currentMatchesActive:!!(af&&af.hash===cf.hash&&af.bytes===cf.bytes),previousAvailable:!!previous,persistence:pd,cloud:cloudStatus(),cloudSchedule:{started:schedule.started,lastAttempt:schedule.lastAttempt,lastResult:schedule.lastResult,intervalMs:AUTO_CLOUD_MS}
  }
 }
 function diagnostics(){
  var state=liveState(),meta=window._tcpPersistentMeta||{};
  return{version:VERSION,ready:!!(persistence()&&persistence().isReady&&persistence().isReady()),mode:meta.mode||'',counts:counts(state),contract:stateContract(state),cloud:cloudStatus(),cloudSchedule:{started:schedule.started,lastAttempt:schedule.lastAttempt,lastResult:schedule.lastResult,intervalMs:AUTO_CLOUD_MS}}
 }
 async function certify(options){
  options=options||{};
  var checks=[];
  function check(level,name,detail){checks.push({level:level,name:name,detail:detail})}
  var p=persistence();
  if(!p){check('fail','Verified persistence engine','v550 engine missing');return{version:VERSION,at:now(),checks:checks,failures:1,warnings:0}}
  try{await ready();check('pass','Persistence boot','Verified persistence engine is ready')}catch(e){check('fail','Persistence boot',e&&e.message||String(e))}
  var contract=stateContract(liveState());
  check(contract.failures?'fail':contract.warnings?'warn':'pass','State contract',contract.failures+' failures · '+contract.warnings+' warnings');
  var pd=null;try{pd=await p.diagnostics();check(pd&&pd.activeValid?'pass':'warn','Active verified snapshot',pd&&pd.activeValid?'Active IndexedDB snapshot verifies':'No verified active snapshot yet')}catch(e){check('fail','Persistence diagnostics',e&&e.message||String(e))}
  if(options.write){try{await saveNow('v618.3-certification');check('pass','Verified save','Current state staged, verified, and committed')}catch(e){check('fail','Verified save',e&&e.message||String(e))}}
  var current=liveState(),active=null;try{active=await loadActive()}catch(e){}
  if(active){var a=fingerprint(active),c=fingerprint(current);check(a.hash===c.hash&&a.bytes===c.bytes?'pass':'warn','Reload parity',a.hash===c.hash&&a.bytes===c.bytes?'Current state matches active snapshot':'Current state has unsaved changes relative to active snapshot')}
  else check('warn','Reload parity','No active snapshot available to compare');
  var prev=null;try{prev=await loadPrevious()}catch(e){}
  check(prev?'pass':'warn','Rollback snapshot',prev?'A verified previous snapshot is available':'No previous snapshot yet; one appears after a later verified save');
  var cs=cloudStatus();check(cs.problem?'warn':'pass','Cloud coordinator',clean(cs.label)+' · '+clean(cs.sub));
  var failures=checks.filter(function(x){return x.level==='fail'}).length,warnings=checks.filter(function(x){return x.level==='warn'}).length;
  var report={version:VERSION,at:now(),checks:checks,failures:failures,warnings:warnings,passes:checks.filter(function(x){return x.level==='pass'}).length,contract:contract};
  if(events)events.emit('data:certified',report);
  return report
 }
 function esc(v){return clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;')}
 function adminHost(){return document.querySelector('[data-v616-pane="data"]')||document.getElementById('pg-admin')}
 function renderAdminReport(report){
  var host=adminHost();if(!host)return;
  var box=document.getElementById('tcp-v6183-data-cert');
  if(!box){box=document.createElement('section');box.id='tcp-v6183-data-cert';box.style.cssText='margin-top:14px;border:1px solid rgba(0,175,239,.22);border-radius:14px;background:rgba(0,175,239,.04);padding:14px;';host.appendChild(box)}
  var d=diagnostics(),c=d.contract||{},pd=(report&&report.checks)||[];
  var rows=pd.length?pd.map(function(x){var col=x.level==='pass'?'#5DCAA5':x.level==='fail'?'#F09595':'#EF9F27';return '<div style="display:grid;grid-template-columns:90px 1fr;gap:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.06);font-size:11px"><strong style="color:'+col+'">'+esc(x.level.toUpperCase())+'</strong><span><b>'+esc(x.name)+'</b> · '+esc(x.detail)+'</span></div>'}).join(''):'<div style="font-size:11px;color:#8B8A94;margin-top:8px">Automatic cloud saving is paused in this recovery-safe build. Run certification to verify the active snapshot, rollback copy, state contract, and cloud coordinator.</div>';
  box.innerHTML='<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap"><div><div style="font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#8EDCFA">v618.3.1 Data Certification</div><div style="font-size:16px;font-weight:800;margin-top:3px">Verified persistence control center</div><div style="font-size:11px;color:#8B8A94;margin-top:5px">v550 IndexedDB engine · v613 serialized cloud engine · '+Number((d.counts||{}).weekly||0).toLocaleString()+' weekly records · '+Number((d.counts||{}).reps||0).toLocaleString()+' reps</div></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="sbtn" onclick="tcpV6183RunCertification(false)">Run certification</button><button class="sbtn entry-primary" onclick="tcpV6183RunCertification(true)">Save + certify</button></div></div><div style="margin-top:10px;font-size:10px;color:'+(c.failures?'#F09595':c.warnings?'#EF9F27':'#5DCAA5')+'">State contract: '+Number(c.failures||0)+' failures · '+Number(c.warnings||0)+' warnings · Cloud: '+esc((d.cloud&&d.cloud.label)||'Unknown')+'</div>'+rows
 }
 window.tcpV6183RunCertification=function(write){
  var box=document.getElementById('tcp-v6183-data-cert');if(box)box.style.opacity='.7';
  return certify({write:write===true}).then(function(report){renderAdminReport(report);return report}).catch(function(e){renderAdminReport({checks:[{level:'fail',name:'Certification error',detail:e&&e.message||String(e)}]});throw e}).finally(function(){var b=document.getElementById('tcp-v6183-data-cert');if(b)b.style.opacity='1'})
 };
 function mountAdmin(){try{renderAdminReport(null)}catch(e){console.warn('[v618.3 admin data panel]',e)}}
 function installFacade(){
  var app=window.TCP_APP||{};
  app.data={version:VERSION,diagnostics:diagnostics,asyncDiagnostics:asyncDiagnostics,certify:certify,contract:stateContract,counts:counts};
  app.state=Object.assign({},app.state||{},{get:liveState,snapshot:function(){return clone(liveState())},counts:function(){return counts(liveState())}});
  app.persistence={version:VERSION,engine:'v550',ready:ready,saveNow:saveNow,loadActive:loadActive,loadPrevious:loadPrevious,restore:restore,restorePrevious:restorePrevious,diagnostics:asyncDiagnostics};
  app.cloud={version:VERSION,engine:'v613',saveNow:function(){return cloudSave(true)},saveAuto:function(){return cloudSave(false)},load:cloudLoad,status:cloudStatus,credentials:function(){var c=cloud();return c&&typeof c.credentials==='function'?c.credentials():{}},inFlight:function(){var c=cloud();return !!(c&&typeof c.inFlight==='function'&&c.inFlight())},schedule:{start:startCloudSchedule,stop:stopCloudSchedule,status:function(){return clone(schedule)}}};
  window.TCP_APP=app
 }

 window.TCP_DATA_V6183={version:VERSION,ready:ready,state:liveState,snapshot:function(){return clone(liveState())},counts:counts,contract:stateContract,saveNow:saveNow,loadActive:loadActive,loadPrevious:loadPrevious,restore:restore,restorePrevious:restorePrevious,cloudSave:cloudSave,cloudLoad:cloudLoad,cloudStatus:cloudStatus,startCloudSchedule:startCloudSchedule,stopCloudSchedule:stopCloudSchedule,diagnostics:diagnostics,asyncDiagnostics:asyncDiagnostics,certify:certify,fingerprint:fingerprint};
 /* Canonicalize the two cloud-save entry points still used by legacy UI/features. */
 window.saveToCloud=function(){return cloudSave(true)};
 window._gistAutoSave=function(){return cloudSave(false)};
 window.tcpV6183DataDiagnostics=asyncDiagnostics;
 window.tcpV6183CertifyData=function(write){return certify({write:write===true})};
 installFacade();
 try{var r=window.TCP_ROUTER_V6183||window.TCP_ROUTER_V6182;if(r&&r.manager)r.manager.after('v6183-data-cert-admin',function(ctx){if(ctx.page==='admin')setTimeout(mountAdmin,80)},95)}catch(e){}
 window.addEventListener('load',function(){setTimeout(mountAdmin,950)},{once:true});
 ready().then(function(){installFacade();stopCloudSchedule();mountAdmin();if(events)events.emit('data:ready',{version:VERSION,diagnostics:diagnostics()})}).catch(function(e){console.error('[v618.3 data ready]',e);if(events)events.emit('data:error',{version:VERSION,error:e&&e.message||String(e)})});
})();
