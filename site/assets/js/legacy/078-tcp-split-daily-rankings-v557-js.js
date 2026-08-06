
(function(){
 'use strict';

 var VERSION='v557';

 function clean(value){return String(value==null?'':value).trim()}
 function n(value){var number=Number(value);return isFinite(number)?number:0}
 function esc(value){
  var string=String(value==null?'':value);
  return typeof esc_html==='function'?esc_html(string):string.replace(/[&<>"]/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
  })
 }
 function money(value){return '$'+Math.round(n(value)).toLocaleString()}
 function activeRepNames(){
  try{
   return activeReps().map(function(rep){return rep.name})
  }catch(e){
   return(S.reps||[]).filter(function(rep){return rep&&!rep.retired}).map(function(rep){return rep.name})
  }
 }
 function dateObject(dateISO){
  var date=new Date(String(dateISO||'')+'T12:00:00');
  return isNaN(date.getTime())?null:date
 }
 function isoDate(date){
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')
 }
 function weekStart(dateISO){
  var date=dateObject(dateISO);
  if(!date)return'';
  date.setDate(date.getDate()-date.getDay());
  return isoDate(date)
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
  return{rows:[],daily:0,cumulative:0}
 }
 function salesForRep(dateISO,rep){
  var day=0,cumulative=0;
  try{
   if(typeof _drRepDay==='function')day=n(_drRepDay(dateISO,rep))
  }catch(e){}
  try{
   if(typeof _drWTD==='function')cumulative=n(_drWTD(dateISO,rep))
  }catch(e){}
  if(day===0||cumulative===0){
   var totals=salesTotals(dateISO);
   var row=(totals.rows||[]).find(function(item){return item.name===rep});
   if(row){
    if(day===0)day=n(row.day);
    if(cumulative===0)cumulative=n(row.cum)
   }
  }
  return{day:day,cumulative:cumulative}
 }
 function callsForRep(dateISO,rep){
  var day=0,cumulative=0;
  try{
   if(window.TCP_DAILY_SALES_CALLS_V552){
    if(typeof TCP_DAILY_SALES_CALLS_V552.callDay==='function')day=n(TCP_DAILY_SALES_CALLS_V552.callDay(dateISO,rep));
    if(typeof TCP_DAILY_SALES_CALLS_V552.callLatest==='function')cumulative=n(TCP_DAILY_SALES_CALLS_V552.callLatest(dateISO,rep))
   }
  }catch(e){}
  if(day===0&&cumulative===0){
   var totals=callTotals(dateISO);
   var row=(totals.rows||[]).find(function(item){return item.name===rep});
   if(row){day=n(row.day);cumulative=n(row.cumulative)}
  }
  return{day:day,cumulative:cumulative}
 }
 function salesRows(dateISO){
  return activeRepNames().map(function(name){
   var value=salesForRep(dateISO,name);
   return{name:name,day:value.day,cumulative:value.cumulative}
  }).sort(function(a,b){
   return b.day-a.day||b.cumulative-a.cumulative||a.name.localeCompare(b.name)
  })
 }
 function callRows(dateISO){
  return activeRepNames().map(function(name){
   var value=callsForRep(dateISO,name);
   return{name:name,day:value.day,cumulative:value.cumulative}
  }).sort(function(a,b){
   return b.day-a.day||b.cumulative-a.cumulative||a.name.localeCompare(b.name)
  })
 }
 function savedDates(kind){
  var source=kind==='sales'?(S.dailyRep||{}):(S.dailyCalls||{});
  return Object.keys(source).filter(function(date){
   return /^\d{4}-\d{2}-\d{2}$/.test(date)
  }).sort()
 }
 function previousSavedDate(kind,dateISO){
  var start=weekStart(dateISO);
  var dates=savedDates(kind).filter(function(date){
   return date<dateISO&&date>=start
  });
  return dates.length?dates[dates.length-1]:''
 }
 function rankMap(rows){
  var map={};
  (rows||[]).forEach(function(row,index){map[row.name]=index+1});
  return map
 }
 function movement(currentRows,previousRows,hasPrevious){
  var previous=rankMap(previousRows);
  return currentRows.map(function(row,index){
   var currentRank=index+1;
   if(!hasPrevious||previous[row.name]==null){
    return Object.assign({},row,{rank:currentRank,move:{key:'new',label:'NEW',value:null}})
   }
   var difference=previous[row.name]-currentRank;
   if(difference>0){
    return Object.assign({},row,{rank:currentRank,move:{key:'up',label:'▲'+difference,value:difference}})
   }
   if(difference<0){
    return Object.assign({},row,{rank:currentRank,move:{key:'down',label:'▼'+Math.abs(difference),value:difference}})
   }
   return Object.assign({},row,{rank:currentRank,move:{key:'same',label:'—',value:0}})
  })
 }
 function closeModal(){
  var old=document.getElementById('v557-daily-modal');
  if(old)old.remove();
  var legacy=document.getElementById('v556-daily-modal');
  if(legacy)legacy.remove();
  var wide=document.getElementById('v555-daily-modal');
  if(wide)wide.remove()
 }
 function movementHtml(move){
  return'<span class="v557-move '+esc(move.key)+'">'+esc(move.label)+'</span>'
 }
 function boardRows(rows,type){
  if(!rows.length)return'<div class="v557-empty">No rep activity is available for this date.</div>';
  return rows.map(function(row,index){
   var top=index===0?'<span class="v557-top-badge">★ Top</span>':'';
   var primary=type==='sales'?('+'+money(row.day)):('+'+Math.round(row.day).toLocaleString()+' calls');
   var cumulative=type==='sales'?(money(row.cumulative)+' cum'):(Math.round(row.cumulative).toLocaleString()+' cum');
   return'<div class="v557-ranked-row">'+
    '<div class="v557-rank">'+row.rank+'</div>'+
    '<div class="v557-name-wrap"><span class="v557-rep-name">'+esc(row.name)+'</span>'+top+movementHtml(row.move)+'</div>'+
    '<div class="v557-value"><strong>'+primary+'</strong><span>'+cumulative+'</span></div>'+
   '</div>'
  }).join('')
 }
 function openSplitBreakdown(dateISO){
  var sales=salesTotals(dateISO);
  var calls=callTotals(dateISO);
  var salesPreviousDate=previousSavedDate('sales',dateISO);
  var callsPreviousDate=previousSavedDate('calls',dateISO);
  var rankedSales=movement(salesRows(dateISO),salesPreviousDate?salesRows(salesPreviousDate):[],!!salesPreviousDate);
  var rankedCalls=movement(callRows(dateISO),callsPreviousDate?callRows(callsPreviousDate):[],!!callsPreviousDate);
  var label=typeof formatDateShort==='function'?formatDateShort(dateISO):dateISO;

  closeModal();
  var overlay=document.createElement('div');
  overlay.id='v557-daily-modal';
  overlay.className='r3m-ov';
  overlay.innerHTML=
   '<div class="r3m-card v557-modal-card">'+
    '<div class="v557-head"><span class="v557-day-pill">Daily Sales &amp; Calls</span><div class="v557-day-title">'+esc(label)+'</div></div>'+
    '<button class="v557-close" onclick="_v557CloseDailyModal()" aria-label="Close">×</button>'+
    '<div class="v557-summary">'+
      '<div class="v557-summary-item sales"><span>SMB (Day)</span><strong>+'+money(sales.smbDay)+'</strong></div>'+
      '<div class="v557-summary-item"><span>CORP (Day)</span><strong>+'+money(sales.corpDay)+'</strong></div>'+
      '<div class="v557-summary-item"><span>Total Sales (Day)</span><strong>+'+money(sales.totalDay)+'</strong></div>'+
      '<div class="v557-summary-item calls"><span>Total Calls (Day)</span><strong>+'+Math.round(n(calls.daily)).toLocaleString()+'</strong></div>'+
    '</div>'+
    '<div class="v557-board-grid">'+
      '<section class="v557-board sales">'+
        '<div class="v557-board-head"><span>Rep Sales · Ranked (Day · Cumulative)</span><strong>Σ '+money(sales.totalCum)+'</strong></div>'+
        '<div class="v557-ranked-list">'+boardRows(rankedSales,'sales')+'</div>'+
        '<div class="v557-prior-note">'+(salesPreviousDate?'Movement compared with '+esc(typeof formatDateShort==='function'?formatDateShort(salesPreviousDate):salesPreviousDate)+'.':'No earlier saved sales day is available for movement comparison.')+'</div>'+
      '</section>'+
      '<section class="v557-board calls">'+
        '<div class="v557-board-head"><span>Rep Calls · Ranked (Day · Cumulative)</span><strong>Σ '+Math.round(n(calls.cumulative)).toLocaleString()+' calls</strong></div>'+
        '<div class="v557-ranked-list">'+boardRows(rankedCalls,'calls')+'</div>'+
        '<div class="v557-prior-note">'+(callsPreviousDate?'Movement compared with '+esc(typeof formatDateShort==='function'?formatDateShort(callsPreviousDate):callsPreviousDate)+'.':'No earlier saved call day is available for movement comparison.')+'</div>'+
      '</section>'+
    '</div>'+
   '</div>';

  overlay.addEventListener('click',function(event){
   if(event.target===overlay)closeModal()
  });
  document.body.appendChild(overlay)
 }
 window._v557CloseDailyModal=closeModal;
 window.dailyOpenDayDetail=openSplitBreakdown;
 window.drDayPopup=openSplitBreakdown;

 window.TCP_SPLIT_DAILY_RANKINGS_V557={
  version:VERSION,
  openDay:openSplitBreakdown,
  close:closeModal,
  salesRows:salesRows,
  callRows:callRows,
  previousSavedDate:previousSavedDate,
  movement:movement,
  rankMap:rankMap
 };
})();
