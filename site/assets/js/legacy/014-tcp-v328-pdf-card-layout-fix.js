
(function(){
  function htmlEscape(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function normalizeProdIntelCards(){
    var grid=document.querySelector('#pg-prodintel .prodintel-method-grid');
    if(grid){grid.style.removeProperty('display');grid.style.removeProperty('flex-direction');grid.style.removeProperty('flex-wrap');grid.style.removeProperty('overflow-x');grid.style.removeProperty('overflow-y');grid.style.removeProperty('width');grid.style.removeProperty('max-width');}
    document.querySelectorAll('#pg-prodintel .prodintel-method-card').forEach(function(card){card.style.removeProperty('flex');card.style.removeProperty('flex-basis');card.style.removeProperty('min-width');card.style.removeProperty('max-width');card.style.removeProperty('width');});
  }
  window.normalizeProdIntelCardsV328=normalizeProdIntelCards;
  var oldRender=window.renderProdIntelPage;
  if(typeof oldRender==='function'&&!oldRender.__v328SmartCards){
    var r=function(){var out=oldRender.apply(this,arguments);setTimeout(normalizeProdIntelCards,30);setTimeout(normalizeProdIntelCards,220);return out;};
    r.__v328SmartCards=true;window.renderProdIntelPage=r;
  }
  var oldGt=window.gt;
  if(typeof oldGt==='function'&&!oldGt.__v328SmartCards){
    var g=function(page,btn){var out=oldGt.apply(this,arguments);if(page==='prodintel')setTimeout(normalizeProdIntelCards,60);return out;};
    g.__v328SmartCards=true;window.gt=g;
  }
  window.saveDeadlinePdf=function(){
    var result=document.getElementById('dlResult');
    if(!result||!result.textContent.trim())return;
    var form=(typeof readDeadlineForm==='function')?readDeadlineForm():{decos:[]};
    var decoHtml=(form.decos||[]).map(function(d){return '<li>'+htmlEscape(d.deco||'')+' — '+htmlEscape(d.art||'')+(d.mockup?' — mockup needed':'')+'</li>';}).join('')||'<li>No decoration methods listed.</li>';
    var resultText=result.textContent || '';
    var statusClass=/not on track|miss/i.test(resultText)?'deadline-bad':/tight|risk|watch/i.test(resultText)?'deadline-warn':'deadline-good';
    var cleanResult=result.innerHTML
      .replace(/class="cutoff-result[^\"]*"/gi,'')
      .replace(/style="[^"]*background[^\"]*"/gi,'')
      .replace(/style='[^']*background[^']*'/gi,'');
    var print=document.getElementById('deadlinePrintOnly');
    if(!print){print=document.createElement('div');print.id='deadlinePrintOnly';print.style.display='none';document.body.appendChild(print);}
    print.innerHTML='<h1>Deadline Calculator Result</h1>'+
      '<div class="print-muted">Generated from Sales Tracker • '+htmlEscape(new Date().toLocaleString())+'</div>'+
      '<div class="print-card"><strong>Order Inputs</strong><ul>'+decoHtml+'</ul><div>Garment arrival: '+htmlEscape(form.garmentDate||'-')+'</div><div>In-hands date: '+htmlEscape(form.inHands||'-')+'</div><div>Ship-to ZIP: '+htmlEscape(form.zip||'-')+'</div></div>'+
      '<div class="print-card"><strong>Calculation Result</strong><div class="'+statusClass+'" style="margin-top:8px;line-height:1.45;">'+cleanResult+'</div></div>';
    document.body.classList.add('deadline-print-mode');
    setTimeout(function(){window.print();setTimeout(function(){document.body.classList.remove('deadline-print-mode');},700);},80);
  };
  function boot(){normalizeProdIntelCards();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,120);});else setTimeout(boot,120);
  window.addEventListener('load',function(){setTimeout(boot,260);});
})();
