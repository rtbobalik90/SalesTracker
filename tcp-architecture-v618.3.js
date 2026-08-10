(function(){
 'use strict';
 if(window.__tcpV61831Finalized)return;
 window.__tcpV61831Finalized=true;
 var meta=window.TCP_RELEASE||{version:'v618.3.1',title:'Sales Tracker v618.3.1 — Data & Persistence',sub:'Data & Persistence Certification'};
 var router=window.TCP_ROUTER_V61831,runtime=window.TCP_RUNTIME_V61831;
 if(!router)throw new Error('v618.3.1 router core did not load.');

 var legacyManager=typeof window.gt==='function'?window.gt:null;
 var legacyRep=typeof window._rp2Go==='function'?window._rp2Go:null;
 if(legacyManager)router.manager.adopt(legacyManager);
 if(legacyRep)router.rep.adopt(legacyRep);
 window.gt=function(){return router.manager.go.apply(this,arguments)};
 window._rp2Go=function(){return router.rep.go.apply(this,arguments)};

 function stamp(){
  if(document.title!==meta.title)document.title=meta.title;
  var foot=document.querySelector('#tcp-v615-sidebar-footer .v615-sf-version'),fv='Sales Tracker '+meta.version;
  if(foot&&foot.textContent!==fv)foot.textContent=fv;
  try{document.querySelectorAll('.admin-status-card').forEach(function(card){var l=card.querySelector('.as-label'),v=card.querySelector('.as-value'),sub=card.querySelector('.as-sub');if(l&&String(l.textContent||'').trim()==='App Version'){if(v&&v.textContent!==meta.version)v.textContent=meta.version;if(sub&&sub.textContent!==meta.sub)sub.textContent=meta.sub}})}catch(e){}
  var app=window.TCP_APP||{};app.version=meta.version;app.release=meta;app.runtime=runtime;app.events=runtime&&runtime.events;app.router={manager:router.manager,rep:router.rep};app.architecture={version:meta.version,mode:'canonical-router-and-data-over-legacy-features',legacyFeatureLayer:true};window.TCP_APP=app;
  if(window.TCP_MANAGER_OS_V617){window.TCP_MANAGER_OS_V617.version=meta.version;window.TCP_MANAGER_OS_V618_3=window.TCP_MANAGER_OS_V617;window.TCP_MANAGER_OS_V618_2=window.TCP_MANAGER_OS_V618_2||window.TCP_MANAGER_OS_V617}
 }
 function diagnostics(){
  var base=runtime&&runtime.diagnostics?runtime.diagnostics():{};
  base.appVersion=(window.TCP_APP&&TCP_APP.version)||meta.version;
  base.managerVersion=(window.TCP_MANAGER_OS_V617&&TCP_MANAGER_OS_V617.version)||'';
  base.persistenceVersion=(window.TCP_PERSISTENT_DATA_V550&&TCP_PERSISTENT_DATA_V550.version)||'v550';
  base.dataVersion=(window.TCP_DATA_V61831&&TCP_DATA_V61831.version)||'';
  base.cloudVersion=(window.TCP_CLOUD_RELIABILITY_V613&&TCP_CLOUD_RELIABILITY_V613.version)||'v613';
  base.documentEndings={body:document.querySelectorAll('body').length,html:document.querySelectorAll('html').length};
  base.router=router.diagnostics();
  base.data=window.TCP_DATA_V61831&&TCP_DATA_V61831.diagnostics?TCP_DATA_V61831.diagnostics():null;
  base.architecture='v618.3.1 canonical router + canonical data facade + legacy feature layer';
  return base
 }
 window.tcpV61831Diagnostics=diagnostics;
 window.tcpV6181Diagnostics=window.tcpV6181Diagnostics||diagnostics;
 stamp();
 if(runtime&&runtime.events){runtime.events.on('route',function(){stamp()});runtime.events.emit('architecture:ready',{version:meta.version,router:router.diagnostics()})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stamp,{once:true});
 window.addEventListener('load',function(){setTimeout(stamp,0)},{once:true});
 try{console.info('[v618.3.1] Canonical architecture active',diagnostics())}catch(e){}
})();
