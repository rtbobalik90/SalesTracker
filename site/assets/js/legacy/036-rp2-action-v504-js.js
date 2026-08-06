
(function(){
  var STORE='tcp_rp_action_center_v504';
  var TABS=[
    {id:'today',label:'Today',icon:'☀'},
    {id:'queue',label:'Priority Queue',icon:'☑'},
    {id:'followups',label:'Follow-Ups',icon:'↗'},
    {id:'week',label:'My Week',icon:'📅'},
    {id:'completed',label:'Completed',icon:'✓'}
  ];
  var OUTCOMES=['Connected','Left voicemail','Sent email','Quote requested','Order expected','Follow-up scheduled','No current need','Customer issue resolved','Completed internally'];
  window._rp2ActionTab=window._rp2ActionTab||'today';
  window._rp2ActionModal=window._rp2ActionModal||null;

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
  function now(){
    var d=window._rp2ActionNow?new Date(window._rp2ActionNow):new Date();
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
    var d=dval(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):String(v||'—')
  }
  function diffDays(a,b){
    var x=dval(a),y=dval(b);if(!x||!y)return null;
    return Math.round((y-x)/86400000)
  }
  function hash(s){
    var h=2166136261,str=String(s||'');
    for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)}
    return (h>>>0).toString(36)
  }
  function load(){
    try{
      var x=JSON.parse(localStorage.getItem(STORE)||'null');
      if(x&&x.version===1&&x.reps)return x
    }catch(e){}
    return {version:1,reps:{}}
  }
  function save(x){try{localStorage.setItem(STORE,JSON.stringify(x))}catch(e){}}
  function bucket(rep){
    var s=load();s.reps[rep]=s.reps[rep]||{manual:[],state:{},events:[]};return {store:s,data:s.reps[rep]}
  }
  function writeBucket(rep,b){var s=b.store;s.reps[rep]=b.data;save(s)}
  function canonicalTaskId(prefix,parts){return prefix+'_'+hash(parts.join('|'))}
  function orderDate(o){
    var d=dval(o&&(o.orderDate||o.date||o.enteredAt));if(d)return d;
    var key=o&&(o.effWeekKey||o.weekKey);
    if(key&&typeof gwq==='function'){
      var p=String(key).split('_'),y=Number(p[0]),q=p[1];
      try{var w=safeArray(gwq(y,q)).filter(function(x){return x&&x.key===key})[0];return w?dval(w.end||w.start):null}catch(e){}
    }
    return null
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
      return {key:w.key,label:w.label||w.key,start:dval(w.start),end:dval(w.end),revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls),entered:!!(n(d.revenue)||n(d.orders)||n(d.calls))}
    });
    var through=weekly.slice(0,idx+1),sw=weekly[idx]||{key:'',label:'Selected week',start:null,end:null,revenue:0,orders:0,calls:0};
    var goal=0;try{goal=n(c&&c.goal!=null?c.goal:_rp2Goal(_rp2.rep))}catch(e){}
    var qtd={revenue:through.reduce(function(s,w){return s+w.revenue},0),orders:through.reduce(function(s,w){return s+w.orders},0),calls:through.reduce(function(s,w){return s+w.calls},0)};
    var entered=through.filter(function(w){return w.entered}),avg=entered.length?entered.reduce(function(s,w){return s+w.revenue},0)/entered.length:0;
    var expected=goal*(through.length/Math.max(1,wks.length)),remainingWeeks=Math.max(0,wks.length-through.length),remaining=Math.max(0,goal-qtd.revenue),required=remainingWeeks?remaining/remainingWeeks:remaining;
    var t=now(),mode='live';
    if(sw.start&&t<sw.start)mode='future';else if(sw.end&&t>sw.end)mode='historical';
    return {year:year,q:q,wks:wks,weekly:weekly,selected:selected,selectedIndex:idx,selectedWeek:sw,through:through,goal:goal,qtd:qtd,expected:expected,projection:avg*wks.length,remainingWeeks:remainingWeeks,remainingRevenue:remaining,requiredWeekly:required,mode:mode}
  }
  function repOrders(){
    var all=safeArray(S&&S.orders).filter(function(o){return o&&o.rep===_rp2.rep});
    all.forEach(function(o){o._actionDate=orderDate(o)});
    return {all:all,primary:all.filter(function(o){return o.kind==='order'}),backorders:all.filter(function(o){return o.kind==='backorder'||o.isBackorder})}
  }
  function normSO(v){return String(v||'').toLowerCase().replace(/\s+/g,'').trim()}
  function artFor(o){
    var so=normSO(o&&o.orderNum),base=normSO(o&&o.base);
    return safeArray(S&&S.artErrors).filter(function(a){var k=normSO(a&&(a.so||a.soNum));return a&&a.rep===_rp2.rep&&k&&(k===so||k===base)})
  }
  function creditFor(o){
    var so=normSO(o&&o.orderNum),base=normSO(o&&o.base);
    return safeArray(S&&S.cms).filter(function(c){var k=normSO(c&&(c.soNum||c.so));return c&&c.rep===_rp2.rep&&k&&(k===so||k===base)})
  }
  function customerBook(orders,ctx){
    var map={},currentYear=ctx.year,priorYear=ctx.year-1,t=now();
    orders.primary.forEach(function(o){
      var name=String(o.customer||'').trim();if(!name)return;
      var key=name.toLowerCase(),x=map[key]||(map[key]={name:name,orders:[],revenue:0,current:0,prior:0,last:null});
      x.orders.push(o);x.revenue+=n(o.total);
      var d=o._actionDate;if(d){
        if(!x.last||d>x.last)x.last=d;
        if(d.getFullYear()===currentYear)x.current+=n(o.total);
        if(d.getFullYear()===priorYear)x.prior+=n(o.total)
      }
    });
    var rows=Object.keys(map).map(function(k){
      var x=map[k];x.orderCount=x.orders.length;x.daysSince=x.last?diffDays(x.last,t):null;
      x.change=x.prior>0?(x.current-x.prior)/x.prior*100:(x.current>0?100:0);return x
    }).sort(function(a,b){return b.revenue-a.revenue});
    return {
      rows:rows,
      dormant:rows.filter(function(x){return x.daysSince!=null&&x.daysSince>120}).sort(function(a,b){return b.revenue-a.revenue}),
      declining:rows.filter(function(x){return x.prior>0&&x.current<x.prior*.85}).sort(function(a,b){return (a.current-a.prior)-(b.current-b.prior)}),
      one:rows.filter(function(x){return x.orderCount===1}).sort(function(a,b){return b.revenue-a.revenue})
    }
  }
  function production(){
    var rows=[],updated=null;
    try{
      var cfg=typeof getProductionFeedSettings==='function'?getProductionFeedSettings():JSON.parse(localStorage.getItem('salesTracker_productionFeed')||'null');
      if(cfg&&safeArray(cfg.rows).length){rows=safeArray(cfg.rows);updated=dval(cfg.lastRefresh)}
    }catch(e){}
    if(!rows.length){
      try{var p=S&&S.companyKnowledge&&S.companyKnowledge.production;if(p&&safeArray(p.rows).length){rows=safeArray(p.rows);updated=dval(p.lastFetched)}}catch(e){}
    }
    var extended=rows.filter(function(r){
      var ship=dval(r.shipWeek||r.ship||r.shipDate||r.date),lead=ship?diffDays(now(),ship):null;
      return lead!=null&&(lead>16||lead<0)
    });
    return {rows:rows,updated:updated,age:updated?diffDays(updated,now()):null,extended:extended}
  }
  function managerTasks(ctx){
    var pools=[S&&S.repActions,S&&S.actionItems,S&&S.coachingActions],rows=[];
    pools.forEach(function(pool){
      safeArray(pool).forEach(function(a){
        if(!a||a.rep!==_rp2.rep||a.visibleToRep===false)return;
        var due=a.dueDate||a.due||a.followUpDate||iso(ctx.selectedWeek.end||now());
        rows.push({
          id:String(a.id||canonicalTaskId('mgr',[a.rep,a.title||a.action,due])),
          source:'manager',category:String(a.category||'coaching'),tone:String(a.tone||'info'),score:n(a.priorityScore||a.score||175),
          title:String(a.title||a.action||'Manager-assigned action'),why:String(a.why||a.context||'This action was assigned through the coaching workflow.'),
          action:String(a.action||a.nextStep||a.title||'Complete the assigned action and record the outcome.'),
          measure:String(a.measure||a.successMeasure||'Document the result'),dueDate:iso(due),customer:String(a.customer||''),orderNum:String(a.orderNum||a.so||''),
          value:n(a.value||a.opportunityValue),page:String(a.page||'ai'),opener:String(a.opener||''),locked:true
        })
      })
    });
    return rows
  }
  function autoTasks(ctx,orders,customers,prod){
    var out=[],today=iso(now()),weekKey=ctx.selectedWeek.key||ctx.q+'_'+ctx.year;
    function add(o){out.push(o)}
    var callGap=Math.max(0,125-ctx.selectedWeek.calls);
    if(callGap>0)add({
      id:canonicalTaskId('calls',[weekKey,_rp2.rep]),source:'auto',category:'calls',tone:callGap>75?'risk':'warn',score:145+Math.min(35,callGap/3),
      title:'Close the selected-week call gap',why:'The selected week has '+ctx.selectedWeek.calls+' recorded calls against the 125-call weekly target.',
      action:'Protect two outbound blocks and complete the highest-value customer calls before lower-priority administrative work.',
      measure:'Complete '+callGap+' additional customer/contact calls',dueDate:iso(ctx.selectedWeek.end||now()),value:0,page:'dash',
      opener:'Start with a specific reorder, seasonal, expansion, or service reason—not a generic check-in.'
    });
    if(ctx.goal&&ctx.qtd.revenue<ctx.expected)add({
      id:canonicalTaskId('pace',[weekKey,_rp2.rep]),source:'auto',category:'revenue',tone:'risk',score:155+Math.min(35,(ctx.expected-ctx.qtd.revenue)/Math.max(1,ctx.expected)*100),
      title:'Protect the quarter revenue pace',why:'QTD revenue through '+ctx.selectedWeek.label+' is '+money(ctx.qtd.revenue)+' versus '+money(ctx.expected)+' of cumulative goal pace.',
      action:'Build the next selling block around repeat orders, dormant high-value customers, and opportunities capable of supporting the '+money(ctx.requiredWeekly)+' remaining weekly pace.',
      measure:'Create qualified next-step revenue toward '+money(Math.min(ctx.requiredWeekly,ctx.remainingRevenue)),dueDate:iso(ctx.selectedWeek.end||now()),value:ctx.requiredWeekly,page:'forecast'
    });
    var artMap={},creditMap={};
    safeArray(S&&S.artErrors).filter(function(a){return a&&a.rep===_rp2.rep}).forEach(function(a){var k=normSO(a.so||a.soNum);if(k)artMap[k]=(artMap[k]||0)+1});
    safeArray(S&&S.cms).filter(function(c){return c&&c.rep===_rp2.rep}).forEach(function(c){var k=normSO(c.soNum||c.so);if(k)creditMap[k]=(creditMap[k]||0)+1});
    orders.primary.forEach(function(o){
      if(/closed|complete|completed|shipped|invoiced|cancel|void/i.test(String(o.status||'')))return;
      var base=normSO(o.base||o.orderNum),family=orders.all.filter(function(x){return normSO(x.base||x.orderNum)===base}),bo=family.filter(function(x){return x.kind==='backorder'||x.isBackorder}).length;
      var age=o._actionDate?diffDays(o._actionDate,now()):null,reasons=[],score=0;
      if(/hold|delay|problem|pending|backorder/i.test(String(o.status||''))){reasons.push('status '+String(o.status));score+=5}
      if(bo){reasons.push(bo+' backorder line'+(bo===1?'':'s'));score+=5}
      if(artMap[normSO(o.orderNum)]||artMap[base]){reasons.push('linked art issue');score+=3}
      if(creditMap[normSO(o.orderNum)]||creditMap[base]){reasons.push('linked credit memo');score+=2}
      if(age!=null&&age>21){reasons.push(age+' days open');score+=Math.min(5,Math.floor(age/14))}
      if(!score)return;
      add({
        id:canonicalTaskId('order',[weekKey,o.orderNum||o.base]),source:'auto',category:'order',tone:score>=8?'risk':'warn',score:170+score,
        title:'Proactively update '+String(o.customer||o.orderNum||'the customer'),why:String(o.orderNum||o.base||'Order')+' is flagged for '+reasons.join(', ')+'.',
        action:'Verify the actual production/order status, identify the next confirmed milestone, and update the customer before they need to ask.',
        measure:'Document the verified status and next customer update',dueDate:today,customer:String(o.customer||''),orderNum:String(o.orderNum||o.base||''),value:n(o.total),page:'production',
        opener:'“I wanted to give you a proactive update before you had to ask. I’m verifying the next milestone now and will follow up with the confirmed timing.”'
      })
    });
    customers.dormant.slice(0,4).forEach(function(c,i){
      add({
        id:canonicalTaskId('dormant',[weekKey,c.name]),source:'auto',category:'growth',tone:'info',score:130-i+(Math.min(30,c.revenue/5000)),
        title:'Reconnect with '+c.name,why:'This customer is '+c.daysSince+' days beyond the latest recorded order and represents '+money(c.revenue)+' in recorded lifetime revenue.',
        action:'Lead with a relevant seasonal, reorder, or program-planning reason and secure a specific next step.',
        measure:'Create a qualified next step or record the current need',dueDate:today,customer:c.name,value:c.revenue,page:'customers',
        opener:'“I was reviewing your past orders and wanted to reconnect before the next seasonal need. What is coming up that we should start planning now?”'
      })
    });
    customers.declining.slice(0,3).forEach(function(c,i){
      add({
        id:canonicalTaskId('decline',[weekKey,c.name]),source:'auto',category:'customer',tone:'warn',score:125-i,
        title:'Protect the relationship with '+c.name,why:'Recorded current-year revenue is below the prior-year level for this customer.',
        action:'Ask what changed, confirm upcoming needs, and identify whether the account needs service recovery, a new contact, or a refreshed program plan.',
        measure:'Document the reason for the change and one next step',dueDate:today,customer:c.name,value:c.revenue,page:'customers',
        opener:'“I wanted to check in because your ordering pattern looks different this year. Has the need changed, or is there an opportunity we have not helped you plan yet?”'
      })
    });
    customers.one.slice(0,3).forEach(function(c,i){
      add({
        id:canonicalTaskId('second',[weekKey,c.name]),source:'auto',category:'growth',tone:'good',score:105-i,
        title:'Convert '+c.name+' into a repeat customer',why:'This customer has one recorded primary order worth '+money(c.revenue)+'.',
        action:'Follow up on the first experience and identify the next department, event, reorder, or complementary product opportunity.',
        measure:'Secure one next-order or expansion conversation',dueDate:today,customer:c.name,value:c.revenue,page:'customers',
        opener:'“I wanted to follow up on your first order and make sure we are positioned for the next need. What worked well, and what should we improve or expand next time?”'
      })
    });
    if(prod.rows.length===0||prod.age>3||prod.extended.length)add({
      id:canonicalTaskId('production',[weekKey,_rp2.rep]),source:'auto',category:'production',tone:prod.rows.length===0?'risk':'warn',score:118,
      title:'Confirm production timing before promising dates',why:prod.rows.length===0?'No current production snapshot is connected.':((prod.age>3?'The production source is '+prod.age+' days old. ':'')+(prod.extended.length?prod.extended.length+' methods have extended or past-dated windows.':'')),
      action:'Refresh or verify the production source before giving a firm in-hands commitment on tight-date opportunities.',
      measure:'Make zero unverified deadline promises',dueDate:today,page:'production'
    });
    return out
  }
  function manualTasks(b){return safeArray(b.data.manual).map(function(t){var x={};Object.keys(t||{}).forEach(function(k){x[k]=t[k]});x.source=x.source||'manual';x.score=n(x.score||135);x.tone=x.tone||'info';return x})}
  function stateFor(b,id){return (b.data.state&&b.data.state[id])||{}}
  function overlay(tasks,b){
    return tasks.map(function(t){
      var x={};Object.keys(t).forEach(function(k){x[k]=t[k]});
      var st=stateFor(b,t.id);x.state=st;x.status=st.status||t.status||'open';x.dueDate=iso(st.dueDate||t.dueDate||now());
      x.completedAt=st.completedAt||'';x.result=st.result||'';x.note=st.note||'';x.nextFollowUp=st.nextFollowUp||'';x.opportunityValue=n(st.opportunityValue||t.opportunityValue||0);
      return x
    })
  }
  function dueTone(t){
    if(t.status==='completed')return 'done';
    var d=dval(t.dueDate),today=now(),gap=d?diffDays(today,d):0;
    if(gap<0)return 'overdue';if(gap===0)return 'today';return 'future'
  }
  function sortTasks(a,b){
    var ad=dueTone(a),bd=dueTone(b),weight={overdue:4,today:3,future:2,done:1};
    return (weight[bd]-weight[ad])||(b.score-a.score)||((dval(a.dueDate)||new Date(8640000000000000))-(dval(b.dueDate)||new Date(8640000000000000)))
  }
  function build(){
    var ctx=selectedContext(),orders=repOrders(),customers=customerBook(orders,ctx),prod=production(),b=bucket(_rp2.rep);
    var tasks=managerTasks(ctx).concat(autoTasks(ctx,orders,customers,prod)).concat(manualTasks(b));
    var seen={};tasks=tasks.filter(function(t){if(!t||!t.id||seen[t.id])return false;seen[t.id]=1;return true});
    tasks=overlay(tasks,b).sort(sortTasks);
    var open=tasks.filter(function(t){return t.status!=='completed'}),completed=tasks.filter(function(t){return t.status==='completed'}).sort(function(a,b){return String(b.completedAt).localeCompare(String(a.completedAt))});
    var todayOpen=open.filter(function(t){return dueTone(t)==='today'}),overdue=open.filter(function(t){return dueTone(t)==='overdue'}),future=open.filter(function(t){return dueTone(t)==='future'});
    var followups=open.filter(function(t){return t.category==='followup'||t.source==='manual'&&/follow.?up/i.test(t.title+' '+(t.notes||''))}).sort(sortTasks);
    var weekStart=dval(ctx.selectedWeek.start),weekEnd=dval(ctx.selectedWeek.end),events=safeArray(b.data.events).filter(function(e){
      var d=dval(e.at);return d&&(!weekStart||d>=weekStart)&&(!weekEnd||d<=new Date(weekEnd.getTime()+86399999))
    });
    var completions=events.filter(function(e){return e.type==='complete'});
    var uniqueCustomers={};completions.forEach(function(e){if(e.customer)uniqueCustomers[String(e.customer).toLowerCase()]=1});
    var opportunity=completions.reduce(function(s,e){return s+n(e.opportunityValue)},0),followupEvents=completions.filter(function(e){return !!e.nextFollowUp}).length;
    var callGap=Math.max(0,125-ctx.selectedWeek.calls);
    var streak=completionStreak(b.data.events);
    var liveActionable=ctx.mode!=='historical';
    return {
      ctx:ctx,orders:orders,customers:customers,prod:prod,bucket:b,tasks:tasks,open:open,completed:completed,todayOpen:todayOpen,overdue:overdue,future:future,followups:followups,
      events:events,completions:completions,customersTouched:Object.keys(uniqueCustomers).length,opportunity:opportunity,followupEvents:followupEvents,callGap:callGap,streak:streak,liveActionable:liveActionable
    }
  }
  function completionStreak(events){
    var days={};safeArray(events).filter(function(e){return e&&e.type==='complete'}).forEach(function(e){var d=iso(e.at);if(d)days[d]=1});
    var d=now(),count=0;if(!days[iso(d)])d.setDate(d.getDate()-1);
    while(days[iso(d)]){count++;d.setDate(d.getDate()-1)}
    return count
  }
  function posture(g){
    if(g.ctx.mode==='historical')return {tone:'info',title:'Historical review mode',copy:'The selected week has ended. Auto-generated priorities are shown as point-in-time coaching context, while completed actions reflect what was recorded on this device.'};
    if(g.overdue.length)return {tone:'risk',title:g.overdue.length+' overdue action'+(g.overdue.length===1?' needs':'s need')+' attention',copy:'Clear the oldest promised follow-up or customer-risk item first, then move into today’s ranked queue.'};
    if(g.todayOpen.length>=6)return {tone:'warn',title:'Today needs a focused priority reset',copy:'The queue has '+g.todayOpen.length+' actions due today. Start with the first action, complete the result, and let the queue narrow itself.'};
    if(g.todayOpen.length)return {tone:'good',title:'Your day has a clear execution path',copy:'You have '+g.todayOpen.length+' action'+(g.todayOpen.length===1?'':'s')+' due today, ranked by customer impact, risk, and growth potential.'};
    return {tone:'good',title:'Today’s due queue is clear',copy:'No open action is due today. Use the future queue, create a task, or work the next customer-growth opportunity.'}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-act-section-head"><div><div class="rp2-act-section-kick">'+kick+'</div><div class="rp2-act-section-title">'+title+'</div></div><div class="rp2-act-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-act-kpi"><div class="rp2-act-kpi-label">'+esc(label)+'</div><div class="rp2-act-kpi-value">'+value+'</div><div class="rp2-act-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-act-tabs-wrap"><div class="rp2-act-tabs">'+TABS.map(function(t){return '<button class="rp2-act-tab '+(t.id===active?'active':'')+'" onclick="_rp2ActionSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function taskDueLabel(t){
    var tone=dueTone(t);if(tone==='overdue')return 'Overdue · '+fmtDate(t.dueDate);if(tone==='today')return 'Due today';if(tone==='done')return 'Completed '+fmtDate(t.completedAt);return 'Due '+fmtDate(t.dueDate)
  }
  function taskCard(t,index,g){
    var historical=g.ctx.mode==='historical',done=t.status==='completed',priority=Math.max(1,index+1),due=dueTone(t),dueClass=due==='overdue'?'risk':due==='today'?'warn':done?'good':'';
    var value=t.value?money(t.value):t.opportunityValue?money(t.opportunityValue):'—';
    return '<div class="rp2-act-card '+t.tone+' '+(done?'done':'')+'" data-act504="1" data-category="'+esc(t.category||'other')+'" data-source="'+esc(t.source||'auto')+'" data-status="'+esc(done?'completed':due)+'" data-search="'+esc((t.title+' '+t.why+' '+(t.customer||'')+' '+(t.orderNum||'')).toLowerCase())+'"><div class="rp2-act-card-grid">'
      +'<div class="rp2-act-priority">'+(done?'✓':priority)+'</div>'
      +'<div><div class="rp2-act-card-top"><span class="rp2-act-tag '+(t.tone||'')+'">'+esc(t.category||'Action')+'</span><span class="rp2-act-tag">'+esc(t.source==='manager'?'Manager assignment':t.source==='manual'?'Personal task':'Smart priority')+'</span><span class="rp2-act-tag '+dueClass+'">'+esc(taskDueLabel(t))+'</span></div><div class="rp2-act-card-title">'+esc(t.title)+'</div><div class="rp2-act-card-why">'+esc(t.why||t.notes||'Personal action item.')+'</div><div class="rp2-act-card-action"><strong>Do this:</strong> '+esc(t.action||'Complete the task and record the result.')+'</div>'
      +(t.opener?'<div class="rp2-act-card-opener">'+esc(t.opener)+'</div>':'')+'</div>'
      +'<div class="rp2-act-card-side"><div class="rp2-act-side-row"><span>Customer</span><strong>'+esc(t.customer||'—')+'</strong></div><div class="rp2-act-side-row"><span>Order</span><strong>'+esc(t.orderNum||'—')+'</strong></div><div class="rp2-act-side-row"><span>Value / impact</span><strong>'+value+'</strong></div><div class="rp2-act-side-row"><span>Success measure</span><strong>'+esc(t.measure||'Document the result')+'</strong></div>'
      +(done?'<div class="rp2-act-side-row"><span>Outcome</span><strong>'+esc(t.result||'Completed')+'</strong></div>':'<div class="rp2-act-card-buttons"><button class="rp2-act-mini-btn complete" '+(historical?'disabled':'')+' onclick="_rp2ActionComplete(\''+encodeURIComponent(t.id)+'\')">Complete</button><button class="rp2-act-mini-btn" '+(historical?'disabled':'')+' onclick="_rp2ActionSnooze(\''+encodeURIComponent(t.id)+'\',1)">Tomorrow</button><button class="rp2-act-mini-btn" '+(historical?'disabled':'')+' onclick="_rp2ActionReschedule(\''+encodeURIComponent(t.id)+'\')">Reschedule</button><button class="rp2-act-mini-btn link" onclick="_rp2Go(\''+esc(t.page||'action')+'\')">Open tool</button></div>')
      +'</div></div></div>'
  }
  function queueHTML(rows,g,emptyTitle,emptyCopy){
    if(!rows.length)return '<div class="rp2-act-empty"><strong>'+esc(emptyTitle)+'</strong><span>'+esc(emptyCopy)+'</span></div>';
    return '<div class="rp2-act-queue">'+rows.map(function(t,i){return taskCard(t,i,g)}).join('')+'</div>'
  }
  function dailyBlocks(g){
    var available=g.open.filter(function(t){return dueTone(t)!=='future'}),used={};
    function pick(cats){
      var x=available.filter(function(t){return !used[t.id]&&cats.indexOf(t.category)>=0})[0]||available.filter(function(t){return !used[t.id]})[0]||null;
      if(x)used[x.id]=1;return x
    }
    var blocks=[
      {label:'Start Strong',title:'Highest-impact action',copy:'Complete the action with the greatest customer, revenue, or risk impact before lower-value work.',task:available[0]||null,cls:'priority'},
      {label:'Outbound Block',title:'Focused customer conversations',copy:'Work the call gap and use a specific reason for every contact.',task:pick(['calls','customer']),cls:''},
      {label:'Customer Care',title:'Protect open orders',copy:'Verify production, approvals, backorders, and promised updates.',task:pick(['order','quality','production']),cls:'care'},
      {label:'Growth Block',title:'Create the next opportunity',copy:'Reactivate, protect, convert, or expand a customer relationship.',task:pick(['growth','revenue']),cls:'growth'},
      {label:'Close the Loop',title:'Document and schedule',copy:'Record outcomes, next steps, and tomorrow’s first action before ending the day.',task:pick(['followup','coaching','manual']),cls:''}
    ];
    return '<div class="rp2-act-blocks">'+blocks.map(function(b){
      var t=b.task;
      return '<div class="rp2-act-block '+b.cls+'"><div class="rp2-act-block-label">'+esc(b.label)+'</div><div class="rp2-act-block-title">'+esc(b.title)+'</div><div class="rp2-act-block-copy">'+esc(b.copy)+'</div>'
        +(t?'<div class="rp2-act-block-task"><strong>'+esc(t.title)+'</strong>'+esc(t.action||t.why)+'</div><div class="rp2-act-block-measure">'+esc(t.measure||taskDueLabel(t))+'</div>':'<div class="rp2-act-block-task"><strong>No queued action</strong>Create a personal task or pull forward a future follow-up.</div>')
        +'</div>'
    }).join('')+'</div>'
  }
  function filterBar(g){
    var cats={},sources={};g.tasks.forEach(function(t){cats[t.category||'other']=1;sources[t.source||'auto']=1});
    return '<div class="rp2-act-filterbar"><input id="rp2-act-search" type="search" placeholder="Search task, customer, or order…" oninput="_rp2ActionApplyFilters()">'
      +'<select id="rp2-act-category" onchange="_rp2ActionApplyFilters()"><option value="">All categories</option>'+Object.keys(cats).sort().map(function(k){return '<option value="'+esc(k)+'">'+esc(k.replace(/\b\w/g,function(x){return x.toUpperCase()}))+'</option>'}).join('')+'</select>'
      +'<select id="rp2-act-source" onchange="_rp2ActionApplyFilters()"><option value="">All sources</option>'+Object.keys(sources).sort().map(function(k){return '<option value="'+esc(k)+'">'+esc(k==='auto'?'Smart priority':k==='manual'?'Personal task':'Manager assignment')+'</option>'}).join('')+'</select>'
      +'<select id="rp2-act-status" onchange="_rp2ActionApplyFilters()"><option value="">Any timing</option><option value="overdue">Overdue</option><option value="today">Due today</option><option value="future">Future</option><option value="completed">Completed</option></select>'
      +'<div id="rp2-act-count" class="rp2-act-filtercount">'+g.tasks.length+' shown</div></div>'
  }
  function todayView(g){
    var p=posture(g),focus=g.overdue.concat(g.todayOpen).slice(0,6);
    return sectionHead('Today’s execution read','What deserves attention first','Smart priorities rebuild from synced tracker data. Personal completion status, notes, and follow-up dates are stored on this device.')
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Today’s posture</div><div class="rp2-act-summary-title">'+esc(p.title)+'</div><div class="rp2-act-summary-copy">'+esc(p.copy)+'</div></div>'
      +sectionHead('Daily work plan','Five practical execution blocks','The plan organizes the ranked queue into a usable day instead of presenting one long undifferentiated task list.')
      +dailyBlocks(g)
      +sectionHead('Start here','Overdue and due-today actions','Complete an action to record the result, opportunity value, notes, and the next follow-up date.')
      +queueHTML(focus,g,'Today’s immediate queue is clear','Create a personal task, pull forward a future follow-up, or use the Growth block to create the next opportunity.')
      +sectionHead('This-device storage','What persists and what rebuilds','Auto priorities rebuild from the latest cloud snapshot. Manual tasks and action results remain private to this browser until a future two-way portal workflow is enabled.')
      +'<div class="rp2-act-panel"><div class="rp2-act-grid-3"><div class="rp2-act-summary"><div class="rp2-act-summary-label">Auto-generated</div><div class="rp2-act-summary-title">'+g.tasks.filter(function(t){return t.source==='auto'}).length+' smart priorities</div><div class="rp2-act-summary-copy">Derived from performance, customers, orders, quality, and production.</div></div><div class="rp2-act-summary"><div class="rp2-act-summary-label">Personal</div><div class="rp2-act-summary-title">'+g.tasks.filter(function(t){return t.source==='manual'}).length+' personal tasks</div><div class="rp2-act-summary-copy">Created and stored on this device for '+esc(_rp2.rep)+'.</div></div><div class="rp2-act-summary"><div class="rp2-act-summary-label">Manager-visible assignments</div><div class="rp2-act-summary-title">'+g.tasks.filter(function(t){return t.source==='manager'}).length+' assignments</div><div class="rp2-act-summary-copy">Only explicitly rep-visible action fields are shown; private manager notes are excluded.</div></div></div></div>'
  }
  function queueView(g){
    return sectionHead('Priority queue','Every open action in ranked order','Overdue items lead, followed by due-today and future actions. Use filters to narrow by task type, source, or timing.')
      +filterBar(g)
      +queueHTML(g.tasks,g,'No actions are available','Create a personal task or wait for the next synced performance/order update.')
  }
  function followupsView(g){
    var rows=g.followups.concat(g.future.filter(function(t){return g.followups.indexOf(t)<0})).sort(sortTasks);
    return sectionHead('Follow-up tracker','Every promised next step has a date','A completion with a next follow-up date automatically creates a new personal follow-up task.')
      +'<div class="rp2-act-grid-4">'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Scheduled follow-ups</div><div class="rp2-act-summary-title">'+g.followups.length+'</div><div class="rp2-act-summary-copy">Open tasks explicitly identified as follow-up work.</div></div>'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Future actions</div><div class="rp2-act-summary-title">'+g.future.length+'</div><div class="rp2-act-summary-copy">Open actions scheduled after today.</div></div>'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Overdue promises</div><div class="rp2-act-summary-title">'+g.overdue.length+'</div><div class="rp2-act-summary-copy">Actions whose stored due date has passed.</div></div>'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Follow-ups created this week</div><div class="rp2-act-summary-title">'+g.followupEvents+'</div><div class="rp2-act-summary-copy">Completion records that scheduled another contact.</div></div>'
      +'</div>'
      +sectionHead('Scheduled work','Upcoming and follow-up actions','Reschedule work intentionally instead of letting it disappear from the queue.')
      +queueHTML(rows,g,'No follow-ups are scheduled','Complete a customer action and select a next follow-up date, or create one manually.')
  }
  function weekDays(g){
    var start=dval(g.ctx.selectedWeek.start),end=dval(g.ctx.selectedWeek.end),days=[];
    if(!start||!end){start=now();start.setDate(start.getDate()-start.getDay());end=new Date(start);end.setDate(end.getDate()+6)}
    for(var d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
      var key=iso(d),events=g.completions.filter(function(e){return iso(e.at)===key});
      days.push({date:new Date(d),count:events.length,value:events.reduce(function(s,e){return s+n(e.opportunityValue)},0),today:key===iso(now())})
    }
    return days
  }
  function weekView(g){
    var days=weekDays(g),outcomeMap={};g.completions.forEach(function(e){var k=e.result||'Completed';outcomeMap[k]=(outcomeMap[k]||0)+1});
    var outcomes=Object.keys(outcomeMap).map(function(k){return {name:k,count:outcomeMap[k]}}).sort(function(a,b){return b.count-a.count});
    return sectionHead('My Week','Execution consistency beyond revenue and calls','This view measures action completion recorded on this device during the selected tracker week.')
      +'<div class="rp2-act-grid-4">'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Actions completed</div><div class="rp2-act-summary-title">'+g.completions.length+'</div><div class="rp2-act-summary-copy">Completed action records inside '+esc(g.ctx.selectedWeek.label)+'.</div></div>'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Customers touched</div><div class="rp2-act-summary-title">'+g.customersTouched+'</div><div class="rp2-act-summary-copy">Unique customers attached to completed actions.</div></div>'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Opportunity value recorded</div><div class="rp2-act-summary-title">'+money(g.opportunity)+'</div><div class="rp2-act-summary-copy">Rep-entered potential value from completion results.</div></div>'
      +'<div class="rp2-act-summary"><div class="rp2-act-summary-label">Current completion streak</div><div class="rp2-act-summary-title">'+g.streak+' day'+(g.streak===1?'':'s')+'</div><div class="rp2-act-summary-copy">Consecutive days ending today or yesterday with at least one completed action.</div></div>'
      +'</div>'
      +sectionHead('Daily consistency','Actions completed by day','A clean week is built from repeated closed loops, not one late burst of activity.')
      +'<div class="rp2-act-week-grid">'+days.map(function(d){return '<div class="rp2-act-day '+(d.today?'today':'')+'"><div class="rp2-act-day-label">'+d.date.toLocaleString('en-US',{weekday:'short'})+'</div><div class="rp2-act-day-date">'+d.date.toLocaleString('en-US',{month:'short',day:'numeric'})+'</div><div class="rp2-act-day-value">'+d.count+'</div><div class="rp2-act-day-copy">completed action'+(d.count===1?'':'s')+(d.value?(' · '+money(d.value)+' opportunity value'):'')+'</div></div>'}).join('')+'</div>'
      +sectionHead('Execution chart','Completed actions and opportunity value','The chart uses local completion events scoped to the selected week.')
      +'<div class="rp2-act-panel"><div class="rp2-act-chart"><canvas id="rp2-act-chart"></canvas></div></div>'
      +sectionHead('Outcome mix','What the completed work produced','Fast outcome capture makes future recommendations more useful than a simple checkbox.')
      +(outcomes.length?'<div class="rp2-act-outcomes">'+outcomes.slice(0,8).map(function(o){return '<div class="rp2-act-outcome"><div class="rp2-act-outcome-label">'+esc(o.name)+'</div><div class="rp2-act-outcome-value">'+o.count+'</div><div class="rp2-act-outcome-copy">'+Math.round(o.count/Math.max(1,g.completions.length)*100)+'% of completed actions this week.</div></div>'}).join('')+'</div>':'<div class="rp2-act-empty"><strong>No outcomes have been recorded this week</strong><span>Complete an action and select the result to start building the weekly execution story.</span></div>')
  }
  function completedView(g){
    return sectionHead('Completed actions','The closed-loop execution record','Results, notes, opportunity value, and scheduled follow-ups remain attached to each completed action on this device.')
      +(g.completed.length?'<div class="rp2-act-completed-list">'+g.completed.map(function(t){return '<div class="rp2-act-completed"><div class="rp2-act-completed-date">'+fmtDate(t.completedAt)+'</div><div class="rp2-act-completed-title">'+esc(t.title)+'<small>'+esc(t.customer||t.orderNum||t.category||'Action')+'</small></div><div class="rp2-act-completed-result"><strong>'+esc(t.result||'Completed')+'</strong>'+(t.note?'<br>'+esc(t.note):'')+(t.opportunityValue?'<br>Opportunity value: '+money(t.opportunityValue):'')+'</div><div class="rp2-act-completed-next">'+(t.nextFollowUp?('Next follow-up<br>'+fmtDate(t.nextFollowUp)):'No next follow-up')+'</div></div>'}).join('')+'</div>':'<div class="rp2-act-empty"><strong>No completed actions are recorded</strong><span>Complete the first action and record the result to start building a personal execution history.</span></div>')
  }
  function modalHTML(g){
    var m=window._rp2ActionModal;if(!m)return '';
    var id=decodeURIComponent(m.id||''),task=g.tasks.filter(function(t){return t.id===id})[0]||null;
    if(m.mode==='complete'&&task){
      return '<div class="rp2-act-modal-wrap" onclick="if(event.target===this)_rp2ActionCloseModal()"><aside class="rp2-act-modal"><div class="rp2-act-modal-head"><div><div class="rp2-act-modal-kick">Record the outcome</div><div class="rp2-act-modal-title">'+esc(task.title)+'</div><div class="rp2-act-modal-sub">'+esc(task.customer||task.orderNum||task.category||'Action')+' · '+esc(taskDueLabel(task))+'</div></div><button class="rp2-act-close" onclick="_rp2ActionCloseModal()">×</button></div>'
        +'<div class="rp2-act-form"><div class="rp2-act-field"><label>Result</label><select id="rp2-act-result">'+OUTCOMES.map(function(x){return '<option>'+esc(x)+'</option>'}).join('')+'</select></div><div class="rp2-act-field"><label>Result notes</label><textarea id="rp2-act-note" placeholder="What happened? What did the customer say? What is the promised next step?"></textarea></div><div class="rp2-act-form-grid"><div class="rp2-act-field"><label>Next follow-up date</label><input id="rp2-act-next" type="date"></div><div class="rp2-act-field"><label>Opportunity value</label><input id="rp2-act-value" type="number" min="0" step="1" placeholder="0"></div></div></div>'
        +'<div class="rp2-act-disclosure"><strong>Fast-result capture:</strong> selecting a next follow-up date automatically creates a new personal follow-up task. The result is stored only on this browser.</div>'
        +'<div class="rp2-act-modal-actions"><button class="rp2-act-btn" onclick="_rp2ActionCloseModal()">Cancel</button><button class="rp2-act-btn primary" onclick="_rp2ActionSaveCompletion(\''+encodeURIComponent(task.id)+'\')">Save result</button></div></aside></div>'
    }
    var edit=task&&task.source==='manual',base=task||{category:'manual',title:'',customer:'',orderNum:'',dueDate:iso(now()),value:0,why:'',action:''};
    return '<div class="rp2-act-modal-wrap" onclick="if(event.target===this)_rp2ActionCloseModal()"><aside class="rp2-act-modal"><div class="rp2-act-modal-head"><div><div class="rp2-act-modal-kick">'+(edit?'Edit personal task':'Create personal task')+'</div><div class="rp2-act-modal-title">'+(edit?'Update the next action':'Add something the smart queue cannot see')+'</div><div class="rp2-act-modal-sub">Personal tasks remain scoped to '+esc(_rp2.rep)+' on this browser.</div></div><button class="rp2-act-close" onclick="_rp2ActionCloseModal()">×</button></div>'
      +'<div class="rp2-act-form"><div class="rp2-act-form-grid"><div class="rp2-act-field"><label>Task type</label><select id="rp2-act-new-type">'+['followup','customer','order','quote','sample','art','production','manual'].map(function(x){return '<option value="'+x+'" '+(base.category===x?'selected':'')+'>'+x.replace(/\b\w/g,function(z){return z.toUpperCase()})+'</option>'}).join('')+'</select></div><div class="rp2-act-field"><label>Due date</label><input id="rp2-act-new-due" type="date" value="'+esc(base.dueDate||iso(now()))+'"></div></div><div class="rp2-act-field"><label>Task title</label><input id="rp2-act-new-title" value="'+esc(base.title||'')+'" placeholder="Call customer, send quote, confirm art…"></div><div class="rp2-act-form-grid"><div class="rp2-act-field"><label>Customer</label><input id="rp2-act-new-customer" value="'+esc(base.customer||'')+'"></div><div class="rp2-act-field"><label>Sales order</label><input id="rp2-act-new-order" value="'+esc(base.orderNum||'')+'"></div></div><div class="rp2-act-form-grid"><div class="rp2-act-field"><label>Opportunity value</label><input id="rp2-act-new-value" type="number" min="0" value="'+n(base.value||base.opportunityValue)+'"></div><div class="rp2-act-field"><label>Linked portal page</label><select id="rp2-act-new-page">'+['action','customers','orders','forecast','production','arterrors','credits','ai'].map(function(x){return '<option value="'+x+'" '+((base.page||'action')===x?'selected':'')+'>'+x.replace(/\b\w/g,function(z){return z.toUpperCase()})+'</option>'}).join('')+'</select></div></div><div class="rp2-act-field"><label>Why / notes</label><textarea id="rp2-act-new-notes" placeholder="Reason for the task, promised update, or context…">'+esc(base.why||base.notes||'')+'</textarea></div></div>'
      +'<div class="rp2-act-modal-actions">'+(edit?'<button class="rp2-act-btn rp2-act-delete" onclick="_rp2ActionDelete(\''+encodeURIComponent(task.id)+'\')">Delete task</button>':'')+'<button class="rp2-act-btn" onclick="_rp2ActionCloseModal()">Cancel</button><button class="rp2-act-btn primary" onclick="_rp2ActionSaveTask(\''+(edit?encodeURIComponent(task.id):'')+'\')">'+(edit?'Save changes':'Create task')+'</button></div></aside></div>'
  }

  window._rp2ActionSetTab=function(id){
    window._rp2ActionTab=id;window._rp2ActionModal=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ActionV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2ActionDraw();window._rp2ActionApplyFilters()}catch(e){}},0)
  };
  window._rp2ActionNew=function(){window._rp2ActionModal={mode:'new',id:''};rerender()}
  window._rp2ActionComplete=function(id){window._rp2ActionModal={mode:'complete',id:id};rerender()}
  window._rp2ActionReschedule=function(id){window._rp2ActionModal={mode:'edit',id:id};rerender()}
  window._rp2ActionCloseModal=function(){window._rp2ActionModal=null;rerender()}
  function rerender(){
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ActionV2();
    setTimeout(function(){try{window._rp2ActionDraw();window._rp2ActionApplyFilters()}catch(e){}},0)
  }
  window._rp2ActionSaveCompletion=function(encoded){
    var id=decodeURIComponent(encoded),g=build(),task=g.tasks.filter(function(t){return t.id===id})[0];if(!task)return;
    var result=((document.getElementById('rp2-act-result')||{}).value||'Completed internally'),note=((document.getElementById('rp2-act-note')||{}).value||'').trim(),next=((document.getElementById('rp2-act-next')||{}).value||''),value=n((document.getElementById('rp2-act-value')||{}).value);
    var b=g.bucket,stamp=new Date().toISOString();b.data.state[id]=Object.assign({},b.data.state[id]||{},{status:'completed',completedAt:stamp,result:result,note:note,nextFollowUp:next,opportunityValue:value,dueDate:task.dueDate});
    b.data.events.push({type:'complete',taskId:id,title:task.title,customer:task.customer||'',orderNum:task.orderNum||'',result:result,note:note,nextFollowUp:next,opportunityValue:value,at:stamp,weekKey:g.ctx.selectedWeek.key||''});
    if(next){
      var fid='manual_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
      b.data.manual.push({id:fid,source:'manual',category:'followup',tone:'info',score:165,title:'Follow up with '+(task.customer||task.title),why:'Scheduled from the completed action: '+task.title+(note?' · '+note:''),action:'Reconnect, review the prior outcome, and record the next step.',measure:'Complete the promised follow-up',dueDate:iso(next),customer:task.customer||'',orderNum:task.orderNum||'',value:value,page:task.page||'customers',opener:task.opener||''})
    }
    writeBucket(_rp2.rep,b);window._rp2ActionModal=null;rerender()
  };
  window._rp2ActionSnooze=function(encoded,days){
    var id=decodeURIComponent(encoded),g=build(),b=g.bucket,d=now();d.setDate(d.getDate()+Math.max(1,n(days)||1));
    b.data.state[id]=Object.assign({},b.data.state[id]||{},{status:'open',dueDate:iso(d),snoozedAt:new Date().toISOString()});
    b.data.events.push({type:'snooze',taskId:id,at:new Date().toISOString(),dueDate:iso(d),weekKey:g.ctx.selectedWeek.key||''});writeBucket(_rp2.rep,b);rerender()
  };
  window._rp2ActionSaveTask=function(encoded){
    var g=build(),b=g.bucket,id=encoded?decodeURIComponent(encoded):'',title=((document.getElementById('rp2-act-new-title')||{}).value||'').trim();if(!title)return;
    var task={
      id:id||('manual_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)),source:'manual',
      category:((document.getElementById('rp2-act-new-type')||{}).value||'manual'),tone:'info',score:140,title:title,
      dueDate:((document.getElementById('rp2-act-new-due')||{}).value||iso(now())),
      customer:((document.getElementById('rp2-act-new-customer')||{}).value||'').trim(),
      orderNum:((document.getElementById('rp2-act-new-order')||{}).value||'').trim(),
      value:n((document.getElementById('rp2-act-new-value')||{}).value),
      page:((document.getElementById('rp2-act-new-page')||{}).value||'action'),
      why:((document.getElementById('rp2-act-new-notes')||{}).value||'').trim()||'Personal action created by the rep.',
      action:'Complete the personal task and record the outcome.',measure:'Document the result'
    };
    var idx=b.data.manual.findIndex(function(x){return x&&x.id===task.id});if(idx>=0)b.data.manual[idx]=task;else b.data.manual.push(task);
    b.data.events.push({type:idx>=0?'edit':'create',taskId:task.id,title:task.title,at:new Date().toISOString(),weekKey:g.ctx.selectedWeek.key||''});
    writeBucket(_rp2.rep,b);window._rp2ActionModal=null;rerender()
  };
  window._rp2ActionDelete=function(encoded){
    var id=decodeURIComponent(encoded),g=build(),b=g.bucket;b.data.manual=b.data.manual.filter(function(x){return x&&x.id!==id});delete b.data.state[id];
    b.data.events.push({type:'delete',taskId:id,at:new Date().toISOString(),weekKey:g.ctx.selectedWeek.key||''});writeBucket(_rp2.rep,b);window._rp2ActionModal=null;rerender()
  };
  window._rp2ActionApplyFilters=function(){
    try{
      var q=((document.getElementById('rp2-act-search')||{}).value||'').toLowerCase().trim(),cat=((document.getElementById('rp2-act-category')||{}).value||''),source=((document.getElementById('rp2-act-source')||{}).value||''),status=((document.getElementById('rp2-act-status')||{}).value||'');
      var cards=safeArray(document.querySelectorAll?document.querySelectorAll('#rp2-page [data-act504="1"]'):[]),shown=0;
      cards.forEach(function(card){
        var ok=(!q||String(card.getAttribute('data-search')||'').indexOf(q)>=0)&&(!cat||card.getAttribute('data-category')===cat)&&(!source||card.getAttribute('data-source')===source)&&(!status||card.getAttribute('data-status')===status);
        card.style.display=ok?'block':'none';if(ok)shown++
      });
      var count=document.getElementById('rp2-act-count');if(count)count.textContent=shown+' shown'
    }catch(e){}
  };
  window._rp2ActionCopyPlan=function(){
    var g=build(),rows=g.overdue.concat(g.todayOpen).slice(0,8),txt='TODAY’S ACTION PLAN — '+_rp2.rep+'\n'+now().toLocaleDateString()+'\n\n';
    if(!rows.length)txt+='No overdue or due-today actions.\n';
    rows.forEach(function(t,i){txt+=(i+1)+'. '+t.title+'\n   '+(t.action||t.why)+'\n   Measure: '+(t.measure||'Document the result')+'\n\n'});
    try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt);else prompt('Copy today’s plan:',txt)}catch(e){prompt('Copy today’s plan:',txt)}
  };

  window._rp2ActionV2=function(){
    try{
      var g=build(),tab=window._rp2ActionTab,p=posture(g),dueTotal=g.todayOpen.length+g.overdue.length,done=g.completions.length,total=dueTotal+done,progress=total?Math.round(done/total*100):100;
      var modeLabel=g.ctx.mode==='live'?'Live execution mode':g.ctx.mode==='historical'?'Historical review mode':'Future planning mode';
      var hero='<div class="rp2-act-hero"><div class="rp2-act-hero-grid"><div><div class="rp2-act-kick">Rep Action Center 2.0 · DAILY EXECUTION · BUILD v504</div><div class="rp2-act-title">Know what to do next—and close the loop</div><div class="rp2-act-copy">Turn performance, customer, order, quality, production, coaching, and personal follow-up signals into one ranked work plan. Completing an action records the outcome and can automatically schedule the next follow-up.</div><div class="rp2-act-pills"><span class="rp2-act-pill '+p.tone+'">'+esc(p.title)+'</span><span class="rp2-act-pill info">'+esc(modeLabel)+'</span><span class="rp2-act-pill">Personal state · this device</span></div><div class="rp2-act-hero-actions"><button class="rp2-act-btn primary" onclick="_rp2ActionNew()">＋ Add personal task</button><button class="rp2-act-btn purple" onclick="_rp2ActionCopyPlan()">Copy today’s plan</button><button class="rp2-act-btn" onclick="_rp2RefreshCloud(this,false)">Refresh synced data</button></div></div>'
        +'<div class="rp2-act-brief"><div><div class="rp2-act-brief-label">Today’s closed-loop progress</div><div class="rp2-act-progress-row"><div class="rp2-act-progress">'+progress+'</div><div class="rp2-act-progress-den">%</div></div><div class="rp2-act-brief-title">'+esc(p.title)+'</div><div class="rp2-act-brief-copy">'+esc(p.copy)+'</div></div><div class="rp2-act-brief-foot"><span>Due / overdue <strong>'+dueTotal+'</strong></span><span>Completed this week <strong>'+done+'</strong></span></div></div></div></div>';
      var kpis='<div class="rp2-act-kpis">'
        +kpi('Due today',String(g.todayOpen.length),'Ranked actions scheduled for today')
        +kpi('Overdue',String(g.overdue.length),'Promised actions whose due date passed')
        +kpi('Selected-week call gap',String(g.callGap),g.ctx.selectedWeek.calls+' of 125 recorded calls')
        +kpi('Required weekly revenue',money(g.ctx.requiredWeekly),g.ctx.remainingWeeks+' remaining quarter week'+(g.ctx.remainingWeeks===1?'':'s'))
        +kpi('Open-order risks',String(g.tasks.filter(function(t){return t.category==='order'&&t.status!=='completed'}).length),'Customer updates or operational checks')
        +kpi('Follow-ups scheduled',String(g.followups.length),'Open personal follow-up tasks')
        +kpi('Completed this week',String(g.completions.length),g.customersTouched+' customers touched')
        +kpi('Completion streak',g.streak+'d',money(g.opportunity)+' opportunity value recorded')
        +'</div>';
      var content=tab==='queue'?queueView(g):tab==='followups'?followupsView(g):tab==='week'?weekView(g):tab==='completed'?completedView(g):todayView(g);
      return '<div class="rp2-act-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+modalHTML(g)
    }catch(e){
      console.error('[Action Center v504 render error]',e);
      return '<div class="rp2-act-shell"><div class="rp2-act-hero"><div class="rp2-act-kick">Rep Action Center 2.0 · RECOVERY MODE</div><div class="rp2-act-title">The daily execution engine hit a data compatibility issue</div><div class="rp2-act-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2ActionDraw=function(){
    if(typeof Chart!=='function'||window._rp2ActionTab!=='week')return;
    var canvas=document.getElementById('rp2-act-chart');if(!canvas)return;
    var g=build(),days=weekDays(g);
    if(_rp2.actionChart){try{_rp2.actionChart.destroy()}catch(e){}}
    _rp2.actionChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:days.map(function(d){return d.date.toLocaleString('en-US',{weekday:'short'})}),datasets:[
        {type:'bar',label:'Completed actions',data:days.map(function(d){return d.count}),backgroundColor:'rgba(78,214,163,.70)',borderRadius:6,yAxisID:'actions'},
        {type:'line',label:'Opportunity value',data:days.map(function(d){return d.value}),borderColor:'#FA873D',pointRadius:3,tension:.25,yAxisID:'value'}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label==='Opportunity value'?(' Value: '+money(ctx.parsed.y)):(' Completed: '+ctx.parsed.y)}}}},
        scales:{
          x:{ticks:{color:'#8b95a7',font:{size:9}},grid:{display:false}},
          actions:{beginAtZero:true,ticks:{color:'#8b95a7',precision:0},grid:{color:'rgba(255,255,255,.05)'}},
          value:{position:'right',beginAtZero:true,ticks:{color:'#8b95a7',callback:function(v){return '$'+Math.round(v/1000)+'K'}},grid:{display:false}}
        }
      }
    })
  };
  /* v607 bridge: expose the mature Action Center model without duplicating its data logic. */
  window._rp2ActionBuildV607=build;
  window._rp2ActionModalHTMLV607=modalHTML;
  window._rp2ActionDueToneV607=dueTone;
  window._rp2ActionTaskDueLabelV607=taskDueLabel;
  window._rp2ActionPostureV607=posture;
})();
