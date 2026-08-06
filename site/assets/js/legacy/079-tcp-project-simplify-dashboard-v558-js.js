
(function(){
 'use strict';

 var VERSION='v558';
 var actionTab='urgent';
 var repTab='risk';
 var chart=null;

 function n(value){var number=Number(value);return isFinite(number)?number:0}
 function clean(value){return String(value==null?'':value).trim()}
 function esc(value){
  var string=String(value==null?'':value);
  return typeof esc_html==='function'?esc_html(string):string.replace(/[&<>"']/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]
  })
 }
 function money(value){
  var number=Math.round(n(value));
  var abs=Math.abs(number);
  if(abs>=1000000)return(number<0?'-$':'$')+(abs/1000000).toFixed(abs>=10000000?1:2).replace(/\.0+$/,'')+'M';
  if(abs>=1000)return(number<0?'-$':'$')+(abs/1000).toFixed(abs>=100000?0:1).replace(/\.0$/,'')+'K';
  return(number<0?'-$':'$')+abs.toLocaleString()
 }
 function fullMoney(value){return '$'+Math.round(n(value)).toLocaleString()}
 function num(value){return Math.round(n(value)).toLocaleString()}
 function pct(value){return Math.round(n(value))+'%'}
 function clamp(value,min,max){return Math.max(min,Math.min(max,n(value)))}
 function safeArray(value){return Array.isArray(value)?value:[]}
 function active(){
  try{return activeReps()}catch(e){
   return safeArray(S&&S.reps).filter(function(rep){return rep&&!rep.retired})
  }
 }
 function selectedContext(){
  var year=getYr(),quarter=getQ(),month=getM(),weekNumber=getWN();
  var weeks=gwq(year,quarter);
  var index=weeks.findIndex(function(week){return Number(week.num)===Number(weekNumber)});
  if(index<0)index=0;
  var selected=weeks[index]||null;
  var today=new Date();today.setHours(12,0,0,0);
  var currentIndex=weeks.findIndex(function(week){
   var start=new Date(week.start),end=new Date(week.end);
   start.setHours(0,0,0,0);end.setHours(23,59,59,999);
   return today>=start&&today<=end
  });
  if(currentIndex<0){
   currentIndex=Math.min(Math.max((typeof weeksElapsed==='function'?weeksElapsed(year,quarter):1)-1,0),Math.max(0,weeks.length-1))
  }
  var isCurrent=index===currentIndex;
  var isFuture=index>currentIndex;
  var elapsed=Math.max(1,index+1);
  var progress=weeks.length?elapsed/weeks.length:0;
  return{
   year:year,quarter:quarter,month:month,weekNumber:weekNumber,weeks:weeks,index:index,
   selected:selected,currentIndex:currentIndex,isCurrent:isCurrent,isFuture:isFuture,
   elapsed:elapsed,progress:progress,throughWeeks:weeks.slice(0,elapsed)
  }
 }
 function repData(context){
  return active().map(function(rep){
   var total=totW(rep.name,context.throughWeeks);
   var selected=gd(rep.name+'|'+(context.selected&&context.selected.key||''));
   var goal=repGoalObj(rep.name,context.year,context.quarter)||{};
   var revenueGoal=n(goal.rev);
   var pacedRevenueGoal=revenueGoal*context.progress;
   var accountTarget=n(total.setSize)*context.progress;
   var coverage=n(total.setSize)>0?n(total.acctsCalled)/n(total.setSize)*100:0;
   var callPace=accountTarget>0?n(total.acctsCalled)/accountTarget*100:0;
   var salesPace=pacedRevenueGoal>0?n(total.revenue)/pacedRevenueGoal*100:0;
   var artCount=typeof repArt==='function'?n(repArt(rep.name,context.throughWeeks)):0;
   var creditCost=typeof repCr==='function'?n(repCr(rep.name,context.throughWeeks)):0;
   var artRate=n(total.orders)>0?artCount/n(total.orders)*100:0;
   var hourGoal=n(goal.hrs||42.5)*context.elapsed;
   var hourPace=hourGoal>0?n(total.hours)/hourGoal*100:0;
   var qualityScore=n(total.orders)>0?Math.max(0,100-artRate):100;
   var creditRate=n(total.revenue)>0?creditCost/n(total.revenue)*100:0;
   var weighted={total:0,status:{key:'red',label:'Red',color:'#F09595'}};
   try{
    if(window.TCP_DATA_INTEGRITY_V564&&typeof TCP_DATA_INTEGRITY_V564.scoreAsOf==='function'){
     weighted=TCP_DATA_INTEGRITY_V564.scoreAsOf(rep.name,context.year,context.quarter,context.selected&&context.selected.key)
    }else{
     weighted=TCP_TRAFFIC_SCORE_V548.scoreFromMetrics({
      sales:salesPace,
      outbound:callPace,
      hours:hourPace,
      art:qualityScore,
      creditRate:creditRate
     })
    }
   }catch(e){}
   var flags=[];
   if(salesPace<80)flags.push('R');
   if(callPace<80)flags.push('C');
   if(artCount>=3)flags.push('A');
   if(creditCost>0)flags.push('$');
   return{
    name:rep.name,total:total,week:selected,goal:goal,
    revenueGoal:revenueGoal,pacedRevenueGoal:pacedRevenueGoal,
    accountTarget:accountTarget,coverage:coverage,callPace:callPace,salesPace:salesPace,
    artCount:artCount,artRate:artRate,creditCost:creditCost,creditRate:creditRate,
    hourPace:hourPace,weighted:weighted,flags:flags
   }
  })
 }
 function totals(context,rows){
  var total={
   revenue:0,goal:0,pacedGoal:0,orders:0,calls:0,accounts:0,setSize:0,hours:0,
   art:0,credits:0,weekRevenue:0,weekOrders:0,weekCalls:0
  };
  rows.forEach(function(row){
   total.revenue+=n(row.total.revenue);
   total.goal+=n(row.revenueGoal);
   total.pacedGoal+=n(row.pacedRevenueGoal);
   total.orders+=n(row.total.orders);
   total.calls+=n(row.total.calls);
   total.accounts+=n(row.total.acctsCalled);
   total.setSize+=n(row.total.setSize);
   total.hours+=n(row.total.hours);
   total.art+=n(row.artCount);
   total.credits+=n(row.creditCost);
   total.weekRevenue+=n(row.week.revenue);
   total.weekOrders+=n(row.week.orders);
   total.weekCalls+=n(row.week.calls)
  });
  total.revenuePct=total.goal>0?total.revenue/total.goal*100:0;
  total.pacePct=total.pacedGoal>0?total.revenue/total.pacedGoal*100:0;
  total.coverage=total.setSize>0?total.accounts/total.setSize*100:0;
  total.callTarget=total.setSize*context.progress;
  total.callPace=total.callTarget>0?total.accounts/total.callTarget*100:0;
  total.forecast=context.progress>0?total.revenue/context.progress:0;
  total.forecastPct=total.goal>0?total.forecast/total.goal*100:0;
  total.forecastGap=total.goal-total.forecast;
  total.needPerWeek=Math.max(0,total.goal-total.revenue)/Math.max(1,context.weeks.length-context.elapsed);
  total.artRate=total.orders>0?total.art/total.orders*100:0;
  return total
 }
 function statusColor(key){
  return key==='green'?'#5DCAA5':key==='yellow'?'#EF9F27':'#F09595'
 }
 function currentMode(context){
  return context.isFuture?{key:'future',label:'Future Week'}:
   context.isCurrent?{key:'live',label:'Live Preview'}:
   {key:'history',label:'Historical Snapshot'}
 }
 function options(values,selectedValue,labeler){
  return values.map(function(value){
   var raw=typeof value==='object'?(value.value!=null?value.value:value.num):value;
   var label=labeler?labeler(value):typeof value==='object'?(value.label||raw):raw;
   return'<option value="'+esc(raw)+'"'+(String(raw)===String(selectedValue)?' selected':'')+'>'+esc(label)+'</option>'
  }).join('')
 }
 function periodControls(context){
  var years=typeof YEARS!=='undefined'?YEARS:[2026,2027,2028,2029,2030];
  var quarters=typeof QTRS!=='undefined'?QTRS:['Q1','Q2','Q3','Q4'];
  var months=typeof QM!=='undefined'&&QM[context.quarter]?QM[context.quarter]:[context.month];
  var monthWeeks=context.weeks.filter(function(week){return week.month===context.month});
  var mode=currentMode(context);
  return'<div class="ps58-periods">'+
   '<label class="ps58-period">Year<select onchange="_ps58Period(\'year\',this.value)">'+options(years,context.year)+'</select></label>'+
   '<label class="ps58-period">Qtr<select onchange="_ps58Period(\'quarter\',this.value)">'+options(quarters,context.quarter)+'</select></label>'+
   '<label class="ps58-period">Month<select onchange="_ps58Period(\'month\',this.value)">'+options(months,context.month)+'</select></label>'+
   '<label class="ps58-period">Week<select onchange="_ps58Period(\'week\',this.value)">'+options(monthWeeks,context.weekNumber,function(week){return'Wk '+week.num})+'</select></label>'+
   '<span class="ps58-live '+mode.key+'"> '+mode.label+'</span>'+
  '</div>'
 }
 function brief(context,total,rows){
  var revenueGap=total.revenue-total.pacedGoal;
  var callGap=total.accounts-total.callTarget;
  var top=rows.slice().sort(function(a,b){return b.week.revenue-a.week.revenue})[0];
  var risks=[];
  if(revenueGap<0)risks.push('revenue is '+fullMoney(Math.abs(revenueGap))+' behind paced plan');
  if(callGap<0)risks.push(num(Math.abs(callGap))+' customer calls remain behind pace');
  if(total.artRate>1)risks.push('quality risk is elevated at '+total.artRate.toFixed(1)+'% art errors');
  if(!risks.length)risks.push('the team is currently on pace across the primary indicators');
  var focus=revenueGap<0?'increase sales activity and review the lowest-paced reps':
   callGap<0?'increase customer outreach and clear the call backlog':
   total.artRate>1?'reduce art-error causes before they create additional cost':
   'protect the current pace and repeat the strongest behaviors';
  return'<div class="ps58-brief-icon">✦</div><div class="ps58-brief-copy"><strong>AI Snapshot</strong> · '+esc(risks.join('; '))+'. '+
   (top?'<b>Top signal:</b> '+esc(top.name)+' leads the selected week at '+fullMoney(top.week.revenue)+'. ':'')+
   '<b>Manager focus:</b> '+esc(focus)+'.</div>'
 }
 function kpiCard(config){
  var stateClass=config.good?'good':'';
  return'<article class="ps58-kpi" style="--ps58-accent:'+config.accent+';--ps58-shadow:'+config.shadow+';--ps58-glow:'+config.glow+';--ps58-width:'+clamp(config.width,0,100)+'%">'+
   '<div class="ps58-kpi-top"><div class="ps58-kpi-label"><span class="ps58-kpi-icon">'+config.icon+'</span>'+esc(config.label)+'</div>'+
   '<span class="ps58-kpi-state '+stateClass+'">'+esc(config.state)+'</span></div>'+
   '<div class="ps58-kpi-value">'+config.value+'</div>'+
   '<div class="ps58-kpi-sub">'+config.sub+'</div>'+
   '<div class="ps58-track"><i></i></div>'+
   '<div class="ps58-kpi-foot"><span>'+esc(config.leftLabel)+'</span><strong>'+esc(config.rightLabel)+'</strong></div>'+
  '</article>'
 }
 function kpis(context,total){
  var revenueGap=total.revenue-total.pacedGoal;
  var callGap=total.accounts-total.callTarget;
  var forecastGap=total.forecast-total.goal;
  var qualityGood=total.artRate<=1;
  return'<div class="ps58-kpi-grid">'+
   kpiCard({
    label:'Revenue Pace',icon:'$',accent:'#FA873D',shadow:'rgba(250,135,61,.25)',glow:'rgba(250,135,61,.18)',
    state:(revenueGap>=0?'Ahead by ':'Behind by ')+fullMoney(Math.abs(revenueGap)),good:revenueGap>=0,
    value:fullMoney(total.revenue),sub:pct(total.revenuePct)+' of '+fullMoney(total.goal)+' goal',
    width:total.revenuePct,leftLabel:'Goal',rightLabel:fullMoney(total.goal)
   })+
   kpiCard({
    label:'Customers Called',icon:'☎',accent:'#00AFEF',shadow:'rgba(0,175,239,.25)',glow:'rgba(0,175,239,.18)',
    state:(callGap>=0?'Ahead by ':'Behind by ')+num(Math.abs(callGap))+' accts',good:callGap>=0,
    value:num(total.accounts)+' / '+num(total.setSize),sub:pct(total.coverage)+' of customers reached',
    width:total.coverage,leftLabel:'Customer set',rightLabel:num(total.setSize)
   })+
   kpiCard({
    label:'Forecast Projection',icon:'◎',accent:'#8B5CF6',shadow:'rgba(139,92,246,.25)',glow:'rgba(139,92,246,.18)',
    state:(forecastGap>=0?'Projected '+fullMoney(forecastGap)+' ahead':'Projected '+fullMoney(Math.abs(forecastGap))+' short'),good:forecastGap>=0,
    value:fullMoney(total.forecast),sub:pct(total.forecastPct)+' of '+fullMoney(total.goal)+' goal',
    width:total.forecastPct,leftLabel:'Projection',rightLabel:fullMoney(total.goal)
   })+
   kpiCard({
    label:'Quality Health',icon:'△',accent:'#B87333',shadow:'rgba(184,115,51,.25)',glow:'rgba(184,115,51,.18)',
    state:qualityGood?'Quality within target':total.artRate.toFixed(1)+'% art rate',good:qualityGood,
    value:num(total.art)+' / '+num(total.orders),sub:'Art errors ('+total.artRate.toFixed(1)+'%) · '+fullMoney(total.credits)+' credits',
    width:Math.max(4,100-Math.min(100,total.artRate*20)),leftLabel:'Goal',rightLabel:'≤1% art rate'
   })+
  '</div>'
 }
 function weeklySeries(context,rows,total){
  return context.weeks.map(function(week){
   var revenue=0;
   rows.forEach(function(row){revenue+=n(gd(row.name+'|'+week.key).revenue)});
   return{week:week,revenue:revenue,target:context.weeks.length?total.goal/context.weeks.length:0}
  })
 }
 function chartPanel(context,rows,total){
  return'<section class="ps58-card ps58-chart-card">'+
   '<div class="ps58-section-head"><div><div class="ps58-section-label">Performance Snapshot</div><h2>Weekly Revenue Trend · '+esc(context.quarter)+' '+context.year+'</h2></div></div>'+
   '<div class="ps58-chart-wrap"><canvas id="ps58RevenueChart"></canvas></div>'+
   '<div class="ps58-chart-progress"><div class="ps58-chart-progress-head"><span>'+esc(context.quarter)+' Progress</span><strong>'+pct(context.progress*100)+'</strong></div>'+
   '<div class="ps58-chart-progress-bar"><i style="width:'+clamp(context.progress*100,0,100)+'%"></i></div>'+
   '<div class="ps58-chart-progress-copy"><strong>'+fullMoney(total.revenue)+'</strong> of '+fullMoney(total.goal)+' · '+(context.isFuture?'Future week selected':'Projection updates through the selected week')+'</div></div>'+
  '</section>'
 }
 function progressBlock(label,value,goal,shouldBe,percent,gapLabel){
  return'<div class="ps58-progress-block">'+
   '<div class="ps58-progress-head"><span>'+esc(label)+'</span><b>'+esc(gapLabel)+'</b></div>'+
   '<div class="ps58-progress-value">'+esc(value)+'</div>'+
   '<div class="ps58-marker-track"><i style="width:'+clamp(percent,0,100)+'%"></i><em style="left:'+clamp(goal>0?shouldBe/goal*100:0,0,100)+'%"></em></div>'+
   '<div class="ps58-marker-labels"><span><strong>0</strong>Start</span><span><strong>'+esc(typeof shouldBe==='number'?fullMoney(shouldBe):shouldBe)+'</strong>Should Be</span><span><strong>'+esc(typeof goal==='number'?fullMoney(goal):goal)+'</strong>Goal</span></div>'+
  '</div>'
 }
 function progressPanel(context,total){
  var revGap=total.revenue-total.pacedGoal;
  var callGap=total.accounts-total.callTarget;
  return'<section class="ps58-card ps58-progress-card">'+
   '<div class="ps58-section-head"><div><div class="ps58-section-label">Progress vs Goal</div><h2>Where the team should be</h2></div></div>'+
   progressBlock('Revenue',fullMoney(total.revenue),total.goal,total.pacedGoal,total.revenuePct,(revGap>=0?'Ahead by ':'Behind by ')+fullMoney(Math.abs(revGap)))+
   '<div class="ps58-progress-block">'+
    '<div class="ps58-progress-head"><span>Customers Called</span><b>'+(callGap>=0?'Ahead by ':'Behind by ')+num(Math.abs(callGap))+'</b></div>'+
    '<div class="ps58-progress-value">'+num(total.accounts)+'</div>'+
    '<div class="ps58-marker-track"><i style="width:'+clamp(total.coverage,0,100)+'%"></i><em style="left:'+clamp(total.setSize>0?total.callTarget/total.setSize*100:0,0,100)+'%"></em></div>'+
    '<div class="ps58-marker-labels"><span><strong>0</strong>Start</span><span><strong>'+num(total.callTarget)+'</strong>Should Be</span><span><strong>'+num(total.setSize)+'</strong>Customer Set</span></div>'+
   '</div>'+
  '</section>'
 }
 function makeActions(context,rows,total){
  var zeroCalls=rows.filter(function(row){return n(row.week.calls)===0});
  var artRisk=rows.filter(function(row){return row.artCount>=3});
  var revenueRisk=rows.filter(function(row){return row.salesPace<80});
  var callRisk=rows.filter(function(row){return row.callPace<80});
  var urgent=[];
  if(zeroCalls.length)urgent.push({severity:'high',icon:'☎',title:zeroCalls[0].name+' — zero calls',copy:'No calls are logged for the selected week. '+Math.max(0,zeroCalls.length-1)+' additional rep(s) also need review.',page:'profiles',rep:zeroCalls[0].name});
  if(artRisk.length)urgent.push({severity:'high',icon:'⚠',title:'Art errors above target',copy:artRisk.length+' rep(s) have three or more quarter-to-date art errors.',page:'art'});
  if(total.forecastGap>0)urgent.push({severity:'high',icon:'↘',title:'Forecast below goal',copy:'The current projection is '+fullMoney(total.forecastGap)+' short of the quarter goal.',page:'intel'});
  var dailyMissing=false;
  try{
   var today=new Date().toISOString().slice(0,10);
   dailyMissing=!S.dailyRep||!S.dailyRep[today]
  }catch(e){}
  if(dailyMissing)urgent.push({severity:'medium',icon:'▣',title:'Daily sales not logged',copy:'No per-rep daily sales entry is saved for today.',page:'daily'});
  if(!urgent.length)urgent.push({severity:'info',icon:'✓',title:'No urgent alerts',copy:'The selected snapshot has no critical dashboard alerts.',page:'dash'});

  var coaching=rows.slice().sort(function(a,b){return a.weighted.total-b.weighted.total}).slice(0,6).map(function(row){
   return{
    severity:row.weighted.status.key==='red'?'high':'medium',
    icon:'◉',
    title:row.name+' — '+row.weighted.status.label,
    copy:'Weighted '+row.weighted.total.toFixed(1)+' · revenue pace '+Math.round(row.salesPace)+'% · call pace '+Math.round(row.callPace)+'%.',
    page:'profiles',rep:row.name
   }
  });
  var watchlist=[
   {severity:total.revenue<total.pacedGoal?'high':'info',icon:'$',title:'Revenue pace',copy:(total.revenue<total.pacedGoal?fullMoney(total.pacedGoal-total.revenue)+' behind paced target.':'Team revenue is at or above paced target.'),page:'year'},
   {severity:total.accounts<total.callTarget?'medium':'info',icon:'☎',title:'Customer coverage',copy:(total.accounts<total.callTarget?num(total.callTarget-total.accounts)+' customer contacts behind paced target.':'Customer coverage is at or above paced target.'),page:'daily'},
   {severity:total.artRate>1?'high':'info',icon:'△',title:'Quality signal',copy:num(total.art)+' art errors across '+num(total.orders)+' orders ('+total.artRate.toFixed(1)+'%).',page:'art'}
  ];
  var priorities=[
   {severity:revenueRisk.length?'medium':'info',icon:'1',title:'Revenue Focus',copy:revenueRisk.length+' rep(s) below 80% of paced revenue target.',page:'profiles'},
   {severity:callRisk.length?'medium':'info',icon:'2',title:'Customer-Called Focus',copy:callRisk.length+' rep(s) below 80% of paced customer-call target.',page:'daily'},
   {severity:artRisk.length?'medium':'info',icon:'3',title:'Quality Focus',copy:artRisk.length+' rep(s) at three or more quarter art errors.',page:'art'}
  ];
  return{urgent:urgent,coaching:coaching,watchlist:watchlist,priorities:priorities}
 }
 function actionRow(item){
  var severity=item.severity==='high'?'High':item.severity==='medium'?'Medium':'Info';
  var dot=item.severity==='high'?'':item.severity==='medium'?'medium':'info';
  return'<div class="ps58-action-row" onclick="_ps58Action('+JSON.stringify({page:item.page||'',rep:item.rep||''}).replace(/"/g,'&quot;')+')">'+
   '<span class="ps58-dot '+dot+'"></span><span class="ps58-action-icon">'+esc(item.icon)+'</span>'+
   '<div><div class="ps58-action-title">'+esc(item.title)+'</div><div class="ps58-action-copy">'+esc(item.copy)+'</div></div>'+
   '<span class="ps58-severity '+(item.severity==='high'?'ps58-danger':item.severity==='medium'?'ps58-warning':'ps58-cyan')+'">'+severity+'</span><span class="ps58-action-arrow">›</span></div>'
 }
 function actionCenter(){
  return'<section class="ps58-card ps58-action-card">'+
   '<div class="ps58-panel-head"><div><div class="ps58-section-label">Action Center</div><h2 style="margin:4px 0 0;font-size:16px">What needs attention</h2></div></div>'+
   '<div class="ps58-tabs">'+
    ['urgent','coaching','watchlist','priorities'].map(function(tab){
     var label=tab==='urgent'?'Urgent Alerts':tab==='coaching'?'Coaching Queue':tab.charAt(0).toUpperCase()+tab.slice(1);
     return'<button class="ps58-tab '+(actionTab===tab?'on':'')+'" onclick="_ps58SetActionTab(\''+tab+'\')">'+label+'</button>'
    }).join('')+
   '</div><div id="ps58ActionList" class="ps58-action-list"></div>'+
  '</section>'
 }
 function forecastCard(rows,total){
  var projected=rows.map(function(row){
   var forecast=row.total.revenue>0?row.total.revenue/Math.max(.01,window._ps58Context.progress):0;
   return{name:row.name,pct:row.revenueGoal>0?forecast/row.revenueGoal*100:0}
  }).sort(function(a,b){return b.pct-a.pct});
  var high=projected[0],low=projected[projected.length-1];
  return'<section class="ps58-card ps58-side-card">'+
   '<div class="ps58-section-label" style="color:#C5A3FF">Forecast Center</div>'+
   '<div class="ps58-side-row"><span>Projection</span><strong>'+fullMoney(total.forecast)+'<small>'+pct(total.forecastPct)+' of goal</small></strong></div>'+
   '<div class="ps58-side-row"><span>Goal</span><strong>'+fullMoney(total.goal)+'<small>Quarter target</small></strong></div>'+
   '<div class="ps58-side-row"><span>Gap</span><strong class="'+(total.forecastGap>0?'ps58-warning':'ps58-positive')+'">'+fullMoney(Math.abs(total.forecastGap))+'<small>'+(total.forecastGap>0?'Projected shortfall':'Projected surplus')+'</small></strong></div>'+
   '<div class="ps58-side-row"><span>Need / Week</span><strong>'+fullMoney(total.needPerWeek)+'<small>'+Math.max(0,window._ps58Context.weeks.length-window._ps58Context.elapsed)+' weeks remaining</small></strong></div>'+
   '<div class="ps58-side-row"><span>Highest Forecast Rep</span><strong class="ps58-positive">'+esc(high&&high.name||'—')+'<small>'+Math.round(high&&high.pct||0)+'% projected</small></strong></div>'+
   '<div class="ps58-side-row"><span>Lowest Forecast Rep</span><strong class="ps58-warning">'+esc(low&&low.name||'—')+'<small>'+Math.round(low&&low.pct||0)+'% projected</small></strong></div>'+
   '<button class="ps58-link" onclick="_ps58Nav(\'intel\')">View forecast details ›</button>'+
  '</section>'
 }
 function productionCard(){
  var rows=[];
  try{rows=typeof getProductionRows==='function'?getProductionRows():[]}catch(e){}
  rows=safeArray(rows);
  var visible=rows.slice(0,3);
  return'<section class="ps58-card ps58-side-card">'+
   '<div class="ps58-section-label" style="color:#C5A3FF">Production Pulse</div>'+
   (visible.length?visible.map(function(row){
    var label=row.decoration||row.department||row.type||'Production';
    var ship=row.shipWeek||row.shipDate||row.status||'Review feed';
    return'<div class="ps58-side-row"><span>● '+esc(label)+'</span><strong>'+esc(ship)+'<small>'+esc(row.updated||row.note||'Live production feed')+'</small></strong></div>'
   }).join(''):'<div class="ps58-empty" style="padding:20px 4px">Production feed is not connected.</div>')+
   '<button class="ps58-link" onclick="_ps58Nav(\'prodintel\')">View production hub ›</button>'+
  '</section>'
 }
 function winsCard(rows){
  var topRevenue=rows.slice().sort(function(a,b){return b.week.revenue-a.week.revenue})[0];
  var topCalls=rows.slice().sort(function(a,b){return b.week.calls-a.week.calls})[0];
  var topOrders=rows.slice().sort(function(a,b){return b.week.orders-a.week.orders})[0];
  var standout=rows.filter(function(row){return row.weighted.status.key==='green'}).sort(function(a,b){return b.weighted.total-a.weighted.total})[0];
  return'<section class="ps58-card ps58-side-card">'+
   '<div class="ps58-section-label" style="color:#5DCAA5">Positive Momentum</div>'+
   '<div class="ps58-side-row"><span>Largest Revenue</span><strong>'+esc(topRevenue&&topRevenue.name||'—')+'<small>'+fullMoney(topRevenue&&topRevenue.week.revenue||0)+'</small></strong></div>'+
   '<div class="ps58-side-row"><span>Most Customers Called</span><strong>'+esc(topCalls&&topCalls.name||'—')+'<small>'+num(topCalls&&topCalls.week.calls||0)+' calls</small></strong></div>'+
   '<div class="ps58-side-row"><span>Most Orders</span><strong>'+esc(topOrders&&topOrders.name||'—')+'<small>'+num(topOrders&&topOrders.week.orders||0)+' orders</small></strong></div>'+
   '<div class="ps58-side-row"><span>On-Pace Standout</span><strong class="ps58-positive">'+esc(standout&&standout.name||'—')+'<small>'+(standout?'Weighted '+standout.weighted.total.toFixed(1):'No standout yet')+'</small></strong></div>'+
   '<button class="ps58-link" onclick="_ps58SetRepTab(\'top\')">View wins board ›</button>'+
  '</section>'
 }
 function repPerformance(){
  return'<section class="ps58-card ps58-rep-card">'+
   '<div class="ps58-panel-head"><div><div class="ps58-section-label">Rep Performance</div><h2 style="margin:4px 0 0;font-size:16px">Who needs attention or recognition</h2></div></div>'+
   '<div class="ps58-tabs">'+
    '<button class="ps58-tab '+(repTab==='risk'?'on':'')+'" onclick="_ps58SetRepTab(\'risk\')">At Risk</button>'+
    '<button class="ps58-tab '+(repTab==='top'?'on':'')+'" onclick="_ps58SetRepTab(\'top\')">Top Performers</button>'+
    '<button class="ps58-tab '+(repTab==='all'?'on':'')+'" onclick="_ps58SetRepTab(\'all\')">All Reps</button>'+
   '</div><div id="ps58RepTable" class="ps58-rep-table-wrap"></div>'+
  '</section>'
 }
 function priorityPanel(rows,total){
  var revRisk=rows.filter(function(row){return row.salesPace<80}).length;
  var callRisk=rows.filter(function(row){return row.callPace<80}).length;
  var artRisk=rows.filter(function(row){return row.artCount>=3}).length;
  var list=[
   ['Revenue Focus',revRisk+' reps below revenue pace'],
   ['Customer-Called Focus',callRisk+' reps below customer-call pace'],
   ['Quality Focus',artRisk+' reps with 3+ art errors']
  ];
  return list.map(function(item,index){
   return'<div class="ps58-priority"><b>'+(index+1)+'</b><div><strong>'+esc(item[0])+'</strong><span>'+esc(item[1])+'</span></div></div>'
  }).join('')
 }
 function recentNotes(){
  var notes=[];
  safeArray(S.coachingNotes).slice(-4).reverse().forEach(function(note){
   notes.push({title:(note.rep||'Rep')+' · '+(note.type||'Coaching'),copy:note.note||note.desc||'Coaching note'})
  });
  safeArray(S.hrViolations).slice(-3).reverse().forEach(function(note){
   notes.push({title:(note.rep||'Rep')+' · HR',copy:note.desc||note.note||note.category||'HR follow-up'})
  });
  if(!notes.length)return'<div class="ps58-review-empty">No recent coaching or HR notes logged.</div>';
  return notes.slice(0,4).map(function(note){
   return'<div class="ps58-recent-note"><strong>'+esc(note.title)+'</strong><span>'+esc(clean(note.copy).slice(0,135))+'</span></div>'
  }).join('')
 }
 function notesSection(context,rows,total){
  var key='tcp_weekly_manager_notes_'+context.year+'_'+context.quarter+'_'+(context.selected&&context.selected.key||'');
  var note='';
  try{note=localStorage.getItem(key)||''}catch(e){}
  return'<section class="ps58-card ps58-notes-card">'+
   '<div class="ps58-panel-head"><div><div class="ps58-section-label">Manager Notes & Reviews</div><h2 style="margin:4px 0 0;font-size:16px">Close the loop</h2></div></div>'+
   '<div class="ps58-notes-grid">'+
    '<div class="ps58-note-panel"><div class="ps58-note-title">This Week’s Priorities</div>'+priorityPanel(rows,total)+'<button class="ps58-link" onclick="_ps58SetActionTab(\'priorities\')">View all priorities ›</button></div>'+
    '<div class="ps58-note-panel"><div class="ps58-note-title">Manager Notes</div><textarea id="wkManagerNotes" data-note-key="'+esc(key)+'" placeholder="Trade show pushes, staffing context, production delays, coaching focus, major wins...">'+esc(note)+'</textarea>'+
     '<div class="ps58-note-actions"><button onclick="_ps58SaveNotes()">Save notes</button><span id="wkNotesStatus" class="ps58-muted"></span></div></div>'+
    '<div class="ps58-note-panel"><div class="ps58-note-title">Reviews & Notes</div>'+recentNotes()+'<button class="ps58-link" onclick="_ps58Nav(\'coach\')">Open coaching center ›</button></div>'+
   '</div>'+
  '</section>'
 }
 function footer(context){
  return'<div class="ps58-footer"><div class="ps58-footer-status"><span>Last updated: '+new Date().toLocaleString()+'</span><i></i><span>'+esc(currentMode(context).label)+'</span></div>'+
   '<div class="ps58-footer-actions"><button onclick="buildQuarterEndReport()">▥ Quarter-end report</button><button onclick="buildDeepQuarterReport()">◉ Deep quarter report</button><button onclick="printDashboard()">▣ Print dashboard</button></div></div>'
 }
 function shell(context,rows,total){
  window._ps58Context=context;
  window._ps58Rows=rows;
  window._ps58Totals=total;
  window._ps58Actions=makeActions(context,rows,total);
  var selectedLabel=context.selected?context.selected.label:'Week '+context.weekNumber;
  return'<div class="ps58-shell">'+
   '<header class="ps58-header"><div><h1 class="ps58-title">Sales Tracker</h1><div class="ps58-context"><span>'+esc(context.quarter)+' '+context.year+'</span><i></i><span>'+esc(context.month)+'</span><i></i><span>'+esc(selectedLabel)+'</span></div></div>'+periodControls(context)+'</header>'+
   '<div class="ps58-brief">'+brief(context,total,rows)+'</div>'+
   '<div class="ps58-section-head"><div><div class="ps58-section-label">Executive Snapshot</div></div></div>'+
   kpis(context,total)+
   '<div class="ps58-main-grid">'+chartPanel(context,rows,total)+progressPanel(context,total)+'</div>'+
   '<div class="ps58-main-grid">'+actionCenter()+forecastCard(rows,total)+'</div>'+
   '<div class="ps58-main-grid">'+repPerformance()+'<div>'+productionCard()+winsCard(rows)+'</div></div>'+
   notesSection(context,rows,total)+footer(context)+
  '</div>'
 }
 function renderActionTab(){
  var host=document.getElementById('ps58ActionList');if(!host)return;
  var data=window._ps58Actions&&window._ps58Actions[actionTab]||[];
  host.innerHTML=data.length?data.map(actionRow).join(''):'<div class="ps58-empty">No items in this view.</div>';
  document.querySelectorAll('#pg-dash .ps58-action-card .ps58-tab').forEach(function(button){
   var label=clean(button.textContent).toLowerCase();
   button.classList.toggle('on',
    (actionTab==='urgent'&&label.indexOf('urgent')===0)||
    (actionTab==='coaching'&&label.indexOf('coaching')===0)||
    label===actionTab
   )
  })
 }
 function renderRepTable(){
  var host=document.getElementById('ps58RepTable');if(!host)return;
  var rows=(window._ps58Rows||[]).slice();
  if(repTab==='risk')rows=rows.filter(function(row){return row.weighted.status.key!=='green'}).sort(function(a,b){return a.weighted.total-b.weighted.total});
  else if(repTab==='top')rows=rows.filter(function(row){return row.weighted.status.key==='green'}).sort(function(a,b){return b.weighted.total-a.weighted.total});
  else rows.sort(function(a,b){return b.weighted.total-a.weighted.total});
  if(!rows.length){
   host.innerHTML='<div class="ps58-empty">'+(repTab==='risk'?'No reps are currently Yellow or Red.':'No reps match this view.')+'</div>';
   return
  }
  host.innerHTML='<table class="ps58-rep-table"><thead><tr><th>Rep</th><th>QTD Revenue</th><th>Call Coverage</th><th>Orders</th><th>Pace vs Goal</th><th>Flags</th></tr></thead><tbody>'+
   rows.map(function(row){
    var key=row.weighted.status.key;
    var color=statusColor(key);
    return'<tr data-rep="'+esc(row.name)+'" onclick="_ps58OpenRep(this.dataset.rep)">'+
     '<td><div class="ps58-rep-name-cell"><i class="ps58-rep-light" style="background:'+color+';box-shadow:0 0 10px '+color+'"></i><strong>'+esc(row.name)+'</strong></div></td>'+
     '<td>'+fullMoney(row.total.revenue)+'</td>'+
     '<td>'+num(row.total.acctsCalled)+' / '+num(row.total.setSize)+' ('+Math.round(row.coverage)+'%)</td>'+
     '<td>'+num(row.total.orders)+'</td>'+
     '<td>'+Math.round(row.salesPace)+'% <span class="ps58-mini-track"><i style="width:'+clamp(row.salesPace,0,100)+'%"></i></span></td>'+
     '<td><div class="ps58-flags">'+(row.flags.length?row.flags.map(function(flag){return'<span class="ps58-flag">'+esc(flag)+'</span>'}).join(''):'<span class="ps58-positive">Clear</span>')+'</div></td>'+
    '</tr>'
   }).join('')+'</tbody></table>';
  document.querySelectorAll('#pg-dash .ps58-rep-card .ps58-tab').forEach(function(button){
   var label=clean(button.textContent).toLowerCase();
   button.classList.toggle('on',
    (repTab==='risk'&&label.indexOf('at risk')===0)||
    (repTab==='top'&&label.indexOf('top')===0)||
    (repTab==='all'&&label.indexOf('all')===0)
   )
  })
 }
 function renderChart(context,rows,total){
  var canvas=document.getElementById('ps58RevenueChart');
  if(!canvas||typeof Chart==='undefined')return;
  if(chart){try{chart.destroy()}catch(e){}}
  var series=weeklySeries(context,rows,total);
  var current=context.index;
  chart=new Chart(canvas,{
   type:'bar',
   data:{
    labels:series.map(function(item){return'Wk '+item.week.num}),
    datasets:[
     {
      label:'Revenue',
      data:series.map(function(item){return item.revenue}),
      backgroundColor:series.map(function(item,index){return index===current?'rgba(0,175,239,.78)':'rgba(250,135,61,.90)'}),
      borderColor:series.map(function(item,index){return index===current?'#00AFEF':'#FA873D'}),
      borderWidth:1,
      borderRadius:4,
      maxBarThickness:33
     },
     {
      type:'line',
      label:'Weekly Goal',
      data:series.map(function(item){return item.target}),
      borderColor:'#DCE5EC',
      borderWidth:1.4,
      borderDash:[5,5],
      pointRadius:0,
      tension:.15
     }
    ]
   },
   options:{
    responsive:true,
    maintainAspectRatio:false,
    plugins:{
     legend:{position:'top',align:'start',labels:{color:'#A4B0BF',boxWidth:9,usePointStyle:true,font:{size:9,weight:'700'}}},
     tooltip:{callbacks:{label:function(context){return context.dataset.label+': '+fullMoney(context.raw)}}}
    },
    scales:{
     x:{grid:{display:false},ticks:{color:'#748296',font:{size:8,weight:'700'}}},
     y:{beginAtZero:true,grid:{color:'rgba(148,163,184,.10)'},ticks:{color:'#748296',font:{size:8},callback:function(value){return money(value)}}}
    }
   }
  })
 }
 function render(){
  var page=document.getElementById('pg-dash');if(!page)return;
  var context=selectedContext();
  var rows=repData(context);
  var total=totals(context,rows);
  page.classList.add('ps58-dashboard');
  page.innerHTML=shell(context,rows,total);
  renderActionTab();
  renderRepTable();
  renderChart(context,rows,total);
  document.body.classList.toggle('ps58-dashboard-active',page.classList.contains('active'))
 }
 window.renderDash=render;
 window.renderDashWidgets=render;
 window._ps58SetActionTab=function(tab){actionTab=tab;renderActionTab()};
 window._ps58SetRepTab=function(tab){repTab=tab;renderRepTable()};
 window._ps58SaveNotes=function(){
  var area=document.getElementById('wkManagerNotes');if(!area)return;
  var key=area.dataset.noteKey;
  try{localStorage.setItem(key,area.value||'')}catch(e){}
  var status=document.getElementById('wkNotesStatus');
  if(status){status.textContent='Saved ✓';setTimeout(function(){status.textContent=''},1600)}
 };
 window._ps58Period=function(kind,value){
  if(kind==='year'){
   var year=document.getElementById('selYr');if(year)year.value=value;
   if(typeof onYrChange==='function')onYrChange()
  }else if(kind==='quarter'){
   var quarter=document.getElementById('selQ');if(quarter)quarter.value=value;
   if(typeof onQChange==='function')onQChange()
  }else if(kind==='month'){
   var month=document.getElementById('selM');if(month)month.value=value;
   if(typeof onMChange==='function')onMChange()
  }else if(kind==='week'){
   var week=document.getElementById('selW');if(week)week.value=value;
   if(typeof onWChange==='function')onWChange()
  }
 };
 window._ps58Nav=function(pageName){
  var button=[].slice.call(document.querySelectorAll('#tabBar button')).find(function(item){
   var click=item.getAttribute('onclick')||'';
   return click.indexOf("gt('"+pageName+"'")>=0||item.dataset.navLabel&&clean(item.dataset.navLabel).toLowerCase()===pageName
  });
  if(typeof gt==='function'&&button)gt(pageName,button)
 };
 window._ps58OpenRep=function(name){
  var button=[].slice.call(document.querySelectorAll('#tabBar button')).find(function(item){
   return clean(item.dataset.navLabel).toLowerCase()==='rep profiles'
  });
  if(typeof gt==='function'&&button)gt('profiles',button);
  setTimeout(function(){if(typeof selectRep==='function')selectRep(name)},60)
 };
 window._ps58Action=function(spec){
  spec=spec||{};
  if(spec.rep){window._ps58OpenRep(spec.rep);return}
  if(spec.page&&spec.page!=='dash')window._ps58Nav(spec.page)
 };

 var observer=new MutationObserver(function(){
  var page=document.getElementById('pg-dash');
  document.body.classList.toggle('ps58-dashboard-active',!!(page&&page.classList.contains('active')));
 });
 var page=document.getElementById('pg-dash');
 if(page)observer.observe(page,{attributes:true,attributeFilter:['class']});

 window.TCP_PROJECT_SIMPLIFY_DASHBOARD_V558={
  version:VERSION,
  render:render,
  selectedContext:selectedContext,
  repData:repData,
  totals:totals,
  makeActions:makeActions,
  setActionTab:function(tab){actionTab=tab;renderActionTab()},
  setRepTab:function(tab){repTab=tab;renderRepTable()}
 };

 setTimeout(function(){
  var dashboard=document.getElementById('pg-dash');
  if(dashboard&&dashboard.classList.contains('active'))render()
 },100);
})();
