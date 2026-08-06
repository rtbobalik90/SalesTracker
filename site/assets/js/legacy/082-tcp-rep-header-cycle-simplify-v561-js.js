
(function(){
 'use strict';

 function n(value){var number=Number(value);return isFinite(number)?number:0}
 function clean(value){return String(value==null?'':value).trim()}
 function esc(value){
  return typeof _rp2Esc==='function'?_rp2Esc(String(value==null?'':value)):
   String(value==null?'':value).replace(/[&<>"]/g,function(character){
    return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
   })
 }
 function fmtDate(value){
  try{
   var date=value instanceof Date?value:new Date(value);
   if(isNaN(date.getTime()))return'—';
   return date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  }catch(error){return'—'}
 }
 function cloudAge(){
  try{
   if(typeof _rpCloudAgeLabel==='function')return _rpCloudAgeLabel()
  }catch(error){}
  try{
   var meta=window._tcpStorageMeta||{};
   var stamp=meta.lastHydrated||meta.lastSaved;
   if(stamp){
    var date=new Date(stamp);
    if(!isNaN(date.getTime()))return'Updated '+date.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
   }
  }catch(error){}
  return'Cloud snapshot available'
 }
 function pace(rep){
  try{
   if(window.TCP_CALL_CYCLE_V547&&typeof TCP_CALL_CYCLE_V547.paceFor==='function'){
    return TCP_CALL_CYCLE_V547.paceFor(rep,new Date())
   }
  }catch(error){console.warn('[v561 call-cycle pace]',error)}
  return null
 }
 function tone(p){
  if(!p||n(p.size)===0)return{color:'#EF9F27',key:'empty',status:'Customer set not loaded'};
  if(p.tone==='complete')return{color:'#FA873D',key:'complete',status:p.status||'Milestone complete'};
  if(p.tone==='ahead')return{color:'#5DCAA5',key:'ahead',status:p.status||'Ahead of pace'};
  if(p.tone==='behind')return{color:'#F09595',key:'behind',status:p.status||'Behind pace'};
  return{color:'#00AFEF',key:'on',status:p.status||'On pace'}
 }
 function deltaText(p){
  if(!p||n(p.size)===0)return'Import or assign customers to begin the cycle.';
  if(n(p.delta)>0)return'Ahead by '+n(p.delta)+' customer'+(n(p.delta)===1?'':'s');
  if(n(p.delta)<0)return'Behind by '+Math.abs(n(p.delta))+' customer'+(n(p.delta)===-1?'':'s');
  return'Exactly on expected pace'
 }
 function periodLabel(){
  var parts=[];
  try{parts.push(getQ()+' '+getYr())}catch(error){}
  try{
   var month=document.getElementById('selM');
   if(month&&month.options&&month.selectedIndex>=0)parts.push(month.options[month.selectedIndex].text)
  }catch(error){}
  try{
   var week=document.getElementById('selW');
   if(week&&week.options&&week.selectedIndex>=0)parts.push(week.options[week.selectedIndex].text)
  }catch(error){}
  return parts.filter(Boolean).join(' · ')
 }
 function compactCycle(rep){
  var p=pace(rep),t=tone(p);
  if(!p){
   return'<section id="ps61-cycle" class="ps61-cycle" style="--ps61-tone:#EF9F27;--ps61-cycle-width:0%"><div class="ps61-cycle-main"><div class="ps61-cycle-kick">Call Cycle Status</div><div class="ps61-cycle-title">Calling-cycle data unavailable</div><div class="ps61-cycle-copy">Refresh the tracker data to load the adaptive calling plan.</div></div><div class="ps61-cycle-metrics"><div class="ps61-cycle-metric"><span>Status</span><strong>Unavailable</strong><small>No cycle data loaded</small></div></div><div class="ps61-cycle-actions"><button class="ps61-cycle-btn" onclick="_rp2RefreshCloud(this,false)">Refresh data</button></div></section>'
  }
  var size=n(p.size),completed=n(p.completed),overall=size>0?Math.min(100,n(p.completedPct)):0;
  var milestone=Math.min(100,n(p.milestoneAchievement));
  var todayCopy=p.businessToday?(n(p.todayRemaining)+' remaining today'):('Next requirement '+n(p.projectedNext));
  var evidence=n(p.attempted)+' calls · '+n(p.emailed)+' emails';
  var title=p.cycle&&p.cycle.label||'Annual Account Updates';
  return'<section id="ps61-cycle" class="ps61-cycle" style="--ps61-tone:'+t.color+';--ps61-cycle-width:'+overall+'%">'+
   '<div class="ps61-cycle-main"><div class="ps61-cycle-kick">Call Cycle Status</div><div class="ps61-cycle-title">'+esc(title)+'</div>'+
    '<div class="ps61-cycle-copy">A customer is complete after the call attempt and follow-up email are recorded.</div>'+
    '<div class="ps61-cycle-progress-head"><span>Full cycle progress</span><strong>'+overall+'%</strong></div><div class="ps61-cycle-bar"><i></i></div></div>'+
   '<div class="ps61-cycle-metrics">'+
    '<div class="ps61-cycle-metric"><span>Completed</span><strong>'+completed+' / '+size+'</strong><small>Called and emailed</small></div>'+
    '<div class="ps61-cycle-metric"><span>Milestone</span><strong>'+n(p.completedPct)+'% / '+n(p.targetPct)+'%</strong><small>'+milestone+'% achieved</small></div>'+
    '<div class="ps61-cycle-metric"><span>Today</span><strong>'+n(p.todayCompleted)+' / '+n(p.dailyTarget)+'</strong><small>'+esc(todayCopy)+'</small></div>'+
    '<div class="ps61-cycle-metric"><span>Evidence</span><strong>'+esc(evidence)+'</strong><small>Both required to complete</small></div>'+
   '</div>'+
   '<div class="ps61-cycle-actions"><div class="ps61-pace"><span>Current pace</span><strong>'+esc(t.status)+'</strong><small>'+esc(deltaText(p))+'</small></div>'+
    '<button class="ps61-cycle-btn primary" onclick="_rp2Go(\'call\')">Open '+n(p.todayRemaining)+' calls</button>'+
    '<button class="ps61-cycle-btn" onclick="_ps61OpenCycleDetails()">View details</button></div>'+
  '</section>'
 }
 function enhanceHome(){
  var base=window.TCP_PROJECT_SIMPLIFY_REP_V560;
  var html=base&&typeof base.home==='function'?base.home():'';
  if(!html)return html;
  var rep=window._rp2&&_rp2.rep||'';
  html=html.replace(
   '<div class="ps60-hero-main">',
   '<div class="ps60-hero-main">'
  );
  html=html.replace(
   /(<section class="ps60-hero">[\s\S]*?<div><h1>)/,
   '$1'
  );
  /* Add selected reporting context inside the greeting without making another bar. */
  html=html.replace(
   /(<div><h1>[\s\S]*?<\/h1>)/,
   '<div><div class="ps61-hero-period">'+esc(periodLabel())+'</div><h1>'+esc((function(){var h=new Date().getHours(),g=h<12?'Good morning':h<17?'Good afternoon':'Good evening';return g+', '+clean(rep).split(/\s+/)[0]+'.'})())+'</h1>'
  );
  /* The first closing section is the greeting hero. */
  var heroEnd=html.indexOf('</section>');
  if(heroEnd>=0)html=html.slice(0,heroEnd+10)+compactCycle(rep)+html.slice(heroEnd+10);
  return html
 }
 function stripLegacyControls(html){
  if(!html)return html;
  html=html.replace(/<button class="rp2-cloud-refresh"[\s\S]*?<\/button>/,'');
  html=html.replace(/<div class="rp2-cloud-age"[\s\S]*?<\/div>/,'');
  html=html.replace(/<div class="rp2-readonly"[\s\S]*?<\/div>/,'');
  return html
 }
 function cleanShell(rep){
  var base=window.TCP_PROJECT_SIMPLIFY_REP_V560;
  var html=base&&typeof base.shell==='function'?base.shell(rep):'';
  html=stripLegacyControls(html);
  html=html.replace('class="rp2-top"','class="rp2-top ps61-clean-top"');
  html=html.replace(
   '<div class="ps60-top-right">',
   '<div class="ps61-top-right"><div class="ps61-period-only">'
  );
  html=html.replace(
   '<div><button class="ps60-refresh"',
   '</div><div class="ps61-refresh-wrap"><button class="ps61-refresh"'
  );
  html=html.replace(
   '<div class="ps60-cloud-copy">',
   '<div class="ps61-cloud-age">'
  );
  html=html.replace(
   '<span class="ps60-readonly">Read only</span>',
   '<span class="ps61-readonly">Read only</span>'
  );
  return html
 }
 function removeLegacy(){
  var legacy=document.getElementById('cc547-rep-command');
  if(legacy)legacy.remove();
  var scale=document.getElementById('rp2-scale-control');
  if(scale)scale.remove();

  /* Remove any delayed duplicate header controls created by older modules. */
  var top=document.querySelector('#rp-overlay .rp2-top');
  if(top){
   var refreshes=top.querySelectorAll('.rp2-cloud-refresh,.ps60-refresh');
   for(var i=1;i<refreshes.length;i++)refreshes[i].remove();
   var readonly=top.querySelectorAll('.rp2-readonly,.ps60-readonly,.ps61-readonly');
   for(var j=1;j<readonly.length;j++)readonly[j].remove();
  }
 }
 function closeDetails(){
  var modal=document.getElementById('ps61-cycle-modal');
  if(modal)modal.remove()
 }
 function openDetails(){
  var rep=window._rp2&&_rp2.rep||'',p=pace(rep);
  if(!p)return;
  var t=tone(p),size=n(p.size),overall=size>0?Math.min(100,n(p.completedPct)):0;
  var milestone=Math.min(100,n(p.milestoneAchievement));
  closeDetails();
  var overlay=document.createElement('div');
  overlay.id='ps61-cycle-modal';
  overlay.className='r3m-ov';
  overlay.innerHTML='<div class="r3m-card ps61-cycle-modal-card">'+
   '<button class="ps61-modal-close" onclick="_ps61CloseCycleDetails()">×</button>'+
   '<div class="ps61-modal-kick">Annual Calling Cycle</div><h2>'+esc(p.cycle&&p.cycle.label||'Account Updates')+'</h2>'+
   '<div class="ps61-modal-copy">The assigned customer set is frozen for the active cycle. A customer counts as completed only after the call attempt and follow-up email are both recorded. Daily targets recalculate across remaining business days.</div>'+
   '<div class="ps61-modal-grid">'+
    '<div class="ps61-modal-stat"><span>Current pace</span><strong style="color:'+t.color+'">'+esc(t.status)+'</strong><small>'+esc(deltaText(p))+'</small></div>'+
    '<div class="ps61-modal-stat"><span>Assigned set</span><strong>'+size+'</strong><small>'+n(p.completed)+' completed</small></div>'+
    '<div class="ps61-modal-stat"><span>Current milestone</span><strong>'+n(p.targetPct)+'%</strong><small>'+esc(p.milestone&&p.milestone.label||'Current milestone')+'</small></div>'+
    '<div class="ps61-modal-stat"><span>Today</span><strong>'+n(p.todayCompleted)+' / '+n(p.dailyTarget)+'</strong><small>'+n(p.todayRemaining)+' remaining today</small></div>'+
    '<div class="ps61-modal-stat"><span>Activity evidence</span><strong>'+n(p.attempted)+' / '+n(p.emailed)+'</strong><small>Calls / follow-up emails</small></div>'+
    '<div class="ps61-modal-stat"><span>Tomorrow projection</span><strong>'+n(p.projectedNext)+'</strong><small>'+fmtDate(p.nextBusinessDay)+'</small></div>'+
    '<div class="ps61-modal-stat"><span>Business days left</span><strong>'+n(p.remainingBusiness)+'</strong><small>Holidays and blackout dates excluded</small></div>'+
    '<div class="ps61-modal-stat"><span>Expected by now</span><strong>'+n(p.expected)+'</strong><small>Based on the current milestone pace</small></div>'+
    '<div class="ps61-modal-stat"><span>Completed percent</span><strong>'+overall+'%</strong><small>Of the complete campaign set</small></div>'+
   '</div>'+
   '<div class="ps61-modal-progress"><div class="ps61-modal-progress-row"><span>Current milestone progress</span><strong>'+milestone+'%</strong></div><div class="ps61-modal-bar"><i style="width:'+milestone+'%"></i></div></div>'+
   '<div class="ps61-modal-progress"><div class="ps61-modal-progress-row"><span>Full cycle progress</span><strong>'+overall+'%</strong></div><div class="ps61-modal-bar"><i style="width:'+overall+'%"></i></div></div>'+
   '<div class="ps61-modal-actions"><button class="primary" onclick="_ps61CloseCycleDetails();_rp2Go(\'call\')">Open today’s calls</button><button onclick="_ps61CloseCycleDetails();_rp2Go(\'action\')">Today’s Business</button><button onclick="_cc547RefreshRep();_ps61CloseCycleDetails()">Refresh cycle</button></div>'+
  '</div>';
  overlay.addEventListener('click',function(event){if(event.target===overlay)closeDetails()});
  document.body.appendChild(overlay)
 }

 var basePage=window._rp2Page;
 window._rp2Page=function(){
  if(window._rp2&&_rp2.page==='home')return enhanceHome();
  return typeof basePage==='function'?basePage.apply(this,arguments):''
 };
 window._rp2Html=cleanShell;

 var baseGo=window._rp2Go;
 window._rp2Go=function(){
  var result=typeof baseGo==='function'?baseGo.apply(this,arguments):undefined;
  setTimeout(removeLegacy,0);
  setTimeout(removeLegacy,120);
  return result
 };

 window._ps61OpenCycleDetails=openDetails;
 window._ps61CloseCycleDetails=closeDetails;

 window.TCP_REP_HEADER_CYCLE_SIMPLIFY_V561={
  version:'v561',
  home:enhanceHome,
  shell:cleanShell,
  pace:pace,
  compactCycle:compactCycle,
  removeLegacy:removeLegacy,
  openDetails:openDetails
 };

 var observer=new MutationObserver(function(){
  removeLegacy()
 });
 var host=document.getElementById('rp-overlay');
 if(host)observer.observe(host,{childList:true,subtree:true});

 setTimeout(function(){
  try{
   var overlay=document.getElementById('rp-overlay');
   if(overlay&&window._rp2&&_rp2.rep){
    overlay.innerHTML=cleanShell(_rp2.rep);
    overlay.setAttribute('data-rp-scale','manager');
    if(typeof _rp2After==='function')_rp2After();
    removeLegacy()
   }
  }catch(error){console.warn('[v561 rep simplify]',error)}
 },0);
 setTimeout(removeLegacy,500)
})();
