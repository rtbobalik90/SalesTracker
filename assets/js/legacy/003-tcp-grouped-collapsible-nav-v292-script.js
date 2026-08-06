
(function(){
  var NAV_GROUPS=[
    {key:'command',icon:'🏠',label:'Command Center',open:true,items:[['year','Year Overview','🗓️'],['lb','Leaderboard','🏆']]},
    {key:'salesperf',icon:'📈',label:'Sales Performance',open:true,items:[['daily','Daily Sales & Calls','🗓️'],['intel','Forecast','🔮'],['inbound','Inbound Leads','📥'],['customers','Customers','🏢'],['orders','Orders','📦'],['reports','Reports Hub','📄'],['slides','Sales Slides','🎬']]},
    {key:'repmgmt',icon:'👥',label:'Rep Management',open:true,items:[['profiles','Rep Profiles','👤'],['repportal','Rep Portal','🔐'],['review','Reviews','📝'],['hr','HR & Notes','📋']]},
    {key:'opsg',icon:'🛠️',label:'Operations',open:true,items:[['entry','Data Entry','⌨️'],['credits','Credit Memos','💳'],['reviews','Customer Reviews','⭐'],['art','Art Errors','🎨'],['prodintel','Production Intelligence','📊']]},
    {key:'engage',icon:'🎮',label:'Games',open:false,items:[['gamestorm','Gamestorm','🎮'],['games','Games','🎮'],['gtrack','Game Tracker','📊']]},
    {key:'system',icon:'⚙️',label:'Admin',open:false,items:[['admin','Admin','⚙️'],['cknow','Company Knowledge','🧠']]}
  ];
  
/* ===== MODULE: PHASE12-DAILYREP (per-rep cumulative daily sales, additive to combined totals) ===== */
function _drEnsure(){if(!S.dailyRep||typeof S.dailyRep!=='object')S.dailyRep={};/* {date:{rep:cumAmt,...,__corp:amt}} */}
function _drToday(){var n=new Date();function p(x){return (x<10?'0':'')+x;}return n.getFullYear()+'-'+p(n.getMonth()+1)+'-'+p(n.getDate());}
function _drDates(){_drEnsure();return Object.keys(S.dailyRep).sort();}
function _drWeekStart(dateISO){var p=String(dateISO).split('-');var d=new Date(Date.UTC(+p[0],(+p[1])-1,+p[2]));d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d.toISOString().slice(0,10);}function _drValAt(dateISO,key){var v=(S.dailyRep[dateISO]||{});var x=(key==='__corp')?v.__corp:v[key];return (x!=null&&x!=='')?(Number(x)||0):null;}function _drLatestInWeek(dateISO,key){var ws=_drWeekStart(dateISO);var ds=_drDates().filter(function(d){return d>=ws&&d<=dateISO;});for(var i=ds.length-1;i>=0;i--){var v=_drValAt(ds[i],key);if(v!=null)return v;}return 0;}function _drPrevWeekEnd(dateISO,key){var ws=_drWeekStart(dateISO);var ds=_drDates().filter(function(d){return d<ws;});for(var i=ds.length-1;i>=0;i--){var v=_drValAt(ds[i],key);if(v!=null)return v;}return 0;}function _drWeekBaseline(dateISO,key){var ws=_drWeekStart(dateISO);var ds=_drDates().filter(function(d){return d>=ws&&d<=dateISO;});var fv=null;for(var i=0;i<ds.length;i++){var v=_drValAt(ds[i],key);if(v!=null){fv=v;break;}}var pe=_drPrevWeekEnd(dateISO,key);if(fv==null)return pe;return fv>=pe?pe:0;}function _drWTD(dateISO,key){return _drLatestInWeek(dateISO,key);}function _drPrevDate(dateISO){var ws=_drWeekStart(dateISO);var ds=_drDates().filter(function(d){return d<dateISO&&d>=ws;});return ds.length?ds[ds.length-1]:null;}
function _drRepDay(dateISO,repName){ // that day's SMB = week-to-date today - week-to-date prev (within Sun-Sat work week)
  _drEnsure();var cur=_drWTD(dateISO,repName);
  var pd=_drPrevDate(dateISO);var prev=pd?_drWTD(pd,repName):0;
  return Math.max(0,cur-prev);
}
function _drDayTotals(dateISO){
  _drEnsure();
  var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
  var smbDay=0,smbCum=0,rows=[];
  reps.forEach(function(r){
    var cum=_drWTD(dateISO,r.name);/* week-to-date SMB (resets Sunday) */
    var dayS=_drRepDay(dateISO,r.name);
    if(cum>0||dayS>0){rows.push({name:r.name,cum:cum,day:dayS});smbCum+=cum;smbDay+=dayS;}
  });
  rows.sort(function(a,b){return b.day-a.day||b.cum-a.cum;});
  var corp=_drWTD(dateISO,'__corp');/* week-to-date corp (auto-detects weekly reset vs carried cumulative) */
  var pd=_drPrevDate(dateISO);var corpPrev=pd?_drWTD(pd,'__corp'):0;
  var corpDay=Math.max(0,corp-corpPrev);
  return {rows:rows,smbDay:smbDay,smbCum:smbCum,corpCum:corp,corpDay:corpDay,totalDay:smbDay+corpDay,totalCum:smbCum+corp,top:rows[0]||null};
}
function _drCorpCumulativeFor(dateISO){ try{ var v=(S.dailyRep&&S.dailyRep[dateISO]||{}).__corp; return (v!=null&&v!=='')?(Number(v)||0):''; }catch(e){ return ''; } }
function _drRenderForm(){
  var host=document.getElementById('dr-form');if(!host)return;
  _drEnsure();
  var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
  var mainDate=document.getElementById('dailyDate');
  var d=(mainDate&&mainDate.value)||(document.getElementById('dr-date')||{}).value||_drToday();
  if(mainDate&&!mainDate.value)mainDate.value=d;
  var corpCum=_drCorpCumulativeFor(d);
  var dLabel=(typeof formatDateShort==='function'?formatDateShort(d):d);
  host.innerHTML='<div class="daily-rep-entry-card">'
    +'<div class="r3-head"><span class="r3-av" style="background:linear-gradient(135deg,#34D399,#FA873D);">&#128100;</span>'
    +'<div class="r3-hmeta"><div class="r3-name">Per-rep daily entry</div><div class="r3-sub">Same date as running total &middot; cumulative SMB totals &middot; blank fields = re-enter totals</div></div></div>'
    +'<div style="padding:14px 16px 0;position:relative;z-index:1;">'
    +'<input type="hidden" id="dr-date" value="'+d+'"><span style="display:inline-flex;align-items:center;gap:7px;margin-left:14px;font-size:11px;color:var(--tcp-muted,#8b95a7);vertical-align:middle;">CORP (cumulative, wk-to-date):<input type="number" id="dr-corp" min="0" step="0.01" placeholder="0.00" value="'+corpCum+'" oninput="try{_drLive()}catch(e){}" style="width:130px;background:rgba(0,0,0,.25);border:1px solid var(--tcp-line,#2B2B2B);border-radius:7px;color:inherit;font-size:12px;padding:6px 9px;"></span>'
    +'<div class="daily-rep-date-chip"><span>Sales date tied to left panel</span><strong>'+_m2esc(dLabel)+'</strong></div>'
    +'</div>'
    +'<div style="padding:0 16px 16px;position:relative;z-index:1;"><div class="dc2-panel-h"><span>Rep cumulative totals (SMB)</span><span id="dr-live" class="dc-flat" style="font-size:11px;"></span></div>'
    +'<div class="dr-grid">'
    +reps.map(function(r){var v=(S.dailyRep[d]&&S.dailyRep[d][r.name]!=null)?S.dailyRep[d][r.name]:'';return '<div class="dr-cell"><label>'+_m2esc(r.name)+'</label><input type="number" class="r3-in dr-in" data-rep="'+_m2esc(r.name)+'" style="margin:0;" min="0" step="0.01" placeholder="0.00" value="'+v+'" oninput="_drLive()"></div>';}).join('')
    +'</div>'
    +'<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><button class="dc2-act" style="border-color:#F0A9A9;color:#F0A9A9;margin-right:8px;" onclick="drResetCorp()" title="Clear all stored corp values and start fresh">Reset all CORP</button><button class="dc2-act" style="border-color:var(--tcp-accent);" onclick="drSaveRepDay()">&#128190; Save rep totals</button><span id="dr-msg" class="dc-up" style="display:none;font-size:11px;"></span></div>'
    +'</div></div>';
  _drLive();
}
function _drLive(){
  var el=document.getElementById('dr-live');if(!el)return;
  var d=(document.getElementById('dr-date')||{}).value||_drToday();
  var ins=document.querySelectorAll('.dr-in');
  var smbCum=0;ins.forEach(function(i){smbCum+=Number(i.value)||0;});
  var corp=Number((document.getElementById('dr-corp')||{}).value)||0;
  // day-jumps
  var smbDay=0;ins.forEach(function(i){var rep=i.dataset.rep;var cur=Number(i.value)||0;var pd=_drPrevDate(d);var prev=pd?Number((S.dailyRep[pd]||{})[rep]||0):0;smbDay+=Math.max(0,cur-prev);});
  el.innerHTML='SMB cum $'+Math.round(smbCum).toLocaleString()+' &middot; SMB day +$'+Math.round(smbDay).toLocaleString()+' &middot; total cum $'+Math.round(smbCum+corp).toLocaleString();
}
function drResetCorp(){ if(!confirm('Clear ALL stored CORP values? (Rep SMB stays. You will re-enter corp fresh \u2014 cumulative, resets Sunday.)'))return; try{ if(S.dailyRep){ Object.keys(S.dailyRep).forEach(function(d){ if(S.dailyRep[d]&&('__corp' in S.dailyRep[d]))delete S.dailyRep[d].__corp; }); } }catch(e){} try{ if(S.dailySales)S.dailySales=(S.dailySales||[]).map(function(e){e.corpSales=0;e.corpCumulative=0;return e;}); }catch(e){} try{markDirty();}catch(e){} try{if(typeof renderDailyLog==='function')renderDailyLog();}catch(e){} try{if(typeof _drRenderForm==='function')_drRenderForm();}catch(e){} alert('All CORP values cleared. Enter corp per day going forward (cumulative week-to-date, restarts each Sunday).'); }
try{window.drResetCorp=drResetCorp;}catch(e){}
function drSaveRepDay(){
  _drEnsure();
  var d=(document.getElementById('dr-date')||{}).value;
  if(!d){alert('Pick a date.');return;}
  var rec={};var any=false;
  document.querySelectorAll('.dr-in').forEach(function(i){var v=i.value.trim();if(v!==''){rec[i.dataset.rep]=Number(v)||0;any=true;}});
  var corp=(document.getElementById('dr-corp')||{}).value.trim();
  if(corp!=='')rec.__corp=Number(corp)||0;
  if(Object.keys(rec).length===0){delete S.dailyRep[d];}else{S.dailyRep[d]=rec;}
  try{if(S.dailySales)S.dailySales=S.dailySales.filter(function(e){return e.date!==d;});}catch(e){}
  try{markDirty();}catch(e){}
  var m=document.getElementById('dr-msg');if(m){m.textContent='\u2713 Saved '+d;m.style.display='inline';setTimeout(function(){m.style.display='none';},2500);}
  renderDailyRepView();
  if(typeof buildDailyMonthSel==='function')buildDailyMonthSel();
  if(typeof renderDailyLog==='function')renderDailyLog();
}
function renderDailyRepView(){
  // v418: the separate per-rep daily log table was intentionally removed.
  // Calendar days now carry the top-rep badge and open the daily per-rep popup directly.
  var host=document.getElementById('dr-view');
  if(host)host.innerHTML='';
}
function drDayPopup(dateISO){
  var t=_drDayTotals(dateISO);
  var dailyEntry=null;
  try{dailyEntry=getDailySales().filter(function(e){return e.date===dateISO;})[0]||null;}catch(e){}
  var _hasRep=(t.rows&&t.rows.length>0)||Number(t.smbDay||0)>0||Number(t.corpDay||0)>0;
  var _corpDay=Number(t.corpDay||0)>0?Number(t.corpDay||0):(dailyEntry?Number(dailyEntry.corpSales||0):0);
  var summary=_hasRep?{
    smbDay:Number(t.smbDay||0),
    corpDay:_corpDay,
    totalDay:Number(t.smbDay||0)+_corpDay,
    runningTotal:Number(t.totalCum||0)
  }:{
    smbDay:dailyEntry?Number(dailyEntry.smbSales||0):Number(t.smbDay||0),
    corpDay:dailyEntry?Number(dailyEntry.corpSales||0):Number(t.corpDay||0),
    totalDay:dailyEntry?Number(dailyEntry.dailySales||0):Number(t.totalDay||0),
    runningTotal:dailyEntry?Number(dailyEntry.runningTotal||0):Number(t.totalCum||0)
  };
  var dstr=(typeof formatDateShort==='function'?formatDateShort(dateISO):dateISO);
  var rowsH=t.rows.length?t.rows.map(function(r,i){
    return '<div class="r3m-row"><span style="display:flex;align-items:center;gap:8px;min-width:0;"><span class="dc-flat" style="width:16px;flex:none;">'+(i+1)+'</span><span style="font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_m2esc(r.name)+'</span>'+(i===0&&r.day>0?' <span class="r3-pill" style="background:transparent;border:1px solid #FFD27A;color:#FFD27A;flex:none;">&#11088; top</span>':'')+'</span><span style="text-align:right;white-space:nowrap;"><span style="font-weight:900;color:#A7FFC0;">+$'+Math.round(r.day).toLocaleString()+'</span> <span class="dc-flat" style="font-weight:400;">$'+Math.round(r.cum).toLocaleString()+' cum</span></span></div>';
  }).join(''):'<div class="daily-popup-note">No per-rep entries are saved for this day yet. Use <strong>Per-rep daily entry</strong> to save each rep\'s cumulative SMB total, then this popup will rank everyone for the day.</div>';
  var h='<div class="daily-rep-popup"><div class="r3m-h"><span class="r3-pill">Daily sales</span><div class="r3m-title">'+dstr+'</div></div>'
    +'<div class="dc2-stats" style="grid-template-columns:1fr 1fr 1fr;border:1px solid var(--tcp-line);border-radius:10px;margin-bottom:10px;">'
    +'<div class="dc2-stat"><div class="dc2-sl">SMB (day)</div><div class="dc2-sv" style="font-size:16px;color:#FFD27A;">+$'+Math.round(summary.smbDay).toLocaleString()+'</div></div>'
    +'<div class="dc2-stat"><div class="dc2-sl">CORP (day)</div><div class="dc2-sv" style="font-size:16px;color:#8EDCFA;">+$'+Math.round(summary.corpDay).toLocaleString()+'</div></div>'
    +'<div class="dc2-stat"><div class="dc2-sl">Total (day)</div><div class="dc2-sv" style="font-size:16px;">+$'+Math.round(summary.totalDay).toLocaleString()+'</div></div>'
    +'</div>'
    +'<div class="dc2-panel-h"><span>Rep sales &middot; ranked (day &middot; cumulative)</span><span class="dc-flat" style="font-size:11px;">Σ $'+Math.round(summary.runningTotal).toLocaleString()+'</span></div>'+rowsH+'</div>';
  if(typeof _r360Modal==='function')_r360Modal(h);else alert('Rep sales for '+dstr);
}
window.drSaveRepDay=drSaveRepDay;window.renderDailyRepView=renderDailyRepView;window.drDayPopup=drDayPopup;window._drDayTotals=_drDayTotals;window._drRenderForm=_drRenderForm;window._drLive=_drLive;
window.addEventListener('load',function(){
  setTimeout(function(){try{if(document.getElementById('pg-daily')&&document.getElementById('pg-daily').classList.contains('active')){_drRenderForm();renderDailyRepView();}}catch(e){}},700);
});
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;
  var oc=b.getAttribute('onclick')||'';
  if(oc.indexOf("gt('daily'")>=0)setTimeout(function(){try{_drRenderForm();renderDailyRepView();}catch(_e){}},90);
});

/* ===== MODULE: PHASE11-REVIEWS (Customer Reviews: CSV pull, ISO week payout, dedupe, celebration) ===== */
var REVIEW_PAY=10;
function _rvEnsure(){if(!S.reviews||typeof S.reviews!=='object')S.reviews={url:'',rows:[],lastFetched:null,decisions:{},unmatchFix:{}};if(!S.reviews.decisions)S.reviews.decisions={};if(!S.reviews.unmatchFix)S.reviews.unmatchFix={};if(!S.reviews.repFix)S.reviews.repFix={};}
function _rvCsvSplit(line){var out=[],cur='',q=false;for(var i=0;i<line.length;i++){var ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===','&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;}
function _rvCsvRows(text){
  var rows=[],cur=[],val='',q=false,NL=String.fromCharCode(10),CR=String.fromCharCode(13);
  text=String(text||'');
  for(var i=0;i<text.length;i++){var ch=text[i];
    if(ch===CR)continue;
    if(q){ if(ch==='"'){ if(text[i+1]==='"'){val+='"';i++;} else q=false; } else val+=ch; }
    else { if(ch==='"')q=true; else if(ch===','){cur.push(val);val='';} else if(ch===NL){cur.push(val);rows.push(cur);cur=[];val='';} else val+=ch; }
  }
  cur.push(val); rows.push(cur);
  return rows.filter(function(r){return r.some(function(x){return String(x).trim().length;});});
}
function _rvParseCSV(text){
  var allRows=_rvCsvRows(text);
  if(allRows.length<2)return [];
  var head=allRows[0].map(function(h){return String(h).trim().toLowerCase();});
  function col(){var names=Array.prototype.slice.call(arguments);for(var i=0;i<names.length;i++){var idx=head.findIndex(function(h){return h.indexOf(names[i])>=0;});if(idx>=0)return idx;}return -1;}
  var ci={ts:col('timestamp','date'),email:col('email'),cust:col('customer id','customer_id'),type:col('type'),stars:col('star','rating'),msg:col('message','review'),rep:col('sales rep','rep name','rep'),custName:col('customer name')};
  var rows=[];
  for(var i=1;i<allRows.length;i++){
    var f=allRows[i];
    var ts=ci.ts>=0?String(f[ci.ts]||'').trim():'';
    var typ=ci.type>=0?String(f[ci.type]||'').trim():'';
    var msg=ci.msg>=0?String(f[ci.msg]||'').trim():'';
    var rep=ci.rep>=0?String(f[ci.rep]||'').trim():'';
    if(!ts&&!msg&&!rep)continue;
    rows.push({ts:ts,email:ci.email>=0?String(f[ci.email]||'').trim():'',custId:ci.cust>=0?String(f[ci.cust]||'').trim():'',type:typ,stars:ci.stars>=0?Number(f[ci.stars])||0:0,msg:msg,rep:rep,custName:ci.custName>=0?String(f[ci.custName]||'').trim():''});
  }
  return rows;
}
function _rvPlatform(t){var s=String(t||'').toLowerCase();if(s.indexOf('google')>=0)return 'Google';if(s.indexOf('trust')>=0)return 'Trustpilot';if(s.indexOf('face')>=0)return 'Facebook';return t?String(t):'Other';}
function _rvPays(t){var p=_rvPlatform(t);return p==='Google'||p==='Trustpilot';}
function _rvDate(ts){if(!ts)return null;var d=new Date(ts);if(!isNaN(d))return d;var m=String(ts).match(/(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})/);if(m){var a=+m[1],b=+m[2],c=+m[3];if(a>31)return new Date(a,b-1,c);return new Date(c<100?2000+c:c,a-1,b);}return null;}
function _rvISO(d){if(!d)return null;var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));var day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);var ys=new Date(Date.UTC(t.getUTCFullYear(),0,1));var wn=Math.ceil((((t-ys)/86400000)+1)/7);return {year:t.getUTCFullYear(),week:wn};}
function _rvWeekRange(year,week){var simple=new Date(Date.UTC(year,0,1+(week-1)*7));var dow=simple.getUTCDay()||7;var monday=new Date(simple);monday.setUTCDate(simple.getUTCDate()-dow+1);var sunday=new Date(monday);sunday.setUTCDate(monday.getUTCDate()+6);return {start:monday,end:sunday};}
function _rvFmt(d){return d?(d.getUTCMonth()+1)+'/'+d.getUTCDate():'';}
function _rvHash(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').replace(/[^\w ]/g,'').trim();}
function _rvRowId(r){return _rvHash(r.rep)+'|'+_rvHash(r.custName)+'|'+String(r.ts).slice(0,16)+'|'+_rvHash(r.msg).slice(0,40);}
function _rvMatchRep(name){
  _rvEnsure();
  var raw=String(name||'').trim();
  if(!raw)return {matched:false,name:'',display:'(no name)'};
  var fix=S.reviews.unmatchFix[raw.toLowerCase()];if(fix)raw=fix;
  var reps=(typeof activeReps==='function'?activeReps():(S.reps||[]));
  var lk=raw.toLowerCase();
  var hit=reps.find(function(r){return r.name.toLowerCase()===lk;});
  if(hit)return {matched:true,name:hit.name,display:hit.name};
  hit=reps.find(function(r){var p=r.name.toLowerCase().split(/\s+/);var q=lk.split(/\s+/);return p[0]===q[0]&&p[p.length-1]===q[q.length-1];});
  if(hit)return {matched:true,name:hit.name,display:hit.name};
  hit=reps.find(function(r){return r.name.toLowerCase().replace(/\s+/g,'')===lk.replace(/\s+/g,'');});
  if(hit)return {matched:true,name:hit.name,display:hit.name};
  return {matched:false,name:raw,display:raw};
}
/* enrich rows with computed fields + dedupe/decision status */
function _rvEnriched(){
  _rvEnsure();
  var seenText={},out=[];
  (S.reviews.rows||[]).forEach(function(r,idx){
    var d=_rvDate(r.ts),iso=_rvISO(d);
    var id=_rvRowId(r);
    var th=_rvHash(r.msg);
    var dec=S.reviews.decisions[id];
    var isDup=false;
    if(th&&th.length>4){if(seenText[th]){isDup=true;}else seenText[th]=id;}
    var m=_rvMatchRep(r.rep);
    var _rfx=(S.reviews.repFix||{})[id];
    if(_rfx!==undefined){m=_rfx?{matched:true,name:_rfx,display:_rfx}:{matched:false,name:'',display:'(no name)'};}
    out.push({raw:r,idx:idx,id:id,date:d,year:iso?iso.year:null,week:iso?iso.week:null,
      platform:_rvPlatform(r.type),pays:_rvPays(r.type),
      repName:m.name,matched:m.matched,repDisplay:m.display,
      isDup:isDup,decision:dec||null});
  });
  return out;
}
function _rvActive(list){ // rows that count: not removed, dupes only if approved
  return list.filter(function(x){
    if(x.decision==='removed')return false;
    if(x.isDup&&x.decision!=='approved')return false;
    return true;
  });
}
/* ---------- fetch ---------- */
function _rvUrl(){_rvEnsure();return (document.getElementById('rv-url')||{}).value||S.reviews.url||'';}
async function rvRefresh(silent){
  _rvEnsure();
  var url=_rvUrl().trim();
  var st=document.getElementById('rv-status');
  if(!url){if(st&&!silent)st.textContent='Paste your published CSV link first.';return;}
  S.reviews.url=url;try{markDirty();}catch(e){}
  if(st)st.textContent='Fetching\u2026';
  try{
    var res=await fetch(url,{cache:'no-store'});
    var text=await res.text();
    var rows=_rvParseCSV(text);
    S.reviews.rows=rows;S.reviews.lastFetched=new Date().toISOString();
    try{markDirty();}catch(e){}
    if(st)st.textContent='\u2713 '+rows.length+' reviews loaded';
    renderReviewsPage();
  }catch(e){
    if(st)st.textContent='\u2717 Fetch failed \u2014 check the link is a published CSV. ('+String((e&&e.message)||e).slice(0,50)+')';
  }
}
/* ---------- decisions ---------- */
function rvDecide(id,decision){_rvEnsure();S.reviews.decisions[id]=decision;try{markDirty();}catch(e){}renderReviewsPage();}
function rvSetReviewRep(id,repName){_rvEnsure();if(repName==='__auto'){delete S.reviews.repFix[id];}else{S.reviews.repFix[id]=repName;}try{markDirty();}catch(e){}renderReviewsPage();}
function rvAssignRep(rawName,repName){_rvEnsure();if(repName)S.reviews.unmatchFix[String(rawName).toLowerCase()]=repName;else delete S.reviews.unmatchFix[String(rawName).toLowerCase()];try{markDirty();}catch(e){}renderReviewsPage();}
/* ---------- selectors / default to main tracker week ---------- */
function _rvLastWeek(){var d=new Date();d.setDate(d.getDate()-7);return _rvISO(d);}
function _rvTrackerDefault(){
  try{
    if(typeof getYr==='function'&&typeof getQ==='function'&&typeof getWN==='function'){
      return {year:getYr(),q:getQ(),week:getWN()};
    }
  }catch(e){}
  var lw=_rvLastWeek()||{};
  return {year:lw.year||new Date().getFullYear(),q:_qFromWeek(lw.year||new Date().getFullYear(),lw.week||1),week:lw.week||1};
}
function _rvWeeksForQ(year,q){
  try{
    if(typeof gwq==='function'){
      var tr=(gwq(parseInt(year,10),q)||[]).map(function(w){return Number(w.num);}).filter(function(n){return !isNaN(n);});
      if(tr.length)return tr;
    }
  }catch(e){}
  var mo={Q1:[0,2],Q2:[3,5],Q3:[6,8],Q4:[9,11]}[q]||[0,11];
  var out=[];for(var w=1;w<=53;w++){var r=_rvWeekRange(year,w);if(r.start.getUTCFullYear()===year&&r.start.getUTCMonth()>=mo[0]&&r.start.getUTCMonth()<=mo[1])out.push(w);}return out;
}
function _rvTrackerWeekObj(year,q,week){
  year=parseInt(year,10);week=parseInt(week,10);
  try{
    if(typeof gwq==='function'){
      var hit=(gwq(year,q)||[]).filter(function(w){return Number(w.num)===week;})[0];
      if(hit)return hit;
    }
  }catch(e){}
  var r=_rvWeekRange(year,week);
  return {num:week,key:year+'_'+q+'_W_'+week,start:r.start,end:r.end,label:'Wk '+week+': '+_rvFmt(r.start)+'\u2013'+_rvFmt(r.end),month:''};
}
function _rvDateOnly(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function _rvInTrackerRange(x,wk){
  if(!x||!x.date||!wk||!wk.start||!wk.end)return false;
  var d=_rvDateOnly(x.date),s=_rvDateOnly(wk.start),e=_rvDateOnly(wk.end);
  return d>=s&&d<=e;
}
function _rvAllTrackerWeeks(){
  var out=[];
  for(var y=2026;y<=2030;y++)['Q1','Q2','Q3','Q4'].forEach(function(q){
    _rvWeeksForQ(y,q).forEach(function(n){var w=_rvTrackerWeekObj(y,q,n);out.push({year:y,q:q,week:Number(n),num:Number(n),start:w.start,end:w.end,label:w.label,key:y+'_'+q+'_'+n});});
  });
  return out.sort(function(a,b){return a.start-b.start;});
}
function _rvPriorTrackerWeeks(year,q,week,count){
  var seq=_rvAllTrackerWeeks(),key=String(year)+'_'+q+'_'+String(week),idx=seq.findIndex(function(w){return w.key===key;});
  if(idx<0)idx=seq.findIndex(function(w){return w.year==year&&w.q===q&&Number(w.week)===Number(week);});
  if(idx<0)return [];
  return seq.slice(Math.max(0,idx-(count-1)),idx+1);
}
function _rvSel(id){return document.getElementById(id);}
function _rvSetFilter(year,q,week){
  var y=_rvSel('rv-yr'),qs=_rvSel('rv-q'),w=_rvSel('rv-wk');
  if(y)y.value=String(year);
  if(qs)qs.value=q;
  if(w){
    var nums=_rvWeeksForQ(parseInt(year,10),q);
    w.innerHTML=nums.map(function(n){var r=_rvTrackerWeekObj(parseInt(year,10),q,n);return '<option value="'+n+'">'+(r.label||('Wk '+n+': '+_rvFmt(r.start)+'\u2013'+_rvFmt(r.end)))+'</option>';}).join('');
    if(nums.indexOf(Number(week))<0&&nums.length)week=nums[nums.length-1];
    w.value=String(week);
  }
}
function _rvSyncFiltersToMain(){var d=_rvTrackerDefault();_rvSetFilter(d.year,d.q,d.week);}
function _rvShiftWeek(delta){
  var f=_rvCurrentFilter(),seq=_rvAllTrackerWeeks(),key=String(f.year)+'_'+f.q+'_'+String(f.week),idx=seq.findIndex(function(w){return w.key===key;});
  if(idx<0)return;
  var tgt=seq[Math.max(0,Math.min(seq.length-1,idx+delta))];
  _rvSetFilter(tgt.year,tgt.q,tgt.week);renderReviewsPage();
}
function _rvCurrentFilter(){
  var d=_rvTrackerDefault(),y=_rvSel('rv-yr'),q=_rvSel('rv-q'),w=_rvSel('rv-wk');
  return {year:y?parseInt(y.value,10):d.year,q:q?q.value:d.q,week:w?parseInt(w.value,10):d.week};
}
/* ---------- render ---------- */
function _rvEditCss(){if(document.getElementById('rv-edit-css'))return;var s=document.createElement('style');s.id='rv-edit-css';s.textContent='.rv-edit-pencil{background:transparent;border:1px solid var(--tcp-line,#2a3340);border-radius:7px;cursor:pointer;font-size:11px;line-height:1;padding:3px 6px;opacity:.65;}.rv-edit-pencil:hover{opacity:1;border-color:#FA873D;}.rv-pick-wrap .rv-rep-pick{background:rgba(0,0,0,.28);border:1px solid var(--tcp-line,#2a3340);border-radius:7px;color:inherit;font-size:11px;padding:3px 7px;}';document.head.appendChild(s);}
function renderReviewsPage(){_rvEditCss();
  var host=document.getElementById('reviews-page');if(!host)return;
  _rvEnsure();
  var all=_rvEnriched();
  var def=_rvTrackerDefault();
  // build selectors once; Customer Reviews now defaults to the main tracker week
  var f=_rvCurrentFilter();
  if(!_rvSel('rv-yr')){f={year:def.year,q:def.q,week:def.week};}
  var yrNums=_rvWeeksForQ(f.year,f.q);
  if(yrNums.indexOf(Number(f.week))<0&&yrNums.length){f.week=(f.year===def.year&&f.q===def.q&&yrNums.indexOf(Number(def.week))>=0)?def.week:yrNums[yrNums.length-1];}
  var range=_rvTrackerWeekObj(f.year,f.q,f.week);
  var yrs={};all.forEach(function(x){if(x.year)yrs[x.year]=1;});yrs[def.year]=1;var yrList=Object.keys(yrs).map(Number).sort();
  var pendingDupes=all.filter(function(x){return x.isDup&&!x.decision;});
  var unmatched=_rvActive(all).filter(function(x){return !x.matched&&x.pays;});
  // selected-week rows use the Tracker week date range, not ISO Mon-Sun
  var wk=_rvActive(all).filter(function(x){return _rvInTrackerRange(x,range);});
  // payout: matched + paying platform
  var pay={};wk.forEach(function(x){if(x.pays&&x.matched){pay[x.repName]=(pay[x.repName]||0)+1;}});
  var payList=Object.keys(pay).map(function(n){return {name:n,count:pay[n],amt:pay[n]*REVIEW_PAY};}).sort(function(a,b){return b.count-a.count;});
  var payTotal=payList.reduce(function(s,r){return s+r.amt;},0);
  var gCount=wk.filter(function(x){return x.platform==='Google';}).length;
  var tCount=wk.filter(function(x){return x.platform==='Trustpilot';}).length;
  var totalRev=wk.length;
  // celebration
  var topEarner=payList[0];
  // build UI
  function opt(v,cur,lbl){return '<option value="'+v+'"'+(String(v)===String(cur)?' selected':'')+'>'+(lbl||v)+'</option>';}
  var yrOpts=yrList.map(function(y){return opt(y,f.year);}).join('');
  var qOpts=['Q1','Q2','Q3','Q4'].map(function(q){return opt(q,f.q);}).join('');
  var wkNums=_rvWeeksForQ(f.year,f.q);
  var wkOpts=wkNums.map(function(w){var r=_rvTrackerWeekObj(f.year,f.q,w);return opt(w,f.week,(r.label||('Wk '+w+': '+_rvFmt(r.start)+'\u2013'+_rvFmt(r.end))));}).join('');
  var lastFetch=S.reviews.lastFetched?new Date(S.reviews.lastFetched).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'never';

  var html='<div class="r3-shell rv-shell">'
    +'<div class="r3-head rv-hero"><span class="r3-av" style="background:linear-gradient(135deg,#FBBF24,#FA873D);">&#11088;</span>'
    +'<div class="r3-hmeta"><div class="r3-name">Customer Reviews</div><div class="r3-sub">Google &amp; Trustpilot &middot; $'+REVIEW_PAY+' per review &middot; last synced '+lastFetch+'</div></div>'
    +'<div class="r3-hactions"><button class="dc2-act" onclick="rvRefresh(false)">&#8635; Refresh</button></div></div>';
  // source row
  html+='<div class="rv-source-row" style="padding:11px 16px;border-bottom:1px solid var(--tcp-line);display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    +'<input id="rv-url" class="r3-in" style="flex:1;min-width:240px;margin:0;" placeholder="Published Google Sheet CSV link" value="'+_m2esc(S.reviews.url||'')+'">'
    +'<span id="rv-status" class="dc-flat" style="font-size:11px;">'+(S.reviews.rows&&S.reviews.rows.length?('\u2713 '+S.reviews.rows.length+' loaded'):'')+'</span></div>';
  // duplicate queue
  if(pendingDupes.length){
    html+='<div class="rv-alert rv-alert-dupes" style="padding:11px 16px;border-bottom:1px solid var(--tcp-line);background:rgba(251,191,36,.06);">'
      +'<div class="dc2-panel-h" style="color:var(--tcp-gold);"><span>&#9888;&#65039; Possible duplicates &mdash; approve or remove ('+pendingDupes.length+')</span></div>';
    pendingDupes.forEach(function(x){
      html+='<div class="r3-note" style="border-color:rgba(251,191,36,.35);"><div class="r3-note-h"><span>'+_m2esc(x.repDisplay)+' &middot; '+x.platform+' &middot; '+_stars(x.raw.stars)+' &middot; '+_m2esc(x.raw.custName||'')+' &middot; <span class="dc-flat">'+_m2esc(String(x.raw.ts).slice(0,10))+'</span></span>'
        +'<span style="display:flex;gap:6px;"><button class="dc-mini" style="border-color:var(--tcp-green);color:var(--tcp-green);" onclick="rvDecide(\''+x.id+'\',\'approved\')">&#10003; Keep</button><button class="dc-mini" style="border-color:var(--tcp-red);color:var(--tcp-red);" onclick="rvDecide(\''+x.id+'\',\'removed\')">&times; Remove</button></span></div>'
        +'<div class="r3-note-t">'+_m2esc(x.raw.msg||'(no text)')+'</div></div>';
    });
    html+='</div>';
  }
  // unmatched bucket
  if(unmatched.length){
    var reps2=(typeof activeReps==='function'?activeReps():(S.reps||[]));
    var groups={};unmatched.forEach(function(x){var k=x.raw.rep||'(blank)';(groups[k]=groups[k]||[]).push(x);});
    html+='<div class="rv-alert rv-alert-unmatched" style="padding:11px 16px;border-bottom:1px solid var(--tcp-line);background:rgba(251,113,133,.05);">'
      +'<div class="dc2-panel-h" style="color:var(--tcp-red);"><span>&#128269; Unmatched rep names &mdash; assign so they get paid ('+Object.keys(groups).length+')</span></div>';
    Object.keys(groups).forEach(function(k){
      html+='<div class="r3-note" style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><div><b>'+_m2esc(k)+'</b> <span class="dc-flat">&middot; '+groups[k].length+' review'+(groups[k].length>1?'s':'')+'</span></div>'
        +'<select class="r3-in" style="margin:0;max-width:200px;" onchange="rvAssignRep(\''+_jsq(k)+'\',this.value)"><option value="">Assign to\u2026</option>'+reps2.map(function(r){return '<option>'+_m2esc(r.name)+'</option>';}).join('')+'</select></div>';
    });
    html+='</div>';
  }
  // filter bar
  html+='<div class="rv-filter-bar" style="padding:12px 16px;border-bottom:1px solid var(--tcp-line);display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    +'<span class="dc2-sl" style="align-self:center;">Viewing</span>'
    +'<select id="rv-yr" class="r3-in" style="margin:0;max-width:100px;" onchange="renderReviewsPage()">'+yrOpts+'</select>'
    +'<select id="rv-q" class="r3-in" style="margin:0;max-width:80px;" onchange="_rvQChange()">'+qOpts+'</select>'
    +'<select id="rv-wk" class="r3-in" style="margin:0;max-width:220px;" onchange="renderReviewsPage()">'+wkOpts+'</select>'
    +'<button class="dc-mini rv-week-btn" onclick="_rvShiftWeek(-1)">&#8592; Previous week</button>'
    +'<button class="dc-mini rv-week-btn" onclick="_rvSyncFiltersToMain();renderReviewsPage()">Match tracker week</button>'
    +'<span class="dc-flat" style="font-size:11px;">'+_rvFmt(range.start)+'\u2013'+_rvFmt(range.end)+', '+f.year+' (Tracker week)</span></div>';
  // stats
  html+='<div class="dc2-stats rv-kpi-grid" style="border-bottom:1px solid var(--tcp-line);">'
    +'<div class="dc2-stat"><div class="dc2-sl">Reviews this week</div><div class="dc2-sv">'+totalRev+'</div><div class="dc2-ss dc-flat">'+payList.length+' rep'+(payList.length!==1?'s':'')+' earning</div></div>'
    +'<div class="dc2-stat"><div class="dc2-sl">Payout this week</div><div class="dc2-sv" style="color:var(--tcp-green);">$'+payTotal+'</div><div class="dc2-ss dc-flat">$'+REVIEW_PAY+' \u00d7 '+(payTotal/REVIEW_PAY)+' paid reviews</div></div>'
    +'<div class="dc2-stat"><div class="dc2-sl">Google</div><div class="dc2-sv" style="color:#00AFEF;">'+gCount+'</div><div class="dc2-ss dc-flat">'+(totalRev?Math.round(gCount/totalRev*100):0)+'% of week</div></div>'
    +'<div class="dc2-stat"><div class="dc2-sl">Trustpilot</div><div class="dc2-sv" style="color:#34D399;">'+tCount+'</div><div class="dc2-ss dc-flat">'+(totalRev?Math.round(tCount/totalRev*100):0)+'% of week</div></div>'
    +'</div>';
  // charts (quick-glance)
  (function(){
    // last 8 ISO weeks ending at selected week
    var wkSeries=[],wkLabels=[];
    var seq=_rvPriorTrackerWeeks(f.year,f.q,f.week,8);
    seq.forEach(function(p){var cnt=_rvActive(all).filter(function(x){return _rvInTrackerRange(x,p);}).length;wkSeries.push(cnt);wkLabels.push('w'+p.week);});
    var gW=wk.filter(function(x){return x.platform==='Google';}).length;
    var tW=wk.filter(function(x){return x.platform==='Trustpilot';}).length;
    var oW=wk.length-gW-tW;
    // rep leaderboard this week (by count, matched)
    var lb={};wk.forEach(function(x){if(x.matched){lb[x.repName]=(lb[x.repName]||0)+1;}});
    var lbArr=Object.keys(lb).map(function(n){return {n:n,c:lb[n]};}).sort(function(a,b){return b.c-a.c;}).slice(0,6);
    var lbMax=lbArr.length?lbArr[0].c:1;
    function bars(vals,labels,color){var max=Math.max.apply(null,vals.concat([1]));return '<div class="dcb">'+vals.map(function(v,i){var h=max>0?Math.max(3,Math.round((v/max)*46)):3;return '<div class="dcb-c"><div class="dcb-v">'+(v>0?v:'')+'</div><div class="dcb-b" style="height:'+h+'px;background:'+color+';opacity:'+(v>0?1:.15)+';"></div><div class="dcb-x">'+labels[i]+'</div></div>';}).join('')+'</div>';}
    var donutTotal=gW+tW+oW;
    var gPct=donutTotal?Math.round(gW/donutTotal*100):0;
    var tPct=donutTotal?Math.round(tW/donutTotal*100):0;
    html+='<div class="dc2-charts rv-chart-grid" style="border-bottom:1px solid var(--tcp-line);">'
      +'<div class="dc2-chart"><div class="dc2-panel-h"><span>Reviews / week (last 8)</span></div>'+bars(wkSeries,wkLabels,'#FBBF24')+'</div>'
      +'<div class="dc2-chart"><div class="dc2-panel-h"><span>Source split (this wk)</span></div>'
        +'<div style="display:flex;flex-direction:column;gap:7px;padding-top:4px;">'
        +'<div><div style="display:flex;justify-content:space-between;font-size:10.5px;margin-bottom:3px;"><span style="color:#00AFEF;font-weight:700;">Google</span><span class="dc-flat">'+gW+' &middot; '+gPct+'%</span></div><div class="dc-prog" style="margin-top:0;"><div class="dc-prog-fill" style="width:'+gPct+'%;background:#00AFEF;"></div></div></div>'
        +'<div><div style="display:flex;justify-content:space-between;font-size:10.5px;margin-bottom:3px;"><span style="color:#34D399;font-weight:700;">Trustpilot</span><span class="dc-flat">'+tW+' &middot; '+tPct+'%</span></div><div class="dc-prog" style="margin-top:0;"><div class="dc-prog-fill" style="width:'+tPct+'%;background:#34D399;"></div></div></div>'
        +(oW>0?'<div><div style="display:flex;justify-content:space-between;font-size:10.5px;margin-bottom:3px;"><span class="dc-flat">Other</span><span class="dc-flat">'+oW+'</span></div><div class="dc-prog" style="margin-top:0;"><div class="dc-prog-fill" style="width:'+(donutTotal?Math.round(oW/donutTotal*100):0)+'%;background:#9AA0B3;"></div></div></div>':'')
        +'</div></div>'
      +'<div class="dc2-chart"><div class="dc2-panel-h"><span>Top reps (this wk)</span></div>'
        +(lbArr.length?('<div style="display:flex;flex-direction:column;gap:6px;padding-top:4px;">'+lbArr.map(function(r){return '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:10.5px;width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_m2esc(r.n.split(' ')[0])+'</span><div style="flex:1;height:8px;background:var(--tcp-panel-2);border-radius:99px;"><div style="height:100%;border-radius:99px;width:'+Math.round(r.c/lbMax*100)+'%;background:linear-gradient(90deg,#FBBF24,#FA873D);"></div></div><span style="font-size:10.5px;font-weight:800;width:16px;text-align:right;">'+r.c+'</span></div>';}).join('')+'</div>'):'<div class="dc-flat" style="padding-top:6px;">No reviews this week.</div>')
      +'</div></div>';
  })();
  // celebration
  if(topEarner){
    html+='<div class="rv-star-card" style="padding:12px 16px;border-bottom:1px solid var(--tcp-line);"><div class="hero-band" style="margin:0;padding:12px 16px;background:linear-gradient(135deg,#B45309,#065F46);">'
      +'<div class="hb-eyebrow" style="color:#FDE68A;">&#127881; Review star of the week</div>'
      +'<div class="hb-title" style="font-size:16px;">'+_m2esc(topEarner.name)+' &mdash; '+topEarner.count+' review'+(topEarner.count>1?'s':'')+' ($'+topEarner.amt+')</div></div></div>';
  }
  // payout table
  html+='<div class="rv-payout-section" style="padding:13px 16px;border-bottom:1px solid var(--tcp-line);">'
    +'<div class="dc2-panel-h"><span>&#128176; Weekly payout \u2014 submit to payroll</span>'
    +(payList.length?'<button class="dc2-act" onclick="rvCopyPayout()">&#128203; Copy for payroll</button>':'')+'</div>'
    +(payList.length?('<table class="r3-tbl"><thead><tr><th style="text-align:left;">Rep</th><th>Reviews</th><th>Amount</th></tr></thead><tbody>'
      +payList.map(function(r){return '<tr><td style="text-align:left;font-weight:700;">'+_m2esc(r.name)+'</td><td>'+r.count+'</td><td style="font-weight:800;color:var(--tcp-green);">$'+r.amt+'</td></tr>';}).join('')
      +'<tr style="border-top:2px solid var(--tcp-line-strong);"><td style="text-align:left;font-weight:800;">TOTAL</td><td style="font-weight:800;">'+(payTotal/REVIEW_PAY)+'</td><td style="font-weight:900;color:var(--tcp-green);">$'+payTotal+'</td></tr>'
      +'</tbody></table>'):'<div class="dc-flat" style="padding:6px 0;">No paid reviews for this week yet.</div>')
    +'</div>';
  // reviews grouped by rep
  var byRep={};wk.forEach(function(x){var k=x.matched?x.repName:x.repDisplay;(byRep[k]=byRep[k]||[]).push(x);});
  html+='<div class="rv-review-section" style="padding:13px 16px;"><div class="dc2-panel-h"><span>Reviews this week \u2014 grouped by rep</span></div>';
  var repKeys=Object.keys(byRep).sort(function(a,b){return byRep[b].length-byRep[a].length;});
  if(!repKeys.length)html+='<div class="dc-flat" style="padding:6px 0;">No reviews land in this week.</div>';
  repKeys.forEach(function(k){
    html+='<div class="rv-rep-group" style="margin:0 0 10px;"><div style="font-size:12px;font-weight:800;color:var(--tcp-text);margin-bottom:5px;">'+_m2esc(k)+' <span class="dc-flat" style="font-weight:400;">&middot; '+byRep[k].length+'</span></div>';
    byRep[k].forEach(function(x){
      var pc=x.platform==='Google'?'#00AFEF':x.platform==='Trustpilot'?'#34D399':'#9AA0B3';
      var _rvReps=(typeof activeReps==='function'?activeReps():(S.reps||[]));var _rvEff=((S.reviews.repFix||{})[x.id]!==undefined)?S.reviews.repFix[x.id]:(x.matched?x.repName:'');var _rvOpts='<option value="__auto">\u2014 from source \u2014</option><option value=""'+(_rvEff===''?' selected':'')+'>(no name)</option>'+_rvReps.map(function(_r){return '<option value="'+_m2esc(_r.name)+'"'+(_rvEff===_r.name?' selected':'')+'>'+_m2esc(_r.name)+'</option>';}).join('');html+='<div class="r3-note"><div class="r3-note-h"><span><span class="r3-pill" style="background:transparent;border:1px solid '+pc+';color:'+pc+';">'+x.platform+'</span> '+_stars(x.raw.stars)+(x.raw.custName?' <span class="dc-flat">&middot; '+_m2esc(x.raw.custName)+'</span>':'')+(!x.pays?' <span class="dc-flat">&middot; no pay</span>':'')+'</span><span style="display:flex;align-items:center;gap:8px;"><span class="dc-flat" style="font-size:10px;">'+_m2esc(String(x.raw.ts).slice(0,10))+'</span><button class="rv-edit-pencil" title="Change / assign rep" onclick="var w=this.closest(\'.r3-note\').querySelector(\'.rv-pick-wrap\');w.style.display=w.style.display===\'none\'?\'flex\':\'none\';">\u270F\uFE0F</button></span></div>'
        +(x.raw.msg?'<div class="r3-note-t">'+_m2esc(x.raw.msg)+'</div>':'')+'<div class="rv-pick-wrap" style="display:none;align-items:center;gap:7px;margin-top:7px;"><span class="dc-flat" style="font-size:10px;">Rep:</span><select class="rv-rep-pick" data-rid="'+_m2esc(x.id)+'" onchange="rvSetReviewRep(this.getAttribute(\'data-rid\'),this.value)">'+_rvOpts+'</select></div>'+'</div>';
    });
    html+='</div>';
  });
  html+='</div></div>';
  host.innerHTML=html;
}
function _stars(n){n=Math.round(Number(n)||0);var s='';for(var i=0;i<5;i++)s+=(i<n?'\u2605':'\u2606');return '<span style="color:#FBBF24;letter-spacing:1px;">'+s+'</span>';}
function _jsq(s){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
function _qFromWeek(year,week){var r=_rvWeekRange(year,week);var m=r.start.getUTCMonth();return m<=2?'Q1':m<=5?'Q2':m<=8?'Q3':'Q4';}
function _rvQChange(){var w=_rvSel('rv-wk'),y=_rvSel('rv-yr'),q=_rvSel('rv-q');if(w&&y&&q){var old=Number(w.value)||0,nums=_rvWeeksForQ(parseInt(y.value,10),q.value);w.innerHTML=nums.map(function(n){var r=_rvTrackerWeekObj(parseInt(y.value,10),q.value,n);return '<option value="'+n+'">'+(r.label||('Wk '+n+': '+_rvFmt(r.start)+'\u2013'+_rvFmt(r.end)))+'</option>';}).join('');w.value=String(nums.indexOf(old)>=0?old:(nums.length?nums[nums.length-1]:''));}renderReviewsPage();}
function rvCopyPayout(){
  var all=_rvEnriched(),f=_rvCurrentFilter(),range=_rvTrackerWeekObj(f.year,f.q,f.week);
  var wk=_rvActive(all).filter(function(x){return _rvInTrackerRange(x,range)&&x.pays&&x.matched;});
  var pay={};wk.forEach(function(x){pay[x.repName]=(pay[x.repName]||0)+1;});
  var lines=['Review payout \u2014 Wk '+f.week+' ('+_rvFmt(range.start)+'\u2013'+_rvFmt(range.end)+', '+f.year+')',''];
  var tot=0;Object.keys(pay).sort().forEach(function(n){var amt=pay[n]*REVIEW_PAY;tot+=amt;lines.push(n+'\t$'+amt+'\t('+pay[n]+' review'+(pay[n]>1?'s':'')+')');});
  lines.push('','TOTAL\t$'+tot);
  var txt=lines.join('\n');
  try{navigator.clipboard.writeText(txt);var s=document.getElementById('rv-status');if(s){s.textContent='\u2713 Payout copied to clipboard';}}catch(e){prompt('Copy the payout:',txt);}
}
/* manager report hook: 2 reviews for a given week key range (from meeting engine) */
function reviewsForReport(startDate,endDate){
  try{
    _rvEnsure();
    var all=_rvActive(_rvEnriched());
    var inWin=all.filter(function(x){return x.date&&x.date>=startDate&&x.date<=endDate&&x.matched;});
    function pick(platform,needText){var pool=inWin.filter(function(x){return x.platform===platform&&(!needText||(x.raw.msg&&x.raw.msg.length>3));});return pool[0]||null;}
    var g=pick('Google',true)||pick('Google',false);
    var t=pick('Trustpilot',true)||pick('Trustpilot',false);
    var withText=inWin.filter(function(x){return x.raw.msg&&x.raw.msg.length>3;});
    if(!g&&!t){ // nothing at all
      if(!inWin.length)return null;
    }
    if(!g)g=t||withText[0]||inWin[0];
    if(!t)t=g;
    // ensure at least one has text if any text exists
    if(withText.length){if(!(g&&g.raw.msg)&&!(t&&t.raw.msg)){g=withText[0];}}
    var out=[g,t].filter(Boolean).slice(0,2).map(function(x){return {rep:x.repName,stars:Math.round(Number(x.raw.stars)||0),platform:x.platform,text:x.raw.msg||'',customer:x.raw.custName||''};});
    return out.length?out:null;
  }catch(e){return null;}
}
window.rvRefresh=rvRefresh;window.rvDecide=rvDecide;window.rvAssignRep=rvAssignRep;window.rvSetReviewRep=rvSetReviewRep;window.renderReviewsPage=renderReviewsPage;window.rvCopyPayout=rvCopyPayout;window._rvQChange=_rvQChange;window._rvShiftWeek=_rvShiftWeek;window._rvSyncFiltersToMain=_rvSyncFiltersToMain;window.reviewsForReport=reviewsForReport;
window.addEventListener('load',function(){
  setTimeout(function(){try{_rvEnsure();var u=(S.reviews&&S.reviews.url);if(u){var el=document.getElementById('rv-url');if(el)el.value=u;rvRefresh(true);}}catch(e){}},2600);
});
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;
  var oc=b.getAttribute('onclick')||'';
  if(oc.indexOf("gt('reviews'")>=0)setTimeout(function(){try{_rvSyncFiltersToMain();renderReviewsPage();}catch(_e){}},80);
});
document.addEventListener('change',function(e){
  var id=e.target&&e.target.id;
  if(['selYr','selQ','selM','selW'].indexOf(id)>=0&&document.getElementById('pg-reviews')&&document.getElementById('pg-reviews').classList.contains('active')){
    setTimeout(function(){try{_rvSyncFiltersToMain();renderReviewsPage();}catch(_e){}},30);
  }
});

/* ===== MODULE: PHASE10-CUSTOMERS (customer intelligence: log, harvest, statuses) ===== */
function _custEnsure(){if(!S.customers||!Array.isArray(S.customers))S.customers=[];}
function _custISO(d){
  if(!d)return '';
  if(d instanceof Date&&!isNaN(d)){function p(x){return (x<10?'0':'')+x;}return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
  var s=String(d);if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  var t=new Date(s);return isNaN(t)?'':_custISO(t);
}
function _custDays(iso){if(!iso)return null;var t=new Date(iso+'T12:00:00');return isNaN(t)?null:Math.floor((Date.now()-t)/86400000);}
function _custStatus(cu){
  var fd2=_custDays(cu.firstOrder),ld=_custDays(cu.lastOrder);
  if(cu.reactivated&&_custDays(cu.reactivated)!=null&&_custDays(cu.reactivated)<=90)return {k:'react',label:'Reactivated',col:'#00AFEF'};
  if(fd2!=null&&fd2<=60)return {k:'new',label:'New',col:'#FA873D'};
  if(ld==null)return {k:'unknown',label:'\u2014',col:'#9AA0B3'};
  if(ld<60)return {k:'active',label:'Active',col:'#34D399'};
  if(ld<120)return {k:'cool',label:'Cooling',col:'#FBBF24'};
  return {k:'dormant',label:'Dormant',col:'#FB7185'};
}
function custUpsert(name,rep,dateISO,amount,note,src){
  _custEnsure();
  name=String(name||'').trim();if(!name)return null;
  var key=name.toLowerCase();
  var cu=S.customers.find(function(x){return String(x.name||'').toLowerCase()===key;});
  amount=Number(amount)||0;
  if(cu){
    var gap=null;
    if(cu.lastOrder&&dateISO&&dateISO>cu.lastOrder){
      gap=Math.floor((new Date(dateISO)-new Date(cu.lastOrder))/86400000);
      if(gap>90)cu.reactivated=dateISO;
      cu.lastOrder=dateISO;
    }else if(dateISO&&(!cu.lastOrder||dateISO>cu.lastOrder))cu.lastOrder=dateISO;
    if(dateISO&&(!cu.firstOrder||dateISO<cu.firstOrder))cu.firstOrder=dateISO;
    cu.orders=(cu.orders||0)+1;
    cu.revenue=(Number(cu.revenue)||0)+amount;
    if(rep)cu.rep=rep;
    if(note)cu.notes=((cu.notes||'')+(cu.notes?'\n':'')+note);
  }else{
    cu={id:Date.now()+Math.floor(Math.random()*999),name:name,rep:rep||'',firstOrder:dateISO||'',lastOrder:dateISO||'',orders:1,revenue:amount,notes:note||'',src:src||'manual'};
    S.customers.push(cu);
  }
  try{markDirty();}catch(e){}
  return cu;
}
function custHarvest(){
  _custEnsure();
  var seen={};try{(JSON.parse(localStorage.getItem('tcp_cust_harvested')||'[]')||[]).forEach(function(k){seen[k]=1;});}catch(e){}
  var added=0,updated=0;
  try{
    YEARS.forEach(function(yr){QTRS.forEach(function(q){
      (gwq(yr,q)||[]).forEach(function(w){
        activeReps().forEach(function(r){
          var d=gd(r.name+'|'+w.key);
          var cn=String((d&&d.topSaleCustomer)||'').trim();
          if(!cn||!Number(d.topSale||0))return;
          var mk='ts|'+r.name+'|'+w.key;
          if(seen[mk])return;
          var before=S.customers.length;
          custUpsert(cn,r.name,_custISO(w.end),Number(d.topSale)||0,'','harvest');
          seen[mk]=1;(S.customers.length>before)?added++:updated++;
        });
      });
    });});
  }catch(e){console.warn('harvest weeks:',e);}
  try{
    (S.cms||[]).forEach(function(cm){
      var cn=String(cm.custName||'').trim();if(!cn)return;
      var mk='cm|'+cm.id;if(seen[mk])return;
      var key=cn.toLowerCase();
      var cu=S.customers.find(function(x){return String(x.name||'').toLowerCase()===key;});
      if(!cu){S.customers.push({id:Date.now()+Math.floor(Math.random()*999),name:cn,rep:cm.rep||'',firstOrder:'',lastOrder:'',orders:0,revenue:0,notes:'',src:'credit-memo'});added++;}
      seen[mk]=1;
    });
    try{markDirty();}catch(e){}
  }catch(e){console.warn('harvest cms:',e);}
  try{localStorage.setItem('tcp_cust_harvested',JSON.stringify(Object.keys(seen)));}catch(e){}
  return {added:added,updated:updated};
}
function custLogFromForm(){
  var n=(document.getElementById('cu-name')||{}).value||'';
  var rp=(document.getElementById('cu-rep')||{}).value||'';
  var dt=(document.getElementById('cu-date')||{}).value||_dcToday();
  var am=(document.getElementById('cu-amt')||{}).value||'';
  var nt=(document.getElementById('cu-note')||{}).value||'';
  if(!String(n).trim()){alert('Customer name first.');return;}
  var before=(S.customers||[]).length;
  _custEnsure();
  var cu=custUpsert(n,rp,dt,am,nt,'manual');
  var isNew=S.customers.length>before;
  renderCustomersPage();
  var msg=document.getElementById('cu-msg');
  if(msg){msg.textContent=isNew?('\u2713 '+cu.name+' added as a NEW customer'):('\u2713 Order logged for '+cu.name+(cu.reactivated===dt?' \u2014 REACTIVATED after a 90+ day gap!':''));msg.style.display='inline';setTimeout(function(){msg.style.display='none';},3500);}
}
function custDelete(id){
  _custEnsure();
  var cu=S.customers.find(function(x){return x.id===id;});
  if(!cu)return;
  if(!confirm('Remove '+cu.name+' from the customer book? (Does not touch any sales data.)'))return;
  S.customers=S.customers.filter(function(x){return x.id!==id;});
  try{markDirty();}catch(e){}
  renderCustomersPage();
}
function renderCustomersPage(){
  var host=document.getElementById('cust-page');if(!host)return;
  _custEnsure();
  var importMeta=null;
  try{importMeta=JSON.parse(localStorage.getItem('_tcp_customer_import_v523')||'null');}catch(_cuimpMetaErr){}
  var importSummary=importMeta
   ?('<div id="cuimp-summary" class="cuimp-summary"><div><strong>Customer spreadsheet synced</strong><br><span>'+_m2esc(importMeta.fileName||'Spreadsheet')+' · '+Number(importMeta.imported||0).toLocaleString()+' customers · '+_m2esc(importMeta.reps||'')+'</span></div><span>Imported '+_m2esc(importMeta.importedAt?new Date(importMeta.importedAt).toLocaleString():'')+' · reps see updates after Refresh Data</span></div>')
   :('<div id="cuimp-summary" class="cuimp-summary" style="border-color:rgba(250,135,61,.22);background:rgba(250,135,61,.045)"><div><strong style="color:#b7b0ff">Customer set has not been imported</strong><br><span>Upload the customer spreadsheet first so Account IDs, customer ownership, loyalty, contacts, and sales snapshots can flow into each rep portal.</span></div><span>Required before line-item orders can map automatically</span></div>');
  var list=S.customers.slice();
  var qy=((document.getElementById('cu-search')||{}).value||'').toLowerCase().trim();
  var reps=activeReps();
  var newC=list.filter(function(c){return _custStatus(c).k==='new';});
  var reactC=list.filter(function(c){return _custStatus(c).k==='react';});
  var coolC=list.filter(function(c){var s=_custStatus(c);return (s.k==='cool')&&(c.orders||0)>=2;});
  var byRepNew={};newC.forEach(function(c){if(c.rep)byRepNew[c.rep]=(byRepNew[c.rep]||0)+1;});
  var repLine=Object.keys(byRepNew).sort(function(a,b){return byRepNew[b]-byRepNew[a];}).slice(0,4).map(function(r){return r.split(' ')[0]+' ('+byRepNew[r]+')';}).join(', ');
  function sCell(l,v,s2){return '<div class="dc2-stat"><div class="dc2-sl">'+l+'</div><div class="dc2-sv" style="font-size:19px;">'+v+'</div><div class="dc2-ss dc-flat">'+(s2||'')+'</div></div>';}
  var shown=qy?list.filter(function(c){return String(c.name).toLowerCase().indexOf(qy)>=0||String(c.rep||'').toLowerCase().indexOf(qy)>=0;}):list;
  shown.sort(function(a,b){return String(b.lastOrder||'').localeCompare(String(a.lastOrder||''));});
  var rows=shown.slice(0,200).map(function(c){
    var st=_custStatus(c);
    return '<tr><td style="text-align:left;font-weight:700;">'+_m2esc(c.name)+(c.notes?' <span class="dc-flat" title="'+_m2esc(c.notes)+'">&#128221;</span>':'')+'</td>'
      +'<td style="text-align:left;">'+_m2esc((c.rep||'').split(' ')[0])+'</td>'
      +'<td>'+(c.firstOrder||'&mdash;')+'</td><td>'+(c.lastOrder||'&mdash;')+'</td>'
      +'<td>'+(c.orders||0)+'</td><td>$'+Math.round(c.revenue||0).toLocaleString()+'</td>'
      +'<td><span class="r3-pill" style="background:transparent;border:1px solid '+st.col+';color:'+st.col+';">'+st.label+'</span></td>'
      +'<td><button class="dc-mini" onclick="custDelete('+c.id+')">&times;</button></td></tr>';
  }).join('');
  host.innerHTML='<div class="r3-shell">'
    +'<div class="r3-head"><span class="r3-av" style="background:linear-gradient(135deg,#00AFEF,#34D399);">&#127970;</span>'
    +'<div class="r3-hmeta"><div class="r3-name">Customer intelligence</div><div class="r3-sub">'+list.length+' customers tracked &middot; where the sales are coming from</div></div>'
    +'<div class="r3-hactions"><button id="cuimp-upload-btn" class="dc2-act" style="border-color:#5DCAA5;color:#8BE0BF" onclick="custImportChoose()">⬆ Upload customer spreadsheet</button><button class="dc2-act" onclick="downloadCustomerImportTemplate()">⬇ Download import template</button><button class="dc2-act" onclick="var r=custHarvest();renderCustomersPage();alert(\'Scan complete: \'+r.added+\' new customers found, \'+r.updated+\' orders added from existing tracker data.\')">&#128269; Scan legacy tracker data</button><input id="cuimp-file" type="file" accept=".csv,.xlsx,.xls" style="display:none" onchange="custImportRead(this)"></div></div>'
    +importSummary
    +'<div class="dc2-stats" style="border-bottom:1px solid var(--tcp-line);">'
    +sCell('New (60d)',String(newC.length),repLine||'by first order date')
    +sCell('Reactivated',String(reactC.length),'came back after 90+ days')
    +sCell('Going quiet',String(coolC.length),'repeat buyers, 60+ days silent')
    +sCell('Book value','$'+Math.round(list.reduce(function(s,c){return s+(Number(c.revenue)||0);},0)).toLocaleString(),'tracked revenue')
    +'</div>'
    +'<div style="padding:13px 18px;border-bottom:1px solid var(--tcp-line);">'
    +'<div class="dc2-panel-h"><span>Log an order / new customer</span><span id="cu-msg" class="dc-up" style="display:none;font-size:11px;text-transform:none;letter-spacing:0;"></span></div>'
    +'<div style="display:grid;grid-template-columns:2fr 1.2fr 1fr 1fr;gap:8px;">'
    +'<input id="cu-name" class="r3-in" style="margin:0;" placeholder="Customer name">'
    +'<select id="cu-rep" class="r3-in" style="margin:0;"><option value="">Rep\u2026</option>'+reps.map(function(r){return '<option>'+_m2esc(r.name)+'</option>';}).join('')+'</select>'
    +'<input id="cu-date" type="date" class="r3-in" style="margin:0;" value="'+_dcToday()+'">'
    +'<input id="cu-amt" class="r3-in" style="margin:0;" placeholder="$ (optional)" inputmode="decimal">'
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-top:8px;"><input id="cu-note" class="r3-in" style="margin:0;flex:1;" placeholder="Note (optional)"><button class="dc2-act" style="border-color:var(--tcp-accent);" onclick="custLogFromForm()">&#43; Log</button></div>'
    +'</div>'
    +'<div style="padding:12px 18px;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;"><div class="dc2-panel-h" style="margin:0;"><span>Customer book</span></div><input id="cu-search" class="r3-in" style="margin:0;max-width:220px;" placeholder="Search\u2026" oninput="renderCustomersPage()"></div>'
    +(shown.length?('<table class="r3-tbl"><thead><tr><th style="text-align:left;">Customer</th><th style="text-align:left;">Rep</th><th>First order</th><th>Last order</th><th>Orders</th><th>Revenue</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+(shown.length>200?'<div class="dc-flat" style="font-size:10.5px;margin-top:6px;">Showing 200 of '+shown.length+'</div>':'')):'<div class="dc-flat" style="padding:8px 0;">No customers yet. Start with <b>Upload customer spreadsheet</b>. That file establishes the customer ID and assigned rep used by the line-item order importer.</div>')
    +'</div></div>';
  var srch=document.getElementById('cu-search');
  if(srch&&qy){srch.value=qy;srch.focus();try{srch.setSelectionRange(qy.length,qy.length);}catch(e){}}
}
window.custUpsert=custUpsert;window.custHarvest=custHarvest;window.custLogFromForm=custLogFromForm;window.custDelete=custDelete;window.renderCustomersPage=renderCustomersPage;
window.addEventListener('load',function(){setTimeout(function(){try{_custEnsure();}catch(e){}},500);});
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;
  var oc=b.getAttribute('onclick')||'';
  if(oc.indexOf("gt('customers'")>=0)setTimeout(function(){try{renderCustomersPage();}catch(_e){}},80);
});

/* ===== MODULE: PHASE8-DATASAFETY (backup freshness + daily auto-snapshot + rollback) ===== */
function _dsLastBackup(){var t=0;try{t=Number(localStorage.getItem('tcp_last_backup_ts')||0);}catch(e){}return t;}
function _dsDaysSince(ts){return ts>0?Math.floor((Date.now()-ts)/86400000):null;}
function dsBackupNow(){
  try{exportAllData();localStorage.setItem('tcp_last_backup_ts',String(Date.now()));}catch(e){alert('Backup failed: '+((e&&e.message)||e));}
  setTimeout(function(){try{renderDataSafety();renderDashCockpit();}catch(e){}},400);
}
function _dsSnapshot(){
  try{
    var today=_dcToday();
    var meta=null;try{meta=JSON.parse(localStorage.getItem('tcp_autosnap_meta')||'null');}catch(e){}
    if(meta&&meta.date===today)return; // one per day, taken before today's edits
    var raw=localStorage.getItem(STORE_KEY);
    if(!raw)return;
    localStorage.setItem('tcp_autosnap',raw);
    localStorage.setItem('tcp_autosnap_meta',JSON.stringify({date:today,bytes:raw.length,taken:new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}));
  }catch(e){console.warn('autosnap:',e);/* quota or storage blocked — non-fatal */}
}
function dsRestoreSnapshot(){
  var meta=null;try{meta=JSON.parse(localStorage.getItem('tcp_autosnap_meta')||'null');}catch(e){}
  var snap=null;try{snap=localStorage.getItem('tcp_autosnap');}catch(e){}
  if(!snap){alert('No auto-snapshot available yet. One is taken automatically each day when the app first opens.');return;}
  var ok=confirm('RESTORE SNAPSHOT:\n\nThis will replace your CURRENT tracker data with the snapshot taken '+(meta?meta.taken:'earlier')+' (start of that day).\n\nAnything entered since then will be lost. A backup download is strongly recommended first.\n\nContinue?');
  if(!ok)return;
  try{
    localStorage.setItem(STORE_KEY,snap);
    alert('Snapshot restored. The app will reload now.');
    location.reload();
  }catch(e){alert('Restore failed: '+((e&&e.message)||e));}
}
function renderDataSafety(){
  var host=document.getElementById('ds-panel');if(!host)return;
  var ts=_dsLastBackup(),days=_dsDaysSince(ts);
  var meta=null;try{meta=JSON.parse(localStorage.getItem('tcp_autosnap_meta')||'null');}catch(e){}
  var bCol=days==null?'var(--tcp-red)':days<=7?'var(--tcp-green)':days<=14?'var(--tcp-gold)':'var(--tcp-red)';
  var bTxt=days==null?'No backup downloaded yet':(days===0?'Backed up today':days+' day'+(days>1?'s':'')+' since last backup');
  host.innerHTML='<div class="r3-shell" style="margin:0 0 14px;">'
    +'<div class="r3-head" style="padding:12px 16px;"><span class="r3-av" style="background:linear-gradient(135deg,#34D399,#FA873D);width:32px;height:32px;font-size:15px;">&#128737;&#65039;</span>'
    +'<div class="r3-hmeta"><div class="r3-name" style="font-size:13.5px;">Data safety</div><div class="r3-sub">Everything lives in THIS browser\u2019s storage \u2014 backups are your insurance.</div></div></div>'
    +'<div class="dc2-stats" style="grid-template-columns:1fr 1fr;border-bottom:1px solid var(--tcp-line);">'
    +'<div class="dc2-stat"><div class="dc2-sl">Backup file</div><div class="dc2-sv" style="font-size:15px;color:'+bCol+';">'+bTxt+'</div><div class="dc2-ss dc-flat">'+(ts>0?new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'download one now')+'</div></div>'
    +'<div class="dc2-stat"><div class="dc2-sl">Daily auto-snapshot</div><div class="dc2-sv" style="font-size:15px;">'+(meta?'&#10003; '+_m2esc(meta.taken):'&mdash;')+'</div><div class="dc2-ss dc-flat">'+(meta?Math.round(meta.bytes/1024)+' KB &middot; in-browser rollback point':'taken automatically each morning')+'</div></div>'
    +'</div>'
    +'<div style="padding:12px 16px;display:flex;gap:8px;flex-wrap:wrap;">'
    +'<button class="dc2-act" style="border-color:var(--tcp-accent);" onclick="dsBackupNow()">&#128190; Download backup now</button>'
    +'<button class="dc2-act" onclick="dsRestoreSnapshot()">&#8617;&#65039; Restore this morning\u2019s snapshot</button>'
    +'<label class="dc2-act" style="cursor:pointer;">&#128194; Restore from backup file<input type="file" accept=".json,application/json" style="display:none;" onchange="importAllData(this)"></label>'
    +'</div>'
    +'<div class="dc-flat" style="font-size:10px;padding:0 16px 12px;line-height:1.6;">The auto-snapshot protects against a bad data-entry day (one-click rollback to how things looked this morning). The backup file protects against browser wipes, computer changes, and everything else \u2014 keep a recent one somewhere safe (email it to yourself, drop it in Drive). Reminder chips appear on the Dashboard when a backup is overdue.</div>'
    +'</div>';
}
function renderAIConn(){
  var host=document.getElementById('ai-conn');if(!host)return;
  var proxy='';try{proxy=(localStorage.getItem('tcp_ai_proxy_url')||'').trim();}catch(e){}
  var hasKey=false;try{hasKey=!!(typeof getAPIKey==='function'&&getAPIKey());}catch(e){}
  var mode=proxy?'Proxy (key stays server-side) — recommended':(hasKey?'Direct key in this browser':'Not configured');
  var mCol=proxy?'var(--tcp-green)':(hasKey?'var(--tcp-gold)':'var(--tcp-red)');
  host.innerHTML='<div class="r3-shell" style="margin:0 0 14px;">'
    +'<div class="r3-head" style="padding:12px 16px;"><span class="r3-av" style="background:linear-gradient(135deg,#FA873D,#FB7185);width:32px;height:32px;font-size:15px;">&#128273;</span>'
    +'<div class="r3-hmeta"><div class="r3-name" style="font-size:13.5px;">AI connection</div><div class="r3-sub">Mode: <span style="color:'+mCol+';font-weight:800;">'+mode+'</span></div></div>'
    +'<div class="r3-hactions"><button class="dc-mini" onclick="aiConnTest()">Test connection</button><span id="ai-conn-st" class="dc-flat" style="font-size:10.5px;"></span></div></div>'
    +'<div style="padding:12px 16px;">'
    +'<div class="dc2-panel-h"><span>Proxy URL (Cloudflare/Netlify worker that injects the API key)</span></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;"><input id="ai-proxy-in" class="r3-in" style="flex:1;min-width:220px;margin:0;" placeholder="https://your-proxy.workers.dev/v1/messages" value="'+_m2esc(proxy)+'">'
    +'<button class="dc2-act" onclick="aiConnSave()">Save</button>'
    +(proxy?'<button class="dc2-act" onclick="aiConnClear()">Use direct key instead</button>':'')+'</div>'
    +'<div class="dc-flat" style="font-size:10px;margin-top:9px;line-height:1.6;">With a proxy set, this app sends AI requests to YOUR proxy and never handles the API key in the browser — the safe setup. Once the proxy works: 1) create a fresh key at console.anthropic.com, 2) put it in the proxy’s environment settings, 3) <b>revoke the old key</b> (it has been exposed in past file shares), 4) clear the direct key from Data Entry.</div>'
    +'</div></div>';
}
function aiConnSave(){
  var v=((document.getElementById('ai-proxy-in')||{}).value||'').trim();
  if(v&&!/^https:\/\//.test(v)){alert('Proxy URL must start with https://');return;}
  try{if(v)localStorage.setItem('tcp_ai_proxy_url',v);else localStorage.removeItem('tcp_ai_proxy_url');}catch(e){}
  renderAIConn();
}
function aiConnClear(){try{localStorage.removeItem('tcp_ai_proxy_url');}catch(e){}renderAIConn();}
async function aiConnTest(){
  var st=document.getElementById('ai-conn-st');if(st)st.textContent='Testing\u2026';
  try{
    var r=await callAI('Reply with exactly: OK',{maxTokens:10,skipCompanyContext:true});
    if(st)st.textContent=/OK/i.test(String(r))?'\u2713 Working':'\u2713 Responded';
    if(st)st.style.color='var(--tcp-green)';
  }catch(e){
    if(st){st.textContent='\u2717 '+String((e&&e.message)||e).slice(0,60);st.style.color='var(--tcp-red)';}
  }
}
window.renderAIConn=renderAIConn;window.aiConnSave=aiConnSave;window.aiConnClear=aiConnClear;window.aiConnTest=aiConnTest;
window.dsBackupNow=dsBackupNow;window.dsRestoreSnapshot=dsRestoreSnapshot;window.renderDataSafety=renderDataSafety;
window.addEventListener('load',function(){
  setTimeout(function(){try{_dsSnapshot();}catch(e){}try{renderDataSafety();}catch(e){}try{renderAIConn();}catch(e){}},900);
});
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;
  var oc=b.getAttribute('onclick')||'';
  if(oc.indexOf("gt('admin'")>=0)setTimeout(function(){try{renderDataSafety();renderAIConn();}catch(_e){}},100);
});

/* ===== MODULE: PHASE7-ONEONONE (printable coaching packet per rep) ===== */
async function buildOneOnOnePacket(repName){
  var w=window.open('','_blank');
  if(w){w.document.write('<!doctype html><meta charset="utf-8"><title>1-on-1 packet</title><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:44px;color:#555;background:#fff;font-size:15px;">Building '+String(repName).replace(/</g,'&lt;')+'&#8217;s 1-on-1 packet&hellip;</body>');w.document.close();}
  try{
    var E=_r360Engine();
    if(!E){if(w)w.document.body.innerHTML='No weekly data available to build a packet.';return;}
    var R=E.reps.find(function(x){return x.name===repName;});
    if(!R){if(w)w.document.body.innerHTML='Rep not found in the current data.';return;}
    var esc=_m2esc,fn=repName.split(' ')[0];
    var rank=E.byWk.findIndex(function(x){return x.name===repName;})+1;
    var score=_r360Score(repName,E.yr,E.q);
    // AI celebrate/coach (reuse weekly cache; fetch if absent)
    var insight=null;
    try{
      var cache=JSON.parse(localStorage.getItem('tcp_rep_insight')||'null');
      if(cache&&cache.wk===E.prev.key&&cache.reps&&cache.reps[repName])insight=cache.reps[repName];
    }catch(e){}
    if(!insight){
      try{
        var teamAvgWk=E.reps.length>0?E.team.wkRev/E.reps.length:0;
        var covP0=R.setSize>0?Math.round(R.accts/R.setSize*100):null;
        var p='You are a sales manager\u2019s coaching assistant at Triple Crown Products (custom apparel). One rep, one completed week. Be specific, use the numbers, no filler.\n'
          +'Rep: '+repName+' \u2014 '+E.prev.label+' '+E.yr+' (week '+E.weeksCompleted+' of '+E.qtdWeeks.length+(E.earlyQuarter?', EARLY quarter: no failure framing on pace':'')+').\n'
          +'Week: $'+Math.round(R.wkRev).toLocaleString()+' rev, '+R.wkOrders+' orders, '+R.wkCalls+' calls. Rank #'+rank+' of '+E.reps.length+' (team avg $'+Math.round(teamAvgWk).toLocaleString()+'/rep).\n'
          +'Prior week: '+(R.pwRev!=null?'$'+Math.round(R.pwRev).toLocaleString():'n/a')+'. QTD $'+Math.round(R.qtdRev).toLocaleString()+(R.goalRev>0?' vs $'+Math.round(R.goalRev).toLocaleString()+' goal':'')+'. YTD $'+Math.round(R.ytdRev).toLocaleString()+'.\n'
          +'Top sale: '+(R.topSale>0?'$'+Math.round(R.topSale).toLocaleString()+(R.topSaleCustomer?' ('+R.topSaleCustomer+')':''):'none')+'. Coverage: '+(covP0!=null?covP0+'%':'n/a')+'. Art: '+R.art+' wk/'+R.qtdArt+' QTD. Credits: $'+Math.round(R.credits).toLocaleString()+(_ordHasData()?(function(){var _o=_ordRepStat(repName,yr,q);return '. Orders (QTD): $'+Math.round(_o.sales).toLocaleString()+' across '+Math.round(_o.orders||0)+' orders, $'+Math.round(_o.aov||0).toLocaleString()+' avg, '+Math.round(_o.newCust||0)+' new'+(_o.rank?(', rank #'+_o.rank+'/'+_o.of):'')+'.';})():'')+' wk.\n'
          +'Return ONLY JSON, no fences: {"celebrate":["2-3 bullets, max 18 words each"],"coach":["2-3 bullets, max 18 words each \u2014 what to work on and how"]}';
        var raw=await callAI(p,{maxTokens:600,skipCompanyContext:true});
        raw=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').trim();
        var a2=raw.indexOf('{'),b2=raw.lastIndexOf('}');
        insight=JSON.parse(raw.slice(a2,b2+1));
        try{var c2=JSON.parse(localStorage.getItem('tcp_rep_insight')||'null')||{wk:E.prev.key,reps:{}};if(c2.wk!==E.prev.key)c2={wk:E.prev.key,reps:{}};c2.reps[repName]=insight;localStorage.setItem('tcp_rep_insight',JSON.stringify(c2));}catch(e){}
      }catch(e){insight=null;}
    }
    // flags
    var flags=[];
    var paced=R.goalRev*(E.weeksCompleted/E.qtdWeeks.length);
    if(E.weeksCompleted>=4&&R.goalRev>0&&R.qtdRev<paced*0.7)flags.push('Under 70% of paced quarter goal');
    var ravg=E.weeksCompleted>1?(R.qtdRev/E.weeksCompleted):0;
    if(ravg>1000&&R.wkRev<ravg*0.5&&R.wkRev>0)flags.push('Revenue dip vs personal average ($'+Math.round(ravg).toLocaleString()+'/wk)');
    if(R.wkCalls===0&&(R.wkRev>0||R.wkOrders>0))flags.push('Zero calls logged in '+_dcWkShort(E.prev));
    if(R.art>=3)flags.push(R.art+' art errors in '+_dcWkShort(E.prev));
    if(R.credits>0)flags.push('$'+Math.round(R.credits).toLocaleString()+' rep-fault credits in '+_dcWkShort(E.prev));
    // coaching log + quality
    var notes=(S.coachingNotes||[]).filter(function(n){return n.rep===repName;}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).slice(0,5);
    var artsQ=(S.artErrors||[]).filter(function(a){return a.rep===repName&&String(a.yr)===String(E.yr)&&a.q===E.q;});
    var credsQ=(S.cms||[]).filter(function(cm){return cm.rep===repName&&cm.fault==='rep'&&String(cm.yr)===String(E.yr)&&cm.q===E.q;});
    var credQ$=credsQ.reduce(function(s,cm){return s+Number(cm.amount||0);},0);
    var cov=R.setSize>0?Math.round(R.accts/R.setSize*100):null;
    var qtdPct=R.goalRev>0?Math.round(R.qtdRev/R.goalRev*100):0;
    function kcell(l,v,s2){return '<div class="k"><div class="kl">'+l+'</div><div class="kv">'+v+'</div>'+(s2?'<div class="ks">'+s2+'</div>':'')+'</div>';}
    function bl(arr,cls){if(!arr||!arr.length)return '<div style="font-size:9.6px;color:#98A2B3;">(AI unavailable \u2014 discuss from the numbers above)</div>';return '<ul class="bullets '+cls+'">'+arr.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';}
    function lines(n2){var s2='';for(var i2=0;i2<n2;i2++)s2+='<div style="border-bottom:1px solid #D8DCE3;height:26px;"></div>';return s2;}
    var wowTxt=(R.pwRev!=null&&R.pwRev>0)?((R.wkRev>=R.pwRev?'&#9650; ':'&#9660; ')+Math.abs(Math.round((R.wkRev-R.pwRev)/R.pwRev*100))+'% vs prior wk'):'';
    var body=''
      +'<div class="exec-box" style="display:flex;justify-content:space-between;align-items:center;gap:14px;"><div><div class="eyebrow">1-on-1 coaching packet</div><div style="font-size:20px;font-weight:950;">'+esc(repName)+'</div><div style="font-size:10.5px;opacity:.75;margin-top:3px;">'+esc(E.prev.label)+' '+E.yr+' &middot; rank #'+rank+' of '+E.reps.length+(score?' &middot; score '+score.toFixed(1)+'/5':'')+'</div></div>'
      +'<div style="text-align:right;font-size:10px;opacity:.75;">Meeting date<br><span style="font-size:14px;font-weight:800;opacity:1;">____ / ____ / ______</span></div></div>'
      +'<div class="sec"><div class="sec-h"><span>&#128202; Where '+esc(fn)+' stands</span></div><div class="kgrid">'
      +kcell('Week revenue','$'+Math.round(R.wkRev).toLocaleString(),wowTxt)
      +kcell('Orders &middot; calls',R.wkOrders+' / '+R.wkCalls,(R.wkOrders>0?'AOV $'+Math.round(R.aov).toLocaleString():''))
      +kcell(E.q+' QTD','$'+Math.round(R.qtdRev).toLocaleString(),(E.earlyQuarter?'wk '+E.weeksCompleted+' of '+E.qtdWeeks.length+' \u2014 early':qtdPct+'% of $'+Math.round(R.goalRev).toLocaleString()))
      +kcell(E.yr+' YTD','$'+Math.round(R.ytdRev).toLocaleString(),R.ytdOrders+' orders')
      +kcell('Coverage',cov!=null?cov+'%':'&mdash;',R.setSize>0?(R.accts+' of '+R.setSize):'')
      +kcell('Top sale (wk)',R.topSale>0?'$'+Math.round(R.topSale).toLocaleString():'&mdash;',esc(R.topSaleCustomer||''))
      +kcell('Quarter best',R.qTop>0?'$'+Math.round(R.qTop).toLocaleString():'&mdash;',esc(R.qTopCust||''))
      +kcell('Quality ('+E.q+')',artsQ.length+' art &middot; $'+Math.round(credQ$).toLocaleString(),credsQ.length+' rep-fault memo'+(credsQ.length!==1?'s':''))
      +'</div>'
      +(R.series.length>1?('<div style="margin-top:9px;"><div style="font-size:7.8px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;color:#667085;">Weekly revenue &middot; '+E.q+'</div>'+_m2spark(R.series,E.wkLabels,'#008CC0')+'</div>'):'')
      +'</div>'
      +'<div class="sec"><div class="sec-h"><span>&#128161; Talk about this</span><span class="tag">AI-prepared</span></div><div class="tri" style="grid-template-columns:1fr 1fr;">'
      +'<div class="bcard"><div class="bl" style="color:#059669;">&#127881; Celebrate</div>'+bl(insight&&insight.celebrate,'win')+'</div>'
      +'<div class="bcard"><div class="bl" style="color:#D97706;">&#127919; Coach on</div>'+bl(insight&&insight.coach,'watch')+'</div>'
      +'</div>'
      +(flags.length?('<div style="margin-top:9px;"><div class="bl" style="color:#DC2626;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">&#9888;&#65039; Open flags</div><ul class="bullets risk">'+flags.map(function(f){return '<li>'+esc(f)+'</li>';}).join('')+'</ul></div>'):'')
      +'</div>'
      +(notes.length?('<div class="sec"><div class="sec-h"><span>&#128220; Recent coaching log</span></div>'+notes.map(function(n){return '<div style="border-left:2px solid #CBD5E1;padding:4px 10px;margin:0 0 7px;"><div style="font-size:8.5px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#667085;">'+esc(n.type||'Note')+' &middot; '+esc(n.date||'')+'</div><div style="font-size:10.5px;line-height:1.5;">'+esc(n.note||'')+'</div></div>';}).join('')+'</div>'):'')
      +'<div class="sec" style="break-inside:avoid;"><div class="sec-h"><span>&#9997;&#65039; Discussion &amp; commitments</span><span class="tag">fill in together</span></div>'
      +'<div class="tri" style="grid-template-columns:1fr 1fr;">'
      +'<div><div class="bl" style="color:#334155;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">'+esc(fn)+'&#8217;s commitments for next week</div>'+lines(4)+'</div>'
      +'<div><div class="bl" style="color:#334155;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Manager commitments / support needed</div>'+lines(4)+'</div>'
      +'</div>'
      +'<div style="margin-top:12px;"><div class="bl" style="color:#334155;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Notes</div>'+lines(5)+'</div>'
      +'<div style="display:flex;gap:26px;margin-top:14px;font-size:9.5px;color:#667085;"><span>Follow-up date: ______________</span><span>Rep initials: ________</span><span>Manager initials: ________</span></div>'
      +'</div>';
    var html=buildReportPrintV2('1-on-1 &mdash; '+esc(repName),E.q+' '+E.yr+' &middot; '+esc(E.prev.label),'Coaching Packet',body);
    try{saveReport('coaching','1-on-1 \u2014 '+repName+' ('+String(E.prev.label||'').split(':')[0]+')',E.q+' '+E.yr,html);}catch(e){}
    if(w){w.document.open();w.document.write(html);w.document.close();w.focus();}
  }catch(e){
    if(w){try{w.document.body.innerHTML='Packet error: '+String((e&&e.message)||e);}catch(_e){}}
  }
}
window.buildOneOnOnePacket=buildOneOnOnePacket;

/* ===== MODULE: PHASE6-INTELLIGENCE (forecast driver AI + prod-intel AI + entry missing-data) ===== */
function _p6Stats(){
  var E=_r360Engine();if(!E)return null;
  var series=E.teamSeries.filter(function(v){return v>0;});
  var mean=series.length?series.reduce(function(s,v){return s+v;},0)/series.length:0;
  var sd=series.length>1?Math.sqrt(series.reduce(function(s,v){return s+Math.pow(v-mean,2);},0)/series.length):0;
  var vol=mean>0?Math.round(sd/mean*100):0;
  var byQtd=E.reps.slice().sort(function(a,b){return b.qtdRev-a.qtdRev;});
  var top3=byQtd.slice(0,3);
  var top3Share=E.team.qtdRev>0?Math.round(top3.reduce(function(s,r){return s+r.qtdRev;},0)/E.team.qtdRev*100):0;
  return {E:E,vol:vol,byQtd:byQtd,top3:top3,top3Share:top3Share};
}
function renderForecastDriver(){
  var host=document.getElementById('fc-driver');if(!host)return;
  var st=_p6Stats();
  if(!st||!st.E){host.innerHTML='';return;}
  var E=st.E,t=E.team;
  host.innerHTML='<div class="r3-shell" style="margin:0 0 14px;"><div class="r3-head" style="padding:12px 16px;">'
    +'<span class="r3-av" style="background:linear-gradient(135deg,#00AFEF,#FA873D);width:32px;height:32px;font-size:15px;">&#129504;</span>'
    +'<div class="r3-hmeta"><div class="r3-name" style="font-size:13.5px;">What&#8217;s driving this number</div><div class="r3-sub">'+_dcWkShort(E.prev)+' &middot; '+E.q+' '+E.yr+' &middot; run rate $'+Math.round(E.avgWeekly).toLocaleString()+'/wk</div></div>'
    +'<div class="r3-hactions"><span id="fc-driver-conf"></span><button class="dc-mini" onclick="fetchForecastDriver(true)">&#8635;</button></div></div>'
    +'<div style="padding:12px 16px;" id="fc-driver-body"><span class="dc-flat">Loading&hellip;</span></div></div>';
  fetchForecastDriver(false);
}
async function fetchForecastDriver(force){
  var el=document.getElementById('fc-driver-body');if(!el)return;
  var st=_p6Stats();if(!st){el.innerHTML='';return;}
  var E=st.E,t=E.team;
  var cache=null;try{cache=JSON.parse(localStorage.getItem('tcp_fc_driver')||'null');}catch(e){}
  if(!force&&cache&&cache.wk===E.prev.key&&cache.data){_p6RenderDriver(cache.data);return;}
  el.innerHTML='<span class="dc-flat">Analyzing the forecast&hellip;</span>';
  var prompt='You explain a sales forecast for the manager at Triple Crown Products (custom apparel). Be concrete, name reps, no filler.\n'
    +'Quarter '+E.q+' '+E.yr+', week '+E.weeksCompleted+' of '+E.qtdWeeks.length+(E.earlyQuarter?' (EARLY \u2014 low confidence is expected, no failure framing)':'')+'.\n'
    +'QTD $'+Math.round(t.qtdRev).toLocaleString()+' of $'+Math.round(t.goalRev).toLocaleString()+' goal ('+E.qtdPct+'%). Run rate $'+Math.round(E.avgWeekly).toLocaleString()+'/wk \u2192 projects $'+Math.round(E.projected).toLocaleString()+' ('+E.projectedPct+'% of goal). Forward need $'+Math.round(E.forwardNeed).toLocaleString()+'/wk.\n'
    +'Weekly team series: ['+E.teamSeries.map(function(v){return Math.round(v);}).join(', ')+'] (volatility '+st.vol+'% of mean).\n'
    +'Top contributors QTD: '+st.top3.map(function(r){return r.name+' $'+Math.round(r.qtdRev).toLocaleString();}).join(', ')+' \u2014 top 3 = '+st.top3Share+'% of team revenue.\n'
    +'Bottom 3: '+st.byQtd.slice(-3).map(function(r){return r.name+' $'+Math.round(r.qtdRev).toLocaleString();}).join(', ')+'.\n'
    +'Return ONLY JSON, no fences: {"confidence":"high|medium|low","confidence_why":"one short line","drivers":["3-4 bullets, max 20 words: what is actually producing this projection \u2014 name reps, weeks, patterns"],"risks":["2-3 bullets: what could break it"],"upside":["1-2 bullets: what could beat it"]}';
  try{
    var raw=await callAI(prompt,{maxTokens:800,skipCompanyContext:true});
    raw=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').trim();
    var a=raw.indexOf('{'),b=raw.lastIndexOf('}');
    var data=JSON.parse(raw.slice(a,b+1));
    try{localStorage.setItem('tcp_fc_driver',JSON.stringify({wk:E.prev.key,data:data}));}catch(e){}
    _p6RenderDriver(data);
  }catch(e){
    el.innerHTML='<span class="dc-flat">AI unavailable \u2014 '+( /api key/i.test(String(e&&e.message))?'add your API key in Admin.':'tap \u21bb to retry.')+'</span>';
  }
}
function _p6RenderDriver(d){
  var el=document.getElementById('fc-driver-body');if(!el)return;
  var conf=document.getElementById('fc-driver-conf');
  if(conf){var cc=String(d.confidence||'').toLowerCase();var col=cc==='high'?'var(--tcp-green)':cc==='low'?'var(--tcp-red)':'var(--tcp-gold)';conf.innerHTML='<span class="r3-pill" style="background:transparent;border:1px solid '+col+';color:'+col+';" title="'+_m2esc(d.confidence_why||'')+'">'+_m2esc(cc||'?')+' confidence</span>';}
  function bl(arr,cls){return '<ul class="dc2-cc-list '+cls+'">'+(arr||[]).map(function(x){return '<li>'+_m2esc(x)+'</li>';}).join('')+'</ul>';}
  el.innerHTML='<div class="dc2-cc" style="grid-template-columns:1.2fr 1fr;">'
    +'<div><div class="dc2-cc-h" style="color:#00AFEF;">&#9889; Drivers</div>'+bl(d.drivers,'good')+'</div>'
    +'<div><div class="dc2-cc-h dc2-cc-fix">&#9888;&#65039; Risks</div>'+bl(d.risks,'fix')
    +((d.upside&&d.upside.length)?('<div class="dc2-cc-h dc2-cc-good" style="margin-top:9px;">&#128200; Upside</div>'+bl(d.upside,'good')):'')
    +'</div></div>'
    +(d.confidence_why?'<div class="dc-flat" style="font-size:10.5px;margin-top:8px;">Confidence: '+_m2esc(d.confidence_why)+'</div>':'');
}
function renderProdIntelAI(){
  var host=document.getElementById('pi-ai');if(!host)return;
  var yr=getYr(),q=getQ();
  var arts=(S.artErrors||[]).filter(function(a){return String(a.yr)===String(yr);});
  var artsQ=arts.filter(function(a){return a.q===q;});
  var cms=(S.cms||[]).filter(function(cm){return String(cm.yr)===String(yr);});
  var cmsQ=cms.filter(function(cm){return cm.q===q;});
  var credQ=cmsQ.reduce(function(s,cm){return s+Number(cm.amount||0);},0);
  var byRep={};artsQ.forEach(function(a){byRep[a.rep]=(byRep[a.rep]||0)+1;});
  var topArt=Object.keys(byRep).sort(function(a,b){return byRep[b]-byRep[a];}).slice(0,3);
  var custCt={};cms.forEach(function(cm){var k2=cm.custName||cm.custId;if(k2)custCt[k2]=(custCt[k2]||0)+1;});
  var repeats=Object.keys(custCt).filter(function(k2){return custCt[k2]>=2;});
  function sCell(l,v,s2){return '<div class="dc2-stat"><div class="dc2-sl">'+l+'</div><div class="dc2-sv" style="font-size:19px;">'+v+'</div><div class="dc2-ss dc-flat">'+(s2||'')+'</div></div>';}
  host.innerHTML='<div class="r3-shell" style="margin:0 0 14px;">'
    +'<div class="r3-head" style="padding:12px 16px;"><span class="r3-av" style="background:linear-gradient(135deg,#FB7185,#FBBF24);width:32px;height:32px;font-size:15px;">&#128300;</span>'
    +'<div class="r3-hmeta"><div class="r3-name" style="font-size:13.5px;">Quality intelligence</div><div class="r3-sub">'+q+' '+yr+' &middot; patterns in art errors &amp; credit memos</div></div>'
    +'<div class="r3-hactions"><button class="dc-mini" onclick="fetchProdIntelAI(true)">&#8635;</button></div></div>'
    +'<div class="dc2-stats" style="border-bottom:1px solid var(--tcp-line);">'
    +sCell('Art errors ('+q+')',String(artsQ.length),arts.length+' YTD')
    +sCell('Credit memos ('+q+')','$'+Math.round(credQ).toLocaleString(),cmsQ.length+' cases')
    +sCell('Top art source',topArt.length?_m2esc(String(topArt[0]).split(' ')[0])+' ('+byRep[topArt[0]]+')':'&mdash;',topArt.slice(1).map(function(n){return String(n).split(' ')[0];}).join(', '))
    +sCell('Repeat customers',String(repeats.length),repeats.slice(0,2).map(function(x){return _m2esc(x);}).join(', ')||'in credit memos')
    +'</div>'
    +'<div style="padding:12px 16px;" id="pi-ai-body"><span class="dc-flat">Loading&hellip;</span></div></div>';
  fetchProdIntelAI(false);
}
async function fetchProdIntelAI(force){
  var el=document.getElementById('pi-ai-body');if(!el)return;
  var yr=getYr(),q=getQ(),today=_dcToday();
  var cache=null;try{cache=JSON.parse(localStorage.getItem('tcp_pi_ai')||'null');}catch(e){}
  if(!force&&cache&&cache.d===today&&cache.q===q&&cache.data){_p6RenderPI(cache.data);return;}
  var arts=(S.artErrors||[]).filter(function(a){return String(a.yr)===String(yr)&&a.q===q;});
  var cms=(S.cms||[]).filter(function(cm){return String(cm.yr)===String(yr)&&cm.q===q;});
  if(!arts.length&&!cms.length){el.innerHTML='<span class="dc-flat">No art errors or credit memos in '+q+' yet \u2014 clean quarter so far.</span>';return;}
  el.innerHTML='<span class="dc-flat">Reading the quarter\u2019s quality record&hellip;</span>';
  var byRep={},byType={};arts.forEach(function(a){byRep[a.rep]=(byRep[a.rep]||0)+1;byType[a.type||'other']=(byType[a.type||'other']||0)+1;});
  var cmRep={},cmFault={};cms.forEach(function(cm){cmRep[cm.rep]=(cmRep[cm.rep]||0)+Number(cm.amount||0);cmFault[cm.fault||'?']=(cmFault[cm.fault||'?']||0)+Number(cm.amount||0);});
  var prompt='You analyze quality/ops data for a custom apparel sales manager (screen print, embroidery, DTF). Find PATTERNS, not summaries. Name reps and customers. No filler.\n'
    +q+' '+yr+' data:\nArt errors ('+arts.length+'): by rep '+JSON.stringify(byRep)+', by type '+JSON.stringify(byType)+'.\n'
    +'Recent error notes: '+arts.slice(-8).map(function(a){return a.rep.split(' ')[0]+': '+String(a.desc||a.type||'').slice(0,60);}).join(' | ')+'\n'
    +'Credit memos ('+cms.length+', $'+Math.round(cms.reduce(function(s,cm){return s+Number(cm.amount||0);},0)).toLocaleString()+'): $ by rep '+JSON.stringify(cmRep)+', $ by fault '+JSON.stringify(cmFault)+'.\n'
    +'Recent memo notes: '+cms.slice(-8).map(function(cm){return cm.rep.split(' ')[0]+'/'+(cm.custName||'?')+' $'+cm.amount+': '+String(cm.desc||'').slice(0,50);}).join(' | ')+'\n'
    +'Return ONLY JSON, no fences: {"patterns":["3-4 bullets, max 20 words: repeat issues, concentrations, preventable causes"],"impact":"1-2 sentences on the financial/customer impact","actions":["2-3 specific management actions"]}';
  try{
    var raw=await callAI(prompt,{maxTokens:800,skipCompanyContext:true});
    raw=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').trim();
    var a=raw.indexOf('{'),b=raw.lastIndexOf('}');
    var data=JSON.parse(raw.slice(a,b+1));
    try{localStorage.setItem('tcp_pi_ai',JSON.stringify({d:today,q:q,data:data}));}catch(e){}
    _p6RenderPI(data);
  }catch(e){
    el.innerHTML='<span class="dc-flat">AI unavailable \u2014 '+( /api key/i.test(String(e&&e.message))?'add your API key in Admin.':'tap \u21bb to retry.')+'</span>';
  }
}
function _p6RenderPI(d){
  var el=document.getElementById('pi-ai-body');if(!el)return;
  function bl(arr,cls){return '<ul class="dc2-cc-list '+cls+'">'+(arr||[]).map(function(x){return '<li>'+_m2esc(x)+'</li>';}).join('')+'</ul>';}
  el.innerHTML='<div class="dc2-cc">'
    +'<div><div class="dc2-cc-h dc2-cc-fix">&#128269; Patterns</div>'+bl(d.patterns,'fix')+(d.impact?'<div class="dc-flat" style="font-size:11px;margin-top:8px;">'+_m2esc(d.impact)+'</div>':'')+'</div>'
    +'<div><div class="dc2-cc-h" style="color:#00AFEF;">&#9989; Do about it</div>'+bl(d.actions,'good')+'</div>'
    +'</div>';
}
function renderEntryMissing(){
  var host=document.getElementById('entry-missing');if(!host)return;
  try{
    var ctx=_dcContext();if(!ctx){host.innerHTML='';return;}
    var idxCal=ctx.weeks.findIndex(function(w){return w.key===ctx.cal.key;});
    var target=idxCal>0?ctx.weeks[idxCal-1]:ctx.cal;
    var reps=activeReps();
    var missing=[],entered=0;
    reps.forEach(function(r){
      var d=gd(r.name+'|'+target.key);
      if(Number(d.revenue||0)>0||Number(d.orders||0)>0||Number(d.calls||0)>0)entered++;
      else missing.push(r.name.split(' ')[0]);
    });
    var pct=reps.length?Math.round(entered/reps.length*100):0;
    var col=pct===100?'var(--tcp-green)':pct>=50?'var(--tcp-gold)':'var(--tcp-red)';
    host.innerHTML='<div class="r3-shell" style="margin:0 0 14px;"><div class="r3-head" style="padding:11px 16px;">'
      +'<span class="r3-av" style="background:linear-gradient(135deg,#34D399,#00AFEF);width:32px;height:32px;font-size:15px;">&#9998;</span>'
      +'<div class="r3-hmeta"><div class="r3-name" style="font-size:13.5px;">'+_m2esc(_dcWkShort(target))+' entry status</div>'
      +'<div class="r3-sub"><span style="color:'+col+';font-weight:800;">'+entered+' of '+reps.length+' reps entered ('+pct+'%)</span>'
      +(missing.length?' &middot; missing: '+missing.slice(0,6).map(function(n){return _m2esc(n);}).join(', ')+(missing.length>6?' +'+(missing.length-6):''):' &middot; all in &#10003;')+'</div></div>'
      +'<div class="r3-hactions"><button class="dc-mini" onclick="renderEntryMissing()">&#8635;</button></div></div></div>';
  }catch(e){host.innerHTML='';}
}
window.renderForecastDriver=renderForecastDriver;window.fetchForecastDriver=fetchForecastDriver;
window.renderProdIntelAI=renderProdIntelAI;window.fetchProdIntelAI=fetchProdIntelAI;
window.renderEntryMissing=renderEntryMissing;
window.addEventListener('load',function(){
  setTimeout(function(){
    try{renderEntryMissing();}catch(e){}
    try{if(document.getElementById('pg-intel')&&document.getElementById('pg-intel').classList.contains('active'))renderForecastDriver();}catch(e){}
  },700);
});
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;
  var oc=b.getAttribute('onclick')||'';
  if(oc.indexOf("gt('intel'")>=0)setTimeout(function(){try{renderForecastDriver();}catch(_e){}},100);
  if(oc.indexOf("gt('prodintel'")>=0)setTimeout(function(){try{renderProdIntelAI();}catch(_e){}},100);
  if(oc.indexOf("gt('entry'")>=0)setTimeout(function(){try{renderEntryMissing();}catch(_e){}},100);
});
// keep entry status fresh as data is typed
document.addEventListener('change',function(e){
  var pg=document.getElementById('pg-entry');
  if(pg&&pg.contains(e.target))setTimeout(function(){try{renderEntryMissing();}catch(_e){}},400);
});

/* ===== MODULE: PHASE4-REPORTSHUB (unified reports: meeting + generators + history + exec packet) ===== */
function _hubRelocate(){
  try{
    var shellEl=document.getElementById('reports-hub-shell');if(!shellEl)return;
    var pgR=document.getElementById('pg-reports'),pgM=document.getElementById('pg-meeting');
    var hm=document.getElementById('hub-meeting'),hg=document.getElementById('hub-generators');
    if(pgM&&hm&&!hm.dataset.done){Array.prototype.slice.call(pgM.children).forEach(function(ch){if(!ch.classList||!ch.classList.contains('page-purpose'))hm.appendChild(ch);});hm.dataset.done='1';}
    if(pgR&&hg&&!hg.dataset.done){Array.prototype.slice.call(pgR.children).forEach(function(ch){if(ch===shellEl)return;if(ch.classList&&ch.classList.contains('page-purpose'))return;hg.appendChild(ch);});hg.dataset.done='1';}
    _hubEnsureMtg();
  }catch(e){console.warn('hub relocate:',e);}
}
function _hubEnsureMtg(){
  try{
    var s=document.getElementById('mtgWeekSel');
    if(s&&s.options.length===0&&typeof populateMtgWeekSel==='function')populateMtgWeekSel();
    if(typeof updateMtgWeekLabel==='function')updateMtgWeekLabel();
  }catch(e){console.warn('hub mtg init:',e);}
}
function renderHubHistory(){
  var host=document.getElementById('hub-history-list');if(!host)return;
  var hist=(typeof reportHistory!=='undefined'&&Array.isArray(reportHistory))?reportHistory:[];
  var fsel=document.getElementById('hub-hist-filter');
  if(fsel&&!fsel.dataset.built){
    var types={};hist.forEach(function(r){if(r.type)types[r.type]=1;});
    fsel.innerHTML='<option value="all">All types ('+hist.length+')</option>'+Object.keys(types).map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
    fsel.dataset.built='1';
  }
  var f=fsel?fsel.value:'all';
  var rows=hist.filter(function(r){return f==='all'||r.type===f;});
  if(!rows.length){host.innerHTML='<div class="dc-flat" style="padding:8px 0;">No saved reports'+(f!=='all'?' of this type':'')+' yet. Generate one above \u2014 everything lands here automatically.</div>';return;}
  host.innerHTML=rows.slice(0,60).map(function(r){
    return '<div class="r3-note" style="cursor:pointer;" onclick="openReport('+r.id+')"><div class="r3-note-h"><span class="r3-pill">'+_m2esc(r.type||'report')+'</span><span class="dc-flat">'+_m2esc(r.ts||'')+'</span></div><div class="r3-note-t">'+_m2esc(r.name||'')+(r.subject?' <span class="dc-flat">&middot; '+_m2esc(r.subject)+'</span>':'')+' <span class="dc-flat">&#8250; open</span></div></div>';
  }).join('')+(rows.length>60?'<div class="dc-flat" style="font-size:10.5px;">+'+(rows.length-60)+' older</div>':'');
}
async function execPacket(){
  var st=document.getElementById('hub-exec-st');
  function say(t){if(st)st.textContent=t;}
  var sel=document.getElementById('mtgWeekSel');
  if(!sel||!sel.value){say('Pick a week in the Meeting report tab first, then run the packet.');return;}
  try{
    say('1/3 \u2014 Deep quarter report (20\u201340s, uses web search)\u2026');
    if(typeof buildDeepQuarterReport==='function')await buildDeepQuarterReport();
    say('2/3 \u2014 Manager meeting report\u2026');
    if(typeof generateMeetingReport==='function')await generateMeetingReport();
    say('3/3 \u2014 Team-friendly version\u2026');
    if(typeof generateRepVersionReport==='function')await generateRepVersionReport();
    say('\u2713 Exec packet complete \u2014 all three saved to History. (If a tab was blocked by the pop-up blocker, open it from History.)');
    var fsel=document.getElementById('hub-hist-filter');if(fsel)fsel.dataset.built='';
    renderHubHistory();
  }catch(e){say('Packet error: '+((e&&e.message)||e));}
}
function _hubOpenMeeting(){
  _dcNav('reports');
  setTimeout(function(){var b=document.querySelector('#reports-hub-shell .r3-tab[data-pane="hub-meeting"]');if(b)_r360Tab(b);_hubEnsureMtg();},120);
}
window.renderHubHistory=renderHubHistory;window.execPacket=execPacket;window._hubOpenMeeting=_hubOpenMeeting;window._hubEnsureMtg=_hubEnsureMtg;
window.addEventListener('load',function(){setTimeout(function(){_hubRelocate();renderHubHistory();},600);});

/* ===== MODULE: PHASE3-REP360 (tabbed rep command page mounted on profile detail) ===== */
function _r360Engine(){
  var ctx=_dcContext();if(!ctx||!ctx.basis)return null;
  if(window._r360E&&window._r360E.key===ctx.basis.key)return window._r360E.E;
  var E=null;try{E=buildMtgEngine(ctx.basis,ctx.bYr,ctx.bQ);}catch(e){}
  if(E)window._r360E={key:ctx.basis.key,E:E};
  return E;
}
function _r360Score(name,yr,q){
  try{
    var weeks=gwq(yr,q),t=totW(name,weeks),g=getGoal(name,yr,q);
    var sc=calcSc(name,t,g,weeks.length,(typeof getHRPoints==='function'?getHRPoints(name,yr,q):0),weeks.length);
    return sc&&sc.fin?Number(sc.fin):0;
  }catch(e){return 0;}
}
function _r360Chart(title,vals,labels,color,opts){
  opts=opts||{};
  var money=opts.money!==false;
  function fmt(v){if(!money)return Math.round(v).toLocaleString();return v>=1000000?('$'+(v/1000000).toFixed(1).replace(/\.0$/,'')+'M'):(v>=1000?('$'+Math.round(v/1000)+'K'):('$'+Math.round(v)));}
  var n=vals.length;if(!n)return '';
  var max=Math.max.apply(null,vals.concat([1]));
  var nz=vals.filter(function(v){return v>0;});
  var total=vals.reduce(function(s,v){return s+v;},0);
  var avg=nz.length?total/nz.length:0;
  var bi=-1,wi=-1,bv=-1,wv=Infinity;
  vals.forEach(function(v,i){if(v>bv){bv=v;bi=i;}if(v>0&&v<wv){wv=v;wi=i;}});
  var last=vals[n-1],lastVsAvg=avg>0?Math.round((last-avg)/avg*100):null;
  var H=64;
  var avgTop=avg>0?Math.round(H-(avg/max)*H):null;
  var clickable=opts.pop&&opts.rep;
  var bars=vals.map(function(v,i){
    var h=Math.max(3,Math.round((v/max)*H));
    var isBest=(i===bi&&v>0);
    var click=clickable?(' onclick="'+(opts.pop==='qtr'?'_r360QtrPop':'_r360WeekPop')+'(this.dataset.rep,'+i+',this.dataset.m)" data-rep="'+_m2esc(opts.rep)+'" data-m="'+(opts.metric||'rev')+'" role="button" title="Click for details"'):'';
    return '<div class="r3c-c'+(clickable?' r3c-click':'')+'"'+click+'><div class="r3c-v" style="'+(isBest?'color:var(--tcp-gold);font-weight:800;':'')+'">'+(v>0?fmt(v):'')+'</div><div class="r3c-b" style="height:'+h+'px;background:'+color+';'+(isBest?'box-shadow:0 0 0 1.5px var(--tcp-gold);':'')+'opacity:'+(v>0?1:.14)+';"></div><div class="r3c-x">'+(labels[i]!=null?labels[i]:'')+'</div></div>';
  }).join('');
  var foot=[];
  foot.push('Total <b>'+fmt(total)+'</b>');
  if(avg>0)foot.push('Avg <b>'+fmt(avg)+'</b>/wk');
  if(bi>=0&&bv>0)foot.push('Best <b>'+(labels[bi]||'')+' '+fmt(bv)+'</b>');
  if(wi>=0&&wv<Infinity&&wi!==bi)foot.push('Low <b>'+(labels[wi]||'')+' '+fmt(wv)+'</b>');
  if(lastVsAvg!=null&&nz.length>1)foot.push('Last wk <span class="'+(lastVsAvg>=0?'dc-up':'dc-down')+'">'+(lastVsAvg>=0?'&#9650;':'&#9660;')+Math.abs(lastVsAvg)+'% vs avg</span>');
  return '<div class="dc2-chart" style="border:1px solid var(--tcp-line);border-radius:12px;"><div class="dc2-panel-h"><span>'+title+'</span></div>'
    +'<div class="r3c-wrap">'+(avgTop!=null&&nz.length>1?'<div class="r3c-avg" style="top:'+(avgTop+14)+'px;" title="average"></div>':'')+'<div class="r3c">'+bars+'</div></div>'
    +'<div class="r3c-foot">'+foot.join(' &middot; ')+'</div></div>';
}
function mountRep360(ri){
  var host=document.getElementById('profileDetail');if(!host)return;
  var r=S.reps[ri];if(!r)return;
  var old=document.getElementById('r360');if(old)old.remove();
  var E=_r360Engine();
  var R=E?E.reps.find(function(x){return x.name===r.name;}):null;
  var panel=document.createElement('div');panel.id='r360';
  var name=r.name,fn=name.split(' ')[0];
  var esc=_m2esc,initials=_m2init(name);
  var rank=R&&E?E.byWk.findIndex(function(x){return x.name===name;})+1:0;
  var score=E?_r360Score(name,E.yr,E.q):0;
  var tabs=['Overview','Trends','Coaching','Quality','Reviews','HR','History'];
  var head='<div class="r3-head"><span class="r3-av">'+esc(initials)+'</span><div class="r3-hmeta"><div class="r3-name">'+esc(name)+'</div><div class="r3-sub">'+(E?(_dcWkShort(E.prev)+' &middot; rank #'+rank+' of '+E.reps.length+' &middot; score '+score.toFixed(1)+'/5'):'no recent data')+'</div></div>'
    +'<div class="r3-hactions">'
    +'<button class="dc2-act" style="border-color:var(--tcp-accent);" onclick="buildOneOnOnePacket(this.dataset.rep)" data-rep="'+esc(name)+'">&#129309; 1-on-1 packet</button>'
    +(typeof buildRepQuarterReport==='function'?'<button class="dc2-act" onclick="buildRepQuarterReport(this.dataset.rep)" data-rep="'+esc(name)+'">&#128196; Quarter report</button>':'')
    +(typeof downloadRepSummaryPDF==='function'?'<button class="dc2-act" onclick="downloadRepSummaryPDF(this.dataset.rep)" data-rep="'+esc(name)+'">&#128229; Summary PDF</button>':'')
    +'</div></div>';
  var tabBar='<div class="r3-tabs">'+tabs.map(function(t,i){return '<button class="r3-tab'+(i===0?' active':'')+'" data-pane="r3p-'+t.toLowerCase()+'" onclick="_r360Tab(this)">'+t+'</button>';}).join('')+'</div>';
  // ---- panes ----
  var pv={};
  // OVERVIEW
  if(R&&E){
    var qtdPct=R.goalRev>0?Math.round(R.qtdRev/R.goalRev*100):0;
    var cov=R.setSize>0?Math.round(R.accts/R.setSize*100):null;
    function cell(l,v,s){return '<div class="rb-cell" style="background:var(--tcp-panel-2);border-color:var(--tcp-line);"><div class="l" style="color:var(--tcp-muted);">'+l+'</div><div class="v" style="color:var(--tcp-text);">'+v+'</div>'+(s?'<div class="s" style="color:var(--tcp-muted);">'+s+'</div>':'')+'</div>';}
    pv.overview='<div class="r3-grid5">'
      +cell('Week',_m2$(R.wkRev),R.wkOrders+' ord &middot; '+R.wkCalls+' calls')
      +cell('Prev week',R.pwRev!=null?_m2$(R.pwRev):'&mdash;','')
      +cell(E.q+' QTD',_m2$(R.qtdRev),(E.earlyQuarter?'early':qtdPct+'% of goal'))
      +cell(E.yr+' YTD',_m2$(R.ytdRev),R.ytdOrders+' orders')
      +cell('Coverage',cov!=null?cov+'%':'&mdash;',R.setSize>0?R.accts+'/'+R.setSize:'')
      +'</div><div class="r3-grid5" style="margin-top:7px;">'
      +cell('Top sale (wk)',R.topSale>0?_m2$(R.topSale):'&mdash;',esc(R.topSaleCustomer||''))
      +cell('Quarter best',R.qTop>0?_m2$(R.qTop):'&mdash;',esc(R.qTopCust||''))
      +cell('AOV (wk)',R.wkOrders>0?_m2$(R.aov):'&mdash;','')
      +cell('Art',String(R.art),R.qtdArt+' QTD')
      +cell('Credits',_m2$(R.credits),'wk &middot; rep-fault')+(_ordHasData()?(function(){var _o=_ordRepStat(name,E.yr,E.q);return cell('Order sales',_m2$(_o.sales),Math.round(_o.orders||0).toLocaleString()+' ord &middot; '+_m2$(_o.aov)+' AOV')+cell('New customers',Math.round(_o.newCust||0).toLocaleString(),(_o.rank?('rank #'+_o.rank+'/'+_o.of):'')+' &middot; '+Math.round(_o.web||0)+'w/'+Math.round(_o.entered||0)+'e');})():'')
      +'</div>'
      +'<div class="dc2-repai" style="border:0;padding:14px 0 0;"><div class="dc2-panel-h"><span>&#129504; AI read &middot; celebrate &amp; coach</span><button class="dc-mini" onclick="_r360Insight(this.dataset.rep,true)" data-rep="'+esc(name)+'">&#8635;</button></div><div id="r360-ai"><span class="dc-flat">Loading&hellip;</span></div></div>';
  }else pv.overview='<div class="dc-flat" style="padding:10px 0;">No recent weekly data for this rep.</div>';
  // TRENDS
  if(R&&E){
    var qLabels=['Q1','Q2','Q3','Q4'],qRev=[];
    try{qLabels.forEach(function(Q){qRev.push(Number((totW(name,gwq(E.yr,Q))||{}).revenue||0));});}catch(e){qRev=[0,0,0,0];}
    var ordSeries=E.qWeeks.map(function(w){return Number(gd(name+'|'+w.key).orders||0);});
    var callSeries=E.qWeeks.map(function(w){return Number(gd(name+'|'+w.key).calls||0);});
    var aovSeries=E.qWeeks.map(function(w){var d=gd(name+'|'+w.key);var o=Number(d.orders||0);return o>0?Number(d.revenue||0)/o:0;});
    var qNote='';
    var yTot=qRev.reduce(function(s,v){return s+v;},0);
    pv.trends='<div class="r3-trends">'
      +_r360Chart('Weekly revenue &middot; '+E.q,R.series,E.wkLabels,'#FA873D',{money:true,pop:'wk',rep:name,metric:'rev'})
      +_r360Chart('Avg order value / week',aovSeries,E.wkLabels,'#FBBF24',{money:true,pop:'wk',rep:name,metric:'aov'})
      +_r360Chart('Orders / week',ordSeries,E.wkLabels,'#34D399',{money:false,pop:'wk',rep:name,metric:'ord'})
      +_r360Chart('Calls / week',callSeries,E.wkLabels,'#00AFEF',{money:false,pop:'wk',rep:name,metric:'calls'})
      +'</div>'
      +'<div style="margin-top:9px;">'+_r360Chart(E.yr+' by quarter &middot; year total $'+Math.round(yTot).toLocaleString(),qRev,qLabels,'#00AFEF',{money:true,pop:'qtr',rep:name})+'</div>';
  }else pv.trends='<div class="dc-flat">No data.</div>';
  // COACHING
  var notes=(S.coachingNotes||[]).filter(function(n){return n.rep===name;}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  var noteRows=notes.length?notes.map(function(n){
    return '<div class="r3-note"><div class="r3-note-h"><span class="r3-pill'+(String(n.type).toLowerCase().indexOf('recog')>=0?' r3-pill-good':'')+'">'+esc(n.type||'Note')+'</span><span class="dc-flat">'+esc(n.date||'')+(n.week?' &middot; '+esc(n.week):'')+'</span></div><div class="r3-note-t">'+esc(n.note||'')+'</div></div>';
  }).join(''):'<div class="dc-flat">No coaching notes for '+esc(fn)+' yet.</div>';
  pv.coaching='<div class="dc2-panel-h"><span>Coaching log &middot; '+notes.length+'</span></div>'+noteRows
    +'<div class="r3-addnote"><div class="dc2-panel-h" style="margin-top:12px;"><span>Add note</span></div>'
    +'<div class="r3-addrow"><input type="date" id="r360-cn-date" class="r3-in"><select id="r360-cn-type" class="r3-in"><option>Coaching</option><option>Recognition</option><option>Concern</option><option>1-on-1</option></select></div>'
    +'<textarea id="r360-cn-note" class="r3-in" rows="2" placeholder="What was discussed / observed / celebrated&hellip;"></textarea>'
    +'<button class="dc2-act" style="margin-top:6px;" onclick="_r360AddNote(this.dataset.rep)" data-rep="'+esc(name)+'">&#43; Save note</button> <span id="r360-cn-msg" class="dc-up" style="display:none;font-size:11px;">Saved!</span></div>';
  // QUALITY
  var arts=(S.artErrors||[]).filter(function(a){return a.rep===name;}).slice().reverse();
  var creds=(S.cms||[]).filter(function(cm){return cm.rep===name;}).slice().reverse();
  var credRep=creds.filter(function(cm){return cm.fault==='rep';});
  var credTotal=credRep.reduce(function(s,cm){return s+Number(cm.amount||0);},0);
  pv.quality='<div class="r3-qgrid">'
    +'<div><div class="dc2-panel-h"><span>&#127912; Art errors &middot; '+arts.length+' all-time</span></div>'
    +(arts.length?arts.slice(0,12).map(function(a){return '<div class="r3-note"><div class="r3-note-h"><span class="r3-pill">'+esc(a.type||'Error')+'</span><span class="dc-flat">SO '+esc(a.so||'?')+' &middot; '+esc(a.date||a.weekKey||'')+'</span></div>'+(a.desc?'<div class="r3-note-t">'+esc(a.desc)+'</div>':'')+'</div>';}).join('')+(arts.length>12?'<div class="dc-flat" style="font-size:10.5px;">+'+(arts.length-12)+' older</div>':''):'<div class="dc-flat">Clean record \u2014 no art errors.</div>')
    +'</div>'
    +'<div><div class="dc2-panel-h"><span>&#128179; Credit memos &middot; '+creds.length+' ('+_m2$(credTotal)+' rep-fault)</span></div>'
    +(creds.length?creds.slice(0,12).map(function(cm){return '<div class="r3-note"><div class="r3-note-h"><span class="r3-pill'+(cm.fault==='rep'?' r3-pill-bad':'')+'">'+_m2$(cm.amount)+(cm.fault==='rep'?' &middot; rep fault':' &middot; '+esc(cm.fault||''))+'</span><span class="dc-flat">'+esc(cm.custName||cm.custId||'')+' &middot; '+esc(cm.date||'')+'</span></div>'+(cm.desc?'<div class="r3-note-t">'+esc(cm.desc)+'</div>':'')+'</div>';}).join('')+(creds.length>12?'<div class="dc-flat" style="font-size:10.5px;">+'+(creds.length-12)+' older</div>':''):'<div class="dc-flat">No credit memos.</div>')
    +'</div></div>';
  // REVIEWS
  var revs=(typeof reportHistory!=='undefined'?reportHistory:[]).filter(function(rp){return (rp.type==='review'||/review/i.test(rp.name||''))&&String(rp.name||'').indexOf(name)>=0;});
  pv.reviews='<div class="dc2-panel-h"><span>Saved reviews &middot; '+revs.length+'</span></div>'
    +(revs.length?revs.map(function(rp){return '<div class="r3-note" style="cursor:pointer;" onclick="openReport('+rp.id+')"><div class="r3-note-h"><span class="r3-pill">'+esc(rp.subject||'Review')+'</span><span class="dc-flat">'+esc(rp.ts||'')+'</span></div><div class="r3-note-t">'+esc(rp.name||'')+' <span class="dc-flat">&#8250; open</span></div></div>';}).join(''):'<div class="dc-flat">No saved reviews for '+esc(fn)+'. Generate one on the Reviews page and it will appear here.</div>');
  // HR
  var hrs=(S.hrViolations||[]).filter(function(h){return h.rep===name;}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  var hrPts=0;try{hrPts=getHRPoints(name,getYr(),getQ());}catch(e){}
  pv.hr='<div class="dc2-panel-h"><span>HR record &middot; '+hrs.length+' entries &middot; '+hrPts+' pts this quarter</span></div>'
    +(hrs.length?hrs.map(function(h){return '<div class="r3-note"><div class="r3-note-h"><span class="r3-pill r3-pill-bad">'+esc(h.cat||'Violation')+' &middot; '+(h.pts||0)+' pts</span><span class="dc-flat">'+esc(h.date||'')+'</span></div>'+(h.desc?'<div class="r3-note-t">'+esc(h.desc)+'</div>':'')+'</div>';}).join(''):'<div class="dc-flat">Clean record.</div>');
  // HISTORY
  var histRows='';
  try{
    YEARS.forEach(function(y){
      ['Q1','Q2','Q3','Q4'].forEach(function(Q){
        var wks=gwq(y,Q),t=totW(name,wks);
        if(!t||(!t.revenue&&!t.orders&&!t.calls))return;
        var sc=_r360Score(name,y,Q);
        histRows+='<tr><td style="text-align:left;font-weight:700;">'+Q+' '+y+'</td><td>'+_m2$(t.revenue)+'</td><td>'+Math.round(t.orders||0).toLocaleString()+'</td><td>'+Math.round(t.calls||0).toLocaleString()+'</td><td style="font-weight:800;">'+(sc?sc.toFixed(1):'&mdash;')+'</td></tr>';
      });
    });
  }catch(e){}
  pv.history='<div class="dc2-panel-h"><span>Quarter history</span></div>'
    +(histRows?'<table class="r3-tbl"><thead><tr><th style="text-align:left;">Quarter</th><th>Revenue</th><th>Orders</th><th>Calls</th><th>Score</th></tr></thead><tbody>'+histRows+'</tbody></table>':'<div class="dc-flat">No historical quarters with data.</div>');
  var panes=tabs.map(function(t,i){var k=t.toLowerCase();return '<div class="r3-pane'+(i===0?' active':'')+'" id="r3p-'+k+'">'+(pv[k]||'')+'</div>';}).join('');
  panel.innerHTML='<div class="r3-shell">'+head+tabBar+panes+'</div>';
  host.insertBefore(panel,host.firstChild);
  if(R&&E)_r360Insight(name,false);
}
function _r360Tab(btn){
  var shell=btn.closest('.r3-shell');if(!shell)return;
  shell.querySelectorAll('.r3-tab').forEach(function(b){b.classList.toggle('active',b===btn);});
  shell.querySelectorAll('.r3-pane').forEach(function(p){p.classList.toggle('active',p.id===btn.dataset.pane);});
}
function _r360AddNote(rep){
  var d=(document.getElementById('r360-cn-date')||{}).value||_dcToday();
  var type=(document.getElementById('r360-cn-type')||{}).value||'Coaching';
  var note=((document.getElementById('r360-cn-note')||{}).value||'').trim();
  if(!note){alert('Write the note first.');return;}
  var yr=new Date(d+'T12:00:00').getFullYear(),q;
  try{q=dateToQ(d,yr)||getQ();}catch(e){q=getQ();}
  S.coachingNotes.push({id:Date.now(),rep:rep,date:d,yr:yr,q:q,type:type,week:'',note:note});
  try{markDirty();}catch(e){}
  var m=document.getElementById('r360-cn-msg');if(m){m.style.display='inline';}
  var ri=S.reps.findIndex(function(x){return x.name===rep;});
  setTimeout(function(){try{mountRep360(ri);var shell=document.querySelector('#r360 .r3-shell');var cb=shell&&shell.querySelector('[data-pane="r3p-coaching"]');if(cb)_r360Tab(cb);}catch(e){}},600);
}
async function _r360Insight(rep,force){
  var el=document.getElementById('r360-ai');if(!el)return;
  var E=_r360Engine();if(!E){el.innerHTML='<span class="dc-flat">No data.</span>';return;}
  var R=E.reps.find(function(x){return x.name===rep;});
  if(!R){el.innerHTML='<span class="dc-flat">No data.</span>';return;}
  var cache=null;try{cache=JSON.parse(localStorage.getItem('tcp_rep_insight')||'null');}catch(e){}
  if(cache&&cache.wk!==E.prev.key)cache=null;
  cache=cache||{wk:E.prev.key,reps:{}};
  if(!force&&cache.reps[rep]){_r360RenderInsight(el,cache.reps[rep]);return;}
  el.innerHTML='<span class="dc-flat">Reading '+_m2esc(rep.split(' ')[0])+'\u2019s week\u2026</span>';
  var rank=E.byWk.findIndex(function(x){return x.name===rep;})+1;
  var teamAvgWk=E.reps.length>0?E.team.wkRev/E.reps.length:0;
  var covP=R.setSize>0?Math.round(R.accts/R.setSize*100):null;
  var prompt='You are a sales manager\u2019s coaching assistant at Triple Crown Products (custom apparel). One rep, one completed week. Be specific, use the numbers, no filler.\n'
    +'Rep: '+rep+' \u2014 '+E.prev.label+' '+E.yr+' (week '+E.weeksCompleted+' of '+E.qtdWeeks.length+(E.earlyQuarter?', EARLY quarter: no failure framing on pace':'')+').\n'
    +'Week: $'+Math.round(R.wkRev).toLocaleString()+' rev, '+R.wkOrders+' orders, '+R.wkCalls+' calls. Rank #'+rank+' of '+E.reps.length+' (team avg $'+Math.round(teamAvgWk).toLocaleString()+'/rep).\n'
    +'Prior week: '+(R.pwRev!=null?'$'+Math.round(R.pwRev).toLocaleString():'n/a')+'. QTD $'+Math.round(R.qtdRev).toLocaleString()+(R.goalRev>0?' vs $'+Math.round(R.goalRev).toLocaleString()+' goal':'')+'. YTD $'+Math.round(R.ytdRev).toLocaleString()+'.\n'
    +'Top sale: '+(R.topSale>0?'$'+Math.round(R.topSale).toLocaleString()+(R.topSaleCustomer?' ('+R.topSaleCustomer+')':''):'none')+'. Coverage: '+(covP!=null?covP+'%':'n/a')+'. Art: '+R.art+' wk/'+R.qtdArt+' QTD. Credits: $'+Math.round(R.credits).toLocaleString()+' wk.\n'
    +'Weekly series: ['+R.series.map(function(v){return Math.round(v);}).join(', ')+']\n'
    +'Return ONLY JSON, no fences: {"celebrate":["2-3 bullets, max 18 words each"],"coach":["2-3 bullets, max 18 words each \u2014 what to work on and how"]}';
  try{
    var raw=await callAI(prompt,{maxTokens:600,skipCompanyContext:true});
    raw=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').trim();
    var a=raw.indexOf('{'),b=raw.lastIndexOf('}');
    var data=JSON.parse(raw.slice(a,b+1));
    cache.reps[rep]=data;
    try{localStorage.setItem('tcp_rep_insight',JSON.stringify(cache));}catch(e){}
    _r360RenderInsight(el,data);
  }catch(e){
    el.innerHTML='<span class="dc-flat">AI read unavailable \u2014 '+( /api key/i.test(String(e&&e.message))?'add your API key in Admin.':'tap \u21bb to retry.')+'</span>';
  }
}
function _r360RenderInsight(el,d){
  function list(arr,cls){return '<ul class="dc2-cc-list '+cls+'">'+(arr||[]).map(function(x){return '<li>'+_m2esc(x)+'</li>';}).join('')+'</ul>';}
  el.innerHTML='<div class="dc2-cc">'
    +'<div><div class="dc2-cc-h dc2-cc-good">&#127881; Celebrate</div>'+list(d.celebrate,'good')+'</div>'
    +'<div><div class="dc2-cc-h dc2-cc-fix">&#127919; Coach on</div>'+list(d.coach,'fix')+'</div>'
    +'</div>';
}
function _r360Modal(html){
  var old=document.getElementById('r360-modal');if(old)old.remove();
  var ov=document.createElement('div');ov.id='r360-modal';ov.className='r3m-ov';
  ov.innerHTML='<div class="r3m-card">'+html+'<button class="r3m-x" onclick="_r360CloseModal()">&times;</button></div>';
  ov.addEventListener('click',function(e){if(e.target===ov)_r360CloseModal();});
  document.body.appendChild(ov);
}
function _r360CloseModal(){var m=document.getElementById('r360-modal');if(m)m.remove();}
function _r360WeekPop(rep,idx,metric){
  metric=metric||'rev';idx=Number(idx);
  var E=_r360Engine();if(!E)return;
  var wk=E.qWeeks[idx];if(!wk)return;
  var d=gd(rep+'|'+wk.key)||{};
  var R=E.reps.find(function(x){return x.name===rep;})||{};
  var rev=Number(d.revenue||0),ord=Number(d.orders||0),calls=Number(d.calls||0);
  var aov=ord>0?rev/ord:0;
  // team stats for THIS week
  var team=[];
  try{activeReps().forEach(function(r2){var dd=gd(r2.name+'|'+wk.key)||{};var o2=Number(dd.orders||0);team.push({name:r2.name,rev:Number(dd.revenue||0),ord:o2,calls:Number(dd.calls||0),aov:o2>0?Number(dd.revenue||0)/o2:0});});}catch(e){}
  function rankOf(key,val){var sorted=team.slice().sort(function(a,b){return b[key]-a[key];});var i2=sorted.findIndex(function(x){return x.name===rep;});return i2>=0?(i2+1):null;}
  function tAvg(key){var nz=team.filter(function(x){return x[key]>0;});return nz.length?nz.reduce(function(s2,x){return s2+x[key];},0)/nz.length:0;}
  var pw=idx>0?gd(rep+'|'+E.qWeeks[idx-1].key):null;
  var arts=(S.artErrors||[]).filter(function(a){return a.rep===rep&&a.weekKey===wk.key;});
  var creds=(S.cms||[]).filter(function(cm){return cm.rep===rep&&cm.weekKey===wk.key;});
  function row(l,v,s2){return '<div class="r3m-row"><span class="dc-flat">'+l+'</span><span style="font-weight:800;">'+v+(s2?' <span class="dc-flat" style="font-weight:400;">'+s2+'</span>':'')+'</span></div>';}
  function delta(cur,prev){if(prev==null||prev<=0)return '';var p2=Math.round((cur-prev)/prev*100);return '<span class="'+(p2>=0?'dc-up':'dc-down')+'">'+(p2>=0?'&#9650;':'&#9660;')+Math.abs(p2)+'% vs prior wk</span>';}
  var titles={rev:'Revenue',aov:'Order value',ord:'Orders',calls:'Calls &amp; activity'};
  var body='';
  if(metric==='rev'){
    var wkShare=(R.qtdRev||0)>0?Math.round(rev/(R.qtdRev)*100):null;
    var avgP=E.weeksCompleted>0?(R.qtdRev||0)/E.weeksCompleted:0;
    var vsAvg=avgP>0?Math.round((rev-avgP)/avgP*100):null;
    body=row('Revenue','$'+Math.round(rev).toLocaleString(),delta(rev,pw?Number(pw.revenue||0):null))
      +(rankOf('rev')?row('Team rank this wk','#'+rankOf('rev')+' of '+team.length,'team avg $'+Math.round(tAvg('rev')).toLocaleString()):'')
      +(vsAvg!=null?row('Vs personal avg','<span class="'+(vsAvg>=0?'dc-up':'dc-down')+'">'+(vsAvg>=0?'&#9650;':'&#9660;')+Math.abs(vsAvg)+'%</span>','avg $'+Math.round(avgP).toLocaleString()+'/wk'):'')
      +(wkShare!=null?row('Share of QTD',wkShare+'%','of $'+Math.round(R.qtdRev).toLocaleString()):'')
      +(Number(d.topSale||0)>0?row('Top sale','$'+Math.round(d.topSale).toLocaleString(),_m2esc(d.topSaleCustomer||'')+(rev>0?' &middot; '+Math.round(Number(d.topSale)/rev*100)+'% of week':'')):'');
  }else if(metric==='aov'){
    var restRev=rev-Number(d.topSale||0),restOrd=ord-1;
    body=row('Avg order value',ord>0?('$'+Math.round(aov).toLocaleString()):'&mdash;',ord+' orders / $'+Math.round(rev).toLocaleString())
      +(rankOf('aov')?row('Team rank this wk','#'+rankOf('aov')+' of '+team.filter(function(x){return x.aov>0;}).length,'team avg $'+Math.round(tAvg('aov')).toLocaleString()):'')
      +(Number(d.topSale||0)>0?row('Biggest order','$'+Math.round(d.topSale).toLocaleString(),_m2esc(d.topSaleCustomer||'')):'')
      +(Number(d.topSale||0)>0&&restOrd>0?row('AOV excl. biggest','$'+Math.round(Math.max(0,restRev)/restOrd).toLocaleString(),restOrd+' other orders'):'')
      +row('Read',aov>tAvg('aov')?'Larger-than-team orders':'Smaller orders than team avg','coach '+(aov>tAvg('aov')?'order count':'order size'));
  }else if(metric==='ord'){
    var avgO=E.weeksCompleted>0?(R.qtdOrders||0)/E.weeksCompleted:0;
    body=row('Orders',String(ord),delta(ord,pw?Number(pw.orders||0):null))
      +(rankOf('ord')?row('Team rank this wk','#'+rankOf('ord')+' of '+team.length,'team avg '+Math.round(tAvg('ord'))):'')
      +(avgO>0?row('Vs personal avg',(ord>=avgO?'<span class="dc-up">&#9650;':'<span class="dc-down">&#9660;')+Math.abs(Math.round((ord-avgO)/avgO*100))+'%</span>','avg '+Math.round(avgO)+'/wk'):'')
      +row('Revenue per order',ord>0?('$'+Math.round(aov).toLocaleString()):'&mdash;','')
      +(arts.length?row('Art errors',String(arts.length),ord>0?((arts.length/ord*100).toFixed(0)+'% of orders'):''):'');
  }else{
    var accts=Number(d.acctsCalled||0);
    body=row('Calls',String(calls),delta(calls,pw?Number(pw.calls||0):null))
      +(rankOf('calls')?row('Team rank this wk','#'+rankOf('calls')+' of '+team.length,'team avg '+Math.round(tAvg('calls'))):'')
      +(accts>0?row('Accounts reached',String(Math.round(accts)),R.setSize>0?('of '+R.setSize+' set'):''):'')
      +(calls>0?row('Calls per order',ord>0?(Math.round(calls/ord)+' : 1'):'no orders','conversion'):'')
      +(Number(d.hours||0)>0?row('Hours',String(d.hours),calls>0?((calls/Number(d.hours)).toFixed(1)+' calls/hr'):''):'');
  }
  var common=(metric!=='ord'&&arts.length?row('Art errors',String(arts.length),arts.map(function(a){return 'SO '+_m2esc(a.so||'?');}).join(', ')):'')
    +(creds.length?row('Credit memos','$'+Math.round(creds.reduce(function(s2,cm){return s2+Number(cm.amount||0);},0)).toLocaleString(),creds.map(function(cm){return _m2esc(cm.custName||cm.custId||'');}).filter(Boolean).join(', ')):'');
  var h='<div class="r3m-h"><span class="r3-pill">'+_m2esc(rep.split(' ')[0])+' &middot; '+(titles[metric]||'Week')+'</span><div class="r3m-title">'+_m2esc(wk.label||'')+' '+E.yr+'</div></div>'
    +body+common
    +'<div class="r3m-actions"><button class="dc2-act" onclick="_r360NoteWeek(this.dataset.rep,this.dataset.wk)" data-rep="'+_m2esc(rep)+'" data-wk="'+_m2esc(String(wk.label||'').split(':')[0])+'">&#9998; Note this week</button></div>';
  _r360Modal(h);
}
function _r360QtrPop(rep,qi){
  var E=_r360Engine();if(!E)return;
  var Q=['Q1','Q2','Q3','Q4'][qi];if(!Q)return;
  var wks=gwq(E.yr,Q),t=totW(rep,wks)||{};
  var sc=_r360Score(rep,E.yr,Q);
  var best=0,bestCust='',bestWk='';
  wks.forEach(function(w){var dd=gd(rep+'|'+w.key);if(Number(dd.topSale||0)>best){best=Number(dd.topSale);bestCust=dd.topSaleCustomer||'';bestWk=String(w.label||'').split(':')[0];}});
  var arts=(S.artErrors||[]).filter(function(a){return a.rep===rep&&a.yr==String(E.yr)&&a.q===Q;}).length;
  var credT=(S.cms||[]).filter(function(cm){return cm.rep===rep&&cm.fault==='rep'&&cm.yr==String(E.yr)&&cm.q===Q;}).reduce(function(s,cm){return s+Number(cm.amount||0);},0);
  var g=null;try{g=getGoal(rep,E.yr,Q);}catch(e){}
  function row(l,v,s){return '<div class="r3m-row"><span class="dc-flat">'+l+'</span><span style="font-weight:800;">'+v+(s?' <span class="dc-flat" style="font-weight:400;">'+s+'</span>':'')+'</span></div>';}
  var h='<div class="r3m-h"><span class="r3-pill">'+_m2esc(rep.split(' ')[0])+'</span><div class="r3m-title">'+Q+' '+E.yr+'</div></div>'
    +row('Revenue','$'+Math.round(t.revenue||0).toLocaleString(),(g&&g.rev>0?Math.round((t.revenue||0)/g.rev*100)+'% of $'+Math.round(g.rev).toLocaleString()+' goal':''))
    +row('Orders',String(Math.round(t.orders||0)),(t.orders>0?('AOV $'+Math.round((t.revenue||0)/t.orders).toLocaleString()):''))
    +row('Calls',String(Math.round(t.calls||0)),'')
    +(best>0?row('Best sale','$'+Math.round(best).toLocaleString(),_m2esc(bestCust)+(bestWk?' &middot; '+_m2esc(bestWk):'')):'')
    +row('Art errors',String(arts),'')
    +row('Rep-fault credits','$'+Math.round(credT).toLocaleString(),'')
    +(sc?row('Score',sc.toFixed(1)+' / 5',''):'');
  _r360Modal(h);
}
function _r360NoteWeek(rep,wkShort){
  _r360CloseModal();
  var shell=document.querySelector('#r360 .r3-shell');
  var cb=shell&&shell.querySelector('[data-pane="r3p-coaching"]');
  if(cb)_r360Tab(cb);
  setTimeout(function(){
    var ta=document.getElementById('r360-cn-note');
    if(ta){ta.value=(wkShort?wkShort+': ':'')+ta.value;ta.focus();}
    var dt=document.getElementById('r360-cn-date');
    if(dt&&!dt.value)dt.value=_dcToday();
  },60);
}
window._r360WeekPop=_r360WeekPop;window._r360QtrPop=_r360QtrPop;window._r360CloseModal=_r360CloseModal;window._r360NoteWeek=_r360NoteWeek;
window._r360Tab=_r360Tab;window._r360AddNote=_r360AddNote;window._r360Insight=_r360Insight;window.mountRep360=mountRep360;
(function(){
  if(typeof renderProfileDetail==='function'&&!window._r360Legacy){
    window._r360Legacy=renderProfileDetail;
    renderProfileDetail=function(ri){window._r360Legacy(ri);try{mountRep360(ri);}catch(e){console.warn('r360:',e);}};
  }
})();

/* ===== MODULE: PHASE2-COCKPIT (dashboard command center + automations) =====
   Cadence-aware: weekly data batch-entered Monday for the prior week.
   Anchors on the LAST COMPLETED (data-bearing) week. */
function _dcToday(){var n=new Date();function p(x){return (x<10?'0':'')+x;}return n.getFullYear()+'-'+p(n.getMonth()+1)+'-'+p(n.getDate());}
function _dcWkShort(w){return w&&w.label?String(w.label).split(':')[0]:'';}
function _dcWeekHasData(wk){
  try{var reps=activeReps();for(var i=0;i<reps.length;i++){var d=gd(reps[i].name+'|'+wk.key);if(Number(d.revenue||0)>0||Number(d.orders||0)>0||Number(d.calls||0)>0)return true;}}catch(e){}
  return false;
}
function _dcContext(){
  try{
    var yr=getYr(),q=getQ(),wn=getWN(),weeks=gwq(yr,q);
    var cal=weeks.find(function(x){return String(x.num)===String(wn);})||weeks[0];
    var basis=null,bYr=yr,bQ=q;
    for(var i=weeks.length-1;i>=0;i--){if(_dcWeekHasData(weeks[i])){basis=weeks[i];break;}}
    if(!basis){
      var order=['Q1','Q2','Q3','Q4'],qi=order.indexOf(q);
      var pyr=qi>0?yr:yr-1,pq=qi>0?order[qi-1]:'Q4';
      try{
        var pweeks=gwq(pyr,pq);
        for(var j=pweeks.length-1;j>=0;j--){if(_dcWeekHasData(pweeks[j])){basis=pweeks[j];bYr=pyr;bQ=pq;break;}}
      }catch(e){}
    }
    return {cal:Object.assign({},cal),calYr:yr,calQ:q,basis:basis?Object.assign({},basis):null,bYr:bYr,bQ:bQ,weeks:weeks};
  }catch(e){return null;}
}
function computeDashAlerts(E,ctx,lastDaily){
  var A=[];
  try{
    var idxCal=ctx.weeks.findIndex(function(w){return w.key===ctx.cal.key;});
    var prevCal=idxCal>0?ctx.weeks[idxCal-1]:null;
    if(prevCal&&!_dcWeekHasData(prevCal)){
      var isMon=new Date().getDay()===1;
      A.push({sev:'amber',icon:'&#9998;',txt:_dcWkShort(prevCal)+' not entered'+(isMon?' &middot; due today':' &middot; due Monday'),page:'entry'});
    }
    if(E){
      var partial=E.reps.filter(function(r){return r.wkRev===0&&r.wkCalls===0&&r.wkOrders===0;});
      if(partial.length>0&&partial.length<E.reps.length)A.push({sev:'amber',icon:'&#9998;',txt:'Missing in '+_dcWkShort(E.prev)+': '+partial.slice(0,3).map(function(r){return r.name.split(' ')[0];}).join(', ')+(partial.length>3?' +'+(partial.length-3):''),page:'entry'});
    }
  }catch(e){}
  if(lastDaily){
    var days=Math.floor((new Date()-new Date(lastDaily.date+'T12:00:00'))/86400000);
    if(days>4)A.push({sev:'amber',icon:'&#128197;',txt:'Daily log stale &middot; last '+lastDaily.date.slice(5).replace('-','/')+' ('+days+'d)',page:'daily'});
  }else{
    A.push({sev:'blue',icon:'&#128197;',txt:'No daily sales logged yet',page:'daily'});
  }
  if(E){
    var weTotal=E.qtdWeeks.length;
    if(E.weeksCompleted>=4){
      var behind=E.reps.filter(function(r){var paced=r.goalRev*(E.weeksCompleted/weTotal);return r.goalRev>0&&paced>0&&r.qtdRev<paced*0.7;});
      if(behind.length>0)A.push({sev:'red',icon:'&#127919;',txt:'Under pace: '+behind.slice(0,3).map(function(r){return r.name.split(' ')[0];}).join(', ')+(behind.length>3?' +'+(behind.length-3):''),page:'profiles'});
    }
    var artHot=E.reps.filter(function(r){return r.art>=3;});
    if(artHot.length>0)A.push({sev:'amber',icon:'&#127912;',txt:'Art errors &middot; '+artHot.map(function(r){return r.name.split(' ')[0]+' ('+r.art+')';}).join(', '),page:'art'});
    var cred=E.reps.filter(function(r){return r.credits>0;});
    if(cred.length>0)A.push({sev:'amber',icon:'&#128179;',txt:cred.reduce(function(s,r){return s+r.cmCases||0;},0)>0?'':'',page:'credits'});
    if(cred.length>0)A[A.length-1].txt=cred.length+' credit memo'+(cred.length>1?'s':'')+' &middot; $'+Math.round(cred.reduce(function(s,r){return s+r.credits;},0)).toLocaleString()+' &middot; '+_dcWkShort(E.prev);
    var coach=[];
    E.reps.forEach(function(r){
      var avg=E.weeksCompleted>1?(r.qtdRev/E.weeksCompleted):0;
      if(avg>1000&&r.wkRev<avg*0.5&&r.wkRev>0)coach.push(r.name.split(' ')[0]+' (dip)');
      else if(r.wkCalls===0&&(r.wkRev>0||r.wkOrders>0))coach.push(r.name.split(' ')[0]+' (0 calls)');
    });
    if(coach.length>0)A.push({sev:'blue',icon:'&#129309;',txt:'Coach: '+coach.slice(0,4).join(', ')+(coach.length>4?' +'+(coach.length-4):''),page:'profiles'});
  }
  try{
    var bts=Number(localStorage.getItem('tcp_last_backup_ts')||0);
    var bdays=bts>0?Math.floor((Date.now()-bts)/86400000):null;
    if(bdays==null)A.push({sev:'blue',icon:'&#128737;&#65039;',txt:'No backup file yet &middot; download one in Admin',page:'admin'});
    else if(bdays>7)A.push({sev:bdays>21?'red':'amber',icon:'&#128737;&#65039;',txt:'Backup overdue &middot; last '+bdays+'d ago',page:'admin'});
  }catch(e){}
  if(A.length===0)A.push({sev:'green',icon:'&#10003;',txt:'All clear \u2014 data current, no flags',page:null});
  return A;
}
function _dcNav(page){
  try{
    var btns=document.querySelectorAll('#tabBar button');
    for(var i=0;i<btns.length;i++){var oc=btns[i].getAttribute('onclick')||'';if(oc.indexOf("gt('"+page+"'")>=0){btns[i].click();return;}}
  }catch(e){}
}
function _dcScopeRep(name){
  window._dcScope=name||'';
  try{renderDashCockpit();}catch(e){}
}
function _dcOpenProfile(name){
  var ri=S.reps.findIndex(function(x){return x.name===name;});
  _dcNav('profiles');
  setTimeout(function(){try{if(ri>=0)renderProfileDetail(ri);}catch(e){}},120);
}
function _dcBars(vals,labels,color,fmt){
  var max=Math.max.apply(null,vals.concat([1]));
  return '<div class="dcb">'+vals.map(function(v,i){
    var h=max>0?Math.max(3,Math.round((v/max)*46)):3;
    return '<div class="dcb-c" title="'+(fmt?fmt(v):v)+'"><div class="dcb-v">'+(v>0&&vals.length<=6?(fmt?fmt(v):v):'')+'</div><div class="dcb-b" style="height:'+h+'px;background:'+color+';opacity:'+(v>0?1:.15)+';"></div><div class="dcb-x">'+(labels[i]!=null?labels[i]:'')+'</div></div>';
  }).join('')+'</div>';
}
function renderDashCockpit(){
  var host=document.getElementById('dash-cockpit');if(!host)return;
  var ctx=_dcContext();if(!ctx){host.innerHTML='';return;}
  var E=null;
  if(ctx.basis){try{E=buildMtgEngine(ctx.basis,ctx.bYr,ctx.bQ);}catch(e){console.warn('cockpit engine:',e);}}
  var lastDaily=null,today=_dcToday();
  try{var ds=getDailySales()||[];if(ds.length)lastDaily=ds[ds.length-1];}catch(e){}
  var alerts=computeDashAlerts(E,ctx,lastDaily);
  window._dashCockpitState={E:E,ctx:ctx,alerts:alerts,today:today,lastDaily:lastDaily};
  var reps=activeReps();
  var hour=new Date().getHours(),greet=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  var scope=window._dcScope||'';
  var repOpts=reps.map(function(r){return '<option value="'+_m2esc(r.name)+'"'+(scope===r.name?' selected':'')+'>'+_m2esc(r.name)+'</option>';}).join('');
  var statusTxt=E?(ctx.cal.key===E.prev.key?'&#10003; '+_dcWkShort(ctx.cal)+' entered':'&#9203; '+_dcWkShort(ctx.cal)+' in progress &middot; due Monday')
                 :('&#9203; '+_dcWkShort(ctx.cal)+' in progress');
  if(lastDaily)statusTxt+=' &middot; daily &Sigma; $'+Math.round(lastDaily.runningTotal).toLocaleString();
  var R=(scope&&E)?E.reps.find(function(x){return x.name===scope;}):null;
  if(scope&&!R)window._dcScope=scope='';
  var head='<div class="dc2-head"><div><div class="dc2-eyebrow">'+(R?'Rep view &middot; Command center':greet+' &middot; Command center')+'</div><div class="dc2-title">'+(E?((R?('<b>'+_m2esc(R.name)+'</b> &middot; '):'Last completed week &middot; ')+'<b>'+_m2esc(E.prev.label)+'</b>'+(R?' <button class="dc-mini" style="margin-left:8px;" onclick="_dcOpenProfile(this.dataset.rep)" data-rep="'+_m2esc(R.name)+'">Open profile &rarr;</button>':'')):'No weekly data yet')+'</div></div>'
    +'<div class="dc2-status">'+statusTxt+'</div>'
    +'<div class="dc2-actions">'
    +'<button class="dc2-act" onclick="_dcNav(\'entry\')" title="Weekly data entry">&#9998;<span>Weekly</span></button>'
    +'<button class="dc2-act" onclick="_dcNav(\'daily\')" title="Daily sales">&#128197;<span>Daily</span></button>'
    +'<button class="dc2-act" onclick="_hubOpenMeeting()" title="Meeting report">&#129309;<span>Meeting</span></button>'
    +'<select class="dc2-act dc2-sel" onchange="_dcScopeRep(this.value)" title="View a rep in the cockpit"><option value="">'+(scope?'&larr; Team':'Team &middot; rep&hellip;')+'</option>'+repOpts+'</select>'
    +'</div></div>';
  var stats='';
  if(E&&R){
    var rwow=(R.pwRev!=null&&R.pwRev>0)?((R.wkRev-R.pwRev)/R.pwRev*100):null;
    var rwowHtml=(R.pwRev==null)?'':(R.pwRev===0?'<span class="dc-flat">prior wk $0</span>':('<span class="'+(rwow>=0?'dc-up':'dc-down')+'">'+(rwow>=0?'&#9650;':'&#9660;')+' '+Math.abs(rwow).toFixed(0)+'%</span> <span class="dc-flat">vs wk before</span>'));
    var rQtdPct=R.goalRev>0?Math.round(R.qtdRev/R.goalRev*100):0;
    stats='<div class="dc2-stats">'
      +'<div class="dc2-stat"><div class="dc2-sl">Week revenue</div><div class="dc2-sv">$'+Math.round(R.wkRev).toLocaleString()+'</div><div class="dc2-ss">'+rwowHtml+'</div></div>'
      +'<div class="dc2-stat"><div class="dc2-sl">Orders &middot; calls</div><div class="dc2-sv">'+R.wkOrders.toLocaleString()+' <span class="dc2-dim">/ '+R.wkCalls.toLocaleString()+'</span></div><div class="dc2-ss dc-flat">'+_dcWkShort(E.prev)+'</div></div>'
      +'<div class="dc2-stat"><div class="dc2-sl">'+E.q+' to date</div><div class="dc2-sv">$'+Math.round(R.qtdRev).toLocaleString()+'</div><div class="dc2-ss dc-flat">'+(E.earlyQuarter?('wk '+E.weeksCompleted+' of '+E.qtdWeeks.length+' &middot; early'):(rQtdPct+'% of goal'))+'</div></div>'
      +'<div class="dc2-stat"><div class="dc2-sl">'+E.yr+' YTD</div><div class="dc2-sv">$'+Math.round(R.ytdRev).toLocaleString()+'</div><div class="dc2-ss dc-flat">'+R.ytdOrders.toLocaleString()+' orders</div></div>'
      +'</div>';
  }else if(E){
    var t=E.team;
    var wow=(t.pwRev!=null&&t.pwRev>0)?((t.wkRev-t.pwRev)/t.pwRev*100):null;
    var wowHtml=(t.pwRev==null)?'':(t.pwRev===0?'<span class="dc-flat">prior wk $0</span>':('<span class="'+(wow>=0?'dc-up':'dc-down')+'">'+(wow>=0?'&#9650;':'&#9660;')+' '+Math.abs(wow).toFixed(0)+'%</span> <span class="dc-flat">vs wk before</span>'));
    var qtdPct=t.goalRev>0?Math.round(t.qtdRev/t.goalRev*100):0;
    stats='<div class="dc2-stats">'
      +'<div class="dc2-stat"><div class="dc2-sl">Week revenue</div><div class="dc2-sv">$'+Math.round(t.wkRev).toLocaleString()+'</div><div class="dc2-ss">'+wowHtml+'</div></div>'
      +'<div class="dc2-stat"><div class="dc2-sl">Orders &middot; calls</div><div class="dc2-sv">'+t.wkOrders.toLocaleString()+' <span class="dc2-dim">/ '+t.wkCalls.toLocaleString()+'</span></div><div class="dc2-ss dc-flat">'+_dcWkShort(E.prev)+'</div></div>'
      +'<div class="dc2-stat"><div class="dc2-sl">'+E.q+' to date</div><div class="dc2-sv">$'+Math.round(t.qtdRev).toLocaleString()+'</div><div class="dc2-ss dc-flat">'+(E.earlyQuarter?('wk '+E.weeksCompleted+' of '+E.qtdWeeks.length+' &middot; early'):(qtdPct+'% of goal'))+'</div></div>'
      +'<div class="dc2-stat"><div class="dc2-sl">'+E.yr+' YTD</div><div class="dc2-sv">$'+Math.round(t.ytdRev).toLocaleString()+'</div><div class="dc2-ss dc-flat">'+t.ytdOrders.toLocaleString()+' orders</div></div>'
      +'</div>';
  }else{
    stats='<div class="dc2-stats"><div class="dc2-stat"><div class="dc2-sl">Getting started</div><div class="dc2-ss dc-flat" style="margin-top:4px;">No entered weeks found for '+ctx.calQ+' '+ctx.calYr+' or the prior quarter in this browser. Enter last week\u2019s numbers, or restore a backup in Admin.</div></div></div>';
  }
  var alertRows=alerts.map(function(a){
    return '<div class="dc2-al'+(a.page?'':' dc2-al-static')+'"'+(a.page?(' onclick="_dcNav(\''+a.page+'\')"'):'')+'><span class="dc2-dot dc2-'+a.sev+'"></span><span class="dc2-al-t">'+a.txt+'</span>'+(a.page?'<span class="dc2-al-go">&#8250;</span>':'')+'</div>';
  }).join('');
  var body;
  if(R){
    var cov=R.setSize>0?Math.round(R.accts/R.setSize*100):null;
    var snapRow=function(l,v,s){return '<div class="dc2-al dc2-al-static" style="justify-content:space-between;"><span class="dc-flat">'+l+'</span><span style="font-weight:800;">'+v+(s?' <span class="dc-flat" style="font-weight:400;">'+s+'</span>':'')+'</span></div>';};
    var snap='<div class="dc2-brief"><div class="dc2-panel-h"><span>'+_m2esc(R.name.split(' ')[0])+'&#8217;s snapshot &middot; '+_dcWkShort(E.prev)+'</span></div>'
      +snapRow('Top sale (wk)',R.topSale>0?('$'+Math.round(R.topSale).toLocaleString()):'&mdash;',_m2esc(R.topSaleCustomer||''))
      +snapRow('Quarter best',R.qTop>0?('$'+Math.round(R.qTop).toLocaleString()):'&mdash;',_m2esc(R.qTopCust||''))
      +snapRow('Avg order value',R.wkOrders>0?('$'+Math.round(R.aov).toLocaleString()):'&mdash;','wk')
      +snapRow('Coverage',cov!=null?(cov+'%'):'&mdash;',R.setSize>0?(R.accts.toLocaleString()+'/'+R.setSize.toLocaleString()):'')
      +snapRow('Art errors',String(R.art),R.qtdArt>0?(R.qtdArt+' QTD'):'')
      +snapRow('Credits (rep-fault)','$'+Math.round(R.credits).toLocaleString(),'wk')
      +'</div>';
    var flags=[];
    var pacedR=R.goalRev*(E.weeksCompleted/E.qtdWeeks.length);
    if(E.weeksCompleted>=4&&R.goalRev>0&&R.qtdRev<pacedR*0.7)flags.push({sev:'red',txt:'Under 70% of paced goal'});
    var ravg=E.weeksCompleted>1?(R.qtdRev/E.weeksCompleted):0;
    if(ravg>1000&&R.wkRev<ravg*0.5&&R.wkRev>0)flags.push({sev:'amber',txt:'Revenue dip vs personal avg ($'+Math.round(ravg).toLocaleString()+'/wk)'});
    if(R.wkCalls===0&&(R.wkRev>0||R.wkOrders>0))flags.push({sev:'amber',txt:'Zero calls logged in '+_dcWkShort(E.prev)});
    if(R.art>=3)flags.push({sev:'amber',txt:R.art+' art errors in '+_dcWkShort(E.prev)});
    if(R.credits>0)flags.push({sev:'amber',txt:'$'+Math.round(R.credits).toLocaleString()+' rep-fault credits in '+_dcWkShort(E.prev)});
    if(R.wkRev===0&&R.wkOrders===0&&R.wkCalls===0)flags.push({sev:'amber',txt:'No data entered for '+_dcWkShort(E.prev)});
    if(flags.length===0)flags.push({sev:'green',txt:'No flags \u2014 clean week'});
    var flagRows=flags.map(function(f){return '<div class="dc2-al dc2-al-static"><span class="dc2-dot dc2-'+f.sev+'"></span><span class="dc2-al-t">'+f.txt+'</span></div>';}).join('');
    body='<div class="dc2-body">'+snap
      +'<div class="dc2-attn"><div class="dc2-panel-h"><span>'+_m2esc(R.name.split(' ')[0])+'&#8217;s flags</span><span class="dc2-count">'+flags.filter(function(f){return f.sev!=='green';}).length+'</span></div>'+flagRows+'</div>'
      +'</div>'
      +'<div class="dc2-repai"><div class="dc2-panel-h"><span>&#129504; AI read &middot; celebrate &amp; coach</span><button class="dc-mini" onclick="fetchRepInsight(true)" title="Regenerate">&#8635;</button></div><div id="dc-repai-body"><span class="dc-flat">Loading&hellip;</span></div></div>';
  }else{
    body='<div class="dc2-body">'
    +'<div class="dc2-brief"><div class="dc2-panel-h"><span>Today&#8217;s brief</span><button class="dc-mini" onclick="fetchDashBrief(true)" title="Regenerate">&#8635;</button></div><div id="dc-brief-body"><span class="dc-flat">Loading&hellip;</span></div></div>'
    +'<div class="dc2-attn"><div class="dc2-panel-h"><span>Needs attention</span><span class="dc2-count">'+alerts.filter(function(a){return a.sev!=='green';}).length+'</span></div>'+alertRows+'</div>'
    +'</div>';
  }
  var charts='';
  if(E){
    var t3=R||E.team,qp=t3.goalRev>0?Math.round(t3.qtdRev/t3.goalRev*100):0;
    var qSeries=[],qLabels=['Q1','Q2','Q3','Q4'];
    try{qLabels.forEach(function(Q){var wks=gwq(E.yr,Q);var s=0;
      if(R){s=Number((totW(R.name,wks)||{}).revenue||0);}
      else{activeReps().forEach(function(r){s+=Number((totW(r.name,wks)||{}).revenue||0);});}
      qSeries.push(s);});}catch(e){qSeries=[0,0,0,0];}
    function kfmt(v){return v>=1000000?('$'+(v/1000000).toFixed(1).replace(/\.0$/,'')+'M'):(v>=1000?('$'+Math.round(v/1000)+'K'):('$'+Math.round(v)));}
    charts='<div class="dc2-charts">'
      +'<div class="dc2-chart"><div class="dc2-panel-h"><span>Weekly revenue &middot; '+E.q+'</span></div>'+_dcBars(R?R.series:E.teamSeries,E.wkLabels,R?'#00AFEF':'#FA873D',kfmt)+'</div>'
      +'<div class="dc2-chart"><div class="dc2-panel-h"><span>'+E.q+' progress</span><span class="dc2-count">'+qp+'%</span></div><div class="dc-prog"><div class="dc-prog-fill" style="width:'+Math.min(100,qp)+'%;"></div>'+(E.earlyQuarter?'':'<div class="dc-prog-pace" style="left:'+Math.min(100,Math.round(E.weeksCompleted/E.qtdWeeks.length*100))+'%;"></div>')+'</div><div class="dc2-ss dc-flat" style="margin-top:7px;">$'+Math.round(t3.qtdRev).toLocaleString()+' of $'+Math.round(t3.goalRev).toLocaleString()+(E.earlyQuarter?' &middot; projections unlock wk 4':'')+'</div></div>'
      +'<div class="dc2-chart"><div class="dc2-panel-h"><span>'+E.yr+' by quarter</span></div>'+_dcBars(qSeries,qLabels,'#00AFEF',kfmt)+'</div>'
      +'</div>';
  }
  host.innerHTML='<div class="dc2">'+head+stats+body+charts+'</div>';
  if(R)fetchRepInsight(false);else fetchDashBrief(false);
}
async function fetchDashBrief(force){
  var el=document.getElementById('dc-brief-body');if(!el)return;
  var st=window._dashCockpitState;if(!st||!st.E){el.innerHTML='<span class="dc-flat">The brief appears once weekly data exists.</span>';return;}
  var cacheRaw=null;try{cacheRaw=JSON.parse(localStorage.getItem('tcp_daily_brief')||'null');}catch(e){}
  if(!force&&cacheRaw&&cacheRaw.date===st.today&&cacheRaw.weekKey===st.E.prev.key&&cacheRaw.data){renderDashBrief(cacheRaw.data);return;}
  var E=st.E,t=E.team;
  el.innerHTML='<span class="dc-flat">Generating today\u2019s brief&hellip;</span>';
  var alertTxt=st.alerts.map(function(a){return '- '+String(a.txt).replace(/<[^>]+>/g,'').replace(/&middot;/g,'\u00b7');}).join('\n');
  var topics=E.byWk.slice(0,3).map(function(r){return r.name+' $'+Math.round(r.wkRev).toLocaleString();}).join(', ');
  var prompt='You are the daily operating brief for a sales manager at Triple Crown Products (custom apparel). Write for TODAY ('+new Date().toDateString()+').\n'
    +'WORKFLOW NOTE: weekly numbers are batch-entered Monday mornings for the prior week. An empty in-progress week is NORMAL, never call it inactivity.\n'
    +'Last completed week '+E.prev.label+': $'+Math.round(t.wkRev).toLocaleString()+' / '+t.wkOrders+' orders / '+t.wkCalls+' calls'+(t.pwRev!=null&&t.pwRev>0?' (week before: $'+Math.round(t.pwRev).toLocaleString()+')':'')+'.\n'
    +'Daily sales: '+(st.lastDaily?('last logged '+st.lastDaily.date+', running $'+Math.round(st.lastDaily.runningTotal).toLocaleString()):'none logged')+'.\n'
    +E.q+' QTD: $'+Math.round(t.qtdRev).toLocaleString()+' ('+(E.earlyQuarter?('early, wk '+E.weeksCompleted+' of '+E.qtdWeeks.length):(Math.round(t.goalRev>0?t.qtdRev/t.goalRev*100:0)+'% of goal'))+'). YTD $'+Math.round(t.ytdRev).toLocaleString()+'.\n'
    +'Week leaders: '+topics+'.\nCurrent alerts:\n'+alertTxt+'\n'
    +(E.earlyQuarter?'Early quarter: no failure framing on pace.\n':'')
    +'Keep it tight: 2-3 sentences max in "brief". Return ONLY JSON, no fences: {"brief":"2-3 sentence read of where things stand and what matters today","priorities":["3 short specific to-dos for today"]}';
  try{
    var raw=await callAI(prompt,{maxTokens:700,skipCompanyContext:true});
    raw=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').trim();
    var a=raw.indexOf('{'),b=raw.lastIndexOf('}');
    var data=JSON.parse(raw.slice(a,b+1));
    try{localStorage.setItem('tcp_daily_brief',JSON.stringify({date:st.today,weekKey:E.prev.key,data:data}));}catch(e){}
    renderDashBrief(data);
  }catch(e){
    el.innerHTML='<span class="dc-flat">AI brief unavailable \u2014 '+( /api key/i.test(String(e&&e.message))?'add your API key in Admin.':'tap &#8635; to retry.')+'</span>';
  }
}
function renderDashBrief(data){
  var el=document.getElementById('dc-brief-body');if(!el)return;
  var h='<div class="dc-brief-txt">'+_m2esc(data.brief||'')+'</div>';
  if(data.priorities&&data.priorities.length)h+='<ul class="dc-pri">'+data.priorities.map(function(p){return '<li>'+_m2esc(p)+'</li>';}).join('')+'</ul>';
  el.innerHTML=h;
}
async function fetchRepInsight(force){
  var el=document.getElementById('dc-repai-body');if(!el)return;
  var st=window._dashCockpitState,scope=window._dcScope||'';
  if(!st||!st.E||!scope){el.innerHTML='';return;}
  var E=st.E,R=E.reps.find(function(x){return x.name===scope;});
  if(!R){el.innerHTML='';return;}
  var cache=null;try{cache=JSON.parse(localStorage.getItem('tcp_rep_insight')||'null');}catch(e){}
  if(cache&&cache.wk!==E.prev.key)cache=null;
  cache=cache||{wk:E.prev.key,reps:{}};
  if(!force&&cache.reps[R.name]){renderRepInsight(cache.reps[R.name]);return;}
  el.innerHTML='<span class="dc-flat">Reading '+_m2esc(R.name.split(' ')[0])+'\u2019s week\u2026</span>';
  var rank=E.byWk.findIndex(function(x){return x.name===R.name;})+1;
  var teamAvgWk=E.reps.length>0?E.team.wkRev/E.reps.length:0;
  var covP=R.setSize>0?Math.round(R.accts/R.setSize*100):null;
  var prompt='You are a sales manager\u2019s coaching assistant at Triple Crown Products (custom apparel). One rep, one completed week. Be specific, use the numbers, no filler.\n'
    +'Rep: '+R.name+' \u2014 '+E.prev.label+' '+E.yr+' (week '+E.weeksCompleted+' of '+E.qtdWeeks.length+(E.earlyQuarter?', EARLY quarter: no failure framing on pace':'')+').\n'
    +'Week: $'+Math.round(R.wkRev).toLocaleString()+' rev, '+R.wkOrders+' orders, '+R.wkCalls+' calls, AOV '+(R.wkOrders>0?'$'+Math.round(R.aov).toLocaleString():'n/a')+'. Rank #'+rank+' of '+E.reps.length+' (team avg $'+Math.round(teamAvgWk).toLocaleString()+'/rep).\n'
    +'Prior week: '+(R.pwRev!=null?'$'+Math.round(R.pwRev).toLocaleString():'n/a')+'. QTD $'+Math.round(R.qtdRev).toLocaleString()+(R.goalRev>0?' vs $'+Math.round(R.goalRev).toLocaleString()+' goal':'')+'. YTD $'+Math.round(R.ytdRev).toLocaleString()+'.\n'
    +'Top sale (wk): '+(R.topSale>0?'$'+Math.round(R.topSale).toLocaleString()+(R.topSaleCustomer?' ('+R.topSaleCustomer+')':''):'none')+'. Quarter best: '+(R.qTop>0?'$'+Math.round(R.qTop).toLocaleString():'none')+'.\n'
    +'Coverage: '+(covP!=null?covP+'% ('+R.accts+'/'+R.setSize+')':'n/a')+'. Art errors: '+R.art+' wk / '+R.qtdArt+' QTD. Rep-fault credits: $'+Math.round(R.credits).toLocaleString()+' wk.\n'
    +'Weekly revenue series (QTD): ['+R.series.map(function(v){return Math.round(v);}).join(', ')+']\n'
    +'Return ONLY JSON, no fences: {"celebrate":["2-3 bullets, max 18 words each \u2014 genuine wins worth calling out to their face"],"coach":["2-3 bullets, max 18 words each \u2014 the specific thing to work on and how"]}';
  try{
    var raw=await callAI(prompt,{maxTokens:600,skipCompanyContext:true});
    raw=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').trim();
    var a=raw.indexOf('{'),b=raw.lastIndexOf('}');
    var data=JSON.parse(raw.slice(a,b+1));
    cache.reps[R.name]=data;
    try{localStorage.setItem('tcp_rep_insight',JSON.stringify(cache));}catch(e){}
    renderRepInsight(data);
  }catch(e){
    el.innerHTML='<span class="dc-flat">AI read unavailable \u2014 '+( /api key/i.test(String(e&&e.message))?'add your API key in Admin.':'tap \u21bb to retry.')+'</span>';
  }
}
function renderRepInsight(d){
  var el=document.getElementById('dc-repai-body');if(!el)return;
  function list(arr,cls){return '<ul class="dc2-cc-list '+cls+'">'+(arr||[]).map(function(x){return '<li>'+_m2esc(x)+'</li>';}).join('')+'</ul>';}
  el.innerHTML='<div class="dc2-cc">'
    +'<div><div class="dc2-cc-h dc2-cc-good">&#127881; Celebrate</div>'+list(d.celebrate,'good')+'</div>'
    +'<div><div class="dc2-cc-h dc2-cc-fix">&#127919; Coach on</div>'+list(d.coach,'fix')+'</div>'
    +'</div>';
}
window._dcNav=_dcNav;window._dcScopeRep=_dcScopeRep;window._dcOpenProfile=_dcOpenProfile;window.fetchRepInsight=fetchRepInsight;window.renderDashCockpit=renderDashCockpit;window.fetchDashBrief=fetchDashBrief;
window.addEventListener('load',function(){
  setTimeout(function(){try{renderDashCockpit();}catch(e){console.warn('cockpit:',e);}},400);
  setTimeout(function(){try{var ay=(typeof _inbActive==='function')?_inbActive():null;if(ay&&ay.sheetUrl&&typeof refreshInbound==='function')refreshInbound();}catch(e){}},3000);
});
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;
  var oc=b.getAttribute('onclick')||'';
  if(oc.indexOf("gt('dash'")>=0||b.dataset.navLabel==='Dashboard')setTimeout(function(){try{renderDashCockpit();}catch(_e){}},80);
});

/* ===== MODULE: PHASE1-FOUNDATION (manifest + page purpose headers) ===== */
const TCP_MANIFEST={version:606,phase:'Art CSV proxy-fallback fix / Phase 12 base',_note:'Phase 12 — Per-Rep Daily Sales',modules:['tokens','nav-ia','purpose-headers','meeting-report-v2','deadline-calc','daily-sales','inbound','reports']};
try{console.info('%cTCP Sales Tracker v'+TCP_MANIFEST.version+' · '+TCP_MANIFEST.phase,'color:#FA873D;font-weight:bold;');}catch(e){}
const PAGE_PURPOSE={
  dash:['Command center','Today\u2019s picture, week in progress, and what needs your attention.'],
  year:['Year overview','The full-year view \u2014 quarters side by side, momentum over time.'],
  lb:['Leaderboard','Who\u2019s leading and who\u2019s moving \u2014 ranked team standings.'],
  profiles:['Rep profiles','Each rep as a performer \u2014 history, trends, coaching context.'],
  perf:['Performance','Deep performance metrics per rep. (Folding into Rep 360 in Phase 3.)'],
  review:['Reviews','Quarterly reviews \u2014 scored, written, and signed.'],
  hr:['HR & notes','Violations, coaching notes, and accountability tracking.'],
  daily:['Daily sales','Log the running total; see momentum, CORP/SMB split, best days.'],
  intel:['Forecast','Where the quarter is heading and what\u2019s driving it.'],
  inbound:['Inbound leads','Live inbound channel activity from the published sheet.'],
  reviews:['Customer reviews','Google & Trustpilot reviews, weekly $10 payouts, and rep recognition.'],
  customers:['Customer intelligence','New customers, reactivations, and who\u2019s going quiet \u2014 where sales come from.'],
  entry:['Data entry','Weekly numbers in \u2014 everything else in the app feeds from here.'],
  credits:['Credit memos','Cost of errors \u2014 who, why, and how much.'],
  art:['Art errors','Art quality tracking \u2014 catch patterns before they cost money.'],
  prodintel:['Production intelligence','Deadline calculator and production insight in one place.'],
  meeting:['Meeting report','Your weekly management packet \u2014 manager + team versions.'],
  slides:['Sales meeting slides','Generate the weekly sales meeting PowerPoint from the selected meeting week, using the previous week\'s results.'],
  reports:['Reports Hub','Every report \u2014 meeting, quarter, intel \u2014 generated and archived in one place.'],
  history:['Report history','Every generated report, saved and reopenable.'],
  games:['Games','Motivation engine \u2014 competitions and challenges.'],
  gtrack:['Game tracker','Scores and standings for running games.'],
  cknow:['Company knowledge','Train the AI on how TCP actually operates.'],
  admin:['Admin','Data tools, backups, keys, and system control.']
};
window.addEventListener('load',function(){
  try{
    Object.keys(PAGE_PURPOSE).forEach(function(k){
      var pg=document.getElementById('pg-'+k);
      if(!pg||pg.querySelector('.page-purpose'))return;
      var d=document.createElement('div');d.className='page-purpose';
      d.innerHTML='<b>'+PAGE_PURPOSE[k][0]+'</b><span>'+PAGE_PURPOSE[k][1]+'</span>';
      pg.insertBefore(d,pg.firstChild);
    });
  }catch(e){console.warn('purpose headers:',e);}
});

  function pageFromButton(btn){var oc=btn.getAttribute('onclick')||'';var m=oc.match(/gt\(['\"]([^'\"]+)/);return m?m[1]:'';}
  function safeCall(page,btn){if(typeof window.gt==='function')window.gt(page,btn);}
  function setActiveButton(page){document.querySelectorAll('#tabBar .tab').forEach(function(b){b.classList.toggle('active',pageFromButton(b)===page);});}
  window.tcpSetActiveNavButton=setActiveButton;
  function initGroupedNav(){
    var tabBar=document.getElementById('tabBar'); if(!tabBar||tabBar.dataset.groupedNav==='1')return;
    var original=Array.prototype.slice.call(tabBar.querySelectorAll('button.tab')); var byPage={};
    original.forEach(function(btn){var p=pageFromButton(btn); if(p)byPage[p]=btn;}); tabBar.innerHTML=''; tabBar.dataset.groupedNav='1';
    var controls=document.createElement('div'); controls.className='nav-controls'; controls.innerHTML='<button type="button" class="nav-control-btn" id="navRailBtn" title="Collapse / expand sidebar">☰</button><span class="nav-control-label">Menu</span>'; tabBar.appendChild(controls);
    if(byPage.dash){var dashWrap=document.createElement('div');dashWrap.className='nav-standalone';var dashBtn=byPage.dash;dashBtn.classList.add('nav-item','nav-dashboard');dashBtn.dataset.navLabel='Dashboard';dashBtn.dataset.navIcon='🏠';dashBtn.innerHTML='<span class="nav-icon">🏠</span><span class="nav-label">Dashboard</span>';dashBtn.onclick=function(){safeCall('dash',dashBtn);setActiveButton('dash');};dashWrap.appendChild(dashBtn);tabBar.appendChild(dashWrap);}
    NAV_GROUPS.forEach(function(group){var stored=localStorage.getItem('tcp_nav_group_'+group.key);var isOpen=stored===null?group.open:stored==='1';var wrap=document.createElement('div');wrap.className='nav-group'+(isOpen?'':' collapsed');wrap.dataset.group=group.key;var head=document.createElement('button');head.type='button';head.className='nav-group-head';head.innerHTML='<span class="nav-group-icon">'+group.icon+'</span><span class="nav-group-label">'+group.label+'</span><span class="nav-group-chevron">▾</span>';head.addEventListener('click',function(){if(document.body.classList.contains('nav-rail')){document.body.classList.remove('nav-rail');localStorage.setItem('tcp_nav_rail','0');document.querySelectorAll('#tabBar .nav-group').forEach(function(g){g.classList.add('collapsed');if(g.dataset&&g.dataset.group)localStorage.setItem('tcp_nav_group_'+g.dataset.group,'0');});wrap.classList.remove('collapsed');localStorage.setItem('tcp_nav_group_'+group.key,'1');return;}wrap.classList.toggle('collapsed');localStorage.setItem('tcp_nav_group_'+group.key,wrap.classList.contains('collapsed')?'0':'1');});var items=document.createElement('div');items.className='nav-group-items';group.items.forEach(function(item){var page=item[0],label=item[1],icon=item[2];var btn=byPage[page];if(!btn)return;btn.classList.add('nav-item');btn.dataset.navLabel=label;btn.dataset.navIcon=icon;btn.innerHTML='<span class="nav-icon">'+icon+'</span><span class="nav-label">'+label+'</span>';btn.onclick=function(){safeCall(page,btn);setActiveButton(page);};items.appendChild(btn);});wrap.appendChild(head);wrap.appendChild(items);tabBar.appendChild(wrap);});
    document.body.classList.toggle('nav-rail',localStorage.getItem('tcp_nav_rail')==='1');
    var railBtn=document.getElementById('navRailBtn'); if(railBtn)railBtn.addEventListener('click',function(){document.body.classList.toggle('nav-rail');localStorage.setItem('tcp_nav_rail',document.body.classList.contains('nav-rail')?'1':'0');});
    var active=document.querySelector('.page.active'); if(active&&active.id)setActiveButton(active.id.replace('pg-',''));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initGroupedNav);else initGroupedNav();
})();
