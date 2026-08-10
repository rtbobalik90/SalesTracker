(function(){
 'use strict';
 if(window.TCP_ROUTER_V6183)return;
 var runtime=window.TCP_RUNTIME_V6183,events=runtime&&runtime.events;
 function channel(name){
  var before=[],after=[],routes=Object.create(null),legacy=null,routeSeq=0,activeDepth=0;
  function sort(a){a.sort(function(x,y){return (x.priority-y.priority)||(x.seq-y.seq)})}
  function add(bucket,id,fn,priority){if(typeof fn!=='function')return false;bucket.push({id:String(id||('hook-'+(bucket.length+1))),fn:fn,priority:Number(priority)||100,seq:bucket.length+1});sort(bucket);return true}
  function route(page,fn){if(!page||typeof fn!=='function')return false;routes[String(page)]=fn;return true}
  function adopt(fn){if(typeof fn!=='function'||fn===go)return false;legacy=fn;return true}
  function runHooks(bucket,ctx){for(var i=0;i<bucket.length;i++){try{bucket[i].fn(ctx)}catch(e){ctx.hookErrors.push({id:bucket[i].id,message:e&&e.message||String(e)});console.error('[TCP '+name+' router '+bucket[i].id+']',e)}}}
  function go(){
   var args=Array.prototype.slice.call(arguments),requested=args[0],ctx={channel:name,id:++routeSeq,requestedPage:requested,page:requested,args:args.slice(),thisArg:this,handled:false,cancelled:false,result:undefined,hookErrors:[],startedAt:Date.now()};
   activeDepth++;
   try{
    runHooks(before,ctx);
    if(!ctx.cancelled){
     var handler=routes[String(ctx.page)];
     if(handler){ctx.handled=true;ctx.result=handler(ctx)}
     else if(legacy){var callArgs=ctx.args.slice();callArgs[0]=ctx.page;ctx.result=legacy.apply(ctx.thisArg,callArgs)}
     else throw new Error('No legacy '+name+' router has been adopted.')
    }
    runHooks(after,ctx);
    ctx.durationMs=Date.now()-ctx.startedAt;
    if(events)events.emit('route',{channel:name,id:ctx.id,requestedPage:ctx.requestedPage,page:ctx.page,handled:ctx.handled,cancelled:ctx.cancelled,durationMs:ctx.durationMs,hookErrors:ctx.hookErrors});
    return ctx.result
   }catch(e){
    ctx.durationMs=Date.now()-ctx.startedAt;ctx.error=e&&e.message||String(e);
    if(events)events.emit('route:error',ctx);
    throw e
   }finally{activeDepth--}
  }
  return{
   name:name,go:go,adopt:adopt,route:route,
   before:function(id,fn,priority){return add(before,id,fn,priority)},
   after:function(id,fn,priority){return add(after,id,fn,priority)},
   diagnostics:function(){return{name:name,adopted:!!legacy,beforeHooks:before.map(function(x){return{id:x.id,priority:x.priority}}),afterHooks:after.map(function(x){return{id:x.id,priority:x.priority}}),routes:Object.keys(routes),routeCount:routeSeq,activeDepth:activeDepth}}
  }
 }
 window.TCP_ROUTER_V6183={version:'v618.3',manager:channel('manager'),rep:channel('rep'),diagnostics:function(){return{version:'v618.3',manager:this.manager.diagnostics(),rep:this.rep.diagnostics()}}};
 window.TCP_ROUTER_V6182=window.TCP_ROUTER_V6182||window.TCP_ROUTER_V6183;
})();
