
(function(){
 var CRM_STORE='tcp_rp_company_crm_v510',ACTION_STORE='tcp_rp_action_center_v504',VIEW_STORE='tcp_rp_contacts_v512';
 var TABS=[['command','Relationship Command','◫'],['directory','Contact Directory','👥'],['map','Decision Map','🧭'],['touches','Touch Planner','📅'],['risks','Relationship Risks','⚠'],['insights','Contact Insights','✦'],['history','Relationship History','◷']];
 var BUYING_ROLES=['Economic Buyer','Decision Maker','Champion','Influencer','User','Procurement','Budget Approver','Art Approver','Operations','Blocker','Other','Unknown'];
 var INFLUENCE=['High','Medium','Low','Unknown'];
 var STRENGTH=['Strong','Developing','Weak','Unknown'];
 var STATUS=['Active','Inactive','Left Company','Do Not Contact'];
 window._rp2ContactsTab=window._rp2ContactsTab||'command';
 window._rp2ContactsModal=window._rp2ContactsModal||null;
 window._rp2ContactsFilters=window._rp2ContactsFilters||{search:'',company:'',role:'',strength:'',touch:''};

 var BASE_COMPANY_PROFILE=window._rp2CompanyProfileV3;
 var BASE_COMPANY_SAVE_CONTACT=window._rp2CompanySaveContact;

 function n(v){return Number(v)||0}
 function clamp(v,a,b){return Math.max(a,Math.min(b,n(v)))}
 function esc(v){return _rp2Esc(String(v==null?'':v))}
 function money(v){return _rp2$(n(v))}
 function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/g,'')}
 function arr(v){if(Array.isArray(v))return v;if(!v)return[];try{if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null})}catch(e){}return[]}
 function dt(v){if(v==null||v==='')return null;try{var s=String(v).trim(),d;if(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)){var p=s.split('/'),y=Number(p[2]);if(y<100)y+=2000;d=new Date(y,Number(p[0])-1,Number(p[1]),12)}else d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);if(!isNaN(d.getTime())){d.setHours(12,0,0,0);return d}}catch(e){}return null}
 function now(){var d=window._rp2ContactsNow?new Date(window._rp2ContactsNow):new Date();d.setHours(12,0,0,0);return d}
 function iso(v){var d=dt(v);return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):''}
 function fmt(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
 function days(a,b){var x=dt(a),y=dt(b);return x&&y?Math.round((y-x)/86400000):null}
 function id(p){return p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
 function initials(v){var p=clean(v).split(/\s+/).filter(Boolean);return ((p[0]||'?').charAt(0)+(p.length>1?p[p.length-1].charAt(0):'')).toUpperCase()}
 function field(o,names,def){for(var i=0;i<names.length;i++){var v=o&&o[names[i]];if(v!=null&&String(v).trim()!=='')return v}return def==null?'':def}
 function companyOf(o){return clean(field(o,['company','customer','account','accountName','companyName','customerName'],'')||'')}
 function repOkay(o){var r=clean(field(o,['rep','owner','salesRep','repName'],'')||'');return !r||r===_rp2.rep}
 function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
 function crm(){var s=read(CRM_STORE);return s&&s.version===1&&s.reps?s:{version:1,reps:{}}}
 function repCrm(){var s=crm();s.reps[_rp2.rep]=s.reps[_rp2.rep]||{accounts:{}};return{store:s,data:s.reps[_rp2.rep]}}
 function account(name,create){
  var b=repCrm(),k=norm(name),accounts=b.data.accounts||{},match=Object.keys(accounts).filter(function(x){var a=accounts[x]||{};return norm(a.profile&&a.profile.name)===k})[0];
  if(match)k=match;
  if(create!==false)accounts[k]=accounts[k]||{profile:{name:name,owner:_rp2.rep,lifecycle:'Prospect',tier:'Standard',status:'Active',tags:[]},contacts:[],opportunities:[],activities:[],notes:[],files:[]};
  b.data.accounts=accounts;
  return{store:b.store,rep:b.data,key:k,data:accounts[k]||null}
 }
 function saveAccount(b){b.rep.accounts[b.key]=b.data;b.store.reps[_rp2.rep]=b.rep;localStorage.setItem(CRM_STORE,JSON.stringify(b.store))}
 function viewBucket(){var s=read(VIEW_STORE);if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};s.reps[_rp2.rep]=s.reps[_rp2.rep]||{events:[]};return{store:s,data:s.reps[_rp2.rep]}}
 function saveView(b){b.store.reps[_rp2.rep]=b.data;localStorage.setItem(VIEW_STORE,JSON.stringify(b.store))}
 function viewEvent(type,title,copy,itemId){
  var b=viewBucket();b.data.events.push({id:id('ctev'),type:type,title:title||'',copy:copy||'',itemId:itemId||'',at:new Date().toISOString()});saveView(b)
 }
 function companies(){
  var names={},b=repCrm();
  Object.keys(b.data.accounts||{}).forEach(function(k){var a=b.data.accounts[k]||{},name=clean(a.profile&&a.profile.name)||k;if(name)names[norm(name)]=name});
  arr(S&&S.orders).forEach(function(o){if(o&&o.rep===_rp2.rep&&clean(o.customer))names[norm(o.customer)]=clean(o.customer)});
  [S&&S.accountContacts,S&&S.customerContacts,S&&S.crmContacts,S&&S.contacts].forEach(function(pool){arr(pool).forEach(function(c){if(c&&repOkay(c)&&companyOf(c))names[norm(companyOf(c))]=companyOf(c)})});
  return Object.keys(names).map(function(k){return names[k]}).sort()
 }
 function localContacts(){
  var b=repCrm(),out=[];
  Object.keys(b.data.accounts||{}).forEach(function(k){
   var a=b.data.accounts[k]||{},company=clean(a.profile&&a.profile.name)||k;
   arr(a.contacts).forEach(function(c){if(!c)return;out.push(normalizeContact(c,company,'local',k+'|'+String(c.id||id('ct')),'Local CRM',k))})
  });
  return out
 }
 function connectedContacts(){
  var pools=[['accountContacts',S&&S.accountContacts],['customerContacts',S&&S.customerContacts],['crmContacts',S&&S.crmContacts],['contacts',S&&S.contacts]],out=[],known={};
  companies().forEach(function(x){known[norm(x)]=x});
  pools.forEach(function(pair){
   arr(pair[1]).forEach(function(c,i){
    if(!c)return;var rep=clean(field(c,['rep','owner','salesRep','repName'],'')),company=companyOf(c);
    if(rep&&rep!==_rp2.rep)return;
    if(!rep&&(!company||!known[norm(company)]))return;
    company=company||known[norm(company)]||'Unknown company';
    out.push(normalizeContact(c,company,'connected',pair[0]+'|'+String(field(c,['id','contactId'],i)),pair[0],norm(company)))
   })
  });
  return out
 }
 function normalizeContact(c,company,source,key,sourceName,accountKey){
  var role=clean(field(c,['buyingRole','role','contactRole'],'Unknown'))||'Unknown';
  if(BUYING_ROLES.indexOf(role)<0&&/decision/i.test(role))role='Decision Maker';
  var decision=!!field(c,['decisionMaker','isDecisionMaker'],false)||role==='Decision Maker'||role==='Economic Buyer';
  return{
   id:String(field(c,['id','contactId'],key||id('ct'))),key:key||'',accountKey:accountKey||norm(company),source:source||'local',sourceName:sourceName||'Local CRM',editable:source!=='connected',
   company:company,name:clean(field(c,['name','contactName','fullName'],'Unnamed contact'))||'Unnamed contact',
   title:clean(field(c,['title','jobTitle'],'')||''),department:clean(field(c,['department','team'],'')||''),email:clean(field(c,['email','emailAddress'],'')||''),phone:clean(field(c,['phone','phoneNumber','mobile'],'')||''),
   linkedin:clean(field(c,['linkedin','linkedinUrl'],'')||''),status:clean(field(c,['status','contactStatus'],'Active'))||'Active',
   buyingRole:role,influence:clean(field(c,['influence','influenceLevel'],'Unknown'))||'Unknown',relationshipStrength:clean(field(c,['relationshipStrength','strength'],'Unknown'))||'Unknown',
   sentiment:clean(field(c,['sentiment'],'Unknown'))||'Unknown',decisionMaker:decision,isPrimary:!!field(c,['isPrimary','primary'],false),
   authorityAreas:arr(field(c,['authorityAreas'],[])).length?arr(field(c,['authorityAreas'],[])):clean(field(c,['authorityAreas','authority'],'')).split(',').map(clean).filter(Boolean),
   preferredChannel:clean(field(c,['preferredChannel','contactPreference'],'')||''),bestTime:clean(field(c,['bestTime','bestContactTime'],'')||''),timezone:clean(field(c,['timezone'],'')||''),
   communicationStyle:clean(field(c,['communicationStyle'],'')||''),assistant:clean(field(c,['assistant'],'')||''),sourceDetail:clean(field(c,['source','contactSource'],'')||''),
   lastTouch:dt(field(c,['lastTouch','lastContact'],'')||''),nextTouch:dt(field(c,['nextTouch','nextContact'],'')||''),notes:clean(field(c,['relationshipNotes','notes','note'],'')||''),
   createdAt:dt(field(c,['createdAt','created'],'')||''),updatedAt:dt(field(c,['updatedAt','updated'],'')||''),history:arr(c.history),raw:c
  }
 }
 function mergedContacts(){
  var rows=connectedContacts().concat(localContacts()),map={};
  rows.forEach(function(c){
   var key=norm(c.company)+'|'+(c.email?c.email.toLowerCase():norm(c.name));
   if(!map[key])map[key]=c;
   else if(c.source==='local'){var old=map[key],x={};Object.keys(old).forEach(function(k){x[k]=old[k]});Object.keys(c).forEach(function(k){if(c[k]!=null&&c[k]!==''&&(!(Array.isArray(c[k]))||c[k].length))x[k]=c[k]});x.source='local';x.editable=true;map[key]=x}
  });
  return Object.keys(map).map(function(k){return map[k]})
 }
 function localActivities(){
  var b=repCrm(),out=[];
  Object.keys(b.data.accounts||{}).forEach(function(k){
   var a=b.data.accounts[k]||{},company=clean(a.profile&&a.profile.name)||k;
   arr(a.activities).forEach(function(x){if(!x)return;out.push({id:String(x.id||id('act')),source:'local',company:company,contactId:clean(x.contactId),contactName:clean(x.contactName),type:clean(x.type||'Activity'),subject:clean(x.subject||x.type||'Activity'),detail:clean(x.detail),date:dt(x.date||x.createdAt),outcome:clean(x.outcome),nextStep:clean(x.nextStep),nextDate:dt(x.nextDate),sentiment:clean(x.sentiment),createdAt:dt(x.createdAt)})})
  });
  return out
 }
 function connectedActivities(){
  var pools=[S&&S.customerActivities,S&&S.accountActivities,S&&S.crmActivities,S&&S.activities],known={};companies().forEach(function(x){known[norm(x)]=x});var out=[];
  pools.forEach(function(pool){arr(pool).forEach(function(x,i){if(!x||!repOkay(x))return;var company=companyOf(x);if(!company||!known[norm(company)])return;out.push({id:String(field(x,['id','activityId'],i)),source:'connected',company:company,contactId:clean(field(x,['contactId'],'')),contactName:clean(field(x,['contactName','contact'],'')||''),type:clean(field(x,['type','activityType'],'Activity')),subject:clean(field(x,['subject','title'],'Activity')),detail:clean(field(x,['detail','description','notes'],'')||''),date:dt(field(x,['date','activityDate','createdAt'],'')),outcome:clean(field(x,['outcome'],'')||''),nextStep:clean(field(x,['nextStep'],'')||''),nextDate:dt(field(x,['nextDate','followUpDate'],'')),sentiment:clean(field(x,['sentiment'],'')||'')})})});
  return out
 }
 function opportunities(){
  var b=repCrm(),out=[];
  Object.keys(b.data.accounts||{}).forEach(function(k){var a=b.data.accounts[k]||{},company=clean(a.profile&&a.profile.name)||k;arr(a.opportunities).forEach(function(o){if(!o)return;out.push(normalizeOpp(o,company,'local'))})});
  [S&&S.opportunities,S&&S.pipeline,S&&S.deals,S&&S.crmOpportunities].forEach(function(pool){arr(pool).forEach(function(o){if(!o||!repOkay(o)||!companyOf(o))return;out.push(normalizeOpp(o,companyOf(o),'connected'))})});
  return out
 }
 function normalizeOpp(o,company,source){
  var stage=clean(field(o,['stage','status','pipelineStage'],'New Opportunity'));
  return{id:String(field(o,['id','opportunityId','dealId'],id('op'))),company:company,source:source,title:clean(field(o,['title','name','opportunityName','dealName'],'Opportunity')),stage:stage,amount:n(field(o,['amount','value','estimatedValue','revenue'],0)),primaryContactId:clean(field(o,['primaryContactId','contactId'],'')),primaryContact:clean(field(o,['primaryContact','contactName'],'')),nextStep:clean(field(o,['nextStep','nextAction'],'')),nextStepDate:dt(field(o,['nextStepDate','followUpDate'],'')),closed:/^won$|^lost$/i.test(stage)}
 }
 function orderMetrics(){
  var year=Number(getYr()),map={};
  arr(S&&S.orders).forEach(function(o){if(!o||o.rep!==_rp2.rep||o.kind!=='order'||!clean(o.customer))return;var k=norm(o.customer),x=map[k]||(map[k]={lifetime:0,year:0,orders:0,last:null});x.lifetime+=n(o.total);x.orders++;var d=dt(o.orderDate||o.date||o.enteredAt);if(d&&d.getFullYear()===year)x.year+=n(o.total);if(d&&(!x.last||d>x.last))x.last=d});
  return map
 }
 function touchMatches(a,c){
  if(a.contactId&&String(a.contactId)===String(c.id))return true;
  if(a.contactName&&norm(a.contactName)===norm(c.name)&&norm(a.company)===norm(c.company))return true;
  return false
 }
 function contactScore(c,acts,opps){
  var score=0,last=c.lastTouch,relatedActs=acts.filter(function(a){return touchMatches(a,c)});
  relatedActs.forEach(function(a){if(a.date&&(!last||a.date>last))last=a.date});
  if(c.status==='Active')score+=5;if(c.email)score+=8;if(c.phone)score+=8;if(c.isPrimary)score+=14;if(c.decisionMaker)score+=15;
  if(c.buyingRole&&c.buyingRole!=='Unknown')score+=10;if(c.influence==='High')score+=9;else if(c.influence==='Medium')score+=5;
  if(c.relationshipStrength==='Strong')score+=10;else if(c.relationshipStrength==='Developing')score+=5;
  var age=last?days(last,now()):null;if(age!=null&&age<=30)score+=12;else if(age!=null&&age<=60)score+=7;else if(age!=null&&age<=90)score+=3;
  if(c.nextTouch)score+=8;if(opps.length)score+=8;if(c.authorityAreas.length)score+=5;
  return clamp(score,0,100)
 }
 function enrichContacts(rows,acts,opps,orders){
  return rows.map(function(c){
   var x={};Object.keys(c).forEach(function(k){x[k]=c[k]});
   x.activities=acts.filter(function(a){return touchMatches(a,x)}).sort(function(a,b){return (b.date?b.date.getTime():0)-(a.date?a.date.getTime():0)});
   x.linkedOpps=opps.filter(function(o){return norm(o.company)===norm(x.company)&&((o.primaryContactId&&String(o.primaryContactId)===String(x.id))||(o.primaryContact&&norm(o.primaryContact)===norm(x.name)))});
   var last=x.lastTouch;x.activities.forEach(function(a){if(a.date&&(!last||a.date>last))last=a.date});x.lastTouch=last;
   if(!x.nextTouch){var next=x.activities.filter(function(a){return a.nextDate&&a.nextDate>=now()}).sort(function(a,b){return a.nextDate-b.nextDate})[0];if(next)x.nextTouch=next.nextDate}
   x.daysSinceTouch=x.lastTouch?Math.max(0,days(x.lastTouch,now())):null;x.touchState=x.nextTouch?(x.nextTouch<now()?'Overdue':iso(x.nextTouch)===iso(now())?'Today':days(now(),x.nextTouch)<=7?'Next 7 Days':'Scheduled'):'Unscheduled';
   x.score=contactScore(x,acts,x.linkedOpps);x.companyMetrics=orders[norm(x.company)]||{lifetime:0,year:0,orders:0,last:null};
   x.risks=[];if(x.status==='Left Company'&&x.isPrimary)x.risks.push('Primary contact left company');if(x.status==='Do Not Contact')x.risks.push('Do not contact');if(!x.email&&!x.phone)x.risks.push('No direct contact method');if(x.daysSinceTouch==null)x.risks.push('No touch history');else if(x.daysSinceTouch>90)x.risks.push('90+ days since touch');if(!x.nextTouch&&x.linkedOpps.some(function(o){return !o.closed}))x.risks.push('Open opportunity without next touch');
   return x
  }).sort(function(a,b){return b.score-a.score||a.company.localeCompare(b.company)||a.name.localeCompare(b.name)})
 }
 function companyCoverage(company,contacts,opps,orders){
  var rows=contacts.filter(function(c){return norm(c.company)===norm(company)&&c.status!=='Left Company'}),open=opps.filter(function(o){return norm(o.company)===norm(company)&&!o.closed}),hasPrimary=rows.some(function(c){return c.isPrimary}),hasDM=rows.some(function(c){return c.decisionMaker||c.buyingRole==='Economic Buyer'||c.buyingRole==='Decision Maker'}),hasBudget=rows.some(function(c){return c.buyingRole==='Budget Approver'||c.buyingRole==='Economic Buyer'||c.authorityAreas.some(function(a){return /budget|price|finance/i.test(a)})}),hasArt=rows.some(function(c){return c.buyingRole==='Art Approver'||c.authorityAreas.some(function(a){return /art|logo|creative/i.test(a)})}),hasChampion=rows.some(function(c){return c.buyingRole==='Champion'}),hasNext=rows.some(function(c){return c.nextTouch&&c.nextTouch>=now()}),multi=rows.length>=2;
  var score=(rows.length?10:0)+(hasPrimary?15:0)+(hasDM?20:0)+(hasBudget?12:0)+(hasArt?10:0)+(hasChampion?12:0)+(hasNext?11:0)+(multi?10:0);
  var risks=[];function add(level,icon,title,copy,weight){risks.push({level:level,icon:icon,title:title,copy:copy,weight:weight,company:company})}
  if(!rows.length)add('high','👤','No contacts recorded','The account has no current contact relationship.',50);
  if(rows.length===1)add('high','🧵','Single-contact dependency','The account depends on one active contact.',38);
  if(!hasPrimary&&rows.length)add('medium','📌','Primary contact missing','No contact is marked as the routine relationship owner.',20);
  if(!hasDM&&rows.length)add('high','🔑','Decision access unknown','No decision-maker or economic buyer is identified.',36);
  if(!hasBudget&&open.length)add('medium','💰','Budget authority unknown','Open pipeline exists without known budget approval access.',24);
  if(!hasArt&&open.some(function(o){return /quote|customer review|approval|art|verbal|order/i.test(o.stage)}))add('medium','🎨','Art approval access unknown','A later-stage opportunity lacks a known art or creative approver.',22);
  if(!hasNext&&open.length)add('high','📅','No scheduled relationship step','Open pipeline exists without a future contact touch.',34);
  var primary=rows.filter(function(c){return c.isPrimary})[0];if(primary&&primary.daysSinceTouch!=null&&primary.daysSinceTouch>60)add('high','🧊','Primary relationship is stale',primary.daysSinceTouch+' days since the latest primary-contact touch.',32);
  if(open.some(function(o){return !o.primaryContactId&&!o.primaryContact}))add('medium','🔗','Opportunity contact not linked','At least one open opportunity is not tied to a contact.',21);
  return{company:company,contacts:rows,openOpps:open,score:clamp(score,0,100),hasPrimary:hasPrimary,hasDM:hasDM,hasBudget:hasBudget,hasArt:hasArt,hasChampion:hasChampion,hasNext:hasNext,multi:multi,risks:risks,metrics:orders[norm(company)]||{lifetime:0,year:0,orders:0,last:null}}
 }
 function touchPlanner(contacts,acts){
  var rows=[];
  contacts.forEach(function(c){if(c.status==='Do Not Contact'||c.status==='Left Company')return;if(c.nextTouch)rows.push({id:'contact|'+c.key,type:'Contact next touch',company:c.company,contact:c.name,contactKey:c.key,date:c.nextTouch,title:'Follow up with '+c.name,copy:(c.buyingRole||'Contact')+' · '+c.company,icon:'📅',source:'Contact record'})});
  acts.forEach(function(a){if(a.nextDate)rows.push({id:'activity|'+a.id,type:'Activity follow-up',company:a.company,contact:a.contactName,contactId:a.contactId,date:a.nextDate,title:a.nextStep||('Follow up on '+a.subject),copy:a.subject+' · '+a.company,icon:'🔁',source:a.source==='local'?'Local activity':'Connected activity'})});
  var seen={};return rows.filter(function(r){var k=norm(r.company)+'|'+norm(r.contact||'')+'|'+iso(r.date)+'|'+norm(r.title);if(seen[k])return false;seen[k]=1;return true}).map(function(r){r.state=r.date<now()?'Overdue':iso(r.date)===iso(now())?'Today':days(now(),r.date)<=7?'Next 7 Days':'Upcoming';return r}).sort(function(a,b){return a.date-b.date})
 }
 function build(){
  var acts=localActivities().concat(connectedActivities()),opps=opportunities(),orderMap=orderMetrics(),contacts=enrichContacts(mergedContacts(),acts,opps,orderMap),companyNames=companies(),coverages=companyNames.map(function(c){return companyCoverage(c,contacts,opps,orderMap)}),risks=[];
  coverages.forEach(function(c){c.risks.forEach(function(r){risks.push(r)})});risks.sort(function(a,b){return b.weight-a.weight||a.company.localeCompare(b.company)});
  var touches=touchPlanner(contacts,acts),avgCoverage=coverages.length?coverages.reduce(function(s,c){return s+c.score},0)/coverages.length:0,dm=contacts.filter(function(c){return c.decisionMaker||c.buyingRole==='Economic Buyer'||c.buyingRole==='Decision Maker'}),stale=contacts.filter(function(c){return c.daysSinceTouch==null||c.daysSinceTouch>90}),unlinked=opps.filter(function(o){return !o.closed&&!o.primaryContactId&&!o.primaryContact});
  return{contacts:contacts,activities:acts,opportunities:opps,companies:companyNames,coverages:coverages,risks:risks,touches:touches,orders:orderMap,avgCoverage:Math.round(avgCoverage),decisionContacts:dm,stale:stale,unlinkedOpps:unlinked,view:viewBucket()}
 }
 function sectionHead(kick,title,note){return '<div class="ct3-section-head"><div><div class="ct3-section-kick">'+kick+'</div><div class="ct3-section-title">'+title+'</div></div><div class="ct3-section-note">'+note+'</div></div>'}
 function kpi(label,value,sub){return '<div class="ct3-kpi"><div class="ct3-kpi-label">'+esc(label)+'</div><div class="ct3-kpi-value">'+value+'</div><div class="ct3-kpi-sub">'+sub+'</div></div>'}
 function tabBar(active){return '<div class="ct3-tabs-wrap"><div class="ct3-tabs">'+TABS.map(function(t){return '<button class="ct3-tab '+(t[0]===active?'active':'')+'" onclick="_rp2ContactsSetTab(\''+t[0]+'\')">'+t[2]+' '+t[1]+'</button>'}).join('')+'</div></div>'}
 function empty(title,copy){return '<div class="ct3-empty"><strong>'+esc(title)+'</strong><span>'+esc(copy)+'</span></div>'}
 function posture(g){
  if(!g.contacts.length)return{tone:'info',title:'The relationship database is ready for its first contact',copy:'Add a contact, identify their buying role, and schedule the next touch.'};
  if(g.risks.filter(function(r){return r.level==='high'}).length)return{tone:'risk',title:'Relationship coverage needs attention',copy:g.risks.filter(function(r){return r.level==='high'}).length+' high-priority coverage gap'+(g.risks.filter(function(r){return r.level==='high'}).length===1?' is':'s are')+' active across the account portfolio.'};
  if(g.avgCoverage>=80)return{tone:'good',title:'The portfolio is well multi-threaded',copy:'Decision access, primary ownership, and scheduled contact coverage are strong across the recorded accounts.'};
  return{tone:'warn',title:'The contact book is useful but not fully covered',copy:'The next gains come from decision access, multiple relationships, and scheduled next touches.'}
 }
 function priorityRows(g){
  var out=[];
  g.risks.slice(0,5).forEach(function(r){out.push({level:r.level,icon:r.icon,title:r.title+' · '+r.company,copy:r.copy,company:r.company,side:r.level==='high'?'High priority':'Coverage gap'})});
  g.touches.filter(function(t){return t.state==='Overdue'||t.state==='Today'}).slice(0,3).forEach(function(t){out.push({level:t.state==='Overdue'?'high':'medium',icon:t.icon,title:t.title,copy:t.copy+' · '+fmt(t.date),company:t.company,side:t.state})});
  return out.slice(0,7)
 }
 function commandView(g){
  var p=posture(g),priorities=priorityRows(g),best=g.coverages.slice().sort(function(a,b){return b.score-a.score})[0],weak=g.coverages.slice().sort(function(a,b){return a.score-b.score})[0];
  return sectionHead('Relationship command center','Decision access, relationship depth, and next-touch control','The center treats contacts as part of an account strategy—not an address book.')
   +'<div class="ct3-summary"><div class="ct3-summary-label">Portfolio interpretation</div><div class="ct3-summary-title">'+esc(p.title)+'</div><div class="ct3-summary-copy">'+esc(p.copy)+'</div></div>'
   +sectionHead('Highest-priority relationship moves','What deserves attention first','Coverage gaps and due contact promises are ranked by risk and timing.')
   +(priorities.length?'<div class="ct3-priority-list">'+priorities.map(function(r){return '<div class="ct3-priority '+r.level+'"><div class="ct3-priority-icon">'+r.icon+'</div><div><div class="ct3-priority-title">'+esc(r.title)+'</div><div class="ct3-priority-copy">'+esc(r.copy)+'</div></div><div class="ct3-priority-side">'+esc(r.side)+'<br><button class="ct3-mini-btn blue" onclick="_rp2ContactsOpenCompany(\''+encodeURIComponent(r.company)+'\')">Open company</button></div></div>'}).join('')+'</div>':empty('No immediate relationship priorities','The active account and touch records do not currently create a high-priority alert.'))
   +sectionHead('Portfolio relationship coverage','Where the relationship network is strongest and weakest','Coverage rewards primary ownership, decision access, budget and art approval, champions, multiple contacts, and scheduled next touches.')
   +'<div class="ct3-grid-3"><div class="ct3-summary"><div class="ct3-summary-label">Strongest coverage</div><div class="ct3-summary-title">'+esc(best?best.company:'—')+'</div><div class="ct3-summary-copy">'+(best?best.score+'/100 relationship coverage with '+best.contacts.length+' active contacts.':'No company records are available.')+'</div></div><div class="ct3-summary"><div class="ct3-summary-label">Largest coverage gap</div><div class="ct3-summary-title">'+esc(weak?weak.company:'—')+'</div><div class="ct3-summary-copy">'+(weak?weak.score+'/100 · '+weak.risks.length+' active coverage warnings.':'No company records are available.')+'</div></div><div class="ct3-summary"><div class="ct3-summary-label">Unlinked opportunity contacts</div><div class="ct3-summary-title">'+g.unlinkedOpps.length+'</div><div class="ct3-summary-copy">Open opportunities without a primary contact ID or name.</div></div></div>'
   +sectionHead('Coverage chart','Relationship coverage by company','The chart uses the current CRM and connected contact state, while selected-year revenue remains context only.')
   +'<div class="ct3-panel"><div class="ct3-chart"><canvas id="ct3-chart"></canvas></div></div>'
 }
 function filterBar(g){
  var companies=g.companies;
  return '<div class="ct3-filterbar"><input id="ct3-search" type="search" placeholder="Search contact, company, title, email…" oninput="_rp2ContactsApplyFilters()"><select id="ct3-company" onchange="_rp2ContactsApplyFilters()"><option value="">All companies</option>'+companies.map(function(c){return '<option value="'+esc(c)+'">'+esc(c)+'</option>'}).join('')+'</select><select id="ct3-role" onchange="_rp2ContactsApplyFilters()"><option value="">All buying roles</option>'+BUYING_ROLES.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('')+'</select><select id="ct3-strength" onchange="_rp2ContactsApplyFilters()"><option value="">Any relationship</option>'+STRENGTH.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('')+'</select><select id="ct3-touch-filter" onchange="_rp2ContactsApplyFilters()"><option value="">Any touch state</option><option>Overdue</option><option>Today</option><option>Next 7 Days</option><option>Scheduled</option><option>Unscheduled</option></select><div id="ct3-count" class="ct3-filtercount">'+g.contacts.length+' shown</div></div>'
 }
 function contactCard(c){
  return '<div class="ct3-contact '+(c.isPrimary?'primary ':'')+(c.risks.length?'risk':'')+'" data-ct512="1" data-company="'+esc(c.company)+'" data-role="'+esc(c.buyingRole)+'" data-strength="'+esc(c.relationshipStrength)+'" data-touch="'+esc(c.touchState)+'" data-search="'+esc((c.name+' '+c.company+' '+c.title+' '+c.department+' '+c.email+' '+c.buyingRole+' '+c.notes).toLowerCase())+'"><div class="ct3-contact-source">'+(c.source==='connected'?'Connected':'Local CRM')+'</div><div class="ct3-contact-top"><div class="ct3-avatar">'+initials(c.name)+'</div><div><div class="ct3-contact-name" onclick="_rp2ContactsOpen(\''+encodeURIComponent(c.key)+'\')">'+esc(c.name)+'</div><div class="ct3-contact-company" onclick="_rp2ContactsOpenCompany(\''+encodeURIComponent(c.company)+'\')">'+esc(c.company)+'</div><div class="ct3-contact-title">'+esc([c.title,c.department].filter(Boolean).join(' · ')||'Title not recorded')+'</div></div></div><div class="ct3-tags">'+(c.isPrimary?'<span class="ct3-tag good">Primary</span>':'')+(c.decisionMaker?'<span class="ct3-tag good">Decision access</span>':'')+'<span class="ct3-tag info">'+esc(c.buyingRole)+'</span><span class="ct3-tag">'+esc(c.influence+' influence')+'</span><span class="ct3-tag '+(c.relationshipStrength==='Strong'?'good':c.relationshipStrength==='Weak'?'risk':'')+'">'+esc(c.relationshipStrength)+'</span>'+(c.status!=='Active'?'<span class="ct3-tag risk">'+esc(c.status)+'</span>':'')+'</div>'+(c.email?'<div class="ct3-contact-line">✉ <a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a></div>':'')+(c.phone?'<div class="ct3-contact-line">☎ <a href="tel:'+esc(c.phone)+'">'+esc(c.phone)+'</a></div>':'')+'<div class="ct3-contact-line">Last touch: '+fmt(c.lastTouch)+' · Next: '+fmt(c.nextTouch)+'</div><div class="ct3-contact-line">'+c.linkedOpps.length+' linked opportunities · '+c.activities.length+' recorded activities</div><div class="ct3-score-row"><span>Relationship readiness</span><strong>'+c.score+'/100</strong></div><div class="ct3-bar"><span style="width:'+c.score+'%"></span></div><div class="ct3-card-actions"><button class="ct3-mini-btn blue" onclick="_rp2ContactsOpen(\''+encodeURIComponent(c.key)+'\')">Profile</button><button class="ct3-mini-btn good" onclick="_rp2ContactsFollowUp(\''+encodeURIComponent(c.key)+'\')">Follow up</button><button class="ct3-mini-btn" onclick="_rp2ContactsLogTouch(\''+encodeURIComponent(c.key)+'\')">Log touch</button></div></div>'
 }
 function directoryView(g){
  return sectionHead('Contact directory','Every relationship across every company','Local CRM contacts can be edited. Connected contacts remain read-only while still contributing to decision coverage and activity context.')
   +'<div class="ct3-actions" style="margin-top:0"><button class="ct3-btn primary" onclick="_rp2ContactsNew()">＋ Add contact</button></div>'
   +filterBar(g)
   +(g.contacts.length?'<div class="ct3-contact-grid">'+g.contacts.map(contactCard).join('')+'</div>':empty('No contacts are recorded','Add the first contact or connect a contact source to begin the relationship database.'))
 }
 function laneContacts(rows,title){
  if(!rows.length)return '<div class="ct3-lane-empty">No contact currently fills this role.</div>';
  return rows.slice(0,6).map(function(c){return '<div class="ct3-lane-contact" onclick="_rp2ContactsOpen(\''+encodeURIComponent(c.key)+'\')"><strong>'+esc(c.name)+'</strong><span>'+esc(c.buyingRole+' · '+c.relationshipStrength+' · '+(c.nextTouch?'Next '+fmt(c.nextTouch):'No next touch'))+'</span></div>'}).join('')
 }
 function mapView(g){
  return sectionHead('Decision map','Who approves, influences, champions, executes, and blocks','The map helps the rep see whether an account is multi-threaded and whether the correct authority is known.')
   +'<div class="ct3-map-list">'+g.coverages.map(function(co){
    var decision=co.contacts.filter(function(c){return c.decisionMaker||['Economic Buyer','Decision Maker','Budget Approver'].indexOf(c.buyingRole)>=0});
    var influence=co.contacts.filter(function(c){return ['Champion','Influencer'].indexOf(c.buyingRole)>=0});
    var execution=co.contacts.filter(function(c){return ['Art Approver','Procurement','Operations','User'].indexOf(c.buyingRole)>=0});
    var risk=co.contacts.filter(function(c){return c.buyingRole==='Blocker'||c.status!=='Active'||c.relationshipStrength==='Weak'});
    return '<div class="ct3-map-account"><div class="ct3-map-head"><div><div class="ct3-map-name" onclick="_rp2ContactsOpenCompany(\''+encodeURIComponent(co.company)+'\')">'+esc(co.company)+'</div><div class="ct3-map-meta">'+co.contacts.length+' active contacts · '+co.openOpps.length+' open opportunities · '+money(co.metrics.year)+' selected-year revenue</div></div><div class="ct3-map-score">'+co.score+'<small>coverage / 100</small></div></div><div class="ct3-lanes"><div class="ct3-lane"><div class="ct3-lane-title">Decision authority</div>'+laneContacts(decision)+'</div><div class="ct3-lane"><div class="ct3-lane-title">Champions & influence</div>'+laneContacts(influence)+'</div><div class="ct3-lane"><div class="ct3-lane-title">Execution & approval</div>'+laneContacts(execution)+'</div><div class="ct3-lane"><div class="ct3-lane-title">Relationship risk</div>'+laneContacts(risk)+'</div></div></div>'
   }).join('')+'</div>'
 }
 function touchView(g){
  var overdue=g.touches.filter(function(t){return t.state==='Overdue'}),today=g.touches.filter(function(t){return t.state==='Today'}),week=g.touches.filter(function(t){return t.state==='Next 7 Days'}),future=g.touches.filter(function(t){return t.state==='Upcoming'});
  function block(kick,title,rows){
   return sectionHead(kick,title,rows.length+' scheduled relationship item'+(rows.length===1?'':'s'))+(rows.length?'<div class="ct3-touch-list">'+rows.map(function(t){return '<div class="ct3-touch '+(t.state==='Overdue'?'overdue':t.state==='Today'?'today':'')+'"><div class="ct3-touch-icon">'+t.icon+'</div><div><div class="ct3-touch-title">'+esc(t.title)+'</div><div class="ct3-touch-copy">'+esc(t.copy)+' · '+esc(t.source)+'</div></div><div class="ct3-touch-side">'+fmt(t.date)+'<br><button class="ct3-mini-btn good" onclick="_rp2ContactsScheduleFromTouch(\''+encodeURIComponent(t.id)+'\')">Action Center</button></div></div>'}).join('')+'</div>':empty('Nothing in this window','No contact or activity follow-up is scheduled here.'))
  }
  return block('Immediate','Overdue relationship promises',overdue)+block('Today','Due today',today)+block('Near term','Next seven days',week)+block('Future','Later scheduled touches',future.slice(0,30))
 }
 function riskView(g){
  return sectionHead('Relationship risk center','Accounts that could fail because access or follow-through is incomplete','Warnings are based on contact coverage and opportunity linkage—not assumptions about the customer’s intent.')
   +(g.risks.length?'<div class="ct3-risk-list">'+g.risks.map(function(r){return '<div class="ct3-risk-row '+r.level+'"><div class="ct3-risk-icon">'+r.icon+'</div><div><div class="ct3-risk-title">'+esc(r.title+' · '+r.company)+'</div><div class="ct3-risk-copy">'+esc(r.copy)+'</div></div><div class="ct3-risk-side">'+(r.level==='high'?'High priority':'Coverage warning')+'<br><button class="ct3-mini-btn blue" onclick="_rp2ContactsOpenCompany(\''+encodeURIComponent(r.company)+'\')">Open account</button></div></div>'}).join('')+'</div>':empty('No relationship risks are active','All current company records meet the modeled decision-access and touch-coverage rules.'))
 }
 function countBy(rows,fn){
  var map={};rows.forEach(function(x){var k=fn(x)||'Unknown';map[k]=(map[k]||0)+1});return Object.keys(map).map(function(k){return{name:k,value:map[k]}}).sort(function(a,b){return b.value-a.value})
 }
 function insightsView(g){
  var roles=countBy(g.contacts,function(c){return c.buyingRole}),channels=countBy(g.contacts,function(c){return c.preferredChannel||'Not recorded'}),strengths=countBy(g.contacts,function(c){return c.relationshipStrength}),topRole=roles[0],topChannel=channels[0];
  return sectionHead('Contact intelligence','Patterns in relationship depth, authority, touch cadence, and communication','These insights summarize the logged-in rep’s contact book and do not compare private contact records across reps.')
   +'<div class="ct3-insight-grid"><div class="ct3-insight"><div class="ct3-insight-icon">🔑</div><div class="ct3-insight-label">Decision-access contacts</div><div class="ct3-insight-value">'+g.decisionContacts.length+'</div><div class="ct3-insight-copy">'+g.coverages.filter(function(c){return c.hasDM}).length+' of '+g.coverages.length+' accounts have identified decision access.</div></div><div class="ct3-insight"><div class="ct3-insight-icon">🧵</div><div class="ct3-insight-label">Multi-threaded accounts</div><div class="ct3-insight-value">'+g.coverages.filter(function(c){return c.multi}).length+'</div><div class="ct3-insight-copy">Accounts with at least two active contacts.</div></div><div class="ct3-insight"><div class="ct3-insight-icon">🧊</div><div class="ct3-insight-label">Stale or untouched contacts</div><div class="ct3-insight-value">'+g.stale.length+'</div><div class="ct3-insight-copy">No recorded touch or more than 90 days since the latest touch.</div></div><div class="ct3-insight"><div class="ct3-insight-icon">📅</div><div class="ct3-insight-label">Next-touch coverage</div><div class="ct3-insight-value">'+g.contacts.filter(function(c){return c.nextTouch}).length+'/'+g.contacts.length+'</div><div class="ct3-insight-copy">Contacts with a future or overdue next-touch date.</div></div><div class="ct3-insight"><div class="ct3-insight-icon">👤</div><div class="ct3-insight-label">Most common buying role</div><div class="ct3-insight-value">'+esc(topRole?topRole.name:'—')+'</div><div class="ct3-insight-copy">'+(topRole?topRole.value+' contacts':'No contact role data')+'</div></div><div class="ct3-insight"><div class="ct3-insight-icon">✉</div><div class="ct3-insight-label">Preferred channel leader</div><div class="ct3-insight-value">'+esc(topChannel?topChannel.name:'—')+'</div><div class="ct3-insight-copy">'+(topChannel?topChannel.value+' contacts':'No channel preference data')+'</div></div><div class="ct3-insight"><div class="ct3-insight-icon">🔗</div><div class="ct3-insight-label">Unlinked open opportunities</div><div class="ct3-insight-value">'+g.unlinkedOpps.length+'</div><div class="ct3-insight-copy">Open opportunities without a contact linkage.</div></div><div class="ct3-insight"><div class="ct3-insight-icon">💬</div><div class="ct3-insight-label">Recorded contact activities</div><div class="ct3-insight-value">'+g.activities.length+'</div><div class="ct3-insight-copy">Connected and local account activities associated with the rep’s companies.</div></div></div>'
   +sectionHead('Relationship distribution chart','Buying role and relationship-strength profile','The chart excludes other reps’ contacts.')
   +'<div class="ct3-grid-2"><div class="ct3-panel"><div class="ct3-chart"><canvas id="ct3-chart"></canvas></div></div><div class="ct3-panel"><div class="ct3-panel-title">Relationship strength mix</div><div class="ct3-panel-sub">Current contact classifications</div><div class="ct3-priority-list" style="margin-top:13px">'+strengths.map(function(x){return '<div class="ct3-priority"><div class="ct3-priority-icon">●</div><div><div class="ct3-priority-title">'+esc(x.name)+'</div><div class="ct3-priority-copy">'+x.value+' contacts</div></div><div class="ct3-priority-side">'+Math.round(x.value/Math.max(1,g.contacts.length)*100)+'%</div></div>'}).join('')+'</div></div></div>'
 }
 function historyView(g){
  var rows=[];
  arr(g.view.data.events).forEach(function(e){rows.push({date:dt(e.at),type:e.type,title:e.title,copy:e.copy})});
  g.activities.forEach(function(a){rows.push({date:a.date||a.createdAt,type:a.type||'Activity',title:a.subject||'Contact activity',copy:(a.contactName?a.contactName+' · ':'')+a.company+(a.outcome?' · '+a.outcome:'')})});
  g.contacts.forEach(function(c){arr(c.history).forEach(function(h){rows.push({date:dt(h.at||h.date),type:h.type||'Contact update',title:c.name+' · '+c.company,copy:h.copy||h.note||''})})});
  rows=rows.filter(function(r){return r.date}).sort(function(a,b){return b.date-a.date});
  return sectionHead('Relationship history','Contact creation, changes, activities, and scheduled relationship work','Local contact events and available connected activity dates are combined without changing the source records.')
   +(rows.length?'<div class="ct3-history">'+rows.slice(0,250).map(function(r){return '<div class="ct3-history-row"><div class="ct3-history-date">'+fmt(r.date)+'</div><div class="ct3-history-type">'+esc(r.type)+'</div><div class="ct3-history-title">'+esc(r.title)+'</div><div class="ct3-history-copy">'+esc(r.copy)+'</div></div>'}).join('')+'</div>':empty('No relationship history is recorded','Create a contact, log a touch, or schedule a follow-up to begin the history.'))
   +sectionHead('Relationship activity chart','Cumulative dated contact activity','The chart uses visible contact-center events and account activities.')
   +'<div class="ct3-panel"><div class="ct3-chart"><canvas id="ct3-chart"></canvas></div></div>'
 }
 function contactDetail(g,c){
  var auth=c.authorityAreas.length?c.authorityAreas.join(', '):'Not recorded',lastActivities=c.activities.slice(0,8),opps=c.linkedOpps;
  return '<div class="ct3-modal-wrap" onclick="if(event.target===this)_rp2ContactsCloseModal()"><aside class="ct3-modal"><div class="ct3-modal-head"><div><div class="ct3-modal-avatar">'+initials(c.name)+'</div><div class="ct3-modal-kick">'+esc(c.company+' · '+c.buyingRole+' · '+(c.source==='connected'?'Connected':'Local CRM'))+'</div><div class="ct3-modal-title">'+esc(c.name)+'</div><div class="ct3-modal-sub">'+esc([c.title,c.department,c.email,c.phone].filter(Boolean).join(' · ')||'Build the contact profile with role, authority, communication, and touch information.')+'</div></div><button class="ct3-close" onclick="_rp2ContactsCloseModal()">×</button></div><div class="ct3-detail-grid"><div class="ct3-detail"><div class="ct3-detail-label">Relationship readiness</div><div class="ct3-detail-value">'+c.score+'/100 · '+esc(c.relationshipStrength)+' relationship · '+esc(c.influence)+' influence</div><div class="ct3-bar"><span style="width:'+c.score+'%"></span></div></div><div class="ct3-detail"><div class="ct3-detail-label">Decision role</div><div class="ct3-detail-value">'+esc(c.buyingRole)+(c.decisionMaker?' · Identified decision access':'')+(c.isPrimary?' · Primary contact':'')+'</div></div><div class="ct3-detail"><div class="ct3-detail-label">Authority areas</div><div class="ct3-detail-value">'+esc(auth)+'</div></div><div class="ct3-detail"><div class="ct3-detail-label">Communication preference</div><div class="ct3-detail-value">'+esc([c.preferredChannel,c.bestTime,c.timezone].filter(Boolean).join(' · ')||'Not recorded')+'</div></div><div class="ct3-detail"><div class="ct3-detail-label">Last / next touch</div><div class="ct3-detail-value">'+fmt(c.lastTouch)+' · '+fmt(c.nextTouch)+' · '+esc(c.touchState)+'</div></div><div class="ct3-detail"><div class="ct3-detail-label">Linked business context</div><div class="ct3-detail-value">'+opps.length+' opportunities · '+money(c.companyMetrics.lifetime)+' lifetime account revenue · '+c.companyMetrics.orders+' recorded orders</div></div><div class="ct3-detail"><div class="ct3-detail-label">Relationship notes</div><div class="ct3-detail-value">'+esc(c.notes||'No relationship notes recorded.')+'</div></div><div class="ct3-detail"><div class="ct3-detail-label">Communication style</div><div class="ct3-detail-value">'+esc(c.communicationStyle||'Not recorded')+'</div></div></div>'
   +sectionHead('Linked opportunities','Deals where this contact is identified','Linking the correct contact makes decision access and relationship risk measurable.')
   +(opps.length?'<div class="ct3-priority-list">'+opps.map(function(o){return '<div class="ct3-priority"><div class="ct3-priority-icon">◆</div><div><div class="ct3-priority-title">'+esc(o.title)+'</div><div class="ct3-priority-copy">'+esc(o.stage)+' · '+money(o.amount)+' · '+esc(o.nextStep||'No next step')+'</div></div><div class="ct3-priority-side"><button class="ct3-mini-btn blue" onclick="_rp2Go(\'pipeline\')">Pipeline</button></div></div>'}).join('')+'</div>':empty('No opportunities are linked','Open the pipeline and assign this contact to the opportunity when appropriate.'))
   +sectionHead('Recent contact activity','Calls, emails, meetings, and next steps','Activities can come from connected data or the local company CRM.')
   +(lastActivities.length?'<div class="ct3-history">'+lastActivities.map(function(a){return '<div class="ct3-history-row"><div class="ct3-history-date">'+fmt(a.date)+'</div><div class="ct3-history-type">'+esc(a.type)+'</div><div class="ct3-history-title">'+esc(a.subject)+'</div><div class="ct3-history-copy">'+esc([a.outcome,a.detail,a.nextStep].filter(Boolean).join(' · '))+'</div></div>'}).join('')+'</div>':empty('No contact activity is recorded','Log the first conversation or connect an account activity source.'))
   +'<div class="ct3-disclosure"><strong>Contact privacy:</strong> this workspace only includes contacts associated with the logged-in rep’s local CRM accounts or connected companies. Connected contacts remain read-only.</div><div class="ct3-modal-actions"><button class="ct3-btn" onclick="_rp2ContactsCloseModal()">Close</button><button class="ct3-btn blue" onclick="_rp2ContactsOpenCompany(\''+encodeURIComponent(c.company)+'\')">Open company</button><button class="ct3-btn" onclick="_rp2ContactsLogTouch(\''+encodeURIComponent(c.key)+'\')">Log touch</button><button class="ct3-btn primary" onclick="_rp2ContactsFollowUp(\''+encodeURIComponent(c.key)+'\')">Schedule follow-up</button>'+(c.editable?'<button class="ct3-btn" onclick="_rp2ContactsEdit(\''+encodeURIComponent(c.key)+'\')">Edit contact</button>':'')+'</div></aside></div>'
 }
 function contactForm(g,c){
  var edit=!!c,company=c?c.company:(window._rp2ContactsFilters.company||''),roles=BUYING_ROLES,auth=(c&&c.authorityAreas||[]).join(', ');
  return '<div class="ct3-modal-wrap" onclick="if(event.target===this)_rp2ContactsCloseModal()"><aside class="ct3-modal"><div class="ct3-modal-head"><div><div class="ct3-modal-avatar">'+(c?initials(c.name):'+')+'</div><div class="ct3-modal-kick">'+(edit?'Edit local contact':'Create CRM contact')+'</div><div class="ct3-modal-title">'+(edit?esc(c.name):'Add a relationship to the CRM')+'</div><div class="ct3-modal-sub">Define the person’s business role, authority, influence, relationship state, and next-touch plan.</div></div><button class="ct3-close" onclick="_rp2ContactsCloseModal()">×</button></div><div class="ct3-form"><div class="ct3-form-grid"><div class="ct3-field"><label>Existing company</label><select id="ct3-f-company"><option value="">Choose company or enter a new one</option>'+g.companies.map(function(x){return '<option value="'+esc(x)+'" '+(company===x?'selected':'')+'>'+esc(x)+'</option>'}).join('')+'</select></div><div class="ct3-field"><label>New company name</label><input id="ct3-f-newcompany" placeholder="Only when company is not listed"></div></div><div class="ct3-form-grid"><div class="ct3-field"><label>Full name</label><input id="ct3-f-name" value="'+esc(c&&c.name||'')+'"></div><div class="ct3-field"><label>Contact status</label><select id="ct3-f-status">'+STATUS.map(function(x){return '<option '+((c&&c.status||'Active')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div></div><div class="ct3-form-grid"><div class="ct3-field"><label>Title</label><input id="ct3-f-title" value="'+esc(c&&c.title||'')+'"></div><div class="ct3-field"><label>Department</label><input id="ct3-f-dept" value="'+esc(c&&c.department||'')+'"></div></div><div class="ct3-form-grid"><div class="ct3-field"><label>Email</label><input id="ct3-f-email" type="email" value="'+esc(c&&c.email||'')+'"></div><div class="ct3-field"><label>Phone</label><input id="ct3-f-phone" value="'+esc(c&&c.phone||'')+'"></div></div><div class="ct3-form-grid"><div class="ct3-field"><label>Buying role</label><select id="ct3-f-role">'+roles.map(function(x){return '<option '+((c&&c.buyingRole||'Unknown')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div><div class="ct3-field"><label>Influence</label><select id="ct3-f-influence">'+INFLUENCE.map(function(x){return '<option '+((c&&c.influence||'Unknown')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div></div><div class="ct3-form-grid"><div class="ct3-field"><label>Relationship strength</label><select id="ct3-f-strength">'+STRENGTH.map(function(x){return '<option '+((c&&c.relationshipStrength||'Unknown')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div><div class="ct3-field"><label>Relationship markers</label><select id="ct3-f-kind"><option>Standard contact</option><option '+(c&&c.isPrimary&&!c.decisionMaker?'selected':'')+'>Primary contact</option><option '+(c&&c.decisionMaker&&!c.isPrimary?'selected':'')+'>Decision-maker</option><option '+(c&&c.decisionMaker&&c.isPrimary?'selected':'')+'>Primary decision-maker</option></select></div></div><div class="ct3-field"><label>Authority areas</label><input id="ct3-f-authority" value="'+esc(auth)+'" placeholder="Budget, product, art, timing, final approval"></div><div class="ct3-form-grid"><div class="ct3-field"><label>Preferred channel</label><select id="ct3-f-channel"><option value="">Not recorded</option>'+['Phone','Email','Text','Meeting','Video Call'].map(function(x){return '<option '+(c&&c.preferredChannel===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div><div class="ct3-field"><label>Best contact time</label><input id="ct3-f-besttime" value="'+esc(c&&c.bestTime||'')+'" placeholder="Morning, after 2 PM…"></div></div><div class="ct3-form-grid"><div class="ct3-field"><label>Last touch</label><input id="ct3-f-last" type="date" value="'+iso(c&&c.lastTouch)+'"></div><div class="ct3-field"><label>Next touch</label><input id="ct3-f-next" type="date" value="'+iso(c&&c.nextTouch)+'"></div></div><div class="ct3-form-grid"><div class="ct3-field"><label>LinkedIn / profile URL</label><input id="ct3-f-linkedin" value="'+esc(c&&c.linkedin||'')+'"></div><div class="ct3-field"><label>Timezone</label><input id="ct3-f-timezone" value="'+esc(c&&c.timezone||'')+'"></div></div><div class="ct3-field"><label>Communication style and business preferences</label><textarea id="ct3-f-style">'+esc(c&&c.communicationStyle||'')+'</textarea></div><div class="ct3-field"><label>Relationship notes</label><textarea id="ct3-f-notes">'+esc(c&&c.notes||'')+'</textarea></div></div><div class="ct3-modal-actions"><button class="ct3-btn" onclick="_rp2ContactsCloseModal()">Cancel</button>'+(edit?'<button class="ct3-btn" onclick="_rp2ContactsDelete(\''+encodeURIComponent(c.key)+'\')">Delete local contact</button>':'')+'<button class="ct3-btn primary" onclick="_rp2ContactsSave(\''+(edit?encodeURIComponent(c.key):'')+'\')">'+(edit?'Save changes':'Create contact')+'</button></div></aside></div>'
 }
 function activityForm(g,c){
  return '<div class="ct3-modal-wrap" onclick="if(event.target===this)_rp2ContactsCloseModal()"><aside class="ct3-modal"><div class="ct3-modal-head"><div><div class="ct3-modal-avatar">'+initials(c.name)+'</div><div class="ct3-modal-kick">Log contact activity</div><div class="ct3-modal-title">'+esc(c.name)+'</div><div class="ct3-modal-sub">'+esc(c.company+' · '+c.buyingRole)+'</div></div><button class="ct3-close" onclick="_rp2ContactsCloseModal()">×</button></div><div class="ct3-form"><div class="ct3-form-grid"><div class="ct3-field"><label>Activity type</label><select id="ct3-a-type">'+['Call','Email','Meeting','Video Call','Text','Voicemail','Note'].map(function(x){return '<option>'+x+'</option>'}).join('')+'</select></div><div class="ct3-field"><label>Activity date</label><input id="ct3-a-date" type="date" value="'+iso(now())+'"></div></div><div class="ct3-field"><label>Subject</label><input id="ct3-a-subject" value="Conversation with '+esc(c.name)+'"></div><div class="ct3-field"><label>Conversation detail</label><textarea id="ct3-a-detail"></textarea></div><div class="ct3-form-grid"><div class="ct3-field"><label>Outcome</label><input id="ct3-a-outcome" placeholder="Connected, quote requested, no current need…"></div><div class="ct3-field"><label>Sentiment</label><select id="ct3-a-sentiment"><option>Positive</option><option selected>Neutral</option><option>Concerned</option></select></div></div><div class="ct3-field"><label>Next step</label><input id="ct3-a-nextstep" placeholder="Send options, follow up after review…"></div><div class="ct3-field"><label>Next-touch date</label><input id="ct3-a-nextdate" type="date"></div></div><div class="ct3-modal-actions"><button class="ct3-btn" onclick="_rp2ContactsCloseModal()">Cancel</button><button class="ct3-btn primary" onclick="_rp2ContactsSaveActivity(\''+encodeURIComponent(c.key)+'\')">Save activity</button></div></aside></div>'
 }
 function followForm(g,c,due){
  return '<div class="ct3-modal-wrap" onclick="if(event.target===this)_rp2ContactsCloseModal()"><aside class="ct3-modal"><div class="ct3-modal-head"><div><div class="ct3-modal-avatar">'+initials(c.name)+'</div><div class="ct3-modal-kick">Schedule relationship action</div><div class="ct3-modal-title">'+esc(c.name)+'</div><div class="ct3-modal-sub">'+esc(c.company+' · '+c.buyingRole)+'</div></div><button class="ct3-close" onclick="_rp2ContactsCloseModal()">×</button></div><div class="ct3-form"><div class="ct3-field"><label>Action title</label><input id="ct3-u-title" value="Follow up with '+esc(c.name)+'"></div><div class="ct3-field"><label>Why this relationship step matters</label><textarea id="ct3-u-why">'+esc(c.decisionMaker?'Protect decision access and confirm the next buying step.':'Build relationship depth and confirm the next useful conversation.')+'</textarea></div><div class="ct3-field"><label>Due date</label><input id="ct3-u-date" type="date" value="'+esc(due||iso(c.nextTouch||now()))+'"></div><div class="ct3-field"><label>Success measure</label><input id="ct3-u-measure" value="Record the conversation result and the next contact date"></div></div><div class="ct3-modal-actions"><button class="ct3-btn" onclick="_rp2ContactsCloseModal()">Cancel</button><button class="ct3-btn primary" onclick="_rp2ContactsSaveFollowUp(\''+encodeURIComponent(c.key)+'\')">Add to Action Center</button></div></aside></div>'
 }
 function modalHTML(g){
  var m=window._rp2ContactsModal;if(!m)return '';
  var c=m.key?g.contacts.filter(function(x){return x.key===decodeURIComponent(m.key)})[0]:null;
  if(m.mode==='detail'&&c)return contactDetail(g,c);
  if(m.mode==='new')return contactForm(g,null);
  if(m.mode==='edit'&&c)return contactForm(g,c);
  if(m.mode==='activity'&&c)return activityForm(g,c);
  if(m.mode==='follow'&&c)return followForm(g,c,m.due||'');
  return ''
 }
 function render(){
  var page=document.getElementById('rp2-page');if(page)page.innerHTML=window._rp2ContactsV3();
  setTimeout(function(){try{window._rp2ContactsDraw();window._rp2ContactsApplyFilters()}catch(e){}},0)
 }
 function val(idv){var e=document.getElementById(idv);return e?clean(e.value):''}
 function contactByKey(g,key){return g.contacts.filter(function(c){return c.key===key})[0]||null}
 function localContactLocation(key){
  var parts=String(key||'').split('|');if(parts.length<2)return null;var accountKey=parts[0],cid=parts.slice(1).join('|'),b=repCrm(),a=b.data.accounts[accountKey];if(!a)return null;var idx=arr(a.contacts).findIndex(function(c){return c&&String(c.id)===String(cid)});return{bucket:b,accountKey:accountKey,account:a,index:idx,id:cid}
 }
 window._rp2ContactsSetTab=function(tab){window._rp2ContactsTab=tab;window._rp2ContactsModal=null;render();var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0}
 window._rp2ContactsNew=function(){window._rp2ContactsModal={mode:'new'};render()}
 window._rp2ContactsOpen=function(encoded){window._rp2ContactsModal={mode:'detail',key:encoded};render()}
 window._rp2ContactsEdit=function(encoded){window._rp2ContactsModal={mode:'edit',key:encoded};render()}
 window._rp2ContactsLogTouch=function(encoded){window._rp2ContactsModal={mode:'activity',key:encoded};render()}
 window._rp2ContactsFollowUp=function(encoded){window._rp2ContactsModal={mode:'follow',key:encoded};render()}
 window._rp2ContactsCloseModal=function(){window._rp2ContactsModal=null;render()}
 window._rp2ContactsSave=function(encoded){
  var g=build(),key=encoded?decodeURIComponent(encoded):'',existing=key?contactByKey(g,key):null,company=val('ct3-f-newcompany')||val('ct3-f-company'),name=val('ct3-f-name');if(!company||!name)return;
  var b=account(company,true),cid=existing&&existing.editable?existing.id:id('ct'),old=null,idx=arr(b.data.contacts).findIndex(function(c){return c&&String(c.id)===String(cid)});if(idx>=0)old=b.data.contacts[idx];
  var kind=val('ct3-f-kind'),obj={id:cid,source:'local',name:name,title:val('ct3-f-title'),department:val('ct3-f-dept'),email:val('ct3-f-email'),phone:val('ct3-f-phone'),linkedin:val('ct3-f-linkedin'),status:val('ct3-f-status')||'Active',buyingRole:val('ct3-f-role')||'Unknown',influence:val('ct3-f-influence')||'Unknown',relationshipStrength:val('ct3-f-strength')||'Unknown',decisionMaker:/Decision-maker/.test(kind)||['Economic Buyer','Decision Maker'].indexOf(val('ct3-f-role'))>=0,isPrimary:/Primary/.test(kind),authorityAreas:val('ct3-f-authority').split(',').map(clean).filter(Boolean),preferredChannel:val('ct3-f-channel'),bestTime:val('ct3-f-besttime'),timezone:val('ct3-f-timezone'),communicationStyle:val('ct3-f-style'),relationshipNotes:val('ct3-f-notes'),notes:val('ct3-f-notes'),lastTouch:val('ct3-f-last'),nextTouch:val('ct3-f-next'),history:arr(old&&old.history),createdAt:old&&old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  obj.history.push({type:old?'Contact updated':'Contact created',copy:(old?'Updated':'Created')+' '+name+' as '+obj.buyingRole+'.',at:obj.updatedAt});
  if(idx>=0)b.data.contacts[idx]=obj;else b.data.contacts.push(obj);
  if(obj.isPrimary)b.data.contacts.forEach(function(c){if(c.id!==obj.id)c.isPrimary=false});
  saveAccount(b);viewEvent(old?'Contact updated':'Contact created',name,company+' · '+obj.buyingRole,obj.id);window._rp2ContactsModal=null;render()
 }
 window._rp2ContactsDelete=function(encoded){
  var key=decodeURIComponent(encoded),loc=localContactLocation(key);if(!loc||loc.index<0)return;try{if(typeof confirm==='function'&&!confirm('Delete this local CRM contact?'))return}catch(e){}
  var c=loc.account.contacts[loc.index];loc.account.contacts.splice(loc.index,1);loc.bucket.data.accounts[loc.accountKey]=loc.account;loc.bucket.store.reps[_rp2.rep]=loc.bucket.data;localStorage.setItem(CRM_STORE,JSON.stringify(loc.bucket.store));viewEvent('Contact deleted',c.name,(loc.account.profile&&loc.account.profile.name)||loc.accountKey,c.id);window._rp2ContactsModal=null;render()
 }
 window._rp2ContactsSaveActivity=function(encoded){
  var key=decodeURIComponent(encoded),g=build(),c=contactByKey(g,key);if(!c)return;var b=account(c.company,true),obj={id:id('act'),source:'local',contactId:c.id,contactName:c.name,type:val('ct3-a-type')||'Activity',subject:val('ct3-a-subject')||('Conversation with '+c.name),detail:val('ct3-a-detail'),date:val('ct3-a-date')||iso(now()),outcome:val('ct3-a-outcome'),sentiment:val('ct3-a-sentiment'),nextStep:val('ct3-a-nextstep'),nextDate:val('ct3-a-nextdate'),createdAt:new Date().toISOString()};b.data.activities.push(obj);
  var idx=arr(b.data.contacts).findIndex(function(x){return x&&String(x.id)===String(c.id)});if(idx>=0){b.data.contacts[idx].lastTouch=obj.date;b.data.contacts[idx].sentiment=obj.sentiment;if(obj.nextDate)b.data.contacts[idx].nextTouch=obj.nextDate;b.data.contacts[idx].updatedAt=obj.createdAt;b.data.contacts[idx].history=arr(b.data.contacts[idx].history);b.data.contacts[idx].history.push({type:'Activity logged',copy:obj.type+' · '+obj.subject+(obj.outcome?' · '+obj.outcome:''),at:obj.createdAt})}
  saveAccount(b);viewEvent('Activity logged',c.name,obj.type+' · '+obj.subject,c.id);window._rp2ContactsModal=null;render()
 }
 window._rp2ContactsSaveFollowUp=function(encoded){
  var key=decodeURIComponent(encoded),g=build(),c=contactByKey(g,key);if(!c)return;var s=read(ACTION_STORE);if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};var b=s.reps[_rp2.rep]||(s.reps[_rp2.rep]={manual:[],state:{},events:[]}),due=val('ct3-u-date')||iso(now()),task={id:id('ctact'),source:'manual',category:'customer',tone:'info',score:170,title:val('ct3-u-title')||('Follow up with '+c.name),why:val('ct3-u-why'),action:'Contact '+c.name+' at '+c.company+' using '+(c.preferredChannel||'the best available channel')+'.',measure:val('ct3-u-measure'),dueDate:due,customer:c.company,contactId:c.id,contactName:c.name,orderNum:'',value:0,page:'contacts',contactKey:c.key};
  b.manual.push(task);b.events.push({type:'create',taskId:task.id,title:task.title,at:new Date().toISOString(),contactId:c.id,company:c.company});localStorage.setItem(ACTION_STORE,JSON.stringify(s));
  if(c.editable){var loc=localContactLocation(c.key);if(loc&&loc.index>=0){loc.account.contacts[loc.index].nextTouch=due;loc.account.contacts[loc.index].updatedAt=new Date().toISOString();loc.bucket.data.accounts[loc.accountKey]=loc.account;loc.bucket.store.reps[_rp2.rep]=loc.bucket.data;localStorage.setItem(CRM_STORE,JSON.stringify(loc.bucket.store))}}
  viewEvent('Follow-up scheduled',c.name,'Action Center · '+fmt(due)+' · '+c.company,c.id);window._rp2ContactsModal=null;render()
 }
 window._rp2ContactsScheduleFromTouch=function(encoded){
  var idv=decodeURIComponent(encoded),g=build(),t=g.touches.filter(function(x){return x.id===idv})[0];if(!t)return;var c=g.contacts.filter(function(x){return norm(x.company)===norm(t.company)&&((t.contactKey&&x.key===t.contactKey)||(t.contactId&&String(x.id)===String(t.contactId))||(t.contact&&norm(x.name)===norm(t.contact)))})[0];if(c){window._rp2ContactsModal={mode:'follow',key:encodeURIComponent(c.key),due:iso(t.date)};render()}else{window._rp2ContactsFilters.company=t.company;window._rp2ContactsTab='directory';render()}
 }
 window._rp2ContactsOpenCompany=function(encoded){
  var company=decodeURIComponent(encoded);window._rp2CompanyOpenKey=encodeURIComponent(norm(company));var b=account(company,true);b.data.profile=b.data.profile||{};b.data.profile.name=company;saveAccount(b);window._rp2CompanyProfileTab='contacts';window._rp2CompanyCRMModal=null;_rp2Go('customers')
 }
 window._rp2ContactsApplyFilters=function(){
  try{
   var q=clean((document.getElementById('ct3-search')||{}).value).toLowerCase(),company=clean((document.getElementById('ct3-company')||{}).value),role=clean((document.getElementById('ct3-role')||{}).value),strength=clean((document.getElementById('ct3-strength')||{}).value),touch=clean((document.getElementById('ct3-touch-filter')||{}).value),cards=arr(document.querySelectorAll?document.querySelectorAll('#rp2-page [data-ct512="1"]'):[]),shown=0;
   cards.forEach(function(card){var ok=(!q||String(card.getAttribute('data-search')||'').indexOf(q)>=0)&&(!company||card.getAttribute('data-company')===company)&&(!role||card.getAttribute('data-role')===role)&&(!strength||card.getAttribute('data-strength')===strength)&&(!touch||card.getAttribute('data-touch')===touch);card.style.display=ok?'block':'none';if(ok)shown++});
   var count=document.getElementById('ct3-count');if(count)count.textContent=shown+' shown'
  }catch(e){}
 }
 window._rp2ContactsCopyPlan=function(){
  var g=build(),rows=priorityRows(g).slice(0,8),txt='RELATIONSHIP PLAN — '+_rp2.rep+'\n\nContacts: '+g.contacts.length+'\nDecision-access contacts: '+g.decisionContacts.length+'\nAverage company coverage: '+g.avgCoverage+'/100\nHigh-priority risks: '+g.risks.filter(function(r){return r.level==='high'}).length+'\n\nNEXT MOVES\n';
  rows.forEach(function(r,i){txt+=(i+1)+'. '+r.title+'\n   '+r.copy+'\n\n'});
  try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt);else prompt('Copy relationship plan:',txt)}catch(e){prompt('Copy relationship plan:',txt)}
 }
 window._rp2ContactsOpenCompanyFilter=function(encoded){
  window._rp2ContactsFilters.company=decodeURIComponent(encoded);window._rp2ContactsTab='directory';render();setTimeout(function(){var e=document.getElementById('ct3-company');if(e)e.value=window._rp2ContactsFilters.company;window._rp2ContactsApplyFilters()},0)
 }

 window._rp2ContactsV3=function(){
  try{
   var g=build(),tab=window._rp2ContactsTab,p=posture(g),overdue=g.touches.filter(function(t){return t.state==='Overdue'}).length,today=g.touches.filter(function(t){return t.state==='Today'}).length,high=g.risks.filter(function(r){return r.level==='high'}).length;
   var hero='<div class="ct3-hero"><div class="ct3-hero-grid"><div><div class="ct3-kick">Contacts & Decision-Maker Center 3.0 · RELATIONSHIP CRM · BUILD v512</div><div class="ct3-title">Know who decides, who influences, and who needs the next conversation</div><div class="ct3-copy">Manage every contact across the CRM with buying role, authority, influence, relationship strength, communication preferences, touch history, next steps, opportunity linkage, and account-level decision coverage.</div><div class="ct3-pills"><span class="ct3-pill '+p.tone+'">'+esc(p.title)+'</span><span class="ct3-pill info">'+g.decisionContacts.length+' decision-access contacts</span><span class="ct3-pill">'+g.coverages.filter(function(c){return c.multi}).length+' multi-threaded accounts</span><span class="ct3-pill">Local edits · this device</span></div><div class="ct3-actions"><button class="ct3-btn primary" onclick="_rp2ContactsNew()">＋ Add contact</button><button class="ct3-btn blue" onclick="_rp2ContactsCopyPlan()">Copy relationship plan</button><button class="ct3-btn" onclick="_rp2Go(\'pipeline\')">Open Pipeline</button></div></div><div class="ct3-brief"><div><div class="ct3-brief-label">Average account relationship coverage</div><div class="ct3-brief-score">'+g.avgCoverage+'<span>/100</span></div><div class="ct3-brief-title">'+g.contacts.length+' known contacts across '+g.companies.length+' companies</div><div class="ct3-brief-copy">Coverage rewards decision access, primary ownership, budget and art authority, champions, relationship depth, and scheduled next touches.</div></div><div class="ct3-brief-foot"><span>Overdue touches <strong>'+overdue+'</strong></span><span>High-priority gaps <strong>'+high+'</strong></span></div></div></div></div>';
   var kpis='<div class="ct3-kpis">'
    +kpi('Known contacts',String(g.contacts.length),g.contacts.filter(function(c){return c.source==='local'}).length+' local · '+g.contacts.filter(function(c){return c.source==='connected'}).length+' connected')
    +kpi('Decision access',String(g.decisionContacts.length),g.coverages.filter(function(c){return c.hasDM}).length+' accounts covered')
    +kpi('Primary contacts',String(g.contacts.filter(function(c){return c.isPrimary}).length),g.coverages.filter(function(c){return c.hasPrimary}).length+' accounts covered')
    +kpi('Multi-threaded accounts',String(g.coverages.filter(function(c){return c.multi}).length),g.coverages.filter(function(c){return !c.multi}).length+' single/no-contact accounts')
    +kpi('Overdue touches',String(overdue),today+' due today')
    +kpi('Stale contacts',String(g.stale.length),'No touch or 90+ days')
    +kpi('Unlinked opportunities',String(g.unlinkedOpps.length),'Open deals without contact linkage')
    +kpi('Selected-year account value',money(Object.keys(g.orders).reduce(function(s,k){return s+n(g.orders[k].year)},0)),getYr()+' primary-order revenue context')
    +'</div>';
   var content=tab==='directory'?directoryView(g):tab==='map'?mapView(g):tab==='touches'?touchView(g):tab==='risks'?riskView(g):tab==='insights'?insightsView(g):tab==='history'?historyView(g):commandView(g);
   return '<div class="ct3-shell">'+hero+kpis+tabBar(tab)+content+'</div>'+modalHTML(g)
  }catch(e){
   console.error('[Contacts Center v512 render error]',e);
   return '<div class="ct3-shell"><div class="ct3-hero"><div class="ct3-kick">Contacts & Decision-Maker Center 3.0 · RECOVERY MODE</div><div class="ct3-title">The relationship workspace hit a data compatibility issue</div><div class="ct3-copy">'+esc((e&&e.message)||String(e))+'</div></div></div>'
  }
 }
 window._rp2ContactsDraw=function(){
  if(typeof Chart!=='function')return;
  if(['command','insights','history'].indexOf(window._rp2ContactsTab)<0)return;
  var canvas=document.getElementById('ct3-chart');if(!canvas)return;var g=build();
  if(_rp2.contactsChart){try{_rp2.contactsChart.destroy()}catch(e){}}
  if(window._rp2ContactsTab==='command'){
   var rows=g.coverages.slice().sort(function(a,b){return b.score-a.score}).slice(0,20);
   _rp2.contactsChart=new Chart(canvas.getContext('2d'),{type:'bar',data:{labels:rows.map(function(x){return x.company}),datasets:[{label:'Relationship coverage',data:rows.map(function(x){return x.score}),backgroundColor:'rgba(78,214,163,.68)',borderRadius:6}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100,ticks:{color:'#8b95a7'},grid:{color:'rgba(255,255,255,.05)'}},y:{ticks:{color:'#aab4c6',font:{size:8}},grid:{display:false}}}}})
  }else if(window._rp2ContactsTab==='insights'){
   var role=countBy(g.contacts,function(c){return c.buyingRole}).slice(0,10);
   _rp2.contactsChart=new Chart(canvas.getContext('2d'),{type:'bar',data:{labels:role.map(function(x){return x.name}),datasets:[{label:'Contacts',data:role.map(function(x){return x.value}),backgroundColor:'rgba(0,175,239,.68)',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8b95a7',font:{size:8},maxRotation:20},grid:{display:false}},y:{beginAtZero:true,ticks:{color:'#8b95a7',precision:0},grid:{color:'rgba(255,255,255,.05)'}}}}})
  }else{
   var dates=[];arr(g.view.data.events).forEach(function(e){var d=dt(e.at);if(d)dates.push(d)});g.activities.forEach(function(a){if(a.date)dates.push(a.date)});var map={};dates.sort(function(a,b){return a-b}).forEach(function(d){var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');map[k]=(map[k]||0)+1});var total=0,rows2=[];Object.keys(map).sort().forEach(function(k){total+=map[k];rows2.push({label:k,value:total})});if(!rows2.length)return;
   _rp2.contactsChart=new Chart(canvas.getContext('2d'),{type:'line',data:{labels:rows2.map(function(x){return x.label}),datasets:[{label:'Cumulative relationship activity',data:rows2.map(function(x){return x.value}),borderColor:'#4ed6a3',backgroundColor:'rgba(78,214,163,.12)',fill:true,pointRadius:3,tension:.25}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8b95a7'},grid:{display:false}},y:{beginAtZero:true,ticks:{color:'#8b95a7',precision:0},grid:{color:'rgba(255,255,255,.05)'}}}}})
  }
 }

 /* Preserve v512-only relationship fields when a local contact is edited in the older company-profile form. */
 if(BASE_COMPANY_SAVE_CONTACT)window._rp2CompanySaveContact=function(encoded){
  var snap=null,key=window._rp2CompanyOpenKey?decodeURIComponent(window._rp2CompanyOpenKey):'',cid=encoded?decodeURIComponent(encoded):'';
  try{var b=repCrm(),a=b.data.accounts[key],old=a&&arr(a.contacts).filter(function(c){return c&&String(c.id)===String(cid)})[0];if(old)snap={buyingRole:old.buyingRole,department:old.department,relationshipStrength:old.relationshipStrength,sentiment:old.sentiment,authorityAreas:old.authorityAreas,linkedin:old.linkedin,bestTime:old.bestTime,timezone:old.timezone,communicationStyle:old.communicationStyle,relationshipNotes:old.relationshipNotes,history:old.history,status:old.status}}catch(e){}
  BASE_COMPANY_SAVE_CONTACT(encoded);
  if(snap&&cid){try{var b2=repCrm(),a2=b2.data.accounts[key],idx=arr(a2&&a2.contacts).findIndex(function(c){return c&&String(c.id)===String(cid)});if(idx>=0){Object.keys(snap).forEach(function(k){if(snap[k]!=null)a2.contacts[idx][k]=snap[k]});b2.data.accounts[key]=a2;b2.store.reps[_rp2.rep]=b2.data;localStorage.setItem(CRM_STORE,JSON.stringify(b2.store))}}catch(e){}}
 }
 if(BASE_COMPANY_PROFILE)window._rp2CompanyProfileV3=function(){
  var html=BASE_COMPANY_PROFILE();
  if(html.indexOf('Open Contacts')<0)html=html.replace('<button class="rp2-co-btn" onclick="_rp2PipelineOpenCompanyDeals()">Open Pipeline</button>','<button class="rp2-co-btn" onclick="_rp2ContactsOpenCompanyCenter()">Open Contacts</button><button class="rp2-co-btn" onclick="_rp2PipelineOpenCompanyDeals()">Open Pipeline</button>');
  return html
 }
 window._rp2ContactsOpenCompanyCenter=function(){
  var key=window._rp2CompanyOpenKey?decodeURIComponent(window._rp2CompanyOpenKey):'',b=repCrm(),a=b.data.accounts[key],name=clean(a&&a.profile&&a.profile.name)||key;window._rp2ContactsFilters.company=name;window._rp2ContactsTab='directory';window._rp2ContactsModal=null;_rp2Go('contacts');setTimeout(function(){var e=document.getElementById('ct3-company');if(e)e.value=name;window._rp2ContactsApplyFilters()},0)
 }
})();
