
(function(){
 'use strict';
 function mark(){
  var home=document.querySelector('#rp-overlay .ps68-home');
  var main=document.querySelector('#rp-overlay .rp2-main');
  if(home){
   home.setAttribute('data-layout-build','v574');
   if(main)main.classList.add('ps71-home-mode');
  }
 }
 function schedule(){
  setTimeout(mark,0);
  setTimeout(mark,80);
  setTimeout(mark,300);
 }
 schedule();
 var overlay=document.getElementById('rp-overlay');
 if(overlay)new MutationObserver(schedule).observe(overlay,{childList:true,subtree:true});
 window.TCP_REP_MY_DAY_LAYOUT_HOTFIX_V574={version:'v574',mark:mark};
})();
