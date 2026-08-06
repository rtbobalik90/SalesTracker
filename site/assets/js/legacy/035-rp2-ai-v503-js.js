
(function(){
  var TABS=[
    {id:'coach',label:'Coach Dashboard',icon:'✦'},
    {id:'plan',label:'Weekly Action Plan',icon:'✓'},
    {id:'growth',label:'Growth Opportunities',icon:'↗'},
    {id:'risk',label:'Risk & Quality',icon:'⚠'},
    {id:'ask',label:'Ask AI Coach',icon:'💬'},
    {id:'history',label:'Coaching History',icon:'◷'}
  ];
  window._rp2AITab=window._rp2AITab||'coach';
  window._rp2AIChat=window._rp2AIChat||[];
  window._rp2AIThinking=false;

  var REVIEW_THEMES=[
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
  function dval(v){
    if(v==null||v==='')return null;
    try{
      var s=String(v).trim(),d;
      if(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)){
        var p=s.split('/'),y=Number(p[2]);if(y<100)y+=2000;d=new Date(y,Number(p[0])-1,Number(p[1]),12)
      }else d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);
      if(!isNaN(d.getTime()))return d
    }catch(e){}
    return null
  }
  function iso(v){
    var d=dval(v);return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')):''
  }
  function fmtDate(v){
    var d=dval(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):String(v||'—')
  }
  function diffDays(a,b){
    var x=dval(a),y=dval(b);if(!x||!y)return null;
    x.setHours(12,0,0,0);y.setHours(12,0,0,0);return Math.round((y-x)/86400000)
  }
  function currentContext(){
    var rep=_rp2.rep,c=null;
    try{c=window._rp2V476Context?window._rp2V476Context(rep):null}catch(e){}
    var year=Number(getYr()),q=getQ(),wks=[];
    try{wks=safeArray(c&&c.wks&&c.wks.length?c.wks:gwq(year,q))}catch(e){wks=[]}
    var selected=null;
    try{selected=c&&c.selected?c.selected:(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null)}catch(e){}
    if(!selected&&wks.length)selected=wks[wks.length-1];
    var selectedIndex=selected?wks.findIndex(function(w){return w&&w.key===selected.key}):-1;
    if(selectedIndex<0)selectedIndex=Math.max(0,wks.length-1);
    var through=wks.slice(0,selectedIndex+1),goal=0;
    try{goal=n(c&&c.goal!=null?c.goal:_rp2Goal(rep))}catch(e){goal=0}
    var weekly=wks.map(function(w){
      var d=(S&&S.data&&S.data[rep+'|'+w.key])||{};
      return {key:w.key,label:w.label||w.key,start:dval(w.start),end:dval(w.end),revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls),entered:!!(n(d.revenue)||n(d.orders)||n(d.calls))}
    });
    var selectedWeek=weekly[selectedIndex]||{key:'',label:'Selected period',revenue:0,orders:0,calls:0};
    var throughRows=weekly.slice(0,selectedIndex+1);
    var qtd={
      revenue:throughRows.reduce(function(s,w){return s+w.revenue},0),
      orders:throughRows.reduce(function(s,w){return s+w.orders},0),
      calls:throughRows.reduce(function(s,w){return s+w.calls},0)
    };
    var prior=selectedIndex>0?weekly[selectedIndex-1]:null;
    var entered=throughRows.filter(function(w){return w.entered}),avg=entered.length?entered.reduce(function(s,w){return s+w.revenue},0)/entered.length:0;
    var projection=avg*wks.length;
    var expected=goal*(throughRows.length/Math.max(1,wks.length));
    var remainingWeeks=Math.max(0,wks.length-throughRows.length);
    var remainingRevenue=Math.max(0,goal-qtd.revenue);
    var requiredWeekly=remainingWeeks?remainingRevenue/remainingWeeks:remainingRevenue;
    return {
      rep:rep,year:year,q:q,wks:wks,weekly:weekly,selected:selected,selectedIndex:selectedIndex,selectedWeek:selectedWeek,
      through:throughRows,goal:goal,qtd:qtd,prior:prior,projection:projection,expected:expected,remainingWeeks:remainingWeeks,
      remainingRevenue:remainingRevenue,requiredWeekly:requiredWeekly
    }
  }
  function ranks(ctx){
    try{
      if(typeof _rp2Ranks==='function'){
        var r=_rp2Ranks();return {rank:_rp2RankOf(r,ctx.rep),total:r.length,rows:r}
      }
    }catch(e){}
    var names=safeArray(S&&S.reps).map(function(r){return typeof r==='string'?r:r&&r.name}).filter(Boolean),rows=names.map(function(rep){
      var rev=ctx.through.reduce(function(s,w){var d=(S&&S.data&&S.data[rep+'|'+w.key])||{};return s+n(d.revenue)},0);
      return {name:rep,revenue:rev}
    }).sort(function(a,b){return b.revenue-a.revenue});
    return {rank:rows.findIndex(function(x){return x.name===ctx.rep})+1,total:rows.length,rows:rows}
  }
  function orderDate(o){
    var d=dval(o&&(o.orderDate||o.date||o.enteredAt));if(d)return d;
    var key=o&&(o.effWeekKey||o.weekKey);
    if(key&&typeof gwq==='function'){
      var p=String(key).split('_'),y=Number(p[0]),q=p[1];
      try{var w=safeArray(gwq(y,q)).filter(function(x){return x&&x.key===key})[0];return w?dval(w.end||w.start):null}catch(e){}
    }
    return null
  }
  function repOrders(){
    var all=safeArray(S&&S.orders).filter(function(o){return o&&o.rep===_rp2.rep});
    return {
      all:all,
      primary:all.filter(function(o){return o.kind==='order'}).map(function(o){o._coachDate=orderDate(o);return o}),
      backorders:all.filter(function(o){return o.kind==='backorder'||o.isBackorder})
    }
  }
  function customerBook(orderData,ctx){
    var map={},now=new Date(),startYear=ctx.year,priorYear=ctx.year-1;
    orderData.primary.forEach(function(o){
      var name=String(o.customer||'').trim();if(!name)return;
      var key=name.toLowerCase(),x=map[key]||(map[key]={name:name,orders:[],revenue:0,current:0,prior:0,last:null});
      x.orders.push(o);x.revenue+=n(o.total);
      var d=o._coachDate;if(d){
        if(!x.last||d>x.last)x.last=d;
        if(d.getFullYear()===startYear)x.current+=n(o.total);
        if(d.getFullYear()===priorYear)x.prior+=n(o.total)
      }
    });
    var rows=Object.keys(map).map(function(k){
      var x=map[k];x.orderCount=x.orders.length;x.aov=x.orderCount?x.revenue/x.orderCount:0;x.daysSince=x.last?diffDays(x.last,now):null;
      x.change=x.prior>0?(x.current-x.prior)/x.prior*100:(x.current>0?100:0);
      return x
    }).sort(function(a,b){return b.current-a.current||b.revenue-a.revenue});
    var currentTotal=rows.reduce(function(s,x){return s+x.current},0),top5=rows.slice(0,5).reduce(function(s,x){return s+x.current},0);
    var dormant=rows.filter(function(x){return x.daysSince!=null&&x.daysSince>120&&x.revenue>0}).sort(function(a,b){return b.revenue-a.revenue});
    var declining=rows.filter(function(x){return x.prior>0&&x.current<x.prior*.85}).sort(function(a,b){return (a.current-a.prior)-(b.current-b.prior)});
    var oneAndDone=rows.filter(function(x){return x.orderCount===1}).sort(function(a,b){return b.revenue-a.revenue});
    return {rows:rows,currentTotal:currentTotal,top5Share:currentTotal?top5/currentTotal*100:0,dormant:dormant,declining:declining,oneAndDone:oneAndDone}
  }
  function activeReviews(){
    try{
      if(typeof _rvEnriched==='function'&&typeof _rvActive==='function'){
        return safeArray(_rvActive(_rvEnriched())).filter(function(x){return x&&x.matched&&x.repName===_rp2.rep}).map(function(x){var r=x.raw||{};return {stars:n(r.stars),msg:String(r.msg||''),date:dval(x.date||r.ts),platform:x.platform||r.type||''}})
      }
    }catch(e){}
    var R=S&&S.reviews||{},fix=R.repFix||{},dec=R.decisions||{},seen={};
    return safeArray(R.rows).map(function(r){
      if(!r)return null;
      var id=String(r.id!=null?r.id:(String(r.ts||'')+'|'+String(r.msg||'').slice(0,50))),msg=String(r.msg||'').toLowerCase().replace(/\s+/g,' ').trim();
      if(dec[id]==='removed')return null;
      if(msg&&seen[msg]&&dec[id]!=='approved')return null;
      if(msg)seen[msg]=1;
      var rep=Object.prototype.hasOwnProperty.call(fix,id)?fix[id]:r.rep;
      if(rep!==_rp2.rep)return null;
      return {stars:n(r.stars),msg:String(r.msg||''),date:dval(r.ts),platform:r.type||''}
    }).filter(Boolean)
  }
  function reviewIntel(){
    var rows=activeReviews(),rated=rows.filter(function(r){return r.stars>0}),avg=rated.length?rated.reduce(function(s,r){return s+r.stars},0)/rated.length:0,map={};
    REVIEW_THEMES.forEach(function(t){map[t.id]={id:t.id,name:t.name,count:0}});
    rows.forEach(function(r){var s=r.msg.toLowerCase();REVIEW_THEMES.forEach(function(t){if(t.words.some(function(w){return s.indexOf(w)>=0}))map[t.id].count++})});
    var themes=Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return b.count-a.count});
    return {rows:rows,count:rows.length,rated:rated.length,avg:avg,five:rows.filter(function(r){return r.stars>=5}).length,topTheme:themes[0]&&themes[0].count?themes[0]:null}
  }
  function qualityIntel(ctx){
    var art=safeArray(S&&S.artErrors).filter(function(a){return a&&a.rep===ctx.rep}),credits=safeArray(S&&S.cms).filter(function(c){return c&&c.rep===ctx.rep});
    var weekKey=ctx.selected&&ctx.selected.key,periodArt=art.filter(function(a){return a.weekKey===weekKey}),periodCredits=credits.filter(function(c){return c.weekKey===weekKey});
    var artTypes={},creditTotal=credits.reduce(function(s,c){return s+n(c.amount)},0);
    art.forEach(function(a){var k=String(a.type||'Other').replace(/_/g,' ');artTypes[k]=(artTypes[k]||0)+1});
    var topArt=Object.keys(artTypes).map(function(k){return {name:k.replace(/\b\w/g,function(x){return x.toUpperCase()}),count:artTypes[k]}}).sort(function(a,b){return b.count-a.count})[0]||null;
    return {art:art,credits:credits,periodArt:periodArt,periodCredits:periodCredits,creditTotal:creditTotal,topArt:topArt}
  }
  function productionFeed(){
    var rows=[],updated=null,source='No production feed';
    try{
      var cfg=typeof getProductionFeedSettings==='function'?getProductionFeedSettings():JSON.parse(localStorage.getItem('salesTracker_productionFeed')||'null');
      if(cfg&&safeArray(cfg.rows).length){rows=safeArray(cfg.rows);updated=dval(cfg.lastRefresh);source='Admin production feed'}
    }catch(e){}
    if(!rows.length){
      try{var p=S&&S.companyKnowledge&&S.companyKnowledge.production;if(p&&safeArray(p.rows).length){rows=safeArray(p.rows);updated=dval(p.lastFetched);source='Company Knowledge feed'}}catch(e){}
    }
    if(!rows.length){
      try{var legacy=JSON.parse(localStorage.getItem('tcp_production_rows')||'null');if(safeArray(legacy).length){rows=safeArray(legacy);source='Legacy production snapshot'}}catch(e){}
    }
    var now=new Date(),methods=rows.map(function(r){
      var ship=dval(r.shipWeek||r.ship||r.shipDate||r.date),lead=ship?diffDays(now,ship):n(String(r.leadDays||r.leadTime||r.lead||'').match(/\d+/)&&String(r.leadDays||r.leadTime||r.lead).match(/\d+/)[0]);
      return {name:String(r.decoration||r.name||r.method||'Method'),ship:ship,lead:lead}
    });
    return {source:source,rows:rows,methods:methods,updated:updated,age:updated?diffDays(updated,now):null,extended:methods.filter(function(m){return m.lead>16||m.lead<0}).length}
  }
  function openOrderRisks(orderData,quality,prod){
    var artBy={},creditBy={};
    quality.art.forEach(function(a){var k=String(a.so||a.soNum||'').toLowerCase().replace(/\s+/g,'');if(k)artBy[k]=(artBy[k]||0)+1});
    quality.credits.forEach(function(c){var k=String(c.soNum||c.so||'').toLowerCase().replace(/\s+/g,'');if(k)creditBy[k]=(creditBy[k]||0)+1});
    return orderData.primary.map(function(o){
      var closed=/closed|complete|completed|shipped|invoiced|cancel|void/i.test(String(o.status||''));if(closed)return null;
      var so=String(o.orderNum||o.base||'').toLowerCase().replace(/\s+/g,''),age=o._coachDate?diffDays(o._coachDate,new Date()):null,reasons=[],score=0;
      if(/hold|delay|problem|pending|backorder/i.test(String(o.status||''))){reasons.push('status '+String(o.status));score+=4}
      if(artBy[so]){reasons.push(artBy[so]+' art issue');score+=2+artBy[so]}
      if(creditBy[so]){reasons.push(creditBy[so]+' credit memo');score+=2}
      if(age!=null&&age>21){reasons.push(age+' days open');score+=Math.min(4,Math.floor(age/21))}
      var family=orderData.all.filter(function(x){return String(x.base||x.orderNum||'').toLowerCase().replace(/\s+/g,'')===String(o.base||o.orderNum||'').toLowerCase().replace(/\s+/g,'')});
      var bo=family.filter(function(x){return x.kind==='backorder'||x.isBackorder}).length;if(bo){reasons.push(bo+' backorder line');score+=4}
      return score?{order:o,score:score,reasons:reasons,age:age}:null
    }).filter(Boolean).sort(function(a,b){return b.score-a.score||n(b.order.total)-n(a.order.total)})
  }
  function momentum(ctx){
    var entered=ctx.through.filter(function(w){return w.entered}),recent=entered.slice(-3),prior=entered.slice(-6,-3);
    var ravg=recent.length?recent.reduce(function(s,w){return s+w.revenue},0)/recent.length:0,pavg=prior.length?prior.reduce(function(s,w){return s+w.revenue},0)/prior.length:0;
    var delta=pavg?(ravg-pavg)/pavg*100:(ravg?100:0);
    return {recent:recent,prior:prior,recentAvg:ravg,priorAvg:pavg,delta:delta}
  }
  function dataSources(ctx,orders,customers,reviews,quality,prod){
    return [
      {name:'Weekly scorecards',on:ctx.weekly.some(function(w){return w.entered}),value:ctx.weekly.filter(function(w){return w.entered}).length+' entered weeks',copy:'Revenue, calls, orders, pace, forecast, and coaching history.'},
      {name:'Orders & customers',on:orders.primary.length>0,value:orders.primary.length+' primary orders',copy:'Customer growth, AOV, concentration, dormant accounts, and open-order signals.'},
      {name:'Customer reviews',on:reviews.count>0,value:reviews.count+' active reviews',copy:'Customer reputation, praise strengths, and service identity.'},
      {name:'Quality records',on:quality.art.length+quality.credits.length>0,value:(quality.art.length+quality.credits.length)+' records',copy:'Art-error patterns, credit impact, and prevention coaching.'},
      {name:'Production feed',on:prod.rows.length>0,value:prod.rows.length+' methods',copy:'Current production posture and promise sensitivity.'},
      {name:'Rep identity scope',on:true,value:ctx.rep,copy:'Every recommendation is generated only from the logged-in rep’s data.'}
    ]
  }
  function scores(g){
    var ctx=g.ctx,goal=ctx.goal,expected=ctx.expected,revScore=goal?clamp(expected?ctx.qtd.revenue/expected*78:0,0,100):65;
    if(goal&&ctx.qtd.revenue>=expected)revScore=Math.min(100,78+(ctx.qtd.revenue-expected)/Math.max(1,expected)*22);
    var callTarget=Math.max(1,ctx.through.length*125),activity=clamp(ctx.qtd.calls/callTarget*100,0,100);
    var customer=75;
    if(g.customers.top5Share>80)customer-=18;else if(g.customers.top5Share>65)customer-=8;
    customer-=Math.min(15,g.customers.dormant.length*2);customer+=Math.min(12,g.customers.rows.filter(function(x){return x.change>15}).length*2);
    customer=clamp(customer,20,100);
    var quality=100-Math.min(45,g.quality.periodArt.length*12+g.quality.periodCredits.length*9)-Math.min(25,g.quality.art.length*1.4+g.quality.credits.length);
    quality=clamp(quality,10,100);
    var reputation=g.reviews.rated?clamp(g.reviews.avg/5*100,0,100):(g.reviews.count?75:55);
    var ops=78;
    if(g.prod.rows.length===0)ops-=15;
    if(g.prod.age!=null&&g.prod.age>3)ops-=15;
    if(g.prod.extended)ops-=Math.min(18,g.prod.extended*5);
    ops-=Math.min(24,g.openRisks.length*4);ops=clamp(ops,15,100);
    var overall=Math.round(revScore*.30+activity*.18+customer*.16+quality*.15+reputation*.09+ops*.12);
    return {
      overall:overall,
      rows:[
        {id:'revenue',name:'Revenue Pace',score:Math.round(revScore),copy:goal?Math.round(ctx.qtd.revenue/Math.max(1,expected)*100)+'% of selected-point pace':'Goal unavailable'},
        {id:'activity',name:'Activity',score:Math.round(activity),copy:ctx.qtd.calls+' of '+callTarget+' cumulative call target'},
        {id:'customer',name:'Customer Growth',score:Math.round(customer),copy:g.customers.dormant.length+' dormant · '+Math.round(g.customers.top5Share)+'% top-five share'},
        {id:'quality',name:'Quality',score:Math.round(quality),copy:g.quality.periodArt.length+' period art · '+g.quality.periodCredits.length+' period credits'},
        {id:'reputation',name:'Reputation',score:Math.round(reputation),copy:g.reviews.rated?g.reviews.avg.toFixed(1)+' star average':'Limited review rating history'},
        {id:'operations',name:'Operations',score:Math.round(ops),copy:g.openRisks.length+' open-order watch signals'}
      ]
    }
  }
  function strengthCards(g){
    var out=[],ctx=g.ctx;
    if(g.reviews.topTheme)out.push({icon:'⭐',label:'Customer-recognized strength',title:g.reviews.topTheme.name,copy:g.reviews.topTheme.count+' active review'+(g.reviews.topTheme.count===1?'':'s')+' reinforce this customer-service strength.'});
    if(g.rank.rank&&g.rank.rank<=3)out.push({icon:'🏆',label:'Competitive position',title:'#'+g.rank.rank+' of '+g.rank.total,copy:'Your selected-point cumulative revenue ranks inside the top three.'});
    if(g.momentum.delta>15)out.push({icon:'↗',label:'Momentum strength',title:Math.round(g.momentum.delta)+'% recent acceleration',copy:'Your recent three entered weeks average more revenue than the prior three-week comparison.'});
    if(g.quality.periodArt.length===0&&g.quality.periodCredits.length===0)out.push({icon:'✓',label:'Selected-period quality',title:'Clean selected period',copy:'No art errors or credit memos are tied to the selected week.'});
    var largest=g.orders.primary.slice().sort(function(a,b){return n(b.total)-n(a.total)})[0];
    if(largest)out.push({icon:'💎',label:'Order capability',title:money(largest.total)+' largest recorded order',copy:'Use the customer, product mix, and selling motion behind this order as a repeatable model.'});
    if(!out.length)out.push({icon:'🧭',label:'Strength still forming',title:'Use the next clean win as the model',copy:'The connected history is still limited. Focus on creating one clear success pattern the coach can reinforce.'});
    return out.slice(0,4)
  }
  function priorities(g){
    var ctx=g.ctx,out=[],pacePct=ctx.goal?ctx.qtd.revenue/Math.max(1,ctx.expected)*100:100,callTarget=Math.max(1,ctx.through.length*125),callGap=Math.max(0,callTarget-ctx.qtd.calls);
    function add(id,score,tone,title,why,action,measure,page){out.push({id:id,score:score,tone:tone,title:title,why:why,action:action,measure:measure,page:page})}
    if(ctx.goal&&pacePct<95)add('revenue',100+(95-pacePct),'risk','Protect the quarter revenue pace','You are at '+Math.round(pacePct)+'% of the cumulative revenue pace implied by the quarter goal.','Build the next customer block around '+money(ctx.requiredWeekly)+' per remaining quarter week. Start with the highest-probability repeat and dormant-account opportunities.','Create '+money(Math.min(ctx.requiredWeekly,ctx.remainingRevenue))+' of qualified next-step revenue','forecast');
    if(callGap>0)add('calls',88+Math.min(20,callGap/10),'warn','Close the cumulative activity gap','Recorded calls are '+callGap+' below the cumulative target through the selected week.','Schedule two protected outbound blocks and use the Next 5 Calls list instead of starting from a blank page.','Add '+Math.min(callGap,Math.max(25,callGap))+' customer/contact calls','dash');
    if(g.customers.dormant.length)add('dormant',82+Math.min(15,g.customers.dormant.length),'info','Reactivate valuable dormant accounts',g.customers.dormant.length+' recorded customer'+(g.customers.dormant.length===1?' is':'s are')+' beyond 120 days since the latest uploaded order.','Call the top dormant accounts with a specific seasonal, reorder, or product-expansion reason.','Secure next steps with '+Math.min(3,g.customers.dormant.length)+' dormant accounts','customers');
    if(g.customers.top5Share>70)add('concentration',78+(g.customers.top5Share-70),'warn','Reduce customer concentration risk','The top five customers represent '+Math.round(g.customers.top5Share)+'% of recorded current-year customer revenue.','Pair account protection with new-logo and one-and-done follow-up so growth is not dependent on a narrow group.','Advance 2 customers outside the current top five','customers');
    if(g.openRisks.length)add('orders',92+Math.min(12,g.openRisks.length*2),'risk','Update risk-sensitive open orders before escalation',g.openRisks.length+' recorded open order'+(g.openRisks.length===1?' has':'s have')+' status, age, backorder, quality, or handoff watch signals.','Review the highest-score orders, verify actual production status, and send a proactive customer update with the next confirmed milestone.','Document updates on the top '+Math.min(3,g.openRisks.length)+' watch orders','production');
    if(g.quality.periodArt.length||g.quality.periodCredits.length)add('quality',90+(g.quality.periodArt.length*5+g.quality.periodCredits.length*3),'risk','Tighten the quality checkpoint for this period','The selected week includes '+g.quality.periodArt.length+' art error'+(g.quality.periodArt.length===1?'':'s')+' and '+g.quality.periodCredits.length+' credit memo'+(g.quality.periodCredits.length===1?'':'s')+'.','Use the specific Art Errors prevention checkpoint before the next proof/order handoff and verify any affected customer follow-up.','Complete one documented second-check on every risk-sensitive order','arterrors');
    if(g.prod.rows.length===0||g.prod.age>3||g.prod.extended)add('production',76+(g.prod.extended*4),'warn','Confirm production timing before promising dates',g.prod.rows.length===0?'No current production feed is connected.':((g.prod.age>3?'The production snapshot is '+g.prod.age+' days old. ':'')+(g.prod.extended?g.prod.extended+' method'+(g.prod.extended===1?' has':'s have')+' an extended or past-dated window.':'')),'Refresh the production source or verify timing manually before giving a firm in-hands commitment.','Confirm production + shipping on every tight-date opportunity','production');
    if(g.reviews.topTheme)add('strength',55,'good','Use your customer-recognized strength deliberately','Customers most often recognize your '+g.reviews.topTheme.name.toLowerCase()+'.','Bring that strength into today’s follow-up conversations—especially on difficult, dormant, or risk-sensitive accounts.','Use the strength in 3 intentional customer conversations','reviews');
    if(ctx.goal&&pacePct>=100)add('paceWin',60,'good','Protect the pace without becoming passive','You are currently at or above the cumulative pace implied by the quarter goal.','Keep the activity floor steady and focus on order quality, customer expansion, and the next two weeks of pipeline.','Maintain pace while advancing 3 future opportunities','forecast');
    out.sort(function(a,b){return b.score-a.score});
    return out.slice(0,5)
  }
  function nextCalls(g){
    var out=[],seen={};
    function add(c,reason,opener,kind){
      if(!c||!c.name||seen[c.name.toLowerCase()]||out.length>=5)return;
      seen[c.name.toLowerCase()]=1;out.push({name:c.name,reason:reason,opener:opener,kind:kind,revenue:c.revenue||c.current||0,last:c.last})
    }
    g.customers.dormant.forEach(function(c){add(c,'High-value dormant account · '+money(c.revenue)+' recorded lifetime revenue','“I was reviewing your past orders and wanted to reconnect before the next seasonal need. What is coming up that we should start planning now?”','Win back')});
    g.customers.declining.forEach(function(c){add(c,'Current-year revenue is below the prior-year recorded level','“I wanted to check in because your ordering pattern looks different this year. Has the need changed, or is there an opportunity we have not helped you plan yet?”','Protect')});
    g.customers.oneAndDone.forEach(function(c){add(c,'One recorded primary order · '+money(c.revenue)+' lifetime value','“I wanted to follow up on your first order and make sure we are positioned for the next need. What worked well, and what should we improve or expand next time?”','Convert')});
    g.customers.rows.slice(0,10).forEach(function(c){add(c,'Established account with expansion potential','“I have been reviewing the mix of what you have purchased from us. Where could we make the next program easier or add another product category?”','Expand')});
    g.openRisks.forEach(function(x){var o=x.order;add({name:o.customer||o.orderNum,revenue:n(o.total),last:o._coachDate},'Open-order communication check · '+x.reasons.join(', '),'“I wanted to give you a proactive update before you had to ask. I’m verifying the next milestone now and will follow up with the confirmed timing.”','Update')});
    return out.slice(0,5)
  }
  function risks(g){
    var out=[];
    if(g.openRisks.length)out.push({icon:'📦',tone:'risk',name:g.openRisks.length+' open-order watch signal'+(g.openRisks.length===1?'':'s'),copy:'Status, age, quality, backorder, or handoff signals require verification.',action:'Review Production Intelligence'});
    if(g.quality.art.length)out.push({icon:'🎨',tone:'warn',name:g.quality.art.length+' lifetime art error'+(g.quality.art.length===1?'':'s'),copy:g.quality.topArt?('Most common type: '+g.quality.topArt.name+'.'):'Review recurring art-error patterns.',action:'Use prevention checkpoint'});
    if(g.quality.credits.length)out.push({icon:'↩',tone:'warn',name:money(g.quality.creditTotal)+' lifetime credit impact',copy:g.quality.credits.length+' credit memo'+(g.quality.credits.length===1?'':'s')+' are assigned to this rep.',action:'Review causes and customers'});
    if(g.customers.top5Share>70)out.push({icon:'🏢',tone:'warn',name:Math.round(g.customers.top5Share)+'% top-five customer share',copy:'Customer concentration can create volatility when one large account slows.',action:'Advance non-top-five accounts'});
    if(g.prod.rows.length===0||g.prod.age>3)out.push({icon:'🏭',tone:'risk',name:g.prod.rows.length?'Production feed may be stale':'Production feed unavailable',copy:g.prod.rows.length?('Newest dated update is '+g.prod.age+' days old.'):'Current promise guidance is incomplete.',action:'Refresh before promising dates'});
    if(!out.length)out.push({icon:'✓',tone:'good',name:'No major connected risk signal',copy:'The connected quality, customer, production, and order data does not show a high-priority exception.',action:'Maintain the process'});
    return out.slice(0,7)
  }
  function cadence(g){
    var ps=g.priorities,calls=g.calls,days=['Today','Next workday','Midweek block','Late-week block','Week close'];
    var defaults=[
      {title:ps[0]?ps[0].title:'Create the week’s first meaningful win',copy:ps[0]?ps[0].action:'Choose the highest-probability customer action and complete it before lower-value administrative work.',measure:ps[0]?ps[0].measure:'One documented customer next step'},
      {title:'Run the Next 5 Calls list',copy:'Work through the coach-ranked accounts with a specific reason for each conversation.',measure:Math.min(5,calls.length)+' focused customer conversations'},
      {title:'Check quality and production handoffs',copy:'Review risk-sensitive orders, current production posture, and the prevention checkpoint tied to your art history.',measure:'Zero unverified deadline promises'},
      {title:ps[1]?ps[1].title:'Expand an existing customer',copy:ps[1]?ps[1].action:'Use a repeat, cross-sell, or program-expansion conversation.',measure:ps[1]?ps[1].measure:'One new expansion opportunity'},
      {title:'Close the week with a real pipeline handoff',copy:'Document what moved, what did not, and the first three customer actions for the next week.',measure:'Three scheduled next steps'}
    ];
    return defaults.map(function(x,i){return {label:days[i],title:x.title,copy:x.copy,measure:x.measure,today:i===0}})
  }
  function history(ctx){
    return ctx.weekly.map(function(w,i){
      var pace=ctx.goal?ctx.goal/Math.max(1,ctx.wks.length):0,focus='Build customer momentum';
      if(w.calls<100)focus='Activity and outbound consistency';
      if(pace&&w.revenue<pace*.75)focus='Revenue pace and opportunity creation';
      var art=safeArray(S&&S.artErrors).filter(function(a){return a&&a.rep===ctx.rep&&a.weekKey===w.key}).length;
      var cr=safeArray(S&&S.cms).filter(function(c){return c&&c.rep===ctx.rep&&c.weekKey===w.key}).length;
      if(art||cr)focus='Quality recovery and prevention';
      if(w.revenue>=pace&&w.calls>=100)focus='Protect pace and expand customer value';
      return {key:w.key,label:w.label,revenue:w.revenue,orders:w.orders,calls:w.calls,focus:focus,selected:i===ctx.selectedIndex}
    }).reverse()
  }
  function build(){
    var ctx=currentContext(),rank=ranks(ctx),orders=repOrders(),customers=customerBook(orders,ctx),reviews=reviewIntel(),quality=qualityIntel(ctx),prod=productionFeed(),openRisks=openOrderRisks(orders,quality,prod),mom=momentum(ctx);
    var g={ctx:ctx,rank:rank,orders:orders,customers:customers,reviews:reviews,quality:quality,prod:prod,openRisks:openRisks,momentum:mom};
    g.sources=dataSources(ctx,orders,customers,reviews,quality,prod);
    g.scores=scores(g);g.strengths=strengthCards(g);g.priorities=priorities(g);g.calls=nextCalls(g);g.risks=risks(g);g.cadence=cadence(g);g.history=history(ctx);
    g.completed=loadCompleted(ctx);
    return g
  }
  function planKey(ctx){return 'tcp_rp_ai_plan_v503|'+ctx.rep+'|'+(ctx.selected&&ctx.selected.key||ctx.q+'_'+ctx.year)}
  function loadCompleted(ctx){try{return JSON.parse(localStorage.getItem(planKey(ctx))||'{}')||{}}catch(e){return {}}}
  function saveCompleted(ctx,obj){try{localStorage.setItem(planKey(ctx),JSON.stringify(obj||{}))}catch(e){}}
  function posture(g){
    var s=g.scores.overall,ctx=g.ctx,title,copy,tone;
    if(s>=85){title='You are operating from a position of strength';tone='good'}
    else if(s>=70){title='The foundation is solid, but the next moves matter';tone='info'}
    else if(s>=55){title='There is recoverable pressure in the current picture';tone='warn'}
    else{title='The current period needs a focused reset';tone='risk'}
    var p=g.priorities[0];
    copy='Your directional coaching score is '+s+'/100 across revenue pace, activity, customer growth, quality, reputation, and operations. ';
    copy+=p?('The highest-value move is to '+p.title.toLowerCase()+'. '):'';
    if(g.strengths[0])copy+='Your strongest connected signal is '+g.strengths[0].title.toLowerCase()+'.';
    return {title:title,copy:copy,tone:tone}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-ac-section-head"><div><div class="rp2-ac-section-kick">'+kick+'</div><div class="rp2-ac-section-title">'+title+'</div></div><div class="rp2-ac-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-ac-kpi"><div class="rp2-ac-kpi-label">'+esc(label)+'</div><div class="rp2-ac-kpi-value">'+value+'</div><div class="rp2-ac-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-ac-tabs-wrap"><div class="rp2-ac-tabs">'+TABS.map(function(t){return '<button class="rp2-ac-tab '+(t.id===active?'active':'')+'" onclick="_rp2AISetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function scoreCards(g){return '<div class="rp2-ac-score-grid">'+g.scores.rows.map(function(x){return '<div class="rp2-ac-score-card"><div class="rp2-ac-score-name">'+esc(x.name)+'</div><div class="rp2-ac-score-value">'+x.score+'</div><div class="rp2-ac-score-bar"><span style="width:'+x.score+'%"></span></div><div class="rp2-ac-score-copy">'+esc(x.copy)+'</div></div>'}).join('')+'</div>'}
  function prioritiesHTML(g,limit){
    var rows=g.priorities.slice(0,limit||5);
    return '<div class="rp2-ac-priority-list">'+rows.map(function(p,i){
      var done=!!g.completed[p.id];
      return '<div class="rp2-ac-priority '+p.tone+'"><div class="rp2-ac-rank">'+(i+1)+'</div><div><div class="rp2-ac-priority-kick">'+esc(p.tone==='good'?'Strength to leverage':'Priority '+(i+1))+'</div><div class="rp2-ac-priority-title">'+esc(p.title)+'</div><div class="rp2-ac-priority-why">'+esc(p.why)+'</div><div class="rp2-ac-action"><strong>Do this:</strong> '+esc(p.action)+'</div></div><div class="rp2-ac-measure"><span>Success measure</span><strong>'+esc(p.measure)+'</strong><button class="rp2-ac-done-btn '+(done?'done':'')+'" onclick="_rp2AITogglePriority(\''+esc(p.id)+'\')">'+(done?'✓ Completed locally':'Mark complete')+'</button><div class="rp2-ac-local">Stored only in this browser for the selected week.</div></div></div>'
    }).join('')+'</div>'
  }
  function strengthsHTML(g){return '<div class="rp2-ac-grid-4">'+g.strengths.map(function(x){return '<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">'+x.icon+'</div><div class="rp2-ac-strength-label">'+esc(x.label)+'</div><div class="rp2-ac-strength-title">'+esc(x.title)+'</div><div class="rp2-ac-strength-copy">'+esc(x.copy)+'</div></div>'}).join('')+'</div>'}
  function callsHTML(g){
    if(!g.calls.length)return '<div class="rp2-ac-empty"><strong>No customer call targets could be built</strong><span>Customer-level order history needs customer names and order dates for ranked call recommendations.</span></div>';
    return '<div class="rp2-ac-call-list">'+g.calls.map(function(c,i){return '<div class="rp2-ac-call"><div class="rp2-ac-call-num">'+(i+1)+'</div><div class="rp2-ac-call-name">'+esc(c.name)+'<small>'+esc(c.kind)+' · '+money(c.revenue)+(c.last?' · Last '+fmtDate(c.last):'')+'</small></div><div class="rp2-ac-call-reason">'+esc(c.reason)+'</div><div class="rp2-ac-opener">'+esc(c.opener)+'</div></div>'}).join('')+'</div>'
  }
  function risksHTML(g){return '<div class="rp2-ac-risk-list">'+g.risks.map(function(r){return '<div class="rp2-ac-risk '+r.tone+'"><div class="rp2-ac-risk-icon">'+r.icon+'</div><div class="rp2-ac-risk-name">'+esc(r.name)+'<small>'+esc(r.copy)+'</small></div><div class="rp2-ac-risk-action">'+esc(r.action)+'</div></div>'}).join('')+'</div>'}
  function cadenceHTML(g){return '<div class="rp2-ac-cadence">'+g.cadence.map(function(d){return '<div class="rp2-ac-day '+(d.today?'today':'')+'"><div class="rp2-ac-day-label">'+esc(d.label)+'</div><div class="rp2-ac-day-title">'+esc(d.title)+'</div><div class="rp2-ac-day-copy">'+esc(d.copy)+'</div><div class="rp2-ac-day-measure">'+esc(d.measure)+'</div></div>'}).join('')+'</div>'}
  function sourceHTML(g){return '<div class="rp2-ac-source-grid">'+g.sources.map(function(s){return '<div class="rp2-ac-source '+(s.on?'on':'off')+'"><div class="rp2-ac-source-label">'+esc(s.name)+'</div><div class="rp2-ac-source-value">'+esc(s.value)+'</div><div class="rp2-ac-source-copy">'+esc(s.copy)+'</div></div>'}).join('')+'</div>'}
  function coachDashboard(g){
    var p=posture(g);
    return sectionHead('Cross-system coaching read','One interpretation across the entire Rep Portal','The score is directional coaching guidance—not compensation, discipline, or a replacement for manager judgment.')
      +'<div class="rp2-ac-summary"><div class="rp2-ac-summary-label">Coach’s read</div><div class="rp2-ac-summary-title">'+esc(p.title)+'</div><div class="rp2-ac-summary-copy">'+esc(p.copy)+'</div></div>'
      +sectionHead('Coaching dimensions','Where the current picture is strong or pressured','Each dimension uses only this rep’s connected data through the selected week, plus current production state where relevant.')
      +scoreCards(g)
      +sectionHead('Your next three moves','Ranked by likely impact','Every priority includes the reason, the action, and a measurable finish line.')
      +prioritiesHTML(g,3)
      +sectionHead('Strengths to leverage','Do not coach only from deficits','These are the strongest positive patterns visible across customers, reviews, quality, orders, momentum, and rank.')
      +strengthsHTML(g)
      +sectionHead('Momentum and selected-week context','Revenue, calls, and orders across the quarter','The chart ends at the selected week so historical coaching remains point-in-time accurate.')
      +'<div class="rp2-ac-panel"><div class="rp2-ac-chart"><canvas id="rp2-ac-chart"></canvas></div></div>'
      +sectionHead('Connected coaching sources','What the coach can and cannot see','Missing sources lower the depth of coaching. The coach never uses another rep’s private figures.')
      +sourceHTML(g)
  }
  function planView(g){
    return sectionHead('Weekly action plan','Turn the coaching read into execution','Completed actions are saved only in this browser for the selected rep and selected week. They do not alter manager data.')
      +prioritiesHTML(g,5)
      +sectionHead('Five-block operating cadence','A practical sequence for the rest of the week','The blocks can be moved to match the rep’s schedule; the order is based on urgency and leverage.')
      +cadenceHTML(g)
      +sectionHead('Your next five calls','No blank-page prospecting','Targets are ranked from dormant, declining, one-and-done, expansion, and open-order communication opportunities.')
      +'<div class="rp2-ac-panel">'+callsHTML(g)+'</div>'
  }
  function growthView(g){
    var ctx=g.ctx;
    return sectionHead('Growth opportunities','Where the next revenue is most likely to come from','Customer recommendations are derived from uploaded order history, not invented pipeline stages.')
      +'<div class="rp2-ac-grid-4">'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">🛌</div><div class="rp2-ac-strength-label">Dormant accounts</div><div class="rp2-ac-strength-title">'+g.customers.dormant.length+'</div><div class="rp2-ac-strength-copy">Customers beyond 120 days since their latest recorded primary order.</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">↘</div><div class="rp2-ac-strength-label">Declining accounts</div><div class="rp2-ac-strength-title">'+g.customers.declining.length+'</div><div class="rp2-ac-strength-copy">Customers with current-year recorded revenue at least 15% below the prior year.</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">1×</div><div class="rp2-ac-strength-label">One-and-done customers</div><div class="rp2-ac-strength-title">'+g.customers.oneAndDone.length+'</div><div class="rp2-ac-strength-copy">Customers with only one uploaded primary order.</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">🏢</div><div class="rp2-ac-strength-label">Top-five concentration</div><div class="rp2-ac-strength-title">'+Math.round(g.customers.top5Share)+'%</div><div class="rp2-ac-strength-copy">Share of recorded '+ctx.year+' customer revenue represented by the top five accounts.</div></div>'
      +'</div>'
      +sectionHead('Ranked customer conversations','The strongest immediate call list','Each opener is a starting point; the rep should adapt it to the actual relationship and current customer need.')
      +'<div class="rp2-ac-panel">'+callsHTML(g)+'</div>'
      +sectionHead('Customer strategy','Protect, reactivate, convert, and expand','A balanced week should not depend on only one type of account.')
      +'<div class="rp2-ac-grid-3">'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">🛡</div><div class="rp2-ac-strength-label">Protect</div><div class="rp2-ac-strength-title">Declining and concentrated accounts</div><div class="rp2-ac-strength-copy">Understand what changed, secure the next need, and avoid assuming historical volume will repeat automatically.</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">🔄</div><div class="rp2-ac-strength-label">Reactivate</div><div class="rp2-ac-strength-title">Dormant high-value accounts</div><div class="rp2-ac-strength-copy">Lead with a relevant seasonal, reorder, or program-planning reason instead of a generic check-in.</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">↗</div><div class="rp2-ac-strength-label">Expand</div><div class="rp2-ac-strength-title">One-and-done and established customers</div><div class="rp2-ac-strength-copy">Move from one product/order into a repeat cadence, additional department, or complementary decoration/product category.</div></div>'
      +'</div>'
  }
  function riskView(g){
    return sectionHead('Risk and quality','See the exceptions before they become escalations','The coach connects open orders, art errors, credit memos, customer concentration, and production-source health.')
      +'<div class="rp2-ac-grid-2"><div class="rp2-ac-panel"><div class="rp2-ac-panel-title">Current risk signals</div><div class="rp2-ac-panel-sub">Prompts to verify and act—not automatic proof of a missed commitment.</div>'+risksHTML(g)+'</div><div class="rp2-ac-panel"><div class="rp2-ac-panel-title">Recommended prevention posture</div><div class="rp2-ac-panel-sub">The most important operational habits for this rep’s connected history.</div><div class="rp2-ac-risk-list">'
      +'<div class="rp2-ac-risk warn"><div class="rp2-ac-risk-icon">🎨</div><div class="rp2-ac-risk-name">Art checkpoint<small>'+(g.quality.topArt?('Most common lifetime issue: '+esc(g.quality.topArt.name)+'.'):'No dominant art-error type is available.')+'</small></div><div class="rp2-ac-risk-action">Verify the proof against the latest request</div></div>'
      +'<div class="rp2-ac-risk warn"><div class="rp2-ac-risk-icon">📦</div><div class="rp2-ac-risk-name">Open-order communication<small>'+g.openRisks.length+' orders currently carry a connected watch signal.</small></div><div class="rp2-ac-risk-action">Update before the customer asks</div></div>'
      +'<div class="rp2-ac-risk warn"><div class="rp2-ac-risk-icon">🏭</div><div class="rp2-ac-risk-name">Production promise control<small>'+(g.prod.rows.length?(g.prod.extended+' extended/past-dated methods in the current snapshot.'):'No production feed connected.')+'</small></div><div class="rp2-ac-risk-action">Confirm production + shipping</div></div>'
      +'</div></div></div>'
      +sectionHead('Quality record','Lifetime and selected-period impact','Selected-period figures respect the current week selector; lifetime figures provide pattern context.')
      +'<div class="rp2-ac-grid-4">'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">🎨</div><div class="rp2-ac-strength-label">Lifetime art errors</div><div class="rp2-ac-strength-title">'+g.quality.art.length+'</div><div class="rp2-ac-strength-copy">'+(g.quality.topArt?('Most common: '+esc(g.quality.topArt.name)+'.'):'No dominant type.')+'</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">↩</div><div class="rp2-ac-strength-label">Lifetime credit impact</div><div class="rp2-ac-strength-title">'+money(g.quality.creditTotal)+'</div><div class="rp2-ac-strength-copy">'+g.quality.credits.length+' credit memo records assigned to this rep.</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">📅</div><div class="rp2-ac-strength-label">Selected-week art errors</div><div class="rp2-ac-strength-title">'+g.quality.periodArt.length+'</div><div class="rp2-ac-strength-copy">Art records tied to '+esc(g.ctx.selectedWeek.label)+'.</div></div>'
      +'<div class="rp2-ac-strength"><div class="rp2-ac-strength-icon">⚠</div><div class="rp2-ac-strength-label">Open-order watchlist</div><div class="rp2-ac-strength-title">'+g.openRisks.length+'</div><div class="rp2-ac-strength-copy">Orders requiring verification or proactive communication.</div></div>'
      +'</div>'
  }
  function builtInAnswer(q,g){
    var s=String(q||'').toLowerCase(),ctx=g.ctx,p=g.priorities[0],lines=[];
    if(/pace|goal|forecast|revenue/.test(s)){
      lines.push('PACE READ');
      lines.push('• QTD through '+ctx.selectedWeek.label+': '+money(ctx.qtd.revenue));
      lines.push('• Cumulative goal pace: '+money(ctx.expected));
      lines.push('• Run-rate projection: '+money(ctx.projection));
      lines.push('• Remaining revenue to goal: '+money(ctx.remainingRevenue));
      if(ctx.remainingWeeks)lines.push('• Required average per remaining week: '+money(ctx.requiredWeekly));
      lines.push('');
      lines.push(ctx.qtd.revenue>=ctx.expected?'You are currently at or above selected-point pace. Protect activity and future pipeline.':'You are below selected-point pace. Build the next selling block around the highest-probability repeat, dormant, and expansion opportunities.');
    }else if(/call|activity|outbound/.test(s)){
      var target=Math.max(1,ctx.through.length*125),gap=Math.max(0,target-ctx.qtd.calls);
      lines.push('ACTIVITY READ');
      lines.push('• Recorded cumulative calls: '+ctx.qtd.calls);
      lines.push('• Cumulative target through selected week: '+target);
      lines.push('• Gap: '+gap);
      lines.push('');
      lines.push(gap?'Protect two outbound blocks and work the ranked Next 5 Calls list before lower-value admin work.':'The recorded call pace is at or above target. Keep the floor steady while improving conversation quality and next-step discipline.');
    }else if(/customer|account|growth|call next|who should/.test(s)){
      lines.push('CUSTOMER GROWTH READ');
      g.calls.slice(0,5).forEach(function(c,i){lines.push((i+1)+'. '+c.name+' — '+c.reason)});
      lines.push('');
      lines.push('Start with a specific business reason, not a generic “checking in.”');
    }else if(/quality|error|credit|risk/.test(s)){
      lines.push('QUALITY & RISK READ');
      g.risks.slice(0,5).forEach(function(r){lines.push('• '+r.name+' — '+r.action)});
      lines.push('');
      lines.push(g.quality.topArt?('Highest-value art prevention focus: '+g.quality.topArt.name+'.'):'No dominant art-error type is available.');
    }else if(/production|deadline|ship|in-hands|delivery/.test(s)){
      lines.push('PRODUCTION READ');
      lines.push('• Source: '+g.prod.source);
      lines.push('• Methods tracked: '+g.prod.rows.length);
      lines.push('• Extended/past-dated methods: '+g.prod.extended);
      lines.push('• Open-order watch signals: '+g.openRisks.length);
      lines.push('');
      lines.push('Confirm inventory, art approval, production, and shipping before giving a firm date. Use Production Intelligence for a current scenario.');
    }else if(/review|strength|good at|customer say/.test(s)){
      lines.push('STRENGTH READ');
      g.strengths.forEach(function(x){lines.push('• '+x.title+' — '+x.copy)});
    }else if(/week|summary|brief|focus/.test(s)){
      lines.push('COACHING SUMMARY');
      lines.push('Your directional score is '+g.scores.overall+'/100.');
      g.priorities.slice(0,3).forEach(function(x,i){lines.push((i+1)+'. '+x.title+' — '+x.action)});
      if(g.strengths[0])lines.push('');
      if(g.strengths[0])lines.push('Strength to leverage: '+g.strengths[0].title+'.');
    }else{
      lines.push('BEST NEXT MOVE');
      lines.push(p?p.title:'Build one clear customer win.');
      if(p){lines.push('Why: '+p.why);lines.push('Action: '+p.action);lines.push('Success measure: '+p.measure)}
      lines.push('');
      lines.push('Ask about pace, calls, customers, quality, production, strengths, or this week’s plan for a deeper read.');
    }
    return lines.join('\n')
  }
  function aiContext(g){
    return {
      rep:g.ctx.rep,selectedWeek:g.ctx.selectedWeek.label,quarter:g.ctx.q+' '+g.ctx.year,
      performance:{qtdRevenue:g.ctx.qtd.revenue,goal:g.ctx.goal,expectedPace:g.ctx.expected,projection:g.ctx.projection,remainingRevenue:g.ctx.remainingRevenue,requiredWeekly:g.ctx.requiredWeekly,orders:g.ctx.qtd.orders,calls:g.ctx.qtd.calls,rank:g.rank.rank,ofReps:g.rank.total},
      momentum:{recent3Avg:g.momentum.recentAvg,prior3Avg:g.momentum.priorAvg,changePct:g.momentum.delta},
      customers:{count:g.customers.rows.length,dormant:g.customers.dormant.slice(0,5).map(function(x){return {name:x.name,lifetimeRevenue:x.revenue,daysSince:x.daysSince}}),declining:g.customers.declining.slice(0,5).map(function(x){return {name:x.name,current:x.current,prior:x.prior}}),top5Share:g.customers.top5Share},
      reviews:{count:g.reviews.count,avg:g.reviews.avg,topTheme:g.reviews.topTheme&&g.reviews.topTheme.name},
      quality:{artErrors:g.quality.art.length,selectedArtErrors:g.quality.periodArt.length,creditMemos:g.quality.credits.length,creditTotal:g.quality.creditTotal,topArtType:g.quality.topArt&&g.quality.topArt.name},
      operations:{openOrderWatchSignals:g.openRisks.length,productionSource:g.prod.source,productionMethods:g.prod.rows.length,extendedMethods:g.prod.extended},
      priorities:g.priorities.slice(0,5).map(function(x){return {title:x.title,why:x.why,action:x.action,measure:x.measure}})
    }
  }
  function chatHTML(g){
    if(!window._rp2AIChat.length)window._rp2AIChat=[{role:'ai',text:'I have reviewed your selected-period performance and the connected lifetime patterns. Ask me about your pace, next calls, customers, quality, production, or the best move to make today.'}];
    return '<div class="rp2-ac-chat-layout"><div class="rp2-ac-chat-panel"><div id="rp2-ac-chat" class="rp2-ac-chat">'+window._rp2AIChat.map(function(m){return '<div class="rp2-ac-msg '+(m.role==='you'?'you':'ai')+'">'+esc(m.text)+'</div>'}).join('')+'</div><div class="rp2-ac-chat-form"><input id="rp2-ac-q" placeholder="Ask about pace, customers, quality, production, or what to do next…" onkeydown="if(event.key===\'Enter\')_rp2AIAsk()"><button class="rp2-ac-chat-btn" onclick="_rp2AIAsk()">Ask Coach</button></div></div>'
      +'<div class="rp2-ac-panel"><div class="rp2-ac-panel-title">Quick coaching questions</div><div class="rp2-ac-panel-sub">These prompts work in live-AI mode or built-in coaching mode.</div><div class="rp2-ac-prompts">'
      +['Am I on pace to hit my goal?','What should I focus on this week?','Who should my next five calls be?','Where are my customer growth opportunities?','What quality risks need attention?','What can I safely say about production timing?','What are my strongest customer-recognized strengths?'].map(function(q){return '<button class="rp2-ac-prompt" onclick="_rp2AIPrompt(\''+esc(q.replace(/'/g,"\\'"))+'\')">'+esc(q)+'</button>'}).join('')
      +'</div><div class="rp2-ac-mode" style="margin-top:12px;"><strong>'+(typeof callAI==='function'?'Live AI mode available':'Built-in coaching mode')+'</strong>'+(typeof callAI==='function'?'Questions can use the configured AI connection with this rep’s structured context.':'The coach will answer common questions directly from the connected tracker data. No external AI connection is required.')+'</div></div></div>'
  }
  function askView(g){
    return sectionHead('Ask AI Coach','Use the full connected context, not a generic chatbot','The coach is restricted to this rep’s own data. It will not reveal another rep’s private numbers or names.')
      +chatHTML(g)
      +sectionHead('Generate a manager-style weekly brief','A concise readout you can copy into a one-on-one or personal plan','Live AI is used when available; otherwise the built-in coach produces the brief.')
      +'<div class="rp2-ac-panel"><button class="rp2-ac-chat-btn" onclick="_rp2AIGenerateBrief()">Generate weekly brief</button><div id="rp2-ac-brief" class="rp2-ac-summary-copy" style="margin-top:14px;white-space:pre-wrap;"></div></div>'
  }
  function historyView(g){
    return sectionHead('Coaching history','Point-in-time weekly context across the selected quarter','Each row reconstructs the likely coaching focus from the weekly scorecard and quality records. It does not claim an AI conversation happened historically.')
      +'<div class="rp2-ac-history">'+g.history.map(function(h){return '<div class="rp2-ac-history-row '+(h.selected?'selected':'')+'"><div class="rp2-ac-history-cell"><strong>'+esc(h.label)+'</strong></div><div class="rp2-ac-history-cell">Revenue<br><strong>'+money(h.revenue)+'</strong></div><div class="rp2-ac-history-cell">Orders<br><strong>'+h.orders+'</strong></div><div class="rp2-ac-history-cell">Calls<br><strong>'+h.calls+'</strong></div><div class="rp2-ac-history-cell">Status<br><strong>'+(h.selected?'Selected':'Historical')+'</strong></div><div class="rp2-ac-history-focus">'+esc(h.focus)+'</div></div>'}).join('')+'</div>'
      +sectionHead('Quarter coaching trajectory','Revenue, calls, and orders by week','The selected week remains the cutoff for current coaching context.')
      +'<div class="rp2-ac-panel"><div class="rp2-ac-chart"><canvas id="rp2-ac-chart"></canvas></div></div>'
  }

  window._rp2AISetTab=function(id){
    window._rp2AITab=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2AIV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2AIDraw();scrollChat()}catch(e){}},0)
  };
  window._rp2AITogglePriority=function(id){
    var g=build(),obj=loadCompleted(g.ctx);obj[id]=!obj[id];saveCompleted(g.ctx,obj);
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2AIV2();
    setTimeout(function(){try{window._rp2AIDraw()}catch(e){}},0)
  };
  window._rp2AIPrompt=function(q){
    window._rp2AITab='ask';
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2AIV2();
    var inp=document.getElementById('rp2-ac-q');if(inp){inp.value=q;window._rp2AIAsk()}
  };
  function scrollChat(){var box=document.getElementById('rp2-ac-chat');if(box)box.scrollTop=box.scrollHeight}
  window._rp2AIAsk=function(){
    if(window._rp2AIThinking)return;
    var inp=document.getElementById('rp2-ac-q'),q=inp?inp.value.trim():'';
    if(!q)return;
    if(inp)inp.value='';
    var g=build();window._rp2AIChat.push({role:'you',text:q});window._rp2AIChat.push({role:'ai',text:'Thinking…'});window._rp2AIThinking=true;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2AIV2();scrollChat();
    function finish(text){
      window._rp2AIChat[window._rp2AIChat.length-1]={role:'ai',text:text||'No coaching response was generated.'};
      window._rp2AIThinking=false;
      var p=document.getElementById('rp2-page');if(p)p.innerHTML=window._rp2AIV2();scrollChat()
    }
    if(typeof callAI!=='function'){setTimeout(function(){finish(builtInAnswer(q,g))},80);return}
    var prompt='You are the private AI sales coach for '+g.ctx.rep+' at Triple Crown Products. Use only the structured context below. Never reveal or infer another rep’s name, performance, rank details beyond the logged-in rep’s own rank, or private data. Be supportive but direct. Give specific actions and measurable next steps. Clearly distinguish facts from coaching inference. Context: '+JSON.stringify(aiContext(g))+'\n\nRep question: '+q;
    callAI(prompt,{maxTokens:700}).then(function(r){finish((r&&(r.text||r))||builtInAnswer(q,g))}).catch(function(){finish(builtInAnswer(q,g)+'\n\nLive AI was unavailable, so this answer used the built-in coaching engine.')})
  };
  window._rp2AIGenerateBrief=function(){
    var out=document.getElementById('rp2-ac-brief');if(out)out.textContent='Generating…';
    var g=build();
    function fallback(){
      var lines=['WEEKLY COACHING BRIEF — '+g.ctx.selectedWeek.label,'','Current read: '+posture(g).title+'.'];
      lines.push('Directional coaching score: '+g.scores.overall+'/100.');
      lines.push('');
      lines.push('WINS');
      g.strengths.slice(0,3).forEach(function(x){lines.push('• '+x.title+' — '+x.copy)});
      lines.push('');
      lines.push('FOCUS');
      g.priorities.slice(0,3).forEach(function(x){lines.push('• '+x.title+': '+x.action+' Measure: '+x.measure+'.')});
      return lines.join('\n')
    }
    if(typeof callAI!=='function'){if(out)out.textContent=fallback();return}
    var prompt='Write a private weekly coaching brief for '+g.ctx.rep+' using only this context: '+JSON.stringify(aiContext(g))+'. Format: one plain-English current read, 2-3 wins, 3 focus actions, and one closing challenge. Under 250 words. Do not mention other reps by name or reveal their figures.';
    callAI(prompt,{maxTokens:650}).then(function(r){if(out)out.textContent=(r&&(r.text||r))||fallback()}).catch(function(){if(out)out.textContent=fallback()})
  };

  window._rp2AIV2=function(){
    try{
      var g=build(),tab=window._rp2AITab,p=posture(g),ctx=g.ctx,pacePct=ctx.goal?Math.round(ctx.qtd.revenue/Math.max(1,ctx.expected)*100):0;
      var aiMode=typeof callAI==='function'?'Live AI connected':'Built-in coaching active';
      var hero='<div class="rp2-ac-hero"><div class="rp2-ac-hero-grid"><div><div class="rp2-ac-kick">AI Coach 2.0 · CROSS-SYSTEM COACHING · BUILD v503</div><div class="rp2-ac-title">One coach across your entire performance story</div><div class="rp2-ac-copy">Connect the selected-period scorecard with longer-term customer, order, review, quality, and production patterns. The coach ranks what matters, explains why, and gives a measurable next move.</div><div class="rp2-ac-pills"><span class="rp2-ac-pill '+p.tone+'">'+esc(p.title)+'</span><span class="rp2-ac-pill info">'+esc(aiMode)+'</span><span class="rp2-ac-pill">'+g.sources.filter(function(s){return s.on}).length+' data sources connected</span></div></div>'
        +'<div class="rp2-ac-brief"><div><div class="rp2-ac-brief-label">Directional coaching score</div><div class="rp2-ac-score-row"><div class="rp2-ac-score">'+g.scores.overall+'</div><div class="rp2-ac-score-den">/ 100</div></div><div class="rp2-ac-brief-title">'+esc(p.title)+'</div><div class="rp2-ac-brief-copy">'+esc(p.copy)+'</div></div><div class="rp2-ac-brief-foot"><span>Top priority <strong>'+(g.priorities[0]?esc(g.priorities[0].title):'Build one clear win')+'</strong></span><span>Selected period <strong>'+esc(ctx.selectedWeek.label)+'</strong></span></div></div></div></div>';

      var kpis='<div class="rp2-ac-kpis">'
        +kpi('QTD revenue',money(ctx.qtd.revenue),ctx.goal?(pacePct+'% of selected-point pace'):'Quarter goal unavailable')
        +kpi('Run-rate projection',money(ctx.projection),ctx.goal?(Math.round(ctx.projection/Math.max(1,ctx.goal)*100)+'% of quarter goal'):'Based on entered weeks')
        +kpi('Required weekly pace',money(ctx.requiredWeekly),ctx.remainingWeeks+' remaining quarter week'+(ctx.remainingWeeks===1?'':'s'))
        +kpi('Calls through selection',String(ctx.qtd.calls),Math.max(0,ctx.through.length*125-ctx.qtd.calls)+' below cumulative target')
        +kpi('Rank',g.rank.rank?('#'+g.rank.rank):'—',g.rank.total?('of '+g.rank.total+' reps'):'Rank data unavailable')
        +kpi('Dormant accounts',String(g.customers.dormant.length),Math.round(g.customers.top5Share)+'% top-five customer share')
        +kpi('Quality records',String(g.quality.art.length+g.quality.credits.length),g.quality.art.length+' art · '+g.quality.credits.length+' credits')
        +kpi('Open-order watch',String(g.openRisks.length),g.prod.rows.length?(g.prod.extended+' extended production methods'):'Production feed unavailable')
        +'</div>';

      var content=tab==='plan'?planView(g):tab==='growth'?growthView(g):tab==='risk'?riskView(g):tab==='ask'?askView(g):tab==='history'?historyView(g):coachDashboard(g);
      return '<div class="rp2-ac-shell">'+hero+kpis+tabBar(tab)+content+'</div>'
    }catch(e){
      console.error('[AI Coach v503 render error]',e);
      return '<div class="rp2-ac-shell"><div class="rp2-ac-hero"><div class="rp2-ac-kick">AI Coach 2.0 · RECOVERY MODE</div><div class="rp2-ac-title">The coaching engine hit a data compatibility issue</div><div class="rp2-ac-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2AIDraw=function(){
    if(typeof Chart!=='function')return;
    if(window._rp2AITab!=='coach'&&window._rp2AITab!=='history')return;
    var canvas=document.getElementById('rp2-ac-chart');if(!canvas)return;
    var g=build(),rows=g.ctx.weekly.slice(0,g.ctx.selectedIndex+1);
    if(_rp2.aiCoachChart){try{_rp2.aiCoachChart.destroy()}catch(e){}}
    if(!rows.length)return;
    _rp2.aiCoachChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:rows.map(function(w){return w.label}),datasets:[
        {type:'bar',label:'Revenue',data:rows.map(function(w){return w.revenue}),backgroundColor:'rgba(250,135,61,.70)',borderRadius:6,yAxisID:'money'},
        {type:'line',label:'Calls',data:rows.map(function(w){return w.calls}),borderColor:'#00AFEF',pointRadius:3,tension:.25,yAxisID:'activity'},
        {type:'line',label:'Orders',data:rows.map(function(w){return w.orders}),borderColor:'#4ed6a3',pointRadius:3,tension:.25,yAxisID:'orders'}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label==='Revenue'?(' Revenue: '+money(ctx.parsed.y)):(' '+ctx.dataset.label+': '+ctx.parsed.y)}}}},
        scales:{
          x:{ticks:{color:'#8b95a7',font:{size:9}},grid:{display:false}},
          money:{beginAtZero:true,ticks:{color:'#8b95a7',callback:function(v){return '$'+Math.round(v/1000)+'K'}},grid:{color:'rgba(255,255,255,.05)'}},
          activity:{position:'right',beginAtZero:true,ticks:{color:'#8b95a7'},grid:{display:false}},
          orders:{display:false,beginAtZero:true}
        }
      }
    })
  };
})();
