
(function(){
  var CU_TABS=[
    {id:'overview',label:'Overview',icon:'◫'},
    {id:'top',label:'Top Accounts',icon:'★'},
    {id:'attention',label:'Needs Attention',icon:'⚠'},
    {id:'growth',label:'Growth Opportunities',icon:'↗'},
    {id:'new',label:'New Customers',icon:'＋'},
    {id:'dormant',label:'Dormant Accounts',icon:'○'}
  ];
  window._rp2CustomerTab=window._rp2CustomerTab||'overview';
  window._rp2CustomerOpenKey=window._rp2CustomerOpenKey||null;

  function n(v){return Number(v)||0}
  function esc(v){return _rp2Esc(String(v==null?'':v))}
  function money(v){return _rp2$(n(v))}
  function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
  function norm(v){return clean(v).toLowerCase().replace(/\s+/g,' ')}
  function dt(v){if(!v)return null;var d=new Date(String(v).length===10?v+'T12:00:00':v);return isNaN(d.getTime())?null:d}
  function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function daysBetween(a,b){var x=dt(a),y=dt(b);return x&&y?Math.round((y-x)/86400000):0}
  function sameCutoffPriorYear(cutoff){
    var d=dt(cutoff),p=new Date(d.getFullYear()-1,d.getMonth(),d.getDate(),12);
    return iso(p)
  }
  function startOfYear(y){return String(y)+'-01-01'}
  function displayDate(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
  function pct(v){return Math.round(n(v))+'%'}
  function selectedContext(){
    var c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null;
    if(c&&c.selected)return c;
    return {rep:_rp2.rep,selected:null,through:[],idx:0}
  }
  function orderIssues(o){
    var art=[],cm=[];
    try{if(typeof _ordArtFor==='function')art=_ordArtFor(o)||[]}catch(e){}
    try{if(typeof _ordCmFor==='function')cm=_ordCmFor(o)||[]}catch(e){}
    return {art:art.length,credits:cm.length,creditValue:cm.reduce(function(s,x){return s+n(x.amount)},0)}
  }
  function customerBuild(){
    var c=selectedContext(),rep=_rp2.rep,year=Number(getYr());
    var cutoff=c.selected&&c.selected.end?iso(dt(c.selected.end)):String(year)+'-12-31';
    var yStart=startOfYear(year),priorStart=startOfYear(year-1),priorCut=sameCutoffPriorYear(cutoff);
    var all=(S.orders||[]).filter(function(o){
      return o.rep===rep&&o.kind==='order'&&clean(o.customer)&&o.orderDate&&o.orderDate<=cutoff
    }).slice().sort(function(a,b){return String(a.orderDate).localeCompare(String(b.orderDate))});
    var by={};

    all.forEach(function(o){
      var key=norm(o.customer),x=by[key]||(by[key]={
        key:key,name:clean(o.customer),orders:[],dates:{},currentRevenue:0,priorRevenue:0,currentOrders:0,priorOrders:0,
        lifetimeRevenue:0,newFlag:false,types:{},placements:{},issues:0,artErrors:0,credits:0,creditValue:0
      });
      x.name=clean(o.customer)||x.name;
      x.orders.push(o);
      x.lifetimeRevenue+=n(o.total);
      x.dates[o.orderDate]=true;
      if(o.lastOrderDate&&o.lastOrderDate<=cutoff)x.dates[o.lastOrderDate]=true;
      if(o.orderDate>=yStart&&o.orderDate<=cutoff){x.currentRevenue+=n(o.total);x.currentOrders++;if(o.newCustomer)x.newFlag=true}
      if(o.orderDate>=priorStart&&o.orderDate<=priorCut){x.priorRevenue+=n(o.total);x.priorOrders++}
      x.types[o.orderType||'General Sale']=(x.types[o.orderType||'General Sale']||0)+n(o.total);
      x.placements[o.placement||'Unknown']=(x.placements[o.placement||'Unknown']||0)+1;
      var iq=orderIssues(o);x.issues+=iq.art+iq.credits;x.artErrors+=iq.art;x.credits+=iq.credits;x.creditValue+=iq.creditValue;
    });

    var customers=Object.keys(by).map(function(key){
      var x=by[key],dates=Object.keys(x.dates).sort(),last=dates.length?dates[dates.length-1]:'',first=dates.length?dates[0]:'';
      var intervals=[];for(var i=1;i<dates.length;i++){var dd=daysBetween(dates[i-1],dates[i]);if(dd>0&&dd<730)intervals.push(dd)}
      var cadence=intervals.length?intervals.reduce(function(s,v){return s+v},0)/intervals.length:null;
      var daysSince=last?daysBetween(last,cutoff):9999;
      var currentAov=x.currentOrders?x.currentRevenue/x.currentOrders:(x.orders.length?x.lifetimeRevenue/x.orders.length:0);
      var largest=x.orders.reduce(function(best,o){return !best||n(o.total)>n(best.total)?o:best},null);
      var typeEntries=Object.keys(x.types).map(function(k){return {name:k,value:x.types[k]}}).sort(function(a,b){return b.value-a.value});
      var typeTotal=typeEntries.reduce(function(s,z){return s+z.value},0);
      var topType=typeEntries[0]||null,topTypeShare=topType&&typeTotal>0?topType.value/typeTotal:0;
      var trend=x.priorRevenue>0?(x.currentRevenue-x.priorRevenue)/x.priorRevenue*100:(x.currentRevenue>0?100:0);
      var cadenceOverdue=!!(cadence&&daysSince>Math.max(45,cadence*1.25));
      var isNew=!!(x.newFlag||(first>=yStart&&first<=cutoff));
      var status='Stable',statusKey='core';
      if(daysSince>120){status='Dormant';statusKey='dormant'}
      else if(isNew&&daysSince<=120){status='New';statusKey='new'}
      else if(x.priorRevenue>0&&x.currentRevenue<x.priorRevenue*.75){status='Slipping';statusKey='slipping'}
      else if(cadenceOverdue||daysSince>75){status='At Risk';statusKey='risk'}
      else if(x.currentRevenue>x.priorRevenue*1.15&&x.currentRevenue>0){status='Growing';statusKey='growing'}

      var recencyScore=daysSince<=30?40:daysSince<=60?32:daysSince<=90?24:daysSince<=120?16:6;
      var trendScore=x.priorRevenue>0?(trend>=15?25:trend>=-10?20:trend>=-30?12:5):(x.currentRevenue>0?18:5);
      var repeatScore=Math.min(20,Math.max(5,x.currentOrders*4+Math.min(6,dates.length)));
      var qualityScore=Math.max(0,15-Math.min(15,x.artErrors*3+x.credits*4+x.creditValue/500));
      var health=Math.max(0,Math.min(100,recencyScore+trendScore+repeatScore+qualityScore));

      var expansion=topTypeShare>=.75&&x.currentOrders>=2;
      var segment=statusKey;
      if(statusKey==='core'&&expansion)segment='growth';
      else if(statusKey==='growing')segment='growth';

      var actions=[];
      if(daysSince>120){
        actions.push({type:'Win Back',score:100+Math.min(30,x.lifetimeRevenue/5000),reason:'No recorded purchase in '+daysSince+' days.',recommendation:'Reopen the relationship and ask what changed since the last order.',potential:Math.max(currentAov,x.priorRevenue*.25)})
      }
      if(cadenceOverdue){
        actions.push({type:'Reorder Due',score:92+Math.min(25,(daysSince/(cadence||daysSince))*10),reason:'Typical recorded cadence is about '+Math.round(cadence)+' days; this account is at '+daysSince+' days.',recommendation:'Reach out with a reorder check-in before the account drifts further.',potential:Math.max(currentAov,x.lifetimeRevenue/Math.max(1,x.orders.length))})
      }
      if(x.priorRevenue>0&&x.currentRevenue<x.priorRevenue*.75){
        actions.push({type:'Revenue Decline',score:88+Math.min(30,Math.abs(trend)/3),reason:'Comparable YTD revenue is down '+Math.abs(Math.round(trend))+'%.',recommendation:'Review what they bought previously and identify the missing program or reorder.',potential:Math.max(0,x.priorRevenue-x.currentRevenue)})
      }
      if(isNew&&daysSince<=45){
        actions.push({type:'New Customer Follow-Up',score:76,reason:'A new-customer order was recorded within the last '+daysSince+' days.',recommendation:'Follow up while the first buying experience is still fresh and look for the second order.',potential:Math.max(currentAov,largest?n(largest.total):0)})
      }
      if(expansion){
        actions.push({type:'Account Expansion',score:68+Math.round(topTypeShare*10),reason:Math.round(topTypeShare*100)+'% of recorded order revenue is concentrated in '+topType.name+'.',recommendation:'Explore another order type instead of relying on one buying pattern.',potential:Math.max(currentAov*.75,1000)})
      }
      if(statusKey==='growing'){
        actions.push({type:'Growth Momentum',score:64+Math.min(20,trend/5),reason:'Comparable YTD revenue is up '+Math.round(trend)+'%.',recommendation:'Protect the momentum and look for a larger or broader next program.',potential:Math.max(currentAov,x.currentRevenue*.15)})
      }

      return {
        key:key,name:x.name,orders:x.orders,currentRevenue:x.currentRevenue,priorRevenue:x.priorRevenue,currentOrders:x.currentOrders,
        priorOrders:x.priorOrders,lifetimeRevenue:x.lifetimeRevenue,newFlag:x.newFlag,dates:dates,last:last,first:first,cadence:cadence,
        daysSince:daysSince,currentAov:currentAov,largest:largest,types:typeEntries,topType:topType,topTypeShare:topTypeShare,
        trend:trend,cadenceOverdue:cadenceOverdue,isNew:isNew,status:status,statusKey:statusKey,segment:segment,
        health:health,scoreParts:{recency:recencyScore,trend:trendScore,repeat:repeatScore,quality:Math.round(qualityScore)},
        issues:x.issues,artErrors:x.artErrors,credits:x.credits,creditValue:x.creditValue,actions:actions
      };
    });

    var active=customers.filter(function(x){return x.currentRevenue>0});
    var activeSorted=active.slice().sort(function(a,b){return b.currentRevenue-a.currentRevenue});
    var currentTotal=active.reduce(function(s,x){return s+x.currentRevenue},0);
    var top5=activeSorted.slice(0,5).reduce(function(s,x){return s+x.currentRevenue},0);
    var top10=activeSorted.slice(0,10).reduce(function(s,x){return s+x.currentRevenue},0);
    var top1=activeSorted[0]||null;
    var currentOrders=active.reduce(function(s,x){return s+x.currentOrders},0);
    var newCount=customers.filter(function(x){return x.isNew&&x.currentRevenue>0}).length;
    var atRisk=customers.filter(function(x){return x.segment==='risk'||x.statusKey==='slipping'}).length;
    var dormant=customers.filter(function(x){return x.segment==='dormant'}).length;
    var growth=customers.filter(function(x){return x.segment==='growth'}).length;

    var actionQueue=[];
    customers.forEach(function(x){
      x.actions.forEach(function(a){
        actionQueue.push({customer:x,action:a,score:a.score+(x.currentRevenue>0?Math.min(20,x.currentRevenue/5000):0)})
      })
    });
    actionQueue.sort(function(a,b){return b.score-a.score});

    var portfolio={
      core:customers.filter(function(x){return x.segment==='core'}).length,
      growth:growth,
      risk:customers.filter(function(x){return x.segment==='risk'||x.statusKey==='slipping'}).length,
      dormant:dormant,
      new:customers.filter(function(x){return x.segment==='new'}).length
    };

    return {
      c:c,rep:rep,year:year,cutoff:cutoff,priorCut:priorCut,customers:customers,active:active,activeSorted:activeSorted,
      currentTotal:currentTotal,currentOrders:currentOrders,top5:top5,top10:top10,top1:top1,newCount:newCount,atRisk:atRisk,
      dormant:dormant,growth:growth,actionQueue:actionQueue,portfolio:portfolio
    }
  }

  function sectionHead(kick,title,note){return '<div class="rp2-cu-section-head"><div><div class="rp2-cu-section-kick">'+kick+'</div><div class="rp2-cu-section-title">'+title+'</div></div><div class="rp2-cu-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-cu-kpi"><div class="rp2-cu-kpi-label">'+esc(label)+'</div><div class="rp2-cu-kpi-value">'+value+'</div><div class="rp2-cu-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-cu-tabs-wrap"><div class="rp2-cu-tabs">'+CU_TABS.map(function(t){return '<button class="rp2-cu-tab '+(t.id===active?'active':'')+'" onclick="_rp2CustomerSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function statusClass(x){return x.statusKey==='slipping'?'slipping':x.statusKey}
  function trendText(x){
    if(x.priorRevenue<=0)return x.currentRevenue>0?'New recorded revenue baseline':'No comparable prior-year revenue';
    return (x.trend>=0?'▲ ':'▼ ')+Math.abs(Math.round(x.trend))+'% vs comparable '+(Number(getYr())-1)
  }
  function encodedKey(x){return encodeURIComponent(x.key)}
  function card(x){
    return '<button class="rp2-cu-card" onclick="_rp2CustomerOpen(\''+encodedKey(x)+'\')">'
      +'<div class="rp2-cu-card-top"><div class="rp2-cu-card-name">'+esc(x.name)+'</div><span class="rp2-cu-status '+statusClass(x)+'">'+esc(x.status)+'</span></div>'
      +'<div class="rp2-cu-card-rev">'+money(x.currentRevenue)+'</div><div class="rp2-cu-card-sub">'+esc(trendText(x))+'</div>'
      +'<div class="rp2-cu-card-stats"><div class="rp2-cu-mini"><span>Orders</span><strong>'+x.currentOrders+'</strong></div><div class="rp2-cu-mini"><span>Last order</span><strong>'+displayDate(x.last)+'</strong></div><div class="rp2-cu-mini"><span>AOV</span><strong>'+money(x.currentAov)+'</strong></div><div class="rp2-cu-mini"><span>Days since</span><strong>'+x.daysSince+'</strong></div></div>'
      +'<div class="rp2-cu-health"><div class="rp2-cu-health-top"><span>Account health</span><strong>'+Math.round(x.health)+'/100</strong></div><div class="rp2-cu-health-bar"><span style="width:'+Math.round(x.health)+'%"></span></div></div>'
      +'</button>'
  }
  function empty(title,copy){return '<div class="rp2-cu-empty"><strong>'+esc(title)+'</strong><span>'+esc(copy)+'</span></div>'}
  function cards(list){
    if(!list.length)return empty('No customers match this view','As more order history is loaded, this section will populate automatically.');
    return '<div class="rp2-cu-grid">'+list.map(card).join('')+'</div>'
  }
  function table(list){
    if(!list.length)return empty('No customers match this view','There are no accounts in this category for the selected reporting point.');
    return '<div class="rp2-cu-panel"><div class="rp2-cu-table">'+list.map(function(x){
      return '<button class="rp2-cu-row" onclick="_rp2CustomerOpen(\''+encodedKey(x)+'\')">'
        +'<div class="rp2-cu-row-name">'+esc(x.name)+'<small>'+esc(x.status)+' · health '+Math.round(x.health)+'/100</small></div>'
        +'<div class="rp2-cu-row-val">'+money(x.currentRevenue)+'</div>'
        +'<div class="rp2-cu-row-val">'+x.currentOrders+'</div>'
        +'<div class="rp2-cu-row-val">'+money(x.currentAov)+'</div>'
        +'<div class="rp2-cu-row-muted">'+displayDate(x.last)+'</div>'
        +'<div class="rp2-cu-row-muted">'+x.daysSince+' days</div>'
      +'</button>'
    }).join('')+'</div></div>'
  }
  function segmentCard(icon,label,count,copy,tab){
    return '<button class="rp2-cu-segment" onclick="_rp2CustomerSetTab(\''+tab+'\')"><div class="rp2-cu-segment-icon">'+icon+'</div><div class="rp2-cu-segment-label">'+label+'</div><div class="rp2-cu-segment-value">'+count+'</div><div class="rp2-cu-segment-copy">'+copy+'</div></button>'
  }
  function actionList(g,limit){
    var list=g.actionQueue.slice(0,limit||5);
    if(!list.length)return empty('No urgent customer actions detected','The available order history is not currently flagging an overdue, declining, new-follow-up, or concentrated account.');
    return '<div class="rp2-cu-action-list">'+list.map(function(z,i){
      return '<button class="rp2-cu-action" onclick="_rp2CustomerOpen(\''+encodedKey(z.customer)+'\')"><div class="rp2-cu-action-no">'+(i+1)+'</div><div class="rp2-cu-action-name">'+esc(z.customer.name)+'<small><strong style="color:#bcb4ff">'+esc(z.action.type)+'</strong> · '+esc(z.action.reason)+'</small></div><div class="rp2-cu-action-value">'+money(z.action.potential)+'<small>estimated opportunity</small></div></button>'
    }).join('')+'</div>'
  }
  function concentration(g){
    var p5=g.currentTotal>0?g.top5/g.currentTotal*100:0,p10=g.currentTotal>0?g.top10/g.currentTotal*100:0,p1=g.currentTotal>0&&g.top1?g.top1.currentRevenue/g.currentTotal*100:0;
    var riskCopy=!g.top1?'No active customer revenue is available yet.'
      :('Your largest account, '+g.top1.name+', represents '+Math.round(p1)+'% of recorded YTD customer revenue through this point.');
    return '<div class="rp2-cu-panel"><div class="rp2-cu-panel-title">Portfolio concentration</div><div class="rp2-cu-panel-sub">How much of your recorded customer revenue is concentrated in the largest accounts.</div><div class="rp2-cu-concentration">'
      +'<div class="rp2-cu-con-row"><div class="rp2-cu-con-top"><span>Top 1 account</span><strong>'+Math.round(p1)+'%</strong></div><div class="rp2-cu-bar"><span style="width:'+Math.min(100,p1)+'%"></span></div></div>'
      +'<div class="rp2-cu-con-row"><div class="rp2-cu-con-top"><span>Top 5 accounts</span><strong>'+Math.round(p5)+'%</strong></div><div class="rp2-cu-bar"><span style="width:'+Math.min(100,p5)+'%"></span></div></div>'
      +'<div class="rp2-cu-con-row"><div class="rp2-cu-con-top"><span>Top 10 accounts</span><strong>'+Math.round(p10)+'%</strong></div><div class="rp2-cu-bar"><span style="width:'+Math.min(100,p10)+'%"></span></div></div>'
      +'</div><div class="rp2-cu-risk-callout"><strong>Concentration read:</strong> '+esc(riskCopy)+'</div></div>'
  }
  function overview(g){
    var portfolio=sectionHead('Portfolio map','How your customer book is distributed','Accounts are segmented from recorded order recency, comparable revenue trend, new-customer flags, and buying-pattern concentration.')
      +'<div class="rp2-cu-portfolio">'
      +segmentCard('◆','Core Accounts',g.portfolio.core,'Active accounts without a current risk or expansion flag.','top')
      +segmentCard('↗','Growth Accounts',g.portfolio.growth,'Growing accounts or accounts with a clear order-type expansion opportunity.','growth')
      +segmentCard('⚠','At Risk',g.portfolio.risk,'Slipping revenue or a buying cadence that appears overdue.','attention')
      +segmentCard('○','Dormant',g.portfolio.dormant,'More than 120 days since the last recorded purchase.','dormant')
      +segmentCard('＋','New',g.portfolio.new,'New-customer flags or a first recorded purchase this year.','new')
      +'</div>';
    var actions=sectionHead('Action queue','The customers I would work next','This queue ranks the strongest signals in the available order history. Estimated opportunity uses recorded average order value or the comparable revenue gap—it is directional, not a promise.')
      +'<div class="rp2-cu-overview-grid"><div class="rp2-cu-panel"><div class="rp2-cu-panel-title">Your next 5 customer actions</div><div class="rp2-cu-panel-sub">Highest-priority reorder, decline, win-back, expansion, and new-customer signals.</div>'+actionList(g,5)+'</div>'+concentration(g)+'</div>';
    return portfolio+actions
  }
  function filteredView(g,tab){
    var list=[],title='',note='';
    if(tab==='top'){
      list=g.activeSorted.slice();title='Top Accounts';note='Active accounts ranked by recorded YTD revenue through the selected reporting point.'
    }else if(tab==='attention'){
      list=g.customers.filter(function(x){return x.segment==='risk'||x.statusKey==='slipping'||x.cadenceOverdue}).sort(function(a,b){return a.health-b.health});title='Needs Attention';note='Accounts with a decline signal, overdue buying cadence, or elevated recency risk.'
    }else if(tab==='growth'){
      list=g.customers.filter(function(x){return x.segment==='growth'||x.actions.some(function(a){return a.type==='Reorder Due'||a.type==='Account Expansion'||a.type==='Growth Momentum'})}).sort(function(a,b){return b.currentRevenue-a.currentRevenue});title='Growth Opportunities';note='Accounts with reorder timing, momentum, or a concentrated order-type pattern that may support expansion.'
    }else if(tab==='new'){
      list=g.customers.filter(function(x){return x.isNew&&x.currentRevenue>0}).sort(function(a,b){return b.currentRevenue-a.currentRevenue});title='New Customers';note='Customers with a new-customer flag or a first recorded purchase in the selected year.'
    }else if(tab==='dormant'){
      list=g.customers.filter(function(x){return x.statusKey==='dormant'}).sort(function(a,b){return b.lifetimeRevenue-a.lifetimeRevenue});title='Dormant Accounts';note='Accounts more than 120 days from the last recorded purchase, ranked by recorded lifetime revenue.'
    }
    return sectionHead('Customer view',title,note)+table(list)
  }
  function accountMeaning(x){
    if(x.statusKey==='dormant')return 'This account has gone quiet. The strongest immediate question is whether the buying need disappeared, moved to a competitor, or is simply overdue.';
    if(x.statusKey==='slipping')return 'This account is still part of the book, but comparable revenue has materially declined. Review prior buying patterns before the relationship erodes further.';
    if(x.statusKey==='risk')return 'The account is not necessarily lost, but its recency or buying cadence is signaling that a proactive check-in is warranted.';
    if(x.statusKey==='new')return 'The first recorded buying cycle is still recent. The highest-value move is creating the second order before the relationship becomes one-and-done.';
    if(x.segment==='growth'&&x.topTypeShare>=.75)return 'This is an active account with a concentrated buying pattern. The easiest expansion conversation is likely broadening beyond '+x.topType.name+'.';
    if(x.statusKey==='growing')return 'This account has positive comparable momentum. Protect what is working and look for the next larger or broader program.';
    return 'This is a relatively healthy active account. The opportunity is maintaining cadence and looking for a larger next program without creating unnecessary risk.'
  }
  function drawer(g){
    if(!window._rp2CustomerOpenKey)return '';
    var key=decodeURIComponent(window._rp2CustomerOpenKey),x=g.customers.filter(function(c){return c.key===key})[0];
    if(!x)return '';
    var mixTotal=x.types.reduce(function(s,z){return s+z.value},0)||1;
    var recent=x.orders.slice().sort(function(a,b){return String(b.orderDate).localeCompare(String(a.orderDate))}).slice(0,10);
    var actions=x.actions.slice().sort(function(a,b){return b.score-a.score});
    return '<div class="rp2-cu-drawer-wrap" onclick="if(event.target===this)_rp2CustomerClose()"><aside class="rp2-cu-drawer">'
      +'<div class="rp2-cu-drawer-head"><div><div class="rp2-cu-drawer-kick">Customer detail · '+esc(x.status)+'</div><div class="rp2-cu-drawer-name">'+esc(x.name)+'</div></div><button class="rp2-cu-close" onclick="_rp2CustomerClose()">×</button></div>'
      +'<div class="rp2-cu-detail-kpis">'
        +'<div class="rp2-cu-detail-kpi"><span>'+getYr()+' YTD revenue</span><strong>'+money(x.currentRevenue)+'</strong></div>'
        +'<div class="rp2-cu-detail-kpi"><span>Prior comparable YTD</span><strong>'+money(x.priorRevenue)+'</strong></div>'
        +'<div class="rp2-cu-detail-kpi"><span>Recorded orders this year</span><strong>'+x.currentOrders+'</strong></div>'
        +'<div class="rp2-cu-detail-kpi"><span>Average order value</span><strong>'+money(x.currentAov)+'</strong></div>'
        +'<div class="rp2-cu-detail-kpi"><span>Last recorded order</span><strong>'+displayDate(x.last)+'</strong></div>'
        +'<div class="rp2-cu-detail-kpi"><span>Days since order</span><strong>'+x.daysSince+'</strong></div>'
      +'</div>'
      +'<div class="rp2-cu-detail-section"><div class="rp2-cu-detail-title">What this account means</div><div class="rp2-cu-detail-copy">'+esc(accountMeaning(x))+'</div></div>'
      +'<div class="rp2-cu-detail-section"><div class="rp2-cu-detail-title">Transparent health score · '+Math.round(x.health)+'/100</div><div class="rp2-cu-detail-copy">The score uses only four visible components: recency, comparable revenue trend, repeat-order evidence, and linked quality issues.</div><div class="rp2-cu-score-grid">'
        +'<div class="rp2-cu-score"><span>Recency</span><strong>'+x.scoreParts.recency+'/40</strong></div>'
        +'<div class="rp2-cu-score"><span>Trend</span><strong>'+x.scoreParts.trend+'/25</strong></div>'
        +'<div class="rp2-cu-score"><span>Repeat</span><strong>'+x.scoreParts.repeat+'/20</strong></div>'
        +'<div class="rp2-cu-score"><span>Quality</span><strong>'+x.scoreParts.quality+'/15</strong></div>'
      +'</div></div>'
      +(actions.length?'<div class="rp2-cu-detail-section"><div class="rp2-cu-detail-title">Recommended account actions</div><div class="rp2-cu-action-list">'+actions.slice(0,4).map(function(a,i){return '<div class="rp2-cu-action"><div class="rp2-cu-action-no">'+(i+1)+'</div><div class="rp2-cu-action-name">'+esc(a.type)+'<small>'+esc(a.recommendation)+' '+esc(a.reason)+'</small></div><div class="rp2-cu-action-value">'+money(a.potential)+'<small>estimated opportunity</small></div></div>'}).join('')+'</div></div>':'')
      +'<div class="rp2-cu-detail-section"><div class="rp2-cu-detail-title">Recorded order-type mix</div><div class="rp2-cu-detail-copy">This uses the order types available in the uploaded order data—not a product-category feed.</div><div class="rp2-cu-mix">'+x.types.map(function(z){var p=z.value/mixTotal*100;return '<div class="rp2-cu-mix-row"><div class="rp2-cu-mix-label">'+esc(z.name)+'</div><div class="rp2-cu-mix-bar"><span style="width:'+p+'%"></span></div><div class="rp2-cu-mix-pct">'+Math.round(p)+'%</div></div>'}).join('')+'</div></div>'
      +'<div class="rp2-cu-detail-section"><div class="rp2-cu-detail-title">Quality signals</div><div class="rp2-cu-detail-copy">'+x.artErrors+' linked art error'+(x.artErrors===1?'':'s')+' · '+x.credits+' linked credit memo'+(x.credits===1?'':'s')+' · '+money(x.creditValue)+' linked credit value.</div></div>'
      +'<div class="rp2-cu-detail-section"><div class="rp2-cu-detail-title">Recent recorded orders</div><div class="rp2-cu-order-history">'+recent.map(function(o){return '<div class="rp2-cu-hist-row"><div class="rp2-cu-hist-date">'+displayDate(o.orderDate)+'</div><div class="rp2-cu-hist-name">'+esc(o.orderNum||'Order')+' · '+esc(o.orderType||'General Sale')+'</div><div class="rp2-cu-hist-val">'+money(o.total)+'</div></div>'}).join('')+'</div></div>'
      +'<div class="rp2-cu-detail-section"><div class="rp2-cu-detail-copy">Data note: customer intelligence is based on the order history currently loaded into Sales Tracker. Missing historical files can make cadence, lifetime revenue, or “first recorded purchase” appear newer than the actual customer relationship.</div></div>'
      +'</aside></div>'
  }

  window._rp2CustomerSetTab=function(id){
    window._rp2CustomerTab=id;
    window._rp2CustomerOpenKey=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2CustomersV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0
  };
  window._rp2CustomerOpen=function(encoded){
    window._rp2CustomerOpenKey=encoded;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2CustomersV2()
  };
  window._rp2CustomerClose=function(){
    window._rp2CustomerOpenKey=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2CustomersV2()
  };

  window._rp2CustomersV2=function(){
    var g=customerBuild(),tab=window._rp2CustomerTab;
    if(!g.customers.length){
      return '<div class="rp2-cu-shell"><div class="rp2-cu-hero"><div class="rp2-cu-kick">Customers 2.0 · BUILD v488</div><div class="rp2-cu-title">Your account command center</div><div class="rp2-cu-copy">No customer order history is currently loaded for '+esc(g.rep)+'. Once order files are imported, this page will build the portfolio, action queue, and account health views automatically.</div></div></div>'
    }
    var concentration=g.currentTotal>0?g.top5/g.currentTotal*100:0;
    var heroStory=g.actionQueue.length
      ?('The strongest current account signal is '+g.actionQueue[0].action.type.toLowerCase()+' for '+g.actionQueue[0].customer.name+'.')
      :'Your customer book does not currently show a high-priority risk signal in the available order history.';
    var hero='<div class="rp2-cu-hero"><div class="rp2-cu-hero-grid"><div><div class="rp2-cu-kick">Customers 2.0 · BUILD v488</div><div class="rp2-cu-title">Your account command center</div><div class="rp2-cu-copy">'+esc(heroStory)+' This page turns recorded order history into a practical view of who drives the book, who needs attention, and where the next customer opportunity may be.</div><div class="rp2-cu-pills"><span class="rp2-cu-pill">Through '+esc(g.cutoff)+'</span><span class="rp2-cu-pill">'+g.active.length+' active customers</span><span class="rp2-cu-pill '+(g.atRisk||g.dormant?'warn':'good')+'">'+(g.atRisk+g.dormant)+' risk / dormant signals</span></div></div>'
      +'<div class="rp2-cu-brief"><div><div class="rp2-cu-brief-label">Recorded YTD customer revenue</div><div class="rp2-cu-brief-value">'+money(g.currentTotal)+'</div><div class="rp2-cu-brief-title">'+Math.round(concentration)+'% comes from your top 5 accounts</div><div class="rp2-cu-brief-copy">'+(g.top1?('Your largest recorded account is '+g.top1.name+' at '+money(g.top1.currentRevenue)+'.'):'No active account revenue is available.')+'</div></div><div class="rp2-cu-brief-sub">'+g.currentOrders+' primary orders · '+g.newCount+' new customers</div></div>'
      +'</div></div>';
    var activeAov=g.currentOrders?g.currentTotal/g.currentOrders:0;
    var kpis='<div class="rp2-cu-kpis">'
      +kpi('Active customers',String(g.active.length),'Customers with recorded revenue this year through the selected point')
      +kpi('Top 10 revenue share',g.currentTotal?pct(g.top10/g.currentTotal*100):'—','Portfolio concentration across the ten largest active accounts')
      +kpi('Average order value',g.currentOrders?money(activeAov):'—',g.currentOrders+' recorded primary orders')
      +kpi('New customers',String(g.newCount),'New-customer flag or first recorded purchase this year')
      +kpi('Needs attention',String(g.atRisk),'Slipping revenue or overdue buying cadence')
      +kpi('Dormant accounts',String(g.dormant),'More than 120 days since last recorded purchase')
      +'</div>';
    var content=tab==='overview'?overview(g):filteredView(g,tab);
    return '<div class="rp2-cu-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+drawer(g)
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='customers')setTimeout(function(){try{_rp2Go('customers')}catch(e){}},0)
  }catch(e){}
})();
