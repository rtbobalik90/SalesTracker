
(function(){
 'use strict';

 function safeText(node){
  return String(node&&node.textContent||'').replace(/\s+/g,' ').trim();
 }
 function scrollKey(index){
  return 'tcp_ps70_lane_scroll_'+index;
 }
 function enhanceFourLanes(){
  var work=document.querySelector('#rp-overlay .ps68-work-grid');
  if(!work)return;

  var lanes=work.querySelectorAll('.ps68-queue,.ps68-other-list,.ps68-other-empty');
  Array.prototype.forEach.call(lanes,function(lane,index){
   if(lane.getAttribute('data-ps70-scroll')==='1')return;
   lane.setAttribute('data-ps70-scroll','1');
   lane.setAttribute('tabindex','0');
   lane.setAttribute('role','region');

   var card=lane.closest('.ps68-primary,.ps68-other-card');
   var heading=card&&card.querySelector('.ps68-card-head strong,.ps68-other-head strong');
   var label=safeText(heading)||('Work lane '+(index+1));
   lane.setAttribute('aria-label',label+' — scroll for all items');

   try{
    var stored=Number(sessionStorage.getItem(scrollKey(index))||0);
    if(stored>0)lane.scrollTop=stored;
   }catch(error){}

   lane.addEventListener('scroll',function(){
    try{sessionStorage.setItem(scrollKey(index),String(lane.scrollTop));}catch(error){}
   },{passive:true});

   lane.addEventListener('wheel',function(event){
    var atTop=lane.scrollTop<=0;
    var atBottom=Math.ceil(lane.scrollTop+lane.clientHeight)>=lane.scrollHeight;
    if((event.deltaY<0&&!atTop)||(event.deltaY>0&&!atBottom))event.stopPropagation();
   },{passive:true});
  });
 }

 function refresh(){
  if(window._rp2&&_rp2.page==='home')setTimeout(enhanceFourLanes,0);
 }

 var priorAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof priorAfter==='function'?priorAfter.apply(this,arguments):undefined;
  refresh();
  return result;
 };

 var priorGo=window._rp2Go;
 if(typeof priorGo==='function'&&!priorGo._ps70){
  var go=function(){
   var result=priorGo.apply(this,arguments);
   refresh();
   return result;
  };
  go._ps70=true;
  window._rp2Go=go;
 }

 window.TCP_FOUR_LANE_REP_MY_DAY_V570={
  version:'v570',
  enhanceFourLanes:enhanceFourLanes
 };

 setTimeout(enhanceFourLanes,0);
 setTimeout(enhanceFourLanes,250);
})();
