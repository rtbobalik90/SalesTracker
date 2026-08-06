
(function(){
 'use strict';
 if(window.TCP_CUSTOMER_COMMAND_CENTER_V583)return;
 var raf=0,observer=null,resizeObserver=null;
 function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(function(){raf=0;measure()});
 }
 function measure(){
  var root=document.getElementById('rp-overlay');
  if(!root)return;
  var overview=root.querySelector('.cux8-overview');
  if(!overview||!overview.querySelector('.cux10-notes')||window.innerWidth<1200){
   root.style.removeProperty('--cux583-work-h');
   return;
  }
  var top=overview.getBoundingClientRect().top;
  var viewport=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;
  var available=Math.floor(viewport-top-10);
  /* Protect very short windows while preventing the old fixed 728px overflow. */
  available=Math.max(480,Math.min(Math.floor(viewport*0.86),available));
  var next=available+'px';
  if(root.style.getPropertyValue('--cux583-work-h')!==next)root.style.setProperty('--cux583-work-h',next);
 }
 function start(){
  var root=document.getElementById('rp-overlay');
  if(!root)return;
  observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  if(window.ResizeObserver){
   resizeObserver=new ResizeObserver(schedule);
   resizeObserver.observe(root);
  }
  window.addEventListener('resize',schedule,{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',schedule,{passive:true});
  schedule();
  setTimeout(schedule,80);
  setTimeout(schedule,260);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
 window.TCP_CUSTOMER_COMMAND_CENTER_V583={version:'v583',base:'v582',focus:'viewport-measured equal-height customer workspace',measure:measure};
})();
