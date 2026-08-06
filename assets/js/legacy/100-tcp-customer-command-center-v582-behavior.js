
(function(){
 'use strict';
 if(window.TCP_CUSTOMER_COMMAND_CENTER_V582)return;
 var scheduled=false;
 function isCompleteTab(){
  if(window._call540Tab==='complete')return true;
  var active=document.querySelector('#rp-overlay .cl2-wtab.on');
  return !!(active&&/complete call/i.test(active.textContent||''));
 }
 function normalizeSeasonalControl(){
  /* Remove the old full-width customer-profile planning block every time an
     older renderer tries to add it. */
  Array.prototype.slice.call(document.querySelectorAll('#rp-overlay #cc547-company-panel,#rp-overlay .cc547-company-panel')).forEach(function(el){el.remove()});

  var cards=Array.prototype.slice.call(document.querySelectorAll('#rp-overlay .cc547-christmas-card'));
  if(!cards.length)return;
  /* The legacy installer can add another card after a rerender. Keep only the
     newest control so there is never a duplicate. */
  var card=cards[cards.length-1];
  cards.slice(0,-1).forEach(function(el){el.remove()});
  card.classList.add('cc582-closeout-select');

  if(!isCompleteTab()){
   card.style.display='none';
   return;
  }
  var center=document.querySelector('#rp-overlay .cl2-center-body');
  if(!center){card.style.display='none';return}
  var firstSection=center.querySelector('.cl2-section');
  if(card.parentNode!==center){
   if(firstSection)center.insertBefore(card,firstSection);
   else center.appendChild(card);
  }else if(firstSection&&card.nextElementSibling!==firstSection){
   center.insertBefore(card,firstSection);
  }
  card.style.display='grid';
 }
 function schedule(){
  if(scheduled)return;
  scheduled=true;
  setTimeout(function(){scheduled=false;normalizeSeasonalControl()},20);
 }
 var oldGoTab=window._call540GoTab;
 if(typeof oldGoTab==='function'){
  window._call540GoTab=function(){
   var result=oldGoTab.apply(this,arguments);
   schedule();
   return result;
  };
 }
 var observer=new MutationObserver(schedule);
 function start(){
  var root=document.getElementById('rp-overlay')||document.body;
  observer.observe(root,{childList:true,subtree:true});
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
 window.TCP_CUSTOMER_COMMAND_CENTER_V582={
  version:'v582',
  base:'v581',
  focus:'adaptive customer layout, equal-height account intelligence, and call-closeout-only seasonal selector',
  normalizeSeasonalControl:normalizeSeasonalControl
 };
})();
