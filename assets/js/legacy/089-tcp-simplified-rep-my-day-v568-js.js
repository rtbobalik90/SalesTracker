
(function(){
 'use strict';

 var API=window.TCP_PROJECT_SIMPLIFY_REP_V560;
 var basePage=window._rp2Page;

 function arr(value){
  return Array.isArray(value)?value:[]
 }
 function n(value){
  var number=Number(value);
  return isFinite(number)?number:0
 }
 function clean(value){
  return String(value==null?'':value).trim()
 }
 function esc(value){
  if(typeof window._rp2Esc==='function'){
   return window._rp2Esc(String(value==null?'':value))
  }
  return String(value==null?'':value).replace(/[&<>"]/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
  })
 }
 function money(value){
  return typeof window._rp2$==='function'?
   window._rp2$(n(value)):
   '$'+Math.round(n(value)).toLocaleString()
 }
 function number(value){
  return Math.round(n(value)).toLocaleString()
 }
 function first(name){
  return clean(name).split(/\s+/)[0]||clean(name)
 }
 function periodLabel(){
  var parts=[];
  try{parts.push(getQ()+' '+getYr())}catch(error){}
  try{
   var month=document.getElementById('selM');
   if(month&&month.options&&month.selectedIndex>=0){
    parts.push(month.options[month.selectedIndex].text)
   }
  }catch(error){}
  try{
   var week=document.getElementById('selW');
   if(week&&week.options&&week.selectedIndex>=0){
    parts.push(week.options[week.selectedIndex].text)
   }
  }catch(error){}
  return parts.filter(Boolean).join(' · ')
 }
 function statusLabel(item){
  var due=clean(item&&item.due);
  if(due){
   try{
    var date=new Date(String(due).length===10?String(due)+'T12:00:00':due);
    var today=new Date();
    today.setHours(12,0,0,0);
    date.setHours(12,0,0,0);
    var gap=Math.round((date-today)/86400000);
    if(gap<0)return{label:'Overdue',cls:'overdue'};
    if(gap===0)return{label:'Due Today',cls:''};
    if(gap===1)return{label:'Tomorrow',cls:''}
   }catch(error){}
  }
  return{label:'Due Today',cls:''}
 }
 function paceColor(diagnostics){
  var tone=clean(diagnostics&&diagnostics.tone).toLowerCase();
  var status=clean(diagnostics&&diagnostics.status).toLowerCase();
  if(tone==='ahead'||/ahead|complete/.test(status))return'#5DCAA5';
  if(tone==='behind'||/behind/.test(status))return'#F09595';
  if(tone==='warning'||/caution/.test(status))return'#EF9F27';
  return'#00AFEF'
 }
 function paceText(diagnostics){
  return clean(diagnostics&&diagnostics.status)||'On pace'
 }
 function progressValue(diagnostics){
  var set=n(diagnostics&&(
   diagnostics.set||
   diagnostics.size||
   diagnostics.targetCount
  ));
  var completed=n(diagnostics&&diagnostics.completed);
  return set>0?Math.min(100,Math.round(completed/set*100)):0
 }
 function portalData(){
  try{
   return API&&typeof API.portalData==='function'?
    API.portalData():
    {}
  }catch(error){
   console.warn('[v568 portal data]',error);
   return{}
  }
 }
 function cycleData(rep){
  try{
   return API&&typeof API.callCycle==='function'?
    API.callCycle(rep):
    {diagnostics:null,queue:[]}
  }catch(error){
   console.warn('[v568 cycle data]',error);
   return{diagnostics:null,queue:[]}
  }
 }
 function performanceData(rep){
  try{
   return API&&typeof API.performance==='function'?
    API.performance(rep):
    {score:null,rows:[]}
  }catch(error){
   return{score:null,rows:[]}
  }
 }
 function callRows(rows){
  rows=arr(rows).slice(0,250);
  if(!rows.length){
   return'<div class="ps68-other-empty"><span>No calls are assigned today.</span></div>'
  }
  return rows.map(function(item){
   var name=clean(item.customer||item.company||item.title||'Customer');
   var sub=clean(item.contact||item.reason||item.copy||'Account update call');
   var status=statusLabel(item);
   return'<div class="ps68-row" onclick="_ps60OpenCall(\''+
    encodeURIComponent(name)+
    '\')"><div><div class="ps68-row-name">'+esc(name)+
    '</div><div class="ps68-row-sub">'+esc(sub)+
    '</div></div><span class="ps68-due '+status.cls+'">'+
    esc(status.label)+'</span></div>'
  }).join('')
 }
 function otherRows(rows,type){
  rows=arr(rows).slice(0,40);
  if(!rows.length)return'';

  return rows.map(function(item){
   var name=clean(item.customer||item.company||item.title||item.number||'Item');
   var sub=clean(item.copy||item.reason||item.status||item.source||'Open');
   var click=type==='business'?
    "_ps60OpenBusiness('"+esc(item.page||'action')+"','"+encodeURIComponent(name)+"')":
    "_rp2Go('dealdesk')";
   return'<div class="ps68-other-row" onclick="'+click+
    '"><strong>'+esc(name)+'</strong><span>'+esc(sub)+'</span></div>'
  }).join('')
 }
 function otherCard(title,count,rows,type,color,actionLabel,actionPage){
  var content=otherRows(rows,type);
  return'<article class="ps68-other-card" style="--ps68-accent:'+color+
   '"><i class="ps68-other-accent"></i><div class="ps68-other-inner">'+
   '<div class="ps68-other-head"><strong>'+esc(title)+
   '</strong><span>'+number(count)+'</span></div>'+
   (content?
    '<div class="ps68-other-list">'+content+'</div>':
    '<div class="ps68-other-empty"><span>Nothing due.</span><button class="ps68-other-action" onclick="_rp2Go(\''+
     actionPage+'\')">'+esc(actionLabel)+'</button></div>')+
   '</div></article>'
 }
 function scoreCard(icon,label,value,copy,color){
  return'<div class="ps68-score-card" style="--ps68-score-color:'+color+
   '"><div class="ps68-score-icon">'+icon+'</div><div><span>'+esc(label)+
   '</span><strong>'+esc(value)+'</strong><small>'+esc(copy)+
   '</small></div></div>'
 }
 function home(){
  var rep=window._rp2&&_rp2.rep||'';
  var data=portalData();
  var cycle=cycleData(rep);
  var performance=performanceData(rep);
  var diagnostics=cycle.diagnostics||{};
  var calls=arr(cycle.queue).length?arr(cycle.queue):arr(data.calls);
  var lanes=data.business&&data.business.lanes||{};
  var business=arr(lanes.overdue).concat(arr(lanes.today));
  var q72=arr(data.quoteGroups&&data.quoteGroups['72']);
  var q7=arr(data.quoteGroups&&data.quoteGroups['7']);
  var opportunities=arr(data.opps).length;
  var tasks=arr(data.business&&data.business.rows).length;
  var hour=new Date().getHours();
  var greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  var completed=n(diagnostics.completed);
  var set=n(diagnostics.set||diagnostics.size);
  var todayCompleted=n(diagnostics.todayCompleted);
  var todayTarget=n(diagnostics.dailyTarget||diagnostics.todayTarget);
  var todayRemaining=n(diagnostics.todayRemaining);
  var targetPct=n(diagnostics.targetPct);
  var completedPct=n(diagnostics.completedPct);
  var attempted=n(diagnostics.attempted);
  var emailed=n(diagnostics.emailed);
  var progress=progressValue(diagnostics);
  var color=paceColor(diagnostics);

  var perf=data.perf||{};
  var week=perf.week||{};
  var qtd=perf.qtd||{};
  var goal=n(perf.goal);
  var quarterPct=goal>0?Math.round(n(qtd.revenue)/goal*100):0;
  var callTarget=n(diagnostics.targetCount||set);
  var due=arr(lanes.overdue).length+arr(lanes.today).length;
  var score=performance.score||{};
  var status=score.status||{};
  var statusColor=status.key==='green'?'#5DCAA5':
   status.key==='yellow'?'#EF9F27':'#F09595';

  return'<div class="ps68-home">'+
   '<section class="ps68-command">'+
    '<div class="ps68-greeting"><div class="ps68-target"></div><div>'+
     '<div class="ps68-period">'+esc(periodLabel())+'</div>'+
     '<h1>'+esc(greeting+', '+first(rep))+'.</h1>'+
     '<p>Focus on today’s calls, follow-ups, and the work most likely to move customers forward.</p>'+
     '<div class="ps68-day-stats">'+
      '<div class="ps68-day-stat"><i>▣</i><div><strong>'+number(tasks)+
       '</strong><span>Tasks due</span></div></div>'+
      '<div class="ps68-day-stat"><i>☎</i><div><strong>'+number(calls.length)+
       '</strong><span>Calls prioritized</span></div></div>'+
      '<div class="ps68-day-stat"><i>◇</i><div><strong>'+number(opportunities)+
       '</strong><span>Opportunities</span></div></div>'+
     '</div></div></div>'+
    '<div class="ps68-cycle" style="--ps68-pace:'+color+
     ';--ps68-progress:'+progress+'%">'+
     '<div><div class="ps68-cycle-kick">Call Cycle</div>'+
      '<div class="ps68-cycle-title">'+esc(
       diagnostics.cycle&&diagnostics.cycle.label||
       diagnostics.label||
       'Account Updates'
      )+'</div>'+
      '<div class="ps68-cycle-status">'+esc(paceText(diagnostics))+'</div></div>'+
     '<div class="ps68-cycle-center"><div class="ps68-cycle-metrics">'+
      '<div class="ps68-cycle-metric"><span>Completed</span><strong>'+
       number(completed)+' / '+number(set)+'</strong><small>Call + email</small></div>'+
      '<div class="ps68-cycle-metric"><span>Today</span><strong>'+
       number(todayCompleted)+' / '+number(todayTarget)+'</strong><small>'+
       number(todayRemaining)+' remaining</small></div>'+
      '<div class="ps68-cycle-metric"><span>Milestone</span><strong>'+
       number(completedPct)+'% / '+number(targetPct)+'%</strong><small>Current period</small></div>'+
      '<div class="ps68-cycle-metric"><span>Evidence</span><strong>'+
       number(attempted)+' / '+number(emailed)+'</strong><small>Calls / emails</small></div>'+
     '</div><div class="ps68-progress-head"><span>Full cycle progress</span><strong>'+
      progress+'%</strong></div><div class="ps68-progress"><i></i></div></div>'+
     '<div class="ps68-cycle-actions"><button class="primary" onclick="_rp2Go(\'call\')">Open '+
      number(todayRemaining||calls.length)+' Calls</button>'+
      '<button onclick="_ps61OpenCycleDetails()">View Details</button></div>'+
    '</div>'+
   '</section>'+

   '<section class="ps68-work">'+
    '<div class="ps68-work-head"><div class="ps68-work-head-left">'+
     '<span class="ps68-kick">Today’s Work</span>'+
     '<span class="ps68-work-title">Do the next important thing</span>'+
     '<span class="ps68-work-copy">Calls stay primary; follow-ups remain visible without taking over the page.</span>'+
    '</div><button class="ps68-work-link" onclick="_rp2Go(\'action\')">Open full plan →</button></div>'+
    '<div class="ps68-work-grid">'+
     '<article class="ps68-primary"><div class="ps68-card-head"><strong>Today’s Calls</strong>'+
      '<span class="ps68-count">'+number(calls.length)+'</span></div>'+
      '<div class="ps68-queue" id="ps68-call-queue">'+callRows(calls)+'</div>'+
      '<div class="ps68-primary-actions"><button onclick="_rp2Go(\'call\')">Prep</button>'+
       '<button onclick="_rp2Go(\'call\')">Review</button>'+
       '<button class="primary" onclick="_ps60CallFirst()">Start Calling</button></div></article>'+
     '<div class="ps68-other">'+
      otherCard('Today’s Business',business.length,business,'business','#FA873D','Open','action')+
      otherCard('72-Hour Quote Follow-Up',q72.length,q72,'quote','#A970FF','Review','dealdesk')+
      otherCard('1-Week Quote Follow-Up',q7.length,q7,'quote','#459CFF','Review','dealdesk')+
     '</div>'+
    '</div>'+
   '</section>'+

   '<section class="ps68-score">'+
    '<div class="ps68-score-title"><span class="ps68-kick">My Scoreboard</span>'+
     '<strong>This week & quarter</strong></div>'+
    '<div class="ps68-score-grid">'+
     scoreCard('💲','Week Sales',money(week.revenue),number(week.orders)+' orders','#5DCAA5')+
     scoreCard('📈','Quarter Sales',money(qtd.revenue),quarterPct+'% to goal','#FA873D')+
     scoreCard('☎','Account Updates',number(completed)+' / '+number(callTarget),paceText(diagnostics),'#00AFEF')+
     scoreCard('🏆','Quarter Rank',perf.rank?('#'+perf.rank):'—','of '+number(perf.totalReps)+' reps','#A970FF')+
     scoreCard('▽','Open Pipeline',money(perf.pipeline),number(opportunities)+' opportunities','#00AFEF')+
     scoreCard('●','Performance',n(score.total).toFixed(1),clean(status.label)||'Status',statusColor)+
    '</div><button class="ps68-score-link" onclick="_rp2Go(\'dash\')">Full Dashboard →</button>'+
   '</section>'+
  '</div>'
 }

 function enhanceScroll(){
  var queue=document.getElementById('ps68-call-queue');
  if(!queue||queue.getAttribute('data-ps68-scroll')==='1')return;
  queue.setAttribute('data-ps68-scroll','1');
  queue.setAttribute('tabindex','0');
  queue.setAttribute('role','region');
  queue.setAttribute('aria-label','Today’s Calls — scroll to view every assigned customer');

  try{
   var stored=Number(sessionStorage.getItem('tcp_ps68_calls_scroll')||0);
   if(stored>0)queue.scrollTop=stored
  }catch(error){}

  queue.addEventListener('scroll',function(){
   try{sessionStorage.setItem('tcp_ps68_calls_scroll',String(queue.scrollTop))}catch(error){}
  },{passive:true});

  queue.addEventListener('wheel',function(event){
   var atTop=queue.scrollTop<=0;
   var atBottom=Math.ceil(queue.scrollTop+queue.clientHeight)>=queue.scrollHeight;
   if((event.deltaY<0&&!atTop)||(event.deltaY>0&&!atBottom)){
    event.stopPropagation()
   }
  },{passive:true})
 }
 function after(){
  var overlay=document.getElementById('rp-overlay');
  if(overlay)overlay.setAttribute('data-rp-scale','manager');
  enhanceScroll()
 }

 window._rp2Page=function(){
  if(window._rp2&&_rp2.page==='home')return home();
  return typeof basePage==='function'?basePage.apply(this,arguments):''
 };
 window._rp2HomeV3=home;

 var oldAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof oldAfter==='function'?oldAfter.apply(this,arguments):undefined;
  if(window._rp2&&_rp2.page==='home')setTimeout(after,0);
  return result
 };

 var oldGo=window._rp2Go;
 if(typeof oldGo==='function'&&!oldGo._ps68){
  var go=function(){
   var result=oldGo.apply(this,arguments);
   if(window._rp2&&_rp2.page==='home')setTimeout(after,0);
   return result
  };
  go._ps68=true;
  window._rp2Go=go
 }

 window.TCP_SIMPLIFIED_REP_MY_DAY_V568={
  version:'v568',
  home:home,
  enhanceScroll:enhanceScroll
 };

 setTimeout(function(){
  try{
   if(window._rp2&&_rp2.rep&&_rp2.page==='home'){
    var page=document.getElementById('rp2-page');
    if(page){
     page.innerHTML=home();
     after()
    }
   }
  }catch(error){
   console.warn('[v568 My Day]',error)
  }
 },0)
})();
