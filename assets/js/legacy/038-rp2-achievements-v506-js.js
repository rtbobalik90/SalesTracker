
(function(){
  var STORE='tcp_rp_achievement_center_v506';
  var ACTION_STORE='tcp_rp_action_center_v504';
  var GOAL_STORE='tcp_rp_goals_v505';
  var TABS=[
    {id:'room',label:'Trophy Room',icon:'🏆'},
    {id:'records',label:'Personal Records',icon:'📈'},
    {id:'streaks',label:'Streaks & Quality Wins',icon:'🔥'},
    {id:'recognition',label:'Customer Recognition',icon:'⭐'},
    {id:'vault',label:'Milestone Vault',icon:'🔒'},
    {id:'timeline',label:'Legacy Timeline',icon:'◷'}
  ];
  var THEMES=[
    {id:'communication',name:'Communication',words:['communication','communicated','communicate','kept me informed','updated me','updated us','explained']},
    {id:'responsiveness',name:'Responsiveness',words:['responsive','responded','replied','prompt','quick to respond','got back to me']},
    {id:'knowledge',name:'Product Knowledge',words:['knowledgeable','knowledge','expertise','recommendation','suggestion']},
    {id:'speed',name:'Speed & Turnaround',words:['quick','quickly','fast','turnaround','timely','on time','deadline']},
    {id:'problem',name:'Problem Solving',words:['problem','issue','solution','solve','solved','resolved','fixed','made it right']},
    {id:'friendliness',name:'Friendliness & Helpfulness',words:['friendly','kind','pleasant','helpful','patient','wonderful']},
    {id:'followthrough',name:'Follow-Through',words:['follow through','follow-through','followed up','follow up','reliable','stayed on top']},
    {id:'quality',name:'Quality',words:['quality','looks great','looked great','perfect','beautiful','embroidery','print quality']},
    {id:'ease',name:'Ease of Working Together',words:['easy to work with','easy process','seamless','smooth','painless']}
  ];
  window._rp2AchievementsTab=window._rp2AchievementsTab||'room';
  window._rp2AchievementOpenId=window._rp2AchievementOpenId||null;

  function n(v){return Number(v)||0}
  function clamp(v,min,max){return Math.max(min,Math.min(max,n(v)))}
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
  function now(){
    var d=window._rp2AchievementsNow?new Date(window._rp2AchievementsNow):new Date();
    d.setHours(12,0,0,0);return d
  }
  function dval(v){
    if(v==null||v==='')return null;
    try{
      var s=String(v).trim(),d;
      if(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)){
        var p=s.split('/'),y=Number(p[2]);if(y<100)y+=2000;d=new Date(y,Number(p[0])-1,Number(p[1]),12)
      }else d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);
      if(!isNaN(d.getTime())){d.setHours(12,0,0,0);return d}
    }catch(e){}
    return null
  }
  function iso(v){
    var d=dval(v);return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')):''
  }
  function fmtDate(v){
    var d=dval(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):String(v||'Current snapshot')
  }
  function diffDays(a,b){
    var x=dval(a),y=dval(b);if(!x||!y)return null;return Math.round((y-x)/86400000)
  }
  function loadStore(){
    try{
      var s=JSON.parse(localStorage.getItem(STORE)||'null');
      if(s&&s.version===1&&s.reps)return s
    }catch(e){}
    return {version:1,reps:{}}
  }
  function bucket(rep){
    var s=loadStore();s.reps[rep]=s.reps[rep]||{pinned:{},opened:{}};return {store:s,data:s.reps[rep]}
  }
  function writeBucket(rep,b){b.store.reps[rep]=b.data;try{localStorage.setItem(STORE,JSON.stringify(b.store))}catch(e){}}
  function officialGoal(rep,year,q){
    try{return n(S&&S.goals&&S.goals[rep]&&S.goals[rep][String(year)]&&S.goals[rep][String(year)][q]&&S.goals[rep][String(year)][q].rev)}catch(e){return 0}
  }
  function selectedContext(){
    var c=null;try{c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null}catch(e){}
    var year=Number(getYr()),q=getQ(),wks=[];
    try{wks=safeArray(c&&c.wks&&c.wks.length?c.wks:gwq(year,q))}catch(e){wks=[]}
    var selected=null;try{selected=c&&c.selected?c.selected:(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null)}catch(e){}
    if(!selected&&wks.length)selected=wks[wks.length-1];
    var idx=selected?wks.findIndex(function(w){return w&&w.key===selected.key}):-1;if(idx<0)idx=Math.max(0,wks.length-1);
    var weekly=wks.map(function(w){
      var d=(S&&S.data&&S.data[_rp2.rep+'|'+w.key])||{};
      return {key:w.key,label:w.label||w.key,start:dval(w.start),end:dval(w.end),year:year,q:q,revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls),entered:!!(n(d.revenue)||n(d.orders)||n(d.calls))}
    });
    var through=weekly.slice(0,idx+1),sw=weekly[idx]||{key:'',label:'Selected week',revenue:0,orders:0,calls:0},goal=0;
    try{goal=n(c&&c.goal!=null?c.goal:_rp2Goal(_rp2.rep))}catch(e){goal=officialGoal(_rp2.rep,year,q)}
    return {
      year:year,q:q,wks:wks,weekly:weekly,selected:selected,selectedIndex:idx,selectedWeek:sw,through:through,goal:goal,
      qtd:{revenue:through.reduce(function(s,w){return s+w.revenue},0),orders:through.reduce(function(s,w){return s+w.orders},0),calls:through.reduce(function(s,w){return s+w.calls},0)}
    }
  }
  function allWeeks(){
    var rep=_rp2.rep,current=Number(getYr()),rows=[],seen={};
    for(var year=2020;year<=current;year++){
      ['Q1','Q2','Q3','Q4'].forEach(function(q){
        var ws=[];try{ws=safeArray(gwq(year,q))}catch(e){}
        ws.forEach(function(w){
          var d=(S&&S.data&&S.data[rep+'|'+w.key])||{},entered=!!(n(d.revenue)||n(d.orders)||n(d.calls));
          if(!entered)return;
          seen[w.key]=1;rows.push({key:w.key,label:w.label||w.key,start:dval(w.start),end:dval(w.end),year:year,q:q,revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls),entered:true})
        })
      })
    }
    try{
      Object.keys(S&&S.data||{}).forEach(function(k){
        var prefix=rep+'|';if(k.indexOf(prefix)!==0)return;
        var wk=k.slice(prefix.length);if(seen[wk])return;
        var d=S.data[k]||{},parts=wk.split('_'),year=n(parts[0]),q=parts[1]||'';
        if(!(n(d.revenue)||n(d.orders)||n(d.calls)))return;
        rows.push({key:wk,label:wk,start:null,end:null,year:year,q:q,revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls),entered:true})
      })
    }catch(e){}
    rows.sort(function(a,b){
      var ad=a.end?a.end.getTime():a.start?a.start.getTime():a.year*100+(Number(String(a.q).replace('Q',''))||0);
      var bd=b.end?b.end.getTime():b.start?b.start.getTime():b.year*100+(Number(String(b.q).replace('Q',''))||0);
      return ad-bd
    });
    return rows
  }
  function quarterHistory(weeks){
    var map={};
    weeks.forEach(function(w){
      var key=w.year+'|'+w.q,x=map[key]||(map[key]={year:w.year,q:w.q,label:w.q+' '+w.year,revenue:0,orders:0,calls:0,weeks:[],start:w.start,end:w.end,goal:officialGoal(_rp2.rep,w.year,w.q)});
      x.revenue+=w.revenue;x.orders+=w.orders;x.calls+=w.calls;x.weeks.push(w);
      if(w.start&&(!x.start||w.start<x.start))x.start=w.start;if(w.end&&(!x.end||w.end>x.end))x.end=w.end
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return a.year-b.year||(Number(a.q.slice(1))-Number(b.q.slice(1)))})
  }
  function orderDate(o){return dval(o&&(o.orderDate||o.date||o.enteredAt))}
  function orders(){
    var all=safeArray(S&&S.orders).filter(function(o){return o&&o.rep===_rp2.rep}).map(function(o){var x={};Object.keys(o).forEach(function(k){x[k]=o[k]});x._achDate=orderDate(o);return x});
    return {all:all,primary:all.filter(function(o){return o.kind==='order'}).sort(function(a,b){return (a._achDate?a._achDate.getTime():0)-(b._achDate?b._achDate.getTime():0)})}
  }
  function activeReviews(){
    try{
      if(typeof _rvEnriched==='function'&&typeof _rvActive==='function'){
        return safeArray(_rvActive(_rvEnriched())).filter(function(x){return x&&x.matched&&x.repName===_rp2.rep}).map(function(x){var r=x.raw||{};return {id:String(r.id||''),stars:n(r.stars),msg:String(r.msg||''),date:dval(x.date||r.ts),platform:x.platform||r.type||''}})
      }
    }catch(e){}
    var R=S&&S.reviews||{},fix=R.repFix||{},dec=R.decisions||{},seen={};
    return safeArray(R.rows).map(function(r){
      if(!r)return null;
      var id=String(r.id!=null?r.id:(String(r.ts||'')+'|'+String(r.msg||'').slice(0,50))),msg=String(r.msg||'').toLowerCase().replace(/\s+/g,' ').trim();
      if(dec[id]==='removed')return null;if(msg&&seen[msg]&&dec[id]!=='approved')return null;if(msg)seen[msg]=1;
      var rep=Object.prototype.hasOwnProperty.call(fix,id)?fix[id]:r.rep;if(rep!==_rp2.rep)return null;
      return {id:id,stars:n(r.stars),msg:String(r.msg||''),date:dval(r.ts),platform:r.type||''}
    }).filter(Boolean).sort(function(a,b){return (a.date?a.date.getTime():0)-(b.date?b.date.getTime():0)})
  }
  function reviewIntel(rows){
    var rated=rows.filter(function(r){return r.stars>0}),avg=rated.length?rated.reduce(function(s,r){return s+r.stars},0)/rated.length:0,map={},firstName=String(_rp2.rep||'').split(/\s+/)[0].toLowerCase();
    THEMES.forEach(function(t){map[t.id]={id:t.id,name:t.name,count:0,examples:[]}});
    rows.forEach(function(r){
      var s=r.msg.toLowerCase();
      THEMES.forEach(function(t){if(t.words.some(function(w){return s.indexOf(w)>=0})){map[t.id].count++;if(map[t.id].examples.length<3)map[t.id].examples.push(r)}})
    });
    var themes=Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return b.count-a.count});
    var positive=rows.filter(function(r){return r.stars>=4}),cur=0,longest=0,run=0;
    rows.forEach(function(r){if(r.stars>=4){run++;longest=Math.max(longest,run)}else if(r.stars>0)run=0});
    for(var i=rows.length-1;i>=0;i--){if(rows[i].stars>=4)cur++;else if(rows[i].stars>0)break}
    return {
      rows:rows,rated:rated,count:rows.length,avg:avg,five:rows.filter(function(r){return r.stars>=5}).length,
      named:rows.filter(function(r){return firstName&&r.msg.toLowerCase().indexOf(firstName)>=0}).length,
      themes:themes,topTheme:themes[0]&&themes[0].count?themes[0]:null,positive:positive,positiveCurrent:cur,positiveLongest:longest
    }
  }
  function qualityIntel(orderData,weeks){
    var art=safeArray(S&&S.artErrors).filter(function(a){return a&&a.rep===_rp2.rep}),credits=safeArray(S&&S.cms).filter(function(c){return c&&c.rep===_rp2.rep}),repFault=credits.filter(function(c){return String(c.fault||'').toLowerCase()==='rep'});
    var badSO={},badWeek={};
    art.forEach(function(a){var so=String(a.so||a.soNum||'').toLowerCase().replace(/\s+/g,'');if(so)badSO[so]=1;if(a.weekKey)badWeek[a.weekKey]=1});
    repFault.forEach(function(c){var so=String(c.soNum||c.so||'').toLowerCase().replace(/\s+/g,'');if(so)badSO[so]=1;if(c.weekKey)badWeek[c.weekKey]=1});
    var current=0,longest=0,run=0;
    orderData.primary.forEach(function(o){
      var key=String(o.orderNum||o.base||'').toLowerCase().replace(/\s+/g,'');
      if(badSO[key])run=0;else{run++;longest=Math.max(longest,run)}
    });
    for(var i=orderData.primary.length-1;i>=0;i--){
      var o=orderData.primary[i],key=String(o.orderNum||o.base||'').toLowerCase().replace(/\s+/g,'');
      if(badSO[key])break;current++
    }
    var wcur=0,wlong=0,wrun=0;
    weeks.forEach(function(w){if(badWeek[w.key])wrun=0;else{wrun++;wlong=Math.max(wlong,wrun)}});
    for(var j=weeks.length-1;j>=0;j--){if(badWeek[weeks[j].key])break;wcur++}
    return {art:art,credits:credits,repFault:repFault,currentClean:current,longestClean:longest,currentCleanWeeks:wcur,longestCleanWeeks:wlong}
  }
  function localExecution(){
    var actions=null,goals=null;
    try{actions=JSON.parse(localStorage.getItem(ACTION_STORE)||'null')}catch(e){}
    try{goals=JSON.parse(localStorage.getItem(GOAL_STORE)||'null')}catch(e){}
    var ab=actions&&actions.reps&&actions.reps[_rp2.rep]||{events:[]},gb=goals&&goals.reps&&goals.reps[_rp2.rep]||{goals:[],events:[]};
    var completions=safeArray(ab.events).filter(function(e){return e&&e.type==='complete'}).sort(function(a,b){return String(a.at).localeCompare(String(b.at))});
    var completeGoals=safeArray(gb.goals).filter(function(g){return g&&(g.status==='completed'||g.completedAt)}),days={},cur=0,longest=0,run=0,last=null;
    completions.forEach(function(e){var k=iso(e.at);if(k)days[k]=1});
    var keys=Object.keys(days).sort();
    keys.forEach(function(k){var d=dval(k);if(last&&diffDays(last,d)===1)run++;else run=1;longest=Math.max(longest,run);last=d});
    var d=now();if(!days[iso(d)])d.setDate(d.getDate()-1);while(days[iso(d)]){cur++;d.setDate(d.getDate()-1)}
    return {completions:completions,completedGoals:completeGoals,currentDays:cur,longestDays:longest,goalEvents:safeArray(gb.events)}
  }
  function customerIntel(orderData){
    var map={};
    orderData.primary.forEach(function(o){
      var name=String(o.customer||'').trim();if(!name)return;
      var key=name.toLowerCase(),x=map[key]||(map[key]={name:name,orders:[],revenue:0,first:null,last:null});
      x.orders.push(o);x.revenue+=n(o.total);
      if(o._achDate&&(!x.first||o._achDate<x.first))x.first=o._achDate;
      if(o._achDate&&(!x.last||o._achDate>x.last))x.last=o._achDate
    });
    var rows=Object.keys(map).map(function(k){var x=map[k];x.orderCount=x.orders.length;return x}).sort(function(a,b){return b.revenue-a.revenue});
    return {rows:rows,count:rows.length,repeat:rows.filter(function(x){return x.orderCount>=2}).length,top:rows[0]||null}
  }
  function recordData(weeks,quarters,orderData,customers,reviews,quality,execution){
    function maxRow(rows,fn){return rows.length?rows.slice().sort(function(a,b){return fn(b)-fn(a)})[0]:null}
    var bestRev=maxRow(weeks,function(w){return w.revenue}),bestCalls=maxRow(weeks,function(w){return w.calls}),bestOrders=maxRow(weeks,function(w){return w.orders});
    var bestAOV=maxRow(weeks.filter(function(w){return w.orders>0}),function(w){return w.revenue/w.orders});
    var bestQuarter=maxRow(quarters,function(q){return q.revenue}),bestGoal=maxRow(quarters.filter(function(q){return q.goal>0}),function(q){return q.revenue/q.goal});
    var largest=maxRow(orderData.primary,function(o){return n(o.total)});
    var totalRevenue=weeks.reduce(function(s,w){return s+w.revenue},0),totalCalls=weeks.reduce(function(s,w){return s+w.calls},0),totalOrders=weeks.reduce(function(s,w){return s+w.orders},0);
    return {
      totalRevenue:totalRevenue,totalCalls:totalCalls,totalOrders:totalOrders,
      bestRevenueWeek:bestRev,bestCallsWeek:bestCalls,bestOrdersWeek:bestOrders,bestAOVWeek:bestAOV,
      bestQuarter:bestQuarter,bestGoalQuarter:bestGoal,largestOrder:largest,
      lifetimeAOV:totalOrders?totalRevenue/totalOrders:0,customers:customers,reviews:reviews,quality:quality,execution:execution
    }
  }
  function streakFromWeeks(weeks,predicate){
    var current=0,longest=0,run=0;
    weeks.forEach(function(w,i){if(predicate(w,i)){run++;longest=Math.max(longest,run)}else run=0});
    for(var j=weeks.length-1;j>=0;j--){if(predicate(weeks[j],j))current++;else break}
    return {current:current,longest:longest}
  }
  function streaks(weeks,quality,reviews,execution){
    var calls=streakFromWeeks(weeks,function(w){return w.calls>=125});
    var entered=streakFromWeeks(weeks,function(w){return w.entered});
    var growth=streakFromWeeks(weeks,function(w,i){return i>0&&w.revenue>weeks[i-1].revenue});
    return [
      {id:'calls',icon:'📞',name:'125+ Call Weeks',current:calls.current,longest:calls.longest,unit:'weeks',copy:'Consecutive entered weeks meeting the 125-call standard.'},
      {id:'entered',icon:'📅',name:'Recorded Week Consistency',current:entered.current,longest:entered.longest,unit:'weeks',copy:'Consecutive weeks with a recorded revenue, call, or order scorecard.'},
      {id:'growth',icon:'↗',name:'Revenue Growth Streak',current:growth.current,longest:growth.longest,unit:'weeks',copy:'Consecutive weeks with higher revenue than the immediately prior recorded week.'},
      {id:'cleanorders',icon:'✓',name:'Clean-Order Streak',current:quality.currentClean,longest:quality.longestClean,unit:'orders',copy:'Primary orders since the latest matched art error or rep-fault credit memo.'},
      {id:'cleanweeks',icon:'🛡',name:'Clean-Quality Weeks',current:quality.currentCleanWeeks,longest:quality.longestCleanWeeks,unit:'weeks',copy:'Recorded weeks without a week-matched art error or rep-fault credit memo.'},
      {id:'reviews',icon:'⭐',name:'Positive Review Streak',current:reviews.positiveCurrent,longest:reviews.positiveLongest,unit:'reviews',copy:'Consecutive rated customer reviews of four or five stars.'},
      {id:'execution',icon:'🔥',name:'Action Completion Streak',current:execution.currentDays,longest:execution.longestDays,unit:'days',copy:'Consecutive local calendar days with at least one completed Action Center item.'}
    ]
  }
  function thresholdDate(rows,field,target,dateField){
    var total=0;
    for(var i=0;i<rows.length;i++){total+=n(field(rows[i]));if(total>=target)return rows[i][dateField]||rows[i].end||rows[i].start||null}
    return null
  }
  function achievement(id,cat,icon,title,desc,current,target,unit,tier,evidence,page,date){
    var unlocked=n(current)>=n(target),pct=target>0?clamp(n(current)/n(target)*100,0,100):0;
    return {id:id,category:cat,icon:icon,title:title,desc:desc,current:n(current),target:n(target),unit:unit||'number',tier:tier||'Milestone',unlocked:unlocked,progress:pct,evidence:evidence||'',page:page||'achievements',unlockDate:unlocked?date:null}
  }
  function formatValue(a,v){
    if(a.unit==='money')return money(v);
    if(a.unit==='rating')return n(v).toFixed(1)+' ★';
    if(a.unit==='percent')return Math.round(n(v))+'%';
    return Math.round(n(v)).toLocaleString()
  }
  function achievements(records,weeks,quarters,orderData,customers,reviews,quality,execution,streakRows){
    var out=[],goalWins=quarters.filter(function(q){return q.goal>0&&q.revenue>=q.goal}),positiveReviews=reviews.positive;
    var q100=quarters.filter(function(q){return q.revenue>=100000})[0],q250=quarters.filter(function(q){return q.revenue>=250000})[0],q500=quarters.filter(function(q){return q.revenue>=500000})[0];
    function add(a){out.push(a)}
    add(achievement('rev100','Revenue','💵','$100K Recorded Revenue','Generate $100,000 in cumulative recorded weekly revenue.',records.totalRevenue,100000,'money','Bronze',money(records.totalRevenue)+' cumulative recorded revenue.','year',thresholdDate(weeks,function(w){return w.revenue},100000,'end')));
    add(achievement('rev500','Revenue','💰','$500K Recorded Revenue','Generate $500,000 in cumulative recorded weekly revenue.',records.totalRevenue,500000,'money','Silver',money(records.totalRevenue)+' cumulative recorded revenue.','year',thresholdDate(weeks,function(w){return w.revenue},500000,'end')));
    add(achievement('rev1m','Revenue','👑','Million-Dollar Record','Generate $1,000,000 in cumulative recorded weekly revenue.',records.totalRevenue,1000000,'money','Gold',money(records.totalRevenue)+' cumulative recorded revenue.','year',thresholdDate(weeks,function(w){return w.revenue},1000000,'end')));
    add(achievement('q100','Revenue','📈','$100K Quarter','Record at least $100,000 in one quarter.',records.bestQuarter?records.bestQuarter.revenue:0,100000,'money','Bronze',records.bestQuarter?(records.bestQuarter.label+' · '+money(records.bestQuarter.revenue)):'No recorded quarter.','year',q100&&q100.end));
    add(achievement('q250','Revenue','🚀','$250K Quarter','Record at least $250,000 in one quarter.',records.bestQuarter?records.bestQuarter.revenue:0,250000,'money','Silver',records.bestQuarter?(records.bestQuarter.label+' · '+money(records.bestQuarter.revenue)):'No recorded quarter.','year',q250&&q250.end));
    add(achievement('q500','Revenue','🏰','$500K Quarter','Record at least $500,000 in one quarter.',records.bestQuarter?records.bestQuarter.revenue:0,500000,'money','Gold',records.bestQuarter?(records.bestQuarter.label+' · '+money(records.bestQuarter.revenue)):'No recorded quarter.','year',q500&&q500.end));
    add(achievement('goal1','Revenue','🎯','Quarter Goal Achieved','Meet or exceed an official quarterly revenue goal.',goalWins.length,1,'number','Gold',goalWins.length?(goalWins[0].label+' · '+Math.round(goalWins[0].revenue/goalWins[0].goal*100)+'% of goal'):'No recorded quarter goal achieved.','forecast',goalWins[0]&&goalWins[0].end));

    add(achievement('calls1k','Activity','📞','1,000 Recorded Calls','Accumulate 1,000 calls across recorded weekly scorecards.',records.totalCalls,1000,'number','Bronze',records.totalCalls.toLocaleString()+' cumulative calls.','dash',thresholdDate(weeks,function(w){return w.calls},1000,'end')));
    add(achievement('calls5k','Activity','☎','5,000 Recorded Calls','Accumulate 5,000 calls across recorded weekly scorecards.',records.totalCalls,5000,'number','Silver',records.totalCalls.toLocaleString()+' cumulative calls.','dash',thresholdDate(weeks,function(w){return w.calls},5000,'end')));
    add(achievement('calls10k','Activity','⚡','10,000 Recorded Calls','Accumulate 10,000 calls across recorded weekly scorecards.',records.totalCalls,10000,'number','Gold',records.totalCalls.toLocaleString()+' cumulative calls.','dash',thresholdDate(weeks,function(w){return w.calls},10000,'end')));
    var callStreak=streakRows.filter(function(s){return s.id==='calls'})[0];
    add(achievement('callstreak3','Activity','🔥','Three-Week Call Streak','Meet the 125-call standard for three consecutive recorded weeks.',callStreak?callStreak.longest:0,3,'number','Silver',(callStreak?callStreak.longest:0)+'-week personal record.','dash',null));
    add(achievement('callstreak6','Activity','🌋','Six-Week Call Streak','Meet the 125-call standard for six consecutive recorded weeks.',callStreak?callStreak.longest:0,6,'number','Gold',(callStreak?callStreak.longest:0)+'-week personal record.','dash',null));

    add(achievement('orders100','Orders','📦','100 Recorded Orders','Accumulate 100 orders across recorded weekly scorecards.',records.totalOrders,100,'number','Bronze',records.totalOrders.toLocaleString()+' cumulative recorded orders.','orders',thresholdDate(weeks,function(w){return w.orders},100,'end')));
    add(achievement('orders250','Orders','📦','250 Recorded Orders','Accumulate 250 orders across recorded weekly scorecards.',records.totalOrders,250,'number','Silver',records.totalOrders.toLocaleString()+' cumulative recorded orders.','orders',thresholdDate(weeks,function(w){return w.orders},250,'end')));
    add(achievement('order10k','Orders','💎','$10K Order','Record a single primary order worth at least $10,000.',records.largestOrder?n(records.largestOrder.total):0,10000,'money','Bronze',records.largestOrder?(String(records.largestOrder.orderNum||'Order')+' · '+money(records.largestOrder.total)):'No primary order history.','orders',records.largestOrder&&records.largestOrder._achDate));
    add(achievement('order25k','Orders','💠','$25K Order','Record a single primary order worth at least $25,000.',records.largestOrder?n(records.largestOrder.total):0,25000,'money','Silver',records.largestOrder?(String(records.largestOrder.orderNum||'Order')+' · '+money(records.largestOrder.total)):'No primary order history.','orders',records.largestOrder&&records.largestOrder._achDate));
    add(achievement('order50k','Orders','🏆','$50K Order','Record a single primary order worth at least $50,000.',records.largestOrder?n(records.largestOrder.total):0,50000,'money','Gold',records.largestOrder?(String(records.largestOrder.orderNum||'Order')+' · '+money(records.largestOrder.total)):'No primary order history.','orders',records.largestOrder&&records.largestOrder._achDate));
    add(achievement('aov5k','Orders','📊','$5K Lifetime AOV','Maintain at least a $5,000 average across recorded weekly orders.',records.lifetimeAOV,5000,'money','Silver',money(records.lifetimeAOV)+' lifetime recorded AOV.','orders',null));

    add(achievement('cust10','Customers','🏢','10 Recorded Customers','Build a recorded primary-order history with 10 unique customers.',customers.count,10,'number','Bronze',customers.count+' unique recorded customers.','customers',null));
    add(achievement('cust25','Customers','🌐','25 Recorded Customers','Build a recorded primary-order history with 25 unique customers.',customers.count,25,'number','Silver',customers.count+' unique recorded customers.','customers',null));
    add(achievement('cust50','Customers','🗺','50 Recorded Customers','Build a recorded primary-order history with 50 unique customers.',customers.count,50,'number','Gold',customers.count+' unique recorded customers.','customers',null));
    add(achievement('repeat10','Customers','🔁','10 Repeat Customers','Have at least 10 customers with two or more recorded primary orders.',customers.repeat,10,'number','Silver',customers.repeat+' repeat customers.','customers',null));

    add(achievement('review1','Reviews','⭐','First Five-Star Review','Receive the first active five-star customer review.',reviews.five,1,'number','Bronze',reviews.five+' active five-star reviews.','reviews',positiveReviews.filter(function(r){return r.stars>=5})[0]&&positiveReviews.filter(function(r){return r.stars>=5})[0].date));
    add(achievement('review10','Reviews','🌟','Ten Five-Star Reviews','Receive 10 active five-star customer reviews.',reviews.five,10,'number','Silver',reviews.five+' active five-star reviews.','reviews',positiveReviews.filter(function(r){return r.stars>=5})[9]&&positiveReviews.filter(function(r){return r.stars>=5})[9].date));
    add(achievement('review25','Reviews','✨','Twenty-Five Five-Star Reviews','Receive 25 active five-star customer reviews.',reviews.five,25,'number','Gold',reviews.five+' active five-star reviews.','reviews',positiveReviews.filter(function(r){return r.stars>=5})[24]&&positiveReviews.filter(function(r){return r.stars>=5})[24].date));
    add(achievement('rating48','Reviews','💬','Customer Favorite','Maintain a lifetime active-review average of at least 4.8 stars with five or more rated reviews.',reviews.rated.length>=5?reviews.avg:0,4.8,'rating','Gold',(reviews.rated.length?reviews.avg.toFixed(2):'0.00')+' average across '+reviews.rated.length+' rated reviews.','reviews',null));
    add(achievement('named5','Reviews','🙌','Named Recognition','Be mentioned by first name in five active customer reviews.',reviews.named,5,'number','Silver',reviews.named+' active reviews mention the rep by first name.','reviews',null));

    add(achievement('clean10','Quality','✓','10 Clean Orders','Reach a clean streak of 10 primary orders without a matched art error or rep-fault credit.',quality.longestClean,10,'number','Bronze',quality.longestClean+'-order personal record.','arterrors',null));
    add(achievement('clean25','Quality','🛡','25 Clean Orders','Reach a clean streak of 25 primary orders without a matched art error or rep-fault credit.',quality.longestClean,25,'number','Silver',quality.longestClean+'-order personal record.','arterrors',null));
    add(achievement('clean50','Quality','🏅','50 Clean Orders','Reach a clean streak of 50 primary orders without a matched art error or rep-fault credit.',quality.longestClean,50,'number','Gold',quality.longestClean+'-order personal record.','arterrors',null));
    add(achievement('cleanweeks4','Quality','🧱','Four Clean Weeks','Record four consecutive entered weeks without a week-matched art error or rep-fault credit.',quality.longestCleanWeeks,4,'number','Silver',quality.longestCleanWeeks+'-week quality record.','arterrors',null));

    add(achievement('actions5','Execution','✅','Five Closed Loops','Complete five Action Center items with recorded outcomes.',execution.completions.length,5,'number','Bronze',execution.completions.length+' local Action Center completions.','action',execution.completions[4]&&dval(execution.completions[4].at)));
    add(achievement('actions25','Execution','☑','Twenty-Five Closed Loops','Complete 25 Action Center items with recorded outcomes.',execution.completions.length,25,'number','Silver',execution.completions.length+' local Action Center completions.','action',execution.completions[24]&&dval(execution.completions[24].at)));
    add(achievement('actions100','Execution','🏁','One Hundred Closed Loops','Complete 100 Action Center items with recorded outcomes.',execution.completions.length,100,'number','Gold',execution.completions.length+' local Action Center completions.','action',execution.completions[99]&&dval(execution.completions[99].at)));
    add(achievement('actionstreak5','Execution','🔥','Five-Day Execution Streak','Complete at least one Action Center item on five consecutive local calendar days.',execution.longestDays,5,'number','Silver',execution.longestDays+'-day personal record.','action',null));
    add(achievement('goals1','Growth','🎯','First Personal Goal Completed','Complete the first personal Goals & Growth objective.',execution.completedGoals.length,1,'number','Bronze',execution.completedGoals.length+' personal goals completed.','goals',execution.completedGoals[0]&&dval(execution.completedGoals[0].completedAt)));
    add(achievement('goals5','Growth','🧭','Five Personal Goals Completed','Complete five personal Goals & Growth objectives.',execution.completedGoals.length,5,'number','Gold',execution.completedGoals.length+' personal goals completed.','goals',execution.completedGoals[4]&&dval(execution.completedGoals[4].completedAt)));

    return out
  }
  function achievementLevel(unlocked,total){
    var levels=[
      {name:'Story Beginning',min:0},
      {name:'Rising Performer',min:5},
      {name:'Trusted Builder',min:12},
      {name:'Growth Champion',min:20},
      {name:'Gold Standard',min:28},
      {name:'Legacy Maker',min:36}
    ],current=levels[0],next=null;
    levels.forEach(function(l){if(unlocked>=l.min)current=l;else if(!next)next=l});
    return {name:current.name,number:levels.indexOf(current)+1,next:next,remaining:next?Math.max(0,next.min-unlocked):0,totalLevels:levels.length}
  }
  function recordsList(r){
    return [
      {icon:'💵',label:'Best Revenue Week',value:r.bestRevenueWeek?money(r.bestRevenueWeek.revenue):'—',title:r.bestRevenueWeek?r.bestRevenueWeek.label:'No recorded week',copy:r.bestRevenueWeek?fmtDate(r.bestRevenueWeek.end||r.bestRevenueWeek.start):'Weekly scorecards required.'},
      {icon:'📞',label:'Best Call Week',value:r.bestCallsWeek?r.bestCallsWeek.calls.toLocaleString():'—',title:r.bestCallsWeek?r.bestCallsWeek.label:'No recorded week',copy:'Highest calls in one recorded weekly scorecard.'},
      {icon:'📦',label:'Best Order Week',value:r.bestOrdersWeek?r.bestOrdersWeek.orders.toLocaleString():'—',title:r.bestOrdersWeek?r.bestOrdersWeek.label:'No recorded week',copy:'Highest order count in one recorded weekly scorecard.'},
      {icon:'📊',label:'Best Weekly AOV',value:r.bestAOVWeek?money(r.bestAOVWeek.revenue/r.bestAOVWeek.orders):'—',title:r.bestAOVWeek?r.bestAOVWeek.label:'No recorded week',copy:'Weekly revenue divided by weekly orders.'},
      {icon:'🏆',label:'Best Quarter',value:r.bestQuarter?money(r.bestQuarter.revenue):'—',title:r.bestQuarter?r.bestQuarter.label:'No recorded quarter',copy:r.bestQuarter?(r.bestQuarter.orders+' orders · '+r.bestQuarter.calls+' calls'):'Quarter history required.'},
      {icon:'🎯',label:'Best Goal Attainment',value:r.bestGoalQuarter?Math.round(r.bestGoalQuarter.revenue/r.bestGoalQuarter.goal*100)+'%':'—',title:r.bestGoalQuarter?r.bestGoalQuarter.label:'No quarter goal history',copy:r.bestGoalQuarter?(money(r.bestGoalQuarter.revenue)+' of '+money(r.bestGoalQuarter.goal)):'Official quarter goals required.'},
      {icon:'💎',label:'Largest Primary Order',value:r.largestOrder?money(r.largestOrder.total):'—',title:r.largestOrder?String(r.largestOrder.orderNum||r.largestOrder.base||'Order'):'No primary order history',copy:r.largestOrder?String(r.largestOrder.customer||'Customer not recorded'):'Orders import required.'},
      {icon:'🏢',label:'Largest Customer Relationship',value:r.customers.top?money(r.customers.top.revenue):'—',title:r.customers.top?r.customers.top.name:'No customer history',copy:r.customers.top?(r.customers.top.orderCount+' recorded primary orders'):'Customer names required.'},
      {icon:'⭐',label:'Review Average',value:r.reviews.rated.length?r.reviews.avg.toFixed(2)+' ★':'—',title:r.reviews.rated.length?(r.reviews.rated.length+' rated reviews'):'No rated reviews',copy:r.reviews.five+' active five-star reviews.'},
      {icon:'🛡',label:'Longest Clean-Order Streak',value:r.quality.longestClean.toLocaleString(),title:'Primary orders',copy:'Without a matched art error or rep-fault credit memo.'},
      {icon:'🔥',label:'Longest Action Streak',value:r.execution.longestDays+'d',title:'Local calendar days',copy:'At least one completed Action Center item per day.'},
      {icon:'🌐',label:'Unique Recorded Customers',value:r.customers.count.toLocaleString(),title:r.customers.repeat+' repeat customers',copy:'Unique customer names across recorded primary orders.'}
    ]
  }
  function timeline(achievements,records,weeks,orderData,reviews,execution){
    var rows=[];
    achievements.filter(function(a){return a.unlocked&&a.unlockDate}).forEach(function(a){rows.push({date:a.unlockDate,icon:a.icon,title:a.title,copy:a.evidence,kind:'Achievement'})});
    if(records.bestRevenueWeek)rows.push({date:records.bestRevenueWeek.end||records.bestRevenueWeek.start,icon:'💵',title:'Personal revenue-week record',copy:records.bestRevenueWeek.label+' · '+money(records.bestRevenueWeek.revenue),kind:'Record'});
    if(records.bestCallsWeek)rows.push({date:records.bestCallsWeek.end||records.bestCallsWeek.start,icon:'📞',title:'Personal call-week record',copy:records.bestCallsWeek.label+' · '+records.bestCallsWeek.calls+' calls',kind:'Record'});
    if(records.largestOrder)rows.push({date:records.largestOrder._achDate,icon:'💎',title:'Largest recorded primary order',copy:String(records.largestOrder.orderNum||'Order')+' · '+money(records.largestOrder.total)+' · '+String(records.largestOrder.customer||'Customer not recorded'),kind:'Record'});
    execution.completedGoals.forEach(function(g){rows.push({date:dval(g.completedAt),icon:'🎯',title:'Personal goal completed',copy:String(g.title||'Goals & Growth objective'),kind:'Growth'})});
    var seen={};
    return rows.filter(function(r){
      if(!r.date)return false;
      var k=iso(r.date)+'|'+r.title+'|'+r.copy;if(seen[k])return false;seen[k]=1;return true
    }).sort(function(a,b){return b.date-a.date})
  }
  function selectedSpotlight(ctx,achievements){
    var sw=ctx.selectedWeek,unlocks=achievements.filter(function(a){
      if(!a.unlocked||!a.unlockDate||!sw.start||!sw.end)return false;
      return a.unlockDate>=sw.start&&a.unlockDate<=new Date(sw.end.getTime()+86399999)
    });
    var aov=sw.orders?sw.revenue/sw.orders:0,pace=ctx.goal?ctx.qtd.revenue/ctx.goal*100:0;
    return {unlocks:unlocks,aov:aov,pace:pace}
  }
  function build(){
    var ctx=selectedContext(),weeks=allWeeks(),quarters=quarterHistory(weeks),orderData=orders(),reviewRows=activeReviews(),reviews=reviewIntel(reviewRows),quality=qualityIntel(orderData,weeks),execution=localExecution(),customers=customerIntel(orderData);
    var records=recordData(weeks,quarters,orderData,customers,reviews,quality,execution),streakRows=streaks(weeks,quality,reviews,execution),ach=achievements(records,weeks,quarters,orderData,customers,reviews,quality,execution,streakRows);
    var b=bucket(_rp2.rep);ach.forEach(function(a){a.pinned=!!b.data.pinned[a.id]});
    var unlocked=ach.filter(function(a){return a.unlocked}),locked=ach.filter(function(a){return !a.unlocked}),level=achievementLevel(unlocked.length,ach.length);
    return {ctx:ctx,weeks:weeks,quarters:quarters,orders:orderData,reviews:reviews,quality:quality,execution:execution,customers:customers,records:records,streaks:streakRows,achievements:ach,unlocked:unlocked,locked:locked,level:level,bucket:b,timeline:timeline(ach,records,weeks,orderData,reviews,execution),spotlight:selectedSpotlight(ctx,ach)}
  }
  function posture(g){
    if(!g.weeks.length&&!g.orders.primary.length&&!g.reviews.count)return {title:'The trophy room is ready for its first evidence',copy:'Achievements unlock from recorded scorecards, orders, customer reviews, quality records, goals, and Action Center completions.',tone:'info'};
    if(g.unlocked.length>=28)return {title:'A deep record of performance and customer trust',copy:'The lifetime evidence has unlocked '+g.unlocked.length+' of '+g.achievements.length+' modeled achievements. The next challenge is protecting the habits behind the records.',tone:'gold'};
    if(g.unlocked.length>=12)return {title:'The achievement story is becoming durable',copy:'Multiple categories now show repeatable evidence—not just one strong week or one large order.',tone:'good'};
    return {title:'The foundation is producing real milestones',copy:'You have unlocked '+g.unlocked.length+' evidence-based achievements. The next unlocks show the clearest path forward.',tone:'info'}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-ach-section-head"><div><div class="rp2-ach-section-kick">'+kick+'</div><div class="rp2-ach-section-title">'+title+'</div></div><div class="rp2-ach-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-ach-kpi"><div class="rp2-ach-kpi-label">'+esc(label)+'</div><div class="rp2-ach-kpi-value">'+value+'</div><div class="rp2-ach-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-ach-tabs-wrap"><div class="rp2-ach-tabs">'+TABS.map(function(t){return '<button class="rp2-ach-tab '+(t.id===active?'active':'')+'" onclick="_rp2AchievementsSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function trophyCard(a){
    return '<button class="rp2-ach-trophy '+(a.unlocked?'':'locked')+' '+(a.pinned?'pinned':'')+'" onclick="_rp2AchievementOpen(\''+encodeURIComponent(a.id)+'\')"><div class="rp2-ach-medal">'+(a.unlocked?a.icon:'🔒')+'</div><div class="rp2-ach-tier">'+esc(a.tier+' · '+a.category)+'</div><div class="rp2-ach-name">'+esc(a.title)+'</div><div class="rp2-ach-desc">'+esc(a.desc)+'</div><div class="rp2-ach-proof">'+esc(a.unlocked?a.evidence:(formatValue(a,a.current)+' of '+formatValue(a,a.target)))+'</div><div class="rp2-ach-mini-progress"><span style="width:'+Math.round(a.progress)+'%"></span></div><div class="rp2-ach-next">'+(a.unlocked?('Unlocked'+(a.unlockDate?' · '+fmtDate(a.unlockDate):' from current evidence')):('Next unlock: '+formatValue(a,Math.max(0,a.target-a.current))+' remaining'))+'</div></button>'
  }
  function showcase(g){
    var pinned=g.unlocked.filter(function(a){return a.pinned}),rows=pinned.concat(g.unlocked.filter(function(a){return !a.pinned}).sort(function(a,b){return (b.unlockDate?b.unlockDate.getTime():0)-(a.unlockDate?a.unlockDate.getTime():0)})).slice(0,8);
    if(!rows.length)rows=g.achievements.slice().sort(function(a,b){return b.progress-a.progress}).slice(0,4);
    return '<div class="rp2-ach-showcase">'+rows.map(trophyCard).join('')+'</div>'
  }
  function nextUnlocks(g){
    var rows=g.locked.slice().sort(function(a,b){return b.progress-a.progress}).slice(0,4);
    return rows.length?'<div class="rp2-ach-showcase">'+rows.map(trophyCard).join('')+'</div>':'<div class="rp2-ach-empty"><strong>Every modeled achievement is unlocked</strong><span>The next Achievement Center expansion can introduce higher elite tiers based on the growing record.</span></div>'
  }
  function periodHTML(g){
    var s=g.spotlight,sw=g.ctx.selectedWeek;
    return sectionHead('Selected-period spotlight','What this week contributes to the lifetime story','The Achievement Center is lifetime-first. The Year / Quarter / Month / Week selectors control this lower point-in-time spotlight.')
      +'<div class="rp2-ach-period"><div class="rp2-ach-period-grid"><div><div class="rp2-ach-period-kick">'+esc(sw.label)+'</div><div class="rp2-ach-period-title">'+(s.unlocks.length?(s.unlocks.length+' achievement'+(s.unlocks.length===1?'':'s')+' unlocked in this period'):'No dated lifetime achievement unlock is tied to this week')+'</div><div class="rp2-ach-period-copy">'+(s.unlocks.length?esc(s.unlocks.map(function(a){return a.title}).join(' · ')):'The selected scorecard still contributes revenue, calls, orders, pace, records, and future milestone progress.')+'</div></div>'
      +'<div class="rp2-ach-period-stat"><span>Revenue</span><strong>'+money(sw.revenue)+'</strong><small>Selected weekly scorecard</small></div>'
      +'<div class="rp2-ach-period-stat"><span>Calls</span><strong>'+sw.calls+'</strong><small>'+Math.max(0,125-sw.calls)+' remaining to 125</small></div>'
      +'<div class="rp2-ach-period-stat"><span>Orders</span><strong>'+sw.orders+'</strong><small>Selected weekly scorecard</small></div>'
      +'<div class="rp2-ach-period-stat"><span>Weekly AOV</span><strong>'+money(s.aov)+'</strong><small>'+Math.round(s.pace)+'% of full-quarter revenue goal recorded QTD</small></div>'
      +'</div></div>'
  }
  function roomView(g){
    var p=posture(g);
    return sectionHead('Lifetime trophy room','The strongest achievements in the recorded story','Pinned trophies appear first. Everything is derived from this rep’s own connected evidence.')
      +'<div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Achievement interpretation</div><div class="rp2-ach-summary-title">'+esc(p.title)+'</div><div class="rp2-ach-summary-copy">'+esc(p.copy)+'</div></div>'
      +sectionHead('Featured trophies','Unlocked milestones worth keeping visible','Tap any trophy for the exact evidence, unlock requirement, and related portal tool.')
      +showcase(g)
      +sectionHead('Closest next unlocks','The most attainable remaining milestones','These are ranked by percentage progress—not by comparison with another rep.')
      +nextUnlocks(g)
      +sectionHead('Legacy profile','Records, trust, quality, and execution in one view','The Achievement Center balances sales production with customer recognition and operational quality.')
      +'<div class="rp2-ach-grid-4"><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Lifetime recorded revenue</div><div class="rp2-ach-summary-title">'+money(g.records.totalRevenue)+'</div><div class="rp2-ach-summary-copy">'+g.weeks.length+' entered weekly scorecards across '+g.quarters.length+' recorded quarters.</div></div><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Customer relationships</div><div class="rp2-ach-summary-title">'+g.customers.count+'</div><div class="rp2-ach-summary-copy">'+g.customers.repeat+' customers have two or more recorded primary orders.</div></div><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Customer recognition</div><div class="rp2-ach-summary-title">'+g.reviews.five+' five-star</div><div class="rp2-ach-summary-copy">'+(g.reviews.topTheme?('Top praise theme: '+esc(g.reviews.topTheme.name)+'.'):'No durable praise theme yet.')+'</div></div><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Quality record</div><div class="rp2-ach-summary-title">'+g.quality.longestClean+' clean orders</div><div class="rp2-ach-summary-copy">'+g.quality.longestCleanWeeks+' clean recorded weeks is the current lifetime record.</div></div></div>'
      +periodHTML(g)
  }
  function recordsView(g){
    var rows=recordsList(g.records);
    return sectionHead('Personal records','Lifetime bests across sales, customers, service, and execution','Records compare the rep only against their own recorded history.')
      +'<div class="rp2-ach-records">'+rows.map(function(r){return '<div class="rp2-ach-record"><div class="rp2-ach-record-icon">'+r.icon+'</div><div class="rp2-ach-record-label">'+esc(r.label)+'</div><div class="rp2-ach-record-value">'+r.value+'</div><div class="rp2-ach-record-title">'+esc(r.title)+'</div><div class="rp2-ach-record-copy">'+esc(r.copy)+'</div></div>'}).join('')+'</div>'
      +sectionHead('Record trajectory','Weekly revenue history and personal-best line','The chart uses all available recorded weeks for this rep.')
      +'<div class="rp2-ach-panel"><div class="rp2-ach-chart"><canvas id="rp2-ach-chart"></canvas></div></div>'
      +sectionHead('Quarter record book','Every recorded quarter in the achievement history','Official goal attainment appears only where a quarter goal exists.')
      +(g.quarters.length?'<div class="rp2-ach-timeline">'+g.quarters.slice().reverse().map(function(q){return '<div class="rp2-ach-event"><div class="rp2-ach-event-date">'+esc(q.label)+'</div><div class="rp2-ach-event-icon">📊</div><div class="rp2-ach-event-title">'+money(q.revenue)+' · '+q.orders+' orders</div><div class="rp2-ach-event-copy">'+q.calls+' calls'+(q.goal?(' · '+Math.round(q.revenue/q.goal*100)+'% of '+money(q.goal)+' goal'):' · No official quarter goal available')+'</div></div>'}).join('')+'</div>':'<div class="rp2-ach-empty"><strong>No quarter record book yet</strong><span>Entered weekly scorecards will create quarter history automatically.</span></div>')
  }
  function streaksView(g){
    return sectionHead('Streaks and quality wins','Consistency that lasts beyond one strong result','Current and personal-record streaks are calculated from this rep’s recorded sequence.')
      +'<div class="rp2-ach-streaks">'+g.streaks.map(function(s){return '<div class="rp2-ach-streak '+(s.current?'good':'')+'"><div class="rp2-ach-streak-icon">'+s.icon+'</div><div class="rp2-ach-streak-label">'+esc(s.name)+'</div><div class="rp2-ach-streak-current">'+s.current+' '+esc(s.unit)+'</div><div class="rp2-ach-streak-best">Personal record: '+s.longest+' '+esc(s.unit)+'</div><div class="rp2-ach-streak-copy">'+esc(s.copy)+'</div></div>'}).join('')+'</div>'
      +sectionHead('Quality achievement ladder','The next clean-work milestones','Clean-order achievements use sales-order matching against art errors and rep-fault credit memos.')
      +'<div class="rp2-ach-showcase">'+g.achievements.filter(function(a){return a.category==='Quality'}).map(trophyCard).join('')+'</div>'
      +sectionHead('Consistency achievement ladder','Activity and execution milestones','These unlock from weekly call scorecards and local Action Center completion evidence.')
      +'<div class="rp2-ach-showcase">'+g.achievements.filter(function(a){return a.category==='Activity'||a.category==='Execution'}).slice(0,8).map(trophyCard).join('')+'</div>'
  }
  function recognitionView(g){
    var quotes=g.reviews.rows.slice().sort(function(a,b){return b.stars-a.stars||((b.date?b.date.getTime():0)-(a.date?a.date.getTime():0))}).slice(0,6);
    return sectionHead('Customer recognition','What customers consistently say about working with this rep','Customer comments remain in their original words. The theme counts use transparent keyword matching.')
      +'<div class="rp2-ach-grid-4"><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Lifetime active reviews</div><div class="rp2-ach-summary-title">'+g.reviews.count+'</div><div class="rp2-ach-summary-copy">'+g.reviews.rated.length+' contain a recorded star rating.</div></div><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Lifetime review average</div><div class="rp2-ach-summary-title">'+(g.reviews.rated.length?g.reviews.avg.toFixed(2)+' ★':'—')+'</div><div class="rp2-ach-summary-copy">'+g.reviews.five+' active five-star reviews.</div></div><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Named recognition</div><div class="rp2-ach-summary-title">'+g.reviews.named+'</div><div class="rp2-ach-summary-copy">Active comments mentioning the rep by first name.</div></div><div class="rp2-ach-summary"><div class="rp2-ach-summary-label">Top praise theme</div><div class="rp2-ach-summary-title">'+esc(g.reviews.topTheme?g.reviews.topTheme.name:'Still forming')+'</div><div class="rp2-ach-summary-copy">'+(g.reviews.topTheme?g.reviews.topTheme.count+' matching reviews.':'More customer voice is needed.')+'</div></div></div>'
      +sectionHead('Customer voice showcase','Strong recent and high-rated comments','The Achievement Center does not rewrite or fabricate customer praise.')
      +(quotes.length?'<div class="rp2-ach-voice-grid">'+quotes.map(function(r){return '<div class="rp2-ach-voice"><div class="rp2-ach-stars">'+('★★★★★'.slice(0,Math.max(0,Math.min(5,r.stars)))||'Customer review')+'</div><div class="rp2-ach-quote">“'+esc(r.msg||'No comment text recorded.')+'”</div><div class="rp2-ach-voice-foot">'+esc(r.platform||'Review platform not recorded')+(r.date?' · '+fmtDate(r.date):'')+'</div></div>'}).join('')+'</div>':'<div class="rp2-ach-empty"><strong>No active customer comments are available</strong><span>Recognition appears when active reviews are assigned to this rep.</span></div>')
      +sectionHead('Praise DNA','Themes repeated across the lifetime active review record','Counts indicate matched reviews, not rewritten summaries.')
      +'<div class="rp2-ach-theme-grid">'+g.reviews.themes.filter(function(t){return t.count>0}).map(function(t){return '<div class="rp2-ach-theme"><div class="rp2-ach-theme-name">'+esc(t.name)+'</div><div class="rp2-ach-theme-count">'+t.count+'</div><div class="rp2-ach-theme-copy">Active review'+(t.count===1?'':'s')+' containing a matching phrase.</div></div>'}).join('')+'</div>'
      +sectionHead('Recognition achievement ladder','Customer-trust milestones','These achievements use only active reviews assigned to the logged-in rep.')
      +'<div class="rp2-ach-showcase">'+g.achievements.filter(function(a){return a.category==='Reviews'}).map(trophyCard).join('')+'</div>'
  }
  function filterBar(g){
    var cats={};g.achievements.forEach(function(a){cats[a.category]=1});
    return '<div class="rp2-ach-filterbar"><input id="rp2-ach-search" type="search" placeholder="Search achievements and evidence…" oninput="_rp2AchievementsApplyFilters()"><select id="rp2-ach-category" onchange="_rp2AchievementsApplyFilters()"><option value="">All categories</option>'+Object.keys(cats).sort().map(function(k){return '<option value="'+esc(k)+'">'+esc(k)+'</option>'}).join('')+'</select><select id="rp2-ach-status" onchange="_rp2AchievementsApplyFilters()"><option value="">Unlocked and locked</option><option value="unlocked">Unlocked</option><option value="locked">Locked</option><option value="pinned">Pinned</option></select><div id="rp2-ach-count" class="rp2-ach-filtercount">'+g.achievements.length+' shown</div></div>'
  }
  function vaultView(g){
    return sectionHead('Milestone vault','Every achievement and the exact next unlock','Filter by category or status. Pinned achievements remain personal to this browser and rep identity.')
      +filterBar(g)
      +'<div class="rp2-ach-vault">'+g.achievements.map(function(a){return '<div class="rp2-ach-vault-card '+(a.unlocked?'':'locked')+' '+(a.pinned?'pinned':'')+'" data-ach506="1" data-category="'+esc(a.category)+'" data-status="'+(a.unlocked?'unlocked':'locked')+'" data-pinned="'+(a.pinned?'1':'0')+'" data-search="'+esc((a.title+' '+a.desc+' '+a.evidence+' '+a.category).toLowerCase())+'" onclick="_rp2AchievementOpen(\''+encodeURIComponent(a.id)+'\')"><div class="rp2-ach-vault-icon">'+(a.unlocked?a.icon:'🔒')+'</div><div class="rp2-ach-vault-tier">'+esc(a.tier+' · '+a.category)+'</div><div class="rp2-ach-vault-title">'+esc(a.title)+'</div><div class="rp2-ach-vault-desc">'+esc(a.desc)+'</div><div class="rp2-ach-vault-state">'+esc(a.unlocked?a.evidence:(formatValue(a,a.current)+' of '+formatValue(a,a.target)))+'</div><div class="rp2-ach-mini-progress"><span style="width:'+Math.round(a.progress)+'%"></span></div><div class="rp2-ach-vault-next">'+(a.unlocked?('Unlocked'+(a.unlockDate?' · '+fmtDate(a.unlockDate):' from current evidence')):('Need '+formatValue(a,Math.max(0,a.target-a.current))+' more'))+(a.pinned?' · Pinned':'')+'</div></div>'}).join('')+'</div>'
  }
  function timelineView(g){
    return sectionHead('Legacy timeline','Dated milestones and personal-best moments','The timeline includes only achievements and records with an inferable date. Snapshot-only milestones remain in the vault.')
      +(g.timeline.length?'<div class="rp2-ach-timeline">'+g.timeline.map(function(e){return '<div class="rp2-ach-event"><div class="rp2-ach-event-date">'+fmtDate(e.date)+'</div><div class="rp2-ach-event-icon">'+e.icon+'</div><div class="rp2-ach-event-title">'+esc(e.title)+'</div><div class="rp2-ach-event-copy">'+esc(e.copy)+'</div></div>'}).join('')+'</div>':'<div class="rp2-ach-empty"><strong>No dated legacy milestones are available</strong><span>Order dates, review dates, weekly scorecard dates, or local completion dates are needed to build the timeline.</span></div>')
      +sectionHead('Achievement history chart','Cumulative unlocked milestones by dated event','Snapshot-only achievements are excluded because their exact unlock date cannot be proven.')
      +'<div class="rp2-ach-panel"><div class="rp2-ach-chart"><canvas id="rp2-ach-chart"></canvas></div></div>'
  }
  function modalHTML(g){
    if(!window._rp2AchievementOpenId)return '';
    var id=decodeURIComponent(window._rp2AchievementOpenId),a=g.achievements.filter(function(x){return x.id===id})[0];if(!a)return '';
    return '<div class="rp2-ach-modal-wrap" onclick="if(event.target===this)_rp2AchievementClose()"><aside class="rp2-ach-modal"><div class="rp2-ach-modal-head"><div><div class="rp2-ach-modal-medal">'+(a.unlocked?a.icon:'🔒')+'</div><div class="rp2-ach-modal-kick">'+esc(a.tier+' · '+a.category)+'</div><div class="rp2-ach-modal-title">'+esc(a.title)+'</div><div class="rp2-ach-modal-sub">'+esc(a.desc)+'</div></div><button class="rp2-ach-close" onclick="_rp2AchievementClose()">×</button></div><div class="rp2-ach-detail">'
      +'<div class="rp2-ach-detail-card"><div class="rp2-ach-detail-label">Current evidence</div><div class="rp2-ach-detail-value">'+esc(a.evidence||formatValue(a,a.current))+'</div></div>'
      +'<div class="rp2-ach-detail-card"><div class="rp2-ach-detail-label">Unlock requirement</div><div class="rp2-ach-detail-value">'+formatValue(a,a.target)+' · '+Math.round(a.progress)+'% complete</div><div class="rp2-ach-mini-progress"><span style="width:'+Math.round(a.progress)+'%"></span></div></div>'
      +'<div class="rp2-ach-detail-card"><div class="rp2-ach-detail-label">Status</div><div class="rp2-ach-detail-value">'+(a.unlocked?('Unlocked'+(a.unlockDate?' on '+fmtDate(a.unlockDate):' from current lifetime evidence')):('Locked · '+formatValue(a,Math.max(0,a.target-a.current))+' remaining'))+'</div></div>'
      +'<div class="rp2-ach-detail-card"><div class="rp2-ach-detail-label">Related portal evidence</div><div class="rp2-ach-detail-value">'+esc(a.page.replace(/\b\w/g,function(x){return x.toUpperCase()}))+'</div></div>'
      +'</div><div class="rp2-ach-disclosure"><strong>Achievement integrity:</strong> this trophy is generated only from the logged-in rep’s recorded data. Locked progress is not inferred from another rep or from team averages.</div><div class="rp2-ach-modal-actions"><button class="rp2-ach-btn" onclick="_rp2AchievementClose()">Close</button><button class="rp2-ach-btn purple" onclick="_rp2AchievementTogglePin(\''+encodeURIComponent(a.id)+'\')">'+(a.pinned?'Unpin trophy':'Pin trophy')+'</button><button class="rp2-ach-btn" onclick="_rp2Go(\''+esc(a.page)+'\')">Open evidence</button><button class="rp2-ach-btn primary" onclick="_rp2AchievementCopy(\''+encodeURIComponent(a.id)+'\')">Copy highlight</button></div></aside></div>'
  }

  function rerender(){
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2AchievementsV2();
    setTimeout(function(){try{window._rp2AchievementsDraw();window._rp2AchievementsApplyFilters()}catch(e){}},0)
  }
  window._rp2AchievementsSetTab=function(id){window._rp2AchievementsTab=id;window._rp2AchievementOpenId=null;rerender();var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0}
  window._rp2AchievementOpen=function(id){
    var g=build(),decoded=decodeURIComponent(id),b=g.bucket;b.data.opened[decoded]=new Date().toISOString();writeBucket(_rp2.rep,b);window._rp2AchievementOpenId=id;rerender()
  }
  window._rp2AchievementClose=function(){window._rp2AchievementOpenId=null;rerender()}
  window._rp2AchievementTogglePin=function(id){
    var decoded=decodeURIComponent(id),g=build(),b=g.bucket;b.data.pinned[decoded]=!b.data.pinned[decoded];writeBucket(_rp2.rep,b);window._rp2AchievementOpenId=id;rerender()
  }
  window._rp2AchievementCopy=function(id){
    var decoded=decodeURIComponent(id),g=build(),a=g.achievements.filter(function(x){return x.id===decoded})[0];if(!a)return;
    var txt='ACHIEVEMENT — '+_rp2.rep+'\n\n'+a.icon+' '+a.title+'\n'+a.desc+'\nStatus: '+(a.unlocked?'Unlocked':'Locked')+'\nEvidence: '+a.evidence+'\nProgress: '+formatValue(a,a.current)+' of '+formatValue(a,a.target)+' ('+Math.round(a.progress)+'%)';
    try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt);else prompt('Copy achievement:',txt)}catch(e){prompt('Copy achievement:',txt)}
  }
  window._rp2AchievementsCopyCase=function(){
    var g=build(),top=g.unlocked.slice().sort(function(a,b){return b.progress-a.progress}).slice(0,8),txt='ACHIEVEMENT PROFILE — '+_rp2.rep+'\n\nLevel: '+g.level.name+'\nUnlocked: '+g.unlocked.length+' of '+g.achievements.length+'\nLifetime recorded revenue: '+money(g.records.totalRevenue)+'\nUnique customers: '+g.customers.count+'\nFive-star reviews: '+g.reviews.five+'\nLongest clean-order streak: '+g.quality.longestClean+'\n\nFEATURED TROPHIES\n';
    top.forEach(function(a){txt+='• '+a.title+' — '+a.evidence+'\n'});
    try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt);else prompt('Copy trophy case:',txt)}catch(e){prompt('Copy trophy case:',txt)}
  }
  window._rp2AchievementsApplyFilters=function(){
    try{
      var q=((document.getElementById('rp2-ach-search')||{}).value||'').toLowerCase().trim(),cat=((document.getElementById('rp2-ach-category')||{}).value||''),status=((document.getElementById('rp2-ach-status')||{}).value||'');
      var cards=safeArray(document.querySelectorAll?document.querySelectorAll('#rp2-page [data-ach506="1"]'):[]),shown=0;
      cards.forEach(function(card){
        var ok=(!q||String(card.getAttribute('data-search')||'').indexOf(q)>=0)&&(!cat||card.getAttribute('data-category')===cat)&&(!status||(status==='pinned'?card.getAttribute('data-pinned')==='1':card.getAttribute('data-status')===status));
        card.style.display=ok?'block':'none';if(ok)shown++
      });
      var count=document.getElementById('rp2-ach-count');if(count)count.textContent=shown+' shown'
    }catch(e){}
  };

  window._rp2AchievementsV2=function(){
    try{
      var g=build(),tab=window._rp2AchievementsTab,p=posture(g),next=g.locked.slice().sort(function(a,b){return b.progress-a.progress})[0],pinned=g.unlocked.filter(function(a){return a.pinned}).length;
      var hero='<div class="rp2-ach-hero"><div class="rp2-ach-hero-grid"><div><div class="rp2-ach-kick">Achievement Center 2.0 · LIFETIME TROPHY ROOM · BUILD v506</div><div class="rp2-ach-title">Celebrate the record—and see the next unlock</div><div class="rp2-ach-copy">Turn lifetime performance, customer trust, quality, consistency, personal goals, and daily execution into an evidence-based trophy room. Every locked achievement shows what remains.</div><div class="rp2-ach-pills"><span class="rp2-ach-pill '+p.tone+'">'+esc(p.title)+'</span><span class="rp2-ach-pill gold">'+g.unlocked.length+' of '+g.achievements.length+' unlocked</span><span class="rp2-ach-pill info">'+pinned+' pinned trophies</span><span class="rp2-ach-pill">Personal state · this device</span></div><div class="rp2-ach-hero-actions"><button class="rp2-ach-btn primary" onclick="_rp2AchievementsCopyCase()">Copy trophy profile</button><button class="rp2-ach-btn purple" onclick="_rp2Go(\'goals\')">Open Goals & Growth</button></div></div>'
        +'<div class="rp2-ach-brief"><div><div class="rp2-ach-brief-label">Current achievement level</div><div class="rp2-ach-level-row"><div class="rp2-ach-level">'+esc(g.level.name)+'</div><div class="rp2-ach-level-num">Level '+g.level.number+' / '+g.level.totalLevels+'</div></div><div class="rp2-ach-brief-title">'+g.unlocked.length+' modeled achievements unlocked</div><div class="rp2-ach-brief-copy">'+(g.level.next?(g.level.remaining+' more unlock'+(g.level.remaining===1?'':'s')+' to reach '+g.level.next.name+'.'):'The current modeled level ladder is fully complete.')+' This level is recognition and coaching—not compensation or an official job title.</div></div><div class="rp2-ach-brief-foot"><span>Closest next unlock <strong>'+(next?esc(next.title):'All unlocked')+'</strong></span><span>Lifetime scorecards <strong>'+g.weeks.length+'</strong></span></div></div></div></div>';
      var kpis='<div class="rp2-ach-kpis">'
        +kpi('Achievements unlocked',g.unlocked.length+'/'+g.achievements.length,Math.round(g.unlocked.length/Math.max(1,g.achievements.length)*100)+'% of modeled vault')
        +kpi('Lifetime revenue',money(g.records.totalRevenue),g.quarters.length+' recorded quarters')
        +kpi('Best revenue week',g.records.bestRevenueWeek?money(g.records.bestRevenueWeek.revenue):'—',g.records.bestRevenueWeek?esc(g.records.bestRevenueWeek.label):'No entered weeks')
        +kpi('Largest order',g.records.largestOrder?money(g.records.largestOrder.total):'—',g.records.largestOrder?esc(g.records.largestOrder.orderNum||'Primary order'):'No primary orders')
        +kpi('Recorded customers',String(g.customers.count),g.customers.repeat+' repeat customers')
        +kpi('Five-star reviews',String(g.reviews.five),g.reviews.rated.length?(g.reviews.avg.toFixed(2)+' lifetime average'):'No rated review average')
        +kpi('Clean-order record',String(g.quality.longestClean),g.quality.currentClean+' current clean orders')
        +kpi('Closed-loop actions',String(g.execution.completions.length),g.execution.longestDays+'-day completion record')
        +'</div>';
      var content=tab==='records'?recordsView(g):tab==='streaks'?streaksView(g):tab==='recognition'?recognitionView(g):tab==='vault'?vaultView(g):tab==='timeline'?timelineView(g):roomView(g);
      return '<div class="rp2-ach-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+modalHTML(g)
    }catch(e){
      console.error('[Achievement Center v506 render error]',e);
      return '<div class="rp2-ach-shell"><div class="rp2-ach-hero"><div class="rp2-ach-kick">Achievement Center 2.0 · RECOVERY MODE</div><div class="rp2-ach-title">The lifetime achievement engine hit a data compatibility issue</div><div class="rp2-ach-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2AchievementsDraw=function(){
    if(typeof Chart!=='function')return;
    if(window._rp2AchievementsTab!=='records'&&window._rp2AchievementsTab!=='timeline')return;
    var canvas=document.getElementById('rp2-ach-chart');if(!canvas)return;
    var g=build();
    if(_rp2.achievementChart){try{_rp2.achievementChart.destroy()}catch(e){}}
    if(window._rp2AchievementsTab==='records'){
      var rows=g.weeks,best=g.records.bestRevenueWeek?g.records.bestRevenueWeek.revenue:0;
      _rp2.achievementChart=new Chart(canvas.getContext('2d'),{
        type:'bar',data:{labels:rows.map(function(w){return w.label}),datasets:[
          {type:'bar',label:'Weekly revenue',data:rows.map(function(w){return w.revenue}),backgroundColor:'rgba(245,190,100,.68)',borderRadius:5},
          {type:'line',label:'Personal record',data:rows.map(function(){return best}),borderColor:'#FA873D',pointRadius:0,borderDash:[5,5],tension:0}
        ]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}}},scales:{x:{ticks:{color:'#8b95a7',font:{size:8},maxRotation:0,autoSkip:true,maxTicksLimit:16},grid:{display:false}},y:{beginAtZero:true,ticks:{color:'#8b95a7',callback:function(v){return '$'+Math.round(v/1000)+'K'}},grid:{color:'rgba(255,255,255,.05)'}}}}
      })
    }else{
      var dated=g.timeline.slice().reverse(),count=0,labels=[],values=[];
      dated.forEach(function(e){count++;labels.push(fmtDate(e.date));values.push(count)});
      if(!dated.length)return;
      _rp2.achievementChart=new Chart(canvas.getContext('2d'),{
        type:'line',data:{labels:labels,datasets:[{label:'Dated milestones',data:values,borderColor:'#f5be64',backgroundColor:'rgba(245,190,100,.12)',fill:true,pointRadius:3,tension:.25}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8b95a7',font:{size:8},autoSkip:true,maxTicksLimit:12},grid:{display:false}},y:{beginAtZero:true,ticks:{color:'#8b95a7',precision:0},grid:{color:'rgba(255,255,255,.05)'}}}}
      })
    }
  };
})();
