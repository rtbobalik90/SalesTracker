
(function(){
 window._tcpProductHistoryDiagnostics=function(company){
  function arr(v){return Array.isArray(v)?v:[]}
  function clean(v){return String(v==null?'':v).trim()}
  function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  var state=window.S||{},target=norm(company||''),customers=arr(state.customers),customer=customers.filter(function(c){return norm(c&&c.name||c&&c.customer||c&&c.company)===target})[0]||null;
  var cid=clean(customer&&(customer.customerNumber||customer.custId||customer.customerId||customer.accountId)||'');
  var all=arr(state.orderLineItems),matched=all.filter(function(x){var rid=clean(x&&(x.accountId||x.customerNumber||x.custId||x.customerId)||'');var cname=norm(x&&(x.customer||x.company||x.companyName||x.customerName||x.accountName)||'');return(cid&&rid&&cid===rid)||(target&&cname===target)});
  return{company:company||'',customerId:cid,customers:customers.length,totalLineItems:all.length,matchedLineItems:matched.length,productLines:matched.filter(function(x){return!x.lineClass||x.lineClass==='product'}).length,imports:arr(state.orderLineItemsMeta&&state.orderLineItemsMeta.imports).length,unmatched:arr(state.orderLineItemsUnmatched).length,lastImport:state.orderLineItemsMeta&&state.orderLineItemsMeta.lastImport||null};
 }
})();
