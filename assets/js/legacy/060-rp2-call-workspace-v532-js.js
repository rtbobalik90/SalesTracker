
(function(){
 var CRM='tcp_rp_company_crm_v510',ACTION='tcp_rp_action_center_v504',STORE='tcp_rp_call_workspace_v532';
 window._call532=window._call532||{company:'',stage:'prep',startedAt:'',elapsed:0,paused:false,completed:null,draft:{}};
 window._call532TimerHandle=window._call532TimerHandle||null;

 function n(v){return Number(v)||0}
 function arr(v){if(Array.isArray(v))return v;if(!v)return[];try{if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null})}catch(e){}return[]}
 function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/g,'')}
 function esc(v){return typeof _rp2Esc==='function'?_rp2Esc(String(v==null?'':v)):String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function money(v){return typeof _rp2$==='function'?_rp2$(n(v)):'$'+n(v).toLocaleString()}
 function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
 function field(o,names,def){for(var i=0;i<names.length;i++){var v=o&&o[names[i]];if(v!=null&&String(v).trim()!=='')return v}return def==null?'':def}
 function dt(v){if(v==null||v==='')return null;try{var d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);if(!isNaN(d.getTime()))return d}catch(e){}return null}
 function iso(v){var d=dt(v);return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):''}
 function fmt(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
 function fmtTime(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—'}
 function id(prefix){return(prefix||'call')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
 function duration(sec){sec=Math.max(0,Math.floor(n(sec)));var m=Math.floor(sec/60),s=sec%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
 function val(idv){var e=document.getElementById(idv);return e?clean(e.value):''}
 function checked(idv){var e=document.getElementById(idv);return !!(e&&e.checked)}
 function setValue(idv,v){var e=document.getElementById(idv);if(e)e.value=v==null?'':v}
 function saveStore(s){localStorage.setItem(STORE,JSON.stringify(s))}
 function store(){var s=read(STORE);if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};s.reps[_rp2.rep]=s.reps[_rp2.rep]||{drafts:{},history:[],events:[]};return s}
 function repStore(){var s=store();return{s:s,data:s.reps[_rp2.rep]}}
 function desktop(){
  try{if(typeof window._rp2DesktopBuild==='function')return window._rp2DesktopBuild()}catch(e){console.warn('[v532 desktop context]',e)}
  return{customers:{},calls:[],quotes:[],opps:[],business:{rows:[],lanes:{overdue:[],today:[],customer:[],internal:[],upcoming:[]}},perf:{}}
 }
 function activeQueueItem(g,company){return arr(g.calls).filter(function(x){return norm(x.customer)===norm(company)})[0]||null}
 function customer(g,company){return(g.customers||{})[norm(company)]||null}
 function allCompanies(g){
  var rows={},out=[];
  Object.keys(g.customers||{}).forEach(function(k){var c=g.customers[k];if(c&&c.name)rows[norm(c.name)]=c.name});
  arr(g.calls).forEach(function(c){if(c.customer)rows[norm(c.customer)]=c.customer});
  Object.keys(rows).forEach(function(k){out.push(rows[k])});return out.sort()
 }
 function ensureCurrent(g){
  var names=allCompanies(g),current=clean(window._call532.company);
  if(current&&names.some(function(x){return norm(x)===norm(current)}))return current;
  if(g.calls&&g.calls[0])current=g.calls[0].customer;
  else current=names[0]||'';
  window._call532.company=current;loadDraft(current);return current
 }
 function currentSeconds(){
  var base=n(window._call532.elapsed);
  if(window._call532.stage==='active'&&!window._call532.paused&&window._call532.startedAt){
   var start=dt(window._call532.startedAt);if(start)base+=Math.max(0,Math.floor((Date.now()-start.getTime())/1000))
  }
  return base
 }
 function saveDraftFromDom(){
  var company=clean(window._call532.company);if(!company)return;
  var d={
   company:company,contactId:val('cl1-contact'),outcome:val('cl1-outcome'),sentiment:val('cl1-sentiment'),
   callType:val('cl1-call-type'),secondaryPurpose:val('cl1-secondary-purpose'),
   accountUpdateCompleted:checked('cl1-account-update-complete'),
   industryTags:(typeof window._call537CollectIndustries==='function'?window._call537CollectIndustries():[]),
   subject:val('cl1-subject'),notes:val('cl1-notes'),transcript:val('cl1-transcript'),
   products:val('cl1-products'),objections:val('cl1-objections'),nextAction:val('cl1-next-action'),nextDate:val('cl1-next-date'),
   createFollowUp:checked('cl1-create-followup'),createOpportunity:checked('cl1-create-opportunity'),
   opportunityTitle:val('cl1-opportunity-title'),opportunityValue:val('cl1-opportunity-value'),
   opportunityStage:val('cl1-opportunity-stage'),opportunityClose:val('cl1-opportunity-close'),
   quoteHandoff:checked('cl1-quote-handoff'),updatedAt:new Date().toISOString()
  };
  window._call532.draft=d;
  var b=repStore();b.data.drafts[norm(company)]=d;saveStore(b.s)
 }
 function loadDraft(company){
  var b=repStore(),d=b.data.drafts[norm(company)]||{};
  window._call532.draft=d;
  if(window._call532.stage==='complete')window._call532.stage='prep';
  window._call532.completed=null
 }
 function clearDraft(company){
  var b=repStore();delete b.data.drafts[norm(company)];saveStore(b.s);window._call532.draft={}
 }
 function crm(){
  var s=read(CRM);if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};s.reps[_rp2.rep]=s.reps[_rp2.rep]||{accounts:{}};return s
 }
 function account(s,company){
  var rep=s.reps[_rp2.rep],key=norm(company),a=rep.accounts[key];
  if(!a){a={profile:{name:company,owner:_rp2.rep,lifecycle:'Customer',status:'Active',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},contacts:[],opportunities:[],quotes:[],activities:[],notes:[],files:[]};rep.accounts[key]=a}
  a.profile=a.profile||{name:company,owner:_rp2.rep};a.contacts=arr(a.contacts);a.opportunities=arr(a.opportunities);a.quotes=arr(a.quotes);a.activities=arr(a.activities);a.notes=arr(a.notes);a.files=arr(a.files);return{key:key,data:a,rep:rep}
 }
 function contactById(c,idv){return arr(c&&c.contacts).filter(function(x){return String(field(x,['id','contactId'],'')||'')===String(idv||'')})[0]||null}
 function callQuestions(c,g){
  var qs=[],quotes=arr(g.quotes).filter(function(q){return norm(q.company)===norm(c.name)}),opps=arr(g.opps).filter(function(o){return norm(o.company)===norm(c.name)}),products=Object.keys(c.products||{}).sort(function(a,b){return n(c.products[b])-n(c.products[a])});
  if(quotes.length)qs.push('What feedback or approval is still needed to move '+quotes[0].number+' forward?');
  if(opps.length)qs.push('What must happen next for '+opps[0].title+' to stay on schedule?');
  if(products.length)qs.push('How are the '+products[0]+' items working, and is another group or season approaching?');
  if(!c.primary)qs.push('Who should own routine communication and final buying decisions for this account?');
  qs.push('What is changing in the business that could create a uniform, apparel, safety, event, or recognition need?');
  qs.push('Before we finish, what exact next step and date should we agree on?');
  return qs.slice(0,6)
 }
 function context(g,company){
  var c=customer(g,company)||{name:company,profile:{},contacts:[],orders:[],activities:[],products:{},categories:{}},quotes=arr(g.quotes).filter(function(q){return norm(q.company)===norm(company)}),opps=arr(g.opps).filter(function(o){return norm(o.company)===norm(company)}),queue=activeQueueItem(g,company),products=Object.keys(c.products||{}).sort(function(a,b){return n(c.products[b])-n(c.products[a])});
  return{c:c,quotes:quotes,opps:opps,queue:queue,products:products,questions:callQuestions(c,g)}
 }
 function requiredNext(outcome){
  return !/not interested|wrong contact|completed.*no follow|do not contact/i.test(String(outcome||''))
 }
 function markSourceTaskComplete(taskId,outcome,note,nextDate){
  if(!taskId)return;
  var s=read(ACTION);if(!s||s.version!==1||!s.reps||!s.reps[_rp2.rep])return;
  var d=s.reps[_rp2.rep],task=arr(d.manual).filter(function(t){return String(t.id)===String(taskId)})[0];if(!task)return;
  d.state=d.state||{};d.events=arr(d.events);
  d.state[taskId]=Object.assign({},d.state[taskId]||{},{status:'completed',completedAt:new Date().toISOString(),result:outcome,note:note,nextFollowUp:nextDate||''});
  d.events.push({type:'complete',taskId:taskId,title:task.title,customer:task.customer||'',at:new Date().toISOString(),result:outcome});
  localStorage.setItem(ACTION,JSON.stringify(s))
 }
 function createFollowUp(company,contact,activity,draft){
  if(!draft.createFollowUp||!draft.nextDate||!draft.nextAction)return null;
  var s=read(ACTION);if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};s.reps[_rp2.rep]=s.reps[_rp2.rep]||{manual:[],state:{},events:[]};var d=s.reps[_rp2.rep];d.manual=arr(d.manual);d.state=d.state||{};d.events=arr(d.events);
  var key='call-followup:'+norm(company)+':'+iso(draft.nextDate)+':'+norm(draft.nextAction),dup=d.manual.some(function(t){var st=d.state[t.id]||{};return t.callWorkspaceKey===key&&st.status!=='completed'});
  if(dup)return null;
  var t={id:id('manual'),source:'call-workspace',category:'followup',tone:'info',score:175,title:'Follow up with '+(contact&&contact.name||company),why:'Scheduled from the call outcome: '+draft.outcome,action:draft.nextAction,measure:'Complete the promised follow-up and record the result.',dueDate:draft.nextDate,customer:company,contactId:contact&&field(contact,['id','contactId'],'')||'',contactName:contact&&contact.name||'',page:'call',callWorkspaceKey:key,activityId:activity.id};
  d.manual.push(t);d.events.push({type:'create',taskId:t.id,title:t.title,customer:company,at:new Date().toISOString()});localStorage.setItem(ACTION,JSON.stringify(s));return t
 }
 function createOpportunity(a,company,contact,draft){
  if(!draft.createOpportunity)return null;
  var title=clean(draft.opportunityTitle)||('Opportunity from call · '+company),amount=n(draft.opportunityValue),stamp=new Date().toISOString();
  var o={id:id('opp'),source:'local',title:title,stage:clean(draft.opportunityStage)||'Discovery',amount:amount,probability:clean(draft.opportunityStage)==='Quote Sent'?45:25,expectedClose:draft.opportunityClose||'',nextStep:draft.nextAction||'Define the next customer action.',nextStepDate:draft.nextDate||'',contactId:contact&&field(contact,['id','contactId'],'')||'',contactName:contact&&contact.name||'',products:draft.products||'',notes:'Created from Call Workspace. Outcome: '+draft.outcome+(draft.notes?' · '+draft.notes:''),createdAt:stamp,updatedAt:stamp,history:[{type:'created-from-call',date:stamp,activityId:a.id}]};
  a.opportunities.push(o);return o
 }
 function quoteHandoff(company,draft,activity){
  window._rp2DealDeskTab='register';_rp2Go('dealdesk');
  setTimeout(function(){try{
   if(typeof window._rp2DealDeskNew==='function')window._rp2DealDeskNew();
   setTimeout(function(){
    function setv(idv,value){var e=document.getElementById(idv);if(e)e.value=value==null?'':value}
    setv('dd3-f-company',company);setv('dd3-f-title',(draft.products?'Quote · '+draft.products:'Quote from call · '+company));
    var notes='Prepared from Call Workspace activity '+activity.id+'. Outcome: '+draft.outcome+'. '+(draft.notes||'')+(draft.nextAction?' Next step: '+draft.nextAction+' '+(draft.nextDate||'')+'.':'')+' Verify products, quantities, pricing, decoration, artwork, production timing, shipping, and customer in-hands date before sending.';
    setv('dd3-f-notes',notes);setv('dd3-f-description',notes)
   },35)
  }catch(e){console.warn('[v532 quote handoff]',e)}},35)
 }
 function saveCall(){
  saveDraftFromDom();
  var g=desktop(),company=clean(window._call532.company),ctx=context(g,company),draft=window._call532.draft||{},contact=contactById(ctx.c,draft.contactId)||ctx.c.primary||ctx.c.contacts&&ctx.c.contacts[0]||null;
  var errors=[];
  if(!company)errors.push('Choose a company.');
  if(!draft.callType)errors.push('Choose a call type.');
  if(!draft.outcome)errors.push('Choose a call outcome.');
  if(requiredNext(draft.outcome)&&(!draft.nextAction||!draft.nextDate))errors.push('Record the next action and date, or choose a no-follow-up outcome.');
  if(draft.createOpportunity&&!clean(draft.opportunityTitle))draft.opportunityTitle='Opportunity from call · '+company;
  if(errors.length){alert(errors.join('\n'));return false}
  var s=crm(),a=account(s,company),stamp=new Date().toISOString(),seconds=currentSeconds();
  var activity={id:id('act'),source:'call-workspace',type:'Call',callType:draft.callType||'',secondaryPurpose:draft.secondaryPurpose||'',accountUpdateCompleted:!!draft.accountUpdateCompleted,accountUpdateCompletionSource:(draft.callType==='Account Updating Call'?(draft.accountUpdateCompleted?'rep-confirmed':'not-counted'):'not-applicable'),industryTags:arr(draft.industryTags),subject:draft.subject||('Call with '+(contact&&contact.name||company)),detail:draft.notes||'',transcript:draft.transcript||'',outcome:draft.outcome,sentiment:draft.sentiment||'Unknown',productsDiscussed:draft.products||'',objections:draft.objections||'',date:stamp,createdAt:stamp,updatedAt:stamp,nextStep:draft.nextAction||'',nextDate:draft.nextDate||'',contactId:contact&&field(contact,['id','contactId'],'')||'',contactName:contact&&contact.name||'',durationSeconds:seconds,phone:contact&&field(contact,['phone','mobile','phoneNumber'],'')||'',email:contact&&field(contact,['email'],'')||'',callStatus:'completed',prepSelections:(typeof window._call540SelectionSnapshot==='function'?window._call540SelectionSnapshot():null),talkingPoints:(typeof window._call540TalkingPointSnapshot==='function'?window._call540TalkingPointSnapshot():[]),monthlyPromotion:(typeof window._call540PromotionSnapshot==='function'?window._call540PromotionSnapshot():null)};
  a.data.activities.push(activity);
  if(contact){
   var cid=String(field(contact,['id','contactId'],'')||''),idx=a.data.contacts.findIndex(function(x){return String(field(x,['id','contactId'],'')||'')===cid});
   if(idx>=0){a.data.contacts[idx].lastTouch=stamp;if(draft.nextDate)a.data.contacts[idx].nextTouch=draft.nextDate;a.data.contacts[idx].updatedAt=stamp}
  }
  var existingIndustryTags=arr(a.data.profile.industryTags);
  activity.industryTags=existingIndustryTags.slice();
  activity.industryManagedAtCompanyLevel=true;
  if(draft.callType==='Account Updating Call'&&draft.accountUpdateCompleted){
   a.data.profile.lastAccountUpdateAt=stamp;
   a.data.profile.lastAccountUpdateOutcome=draft.outcome;
   a.data.profile.lastAccountUpdateRep=_rp2.rep;
   a.data.profile.lastAccountUpdateActivityId=activity.id;
   a.data.profile.accountUpdateQuarter=(Math.floor(new Date(stamp).getMonth()/3)+1);
  }
  var opportunity=createOpportunity(a.data,company,contact,draft);
  a.data.profile.updatedAt=stamp;s.reps[_rp2.rep]=a.rep;localStorage.setItem(CRM,JSON.stringify(s));
  var follow=createFollowUp(company,contact,activity,draft),queue=ctx.queue;
  var shouldCloseSource=draft.callType!=='Account Updating Call'||!!draft.accountUpdateCompleted;
  if(shouldCloseSource)markSourceTaskComplete(queue&&queue.taskId,draft.outcome,draft.notes,draft.nextDate);
  var b=repStore();b.data.history=arr(b.data.history);b.data.events=arr(b.data.events);b.data.history.unshift({id:activity.id,company:company,contactName:activity.contactName,callType:activity.callType,secondaryPurpose:activity.secondaryPurpose,accountUpdateCompleted:activity.accountUpdateCompleted,outcome:activity.outcome,durationSeconds:seconds,nextAction:activity.nextStep,nextDate:activity.nextDate,createdAt:stamp,opportunityId:opportunity&&opportunity.id||'',followUpTaskId:follow&&follow.id||''});if(b.data.history.length>150)b.data.history=b.data.history.slice(0,150);b.data.events.push({type:'call-completed',activityId:activity.id,company:company,at:stamp});delete b.data.drafts[norm(company)];saveStore(b.s);
  window._call532.elapsed=seconds;window._call532.startedAt='';window._call532.paused=false;window._call532.stage='complete';window._call532.completed={activity:activity,follow:follow,opportunity:opportunity,quoteHandoff:!!draft.quoteHandoff};stopTimer();
  try{window._cw4DirectoryCache=null;window._cw4ProfileCache={}}catch(e){}
  rerender();
  if(typeof window._at537AfterCall==='function')setTimeout(function(){window._at537AfterCall({activity:activity,draft:draft,company:company,contact:contact,queue:queue,follow:follow,opportunity:opportunity})},90);
  if(draft.quoteHandoff)setTimeout(function(){quoteHandoff(company,draft,activity)},160);
  return true
 }
 function formOptions(list,value,labelFn){return list.map(function(x){var v=String(field(x,['id','contactId'],'')||''),label=labelFn?labelFn(x):clean(field(x,['name'],'Contact'));return'<option value="'+esc(v)+'" '+(String(value||'')===v?'selected':'')+'>'+esc(label)+'</option>'}).join('')}
 function queueHtml(g,current){
  if(!g.calls.length)return'<div class="cl1-empty"><strong>No ranked calls</strong>Create a call or follow-up task, add a quote next step, or open a customer directly.</div>';
  return g.calls.map(function(c){return'<div class="cl1-queue-card '+(norm(c.customer)===norm(current)?'on':'')+'" onclick="_call532Select(\''+encodeURIComponent(c.customer)+'\')"><div class="cl1-queue-top"><div><div class="cl1-queue-company">'+esc(c.customer)+'</div><div class="cl1-queue-contact">'+esc(c.contact||'Primary contact not recorded')+'</div></div><div class="cl1-rank">#'+c.rank+'</div></div><div class="cl1-queue-reason"><strong style="color:#dce5ef">'+esc(c.reason)+'</strong><br>'+esc(c.copy)+'</div><div class="cl1-queue-meta"><span>'+esc(c.source)+'</span><span>'+esc(c.due?fmt(c.due):'No due date')+'</span></div></div>'}).join('')
 }
 function contextHtml(g,ctx){
  var c=ctx.c||{},primary=c.primary||{},orders=arr(c.orders),last=orders[0],quotes=ctx.quotes,opps=ctx.opps,products=ctx.products;
  return'<div class="cl1-context-card"><span>Primary relationship</span><strong>'+esc(field(primary,['name'],'Not recorded'))+'</strong><p>'+esc([field(primary,['title','buyingRole'],''),field(primary,['phone','mobile'],''),field(primary,['email'],'')].filter(Boolean).join(' · ')||'Add contact details in the customer workspace.')+'</p></div>'
   +'<div class="cl1-context-card"><span>Recent account context</span><strong>Last contact '+fmt(c.lastContactDate)+'</strong><p>'+(c.lastActivity?esc(field(c.lastActivity,['subject','type','detail'],'Recent activity')):'No dated customer activity is loaded.')+'</p><div class="cl1-context-list"><div class="cl1-context-row"><strong>Last order</strong><span>'+(last?esc(field(last,['orderNum','invoiceNumber'],'Order'))+' · '+fmt(field(last,['orderDate','date'],'')||c.lastOrderDate)+' · '+money(field(last,['total','amount'],0)):'No completed order record')+'</span></div><div class="cl1-context-row"><strong>Open quotes</strong><span>'+(quotes[0]?esc(quotes[0].number+' · '+money(quotes[0].amount)+' · '+quotes[0].status):'No active quote')+'</span></div><div class="cl1-context-row"><strong>Open opportunities</strong><span>'+(opps[0]?esc(opps[0].title+' · '+money(opps[0].amount)+' · '+opps[0].stage):'No active opportunity')+'</span></div></div></div>'
   +'<div class="cl1-context-card"><span>Top purchase signals</span><strong>'+esc(products[0]||'No detailed product history')+'</strong><p>'+(products[0]?n(c.products[products[0]]).toLocaleString()+' units in loaded line-item history.':'Upload detailed line-item reports to build product context.')+'</p><div class="cl1-context-list">'+products.slice(0,4).map(function(p){return'<div class="cl1-context-row"><strong>'+esc(p)+'</strong><span>'+n(c.products[p]).toLocaleString()+' units</span></div>'}).join('')+'</div></div>'
   +'<div class="cl1-context-card"><span>Suggested questions</span><div class="cl1-context-list">'+ctx.questions.map(function(q){return'<div class="cl1-question">• '+esc(q)+'</div>'}).join('')+'</div></div>'
   +'<div class="cl1-tech-note"><strong>Telephony integrity:</strong> this standalone workspace can open a phone link, run a local timer, and store notes. Live carrier dialing, automatic recording, and speech-to-text are not connected.</div>'
 }
 function completedHtml(company){
  var x=window._call532.completed;if(!x)return'';
  return'<div class="cl1-success"><strong>Call saved to '+esc(company)+'</strong><p>Activity '+esc(x.activity.id)+' was added to the customer timeline.'+(x.follow?' A dated follow-up was added to Today’s Business.':'')+(x.opportunity?' A new opportunity was added to the customer pipeline.':'')+(x.quoteHandoff?' The Deal Desk handoff is opening.':'')+'</p><div class="cl1-actions" style="margin-top:12px"><button class="cl1-btn primary" onclick="_call532Next()">Next call</button><button class="cl1-btn" onclick="_call532OpenCustomer()">Open company</button><button class="cl1-btn" onclick="_call532ResetCurrent()">Log another call</button></div></div>'
 }
 function formHtml(g,ctx){
  var company=ctx.c.name||window._call532.company,d=window._call532.draft||{},contacts=arr(ctx.c.contacts),selected=d.contactId||field(ctx.c.primary||{},['id','contactId'],'')||field(contacts[0]||{},['id','contactId'],'')||'',queue=ctx.queue||{};
  if(window._call532.stage==='complete')return'<div class="cl1-form">'+completedHtml(company)+'</div>';
  return'<div class="cl1-form" oninput="_call532Draft()" onchange="_call532Draft()">'
   +(typeof window._call537ClassificationHtml==='function'?window._call537ClassificationHtml(ctx,d):'')
   +'<section class="cl1-section"><div class="cl1-section-title">Call setup</div><div class="cl1-section-copy">Confirm who you are calling and why before opening the phone link.</div><div class="cl1-grid-2"><div class="cl1-field"><label>Contact</label><select id="cl1-contact"><option value="">No specific contact</option>'+formOptions(contacts,selected,function(c){return clean(field(c,['name'],'Contact'))+' · '+clean(field(c,['title','buyingRole'],'Role not recorded'))})+'</select></div><div class="cl1-field"><label>Call subject</label><input id="cl1-subject" value="'+esc(d.subject||queue.reason||('Customer call · '+company))+'"></div></div><div class="cl1-card-actions" style="margin-top:10px"><button type="button" class="cl1-btn primary" onclick="_call532Begin()">'+(window._call532.stage==='active'?'Call in progress':'Begin call')+'</button><button type="button" class="cl1-btn" onclick="_call532Phone()">Open phone</button><button type="button" class="cl1-btn" onclick="_call532Email()">Open email</button><button type="button" class="cl1-btn purple" onclick="_call532OpenCustomer()">Company profile</button></div></section>'
   +'<section class="cl1-section"><div class="cl1-section-title">Conversation record</div><div class="cl1-section-copy">Use the transcript area for manually pasted speech-to-text or key conversation detail. No recording is generated by this file.</div><div class="cl1-grid-2"><div class="cl1-field"><label>Conversation notes</label><textarea id="cl1-notes" placeholder="What did the customer say? What did you learn?">'+esc(d.notes||'')+'</textarea></div><div class="cl1-field"><label>Transcript / detailed notes</label><textarea id="cl1-transcript" placeholder="Paste transcript text or preserve detailed call notes here.">'+esc(d.transcript||'')+'</textarea></div></div><div class="cl1-grid-2"><div class="cl1-field"><label>Products or programs discussed</label><textarea id="cl1-products" placeholder="Products, quantities, programs, timing, or use case">'+esc(d.products||'')+'</textarea></div><div class="cl1-field"><label>Objections / decision barriers</label><textarea id="cl1-objections" placeholder="Price, timing, artwork, inventory, approval, competition, or other barrier">'+esc(d.objections||'')+'</textarea></div></div></section>'
   +'<section class="cl1-section"><div class="cl1-section-title">Outcome and next commitment</div><div class="cl1-section-copy">A next action and date are required unless the outcome explicitly closes the follow-up loop.</div><div class="cl1-grid-2"><div class="cl1-field"><label>Call outcome *</label><select id="cl1-outcome"><option value="">Choose outcome</option>'+['Connected – follow-up required','Connected – quote discussed','Order expected','Sample requested','Left voicemail','No answer','Wrong contact','Not interested','Completed – no follow-up'].map(function(x){return'<option '+(d.outcome===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div><div class="cl1-field"><label>Customer sentiment</label><select id="cl1-sentiment">'+['Unknown','Positive','Neutral','Concerned','Frustrated'].map(function(x){return'<option '+((d.sentiment||'Unknown')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div></div><div class="cl1-grid-2"><div class="cl1-field"><label>Next action</label><input id="cl1-next-action" value="'+esc(d.nextAction||'')+'" placeholder="What must happen next?"></div><div class="cl1-field"><label>Next action date</label><input id="cl1-next-date" type="date" value="'+esc(d.nextDate||'')+'"></div></div><label class="cl1-check"><input id="cl1-create-followup" type="checkbox" '+(d.createFollowUp!==false?'checked':'')+'> Create the dated follow-up in Today’s Business when the call is completed.</label></section>'
   +'<section class="cl1-section"><div class="cl1-section-title">Sales handoff</div><div class="cl1-section-copy">Create an opportunity only when the call identified qualified future business. Quote handoff prepares Deal Desk; it does not send a quote.</div><div class="cl1-grid-2"><label class="cl1-check"><input id="cl1-create-opportunity" type="checkbox" '+(d.createOpportunity?'checked':'')+'> Create an opportunity from this call.</label><label class="cl1-check"><input id="cl1-quote-handoff" type="checkbox" '+(d.quoteHandoff?'checked':'')+'> Open a prepared Deal Desk quote after saving.</label></div><div class="cl1-grid-3"><div class="cl1-field"><label>Opportunity title</label><input id="cl1-opportunity-title" value="'+esc(d.opportunityTitle||'')+'" placeholder="Program or business need"></div><div class="cl1-field"><label>Estimated value</label><input id="cl1-opportunity-value" type="number" min="0" step="1" value="'+esc(d.opportunityValue||'')+'"></div><div class="cl1-field"><label>Stage</label><select id="cl1-opportunity-stage">'+['New Opportunity','Discovery','Product Selection','Quote in Progress','Quote Sent','Customer Review'].map(function(x){return'<option '+((d.opportunityStage||'Discovery')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div></div><div class="cl1-field" style="margin-top:8px"><label>Expected close date</label><input id="cl1-opportunity-close" type="date" value="'+esc(d.opportunityClose||'')+'"></div></section>'
   +'</div>'
 }
 function render(){
  var g=desktop(),company=ensureCurrent(g),ctx=context(g,company),queue=activeQueueItem(g,company),c=ctx.c,stage=window._call532.stage||'prep',completedToday=0;
  var b=repStore();arr(b.data.history).forEach(function(h){if(iso(h.createdAt)===iso(new Date()))completedToday++});
  var title=stage==='active'?'Call in progress':stage==='complete'?'Call completed':'Prepare the conversation';
  var hero='<div class="cl1-hero"><div class="cl1-hero-grid"><div><div class="cl1-kick">CALL WORKSPACE 1.0 · CUSTOMER CONVERSATION OPERATING SYSTEM · BUILD v532</div><div class="cl1-title">'+esc(company||'Choose a customer')+'</div><div class="cl1-copy">Prepare from the customer record, run the conversation, capture the outcome, and create the next customer action without moving across multiple centers.</div><div class="cl1-pills"><span class="cl1-pill info">'+g.calls.length+' ranked calls</span><span class="cl1-pill good">'+completedToday+' completed today</span><span class="cl1-pill warn">'+(g.business&&g.business.lanes&&g.business.lanes.overdue?g.business.lanes.overdue.length:0)+' overdue customer actions</span><span class="cl1-pill">'+(queue?esc(queue.source):'Direct customer call')+'</span></div></div><div class="cl1-hero-card"><div><span>Current stage</span><strong>'+esc(title)+'</strong><p>'+(queue?esc(queue.reason+' · '+queue.copy):'This call was opened directly from the customer record or Call Workspace.')+'</p></div><div class="cl1-progress"><i style="width:'+(stage==='complete'?100:stage==='active'?66:33)+'%"></i></div></div></div></div>';
  var queuePanel='<aside class="cl1-panel"><div class="cl1-panel-head"><div><div class="cl1-kick">CALL QUEUE</div><div class="cl1-panel-title">Ranked conversations</div><div class="cl1-panel-copy">Due work, quotes, opportunities, and account silence drive the order.</div></div><span class="cl1-count">'+g.calls.length+'</span></div><div class="cl1-panel-body cl1-scroll">'+queueHtml(g,company)+'</div></aside>';
  var active='<main class="cl1-panel"><div class="cl1-active-head"><div class="cl1-active-grid"><div><div class="cl1-kick">ACTIVE CUSTOMER</div><div class="cl1-active-name">'+esc(company||'No customer selected')+'</div><div class="cl1-active-sub">'+esc([field(c.primary||{},['name'],''),field(c.primary||{},['phone','mobile'],''),queue&&queue.reason].filter(Boolean).join(' · ')||'Select a customer from the queue.')+'</div><div class="cl1-stagebar"><div class="cl1-stage '+(stage==='prep'?'on':'')+'">Prepare</div><div class="cl1-stage '+(stage==='active'?'on':'')+'">Conversation</div><div class="cl1-stage '+(stage==='complete'?'on':'')+'">Complete</div></div></div><div class="cl1-timer"><span>Call timer</span><strong id="cl1-timer">'+duration(currentSeconds())+'</strong><div class="cl1-card-actions" style="justify-content:center;margin-top:8px">'+(stage==='active'?'<button class="cl1-mini" onclick="_call532Pause()">'+(window._call532.paused?'Resume':'Pause')+'</button>':'')+'</div></div></div></div>'+formHtml(g,ctx)+(stage!=='complete'?'<div class="cl1-completion"><div class="cl1-completion-copy"><strong>Complete the loop</strong>Save the call only after the outcome and required next commitment are recorded.</div><div class="cl1-card-actions"><button class="cl1-btn" onclick="_call532Draft()">Save draft</button><button class="cl1-btn risk" onclick="_call532ResetCurrent()">Clear</button><button class="cl1-btn primary" onclick="_call532Complete()">Complete call</button></div></div>':'')+'</main>';
  var right='<aside class="cl1-panel cl1-context-panel"><div class="cl1-panel-head"><div><div class="cl1-kick">CUSTOMER CONTEXT</div><div class="cl1-panel-title">What matters during the call</div><div class="cl1-panel-copy">Only recorded customer evidence is shown.</div></div><button class="cl1-mini primary" onclick="_call532OpenCustomer()">Full profile</button></div><div class="cl1-panel-body cl1-scroll">'+contextHtml(g,ctx)+'</div></aside>';
  return'<div class="cl1-shell">'+hero+'<div class="cl1-main">'+queuePanel+active+right+'</div></div>'
 }
 function rerender(){if(_rp2.page==='call'){var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2CallV1();draw()}else if(typeof window._call534Render==='function'){window._call534Render()}}
 function draw(){stopTimer();if(window._call532.stage==='active'&&!window._call532.paused){window._call532TimerHandle=setInterval(function(){var e=document.getElementById('cl1-timer');if(e)e.textContent=duration(currentSeconds())},1000)}}
 function stopTimer(){if(window._call532TimerHandle){clearInterval(window._call532TimerHandle);window._call532TimerHandle=null}}
 function installNav(){
  if(typeof RP2_NAV==='undefined')return;
  var my=RP2_NAV.filter(function(g){return g.g==='My Day'})[0];
  if(my&&!my.items.some(function(x){return x[0]==='call'}))my.items.splice(1,0,['call','Call Workspace','☎'])
 }
 window._call532Select=function(encoded){saveDraftFromDom();window._call532.company=decodeURIComponent(encoded||'');window._call532.stage='prep';window._call532.elapsed=0;window._call532.startedAt='';window._call532.paused=false;loadDraft(window._call532.company);rerender()};
 window._call532Start=function(encoded){var company=decodeURIComponent(encoded||'');window._call532.company=company;window._call532.stage='prep';window._call532.elapsed=0;window._call532.startedAt='';window._call532.paused=false;loadDraft(company);_rp2Go('call')};
 window._call532Begin=function(){saveDraftFromDom();if(window._call532.stage!=='active'){window._call532.stage='active';window._call532.startedAt=new Date().toISOString();window._call532.paused=false}rerender()};
 window._call532Pause=function(){if(window._call532.stage!=='active')return;if(!window._call532.paused){window._call532.elapsed=currentSeconds();window._call532.startedAt='';window._call532.paused=true}else{window._call532.startedAt=new Date().toISOString();window._call532.paused=false}rerender()};
 window._call532Draft=function(){saveDraftFromDom();var e=document.getElementById('cl1-save-note');if(e)e.textContent='Draft saved'};
 window._call532Complete=function(){return saveCall()};
 window._call532ResetCurrent=function(){var company=window._call532.company;clearDraft(company);stopTimer();window._call532.stage='prep';window._call532.startedAt='';window._call532.elapsed=0;window._call532.paused=false;window._call532.completed=null;rerender()};
 window._call532Next=function(){var g=desktop(),idx=g.calls.findIndex(function(x){return norm(x.customer)===norm(window._call532.company)}),next=g.calls[idx+1]||g.calls[0];if(next)window._call532Select(encodeURIComponent(next.customer));else window._call532ResetCurrent()};
 window._call532Phone=function(){saveDraftFromDom();if(typeof window._call540DialFocus==='function')return window._call540DialFocus();alert('The embedded dialer is loading.');};
 window._call532Email=function(){saveDraftFromDom();if(typeof window._call540OpenEmail==='function')return window._call540OpenEmail();alert('The embedded email composer is loading.');};
 window._call532OpenCustomer=function(){var company=window._call532.company;saveDraftFromDom();_rp2Go('customers');setTimeout(function(){if(typeof window._cw4OpenCompany==='function')window._cw4OpenCompany(encodeURIComponent(company),'relationships')},35)};
 window._rp2CallV1=function(){try{return render()}catch(e){console.error('[Call Workspace v532]',e);return'<div class="cl1-shell"><div class="cl1-hero"><div class="cl1-kick">CALL WORKSPACE 1.0 · BUILD v532 · RECOVERY MODE</div><div class="cl1-title">The call workspace hit a compatibility issue</div><div class="cl1-copy">'+esc(e&&e.message||String(e))+'</div></div></div>'}};
 window._rp2CallDraw=draw;
 window._rp2CallDiagnostics=function(){var g=desktop();return{company:window._call532.company,stage:window._call532.stage,queue:g.calls.length,history:repStore().data.history.length}};
 installNav();

 var basePage=window._rp2Page;
 window._rp2Page=function(){if(_rp2.page==='call')return window._rp2CallV1();return basePage()};
 var baseAfter=window._rp2After;
 window._rp2After=function(){if(_rp2.page==='call'){setTimeout(function(){window._rp2CallDraw()},0);return}return baseAfter()};
 var baseGo=window._rp2Go;
 window._rp2Go=function(p){if(p!=='call')stopTimer();return baseGo(p)};
 window._ud4StartCall=function(encoded){window._call532Start(encoded)};
 window._cw5Call=function(encoded){window._call532Start(encoded)};
})();
