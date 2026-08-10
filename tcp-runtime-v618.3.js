(function(){
  'use strict';
  if(window.TCP_RUNTIME_V61831)return;

  var release={version:'v618.3.1',title:'Sales Tracker v618.3.1 — Data & Persistence',sub:'Data & Persistence Certification',schemaVersion:616};
  window.TCP_RELEASE=release;
  window.__tcpBootCount=(window.__tcpBootCount||0)+1;
  try{document.documentElement.dataset.tcpRelease=release.version;}catch(e){}

  var listeners=Object.create(null);
  var events={
    on:function(name,fn){if(typeof fn!=='function')return function(){};(listeners[name]||(listeners[name]=[])).push(fn);return function(){events.off(name,fn)}},
    off:function(name,fn){var a=listeners[name]||[],i=a.indexOf(fn);if(i>=0)a.splice(i,1)},
    emit:function(name,detail){(listeners[name]||[]).slice().forEach(function(fn){try{fn(detail)}catch(e){console.error('[TCP event '+name+']',e)}});try{window.dispatchEvent(new CustomEvent('tcp:'+name,{detail:detail}))}catch(e){}},
    count:function(name){return (listeners[name]||[]).length}
  };

  var nativeSetInterval=window.setInterval.bind(window);
  var nativeClearInterval=window.clearInterval.bind(window);
  var intervals=new Map(),intervalSeq=0;
  window.setInterval=function(fn,delay){
    var args=Array.prototype.slice.call(arguments,2);
    var id=nativeSetInterval.apply(window,[fn,delay].concat(args));
    var label='anonymous';
    try{label=(fn&&fn.name)||String(fn).slice(0,90).replace(/\s+/g,' ')}catch(e){}
    intervals.set(id,{seq:++intervalSeq,delay:Number(delay)||0,label:label,createdAt:new Date().toISOString()});
    return id
  };
  window.clearInterval=function(id){intervals.delete(id);return nativeClearInterval(id)};

  var observerRecords=[],NativeMutationObserver=window.MutationObserver;
  if(NativeMutationObserver){
    function TrackedMutationObserver(callback){
      var rec={id:observerRecords.length+1,createdAt:new Date().toISOString(),callbacks:0,lastCallback:'',targets:[],disconnected:false};
      observerRecords.push(rec);
      var obs=new NativeMutationObserver(function(records,observer){rec.callbacks++;rec.lastCallback=new Date().toISOString();return callback(records,observer)});
      var nativeObserve=obs.observe.bind(obs),nativeDisconnect=obs.disconnect.bind(obs);
      obs.observe=function(target,options){try{rec.targets.push({target:(target&&target.id)?'#'+target.id:(target&&target.className?'.'+String(target.className).trim().replace(/\s+/g,'.'):(target&&target.tagName||'node')),options:options||{}})}catch(e){}return nativeObserve(target,options)};
      obs.disconnect=function(){rec.disconnected=true;return nativeDisconnect()};
      return obs
    }
    TrackedMutationObserver.prototype=NativeMutationObserver.prototype;
    try{Object.setPrototypeOf(TrackedMutationObserver,NativeMutationObserver)}catch(e){}
    window.MutationObserver=TrackedMutationObserver
  }

  function activeIntervals(){return Array.from(intervals.entries()).map(function(pair){var v=pair[1];return{id:String(pair[0]),seq:v.seq,delay:v.delay,label:v.label,createdAt:v.createdAt}}).sort(function(a,b){return a.delay-b.delay})}
  function activeObservers(){return observerRecords.filter(function(x){return !x.disconnected}).map(function(x){return{id:x.id,createdAt:x.createdAt,callbacks:x.callbacks,lastCallback:x.lastCallback,targets:x.targets.slice()}})}
  function diagnostics(){
    var ints=activeIntervals(),obs=activeObservers();
    return{release:release.version,bootCount:window.__tcpBootCount,activeIntervalCount:ints.length,activeIntervals:ints,highFrequencyIntervals:ints.filter(function(x){return x.delay>0&&x.delay<1000}),activeObserverCount:obs.length,activeObservers:obs,page:(document.querySelector('.page.active')||{}).id||'',persistent:window._tcpPersistentMeta||null,eventListeners:Object.keys(listeners).reduce(function(o,k){o[k]=listeners[k].length;return o},{}),timestamp:new Date().toISOString()}
  }

  var runtime={release:release,events:events,diagnostics:diagnostics,activeIntervals:activeIntervals,activeObservers:activeObservers,native:{setInterval:nativeSetInterval,clearInterval:nativeClearInterval,MutationObserver:NativeMutationObserver}};
  window.TCP_RUNTIME_V61831=runtime;
  window.TCP_RUNTIME_V6182=window.TCP_RUNTIME_V6182||runtime;
  window.TCP_RUNTIME_V6181=window.TCP_RUNTIME_V6181||runtime;
  if(window.__tcpBootCount>1)console.warn('[v618.3.1] Duplicate application bootstrap detected:',window.__tcpBootCount);
  events.emit('runtime:boot',{release:release,bootCount:window.__tcpBootCount});
})();

;try{if(window.TCP_RUNTIME_V61831&&!window.TCP_RUNTIME_V6183)window.TCP_RUNTIME_V6183=window.TCP_RUNTIME_V61831}catch(e){}
