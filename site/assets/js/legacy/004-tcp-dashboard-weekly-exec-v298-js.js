
(function(){
  function fmtMoney(v){v=Number(v||0);return '$'+Math.round(v).toLocaleString();}
  function fmtNum(v){return Math.round(Number(v||0)).toLocaleString();}
  function pctVal(a,b){return b>0?Math.round((Number(a||0)/Number(b||0))*100):0;}
  function safe(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cls(p){p=Number(p||0);return p>=100?'green':p>=85?'amber':'red';}
  function statusText(p){return p>=100?'Healthy':p>=85?'Watch':'Risk';}
  function clampPct(p){return Math.min(100,Math.max(3,Number(p||0)));}
  function weekContext(){
    var yr=getYr(), q=getQ(), weeks=gwq(yr,q), key=getCWK();
    function todayIndex(){
      var today=new Date();
      var noon=new Date(today.getFullYear(),today.getMonth(),today.getDate(),12,0,0);
      for(var i=0;i<weeks.length;i++){
        var st=new Date(weeks[i].start); st.setHours(0,0,0,0);
        var en=new Date(weeks[i].end); en.setHours(23,59,59,999);
        if(noon>=st && noon<=en)return i;
      }
      var entered=Math.max((weeksElapsed(yr,q)||1)-1,0);
      return Math.min(entered,Math.max(0,weeks.length-1));
    }
    var currentIdx=todayIndex();
    var idx=weeks.findIndex(function(w){return w.key===key;});
    if(idx<0)idx=currentIdx;
    var wk=weeks[idx]||weeks[0]||{};
    var isFuture=idx>currentIdx;
    var labelNum=wk.num || idx+1;
    return {
      yr:yr,q:q,weeks:weeks,key:(wk.key||key||''),idx:idx,wk:wk,
      through:isFuture?[]:weeks.slice(0,idx+1),
      totalWeeks:weeks.length||13,quarterWeek:idx+1,weekNo:labelNum,
      currentIdx:currentIdx,currentWeekNo:(weeks[currentIdx]&&weeks[currentIdx].num)||(currentIdx+1),
      isCurrent:idx===currentIdx,isHistorical:idx<currentIdx,isFuture:isFuture
    };
  }
  function getRepGoal(r,yr,q){try{return repGoalObj(r.name,yr,q)||{};}catch(e){return {};}}
  function getTotalsForRep(r,weeks){try{return totW(r.name,weeks)||{};}catch(e){return {};}}
  function repRows(ctx){
    return activeReps().map(function(r){
      var t=getTotalsForRep(r,ctx.through), goal=getRepGoal(r,ctx.yr,ctx.q);
      var revGoal=Number(goal.rev||0);
      var weekFraction=ctx.totalWeeks>0?(ctx.quarterWeek/ctx.totalWeeks):0;
      var pacedRev=revGoal*weekFraction;
      var callGoal=Math.round(Number(goal.calls||0)*ctx.quarterWeek); // goal.calls is weekly call expectation
      var score=null;
      try{score=calcSc(r.name,t,goal,ctx.totalWeeks,getHRPoints(r.name,ctx.yr,ctx.q),ctx.quarterWeek);}catch(e){score={fin:0};}
      var actualCalls=Number(t.calls||0);
      var accountsCalled=Number(t.acctsCalled||0);
      var setSize=Number(t.setSize||0);
      var coverageP=setSize>0?pctVal(accountsCalled,setSize):(accountsCalled>0?100:0);
      var projectedRev=weekFraction>0?Number(t.revenue||0)/weekFraction:0;
      var gaps=0; (ctx.through||[]).forEach(function(w){var dd=gd(r.name+'|'+w.key); if((dd.revenue||0)>0&&(dd.calls||0)===0&&(dd.acctsCalled||0)===0)gaps++;});
      return {name:r.name,t:t,goal:goal,revGoal:revGoal,pacedRev:pacedRev,revP:pctVal(t.revenue,revGoal),pacedRevP:pctVal(t.revenue,pacedRev),projectedRev:projectedRev,projectedP:pctVal(projectedRev,revGoal),callGoal:callGoal,actualCalls:actualCalls,callP:pctVal(actualCalls,callGoal),accountsCalled:accountsCalled,setSize:setSize,coverageP:coverageP,score:score,gaps:gaps};
    }).sort(function(a,b){return Number(b.t.revenue||0)-Number(a.t.revenue||0);});
  }
  function teamTotals(rows){
    return rows.reduce(function(a,r){
      a.rev+=Number(r.t.revenue||0);
      a.orders+=Number(r.t.orders||0);
      a.calls+=Number(r.actualCalls||0);
      a.accts+=Number(r.accountsCalled||0);
      a.setSize+=Number(r.setSize||0);
      a.art+=Number(r.t.art||0);
      a.credits+=Number(r.t.credits||0);
      a.revGoal+=Number(r.revGoal||0);
      a.callGoal+=Number(r.callGoal||0);
      return a;
    },{rev:0,orders:0,calls:0,accts:0,setSize:0,art:0,credits:0,revGoal:0,callGoal:0});
  }
  function tooltip(key,text){return '<button type="button" class="wk-help" title="'+safe(text)+'" onclick="event.stopPropagation();showDashHelp(\''+safe(key)+'\')">?</button>';}
  function metric(lbl,val,sub,glow,tip,key){
    return '<div class="wk-metric" style="--glow:'+glow+'"><div class="wk-metric-label">'+safe(lbl)+(tip?tooltip(key||lbl,tip):'')+'</div><div class="wk-metric-value">'+safe(val)+'</div><div class="wk-metric-sub">'+safe(sub)+'</div></div>';
  }
  function creditMemoSummary(ctx){
    var weekKeys=new Set((ctx.through||[]).map(function(w){return w.key;}));
    var reps=new Set(activeReps().map(function(r){return r.name;}));
    var memos=(S.cms||[]).filter(function(c){return c&&reps.has(c.rep)&&weekKeys.has(c.weekKey)&&c.fault==='rep';});
    return {cases:memos.length,cost:memos.reduce(function(sum,c){return sum+Number(c.amount||0);},0)};
  }
  /* ===== v342 Snapshot card: Live data / Data Entered + timestamp / N-A ===== */
  function renderHero(ctx,totals){
    var revP=pctVal(totals.rev,totals.revGoal);
    var callsActual=Number(totals.calls||0);
    var callsP=pctVal(callsActual,totals.callGoal);
    var coverageP=pctVal(totals.accts,totals.setSize);
    var coverageSub=totals.setSize>0?(fmtNum(totals.accts)+' / '+fmtNum(totals.setSize)+' accounts'):(fmtNum(totals.accts)+' accounts reached');
    var _wePctH=ctx.totalWeeks>0?ctx.quarterWeek/ctx.totalWeeks:0;
    var _fullCallGoalH=ctx.quarterWeek>0?totals.callGoal*(ctx.totalWeeks/ctx.quarterWeek):0;
    var _revMH=paceModel(totals.rev,totals.revGoal,_wePctH);
    var _callMH=paceModel(callsActual,_fullCallGoalH,_wePctH);
    var _covMH=paceModel(totals.accts,totals.setSize,_wePctH);
    var _callsFullP=_fullCallGoalH>0?Math.round(callsActual/_fullCallGoalH*100):0;
    var artRate=totals.orders>0?(totals.art/totals.orders*100):0;
    var cm=creditMemoSummary(ctx);
    var crRate=totals.rev>0?(cm.cost/totals.rev*100):0;
    var dateLabel=(ctx.wk&&ctx.wk.label?String(ctx.wk.label).replace(/^Wk\s*\d+\s*:\s*/i,''):ctx.key);
    var viewLabel=ctx.isFuture?'Future Week':(ctx.isCurrent?'Live Preview':'Historical Snapshot');
    var viewCopy=ctx.isFuture?'No data should display until this week occurs.':(ctx.isCurrent?'Current week view.':'Historical snapshot through the selected week.');
    function fval(v){return ctx.isFuture?'—':v;}
    function fsub(v){return ctx.isFuture?'No data yet':v;}
    // v342 — snapshot status for the SELECTED week: Live data / Data Entered + when / N/A
    var _snapKey=ctx.key, _snapAny=false, _snapTimes=[];
    activeReps().forEach(function(r){var e=S.data[r.name+'|'+_snapKey];if(e){_snapAny=true;if(e.enteredAt)_snapTimes.push(Number(e.enteredAt));}});
    function _snapStamp(ms){try{return new Date(ms).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});}catch(e){return String(new Date(ms));}}
    var snapVal,snapSub;
    if(ctx.isFuture){snapVal='Future Week';snapSub='Future week selected';}
    else if(ctx.isCurrent){snapVal='Live Preview';snapSub='Live data';}
    else if(_snapAny){snapVal='Data Entered';snapSub=_snapTimes.length?_snapStamp(Math.max.apply(null,_snapTimes)):'Date not recorded';}
    else{snapVal='N/A';snapSub='No data entered';}
    document.getElementById('wkExecHero').innerHTML='<div class="wk-hero-main"><div class="wk-kicker">Weekly Executive Dashboard</div><h1>'+safe(ctx.q+' '+ctx.yr+' • Week '+ctx.weekNo)+'</h1><p><strong>'+safe(dateLabel)+'</strong> • '+safe(viewLabel)+'. Quarter week '+safe(ctx.quarterWeek)+' of '+safe(ctx.totalWeeks)+'. This dashboard uses weekly uploads, forecast updates, production feed, and management records.</p></div>'+ 
      metric('QTD Revenue',fval(fmtMoney(totals.rev)),fsub(revP+'% of '+fmtMoney(totals.revGoal)+' • cumulative through selected week'+(!_snapAny?' • selected-week scorecard missing':'')),'rgba(250,135,61,.24)','Cumulative quarter revenue through the selected week. This is NOT the standalone revenue for the selected week. Check Snapshot to confirm whether the selected week itself has a weekly scorecard.','metricRevenue')+
      metric('QTD Orders',fval(fmtNum(totals.orders)),fsub('Cumulative through selected week'+(!_snapAny?' • selected-week scorecard missing':'')),'rgba(0,175,239,.16)','Cumulative quarter orders through the selected week. This is not the standalone selected-week order count unless Snapshot confirms data was entered for that week.','metricOrders')+
      metric('Customers Called',fval(totals.setSize>0?(coverageP+'%'):fmtNum(totals.accts)),fsub(totals.setSize>0?(coverageSub+' • '+paceStatus(_covMH.gap,'accts',false)):coverageSub),'rgba(71,209,108,.18)','Customers called this quarter: unique accounts contacted through the selected week divided by your customer-set size (the goal is to reach every customer once). The marker shows where you should be by now.','metricCoverage')+
      metric('Art Errors',fval(artRate.toFixed(1)+'%'),fsub(fmtNum(totals.art)+' total errors'),'rgba(250,135,61,.20)','Art errors logged through the selected week divided by orders through the selected week.','metricArtErrors')+
      metric('Credit Memo Cost',fval(fmtMoney(cm.cost)),fsub(cm.cases+' rep-fault cases • '+crRate.toFixed(2)+'% revenue impact'),'rgba(250,135,61,.18)','Rep-fault credit memo dollars from the Credit Memos tab through the selected week. Customer/vendor fault credits are tracked elsewhere but are not counted here for coaching impact.','metricCreditMemos')+
      metric('Snapshot',snapVal,snapSub,'rgba(250,135,61,.20)','Shows the data status for the selected week: live (current week), previously entered data with the date it was saved, or N/A when no data exists. Future weeks intentionally show blank data.','metricSnapshot');
  }

  function renderTimeline(ctx){
    var html='<div class="wk-timeline-head"><div><div class="wk-kicker">Quarter timeline</div><div class="wk-muted">Click a week to review that historical snapshot.</div></div><span class="wk-pill">Week '+ctx.weekNo+' of '+ctx.totalWeeks+'</span></div><div class="wk-timeline">';
    ctx.weeks.forEach(function(w,i){html+='<button type="button" class="wk-week-btn '+(i===ctx.idx?'active ':'')+(i>ctx.currentIdx?'future':'')+'" onclick="setDashboardWeek(\''+safe(w.key)+'\')">W'+(i+1)+'</button>';});
    html+='</div>'; document.getElementById('wkQuarterTimeline').innerHTML=html;
  }
  function healthCard(label,pct,copy){return '<div class="wk-health-card"><div class="wk-health-top"><div class="wk-health-label">'+safe(label)+'</div><span class="wk-status '+cls(pct)+'">'+statusText(pct)+'</span></div><div class="wk-health-value">'+Math.round(pct)+'%</div><div class="wk-health-copy">'+safe(copy)+'</div><div class="wk-bar" style="--w:'+clampPct(pct)+'%"><span></span></div></div>';}
  function renderPulse(ctx,rows,totals){
    var host=document.getElementById('wkLiveNumbers'); if(!host)return;
    var badge=document.getElementById('wkPulseBadge'); if(badge)badge.textContent=ctx.isFuture?'Future Week':(ctx.isCurrent?'Live • This Quarter':'Selected Week');
    if(ctx.isFuture){host.innerHTML='<div class="wk-pulse-sub" style="padding:6px 2px;">No data yet \u2014 this week hasn\u2019t happened.</div>';return;}
    var wePct=ctx.totalWeeks>0?ctx.quarterWeek/ctx.totalWeeks:0;
    var wr=Math.max(0,ctx.totalWeeks-ctx.quarterWeek);
    var weeksLeft=Math.max(1,ctx.totalWeeks-ctx.quarterWeek);
    var fullCallGoal=ctx.quarterWeek>0?totals.callGoal*(ctx.totalWeeks/ctx.quarterWeek):0;
    function card(label,actual,goal,money){
      var m=paceModel(actual,goal,wePct);
      var shouldBe=m.pacedTarget, diff=actual-shouldBe;
      var perWk=Math.max(0,goal-actual)/weeksLeft;
      var fmt=money?fmtMoney:function(x){return fmtNum(Math.round(x));};
      var diffStr=(diff>=0?'+':'\u2212')+fmt(Math.abs(diff));
      var statusStr=(diff>=0?'Ahead by ':'Behind by ')+fmt(Math.abs(diff));
      return '<div class="wk-bd-card">'+
        '<div class="wk-bd-head"><div class="wk-bd-title">'+safe(label)+'</div><span style="'+paceToneCss(m.tone)+'border-radius:999px;padding:3px 9px;font-size:10px;font-weight:850;white-space:nowrap;">'+safe(statusStr)+'</span></div>'+
        '<div class="wk-bd-actual">'+safe(fmt(actual))+' <span class="wk-bd-actlabel">actual</span></div>'+
        '<div class="profile-pace-bar" style="--fill:'+m.fillPct+'%;--notch:'+m.notchPct+'%;--barcolor:'+m.color+';margin:24px 0 11px;"><div class="profile-pace-fill"></div><div class="profile-pace-notch" title="Where pace says you should be by now"><span>should be</span></div></div>'+
        '<div class="wk-bd-grid">'+
          '<div><div class="wk-bd-k">Goal</div><div class="wk-bd-v">'+safe(fmt(goal))+'</div></div>'+
          '<div><div class="wk-bd-k">Still needed</div><div class="wk-bd-v">'+safe(fmt(Math.max(0,goal-actual)))+'</div></div>'+
          '<div><div class="wk-bd-k">Per wk left</div><div class="wk-bd-v">'+safe(fmt(perWk))+'</div></div>'+
          '<div><div class="wk-bd-k">Vs pace</div><div class="wk-bd-v" style="color:'+m.color+'">'+safe(diffStr)+'</div></div>'+
        '</div></div>';
    }
    var teamWrap='<div class="wk-bd-wrap">'+card('Sales',totals.rev,totals.revGoal,true)+card('Customers Called',totals.accts,totals.setSize,false)+'</div>';
    function miniBar(fillPct,notchPct,color){return '<div class="wk-bd-mini"><i style="width:'+Math.max(0,Math.min(100,fillPct))+'%;background:'+color+'"></i><span style="left:'+Math.max(0,Math.min(100,notchPct))+'%"></span></div>';}
    function cells(actual,goal,m,money,lead){
      var fmt=money?fmtMoney:function(x){return fmtNum(Math.round(x));};
      var lc=lead?' class="wk-bd-sep"':'';
      if(!(goal>0)){return '<td'+lc+'>'+safe(fmt(actual))+'</td><td class="wk-bd-muted">\u2014</td><td class="wk-bd-muted">\u2014</td><td class="wk-bd-muted">\u2014</td><td></td>';}
      var diff=actual-m.pacedTarget;
      return '<td'+lc+'>'+safe(fmt(actual))+'</td><td>'+safe(fmt(goal))+'</td><td>'+safe(fmt(Math.max(0,goal-actual)/weeksLeft))+'</td><td style="color:'+m.color+'">'+(diff>=0?'+':'\u2212')+safe(fmt(Math.abs(diff)))+'</td><td>'+miniBar(m.fillPct,m.notchPct,m.color)+'</td>';
    }
    var bodyRows=(rows||[]).map(function(r){
      var sM=paceModel(r.t.revenue,r.revGoal,wePct);
      var cM=paceModel(r.accountsCalled,r.setSize,wePct);
      return '<tr><td class="rep">'+safe(r.name)+'</td>'+cells(r.t.revenue,r.revGoal,sM,true,false)+cells(r.accountsCalled,r.setSize,cM,false,true)+'</tr>';
    }).join('');
    var tbl='<div class="wk-bd-table-wrap"><table class="wk-bd-table"><thead>'+
      '<tr><th></th><th class="grp" colspan="5">Sales</th><th class="grp calls" colspan="5">Customers Called</th></tr>'+
      '<tr><th>Rep</th><th>Actual</th><th>Goal</th><th>Per Wk Left</th><th>Vs Pace</th><th>Pace</th><th class="wk-bd-sep">Actual</th><th>Goal</th><th>Per Wk Left</th><th>Vs Pace</th><th>Pace</th></tr>'+
      '</thead><tbody>'+bodyRows+'</tbody></table></div>';
    host.innerHTML=teamWrap+tbl;
  }
  // ===== Unified pace model (mirrors the rep-profile pace tracker) =====
  function paceModel(actual,fullGoal,wePct){actual=Number(actual)||0;fullGoal=Number(fullGoal)||0;wePct=Number(wePct)||0;var pacedTarget=fullGoal*wePct,gap=pacedTarget-actual;var fillPct=fullGoal>0?Math.min(100,(actual/fullGoal)*100):0;var notchPct=fullGoal>0?Math.min(100,(pacedTarget/fullGoal)*100):0;var pacedPct=pacedTarget>0?(actual/pacedTarget)*100:(actual>0?100:0);var color=pacedPct>=95?'#47D16C':pacedPct>=80?'#FA873D':'#FA873D';var tone=gap<=0?'good':(pacedPct>=80?'warn':'bad');return{pacedTarget:pacedTarget,gap:gap,fillPct:fillPct,notchPct:notchPct,pacedPct:pacedPct,color:color,tone:tone};}
  function paceToneCss(t){return t==='good'?'background:rgba(71,209,108,.13);color:#9CFFC0;border:1px solid rgba(71,209,108,.35);':t==='warn'?'background:rgba(250,135,61,.14);color:#FFD27A;border:1px solid rgba(250,135,61,.34);':'background:rgba(250,135,61,.14);color:#FFB3C8;border:1px solid rgba(250,135,61,.34);';}
  function paceStatus(gap,unit,money){var ahead=gap<=0;var amt=money?fmtMoney(Math.abs(gap)):fmtNum(Math.round(Math.abs(gap)));return (ahead?'Ahead by ':'Behind by ')+amt+(unit?(' '+unit):'');}
  function barCard(label,valueStr,subStr,fillPct,markerPct,markerLabel,color,statusStr,tone){var marker=(markerPct!=null)?'<div class="profile-pace-notch" title="'+safe(markerLabel||'')+'"><span>'+safe(markerLabel||'')+'</span></div>':'';return '<div class="wk-health-card"><div class="wk-health-top"><div class="wk-health-label">'+safe(label)+'</div><span style="'+paceToneCss(tone)+'border-radius:999px;padding:3px 9px;font-size:10px;font-weight:850;white-space:nowrap;">'+safe(statusStr)+'</span></div><div class="wk-health-value">'+safe(valueStr)+'</div><div class="profile-pace-bar" style="--fill:'+Math.max(0,Math.min(100,Number(fillPct)||0))+'%;--notch:'+Math.max(0,Math.min(100,Number(markerPct)||0))+'%;--barcolor:'+color+';margin:20px 0 9px;"><div class="profile-pace-fill"></div>'+marker+'</div><div class="wk-health-copy">'+safe(subStr)+'</div></div>';}
  function paceCard(label,valueStr,subStr,m,statusStr){return barCard(label,valueStr,subStr,m.fillPct,m.notchPct,'paced',m.color,statusStr,m.tone);}
  function renderHealth(ctx,rows,totals){
    var wePct=ctx.totalWeeks>0?ctx.quarterWeek/ctx.totalWeeks:0;
    var fullCallGoal=ctx.quarterWeek>0?totals.callGoal*(ctx.totalWeeks/ctx.quarterWeek):0;
    var revM=paceModel(totals.rev,totals.revGoal,wePct);
    var callM=paceModel(totals.calls,fullCallGoal,wePct);
    var covM=paceModel(totals.accts,totals.setSize,wePct);
    var projected=ctx.quarterWeek>0?totals.rev/wePct:0, forecastP=pctVal(projected,totals.revGoal);
    var artRate=totals.orders>0?(totals.art/totals.orders*100):0, qualityP=Math.max(0,Math.round(100-(artRate*12)));
    var _sb=document.getElementById('wkSnapshotBadge'); if(_sb)_sb.textContent=ctx.isCurrent?'Current Week':'Historical Snapshot';
    document.getElementById('wkQuarterHealth').innerHTML=
      paceCard('Revenue Pace',fmtMoney(totals.rev),Math.round(revM.fillPct)+'% of '+fmtMoney(totals.revGoal)+' goal',revM,paceStatus(revM.gap,'',true))+
      paceCard('Customers Called',fmtNum(totals.accts)+' / '+fmtNum(totals.setSize),Math.round(covM.fillPct)+'% of customers reached',covM,paceStatus(covM.gap,'accts',false))+
      barCard('Forecast Health',fmtMoney(projected),Math.round(forecastP)+'% of '+fmtMoney(totals.revGoal)+' at current run rate',Math.min(100,forecastP),100,'goal',(forecastP>=100?'#47D16C':forecastP>=85?'#FA873D':'#FA873D'),(projected>=totals.revGoal?('On track +'+fmtMoney(projected-totals.revGoal)):('Projected '+fmtMoney(totals.revGoal-projected)+' short')),(forecastP>=100?'good':forecastP>=85?'warn':'bad'))+
      barCard('Quality Health',Math.round(qualityP)+'%',fmtNum(totals.art)+' art errors on '+fmtNum(totals.orders)+' orders',qualityP,null,'',(qualityP>=85?'#47D16C':qualityP>=70?'#FA873D':'#FA873D'),(artRate.toFixed(1)+'% art rate'),(qualityP>=85?'good':qualityP>=70?'warn':'bad'));
  }
  function renderTeam(ctx,rows){
    document.getElementById('wkTeamCount').textContent=rows.length+' active reps';
    var html='<table class="wk-table"><thead><tr><th>Rep</th><th>Revenue</th><th>Revenue Pace</th><th>Customers Called</th><th>Orders</th><th>Score</th><th>Status</th></tr></thead><tbody>';
    rows.forEach(function(r){var s=Math.min(r.pacedRevP||0,r.callP||0,r.coverageP||0);html+='<tr onclick="try{selectRep(\''+safe(r.name).replace(/&#39;/g,"\'")+'\');gt(\'profiles\',document.querySelector(\'[onclick*=profiles]\'));}catch(e){}" style="cursor:pointer"><td>'+safe(r.name)+(r.gaps>0?' <span title="'+r.gaps+' week(s) have revenue but no calls/accounts logged \u2014 totals may understate activity" style="color:#EF9F27;cursor:help;">\u26A0</span>':'')+'</td><td>'+fmtMoney(r.t.revenue)+'</td><td><span class="wk-status '+cls(r.pacedRevP)+'">'+r.pacedRevP+'%</span></td><td>'+fmtNum(r.accountsCalled)+' / '+fmtNum(r.setSize)+' <span class="wk-muted">('+r.coverageP+'%)</span></td><td>'+fmtNum(r.t.orders)+'</td><td>'+(r.score&&r.score.fin?Number(r.score.fin).toFixed(1):'—')+'</td><td><span class="wk-dots"><span class="wk-dot '+cls(r.pacedRevP)+'" title="Revenue pace '+Math.round(r.pacedRevP||0)+'%">R</span><span class="wk-dot '+cls(r.coverageP)+'" title="Customers called '+Math.round(r.coverageP||0)+'%">C</span></span></td></tr>';});
    html+='</tbody></table>'; html+='<div class="wk-dots-legend"><b>R</b> Revenue&nbsp;&nbsp;<b>C</b> Customers Called&nbsp;&nbsp;&bull;&nbsp;&nbsp;<span class="wk-dot green wk-dot-sm"></span> on pace (100%+)&nbsp;&nbsp;<span class="wk-dot amber wk-dot-sm"></span> behind (85\u201399%)&nbsp;&nbsp;<span class="wk-dot red wk-dot-sm"></span> well behind (&lt;85%)</div>'; document.getElementById('wkTeamPace').innerHTML=html;
  }
  function renderForecast(ctx,rows,totals){
    var projected=ctx.quarterWeek>0?totals.rev/(ctx.quarterWeek/ctx.totalWeeks):0, gap=Math.max(0,totals.revGoal-projected), weeksRemain=Math.max(0,ctx.totalWeeks-ctx.quarterWeek), need=weeksRemain>0?Math.max(0,(totals.revGoal-totals.rev)/weeksRemain):0;
    var highest=rows.slice().sort(function(a,b){return b.projectedP-a.projectedP;})[0], lowest=rows.slice().sort(function(a,b){return a.projectedP-b.projectedP;})[0];
    document.getElementById('wkForecastCenter').innerHTML='<div class="wk-forecast-grid">'+
      smallCard('Projection',fmtMoney(projected),pctVal(projected,totals.revGoal)+'% of goal')+
      smallCard('Goal',fmtMoney(totals.revGoal),'Quarter target')+
      smallCard('Gap',fmtMoney(gap),gap>0?'Projected shortfall':'Projected surplus')+
      smallCard('Need / Week',fmtMoney(need),weeksRemain+' weeks remaining')+
      smallCard('Highest Forecast Rep',highest?highest.name:'—',highest?highest.projectedP+'% projected':'No data')+
      smallCard('Lowest Forecast Rep',lowest?lowest.name:'—',lowest?lowest.projectedP+'% projected':'No data')+
      '</div>';
  }
  function smallCard(label,value,sub){return '<div class="wk-forecast-card"><div class="wk-small-label">'+safe(label)+'</div><div class="wk-small-value">'+safe(value)+'</div><div class="wk-muted" style="margin-top:5px;">'+safe(sub)+'</div></div>';}
  function renderWatch(ctx,rows,totals){
    var projected=ctx.quarterWeek>0?totals.rev/(ctx.quarterWeek/ctx.totalWeeks):0;
    var opportunity=rows.filter(function(r){return r.coverageP<90;}).sort(function(a,b){return a.coverageP-b.coverageP;})[0];
    var risk=rows.filter(function(r){return r.pacedRevP<90;}).sort(function(a,b){return a.pacedRevP-b.pacedRevP;})[0];
    var coaching=rows.filter(function(r){return (r.score&&r.score.fin&&r.score.fin<3)||r.callP<80||r.coverageP<80||r.pacedRevP<80;})[0];
    var prod=productionItems().filter(function(p){return p.cls!=='green';})[0];
    document.getElementById('wkStrategicWatchlist').innerHTML=
      watchCard('↗','Biggest Opportunity',opportunity?opportunity.name+' has customer-set coverage opportunity at '+opportunity.coverageP+'%.':'No major coverage opportunity flagged.')+
      watchCard('⚠','Biggest Risk',projected<totals.revGoal?'Forecast gap is '+fmtMoney(totals.revGoal-projected)+' based on selected week.':(risk?risk.name+' is under revenue pace at '+risk.pacedRevP+'%.':'Quarter projection is currently healthy.'))+
      watchCard('🏭','Production Concern',prod?prod.name+' is shipping '+prod.ship+'.':'No production concerns flagged from current feed.')+
      watchCard('👤','Coaching Opportunity',coaching?coaching.name+' should be reviewed for pace, coverage, or scorecard trend.':'No immediate coaching concern flagged.');
  }
  function watchCard(icon,title,copy){return '<div class="wk-watch-card"><div class="wk-watch-icon">'+safe(icon)+'</div><div><div class="wk-watch-title">'+safe(title)+'</div><div class="wk-watch-copy">'+safe(copy)+'</div></div></div>';}
  function productionItems(){
    var raw=[]; try{raw=(window.tcpProductionData||JSON.parse(localStorage.getItem('tcp_production_rows')||'[]')||[]);}catch(e){raw=[];}
    if(!raw.length) raw=[{name:'Screen Print',ship:'Not connected',cls:'amber'},{name:'Embroidery',ship:'Not connected',cls:'amber'},{name:'DTF >500',ship:'Not connected',cls:'amber'}];
    return raw.map(function(x){var name=x.Decoration||x.decoration||x.name||x.type||'Production';var ship=x['Ship Week']||x.shipWeek||x.ship||x.date||'';var days=null, c='green';var d=new Date(ship);if(ship&&!isNaN(d)){days=Math.ceil((d-new Date())/86400000);c=days>14?'red':days>9?'amber':'green';}else c=x.cls||'amber';return {name:name,ship:ship||'Not set',days:days,cls:c};});
  }
  function renderProduction(){
    var prod=productionItems(), red=prod.filter(function(p){return p.cls==='red';}).length, amber=prod.filter(function(p){return p.cls==='amber';}).length;
    document.getElementById('wkProdBadge').textContent=red?'Extended':amber?'Watch':'Normal';
    document.getElementById('wkProdBadge').className='wk-pill '+(red?'':'wk-pill-green');
    document.getElementById('wkProductionPulse').innerHTML=prod.map(function(p){return '<div class="wk-prod-row"><div><div class="wk-prod-name">'+safe(p.name)+'</div><div class="wk-prod-sub">Ship week: '+safe(p.ship)+(p.days!=null?' • '+p.days+' days out':'')+'</div></div><span class="wk-status '+p.cls+'">'+(p.cls==='green'?'Normal':p.cls==='amber'?'Watch':'Extended')+'</span></div>';}).join('') || '<div class="wk-empty">No production feed loaded yet.</div>';
  }
  function notesKey(){return 'tcp_weekly_manager_notes_'+(getYr()||'')+'_'+(getQ()||'')+'_'+(getCWK()||'');}
  window.saveWeeklyManagerNotes=function(){var el=document.getElementById('wkManagerNotes'); if(!el)return; localStorage.setItem(notesKey(),el.value||''); var s=document.getElementById('wkNotesStatus'); if(s){s.textContent='Saved'; setTimeout(function(){s.textContent='';},1800);} };
  function renderNotes(ctx){var el=document.getElementById('wkManagerNotes'); if(el)el.value=localStorage.getItem(notesKey())||''; var lab=document.getElementById('wkNotesLabel'); if(lab)lab.textContent='Week '+ctx.weekNo+' notes';}
  function renderWins(rows){
    var topRev=rows[0], topCalls=rows.slice().sort(function(a,b){return b.actualCalls-a.actualCalls;})[0], mostOrders=rows.slice().sort(function(a,b){return Number(b.t.orders||0)-Number(a.t.orders||0);})[0], mostImproved=rows.filter(function(r){return r.pacedRevP>=100&&r.callP>=100&&r.coverageP>=85;})[0];
    document.getElementById('wkWinsBoard').innerHTML='<div class="wk-win-grid">'+
      winCard('Largest Revenue',topRev?topRev.name:'—',topRev?fmtMoney(topRev.t.revenue):'No data')+
      winCard('Most Customers Called',topCalls?topCalls.name:'—',topCalls?fmtNum(topCalls.actualCalls)+' calls':'No data')+
      winCard('Most Orders',mostOrders?mostOrders.name:'—',mostOrders?fmtNum(mostOrders.t.orders)+' orders':'No data')+
      winCard('On-Pace Standout',mostImproved?mostImproved.name:'—',mostImproved?'Revenue and calls on pace':'No standout yet')+
      '</div>';
  }
  function winCard(label,name,sub){return '<div class="wk-win-card"><div class="wk-small-label">'+safe(label)+'</div><div class="wk-small-value">'+safe(name)+'</div><div class="wk-muted" style="margin-top:5px;">'+safe(sub)+'</div></div>';}
  var DASH_HELP={
    metricRevenue:{title:'Revenue',sub:'Executive KPI',body:'<p><strong>What it shows:</strong> total revenue from weekly Data Entry for all active reps through the selected week.</p><ul><li><strong>Source:</strong> <code>S.data[rep|weekKey].revenue</code></li><li><strong>Calculation:</strong> sum of weekly revenue for every selected week from the start of the quarter through the selected week.</li><li><strong>Use:</strong> coaching around sales pace and revenue gap.</li></ul>'},
    metricOrders:{title:'Orders',sub:'Executive KPI',body:'<p><strong>What it shows:</strong> total order count from weekly Data Entry through the selected week.</p><ul><li><strong>Source:</strong> <code>S.data[rep|weekKey].orders</code></li><li><strong>Calculation:</strong> sum of orders for all active reps through the selected week.</li><li><strong>Use:</strong> volume health and order activity trend.</li></ul>'},
    metricCalls:{title:'Calls',sub:'Executive KPI',body:'<p><strong>What it shows:</strong> total calls logged through the selected week compared to the paced call goal.</p><ul><li><strong>Source:</strong> <code>S.data[rep|weekKey].calls</code></li><li><strong>Goal:</strong> each rep’s weekly call goal × number of selected quarter weeks elapsed.</li><li><strong>Use:</strong> activity accountability and coaching.</li></ul>'},
    metricCoverage:{title:'Coverage',sub:'Executive KPI',body:'<p><strong>What it shows:</strong> percent of assigned customer set contacted through the selected week.</p><ul><li><strong>Source:</strong> <code>acctsCalled</code> and <code>setSize</code> from weekly Data Entry.</li><li><strong>Calculation:</strong> accounts called ÷ assigned customer-set size.</li><li><strong>Use:</strong> customer-base penetration and follow-up discipline.</li></ul>'},
    metricArtErrors:{title:'Art Errors',sub:'Executive KPI',body:'<p><strong>What it shows:</strong> quality risk from the Art Errors tab.</p><ul><li><strong>Source:</strong> <code>S.artErrors</code> matching active reps and selected weeks.</li><li><strong>Calculation:</strong> art errors ÷ orders.</li><li><strong>Use:</strong> identify quality/process coaching opportunities.</li></ul>'},
    metricCreditMemos:{title:'Credit Memo Cost',sub:'Executive KPI',body:'<p><strong>What it shows:</strong> rep-fault credit memo dollars and case count through the selected week.</p><ul><li><strong>Source:</strong> Credit Memos tab, <code>S.cms</code>.</li><li><strong>Calculation:</strong> sum of credit memo amounts where fault is rep and week is included in the selected snapshot.</li><li><strong>Use:</strong> coaching on avoidable mistakes. Customer/vendor fault credits are not counted here.</li></ul>'},
    metricSnapshot:{title:'Snapshot Status',sub:'Executive KPI',body:'<p><strong>What it shows:</strong> the data status for the selected week.</p><ul><li><strong>Live data:</strong> the selected week is the current week (live preview).</li><li><strong>Data Entered:</strong> a past week that has saved data, shown with the date and time it was last entered.</li><li><strong>N/A:</strong> a past week with no data entered.</li><li><strong>Future Week:</strong> the week has not occurred yet, so data intentionally shows blank.</li></ul><p style="margin-top:6px;color:var(--color-text-secondary);">Note: weeks last saved before this feature will show "Data Entered - date not recorded" until they are re-saved.</p>'},
    quarterHealth:{title:'Current State of the Business',sub:'Quarter Health',body:'<p>This section converts the scoreboard into color-coded health signals.</p><ul><li><strong>Revenue Health:</strong> revenue compared to paced revenue goal for the selected week.</li><li><strong>Call Health:</strong> logged calls compared to paced call goal.</li><li><strong>Coverage Health:</strong> customer-set coverage through selected week.</li><li><strong>Forecast Health:</strong> projected finish based on selected-week run rate.</li><li><strong>Quality Health:</strong> quality signal driven primarily by art error rate.</li></ul><p>Use this as the quick executive read before coaching conversations.</p>'},
    teamPace:{title:'Team Pace Center',sub:'Team Management',body:'<p>This is the main coaching table. Each row is calculated through the selected week.</p><ul><li><strong>Revenue:</strong> QTD revenue through selected week.</li><li><strong>Revenue Pace:</strong> revenue compared to where the rep should be by this week.</li><li><strong>Calls:</strong> logged calls vs weekly call goal × selected quarter weeks.</li><li><strong>Coverage:</strong> accounts called ÷ assigned set size.</li><li><strong>Score:</strong> existing scorecard model using revenue, coverage, credits, art errors, hours, and HR cap.</li></ul><p>Click a row to open that rep’s profile.</p>'},
    forecastCenter:{title:'Forecast Center',sub:'Forecast',body:'<p>This section estimates where the quarter is headed based on the selected week.</p><ul><li><strong>Projection:</strong> current QTD revenue divided by quarter progress, projected over the full quarter.</li><li><strong>Gap:</strong> full quarter goal minus projected finish.</li><li><strong>Need / Week:</strong> remaining dollars required per remaining week to hit goal.</li><li><strong>Highest/Lowest Forecast Rep:</strong> projected percent to goal for each rep using selected-week run rate.</li></ul><p>This should be treated as a management forecast, not a guarantee.</p>'},
    strategicWatchlist:{title:'Strategic Watchlist',sub:'Management Intelligence',body:'<p>This is not a daily alert feed. It highlights the biggest business signals from the selected snapshot.</p><ul><li><strong>Biggest Opportunity:</strong> usually a coverage or activity gap that can still be improved.</li><li><strong>Biggest Risk:</strong> forecast or revenue pace concern.</li><li><strong>Production Concern:</strong> pulled from the live production feed.</li><li><strong>Coaching Opportunity:</strong> rep with score, revenue, call, or coverage concern.</li></ul>'},
    productionPulse:{title:'Production Pulse',sub:'Production',body:'<p>Shows current production timing from the production feed.</p><ul><li><strong>Source:</strong> Google Sheet CSV / production feed when connected; otherwise shows not connected.</li><li><strong>Status:</strong> normal, watch, or extended based on ship date timing.</li><li><strong>Use:</strong> helps sales managers coach reps on what can realistically be sold and delivered.</li></ul>'},
    managerNotes:{title:'Manager Notes',sub:'Historical Memory',body:'<p>Week-specific notes that save with the selected week.</p><ul><li>Use for context that numbers do not explain: staffing, trade shows, production delays, promotions, weather, major customer pushes, etc.</li><li>When you switch back to a prior week, that week’s notes load again.</li><li>This creates a historical management record for coaching and reporting.</li></ul>'},
    winsBoard:{title:'Positive Momentum',sub:'Wins Board',body:'<p>Highlights positive performance signals from the selected snapshot.</p><ul><li><strong>Largest Revenue:</strong> top rep by revenue.</li><li><strong>Top Caller:</strong> highest call count.</li><li><strong>Most Orders:</strong> highest order volume.</li><li><strong>On-Pace Standout:</strong> rep meeting revenue, calls, and coverage expectations.</li></ul><p>This keeps the dashboard balanced: risks plus recognition.</p>'}
  };
  window.showDashHelp=function(key){var h=DASH_HELP[key]||DASH_HELP.metricSnapshot;var pop=document.getElementById('wkHelpPop');if(!pop)return;document.getElementById('wkHelpTitle').textContent=h.title;document.getElementById('wkHelpSub').textContent=h.sub||'Dashboard guide';document.getElementById('wkHelpBody').innerHTML=h.body+'<div class="wk-data-audit">Accuracy note: dashboard numbers are calculated from the selected Year / Quarter / Month / Week at the top of the app. Current week = live preview. Past week = historical snapshot. Future week = intentionally blank.</div>';pop.classList.add('open');};
  window.hideDashHelp=function(){var pop=document.getElementById('wkHelpPop');if(pop)pop.classList.remove('open');};
  document.addEventListener('keydown',function(e){if(e.key==='Escape')hideDashHelp();});
  window.setDashboardWeek=function(key){var sel=document.getElementById('selW'); if(sel){sel.value=key; if(typeof onWChange==='function')onWChange();} else {try{localStorage.setItem('cwk',key);}catch(e){} if(window.renderDash)window.renderDash();}};
  function actionCard(icon,title,copy,action,level){return '<div class="mgr-card '+(level||'')+'"><div class="mgr-icon">'+icon+'</div><div><div class="mgr-card-title">'+safe(title)+'</div><div class="mgr-card-copy">'+copy+'</div>'+(action?'<div class="mgr-card-action">'+safe(action)+'</div>':'')+'</div></div>';}
  function renderCoachingQueue(rows){
    var q=document.getElementById('wkCoachingQueue'); if(!q)return;
    var needs=[];
    (rows||[]).forEach(function(r){
      var issues=[];
      if(r.pacedRevP<85)issues.push('revenue pace '+r.pacedRevP+'%');
      if(r.coverageP<70)issues.push('customers called '+r.coverageP+'%');
      if((r.t.art||0)>=3)issues.push((r.t.art||0)+' art errors');
      if((r.t.credits||0)>0)issues.push(fmtMoney(r.t.credits)+' rep-fault credits');
      if(issues.length)needs.push({r:r,issues:issues,sev:(r.pacedRevP<70||r.coverageP<55)?'red':'amber'});
    });
    needs.sort(function(a,b){return (Number(a.r.score&&a.r.score.fin||0))-(Number(b.r.score&&b.r.score.fin||0));});
    var pill=document.getElementById('wkCoachPill'); if(pill)pill.textContent=needs.length+' open';
    q.innerHTML=needs.length?needs.slice(0,6).map(function(x){return actionCard(x.sev==='red'?'\uD83D\uDD34':'\uD83D\uDFE1',x.r.name,x.issues.join(' \u2022 '),'Recommended: review rep profile and set one measurable next step.',x.sev);}).join(''):'<div class="wk-empty">No urgent coaching risks based on the selected week.</div>';
  }
  function renderMgrPriorities(rows){
    var el=document.getElementById('wkMgrPriorities'); if(!el)return;
    var revRisk=(rows||[]).filter(function(r){return r.pacedRevP<85;}).length;
    var covRisk=(rows||[]).filter(function(r){return r.coverageP<70;}).length;
    var artRisk=(rows||[]).filter(function(r){return (r.t.art||0)>=3;}).length;
    el.innerHTML=
      actionCard('1','Revenue focus',revRisk+' rep'+(revRisk===1?'':'s')+' below revenue pace.','Run pipeline/quote review with the lowest-pace reps.',revRisk?'amber':'green')+
      actionCard('2','Customers-called focus',covRisk+' rep'+(covRisk===1?'':'s')+' below customer-set coverage.','Confirm customer-set progress and blockers.',covRisk?'amber':'green')+
      actionCard('3','Quality focus',artRisk+' rep'+(artRisk===1?'':'s')+' with 3+ art errors.','Review art-error patterns and root causes.',artRisk?'amber':'green');
  }
  function renderUpcomingNotes(ctx){
    var el=document.getElementById('wkUpcomingNotes'); if(!el)return;
    var items=[];
    (S.coachingNotes||[]).slice(-5).reverse().forEach(function(n){items.push(actionCard('\uD83D\uDCDD','Coaching note: '+(n.rep||'Rep'),safe(n.type||'note')+(n.note?': '+safe(String(n.note).slice(0,120)):''),'Review in rep profile.','amber'));});
    (S.hrViolations||[]).slice(-3).reverse().forEach(function(n){items.push(actionCard('\u26A0\uFE0F','HR follow-up: '+(n.rep||'Rep'),safe((n.category||n.type||'HR note'))+(n.note?': '+safe(String(n.note).slice(0,100)):''),'Review HR & Notes.','red'));});
    el.innerHTML=items.length?items.slice(0,6).join(''):'<div class="wk-empty">No recent coaching or HR notes logged.</div>';
  }
  window.renderDash=function(){
    try{
      var ctx=weekContext(), rows=repRows(ctx), totals=teamTotals(rows);
      renderHero(ctx,totals);
      renderPulse(ctx,rows,totals);
      if(ctx.isFuture){
        var badge=document.getElementById('wkSnapshotBadge'); if(badge)badge.textContent='Future Week • No Data';
        ['wkQuarterHealth','wkTeamPace','wkForecastCenter','wkStrategicWatchlist','wkProductionPulse','wkWinsBoard','wkCoachingQueue','wkMgrPriorities','wkUpcomingNotes'].forEach(function(id){var el=document.getElementById(id); if(el)el.innerHTML='<div class="wk-empty">No data is available for this future week yet.</div>';});
        var tc=document.getElementById('wkTeamCount'); if(tc)tc.textContent='Future week';
        var pb=document.getElementById('wkProdBadge'); if(pb){pb.textContent='No data'; pb.className='wk-pill';}
        renderNotes(ctx);
        var alF=document.getElementById('dAlerts'); if(alF)alF.innerHTML='';
        return;
      }
      renderHealth(ctx,rows,totals);renderTeam(ctx,rows);renderForecast(ctx,rows,totals);renderWatch(ctx,rows,totals);renderProduction();renderNotes(ctx);renderWins(rows);renderCoachingQueue(rows);renderMgrPriorities(rows);renderUpcomingNotes(ctx);
      var al=document.getElementById('dAlerts'); if(al)al.innerHTML='';
    }catch(e){console.error('Dashboard render failed',e);var d=document.getElementById('wkExecHero'); if(d)d.innerHTML='<div class="wk-empty">Dashboard could not render: '+safe(e.message)+'</div>';}
  };
  window.renderDashWidgets=window.renderDash;
  setTimeout(function(){var pg=document.getElementById('pg-dash'); if(pg&&pg.classList.contains('active')) window.renderDash();},0);
})();

/* v307 apply saved theme on load */
try{ if(typeof injectThemeCSS==='function') injectThemeCSS(loadTheme()); }catch(e){console.warn('[theme init]',e);}
