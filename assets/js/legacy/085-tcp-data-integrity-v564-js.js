
(function(){
 'use strict';
 var VERSION='v564';
 var baseStorage=window._tcpStorageV528||null;
 var baseApply=baseStorage&&baseStorage.applyState;
 var baseSplit=baseStorage&&baseStorage.splitState;
 var baseCurrent=baseStorage&&baseStorage.currentFullState;
 var baseRepScore=window.TCP_TRAFFIC_SCORE_V548&&TCP_TRAFFIC_SCORE_V548.repScore;
 var HEAVY={customers:1,orders:1,orderLineItems:1,orderLineItemsUnmatched:1,reviews:1,artErrors:1,cms:1,dailySales:1,dailyRep:1,dailyCalls:1,dailyLiveBridge:1,dailyLiveReconciliation:1,coachingNotes:1,hrViolations:1,activities:1,crmActivities:1,customerActivities:1,accountActivities:1,contacts:1,crmContacts:1,customerContacts:1,accountContacts:1,quotes:1,crmQuotes:1,customerQuotes:1,opportunities:1,crmOpportunities:1,accountOpportunities:1,documents:1,files:1,products:1,catalogProducts:1};
 function n(v){var x=Number(v);return isFinite(x)?x:0}
 function arr(v){return Array.isArray(v)?v:[]}
 function clean(v){return String(v==null?'':v).trim()}
 function clone(v){if(v==null||typeof v!=='object')return v;try{return typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v))}catch(e){try{return JSON.parse(JSON.stringify(v))}catch(x){return null}}}
 function safeKey(k){return !!k&&k!=='__proto__'&&k!=='prototype'&&k!=='constructor'&&k.indexOf('__tcp')!==0}
 function ensure(){
  if(!window.S||typeof S!=='object')return;
  if(!Array.isArray(S.reps))S.reps=[];if(!S.goals)S.goals={};if(!S.data)S.data={};
  if(!Array.isArray(S.orders))S.orders=[];if(!Array.isArray(S.orderLineItems))S.orderLineItems=[];
  if(!Array.isArray(S.customers))S.customers=[];if(!Array.isArray(S.cms))S.cms=[];if(!Array.isArray(S.artErrors))S.artErrors=[];
  if(!S.dailyRep)S.dailyRep={};if(!S.dailyCalls)S.dailyCalls={};if(!S.dailyLiveBridge)S.dailyLiveBridge={};if(!S.dailyLiveReconciliation)S.dailyLiveReconciliation={};
 }
 function captureState(){
  ensure();var state={};
  Object.keys(S||{}).forEach(function(key){if(!safeKey(key))return;var value=clone(S[key]);if(value!==null||S[key]===null)state[key]=value});
  state.reps=arr(S.reps).map(function(rep){var copy=clone(rep)||{};if(copy.profile)copy.profile=Object.assign({},copy.profile,{photo:null});return copy});
  state.dailyCalls=clone(S.dailyCalls||{});state.dailyLiveBridge=clone(S.dailyLiveBridge||{});state.dailyLiveReconciliation=clone(S.dailyLiveReconciliation||{});
  state.__tcpIntegrity={version:VERSION,capturedAt:new Date().toISOString(),fields:Object.keys(state).filter(function(k){return k!=='__tcpIntegrity'}).sort()};
  return state
 }
 function applyState(state){
  if(!state||typeof state!=='object')throw new Error('Invalid tracker state');
  if(typeof baseApply==='function')baseApply(state);
  Object.keys(state).forEach(function(key){if(!safeKey(key))return;var value=clone(state[key]);if(value!==null||state[key]===null)S[key]=value});
  ensure();try{window._cw4DirectoryCache=null;window._cw4ProfileCache={}}catch(e){};return true
 }
 function splitState(state){
  var full=clone(state||captureState())||{},core={},heavy={},counts={};
  Object.keys(full).forEach(function(key){
   if(key==='__tcpLargeState')return;var value=full[key],size=0;try{size=JSON.stringify(value).length}catch(e){}
   if(HEAVY[key]||size>50000){heavy[key]=value;counts[key]=Array.isArray(value)?value.length:(value&&typeof value==='object'?Object.keys(value).length:0)}else core[key]=value
  });
  core.__tcpLargeState={version:2,key:'manager',fields:Object.keys(heavy),counts:counts,updatedAt:new Date().toISOString()};
  return{core:core,heavy:heavy}
 }
 if(baseStorage){baseStorage.currentFullState=captureState;baseStorage.applyState=applyState;baseStorage.splitState=splitState}
 window._liveTrackerStateForCloud=captureState;

 function selectedWeek(year,q,weekKey){
  var weeks=[];try{weeks=gwq(Number(year),q)||[]}catch(e){}
  var found=weekKey?weeks.find(function(w){return w.key===weekKey}):null;
  if(!found&&Number(year)===Number(typeof getYr==='function'?getYr():year)&&q===(typeof getQ==='function'?getQ():q)){
   try{var num=Number(getWN());found=weeks.find(function(w){return Number(w.num)===num})}catch(e){}
  }
  if(!found){
   var now=new Date(),past=Number(year)<now.getFullYear()||(Number(year)===now.getFullYear()&&['Q1','Q2','Q3','Q4'].indexOf(q)<Math.floor(now.getMonth()/3));
   if(past)found=weeks[weeks.length-1]||null;
   else{found=weeks.find(function(w){var s=new Date(w.start),e=new Date(w.end);e.setHours(23,59,59,999);return now>=s&&now<=e})||weeks[Math.max(0,Math.min(weeks.length-1,(typeof weeksElapsed==='function'?weeksElapsed(year,q):1)-1))]||null}
  }
  return{weeks:weeks,selected:found,index:found?weeks.findIndex(function(w){return w.key===found.key}):-1}
 }
 function periodContext(year,q,weekKey){
  var s=selectedWeek(year,q,weekKey),index=s.index<0?Math.max(0,s.weeks.length-1):s.index,through=s.weeks.slice(0,index+1);
  return{year:Number(year),q:q,weeks:s.weeks,selected:s.selected,index:index,through:through,elapsed:through.length,progress:s.weeks.length?through.length/s.weeks.length:0}
 }
 function scoreAsOf(rep,year,q,weekKey){
  var ctx=periodContext(year,q,weekKey),tot=typeof totW==='function'?totW(rep,ctx.through):{revenue:0,hours:0,acctsCalled:0,setSize:0,orders:0,art:0,credits:0},goal=typeof repGoalObj==='function'?repGoalObj(rep,year,q):{};
  var salesTarget=n(goal.rev)*ctx.progress,hoursTarget=n(goal.hrs||42.5)*ctx.elapsed,setTarget=n(tot.setSize)*ctx.progress;
  var outboundActual=n(tot.acctsCalled),outboundTarget=setTarget,outboundSource='Selected-period account-updating coverage';
  var now=new Date(),isCurrent=ctx.selected&&new Date(ctx.selected.start)<=now&&new Date(ctx.selected.end)>=now;
  if(isCurrent&&window.TCP_CALL_CYCLE_V547){try{var pace=TCP_CALL_CYCLE_V547.paceFor(rep,now);if(pace&&n(pace.expected)>0){outboundActual=n(pace.completed);outboundTarget=n(pace.expected);outboundSource='Annual Call Cycle completed through today'}}catch(e){}}
  var artErrors=n(tot.art),orders=n(tot.orders),artRate=orders?artErrors/orders*100:0,artAccuracy=orders?Math.max(0,100-artRate):100,credits=n(tot.credits),creditRate=n(tot.revenue)?credits/n(tot.revenue)*100:0;
  var metrics={sales:salesTarget?n(tot.revenue)/salesTarget*100:0,outbound:outboundTarget?outboundActual/outboundTarget*100:0,hours:hoursTarget?n(tot.hours)/hoursTarget*100:0,art:artAccuracy,creditRate:creditRate};
  var scored=window.TCP_TRAFFIC_SCORE_V548?TCP_TRAFFIC_SCORE_V548.scoreFromMetrics(metrics):{total:0,status:{key:'red',label:'Red'},metrics:metrics,contributions:{},metricStatus:{}};
  return Object.assign(scored,{rep:rep,yr:Number(year),q:q,period:'quarter',weeks:ctx.through,enteredWeeks:ctx.elapsed,totalWeeks:ctx.weeks.length,tot:tot,goal:goal,selectedWeek:ctx.selected,raw:{salesActual:n(tot.revenue),salesTarget:salesTarget,outboundActual:outboundActual,outboundTarget:outboundTarget,outboundSource:outboundSource,hoursActual:n(tot.hours),hoursTarget:hoursTarget,artErrors:artErrors,orders:orders,artRate:artRate,credits:credits,creditRate:creditRate}})
 }
 if(window.TCP_TRAFFIC_SCORE_V548){TCP_TRAFFIC_SCORE_V548.scoreAsOf=scoreAsOf;TCP_TRAFFIC_SCORE_V548.repScore=function(rep,period,yr,q){return period==='year'&&typeof baseRepScore==='function'?baseRepScore(rep,period,yr,q):scoreAsOf(rep,yr,q)}}
 window._rp2Wks=function(){return periodContext(getYr(),getQ()).through};
 window._rp2Tot=function(rep){try{return totW(rep,window._rp2Wks())||{revenue:0,orders:0,calls:0}}catch(e){return{revenue:0,orders:0,calls:0}}};
 window._rp2Ranks=function(){var wks=window._rp2Wks(),reps=typeof activeReps==='function'?activeReps():(S.reps||[]);return reps.map(function(r){var t=totW(r.name,wks);return{name:r.name,rev:n(t.revenue)}}).sort(function(a,b){return b.rev-a.rev||a.name.localeCompare(b.name)})};

 function check(level,title,detail){return{level:level,title:title,detail:detail}}
 function audit(){
  ensure();var checks=[],state=captureState(),reps=typeof activeReps==='function'?activeReps():(S.reps||[]);
  ['dailyCalls','dailyLiveBridge','dailyLiveReconciliation','orders','orderLineItems','customers','cms','artErrors'].forEach(function(key){checks.push(check(Object.prototype.hasOwnProperty.call(state,key)?'pass':'fail',key+' persistence',Object.prototype.hasOwnProperty.call(state,key)?'Included in IndexedDB and cloud snapshots.':'Missing from the captured state.'))});
  var aux=['tcp_call_cycle_engine_v547','tcp_rp_company_crm_v510','tcp_rp_action_center_v504','tcp_call_workspace_v540','tcp_automation_templates_v537'],captured=aux.filter(function(k){return typeof _isTrackerKey==='function'&&_isTrackerKey(k)}).length;
  checks.push(check(captured===aux.length?'pass':'fail','Rep workflow auxiliary storage',captured+' of '+aux.length+' critical local stores are included in backups.'));
  var liveMismatch=0,lockedMismatch=0;
  Object.keys(S.dailyLiveBridge||{}).forEach(function(weekKey){Object.keys(S.dailyLiveBridge[weekKey]||{}).forEach(function(rep){var b=S.dailyLiveBridge[weekKey][rep]||{},d=typeof gd==='function'?gd(rep+'|'+weekKey):{};var match=Math.abs(n(b.sales)-n(d.revenue))<.01&&Math.round(n(b.calls))===Math.round(n(d.acctsCalled!=null?d.acctsCalled:d.calls));if(!match){if(b.officialLocked)lockedMismatch++;else liveMismatch++}})});
  checks.push(check(liveMismatch?'fail':'pass','Daily sales/calls live bridge',liveMismatch?liveMismatch+' unlocked weekly records do not match their daily source.':'All unlocked bridge records match the weekly manager/rep source.'));
  checks.push(check(lockedMismatch?'warn':'pass','Official weekly reconciliation',lockedMismatch?lockedMismatch+' locked records differ from daily entries and need manager review.':'No locked upload mismatches are currently recorded.'));
  var badOrders=(S.orders||[]).filter(function(o){return !clean(o.rep)||!clean(o.effWeekKey||o.weekKey)}).length;
  checks.push(check(badOrders?'warn':'pass','Order-to-week linkage',badOrders?badOrders+' order rows are missing a rep or tracker week.':'All loaded order rows have a rep and tracker-week link.'));
  var scoreMismatch=0,ctx=periodContext(getYr(),getQ());
  reps.forEach(function(r){var a=scoreAsOf(r.name,getYr(),getQ(),ctx.selected&&ctx.selected.key),b=TCP_TRAFFIC_SCORE_V548.repScore(r.name,'quarter',getYr(),getQ());if(Math.abs(n(a.total)-n(b.total))>.01)scoreMismatch++});
  checks.push(check(scoreMismatch?'fail':'pass','Manager/rep performance parity',scoreMismatch?scoreMismatch+' reps produce different weighted totals.':'Manager profiles, dashboard rows, coaching, reports, and rep portal use the same as-of score.'));
  var failures=checks.filter(function(c){return c.level==='fail'}).length,warnings=checks.filter(function(c){return c.level==='warn'}).length;
  return{version:VERSION,at:new Date().toISOString(),checks:checks,failures:failures,warnings:warnings,passes:checks.length-failures-warnings,stateFields:Object.keys(state).length,activeReps:reps.length}
 }
 async function repair(){
  ensure();var dates=Object.keys(S.dailyCalls||{}).concat(Object.keys(S.dailyRep||{})).filter(function(d){return /^\d{4}-\d{2}-\d{2}$/.test(d)}).sort();
  if(dates.length&&window.TCP_DAILY_SALES_CALLS_V552){try{TCP_DAILY_SALES_CALLS_V552.syncLiveWeek(dates[dates.length-1])}catch(e){}}
  try{window._cw4DirectoryCache=null;window._cw4ProfileCache={}}catch(e){}
  if(window.TCP_PERSISTENT_DATA_V550)await TCP_PERSISTENT_DATA_V550.saveNow('data-integrity-repair-v564');
  mountAdmin(audit());try{if(typeof renderDash==='function')renderDash()}catch(e){};try{if(window._rp2&&_rp2.rep&&typeof _rp2Go==='function')_rp2Go(_rp2.page||'home')}catch(e){};return true
 }
 function row(c){return'<div class="di564-row"><span class="di564-icon '+c.level+'">'+(c.level==='pass'?'✓':c.level==='warn'?'!':'×')+'</span><div><div class="di564-title">'+esc_html(c.title)+'</div><div class="di564-detail">'+esc_html(c.detail)+'</div></div><span class="di564-status '+c.level+'">'+c.level+'</span></div>'}
 function mountAdmin(report){
  var page=document.getElementById('pg-admin');if(!page)return;var host=document.getElementById('tcp-integrity-v564');if(!host){host=document.createElement('section');host.id='tcp-integrity-v564';page.appendChild(host)}
  report=report||audit();host.innerHTML='<div class="di564-head"><div><div class="di564-kick">Data Integrity Center · Build v564</div><h3>Manager ↔ Rep source-of-truth sweep</h3><div class="di564-copy">Checks storage coverage, live bridges, weekly order links, selected-period totals, and weighted-score parity.</div></div><div class="di564-actions"><button onclick="_di564Run()">Run sweep</button><button onclick="_di564Repair()">Repair safe links</button><button class="primary" onclick="_di564Save()">Save verified snapshot</button></div></div><div class="di564-summary"><div class="di564-kpi"><span>Passed</span><strong>'+report.passes+'</strong></div><div class="di564-kpi"><span>Warnings</span><strong>'+report.warnings+'</strong></div><div class="di564-kpi"><span>Failures</span><strong>'+report.failures+'</strong></div><div class="di564-kpi"><span>State fields protected</span><strong>'+report.stateFields+'</strong></div></div><div class="di564-list">'+report.checks.map(row).join('')+'</div>'
 }
 window._di564Run=function(){mountAdmin(audit())};
 window._di564Repair=function(){repair().catch(function(e){alert('Repair failed: '+e.message)})};
 window._di564Save=function(){if(window.TCP_PERSISTENT_DATA_V550)TCP_PERSISTENT_DATA_V550.saveNow('verified-snapshot-v564').then(function(){mountAdmin(audit())});else if(typeof persist==='function'){persist();mountAdmin(audit())}};
 var baseInit=window.initAdmin;if(typeof baseInit==='function')window.initAdmin=function(){var r=baseInit.apply(this,arguments);setTimeout(function(){mountAdmin(audit())},0);return r};
 var baseGt=window.gt;if(typeof baseGt==='function')window.gt=function(){var r=baseGt.apply(this,arguments);setTimeout(function(){var p=document.getElementById('pg-admin');if(p&&p.classList.contains('active'))mountAdmin(audit())},30);return r};
 window.TCP_DATA_INTEGRITY_V564={version:VERSION,captureState:captureState,applyState:applyState,splitState:splitState,periodContext:periodContext,scoreAsOf:scoreAsOf,audit:audit,repair:repair,mountAdmin:mountAdmin};
 ensure();setTimeout(function(){var p=document.getElementById('pg-admin');if(p&&p.classList.contains('active'))mountAdmin(audit());try{if(typeof renderDash==='function'&&document.getElementById('pg-dash')&&document.getElementById('pg-dash').classList.contains('active'))renderDash()}catch(e){}},250)
})();
