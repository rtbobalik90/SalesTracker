
(function(){
  var TABS=[
    {id:'overview',label:'Lifetime Intelligence',icon:'◫'},
    {id:'history',label:'Error History',icon:'◷'},
    {id:'patterns',label:'Patterns & Prevention',icon:'◇'},
    {id:'streaks',label:'Clean Streaks',icon:'✓'},
    {id:'periods',label:'Period Breakdown',icon:'↘'}
  ];
  window._rp2ArtTab=window._rp2ArtTab||'overview';
  window._rp2ArtOpenId=window._rp2ArtOpenId||null;

  var TYPE_LABELS={
    color_type:'Color type',
    incomplete_art:'Incomplete art sheet',
    location:'Location',
    missing_info:'Missing information',
    order_entry:'Order entry',
    size:'Size'
  };
  var TYPE_ICONS={
    color_type:'🎨',
    incomplete_art:'📄',
    location:'📍',
    missing_info:'❓',
    order_entry:'⌨️',
    size:'📐'
  };
  var ROOTS=[
    {id:'approval',name:'Approval / Proof Control',icon:'✅',words:['approval','approved','approve','proof','sign off','sign-off','signed off']},
    {id:'logo_version',name:'Logo / Version Control',icon:'🗂',words:['wrong logo','logo version','old logo','new logo','art version','wrong file','file version','logo']},
    {id:'placement',name:'Placement / Location',icon:'📍',words:['placement','location','left chest','right chest','sleeve','back location','front location']},
    {id:'color',name:'Color Confirmation',icon:'🎨',words:['wrong color','color','colour','thread color','ink color','pantone']},
    {id:'missing_info',name:'Missing Information',icon:'❓',words:['missing information','missing info','not provided','incomplete','forgot to include','left out']},
    {id:'order_entry',name:'Order Entry Accuracy',icon:'⌨️',words:['order entry','entered wrong','wrong quantity','wrong item','wrong style','entered','entry error']},
    {id:'sizing',name:'Size / Dimensions',icon:'📐',words:['wrong size','size','sizing','dimension','dimensions','too large','too small']},
    {id:'handoff',name:'Communication / Handoff',icon:'💬',words:['communication','handoff','not noted','notes','email','told','not told','missed note']},
    {id:'customer_change',name:'Customer Change Control',icon:'🔄',words:['customer changed','customer change','change request','revision','revised','updated request']},
    {id:'other',name:'Other / Unclear',icon:'◇',words:[]}
  ];

  var PREVENTION={
    color_type:{
      title:'Add a final color-confirmation checkpoint',
      copy:'Before art approval, compare the customer request, sales order, and proof for garment color, ink/thread color, and any Pantone or brand-color requirement.'
    },
    incomplete_art:{
      title:'Use a complete-art checklist before submission',
      copy:'Confirm the art request includes every required logo, location, color, size, reference file, and special instruction before sending it forward.'
    },
    location:{
      title:'Make decoration location explicit in two places',
      copy:'Verify the location on the sales order and on the proof request. Use specific language such as left chest, full back, right sleeve, or exact placement notes.'
    },
    missing_info:{
      title:'Stop the handoff until required information is complete',
      copy:'Do not send the art request forward with a known blank. Confirm missing logo files, colors, locations, sizes, and customer instructions first.'
    },
    order_entry:{
      title:'Run a line-by-line sales-order comparison',
      copy:'Before submission, compare the entered sales order against the customer request and quote. Focus on quantities, styles, colors, sizes, decoration, and notes.'
    },
    size:{
      title:'Confirm dimensions before approval',
      copy:'Make logo dimensions or decoration-size expectations explicit and verify them against the proof before customer approval.'
    },
    approval:{
      title:'Create a proof-to-approval verification step',
      copy:'Before releasing or approving art, compare the final proof with the original request and the latest customer approval. Do not rely on memory or an older email thread.'
    },
    logo_version:{
      title:'Use one clearly identified current logo file',
      copy:'Confirm the exact logo/version before art begins, retire outdated files from the active handoff, and verify the proof against the approved source asset.'
    },
    placement:{
      title:'Repeat the location at every handoff',
      copy:'Carry the exact decoration location from quote to order to art request to proof approval. Ambiguous shorthand should be replaced with specific placement language.'
    },
    color:{
      title:'Lock colors before the proof is approved',
      copy:'Document garment color and print/thread colors in the order notes and verify that the proof reflects the same color direction.'
    },
    missing_info_root:{
      title:'Use a required-information gate',
      copy:'Treat missing customer or production information as a stop condition rather than something to be filled in from assumption.'
    },
    sizing:{
      title:'Make size expectations measurable',
      copy:'Record intended width, height, or maximum decoration area when size matters, then compare that requirement to the proof.'
    },
    handoff:{
      title:'Move critical details out of memory and into the order',
      copy:'Put the customer’s important instructions in the permanent order/art notes so the next person in the workflow does not have to reconstruct the conversation.'
    },
    customer_change:{
      title:'Create a clear revision reset',
      copy:'When a customer changes direction, update the active order/art instructions and verify the next proof against the newest request—not the previous version.'
    },
    other:{
      title:'Add one explicit verification checkpoint',
      copy:'Review the original issue description and identify the single moment where a second check would have prevented the error. Make that check part of the repeatable workflow.'
    }
  };

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
  function normSO(v){return String(v||'').toLowerCase().replace(/\s+/g,'').trim()}
  function normText(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim()}
  function dval(v){
    if(v==null||v==='')return null;
    try{
      var d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);
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
  function typeLabel(type){
    if(TYPE_LABELS[type])return TYPE_LABELS[type];
    try{if(typeof AET!=='undefined'&&AET&&AET[type])return AET[type]}catch(e){}
    var s=String(type||'Other').replace(/^custom_/,'').replace(/_/g,' ');
    return s.replace(/\b\w/g,function(x){return x.toUpperCase()})
  }
  function typeIcon(type){return TYPE_ICONS[type]||'⚠️'}
  function rootDef(id){return ROOTS.filter(function(x){return x.id===id})[0]||ROOTS[ROOTS.length-1]}
  function rootsFor(a){
    var s=normText(a&&a.desc),out=[];
    ROOTS.slice(0,-1).forEach(function(r){if(r.words.some(function(w){return s.indexOf(w)>=0}))out.push(r.id)});
    if(!out.length){
      var type=String(a&&a.type||'');
      if(type==='color_type')out.push('color');
      else if(type==='location')out.push('placement');
      else if(type==='missing_info'||type==='incomplete_art')out.push('missing_info');
      else if(type==='order_entry')out.push('order_entry');
      else if(type==='size')out.push('sizing');
    }
    if(!out.length)out.push('other');
    return out;
  }
  function context(){
    var c=null;try{c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null}catch(e){}
    var year=Number(getYr()),q=getQ(),month='';
    try{month=String(getM()||'')}catch(e){}
    var ws=[];try{ws=safeArray(c&&c.wks&&c.wks.length?c.wks:gwq(year,q))}catch(e){ws=[]}
    var selected=null;try{selected=c&&c.selected?c.selected:(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null)}catch(e){}
    return {c:c,year:year,q:q,month:month,wks:ws,selected:selected}
  }
  function weekFromKey(key){
    if(!key)return null;
    var p=String(key).split('_'),year=Number(p[0]),q=p[1];
    if(!year||!q)return null;
    try{
      return safeArray(gwq(year,q)).filter(function(w){return w&&w.key===key})[0]||null
    }catch(e){return null}
  }
  function errorDate(a){
    if(!a)return null;
    var d=dval(a.dateISO)||dval(a.date);
    if(d)return d;
    var w=weekFromKey(a.weekKey);
    return w?dval(w.end||w.start):null
  }
  function orderDate(o){
    if(!o)return null;
    var d=dval(o.orderDate)||dval(o.date)||dval(o.enteredAt);
    if(d)return d;
    var key=o.effWeekKey||o.weekKey,w=weekFromKey(key);
    return w?dval(w.end||w.start):null
  }
  function repErrors(){
    return safeArray(S&&S.artErrors).filter(function(a){return a&&a.rep===_rp2.rep}).map(function(a){
      var x={};
      Object.keys(a).forEach(function(k){x[k]=a[k]});
      x._date=errorDate(a);
      x._roots=rootsFor(a);
      return x
    }).sort(function(a,b){return (b._date?b._date.getTime():0)-(a._date?a._date.getTime():0)})
  }
  function repOrders(){
    return safeArray(S&&S.orders).filter(function(o){return o&&o.rep===_rp2.rep&&o.kind==='order'}).map(function(o){
      var x={};Object.keys(o).forEach(function(k){x[k]=o[k]});x._date=orderDate(o);return x
    }).sort(function(a,b){return (a._date?a._date.getTime():0)-(b._date?b._date.getTime():0)})
  }
  function orderMaps(orders){
    var map={};orders.forEach(function(o){
      [o.orderNum,o.base].forEach(function(k){var nkey=normSO(k);if(nkey&&!map[nkey])map[nkey]=o})
    });return map
  }
  function matchOrder(a,map){return map[normSO(a&&a.so)]||null}
  function linkedCredits(a){
    var so=normSO(a&&a.so);
    if(!so)return [];
    return safeArray(S&&S.cms).filter(function(c){return c&&(normSO(c.soNum)===so||normSO(c.so)===so)})
  }
  function aggregate(rows){
    var byType={},byRoot={};
    rows.forEach(function(a){
      var t=String(a.type||'other'),tx=byType[t]||(byType[t]={id:t,name:typeLabel(t),icon:typeIcon(t),count:0,rows:[],years:{}});
      tx.count++;tx.rows.push(a);if(a._date)tx.years[a._date.getFullYear()]=1;
      (a._roots||[]).forEach(function(id){
        var rd=rootDef(id),rx=byRoot[id]||(byRoot[id]={id:id,name:rd.name,icon:rd.icon,count:0,rows:[],years:{}});
        rx.count++;rx.rows.push(a);if(a._date)rx.years[a._date.getFullYear()]=1
      })
    });
    var types=Object.keys(byType).map(function(k){var x=byType[k];x.yearCount=Object.keys(x.years).length;return x}).sort(function(a,b){return b.count-a.count||b.yearCount-a.yearCount});
    var roots=Object.keys(byRoot).map(function(k){var x=byRoot[k];x.yearCount=Object.keys(x.years).length;return x}).sort(function(a,b){return b.count-a.count||b.yearCount-a.yearCount});
    return {count:rows.length,types:types,roots:roots}
  }
  function currentAndLongestCleanStreak(orders,errors){
    if(!orders.length)return {current:null,longest:null,matchedOrders:0};
    var errSet={};errors.forEach(function(a){var k=normSO(a.so);if(k)errSet[k]=(errSet[k]||0)+1});
    var current=0,longest=0,run=0,matched=0;
    orders.forEach(function(o){
      var bad=!!(errSet[normSO(o.orderNum)]||errSet[normSO(o.base)]);
      if(bad){matched++;run=0}else{run++;longest=Math.max(longest,run)}
    });
    for(var i=orders.length-1;i>=0;i--){
      var o=orders[i],bad=!!(errSet[normSO(o.orderNum)]||errSet[normSO(o.base)]);
      if(bad)break;current++
    }
    return {current:current,longest:longest,matchedOrders:matched}
  }
  function splitTrend(orders,errors){
    if(orders.length>=10){
      var half=Math.floor(orders.length/2),older=orders.slice(0,half),recent=orders.slice(half),cut=recent[0]&&recent[0]._date;
      var oe=errors.filter(function(a){return !cut||!a._date||a._date<cut}),re=errors.filter(function(a){return cut&&a._date&&a._date>=cut});
      var oldRate=older.length?oe.length/older.length*100:0,newRate=recent.length?re.length/recent.length*100:0,signal='stable';
      if(newRate<oldRate*.8)signal='improving';else if(newRate>oldRate*1.2)signal='worsening';
      return {signal:signal,oldRate:oldRate,newRate:newRate,basis:'orders',olderCount:older.length,recentCount:recent.length}
    }
    var dated=errors.filter(function(a){return a._date}).slice().sort(function(a,b){return a._date-b._date});
    if(dated.length>=4){
      var h=Math.floor(dated.length/2),old=dated.slice(0,h),recent2=dated.slice(h);
      return {signal:recent2.length<old.length?'improving':recent2.length>old.length?'worsening':'stable',oldRate:old.length,newRate:recent2.length,basis:'errors',olderCount:old.length,recentCount:recent2.length}
    }
    return {signal:'forming',oldRate:null,newRate:null,basis:'insufficient'}
  }
  function trendPatterns(errors){
    var dated=errors.filter(function(a){return a._date}).slice().sort(function(a,b){return a._date-b._date});
    if(dated.length<4)return {durable:[],emerging:[],improving:[]};
    var h=Math.floor(dated.length/2),older=dated.slice(0,h),recent=dated.slice(h),oa=aggregate(older),ra=aggregate(recent),all=aggregate(dated),om={},rm={};
    oa.types.forEach(function(x){om[x.id]=x});ra.types.forEach(function(x){rm[x.id]=x});
    var dur=[],em=[],imp=[];
    all.types.forEach(function(t){
      var op=older.length?n(om[t.id]&&om[t.id].count)/older.length:0,np=recent.length?n(rm[t.id]&&rm[t.id].count)/recent.length:0,delta=np-op;
      var item={id:t.id,name:t.name,icon:t.icon,count:t.count,yearCount:t.yearCount,delta:delta,oldShare:op,newShare:np};
      if(t.yearCount>=2&&t.count>=3)dur.push(item);
      if(delta>=.12&&n(rm[t.id]&&rm[t.id].count)>=2)em.push(item);
      if(delta<=-.12&&n(om[t.id]&&om[t.id].count)>=2)imp.push(item)
    });
    dur.sort(function(a,b){return b.yearCount-a.yearCount||b.count-a.count});
    em.sort(function(a,b){return b.delta-a.delta||b.count-a.count});
    imp.sort(function(a,b){return a.delta-b.delta||b.count-a.count});
    return {durable:dur,emerging:em,improving:imp}
  }
  function thenNow(errors){
    var dated=errors.filter(function(a){return a._date}).slice().sort(function(a,b){return a._date-b._date});
    if(dated.length<4)return {then:[],now:[],thenName:'Still forming',nowName:'Still forming',copy:'More dated art-error history is needed before a meaningful earlier-versus-recent comparison can be made.'};
    var size=Math.max(2,Math.ceil(dated.length/3)),then=dated.slice(0,size),now=dated.slice(-size),ta=aggregate(then),na=aggregate(now),tn=ta.types[0]?ta.types[0].name:'No dominant type',nn=na.types[0]?na.types[0].name:'No dominant type';
    var copy=tn===nn?(tn+' remains the most common issue type from the earliest recorded slice through the most recent slice.'):('Earlier issues were led by '+tn.toLowerCase()+', while the most recent slice is led by '+nn.toLowerCase()+'.');
    return {then:then,now:now,thenName:tn,nowName:nn,copy:copy}
  }
  function concentration(errors,map){
    var orders={},customers={};
    errors.forEach(function(a){
      var so=String(a.so||'').trim(),ok=normSO(so),o=matchOrder(a,map);
      if(ok){
        var ox=orders[ok]||(orders[ok]={name:so||ok,count:0,rows:[],order:o});
        ox.count++;ox.rows.push(a)
      }
      var cust=o&&o.customer?String(o.customer).trim():'';
      if(cust){
        var ck=normText(cust),cx=customers[ck]||(customers[ck]={name:cust,count:0,rows:[],value:0});
        cx.count++;cx.rows.push(a);cx.value+=n(o.total)
      }
    });
    return {
      orders:Object.keys(orders).map(function(k){return orders[k]}).filter(function(x){return x.count>=2}).sort(function(a,b){return b.count-a.count}),
      customers:Object.keys(customers).map(function(k){return customers[k]}).filter(function(x){return x.count>=2}).sort(function(a,b){return b.count-a.count})
    }
  }
  function errorPairs(errors){
    var map={};
    errors.forEach(function(a){
      var keys=['type:'+String(a.type||'other')].concat((a._roots||[]).map(function(r){return 'root:'+r})).sort();
      for(var i=0;i<keys.length;i++)for(var j=i+1;j<keys.length;j++){
        var k=keys[i]+'|'+keys[j],x=map[k]||(map[k]={keys:[keys[i],keys[j]],count:0});x.count++
      }
    });
    return Object.keys(map).map(function(k){return map[k]}).filter(function(x){return x.count>=2}).sort(function(a,b){return b.count-a.count})
  }
  function pairName(k){
    var p=String(k).split(':');
    if(p[0]==='type')return typeLabel(p[1]);
    var r=rootDef(p[1]);return r?r.name:p[1]
  }
  function preventionFor(g){
    var out=[],topType=g.life.types[0]||null,topRoot=g.life.roots[0]||null;
    if(topType){
      var p=PREVENTION[topType.id]||PREVENTION.other;
      out.push({primary:true,label:'Highest-value prevention checkpoint',title:p.title,copy:p.copy+' This recommendation is driven by your most common recorded issue type: '+topType.name+'.'})
    }
    if(topRoot&&(!topType||topRoot.id!==topType.id)){
      var key=topRoot.id==='missing_info'?'missing_info_root':topRoot.id,p2=PREVENTION[key]||PREVENTION.other;
      out.push({primary:false,label:'Root-cause prevention clue',title:p2.title,copy:p2.copy+' This is based on the most common transparent description theme: '+topRoot.name+'.'})
    }
    if(g.concentration.orders.length){
      out.push({primary:false,label:'Repeat-order control',title:'Pause on orders with a prior art issue',copy:'When a sales order or order family has already generated an art error, add an explicit second review before the next art submission or revision.'})
    }
    if(!out.length)out.push({primary:true,label:'Maintain the clean process',title:'Keep using the workflow that is producing a clean record',copy:'No recurring lifetime art-error pattern is currently strong enough to require a targeted prevention change.'});
    return out.slice(0,3)
  }
  function keyForDate(d,level){
    if(!d)return null;
    var y=d.getFullYear(),m=d.getMonth()+1;
    if(level==='year')return {key:String(y),label:String(y),order:y};
    if(level==='quarter'){var q=Math.floor((m-1)/3)+1;return {key:y+'-Q'+q,label:'Q'+q+' '+y,order:y*10+q}}
    if(level==='month')return {key:y+'-'+String(m).padStart(2,'0'),label:d.toLocaleString('en-US',{month:'short',year:'numeric'}),order:y*100+m};
    var sun=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);sun.setDate(d.getDate()-d.getDay());
    return {key:iso(sun),label:'Wk of '+sun.toLocaleString('en-US',{month:'short',day:'numeric'}),order:sun.getTime()}
  }
  function bucketStats(errors,orders,level){
    var map={};
    function ensure(meta){return map[meta.key]||(map[meta.key]={key:meta.key,label:meta.label,order:meta.order,errors:[],orders:[]})}
    errors.forEach(function(a){var meta=keyForDate(a._date,level);if(meta)ensure(meta).errors.push(a)});
    orders.forEach(function(o){var meta=keyForDate(o._date,level);if(meta)ensure(meta).orders.push(o)});
    return Object.keys(map).map(function(k){
      var x=map[k],a=aggregate(x.errors),rate=x.orders.length?x.errors.length/x.orders.length*100:null;
      return {key:x.key,label:x.label,order:x.order,errors:x.errors.length,orders:x.orders.length,rate:rate,top:a.types[0]?a.types[0].name:'—'}
    }).sort(function(a,b){return b.order-a.order})
  }
  function selectedRows(errors,orders,ctx){
    if(ctx.selected){
      var ek=ctx.selected.key,s=dval(ctx.selected.start),e=dval(ctx.selected.end);
      return {
        label:ctx.selected.label||ctx.selected.key,
        errors:errors.filter(function(a){return a.weekKey===ek||(a._date&&s&&e&&a._date>=s&&a._date<=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999))}),
        orders:orders.filter(function(o){return o.effWeekKey===ek||o.weekKey===ek||(o._date&&s&&e&&o._date>=s&&o._date<=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999))})
      }
    }
    return {
      label:ctx.q+' '+ctx.year,
      errors:errors.filter(function(a){return String(a.yr||'')===String(ctx.year)&&String(a.q||'')===String(ctx.q)}),
      orders:orders.filter(function(o){
        var d=o._date;return d&&d.getFullYear()===ctx.year&&('Q'+(Math.floor(d.getMonth()/3)+1))===ctx.q
      })
    }
  }
  function isSelectedBucket(x,level,ctx){
    if(level==='year')return x.key===String(ctx.year);
    if(level==='quarter')return x.key===String(ctx.year)+'-'+ctx.q;
    if(level==='month'&&ctx.month){
      var md=new Date(ctx.month+' 1, '+ctx.year);if(!isNaN(md))return x.key===ctx.year+'-'+String(md.getMonth()+1).padStart(2,'0')
    }
    if(level==='week'&&ctx.selected){
      var sd=dval(ctx.selected.start);if(sd){var sun=new Date(sd);sun.setDate(sd.getDate()-sd.getDay());return x.key===iso(sun)}
    }
    return false
  }
  function cleanPeriods(buckets){
    return buckets.filter(function(x){return x.orders>0&&x.errors===0}).length
  }
  function bestQuarter(buckets){
    var eligible=buckets.filter(function(x){return x.orders>=5});
    if(!eligible.length)eligible=buckets.filter(function(x){return x.orders>0});
    return eligible.sort(function(a,b){
      var ar=a.rate==null?999:a.rate,br=b.rate==null?999:b.rate;return ar-br||b.orders-a.orders
    })[0]||null
  }
  function identity(g){
    if(!g.errors.length)return {title:'Your recorded art-quality history is clean',copy:'No art errors are currently assigned to your profile. The prevention center will continue monitoring future orders for repeated types, root-cause themes, and linked customer impact.',tone:'good'};
    var top=g.life.types[0],rate=g.errorRate,trend=g.trend.signal,pieces=[];
    if(rate!=null)pieces.push('Your recorded lifetime art-error rate is '+rate.toFixed(1)+' per 100 primary orders.');
    else pieces.push('You have '+g.errors.length+' recorded art error'+(g.errors.length===1?'':'s')+'.');
    if(top)pieces.push('The most common issue type is '+top.name.toLowerCase()+'.');
    if(trend==='improving')pieces.push('Recent order-based issue rate is lower than the earlier half of your recorded history.');
    else if(trend==='worsening')pieces.push('Recent order-based issue rate is higher than the earlier half of your recorded history, so the newest pattern deserves attention.');
    else if(trend==='stable')pieces.push('The recent issue rate is broadly stable versus the earlier half of your recorded history.');
    var title=trend==='improving'?'Your art-quality trend is improving':trend==='worsening'?'Recent art-error frequency deserves attention':top?('Your highest-value prevention opportunity is '+top.name.toLowerCase()):'Your art-quality pattern is still forming';
    return {title:title,copy:pieces.join(' '),tone:trend==='improving'?'good':trend==='worsening'?'risk':'warn'}
  }
  function periodStory(g){
    var p=g.period,lifeTop=g.life.types[0]||null,pa=aggregate(p.errors),pt=pa.types[0]||null,rate=p.orders.length?p.errors.length/p.orders.length*100:null;
    if(!p.errors.length)return {title:'No art errors are recorded in the selected period',copy:p.orders.length?('The selected period contains '+p.orders.length+' recorded primary order'+(p.orders.length===1?'':'s')+' and no matching art errors.'):('No art errors are recorded for '+p.label+'. Order history is also unavailable or empty for this selected period.')};
    var pieces=['The selected period contains '+p.errors.length+' art error'+(p.errors.length===1?'':'s')+'.'];
    if(rate!=null)pieces.push('That equals '+rate.toFixed(1)+' errors per 100 recorded primary orders for the period.');
    if(pt&&lifeTop){
      if(pt.id===lifeTop.id)pieces.push(pt.name+' is also your lifetime #1 issue type, so this period repeats the long-term pattern.');
      else pieces.push(pt.name+' leads this period, differing from your lifetime #1 issue type of '+lifeTop.name.toLowerCase()+'.');
    }
    return {title:pt?('This period is being defined by '+pt.name.toLowerCase()):'The selected period contains art-error activity',copy:pieces.join(' ')}
  }
  function build(){
    var ctx=context(),errors=repErrors(),orders=repOrders(),omap=orderMaps(orders);
    var life=aggregate(errors),streaks=currentAndLongestCleanStreak(orders,errors),trend=splitTrend(orders,errors),patterns=trendPatterns(errors),evo=thenNow(errors),conc=concentration(errors,omap),pairs=errorPairs(errors);
    var linkedCreditRows=[],linkedCreditValue=0,matchedErrors=0,affectedOrderValue=0;
    errors.forEach(function(a){
      var o=matchOrder(a,omap);if(o){matchedErrors++;affectedOrderValue+=n(o.total)}
      var cs=linkedCredits(a);if(cs.length){linkedCreditRows=linkedCreditRows.concat(cs);linkedCreditValue+=cs.reduce(function(s,c){return s+n(c.amount)},0)}
    });
    var errorRate=orders.length?errors.length/orders.length*100:null,period=selectedRows(errors,orders,ctx);
    var g={
      ctx:ctx,errors:errors,orders:orders,omap:omap,life:life,streaks:streaks,trend:trend,patterns:patterns,evolution:evo,concentration:conc,pairs:pairs,
      linkedCreditRows:linkedCreditRows,linkedCreditValue:linkedCreditValue,matchedErrors:matchedErrors,affectedOrderValue:affectedOrderValue,errorRate:errorRate,period:period
    };
    g.yearBuckets=bucketStats(errors,orders,'year');
    g.quarterBuckets=bucketStats(errors,orders,'quarter');
    g.monthBuckets=bucketStats(errors,orders,'month');
    g.weekBuckets=bucketStats(errors,orders,'week');
    g.cleanWeeks=cleanPeriods(g.weekBuckets);g.cleanMonths=cleanPeriods(g.monthBuckets);g.cleanQuarters=cleanPeriods(g.quarterBuckets);g.bestQuarter=bestQuarter(g.quarterBuckets);
    g.identity=identity(g);g.periodStory=periodStory(g);g.prevention=preventionFor(g);
    return g
  }

  function sectionHead(kick,title,note){return '<div class="rp2-ae-section-head"><div><div class="rp2-ae-section-kick">'+kick+'</div><div class="rp2-ae-section-title">'+title+'</div></div><div class="rp2-ae-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-ae-kpi"><div class="rp2-ae-kpi-label">'+esc(label)+'</div><div class="rp2-ae-kpi-value">'+value+'</div><div class="rp2-ae-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-ae-tabs-wrap"><div class="rp2-ae-tabs">'+TABS.map(function(t){return '<button class="rp2-ae-tab '+(t.id===active?'active':'')+'" onclick="_rp2ArtSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function insight(icon,label,title,copy,tone){return '<div class="rp2-ae-insight '+(tone||'')+'"><div class="rp2-ae-insight-icon">'+icon+'</div><div class="rp2-ae-insight-label">'+esc(label)+'</div><div class="rp2-ae-insight-title">'+esc(title)+'</div><div class="rp2-ae-insight-copy">'+esc(copy)+'</div></div>'}
  function mixBars(rows){
    if(!rows.length)return '<div class="rp2-ae-empty"><strong>No art-error types to display</strong><span>The lifetime type mix will appear as art errors are recorded.</span></div>';
    var max=rows[0].count||1;
    return '<div class="rp2-ae-mix">'+rows.map(function(x){return '<div class="rp2-ae-mix-row"><div class="rp2-ae-mix-top"><span>'+x.icon+' '+esc(x.name)+' · '+x.yearCount+' year'+(x.yearCount===1?'':'s')+'</span><strong>'+x.count+'</strong></div><div class="rp2-ae-bar"><span style="width:'+Math.max(8,Math.round(x.count/max*100))+'%"></span></div></div>'}).join('')+'</div>'
  }
  function trendCard(kind,list){
    var x=list[0];
    if(!x){
      var msg=kind==='Durable pattern'?'No issue type has enough cross-year recurrence to call durable yet.':kind==='Emerging pattern'?'No recent issue type is increasing strongly enough to call emerging yet.':'No older issue type has declined strongly enough to call a clear improvement yet.';
      return insight(kind==='Durable pattern'?'🧱':kind==='Emerging pattern'?'↗':'↘',kind,'Still forming',msg,kind==='Improving area'?'good':'')
    }
    var copy=kind==='Durable pattern'?(x.name+' appears across '+x.yearCount+' years and '+x.count+' recorded errors.'):kind==='Emerging pattern'?(x.name+' makes up a much larger share of the newer half of your error history than the older half.'):(x.name+' was more common in the older half of your error history and now represents a smaller share.');
    return insight(x.icon,kind,x.name,copy,kind==='Emerging pattern'?'risk':kind==='Improving area'?'good':'warn')
  }
  function preventionCards(g){
    return '<div class="rp2-ae-prevention">'+g.prevention.map(function(p){return '<div class="rp2-ae-prevent-card '+(p.primary?'primary':'')+'"><div class="rp2-ae-prevent-label">'+esc(p.label)+'</div><div class="rp2-ae-prevent-title">'+esc(p.title)+'</div><div class="rp2-ae-prevent-copy">'+esc(p.copy)+'</div></div>'}).join('')+'</div>'
  }
  function concentrationList(g){
    var items=[];
    g.concentration.customers.slice(0,5).forEach(function(x){items.push({icon:'🏢',name:x.name,copy:x.count+' art errors tied to orders for this customer',value:x.count+' errors'})});
    g.concentration.orders.slice(0,5).forEach(function(x){items.push({icon:'📦',name:x.name,copy:x.count+' art errors tied to the same sales order or order family',value:x.count+' errors'})});
    if(!items.length)return '<div class="rp2-ae-empty"><strong>No repeated customer or sales-order concentration detected</strong><span>The current lifetime errors are dispersed rather than repeating around the same customer or order.</span></div>';
    return '<div class="rp2-ae-pattern-list">'+items.map(function(x){return '<div class="rp2-ae-pattern"><div class="rp2-ae-pattern-icon">'+x.icon+'</div><div class="rp2-ae-pattern-name">'+esc(x.name)+'<small>'+esc(x.copy)+'</small></div><div class="rp2-ae-pattern-val">'+esc(x.value)+'</div></div>'}).join('')+'</div>'
  }
  function pairList(g){
    if(!g.pairs.length)return '<div class="rp2-ae-empty"><strong>No repeated issue combinations yet</strong><span>When the same error type and root-cause clue repeatedly appear together, the connection will show here.</span></div>';
    return '<div class="rp2-ae-pattern-list">'+g.pairs.slice(0,7).map(function(p){return '<div class="rp2-ae-pattern"><div class="rp2-ae-pattern-icon">↔</div><div class="rp2-ae-pattern-name">'+esc(pairName(p.keys[0])+' + '+pairName(p.keys[1]))+'<small>These signals repeatedly occur in the same recorded art error.</small></div><div class="rp2-ae-pattern-val">'+p.count+'×</div></div>'}).join('')+'</div>'
  }
  function periodExplorer(g){
    var p=g.period,pa=aggregate(p.errors),pt=pa.types[0]||null,pr=p.orders.length?p.errors.length/p.orders.length*100:null;
    return sectionHead('Period drill-down','Explore the selected period','The lifetime quality story above never disappears. The Year / Quarter / Month / Week selectors control this lower comparison section.')
      +'<div class="rp2-ae-period"><div class="rp2-ae-period-grid"><div class="rp2-ae-period-story"><div class="rp2-ae-period-kick">'+esc(p.label)+'</div><div class="rp2-ae-period-title">'+esc(g.periodStory.title)+'</div><div class="rp2-ae-period-copy">'+esc(g.periodStory.copy)+'</div></div>'
      +'<div class="rp2-ae-period-stat"><span>Art errors</span><strong>'+p.errors.length+'</strong><small>'+(g.errors.length?(Math.round(p.errors.length/g.errors.length*100)+'% of lifetime errors'):'No lifetime errors')+'</small></div>'
      +'<div class="rp2-ae-period-stat"><span>Orders</span><strong>'+p.orders.length+'</strong><small>Recorded primary orders in period</small></div>'
      +'<div class="rp2-ae-period-stat"><span>Error rate</span><strong>'+(pr==null?'—':pr.toFixed(1))+'</strong><small>'+(pr==null?'Order history unavailable':'errors per 100 orders')+'</small></div>'
      +'<div class="rp2-ae-period-stat"><span>Top issue</span><strong>'+esc(pt?pt.name:'—')+'</strong><small>'+(pt?(pt.count+' matching error'+(pt.count===1?'':'s')):'No period errors')+'</small></div>'
      +'</div></div>'
  }
  function breakCard(title,level,buckets,g){
    var rows=buckets.slice(0,15);
    return '<div class="rp2-ae-break-card"><div class="rp2-ae-break-title">'+esc(title)+'<span>'+rows.length+' periods</span></div><div class="rp2-ae-break-list">'
      +(rows.length?rows.map(function(x){
        return '<div class="rp2-ae-break-row '+(isSelectedBucket(x,level,g.ctx)?'active':'')+'"><div class="rp2-ae-break-main">'+esc(x.label)+'<small>'+x.errors+' errors · '+x.orders+' orders · '+esc(x.top)+'</small></div><div class="rp2-ae-break-val">'+(x.rate==null?'—':x.rate.toFixed(1))+' /100</div></div>'
      }).join(''):'<div class="rp2-ae-empty"><strong>No dated history</strong><span>No records are available for this level.</span></div>')
      +'</div></div>'
  }
  function breakdown(g){
    return sectionHead('Historical breakdown','Lifetime → Year → Quarter → Month → Week','The selected path is highlighted while the complete lifetime quality history stays visible for context.')
      +'<div class="rp2-ae-breakdown">'+breakCard('By Year','year',g.yearBuckets,g)+breakCard('By Quarter','quarter',g.quarterBuckets,g)+breakCard('By Month','month',g.monthBuckets,g)+breakCard('By Week','week',g.weekBuckets,g)+'</div>'
  }
  function cleanCards(g){
    var bq=g.bestQuarter;
    return '<div class="rp2-ae-streak-grid">'
      +'<div class="rp2-ae-streak"><div class="rp2-ae-streak-icon">🔥</div><div class="rp2-ae-streak-label">Current clean-order streak</div><div class="rp2-ae-streak-value">'+(g.streaks.current==null?'—':g.streaks.current)+'</div><div class="rp2-ae-streak-copy">'+(g.streaks.current==null?'Primary-order history is unavailable.':'Consecutive recorded primary orders since the most recent order matched to an art error.')+'</div></div>'
      +'<div class="rp2-ae-streak"><div class="rp2-ae-streak-icon">🏆</div><div class="rp2-ae-streak-label">Longest clean-order streak</div><div class="rp2-ae-streak-value">'+(g.streaks.longest==null?'—':g.streaks.longest)+'</div><div class="rp2-ae-streak-copy">'+(g.streaks.longest==null?'Primary-order history is unavailable.':'Best run of consecutive recorded primary orders without a matching art error.')+'</div></div>'
      +'<div class="rp2-ae-streak"><div class="rp2-ae-streak-icon">📅</div><div class="rp2-ae-streak-label">Error-free periods</div><div class="rp2-ae-streak-value">'+g.cleanMonths+' mo</div><div class="rp2-ae-streak-copy">'+g.cleanWeeks+' order-active weeks and '+g.cleanQuarters+' order-active quarters are recorded with zero art errors.</div></div>'
      +'<div class="rp2-ae-streak"><div class="rp2-ae-streak-icon">🥇</div><div class="rp2-ae-streak-label">Best quality quarter</div><div class="rp2-ae-streak-value">'+(bq?esc(bq.label):'—')+'</div><div class="rp2-ae-streak-copy">'+(bq?((bq.rate==null?'Rate unavailable':bq.rate.toFixed(1)+' errors per 100 orders')+' · '+bq.orders+' recorded orders.'):'No quarter with recorded order history yet.')+'</div></div>'
      +'</div>'
  }
  function errorId(a){return encodeURIComponent(String(a&&a.id!=null?a.id:((a&&a.weekKey||'')+'|'+(a&&a.so||'')+'|'+(a&&a.type||'')+'|'+(a&&a.desc||''))))}
  function findError(g,encoded){
    var id=decodeURIComponent(encoded||'');
    return g.errors.filter(function(a){return String(a.id!=null?a.id:((a.weekKey||'')+'|'+(a.so||'')+'|'+(a.type||'')+'|'+(a.desc||'')))===id})[0]||null
  }
  function errorRow(a,g){
    var o=matchOrder(a,g.omap),cs=linkedCredits(a),roots=(a._roots||[]),search=(a.so+' '+a.desc+' '+typeLabel(a.type)+' '+roots.map(function(id){return rootDef(id).name}).join(' ')+' '+(o&&o.customer||'')).toLowerCase();
    return '<button class="rp2-ae-row" data-ae501="1" data-type="'+esc(String(a.type||'other'))+'" data-root="'+esc(roots.join(','))+'" data-credit="'+(cs.length?'yes':'no')+'" data-search="'+esc(search)+'" onclick="_rp2ArtOpen(\''+errorId(a)+'\')">'
      +'<div class="rp2-ae-cell">'+fmtDate(a._date||a.date)+'</div>'
      +'<div class="rp2-ae-cell strong">'+esc(a.so||'No SO recorded')+'</div>'
      +'<div><span class="rp2-ae-tag">'+typeIcon(a.type)+' '+esc(typeLabel(a.type))+'</span></div>'
      +'<div class="rp2-ae-cell">'+esc(o&&o.customer?o.customer:(a.desc||'No description recorded'))+'</div>'
      +'<div class="rp2-ae-cell">'+(o?('<span class="rp2-ae-tag link">Order '+money(o.total)+'</span>'):'No order match')+'</div>'
      +'<div class="rp2-ae-cell right">'+(cs.length?('<span class="rp2-ae-tag credit">'+cs.length+' credit'+(cs.length===1?'':'s')+'</span>'):'—')+'</div>'
      +'</button>'
  }
  function historyView(g){
    var types=g.life.types,roots=g.life.roots;
    return sectionHead('Lifetime error history','Search every recorded art error assigned to this rep','Filter by actual issue type, transparent root-cause clue, credit-memo connection, or free-text search.')
      +'<div class="rp2-ae-filterbar">'
      +'<input id="rp2-ae-search" type="search" placeholder="Search SO, customer, description…" oninput="_rp2ArtApplyFilters()">'
      +'<select id="rp2-ae-type" onchange="_rp2ArtApplyFilters()"><option value="">All issue types</option>'+types.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>'}).join('')+'</select>'
      +'<select id="rp2-ae-root" onchange="_rp2ArtApplyFilters()"><option value="">All root-cause clues</option>'+roots.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>'}).join('')+'</select>'
      +'<select id="rp2-ae-credit" onchange="_rp2ArtApplyFilters()"><option value="">Any credit impact</option><option value="yes">Linked credit memo</option><option value="no">No linked credit memo</option></select>'
      +'<div id="rp2-ae-count" class="rp2-ae-filtercount">'+g.errors.length+' shown</div></div>'
      +(g.errors.length?'<div class="rp2-ae-feed">'+g.errors.map(function(a){return errorRow(a,g)}).join('')+'</div>':'<div class="rp2-ae-empty"><strong>No art errors are assigned to this rep</strong><span>The lifetime history will populate automatically as manager-side art-error records are synced or entered.</span></div>')
  }
  function patternsView(g){
    return sectionHead('Pattern intelligence','What repeats, what is emerging, and what is improving','The trend engine compares the older and newer halves of dated lifetime error history. These are prevention clues—not permanent labels.')
      +'<div class="rp2-ae-grid-3">'+trendCard('Durable pattern',g.patterns.durable)+trendCard('Emerging pattern',g.patterns.emerging)+trendCard('Improving area',g.patterns.improving)+'</div>'
      +sectionHead('Prevention coaching','The checkpoints most likely to prevent the next issue','Recommendations are tied to the rep’s actual most common issue type, description themes, and repeat-order patterns.')
      +'<div class="rp2-ae-grid-2"><div class="rp2-ae-panel"><div class="rp2-ae-panel-title">Recommended prevention checkpoints</div><div class="rp2-ae-panel-sub">Start with the first card; it is the highest-value prevention opportunity identified from lifetime history.</div>'+preventionCards(g)+'</div><div class="rp2-ae-panel"><div class="rp2-ae-panel-title">Repeated signal combinations</div><div class="rp2-ae-panel-sub">Issue types and root-cause clues that repeatedly appear together.</div>'+pairList(g)+'</div></div>'
      +sectionHead('Customer & order concentration','Where quality issues are clustering','Repeated concentration can indicate a special customer workflow, a complicated order family, or a missing repeat-order checkpoint.')
      +'<div class="rp2-ae-panel">'+concentrationList(g)+'</div>'
  }
  function streaksView(g){
    return sectionHead('Clean streaks & improvement','Measure what is going right too','Quality intelligence should reward clean execution, not only count failures. Streaks use uploaded primary-order history matched by sales-order number.')
      +cleanCards(g)
      +sectionHead('Lifetime trend','Earlier versus recent issue frequency','When enough primary-order history exists, the trend compares errors per 100 orders in the older half versus the newer half.')
      +'<div class="rp2-ae-grid-3">'
      +insight(g.trend.signal==='improving'?'↘':g.trend.signal==='worsening'?'↗':'→','Quality trend',g.trend.signal==='forming'?'Still forming':g.trend.signal.charAt(0).toUpperCase()+g.trend.signal.slice(1),g.trend.basis==='orders'?('Earlier half: '+g.trend.oldRate.toFixed(1)+' errors per 100 orders. Recent half: '+g.trend.newRate.toFixed(1)+' per 100 orders.'):'More order history is needed for a reliable rate comparison.',g.trend.signal==='improving'?'good':g.trend.signal==='worsening'?'risk':'warn')
      +insight('📅','Error-free months',String(g.cleanMonths),g.cleanMonths+' order-active month'+(g.cleanMonths===1?' is':'s are')+' recorded with zero art errors.','good')
      +insight('🏅','Best quality quarter',g.bestQuarter?g.bestQuarter.label:'Still forming',g.bestQuarter?((g.bestQuarter.rate==null?'Rate unavailable':g.bestQuarter.rate.toFixed(1)+' errors per 100 orders')+' across '+g.bestQuarter.orders+' recorded orders.'):'No quarter with order history is available yet.','good')
      +'</div>'
      +breakdown(g)
  }
  function periodsView(g){return periodExplorer(g)+breakdown(g)}
  function overviewView(g){
    return sectionHead('Lifetime art-quality identity','Understand the permanent pattern before zooming into one week','Every art error assigned to the rep contributes to the lifetime intelligence engine. Time selectors only control the lower selected-period drill-down.')
      +'<div class="rp2-ae-summary"><div class="rp2-ae-summary-label">Lifetime quality interpretation</div><div class="rp2-ae-summary-title">'+esc(g.identity.title)+'</div><div class="rp2-ae-summary-copy">'+esc(g.identity.copy)+'</div></div>'
      +sectionHead('Lifetime error DNA','What types of issues recur across the full recorded history','Actual manager-side issue types are preserved. The second panel adds transparent description-based root-cause clues without reclassifying the original record.')
      +'<div class="rp2-ae-grid-2"><div class="rp2-ae-panel"><div class="rp2-ae-panel-title">Recorded issue-type fingerprint</div><div class="rp2-ae-panel-sub">Original issue types exactly as stored in the Art Errors system.</div>'+mixBars(g.life.types)+'</div><div class="rp2-ae-panel"><div class="rp2-ae-panel-title">Root-cause clues</div><div class="rp2-ae-panel-sub">Keyword groupings from the original description. One error can match more than one clue.</div>'+mixBars(g.life.roots)+'</div></div>'
      +sectionHead('Pattern intelligence','Durable, emerging, and improving issue types','The comparison uses the older and newer halves of dated lifetime history.')
      +'<div class="rp2-ae-grid-3">'+trendCard('Durable pattern',g.patterns.durable)+trendCard('Emerging pattern',g.patterns.emerging)+trendCard('Improving area',g.patterns.improving)+'</div>'
      +sectionHead('Then vs now','How the error pattern has changed','The earliest third of dated art-error history is compared with the most recent third.')
      +'<div class="rp2-ae-then-now"><div class="rp2-ae-era"><div class="rp2-ae-era-label">Then</div><div class="rp2-ae-era-title">'+esc(g.evolution.thenName)+'</div><div class="rp2-ae-era-copy">'+g.evolution.then.length+' early error'+(g.evolution.then.length===1?'':'s')+' define the earliest recorded slice.</div></div><div class="rp2-ae-arrow">→</div><div class="rp2-ae-era"><div class="rp2-ae-era-label">Now</div><div class="rp2-ae-era-title">'+esc(g.evolution.nowName)+'</div><div class="rp2-ae-era-copy">'+esc(g.evolution.copy)+'</div></div></div>'
      +sectionHead('Prevention plan','Turn the pattern into a repeatable checkpoint','The goal is not to relive old errors. It is to identify the exact workflow moment most likely to prevent the next one.')
      +'<div class="rp2-ae-grid-2"><div class="rp2-ae-panel"><div class="rp2-ae-panel-title">Highest-value prevention checkpoints</div>'+preventionCards(g)+'</div><div class="rp2-ae-panel"><div class="rp2-ae-panel-title">Customer & order concentration</div><div class="rp2-ae-panel-sub">Repeated issues around the same customer or sales order.</div>'+concentrationList(g)+'</div></div>'
      +sectionHead('Lifetime trajectory','Error count and order-normalized rate over time','Annual bars show art-error count. The line shows errors per 100 recorded primary orders when annual order history is available.')
      +'<div class="rp2-ae-panel"><div class="rp2-ae-chart"><canvas id="rp2-ae-chart"></canvas></div></div>'
      +periodExplorer(g)
      +breakdown(g)
  }
  function drawer(g){
    if(!window._rp2ArtOpenId)return '';
    var a=findError(g,window._rp2ArtOpenId);if(!a)return '';
    var o=matchOrder(a,g.omap),cs=linkedCredits(a),creditValue=cs.reduce(function(s,c){return s+n(c.amount)},0),roots=a._roots||[],topRoot=rootDef(roots[0]||'other'),p=PREVENTION[(a.type&&PREVENTION[a.type])?a.type:(topRoot.id==='missing_info'?'missing_info_root':topRoot.id)]||PREVENTION.other;
    var sameType=g.errors.filter(function(x){return x.type===a.type}).length,sameSO=g.errors.filter(function(x){return normSO(x.so)===normSO(a.so)&&normSO(a.so)}).length;
    return '<div class="rp2-ae-drawer-wrap" onclick="if(event.target===this)_rp2ArtClose()"><aside class="rp2-ae-drawer">'
      +'<div class="rp2-ae-drawer-head"><div><div class="rp2-ae-drawer-kick">Art error detail · '+esc(typeLabel(a.type))+'</div><div class="rp2-ae-drawer-title">'+esc(a.so||'No sales order recorded')+'</div><div class="rp2-ae-drawer-sub">'+fmtDate(a._date||a.date)+' · Assigned to '+esc(g.rep||_rp2.rep)+'</div></div><button class="rp2-ae-close" onclick="_rp2ArtClose()">×</button></div>'
      +'<div class="rp2-ae-detail-kpis">'
      +'<div class="rp2-ae-detail-kpi"><span>Issue type</span><strong>'+esc(typeLabel(a.type))+'</strong></div>'
      +'<div class="rp2-ae-detail-kpi"><span>Lifetime repeats</span><strong>'+sameType+'</strong></div>'
      +'<div class="rp2-ae-detail-kpi"><span>Same order repeats</span><strong>'+sameSO+'</strong></div>'
      +'<div class="rp2-ae-detail-kpi"><span>Linked credit impact</span><strong>'+money(creditValue)+'</strong></div>'
      +'</div>'
      +'<div class="rp2-ae-detail-section"><div class="rp2-ae-detail-title">Original issue description</div><div class="rp2-ae-detail-copy">'+esc(a.desc||'No description was recorded for this art error.')+'</div></div>'
      +'<div class="rp2-ae-detail-section"><div class="rp2-ae-detail-title">Transparent root-cause clues</div><div class="rp2-ae-tags">'+roots.map(function(id){var r=rootDef(id);return '<span class="rp2-ae-tag">'+r.icon+' '+esc(r.name)+'</span>'}).join('')+'</div><div class="rp2-ae-detail-copy">These clues are keyword groupings from the original description. They do not overwrite the manager-entered issue type.</div></div>'
      +'<div class="rp2-ae-detail-section"><div class="rp2-ae-detail-title">Prevention recommendation</div><div class="rp2-ae-detail-card"><strong>'+esc(p.title)+'</strong><span>'+esc(p.copy)+'</span></div></div>'
      +'<div class="rp2-ae-detail-section"><div class="rp2-ae-detail-title">Linked order context</div>'
      +(o?('<div class="rp2-ae-detail-card"><strong>'+esc(o.orderNum||o.base||'Order')+' · '+money(o.total)+'</strong><span>'+esc(o.customer||'Customer not recorded')+' · '+esc(o.orderType||'Order type not recorded')+' · '+fmtDate(o._date||o.orderDate)+'.</span></div>'):'<div class="rp2-ae-detail-copy">No uploaded primary order matched this recorded sales-order number.</div>')
      +'</div>'
      +'<div class="rp2-ae-detail-section"><div class="rp2-ae-detail-title">Linked credit memos</div>'
      +(cs.length?cs.map(function(c){return '<div class="rp2-ae-detail-card"><strong>'+money(c.amount)+' · '+esc(c.fault||'Cause not recorded')+'</strong><span>'+esc(c.desc||'No credit memo description recorded')+'</span></div>'}).join(''):'<div class="rp2-ae-detail-copy">No credit memo currently matches this sales-order number.</div>')
      +'</div>'
      +'<div class="rp2-ae-detail-section"><div class="rp2-ae-detail-copy">Data note: issue type and original description come from the manager-side Art Errors record. Customer, order value, and credit impact appear only when matching order or credit-memo identifiers are available.</div></div>'
      +'</aside></div>'
  }

  window._rp2ArtSetTab=function(id){
    window._rp2ArtTab=id;window._rp2ArtOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ArtV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2ArtDraw();window._rp2ArtApplyFilters()}catch(e){}},0)
  };
  window._rp2ArtOpen=function(id){
    window._rp2ArtOpenId=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ArtV2();
    setTimeout(function(){try{window._rp2ArtDraw();window._rp2ArtApplyFilters()}catch(e){}},0)
  };
  window._rp2ArtClose=function(){
    window._rp2ArtOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ArtV2();
    setTimeout(function(){try{window._rp2ArtDraw();window._rp2ArtApplyFilters()}catch(e){}},0)
  };
  window._rp2ArtApplyFilters=function(){
    try{
      var q=((document.getElementById('rp2-ae-search')||{}).value||'').toLowerCase().trim(),type=((document.getElementById('rp2-ae-type')||{}).value||''),root=((document.getElementById('rp2-ae-root')||{}).value||''),credit=((document.getElementById('rp2-ae-credit')||{}).value||'');
      var cards=safeArray(document.querySelectorAll?document.querySelectorAll('#rp2-page [data-ae501="1"]'):[]),shown=0;
      cards.forEach(function(card){
        var search=String(card.getAttribute('data-search')||''),ct=String(card.getAttribute('data-type')||''),cr=String(card.getAttribute('data-root')||'').split(','),cc=String(card.getAttribute('data-credit')||'');
        var ok=(!q||search.indexOf(q)>=0)&&(!type||ct===type)&&(!root||cr.indexOf(root)>=0)&&(!credit||cc===credit);
        card.style.display=ok?'grid':'none';if(ok)shown++
      });
      var count=document.getElementById('rp2-ae-count');if(count)count.textContent=shown+' shown'
    }catch(e){}
  };

  window._rp2ArtV2=function(){
    try{
      var g=build(),tab=window._rp2ArtTab,top=g.life.types[0]||null,root=g.life.roots[0]||null;
      g.rep=_rp2.rep;
      var hero='<div class="rp2-ae-hero"><div class="rp2-ae-hero-grid"><div><div class="rp2-ae-kick">Art Errors 2.0 · LIFETIME PREVENTION INTELLIGENCE · BUILD v501</div><div class="rp2-ae-title">Your art-quality history, turned into prevention</div><div class="rp2-ae-copy">Lifetime-first intelligence identifies what repeats, what is improving, where customer or order concentration exists, and which workflow checkpoint is most likely to prevent the next issue.</div><div class="rp2-ae-pills"><span class="rp2-ae-pill">'+g.errors.length+' lifetime art error'+(g.errors.length===1?'':'s')+'</span><span class="rp2-ae-pill '+g.identity.tone+'">'+(g.errorRate==null?'Order-normalized rate unavailable':g.errorRate.toFixed(1)+' errors / 100 orders')+'</span><span class="rp2-ae-pill '+(g.trend.signal==='improving'?'good':g.trend.signal==='worsening'?'risk':'warn')+'">'+esc(g.trend.signal==='forming'?'Trend still forming':g.trend.signal+' trend')+'</span></div></div>'
        +'<div class="rp2-ae-brief"><div><div class="rp2-ae-brief-label">Lifetime quality identity</div><div class="rp2-ae-brief-value">'+(top?top.icon:'✓')+'</div><div class="rp2-ae-brief-title">'+esc(g.identity.title)+'</div><div class="rp2-ae-brief-copy">'+esc(g.identity.copy)+'</div></div><div class="rp2-ae-brief-foot"><span>Current clean streak <strong>'+(g.streaks.current==null?'—':g.streaks.current)+'</strong></span><span>Linked credit impact <strong>'+money(g.linkedCreditValue)+'</strong></span></div></div></div></div>';

      var kpis='<div class="rp2-ae-kpis">'
        +kpi('Lifetime art errors',String(g.errors.length),g.yearBuckets.length+' recorded year'+(g.yearBuckets.length===1?'':'s'))
        +kpi('Errors / 100 orders',g.errorRate==null?'—':g.errorRate.toFixed(1),g.orders.length?g.orders.length+' recorded primary orders':'Primary-order history unavailable')
        +kpi('Top issue type',top?esc(top.name):'—',top?(top.count+' errors · '+top.yearCount+' years'):'No recorded issue type')
        +kpi('Top root-cause clue',root?esc(root.name):'—',root?(root.count+' matching error'+(root.count===1?'':'s')):'No description theme')
        +kpi('Current clean streak',g.streaks.current==null?'—':String(g.streaks.current),'Recorded primary orders since last matched art-error order')
        +kpi('Longest clean streak',g.streaks.longest==null?'—':String(g.streaks.longest),'Best recorded clean-order run')
        +kpi('Errors matched to orders',String(g.matchedErrors),g.errors.length?Math.round(g.matchedErrors/g.errors.length*100)+'% of lifetime errors':'No art errors')
        +kpi('Linked credit impact',money(g.linkedCreditValue),g.linkedCreditRows.length+' matching credit memo record'+(g.linkedCreditRows.length===1?'':'s'))
        +'</div>';

      var content=tab==='history'?historyView(g):tab==='patterns'?patternsView(g):tab==='streaks'?streaksView(g):tab==='periods'?periodsView(g):overviewView(g);
      return '<div class="rp2-ae-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+drawer(g)
    }catch(e){
      console.error('[Art Errors v501 render error]',e);
      return '<div class="rp2-ae-shell"><div class="rp2-ae-hero"><div class="rp2-ae-kick">Art Errors 2.0 · RECOVERY MODE</div><div class="rp2-ae-title">The art-quality engine hit a data compatibility issue</div><div class="rp2-ae-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2ArtDraw=function(){
    if(typeof Chart!=='function'||window._rp2ArtTab!=='overview')return;
    var canvas=document.getElementById('rp2-ae-chart');if(!canvas)return;
    var g=build(),years=g.yearBuckets.slice().sort(function(a,b){return a.order-b.order});
    if(_rp2.artChart){try{_rp2.artChart.destroy()}catch(e){}}
    if(!years.length)return;
    _rp2.artChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:years.map(function(x){return x.label}),datasets:[
        {type:'bar',label:'Art errors',data:years.map(function(x){return x.errors}),backgroundColor:'rgba(240,120,120,.68)',borderRadius:6,yAxisID:'errors'},
        {type:'line',label:'Errors per 100 orders',data:years.map(function(x){return x.rate}),borderColor:'#4ed6a3',pointRadius:4,tension:.25,yAxisID:'rate'}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label==='Errors per 100 orders'?(' Rate: '+Number(ctx.parsed.y||0).toFixed(1)+' / 100'):(' Art errors: '+ctx.parsed.y)}}}},
        scales:{
          x:{ticks:{color:'#8b95a7',font:{size:10}},grid:{display:false}},
          errors:{beginAtZero:true,ticks:{color:'#8b95a7',precision:0},grid:{color:'rgba(255,255,255,.05)'}},
          rate:{position:'right',beginAtZero:true,ticks:{color:'#8b95a7',callback:function(v){return v+'/100'}},grid:{display:false}}
        }
      }
    })
  };
})();
