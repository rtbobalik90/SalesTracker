
(function(){
 var META_KEY='_tcp_customer_import_v523';
 window._custImportState=window._custImportState||null;
 function arr(v){return Array.isArray(v)?v:[]}
 function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
 function norm(v){return clean(v).toLowerCase().replace(/\ufeff/g,'').replace(/[^a-z0-9]+/g,'')}
 function n(v){var s=clean(v);if(!s||s==='-'||s==='$-')return 0;var neg=/^\(.*\)$/.test(s)||/^-\$|^\$-/.test(s);s=s.replace(/[$,%(),]/g,'').replace(/\s+/g,'');var x=parseFloat(s);return isNaN(x)?0:(neg?-Math.abs(x):x)}
 function activeRepNames(){return arr(S&&S.reps).filter(function(r){return r&&r.name&&!r.retired}).map(function(r){return r.name})}
 function matchRep(raw){
  var v=clean(raw);if(!v||v==='0'||/do not call/i.test(v))return{name:'',state:'do-not-call'};
  var nv=norm(v),names=activeRepNames(),exact=names.filter(function(x){return norm(x)===nv})[0];
  if(exact)return{name:exact,state:'matched'};
  var pieces=nv.split(/(?=[A-Z])/); // harmless fallback for compact values
  var partial=names.filter(function(x){var nx=norm(x);return nx.indexOf(nv)>=0||nv.indexOf(nx)>=0})[0];
  return partial?{name:partial,state:'matched'}:{name:v,state:'unmatched'}
 }
 var aliases={
  id:['custid','customerid','id'],
  name:['custname','customer','customername','company','companyname'],
  rep:['salesrep','salesspecialist','rep','owner','salesrepresentative'],
  loyalty:['customerlist','loyalty','tier','customerlevel'],
  position:['position','9010','top90bottom10','setposition'],
  status:['cstatus','status','assignmentstatus'],
  current:['salescurrentyear','totalcurrent','currentsales','currentyearsales'],
  currentNew:['salescurrentyearnewcustomer','newcurrent','currentyearnewcustomer'],
  threeYear:['totalsales3years','total3years','threeyearsales'],
  lastYear:['saleslastyear','lastyearsales'],
  lastYearNew:['saleslastyearnewcustomer','lastyearnewcustomer'],
  q1:['saleslastyearq1','q1'],q2:['saleslastyearq2','q2'],q3:['saleslastyearq3','q3'],q4:['saleslastyearq4','q4'],
  jan:['saleslastyearjanuary','january','jan'],feb:['saleslastyearfebruary','february','feb'],mar:['saleslastyearmarch','march','mar'],apr:['saleslastyearapril','april','apr'],may:['saleslastyearmay','may'],jun:['saleslastyearjune','june','jun'],jul:['saleslastyearjuly','july','jul'],aug:['saleslastyearaugust','august','aug'],sep:['saleslastyearseptember','september','sept','sep'],oct:['saleslastyearoctober','october','oct'],nov:['saleslastyearnovember','november','nov'],dec:['saleslastyeardecember','december','dec'],
  yoy:['saleslastyearyoypct','yoy','percentchange'],
  twoAgo:['sales2yearsago','sales2yearsago','twoyearsago'],
  threeAgo:['sales3yearsago','threeyearsago'],
  total:['totalsales','lifetimesales','lifetime'],
  percentLast:['percentlastyear'],cumulative:['cumulativepercentlastyear'],
  currentCCNew:['salescurrentyearccnewcustomer'],lastCCNew:['saleslastyearccnewcustomer'],
  contact:['contact','primarycontact','contactname'],
  addr1:['addr1','address1','streetaddress','address'],
  addr2:['addr2','address2','suite']
 };
 function colMap(headers){
  var normalized=headers.map(norm),map={};
  Object.keys(aliases).forEach(function(k){var i=-1;for(var a=0;a<aliases[k].length&&i<0;a++)i=normalized.indexOf(norm(aliases[k][a]));map[k]=i});
  return map
 }
 function detectHeader(rows){
  var best={index:-1,score:-1,map:null,headers:[]};
  for(var i=0;i<Math.min(rows.length,25);i++){
   var h=arr(rows[i]).map(clean),m=colMap(h),score=0;
   if(m.name>=0)score+=5;if(m.rep>=0)score+=4;if(m.id>=0)score+=2;if(m.current>=0)score+=2;if(m.contact>=0)score+=1;if(m.total>=0)score+=1;
   if(score>best.score)best={index:i,score:score,map:m,headers:h}
  }
  if(best.score<7)throw new Error('Could not find a customer header row. Expected fields such as CustName/Customer and Sales Rep.');
  return best
 }
 function at(row,i){return i>=0?clean(row[i]):''}
 function normalizeRows(rows,fileName){
  var h=detectHeader(rows),m=h.map,out=[],seen={};
  rows.slice(h.index+1).forEach(function(row,idx){
   row=arr(row);var name=at(row,m.name);if(!name)return;
   var repMatch=matchRep(at(row,m.rep)),customerNumber=at(row,m.id),key=(customerNumber?customerNumber:norm(name))+'|'+norm(repMatch.name||at(row,m.rep));
   if(seen[key])return;seen[key]=1;
   var status=at(row,m.status),loyalty=at(row,m.loyalty),position=at(row,m.position);
   out.push({
    rowNumber:h.index+idx+2,customerNumber:customerNumber,name:name,repRaw:at(row,m.rep),rep:repMatch.name,repState:repMatch.state,
    loyalty:loyalty,position:position,customerStatus:status,
    importedSalesCurrentYear:n(at(row,m.current)),importedSalesCurrentYearNew:n(at(row,m.currentNew)),
    importedTotalSales3Years:n(at(row,m.threeYear)),importedSalesLastYear:n(at(row,m.lastYear)),importedSalesLastYearNew:n(at(row,m.lastYearNew)),
    importedSales2YearsAgo:n(at(row,m.twoAgo)),importedSales3YearsAgo:n(at(row,m.threeAgo)),importedLifetimeSales:n(at(row,m.total)),
    importedYoyText:at(row,m.yoy),percentLastYear:at(row,m.percentLast),cumulativePercentLastYear:at(row,m.cumulative),
    importedCurrentYearCCNew:n(at(row,m.currentCCNew)),importedLastYearCCNew:n(at(row,m.lastCCNew)),
    quarters:{q1:n(at(row,m.q1)),q2:n(at(row,m.q2)),q3:n(at(row,m.q3)),q4:n(at(row,m.q4))},
    months:{jan:n(at(row,m.jan)),feb:n(at(row,m.feb)),mar:n(at(row,m.mar)),apr:n(at(row,m.apr)),may:n(at(row,m.may)),jun:n(at(row,m.jun)),jul:n(at(row,m.jul)),aug:n(at(row,m.aug)),sep:n(at(row,m.sep)),oct:n(at(row,m.oct)),nov:n(at(row,m.nov)),dec:n(at(row,m.dec))},
    contact:at(row,m.contact),address1:at(row,m.addr1),address2:at(row,m.addr2),importFile:fileName||'',doNotCall:repMatch.state==='do-not-call'
   })
  });
  return{header:h,records:out}
 }
 function existingKey(c){return String(c.customerNumber||c.custId||'')?('id:'+String(c.customerNumber||c.custId)):('name:'+norm(c.name)+'|'+norm(c.rep))}
 function analyze(records){
  var existing={};arr(S&&S.customers).forEach(function(c){existing[existingKey(c)]=c});
  var result={total:records.length,matched:0,unmatched:0,doNotCall:0,newCount:0,updateCount:0,reps:{}};
  records.forEach(function(r){if(r.repState==='matched'){result.matched++;result.reps[r.rep]=(result.reps[r.rep]||0)+1;var key=r.customerNumber?('id:'+r.customerNumber):('name:'+norm(r.name)+'|'+norm(r.rep));if(existing[key])result.updateCount++;else result.newCount++}else if(r.repState==='do-not-call')result.doNotCall++;else result.unmatched++});
  return result
 }
 function esc(v){return typeof _m2esc==='function'?_m2esc(String(v==null?'':v)):String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function money(v){return '$'+Math.round(Number(v)||0).toLocaleString()}
 function modalHtml(state){
  var a=state.analysis,preview=state.records.slice(0,20).map(function(r){var cls=r.repState==='matched'?'good':r.repState==='do-not-call'?'warn':'risk';return '<tr><td>'+esc(r.customerNumber||'—')+'</td><td><strong>'+esc(r.name)+'</strong></td><td>'+esc(r.repRaw||'—')+'</td><td><span class="cuimp-badge '+cls+'">'+esc(r.repState==='matched'?r.rep:r.repState)+'</span></td><td>'+esc(r.loyalty||'—')+'</td><td>'+esc(r.position||'—')+'</td><td>'+money(r.importedSalesCurrentYear)+'</td><td>'+money(r.importedLifetimeSales)+'</td><td>'+esc(r.contact||'—')+'</td></tr>'}).join('');
  var reps=Object.keys(a.reps).sort().map(function(r){return r+' '+a.reps[r]}).join(' · ');
  return '<div class="cuimp-modal-wrap" id="cuimp-modal"><div class="cuimp-modal"><div class="cuimp-head"><div><div class="cuimp-kick">CUSTOMER SPREADSHEET IMPORT · BUILD v525</div><div class="cuimp-title">Review before syncing customer sets</div><div class="cuimp-copy">'+esc(state.fileName)+' · detected header row '+(state.header.index+1)+' · '+state.records.length+' unique customer records. Only rows matched to an active rep will enter that rep’s portal.</div></div><button class="cuimp-close" onclick="custImportClose()">×</button></div>'
   +'<div class="cuimp-stats"><div class="cuimp-stat"><span>Rows found</span><strong>'+a.total+'</strong></div><div class="cuimp-stat"><span>Rep matched</span><strong>'+a.matched+'</strong></div><div class="cuimp-stat"><span>New customers</span><strong>'+a.newCount+'</strong></div><div class="cuimp-stat"><span>Updates</span><strong>'+a.updateCount+'</strong></div><div class="cuimp-stat"><span>Do not call / 0</span><strong>'+a.doNotCall+'</strong></div><div class="cuimp-stat"><span>Unmatched reps</span><strong>'+a.unmatched+'</strong></div></div>'
   +'<div class="cuimp-map"><strong style="color:#c4b5fd">Detected mapping:</strong> Customer ID → customer number · Customer → company · Sales Rep → portal owner · Loyalty → customer tier · Position → Top 90/Bottom 10 · Status → assignment status · sales columns → imported snapshot · contact/address → profile context.<br><strong style="color:#8be0bf">Rep distribution:</strong> '+esc(reps||'No active reps matched')+'</div>'
   +'<div class="cuimp-table-wrap"><table class="cuimp-table"><thead><tr><th>ID</th><th>Customer</th><th>Spreadsheet rep</th><th>Portal owner</th><th>Loyalty</th><th>Position</th><th>Current year</th><th>Lifetime</th><th>Contact</th></tr></thead><tbody>'+preview+'</tbody></table></div>'
   +(state.records.length>20?'<div style="margin-top:8px;color:#7f8da2;font-size:9px">Previewing 20 of '+state.records.length+' records.</div>':'')
   +'<div class="cuimp-options"><label><input id="cuimp-replace" type="checkbox"> Replace prior spreadsheet-imported customer sets for reps included in this file</label><span>Unchecked is safer: add new customers and update matching customer IDs without removing anything.</span></div>'
   +'<div class="cuimp-actions"><button class="cuimp-btn" onclick="custImportClose()">Cancel</button><button class="cuimp-btn blue" onclick="downloadCustomerImportTemplate()">Download template</button><button class="cuimp-btn primary" '+(a.matched?'':'disabled')+' onclick="custImportCommit()">Import & sync '+a.matched+' customers</button></div></div></div>'
 }
 function showModal(){var old=document.getElementById('cuimp-modal');if(old)old.remove();if(!window._custImportState)return;document.body.insertAdjacentHTML('beforeend',modalHtml(window._custImportState))}
 function decorate(){
  var host=document.getElementById('cust-page');if(!host)return;
  var actions=host.querySelector('.r3-hactions');if(actions&&!document.getElementById('cuimp-upload-btn')){
   actions.insertAdjacentHTML('afterbegin','<button id="cuimp-upload-btn" class="dc2-act" style="border-color:#5DCAA5;color:#8BE0BF" onclick="custImportChoose()">⬆ Import customer spreadsheet</button><button class="dc2-act" onclick="downloadCustomerImportTemplate()">⬇ Import template</button><input id="cuimp-file" type="file" accept=".csv,.xlsx,.xls" style="display:none" onchange="custImportRead(this)">');
  }
  var meta=null;try{meta=JSON.parse(localStorage.getItem(META_KEY)||'null')}catch(e){}
  if(meta&&!document.getElementById('cuimp-summary')){
   var head=host.querySelector('.r3-head');if(head)head.insertAdjacentHTML('afterend','<div id="cuimp-summary" class="cuimp-summary"><div><strong>Customer spreadsheet synced</strong><br><span>'+esc(meta.fileName||'Spreadsheet')+' · '+Number(meta.imported||0).toLocaleString()+' customers · '+esc(meta.reps||'')+'</span></div><span>Imported '+esc(meta.importedAt?new Date(meta.importedAt).toLocaleString():'')+' · reps see updates after Refresh Data</span></div>');
  }
 }
 /* v525: controls are rendered directly inside renderCustomersPage().
    Keep decorate() only as a compatibility fallback for older saved builds. */
 var baseRender=window.renderCustomersPage;
 if(typeof baseRender==='function')setTimeout(decorate,0);
 window.custImportChoose=function(){var e=document.getElementById('cuimp-file');if(e)e.click()};
 window.custImportRead=function(input){
  var file=input&&input.files&&input.files[0];if(!file)return;
  if(typeof XLSX==='undefined'){alert('Spreadsheet reader is not available.');input.value='';return}
  var reader=new FileReader();
  reader.onload=function(e){try{var wb=XLSX.read(e.target.result,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}),parsed=normalizeRows(rows,file.name);window._custImportState={fileName:file.name,header:parsed.header,records:parsed.records,analysis:analyze(parsed.records)};showModal()}catch(err){alert('Customer import could not be prepared:\\n\\n'+err.message);console.error(err)}input.value=''};
  reader.onerror=function(){alert('The spreadsheet could not be read.');input.value=''};
  reader.readAsArrayBuffer(file)
 };
 window.custImportClose=function(){window._custImportState=null;var e=document.getElementById('cuimp-modal');if(e)e.remove()};
 function recordKey(r){return r.customerNumber?('id:'+r.customerNumber):('name:'+norm(r.name)+'|'+norm(r.rep))}
 window.custImportCommit=function(){
  var st=window._custImportState;if(!st)return;S.customers=arr(S.customers);
  var replace=!!((document.getElementById('cuimp-replace')||{}).checked),batch='custimp_'+Date.now().toString(36),nowISO=new Date().toISOString(),matched=st.records.filter(function(r){return r.repState==='matched'}),repSet={},incoming={};
  matched.forEach(function(r){repSet[r.rep]=1;incoming[recordKey(r)]=1});
  if(replace)S.customers=S.customers.filter(function(c){if(c.src!=='customer-spreadsheet'||!repSet[c.rep])return true;return !!incoming[existingKey(c)]});
  var added=0,updated=0;
  matched.forEach(function(r){
   var key=recordKey(r),idx=S.customers.findIndex(function(c){return existingKey(c)===key}),old=idx>=0?S.customers[idx]:null,rec=Object.assign({},old||{});
   rec.id=old&&old.id||Date.now()+Math.floor(Math.random()*1000000);rec.name=r.name;rec.rep=r.rep;rec.customerNumber=r.customerNumber;rec.custId=r.customerNumber;rec.loyalty=r.loyalty;rec.position=r.position;rec.customerStatus=r.customerStatus;rec.contact=r.contact;rec.address1=r.address1;rec.address2=r.address2;rec.importedSalesCurrentYear=r.importedSalesCurrentYear;rec.importedSalesCurrentYearNew=r.importedSalesCurrentYearNew;rec.importedTotalSales3Years=r.importedTotalSales3Years;rec.importedSalesLastYear=r.importedSalesLastYear;rec.importedSalesLastYearNew=r.importedSalesLastYearNew;rec.importedSales2YearsAgo=r.importedSales2YearsAgo;rec.importedSales3YearsAgo=r.importedSales3YearsAgo;rec.importedLifetimeSales=r.importedLifetimeSales;rec.importedYoyText=r.importedYoyText;rec.percentLastYear=r.percentLastYear;rec.cumulativePercentLastYear=r.cumulativePercentLastYear;rec.importedCurrentYearCCNew=r.importedCurrentYearCCNew;rec.importedLastYearCCNew=r.importedLastYearCCNew;rec.quarters=r.quarters;rec.months=r.months;rec.doNotCall=false;rec.src='customer-spreadsheet';rec.importBatchId=batch;rec.importFile=st.fileName;rec.importedAt=nowISO;
   if(!old||old.src==='customer-spreadsheet')rec.revenue=r.importedSalesCurrentYear;
   rec.orders=old&&old.orders||0;rec.firstOrder=old&&old.firstOrder||'';rec.lastOrder=old&&old.lastOrder||'';rec.notes=old&&old.notes||'';
   if(idx>=0){S.customers[idx]=rec;updated++}else{S.customers.push(rec);added++}
  });
  var reps=Object.keys(repSet).sort().map(function(r){return r+' ('+matched.filter(function(x){return x.rep===r}).length+')'}).join(', ');
  localStorage.setItem(META_KEY,JSON.stringify({fileName:st.fileName,imported:matched.length,added:added,updated:updated,reps:reps,importedAt:nowISO,batchId:batch}));
  try{markDirty();persist()}catch(e){console.warn('[customer import persist]',e)}
  window.custImportClose();renderCustomersPage();
  setTimeout(function(){alert('Customer import complete.\\n\\nAdded: '+added+'\\nUpdated: '+updated+'\\nRep-matched customers: '+matched.length+'\\n\\nThese customers are now in the cloud payload and will appear in each assigned rep’s Customer portal after Refresh Data.')},120)
 };
 window.downloadCustomerImportTemplate=function(){
  if(typeof XLSX==='undefined'){alert('Spreadsheet writer is not available.');return}
  var headers=['CustId','CustName','Sales Rep','CustomerList','Position','CStatus','SalesCurrentYear','SalesCurrentYearNewCustomer','TotalSales3Years','SalesLastYear','SalesLastYearNewCustomer','SalesLastYearQ1','SalesLastYearQ2','SalesLastYearQ3','SalesLastYearQ4','SalesLastYearJanuary','SalesLastYearFebruary','SalesLastYearMarch','SalesLastYearApril','SalesLastYearMay','SalesLastYearJune','SalesLastYearJuly','SalesLastYearAugust','SalesLastYearSeptember','SalesLastYearOctober','SalesLastYearNovember','SalesLastYearDecember','SalesLastYearYOYpct','Sales2YearsAgo','Sales3YearsAgo','TotalSales','PercentLastYear','CumulativePercentLastYear','SalesCurrentYearCCNewCustomer','SalesLastYearCCNewCustomer','contact','Addr1','Addr2'];
  var example=['59242','The Payne Company','Ben Quernemoen','Platinum','Top90','Assigned',5024,0,63510,27399,0,0,0,12248,15151,0,0,0,0,0,0,0,12248,3919,11232,0,'-12%',31086,0,63510,'1.80%','16%',0,3934.80,'Jill Shannon','7235 West Bert Kouns',''];
  var ws=XLSX.utils.aoa_to_sheet([headers,example]);ws['!cols']=headers.map(function(h){return{wch:Math.max(12,Math.min(28,h.length+2))}});var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Customer Import');XLSX.writeFile(wb,'tcp_customer_import_template.xlsx')
 };
 window._custImportNormalizeRows=normalizeRows;
 window._custImportAnalyze=analyze;
 setTimeout(decorate,300);
})();
