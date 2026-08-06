
(function(){
 function addBanner(){
  var c=document.getElementById('cust-page');
  if(c&&!document.getElementById('imp525-customer-banner')){
   c.insertAdjacentHTML('afterbegin','<div id="imp525-customer-banner" class="imp525-banner"><div><strong>Step 1 — Customer ownership</strong><br>Upload the customer spreadsheet here first. It establishes AccountID/CustId and which rep owns each customer.</div><span>BUILD v525 · permanent page control</span></div>')
  }
  var o=document.getElementById('ord-page');
  if(o&&!document.getElementById('imp525-order-banner')){
   o.insertAdjacentHTML('afterbegin','<div id="imp525-order-banner" class="imp525-banner"><div><strong>Step 2 — Order and product history</strong><br>Use the green monthly line-item importer for AccountID / InvoiceNumber reports. The collapsed weekly importer is only for the old SalesRepPerformance format.</div><span>BUILD v525 · correct importer guidance</span></div>')
  }
 }
 var oldCust=window.renderCustomersPage;
 if(typeof oldCust==='function')window.renderCustomersPage=function(){oldCust();addBanner()};
 var oldOrd=window.renderOrdersPage;
 if(typeof oldOrd==='function')window.renderOrdersPage=function(){oldOrd();addBanner()};
 setTimeout(addBanner,250);
})();
