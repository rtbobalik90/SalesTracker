
(function(){
  var RV_TABS=[
    {id:'overview',label:'Overview',icon:'◫'},
    {id:'voice',label:'Customer Voice',icon:'✦'},
    {id:'themes',label:'Praise Themes',icon:'◇'},
    {id:'recognition',label:'Recognition',icon:'🏅'},
    {id:'history',label:'Review History',icon:'◷'}
  ];
  window._rp2ReviewTab=window._rp2ReviewTab||'overview';
  window._rp2ReviewOpenId=window._rp2ReviewOpenId||null;

  var THEME_DEFS=[
    {id:'communication',name:'Communication',icon:'💬',words:['communication','communicated','communicate','kept me informed','kept us informed','updated me','updated us','explained','clear communication']},
    {id:'responsiveness',name:'Responsiveness',icon:'⚡',words:['responsive','response','responded','replied','reply','prompt','promptly','quick to respond','got back to me']},
    {id:'knowledge',name:'Product Knowledge',icon:'🧠',words:['knowledgeable','knowledge','expertise','expert','recommendation','recommendations','suggestion','suggestions','helped choose','product knowledge']},
    {id:'speed',name:'Speed & Turnaround',icon:'⏱',words:['quick','quickly','fast','turnaround','timely','on time','deadline','rush','speedy']},
    {id:'problem',name:'Problem Solving',icon:'🛠',words:['problem','issue','solution','solve','solved','resolved','resolve','fixed','fix','made it right']},
    {id:'friendliness',name:'Friendliness & Helpfulness',icon:'😊',words:['friendly','kind','pleasant','helpful','patient','wonderful','amazing to work with','great to work with']},
    {id:'followthrough',name:'Follow-Through',icon:'✅',words:['follow through','follow-through','followed up','follow up','follow-up','reliable','kept promise','delivered as promised','stayed on top']},
    {id:'quality',name:'Quality',icon:'✨',words:['quality','looks great','looked great','perfect','excellent product','beautiful','embroidery','print quality','printing']},
    {id:'ease',name:'Ease of Working Together',icon:'🤝',words:['easy to work with','easy process','seamless','smooth','painless','simple process','effortless']}
  ];

  function n(v){return Number(v)||0}
  function esc(v){return _rp2Esc(String(v==null?'':v))}
  function safeArray(v){
    if(Array.isArray(v))return v;
    if(!v)return [];
    try{
      if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);
      if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null});
    }catch(e){}
    return []
  }
  function dateValue(v){
    if(v==null||v==='')return null;
    try{
      if(typeof _rvDate==='function'){
        var rd=_rvDate(v);
        if(rd&&!isNaN(rd.getTime()))return rd
      }
    }catch(e){}
    try{
      var d=v instanceof Date?new Date(v.getTime()):new Date(v);
      if(!isNaN(d.getTime()))return d
    }catch(e){}
    var m=String(v||'').match(/(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})/);
    if(m){
      var a=+m[1],b=+m[2],c=+m[3];
      var d2=a>31?new Date(a,b-1,c):new Date(c<100?2000+c:c,a-1,b);
      return isNaN(d2.getTime())?null:d2
    }
    return null
  }
  function iso(v){
    var d=dateValue(v);
    return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')):''
  }
  function displayDate(v){
    var d=dateValue(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):String(v||'—')
  }
  function platform(v){
    try{if(typeof _rvPlatform==='function')return _rvPlatform(v)}catch(e){}
    var s=String(v||'').toLowerCase();
    if(s.indexOf('google')>=0)return 'Google';
    if(s.indexOf('trust')>=0)return 'Trustpilot';
    if(s.indexOf('face')>=0)return 'Facebook';
    return v?String(v):'Other'
  }
  function hash(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').replace(/[^\w ]/g,'').trim()}
  function rawId(r){
    if(r&&r.id!=null)return String(r.id);
    try{if(typeof _rvRowId==='function')return String(_rvRowId(r))}catch(e){}
    return hash(r&&r.rep)+'|'+hash(r&&r.custName)+'|'+String(r&&r.ts||'').slice(0,16)+'|'+hash(r&&r.msg).slice(0,40)
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
  function fallbackActiveReviews(rep){
    var R=S&&S.reviews||{},rows=safeArray(R.rows),dec=R.decisions||{},rf=R.repFix||{},seen={};
    return rows.map(function(raw){
      if(!raw)return null;
      var id=rawId(raw),msgHash=hash(raw.msg),decision=dec[id]||null,isDup=false;
      if(msgHash&&msgHash.length>4){
        if(seen[msgHash])isDup=true;
        else seen[msgHash]=id
      }
      if(decision==='removed')return null;
      if(isDup&&decision!=='approved')return null;
      var assigned=Object.prototype.hasOwnProperty.call(rf,id)?rf[id]:raw.rep;
      if(assigned!==rep)return null;
      return {
        id:id,raw:raw,date:dateValue(raw.ts),platform:platform(raw.type),
        stars:n(raw.stars),msg:String(raw.msg||''),customer:String(raw.custName||raw.custId||''),
        email:String(raw.email||''),pays:(platform(raw.type)==='Google'||platform(raw.type)==='Trustpilot')
      }
    }).filter(Boolean)
  }
  function activeReviews(rep){
    try{
      if(typeof _rvEnriched==='function'&&typeof _rvActive==='function'){
        return safeArray(_rvActive(_rvEnriched())).filter(function(x){return x&&x.matched&&x.repName===rep}).map(function(x){
          var raw=x.raw||{};
          return {
            id:String(x.id),raw:raw,date:x.date||dateValue(raw.ts),platform:x.platform||platform(raw.type),
            stars:n(raw.stars),msg:String(raw.msg||''),customer:String(raw.custName||raw.custId||''),
            email:String(raw.email||''),pays:!!x.pays
          }
        })
      }
    }catch(e){console.warn('[Customer Reviews 2.0] enriched review feed unavailable',e)}
    return fallbackActiveReviews(rep)
  }
  function inRange(r,start,end){
    if(!r||!r.date||!start||!end)return false;
    var d=new Date(r.date.getFullYear(),r.date.getMonth(),r.date.getDate()).getTime();
    var s=new Date(start.getFullYear(),start.getMonth(),start.getDate()).getTime();
    var e=new Date(end.getFullYear(),end.getMonth(),end.getDate(),23,59,59,999).getTime();
    return d>=s&&d<=e
  }
  function periodRows(all,ctx){
    if(!ctx.through.length)return [];
    var first=ctx.through[0],last=ctx.through[ctx.through.length-1],start=dateValue(first&&first.start),end=dateValue(last&&last.end);
    return all.filter(function(r){return inRange(r,start,end)})
  }
  function priorRows(all,ctx){
    var pq=previousQuarter(ctx.year,ctx.q),ws=[];
    try{ws=safeArray(gwq(pq.year,pq.q)).slice(0,ctx.through.length)}catch(e){ws=[]}
    if(!ws.length)return [];
    var start=dateValue(ws[0].start),end=dateValue(ws[ws.length-1].end);
    return all.filter(function(r){return inRange(r,start,end)})
  }
  function themesForReview(r){
    var s=String(r&&r.msg||'').toLowerCase(),out=[];
    THEME_DEFS.forEach(function(t){
      if(t.words.some(function(w){return s.indexOf(w)>=0}))out.push(t.id)
    });
    return out
  }
  function themeMap(rows){
    var map={};
    THEME_DEFS.forEach(function(t){map[t.id]={id:t.id,name:t.name,icon:t.icon,count:0,reviews:[]}})
    rows.forEach(function(r){
      var ts=themesForReview(r);
      r._themes=ts;
      ts.forEach(function(id){
        if(map[id]){map[id].count++;map[id].reviews.push(r)}
      })
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return b.count-a.count||a.name.localeCompare(b.name)})
  }
  function aggregate(rows){
    var rated=rows.filter(function(r){return n(r.stars)>0}),five=rows.filter(function(r){return n(r.stars)>=5}),positive=rows.filter(function(r){return n(r.stars)>=4});
    var platforms={};
    rows.forEach(function(r){
      var p=r.platform||'Other';platforms[p]=(platforms[p]||0)+1
    });
    return {
      rows:rows,count:rows.length,rated:rated.length,
      avg:rated.length?rated.reduce(function(s,r){return s+n(r.stars)},0)/rated.length:0,
      five:five.length,positive:positive.length,positiveRate:rated.length?positive.length/rated.length*100:0,
      platforms:platforms
    }
  }
  function weeklySeries(rows,ws){
    return safeArray(ws).map(function(w){
      var start=dateValue(w.start),end=dateValue(w.end),list=rows.filter(function(r){return inRange(r,start,end)}),a=aggregate(list);
      return {week:w,count:list.length,avg:a.avg||null,five:a.five}
    })
  }
  function officialOrders(rep,ws){
    return safeArray(ws).reduce(function(sum,w){
      var d=(S&&S.data&&w&&w.key&&S.data[rep+'|'+w.key])||{};
      return sum+n(d.orders)
    },0)
  }
  function longestPositiveStreak(rows){
    var sorted=rows.filter(function(r){return n(r.stars)>0}).slice().sort(function(a,b){
      return (a.date?a.date.getTime():0)-(b.date?b.date.getTime():0)
    }),best=0,cur=0;
    sorted.forEach(function(r){
      if(n(r.stars)>=4){cur++;best=Math.max(best,cur)}
      else cur=0
    });
    return best
  }
  function nameMentions(rows,rep){
    var full=String(rep||'').toLowerCase(),first=full.split(/\s+/)[0]||'';
    return rows.filter(function(r){
      var s=String(r.msg||'').toLowerCase();
      return (full&&s.indexOf(full)>=0)||(first.length>=3&&s.indexOf(first)>=0)
    })
  }
  function highlights(rows,rep){
    var sorted=rows.slice().sort(function(a,b){return (b.date?b.date.getTime():0)-(a.date?a.date.getTime():0)});
    var best=rows.slice().sort(function(a,b){return n(b.stars)-n(a.stars)||String(b.msg||'').length-String(a.msg||'').length})[0]||null;
    var detailed=rows.filter(function(r){return n(r.stars)>=4}).slice().sort(function(a,b){return String(b.msg||'').length-String(a.msg||'').length})[0]||null;
    var recent5=sorted.filter(function(r){return n(r.stars)>=5})[0]||null;
    var mentions=nameMentions(rows,rep);
    return {
      best:best,detailed:detailed,recent5:recent5,mentions:mentions,
      streak:longestPositiveStreak(rows)
    }
  }
  function reviewSnippet(r,limit){
    if(!r)return 'No review available yet.';
    var s=String(r.msg||'').trim();
    if(!s)return 'No written comment was provided.';
    limit=limit||160;
    return s.length>limit?s.slice(0,limit-1)+'…':s
  }
  function serviceStory(g){
    if(!g.period.count)return {
      title:'Customer recognition is still waiting for a selected-period review',
      copy:'No active reviews assigned to you fall inside the selected quarter-through-week window. Your all-time review history still remains available in Recognition and Review History.'
    };
    var top=g.periodThemes.filter(function(t){return t.count>0})[0]||null;
    var second=g.periodThemes.filter(function(t){return t.count>0})[1]||null;
    var pieces=[];
    if(g.period.avg>=4.8)pieces.push('Customer sentiment is exceptionally strong at '+g.period.avg.toFixed(1)+' stars.');
    else if(g.period.avg>=4.3)pieces.push('Customer sentiment is strong at '+g.period.avg.toFixed(1)+' stars.');
    else if(g.period.avg>0)pieces.push('The selected-period average is '+g.period.avg.toFixed(1)+' stars, leaving room to study the lower-rated feedback as carefully as the praise.');
    else pieces.push('The selected-period reviews do not contain enough star ratings for an average.');
    if(top){
      pieces.push('The clearest praise theme is '+top.name.toLowerCase()+(second&&second.count?(', followed by '+second.name.toLowerCase()):'')+'.');
    }
    if(g.orders>0){
      var rate=g.period.count/g.orders*100;
      if(rate<3)pieces.push('Review volume is light relative to the '+g.orders+' official orders recorded through the selected reporting point, so there may be more satisfied customers than the review count currently captures.');
      else if(rate>=8)pieces.push('Review volume is strong relative to recorded order count, giving the customer-service story a meaningful sample.');
    }
    return {title:top?('Customers most often recognize your '+top.name.toLowerCase()):'The customer-service story is still forming',copy:pieces.join(' ')}
  }
  function achievements(g){
    var all=g.all,allThemes=g.allThemes,themeBy={};
    allThemes.forEach(function(t){themeBy[t.id]=t.count});
    var positivePlatforms={};
    all.rows.filter(function(r){return n(r.stars)>=4}).forEach(function(r){positivePlatforms[r.platform]=1});
    return [
      {icon:'⭐',name:'First 5-Star Review',earned:all.five>=1,copy:'Receive your first active five-star review.'},
      {icon:'🌟',name:'Five 5-Star Reviews',earned:all.five>=5,copy:'Accumulate five active five-star reviews.'},
      {icon:'🏆',name:'Ten 5-Star Reviews',earned:all.five>=10,copy:'Accumulate ten active five-star reviews.'},
      {icon:'💛',name:'Customer Favorite',earned:all.count>=10&&all.avg>=4.8,copy:'Maintain at least a 4.8 average across 10+ rated reviews.'},
      {icon:'💬',name:'Communication Champion',earned:n(themeBy.communication)>=3,copy:'Communication praise appears in at least three active reviews.'},
      {icon:'⚡',name:'Responsiveness Pro',earned:n(themeBy.responsiveness)>=3,copy:'Responsiveness praise appears in at least three active reviews.'},
      {icon:'🛠',name:'Problem Solver',earned:n(themeBy.problem)>=3,copy:'Problem-solving praise appears in at least three active reviews.'},
      {icon:'🔥',name:'Positive Review Streak',earned:g.highlights.streak>=5,copy:'Build a streak of five consecutive rated reviews at four stars or higher.'},
      {icon:'📣',name:'Named Recognition',earned:g.highlights.mentions.length>=3,copy:'Be mentioned by name in at least three active written reviews.'},
      {icon:'🌐',name:'Trusted Everywhere',earned:Object.keys(positivePlatforms).length>=2,copy:'Earn positive reviews across at least two review platforms.'},
      {icon:'📚',name:'25 Review Milestone',earned:all.count>=25,copy:'Accumulate 25 active reviews assigned to your profile.'},
      {icon:'✨',name:'Perfect Five',earned:all.rated>=5&&all.avg===5,copy:'Maintain a perfect 5.0 average across at least five rated reviews.'}
    ]
  }
  function build(){
    var rep=_rp2.rep,ctx=context(),allRows=activeReviews(rep).sort(function(a,b){return (b.date?b.date.getTime():0)-(a.date?a.date.getTime():0)});
    var periodList=periodRows(allRows,ctx),priorList=priorRows(allRows,ctx),all=aggregate(allRows),period=aggregate(periodList),prior=aggregate(priorList);
    var periodThemes=themeMap(periodList),allThemes=themeMap(allRows),series=weeklySeries(periodList,ctx.through);
    var hi=highlights(allRows,rep),orders=officialOrders(rep,ctx.through),story=null;
    var g={rep:rep,ctx:ctx,allRows:allRows,periodList:periodList,priorList:priorList,all:all,period:period,prior:prior,periodThemes:periodThemes,allThemes:allThemes,series:series,highlights:hi,orders:orders};
    story=serviceStory(g);g.story=story;g.badges=achievements(g);g.earned=g.badges.filter(function(b){return b.earned}).length;
    return g
  }
  function sectionHead(kick,title,note){
    return '<div class="rp2-rv-section-head"><div><div class="rp2-rv-section-kick">'+kick+'</div><div class="rp2-rv-section-title">'+title+'</div></div><div class="rp2-rv-section-note">'+note+'</div></div>'
  }
  function kpi(label,value,sub){
    return '<div class="rp2-rv-kpi"><div class="rp2-rv-kpi-label">'+esc(label)+'</div><div class="rp2-rv-kpi-value">'+value+'</div><div class="rp2-rv-kpi-sub">'+sub+'</div></div>'
  }
  function tabBar(active){
    return '<div class="rp2-rv-tabs-wrap"><div class="rp2-rv-tabs">'+RV_TABS.map(function(t){
      return '<button class="rp2-rv-tab '+(t.id===active?'active':'')+'" onclick="_rp2ReviewSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'
    }).join('')+'</div></div>'
  }
  function stars(nv){
    var v=Math.max(0,Math.min(5,Math.round(n(nv)))),s='';
    for(var i=0;i<5;i++)s+=i<v?'★':'☆';
    return s||'Unrated'
  }
  function deltaText(curr,prev,label){
    if(prev===0)return curr>0?'New versus '+label:'No change versus '+label;
    var d=(curr-prev)/Math.abs(prev)*100;
    if(Math.abs(d)<1)return 'Flat versus '+label;
    return (d>0?'▲ ':'▼ ')+Math.abs(Math.round(d))+'% versus '+label
  }
  function themeBars(themes,total,limit){
    var rows=themes.filter(function(t){return t.count>0}).slice(0,limit||6),max=rows.length?rows[0].count:1;
    if(!rows.length)return '<div class="rp2-rv-empty"><strong>No written praise themes detected</strong><span>The selected reviews may be unrated, contain no written comment, or use language outside the visible keyword groups.</span></div>';
    return '<div class="rp2-rv-theme-list">'+rows.map(function(t){
      return '<div class="rp2-rv-theme-row"><div class="rp2-rv-theme-top"><span>'+t.icon+' '+esc(t.name)+'</span><strong>'+t.count+' review'+(t.count===1?'':'s')+'</strong></div><div class="rp2-rv-bar"><span style="width:'+Math.max(8,Math.round(t.count/max*100))+'%"></span></div></div>'
    }).join('')+'</div>'
  }
  function reviewCard(r){
    var ts=themesForReview(r),search=(r.msg+' '+r.customer+' '+r.platform+' '+ts.join(' ')).toLowerCase();
    return '<button class="rp2-rv-card" data-rv-review="1" data-platform="'+esc(String(r.platform||'Other').toLowerCase())+'" data-rating="'+n(r.stars)+'" data-themes="'+esc(ts.join(','))+'" data-search="'+esc(search)+'" onclick="_rp2ReviewOpen(\''+encodeURIComponent(r.id)+'\')">'
      +'<div><div class="rp2-rv-card-stars">'+esc(stars(r.stars))+'</div><div class="rp2-rv-card-platform">'+esc(r.platform||'Other')+'</div></div>'
      +'<div><div class="rp2-rv-card-message">'+esc(reviewSnippet(r,520))+'</div><div class="rp2-rv-card-meta"><span>'+esc(r.customer||'Customer not named')+'</span><span>·</span><span>'+displayDate(r.date)+'</span></div><div class="rp2-rv-card-themes">'+(ts.length?ts.map(function(id){var t=THEME_DEFS.filter(function(x){return x.id===id})[0];return '<span class="rp2-rv-theme-tag">'+(t?t.icon+' '+esc(t.name):esc(id))+'</span>'}).join(''):'<span class="rp2-rv-theme-tag">No detected praise theme</span>')+'</div></div>'
      +'<div class="rp2-rv-card-side"><strong>'+esc(r.platform||'Other')+'</strong>'+(r.pays?'Eligible review source':'Recognition only')+'</div>'
      +'</button>'
  }
  function latestFeed(rows,limit){
    var list=rows.slice(0,limit||3);
    if(!list.length)return '<div class="rp2-rv-empty"><strong>No reviews in this selected period</strong><span>All-time reviews remain available in Recognition and Review History.</span></div>';
    return '<div class="rp2-rv-feed">'+list.map(reviewCard).join('')+'</div>'
  }
  function highlightCard(icon,label,title,copy,tone){
    return '<div class="rp2-rv-highlight '+(tone||'')+'"><div class="rp2-rv-highlight-icon">'+icon+'</div><div class="rp2-rv-highlight-label">'+esc(label)+'</div><div class="rp2-rv-highlight-title">'+esc(title)+'</div><div class="rp2-rv-highlight-copy">'+esc(copy)+'</div></div>'
  }
  function highlightCards(g){
    var h=g.highlights,top=g.allThemes.filter(function(t){return t.count>0})[0]||null;
    return '<div class="rp2-rv-highlight-grid">'
      +highlightCard('⭐','Strongest review',h.best?(n(h.best.stars)+' stars · '+(h.best.customer||h.best.platform)):'No review yet',reviewSnippet(h.best,170),'gold')
      +highlightCard('📝','Most detailed positive review',h.detailed?(String(h.detailed.msg||'').length+' written characters'):'No detailed positive review yet',reviewSnippet(h.detailed,170),'good')
      +highlightCard('🔥','Recognition pattern',top?(top.name+' leads with '+top.count+' mentions'):(h.streak?(h.streak+'-review positive streak'):'Pattern still forming'),top?('Customers repeatedly recognize '+top.name.toLowerCase()+'.'):('Longest positive rated-review streak: '+h.streak+'.'),'')
      +'</div>'
  }
  function overviewView(g){
    return sectionHead('Service quality story','What customers consistently value','This interpretation uses active reviews assigned to your profile through the selected reporting point. Removed and unresolved duplicate rows are excluded by the manager review feed.')
      +'<div class="rp2-rv-summary"><div class="rp2-rv-summary-label">Customer voice interpretation</div><div class="rp2-rv-summary-title">'+esc(g.story.title)+'</div><div class="rp2-rv-summary-copy">'+esc(g.story.copy)+'</div></div>'
      +sectionHead('Review trajectory','How customer feedback is arriving over time','Bars show review count by selected-quarter week. The line shows average star rating for weeks with rated reviews.')
      +'<div class="rp2-rv-overview-grid"><div class="rp2-rv-panel"><div class="rp2-rv-panel-title">Weekly review trend</div><div class="rp2-rv-panel-sub">Active reviews assigned to you inside the selected quarter-through-week window.</div><div class="rp2-rv-chart"><canvas id="rp2-rv-chart"></canvas></div></div><div class="rp2-rv-panel"><div class="rp2-rv-panel-title">Top praise themes</div><div class="rp2-rv-panel-sub">A review can contribute to more than one transparent keyword-based theme.</div>'+themeBars(g.periodThemes,g.period.count,6)+'</div></div>'
      +sectionHead('Recognition highlights','The customer comments worth remembering','These highlights surface the strongest, most detailed, and most repeated positive signals in the active review history.')
      +highlightCards(g)
      +sectionHead('Latest customer voice','Recent feedback in the selected reporting window','Open any review to see the full comment, detected themes, and the recognition signals it contributes.')
      +latestFeed(g.periodList,3)
  }
  function voiceView(g){
    var platforms=Object.keys(g.period.platforms).sort(),themes=g.periodThemes.filter(function(t){return t.count>0});
    return sectionHead('Customer voice','Read the actual feedback','Search and filter the active reviews assigned to you in the selected quarter-through-week window.')
      +'<div class="rp2-rv-filterbar">'
        +'<input id="rp2-rv-search" type="search" placeholder="Search customer, comment, platform…" oninput="_rp2ReviewApplyFilters()">'
        +'<select id="rp2-rv-platform" onchange="_rp2ReviewApplyFilters()"><option value="">All platforms</option>'+platforms.map(function(p){return '<option value="'+esc(p.toLowerCase())+'">'+esc(p)+'</option>'}).join('')+'</select>'
        +'<select id="rp2-rv-rating" onchange="_rp2ReviewApplyFilters()"><option value="">All ratings</option><option value="5">5 stars</option><option value="4">4+ stars</option><option value="3">3 stars or lower</option><option value="0">Unrated</option></select>'
        +'<select id="rp2-rv-theme" onchange="_rp2ReviewApplyFilters()"><option value="">All praise themes</option>'+themes.map(function(t){return '<option value="'+esc(t.id)+'">'+t.icon+' '+esc(t.name)+'</option>'}).join('')+'</select>'
        +'<div id="rp2-rv-filtercount" class="rp2-rv-filtercount">'+g.periodList.length+' shown</div>'
      +'</div>'
      +(g.periodList.length?'<div class="rp2-rv-feed">'+g.periodList.map(reviewCard).join('')+'</div>':'<div class="rp2-rv-empty"><strong>No active reviews fall in this selected period</strong><span>Use Recognition or Review History to see the rep’s all-time review record.</span></div>')
  }
  function themesView(g){
    var available=g.periodThemes.filter(function(t){return t.count>0});
    return sectionHead('Praise themes','What customers repeatedly compliment','Themes are visible keyword groupings. They organize customer language without changing or inventing the original review text.')
      +(available.length?'<div class="rp2-rv-theme-grid">'+available.map(function(t,i){
        var sample=t.reviews.slice().sort(function(a,b){return n(b.stars)-n(a.stars)||String(b.msg||'').length-String(a.msg||'').length})[0]||null;
        return '<div class="rp2-rv-theme-card '+(i===0?'top':'')+'"><div class="rp2-rv-theme-icon">'+t.icon+'</div><div class="rp2-rv-theme-name">'+esc(t.name)+'</div><div class="rp2-rv-theme-value">'+t.count+'</div><div class="rp2-rv-theme-copy">'+(sample?('Example: “'+esc(reviewSnippet(sample,145))+'”'):'No written example available.')+'</div></div>'
      }).join('')+'</div>':'<div class="rp2-rv-empty"><strong>No selected-period praise themes detected</strong><span>The active reviews may not contain written comments or recognizable theme language yet.</span></div>')
      +sectionHead('Theme guide','How the system groups customer language','Each theme uses a visible list of common phrases. A single review can match several themes because customer praise is often multidimensional.')
      +'<div class="rp2-rv-theme-grid">'+THEME_DEFS.map(function(t){
        return '<div class="rp2-rv-theme-card"><div class="rp2-rv-theme-icon">'+t.icon+'</div><div class="rp2-rv-theme-name">'+esc(t.name)+'</div><div class="rp2-rv-theme-copy">Looks for phrases such as '+esc(t.words.slice(0,5).join(', '))+'.</div></div>'
      }).join('')+'</div>'
  }
  function recognitionView(g){
    var recent5=g.highlights.recent5,mentions=g.highlights.mentions;
    return '<div class="rp2-rv-achievement-summary"><div><div class="rp2-rv-achievement-big">'+g.earned+'/'+g.badges.length+'<small>Recognition milestones earned</small></div></div><div class="rp2-rv-achievement-copy">Recognition uses the rep’s all-time active review history, not only the currently selected quarter. Every milestone shows its exact threshold.</div></div>'
      +sectionHead('Recognition vault','Customer-service achievements','Earned and locked milestones remain visible so the rep can see what the next recognition level requires.')
      +'<div class="rp2-rv-badge-grid">'+g.badges.map(function(b){
        return '<div class="rp2-rv-badge '+(b.earned?'earned':'locked')+'"><div class="rp2-rv-badge-icon">'+b.icon+'</div><div class="rp2-rv-badge-state">'+(b.earned?'Earned':'Locked')+'</div><div class="rp2-rv-badge-name">'+esc(b.name)+'</div><div class="rp2-rv-badge-copy">'+esc(b.copy)+'</div></div>'
      }).join('')+'</div>'
      +sectionHead('Career recognition highlights','The strongest signals across your full review history','These are all-time customer-recognition markers rather than selected-period metrics.')
      +'<div class="rp2-rv-highlight-grid">'
        +highlightCard('🌟','Most recent 5-star review',recent5?displayDate(recent5.date):'No five-star review yet',reviewSnippet(recent5,170),'gold')
        +highlightCard('📣','Named recognition',mentions.length+' review'+(mentions.length===1?'':'s')+' mention you by name',mentions.length?reviewSnippet(mentions[0],170):'No written review has clearly mentioned your first or full name yet.','good')
        +highlightCard('🔥','Longest positive streak',g.highlights.streak+' consecutive review'+(g.highlights.streak===1?'':'s'),g.highlights.streak?'Rated reviews at four stars or higher without a lower-rated interruption.':'No rated positive streak yet.','')
      +'</div>'
  }
  function historyView(g){
    if(!g.allRows.length)return '<div class="rp2-rv-empty"><strong>No active review history is assigned to this rep</strong><span>Assigned active reviews will appear here automatically.</span></div>';
    return sectionHead('Review history','Your complete active customer-review record','This is all-time history across the review feed, after manager duplicate decisions, removals, and rep-assignment overrides.')
      +'<div class="rp2-rv-panel"><div class="rp2-rv-history"><div class="rp2-rv-history-head"><div>Date</div><div>Rating</div><div>Customer / Source</div><div>Comment</div></div>'
      +g.allRows.map(function(r){
        return '<button class="rp2-rv-history-row" onclick="_rp2ReviewOpen(\''+encodeURIComponent(r.id)+'\')"><div class="rp2-rv-history-cell">'+displayDate(r.date)+'</div><div class="rp2-rv-history-cell strong">'+esc(stars(r.stars))+'</div><div class="rp2-rv-history-cell strong">'+esc(r.customer||'Customer not named')+' · '+esc(r.platform||'Other')+'</div><div class="rp2-rv-history-msg">'+esc(reviewSnippet(r,260))+'</div></button>'
      }).join('')+'</div></div>'
  }
  function findReview(g,encoded){
    var id=decodeURIComponent(encoded||'');
    return g.allRows.filter(function(r){return String(r.id)===id})[0]||null
  }
  function detailSignals(r,g){
    var out=[],ts=themesForReview(r);
    if(n(r.stars)>=5)out.push('Five-star customer recognition');
    else if(n(r.stars)>=4)out.push('Positive rated review');
    if(ts.length)out.push('Contributes to '+ts.length+' praise theme'+(ts.length===1?'':'s')+': '+ts.map(function(id){var t=THEME_DEFS.filter(function(x){return x.id===id})[0];return t?t.name:id}).join(', '));
    var mentioned=g.highlights.mentions.some(function(x){return x.id===r.id});
    if(mentioned)out.push('Mentions you by name in the written review');
    if(r.pays)out.push('Review source is Google or Trustpilot in the current manager payout logic');
    if(!out.length)out.push('This review contributes to the customer-voice history even though it does not trigger a current recognition signal');
    return out
  }
  function drawer(g){
    if(!window._rp2ReviewOpenId)return '';
    var r=findReview(g,window._rp2ReviewOpenId);
    if(!r)return '';
    var ts=themesForReview(r),signals=detailSignals(r,g);
    return '<div class="rp2-rv-drawer-wrap" onclick="if(event.target===this)_rp2ReviewClose()"><aside class="rp2-rv-drawer">'
      +'<div class="rp2-rv-drawer-head"><div><div class="rp2-rv-drawer-kick">Customer review detail · '+esc(r.platform||'Other')+'</div><div class="rp2-rv-drawer-stars">'+esc(stars(r.stars))+'</div><div class="rp2-rv-drawer-title">'+esc(r.customer||'Customer not named')+'</div><div class="rp2-rv-drawer-sub">'+displayDate(r.date)+' · Assigned to '+esc(g.rep)+'</div></div><button class="rp2-rv-close" onclick="_rp2ReviewClose()">×</button></div>'
      +'<div class="rp2-rv-detail-kpis">'
        +'<div class="rp2-rv-detail-kpi"><span>Rating</span><strong>'+(n(r.stars)?n(r.stars).toFixed(1)+' / 5':'Unrated')+'</strong></div>'
        +'<div class="rp2-rv-detail-kpi"><span>Platform</span><strong>'+esc(r.platform||'Other')+'</strong></div>'
        +'<div class="rp2-rv-detail-kpi"><span>Praise themes</span><strong>'+ts.length+'</strong></div>'
        +'<div class="rp2-rv-detail-kpi"><span>Recognition source</span><strong>'+(r.pays?'Google / Trustpilot':'Other source')+'</strong></div>'
      +'</div>'
      +'<div class="rp2-rv-detail-section"><div class="rp2-rv-detail-title">Full customer comment</div><div class="rp2-rv-detail-copy">'+esc(r.msg||'No written comment was provided with this review.')+'</div></div>'
      +'<div class="rp2-rv-detail-section"><div class="rp2-rv-detail-title">Detected praise themes</div><div class="rp2-rv-card-themes">'+(ts.length?ts.map(function(id){var t=THEME_DEFS.filter(function(x){return x.id===id})[0];return '<span class="rp2-rv-theme-tag">'+(t?t.icon+' '+esc(t.name):esc(id))+'</span>'}).join(''):'<span class="rp2-rv-theme-tag">No detected praise theme</span>')+'</div><div class="rp2-rv-detail-copy">Theme detection is a transparent keyword grouping and does not rewrite or summarize the customer’s original words.</div></div>'
      +'<div class="rp2-rv-detail-section"><div class="rp2-rv-detail-title">Recognition signals from this review</div><div class="rp2-rv-signal-list">'+signals.map(function(s){return '<div class="rp2-rv-signal">'+esc(s)+'</div>'}).join('')+'</div></div>'
      +'<div class="rp2-rv-detail-section"><div class="rp2-rv-detail-copy">Data note: this page uses the active manager-side review feed after duplicate decisions, removals, and rep-assignment overrides. It does not display reviews removed from the active feed.</div></div>'
      +'</aside></div>'
  }

  window._rp2ReviewSetTab=function(id){
    window._rp2ReviewTab=id;window._rp2ReviewOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ReviewsV2();
    var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
    setTimeout(function(){try{window._rp2ReviewsDraw();window._rp2ReviewApplyFilters()}catch(e){}},0)
  };
  window._rp2ReviewOpen=function(id){
    window._rp2ReviewOpenId=id;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ReviewsV2();
    setTimeout(function(){try{window._rp2ReviewsDraw();window._rp2ReviewApplyFilters()}catch(e){}},0)
  };
  window._rp2ReviewClose=function(){
    window._rp2ReviewOpenId=null;
    var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ReviewsV2();
    setTimeout(function(){try{window._rp2ReviewsDraw();window._rp2ReviewApplyFilters()}catch(e){}},0)
  };
  window._rp2ReviewApplyFilters=function(){
    try{
      var q=((document.getElementById('rp2-rv-search')||{}).value||'').toLowerCase().trim();
      var p=((document.getElementById('rp2-rv-platform')||{}).value||'').toLowerCase();
      var rating=((document.getElementById('rp2-rv-rating')||{}).value||'');
      var theme=((document.getElementById('rp2-rv-theme')||{}).value||'');
      var cards=safeArray(document.querySelectorAll?document.querySelectorAll('#rp2-page [data-rv-review="1"]'):[]),shown=0;
      cards.forEach(function(card){
        var search=String(card.getAttribute('data-search')||''),cp=String(card.getAttribute('data-platform')||''),cr=n(card.getAttribute('data-rating')),ct=String(card.getAttribute('data-themes')||'').split(',');
        var ok=(!q||search.indexOf(q)>=0)&&(!p||cp===p)&&(!theme||ct.indexOf(theme)>=0);
        if(rating==='5')ok=ok&&cr===5;
        else if(rating==='4')ok=ok&&cr>=4;
        else if(rating==='3')ok=ok&&cr>0&&cr<=3;
        else if(rating==='0')ok=ok&&cr===0;
        card.style.display=ok?'grid':'none';if(ok)shown++
      });
      var count=document.getElementById('rp2-rv-filtercount');if(count)count.textContent=shown+' shown'
    }catch(e){}
  };

  window._rp2ReviewsV2=function(){
    try{
      var g=build(),tab=window._rp2ReviewTab,top=g.periodThemes.filter(function(t){return t.count>0})[0]||null;
      var qLabel=g.ctx.q+' '+g.ctx.year,selectedLabel=g.ctx.selected?(g.ctx.selected.label||g.ctx.selected.key):'Selected reporting point';
      var hero='<div class="rp2-rv-hero"><div class="rp2-rv-hero-grid"><div><div class="rp2-rv-kick">Customer Reviews 2.0 · BUILD v498</div><div class="rp2-rv-title">Your customers are telling you what works</div><div class="rp2-rv-copy">Turn customer feedback into recognition, service-quality intelligence, and a clearer understanding of what people consistently value about working with you.</div><div class="rp2-rv-pills"><span class="rp2-rv-pill">'+esc(qLabel)+'</span><span class="rp2-rv-pill">'+esc(selectedLabel)+'</span><span class="rp2-rv-pill '+(g.period.avg>=4.5?'good':'gold')+'">'+(g.period.rated?g.period.avg.toFixed(1)+' ★ average':'No rated reviews')+'</span></div></div>'
        +'<div class="rp2-rv-brief"><div><div class="rp2-rv-brief-label">Selected-period customer voice</div><div class="rp2-rv-brief-value">'+g.period.count+'</div><div class="rp2-rv-brief-title">'+esc(g.story.title)+'</div><div class="rp2-rv-brief-copy">'+esc(g.story.copy)+'</div></div><div class="rp2-rv-brief-foot"><span>All-time active reviews <strong>'+g.all.count+'</strong></span><span>Recognition milestones <strong>'+g.earned+'/'+g.badges.length+'</strong></span></div></div>'
        +'</div></div>';

      var kpis='<div class="rp2-rv-kpis">'
        +kpi('Selected-period reviews',String(g.period.count),deltaText(g.period.count,g.prior.count,'prior-quarter equivalent'))
        +kpi('Average rating',g.period.rated?g.period.avg.toFixed(1)+' ★':'—',g.period.rated+' rated review'+(g.period.rated===1?'':'s'))
        +kpi('5-star reviews',String(g.period.five),g.period.count?Math.round(g.period.five/g.period.count*100)+'% of selected-period reviews':'No reviews')
        +kpi('Positive rate',g.period.rated?Math.round(g.period.positiveRate)+'%':'—','Rated reviews at 4 stars or higher')
        +kpi('Top praise theme',top?esc(top.name):'—',top?(top.count+' matching review'+(top.count===1?'':'s')):'No detected written theme')
        +kpi('All-time active reviews',String(g.all.count),g.all.rated?(g.all.avg.toFixed(1)+' ★ career average'):'No career rating average')
        +'</div>';

      var content=tab==='voice'?voiceView(g):tab==='themes'?themesView(g):tab==='recognition'?recognitionView(g):tab==='history'?historyView(g):overviewView(g);
      return '<div class="rp2-rv-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+drawer(g)
    }catch(e){
      console.error('[Customer Reviews 2.0 render error]',e);
      return '<div class="rp2-rv-shell"><div class="rp2-rv-hero"><div class="rp2-rv-kick">Customer Reviews 2.0 · RECOVERY MODE</div><div class="rp2-rv-title">The reviews page hit a data compatibility issue</div><div class="rp2-rv-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2ReviewsDraw=function(){
    if(typeof Chart!=='function'||window._rp2ReviewTab!=='overview')return;
    var canvas=document.getElementById('rp2-rv-chart');if(!canvas)return;
    var g=build();
    if(_rp2.reviewsChart){try{_rp2.reviewsChart.destroy()}catch(e){}}
    _rp2.reviewsChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{
        labels:g.series.map(function(x){return 'Wk '+(x.week&&x.week.num!=null?x.week.num:'')}),
        datasets:[
          {type:'bar',label:'Reviews',data:g.series.map(function(x){return x.count}),backgroundColor:'rgba(250,135,61,.70)',borderRadius:6,yAxisID:'count'},
          {type:'line',label:'Average rating',data:g.series.map(function(x){return x.avg}),borderColor:'#f5be64',pointRadius:3,tension:.25,yAxisID:'rating'}
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},
          tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label==='Average rating'?(' Average rating: '+Number(ctx.parsed.y||0).toFixed(1)):(' Reviews: '+ctx.parsed.y)}}}
        },
        scales:{
          x:{ticks:{color:'#8b95a7',font:{size:10}},grid:{display:false}},
          count:{beginAtZero:true,ticks:{color:'#8b95a7',font:{size:10},precision:0},grid:{color:'rgba(255,255,255,.05)'}},
          rating:{position:'right',min:0,max:5,ticks:{color:'#8b95a7',stepSize:1,callback:function(v){return v+'★'}},grid:{display:false}}
        }
      }
    })
  };

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='reviews')setTimeout(function(){try{_rp2Go('reviews')}catch(e){}},0)
  }catch(e){}
})();
