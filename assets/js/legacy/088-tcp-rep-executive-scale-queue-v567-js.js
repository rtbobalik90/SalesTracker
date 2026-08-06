
(function(){
 'use strict';

 function focusLists(){
  return Array.prototype.slice.call(
   document.querySelectorAll('#rp-overlay .ps60-focus-list')
  )
 }
 function preserveScrollPositions(){
  var positions=focusLists().map(function(list){
   var card=list.closest('.ps60-focus-card');
   var title=card&&card.querySelector('.ps60-focus-card-head strong');
   return{
    key:title?title.textContent.trim():'',
    top:list.scrollTop
   }
  });
  try{
   sessionStorage.setItem('tcp_rep_focus_scroll_v567',JSON.stringify(positions))
  }catch(error){}
 }
 function restoreScrollPositions(){
  var positions=[];
  try{
   positions=JSON.parse(
    sessionStorage.getItem('tcp_rep_focus_scroll_v567')||'[]'
   )
  }catch(error){}
  focusLists().forEach(function(list){
   var card=list.closest('.ps60-focus-card');
   var title=card&&card.querySelector('.ps60-focus-card-head strong');
   var key=title?title.textContent.trim():'';
   var row=positions.filter(function(item){return item.key===key})[0];
   if(row)list.scrollTop=row.top
  })
 }
 function enhanceLists(){
  focusLists().forEach(function(list){
   if(list.getAttribute('data-v567-scroll')==='1')return;
   list.setAttribute('data-v567-scroll','1');
   list.setAttribute('tabindex','0');
   list.setAttribute('role','region');

   var card=list.closest('.ps60-focus-card');
   var title=card&&card.querySelector('.ps60-focus-card-head strong');
   list.setAttribute(
    'aria-label',
    (title?title.textContent.trim():'Work queue')+' — scroll to view all records'
   );

   list.addEventListener('scroll',function(){
    preserveScrollPositions()
   },{passive:true});

   /*
     Stop the page from stealing the wheel until the internal queue reaches
     the beginning or end. This makes mouse-wheel scrolling predictable.
   */
   list.addEventListener('wheel',function(event){
    var atTop=list.scrollTop<=0;
    var atBottom=Math.ceil(list.scrollTop+list.clientHeight)>=list.scrollHeight;
    if((event.deltaY<0&&!atTop)||(event.deltaY>0&&!atBottom)){
     event.stopPropagation()
    }
   },{passive:true})
  });
  restoreScrollPositions()
 }
 function forceScale(){
  var overlay=document.getElementById('rp-overlay');
  if(overlay)overlay.setAttribute('data-rp-scale','manager');
  try{
   localStorage.setItem('tcp_rp_display_scale_v533','manager')
  }catch(error){}
  enhanceLists()
 }
 var oldAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof oldAfter==='function'?
   oldAfter.apply(this,arguments):
   undefined;
  setTimeout(forceScale,0);
  return result
 };
 var oldGo=window._rp2Go;
 if(typeof oldGo==='function'&&!oldGo._v567){
  var go=function(){
   preserveScrollPositions();
   var result=oldGo.apply(this,arguments);
   setTimeout(forceScale,0);
   return result
  };
  go._v567=true;
  window._rp2Go=go
 }
 window.TCP_REP_EXECUTIVE_SCALE_QUEUE_V567={
  version:'v567',
  enhanceLists:enhanceLists,
  forceScale:forceScale,
  focusLists:focusLists
 };
 forceScale();
 setTimeout(forceScale,100);
 setTimeout(forceScale,700);
 setTimeout(forceScale,1800);

 var observer=new MutationObserver(function(){
  setTimeout(forceScale,20)
 });
 var overlay=document.getElementById('rp-overlay');
 if(overlay){
  observer.observe(overlay,{childList:true,subtree:true})
 }
})();
