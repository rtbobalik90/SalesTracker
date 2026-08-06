
(function(){
 var mainEl=null,scrollBound=false,observer=null;

 function esc(v){
  return String(v==null?'':v).replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function initials(name){
  var p=String(name||'').trim().split(/\s+/).filter(Boolean);
  return((p[0]||'C')[0]+(p[1]||p[0]||'')[0]).toUpperCase()
 }
 function qs(root,sel){return(root||document).querySelector(sel)}
 function customerProfile(){return qs(document,'#rp-overlay .cw4-profile')}
 function currentMain(){return qs(document,'#rp-overlay .rp2-main')}
 function update(){
  var main=currentMain(),profile=customerProfile();if(!main||!profile)return;
  var head=qs(profile,'.cw5-profile-head'),shell=qs(profile,'.cw8-nav-shell'),top=qs(document,'#rp-overlay .rp2-top');
  if(!head||!shell)return;
  shell.style.setProperty('--cw8-top',Math.max(0,(top&&top.offsetHeight)||74)+'px');
  var mainRect=main.getBoundingClientRect(),headRect=head.getBoundingClientRect(),topHeight=(top&&top.offsetHeight)||74;
  var condensed=headRect.bottom<=mainRect.top+topHeight+18;
  shell.classList.toggle('is-condensed',condensed);
  profile.classList.toggle('cw8-condensed',condensed)
 }
 function compactHtml(profile){
  var nameEl=qs(profile,'.cw4-head-name'),avatarEl=qs(profile,'.cw4-head-avatar'),active=qs(profile,'.cw4-tab.active'),next=qs(profile,'.cw5-head-metric.action strong');
  var name=nameEl?nameEl.textContent.trim():'Customer',avatar=avatarEl?avatarEl.textContent.trim():initials(name),tab=active?active.textContent.trim():'Overview',action=next?next.textContent.trim():'Review the account';
  return'<div class="cw8-compact"><button class="cw8-back" onclick="_cw4CloseCompany()" title="Back to companies">←</button><div class="cw8-avatar">'+esc(avatar)+'</div><div class="cw8-account"><strong>'+esc(name)+'</strong><span>'+esc(tab)+'</span></div><div class="cw8-next"><span>Next best action</span><strong>'+esc(action)+'</strong></div><button class="cw8-action call" onclick="_cw5Call(\''+encodeURIComponent(name)+'\')">Call / Log</button><button class="cw8-top-btn" onclick="_cw8AccountTop()" title="Back to account header">↑</button></div>'
 }
 function install(){
  var main=currentMain(),profile=customerProfile();
  if(!main||!profile)return false;
  var sticky=qs(profile,'.cw5-sticky'),tabs=qs(profile,'.cw4-tabs');
  if(!sticky||!tabs)return false;
  profile.classList.add('cw8-flow');
  var shell=qs(profile,'.cw8-nav-shell');
  if(!shell){
   shell=document.createElement('div');
   shell.className='cw8-nav-shell';
   shell.innerHTML=compactHtml(profile);
   sticky.parentNode.insertBefore(shell,sticky.nextSibling);
   shell.appendChild(tabs)
  }else{
   var old=qs(shell,'.cw8-compact');
   if(old)old.outerHTML=compactHtml(profile)
  }
  mainEl=main;
  if(!main._cw8ScrollBound){
   main.addEventListener('scroll',update,{passive:true});
   main._cw8ScrollBound=true
  }
  update();
  return true
 }
 function schedule(){
  setTimeout(install,0);
  setTimeout(install,60);
  setTimeout(install,220)
 }
 window._cw8Install=install;
 window._cw8Update=update;
 window._cw8AccountTop=function(){
  var main=currentMain(),profile=customerProfile();if(!main||!profile)return;
  main.scrollTo({top:Math.max(0,profile.offsetTop-12),behavior:'smooth'})
 };
 window._cw8Diagnostics=function(){
  var profile=customerProfile(),shell=profile&&qs(profile,'.cw8-nav-shell');
  return{installed:!!(profile&&profile.classList.contains('cw8-flow')&&shell),condensed:!!(shell&&shell.classList.contains('is-condensed')),tabsMoved:!!(shell&&qs(shell,'.cw4-tabs'))}
 };

 var baseAfter=window._rp2After;
 window._rp2After=function(){
  var r=typeof baseAfter==='function'?baseAfter.apply(this,arguments):undefined;
  schedule();return r
 };
 var baseGo=window._rp2Go;
 window._rp2Go=function(){
  var r=typeof baseGo==='function'?baseGo.apply(this,arguments):undefined;
  schedule();return r
 };
 if(typeof MutationObserver!=='undefined'){
  observer=new MutationObserver(function(){schedule()});
  var target=document.getElementById('rp2-page');
  if(target)observer.observe(target,{childList:true,subtree:true})
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);
 else schedule()
})();
