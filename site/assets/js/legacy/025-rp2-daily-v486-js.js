
(function(){
  function n(v){return Number(v)||0}
  function money(v){return _rp2$(n(v))}
  function esc(v){return _rp2Esc(String(v==null?'':v))}
  function isoDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function asDate(v){if(v instanceof Date)return new Date(v.getTime());var d=new Date(v);return isNaN(d.getTime())?null:d}
  function dayName(iso){return new Date(iso+'T12:00:00').toLocaleString('en-US',{weekday:'short'})}
  function dayLong(iso){return new Date(iso+'T12:00:00').toLocaleString('en-US',{weekday:'long',month:'short',day:'numeric'})}
  function dateRangeDays(start,end){
    var a=asDate(start),b=asDate(end),out=[];
    if(!a||!b)return out;
    a=new Date(a.getFullYear(),a.getMonth(),a.getDate(),12);
    b=new Date(b.getFullYear(),b.getMonth(),b.getDate(),12);
    while(a<=b){out.push(isoDate(a));a.setDate(a.getDate()+1)}
    return out;
  }
  function hasOwnDailyRecord(iso,rep){
    return !!(S.dailyRep&&S.dailyRep[iso]&&Object.prototype.hasOwnProperty.call(S.dailyRep[iso],rep))
  }
  function ownCum(iso,rep){
    try{return typeof _drWTD==='function'?n(_drWTD(iso,rep)):n((S.dailyRep&&S.dailyRep[iso]||{})[rep])}catch(e){return n((S.dailyRep&&S.dailyRep[iso]||{})[rep])}
  }
  function priorExplicitInWeek(iso,rep){
    var ws=typeof _drWeekStart==='function'?_drWeekStart(iso):iso;
    var dates=(S.dailyRep?Object.keys(S.dailyRep):[]).filter(function(d){return d>=ws&&d<iso&&hasOwnDailyRecord(d,rep)}).sort();
    return dates.length?dates[dates.length-1]:null
  }
  function daySales(iso,rep){
    var dow=new Date(iso+'T12:00:00').getDay();

    /* Use the exact same source/calculation as the management Daily Sales popup. */
    if(typeof window._drDayTotals==='function'){
      try{
        var t=window._drDayTotals(iso);
        var row=(t&&t.rows||[]).filter(function(r){return r.name===rep})[0]||null;
        var explicitDate=!!(S.dailyRep&&Object.prototype.hasOwnProperty.call(S.dailyRep,iso));
        var explicitRep=!!(S.dailyRep&&S.dailyRep[iso]&&Object.prototype.hasOwnProperty.call(S.dailyRep[iso],rep));

        if(row){
          return {
            iso:iso,
            has:true,
            reset:false,
            revenue:n(row.day),
            cumulative:n(row.cum),
            splitPending:false,
            source:'managementDailyRep',
            explicitRep:explicitRep
          };
        }

        if(dow===0&&!explicitRep){
          return {
            iso:iso,
            has:true,
            reset:true,
            revenue:0,
            cumulative:0,
            splitPending:false,
            source:'weeklyReset'
          };
        }

        /* An explicit dailyRep date may exist because other reps were entered.
           That is not the same thing as this rep having a personal daily entry. */
        if(explicitDate&&!explicitRep){
          return {
            iso:iso,
            has:false,
            reset:false,
            revenue:null,
            cumulative:0,
            splitPending:false,
            source:'teamRepDataOnly'
          };
        }
      }catch(e){}
    }

    /* Fallback only if the management helper is unavailable. */
    if(dow===0&&!hasOwnDailyRecord(iso,rep)){
      return {iso:iso,has:true,reset:true,revenue:0,cumulative:0,splitPending:false,source:'weeklyReset'};
    }
    if(!hasOwnDailyRecord(iso,rep)){
      return {iso:iso,has:false,reset:false,revenue:null,cumulative:ownCum(iso,rep),splitPending:false,source:'none'};
    }
    var cur=n((S.dailyRep[iso]||{})[rep]),prevIso=priorExplicitInWeek(iso,rep),prev=prevIso?n((S.dailyRep[prevIso]||{})[rep]):0;
    var gap=false;
    if(prevIso){
      var pd=new Date(prevIso+'T12:00:00'),cd=new Date(iso+'T12:00:00');
      gap=((cd-pd)/86400000)>1;
    }else if(dow>1){
      gap=true;
    }
    return {iso:iso,has:true,reset:false,revenue:Math.max(0,cur-prev),cumulative:cur,splitPending:gap,prevIso:prevIso,source:'fallback'};
  }
  function teamDailyFor(iso){
    try{
      var e=(typeof getDailySales==='function'?getDailySales():[]).filter(function(x){return x.date===iso})[0]||null;
      if(e)return {has:true,total:n(e.dailySales),smb:n(e.smbSales),corp:n(e.corpSales)};
    }catch(e){}
    if(typeof window._drDayTotals==='function'){
      try{
        var t=window._drDayTotals(iso);
        if(t&&(n(t.totalDay)>0||n(t.totalCum)>0||(S.dailyRep&&Object.prototype.hasOwnProperty.call(S.dailyRep,iso)))){
          return {has:true,total:n(t.totalDay),smb:n(t.smbDay),corp:n(t.corpDay)};
        }
      }catch(e){}
    }
    return {has:false,total:0,smb:0,corp:0};
  }
  function ordersOn(iso,rep){
    return (S.orders||[]).filter(function(o){return o.rep===rep&&o.orderDate===iso&&o.kind==='order'})
  }
  function qualityForWeek(rep,week){
    var key=week&&week.key;
    var arts=(S.artErrors||[]).filter(function(a){return a.rep===rep&&(!key||!a.weekKey||a.weekKey===key)});
    var credits=(S.cms||[]).filter(function(c){var fault=String(c.fault||'').toLowerCase();return c.rep===rep&&(!key||!c.weekKey||c.weekKey===key)&&fault.indexOf('rep')>=0});
    return {arts:arts.length,credits:credits.length,creditValue:credits.reduce(function(s,c){return s+n(c.amount)},0)}
  }
  function selectedContext(){
    var c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null;
    if(c&&c.selected)return c;
    var wks=_rp2Wks(),w=wks[wks.length-1]||null;
    return {rep:_rp2.rep,selected:w,wks:wks,selectedData:{calls:0,orders:0,revenue:0,state:{key:'complete',label:'Selected week'}},goal:_rp2Goal(_rp2.rep)}
  }
  function dailyBuild(){
    var c=selectedContext(),rep=_rp2.rep,w=c.selected;
    var days=w?dateRangeDays(w.start,w.end):[];
    if(!days.length){
      var now=new Date(),sun=new Date(now);sun.setDate(now.getDate()-now.getDay());
      days=dateRangeDays(sun,new Date(sun.getFullYear(),sun.getMonth(),sun.getDate()+6));
    }
    var rows=days.map(function(iso){
      var s=daySales(iso,rep),team=teamDailyFor(iso),orders=ordersOn(iso,rep),orderSales=orders.reduce(function(sum,o){return sum+n(o.total)},0),topOrder=orders.reduce(function(best,o){return !best||n(o.total)>n(best.total)?o:best},null);
      return {iso:iso,sales:s,team:team,orders:orders,orderCount:orders.length,orderSales:orderSales,topOrder:topOrder,dow:new Date(iso+'T12:00:00').getDay()}
    });
    var entered=rows.filter(function(r){return r.sales.has&&!r.sales.reset&&r.sales.revenue!=null});
    var personalCoverage=entered.length;
    var teamCoverage=rows.filter(function(r){return r.team&&r.team.has&&!r.sales.reset}).length;
    var latest=entered.length?entered[entered.length-1]:null;
    var today=isoDate(new Date());
    var defaultDate=window._rp2DailySelectedDate;
    if(!defaultDate||days.indexOf(defaultDate)<0){
      if(days.indexOf(today)>=0)defaultDate=today;
      else if(latest)defaultDate=latest.iso;
      else defaultDate=days[Math.min(1,days.length-1)]||today;
      window._rp2DailySelectedDate=defaultDate;
    }
    var selected=rows.filter(function(r){return r.iso===defaultDate})[0]||rows[0];
    var dailyTrackedWeekSales=latest?latest.sales.cumulative:0;
    var officialWeekRevenue=c.selectedData?n(c.selectedData.revenue):0;
    var weekSales=officialWeekRevenue>0?officialWeekRevenue:dailyTrackedWeekSales;
    var weekOrders=rows.reduce(function(s,r){return s+r.orderCount},0);
    var weekOrderSales=rows.reduce(function(s,r){return s+r.orderSales},0);
    var weeklyCalls=c.selectedData?n(c.selectedData.calls):0;
    var weeklyOrdersRecorded=c.selectedData?n(c.selectedData.orders):0;
    var quarterWeeks=(c.wks&&c.wks.length)||13;
    var weeklyGoal=c.goal>0?c.goal/quarterWeeks:0;
    var dailyTarget=weeklyGoal>0?weeklyGoal/5:0;
    var standardSelling=rows.filter(function(r){return r.dow>=1&&r.dow<=5});
    var progressIso=days.indexOf(today)>=0?today:(latest?latest.iso:days[0]);
    var completedSelling=standardSelling.filter(function(r){return r.iso<=progressIso}).length;
    var neededByNow=dailyTarget*completedSelling;
    var remainingSelling=standardSelling.filter(function(r){return r.iso>progressIso}).length;
    var gap=Math.max(0,weeklyGoal-weekSales);
    var perRemaining=remainingSelling>0?gap/remainingSelling:gap;
    var quality=qualityForWeek(rep,w);

    var bestRevenue=entered.reduce(function(best,r){return !best||n(r.sales.revenue)>n(best.sales.revenue)?r:best},null);
    var weakest=entered.filter(function(r){return r.dow>=1&&r.dow<=5}).reduce(function(best,r){return !best||n(r.sales.revenue)<n(best.sales.revenue)?r:best},null);
    var bestOrderDay=rows.reduce(function(best,r){return !best||r.orderSales>best.orderSales?r:best},null);
    if(bestOrderDay&&bestOrderDay.orderSales<=0)bestOrderDay=null;
    var allOrders=[].concat.apply([],rows.map(function(r){return r.orders}));
    var largestOrder=allOrders.reduce(function(best,o){return !best||n(o.total)>n(best.total)?o:best},null);

    var dayRank=null,rankSize=0;
    if(selected&&selected.sales.has&&selected.sales.revenue!=null){
      var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
      var rankRows=reps.map(function(r){var ds=daySales(selected.iso,r.name);return {name:r.name,value:ds.has&&ds.revenue!=null?n(ds.revenue):0}}).filter(function(x){return x.value>0}).sort(function(a,b){return b.value-a.value});
      rankSize=rankRows.length;
      rankRows.forEach(function(r,i){if(r.name===rep)dayRank=i+1});
    }
    return {c:c,rep:rep,w:w,days:days,rows:rows,selected:selected,entered:entered,latest:latest,personalCoverage:personalCoverage,teamCoverage:teamCoverage,dailyTrackedWeekSales:dailyTrackedWeekSales,officialWeekRevenue:officialWeekRevenue,weekSales:weekSales,weekOrders:weekOrders,weekOrderSales:weekOrderSales,weeklyCalls:weeklyCalls,weeklyOrdersRecorded:weeklyOrdersRecorded,weeklyGoal:weeklyGoal,dailyTarget:dailyTarget,completedSelling:completedSelling,neededByNow:neededByNow,remainingSelling:remainingSelling,gap:gap,perRemaining:perRemaining,quality:quality,bestRevenue:bestRevenue,weakest:weakest,bestOrderDay:bestOrderDay,largestOrder:largestOrder,dayRank:dayRank,rankSize:rankSize,progressIso:progressIso}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-ds-section-head"><div><div class="rp2-ds-section-kick">'+kick+'</div><div class="rp2-ds-section-title">'+title+'</div></div><div class="rp2-ds-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-ds-kpi"><div class="rp2-ds-kpi-label">'+esc(label)+'</div><div class="rp2-ds-kpi-value">'+value+'</div><div class="rp2-ds-kpi-sub">'+sub+'</div></div>'}
  function dayStatus(r,g){
    if(r.sales.reset)return {text:'Weekly reset baseline',tone:'good'};
    if(!r.sales.has)return {text:'No daily entry',tone:''};
    if(r.sales.splitPending)return {text:'Cumulative split pending',tone:'warn'};
    if(g.dailyTarget>0&&r.sales.revenue>=g.dailyTarget)return {text:'At or above daily pace',tone:'good'};
    if(g.dailyTarget>0)return {text:'Below daily pace',tone:'warn'};
    return {text:'Daily sales entered',tone:'good'}
  }
  function dayCard(r,g){
    var st=dayStatus(r,g),selected=r.iso===g.selected.iso;
    return '<button class="rp2-ds-day '+(selected?'selected ':'')+(r.sales.reset?'reset ':'')+(!r.sales.has?'missing':'')+'" onclick="_rp2DailySelect(\''+r.iso+'\')">'
      +'<div class="rp2-ds-day-name">'+dayName(r.iso)+'</div><div class="rp2-ds-day-date">'+esc(dayLong(r.iso).replace(/^.*?,\s*/,''))+'</div>'
      +'<div class="rp2-ds-day-value">'+(r.sales.has?(r.sales.revenue==null?'—':money(r.sales.revenue)):'—')+'</div>'
      +'<div class="rp2-ds-day-sub">'+(r.sales.reset?'Sunday reset':r.sales.splitPending?'May include missing prior day':r.orderCount+' uploaded order'+(r.orderCount===1?'':'s'))+'</div>'
      +'<div class="rp2-ds-day-status '+st.tone+'">'+st.text+'</div></button>'
  }
  function selectedRead(g){
    var r=g.selected,s=r.sales,title='',copy='',tone='warn';
    if(s.reset){title='The week starts at a clean $0 baseline';copy='Sunday is the cumulative reset point. Selling-day pace begins Monday, while Sunday remains visible so the weekly progression is easy to read.';tone='good'}
    else if(!s.has){title='No daily sales entry is recorded yet';copy='This is a data state, not a performance judgment. Once a cumulative rep total is entered for this date, the page can calculate the day’s sales contribution.'}
    else if(s.splitPending){title='This day may contain more than one day of sales';copy='A prior weekday entry is missing, so the cumulative difference cannot be split accurately. The revenue shown is real cumulative movement, but the exact day allocation is still pending.'}
    else if(g.dailyTarget>0&&s.revenue>=g.dailyTarget){title='This day is carrying its share of the weekly target';copy='Revenue is at or above the standard daily pace implied by the quarter goal. The next question is whether that output is repeatable across the remaining selling days.';tone='good'}
    else if(g.dailyTarget>0){title='This day finished below the pace implied by the weekly target';copy='One slower day does not decide the week, but the remaining daily requirement rises. Use the pace tracker to see exactly what the rest of the week now needs.'}
    else {title='Daily sales are on the board';copy='A configured quarter goal would activate daily pace comparisons. For now, use the week strip and order details to understand momentum.';tone='good'}
    var ords=r.orders,top=r.topOrder;
    return '<div class="rp2-ds-read"><div class="rp2-ds-read-label">What this day means · '+esc(dayLong(r.iso))+'</div><div class="rp2-ds-read-title">'+esc(title)+'</div><div class="rp2-ds-read-copy">'+esc(copy)+'</div><div class="rp2-ds-read-facts">'
      +'<div class="rp2-ds-read-fact"><span>Daily sales</span><strong>'+(s.has&&s.revenue!=null?money(s.revenue):'—')+'</strong></div>'
      +'<div class="rp2-ds-read-fact"><span>Uploaded orders</span><strong>'+ords.length+'</strong></div>'
      +'<div class="rp2-ds-read-fact"><span>Daily rank</span><strong>'+(g.dayRank?('#'+g.dayRank+' of '+g.rankSize):'—')+'</strong></div>'
      +'</div></div>'
  }
  function intelligence(g){
    var r=g.selected,orderAov=r.orderCount?r.orderSales/r.orderCount:0;
    var activityTitle=g.weeklyCalls>=125?'Weekly call target is complete':Math.max(0,125-g.weeklyCalls)+' calls remain to the weekly target';
    var activityCopy='The current data source stores calls at the weekly level, not by day. This page will not fabricate a daily call split. Weekly calls are '+g.weeklyCalls+' of 125.';
    var salesTitle=r.sales.has&&r.sales.revenue!=null?money(r.sales.revenue)+' in daily sales':'No daily sales entry';
    var salesCopy=r.sales.splitPending?'The amount may span multiple days because a prior cumulative entry is missing.':(g.dailyTarget?'Standard daily pace is about '+money(g.dailyTarget)+'.':'A quarter goal is needed to calculate daily pace.');
    var qualityTitle=g.quality.arts===0&&g.quality.credits===0?'Clean selected-week quality record':(g.quality.arts+' art errors · '+g.quality.credits+' rep-fault credits');
    var qualityCopy='Quality is tracked at the selected-week level because the current issue data does not consistently include a reliable daily timestamp.';
    return '<div class="rp2-ds-intel">'
      +'<div class="rp2-ds-intel-card"><div class="rp2-ds-intel-label">Sales</div><div class="rp2-ds-intel-title">'+salesTitle+'</div><div class="rp2-ds-intel-copy">'+salesCopy+'</div></div>'
      +'<div class="rp2-ds-intel-card"><div class="rp2-ds-intel-label">Activity</div><div class="rp2-ds-intel-title">'+activityTitle+'</div><div class="rp2-ds-intel-copy">'+activityCopy+'</div></div>'
      +'<div class="rp2-ds-intel-card"><div class="rp2-ds-intel-label">Quality</div><div class="rp2-ds-intel-title">'+qualityTitle+'</div><div class="rp2-ds-intel-copy">'+qualityCopy+'</div></div>'
      +'</div>'
  }
  function pace(g){
    var max=Math.max(g.weeklyGoal,g.weekSales,g.neededByNow,1),actualPct=Math.min(100,g.weekSales/max*100),neededPct=Math.min(100,g.neededByNow/max*100);
    return '<div class="rp2-ds-pace"><div class="rp2-ds-panel-title">Week pace tracker</div><div class="rp2-ds-panel-sub">Official weekly revenue versus the standard Monday–Friday pace implied by the quarter goal. Personal daily detail is shown separately and never substitutes for missing weekly revenue.</div>'
      +'<div class="rp2-ds-pace-scale"><span class="actual" style="width:'+actualPct+'%"></span><span class="needed" style="left:'+neededPct+'%"></span></div>'
      +'<div class="rp2-ds-pace-labels"><span>Actual '+money(g.weekSales)+'</span><span>Needed by this point '+money(g.neededByNow)+'</span><span>Weekly target '+(g.weeklyGoal?money(g.weeklyGoal):'—')+'</span></div>'
      +'<div class="rp2-ds-pace-summary">'
        +'<div class="rp2-ds-pace-stat"><span>Current week sales</span><strong>'+money(g.weekSales)+'</strong><small>Official weekly tracker revenue when available; otherwise personal cumulative daily feed</small></div>'
        +'<div class="rp2-ds-pace-stat"><span>Gap to weekly target</span><strong>'+(g.weeklyGoal?money(g.gap):'—')+'</strong><small>'+(g.weeklyGoal?'Remaining revenue required':'Quarter goal not configured')+'</small></div>'
        +'<div class="rp2-ds-pace-stat"><span>Needed per remaining day</span><strong>'+(g.remainingSelling?money(g.perRemaining):'—')+'</strong><small>'+g.remainingSelling+' standard selling day'+(g.remainingSelling===1?'':'s')+' remaining</small></div>'
      +'</div></div>'
  }
  function record(label,value,sub){return '<div class="rp2-ds-record"><div class="rp2-ds-record-label">'+label+'</div><div class="rp2-ds-record-value">'+value+'</div><div class="rp2-ds-record-sub">'+sub+'</div></div>'}
  function records(g){
    return '<div class="rp2-ds-record-grid">'
      +record('Best revenue day',g.bestRevenue?money(g.bestRevenue.sales.revenue):'—',g.bestRevenue?esc(dayLong(g.bestRevenue.iso)):'No entered selling day yet')
      +record('Strongest order day',g.bestOrderDay?money(g.bestOrderDay.orderSales):'—',g.bestOrderDay?(esc(dayLong(g.bestOrderDay.iso))+' · '+g.bestOrderDay.orderCount+' orders'):'No uploaded orders in selected week')
      +record('Largest uploaded order',g.largestOrder?money(g.largestOrder.total):'—',g.largestOrder?esc((g.largestOrder.customer||'Customer')+(g.largestOrder.orderNum?' · '+g.largestOrder.orderNum:'')):'No uploaded order detail')
      +record('Day needing attention',g.weakest?money(g.weakest.sales.revenue):'—',g.weakest?esc(dayLong(g.weakest.iso)):'No entered weekday to evaluate')
      +'</div>'
  }
  function orderList(g){
    var orders=g.selected.orders.slice().sort(function(a,b){return n(b.total)-n(a.total)});
    if(!orders.length)return '<div class="rp2-ds-panel"><div class="rp2-ds-panel-title">Selected-day orders</div><div class="rp2-ds-panel-sub">No uploaded order records are tied to '+esc(dayLong(g.selected.iso))+'.</div></div>';
    return '<div class="rp2-ds-panel"><div class="rp2-ds-panel-title">Selected-day orders</div><div class="rp2-ds-panel-sub">Order detail comes from the uploaded orders source and may not exactly equal the cumulative daily-sales feed.</div><div class="rp2-ds-order-list">'
      +orders.slice(0,8).map(function(o){return '<div class="rp2-ds-order"><div class="rp2-ds-order-name">'+esc(o.customer||'Customer')+'<small>'+esc(o.orderNum||'')+(o.orderType?' · '+esc(o.orderType):'')+'</small></div><div class="rp2-ds-order-val">'+money(o.total)+'</div></div>'}).join('')
      +'</div></div>'
  }
  function monthCalendar(g){
    var focus=asDate(g.selected.iso+'T12:00:00'),yr=focus.getFullYear(),mo=focus.getMonth(),first=new Date(yr,mo,1),start=first.getDay(),days=new Date(yr,mo+1,0).getDate(),cells='';
    for(var i=0;i<start;i++)cells+='<div class="rp2-ds-cal-cell empty"></div>';
    for(var d=1;d<=days;d++){
      var iso=yr+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),s=daySales(iso,g.rep),inWeek=g.days.indexOf(iso)>=0,sel=iso===g.selected.iso;
      cells+='<button class="rp2-ds-cal-cell '+(s.has?'has ':'')+(s.reset?'reset ':'')+(inWeek?'week ':'')+(sel?'selected':'')+'" onclick="_rp2DailySelect(\''+iso+'\')"><div class="rp2-ds-cal-num">'+d+'</div>'
        +(s.has?'<div class="rp2-ds-cal-val">'+(s.revenue==null?'—':money(s.revenue))+'</div><div class="rp2-ds-cal-sub">'+(s.reset?'Weekly reset':s.splitPending?'Split pending':'Personal daily sales')+'</div>':'')
        +'</button>';
    }
    return '<div class="rp2-ds-calendar"><div class="rp2-ds-panel-title">'+focus.toLocaleString('en-US',{month:'long',year:'numeric'})+' personal sales calendar</div><div class="rp2-ds-panel-sub">Only your own daily sales are shown. Click a date to inspect it.</div><div class="rp2-ds-cal-dow"><span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span></div><div class="rp2-ds-cal-grid">'+cells+'</div></div>'
  }
  function nextSelling(g){
    var next=g.rows.filter(function(r){return r.dow>=1&&r.dow<=5&&r.iso>g.progressIso})[0]||null;
    if(!next){
      return '<div class="rp2-ds-next"><div><div class="rp2-ds-next-label">Next selling day</div><div class="rp2-ds-next-title">The selected week has no standard selling days left</div><div class="rp2-ds-next-copy">Use Forecast for the next forward-looking target. This page keeps the selected week as a historical operating record rather than pretending the week still has runway.</div></div><div class="rp2-ds-next-target"><span>Selected-week result</span><strong>'+money(g.weekSales)+'</strong><small>'+g.weekOrders+' uploaded orders · '+g.weeklyCalls+' weekly calls</small></div></div>'
    }
    var target=g.remainingSelling?g.perRemaining:g.dailyTarget;
    return '<div class="rp2-ds-next"><div><div class="rp2-ds-next-label">Your next selling day · '+esc(dayLong(next.iso))+'</div><div class="rp2-ds-next-title">A clear target before the day begins</div><div class="rp2-ds-next-copy">'+(g.weeklyGoal?'Hitting about '+money(target)+' keeps the remaining weekly gap distributed evenly across the standard selling days still available.':'A quarter goal is not configured, so use recent daily performance as the operating baseline.')+' Weekly calls are currently '+g.weeklyCalls+' of 125; daily call allocation is not available from the current source.</div></div><div class="rp2-ds-next-target"><span>Revenue target</span><strong>'+(g.weeklyGoal?money(target):'—')+'</strong><small>'+(g.remainingSelling?g.remainingSelling+' selling days remain in the selected week':'No standard selling days remain')+'</small></div></div>'
  }

  window._rp2DailySelect=function(iso){
    window._rp2DailySelectedDate=iso;
    var page=document.getElementById('rp2-page');
    if(page)page.innerHTML=window._rp2DailyV2();
    setTimeout(function(){try{window._rp2DailyDraw()}catch(e){}},0)
  };

  window._rp2DailyV2=function(){
    var g=dailyBuild(),wLabel=g.w?(g.w.label||('Wk '+g.w.num)):'Selected week';
    var statusTitle='',statusCopy='',statusTone='warn';
    if(g.personalCoverage===0&&g.officialWeekRevenue>0){
      statusTitle='Weekly sales exist, but personal daily detail is not available for this week';
      statusCopy='Your official weekly revenue is '+money(g.officialWeekRevenue)+'. The management calendar '+(g.teamCoverage>0?'has team-level daily totals, but ':'')+'does not have a saved per-rep daily split for '+g.rep+' in this selected week. Switch to a week with per-rep daily entries to see the day-by-day breakdown.';
      statusTone='warn';
    }else if(!g.weeklyGoal){
      statusTitle='Weekly pace activates when a quarter goal is available';
      statusCopy='Daily Sales is still tracking your personal sales, orders, and weekly calls, but it cannot calculate a required revenue pace without a configured goal.';
    }else if(g.weekSales>=g.neededByNow){
      statusTitle='At or above pace for this point in the week';
      statusCopy='Your official weekly revenue is carrying at least the amount implied by the standard Monday–Friday pace through the selected point.';
      statusTone='good';
    }else{
      statusTitle=money(g.neededByNow-g.weekSales)+' behind the pace for this point';
      statusCopy='The gap is recoverable if the remaining selling days average about '+money(g.perRemaining)+'.';
      statusTone='warn';
    }
    var hero='<div class="rp2-ds-hero"><div class="rp2-ds-hero-grid"><div><div class="rp2-ds-kick">Daily Sales 2.0 · BUILD v486</div><div class="rp2-ds-title">Your week, day by day</div><div class="rp2-ds-copy">'+esc(statusTitle)+'. '+esc(statusCopy)+'</div><div class="rp2-ds-pills"><span class="rp2-ds-pill '+statusTone+'">'+esc(statusTitle)+'</span><span class="rp2-ds-pill">'+esc(wLabel)+'</span><span class="rp2-ds-pill">Personal sales only</span></div></div><div class="rp2-ds-brief"><div><div class="rp2-ds-brief-label">Selected week sales</div><div class="rp2-ds-brief-value">'+money(g.weekSales)+'</div><div class="rp2-ds-brief-title">'+(g.weeklyGoal?(Math.round(g.weekSales/g.weeklyGoal*100)+'% of weekly pace target'):'Personal daily-sales total')+'</div><div class="rp2-ds-brief-copy">Official week revenue comes from the weekly tracker. The day-by-day strip below uses the management Daily Sales per-rep source.</div></div><div class="rp2-ds-brief-sub">'+g.weeklyCalls+' weekly calls · '+g.weekOrders+' uploaded orders</div></div></div></div>';
    var kpis='<div class="rp2-ds-kpis">'
      +kpi('Official week revenue',money(g.weekSales),g.officialWeekRevenue>0?'Pulled from the weekly tracker':'Using the available daily cumulative feed')
      +kpi('Daily detail coverage',g.personalCoverage+' day'+(g.personalCoverage===1?'':'s'),g.teamCoverage>g.personalCoverage?(g.teamCoverage+' team-data days exist in this week'):'Uses the management per-rep Daily Sales source')
      +kpi('Weekly calls',String(g.weeklyCalls),'125 weekly target · daily split not stored')
      +kpi('Uploaded orders',String(g.weekOrders),g.weekOrders?money(g.weekOrderSales/g.weekOrders)+' uploaded-order AOV':'No dated orders in selected week')
      +kpi('Gap to week target',g.weeklyGoal?money(g.gap):'—',g.remainingSelling?money(g.perRemaining)+' per remaining selling day':'No standard selling days remaining')
      +kpi('Selected-day rank',g.dayRank?('#'+g.dayRank):'—',g.dayRank?('of '+g.rankSize+' reps with positive daily sales'):'No comparable personal daily result')
      +'</div>';
    var sourceBanner='<div class="rp2-ds-source-banner '+(g.personalCoverage>0?'good':'warn')+'">'
      +'<strong>'+(g.personalCoverage>0?'✓ Personal daily feed connected':'⚠ Personal daily split unavailable for this selected week')+'</strong>'
      +'<span>'+(g.personalCoverage>0
        ?('Daily values below are calculated by the exact same management source used in the Daily Sales popup. '+g.personalCoverage+' personal sales day'+(g.personalCoverage===1?' is':'s are')+' available.')
        :((g.teamCoverage>0?'Team daily totals exist for '+g.teamCoverage+' day'+(g.teamCoverage===1?'':'s')+', but ':'')+'no per-rep daily values are saved for '+esc(g.rep)+' in this week. Official weekly revenue and dated orders can still be shown.'))+'</span>'
      +'</div>';
    var strip=sourceBanner+sectionHead('Daily progression','The selected week at a glance','Sunday shows the weekly reset. Personal day values now come from the exact same per-rep calculation used by the management Daily Sales popup.')+'<div class="rp2-ds-weekstrip">'+g.rows.map(function(r){return dayCard(r,g)}).join('')+'</div>';
    var analysis=sectionHead('Day intelligence','What the selected day means','Daily revenue is real cumulative-sales data. Dated order detail is shown where available; weekly calls remain weekly because the source does not store a reliable per-day call split.')+'<div class="rp2-ds-analysis-grid"><div>'+selectedRead(g)+intelligence(g)+'</div>'+pace(g)+'</div>';
    var recs=sectionHead('Week highlights','Best day, biggest order, and the day needing attention','These benchmarks stay inside the selected week so the rep can understand what actually drove the result.')+records(g);
    var charts=sectionHead('Momentum','Your personal daily-sales curve','The chart uses only your daily sales. The order panel is a separate dated source and is labeled separately so the two systems are not falsely blended.')+'<div class="rp2-ds-chart-grid"><div class="rp2-ds-panel"><div class="rp2-ds-panel-title">Daily sales progression</div><div class="rp2-ds-panel-sub">Personal daily sales across the selected week</div><div class="rp2-ds-chart"><canvas id="rp2-ds-chart"></canvas></div></div>'+orderList(g)+'</div>';
    var cal=sectionHead('Personal calendar','Your daily sales calendar','This is intentionally personal—not the team-wide management calendar. It shows your own cumulative-derived daily sales only.')+monthCalendar(g);
    return '<div class="rp2-ds-shell">'+hero+kpis+strip+analysis+recs+charts+cal+nextSelling(g)+'</div>'
  };

  window._rp2DailyDraw=function(){
    if(typeof Chart!=='function')return;
    var g=dailyBuild(),canvas=document.getElementById('rp2-ds-chart');
    if(!canvas)return;
    if(_rp2.dailyChart){try{_rp2.dailyChart.destroy()}catch(e){}}
    var labels=g.rows.map(function(r){return dayName(r.iso)}),values=g.rows.map(function(r){return r.sales.has&&r.sales.revenue!=null?r.sales.revenue:null});
    _rp2.dailyChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:labels,datasets:[
        {label:'Daily sales',data:values,backgroundColor:g.rows.map(function(r){return r.iso===g.selected.iso?'rgba(250,135,61,.92)':'rgba(0,175,239,.62)'}),borderRadius:6},
        {type:'line',label:'Daily pace target',data:g.rows.map(function(r){return r.dow>=1&&r.dow<=5&&g.dailyTarget?g.dailyTarget:null}),borderColor:'#4ed6a3',borderDash:[6,4],pointRadius:0,tension:0}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y)}}}},scales:{x:{ticks:{color:'#8b95a7',font:{size:10}},grid:{display:false}},y:{ticks:{color:'#8b95a7',font:{size:10},callback:function(v){return '$'+Math.round(v/1000)+'k'}},grid:{color:'rgba(255,255,255,.05)'}}}}
    })
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='daily')setTimeout(function(){try{_rp2Go('daily')}catch(e){}},0)
  }catch(e){}
})();
