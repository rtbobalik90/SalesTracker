
(function(){
 'use strict';

 var KEY='tcp_rp_display_scale_v533';

 function forceExecutive(){
  try{localStorage.setItem(KEY,'manager')}catch(e){}
  var overlay=document.getElementById('rp-overlay');
  if(overlay)overlay.setAttribute('data-rp-scale','manager');

  var button=document.getElementById('rp2-scale-control');
  if(button){
   button.setAttribute('aria-label','Executive Scale is the permanent rep display standard');
   button.setAttribute('title','Rep Portal uses the same large visual scale as the manager tracker.');
   button.innerHTML='<span>▣</span><b>Executive Scale</b>';
   button.onclick=function(){
    forceExecutive();
    if(typeof toast==='function')toast('Executive Scale is the permanent rep display standard.');
   };
  }
 }

 window._rp2SetScale=function(){forceExecutive();return'manager'};
 window._rp2ToggleScale=function(){forceExecutive();return'manager'};
 window._rp2ScaleMode=function(){return'manager'};

 var previousInstall=window._rp2InstallScaleControl;
 window._rp2InstallScaleControl=function(){
  var result=typeof previousInstall==='function'?previousInstall.apply(this,arguments):true;
  forceExecutive();
  return result
 };

 var previousAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof previousAfter==='function'?previousAfter.apply(this,arguments):undefined;
  setTimeout(forceExecutive,0);
  return result
 };

 var previousGo=window._rp2Go;
 window._rp2Go=function(){
  var result=typeof previousGo==='function'?previousGo.apply(this,arguments):undefined;
  setTimeout(forceExecutive,0);
  return result
 };

 window.TCP_REP_SCALE_V541={
  mode:'executive',
  permanent:true,
  apply:forceExecutive,
  diagnostics:function(){
   var overlay=document.getElementById('rp-overlay');
   return{
    version:'v541',
    mode:overlay&&overlay.getAttribute('data-rp-scale')||'not-open',
    permanent:true,
    callWorkspace:!!document.querySelector('.cl2-shell')
   }
  }
 };

 forceExecutive();
 setTimeout(forceExecutive,50);
 setTimeout(forceExecutive,600);
})();
