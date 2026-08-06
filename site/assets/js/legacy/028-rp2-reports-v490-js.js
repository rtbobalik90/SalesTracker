
(function(){
  var RH_TABS=[
    {id:'weekly',label:'Weekly Review',icon:'▦'},
    {id:'monthly',label:'Monthly Review',icon:'◫'},
    {id:'quarter',label:'Quarter Snapshot',icon:'◇'},
    {id:'ytd',label:'Year-to-Date',icon:'◈'},
    {id:'coaching',label:'Coaching Summary',icon:'◎'},
    {id:'history',label:'Report History',icon:'◷'}
  ];
  window._rp2ReportTab=window._rp2ReportTab||'weekly';

  function n(v){return Number(v)||0}
  function safeArray(v){
    if(Array.isArray(v))return v;
    if(!v)return [];
    try{
      if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);
      if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null});
    }catch(e){}
    return [];
  }
  function safeWeeks(v){return safeArray(v).filter(function(w){return w&&typeof w==='object'})}
  function safeStateArray(key){try{return safeArray(S&&S[key])}catch(e){return []}}
  function own(obj,key){return !!(obj&&Object.prototype.hasOwnProperty.call(obj,key))}
  function weekEndISO(w){try{return w&&w.end?iso(w.end):''}catch(e){return ''}}
  function exactWeeklyRecord(rep,w){
    if(!rep||!w||!w.key)return null;
    try{var key=rep+'|'+w.key;return own(S&&S.data,key)?S.data[key]:null}catch(e){return null}
  }
  function dailyWeekFallback(rep,w){
    var end=weekEndISO(w);
    if(!rep||!end||typeof window._drDayTotals!=='function')return {available:false,revenue:0,coverage:0,lastDate:'',source:'none'};
    try{
      var t=window._drDayTotals(end),row=(t&&t.rows||[]).filter(function(r){return r&&r.name===rep})[0]||null;
      if(!row||n(row.cum)<=0)return {available:false,revenue:0,coverage:0,lastDate:'',source:'managementDailyRep'};
      var coverage=0,lastDate='',start=w&&w.start?iso(w.start):end;
      try{var d=dt(start),stop=dt(end),guard=0;while(d&&stop&&d<=stop&&guard<10){var day=iso(d),rec=S&&S.dailyRep&&S.dailyRep[day];if(rec&&own(rec,rep)){coverage++;lastDate=day}d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1,12);guard++}}catch(e){}
      return {available:true,revenue:n(row.cum),coverage:coverage,lastDate:lastDate||end,source:'managementDailyRep'}
    }catch(e){return {available:false,revenue:0,coverage:0,lastDate:'',source:'managementDailyRep',error:(e&&e.message)||String(e)}}
  }
  function dailyWeekRank(rep,w){
    var end=weekEndISO(w);if(!end||typeof window._drDayTotals!=='function')return {rank:null,total:0};
    try{var rows=(window._drDayTotals(end)||{}).rows||[];rows=rows.filter(function(r){return r&&n(r.cum)>0}).slice().sort(function(a,b){return n(b.cum)-n(a.cum)});var rank=null;rows.forEach(function(r,i){if(r.name===rep)rank=i+1});return {rank:rank,total:rows.length}}catch(e){return {rank:null,total:0}}
  }
  function esc(v){return _rp2Esc(String(v==null?'':v))}
  function money(v){return _rp2$(n(v))}
  function pct(v){return Math.round(n(v))+'%'}
  function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
  function dt(v){
    if(v==null||v==='')return null;
    var d;
    try{
      if(v instanceof Date)d=new Date(v.getTime());
      else if(typeof v==='number')d=new Date(v);
      else{
        var s=String(v);
        d=new Date(s.length===10&&/^\d{4}-\d{2}-\d{2}$/.test(s)?s+'T12:00:00':s);
      }
    }catch(e){return null}
    return d&&!isNaN(d.getTime())?d:null
  }
  function iso(d){
    d=dt(d);
    return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')):''
  }
  function displayDate(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
  function monthName(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'long'}):String(v||'Month')}
  function shortMonth(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short'}):String(v||'')}
  function qNum(q){return parseInt(String(q).replace(/\D/g,''),10)||1}
  function weekKeys(weeks){var s={};safeWeeks(weeks).forEach(function(w){if(w&&w.key)s[w.key]=1});return s}
  function totals(rep,weeks){
    var t={revenue:0,orders:0,calls:0},entered=0;
    safeWeeks(weeks).forEach(function(w){
      var data=(S&&S.data&&typeof S.data==='object')?S.data:{};
      var d=data[rep+'|'+w.key]||{},has=!!(n(d.revenue)||n(d.orders)||n(d.calls));
      if(has)entered++;
      t.revenue+=n(d.revenue);t.orders+=n(d.orders);t.calls+=n(d.calls)
    });
    t.entered=entered;t.aov=t.orders?t.revenue/t.orders:0;t.callsKnown=entered>0;t.source='weeklyScorecard';
    return t
  }
  function ranks(rep,weeks){
    var reps=[];
    try{reps=safeArray(typeof activeReps==='function'?activeReps():(S&&S.reps))}catch(e){reps=safeStateArray('reps')}
    var rows=reps.map(function(r){
      var name=typeof r==='string'?r:(r&&r.name);
      if(!name)return null;
      var t=totals(name,weeks);return {name:name,revenue:t.revenue}
    }).filter(Boolean).sort(function(a,b){return b.revenue-a.revenue});
    var rank=null;rows.forEach(function(r,i){if(r.name===rep)rank=i+1});
    return {rank:rank,total:rows.length,rows:rows}
  }
  function weekState(w){
    if(!w)return 'No week selected';
    var now=new Date(),s=dt(w.start),e=dt(w.end);if(e)e=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999);
    if(s&&now<s)return 'Future week';
    if(s&&e&&now>=s&&now<=e)return 'Live week';
    return 'Completed week'
  }
  function currentContext(){
    try{return window._rp2V476Context?window._rp2V476Context(_rp2.rep):null}catch(e){console.warn('[Reports Hub] context unavailable',e);return null}
  }
  function monthWeeks(year,q,month,selected){
    var rows=[];try{rows=safeWeeks(gwm(year,q,month))}catch(e){rows=[]}
    if(selected){
      var end=dt(selected.end),cut=end?end.getTime():Infinity;
      rows=rows.filter(function(w){var we=dt(w.end);return !we||we.getTime()<=cut})
    }
    return rows
  }
  function ytdWeeks(year,q,selected){
    var out=[],qn=qNum(q);
    for(var i=1;i<=qn;i++){
      var ws=[];try{ws=safeWeeks(gwq(year,'Q'+i))}catch(e){ws=[]}
      if(i<qn)out=out.concat(ws);
      else{
        if(selected){
          var selEnd=dt(selected.end),cut=selEnd?selEnd.getTime():Infinity;
          out=out.concat(ws.filter(function(w){var we=dt(w.end);return !we||we.getTime()<=cut}))
        }else out=out.concat(ws)
      }
    }
    return out
  }
  function previousWeekList(current){
    if(!current||!current.length)return [];
    var first=current[0],all=[];
    try{all=safeWeeks(gwq(Number(getYr()),getQ()))}catch(e){all=[]}
    var idx=all.findIndex(function(w){return w.key===first.key});
    if(idx>0)return [all[idx-1]];
    var qn=qNum(getQ());
    if(qn>1){try{var pw=safeWeeks(gwq(Number(getYr()),'Q'+(qn-1)));return pw.length?[pw[pw.length-1]]:[]}catch(e){}}
    try{var yw=safeWeeks(gwq(Number(getYr())-1,'Q4'));return yw.length?[yw[yw.length-1]]:[]}catch(e){}
    return []
  }
  function previousEqualWeeks(current){
    if(!current||!current.length)return [];
    var year=Number(getYr()),q=getQ(),allCurrent=[];try{allCurrent=safeWeeks(gwq(year,q))}catch(e){allCurrent=[]}
    var firstIdx=allCurrent.findIndex(function(w){return w.key===current[0].key});
    if(firstIdx>=current.length)return allCurrent.slice(firstIdx-current.length,firstIdx);
    var need=current.length,prevQ=qNum(q)-1,py=year;if(prevQ<1){prevQ=4;py--}
    var p=[];try{p=safeWeeks(gwq(py,'Q'+prevQ))}catch(e){p=[]}
    return p.slice(Math.max(0,p.length-need))
  }
  function previousQuarterEquivalent(current){
    var qn=qNum(getQ())-1,year=Number(getYr());if(qn<1){qn=4;year--}
    var p=[];try{p=safeWeeks(gwq(year,'Q'+qn))}catch(e){p=[]}
    return p.slice(0,current.length)
  }
  function previousYtdEquivalent(current){
    var year=Number(getYr())-1,q=getQ(),selected=_rp2SelectedWeek(),out=ytdWeeks(year,q,null);
    return out.slice(0,current.length)
  }
  function periodSpec(tab){
    var c=currentContext(),rep=_rp2.rep,year=2026,q='Q1',selected=null;
    try{year=Number(getYr())||2026}catch(e){}
    try{q=getQ()||'Q1'}catch(e){}
    try{selected=c&&c.selected?c.selected:(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null)}catch(e){selected=c&&c.selected?c.selected:null}
    var weeks=[],prev=[],label='',sub='',comparison='';
    if(tab==='weekly'){
      weeks=selected&&typeof selected==='object'?[selected]:[];prev=previousWeekList(weeks);
      label=selected?(selected.label||('Week '+selected.num)):'Selected week';
      sub=selected?(displayDate(selected.start)+' – '+displayDate(selected.end)):'';
      comparison='prior week'
    }else if(tab==='monthly'){
      weeks=monthWeeks(year,q,getM(),selected);prev=previousEqualWeeks(weeks);
      label=getM()+' '+year;sub=weeks.length?(displayDate(weeks[0].start)+' – '+displayDate(weeks[weeks.length-1].end)):'No entered weeks';
      comparison='previous equivalent '+weeks.length+'-week window'
    }else if(tab==='quarter'||tab==='coaching'){
      weeks=safeWeeks(c&&c.through);prev=previousQuarterEquivalent(weeks);
      label=q+' '+year;sub=selected?('Through '+(selected.label||('Week '+selected.num))+' · '+displayDate(selected.end)):'Quarter snapshot';
      comparison='prior-quarter equivalent window'
    }else if(tab==='ytd'){
      weeks=ytdWeeks(year,q,selected);prev=previousYtdEquivalent(weeks);
      label='YTD '+year;sub=selected?('Through '+displayDate(selected.end)):'Year-to-date';
      comparison='prior-year equivalent window'
    }else{
      weeks=safeWeeks(c&&c.through);prev=previousQuarterEquivalent(weeks);label='Report History';sub='Historical snapshots';comparison=''
    }
    return {tab:tab,c:c,rep:rep,year:year,q:q,selected:selected,weeks:weeks,prevWeeks:prev,label:label,sub:sub,comparison:comparison}
  }
  function delta(curr,prev){
    if(prev===0)return curr>0?null:0;
    return (curr-prev)/Math.abs(prev)*100
  }
  function deltaInfo(curr,prev){
    var d=delta(curr,prev);
    if(d==null)return {text:'New baseline',cls:'up',value:null};
    if(Math.abs(d)<1)return {text:'Flat',cls:'flat',value:d};
    return {text:(d>0?'▲ ':'▼ ')+Math.abs(Math.round(d))+'%',cls:d>0?'up':'down',value:d}
  }
  function orderSnapshot(rep,weeks){
    var keys=weekKeys(weeks),cut=weeks.length?iso(dt(weeks[weeks.length-1].end)):'9999-12-31';
    var recs=safeStateArray('orders').filter(function(o){
      if(!o||o.rep!==rep||!o.orderDate||o.orderDate>cut)return false;
      return !!((o.effWeekKey&&keys[o.effWeekKey])||(o.weekKey&&keys[o.weekKey]))
    });
    var primary=recs.filter(function(o){return o.kind==='order'});
    var net=recs.reduce(function(s,o){return s+n(o.total)},0);
    var issueOrders=primary.filter(function(o){
      var art=[],cm=[];try{if(typeof _ordArtFor==='function')art=_ordArtFor(o)||[]}catch(e){}try{if(typeof _ordCmFor==='function')cm=_ordCmFor(o)||[]}catch(e){}
      return art.length||cm.length
    });
    var newOrders=primary.filter(function(o){return !!o.newCustomer}),repeat=primary.filter(function(o){return !o.newCustomer});
    var largest=primary.slice().sort(function(a,b){return n(b.total)-n(a.total)})[0]||null;
    return {
      records:recs,primary:primary,net:net,orders:primary.length,aov:primary.length?net/primary.length:0,
      issueOrders:issueOrders,newOrders:newOrders,newRevenue:newOrders.reduce(function(s,o){return s+n(o.total)},0),
      repeatOrders:repeat,repeatRevenue:repeat.reduce(function(s,o){return s+n(o.total)},0),largest:largest
    }
  }
  function qualitySnapshot(rep,weeks){
    var keys=weekKeys(weeks);
    var arts=safeStateArray('artErrors').filter(function(a){
      return !!(a&&typeof a==='object'&&a.rep===rep&&(!a.weekKey||keys[a.weekKey]))
    });
    var credits=safeStateArray('cms').filter(function(c){
      if(!c||typeof c!=='object')return false;
      var fault=String(c.fault||'').toLowerCase();
      return c.rep===rep&&(!c.weekKey||keys[c.weekKey])&&fault.indexOf('rep')>=0
    });
    var creditTotal=credits.reduce(function(s,c){return s+n(c&&c.amount)},0);
    return {arts:arts,credits:credits,creditTotal:creditTotal}
  }
  function customerSnapshot(rep,cutoff){
    var year=Number(getYr()),start=String(year)+'-01-01',priorStart=String(year-1)+'-01-01';
    var cutDate=dt(cutoff),priorCut=cutDate?iso(new Date(cutDate.getFullYear()-1,cutDate.getMonth(),cutDate.getDate(),12)):String(year-1)+'-12-31';
    var orders=safeStateArray('orders').filter(function(o){return o&&o.rep===rep&&o.kind==='order'&&clean(o.customer)&&o.orderDate&&o.orderDate<=cutoff});
    var by={};
    orders.forEach(function(o){
      var key=clean(o.customer).toLowerCase(),x=by[key]||(by[key]={name:clean(o.customer),current:0,prior:0,orders:0,last:'',newFlag:false});
      if(o.orderDate>=start&&o.orderDate<=cutoff){x.current+=n(o.total);x.orders++;if(o.newCustomer)x.newFlag=true}
      if(o.orderDate>=priorStart&&o.orderDate<=priorCut)x.prior+=n(o.total);
      if(!x.last||o.orderDate>x.last)x.last=o.orderDate
    });
    var list=Object.keys(by).map(function(k){
      var x=by[k],days=x.last?Math.round((dt(cutoff)-dt(x.last))/86400000):9999;
      x.daysSince=days;x.trend=x.prior>0?(x.current-x.prior)/x.prior*100:(x.current>0?100:0);
      return x
    });
    var active=list.filter(function(x){return x.current>0}),sorted=active.slice().sort(function(a,b){return b.current-a.current});
    var total=active.reduce(function(s,x){return s+x.current},0),top5=sorted.slice(0,5).reduce(function(s,x){return s+x.current},0);
    return {
      active:active.length,newCount:active.filter(function(x){return x.newFlag}).length,
      dormant:list.filter(function(x){return x.daysSince>120}).length,
      slipping:list.filter(function(x){return x.prior>0&&x.current<x.prior*.75}).length,
      top5Share:total>0?top5/total*100:0,total:total
    }
  }
  function forecastSnapshot(spec,t){
    var c=spec.c;
    if(!c||!c.goal)return {goal:0,projected:0,gap:0,need:0,status:'No goal set'};
    var entered=spec.weeks.filter(function(w){var d=(S.data||{})[spec.rep+'|'+w.key]||{};return n(d.revenue)||n(d.orders)||n(d.calls)});
    var enteredCount=entered.length||(t&&t.provisional?1:0);
    var avgRev=enteredCount?t.revenue/enteredCount:0;
    var totalWeeks=(c.wks||[]).length||13,elapsed=Math.max(0,spec.weeks.length),remaining=Math.max(0,totalWeeks-elapsed);
    var projected=t.revenue+avgRev*remaining,gap=Math.max(0,c.goal-t.revenue),need=remaining?gap/remaining:gap;
    return {goal:c.goal,projected:projected,gap:gap,need:need,status:projected>=c.goal?'Projected above goal':'Projected below goal'}
  }
  function buildReport(tab){
    var warnings=[],spec;
    try{spec=periodSpec(tab)}catch(e){warnings.push('Period context: '+((e&&e.message)||e));spec={tab:tab,c:null,rep:_rp2.rep,year:2026,q:'Q1',selected:null,weeks:[],prevWeeks:[],label:'Selected report',sub:'',comparison:'previous equivalent period'}}
    spec.weeks=safeWeeks(spec.weeks);spec.prevWeeks=safeWeeks(spec.prevWeeks);
    var t={revenue:0,orders:0,calls:0,entered:0,aov:0,callsKnown:false,source:'none'},p={revenue:0,orders:0,calls:0,entered:0,aov:0,callsKnown:false,source:'none'};
    try{t=totals(spec.rep,spec.weeks)}catch(e){warnings.push('Current totals: '+((e&&e.message)||e))}
    try{p=totals(spec.rep,spec.prevWeeks)}catch(e){warnings.push('Comparison totals: '+((e&&e.message)||e))}
    var emptyOrders={records:[],primary:[],net:0,orders:0,aov:0,issueOrders:[],newOrders:[],newRevenue:0,repeatOrders:[],repeatRevenue:0,largest:null},orders=emptyOrders;
    try{orders=orderSnapshot(spec.rep,spec.weeks)||emptyOrders}catch(e){warnings.push('Orders: '+((e&&e.message)||e));orders=emptyOrders}
    var exactRecord=null,dailyFallback={available:false,revenue:0,coverage:0,lastDate:'',source:'none'};
    var isSingleWeek=(tab==='weekly'&&spec.weeks.length===1&&spec.weeks[0]);
    if(isSingleWeek){
      exactRecord=exactWeeklyRecord(spec.rep,spec.weeks[0]);
      if(!exactRecord){dailyFallback=dailyWeekFallback(spec.rep,spec.weeks[0]);if(dailyFallback.available){t.revenue=dailyFallback.revenue;t.orders=orders.orders;t.aov=t.orders?t.revenue/t.orders:0;t.entered=1;t.calls=0;t.callsKnown=false;t.source='dailySalesFallback';t.provisional=true}}
      else{t.callsKnown=true;t.source='weeklyScorecard'}
    }
    var rk={rank:null,total:0},pr={rank:null,total:0};
    try{rk=ranks(spec.rep,spec.weeks)}catch(e){warnings.push('Current rank: '+((e&&e.message)||e))}
    try{pr=ranks(spec.rep,spec.prevWeeks)}catch(e){warnings.push('Comparison rank: '+((e&&e.message)||e))}
    if(t.source==='dailySalesFallback'){var dr=dailyWeekRank(spec.rep,spec.weeks[0]);rk={rank:dr.rank,total:dr.total}}
    var quality={arts:[],credits:[],creditTotal:0};try{quality=qualitySnapshot(spec.rep,spec.weeks)||quality}catch(e){warnings.push('Quality: '+((e&&e.message)||e))}
    var cutoff='';try{var last=spec.weeks.length?spec.weeks[spec.weeks.length-1]:null;cutoff=(last&&last.end?iso(last.end):'')||(spec.selected&&spec.selected.end?iso(spec.selected.end):'')||(String(spec.year)+'-12-31')}catch(e){warnings.push('Report cutoff: '+((e&&e.message)||e));cutoff=String(spec.year)+'-12-31'}
    var customers={active:0,newCount:0,dormant:0,slipping:0,top5Share:0,total:0};try{customers=customerSnapshot(spec.rep,cutoff)||customers}catch(e){warnings.push('Customers: '+((e&&e.message)||e))}
    var forecast={goal:0,projected:0,gap:0,need:0,status:'Forecast unavailable'};try{forecast=forecastSnapshot(spec,t)||forecast}catch(e){warnings.push('Forecast: '+((e&&e.message)||e))}
    var weekGoal=0;try{weekGoal=forecast.goal&&spec.c?(forecast.goal/(safeWeeks(spec.c.wks).length||13)):0}catch(e){warnings.push('Goal pace: '+((e&&e.message)||e))}
    var expected=weekGoal*spec.weeks.length,pacePct=expected>0?t.revenue/expected*100:null;
    var callTarget=t.callsKnown===false?0:(125*spec.weeks.length),callPct=callTarget>0?t.calls/callTarget*100:0;
    return {spec:spec,t:t,p:p,rank:rk.rank,rankTotal:rk.total,prevRank:pr.rank,orders:orders,quality:quality,customers:customers,forecast:forecast,expected:expected,pacePct:pacePct,callTarget:callTarget,callPct:callPct,warnings:warnings,exactRecord:exactRecord,dailyFallback:dailyFallback}
  }
  function rankMove(g){
    if(!g.rank)return 'Rank unavailable';
    if(!g.prevRank)return '#'+g.rank;
    var d=g.prevRank-g.rank;
    return d>0?('#'+g.rank+' · ▲ '+d):d<0?('#'+g.rank+' · ▼ '+Math.abs(d)):('#'+g.rank+' · no move')
  }
  function reportHeadline(g){
    if(g.t&&g.t.source==='dailySalesFallback')return 'Live weekly performance is available from Daily Sales while the official weekly scorecard is still pending';
    if(!g.t.entered)return _rpUrlGist()?'The selected reporting point is not present in the current cloud snapshot yet':'The selected reporting point does not have entered weekly performance yet';
    if(g.forecast.goal&&g.pacePct!=null&&g.pacePct>=100&&g.callPct>=100)return 'Revenue pace and activity are both supporting the performance story';
    if(g.forecast.goal&&g.pacePct!=null&&g.pacePct>=100&&g.callPct<90)return 'Revenue is carrying the period more strongly than call activity';
    if(g.forecast.goal&&g.pacePct!=null&&g.pacePct<85&&g.callPct>=100)return 'Activity is present, but the revenue result has not caught up yet';
    if(g.orders.issueOrders.length)return 'The performance story includes order quality signals worth reviewing';
    if(g.customers.top5Share>=55)return 'A concentrated group of customers is carrying a large share of the book';
    return 'The selected period shows a mixed performance story with clear next-step signals'
  }
  function summaryText(g){
    var pieces=[];
    if(g.t&&g.t.source==='dailySalesFallback'){
      pieces.push('The official weekly scorecard has not been entered for '+g.spec.label+', so this review is using '+money(g.t.revenue)+' from the same per-rep Daily Sales cumulative feed used by the management Daily Sales popup. '+g.orders.orders+' dated primary order'+(g.orders.orders===1?' is':'s are')+' available for the week; weekly calls remain unavailable until the weekly scorecard is entered.');
    }else if(!g.t.entered&&_rpUrlGist()){
      var _diag=_rpCloudWeekDiagnostic(g.spec.rep,g.spec.selected&&g.spec.selected.key?g.spec.selected.key:'');
      pieces.push('This Rep Portal is reading the GitHub Gist cloud snapshot. The exact selected scorecard key '+_diag.exactKey+' is not present in the loaded snapshot. The snapshot currently contains '+_diag.weeklyDataCount+' weekly scorecard keys. Refresh Data after the manager-side cloud save completes.');
    }else{
      pieces.push('You produced '+money(g.t.revenue)+' across '+g.t.orders+' orders and '+g.t.calls+' calls in '+g.spec.label+'.');
    }
    if(g.spec.prevWeeks.length){
      var rd=deltaInfo(g.t.revenue,g.p.revenue),cd=deltaInfo(g.t.calls,g.p.calls),od=deltaInfo(g.t.orders,g.p.orders);
      pieces.push('Versus the '+g.spec.comparison+', revenue is '+rd.text.toLowerCase()+', orders are '+od.text.toLowerCase()+', and calls are '+cd.text.toLowerCase()+'.');
    }
    if(g.forecast.goal){
      pieces.push((g.pacePct!=null&&g.pacePct>=100?'You are at or above the cumulative revenue pace implied by the quarter goal.':'You are below the cumulative revenue pace implied by the quarter goal.')+' Current run rate projects to '+money(g.forecast.projected)+'.');
    }
    if(g.orders.primary.length){
      pieces.push('Order performance includes '+g.orders.primary.length+' primary orders at '+money(g.orders.aov)+' net AOV, with '+g.orders.issueOrders.length+' primary orders carrying linked quality signals.');
    }
    if(g.customers.active){
      pieces.push('Your recorded YTD customer book has '+g.customers.active+' active accounts, with the top five representing '+Math.round(g.customers.top5Share)+'% of recorded YTD customer revenue.');
    }
    return pieces.join(' ')
  }
  function periodComparison(g){
    return [
      {label:'Revenue',curr:g.t.revenue,prev:g.p.revenue,format:money,copy:g.spec.comparison},
      {label:'Calls',curr:g.t.callsKnown===false?null:g.t.calls,prev:g.t.callsKnown===false?null:g.p.calls,format:function(v){return v==null?'—':Math.round(v).toLocaleString()},copy:g.t.callsKnown===false?'Weekly scorecard pending':g.spec.comparison,unknown:g.t.callsKnown===false},
      {label:'Orders',curr:g.t.orders,prev:g.p.orders,format:function(v){return Math.round(v).toLocaleString()},copy:g.spec.comparison},
      {label:'Average Order Value',curr:g.t.aov,prev:g.p.aov,format:money,copy:g.spec.comparison},
      {label:'Rank',curr:g.rank||0,prev:g.prevRank||0,format:function(v){return v?'#'+v:'—'},copy:'lower is better',rank:true},
      {label:'Quality Issues',curr:g.quality.arts.length+g.quality.credits.length,prev:qualitySnapshot(g.spec.rep,g.spec.prevWeeks).arts.length+qualitySnapshot(g.spec.rep,g.spec.prevWeeks).credits.length,format:function(v){return Math.round(v).toLocaleString()},copy:'lower is better',inverse:true}
    ]
  }
  function wins(g){
    var out=[];
    var revD=delta(g.t.revenue,g.p.revenue),orderD=delta(g.t.orders,g.p.orders),aovD=delta(g.t.aov,g.p.aov);
    if(g.forecast.goal&&g.pacePct!=null&&g.pacePct>=100)out.push({title:'Revenue pace is on track',copy:'Cumulative revenue is at or above the pace implied by the quarter goal through this reporting point.'});
    if(revD!=null&&revD>=10)out.push({title:'Revenue improved',copy:'Revenue is up '+Math.round(revD)+'% versus the '+g.spec.comparison+'.'});
    if(orderD!=null&&orderD>=10)out.push({title:'More orders are closing',copy:'Primary performance order count is up '+Math.round(orderD)+'% versus the comparison period.'});
    if(aovD!=null&&aovD>=10)out.push({title:'Average order value improved',copy:'AOV is up '+Math.round(aovD)+'%, meaning more value is being created per order.'});
    if(g.rank&&g.prevRank&&g.rank<g.prevRank)out.push({title:'Rank improved',copy:'You moved from #'+g.prevRank+' to #'+g.rank+' in the equivalent performance comparison.'});
    if(g.orders.largest)out.push({title:'Largest order in this report',copy:(g.orders.largest.customer||'Customer')+' contributed '+money(g.orders.largest.total)+' on order '+(g.orders.largest.orderNum||g.orders.largest.base||'')+'.'});
    if(!g.orders.issueOrders.length&&g.orders.primary.length)out.push({title:'Clean primary-order quality record',copy:'No primary orders in this report have linked art-error or credit-memo signals.'});
    return out.slice(0,5)
  }
  function watchouts(g){
    var out=[];
    if(g.forecast.goal&&g.pacePct!=null&&g.pacePct<85)out.push({title:'Revenue pace is behind',copy:'Cumulative revenue is '+Math.round(100-g.pacePct)+'% below the pace implied by the quarter goal through this point.'});
    if(g.callTarget&&g.callPct<85)out.push({title:'Call activity is below target',copy:'You are at '+Math.round(g.callPct)+'% of the 125-calls-per-week activity target across this reporting window.'});
    if(g.forecast.goal&&g.forecast.projected<g.forecast.goal)out.push({title:'Forecast is below goal',copy:'Current entered-week run rate projects to '+money(g.forecast.projected)+', requiring about '+money(g.forecast.need)+' per remaining quarter week.'});
    if(g.orders.issueOrders.length)out.push({title:'Order quality needs review',copy:g.orders.issueOrders.length+' primary order'+(g.orders.issueOrders.length===1?' has':'s have')+' linked art-error or credit-memo signals.'});
    if(g.customers.dormant)out.push({title:'Dormant customer opportunity',copy:g.customers.dormant+' recorded customer'+(g.customers.dormant===1?' is':'s are')+' more than 120 days from the last recorded order.'});
    if(g.customers.slipping)out.push({title:'Customer revenue decline',copy:g.customers.slipping+' recorded customer'+(g.customers.slipping===1?' is':'s are')+' below 75% of comparable prior-year revenue.'});
    if(g.customers.top5Share>=55)out.push({title:'Customer concentration risk',copy:'The top five accounts represent '+Math.round(g.customers.top5Share)+'% of recorded YTD customer revenue.'});
    return out.slice(0,5)
  }
  function coaching(g){
    var w=watchouts(g),ws=wins(g);
    var keep=ws.length?ws[0]:{title:'Keep building repeatable weekly output',copy:'The strongest available signal is consistency: keep stacking entered weeks and study which orders and customers create clean revenue.'};
    var change=w.length?w[0]:{title:'Do not create a problem that is not there',copy:'No major warning signal dominates this report. Keep execution disciplined and use the next period to build a larger data sample.'};
    var priorities=[];
    if(g.forecast.goal&&g.forecast.projected<g.forecast.goal)priorities.push({title:'Protect the revenue pace',copy:'Build a plan around '+money(g.forecast.need)+' per remaining quarter week based on current run rate.'});
    if(g.callTarget&&g.callPct<100)priorities.push({title:'Close the activity gap',copy:Math.max(0,g.callTarget-g.t.calls)+' calls remain versus the cumulative 125-per-week target for this reporting window.'});
    if(g.customers.dormant||g.customers.slipping)priorities.push({title:'Work the customer risk list',copy:(g.customers.dormant+g.customers.slipping)+' dormant or slipping customer signals are visible in the recorded order history.'});
    if(g.orders.issueOrders.length)priorities.push({title:'Review the order failures before repeating the wins',copy:g.orders.issueOrders.length+' primary orders have linked issue signals that should be understood before the same workflow is repeated.'});
    if(g.customers.newCount<2)priorities.push({title:'Create new-business contribution',copy:'The recorded YTD customer book currently shows '+g.customers.newCount+' active new-customer account'+(g.customers.newCount===1?'':'s')+'.'});
    if(!priorities.length)priorities.push({title:'Protect what is working',copy:'No single risk dominates. Focus on maintaining revenue pace, call consistency, and clean order execution.'});
    return {keep:keep,change:change,focus:priorities[0],priorities:priorities.slice(0,3)}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-rh-section-head"><div><div class="rp2-rh-section-kick">'+kick+'</div><div class="rp2-rh-section-title">'+title+'</div></div><div class="rp2-rh-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-rh-kpi"><div class="rp2-rh-kpi-label">'+esc(label)+'</div><div class="rp2-rh-kpi-value">'+value+'</div><div class="rp2-rh-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-rh-tabs-wrap"><div class="rp2-rh-tabs">'+RH_TABS.map(function(t){return '<button class="rp2-rh-tab '+(t.id===active?'active':'')+'" onclick="_rp2ReportSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function changeCards(g){
    return '<div class="rp2-rh-change-grid">'+periodComparison(g).map(function(x){
      var di;
      if(x.unknown){di={text:'Unavailable',cls:'flat'};}
      else if(x.rank){
        var d=(x.prev&&x.curr)?x.prev-x.curr:null;
        di=d==null?{text:'No baseline',cls:'flat'}:d>0?{text:'▲ '+d+' spot'+(d===1?'':'s'),cls:'up'}:d<0?{text:'▼ '+Math.abs(d)+' spot'+(Math.abs(d)===1?'':'s'),cls:'down'}:{text:'No movement',cls:'flat'};
      }else if(x.inverse){
        var raw=delta(x.curr,x.prev);
        di=raw==null?{text:'New baseline',cls:x.curr===0?'up':'down'}:Math.abs(raw)<1?{text:'Flat',cls:'flat'}:{text:(raw<0?'▼ ':'▲ ')+Math.abs(Math.round(raw))+'%',cls:raw<0?'up':'down'};
      }else di=deltaInfo(x.curr,x.prev);
      return '<div class="rp2-rh-change"><div class="rp2-rh-change-label">'+esc(x.label)+'</div><div class="rp2-rh-change-value">'+x.format(x.curr)+'</div><div class="rp2-rh-change-delta '+di.cls+'">'+esc(di.text)+'</div><div class="rp2-rh-change-copy">'+esc(x.copy||'')+'</div></div>'
    }).join('')+'</div>'
  }
  function storyPanel(type,title,sub,list){
    return '<div class="rp2-rh-story-panel '+type+'"><div class="rp2-rh-story-head"><div class="rp2-rh-story-icon">'+(type==='win'?'✓':'!')+'</div><div><div class="rp2-rh-story-title">'+title+'</div><div class="rp2-rh-story-sub">'+sub+'</div></div></div><div class="rp2-rh-story-list">'
      +(list.length?list.map(function(x){return '<div class="rp2-rh-story-row"><strong>'+esc(x.title)+'</strong><span>'+esc(x.copy)+'</span></div>'}).join(''):'<div class="rp2-rh-story-row"><strong>No major signal detected</strong><span>The available data does not currently produce a strong item in this category.</span></div>')
      +'</div></div>'
  }
  function connected(g){
    var newShare=(g.orders.newRevenue+g.orders.repeatRevenue)>0?g.orders.newRevenue/(g.orders.newRevenue+g.orders.repeatRevenue)*100:0;
    return '<div class="rp2-rh-panel"><div class="rp2-rh-panel-title">Connected insights</div><div class="rp2-rh-panel-sub">One report, grounded in the systems already built across the Rep Portal.</div><div class="rp2-rh-connected">'
      +'<div class="rp2-rh-connected-row"><div class="rp2-rh-connected-icon">⌂</div><div class="rp2-rh-connected-name">Dashboard<small>Overall performance through this reporting point</small></div><div class="rp2-rh-connected-val">'+money(g.t.revenue)+'</div></div>'
      +'<div class="rp2-rh-connected-row"><div class="rp2-rh-connected-icon">↗</div><div class="rp2-rh-connected-name">Forecast<small>'+esc(g.forecast.status)+'</small></div><div class="rp2-rh-connected-val">'+(g.forecast.goal?money(g.forecast.projected):'—')+'</div></div>'
      +'<div class="rp2-rh-connected-row"><div class="rp2-rh-connected-icon">🏆</div><div class="rp2-rh-connected-name">Leaderboard<small>Performance rank in this report period</small></div><div class="rp2-rh-connected-val">'+(g.rank?'#'+g.rank:'—')+'</div></div>'
      +'<div class="rp2-rh-connected-row"><div class="rp2-rh-connected-icon">🏢</div><div class="rp2-rh-connected-name">Customers<small>'+g.customers.dormant+' dormant · '+g.customers.slipping+' slipping signals</small></div><div class="rp2-rh-connected-val">'+g.customers.active+' active</div></div>'
      +'<div class="rp2-rh-connected-row"><div class="rp2-rh-connected-icon">📦</div><div class="rp2-rh-connected-name">Orders<small>'+Math.round(newShare)+'% new-business share · '+g.orders.issueOrders.length+' orders with linked issues</small></div><div class="rp2-rh-connected-val">'+money(g.orders.net)+'</div></div>'
      +'<div class="rp2-rh-connected-row"><div class="rp2-rh-connected-icon">✓</div><div class="rp2-rh-connected-name">Quality<small>Rep-fault credit value and art-error count in this report period</small></div><div class="rp2-rh-connected-val">'+g.quality.arts.length+' art · '+money(g.quality.creditTotal)+'</div></div>'
      +'</div></div>'
  }
  function reportBody(g,tab){
    var winsList=wins(g),watchList=watchouts(g),coach=coaching(g);
    var sourceWarning=(g.warnings&&g.warnings.length)
      ?('<div class="rp2-rh-source-warning"><strong>Some connected data was skipped safely.</strong><span>'+esc(g.warnings.join(' · '))+'</span></div>')
      :'';
    if(g.t&&g.t.source==='dailySalesFallback'){
      sourceWarning+='<div class="rp2-rh-source-warning rp2-rh-live-fallback"><strong>Live Daily Sales fallback</strong><span>The official weekly scorecard for '+esc(g.spec.label)+' is missing. Revenue is using the exact management per-rep Daily Sales cumulative source through '+esc(g.dailyFallback.lastDate||'the end of the selected week')+'. Orders use dated order records. Calls stay unavailable until weekly Data Entry is completed.</span></div>';
    }
    var summary=sectionHead('Executive summary','The performance story in plain English','This is the unified read across weekly performance, forecast, customers, orders, leaderboard, and quality signals.')
      +'<div class="rp2-rh-summary"><div class="rp2-rh-summary-label">'+esc(g.spec.label)+' · '+esc(g.spec.sub)+'</div><div class="rp2-rh-summary-title">'+esc(reportHeadline(g))+'</div><div class="rp2-rh-summary-copy">'+esc(summaryText(g))+'</div><div class="rp2-rh-summary-foot"><span class="rp2-rh-pill">'+esc(weekState(g.spec.selected))+'</span><span class="rp2-rh-pill '+(g.forecast.goal&&g.pacePct!=null&&g.pacePct>=100?'good':'warn')+'">'+(g.forecast.goal?(Math.round(g.pacePct||0)+'% of cumulative pace'):'Goal not set')+'</span></div></div>';

    var changed=sectionHead('What changed?','Direction matters more than a static number','The comparison window changes with the report type so partial periods are compared against equivalent historical windows.')+changeCards(g);
    var story=sectionHead('Wins & watchouts','What deserves recognition—and what deserves attention','These are generated from transparent thresholds in the underlying tracker data, not from hidden scoring.')
      +'<div class="rp2-rh-story-grid">'+storyPanel('win','Wins','Positive signals worth protecting',winsList)+storyPanel('watch','Watchouts','Signals that deserve action or review',watchList)+'</div>';
    var trend=sectionHead('Performance trajectory','The reporting window over time','Revenue and cumulative pace are plotted across the selected report window. The side panel shows the connected portal systems feeding this report.')
      +'<div class="rp2-rh-chart-grid"><div class="rp2-rh-panel"><div class="rp2-rh-panel-title">'+esc(g.spec.label)+' trajectory</div><div class="rp2-rh-panel-sub">Weekly revenue with cumulative goal pace as the comparison line when a quarter goal exists.</div><div class="rp2-rh-chart"><canvas id="rp2-rh-chart"></canvas></div></div>'+connected(g)+'</div>';
    var coachHtml=sectionHead('Coaching summary','Keep doing · Change · Focus next','The coaching read reduces the report into three operational decisions.')
      +'<div class="rp2-rh-coach-grid">'
        +'<div class="rp2-rh-coach keep"><div class="rp2-rh-coach-label">Keep doing</div><div class="rp2-rh-coach-title">'+esc(coach.keep.title)+'</div><div class="rp2-rh-coach-copy">'+esc(coach.keep.copy)+'</div></div>'
        +'<div class="rp2-rh-coach change"><div class="rp2-rh-coach-label">Change</div><div class="rp2-rh-coach-title">'+esc(coach.change.title)+'</div><div class="rp2-rh-coach-copy">'+esc(coach.change.copy)+'</div></div>'
        +'<div class="rp2-rh-coach focus"><div class="rp2-rh-coach-label">Focus next</div><div class="rp2-rh-coach-title">'+esc(coach.focus.title)+'</div><div class="rp2-rh-coach-copy">'+esc(coach.focus.copy)+'</div></div>'
      +'</div>';
    var priorities=sectionHead('Action plan','Your next three priorities','Every report should end with a clear operating plan instead of another chart.')
      +'<div class="rp2-rh-panel"><div class="rp2-rh-priority-list">'+coach.priorities.map(function(x,i){return '<div class="rp2-rh-priority"><div class="rp2-rh-priority-no">'+(i+1)+'</div><div><strong>'+esc(x.title)+'</strong><span>'+esc(x.copy)+'</span></div></div>'}).join('')+'</div></div>';

    if(tab==='coaching')return sourceWarning+summary+coachHtml+priorities+story+changed;
    return sourceWarning+summary+changed+story+trend+coachHtml+priorities
  }
  function historyCards(){
    var rep=_rp2.rep,year=Number(getYr()),q=getQ(),selected=_rp2SelectedWeek(),cards=[];
    var qWeeks=[];try{qWeeks=safeWeeks(gwq(year,q))}catch(e){qWeeks=[]}
    var selectedEnd=selected?dt(selected.end):null;
    qWeeks.forEach(function(w){
      if(selectedEnd&&dt(w.end)>selectedEnd)return;
      var t=totals(rep,[w]);if(!t.entered)return;
      cards.push({type:'Weekly Review',title:w.label||('Week '+w.num),value:t.revenue,sub:t.orders+' orders · '+t.calls+' calls',year:year,q:q,m:shortMonth(w.start),week:w.num,tab:'weekly',sort:dt(w.end).getTime()})
    });
    var months={};
    qWeeks.forEach(function(w){
      if(selectedEnd&&dt(w.end)>selectedEnd)return;
      var m=shortMonth(w.start);(months[m]||(months[m]=[])).push(w)
    });
    Object.keys(months).forEach(function(m){
      var ws=months[m],t=totals(rep,ws);if(!t.entered)return;
      cards.push({type:'Monthly Review',title:m+' '+year,value:t.revenue,sub:t.orders+' orders · '+t.calls+' calls',year:year,q:q,m:m,week:ws[ws.length-1].num,tab:'monthly',sort:dt(ws[ws.length-1].end).getTime()+1})
    });
    var qn=qNum(q);
    for(var i=1;i<=qn;i++){
      var qi='Q'+i,ws=[];try{ws=safeWeeks(gwq(year,qi))}catch(e){ws=[]}
      if(i===qn&&selectedEnd)ws=ws.filter(function(w){return dt(w.end)<=selectedEnd});
      var t=totals(rep,ws);if(!t.entered)continue;
      var last=ws[ws.length-1];
      cards.push({type:'Quarter Snapshot',title:qi+' '+year,value:t.revenue,sub:t.orders+' orders · '+t.calls+' calls',year:year,q:qi,m:last?shortMonth(last.start):'',week:last?last.num:null,tab:'quarter',sort:last?dt(last.end).getTime()+2:i})
    }
    return cards.sort(function(a,b){return b.sort-a.sort})
  }
  function savedHistory(){
    try{
      if(typeof reportHistory==='undefined'||!Array.isArray(reportHistory))return [];
      return reportHistory.filter(function(r){return !!(r&&typeof r==='object'&&(!r.subject||r.subject===_rp2.rep))}).slice(0,12)
    }catch(e){return []}
  }
  function historyView(){
    var cards=historyCards(),saved=savedHistory();
    var dynamic=sectionHead('Performance journal','Historical performance snapshots','These cards are reconstructed from the tracker’s entered weekly data, so the rep can revisit earlier performance points without needing a manually saved PDF.')
      +(cards.length?'<div class="rp2-rh-history-grid">'+cards.map(function(x){
        return '<button class="rp2-rh-history" onclick="_rp2ReportOpenHistory('+x.year+',\''+x.q+'\',\''+x.m+'\','+(x.week==null?'null':x.week)+',\''+x.tab+'\')"><div class="rp2-rh-history-type">'+esc(x.type)+'</div><div class="rp2-rh-history-title">'+esc(x.title)+'</div><div class="rp2-rh-history-value">'+money(x.value)+'</div><div class="rp2-rh-history-sub">'+esc(x.sub)+'</div><div class="rp2-rh-history-foot">Open this historical reporting point →</div></button>'
      }).join('')+'</div>':'<div class="rp2-rh-empty"><strong>No historical performance snapshots yet</strong><span>Entered weekly data will automatically create report-history cards here.</span></div>');
    var savedHtml=sectionHead('Saved reports','Reports created elsewhere in this tracker session','Existing manager-generated or AI-generated report-history items are surfaced here when they are tied to this rep.')
      +(saved.length?'<div class="rp2-rh-panel"><div class="rp2-rh-saved">'+saved.map(function(r){return '<div class="rp2-rh-saved-row"><div class="rp2-rh-saved-type">'+esc(r.type||'report')+'</div><div class="rp2-rh-saved-name">'+esc(r.name||'Saved report')+'<small>'+esc(r.subject||_rp2.rep)+'</small></div><div class="rp2-rh-saved-time">'+esc(r.ts||'')+'</div></div>'}).join('')+'</div></div>':'<div class="rp2-rh-empty"><strong>No saved session reports for this rep</strong><span>The performance journal above still provides historical snapshots from the underlying tracker data.</span></div>');
    return dynamic+savedHtml
  }
  function plainSummary(g){
    var coach=coaching(g),w=wins(g),watch=watchouts(g);
    return [
      g.spec.label+' — '+g.spec.sub,
      '',
      'EXECUTIVE SUMMARY',
      reportHeadline(g),
      summaryText(g),
      '',
      'KEY METRICS',
      'Revenue: '+money(g.t.revenue),
      'Orders: '+g.t.orders,
      'Calls: '+(g.t.callsKnown===false?'Unavailable until weekly scorecard entry':g.t.calls),
      'AOV: '+money(g.t.aov),
      'Rank: '+(g.rank?'#'+g.rank+' of '+g.rankTotal:'Unavailable'),
      'Forecast: '+(g.forecast.goal?money(g.forecast.projected):'No goal set'),
      '',
      'WINS',
      (w.length?w.map(function(x){return '- '+x.title+': '+x.copy}).join('\n'):'- No major win signal detected'),
      '',
      'WATCHOUTS',
      (watch.length?watch.map(function(x){return '- '+x.title+': '+x.copy}).join('\n'):'- No major watchout signal detected'),
      '',
      'COACHING',
      'Keep doing: '+coach.keep.title+' — '+coach.keep.copy,
      'Change: '+coach.change.title+' — '+coach.change.copy,
      'Focus next: '+coach.focus.title+' — '+coach.focus.copy,
      '',
      'NEXT PRIORITIES',
      coach.priorities.map(function(x,i){return (i+1)+'. '+x.title+' — '+x.copy}).join('\n')
    ].join('\n')
  }
  function printHtml(g){
    var coach=coaching(g),w=wins(g),watch=watchouts(g);
    function list(items,empty){return items.length?'<ul>'+items.map(function(x){return '<li><strong>'+esc(x.title)+'</strong><br>'+esc(x.copy)+'</li>'}).join('')+'</ul>':'<p>'+esc(empty)+'</p>'}
    return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(g.spec.label)+' — '+esc(g.spec.rep)+'</title><style>'
      +'body{font-family:Arial,sans-serif;margin:36px;color:#172033;line-height:1.5}h1{font-size:28px;margin:0}h2{margin-top:28px;border-bottom:2px solid #ddd;padding-bottom:7px}p{color:#465064}.meta{margin-top:6px;color:#68758a}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:20px}.k{border:1px solid #ddd;border-radius:10px;padding:12px}.k small{display:block;color:#778399;text-transform:uppercase;font-weight:bold}.k strong{display:block;margin-top:6px;font-size:18px}.summary{margin-top:24px;padding:18px;border:1px solid #bbb;border-radius:12px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}li{margin-bottom:10px}@media print{button{display:none}}'
      +'</style></head><body><h1>'+esc(g.spec.rep)+' — '+esc(g.spec.label)+'</h1><div class="meta">'+esc(g.spec.sub)+'</div>'
      +'<div class="grid"><div class="k"><small>Revenue</small><strong>'+money(g.t.revenue)+'</strong></div><div class="k"><small>Orders</small><strong>'+g.t.orders+'</strong></div><div class="k"><small>Calls</small><strong>'+g.t.calls+'</strong></div><div class="k"><small>Rank</small><strong>'+(g.rank?'#'+g.rank:'—')+'</strong></div></div>'
      +'<div class="summary"><h2 style="margin-top:0">Executive Summary</h2><h3>'+esc(reportHeadline(g))+'</h3><p>'+esc(summaryText(g))+'</p></div>'
      +'<div class="cols"><div><h2>Wins</h2>'+list(w,'No major win signal detected.')+'</div><div><h2>Watchouts</h2>'+list(watch,'No major watchout signal detected.')+'</div></div>'
      +'<h2>Coaching Summary</h2><p><strong>Keep doing:</strong> '+esc(coach.keep.title)+' — '+esc(coach.keep.copy)+'</p><p><strong>Change:</strong> '+esc(coach.change.title)+' — '+esc(coach.change.copy)+'</p><p><strong>Focus next:</strong> '+esc(coach.focus.title)+' — '+esc(coach.focus.copy)+'</p>'
      +'<h2>Next Three Priorities</h2><ol>'+coach.priorities.map(function(x){return '<li><strong>'+esc(x.title)+'</strong><br>'+esc(x.copy)+'</li>'}).join('')+'</ol>'
      +'<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>'
  }

  window._rp2ReportSetTab=function(id){
    window._rp2ReportTab=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ReportsV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2ReportsDraw()}catch(e){}},0)
  };
  window._rp2ReportCopy=async function(){
    var tab=window._rp2ReportTab==='history'?'quarter':window._rp2ReportTab,g=buildReport(tab),txt=plainSummary(g);
    try{await navigator.clipboard.writeText(txt);alert('Report summary copied to clipboard.')}
    catch(e){var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();alert('Report summary copied to clipboard.')}
  };
  window._rp2ReportPrint=function(){
    var tab=window._rp2ReportTab==='history'?'quarter':window._rp2ReportTab,g=buildReport(tab),w=window.open('','_blank');
    if(!w){alert('Please allow pop-ups to print the report.');return}
    w.document.write(printHtml(g));w.document.close()
  };
  window._rp2ReportOpenHistory=function(year,q,m,week,tab){
    try{
      var y=document.getElementById('selYr'),qe=document.getElementById('selQ'),me=document.getElementById('selM'),we=document.getElementById('selW');
      if(y)y.value=String(year);
      if(qe)qe.value=q;
      if(typeof buildMonthSel==='function')buildMonthSel(q);
      me=document.getElementById('selM');if(me&&m)me.value=m;
      if(typeof buildWeekSel==='function')buildWeekSel();
      we=document.getElementById('selW');if(we&&week!=null)we.value=String(week);
      try{updateDisplay()}catch(e){}
      window._rp2ReportTab=tab||'weekly';
      _rp2Go('reports')
    }catch(e){console.error('Could not open historical report point',e)}
  };

  window._rp2ReportsV2=function(){
   try{
    var tab=window._rp2ReportTab,g=buildReport(tab==='history'?'quarter':tab);
    var coach=coaching(g),paceLabel=g.forecast.goal?(Math.round(g.pacePct||0)+'% of cumulative pace'):'Goal not set';
    var hero='<div class="rp2-rh-hero"><div class="rp2-rh-hero-grid"><div><div class="rp2-rh-kick">Reports Hub 2.0 · BUILD v495</div><div class="rp2-rh-title">Your performance story, in one place</div><div class="rp2-rh-copy">Reports Hub pulls the rep portal together into a single review: what happened, what changed, what is working, what needs attention, and what to do next.</div><div class="rp2-rh-pills"><span class="rp2-rh-pill">'+esc(g.spec.label)+'</span><span class="rp2-rh-pill">'+esc(g.spec.sub)+'</span>'+(g.t.source==='dailySalesFallback'?'<span class="rp2-rh-pill warn">Daily Sales provisional · weekly scorecard pending</span>':'')+'<span class="rp2-rh-pill '+(g.forecast.goal&&g.pacePct!=null&&g.pacePct>=100?'good':'warn')+'">'+esc(paceLabel)+'</span></div></div>'
      +'<div class="rp2-rh-brief"><div><div class="rp2-rh-brief-label">Current report focus</div><div class="rp2-rh-brief-value">'+money(g.t.revenue)+'</div><div class="rp2-rh-brief-title">'+esc(reportHeadline(g))+'</div><div class="rp2-rh-brief-copy">'+esc(coach.focus.title)+': '+esc(coach.focus.copy)+'</div></div><div class="rp2-rh-actions"><button class="rp2-rh-btn pri" onclick="_rp2ReportPrint()">🖨 Print Report</button><button class="rp2-rh-btn" onclick="_rp2ReportCopy()">⧉ Copy Summary</button></div></div>'
      +'</div></div>';

    var kpis='<div class="rp2-rh-kpis">'
      +kpi(g.t.source==='dailySalesFallback'?'Provisional revenue':'Revenue',money(g.t.revenue),g.t.source==='dailySalesFallback'?'From management per-rep Daily Sales feed':(g.forecast.goal?paceLabel:'Selected report period'))
      +kpi('Orders',String(g.t.orders),g.t.source==='dailySalesFallback'?'Dated primary orders in selected week':(g.t.orders?money(g.t.aov)+' AOV':'No orders entered'))
      +kpi('Calls',g.t.callsKnown===false?'—':String(g.t.calls),g.t.callsKnown===false?'Available after weekly scorecard entry':(g.callTarget?(Math.round(g.callPct)+'% of '+g.callTarget+' target'):'No call target window'))
      +kpi('Rank',g.rank?('#'+g.rank):'—',g.rank?('of '+g.rankTotal+' reps'):'No rank available')
      +kpi('Forecast',g.forecast.goal?money(g.forecast.projected):'—',g.forecast.status)
      +kpi('Active customers',String(g.customers.active),g.customers.dormant+' dormant signals')
      +kpi('Order issues',String(g.orders.issueOrders.length),g.quality.arts.length+' art errors · '+g.quality.credits.length+' rep-fault credits')
      +kpi('Top 5 customer share',g.customers.total?pct(g.customers.top5Share):'—','Recorded YTD customer concentration')
      +'</div>';

    return '<div class="rp2-rh-shell">'+hero+kpis+tabBar(tab)+(tab==='history'?historyView():reportBody(g,tab))+'</div>'
   }catch(e){
    try{
      window._rp2LastReportError={message:(e&&e.message)||String(e),stack:(e&&e.stack)||''};
      console.error('[Reports Hub 2.0 render error]',e);
    }catch(_e){}
    var msg=(e&&e.message)||'Unknown report error';
    return '<div class="rp2-rh-shell"><div class="rp2-rh-hero"><div class="rp2-rh-kick">Reports Hub 2.0 · RECOVERY MODE</div><div class="rp2-rh-title">The report engine recovered instead of crashing</div><div class="rp2-rh-copy">A connected data source returned an unexpected legacy value. The rest of the Rep Portal remains available while this specific source is isolated.</div></div><div class="rp2-rh-source-warning"><strong>Runtime detail</strong><span>'+esc(msg)+'</span></div></div>'
   }
  };

  window._rp2ReportsDraw=function(){
    if(typeof Chart!=='function'||window._rp2ReportTab==='history')return;
    var canvas=document.getElementById('rp2-rh-chart');if(!canvas)return;
    var g=buildReport(window._rp2ReportTab==='coaching'?'quarter':window._rp2ReportTab);
    if(_rp2.reportChart){try{_rp2.reportChart.destroy()}catch(e){}}
    var labels=g.spec.weeks.map(function(w){return 'Wk '+(w.num!=null?w.num:'')});
    var rev=g.spec.weeks.map(function(w){return n(((S.data||{})[g.spec.rep+'|'+w.key]||{}).revenue)});
    var pace=[],cum=0,weekGoal=g.forecast.goal&&g.spec.c?g.forecast.goal/((g.spec.c.wks||[]).length||13):0;
    g.spec.weeks.forEach(function(w,i){cum+=weekGoal;pace.push(weekGoal?cum:null)});
    var cumulative=[],running=0;rev.forEach(function(v){running+=v;cumulative.push(running)});
    _rp2.reportChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:labels,datasets:[
        {type:'bar',label:'Weekly revenue',data:rev,backgroundColor:'rgba(250,135,61,.72)',borderRadius:6,yAxisID:'y'},
        {type:'line',label:'Cumulative revenue',data:cumulative,borderColor:'#00AFEF',pointRadius:2,tension:.25,yAxisID:'y'},
        {type:'line',label:'Cumulative goal pace',data:pace,borderColor:'#4ed6a3',borderDash:[6,4],pointRadius:0,tension:0,yAxisID:'y'}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y)}}}},
        scales:{x:{ticks:{color:'#8b95a7',font:{size:10}},grid:{display:false}},y:{ticks:{color:'#8b95a7',font:{size:10},callback:function(v){return '$'+Math.round(v/1000)+'k'}},grid:{color:'rgba(255,255,255,.05)'}}}
      }
    })
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='reports')setTimeout(function(){try{_rp2Go('reports')}catch(e){}},0)
  }catch(e){}
})();
