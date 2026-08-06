
(function(){
  var STORE='tcp_rp_goals_v505',ACTION_STORE='tcp_rp_action_center_v504';
  var TABS=[
    {id:'overview',label:'Growth Overview',icon:'◫'},
    {id:'goals',label:'My Goals',icon:'🎯'},
    {id:'scorecard',label:'Development Scorecard',icon:'📊'},
    {id:'career',label:'Career Path',icon:'↗'},
    {id:'history',label:'Goal History',icon:'◷'}
  ];
  var METRICS=[
    {id:'quarter_revenue',name:'Quarter revenue',unit:'money',page:'forecast'},
    {id:'weekly_calls',name:'Selected-week calls',unit:'number',page:'dash'},
    {id:'quarter_orders',name:'Quarter orders',unit:'number',page:'orders'},
    {id:'aov',name:'Average order value',unit:'money',page:'orders'},
    {id:'reactivated_customers',name:'Reactivated customers',unit:'number',page:'customers'},
    {id:'new_customers',name:'New customers',unit:'number',page:'customers'},
    {id:'clean_order_streak',name:'Current clean-order streak',unit:'number',page:'arterrors'},
    {id:'lifetime_reviews',name:'Lifetime active reviews',unit:'number',page:'reviews'},
    {id:'review_rating',name:'Lifetime review rating',unit:'rating',page:'reviews'},
    {id:'action_completions',name:'Action Center completions',unit:'number',page:'action'},
    {id:'development_score',name:'Development scorecard dimension',unit:'score',page:'goals'},
    {id:'manual',name:'Manual progress',unit:'number',page:'goals'}
  ];
  var DIMENSIONS=[
    {id:'sales',name:'Sales Execution',icon:'💰'},
    {id:'activity',name:'Activity Consistency',icon:'📞'},
    {id:'growth',name:'Customer Growth',icon:'↗'},
    {id:'retention',name:'Account Retention',icon:'🛡'},
    {id:'quality',name:'Order Quality',icon:'✓'},
    {id:'production',name:'Production Awareness',icon:'🏭'},
    {id:'service',name:'Customer Service',icon:'⭐'},
    {id:'followthrough',name:'Follow-Through',icon:'🔁'},
    {id:'ownership',name:'Personal Ownership',icon:'🧭'},
    {id:'coaching',name:'Coaching Execution',icon:'✦'}
  ];
  window._rp2GoalsTab=window._rp2GoalsTab||'overview';
  window._rp2GoalsModal=window._rp2GoalsModal||null;

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
    var d=window._rp2GoalsNow?new Date(window._rp2GoalsNow):new Date();
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
  function metricDef(id){return METRICS.filter(function(x){return x.id===id})[0]||METRICS[METRICS.length-1]}
  function dimDef(id){return DIMENSIONS.filter(function(x){return x.id===id})[0]||DIMENSIONS[0]}
  function readStore(){
    try{
      var x=JSON.parse(localStorage.getItem(STORE)||'null');
      if(x&&x.version===1&&x.reps)return x
    }catch(e){}
    return {version:1,reps:{}}
  }
  function saveStore(x){try{localStorage.setItem(STORE,JSON.stringify(x))}catch(e){}}
  function bucket(rep){
    var s=readStore();s.reps[rep]=s.reps[rep]||{goals:[],events:[]};return {store:s,data:s.reps[rep]}
  }
  function writeBucket(rep,b){b.store.reps[rep]=b.data;saveStore(b.store)}
  function event(b,type,goal,copy){
    b.data.events.push({id:'gev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),type:type,goalId:goal&&goal.id||'',title:goal&&goal.title||'',copy:copy||'',at:new Date().toISOString()})
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
    var through=weekly.slice(0,idx+1),sw=weekly[idx]||{key:'',label:'Selected week',revenue:0,orders:0,calls:0},goal=0;
    try{goal=n(c&&c.goal!=null?c.goal:_rp2Goal(_rp2.rep))}catch(e){}
    var qtd={revenue:through.reduce(function(s,w){return s+w.revenue},0),orders:through.reduce(function(s,w){return s+w.orders},0),calls:through.reduce(function(s,w){return s+w.calls},0)};
    var expected=goal*(through.length/Math.max(1,wks.length)),entered=through.filter(function(w){return w.entered}),avg=entered.length?entered.reduce(function(s,w){return s+w.revenue},0)/entered.length:0;
    return {year:year,q:q,wks:wks,weekly:weekly,through:through,selected:selected,selectedIndex:idx,selectedWeek:sw,goal:goal,qtd:qtd,expected:expected,projection:avg*wks.length}
  }
  function repOrders(){
    return safeArray(S&&S.orders).filter(function(o){return o&&o.rep===_rp2.rep}).map(function(o){
      var x={};Object.keys(o).forEach(function(k){x[k]=o[k]});x._goalDate=dval(o.orderDate||o.date||o.enteredAt);return x
    })
  }
  function customerIntel(orders,ctx){
    var map={};
    orders.filter(function(o){return o.kind==='order'}).forEach(function(o){
      var name=String(o.customer||'').trim();if(!name)return;
      var key=name.toLowerCase(),x=map[key]||(map[key]={name:name,orders:[]});
      x.orders.push(o)
    });
    var rows=Object.keys(map).map(function(k){
      var x=map[k];x.orders.sort(function(a,b){return (a._goalDate?a._goalDate.getTime():0)-(b._goalDate?b._goalDate.getTime():0)});
      x.first=x.orders[0]&&x.orders[0]._goalDate;x.last=x.orders[x.orders.length-1]&&x.orders[x.orders.length-1]._goalDate;
      x.revenue=x.orders.reduce(function(s,o){return s+n(o.total)},0);
      x.current=x.orders.filter(function(o){return o._goalDate&&o._goalDate.getFullYear()===ctx.year}).reduce(function(s,o){return s+n(o.total)},0);
      x.prior=x.orders.filter(function(o){return o._goalDate&&o._goalDate.getFullYear()===ctx.year-1}).reduce(function(s,o){return s+n(o.total)},0);
      x.daysSince=x.last?diffDays(x.last,now()):null;
      x.reactivated=x.orders.some(function(o,i){
        if(i===0||!o._goalDate||o._goalDate.getFullYear()!==ctx.year)return false;
        var prev=x.orders[i-1]._goalDate;return prev&&diffDays(prev,o._goalDate)>120
      });
      return x
    });
    var qStart=ctx.wks[0]&&dval(ctx.wks[0].start),qEnd=ctx.selectedWeek&&dval(ctx.selectedWeek.end);
    var newCustomers=rows.filter(function(x){return x.first&&qStart&&qEnd&&x.first>=qStart&&x.first<=qEnd}).length;
    var retainedBase=rows.filter(function(x){return x.prior>0}),retained=retainedBase.filter(function(x){return x.current>0}).length;
    return {
      rows:rows,newCustomers:newCustomers,reactivated:rows.filter(function(x){return x.reactivated}).length,
      dormant:rows.filter(function(x){return x.daysSince!=null&&x.daysSince>120}).length,
      declining:rows.filter(function(x){return x.prior>0&&x.current<x.prior*.85}).length,
      retentionRate:retainedBase.length?retained/retainedBase.length*100:null
    }
  }
  function activeReviews(){
    try{
      if(typeof _rvEnriched==='function'&&typeof _rvActive==='function'){
        return safeArray(_rvActive(_rvEnriched())).filter(function(x){return x&&x.matched&&x.repName===_rp2.rep}).map(function(x){var r=x.raw||{};return {stars:n(r.stars),msg:String(r.msg||''),date:dval(x.date||r.ts)}})
      }
    }catch(e){}
    var R=S&&S.reviews||{},fix=R.repFix||{},dec=R.decisions||{},seen={};
    return safeArray(R.rows).map(function(r){
      if(!r)return null;
      var id=String(r.id!=null?r.id:(String(r.ts||'')+'|'+String(r.msg||'').slice(0,50))),msg=String(r.msg||'').toLowerCase().replace(/\s+/g,' ').trim();
      if(dec[id]==='removed')return null;if(msg&&seen[msg]&&dec[id]!=='approved')return null;if(msg)seen[msg]=1;
      var rep=Object.prototype.hasOwnProperty.call(fix,id)?fix[id]:r.rep;if(rep!==_rp2.rep)return null;
      return {stars:n(r.stars),msg:String(r.msg||''),date:dval(r.ts)}
    }).filter(Boolean)
  }
  function qualityIntel(orders){
    var art=safeArray(S&&S.artErrors).filter(function(a){return a&&a.rep===_rp2.rep}),credits=safeArray(S&&S.cms).filter(function(c){return c&&c.rep===_rp2.rep});
    var err={};art.forEach(function(a){var k=String(a.so||a.soNum||'').toLowerCase().replace(/\s+/g,'');if(k)err[k]=1});
    credits.forEach(function(c){var k=String(c.soNum||c.so||'').toLowerCase().replace(/\s+/g,'');if(k&&String(c.fault||'').toLowerCase()==='rep')err[k]=1});
    var primary=orders.filter(function(o){return o.kind==='order'}).sort(function(a,b){return (a._goalDate?a._goalDate.getTime():0)-(b._goalDate?b._goalDate.getTime():0)}),current=0,longest=0,run=0;
    primary.forEach(function(o){
      var bad=err[String(o.orderNum||o.base||'').toLowerCase().replace(/\s+/g,'')];
      if(bad)run=0;else{run++;longest=Math.max(longest,run)}
    });
    for(var i=primary.length-1;i>=0;i--){
      var o=primary[i],bad=err[String(o.orderNum||o.base||'').toLowerCase().replace(/\s+/g,'')];
      if(bad)break;current++
    }
    var repFault=credits.filter(function(c){return String(c.fault||'').toLowerCase()==='rep'});
    var score=100-Math.min(55,art.length*3+repFault.length*5);
    return {art:art,credits:credits,repFault:repFault,currentClean:current,longestClean:longest,score:clamp(score,20,100)}
  }
  function productionIntel(){
    var rows=[],updated=null;
    try{
      var cfg=typeof getProductionFeedSettings==='function'?getProductionFeedSettings():JSON.parse(localStorage.getItem('salesTracker_productionFeed')||'null');
      if(cfg&&safeArray(cfg.rows).length){rows=safeArray(cfg.rows);updated=dval(cfg.lastRefresh)}
    }catch(e){}
    if(!rows.length){
      try{var p=S&&S.companyKnowledge&&S.companyKnowledge.production;if(p&&safeArray(p.rows).length){rows=safeArray(p.rows);updated=dval(p.lastFetched)}}catch(e){}
    }
    return {rows:rows,updated:updated,age:updated?diffDays(updated,now()):null}
  }
  function actionIntel(ctx){
    var s=null;try{s=JSON.parse(localStorage.getItem(ACTION_STORE)||'null')}catch(e){}
    var b=s&&s.reps&&s.reps[_rp2.rep]||{manual:[],state:{},events:[]},start=dval(ctx.selectedWeek.start),end=dval(ctx.selectedWeek.end);
    var events=safeArray(b.events),weekEvents=events.filter(function(e){var d=dval(e.at);return e&&e.type==='complete'&&d&&(!start||d>=start)&&(!end||d<=new Date(end.getTime()+86399999))});
    var manual=safeArray(b.manual),states=b.state||{},overdue=manual.filter(function(t){
      var st=states[t.id]||{};if(st.status==='completed')return false;var due=dval(st.dueDate||t.dueDate);return due&&due<now()
    });
    return {bucket:b,completions:weekEvents.length,events:events,manual:manual,overdue:overdue.length}
  }
  function managerGoals(){
    var pools=[S&&S.repGoals,S&&S.developmentGoals,S&&S.growthGoals],out=[];
    pools.forEach(function(pool){
      safeArray(pool).forEach(function(g){
        if(!g||g.rep!==_rp2.rep||g.visibleToRep===false)return;
        out.push({
          id:String(g.id||('mgr_'+hash([g.rep,g.title||g.name,g.dueDate||g.due].join('|')))),source:'manager',kind:String(g.kind||g.type||'development'),
          metric:String(g.metric||'manual'),skillId:String(g.skillId||g.dimension||'ownership'),title:String(g.title||g.name||'Manager-assigned growth goal'),
          why:String(g.why||g.summary||g.context||'This goal was assigned through the coaching workflow.'),target:n(g.target||g.targetValue||100),
          startValue:n(g.startValue||0),manualCurrent:n(g.current||g.currentValue||0),dueDate:iso(g.dueDate||g.due||''),weeklyBehavior:String(g.weeklyBehavior||g.behavior||g.action||'Complete the agreed weekly behavior.'),
          notes:String(g.repVisibleNotes||g.notesForRep||''),page:String(g.page||metricDef(g.metric).page||'goals'),locked:true,status:String(g.status||'active')
        })
      })
    });
    return out
  }
  function liveGoals(ctx,quality,customers,actions){
    var end=iso(ctx.selectedWeek.end||now()),out=[];
    if(ctx.goal>0)out.push({id:'live_revenue_'+ctx.year+'_'+ctx.q,source:'system',kind:'performance',metric:'quarter_revenue',title:'Reach the '+ctx.q+' revenue goal',why:'The official quarter revenue goal is the primary performance target.',target:ctx.goal,startValue:0,dueDate:iso(ctx.wks[ctx.wks.length-1]&&ctx.wks[ctx.wks.length-1].end||end),weeklyBehavior:'Build each week around '+money(Math.max(0,(ctx.goal-ctx.qtd.revenue)/Math.max(1,ctx.wks.length-ctx.through.length)))+' of qualified remaining revenue pace.',page:'forecast',locked:true,status:'active'});
    out.push({id:'live_calls_'+(ctx.selectedWeek.key||end),source:'system',kind:'performance',metric:'weekly_calls',title:'Reach the weekly call standard',why:'Consistent customer and contact activity protects future revenue.',target:125,startValue:0,dueDate:end,weeklyBehavior:'Protect two focused outbound blocks and work the highest-value customer reasons first.',page:'action',locked:true,status:'active'});
    out.push({id:'live_quality_'+ctx.year,source:'system',kind:'development',metric:'clean_order_streak',title:'Extend the clean-order streak',why:'Quality improvement is measured by preventing the next avoidable issue—not only reviewing old mistakes.',target:Math.max(20,quality.currentClean+5),startValue:0,dueDate:iso(new Date(ctx.year,11,31)),weeklyBehavior:'Use the highest-value Art Errors prevention checkpoint on every risk-sensitive order.',page:'arterrors',locked:true,status:'active'});
    out.push({id:'live_actions_'+(ctx.selectedWeek.key||end),source:'system',kind:'development',metric:'action_completions',title:'Close five meaningful action loops',why:'Follow-through becomes measurable when customer actions end with a recorded result and next step.',target:5,startValue:0,dueDate:end,weeklyBehavior:'Complete and record at least one meaningful customer or operational action each workday.',page:'action',locked:true,status:'active'});
    if(customers.dormant>0)out.push({id:'live_reactivation_'+ctx.year+'_'+ctx.q,source:'system',kind:'stretch',metric:'reactivated_customers',title:'Reactivate three dormant customers',why:customers.dormant+' customers are currently beyond 120 days since the latest recorded order.',target:3,startValue:0,dueDate:iso(ctx.wks[ctx.wks.length-1]&&ctx.wks[ctx.wks.length-1].end||end),weeklyBehavior:'Contact one high-value dormant customer with a specific seasonal, reorder, or program-planning reason.',page:'customers',locked:true,status:'active'});
    return out
  }
  function allQuarterHistory(rep){
    var out=[];
    for(var y=2023;y<=Number(getYr());y++)['Q1','Q2','Q3','Q4'].forEach(function(q){
      var ws=[];try{ws=safeArray(gwq(y,q))}catch(e){}
      var t={revenue:0,orders:0,calls:0},entered=0;
      ws.forEach(function(w){var d=(S&&S.data&&S.data[rep+'|'+w.key])||{};t.revenue+=n(d.revenue);t.orders+=n(d.orders);t.calls+=n(d.calls);if(n(d.revenue)||n(d.orders)||n(d.calls))entered++});
      var goal=0;try{goal=n(S&&S.goals&&S.goals[rep]&&S.goals[rep][String(y)]&&S.goals[rep][String(y)][q]&&S.goals[rep][String(y)][q].rev)}catch(e){}
      if(entered)out.push({year:y,q:q,label:q+' '+y,totals:t,goal:goal,entered:entered})
    });
    return out
  }
  function scorecard(ctx,orders,customers,reviews,quality,prod,actions,goals){
    var expected=ctx.expected,reviewRated=reviews.filter(function(r){return r.stars>0}),reviewAvg=reviewRated.length?reviewRated.reduce(function(s,r){return s+r.stars},0)/reviewRated.length:0;
    var entered=ctx.through.filter(function(w){return w.entered}),activity=entered.length?entered.reduce(function(s,w){return s+clamp(w.calls/125*100,0,100)},0)/entered.length:null;
    var sales=expected?clamp(ctx.qtd.revenue/expected*100,0,100):null;
    var growth=clamp((customers.newCustomers*18)+(customers.reactivated*22)+(customers.dormant?Math.max(0,30-customers.dormant*2):30),20,100);
    var retention=customers.retentionRate==null?null:clamp(customers.retentionRate,0,100);
    var production=prod.rows.length?(prod.age==null?65:clamp(100-prod.age*8,35,100)):45;
    var service=reviewRated.length?clamp(reviewAvg/5*100,0,100):null;
    var follow=clamp(55+actions.completions*8-actions.overdue*10,10,100);
    var personal=safeArray(goals).filter(function(g){return g.source==='manual'}).length,ownership=clamp(50+personal*8+actions.completions*5,20,100);
    var mgr=managerGoals(),mgrDone=mgr.filter(function(g){return g.status==='completed'}).length;
    var coaching=mgr.length?clamp(mgrDone/mgr.length*100,0,100):clamp(55+actions.completions*5,25,100);
    var rows=[
      {id:'sales',name:'Sales Execution',icon:'💰',score:sales,copy:expected?money(ctx.qtd.revenue)+' vs '+money(expected)+' selected-point pace':'Quarter goal unavailable'},
      {id:'activity',name:'Activity Consistency',icon:'📞',score:activity,copy:entered.length?'Average weekly call attainment across entered weeks':'No entered weekly activity'},
      {id:'growth',name:'Customer Growth',icon:'↗',score:growth,copy:customers.newCustomers+' new · '+customers.reactivated+' reactivated'},
      {id:'retention',name:'Account Retention',icon:'🛡',score:retention,copy:retention==null?'Prior-year customer base unavailable':Math.round(retention)+'% of prior-year customers reordered'},
      {id:'quality',name:'Order Quality',icon:'✓',score:quality.score,copy:quality.currentClean+' current clean orders · '+quality.art.length+' lifetime art errors'},
      {id:'production',name:'Production Awareness',icon:'🏭',score:production,copy:prod.rows.length?(prod.rows.length+' methods · '+(prod.age==null?'refresh age unknown':prod.age+' days old')):'Production feed unavailable'},
      {id:'service',name:'Customer Service',icon:'⭐',score:service,copy:reviewRated.length?(reviewAvg.toFixed(1)+' average across '+reviewRated.length+' rated reviews'):'Rated review history unavailable'},
      {id:'followthrough',name:'Follow-Through',icon:'🔁',score:follow,copy:actions.completions+' completions · '+actions.overdue+' overdue personal tasks'},
      {id:'ownership',name:'Personal Ownership',icon:'🧭',score:ownership,copy:personal+' personal goals · '+actions.completions+' weekly action completions'},
      {id:'coaching',name:'Coaching Execution',icon:'✦',score:coaching,copy:mgr.length?(mgrDone+' of '+mgr.length+' manager goals completed'):'No rep-visible manager goals'}
    ];
    var available=rows.filter(function(r){return r.score!=null}),overall=available.length?available.reduce(function(s,r){return s+r.score},0)/available.length:50;
    return {rows:rows,overall:Math.round(overall)}
  }
  function careerPath(score,history,card,reviews,quality){
    var goalHits=history.filter(function(q){return q.goal>0&&q.totals.revenue>=q.goal}).length,quarters=history.length;
    function val(id){var x=card.rows.filter(function(r){return r.id===id})[0];return x&&x.score!=null?x.score:0}
    var evidence={quarters:quarters,goalHits:goalHits,overall:score,service:val('service'),quality:val('quality'),growth:val('growth'),sales:val('sales'),follow:val('followthrough'),ownership:val('ownership'),coaching:val('coaching')};
    var stages=[
      {id:1,name:'Building Foundation',copy:'Establish reliable activity, data habits, order-quality basics, and a repeatable customer workflow.',reqs:[['Recorded quarter',quarters>=1],['Overall development 45+',score>=45]]},
      {id:2,name:'Consistent Contributor',copy:'Produce dependable weekly execution and maintain the basic activity and follow-through standards.',reqs:[['Overall development 55+',score>=55],['Activity 55+',val('activity')>=55],['Follow-through 55+',val('followthrough')>=55]]},
      {id:3,name:'Trusted Account Partner',copy:'Build customer confidence through service, retention, quality, and proactive communication.',reqs:[['Overall development 65+',score>=65],['Customer service 75+',val('service')>=75],['Quality 70+',val('quality')>=70],['Retention 60+',val('retention')>=60]]},
      {id:4,name:'Growth Driver',copy:'Create measurable customer expansion, new business, reactivation, and sustainable revenue momentum.',reqs:[['Overall development 72+',score>=72],['Sales execution 70+',val('sales')>=70],['Customer growth 65+',val('growth')>=65],['At least 2 recorded quarters',quarters>=2]]},
      {id:5,name:'Senior Sales Specialist',copy:'Combine goal achievement, customer leadership, operational judgment, and repeatable quality execution.',reqs:[['Overall development 80+',score>=80],['Quarter goal achieved',goalHits>=1],['Quality 75+',val('quality')>=75],['At least 3 recorded quarters',quarters>=3]]},
      {id:6,name:'Leadership Ready',copy:'Demonstrate strong ownership, coaching execution, quality, customer trust, and the ability to model repeatable behaviors.',reqs:[['Overall development 88+',score>=88],['Ownership 80+',val('ownership')>=80],['Follow-through 80+',val('followthrough')>=80],['Coaching execution 80+',val('coaching')>=80],['Quality 80+',val('quality')>=80]]}
    ];
    var current=1;
    stages.forEach(function(s){if(s.reqs.every(function(r){return r[1]}))current=s.id});
    return {stages:stages,current:current,evidence:evidence}
  }
  function goalCurrent(goal,data){
    var ctx=data.ctx,m=goal.metric;
    if(m==='quarter_revenue')return ctx.qtd.revenue;
    if(m==='weekly_calls')return ctx.selectedWeek.calls;
    if(m==='quarter_orders')return ctx.qtd.orders;
    if(m==='aov')return ctx.qtd.orders?ctx.qtd.revenue/ctx.qtd.orders:0;
    if(m==='reactivated_customers')return data.customers.reactivated;
    if(m==='new_customers')return data.customers.newCustomers;
    if(m==='clean_order_streak')return data.quality.currentClean;
    if(m==='lifetime_reviews')return data.reviews.length;
    if(m==='review_rating'){
      var rated=data.reviews.filter(function(r){return r.stars>0});return rated.length?rated.reduce(function(s,r){return s+r.stars},0)/rated.length:0
    }
    if(m==='action_completions')return data.actions.completions;
    if(m==='development_score'){
      var row=data.card.rows.filter(function(r){return r.id===(goal.skillId||'ownership')})[0];return row&&row.score!=null?row.score:0
    }
    return n(goal.manualCurrent)
  }
  function progress(goal,current){
    var start=n(goal.startValue),target=n(goal.target),den=target-start;
    if(goal.status==='completed')return 100;
    if(den<=0)return target>0?clamp(current/target*100,0,100):0;
    return clamp((current-start)/den*100,0,100)
  }
  function formatMetric(goal,v){
    var d=metricDef(goal.metric);
    if(d.unit==='money')return money(v);
    if(d.unit==='rating')return n(v).toFixed(1)+' ★';
    if(d.unit==='score')return Math.round(n(v))+'/100';
    return Math.round(n(v)).toLocaleString()
  }
  function overlayGoals(goals,b,data){
    return goals.map(function(g){
      var x={};Object.keys(g||{}).forEach(function(k){x[k]=g[k]});
      var current=goalCurrent(x,data),pct=progress(x,current);
      x.current=current;x.progress=pct;x.status=x.status||'active';
      if(x.status!=='completed'&&pct>=100)x.status='achieved';
      return x
    })
  }
  function build(){
    var ctx=selectedContext(),orders=repOrders(),customers=customerIntel(orders,ctx),reviews=activeReviews(),quality=qualityIntel(orders),prod=productionIntel(),actions=actionIntel(ctx),b=bucket(_rp2.rep);
    var manual=safeArray(b.data.goals).filter(function(g){return g&&!g.archived}),base=liveGoals(ctx,quality,customers,actions).concat(managerGoals()).concat(manual);
    var data={ctx:ctx,orders:orders,customers:customers,reviews:reviews,quality:quality,prod:prod,actions:actions,bucket:b};
    data.card=scorecard(ctx,orders,customers,reviews,quality,prod,actions,base);
    data.goals=overlayGoals(base,b,data);
    data.active=data.goals.filter(function(g){return g.status!=='completed'&&g.status!=='archived'});
    data.completed=data.goals.filter(function(g){return g.status==='completed'||g.status==='achieved'});
    data.history=allQuarterHistory(_rp2.rep);
    data.path=careerPath(data.card.overall,data.history,data.card,reviews,quality);
    data.events=safeArray(b.data.events).slice().sort(function(a,b){return String(b.at).localeCompare(String(a.at))});
    return data
  }
  function posture(g){
    var active=g.active.length,manual=g.active.filter(function(x){return x.source==='manual'}).length,lowest=g.card.rows.filter(function(r){return r.score!=null}).slice().sort(function(a,b){return a.score-b.score})[0],best=g.card.rows.filter(function(r){return r.score!=null}).slice().sort(function(a,b){return b.score-a.score})[0];
    if(!manual)return {tone:'info',title:'Your live targets are connected—now add one personal growth goal',copy:'System goals are tracking performance and behavior automatically. A personal development or stretch goal will connect the data to the skill you want to build intentionally.'};
    if(lowest&&lowest.score<55)return {tone:'warn',title:'The next growth breakthrough is '+lowest.name.toLowerCase(),copy:'Your scorecard shows the clearest development pressure in '+lowest.name.toLowerCase()+'. Keep the goal list focused enough that weekly behavior can change the evidence.'};
    return {tone:'good',title:'Your growth plan is active and evidence-based',copy:'You have '+active+' active goal'+(active===1?'':'s')+'. '+(best?('Your strongest development signal is '+best.name.toLowerCase()+'. '):'')+'Keep translating each goal into one repeatable weekly behavior.'}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-gg-section-head"><div><div class="rp2-gg-section-kick">'+kick+'</div><div class="rp2-gg-section-title">'+title+'</div></div><div class="rp2-gg-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-gg-kpi"><div class="rp2-gg-kpi-label">'+esc(label)+'</div><div class="rp2-gg-kpi-value">'+value+'</div><div class="rp2-gg-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-gg-tabs-wrap"><div class="rp2-gg-tabs">'+TABS.map(function(t){return '<button class="rp2-gg-tab '+(t.id===active?'active':'')+'" onclick="_rp2GoalsSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function goalEvidence(goal,g){
    var d=metricDef(goal.metric),bits=[d.name+' is measured directly from '+(goal.metric==='manual'?'rep-entered progress':'the connected tracker evidence')+'.'];
    if(goal.metric==='quarter_revenue')bits.push('Selected-point evidence ends at '+g.ctx.selectedWeek.label+'.');
    if(goal.metric==='weekly_calls')bits.push('This goal resets with the selected tracker week.');
    if(goal.metric==='clean_order_streak')bits.push('Clean streak is matched from primary orders against art errors and rep-fault credits by sales-order number.');
    if(goal.metric==='development_score')bits.push('The selected scorecard dimension is '+dimDef(goal.skillId).name+'.');
    return bits.join(' ')
  }
  function goalCard(goal,index,g){
    var current=goal.current,pct=Math.round(goal.progress),done=goal.status==='completed'||goal.status==='achieved',editable=goal.source==='manual',due=goal.dueDate?fmtDate(goal.dueDate):'No due date';
    return '<div class="rp2-gg-goal '+esc(goal.kind||'development')+' '+(done?'completed':'')+'" data-gg505="1" data-kind="'+esc(goal.kind||'development')+'" data-source="'+esc(goal.source||'manual')+'" data-status="'+esc(done?'completed':'active')+'" data-search="'+esc((goal.title+' '+goal.why+' '+goal.weeklyBehavior).toLowerCase())+'"><div class="rp2-gg-goal-grid"><div><div class="rp2-gg-goal-top"><span class="rp2-gg-tag '+(done?'good':'')+'">'+esc(goal.kind||'Goal')+'</span><span class="rp2-gg-tag">'+esc(goal.source==='system'?'Live tracker goal':goal.source==='manager'?'Manager-assigned':'Personal goal')+'</span><span class="rp2-gg-tag '+(done?'good':pct>=75?'info':pct>=40?'warn':'')+'">'+pct+'% complete</span></div><div class="rp2-gg-goal-title">'+esc(goal.title)+'</div><div class="rp2-gg-goal-why">'+esc(goal.why||'Personal growth goal.')+'</div><div class="rp2-gg-progress-wrap"><div class="rp2-gg-progress-head"><span>'+formatMetric(goal,current)+' current</span><strong>'+formatMetric(goal,goal.target)+' target</strong></div><div class="rp2-gg-bar"><span style="width:'+pct+'%"></span></div><div class="rp2-gg-milestones">'+[25,50,75,100].map(function(m){return '<div class="rp2-gg-mile '+(pct>=m?'hit':'')+'">'+m+'%</div>'}).join('')+'</div></div><div class="rp2-gg-behavior"><strong>Weekly behavior:</strong> '+esc(goal.weeklyBehavior||'Choose one repeatable behavior that moves this goal.')+'</div><div class="rp2-gg-evidence">'+esc(goalEvidence(goal,g))+'</div></div>'
      +'<div class="rp2-gg-goal-side"><div class="rp2-gg-side-row"><span>Starting point</span><strong>'+formatMetric(goal,goal.startValue||0)+'</strong></div><div class="rp2-gg-side-row"><span>Due date</span><strong>'+esc(due)+'</strong></div><div class="rp2-gg-side-row"><span>Linked tool</span><strong>'+esc(metricDef(goal.metric).page||goal.page||'Goals')+'</strong></div><div class="rp2-gg-side-row"><span>Status</span><strong>'+esc(done?'Achieved / complete':'Active')+'</strong></div><div class="rp2-gg-goal-buttons"><button class="rp2-gg-mini-btn action" '+(done?'disabled':'')+' onclick="_rp2GoalsPushAction(\''+encodeURIComponent(goal.id)+'\')">Add weekly action</button><button class="rp2-gg-mini-btn" onclick="_rp2GoalsCopySummary(\''+encodeURIComponent(goal.id)+'\')">Copy summary</button>'
      +(editable?'<button class="rp2-gg-mini-btn" onclick="_rp2GoalsEdit(\''+encodeURIComponent(goal.id)+'\')">Edit goal</button><button class="rp2-gg-mini-btn complete" '+(done?'disabled':'')+' onclick="_rp2GoalsComplete(\''+encodeURIComponent(goal.id)+'\')">Mark complete</button>':'<button class="rp2-gg-mini-btn" onclick="_rp2Go(\''+esc(goal.page||metricDef(goal.metric).page||'goals')+'\')">Open evidence</button><button class="rp2-gg-mini-btn" '+(goal.metric==='manual'&&!done?'':'disabled')+' onclick="_rp2GoalsProgress(\''+encodeURIComponent(goal.id)+'\')">Update progress</button>')
      +'</div></div></div></div>'
  }
  function goalsHTML(rows,g,emptyTitle,emptyCopy){
    if(!rows.length)return '<div class="rp2-gg-empty"><strong>'+esc(emptyTitle)+'</strong><span>'+esc(emptyCopy)+'</span></div>';
    return '<div class="rp2-gg-goals">'+rows.map(function(goal,i){return goalCard(goal,i,g)}).join('')+'</div>'
  }
  function scoreCards(g){
    return '<div class="rp2-gg-score-grid">'+g.card.rows.map(function(r){
      var value=r.score==null?'—':Math.round(r.score),width=r.score==null?0:r.score;
      return '<div class="rp2-gg-score-card"><div class="rp2-gg-score-name">'+r.icon+' '+esc(r.name)+'</div><div class="rp2-gg-score-value">'+value+'</div><div class="rp2-gg-score-bar"><span style="width:'+width+'%"></span></div><div class="rp2-gg-score-copy">'+esc(r.copy)+'</div></div>'
    }).join('')+'</div>'
  }
  function focusCards(g){
    var avail=g.card.rows.filter(function(r){return r.score!=null}).slice(),lowest=avail.slice().sort(function(a,b){return a.score-b.score})[0],highest=avail.slice().sort(function(a,b){return b.score-a.score})[0],nextStage=g.path.stages.filter(function(s){return s.id===Math.min(6,g.path.current+1)})[0];
    return '<div class="rp2-gg-grid-3">'
      +'<div class="rp2-gg-focus"><div class="rp2-gg-focus-icon">'+(lowest?lowest.icon:'🧭')+'</div><div class="rp2-gg-focus-label">Highest-value development focus</div><div class="rp2-gg-focus-title">'+esc(lowest?lowest.name:'Still forming')+'</div><div class="rp2-gg-focus-copy">'+esc(lowest?(lowest.copy+' Build one goal around a repeatable weekly behavior in this area.'):'More connected evidence is needed before selecting a development focus.')+'</div></div>'
      +'<div class="rp2-gg-focus"><div class="rp2-gg-focus-icon">'+(highest?highest.icon:'✓')+'</div><div class="rp2-gg-focus-label">Strength to leverage</div><div class="rp2-gg-focus-title">'+esc(highest?highest.name:'Still forming')+'</div><div class="rp2-gg-focus-copy">'+esc(highest?(highest.copy+' Use this strength to support the weaker development area.'):'More connected evidence is needed before identifying a durable strength.')+'</div></div>'
      +'<div class="rp2-gg-focus"><div class="rp2-gg-focus-icon">↗</div><div class="rp2-gg-focus-label">Next pathway evidence</div><div class="rp2-gg-focus-title">'+esc(nextStage?nextStage.name:g.path.stages[g.path.current-1].name)+'</div><div class="rp2-gg-focus-copy">'+esc(nextStage?('The next stage requires: '+nextStage.reqs.filter(function(r){return !r[1]}).map(function(r){return r[0]}).join(', ')+'.'):'The current pathway is at the highest modeled development stage.')+'</div></div>'
      +'</div>'
  }
  function overviewView(g){
    var p=posture(g),topGoals=g.active.slice().sort(function(a,b){return a.progress-b.progress}).slice(0,4);
    return sectionHead('Growth operating system','Connect daily behavior to measurable development','Live goals update from tracker evidence. Personal goals, notes, and history are stored on this device for the logged-in rep.')
      +'<div class="rp2-gg-summary"><div class="rp2-gg-summary-label">Growth interpretation</div><div class="rp2-gg-summary-title">'+esc(p.title)+'</div><div class="rp2-gg-summary-copy">'+esc(p.copy)+'</div></div>'
      +sectionHead('Goals requiring attention','The least-complete active goals first','A good plan stays focused. Use the weekly behavior button to place the next step directly into the Action Center.')
      +goalsHTML(topGoals,g,'No active goals need attention','Create a personal development or stretch goal to begin a focused growth plan.')
      +sectionHead('Development scorecard','Measure improvement against your own evidence','Scores are directional and designed for self-development—not compensation, discipline, or official promotion decisions.')
      +scoreCards(g)
      +sectionHead('Focus, strength, and next-stage evidence','Translate the scorecard into a development strategy','The pathway is a coaching model, not an official job-title or promotion framework.')
      +focusCards(g)
      +sectionHead('Growth trajectory','Selected-quarter weekly evidence','Revenue, calls, and orders stop at the selected week so historical selections remain point-in-time accurate.')
      +'<div class="rp2-gg-panel"><div class="rp2-gg-chart"><canvas id="rp2-gg-chart"></canvas></div></div>'
  }
  function filterBar(g){
    return '<div class="rp2-gg-filterbar"><input id="rp2-gg-search" type="search" placeholder="Search goals and behaviors…" oninput="_rp2GoalsApplyFilters()"><select id="rp2-gg-kind" onchange="_rp2GoalsApplyFilters()"><option value="">All goal types</option><option value="performance">Performance</option><option value="development">Development</option><option value="stretch">Stretch</option></select><select id="rp2-gg-status" onchange="_rp2GoalsApplyFilters()"><option value="">Any status</option><option value="active">Active</option><option value="completed">Achieved / complete</option></select><div id="rp2-gg-count" class="rp2-gg-filtercount">'+g.goals.length+' shown</div></div>'
  }
  function goalsView(g){
    return sectionHead('My Goals','Performance, development, and stretch goals in one place','System and manager goals are evidence-linked. Personal goals can use tracker metrics or manual progress.')
      +filterBar(g)
      +goalsHTML(g.goals,g,'No goals are available','Create the first personal goal to connect long-term growth to weekly execution.')
  }
  function scorecardView(g){
    return sectionHead('Development scorecard','Ten dimensions of repeatable sales performance','Each score explains the evidence behind it. Missing data remains unavailable instead of being treated as failure.')
      +scoreCards(g)
      +sectionHead('Development strategy','Build from strength while improving the weakest evidence','The best growth goal is specific enough to change a weekly behavior and measurable enough to show whether it worked.')
      +focusCards(g)
      +sectionHead('Scorecard chart','Current directional development profile','Unavailable dimensions are excluded from the overall average and shown as blank in the chart.')
      +'<div class="rp2-gg-panel"><div class="rp2-gg-chart"><canvas id="rp2-gg-chart"></canvas></div></div>'
  }
  function careerView(g){
    return sectionHead('Career growth pathway','A transparent development model','This pathway describes evidence of increasing sales maturity. It is not an official title, compensation, or promotion decision.')
      +'<div class="rp2-gg-path">'+g.path.stages.map(function(s){
        var achieved=s.id<g.path.current,current=s.id===g.path.current,met=s.reqs.filter(function(r){return r[1]}).length;
        return '<div class="rp2-gg-stage '+(current?'current':achieved?'achieved':'')+'"><div class="rp2-gg-stage-num">'+s.id+'</div><div><div class="rp2-gg-stage-name">'+esc(s.name)+'</div><div class="rp2-gg-stage-copy">'+esc(s.copy)+'</div><div class="rp2-gg-reqs">'+s.reqs.map(function(r){return '<span class="rp2-gg-req '+(r[1]?'hit':'')+'">'+(r[1]?'✓ ':'○ ')+esc(r[0])+'</span>'}).join('')+'</div></div><div class="rp2-gg-stage-status"><strong>'+esc(current?'Current modeled stage':achieved?'Evidence achieved':'Future stage')+'</strong>'+met+' of '+s.reqs.length+' requirements currently met</div></div>'
      }).join('')+'</div>'
      +sectionHead('Current evidence summary','What the pathway is using','The model uses connected tracker data, local goal execution, customer outcomes, quality, and service evidence.')
      +'<div class="rp2-gg-grid-4"><div class="rp2-gg-summary"><div class="rp2-gg-summary-label">Overall development</div><div class="rp2-gg-summary-title">'+g.card.overall+'/100</div><div class="rp2-gg-summary-copy">Average of available scorecard dimensions.</div></div><div class="rp2-gg-summary"><div class="rp2-gg-summary-label">Recorded quarters</div><div class="rp2-gg-summary-title">'+g.history.length+'</div><div class="rp2-gg-summary-copy">Quarter histories containing entered sales/activity data.</div></div><div class="rp2-gg-summary"><div class="rp2-gg-summary-label">Quarter goals achieved</div><div class="rp2-gg-summary-title">'+g.history.filter(function(q){return q.goal>0&&q.totals.revenue>=q.goal}).length+'</div><div class="rp2-gg-summary-copy">Recorded quarters meeting or exceeding the official revenue goal.</div></div><div class="rp2-gg-summary"><div class="rp2-gg-summary-label">Current pathway stage</div><div class="rp2-gg-summary-title">'+g.path.current+'</div><div class="rp2-gg-summary-copy">'+esc(g.path.stages[g.path.current-1].name)+'</div></div></div>'
  }
  function historyView(g){
    var rows=g.events;
    return sectionHead('Goal history','A record of intentional growth activity','Creation, edits, progress updates, completions, and Action Center connections are stored on this device.')
      +(rows.length?'<div class="rp2-gg-history">'+rows.map(function(e){return '<div class="rp2-gg-history-row"><div class="rp2-gg-history-date">'+fmtDate(e.at)+'</div><div class="rp2-gg-history-type">'+esc(e.type||'Update')+'</div><div class="rp2-gg-history-title">'+esc(e.title||'Goal activity')+'</div><div class="rp2-gg-history-copy">'+esc(e.copy||'')+'</div></div>'}).join('')+'</div>':'<div class="rp2-gg-empty"><strong>No personal goal history is recorded</strong><span>Create, edit, update, complete, or connect a goal to the Action Center to begin the history.</span></div>')
      +sectionHead('Quarter evidence history','Performance context behind long-term growth','These quarter rows come from official weekly scorecards and quarter goals.')
      +(g.history.length?'<div class="rp2-gg-history">'+g.history.slice().reverse().map(function(q){return '<div class="rp2-gg-history-row"><div class="rp2-gg-history-date">'+esc(q.label)+'</div><div class="rp2-gg-history-type">'+(q.goal>0&&q.totals.revenue>=q.goal?'Goal achieved':'Recorded quarter')+'</div><div class="rp2-gg-history-title">'+money(q.totals.revenue)+' · '+q.totals.orders+' orders · '+q.totals.calls+' calls</div><div class="rp2-gg-history-copy">'+(q.goal?Math.round(q.totals.revenue/q.goal*100)+'% of '+money(q.goal)+' goal':'No official revenue goal available')+'</div></div>'}).join('')+'</div>':'<div class="rp2-gg-empty"><strong>No quarter history is available</strong><span>Quarter evidence appears after official weekly scorecards are entered.</span></div>')
  }
  function modalHTML(g){
    var m=window._rp2GoalsModal;if(!m)return '';
    var id=decodeURIComponent(m.id||''),goal=g.goals.filter(function(x){return x.id===id})[0]||null;
    if(m.mode==='progress'&&goal){
      return '<div class="rp2-gg-modal-wrap" onclick="if(event.target===this)_rp2GoalsCloseModal()"><aside class="rp2-gg-modal"><div class="rp2-gg-modal-head"><div><div class="rp2-gg-modal-kick">Update manual progress</div><div class="rp2-gg-modal-title">'+esc(goal.title)+'</div><div class="rp2-gg-modal-sub">Current: '+formatMetric(goal,goal.current)+' · Target: '+formatMetric(goal,goal.target)+'</div></div><button class="rp2-gg-close" onclick="_rp2GoalsCloseModal()">×</button></div><div class="rp2-gg-form"><div class="rp2-gg-field"><label>Current progress</label><input id="rp2-gg-progress-value" type="number" step="0.1" value="'+n(goal.manualCurrent||goal.current)+'"></div><div class="rp2-gg-field"><label>Evidence / note</label><textarea id="rp2-gg-progress-note" placeholder="What changed? What did you practice or accomplish?"></textarea></div></div><div class="rp2-gg-modal-actions"><button class="rp2-gg-btn" onclick="_rp2GoalsCloseModal()">Cancel</button><button class="rp2-gg-btn primary" onclick="_rp2GoalsSaveProgress(\''+encodeURIComponent(goal.id)+'\')">Save progress</button></div></aside></div>'
    }
    var edit=goal&&goal.source==='manual',base=edit?goal:{kind:'development',metric:'development_score',skillId:'followthrough',title:'',why:'',target:80,startValue:0,manualCurrent:0,dueDate:iso(new Date(now().getFullYear(),now().getMonth()+3,now().getDate())),weeklyBehavior:'',notes:'',page:'goals'};
    return '<div class="rp2-gg-modal-wrap" onclick="if(event.target===this)_rp2GoalsCloseModal()"><aside class="rp2-gg-modal"><div class="rp2-gg-modal-head"><div><div class="rp2-gg-modal-kick">'+(edit?'Edit personal goal':'Create personal goal')+'</div><div class="rp2-gg-modal-title">'+(edit?'Refine the target and behavior':'Choose a measurable target and one weekly behavior')+'</div><div class="rp2-gg-modal-sub">Personal goals remain scoped to '+esc(_rp2.rep)+' on this browser.</div></div><button class="rp2-gg-close" onclick="_rp2GoalsCloseModal()">×</button></div><div class="rp2-gg-form">'
      +'<div class="rp2-gg-form-grid"><div class="rp2-gg-field"><label>Goal type</label><select id="rp2-gg-new-kind">'+['performance','development','stretch'].map(function(x){return '<option value="'+x+'" '+(base.kind===x?'selected':'')+'>'+x.replace(/\b\w/g,function(z){return z.toUpperCase()})+'</option>'}).join('')+'</select></div><div class="rp2-gg-field"><label>Progress metric</label><select id="rp2-gg-new-metric" onchange="_rp2GoalsMetricChanged()">'+METRICS.map(function(x){return '<option value="'+x.id+'" '+(base.metric===x.id?'selected':'')+'>'+esc(x.name)+'</option>'}).join('')+'</select></div></div>'
      +'<div class="rp2-gg-field" id="rp2-gg-skill-wrap"><label>Scorecard dimension</label><select id="rp2-gg-new-skill">'+DIMENSIONS.map(function(x){return '<option value="'+x.id+'" '+((base.skillId||'followthrough')===x.id?'selected':'')+'>'+esc(x.name)+'</option>'}).join('')+'</select></div>'
      +'<div class="rp2-gg-field"><label>Goal title</label><input id="rp2-gg-new-title" value="'+esc(base.title||'')+'" placeholder="Improve follow-through, beat my revenue record…"></div>'
      +'<div class="rp2-gg-field"><label>Why this matters</label><textarea id="rp2-gg-new-why" placeholder="What will improve for the customer, the business, or your career?">'+esc(base.why||'')+'</textarea></div>'
      +'<div class="rp2-gg-form-grid"><div class="rp2-gg-field"><label>Starting point</label><input id="rp2-gg-new-start" type="number" step="0.1" value="'+n(base.startValue)+'"></div><div class="rp2-gg-field"><label>Target</label><input id="rp2-gg-new-target" type="number" step="0.1" value="'+n(base.target||100)+'"></div></div>'
      +'<div class="rp2-gg-form-grid"><div class="rp2-gg-field"><label>Manual current value</label><input id="rp2-gg-new-current" type="number" step="0.1" value="'+n(base.manualCurrent)+'"></div><div class="rp2-gg-field"><label>Due date</label><input id="rp2-gg-new-due" type="date" value="'+esc(base.dueDate||'')+'"></div></div>'
      +'<div class="rp2-gg-field"><label>Weekly behavior</label><textarea id="rp2-gg-new-behavior" placeholder="What repeatable action will move the goal every week?">'+esc(base.weeklyBehavior||'')+'</textarea></div>'
      +'<div class="rp2-gg-field"><label>Personal notes</label><textarea id="rp2-gg-new-notes" placeholder="Reflection, obstacles, or evidence you want to remember…">'+esc(base.notes||'')+'</textarea></div>'
      +'</div><div class="rp2-gg-disclosure"><strong>Evidence-based progress:</strong> tracker metrics update automatically through the selected week. Manual progress is used only when the selected metric cannot be calculated from connected data.</div><div class="rp2-gg-modal-actions">'+(edit?'<button class="rp2-gg-btn rp2-gg-delete" onclick="_rp2GoalsArchive(\''+encodeURIComponent(goal.id)+'\')">Archive goal</button>':'')+'<button class="rp2-gg-btn" onclick="_rp2GoalsCloseModal()">Cancel</button><button class="rp2-gg-btn primary" onclick="_rp2GoalsSave(\''+(edit?encodeURIComponent(goal.id):'')+'\')">'+(edit?'Save changes':'Create goal')+'</button></div></aside></div>'
  }

  function rerender(){
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2GoalsV2();
    setTimeout(function(){try{window._rp2GoalsDraw();window._rp2GoalsApplyFilters();window._rp2GoalsMetricChanged()}catch(e){}},0)
  }
  window._rp2GoalsSetTab=function(id){window._rp2GoalsTab=id;window._rp2GoalsModal=null;rerender();var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0}
  window._rp2GoalsNew=function(){window._rp2GoalsModal={mode:'new',id:''};rerender()}
  window._rp2GoalsEdit=function(id){window._rp2GoalsModal={mode:'edit',id:id};rerender()}
  window._rp2GoalsProgress=function(id){window._rp2GoalsModal={mode:'progress',id:id};rerender()}
  window._rp2GoalsCloseModal=function(){window._rp2GoalsModal=null;rerender()}
  window._rp2GoalsMetricChanged=function(){
    var metric=(document.getElementById('rp2-gg-new-metric')||{}).value||'',wrap=document.getElementById('rp2-gg-skill-wrap'),cur=document.getElementById('rp2-gg-new-current');
    if(wrap)wrap.style.display=metric==='development_score'?'block':'none';
    if(cur)cur.disabled=metric!=='manual'
  }
  window._rp2GoalsSave=function(encoded){
    var g=build(),b=g.bucket,id=encoded?decodeURIComponent(encoded):'',title=((document.getElementById('rp2-gg-new-title')||{}).value||'').trim();if(!title)return;
    var metric=((document.getElementById('rp2-gg-new-metric')||{}).value||'manual'),def=metricDef(metric),goal={
      id:id||('goal_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)),source:'manual',
      kind:((document.getElementById('rp2-gg-new-kind')||{}).value||'development'),metric:metric,
      skillId:((document.getElementById('rp2-gg-new-skill')||{}).value||'followthrough'),title:title,
      why:((document.getElementById('rp2-gg-new-why')||{}).value||'').trim()||'Personal growth goal.',
      startValue:n((document.getElementById('rp2-gg-new-start')||{}).value),target:n((document.getElementById('rp2-gg-new-target')||{}).value),
      manualCurrent:n((document.getElementById('rp2-gg-new-current')||{}).value),dueDate:((document.getElementById('rp2-gg-new-due')||{}).value||''),
      weeklyBehavior:((document.getElementById('rp2-gg-new-behavior')||{}).value||'').trim()||'Complete one repeatable weekly action tied to this goal.',
      notes:((document.getElementById('rp2-gg-new-notes')||{}).value||'').trim(),page:def.page||'goals',status:'active',
      createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
    };
    var idx=b.data.goals.findIndex(function(x){return x&&x.id===goal.id});
    if(idx>=0){goal.createdAt=b.data.goals[idx].createdAt||goal.createdAt;goal.status=b.data.goals[idx].status||'active';b.data.goals[idx]=goal;event(b,'Edited goal',goal,'Updated the target, evidence, or weekly behavior.')}
    else{b.data.goals.push(goal);event(b,'Created goal',goal,'Created a '+goal.kind+' goal using the '+def.name.toLowerCase()+' metric.')}
    writeBucket(_rp2.rep,b);window._rp2GoalsModal=null;rerender()
  };
  window._rp2GoalsSaveProgress=function(encoded){
    var id=decodeURIComponent(encoded),g=build(),b=g.bucket,idx=b.data.goals.findIndex(function(x){return x&&x.id===id});if(idx<0)return;
    var value=n((document.getElementById('rp2-gg-progress-value')||{}).value),note=((document.getElementById('rp2-gg-progress-note')||{}).value||'').trim();
    b.data.goals[idx].manualCurrent=value;b.data.goals[idx].updatedAt=new Date().toISOString();
    event(b,'Progress update',b.data.goals[idx],'Updated manual progress to '+value+(note?' · '+note:'')+'.');
    writeBucket(_rp2.rep,b);window._rp2GoalsModal=null;rerender()
  };
  window._rp2GoalsComplete=function(encoded){
    var id=decodeURIComponent(encoded),g=build(),b=g.bucket,idx=b.data.goals.findIndex(function(x){return x&&x.id===id});if(idx<0)return;
    b.data.goals[idx].status='completed';b.data.goals[idx].completedAt=new Date().toISOString();event(b,'Completed goal',b.data.goals[idx],'Marked the goal complete and preserved the final evidence.');
    writeBucket(_rp2.rep,b);rerender()
  };
  window._rp2GoalsArchive=function(encoded){
    var id=decodeURIComponent(encoded),g=build(),b=g.bucket,idx=b.data.goals.findIndex(function(x){return x&&x.id===id});if(idx<0)return;
    b.data.goals[idx].archived=true;b.data.goals[idx].status='archived';event(b,'Archived goal',b.data.goals[idx],'Removed the goal from the active plan without deleting its history.');
    writeBucket(_rp2.rep,b);window._rp2GoalsModal=null;rerender()
  };
  window._rp2GoalsPushAction=function(encoded){
    var id=decodeURIComponent(encoded),g=build(),goal=g.goals.filter(function(x){return x.id===id})[0];if(!goal)return;
    var s=null;try{s=JSON.parse(localStorage.getItem(ACTION_STORE)||'null')}catch(e){}
    if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};
    var b=s.reps[_rp2.rep]||(s.reps[_rp2.rep]={manual:[],state:{},events:[]}),due=goal.dueDate&&dval(goal.dueDate)<dval(g.ctx.selectedWeek.end)?goal.dueDate:iso(g.ctx.selectedWeek.end||now());
    var existing=b.manual.filter(function(t){var st=b.state&&b.state[t.id]||{};return t&&t.goalId===goal.id&&st.status!=='completed'&&t.dueDate===due})[0];
    if(!existing){
      var task={id:'goalact_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),source:'manual',category:'coaching',tone:'info',score:160,title:'Goal behavior: '+goal.title,why:'Weekly behavior connected from Goals & Growth: '+goal.weeklyBehavior,action:goal.weeklyBehavior,measure:'Complete the behavior and record the evidence',dueDate:due,customer:'',orderNum:'',value:0,page:goal.page||metricDef(goal.metric).page||'goals',goalId:goal.id};
      b.manual.push(task);b.events.push({type:'create',taskId:task.id,title:task.title,at:new Date().toISOString(),weekKey:g.ctx.selectedWeek.key||'',goalId:goal.id});
      localStorage.setItem(ACTION_STORE,JSON.stringify(s))
    }
    var gb=g.bucket;event(gb,'Action Center connection',goal,existing?'The weekly behavior was already scheduled for '+fmtDate(due)+'.':'Added the weekly behavior to the Action Center for '+fmtDate(due)+'.');writeBucket(_rp2.rep,gb);rerender()
  };
  window._rp2GoalsCopySummary=function(encoded){
    var id=decodeURIComponent(encoded),g=build(),goal=g.goals.filter(function(x){return x.id===id})[0];if(!goal)return;
    var txt='GOAL SUMMARY — '+_rp2.rep+'\n\nGoal: '+goal.title+'\nType: '+goal.kind+'\nProgress: '+formatMetric(goal,goal.current)+' of '+formatMetric(goal,goal.target)+' ('+Math.round(goal.progress)+'%)\nDue: '+(goal.dueDate?fmtDate(goal.dueDate):'No due date')+'\nWhy: '+goal.why+'\nWeekly behavior: '+goal.weeklyBehavior+'\nEvidence: '+goalEvidence(goal,g);
    try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt);else prompt('Copy goal summary:',txt)}catch(e){prompt('Copy goal summary:',txt)}
  };
  window._rp2GoalsApplyFilters=function(){
    try{
      var q=((document.getElementById('rp2-gg-search')||{}).value||'').toLowerCase().trim(),kind=((document.getElementById('rp2-gg-kind')||{}).value||''),status=((document.getElementById('rp2-gg-status')||{}).value||'');
      var cards=safeArray(document.querySelectorAll?document.querySelectorAll('#rp2-page [data-gg505="1"]'):[]),shown=0;
      cards.forEach(function(card){
        var ok=(!q||String(card.getAttribute('data-search')||'').indexOf(q)>=0)&&(!kind||card.getAttribute('data-kind')===kind)&&(!status||card.getAttribute('data-status')===status);
        card.style.display=ok?'block':'none';if(ok)shown++
      });
      var count=document.getElementById('rp2-gg-count');if(count)count.textContent=shown+' shown'
    }catch(e){}
  };

  window._rp2GoalsV2=function(){
    try{
      var g=build(),tab=window._rp2GoalsTab,p=posture(g),stage=g.path.stages[g.path.current-1],activePersonal=g.active.filter(function(x){return x.source==='manual'}).length,avgProgress=g.active.length?g.active.reduce(function(s,x){return s+x.progress},0)/g.active.length:0;
      var hero='<div class="rp2-gg-hero"><div class="rp2-gg-hero-grid"><div><div class="rp2-gg-kick">Goals & Growth Center 2.0 · EVIDENCE-BASED DEVELOPMENT · BUILD v505</div><div class="rp2-gg-title">Turn daily execution into long-term growth</div><div class="rp2-gg-copy">Connect live performance goals, personal development targets, weekly behaviors, Action Center work, and a transparent career-growth pathway. Progress updates from tracker evidence whenever the metric is available.</div><div class="rp2-gg-pills"><span class="rp2-gg-pill '+p.tone+'">'+esc(p.title)+'</span><span class="rp2-gg-pill info">'+g.active.length+' active goals</span><span class="rp2-gg-pill">Personal state · this device</span></div><div class="rp2-gg-hero-actions"><button class="rp2-gg-btn primary" onclick="_rp2GoalsNew()">＋ Create personal goal</button><button class="rp2-gg-btn purple" onclick="_rp2Go(\'action\')">Open Action Center</button></div></div>'
        +'<div class="rp2-gg-brief"><div><div class="rp2-gg-brief-label">Current modeled growth stage</div><div class="rp2-gg-level-row"><div class="rp2-gg-level">'+esc(stage.name)+'</div><div class="rp2-gg-level-num">Stage '+g.path.current+'</div></div><div class="rp2-gg-brief-title">'+g.card.overall+'/100 overall development score</div><div class="rp2-gg-brief-copy">'+esc(stage.copy)+' This is a coaching model—not an official title or promotion decision.</div></div><div class="rp2-gg-brief-foot"><span>Personal goals <strong>'+activePersonal+'</strong></span><span>Average active progress <strong>'+Math.round(avgProgress)+'%</strong></span></div></div></div></div>';
      var rated=g.reviews.filter(function(r){return r.stars>0}),reviewAvg=rated.length?rated.reduce(function(s,r){return s+r.stars},0)/rated.length:0;
      var kpis='<div class="rp2-gg-kpis">'
        +kpi('Active goals',String(g.active.length),activePersonal+' personal · '+g.active.filter(function(x){return x.source==='manager'}).length+' manager')
        +kpi('Average goal progress',Math.round(avgProgress)+'%',g.completed.length+' achieved or completed')
        +kpi('Quarter revenue progress',g.ctx.goal?Math.round(g.ctx.qtd.revenue/g.ctx.goal*100)+'%':'—',money(g.ctx.qtd.revenue)+' of '+(g.ctx.goal?money(g.ctx.goal):'no goal'))
        +kpi('Selected-week calls',String(g.ctx.selectedWeek.calls),Math.max(0,125-g.ctx.selectedWeek.calls)+' remaining to 125')
        +kpi('Clean-order streak',String(g.quality.currentClean),'Personal record '+g.quality.longestClean)
        +kpi('Customer growth',String(g.customers.newCustomers+g.customers.reactivated),g.customers.newCustomers+' new · '+g.customers.reactivated+' reactivated')
        +kpi('Customer reputation',rated.length?reviewAvg.toFixed(1)+' ★':'—',g.reviews.length+' lifetime active reviews')
        +kpi('Action completion',String(g.actions.completions),g.actions.overdue+' overdue personal tasks')
        +'</div>';
      var content=tab==='goals'?goalsView(g):tab==='scorecard'?scorecardView(g):tab==='career'?careerView(g):tab==='history'?historyView(g):overviewView(g);
      return '<div class="rp2-gg-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+modalHTML(g)
    }catch(e){
      console.error('[Goals & Growth v505 render error]',e);
      return '<div class="rp2-gg-shell"><div class="rp2-gg-hero"><div class="rp2-gg-kick">Goals & Growth Center 2.0 · RECOVERY MODE</div><div class="rp2-gg-title">The growth engine hit a data compatibility issue</div><div class="rp2-gg-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2GoalsDraw=function(){
    if(typeof Chart!=='function')return;
    if(window._rp2GoalsTab!=='overview'&&window._rp2GoalsTab!=='scorecard')return;
    var canvas=document.getElementById('rp2-gg-chart');if(!canvas)return;
    var g=build();
    if(_rp2.goalsChart){try{_rp2.goalsChart.destroy()}catch(e){}}
    if(window._rp2GoalsTab==='scorecard'){
      var rows=g.card.rows;
      _rp2.goalsChart=new Chart(canvas.getContext('2d'),{
        type:'bar',data:{labels:rows.map(function(r){return r.name}),datasets:[{label:'Development score',data:rows.map(function(r){return r.score}),backgroundColor:'rgba(245,190,100,.68)',borderRadius:6}]},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100,ticks:{color:'#8b95a7',callback:function(v){return v}},grid:{color:'rgba(255,255,255,.05)'}},y:{ticks:{color:'#aab4c6',font:{size:9}},grid:{display:false}}}}
      })
    }else{
      var rows2=g.ctx.weekly.slice(0,g.ctx.selectedIndex+1);
      _rp2.goalsChart=new Chart(canvas.getContext('2d'),{
        type:'bar',data:{labels:rows2.map(function(w){return w.label}),datasets:[
          {type:'bar',label:'Revenue',data:rows2.map(function(w){return w.revenue}),backgroundColor:'rgba(245,190,100,.68)',borderRadius:6,yAxisID:'money'},
          {type:'line',label:'Calls',data:rows2.map(function(w){return w.calls}),borderColor:'#FA873D',pointRadius:3,tension:.25,yAxisID:'activity'},
          {type:'line',label:'Orders',data:rows2.map(function(w){return w.orders}),borderColor:'#4ed6a3',pointRadius:3,tension:.25,yAxisID:'orders'}
        ]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}}},scales:{x:{ticks:{color:'#8b95a7',font:{size:9}},grid:{display:false}},money:{beginAtZero:true,ticks:{color:'#8b95a7',callback:function(v){return '$'+Math.round(v/1000)+'K'}},grid:{color:'rgba(255,255,255,.05)'}},activity:{position:'right',beginAtZero:true,ticks:{color:'#8b95a7'},grid:{display:false}},orders:{display:false,beginAtZero:true}}}
      })
    }
  };
})();
