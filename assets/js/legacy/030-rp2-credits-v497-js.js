
(function(){
  var CM_TABS=[
    {id:'overview',label:'Overview',icon:'◫'},
    {id:'rep',label:'My Responsibility',icon:'◎'},
    {id:'other',label:'Other Causes',icon:'◇'},
    {id:'patterns',label:'Patterns',icon:'↗'},
    {id:'history',label:'Memo History',icon:'◷'}
  ];
  window._rp2CreditTab=window._rp2CreditTab||'overview';
  window._rp2CreditOpenId=window._rp2CreditOpenId||null;

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
  function displayDate(v){
    var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):String(v||'—')
  }
  function pct(v,digits){
    return n(v).toFixed(digits==null?1:digits)+'%'
  }
  function own(obj,key){return !!(obj&&Object.prototype.hasOwnProperty.call(obj,key))}
  function faultKey(c){return String(c&&c.fault||'other').toLowerCase().trim()||'other'}
  function isRepFault(c){return faultKey(c)==='rep'}
  function faultLabel(key){
    var m={
      rep:'Rep',screen_print:'Screen Print',embroidery:'Embroidery',art:'Art',
      shipping:'Shipping',vendor:'Vendor',customer:'Customer',other:'Other'
    };
    return m[key]||String(key||'Other').replace(/_/g,' ').replace(/\b\w/g,function(x){return x.toUpperCase()})
  }
  function faultIcon(key){
    return {
      rep:'◎',screen_print:'▦',embroidery:'✣',art:'✎',
      shipping:'⇢',vendor:'◈',customer:'☺',other:'◇'
    }[key]||'◇'
  }
  function faultClass(key){
    if(key==='rep')return 'rep';
    if(key==='customer')return 'customer';
    return 'external'
  }
  function context(){
    var c=null;
    try{c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null}catch(e){}
    var year=Number(getYr()),q=getQ(),ws=[];
    try{ws=safeArray(c&&c.wks&&c.wks.length?c.wks:gwq(year,q))}catch(e){ws=[]}
    var selected=null;
    try{selected=c&&c.selected?c.selected:(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null)}catch(e){}
    var idx=selected?ws.findIndex(function(w){return w&&w.key===selected.key}):ws.length-1;
    if(idx<0)idx=ws.length-1;
    var through=c&&c.through?safeArray(c.through):ws.slice(0,idx+1);
    return {c:c,year:year,q:q,wks:ws,selected:selected,through:through}
  }
  function previousQuarter(year,q){
    var qi=parseInt(String(q).replace(/\D/g,''),10)||1;
    if(qi===1)return {year:year-1,q:'Q4'};
    return {year:year,q:'Q'+(qi-1)}
  }
  function selectedMemo(c,ctx){
    if(!c||c.rep!==_rp2.rep)return false;
    var keys={};ctx.through.forEach(function(w){if(w&&w.key)keys[w.key]=1});
    if(c.weekKey)return !!keys[c.weekKey];
    return String(c.yr||'')===String(ctx.year)&&String(c.q||'')===String(ctx.q)
  }
  function priorMemo(c,ctx,priorWeeks){
    if(!c||c.rep!==_rp2.rep)return false;
    var keys={};priorWeeks.forEach(function(w){if(w&&w.key)keys[w.key]=1});
    if(c.weekKey)return !!keys[c.weekKey];
    var pq=previousQuarter(ctx.year,ctx.q);
    return String(c.yr||'')===String(pq.year)&&String(c.q||'')===String(pq.q)
  }
  function officialRevenue(rep,ws){
    return safeArray(ws).reduce(function(sum,w){
      var d=(S&&S.data&&w&&w.key&&S.data[rep+'|'+w.key])||{};
      return sum+n(d.revenue)
    },0)
  }
  function matchingOrder(c){
    if(!c)return null;
    var so=String(c.soNum||'').trim();
    if(!so)return null;
    return safeArray(S&&S.orders).filter(function(o){
      if(!o||o.rep!==_rp2.rep)return false;
      return String(o.orderNum||'').trim()===so||String(o.base||'').trim()===so
    }).sort(function(a,b){return n(b.total)-n(a.total)})[0]||null
  }
  function memoId(c){
    return encodeURIComponent(String(c&&c.id!=null?c.id:((c&&c.weekKey||'')+'|'+(c&&c.soNum||'')+'|'+n(c&&c.amount)+'|'+(c&&c.fault||''))))
  }
  function findMemo(encoded){
    var id=decodeURIComponent(encoded||'');
    return safeArray(S&&S.cms).filter(function(c){
      if(!c)return false;
      var x=String(c.id!=null?c.id:((c.weekKey||'')+'|'+(c.soNum||'')+'|'+n(c.amount)+'|'+(c.fault||'')));
      return x===id
    })[0]||null
  }
  function aggregate(rows){
    var total=rows.reduce(function(s,c){return s+n(c.amount)},0);
    var rep=rows.filter(isRepFault),other=rows.filter(function(c){return !isRepFault(c)});
    var byFault={};
    rows.forEach(function(c){
      var k=faultKey(c),x=byFault[k]||(byFault[k]={key:k,count:0,value:0});
      x.count++;x.value+=n(c.amount)
    });
    var faults=Object.keys(byFault).map(function(k){return byFault[k]}).sort(function(a,b){return b.value-a.value||b.count-a.count});
    return {
      rows:rows,total:total,count:rows.length,average:rows.length?total/rows.length:0,
      repRows:rep,repValue:rep.reduce(function(s,c){return s+n(c.amount)},0),
      otherRows:other,otherValue:other.reduce(function(s,c){return s+n(c.amount)},0),
      faults:faults
    }
  }
  function themeFor(c){
    var s=String((c&&c.desc)||'').toLowerCase();
    var groups=[
      {key:'order_entry',label:'Order Entry / Accuracy',words:['wrong','incorrect','quantity','size','sizes','color','colour','address','missed','entered','entry','forgot']},
      {key:'approval',label:'Proof / Approval',words:['proof','approval','approved','approve','sign off','signoff']},
      {key:'communication',label:'Communication / Handoff',words:['communication','email','called','call','told','not told','handoff','follow up','follow-up']},
      {key:'timing',label:'Timing / Deadline',words:['late','deadline','rush','in hand','in-hand','date','timing']},
      {key:'art',label:'Art / Logo Detail',words:['art','logo','design','graphic','placement']},
      {key:'other',label:'Other / Unclear',words:[]}
    ];
    for(var i=0;i<groups.length-1;i++){
      if(groups[i].words.some(function(w){return s.indexOf(w)>=0}))return groups[i]
    }
    return groups[groups.length-1]
  }
  function themes(rows){
    var by={};
    rows.forEach(function(c){
      var t=themeFor(c),x=by[t.key]||(by[t.key]={key:t.key,label:t.label,count:0,value:0});
      x.count++;x.value+=n(c.amount)
    });
    return Object.keys(by).map(function(k){return by[k]}).sort(function(a,b){return b.count-a.count||b.value-a.value})
  }
  function repeatPatterns(rows){
    var cust={},so={};
    rows.forEach(function(c){
      var ck=String(c.custName||c.custId||'').trim();
      if(ck){
        var cx=cust[ck]||(cust[ck]={name:ck,count:0,value:0});
        cx.count++;cx.value+=n(c.amount)
      }
      var sk=String(c.soNum||'').trim();
      if(sk){
        var sx=so[sk]||(so[sk]={name:sk,count:0,value:0});
        sx.count++;sx.value+=n(c.amount)
      }
    });
    return {
      customers:Object.keys(cust).map(function(k){return cust[k]}).filter(function(x){return x.count>=2}).sort(function(a,b){return b.count-a.count||b.value-a.value}),
      orders:Object.keys(so).map(function(k){return so[k]}).filter(function(x){return x.count>=2}).sort(function(a,b){return b.count-a.count||b.value-a.value})
    }
  }
  function weekSeries(rows,ws){
    return safeArray(ws).map(function(w){
      var list=rows.filter(function(c){return c&&c.weekKey===w.key});
      return {
        week:w,
        total:list.reduce(function(s,c){return s+n(c.amount)},0),
        rep:list.filter(isRepFault).reduce(function(s,c){return s+n(c.amount)},0),
        count:list.length
      }
    })
  }
  function build(){
    var ctx=context(),all=safeArray(S&&S.cms),rows=all.filter(function(c){return selectedMemo(c,ctx)});
    var agg=aggregate(rows),revenue=officialRevenue(_rp2.rep,ctx.through);
    var pq=previousQuarter(ctx.year,ctx.q),pws=[];
    try{pws=safeArray(gwq(pq.year,pq.q)).slice(0,ctx.through.length)}catch(e){pws=[]}
    var priorRows=all.filter(function(c){return priorMemo(c,ctx,pws)}),prior=aggregate(priorRows);
    var pats=repeatPatterns(rows),repThemes=themes(agg.repRows),series=weekSeries(rows,ctx.through);
    var impact=revenue>0?agg.repValue/revenue*100:null,totalImpact=revenue>0?agg.total/revenue*100:null;
    var resolvedOrders=rows.filter(function(c){return !!matchingOrder(c)}).length;
    return {
      ctx:ctx,rows:rows,agg:agg,revenue:revenue,prior:prior,pq:pq,pws:pws,
      patterns:pats,repThemes:repThemes,series:series,impact:impact,totalImpact:totalImpact,
      resolvedOrders:resolvedOrders
    }
  }
  function sectionHead(kick,title,note){
    return '<div class="rp2-cm-section-head"><div><div class="rp2-cm-section-kick">'+kick+'</div><div class="rp2-cm-section-title">'+title+'</div></div><div class="rp2-cm-section-note">'+note+'</div></div>'
  }
  function kpi(label,value,sub){
    return '<div class="rp2-cm-kpi"><div class="rp2-cm-kpi-label">'+esc(label)+'</div><div class="rp2-cm-kpi-value">'+value+'</div><div class="rp2-cm-kpi-sub">'+sub+'</div></div>'
  }
  function tabBar(active){
    return '<div class="rp2-cm-tabs-wrap"><div class="rp2-cm-tabs">'+CM_TABS.map(function(t){
      return '<button class="rp2-cm-tab '+(t.id===active?'active':'')+'" onclick="_rp2CreditSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'
    }).join('')+'</div></div>'
  }
  function summary(g){
    var title,copy,tone='good';
    if(!g.agg.count){
      title='No credit memos are recorded for the selected reporting point';
      copy='That is a clean selected-period record. The page will begin building cause, financial-impact, and repeat-pattern intelligence when a memo is logged.';
    }else if(!g.agg.repRows.length){
      title='Customer impact exists, but none of the selected-period memos are marked as rep fault';
      copy=money(g.agg.total)+' of credit value is recorded across '+g.agg.count+' case'+(g.agg.count===1?'':'s')+'. Those cases still matter operationally, but they are separated from your personal responsibility score.';
    }else if(g.impact!=null&&g.impact>=1){
      title='Rep-fault credit impact is large enough to deserve a focused process review';
      copy=money(g.agg.repValue)+' of selected-period credit value is explicitly marked rep fault, equal to '+pct(g.impact,2)+' of official revenue through this reporting point.';
      tone='risk';
    }else{
      title='Rep-fault impact is visible, but the pattern matters more than the raw case count';
      copy=money(g.agg.repValue)+' across '+g.agg.repRows.length+' rep-fault case'+(g.agg.repRows.length===1?'':'s')+'. Review the repeated themes and linked orders before deciding what behavior needs to change.';
      tone='warn';
    }
    return {title:title,copy:copy,tone:tone}
  }
  function deltaText(curr,prev){
    if(prev===0)return curr>0?'New versus prior equivalent window':'No change';
    var d=(curr-prev)/Math.abs(prev)*100;
    if(Math.abs(d)<1)return 'Flat vs prior equivalent';
    return (d>0?'▲ ':'▼ ')+Math.abs(Math.round(d))+'% vs prior equivalent'
  }
  function mixBar(label,value,total,tone,sub){
    var p=total>0?value/total*100:0;
    return '<div class="rp2-cm-mix-row"><div class="rp2-cm-mix-top"><span>'+esc(label)+(sub?' · '+esc(sub):'')+'</span><strong>'+Math.round(p)+'%</strong></div><div class="rp2-cm-bar '+(tone||'')+'"><span style="width:'+Math.min(100,p)+'%"></span></div></div>'
  }
  function faultMix(g,rows){
    var a=aggregate(rows),total=a.total||1;
    if(!a.faults.length)return '<div class="rp2-cm-empty"><strong>No fault categories in this view</strong><span>Fault mix appears when credit memos are available.</span></div>';
    return '<div class="rp2-cm-mix">'+a.faults.map(function(x){
      return mixBar(faultLabel(x.key),x.value,total,x.key==='rep'?'rep':x.key==='customer'?'good':'',x.count+' case'+(x.count===1?'':'s')+' · '+money(x.value))
    }).join('')+'</div>'
  }
  function readCards(g){
    var top=g.agg.faults[0],topRepTheme=g.repThemes[0];
    var first={
      tone:g.agg.repRows.length?'warn':'good',
      label:'Responsibility',
      title:g.agg.repRows.length?(g.agg.repRows.length+' case'+(g.agg.repRows.length===1?' is':'s are')+' explicitly marked rep fault'):'No selected-period memos are marked rep fault',
      copy:g.agg.repRows.length?('Only these '+g.agg.repRows.length+' cases count as personal rep responsibility in the current tracker logic. The other '+g.agg.otherRows.length+' cases remain operational issues, not rep-fault penalties.'):'The selected-period memos may still affect customers or margin, but the tracker does not classify them as your fault.'
    };
    var second={
      tone:'warn',label:'Largest cause',
      title:top?(faultLabel(top.key)+' is the largest credit category'):'No dominant cause yet',
      copy:top?(money(top.value)+' across '+top.count+' case'+(top.count===1?'':'s')+'. Review whether the pattern belongs to your own process, production, shipping, vendor handling, or customer-driven changes.'):'More history is needed before a repeated cause can be identified.'
    };
    var third={
      tone:g.patterns.customers.length||g.patterns.orders.length?'risk':'good',
      label:'Repeat pattern',
      title:g.patterns.customers.length?(g.patterns.customers[0].name+' appears in multiple credit cases'):(g.patterns.orders.length?(g.patterns.orders[0].name+' has multiple credit records'):'No repeated customer or order pattern detected'),
      copy:g.patterns.customers.length?('This customer has '+g.patterns.customers[0].count+' selected-period memos totaling '+money(g.patterns.customers[0].value)+'.'):(g.patterns.orders.length?('This sales order has '+g.patterns.orders[0].count+' credit records totaling '+money(g.patterns.orders[0].value)+'.'):'The current cases are dispersed rather than concentrated around one repeated customer or order.')
    };
    if(topRepTheme&&g.agg.repRows.length){
      third={tone:'warn',label:'Rep-fault theme',title:topRepTheme.label+' is the leading description theme',copy:topRepTheme.count+' rep-fault case'+(topRepTheme.count===1?'':'s')+' match this transparent keyword-based theme. Use the original memo descriptions to confirm the real root cause.'}
    }
    return '<div class="rp2-cm-read-grid">'+[first,second,third].map(function(x){
      return '<div class="rp2-cm-read '+x.tone+'"><div class="rp2-cm-read-label">'+esc(x.label)+'</div><div class="rp2-cm-read-title">'+esc(x.title)+'</div><div class="rp2-cm-read-copy">'+esc(x.copy)+'</div></div>'
    }).join('')+'</div>'
  }
  function faultCards(rows){
    var a=aggregate(rows);
    if(!a.faults.length)return '<div class="rp2-cm-empty"><strong>No credit memos in this view</strong><span>Cause cards appear when matching records are available.</span></div>';
    return '<div class="rp2-cm-fault-grid">'+a.faults.map(function(x){
      return '<div class="rp2-cm-fault"><div class="rp2-cm-fault-icon">'+faultIcon(x.key)+'</div><div class="rp2-cm-fault-name">'+esc(faultLabel(x.key))+'</div><div class="rp2-cm-fault-value">'+money(x.value)+'</div><div class="rp2-cm-fault-sub">'+x.count+' case'+(x.count===1?'':'s')+' · '+Math.round(a.total?x.value/a.total*100:0)+'% of this view</div></div>'
    }).join('')+'</div>'
  }
  function themeCards(g){
    if(!g.repThemes.length)return '<div class="rp2-cm-empty"><strong>No rep-fault description themes to analyze</strong><span>Theme analysis only applies to cases explicitly marked Rep. It never reclassifies other fault types.</span></div>';
    return '<div class="rp2-cm-theme-grid">'+g.repThemes.map(function(x){
      return '<div class="rp2-cm-theme"><div class="rp2-cm-theme-name">'+esc(x.label)+'</div><div class="rp2-cm-theme-value">'+x.count+'</div><div class="rp2-cm-theme-copy">'+money(x.value)+' across matching rep-fault memo descriptions. This is a keyword grouping, not an automatic blame decision.</div></div>'
    }).join('')+'</div>'
  }
  function patternList(g){
    var items=[];
    g.patterns.customers.slice(0,5).forEach(function(x){items.push({icon:'🏢',name:x.name,copy:x.count+' credit cases tied to the same customer',value:money(x.value)})});
    g.patterns.orders.slice(0,5).forEach(function(x){items.push({icon:'📦',name:x.name,copy:x.count+' credit records tied to the same sales order',value:money(x.value)})});
    if(!items.length)return '<div class="rp2-cm-empty"><strong>No repeated customer or order concentration detected</strong><span>The current selected-period memos are not repeating around the same customer or sales order.</span></div>';
    return '<div class="rp2-cm-pattern-list">'+items.map(function(x){
      return '<div class="rp2-cm-pattern"><div class="rp2-cm-pattern-icon">'+x.icon+'</div><div class="rp2-cm-pattern-name">'+esc(x.name)+'<small>'+esc(x.copy)+'</small></div><div class="rp2-cm-pattern-val">'+x.value+'</div></div>'
    }).join('')+'</div>'
  }
  function memoRow(c){
    var key=faultKey(c),order=matchingOrder(c);
    return '<button class="rp2-cm-row '+(key==='rep'?'rep':'')+'" onclick="_rp2CreditOpen(\''+memoId(c)+'\')">'
      +'<div class="rp2-cm-cell">'+esc(c.weekKey||((c.yr||'')+' '+(c.q||''))||'—')+'</div>'
      +'<div class="rp2-cm-cell strong">'+esc(c.soNum||'—')+'</div>'
      +'<div class="rp2-cm-cell strong">'+esc(c.custName||c.custId||'Customer not recorded')+'</div>'
      +'<div class="rp2-cm-cell">'+esc(c.invNum||'—')+'</div>'
      +'<div><span class="rp2-cm-tag '+faultClass(key)+'">'+esc(faultLabel(key))+'</span></div>'
      +'<div class="rp2-cm-cell">'+(order?('Matched · '+money(order.total)):'No order match')+'</div>'
      +'<div class="rp2-cm-cell money">'+money(c.amount)+'</div>'
      +'</button>'
  }
  function memoTable(rows,title,sub){
    var sorted=rows.slice().sort(function(a,b){
      var av=n(a&&a.id),bv=n(b&&b.id);
      if(av||bv)return bv-av;
      return String(b&&b.weekKey||'').localeCompare(String(a&&a.weekKey||''))
    });
    if(!sorted.length)return '<div class="rp2-cm-empty"><strong>No credit memos match this view</strong><span>'+esc(sub)+'</span></div>';
    return '<div class="rp2-cm-panel"><div class="rp2-cm-panel-title">'+esc(title)+'</div><div class="rp2-cm-panel-sub">'+esc(sub)+'</div><div class="rp2-cm-table-wrap"><div class="rp2-cm-table">'+sorted.map(memoRow).join('')+'</div></div></div>'
  }
  function responsibilityView(g){
    return sectionHead('My responsibility','Only cases explicitly marked Rep','This is the only fault value the current tracker says counts against the rep credit-memo score. Other causes remain visible elsewhere but are not silently assigned to you.')
      +(g.agg.repRows.length
        ?('<div class="rp2-cm-summary"><div class="rp2-cm-summary-label">Rep-fault impact</div><div class="rp2-cm-summary-title">'+money(g.agg.repValue)+' across '+g.agg.repRows.length+' case'+(g.agg.repRows.length===1?'':'s')+'</div><div class="rp2-cm-summary-copy">'+(g.impact==null?'Official revenue is not available for a revenue-impact percentage.':('That equals '+pct(g.impact,2)+' of official revenue through the selected reporting point.'))+' The goal is root-cause prevention, not simply counting mistakes.</div></div>')
        :'<div class="rp2-cm-summary"><div class="rp2-cm-summary-label">Clean personal responsibility view</div><div class="rp2-cm-summary-title">No selected-period credit memo is marked as rep fault</div><div class="rp2-cm-summary-copy">There may still be customer-impacting credit memos in Other Causes, but the current tracker does not classify them as your personal fault.</div></div>')
      +sectionHead('Transparent theme analysis','What the rep-fault descriptions appear to repeat','Themes use simple visible keyword groups. They help organize the memo descriptions but never change the original fault classification.')
      +themeCards(g)
      +sectionHead('Rep-fault memo detail','Review the actual cases','Open a memo to inspect the original description, customer, sales order, invoice, and linked order context.')
      +memoTable(g.agg.repRows,'Rep-fault credit memos','Only records explicitly classified as Rep are shown here.')
  }
  function otherView(g){
    return sectionHead('Other causes','Customer impact that is not marked as rep fault','Screen print, embroidery, art, shipping, vendor, customer, and other causes stay separate from personal rep responsibility.')
      +faultCards(g.agg.otherRows)
      +sectionHead('Operational context','Why this still matters','Not-rep-fault does not mean unimportant. These issues can reveal production, vendor, shipping, customer-change, or system patterns that affect the customer experience and margin.')
      +memoTable(g.agg.otherRows,'Other-cause credit memos','These records are visible for awareness but are not counted as Rep fault by the current tracker logic.')
  }
  function patternsView(g){
    return sectionHead('Repeat patterns','Where credit activity is concentrating','Repeated customers, repeated sales orders, fault mix, and rep-fault description themes help distinguish isolated incidents from recurring process problems.')
      +'<div class="rp2-cm-overview-grid"><div class="rp2-cm-panel"><div class="rp2-cm-panel-title">Repeated customers and sales orders</div><div class="rp2-cm-panel-sub">Only patterns appearing at least twice in the selected reporting period are shown.</div>'+patternList(g)+'</div><div class="rp2-cm-panel"><div class="rp2-cm-panel-title">Cause mix</div><div class="rp2-cm-panel-sub">Share of total selected-period credit value by recorded fault type.</div>'+faultMix(g,g.rows)+'</div></div>'
      +sectionHead('Rep-fault themes','Description-based coaching clues','This section only reads the descriptions of memos already marked Rep. It does not reinterpret production or customer-caused memos.')
      +themeCards(g)
  }
  function overviewView(g){
    var s=summary(g);
    return sectionHead('Quality & financial read','What the selected-period credit activity actually means','The page separates total customer impact from personal rep responsibility so the scorecard stays fair.')
      +'<div class="rp2-cm-summary"><div class="rp2-cm-summary-label">Selected-period interpretation</div><div class="rp2-cm-summary-title">'+esc(s.title)+'</div><div class="rp2-cm-summary-copy">'+esc(s.copy)+'</div></div>'
      +sectionHead('Credit trajectory','When the financial impact occurred','Weekly bars show all selected-period credit value. The line isolates the portion explicitly marked Rep.')
      +'<div class="rp2-cm-overview-grid"><div class="rp2-cm-panel"><div class="rp2-cm-panel-title">Weekly credit impact</div><div class="rp2-cm-panel-sub">Total credit value versus rep-fault credit value by selected-quarter week.</div><div class="rp2-cm-chart"><canvas id="rp2-cm-chart"></canvas></div></div><div class="rp2-cm-panel"><div class="rp2-cm-panel-title">Responsibility mix</div><div class="rp2-cm-panel-sub">Total customer impact is not the same thing as personal fault.</div><div class="rp2-cm-mix">'+mixBar('Rep fault',g.agg.repValue,g.agg.total,'rep',g.agg.repRows.length+' cases')+mixBar('Other causes',g.agg.otherValue,g.agg.total,'good',g.agg.otherRows.length+' cases')+'</div></div></div>'
      +sectionHead('What stands out','The three most useful signals','Use these cards to decide whether the next action is personal process coaching, operational follow-up, or simply continued monitoring.')
      +readCards(g)
      +sectionHead('Cause map','Where the selected-period credit value is coming from','Fault values come directly from the manager-entered credit memo record.')
      +faultCards(g.rows)
  }
  function drawer(g){
    if(!window._rp2CreditOpenId)return '';
    var c=findMemo(window._rp2CreditOpenId);
    if(!c)return '';
    var key=faultKey(c),order=matchingOrder(c),customerRows=g.rows.filter(function(x){
      var a=String(x.custName||x.custId||'').trim().toLowerCase(),b=String(c.custName||c.custId||'').trim().toLowerCase();
      return a&&b&&a===b
    });
    var customerValue=customerRows.reduce(function(s,x){return s+n(x.amount)},0);
    var responsibility=isRepFault(c)
      ?'This memo is explicitly marked Rep and therefore counts in the current tracker’s personal credit-memo score.'
      :'This memo is not marked Rep. It affects the customer and total credit picture, but the current tracker does not count it as personal rep fault.';
    return '<div class="rp2-cm-drawer-wrap" onclick="if(event.target===this)_rp2CreditClose()"><aside class="rp2-cm-drawer">'
      +'<div class="rp2-cm-drawer-head"><div><div class="rp2-cm-drawer-kick">Credit memo detail · '+esc(faultLabel(key))+'</div><div class="rp2-cm-drawer-title">'+money(c.amount)+'</div><div class="rp2-cm-drawer-sub">'+esc(c.custName||c.custId||'Customer not recorded')+' · '+esc(c.soNum||'No sales order recorded')+'</div></div><button class="rp2-cm-close" onclick="_rp2CreditClose()">×</button></div>'
      +'<div class="rp2-cm-detail-kpis">'
        +'<div class="rp2-cm-detail-kpi"><span>Fault classification</span><strong>'+esc(faultLabel(key))+'</strong></div>'
        +'<div class="rp2-cm-detail-kpi"><span>Responsibility</span><strong>'+(isRepFault(c)?'Rep fault':'Not marked rep fault')+'</strong></div>'
        +'<div class="rp2-cm-detail-kpi"><span>Week</span><strong>'+esc(c.weekKey||((c.yr||'')+' '+(c.q||''))||'—')+'</strong></div>'
        +'<div class="rp2-cm-detail-kpi"><span>Invoice</span><strong>'+esc(c.invNum||'—')+'</strong></div>'
      +'</div>'
      +'<div class="rp2-cm-detail-section"><div class="rp2-cm-detail-title">What this classification means</div><div class="rp2-cm-detail-copy">'+esc(responsibility)+'</div></div>'
      +'<div class="rp2-cm-detail-section"><div class="rp2-cm-detail-title">Original memo description</div><div class="rp2-cm-detail-copy">'+esc(c.desc||'No description was recorded for this memo.')+'</div></div>'
      +'<div class="rp2-cm-detail-section"><div class="rp2-cm-detail-title">Customer pattern</div><div class="rp2-cm-detail-copy">'+customerRows.length+' selected-period credit memo'+(customerRows.length===1?' is':'s are')+' tied to this recorded customer identity, totaling '+money(customerValue)+'.</div></div>'
      +'<div class="rp2-cm-detail-section"><div class="rp2-cm-detail-title">Linked order context</div>'
        +(order?('<div class="rp2-cm-order-link"><strong>'+esc(order.orderNum||order.base||'Order')+' · '+money(order.total)+'</strong><span>'+esc(order.customer||'Customer')+' · '+esc(order.orderType||'Order type not recorded')+' · '+esc(order.orderDate||'Date not recorded')+'. The credit memo value equals '+pct(n(order.total)?n(c.amount)/n(order.total)*100:0,1)+' of this matched order value.</span></div>'):'<div class="rp2-cm-detail-copy">No uploaded primary order matched the recorded sales order number. This can happen when the order file has not been imported or the identifiers differ.</div>')
      +'</div>'
      +'<div class="rp2-cm-detail-section"><div class="rp2-cm-detail-copy">Data note: fault classification is shown exactly as recorded in the manager-side Credit Memos system. This Rep Portal page does not reassign fault.</div></div>'
      +'</aside></div>'
  }

  window._rp2CreditSetTab=function(id){
    window._rp2CreditTab=id;window._rp2CreditOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2CreditsV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2CreditsDraw()}catch(e){}},0)
  };
  window._rp2CreditOpen=function(id){
    window._rp2CreditOpenId=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2CreditsV2();
    setTimeout(function(){try{window._rp2CreditsDraw()}catch(e){}},0)
  };
  window._rp2CreditClose=function(){
    window._rp2CreditOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2CreditsV2();
    setTimeout(function(){try{window._rp2CreditsDraw()}catch(e){}},0)
  };

  window._rp2CreditsV2=function(){
    try{
      var g=build(),tab=window._rp2CreditTab,s=summary(g);
      var qLabel=g.ctx.q+' '+g.ctx.year,selectedLabel=g.ctx.selected?(g.ctx.selected.label||g.ctx.selected.key):'Selected reporting point';
      var hero='<div class="rp2-cm-hero"><div class="rp2-cm-hero-grid"><div><div class="rp2-cm-kick">Credit Memos 2.0 · BUILD v497</div><div class="rp2-cm-title">Customer impact without unfair blame</div><div class="rp2-cm-copy">See the full credit-memo picture while keeping personal responsibility separate from production, shipping, vendor, customer, art, and other causes.</div><div class="rp2-cm-pills"><span class="rp2-cm-pill">'+esc(qLabel)+'</span><span class="rp2-cm-pill">'+esc(selectedLabel)+'</span><span class="rp2-cm-pill '+s.tone+'">'+g.agg.repRows.length+' rep-fault case'+(g.agg.repRows.length===1?'':'s')+'</span></div></div>'
        +'<div class="rp2-cm-brief"><div><div class="rp2-cm-brief-label">Total selected-period credit value</div><div class="rp2-cm-brief-value">'+money(g.agg.total)+'</div><div class="rp2-cm-brief-title">'+esc(s.title)+'</div><div class="rp2-cm-brief-copy">'+esc(s.copy)+'</div></div><div class="rp2-cm-brief-foot">'+deltaText(g.agg.repValue,g.prior.repValue)+' · '+g.resolvedOrders+' of '+g.agg.count+' memos matched to an uploaded order</div></div>'
        +'</div></div>';

      var kpis='<div class="rp2-cm-kpis">'
        +kpi('Total credit value',money(g.agg.total),g.agg.count+' total case'+(g.agg.count===1?'':'s'))
        +kpi('Rep-fault value',money(g.agg.repValue),g.agg.repRows.length+' case'+(g.agg.repRows.length===1?'':'s')+' explicitly marked Rep')
        +kpi('Other-cause value',money(g.agg.otherValue),g.agg.otherRows.length+' cases not marked Rep')
        +kpi('Rep-fault revenue impact',g.impact==null?'—':pct(g.impact,2),g.revenue?('of '+money(g.revenue)+' official revenue'):'Official revenue unavailable')
        +kpi('Average memo',g.agg.count?money(g.agg.average):'—','Across all selected-period causes')
        +kpi('Matched orders',String(g.resolvedOrders),g.agg.count?Math.round(g.resolvedOrders/g.agg.count*100)+'% of memo records':'No memo records')
        +'</div>';

      var content=tab==='rep'?responsibilityView(g):tab==='other'?otherView(g):tab==='patterns'?patternsView(g):tab==='history'?memoTable(g.rows,'Selected-period credit memo history','Open any memo for responsibility, customer, description, and linked-order context.'):overviewView(g);
      return '<div class="rp2-cm-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+drawer(g)
    }catch(e){
      console.error('[Credit Memos 2.0 render error]',e);
      return '<div class="rp2-cm-shell"><div class="rp2-cm-hero"><div class="rp2-cm-kick">Credit Memos 2.0 · RECOVERY MODE</div><div class="rp2-cm-title">The credit memo page hit a data compatibility issue</div><div class="rp2-cm-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2CreditsDraw=function(){
    if(typeof Chart!=='function'||window._rp2CreditTab!=='overview')return;
    var canvas=document.getElementById('rp2-cm-chart');if(!canvas)return;
    var g=build();
    if(_rp2.creditChart){try{_rp2.creditChart.destroy()}catch(e){}}
    _rp2.creditChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{
        labels:g.series.map(function(x){return 'Wk '+(x.week&&x.week.num!=null?x.week.num:'')}),
        datasets:[
          {type:'bar',label:'Total credit value',data:g.series.map(function(x){return x.total}),backgroundColor:'rgba(250,135,61,.68)',borderRadius:6,yAxisID:'y'},
          {type:'line',label:'Rep-fault credit value',data:g.series.map(function(x){return x.rep}),borderColor:'#f5be64',pointRadius:3,tension:.25,yAxisID:'y'}
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},
          tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y)}}}
        },
        scales:{
          x:{ticks:{color:'#8b95a7',font:{size:10}},grid:{display:false}},
          y:{ticks:{color:'#8b95a7',font:{size:10},callback:function(v){return '$'+Math.round(v).toLocaleString()}},grid:{color:'rgba(255,255,255,.05)'}}
        }
      }
    })
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='credits')setTimeout(function(){try{_rp2Go('credits')}catch(e){}},0)
  }catch(e){}
})();
