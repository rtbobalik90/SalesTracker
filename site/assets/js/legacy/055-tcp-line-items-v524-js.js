
(function(){
 var META_VERSION=1;
 window._li524State=window._li524State||null;

 function arr(v){return Array.isArray(v)?v:[]}
 function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
 function norm(v){return clean(v).toLowerCase().replace(/\ufeff/g,'').replace(/[^a-z0-9]+/g,'')}
 function num(v){var s=clean(v);if(!s)return 0;var neg=/^\(.*\)$/.test(s)||/^-\$|^\$-/.test(s);s=s.replace(/[$,%(),]/g,'').replace(/\s+/g,'');var x=parseFloat(s);return isNaN(x)?0:(neg?-Math.abs(x):x)}
 function esc(v){if(typeof _m2esc==='function')return _m2esc(String(v==null?'':v));if(typeof _rp2Esc==='function')return _rp2Esc(String(v==null?'':v));return String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function money(v){var x=Number(v)||0;return(x<0?'-$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})}
 function dateISO(v){if(typeof _ordDateISO==='function')return _ordDateISO(v);var d=new Date(v);return isNaN(d.getTime())?'':d.toISOString().slice(0,10)}
 function parseOrder(v){
  if(typeof _ordParseNum==='function')return _ordParseNum(v);
  var s=clean(v).toUpperCase(),bo=s.match(/B(\d+)$/),core=bo?s.slice(0,bo.index):s,type=/CC$/.test(core)?'Customer Cap':/AS$/.test(core)?'AD Specialty':'General Sale';
  return{full:s,base:core,type:type,isBackorder:!!bo}
 }
 function id(prefix){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
 function customerIndex(){
  var byId={},byName={};
  arr(S&&S.customers).forEach(function(c){
   if(!c||c.doNotCall)return;
   var cid=clean(c.customerNumber||c.custId),name=clean(c.name||c.customer||c.company);
   if(cid)byId[cid]=c;if(name)byName[norm(name)]=c
  });
  return{byId:byId,byName:byName}
 }
 function classify(x){
  var rev=num(x.extendedSalesRevenue),sku=clean(x.sku),cat=clean(x.productCategory),deco=clean(x.decorationType),name=clean(x.productName);
  if(rev<0)return'credit';
  if(sku)return'product';
  if(deco)return'decoration';
  if(/setup|set-up|shipping|freight|charge|fee|art only|digitiz/i.test(name))return'fee';
  if(rev===0)return'informational';
  if(cat)return'product';
  return'other'
 }
 var ALIASES={
  account:['accountid','account id','customerid','customer id','custid'],
  order:['ordernumber','order number','order#','order #','salesorder','sales order','so'],
  invoice:['invoicenumber','invoice number','invoice#','invoice #'],
  date:['orderdate','order date','invoicedate','invoice date','date'],
  sku:['sku','itemnumber','item number','style'],
  product:['productname','product name','itemdescription','item description','description'],
  category:['productcategory','product category','category'],
  subcategory:['productsubcategory','product subcategory','subcategory'],
  decoration:['decorationtype','decoration type','decoration','method'],
  qty:['quantityordered','quantity ordered','quantity','qty'],
  revenue:['extendedsalesrevenue','extended sales revenue','salesrevenue','sales revenue','extendedprice','extended price','revenue'],
  cost:['extendedcost','extended cost','cost'],
  gp:['linegrossprofit','line gross profit','grossprofit','gross profit']
 };
 function colMap(headers){
  var h=headers.map(norm),m={};
  Object.keys(ALIASES).forEach(function(k){var i=-1;for(var a=0;a<ALIASES[k].length&&i<0;a++)i=h.indexOf(norm(ALIASES[k][a]));m[k]=i});
  return m
 }
 function detectHeader(rows){
  var best={index:-1,score:-1,map:null,headers:[]};
  for(var i=0;i<Math.min(rows.length,25);i++){
   var h=arr(rows[i]).map(clean),m=colMap(h),score=0;
   if(m.account>=0)score+=4;if(m.invoice>=0)score+=3;if(m.date>=0)score+=2;if(m.product>=0)score+=2;if(m.revenue>=0)score+=4;if(m.qty>=0)score+=1;if(m.order>=0)score+=2;
   if(score>best.score)best={index:i,score:score,map:m,headers:h}
  }
  if(best.score<12)throw new Error('Could not find the line-item header row. Expected AccountID, InvoiceNumber, OrderDate, ProductName, QuantityOrdered, and ExtendedSalesRevenue.');
  return best
 }
 function at(row,i){return i>=0?clean(row[i]):''}
 function lineSig(x){return [x.accountId,x.orderNumber,x.invoiceNumber,x.orderDate,x.sku,x.productName,x.productCategory,x.productSubcategory,x.decorationType,x.quantityOrdered,Number(x.extendedSalesRevenue).toFixed(4),Number(x.extendedCost).toFixed(4)].join('|')}
 function orderKey(x){return [x.accountId,x.orderNumber||x.invoiceNumber,x.invoiceNumber].join('|')}
 function normalizeRows(rows,fileName){
  var h=detectHeader(rows),m=h.map,out=[];
  rows.slice(h.index+1).forEach(function(row,idx){
   row=arr(row);var account=at(row,m.account),invoice=at(row,m.invoice),order=at(row,m.order),date=dateISO(at(row,m.date)),product=at(row,m.product);
   if(!account||!invoice||(!product&&!at(row,m.sku)))return;
   var x={
    rowNumber:h.index+idx+2,accountId:account,orderNumber:order,invoiceNumber:invoice,orderDate:date,
    sku:at(row,m.sku),productName:product,productCategory:at(row,m.category),productSubcategory:at(row,m.subcategory),
    decorationType:at(row,m.decoration),quantityOrdered:num(at(row,m.qty)),extendedSalesRevenue:num(at(row,m.revenue)),
    extendedCost:num(at(row,m.cost)),lineGrossProfit:num(at(row,m.gp)),importFile:fileName||''
   };
   x.lineClass=classify(x);x.lineSig=lineSig(x);x.lineItemOrderKey=orderKey(x);out.push(x)
  });
  return{header:h,records:out}
 }
 function analysis(records){
  var idx=customerIndex(),accounts={},orders={},invoices={},matched=0,unmatched=0,productUnits=0,net=0,credits=0,costRows=0,creditInvoices=0;
  records.forEach(function(x){
   var a=accounts[x.accountId]||(accounts[x.accountId]={accountId:x.accountId,lines:0,revenue:0,orders:{},customer:idx.byId[x.accountId]||null});
   a.lines++;a.revenue+=x.extendedSalesRevenue;a.orders[x.orderNumber||x.invoiceNumber]=1;
   orders[x.lineItemOrderKey]=1;invoices[x.invoiceNumber]=1;net+=x.extendedSalesRevenue;
   if(x.lineClass==='product')productUnits+=Math.max(0,x.quantityOrdered);
   if(x.extendedSalesRevenue<0)credits+=x.extendedSalesRevenue;
   if(x.extendedCost!==0)costRows++;
  });
  Object.keys(accounts).forEach(function(k){if(accounts[k].customer)matched++;else unmatched++});
  records.filter(function(x){return !x.orderNumber}).forEach(function(x){creditInvoices++});
  var dates=records.map(function(x){return x.orderDate}).filter(Boolean).sort();
  return{lines:records.length,orders:Object.keys(orders).length,invoices:Object.keys(invoices).length,accounts:Object.keys(accounts).length,matchedAccounts:matched,unmatchedAccounts:unmatched,productUnits:productUnits,netRevenue:net,credits:credits,costRows:costRows,creditInvoices:creditInvoices,startDate:dates[0]||'',endDate:dates[dates.length-1]||'',accountRows:Object.keys(accounts).map(function(k){var a=accounts[k];a.orderCount=Object.keys(a.orders).length;return a}).sort(function(a,b){return b.revenue-a.revenue})}
 }
 function resolveMapping(accountId,mapping){
  var idx=customerIndex(),direct=idx.byId[String(accountId)];
  if(direct)return direct;
  var selected=mapping&&mapping[String(accountId)];
  if(!selected)return null;
  return idx.byId[String(selected)]||idx.byName[norm(selected)]||null
 }
 function summarizeGroup(lines,customer){
  lines=lines.slice().sort(function(a,b){return a.rowNumber-b.rowNumber});
  var first=lines[0],rawOrder=clean(first.orderNumber),display=rawOrder||clean(first.invoiceNumber),pn=parseOrder(display),missingOrder=!rawOrder;
  var total=0,productRevenue=0,decorationRevenue=0,fees=0,credits=0,units=0,cost=0,gp=0,costRows=0,categories={},decorations={},products={};
  lines.forEach(function(x){
   var rev=Number(x.extendedSalesRevenue)||0;total+=rev;cost+=Number(x.extendedCost)||0;gp+=Number(x.lineGrossProfit)||0;if(Number(x.extendedCost)!==0)costRows++;
   if(x.lineClass==='product'){productRevenue+=rev;units+=Math.max(0,Number(x.quantityOrdered)||0);var cat=clean(x.productCategory)||'Uncategorized';categories[cat]=(categories[cat]||0)+rev;var pk=clean(x.sku)||clean(x.productName)||'Unknown';var p=products[pk]||(products[pk]={sku:clean(x.sku),name:clean(x.productName)||pk,revenue:0,units:0});p.revenue+=rev;p.units+=Math.max(0,Number(x.quantityOrdered)||0)}
   else if(x.lineClass==='decoration')decorationRevenue+=rev;
   else if(x.lineClass==='fee')fees+=rev;
   if(rev<0)credits+=rev;
   if(clean(x.decorationType))decorations[clean(x.decorationType)]=(decorations[clean(x.decorationType)]||0)+1
  });
  var wk=typeof _ordWeekForDate==='function'?_ordWeekForDate(first.orderDate):null;
  var kind=missingOrder?'adjustment':pn.isBackorder?'backorder':'order';
  var sampleOrder=!missingOrder&&(/SCC$/.test(String(display).toUpperCase())||(/S$/.test(String(display).toUpperCase())&&!/AS$/.test(String(display).toUpperCase())));
  return{
   lineItemOrderKey:first.lineItemOrderKey,orderNum:display,sourceOrderNumber:rawOrder,invoiceNumber:first.invoiceNumber,accountId:first.accountId,
   base:missingOrder?display:pn.base,orderType:missingOrder?'Credit / Adjustment':pn.type,rep:customer.rep,customer:customer.name,
   orderDate:first.orderDate,lastOrderDate:'',placement:'Line-item report',newCustomer:false,newCustomerKnown:false,status:missingOrder?'Credit Memo':'Invoiced',
   total:total,kind:kind,isBackorder:!!pn.isBackorder,sampleOrder:sampleOrder,weekKey:wk&&wk.key||'',yr:wk&&wk.yr||'',q:wk&&wk.q||'',
   effWeekKey:wk&&wk.key||'',effYr:wk&&wk.yr||'',effQ:wk&&wk.q||'',orphan:missingOrder,
   lineCount:lines.length,productUnits:units,productRevenue:productRevenue,decorationRevenue:decorationRevenue,feeRevenue:fees,discountCreditRevenue:credits,
   extendedCost:cost,lineGrossProfit:gp,costDataAvailable:costRows>0,
   categories:Object.keys(categories).map(function(k){return{name:k,revenue:categories[k]}}).sort(function(a,b){return b.revenue-a.revenue}),
   decorations:Object.keys(decorations).map(function(k){return{name:k,lines:decorations[k]}}).sort(function(a,b){return b.lines-a.lines}),
   topProducts:Object.keys(products).map(function(k){return products[k]}).sort(function(a,b){return b.revenue-a.revenue}).slice(0,8),
   creditReason:missingOrder?lines.map(function(x){return clean(x.productName)}).filter(Boolean).join(' · '):'',
   importedAt:new Date().toISOString(),importFile:first.importFile,source:'line-item-report',sig:'lineitem-order|'+first.lineItemOrderKey
  }
 }
 function upsertSummary(summary){
  if(!Array.isArray(S.orders))S.orders=[];
  var idx=S.orders.findIndex(function(o){return o&&o.lineItemOrderKey===summary.lineItemOrderKey});
  if(idx<0)idx=S.orders.findIndex(function(o){return o&&o.rep===summary.rep&&clean(o.orderNum)===clean(summary.orderNum)&&clean(o.orderDate)===clean(summary.orderDate)&&(o.kind||'order')===summary.kind});
  if(idx>=0){
   var old=S.orders[idx],idv=old.id||id('ord'),newKnown=old.newCustomerKnown!==false&&old.newCustomer!=null;
   summary.id=idv;
   if(newKnown){summary.newCustomer=!!old.newCustomer;summary.newCustomerKnown=true}
   if(old.placement&&old.placement!=='Line-item report')summary.legacyPlacement=old.placement;
   S.orders[idx]=summary
  }else{summary.id=id('ord');S.orders.push(summary)}
 }
 function applyImport(records,mapping,opts){
  opts=opts||{};if(!Array.isArray(S.orderLineItems))S.orderLineItems=[];if(!Array.isArray(S.orderLineItemsUnmatched))S.orderLineItemsUnmatched=[];if(!S.orderLineItemsMeta||S.orderLineItemsMeta.version!==META_VERSION)S.orderLineItemsMeta={version:META_VERSION,imports:[]};S.orderLineItemsMeta.imports=arr(S.orderLineItemsMeta.imports);
  var a=analysis(records),accountMap={},matchedRecords=[],unmatchedRecords=[],customers={};
  records.forEach(function(x){var c=resolveMapping(x.accountId,mapping);if(c){var y={};Object.keys(x).forEach(function(k){y[k]=x[k]});y.customer=c.name;y.rep=c.rep;y.customerNumber=c.customerNumber||c.custId||x.accountId;y.source='line-item-report';matchedRecords.push(y);customers[x.accountId]=c}else unmatchedRecords.push(x)});
  if(opts.replaceRange&&a.startDate&&a.endDate){
   var touched={};matchedRecords.forEach(function(x){touched[String(x.accountId)]=1});
   S.orderLineItems=S.orderLineItems.filter(function(x){return !(x&&x.source==='line-item-report'&&touched[String(x.accountId)]&&x.orderDate>=a.startDate&&x.orderDate<=a.endDate)})
  }
  var bySig={};S.orderLineItems.forEach(function(x,i){if(x&&x.lineSig)bySig[x.lineSig]=i});
  var added=0,updated=0;
  matchedRecords.forEach(function(x){if(bySig[x.lineSig]!=null){S.orderLineItems[bySig[x.lineSig]]=x;updated++}else{bySig[x.lineSig]=S.orderLineItems.length;S.orderLineItems.push(x);added++}});
  var unmatchedSig={};S.orderLineItemsUnmatched.forEach(function(x,i){if(x&&x.lineSig)unmatchedSig[x.lineSig]=i});
  unmatchedRecords.forEach(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k]});y.reason='AccountID is not mapped to a customer';y.source='line-item-report-unmatched';if(unmatchedSig[y.lineSig]!=null)S.orderLineItemsUnmatched[unmatchedSig[y.lineSig]]=y;else{unmatchedSig[y.lineSig]=S.orderLineItemsUnmatched.length;S.orderLineItemsUnmatched.push(y)}});
  var affected={};matchedRecords.forEach(function(x){affected[x.lineItemOrderKey]=1});
  Object.keys(affected).forEach(function(k){var lines=S.orderLineItems.filter(function(x){return x&&x.lineItemOrderKey===k}),c=lines.length?resolveMapping(lines[0].accountId,mapping):null;if(lines.length&&c)upsertSummary(summarizeGroup(lines,c))});
  var summaries=Object.keys(affected).length,importRec={id:id('liimport'),fileName:opts.fileName||'',startDate:a.startDate,endDate:a.endDate,lines:matchedRecords.length,orders:summaries,accounts:Object.keys(customers).length,unmatchedAccounts:a.unmatchedAccounts,addedLines:added,updatedLines:updated,netRevenue:matchedRecords.reduce(function(s,x){return s+Number(x.extendedSalesRevenue||0)},0),importedAt:new Date().toISOString()};
  S.orderLineItemsMeta.imports.push(importRec);S.orderLineItemsMeta.lastImport=importRec;
  try{if(typeof markDirty==='function')markDirty();if(typeof persist==='function')persist()}catch(e){console.warn('[Line-item import persistence]',e)}
  return{analysis:a,matchedLines:matchedRecords.length,unmatchedLines:unmatchedRecords.length,addedLines:added,updatedLines:updated,orders:summaries,accounts:Object.keys(customers).length,import:importRec}
 }
 function orderLines(key){return arr(S&&S.orderLineItems).filter(function(x){return x&&x.lineItemOrderKey===key}).slice().sort(function(a,b){return a.rowNumber-b.rowNumber})}
 function orderSummary(key){return arr(S&&S.orders).filter(function(o){return o&&o.lineItemOrderKey===key})[0]||null}
 function byRep(rep){
  var lines=arr(S&&S.orderLineItems).filter(function(x){return x&&x.rep===rep}),orders={},cats={},products={},decos={},net=0,units=0,credits=0;
  lines.forEach(function(x){net+=Number(x.extendedSalesRevenue)||0;if(x.extendedSalesRevenue<0)credits+=Number(x.extendedSalesRevenue)||0;if(x.lineClass==='product'){units+=Math.max(0,Number(x.quantityOrdered)||0);var cat=clean(x.productCategory)||'Uncategorized';cats[cat]=(cats[cat]||0)+Number(x.extendedSalesRevenue||0);var pk=clean(x.sku)||clean(x.productName)||'Unknown',p=products[pk]||(products[pk]={name:clean(x.productName)||pk,sku:clean(x.sku),revenue:0,units:0});p.revenue+=Number(x.extendedSalesRevenue)||0;p.units+=Math.max(0,Number(x.quantityOrdered)||0)}if(clean(x.decorationType))decos[clean(x.decorationType)]=(decos[clean(x.decorationType)]||0)+1;orders[x.lineItemOrderKey]=1});
  function top(map){return Object.keys(map).map(function(k){return typeof map[k]==='object'?map[k]:{name:k,value:map[k]}}).sort(function(a,b){return Number(b.revenue||b.value||0)-Number(a.revenue||a.value||0)})}
  return{lines:lines,lineCount:lines.length,orders:Object.keys(orders).length,net:net,units:units,credits:credits,categories:top(cats),products:top(products),decorations:top(decos)}
 }
 function reportCoverage(){var imports=arr(S&&S.orderLineItemsMeta&&S.orderLineItemsMeta.imports),starts=imports.map(function(x){return x.startDate}).filter(Boolean).sort(),ends=imports.map(function(x){return x.endDate}).filter(Boolean).sort();return{imports:imports,start:starts[0]||'',end:ends[ends.length-1]||'',last:imports.slice().sort(function(a,b){return String(b.importedAt).localeCompare(String(a.importedAt))})[0]||null}}
 function formatDate(v){if(!v)return'—';var d=new Date(String(v).length===10?v+'T12:00:00':v);return isNaN(d.getTime())?'—':d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'})}

 function importModal(state){
  var a=state.analysis,idx=customerIndex(),options=arr(S&&S.customers).filter(function(c){return c&&!c.doNotCall&&c.name&&c.rep}).sort(function(a,b){return String(a.name).localeCompare(String(b.name))}).map(function(c){return '<option value="'+esc(c.customerNumber||c.custId||c.name)+'">'+esc(c.name+' · '+c.rep+' · ID '+(c.customerNumber||c.custId||'not recorded'))+'</option>'}).join('');
  var accounts=a.accountRows.map(function(x){var mapped=x.customer,cls=mapped?'good':'warn';return '<div class="li524-account-map"><div><strong>'+esc(x.accountId)+'</strong><br><span style="color:#7f8da2;font-size:8px">'+x.lines+' lines · '+x.orderCount+' records</span></div><div>'+(mapped?'<span class="li524-badge good">'+esc(mapped.name+' · '+mapped.rep)+'</span>':'<select class="li524-map-select" data-account="'+esc(x.accountId)+'"><option value="">Unmapped — do not import these lines</option>'+options+'</select>')+'</div><div style="text-align:right">'+money(x.revenue)+'</div></div>'}).join('');
  var preview=state.records.slice(0,25).map(function(x){return '<tr><td>'+esc(x.accountId)+'</td><td>'+esc(x.orderNumber||'—')+'</td><td>'+esc(x.invoiceNumber)+'</td><td>'+esc(x.orderDate)+'</td><td>'+esc(x.sku||'—')+'</td><td>'+esc(x.productName)+'</td><td>'+esc(x.lineClass)+'</td><td>'+Number(x.quantityOrdered||0).toLocaleString()+'</td><td>'+money(x.extendedSalesRevenue)+'</td></tr>'}).join('');
  return '<div class="li524-modal-wrap" id="li524-import-modal"><div class="li524-modal"><div class="li524-modal-head"><div><div class="li524-modal-kick">LINE-ITEM ORDER IMPORT · BUILD v524</div><div class="li524-modal-title">Review transaction detail before syncing orders</div><div class="li524-modal-copy">'+esc(state.fileName)+' · header row '+(state.header.index+1)+' · '+a.lines+' line items. AccountID is joined to the Customer Spreadsheet customer ID, which supplies the customer name and rep owner.</div></div><button class="li524-close" onclick="_liImportClose()">×</button></div>'
   +'<div class="li524-stats"><div class="li524-stat"><span>Line items</span><strong>'+a.lines+'</strong></div><div class="li524-stat"><span>Order/invoice records</span><strong>'+a.orders+'</strong></div><div class="li524-stat"><span>Invoices</span><strong>'+a.invoices+'</strong></div><div class="li524-stat"><span>Accounts</span><strong>'+a.accounts+'</strong></div><div class="li524-stat"><span>Auto-mapped</span><strong>'+a.matchedAccounts+'</strong></div><div class="li524-stat"><span>Product units</span><strong>'+a.productUnits.toLocaleString()+'</strong></div><div class="li524-stat"><span>Net revenue</span><strong>'+money(a.netRevenue)+'</strong></div></div>'
   +'<div class="li524-map"><strong style="color:#f0c97f">Account mapping:</strong> '+a.unmatchedAccounts+' account'+(a.unmatchedAccounts===1?' is':'s are')+' not found in the current customer set. Select the correct customer below or leave the account unmapped. Unmapped lines remain in a manager-only exception queue and never appear in a rep portal.<br><strong style="color:#8BE0BF">Margin integrity:</strong> '+a.costRows+' of '+a.lines+' lines contain non-zero cost. Gross profit is hidden when the source report does not contain usable cost.</div>'
   +'<div style="margin-top:13px;border:1px solid rgba(255,255,255,.07);border-radius:11px;overflow:hidden">'+accounts+'</div>'
   +'<div class="li524-table-shell"><table><thead><tr><th>Account</th><th>Order</th><th>Invoice</th><th>Date</th><th>SKU</th><th>Line item</th><th>Class</th><th>Qty</th><th>Revenue</th></tr></thead><tbody>'+preview+'</tbody></table></div>'
   +(state.records.length>25?'<div style="margin-top:7px;color:#7f8da2;font-size:8.5px">Previewing 25 of '+state.records.length+' line items.</div>':'')
   +'<div class="li524-options"><label><input id="li524-replace" type="checkbox"> Replace prior line-item rows for the same accounts and report date range</label><span>Unchecked is safer and performs a duplicate-safe upsert.</span></div>'
   +'<div class="li524-modal-actions"><button class="li524-modal-btn" onclick="_liImportClose()">Cancel</button><button class="li524-modal-btn primary" onclick="_liImportCommit()">Import line items and rebuild orders</button></div></div></div>'
 }
 function showImportModal(){var old=document.getElementById('li524-import-modal');if(old)old.remove();if(window._li524State)document.body.insertAdjacentHTML('beforeend',importModal(window._li524State))}
 window._liImportChoose=function(){var e=document.getElementById('li524-file');if(e)e.click()};
 window._liImportRead=function(input){
  var file=input&&input.files&&input.files[0];if(!file)return;if(typeof XLSX==='undefined'){alert('Spreadsheet reader is not available.');input.value='';return}
  var reader=new FileReader();
  reader.onload=function(e){try{var wb=XLSX.read(e.target.result,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}),parsed=normalizeRows(rows,file.name);window._li524State={fileName:file.name,header:parsed.header,records:parsed.records,analysis:analysis(parsed.records)};showImportModal()}catch(err){alert('Line-item import could not be prepared:\\n\\n'+err.message);console.error(err)}input.value=''};
  reader.onerror=function(){alert('The line-item report could not be read.');input.value=''};
  reader.readAsArrayBuffer(file)
 };
 window._liImportClose=function(){window._li524State=null;var e=document.getElementById('li524-import-modal');if(e)e.remove()};
 window._liImportCommit=function(){
  var st=window._li524State;if(!st)return;var mapping={};
  arr(document.querySelectorAll('.li524-map-select')).forEach(function(s){if(s.value)mapping[s.getAttribute('data-account')]=s.value});
  var replace=!!((document.getElementById('li524-replace')||{}).checked),res=applyImport(st.records,mapping,{replaceRange:replace,fileName:st.fileName});
  window._liImportClose();if(typeof renderOrdersPage==='function')renderOrdersPage();
  setTimeout(function(){alert('Line-item import complete.\\n\\nLine items added: '+res.addedLines+'\\nLine items updated: '+res.updatedLines+'\\nOrder/invoice summaries rebuilt: '+res.orders+'\\nCustomer accounts synced: '+res.accounts+'\\nUnmapped lines held back: '+res.unmatchedLines+'\\n\\nAssigned reps will see the orders and customer purchase intelligence after Refresh Data.')},100)
 };

 function managerCard(){
  var a=byRep(''),all=arr(S&&S.orderLineItems),coverage=reportCoverage(),orders=arr(S&&S.orders).filter(function(o){return o&&o.source==='line-item-report'}),unmatched=arr(S&&S.orderLineItemsUnmatched),units=all.filter(function(x){return x.lineClass==='product'}).reduce(function(s,x){return s+Math.max(0,Number(x.quantityOrdered)||0)},0),net=all.reduce(function(s,x){return s+Number(x.extendedSalesRevenue||0)},0),credits=all.filter(function(x){return Number(x.extendedSalesRevenue)<0}).reduce(function(s,x){return s+Number(x.extendedSalesRevenue||0)},0),accounts={};all.forEach(function(x){accounts[String(x.accountId)]=1});
  var recent=orders.slice().sort(function(a,b){return String(b.orderDate).localeCompare(String(a.orderDate))}).slice(0,12);
  return '<div id="li524-manager-card" class="li524-card"><div class="li524-head"><div><div class="li524-kick">PRIMARY ORDER IMPORT · LINE-ITEM ENGINE · BUILD v525</div><div class="li524-title">Upload the monthly line-item report here</div><div class="li524-copy">This is the correct importer for files with AccountID, InvoiceNumber, ProductName, QuantityOrdered, and ExtendedSalesRevenue. It joins AccountID to the Customer Spreadsheet, inherits the assigned rep, stores every product/decoration/charge/credit line, and rebuilds customer purchase history.</div></div><div class="li524-actions"><span class="li524-badge good" style="align-self:center">Use this for the report you uploaded</span><button class="li524-btn primary" onclick="_liImportChoose()">⬆ Upload monthly line-item report (CSV/XLSX)</button><input id="li524-file" type="file" accept=".csv,.xlsx,.xls" style="display:none" onchange="_liImportRead(this)"></div></div>'
   +'<div class="li524-kpis"><div class="li524-kpi"><span>Loaded lines</span><strong>'+all.length.toLocaleString()+'</strong></div><div class="li524-kpi"><span>Order / invoice summaries</span><strong>'+orders.length.toLocaleString()+'</strong></div><div class="li524-kpi"><span>Mapped accounts</span><strong>'+Object.keys(accounts).length.toLocaleString()+'</strong></div><div class="li524-kpi"><span>Product units</span><strong>'+units.toLocaleString()+'</strong></div><div class="li524-kpi"><span>Net revenue</span><strong>'+money(net)+'</strong></div><div class="li524-kpi"><span>Discounts / credits</span><strong>'+money(credits)+'</strong></div><div class="li524-kpi"><span>Unmapped lines</span><strong>'+unmatched.length.toLocaleString()+'</strong></div></div>'
   +'<div class="li524-note"><strong>Coverage:</strong> '+(coverage.start?formatDate(coverage.start)+' – '+formatDate(coverage.end):'No line-item report loaded')+'. This detail enriches customer buying history but does not pretend that an incomplete date range represents the customer’s full YTD or lifetime sales. The original weekly order importer remains below for legacy files.</div>'
   +(recent.length?'<div class="li524-table-wrap"><table class="li524-table"><thead><tr><th>Order / credit</th><th>Invoice</th><th>Customer</th><th>Rep</th><th>Date</th><th>Lines</th><th>Units</th><th>Net</th></tr></thead><tbody>'+recent.map(function(o){return '<tr><td><span class="li524-link" onclick="_liOpenOrder(\''+encodeURIComponent(o.lineItemOrderKey)+'\')">'+esc(o.orderNum)+'</span></td><td>'+esc(o.invoiceNumber||'—')+'</td><td>'+esc(o.customer)+'</td><td>'+esc(o.rep)+'</td><td>'+formatDate(o.orderDate)+'</td><td>'+Number(o.lineCount||0).toLocaleString()+'</td><td>'+Number(o.productUnits||0).toLocaleString()+'</td><td>'+money(o.total)+'</td></tr>'}).join('')+'</tbody></table></div>':'')
   +'</div>'
 }
 function decorateManager(){
  var host=document.getElementById('ord-page');if(!host||document.getElementById('li524-manager-card'))return;
  host.insertAdjacentHTML('afterbegin',managerCard())
 }
 var BASE_MANAGER=window.renderOrdersPage;
 if(typeof BASE_MANAGER==='function')window.renderOrdersPage=function(){BASE_MANAGER();setTimeout(decorateManager,0)};

 function portalPanel(){
  if(!window._rp2||!_rp2.rep)return'';var p=byRep(_rp2.rep),coverage=reportCoverage();if(!p.lineCount)return'';
  var costAvailable=p.lines.some(function(x){return Number(x.extendedCost)!==0}),recentKeys={},recent=[];
  p.lines.slice().sort(function(a,b){return String(b.orderDate).localeCompare(String(a.orderDate))}).forEach(function(x){if(!recentKeys[x.lineItemOrderKey]){recentKeys[x.lineItemOrderKey]=1;var o=orderSummary(x.lineItemOrderKey);if(o)recent.push(o)}});
  function top(rows,mode){return rows.slice(0,5).map(function(x){return '<div class="li524-portal-card"><strong>'+esc(x.name)+'</strong><span>'+(x.sku?esc(x.sku)+' · ':'')+(mode==='lines'?Number(x.value||x.lines||0).toLocaleString()+' uses':money(x.revenue||x.value||0)+(x.units!=null?' · '+Number(x.units).toLocaleString()+' units':''))+'</span></div>'}).join('')}
  return '<section class="li524-portal"><div class="li524-portal-head"><div><div class="li524-portal-kick">LINE-ITEM PURCHASE INTELLIGENCE · BUILD v524</div><div class="li524-portal-title">What your customers actually purchased</div><div class="li524-portal-copy">Coverage '+(coverage.start?formatDate(coverage.start)+' – '+formatDate(coverage.end):'not recorded')+'. Totals below reflect only loaded invoice line items, including promotions, credits, setup charges, and zero-value operational lines.</div></div><span class="rp2-or-pill '+(costAvailable?'good':'warn')+'">'+(costAvailable?'Cost data available':'Margin unavailable · cost is zero')+'</span></div>'
   +'<div class="li524-portal-kpis"><div class="li524-portal-kpi"><span>Line items</span><strong>'+p.lineCount.toLocaleString()+'</strong></div><div class="li524-portal-kpi"><span>Orders / invoices</span><strong>'+p.orders.toLocaleString()+'</strong></div><div class="li524-portal-kpi"><span>Product units</span><strong>'+p.units.toLocaleString()+'</strong></div><div class="li524-portal-kpi"><span>Loaded net revenue</span><strong>'+money(p.net)+'</strong></div><div class="li524-portal-kpi"><span>Discounts / credits</span><strong>'+money(p.credits)+'</strong></div><div class="li524-portal-kpi"><span>Report imports</span><strong>'+coverage.imports.length+'</strong></div></div>'
   +'<div class="li524-portal-grid">'+top(p.categories,'revenue')+top(p.products,'revenue')+top(p.decorations,'lines')+'</div>'
   +'<div class="li524-portal-grid">'+recent.slice(0,6).map(function(o){return '<button class="li524-portal-card" style="text-align:left;cursor:pointer" onclick="_liOpenOrder(\''+encodeURIComponent(o.lineItemOrderKey)+'\')"><strong>'+esc(o.orderNum)+' · '+money(o.total)+'</strong><span>'+esc(o.customer)+' · '+formatDate(o.orderDate)+' · '+Number(o.lineCount||0)+' lines · '+Number(o.productUnits||0)+' units</span></button>'}).join('')+'</div></section>'
 }
 var BASE_PORTAL=window._rp2OrdersV2;
 if(typeof BASE_PORTAL==='function')window._rp2OrdersV2=function(){return portalPanel()+BASE_PORTAL()};

 function detailModal(key){
  var o=orderSummary(key),lines=orderLines(key);if(!o&&lines.length){var c=customerIndex().byId[String(lines[0].accountId)];if(c)o=summarizeGroup(lines,c)}if(!o)return'';
  var costAvailable=!!o.costDataAvailable;
  return '<div class="li524-modal-wrap" id="li524-order-modal" onclick="if(event.target===this)_liCloseOrder()"><div class="li524-modal"><div class="li524-modal-head"><div><div class="li524-modal-kick">'+esc(o.kind==='adjustment'?'CREDIT / ADJUSTMENT DETAIL':'ORDER LINE-ITEM DETAIL')+'</div><div class="li524-modal-title">'+esc(o.orderNum)+' · '+esc(o.customer)+'</div><div class="li524-modal-copy">Invoice '+esc(o.invoiceNumber||'not recorded')+' · '+formatDate(o.orderDate)+' · Account ID '+esc(o.accountId)+' · '+esc(o.rep)+'</div></div><button class="li524-close" onclick="_liCloseOrder()">×</button></div>'
   +'<div class="li524-order-summary"><div class="li524-stat"><span>Net order value</span><strong>'+money(o.total)+'</strong></div><div class="li524-stat"><span>Product revenue</span><strong>'+money(o.productRevenue)+'</strong></div><div class="li524-stat"><span>Decoration revenue</span><strong>'+money(o.decorationRevenue)+'</strong></div><div class="li524-stat"><span>Fees / setup</span><strong>'+money(o.feeRevenue)+'</strong></div><div class="li524-stat"><span>Discounts / credits</span><strong>'+money(o.discountCreditRevenue)+'</strong></div><div class="li524-stat"><span>Product units</span><strong>'+Number(o.productUnits||0).toLocaleString()+'</strong></div></div>'
   +'<div class="li524-order-note"><strong>Margin integrity:</strong> '+(costAvailable?('The report contains non-zero cost for this order. Loaded cost '+money(o.extendedCost)+' · loaded gross profit '+money(o.lineGrossProfit)+'.'):'The source report contains zero cost, so gross profit and margin are intentionally hidden.')+(o.creditReason?'<br><strong>Credit reason:</strong> '+esc(o.creditReason):'')+'</div>'
   +'<div class="li524-order-section"><h3>Invoice line items</h3><div class="li524-table-shell"><table><thead><tr><th>Class</th><th>SKU</th><th>Product / charge / credit</th><th>Category</th><th>Subcategory</th><th>Decoration</th><th>Qty</th><th>Revenue</th>'+(costAvailable?'<th>Cost</th><th>Gross profit</th>':'')+'</tr></thead><tbody>'+lines.map(function(x){return '<tr><td><span class="li524-badge '+(x.lineClass==='product'?'good':x.lineClass==='credit'?'risk':'warn')+'">'+esc(x.lineClass)+'</span></td><td>'+esc(x.sku||'—')+'</td><td>'+esc(x.productName||'—')+'</td><td>'+esc(x.productCategory||'—')+'</td><td>'+esc(x.productSubcategory||'—')+'</td><td>'+esc(x.decorationType||'—')+'</td><td>'+Number(x.quantityOrdered||0).toLocaleString()+'</td><td>'+money(x.extendedSalesRevenue)+'</td>'+(costAvailable?'<td>'+money(x.extendedCost)+'</td><td>'+money(x.lineGrossProfit)+'</td>':'')+'</tr>'}).join('')+'</tbody></table></div></div>'
   +'<div class="li524-order-section"><h3>Customer-profile impact</h3><div class="li524-order-note">This order updates the customer’s order history, product and SKU history, category mix, product quantities, decoration-method history, discount and credit totals, buying cadence, and recent-order timeline. It does not alter the imported customer spreadsheet snapshot or create a quote, opportunity, or product recommendation.</div></div>'
   +'<div class="li524-modal-actions"><button class="li524-modal-btn" onclick="_liCloseOrder()">Close</button></div></div></div>'
 }
 window._liOpenOrder=function(encoded){var key=decodeURIComponent(encoded||''),old=document.getElementById('li524-order-modal');if(old)old.remove();var html=detailModal(key);if(html)document.body.insertAdjacentHTML('beforeend',html)};
 window._liCloseOrder=function(){var e=document.getElementById('li524-order-modal');if(e)e.remove()};

 window._li524NormalizeRows=normalizeRows;
 window._li524Analysis=analysis;
 window._li524ApplyImport=applyImport;
 window._li524OrderLines=orderLines;
 window._li524Summary=summarizeGroup;

 setTimeout(decorateManager,350);
})();
