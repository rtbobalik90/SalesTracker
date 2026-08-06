
(function(){
 'use strict';

 var VERSION='v566';
 var STORE='tcp_call_cycle_engine_v547';
 var installing=false;
 var wrapped=false;
 var sourceCache={rep:'',signature:'',rows:[],at:0};
 var base={};

 function arr(value){
  if(Array.isArray(value))return value;
  if(!value)return[];
  try{
   if(typeof value.length==='number'&&typeof value!=='string'){
    return Array.prototype.slice.call(value)
   }
   if(typeof value==='object'){
    return Object.keys(value).map(function(key){return value[key]}).filter(Boolean)
   }
  }catch(error){}
  return[]
 }
 function clean(value){return String(value==null?'':value).trim()}
 function norm(value){return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function n(value){
  var number=Number(value);
  return isFinite(number)?number:0
 }
 function field(object,names,def){
  for(var i=0;i<names.length;i++){
   var value=object&&object[names[i]];
   if(value!=null&&clean(value)!=='')return value
  }
  return def==null?'':def
 }
 function read(){
  try{
   var value=JSON.parse(localStorage.getItem(STORE)||'null');
   return value&&typeof value==='object'?value:null
  }catch(error){return null}
 }
 function write(value){
  try{
   value.updatedAt=new Date().toISOString();
   localStorage.setItem(STORE,JSON.stringify(value));
   return true
  }catch(error){
   console.warn('[v566 call link storage]',error);
   return false
  }
 }
 function dateValue(value){
  if(!value)return null;
  try{
   var date=value instanceof Date?
    new Date(value.getTime()):
    new Date(String(value).length===10?String(value)+'T12:00:00':value);
   return isNaN(date.getTime())?null:date
  }catch(error){return null}
 }
 function iso(value){
  var date=dateValue(value);
  return date?
   date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0'):
   ''
 }
 function hash(value){
  var text=String(value||''),result=2166136261;
  for(var i=0;i<text.length;i++){
   result^=text.charCodeAt(i);
   result+=(result<<1)+(result<<4)+(result<<7)+(result<<8)+(result<<24)
  }
  return(result>>>0).toString(36)
 }
 function currentRep(){
  return clean(window._rp2&&_rp2.rep||'')
 }
 function cacheMatchesRep(cache,rep){
  if(!cache||!arr(cache.rows).length)return false;
  var stamp=clean(cache.stamp);
  return !stamp||stamp.split('|')[0]===rep
 }
 function generateCompanyDirectory(rep){
  if(!rep||typeof window._rp2CustomersV2!=='function'||!window._rp2)return[];

  var oldRep=_rp2.rep;
  var oldKey=window._rp2CompanyOpenKey;
  var oldName=window._cw4CompanyName;
  var oldProfileTab=window._rp2CompanyProfileTab;
  var oldCache=window._cw4DirectoryCache;

  try{
   _rp2.rep=rep;
   window._rp2CompanyOpenKey='';
   window._cw4CompanyName='';
   window._rp2CompanyProfileTab='overview';
   window._cw4DirectoryCache=null;

   /*
     Company Workspace computes its complete directory before returning HTML.
     We intentionally use that exact computation rather than recreating it.
   */
   window._rp2CustomersV2();

   var generated=window._cw4DirectoryCache;
   if(cacheMatchesRep(generated,rep))return arr(generated.rows)
  }catch(error){
   console.warn('[v566 exact Company Workspace source]',error)
  }finally{
   _rp2.rep=oldRep;
   window._rp2CompanyOpenKey=oldKey;
   window._cw4CompanyName=oldName;
   window._rp2CompanyProfileTab=oldProfileTab;

   /*
     Keep the generated cache only when it belongs to the active portal rep.
     Otherwise restore the prior page cache to avoid cross-rep leakage.
   */
   if(oldRep!==rep){
    window._cw4DirectoryCache=oldCache
   }
  }
  return[]
 }
 function exactDirectoryRows(rep,force){
  var now=Date.now();
  if(!force&&sourceCache.rep===rep&&sourceCache.rows.length&&now-sourceCache.at<30000){
   return sourceCache.rows
  }

  var cache=window._cw4DirectoryCache;
  var rows=cacheMatchesRep(cache,rep)?arr(cache.rows):[];

  if(!rows.length){
   rows=generateCompanyDirectory(rep)
  }

  var signature=rows.length+'|'+hash(rows.map(function(row){
   return norm(row&&row.name)
  }).sort().join('|'));

  sourceCache={
   rep:rep,
   signature:signature,
   rows:rows,
   at:now
  };
  return rows
 }
 function callable(row){
  if(!row||!clean(row.name))return false;

  var imported=row.imported||null;
  if(imported&&imported.doNotCall)return false;

  var status=clean(row.status&&row.status.label);
  var profileStatus=clean(row.profile&&row.profile.status);
  var lifecycle=clean(row.profile&&row.profile.lifecycle);

  if(/inactive|do not call|closed account/i.test(status+' '+profileStatus))return false;
  if(/^prospect$/i.test(status))return false;

  var hasOrders=arr(row.orders).length>0;
  var hasImported=!!imported;
  var customerLifecycle=/customer|active|partner/i.test(lifecycle+' '+profileStatus);
  return hasOrders||hasImported||customerLifecycle
 }
 function directoryCustomers(rep,force){
  return exactDirectoryRows(rep,force).filter(callable)
 }
 function activityDate(row){
  var activities=arr(row&&row.activities).map(function(activity){
   return dateValue(field(activity,['date','createdAt','updatedAt','sentAt'],''))
  }).filter(Boolean).sort(function(a,b){return b-a});
  return activities[0]||null
 }
 function baseCandidate(rep,row){
  var contact=row.primaryContact||{};
  var metrics=row.metrics||{};
  var last=activityDate(row);

  return{
   id:'company_'+norm(row.name).replace(/\s+/g,'_'),
   company:row.name,
   contact:clean(field(contact,['name'],'Primary contact not recorded')),
   email:clean(field(contact,['email'],'')),
   phone:clean(field(contact,['phone','mobile'],'')),
   lastContactAt:last?iso(last):'',
   netSales:n(metrics.current),
   reason:'',
   detail:'',
   priority:50,
   completedAt:'',
   callAttemptAt:'',
   emailAt:'',
   sourceBridge:VERSION,
   sourceTypes:['company-workspace-directory']
  }
 }
 function expectedChristmas(engine,rep,company,year){
  try{
   return engine&&typeof engine.expectedChristmas==='function'?
    clean(engine.expectedChristmas(rep,company,year)||'Not answered'):
    'Not answered'
  }catch(error){return'Not answered'}
 }
 function candidates(rep,cycle,settings,force){
  var engine=window.TCP_CALL_CYCLE_V547;
  var rows=[];

  directoryCustomers(rep,force).forEach(function(company){
   var item=baseCandidate(rep,company);

   if(cycle.kind==='regular'){
    item.reason='Account Updating Call';
    item.detail=cycle.label+' · Complete one call attempt and the follow-up email.';
    var last=item.lastContactAt?dateValue(item.lastContactAt):null;
    item.priority=last?
     Math.max(1,Math.floor((new Date()-last)/86400000))*-1:
     -99999;
    rows.push(item);
    return
   }

   if(cycle.kind==='november'){
    var year=cycle.start.getFullYear();
    var christmas=expectedChristmas(engine,rep,company.name,year);
    var seasonal={current:[],historical:[],years:{}};

    try{
     if(engine&&typeof engine.seasonalEvidence==='function'){
      seasonal=engine.seasonalEvidence(
       company,
       year,
       n(settings.seasonalLookbackYears)||5
      )||seasonal
     }
    }catch(error){}

    if(christmas==='Yes'){
     item.reason='Expected Christmas Order: Yes';
     item.detail='Customer was marked Yes during the July–October Christmas-order review.';
     item.priority=1;
     rows.push(item);
     return
    }

    if(!arr(seasonal.current).length&&arr(seasonal.historical).length){
     var years=Object.keys(seasonal.years||{}).sort().reverse();
     item.reason='Historical September–November purchaser';
     item.detail='Ordered in Sep–Nov during '+years.join(', ')+'; no Sep–Nov '+year+' order is recorded.';
     item.priority=2-Math.min(.9,arr(seasonal.historical).length/20);
     item.historicalYears=years;
     item.historicalOrders=arr(seasonal.historical).length;
     rows.push(item)
    }
    return
   }

   if(cycle.kind==='december'){
    var loyalty=null;
    try{
     if(engine&&typeof engine.loyaltyInfo==='function'){
      loyalty=engine.loyaltyInfo(company,cycle.start.getFullYear(),settings)
     }
    }catch(error){}

    if(!loyalty||loyalty.priority===99)return;
    item.loyalty=loyalty;
    item.priority=loyalty.priority;

    if(loyalty.closeToNext){
     item.reason=loyalty.tier+' customer close to '+loyalty.next;
     item.detail='$'+Math.round(loyalty.sales).toLocaleString()+
      ' net sales · $'+Math.round(loyalty.gap).toLocaleString()+
      ' needed to reach '+loyalty.next+'.'
    }else{
     item.reason=loyalty.tier+' loyalty thank-you';
     item.detail='$'+Math.round(loyalty.sales).toLocaleString()+
      ' current-year net sales · thank the customer for their loyalty.'
    }
    rows.push(item)
   }
  });

  rows.sort(function(a,b){
   if(a.priority!==b.priority)return a.priority-b.priority;
   var ad=a.lastContactAt||'0000-00-00';
   var bd=b.lastContactAt||'0000-00-00';
   if(ad!==bd)return ad.localeCompare(bd);
   if(b.netSales!==a.netSales)return b.netSales-a.netSales;
   return a.company.localeCompare(b.company)
  });
  return rows
 }
 function ensure(rep,date,force){
  var engine=window.TCP_CALL_CYCLE_V547;
  if(!engine||!rep)return{
   changed:false,owned:0,set:0,reason:'engine-unavailable'
  };

  var cycle=engine.cycleFor(date||new Date());
  var value=typeof engine.state==='function'?engine.state():read();
  if(!value)return{
   changed:false,owned:0,set:0,reason:'state-unavailable'
  };

  value.settings=value.settings||{};
  value.campaigns=value.campaigns||{};

  var campaign=value.campaigns[cycle.id];
  if(!campaign){
   campaign={
    id:cycle.id,
    key:cycle.key,
    label:cycle.label,
    kind:cycle.kind,
    start:iso(cycle.start),
    end:iso(cycle.end),
    createdAt:new Date().toISOString(),
    reps:{}
   };
   value.campaigns[cycle.id]=campaign
  }

  campaign.reps=campaign.reps||{};
  var existing=campaign.reps[rep]||null;
  var oldSet=arr(existing&&existing.set);
  var built=candidates(rep,cycle,value.settings,!!force);
  var sourceCount=exactDirectoryRows(rep,!!force).length;
  var callableCount=built.length;
  var signature=callableCount+'|'+hash(built.map(function(item){
   return norm(item.company)
  }).sort().join('|'));

  var hasEvidence=oldSet.some(function(item){
   return item.completedAt||item.callAttemptAt||item.emailAt
  });

  /*
    Automatic behavior:
    - always repair an empty set once Company Workspace is available;
    - refresh a v566 set only before calling evidence exists;
    - never require a rep-facing repair button.
  */
  var emptyRepair=oldSet.length===0&&callableCount>0;
  var safeRefresh=!!(
   existing&&
   existing.sourceBridge===VERSION&&
   !hasEvidence&&
   existing.sourceSignature!==signature
  );
  var should=!!force||emptyRepair||safeRefresh;

  if(should){
   var prior={};
   oldSet.forEach(function(item){
    prior[norm(item.company)]=item
   });

   built.forEach(function(item){
    var old=prior[norm(item.company)];
    if(old){
     item.completedAt=old.completedAt||'';
     item.callAttemptAt=old.callAttemptAt||'';
     item.emailAt=old.emailAt||''
    }
   });

   campaign.reps[rep]={
    rep:rep,
    createdAt:existing&&existing.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString(),
    set:built,
    sourceBridge:VERSION,
    sourceSignature:signature,
    sourceDirectoryCount:sourceCount,
    sourceCallableCount:callableCount,
    sourceName:'Company Workspace directory'
   };

   value.audit=arr(value.audit);
   value.audit.unshift({
    id:'audit_'+Date.now().toString(36),
    at:new Date().toISOString(),
    type:force?'automatic-company-link-refresh':'automatic-company-link-repair',
    detail:callableCount+' active customer relationships loaded from the Company Workspace directory.',
    rep:rep,
    company:''
   });
   if(value.audit.length>400)value.audit=value.audit.slice(0,400);

   write(value)
  }

  var current=campaign.reps[rep]||{set:[]};
  return{
   changed:should,
   reason:force?'refresh':emptyRepair?'empty-set-repair':safeRefresh?'safe-refresh':'frozen',
   rep:rep,
   cycle:cycle,
   directory:sourceCount,
   owned:callableCount,
   set:arr(current.set).length,
   hasEvidence:hasEvidence,
   sourceBridge:current.sourceBridge||''
  }
 }
 function status(rep,date){
  var engine=window.TCP_CALL_CYCLE_V547;
  if(!engine||!rep)return{
   directory:0,owned:0,set:0,ready:false
  };

  var cycle=engine.cycleFor(date||new Date());
  var value=typeof engine.state==='function'?engine.state():read();
  var campaign=value&&value.campaigns&&value.campaigns[cycle.id];
  var row=campaign&&campaign.reps&&campaign.reps[rep];
  var directory=exactDirectoryRows(rep,false).length;
  var owned=directoryCustomers(rep,false).length;

  return{
   rep:rep,
   cycle:cycle,
   directory:directory,
   owned:owned,
   set:arr(row&&row.set).length,
   ready:owned>0&&arr(row&&row.set).length>0,
   sourceBridge:row&&row.sourceBridge||''
  }
 }
 function wrapEngine(){
  var engine=window.TCP_CALL_CYCLE_V547;
  if(!engine||wrapped)return false;

  base.paceFor=engine.paceFor;
  base.cycleQueue=engine.cycleQueue;
  base.diagnostics=engine.diagnostics;

  engine.paceFor=function(rep,date){
   ensure(rep,date,false);
   return base.paceFor.call(engine,rep,date)
  };
  engine.cycleQueue=function(rep,date){
   ensure(rep,date,false);
   return base.cycleQueue.call(engine,rep,date)
  };
  engine.diagnostics=function(rep,date){
   ensure(rep,date,false);
   var result=base.diagnostics.call(engine,rep,date);
   var link=status(rep,date);
   result.companyDirectoryCount=link.directory;
   result.ownedCompanies=link.owned;
   result.linkedSet=link.set;
   result.sourceBridge=link.sourceBridge;
   return result
  };

  engine.exactCompanyDirectory=exactDirectoryRows;
  engine.callableCompanyDirectory=directoryCustomers;
  engine.ensureAutomaticCompanyLink=ensure;
  engine._automaticCompanyLinkV566=true;

  wrapped=true;
  return true
 }
 function removeManualUi(){
  var line=document.querySelector&&document.querySelector('#rp-overlay .cc565-linkline');
  if(line)line.remove();

  var repaired=document.querySelector&&document.querySelector('#rp-overlay .cc565-repaired');
  if(repaired)repaired.remove();

  var admin=document.getElementById&&document.getElementById('tcp-call-cycle-link-v565');
  if(admin)admin.remove()
 }
 function decorate(){
  removeManualUi();

  var host=document.getElementById&&document.getElementById('ps61-cycle');
  var rep=currentRep();
  if(!host||!rep)return;

  var link=status(rep,new Date());
  var source=host.querySelector('.cc566-auto-source');
  if(!source){
   source=document.createElement('div');
   source.className='cc566-auto-source';
   var main=host.querySelector('.ps61-cycle-main')||host;
   main.appendChild(source)
  }

  if(link.ready){
   source.className='cc566-auto-source';
   source.innerHTML='<strong>'+link.set.toLocaleString()+
    ' active customer relationships linked automatically</strong>'+
    ' from '+link.directory.toLocaleString()+' Companies records.'
  }else{
   source.className='cc566-auto-source loading';
   source.innerHTML='<strong>Loading Companies automatically</strong>'+
    ' · the call plan will appear as soon as the company directory is ready.'
  }
 }
 function refreshPortal(){
  try{
   if(window._rp2&&_rp2.rep&&typeof window._rp2Go==='function'){
    window._rp2Go(_rp2.page||'home')
   }
  }catch(error){}
  setTimeout(decorate,40)
 }
 function ensureCurrent(force){
  var rep=currentRep();
  if(!rep)return null;
  sourceCache.at=0;
  var result=ensure(rep,new Date(),!!force);
  refreshPortal();
  return result
 }
 function install(){
  if(installing||wrapped)return wrapped;
  installing=true;

  try{
   if(!wrapEngine())return false;

   var desktop=window._rp2DesktopBuild;
   if(typeof desktop==='function'&&!desktop._cc566){
    var wrappedDesktop=function(){
     var rep=currentRep();
     if(rep)ensure(rep,new Date(),false);
     return desktop.apply(this,arguments)
    };
    wrappedDesktop._cc566=true;
    window._rp2DesktopBuild=wrappedDesktop
   }

   var go=window._rp2Go;
   if(typeof go==='function'&&!go._cc566){
    var wrappedGo=function(){
     var rep=currentRep();
     if(rep)ensure(rep,new Date(),false);
     var result=go.apply(this,arguments);
     setTimeout(decorate,30);
     return result
    };
    wrappedGo._cc566=true;
    window._rp2Go=wrappedGo
   }

   var refresh=window._rp2RefreshCloud;
   if(typeof refresh==='function'&&!refresh._cc566){
    var wrappedRefresh=function(){
     var result=refresh.apply(this,arguments);
     Promise.resolve(result).finally(function(){
      sourceCache.at=0;
      var rep=currentRep();
      if(rep)ensure(rep,new Date(),false);
      refreshPortal()
     });
     return result
    };
    wrappedRefresh._cc566=true;
    window._rp2RefreshCloud=wrappedRefresh
   }

   removeManualUi();
   var rep=currentRep();
   if(rep)ensure(rep,new Date(),false);
   setTimeout(decorate,50);
   return true
  }finally{
   installing=false
  }
 }
 window.TCP_AUTOMATIC_COMPANY_CALL_LINK_V566={
  version:VERSION,
  exactDirectoryRows:exactDirectoryRows,
  directoryCustomers:directoryCustomers,
  candidates:candidates,
  ensure:ensure,
  status:status,
  install:install,
  refresh:ensureCurrent
 };

 function boot(){
  if(!install())setTimeout(boot,120)
 }
 boot();

 if(window.TCP_PERSISTENT_DATA_V550&&typeof TCP_PERSISTENT_DATA_V550.ready==='function'){
  TCP_PERSISTENT_DATA_V550.ready().then(function(){
   sourceCache.at=0;
   ensureCurrent(false)
  }).catch(function(error){
   console.warn('[v566 persistent ready]',error)
  })
 }

 /*
   Hydration and Company Workspace modules may finish in different orders.
   These retries are automatic and silent; the rep never needs to intervene.
 */
 [300,900,1800,3500,6500].forEach(function(delay){
  setTimeout(function(){
   sourceCache.at=0;
   var rep=currentRep();
   if(rep){
    ensure(rep,new Date(),false);
    refreshPortal()
   }
  },delay)
 });

 var observer=new MutationObserver(function(){
  removeManualUi();
  setTimeout(decorate,20)
 });
 var overlay=document.getElementById&&document.getElementById('rp-overlay');
 if(overlay){
  observer.observe(overlay,{childList:true,subtree:true})
 }
})();
