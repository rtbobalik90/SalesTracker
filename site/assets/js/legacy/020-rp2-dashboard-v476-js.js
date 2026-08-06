
(function(){
  function n(v){ return Number(v)||0; }
  function dateValue(v){
    var d=v instanceof Date?v:new Date(v);
    return isNaN(d.getTime())?null:d;
  }
  function weekHasData(rep,w){
    if(!w)return false;
    var d=(S.data||{})[rep+'|'+w.key]||{};
    return !!(n(d.revenue)||n(d.orders)||n(d.calls));
  }
  function selectedQuarterIndex(wks,selected){
    if(!wks.length)return -1;
    var idx=selected?wks.findIndex(function(w){return w.key===selected.key;}):-1;
    if(idx<0&&selected&&selected.num!=null)idx=wks.findIndex(function(w){return Number(w.num)===Number(selected.num);});
    return idx<0?wks.length-1:idx;
  }
  function totalsFor(rep,weeks){
    try{return totW(rep,weeks)||{revenue:0,orders:0,calls:0};}
    catch(e){return {revenue:0,orders:0,calls:0};}
  }
  function ranksFor(weeks){
    var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
    return reps.map(function(r){
      var t=totalsFor(r.name,weeks);
      return {name:r.name,rev:n(t.revenue),orders:n(t.orders),calls:n(t.calls)};
    }).sort(function(a,b){return b.rev-a.rev;});
  }
  function rankOf(rows,rep){
    for(var i=0;i<rows.length;i++)if(rows[i].name===rep)return i+1;
    return null;
  }
  function fmtSignedMoney(v){
    v=n(v);
    return (v>=0?'+':'−')+_rp2$(Math.abs(v));
  }
  function fmtDeltaPct(v){
    if(v==null||!isFinite(v))return 'No prior-week comparison';
    return (v>=0?'▲ ':'▼ ')+Math.abs(Math.round(v))+'% vs prior week';
  }
  function qualityRows(rep,weekKeys){
    var keySet={};weekKeys.forEach(function(k){keySet[k]=1;});
    var arts=(S.artErrors||[]).filter(function(a){return a.rep===rep&&(!a.weekKey||keySet[a.weekKey]);});
    var credits=(S.cms||[]).filter(function(c){
      var fault=String(c.fault||'').toLowerCase();
      return c.rep===rep&&(!c.weekKey||keySet[c.weekKey])&&fault.indexOf('rep')>=0;
    });
    var creditTotal=credits.reduce(function(sum,c){return sum+n(c.amount);},0);
    var reviews=((S.reviews&&S.reviews.rows)||[]).filter(function(r){
      var rf=(S.reviews&&S.reviews.repFix)||{};
      return (rf[r.id]||r.rep)===rep;
    });
    return {arts:arts,credits:credits,creditTotal:creditTotal,reviews:reviews};
  }
  function weekState(wk){
    if(!wk)return {key:'none',label:'No week selected',tone:'info'};
    var now=new Date(),start=dateValue(wk.start),end=dateValue(wk.end);
    if(end)end=new Date(end.getFullYear(),end.getMonth(),end.getDate(),23,59,59,999);
    if(start&&now<start)return {key:'future',label:'Future week',tone:'info'};
    if(start&&end&&now>=start&&now<=end)return {key:'current',label:'Live week',tone:'good'};
    return {key:'complete',label:'Completed week',tone:'info'};
  }
  function buildContext(rep){
    var wks=_rp2Wks()||[];
    var selected=(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null);
    var idx=selectedQuarterIndex(wks,selected);
    var through=idx>=0?wks.slice(0,idx+1):wks.slice();
    var before=idx>0?wks.slice(0,idx):[];
    var selectedData={week:selected,revenue:0,orders:0,calls:0};
    if(selected){
      var d=(S.data||{})[rep+'|'+selected.key]||{};
      selectedData={week:selected,revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls)};
    }
    selectedData.has=!!(selectedData.revenue||selectedData.orders||selectedData.calls);
    selectedData.state=weekState(selected);

    var latest=null;
    for(var i=through.length-1;i>=0;i--){
      if(weekHasData(rep,through[i])){
        var ld=(S.data||{})[rep+'|'+through[i].key]||{};
        latest={week:through[i],revenue:n(ld.revenue),orders:n(ld.orders),calls:n(ld.calls)};
        break;
      }
    }

    var qtd=totalsFor(rep,through);
    var prevQtd=totalsFor(rep,before);
    var allRanks=ranksFor(through);
    var prevRanks=ranksFor(before);
    var quarterRank=rankOf(allRanks,rep);
    var prevRank=before.length?rankOf(prevRanks,rep):null;

    var teamWeekRows=(typeof activeReps==='function'?activeReps():(S.reps||[])).map(function(r){
      var d=selected?(S.data||{})[r.name+'|'+selected.key]||{}:{};
      return {name:r.name,revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls)};
    });
    var teamWeekHas=teamWeekRows.some(function(r){return r.revenue||r.orders||r.calls;});
    teamWeekRows.sort(function(a,b){return b.revenue-a.revenue;});
    var weekRank=teamWeekHas?rankOf(teamWeekRows,rep):null;
    var teamWeekAvg=teamWeekRows.length?teamWeekRows.reduce(function(s,r){return s+r.revenue;},0)/teamWeekRows.length:0;

    var prevWeek=idx>0?wks[idx-1]:null;
    var prevWeekData=prevWeek?(S.data||{})[rep+'|'+prevWeek.key]||{}:{};
    var prevWeekRevenue=n(prevWeekData.revenue);
    var weekMomentum=(selectedData.has&&prevWeekRevenue>0)?((selectedData.revenue-prevWeekRevenue)/prevWeekRevenue*100):null;

    var goal=_rp2Goal(rep);
    var totalWeeks=wks.length||13;
    var elapsed=Math.max(1,idx+1);
    var expected=goal>0?goal*(elapsed/totalWeeks):0;
    var paceDelta=qtd.revenue-expected;
    var paceHealth=expected>0?(qtd.revenue/expected*100):null;
    var enteredWeeks=through.filter(function(w){return weekHasData(rep,w);});
    var avgEntered=enteredWeeks.length?qtd.revenue/enteredWeeks.length:0;
    var projected=avgEntered*totalWeeks;
    var remaining;
    if(selectedData.state.key==='current'&&!selectedData.has)remaining=Math.max(1,totalWeeks-idx);
    else remaining=Math.max(0,totalWeeks-(idx+1));
    var gap=Math.max(0,goal-qtd.revenue);
    var needPerWeek=remaining>0?gap/remaining:gap;

    var best=null;
    through.forEach(function(w){
      var d=(S.data||{})[rep+'|'+w.key]||{},rev=n(d.revenue);
      if(rev>0&&(!best||rev>best.revenue))best={week:w,revenue:rev};
    });

    var q=qualityRows(rep,through.map(function(w){return w.key;}));
    var aov=selectedData.orders>0?selectedData.revenue/selectedData.orders:(qtd.orders>0?qtd.revenue/qtd.orders:0);
    var quarterCallTarget=125*elapsed;
    var quarterCallPct=quarterCallTarget>0?qtd.calls/quarterCallTarget*100:0;
    var goalPct=goal>0?qtd.revenue/goal*100:null;

    return {
      rep:rep,wks:wks,selected:selected,idx:idx,through:through,before:before,selectedData:selectedData,latest:latest,
      qtd:qtd,prevQtd:prevQtd,ranks:allRanks,quarterRank:quarterRank,prevRank:prevRank,
      weekRank:weekRank,teamWeekAvg:teamWeekAvg,weekMomentum:weekMomentum,
      goal:goal,totalWeeks:totalWeeks,elapsed:elapsed,expected:expected,paceDelta:paceDelta,paceHealth:paceHealth,
      enteredWeeks:enteredWeeks,avgEntered:avgEntered,projected:projected,remaining:remaining,gap:gap,needPerWeek:needPerWeek,
      best:best,quality:q,aov:aov,quarterCallTarget:quarterCallTarget,quarterCallPct:quarterCallPct,goalPct:goalPct
    };
  }

  function statusPill(text,tone){
    return '<span class="rp2-status-pill '+(tone||'info')+'">'+_rp2Esc(text)+'</span>';
  }
  function kpi(label,value,sub,tag,tagTone){
    return '<div class="rp2-kpi rp2-kpi-v2"><div class="rp2-kl">'+_rp2Esc(label)+'</div><div class="rp2-kv">'+value+'</div>'
      +(sub?'<div class="rp2-ks">'+sub+'</div>':'')
      +(tag?'<div class="rp2-kpi-tag '+(tagTone||'')+'">'+tag+'</div>':'')
      +'</div>';
  }
  function metric(label,value,sub){
    return '<div class="rp2-metric-row"><div class="rp2-metric-label">'+label+'</div><div class="rp2-metric-value">'+value+(sub?'<small>'+sub+'</small>':'')+'</div></div>';
  }
  function nextCard(type,label,title,copy,button,page){
    return '<div class="rp2-next-card '+type+'"><div class="rp2-next-label">'+label+'</div><div class="rp2-next-title">'+title+'</div><div class="rp2-next-copy">'+copy+'</div>'
      +(button&&page?'<button class="rp2-next-action" onclick="_rp2Go(\''+page+'\')">'+button+' →</button>':'')
      +'</div>';
  }
  function sectionHead(eyebrow,title,note){
    return '<div class="rp2-section-head"><div><div class="rp2-section-eyebrow">'+eyebrow+'</div><div class="rp2-section-title">'+title+'</div></div><div class="rp2-section-note">'+note+'</div></div>';
  }
  function periodTitle(wk){
    return wk?(wk.label||('Wk '+wk.num)):'Selected week';
  }
  function periodRange(wk){
    return wk?(fd(wk.start)+' – '+fd(wk.end)):'';
  }
  function paceLabel(c){
    if(!c.goal)return {text:'Goal not set',tone:'info'};
    if(c.paceHealth>=100)return {text:'At or above pace',tone:'good'};
    if(c.paceHealth>=85)return {text:'Within reach',tone:'warn'};
    return {text:'Behind pace',tone:'warn'};
  }
  function briefFor(c){
    var sd=c.selectedData,state=sd.state.key;
    if(state==='future')return 'This is a future week. Quarter performance below is frozen through this point in the selected timeline, while the week card stays in planning mode.';
    if(state==='current'&&!sd.has){
      return 'This week is live, but no activity has been entered yet. Your quarter story is still anchored by the latest posted results, so the dashboard separates a data gap from an actual zero-performance week.';
    }
    if(!sd.has){
      return 'No activity is recorded for the selected completed week. The quarter metrics below show your performance through this point without treating missing activity as a completed zero result.';
    }
    var txt='You posted '+_rp2$(sd.revenue)+' in the selected week';
    if(c.weekMomentum!=null)txt+=', '+(c.weekMomentum>=0?'up ':'down ')+Math.abs(Math.round(c.weekMomentum))+'% from the prior week';
    txt+='. ';
    if(c.goal){
      txt+=c.paceHealth>=100?'You are currently tracking at or above required quarter pace.':'Your biggest opportunity is closing the pace gap while protecting activity and order quality.';
    }else txt+='Use the trend, activity, and quality cards below to decide where to focus next.';
    return txt;
  }
  function rankMove(c){
    if(!c.quarterRank)return 'Rank unavailable';
    if(!c.prevRank)return 'First contextual rank';
    var diff=c.prevRank-c.quarterRank;
    if(diff>0)return '▲ '+diff+' spot'+(diff===1?'':'s')+' vs prior week';
    if(diff<0)return '▼ '+Math.abs(diff)+' spot'+(Math.abs(diff)===1?'':'s')+' vs prior week';
    return 'No rank movement';
  }
  function selectedDisplay(c){
    var sd=c.selectedData;
    if(!sd.has)return '<span class="rp2-no-data">No data yet</span>';
    return _rp2$(sd.revenue);
  }
  function selectedSub(c){
    var sd=c.selectedData;
    if(sd.state.key==='future')return 'Future week · no result expected yet';
    if(!sd.has&&sd.state.key==='current')return 'Live week · awaiting entered activity';
    if(!sd.has)return 'No activity recorded for this week';
    return sd.orders+' orders · '+sd.calls+' calls';
  }

  window._rp2V476Context=buildContext;

  window._rp2Dash=function(){
    var rep=_rp2.rep,c=buildContext(rep),sd=c.selectedData;
    var first=String(rep||'').split(' ')[0]||rep;
    var hr=new Date().getHours(),greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
    var pace=paceLabel(c);
    var latestFallback='';
    if(!sd.has&&c.latest){
      latestFallback='<div class="rp2-period-fallback">Latest entered: <strong>'+_rp2Esc(periodTitle(c.latest.week))+'</strong> · '+_rp2$(c.latest.revenue)+' · '+c.latest.orders+' orders · '+c.latest.calls+' calls</div>';
    }

    var forecastText=c.goal
      ? (c.projected>=c.goal?'Projected above goal at current entered-week run rate.':'Current entered-week run rate projects to '+_rp2$(c.projected)+'.')
      : 'Forecast activates when a quarter goal is available.';
    var hero='<div class="rp2-hero rp2-hero-v2"><div class="rp2-hero-layout"><div class="rp2-hero-copy">'
      +'<div class="rp2-hero-row"><div><div class="rp2-hero-kick">'+greet.toUpperCase()+' · YOUR PERFORMANCE COMMAND CENTER</div><div class="rp2-hero-name">'+_rp2Esc(first)+'’s '+getQ()+' '+getYr()+'</div></div></div>'
      +'<div class="rp2-status-line">'+statusPill(sd.state.label,sd.state.tone)+statusPill(pace.text,pace.tone)+(c.quarterRank?statusPill('Quarter rank #'+c.quarterRank,'info'):'')+'</div>'
      +'<div class="rp2-hero-brief-v2" id="rp2-hero-brief">'+_rp2Esc(briefFor(c))+'</div>'
      +'<div class="rp2-hero-facts">'
      +'<div class="rp2-hero-fact"><span>QTD through selected week</span><strong>'+_rp2$(c.qtd.revenue)+'</strong><small>'+(c.goal?Math.round(c.goalPct||0)+'% of '+_rp2$(c.goal)+' goal':'Quarter total to this point')+'</small></div>'
      +'<div class="rp2-hero-fact"><span>Quarter pace</span><strong>'+(c.goal?Math.round(c.paceHealth||0)+'%':'—')+'</strong><small>'+(c.goal?(c.paceDelta>=0?fmtSignedMoney(c.paceDelta)+' ahead of expected pace':_rp2$(Math.abs(c.paceDelta))+' behind expected pace'):'No goal set')+'</small></div>'
      +'<div class="rp2-hero-fact"><span>Run-rate forecast</span><strong>'+(c.enteredWeeks.length?_rp2$(c.projected):'—')+'</strong><small>'+_rp2Esc(forecastText)+'</small></div>'
      +'</div></div>'
      +'<div class="rp2-hero-period rp2-hero-period-v2"><div><div class="rp2-period-label">Currently viewing</div><div class="rp2-period-week">'+_rp2Esc(periodTitle(c.selected))+'</div><div class="rp2-period-range">'+_rp2Esc(periodRange(c.selected))+'</div><div class="rp2-period-state">'+_rp2Esc(sd.state.label)+'</div></div>'
      +'<div class="rp2-period-number"><strong>'+selectedDisplay(c)+'</strong><small>'+selectedSub(c)+(c.weekRank?' · week rank #'+c.weekRank:'')+'</small>'+latestFallback+'</div></div>'
      +'</div></div>';

    var paceTag=c.goal?(c.paceDelta>=0?fmtSignedMoney(c.paceDelta)+' vs pace':_rp2$(Math.abs(c.paceDelta))+' pace gap'):'Goal needed';
    var paceTone=c.goal&&c.paceDelta>=0?'good':'warn';
    var selectedTag=sd.has?(c.weekMomentum==null?'Posted activity':fmtDeltaPct(c.weekMomentum)):(sd.state.key==='current'?'Awaiting data':sd.state.label);
    var weekCallsTag=sd.calls>=125?'Weekly target hit':Math.max(0,125-sd.calls)+' to 125 target';
    var orderSub=sd.orders>0?_rp2$(sd.revenue/sd.orders)+' selected-week AOV':(c.qtd.orders+' QTD orders');
    var kpis='<div class="rp2-grid rp2-grid-v2">'
      +kpi('Selected week',selectedDisplay(c),selectedSub(c),selectedTag,sd.has&&c.weekMomentum!=null&&c.weekMomentum>=0?'good':'')
      +kpi('QTD revenue',_rp2$(c.qtd.revenue),'Through '+_rp2Esc(periodTitle(c.selected)),c.goal?Math.round(c.goalPct||0)+'% of goal':'No goal set',c.goalPct>=100?'good':'')
      +kpi('Quarter pace',c.goal?Math.round(c.paceHealth||0)+'%':'—',c.goal?'Compared with expected pace':'Set a goal to activate pacing',paceTag,paceTone)
      +kpi('Quarter rank',c.quarterRank?('#'+c.quarterRank):'—','of '+c.ranks.length+' reps',rankMove(c),c.prevRank&&c.quarterRank<c.prevRank?'good':'')
      +kpi('Week calls',String(sd.calls),'125 weekly target',weekCallsTag,sd.calls>=125?'good':(sd.state.key==='current'?'warn':''))
      +kpi('Orders',String(sd.orders),orderSub,sd.has?'Selected week':'QTD: '+c.qtd.orders,'')
      +'</div>';

    var priorityTitle,priorityCopy,priorityButton,priorityPage;
    if(sd.state.key==='current'&&!sd.has){
      priorityTitle='Get the live week on the board';
      priorityCopy='No sales, orders, or calls are entered for the selected live week. If activity has already happened, this may simply be a reporting lag—not a true zero.';
      priorityButton='Review daily activity';priorityPage='daily';
    }else if(c.goal&&c.paceDelta<0){
      priorityTitle='Close the quarter pace gap';
      priorityCopy='You are '+_rp2$(Math.abs(c.paceDelta))+' behind expected pace through this point. Based on the selected timeline, about '+_rp2$(c.needPerWeek)+' per remaining week closes the goal gap.';
      priorityButton='Open forecast';priorityPage='forecast';
    }else if(sd.calls<125&&sd.state.key==='current'){
      priorityTitle=(125-sd.calls)+' calls remain to target';
      priorityCopy='The weekly call target is 125. Protect the activity engine now so the revenue result is not carrying the full load by itself.';
      priorityButton='View daily sales';priorityPage='daily';
    }else{
      priorityTitle='Protect the current momentum';
      priorityCopy='The dashboard does not show a critical pace issue at this point. Keep the next week focused on repeatable activity, clean orders, and maintaining rank.';
      priorityButton='Open forecast';priorityPage='forecast';
    }

    var oppTitle,oppCopy,oppButton='Open forecast',oppPage='forecast';
    if(c.qtd.orders>0&&c.aov>0){
      oppTitle='Use order value as a growth lever';
      oppCopy='Your contextual average order value is '+_rp2$(c.aov)+'. Improving order size can close the revenue gap without relying only on more transactions.';
    }else{
      oppTitle='Build the next revenue opportunity';
      oppCopy='There is not enough selected-period order activity to establish an order-value trend yet. Use Forecast to define the next meaningful target.';
    }

    var winTitle,winCopy;
    if(c.best){
      winTitle='Your best week so far: '+_rp2$(c.best.revenue);
      winCopy=_rp2Esc(periodTitle(c.best.week))+' is your current high-water mark in this selected quarter. '+(c.quarterRank?'You are sitting #'+c.quarterRank+' on the contextual leaderboard.':'Keep stacking entered weeks to establish rank.');
    }else{
      winTitle='The quarter story is still being written';
      winCopy='There is not yet an entered revenue week in the selected context. Your first posted result will establish the baseline for momentum and milestones.';
    }

    var next=sectionHead('Action layer','Your Next Move','The dashboard converts the selected reporting context into the clearest priority, opportunity, and win.')
      +'<div class="rp2-next-grid">'
      +nextCard('priority','Priority',priorityTitle,priorityCopy,priorityButton,priorityPage)
      +nextCard('opportunity','Opportunity',oppTitle,oppCopy,oppButton,oppPage)
      +nextCard('win','Win to build on',winTitle,winCopy,'View year overview','year')
      +'</div>';

    var performanceHealth=!c.goal?'info':(c.paceHealth>=100?'good':(c.paceHealth>=85?'warn':'risk'));
    var performanceLabel=!c.goal?'No goal':(c.paceHealth>=100?'On pace':(c.paceHealth>=85?'Watch':'Needs focus'));
    var activityHealth=sd.calls>=125?'good':(sd.state.key==='current'?'warn':(c.quarterCallPct>=90?'good':'warn'));
    var activityLabel=sd.calls>=125?'Target hit':(sd.state.key==='current'?'In progress':'Review');
    var qualityHealth=c.quality.arts===0&&c.quality.credits.length===0?'good':(c.quality.arts<=2&&c.quality.credits.length<=1?'warn':'risk');
    var qualityLabel=qualityHealth==='good'?'Clean':qualityHealth==='warn'?'Watch':'Needs focus';

    var intel=sectionHead('Performance system','What is driving the result?','Three views separate outcome, activity, and quality so a revenue number never has to tell the whole story.')
      +'<div class="rp2-intel-grid">'
      +'<div class="rp2-intel-card"><div class="rp2-intel-top"><div><div class="rp2-intel-name">Performance</div><div class="rp2-intel-desc">Revenue, pace, forecast, and position</div></div><div class="rp2-health '+performanceHealth+'">'+performanceLabel+'</div></div><div class="rp2-metric-list">'
      +metric('QTD revenue',_rp2$(c.qtd.revenue),c.goal?Math.round(c.goalPct||0)+'% of goal':'through selected week')
      +metric('Expected pace',c.goal?_rp2$(c.expected):'—',c.goal?(c.paceDelta>=0?fmtSignedMoney(c.paceDelta)+' ahead':_rp2$(Math.abs(c.paceDelta))+' behind'):'goal not set')
      +metric('Projected finish',c.enteredWeeks.length?_rp2$(c.projected):'—',c.enteredWeeks.length+' entered week'+(c.enteredWeeks.length===1?'':'s')+' in model')
      +metric('Best week',c.best?_rp2$(c.best.revenue):'—',c.best?_rp2Esc(periodTitle(c.best.week)):'no posted week yet')
      +'</div></div>'
      +'<div class="rp2-intel-card"><div class="rp2-intel-top"><div><div class="rp2-intel-name">Activity</div><div class="rp2-intel-desc">Calls and orders behind the result</div></div><div class="rp2-health '+activityHealth+'">'+activityLabel+'</div></div><div class="rp2-metric-list">'
      +metric('Selected-week calls',String(sd.calls),Math.max(0,125-sd.calls)+' to weekly target')
      +metric('QTD calls',String(c.qtd.calls),Math.round(c.quarterCallPct)+'% of contextual call target')
      +metric('Selected-week orders',String(sd.orders),sd.orders?_rp2$(sd.revenue/sd.orders)+' average order':'no order activity entered')
      +metric('QTD orders',String(c.qtd.orders),c.qtd.orders?_rp2$(c.qtd.revenue/c.qtd.orders)+' average order':'no QTD orders')
      +'</div></div>'
      +'<div class="rp2-intel-card"><div class="rp2-intel-top"><div><div class="rp2-intel-name">Quality</div><div class="rp2-intel-desc">Errors, credits, and customer signal</div></div><div class="rp2-health '+qualityHealth+'">'+qualityLabel+'</div></div><div class="rp2-metric-list">'
      +metric('Art errors',String(c.quality.arts.length),'through selected context')
      +metric('Rep-fault credits',String(c.quality.credits.length),_rp2$(c.quality.creditTotal)+' total')
      +metric('Customer reviews',String(c.quality.reviews.length),'reviews tied to your profile')
      +metric('Quality focus',qualityHealth==='good'?'Protect it':'Tighten execution',qualityHealth==='good'?'clean contextual record':'review issues before the next order')
      +'</div></div>'
      +'</div>';

    var chartTitle=sectionHead('Trend view','Momentum through the selected week','Weeks after the selected context are intentionally excluded so a historical selection becomes a true point-in-time snapshot.')
      +'<div class="rp2-context-note">Charts end at '+_rp2Esc(periodTitle(c.selected))+' and use the same Year / Quarter / Month / Week context as the dashboard.</div>'
      +'<div class="rp2-charts rp2-chart-grid-v2">'
      +'<div class="rp2-card"><div class="rp2-ch">Your weekly revenue trend</div><div class="rp2-cwrap"><canvas id="rp2-c-weekly"></canvas></div></div>'
      +'<div class="rp2-card"><div class="rp2-ch">You vs team average</div><div class="rp2-cwrap"><canvas id="rp2-c-vsavg"></canvas></div></div>'
      +'</div>';

    var badges=_rp2Badges(),earned=badges.filter(function(b){return b.e;}).length;
    var chips=badges.map(function(b){return '<div class="rp2-badge'+(b.e?' on':'')+'" title="'+_rp2Esc(b.d)+'">'+(b.e?b.i:'🔒')+'<span>'+_rp2Esc(b.l)+'</span></div>';}).join('');
    var milestone='<div class="rp2-card"><div class="rp2-ch">Milestones · '+earned+' of '+badges.length+' earned</div><div class="rp2-badges">'+chips+'</div></div>';

    var att=_rp2Attention();
    var attHtml=att.length?'<div class="rp2-card rp2-attention-v2"><div class="rp2-ch">Needs your attention</div>'+att.map(function(a){return '<div class="rp2-att"><span>'+a.i+'</span><span>'+_rp2Esc(a.m)+'</span></div>';}).join('')+'</div>':'';

    var maxRev=c.ranks.length?c.ranks[0].rev:0;
    var bars=c.ranks.map(function(r,i){
      var me=r.name===rep,w=maxRev>0?Math.max(2,Math.round(r.rev/maxRev*100)):2,nm=(i<3)?r.name:_rp2Anon(r.name,i+1);
      return '<div class="rp2-bar-row'+(me?' me':'')+'"><div class="rp2-bar-name">'+_rp2Esc(nm)+'</div><div class="rp2-bar-track"><div class="rp2-bar-fill" style="width:'+w+'%;"></div></div><div class="rp2-bar-val">'+_rp2$(r.rev)+'</div></div>';
    }).join('');
    var leaderboard='<div class="rp2-card"><div class="rp2-ch">Quarter leaderboard · through '+_rp2Esc(periodTitle(c.selected))+'</div>'+bars+'</div>';

    return hero+kpis+next+intel+chartTitle+milestone+attHtml+leaderboard;
  };

  window._rp2Charts=function(){
    if(typeof Chart!=='function')return;
    (_rp2.charts||[]).forEach(function(c){try{c.destroy&&c.destroy();}catch(e){}});
    _rp2.charts=[];
    var c=_rp2V476Context(_rp2.rep),ser=c.through.map(function(w){
      var d=(S.data||{})[_rp2.rep+'|'+w.key]||{};
      return {week:w,rev:n(d.revenue)};
    });
    var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
    var labels=ser.map(function(x){return 'Wk '+(x.week.num!=null?x.week.num:'');});
    var mine=ser.map(function(x){return x.rev;});
    var avg=ser.map(function(x){
      if(!reps.length)return 0;
      var total=0;reps.forEach(function(r){total+=n(((S.data||{})[r.name+'|'+x.week.key]||{}).revenue);});
      return Math.round(total/reps.length);
    });
    var bars=ser.map(function(x,i){return i===ser.length-1?'rgba(250,135,61,.95)':'rgba(0,175,239,.62)';});
    var tick={color:'#8b95a7',font:{size:10}},grid={color:'rgba(255,255,255,.05)'};
    var c1=document.getElementById('rp2-c-weekly');
    if(c1)_rp2.charts.push(new Chart(c1.getContext('2d'),{
      type:'bar',
      data:{labels:labels,datasets:[{label:'Revenue',data:mine,backgroundColor:bars,borderRadius:6}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+_rp2$(ctx.parsed.y);}}}},scales:{x:{ticks:tick,grid:{display:false}},y:{ticks:tick,grid:grid}}}
    }));
    var c2=document.getElementById('rp2-c-vsavg');
    if(c2)_rp2.charts.push(new Chart(c2.getContext('2d'),{
      type:'line',
      data:{labels:labels,datasets:[
        {label:'You',data:mine,borderColor:'#FA873D',backgroundColor:'rgba(250,135,61,.14)',tension:.32,fill:true,pointRadius:3,pointBackgroundColor:'#FA873D'},
        {label:'Team avg',data:avg,borderColor:'#00AFEF',borderDash:[5,4],tension:.32,pointRadius:2}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+_rp2$(ctx.parsed.y);}}}},scales:{x:{ticks:tick,grid:{display:false}},y:{ticks:tick,grid:grid}}}
    }));
  };

  /* The dashboard now ships with a deterministic context-aware briefing.
     Do not replace it asynchronously with generic AI copy after render. */
  window._rp2AutoBrief=function(){ return; };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep')setTimeout(function(){try{_rp2Go('dash');}catch(e){}},0);
  }catch(e){}
})();
