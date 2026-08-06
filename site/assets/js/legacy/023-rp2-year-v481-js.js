
(function(){
  function n(v){return Number(v)||0;}
  function money(v){return _rp2$(n(v));}
  function esc(v){return _rp2Esc(String(v==null?'':v));}
  function dateObj(v){
    if(v instanceof Date)return v;
    if(!v)return null;
    var d=new Date(v);
    return isNaN(d.getTime())?null:d;
  }
  function goalFor(rep,yr,q){
    try{
      var g=S.goals&&S.goals[rep]&&S.goals[rep][String(yr)]&&S.goals[rep][String(yr)][q];
      return g&&n(g.rev)>0?n(g.rev):0;
    }catch(e){return 0;}
  }
  function quarterWeeks(yr,q){
    try{return gwq(yr,q)||[];}catch(e){return [];}
  }
  function totals(rep,weeks){
    try{return totW(rep,weeks)||{revenue:0,orders:0,calls:0};}
    catch(e){return {revenue:0,orders:0,calls:0};}
  }
  function hasWeek(rep,w){
    var d=(S.data||{})[rep+'|'+w.key]||{};
    return !!(n(d.revenue)||n(d.orders)||n(d.calls));
  }
  function weekData(rep,w){
    var d=(S.data||{})[rep+'|'+w.key]||{};
    return {revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls)};
  }
  function uniqueWeeks(groups){
    var seen={},out=[];
    groups.forEach(function(g){g.forEach(function(w){if(!seen[w.key]){seen[w.key]=1;out.push(w);}});});
    out.sort(function(a,b){
      var da=dateObj(a.start),db=dateObj(b.start);
      return (da?da.getTime():0)-(db?db.getTime():0);
    });
    return out;
  }
  function median(arr){
    if(!arr.length)return 0;
    var a=arr.slice().sort(function(x,y){return x-y;}),mid=Math.floor(a.length/2);
    return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;
  }
  function avg(arr){return arr.length?arr.reduce(function(s,v){return s+n(v);},0)/arr.length:0;}
  function stddev(arr){
    if(arr.length<2)return 0;
    var a=avg(arr);
    return Math.sqrt(arr.reduce(function(s,v){return s+Math.pow(v-a,2);},0)/arr.length);
  }
  function rankRows(rep,yr,weeks){
    var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
    var rows=reps.map(function(r){
      var t=totals(r.name,weeks);
      return {name:r.name,revenue:n(t.revenue)};
    }).sort(function(a,b){return b.revenue-a.revenue;});
    var rank=null;
    rows.forEach(function(r,i){if(r.name===rep)rank=i+1;});
    return {rows:rows,rank:rank};
  }
  function quarterRank(rep,weeks){
    return rankRows(rep,getYr(),weeks).rank;
  }
  function monthIndexForWeek(w){
    var d=dateObj(w.start)||dateObj(w.end);
    return d?d.getMonth():null;
  }
  function ordersForYear(rep,yr){
    return (S.orders||[]).filter(function(o){
      if(o.rep!==rep||o.kind==='adjustment')return false;
      var d=dateObj(o.orderDate);
      return d&&d.getFullYear()===Number(yr);
    });
  }

  function buildYear(){
    var rep=_rp2.rep,yr=Number(getYr()),selectedQ=getQ();
    var qs=['Q1','Q2','Q3','Q4'];
    var qData=qs.map(function(q){
      var weeks=quarterWeeks(yr,q),t=totals(rep,weeks),goal=goalFor(rep,yr,q);
      var entered=weeks.filter(function(w){return hasWeek(rep,w);});
      var vals=entered.map(function(w){return weekData(rep,w).revenue;});
      var best=null;
      entered.forEach(function(w){
        var d=weekData(rep,w);
        if(!best||d.revenue>best.revenue)best={week:w,revenue:d.revenue};
      });
      var rank=rankRows(rep,yr,weeks).rank;
      return {
        q:q,weeks:weeks,tot:t,goal:goal,entered:entered,runRate:avg(vals),best:best,rank:rank,
        pct:goal>0?t.revenue/goal*100:null
      };
    });
    var allWeeks=uniqueWeeks(qData.map(function(x){return x.weeks;}));
    var yearTot=totals(rep,allWeeks);
    var allEntered=allWeeks.filter(function(w){return hasWeek(rep,w);});
    var enteredVals=allEntered.map(function(w){return weekData(rep,w).revenue;});
    var yearGoal=qData.reduce(function(s,q){return s+q.goal;},0);
    var yearRank=rankRows(rep,yr,allWeeks);

    var monthData=[];
    for(var m=0;m<12;m++)monthData.push({month:m,revenue:0,orders:0,calls:0,weeks:[],entered:[]});
    allWeeks.forEach(function(w){
      var mi=monthIndexForWeek(w);
      if(mi==null)return;
      var d=weekData(rep,w);
      monthData[mi].weeks.push(w);
      if(d.revenue||d.orders||d.calls){
        monthData[mi].entered.push(w);
        monthData[mi].revenue+=d.revenue;
        monthData[mi].orders+=d.orders;
        monthData[mi].calls+=d.calls;
      }
    });

    var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
    var teamMonthAvg=monthData.map(function(md){
      if(!reps.length)return 0;
      var total=0;
      reps.forEach(function(r){
        md.weeks.forEach(function(w){total+=weekData(r.name,w).revenue;});
      });
      return total/reps.length;
    });

    var bestWeek=null;
    allEntered.forEach(function(w){
      var d=weekData(rep,w);
      if(!bestWeek||d.revenue>bestWeek.revenue)bestWeek={week:w,revenue:d.revenue};
    });
    var bestMonth=monthData.reduce(function(best,m){return !best||m.revenue>best.revenue?m:best;},null);
    if(bestMonth&&bestMonth.revenue<=0)bestMonth=null;
    var bestQuarter=qData.reduce(function(best,q){return !best||q.tot.revenue>best.tot.revenue?q:best;},null);
    if(bestQuarter&&bestQuarter.tot.revenue<=0)bestQuarter=null;

    var orders=ordersForYear(rep,yr);
    var topOrder=orders.reduce(function(best,o){return !best||n(o.total)>n(best.total)?o:best;},null);

    var activeQ=qData.filter(function(q){return q.entered.length>0;});
    var lastQ=activeQ.length?activeQ[activeQ.length-1]:null;
    var prevQ=activeQ.length>1?activeQ[activeQ.length-2]:null;
    var qRunDelta=(lastQ&&prevQ&&prevQ.runRate>0)?((lastQ.runRate-prevQ.runRate)/prevQ.runRate*100):null;

    var nonzeroMonths=monthData.filter(function(m){return m.revenue>0;});
    var lastMonth=nonzeroMonths.length?nonzeroMonths[nonzeroMonths.length-1]:null;
    var prevMonth=nonzeroMonths.length>1?nonzeroMonths[nonzeroMonths.length-2]:null;
    var monthDelta=(lastMonth&&prevMonth&&prevMonth.revenue>0)?((lastMonth.revenue-prevMonth.revenue)/prevMonth.revenue*100):null;

    var avgWeek=avg(enteredVals),medianWeek=median(enteredVals),sd=stddev(enteredVals);
    var consistency=avgWeek>0?Math.max(0,100-(sd/avgWeek*100)):0;
    var abovePace=0;
    qData.forEach(function(q){
      var weeklyGoal=q.goal>0&&q.weeks.length?q.goal/q.weeks.length:0;
      q.entered.forEach(function(w){
        if(weeklyGoal>0&&weekData(rep,w).revenue>=weeklyGoal)abovePace++;
      });
    });

    var previousYear=yr-1;
    var prevGroups=qs.map(function(q){return quarterWeeks(previousYear,q);});
    var prevWeeks=uniqueWeeks(prevGroups);
    var prevTot=totals(rep,prevWeeks);
    var yoy=prevTot.revenue>0?((yearTot.revenue-prevTot.revenue)/prevTot.revenue*100):null;

    var qWithData=qData.filter(function(q){return q.tot.revenue||q.tot.orders||q.tot.calls;});
    var currentStory='';
    if(!qWithData.length)currentStory='No performance data is entered for '+yr+' yet. This page will build the annual story automatically as weeks are posted.';
    else if(qRunDelta==null)currentStory='Your annual story is still developing. One active quarter is visible, so the focus is establishing a repeatable weekly baseline.';
    else if(qRunDelta>=10)currentStory='Your entered-week run rate improved '+Math.round(qRunDelta)+'% from '+prevQ.q+' to '+lastQ.q+'. The strongest signal this year is upward quarter-to-quarter momentum.';
    else if(qRunDelta<=-10)currentStory='Your entered-week run rate declined '+Math.abs(Math.round(qRunDelta))+'% from '+prevQ.q+' to '+lastQ.q+'. The year view is flagging a meaningful momentum shift worth addressing.';
    else currentStory='Your entered-week run rate has remained relatively steady from '+prevQ.q+' to '+lastQ.q+'. The next opportunity is creating a clear step up rather than relying on incremental drift.';

    return {
      rep:rep,yr:yr,selectedQ:selectedQ,qs:qs,qData:qData,allWeeks:allWeeks,yearTot:yearTot,allEntered:allEntered,
      enteredVals:enteredVals,yearGoal:yearGoal,yearRank:yearRank,monthData:monthData,teamMonthAvg:teamMonthAvg,
      bestWeek:bestWeek,bestMonth:bestMonth,bestQuarter:bestQuarter,topOrder:topOrder,orders:orders,
      activeQ:activeQ,lastQ:lastQ,prevQ:prevQ,qRunDelta:qRunDelta,lastMonth:lastMonth,prevMonth:prevMonth,
      monthDelta:monthDelta,avgWeek:avgWeek,medianWeek:medianWeek,sd:sd,consistency:consistency,
      abovePace:abovePace,prevTot:prevTot,yoy:yoy,currentStory:currentStory
    };
  }

  function yKpi(label,value,sub){
    return '<div class="rp2-y-kpi"><div class="rp2-y-kpi-label">'+esc(label)+'</div><div class="rp2-y-kpi-value">'+value+'</div><div class="rp2-y-kpi-sub">'+sub+'</div></div>';
  }
  function sectionHead(kick,title,note){
    return '<div class="rp2-y-section-head"><div><div class="rp2-y-section-kick">'+kick+'</div><div class="rp2-y-section-title">'+title+'</div></div><div class="rp2-y-section-note">'+note+'</div></div>';
  }
  function qState(q){
    if(!q.entered.length)return {label:'No entered data',tone:''};
    if(q.goal>0&&q.pct>=100)return {label:'Goal reached',tone:'good'};
    if(q.goal>0&&q.pct>=75)return {label:'Building',tone:'warn'};
    return {label:'Active',tone:''};
  }
  function quarterCard(q,selected){
    var st=qState(q),future=!q.entered.length;
    return '<div class="rp2-y-quarter '+(selected?'selected ':'')+(future?'future':'')+'">'
      +'<div class="rp2-y-quarter-top"><div><div class="rp2-y-quarter-name">'+q.q+'</div></div><div class="rp2-y-quarter-state '+st.tone+'">'+st.label+'</div></div>'
      +'<div class="rp2-y-quarter-rev">'+money(q.tot.revenue)+'</div>'
      +'<div class="rp2-y-quarter-goal">'+(q.goal?(Math.round(q.pct||0)+'% of '+money(q.goal)+' goal'):'No configured quarter goal')+'</div>'
      +'<div class="rp2-y-progress"><span style="width:'+Math.max(0,Math.min(100,q.pct||0))+'%;"></span></div>'
      +'<div class="rp2-y-quarter-metrics">'
        +'<div class="rp2-y-mini"><span>Run rate</span><strong>'+(q.runRate?money(q.runRate)+'/wk':'—')+'</strong></div>'
        +'<div class="rp2-y-mini"><span>Quarter rank</span><strong>'+(q.rank?('#'+q.rank):'—')+'</strong></div>'
        +'<div class="rp2-y-mini"><span>Orders</span><strong>'+n(q.tot.orders)+'</strong></div>'
        +'<div class="rp2-y-mini"><span>Best week</span><strong>'+(q.best?money(q.best.revenue):'—')+'</strong></div>'
      +'</div>'
    +'</div>';
  }
  function storyCard(icon,label,title,copy){
    return '<div class="rp2-y-story"><div class="rp2-y-story-icon">'+icon+'</div><div class="rp2-y-story-label">'+label+'</div><div class="rp2-y-story-title">'+title+'</div><div class="rp2-y-story-copy">'+copy+'</div></div>';
  }
  function recordCard(label,value,sub){
    return '<div class="rp2-y-record"><div class="rp2-y-record-label">'+label+'</div><div class="rp2-y-record-value">'+value+'</div><div class="rp2-y-record-sub">'+sub+'</div></div>';
  }
  function monthName(i){return new Date(2000,i,1).toLocaleString('en-US',{month:'short'});}
  function monthNameLong(i){return new Date(2000,i,1).toLocaleString('en-US',{month:'long'});}
  function weeklyHeat(g){
    var max=Math.max.apply(null,[1].concat(g.enteredVals));
    return g.qData.map(function(q){
      var cells=q.weeks.map(function(w){
        var d=weekData(g.rep,w),ratio=max>0?d.revenue/max:0;
        var bg=d.revenue>0
          ? 'rgba('+(ratio>.66?'78,156,255':ratio>.33?'132,108,255':'132,108,255')+','+(ratio>.66?'.82':ratio>.33?'.48':'.18')+')'
          : 'rgba(255,255,255,.025)';
        var selected=(q.q===g.selectedQ&&g.cSelectedWeek&&w.key===g.cSelectedWeek.key);
        return '<div class="rp2-y-heat-cell '+(selected?'selected':'')+'" style="background:'+bg+';" title="'+esc(w.label||w.key)+' · '+money(d.revenue)+'"><strong>W'+(w.num!=null?w.num:'')+'</strong><span>'+(d.revenue?('$'+Math.round(d.revenue/1000)+'k'):'—')+'</span></div>';
      }).join('');
      return '<div class="rp2-y-heat-q">'+q.q+'</div><div class="rp2-y-heat-row">'+cells+'</div>';
    }).join('');
  }

  window._rp2YearV2=function(){
    var g=buildYear();
    var selectedContext=null;
    try{selectedContext=window._rp2V476Context?window._rp2V476Context(g.rep):null;}catch(e){}
    g.cSelectedWeek=selectedContext&&selectedContext.selected?selectedContext.selected:null;

    var goalPct=g.yearGoal>0?g.yearTot.revenue/g.yearGoal*100:null;
    var yearStatus=g.yearGoal>0?(goalPct>=100?'Annual goal reached':goalPct>=75?'Strong year progress':'Year in progress'):'Annual story in progress';
    var statusTone=g.yearGoal>0&&goalPct>=100?'good':(g.yearGoal>0&&goalPct<50?'warn':'');
    var activeWeeks=g.allEntered.length;
    var ytdAov=g.yearTot.orders>0?g.yearTot.revenue/g.yearTot.orders:0;

    var hero='<div class="rp2-y-hero"><div class="rp2-y-hero-grid"><div>'
      +'<div class="rp2-y-kick">Year Overview 2.0 · BUILD v481</div>'
      +'<div class="rp2-y-title">'+g.yr+' performance story</div>'
      +'<div class="rp2-y-copy">'+esc(g.currentStory)+'</div>'
      +'<div class="rp2-y-pills">'
        +'<span class="rp2-y-pill '+statusTone+'">'+esc(yearStatus)+'</span>'
        +(g.yearRank.rank?'<span class="rp2-y-pill">Year rank #'+g.yearRank.rank+'</span>':'')
        +'<span class="rp2-y-pill">'+activeWeeks+' entered week'+(activeWeeks===1?'':'s')+'</span>'
        +'<span class="rp2-y-pill">Selected focus · '+esc(g.selectedQ)+'</span>'
      +'</div></div>'
      +'<div class="rp2-y-brief"><div><div class="rp2-y-brief-label">Year revenue</div><div class="rp2-y-brief-title">'+(g.bestQuarter?g.bestQuarter.q+' is currently leading the year':'Annual performance is still forming')+'</div><div class="rp2-y-brief-copy">'+(g.bestQuarter?('Your strongest quarter so far is '+g.bestQuarter.q+' at '+money(g.bestQuarter.tot.revenue)+'. The quarter cards below show whether that came from a stronger weekly run rate or simply more entered weeks.'):'Enter performance weeks to establish the first quarter benchmark.')+'</div></div><div><div class="rp2-y-brief-number">'+money(g.yearTot.revenue)+'</div><div class="rp2-y-brief-sub">'+(g.yearGoal?(Math.round(goalPct||0)+'% of '+money(g.yearGoal)+' configured annual goals'):'Across '+activeWeeks+' entered performance week'+(activeWeeks===1?'':'s'))+'</div></div></div>'
      +'</div></div>';

    var kpis='<div class="rp2-y-kpis">'
      +yKpi('Year revenue',money(g.yearTot.revenue),g.yearGoal?(Math.round(goalPct||0)+'% of configured goals'):'No complete annual goal total')
      +yKpi('Year rank',g.yearRank.rank?('#'+g.yearRank.rank):'—','of '+g.yearRank.rows.length+' active reps')
      +yKpi('Orders',String(n(g.yearTot.orders)),ytdAov?money(ytdAov)+' average order':'No order average yet')
      +yKpi('Calls',String(n(g.yearTot.calls)),activeWeeks?(Math.round(g.yearTot.calls/activeWeeks)+' per entered week'):'No entered weeks')
      +yKpi('Average week',g.avgWeek?money(g.avgWeek):'—',activeWeeks+' entered week'+(activeWeeks===1?'':'s'))
      +yKpi('Year-over-year',g.yoy==null?'—':((g.yoy>=0?'▲ ':'▼ ')+Math.abs(Math.round(g.yoy))+'%'),g.prevTot.revenue>0?('vs '+(g.yr-1)+' revenue'):'Activates with prior-year data')
      +'</div>';

    var quarters=sectionHead('Quarter scorecard','How each quarter contributed','The selected quarter is highlighted. Run rate compares entered weeks, making in-progress quarters more useful than a simple full-quarter total comparison.')
      +'<div class="rp2-y-quarter-grid">'+g.qData.map(function(q){return quarterCard(q,q.q===g.selectedQ);}).join('')+'</div>';

    var trajectory=sectionHead('Trajectory','Your monthly performance across the year','Revenue bars show your month-by-month path while the comparison line shows the average monthly revenue per rep for the same weeks.')
      +'<div class="rp2-y-chart-grid">'
        +'<div class="rp2-y-panel"><div class="rp2-y-panel-head"><div><div class="rp2-y-panel-title">Monthly revenue trajectory</div><div class="rp2-y-panel-sub">Your revenue versus team average by month</div></div></div><div class="rp2-y-chart"><canvas id="rp2-y-month-chart"></canvas></div></div>'
        +'<div class="rp2-y-panel"><div class="rp2-y-panel-head"><div><div class="rp2-y-panel-title">Quarter performance</div><div class="rp2-y-panel-sub">Actual revenue compared with configured quarter goals</div></div></div><div class="rp2-y-chart"><canvas id="rp2-y-quarter-chart"></canvas></div></div>'
      +'</div>';

    var momentumTitle, momentumCopy;
    if(g.qRunDelta==null){
      momentumTitle='Quarter momentum is still forming';
      momentumCopy='Once at least two quarters contain entered weeks, this card will compare the average entered-week run rate instead of unfairly comparing partial and complete quarter totals.';
    }else if(g.qRunDelta>=0){
      momentumTitle='Weekly run rate improved '+Math.round(g.qRunDelta)+'%';
      momentumCopy='Your average entered week moved from '+money(g.prevQ.runRate)+' in '+g.prevQ.q+' to '+money(g.lastQ.runRate)+' in '+g.lastQ.q+'. That is the clearest quarter-to-quarter momentum signal in the year view.';
    }else{
      momentumTitle='Weekly run rate declined '+Math.abs(Math.round(g.qRunDelta))+'%';
      momentumCopy='Your average entered week moved from '+money(g.prevQ.runRate)+' in '+g.prevQ.q+' to '+money(g.lastQ.runRate)+' in '+g.lastQ.q+'. This is a stronger warning than a simple total because it normalizes for entered weeks.';
    }

    var monthTitle,monthCopy;
    if(g.monthDelta==null){
      monthTitle='Monthly trend needs more history';
      monthCopy='Two revenue-producing months are needed before the year view can identify a meaningful month-over-month movement.';
    }else if(g.monthDelta>=0){
      monthTitle=monthNameLong(g.lastMonth.month)+' grew '+Math.round(g.monthDelta)+'%';
      monthCopy='Revenue increased from '+money(g.prevMonth.revenue)+' in '+monthNameLong(g.prevMonth.month)+' to '+money(g.lastMonth.revenue)+' in '+monthNameLong(g.lastMonth.month)+'.';
    }else{
      monthTitle=monthNameLong(g.lastMonth.month)+' fell '+Math.abs(Math.round(g.monthDelta))+'%';
      monthCopy='Revenue declined from '+money(g.prevMonth.revenue)+' in '+monthNameLong(g.prevMonth.month)+' to '+money(g.lastMonth.revenue)+' in '+monthNameLong(g.lastMonth.month)+'. Use the weekly strip below to see whether that came from fewer entered weeks or lower weekly output.';
    }

    var consistencyTitle=g.consistency>=70?'Your weekly output is relatively consistent':g.consistency>=45?'Your year shows moderate week-to-week variation':'Your year is being driven by larger swings';
    var consistencyCopy=activeWeeks
      ? 'Consistency score: '+Math.round(g.consistency)+'%. Your median entered week is '+money(g.medianWeek)+' compared with an average of '+money(g.avgWeek)+'. A large gap between average and median usually means a few big weeks are carrying more of the year.'
      : 'Consistency metrics will activate after entered performance weeks are available.';

    var story=sectionHead('Performance story','What is changing over time','These cards focus on normalized momentum and consistency so the year is not reduced to one large cumulative total.')
      +'<div class="rp2-y-story-grid">'
        +storyCard('↗','Quarter momentum',momentumTitle,momentumCopy)
        +storyCard('◫','Monthly movement',monthTitle,monthCopy)
        +storyCard('≈','Consistency',consistencyTitle,consistencyCopy)
      +'</div>';

    var records=sectionHead('Personal records','Your high-water marks for '+g.yr,'Records update automatically as new weeks, months, quarters, and uploaded orders surpass the current benchmark.')
      +'<div class="rp2-y-record-grid">'
        +recordCard('Best week',g.bestWeek?money(g.bestWeek.revenue):'—',g.bestWeek?esc(g.bestWeek.week.label||g.bestWeek.week.key):'No entered revenue week yet')
        +recordCard('Best month',g.bestMonth?money(g.bestMonth.revenue):'—',g.bestMonth?monthNameLong(g.bestMonth.month):'No revenue month yet')
        +recordCard('Best quarter',g.bestQuarter?money(g.bestQuarter.tot.revenue):'—',g.bestQuarter?g.bestQuarter.q:'No active quarter yet')
        +recordCard('Largest uploaded order',g.topOrder?money(g.topOrder.total):'—',g.topOrder?esc((g.topOrder.customer||'Customer')+(g.topOrder.orderNum?' · '+g.topOrder.orderNum:'')):'Activates with uploaded order data')
      +'</div>';

    var heat=sectionHead('Weekly fingerprint','The shape of your year','Each tile represents a week. Brighter tiles indicate stronger revenue, making streaks, gaps, and isolated spikes visible at a glance.')
      +'<div class="rp2-y-heat">'+weeklyHeat(g)+'<div class="rp2-y-heat-legend"><span>Lower revenue</span><span class="rp2-y-heat-swatch"></span><span class="rp2-y-heat-swatch mid"></span><span class="rp2-y-heat-swatch high"></span><span>Higher revenue</span></div></div>';

    var bestSignal='';
    if(g.qRunDelta!=null&&g.qRunDelta>=10)bestSignal='The strongest positive signal is your improving quarter run rate. The next goal is proving that improvement can hold across more entered weeks.';
    else if(g.bestWeek&&g.avgWeek>0&&g.bestWeek.revenue>g.avgWeek*1.8)bestSignal='Your best week is materially above your normal weekly baseline. The opportunity is identifying what was different about that week and making more of it repeatable.';
    else if(g.consistency>=70)bestSignal='Consistency is currently one of your strengths. The next growth lever is raising the baseline without losing that repeatability.';
    else bestSignal='The year is still establishing its dominant pattern. Use the quarter cards and weekly fingerprint together to separate sustainable momentum from isolated spikes.';

    var consistency=sectionHead('Annual operating pattern','How repeatable is the performance?','This section turns the year into an operating profile: baseline, median, pace frequency, and whether results depend on unusually large weeks.')
      +'<div class="rp2-y-consistency">'
        +'<div class="rp2-y-panel"><div class="rp2-y-stat-list">'
          +'<div class="rp2-y-stat-row"><div class="rp2-y-stat-label">Entered performance weeks</div><div class="rp2-y-stat-value">'+activeWeeks+'<small>weeks with revenue, orders, or calls</small></div></div>'
          +'<div class="rp2-y-stat-row"><div class="rp2-y-stat-label">Average entered week</div><div class="rp2-y-stat-value">'+(g.avgWeek?money(g.avgWeek):'—')+'<small>mean weekly revenue</small></div></div>'
          +'<div class="rp2-y-stat-row"><div class="rp2-y-stat-label">Median entered week</div><div class="rp2-y-stat-value">'+(g.medianWeek?money(g.medianWeek):'—')+'<small>your more typical midpoint week</small></div></div>'
          +'<div class="rp2-y-stat-row"><div class="rp2-y-stat-label">Weeks at or above quarter goal pace</div><div class="rp2-y-stat-value">'+g.abovePace+'<small>uses each quarter’s configured weekly goal pace</small></div></div>'
          +'<div class="rp2-y-stat-row"><div class="rp2-y-stat-label">Consistency score</div><div class="rp2-y-stat-value">'+(activeWeeks?Math.round(g.consistency)+'%':'—')+'<small>higher means less week-to-week volatility</small></div></div>'
        +'</div></div>'
        +'<div class="rp2-y-callout"><div class="rp2-y-callout-label">What to take from the year</div><div class="rp2-y-callout-title">Turn the pattern into a repeatable playbook</div><div class="rp2-y-callout-copy">'+esc(bestSignal)+'<br><br>The Year Overview is most useful when you ask two questions: <strong style="color:#dfe7f3;">What produced my strongest sustained period?</strong> and <strong style="color:#dfe7f3;">What changed when performance slipped?</strong> Those answers should shape the next quarter—not just the final annual total.</div></div>'
      +'</div>';

    return '<div class="rp2-y-shell">'+hero+kpis+quarters+trajectory+story+records+heat+consistency+'</div>';
  };

  window._rp2YearDraw=function(){
    if(typeof Chart!=='function')return;
    var g=buildYear();
    if(_rp2.yearCharts){
      _rp2.yearCharts.forEach(function(c){try{c.destroy();}catch(e){}});
    }
    _rp2.yearCharts=[];
    var tick={color:'#8b95a7',font:{size:10}},grid={color:'rgba(255,255,255,.05)'};
    var monthCanvas=document.getElementById('rp2-y-month-chart');
    if(monthCanvas){
      var labels=g.monthData.map(function(m){return monthName(m.month);});
      var mine=g.monthData.map(function(m){return m.revenue;});
      var team=g.teamMonthAvg;
      _rp2.yearCharts.push(new Chart(monthCanvas.getContext('2d'),{
        type:'bar',
        data:{labels:labels,datasets:[
          {type:'bar',label:'You',data:mine,backgroundColor:'rgba(250,135,61,.74)',borderRadius:6},
          {type:'line',label:'Team avg',data:team,borderColor:'#00AFEF',borderDash:[6,4],pointRadius:2,tension:.3}
        ]},
        options:{
          responsive:true,maintainAspectRatio:false,
          plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y);}}}},
          scales:{x:{ticks:tick,grid:{display:false}},y:{ticks:{color:'#8b95a7',font:{size:10},callback:function(v){return '$'+Math.round(v/1000)+'k';}},grid:grid}}
        }
      }));
    }
    var qCanvas=document.getElementById('rp2-y-quarter-chart');
    if(qCanvas){
      _rp2.yearCharts.push(new Chart(qCanvas.getContext('2d'),{
        type:'bar',
        data:{labels:g.qData.map(function(q){return q.q;}),datasets:[
          {label:'Actual',data:g.qData.map(function(q){return q.tot.revenue;}),backgroundColor:'rgba(0,175,239,.70)',borderRadius:6},
          {label:'Goal',data:g.qData.map(function(q){return q.goal||0;}),backgroundColor:'rgba(78,214,163,.24)',borderColor:'rgba(78,214,163,.75)',borderWidth:1,borderRadius:6}
        ]},
        options:{
          responsive:true,maintainAspectRatio:false,
          plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y);}}}},
          scales:{x:{ticks:tick,grid:{display:false}},y:{ticks:{color:'#8b95a7',font:{size:10},callback:function(v){return '$'+Math.round(v/1000)+'k';}},grid:grid}}
        }
      }));
    }
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='year'){
      setTimeout(function(){try{_rp2Go('year');}catch(e){}},0);
    }
  }catch(e){}
})();
