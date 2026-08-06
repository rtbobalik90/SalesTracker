
(function(){
  var PF_TABS=[
    {id:'overview',label:'Overview',icon:'◫'},
    {id:'records',label:'Personal Records',icon:'★'},
    {id:'achievements',label:'Achievements',icon:'🏅'},
    {id:'journey',label:'Career Journey',icon:'↗'}
  ];
  window._rp2ProfileTab=window._rp2ProfileTab||'overview';

  function n(v){return Number(v)||0}
  function esc(v){return _rp2Esc(String(v==null?'':v))}
  function money(v){return _rp2$(n(v))}
  function safeArray(v){
    if(Array.isArray(v))return v;
    if(!v)return [];
    try{
      if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);
      if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null});
    }catch(e){}
    return []
  }
  function dt(v){
    if(v==null||v==='')return null;
    try{
      var d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);
      return isNaN(d.getTime())?null:d
    }catch(e){return null}
  }
  function iso(v){
    var d=dt(v);return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')):''
  }
  function displayDate(v,short){
    var d=dt(v);return d?d.toLocaleString('en-US',short?{month:'short',day:'numeric',year:'numeric'}:{month:'long',day:'numeric',year:'numeric'}):'—'
  }
  function pct(v){return Math.round(n(v))+'%'}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function weeks(year,q){try{return safeArray(gwq(year,q)).filter(function(w){return w&&w.key})}catch(e){return []}}
  function repRecord(){
    var reps=safeArray(S&&S.reps),rep=_rp2.rep;
    return reps.filter(function(r){return r&&r.name===rep})[0]||{name:rep,profile:{}}
  }
  function roleName(r){
    try{
      if(r&&r.profile&&r.profile.role)return r.profile.role;
      if(typeof repRole==='function'&&typeof roleDef==='function')return roleDef(repRole(r)).name||'Sales Specialist'
    }catch(e){}
    return 'Sales Specialist'
  }
  function tenure(profile){
    var hire=profile&&profile.hireDate?dt(profile.hireDate):null;
    if(!hire)return {label:'Hire date not set',years:null,months:null};
    var now=new Date(),months=(now.getFullYear()-hire.getFullYear())*12+(now.getMonth()-hire.getMonth());
    if(now.getDate()<hire.getDate())months--;
    months=Math.max(0,months);
    var y=Math.floor(months/12),m=months%12;
    return {years:y,months:m,label:y?(y+' year'+(y===1?'':'s')+(m?' · '+m+' mo':'')):(m+' month'+(m===1?'':'s'))}
  }
  function goalFor(rep,year,q){
    try{
      var g=S&&S.goals&&S.goals[rep]&&S.goals[rep][String(year)]&&S.goals[rep][String(year)][q];
      return g?{rev:n(g.rev),calls:n(g.calls)||125}: {rev:0,calls:125}
    }catch(e){return {rev:0,calls:125}}
  }
  function currentContext(){
    try{
      var c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null;
      if(c)return c
    }catch(e){}
    var ws=weeks(Number(getYr()),getQ()),sel=null;
    try{sel=typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null}catch(e){}
    var idx=sel?ws.findIndex(function(w){return w.key===sel.key}):ws.length-1;
    if(idx<0)idx=ws.length-1;
    return {wks:ws,selected:sel||ws[idx]||null,through:ws.slice(0,idx+1),goal:goalFor(_rp2.rep,Number(getYr()),getQ()).rev}
  }
  function totalsFor(rep,ws){
    var t={revenue:0,orders:0,calls:0,acctsCalled:0,setSize:0,entered:0,weeks:[]};
    safeArray(ws).forEach(function(w){
      var d=(S&&S.data&&S.data[rep+'|'+w.key])||{};
      var has=!!(n(d.revenue)||n(d.orders)||n(d.calls)||n(d.acctsCalled)||n(d.setSize));
      if(has)t.entered++;
      t.revenue+=n(d.revenue);t.orders+=n(d.orders);t.calls+=n(d.calls);
      t.acctsCalled+=n(d.acctsCalled);t.setSize+=n(d.setSize);
      t.weeks.push({week:w,data:d,has:has})
    });
    t.aov=t.orders?t.revenue/t.orders:0;
    return t
  }
  function rankFor(rep,ws){
    var reps=safeArray(typeof activeReps==='function'?activeReps():(S&&S.reps)).map(function(r){return typeof r==='string'?{name:r}:r}).filter(function(r){return r&&r.name});
    var rows=reps.map(function(r){return {name:r.name,revenue:totalsFor(r.name,ws).revenue}}).sort(function(a,b){return b.revenue-a.revenue});
    var rank=null;rows.forEach(function(r,i){if(r.name===rep)rank=i+1});
    return {rank:rank,total:rows.length,rows:rows}
  }
  function allQuarterData(rep){
    var rows=[];
    for(var year=2026;year<=2030;year++){
      for(var qi=1;qi<=4;qi++){
        var q='Q'+qi,ws=weeks(year,q),t=totalsFor(rep,ws),g=goalFor(rep,year,q),r=rankFor(rep,ws);
        if(t.entered||t.revenue||t.orders||t.calls){
          rows.push({year:year,q:q,label:q+' '+year,weeks:ws,totals:t,goal:g.rev,rank:r.rank,rankTotal:r.total})
        }
      }
    }
    return rows
  }
  function weekCatalog(){
    var out=[];
    for(var year=2026;year<=2030;year++){
      for(var qi=1;qi<=4;qi++){
        var q='Q'+qi;
        weeks(year,q).forEach(function(w,idx){out.push({year:year,q:q,week:w,index:idx})})
      }
    }
    out.sort(function(a,b){var ad=dt(a.week.end)||dt(a.week.start),bd=dt(b.week.end)||dt(b.week.start);return (ad?ad.getTime():0)-(bd?bd.getTime():0)});
    return out
  }
  function currentQuality(rep,ws,t){
    var keys={};safeArray(ws).forEach(function(w){keys[w.key]=1});
    var arts=safeArray(S&&S.artErrors).filter(function(a){
      if(!a||a.rep!==rep)return false;
      if(a.weekKey)return !!keys[a.weekKey];
      return false
    });
    var credits=safeArray(S&&S.cms).filter(function(c){
      if(!c||c.rep!==rep)return false;
      var fault=String(c.fault||'').toLowerCase();
      if(fault.indexOf('rep')<0)return false;
      if(c.weekKey)return !!keys[c.weekKey];
      return false
    });
    var creditValue=credits.reduce(function(s,c){return s+n(c.amount)},0);
    var artRate=t.orders?arts.length/t.orders*100:0;
    var creditRate=t.revenue?creditValue/t.revenue*100:0;
    var score=100-Math.min(50,artRate*12)-Math.min(35,creditRate*20);
    return {arts:arts,credits:credits,creditValue:creditValue,artRate:artRate,creditRate:creditRate,score:clamp(score,0,100)}
  }
  function currentOrders(rep,ws){
    var keySet={};safeArray(ws).forEach(function(w){keySet[w.key]=1});
    var all=safeArray(S&&S.orders).filter(function(o){
      return o&&o.rep===rep&&o.kind==='order'&&((o.effWeekKey&&keySet[o.effWeekKey])||(o.weekKey&&keySet[o.weekKey]))
    });
    var rev=all.reduce(function(s,o){return s+n(o.total)},0),newOrders=all.filter(function(o){return !!o.newCustomer}),newRev=newOrders.reduce(function(s,o){return s+n(o.total)},0);
    return {rows:all,revenue:rev,newOrders:newOrders,newRevenue:newRev,newShare:rev?newRev/rev*100:0}
  }
  function teamBenchmarks(rep,ws){
    var reps=safeArray(typeof activeReps==='function'?activeReps():(S&&S.reps)).map(function(r){return typeof r==='string'?{name:r}:r}).filter(function(r){return r&&r.name});
    var vals=reps.map(function(r){var t=totalsFor(r.name,ws);return {name:r.name,orders:t.orders,aov:t.aov,revenue:t.revenue}});
    var active=vals.filter(function(x){return x.revenue||x.orders});
    var count=active.length||1;
    return {
      avgOrders:active.reduce(function(s,x){return s+x.orders},0)/count,
      avgAov:active.reduce(function(s,x){return s+x.aov},0)/count
    }
  }
  function longestPaceStreak(rep,catalog){
    var best=0,cur=0;
    catalog.forEach(function(x){
      var d=(S&&S.data&&S.data[rep+'|'+x.week.key])||{},g=goalFor(rep,x.year,x.q),wkGoal=g.rev&&weeks(x.year,x.q).length?g.rev/weeks(x.year,x.q).length:0;
      if(n(d.revenue)>0&&wkGoal>0&&n(d.revenue)>=wkGoal){cur++;best=Math.max(best,cur)}
      else if(n(d.revenue)||n(d.orders)||n(d.calls)){cur=0}
    });
    return best
  }
  function profileReviews(rep){
    var R=S&&S.reviews||{},rf=R.repFix||{},dec=R.decisions||{};
    return safeArray(R.rows).filter(function(r){
      if(!r)return false;
      var id=r.id!=null?r.id:'',assigned=rf[id]!==undefined?rf[id]:r.rep;
      if(dec[id]==='removed')return false;
      return assigned===rep
    }).sort(function(a,b){return (dt(b.ts)?dt(b.ts).getTime():0)-(dt(a.ts)?dt(a.ts).getTime():0)})
  }
  function buildRecords(rep,quarters,catalog){
    var bestWeek=null,highCalls=null,months={},largestOrder=null;
    catalog.forEach(function(x){
      var d=(S&&S.data&&S.data[rep+'|'+x.week.key])||{};
      if(n(d.revenue)>0&&(!bestWeek||n(d.revenue)>bestWeek.value))bestWeek={value:n(d.revenue),x:x};
      if(n(d.calls)>0&&(!highCalls||n(d.calls)>highCalls.value))highCalls={value:n(d.calls),x:x};
      if(n(d.revenue)||n(d.orders)||n(d.calls)){
        var end=dt(x.week.end)||dt(x.week.start),mk=end?(end.getFullYear()+'-'+String(end.getMonth()+1).padStart(2,'0')):(x.year+'-'+x.q);
        var m=months[mk]||(months[mk]={key:mk,label:end?end.toLocaleString('en-US',{month:'long',year:'numeric'}):(x.q+' '+x.year),revenue:0,orders:0,calls:0});
        m.revenue+=n(d.revenue);m.orders+=n(d.orders);m.calls+=n(d.calls)
      }
    });
    var bestMonth=Object.keys(months).map(function(k){return months[k]}).sort(function(a,b){return b.revenue-a.revenue})[0]||null;
    var bestQuarter=quarters.slice().sort(function(a,b){return b.totals.revenue-a.totals.revenue})[0]||null;
    safeArray(S&&S.orders).forEach(function(o){
      if(!o||o.rep!==rep||o.kind!=='order')return;
      if(!largestOrder||n(o.total)>n(largestOrder.total))largestOrder=o
    });
    var bestRank=quarters.filter(function(q){return q.rank}).sort(function(a,b){return a.rank-b.rank||b.totals.revenue-a.totals.revenue})[0]||null;
    return {
      bestWeek:bestWeek,bestMonth:bestMonth,bestQuarter:bestQuarter,largestOrder:largestOrder,
      highCalls:highCalls,bestRank:bestRank,paceStreak:longestPaceStreak(rep,catalog)
    }
  }
  function buildDNA(rep,ctx,current,quality,orders,bench){
    var selectedWeeks=safeArray(ctx&&ctx.through),entered=Math.max(1,current.entered),goal=n(ctx&&ctx.goal)||goalFor(rep,Number(getYr()),getQ()).rev;
    var totalWeeks=safeArray(ctx&&ctx.wks).length||13,expected=goal?goal*(selectedWeeks.length/totalWeeks):0;
    var revScore=expected?clamp(current.revenue/expected*100,0,100):null;
    var callTarget=125*entered,callScore=callTarget?clamp(current.calls/callTarget*100,0,100):null;
    var coverageScore=current.setSize>0?clamp(current.acctsCalled/current.setSize*100,0,100):null;
    var orderScore=bench.avgOrders>0?clamp(current.orders/bench.avgOrders*100,0,100):null;
    var aovScore=bench.avgAov>0?clamp(current.aov/bench.avgAov*100,0,100):null;
    var wkGoal=goal&&totalWeeks?goal/totalWeeks:0,enteredRows=current.weeks.filter(function(x){return x.has}),atPace=enteredRows.filter(function(x){return wkGoal>0&&n(x.data.revenue)>=wkGoal}).length;
    var consistency=enteredRows.length?clamp(atPace/enteredRows.length*100,0,100):null;
    var newScore=orders.rows.length?clamp(orders.newShare/25*100,0,100):null;
    var rows=[
      {id:'revenue',name:'Revenue pace',score:revScore,detail:expected?money(current.revenue)+' vs '+money(expected)+' pace':'Quarter goal unavailable'},
      {id:'calls',name:'Call activity',score:callScore,detail:callTarget?(current.calls+' of '+callTarget+' calls'):'No entered weekly activity'},
      {id:'coverage',name:'Customer coverage',score:coverageScore,detail:current.setSize?(current.acctsCalled+' of '+current.setSize+' planned contacts'):'Coverage source unavailable'},
      {id:'orders',name:'Order volume',score:orderScore,detail:bench.avgOrders?(current.orders+' vs '+Math.round(bench.avgOrders)+' team avg'):'Team benchmark unavailable'},
      {id:'aov',name:'Average order value',score:aovScore,detail:bench.avgAov?(money(current.aov)+' vs '+money(bench.avgAov)+' team avg'):'Team benchmark unavailable'},
      {id:'consistency',name:'Consistency',score:consistency,detail:enteredRows.length?(atPace+' of '+enteredRows.length+' entered weeks at pace'):'No entered weeks'},
      {id:'quality',name:'Quality',score:quality.score,detail:quality.arts.length+' art errors · '+quality.credits.length+' rep-fault credits'},
      {id:'newbiz',name:'New business',score:newScore,detail:orders.rows.length?(Math.round(orders.newShare)+'% of primary-order revenue'):'Order source unavailable'}
    ];
    return rows
  }
  function archetype(dna){
    var avail=dna.filter(function(x){return x.score!=null}).slice().sort(function(a,b){return b.score-a.score});
    if(!avail.length)return {title:'Performance identity is still forming',copy:'More entered performance data will build a clearer long-term profile.'};
    var top=avail[0],second=avail[1]||top,map={
      revenue:'Revenue Builder',calls:'Activity Engine',coverage:'Relationship Builder',orders:'Volume Producer',
      aov:'High-Value Closer',consistency:'Consistent Producer',quality:'Quality Operator',newbiz:'New Business Builder'
    };
    var title=map[top.id]||'Balanced Producer';
    if(top.score>=80&&second&&second.score>=80&&Math.abs(top.score-second.score)<8)title='Balanced '+title;
    return {title:title,copy:'Your strongest current profile signals are '+top.name.toLowerCase()+' and '+second.name.toLowerCase()+'. This identity updates as your quarter and career history grow.'}
  }
  function strengths(dna){
    var avail=dna.filter(function(x){return x.score!=null}).slice().sort(function(a,b){return b.score-a.score});
    return {
      strengths:avail.slice(0,3),
      growth:avail.slice().sort(function(a,b){return a.score-b.score}).slice(0,3)
    }
  }
  function achievements(rep,records,quarters,current,quality,orders,reviews){
    var goalHit=quarters.some(function(q){return q.goal>0&&q.totals.revenue>=q.goal});
    var top3=quarters.some(function(q){return q.rank&&q.rank<=3});
    var number1=quarters.some(function(q){return q.rank===1});
    var clean=current.orders>=10&&quality.arts.length===0&&quality.credits.length===0;
    var fiveStar=reviews.some(function(r){return n(r.stars)>=5});
    var list=[
      {icon:'🌱',name:'On the Board',earned:!!records.bestWeek,copy:'Record at least one official sales week.'},
      {icon:'🚀',name:'$25K Week',earned:!!(records.bestWeek&&records.bestWeek.value>=25000),copy:'Produce $25,000 or more in one official week.'},
      {icon:'💎',name:'$50K Week',earned:!!(records.bestWeek&&records.bestWeek.value>=50000),copy:'Produce $50,000 or more in one official week.'},
      {icon:'🏆',name:'$100K Week',earned:!!(records.bestWeek&&records.bestWeek.value>=100000),copy:'Produce a six-figure official sales week.'},
      {icon:'🥉',name:'Top 3 Finish',earned:top3,copy:'Finish a quarter ranked in the top three.'},
      {icon:'👑',name:'#1 Finish',earned:number1,copy:'Finish a quarter ranked first in revenue.'},
      {icon:'📞',name:'125 Call Week',earned:!!(records.highCalls&&records.highCalls.value>=125),copy:'Reach the 125-call weekly activity standard.'},
      {icon:'🔥',name:'150 Call Week',earned:!!(records.highCalls&&records.highCalls.value>=150),copy:'Record 150 or more calls in one week.'},
      {icon:'📦',name:'$10K Order',earned:!!(records.largestOrder&&n(records.largestOrder.total)>=10000),copy:'Close a primary order worth at least $10,000.'},
      {icon:'🏁',name:'Quarter Goal Crusher',earned:goalHit,copy:'Meet or exceed a full quarterly revenue goal.'},
      {icon:'✨',name:'Clean Operator',earned:clean,copy:'Record 10+ quarter orders with no linked art errors or rep-fault credits.'},
      {icon:'🌐',name:'New Business Builder',earned:!!(orders.rows.length&&orders.newShare>=25),copy:'Generate at least 25% of primary-order revenue from new customers.'},
      {icon:'🧱',name:'Consistency Streak',earned:records.paceStreak>=4,copy:'Stack four consecutive official weeks at or above quarter pace.'},
      {icon:'⭐',name:'Customer Voice',earned:fiveStar,copy:'Receive a recorded five-star customer review.'}
    ];
    return list
  }
  function timeline(rep,profile,records,quarters,reviews){
    var items=[];
    if(profile&&profile.hireDate){
      items.push({date:profile.hireDate,type:'Career',title:'Joined Triple Crown Products',copy:'The starting point of the recorded TCP career timeline.'})
    }
    if(records.bestWeek){
      items.push({date:iso(records.bestWeek.x.week.end||records.bestWeek.x.week.start),type:'Personal record',title:'Best official sales week · '+money(records.bestWeek.value),copy:records.bestWeek.x.q+' '+records.bestWeek.x.year+' · '+(records.bestWeek.x.week.label||records.bestWeek.x.week.key)})
    }
    if(records.largestOrder){
      items.push({date:records.largestOrder.orderDate||'',type:'Order milestone',title:'Largest recorded primary order · '+money(records.largestOrder.total),copy:(records.largestOrder.customer||'Customer')+' · '+(records.largestOrder.orderNum||records.largestOrder.base||'Order')})
    }
    quarters.forEach(function(q){
      var last=q.weeks.filter(function(w){var d=(S&&S.data&&S.data[rep+'|'+w.key])||{};return n(d.revenue)||n(d.orders)||n(d.calls)}).slice(-1)[0];
      var date=last?iso(last.end||last.start):'';
      if(q.goal>0&&q.totals.revenue>=q.goal)items.push({date:date,type:'Achievement',title:'Quarter goal achieved · '+q.label,copy:money(q.totals.revenue)+' against a '+money(q.goal)+' revenue goal.'});
      if(q.rank&&q.rank<=3)items.push({date:date,type:'Recognition',title:'Top '+q.rank+' quarter finish · '+q.label,copy:'Finished #'+q.rank+' of '+q.rankTotal+' reps by recorded quarter revenue.'})
    });
    reviews.slice(0,4).forEach(function(r){
      items.push({date:r.ts||'',type:'Customer recognition',title:(n(r.stars)?(n(r.stars)+'-star review'):'Customer review'),copy:String(r.msg||'').slice(0,220)})
    });
    return items.filter(function(x){return x.date}).sort(function(a,b){return (dt(b.date)?dt(b.date).getTime():0)-(dt(a.date)?dt(a.date).getTime():0)}).slice(0,14)
  }
  function buildProfile(){
    var rep=_rp2.rep,r=repRecord(),profile=r.profile||{},ten=tenure(profile),ctx=currentContext(),current=totalsFor(rep,ctx.through||[]),rank=rankFor(rep,ctx.through||[]);
    var quality=currentQuality(rep,ctx.through||[],current),orders=currentOrders(rep,ctx.through||[]),bench=teamBenchmarks(rep,ctx.through||[]);
    var quarters=allQuarterData(rep),catalog=weekCatalog(),records=buildRecords(rep,quarters,catalog),reviews=profileReviews(rep);
    var dna=buildDNA(rep,ctx,current,quality,orders,bench),identity=archetype(dna),reads=strengths(dna),badges=achievements(rep,records,quarters,current,quality,orders,reviews);
    var earned=badges.filter(function(b){return b.earned}).length,events=timeline(rep,profile,records,quarters,reviews),goal=n(ctx.goal)||goalFor(rep,Number(getYr()),getQ()).rev;
    var pace=goal&&ctx.wks&&ctx.wks.length?current.revenue/(goal*((ctx.through||[]).length/ctx.wks.length))*100:null;
    return {
      rep:rep,r:r,profile:profile,role:roleName(r),tenure:ten,ctx:ctx,current:current,rank:rank,quality:quality,orders:orders,
      quarters:quarters,records:records,reviews:reviews,dna:dna,identity:identity,reads:reads,badges:badges,earned:earned,events:events,goal:goal,pace:pace
    }
  }
  function sectionHead(kick,title,note){return '<div class="rp2-pf-section-head"><div><div class="rp2-pf-section-kick">'+kick+'</div><div class="rp2-pf-section-title">'+title+'</div></div><div class="rp2-pf-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-pf-kpi"><div class="rp2-pf-kpi-label">'+esc(label)+'</div><div class="rp2-pf-kpi-value">'+value+'</div><div class="rp2-pf-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-pf-tabs-wrap"><div class="rp2-pf-tabs">'+PF_TABS.map(function(t){return '<button class="rp2-pf-tab '+(t.id===active?'active':'')+'" onclick="_rp2ProfileSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function avatar(g){
    var initials=g.rep.split(' ').map(function(x){return x[0]||''}).join('').slice(0,2).toUpperCase();
    return '<div class="rp2-pf-avatar">'+(g.profile&&g.profile.photo?('<img src="'+esc(g.profile.photo)+'" alt="'+esc(g.rep)+'">'):esc(initials))+'</div>'
  }
  function dnaRows(g){
    return '<div class="rp2-pf-dna">'+g.dna.map(function(x){
      return '<div class="rp2-pf-dna-row"><div class="rp2-pf-dna-name">'+esc(x.name)+'<small>'+esc(x.detail)+'</small></div><div class="rp2-pf-dna-bar"><span style="width:'+(x.score==null?0:Math.round(x.score))+'%"></span></div><div class="rp2-pf-dna-score '+(x.score==null?'na':'')+'">'+(x.score==null?'N/A':Math.round(x.score))+'</div></div>'
    }).join('')+'</div>'
  }
  function readList(rows,tone){
    if(!rows.length)return '<div class="rp2-pf-read"><strong>Profile still forming</strong><span>More entered performance data will create a clearer read.</span></div>';
    return '<div class="rp2-pf-read-list">'+rows.map(function(x){
      var copy=x.score>=85?'This is currently one of your strongest measurable performance signals.':x.score>=65?'This area is supporting the overall profile.':'This is the clearest measurable area with room to grow.';
      return '<div class="rp2-pf-read '+tone+'"><strong>'+esc(x.name)+' · '+Math.round(x.score)+'/100</strong><span>'+esc(copy+' '+x.detail)+'.</span></div>'
    }).join('')+'</div>'
  }
  function quarterCards(g){
    var rows=g.quarters.slice().sort(function(a,b){return b.year-a.year||parseInt(b.q.slice(1),10)-parseInt(a.q.slice(1),10)}).slice(0,4);
    if(!rows.length)return '<div class="rp2-pf-empty"><strong>No quarter history yet</strong><span>Quarter cards appear as official weekly data is entered.</span></div>';
    return '<div class="rp2-pf-quarter-strip">'+rows.map(function(q){
      return '<div class="rp2-pf-quarter"><div class="rp2-pf-quarter-label">'+esc(q.label)+'</div><div class="rp2-pf-quarter-value">'+money(q.totals.revenue)+'</div><div class="rp2-pf-quarter-sub">'+q.totals.orders+' orders · '+q.totals.calls+' calls · '+(q.rank?('#'+q.rank+' rank'):'rank unavailable')+'</div></div>'
    }).join('')+'</div>'
  }
  function quickLinks(){
    var links=[
      {icon:'↗',title:'Review my forecast',copy:'See where current pace is heading.',page:'forecast'},
      {icon:'🏢',title:'Work customer opportunities',copy:'Open the account command center.',page:'customers'},
      {icon:'📦',title:'Review my biggest orders',copy:'Study order patterns and risks.',page:'orders'},
      {icon:'📄',title:'Open my latest report',copy:'Read the unified performance story.',page:'reports'},
      {icon:'✦',title:'Ask AI Coach',copy:'Use your own performance context.',page:'ai'}
    ];
    return '<div class="rp2-pf-quick">'+links.map(function(x){return '<button class="rp2-pf-quick-btn" onclick="_rp2Go(\''+x.page+'\')"><div class="rp2-pf-quick-icon">'+x.icon+'</div><div class="rp2-pf-quick-title">'+x.title+'</div><div class="rp2-pf-quick-copy">'+x.copy+'</div></button>'}).join('')+'</div>'
  }
  function recordCard(icon,label,value,sub){return '<div class="rp2-pf-record"><div class="rp2-pf-record-icon">'+icon+'</div><div class="rp2-pf-record-label">'+label+'</div><div class="rp2-pf-record-value">'+value+'</div><div class="rp2-pf-record-sub">'+sub+'</div></div>'}
  function recordsView(g){
    var r=g.records;
    var cards=[
      recordCard('🔥','Best sales week',r.bestWeek?money(r.bestWeek.value):'—',r.bestWeek?(r.bestWeek.x.q+' '+r.bestWeek.x.year+' · '+esc(r.bestWeek.x.week.label||r.bestWeek.x.week.key)):'No official week yet'),
      recordCard('📅','Best sales month',r.bestMonth?money(r.bestMonth.revenue):'—',r.bestMonth?(esc(r.bestMonth.label)+' · '+r.bestMonth.orders+' orders'):'No month record yet'),
      recordCard('🏆','Best quarter',r.bestQuarter?money(r.bestQuarter.totals.revenue):'—',r.bestQuarter?(esc(r.bestQuarter.label)+' · '+(r.bestQuarter.rank?('#'+r.bestQuarter.rank+' rank'):'rank unavailable')):'No quarter record yet'),
      recordCard('📦','Largest recorded order',r.largestOrder?money(r.largestOrder.total):'—',r.largestOrder?(esc(r.largestOrder.customer||'Customer')+' · '+esc(r.largestOrder.orderNum||r.largestOrder.base||'Order')):'No primary order history'),
      recordCard('📞','Highest call week',r.highCalls?String(r.highCalls.value):'—',r.highCalls?(r.highCalls.x.q+' '+r.highCalls.x.year+' · '+esc(r.highCalls.x.week.label||r.highCalls.x.week.key)):'No official call week yet'),
      recordCard('🥇','Best quarter rank',r.bestRank?('#'+r.bestRank.rank):'—',r.bestRank?(esc(r.bestRank.label)+' · of '+r.bestRank.rankTotal+' reps'):'No completed rank history'),
      recordCard('🧱','Longest pace streak',String(r.paceStreak),r.paceStreak?'Consecutive official weeks at or above quarter pace':'No pace streak recorded yet')
    ];
    var topQ=g.quarters.slice().sort(function(a,b){return b.totals.revenue-a.totals.revenue}).slice(0,6);
    return sectionHead('Personal records','Your high-water marks','Records are built from official weekly performance and imported primary-order history currently stored in Sales Tracker.')
      +'<div class="rp2-pf-record-grid">'+cards.join('')+'</div>'
      +sectionHead('Quarter leaderboard','Your strongest recorded quarters','This ranks your own quarters against each other—not against other reps.')
      +(topQ.length?'<div class="rp2-pf-panel"><div class="rp2-pf-quarter-strip">'+topQ.map(function(q){return '<div class="rp2-pf-quarter"><div class="rp2-pf-quarter-label">'+esc(q.label)+'</div><div class="rp2-pf-quarter-value">'+money(q.totals.revenue)+'</div><div class="rp2-pf-quarter-sub">'+q.totals.orders+' orders · '+q.totals.calls+' calls · '+(q.goal?Math.round(q.totals.revenue/q.goal*100)+'% of goal':'goal unavailable')+'</div></div>'}).join('')+'</div></div>':'<div class="rp2-pf-empty"><strong>No quarter records yet</strong><span>Official weekly data will populate this section.</span></div>')
  }
  function achievementsView(g){
    var latestReviews=g.reviews.slice(0,3);
    return '<div class="rp2-pf-achievement-summary"><div><div class="rp2-pf-achievement-big">'+g.earned+'/'+g.badges.length+'<small>Achievements earned</small></div></div><div class="rp2-pf-achievement-copy">Achievements are based on transparent thresholds in your own performance history. Locked badges stay visible so you can see what the next milestone requires.</div></div>'
      +sectionHead('Badge vault','Your earned and upcoming milestones','Nothing here is manually awarded behind the scenes—the criteria are shown on every badge.')
      +'<div class="rp2-pf-badge-grid">'+g.badges.map(function(b){return '<div class="rp2-pf-badge '+(b.earned?'earned':'locked')+'"><div class="rp2-pf-badge-icon">'+b.icon+'</div><div class="rp2-pf-badge-state">'+(b.earned?'Earned':'Locked')+'</div><div class="rp2-pf-badge-name">'+esc(b.name)+'</div><div class="rp2-pf-badge-copy">'+esc(b.copy)+'</div></div>'}).join('')+'</div>'
      +sectionHead('Customer recognition','Recent customer voice','Customer reviews assigned to your profile are part of the recognition story.')
      +(latestReviews.length?'<div class="rp2-pf-review-grid">'+latestReviews.map(function(r){var stars=n(r.stars);return '<div class="rp2-pf-review"><div class="rp2-pf-review-stars">'+(stars?'★'.repeat(Math.min(5,Math.max(1,stars))):'Customer review')+'</div><div class="rp2-pf-review-msg">'+esc(String(r.msg||'').slice(0,320))+'</div><div class="rp2-pf-review-meta">'+esc(r.type||'Review')+' · '+displayDate(r.ts,true)+'</div></div>'}).join('')+'</div>':'<div class="rp2-pf-empty"><strong>No customer reviews tied to this profile yet</strong><span>Assigned customer reviews will appear here automatically.</span></div>')
  }
  function journeyView(g){
    return sectionHead('Career trajectory','Quarter by quarter','The chart combines recorded quarter revenue with your quarter rank. Only quarters with official weekly data are shown.')
      +'<div class="rp2-pf-panel"><div class="rp2-pf-chart"><canvas id="rp2-pf-career-chart"></canvas></div>'+quarterCards(g)+'</div>'
      +sectionHead('Milestone timeline','The story behind the numbers','Performance records, quarter achievements, order milestones, and customer recognition are merged into a private personal timeline.')
      +(g.events.length?'<div class="rp2-pf-panel"><div class="rp2-pf-timeline">'+g.events.map(function(e){return '<div class="rp2-pf-event"><div class="rp2-pf-event-date">'+displayDate(e.date,true)+'</div><div class="rp2-pf-event-card"><div class="rp2-pf-event-type">'+esc(e.type)+'</div><div class="rp2-pf-event-title">'+esc(e.title)+'</div><div class="rp2-pf-event-copy">'+esc(e.copy)+'</div></div></div>'}).join('')+'</div></div>':'<div class="rp2-pf-empty"><strong>Your timeline is still forming</strong><span>Milestones appear as performance, orders, and customer recognition accumulate.</span></div>')
      +'<div class="rp2-pf-privacy"><strong>Privacy:</strong> Manager Journal coaching notes are marked private in the current tracker and are intentionally not displayed in the Rep Portal. This timeline uses performance milestones and customer recognition only.</div>'
  }
  function overviewView(g){
    return sectionHead('Performance DNA','What kind of salesperson are you?','Eight visible dimensions translate current quarter behavior into a 0–100 profile. N/A means the underlying source is not available—not a zero score.')
      +'<div class="rp2-pf-overview-grid"><div class="rp2-pf-panel"><div class="rp2-pf-panel-title">Your current performance fingerprint</div><div class="rp2-pf-panel-sub">Revenue pace, activity, coverage, order behavior, consistency, quality, and new-business mix.</div>'+dnaRows(g)+'</div>'
      +'<div class="rp2-pf-panel"><div class="rp2-pf-panel-title">What stands out</div><div class="rp2-pf-panel-sub">The highest and lowest available dimensions become the clearest coaching signals.</div><div style="margin-top:14px;color:#FA873D;font-size:8px;font-weight:950;letter-spacing:1px;text-transform:uppercase;">Strengths</div>'+readList(g.reads.strengths,'good')+'<div style="margin-top:16px;color:#FA873D;font-size:8px;font-weight:950;letter-spacing:1px;text-transform:uppercase;">Growth areas</div>'+readList(g.reads.growth,'warn')+'</div></div>'
      +sectionHead('Career trajectory','Your longer-term direction','Quarter history makes the profile bigger than a single good or bad week.')
      +'<div class="rp2-pf-panel"><div class="rp2-pf-chart"><canvas id="rp2-pf-career-chart"></canvas></div>'+quarterCards(g)+'</div>'
      +sectionHead('Quick actions','Use the profile to move into action','Jump directly from your long-term profile into the tools that can change the next result.')
      +quickLinks()
  }

  window._rp2ProfileSetTab=function(id){
    window._rp2ProfileTab=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ProfileV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2ProfileDraw()}catch(e){}},0)
  };

  window._rp2ProfileV2=function(){
    try{
      var g=buildProfile(),tab=window._rp2ProfileTab,paceLabel=g.pace==null?'Pace unavailable':Math.round(g.pace)+'% of cumulative pace';
      var hero='<div class="rp2-pf-hero"><div class="rp2-pf-hero-grid"><div class="rp2-pf-identity">'+avatar(g)+'<div><div class="rp2-pf-kick">My Profile 2.0 · BUILD v496</div><div class="rp2-pf-name">'+esc(g.rep)+'</div><div class="rp2-pf-role">'+esc(g.role)+' · Personal performance identity</div><div class="rp2-pf-archetype">'+esc(g.identity.title)+'</div><div class="rp2-pf-copy">'+esc(g.identity.copy)+'</div><div class="rp2-pf-pills"><span class="rp2-pf-pill">'+esc(getQ()+' '+getYr())+'</span><span class="rp2-pf-pill">'+esc(g.tenure.label)+'</span><span class="rp2-pf-pill '+(g.pace!=null&&g.pace>=100?'good':'warn')+'">'+esc(paceLabel)+'</span></div></div></div>'
        +'<div class="rp2-pf-brief"><div><div class="rp2-pf-brief-label">Current quarter identity</div><div class="rp2-pf-brief-value">'+(g.rank.rank?('#'+g.rank.rank):'—')+'</div><div class="rp2-pf-brief-title">'+(g.rank.rank?('Current revenue rank of '+g.rank.total):'Rank is still forming')+'</div><div class="rp2-pf-brief-copy">'+money(g.current.revenue)+' official QTD revenue · '+g.current.orders+' orders · '+g.current.calls+' calls. Your profile grows from the complete record, not one isolated week.</div></div><div class="rp2-pf-brief-foot"><span>Achievements <strong>'+g.earned+'/'+g.badges.length+'</strong></span><span>Recorded quarters <strong>'+g.quarters.length+'</strong></span></div></div>'
        +'</div></div>';

      var kpis='<div class="rp2-pf-kpis">'
        +kpi('Official QTD revenue',money(g.current.revenue),g.goal?(Math.round(g.current.revenue/g.goal*100)+'% of quarter goal'):'Quarter goal unavailable')
        +kpi('Current rank',g.rank.rank?('#'+g.rank.rank):'—',g.rank.rank?('of '+g.rank.total+' active reps'):'Rank unavailable')
        +kpi('Average order value',g.current.orders?money(g.current.aov):'—',g.current.orders+' official weekly orders')
        +kpi('Best sales week',g.records.bestWeek?money(g.records.bestWeek.value):'—',g.records.bestWeek?esc(g.records.bestWeek.x.q+' '+g.records.bestWeek.x.year):'No official week yet')
        +kpi('Largest recorded order',g.records.largestOrder?money(g.records.largestOrder.total):'—',g.records.largestOrder?esc(g.records.largestOrder.customer||'Customer'):'No primary order history')
        +kpi('Longest pace streak',String(g.records.paceStreak),g.records.paceStreak?'consecutive official weeks':'No streak recorded yet')
        +'</div>';

      var content=tab==='records'?recordsView(g):tab==='achievements'?achievementsView(g):tab==='journey'?journeyView(g):overviewView(g);
      return '<div class="rp2-pf-shell">'+hero+kpis+tabBar(tab)+content+'</div>'
    }catch(e){
      console.error('[My Profile 2.0 render error]',e);
      return '<div class="rp2-pf-shell"><div class="rp2-pf-hero"><div class="rp2-pf-kick">My Profile 2.0 · RECOVERY MODE</div><div class="rp2-pf-name">The profile hit a data compatibility issue</div><div class="rp2-pf-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2ProfileDraw=function(){
    if(typeof Chart!=='function')return;
    var canvas=document.getElementById('rp2-pf-career-chart');if(!canvas)return;
    var g=buildProfile(),rows=g.quarters.slice().sort(function(a,b){return a.year-b.year||parseInt(a.q.slice(1),10)-parseInt(b.q.slice(1),10)});
    if(_rp2.profileChart){try{_rp2.profileChart.destroy()}catch(e){}}
    if(!rows.length)return;
    _rp2.profileChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:rows.map(function(x){return x.label}),datasets:[
        {type:'bar',label:'Quarter revenue',data:rows.map(function(x){return x.totals.revenue}),backgroundColor:'rgba(250,135,61,.72)',borderRadius:6,yAxisID:'y'},
        {type:'line',label:'Quarter rank',data:rows.map(function(x){return x.rank||null}),borderColor:'#4ed6a3',pointRadius:4,tension:.25,yAxisID:'rank'}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label==='Quarter rank'?(' Rank #'+ctx.parsed.y):(' '+ctx.dataset.label+': '+money(ctx.parsed.y))}}}},
        scales:{
          x:{ticks:{color:'#8b95a7',font:{size:10}},grid:{display:false}},
          y:{ticks:{color:'#8b95a7',font:{size:10},callback:function(v){return '$'+Math.round(v/1000)+'k'}},grid:{color:'rgba(255,255,255,.05)'}},
          rank:{position:'right',reverse:true,min:1,suggestedMax:Math.max(5,g.rank.total||15),ticks:{color:'#8b95a7',stepSize:1,callback:function(v){return '#'+v}},grid:{display:false}}
        }
      }
    })
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='profile')setTimeout(function(){try{_rp2Go('profile')}catch(e){}},0)
  }catch(e){}
})();
