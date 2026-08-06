
(function(){
  function ensureCalculatorNav(){
    var tabBar=document.getElementById('tabBar');
    if(!tabBar)return;
    if(tabBar.querySelector("button[onclick*=\"calc\"]"))return;
    var ops=[].slice.call(tabBar.querySelectorAll('.nav-group')).find(function(g){return (g.dataset&&g.dataset.group==='ops') || (g.textContent||'').indexOf('Sales Operations')>=0;});
    var items=ops?ops.querySelector('.nav-group-items'):null;
    if(!items)return;
    var btn=document.createElement('button');
    btn.className='tab nav-item';
    btn.dataset.navLabel='Calculator';
    btn.dataset.navIcon='🧮';
    btn.setAttribute('onclick',"gt('calc',this)");
    btn.innerHTML='<span class="nav-icon">🧮</span><span class="nav-label">Calculator</span>';
    btn.onclick=function(){ if(typeof gt==='function')gt('calc',btn); if(typeof tcpSetActiveNavButton==='function')tcpSetActiveNavButton('calc'); };
    items.appendChild(btn);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(ensureCalculatorNav,50);});
  else setTimeout(ensureCalculatorNav,50);
})();
