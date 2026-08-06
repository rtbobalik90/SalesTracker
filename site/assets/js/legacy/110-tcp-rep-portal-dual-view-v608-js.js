
(function(){
 'use strict';
 if(!window._rp2Html||!window._rp2Page||!window._rp2Go||typeof RP2_NAV==='undefined')return;
 var VERSION='v608';
 var FULL_NAV=JSON.parse(JSON.stringify(RP2_NAV));
 var PHASE_NAV=[
  {g:'My Day',items:[
   ['home','My Day','🏠'],
   ['call','Call Workspace','☎'],
   ['action','Today’s Business','☑']
  ]},
  {g:'Customers & Sales',items:[
   ['customers','Companies','🏢'],
   ['dealdesk','Quotes','📄'],
   ['orders','Orders','📦']
  ]},
  {g:'My Profile',items:[
   ['profile','My Profile','👤']
  ]}
 ];
 var PHASE_PAGES={home:1,call:1,action:1,customers:1,dealdesk:1,orders:1,profile:1};
 var baseHtml=window._rp2Html;
 var basePage=window._rp2Page;
 var baseGo=window._rp2Go;
 function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
 function storageKey(rep){return'tcp.repPortal.viewMode.v608.'+String(rep||'default').toLowerCase().replace(/[^a-z0-9]+/g,'-')}
 function mode(rep){
  var m='full';
  try{m=localStorage.getItem(storageKey(rep||(_rp2&&_rp2.rep)))||'full'}catch(e){}
  return m==='phased'?'phased':'full'
 }
 function modeSwitch(current){
  return'<div class="rp2-view-mode" role="group" aria-label="Rep portal view mode">'
   +'<div class="rp2-view-mode-label"><span>Portal View</span><span>'+(current==='phased'?'Phase 1':'Master')+'</span></div>'
   +'<div class="rp2-view-mode-buttons">'
    +'<button type="button" class="rp2-view-mode-btn '+(current==='full'?'on':'')+'" onclick="_rp2SetPortalMode(\'full\')">Full</button>'
    +'<button type="button" class="rp2-view-mode-btn '+(current==='phased'?'on':'')+'" onclick="_rp2SetPortalMode(\'phased\')">Phased</button>'
   +'</div>'
   +'<div class="rp2-view-mode-copy">'+(current==='phased'?'Focused rollout with only approved Phase 1 workflows.':'Complete portal with every current module and feature.')+'</div>'
  +'</div>'
 }
 function phaseCard(page,icon,title,copy,glow){
  return'<button class="rp2-phase-card" style="--phase-glow:'+glow+'" onclick="_rp2Go(\''+page+'\')"><div><div class="rp2-phase-card-icon">'+icon+'</div><strong>'+esc(title)+'</strong><p>'+esc(copy)+'</p></div><span>Open workspace →</span></button>'
 }
 function phaseHome(){
  var first=String((_rp2&&_rp2.rep)||'Rep').split(/\s+/)[0]||'Rep';
  return'<div class="rp2-phase-home">'
   +'<header class="rp2-phase-hero"><div><div class="rp2-phase-kicker">PHASED WORKSPACE · FOCUSED ROLLOUT · BUILD '+VERSION+'</div><h1>'+esc(first)+'’s focused workspace</h1><p>Use the essential customer workflow while new modules are introduced in controlled phases. This view uses the exact same customer, task, call, quote, order, and profile data as Full Workspace—only the presentation and available navigation are simplified.</p></div><div class="rp2-phase-badge"><strong>1</strong><span>Current phase</span></div></header>'
   +'<section class="rp2-phase-section"><div class="rp2-phase-section-head"><div><h2>Core daily workflow</h2><p>The approved Phase 1 path from prioritization through customer execution.</p></div><span class="rp2-phase-pill">Available now</span></div><div class="rp2-phase-grid">'
    +phaseCard('call','☎','Call Workspace','Prepare the account, place the call, capture notes, and complete the outcome.','rgba(0,175,239,.23)')
    +phaseCard('action','☑','Today’s Business','Work commitments, overdue promises, waiting items, and next best actions.','rgba(250,135,61,.24)')
    +phaseCard('customers','🏢','Companies','Open customer profiles, relationship history, products, contacts, and activity.','rgba(71,209,108,.22)')
   +'</div></section>'
   +'<section class="rp2-phase-section"><div class="rp2-phase-section-head"><div><h2>Supporting tools</h2><p>Focused access to the transaction and rep records needed by the core workflow.</p></div><span class="rp2-phase-pill">Shared data</span></div><div class="rp2-phase-grid">'
    +phaseCard('dealdesk','📄','Quotes','Review and work customer quote activity without opening the full portal.','rgba(250,135,61,.22)')
    +phaseCard('orders','📦','Orders','Review current and historical customer order records.','rgba(239,159,39,.22)')
    +phaseCard('profile','👤','My Profile','View personal information and the limited performance details released in this phase.','rgba(155,107,255,.22)')
   +'</div></section>'
   +'<div class="rp2-phase-note"><span>ℹ</span><div><b>Full Workspace remains the master build.</b> Switching views does not copy, split, or reset data. Any work completed here is immediately available in the full portal.</div></div>'
  +'</div>'
 }
 window._rp2Page=function(){
  /* The approved Full Workspace My Day is the source of truth in both modes. */
  return basePage.apply(this,arguments)
 };
 window._rp2Html=function(rep){
  var current=mode(rep),previous=RP2_NAV,html='';
  try{
   RP2_NAV=current==='phased'?JSON.parse(JSON.stringify(PHASE_NAV)):JSON.parse(JSON.stringify(FULL_NAV));
   html=baseHtml.call(this,rep)
  }finally{
   RP2_NAV=JSON.parse(JSON.stringify(FULL_NAV))
  }
  html=String(html||'').replace('class="rp2-app"','class="rp2-app rp2-mode-'+current+'" data-rp-portal-mode="'+current+'"');
  html=html.replace(/(<div class="rp2-logo">[\s\S]*?<\/div>)/,function(all){return all+modeSwitch(current)});
  return html
 };
 window._rp2Go=function(page){
  var current=mode();
  if(current==='phased'&&!PHASE_PAGES[page])page='home';
  return baseGo.call(this,page)
 };
 window._rp2SetPortalMode=function(next){
  next=next==='phased'?'phased':'full';
  var rep=window._rp2&&_rp2.rep||'';
  try{localStorage.setItem(storageKey(rep),next)}catch(e){}
  if(next==='phased'&&(!window._rp2||!PHASE_PAGES[_rp2.page]))_rp2.page='home';
  if(window._rp2&&_rp2.rep)window._rp2Go(_rp2.page||'home')
 };
 window.TCP_REP_PORTAL_DUAL_VIEW_V608={
  version:VERSION,
  fullNav:FULL_NAV,
  phaseNav:PHASE_NAV,
  phasePages:PHASE_PAGES,
  getMode:mode,
  setMode:window._rp2SetPortalMode,
  phaseHome:phaseHome
 };
 function refreshLoadedPortal(){
  try{
   var overlay=document.getElementById('rp-overlay');
   if(overlay&&window._rp2&&_rp2.rep&&overlay.querySelector('.rp2-app')&&!overlay.querySelector('.rp2-view-mode'))window._rp2Go(_rp2.page||'home')
  }catch(e){console.warn('[Rep dual view '+VERSION+']',e)}
 }
 setTimeout(refreshLoadedPortal,0);
 setTimeout(refreshLoadedPortal,700);
 window.addEventListener('load',function(){setTimeout(refreshLoadedPortal,900)});
})();
