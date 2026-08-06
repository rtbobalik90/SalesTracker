
(function(){
 'use strict';
 function clean(value){return String(value==null?'':value).trim();}
 function normalize(){
  var command=document.querySelector('#rp-overlay .ps68-command');
  if(!command)return;

  var hiddenPeriod=command.querySelector('.ps68-period');
  var period=clean(hiddenPeriod&&hiddenPeriod.textContent)||'Current period';
  var copy=command.querySelector('.ps71-period-copy');
  if(copy){
   var signature=period.toLowerCase();
   var current=copy.querySelector('.ps75-period-only');
   if(!current||clean(current.textContent)!==period||copy.children.length!==1){
    copy.setAttribute('data-ps72-period',signature);
    copy.innerHTML='<span class="ps75-period-only"></span>';
    copy.querySelector('.ps75-period-only').textContent=period;
   }else{
    copy.setAttribute('data-ps72-period',signature);
   }
  }

  var actions=command.querySelector('.ps68-cycle-actions');
  if(actions)actions.remove();

  var workHead=document.querySelector('#rp-overlay .ps68-work-head');
  if(workHead)workHead.remove();

  var home=document.querySelector('#rp-overlay .ps68-home');
  if(home)home.setAttribute('data-layout-build','v575');
 }
 function schedule(){
  setTimeout(normalize,0);
  setTimeout(normalize,60);
  setTimeout(normalize,220);
 }
 schedule();
 var overlay=document.getElementById('rp-overlay');
 if(overlay){
  new MutationObserver(schedule).observe(overlay,{childList:true,subtree:true});
  overlay.addEventListener('change',schedule,true);
 }
 window.TCP_REP_MY_DAY_FULL_HEIGHT_V575={version:'v575',normalize:normalize};
})();
