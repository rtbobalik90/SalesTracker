
(function(){
 'use strict';

 function clean(value){
  return String(value==null?'':value).trim();
 }
 function esc(value){
  if(typeof window._rp2Esc==='function')return window._rp2Esc(String(value==null?'':value));
  return String(value==null?'':value).replace(/[&<>\"]/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[character];
  });
 }
 function cloudLabel(){
  try{
   if(typeof window._rpCloudAgeLabel==='function')return clean(window._rpCloudAgeLabel());
  }catch(error){}
  try{
   var stamp=window._tcpStorageMeta&&(_tcpStorageMeta.lastHydrated||_tcpStorageMeta.lastSaved);
   if(stamp){
    var date=new Date(stamp);
    if(!isNaN(date.getTime()))return'Cloud updated '+date.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
   }
  }catch(error){}
  return'Cloud data available';
 }
 function periodControls(){
  var html='';
  try{
   if(typeof window._rp2PeriodControls==='function')html=window._rp2PeriodControls();
  }catch(error){}
  if(!html)return'';
  var wrapper=document.createElement('div');
  wrapper.innerHTML=html;
  var context=wrapper.querySelector('.rp2-context');
  if(!context)return'';
  Array.prototype.forEach.call(
   context.querySelectorAll('.rp2-cloud-refresh,.rp2-cloud-age,.rp2-readonly'),
   function(node){node.remove();}
  );
  return context.outerHTML;
 }
 function ensurePeriodRow(){
  var command=document.querySelector('#rp-overlay .ps68-command');
  if(!command||command.querySelector('.ps71-period-row'))return;
  var row=document.createElement('div');
  row.className='ps71-period-row';
  row.innerHTML='<div class="ps71-period-copy"><strong>My Day Command Center</strong><span>Select the reporting period without leaving today’s workspace.</span></div>'+periodControls();
  command.insertBefore(row,command.firstChild);
 }
 function applyMode(){
  var main=document.querySelector('#rp-overlay .rp2-main');
  if(!main)return;
  var home=!!main.querySelector('.ps68-home');
  main.classList.toggle('ps71-home-mode',home);
  if(home)ensurePeriodRow();
 }
 function installAdminNav(){
  try{
   if(typeof RP2_NAV!=='undefined'&&Array.isArray(RP2_NAV)){
    var exists=RP2_NAV.some(function(group){
     return Array.isArray(group.items)&&group.items.some(function(item){return item&&item[0]==='portaladmin';});
    });
    if(!exists)RP2_NAV.push({g:'System',items:[['portaladmin','Admin','⚙️']]});
   }
  }catch(error){console.warn('[v571 admin nav]',error);}
 }
 function adminPage(){
  return'<div class="ps71-admin">'+
   '<section class="ps71-admin-hero"><div><div class="ps71-admin-kick">Rep Portal Administration</div><h1>Admin & Data Access</h1><p>Cloud refresh, access mode, and portal-level system information are kept here so the My Day workspace stays focused on customers and selling activity.</p></div><button class="ps71-admin-btn" onclick="_rp2Go(\'home\')">Return to My Day →</button></section>'+
   '<div class="ps71-admin-grid">'+
    '<section class="ps71-admin-card"><div class="ps71-admin-icon">↻</div><h2>Cloud Data</h2><p>Pull the newest manager-saved cloud snapshot into the Rep Portal. This refreshes portal data without changing the rep’s read-only access level.</p><div class="ps71-admin-status"><span>Current cloud status</span><strong id="ps71-cloud-label">'+esc(cloudLabel())+'</strong></div><div class="ps71-admin-actions"><button class="ps71-admin-btn primary" onclick="_ps71RefreshCloud(this)">Refresh Cloud Data</button></div><div id="ps71-admin-message" class="ps71-admin-message"></div></section>'+
    '<section class="ps71-admin-card"><div class="ps71-admin-icon">●</div><h2>Access Mode</h2><p>The Rep Portal is intentionally read only for shared manager-controlled records. Rep actions and allowed local workflow updates continue to use their existing controls.</p><div class="ps71-admin-status readonly"><span>Portal permission</span><strong>● Read Only</strong></div></section>'+
    '<section class="ps71-admin-card"><div class="ps71-admin-icon">▦</div><h2>Reporting Period</h2><p>Year, quarter, month, and week selectors now live inside the My Day command header. This keeps the selected context visible without a second identity bar.</p><div class="ps71-admin-status"><span>Current selection</span><strong>'+esc((function(){try{return getQ()+' '+getYr();}catch(error){return'Current period';}})())+'</strong></div><div class="ps71-admin-actions"><button class="ps71-admin-btn" onclick="_rp2Go(\'home\')">Open Period Controls</button></div></section>'+
   '</div></div>';
 }

 window._ps71RefreshCloud=function(button){
  var message=document.getElementById('ps71-admin-message');
  if(message)message.textContent='Refreshing cloud data…';
  try{
   var result=typeof window._rp2RefreshCloud==='function'?window._rp2RefreshCloud(button,false):null;
   Promise.resolve(result).then(function(){
    setTimeout(function(){
     var label=document.getElementById('ps71-cloud-label');
     if(label)label.textContent=cloudLabel();
     var current=document.getElementById('ps71-admin-message');
     if(current)current.textContent='Cloud refresh complete.';
    },120);
   }).catch(function(error){
    var current=document.getElementById('ps71-admin-message');
    if(current)current.textContent='Cloud refresh did not complete: '+clean(error&&error.message||error);
   });
  }catch(error){
   if(message)message.textContent='Cloud refresh did not complete: '+clean(error&&error.message||error);
  }
 };

 installAdminNav();

 var priorPage=window._rp2Page;
 window._rp2Page=function(){
  if(window._rp2&&_rp2.page==='portaladmin')return adminPage();
  return typeof priorPage==='function'?priorPage.apply(this,arguments):'';
 };

 var priorAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof priorAfter==='function'?priorAfter.apply(this,arguments):undefined;
  installAdminNav();
  setTimeout(applyMode,0);
  return result;
 };

 var priorGo=window._rp2Go;
 if(typeof priorGo==='function'&&!priorGo._ps71){
  var go=function(){
   installAdminNav();
   var result=priorGo.apply(this,arguments);
   setTimeout(applyMode,0);
   return result;
  };
  go._ps71=true;
  window._rp2Go=go;
 }

 window.TCP_REP_MY_DAY_COMMAND_HEADER_V571={
  version:'v571',
  applyMode:applyMode,
  adminPage:adminPage,
  installAdminNav:installAdminNav
 };

 setTimeout(function(){
  try{
   installAdminNav();
   if(window._rp2&&_rp2.rep&&typeof window._rp2Go==='function')window._rp2Go(_rp2.page||'home');
   else applyMode();
  }catch(error){console.warn('[v571 command header]',error);}
 },0);
})();
