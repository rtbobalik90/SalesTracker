
(function(){
  function n(v){return Number(v)||0;}
  function m(v){return _rp2$(n(v));}
  function esc(v){return _rp2Esc(String(v==null?'':v));}
  function guideContext(){
    var c=window._rp2V476Context?window._rp2V476Context(_rp2.rep):null;
    if(!c)return null;

    var entered=[];
    c.through.forEach(function(w){
      var d=(S.data||{})[c.rep+'|'+w.key]||{};
      if(n(d.revenue)||n(d.orders)||n(d.calls)){
        entered.push({week:w,revenue:n(d.revenue),orders:n(d.orders),calls:n(d.calls)});
      }
    });

    var last3=entered.slice(-3);
    var recentAvg=last3.length?last3.reduce(function(s,x){return s+x.revenue;},0)/last3.length:0;

    var start=c.idx+1;
    if(c.selectedData&&c.selectedData.state&&c.selectedData.state.key==='current'&&!c.selectedData.has)start=c.idx;
    var remaining=Math.max(0,c.wks.slice(Math.max(0,start)).length);
    var gap=Math.max(0,n(c.goal)-n(c.qtd.revenue));
    var needed=remaining>0?gap/remaining:gap;
    var projected=n(c.qtd.revenue)+(recentAvg*remaining);
    var liftPct=recentAvg>0?((needed/recentAvg)-1)*100:null;
    var confidence=entered.length>=6?'Higher':(entered.length>=3?'Developing':'Early');
    var confidenceTone=entered.length>=6?'good':(entered.length>=3?'warn':'risk');

    var stateTitle='',stateCopy='',stateTone='warn';
    if(!c.goal){
      stateTitle='Use this page as a run-rate model';
      stateCopy='A quarter goal is not available, so focus on comparing likely weekly performance scenarios rather than measuring a goal gap.';
    }else if(!entered.length){
      stateTitle='You are planning before a trend is established';
      stateCopy='There are no entered performance weeks in this selected context yet. Start with Goal Path to see the weekly requirement, then adjust it to something operationally realistic.';
      stateTone='risk';
    }else if(projected>=c.goal){
      stateTitle='Your recent momentum currently supports the goal';
      stateCopy='The expected run rate projects at or above goal. Use the weak-week stress test to find out how much cushion you really have before treating the projection as safe.';
      stateTone='good';
    }else if(liftPct!=null&&liftPct<=15){
      stateTitle='The gap appears recoverable with a modest lift';
      stateCopy='The required weekly pace is close to your recent run rate. Use Goal Path as the baseline, then stress-test whether a small weekly lift is sustainable.';
      stateTone='good';
    }else if(liftPct!=null&&liftPct<=50){
      stateTitle='The goal requires a meaningful change in pace';
      stateCopy='Current momentum alone does not close the gap. Use the simulator to combine a higher weekly run rate with realistic one-time opportunities.';
      stateTone='warn';
    }else{
      stateTitle='The goal requires a major step change';
      stateCopy='The required weekly pace is materially above recent momentum. The simulator is most useful here for identifying what combination of weekly improvement and larger opportunities would actually change the outcome.';
      stateTone='risk';
    }

    var recommendation='';
    if(!c.goal)recommendation='Start with the Expected scenario and use the page to establish a realistic forward run rate.';
    else if(!entered.length)recommendation='Load Goal Path first. That gives you the mathematical requirement before you begin testing more realistic combinations.';
    else if(projected>=c.goal)recommendation='Load Expected, then turn on one weak week. Your job is to learn how much downside the plan can absorb.';
    else if(liftPct!=null&&liftPct<=15)recommendation='Load Goal Path and compare it with Expected. The difference between those two weekly rates is your practical coaching gap.';
    else recommendation='Load Goal Path, then add only opportunities you genuinely expect to close. Avoid making the model look healthy with wishful pipeline.';

    return {
      c:c,entered:entered,last3:last3,recentAvg:recentAvg,remaining:remaining,gap:gap,
      needed:needed,projected:projected,liftPct:liftPct,confidence:confidence,
      confidenceTone:confidenceTone,stateTitle:stateTitle,stateCopy:stateCopy,
      stateTone:stateTone,recommendation:recommendation
    };
  }

  function sectionHead(kick,title,note){
    return '<div class="rp2-fc-section-head"><div><div class="rp2-fc-section-kick">'+kick+'</div><div class="rp2-fc-section-title">'+title+'</div></div><div class="rp2-fc-section-note">'+note+'</div></div>';
  }

  function readSection(){
    var g=guideContext();
    if(!g)return '';
    var liftText=g.liftPct==null?'Not enough history':(g.liftPct<=0?'Current run rate already covers the needed pace':Math.round(g.liftPct)+'% above recent run rate');
    var liftTone=g.liftPct!=null&&g.liftPct<=15?'good':(g.liftPct!=null&&g.liftPct<=50?'warn':'risk');

    return sectionHead(
      'Forecast field guide',
      'What this forecast means for you',
      'This interpretation uses the selected reporting point—not the end of the quarter—to explain what the numbers are actually saying.'
    )
    +'<div class="rp2-fg-read" id="rp2-fg-read">'
      +'<div class="rp2-fg-read-main">'
        +'<div class="rp2-fg-eyebrow">Your forecast read</div>'
        +'<div class="rp2-fg-read-title">'+esc(g.stateTitle)+'</div>'
        +'<div class="rp2-fg-read-copy">'+esc(g.stateCopy)+'<br><br><strong style="color:#dfe7f3;">Recommended starting point:</strong> '+esc(g.recommendation)+'</div>'
      +'</div>'
      +'<div class="rp2-fg-read-card '+g.stateTone+'"><span>Required pace</span><strong>'+(g.c.goal?m(g.needed)+'/week':'—')+'</strong><small>'+esc(liftText)+'</small></div>'
      +'<div class="rp2-fg-read-card"><span>Recent momentum</span><strong>'+(g.recentAvg?m(g.recentAvg)+'/week':'Not established')+'</strong><small>Based on the last '+Math.min(3,g.entered.length)+' entered week'+(Math.min(3,g.entered.length)===1?'':'s')+'.</small></div>'
      +'<div class="rp2-fg-read-card '+g.confidenceTone+'"><span>Forecast confidence</span><strong>'+esc(g.confidence)+'</strong><small>Built from '+g.entered.length+' entered performance week'+(g.entered.length===1?'':'s')+'. More history generally produces a more useful trend signal.</small></div>'
    +'</div>';
  }

  function workflowSection(){
    var steps=[
      ['1','Set the reporting point','Choose the Year, Quarter, Month, and Week you want to analyze. Historical selections show what the forecast looked like at that moment.'],
      ['2','Read the gap','Start with projected finish, gap to goal, required weekly pace, and recent run rate. These tell you whether the current path is enough.'],
      ['3','Choose a baseline','Use Conservative for downside, Expected for current momentum, or Goal Path for the exact weekly pace needed to hit goal.'],
      ['4','Stress-test reality','Add a likely large opportunity or model one weak week. This shows how fragile—or resilient—the plan actually is.'],
      ['5','Turn it into a target','Leave the page with a realistic weekly number to manage against. Update the model as actual weeks replace assumptions.']
    ];
    return sectionHead(
      'How to use the page',
      'A five-step forecasting workflow',
      'Forecast is a decision tool, not a promise. Use it to understand what must change before the quarter is over.'
    )
    +'<div class="rp2-fg-workflow">'
    +steps.map(function(s){
      return '<div class="rp2-fg-step"><div class="rp2-fg-step-no">'+s[0]+'</div><div class="rp2-fg-step-title">'+s[1]+'</div><div class="rp2-fg-step-copy">'+s[2]+'</div></div>';
    }).join('')
    +'</div>';
  }

  function glossarySection(){
    var terms=[
      ['QTD through selected week','Sales already posted through the week you selected. <b>This is the starting point</b> for every projection on the page.'],
      ['Expected projection','Where you would finish if your recent entered-week momentum continues across the remaining forecast weeks.'],
      ['Gap to goal','The dollars still needed after actual QTD performance. It answers: <b>How much work is still left?</b>'],
      ['Required weekly pace','The remaining gap divided across the remaining forecast weeks. It answers: <b>What average do I need from here?</b>'],
      ['Recent run rate','Your average over the most recent entered weeks. Compare this with required pace to judge whether the goal needs a small lift or a major change.'],
      ['One-time opportunity','A large order or incremental win added once to the model. Use only opportunities that are genuinely plausible—not hopeful filler.'],
      ['Weak week','Replaces one future week with a lower result. Use it to test whether your plan has enough cushion to survive vacation, a slow week, or a miss.'],
      ['Goal Path','The mathematical weekly average required to land exactly on goal from the selected reporting point. It is a target line—not automatically a realistic plan.'],
      ['Scenario finish','The projected quarter result after your weekly pace, one-time opportunity, and weak-week assumptions are combined.']
    ];
    return sectionHead(
      'Plain-English definitions',
      'What the numbers and controls mean',
      'Use these definitions when a metric looks impressive—or alarming—so you know exactly what is driving it.'
    )
    +'<div class="rp2-fg-glossary">'
    +terms.map(function(t){
      return '<div class="rp2-fg-term"><strong>'+t[0]+'</strong><p>'+t[1]+'</p></div>';
    }).join('')
    +'</div>';
  }

  function useCasesSection(){
    return sectionHead(
      'Tool playbook',
      'Four ways to use the Scenario Simulator',
      'Start with the question you are trying to answer, then use the matching control instead of changing numbers randomly.'
    )
    +'<div class="rp2-fg-use-grid" id="rp2-fg-use-cases">'
      +'<div class="rp2-fg-use"><div class="rp2-fg-use-icon">🎯</div><div class="rp2-fg-use-label">Goal planning</div><div class="rp2-fg-use-title">What do I actually need to average?</div><div class="rp2-fg-use-copy">Load Goal Path to set the simulator to the exact weekly pace required from the selected point. Then decide whether that pace is operationally realistic.</div><div class="rp2-fg-use-when"><b>Use this when:</b><br>You need a clear weekly target for the rest of the quarter.</div><button class="rp2-fg-btn" onclick="_rp2ForecastGuideAction(\'goal\')">Load Goal Path →</button></div>'
      +'<div class="rp2-fg-use"><div class="rp2-fg-use-icon">📈</div><div class="rp2-fg-use-label">Momentum check</div><div class="rp2-fg-use-title">Can my current pace get me there?</div><div class="rp2-fg-use-copy">Load Expected to project your recent momentum forward. Compare the result with Goal Path to see the size of the performance change required.</div><div class="rp2-fg-use-when"><b>Use this when:</b><br>You want to know whether “keep doing what I’m doing” is enough.</div><button class="rp2-fg-btn" onclick="_rp2ForecastGuideAction(\'expected\')">Load Expected →</button></div>'
      +'<div class="rp2-fg-use"><div class="rp2-fg-use-icon">💼</div><div class="rp2-fg-use-label">Opportunity planning</div><div class="rp2-fg-use-title">What changes if a big order lands?</div><div class="rp2-fg-use-copy">Add the expected value of one meaningful opportunity. Watch how it changes projected finish and the pressure on the remaining weekly run rate.</div><div class="rp2-fg-use-when"><b>Use this when:</b><br>You have a real large order or account opportunity that may close this quarter.</div><button class="rp2-fg-btn" onclick="_rp2ForecastGuideAction(\'bonus\')">Use Opportunity Field →</button></div>'
      +'<div class="rp2-fg-use"><div class="rp2-fg-use-icon">🛡️</div><div class="rp2-fg-use-label">Risk planning</div><div class="rp2-fg-use-title">What if one week goes badly?</div><div class="rp2-fg-use-copy">Turn on one weak week and enter a realistic downside result. This reveals whether the plan has cushion or depends on every remaining week going perfectly.</div><div class="rp2-fg-use-when"><b>Use this when:</b><br>You want a plan that can survive real life instead of a perfect-case spreadsheet.</div><button class="rp2-fg-btn" onclick="_rp2ForecastGuideAction(\'weak\')">Stress-Test a Week →</button></div>'
    +'</div>';
  }

  function bestPracticeSection(){
    var g=guideContext();
    var recommendation=g?g.recommendation:'Start with the Expected scenario, then compare it with Goal Path.';
    return sectionHead(
      'Using the result',
      'Turn the forecast into a weekly operating plan',
      'The value of a forecast is not the number on the screen. The value is the decision you make because of it.'
    )
    +'<div class="rp2-fg-best-practice">'
      +'<div class="rp2-fg-practice-card"><div class="rp2-fg-practice-title">Forecast rules of thumb</div><div class="rp2-fg-rules">'
        +'<div class="rp2-fg-rule"><i>01</i><span><strong style="color:#d9e2ef;">Update after each completed week.</strong> Actual performance should replace assumptions as quickly as possible.</span></div>'
        +'<div class="rp2-fg-rule"><i>02</i><span><strong style="color:#d9e2ef;">Do not confuse pipeline with revenue.</strong> Put a large opportunity into the model only when it is realistic enough to plan around.</span></div>'
        +'<div class="rp2-fg-rule"><i>03</i><span><strong style="color:#d9e2ef;">Compare Expected with Goal Path.</strong> The difference between those two weekly rates is the real performance gap you need to manage.</span></div>'
        +'<div class="rp2-fg-rule"><i>04</i><span><strong style="color:#d9e2ef;">Stress-test the plan.</strong> A forecast that only works when every week is perfect is not a resilient forecast.</span></div>'
        +'<div class="rp2-fg-rule"><i>05</i><span><strong style="color:#d9e2ef;">Leave with one operating number.</strong> Decide what weekly sales target you are actually going to manage against.</span></div>'
      +'</div></div>'
      +'<div class="rp2-fg-callout"><div class="rp2-fg-callout-label">Recommended next move</div><div class="rp2-fg-callout-title">Use the model to make one decision</div><div class="rp2-fg-callout-copy">'+esc(recommendation)+'<br><br>After adjusting the simulator, write down the weekly number you believe is both necessary and achievable. That is the number the rest of your sales activity should support.</div></div>'
    +'</div>';
  }

  window._rp2ForecastGuideAction=function(kind){
    try{
      var target=document.getElementById('rp2-fc-rate-input');
      if(kind==='goal'||kind==='expected'||kind==='conservative'){
        if(typeof window._rp2ForecastPreset==='function')window._rp2ForecastPreset(kind);
      }else if(kind==='bonus'){
        target=document.getElementById('rp2-fc-bonus');
      }else if(kind==='weak'){
        var weak=document.getElementById('rp2-fc-weak-toggle');
        if(weak)weak.checked=true;
        if(typeof window._rp2ForecastUpdate==='function')window._rp2ForecastUpdate();
        target=document.getElementById('rp2-fc-weak-value')||weak;
      }
      if(target){
        target.scrollIntoView({behavior:'smooth',block:'center'});
        setTimeout(function(){try{target.focus();}catch(e){}},450);
      }
    }catch(e){}
  };

  var originalForecastV2=window._rp2ForecastV2;
  if(typeof originalForecastV2==='function'){
    window._rp2ForecastV2=function(){
      var html=originalForecastV2();

      var interactiveMarker='<div class="rp2-fc-section-head"><div><div class="rp2-fc-section-kick">Interactive model</div>';
      var executionMarker='<div class="rp2-fc-section-head"><div><div class="rp2-fc-section-kick">Execution map</div>';
      var planningMarker='<div class="rp2-fc-section-head"><div><div class="rp2-fc-section-kick">Planning lanes</div>';

      if(html.indexOf(interactiveMarker)>=0){
        html=html.replace(interactiveMarker,readSection()+workflowSection()+glossarySection()+interactiveMarker);
      }
      if(html.indexOf(executionMarker)>=0){
        html=html.replace(executionMarker,useCasesSection()+executionMarker);
      }
      if(html.indexOf(planningMarker)>=0){
        html=html.replace(planningMarker,bestPracticeSection()+planningMarker);
      }
      return html;
    };
  }

  try{
    var sess=(typeof _rpSession==='function')?_rpSession():null;
    if(sess&&sess.role==='rep'&&_rp2.page==='forecast'){
      setTimeout(function(){try{_rp2Go('forecast');}catch(e){}},0);
    }
  }catch(e){}
})();
