
(function(){
 'use strict';

 var VERSION='v565';
 var STORE='tcp_call_cycle_engine_v547';
 var CRM='tcp_rp_company_crm_v510';
 var original={};
 var syncing=false;

 function arr(value){
  if(Array.isArray(value))return value;
  if(!value)return[];
  try{
   if(typeof value.length==='number'&&typeof value!=='string')return Array.prototype.slice.call(value);
   if(typeof value==='object')return Object.keys(value).map(function(key){return value[key]}).filter(Boolean)
  }catch(error){}
  return[]
 }
 function clean(value){return String(value==null?'':value).trim()}
 function norm(value){return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function n(value){var number=Number(value);return isFinite(number)?number:0}
 function field(object,names,def){
  for(var i=0;i<names.length;i++){
   var value=object&&object[names[i]];
   if(value!=null&&clean(value)!=='')return value
  }
  return def==null?'':def
 }
 function read(key,def){
  try{
   var value=JSON.parse(localStorage.getItem(key)||'null');
   return value==null?def:value
  }catch(error){return def}
 }
 function write(key,value){
  try{
   value.updatedAt=new Date().toISOString();
   localStorage.setItem(key,JSON.stringify(value));
   return true
  }catch(error){
   console.warn('[v565 call-cycle bridge storage]',error);
   return false
  }
 }
 function esc(value){
  if(typeof esc_html==='function')return esc_html(String(value==null?'':value));
  if(typeof _rp2Esc==='function')return _rp2Esc(String(value==null?'':value));
  return String(value==null?'':value).replace(/[&<>"]/g,function(character){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
  })
 }
 function repOf(row){
  return clean(field(row,[
   'rep','owner','salesRep','sales_rep','repName','assignedRep','assignedTo',
   'salesRepresentative','salesSpecialist','salesperson','Sales Rep','Sales Representative'
  ],''))
 }
 function companyOf(row){
  return clean(field(row,[
   'name','customer','company','companyName','customerName','accountName',
   'AccountName','organization','businessName','shipToName','billToName'
  ],''))
 }
 function primaryOrder(row){
  var kind=clean(field(row,['kind','recordType','orderType','type'],'')).toLowerCase();
  var status=clean(field(row,['status'],'')).toLowerCase();
  return !/quote|proposal|estimate/.test(kind)&&!/quote|proposal|estimate/.test(status)
 }
 function dateValue(value){
  if(!value)return null;
  try{
   var date=/^\d{4}-\d{2}-\d{2}$/.test(String(value))?new Date(String(value)+'T12:00:00'):new Date(value);
   return isNaN(date.getTime())?null:date
  }catch(error){return null}
 }
 function iso(value){
  var date=dateValue(value);
  if(!date)return'';
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')
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
 function activeRepNames(){
  var map={};
  arr(window.S&&S.reps).forEach(function(rep){
   var name=clean(rep&&rep.name||rep);
   if(name&&!(rep&&rep.retired))map[norm(name)]=name
  });
  arr(window.S&&S.customers).forEach(function(row){
   var name=repOf(row);
   if(name&&!/^(0|none|unassigned)$/i.test(name))map[norm(name)]=name
  });
  return Object.keys(map).map(function(key){return map[key]}).sort()
 }
 function crmState(){
  var value=read(CRM,null);
  if(!value||value.version!==1||!value.reps)value={version:1,reps:{}};
  return value
 }
 function crmRepBucket(crm,rep){
  var exact=crm.reps[rep];
  if(exact)return exact;
  var key=Object.keys(crm.reps||{}).filter(function(name){return norm(name)===norm(rep)})[0];
  return key?crm.reps[key]:null
 }
 function statusText(row){
  return clean([
   field(row,['status','customerStatus','relationshipStatus'],''),
   field(row,['loyalty','tier'],''),
   row&&row.profile&&field(row.profile,['status','lifecycle'],'')
  ].filter(Boolean).join(' '))
 }
 function inactive(row){
  return !!(row&&row.doNotCall)||/do not call|inactive|closed account/i.test(statusText(row))
 }
 function universe(rep){
  var map={},crm=crmState(),year=new Date().getFullYear();

  function add(name,source,row,flags){
   name=clean(name);
   if(!name)return null;
   var key=norm(name);
   if(!map[key]){
    map[key]={
     name:name,rep:rep,imported:null,account:null,contact:'',email:'',phone:'',
     sources:{},hasImported:false,hasOrder:false,hasCustomerLifecycle:false,
     doNotCall:false,inactive:false,currentYearSales:0,lastOrderAt:''
    }
   }
   var item=map[key];
   item.sources[source]=1;
   flags=flags||{};
   if(flags.imported){item.imported=row;item.hasImported=true}
   if(flags.account){item.account=row}
   if(flags.order){
    item.hasOrder=true;
    var date=dateValue(field(row,['orderDate','date','invoiceDate','createdAt','placedAt','shipDate'],''));
    if(date&&(!item.lastOrderAt||dateValue(item.lastOrderAt)<date))item.lastOrderAt=iso(date);
    if(date&&date.getFullYear()===year)item.currentYearSales+=n(field(row,['netRevenue','revenue','amount','total','sales'],0))
   }
   if(flags.customerLifecycle)item.hasCustomerLifecycle=true;
   if(row&&inactive(row)){item.inactive=true;if(row.doNotCall)item.doNotCall=true}
   item.contact=clean(field(row,['contact','contactName','primaryContact','name'],'')||item.contact);
   item.email=clean(field(row,['email','contactEmail'],'')||item.email);
   item.phone=clean(field(row,['phone','contactPhone','mobile'],'')||item.phone);
   return item
  }

  arr(window.S&&S.customers).forEach(function(row){
   if(norm(repOf(row))!==norm(rep))return;
   add(companyOf(row),'customer-import',row,{imported:true,customerLifecycle:true})
  });

  var bucket=crmRepBucket(crm,rep),accounts=bucket&&bucket.accounts||{};
  Object.keys(accounts).forEach(function(key){
   var account=accounts[key]||{},profile=account.profile||{},name=clean(profile.name)||key;
   var lifecycle=clean(profile.lifecycle||profile.status);
   var item=add(name,'crm-account',account,{account:true,customerLifecycle:/customer|active|partner/i.test(lifecycle)});
   if(!item)return;
   var primary=arr(account.contacts).filter(function(contact){return contact&&contact.isPrimary})[0]||arr(account.contacts)[0];
   if(primary){
    item.contact=clean(field(primary,['name'],'')||item.contact);
    item.email=clean(field(primary,['email'],'')||item.email);
    item.phone=clean(field(primary,['phone','mobile'],'')||item.phone)
   }
  });

  arr(window.S&&S.orders).forEach(function(row){
   if(norm(repOf(row))!==norm(rep)||!primaryOrder(row))return;
   add(companyOf(row),'orders',row,{order:true})
  });
  arr(window.S&&S.orderLineItems).forEach(function(row){
   if(norm(repOf(row))!==norm(rep))return;
   add(companyOf(row),'line-items',row,{order:true})
  });

  var pools=[
   ['contacts',window.S&&S.accountContacts],['contacts',window.S&&S.customerContacts],
   ['contacts',window.S&&S.crmContacts],['contacts',window.S&&S.contacts],
   ['opportunities',window.S&&S.opportunities],['opportunities',window.S&&S.crmOpportunities],
   ['opportunities',window.S&&S.accountOpportunities],['quotes',window.S&&S.quotes],
   ['quotes',window.S&&S.crmQuotes],['quotes',window.S&&S.customerQuotes],
   ['activities',window.S&&S.activities],['activities',window.S&&S.crmActivities],
   ['activities',window.S&&S.customerActivities],['activities',window.S&&S.accountActivities]
  ];
  pools.forEach(function(pair){
   arr(pair[1]).forEach(function(row){
    if(norm(repOf(row))!==norm(rep))return;
    add(companyOf(row),pair[0],row,{})
   })
  });

  return Object.keys(map).map(function(key){return map[key]}).filter(function(item){
   return !item.inactive&&!item.doNotCall&&(item.hasImported||item.hasOrder||item.hasCustomerLifecycle)
  }).sort(function(a,b){return a.name.localeCompare(b.name)})
 }
 function lastContact(rep,company,customer){
  var dates=[],account=customer&&customer.account;
  arr(account&&account.activities).forEach(function(activity){
   if(!/call|email|meeting|contact/i.test(clean(field(activity,['type','source','subject'],''))))return;
   var date=dateValue(field(activity,['date','createdAt','updatedAt','sentAt'],''));
   if(date)dates.push(date)
  });
  var pools=[window.S&&S.activities,window.S&&S.crmActivities,window.S&&S.customerActivities,window.S&&S.accountActivities];
  pools.forEach(function(pool){
   arr(pool).forEach(function(activity){
    if(norm(repOf(activity))!==norm(rep)||norm(companyOf(activity))!==norm(company))return;
    if(!/call|email|meeting|contact/i.test(clean(field(activity,['type','source','subject'],''))))return;
    var date=dateValue(field(activity,['date','createdAt','updatedAt','sentAt'],''));
    if(date)dates.push(date)
   })
  });
  dates.sort(function(a,b){return b-a});
  return dates[0]||null
 }
 function baseCandidate(rep,cycle,customer){
  var last=lastContact(rep,customer.name,customer);
  return{
   id:'company_'+norm(customer.name).replace(/\s+/g,'_'),
   company:customer.name,
   contact:customer.contact||'Primary contact not recorded',
   email:customer.email||'',
   phone:customer.phone||'',
   lastContactAt:last?iso(last):'',
   netSales:n(customer.currentYearSales)||n(field(customer.imported,[
    'importedSalesCurrentYear','currentYearSales','ytdSales','netSalesCurrentYear'
   ],0)),
   reason:'',
   detail:'',
   priority:50,
   completedAt:'',
   callAttemptAt:'',
   emailAt:'',
   sourceBridge:VERSION,
   sourceTypes:Object.keys(customer.sources)
  }
 }
 function candidates(rep,cycle,settings){
  var rows=[],year=cycle.start.getFullYear(),engine=window.TCP_CALL_CYCLE_V547;
  universe(rep).forEach(function(customer){
   var base=baseCandidate(rep,cycle,customer);
   if(cycle.kind==='regular'){
    base.reason='Account Updating Call';
    base.detail=cycle.label+' · Complete one call attempt and the follow-up email.';
    var last=base.lastContactAt?dateValue(base.lastContactAt):null;
    base.priority=last?Math.max(1,Math.floor((new Date()-last)/86400000))*-1:-99999;
    rows.push(base);
    return
   }
   if(cycle.kind==='november'){
    var christmas=engine&&engine.expectedChristmas?engine.expectedChristmas(rep,customer.name,year):'Not answered';
    var seasonal=engine&&engine.seasonalEvidence?engine.seasonalEvidence(customer,year,n(settings.seasonalLookbackYears)||5):{current:[],historical:[],years:{}};
    if(christmas==='Yes'){
     base.reason='Expected Christmas Order: Yes';
     base.detail='Customer was marked Yes during the July–October Christmas-order review.';
     base.priority=1;
     rows.push(base);
     return
    }
    if(!arr(seasonal.current).length&&arr(seasonal.historical).length){
     var years=Object.keys(seasonal.years||{}).sort().reverse();
     base.reason='Historical September–November purchaser';
     base.detail='Ordered in Sep–Nov during '+years.join(', ')+'; no Sep–Nov '+year+' order is recorded.';
     base.priority=2-Math.min(.9,arr(seasonal.historical).length/20);
     base.historicalYears=years;
     base.historicalOrders=arr(seasonal.historical).length;
     rows.push(base)
    }
    return
   }
   if(cycle.kind==='december'){
    var loyalty=engine&&engine.loyaltyInfo?engine.loyaltyInfo(customer,year,settings):null;
    if(!loyalty||loyalty.priority===99)return;
    base.loyalty=loyalty;
    base.priority=loyalty.priority;
    if(loyalty.closeToNext){
     base.reason=loyalty.tier+' customer close to '+loyalty.next;
     base.detail='$'+Math.round(loyalty.sales).toLocaleString()+' net sales · $'+Math.round(loyalty.gap).toLocaleString()+' needed to reach '+loyalty.next+'.'
    }else{
     base.reason=loyalty.tier+' loyalty thank-you';
     base.detail='$'+Math.round(loyalty.sales).toLocaleString()+' current-year net sales · thank the customer for their loyalty.'
    }
    rows.push(base)
   }
  });
  rows.sort(function(a,b){
   if(a.priority!==b.priority)return a.priority-b.priority;
   var ad=a.lastContactAt||'0000-00-00',bd=b.lastContactAt||'0000-00-00';
   if(ad!==bd)return ad.localeCompare(bd);
   if(b.netSales!==a.netSales)return b.netSales-a.netSales;
   return a.company.localeCompare(b.company)
  });
  return rows
 }
 function sourceSignature(rows){
  return rows.length+'|'+hash(rows.map(function(row){return norm(row.company)}).sort().join('|'))
 }
 function sync(rep,date,force){
  if(syncing||!window.TCP_CALL_CYCLE_V547||!rep)return{changed:false,reason:'unavailable',owned:0,set:0};
  syncing=true;
  try{
   var engine=window.TCP_CALL_CYCLE_V547;
   var cycle=engine.cycleFor(date||new Date());
   var value=engine.state();
   value.settings=value.settings||{};
   value.campaigns=value.campaigns||{};
   var campaign=value.campaigns[cycle.id];
   if(!campaign){
    campaign={
     id:cycle.id,key:cycle.key,label:cycle.label,kind:cycle.kind,
     start:iso(cycle.start),end:iso(cycle.end),createdAt:new Date().toISOString(),reps:{}
    };
    value.campaigns[cycle.id]=campaign
   }
   campaign.reps=campaign.reps||{};
   var existing=campaign.reps[rep]||null;
   var oldSet=arr(existing&&existing.set);
   var built=candidates(rep,cycle,value.settings);
   var signature=sourceSignature(built);
   var oldSignature=clean(existing&&existing.sourceSignature);
   var hasEvidence=oldSet.some(function(row){return row.completedAt||row.callAttemptAt||row.emailAt});
   var autoEmpty=(!existing||oldSet.length===0)&&built.length>0;
   var autoSafeRefresh=!!(existing&&existing.sourceBridge===VERSION&&!hasEvidence&&oldSignature&&oldSignature!==signature);
   var should=!!force||autoEmpty||autoSafeRefresh;

   if(should){
    var prior={};
    oldSet.forEach(function(row){prior[norm(row.company)]=row});
    built.forEach(function(row){
     var old=prior[norm(row.company)];
     if(old){
      row.completedAt=old.completedAt||'';
      row.callAttemptAt=old.callAttemptAt||'';
      row.emailAt=old.emailAt||''
     }
    });
    campaign.reps[rep]={
     rep:rep,
     createdAt:existing&&existing.createdAt||new Date().toISOString(),
     updatedAt:new Date().toISOString(),
     set:built,
     sourceBridge:VERSION,
     sourceSignature:signature,
     sourceOwnedCompanies:built.length,
     sourceSummary:{
      imported:built.filter(function(row){return arr(row.sourceTypes).indexOf('customer-import')>=0}).length,
      orders:built.filter(function(row){return arr(row.sourceTypes).indexOf('orders')>=0||arr(row.sourceTypes).indexOf('line-items')>=0}).length,
      crm:built.filter(function(row){return arr(row.sourceTypes).indexOf('crm-account')>=0}).length
     }
    };
    value.audit=arr(value.audit);
    value.audit.unshift({
     id:'audit_'+Date.now().toString(36),
     at:new Date().toISOString(),
     type:force?'company-call-cycle-manual-sync':'company-call-cycle-auto-repair',
     detail:built.length+' active owned companies linked to '+cycle.label+'.',
     rep:rep,company:''
    });
    if(value.audit.length>400)value.audit=value.audit.slice(0,400);
    write(STORE,value)
   }
   var current=campaign.reps[rep]||{set:[]};
   return{
    changed:should,
    reason:force?'manual':autoEmpty?'empty-set-repair':autoSafeRefresh?'safe-source-refresh':'frozen',
    rep:rep,
    cycle:cycle,
    owned:built.length,
    set:arr(current.set).length,
    mismatch:built.length-arr(current.set).length,
    hasEvidence:hasEvidence,
    signature:signature
   }
  }finally{
   syncing=false
  }
 }
 function status(rep,date){
  if(!window.TCP_CALL_CYCLE_V547||!rep)return{owned:0,set:0,mismatch:0,changed:false};
  var engine=window.TCP_CALL_CYCLE_V547,cycle=engine.cycleFor(date||new Date()),value=engine.state();
  var campaign=value.campaigns&&value.campaigns[cycle.id],row=campaign&&campaign.reps&&campaign.reps[rep];
  var owned=universe(rep).length,set=arr(row&&row.set).length;
  return{rep:rep,cycle:cycle,owned:owned,set:set,mismatch:owned-set,sourceBridge:row&&row.sourceBridge||'',updatedAt:row&&row.updatedAt||'',hasEvidence:arr(row&&row.set).some(function(item){return item.completedAt||item.callAttemptAt||item.emailAt})}
 }
 function wrapEngine(){
  var engine=window.TCP_CALL_CYCLE_V547;
  if(!engine||engine._companyBridgeV565)return false;
  original.paceFor=engine.paceFor;
  original.cycleQueue=engine.cycleQueue;
  original.diagnostics=engine.diagnostics;
  original.refreshCampaign=engine.refreshCampaign;
  original.campaign=engine.campaign;

  engine.customerRows=universe;
  engine.candidateRows=candidates;
  engine.syncOwnedCompanies=sync;
  engine.ownershipStatus=status;

  engine.paceFor=function(rep,date){
   sync(rep,date,false);
   return original.paceFor.call(engine,rep,date)
  };
  engine.cycleQueue=function(rep,date){
   sync(rep,date,false);
   return original.cycleQueue.call(engine,rep,date)
  };
  engine.diagnostics=function(rep,date){
   sync(rep,date,false);
   var result=original.diagnostics.call(engine,rep,date);
   var link=status(rep,date);
   result.ownedCompanies=link.owned;
   result.linkedSet=link.set;
   result.ownershipMismatch=link.mismatch;
   result.sourceBridge=link.sourceBridge;
   return result
  };
  engine.refreshCampaign=function(value,rep,date){
   sync(rep,date,false);
   return original.refreshCampaign.call(engine,value,rep,date)
  };
  engine.campaign=function(value,rep,date,force){
   sync(rep,date,!!force);
   return original.campaign.call(engine,value,rep,date,force)
  };
  engine._companyBridgeV565=true;
  return true
 }
 function wrapDesktop(){
  if(window._rp2DesktopBuild&& !window._rp2DesktopBuild._cc565){
   var base=window._rp2DesktopBuild;
   var wrapped=function(){
    var rep=currentRep();
    if(rep)sync(rep,new Date(),false);
    return base.apply(this,arguments)
   };
   wrapped._cc565=true;
   window._rp2DesktopBuild=wrapped
  }
 }
 function refreshRep(){
  try{
   if(window._rp2&&_rp2.rep&&typeof _rp2Go==='function')_rp2Go(_rp2.page||'home')
  }catch(error){}
 }
 function syncCurrent(force){
  var rep=currentRep();
  if(!rep)return null;
  var result=sync(rep,new Date(),!!force);
  try{
   if(window.TCP_CALL_CYCLE_V547&&original.refreshCampaign){
    var value=TCP_CALL_CYCLE_V547.state();
    original.refreshCampaign.call(TCP_CALL_CYCLE_V547,value,rep,new Date())
   }
  }catch(error){}
  refreshRep();
  setTimeout(decorateRep,40);
  return result
 }
 function decorateRep(){
  var rep=currentRep();
  if(!rep)return;
  var host=document.getElementById('ps61-cycle');
  if(!host)return;
  var link=status(rep,new Date()),line=host.querySelector('.cc565-linkline');
  if(!line){
   line=document.createElement('div');
   line.className='cc565-linkline';
   var main=host.querySelector('.ps61-cycle-main')||host;
   main.appendChild(line)
  }
  var aligned=link.owned===link.set&&link.set>0;
  var copy=aligned?
   '<div class="cc565-linkcopy"><strong>'+link.set.toLocaleString()+' active companies linked</strong> · Companies and today’s call queue share the same owner source.</div>':
   '<div class="cc565-linkcopy warn"><strong>'+link.owned.toLocaleString()+' active companies · '+link.set.toLocaleString()+' in frozen set</strong> · Sync to rebuild the current cycle from Companies.</div>';
  line.innerHTML=copy+'<button class="cc565-sync" onclick="_cc565SyncCurrent()">'+(aligned?'Recheck':'Sync companies')+'</button>';
  if(link.updatedAt&&!host.querySelector('.cc565-repaired')){
   var note=document.createElement('div');
   note.className='cc565-repaired';
   note.textContent='Company link checked '+new Date(link.updatedAt).toLocaleString();
   line.parentNode.appendChild(note)
  }
 }
 function adminReport(){
  var reps=activeRepNames(),rows=reps.map(function(rep){
   var link=status(rep,new Date());
   return link
  });
  return{
   reps:rows,
   owned:rows.reduce(function(sum,row){return sum+row.owned},0),
   linked:rows.reduce(function(sum,row){return sum+row.set},0),
   mismatches:rows.filter(function(row){return row.mismatch!==0}).length,
   empty:rows.filter(function(row){return row.owned>0&&row.set===0}).length,
   aligned:rows.filter(function(row){return row.owned===row.set&&row.set>0}).length
  }
 }
 function mountAdmin(){
  var page=document.getElementById('pg-admin');
  if(!page)return;
  var report=adminReport(),host=document.getElementById('tcp-call-cycle-link-v565');
  if(!host){
   host=document.createElement('section');
   host.id='tcp-call-cycle-link-v565';
   page.appendChild(host)
  }
  host.innerHTML='<div class="cc565-admin-head"><div><div class="cc565-admin-kick">Company ↔ Call Cycle Bridge · Build v565</div><div class="cc565-admin-title">One owned-company source for Companies and calling</div><div class="cc565-admin-copy">The company directory and Annual Call Cycle now use the same rep ownership fields and connected records. Empty frozen sets are repaired automatically. Use manual sync after ownership changes during an active cycle.</div></div><div class="cc565-admin-actions"><button onclick="_cc565Audit()">Recheck</button><button class="primary" onclick="_cc565SyncAll()">Sync all rep sets</button></div></div>'+
   '<div class="cc565-admin-grid"><div class="cc565-admin-kpi"><span>Active owned companies</span><strong>'+report.owned.toLocaleString()+'</strong></div><div class="cc565-admin-kpi"><span>Linked call-cycle rows</span><strong>'+report.linked.toLocaleString()+'</strong></div><div class="cc565-admin-kpi"><span>Reps aligned</span><strong>'+report.aligned+'</strong></div><div class="cc565-admin-kpi"><span>Empty sets repaired</span><strong>'+report.empty+'</strong></div><div class="cc565-admin-kpi"><span>Ownership mismatches</span><strong>'+report.mismatches+'</strong></div></div>'+
   '<div class="cc565-admin-table-wrap"><table class="cc565-admin-table"><thead><tr><th>Rep</th><th>Active Companies</th><th>Frozen Call Set</th><th>Difference</th><th>Status</th><th>Action</th></tr></thead><tbody>'+
   report.reps.map(function(row){
    var good=row.owned===row.set&&row.set>0;
    return'<tr><td>'+esc(row.rep)+'</td><td>'+row.owned.toLocaleString()+'</td><td>'+row.set.toLocaleString()+'</td><td>'+row.mismatch.toLocaleString()+'</td><td><span class="cc565-status '+(good?'good':'warn')+'">'+(good?'Aligned':row.set===0&&row.owned>0?'Empty set':'Review')+'</span></td><td><button class="cc565-sync" onclick="_cc565SyncRep(\''+encodeURIComponent(row.rep)+'\')">Sync</button></td></tr>'
   }).join('')+'</tbody></table></div>'
 }
 function syncAll(force){
  var results=activeRepNames().map(function(rep){return sync(rep,new Date(),force!==false)});
  mountAdmin();
  refreshRep();
  try{
   if(window.TCP_PERSISTENT_DATA_V550)TCP_PERSISTENT_DATA_V550.saveNow('company-call-cycle-sync-v565')
  }catch(error){}
  return results
 }

 window._cc565SyncCurrent=function(){
  var result=syncCurrent(true);
  if(result&&typeof alert==='function'){
   alert('Call-cycle company link refreshed.\n\nActive companies: '+result.owned+'\nCurrent frozen set: '+result.set+'\n\nToday’s assigned calls have been recalculated.')
  }
 };
 window._cc565SyncRep=function(encoded){
  var rep=decodeURIComponent(encoded||'');
  var result=sync(rep,new Date(),true);
  mountAdmin();
  if(typeof alert==='function')alert(rep+' call-cycle set refreshed.\n\nActive companies: '+result.owned+'\nFrozen set: '+result.set)
 };
 window._cc565SyncAll=function(){
  var results=syncAll(true);
  if(typeof alert==='function')alert('All rep call-cycle sets were refreshed.\n\nRep sets processed: '+results.length)
 };
 window._cc565Audit=function(){mountAdmin()};

 function install(){
  if(!wrapEngine())return false;
  wrapDesktop();

  var oldGo=window._rp2Go;
  if(typeof oldGo==='function'&&!oldGo._cc565){
   var go=function(){
    var rep=currentRep();
    if(rep)sync(rep,new Date(),false);
    var result=oldGo.apply(this,arguments);
    setTimeout(decorateRep,40);
    return result
   };
   go._cc565=true;
   window._rp2Go=go
  }

  var oldRefresh=window._rp2RefreshCloud;
  if(typeof oldRefresh==='function'&&!oldRefresh._cc565){
   var refresh=function(){
    var result=oldRefresh.apply(this,arguments);
    Promise.resolve(result).finally(function(){
     var rep=currentRep();
     if(rep)sync(rep,new Date(),false);
     setTimeout(function(){refreshRep();decorateRep()},80)
    });
    return result
   };
   refresh._cc565=true;
   window._rp2RefreshCloud=refresh
  }

  var oldRepair=window._di564Repair;
  if(typeof oldRepair==='function'&&!oldRepair._cc565){
   var repair=function(){
    var result=oldRepair.apply(this,arguments);
    Promise.resolve(result).finally(function(){syncAll(false);mountAdmin()});
    return result
   };
   repair._cc565=true;
   window._di564Repair=repair
  }

  var oldGt=window.gt;
  if(typeof oldGt==='function'&&!oldGt._cc565){
   var gt=function(){
    var result=oldGt.apply(this,arguments);
    setTimeout(function(){
     var page=document.getElementById('pg-admin');
     if(page&&page.classList.contains('active'))mountAdmin()
    },50);
    return result
   };
   gt._cc565=true;
   window.gt=gt
  }

  syncAll(false);
  setTimeout(decorateRep,100);
  var page=document.getElementById('pg-admin');
  if(page&&page.classList.contains('active'))mountAdmin();
  return true
 }

 window.TCP_COMPANY_CALL_CYCLE_BRIDGE_V565={
  version:VERSION,
  universe:universe,
  candidates:candidates,
  sync:sync,
  syncAll:syncAll,
  status:status,
  report:adminReport,
  mountAdmin:mountAdmin,
  install:install
 };

 function boot(){
  if(!install()){
   setTimeout(boot,120)
  }
 }
 boot();

 if(window.TCP_PERSISTENT_DATA_V550&&typeof TCP_PERSISTENT_DATA_V550.ready==='function'){
  TCP_PERSISTENT_DATA_V550.ready().then(function(){
   syncAll(false);
   refreshRep();
   setTimeout(decorateRep,100)
  }).catch(function(error){console.warn('[v565 persistent ready]',error)})
 }
 setTimeout(function(){syncAll(false);setTimeout(decorateRep,80)},1200);
 setTimeout(function(){syncAll(false);setTimeout(decorateRep,80)},3500);

 var observer=new MutationObserver(function(){
  setTimeout(decorateRep,20);
  var page=document.getElementById('pg-admin');
  if(page&&page.classList.contains('active'))setTimeout(mountAdmin,20)
 });
 var overlay=document.getElementById('rp-overlay');
 if(overlay)observer.observe(overlay,{childList:true,subtree:true})
})();
