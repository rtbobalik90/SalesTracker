
(function(){
 'use strict';

 var baseLineRead=window._liImportRead;
 var state=null;

 function arr(value){return Array.isArray(value)?value:[]}
 function clean(value){return String(value==null?'':value).trim()}
 function norm(value){return clean(value).toLowerCase().replace(/\ufeff/g,'').replace(/[^a-z0-9]+/g,'')}
 function n(value){
  var text=clean(value).replace(/[$,%(),]/g,'').replace(/\s+/g,'');
  var negative=/^\(.*\)$/.test(clean(value))||/^-\$|^\$-/.test(clean(value));
  var number=parseFloat(text);
  if(isNaN(number))return 0;
  return negative?-Math.abs(number):number
 }
 function esc(value){
  if(typeof _rp2Esc==='function')return _rp2Esc(String(value==null?'':value));
  if(typeof _m2esc==='function')return _m2esc(String(value==null?'':value));
  return String(value==null?'':value).replace(/[&<>"]/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
  })
 }
 function money(value){
  var number=n(value);
  return(number<0?'-$':'$')+Math.abs(number).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})
 }
 function headersAt(grid,index){return arr(grid[index]).map(clean)}
 function findHeader(grid,required){
  var best={index:-1,score:0,headers:[]};
  for(var row=0;row<Math.min(grid.length,30);row++){
   var headers=headersAt(grid,row),set={};
   headers.forEach(function(header){set[norm(header)]=1});
   var score=required.reduce(function(total,key){return total+(set[norm(key)]?1:0)},0);
   if(score>best.score)best={index:row,score:score,headers:headers}
  }
  return best
 }
 function workbookSheets(workbook){
  return arr(workbook&&workbook.SheetNames).map(function(name){
   var sheet=workbook.Sheets[name];
   var grid=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});
   return{name:name,grid:grid}
  })
 }
 function legacyCandidate(sheet){
  var header=findHeader(sheet.grid,['Rep','Customer','Order #','Order Date','Total']);
  var normalized=header.headers.map(norm);
  var hasOrder=normalized.indexOf(norm('Order #'))>=0||normalized.indexOf(norm('Order Number'))>=0;
  var hasRep=normalized.indexOf(norm('Rep'))>=0||normalized.indexOf(norm('Rep Name'))>=0||normalized.indexOf(norm('Sales Rep'))>=0;
  var hasCustomer=normalized.indexOf(norm('Customer'))>=0||normalized.indexOf(norm('Customer Name'))>=0;
  var hasTotal=normalized.indexOf(norm('Total'))>=0||normalized.indexOf(norm('Amount'))>=0||normalized.indexOf(norm('Order Total'))>=0;
  return hasOrder&&hasRep&&hasCustomer&&hasTotal?{sheet:sheet,header:header}:null
 }
 function lineItemCandidate(sheet,fileName){
  try{
   if(typeof window._li524NormalizeRows!=='function')return null;
   var parsed=window._li524NormalizeRows(sheet.grid,fileName);
   if(parsed&&arr(parsed.records).length){
    return{sheet:sheet,parsed:parsed}
   }
  }catch(error){}
  return null
 }
 function weeklySummaryCandidate(sheet){
  var header=findHeader(sheet.grid,['Rep','Total Sales','Total Orders']);
  var normalized=header.headers.map(norm);
  var hasRep=normalized.indexOf(norm('Rep'))>=0||normalized.indexOf(norm('Rep Name'))>=0;
  var hasSales=normalized.indexOf(norm('Total Sales'))>=0||normalized.indexOf(norm('Sales Revenue ($)'))>=0;
  var hasOrders=normalized.indexOf(norm('Total Orders'))>=0||normalized.indexOf(norm('Orders Taken'))>=0;
  return hasRep&&hasSales&&hasOrders?{sheet:sheet,header:header}:null
 }
 function parseWeeklySummary(candidate){
  if(!candidate)return[];
  var grid=candidate.sheet.grid,hi=candidate.header.index,H=headersAt(grid,hi);
  var index={
   rep:colIndex(H,['Rep','Rep Name','Sales Rep']),
   repId:colIndex(H,['Rep ID','RepID']),
   sales:colIndex(H,['Total Sales','Sales Revenue ($)','Revenue']),
   orders:colIndex(H,['Total Orders','Orders Taken','Orders']),
   newCustomers:colIndex(H,['New Customers','New Customer']),
   aov:colIndex(H,['Avg Order Value','Average Order Value']),
   lastOrder:colIndex(H,['Last Order Date']),
   vsPrior:colIndex(H,['Vs Week 28 %','Vs Prior Week %','Week over Week %'])
  };
  var rows=[];
  for(var r=hi+1;r<grid.length;r++){
   var row=arr(grid[r]),rep=index.rep>=0?clean(row[index.rep]):'';
   if(!rep)continue;
   rows.push({
    rep:rep,repId:index.repId>=0?clean(row[index.repId]):'',
    totalSales:index.sales>=0?n(row[index.sales]):0,
    totalOrders:index.orders>=0?Math.round(n(row[index.orders])):0,
    newCustomers:index.newCustomers>=0?Math.round(n(row[index.newCustomers])):0,
    avgOrderValue:index.aov>=0?n(row[index.aov]):0,
    lastOrderDate:index.lastOrder>=0?clean(row[index.lastOrder]):'',
    vsPriorWeek:index.vsPrior>=0?n(row[index.vsPrior]):0
   })
  }
  return rows
 }
 function inferWeeklyPeriod(rows,fileName){
  var counts={},details={};
  rows.forEach(function(row){
   try{
    var iso=typeof _ordDateISO==='function'?_ordDateISO(row.orderDate):clean(row.orderDate);
    var wk=typeof _ordWeekForDate==='function'?_ordWeekForDate(iso):null;
    if(wk&&wk.key){counts[wk.key]=(counts[wk.key]||0)+1;details[wk.key]=wk}
   }catch(error){}
  });
  var key=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]})[0];
  if(key)return details[key];
  try{
   var selected=typeof getCWK==='function'?getCWK():'';
   var parts=selected.split('_');
   if(parts.length>=4)return{key:selected,yr:parts[0],q:parts[1]}
  }catch(error){}
  return null
 }
 function summaryReconciliation(summaryRows,detailRows){
  var detail={};
  detailRows.forEach(function(row){
   var key=norm(row.rep),x=detail[key]||(detail[key]={sales:0,orders:0});
   x.sales+=n(row.total);x.orders++
  });
  var mismatches=[];
  summaryRows.forEach(function(row){
   var x=detail[norm(row.rep)]||{sales:0,orders:0};
   if(Math.abs(x.sales-n(row.totalSales))>.01||x.orders!==Math.round(n(row.totalOrders))){
    mismatches.push({rep:row.rep,summarySales:n(row.totalSales),detailSales:x.sales,summaryOrders:Math.round(n(row.totalOrders)),detailOrders:x.orders})
   }
  });
  return{matched:summaryRows.length-mismatches.length,mismatches:mismatches}
 }
 function applyWeeklySummary(summaryRows,detailRows,period,fileName){
  if(!period||!period.key)return{updated:0,skipped:summaryRows.length,weekKey:'',reconciliation:summaryReconciliation(summaryRows,detailRows)};
  var byRep={};
  detailRows.forEach(function(row){
   var matched=typeof _ordMatchRep==='function'?_ordMatchRep(row.rep):clean(row.rep);
   if(!matched)return;
   var x=byRep[matched]||(byRep[matched]={topSale:0,topSaleCustomer:''});
   if(n(row.total)>x.topSale){x.topSale=n(row.total);x.topSaleCustomer=clean(row.customer)}
  });
  var updated=0,skipped=0;
  summaryRows.forEach(function(row){
   var rep=typeof _ordMatchRep==='function'?_ordMatchRep(row.rep):clean(row.rep);
   if(!rep){skipped++;return}
   var key=rep+'|'+period.key,existing=typeof gd==='function'?gd(key):((S.data||{})[key]||{}),next=Object.assign({},existing);
   next.revenue=n(row.totalSales);
   next.orders=Math.round(n(row.totalOrders));
   next.newCustomers=Math.round(n(row.newCustomers));
   next.avgOrderValue=n(row.avgOrderValue)||(next.orders?next.revenue/next.orders:0);
   next.lastOrderDate=clean(row.lastOrderDate)||next.lastOrderDate||'';
   next.vsPriorWeek=n(row.vsPriorWeek);
   if(byRep[rep]&&byRep[rep].topSale>0){next.topSale=byRep[rep].topSale;next.topSaleCustomer=byRep[rep].topSaleCustomer}
   delete next._dailyLive;
   next._weeklyOrderSummary={version:'v564',fileName:fileName||'',weekKey:period.key,importedAt:new Date().toISOString()};
   if(typeof sd==='function')sd(key,next);else{S.data=S.data||{};S.data[key]=next}
   updated++
  });
  try{if(typeof _v552CaptureWeeklyUpload==='function')_v552CaptureWeeklyUpload()}catch(error){}
  try{if(typeof markDirty==='function')markDirty()}catch(error){}
  return{updated:updated,skipped:skipped,weekKey:period.key,reconciliation:summaryReconciliation(summaryRows,detailRows)}
 }
 function classifyWorkbook(workbook,fileName){
  var sheets=workbookSheets(workbook),line=[],weekly=[],summaries=[];
  sheets.forEach(function(sheet){
   var item=lineItemCandidate(sheet,fileName);
   if(item)line.push(item);
   var legacy=legacyCandidate(sheet);
   if(legacy)weekly.push(legacy);
   var summary=weeklySummaryCandidate(sheet);
   if(summary)summaries.push(summary)
  });
  if(line.length){
   line.sort(function(a,b){return b.parsed.records.length-a.parsed.records.length});
   return{type:'line-item',candidate:line[0],sheets:sheets}
  }
  if(weekly.length){
   weekly.sort(function(a,b){
    var aOrders=/^orders?$/i.test(a.sheet.name)?1:0;
    var bOrders=/^orders?$/i.test(b.sheet.name)?1:0;
    return bOrders-aOrders||b.sheet.grid.length-a.sheet.grid.length
   });
   summaries.sort(function(a,b){
    var an=/^summary$/i.test(a.sheet.name)?1:0,bn=/^summary$/i.test(b.sheet.name)?1:0;
    return bn-an||b.sheet.grid.length-a.sheet.grid.length
   });
   return{type:'weekly-summary',candidate:weekly[0],summaryCandidate:summaries[0]||null,sheets:sheets}
  }
  return{type:'unknown',candidate:null,summaryCandidate:null,sheets:sheets}
 }
 function colIndex(headers,names){
  var compact=headers.map(norm);
  for(var x=0;x<names.length;x++){
   var index=compact.indexOf(norm(names[x]));
   if(index>=0)return index
  }
  return-1
 }
 function parseWeekly(candidate){
  var grid=candidate.sheet.grid,hi=candidate.header.index,H=headersAt(grid,hi);
  var index={
   rep:colIndex(H,['Rep','Rep Name','Sales Rep']),
   customer:colIndex(H,['Customer','Customer Name']),
   order:colIndex(H,['Order #','Order#','Order Number','SO','SO #']),
   date:colIndex(H,['Order Date','Date']),
   last:colIndex(H,['Last Order Date']),
   type:colIndex(H,['Order Type','Type','Source']),
   newCustomer:colIndex(H,['New Customer']),
   status:colIndex(H,['Status']),
   total:colIndex(H,['Total','Amount','Order Total'])
  };
  var rows=[];
  for(var rowIndex=hi+1;rowIndex<grid.length;rowIndex++){
   var row=arr(grid[rowIndex]);
   var order=index.order>=0?clean(row[index.order]):'';
   if(!order)continue;
   rows.push({
    rep:index.rep>=0?row[index.rep]:'',
    customer:index.customer>=0?row[index.customer]:'',
    orderNum:order,
    orderDate:index.date>=0?row[index.date]:'',
    lastOrderDate:index.last>=0?row[index.last]:'',
    placement:index.type>=0?row[index.type]:'',
    newCustomer:index.newCustomer>=0?row[index.newCustomer]:'',
    status:index.status>=0?row[index.status]:'',
    total:index.total>=0?row[index.total]:0
   })
  }
  return rows
 }
 function weeklyAnalysis(rows){
  var reps={},customers={},dates=[],total=0;
  rows.forEach(function(row){
   if(clean(row.rep))reps[clean(row.rep)]=1;
   if(clean(row.customer))customers[clean(row.customer)]=1;
   total+=n(row.total);
   if(clean(row.orderDate))dates.push(clean(row.orderDate))
  });
  return{
   rows:rows.length,
   reps:Object.keys(reps).length,
   customers:Object.keys(customers).length,
   net:total,
   first:dates[0]||'',
   last:dates[dates.length-1]||''
  }
 }
 function closeModal(){
  var modal=document.getElementById('si563-modal');
  if(modal)modal.remove()
 }
 function previewRows(rows){
  return rows.slice(0,8).map(function(row){
   return'<tr><td>'+esc(row.rep)+'</td><td>'+esc(row.customer)+'</td><td>'+esc(row.orderNum)+'</td><td>'+esc(row.orderDate)+'</td><td>'+money(row.total)+'</td></tr>'
  }).join('')
 }
 function showWeeklyReview(fileName,candidate,rows,summaryRows){
  closeModal();
  var analysis=weeklyAnalysis(rows),period=inferWeeklyPeriod(rows,fileName),recon=summaryReconciliation(summaryRows||[],rows);
  state={type:'weekly-summary',fileName:fileName,sheetName:candidate.sheet.name,rows:rows,summaryRows:summaryRows||[],analysis:analysis,period:period,reconciliation:recon};
  var hasSummary=state.summaryRows.length>0,reconGood=hasSummary&&recon.mismatches.length===0;
  var overlay=document.createElement('div');
  overlay.id='si563-modal';overlay.className='si563-modal-wrap';
  overlay.innerHTML='<div class="si563-modal">'+
   '<div class="si563-modal-head"><div><div class="si563-modal-kick">Smart Order Import · Weekly Format Detected</div><h2>Review weekly order summary</h2><div class="si563-modal-copy">'+esc(fileName)+' · '+esc(candidate.sheet.name)+' detail sheet'+(hasSummary?' · Summary sheet detected':'')+'. The app will update detailed order history and the official weekly revenue/order totals together.</div></div><button class="si563-close" onclick="_si563Close()">×</button></div>'+
   '<div class="si563-detected"><span class="si563-chip good">✓ Weekly SalesRepPerformance workbook</span><span class="si563-chip">'+esc(period&&period.key||'Selected tracker week')+'</span><span class="si563-chip '+(reconGood?'good':'warn')+'">'+(reconGood?'✓ Summary matches detail':hasSummary?(recon.mismatches.length+' summary mismatch(es)'):'No Summary sheet')+'</span></div>'+
   '<div class="si563-kpis"><div class="si563-kpi"><span>Order rows</span><strong>'+analysis.rows.toLocaleString()+'</strong></div><div class="si563-kpi"><span>Reps found</span><strong>'+analysis.reps+'</strong></div><div class="si563-kpi"><span>Customers</span><strong>'+analysis.customers.toLocaleString()+'</strong></div><div class="si563-kpi"><span>Net total</span><strong>'+money(analysis.net)+'</strong></div><div class="si563-kpi"><span>Weekly summaries</span><strong>'+state.summaryRows.length+'</strong></div></div>'+
   '<div class="si563-table-wrap"><table class="si563-table"><thead><tr><th>Rep</th><th>Customer</th><th>Order #</th><th>Order Date</th><th>Total</th></tr></thead><tbody>'+previewRows(rows)+'</tbody></table></div>'+
   '<div class="si563-warning"><strong>Linked update:</strong> the Orders sheet builds customer/order history. The Summary sheet updates the same week in manager dashboards, rep dashboards, rankings, forecasts, and reports. Existing calls and work hours are preserved because this workbook does not contain those columns.<br><strong>Product limitation:</strong> individual products, quantities, decoration methods, and SKUs still require the monthly line-item report.</div>'+
   '<div class="si563-actions"><button onclick="_si563Close()">Cancel</button><button class="primary" onclick="_si563CommitWeekly()">Import and link weekly data</button></div>'+
  '</div>';
  overlay.addEventListener('click',function(event){if(event.target===overlay)closeModal()});document.body.appendChild(overlay)
 }
 function showUnknown(fileName,result){
  closeModal();
  var sheets=result.sheets.map(function(sheet){return sheet.name}).join(', ')||'None';
  var headers=result.sheets.map(function(sheet){
   var h=findHeader(sheet.grid,['AccountID','InvoiceNumber','Order #','Rep','Customer']);
   return'<div class="si563-format"><strong>'+esc(sheet.name)+'</strong><span>'+esc(h.headers.slice(0,10).join(' · ')||'No readable header row')+'</span></div>'
  }).join('');
  var overlay=document.createElement('div');
  overlay.id='si563-modal';
  overlay.className='si563-modal-wrap';
  overlay.innerHTML='<div class="si563-modal"><div class="si563-modal-head"><div><div class="si563-modal-kick">Smart Order Import</div><h2>Order format not recognized</h2><div class="si563-modal-copy">'+esc(fileName)+' contains these sheets: '+esc(sheets)+'. The app checked every sheet instead of only the first one, but neither supported order format was found.</div></div><button class="si563-close" onclick="_si563Close()">×</button></div><div class="si563-format-grid">'+headers+'</div><div class="si563-warning">Supported monthly format: AccountID, InvoiceNumber, OrderDate, ProductName, QuantityOrdered, ExtendedSalesRevenue.<br>Supported weekly format: Rep, Customer, Order #, Order Date, Total.</div><div class="si563-actions"><button onclick="_si563Close()">Close</button></div></div>';
  document.body.appendChild(overlay)
 }
 function commitWeekly(){
  if(!state||state.type!=='weekly-summary')return;
  var result=typeof _ordImportRows==='function'?_ordImportRows(state.rows):null;
  if(!result){alert('The weekly order engine is not available.');return}
  var linked=state.summaryRows&&state.summaryRows.length?applyWeeklySummary(state.summaryRows,state.rows,state.period,state.fileName):{updated:0,skipped:0,weekKey:state.period&&state.period.key||''};
  if(!S.ordersMeta)S.ordersMeta={};
  S.ordersMeta.lastUpload=new Date().toISOString();S.ordersMeta.lastFile=state.fileName;
  S.ordersMeta.lastFormat='weekly-summary-linked-v564';S.ordersMeta.lastSheet=state.sheetName;
  S.ordersMeta.lastWeekKey=linked.weekKey||'';S.ordersMeta.lastSummaryRows=linked.updated||0;
  if(typeof _ordDirty==='function')_ordDirty();
  try{if(window.TCP_PERSISTENT_DATA_V550)TCP_PERSISTENT_DATA_V550.saveNow('weekly-order-summary-v564')}catch(error){}
  closeModal();if(typeof renderOrdersPage==='function')renderOrdersPage();
  setTimeout(function(){
   var host=document.getElementById('li524-manager-card');
   if(host){
    host.insertAdjacentHTML('afterbegin','<div class="si563-result" id="si563-result"><strong style="color:#9AE7C9">Weekly order import complete.</strong> '+linked.updated+' official weekly rep record(s) updated · '+result.added+' order rows added · '+result.dupes+' duplicates skipped · '+(result.dropped+linked.skipped)+' unmatched rep rows skipped.</div>');
    setTimeout(function(){var message=document.getElementById('si563-result');if(message)message.remove()},14000)
   }
  },40);state=null
 }
 function decorate(){
  var card=document.getElementById('li524-manager-card');
  if(card&&!card.getAttribute('data-si563')){
   card.setAttribute('data-si563','1');
   var kick=card.querySelector('.li524-kick');
   var title=card.querySelector('.li524-title');
   var copy=card.querySelector('.li524-copy');
   var badge=card.querySelector('.li524-actions .li524-badge');
   var button=card.querySelector('.li524-actions .li524-btn');
   if(kick)kick.textContent='SMART ORDER IMPORT · AUTO-DETECT · BUILD v563';
   if(title)title.textContent='Upload an order report';
   if(copy)copy.innerHTML='Use one uploader for both supported formats. The app checks every workbook sheet, links weekly Summary totals to the tracker, and sends detailed Orders rows to customer/order history.';
   if(badge)badge.textContent='Auto-detects both formats';
   if(button)button.textContent='⬆ Upload order report (CSV/XLSX)';
   var note=card.querySelector('.li524-note');
   if(note&&!card.querySelector('.si563-format-grid')){
    note.insertAdjacentHTML('beforebegin','<div class="si563-format-grid"><div class="si563-format line"><strong>Monthly line-item report</strong><span>AccountID · InvoiceNumber · ProductName · QuantityOrdered · ExtendedSalesRevenue. Adds product and decoration intelligence.</span></div><div class="si563-format weekly"><strong>Weekly SalesRepPerformance workbook</strong><span>Orders sheet plus Summary sheet. Updates official weekly revenue/orders, detailed order history, rankings, forecasts, and both portals.</span></div></div><div class="si563-smart-note">You no longer need to decide which importer to use. Upload the file once and review the detected format before anything is committed.</div>')
   }
  }
  var details=arr(document.querySelectorAll('#ord-page details.ord-card')).find(function(item){
   return /legacy weekly summary importer/i.test(clean(item.textContent))
  });
  if(details)details.classList.add('si563-legacy-fallback')
 }
 window._liImportRead=function(input){
  var file=input&&input.files&&input.files[0];
  if(!file)return;
  if(typeof XLSX==='undefined'){
   alert('Spreadsheet reader is not available.');
   input.value='';
   return
  }
  var reader=new FileReader();
  reader.onload=function(event){
   try{
    var workbook=XLSX.read(event.target.result,{type:'array'});
    var result=classifyWorkbook(workbook,file.name);
    if(result.type==='line-item'){
     if(typeof baseLineRead==='function'){
      baseLineRead(input);
      return
     }
    }else if(result.type==='weekly-summary'){
     var rows=parseWeekly(result.candidate);
     var summaryRows=parseWeeklySummary(result.summaryCandidate);
     showWeeklyReview(file.name,result.candidate,rows,summaryRows);
    }else{
     showUnknown(file.name,result)
    }
   }catch(error){
    showUnknown(file.name,{sheets:[]});
    console.error('[Smart Order Import v563]',error)
   }
   input.value=''
  };
  reader.onerror=function(){
   alert('The order report could not be read.');
   input.value=''
  };
  reader.readAsArrayBuffer(file)
 };
 window._si563Close=closeModal;
 window._si563CommitWeekly=commitWeekly;
 window.TCP_SMART_ORDER_IMPORT_V563={
  version:'v563',
  classifyWorkbook:classifyWorkbook,
  parseWeekly:parseWeekly,
  parseWeeklySummary:parseWeeklySummary,
  inferWeeklyPeriod:inferWeeklyPeriod,
  summaryReconciliation:summaryReconciliation,
  applyWeeklySummary:applyWeeklySummary,
  weeklyAnalysis:weeklyAnalysis,
  decorate:decorate
 };
 var baseRender=window.renderOrdersPage;
 if(typeof baseRender==='function'){
  window.renderOrdersPage=function(){
   var result=baseRender.apply(this,arguments);
   setTimeout(decorate,0);
   return result
  }
 }
 setTimeout(decorate,200)
})();
