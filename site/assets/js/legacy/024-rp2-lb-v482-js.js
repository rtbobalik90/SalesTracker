
(function(){
  var LB_CATS=[
    {id:'revenue',label:'Revenue',icon:'💰',format:'money'},
    {id:'calls',label:'Calls',icon:'☎️',format:'number'},
    {id:'orders',label:'Orders',icon:'📦',format:'number'},
    {id:'aov',label:'Avg Order Value',icon:'◈',format:'money'},
    {id:'improved',label:'Most Improved',icon:'↗',format:'pct'},
    {id:'consistency',label:'Consistency',icon:'≈',format:'pct'},
    {id:'quality',label:'Quality',icon:'★',format:'score'}
  ];
  window._rp2LbCat=window._rp2LbCat||'revenue';

  function n(v){return Number(v)||0}
  function esc(v){return _rp2Esc(String(v==null?'':v))}
  function money(v){return _rp2$(n(v))}
  function catDef(id){return LB_CATS.filter(function(c){return c.id===id})[0]||LB_CATS[0]}
  function fmt(v,cat){cat=typeof cat==='string'?catDef(cat):cat;v=n(v);if(cat.format==='money')return money(v);if(cat.format==='pct')return (v>=0?'+':'')+Math.round(v)+'%';if(cat.format==='score')return Math.round(v)+'/100';return Math.round(v).toLocaleString()}
  function fmtGap(v,cat){v=Math.max(0,n(v));if(cat.format==='money')return money(v);if(cat.format==='pct'||cat.format==='score')return Math.ceil(v)+' pts';return Math.ceil(v).toLocaleString()}
  function context(){var c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null;return c||{rep:_rp2.rep,through:gwq(getYr(),getQ()),before:[],selected:null}}
  function weekMetric(rep,w){var d=(S.data||{})[rep+'|'+w.key]||{};return {revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls)}}
  function totals(rep,weeks){try{return totW(rep,weeks)||{revenue:0,orders:0,calls:0}}catch(e){return weeks.reduce(function(t,w){var d=weekMetric(rep,w);t.revenue+=d.revenue;t.orders+=d.orders;t.calls+=d.calls;return t},{revenue:0,orders:0,calls:0})}}
  function avg(arr){return arr.length?arr.reduce(function(s,v){return s+n(v)},0)/arr.length:0}
  function std(arr){if(arr.length<2)return 0;var a=avg(arr);return Math.sqrt(arr.reduce(function(s,v){return s+Math.pow(v-a,2)},0)/arr.length)}
  function series(rep,weeks){return weeks.map(function(w){return weekMetric(rep,w).revenue}).filter(function(v){return v>0})}
  function improvement(rep,weeks){var vals=series(rep,weeks);if(vals.length<2)return 0;var split=Math.max(1,Math.floor(vals.length/2)),first=vals.slice(0,split),second=vals.slice(split);if(!second.length)second=vals.slice(-1);var a=avg(first),b=avg(second);if(a<=0)return b>0?100:0;return (b-a)/a*100}
  function consistency(rep,weeks){var vals=series(rep,weeks);if(!vals.length)return 0;var a=avg(vals);return a>0?Math.max(0,Math.min(100,100-(std(vals)/a*100))):0}
  function repQuality(rep,weeks){
    var keys={};weeks.forEach(function(w){keys[w.key]=1});
    var arts=(S.artErrors||[]).filter(function(a){return a.rep===rep&&(!a.weekKey||keys[a.weekKey])}).length;
    var credits=(S.cms||[]).filter(function(c){var fault=String(c.fault||'').toLowerCase();return c.rep===rep&&(!c.weekKey||keys[c.weekKey])&&fault.indexOf('rep')>=0});
    var creditValue=credits.reduce(function(s,c){return s+n(c.amount)},0);
    var reviews=((S.reviews&&S.reviews.rows)||[]).filter(function(r){var rf=(S.reviews&&S.reviews.repFix)||{};return (rf[r.id]||r.rep)===rep}).length;
    var score=Math.max(0,100-(arts*4)-(credits.length*8)-Math.min(20,creditValue/250)+Math.min(8,reviews));
    return {score:score,arts:arts,credits:credits.length,creditValue:creditValue,reviews:reviews}
  }
  function metricRow(rep,weeks,cat){
    var t=totals(rep,weeks),q=repQuality(rep,weeks),imp=improvement(rep,weeks),con=consistency(rep,weeks),value=0;
    if(cat.id==='revenue')value=t.revenue;else if(cat.id==='calls')value=t.calls;else if(cat.id==='orders')value=t.orders;else if(cat.id==='aov')value=t.orders>0?t.revenue/t.orders:0;else if(cat.id==='improved')value=imp;else if(cat.id==='consistency')value=con;else if(cat.id==='quality')value=q.score;
    return {name:rep,value:value,revenue:t.revenue,calls:t.calls,orders:t.orders,aov:t.orders>0?t.revenue/t.orders:0,improved:imp,consistency:con,quality:q.score,qualityMeta:q}
  }
  function rowsFor(weeks,cat){var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));var rows=reps.map(function(r){return metricRow(r.name,weeks,cat)});rows.sort(function(a,b){return b.value!==a.value?b.value-a.value:b.revenue-a.revenue});rows.forEach(function(r,i){r.rank=i+1});return rows}
  function visibleName(row,index,meRank){if(row.rank<=3||row.name===_rp2.rep||Math.abs(row.rank-meRank)<=1)return row.name;return _rp2Anon(row.name,index+1)}
  function moveFor(name,current,previous){var c=current.findIndex(function(r){return r.name===name})+1,p=previous.findIndex(function(r){return r.name===name})+1;if(!p||!c)return {delta:0,label:'New',cls:''};var d=p-c;if(d>0)return {delta:d,label:'▲ '+d,cls:'up'};if(d<0)return {delta:d,label:'▼ '+Math.abs(d),cls:'down'};return {delta:0,label:'—',cls:''}}
  function build(){
    var c=context(),cat=catDef(window._rp2LbCat),current=rowsFor(c.through,cat),previous=rowsFor(c.before||[],cat);
    var me=current.filter(function(r){return r.name===_rp2.rep})[0]||metricRow(_rp2.rep,c.through,cat);if(!me.rank)me.rank=current.length||1;
    var leader=current[0]||me,above=me.rank>1?current[me.rank-2]:null,below=me.rank<current.length?current[me.rank]:null,move=moveFor(me.name,current,previous);
    var title,copy;
    if(me.rank===1){title='You are setting the pace in '+cat.label.toLowerCase();copy='The question is no longer how to move up—it is how much cushion you can build before the nearest challenger closes the gap.'}
    else if(above){title='The next position is '+fmtGap(above.value-me.value,cat)+' away';copy='That is the immediate climb target. The #1 gap is '+fmtGap(leader.value-me.value,cat)+'. Focus first on the next rank, then recalculate.'}
    else{title='Your ranking position is still forming';copy='There is not enough category data in the selected context to calculate a meaningful climb target.'}
    if(move.delta>0)copy+=' You moved up '+move.delta+' position'+(move.delta===1?'':'s')+' versus the prior selected-week snapshot.';
    else if(move.delta<0)copy+=' You slipped '+Math.abs(move.delta)+' position'+(Math.abs(move.delta)===1?'':'s')+' versus the prior selected-week snapshot.';
    else copy+=' Your rank is currently stable versus the prior selected-week snapshot.';
    return {c:c,cat:cat,current:current,previous:previous,me:me,leader:leader,above:above,below:below,move:move,story:{title:title,copy:copy},top3:current.slice(0,3)}
  }
  function sectionHead(kick,title,note){return '<div class="rp2-lb-section-head"><div><div class="rp2-lb-section-kick">'+kick+'</div><div class="rp2-lb-section-title">'+title+'</div></div><div class="rp2-lb-section-note">'+note+'</div></div>'}
  function tabBar(active){return '<div class="rp2-lb-tabs-wrap"><div class="rp2-lb-tabs">'+LB_CATS.map(function(c){return '<button class="rp2-lb-tab '+(c.id===active?'active':'')+'" onclick="_rp2LBSetCat(\''+c.id+'\')">'+c.icon+' '+c.label+'</button>'}).join('')+'</div></div>'}
  function categorySub(row,cat){if(cat.id==='revenue')return row.orders+' orders · '+Math.round(row.calls).toLocaleString()+' calls';if(cat.id==='calls')return money(row.revenue)+' revenue · '+row.orders+' orders';if(cat.id==='orders')return money(row.revenue)+' revenue · '+money(row.aov)+' AOV';if(cat.id==='aov')return row.orders+' orders supporting the average';if(cat.id==='improved')return 'Recent entered-week pace versus earlier pace';if(cat.id==='consistency')return 'Higher score means less week-to-week volatility';if(cat.id==='quality')return row.qualityMeta.arts+' art errors · '+row.qualityMeta.credits+' rep-fault credits';return ''}
  function podiumCard(row,place,g){if(!row)return '';var mv=moveFor(row.name,g.current,g.previous),medal=place===1?'🥇':place===2?'🥈':'🥉';return '<div class="rp2-lb-podium-card '+(place===1?'first':'')+'"><div class="rp2-lb-medal">'+medal+'</div><div class="rp2-lb-podium-rank">'+place+'</div><div class="rp2-lb-podium-name">'+esc(row.name)+'</div><div class="rp2-lb-podium-value">'+fmt(row.value,g.cat)+'</div><div class="rp2-lb-podium-sub">'+categorySub(row,g.cat)+'</div><div class="rp2-lb-podium-move '+(mv.delta>0?'good':mv.delta<0?'warn':'')+'">'+mv.label+' vs prior snapshot</div></div>'}
  function leaderboardRows(g){
    return g.current.map(function(r,i){
      var mv=moveFor(r.name,g.current,g.previous);
      var isMe=r.name===g.me.name;
      var displayName=(r.rank<=3||isMe)?r.name:('Rep #'+r.rank);
      var above=isMe&&r.rank>1?g.current[r.rank-2]:null;
      var gap=isMe&&above?Math.max(0,above.value-r.value):0;
      var gapText=isMe?(r.rank===1?'You are #1':fmtGap(gap,g.cat)+' to move up'):'';
      return '<div class="rp2-lb-row '+(isMe?'me ':'')+'">'
        +'<div class="rp2-lb-pos">#'+r.rank+'</div>'
        +'<div class="rp2-lb-name">'+esc(displayName)+(isMe?'<small>You</small>':'')+'</div>'
        +'<div class="rp2-lb-value">'+fmt(r.value,g.cat)+'</div>'
        +'<div class="rp2-lb-gap">'+gapText+'</div>'
        +'<div class="rp2-lb-move '+mv.cls+'">'+mv.label+'</div>'
      +'</div>';
    }).join('');
  }
  function categoryCoaching(g){var id=g.cat.id;if(id==='revenue')return 'Use Forecast to compare your recent run rate with the pace required to close the gap to the rep above you.';if(id==='calls')return 'Translate the gap into daily calls. This is the most controllable leaderboard because activity can be planned before the week begins.';if(id==='orders')return 'Stack more completed buying events through repeat business, reorders, and faster-closing opportunities.';if(id==='aov')return 'Grow average order value through larger programs, add-ons, quantity expansion, and deeper account penetration.';if(id==='improved')return 'Create a genuine step change in recent weekly performance. This category rewards trajectory rather than raw size.';if(id==='consistency')return 'Raise the floor. Fewer low-output weeks matter more than adding one isolated giant week.';if(id==='quality')return 'Reduce art errors and rep-fault credits while protecting customer satisfaction. Clean execution drives this board.';return ''}
  function climbPanel(g){
    var toNext=g.above?Math.max(0,g.above.value-g.me.value):0,toFirst=Math.max(0,g.leader.value-g.me.value),nextPct=g.above&&g.above.value>0?Math.max(0,Math.min(100,g.me.value/g.above.value*100)):100,firstPct=g.leader.value>0?Math.max(0,Math.min(100,g.me.value/g.leader.value*100)):100,vuln=g.below?Math.max(0,g.me.value-g.below.value):null;
    var vulnCopy=!g.below?'No one is currently ranked below you in this category.':vuln===0?'Your position is effectively tied with the rep below you.':'You currently have a '+fmtGap(vuln,g.cat)+' cushion over #'+g.below.rank+'.';
    return '<div class="rp2-lb-climb"><div class="rp2-lb-climb-card"><div class="rp2-lb-climb-label">Climb Bar · '+esc(g.cat.label)+'</div><div class="rp2-lb-climb-title">What it takes to move</div><div class="rp2-lb-climb-rank">#'+g.me.rank+'</div><div class="rp2-lb-climb-copy">'+esc(g.story.copy)+'</div><div class="rp2-lb-climb-block"><div class="rp2-lb-climb-row"><span>Move up one</span><strong>'+(g.above?fmtGap(toNext,g.cat):'You are #1')+'</strong></div><div class="rp2-lb-bar"><span style="width:'+nextPct+'%"></span></div><div class="rp2-lb-bar-note">'+(g.above?'Progress toward #'+g.above.rank+'.':'You currently hold the top position.')+'</div></div><div class="rp2-lb-climb-block"><div class="rp2-lb-climb-row"><span>Reach #1</span><strong>'+(g.me.rank===1?'You are #1':fmtGap(toFirst,g.cat))+'</strong></div><div class="rp2-lb-bar goal"><span style="width:'+firstPct+'%"></span></div><div class="rp2-lb-bar-note">'+(g.me.rank===1?'Protect the lead and build cushion.':'Distance from the current category leader.')+'</div></div><div class="rp2-lb-vulnerability"><strong>How safe is your spot?</strong><span>'+vulnCopy+'</span></div></div><div class="rp2-lb-climb-card"><div class="rp2-lb-climb-label">Category coaching</div><div class="rp2-lb-climb-title">How to improve this ranking</div><div class="rp2-lb-climb-copy">'+categoryCoaching(g)+'</div></div></div>'
  }
  function battleMini(label,me,opp){return '<div class="rp2-lb-battle-mini"><span>'+label+'</span><strong>'+me+' vs '+opp+'</strong></div>'}
  function battle(g){
    var opp=g.above||g.below;
    if(!opp)return '<div class="rp2-lb-panel">No comparison opponent is available in this category.</div>';
    var oppName=opp.rank<=3?opp.name:('Rank #'+opp.rank);
    return '<div class="rp2-lb-battle">'
      +'<div class="rp2-lb-fighter me"><div class="rp2-lb-fighter-name">'+esc(g.me.name)+'</div><div class="rp2-lb-fighter-rank">#'+g.me.rank+' in '+esc(g.cat.label)+'</div><div class="rp2-lb-fighter-value">'+fmt(g.me.value,g.cat)+'</div><div class="rp2-lb-fighter-sub">'+categorySub(g.me,g.cat)+'</div></div>'
      +'<div class="rp2-lb-vs">VS</div>'
      +'<div class="rp2-lb-fighter"><div class="rp2-lb-fighter-name">'+esc(oppName)+'</div><div class="rp2-lb-fighter-rank">#'+opp.rank+' in '+esc(g.cat.label)+'</div><div class="rp2-lb-fighter-value">'+fmt(opp.value,g.cat)+'</div><div class="rp2-lb-fighter-sub">'+(opp.rank<=3?categorySub(opp,g.cat):'Nearest competitive position')+'</div></div>'
      +'</div>'
      +'<div class="rp2-lb-battle-metrics">'
        +battleMini('Revenue',money(g.me.revenue),money(opp.revenue))
        +battleMini('Calls',Math.round(g.me.calls).toLocaleString(),Math.round(opp.calls).toLocaleString())
        +battleMini('Orders',g.me.orders,opp.orders)
        +battleMini('AOV',money(g.me.aov),money(opp.aov))
      +'</div>';
  }
  function storyCard(icon,label,title,copy){return '<div class="rp2-lb-story"><div class="rp2-lb-story-icon">'+icon+'</div><div class="rp2-lb-story-label">'+label+'</div><div class="rp2-lb-story-title">'+title+'</div><div class="rp2-lb-story-copy">'+copy+'</div></div>'}
  function storyCards(g){var movementTitle=g.move.delta>0?'You are climbing':g.move.delta<0?'Your position slipped':'Your rank is holding steady',movementCopy=g.move.delta>0?'You moved up '+g.move.delta+' position'+(g.move.delta===1?'':'s')+' compared with the prior selected-week snapshot.':g.move.delta<0?'You moved down '+Math.abs(g.move.delta)+' position'+(Math.abs(g.move.delta)===1?'':'s')+' compared with the prior selected-week snapshot.':'Your position is unchanged from the prior selected-week snapshot.';var posTitle='Your current category position is #'+g.me.rank,posCopy=g.me.rank<=3?'You are currently on the podium in '+g.cat.label.toLowerCase()+'. Protecting the position may matter as much as chasing the next one.':'You are outside the podium, so the next-rank gap is the most practical target.';var routeTitle=g.me.rank===1?'Build a safer lead':'Close '+(g.above?fmtGap(g.above.value-g.me.value,g.cat):'the next gap'),routeCopy=g.me.rank===1?'Widen the cushion over #2 so one weak period does not immediately cost the lead.':'Treat the next position as the immediate target, then recalculate after you pass that rep.';return '<div class="rp2-lb-story-grid">'+storyCard('↗','Rank movement',movementTitle,movementCopy)+storyCard('◎','Competitive position',posTitle,posCopy)+storyCard('⚡','Fastest route up',routeTitle,routeCopy)+'</div>'}
  function ladder(g){
    var max=g.current.length?Math.max.apply(null,g.current.map(function(r){return r.value})):1;
    return '<div class="rp2-lb-ladder">'+g.current.map(function(r){
      var isMe=r.name===g.me.name;
      var displayName=(r.rank<=3||isMe)?r.name:('Rep #'+r.rank);
      var pct=max>0?Math.max(2,r.value/max*100):2;
      return '<div class="rp2-lb-ladder-row '+(isMe?'me':'')+'">'
        +'<div class="rp2-lb-pos">#'+r.rank+'</div>'
        +'<div class="rp2-lb-name">'+esc(displayName)+(isMe?'<small>You</small>':'')+'</div>'
        +'<div class="rp2-lb-value">'+fmt(r.value,g.cat)+'</div>'
        +'<div class="rp2-lb-ladder-bar"><span style="width:'+pct+'%"></span></div>'
      +'</div>';
    }).join('')+'</div>';
  }
  window._rp2LBSetCat=function(id){window._rp2LbCat=id;var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2LBV2();var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0}
  window._rp2LBV2=function(){
    var g=build(),selectedLabel=g.c.selected?(g.c.selected.label||('Wk '+g.c.selected.num)):'Selected period';
    var hero='<div class="rp2-lb-hero"><div class="rp2-lb-hero-grid"><div><div class="rp2-lb-kick">Leaderboard 2.0 · BUILD v482</div><div class="rp2-lb-title">Your competitive position</div><div class="rp2-lb-copy">'+esc(g.story.title)+'. '+esc(g.story.copy)+'</div><div class="rp2-lb-pills"><span class="rp2-lb-pill">'+esc(g.cat.label)+' leaderboard</span><span class="rp2-lb-pill">Through '+esc(selectedLabel)+'</span><span class="rp2-lb-pill '+(g.move.delta>0?'good':g.move.delta<0?'warn':'')+'">'+g.move.label+' rank movement</span></div></div><div class="rp2-lb-brief"><div><div class="rp2-lb-brief-label">Your '+esc(g.cat.label)+' rank</div><div class="rp2-lb-brief-rank">#'+g.me.rank+'</div><div class="rp2-lb-brief-title">'+esc(g.story.title)+'</div><div class="rp2-lb-brief-copy">'+esc(g.story.copy)+'</div></div><div class="rp2-lb-brief-sub">Current category value: <strong style="color:#fff">'+fmt(g.me.value,g.cat)+'</strong></div></div></div></div>';
    var tabs=tabBar(g.cat.id);
    var podium=sectionHead('Podium','Top three in '+g.cat.label,'The podium updates with the category tab. Top three remain visible by name while lower ranks use privacy-aware naming outside your immediate competitive neighborhood.')+'<div class="rp2-lb-podium">'+podiumCard(g.top3[1],2,g)+podiumCard(g.top3[0],1,g)+podiumCard(g.top3[2],3,g)+'</div>';
    var board=sectionHead('Full ranking','The '+g.cat.label+' board','The full team is shown. Top three names and your own name remain visible; every other rep is anonymous. Climb math is private to your profile.')+'<div class="rp2-lb-main-grid"><div class="rp2-lb-panel"><div class="rp2-lb-panel-title">'+esc(g.cat.label)+' standings</div><div class="rp2-lb-panel-sub">Ranked through '+esc(selectedLabel)+'</div><div class="rp2-lb-table">'+leaderboardRows(g)+'</div></div>'+climbPanel(g)+'</div>';
    var closest=sectionHead('Closest battle','Your nearest competitive matchup','The matchup follows the category tab, comparing you with the rep immediately above—or below if you currently hold #1.')+'<div class="rp2-lb-panel">'+battle(g)+'</div>';
    var what=sectionHead('What it means','How to read your position','Rank alone is not enough. These cards explain whether you are moving, how strong the position is, and the fastest practical route upward.')+storyCards(g);
    var climb=sectionHead('The climb','Distance across the full field','The ladder shows the full field while keeping non-podium competitors anonymous. Your private Climb Bar handles the math required to move up.')+'<div class="rp2-lb-panel"><div class="rp2-lb-panel-title">'+esc(g.cat.label)+' climb ladder</div><div class="rp2-lb-panel-sub">Relative position across the selected context</div>'+ladder(g)+'</div>';
    return '<div class="rp2-lb-shell">'+hero+tabs+podium+board+closest+what+climb+'</div>'
  };
  try{var sess=(typeof _rpSession==='function')?_rpSession():null;if(sess&&sess.role==='rep'&&_rp2.page==='lb'){setTimeout(function(){try{_rp2Go('lb')}catch(e){}},0)}}catch(e){}
})();
