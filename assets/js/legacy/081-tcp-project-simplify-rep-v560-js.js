
(function(){
 'use strict';

 function n(v){var x=Number(v);return isFinite(x)?x:0}
 function arr(v){
  if(Array.isArray(v))return v;
  if(!v)return[];
  try{
   if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);
   if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(Boolean)
  }catch(e){}
  return[]
 }
 function clean(v){return String(v==null?'':v).trim()}
 function esc(v){
  return typeof _rp2Esc==='function'?_rp2Esc(String(v==null?'':v)):
   String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})
 }
 function money(v){return typeof _rp2$==='function'?_rp2$(n(v)):'$'+Math.round(n(v)).toLocaleString()}
 function number(v){return Math.round(n(v)).toLocaleString()}
 function initials(name){return clean(name).split(/\s+/).map(function(x){return x[0]||''}).slice(0,2).join('').toUpperCase()}
 function first(name){return clean(name).split(/\s+/)[0]||clean(name)}
 function timeText(v){
  if(!v)return'Any time';
  try{
   var d=new Date(String(v).length===10?String(v)+'T12:00:00':v);
   if(isNaN(d.getTime()))return'Any time';
   return /T\d{2}:\d{2}| \d{1,2}:\d{2}/.test(String(v))?
    d.toLocaleString('en-US',{hour:'numeric',minute:'2-digit'}):
    'Today'
  }catch(e){return'Any time'}
 }
 function statusColor(key){
  return key==='green'?'#5DCAA5':key==='yellow'?'#EF9F27':'#F09595'
 }
 function portalData(){
  try{
   if(typeof window._rp2DesktopBuild==='function')return window._rp2DesktopBuild()
  }catch(e){console.warn('[v560 desktop data]',e)}
  return{
   calls:[],business:{rows:[],lanes:{overdue:[],today:[],customer:[],internal:[],upcoming:[]}},
   quoteGroups:{'72':[],'7':[],expiring:[],missing:[]},opps:[],schedule:[],
   perf:{week:{revenue:0,orders:0,calls:0},qtd:{revenue:0,orders:0,calls:0},goal:0,rank:null,totalReps:0,pipeline:0,due:0}
  }
 }
 function callCycle(rep){
  try{
   if(window.TCP_CALL_CYCLE_V547){
    var diagnostics=TCP_CALL_CYCLE_V547.diagnostics(rep,new Date());
    var queue=TCP_CALL_CYCLE_V547.cycleQueue(rep,new Date())||[];
    return{diagnostics:diagnostics,queue:queue}
   }
  }catch(e){}
  return{diagnostics:null,queue:[]}
 }
 function performance(rep){
  try{
   if(window.TCP_TRAFFIC_SCORE_V548){
    var score=TCP_TRAFFIC_SCORE_V548.repScore(rep,'quarter',getYr(),getQ());
    var rows=TCP_TRAFFIC_SCORE_V548.metricRows(score);
    return{score:score,rows:rows}
   }
  }catch(e){}
  return{score:{total:0,status:{key:'red',label:'Red'}},rows:[]}
 }
 function unread(){
  try{return typeof window._rp2NotificationUnreadCount==='function'?window._rp2NotificationUnreadCount():0}catch(e){return 0}
 }
 function cloudCopy(){
  try{
   var stamp=window._tcpStorageMeta&&(_tcpStorageMeta.lastHydrated||_tcpStorageMeta.lastSaved);
   if(stamp){
    var d=new Date(stamp);
    if(!isNaN(d.getTime()))return'Cloud updated '+d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
   }
  }catch(e){}
  return'Cloud data available'
 }
 function installNav(){
  if(typeof RP2_NAV==='undefined')return;
  RP2_NAV=[
   {g:'My Day',items:[
    ['home','My Day','🏠'],
    ['call','Call Workspace','☎'],
    ['action','Today’s Business','☑'],
    ['daily','Daily Sales & Calls','▣']
   ]},
   {g:'Companies & Sales',items:[
    ['customers','Companies','🏢'],
    ['dealdesk','Quotes','📄'],
    ['orders','Orders','📦'],
    ['leads','Leads & Prospecting','🎯'],
    ['outreach','Outreach Campaigns','📣']
   ]},
   {g:'My Profile',items:[
    ['profile','My Profile','👤'],
    ['reviews','Reviews & Recognition','⭐'],
    ['dash','Dashboard','📊'],
    ['forecast','Forecast','📈']
   ]},
   {g:'Resources',items:[
    ['products','Products & Catalogs','👕'],
    ['production','Production','🏭'],
    ['learning','Learning & Playbook','📚'],
    ['ai','AI Coach','✨']
   ]}
  ]
 }
 function periodControls(){
  try{return typeof window._rp2PeriodControls==='function'?window._rp2PeriodControls():''}catch(e){return''}
 }
 function quarterProgress(rep){
  var total={revenue:0},goal=0;
  try{total=_rp2Tot(rep)||total}catch(e){}
  try{goal=_rp2Goal(rep)||0}catch(e){}
  var pct=goal>0?Math.round(n(total.revenue)/goal*100):0;
  return{total:total,goal:goal,pct:pct}
 }
 function sideProgress(rep){
  var p=quarterProgress(rep);
  return'<div class="ps60-side-progress">'+
   '<div class="ps60-side-progress-label">'+esc(getQ()+' '+getYr())+' Progress</div>'+
   '<div class="ps60-side-ring" style="--ps60-ring:'+Math.min(100,p.pct)*3.6+'deg"><div class="ps60-side-ring-in"><div><strong>'+p.pct+'%</strong><span>of goal</span></div></div></div>'+
   '<div class="ps60-side-progress-copy"><strong>'+money(p.total.revenue)+' / '+money(p.goal)+'</strong><br>Quarter Sales</div>'+
   '<button class="ps60-link" style="width:100%;margin-top:10px" onclick="_rp2Go(\'dash\')">View full dashboard →</button>'+
  '</div>'
 }
 function shell(rep){
  _rp2.rep=rep;
  var nav=RP2_NAV.map(function(group){
   var items=group.items.map(function(item){
    return'<button data-rp2-nav="'+item[0]+'" class="rp2-nav'+(_rp2.page===item[0]?' on':'')+'" onclick="_rp2Go(\''+item[0]+'\')"><span>'+item[2]+'</span>'+item[1]+'</button>'
   }).join('');
   return'<div class="rp2-navg">'+esc(group.g)+'</div>'+items
  }).join('');
  return'<div class="rp2-app"><aside class="rp2-side">'+
   '<div class="rp2-logo">▲ SALES TRACKER<span>REP PERFORMANCE PORTAL</span></div>'+
   nav+sideProgress(rep)+
   '<div class="ps60-side-footer"><div class="ps60-side-user"><div class="ps60-side-user-mark">'+esc(initials(rep))+'</div><div><strong>'+esc(rep)+'</strong><span>Rep account</span></div><button onclick="_rpLogout()" title="Sign out">↗</button></div></div>'+
   '</aside><main class="rp2-main"><div class="rp2-top"><div class="rp2-person"><div class="rp2-person-mark">'+esc(initials(rep))+'</div><div><div class="rp2-hi">'+esc(rep)+'</div><div class="rp2-sub">Personal performance workspace · '+esc(getQ()+' '+getYr())+'</div></div></div>'+
   '<div class="ps60-top-right">'+periodControls()+'<div><button class="ps60-refresh" onclick="_rp2RefreshCloud(this,false)">↻ Refresh</button><div class="ps60-cloud-copy">'+esc(cloudCopy())+'</div></div><span class="ps60-readonly">Read only</span></div></div>'+
   '<div id="rp2-page">'+window._rp2Page()+'</div></main></div>'
 }
 function statusLabel(item){
  var due=clean(item&&item.due);
  if(due){
   try{
    var d=new Date(String(due).length===10?String(due)+'T12:00:00':due),today=new Date();
    today.setHours(12,0,0,0);d.setHours(12,0,0,0);
    var gap=Math.round((d-today)/86400000);
    if(gap<0)return{label:'Overdue',cls:'overdue'};
    if(gap===0)return{label:'Due Today',cls:'today'};
    if(gap===1)return{label:'Due Tomorrow',cls:'today'}
   }catch(e){}
  }
  return{label:'Scheduled',cls:'scheduled'}
 }
 function focusRows(rows,type){
  rows=arr(rows).slice(0,250);
  if(!rows.length)return'<div class="ps60-empty">Nothing is currently waiting in this queue.</div>';
  return rows.map(function(item){
   var name=clean(item.customer||item.company||item.title||item.number||'Item');
   var sub=clean(item.contact||item.copy||item.reason||item.status||item.source||'');
   var status=statusLabel(item);
   var click=type==='call'?
    "_ps60OpenCall('"+encodeURIComponent(name)+"')":
    type==='business'?
    "_ps60OpenBusiness('"+esc(item.page||'action')+"','"+encodeURIComponent(name)+"')":
    "_rp2Go('dealdesk')";
   return'<div class="ps60-focus-row" onclick="'+click+'"><div><div class="ps60-focus-name">'+esc(name)+'</div><div class="ps60-focus-sub">'+esc(sub)+'</div></div><span class="ps60-status '+status.cls+'">'+status.label+'</span></div>'
  }).join('')
 }
 function focusCard(cls,title,count,rows,type,buttons){
  return'<article class="ps60-focus-card '+cls+'"><div class="ps60-focus-card-head"><strong>'+esc(title)+'</strong><span>'+number(count)+'</span></div>'+
   '<div class="ps60-focus-list">'+focusRows(rows,type)+'</div><div class="ps60-focus-actions">'+buttons+'</div></article>'
 }
 function scoreboard(g,cycle,p){
  var week=g.perf.week||{},qtd=g.perf.qtd||{},goal=n(g.perf.goal),pct=goal>0?Math.round(n(qtd.revenue)/goal*100):0;
  var callDone=cycle.diagnostics?n(cycle.diagnostics.completed):n(week.calls);
  var callTarget=cycle.diagnostics?n(cycle.diagnostics.targetCount||cycle.diagnostics.set):125;
  var due=n(g.business&&g.business.lanes&&g.business.lanes.overdue&&g.business.lanes.overdue.length)+n(g.business&&g.business.lanes&&g.business.lanes.today&&g.business.lanes.today.length);
  var scores=[
   ['💲','Week Sales',money(week.revenue),number(week.orders)+' orders'],
   ['📈','Quarter Sales',money(qtd.revenue),pct+'% to goal'],
   ['☎','Account Updates',number(callDone)+' / '+number(callTarget),cycle.diagnostics?(cycle.diagnostics.status||'Current calling cycle'):'Selected-week calls'],
   ['🏆','Quarter Rank',g.perf.rank?('#'+g.perf.rank):'—','of '+number(g.perf.totalReps)+' reps'],
   ['▽','Open Pipeline',money(g.perf.pipeline),number(g.opps&&g.opps.length)+' opportunities'],
   ['▣','Due Today',number(due),'Tasks & follow-ups']
  ];
  return'<div class="ps60-scoreboard">'+scores.map(function(x){
   return'<div class="ps60-score"><div class="ps60-score-top"><div class="ps60-score-icon">'+x[0]+'</div><div><span>'+esc(x[1])+'</span><strong>'+esc(x[2])+'</strong><small>'+esc(x[3])+'</small></div></div></div>'
  }).join('')+'</div>'
 }
 function scheduleRows(g){
  var rows=arr(g.schedule).slice(0,5);
  if(!rows.length)return'<div class="ps60-empty">No dated commitments are scheduled for today.</div>';
  return rows.map(function(item){
   return'<div class="ps60-schedule-row"><span class="ps60-time">'+esc(timeText(item.due))+'</span><i class="ps60-dot"></i><div><div class="ps60-row-title">'+esc(item.title||'Scheduled item')+'</div><div class="ps60-row-copy">'+esc((item.customer?item.customer+' · ':'')+(item.source||''))+'</div></div><button class="ps60-small-btn" onclick="_ps60OpenBusiness(\''+esc(item.page||'action')+'\',\''+encodeURIComponent(item.customer||'')+'\')">Open</button></div>'
  }).join('')
 }
 function performanceCard(rep,p){
  var score=p.score||{total:0,status:{key:'red',label:'Red'}};
  var color=statusColor(score.status&&score.status.key);
  var weakest=p.rows&&p.rows.length?p.rows.slice().sort(function(a,b){return n(a.score)-n(b.score)})[0]:null;
  return'<div class="ps60-performance"><div class="ps60-performance-main"><div class="ps60-performance-score" style="--ps60-status-color:'+color+';--ps60-status-angle:'+Math.min(100,n(score.total))*3.6+'deg"><div class="ps60-performance-score-in"><div><strong>'+n(score.total).toFixed(1)+'</strong><span>'+esc(score.status&&score.status.label||'Status')+'</span></div></div></div><div class="ps60-performance-summary"><strong>Your weighted performance status</strong><p>'+(weakest?'Primary improvement area: '+esc(weakest.name)+' at '+n(weakest.score).toFixed(1)+'.':'Your detailed metric status is available in My Profile.')+'</p><button class="ps60-link" style="margin-top:8px" onclick="_rp2Go(\'profile\')">View full performance →</button></div></div>'+
   '<div class="ps60-metrics">'+arr(p.rows).slice(0,5).map(function(row){
    var c=statusColor(row.status&&row.status.key);
    return'<div class="ps60-metric" style="--ps60-metric-color:'+c+'"><span>'+esc(row.name)+'</span><strong>'+n(row.score).toFixed(0)+'</strong><i></i></div>'
   }).join('')+'</div></div>'
 }
 function attentionRows(g,cycle,p){
  var rows=[];
  var overdue=arr(g.business&&g.business.lanes&&g.business.lanes.overdue);
  if(overdue.length)rows.push({icon:'!',title:'Overdue customer work',copy:overdue.length+' item'+(overdue.length===1?'':'s')+' need a new commitment or completion.',button:'Open',page:'action'});
  var expiring=arr(g.quoteGroups&&g.quoteGroups.expiring);
  if(expiring.length)rows.push({icon:'▣',title:'Quotes expiring soon',copy:expiring.length+' quote'+(expiring.length===1?'':'s')+' expire within seven days.',button:'Review',page:'dealdesk'});
  if(cycle.diagnostics&&cycle.diagnostics.todayRemaining>0)rows.push({icon:'☎',title:'Account updates remaining',copy:cycle.diagnostics.todayRemaining+' call'+(cycle.diagnostics.todayRemaining===1?'':'s')+' remain for today’s adaptive target.',button:'Call',page:'call'});
  try{
   var today=new Date().toISOString().slice(0,10);
   if(!S.dailyRep||!S.dailyRep[today])rows.push({icon:'↻',title:'Daily entry not saved',copy:'Today’s cumulative sales entry has not been recorded.',button:'Update',page:'daily'})
  }catch(e){}
  if(p.score&&p.score.status&&p.score.status.key==='red')rows.push({icon:'△',title:'Performance status needs attention',copy:'Your weighted performance status is currently Red.',button:'Review',page:'profile'});
  if(!rows.length)rows.push({icon:'✓',title:'No urgent attention items',copy:'Your visible queues do not show an urgent issue right now.',button:'View',page:'home'});
  return rows.slice(0,5).map(function(item){
   return'<div class="ps60-attention-row"><span class="ps60-attention-icon">'+item.icon+'</span><div><div class="ps60-row-title">'+esc(item.title)+'</div><div class="ps60-row-copy">'+esc(item.copy)+'</div></div><button class="ps60-small-btn" onclick="_rp2Go(\''+item.page+'\')">'+item.button+'</button></div>'
  }).join('')
 }
 function nextActions(g,cycle){
  var items=[];
  var calls=cycle.queue.length?cycle.queue:g.calls;
  if(calls&&calls[0])items.push({title:'Call '+clean(calls[0].customer),copy:clean(calls[0].reason||calls[0].copy||'Complete the next ranked conversation.'),button:'Call',action:"_ps60OpenCall('"+encodeURIComponent(calls[0].customer)+"')"});
  var quote=arr(g.quoteGroups&&g.quoteGroups['72'])[0]||arr(g.quoteGroups&&g.quoteGroups.expiring)[0];
  if(quote)items.push({title:'Follow up with '+clean(quote.company),copy:clean(quote.number||quote.title||'Quote')+' · '+money(quote.amount),button:'Review',action:"_rp2Go('dealdesk')"});
  var business=arr(g.business&&g.business.lanes&&g.business.lanes.overdue)[0]||arr(g.business&&g.business.lanes&&g.business.lanes.today)[0];
  if(business)items.push({title:clean(business.title||'Complete today’s work'),copy:clean((business.customer?business.customer+' · ':'')+(business.copy||business.source||'')),button:'Do It',action:"_ps60OpenBusiness('"+esc(business.page||'action')+"','"+encodeURIComponent(business.customer||'')+"')"});
  if(items.length<3)items.push({title:'Review the remaining work queues',copy:'Use Today’s Business to clear promises and next steps.',button:'Open',action:"_rp2Go('action')"});
  return items.slice(0,3).map(function(item,index){
   return'<div class="ps60-action-row"><span class="ps60-action-num">'+(index+1)+'</span><div><div class="ps60-row-title">'+esc(item.title)+'</div><div class="ps60-row-copy">'+esc(item.copy)+'</div></div><button class="ps60-small-btn" onclick="'+item.action+'">'+item.button+'</button></div>'
  }).join('')
 }
 function home(){
  var rep=_rp2.rep,g=portalData(),cycle=callCycle(rep),p=performance(rep);
  var hr=new Date().getHours(),greeting=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
  var calls=cycle.queue.length?cycle.queue:g.calls;
  var business=arr(g.business&&g.business.lanes&&g.business.lanes.overdue).concat(arr(g.business&&g.business.lanes&&g.business.lanes.today));
  var q72=arr(g.quoteGroups&&g.quoteGroups['72']);
  var q7=arr(g.quoteGroups&&g.quoteGroups['7']);
  var opportunities=arr(g.opps).length;
  var tasks=n(g.business&&g.business.rows&&g.business.rows.length);
  return'<div class="ps60-shell">'+
   '<section class="ps60-hero"><div class="ps60-hero-main"><div class="ps60-target"></div><div><h1>'+esc(greeting+', '+first(rep))+'.</h1><p>Focus on the right activities, have the right conversations, and close strong.</p><div class="ps60-hero-stats"><div class="ps60-hero-stat"><i>▣</i><div><strong>'+tasks+'</strong><span>Tasks in your work queues</span></div></div><div class="ps60-hero-stat"><i>☎</i><div><strong>'+number(calls.length)+'</strong><span>Calls prioritized</span></div></div><div class="ps60-hero-stat"><i>◇</i><div><strong>'+number(opportunities)+'</strong><span>Opportunities advancing</span></div></div></div></div></div><button class="ps60-hero-action" onclick="_rp2Go(\'action\')">View full plan →</button></section>'+
   '<section class="ps60-section"><div class="ps60-section-head"><div><div class="ps60-kick">Today’s Focus</div><div class="ps60-section-title">Your prioritized work queues for today</div><div class="ps60-section-copy">The most useful work is visible first. Open the deeper workspace only when needed.</div></div><button class="ps60-link" onclick="_rp2Go(\'call\')">Open full workspace →</button></div>'+
    '<div class="ps60-focus-grid">'+
     focusCard('calls','Today’s Calls',calls.length,calls,'call','<button onclick="_rp2Go(\'call\')">Prep</button><button onclick="_rp2Go(\'call\')">Review</button><button class="primary" onclick="_ps60CallFirst()">Call All</button>')+
     focusCard('business','Today’s Business',business.length,business,'business','<button class="cyan" onclick="_rp2Go(\'action\')">Open</button><button onclick="_rp2Go(\'action\')">Review</button>')+
     focusCard('quote72','Sent Quotes 72 Hr Follow-Up',q72.length,q72,'quote','<button class="cyan" onclick="_rp2Go(\'dealdesk\')">Review All</button>')+
     focusCard('quote7','Sent Quotes 1 Week Follow-Up',q7.length,q7,'quote','<button class="cyan" onclick="_rp2Go(\'dealdesk\')">Review All</button>')+
    '</div></section>'+
   '<section class="ps60-section"><div class="ps60-section-head"><div><div class="ps60-kick">My Scoreboard</div><div class="ps60-section-title">At-a-glance performance this week and quarter</div></div><button class="ps60-link" onclick="_rp2Go(\'dash\')">View full dashboard →</button></div>'+scoreboard(g,cycle,p)+'</section>'+
   '<div class="ps60-bottom-grid">'+
    '<section class="ps60-bottom-card"><div class="ps60-bottom-head"><div><strong>Today’s Schedule</strong><span>Dated commitments</span></div></div><div class="ps60-bottom-body">'+scheduleRows(g)+'</div><div class="ps60-focus-actions"><button class="cyan" onclick="_rp2Go(\'action\')">View full schedule →</button></div></section>'+
    '<section class="ps60-bottom-card"><div class="ps60-bottom-head"><div><strong>My Performance Status</strong><span>'+esc(getQ()+' '+getYr())+' standing</span></div></div>'+performanceCard(rep,p)+'</section>'+
    '<section class="ps60-bottom-card"><div class="ps60-bottom-head"><div><strong>Notifications / Needs Attention</strong><span>'+number(unread())+' unread notification'+(unread()===1?'':'s')+'</span></div></div><div class="ps60-bottom-body">'+attentionRows(g,cycle,p)+'</div><div class="ps60-focus-actions"><button class="cyan" onclick="_rp2OpenDesktopNotifications()">View all notifications →</button></div></section>'+
    '<section class="ps60-bottom-card"><div class="ps60-bottom-head"><div><strong>Next Best Actions</strong><span>Recommended actions to drive results</span></div></div><div class="ps60-bottom-body">'+nextActions(g,cycle)+'</div><div class="ps60-focus-actions"><button class="cyan" onclick="_rp2Go(\'action\')">View all actions →</button></div></section>'+
   '</div></div>'
 }
 installNav();

 var basePage=window._rp2Page;
 window._rp2Page=function(){
  if(_rp2.page==='home')return home();
  return basePage()
 };
 window._rp2Html=shell;
 window._rp2HomeV3=home;

 window._ps60OpenCall=function(encoded){
  var name=decodeURIComponent(encoded||'');
  if(typeof window._call532Start==='function')return window._call532Start(encodeURIComponent(name));
  _rp2Go('call')
 };
 window._ps60OpenBusiness=function(page,encoded){
  var name=decodeURIComponent(encoded||'');
  if(page==='customers'&&typeof window._cw4OpenCompany==='function'){
   _rp2Go('customers');setTimeout(function(){window._cw4OpenCompany(encodeURIComponent(name),'relationships')},40);return
  }
  _rp2Go(page||'action')
 };
 window._ps60CallFirst=function(){
  var g=portalData(),cycle=callCycle(_rp2.rep),calls=cycle.queue.length?cycle.queue:g.calls;
  if(calls&&calls[0])return window._ps60OpenCall(encodeURIComponent(calls[0].customer));
  _rp2Go('call')
 };

 var baseGo=window._rp2Go;
 window._rp2Go=function(page){
  var result=baseGo.apply(this,arguments);
  setTimeout(function(){
   var overlay=document.getElementById('rp-overlay');
   if(overlay)overlay.setAttribute('data-rp-scale','manager')
  },0);
  return result
 };

 window.TCP_PROJECT_SIMPLIFY_REP_V560={
  version:'v560',
  home:home,
  shell:shell,
  portalData:portalData,
  callCycle:callCycle,
  performance:performance,
  nav:function(){return RP2_NAV}
 };

 _rp2.page='home';
 setTimeout(function(){
  try{
   installNav();
   var overlay=document.getElementById('rp-overlay');
   if(overlay&&_rp2&&_rp2.rep){
    overlay.innerHTML=shell(_rp2.rep);
    overlay.setAttribute('data-rp-scale','manager');
    if(typeof _rp2After==='function')_rp2After()
   }
  }catch(e){console.warn('[v560 rep simplify]',e)}
 },0)
})();
