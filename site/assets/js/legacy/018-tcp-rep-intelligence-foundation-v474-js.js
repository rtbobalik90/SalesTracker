
(function(){
  function repIntelEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function repIntelMoney(v){v=Number(v||0);if(Math.abs(v)>=1000000)return '$'+(v/1000000).toFixed(1).replace(/\.0$/,'')+'M';if(Math.abs(v)>=1000)return '$'+Math.round(v/1000)+'K';return '$'+Math.round(v).toLocaleString();}
  function repIntelActive(){try{return activeReps();}catch(e){return (S.reps||[]).filter(function(r){return r&&!r.retired;});}}
  function repIntelSelectedWeek(){try{var yr=getYr(),q=getQ(),wn=getWN();return (gwq(yr,q)||[]).find(function(w){return String(w.num)===String(wn);})||null;}catch(e){return null;}}
  function repIntelSetOptions(el,items,value,labelFn,valueFn){if(!el)return;el.innerHTML=(items||[]).map(function(item){var v=valueFn?valueFn(item):item,l=labelFn?labelFn(item):item;return '<option value="'+repIntelEsc(v)+'">'+repIntelEsc(l)+'</option>';}).join('');if(value!=null)el.value=String(value);}
  function repIntelSyncContext(){
    var gy=document.getElementById('selYr'),gq=document.getElementById('selQ'),gm=document.getElementById('selM'),gw=document.getElementById('selW');
    if(!gy||!gq||!gm||!gw)return;
    repIntelSetOptions(document.getElementById('repCtxYr'),Array.prototype.slice.call(gy.options).map(function(o){return o.value;}),gy.value);
    repIntelSetOptions(document.getElementById('repCtxQ'),Array.prototype.slice.call(gq.options).map(function(o){return o.value;}),gq.value);
    repIntelSetOptions(document.getElementById('repCtxM'),Array.prototype.slice.call(gm.options).map(function(o){return o.value;}),gm.value);
    repIntelSetOptions(document.getElementById('repCtxW'),Array.prototype.slice.call(gw.options),gw.value,function(o){return o.textContent;},function(o){return o.value;});
    var wk=repIntelSelectedWeek();
    var line=document.getElementById('repIntelContextLine');
    if(line)line.innerHTML='<span style="color:#8DE3FF;font-weight:950;">'+repIntelEsc(getQ()+' '+getYr())+'</span><span style="opacity:.35;">•</span><span>'+repIntelEsc(getM())+'</span><span style="opacity:.35;">•</span><span>'+repIntelEsc(wk?wk.label:('Week '+getWN()))+'</span>';
    var badge=document.getElementById('repIntelPeriodBadge');if(badge)badge.textContent=getQ()+' '+getYr()+' · '+getM();
  }
  window.repIntelSetContext=function(kind,value){
    try{
      if(kind==='year'){document.getElementById('selYr').value=value;onYrChange();}
      else if(kind==='quarter'){document.getElementById('selQ').value=value;onQChange();}
      else if(kind==='month'){document.getElementById('selM').value=value;onMChange();}
      else if(kind==='week'){document.getElementById('selW').value=value;onWChange();}
      repIntelSyncContext();
    }catch(e){console.warn('rep context:',e);}
  };
  window.repIntelSelectRep=function(name){try{if(name)selectRep(name);}catch(e){console.warn('rep select:',e);}};
  function repIntelUpdateQuickSelect(){
    var el=document.getElementById('repQuickSelect');if(!el)return;
    var reps=repIntelActive();
    if(!reps.length){el.innerHTML='<option value="">No active reps</option>';return;}
    if(!selectedRep||!reps.some(function(r){return r.name===selectedRep;}))selectedRep=reps[0].name;
    el.innerHTML=reps.map(function(r){return '<option value="'+repIntelEsc(r.name)+'">'+repIntelEsc(r.name)+'</option>';}).join('');
    el.value=selectedRep;
    var r=reps.find(function(x){return x.name===selectedRep;});
    var meta=document.getElementById('repIntelSelectedMeta');
    if(meta&&r){var role='Sales rep';try{role=roleDef(repRole(r)).name||role;}catch(e){}meta.textContent=role+' · performance, coaching, quality, and history';}
  }
  function repIntelUpdatePulse(){
    var host=document.getElementById('repIntelTeamPulse');if(!host)return;
    var reps=repIntelActive(),wk=repIntelSelectedWeek(),weekKey=wk&&wk.key;
    var wkRev=0,wkCalls=0,qRev=0;
    reps.forEach(function(r){try{var wd=weekKey?gd(r.name+'|'+weekKey):{};wkRev+=Number(wd.revenue||0);wkCalls+=Number(wd.calls||0);qRev+=Number((totW(r.name,gwq(getYr(),getQ()))||{}).revenue||0);}catch(e){}});
    host.innerHTML='<div class="rep-intel-pulse-chip"><span>Active reps</span><strong>'+reps.length+'</strong></div>'+
      '<div class="rep-intel-pulse-chip"><span>Selected week</span><strong>'+repIntelMoney(wkRev)+'</strong></div>'+
      '<div class="rep-intel-pulse-chip"><span>Week calls</span><strong>'+Math.round(wkCalls).toLocaleString()+'</strong></div>'+
      '<div class="rep-intel-pulse-chip"><span>'+repIntelEsc(getQ())+' revenue</span><strong>'+repIntelMoney(qRev)+'</strong></div>';
  }
  function repIntelRenderCards(){
    var el=document.getElementById('repCards');if(!el)return;
    var reps=repIntelActive(),yr=getYr(),q=getQ(),wk=repIntelSelectedWeek(),weekKey=wk&&wk.key;
    var ranks=reps.map(function(r){var d=weekKey?gd(r.name+'|'+weekKey):{};return {name:r.name,rev:Number(d.revenue||0)};}).sort(function(a,b){return b.rev-a.rev;});
    el.innerHTML=reps.map(function(r){
      var i=S.reps.indexOf(r),goal=getGoal(r.name,yr,q),qt=totW(r.name,gwq(yr,q))||{},wd=weekKey?gd(r.name+'|'+weekKey):{};
      var pct=Number(goal.rev||0)>0?Math.round(Number(qt.revenue||0)/Number(goal.rev||0)*100):0;
      var rank=ranks.findIndex(function(x){return x.name===r.name;})+1;
      var role='Sales rep';try{role=roleDef(repRole(r)).name||role;}catch(e){}
      var safe=String(r.name||'').replace(/'/g,"\\'");
      return '<div class="rep-card'+(selectedRep===r.name?' selected':'')+'" onclick="selectRep(\''+safe+'\')">'
        +'<div class="rep-intel-card-top">'+avatarEl(r,i,42)+'<div class="rep-intel-card-id"><div class="rep-intel-card-name">'+repIntelEsc(r.name)+'</div><div class="rep-intel-card-role">'+repIntelEsc(role)+'</div></div><div class="rep-intel-rank">#'+rank+'</div></div>'
        +'<div class="rep-intel-card-metrics"><div class="rep-intel-mini"><span>Week sales</span><strong>'+repIntelMoney(wd.revenue||0)+'</strong></div><div class="rep-intel-mini"><span>'+repIntelEsc(q)+' sales</span><strong>'+repIntelMoney(qt.revenue||0)+'</strong></div><div class="rep-intel-mini"><span>Week calls</span><strong>'+Math.round(Number(wd.calls||0)).toLocaleString()+'</strong></div></div>'
        +'<div class="rep-intel-card-foot"><div class="rep-intel-progress"><i style="width:'+Math.max(0,Math.min(100,pct))+'%"></i></div><div class="rep-intel-progress-label">'+pct+'% to qtr goal</div></div>'
        +'</div>';
    }).join('');
  }
  function repIntelRefreshChrome(){repIntelSyncContext();repIntelUpdateQuickSelect();repIntelUpdatePulse();}

  /* The Rep 360 engine now uses the selected tracker week, not simply the latest week containing data. */
  window._r360Engine=function(){
    try{
      var yr=getYr(),q=getQ(),wk=repIntelSelectedWeek();if(!wk)return null;
      var key=wk.key+'|selected';
      if(window._r360E&&window._r360E.key===key)return window._r360E.E;
      var E=buildMtgEngine(wk,yr,q);window._r360E={key:key,E:E};return E;
    }catch(e){console.warn('r360 selected context:',e);return null;}
  };

  /* Upgrade the roster cards while preserving the same underlying tracker data and rep selection flow. */
  window.renderProfileCards=repIntelRenderCards;

  var baseRenderProfiles=window.renderProfiles;
  window.renderProfiles=function(){
    var reps=repIntelActive();if(reps.length&&(!selectedRep||!reps.some(function(r){return r.name===selectedRep;})))selectedRep=reps[0].name;
    if(typeof baseRenderProfiles==='function')baseRenderProfiles();
    repIntelRefreshChrome();
  };
  var baseSelectRep=window.selectRep;
  window.selectRep=function(name){if(typeof baseSelectRep==='function')baseSelectRep(name);repIntelRefreshChrome();};

  function wrapContextHandler(name){
    var base=window[name];if(typeof base!=='function')return;
    window[name]=function(){var out=base.apply(this,arguments);window._r360E=null;var pg=document.getElementById('pg-profiles');if(pg&&pg.classList.contains('active')){try{window.renderProfiles();}catch(e){console.warn('rep refresh:',e);}}else{repIntelSyncContext();}return out;};
  }
  ['onYrChange','onQChange','onMChange','onWChange'].forEach(wrapContextHandler);

  window.addEventListener('load',function(){setTimeout(function(){try{repIntelRefreshChrome();}catch(e){}},850);});
})();
