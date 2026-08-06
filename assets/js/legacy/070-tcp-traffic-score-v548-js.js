
(function(){
 'use strict';

 var STORE='salesTracker_traffic_score_v548';
 var lbFilter=window._v548LbFilter||'all';

 function n(v){var x=Number(v);return isFinite(x)?x:0}
 function clean(v){return String(v==null?'':v).trim()}
 function clamp(v,min,max){return Math.max(min,Math.min(max,n(v)))}
 function esc(v){
  var s=String(v==null?'':v);
  return typeof esc_html==='function'?esc_html(s):s.replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function money(v){return '$'+Math.round(n(v)).toLocaleString()}
 function pct(v){return n(v).toFixed(1)+'%'}
 function defaults(){
  return{
   version:1,
   weights:{sales:65,outbound:20,hours:5,art:5,credit:5},
   thresholds:{
    overall:{green:90,yellow:80},
    sales:{green:90,yellow:80},
    outbound:{green:90,yellow:80},
    hours:{green:90,yellow:80},
    art:{green:90,yellow:80},
    credit:{green:90,yellow:80}
   },
   creditScale:{step:0.05,greenMax:0.50,yellowMax:1.00}
  }
 }
 function merge(base,value){
  value=value||{};
  var out=JSON.parse(JSON.stringify(base));
  Object.keys(value).forEach(function(key){
   if(value[key]&&typeof value[key]==='object'&&!Array.isArray(value[key])&&out[key]&&typeof out[key]==='object'){
    Object.keys(value[key]).forEach(function(sub){
     if(value[key][sub]&&typeof value[key][sub]==='object'&&!Array.isArray(value[key][sub])&&out[key][sub]){
      Object.assign(out[key][sub],value[key][sub])
     }else out[key][sub]=value[key][sub]
    })
   }else out[key]=value[key]
  });
  return out
 }
 function loadConfig(){
  var value=null;
  try{value=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
  return merge(defaults(),value)
 }
 function saveConfig(value){
  try{localStorage.setItem(STORE,JSON.stringify(value));return true}catch(e){console.warn('[v548 config]',e);return false}
 }
 function status(score,kind){
  var cfg=loadConfig(),t=cfg.thresholds[kind||'overall']||cfg.thresholds.overall;
  score=n(score);
  if(score>=n(t.green))return{key:'green',label:'Green',l:'Green',action:'No Action',className:'ryg-green',c:'ryg-green',color:'#5DCAA5'};
  if(score>=n(t.yellow))return{key:'yellow',label:'Yellow',l:'Yellow',action:'Starts @ Accountability Step 1',className:'ryg-yellow',c:'ryg-yellow',color:'#EF9F27'};
  return{key:'red',label:'Red',l:'Red',action:'Starts @ Accountability Step 2',className:'ryg-red',c:'ryg-red',color:'#F09595'}
 }
 function creditMemoScore(rate,config){
  var cfg=config||loadConfig(),step=Math.max(.001,n(cfg.creditScale.step)||.05),r=Math.max(0,n(rate));
  if(r===0)return 100;
  return Math.max(0,100-Math.ceil((r-1e-9)/step))
 }
 function creditRateStatus(rate,config){
  var cfg=config||loadConfig(),r=Math.max(0,n(rate));
  if(r<=n(cfg.creditScale.greenMax))return{key:'green',label:'Green',l:'Green',action:'No Action',className:'ryg-green',c:'ryg-green',color:'#5DCAA5'};
  if(r<=n(cfg.creditScale.yellowMax))return{key:'yellow',label:'Yellow',l:'Yellow',action:'Starts @ Accountability Step 1',className:'ryg-yellow',c:'ryg-yellow',color:'#EF9F27'};
  return{key:'red',label:'Red',l:'Red',action:'Starts @ Accountability Step 2',className:'ryg-red',c:'ryg-red',color:'#F09595'}
 }
 function scoreFromMetrics(metrics,config){
  var cfg=config||loadConfig(),w=cfg.weights,m={
   sales:n(metrics.sales),
   outbound:n(metrics.outbound),
   hours:n(metrics.hours),
   art:n(metrics.art),
   credit:metrics.creditScore==null?creditMemoScore(metrics.creditRate,cfg):n(metrics.creditScore)
  };
  var contributions={
   sales:m.sales*n(w.sales)/100,
   outbound:m.outbound*n(w.outbound)/100,
   hours:m.hours*n(w.hours)/100,
   art:m.art*n(w.art)/100,
   credit:m.credit*n(w.credit)/100
  };
  var total=contributions.sales+contributions.outbound+contributions.hours+contributions.art+contributions.credit;
  return{
   total:Math.round(total*10)/10,
   status:status(total,'overall'),
   metrics:m,
   contributions:contributions,
   metricStatus:{
    sales:status(m.sales,'sales'),
    outbound:status(m.outbound,'outbound'),
    hours:status(m.hours,'hours'),
    art:status(m.art,'art'),
    credit:creditRateStatus(metrics.creditRate,cfg)
   }
  }
 }
 function hasWeekData(rep,week){
  try{
   var d=gd(rep+'|'+week.key)||{};
   return n(d.revenue)>0||n(d.calls)>0||n(d.hours)>0||n(d.orders)>0||n(d.acctsCalled)>0
  }catch(e){return false}
 }
 function actualQuarterFor(date){
  try{
   var d=date||new Date(),s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
   return typeof dateToQ==='function'?dateToQ(s,d.getFullYear()):null
  }catch(e){return null}
 }
 function quarterScore(rep,yr,q){
  var weeks=gwq(yr,q),entered=weeksElapsed(yr,q),tot=totW(rep,weeks),goal=repGoalObj(rep,yr,q);
  var pace=weeks.length?entered/weeks.length:0;
  var salesGoalPaced=n(goal.rev)*pace;
  var hoursGoalPaced=n(goal.hrs)*entered;
  var sales=salesGoalPaced>0?n(tot.revenue)/salesGoalPaced*100:0;
  var hours=hoursGoalPaced>0?n(tot.hours)/hoursGoalPaced*100:0;
  var setPaced=n(tot.setSize)*pace;
  var outbound=setPaced>0?n(tot.acctsCalled)/setPaced*100:0;
  var outboundActual=n(tot.acctsCalled),outboundTarget=setPaced,outboundSource='Quarterly account-updating call coverage';

  var now=new Date(),currentQ=actualQuarterFor(now);
  if(Number(yr)===now.getFullYear()&&q===currentQ&&window.TCP_CALL_CYCLE_V547){
   try{
    var callPace=TCP_CALL_CYCLE_V547.paceFor(rep,now);
    if(callPace&&callPace.expected>0){
     outboundActual=n(callPace.completed);
     outboundTarget=n(callPace.expected);
     outbound=outboundActual/outboundTarget*100;
     outboundSource='Annual Call Cycle completed through today';
    }
   }catch(e){}
  }

  var artRate=n(tot.orders)>0?n(tot.art)/n(tot.orders)*100:0;
  var artAccuracy=n(tot.orders)>0?Math.max(0,100-artRate):100;
  var creditRate=n(tot.revenue)>0?n(tot.credits)/n(tot.revenue)*100:0;
  var scored=scoreFromMetrics({sales:sales,outbound:outbound,hours:hours,art:artAccuracy,creditRate:creditRate});

  return Object.assign(scored,{
   rep:rep,yr:yr,q:q,period:'quarter',weeks:weeks,enteredWeeks:entered,totalWeeks:weeks.length,
   tot:tot,goal:goal,
   raw:{
    salesActual:n(tot.revenue),salesTarget:salesGoalPaced,
    outboundActual:outboundActual,outboundTarget:outboundTarget,outboundSource:outboundSource,
    hoursActual:n(tot.hours),hoursTarget:hoursGoalPaced,
    artErrors:n(tot.art),orders:n(tot.orders),artRate:artRate,
    credits:n(tot.credits),creditRate:creditRate
   }
  })
 }
 function yearScore(rep,yr){
  var allWeeks=[],salesActual=0,salesTarget=0,hoursActual=0,hoursTarget=0,outboundActual=0,outboundTarget=0,orders=0,artErrors=0,credits=0;
  QTRS.forEach(function(q){
   var weeks=gwq(yr,q),entered=weeksElapsed(yr,q),tot=totW(rep,weeks),goal=repGoalObj(rep,yr,q),pace=weeks.length?entered/weeks.length:0;
   allWeeks=allWeeks.concat(weeks);salesActual+=n(tot.revenue);salesTarget+=n(goal.rev)*pace;
   hoursActual+=n(tot.hours);hoursTarget+=n(goal.hrs)*entered;
   outboundActual+=n(tot.acctsCalled);outboundTarget+=n(tot.setSize)*pace;
   orders+=n(tot.orders);artErrors+=n(tot.art);credits+=n(tot.credits)
  });
  var sales=salesTarget>0?salesActual/salesTarget*100:0,hours=hoursTarget>0?hoursActual/hoursTarget*100:0,outbound=outboundTarget>0?outboundActual/outboundTarget*100:0;
  var artRate=orders>0?artErrors/orders*100:0,artAccuracy=orders>0?Math.max(0,100-artRate):100,creditRate=salesActual>0?credits/salesActual*100:0;
  var scored=scoreFromMetrics({sales:sales,outbound:outbound,hours:hours,art:artAccuracy,creditRate:creditRate});
  return Object.assign(scored,{
   rep:rep,yr:yr,q:'Year',period:'year',weeks:allWeeks,
   raw:{salesActual:salesActual,salesTarget:salesTarget,outboundActual:outboundActual,outboundTarget:outboundTarget,outboundSource:'Year-to-date account-updating call coverage',hoursActual:hoursActual,hoursTarget:hoursTarget,artErrors:artErrors,orders:orders,artRate:artRate,credits:credits,creditRate:creditRate},
   tot:{revenue:salesActual,hours:hoursActual,acctsCalled:outboundActual,orders:orders,art:artErrors,credits:credits}
  })
 }
 function repScore(rep,period,yr,q){
  if(period!=='year'&&window.TCP_DATA_INTEGRITY_V564&&typeof TCP_DATA_INTEGRITY_V564.scoreAsOf==='function'){
   return TCP_DATA_INTEGRITY_V564.scoreAsOf(rep,yr,q)
  }
  return period==='year'?yearScore(rep,yr):quarterScore(rep,yr,q)
 }
 function badge(s){return'<span class="'+s.className+'">'+s.label+'</span>'}
 function metricRows(score){
  var cfg=loadConfig(),w=cfg.weights,m=score.metrics,c=score.contributions,r=score.raw;
  return[
   {key:'sales',name:'Sales Goal',weight:w.sales,actual:money(r.salesActual)+' / '+money(r.salesTarget)+' paced',score:m.sales,contribution:c.sales,status:score.metricStatus.sales},
   {key:'outbound',name:'Outbound Calls',weight:w.outbound,actual:Math.round(r.outboundActual)+' / '+Math.round(r.outboundTarget)+' required',score:m.outbound,contribution:c.outbound,status:score.metricStatus.outbound},
   {key:'hours',name:'Work Hours',weight:w.hours,actual:n(r.hoursActual).toFixed(1)+' / '+n(r.hoursTarget).toFixed(1)+' paced hours',score:m.hours,contribution:c.hours,status:score.metricStatus.hours},
   {key:'art',name:'Art Errors',weight:w.art,actual:Math.round(r.artErrors)+' errors / '+Math.round(r.orders)+' orders · '+pct(100-m.art)+' error rate',score:m.art,contribution:c.art,status:score.metricStatus.art},
   {key:'credit',name:'Credit Memos',weight:w.credit,actual:money(r.credits)+' rep-fault · '+pct(r.creditRate)+' of sales',score:m.credit,contribution:c.credit,status:score.metricStatus.credit}
  ]
 }
 function refreshPages(){
  try{if(document.getElementById('pg-perf')&&document.getElementById('pg-perf').classList.contains('active'))renderPerf()}catch(e){}
  try{if(document.getElementById('pg-lb')&&document.getElementById('pg-lb').classList.contains('active'))renderLB()}catch(e){}
  try{if(document.getElementById('pg-admin')&&document.getElementById('pg-admin').classList.contains('active')){renderAdminWeights();renderAdminThresholds()}}catch(e){}
 }
 function updateWeightTotalV548(){
  var els=document.querySelectorAll('.v548-weight-input'),total=0;
  els.forEach(function(el){total+=n(el.value);var display=el.closest('.v548-weight-card')&&el.closest('.v548-weight-card').querySelector('.v548-weight-value');if(display)display.textContent=n(el.value).toFixed(0)+'%'});
  var totalEl=document.getElementById('weightTotal'),warn=document.getElementById('weightWarn');
  if(totalEl){totalEl.textContent=total.toFixed(0)+'%';totalEl.style.color=Math.abs(total-100)<.01?'#5DCAA5':'#F09595'}
  if(warn)warn.style.display=Math.abs(total-100)<.01?'none':'block';
  return total
 }

 window.renderAdminWeights=function(){
  var cfg=loadConfig(),grid=document.getElementById('weightGrid');if(!grid)return;
  var defs=[
   {key:'sales',label:'Sales Goal',copy:'Combined sales goal attainment. Organic and first-year sales are not split.',color:'#FA873D'},
   {key:'outbound',label:'Outbound Calls',copy:'Account-updating calls completed against the required pace.',color:'#00AFEF'},
   {key:'hours',label:'Work Hours',copy:'Actual work hours against the paced work-hour goal already tracked.',color:'#66D4FA'},
   {key:'art',label:'Art Errors',copy:'Error-free order accuracy: orders without an art error ÷ total orders.',color:'#F09595'},
   {key:'credit',label:'Credit Memos',copy:'Rep-fault credit memo percentage converted through the credit scale.',color:'#EF9F27'}
  ];
  grid.innerHTML='<div class="v548-admin-score-note"><strong>Ranking formula:</strong> each metric earns a percentage score. The percentage score is multiplied by its weight, and the weighted points are added to produce the overall Red / Yellow / Green score.</div>'+
   defs.map(function(d){
    return'<div class="v548-weight-card"><div class="v548-weight-head"><div><div class="v548-weight-title">'+d.label+'</div><div class="v548-weight-copy">'+d.copy+'</div></div><div class="v548-weight-value" style="color:'+d.color+'">'+n(cfg.weights[d.key]).toFixed(0)+'%</div></div>'+
     '<input class="v548-weight-input" data-key="'+d.key+'" type="range" min="0" max="100" step="1" value="'+n(cfg.weights[d.key])+'" oninput="_v548WeightInput()"></div>'
   }).join('');
  updateWeightTotalV548();
  var card=grid.closest('.advanced-card');if(card){var h=card.querySelector('h3');if(h)h.textContent='Red / Yellow / Green weights'}
 };
 window._v548WeightInput=function(){updateWeightTotalV548()};
 window.saveWeights=function(){
  var total=updateWeightTotalV548();if(Math.abs(total-100)>.01){alert('Weights must add up to 100%. Current total: '+total.toFixed(0)+'%.');return}
  var cfg=loadConfig();document.querySelectorAll('.v548-weight-input').forEach(function(el){cfg.weights[el.dataset.key]=n(el.value)});
  saveConfig(cfg);renderAdminWeights();refreshPages();
  var st=document.getElementById('saveStatus');if(st){st.textContent='Red / Yellow / Green weights saved ✓';st.style.color='#5DCAA5'}
 };
 window.resetWeights=function(){
  if(!confirm('Reset weights to Sales Goal 65%, Outbound Calls 20%, Work Hours 5%, Art Errors 5%, and Credit Memos 5%?'))return;
  var cfg=loadConfig();cfg.weights=defaults().weights;saveConfig(cfg);renderAdminWeights();refreshPages()
 };

 window.renderAdminThresholds=function(){
  var cfg=loadConfig(),grid=document.getElementById('threshGrid');if(!grid)return;
  var defs=[
   {key:'overall',label:'Overall weighted score',copy:'Determines the rep’s final Red / Yellow / Green status.'},
   {key:'sales',label:'Sales Goal',copy:'Combined sales attainment percentage.'},
   {key:'outbound',label:'Outbound Calls',copy:'Account-updating calls versus required pace.'},
   {key:'hours',label:'Work Hours',copy:'Actual hours versus paced hours goal.'},
   {key:'art',label:'Art Errors',copy:'Error-free order accuracy percentage.'},
   {key:'credit',label:'Credit Memos',copy:'Score created from the credit memo percentage scale.'}
  ];
  grid.innerHTML='<div class="v548-admin-score-note"><strong>Default colors:</strong> Green begins at 90%, Yellow begins at 80%, and anything below the Yellow cutoff is Red. The overall color comes strictly from the weighted total.</div>'+
   '<div class="v548-threshold-grid">'+defs.map(function(d){
    var t=cfg.thresholds[d.key];
    return'<div class="v548-threshold-card"><h4>'+d.label+'</h4><p>'+d.copy+'</p><div class="v548-threshold-inputs">'+
     '<label>Green starts at<input class="v548-threshold-input" data-key="'+d.key+'" data-level="green" type="number" min="0" max="200" step=".1" value="'+n(t.green)+'"></label>'+
     '<label>Yellow starts at<input class="v548-threshold-input" data-key="'+d.key+'" data-level="yellow" type="number" min="0" max="200" step=".1" value="'+n(t.yellow)+'"></label>'+
     '</div></div>'
   }).join('')+'</div>'+
   '<div class="v548-threshold-card" style="margin-top:9px"><h4>Credit Memo Scale</h4><p>Default mapping: 0.00%=100, 0.05%=99, 0.50%=90, 1.00%=80, and 1.05%=79.</p><div class="v548-threshold-inputs">'+
    '<label>Score decrement step<input id="v548-credit-step" type="number" min=".01" max="1" step=".01" value="'+n(cfg.creditScale.step)+'"></label>'+
    '<label>Green raw-rate maximum<input id="v548-credit-green-max" type="number" min="0" max="10" step=".01" value="'+n(cfg.creditScale.greenMax)+'"></label>'+
    '<label>Yellow raw-rate maximum<input id="v548-credit-yellow-max" type="number" min="0" max="10" step=".01" value="'+n(cfg.creditScale.yellowMax)+'"></label>'+
    '</div></div>';
  var card=grid.closest('.advanced-card');if(card){var h=card.querySelector('h3');if(h)h.textContent='Red / Yellow / Green thresholds'}
 };
 window.applyThresholds=function(){
  var cfg=loadConfig(),valid=true,message='';
  document.querySelectorAll('.v548-threshold-input').forEach(function(el){
   var key=el.dataset.key,level=el.dataset.level;cfg.thresholds[key][level]=n(el.value)
  });
  Object.keys(cfg.thresholds).forEach(function(key){
   var t=cfg.thresholds[key];if(n(t.green)<n(t.yellow)){valid=false;message='Green must begin at or above the Yellow cutoff for '+key+'.'}
  });
  cfg.creditScale.step=Math.max(.01,n((document.getElementById('v548-credit-step')||{}).value)||.05);
  cfg.creditScale.greenMax=Math.max(0,n((document.getElementById('v548-credit-green-max')||{}).value));
  cfg.creditScale.yellowMax=Math.max(cfg.creditScale.greenMax,n((document.getElementById('v548-credit-yellow-max')||{}).value));
  if(!valid){alert(message);return}
  saveConfig(cfg);renderAdminThresholds();refreshPages();
  var st=document.getElementById('threshStatus');if(st){st.textContent='Red / Yellow / Green thresholds saved ✓';st.style.color='#5DCAA5'}
 };
 window.resetThresholds=function(){
  if(!confirm('Reset all status thresholds to Green 90%, Yellow 80%, and the original credit memo scale?'))return;
  var cfg=loadConfig(),d=defaults();cfg.thresholds=d.thresholds;cfg.creditScale=d.creditScale;saveConfig(cfg);renderAdminThresholds();refreshPages()
 };

 window.rfrom=function(score){
  if(n(score)>5)return status(score,'overall');
  if(n(score)>=4)return{key:'green',label:'Green',l:'Green',c:'ryg-green',className:'ryg-green',color:'#5DCAA5'};
  if(n(score)>=3)return{key:'yellow',label:'Yellow',l:'Yellow',c:'ryg-yellow',className:'ryg-yellow',color:'#EF9F27'};
  return{key:'red',label:'Red',l:'Red',c:'ryg-red',className:'ryg-red',color:'#F09595'}
 };

 function renderChart(rep,score){
  try{
   if(typeof dc==='function')dc('cPW');
   var canvas=document.getElementById('cPW');if(!canvas||typeof Chart==='undefined')return;
   var weeks=score.weeks||[];
   ch['cPW']=new Chart(canvas,{type:'bar',data:{labels:weeks.map(function(w){return String(w.label||'').split(':')[0]}),datasets:[
    {label:'Orders',data:weeks.map(function(w){var d=gd(rep+'|'+w.key);var has=n(d.revenue)+n(d.calls)+n(d.orders)+n(d.hours)>0;return has?n(d.orders):null}),backgroundColor:'rgba(250,135,61,.82)',borderColor:'#FA873D',borderWidth:1,borderRadius:6},
    {label:'Art errors',data:weeks.map(function(w){var d=gd(rep+'|'+w.key);var has=n(d.revenue)+n(d.calls)+n(d.orders)+n(d.hours)>0;return has?repArt(rep,[w]):null}),backgroundColor:'rgba(240,149,149,.76)',borderColor:'#F09595',borderWidth:1,borderRadius:6}
   ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'bottom',labels:{color:'#A8AFC3',font:{size:11,weight:'700'},boxWidth:10,usePointStyle:true}}},scales:{x:{grid:{display:false},ticks:{color:'#9AA4BD',font:{size:10,weight:'700'},maxRotation:0,autoSkip:false}},y:{beginAtZero:true,grid:{color:'rgba(255,255,255,.06)'},ticks:{color:'#9AA4BD',font:{size:10,weight:'700'}}}}}})
  }catch(e){console.warn('[v548 chart]',e)}
 }

 window.renderPerf=function(){
  var selector=document.getElementById('pR'),rep=selector&&selector.value;if(!rep)return;
  var yr=getYr(),q=getQ(),score=quarterScore(rep,yr,q),rows=metricRows(score),s=score.status,cfg=loadConfig();
  var repIdx=Math.max(0,S.reps.findIndex(function(r){return r&&r.name===rep})),repObj=S.reps[repIdx]||{},initials=rep.split(' ').map(function(x){return x[0]||''}).join('').slice(0,2).toUpperCase();
  var avatar=document.getElementById('perfAvatar');if(avatar)avatar.innerHTML=repObj.profile&&repObj.profile.photo?'<img src="'+repObj.profile.photo+'" alt="'+esc(rep)+'">':initials;
  var set=function(id,value){var el=document.getElementById(id);if(el)el.innerHTML=value};
  set('perfRepName',esc(rep));set('perfRepSub',q+' '+yr+' weighted performance ranking');
  set('perfScore',score.total.toFixed(1));set('perfStars','<span class="v548-status-display '+s.key+'">'+s.label+' status</span>');
  set('perfRating',s.action);set('perfQuarterNote','Week '+score.enteredWeeks+' of '+score.totalWeeks+' entered · ranked on a weighted 100-point model');
  var panel=document.querySelector('#pg-perf .perf-score-panel');if(panel){panel.classList.remove('ryg-panel-green','ryg-panel-yellow','ryg-panel-red');panel.classList.add('ryg-panel-'+s.key)}
  var heroP=document.querySelector('#pg-perf .perf-hero p');if(heroP)heroP.textContent='Rank reps using a weighted Red / Yellow / Green score built from combined Sales Goal, Outbound Calls, Work Hours, Art Errors, and Credit Memos.';

  var cards=rows.map(function(r){
   return'<div class="v548-score-kpi" style="--v548-glow:'+r.status.color+'33"><div class="label">'+r.name+' · '+r.weight+'%</div><div class="score">'+r.score.toFixed(1)+'</div><div class="actual">'+r.actual+'</div><div class="contribution">'+r.contribution.toFixed(1)+' weighted points · '+badge(r.status)+'</div></div>'
  });
  cards.unshift('<div class="v548-score-kpi" style="--v548-glow:'+s.color+'33"><div class="label">Overall weighted score</div><div class="score">'+score.total.toFixed(1)+'</div><div class="actual">'+s.action+'</div><div class="contribution">'+badge(s)+'</div></div>');
  var pCards=document.getElementById('pCards');if(pCards)pCards.innerHTML=cards.join('');

  var bars=document.getElementById('pBars');if(bars)bars.innerHTML=rows.map(function(r){
   var width=Math.max(0,Math.min(100,r.score));
   return'<div class="perf-progress-row"><div class="perf-progress-top"><span class="perf-progress-label">'+r.name+' · '+r.weight+'%</span><span class="v548-progress-status">'+badge(r.status)+'</span></div><div class="perf-progress-bar"><div class="perf-progress-fill" style="width:'+width+'%;--bar-color:'+r.status.color+'"></div></div><div style="display:flex;justify-content:space-between;margin-top:5px;color:#7E8B9B;font-size:8px"><span>'+r.actual+'</span><strong style="color:#fff">'+r.score.toFixed(1)+' score</strong></div></div>'
  }).join('');

  var sorted=rows.slice().sort(function(a,b){return a.score-b.score}),weak=sorted[0],strong=sorted[sorted.length-1];
  var insights=document.getElementById('perfInsights');if(insights)insights.innerHTML=[
   {i:'🚦',t:'Overall status',x:s.label+' at '+score.total.toFixed(1)+'. '+s.action+'.'},
   {i:'🎯',t:'Primary opportunity',x:weak.name+' is the lowest metric at '+weak.score.toFixed(1)+' and contributes '+weak.contribution.toFixed(1)+' weighted points.'},
   {i:'🏆',t:'Strongest metric',x:strong.name+' is strongest at '+strong.score.toFixed(1)+'.'},
   {i:'📞',t:'Outbound Calls source',x:score.raw.outboundSource+'. A completed cycle customer requires the call attempt and follow-up email.'},
   {i:'🧮',t:'Ranking rule',x:'Reps are ranked by weighted total. A Red individual metric does not automatically override the overall weighted color.'}
  ].map(function(f){return'<div class="perf-insight"><div class="perf-insight-icon">'+f.i+'</div><div><div class="perf-insight-title">'+f.t+'</div><div class="perf-insight-text">'+f.x+'</div></div></div>'}).join('');

  var breakdown=document.getElementById('perfBreakdown');if(breakdown)breakdown.innerHTML='<table class="score-table-modern"><thead><tr><th>Metric</th><th>Weight</th><th>Actual</th><th>Metric score</th><th>Status</th><th>Weighted points</th></tr></thead><tbody>'+
   rows.map(function(r){return'<tr><td>'+r.name+'</td><td>'+r.weight+'%</td><td>'+r.actual+'</td><td>'+r.score.toFixed(1)+'</td><td>'+badge(r.status)+'</td><td>'+r.contribution.toFixed(1)+'</td></tr>'}).join('')+
   '<tr><td><strong>Overall</strong></td><td><strong>100%</strong></td><td>Weighted total</td><td><strong>'+score.total.toFixed(1)+'</strong></td><td>'+badge(s)+'</td><td><strong>'+score.total.toFixed(1)+'</strong></td></tr></tbody></table>';

  var why=document.getElementById('perfWhy');if(why)why.innerHTML=
   '<div class="v548-formula"><strong>Formula:</strong> Sales Goal '+cfg.weights.sales+'% + Outbound Calls '+cfg.weights.outbound+'% + Work Hours '+cfg.weights.hours+'% + Art Errors '+cfg.weights.art+'% + Credit Memos '+cfg.weights.credit+'%. Positive metrics may exceed 100% when a rep is ahead of goal, matching the spreadsheet model.</div>'+
   '<div class="score-insight"><div class="score-insight-title">Art Errors</div><div class="score-insight-text">Art score is error-free order accuracy: ('+Math.max(0,score.raw.orders-score.raw.artErrors)+' error-free orders ÷ '+score.raw.orders+' total orders) = '+score.metrics.art.toFixed(1)+'.</div></div>'+
   '<div class="score-insight"><div class="score-insight-title">Credit Memo Scale</div><div class="score-insight-text">'+score.raw.creditRate.toFixed(2)+'% credit memo rate converts to a '+score.metrics.credit.toFixed(1)+' score. Default examples: 0.50%=90, 1.00%=80, 1.05%=79.</div></div>';
  renderChart(rep,score)
 };

 window.setLbPeriod=function(period){window._lbPeriod=period;renderLB()};
 window._v548SetLbFilter=function(filter){lbFilter=window._v548LbFilter=filter;renderLB()};
 function previousPeriod(yr,q,period){
  if(period==='year')return{yr:yr-1,q:q,period:'year',label:String(yr-1)};
  var index=QTRS.indexOf(q),py=index===0?yr-1:yr,pq=index===0?'Q4':QTRS[index-1];
  return{yr:py,q:pq,period:'quarter',label:pq+' '+py}
 }
 function moveInfo(previousRanks,name,current){
  if(!(name in previousRanks))return{arrow:'•',text:'new',className:''};
  var diff=previousRanks[name]-current;
  if(diff>0)return{arrow:'▲',text:'+'+diff,className:'up'};
  if(diff<0)return{arrow:'▼',text:String(diff),className:'down'};
  return{arrow:'—',text:'',className:''}
 }
 function metricCell(row,key){
  var s=row.metricStatus[key];
  return'<div class="v548-cell"><strong>'+row.metrics[key].toFixed(1)+'</strong><span>'+s.label+'</span></div>'
 }
 window.renderLB=function(){
  var host=document.getElementById('lbBody');if(!host)return;
  var yr=getYr(),q=getQ(),period=window._lbPeriod||'quarter',reps=activeReps();
  var rows=reps.map(function(rep){
   var score=repScore(rep.name,period,yr,q);return Object.assign(score,{name:rep.name,idx:S.reps.findIndex(function(x){return x.name===rep.name})})
  }).sort(function(a,b){return(b.total-a.total)||(b.metrics.sales-a.metrics.sales)||(b.raw.salesActual-a.raw.salesActual)});
  var previous=previousPeriod(yr,q,period),previousRanks={};
  reps.map(function(rep){return{name:rep.name,score:repScore(rep.name,previous.period,previous.yr,previous.q)}})
   .sort(function(a,b){return(b.score.total-a.score.total)||(b.score.metrics.sales-a.score.metrics.sales)})
   .forEach(function(row,index){previousRanks[row.name]=index});
  rows.forEach(function(row,index){row.rank=index+1;row.move=moveInfo(previousRanks,row.name,index)});
  var counts={green:0,yellow:0,red:0};rows.forEach(function(row){counts[row.status.key]++});
  var visible=lbFilter==='all'?rows:rows.filter(function(row){return row.status.key===lbFilter});
  var top=rows.slice(0,3),podOrder=[1,0,2];
  function pod(row,displayIndex){
   if(!row)return'<div></div>';
   var place=row.rank,medal=place===1?'🥇':place===2?'🥈':'🥉';
   return'<article class="v548-pod '+(place===1?'first':'')+'"><div class="place">'+medal+'</div><div class="avatar">'+avHtml(row.name,row.idx,{size:place===1?68:55})+'</div><div class="name">'+esc(row.name)+'</div><div class="score">'+row.total.toFixed(1)+'<small> weighted</small></div><div class="sub">'+money(row.raw.salesActual)+' sales · '+row.metrics.sales.toFixed(1)+' sales score</div><div class="status">'+badge(row.status)+'</div></article>'
  }
  var podium='<div class="v548-podium">'+podOrder.map(function(index){return pod(top[index],index)}).join('')+'</div>';
  var rowsHtml='<div class="v548-ranking-list"><div class="v548-rank-row header"><div>Rank</div><div>Move</div><div></div><div>Rep</div><div>Sales</div><div>Outbound</div><div>Hours</div><div>Art</div><div>Credit</div><div>Overall</div></div>'+
   visible.map(function(row){
    return'<div class="v548-rank-row"><div class="v548-rank-num">'+row.rank+'</div><div class="v548-move '+row.move.className+'">'+row.move.arrow+'<br>'+row.move.text+'</div><div>'+avHtml(row.name,row.idx,{size:36})+'</div><div class="v548-name"><strong>'+esc(row.name)+'</strong><span>'+money(row.raw.salesActual)+' sales · '+row.status.action+'</span></div>'+
     metricCell(row,'sales')+metricCell(row,'outbound')+metricCell(row,'hours')+metricCell(row,'art')+metricCell(row,'credit')+
     '<div class="v548-cell v548-overall"><strong>'+row.total.toFixed(1)+'</strong><span>'+badge(row.status)+'</span></div></div>'
   }).join('')+'</div>';

  host.innerHTML='<div class="v548-lb-shell"><section class="v548-lb-hero"><div><div class="v548-lb-kick">SALES REP PERFORMANCE RANKING · BUILD v548</div><h1>Ranked by weighted Red / Yellow / Green score</h1><p>Sales Goal is combined into one 65% metric. Outbound Calls are account-updating calls. Work Hours use the hours already tracked. Art Errors use error-free order accuracy, and Credit Memos use the supplied inverse percentage scale.</p></div>'+
   '<div class="v548-lb-summary"><div><span>Green</span><strong style="color:#5DCAA5">'+counts.green+'</strong></div><div><span>Yellow</span><strong style="color:#EF9F27">'+counts.yellow+'</strong></div><div><span>Red</span><strong style="color:#F09595">'+counts.red+'</strong></div></div></section>'+
   '<div class="v548-lb-toolbar"><div class="v548-lb-seg"><button class="'+(period==='quarter'?'on':'')+'" onclick="setLbPeriod(\'quarter\')">This Quarter</button><button class="'+(period==='year'?'on':'')+'" onclick="setLbPeriod(\'year\')">This Year</button></div>'+
   '<div class="v548-lb-seg">'+[['all','All'],['green','Green'],['yellow','Yellow'],['red','Red']].map(function(x){return'<button class="'+(lbFilter===x[0]?'on':'')+'" onclick="_v548SetLbFilter(\''+x[0]+'\')">'+x[1]+'</button>'}).join('')+'</div></div>'+
   '<div class="v548-lb-body">'+podium+(visible.length?rowsHtml:'<div class="v548-empty">No reps match this status filter.</div>')+'</div></div>'
 };

 function installText(){
  var perfKick=document.querySelector('#pg-perf .perf-eyebrow');if(perfKick)perfKick.textContent='Red / Yellow / Green performance command center';
  var perfTitle=document.querySelector('#pg-perf .perf-hero h1');if(perfTitle)perfTitle.textContent='Rep Performance Status';
  var weight=document.getElementById('weightGrid'),threshold=document.getElementById('threshGrid');
  if(weight&&weight.closest('.advanced-card')){var h=weight.closest('.advanced-card').querySelector('h3');if(h)h.textContent='Red / Yellow / Green weights'}
  if(threshold&&threshold.closest('.advanced-card')){var h2=threshold.closest('.advanced-card').querySelector('h3');if(h2)h2.textContent='Red / Yellow / Green thresholds'}
 }

 window.TCP_TRAFFIC_SCORE_V548={
  version:'v548',
  defaults:defaults,
  loadConfig:loadConfig,
  saveConfig:saveConfig,
  status:status,
  creditMemoScore:creditMemoScore,
  creditRateStatus:creditRateStatus,
  scoreFromMetrics:scoreFromMetrics,
  quarterScore:quarterScore,
  yearScore:yearScore,
  repScore:repScore,
  metricRows:metricRows,
  rank:function(period,yr,q){
   return activeReps().map(function(rep){return Object.assign(repScore(rep.name,period||'quarter',yr||getYr(),q||getQ()),{name:rep.name})})
    .sort(function(a,b){return(b.total-a.total)||(b.metrics.sales-a.metrics.sales)})
  }
 };

 installText();
 setTimeout(function(){installText();renderAdminWeights();renderAdminThresholds()},100);
})();
