
(function(){
 'use strict';
 function clean(value){return String(value==null?'':value).trim();}
 function redesign(){
  var command=document.querySelector('#rp-overlay .ps68-command');
  if(!command)return;
  var copy=command.querySelector('.ps71-period-copy');
  if(!copy)return;
  var period=clean((command.querySelector('.ps68-period')||{}).textContent)||'Current period';
  var signature=period.toLowerCase();
  if(copy.getAttribute('data-ps72-period')===signature)return;
  copy.setAttribute('data-ps72-period',signature);
  copy.innerHTML='<span class="ps72-kicker">My Day</span><strong>Customer Action Center</strong><span class="ps72-period-label"></span>';
  var label=copy.querySelector('.ps72-period-label');
  if(label)label.textContent=period;
 }
 function schedule(){
  setTimeout(redesign,0);
  setTimeout(redesign,80);
  setTimeout(redesign,300);
 }
 schedule();
 var overlay=document.getElementById('rp-overlay');
 if(overlay){
  new MutationObserver(function(){schedule();}).observe(overlay,{childList:true,subtree:true});
  overlay.addEventListener('change',schedule,true);
 }
 window.TCP_REP_MY_DAY_COMMAND_BAR_V572={version:'v572',redesign:redesign};
})();
