
(function(){
 'use strict';

 var VERSION='v555';
 var baseRenderDailyLog=window.renderDailyLog;
 var baseSetupDailyTab=window.setupDailyTab;
 var baseDateChanged=window._v552DateChanged;

 function clean(value){return String(value==null?'':value).trim()}
 function n(value){var number=Number(value);return isFinite(number)?number:0}
 function esc(value){
  var string=String(value==null?'':value);
  return typeof esc_html==='function'?esc_html(string):string.replace(/[&<>"]/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
  })
 }
 function money(value){return '$'+Math.round(n(value)).toLocaleString()}
 function selectedDate(){
  return clean((document.getElementById('dailyDate')||{}).value)||new Date().toISOString().slice(0,10)
 }
 function selectedMonth(){
  return clean((document.getElementById('dailyViewMonth')||{}).value)||selectedDate().slice(0,7)
 }
 function callTotals(dateISO){
  try{
   if(window.TCP_DAILY_SALES_CALLS_V552&&typeof TCP_DAILY_SALES_CALLS_V552.callTotals==='function'){
    return TCP_DAILY_SALES_CALLS_V552.callTotals(dateISO)
   }
  }catch(e){}
  return{rows:[],daily:0,cumulative:0}
 }
 function salesTotals(dateISO){
  var totals={rows:[],smbDay:0,corpDay:0,totalDay:0,totalCum:0};
  try{
   if(typeof _drDayTotals==='function')totals=_drDayTotals(dateISO)||totals
  }catch(e){}
  var dailyEntry=null;
  try{
   dailyEntry=(typeof getDailySales==='function'?getDailySales():[]).filter(function(entry){
    return entry&&entry.date===dateISO
   })[0]||null
  }catch(e){}
  var hasRep=(totals.rows&&totals.rows.length>0)||n(totals.smbDay)>0||n(totals.corpDay)>0;
  var corpDay=n(totals.corpDay)>0?n(totals.corpDay):(dailyEntry?n(dailyEntry.corpSales):0);
  return{
   rows:totals.rows||[],
   smbDay:hasRep?n(totals.smbDay):(dailyEntry?n(dailyEntry.smbSales):n(totals.smbDay)),
   corpDay:corpDay,
   totalDay:hasRep?n(totals.smbDay)+corpDay:(dailyEntry?n(dailyEntry.dailySales):n(totals.totalDay)),
   totalCum:dailyEntry&&n(dailyEntry.runningTotal)>0?n(dailyEntry.runningTotal):n(totals.totalCum)
  }
 }
 function closeDailyModal(){
  var modal=document.getElementById('v555-daily-modal');
  if(modal)modal.remove()
 }
 function openDailyModal(html){
  closeDailyModal();
  var overlay=document.createElement('div');
  overlay.id='v555-daily-modal';
  overlay.className='r3m-ov';
  overlay.innerHTML='<div class="r3m-card v555-daily-modal-card">'+html+
   '<button class="r3m-x" onclick="_v555CloseDailyModal()" aria-label="Close daily breakdown">&times;</button></div>';
  overlay.addEventListener('click',function(event){
   if(event.target===overlay)closeDailyModal()
  });
  document.body.appendChild(overlay)
 }
 function combinedRows(dateISO,sales,calls){
  var map={};
  (sales.rows||[]).forEach(function(row){
   map[row.name]=map[row.name]||{name:row.name,salesDay:0,salesCum:0,callsDay:0,callsCum:0};
   map[row.name].salesDay=n(row.day);
   map[row.name].salesCum=n(row.cum)
  });
  (calls.rows||[]).forEach(function(row){
   map[row.name]=map[row.name]||{name:row.name,salesDay:0,salesCum:0,callsDay:0,callsCum:0};
   map[row.name].callsDay=n(row.day);
   map[row.name].callsCum=n(row.cumulative)
  });
  return Object.keys(map).map(function(key){return map[key]}).filter(function(row){
   return row.salesDay||row.salesCum||row.callsDay||row.callsCum
  }).sort(function(a,b){
   return b.salesDay-a.salesDay||b.callsDay-a.callsDay||b.salesCum-a.salesCum||a.name.localeCompare(b.name)
  })
 }
 function dailyBreakdown(dateISO){
  var sales=salesTotals(dateISO),calls=callTotals(dateISO),rows=combinedRows(dateISO,sales,calls);
  var label=typeof formatDateShort==='function'?formatDateShort(dateISO):dateISO;
  var rowHtml=rows.length?rows.map(function(row,index){
   return'<div class="v555-rep-row">'+
    '<div class="v555-rank">'+(index+1)+'</div>'+
    '<div class="v555-rep-name">'+esc(row.name)+(index===0&&row.salesDay>0?'<span class="v555-top-tag">Top sales</span>':'')+
     '<small>Daily and cumulative activity</small></div>'+
    '<div class="v555-value"><strong>+'+money(row.salesDay)+'</strong><span>'+money(row.salesCum)+' sales WTD</span></div>'+
    '<div class="v555-value calls"><strong>+'+Math.round(row.callsDay).toLocaleString()+' calls</strong><span>'+Math.round(row.callsCum).toLocaleString()+' calls WTD</span></div>'+
   '</div>'
  }).join(''):'<div class="v555-empty">No per-rep sales or call totals were saved for this day. The team totals remain visible above.</div>';

  var html='<div class="daily-rep-popup">'+
   '<div class="r3m-h"><span class="r3-pill">Daily Sales &amp; Calls</span><div class="r3m-title">'+esc(label)+'</div></div>'+
   '<div class="v555-day-summary">'+
    '<div class="v555-day-stat sales"><span>SMB sales · day</span><strong>+'+money(sales.smbDay)+'</strong></div>'+
    '<div class="v555-day-stat corp"><span>CORP sales · day</span><strong>+'+money(sales.corpDay)+'</strong></div>'+
    '<div class="v555-day-stat"><span>Total sales · day</span><strong>+'+money(sales.totalDay)+'</strong></div>'+
    '<div class="v555-day-stat calls"><span>Calls · day</span><strong>+'+Math.round(calls.daily).toLocaleString()+'</strong></div>'+
   '</div>'+
   '<div class="v555-running-strip">'+
    '<div class="v555-running-item"><span>Running sales total</span><strong>'+money(sales.totalCum)+'</strong></div>'+
    '<div class="v555-running-item"><span>Team calls week-to-date</span><strong>'+Math.round(calls.cumulative).toLocaleString()+'</strong></div>'+
   '</div>'+
   '<div class="v555-rep-head"><div>Rank</div><div>Rep</div><div>Sales</div><div>Calls</div></div>'+
   rowHtml+
  '</div>';

  openDailyModal(html)
 }
 function moveDateToEntryHeader(){
  var page=document.getElementById('pg-daily');
  if(!page)return;

  var head=page.querySelector('.daily-entry-married-head');
  var date=document.getElementById('dailyDate');
  if(!head||!date)return;

  var actions=document.getElementById('v555-entry-head-actions');
  if(!actions){
   actions=document.createElement('div');
   actions.id='v555-entry-head-actions';
   actions.className='v555-entry-head-actions';
   actions.innerHTML='<label class="v555-entry-date"><span>Activity date</span><div id="v555-date-mount"></div></label>';
   var status=head.querySelector('.daily-status-pill');
   head.appendChild(actions);
   if(status)actions.appendChild(status)
  }

  var mount=document.getElementById('v555-date-mount');
  if(mount&&date.parentElement!==mount)mount.appendChild(date);
  date.setAttribute('onchange',"_v555DailyDateChanged()");

  var oldMount=document.getElementById('v552-date-mount');
  if(oldMount&&oldMount.parentElement){
   var oldLabel=oldMount.parentElement;
   if(oldLabel!==mount&&oldLabel.parentElement)oldLabel.remove()
  }

  var heroTools=document.getElementById('v552-hero-tools');
  if(heroTools)heroTools.classList.add('v555-hero-tools-compact')
 }
 function moveReconciliationBelowCalendar(){
  var page=document.getElementById('pg-daily');
  if(!page)return;
  var calendar=page.querySelector('.daily-log-panel');
  var reconciliation=document.getElementById('v552-reconcile');
  if(calendar&&reconciliation&&calendar.nextElementSibling!==reconciliation){
   calendar.insertAdjacentElement('afterend',reconciliation)
  }
 }
 function fixHeroMonthTotals(){
  var banner=document.getElementById('v552-banner');
  if(!banner)return;
  var month=selectedMonth(),rows=[];
  try{
   if(window.TCP_DAILY_SALES_CALLS_V552&&typeof TCP_DAILY_SALES_CALLS_V552.exportRows==='function'){
    rows=TCP_DAILY_SALES_CALLS_V552.exportRows(month)||[]
   }
  }catch(e){}
  var monthSales=rows.reduce(function(sum,row){return sum+n(row.dailySales)},0);
  var monthCalls=rows.reduce(function(sum,row){return sum+n(row.dailyCalls)},0);
  [].slice.call(banner.querySelectorAll('.v552-banner-card')).forEach(function(card){
   var label=clean((card.querySelector('span')||{}).textContent).toLowerCase();
   var value=card.querySelector('strong');
   var copy=card.querySelector('p');
   if(label==='month sales'){
    if(value)value.textContent=money(monthSales);
    if(copy)copy.textContent='Selected month live total';
    card.classList.add('v555-corrected-card')
   }else if(label==='month calls'){
    if(value)value.textContent=Math.round(monthCalls).toLocaleString();
    if(copy)copy.textContent='Selected month daily increases';
    card.classList.add('v555-corrected-card')
   }
  })
 }
 function applyDailyFlow(){
  moveDateToEntryHeader();
  moveReconciliationBelowCalendar();
  fixHeroMonthTotals()
 }
 function dateChanged(){
  if(typeof baseDateChanged==='function')baseDateChanged();
  else{
   try{if(typeof _drRenderForm==='function')_drRenderForm()}catch(e){}
   try{if(typeof renderDailyLog==='function')renderDailyLog()}catch(e){}
  }
  setTimeout(applyDailyFlow,10);
  setTimeout(applyDailyFlow,100)
 }

 window._v555CloseDailyModal=closeDailyModal;
 window._v555DailyDateChanged=dateChanged;
 window.dailyOpenDayDetail=dailyBreakdown;
 window.drDayPopup=dailyBreakdown;

 window.renderDailyLog=function(){
  var result=typeof baseRenderDailyLog==='function'?baseRenderDailyLog.apply(this,arguments):undefined;
  setTimeout(applyDailyFlow,10);
  setTimeout(applyDailyFlow,100);
  return result
 };

 if(typeof baseSetupDailyTab==='function'){
  window.setupDailyTab=function(){
   var result=baseSetupDailyTab.apply(this,arguments);
   setTimeout(applyDailyFlow,10);
   setTimeout(applyDailyFlow,120);
   return result
  }
 }

 window.TCP_DAILY_CALENDAR_FLOW_V555={
  version:VERSION,
  apply:applyDailyFlow,
  salesTotals:salesTotals,
  callTotals:callTotals,
  combinedRows:combinedRows,
  openDay:dailyBreakdown,
  moveDate:moveDateToEntryHeader,
  moveReconciliation:moveReconciliationBelowCalendar,
  fixMonthTotals:fixHeroMonthTotals
 };

 setTimeout(applyDailyFlow,180);
 setTimeout(applyDailyFlow,700)
})();
