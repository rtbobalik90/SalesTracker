
(function(){
  function isDeadlinePanel(sec){
    if(!sec)return false;
    var txt=(sec.textContent||'').toLowerCase();
    return txt.indexOf('deadline calculator')>=0 || txt.indexOf('can we hit the date')>=0;
  }
  function purgeCalculatorOutsideCalc(){
    // Remove any calculator/Deadline sections that were moved into Intelligence or Production Intelligence.
    ['pg-prodintel','pg-cknow'].forEach(function(pid){
      var page=document.getElementById(pid); if(!page)return;
      Array.prototype.slice.call(page.querySelectorAll('section, .cknow-panel, .prodintel-panel')).forEach(function(sec){
        if(isDeadlinePanel(sec))sec.remove();
      });
      var slot=page.querySelector('#prodintel-calc-slot'); if(slot)slot.remove();
    });
  }
  var oldRelocate=window.relocateProductionSections;
  window.relocateProductionSections=function(){
    try{
      var ck=document.getElementById('pg-cknow');
      var dest=document.getElementById('prodintel-content');
      var admin=document.getElementById('pg-admin');
      if(ck&&dest&&admin){
        function findSec(txt){
          var secs=ck.querySelectorAll('section.cknow-panel');
          for(var i=0;i<secs.length;i++){
            var k=secs[i].querySelector('.cknow-section-kicker');
            if(k&&k.textContent.trim().toLowerCase().indexOf(txt)>=0)return secs[i];
          }
          return null;
        }
        var prodStatus=findSec('live production status');
        var prodIntel=findSec('production intelligence');
        var deadline=findSec('deadline calculator');
        if(deadline)deadline.remove();
        if(prodIntel)dest.appendChild(prodIntel);
        if(prodStatus)admin.appendChild(prodStatus);
      }else if(typeof oldRelocate==='function'){
        try{oldRelocate();}catch(e){}
      }
    }catch(e){}
    purgeCalculatorOutsideCalc();
  };
  function calcPageHtml(){
    return '<div class="prodintel-page calc-page">'+
      '<section class="prodintel-hero">'+
        '<div><div class="prodintel-eyebrow">Sales operations tool</div><h1>Deadline Calculator</h1><p>Calculate whether an order can hit an in-hands date using garment arrival, decoration method, art status, production lead times, and estimated transit.</p></div>'+
      '</section>'+
      '<section class="prodintel-grid">'+
        '<section class="prodintel-panel calc-main-panel" id="calcDeadlineMount">'+
          '<div class="prodintel-kicker">Deadline calculator</div><div class="prodintel-title">Can we hit the date?</div><p class="prodintel-sub">Add each decoration method on the order with its art status, then garment arrival, in-hands date, and ship-to ZIP.</p>'+
          '<div id="dlDecoBlocks"></div>'+
          '<div class="calc-actions"><button type="button" onclick="addDeadlineDeco()" class="sbtn">+ Add deco method</button></div>'+
          '<div class="cutoff-form"><div class="ig"><label>Last garment arriving to TCP</label><input type="date" id="dlGarmentDate"></div><div class="ig"><label>In-hands date</label><input type="date" id="dlInHands"></div><div class="ig"><label>Ship-to ZIP</label><input type="text" id="dlZip" maxlength="5" inputmode="numeric" placeholder="e.g. 90210"></div><button class="sbtn entry-primary" onclick="calculateDeadline()">Calculate</button></div>'+
          '<div id="dlResult" class="cutoff-result">Add your deco methods and dates, then hit Calculate.</div>'+
          '<button id="dlSavePdfBtn" type="button" class="sbtn calc-pdf-btn" onclick="saveDeadlinePdf()">💾 Save PDF</button>'+
          '<div style="display:none;" aria-hidden="true"><input type="date" id="cutoffEventDate"><select id="cutoffDecoration"></select><div id="cutoffResult"></div></div>'+
        '</section>'+
        '<aside class="prodintel-panel calc-side-panel">'+
          '<div class="prodintel-kicker">Calculator guidance</div><div class="prodintel-title">How to use this</div><p class="prodintel-sub">This page is intentionally separate from Production Intelligence. Use Production Intelligence to view timelines; use this calculator to pressure-test a specific order deadline.</p>'+
          '<div class="calc-help-list"><div class="calc-help-item"><strong>1. Add decoration methods</strong><span>Add every method on the order. Multi-deco orders should include each decoration so the timeline is realistic.</span></div><div class="calc-help-item"><strong>2. Confirm art status</strong><span>New art, repeat art, and mockups can affect the timeline. Make sure this matches what the rep actually has.</span></div><div class="calc-help-item"><strong>3. Save the result</strong><span>After the calculation runs, use Save PDF to keep a clean customer/order deadline record.</span></div></div>'+
        '</aside>'+
      '</section>'+
    '</div>';
  }
  function ensureCalculatorPageV327(){
    var page=document.getElementById('pg-calc');
    if(!page){page=document.createElement('div');page.id='pg-calc';page.className='page';(document.querySelector('.wrap')||document.body).appendChild(page);}
    page.innerHTML=calcPageHtml();
    try{if(typeof addDeadlineDeco==='function')addDeadlineDeco();}catch(e){}
  }
  window.ensureCalculatorPageV327=ensureCalculatorPageV327;
  var oldInit=window.initCalculatorPage;
  window.initCalculatorPage=function(){
    purgeCalculatorOutsideCalc();
    ensureCalculatorPageV327();
    try{if(typeof renderDeadlineArtConfig==='function')renderDeadlineArtConfig();}catch(e){}
    if(typeof oldInit==='function'){
      try{oldInit.apply(this,arguments);}catch(e){}
    }
    purgeCalculatorOutsideCalc();
  };
  var oldCalc=window.calculateDeadline;
  window.calculateDeadline=async function(){
    var btn=document.getElementById('dlSavePdfBtn'); if(btn)btn.classList.remove('ready');
    var res;
    if(typeof oldCalc==='function')res=await oldCalc.apply(this,arguments);
    setTimeout(function(){var b=document.getElementById('dlSavePdfBtn'),r=document.getElementById('dlResult');if(b&&r&&r.textContent&&r.textContent.indexOf('Add your deco')<0&&r.textContent.indexOf('Calculating')<0&&r.textContent.indexOf('Fill in')<0&&r.textContent.indexOf('Add at least')<0){b.classList.add('ready');}},80);
    return res;
  };
  window.saveDeadlinePdf=function(){
    var result=document.getElementById('dlResult');
    if(!result||!result.textContent.trim())return;
    var form=(typeof readDeadlineForm==='function')?readDeadlineForm():{decos:[]};
    var decoHtml=(form.decos||[]).map(function(d){return '<li>'+String(d.deco||'').replace(/</g,'&lt;')+' — '+String(d.art||'').replace(/</g,'&lt;')+(d.mockup?' — mockup needed':'')+'</li>';}).join('')||'<li>No decoration methods listed.</li>';
    var print=document.getElementById('deadlinePrintOnly');
    if(!print){print=document.createElement('div');print.id='deadlinePrintOnly';print.style.display='none';document.body.appendChild(print);}
    print.innerHTML='<h1>Deadline Calculator Result</h1><div class="print-muted">Generated from Sales Tracker • '+new Date().toLocaleString()+'</div><div class="print-card"><strong>Order Inputs</strong><ul>'+decoHtml+'</ul><div>Garment arrival: '+(form.garmentDate||'-')+'</div><div>In-hands date: '+(form.inHands||'-')+'</div><div>Ship-to ZIP: '+(form.zip||'-')+'</div></div><div class="print-card"><strong>Calculation Result</strong><div>'+result.innerHTML+'</div></div>';
    document.body.classList.add('deadline-print-mode');
    setTimeout(function(){window.print();setTimeout(function(){document.body.classList.remove('deadline-print-mode');},500);},50);
  };
  var oldGt=window.gt;
  if(typeof oldGt==='function'&&!oldGt.__v327CalcSeparate){
    var wrapped=function(page,btn){
      if(page==='calc')ensureCalculatorPageV327();
      var r=oldGt.apply(this,arguments);
      if(page==='calc')setTimeout(function(){ensureCalculatorPageV327();},0);
      if(page==='prodintel'||page==='cknow')setTimeout(purgeCalculatorOutsideCalc,80);
      return r;
    };
    wrapped.__v327CalcSeparate=true;window.gt=wrapped;
  }
  function boot(){purgeCalculatorOutsideCalc(); if(document.querySelector('#pg-calc.active'))ensureCalculatorPageV327();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,80);});else setTimeout(boot,80);
  window.addEventListener('load',function(){setTimeout(boot,220);});
})();
