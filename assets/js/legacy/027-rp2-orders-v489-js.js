
(function(){
  var OR_TABS=[
    {id:'overview',label:'Overview',icon:'◫'},
    {id:'recent',label:'Recent Orders',icon:'↘'},
    {id:'largest',label:'Largest Orders',icon:'★'},
    {id:'new',label:'New Business',icon:'＋'},
    {id:'repeat',label:'Repeat Business',icon:'↻'},
    {id:'mix',label:'Order Mix',icon:'◇'},
    {id:'attention',label:'Needs Attention',icon:'⚠'}
  ];
  window._rp2OrderTab=window._rp2OrderTab||'overview';
  window._rp2OrderOpenId=window._rp2OrderOpenId||null;

  function n(v){return Number(v)||0}
  function esc(v){return _rp2Esc(String(v==null?'':v))}
  function money(v){return _rp2$(n(v))}
  function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
  function dt(v){if(!v)return null;var d=new Date(String(v).length===10?v+'T12:00:00':v);return isNaN(d.getTime())?null:d}
  function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function displayDate(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
  function monthLabel(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short'}):'Unknown'}
  function pct(v){return Math.round(n(v))+'%'}
  function avg(arr){return arr.length?arr.reduce(function(s,v){return s+n(v)},0)/arr.length:0}
  function median(arr){
    if(!arr.length)return 0;
    var a=arr.slice().sort(function(x,y){return x-y}),m=Math.floor(a.length/2);
    return a.length%2?a[m]:(a[m-1]+a[m])/2
  }
  function selectedContext(){
    var c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null;
    if(c&&c.selected)return c;
    var wks=typeof gwq==='function'?(gwq(getYr(),getQ())||[]):[];
    return {rep:_rp2.rep,wks:wks,through:wks,before:wks.slice(0,-1),selected:wks[wks.length-1]||null}
  }
  function weekKeySet(weeks){
    var s={};(weeks||[]).forEach(function(w){if(w&&w.key)s[w.key]=true});return s
  }
  function inPeriod(o,weeks,cutoff){
    if(!o||o.rep!==_rp2.rep||!o.orderDate||o.orderDate>cutoff)return false;
    var keys=weekKeySet(weeks);
    if(o.effWeekKey&&keys[o.effWeekKey])return true;
    if(o.weekKey&&keys[o.weekKey])return true;
    if(!weeks||!weeks.length)return false;
    var first=weeks[0],last=weeks[weeks.length-1];
    return !!(first&&last&&o.orderDate>=iso(dt(first.start))&&o.orderDate<=iso(dt(last.end)))
  }
  function priorQuarter(year,q){
    var qi=parseInt(String(q).replace(/\D/g,''),10)||1;
    if(qi===1)return {year:year-1,q:'Q4'};
    return {year:year,q:'Q'+(qi-1)}
  }
  function issueInfo(o){
    var art=[],cm=[];
    try{if(typeof _ordArtFor==='function')art=_ordArtFor(o)||[]}catch(e){}
    try{if(typeof _ordCmFor==='function')cm=_ordCmFor(o)||[]}catch(e){}
    return {
      art:art,cm:cm,count:art.length+cm.length,
      creditValue:cm.reduce(function(s,x){return s+n(x.amount)},0)
    }
  }
  function orderId(o){
    return encodeURIComponent(String(o.id||o.sig||((o.orderNum||'order')+'|'+(o.orderDate||'')+'|'+n(o.total))))
  }
  function findOrderByEncoded(encoded){
    var id=decodeURIComponent(encoded||'');
    return (S.orders||[]).filter(function(o){
      return String(o.id||o.sig||((o.orderNum||'order')+'|'+(o.orderDate||'')+'|'+n(o.total)))===id
    })[0]||null
  }
  function familyRecords(o,cutoff){
    return (S.orders||[]).filter(function(x){
      return x&&x.rep===o.rep&&x.base===o.base&&x.orderType===o.orderType&&x.orderDate&&x.orderDate<=cutoff
    }).slice().sort(function(a,b){return String(a.orderDate).localeCompare(String(b.orderDate))})
  }
  function mixRows(primary,key,mode){
    var by={};
    primary.forEach(function(o){
      var k=clean(o[key])||'Unknown';
      var x=by[k]||(by[k]={name:k,count:0,revenue:0});
      x.count++;
      x.revenue+=n(o.total)
    });
    var rows=Object.keys(by).map(function(k){return by[k]});
    rows.sort(function(a,b){return mode==='count'?b.count-a.count:b.revenue-a.revenue});
    return rows
  }
  function statFor(records){
    var primary=records.filter(function(o){return o.kind==='order'});
    var netRevenue=records.reduce(function(s,o){return s+n(o.total)},0);
    var grossPrimary=primary.reduce(function(s,o){return s+n(o.total)},0);
    var adjustments=records.filter(function(o){return o.kind==='adjustment'});
    var backorders=records.filter(function(o){return o.kind==='backorder'});
    var newOrders=primary.filter(function(o){return !!o.newCustomer});
    var repeatOrders=primary.filter(function(o){return !o.newCustomer});
    var issueOrders=primary.filter(function(o){return issueInfo(o).count>0});
    return {
      records:records,primary:primary,netRevenue:netRevenue,grossPrimary:grossPrimary,
      orders:primary.length,aov:primary.length?netRevenue/primary.length:0,
      adjustments:adjustments,adjustmentImpact:adjustments.reduce(function(s,o){return s+n(o.total)},0),
      backorders:backorders,backorderRevenue:backorders.reduce(function(s,o){return s+n(o.total)},0),
      newOrders:newOrders,newRevenue:newOrders.reduce(function(s,o){return s+n(o.total)},0),
      repeatOrders:repeatOrders,repeatRevenue:repeatOrders.reduce(function(s,o){return s+n(o.total)},0),
      issueOrders:issueOrders
    }
  }
  function buildOrders(){
    var c=selectedContext(),rep=_rp2.rep,year=Number(getYr()),q=getQ();
    var through=c.through||[],cutoff=c.selected&&c.selected.end?iso(dt(c.selected.end)):(through.length?iso(dt(through[through.length-1].end)):String(year)+'-12-31');
    var currentRecords=(S.orders||[]).filter(function(o){return inPeriod(o,through,cutoff)});
    var cur=statFor(currentRecords);

    var pq=priorQuarter(year,q),pwks=[];
    try{pwks=(gwq(pq.year,pq.q)||[]).slice(0,Math.max(1,through.length))}catch(e){pwks=[]}
    var pcut=pwks.length?iso(dt(pwks[pwks.length-1].end)):String(pq.year)+'-12-31';
    var prevRecords=(S.orders||[]).filter(function(o){
      if(!o||o.rep!==rep||!o.orderDate||o.orderDate>pcut)return false;
      var keys=weekKeySet(pwks);
      return !!((o.effWeekKey&&keys[o.effWeekKey])||(o.weekKey&&keys[o.weekKey]))
    });
    var prev=statFor(prevRecords);

    var primary=cur.primary.slice().sort(function(a,b){return String(b.orderDate).localeCompare(String(a.orderDate))});
    var largest=cur.primary.slice().sort(function(a,b){return n(b.total)-n(a.total)});
    var largestOrder=largest[0]||null;
    var primaryValues=cur.primary.map(function(o){return n(o.total)}).filter(function(v){return v>0});
    var med=median(primaryValues);
    var top5Revenue=largest.slice(0,5).reduce(function(s,o){return s+n(o.total)},0);
    var concentration=cur.grossPrimary>0?top5Revenue/cur.grossPrimary*100:0;

    var typeMix=mixRows(cur.primary,'orderType','revenue');
    var placementMix=mixRows(cur.primary,'placement','count');
    var topType=typeMix[0]||null;
    var topPlacement=placementMix[0]||null;

    var sizeBands=[
      {name:'Under $2.5K',count:0,revenue:0},
      {name:'$2.5K–$9.9K',count:0,revenue:0},
      {name:'$10K+',count:0,revenue:0}
    ];
    cur.primary.forEach(function(o){
      var v=n(o.total),band=v>=10000?sizeBands[2]:v>=2500?sizeBands[1]:sizeBands[0];
      band.count++;band.revenue+=v
    });

    var attention=[];
    cur.primary.forEach(function(o){
      var issues=issueInfo(o),family=familyRecords(o,cutoff),adjustments=family.filter(function(x){return x.kind==='adjustment'}),backs=family.filter(function(x){return x.kind==='backorder'});
      var negAdj=adjustments.reduce(function(s,x){return s+Math.min(0,n(x.total))},0);
      var flags=[],score=0;
      if(issues.art.length){flags.push(issues.art.length+' linked art error'+(issues.art.length===1?'':'s'));score+=28+issues.art.length*5}
      if(issues.cm.length){flags.push(issues.cm.length+' linked credit memo'+(issues.cm.length===1?'':'s'));score+=32+Math.min(20,issues.creditValue/500)}
      if(negAdj<0){flags.push(money(Math.abs(negAdj))+' negative adjustment impact');score+=25+Math.min(20,Math.abs(negAdj)/1000)}
      if(backs.length){flags.push(backs.length+' linked backorder record'+(backs.length===1?'':'s'));score+=16+backs.length*3}
      if(med>0&&n(o.total)>0&&n(o.total)<med*.35){flags.push('Order value is unusually low versus your selected-period median');score+=10}
      if(flags.length){
        if(n(o.total)>=10000&&(issues.count||negAdj<0))score+=20;
        attention.push({order:o,flags:flags,score:score,issues:issues,family:family})
      }
    });
    currentRecords.filter(function(o){return o.kind!=='order'&&o.orphan}).forEach(function(o){
      attention.push({order:o,flags:['Orphan '+o.kind+' record has no matched primary order in the imported order engine'],score:60,issues:issueInfo(o),family:[o]})
    });
    attention.sort(function(a,b){return b.score-a.score});

    var byDate={},byWeek={},byMonth={};
    cur.primary.forEach(function(o){
      var d=o.orderDate||'Unknown',wk=o.effWeekKey||o.weekKey||'Unknown',m=(o.orderDate||'').slice(0,7)||'Unknown';
      var dx=byDate[d]||(byDate[d]={key:d,count:0,revenue:0});dx.count++;dx.revenue+=n(o.total);
      var wx=byWeek[wk]||(byWeek[wk]={key:wk,count:0,revenue:0});wx.count++;wx.revenue+=n(o.total);
      var mx=byMonth[m]||(byMonth[m]={key:m,count:0,revenue:0});mx.count++;mx.revenue+=n(o.total)
    });
    var dateRows=Object.keys(byDate).map(function(k){return byDate[k]}).sort(function(a,b){return b.revenue-a.revenue});
    var weekRows=Object.keys(byWeek).map(function(k){return byWeek[k]}).sort(function(a,b){return b.count-a.count||b.revenue-a.revenue});
    var monthRows=Object.keys(byMonth).map(function(k){var x=byMonth[k];x.aov=x.count?x.revenue/x.count:0;return x}).sort(function(a,b){return b.aov-a.aov});

    var cleanHigh=cur.primary.filter(function(o){
      var issues=issueInfo(o),family=familyRecords(o,cutoff);
      return issues.count===0&&!family.some(function(x){return x.kind==='adjustment'||x.kind==='backorder'})
    }).sort(function(a,b){return n(b.total)-n(a.total)})[0]||null;
    var largestNew=cur.newOrders.slice().sort(function(a,b){return n(b.total)-n(a.total)})[0]||null;
    var largestRepeat=cur.repeatOrders.slice().sort(function(a,b){return n(b.total)-n(a.total)})[0]||null;

    var weeklyTrend=through.map(function(w){
      var recs=currentRecords.filter(function(o){return (o.effWeekKey||o.weekKey)===w.key});
      var s=statFor(recs);
      return {week:w,revenue:s.netRevenue,orders:s.orders,aov:s.aov}
    });

    return {
      c:c,rep:rep,year:year,q:q,cutoff:cutoff,through:through,cur:cur,prev:prev,pq:pq,pwks:pwks,
      primary:primary,largest:largest,largestOrder:largestOrder,median:med,top5Revenue:top5Revenue,concentration:concentration,
      typeMix:typeMix,placementMix:placementMix,topType:topType,topPlacement:topPlacement,sizeBands:sizeBands,
      attention:attention,dateRows:dateRows,weekRows:weekRows,monthRows:monthRows,cleanHigh:cleanHigh,
      largestNew:largestNew,largestRepeat:largestRepeat,weeklyTrend:weeklyTrend
    }
  }

  function sectionHead(kick,title,note){return '<div class="rp2-or-section-head"><div><div class="rp2-or-section-kick">'+kick+'</div><div class="rp2-or-section-title">'+title+'</div></div><div class="rp2-or-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-or-kpi"><div class="rp2-or-kpi-label">'+esc(label)+'</div><div class="rp2-or-kpi-value">'+value+'</div><div class="rp2-or-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-or-tabs-wrap"><div class="rp2-or-tabs">'+OR_TABS.map(function(t){return '<button class="rp2-or-tab '+(t.id===active?'active':'')+'" onclick="_rp2OrderSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function delta(curr,prev){
    if(prev===0)return curr>0?null:0;
    return (curr-prev)/Math.abs(prev)*100
  }
  function deltaText(curr,prev,label){
    var d=delta(curr,prev);
    if(d==null)return 'No prior '+label+' baseline';
    return (d>=0?'▲ ':'▼ ')+Math.abs(Math.round(d))+'% vs '+label
  }
  function storyCard(icon,label,title,copy){return '<div class="rp2-or-story"><div class="rp2-or-story-icon">'+icon+'</div><div class="rp2-or-story-label">'+label+'</div><div class="rp2-or-story-title">'+title+'</div><div class="rp2-or-story-copy">'+copy+'</div></div>'}
  function performanceStory(g){
    var aovD=delta(g.cur.aov,g.prev.aov),revD=delta(g.cur.netRevenue,g.prev.netRevenue),orderD=delta(g.cur.orders,g.prev.orders);
    var aovTitle=aovD==null?'AOV baseline is still forming':((aovD>=0?'Average order value is up ':'Average order value is down ')+Math.abs(Math.round(aovD))+'%');
    var aovCopy='Current net AOV is '+money(g.cur.aov)+' versus '+(g.prev.orders?money(g.prev.aov):'no comparable prior-quarter baseline')+'.';
    var volumeTitle,volumeCopy;
    if(orderD==null||revD==null){volumeTitle='Volume and value need a prior-period baseline';volumeCopy='The page will compare equivalent quarter-to-date windows as prior-quarter order history becomes available.'}
    else if(orderD>revD+8){volumeTitle='Growth is leaning more on order volume';volumeCopy='Primary order count changed '+Math.round(orderD)+'% while net order revenue changed '+Math.round(revD)+'%. More transactions are doing more of the work than larger average orders.'}
    else if(revD>orderD+8){volumeTitle='Larger order value is doing more of the work';volumeCopy='Net order revenue changed '+Math.round(revD)+'% while primary order count changed '+Math.round(orderD)+'%. Value per win is contributing more than pure order volume.'}
    else{volumeTitle='Order count and revenue are moving together';volumeCopy='The selected period shows a relatively balanced relationship between order volume and net order revenue.'}

    var totalMotion=g.cur.newRevenue+g.cur.repeatRevenue,newShare=totalMotion>0?g.cur.newRevenue/totalMotion*100:0;
    var motionTitle=newShare>=45?'New business is carrying a meaningful share':newShare>=20?'The book is primarily repeat business with healthy new contribution':'Revenue is heavily concentrated in repeat business';
    var motionCopy=Math.round(newShare)+'% of primary-order revenue is flagged as new customer business; '+Math.round(100-newShare)+'% is repeat business.';

    var qualityTitle=g.cur.issueOrders.length?g.cur.issueOrders.length+' order'+(g.cur.issueOrders.length===1?' has':'s have')+' linked quality issues':'No selected-period primary orders have linked issues';
    var qualityCopy=g.cur.issueOrders.length
      ?('The attention view prioritizes linked art errors, credit memos, negative adjustments, and backorders—especially when they touch high-value orders.')
      :'The current selected-period primary orders have no linked art-error or credit-memo records in the order engine.';

    return '<div class="rp2-or-story-grid">'
      +storyCard('◈','Average order value',aovTitle,aovCopy)
      +storyCard('↗','Volume vs value',volumeTitle,volumeCopy)
      +storyCard('↻','Customer motion',motionTitle,motionCopy)
      +storyCard('⚠','Quality & risk',qualityTitle,qualityCopy)
      +'</div>'
  }
  function mixBar(label,value,total,tone,sub){
    var p=total>0?value/total*100:0;
    return '<div class="rp2-or-mix-row"><div class="rp2-or-mix-top"><span>'+esc(label)+(sub?' · '+esc(sub):'')+'</span><strong>'+Math.round(p)+'%</strong></div><div class="rp2-or-bar '+(tone||'')+'"><span style="width:'+Math.min(100,p)+'%"></span></div></div>'
  }
  function quickMix(g){
    var motionTotal=g.cur.newRevenue+g.cur.repeatRevenue;
    var typeTotal=g.typeMix.reduce(function(s,x){return s+x.revenue},0);
    var placeTotal=g.placementMix.reduce(function(s,x){return s+x.count},0);
    return '<div class="rp2-or-panel"><div class="rp2-or-panel-title">Order mix at a glance</div><div class="rp2-or-panel-sub">Primary-order mix only; adjustments and backorders stay in the net revenue math but do not inflate mix counts.</div><div class="rp2-or-mix-stack">'
      +(g.topType?mixBar(g.topType.name,g.topType.revenue,typeTotal,'','top order type'):'')
      +(g.topPlacement?mixBar(g.topPlacement.name,g.topPlacement.count,placeTotal,'','top placement'):'')
      +mixBar('New business',g.cur.newRevenue,motionTotal,'good',g.cur.newOrders.length+' orders')
      +mixBar('Repeat business',g.cur.repeatRevenue,motionTotal,'',g.cur.repeatOrders.length+' orders')
      +'</div></div>'
  }
  function record(label,value,sub){return '<div class="rp2-or-record"><div class="rp2-or-record-label">'+label+'</div><div class="rp2-or-record-value">'+value+'</div><div class="rp2-or-record-sub">'+sub+'</div></div>'}
  function records(g){
    var bestDay=g.dateRows[0]||null,bestWeek=g.weekRows[0]||null,bestMonth=g.monthRows[0]||null;
    return '<div class="rp2-or-record-grid">'
      +record('Largest order',g.largestOrder?money(g.largestOrder.total):'—',g.largestOrder?esc((g.largestOrder.customer||'Customer')+' · '+(g.largestOrder.orderNum||'')):'No primary orders in selected period')
      +record('Best order day',bestDay?money(bestDay.revenue):'—',bestDay?displayDate(bestDay.key)+' · '+bestDay.count+' primary order'+(bestDay.count===1?'':'s'):'No order day yet')
      +record('Highest AOV month',bestMonth?money(bestMonth.aov):'—',bestMonth?bestMonth.key+' · '+bestMonth.count+' primary orders':'No monthly baseline')
      +record('Most orders in one week',bestWeek?String(bestWeek.count):'—',bestWeek?esc(bestWeek.key)+' · '+money(bestWeek.revenue):'No weekly order count')
      +record('Largest new-customer order',g.largestNew?money(g.largestNew.total):'—',g.largestNew?esc(g.largestNew.customer||'Customer'):'No new-customer primary orders')
      +record('Cleanest high-value order',g.cleanHigh?money(g.cleanHigh.total):'—',g.cleanHigh?esc((g.cleanHigh.customer||'Customer')+' · no linked issue/adjustment/backorder'):'No clean primary order record')
      +'</div>'
  }
  function kindTag(o){
    if(o.kind==='adjustment')return '<span class="rp2-or-tag adjustment">Adjustment</span>';
    if(o.kind==='backorder')return '<span class="rp2-or-tag backorder">Backorder</span>';
    return '<span class="rp2-or-tag '+(o.newCustomer?'new':'repeat')+'">'+(o.newCustomer?'New':'Repeat')+'</span>'
  }
  function orderRow(o,g){
    var issues=issueInfo(o),att=issues.count>0||o.kind!=='order';
    return '<button class="rp2-or-row '+(att?'attention':'')+'" onclick="_rp2OrderOpen(\''+orderId(o)+'\')">'
      +'<div class="rp2-or-row-date">'+displayDate(o.orderDate)+'</div>'
      +'<div class="rp2-or-row-num">'+esc(o.orderNum||o.base||'Order')+'</div>'
      +'<div class="rp2-or-row-name">'+esc(o.customer||'Customer')+'<small>'+esc(o.placement||'No placement recorded')+'</small></div>'
      +'<div class="rp2-or-row-type">'+esc(o.orderType||'General Sale')+'</div>'
      +'<div class="rp2-or-row-val">'+money(o.total)+'</div>'
      +'<div>'+kindTag(o)+'</div>'
      +'<div class="rp2-or-row-val">'+(issues.count?('<span class="rp2-or-tag risk">'+issues.count+' issue'+(issues.count===1?'':'s')+'</span>'):'—')+'</div>'
      +'</button>'
  }
  function orderTable(list,g,title,sub){
    if(!list.length)return '<div class="rp2-or-empty"><strong>No orders match this view</strong><span>The selected reporting point does not contain any order records in this category.</span></div>';
    return '<div class="rp2-or-panel"><div class="rp2-or-panel-title">'+esc(title)+'</div><div class="rp2-or-panel-sub">'+esc(sub)+'</div><div class="rp2-or-table-wrap"><div class="rp2-or-table">'+list.map(function(o){return orderRow(o,g)}).join('')+'</div></div></div>'
  }
  function attentionList(g){
    if(!g.attention.length)return '<div class="rp2-or-empty"><strong>No selected-period order risks are currently flagged</strong><span>No linked issues, negative adjustment families, backorders, orphan records, or low-value anomalies were detected in the available order data.</span></div>';
    return '<div class="rp2-or-attention-list">'+g.attention.map(function(z){
      var o=z.order,icon=z.issues&&z.issues.count?'⚠':o.kind==='backorder'?'↩':'!';
      return '<button class="rp2-or-attention" onclick="_rp2OrderOpen(\''+orderId(o)+'\')"><div class="rp2-or-att-icon">'+icon+'</div><div class="rp2-or-att-name">'+esc(o.orderNum||o.base||'Order')+' · '+esc(o.customer||'Customer')+'<small>'+z.flags.map(esc).join(' · ')+'</small></div><div class="rp2-or-att-val">'+money(o.total)+'<small>'+esc(o.kind||'order')+'</small></div></button>'
    }).join('')+'</div>'
  }
  function detailedMix(g){
    var typeTotal=g.typeMix.reduce(function(s,x){return s+x.revenue},0)||1;
    var placeTotal=g.placementMix.reduce(function(s,x){return s+x.count},0)||1;
    var sizeTotal=g.sizeBands.reduce(function(s,x){return s+x.count},0)||1;
    var motionTotal=g.cur.newRevenue+g.cur.repeatRevenue||1;
    return sectionHead('Order mix intelligence','What kind of business are you actually winning?','Mix views use primary orders so adjustment and backorder rows do not distort the underlying sales pattern.')
      +'<div class="rp2-or-mix-grid">'
        +'<div class="rp2-or-panel"><div class="rp2-or-panel-title">Order type by revenue</div><div class="rp2-or-panel-sub">Which imported order types are producing the most primary-order value.</div><div class="rp2-or-mix-stack">'+g.typeMix.map(function(x){return mixBar(x.name,x.revenue,typeTotal,'',x.count+' orders')}).join('')+'</div></div>'
        +'<div class="rp2-or-panel"><div class="rp2-or-panel-title">Placement by order count</div><div class="rp2-or-panel-sub">Where orders are being entered, based on the imported placement field.</div><div class="rp2-or-mix-stack">'+g.placementMix.map(function(x){return mixBar(x.name,x.count,placeTotal,'',x.count+' orders')}).join('')+'</div></div>'
        +'<div class="rp2-or-panel"><div class="rp2-or-panel-title">New vs repeat business</div><div class="rp2-or-panel-sub">Primary-order revenue split using the imported new-customer flag.</div><div class="rp2-or-mix-stack">'+mixBar('New business',g.cur.newRevenue,motionTotal,'good',g.cur.newOrders.length+' orders')+mixBar('Repeat business',g.cur.repeatRevenue,motionTotal,'',g.cur.repeatOrders.length+' orders')+'</div></div>'
        +'<div class="rp2-or-panel"><div class="rp2-or-panel-title">Order size bands</div><div class="rp2-or-panel-sub">The shape of the selected-period primary-order book.</div><div class="rp2-or-mix-stack">'+g.sizeBands.map(function(x){return mixBar(x.name,x.count,sizeTotal,x.name==='$10K+'?'good':'',x.count+' orders · '+money(x.revenue))}).join('')+'</div></div>'
      +'</div>'
  }
  function newRepeatCompare(g){
    var newAov=g.cur.newOrders.length?g.cur.newRevenue/g.cur.newOrders.length:0;
    var repeatAov=g.cur.repeatOrders.length?g.cur.repeatRevenue/g.cur.repeatOrders.length:0;
    return '<div class="rp2-or-compare">'
      +'<div class="rp2-or-compare-card"><div class="rp2-or-compare-label">New business</div><div class="rp2-or-compare-value">'+money(g.cur.newRevenue)+'</div><div class="rp2-or-compare-copy">'+g.cur.newOrders.length+' primary orders · '+money(newAov)+' average order value.</div></div>'
      +'<div class="rp2-or-compare-card"><div class="rp2-or-compare-label">Repeat business</div><div class="rp2-or-compare-value">'+money(g.cur.repeatRevenue)+'</div><div class="rp2-or-compare-copy">'+g.cur.repeatOrders.length+' primary orders · '+money(repeatAov)+' average order value.</div></div>'
      +'</div>'
  }
  function learning(g){
    var typeText=g.topType?(g.topType.name+' is currently the largest order-type revenue driver at '+money(g.topType.revenue)+'.'):'No dominant order type is established yet.';
    var motionTotal=g.cur.newRevenue+g.cur.repeatRevenue,newShare=motionTotal>0?g.cur.newRevenue/motionTotal*100:0;
    var motionText=newShare<20?'The book is heavily repeat-driven; new-business contribution is the clearest diversification opportunity.':newShare>55?'New business is carrying a large share; the next challenge is turning those wins into repeat accounts.':'New and repeat business are contributing in a relatively balanced way.';
    var riskText=g.attention.length?(g.attention.length+' selected-period order record'+(g.attention.length===1?' is':'s are')+' flagged for review. Focus first on high-value orders with linked quality or adjustment issues.'):'No major order-risk pattern is currently visible in the available selected-period records.';
    var repeatable=g.cleanHigh?('Your cleanest high-value order is '+money(g.cleanHigh.total)+' for '+(g.cleanHigh.customer||'a customer')+'. Study what made that workflow both large and clean.'):'A clean high-value repeatable-win profile is still forming.';
    var title=g.topType?('Create more of what is already working—without repeating the problems attached to it'):'Build enough order history to reveal a repeatable win profile';
    var copy='Orders 2.0 is most useful when you separate four questions: what produces the most revenue, what produces the most transactions, what creates quality problems, and which large wins were clean enough to repeat.';
    return sectionHead('What it means','What should you learn from your orders?','The point is not simply to admire the biggest order. Use the patterns to decide what kind of opportunity to create more often and what part of the workflow needs tighter execution.')
      +'<div class="rp2-or-learn"><div class="rp2-or-learn-main"><div class="rp2-or-learn-label">Order coaching read</div><div class="rp2-or-learn-title">'+esc(title)+'</div><div class="rp2-or-learn-copy">'+esc(copy)+'</div></div><div class="rp2-or-panel"><div class="rp2-or-learn-list">'
        +'<div class="rp2-or-learn-row"><i>01</i><span>'+esc(typeText)+'</span></div>'
        +'<div class="rp2-or-learn-row"><i>02</i><span>'+esc(motionText)+'</span></div>'
        +'<div class="rp2-or-learn-row"><i>03</i><span>'+esc(riskText)+'</span></div>'
        +'<div class="rp2-or-learn-row"><i>04</i><span>'+esc(repeatable)+'</span></div>'
      +'</div></div></div>'
  }
  function overview(g){
    return sectionHead('Performance story','What is changing in your order book','Equivalent prior-quarter windows are used for trend comparisons so a partial quarter is not compared with a full quarter.')
      +performanceStory(g)
      +sectionHead('Order momentum','Revenue and AOV by selected-quarter week','Net revenue includes adjustments and backorders; order count tracks primary orders only.')
      +'<div class="rp2-or-overview-grid"><div class="rp2-or-panel"><div class="rp2-or-panel-title">Weekly order trend</div><div class="rp2-or-panel-sub">Net order revenue bars with primary-order AOV as the comparison line.</div><div class="rp2-or-chart"><canvas id="rp2-or-chart"></canvas></div></div>'+quickMix(g)+'</div>'
      +sectionHead('Personal order records','Your high-water marks through the selected reporting point','Records use the current selected-quarter timeline and the order data available through the selected week.')
      +records(g)
      +sectionHead('New vs repeat business','Where your order revenue is coming from','New-customer classification comes directly from the imported order file.')
      +newRepeatCompare(g)
      +learning(g)
  }
  function tabView(g,tab){
    if(tab==='recent')return sectionHead('Recent activity','Your latest order records','This view includes primary orders, adjustments, and backorders so the order timeline is operationally complete.')+orderTable(g.cur.records.slice().sort(function(a,b){return String(b.orderDate).localeCompare(String(a.orderDate))}),g,'Recent order activity','Latest records through the selected reporting point');
    if(tab==='largest')return sectionHead('Largest orders','The biggest primary orders in the selected period','Ranked by the original primary-order value. Click any order to see family net impact, linked issues, and context.')+orderTable(g.largest,g,'Largest primary orders','Primary orders ranked from largest to smallest');
    if(tab==='new')return sectionHead('New business','Orders from customers flagged as new','The imported new-customer flag determines this view.')+newRepeatCompare(g)+orderTable(g.cur.newOrders.slice().sort(function(a,b){return n(b.total)-n(a.total)}),g,'New-customer primary orders','Ranked by order value');
    if(tab==='repeat')return sectionHead('Repeat business','Orders from existing customers','These primary orders are not flagged as new customer business in the imported data.')+newRepeatCompare(g)+orderTable(g.cur.repeatOrders.slice().sort(function(a,b){return n(b.total)-n(a.total)}),g,'Repeat-customer primary orders','Ranked by order value');
    if(tab==='mix')return detailedMix(g)+learning(g);
    if(tab==='attention')return sectionHead('Needs attention','Orders and records worth reviewing','Flags include linked art errors, linked credit memos, negative adjustments, backorders, orphan records, and unusually low-value anomalies. A flag means review—not automatic blame.')+attentionList(g)+learning(g);
    return overview(g)
  }
  function orderMeaning(o,g,family,issues,rank,share,customerShare){
    var adjustments=family.filter(function(x){return x.kind==='adjustment'}),backs=family.filter(function(x){return x.kind==='backorder'});
    var neg=adjustments.reduce(function(s,x){return s+Math.min(0,n(x.total))},0);
    if(o.kind==='adjustment')return 'This is an adjustment record rather than a primary order. Review the related order family to understand what changed and whether the adjustment points to a process issue or a normal correction.';
    if(o.kind==='backorder')return 'This is a backorder record tied to the order family. The operational question is whether the remaining fulfillment is being communicated and tracked cleanly.';
    if(issues.count||neg<0){
      return 'This order produced meaningful value but also has a linked quality or financial correction signal. Before trying to repeat the win, identify the exact failure point so the revenue can be reproduced without reproducing the problem.';
    }
    if(o.newCustomer&&rank&&rank<=5)return 'This is both a high-ranking order and new-customer business. The next strategic move is converting the first large win into a repeat relationship.';
    if(!o.newCustomer&&share>=10)return 'This repeat-customer order represents a meaningful share of selected-period primary-order value. Protecting the account matters because a single relationship is carrying material revenue weight.';
    if(rank&&rank<=5)return 'This is one of your largest primary orders in the selected period. Study the customer, order type, placement, and selling motion that created it so the win becomes more repeatable.';
    if(customerShare>=20)return 'This order is part of a customer relationship that represents a large share of your selected-period primary-order revenue. The account is strategically important even if this individual order is not your largest.';
    return 'This is a standard selected-period order. Use the order type, placement, customer motion, and issue history to decide whether it represents a pattern worth creating more often.'
  }
  function drawer(g){
    if(!window._rp2OrderOpenId)return '';
    var o=findOrderByEncoded(window._rp2OrderOpenId);
    if(!o)return '';
    var family=familyRecords(o,g.cutoff),familyNet=family.reduce(function(s,x){return s+n(x.total)},0),issues=issueInfo(o);
    var rank=null;
    g.largest.forEach(function(x,i){if(x===o||x.id===o.id)rank=i+1});
    if(!rank&&o.kind==='order'){
      g.largest.forEach(function(x,i){if(x.orderNum===o.orderNum&&x.orderDate===o.orderDate)rank=i+1})
    }
    var share=g.cur.grossPrimary>0&&o.kind==='order'?n(o.total)/g.cur.grossPrimary*100:0;
    var customerPrimary=g.cur.primary.filter(function(x){return clean(x.customer)===clean(o.customer)});
    var customerRevenue=customerPrimary.reduce(function(s,x){return s+n(x.total)},0);
    var customerShare=g.cur.grossPrimary>0?customerRevenue/g.cur.grossPrimary*100:0;
    var adjustments=family.filter(function(x){return x.kind==='adjustment'}),backs=family.filter(function(x){return x.kind==='backorder'});
    var meaning=orderMeaning(o,g,family,issues,rank,share,customerShare);
    var issueHtml='';
    issues.art.forEach(function(a){issueHtml+='<div class="rp2-or-issue">🎨 Art error · '+esc(a.type||'Issue')+(a.weekKey?' · '+esc(a.weekKey):'')+'</div>'});
    issues.cm.forEach(function(c){issueHtml+='<div class="rp2-or-issue">💳 Credit memo · '+money(c.amount)+' · '+esc(c.fault||'Fault not labeled')+'</div>'});
    if(!issueHtml)issueHtml='<div class="rp2-or-detail-copy">No linked art-error or credit-memo records are attached to this order number/base.</div>';

    return '<div class="rp2-or-drawer-wrap" onclick="if(event.target===this)_rp2OrderClose()"><aside class="rp2-or-drawer">'
      +'<div class="rp2-or-drawer-head"><div><div class="rp2-or-drawer-kick">Order detail · '+esc(o.kind||'order')+'</div><div class="rp2-or-drawer-num">'+esc(o.orderNum||o.base||'Order')+'</div><div class="rp2-or-drawer-name">'+esc(o.customer||'Customer')+' · '+displayDate(o.orderDate)+'</div></div><button class="rp2-or-close" onclick="_rp2OrderClose()">×</button></div>'
      +'<div class="rp2-or-detail-kpis">'
        +'<div class="rp2-or-detail-kpi"><span>Record value</span><strong>'+money(o.total)+'</strong></div>'
        +'<div class="rp2-or-detail-kpi"><span>Order family net</span><strong>'+money(familyNet)+'</strong></div>'
        +'<div class="rp2-or-detail-kpi"><span>Selected-period rank</span><strong>'+(rank?('#'+rank+' of '+g.cur.primary.length):'—')+'</strong></div>'
        +'<div class="rp2-or-detail-kpi"><span>Primary-value share</span><strong>'+(o.kind==='order'?Math.round(share)+'%':'—')+'</strong></div>'
        +'<div class="rp2-or-detail-kpi"><span>Order type</span><strong>'+esc(o.orderType||'—')+'</strong></div>'
        +'<div class="rp2-or-detail-kpi"><span>Placement</span><strong>'+esc(o.placement||'—')+'</strong></div>'
      +'</div>'
      +'<div class="rp2-or-detail-section"><div class="rp2-or-detail-title">What this order means</div><div class="rp2-or-detail-copy">'+esc(meaning)+'</div></div>'
      +'<div class="rp2-or-detail-section"><div class="rp2-or-detail-title">Customer context</div><div class="rp2-or-detail-copy">'+esc(o.customer||'Customer')+' has '+customerPrimary.length+' primary order'+(customerPrimary.length===1?'':'s')+' in the selected period totaling '+money(customerRevenue)+', or '+Math.round(customerShare)+'% of selected-period primary-order value.</div></div>'
      +'<div class="rp2-or-detail-section"><div class="rp2-or-detail-title">Quality and correction signals</div><div class="rp2-or-detail-copy">'+issues.art.length+' linked art error'+(issues.art.length===1?'':'s')+' · '+issues.cm.length+' linked credit memo'+(issues.cm.length===1?'':'s')+' · '+adjustments.length+' adjustment record'+(adjustments.length===1?'':'s')+' · '+backs.length+' backorder record'+(backs.length===1?'':'s')+'.</div><div class="rp2-or-issue-list">'+issueHtml+'</div></div>'
      +'<div class="rp2-or-detail-section"><div class="rp2-or-detail-title">Order family activity</div><div class="rp2-or-detail-copy">Primary order, adjustments, and backorders sharing the same base order and order type through the selected reporting point.</div><div class="rp2-or-family">'+family.map(function(x){return '<div class="rp2-or-family-row"><div class="rp2-or-family-date">'+displayDate(x.orderDate)+'</div><div class="rp2-or-family-kind">'+esc(x.kind||'order')+'</div><div class="rp2-or-family-num">'+esc(x.orderNum||x.base||'Order')+'</div><div class="rp2-or-family-val">'+money(x.total)+'</div></div>'}).join('')+'</div></div>'
      +'<div class="rp2-or-detail-section"><div class="rp2-or-detail-copy">Data note: order detail reflects the order files, adjustment/backorder matching, art-error links, and credit-memo links currently loaded into Sales Tracker. Missing historical imports can make an order family appear incomplete.</div></div>'
      +'</aside></div>'
  }

  window._rp2OrderSetTab=function(id){
    window._rp2OrderTab=id;window._rp2OrderOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2OrdersV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2OrdersDraw()}catch(e){}},0)
  };
  window._rp2OrderOpen=function(id){
    window._rp2OrderOpenId=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2OrdersV2();
    setTimeout(function(){try{window._rp2OrdersDraw()}catch(e){}},0)
  };
  window._rp2OrderClose=function(){
    window._rp2OrderOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2OrdersV2();
    setTimeout(function(){try{window._rp2OrdersDraw()}catch(e){}},0)
  };

  window._rp2OrdersV2=function(){
    var g=buildOrders(),tab=window._rp2OrderTab;
    if(!g.cur.records.length){
      return '<div class="rp2-or-shell"><div class="rp2-or-hero"><div class="rp2-or-kick">Orders 2.0 · BUILD v489</div><div class="rp2-or-title">Your order intelligence center</div><div class="rp2-or-copy">No order records are loaded for '+esc(g.rep)+' through the selected reporting point. Once order files are imported, this page will build the order story, mix, records, risk flags, and detail views automatically.</div></div></div>'
    }

    var aovD=delta(g.cur.aov,g.prev.aov);
    var heroTitle=g.cur.issueOrders.length
      ?(g.cur.issueOrders.length+' primary order'+(g.cur.issueOrders.length===1?' has':'s have')+' linked quality issues worth reviewing')
      :(aovD!=null&&aovD>=10?'Average order value is trending higher than the prior-quarter equivalent window'
        :g.concentration>=45?'A small number of large orders are carrying a meaningful share of the period'
        :'Your order book is building a balanced operating story');
    var heroCopy='Orders 2.0 separates primary orders from adjustments and backorders so revenue, order count, mix, and quality signals stay interpretable.';
    var hero='<div class="rp2-or-hero"><div class="rp2-or-hero-grid"><div><div class="rp2-or-kick">Orders 2.0 · BUILD v489</div><div class="rp2-or-title">Your order intelligence center</div><div class="rp2-or-copy">'+esc(heroTitle)+'. '+esc(heroCopy)+'</div><div class="rp2-or-pills"><span class="rp2-or-pill">Through '+esc(g.cutoff)+'</span><span class="rp2-or-pill">'+g.cur.orders+' primary orders</span><span class="rp2-or-pill '+(g.cur.issueOrders.length?'warn':'good')+'">'+g.cur.issueOrders.length+' orders with linked issues</span></div></div>'
      +'<div class="rp2-or-brief"><div><div class="rp2-or-brief-label">Net order revenue</div><div class="rp2-or-brief-value">'+money(g.cur.netRevenue)+'</div><div class="rp2-or-brief-title">'+deltaText(g.cur.netRevenue,g.prev.netRevenue,'prior-quarter equivalent window')+'</div><div class="rp2-or-brief-copy">Net revenue includes selected-period primary orders, adjustments, and backorders. Primary-order count stays separate.</div></div><div class="rp2-or-brief-sub">'+money(g.cur.grossPrimary)+' gross primary-order value · '+money(g.cur.adjustmentImpact)+' adjustment impact</div></div>'
      +'</div></div>';

    var newShare=(g.cur.newRevenue+g.cur.repeatRevenue)>0?g.cur.newRevenue/(g.cur.newRevenue+g.cur.repeatRevenue)*100:0;
    var kpis='<div class="rp2-or-kpis">'
      +kpi('Net order revenue',money(g.cur.netRevenue),'Primary orders + adjustments + backorders')
      +kpi('Primary orders',String(g.cur.orders),deltaText(g.cur.orders,g.prev.orders,'prior-quarter equivalent'))
      +kpi('Average order value',g.cur.orders?money(g.cur.aov):'—','Net revenue ÷ primary orders')
      +kpi('Largest order',g.largestOrder?money(g.largestOrder.total):'—',g.largestOrder?esc(g.largestOrder.customer||'Customer'):'No primary orders')
      +kpi('New business share',pct(newShare),g.cur.newOrders.length+' new-customer primary orders')
      +kpi('Orders with issues',String(g.cur.issueOrders.length),g.cur.adjustments.length+' adjustments · '+g.cur.backorders.length+' backorders')
      +'</div>';

    return '<div class="rp2-or-shell">'+hero+kpis+tabBar(tab)+tabView(g,tab)+'</div>'+drawer(g)
  };

  window._rp2OrdersDraw=function(){
    if(typeof Chart!=='function')return;
    var canvas=document.getElementById('rp2-or-chart');
    if(!canvas)return;
    var g=buildOrders();
    if(_rp2.ordersChart){try{_rp2.ordersChart.destroy()}catch(e){}}
    var labels=g.weeklyTrend.map(function(x){return 'Wk '+(x.week.num!=null?x.week.num:'')});
    _rp2.ordersChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:labels,datasets:[
        {type:'bar',label:'Net order revenue',data:g.weeklyTrend.map(function(x){return x.revenue}),backgroundColor:'rgba(250,135,61,.72)',borderRadius:6,yAxisID:'y'},
        {type:'line',label:'Primary-order AOV',data:g.weeklyTrend.map(function(x){return x.orders?x.aov:null}),borderColor:'#4ed6a3',pointRadius:3,tension:.3,yAxisID:'y'}
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
    if(sess&&sess.role==='rep'&&_rp2.page==='orders')setTimeout(function(){try{_rp2Go('orders')}catch(e){}},0)
  }catch(e){}
})();
