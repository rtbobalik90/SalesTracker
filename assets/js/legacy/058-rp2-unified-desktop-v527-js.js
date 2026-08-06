
(function(){
 var ACTION='tcp_rp_action_center_v504',CRM='tcp_rp_company_crm_v510',CASES='tcp_rp_service_cases_v518',DOCS='tcp_rp_documents_v519',PRODUCTS='tcp_rp_products_v520';
 window._ud4BusinessLane=window._ud4BusinessLane||'today';
 window._ud4QuoteLane=window._ud4QuoteLane||'72';
 window._ud4PrepName=window._ud4PrepName||'';

 function n(v){return Number(v)||0}
 function arr(v){if(Array.isArray(v))return v;if(!v)return[];try{if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null})}catch(e){}return[]}
 function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/g,'')}
 function esc(v){return typeof _rp2Esc==='function'?_rp2Esc(String(v==null?'':v)):String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function money(v){return typeof _rp2$==='function'?_rp2$(n(v)):'$'+n(v).toLocaleString()}
 function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
 function field(o,names,def){for(var i=0;i<names.length;i++){var v=o&&o[names[i]];if(v!=null&&String(v).trim()!=='')return v}return def==null?'':def}
 function companyOf(o){return clean(field(o,['company','customer','account','accountName','companyName','customerName'],'')||'')}
 function repOf(o){return clean(field(o,['rep','owner','salesRep','repName','assignedRep'],'')||'')}
 function dt(v){if(v==null||v==='')return null;try{var s=String(v).trim(),d;if(/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s)){var p=s.split(/[\/\s]/),y=Number(p[2]);if(y<100)y+=2000;d=new Date(y,Number(p[0])-1,Number(p[1]),12)}else d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);if(!isNaN(d.getTime()))return d}catch(e){}return null}
 function day(v){var d=dt(v);if(!d)return null;d.setHours(12,0,0,0);return d}
 function now(){var d=window._ud4Now?new Date(window._ud4Now):new Date();d.setHours(12,0,0,0);return d}
 function diff(a,b){var x=day(a),y=day(b);return x&&y?Math.round((y-x)/86400000):null}
 function iso(v){var d=day(v);return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):''}
 function fmt(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric'}):'—'}
 function fmtFull(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
 function timeText(v){var d=dt(v);if(!d)return'Any time';var hasTime=/T\d{2}:\d{2}| \d{1,2}:\d{2}/.test(String(v));return hasTime?d.toLocaleString('en-US',{hour:'numeric',minute:'2-digit'}):'Any time'}
 function openStatus(v){return !/completed|closed|resolved|converted|declined|lost|cancelled|canceled|expired|archived|returned/i.test(String(v||''))}
 function repOkay(o,known){var r=repOf(o);if(r)return r===_rp2.rep;var c=companyOf(o);return !!(c&&known[norm(c)])}
 function bucket(key,defaults){var s=read(key);if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};return s.reps[_rp2.rep]||defaults}
 function uniq(rows,keyFn){var seen={};return rows.filter(function(x){var k=keyFn(x);if(!k||seen[k])return false;seen[k]=1;return true})}
 function sortDue(a,b){var ad=a.due?day(a.due):null,bd=b.due?day(b.due):null;return (b.score-a.score)||((ad?ad.getTime():8640000000000000)-(bd?bd.getTime():8640000000000000))}

 function customerIndex(){
  var map={};
  function ensure(name){var k=norm(name);if(!k)return null;return map[k]||(map[k]={name:name,profile:{},contacts:[],activities:[],orders:[],quotes:[],opps:[],lineItems:[],nextTouches:[]})}
  arr(S&&S.customers).forEach(function(c){var name=clean(field(c,['name','customer','company'],'')||'');if(!c||repOf(c)!==_rp2.rep||c.doNotCall||!name)return;var r=ensure(name);r.imported=c;r.profile.customerNumber=c.customerNumber||c.custId||'';r.profile.tier=c.loyalty||c.tier||'';r.profile.status=c.customerStatus||c.status||'';r.profile.phone=c.phone||'';r.profile.email=c.email||'';if(clean(c.contact))r.contacts.push({name:c.contact,phone:c.phone||'',email:c.email||'',isPrimary:true,buyingRole:'Imported contact'})});
  var crm=read(CRM),rep=crm&&crm.reps&&crm.reps[_rp2.rep],accounts=rep&&rep.accounts||{};
  Object.keys(accounts).forEach(function(k){var a=accounts[k]||{},name=clean(a.profile&&a.profile.name)||k,r=ensure(name);if(!r)return;r.profile=Object.assign({},r.profile,a.profile||{});r.contacts=r.contacts.concat(arr(a.contacts));r.activities=r.activities.concat(arr(a.activities));r.quotes=r.quotes.concat(arr(a.quotes));r.opps=r.opps.concat(arr(a.opportunities))});
  arr(S&&S.orders).forEach(function(o){var c=companyOf(o);if(o&&repOf(o)===_rp2.rep&&c&&!/quote|proposal|estimate/i.test(String(o.kind||o.orderType||o.type||'')))ensure(c).orders.push(o)});
  arr(S&&S.orderLineItems).forEach(function(x){var c=companyOf(x);if(x&&repOf(x)===_rp2.rep&&c)ensure(c).lineItems.push(x)});
  var contactPools=[S&&S.accountContacts,S&&S.customerContacts,S&&S.crmContacts,S&&S.contacts];
  contactPools.forEach(function(pool){arr(pool).forEach(function(c){var name=companyOf(c),r=repOf(c);if(!name||r&&r!==_rp2.rep)return;var row=map[norm(name)];if(row)row.contacts.push(c)})});
  var actPools=[S&&S.customerActivities,S&&S.accountActivities,S&&S.crmActivities,S&&S.activities];
  actPools.forEach(function(pool){arr(pool).forEach(function(a){var name=companyOf(a),r=repOf(a);if(!name||r&&r!==_rp2.rep)return;var row=map[norm(name)];if(row)row.activities.push(a)})});
  Object.keys(map).forEach(function(k){var r=map[k];
   r.contacts=uniq(r.contacts,function(c){return clean(field(c,['id','contactId','email','name'],'')||'')});
   r.primary=r.contacts.filter(function(c){return c.isPrimary||/primary/i.test(String(field(c,['role','buyingRole'],'')||''))})[0]||r.contacts[0]||null;
   r.orders.sort(function(a,b){return (dt(field(b,['orderDate','date','createdAt'],''))||0)-(dt(field(a,['orderDate','date','createdAt'],''))||0)});
   r.activities.sort(function(a,b){return (dt(field(b,['date','activityDate','createdAt','lastTouch'],''))||0)-(dt(field(a,['date','activityDate','createdAt','lastTouch'],''))||0)});
   r.lastOrder=r.orders[0]||null;r.lastActivity=r.activities[0]||null;
   r.lastOrderDate=dt(field(r.lastOrder,['orderDate','date','createdAt'],'')||'');
   r.lastContactDate=dt(field(r.lastActivity,['date','activityDate','createdAt','lastTouch'],'')||'');
   r.contacts.forEach(function(c){var nt=dt(field(c,['nextTouch','nextContact','followUpDate'],''));if(nt)r.nextTouches.push(nt)});
   r.activities.forEach(function(a){var nt=dt(field(a,['nextDate','followUpDate','nextTouch'],''));if(nt)r.nextTouches.push(nt)});
   r.categories={};r.products={};
   r.lineItems.forEach(function(x){if(x.lineClass!=='product')return;var cat=clean(x.productCategory)||'Other',p=clean(x.productName)||clean(x.sku)||'Product';r.categories[cat]=(r.categories[cat]||0)+n(x.extendedSalesRevenue);r.products[p]=(r.products[p]||0)+Math.max(0,n(x.quantityOrdered))});
  });
  return map
 }

 function actionTasks(known){
  var b=bucket(ACTION,{manual:[],state:{},events:[]}),state=b.state||{},rows=[];
  arr(b.manual).forEach(function(t){var st=state[t.id]||{};if(st.status==='completed'||t.status==='completed')return;var x=Object.assign({},t);x.due=st.dueDate||t.dueDate;x.source='Action Center';x.page=t.page||'action';x.score=n(t.score)||100;x.customer=clean(t.customer||t.company||'');x.title=clean(t.title)||'Customer action';x.copy=clean(t.action||t.why||t.measure||'Complete the next promised action.');x.waiting=/waiting on customer|customer review|customer approval/i.test(String(t.status||t.category||t.title||''))?'customer':/internal|production|accounting|art|approval/i.test(String(t.status||t.category||t.title||''))?'internal':'';rows.push(x)});
  ['repActions','actionItems','coachingActions'].forEach(function(key){arr(S&&S[key]).forEach(function(t,i){if(!t||t.visibleToRep===false)return;var r=repOf(t);if(r&&r!==_rp2.rep)return;if(!r&&companyOf(t)&&!known[norm(companyOf(t))])return;if(!openStatus(t.status))return;rows.push({id:clean(t.id)||key+'_'+i,title:clean(field(t,['title','action','task'],'Assigned action')),copy:clean(field(t,['why','description','notes','measure'],'Manager-visible assignment')),customer:companyOf(t),due:field(t,['dueDate','date','deadline'],''),source:'Manager assignment',page:field(t,['page'],'action'),score:n(field(t,['score','priority'],150)),waiting:/customer/i.test(String(field(t,['status','category'],'')))?'customer':'internal'})})});
  return uniq(rows,function(x){return x.id||[x.title,x.customer,x.due].join('|')})
 }

 function normalizeQuote(q,source){
  var sent=field(q,['sentDate','quoteDate','issueDate','createdAt','date'],'');
  return{id:clean(field(q,['id','quoteId','number','quoteNumber'],'')||source+'_'+Math.random()),company:companyOf(q),number:clean(field(q,['quoteNumber','number','quoteNo','id'],'Quote')),title:clean(field(q,['title','name','subject'],'Quote')),amount:n(field(q,['amount','total','value','quoteTotal'],0)),status:clean(field(q,['status','stage'],'Draft')),sent:sent,follow:field(q,['followUpDate','nextStepDate','nextDate','dueDate'],''),expires:field(q,['expirationDate','expiresAt','validUntil'],''),next:clean(field(q,['nextStep','followUp','nextAction'],'')||''),contact:clean(field(q,['contactName','contact'],'')||''),source:source}
 }
 function quoteRows(known){
  var rows=[],crm=read(CRM),rep=crm&&crm.reps&&crm.reps[_rp2.rep],accounts=rep&&rep.accounts||{};
  Object.keys(accounts).forEach(function(k){var a=accounts[k]||{},name=clean(a.profile&&a.profile.name)||k;arr(a.quotes).forEach(function(q){var x=Object.assign({},q);if(!companyOf(x))x.company=name;rows.push(normalizeQuote(x,'Customer profile'))})});
  [['quotes',S&&S.quotes],['crmQuotes',S&&S.crmQuotes],['customerQuotes',S&&S.customerQuotes],['proposals',S&&S.proposals],['estimates',S&&S.estimates]].forEach(function(pair){arr(pair[1]).forEach(function(q){if(repOkay(q,known))rows.push(normalizeQuote(q,pair[0]))})});
  rows=uniq(rows,function(q){return norm(q.company)+'|'+norm(q.number)+'|'+iso(q.sent)});
  return rows.filter(function(q){return q.company&&openStatus(q.status)})
 }
 function normalizeOpp(o,source){return{id:clean(field(o,['id','opportunityId','dealId'],'')||source+'_'+Math.random()),company:companyOf(o),title:clean(field(o,['title','name','opportunityName'],'Opportunity')),amount:n(field(o,['amount','value','estimatedValue'],0)),stage:clean(field(o,['stage','status'],'Open')),next:clean(field(o,['nextStep','nextAction'],'')||''),nextDate:field(o,['nextStepDate','nextDate','dueDate','expectedClose'],'')||'',contact:clean(field(o,['contactName','contact'],'')||''),source:source}}
 function oppRows(known){
  var rows=[],crm=read(CRM),rep=crm&&crm.reps&&crm.reps[_rp2.rep],accounts=rep&&rep.accounts||{};
  Object.keys(accounts).forEach(function(k){var a=accounts[k]||{},name=clean(a.profile&&a.profile.name)||k;arr(a.opportunities).forEach(function(o){var x=Object.assign({},o);if(!companyOf(x))x.company=name;rows.push(normalizeOpp(x,'Customer profile'))})});
  [['opportunities',S&&S.opportunities],['crmOpportunities',S&&S.crmOpportunities],['accountOpportunities',S&&S.accountOpportunities],['deals',S&&S.deals]].forEach(function(pair){arr(pair[1]).forEach(function(o){if(repOkay(o,known))rows.push(normalizeOpp(o,pair[0]))})});
  return uniq(rows,function(o){return norm(o.company)+'|'+norm(o.title)}).filter(function(o){return o.company&&openStatus(o.stage)})
 }

 function operationalRows(known){
  var rows=[],cases=bucket(CASES,{cases:[]}),docs=bucket(DOCS,{documents:[]}),products=bucket(PRODUCTS,{samples:[]});
  arr(cases.cases).forEach(function(c,i){if(openStatus(field(c,['status'],'')))rows.push({id:'case_'+(c.id||i),title:clean(field(c,['title','subject'],'Open service case')),copy:clean(field(c,['customerImpact','description','resolutionPlan'],'Customer issue requires follow-through.')),customer:companyOf(c),due:field(c,['promiseDate','dueDate','targetDate'],''),source:'Service case',page:'cases',score:190,waiting:/customer/i.test(String(field(c,['status','waitingOn'],'')))?'customer':'internal'})});
  arr(docs.documents).forEach(function(d,i){var s=String(field(d,['approvalStatus','status'],'')||'');if(/pending|requested|review/i.test(s))rows.push({id:'doc_'+(d.id||i),title:clean(d.title||d.name||'Approval pending'),copy:'Document or artwork approval is still open.',customer:companyOf(d),due:field(d,['approvalDueDate','dueDate','expirationDate'],''),source:'Documents & Approvals',page:'documents',score:175,waiting:/customer/i.test(s)?'customer':'internal'})});
  arr(products.samples).forEach(function(s,i){if(openStatus(field(s,['status'],'')))rows.push({id:'sample_'+(s.id||i),title:'Sample · '+clean(field(s,['productName','product','title'],'Product sample')),copy:clean(field(s,['notes'],'Sample follow-up is still open.')),customer:companyOf(s),due:field(s,['expectedDate','returnDate','dueDate'],''),source:'Samples',page:'products',score:145,waiting:/shipped|delivered|customer/i.test(String(field(s,['status'],'')))?'customer':'internal'})});
  return rows.filter(function(x){return !x.customer||known[norm(x.customer)]})
 }

 function laneForTask(t){
  if(t.waiting==='customer')return'customer';
  if(t.waiting==='internal')return'internal';
  var gap=t.due?diff(now(),t.due):null;
  if(gap!=null&&gap<0)return'overdue';
  if(gap===0)return'today';
  return'upcoming'
 }
 function businessRows(known,quotes,opps){
  var rows=actionTasks(known).concat(operationalRows(known));
  quotes.forEach(function(q){var due=q.follow||q.expires;if(!due)return;var gap=diff(now(),due);if(gap!=null&&gap<=7)rows.push({id:'quote_'+q.id,title:'Quote '+q.number+' follow-up',copy:q.next||q.status+' · '+money(q.amount),customer:q.company,due:due,source:'Quote follow-up',page:'dealdesk',score:165,waiting:/customer review|sent/i.test(q.status)?'customer':''})});
  opps.forEach(function(o){if(!o.nextDate)return;var gap=diff(now(),o.nextDate);if(gap!=null&&gap<=7)rows.push({id:'opp_'+o.id,title:o.title,copy:o.next||o.stage+' · '+money(o.amount),customer:o.company,due:o.nextDate,source:'Opportunity next step',page:'pipeline',score:160})});
  rows=uniq(rows,function(x){return x.id||[x.title,x.customer,x.due].join('|')}).sort(sortDue);
  var lanes={overdue:[],today:[],customer:[],internal:[],upcoming:[]};
  rows.forEach(function(x){x.lane=laneForTask(x);lanes[x.lane].push(x)});
  return{rows:rows,lanes:lanes}
 }

 function quoteLanes(quotes){
  var lanes={'72':[],'7':[],expiring:[],missing:[]};
  quotes.forEach(function(q){
   var age=q.sent?diff(q.sent,now()):null,exp=q.expires?diff(now(),q.expires):null;
   if(!q.follow&&!q.next)lanes.missing.push(q);
   if(exp!=null&&exp>=0&&exp<=7)lanes.expiring.push(q);
   if(age!=null&&age>=2&&age<=4)lanes['72'].push(q);
   if(age!=null&&age>=5&&age<=10)lanes['7'].push(q)
  });
  Object.keys(lanes).forEach(function(k){lanes[k].sort(function(a,b){return n(b.amount)-n(a.amount)})});
  return lanes
 }

 function callQueue(customers,tasks,quotes,opps){
  var rows=[];
  tasks.rows.forEach(function(t){if(/call|phone|voicemail|contact|reconnect/i.test([t.title,t.copy,t.source].join(' ')))rows.push({customer:t.customer,reason:t.title,copy:t.copy,due:t.due,score:230+n(t.score),source:t.source,value:0,taskId:t.id||'',taskPage:t.page||'action'})});
  quotes.forEach(function(q){var due=q.follow||q.expires,gap=due?diff(now(),due):null,age=q.sent?diff(q.sent,now()):null;if((gap!=null&&gap<=1)||(age!=null&&age>=2&&age<=10&&!q.follow))rows.push({customer:q.company,contact:q.contact,reason:'Advance quote '+q.number,copy:q.next||q.status+' · '+money(q.amount),due:due,score:210+(q.amount>10000?20:0),source:'Quote follow-up',value:q.amount})});
  opps.forEach(function(o){var gap=o.nextDate?diff(now(),o.nextDate):null;if((gap!=null&&gap<=1)||/call|contact|follow/i.test(o.next))rows.push({customer:o.company,contact:o.contact,reason:o.next||'Advance '+o.title,copy:o.stage+' · '+money(o.amount),due:o.nextDate,score:190+(o.amount>10000?20:0),source:'Opportunity',value:o.amount})});
  Object.keys(customers).forEach(function(k){var c=customers[k];if(/inactive/i.test(String(c.profile.status||c.profile.tier||'')))return;var future=c.nextTouches.filter(function(d){return diff(now(),d)>=0&&diff(now(),d)<=7});if(future.length)return;var last=c.lastContactDate||c.lastOrderDate,gap=last?diff(last,now()):null;if(gap==null||gap>=60){rows.push({customer:c.name,contact:c.primary&&clean(field(c.primary,['name'],'')||''),reason:gap==null?'Establish the next customer touch':'Customer has been quiet for '+gap+' days',copy:c.lastOrderDate?'Last order '+fmtFull(c.lastOrderDate):'No completed order date is recorded.',due:'',score:gap==null?90:Math.min(170,90+Math.floor(gap/10)),source:'Customer cadence',value:0})}});
  rows=rows.filter(function(x){return x.customer&&customers[norm(x.customer)]}).sort(sortDue);
  return uniq(rows,function(x){return norm(x.customer)}).slice(0,18).map(function(x,i){var c=customers[norm(x.customer)]||{},primary=c.primary||{};x.contact=x.contact||clean(field(primary,['name'],'')||'');x.phone=clean(field(primary,['phone','mobile','phoneNumber'],'')||c.profile.phone||'');x.email=clean(field(primary,['email'],'')||c.profile.email||'');x.rank=i+1;x.level=x.score>=230?'high':x.score>=170?'medium':'low';return x})
 }

 function performance(opps,business,calls){
  var week={revenue:0,orders:0,calls:0},qtd={revenue:0,orders:0,calls:0},goal=0,rank=null,totalReps=0;
  try{if(typeof _rp2SelectedWeekData==='function')week=_rp2SelectedWeekData(_rp2.rep)||week}catch(e){}
  try{if(typeof _rp2Tot==='function')qtd=_rp2Tot(_rp2.rep)||qtd}catch(e){}
  try{if(typeof _rp2Goal==='function')goal=_rp2Goal(_rp2.rep)||0}catch(e){}
  try{var ranks=typeof _rp2Ranks==='function'?_rp2Ranks():[];totalReps=ranks.length;rank=typeof _rp2RankOf==='function'?_rp2RankOf(ranks,_rp2.rep):null}catch(e){}
  var openPipeline=opps.reduce(function(s,o){return s+o.amount},0),completed=0,total=business.lanes.overdue.length+business.lanes.today.length;
  try{var b=bucket(ACTION,{state:{}});Object.keys(b.state||{}).forEach(function(k){var st=b.state[k]||{},d=dt(st.completedAt);if(st.status==='completed'&&d&&iso(d)===iso(now()))completed++})}catch(e){}
  var progress=total+completed?Math.round(completed/(total+completed)*100):100;
  return{week:week,qtd:qtd,goal:goal,rank:rank,totalReps:totalReps,pipeline:openPipeline,completed:completed,due:total,progress:progress,callsQueued:calls.length}
 }

 function build(){
  var customers=customerIndex(),known={};Object.keys(customers).forEach(function(k){known[k]=customers[k].name});
  var quotes=quoteRows(known),opps=oppRows(known),business=businessRows(known,quotes,opps),calls=callQueue(customers,business,quotes,opps),quoteGroups=quoteLanes(quotes),perf=performance(opps,business,calls);
  var schedule=business.rows.filter(function(x){var gap=x.due?diff(now(),x.due):null;return gap===0}).slice().sort(function(a,b){var ad=dt(a.due),bd=dt(b.due);return(ad?ad.getTime():0)-(bd?bd.getTime():0)}).slice(0,10);
  return{customers:customers,known:known,quotes:quotes,opps:opps,business:business,calls:calls,quoteGroups:quoteGroups,perf:perf,schedule:schedule}
 }

 function kpi(label,value,copy){return'<div class="ud4-kpi"><div class="ud4-kpi-label">'+esc(label)+'</div><div class="ud4-kpi-value">'+value+'</div><div class="ud4-kpi-copy">'+copy+'</div></div>'}
 function empty(title,copy){return'<div class="ud4-empty"><strong>'+esc(title)+'</strong>'+esc(copy)+'</div>'}
 function dueLabel(v){if(!v)return'No due time';var gap=diff(now(),v);return gap<0?Math.abs(gap)+'d overdue':gap===0?'Due today':gap===1?'Due tomorrow':'Due '+fmt(v)}
 function callCard(c){
  return'<div class="ud4-call '+c.level+'"><div class="ud4-call-top"><div><div class="ud4-company" onclick="_ud4OpenCustomer(\''+encodeURIComponent(c.customer)+'\',\'overview\')">'+esc(c.customer)+'</div><div class="ud4-contact">'+esc(c.contact||'Primary contact not recorded')+'</div></div><div class="ud4-score">#'+c.rank+'</div></div><div class="ud4-reason"><strong style="color:#dce5ef">'+esc(c.reason)+'</strong><br>'+esc(c.copy)+'</div><div class="ud4-meta"><span>'+esc(c.source)+'</span><span>'+esc(dueLabel(c.due))+'</span>'+(c.value?'<span>'+money(c.value)+'</span>':'')+'</div><div class="ud4-card-actions"><button class="ud4-mini primary" onclick="_ud4Prep(\''+encodeURIComponent(c.customer)+'\')">Prep</button><button class="ud4-mini cyan" onclick="_ud4StartCall(\''+encodeURIComponent(c.customer)+'\')">Call</button><button class="ud4-mini" onclick="_ud4OpenCustomer(\''+encodeURIComponent(c.customer)+'\',\'overview\')">Open company</button></div></div>'
 }
 function taskCard(t){
  var tone=t.lane==='overdue'?'overdue':t.lane==='today'?'today':'';
  return'<div class="ud4-task '+tone+'"><div class="ud4-task-top"><div><div class="ud4-task-title">'+esc(t.title)+'</div><div class="ud4-task-copy">'+esc(t.customer?(t.customer+' · '+t.copy):t.copy)+'</div></div><div class="ud4-due">'+esc(dueLabel(t.due))+'</div></div><div class="ud4-meta"><span>'+esc(t.source)+'</span>'+(t.customer?'<span>'+esc(t.customer)+'</span>':'')+'</div><div class="ud4-card-actions">'+(t.customer?'<button class="ud4-mini" onclick="_ud4OpenCustomer(\''+encodeURIComponent(t.customer)+'\',\'overview\')">Customer</button>':'')+'<button class="ud4-mini primary" onclick="_ud4OpenBusiness(\''+esc(t.page||'action')+'\',\''+encodeURIComponent(t.customer||'')+'\')">Open work</button></div></div>'
 }
 function quoteCard(q){
  return'<div class="ud4-quote"><div class="ud4-quote-top"><div><div class="ud4-quote-title">'+esc(q.number+' · '+q.company)+'</div><div class="ud4-quote-copy">'+esc(q.title)+' · '+esc(q.status)+'</div></div><div class="ud4-due">'+money(q.amount)+'</div></div><div class="ud4-meta"><span>Sent '+fmt(q.sent)+'</span><span>Follow-up '+fmt(q.follow)+'</span><span>Expires '+fmt(q.expires)+'</span></div><div class="ud4-card-actions"><button class="ud4-mini cyan" onclick="_ud4OpenQuote(\''+encodeURIComponent(q.company)+'\')">Open quote</button><button class="ud4-mini" onclick="_ud4Prep(\''+encodeURIComponent(q.company)+'\')">Prep customer</button></div></div>'
 }
 function tabs(kind,active,defs){
  return'<div class="ud4-tabbar"><div class="ud4-tabs">'+defs.map(function(x){return'<button class="ud4-tab '+(x[0]===active?'on':'')+'" onclick="'+(kind==='business'?'_ud4SetBusiness':'_ud4SetQuotes')+'(\''+x[0]+'\')">'+x[1]+' <strong>'+x[2]+'</strong></button>'}).join('')+'</div></div>'
 }

 function prepModal(g){
  if(!window._ud4PrepName)return'';
  var name=window._ud4PrepName,c=g.customers[norm(name)]||{},orders=c.orders||[],quotes=g.quotes.filter(function(q){return norm(q.company)===norm(name)}),opps=g.opps.filter(function(o){return norm(o.company)===norm(name)}),cats=Object.keys(c.categories||{}).sort(function(a,b){return c.categories[b]-c.categories[a]}),products=Object.keys(c.products||{}).sort(function(a,b){return c.products[b]-c.products[a]}),lastOrder=c.lastOrderDate,primary=c.primary||{},lastContact=c.lastContactDate;
  var questions=[];
  if(quotes.length)questions.push('What feedback or internal approval is still needed to move '+quotes[0].number+' forward?');
  if(opps.length)questions.push('What must happen next for '+opps[0].title+' to stay on schedule?');
  if(products.length)questions.push('How are the '+products[0]+' items working, and is another group or season approaching?');
  if(!c.primary)questions.push('Who should own routine communication and final buying decisions for this account?');
  if(!questions.length)questions.push('What is changing in the business that could create an apparel, uniform, safety, event, or employee-recognition need?');
  questions.push('Before we finish, what exact next step and date should we agree on?');
  return'<div class="ud4-modal-wrap" onclick="if(event.target===this)_ud4ClosePrep()"><div class="ud4-modal"><div class="ud4-modal-head"><div><div class="ud4-kick">PREP ME FOR CALL · CUSTOMER CONTEXT</div><div class="ud4-modal-title">'+esc(name)+'</div><div class="ud4-modal-copy">A deterministic briefing from the customer record, recent activity, orders, quotes, opportunities, and line-item purchase history.</div></div><button class="ud4-close" onclick="_ud4ClosePrep()">×</button></div><div class="ud4-prep-grid"><div class="ud4-prep-card"><span>Primary contact</span><strong>'+esc(field(primary,['name'],'Not recorded'))+'</strong><p>'+esc(field(primary,['title','buyingRole'],'Role not recorded'))+' · '+esc(field(primary,['phone','email'],'Contact method not recorded'))+'</p></div><div class="ud4-prep-card"><span>Last contact</span><strong>'+fmtFull(lastContact)+'</strong><p>'+(c.lastActivity?esc(field(c.lastActivity,['subject','type','detail'],'Recent customer activity')):'No dated customer activity is loaded.')+'</p></div><div class="ud4-prep-card"><span>Last order</span><strong>'+fmtFull(lastOrder)+'</strong><p>'+(orders[0]?esc(field(orders[0],['orderNum','invoiceNumber'],'Order'))+' · '+money(field(orders[0],['total','amount'],0)):'No completed order record is loaded.')+'</p></div><div class="ud4-prep-card"><span>Open quotes</span><strong>'+quotes.length+'</strong><p>'+(quotes[0]?esc(quotes[0].number+' · '+money(quotes[0].amount)+' · '+quotes[0].status):'No active quote is visible.')+'</p></div><div class="ud4-prep-card"><span>Open opportunities</span><strong>'+opps.length+'</strong><p>'+(opps[0]?esc(opps[0].title+' · '+money(opps[0].amount)+' · '+opps[0].stage):'No qualified opportunity is visible.')+'</p></div><div class="ud4-prep-card"><span>Top purchase signal</span><strong>'+esc(products[0]||cats[0]||'Not available')+'</strong><p>'+(products[0]?n(c.products[products[0]]).toLocaleString()+' units in loaded line-item history':'Upload line-item reports to build product history.')+'</p></div></div><div class="ud4-section-title" style="margin-top:18px">Suggested questions</div><div class="ud4-question-list">'+questions.map(function(q){return'<div class="ud4-question">• '+esc(q)+'</div>'}).join('')+'</div><div class="ud4-modal-actions"><button class="ud4-btn" onclick="_ud4OpenCustomer(\''+encodeURIComponent(name)+'\',\'overview\')">Open company</button><button class="ud4-btn purple" onclick="_ud4OpenQuote(\''+encodeURIComponent(name)+'\')">Quotes</button><button class="ud4-btn primary" onclick="_ud4StartCall(\''+encodeURIComponent(name)+'\')">Start call workflow</button></div></div></div>'
 }

 function render(){
  var g=build(),p=g.perf,first=String(_rp2.rep||'').split(/\s+/)[0]||_rp2.rep,hr=new Date().getHours(),greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening',urgent=g.business.lanes.overdue.length,quoteAttention=g.quoteGroups['72'].length+g.quoteGroups['7'].length+g.quoteGroups.expiring.length+g.quoteGroups.missing.length;
  if(!g.business.lanes[window._ud4BusinessLane])window._ud4BusinessLane=urgent?'overdue':'today';
  var qlane=g.quoteGroups[window._ud4QuoteLane]?window._ud4QuoteLane:'72';
  var dueTotal=p.due,progress=p.progress,heroTitle=urgent?'Start with the overdue customer promises':g.calls.length?'Your call plan and customer work are ready':'Your urgent work is clear—build the next opportunity';
  var hero='<div class="ud4-hero"><div class="ud4-hero-grid"><div><div class="ud4-kick">UNIFIED REP DESKTOP 4.0 · DAILY OPERATING SYSTEM · BUILD v527</div><div class="ud4-title">'+esc(greet+', '+first)+'—run the day from one screen</div><div class="ud4-copy">Today’s calls, customer promises, quote follow-up, schedule, and performance are assembled from the existing CRM systems. Open the customer or source workspace only when deeper detail is needed.</div><div class="ud4-pills"><span class="ud4-pill '+(urgent?'risk':'good')+'">'+urgent+' overdue</span><span class="ud4-pill info">'+g.calls.length+' calls ranked</span><span class="ud4-pill warn">'+quoteAttention+' quotes need attention</span><span class="ud4-pill">'+(typeof window._rp2NotificationUnreadCount==='function'?window._rp2NotificationUnreadCount():0)+' unread alerts</span></div><div class="ud4-actions"><button class="ud4-btn primary" '+(g.calls.length?'onclick="_ud4Prep(\''+encodeURIComponent(g.calls[0].customer)+'\')"':'onclick="_rp2Go(\'customers\')"')+'>'+(g.calls.length?'Prep next call':'Open companies')+'</button><button class="ud4-btn cyan" onclick="_rp2Go(\'action\')">Open Today’s Business</button><button class="ud4-btn purple" onclick="_rp2OpenDesktopNotifications()">Notifications <span class="ud4-notif-count">'+(typeof window._rp2NotificationUnreadCount==='function'?window._rp2NotificationUnreadCount():0)+'</span></button><button class="ud4-btn" onclick="_rp2RefreshCloud(this,false)">Refresh synced data</button></div></div><div class="ud4-brief"><div><div class="ud4-brief-label">Today’s command brief</div><div class="ud4-brief-title">'+esc(heroTitle)+'</div><div class="ud4-brief-copy">'+(urgent?urgent+' overdue item'+(urgent===1?'':'s')+' should be resolved or rescheduled before lower-priority work.':g.calls.length?'The queue is ranked by due work, active quotes, opportunities, and customer contact gaps.':'There are no urgent execution signals in the currently loaded data.')+'</div><div class="ud4-progress"><span style="width:'+progress+'%"></span></div></div><div class="ud4-brief-foot"><span>Closed today <strong>'+p.completed+'</strong></span><span>Due / overdue <strong>'+dueTotal+'</strong></span><span>Progress <strong>'+progress+'%</strong></span></div></div></div></div>';
  var goalPct=p.goal?Math.round(p.qtd.revenue/p.goal*100):null;
  var kpis='<div class="ud4-kpis">'+kpi('Selected week',money(p.week.revenue),n(p.week.orders)+' orders · '+n(p.week.calls)+' calls')+kpi('Quarter revenue',money(p.qtd.revenue),p.goal?(goalPct+'% of '+money(p.goal)):'No goal available')+kpi('Quarter rank',p.rank?('#'+p.rank):'—',p.totalReps?('of '+p.totalReps+' reps'):'Rank unavailable')+kpi('Calls to 125',String(Math.max(0,125-n(p.week.calls))),n(p.week.calls)+' recorded this week')+kpi('Open pipeline',money(p.pipeline),g.opps.length+' open opportunities')+kpi('Today’s business',String(g.business.rows.length),g.business.lanes.today.length+' due today · '+urgent+' overdue')+kpi('Quote follow-up',String(quoteAttention),g.quoteGroups.missing.length+' missing next step')+kpi('Call queue',String(g.calls.length),g.calls.length?'Next: '+esc(g.calls[0].customer):'No ranked calls')+'</div>';
  var calls='<section class="ud4-panel"><div class="ud4-panel-head"><div><div class="ud4-section-kick">TODAY’S CALLS</div><div class="ud4-section-title">Ranked customer conversations</div><div class="ud4-section-copy">Contact frequency, due work, quotes, opportunities, and account silence determine the order.</div></div><span class="ud4-count">'+g.calls.length+'</span></div><div class="ud4-panel-body ud4-scroll">'+(g.calls.length?g.calls.map(callCard).join(''):empty('No calls are currently ranked','Create a customer task, quote follow-up, opportunity next step, or contact cadence.'))+'</div></section>';
  var bdefs=[['overdue','Overdue',g.business.lanes.overdue.length],['today','Due Today',g.business.lanes.today.length],['customer','Waiting on Customer',g.business.lanes.customer.length],['internal','Waiting Internally',g.business.lanes.internal.length],['upcoming','Upcoming',g.business.lanes.upcoming.length]],brows=g.business.lanes[window._ud4BusinessLane]||[];
  var business='<section class="ud4-panel"><div class="ud4-panel-head"><div><div class="ud4-section-kick">TODAY’S BUSINESS</div><div class="ud4-section-title">Every promise and next step</div><div class="ud4-section-copy">Tasks, assignments, opportunities, quotes, approvals, service work, and samples in one execution stream.</div></div><button class="ud4-mini primary" onclick="_rp2Go(\'action\')">Full Action Center</button></div>'+tabs('business',window._ud4BusinessLane,bdefs)+'<div class="ud4-panel-body ud4-scroll">'+(brows.length?brows.slice(0,18).map(taskCard).join(''):empty('This lane is clear','No visible work currently matches this status.'))+'</div></section>';
  var qdefs=[['72','72 Hours',g.quoteGroups['72'].length],['7','Seven Days',g.quoteGroups['7'].length],['expiring','Expiring',g.quoteGroups.expiring.length],['missing','No Next Step',g.quoteGroups.missing.length]],qrows=g.quoteGroups[qlane]||[];
  var quotes='<section class="ud4-panel"><div class="ud4-panel-head"><div><div class="ud4-section-kick">QUOTE FOLLOW-UP</div><div class="ud4-section-title">Keep pricing conversations moving</div><div class="ud4-section-copy">Timed follow-up lanes use quote sent, follow-up, expiration, and next-step fields.</div></div><button class="ud4-mini purple" onclick="_rp2Go(\'dealdesk\')">Deal Desk</button></div>'+tabs('quotes',qlane,qdefs)+'<div class="ud4-panel-body ud4-scroll">'+(qrows.length?qrows.slice(0,12).map(quoteCard).join(''):empty('This quote lane is clear','Quotes will appear when their dates and next steps match this follow-up window.'))+'</div></section>';
  var schedule='<section class="ud4-panel"><div class="ud4-panel-head"><div><div class="ud4-section-kick">TODAY’S SCHEDULE</div><div class="ud4-section-title">Dated commitments</div><div class="ud4-section-copy">Tasks with explicit times are ordered first; date-only commitments remain visible.</div></div><span class="ud4-count">'+g.schedule.length+'</span></div><div class="ud4-panel-body"><div class="ud4-schedule">'+(g.schedule.length?g.schedule.map(function(x){return'<div class="ud4-schedule-row"><div class="ud4-time">'+esc(timeText(x.due))+'</div><div class="ud4-dot"></div><div><div class="ud4-schedule-title">'+esc(x.title)+'</div><div class="ud4-schedule-copy">'+esc((x.customer?x.customer+' · ':'')+x.source)+'</div></div><button class="ud4-mini" onclick="_ud4OpenBusiness(\''+esc(x.page||'action')+'\',\''+encodeURIComponent(x.customer||'')+'\')">Open</button></div>'}).join(''):empty('No dated commitments today','Today’s tasks appear here after a due date is recorded.'))+'</div></div></section>';
  var performance='<section class="ud4-panel"><div class="ud4-panel-head"><div><div class="ud4-section-kick">MY PERFORMANCE</div><div class="ud4-section-title">Enough context to steer the day</div><div class="ud4-section-copy">Deep analysis is organized under My Profile: Dashboard, Forecast, Goals, Reviews, Achievements, Year Overview, and Reports.</div></div><button class="ud4-mini purple" onclick="_rp2Go(\'dash\')">Full dashboard</button></div><div class="ud4-panel-body"><div class="ud4-performance"><div class="ud4-perf"><span>Week sales</span><strong>'+money(p.week.revenue)+'</strong><small>'+n(p.week.orders)+' orders</small></div><div class="ud4-perf"><span>Quarter sales</span><strong>'+money(p.qtd.revenue)+'</strong><small>'+(p.goal?goalPct+'% to goal':'Goal not set')+'</small></div><div class="ud4-perf"><span>Week calls</span><strong>'+n(p.week.calls)+'</strong><small>'+Math.max(0,125-n(p.week.calls))+' remaining to 125</small></div><div class="ud4-perf"><span>Pipeline</span><strong>'+money(p.pipeline)+'</strong><small>'+g.opps.length+' open opportunities</small></div></div><div class="ud4-actions"><button class="ud4-btn" onclick="_rp2Go(\'forecast\')">Forecast</button><button class="ud4-btn" onclick="_rp2Go(\'daily\')">Daily Sales</button><button class="ud4-btn" onclick="_rp2Go(\'year\')">Year Overview</button><button class="ud4-btn" onclick="_rp2Go(\'reports\')">Reports</button></div></div></section>';
  return'<div class="ud4-shell">'+hero+kpis+'<div class="ud4-main">'+calls+business+quotes+'</div><div class="ud4-bottom">'+schedule+performance+'</div><div class="ud4-disclosure"><strong>Desktop integrity:</strong> this page summarizes existing records and does not create duplicate customers, tasks, quotes, opportunities, orders, or service cases. Selected-period performance follows the portal selectors; daily execution remains current.</div></div>'+prepModal(g)
 }

 function installNav(){
  if(typeof RP2_NAV==='undefined')return;
  RP2_NAV=[
   {g:'My Day',items:[['home','Desktop','🏠'],['action','Today’s Business','✅'],['notifications','Notifications','🔔']]},
   {g:'Customers & Sales',items:[['customers','Customers','🏢'],['contacts','Contacts','👥'],['pipeline','Opportunities','◆'],['dealdesk','Quotes','📄'],['orders','Orders','📦']]},
   {g:'Performance',items:[['dash','Dashboard','📊'],['forecast','Forecast','📈'],['daily','Daily Sales & Calls','📅'],['year','Year Overview','🗓'],['reports','Reports','📑']]},
   {g:'Resources',items:[['products','Products & Catalogs','👕'],['production','Production','🏭'],['learning','Learning & Playbook','📚'],['documents','Documents','📁']]},
   {g:'My Growth',items:[['goals','Goals','🎯'],['achievements','Achievements','🏆'],['ai','AI Coach','✨'],['profile','My Profile','👤']]}
  ]
 }
 function rerender(){var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2HomeV3();var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0}
 window._ud4SetBusiness=function(v){window._ud4BusinessLane=v;rerender()};
 window._ud4SetQuotes=function(v){window._ud4QuoteLane=v;rerender()};
 window._ud4Prep=function(encoded){window._ud4PrepName=decodeURIComponent(encoded||'');rerender()};
 window._ud4ClosePrep=function(){window._ud4PrepName='';rerender()};
 window._ud4OpenCustomer=function(encoded,tab){var name=decodeURIComponent(encoded||'');window._ud4PrepName='';_rp2Go('customers');setTimeout(function(){try{if(typeof window._cw4OpenCompany==='function'){window._cw4OpenCompany(encodeURIComponent(name));if(tab&&typeof window._cw4SetTab==='function')window._cw4SetTab(tab)}}catch(e){}},35)};
 window._ud4StartCall=function(encoded){var name=decodeURIComponent(encoded||'');window._ud4PrepName='';_rp2Go('customers');setTimeout(function(){try{if(typeof window._cw4OpenCompany==='function'){window._cw4OpenCompany(encodeURIComponent(name));if(typeof window._cw4SetTab==='function')window._cw4SetTab('contacts')}}catch(e){}},35)};
 window._ud4OpenQuote=function(encoded){var name=decodeURIComponent(encoded||'');window._ud4PrepName='';if(typeof window._cw4OpenCenter==='function')window._cw4OpenCenter('dealdesk',encodeURIComponent(name));else _rp2Go('dealdesk')};
 window._ud4OpenBusiness=function(page,encoded){var name=decodeURIComponent(encoded||'');if(name&&page==='customers')return window._ud4OpenCustomer(encodeURIComponent(name),'overview');if(name&&typeof window._cw4OpenCenter==='function'&&['pipeline','dealdesk','cases','documents','products','contacts'].indexOf(page)>=0)return window._cw4OpenCenter(page,encodeURIComponent(name));_rp2Go(page||'action')};
 window._rp2HomeV3=function(){try{return render()}catch(e){console.error('[Unified Rep Desktop v527]',e);return'<div class="ud4-shell"><div class="ud4-hero"><div class="ud4-kick">UNIFIED REP DESKTOP 4.0 · BUILD v527 · RECOVERY MODE</div><div class="ud4-title">The daily operating screen hit a compatibility issue</div><div class="ud4-copy">'+esc(e&&e.message||String(e))+'</div></div></div>'}};
 window._rp2HomeDraw=function(){};
 window._rp2HomeAttentionCount=function(){try{var g=build();return g.business.lanes.overdue.length+g.business.lanes.today.length}catch(e){return 0}};
 window._rp2DesktopBuild=function(){return build()};
 installNav();
})();
