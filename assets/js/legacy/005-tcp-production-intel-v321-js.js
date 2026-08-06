
/* ===== v321 Production Intelligence Resource Center ===== */
(function(){
  var PI_STORE='salesTracker_productionIntelHistory_v1';
  var activeDeco='';
  var charts={};

  function piEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function piAttr(s){return piEsc(s).replace(/"/g,'&quot;');}
  function rows(){
    try{
      if(typeof getProductionRows==='function'){
        var r=getProductionRows();
        if(r&&r.length)return r;
      }
    }catch(e){}
    try{
      if(typeof DEFAULT_PRODUCTION_ROWS!=='undefined')return DEFAULT_PRODUCTION_ROWS.slice();
    }catch(e2){}
    return [];
  }
  function parseDate(v){
    if(typeof parseProductionDate==='function')return parseProductionDate(v);
    var d=new Date(v);return isNaN(d.getTime())?null:d;
  }
  function shortDate(d){
    if(!d)return '--';
    if(typeof fmtShortDate==='function')return fmtShortDate(d);
    try{return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}catch(e){return String(d);}
  }
  function daysOut(ship){
    if(typeof leadDaysFromToday==='function')return leadDaysFromToday(ship);
    var d=parseDate(ship); if(!d)return null;
    var t=new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0);
    return Math.round((d-t)/86400000);
  }
  function statusClass(days){
    if(typeof productionStatusClass==='function')return productionStatusClass(days);
    if(days===null)return 'amber';
    if(days<=10)return 'green';
    if(days<=16)return 'amber';
    return 'red';
  }
  function statusLabel(days){
    if(typeof productionStatusLabel==='function')return productionStatusLabel(days);
    if(days===null)return 'Needs review';
    if(days<0)return 'Past due';
    if(days<=10)return 'Normal';
    if(days<=16)return 'Extended';
    return 'High risk';
  }
  function loadHistory(){try{return JSON.parse(localStorage.getItem(PI_STORE)||'{}')||{};}catch(e){return {};}}
  function saveHistory(h){try{localStorage.setItem(PI_STORE,JSON.stringify(h));}catch(e){}}
  function snapshotRows(rs){
    var h=loadHistory();
    var now=new Date();
    var stamp=now.toISOString().slice(0,10);
    rs.forEach(function(r){
      var deco=r.decoration||'Unknown';
      var d=daysOut(r.shipWeek);
      if(typeof d!=='number'||isNaN(d))return;
      if(!h[deco])h[deco]=[];
      var existing=h[deco].filter(function(x){return x.date!==stamp;});
      existing.push({date:stamp,days:d,shipWeek:r.shipWeek||'',updated:r.updated||''});
      if(existing.length>60)existing=existing.slice(existing.length-60);
      h[deco]=existing;
    });
    saveHistory(h);
  }
  function trendFor(deco,current){
    var h=loadHistory()[deco]||[];
    if(!h.length && current){
      var d=daysOut(current.shipWeek);
      if(typeof d==='number')h=[{date:new Date().toISOString().slice(0,10),days:d,shipWeek:current.shipWeek||'',updated:current.updated||''}];
    }
    return h;
  }
  function trendWord(arr){
    if(!arr||arr.length<2)return 'Tracking';
    var a=arr[arr.length-2].days,b=arr[arr.length-1].days;
    if(b>a)return 'Extending';
    if(b<a)return 'Improving';
    return 'Stable';
  }
  function avgLead(rs){
    var vals=rs.map(function(r){return daysOut(r.shipWeek);}).filter(function(v){return typeof v==='number'&&!isNaN(v);});
    if(!vals.length)return null;
    return Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length);
  }
  function longestRow(rs){
    var best=null;
    rs.forEach(function(r){var d=daysOut(r.shipWeek);if(typeof d==='number'&&!isNaN(d)&&(best===null||d>best.days))best={row:r,days:d};});
    return best;
  }
  function quickRows(rs){return rs.filter(function(r){var d=daysOut(r.shipWeek);return typeof d==='number'&&d<=10;});}
  function resourceText(deco,days,label){
    var risk=days===null?'Use current production sheet before promising a delivery date.':days>16?'High-risk timeline. Quote with cushion and confirm before promising firm in-hands dates.':days>10?'Extended timeline. Good to mention current production week and build in shipping time.':'Normal timeline. Good candidate for standard quoting, but still confirm art and garment availability.';
    var art='Confirm art approval, garment arrival, decoration method, and shipping transit before committing to the customer.';
    var script='Customer wording: "Current '+deco+' production is showing around '+(days===null?'the posted ship week':days+' days out')+'. I want to confirm art and garment timing before I promise the final in-hands date."';
    return {risk:risk,art:art,script:script,label:label};
  }
  function renderCards(rs){
    return '<div class="prodintel-method-grid">'+rs.map(function(r){
      var d=daysOut(r.shipWeek), cls=statusClass(d), label=statusLabel(d), ship=shortDate(parseDate(r.shipWeek)) || r.shipWeek || '--';
      var hist=trendFor(r.decoration,r), tr=trendWord(hist);
      var active=(activeDeco && activeDeco===r.decoration);
      return '<button type="button" class="prodintel-method-card '+(active?'active':'')+'" onclick="toggleProdIntelDeco(\''+piAttr(r.decoration).replace(/\\/g,'\\\\')+'\')">'+
        '<span class="prodintel-arrow">'+(active?'▼':'▶')+'</span>'+ 
        '<div class="prodintel-method-name">'+piEsc(r.decoration||'Decoration')+'</div>'+ 
        '<div class="prodintel-method-date">'+piEsc(ship)+'</div>'+ 
        '<div class="prodintel-method-meta">'+(d===null?'Days out unavailable':piEsc(d+' days out'))+' • '+piEsc(tr)+'</div>'+ 
        '<span class="prodintel-status-pill '+cls+'">'+piEsc(label)+'</span>'+ 
      '</button>';
    }).join('')+'</div>';
  }
  function renderDetail(rs){
    if(!activeDeco)return '<div class="prodintel-expanded" id="prodIntelCollapsedHint"></div>';
    var r=rs.find(function(x){return x.decoration===activeDeco;});
    if(!r)return '<div class="prodintel-empty">No decoration method selected.</div>';
    var d=daysOut(r.shipWeek), cls=statusClass(d), label=statusLabel(d), ship=shortDate(parseDate(r.shipWeek)) || r.shipWeek || '--';
    var hist=trendFor(r.decoration,r);
    var delta='No prior snapshot yet';
    if(hist.length>=2){var change=hist[hist.length-1].days-hist[hist.length-2].days;delta=(change>0?'+':'')+change+' days vs prior snapshot';}
    var res=resourceText(r.decoration||'this decoration',d,label);
    return '<div class="prodintel-expanded active">'+
      '<div class="prodintel-detail-head"><div><h2>'+piEsc(r.decoration||'Decoration')+'</h2><div class="prodintel-sub">Production history, quoting guidance, and risk notes for the selected decoration method.</div></div><span class="prodintel-detail-chip">'+piEsc(label)+' • '+(d===null?'--':piEsc(d+' days'))+'</span></div>'+ 
      '<div class="prodintel-kpi-row">'+
        '<div class="prodintel-kpi"><div class="lbl">Current ship week</div><div class="val">'+piEsc(ship)+'</div><div class="sub">From production feed</div></div>'+ 
        '<div class="prodintel-kpi"><div class="lbl">Days out</div><div class="val">'+(d===null?'--':piEsc(d))+'</div><div class="sub">Based on today</div></div>'+ 
        '<div class="prodintel-kpi"><div class="lbl">Trend</div><div class="val">'+piEsc(trendWord(hist))+'</div><div class="sub">'+piEsc(delta)+'</div></div>'+ 
        '<div class="prodintel-kpi"><div class="lbl">Last updated</div><div class="val" style="font-size:15px;">'+piEsc(r.updated||'--')+'</div><div class="sub">Sheet timestamp</div></div>'+ 
      '</div>'+ 
      '<div class="prodintel-detail-grid">'+
        '<div class="prodintel-chart-box"><canvas id="prodIntelTrendChart"></canvas></div>'+ 
        '<div class="prodintel-resource-list">'+
          '<div class="prodintel-resource"><b>Timeline guidance</b><span>'+piEsc(res.risk)+'</span></div>'+ 
          '<div class="prodintel-resource"><b>Before quoting</b><span>'+piEsc(res.art)+'</span></div>'+ 
          '<div class="prodintel-resource"><b>Customer talk track</b><span>'+piEsc(res.script)+'</span></div>'+ 
          '<div class="prodintel-resource"><b>How trend history works</b><span>The tracker saves snapshots as the production sheet updates. The trend chart becomes stronger over time.</span></div>'+ 
        '</div>'+ 
      '</div>'+ 
      '<div class="prodintel-quote-helper"><div class="prodintel-kicker">Quote timeline helper</div><div class="prodintel-title" style="font-size:15px;margin-bottom:8px;">Plan customer in-hands dates</div><div class="prodintel-quote-grid"><div class="ig"><label>Customer event / in-hands date</label><input type="date" id="prodQuoteDate" onchange="updateProdQuoteHelper(\''+piAttr(r.decoration).replace(/\\/g,'\\\\')+'\')"></div><div id="prodQuoteResult" class="prodintel-quote-result">Choose an in-hands date to calculate suggested order, art, and approval targets for '+piEsc(r.decoration||'this method')+'.</div></div></div>'+ 
    '</div>';
  }
  function renderOverview(rs){
    var avg=avgLead(rs), long=longestRow(rs), quick=quickRows(rs);
    var red=rs.filter(function(r){return statusClass(daysOut(r.shipWeek))==='red';}).length;
    return '<div class="prodintel-grid">'+
      '<section class="prodintel-panel prodintel-full"><div class="prodintel-kicker">Current production dates</div><div class="prodintel-title">Decoration Timeline Board</div><div class="prodintel-sub">Each decoration method is shown as a compact top card. Click a method to slide open the trend chart, timeline guidance, and quote helper below.</div>'+renderCards(rs)+'<div id="prodIntelExpandedSlot">'+renderDetail(rs)+'</div></section>'+ 
      '<section class="prodintel-panel prodintel-third"><div class="prodintel-kicker">Production health</div><div class="prodintel-title">Timeline Snapshot</div><div class="prodintel-kpi-row"><div class="prodintel-kpi"><div class="lbl">Methods tracked</div><div class="val">'+rs.length+'</div><div class="sub">From feed</div></div><div class="prodintel-kpi"><div class="lbl">Average lead</div><div class="val">'+(avg===null?'--':avg+'d')+'</div><div class="sub">Across methods</div></div></div><div class="prodintel-resource-list"><div class="prodintel-resource"><b>Longest timeline</b><span>'+(long?piEsc(long.row.decoration+' • '+long.days+' days out'):'No production data loaded')+'</span></div><div class="prodintel-resource"><b>Quick-turn options</b><span>'+(quick.length?piEsc(quick.map(function(x){return x.decoration;}).slice(0,4).join(', ')):'No methods currently inside 10 days')+'</span></div><div class="prodintel-resource"><b>High-risk methods</b><span>'+red+' method(s) currently beyond the normal risk threshold.</span></div></div></section>'+ 
      '<section class="prodintel-panel prodintel-third"><div class="prodintel-kicker">Resource center</div><div class="prodintel-title">Production Checklist</div><div class="prodintel-resource-list"><div class="prodintel-resource"><b>1. Confirm garment arrival</b><span>Production time only matters after goods and approved art are ready.</span></div><div class="prodintel-resource"><b>2. Confirm art status</b><span>New art, repeat art, and mockups can change the realistic delivery plan.</span></div><div class="prodintel-resource"><b>3. Use the Calculator</b><span>Open the Calculator page for full in-hands date planning with transit and art status.</span><button type="button" class="sbtn" style="margin-top:8px;padding:6px 9px;font-size:11px;" onclick="gt(&quot;calc&quot;,this)">Open Calculator</button></div><div class="prodintel-resource"><b>4. Communicate clearly</b><span>Quote ship week, not guaranteed arrival, unless all variables are confirmed.</span></div></div></section>'+ 
      '<section class="prodintel-panel prodintel-third"><div class="prodintel-kicker">Manager readout</div><div class="prodintel-title">What This Means</div><div id="prodIntelReadout" class="aib">'+buildReadout(rs)+'</div></section>'+ 
      '<section class="prodintel-panel prodintel-full"><div class="prodintel-kicker">Live table</div><div class="prodintel-title">Production Feed Details</div><table class="prodintel-table"><thead><tr><th>Decoration</th><th>Ship week</th><th>Days out</th><th>Status</th><th>Updated</th></tr></thead><tbody>'+rs.map(function(r){var d=daysOut(r.shipWeek), cls=statusClass(d);return '<tr><td><strong>'+piEsc(r.decoration)+'</strong></td><td>'+piEsc(shortDate(parseDate(r.shipWeek))||r.shipWeek||'--')+'</td><td>'+(d===null?'--':piEsc(d+' days'))+'</td><td><span class="prodintel-risk-'+cls+'">'+piEsc(statusLabel(d))+'</span></td><td>'+piEsc(r.updated||'--')+'</td></tr>';}).join('')+'</tbody></table></section>'+ 
    '</div>';
  }
  function buildReadout(rs){
    if(!rs.length)return 'No production feed is loaded yet. Add the published CSV URL in Admin, refresh the feed, and this page will become the live production timeline resource.';
    var long=longestRow(rs), quick=quickRows(rs), avg=avgLead(rs);
    var risk=rs.filter(function(r){return statusClass(daysOut(r.shipWeek))==='red';});
    var out=[];
    out.push('Current average production lead time is '+(avg===null?'not available':avg+' days')+'.');
    if(long)out.push('The longest current method is '+long.row.decoration+' at about '+long.days+' days out.');
    if(quick.length)out.push('Quick-turn options currently include '+quick.map(function(r){return r.decoration;}).slice(0,3).join(', ')+'.');
    if(risk.length)out.push('Use extra caution quoting '+risk.map(function(r){return r.decoration;}).slice(0,3).join(', ')+' because those methods are showing extended timelines.');
    out.push('Trend charts depend on saved snapshots, so they become more valuable as the production sheet updates week over week.');
    return piEsc(out.join(' '));
  }
  function renderCharts(rs){
    if(typeof Chart==='undefined')return;
    Object.keys(charts).forEach(function(k){try{charts[k].destroy();}catch(e){}});
    charts={};
    if(!activeDeco)return;
    var selected=rs.find(function(x){return x.decoration===activeDeco;});
    if(!selected)return;
    var hist=trendFor(selected.decoration,selected);
    var trendEl=document.getElementById('prodIntelTrendChart');
    if(trendEl){
      charts.trend=new Chart(trendEl,{type:'line',data:{labels:hist.map(function(x){return x.date;}),datasets:[{label:selected.decoration+' days out',data:hist.map(function(x){return x.days;}),tension:.35,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#F1F1F1'}},tooltip:{mode:'index',intersect:false}},scales:{x:{ticks:{color:'#A8AFC3'},grid:{color:'rgba(255,255,255,.06)'}},y:{ticks:{color:'#A8AFC3'},grid:{color:'rgba(255,255,255,.06)'}}}}});
    }
  }
  window.updateProdQuoteHelper=function(deco){
    var dateEl=document.getElementById('prodQuoteDate'), out=document.getElementById('prodQuoteResult');
    if(!dateEl||!out)return;
    var val=dateEl.value;
    if(!val){out.textContent='Choose an in-hands date to calculate suggested order, art, and approval targets.';return;}
    var rs=rows(); var r=rs.find(function(x){return x.decoration===deco;})||{};
    var lead=daysOut(r.shipWeek); if(typeof lead!=='number'||isNaN(lead))lead=10;
    function subBiz(d,n){var x=new Date(d+'T00:00:00');var c=0;while(c<n){x.setDate(x.getDate()-1);var w=x.getDay();if(w>=1&&w<=5)c++;}return x;}
    function fmt(x){return x.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
    var shipBy=subBiz(val,3), orderDue=subBiz(val,lead+3), approvalDue=subBiz(val,lead+4), artDue=subBiz(val,lead+6);
    out.innerHTML='<strong>Suggested timeline for '+piEsc(deco||'this method')+'</strong><br>Order due: '+fmt(orderDue)+'<br>Art due: '+fmt(artDue)+'<br>Approval target: '+fmt(approvalDue)+'<br>Ship-by cushion: '+fmt(shipBy)+'<br><span style="color:#FFD27A;">Confirm garments, art approval, and shipping before promising the customer.</span>';
  };
  window.renderProdIntelPage=function(){
    var dest=document.getElementById('prodintel-content');
    if(!dest)return;
    try{
      var rs=rows();
      if(!rs.length){
        dest.innerHTML='<div class="prodintel-empty"><strong>No production data loaded yet.</strong><br>Use the Production Status Center in Admin to paste or refresh the published Google Sheet CSV feed. Once loaded, this page will show decoration methods, ship dates, trend charts, and quoting guidance.</div>';
        return;
      }
      snapshotRows(rs);
      if(activeDeco && !rs.some(function(r){return r.decoration===activeDeco;}))activeDeco='';
      dest.innerHTML=renderOverview(rs);
      setTimeout(function(){renderCharts(rs);},30);
    }catch(err){
      console.error('[Production Intelligence render]',err);
      dest.innerHTML='<div class="prodintel-empty"><strong>Production Intelligence could not render.</strong><br>'+piEsc(err && err.message ? err.message : err)+'</div>';
    }
  };
  window.toggleProdIntelDeco=function(deco){
    activeDeco=(activeDeco===deco)?'':deco;
    window.renderProdIntelPage();
  };
  function hook(){
    try{window.renderProdIntelPage();}catch(e){console.warn('[prod intel]',e);}
  }
  var oldGt=window.gt;
  if(typeof oldGt==='function'&&!oldGt.__prodIntelHooked){
    var wrapped=function(page,btn){
      var res=oldGt.apply(this,arguments);
      if(page==='prodintel')setTimeout(hook,0);
      return res;
    };
    wrapped.__prodIntelHooked=true;
    window.gt=wrapped;
  }
  var oldRenderProductionHub=window.renderProductionHub;
  if(typeof oldRenderProductionHub==='function'&&!oldRenderProductionHub.__prodIntelHooked){
    var wrappedR=function(){
      var res=oldRenderProductionHub.apply(this,arguments);
      setTimeout(hook,0);
      return res;
    };
    wrappedR.__prodIntelHooked=true;
    window.renderProductionHub=wrappedR;
  }
  window.addEventListener('load',function(){setTimeout(hook,250);});
})();

/* ===== v429 Art Errors Google CSV Sync ===== */
(function(){
  var AE_SYNC_VERSION='v429';
  function aeEnsureStore(){
    if(!S.artErrorSource)S.artErrorSource={url:'',lastSync:null,lastCount:0,lastImported:0,lastUpdated:0,lastSkipped:0,lastUnmatched:0,lastError:''};
    if(!Array.isArray(S.artErrorIgnored))S.artErrorIgnored=[];
    if(!Array.isArray(S.artErrors))S.artErrors=[];
    return S.artErrorSource;
  }
  function aeEsc(v){return (v==null?'':String(v)).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function aeNorm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function aeCompact(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
  function aeClean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'');}
  function aeFetchCSV(url){
    var AE_PROXIES=[function(u){return u;},function(u){return 'https://corsproxy.io/?url='+encodeURIComponent(u);},function(u){return 'https://api.allorigins.win/raw?url='+encodeURIComponent(u);}];
    var bust=url+(url.indexOf('?')>=0?'&':'?')+'_ts='+Date.now();
    return (async function(){
      var lastErr=null;
      for(var i=0;i<AE_PROXIES.length;i++){
        try{
          var res=await fetch(AE_PROXIES[i](bust),{cache:'no-store'});
          if(!res.ok)throw new Error('HTTP '+res.status);
          var text=await res.text();
          if(!text||!text.trim())throw new Error('empty response');
          var t=text.replace(/^\uFEFF/,'').trim();
          if(t.charAt(0)==='<')throw new Error('got a login/error page, not CSV \u2014 check the sheet is Published to web as CSV and shared to anyone');
          return text;
        }catch(e){lastErr=e;}
      }
      throw lastErr||new Error('All fetch routes failed');
    })();
  }
  function aeParseCSV(text){
    var rows=[],row=[],field='',i=0,q=false;
    text=String(text||'').replace(/^\ufeff/,'');
    while(i<text.length){
      var c=text[i];
      if(q){
        if(c==='"'){
          if(text[i+1]==='"'){field+='"';i++;}
          else q=false;
        }else field+=c;
      }else{
        if(c==='"')q=true;
        else if(c===','){row.push(field);field='';}
        else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';}
        else if(c==='\r'){}
        else field+=c;
      }
      i++;
    }
    row.push(field);rows.push(row);
    return rows.filter(function(r){return r.some(function(c){return aeClean(c)!=='';});});
  }
  function aeFindHeader(rows){
    var best=0,bscore=-1;
    rows.slice(0,12).forEach(function(r,idx){
      var h=r.map(aeNorm).join(' | '),score=0;
      ['date','sales order','order number','so number','sales rep','rep','explain issue','issue type','issue'].forEach(function(k){if(h.indexOf(k)>=0)score++;});
      if(score>bscore){bscore=score;best=idx;}
    });
    return best;
  }
  function aeIndex(headers,groups){
    var norm=headers.map(aeNorm),compact=headers.map(aeCompact);
    for(var g=0;g<groups.length;g++){
      for(var i=0;i<headers.length;i++){
        if(norm[i]===groups[g]||compact[i]===aeCompact(groups[g]))return i;
      }
    }
    for(var g2=0;g2<groups.length;g2++){
      for(var j=0;j<headers.length;j++){
        if(norm[j].indexOf(groups[g2])>=0||compact[j].indexOf(aeCompact(groups[g2]))>=0)return j;
      }
    }
    return -1;
  }
  function aeParseDate(v){
    if(v instanceof Date&&!isNaN(v))return v;
    var s=aeClean(v); if(!s)return null;
    if(/^\d+(\.\d+)?$/.test(s)){
      var n=parseFloat(s);
      if(n>20000&&n<80000){var d0=new Date(Math.round((n-25569)*86400*1000));d0.setHours(12,0,0,0);return d0;}
    }
    var d=new Date(s);
    if(!isNaN(d)){d.setHours(12,0,0,0);return d;}
    var m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if(m){var yy=parseInt(m[3],10);if(yy<100)yy+=2000;var dd=new Date(yy,parseInt(m[1],10)-1,parseInt(m[2],10),12,0,0,0);if(!isNaN(dd))return dd;}
    return null;
  }
  function aeISO(d){return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):'';}
  function aeWeekForDate(d){
    if(!d)return null;
    var yr=d.getFullYear();
    for(var yi=yr-1;yi<=yr+1;yi++){
      for(var qi=0;qi<QTRS.length;qi++){
        var q=QTRS[qi],weeks=gwq(yi,q)||[];
        for(var wi=0;wi<weeks.length;wi++){
          var s=new Date(weeks[wi].start),e=new Date(weeks[wi].end);s.setHours(0,0,0,0);e.setHours(23,59,59,999);
          if(d>=s&&d<=e)return weeks[wi];
        }
      }
    }
    var qFallback='Q'+(Math.floor(d.getMonth()/3)+1);
    return {key:yr+'_'+qFallback+'_'+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+'_0',yr:yr,q:qFallback,month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()],label:'Unmapped week'};
  }
  function aeMatchRep(raw){
    var src=aeClean(raw),c=aeCompact(src),active=(typeof activeReps==='function'?activeReps():S.reps)||[],all=(S.reps||[]);
    var exact=active.concat(all).find(function(r){return aeCompact(r&&r.name)===c;});
    if(exact)return {name:exact.name,matched:true,source:src};
    var srcParts=aeNorm(src).split(' ').filter(Boolean);
    if(srcParts.length>=2){
      var loose=active.concat(all).find(function(r){var np=aeNorm(r&&r.name).split(' ').filter(Boolean);return np[0]===srcParts[0]&&np[np.length-1]===srcParts[srcParts.length-1];});
      if(loose)return {name:loose.name,matched:true,source:src};
    }
    return {name:src||'Unmatched',matched:false,source:src};
  }
  function aeMapType(raw){
    var s=aeNorm(raw),c=aeCompact(raw);
    var map={
      colortype:'color_type',color:'color_type',colorway:'color_type',threadcolor:'color_type',
      incompleteart:'incomplete_art',incompleteartsheet:'incomplete_art',artincomplete:'incomplete_art',
      location:'location',placement:'location',logoapplicationlocation:'location',
      missinginfo:'missing_info',missinginformation:'missing_info',missing:'missing_info',
      orderentry:'order_entry',entry:'order_entry',salesorderentry:'order_entry',
      size:'size',sizing:'size'
    };
    if(map[c])return {type:map[c],label:AET[map[c]],source:aeClean(raw)};
    Object.keys(AET).forEach(function(k){if(aeCompact(AET[k])===c)map[c]=k;});
    if(map[c])return {type:map[c],label:AET[map[c]],source:aeClean(raw)};
    return {type:c?('custom_'+c.slice(0,36)):'missing_info',label:aeClean(raw)||'Missing information',source:aeClean(raw)};
  }
  function aeSourceKey(o){return ['artcsv',o.dateISO||'',aeCompact(o.so||''),aeCompact(o.sourceRep||o.rep||''),aeCompact(o.sourceType||o.issueTypeLabel||''),aeCompact((o.desc||'').slice(0,120))].join('|');}
  function aeIgnored(key){aeEnsureStore();return S.artErrorIgnored.indexOf(key)>=0;}
  function aeAddIgnored(key){aeEnsureStore();if(key&&S.artErrorIgnored.indexOf(key)<0)S.artErrorIgnored.push(key);}
  function aeStatus(msg,cls){var el=document.getElementById('aeCsvStatus');if(el){el.className='art-csv-status '+(cls||'');el.innerHTML=msg;}var b=document.getElementById('aeBulkMsg');if(b)b.innerHTML=msg.replace(/<[^>]+>/g,'');}
  function aeReadout(){
    aeEnsureStore();var s=S.artErrorSource||{},host=document.getElementById('aeCsvReadout');if(!host)return;
    var imported=(S.artErrors||[]).filter(function(a){return a&&a.source==='google_csv';}).length;
    host.innerHTML='<div class="art-sync-metric"><div>Synced rows</div><div>'+imported.toLocaleString()+'</div></div>'
      +'<div class="art-sync-metric"><div>Last import</div><div>'+(s.lastImported||0).toLocaleString()+'</div></div>'
      +'<div class="art-sync-metric"><div>Updated</div><div>'+(s.lastUpdated||0).toLocaleString()+'</div></div>'
      +'<div class="art-sync-metric"><div>Ignored</div><div>'+((S.artErrorIgnored||[]).length).toLocaleString()+'</div></div>';
  }
  window.aeSaveCsvUrl=function(){aeEnsureStore();var el=document.getElementById('aeCsvUrl');S.artErrorSource.url=aeClean(el&&el.value||'');markDirty();aeStatus(S.artErrorSource.url?'CSV URL saved. Click <strong>Sync CSV</strong> to import rows.':'CSV URL cleared.','ok');aeReadout();};
  window.aeSyncCsv=async function(){
    aeEnsureStore();var urlEl=document.getElementById('aeCsvUrl');var url=aeClean((urlEl&&urlEl.value)||S.artErrorSource.url||'');
    if(!url){aeStatus('Paste a published Google Sheet CSV URL first.','bad');return;}
    S.artErrorSource.url=url;
    aeStatus('Syncing Google CSV…','warn');
    try{
      var txt=await aeFetchCSV(url);
      var rows=aeParseCSV(txt); if(!rows.length)throw new Error('CSV is empty.');
      var hi=aeFindHeader(rows),headers=rows[hi].map(aeClean),dataRows=rows.slice(hi+1).filter(function(r){return r.some(function(c){return aeClean(c)!=='';});});
      var idx={
        date:aeIndex(headers,['date','created date','timestamp','submitted date','date sales happened']),
        so:aeIndex(headers,['sales order number','sales order #','sales order','so number','so #','order number','order #','sales order no']),
        rep:aeIndex(headers,['sales rep','rep name','rep','salesperson','sales person']),
        desc:aeIndex(headers,['explain issue','explain the issue','issue explanation','description','issue description','what happened','details']),
        type:aeIndex(headers,['issue type','type','issue category','category','error type'])
      };
      var missing=[]; if(idx.date<0)missing.push('date'); if(idx.so<0)missing.push('sales order number'); if(idx.rep<0)missing.push('sales rep'); if(idx.desc<0)missing.push('explain issue'); if(idx.type<0)missing.push('issue type');
      if(missing.length)throw new Error('Missing required column(s): '+missing.join(', ')+'. Headers found: '+headers.join(' | '));
      var stats={imported:0,updated:0,skipped:0,ignored:0,unmatched:0,badDate:0};
      var existing={};(S.artErrors||[]).forEach(function(a){if(a&&a.sourceKey)existing[a.sourceKey]=a;});
      dataRows.forEach(function(r){
        var d=aeParseDate(r[idx.date]); if(!d){stats.badDate++;return;}
        var w=aeWeekForDate(d),mr=aeMatchRep(r[idx.rep]),mt=aeMapType(r[idx.type]); if(!mr.matched){stats.unmatched++;return;}
        var rec={dateISO:aeISO(d),date:fds(aeISO(d)),sourceDate:aeClean(r[idx.date]),so:aeClean(r[idx.so]),sourceRep:aeClean(r[idx.rep]),rep:mr.name,repMatched:mr.matched,type:mt.type,issueTypeLabel:mt.label,sourceType:mt.source,desc:aeClean(r[idx.desc]),weekKey:w&&w.key||'',yr:String((w&&w.key||'').split('_')[0]||d.getFullYear()),q:String((w&&w.key||'').split('_')[1]||('Q'+(Math.floor(d.getMonth()/3)+1))),source:'google_csv',syncVersion:AE_SYNC_VERSION};
        rec.sourceKey=aeSourceKey(rec);
        if(aeIgnored(rec.sourceKey)){stats.ignored++;return;}
        if(!rec.so&&!rec.desc){stats.skipped++;return;}
        if(existing[rec.sourceKey]){Object.assign(existing[rec.sourceKey],rec,{id:existing[rec.sourceKey].id||Date.now()+Math.random()});stats.updated++;}
        else{rec.id=Date.now()+Math.floor(Math.random()*1000000);S.artErrors.push(rec);existing[rec.sourceKey]=rec;stats.imported++;}
      });
      S.artErrorSource.lastSync=new Date().toISOString();S.artErrorSource.lastCount=dataRows.length;S.artErrorSource.lastImported=stats.imported;S.artErrorSource.lastUpdated=stats.updated;S.artErrorSource.lastSkipped=stats.skipped+stats.ignored+stats.badDate;S.artErrorSource.lastUnmatched=stats.unmatched;S.artErrorSource.lastError='';
      markDirty();aePopulateMWeek();renderAEL();aeReadout();
      aeStatus('✓ Synced '+dataRows.length.toLocaleString()+' CSV row(s): <strong>'+stats.imported+'</strong> new, <strong>'+stats.updated+'</strong> updated, <strong>'+stats.ignored+'</strong> ignored, <strong>'+stats.unmatched+'</strong> unmatched rep name(s).',stats.unmatched?'warn':'ok');
    }catch(e){S.artErrorSource.lastError=e&&e.message?e.message:String(e);aeStatus('❌ '+aeEsc(S.artErrorSource.lastError),'bad');aeReadout();}
  };
  window.aeClearIgnoredRows=function(){aeEnsureStore();var n=S.artErrorIgnored.length;if(!n){aeStatus('No deleted CSV rows are currently ignored.','warn');return;}if(!confirm('Restore '+n+' ignored CSV row(s)? They may return on the next sync.'))return;S.artErrorIgnored=[];markDirty();aeStatus('Ignored-row list cleared. Click Sync CSV to bring source rows back.','ok');aeReadout();};
  window.aeDownloadIgnoredList=function(){aeEnsureStore();var rows=(S.artErrorIgnored||[]).map(function(k){return '"'+String(k).replace(/"/g,'""')+'"';});var blob=new Blob(['source_key\n'+rows.join('\n')],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='art_error_ignored_rows.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);};
  var _oldDeleteAE=deleteAE;
  deleteAE=function(id){
    var a=(S.artErrors||[]).find(function(x){return x.id===id;});
    if(a&&a.source==='google_csv'&&a.sourceKey){
      var ok=confirm('Remove this synced CSV row from the tracker and keep it ignored on future syncs?\n\nUse this when the issue should not ding the rep.');
      if(!ok)return;
      aeAddIgnored(a.sourceKey);
    }
    S.artErrors=(S.artErrors||[]).filter(function(x){return x.id!==id;});
    markDirty();renderAEL();aeReadout();
  };
  function aeTypeLabel(a){return aeEsc((a&&a.issueTypeLabel)||(AET[a&&a.type]||a&&a.type)||'—');}
  function aeDynamicTypeOptions(selected){
    var opts=Object.keys(AET).map(function(k){return '<option value="'+aeEsc(k)+'"'+(selected===k?' selected':'')+'>'+aeEsc(AET[k])+'</option>';});
    var customs=[];(S.artErrors||[]).forEach(function(a){if(a&&a.type&&String(a.type).indexOf('custom_')===0&&customs.indexOf(a.type)<0)customs.push(a.type);});
    customs.forEach(function(k){var lab=((S.artErrors||[]).find(function(a){return a.type===k;})||{}).issueTypeLabel||k;opts.push('<option value="'+aeEsc(k)+'"'+(selected===k?' selected':'')+'>'+aeEsc(lab)+'</option>');});
    return opts.join('');
  }
  var _oldAePopulate=aePopulateMWeek;
  aePopulateMWeek=function(){_oldAePopulate();var ft=document.getElementById('aeFT');if(ft){var old=ft.value||'all';ft.innerHTML='<option value="all">All types</option>'+aeDynamicTypeOptions(old);if([].slice.call(ft.options).some(function(o){return o.value===old;}))ft.value=old;else ft.value='all';}};
  renderAEL=function(){
    aeEnsureStore();var urlEl=document.getElementById('aeCsvUrl');if(urlEl&&document.activeElement!==urlEl)urlEl.value=(S.artErrorSource&&S.artErrorSource.url)||'';aeReadout();
    var f=aeFilteredList();
    var orders=aeFilteredOrders(f);
    var rate=orders>0?(f.length/orders*100):0;
    var byType={},byRep={},unmatched=0;
    f.forEach(function(a){var tk=a.type||'unknown';byType[tk]=(byType[tk]||0)+1;byRep[a.rep]=(byRep[a.rep]||0)+1;if(a.repMatched===false)unmatched++;});
    var tp=Object.entries(byType).sort(function(a,b){return b[1]-a[1];})[0];
    var rp=Object.entries(byRep).sort(function(a,b){return b[1]-a[1];})[0];
    aeSetText('aeKpiTotal',f.length.toLocaleString());
    var totalSub=document.querySelector('#aeKpiTotal')&&document.querySelector('#aeKpiTotal').parentElement?document.querySelector('#aeKpiTotal').parentElement.querySelector('.art-kpi-sub'):null; if(totalSub)totalSub.textContent=orders?rate.toFixed(1)+'% of '+orders.toLocaleString()+' filtered orders':((S.artErrorSource&&S.artErrorSource.lastSync)?'Synced CSV source':'No filtered order base');
    aeSetText('aeKpiTopType',tp?(((S.artErrors||[]).find(function(a){return a.type===tp[0];})||{}).issueTypeLabel||AET[tp[0]]||tp[0]):'—'); aeSetText('aeKpiTopTypeSub',tp?tp[1]+' errors in filtered view':'No errors found');
    aeSetText('aeKpiRepImpact',rp?rp[0]:'—'); aeSetText('aeKpiRepImpactSub',rp?rp[1]+' errors in filtered view'+(unmatched?' · '+unmatched+' unmatched':''):'No rep impact');
    aeSetText('aeKpiQuarter',rate.toFixed(1)+'%'); aeSetText('aeKpiQuarterSub',orders?f.length+' errors ÷ '+orders.toLocaleString()+' orders':'Selected filters');
    var sum=document.getElementById('aeSum');
    if(sum){sum.innerHTML=f.length?'<div class="chip"><div class="cv">'+f.length+'</div><div class="cl">filtered errors</div></div><div class="chip"><div class="cv">'+rate.toFixed(1)+'%</div><div class="cl">filtered error rate</div></div>'+(tp?'<div class="chip" style="border-left:3px solid #E24B4A;"><div class="cv" style="color:#E24B4A;">'+tp[1]+'</div><div class="cl">top: '+aeTypeLabel({type:tp[0],issueTypeLabel:((S.artErrors||[]).find(function(a){return a.type===tp[0];})||{}).issueTypeLabel})+'</div></div>':'')+(rp?'<div class="chip"><div class="cv">'+aeEsc(rp[0])+'</div><div class="cl">most impacted rep</div></div>':'')+(unmatched?'<div class="chip"><div class="cv" style="color:#FFD27A;">'+unmatched+'</div><div class="cl">unmatched rep names</div></div>':''):'';}
    var note=document.getElementById('aeQualityNote');
    if(note){
      if(!f.length) note.innerHTML='No filtered art errors yet. Sync the Google CSV or adjust filters to spot repeated issue types and rep coaching opportunities.';
      else note.innerHTML='<strong>Manager readout:</strong><br>'+f.length+' art error'+(f.length===1?'':'s')+' found in the current filtered view. '+(orders?('Filtered error rate is <strong>'+rate.toFixed(1)+'%</strong> across '+orders.toLocaleString()+' orders. '):'No matching order total is available for this filter. ')+(tp?('Top issue: <strong>'+aeTypeLabel({type:tp[0],issueTypeLabel:((S.artErrors||[]).find(function(a){return a.type===tp[0];})||{}).issueTypeLabel})+'</strong> ('+tp[1]+'). '):'')+(rp?('Most impacted rep: <strong>'+aeEsc(rp[0])+'</strong> ('+rp[1]+'). '):'')+(unmatched?('<br><br><strong style="color:#FFD27A;">'+unmatched+' row(s) have rep names that do not exactly match the tracker roster.</strong> Edit those rows or correct the Google Sheet spelling.'):'' );
    }
    var el=document.getElementById('aeLog'); if(!el)return;
    if(!f.length){el.innerHTML='<p style="font-size:12px;color:var(--color-text-secondary);padding:.4rem 0;">No art errors found.</p>';return;}
    el.innerHTML=f.slice().sort(function(a,b){return String(b.dateISO||'').localeCompare(String(a.dateISO||'')) || ((b.id||0)-(a.id||0));}).map(function(a){
      return '<div class="log-row" id="ae_row_'+a.id+'"><div class="editable-row"><div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px;"><span style="font-size:12px;font-weight:700;">'+aeEsc(a.rep)+'</span>'+(a.repMatched===false?'<span class="art-unmatched-badge">Unmatched</span>':'')+'<span style="font-weight:700;color:#8EDCFA;font-size:12px;">'+aeEsc(a.so||'No SO')+'</span><span class="it-badge">'+aeTypeLabel(a)+'</span><span style="font-size:11px;color:var(--color-text-secondary);">'+aeEsc(a.date||a.dateISO||'')+'</span><span style="font-size:11px;color:var(--color-text-secondary);">'+aeEsc(String(a.weekKey||'').replace(/_/g,' '))+'</span>'+(a.source==='google_csv'?'<span class="art-source-badge">CSV</span>':'')+'</div>'+(a.sourceRep&&a.sourceRep!==a.rep?'<div style="font-size:10.5px;color:#FFD27A;margin-bottom:4px;">Source rep: '+aeEsc(a.sourceRep)+'</div>':'')+(a.desc?'<div style="font-size:11.5px;color:#C8D0EA;line-height:1.5;">'+aeEsc(a.desc)+'</div>':'')+(a.source==='google_csv'?'<div class="art-delete-note">Delete this row if it should not count against the rep; synced rows stay ignored on future imports.</div>':'')+'</div><div style="display:flex;gap:5px;flex-shrink:0;">'+pencil('editAE('+a.id+')')+'<button class="rbtn" onclick="deleteAE('+a.id+')" style="font-size:10px;padding:2px 6px;" title="Remove from tracker">✕</button></div></div><div id="ae_edit_'+a.id+'"></div></div>';
    }).join('');
  };
  editAE=function(id){
    var a=(S.artErrors||[]).find(function(x){return x.id===id;});if(!a)return;document.querySelectorAll('.inline-edit-box').forEach(function(el){el.remove();});var box=document.getElementById('ae_edit_'+id);if(!box)return;
    var weekOpts=gwq(parseInt(a.yr||getYr(),10),a.q||getQ()).map(function(w){return '<option value="'+aeEsc(w.key)+'"'+(a.weekKey===w.key?' selected':'')+'>'+aeEsc(w.label)+'</option>';}).join('');
    box.innerHTML='<div class="inline-edit-box"><div class="ig"><label>Rep</label><select id="aeie_rep_'+id+'">'+(S.reps||[]).filter(function(r){return r&&r.name;}).map(function(r){return '<option'+(a.rep===r.name?' selected':'')+'>'+aeEsc(r.name)+'</option>';}).join('')+'</select></div><div class="ig"><label>SO number</label><input id="aeie_so_'+id+'" type="text" value="'+aeEsc(a.so||'')+'" style="width:120px;"></div><div class="ig"><label>Week</label><select id="aeie_wk_'+id+'">'+weekOpts+'</select></div><div class="ig"><label>Issue type</label><select id="aeie_type_'+id+'">'+aeDynamicTypeOptions(a.type)+'</select></div><div class="ig" style="flex:1;min-width:220px;"><label>Explanation</label><textarea id="aeie_desc_'+id+'">'+aeEsc(a.desc||'')+'</textarea></div><div style="display:flex;gap:6px;width:100%;margin-top:4px;"><button class="ie-save" onclick="saveAEEdit('+id+')">✓ Save</button><button class="ie-cancel" onclick="document.getElementById(\'ae_edit_'+id+'\').innerHTML=\'\'">Cancel</button></div></div>';
  };
  saveAEEdit=function(id){
    var a=(S.artErrors||[]).find(function(x){return x.id===id;});if(!a)return;
    var oldRep=a.rep;
    a.rep=document.getElementById('aeie_rep_'+id)&&document.getElementById('aeie_rep_'+id).value||a.rep;
    a.repMatched=true;
    a.so=document.getElementById('aeie_so_'+id)&&document.getElementById('aeie_so_'+id).value||a.so;
    a.weekKey=document.getElementById('aeie_wk_'+id)&&document.getElementById('aeie_wk_'+id).value||a.weekKey;
    a.type=document.getElementById('aeie_type_'+id)&&document.getElementById('aeie_type_'+id).value||a.type;
    a.issueTypeLabel=AET[a.type]||a.issueTypeLabel||a.type;
    a.desc=document.getElementById('aeie_desc_'+id)&&document.getElementById('aeie_desc_'+id).value||'';
    var parts=String(a.weekKey||'').split('_');a.yr=parts[0]||a.yr;a.q=parts[1]||a.q;
    markDirty();aePopulateMWeek();renderAEL();
  };
  var _oldSaveAE=saveAE;
  saveAE=function(){
    if(document.getElementById('aeSO'))return _oldSaveAE();
    aeStatus('Manual art-error entry is no longer the primary workflow. Paste the Google CSV URL and click Sync CSV.','warn');
  };
  var oldPopSel=popSel;
  popSel=function(){var res=oldPopSel.apply(this,arguments);setTimeout(function(){aePopulateMWeek();renderAEL();},0);return res;};
  var oldGt=window.gt;
  if(typeof oldGt==='function'&&!oldGt.__artCsv429){
    var wrapped=function(page,btn){var res=oldGt.apply(this,arguments);if(page==='art')setTimeout(function(){aeEnsureStore();var u=document.getElementById('aeCsvUrl');if(u)u.value=(S.artErrorSource&&S.artErrorSource.url)||'';aePopulateMWeek();renderAEL();},60);return res;};
    wrapped.__artCsv429=true;window.gt=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){aeEnsureStore();aePopulateMWeek();renderAEL();},250);});
  else setTimeout(function(){aeEnsureStore();aePopulateMWeek();renderAEL();},250);
})();

