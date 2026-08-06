
(function(){
 'use strict';

 var PROFILE_ID='v551-manager-performance';
 var COACH_ID='v551-coach-performance';
 var baseProfileRender=window.renderProfileDetail;
 var baseRepPage=window._rp2Page;
 var baseCoachRender=window.renderRepCoachingCenter;
 var baseQuarterReport=window.buildRepQuarterReport;
 var baseSummaryReport=window.downloadRepSummaryPDF;
 var baseOneOnOne=window.buildOneOnOnePacket;

 function clean(v){return String(v==null?'':v).trim()}
 function n(v){var x=Number(v);return isFinite(x)?x:0}
 function esc(v){
  var s=String(v==null?'':v);
  return typeof esc_html==='function'?esc_html(s):s.replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function color(status){
  return status&&status.color?status.color:
   status&&status.key==='green'?'#5DCAA5':
   status&&status.key==='yellow'?'#EF9F27':'#F09595'
 }
 function tint(status){
  var c=color(status);
  return c==='#5DCAA5'?'rgba(93,202,165,.17)':c==='#EF9F27'?'rgba(239,159,39,.17)':'rgba(240,149,149,.17)'
 }
 function scoreFor(rep){
  if(!rep||!window.TCP_TRAFFIC_SCORE_V548)return null;
  try{return TCP_TRAFFIC_SCORE_V548.repScore(rep,'quarter',getYr(),getQ())}catch(e){console.warn('[v551 score]',e);return null}
 }
 function rowsFor(score){
  if(!score||!window.TCP_TRAFFIC_SCORE_V548)return[];
  try{return TCP_TRAFFIC_SCORE_V548.metricRows(score)}catch(e){return[]}
 }
 function badge(status){
  if(!status)return'';
  return'<span class="'+esc(status.className||status.c||('ryg-'+status.key))+'">'+esc(status.label||status.l||status.key)+'</span>'
 }
 function metricCards(score,mode){
  return rowsFor(score).map(function(row){
   var cls=mode==='rep'?'v551-rep-metric':'v551-metric';
   var head=mode==='rep'?'v551-rep-metric-head':'v551-metric-head';
   var name=mode==='rep'?'v551-rep-metric-name':'v551-metric-name';
   var weight=mode==='rep'?'v551-rep-metric-weight':'v551-metric-weight';
   var scoreClass=mode==='rep'?'v551-rep-metric-score':'v551-metric-score';
   var actual=mode==='rep'?'v551-rep-metric-actual':'v551-metric-actual';
   var foot=mode==='rep'?'v551-rep-metric-foot':'v551-metric-foot';
   return'<article class="'+cls+'"><div class="'+head+'"><div class="'+name+'">'+esc(row.name)+'</div><div class="'+weight+'">'+row.weight+'%</div></div>'+
    '<div class="'+scoreClass+'">'+n(row.score).toFixed(1)+'</div><div class="'+actual+'">'+esc(row.actual)+'</div>'+
    '<div class="'+foot+'">'+badge(row.status)+(mode==='rep'?'<small>+'+n(row.contribution).toFixed(1)+' pts</small>':'<span class="v551-metric-points">+'+n(row.contribution).toFixed(1)+' pts</span>')+'</div></article>'
  }).join('')
 }
 function managerCard(rep){
  var score=scoreFor(rep);if(!score)return'';
  var status=score.status,c=color(status);
  return'<section id="'+PROFILE_ID+'" class="v551-manager-status" style="--v551-color:'+c+';--v551-tint:'+tint(status)+'">'+
   '<div class="v551-status-top"><div><div class="v551-status-kick">SHARED PERFORMANCE STATUS · '+esc(getQ())+' '+esc(getYr())+'</div>'+
   '<div class="v551-status-title">'+esc(rep)+' — weighted performance</div>'+
   '<div class="v551-status-copy">This is the same calculation the rep sees in their portal and reports. Manager-only coaching notes, HR records, and private follow-up remain separate and are never shown to the rep.</div></div>'+
   '<div class="v551-overall"><span>Overall weighted score</span><strong>'+score.total.toFixed(1)+'</strong><b>'+esc(status.label)+' status</b></div></div>'+
   '<div class="v551-metric-grid">'+metricCards(score,'manager')+'</div>'+
   '<div class="v551-manager-note"><strong style="color:#fff">Ranking rule:</strong> the overall color comes from the weighted total. Individual metric colors identify exactly where the rep is Green, Yellow, or Red without automatically overriding the final status.</div></section>'
 }
 function repCard(rep){
  var score=scoreFor(rep);if(!score)return'';
  var status=score.status,c=color(status);
  return'<section class="v551-rep-status" style="--v551-color:'+c+';--v551-tint:'+tint(status)+'">'+
   '<div class="v551-rep-status-top"><div><div class="v551-rep-status-kick">YOUR PERFORMANCE STATUS · '+esc(getQ())+' '+esc(getYr())+'</div>'+
   '<div class="v551-rep-status-title">What your current color means</div>'+
   '<div class="v551-rep-status-copy">Your five tracked standards use the same weights and thresholds as the manager ranking. The actual result becomes a metric score, the score is multiplied by its weight, and those weighted points create the overall color.</div></div>'+
   '<div class="v551-rep-overall"><span>Overall weighted score</span><strong>'+score.total.toFixed(1)+'</strong><b>'+esc(status.label)+' status</b></div></div>'+
   '<div class="v551-rep-metrics">'+metricCards(score,'rep')+'</div>'+
   '<div class="v551-rep-explain"><strong style="color:#fff">How to read this:</strong> Green begins at the configured Green cutoff, Yellow begins at the configured Yellow cutoff, and results below Yellow are Red. Your manager may change the weights and thresholds in Admin, and this board updates everywhere automatically.</div></section>'
 }
 function removeRedundantPanel(){
  var panel=document.getElementById('r360');
  if(panel)panel.remove()
 }
 function tagManagerSections(score){
  var host=document.getElementById('profileDetail');if(!host||!score)return;
  var map=[
   {find:/sales|goal|revenue/i,status:score.metricStatus.sales},
   {find:/call|coverage|outbound/i,status:score.metricStatus.outbound},
   {find:/hour/i,status:score.metricStatus.hours},
   {find:/art/i,status:score.metricStatus.art},
   {find:/credit memo|credit/i,status:score.metricStatus.credit}
  ];
  host.querySelectorAll('.profile-panel-title').forEach(function(title){
   var text=clean(title.textContent);
   var hit=map.find(function(item){return item.find.test(text)});
   var old=title.querySelector('.v551-section-status');if(old)old.remove();
   if(hit){
    var wrap=document.createElement('span');wrap.className='v551-section-status';
    wrap.innerHTML=badge(hit.status);title.appendChild(wrap)
   }
  })
 }
 function mountManager(rep){
  removeRedundantPanel();
  var host=document.getElementById('profileDetail');if(!host||!rep)return;
  var old=document.getElementById(PROFILE_ID);if(old)old.remove();
  var nav=host.querySelector('.v549-profile-nav');
  if(nav)nav.insertAdjacentHTML('afterend',managerCard(rep));
  else host.insertAdjacentHTML('afterbegin',managerCard(rep));
  tagManagerSections(scoreFor(rep))
 }
 window.renderProfileDetail=function(index){
  var result=typeof baseProfileRender==='function'?baseProfileRender.apply(this,arguments):undefined;
  var rep=S.reps&&S.reps[index]&&S.reps[index].name||window.selectedRep;
  setTimeout(function(){mountManager(rep)},0);
  setTimeout(function(){mountManager(rep)},80);
  return result
 };

 /* Keep removing any legacy panel that a delayed older module tries to mount. */
 var profileHost=document.getElementById('profileDetail');
 if(profileHost){
  new MutationObserver(function(){
   removeRedundantPanel();
   if(window.selectedRep&&!document.getElementById(PROFILE_ID))mountManager(window.selectedRep)
  }).observe(profileHost,{childList:true,subtree:true})
 }

 /* Rep-facing pages use the exact same status source. */
 window._rp2Page=function(){
  var body=typeof baseRepPage==='function'?baseRepPage.apply(this,arguments):'';
  var page=window._rp2&&_rp2.page||'';
  var rep=window._rp2&&_rp2.rep||'';
  if(rep&&['dash','reports','profile','goals'].indexOf(page)>=0)return repCard(rep)+body;
  return body
 };

 /* Manager Coaching Center gets a compact reference to the same score. */
 function coachCard(rep){
  var score=scoreFor(rep);if(!score)return'';
  var rows=rowsFor(score);
  return'<section id="'+COACH_ID+'" class="v551-coach-status"><div class="v551-coach-top"><div><strong>'+esc(rep)+' — shared metric status</strong><span>Use these five colors as the starting point for coaching. Private notes remain manager-only.</span></div>'+badge(score.status)+'</div>'+
   '<div class="v551-coach-metrics"><div class="v551-coach-metric"><span>Overall</span><strong>'+score.total.toFixed(1)+'</strong></div>'+
   rows.map(function(row){return'<div class="v551-coach-metric"><span>'+esc(row.name)+'</span><strong>'+n(row.score).toFixed(1)+'</strong><div style="margin-top:5px">'+badge(row.status)+'</div></div>'}).join('')+'</div></section>'
 }
 function mountCoach(rep){
  var page=document.getElementById('pg-coach');if(!page||!rep)return;
  var old=document.getElementById(COACH_ID);if(old)old.remove();
  var target=page.querySelector('.coach-shell')||page.firstElementChild;
  if(target)target.insertAdjacentHTML('afterbegin',coachCard(rep))
 }
 if(typeof baseCoachRender==='function'){
  window.renderRepCoachingCenter=function(forceRep){
   var result=baseCoachRender.apply(this,arguments);
   var select=document.getElementById('coachRep');
   var rep=clean(forceRep||select&&select.value||'');
   setTimeout(function(){mountCoach(rep)},0);
   return result
  }
 }

 /* Printable reports receive the same scorecard and old 5-point displays are retired. */
 function reportBlock(rep){
  var score=scoreFor(rep);if(!score)return'';
  var rows=rowsFor(score),c=color(score.status);
  return'<section id="v551-report-status" style="margin:16px 0 19px;padding:15px;border:1px solid #D9DEE7;border-left:5px solid '+c+';border-radius:10px;background:#F8FAFC;page-break-inside:avoid">'+
   '<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start"><div><div style="font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#64748B">Red / Yellow / Green performance status</div>'+
   '<div style="margin-top:4px;font-size:18px;font-weight:900;color:#111827">'+esc(rep)+' · '+esc(getQ())+' '+esc(getYr())+'</div>'+
   '<div style="margin-top:4px;font-size:10px;line-height:1.5;color:#64748B">Same weighted calculation used in the manager profile and rep portal.</div></div>'+
   '<div style="min-width:125px;text-align:right"><div style="font-size:31px;font-weight:950;color:#111827">'+score.total.toFixed(1)+'</div><div style="font-size:10px;font-weight:900;text-transform:uppercase;color:'+c+'">'+esc(score.status.label)+' overall</div></div></div>'+
   '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:12px">'+rows.map(function(row){
    var rc=color(row.status);
    return'<div style="padding:9px;border:1px solid #E5E7EB;border-top:3px solid '+rc+';border-radius:7px;background:#fff"><div style="font-size:8px;font-weight:800;color:#64748B;text-transform:uppercase">'+esc(row.name)+' · '+row.weight+'%</div><div style="margin-top:5px;font-size:18px;font-weight:900;color:#111827">'+n(row.score).toFixed(1)+'</div><div style="margin-top:3px;font-size:8px;color:#64748B;line-height:1.4">'+esc(row.actual)+'</div><div style="margin-top:5px;font-size:8px;font-weight:800;color:'+rc+'">'+esc(row.status.label)+' · +'+n(row.contribution).toFixed(1)+' pts</div></div>'
   }).join('')+'</div></section>'
 }
 function removeLegacyQuarterScore(doc,score){
  try{
   var number=doc.querySelector('.qr-score .n'),label=doc.querySelector('.qr-score .l');
   if(number)number.textContent=score.total.toFixed(1);
   if(label)label.textContent='Weighted / 100';
   var heads=[].slice.call(doc.querySelectorAll('.qr-h2'));
   var head=heads.find(function(el){return /scorecard breakdown/i.test(el.textContent||'')});
   if(head){
    var next=head.nextElementSibling;
    while(next&&!next.classList.contains('qr-h2')){
     var remove=next;next=next.nextElementSibling;remove.remove()
    }
    head.remove()
   }
  }catch(e){}
 }
 function replaceFivePointText(doc,score){
  try{
   var walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);
   var node;
   while((node=walker.nextNode())){
    if(/score\s+\d+(?:\.\d+)?\/5/i.test(node.nodeValue||'')){
     node.nodeValue=node.nodeValue.replace(/score\s+\d+(?:\.\d+)?\/5/ig,'weighted '+score.total.toFixed(1)+'/100 · '+score.status.label)
    }
   }
  }catch(e){}
 }
 function injectReport(win,rep,kind){
  if(!win)return;
  var attempts=0;
  var timer=setInterval(function(){
   attempts++;
   try{
    if(win.closed){clearInterval(timer);return}
    var doc=win.document,body=doc&&doc.body;
    if(!body||!body.innerHTML||/Building .*report|Building .*packet/i.test(body.textContent||'')){
     if(attempts>180)clearInterval(timer);return
    }
    if(doc.getElementById('v551-report-status')){clearInterval(timer);return}
    var score=scoreFor(rep);if(!score){clearInterval(timer);return}
    if(kind==='quarter')removeLegacyQuarterScore(doc,score);
    if(kind==='one-on-one')replaceFivePointText(doc,score);
    var wrap=doc.createElement('div');wrap.innerHTML=reportBlock(rep);
    var block=wrap.firstElementChild;
    var anchor=kind==='quarter'?doc.querySelector('.qr-top'):kind==='summary'?doc.querySelector('.subtitle'):doc.body.firstElementChild;
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(block,anchor.nextSibling);
    else body.insertBefore(block,body.firstChild);
    clearInterval(timer)
   }catch(e){
    if(attempts>180)clearInterval(timer)
   }
  },60)
 }
 function runReport(base,args,rep,kind){
  if(typeof base!=='function')return;
  var reportWindow=null,realOpen=window.open;
  window.open=function(){reportWindow=realOpen.apply(window,arguments);return reportWindow};
  var result;
  try{result=base.apply(this,args)}finally{window.open=realOpen}
  injectReport(reportWindow,rep,kind);
  return result
 }
 if(typeof baseQuarterReport==='function'){
  window.buildRepQuarterReport=function(rep){return runReport(baseQuarterReport,arguments,rep,'quarter')}
 }
 if(typeof baseSummaryReport==='function'){
  window.downloadRepSummaryPDF=function(rep){return runReport(baseSummaryReport,arguments,rep,'summary')}
 }
 if(typeof baseOneOnOne==='function'){
  window.buildOneOnOnePacket=function(rep){return runReport(baseOneOnOne,arguments,rep,'one-on-one')}
 }

 window.TCP_SHARED_PERFORMANCE_V551={
  version:'v551',
  scoreFor:scoreFor,
  rowsFor:rowsFor,
  managerCard:managerCard,
  repCard:repCard,
  reportBlock:reportBlock,
  mountManager:mountManager,
  removeRedundantPanel:removeRedundantPanel
 };

 removeRedundantPanel();
 if(window.selectedRep)setTimeout(function(){mountManager(window.selectedRep)},100)
})();
