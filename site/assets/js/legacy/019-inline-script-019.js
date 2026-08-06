
(function(){
  function rp2Initials(name){
    return String(name||'').split(/\s+/).filter(Boolean).map(function(x){return x.charAt(0);}).join('').slice(0,2).toUpperCase()||'RP';
  }
  function rp2Opts(sourceId){
    var src=document.getElementById(sourceId), html='';
    if(!src)return html;
    for(var i=0;i<src.options.length;i++){
      var o=src.options[i];
      html+='<option value="'+_rp2Esc(o.value)+'"'+(o.selected?' selected':'')+'>'+_rp2Esc(o.textContent||o.text||o.value)+'</option>';
    }
    return html;
  }
  window._rp2PeriodChange=function(kind,value){
    try{
      var y=document.getElementById('selYr'),q=document.getElementById('selQ'),m=document.getElementById('selM'),w=document.getElementById('selW');
      if(kind==='yr'&&y){y.value=value;buildMonthSel(getQ());buildWeekSel();}
      else if(kind==='q'&&q){q.value=value;buildMonthSel(getQ());buildWeekSel();}
      else if(kind==='m'&&m){m.value=value;buildWeekSel();}
      else if(kind==='w'&&w){w.value=value;}
      try{updateDisplay();}catch(e){}
      _rp2Go(_rp2.page||'dash');
    }catch(e){console.error('Rep portal period change failed',e);}
  };
  window._rp2PeriodControls=function(){
    return '<div class="rp2-context">'
      +'<label class="rp2-context-field"><span>Year</span><select class="rp2-context-select" onchange="_rp2PeriodChange(\'yr\',this.value)">'+rp2Opts('selYr')+'</select></label>'
      +'<label class="rp2-context-field"><span>Quarter</span><select class="rp2-context-select" onchange="_rp2PeriodChange(\'q\',this.value)">'+rp2Opts('selQ')+'</select></label>'
      +'<label class="rp2-context-field"><span>Month</span><select class="rp2-context-select" onchange="_rp2PeriodChange(\'m\',this.value)">'+rp2Opts('selM')+'</select></label>'
      +'<label class="rp2-context-field"><span>Week</span><select class="rp2-context-select week" onchange="_rp2PeriodChange(\'w\',this.value)">'+rp2Opts('selW')+'</select></label>'
      +'<button class="rp2-cloud-refresh" onclick="_rp2RefreshCloud(this,false)" title="Pull the newest manager-saved cloud snapshot">↻ Refresh data</button>'
      +'<div class="rp2-cloud-age" title="Rep Portal data source: GitHub Gist cloud snapshot">'+_rp2Esc(_rpCloudAgeLabel())+'</div>'
      +'<div class="rp2-readonly">● Read only</div>'
      +'</div>';
  };
  window._rp2SelectedWeek=function(){
    try{
      var all=gwm(getYr(),getQ(),getM())||[];
      return all.find(function(x){return Number(x.num)===Number(getWN());})||null;
    }catch(e){return null;}
  };
  window._rp2SelectedWeekData=function(rep){
    var wk=_rp2SelectedWeek();
    var d=(wk&&S&&S.data)?(S.data[rep+'|'+wk.key]||{}):{};
    return {week:wk,revenue:Number(d.revenue)||0,orders:Number(d.orders)||0,calls:Number(d.calls)||0};
  };
  window._rp2SelectedWeekRank=function(rep){
    var wk=_rp2SelectedWeek(), reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
    if(!wk)return {rank:null,total:reps.length,teamAvg:0};
    var rows=reps.map(function(r){var d=(S.data||{})[r.name+'|'+wk.key]||{};return {name:r.name,revenue:Number(d.revenue)||0};}).sort(function(a,b){return b.revenue-a.revenue;});
    var rank=null,total=0;
    rows.forEach(function(r,i){total+=r.revenue;if(r.name===rep)rank=i+1;});
    return {rank:rank,total:rows.length,teamAvg:rows.length?Math.round(total/rows.length):0};
  };
  window._rp2SelectedMomentum=function(rep){
    try{
      var current=_rp2SelectedWeekData(rep), prev=getPrevWeek();
      if(!prev)return null;
      var pd=(S.data||{})[rep+'|'+prev.key]||{}, p=Number(pd.revenue)||0;
      if(p<=0)return null;
      return Math.round((current.revenue-p)/p*100);
    }catch(e){return null;}
  };
  window._rp2Html=function(rep){
    _rp2.rep=rep;
    if(_rp2.dailyY==null){var now=new Date();_rp2.dailyY=now.getFullYear();_rp2.dailyM=now.getMonth();}
    var nav=RP2_NAV.map(function(gr){
      var its=gr.items.map(function(it){return '<button class="rp2-nav'+(_rp2.page===it[0]?' on':'')+'" onclick="_rp2Go(\''+it[0]+'\')"><span>'+it[2]+'</span>'+it[1]+'</button>';}).join('');
      return (gr.g?'<div class="rp2-navg">'+gr.g+'</div>':'')+its;
    }).join('');
    return '<div class="rp2-app"><aside class="rp2-side"><div class="rp2-logo">▲ SALES TRACKER<span>REP PERFORMANCE PORTAL</span></div>'+nav+'<button class="rp2-nav rp2-out" onclick="_rpLogout()">⏻ Sign out</button></aside>'
      +'<main class="rp2-main"><div class="rp2-top"><div class="rp2-person"><div class="rp2-person-mark">'+rp2Initials(rep)+'</div><div><div class="rp2-hi">'+_rp2Esc(rep)+'</div><div class="rp2-sub">Unified Sales Center · '+getQ()+' '+getYr()+' · identity scope v500</div></div></div>'+_rp2PeriodControls()+'</div><div id="rp2-page">'+_rp2Page()+'</div></main></div>';
  };
  window._rp2Dash=function(){
    var rep=_rp2.rep,t=_rp2Tot(rep),goal=_rp2Goal(rep),ranks=_rp2Ranks(),rk=_rp2RankOf(ranks,rep);
    var pct=goal>0?Math.round(t.revenue/goal*100):null;
    var os=null;try{if(typeof _ordHasData==='function'&&_ordHasData())os=_ordRepStat(rep,getYr(),getQ());}catch(e){}
    var sw=_rp2SelectedWeekData(rep),sr=_rp2SelectedWeekRank(rep),mom=_rp2SelectedMomentum(rep),streak=_rp2Streak();
    var hr=new Date().getHours(),greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
    var first=String(rep||'').split(' ')[0]||rep;
    var momHtml=mom==null?'selected week':('<span class="rp2-mom '+(mom>=0?'up':'dn')+'">'+(mom>=0?'▲':'▼')+' '+Math.abs(mom)+'% vs prior week</span>');
    var wk=sw.week,wkTitle=wk?(wk.label||('Week '+wk.num)):'Selected week',wkRange=wk?(fd(wk.start)+' – '+fd(wk.end)):'';
    var paceText='No quarter goal has been set yet.';
    if(goal>0){
      var entered=_rp2WeekSeries().filter(function(x){return x.has;}).length,totalWeeks=(_rp2Wks().length||13),expected=goal*(entered/totalWeeks);
      paceText=t.revenue>=expected?'You are currently at or above quarter pace. Keep stacking quality weeks.':'You are below current quarter pace. Use Forecast to see the weekly number needed to close the gap.';
    }
    var hero='<div class="rp2-hero"><div class="rp2-hero-layout"><div class="rp2-hero-copy"><div class="rp2-hero-row"><div><div class="rp2-hero-kick">'+greet.toUpperCase()+' · YOUR PERFORMANCE COMMAND CENTER</div><div class="rp2-hero-name">'+_rp2Esc(first)+'’s '+getQ()+' '+getYr()+'</div></div>'+(streak>=2?'<div class="rp2-flame">🔥 '+streak+'-week streak</div>':'')+'</div><div class="rp2-hero-brief" id="rp2-hero-brief">'+_rp2Esc(paceText)+'</div></div>'
      +'<div class="rp2-hero-period"><div><div class="rp2-period-label">Currently viewing</div><div class="rp2-period-week">'+_rp2Esc(wkTitle)+'</div><div class="rp2-period-range">'+_rp2Esc(wkRange)+'</div></div><div class="rp2-period-number"><strong>'+_rp2$(sw.revenue)+'</strong><small>'+sw.orders+' orders · '+sw.calls+' calls'+(sr.rank?' · week rank #'+sr.rank:'')+'</small></div></div></div></div>';
    var maxRev=ranks.length?ranks[0].rev:0;
    var bars=ranks.map(function(r,i){var me=r.name===rep,w=maxRev>0?Math.max(2,Math.round(r.rev/maxRev*100)):2,nm=(i<3)?r.name:_rp2Anon(r.name,i+1);return '<div class="rp2-bar-row'+(me?' me':'')+'"><div class="rp2-bar-name">'+_rp2Esc(nm)+'</div><div class="rp2-bar-track"><div class="rp2-bar-fill" style="width:'+w+'%;"></div></div><div class="rp2-bar-val">'+_rp2$(r.rev)+'</div></div>';}).join('');
    var ringPct=Math.min(100,pct||0),badges=_rp2Badges(),earned=badges.filter(function(b){return b.e;}).length;
    var chips=badges.map(function(b){return '<div class="rp2-badge'+(b.e?' on':'')+'" title="'+_rp2Esc(b.d)+'">'+(b.e?b.i:'🔒')+'<span>'+_rp2Esc(b.l)+'</span></div>';}).join('');
    var att=_rp2Attention();
    var attHtml=att.length?'<div class="rp2-card"><div class="rp2-ch">Needs your attention</div>'+att.map(function(a){return '<div class="rp2-att">'+a.i+' '+_rp2Esc(a.m)+'</div>';}).join('')+'</div>':'';
    return hero
      +'<div class="rp2-grid">'
      +_rp2KPI('Selected week',_rp2$(sw.revenue),momHtml)
      +_rp2KPI('QTD revenue',_rp2$(t.revenue),goal>0?('Goal '+_rp2$(goal)):'No goal set')
      +_rp2KPI('Quarter rank',rk?('#'+rk):'—','of '+ranks.length+' reps')
      +_rp2KPI('Week calls',sw.calls,(sw.calls>=125?'Weekly call target hit':'125 weekly target'))
      +_rp2KPI('Orders',(os?os.orders:(t.orders||0)),os?(_rp2$(os.aov)+' average order'):'quarter to date')
      +'</div>'
      +'<div class="rp2-charts">'
      +'<div class="rp2-card rp2-ring-card"><div class="rp2-ch">Quarter goal progress</div><div class="rp2-ring" style="background:conic-gradient(#FA873D '+(ringPct*3.6)+'deg, rgba(255,255,255,.07) 0);"><div class="rp2-ring-in"><div class="rp2-ring-pct">'+(pct!=null?pct+'%':'—')+'</div><div class="rp2-ring-sub">'+(goal>0?('of '+_rp2$(goal)):'no goal set')+'</div></div></div></div>'
      +'<div class="rp2-card"><div class="rp2-ch">Your weekly revenue trend</div><div class="rp2-cwrap"><canvas id="rp2-c-weekly"></canvas></div></div>'
      +'<div class="rp2-card"><div class="rp2-ch">You vs team average</div><div class="rp2-cwrap"><canvas id="rp2-c-vsavg"></canvas></div></div>'
      +'</div>'
      +'<div class="rp2-card"><div class="rp2-ch">Milestones · '+earned+' of '+badges.length+' earned</div><div class="rp2-badges">'+chips+'</div></div>'
      +attHtml
      +'<div class="rp2-card"><div class="rp2-ch">Quarter leaderboard · where you stand</div>'+bars+'</div>';
  };
  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep')setTimeout(function(){try{_rp2Go(_rp2.page||'dash');}catch(e){}},0);
  }catch(e){}
})();
