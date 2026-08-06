
(function(){
  function num(v){return Number(v)||0;}
  function esc(v){return _rp2Esc(String(v==null?'':v));}
  function money(v){return _rp2$(num(v));}
  function pct(v){return Math.round(num(v))+'%';}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function selectedLabel(c){
    return c&&c.selected?(c.selected.label||('Wk '+c.selected.num)):'Selected point';
  }
  function futurePlanWeeks(c){
    if(!c||!c.wks)return [];
    var start=c.idx+1;
    if(c.selectedData&&c.selectedData.state&&c.selectedData.state.key==='current'&&!c.selectedData.has)start=c.idx;
    return c.wks.slice(Math.max(0,start));
  }
  function weekRevenue(rep,w){
    var d=(S.data||{})[rep+'|'+w.key]||{};
    return num(d.revenue);
  }
  function weekOrders(rep,w){
    var d=(S.data||{})[rep+'|'+w.key]||{};
    return num(d.orders);
  }
  function enteredSeries(c){
    var out=[];
    c.through.forEach(function(w){
      var d=(S.data||{})[c.rep+'|'+w.key]||{};
      if(num(d.revenue)||num(d.orders)||num(d.calls))out.push({week:w,revenue:num(d.revenue),orders:num(d.orders),calls:num(d.calls)});
    });
    return out;
  }
  function forecastData(){
    var c=(window._rp2V476Context?window._rp2V476Context(_rp2.rep):null);
    if(!c)return null;
    var entered=enteredSeries(c);
    var last3=entered.slice(-3);
    var recentAvg=last3.length?last3.reduce(function(s,x){return s+x.revenue;},0)/last3.length:c.avgEntered;
    var avgOrders=entered.length?entered.reduce(function(s,x){return s+x.orders;},0)/entered.length:0;
    var planWeeks=futurePlanWeeks(c);
    var remaining=planWeeks.length;
    var gap=Math.max(0,c.goal-c.qtd.revenue);
    var needed=remaining>0?gap/remaining:gap;
    var baseAvg=c.avgEntered||recentAvg||needed||0;
    var conservativeRate=baseAvg*.90;
    var expectedRate=recentAvg||baseAvg||needed||0;
    var conservativeFinish=c.qtd.revenue+conservativeRate*remaining;
    var expectedFinish=c.qtd.revenue+expectedRate*remaining;
    var status='NO GOAL SET',tone='warn';
    if(c.goal>0){
      var ratio=c.goal>0?expectedFinish/c.goal:0;
      if(expectedFinish>=c.goal){status='ON TRACK';tone='good';}
      else if(ratio>=.95){status='BEHIND PACE — RECOVERABLE';tone='warn';}
      else if(ratio>=.85){status='RECOVERY REQUIRED';tone='warn';}
      else {status='GOAL AT RISK';tone='risk';}
    }
    var avgAov=c.qtd.orders>0?c.qtd.revenue/c.qtd.orders:0;
    var weekBelowNeed=needed>0?entered.filter(function(x){return x.revenue<needed;}).length:0;
    var bigWeek=Math.min(40000,Math.max(10000,Math.ceil(gap/10000)*10000));
    var postBigRemaining=Math.max(0,remaining-1);
    var afterBigNeed=postBigRemaining>0?Math.max(0,gap-bigWeek)/postBigRemaining:Math.max(0,gap-bigWeek);
    return {
      c:c,entered:entered,last3:last3,recentAvg:recentAvg,avgOrders:avgOrders,planWeeks:planWeeks,remaining:remaining,
      gap:gap,needed:needed,baseAvg:baseAvg,conservativeRate:conservativeRate,expectedRate:expectedRate,
      conservativeFinish:conservativeFinish,expectedFinish:expectedFinish,status:status,tone:tone,avgAov:avgAov,
      weekBelowNeed:weekBelowNeed,bigWeek:bigWeek,afterBigNeed:afterBigNeed
    };
  }
  function statusForFinish(finish,goal){
    if(!goal)return {label:'Goal not set',tone:'warn',delta:0};
    var delta=finish-goal;
    if(delta>=0)return {label:'Above goal',tone:'good',delta:delta};
    if(finish>=goal*.95)return {label:'Within reach',tone:'warn',delta:delta};
    return {label:'Below goal',tone:'risk',delta:delta};
  }
  function fcKpi(label,value,sub){
    return '<div class="rp2-fc-kpi"><div class="rp2-fc-kpi-label">'+esc(label)+'</div><div class="rp2-fc-kpi-value">'+value+'</div><div class="rp2-fc-kpi-sub">'+sub+'</div></div>';
  }
  function sectionHead(kick,title,note){
    return '<div class="rp2-fc-section-head"><div><div class="rp2-fc-section-kick">'+kick+'</div><div class="rp2-fc-section-title">'+title+'</div></div><div class="rp2-fc-section-note">'+note+'</div></div>';
  }
  function forecastSummary(f){
    if(!f.c.goal)return 'A quarter goal is not available, so the page is operating as a run-rate simulator rather than a goal-gap forecast.';
    if(!f.entered.length)return 'There are no entered performance weeks in this selected context yet. The Goal Path scenario shows the weekly pace required from here.';
    if(f.expectedFinish>=f.c.goal)return 'At the recent entered-week run rate, you are currently projecting above the quarter goal. The focus is protecting consistency rather than forcing a recovery.';
    return 'At the recent '+Math.min(3,f.entered.length)+'-week run rate, you are projecting to '+money(f.expectedFinish)+'. The current gap to goal is '+money(f.gap)+', which requires about '+money(f.needed)+' per remaining planned week.';
  }
  function scenarioCard(kind,name,rate,finish,copy){
    return '<button class="rp2-fc-scenario '+(kind==='goal'?'goal':'')+'" onclick="_rp2ForecastPreset(\''+kind+'\')">'
      +'<div class="rp2-fc-scenario-name">'+name+'</div><div class="rp2-fc-scenario-rate">'+money(rate)+'/wk</div>'
      +'<div class="rp2-fc-scenario-copy">'+copy+'</div>'
      +'<div class="rp2-fc-scenario-result"><span>Projected finish</span><strong>'+money(finish)+'</strong></div></button>';
  }
  function roadmap(f){
    var c=f.c,planMap={};
    f.planWeeks.forEach(function(w){planMap[w.key]=1;});
    return c.wks.map(function(w,i){
      var actual=weekRevenue(c.rep,w),has=actual>0||weekOrders(c.rep,w)>0||num(((S.data||{})[c.rep+'|'+w.key]||{}).calls)>0;
      var isSelected=c.selected&&w.key===c.selected.key;
      var cls=i<c.idx?'past':(isSelected?'selected':(planMap[w.key]?'future':'past'));
      var value,label,status,statusTone='';
      if(planMap[w.key]){
        value=money(f.needed);
        label='Required path';
        status='Planned week';
        statusTone='warn';
      }else if(has){
        value=money(actual);
        label='Actual posted';
        status=f.needed>0?(actual>=f.needed?'At/above current needed pace':'Below current needed pace'):'Posted result';
        statusTone=f.needed>0&&actual>=f.needed?'good':'';
      }else{
        value='—';
        label=i<=c.idx?'No entered result':'Outside forecast horizon';
        status=isSelected?'Selected context':'No posted activity';
      }
      return '<div class="rp2-fc-week '+cls+(isSelected?' selected':'')+'"><div class="rp2-fc-week-no">'+esc(w.label||('Wk '+w.num))+'</div><div class="rp2-fc-week-value">'+value+'</div><div class="rp2-fc-week-label">'+label+'</div><div class="rp2-fc-week-status '+statusTone+'">'+status+'</div></div>';
    }).join('');
  }

  window._rp2ForecastV2=function(){
    var f=forecastData();
    if(!f)return '<div class="rp2-card">Forecast context is unavailable.</div>';
    var c=f.c;
    var enteredCount=f.entered.length;
    var expectedStatus=statusForFinish(f.expectedFinish,c.goal);
    var latestEntered=enteredCount?f.entered[f.entered.length-1]:null;
    var selectedState=c.selectedData&&c.selectedData.state?c.selectedData.state.label:'Selected context';

    var hero='<div class="rp2-fc-hero"><div class="rp2-fc-hero-grid"><div>'
      +'<div class="rp2-fc-kick">Forecast Center 2.0 · BUILD v478 · '+esc(getQ())+' '+esc(getYr())+'</div>'
      +'<div class="rp2-fc-title">Your road to the quarter goal</div>'
      +'<div class="rp2-fc-summary">'+esc(forecastSummary(f))+'</div>'
      +'<div class="rp2-fc-badges">'
      +'<span class="rp2-fc-badge '+f.tone+'">'+esc(f.status)+'</span>'
      +'<span class="rp2-fc-badge">'+esc(selectedState)+'</span>'
      +'<span class="rp2-fc-badge">'+f.remaining+' planned week'+(f.remaining===1?'':'s')+' remaining</span>'
      +'</div></div>'
      +'<div class="rp2-fc-status"><div><div class="rp2-fc-status-label">Expected projection</div><div class="rp2-fc-status-name '+f.tone+'">'+esc(f.status)+'</div></div>'
      +'<div><div class="rp2-fc-status-number">'+money(f.expectedFinish)+'</div><div class="rp2-fc-status-sub">'+(c.goal?(expectedStatus.delta>=0?money(expectedStatus.delta)+' above goal':money(Math.abs(expectedStatus.delta))+' below goal'):'Recent-run-rate projection')+'</div></div></div>'
      +'</div></div>';

    var kpis='<div class="rp2-fc-kpis">'
      +fcKpi('QTD through selected week',money(c.qtd.revenue),esc(selectedLabel(c))+' · '+enteredCount+' entered week'+(enteredCount===1?'':'s'))
      +fcKpi('Quarter goal',c.goal?money(c.goal):'—',c.goal?(Math.round(c.goalPct||0)+'% complete'):'No goal available')
      +fcKpi('Gap to goal',c.goal?money(f.gap):'—',c.goal?(f.gap>0?'Still to close':'Goal already reached'):'Activate with a goal')
      +fcKpi('Required weekly pace',f.remaining?money(f.needed)+'/wk':'—',f.remaining+' forecast week'+(f.remaining===1?'':'s')+' remaining')
      +fcKpi('Recent run rate',f.recentAvg?money(f.recentAvg)+'/wk':'—','Average of last '+Math.min(3,enteredCount)+' entered week'+(Math.min(3,enteredCount)===1?'':'s'))
      +'</div>';

    var maxRange=Math.max(100000,Math.ceil(Math.max(f.needed,f.expectedRate,f.baseAvg,25000)*2/5000)*5000);
    var defaultRate=f.expectedRate||f.needed||0;
    var sim=sectionHead('Interactive model','Scenario Simulator','Change the weekly pace, add a one-time opportunity, or model one weak week. The projected finish updates immediately.')
      +'<div class="rp2-fc-sim">'
      +'<div class="rp2-fc-panel rp2-fc-controls">'
      +'<div class="rp2-fc-control"><div class="rp2-fc-control-top"><div><div class="rp2-fc-control-label">Projected weekly sales</div><div class="rp2-fc-control-help">Average sales across the remaining forecast weeks.</div></div><input class="rp2-fc-money-input" id="rp2-fc-rate-input" type="number" min="0" step="500" value="'+Math.round(defaultRate)+'" oninput="_rp2ForecastRateInput(this.value)"></div><input class="rp2-fc-range" id="rp2-fc-rate-range" type="range" min="0" max="'+maxRange+'" step="500" value="'+Math.round(defaultRate)+'" oninput="_rp2ForecastRateSlider(this.value)"></div>'
      +'<div class="rp2-fc-control"><div class="rp2-fc-control-top"><div><div class="rp2-fc-control-label">One-time opportunity</div><div class="rp2-fc-control-help">Add a large order, account win, or expected incremental close.</div></div><input class="rp2-fc-money-input" id="rp2-fc-bonus" type="number" min="0" step="1000" value="0" oninput="_rp2ForecastUpdate()"></div></div>'
      +'<div class="rp2-fc-control"><div class="rp2-fc-toggle-row"><label class="rp2-fc-check"><input id="rp2-fc-weak-toggle" type="checkbox" onchange="_rp2ForecastUpdate()"> Model one weak week</label><input class="rp2-fc-money-input" id="rp2-fc-weak-value" type="number" min="0" step="500" value="'+Math.round(defaultRate*.50)+'" oninput="_rp2ForecastUpdate()"></div><div class="rp2-fc-control-help">When enabled, one remaining week is replaced with this lower result.</div></div>'
      +'<div class="rp2-fc-presets"><button class="rp2-fc-preset" onclick="_rp2ForecastPreset(\'conservative\')">Conservative</button><button class="rp2-fc-preset" onclick="_rp2ForecastPreset(\'expected\')">Expected</button><button class="rp2-fc-preset" onclick="_rp2ForecastPreset(\'goal\')">Goal Path</button></div>'
      +'</div>'
      +'<div class="rp2-fc-panel rp2-fc-output"><div class="rp2-fc-output-top">'
      +'<div class="rp2-fc-output-stat"><span>Scenario finish</span><strong id="rp2-fc-out-finish">'+money(f.expectedFinish)+'</strong><small id="rp2-fc-out-delta">Calculating goal result</small></div>'
      +'<div class="rp2-fc-output-stat"><span>Weekly pace</span><strong id="rp2-fc-out-rate">'+money(defaultRate)+'</strong><small>per remaining week</small></div>'
      +'<div class="rp2-fc-output-stat"><span>Scenario status</span><strong class="rp2-fc-output-status" id="rp2-fc-out-status">'+esc(f.status)+'</strong><small id="rp2-fc-out-note">Model updates live</small></div>'
      +'</div><div class="rp2-fc-chart-wrap"><canvas id="rp2-fc-chart"></canvas></div></div>'
      +'</div>';

    var road=sectionHead('Execution map','The Road to Goal','Actual weeks remain visible, the selected reporting point is highlighted, and every remaining week carries the current equal-share goal path.')
      +'<div class="rp2-fc-panel rp2-fc-roadmap"><div class="rp2-fc-road-scroll">'+roadmap(f)+'</div></div>'
      +'<div class="rp2-fc-context-note">The required weekly pace is recalculated from actual QTD revenue through '+esc(selectedLabel(c))+'. It is not retroactively applied as a judgment on earlier weeks.</div>';

    var aovLift=350;
    var weeklyLift=f.avgOrders*aovLift;
    var recoveryCopy=f.remaining>1
      ? 'One '+money(f.bigWeek)+' week would reduce the remaining weekly requirement to about '+money(f.afterBigNeed)+'/week for the rest of the quarter.'
      : 'There is not enough remaining forecast runway for a multi-week recovery model.';
    var riskCopy;
    if(!f.entered.length)riskCopy='No entered weeks exist in this selected context yet, so the forecast has very little behavioral evidence to work from.';
    else if(f.weekBelowNeed===0)riskCopy='None of the entered weeks are below the current forward weekly requirement. The main risk is simply maintaining that standard.';
    else riskCopy=f.weekBelowNeed+' entered week'+(f.weekBelowNeed===1?' is':'s are')+' below the current forward requirement of '+money(f.needed)+'/week.';

    var intel=sectionHead('Forecast intelligence','Why the projection looks this way','The page explains the math behind the forecast so the rep can act on the drivers instead of staring at a single projected number.')
      +'<div class="rp2-fc-intel">'
      +'<div class="rp2-fc-insight"><div class="rp2-fc-insight-icon">↗</div><div class="rp2-fc-insight-label">Momentum</div><div class="rp2-fc-insight-title">'+(f.recentAvg?money(f.recentAvg)+'/week':'Not established yet')+'</div><div class="rp2-fc-insight-copy">'+(f.last3.length?'Your last '+f.last3.length+' entered weeks create the expected run-rate scenario used at the top of this page.':'Enter performance weeks to establish a recent-momentum forecast.')+'</div></div>'
      +'<div class="rp2-fc-insight"><div class="rp2-fc-insight-icon">⚠</div><div class="rp2-fc-insight-label">Risk</div><div class="rp2-fc-insight-title">'+(f.weekBelowNeed?f.weekBelowNeed+' week'+(f.weekBelowNeed===1?'':'s')+' below need':'No pace-break signal')+'</div><div class="rp2-fc-insight-copy">'+riskCopy+'</div></div>'
      +'<div class="rp2-fc-insight"><div class="rp2-fc-insight-icon">◈</div><div class="rp2-fc-insight-label">Opportunity</div><div class="rp2-fc-insight-title">'+(f.avgOrders?money(weeklyLift)+'/week leverage':'Order-value leverage')+'</div><div class="rp2-fc-insight-copy">'+(f.avgOrders?'Adding '+money(aovLift)+' to average order value across roughly '+(Math.round(f.avgOrders*10)/10)+' weekly orders adds about '+money(weeklyLift)+' per week without requiring more transactions.':'Order activity is not established enough yet to calculate an AOV leverage opportunity.')+'</div></div>'
      +'<div class="rp2-fc-insight"><div class="rp2-fc-insight-icon">⚡</div><div class="rp2-fc-insight-label">Recovery path</div><div class="rp2-fc-insight-title">What one big week changes</div><div class="rp2-fc-insight-copy">'+recoveryCopy+'</div></div>'
      +'</div>';

    var goalRate=f.needed;
    var goalFinish=c.goal||c.qtd.revenue;
    var scenarios=sectionHead('Planning lanes','Goal Scenarios','Click any scenario to load it into the simulator, then adjust it from there.')
      +'<div class="rp2-fc-scenarios">'
      +scenarioCard('conservative','Conservative',f.conservativeRate,f.conservativeFinish,'Uses 90% of your entered-week average to model a softer finish.')
      +scenarioCard('expected','Expected',f.expectedRate,f.expectedFinish,'Uses your most recent entered-week momentum as the forward run rate.')
      +scenarioCard('goal','Goal Path',goalRate,goalFinish,'Sets the weekly pace required to land exactly on the quarter goal from this selected point.')
      +'</div>';

    return '<div class="rp2-fc-shell">'+hero+kpis+sim+road+intel+scenarios+'</div>';
  };

  function readVal(id){
    var el=document.getElementById(id);
    return el?num(el.value):0;
  }
  function setVal(id,v){
    var el=document.getElementById(id);
    if(el)el.value=Math.round(num(v));
  }
  function scenarioSeries(f,rate,bonus,weakOn,weakValue){
    var labels=[],actual=[],scenario=[],goalLine=[];
    var cumulative=0;
    var actualWeeks=f.c.through.slice();
    if(f.planWeeks.length&&f.c.selectedData&&f.c.selectedData.state&&f.c.selectedData.state.key==='current'&&!f.c.selectedData.has){
      actualWeeks=actualWeeks.filter(function(w){return !f.c.selected||w.key!==f.c.selected.key;});
    }
    actualWeeks.forEach(function(w){
      var rev=weekRevenue(f.c.rep,w);
      cumulative+=rev;
      labels.push('W'+(w.num!=null?w.num:''));
      actual.push(cumulative);
      scenario.push(cumulative);
      goalLine.push(f.c.goal||null);
    });
    var weakUsed=false;
    f.planWeeks.forEach(function(w,i){
      var add=rate;
      if(weakOn&&!weakUsed){add=weakValue;weakUsed=true;}
      cumulative+=add;
      if(i===0)cumulative+=bonus;
      labels.push('W'+(w.num!=null?w.num:''));
      actual.push(null);
      scenario.push(cumulative);
      goalLine.push(f.c.goal||null);
    });
    return {labels:labels,actual:actual,scenario:scenario,goalLine:goalLine,finish:cumulative};
  }

  window._rp2ForecastUpdate=function(){
    var f=forecastData();
    if(!f)return;
    var rate=readVal('rp2-fc-rate-input');
    var bonus=readVal('rp2-fc-bonus');
    var weak=document.getElementById('rp2-fc-weak-toggle');
    var weakOn=!!(weak&&weak.checked);
    var weakValue=readVal('rp2-fc-weak-value');
    var data=scenarioSeries(f,rate,bonus,weakOn,weakValue);
    var st=statusForFinish(data.finish,f.c.goal);

    var finishEl=document.getElementById('rp2-fc-out-finish');
    var deltaEl=document.getElementById('rp2-fc-out-delta');
    var rateEl=document.getElementById('rp2-fc-out-rate');
    var statusEl=document.getElementById('rp2-fc-out-status');
    var noteEl=document.getElementById('rp2-fc-out-note');
    if(finishEl)finishEl.textContent=money(data.finish);
    if(deltaEl)deltaEl.textContent=f.c.goal?(st.delta>=0?money(st.delta)+' above goal':money(Math.abs(st.delta))+' below goal'):'Goal comparison unavailable';
    if(rateEl)rateEl.textContent=money(rate)+'/wk';
    if(statusEl)statusEl.textContent=st.label;
    if(noteEl)noteEl.textContent=(bonus?money(bonus)+' one-time opportunity · ':'')+(weakOn?'one weak week modeled':'straight weekly run rate');

    var range=document.getElementById('rp2-fc-rate-range');
    if(range&&Math.abs(num(range.value)-rate)>1)range.value=rate;

    window._rp2FcScenario=data;
    window._rp2ForecastDraw();
  };

  window._rp2ForecastRateInput=function(v){
    var range=document.getElementById('rp2-fc-rate-range');
    if(range)range.value=num(v);
    _rp2ForecastUpdate();
  };
  window._rp2ForecastRateSlider=function(v){
    setVal('rp2-fc-rate-input',v);
    _rp2ForecastUpdate();
  };
  window._rp2ForecastPreset=function(kind){
    var f=forecastData();
    if(!f)return;
    var rate=kind==='conservative'?f.conservativeRate:(kind==='goal'?f.needed:f.expectedRate);
    setVal('rp2-fc-rate-input',rate);
    setVal('rp2-fc-rate-range',rate);
    setVal('rp2-fc-bonus',0);
    var weak=document.getElementById('rp2-fc-weak-toggle');if(weak)weak.checked=false;
    setVal('rp2-fc-weak-value',rate*.5);
    _rp2ForecastUpdate();
  };

  window._rp2ForecastDraw=function(){
    if(typeof Chart!=='function')return;
    var f=forecastData();
    if(!f)return;
    var rate=readVal('rp2-fc-rate-input')||f.expectedRate||f.needed||0;
    var bonus=readVal('rp2-fc-bonus');
    var weak=document.getElementById('rp2-fc-weak-toggle');
    var weakOn=!!(weak&&weak.checked);
    var weakValue=readVal('rp2-fc-weak-value');
    var data=scenarioSeries(f,rate,bonus,weakOn,weakValue);
    var canvas=document.getElementById('rp2-fc-chart');
    if(!canvas)return;
    if(_rp2.fcChart){try{_rp2.fcChart.destroy();}catch(e){}}
    var tick={color:'#8b95a7',font:{size:10}},grid={color:'rgba(255,255,255,.05)'};
    _rp2.fcChart=new Chart(canvas.getContext('2d'),{
      type:'line',
      data:{labels:data.labels,datasets:[
        {label:'Actual cumulative',data:data.actual,borderColor:'#00AFEF',backgroundColor:'rgba(0,175,239,.10)',tension:.25,fill:false,pointRadius:3,spanGaps:false},
        {label:'Scenario projection',data:data.scenario,borderColor:'#FA873D',backgroundColor:'rgba(250,135,61,.13)',tension:.25,fill:true,pointRadius:3},
        {label:'Quarter goal',data:data.goalLine,borderColor:'#4ed6a3',borderDash:[7,5],pointRadius:0,tension:0,fill:false}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y);}}}},
        scales:{x:{ticks:tick,grid:{display:false}},y:{ticks:{color:'#8b95a7',font:{size:10},callback:function(v){return '$'+Math.round(v/1000)+'k';}},grid:grid}}
      }
    });
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='forecast')setTimeout(function(){try{_rp2Go('forecast');}catch(e){}},0);
  }catch(e){}
})();
