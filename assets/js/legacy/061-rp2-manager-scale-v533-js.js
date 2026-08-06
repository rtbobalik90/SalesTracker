
(function(){
 var KEY='tcp_rp_display_scale_v533';

 function getMode(){
  try{
   var v=localStorage.getItem(KEY);
   return v==='compact'?'compact':'manager'
  }catch(e){return'manager'}
 }
 function label(mode){return mode==='compact'?'Compact':'Manager Scale'}
 function overlay(){return document.getElementById('rp-overlay')}
 function apply(mode){
  mode=mode==='compact'?'compact':'manager';
  var el=overlay();
  if(el)el.setAttribute('data-rp-scale',mode);
  try{localStorage.setItem(KEY,mode)}catch(e){}
  var btn=document.getElementById('rp2-scale-control');
  if(btn){
   btn.setAttribute('aria-label','Display scale: '+label(mode));
   btn.innerHTML='<span>◫</span><b>'+label(mode)+'</b>'
  }
  return mode
 }
 function install(){
  var el=overlay();
  if(!el)return false;
  apply(getMode());
  if(document.getElementById('rp2-scale-control'))return true;
  var host=el.querySelector('.rp2-context')||el.querySelector('.rp2-top');
  if(!host)return false;
  var btn=document.createElement('button');
  btn.type='button';
  btn.id='rp2-scale-control';
  btn.className='rp2-scale-control';
  btn.onclick=function(){window._rp2ToggleScale()};
  host.appendChild(btn);
  apply(getMode());
  return true
 }
 window._rp2SetScale=function(mode){apply(mode);setTimeout(install,0)};
 window._rp2ToggleScale=function(){var next=getMode()==='manager'?'compact':'manager';apply(next)};
 window._rp2ScaleMode=function(){return getMode()};
 window._rp2InstallScaleControl=install;

 var baseAfter=window._rp2After;
 window._rp2After=function(){
  var r=typeof baseAfter==='function'?baseAfter.apply(this,arguments):undefined;
  setTimeout(install,0);
  return r
 };
 var baseGo=window._rp2Go;
 window._rp2Go=function(){
  var r=typeof baseGo==='function'?baseGo.apply(this,arguments):undefined;
  setTimeout(install,0);
  return r
 };
 var baseOpen=window._rp2Open;
 if(typeof baseOpen==='function'){
  window._rp2Open=function(){
   var r=baseOpen.apply(this,arguments);
   setTimeout(install,0);
   return r
  }
 }

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0)});
 else setTimeout(install,0);
 setTimeout(install,300);
 setTimeout(install,1000);
})();
