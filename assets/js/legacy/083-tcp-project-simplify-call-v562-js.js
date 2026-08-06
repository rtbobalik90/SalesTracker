
(function(){
 'use strict';

 var legacyRender=window.TCP_CALL_V540&&TCP_CALL_V540.render;
 var legacyData=window.TCP_CALL_V540&&TCP_CALL_V540.currentData;
 var legacyPromotion=window.TCP_CALL_V540&&TCP_CALL_V540.promotion;
 var baseSendEmail=window._call540SendEmail;
 var baseStartDial=window._call540StartDial;
 var baseEndDial=window._call540EndDial;
 var baseComplete=window._call540CompleteCall;
 var baseNext=window._call532Next;
 var baseGoTab=window._call540GoTab;
 var basePrepTab=window._call540PrepTabGo;
 var baseToggle=window._call540Toggle;
 var baseClear=window._call540Clear;
 var baseSelectAll=window._call540SelectAll;
 var baseSelectArtwork=window._call540SelectArtworkMethod;
 var baseFilter=window._call540Filter;
 var baseGenerate=window._call540GenerateTalkingPoints;
 var baseSelectCompany=window._call540SelectCompany;
 var baseContactChanged=window._call540ContactChanged;
 var baseResetCurrent=window._call532ResetCurrent;

 function n(value){var number=Number(value);return isFinite(number)?number:0}
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
 function esc(value){
  return typeof _rp2Esc==='function'?_rp2Esc(String(value==null?'':value)):
   String(value==null?'':value).replace(/[&<>"]/g,function(character){
    return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]
   })
 }
 function field(object,names,def){
  for(var i=0;i<names.length;i++){
   var value=object&&object[names[i]];
   if(value!=null&&clean(value)!=='')return value
  }
  return def==null?'':def
 }
 function money(value){
  return typeof _rp2$==='function'?_rp2$(n(value)):'$'+Math.round(n(value)).toLocaleString()
 }
 function fmt(value){
  if(!value)return'—';
  try{
   var date=/^\d{4}-\d{2}-\d{2}$/.test(String(value))?new Date(String(value)+'T12:00:00'):new Date(value);
   return isNaN(date.getTime())?'—':date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  }catch(error){return'—'}
 }
 function initials(name){
  return clean(name).split(/\s+/).map(function(part){return part[0]||''}).slice(0,2).join('').toUpperCase()
 }
 function current(){
  return typeof legacyData==='function'?legacyData():{
   company:window._call532&&_call532.company||'',
   g:{calls:[],quotes:[],opps:[]},c:{contacts:[]},orders:[],products:[],artwork:[],dates:[],account:{data:null}
  }
 }
 function promotion(){
  try{return typeof legacyPromotion==='function'?legacyPromotion():{promotionTitle:'Monthly promotion',promotionBody:'',promotionOffer:'',promotionCta:''}}catch(error){
   return{promotionTitle:'Monthly promotion',promotionBody:'',promotionOffer:'',promotionCta:''}
  }
 }
 function queueItem(data){
  return arr(data.g&&data.g.calls).filter(function(item){return norm(item.customer)===norm(data.company)})[0]||null
 }
 function contacts(data){
  var list=arr(data.c&&data.c.contacts);
  if(data.account&&data.account.data)list=list.concat(arr(data.account.data.contacts));
  var seen={};
  return list.filter(function(contact){
   var key=clean(field(contact,['id','contactId','email','name'],''));
   if(!key||seen[key])return false;seen[key]=true;return true
  })
 }
 function primaryContact(data){
  var draft=window._call532&&_call532.draft||{};
  var list=contacts(data);
  return list.filter(function(contact){
   return String(field(contact,['id','contactId'],''))===String(draft.contactId||'')
  })[0]||data.c&&data.c.primary||list[0]||{}
 }
 function openQuotes(data){
  return arr(data.g&&data.g.quotes).filter(function(quote){
   return norm(quote.company)===norm(data.company)&&!/closed|lost|expired/i.test(clean(quote.status))
  })
 }
 function openOpps(data){
  return arr(data.g&&data.g.opps).filter(function(opp){
   return norm(opp.company)===norm(data.company)&&!/closed|lost|won/i.test(clean(opp.stage||opp.status))
  })
 }
 function daysQuiet(data){
  var last=field(data.c||{},['lastContactDate'],'')||
   field(data.account&&data.account.data&&data.account.data.profile||{},['lastContactAt'],'');
  if(!last)return null;
  try{
   var date=new Date(last),today=new Date();
   if(isNaN(date.getTime()))return null;
   return Math.max(0,Math.floor((today-date)/86400000))
  }catch(error){return null}
 }
 function activityEvidence(data){
  var activities=arr(data.account&&data.account.data&&data.account.data.activities);
  var currentCompany=norm(data.company);
  var call=false,email=false;
  activities.forEach(function(activity){
   var source=clean(field(activity,['source'],''));
   var type=clean(field(activity,['type'],''));
   if(/embedded-dialer-v540|call attempt|^call$/i.test(source+' '+type))call=true;
   if(/embedded-email-v540|^email$/i.test(source+' '+type)&&!/draft/i.test(clean(field(activity,['status','deliveryStatus'],''))))email=true
  });
  return{call:call,email:email,complete:call&&email}
 }
 function annualSales(data){
  var year=new Date().getFullYear();
  return arr(data.orders).filter(function(order){
   try{return new Date(order.date).getFullYear()===year}catch(error){return false}
  }).reduce(function(sum,order){return sum+n(order.total)},0)
 }
 function loyalty(data){
  var store={};
  try{store=JSON.parse(localStorage.getItem('tcp_call_cycle_engine_v547')||'{}')||{}}catch(error){}
  var settings=store.settings&&store.settings.loyalty||{
   silver:0,gold:10000,platinum:25000,diamond:50000,
   closeSilverGold:2500,closeGoldPlatinum:5000,closePlatinumDiamond:10000
  };
  var sales=annualSales(data),tier='Silver',next='Gold',threshold=n(settings.gold);
  if(sales>=n(settings.diamond)){tier='Diamond';next='Top tier';threshold=n(settings.diamond)}
  else if(sales>=n(settings.platinum)){tier='Platinum';next='Diamond';threshold=n(settings.diamond)}
  else if(sales>=n(settings.gold)){tier='Gold';next='Platinum';threshold=n(settings.platinum)}
  return{sales:sales,tier:tier,next:next,gap:Math.max(0,threshold-sales)}
 }
 function expectedChristmas(data){
  var profile=data.account&&data.account.data&&data.account.data.profile||{};
  var rows=profile.expectedChristmasOrders||{};
  var year=new Date().getFullYear();
  var row=rows[year]||rows[String(year)]||{};
  return clean(typeof row==='string'?row:row.value||'Not answered')||'Not answered'
 }
 function reorderWindow(data){
  var counts={};
  arr(data.orders).forEach(function(order){
   try{
    var date=new Date(order.date);
    if(!isNaN(date.getTime())){
     var month=date.toLocaleDateString('en-US',{month:'long'});
     counts[month]=(counts[month]||0)+1
    }
   }catch(error){}
  });
  var best=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]})[0];
  return best?best+' is the strongest loaded reorder month':'No recurring order month identified'
 }
 function stage(){
  return window._call540Tab||'prep'
 }
 function stageButton(key,index,label){
  return'<button class="ps62-step '+(stage()===key?'on':'')+'" onclick="_call540GoTab(\''+key+'\')"><i>'+index+'</i><span>'+label+'</span></button>'
 }
 function command(data){
  var queue=queueItem(data),quotes=openQuotes(data),opps=openOpps(data),quiet=daysQuiet(data);
  return'<section class="ps62-command">'+
   '<div class="ps62-command-label"><strong>Call Workspace</strong><span>Active Customer</span></div>'+
   '<div><div class="ps62-company-line"><h1>'+esc(data.company||'Choose a customer')+'</h1><span class="ps62-active">Active</span></div>'+
    '<div class="ps62-command-pills">'+
     '<span class="ps62-pill rank">Ranked #'+esc(queue&&queue.rank||'—')+'</span>'+
     '<span class="ps62-pill quiet">'+(quiet==null?'No contact history':quiet+' days quiet')+'</span>'+
     '<span class="ps62-pill quote">'+(quotes.length?'Open Quote '+money(field(quotes[0],['amount','total'],0)):'No open quote')+'</span>'+
     '<span class="ps62-pill opp">'+opps.length+' opportunit'+(opps.length===1?'y':'ies')+'</span>'+
     '<span class="ps62-pill">'+esc(queue&&queue.reason||'Direct customer call')+'</span>'+
    '</div></div>'+
   '<div class="ps62-stepper">'+stageButton('prep',1,'Prepare')+stageButton('conversation',2,'Call')+stageButton('complete',3,'Complete')+'</div>'+
   '<div class="ps62-command-actions"><button class="primary" onclick="_ps62NextCustomer()">Next Customer →</button><button onclick="_call532OpenCustomer()">Open Full Profile ↗</button></div>'+
  '</section>'
 }
 function extractLegacy(){
  var html=typeof legacyRender==='function'?legacyRender():'';
  var parser=new DOMParser();
  var doc=parser.parseFromString('<div id="ps62-legacy">'+html+'</div>','text/html');
  var root=doc.getElementById('ps62-legacy');
  var dialer=root&&root.querySelector('.cl2-dialer');
  var center=root&&root.querySelector('.cl2-workbench > main.cl2-panel');
  return{
   dialer:dialer?dialer.outerHTML:'<aside class="cl2-panel cl2-dialer"><div class="cl2-body">Dialer unavailable.</div></aside>',
   center:center?center.outerHTML:'<main class="cl2-panel"><div class="cl2-center-body">Conversation builder unavailable.</div></main>'
  }
 }
 function prepareDialer(html){
  var parser=new DOMParser(),doc=parser.parseFromString(html,'text/html'),panel=doc.body.firstElementChild;
  if(!panel)return html;
  panel.classList.add('ps62-dialer');
  var oldHead=panel.querySelector('.cl2-panel-head');
  if(oldHead)oldHead.remove();
  var contact=panel.querySelector('.cl2-dialer-contact');
  var display=panel.querySelector('.cl2-dialer-display');
  var body=panel.querySelector('.cl2-body');
  if(contact&&display&&body&&contact.nextElementSibling!==display)body.insertBefore(contact,display);
  return panel.innerHTML
 }
 function prepareCenter(html,data){
  var parser=new DOMParser(),doc=parser.parseFromString(html,'text/html'),panel=doc.body.firstElementChild;
  if(!panel)return html;
  panel.classList.add('ps62-center');
  var active=panel.querySelector('.cl2-active-head');
  if(active)active.remove();
  var evidence=activityEvidence(data),currentStage=stage(),done=window._call532&&window._call532.completed;
  var footer='';
  if(done){
   footer='<footer class="ps62-center-footer cl592-footer" data-stage="done"><button onclick="_call532OpenCustomer()">Open Company</button><button class="primary" onclick="_ps62NextCustomer()">Next Customer →</button></footer>'
  }else if(currentStage==='prep'){
   footer='<footer class="ps62-center-footer cl592-footer" data-stage="prep"><button onclick="_call532Draft()">Save Prep</button><button class="primary" onclick="_call592Advance(\'conversation\')">Call →</button></footer>'
  }else if(currentStage==='conversation'){
   footer='<footer class="ps62-center-footer cl592-footer" data-stage="conversation"><button onclick="_call532Draft()">Save Notes</button><button class="primary" onclick="_call592Advance(\'complete\')">Complete →</button></footer>'
  }else{
   footer='<footer class="ps62-center-footer cl592-footer" data-stage="complete"><button onclick="_call532Draft()">Save Draft</button><button class="primary" onclick="_call592SaveComplete()">Save Completed Call</button><button class="good" onclick="_ps62NextCustomer()">Move to Next Customer →</button></footer>'
  }
  return'<main class="ps62-panel ps62-center">'+
   '<header class="ps62-panel-head"><div><div class="ps62-panel-title"><i>◌</i> Conversation Builder</div><div class="ps62-panel-copy">Prepare the account, run the conversation, then complete the call record.</div>'+
    '<div class="ps62-evidence"><span class="'+(evidence.call?'done':'wait')+'">Call attempt</span><span class="'+(evidence.email?'done':'wait')+'">Follow-up email</span></div></div>'+
    '<button class="ps62-panel-action" onclick="_call540GenerateTalkingPoints()">Regenerate talking points ↻</button></header>'+
   '<div class="ps62-center-body">'+panel.innerHTML+'</div>'+footer+
  '</main>'
 }
 function snapshotRow(label,value,cls){
  return'<div class="ps62-snapshot-row"><span>'+esc(label)+'</span><strong class="'+(cls||'')+'">'+esc(value)+'</strong></div>'
 }
 function context(data){
  var promo=promotion(),contact=primaryContact(data),quotes=openQuotes(data),opps=openOpps(data);
  var last=arr(data.orders)[0],top=arr(data.products)[0],quiet=daysQuiet(data),loyal=loyalty(data),queue=queueItem(data);
  var facts=[];
  if(queue)facts.push(queue.reason+' — '+clean(queue.copy));
  if(top)facts.push(top.name+' is the strongest loaded product signal with '+Math.round(n(top.units)).toLocaleString()+' units.');
  facts.push(reorderWindow(data)+'.');
  if(quotes[0])facts.push('An open quote remains active for '+money(field(quotes[0],['amount','total'],0))+'.');
  if(opps[0])facts.push('An open opportunity is valued at '+money(field(opps[0],['amount'],0))+'.');
  var currentExpected=expectedChristmas(data);
  var year=new Date().getFullYear();
  return'<aside class="ps62-panel ps62-context">'+
   '<header class="ps62-panel-head"><div><div class="ps62-panel-title"><i>♟</i> Customer Context</div><div class="ps62-panel-copy">The most useful account facts remain visible throughout the call.</div></div></header>'+
   '<div class="ps62-context-body">'+
    '<section class="ps62-context-card promo"><div class="ps62-context-kick">Current Monthly Promotion</div><h3>'+esc(promo.promotionTitle||'Monthly promotion')+'</h3><p>'+esc(promo.promotionBody||promo.promotionOffer||'Use current customer history to identify the right next need.')+'</p></section>'+
    '<section class="ps62-context-card"><div class="ps62-context-kick">Primary Contact</div><div class="ps62-contact"><div class="ps62-avatar">'+esc(initials(field(contact,['name'],'Contact')))+'</div><div><strong>'+esc(field(contact,['name'],'Not recorded'))+'</strong><span>'+esc(field(contact,['title','buyingRole'],'Role not recorded'))+'</span><span>'+esc(field(contact,['phone','mobile'],'No phone'))+'</span><span>'+esc(field(contact,['email'],'No email'))+'</span></div><div class="ps62-contact-actions"><button onclick="_call540StartDial()" title="Call">☎</button><button onclick="_call540OpenEmail()" title="Email">✉</button></div></div></section>'+
    '<section class="ps62-context-card"><div class="ps62-context-kick">Account Snapshot</div>'+
     snapshotRow('Last Order',last?(fmt(last.date)+' · '+money(last.total)):'No loaded order')+
     snapshotRow('Open Quotes',quotes.length+' · '+money(quotes.reduce(function(sum,row){return sum+n(field(row,['amount','total'],0))},0)))+
     snapshotRow('Open Opportunities',opps.length+' · '+money(opps.reduce(function(sum,row){return sum+n(field(row,['amount'],0))},0)))+
     snapshotRow('Top Purchase Category',top&&top.name||'Not identified')+
     snapshotRow('Last Contact',quiet==null?'Not recorded':quiet+' days ago')+
     snapshotRow('Loyalty Status',loyal.tier+(loyal.next!=='Top tier'?' · '+money(loyal.gap)+' to '+loyal.next:''))+
    '</section>'+
    '<section class="ps62-context-card"><div class="ps62-context-kick">Expected Christmas Order · '+year+'</div><select class="ps62-context-select" onchange="_cc547SetChristmas(\''+encodeURIComponent(window._rp2&&_rp2.rep||'')+'\',\''+encodeURIComponent(data.company)+'\','+year+',this.value,\'call-workspace-v562\')">'+
     ['Yes','No','Not answered'].map(function(value){return'<option '+(currentExpected===value?'selected':'')+'>'+value+'</option>'}).join('')+
    '</select><p>July–October answers feed the November calling campaign.</p></section>'+
    '<section class="ps62-context-card"><div class="ps62-context-kick">Talking Points & Quick Facts</div>'+
     facts.slice(0,5).map(function(fact){return'<div class="ps62-fact"><i>✓</i><span>'+esc(fact)+'</span></div>'}).join('')+
     '<button class="ps62-panel-action" style="margin-top:7px" onclick="_call532OpenCustomer()">View all notes & history →</button></section>'+
   '</div></aside>'
 }
 function queuePreview(data){
  var queue=arr(data.g&&data.g.calls),index=queue.findIndex(function(item){return norm(item.customer)===norm(data.company)});
  if(index<0)index=0;
  var visible=[];
  for(var i=0;i<Math.min(3,queue.length);i++)visible.push(queue[(index+i)%queue.length]);
  return'<section class="ps62-queue-strip"><div class="ps62-queue-label">Queue Preview<strong>Up next</strong></div>'+
   '<div class="ps62-queue-cards">'+(visible.length?visible.map(function(item,position){
    var active=norm(item.customer)===norm(data.company);
    return'<article class="ps62-qcard '+(active?'on':'')+'" onclick="_call540SelectCompany(\''+encodeURIComponent(item.customer)+'\')"><span class="ps62-qrank">'+(item.rank||position+1)+'</span><div><div class="ps62-qname">'+esc(item.customer)+'</div><div class="ps62-qcopy">'+esc(item.reason||item.copy||'Customer call')+'</div></div><span class="ps62-qdue">'+esc(item.due?fmt(item.due):'Due today')+'</span></article>'
   }).join(''):'<div class="ps62-qcard"><div class="ps62-qname">No ranked queue is loaded.</div></div>')+'</div>'+
   '<button class="ps62-view-queue" onclick="_rp2Go(\'home\')">View full queue →</button></section>'
 }
 function render(){
  try{
   var data=current(),legacy=extractLegacy();
   return'<div class="ps62-shell">'+command(data)+'<div class="ps62-workbench">'+
    '<aside class="ps62-panel ps62-dialer"><header class="ps62-panel-head"><div><div class="ps62-panel-title"><i>☎</i> Dialer</div><div class="ps62-panel-copy">Contact, call controls, outcome, and follow-up tools.</div></div></header>'+prepareDialer(legacy.dialer)+'</aside>'+
    prepareCenter(legacy.center,data)+context(data)+'</div>'+queuePreview(data)+'</div>'
  }catch(error){
   console.error('[Project Simplify Call Workspace v562]',error);
   return'<div class="ps62-shell"><section class="ps62-command"><div><div class="ps62-company-line"><h1>Call Workspace</h1></div><div class="ps62-command-pills"><span class="ps62-pill quiet">Compatibility issue</span></div></div></section><section class="ps62-panel"><div class="ps62-context-card"><h3>The call workspace could not render.</h3><p>'+esc(error&&error.message||String(error))+'</p></div></section></div>'
  }
 }
 function rerender(){
  if(window._rp2&&_rp2.page==='call'){
   var page=document.getElementById('rp2-page');
   if(page)page.innerHTML=render();
   try{if(typeof window._rp2CallDraw==='function')window._rp2CallDraw()}catch(error){}
  }
 }
 window._rp2CallV1=render;
 window._ps62NextCustomer=function(){
  if(typeof baseNext==='function')baseNext.apply(this,arguments);
  setTimeout(rerender,0)
 };
 window._ps62CompleteCall=function(){
  try{if(typeof window._call532Draft==='function')window._call532Draft()}catch(error){}
  var result=typeof baseComplete==='function'?baseComplete.apply(this,arguments):undefined;
  setTimeout(rerender,0);
  return result
 };
 if(typeof baseSendEmail==='function'){
  window._call540SendEmail=function(){
   var result=baseSendEmail.apply(this,arguments);
   setTimeout(rerender,0);
   return result
  }
 }
 if(typeof baseStartDial==='function'){
  window._call540StartDial=function(){
   var result=baseStartDial.apply(this,arguments);
   setTimeout(rerender,400);
   return result
  }
 }
 if(typeof baseEndDial==='function'){
  window._call540EndDial=function(){
   var result=baseEndDial.apply(this,arguments);
   setTimeout(rerender,0);
   return result
  }
 }
 function keepSimplified(name,base,delay){
  if(typeof base!=='function')return;
  window[name]=function(){
   var result=base.apply(this,arguments);
   setTimeout(rerender,delay||0);
   return result
  }
 }
 keepSimplified('_call540GoTab',baseGoTab,0);
 keepSimplified('_call540PrepTabGo',basePrepTab,0);
 keepSimplified('_call540Toggle',baseToggle,0);
 keepSimplified('_call540Clear',baseClear,0);
 keepSimplified('_call540SelectAll',baseSelectAll,0);
 keepSimplified('_call540SelectArtworkMethod',baseSelectArtwork,0);
 keepSimplified('_call540Filter',baseFilter,0);
 keepSimplified('_call540GenerateTalkingPoints',baseGenerate,0);
 keepSimplified('_call540SelectCompany',baseSelectCompany,0);
 keepSimplified('_call540ContactChanged',baseContactChanged,0);
 keepSimplified('_call532ResetCurrent',baseResetCurrent,0);
 var oldAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof oldAfter==='function'?oldAfter.apply(this,arguments):undefined;
  if(window._rp2&&_rp2.page==='call')setTimeout(rerender,0);
  return result
 };
 window.TCP_PROJECT_SIMPLIFY_CALL_V562={
  version:'v562',
  render:render,
  current:current,
  context:context,
  command:command,
  queuePreview:queuePreview,
  activityEvidence:activityEvidence,
  loyalty:loyalty
 };
 setTimeout(function(){
  if(window._rp2&&_rp2.page==='call')rerender()
 },0)
})();
