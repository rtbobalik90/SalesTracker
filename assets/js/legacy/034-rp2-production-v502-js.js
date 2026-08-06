
(function(){
  var TABS=[
    {id:'overview',label:'Command Center',icon:'◫'},
    {id:'methods',label:'Capacity by Method',icon:'🏭'},
    {id:'orders',label:'Order Watchlist',icon:'📦'},
    {id:'planner',label:'Deadline Planner',icon:'📅'},
    {id:'playbook',label:'Communication Playbook',icon:'💬'}
  ];
  window._rp2ProdTab=window._rp2ProdTab||'overview';
  window._rp2ProdSelectedMethod=window._rp2ProdSelectedMethod||0;

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
  function localJSON(key){
    try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}
  }
  function today(){
    var d=window._rp2ProdNow?new Date(window._rp2ProdNow):new Date();
    d.setHours(12,0,0,0);return d
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
    x.setHours(12,0,0,0);y.setHours(12,0,0,0);
    return Math.round((y-x)/86400000)
  }
  function parseLead(v){
    if(v==null||v==='')return null;
    if(typeof v==='number'&&isFinite(v))return Math.round(v);
    var m=String(v).match(/-?\d+(?:\.\d+)?/);return m?Math.round(Number(m[0])):null
  }
  function sourceCandidates(){
    var out=[],cfg=null,legacy=null;
    try{cfg=typeof getProductionFeedSettings==='function'?getProductionFeedSettings():localJSON('salesTracker_productionFeed')}catch(e){cfg=localJSON('salesTracker_productionFeed')}
    if(cfg&&safeArray(cfg.rows).length)out.push({name:'Admin production feed',rows:safeArray(cfg.rows),updatedAt:cfg.lastRefresh||null,rank:4,url:cfg.url||''});
    try{
      var p=S&&S.companyKnowledge&&S.companyKnowledge.production;
      if(p&&safeArray(p.rows).length)out.push({name:p.sheetUrl?'Company Knowledge feed':'Saved production snapshot',rows:safeArray(p.rows),updatedAt:p.lastFetched||null,rank:3,url:p.sheetUrl||''})
    }catch(e){}
    if(safeArray(window.tcpProductionData).length)out.push({name:'Production data feed',rows:safeArray(window.tcpProductionData),updatedAt:null,rank:2,url:''});
    legacy=localJSON('tcp_production_rows');
    if(safeArray(legacy).length)out.push({name:'Legacy production snapshot',rows:safeArray(legacy),updatedAt:null,rank:1,url:''});
    return out
  }
  function candidateTime(c){
    var d=dval(c&&c.updatedAt);if(d)return d.getTime();
    var latest=0;
    safeArray(c&&c.rows).forEach(function(r){var rd=dval(r&&r.updated);if(rd)latest=Math.max(latest,rd.getTime())});
    return latest
  }
  function chooseSource(){
    var cs=sourceCandidates();
    if(!cs.length)return {name:'No production feed',rows:[],updatedAt:null,rank:0,url:''};
    cs.sort(function(a,b){
      var at=candidateTime(a),bt=candidateTime(b);
      if(at&&bt&&at!==bt)return bt-at;
      if(at&&!bt)return -1;if(bt&&!at)return 1;
      return b.rank-a.rank
    });
    return cs[0]
  }
  function methodStatus(days,hasDate){
    if(days==null)return {key:'unknown',label:'Needs review',tone:'info',icon:'?'};
    if(hasDate&&days<0)return {key:'stale',label:'Past-dated snapshot',tone:'risk',icon:'!'};
    if(days<=10)return {key:'quick',label:'Quick-turn window',tone:'good',icon:'⚡'};
    if(days<=16)return {key:'standard',label:'Manageable window',tone:'warn',icon:'✓'};
    return {key:'extended',label:'Extended window',tone:'risk',icon:'⏳'}
  }
  function normalizeMethod(r,idx){
    r=r||{};
    var name=String(r.decoration||r.name||r.method||r.productionMethod||'').trim()||('Production method '+(idx+1));
    var ship=dval(r.shipWeek||r.ship||r.shipDate||r.date||r.currentShipWeek);
    var explicit=parseLead(r.leadDays!=null?r.leadDays:(r.leadTime!=null?r.leadTime:r.lead));
    var days=ship?diffDays(today(),ship):explicit;
    var st=methodStatus(days,!!ship);
    return {
      id:'method_'+idx,name:name,shipDate:ship,shipRaw:r.shipWeek||r.ship||r.shipDate||r.date||'',
      leadDays:days,status:st,updated:r.updated||r.lastUpdated||'',raw:r
    }
  }
  function feed(){
    var src=chooseSource(),methods=src.rows.map(normalizeMethod).filter(function(x){return x.name});
    var update=dval(src.updatedAt),latestRow=null;
    methods.forEach(function(m){var d=dval(m.updated);if(d&&(!latestRow||d>latestRow))latestRow=d});
    if(!update)update=latestRow;
    var age=update?diffDays(update,today()):null,freshTone=age==null?'info':age<=1?'good':age<=3?'warn':'risk';
    var positive=methods.filter(function(m){return m.leadDays!=null&&m.leadDays>=0});
    var avg=positive.length?positive.reduce(function(s,m){return s+m.leadDays},0)/positive.length:null;
    return {
      source:src,methods:methods,updated:update,ageDays:age,freshTone:freshTone,
      quick:methods.filter(function(m){return m.status.key==='quick'}),
      standard:methods.filter(function(m){return m.status.key==='standard'}),
      extended:methods.filter(function(m){return m.status.key==='extended'}),
      stale:methods.filter(function(m){return m.status.key==='stale'}),
      unknown:methods.filter(function(m){return m.status.key==='unknown'}),
      avgLead:avg
    }
  }
  function normSO(v){return String(v||'').toLowerCase().replace(/\s+/g,'').trim()}
  function orderDate(o){
    var d=dval(o&&o.orderDate)||dval(o&&o.date)||dval(o&&o.enteredAt);
    if(d)return d;
    var key=o&&(o.effWeekKey||o.weekKey);
    if(key&&typeof gwq==='function'){
      var p=String(key).split('_'),y=Number(p[0]),q=p[1];
      try{var w=safeArray(gwq(y,q)).filter(function(x){return x&&x.key===key})[0];return w?dval(w.end||w.start):null}catch(e){}
    }
    return null
  }
  function orderMethod(o){return String(o&&(
    o.decorationMethod||o.productionMethod||o.decoration||o.method||o.printMethod||o.decoratingMethod
  )||'').trim()}
  function inHandsDate(o){return dval(o&&(o.inHandsDate||o.inHands||o.needBy||o.needByDate||o.eventDate||o.dueDate||o.deliveryDate))}
  function repOrderData(){
    var all=safeArray(S&&S.orders).filter(function(o){return o&&o.rep===_rp2.rep});
    all.forEach(function(o){o._date=orderDate(o)});
    var primary=all.filter(function(o){return o.kind==='order'}).sort(function(a,b){return (b._date?b._date.getTime():0)-(a._date?a._date.getTime():0)});
    return {all:all,primary:primary}
  }
  function closedStatus(v){return /closed|complete|completed|shipped|invoiced|cancel|void/i.test(String(v||''))}
  function openStatus(o){return !closedStatus(o&&o.status)}
  function artFor(o){
    var so=normSO(o&&o.orderNum),base=normSO(o&&o.base);
    return safeArray(S&&S.artErrors).filter(function(a){var k=normSO(a&&(a.so||a.soNum));return k&&(k===so||k===base)})
  }
  function creditFor(o){
    var so=normSO(o&&o.orderNum),base=normSO(o&&o.base);
    return safeArray(S&&S.cms).filter(function(c){var k=normSO(c&&(c.soNum||c.so));return k&&(k===so||k===base)})
  }
  function familyFor(o,all){var base=normSO(o&&o.base||o&&o.orderNum);return all.filter(function(x){return normSO(x&&x.base||x&&x.orderNum)===base})}
  function matchMethod(name,methods){
    var q=String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(!q)return null;
    return methods.filter(function(m){
      var s=m.name.toLowerCase().replace(/[^a-z0-9]/g,'');
      return s===q||s.indexOf(q)>=0||q.indexOf(s)>=0
    })[0]||null
  }
  function plan(method,inHands,transit){
    if(!method)return {tone:'info',title:'Choose a production method',copy:'Select a method and customer in-hands date to calculate the current delivery buffer.'};
    var ship=method.shipDate?new Date(method.shipDate):null;
    if(!ship&&method.leadDays!=null){ship=today();ship.setDate(ship.getDate()+method.leadDays)}
    var due=dval(inHands),days=Math.max(0,Math.round(n(transit)||0));
    if(!ship)return {tone:'info',title:'The selected method needs a readable ship date',copy:'The current feed does not provide enough timing information to calculate a delivery buffer.',method:method};
    var arrival=new Date(ship);arrival.setDate(arrival.getDate()+days);
    if(!due)return {tone:'info',title:'Add the customer in-hands date',copy:'Current estimated arrival for '+method.name+' is '+fmtDate(arrival)+' using '+days+' calendar transit day'+(days===1?'':'s')+'.',method:method,ship:ship,arrival:arrival};
    var buffer=diffDays(arrival,due),tone,title;
    if(buffer>=7){tone='good';title='Healthy planning buffer'}
    else if(buffer>=2){tone='warn';title='Workable, but manage the handoff closely'}
    else if(buffer>=0){tone='warn';title='Very tight delivery window'}
    else{tone='risk';title='Current snapshot misses the requested date'}
    var copy=method.name+' is currently showing a production ship date of '+fmtDate(ship)+'. With '+days+' calendar transit day'+(days===1?'':'s')+', estimated arrival is '+fmtDate(arrival)+'. ';
    copy+=buffer>=0?('That leaves '+buffer+' calendar day'+(buffer===1?'':'s')+' before the requested in-hands date.'):(Math.abs(buffer)+' calendar day'+(Math.abs(buffer)===1?'':'s')+' after the requested in-hands date.');
    return {tone:tone,title:title,copy:copy,method:method,ship:ship,arrival:arrival,due:due,buffer:buffer,transit:days}
  }
  window._rp2ProdPlan=plan;

  function watchOrders(orderData,f){
    var all=orderData.all,rows=[];
    orderData.primary.forEach(function(o){
      if(!openStatus(o))return;
      var reasons=[],score=0,fam=familyFor(o,all),arts=artFor(o),cms=creditFor(o),age=o._date?diffDays(o._date,today()):null;
      var bo=fam.filter(function(x){return x.kind==='backorder'||x.isBackorder}).length;
      if(bo){reasons.push({text:bo+' backorder line'+(bo===1?'':'s'),tone:'risk'});score+=4}
      if(/hold|delay|problem|backorder|pending/i.test(String(o.status||''))){reasons.push({text:'Status: '+String(o.status),tone:'risk'});score+=4}
      if(arts.length){reasons.push({text:arts.length+' art issue'+(arts.length===1?'':'s'),tone:'warn'});score+=2+arts.length}
      if(cms.length){reasons.push({text:cms.length+' credit memo'+(cms.length===1?'':'s'),tone:'warn'});score+=2}
      if(age!=null&&age>21){reasons.push({text:age+' days open',tone:'warn'});score+=Math.min(4,Math.floor(age/21))}
      if(!o.customer){reasons.push({text:'Customer missing',tone:'warn'});score+=1}
      if(!o._date){reasons.push({text:'Order date missing',tone:'warn'});score+=1}
      var methodName=orderMethod(o),method=matchMethod(methodName,f.methods),due=inHandsDate(o),delivery=null;
      if(methodName&&!method){reasons.push({text:'Method not matched to feed',tone:'warn'});score+=1}
      if(method&&method.status.key==='extended'){reasons.push({text:method.name+' extended',tone:'risk'});score+=3}
      if(method&&method.status.key==='stale'){reasons.push({text:'Method snapshot stale',tone:'risk'});score+=2}
      if(method&&due){
        delivery=plan(method,due,n(o.transitDays||o.shippingDays||3));
        if(delivery.buffer<0){reasons.push({text:'Current timing misses in-hands',tone:'risk'});score+=5}
        else if(delivery.buffer<3){reasons.push({text:'Tight in-hands buffer',tone:'warn'});score+=3}
      }
      if(score>0)rows.push({order:o,reasons:reasons,score:score,tone:score>=6?'risk':'warn',arts:arts,cms:cms,backorders:bo,age:age,method:method,due:due,delivery:delivery})
    });
    return rows.sort(function(a,b){return b.score-a.score||n(b.order.total)-n(a.order.total)})
  }
  function selectedPeriod(orderData){
    var c=null;try{c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null}catch(e){}
    var sel=c&&c.selected?c.selected:(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null),rows=[];
    if(sel){
      var s=dval(sel.start),e=dval(sel.end);
      rows=orderData.primary.filter(function(o){
        return o.effWeekKey===sel.key||o.weekKey===sel.key||(o._date&&s&&e&&o._date>=s&&o._date<=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999))
      })
    }
    return {label:sel?(sel.label||sel.key):(getQ()+' '+getYr()),selected:sel,orders:rows}
  }
  function readiness(orderData){
    var p=orderData.primary,total=p.length||0,method=p.filter(function(o){return !!orderMethod(o)}).length,due=p.filter(function(o){return !!inHandsDate(o)}).length,both=p.filter(function(o){return !!orderMethod(o)&&!!inHandsDate(o)}).length;
    return {total:total,method:method,due:due,both:both,methodPct:total?method/total*100:0,duePct:total?due/total*100:0,bothPct:total?both/total*100:0}
  }
  function topArtType(){
    var map={};safeArray(S&&S.artErrors).filter(function(a){return a&&a.rep===_rp2.rep}).forEach(function(a){var k=String(a.type||'Other');map[k]=(map[k]||0)+1});
    var arr=Object.keys(map).map(function(k){return {name:k.replace(/_/g,' ').replace(/\b\w/g,function(x){return x.toUpperCase()}),count:map[k]}}).sort(function(a,b){return b.count-a.count});
    return arr[0]||null
  }
  function build(){
    var f=feed(),orders=repOrderData(),watch=watchOrders(orders,f),period=selectedPeriod(orders),ready=readiness(orders);
    var open=orders.primary.filter(openStatus),openValue=open.reduce(function(s,o){return s+n(o.total)},0),backorders=orders.all.filter(function(o){return o.kind==='backorder'||o.isBackorder}).length;
    var statusCounts={quick:f.quick.length,standard:f.standard.length,extended:f.extended.length,stale:f.stale.length,unknown:f.unknown.length};
    return {feed:f,orders:orders,watch:watch,period:period,ready:ready,open:open,openValue:openValue,backorders:backorders,statusCounts:statusCounts,topArt:topArtType()}
  }
  function story(g){
    var f=g.feed;
    if(!f.methods.length)return {title:'Production timing is not connected yet',copy:'The rep portal cannot give current promise guidance until a production snapshot is present in Company Knowledge or the Admin production feed.',tone:'risk',icon:'?'};
    var risk=f.extended.length+f.stale.length;
    var pieces=['The current snapshot tracks '+f.methods.length+' production method'+(f.methods.length===1?'':'s')+'.'];
    if(f.quick.length)pieces.push(f.quick.length+' method'+(f.quick.length===1?' is':'s are')+' inside the quick-turn window.');
    if(f.extended.length)pieces.push(f.extended.length+' method'+(f.extended.length===1?' has':'s have')+' an extended current window and should be quoted carefully.');
    if(f.stale.length)pieces.push(f.stale.length+' method row'+(f.stale.length===1?' is':'s are')+' past-dated, so refresh the feed before using it for promises.');
    if(g.watch.length)pieces.push(g.watch.length+' recorded open order'+(g.watch.length===1?' has':'s have')+' a communication or handoff watch signal.');
    var title=risk?'Production promises need selective caution':'The current production snapshot supports confident quoting';
    return {title:title,copy:pieces.join(' '),tone:risk?'warn':'good',icon:risk?'⚠':'✓'}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-pi-section-head"><div><div class="rp2-pi-section-kick">'+kick+'</div><div class="rp2-pi-section-title">'+title+'</div></div><div class="rp2-pi-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-pi-kpi"><div class="rp2-pi-kpi-label">'+esc(label)+'</div><div class="rp2-pi-kpi-value">'+value+'</div><div class="rp2-pi-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-pi-tabs-wrap"><div class="rp2-pi-tabs">'+TABS.map(function(t){return '<button class="rp2-pi-tab '+(t.id===active?'active':'')+'" onclick="_rp2ProdSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function insight(icon,label,title,copy,tone){return '<div class="rp2-pi-insight '+(tone||'')+'"><div class="rp2-pi-insight-icon">'+icon+'</div><div class="rp2-pi-insight-label">'+esc(label)+'</div><div class="rp2-pi-insight-title">'+esc(title)+'</div><div class="rp2-pi-insight-copy">'+esc(copy)+'</div></div>'}
  function methodCard(m,idx){
    return '<button class="rp2-pi-method '+m.status.tone+'" onclick="_rp2ProdChooseMethod('+idx+')"><div class="rp2-pi-method-icon">'+m.status.icon+'</div><div class="rp2-pi-method-name">'+esc(m.name)+'</div><div class="rp2-pi-method-date">'+(m.shipDate?fmtDate(m.shipDate):(m.leadDays!=null?m.leadDays+' days':'—'))+'</div><div class="rp2-pi-method-meta">'+(m.shipDate?((m.leadDays==null?'Lead time unavailable':m.leadDays+' calendar days from today')):'No readable ship date in the current feed')+(m.updated?' · Updated '+esc(m.updated):'')+'</div><div class="rp2-pi-method-status">'+esc(m.status.label)+'</div></button>'
  }
  function capacityBars(methods){
    var valid=methods.filter(function(m){return m.leadDays!=null}),max=valid.length?Math.max.apply(null,valid.map(function(m){return Math.max(1,Math.abs(m.leadDays))})):1;
    if(!methods.length)return '<div class="rp2-pi-empty"><strong>No production methods loaded</strong><span>Connect or refresh the production feed in the manager-side Admin area.</span></div>';
    return '<div class="rp2-pi-capacity">'+methods.map(function(m){
      var w=m.leadDays==null?5:Math.max(5,Math.round(Math.abs(m.leadDays)/max*100));
      return '<div class="rp2-pi-cap-row"><div class="rp2-pi-cap-top"><span>'+esc(m.name)+'</span><strong>'+(m.leadDays==null?'Needs review':m.leadDays+' days · '+esc(m.status.label))+'</strong></div><div class="rp2-pi-bar"><span style="width:'+w+'%"></span></div></div>'
    }).join('')+'</div>'
  }
  function sellNow(g){
    var q=g.feed.quick.slice(0,3),x=g.feed.extended.concat(g.feed.stale).slice(0,3);
    return '<div class="rp2-pi-grid-3">'
      +insight('⚡','Sell with the most flexibility',q.length?q.map(function(m){return m.name}).join(', '):'No quick-turn method identified',q.length?'These methods currently have the shortest production windows in the loaded snapshot. Product availability and art approval still need confirmation.':'Refresh the production feed before positioning any method as quick-turn.','good')
      +insight('⏳','Quote carefully',x.length?x.map(function(m){return m.name}).join(', '):'No extended method identified',x.length?'These methods have the longest or past-dated production windows in the current snapshot. Confirm timing before making a customer promise.':'No production method is currently classified as extended or past-dated.','warn')
      +insight('📣','Communication priority',g.watch.length?(g.watch.length+' open order'+(g.watch.length===1?' needs':'s need')+' proactive review'):'No open-order watch signal',g.watch.length?'Review the order watchlist and update the customer before they need to ask. The watchlist is a handoff/communication signal, not a confirmed missed deadline.':'No recorded open order currently has a quality, backorder, age, or status watch flag.','info')
      +'</div>'
  }
  function watchList(g,limit){
    var rows=g.watch.slice(0,limit||8);
    if(!rows.length)return '<div class="rp2-pi-empty"><strong>No recorded open-order watch signals</strong><span>This does not prove every order is on schedule; it means the uploaded order data has no current quality, backorder, aging, or status flags.</span></div>';
    return '<div class="rp2-pi-watch-list">'+rows.map(function(x){
      var o=x.order,next=x.delivery&&x.delivery.buffer<0?'Confirm production and reset expectations now':x.backorders?'Review backorder plan and customer update':x.arts?'Verify corrected art and approval status':x.age>21?'Confirm current order status and communicate an update':'Review the order handoff and next customer communication';
      return '<div class="rp2-pi-watch '+x.tone+'"><div class="rp2-pi-watch-order">'+esc(o.orderNum||o.base||'Order')+'<small>'+esc(o.customer||'Customer not recorded')+' · '+esc(o.status||'Open')+'</small></div><div class="rp2-pi-watch-reasons">'+x.reasons.map(function(r){return '<span class="rp2-pi-tag '+r.tone+'">'+esc(r.text)+'</span>'}).join('')+'</div><div class="rp2-pi-watch-next">'+esc(next)+'</div><div class="rp2-pi-watch-val">'+money(o.total)+'</div></div>'
    }).join('')+'</div>'
  }
  function readinessCards(g){
    var r=g.ready;
    return '<div class="rp2-pi-readiness">'
      +'<div class="rp2-pi-ready-card"><div class="rp2-pi-ready-label">Production method captured</div><div class="rp2-pi-ready-value">'+Math.round(r.methodPct)+'%</div><div class="rp2-pi-ready-copy">'+r.method+' of '+r.total+' primary orders contain a decoration/production method field.</div></div>'
      +'<div class="rp2-pi-ready-card"><div class="rp2-pi-ready-label">In-hands date captured</div><div class="rp2-pi-ready-value">'+Math.round(r.duePct)+'%</div><div class="rp2-pi-ready-copy">'+r.due+' of '+r.total+' primary orders contain an in-hands, event, need-by, or delivery date.</div></div>'
      +'<div class="rp2-pi-ready-card"><div class="rp2-pi-ready-label">Order-level deadline ready</div><div class="rp2-pi-ready-value">'+Math.round(r.bothPct)+'%</div><div class="rp2-pi-ready-copy">'+r.both+' orders have both fields needed to compare directly against the production feed.</div></div>'
      +'<div class="rp2-pi-ready-card"><div class="rp2-pi-ready-label">Production source</div><div class="rp2-pi-ready-value">'+esc(g.feed.source.name)+'</div><div class="rp2-pi-ready-copy">'+(g.feed.updated?('Last dated update '+fmtDate(g.feed.updated)+'.'):'The selected source does not include a dated refresh marker.')+'</div></div>'
      +'</div>'
  }
  function periodContext(g){
    var p=g.period,arts=0,cms=0,open=0,value=0;
    p.orders.forEach(function(o){arts+=artFor(o).length;cms+=creditFor(o).length;if(openStatus(o))open++;value+=n(o.total)});
    var title=p.orders.length?('The selected period contains '+p.orders.length+' uploaded primary order'+(p.orders.length===1?'':'s')):'No primary orders are uploaded for the selected period';
    var copy=p.orders.length?('This period represents '+money(value)+' in recorded primary-order value. '+open+' order'+(open===1?' remains':'s remain')+' in an open status, with '+arts+' linked art issue'+(arts===1?'':'s')+' and '+cms+' linked credit memo'+(cms===1?'':'s')+'.'):('Production timing itself is a current snapshot, so the selected period is used only for the rep’s order context—not as historical production-capacity data.');
    return sectionHead('Selected-period order context','What the current selectors mean here','Production capacity is current-state data. The top selectors filter the rep’s order context but do not pretend that today’s production feed existed historically.')
      +'<div class="rp2-pi-period"><div class="rp2-pi-period-grid"><div><div class="rp2-pi-period-kick">'+esc(p.label)+'</div><div class="rp2-pi-period-title">'+esc(title)+'</div><div class="rp2-pi-period-copy">'+esc(copy)+'</div></div>'
      +'<div class="rp2-pi-period-stat"><span>Orders</span><strong>'+p.orders.length+'</strong><small>Uploaded primary orders</small></div>'
      +'<div class="rp2-pi-period-stat"><span>Order value</span><strong>'+money(value)+'</strong><small>Recorded net primary value</small></div>'
      +'<div class="rp2-pi-period-stat"><span>Open status</span><strong>'+open+'</strong><small>Not marked completed, shipped, invoiced, cancelled, or void</small></div>'
      +'<div class="rp2-pi-period-stat"><span>Quality links</span><strong>'+(arts+cms)+'</strong><small>'+arts+' art · '+cms+' credit</small></div>'
      +'</div></div>'
  }
  function overview(g){
    var s=story(g);
    return sectionHead('Current production posture','Know what you can promise before the customer asks','This page uses the newest available production snapshot. It is current-state guidance, not a historical production report.')
      +'<div class="rp2-pi-summary"><div class="rp2-pi-summary-label">Production interpretation</div><div class="rp2-pi-summary-title">'+esc(s.title)+'</div><div class="rp2-pi-summary-copy">'+esc(s.copy)+'</div></div>'
      +sectionHead('Selling guidance','Where to lean in and where to slow down','Production timing never replaces confirmation of inventory, art approval, payment, or shipping.')
      +sellNow(g)
      +sectionHead('Current capacity by decoration method','The loaded production ship-week snapshot','Lead days are calculated from today to the current ship-week date. Past-dated rows are treated as stale and should be refreshed.')
      +'<div class="rp2-pi-grid-2"><div class="rp2-pi-panel"><div class="rp2-pi-panel-title">Current production lead-time profile</div>'+capacityBars(g.feed.methods)+'</div><div class="rp2-pi-panel"><div class="rp2-pi-panel-title">Production lead-time chart</div><div class="rp2-pi-panel-sub">Calendar days from today. Past-dated rows appear below zero.</div><div class="rp2-pi-chart"><canvas id="rp2-pi-chart"></canvas></div></div></div>'
      +sectionHead('Rep order watchlist','Which recorded orders deserve a proactive check','Flags come from uploaded status, age, backorders, art errors, credit memos, and optional method/in-hands fields. They do not claim a deadline has been missed unless the order contains enough timing data.')
      +'<div class="rp2-pi-panel">'+watchList(g,6)+'</div>'
      +sectionHead('Order data readiness','What is needed for true order-level production risk','The current order import usually contains sales details but may not include production method or in-hands date. Those fields unlock direct deadline matching.')
      +readinessCards(g)
      +periodContext(g)
  }
  function methodsView(g){
    return sectionHead('Capacity by method','Current ship weeks and promise posture','Click a method to move it into the Deadline Planner. Production timing still requires inventory, art, payment, and shipping confirmation.')
      +(g.feed.methods.length?'<div class="rp2-pi-method-grid">'+g.feed.methods.map(methodCard).join('')+'</div>':'<div class="rp2-pi-empty"><strong>No production feed is connected</strong><span>Connect or refresh the manager-side production feed to populate current method timing.</span></div>')
      +sectionHead('Method comparison','All current production windows on one scale','Calendar days are based on the newest available feed source.')
      +'<div class="rp2-pi-panel"><div class="rp2-pi-chart"><canvas id="rp2-pi-chart"></canvas></div></div>'
      +sectionHead('Feed health','Can this snapshot be trusted for customer conversations?','A production feed should be refreshed frequently because dates can move.')
      +'<div class="rp2-pi-grid-3">'
      +insight('🔌','Source',g.feed.source.name,g.feed.source.url?'A connected source URL is present.':'This source does not expose a connected URL in the current snapshot.','info')
      +insight('🕒','Last dated update',g.feed.updated?fmtDate(g.feed.updated):'Unknown',g.feed.ageDays==null?'No dated refresh marker was found. Confirm the feed before making a promise.':('The newest dated update is '+g.feed.ageDays+' day'+(g.feed.ageDays===1?'':'s')+' old.'),g.feed.freshTone)
      +insight('📊','Methods loaded',String(g.feed.methods.length),g.feed.quick.length+' quick · '+g.feed.standard.length+' manageable · '+g.feed.extended.length+' extended · '+g.feed.stale.length+' past-dated.',g.feed.extended.length||g.feed.stale.length?'warn':'good')
      +'</div>'
  }
  function ordersView(g){
    return sectionHead('Order watchlist','Proactive communication before escalation','These are recorded orders with handoff, status, age, quality, backorder, or optional deadline signals. A flag is a prompt to verify—not proof of a production failure.')
      +'<div class="rp2-pi-panel">'+watchList(g,30)+'</div>'
      +sectionHead('Open-order portfolio','What is currently recorded as open','Imported status can become stale. Confirm the actual production status in the operating system before updating the customer.')
      +'<div class="rp2-pi-grid-4">'
      +insight('📦','Recorded open orders',String(g.open.length),money(g.openValue)+' in primary-order value is not marked completed, shipped, invoiced, cancelled, or void.','info')
      +insight('⚠','Orders with watch signals',String(g.watch.length),g.watch.length?'Review the highest-score orders first and document the next customer update.':'No current watch signal from the uploaded data.','warn')
      +insight('↩','Backorder lines',String(g.backorders),g.backorders?'Backorders should have a clear availability plan and customer communication cadence.':'No backorder lines are recorded for this rep.','risk')
      +insight('🧭','Order-level timing ready',Math.round(g.ready.bothPct)+'%',g.ready.both+' primary orders include both a production method and in-hands/date field.','good')
      +'</div>'
      +sectionHead('Data readiness','Why some orders cannot be matched to production timing','Without production method and in-hands date, the system can detect operational watch signals but cannot honestly calculate a delivery buffer.')
      +readinessCards(g)
      +periodContext(g)
  }
  function plannerResult(p){
    if(!p)return '<div class="rp2-pi-plan-result"><div class="rp2-pi-plan-kick">Current delivery read</div><div class="rp2-pi-plan-title">Choose a method and date</div><div class="rp2-pi-plan-copy">This planner compares the current production ship-week snapshot with a customer in-hands date and calendar transit buffer.</div></div>';
    return '<div class="rp2-pi-plan-result '+p.tone+'"><div class="rp2-pi-plan-kick">Current delivery read</div><div class="rp2-pi-plan-title">'+esc(p.title)+'</div><div class="rp2-pi-plan-copy">'+esc(p.copy)+'</div>'
      +(p.ship?'<div class="rp2-pi-plan-stats"><div class="rp2-pi-plan-stat"><span>Production ship date</span><strong>'+fmtDate(p.ship)+'</strong></div><div class="rp2-pi-plan-stat"><span>Estimated arrival</span><strong>'+fmtDate(p.arrival)+'</strong></div><div class="rp2-pi-plan-stat"><span>Requested in-hands</span><strong>'+fmtDate(p.due)+'</strong></div><div class="rp2-pi-plan-stat"><span>Calendar buffer</span><strong>'+(p.buffer==null?'—':p.buffer+' days')+'</strong></div></div>':'')
      +'</div>'
  }
  function plannerView(g){
    var idx=Math.min(Math.max(0,n(window._rp2ProdSelectedMethod)),Math.max(0,g.feed.methods.length-1)),method=g.feed.methods[idx]||null;
    return sectionHead('Deadline planner','Test the current production snapshot against a customer date','Transit is measured in calendar days for planning only. Confirm actual carrier service, weekends, holidays, inventory, art approval, and production before promising delivery.')
      +'<div class="rp2-pi-planner"><div class="rp2-pi-panel"><div class="rp2-pi-panel-title">Build a delivery scenario</div><div class="rp2-pi-panel-sub">The planner uses the current method ship week—not a guaranteed production completion date.</div><div class="rp2-pi-plan-form">'
      +'<select id="rp2-pi-method">'+g.feed.methods.map(function(m,i){return '<option value="'+i+'" '+(i===idx?'selected':'')+'>'+esc(m.name)+'</option>'}).join('')+'</select>'
      +'<input id="rp2-pi-date" type="date">'
      +'<input id="rp2-pi-transit" type="number" min="0" max="30" value="3" title="Calendar transit days">'
      +'<button class="rp2-pi-plan-btn" onclick="_rp2ProdRunPlanner()">Calculate</button>'
      +'</div><div class="rp2-pi-panel-sub" style="margin-top:10px;">Transit field = calendar days from production ship date to estimated arrival.</div></div>'
      +'<div id="rp2-pi-plan-output">'+plannerResult(method?plan(method,null,3):null)+'</div></div>'
      +sectionHead('Current method choices','Choose a method to preload the planner','Clicking a card selects the method and stays inside the Deadline Planner.')
      +(g.feed.methods.length?'<div class="rp2-pi-method-grid">'+g.feed.methods.map(methodCard).join('')+'</div>':'<div class="rp2-pi-empty"><strong>No methods available</strong><span>Connect the production feed before planning a delivery scenario.</span></div>')
  }
  function scripts(g){
    var quick=g.feed.quick[0],extended=g.feed.extended[0]||g.feed.stale[0],topArt=g.topArt;
    return '<div class="rp2-pi-playbook">'
      +'<div class="rp2-pi-script"><div class="rp2-pi-script-label">Healthy-window customer script</div><div class="rp2-pi-script-title">'+esc(quick?quick.name:'When the method has a workable window')+'</div><div class="rp2-pi-script-copy">“The current production snapshot is showing '+esc(quick?(fmtDate(quick.shipDate||quick.shipRaw)):'a workable window')+'. I still need to confirm inventory, final artwork, and shipping, but this is the strongest option for your timeline right now.”</div></div>'
      +'<div class="rp2-pi-script"><div class="rp2-pi-script-label">Tight-window customer script</div><div class="rp2-pi-script-title">'+esc(extended?extended.name:'When timing needs confirmation')+'</div><div class="rp2-pi-script-copy">“The current production window is tight enough that I do not want to overpromise. I’m confirming the production method, art status, and shipping plan before I give you a firm delivery expectation.”</div></div>'
      +'<div class="rp2-pi-script"><div class="rp2-pi-script-label">Proactive order-update script</div><div class="rp2-pi-script-title">Update before the customer asks</div><div class="rp2-pi-script-copy">“I wanted to give you a proactive update on '+esc(g.watch[0]&&g.watch[0].order?(g.watch[0].order.orderNum||'your order'):'your order')+'. I’m verifying the current production handoff and next milestone now. I’ll follow up with the confirmed timing rather than make you chase the status.”</div></div>'
      +(topArt?'<div class="rp2-pi-script"><div class="rp2-pi-script-label">Personal quality reminder</div><div class="rp2-pi-script-title">Your most common recorded art issue: '+esc(topArt.name)+'</div><div class="rp2-pi-script-copy">Before promising timing, pause and verify the order/art checkpoint connected to '+esc(topArt.name.toLowerCase())+'. Production speed does not protect the order if the handoff is incomplete.</div></div>':'')
      +'</div>'
  }
  function checklist(g){
    var art=g.topArt?('Your most common recorded art issue is '+g.topArt.name+'. Give that checkpoint extra attention.'):'No recurring personal art-error type is currently strong enough to customize this checklist.';
    var items=[
      ['Confirm the customer date','Record the actual in-hands or event date—not only “rush” or “ASAP.”'],
      ['Confirm the production method','Match the intended decoration method to the current production feed before discussing timing.'],
      ['Verify inventory and product path','Production timing does not guarantee garment or product availability.'],
      ['Lock the art handoff',art],
      ['Add the real transit plan','Confirm shipping service, destination, weekends, holidays, and required delivery buffer.'],
      ['Set the next customer update','Tell the customer when they will hear from you again, even when the answer is still pending.']
    ];
    return '<div class="rp2-pi-checklist">'+items.map(function(x,i){return '<div class="rp2-pi-check"><div class="rp2-pi-check-num">'+(i+1)+'</div><div><strong>'+esc(x[0])+'</strong><span>'+esc(x[1])+'</span></div></div>'}).join('')+'</div>'
  }
  function playbookView(g){
    return sectionHead('Communication playbook','Turn production data into a clear customer conversation','These scripts deliberately avoid guarantees. They frame the current snapshot honestly and create a clear next update.')
      +scripts(g)
      +sectionHead('Production-ready handoff checklist','The six checks before a delivery promise','Use this sequence for custom orders, especially when the requested date is tight.')
      +'<div class="rp2-pi-panel">'+checklist(g)+'</div>'
      +sectionHead('When to escalate','The situations that should stop a casual promise','Escalation protects the customer relationship and prevents avoidable production surprises.')
      +'<div class="rp2-pi-grid-3">'
      +insight('🛑','Stop and confirm','Current arrival is after the requested date','Do not promise the delivery. Confirm alternate methods, products, shipping, or a revised customer date.','risk')
      +insight('⚠','Treat as risk-sensitive','Buffer is under three calendar days','Confirm production and shipping before the customer approves the plan. Build a proactive update cadence.','warn')
      +insight('🔄','Refresh the source','Production feed is past-dated or several days old','A stale snapshot is not reliable promise guidance. Refresh it before using the ship week with a customer.','info')
      +'</div>'
  }

  window._rp2ProdSetTab=function(id){
    window._rp2ProdTab=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ProdV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2ProdDraw()}catch(e){}},0)
  };
  window._rp2ProdChooseMethod=function(idx){
    window._rp2ProdSelectedMethod=idx;window._rp2ProdTab='planner';
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ProdV2();
    setTimeout(function(){try{window._rp2ProdDraw()}catch(e){}},0)
  };
  window._rp2ProdRunPlanner=function(){
    var g=build(),sel=document.getElementById('rp2-pi-method'),date=document.getElementById('rp2-pi-date'),transit=document.getElementById('rp2-pi-transit'),out=document.getElementById('rp2-pi-plan-output');
    var idx=sel?Number(sel.value)||0:0;window._rp2ProdSelectedMethod=idx;
    var p=plan(g.feed.methods[idx]||null,date&&date.value,transit&&transit.value);
    if(out)out.innerHTML=plannerResult(p)
  };

  window._rp2ProdV2=function(){
    try{
      var g=build(),tab=window._rp2ProdTab,s=story(g),f=g.feed;
      var ageLabel=f.ageDays==null?'Refresh age unknown':f.ageDays===0?'Updated today':f.ageDays+' day'+(f.ageDays===1?'':'s')+' old';
      var hero='<div class="rp2-pi-hero"><div class="rp2-pi-hero-grid"><div><div class="rp2-pi-kick">Production Intelligence 2.0 · BUILD v502</div><div class="rp2-pi-title">Know what you can promise before the customer asks</div><div class="rp2-pi-copy">Translate the current production snapshot into selling guidance, order-watch signals, delivery scenarios, and proactive customer communication—without pretending the feed is a guaranteed production schedule.</div><div class="rp2-pi-pills"><span class="rp2-pi-pill '+f.freshTone+'">'+esc(ageLabel)+'</span><span class="rp2-pi-pill info">'+f.methods.length+' methods tracked</span><span class="rp2-pi-pill '+s.tone+'">'+esc(s.title)+'</span></div></div>'
        +'<div class="rp2-pi-brief"><div><div class="rp2-pi-brief-label">Current production posture</div><div class="rp2-pi-brief-value">'+s.icon+'</div><div class="rp2-pi-brief-title">'+esc(s.title)+'</div><div class="rp2-pi-brief-copy">'+esc(s.copy)+'</div></div><div class="rp2-pi-brief-foot"><span>Quick-turn methods <strong>'+f.quick.length+'</strong></span><span>Open-order watch signals <strong>'+g.watch.length+'</strong></span></div></div></div></div>';

      var kpis='<div class="rp2-pi-kpis">'
        +kpi('Methods tracked',String(f.methods.length),esc(f.source.name))
        +kpi('Average current lead',f.avgLead==null?'—':Math.round(f.avgLead)+'d','Calendar days across readable future ship dates')
        +kpi('Quick-turn methods',String(f.quick.length),'Current ship week within 10 calendar days')
        +kpi('Extended / stale',String(f.extended.length+f.stale.length),f.extended.length+' extended · '+f.stale.length+' past-dated')
        +kpi('Recorded open orders',String(g.open.length),money(g.openValue)+' in primary-order value')
        +kpi('Orders needing a check',String(g.watch.length),'Handoff, status, age, quality, backorder, or timing signals')
        +kpi('Backorder lines',String(g.backorders),'Recorded for this rep')
        +kpi('Order-level timing ready',Math.round(g.ready.bothPct)+'%',g.ready.both+' orders contain method + in-hands date')
        +'</div>';

      var content=tab==='methods'?methodsView(g):tab==='orders'?ordersView(g):tab==='planner'?plannerView(g):tab==='playbook'?playbookView(g):overview(g);
      return '<div class="rp2-pi-shell">'+hero+kpis+tabBar(tab)+content+'</div>'
    }catch(e){
      console.error('[Production Intelligence v502 render error]',e);
      return '<div class="rp2-pi-shell"><div class="rp2-pi-hero"><div class="rp2-pi-kick">Production Intelligence 2.0 · RECOVERY MODE</div><div class="rp2-pi-title">The production intelligence engine hit a data compatibility issue</div><div class="rp2-pi-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2ProdDraw=function(){
    if(typeof Chart!=='function')return;
    if(window._rp2ProdTab!=='overview'&&window._rp2ProdTab!=='methods')return;
    var canvas=document.getElementById('rp2-pi-chart');if(!canvas)return;
    var g=build(),methods=g.feed.methods;
    if(_rp2.productionChart){try{_rp2.productionChart.destroy()}catch(e){}}
    if(!methods.length)return;
    _rp2.productionChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:methods.map(function(m){return m.name}),datasets:[{
        label:'Calendar days to current ship week',
        data:methods.map(function(m){return m.leadDays}),
        backgroundColor:methods.map(function(m){return m.status.key==='quick'?'rgba(78,214,163,.68)':m.status.key==='standard'?'rgba(245,190,100,.68)':m.status.key==='extended'?'rgba(240,120,120,.68)':m.status.key==='stale'?'rgba(240,120,120,.42)':'rgba(0,175,239,.62)'}),
        borderRadius:6
      }]},
      options:{
        indexAxis:'y',responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){var v=ctx.parsed.x;return v==null?' Timing unavailable':(' '+v+' calendar days')}}}},
        scales:{
          y:{ticks:{color:'#aab4c6',font:{size:9}},grid:{display:false}},
          x:{ticks:{color:'#8b95a7',font:{size:9},callback:function(v){return v+'d'}},grid:{color:'rgba(255,255,255,.05)'}}
        }
      }
    })
  };
})();
