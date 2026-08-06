
(function(){
 'use strict';

 var STORE='tcp_call_cycle_engine_v547';
 var CRM='tcp_rp_company_crm_v510';
 var VERSION=1;
 var adminTab=window._cc547AdminTab||'overview';
 var historyCache=null;

 function arr(v){
  if(Array.isArray(v))return v;
  if(!v)return[];
  try{
   if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);
   if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null})
  }catch(e){}
  return[]
 }
 function clean(v){return String(v==null?'':v).trim()}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function n(v){var x=Number(v);return isFinite(x)?x:0}
 function clamp(v,min,max){return Math.max(min,Math.min(max,n(v)))}
 function esc(v){
  var s=String(v==null?'':v);
  return typeof _rp2Esc==='function'?_rp2Esc(s):s.replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function field(o,names,def){
  for(var i=0;i<names.length;i++){
   var value=o&&o[names[i]];
   if(value!=null&&String(value).trim()!=='')return value
  }
  return def==null?'':def
 }
 function read(key,def){try{var value=JSON.parse(localStorage.getItem(key)||'null');return value==null?def:value}catch(e){return def}}
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){console.warn('[v547 storage]',e);return false}}
 function localDate(v){
  if(v instanceof Date){var copy=new Date(v.getTime());copy.setHours(12,0,0,0);return copy}
  if(!v)return null;
  var text=String(v),d=/^\d{4}-\d{2}-\d{2}$/.test(text)?new Date(text+'T12:00:00'):new Date(text);
  if(isNaN(d.getTime()))return null;d.setHours(12,0,0,0);return d
 }
 function today(){var d=window._cc547Now?localDate(window._cc547Now):localDate(new Date());return d}
 function iso(v){
  var d=localDate(v);return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):''
 }
 function fmt(v){
  var d=localDate(v);return d?d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'
 }
 function money(v){
  return typeof _rp2$==='function'?_rp2$(n(v)):'$'+n(v).toLocaleString(undefined,{maximumFractionDigits:0})
 }
 function makeId(prefix){return(prefix||'id')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
 function endOfMonth(year,month){return new Date(year,month+1,0,12)}
 function startOfMonth(year,month){return new Date(year,month,1,12)}
 function dayAfter(v){var d=localDate(v);d.setDate(d.getDate()+1);return d}
 function compare(a,b){return localDate(a)-localDate(b)}
 function percent(value,total){return total?Math.round(value/total*1000)/10:0}
 function defaultSettings(){
  return{
   holidays:[],
   blackouts:[],
   seasonalLookbackYears:5,
   loyalty:{
    silver:0,
    gold:10000,
    platinum:25000,
    diamond:50000,
    closeSilverGold:2500,
    closeGoldPlatinum:5000,
    closePlatinumDiamond:10000
   },
   scheduleVersion:1
  }
 }
 function state(){
  var value=read(STORE,null);
  if(!value||value.version!==VERSION)value={version:VERSION,settings:defaultSettings(),campaigns:{},audit:[]};
  value.settings=Object.assign(defaultSettings(),value.settings||{});
  value.settings.loyalty=Object.assign(defaultSettings().loyalty,value.settings.loyalty||{});
  value.settings.holidays=arr(value.settings.holidays);
  value.settings.blackouts=arr(value.settings.blackouts);
  value.campaigns=value.campaigns||{};
  value.audit=arr(value.audit);
  return value
 }
 function save(value){value.updatedAt=new Date().toISOString();write(STORE,value)}
 function audit(value,type,detail,rep,company){
  value.audit.unshift({id:makeId('audit'),at:new Date().toISOString(),type:type,detail:detail,rep:rep||'',company:company||''});
  if(value.audit.length>400)value.audit=value.audit.slice(0,400)
 }
 function cycleDefinitions(year){
  return[
   {id:year+'-jan-mar',key:'jan-mar',label:'January–March Account Updates',short:'Jan–Mar',start:startOfMonth(year,0),end:endOfMonth(year,2),kind:'regular',
    milestones:[{month:0,label:'January · 33%',target:33,end:endOfMonth(year,0)},{month:1,label:'February · 66%',target:66,end:endOfMonth(year,1)},{month:2,label:'March · 100%',target:100,end:endOfMonth(year,2)}]},
   {id:year+'-apr-jun',key:'apr-jun',label:'April–June Account Updates',short:'Apr–Jun',start:startOfMonth(year,3),end:endOfMonth(year,5),kind:'regular',
    milestones:[{month:3,label:'April · 33%',target:33,end:endOfMonth(year,3)},{month:4,label:'May · 66%',target:66,end:endOfMonth(year,4)},{month:5,label:'June · 100%',target:100,end:endOfMonth(year,5)}]},
   {id:year+'-jul-aug',key:'jul-aug',label:'July–August Account Updates',short:'Jul–Aug',start:startOfMonth(year,6),end:endOfMonth(year,7),kind:'regular',
    milestones:[{month:6,label:'July · 50%',target:50,end:endOfMonth(year,6)},{month:7,label:'August · 100%',target:100,end:endOfMonth(year,7)}]},
   {id:year+'-sep-oct',key:'sep-oct',label:'September–October Account Updates',short:'Sep–Oct',start:startOfMonth(year,8),end:endOfMonth(year,9),kind:'regular',
    milestones:[{month:8,label:'September · 50%',target:50,end:endOfMonth(year,8)},{month:9,label:'October · 100%',target:100,end:endOfMonth(year,9)}]},
   {id:year+'-november',key:'november',label:'November Christmas Opportunity Campaign',short:'November',start:startOfMonth(year,10),end:endOfMonth(year,10),kind:'november',
    milestones:[{month:10,label:'November · 100%',target:100,end:endOfMonth(year,10)}]},
   {id:year+'-december',key:'december',label:'December Loyalty Advancement & Thank-You',short:'December',start:startOfMonth(year,11),end:endOfMonth(year,11),kind:'december',
    milestones:[{month:11,label:'December · 100%',target:100,end:endOfMonth(year,11)}]}
  ]
 }
 function cycleFor(date){
  var d=localDate(date)||today(),defs=cycleDefinitions(d.getFullYear());
  for(var i=0;i<defs.length;i++)if(d>=defs[i].start&&d<=defs[i].end)return defs[i];
  return defs[0]
 }
 function milestoneFor(cycle,date){
  var d=localDate(date)||today(),previous=0;
  for(var i=0;i<cycle.milestones.length;i++){
   var m=cycle.milestones[i];
   if(d<=m.end)return Object.assign({},m,{previousTarget:previous,start:startOfMonth(d.getFullYear(),m.month)});
   previous=m.target
  }
  var last=cycle.milestones[cycle.milestones.length-1];
  return Object.assign({},last,{previousTarget:cycle.milestones.length>1?cycle.milestones[cycle.milestones.length-2].target:0,start:startOfMonth(d.getFullYear(),last.month)})
 }
 function excludedDates(settings){
  var map={};
  arr(settings.holidays).concat(arr(settings.blackouts)).forEach(function(item){
   var date=typeof item==='string'?item:item&&item.date;
   if(date)map[String(date)]=1
  });
  return map
 }
 function isBusinessDay(date,settings){
  var d=localDate(date);if(!d)return false;
  var day=d.getDay();if(day===0||day===6)return false;
  return !excludedDates(settings)[iso(d)]
 }
 function businessDays(start,end,settings){
  var a=localDate(start),b=localDate(end),count=0;if(!a||!b||a>b)return 0;
  for(var d=new Date(a.getTime());d<=b;d.setDate(d.getDate()+1))if(isBusinessDay(d,settings))count++;
  return count
 }
 function nextBusinessDay(date,settings){
  var d=dayAfter(date);for(var i=0;i<370;i++){if(isBusinessDay(d,settings))return d;d.setDate(d.getDate()+1)}return d
 }
 function repName(row){
  return clean(field(row,['rep','salesRep','sales_rep','owner','assignedRep','salesRepresentative','Sales Rep'],''))
 }
 function companyName(row){
  return clean(field(row,['name','customer','company','companyName','customerName','accountName','AccountName','shipToName','billToName'],''))
 }
 function allReps(){
  var map={};
  arr(window.S&&S.reps).forEach(function(rep){var name=clean(rep&&rep.name);if(name&&!rep.retired)map[norm(name)]=name});
  arr(window.S&&S.customers).forEach(function(row){var name=repName(row);if(name&&!/^(0|none|unassigned)$/i.test(name))map[norm(name)]=name});
  var crm=read(CRM,{reps:{}});Object.keys(crm&&crm.reps||{}).forEach(function(name){if(name)map[norm(name)]=name});
  return Object.keys(map).map(function(key){return map[key]}).sort()
 }
 function crmState(){
  var value=read(CRM,null);if(!value||value.version!==1||!value.reps)value={version:1,reps:{}};return value
 }
 function crmAccount(crm,rep,company,create){
  crm.reps[rep]=crm.reps[rep]||{accounts:{}};
  var key=norm(company),account=crm.reps[rep].accounts[key];
  if(!account&&create){
   account={profile:{name:company,owner:rep,createdAt:new Date().toISOString()},contacts:[],activities:[],opportunities:[],quotes:[],notes:[],files:[]};
   crm.reps[rep].accounts[key]=account
  }
  if(account){account.profile=account.profile||{name:company,owner:rep};account.activities=arr(account.activities);account.contacts=arr(account.contacts)}
  return account
 }
 function customerRows(rep){
  var map={},crm=crmState();
  arr(window.S&&S.customers).forEach(function(row){
   var owner=repName(row),name=companyName(row);
   if(!name||norm(owner)!==norm(rep)||row.doNotCall||/do not call/i.test(String(field(row,['customerStatus','status'],''))))return;
   var key=norm(name);
   map[key]=map[key]||{name:name,rep:rep,imported:null,account:null,contact:'',email:'',phone:''};
   map[key].imported=row;
   map[key].contact=clean(field(row,['contact','contactName','primaryContact'],'')||map[key].contact);
   map[key].email=clean(field(row,['email','contactEmail'],'')||map[key].email);
   map[key].phone=clean(field(row,['phone','contactPhone'],'')||map[key].phone)
  });
  var repCrm=crm.reps[rep]&&crm.reps[rep].accounts||{};
  Object.keys(repCrm).forEach(function(key){
   var account=repCrm[key],name=clean(account&&account.profile&&account.profile.name||key);
   if(!name||account&&account.profile&&/inactive|do not call/i.test(String(account.profile.status||'')))return;
   map[norm(name)]=map[norm(name)]||{name:name,rep:rep,imported:null,account:null,contact:'',email:'',phone:''};
   map[norm(name)].account=account;
   var primary=arr(account.contacts).filter(function(c){return c.isPrimary})[0]||arr(account.contacts)[0];
   if(primary){
    map[norm(name)].contact=clean(field(primary,['name'],'')||map[norm(name)].contact);
    map[norm(name)].email=clean(field(primary,['email'],'')||map[norm(name)].email);
    map[norm(name)].phone=clean(field(primary,['phone','mobile'],'')||map[norm(name)].phone)
   }
  });
  return Object.keys(map).map(function(key){return map[key]})
 }
 function buildHistory(){
  var signature=[
   arr(window.S&&S.orderLineItems).length,
   arr(window.S&&S.orders).length,
   arr(window.S&&S.customers).length
  ].join('|');
  if(historyCache&&historyCache.signature===signature)return historyCache;
  var index={signature:signature,companies:{}};
  function company(name){
   var key=norm(name);if(!index.companies[key])index.companies[key]={lineSales:{},orderSales:{},orders:{},dates:[]};return index.companies[key]
  }
  arr(window.S&&S.orderLineItems).forEach(function(row,i){
   var name=companyName(row),date=localDate(field(row,['orderDate','invoiceDate','date','createdAt','shipDate'],''));
   if(!name||!date)return;
   var c=company(name),year=date.getFullYear(),amount=n(field(row,['netRevenue','revenue','amount','total','extendedPrice','lineTotal'],0));
   c.lineSales[year]=(c.lineSales[year]||0)+amount;
   var number=clean(field(row,['orderNumber','orderNum','so','salesOrder','invoiceNumber'],'')||('line-'+i));
   var orderKey=year+'|'+date.getMonth()+'|'+number;
   if(!c.orders[orderKey])c.orders[orderKey]={year:year,month:date.getMonth(),date:iso(date),number:number};
   c.dates.push(iso(date))
  });
  arr(window.S&&S.orders).forEach(function(row,i){
   var name=companyName(row),date=localDate(field(row,['orderDate','invoiceDate','date','createdAt','placedAt','shipDate'],''));
   if(!name||!date)return;
   var c=company(name),year=date.getFullYear(),amount=n(field(row,['netRevenue','revenue','amount','total','sales'],0));
   c.orderSales[year]=(c.orderSales[year]||0)+amount;
   var number=clean(field(row,['orderNumber','orderNum','so','salesOrder','invoiceNumber','id'],'')||('order-'+i));
   var orderKey=year+'|'+date.getMonth()+'|'+number;
   if(!c.orders[orderKey])c.orders[orderKey]={year:year,month:date.getMonth(),date:iso(date),number:number};
   c.dates.push(iso(date))
  });
  historyCache=index;return index
 }
 function currentYearSales(customer,year){
  var imported=customer.imported||{},value=n(field(imported,['importedSalesCurrentYear','currentYearSales','ytdSales','netSalesCurrentYear'],0));
  if(value)return value;
  var h=buildHistory().companies[norm(customer.name)]||{lineSales:{},orderSales:{}};
  if(n(h.lineSales[year]))return n(h.lineSales[year]);
  return n(h.orderSales[year])
 }
 function seasonalEvidence(customer,year,lookback){
  var h=buildHistory().companies[norm(customer.name)]||{orders:{}},orders=Object.keys(h.orders||{}).map(function(k){return h.orders[k]});
  var current=orders.filter(function(o){return o.year===year&&o.month>=8&&o.month<=10});
  var historical=orders.filter(function(o){return o.year<year&&o.year>=year-lookback&&o.month>=8&&o.month<=10});
  var years={};historical.forEach(function(o){years[o.year]=(years[o.year]||0)+1});
  return{current:current,historical:historical,years:years}
 }
 function activities(rep,company){
  var crm=crmState(),account=crmAccount(crm,rep,company,false);return account?arr(account.activities):[]
 }
 function activityDate(activity){return localDate(field(activity,['date','createdAt','updatedAt','sentAt'],'')||'')}
 function lastContact(rep,company){
  var dates=activities(rep,company).filter(function(a){
   return /call|email|meeting|contact/i.test(String(field(a,['type','source','subject'],'')||''))
  }).map(activityDate).filter(Boolean).sort(function(a,b){return b-a});
  return dates[0]||null
 }
 function expectedChristmas(rep,company,year){
  var crm=crmState(),account=crmAccount(crm,rep,company,false),profile=account&&account.profile||{};
  var all=profile.expectedChristmasOrders||{},row=all[year]||all[String(year)]||{};
  return clean(typeof row==='string'?row:row.value||'Not answered')||'Not answered'
 }
 function setExpectedChristmas(rep,company,year,value,source){
  value=['Yes','No','Not answered'].indexOf(value)>=0?value:'Not answered';
  var crm=crmState(),account=crmAccount(crm,rep,company,true),profile=account.profile;
  profile.expectedChristmasOrders=profile.expectedChristmasOrders||{};
  profile.expectedChristmasOrders[year]={value:value,updatedAt:new Date().toISOString(),updatedBy:rep,source:source||'company-profile'};
  account.activities.push({
   id:makeId('field'),source:'call-cycle-v547',type:'Company Field Update',
   subject:'Expected Christmas Order '+year+': '+value,
   detail:'Expected Christmas Order updated to '+value+'.',
   date:new Date().toISOString(),createdAt:new Date().toISOString(),field:'expectedChristmasOrder',year:year,value:value
  });
  localStorage.setItem(CRM,JSON.stringify(crm));
  try{window._cw4DirectoryCache=null;window._cw4ProfileCache={}}catch(e){}
  var s=state();audit(s,'christmas-order','Expected Christmas Order '+year+' changed to '+value+'.',rep,company);save(s);
  refreshCurrent(rep);
  renderAll()
 }
 function loyaltyInfo(customer,year,settings){
  var sales=currentYearSales(customer,year),l=settings.loyalty;
  var tier='Silver',next='Gold',nextThreshold=n(l.gold),gap=Math.max(0,nextThreshold-sales),close=n(l.closeSilverGold),priority=99;
  if(sales>=n(l.diamond)){tier='Diamond';next='Top tier';nextThreshold=n(l.diamond);gap=0;close=0;priority=6}
  else if(sales>=n(l.platinum)){tier='Platinum';next='Diamond';nextThreshold=n(l.diamond);gap=Math.max(0,nextThreshold-sales);close=n(l.closePlatinumDiamond);priority=3}
  else if(sales>=n(l.gold)){tier='Gold';next='Platinum';nextThreshold=n(l.platinum);gap=Math.max(0,nextThreshold-sales);close=n(l.closeGoldPlatinum);priority=2}
  else{priority=1}
  var closeToNext=next!=='Top tier'&&gap<=close;
  if(!closeToNext){
   if(tier==='Gold')priority=4;
   else if(tier==='Platinum')priority=5;
   else if(tier==='Diamond')priority=6;
   else priority=99
  }
  return{sales:sales,tier:tier,next:next,nextThreshold:nextThreshold,gap:gap,closeWindow:close,closeToNext:closeToNext,priority:priority}
 }
 function candidateRows(rep,cycle,settings){
  var year=cycle.start.getFullYear(),customers=customerRows(rep),rows=[];
  customers.forEach(function(customer){
   var last=lastContact(rep,customer.name),lastIso=last?iso(last):'',base={
    id:'company_'+norm(customer.name).replace(/\s+/g,'_'),
    company:customer.name,
    contact:customer.contact||'Primary contact not recorded',
    email:customer.email||'',
    phone:customer.phone||'',
    lastContactAt:lastIso,
    netSales:currentYearSales(customer,year),
    reason:'',
    detail:'',
    priority:50,
    completedAt:'',
    callAttemptAt:'',
    emailAt:''
   };
   if(cycle.kind==='regular'){
    base.reason='Account Updating Call';
    base.detail=cycle.label+' · Complete one call attempt and the follow-up email.';
    base.priority=last?Math.max(1,Math.floor((today()-last)/86400000))*-1:-99999;
    rows.push(base);return
   }
   if(cycle.kind==='november'){
    var christmas=expectedChristmas(rep,customer.name,year),seasonal=seasonalEvidence(customer,year,settings.seasonalLookbackYears);
    if(christmas==='Yes'){
     base.reason='Expected Christmas Order: Yes';
     base.detail='Customer was marked Yes during the July–October Christmas-order review.';
     base.priority=1;rows.push(base);return
    }
    if(!seasonal.current.length&&seasonal.historical.length){
     var years=Object.keys(seasonal.years).sort().reverse();
     base.reason='Historical September–November purchaser';
     base.detail='Ordered in Sep–Nov during '+years.join(', ')+'; no Sep–Nov '+year+' order is recorded.';
     base.priority=2-Math.min(.9,seasonal.historical.length/20);
     base.historicalYears=years;base.historicalOrders=seasonal.historical.length;rows.push(base)
    }
    return
   }
   if(cycle.kind==='december'){
    var loyalty=loyaltyInfo(customer,year,settings);
    if(loyalty.priority===99)return;
    base.loyalty=loyalty;
    base.priority=loyalty.priority;
    if(loyalty.closeToNext){
     base.reason=loyalty.tier+' customer close to '+loyalty.next;
     base.detail=money(loyalty.sales)+' net sales · '+money(loyalty.gap)+' needed to reach '+loyalty.next+'.'
    }else{
     base.reason=loyalty.tier+' loyalty thank-you';
     base.detail=money(loyalty.sales)+' current-year net sales · thank the customer for their loyalty.'
    }
    rows.push(base)
   }
  });
  rows.sort(function(a,b){
   if(a.priority!==b.priority)return a.priority-b.priority;
   if(cycle.kind==='december'){
    var ag=a.loyalty&&a.loyalty.gap||0,bg=b.loyalty&&b.loyalty.gap||0;
    if(a.priority<=3&&ag!==bg)return ag-bg
   }
   var ad=a.lastContactAt||'0000-00-00',bd=b.lastContactAt||'0000-00-00';
   if(ad!==bd)return ad.localeCompare(bd);
   if(b.netSales!==a.netSales)return b.netSales-a.netSales;
   return a.company.localeCompare(b.company)
  });
  return rows
 }
 function campaign(value,rep,date,force){
  var cycle=cycleFor(date),existing=value.campaigns[cycle.id];
  if(!existing||force){
   existing={id:cycle.id,key:cycle.key,label:cycle.label,kind:cycle.kind,start:iso(cycle.start),end:iso(cycle.end),createdAt:new Date().toISOString(),reps:{}};
   value.campaigns[cycle.id]=existing;
   audit(value,force?'campaign-rebuilt':'campaign-created',cycle.label+' campaign snapshot '+(force?'rebuilt':'created')+'.');save(value)
  }
  if(!existing.reps[rep]||force){
   var rows=candidateRows(rep,cycle,value.settings);
   existing.reps[rep]={rep:rep,createdAt:new Date().toISOString(),set:rows};
   audit(value,force?'rep-set-rebuilt':'rep-set-created',rows.length+' customers assigned for '+cycle.label+'.',rep);save(value)
  }
  return{definition:cycle,campaign:existing,rep:existing.reps[rep]}
 }
 function campaignActivityStatus(rep,company,cycle){
  var start=localDate(cycle.start),end=localDate(cycle.end),acts=activities(rep,company),calls=[],emails=[];
  acts.forEach(function(a){
   var d=activityDate(a);if(!d||d<start||d>end)return;
   var source=String(field(a,['source'],'')||''),type=String(field(a,['type'],'')||''),status=String(field(a,['status','deliveryStatus'],'')||'');
   if(/embedded-dialer-v540|call attempt|^call$/i.test(source+' '+type))calls.push(d);
   if(/embedded-email-v540|^email$/i.test(source+' '+type)&&!/draft/i.test(status))emails.push(d)
  });
  calls.sort(function(a,b){return a-b});emails.sort(function(a,b){return a-b});
  var call=calls[0]||null,email=emails[0]||null,complete=call&&email?new Date(Math.max(call.getTime(),email.getTime())):null;
  return{callAttemptAt:call?iso(call):'',emailAt:email?iso(email):'',completedAt:complete?iso(complete):''}
 }
 function refreshCampaign(value,rep,date){
  var bundle=campaign(value,rep,date,false),changed=false;
  arr(bundle.rep.set).forEach(function(item){
   var status=campaignActivityStatus(rep,item.company,bundle.campaign);
   if(item.callAttemptAt!==status.callAttemptAt||item.emailAt!==status.emailAt||item.completedAt!==status.completedAt){
    var was=item.completedAt;item.callAttemptAt=status.callAttemptAt;item.emailAt=status.emailAt;item.completedAt=status.completedAt;changed=true;
    if(!was&&item.completedAt)audit(value,'customer-completed',item.company+' completed with a call attempt and follow-up email.',rep,item.company)
   }
  });
  if(changed)save(value);
  return bundle
 }
 function paceFor(rep,date){
  var d=localDate(date)||today(),value=state(),bundle=refreshCampaign(value,rep,d),cycle=bundle.definition,milestone=milestoneFor(cycle,d),set=arr(bundle.rep.set),size=set.length;
  var completed=set.filter(function(item){return !!item.completedAt}),attempted=set.filter(function(item){return !!item.callAttemptAt}),emailed=set.filter(function(item){return !!item.emailAt});
  var targetCount=Math.ceil(size*milestone.target/100),previousTargetCount=Math.ceil(size*milestone.previousTarget/100);
  var beforeToday=completed.filter(function(item){return item.completedAt<iso(d)}).length,todayCompleted=completed.filter(function(item){return item.completedAt===iso(d)}).length;
  var remainingBusiness=businessDays(d,milestone.end,value.settings),businessToday=isBusinessDay(d,value.settings);
  var dailyTarget=businessToday?Math.max(0,Math.ceil((targetCount-beforeToday)/Math.max(1,remainingBusiness))):0;
  var todayRemaining=Math.max(0,dailyTarget-todayCompleted);
  var nextDay=nextBusinessDay(d,value.settings),nextDays=businessDays(nextDay,milestone.end,value.settings);
  var projectedNext=Math.max(0,Math.ceil((targetCount-completed.length)/Math.max(1,nextDays)));
  var totalDays=businessDays(milestone.start,milestone.end,value.settings),elapsed=Math.min(totalDays,businessDays(milestone.start,d,value.settings));
  var expected=Math.round(previousTargetCount+(targetCount-previousTargetCount)*(totalDays?elapsed/totalDays:1));
  var delta=completed.length-expected,status='On pace',tone='on';
  if(completed.length>=targetCount){status=milestone.target===100&&completed.length>=size?'Campaign complete':'Milestone complete';tone='complete'}
  else if(delta>=2){status='Ahead of pace';tone='ahead'}
  else if(delta<=-2){status='Behind pace';tone='behind'}
  return{
   state:value,bundle:bundle,cycle:cycle,milestone:milestone,set:set,size:size,
   completed:completed.length,attempted:attempted.length,emailed:emailed.length,
   completedPct:percent(completed.length,size),targetCount:targetCount,targetPct:milestone.target,
   milestoneAchievement:percent(completed.length,targetCount),beforeToday:beforeToday,
   todayCompleted:todayCompleted,dailyTarget:dailyTarget,todayRemaining:todayRemaining,
   projectedNext:projectedNext,expected:expected,delta:delta,status:status,tone:tone,
   businessToday:businessToday,remainingBusiness:remainingBusiness,
   nextBusinessDay:nextDay
  }
 }
 function cycleQueue(rep,date){
  var pace=paceFor(rep,date),needed=pace.todayRemaining;if(!needed)return[];
  var rows=pace.set.filter(function(item){return !item.completedAt}).slice(0,needed);
  return rows.map(function(item,index){
   return{
    id:'cycle_'+pace.cycle.id+'_'+item.id,
    rank:index+1,
    customer:item.company,
    contact:item.contact||'Primary contact not recorded',
    reason:'Account Updating Call · '+item.reason,
    copy:item.detail+' '+(item.callAttemptAt&&!item.emailAt?'Call attempted; follow-up email still required.':''),
    source:'Annual Call Cycle · '+pace.cycle.short,
    due:iso(date||today()),
    value:item.netSales||0,
    level:pace.tone==='behind'?'urgent':pace.tone==='ahead'?'watch':'normal',
    callCycle:true
   }
  })
 }
 function refreshCurrent(rep){
  if(!rep)return null;
  var value=state();refreshCampaign(value,rep,today());save(value);return paceFor(rep,today())
 }
 function currentRep(){return clean(window._rp2&&_rp2.rep||'')}
 function campaignHeaderHtml(rep){
  var p=paceFor(rep,today()),overall=Math.min(100,p.completedPct),milestone=Math.min(100,p.milestoneAchievement);
  var deltaText=p.delta>0?'Ahead by '+p.delta+' customer'+(p.delta===1?'':'s'):p.delta<0?'Behind by '+Math.abs(p.delta)+' customer'+(p.delta===-1?'':'s'):'Exactly on pace';
  var todayCopy=p.businessToday?(p.todayRemaining+' remaining today'):'Excluded business day · next requirement '+p.projectedNext;
  return'<section id="cc547-rep-command" class="cc547-rep-command"><div class="cc547-command-top"><div><div class="cc547-command-kick">ANNUAL CALLING CYCLE · ADAPTIVE QUEUE · BUILD v547</div>'+
   '<div class="cc547-command-title">'+esc(p.cycle.label)+'</div><div class="cc547-command-copy">The assigned set is frozen for this cycle. A customer is completed only after a call attempt and the follow-up email are recorded. Daily requirements automatically adjust across remaining business days.</div></div>'+
   '<div class="cc547-pace-badge '+esc(p.tone)+'"><span>Current pace</span><strong>'+esc(p.status)+'</strong><p>'+esc(deltaText)+'</p></div></div>'+
   '<div class="cc547-metrics"><div class="cc547-metric"><span>Called + emailed</span><strong>'+p.completed+' / '+p.size+'</strong><p>'+p.completedPct+'% of the complete assigned set.</p></div>'+
    '<div class="cc547-metric"><span>Current milestone</span><strong>'+p.completedPct+'% / '+p.targetPct+'%</strong><p>'+p.milestoneAchievement+'% of the '+p.milestone.label+' requirement achieved.</p></div>'+
    '<div class="cc547-metric"><span>Today</span><strong>'+p.todayCompleted+' / '+p.dailyTarget+'</strong><p>'+esc(todayCopy)+'</p></div>'+
    '<div class="cc547-metric"><span>Activity evidence</span><strong>'+p.attempted+' calls · '+p.emailed+' emails</strong><p>Both are required on the same campaign customer.</p></div>'+
    '<div class="cc547-metric"><span>Tomorrow projection</span><strong>'+p.projectedNext+'</strong><p>Projected requirement for '+fmt(p.nextBusinessDay)+'.</p></div></div>'+
   '<div class="cc547-progress"><div class="cc547-progress-card"><div class="cc547-progress-head"><span>Current milestone progress</span><strong>'+Math.min(100,p.milestoneAchievement)+'%</strong></div><div class="cc547-bar"><i style="width:'+Math.min(100,milestone)+'%"></i></div></div>'+
    '<div class="cc547-progress-card"><div class="cc547-progress-head"><span>Full campaign progress</span><strong>'+overall+'%</strong></div><div class="cc547-bar"><i style="width:'+overall+'%"></i></div></div></div>'+
   '<div class="cc547-command-actions"><button class="cc547-command-btn primary" onclick="_rp2Go(\'call\')">Open today’s '+p.todayRemaining+' assigned calls</button><button class="cc547-command-btn" onclick="_rp2Go(\'action\')">Today’s Business</button><button class="cc547-command-btn" onclick="_cc547RefreshRep()">Refresh cycle status</button></div></section>'
 }
 function christmasPanelHtml(rep,company,callMode){
  var d=today(),year=d.getFullYear(),month=d.getMonth(),value=expectedChristmas(rep,company,year),editable=!callMode||(month>=6&&month<=9);
  var seasonal=seasonalEvidence({name:company},year,state().settings.seasonalLookbackYears),years=Object.keys(seasonal.years).sort().reverse();
  return'<section class="'+(callMode?'cc547-christmas-card':'cc547-company-panel')+'">'+
   (callMode?'<label>Holiday opportunity planning · '+year+'</label><strong>Expected Christmas Order</strong>':
    '<div class="cc547-company-head"><div><strong>Christmas Order Planning · '+year+'</strong><p>This permanent company record is collected during July–October and drives the November campaign.</p></div></div>')+
   (callMode?'<p>'+(editable?'Record Yes or No during July–October.':'The July–October answer is shown for campaign context.')+'</p>':'')+
   (callMode?
    (editable?'<select onchange="_cc547SetChristmas(\''+encodeURIComponent(rep)+'\',\''+encodeURIComponent(company)+'\','+year+',this.value,\'call-workspace\')">'+christmasOptions(value)+'</select>':'<div class="cc547-company-note" style="margin-top:10px"><strong style="color:#fff">'+esc(value)+'</strong> · update from the Company Profile when a correction is needed.</div>'):
    '<div class="cc547-company-grid"><div class="cc547-company-stat"><span>Expected order</span><strong>'+esc(value)+'</strong></div><div class="cc547-company-stat"><span>Historical Sep–Nov years</span><strong>'+esc(years.join(', ')||'None loaded')+'</strong></div><div class="cc547-company-stat"><span>Historical seasonal orders</span><strong>'+seasonal.historical.length+'</strong></div><div class="cc547-company-stat"><span>Current-year Sep–Nov orders</span><strong>'+seasonal.current.length+'</strong></div></div>'+
    '<div class="cc547-company-editor"><label>Expected Christmas Order<select onchange="_cc547SetChristmas(\''+encodeURIComponent(rep)+'\',\''+encodeURIComponent(company)+'\','+year+',this.value,\'company-profile\')">'+christmasOptions(value)+'</select></label><div class="cc547-company-note">A Yes answer automatically qualifies the company for the November campaign. A company may also qualify independently when it historically ordered during September–November in the previous '+state().settings.seasonalLookbackYears+' years and has not ordered in that window this year.</div></div>')+
   '</section>'
 }
 function christmasOptions(selected){
  return['Not answered','Yes','No'].map(function(value){return'<option '+(value===selected?'selected':'')+'>'+value+'</option>'}).join('')
 }
 function installRepHeader(){
  var rep=currentRep(),page=window._rp2&&_rp2.page||'',host=document.getElementById('rp2-page');
  if(!rep||!host||['home','call','action'].indexOf(page)<0)return;
  var old=document.getElementById('cc547-rep-command');if(old)old.remove();
  host.insertAdjacentHTML('afterbegin',campaignHeaderHtml(rep))
 }
 function installCallChristmas(){
  var rep=currentRep(),company=clean(window._call532&&window._call532.company||''),body=document.querySelector('#rp-overlay .cl2-right .cl2-body');
  if(!rep||!company||!body)return;
  var old=body.querySelector('.cc547-christmas-card');if(old)old.remove();
  body.insertAdjacentHTML('afterbegin',christmasPanelHtml(rep,company,true))
 }
 function installCompanyPanel(){
  var rep=currentRep(),company=clean(window._cw4CompanyName||''),host=document.getElementById('rp2-page');
  if(!rep||!company||!host)return;
  var old=document.getElementById('cc547-company-panel');if(old)old.remove();
  var target=host.querySelector('.cw5-summary-grid')||host.querySelector('.rp2-co-hero')||host.firstElementChild;
  var html=christmasPanelHtml(rep,company,false).replace('<section class="cc547-company-panel">','<section id="cc547-company-panel" class="cc547-company-panel">');
  if(target&&target.classList&&target.classList.contains('cw5-summary-grid'))target.insertAdjacentHTML('beforebegin',html);
  else if(target)target.insertAdjacentHTML('afterend',html);
  else host.insertAdjacentHTML('afterbegin',html)
 }
 function scheduleCardsHtml(){
  var d=today(),defs=cycleDefinitions(d.getFullYear()),current=cycleFor(d);
  return'<div class="cc547-cycle-grid">'+defs.map(function(c){
   return'<article class="cc547-cycle '+(c.id===current.id?'current':'')+'"><span>Reset '+fmt(c.start)+'</span><strong>'+esc(c.short)+'</strong><p>'+esc(c.label)+'</p><p>'+c.milestones.map(function(m){return m.target+'% by '+fmt(m.end)}).join('<br>')+'</p></article>'
  }).join('')+'</div>'
 }
 function dateListHtml(kind,rows){
  return'<div class="cc547-date-list">'+(rows.length?rows.slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date))}).map(function(row,index){
   return'<div class="cc547-date-row"><strong>'+esc(row.date)+'</strong><span>'+esc(row.label||kind)+'</span><button onclick="_cc547RemoveDate(\''+kind+'\','+index+')">×</button></div>'
  }).join(''):'<div class="cc547-note">No '+esc(kind)+' dates configured.</div>')+'</div>'
 }
 function repStatusRows(){
  var reps=allReps();return reps.map(function(rep){
   var p=paceFor(rep,today());
   return'<tr><td><strong>'+esc(rep)+'</strong></td><td>'+p.size+'</td><td>'+p.completed+'</td><td>'+p.completedPct+'% / '+p.targetPct+'%</td><td>'+p.todayCompleted+' / '+p.dailyTarget+'</td><td>'+p.todayRemaining+'</td><td><span class="cc547-tone '+p.tone+'">'+esc(p.status)+'</span></td><td><button class="cc547-btn" onclick="_cc547RebuildRep(\''+encodeURIComponent(rep)+'\')">Rebuild set</button></td></tr>'
  }).join('')
 }
 function currentAdminSummary(){
  var reps=allReps(),paces=reps.map(function(rep){return paceFor(rep,today())}),set=0,done=0,todayNeed=0;
  paces.forEach(function(p){set+=p.size;done+=p.completed;todayNeed+=p.todayRemaining});
  return{reps:reps.length,set:set,done:done,todayNeed:todayNeed,cycle:cycleFor(today())}
 }
 function overviewHtml(){
  var summary=currentAdminSummary(),s=state();
  return'<div class="cc547-layout"><div><section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">Annual call calendar</div><div class="cc547-panel-copy">Campaign snapshots reset automatically at the beginning of each calling period.</div></div></div><div class="cc547-panel-body">'+scheduleCardsHtml()+'</div></section>'+
   '<section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">Current-cycle controls</div><div class="cc547-panel-copy">Rebuild only when customer ownership or campaign rules changed after the reset.</div></div></div><div class="cc547-panel-body"><div class="cc547-actions"><button class="cc547-btn primary" onclick="_cc547RebuildAll()">Rebuild all rep sets</button><button class="cc547-btn" onclick="_cc547RefreshAll()">Refresh completion evidence</button></div><div class="cc547-note">A rebuild freezes a new denominator using the current customer assignments. Existing call and email activities in the current cycle are reapplied automatically.</div></div></section></div>'+
   '<section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">Rep campaign status</div><div class="cc547-panel-copy">Daily requirements use each rep’s frozen set and remaining eligible business days.</div></div></div><div class="cc547-panel-body"><div class="cc547-status-grid"><div class="cc547-status"><span>Active reps</span><strong>'+summary.reps+'</strong></div><div class="cc547-status"><span>Assigned customers</span><strong>'+summary.set+'</strong></div><div class="cc547-status"><span>Completed</span><strong>'+summary.done+'</strong></div><div class="cc547-status"><span>Remaining today</span><strong>'+summary.todayNeed+'</strong></div><div class="cc547-status"><span>Audit events</span><strong>'+s.audit.length+'</strong></div></div><div class="cc547-table-wrap"><table class="cc547-table"><thead><tr><th>Rep</th><th>Set</th><th>Complete</th><th>% / target</th><th>Today</th><th>Remaining</th><th>Pace</th><th></th></tr></thead><tbody>'+repStatusRows()+'</tbody></table></div></div></section></div>'
 }
 function businessDaysHtml(){
  var s=state().settings;
  return'<div class="cc547-layout"><div><section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">Company holidays</div><div class="cc547-panel-copy">These Monday–Friday dates are removed from every pacing calculation.</div></div></div><div class="cc547-panel-body"><div class="cc547-grid2"><div class="cc547-field"><label>Date<input id="cc547-holiday-date" type="date"></label></div><div class="cc547-field"><label>Holiday name<input id="cc547-holiday-label" placeholder="Thanksgiving"></label></div></div><div class="cc547-actions"><button class="cc547-btn primary" onclick="_cc547AddDate(\'holidays\')">Add holiday</button></div>'+dateListHtml('holidays',s.holidays)+'</div></section></div>'+
   '<div><section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">Calling blackout days</div><div class="cc547-panel-copy">Use for company meetings, inventory days, weather closures, or other non-calling dates.</div></div></div><div class="cc547-panel-body"><div class="cc547-grid2"><div class="cc547-field"><label>Date<input id="cc547-blackout-date" type="date"></label></div><div class="cc547-field"><label>Reason<input id="cc547-blackout-label" placeholder="Company meeting"></label></div></div><div class="cc547-actions"><button class="cc547-btn primary" onclick="_cc547AddDate(\'blackouts\')">Add blackout</button></div>'+dateListHtml('blackouts',s.blackouts)+'</div></section></div></div>'
 }
 function specialHtml(){
  var s=state().settings,l=s.loyalty,year=today().getFullYear(),reps=allReps(),yes=0,no=0,unanswered=0;
  reps.forEach(function(rep){customerRows(rep).forEach(function(c){var v=expectedChristmas(rep,c.name,year);if(v==='Yes')yes++;else if(v==='No')no++;else unanswered++})});
  return'<div class="cc547-layout"><div><section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">November Christmas campaign</div><div class="cc547-panel-copy">Expected-order answers begin populating in July–October.</div></div></div><div class="cc547-panel-body"><div class="cc547-field"><label>Historical lookback years<input id="cc547-lookback" type="number" min="1" max="10" value="'+s.seasonalLookbackYears+'"></label></div><div class="cc547-status-grid" style="grid-template-columns:repeat(3,1fr)"><div class="cc547-status"><span>Expected Yes</span><strong>'+yes+'</strong></div><div class="cc547-status"><span>Expected No</span><strong>'+no+'</strong></div><div class="cc547-status"><span>Not answered</span><strong>'+unanswered+'</strong></div></div><div class="cc547-note">November includes every current-year Yes plus companies that ordered during September–November in any of the previous lookback years but have not ordered in that window this year.</div><div class="cc547-actions"><button class="cc547-btn primary" onclick="_cc547SaveSpecial()">Save November settings</button></div></div></section></div>'+
   '<section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">December loyalty levels</div><div class="cc547-panel-copy">All tiers are calculated from current-year net sales.</div></div></div><div class="cc547-panel-body"><div class="cc547-grid2"><div class="cc547-field"><label>Silver threshold<input id="cc547-silver" type="number" min="0" value="'+l.silver+'"></label></div><div class="cc547-field"><label>Gold threshold<input id="cc547-gold" type="number" min="0" value="'+l.gold+'"></label></div><div class="cc547-field"><label>Platinum threshold<input id="cc547-platinum" type="number" min="0" value="'+l.platinum+'"></label></div><div class="cc547-field"><label>Diamond threshold<input id="cc547-diamond" type="number" min="0" value="'+l.diamond+'"></label></div></div>'+
    '<div class="cc547-grid3"><div class="cc547-field"><label>Silver → Gold close window<input id="cc547-close-sg" type="number" min="0" value="'+l.closeSilverGold+'"></label></div><div class="cc547-field"><label>Gold → Platinum close window<input id="cc547-close-gp" type="number" min="0" value="'+l.closeGoldPlatinum+'"></label></div><div class="cc547-field"><label>Platinum → Diamond close window<input id="cc547-close-pd" type="number" min="0" value="'+l.closePlatinumDiamond+'"></label></div></div>'+
    '<div class="cc547-note">Priority: Silver close to Gold → Gold close to Platinum → Platinum close to Diamond → remaining Gold → remaining Platinum → remaining Diamond. Each group is sorted by next-level gap, then longest since contact.</div><div class="cc547-actions"><button class="cc547-btn primary" onclick="_cc547SaveLoyalty()">Save loyalty rules</button></div></div></section></div>'
 }
 function auditHtml(){
  var s=state();
  return'<section class="cc547-panel"><div class="cc547-panel-head"><div><div class="cc547-panel-title">Campaign audit history</div><div class="cc547-panel-copy">Resets, rebuilds, completion events, and Christmas-order field changes.</div></div><button class="cc547-btn danger" onclick="_cc547ClearAudit()">Clear audit</button></div><div class="cc547-panel-body"><div class="cc547-audit">'+(s.audit.length?s.audit.map(function(row){return'<div class="cc547-audit-row"><strong>'+esc(row.type)+' · '+esc(row.rep||'System')+(row.company?' · '+esc(row.company):'')+'</strong><span>'+new Date(row.at).toLocaleString()+' · '+esc(row.detail)+'</span></div>'}).join(''):'<div class="cc547-note">No audit events yet.</div>')+'</div></div></section>'
 }
 function adminHtml(){
  var p=currentAdminSummary();
  return'<section id="cc547-admin" class="cc547-admin"><div class="cc547-admin-hero"><div><div class="cc547-admin-kick">CALL CYCLES & QUEUE RULES · BUILD v547</div><h2>Automatic resets, business-day pacing, and special campaigns</h2><p>Freeze each rep’s eligible customer set at the reset, calculate the milestone requirement, assign the correct number of customers each business day, and automatically rebalance the remaining workload when a rep gets ahead or behind.</p></div><div class="cc547-admin-now"><span>Current campaign</span><strong>'+esc(p.cycle.label)+'</strong><p>'+p.reps+' reps · '+p.set+' assigned customers · '+p.todayNeed+' remaining across today’s queues</p></div></div>'+
   '<div class="cc547-admin-tabs">'+[['overview','Overview & Rep Pace'],['business','Holidays & Blackouts'],['special','Christmas & Loyalty'],['audit','Audit History']].map(function(tab){return'<button class="cc547-admin-tab '+(adminTab===tab[0]?'on':'')+'" onclick="_cc547AdminTab(\''+tab[0]+'\')">'+tab[1]+'</button>'}).join('')+'</div>'+
   '<div id="cc547-admin-body" class="cc547-admin-body">'+(adminTab==='business'?businessDaysHtml():adminTab==='special'?specialHtml():adminTab==='audit'?auditHtml():overviewHtml())+'</div></section>'
 }
 function installAdmin(){
  var page=document.getElementById('pg-admin');if(!page)return;
  var old=document.getElementById('cc547-admin');if(old)old.remove();
  var status=page.querySelector('.admin-status-grid'),hero=page.querySelector('.admin-sys-hero');
  if(status)status.insertAdjacentHTML('afterend',adminHtml());
  else if(hero)hero.insertAdjacentHTML('afterend',adminHtml());
  else page.insertAdjacentHTML('afterbegin',adminHtml())
 }
 function renderAll(){
  setTimeout(function(){
   installAdmin();installRepHeader();
   if(window._rp2&&_rp2.page==='call')installCallChristmas();
   if(window._rp2&&_rp2.page==='customers'&&window._cw4CompanyName)installCompanyPanel()
  },0)
 }
 window._cc547SetChristmas=function(repEncoded,companyEncoded,year,value,source){
  setExpectedChristmas(decodeURIComponent(repEncoded),decodeURIComponent(companyEncoded),year,value,source)
 };
 window._cc547RefreshRep=function(){refreshCurrent(currentRep());renderAll()};
 window._cc547AdminTab=function(tab){adminTab=window._cc547AdminTab=tab;installAdmin()};
 window._cc547AddDate=function(kind){
  var date=clean((document.getElementById('cc547-'+(kind==='holidays'?'holiday':'blackout')+'-date')||{}).value||'');
  var label=clean((document.getElementById('cc547-'+(kind==='holidays'?'holiday':'blackout')+'-label')||{}).value||'');
  if(!date){alert('Choose a date first.');return}
  var s=state();s.settings[kind].push({date:date,label:label||kind});audit(s,'business-day-added',date+' added to '+kind+'.');save(s);installAdmin();renderAll()
 };
 window._cc547RemoveDate=function(kind,index){
  var s=state(),sorted=arr(s.settings[kind]).slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date))}),row=sorted[index];
  if(!row)return;
  s.settings[kind]=s.settings[kind].filter(function(item){return !(item.date===row.date&&item.label===row.label)});
  audit(s,'business-day-removed',row.date+' removed from '+kind+'.');save(s);installAdmin();renderAll()
 };
 window._cc547SaveSpecial=function(){
  var s=state();s.settings.seasonalLookbackYears=clamp((document.getElementById('cc547-lookback')||{}).value,1,10);audit(s,'settings-updated','November seasonal lookback changed to '+s.settings.seasonalLookbackYears+' years.');save(s);installAdmin()
 };
 window._cc547SaveLoyalty=function(){
  var s=state(),l=s.settings.loyalty;
  l.silver=n((document.getElementById('cc547-silver')||{}).value);l.gold=n((document.getElementById('cc547-gold')||{}).value);
  l.platinum=n((document.getElementById('cc547-platinum')||{}).value);l.diamond=n((document.getElementById('cc547-diamond')||{}).value);
  l.closeSilverGold=n((document.getElementById('cc547-close-sg')||{}).value);l.closeGoldPlatinum=n((document.getElementById('cc547-close-gp')||{}).value);l.closePlatinumDiamond=n((document.getElementById('cc547-close-pd')||{}).value);
  if(!(l.silver<=l.gold&&l.gold<=l.platinum&&l.platinum<=l.diamond)){alert('Loyalty thresholds must increase from Silver through Diamond.');return}
  audit(s,'settings-updated','Loyalty thresholds and close-to-level windows updated.');save(s);installAdmin()
 };
 window._cc547RebuildRep=function(encoded){
  var rep=decodeURIComponent(encoded),s=state();campaign(s,rep,today(),true);save(s);installAdmin();if(norm(rep)===norm(currentRep()))renderAll()
 };
 window._cc547RebuildAll=function(){
  if(!confirm('Rebuild every rep’s current campaign set using today’s customer assignments and current rules?'))return;
  var s=state();allReps().forEach(function(rep){campaign(s,rep,today(),true)});save(s);installAdmin();renderAll()
 };
 window._cc547RefreshAll=function(){
  var s=state();allReps().forEach(function(rep){refreshCampaign(s,rep,today())});save(s);installAdmin();renderAll()
 };
 window._cc547ClearAudit=function(){
  if(!confirm('Clear the Call Cycle audit history? Campaign sets and completion records will remain.'))return;
  var s=state();s.audit=[];save(s);installAdmin()
 };

 var previousDesktopBuild=window._rp2DesktopBuild;
 window._rp2DesktopBuild=function(){
  var result=typeof previousDesktopBuild==='function'?previousDesktopBuild.apply(this,arguments):{customers:{},calls:[],business:{lanes:{overdue:[]}}};
  var rep=currentRep();
  if(rep){
   var p=paceFor(rep,today());
   result.callCycle=p;
   result.calls=cycleQueue(rep,today())
  }
  return result
 };

 var previousSendEmail=window._call540SendEmail;
 window._call540SendEmail=function(){
  var result=typeof previousSendEmail==='function'?previousSendEmail.apply(this,arguments):undefined;
  setTimeout(function(){refreshCurrent(currentRep());renderAll()},0);
  return result
 };
 var previousStartDial=window._call540StartDial;
 window._call540StartDial=function(){
  var result=typeof previousStartDial==='function'?previousStartDial.apply(this,arguments):undefined;
  setTimeout(function(){refreshCurrent(currentRep());renderAll()},0);
  return result
 };
 var previousEndDial=window._call540EndDial;
 window._call540EndDial=function(){
  var result=typeof previousEndDial==='function'?previousEndDial.apply(this,arguments):undefined;
  setTimeout(function(){refreshCurrent(currentRep());renderAll()},0);
  return result
 };

 var previousAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof previousAfter==='function'?previousAfter.apply(this,arguments):undefined;
  renderAll();return result
 };
 var previousGt=window.gt;
 if(typeof previousGt==='function'){
  window.gt=function(){
   var result=previousGt.apply(this,arguments);setTimeout(installAdmin,30);return result
  }
 }

 window.TCP_CALL_CYCLE_V547={
  version:'v547',
  state:state,
  cycleDefinitions:cycleDefinitions,
  cycleFor:cycleFor,
  milestoneFor:milestoneFor,
  isBusinessDay:isBusinessDay,
  businessDays:businessDays,
  customerRows:customerRows,
  seasonalEvidence:seasonalEvidence,
  loyaltyInfo:loyaltyInfo,
  candidateRows:candidateRows,
  campaign:campaign,
  refreshCampaign:refreshCampaign,
  paceFor:paceFor,
  cycleQueue:cycleQueue,
  expectedChristmas:expectedChristmas,
  setExpectedChristmas:setExpectedChristmas,
  diagnostics:function(rep,date){
   var p=paceFor(rep||currentRep(),date||today());
   return{
    cycle:p.cycle.id,milestone:p.milestone.label,set:p.size,completed:p.completed,
    attempted:p.attempted,emailed:p.emailed,dailyTarget:p.dailyTarget,
    todayCompleted:p.todayCompleted,todayRemaining:p.todayRemaining,
    targetPct:p.targetPct,status:p.status
   }
  }
 };

 var rep=currentRep();if(rep)refreshCurrent(rep);
 installAdmin();renderAll();
 setTimeout(function(){installAdmin();renderAll()},500);
 setInterval(function(){
  var active=currentRep();if(active){refreshCurrent(active);renderAll()}
 },300000);
})();
