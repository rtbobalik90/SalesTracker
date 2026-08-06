
(function(){
 'use strict';

 var VERSION='v556';
 var baseRenderDailyLog=window.renderDailyLog;
 var baseSetupDailyTab=window.setupDailyTab;

 function clean(value){return String(value==null?'':value).trim()}
 function n(value){var number=Number(value);return isFinite(number)?number:0}
 function esc(value){
  var string=String(value==null?'':value);
  return typeof esc_html==='function'?esc_html(string):string.replace(/[&<>"]/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
  })
 }
 function money(value){return '$'+Math.round(n(value)).toLocaleString()}
 function shortName(name){
  var parts=clean(name).split(/\s+/);
  return parts[0]||clean(name)
 }
 function salesTotals(dateISO){
  try{
   if(window.TCP_DAILY_CALENDAR_FLOW_V555&&typeof TCP_DAILY_CALENDAR_FLOW_V555.salesTotals==='function'){
    return TCP_DAILY_CALENDAR_FLOW_V555.salesTotals(dateISO)
   }
  }catch(e){}
  return{rows:[],smbDay:0,corpDay:0,totalDay:0,totalCum:0}
 }
 function callTotals(dateISO){
  try{
   if(window.TCP_DAILY_SALES_CALLS_V552&&typeof TCP_DAILY_SALES_CALLS_V552.callTotals==='function'){
    return TCP_DAILY_SALES_CALLS_V552.callTotals(dateISO)
   }
  }catch(e){}
  return{rows:[],daily:0,cumulative:0,top:null}
 }
 function combinedRows(dateISO,sales,calls){
  try{
   if(window.TCP_DAILY_CALENDAR_FLOW_V555&&typeof TCP_DAILY_CALENDAR_FLOW_V555.combinedRows==='function'){
    return TCP_DAILY_CALENDAR_FLOW_V555.combinedRows(dateISO,sales,calls)
   }
  }catch(e){}
  var map={};
  (sales.rows||[]).forEach(function(row){
   map[row.name]=map[row.name]||{name:row.name,salesDay:0,salesCum:0,callsDay:0,callsCum:0};
   map[row.name].salesDay=n(row.day);map[row.name].salesCum=n(row.cum)
  });
  (calls.rows||[]).forEach(function(row){
   map[row.name]=map[row.name]||{name:row.name,salesDay:0,salesCum:0,callsDay:0,callsCum:0};
   map[row.name].callsDay=n(row.day);map[row.name].callsCum=n(row.cumulative)
  });
  return Object.keys(map).map(function(key){return map[key]}).filter(function(row){
   return row.salesDay||row.salesCum||row.callsDay||row.callsCum
  }).sort(function(a,b){
   return b.salesDay-a.salesDay||b.callsDay-a.callsDay||b.salesCum-a.salesCum||a.name.localeCompare(b.name)
  })
 }
 function closeModal(){
  var modal=document.getElementById('v556-daily-modal');
  if(modal)modal.remove()
 }
 function topSalesName(rows){
  var candidates=(rows||[]).filter(function(row){return n(row.salesDay)>0});
  if(!candidates.length)return'';
  return candidates.slice().sort(function(a,b){return b.salesDay-a.salesDay||b.salesCum-a.salesCum})[0].name
 }
 function topCallsName(rows){
  var candidates=(rows||[]).filter(function(row){return n(row.callsDay)>0});
  if(!candidates.length)return'';
  return candidates.slice().sort(function(a,b){return b.callsDay-a.callsDay||b.callsCum-a.callsCum})[0].name
 }
 function openCompactBreakdown(dateISO){
  var sales=salesTotals(dateISO),calls=callTotals(dateISO),rows=combinedRows(dateISO,sales,calls);
  var label=typeof formatDateShort==='function'?formatDateShort(dateISO):dateISO;
  var topSales=topSalesName(rows),topCalls=topCallsName(rows);

  var rowHtml=rows.length?rows.map(function(row,index){
   var badges='';
   if(row.name===topSales)badges+='<span class="v556-top-badge">★ Top</span>';
   if(row.name===topCalls)badges+='<span class="v556-top-badge calls">☎ Caller</span>';
   return'<div class="v556-ranked-row">'+
    '<div class="v556-rank">'+(index+1)+'</div>'+
    '<div class="v556-rep-name">'+esc(row.name)+(badges?'<span class="v556-badges">'+badges+'</span>':'')+'</div>'+
    '<div class="v556-row-values">'+
      '<div class="v556-sales-line"><strong>+'+money(row.salesDay)+'</strong><span>'+money(row.salesCum)+' cum</span></div>'+
      '<div class="v556-call-line"><strong>+'+Math.round(n(row.callsDay)).toLocaleString()+' calls</strong><span>'+Math.round(n(row.callsCum)).toLocaleString()+' cum</span></div>'+
    '</div>'+
   '</div>'
  }).join(''):'<div class="v556-empty">No per-rep sales or calls were saved for this date.</div>';

  closeModal();
  var overlay=document.createElement('div');
  overlay.id='v556-daily-modal';
  overlay.className='r3m-ov';
  overlay.innerHTML=
   '<div class="r3m-card v556-compact-card">'+
    '<div class="v556-compact-head"><span class="v556-day-pill">Daily Sales &amp; Calls</span><div class="v556-day-title">'+esc(label)+'</div></div>'+
    '<button class="v556-close" onclick="_v556CloseDailyModal()" aria-label="Close">×</button>'+
    '<div class="v556-summary">'+
      '<div class="v556-summary-item sales"><span>SMB (Day)</span><strong>+'+money(sales.smbDay)+'</strong></div>'+
      '<div class="v556-summary-item"><span>CORP (Day)</span><strong>+'+money(sales.corpDay)+'</strong></div>'+
      '<div class="v556-summary-item"><span>Total (Day)</span><strong>+'+money(sales.totalDay)+'</strong></div>'+
      '<div class="v556-summary-item calls"><span>Calls (Day)</span><strong>+'+Math.round(n(calls.daily)).toLocaleString()+'</strong></div>'+
    '</div>'+
    '<div class="v556-list-head"><span>Rep Activity · Ranked (Day · Cumulative)</span><strong>Σ '+money(sales.totalCum)+' · '+Math.round(n(calls.cumulative)).toLocaleString()+' calls</strong></div>'+
    '<div class="v556-ranked-list">'+rowHtml+'</div>'+
   '</div>';

  overlay.addEventListener('click',function(event){
   if(event.target===overlay)closeModal()
  });
  document.body.appendChild(overlay)
 }
 function decorateCalendarCalls(){
  document.querySelectorAll('#pg-daily .daily-day-cell[data-date]').forEach(function(cell){
   var date=cell.dataset.date;
   var old=cell.querySelector('.v556-calendar-calls');
   if(old)old.remove();
   var legacy=cell.querySelector('.v552-call-day');
   if(legacy)legacy.remove();

   var totals=callTotals(date);
   var explicit=!!(window.S&&S.dailyCalls&&Object.prototype.hasOwnProperty.call(S.dailyCalls,date));
   var hasCalls=explicit||n(totals.daily)>0;
   cell.classList.toggle('has-calls',hasCalls);

   if(!hasCalls)return;

   var top=(totals.rows||[]).filter(function(row){return n(row.day)>0}).sort(function(a,b){
    return n(b.day)-n(a.day)||n(b.cumulative)-n(a.cumulative)
   })[0]||null;

   var block=document.createElement('div');
   block.className='v556-calendar-calls';
   block.innerHTML=
    '<div class="v556-day-call-total">Calls +'+Math.round(n(totals.daily)).toLocaleString()+'</div>'+
    (top?'<div class="v556-day-top-caller">☎ '+esc(shortName(top.name))+' +'+Math.round(n(top.day)>0?n(top.day):n(top.cumulative)).toLocaleString()+'</div>':'')+
    '<div class="v556-day-call-wtd">Σ '+Math.round(n(totals.cumulative)).toLocaleString()+' calls WTD</div>';

   var deleteButton=cell.querySelector('.daily-delete-btn');
   if(deleteButton)cell.insertBefore(block,deleteButton);
   else cell.appendChild(block);

   cell.classList.add('daily-clickable');
   cell.setAttribute('onclick',"dailyOpenDayDetail('"+date+"')");
   cell.setAttribute('title','Click for per-rep daily sales and calls')
  })
 }
 function apply(){
  decorateCalendarCalls()
 }

 window._v556CloseDailyModal=closeModal;
 window.dailyOpenDayDetail=openCompactBreakdown;
 window.drDayPopup=openCompactBreakdown;

 window.renderDailyLog=function(){
  var result=typeof baseRenderDailyLog==='function'?baseRenderDailyLog.apply(this,arguments):undefined;
  setTimeout(apply,10);
  setTimeout(apply,100);
  return result
 };

 if(typeof baseSetupDailyTab==='function'){
  window.setupDailyTab=function(){
   var result=baseSetupDailyTab.apply(this,arguments);
   setTimeout(apply,20);
   setTimeout(apply,140);
   return result
  }
 }

 window.TCP_COMPACT_DAILY_BREAKDOWN_V556={
  version:VERSION,
  openDay:openCompactBreakdown,
  close:closeModal,
  decorateCalendar:decorateCalendarCalls,
  combinedRows:combinedRows,
  topSalesName:topSalesName,
  topCallsName:topCallsName
 };

 setTimeout(apply,220);
 setTimeout(apply,750)
})();
