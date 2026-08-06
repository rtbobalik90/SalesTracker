
(function(){
  function ensureCalcPage(){
    var page=document.getElementById('pg-calc');
    if(!page){page=document.createElement('div');page.id='pg-calc';page.className='page';(document.querySelector('.wrap')||document.body).appendChild(page);}
    if(!page.querySelector('.prodintel-hero')){
      page.innerHTML='<div class="prodintel-page"><section class="prodintel-hero"><div><div class="prodintel-eyebrow">Sales operations tool</div><h1>Deadline Calculator</h1><p>Calculate whether an order can hit an in-hands date using garment arrival, decoration method, art status, production lead times, and estimated transit.</p></div><div class="prodintel-hero-actions"><button class="sbtn" onclick="addDeadlineDeco()">+ Add deco method</button><button class="sbtn entry-primary" onclick="calculateDeadline()">Calculate</button></div></section><section class="prodintel-panel prodintel-full" id="calcDeadlineMount"><div class="prodintel-kicker">Deadline calculator</div><div class="prodintel-title">Can we hit the date?</div><div class="prodintel-sub">This tool uses current production status, configured art days, and a transit estimate to help reps quote realistic timelines.</div></section></div>';
    }
    var mount=document.getElementById('calcDeadlineMount');
    if(!mount){mount=document.createElement('section');mount.id='calcDeadlineMount';mount.className='prodintel-panel prodintel-full';page.appendChild(mount);}
    if(!mount.querySelector('#dlDecoBlocks')){
      mount.innerHTML='<div class="prodintel-kicker">Deadline calculator</div><div class="prodintel-title">Can we hit the date?</div><p class="prodintel-sub">Add each decoration method on the order with its art status, then garment arrival, in-hands date, and ship-to ZIP.</p><div id="dlDecoBlocks"></div><button type="button" onclick="addDeadlineDeco()" class="sbtn" style="margin-bottom:12px;">+ Add deco method</button><div class="cutoff-form"><div class="ig"><label>Last garment arriving to TCP</label><input type="date" id="dlGarmentDate"></div><div class="ig"><label>In-hands date</label><input type="date" id="dlInHands"></div><div class="ig"><label>Ship-to ZIP</label><input type="text" id="dlZip" maxlength="5" inputmode="numeric" placeholder="e.g. 90210"></div><button class="sbtn entry-primary" onclick="calculateDeadline()">Calculate</button></div><div id="dlResult" class="cutoff-result">Add your deco methods and dates, then hit Calculate.</div><div style="display:none;" aria-hidden="true"><input type="date" id="cutoffEventDate"><select id="cutoffDecoration"></select><div id="cutoffResult"></div></div>';
    }
    try{if(typeof renderDeadlineArtConfig==='function')renderDeadlineArtConfig();}catch(e){}
    try{var box=document.getElementById('dlDecoBlocks');if(box&&!box.querySelector('.dl-deco-block')&&typeof addDeadlineDeco==='function')addDeadlineDeco();}catch(e){}
  }
  function ensureCalcNav(){
    var tabBar=document.getElementById('tabBar');if(!tabBar)return;
    var existing=tabBar.querySelector('button[onclick*="calc"],button[data-nav-label="Calculator"]');if(existing)return;
    var ops=[].slice.call(tabBar.querySelectorAll('.nav-group')).find(function(g){return g.dataset&&g.dataset.group==='ops';});
    var items=ops&&ops.querySelector('.nav-group-items');if(!items)return;
    var btn=document.createElement('button');btn.className='tab nav-item';btn.dataset.navLabel='Calculator';btn.dataset.navIcon='🧮';btn.innerHTML='<span class="nav-icon">🧮</span><span class="nav-label">Calculator</span>';btn.onclick=function(){if(typeof window.gt==='function')window.gt('calc',btn);if(typeof window.tcpSetActiveNavButton==='function')window.tcpSetActiveNavButton('calc');};items.appendChild(btn);
  }
  function restyleProdCards(){var grid=document.querySelector('#pg-prodintel .prodintel-method-grid');if(grid){grid.style.flexDirection='row';grid.style.flexWrap='nowrap';grid.style.overflowX='auto';}}
  window.ensureCalculatorPageV325=ensureCalcPage;
  var oldInit=window.initCalculatorPage;window.initCalculatorPage=function(){try{ensureCalcPage();}catch(e){}if(typeof oldInit==='function'){try{return oldInit.apply(this,arguments);}catch(e){}}};
  var oldGt=window.gt;if(typeof oldGt==='function'&&!oldGt.__v325CalcFix){var wrapped=function(page,btn){if(page==='calc')ensureCalcPage();var res=oldGt.apply(this,arguments);if(page==='calc')setTimeout(ensureCalcPage,0);if(page==='prodintel')setTimeout(restyleProdCards,40);return res;};wrapped.__v325CalcFix=true;window.gt=wrapped;}
  var oldRender=window.renderProdIntelPage;if(typeof oldRender==='function'&&!oldRender.__v325RowFix){var r=function(){var res=oldRender.apply(this,arguments);setTimeout(restyleProdCards,20);return res;};r.__v325RowFix=true;window.renderProdIntelPage=r;}
  function boot(){restyleProdCards();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,80);});else setTimeout(boot,80);
  window.addEventListener('load',function(){setTimeout(boot,220);});
})();
