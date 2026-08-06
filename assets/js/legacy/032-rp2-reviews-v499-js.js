
(function(){
  var TABS=[
    {id:'overview',label:'Lifetime Intelligence',icon:'◫'},
    {id:'voice',label:'Customer Voice',icon:'✦'},
    {id:'themes',label:'Praise DNA',icon:'◇'},
    {id:'recognition',label:'Recognition',icon:'🏅'},
    {id:'history',label:'Review History',icon:'◷'}
  ];
  window._rp2ReviewTab=window._rp2ReviewTab||'overview';
  window._rp2ReviewOpenId=window._rp2ReviewOpenId||null;

  var THEMES=[
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
      if(typeof _rvDate==='function'){
        var rd=_rvDate(v);if(rd&&!isNaN(rd.getTime()))return rd
      }
    }catch(e){}
    try{
      var d=v instanceof Date?new Date(v.getTime()):new Date(v);
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
  function platform(v){
    try{if(typeof _rvPlatform==='function')return _rvPlatform(v)}catch(e){}
    var s=String(v||'').toLowerCase();
    if(s.indexOf('google')>=0)return 'Google';
    if(s.indexOf('trust')>=0)return 'Trustpilot';
    if(s.indexOf('face')>=0)return 'Facebook';
    return v?String(v):'Other'
  }
  function hash(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').replace(/[^\w ]/g,'').trim()}
  function rid(r){
    if(r&&r.id!=null)return String(r.id);
    try{if(typeof _rvRowId==='function')return String(_rvRowId(r))}catch(e){}
    return hash(r&&r.rep)+'|'+hash(r&&r.custName)+'|'+String(r&&r.ts||'').slice(0,16)+'|'+hash(r&&r.msg).slice(0,40)
  }
  function stars(v){
    var x=Math.max(0,Math.min(5,Math.round(n(v)))),s='';for(var i=0;i<5;i++)s+=i<x?'★':'☆';return s||'Unrated'
  }
  function themeDef(id){return THEMES.filter(function(t){return t.id===id})[0]||null}
  function themeIds(r){
    var s=String(r&&r.msg||'').toLowerCase(),out=[];
    THEMES.forEach(function(t){if(t.words.some(function(w){return s.indexOf(w)>=0}))out.push(t.id)});
    return out
  }
  function currentContext(){
    var c=null;try{c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null}catch(e){}
    var year=Number(getYr()),q=getQ(),month='';
    try{month=String(getM()||'')}catch(e){}
    var ws=[];try{ws=safeArray(c&&c.wks&&c.wks.length?c.wks:gwq(year,q))}catch(e){ws=[]}
    var selected=null;try{selected=c&&c.selected?c.selected:(typeof _rp2SelectedWeek==='function'?_rp2SelectedWeek():null)}catch(e){}
    if(!selected&&typeof getCWK==='function'){
      try{var key=getCWK();selected=ws.filter(function(w){return w&&w.key===key})[0]||null}catch(e){}
    }
    return {c:c,year:year,q:q,month:month,wks:ws,selected:selected}
  }
  function activeReviews(rep){
    try{
      if(typeof _rvEnriched==='function'&&typeof _rvActive==='function'){
        return safeArray(_rvActive(_rvEnriched())).filter(function(x){return x&&x.matched&&x.repName===rep}).map(function(x){
          var raw=x.raw||{},r={
            id:String(x.id),raw:raw,date:x.date||dval(raw.ts),platform:x.platform||platform(raw.type),
            stars:n(raw.stars),msg:String(raw.msg||''),customer:String(raw.custName||raw.custId||''),
            email:String(raw.email||''),pays:!!x.pays
          };r.themes=themeIds(r);return r
        })
      }
    }catch(e){console.warn('[Reviews v499] manager active feed unavailable',e)}

    var R=S&&S.reviews||{},rows=safeArray(R.rows),dec=R.decisions||{},rf=R.repFix||{},seen={};
    return rows.map(function(raw){
      if(!raw)return null;
      var id=rid(raw),msgHash=hash(raw.msg),decision=dec[id]||null,isDup=false;
      if(msgHash&&msgHash.length>4){if(seen[msgHash])isDup=true;else seen[msgHash]=id}
      if(decision==='removed')return null;
      if(isDup&&decision!=='approved')return null;
      var assigned=Object.prototype.hasOwnProperty.call(rf,id)?rf[id]:raw.rep;
      if(assigned!==rep)return null;
      var r={id:id,raw:raw,date:dval(raw.ts),platform:platform(raw.type),stars:n(raw.stars),msg:String(raw.msg||''),customer:String(raw.custName||raw.custId||''),email:String(raw.email||''),pays:(platform(raw.type)==='Google'||platform(raw.type)==='Trustpilot')};
      r.themes=themeIds(r);return r
    }).filter(Boolean)
  }
  function agg(rows){
    var rated=rows.filter(function(r){return n(r.stars)>0}),five=rows.filter(function(r){return n(r.stars)>=5}),positive=rows.filter(function(r){return n(r.stars)>=4});
    return {
      rows:rows,count:rows.length,rated:rated.length,
      avg:rated.length?rated.reduce(function(s,r){return s+n(r.stars)},0)/rated.length:0,
      five:five.length,positive:positive.length,positiveRate:rated.length?positive.length/rated.length*100:0
    }
  }
  function themeAgg(rows){
    var map={};THEMES.forEach(function(t){map[t.id]={id:t.id,name:t.name,icon:t.icon,count:0,reviews:[],years:{}}});
    rows.forEach(function(r){
      (r.themes||[]).forEach(function(id){
        var x=map[id];if(!x)return;
        x.count++;x.reviews.push(r);if(r.date)x.years[r.date.getFullYear()]=1
      })
    });
    return Object.keys(map).map(function(k){var x=map[k];x.yearCount=Object.keys(x.years).length;return x}).sort(function(a,b){return b.count-a.count||b.yearCount-a.yearCount||a.name.localeCompare(b.name)})
  }
  function allTimeOrders(rep){
    var primary=safeArray(S&&S.orders).filter(function(o){return o&&o.rep===rep&&o.kind==='order'});
    if(primary.length)return primary.length;
    var total=0,seen={};
    try{
      Object.keys((S&&S.data)||{}).forEach(function(k){
        if(k.indexOf(rep+'|')!==0)return;
        if(seen[k])return;seen[k]=1;total+=n(S.data[k]&&S.data[k].orders)
      })
    }catch(e){}
    return total
  }
  function allTimeRevenue(rep){
    var total=0;try{Object.keys((S&&S.data)||{}).forEach(function(k){if(k.indexOf(rep+'|')===0)total+=n(S.data[k]&&S.data[k].revenue)})}catch(e){}
    return total
  }
  function mentionRows(rows,rep){
    var full=String(rep||'').toLowerCase(),first=full.split(/\s+/)[0]||'';
    return rows.filter(function(r){
      var s=String(r.msg||'').toLowerCase();
      return (full&&s.indexOf(full)>=0)||(first.length>=3&&s.indexOf(first)>=0)
    })
  }
  function positiveStreak(rows){
    var sorted=rows.filter(function(r){return n(r.stars)>0}).slice().sort(function(a,b){return (a.date?a.date.getTime():0)-(b.date?b.date.getTime():0)}),best=0,cur=0;
    sorted.forEach(function(r){if(n(r.stars)>=4){cur++;best=Math.max(best,cur)}else cur=0});
    return best
  }
  function lifetimeIdentity(g){
    if(!g.life.count)return {title:'Your customer-service identity is still waiting for its first active review',copy:'As reviews are assigned to your profile, the lifetime engine will build a durable picture of what customers consistently value about working with you.'};
    var top=g.lifeThemes.filter(function(t){return t.count>0})[0]||null,second=g.lifeThemes.filter(function(t){return t.count>0})[1]||null;
    var pieces=[];
    pieces.push('Across '+g.life.count+' active review'+(g.life.count===1?'':'s')+', your recorded customer sentiment is '+(g.life.rated?g.life.avg.toFixed(1)+' stars':'not consistently rated')+'.');
    if(top)pieces.push('Your strongest lifetime praise signal is '+top.name.toLowerCase()+(second?(', followed by '+second.name.toLowerCase()):'')+'.');
    if(top&&top.yearCount>=2)pieces.push(top.name+' has appeared across '+top.yearCount+' different years, making it a durable strength rather than a one-period spike.');
    if(g.orders>=10)pieces.push('You have '+g.life.count+' reviews across '+g.orders+' recorded primary orders, equal to about '+(g.life.count/g.orders*100).toFixed(1)+' reviews per 100 orders.');
    return {title:top?('Your lifetime customer identity is built around '+top.name.toLowerCase()):'Your customer-service identity is still forming',copy:pieces.join(' ')}
  }
  function splitThenNow(rows){
    var sorted=rows.filter(function(r){return r.date}).slice().sort(function(a,b){return a.date-b.date});
    if(sorted.length<4)return {then:[],now:[]};
    var size=Math.max(2,Math.ceil(sorted.length/3));
    return {then:sorted.slice(0,size),now:sorted.slice(-size)}
  }
  function topThemeName(rows){
    var t=themeAgg(rows).filter(function(x){return x.count>0})[0];return t?t.name:'No dominant theme yet'
  }
  function evolution(g){
    var s=splitThenNow(g.rows),thenAgg=agg(s.then),nowAgg=agg(s.now),thenTheme=topThemeName(s.then),nowTheme=topThemeName(s.now);
    var copy='Your earlier customer feedback centered on '+thenTheme.toLowerCase()+'. More recent feedback centers on '+nowTheme.toLowerCase()+'.';
    if(thenTheme===nowTheme)copy=thenTheme+' has remained the leading theme from your earlier reviews through your most recent feedback, suggesting a durable service identity.';
    if(thenAgg.rated&&nowAgg.rated)copy+=' Average rating moved from '+thenAgg.avg.toFixed(1)+' to '+nowAgg.avg.toFixed(1)+' stars across these two comparable slices.';
    return {then:s.then,now:s.now,thenTheme:thenTheme,nowTheme:nowTheme,copy:copy}
  }
  function trendThemes(rows){
    var dated=rows.filter(function(r){return r.date}).slice().sort(function(a,b){return a.date-b.date});
    if(dated.length<4)return {durable:[],emerging:[],fading:[]};
    var split=Math.floor(dated.length/2),older=dated.slice(0,split),recent=dated.slice(split);
    var oldMap={},newMap={};
    themeAgg(older).forEach(function(t){oldMap[t.id]=t});
    themeAgg(recent).forEach(function(t){newMap[t.id]=t});
    var all=themeAgg(rows),em=[],fade=[],dur=[];
    all.forEach(function(t){
      if(!t.count)return;
      var op=older.length?n(oldMap[t.id]&&oldMap[t.id].count)/older.length:0;
      var np=recent.length?n(newMap[t.id]&&newMap[t.id].count)/recent.length:0;
      var delta=np-op;
      var item={id:t.id,name:t.name,icon:t.icon,count:t.count,yearCount:t.yearCount,delta:delta,oldShare:op,newShare:np};
      if(t.yearCount>=2&&t.count>=3)dur.push(item);
      if(delta>=.12&&n(newMap[t.id]&&newMap[t.id].count)>=2)em.push(item);
      if(delta<=-.12&&n(oldMap[t.id]&&oldMap[t.id].count)>=2)fade.push(item)
    });
    dur.sort(function(a,b){return b.yearCount-a.yearCount||b.count-a.count});
    em.sort(function(a,b){return b.delta-a.delta||b.count-a.count});
    fade.sort(function(a,b){return a.delta-b.delta||b.count-a.count});
    return {durable:dur,emerging:em,fading:fade}
  }
  function themePairs(rows){
    var map={};
    rows.forEach(function(r){
      var ts=(r.themes||[]).slice().sort();
      for(var i=0;i<ts.length;i++)for(var j=i+1;j<ts.length;j++){
        var key=ts[i]+'|'+ts[j],x=map[key]||(map[key]={ids:[ts[i],ts[j]],count:0,reviews:[]});
        x.count++;x.reviews.push(r)
      }
    });
    return Object.keys(map).map(function(k){return map[k]}).filter(function(x){return x.count>=2}).sort(function(a,b){return b.count-a.count})
  }
  function periodContextRows(rows,ctx){
    var sel=ctx.selected;
    if(sel){
      var s=dval(sel.start),e=dval(sel.end);return rows.filter(function(r){return r.date&&s&&e&&r.date>=s&&r.date<=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999)})
    }
    var yearRows=rows.filter(function(r){return r.date&&r.date.getFullYear()===ctx.year});
    return yearRows
  }
  function periodStory(g){
    var p=g.period,lt=g.life,pt=g.periodThemes.filter(function(t){return t.count>0})[0]||null,ltTop=g.lifeThemes.filter(function(t){return t.count>0})[0]||null;
    if(!p.count)return {
      title:'No active reviews fall inside the selected week',
      copy:'Your lifetime customer identity remains visible above. This period simply has no assigned active reviews to compare against it.'
    };
    var pieces=['The selected period contains '+p.count+' review'+(p.count===1?'':'s')+'.'];
    if(p.rated)pieces.push('Average rating is '+p.avg.toFixed(1)+' stars compared with your lifetime '+(lt.rated?lt.avg.toFixed(1):'unrated')+' baseline.');
    if(pt&&ltTop){
      if(pt.id===ltTop.id)pieces.push(pt.name+' is also the period’s leading theme, consistent with your lifetime #1 strength.');
      else pieces.push(pt.name+' leads this period, which differs from your lifetime #1 theme of '+ltTop.name.toLowerCase()+'.');
    }
    return {title:pt?('This period is being defined by '+pt.name.toLowerCase()):'This period adds customer voice without a dominant praise theme',copy:pieces.join(' ')}
  }
  function dateBucket(rows,level,ctx){
    var map={};
    rows.forEach(function(r){
      if(!r.date)return;
      var y=r.date.getFullYear(),m=r.date.getMonth()+1,key,label,order;
      if(level==='year'){key=String(y);label=String(y);order=y}
      else if(level==='quarter'){var q=Math.floor((m-1)/3)+1;key=y+'-Q'+q;label='Q'+q+' '+y;order=y*10+q}
      else if(level==='month'){key=y+'-'+String(m).padStart(2,'0');label=r.date.toLocaleString('en-US',{month:'short',year:'numeric'});order=y*100+m}
      else{
        var d=new Date(r.date.getFullYear(),r.date.getMonth(),r.date.getDate(),12),sun=new Date(d);sun.setDate(d.getDate()-d.getDay());
        key=iso(sun);label='Wk of '+sun.toLocaleString('en-US',{month:'short',day:'numeric'});order=sun.getTime()
      }
      var x=map[key]||(map[key]={key:key,label:label,order:order,rows:[]});x.rows.push(r)
    });
    return Object.keys(map).map(function(k){var x=map[k],a=agg(x.rows),t=themeAgg(x.rows).filter(function(z){return z.count>0})[0]||null;return {key:x.key,label:x.label,order:x.order,count:a.count,avg:a.avg,five:a.five,top:t?t.name:'—'}}).sort(function(a,b){return b.order-a.order})
  }
  function isSelectedBreak(x,level,ctx){
    if(level==='year')return x.key===String(ctx.year);
    if(level==='quarter')return x.key===String(ctx.year)+'-'+ctx.q;
    if(level==='month'&&ctx.month){
      var md=new Date(ctx.month+' 1, '+ctx.year);
      if(!isNaN(md))return x.key===ctx.year+'-'+String(md.getMonth()+1).padStart(2,'0')
    }
    if(level==='week'&&ctx.selected){
      var sd=dval(ctx.selected.start);if(sd){var sun=new Date(sd);sun.setDate(sd.getDate()-sd.getDay());return x.key===iso(sun)}
    }
    return false
  }
  function topReview(rows){
    return rows.slice().sort(function(a,b){return n(b.stars)-n(a.stars)||String(b.msg||'').length-String(a.msg||'').length})[0]||null
  }
  function detailSignals(r,g){
    var out=[];
    if(n(r.stars)>=5)out.push('Five-star customer recognition');
    else if(n(r.stars)>=4)out.push('Positive rated review');
    if((r.themes||[]).length)out.push('Contributes to '+r.themes.length+' praise theme'+(r.themes.length===1?'':'s')+': '+r.themes.map(function(id){var t=themeDef(id);return t?t.name:id}).join(', '));
    if(g.mentions.some(function(x){return x.id===r.id}))out.push('Mentions you by name in the written review');
    var pairs=themePairs([r]);if(pairs.length)out.push('Contains multiple praise themes in one review');
    if(!out.length)out.push('Contributes to the lifetime customer-voice history without triggering a current recognition milestone');
    return out
  }
  function achievements(g){
    var by={};g.lifeThemes.forEach(function(t){by[t.id]=t.count});
    return [
      {icon:'⭐',name:'First 5-Star Review',earned:g.life.five>=1,copy:'Receive your first active five-star review.'},
      {icon:'🌟',name:'Five 5-Star Reviews',earned:g.life.five>=5,copy:'Accumulate five active five-star reviews.'},
      {icon:'🏆',name:'Ten 5-Star Reviews',earned:g.life.five>=10,copy:'Accumulate ten active five-star reviews.'},
      {icon:'💛',name:'Customer Favorite',earned:g.life.count>=10&&g.life.avg>=4.8,copy:'Maintain at least a 4.8 average across 10+ rated reviews.'},
      {icon:'💬',name:'Communication Champion',earned:n(by.communication)>=3,copy:'Communication praise appears in at least three active reviews.'},
      {icon:'⚡',name:'Responsiveness Pro',earned:n(by.responsiveness)>=3,copy:'Responsiveness praise appears in at least three active reviews.'},
      {icon:'🛠',name:'Problem Solver',earned:n(by.problem)>=3,copy:'Problem-solving praise appears in at least three active reviews.'},
      {icon:'🔥',name:'Positive Review Streak',earned:g.streak>=5,copy:'Build a streak of five consecutive rated reviews at four stars or higher.'},
      {icon:'📣',name:'Named Recognition',earned:g.mentions.length>=3,copy:'Be mentioned by name in at least three active written reviews.'},
      {icon:'🌐',name:'Trusted Everywhere',earned:Object.keys(g.platforms).length>=2,copy:'Earn positive reviews across at least two review platforms.'},
      {icon:'📚',name:'25 Review Milestone',earned:g.life.count>=25,copy:'Accumulate 25 active reviews assigned to your profile.'},
      {icon:'✨',name:'Perfect Five',earned:g.life.rated>=5&&g.life.avg===5,copy:'Maintain a perfect 5.0 average across at least five rated reviews.'}
    ]
  }
  function build(){
    var rep=_rp2.rep,ctx=currentContext(),rows=activeReviews(rep).sort(function(a,b){return (b.date?b.date.getTime():0)-(a.date?a.date.getTime():0)});
    var life=agg(rows),lifeThemes=themeAgg(rows),orders=allTimeOrders(rep),revenue=allTimeRevenue(rep),mentions=mentionRows(rows,rep),streak=positiveStreak(rows),platforms={};
    rows.filter(function(r){return n(r.stars)>=4}).forEach(function(r){platforms[r.platform]=1});
    var periodRows=periodContextRows(rows,ctx),period=agg(periodRows),periodThemes=themeAgg(periodRows),evo=evolution({rows:rows}),trends=trendThemes(rows),pairs=themePairs(rows);
    var g={rep:rep,ctx:ctx,rows:rows,life:life,lifeThemes:lifeThemes,orders:orders,revenue:revenue,mentions:mentions,streak:streak,platforms:platforms,periodRows:periodRows,period:period,periodThemes:periodThemes,evolution:evo,trends:trends,pairs:pairs};
    g.identity=lifetimeIdentity(g);g.periodStory=periodStory(g);g.badges=achievements(g);g.earned=g.badges.filter(function(b){return b.earned}).length;
    g.yearBuckets=dateBucket(rows,'year',ctx);g.quarterBuckets=dateBucket(rows,'quarter',ctx);g.monthBuckets=dateBucket(rows,'month',ctx);g.weekBuckets=dateBucket(rows,'week',ctx);
    return g
  }

  function sectionHead(kick,title,note){return '<div class="rp2-rv3-section-head"><div><div class="rp2-rv3-section-kick">'+kick+'</div><div class="rp2-rv3-section-title">'+title+'</div></div><div class="rp2-rv3-section-note">'+note+'</div></div>'}
  function kpi(label,value,sub){return '<div class="rp2-rv3-kpi"><div class="rp2-rv3-kpi-label">'+esc(label)+'</div><div class="rp2-rv3-kpi-value">'+value+'</div><div class="rp2-rv3-kpi-sub">'+sub+'</div></div>'}
  function tabBar(active){return '<div class="rp2-rv3-tabs-wrap"><div class="rp2-rv3-tabs">'+TABS.map(function(t){return '<button class="rp2-rv3-tab '+(t.id===active?'active':'')+'" onclick="_rp2ReviewSetTab(\''+t.id+'\')">'+t.icon+' '+t.label+'</button>'}).join('')+'</div></div>'}
  function snippet(r,limit){
    if(!r)return 'No review available yet.';
    var s=String(r.msg||'').trim();if(!s)return 'No written comment was provided.';
    limit=limit||180;return s.length>limit?s.slice(0,limit-1)+'…':s
  }
  function themeBars(themes,limit){
    var rows=themes.filter(function(t){return t.count>0}).slice(0,limit||8),max=rows.length?rows[0].count:1;
    if(!rows.length)return '<div class="rp2-rv3-empty"><strong>No written praise themes detected</strong><span>Lifetime reviews may be unrated, contain no written comment, or use language outside the visible keyword groups.</span></div>';
    return '<div class="rp2-rv3-theme-list">'+rows.map(function(t){
      return '<div class="rp2-rv3-theme-row"><div class="rp2-rv3-theme-top"><span>'+t.icon+' '+esc(t.name)+' · '+t.yearCount+' year'+(t.yearCount===1?'':'s')+'</span><strong>'+t.count+' review'+(t.count===1?'':'s')+'</strong></div><div class="rp2-rv3-bar"><span style="width:'+Math.max(8,Math.round(t.count/max*100))+'%"></span></div></div>'
    }).join('')+'</div>'
  }
  function insight(icon,label,title,copy,tone){
    return '<div class="rp2-rv3-insight '+(tone||'')+'"><div class="rp2-rv3-insight-icon">'+icon+'</div><div class="rp2-rv3-insight-label">'+esc(label)+'</div><div class="rp2-rv3-insight-title">'+esc(title)+'</div><div class="rp2-rv3-insight-copy">'+esc(copy)+'</div></div>'
  }
  function trendCard(kind,list){
    var x=list[0];
    if(!x){
      var msg=kind==='Durable strength'?'No theme has enough cross-year history yet.':kind==='Emerging strength'?'No clear emerging theme is strong enough to call yet.':'No clearly fading theme is strong enough to call yet.';
      return insight(kind==='Durable strength'?'🧱':kind==='Emerging strength'?'↗':'↘',kind,'Still forming',msg,kind==='Emerging strength'?'good':'')
    }
    var copy;
    if(kind==='Durable strength')copy=x.name+' appears across '+x.yearCount+' years and '+x.count+' active reviews.';
    else if(kind==='Emerging strength')copy=x.name+' is appearing much more often in the newer half of your review history than the older half.';
    else copy=x.name+' appeared more often earlier in your review history than it does in the newer half.';
    return insight(kind==='Durable strength'?'🧱':kind==='Emerging strength'?'↗':'↘',kind,x.name,copy,kind==='Emerging strength'?'good':kind==='Fading strength'?'warn':'gold')
  }
  function pairList(g){
    if(!g.pairs.length)return '<div class="rp2-rv3-empty"><strong>No repeated praise combinations yet</strong><span>When customers repeatedly mention two strengths together, the connection will appear here.</span></div>';
    return '<div class="rp2-rv3-pair-list">'+g.pairs.slice(0,6).map(function(p){
      var a=themeDef(p.ids[0]),b=themeDef(p.ids[1]);
      return '<div class="rp2-rv3-pair"><div class="rp2-rv3-pair-name">'+(a?a.icon+' '+esc(a.name):esc(p.ids[0]))+' + '+(b?b.icon+' '+esc(b.name):esc(p.ids[1]))+'<small>Customers repeatedly recognize these strengths in the same review.</small></div><div class="rp2-rv3-pair-val">'+p.count+'×</div></div>'
    }).join('')+'</div>'
  }
  function periodExplorer(g){
    var p=g.period,pt=g.periodThemes.filter(function(t){return t.count>0})[0]||null,sel=g.ctx.selected,label=sel?(sel.label||sel.key):(g.ctx.q+' '+g.ctx.year);
    return sectionHead('Period drill-down','Explore a Period','The top of this page always stays lifetime-first. The existing Year / Quarter / Month / Week selectors control this drill-down section and show how the selected period compares with your lifetime identity.')
      +'<div class="rp2-rv3-period"><div class="rp2-rv3-period-grid"><div class="rp2-rv3-period-story"><div class="rp2-rv3-period-kick">'+esc(label)+'</div><div class="rp2-rv3-period-title">'+esc(g.periodStory.title)+'</div><div class="rp2-rv3-period-copy">'+esc(g.periodStory.copy)+'</div></div>'
      +'<div class="rp2-rv3-period-stat"><span>Reviews</span><strong>'+p.count+'</strong><small>'+((g.life.count&&p.count)?Math.round(p.count/g.life.count*100)+'% of lifetime history':'No selected-period reviews')+'</small></div>'
      +'<div class="rp2-rv3-period-stat"><span>Average rating</span><strong>'+(p.rated?p.avg.toFixed(1)+' ★':'—')+'</strong><small>'+(g.life.rated?('Lifetime '+g.life.avg.toFixed(1)+' ★'):'Lifetime baseline unavailable')+'</small></div>'
      +'<div class="rp2-rv3-period-stat"><span>5-star</span><strong>'+p.five+'</strong><small>'+(p.count?Math.round(p.five/p.count*100)+'% of period reviews':'No period reviews')+'</small></div>'
      +'<div class="rp2-rv3-period-stat"><span>Top theme</span><strong>'+esc(pt?pt.name:'—')+'</strong><small>'+(pt?pt.count+' matching review'+(pt.count===1?'':'s'):'No dominant theme')+'</small></div>'
      +'</div></div>'
  }
  function breakCard(title,level,buckets,g){
    var rows=buckets.slice(0,14);
    return '<div class="rp2-rv3-break-card"><div class="rp2-rv3-break-title">'+esc(title)+'<span>'+rows.length+' periods</span></div><div class="rp2-rv3-break-list">'
      +(rows.length?rows.map(function(x){
        return '<div class="rp2-rv3-break-row '+(isSelectedBreak(x,level,g.ctx)?'active':'')+'"><div class="rp2-rv3-break-main">'+esc(x.label)+'<small>'+x.count+' reviews · '+(x.avg?x.avg.toFixed(1)+' ★':'unrated')+' · '+esc(x.top)+'</small></div><div class="rp2-rv3-break-val">'+x.five+'× 5★</div></div>'
      }).join(''):'<div class="rp2-rv3-empty"><strong>No data</strong><span>No dated reviews are available for this level.</span></div>')
      +'</div></div>'
  }
  function historicalBreakdown(g){
    return sectionHead('Historical breakdown','Lifetime → Year → Quarter → Month → Week','Use the top selectors to highlight the current path while keeping the full lifetime history visible for comparison.')
      +'<div class="rp2-rv3-breakdown">'
      +breakCard('By Year','year',g.yearBuckets,g)
      +breakCard('By Quarter','quarter',g.quarterBuckets,g)
      +breakCard('By Month','month',g.monthBuckets,g)
      +breakCard('By Week','week',g.weekBuckets,g)
      +'</div>'
  }
  function reviewCard(r){
    var ts=r.themes||[],search=(r.msg+' '+r.customer+' '+r.platform+' '+ts.join(' ')).toLowerCase();
    return '<button class="rp2-rv3-card" data-rv3="1" data-platform="'+esc(String(r.platform||'Other').toLowerCase())+'" data-rating="'+n(r.stars)+'" data-themes="'+esc(ts.join(','))+'" data-search="'+esc(search)+'" onclick="_rp2ReviewOpen(\''+encodeURIComponent(r.id)+'\')">'
      +'<div><div class="rp2-rv3-stars">'+esc(stars(r.stars))+'</div><div class="rp2-rv3-platform">'+esc(r.platform||'Other')+'</div></div>'
      +'<div><div class="rp2-rv3-message">'+esc(snippet(r,540))+'</div><div class="rp2-rv3-meta"><span>'+esc(r.customer||'Customer not named')+'</span><span>·</span><span>'+fmtDate(r.date)+'</span></div><div class="rp2-rv3-tags">'+(ts.length?ts.map(function(id){var t=themeDef(id);return '<span class="rp2-rv3-tag">'+(t?t.icon+' '+esc(t.name):esc(id))+'</span>'}).join(''):'<span class="rp2-rv3-tag">No detected praise theme</span>')+'</div></div>'
      +'<div class="rp2-rv3-side"><strong>'+esc(r.platform||'Other')+'</strong>'+(r.date?r.date.getFullYear():'Undated')+'</div>'
      +'</button>'
  }
  function lifetimeOverview(g){
    var top=g.lifeThemes.filter(function(t){return t.count>0})[0]||null,second=g.lifeThemes.filter(function(t){return t.count>0})[1]||null;
    return sectionHead('Lifetime customer identity','The permanent story, not just one quarter','Every active review assigned to this rep contributes to the core intelligence engine. Time selectors only control the lower drill-down sections.')
      +'<div class="rp2-rv3-summary"><div class="rp2-rv3-summary-label">Lifetime customer-service identity</div><div class="rp2-rv3-summary-title">'+esc(g.identity.title)+'</div><div class="rp2-rv3-summary-copy">'+esc(g.identity.copy)+'</div></div>'
      +sectionHead('Lifetime praise DNA','What customers consistently value across your full history','A review can contribute to more than one theme. Cross-year persistence is shown because repeated praise over time is more meaningful than a one-quarter spike.')
      +'<div class="rp2-rv3-grid-2"><div class="rp2-rv3-panel"><div class="rp2-rv3-panel-title">Lifetime praise fingerprint</div><div class="rp2-rv3-panel-sub">All active written reviews currently assigned to your profile.</div>'+themeBars(g.lifeThemes,9)+'</div><div class="rp2-rv3-panel"><div class="rp2-rv3-panel-title">Praise combinations</div><div class="rp2-rv3-panel-sub">Strengths that repeatedly appear together in the same customer review.</div>'+pairList(g)+'</div></div>'
      +sectionHead('Pattern intelligence','Durable, emerging, and fading customer signals','The engine compares older and newer halves of your review history. These are trend clues, not permanent labels.')
      +'<div class="rp2-rv3-grid-3">'+trendCard('Durable strength',g.trends.durable)+trendCard('Emerging strength',g.trends.emerging)+trendCard('Fading strength',g.trends.fading)+'</div>'
      +sectionHead('Then vs now','How your customer-service identity has evolved','The earliest third of your dated review history is compared with the most recent third.')
      +'<div class="rp2-rv3-then-now"><div class="rp2-rv3-era"><div class="rp2-rv3-era-label">Then</div><div class="rp2-rv3-era-title">'+esc(g.evolution.thenTheme)+'</div><div class="rp2-rv3-era-copy">'+g.evolution.then.length+' early review'+(g.evolution.then.length===1?'':'s')+' define this first recorded slice.</div></div><div class="rp2-rv3-arrow">→</div><div class="rp2-rv3-era"><div class="rp2-rv3-era-label">Now</div><div class="rp2-rv3-era-title">'+esc(g.evolution.nowTheme)+'</div><div class="rp2-rv3-era-copy">'+esc(g.evolution.copy)+'</div></div></div>'
      +sectionHead('Lifetime trajectory','Review volume and rating over time','This chart uses every dated active review in the rep’s history.')
      +'<div class="rp2-rv3-panel"><div class="rp2-rv3-panel-title">Reviews by year</div><div class="rp2-rv3-panel-sub">Annual review count with average star rating on the second axis.</div><div class="rp2-rv3-chart"><canvas id="rp2-rv3-chart"></canvas></div></div>'
      +periodExplorer(g)
      +historicalBreakdown(g)
  }
  function voiceView(g){
    var plats={};g.rows.forEach(function(r){plats[r.platform]=1});
    var themes=g.lifeThemes.filter(function(t){return t.count>0});
    return sectionHead('Customer voice library','Search your complete active review history','This is lifetime search, not selected-quarter search. Use the filters to find customers, themes, platforms, or exact language.')
      +'<div class="rp2-rv3-filterbar">'
      +'<input id="rp2-rv3-search" type="search" placeholder="Search customer, comment, platform…" oninput="_rp2ReviewApplyFilters()">'
      +'<select id="rp2-rv3-platform" onchange="_rp2ReviewApplyFilters()"><option value="">All platforms</option>'+Object.keys(plats).sort().map(function(p){return '<option value="'+esc(p.toLowerCase())+'">'+esc(p)+'</option>'}).join('')+'</select>'
      +'<select id="rp2-rv3-rating" onchange="_rp2ReviewApplyFilters()"><option value="">All ratings</option><option value="5">5 stars</option><option value="4">4+ stars</option><option value="3">3 stars or lower</option><option value="0">Unrated</option></select>'
      +'<select id="rp2-rv3-theme" onchange="_rp2ReviewApplyFilters()"><option value="">All praise themes</option>'+themes.map(function(t){return '<option value="'+esc(t.id)+'">'+t.icon+' '+esc(t.name)+'</option>'}).join('')+'</select>'
      +'<div id="rp2-rv3-count" class="rp2-rv3-filtercount">'+g.rows.length+' shown</div></div>'
      +(g.rows.length?'<div class="rp2-rv3-feed">'+g.rows.map(reviewCard).join('')+'</div>':'<div class="rp2-rv3-empty"><strong>No active review history is assigned to this rep</strong><span>Reviews will appear here after manager-side matching, duplicate handling, and assignment decisions.</span></div>')
  }
  function themesView(g){
    var active=g.lifeThemes.filter(function(t){return t.count>0});
    return sectionHead('Praise DNA','The full lifetime theme map','This is the permanent customer-service fingerprint built from every active written review assigned to the rep.')
      +'<div class="rp2-rv3-grid-3">'+(active.length?active.map(function(t,i){
        var sample=topReview(t.reviews);
        return insight(t.icon,i===0?'Lifetime #1 theme':'Lifetime praise theme',t.name,t.count+' review'+(t.count===1?'':'s')+' across '+t.yearCount+' year'+(t.yearCount===1?'':'s')+'. '+(sample?('Example: “'+snippet(sample,125)+'”'):'No written sample available.'),i===0?'gold':'')
      }).join(''):'<div class="rp2-rv3-empty"><strong>No lifetime praise themes detected</strong><span>The active reviews may not contain recognizable written praise language yet.</span></div>')+'</div>'
      +sectionHead('Trend classification','How lifetime praise is moving','Durable themes appear across years. Emerging and fading themes compare the older half of review history with the newer half.')
      +'<div class="rp2-rv3-grid-3">'+trendCard('Durable strength',g.trends.durable)+trendCard('Emerging strength',g.trends.emerging)+trendCard('Fading strength',g.trends.fading)+'</div>'
      +sectionHead('Theme combinations','What customers value together','Repeated co-occurrence can reveal the service formula behind the strongest experiences.')
      +'<div class="rp2-rv3-panel">'+pairList(g)+'</div>'
  }
  function recognitionView(g){
    return sectionHead('Recognition vault','Lifetime customer-service achievements','Milestones use the complete active review history and show their exact thresholds.')
      +'<div class="rp2-rv3-badge-grid">'+g.badges.map(function(b){return '<div class="rp2-rv3-badge '+(b.earned?'earned':'locked')+'"><div class="rp2-rv3-badge-icon">'+b.icon+'</div><div class="rp2-rv3-badge-state">'+(b.earned?'Earned':'Locked')+'</div><div class="rp2-rv3-badge-name">'+esc(b.name)+'</div><div class="rp2-rv3-badge-copy">'+esc(b.copy)+'</div></div>'}).join('')+'</div>'
      +sectionHead('Lifetime recognition highlights','The strongest customer signals in your full history','These highlights stay independent of the currently selected week.')
      +'<div class="rp2-rv3-grid-3">'
      +insight('⭐','Strongest review',g.rows.length?(n(topReview(g.rows).stars)+' stars · '+(topReview(g.rows).customer||topReview(g.rows).platform)):'No review yet',snippet(topReview(g.rows),180),'gold')
      +insight('📣','Named recognition',g.mentions.length+' review'+(g.mentions.length===1?'':'s')+' mention you by name',g.mentions.length?snippet(g.mentions[0],180):'No active written review clearly mentions your first or full name yet.','good')
      +insight('🔥','Positive streak',g.streak+' consecutive review'+(g.streak===1?'':'s'),g.streak?'Rated reviews at four stars or higher without a lower-rated interruption.':'No rated positive streak yet.','')
      +'</div>'
  }
  function historyView(g){
    return sectionHead('Review history','The complete active customer-review record','All-time history after manager-side duplicate decisions, removals, and rep-assignment overrides.')
      +(g.rows.length?'<div class="rp2-rv3-feed">'+g.rows.map(reviewCard).join('')+'</div>':'<div class="rp2-rv3-empty"><strong>No active review history</strong><span>Assigned active reviews will appear here automatically.</span></div>')
  }
  function findReview(g,encoded){var id=decodeURIComponent(encoded||'');return g.rows.filter(function(r){return String(r.id)===id})[0]||null}
  function drawer(g){
    if(!window._rp2ReviewOpenId)return '';
    var r=findReview(g,window._rp2ReviewOpenId);if(!r)return '';
    var signals=detailSignals(r,g);
    return '<div class="rp2-rv3-drawer-wrap" onclick="if(event.target===this)_rp2ReviewClose()"><aside class="rp2-rv3-drawer">'
      +'<div class="rp2-rv3-drawer-head"><div><div class="rp2-rv3-drawer-kick">Lifetime customer voice · '+esc(r.platform||'Other')+'</div><div class="rp2-rv3-drawer-stars">'+esc(stars(r.stars))+'</div><div class="rp2-rv3-drawer-title">'+esc(r.customer||'Customer not named')+'</div><div class="rp2-rv3-drawer-sub">'+fmtDate(r.date)+' · Assigned to '+esc(g.rep)+'</div></div><button class="rp2-rv3-close" onclick="_rp2ReviewClose()">×</button></div>'
      +'<div class="rp2-rv3-detail-section"><div class="rp2-rv3-detail-title">Full customer comment</div><div class="rp2-rv3-detail-copy">'+esc(r.msg||'No written comment was provided with this review.')+'</div></div>'
      +'<div class="rp2-rv3-detail-section"><div class="rp2-rv3-detail-title">Praise themes</div><div class="rp2-rv3-tags">'+((r.themes||[]).length?r.themes.map(function(id){var t=themeDef(id);return '<span class="rp2-rv3-tag">'+(t?t.icon+' '+esc(t.name):esc(id))+'</span>'}).join(''):'<span class="rp2-rv3-tag">No detected praise theme</span>')+'</div></div>'
      +'<div class="rp2-rv3-detail-section"><div class="rp2-rv3-detail-title">Why this review matters</div><div class="rp2-rv3-pair-list">'+signals.map(function(s){return '<div class="rp2-rv3-pair"><div class="rp2-rv3-pair-name">'+esc(s)+'</div><div class="rp2-rv3-pair-val">✓</div></div>'}).join('')+'</div></div>'
      +'<div class="rp2-rv3-detail-section"><div class="rp2-rv3-detail-copy">This page uses the active manager-side review feed after duplicate decisions, removals, and rep-assignment overrides. Theme detection is a transparent keyword grouping and never rewrites the customer’s original words.</div></div>'
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
      var q=((document.getElementById('rp2-rv3-search')||{}).value||'').toLowerCase().trim(),p=((document.getElementById('rp2-rv3-platform')||{}).value||'').toLowerCase(),rating=((document.getElementById('rp2-rv3-rating')||{}).value||''),theme=((document.getElementById('rp2-rv3-theme')||{}).value||'');
      var cards=safeArray(document.querySelectorAll?document.querySelectorAll('#rp2-page [data-rv3="1"]'):[]),shown=0;
      cards.forEach(function(card){
        var search=String(card.getAttribute('data-search')||''),cp=String(card.getAttribute('data-platform')||''),cr=n(card.getAttribute('data-rating')),ct=String(card.getAttribute('data-themes')||'').split(',');
        var ok=(!q||search.indexOf(q)>=0)&&(!p||cp===p)&&(!theme||ct.indexOf(theme)>=0);
        if(rating==='5')ok=ok&&cr===5;else if(rating==='4')ok=ok&&cr>=4;else if(rating==='3')ok=ok&&cr>0&&cr<=3;else if(rating==='0')ok=ok&&cr===0;
        card.style.display=ok?'grid':'none';if(ok)shown++
      });
      var count=document.getElementById('rp2-rv3-count');if(count)count.textContent=shown+' shown'
    }catch(e){}
  };

  window._rp2ReviewsV2=function(){
    try{
      var g=build(),tab=window._rp2ReviewTab,top=g.lifeThemes.filter(function(t){return t.count>0})[0]||null;
      var hero='<div class="rp2-rv3-hero"><div class="rp2-rv3-hero-grid"><div><div class="rp2-rv3-kick">Customer Reviews 2.1 · LIFETIME INTELLIGENCE · BUILD v499</div><div class="rp2-rv3-title">Your customer reputation, across your entire history</div><div class="rp2-rv3-copy">Lifetime-first intelligence shows the durable story customers tell about working with you. The Year / Quarter / Month / Week selectors now drill into that story instead of replacing it.</div><div class="rp2-rv3-pills"><span class="rp2-rv3-pill gold">'+g.life.count+' lifetime active reviews</span><span class="rp2-rv3-pill '+(g.life.avg>=4.5?'good':'gold')+'">'+(g.life.rated?g.life.avg.toFixed(1)+' ★ lifetime average':'No lifetime rating average')+'</span><span class="rp2-rv3-pill">'+g.yearBuckets.length+' recorded year'+(g.yearBuckets.length===1?'':'s')+'</span></div></div>'
        +'<div class="rp2-rv3-brief"><div><div class="rp2-rv3-brief-label">Lifetime customer identity</div><div class="rp2-rv3-brief-value">'+(top?top.icon:'✦')+'</div><div class="rp2-rv3-brief-title">'+esc(g.identity.title)+'</div><div class="rp2-rv3-brief-copy">'+esc(g.identity.copy)+'</div></div><div class="rp2-rv3-brief-foot"><span>Recognition <strong>'+g.earned+'/'+g.badges.length+'</strong></span><span>Positive streak <strong>'+g.streak+'</strong></span></div></div></div></div>';

      var reviewRate=g.orders>=10?(g.life.count/g.orders*100):null;
      var kpis='<div class="rp2-rv3-kpis">'
        +kpi('Lifetime reviews',String(g.life.count),g.yearBuckets.length+' recorded year'+(g.yearBuckets.length===1?'':'s'))
        +kpi('Lifetime average',g.life.rated?g.life.avg.toFixed(1)+' ★':'—',g.life.rated+' rated review'+(g.life.rated===1?'':'s'))
        +kpi('Lifetime 5-star',String(g.life.five),g.life.count?Math.round(g.life.five/g.life.count*100)+'% of active reviews':'No active reviews')
        +kpi('Positive rate',g.life.rated?Math.round(g.life.positiveRate)+'%':'—','Rated reviews at 4 stars or higher')
        +kpi('Top lifetime theme',top?esc(top.name):'—',top?(top.count+' reviews · '+top.yearCount+' years'):'No detected praise theme')
        +kpi('Named recognition',String(g.mentions.length),'Reviews clearly mentioning your name')
        +kpi('Reviews / 100 orders',reviewRate==null?'—':reviewRate.toFixed(1),g.orders>=10?(g.orders+' recorded primary orders'):'Not enough recorded order history')
        +kpi('Positive streak',String(g.streak),'Longest consecutive 4★+ rated-review streak')
        +'</div>';

      var content=tab==='voice'?voiceView(g):tab==='themes'?themesView(g):tab==='recognition'?recognitionView(g):tab==='history'?historyView(g):lifetimeOverview(g);
      return '<div class="rp2-rv3-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+drawer(g)
    }catch(e){
      console.error('[Customer Reviews v499 render error]',e);
      return '<div class="rp2-rv3-shell"><div class="rp2-rv3-hero"><div class="rp2-rv3-kick">Customer Reviews 2.1 · RECOVERY MODE</div><div class="rp2-rv3-title">The lifetime review engine hit a data compatibility issue</div><div class="rp2-rv3-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
    }
  };

  window._rp2ReviewsDraw=function(){
    if(typeof Chart!=='function'||window._rp2ReviewTab!=='overview')return;
    var canvas=document.getElementById('rp2-rv3-chart');if(!canvas)return;
    var g=build(),years=g.yearBuckets.slice().sort(function(a,b){return a.order-b.order});
    if(_rp2.reviewsChart){try{_rp2.reviewsChart.destroy()}catch(e){}}
    if(!years.length)return;
    _rp2.reviewsChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:years.map(function(x){return x.label}),datasets:[
        {type:'bar',label:'Reviews',data:years.map(function(x){return x.count}),backgroundColor:'rgba(250,135,61,.72)',borderRadius:6,yAxisID:'count'},
        {type:'line',label:'Average rating',data:years.map(function(x){return x.avg||null}),borderColor:'#f5be64',pointRadius:4,tension:.25,yAxisID:'rating'}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#aab4c6',boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label==='Average rating'?(' Average rating: '+Number(ctx.parsed.y||0).toFixed(1)):(' Reviews: '+ctx.parsed.y)}}}},
        scales:{
          x:{ticks:{color:'#8b95a7',font:{size:10}},grid:{display:false}},
          count:{beginAtZero:true,ticks:{color:'#8b95a7',precision:0},grid:{color:'rgba(255,255,255,.05)'}},
          rating:{position:'right',min:0,max:5,ticks:{color:'#8b95a7',stepSize:1,callback:function(v){return v+'★'}},grid:{display:false}}
        }
      }
    })
  };
})();
