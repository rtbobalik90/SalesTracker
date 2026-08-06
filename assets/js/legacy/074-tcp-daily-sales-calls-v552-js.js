
(function(){
 'use strict';

 var VERSION='v552';
 var baseRenderDailyLog=window.renderDailyLog;
 var baseRenderSalesForm=window._drRenderForm;
 var baseSaveSales=window.drSaveRepDay;
 var baseDownloadExcel=window.downloadDailyExcel;
 var baseDownloadPDF=window.downloadDailyPDF;
 var initialized=false;

 function clean(v){return String(v==null?'':v).trim()}
 function n(v){var x=Number(v);return isFinite(x)?x:0}
 function esc(v){
  var s=String(v==null?'':v);
  return typeof esc_html==='function'?esc_html(s):s.replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function money(v){return '$'+Math.round(n(v)).toLocaleString()}
 function dateObj(iso){var d=new Date(String(iso||'')+'T12:00:00');return isNaN(d.getTime())?null:d}
 function isoDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function active(){try{return activeReps()}catch(e){return(S.reps||[]).filter(function(r){return r&&!r.retired})}}
 function ensure(){
  if(!S.dailyCalls||typeof S.dailyCalls!=='object')S.dailyCalls={};
  if(!S.dailyLiveBridge||typeof S.dailyLiveBridge!=='object')S.dailyLiveBridge={};
  if(!S.dailyLiveReconciliation||typeof S.dailyLiveReconciliation!=='object')S.dailyLiveReconciliation={}
 }
 function callDates(){ensure();return Object.keys(S.dailyCalls).filter(function(d){return /^\d{4}-\d{2}-\d{2}$/.test(d)}).sort()}
 function weekStart(dateISO){
  var d=dateObj(dateISO);if(!d)return'';
  d.setDate(d.getDate()-d.getDay());return isoDate(d)
 }
 function callValue(dateISO,rep){
  ensure();var row=S.dailyCalls[dateISO]||{},v=row[rep];
  return v!=null&&v!==''?n(v):null
 }
 function callLatest(dateISO,rep){
  var start=weekStart(dateISO),dates=callDates().filter(function(d){return d>=start&&d<=dateISO});
  for(var i=dates.length-1;i>=0;i--){var v=callValue(dates[i],rep);if(v!=null)return v}
  return 0
 }
 function previousCallDate(dateISO){
  var start=weekStart(dateISO),dates=callDates().filter(function(d){return d<dateISO&&d>=start});
  return dates.length?dates[dates.length-1]:null
 }
 function callDay(dateISO,rep){
  var current=callLatest(dateISO,rep),previousDate=previousCallDate(dateISO);
  var previous=previousDate?callLatest(previousDate,rep):0;
  return Math.max(0,current-previous)
 }
 function callTotals(dateISO){
  var rows=active().map(function(rep){
   var cumulative=callLatest(dateISO,rep.name),day=callDay(dateISO,rep.name);
   return{name:rep.name,cumulative:cumulative,day:day}
  }).filter(function(row){return row.cumulative>0||row.day>0})
   .sort(function(a,b){return b.day-a.day||b.cumulative-a.cumulative});
  return{
   rows:rows,
   daily:rows.reduce(function(sum,row){return sum+row.day},0),
   cumulative:rows.reduce(function(sum,row){return sum+row.cumulative},0),
   top:rows[0]||null
  }
 }
 function salesWtd(dateISO,rep){
  try{return typeof _drWTD==='function'?n(_drWTD(dateISO,rep)):n((S.dailyRep&&S.dailyRep[dateISO]||{})[rep])}catch(e){return 0}
 }
 function weekForDate(dateISO){
  var d=dateObj(dateISO);if(!d)return null;
  var year=d.getFullYear(),years=[year-1,year,year+1];
  for(var yi=0;yi<years.length;yi++){
   for(var qi=0;qi<QTRS.length;qi++){
    var weeks=gwq(years[yi],QTRS[qi]);
    for(var wi=0;wi<weeks.length;wi++){
     var start=new Date(weeks[wi].start),end=new Date(weeks[wi].end);
     start.setHours(0,0,0,0);end.setHours(23,59,59,999);
     if(d>=start&&d<=end)return weeks[wi]
    }
   }
  }
  return null
 }
 function bridgeFor(weekKey,rep,create){
  ensure();
  if(create){
   S.dailyLiveBridge[weekKey]=S.dailyLiveBridge[weekKey]||{};
   S.dailyLiveBridge[weekKey][rep]=S.dailyLiveBridge[weekKey][rep]||{}
  }
  return S.dailyLiveBridge[weekKey]&&S.dailyLiveBridge[weekKey][rep]||null
 }
 function compareBridge(entry,official){
  var salesMatch=Math.abs(n(entry.sales)-n(official.revenue))<0.01;
  var callsMatch=Math.round(n(entry.calls))===Math.round(n(official.acctsCalled!=null?official.acctsCalled:official.calls));
  return{salesMatch:salesMatch,callsMatch:callsMatch,matched:salesMatch&&callsMatch}
 }
 function syncLiveWeek(dateISO){
  ensure();
  var week=weekForDate(dateISO);if(!week)return null;
  var updated=0,locked=0;
  active().forEach(function(rep){
   var sales=salesWtd(dateISO,rep.name),calls=callLatest(dateISO,rep.name);
   var existingBridge=bridgeFor(week.key,rep.name,false);
   if(!existingBridge&&sales===0&&calls===0)return;
   var bridge=bridgeFor(week.key,rep.name,true);
   bridge.sales=sales;bridge.calls=calls;bridge.lastDate=dateISO;bridge.updatedAt=new Date().toISOString();
   var key=rep.name+'|'+week.key,record=Object.assign({},gd(key));
   if(bridge.officialLocked){
    bridge.officialSales=n(record.revenue);
    bridge.officialCalls=n(record.acctsCalled!=null?record.acctsCalled:record.calls);
    var lockedCompare=compareBridge(bridge,record);
    bridge.salesMatch=lockedCompare.salesMatch;bridge.callsMatch=lockedCompare.callsMatch;bridge.matched=lockedCompare.matched;
    locked++;return
   }
   record.revenue=sales;
   record.calls=calls;
   record.acctsCalled=calls;
   record._dailyLive={
    version:VERSION,
    lastDate:dateISO,
    sales:sales,
    calls:calls,
    updatedAt:new Date().toISOString()
   };
   sd(key,record);
   bridge.status='live';
   updated++
  });
  try{markDirty()}catch(e){}
  renderBridge();
  return{week:week,updated:updated,locked:locked}
 }
 function captureWeeklyUpload(){
  ensure();
  var checked=0,matched=0,review=0;
  Object.keys(S.dailyLiveBridge).forEach(function(weekKey){
   Object.keys(S.dailyLiveBridge[weekKey]||{}).forEach(function(rep){
    var bridge=S.dailyLiveBridge[weekKey][rep],record=gd(rep+'|'+weekKey);
    if(!bridge)return;
    /* A weekly upload replaces the S.data object and therefore removes
       _dailyLive. That is the official closeout signal. */
    if(record._dailyLive)return;
    bridge.officialLocked=true;
    bridge.officialSales=n(record.revenue);
    bridge.officialCalls=n(record.acctsCalled!=null?record.acctsCalled:record.calls);
    bridge.officialHours=n(record.hours);
    bridge.officialOrders=n(record.orders);
    bridge.officialAt=new Date().toISOString();
    var comparison=compareBridge(bridge,record);
    bridge.salesMatch=comparison.salesMatch;
    bridge.callsMatch=comparison.callsMatch;
    bridge.matched=comparison.matched;
    bridge.status=comparison.matched?'matched':'review';
    checked++;if(comparison.matched)matched++;else review++
   })
  });
  S.dailyLiveReconciliation.lastUpload={
   at:new Date().toISOString(),checked:checked,matched:matched,review:review
  };
  try{markDirty()}catch(e){}
  renderBridge();
  return S.dailyLiveReconciliation.lastUpload
 }
 function reopenWeek(dateISO){
  var week=weekForDate(dateISO);if(!week)return;
  Object.keys(S.dailyLiveBridge[week.key]||{}).forEach(function(rep){
   var bridge=S.dailyLiveBridge[week.key][rep];
   bridge.officialLocked=false;bridge.status='live';
   delete bridge.officialAt;delete bridge.matched;delete bridge.salesMatch;delete bridge.callsMatch
  });
  syncLiveWeek(dateISO)
 }
 function selectedDate(){
  return clean((document.getElementById('dailyDate')||{}).value)||new Date().toISOString().slice(0,10)
 }
 function selectedMonth(){
  return clean((document.getElementById('dailyViewMonth')||{}).value)||selectedDate().slice(0,7)
 }
 function callFormHtml(){
  ensure();
  var date=selectedDate(),label=typeof formatDateShort==='function'?formatDateShort(date):date;
  return'<div class="v552-call-card"><div class="r3-head"><span class="r3-av" style="background:linear-gradient(135deg,#00AFEF,#5DCAA5)">☎</span>'+
   '<div class="r3-hmeta"><div class="r3-name">Per-rep calls entry</div><div class="r3-sub">Cumulative week-to-date calls · today’s calls are calculated from the prior saved day</div></div></div>'+
   '<div class="v552-call-body"><div class="v552-call-live"><strong>'+esc(label)+'</strong> · Enter each rep’s total calls so far this week. The tracker calculates today’s increase and updates the current weekly record.</div>'+
   '<input type="hidden" id="v552-call-date" value="'+date+'"><div class="dc2-panel-h"><span>Rep cumulative calls</span><span id="v552-call-live" class="dc-flat" style="font-size:11px"></span></div>'+
   '<div class="dr-grid">'+active().map(function(rep){
    var value=(S.dailyCalls[date]&&S.dailyCalls[date][rep.name]!=null)?S.dailyCalls[date][rep.name]:'';
    return'<div class="dr-cell"><label>'+esc(rep.name)+'</label><input type="number" class="r3-in v552-call-input" data-rep="'+esc(rep.name)+'" min="0" step="1" placeholder="0" value="'+value+'" oninput="_v552CallLive()"></div>'
   }).join('')+'</div>'+
   '<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="dc2-act" style="border-color:#00AFEF" onclick="_v552SaveCalls()">☎ Save call totals</button><span id="v552-call-msg" class="dc-up" style="display:none;font-size:11px"></span></div></div></div>'
 }
 function renderCallsForm(){
  var host=document.getElementById('v552-call-form');if(!host)return;
  host.innerHTML=callFormHtml();callLive()
 }
 function callLive(){
  var date=selectedDate(),inputs=document.querySelectorAll('.v552-call-input'),daily=0,cumulative=0;
  inputs.forEach(function(input){
   var current=n(input.value),rep=input.dataset.rep,previousDate=previousCallDate(date),previous=previousDate?callLatest(previousDate,rep):0;
   cumulative+=current;daily+=Math.max(0,current-previous)
  });
  var host=document.getElementById('v552-call-live');
  if(host)host.innerHTML='Today +'+Math.round(daily).toLocaleString()+' calls &middot; week-to-date '+Math.round(cumulative).toLocaleString()
 }
 function saveCalls(){
  ensure();
  var date=selectedDate(),record={};
  document.querySelectorAll('.v552-call-input').forEach(function(input){
   var value=clean(input.value);if(value!=='')record[input.dataset.rep]=Math.max(0,Math.round(n(value)))
  });
  if(Object.keys(record).length)S.dailyCalls[date]=record;else delete S.dailyCalls[date];
  syncLiveWeek(date);
  var msg=document.getElementById('v552-call-msg');
  if(msg){msg.textContent='✓ Calls saved and sent to the weekly tracker';msg.style.display='inline';setTimeout(function(){msg.style.display='none'},2500)}
  renderDailyLog();
  try{if(window.TCP_PERSISTENT_DATA_V550)TCP_PERSISTENT_DATA_V550.saveNow('daily-calls-v552')}catch(e){}
 }
 function polishSalesCard(){
  var card=document.querySelector('#pg-daily #dr-form .daily-rep-entry-card');if(!card)return;
  var name=card.querySelector('.r3-name'),sub=card.querySelector('.r3-sub');
  if(name)name.textContent='Per-rep sales entry';
  if(sub)sub.textContent='Cumulative week-to-date SMB sales · CORP remains a separate cumulative team total';
  var button=[].slice.call(card.querySelectorAll('button')).find(function(btn){return /Save rep totals/i.test(btn.textContent||'')});
  if(button)button.innerHTML='💾 Save sales totals';
 }
 function heroSummary(){
  var date=selectedDate(),month=selectedMonth(),week=weekForDate(date),salesTotals=typeof _drDayTotals==='function'?_drDayTotals(date):{totalDay:0,totalCum:0,smbDay:0,corpDay:0},calls=callTotals(date);
  var monthSales=0,monthCalls=0;
  try{getDailySales().filter(function(row){return row.date.slice(0,7)===month}).forEach(function(row){monthSales+=n(row.dailySales)})}catch(e){}
  callDates().filter(function(d){return d.slice(0,7)===month}).forEach(function(d){monthCalls+=callTotals(d).daily});
  var bridgeRows=week&&S.dailyLiveBridge[week.key]||{},values=Object.keys(bridgeRows).map(function(rep){return bridgeRows[rep]});
  var matched=values.filter(function(row){return row.status==='matched'}).length;
  var review=values.filter(function(row){return row.status==='review'}).length;
  var bridgeLabel=review?'Needs review':matched?'Upload matched':'Live';
  var bridgeCopy=review?review+' rep'+(review===1?'':'s')+' differ from upload':matched+' matched after weekly upload';
  return[
   {label:'Activity date',value:typeof formatDateShort==='function'?formatDateShort(date):date,copy:week?week.label:'Tracker week not found'},
   {label:'Sales today',value:money(salesTotals.totalDay),copy:money(salesTotals.totalCum)+' week-to-date'},
   {label:'Calls today',value:Math.round(calls.daily).toLocaleString(),copy:Math.round(calls.cumulative).toLocaleString()+' week-to-date'},
   {label:'Month sales',value:money(monthSales),copy:'Selected month live total'},
   {label:'Month calls',value:Math.round(monthCalls).toLocaleString(),copy:'Selected month daily increases'},
   {label:'Weekly closeout',value:bridgeLabel,copy:bridgeCopy}
  ]
 }
 function renderHeroSummary(){
  var host=document.getElementById('v552-banner');if(!host)return;
  host.innerHTML=heroSummary().map(function(card){
   return'<div class="v552-banner-card"><span>'+esc(card.label)+'</span><strong>'+esc(card.value)+'</strong><p>'+esc(card.copy)+'</p></div>'
  }).join('')
 }
 function reconciliationRows(){
  var date=selectedDate(),week=weekForDate(date);
  if(!week)return{week:null,rows:[]};
  ensure();
  return{
   week:week,
   rows:active().map(function(rep){
    var bridge=bridgeFor(week.key,rep.name,false)||{};
    var record=gd(rep.name+'|'+week.key);
    var hasLive=ownData(bridge);
    var state='waiting',label='Waiting for daily entry';
    if(hasLive){
     if(bridge.status==='matched'){state='matched';label='Matched'}
     else if(bridge.status==='review'){state='review';label='Needs review'}
     else{state='live';label='Live'}
    }
    return{
     rep:rep.name,
     liveSales:n(bridge.sales),
     officialSales:n(record.revenue),
     liveCalls:n(bridge.calls),
     officialCalls:n(record.acctsCalled!=null?record.acctsCalled:record.calls),
     hours:n(record.hours),
     orders:n(record.orders),
     state:state,label:label,
     salesMatch:bridge.salesMatch,
     callsMatch:bridge.callsMatch
    }
   })
  }
 }
 function ownData(bridge){return bridge&&('sales' in bridge||'calls' in bridge)}
 function renderBridge(){
  renderHeroSummary();
  var host=document.getElementById('v552-reconcile');if(!host)return;
  var data=reconciliationRows(),rows=data.rows;
  var review=rows.filter(function(row){return row.state==='review'}).length;
  var matched=rows.filter(function(row){return row.state==='matched'}).length;
  var live=rows.filter(function(row){return row.state==='live'}).length;
  var state=review?'review':matched?'matched':'live';
  var stateLabel=review?'Needs review':matched?'Weekly upload matched':'Live daily bridge';
  host.innerHTML='<div class="v552-reconcile-head"><div><div class="daily-section-kicker">End-of-week reconciliation</div><h2>'+esc(data.week?data.week.label:'Tracker week')+'</h2>'+
   '<p>Sales and calls populate the tracker now. The spreadsheet later adds orders and work hours and confirms whether its sales/calls match the live entries.</p></div>'+
   '<span class="v552-reconcile-state '+state+'">'+stateLabel+'</span></div>'+
   '<div class="v552-reconcile-table-wrap"><table class="v552-reconcile-table"><thead><tr><th>Rep</th><th>Live sales</th><th>Weekly sales</th><th>Live calls</th><th>Weekly calls</th><th>Orders</th><th>Hours</th><th>Status</th></tr></thead><tbody>'+
   rows.map(function(row){
    return'<tr><td><strong>'+esc(row.rep)+'</strong></td><td>'+money(row.liveSales)+'</td><td>'+money(row.officialSales)+'</td><td>'+Math.round(row.liveCalls)+'</td><td>'+Math.round(row.officialCalls)+'</td><td>'+Math.round(row.orders)+'</td><td>'+row.hours.toFixed(1)+'</td><td><span class="v552-match '+row.state+'">'+row.label+'</span></td></tr>'
   }).join('')+'</tbody></table></div>'+
   (matched||review?'<div class="v552-entry-note"><strong style="color:#fff">'+matched+' matched · '+review+' need review.</strong> Once the spreadsheet is uploaded, its weekly record is treated as official. Daily entries remain visible for auditing and comparison.</div>':
    '<div class="v552-entry-note"><strong style="color:#fff">Live mode.</strong> Orders and work hours will remain blank until the weekly spreadsheet is uploaded. Art Errors and Credit Memos already flow live from their own sections.</div>')
 }
 function decorateCalendar(){
  document.querySelectorAll('#pg-daily .daily-day-cell[data-date]').forEach(function(cell){
   var date=cell.dataset.date,old=cell.querySelector('.v552-call-day');if(old)old.remove();
   var totals=callTotals(date);
   if(totals.daily||totals.cumulative){
    cell.classList.add('has-calls');
    var badge=document.createElement('div');badge.className='v552-call-day';
    badge.innerHTML='☎ +'+Math.round(totals.daily).toLocaleString()+' calls <span>· '+Math.round(totals.cumulative).toLocaleString()+' WTD</span>';
    var del=cell.querySelector('.daily-delete-btn');
    if(del)cell.insertBefore(badge,del);else cell.appendChild(badge);
    if(!cell.getAttribute('onclick')){
     cell.classList.add('daily-clickable');
     cell.setAttribute('onclick',"dailyOpenDayDetail('"+date+"')")
    }
   }else cell.classList.remove('has-calls')
  })
 }
 function upgradePage(){
  var page=document.getElementById('pg-daily');if(!page)return;
  var hero=page.querySelector('.daily-hero');
  if(hero&&!document.getElementById('v552-hero-tools')){
   hero.insertAdjacentHTML('beforeend','<div id="v552-hero-tools" class="v552-hero-tools"><label class="v552-hero-field">Activity date<div id="v552-date-mount"></div></label>'+
    '<label class="v552-hero-field">Calendar month<div id="v552-month-mount"></div></label>'+
    '<div class="v552-hero-actions"><button class="primary" onclick="downloadDailyExcel()">↓ Sales & Calls Excel</button><button onclick="downloadDailyPDF()">▤ Sales & Calls PDF</button><button class="danger" onclick="clearDailyLog()">Clear daily entries</button></div></div>'+
    '<div id="v552-banner" class="v552-banner"></div>')
   var date=document.getElementById('dailyDate'),month=document.getElementById('dailyViewMonth');
   var dateMount=document.getElementById('v552-date-mount'),monthMount=document.getElementById('v552-month-mount');
   if(date&&dateMount){dateMount.appendChild(date);date.setAttribute('onchange',"_v552DateChanged()")}
   if(month&&monthMount){monthMount.appendChild(month);month.setAttribute('onchange',"renderDailyLog()")}
  }
  var body=page.querySelector('.daily-entry-married-body');
  if(body&&!document.getElementById('v552-entry-grid')){
   var sales=document.getElementById('dr-form');
   body.innerHTML='<div id="v552-entry-grid" class="v552-entry-grid"><div id="v552-sales-mount"></div><div id="v552-call-form"></div></div>'+
    '<div class="v552-entry-note"><strong style="color:#fff">Live performance bridge:</strong> Sales and calls immediately update the weekly tracker, rankings, manager profiles, rep portal, and reports. Art Errors and Credit Memos already update live. Orders and Work Hours are added during the official weekly spreadsheet upload.</div>';
   var salesMount=document.getElementById('v552-sales-mount');if(sales&&salesMount)salesMount.appendChild(sales)
  }
  var calendarPanel=page.querySelector('.daily-log-panel');
  if(calendarPanel&&!document.getElementById('v552-reconcile')){
   calendarPanel.insertAdjacentHTML('beforebegin','<section id="v552-reconcile" class="v552-reconcile"></section>')
  }
  initialized=true;
  renderCallsForm();polishSalesCard();renderBridge();decorateCalendar()
 }
 function dateChanged(){
  if(typeof baseRenderSalesForm==='function')baseRenderSalesForm();
  renderCallsForm();polishSalesCard();renderDailyLog();renderBridge()
 }
 function combinedDayPopup(dateISO){
  var sales=typeof _drDayTotals==='function'?_drDayTotals(dateISO):{rows:[],smbDay:0,corpDay:0,totalDay:0,totalCum:0};
  var calls=callTotals(dateISO),repMap={};
  active().forEach(function(rep){repMap[rep.name]={name:rep.name,salesDay:0,salesCum:0,callsDay:0,callsCum:0}});
  (sales.rows||[]).forEach(function(row){repMap[row.name]=repMap[row.name]||{name:row.name};repMap[row.name].salesDay=n(row.day);repMap[row.name].salesCum=n(row.cum)});
  calls.rows.forEach(function(row){repMap[row.name]=repMap[row.name]||{name:row.name};repMap[row.name].callsDay=n(row.day);repMap[row.name].callsCum=n(row.cumulative)});
  var rows=Object.keys(repMap).map(function(key){return repMap[key]}).filter(function(row){return n(row.salesDay)||n(row.salesCum)||n(row.callsDay)||n(row.callsCum)})
   .sort(function(a,b){return n(b.salesDay)-n(a.salesDay)||n(b.callsDay)-n(a.callsDay)});
  var label=typeof formatDateShort==='function'?formatDateShort(dateISO):dateISO;
  var html='<div class="daily-rep-popup"><div class="r3m-h"><span class="r3-pill">Daily sales & calls</span><div class="r3m-title">'+esc(label)+'</div></div>'+
   '<div class="dc2-stats" style="grid-template-columns:repeat(4,1fr);border:1px solid var(--tcp-line);border-radius:10px;margin-bottom:10px">'+
   '<div class="dc2-stat"><div class="dc2-sl">Sales day</div><div class="dc2-sv" style="font-size:16px;color:#FFD27A">'+money(sales.totalDay)+'</div></div>'+
   '<div class="dc2-stat"><div class="dc2-sl">Sales WTD</div><div class="dc2-sv" style="font-size:16px">'+money(sales.totalCum)+'</div></div>'+
   '<div class="dc2-stat"><div class="dc2-sl">Calls day</div><div class="dc2-sv" style="font-size:16px;color:#8EDCFA">'+Math.round(calls.daily)+'</div></div>'+
   '<div class="dc2-stat"><div class="dc2-sl">Calls WTD</div><div class="dc2-sv" style="font-size:16px">'+Math.round(calls.cumulative)+'</div></div></div>'+
   '<div class="dc2-panel-h"><span>Rep activity · daily and cumulative</span><span class="dc-flat">'+rows.length+' reps</span></div>'+
   (rows.length?rows.map(function(row,index){
    return'<div class="r3m-row"><span style="display:flex;gap:8px;align-items:center"><span class="dc-flat">'+(index+1)+'</span><strong>'+esc(row.name)+'</strong></span>'+
     '<span style="text-align:right"><b style="color:#A7FFC0">'+money(row.salesDay)+'</b> sales · <b style="color:#8EDCFA">+'+Math.round(n(row.callsDay))+'</b> calls<br><span class="dc-flat">'+money(row.salesCum)+' sales WTD · '+Math.round(n(row.callsCum))+' calls WTD</span></span></div>'
   }).join(''):'<div class="daily-popup-note">No sales or calls have been saved for this date.</div>')+'</div>';
  if(typeof _r360Modal==='function')_r360Modal(html);else alert(label+' · '+money(sales.totalDay)+' sales · '+calls.daily+' calls')
 }
 function exportRows(month){
  var dates={},salesMap={};
  try{getDailySales().forEach(function(row){if(row.date.slice(0,7)===month){dates[row.date]=1;salesMap[row.date]=row}})}catch(e){}
  callDates().forEach(function(date){if(date.slice(0,7)===month)dates[date]=1});
  return Object.keys(dates).sort().map(function(date){
   var sale=salesMap[date]||{},calls=callTotals(date);
   return{
    date:date,
    day:new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'}),
    dailySales:n(sale.dailySales),
    corp:n(sale.corpSales),
    smb:n(sale.smbSales),
    running:n(sale.runningTotal),
    dailyCalls:calls.daily,
    cumulativeCalls:calls.cumulative
   }
  })
 }
 function downloadExcel(){
  if(typeof XLSX==='undefined'){if(typeof baseDownloadExcel==='function')return baseDownloadExcel();alert('Excel library not loaded.');return}
  var month=selectedMonth(),rows=exportRows(month);
  var summary=[['Date','Day','Daily Sales','CORP Sales','SMB Sales','Running Sales Total','Daily Calls','Week-to-Date Calls']]
   .concat(rows.map(function(row){return[row.date,row.day,row.dailySales,row.corp,row.smb,row.running,row.dailyCalls,row.cumulativeCalls]}));
  var repRows=[['Date','Rep','Daily Sales','Cumulative Sales','Daily Calls','Cumulative Calls']];
  Object.keys(S.dailyRep||{}).concat(callDates()).filter(function(value,index,array){return array.indexOf(value)===index&&value.slice(0,7)===month}).sort().forEach(function(date){
   active().forEach(function(rep){
    var sd=typeof _drRepDay==='function'?n(_drRepDay(date,rep.name)):0,sc=salesWtd(date,rep.name),cd=callDay(date,rep.name),cc=callLatest(date,rep.name);
    if(sd||sc||cd||cc)repRows.push([date,rep.name,sd,sc,cd,cc])
   })
  });
  var wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(summary),repWs=XLSX.utils.aoa_to_sheet(repRows);
  ws['!cols']=[{wch:13},{wch:12},{wch:16},{wch:15},{wch:15},{wch:20},{wch:14},{wch:20}];
  repWs['!cols']=[{wch:13},{wch:24},{wch:15},{wch:18},{wch:14},{wch:18}];
  XLSX.utils.book_append_sheet(wb,ws,'Daily Sales & Calls');
  XLSX.utils.book_append_sheet(wb,repWs,'Rep Daily Activity');
  XLSX.writeFile(wb,'daily_sales_calls_'+month+'.xlsx')
 }
 function downloadPDF(){
  var month=selectedMonth(),rows=exportRows(month),label=new Date(month+'-01T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
  var html='<!doctype html><html><head><meta charset="utf-8"><title>Daily Sales & Calls</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:24px}.head{display:flex;justify-content:space-between;border-bottom:3px solid #FA873D;padding-bottom:14px;margin-bottom:16px}.title{font-size:24px;font-weight:900}.sub{color:#64748B;margin-top:4px}.badge{padding:7px 10px;border-radius:999px;background:#E6F7FC;color:#00789E;font-size:10px;font-weight:800}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #E5E7EB;text-align:right;font-size:10px}th{background:#F1F5F9;color:#475569;text-transform:uppercase}th:first-child,td:first-child,th:nth-child(2),td:nth-child(2){text-align:left}.foot{margin-top:18px;color:#64748B;font-size:9px}@media print{button{display:none}}</style></head><body>'+
   '<div class="head"><div><div class="title">Daily Sales & Calls</div><div class="sub">'+label+' · generated '+new Date().toLocaleDateString()+'</div></div><span class="badge">Live + weekly reconciliation</span></div>'+
   '<table><thead><tr><th>Date</th><th>Day</th><th>Daily sales</th><th>CORP</th><th>SMB</th><th>Running total</th><th>Daily calls</th><th>Calls WTD</th></tr></thead><tbody>'+
   rows.map(function(row){return'<tr><td>'+esc(row.date)+'</td><td>'+esc(row.day)+'</td><td>'+money(row.dailySales)+'</td><td>'+money(row.corp)+'</td><td>'+money(row.smb)+'</td><td>'+money(row.running)+'</td><td>'+Math.round(row.dailyCalls)+'</td><td>'+Math.round(row.cumulativeCalls)+'</td></tr>'}).join('')+
   '</tbody></table><div class="foot">Sales and calls are entered live. Orders and work hours are finalized through the weekly spreadsheet upload.</div><script>window.onload=function(){window.print()}<\/script></body></html>';
  var win=window.open('','_blank');if(win){win.document.write(html);win.document.close()}else alert('Please allow pop-ups to create the PDF.')
 }

 window._v552CallLive=callLive;
 window._v552SaveCalls=saveCalls;
 window._v552DateChanged=dateChanged;
 window._v552CaptureWeeklyUpload=captureWeeklyUpload;
 window._v552ReopenWeek=function(){reopenWeek(selectedDate())};

 window._drRenderForm=function(){
  var result=typeof baseRenderSalesForm==='function'?baseRenderSalesForm.apply(this,arguments):undefined;
  setTimeout(function(){polishSalesCard();renderCallsForm()},0);
  return result
 };
 window.drSaveRepDay=function(){
  var date=selectedDate();
  var result=typeof baseSaveSales==='function'?baseSaveSales.apply(this,arguments):undefined;
  syncLiveWeek(date);
  setTimeout(function(){polishSalesCard();renderCallsForm();renderDailyLog()},0);
  try{if(window.TCP_PERSISTENT_DATA_V550)TCP_PERSISTENT_DATA_V550.saveNow('daily-sales-v552')}catch(e){}
  return result
 };
 window.renderDailyLog=function(){
  var result=typeof baseRenderDailyLog==='function'?baseRenderDailyLog.apply(this,arguments):undefined;
  setTimeout(function(){upgradePage();decorateCalendar();renderHeroSummary();renderBridge()},0);
  return result
 };
 window.dailyOpenDayDetail=combinedDayPopup;
 window.drDayPopup=combinedDayPopup;
 window.downloadDailyExcel=downloadExcel;
 window.downloadDailyPDF=downloadPDF;

 var baseSetup=window.setupDailyTab;
 window.setupDailyTab=function(){
  var result=typeof baseSetup==='function'?baseSetup.apply(this,arguments):undefined;
  setTimeout(function(){upgradePage();renderDailyLog()},0);
  return result
 };

 window.TCP_DAILY_SALES_CALLS_V552={
  version:VERSION,
  ensure:ensure,
  callLatest:callLatest,
  callDay:callDay,
  callTotals:callTotals,
  weekForDate:weekForDate,
  syncLiveWeek:syncLiveWeek,
  captureWeeklyUpload:captureWeeklyUpload,
  reconciliationRows:reconciliationRows,
  exportRows:exportRows,
  render:upgradePage
 };

 ensure();
 setTimeout(function(){
  var page=document.getElementById('pg-daily');
  if(page){upgradePage();if(page.classList.contains('active'))renderDailyLog()}
 },150)
})();
