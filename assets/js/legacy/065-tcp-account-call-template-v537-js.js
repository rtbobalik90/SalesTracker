
(function(){
 'use strict';

 var STORE='tcp_automation_templates_v537';
 var CRM='tcp_rp_company_crm_v510';

 var PRIMARY_TYPES=[
  'Account Updating Call','Product Opportunity Call','Reorder Call','Quote Follow-Up',
  'Sample Follow-Up','Order Follow-Up','New Lead / Prospecting Call',
  'Dormant Account Re-engagement','Web Order Follow-Up','Trade Show Follow-Up',
  'Service Recovery Call','Relationship Check-In','Payment / Accounting Follow-Up','Other'
 ];
 var SECONDARY=[
  '','Product Opportunity','Reorder Discussion','Quote Follow-Up','Sample Follow-Up',
  'Service Issue','Order Discussion','Relationship Check-In','Other'
 ];
 var OUTCOMES=[
  'Connected – follow-up required','Connected – quote discussed','Order expected',
  'Sample requested','Left voicemail','No answer','Wrong contact','Not interested',
  'Completed – no follow-up'
 ];
 var DEFAULT_INDUSTRIES=[
  'Construction','Landscaping','General Contractor','Excavation','Roofing','HVAC',
  'Electrical','Plumbing','Manufacturing','Transportation','Municipal / Government',
  'Education','Healthcare','Hospitality','Nonprofit','Retail','Food Service','Agriculture'
 ];

 window._at537Tab=window._at537Tab||'templates';
 window._at537SelectedTemplate=window._at537SelectedTemplate||'';
 window._at537PreviewData=window._at537PreviewData||null;

 function arr(v){
  if(Array.isArray(v))return v;
  if(!v)return[];
  try{
   if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);
   if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(Boolean)
  }catch(e){}
  return[]
 }
 function clean(v){return String(v==null?'':v).trim()}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function esc(v){
  var s=String(v==null?'':v);
  return typeof _rp2Esc==='function'?_rp2Esc(s):s.replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function val(id){var e=document.getElementById(id);return e?clean(e.value):''}
 function checked(id){var e=document.getElementById(id);return!!(e&&e.checked)}
 function now(){return new Date().toISOString()}
 function makeId(p){return(p||'id')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
 function read(k,def){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x==null?def:x}catch(e){return def}}
 function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
 function field(o,names,def){
  for(var i=0;i<names.length;i++){
   var v=o&&o[names[i]];
   if(v!=null&&String(v).trim()!=='')return v
  }
  return def==null?'':def
 }
 function uniq(a){
  var seen={};
  return arr(a).map(clean).filter(function(x){
   var k=norm(x);if(!k||seen[k])return false;seen[k]=1;return true
  })
 }
 function stableHash(value){
  var s=typeof value==='string'?value:JSON.stringify(value),h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return(h>>>0).toString(36)
 }
 function currentRep(){return window._rp2&&_rp2.rep||''}

 function state(){
  var x=(typeof S!=='undefined'&&S.automationTemplatesV537)||read(STORE,null);
  if(!x||x.version!==1){
   x={
    version:1,
    industries:[],
    requests:[],
    templates:[],
    branding:{
     companyName:'Triple Crown Products',
     tagline:'Built for the teams that build everything else.',
     address:'',
     website:'',
     logoData:'',
     footerHtml:'<strong>Triple Crown Products</strong><br>Company apparel, uniforms, promotional products, and branded solutions.',
     disclaimer:'',
     buttonBackground:'#00AFEF',
     buttonText:'#ffffff'
    },
    microsoft:{
     tenantId:'',
     clientId:'',
     redirectUri:(location.origin||'')+(location.pathname||''),
     allowedDomain:'triplecrownproducts.com',
     managerEmail:''
    },
    audit:[],
    editRequests:[]
   }
  }
  x.industries=arr(x.industries);
  x.requests=arr(x.requests);
  x.templates=arr(x.templates);
  x.audit=arr(x.audit);
  x.editRequests=arr(x.editRequests);
  x.branding=x.branding||{};
  x.microsoft=x.microsoft||{};
  if(!x.industries.length){
   x.industries=DEFAULT_INDUSTRIES.map(function(name){
    return{id:makeId('industry'),name:name,active:true,createdAt:now(),source:'starter'}
   })
  }
  if(typeof S!=='undefined'&&!S.automationTemplatesV537)S.automationTemplatesV537=x;
  if(!read(STORE,null))write(STORE,x);
  return x
 }

 function saveState(x,action,detail){
  if(action){
   x.audit.unshift({
    id:makeId('audit'),
    action:action,
    detail:detail||'',
    actor:'Manager/Admin',
    at:now()
   })
  }
  if(x.audit.length>500)x.audit=x.audit.slice(0,500);
  if(typeof S!=='undefined'){
   S.automationTemplatesV537=x;
   try{markDirty();persist()}catch(e){}
  }
  write(STORE,x)
 }

 function crm(){
  var s=read(CRM,null);
  if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};
  var rep=currentRep();
  if(rep)s.reps[rep]=s.reps[rep]||{accounts:{}};
  return s
 }

 function account(company,rep,create){
  rep=rep||currentRep();
  var s=crm();
  s.reps[rep]=s.reps[rep]||{accounts:{}};
  var key=norm(company),a=s.reps[rep].accounts[key];
  if(!a&&create){
   a={
    profile:{name:company,owner:rep,createdAt:now(),updatedAt:now()},
    contacts:[],opportunities:[],quotes:[],activities:[],notes:[],files:[]
   };
   s.reps[rep].accounts[key]=a
  }
  if(a){
   a.profile=a.profile||{name:company,owner:rep};
   a.contacts=arr(a.contacts);
   a.opportunities=arr(a.opportunities);
   a.quotes=arr(a.quotes);
   a.activities=arr(a.activities);
   a.notes=arr(a.notes);
   a.files=arr(a.files)
  }
  return{s:s,key:key,data:a,rep:rep}
 }

 function saveAccount(bundle){
  if(!bundle||!bundle.data)return;
  bundle.data.profile.updatedAt=now();
  write(CRM,bundle.s);
  try{window._cw4DirectoryCache=null;window._cw4ProfileCache={}}catch(e){}
 }

 function addActivity(company,activity,rep){
  var b=account(company,rep||currentRep(),true);
  b.data.activities.push(activity);
  saveAccount(b)
 }

 function approvedIndustries(){
  return state().industries.filter(function(x){return x.active!==false}).sort(function(a,b){
   return a.name.localeCompare(b.name)
  })
 }

 function companyTags(company,rep){
  var b=account(company,rep||currentRep(),false);
  return b.data?uniq(b.data.profile.industryTags):[]
 }

 function setCompanyTags(company,tags,rep){
  var b=account(company,rep||currentRep(),true);
  b.data.profile.industryTags=uniq(tags);
  b.data.profile.industryTagsUpdatedAt=now();
  b.data.profile.industryTagsUpdatedBy=rep||currentRep();
  saveAccount(b);
  return b.data.profile.industryTags
 }

 function htmlOptions(list,value){
  return list.map(function(item){
   var v=typeof item==='string'?item:item.value;
   var label=typeof item==='string'?item:(item.label||item.value);
   return'<option value="'+esc(v)+'" '+(String(value||'')===String(v)?'selected':'')+'>'+esc(label)+'</option>'
  }).join('')
 }

 function inferUpdate(queue){
  return!!(queue&&/account\s*updat|updating\s*account|quarterly.{0,25}call/i.test(
   [queue.reason,queue.copy,queue.source,queue.title].join(' ')
  ))
 }

 function completionDefault(outcome){
  var s=String(outcome||'');
  return /connected|left voicemail|order expected|sample requested/i.test(s)&&
   !/no answer|wrong contact/i.test(s)
 }

 function callDefault(ctx,d){
  if(d.callType)return d.callType;
  if(inferUpdate(ctx&&ctx.queue)){
   d.callType='Account Updating Call';
   return d.callType
  }
  return''
 }

 function classification(company,ctx,d,compact){
  d=d||{};
  var type=callDefault(ctx,d);
  var tags=uniq(d.industryTags&&d.industryTags.length?d.industryTags:companyTags(company));
  var industries=approvedIndustries();
  var isUpdate=type==='Account Updating Call';
  if(isUpdate&&d.accountUpdateCompleted==null)d.accountUpdateCompleted=completionDefault(d.outcome);

  var sectionClass=compact?'fc1-section cl2-floating':'cl2-classify';
  var gridClass=compact?'fc1-grid-2':'cl2-grid';
  var fieldClass=compact?'fc1-field':'cl2-field';
  var checkClass=compact?'fc1-check':'cl2-check';

  return'<section class="'+sectionClass+'">'+
   '<div class="'+(compact?'fc1-section-title':'cl1-section-title')+'">Call classification</div>'+
   '<div class="'+(compact?'fc1-section-copy':'cl1-section-copy')+'">Primary type controls reporting and automation. Secondary purpose is optional.</div>'+
   '<div class="'+gridClass+'">'+
    '<div class="'+fieldClass+'"><label>Primary call type *</label>'+
     '<select id="cl1-call-type" onchange="_call537TypeChanged();'+(compact?'_call534Sync()':'_call532Draft()')+'">'+
      '<option value="">Choose call type</option>'+htmlOptions(PRIMARY_TYPES,type)+
     '</select></div>'+
    '<div class="'+fieldClass+'"><label>Secondary purpose</label>'+
     '<select id="cl1-secondary-purpose" onchange="'+(compact?'_call534Sync()':'_call532Draft()')+'">'+
      htmlOptions(SECONDARY,d.secondaryPurpose||'')+
     '</select></div>'+
   '</div>'+
   '<div id="cl2-account-update-fields" style="'+(isUpdate?'':'display:none')+'">'+
    '<label class="'+checkClass+'"><input id="cl1-account-update-complete" type="checkbox" '+(d.accountUpdateCompleted?'checked':'')+
     ' onchange="'+(compact?'_call534Sync()':'_call532Draft()')+'">'+
     '<span><strong style="display:block;color:#e8edf5">Count this as the completed account update</strong>'+
     'Connected conversations and voicemail default to checked. No answer defaults to unchecked. The rep may override before saving.</span></label>'+
    '<div class="cl2-note">Checked removes the source company from Updating Account Calls and records the quarterly update. Unchecked keeps it available for another attempt.</div>'+
    '<div class="cl2-tags">'+industries.map(function(ind){
     var on=tags.some(function(t){return norm(t)===norm(ind.name)});
     return'<label class="cl2-tag '+(on?'on':'')+'"><input class="cl2-industry-check" type="checkbox" value="'+esc(ind.name)+'" '+(on?'checked':'')+
      ' onchange="'+(compact?'_call534Sync()':'_call532Draft()')+'"> '+esc(ind.name)+'</label>'
    }).join('')+'</div>'+
    '<button type="button" class="cl2-request" onclick="_it537RequestTag(\''+encodeURIComponent(company)+'\')">Request a new industry tag</button>'+
   '</div>'+
  '</section>'
 }

 window._call537ClassificationHtml=function(ctx,d){
  return classification(ctx&&ctx.c&&ctx.c.name||window._call532.company,ctx,d,false)
 };
 window._call537FloatingClassification=function(x,d){
  return classification(x&&x.company||window._call532.company,{queue:x&&x.queue},d,true)
 };
 window._call537CollectIndustries=function(){
  return uniq([].slice.call(document.querySelectorAll('.cl2-industry-check:checked')).map(function(e){return e.value}))
 };
 window._call537TypeChanged=function(){
  var e=document.getElementById('cl1-call-type');
  var box=document.getElementById('cl2-account-update-fields');
  if(box)box.style.display=e&&e.value==='Account Updating Call'?'':'none';
  if(e&&e.value==='Account Updating Call'){
   var c=document.getElementById('cl1-account-update-complete');
   if(c&&!c.dataset.manual)c.checked=completionDefault(val('cl1-outcome'))
  }
  try{window._call532Draft()}catch(_){}
 };
 window._call537OutcomeChanged=function(){
  var c=document.getElementById('cl1-account-update-complete');
  if(c&&val('cl1-call-type')==='Account Updating Call'&&!c.dataset.manual){
   c.checked=completionDefault(val('cl1-outcome'))
  }
  try{window._call532Draft()}catch(_){}
 };

 function bindOutcome(){
  var outcome=document.getElementById('cl1-outcome');
  var completion=document.getElementById('cl1-account-update-complete');
  if(outcome&&!outcome._v537){
   outcome._v537=1;
   outcome.addEventListener('change',window._call537OutcomeChanged)
  }
  if(completion&&!completion._v537){
   completion._v537=1;
   completion.addEventListener('change',function(){completion.dataset.manual='1'})
  }
 }

 window._it537RequestTag=function(encoded){
  var company=decodeURIComponent(encoded||encodeURIComponent(window._cw4CompanyName||window._call532&&window._call532.company||''));
  var name=clean(prompt('What industry tag is missing for '+company+'?'));
  if(!name)return;
  var x=state();
  if(x.industries.some(function(i){return norm(i.name)===norm(name)})){
   alert('That industry already exists in the approved list.');
   return
  }
  if(x.requests.some(function(r){
   return r.status==='Pending'&&norm(r.name)===norm(name)&&norm(r.company)===norm(company)&&r.rep===currentRep()
  })){
   alert('That tag request is already pending for this company.');
   return
  }
  x.requests.unshift({
   id:makeId('request'),
   name:name,
   company:company,
   rep:currentRep(),
   status:'Pending',
   requestedAt:now()
  });
  saveState(x,'Industry tag requested',name+' · '+company+' · '+currentRep());
  alert('Industry tag request submitted. It will not affect email matching until approved.');
  installIndustryCard()
 };

 window._it537SaveCompanyTags=function(encoded){
  var company=decodeURIComponent(encoded);
  var tags=uniq([].slice.call(document.querySelectorAll('#it537-company-tags input:checked')).map(function(e){return e.value}));
  setCompanyTags(company,tags);
  addActivity(company,{
   id:makeId('activity'),
   source:'company-profile',
   type:'Industry Tags Updated',
   subject:'Approved industry tags updated',
   detail:tags.join(', ')||'No approved tags selected',
   date:now(),createdAt:now(),updatedAt:now(),rep:currentRep()
  });
  alert('Industry tags saved.');
  installIndustryCard()
 };

 function industryCardHtml(company){
  var tags=companyTags(company);
  var industries=approvedIndustries();
  var x=state();
  var pending=x.requests.filter(function(r){
   return r.status==='Pending'&&r.rep===currentRep()&&norm(r.company)===norm(company)
  });
  return'<div class="it537-card" id="it537-company-card">'+
   '<div class="it537-head"><div>'+
    '<div class="it537-kick">APPROVED INDUSTRY TAGS · v537</div>'+
    '<div class="it537-title">Template and account intelligence</div>'+
    '<div class="it537-copy">Reps select approved tags while updating the company. Pending requests never influence template matching.</div>'+
   '</div><div class="it537-actions">'+
    '<button class="it537-btn" onclick="_it537RequestTag(\''+encodeURIComponent(company)+'\')">Request new tag</button>'+
    '<button class="it537-btn primary" onclick="_it537SaveCompanyTags(\''+encodeURIComponent(company)+'\')">Save tags</button>'+
   '</div></div>'+
   '<div class="cl2-tags" id="it537-company-tags">'+industries.map(function(i){
    var on=tags.some(function(t){return norm(t)===norm(i.name)});
    return'<label class="cl2-tag '+(on?'on':'')+'"><input type="checkbox" value="'+esc(i.name)+'" '+(on?'checked':'')+'> '+esc(i.name)+'</label>'
   }).join('')+'</div>'+
   (pending.length?'<div class="it537-pending">Pending approval: '+pending.map(function(r){return esc(r.name)}).join(', ')+'</div>':'')+
  '</div>'
 }

 function installIndustryCard(){
  if(!window._cw4CompanyName)return;
  var profile=document.querySelector('#rp-overlay .cw4-profile');
  var head=profile&&profile.querySelector('.cw5-profile-head');
  if(!head)return;
  var old=document.getElementById('it537-company-card');
  if(old)old.remove();
  head.insertAdjacentHTML('beforeend',industryCardHtml(window._cw4CompanyName))
 }

 function templateCore(t){
  return{
   name:t.name||'',
   subject:t.subject||'',
   bodyHtml:t.bodyHtml||'',
   primaryType:t.primaryType||'',
   outcome:t.outcome||'',
   secondaryPurpose:t.secondaryPurpose||'',
   industries:uniq(t.industries).sort(),
   allIndustries:!!t.allIndustries,
   attachments:arr(t.attachments).map(function(a){return{name:a.name,size:a.size,type:a.type}}),
   priority:Number(t.priority)||0,
   footerVersion:stableHash(state().branding||{})
  }
 }

 function templateHash(t){return stableHash(templateCore(t))}

 function templateConflict(x,t){
  return x.templates.filter(function(other){
   if(other.id===t.id||!other.active)return false;
   if(other.primaryType!==t.primaryType||other.outcome!==t.outcome||
      clean(other.secondaryPurpose)!==clean(t.secondaryPurpose))return false;
   if(other.allIndustries&&t.allIndustries)return true;
   if(other.allIndustries||t.allIndustries)return false;
   return uniq(other.industries).some(function(a){
    return uniq(t.industries).some(function(b){return norm(a)===norm(b)})
   })
  })[0]||null
 }

 function findTemplate(primary,outcome,secondary,tags){
  var active=state().templates.filter(function(t){return t.active});
  var tagset=uniq(tags);
  function industryMatch(t){
   return !t.allIndustries&&uniq(t.industries).some(function(i){
    return tagset.some(function(c){return norm(c)===norm(i)})
   })
  }
  function first(predicate){
   return active.filter(predicate).sort(function(a,b){
    return(Number(b.priority)||0)-(Number(a.priority)||0)||
     String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))
   })[0]||null
  }
  return first(function(t){
   return t.primaryType===primary&&t.outcome===outcome&&clean(t.secondaryPurpose)===clean(secondary)&&industryMatch(t)
  })||first(function(t){
   return t.primaryType===primary&&t.outcome===outcome&&clean(t.secondaryPurpose)===clean(secondary)&&t.allIndustries
  })||first(function(t){
   return t.primaryType===primary&&t.outcome===outcome&&!clean(t.secondaryPurpose)&&industryMatch(t)
  })||first(function(t){
   return t.primaryType===primary&&t.outcome===outcome&&!clean(t.secondaryPurpose)&&t.allIndustries
  })||null
 }

 function mergeFields(source,context){
  var d=context.draft||{},contact=context.contact||{},company=context.company||'';
  var rep=context.rep||currentRep(),profile=context.profile||{};
  var map={
   contact_first_name:clean(field(contact,['name'],'Customer')).split(/\s+/)[0]||'Customer',
   contact_full_name:field(contact,['name'],'Customer'),
   contact_title:field(contact,['title','buyingRole'],''),
   company_name:company,
   company_industry:uniq(profile.industryTags).join(', '),
   company_industry_tags:uniq(profile.industryTags).join(', '),
   rep_first_name:clean(rep).split(/\s+/)[0]||'',
   rep_full_name:rep,
   rep_title:field(profile,['repTitle'],'Sales Specialist'),
   rep_phone:field(profile,['repPhone'],''),
   rep_email:field(profile,['repEmail'],''),
   rep_calendar_link:field(profile,['repCalendarLink'],''),
   next_action:d.nextAction||'',
   next_date:d.nextDate||'',
   call_date:new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
   call_type:d.callType||'',
   call_outcome:d.outcome||'',
   secondary_purpose:d.secondaryPurpose||''
  };
  return String(source||'').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi,function(_,key){
   return map[key.toLowerCase()]!=null?map[key.toLowerCase()]:''
  })
 }

 function footerHtml(){
  var b=state().branding||{};
  return(b.logoData?'<img src="'+b.logoData+'" alt="'+esc(b.companyName||'Company')+'" style="max-width:180px;max-height:65px;display:block;margin-bottom:8px">':'')+
   (b.footerHtml||('<strong>'+esc(b.companyName||'Triple Crown Products')+'</strong>'))+
   (b.disclaimer?'<div style="margin-top:8px;color:#64748b;font-size:10px">'+b.disclaimer+'</div>':'')
 }

 function selectedTemplate(){
  var t=state().templates.filter(function(item){return item.id===window._at537SelectedTemplate})[0];
  return t||{
   id:'',
   name:'',
   subject:'',
   bodyHtml:'<p>Hi {{contact_first_name}},</p><p>I just left you a quick voicemail and wanted to follow up by email.</p><p>Please let me know when you have a few minutes to connect.</p><p>Thank you,</p>',
   primaryType:'Account Updating Call',
   outcome:'Left voicemail',
   secondaryPurpose:'',
   industries:[],
   allIndustries:true,
   active:false,
   protected:false,
   priority:0,
   attachments:[],
   previewHash:'',
   testHash:'',
   createdAt:now(),
   updatedAt:now()
  }
 }

 function managerTemplateList(x,t){
  if(!x.templates.length){
   return'<div class="at537-row"><strong>No templates yet</strong><p>Create the first voicemail follow-up template.</p></div>'
  }
  return x.templates.map(function(item){
   return'<div class="at537-row '+(item.id===t.id?'on':'')+'" onclick="_at537SelectTemplate(\''+item.id+'\')">'+
    '<div class="at537-row-top"><strong>'+esc(item.name||'Untitled template')+'</strong><div>'+
     '<span class="at537-badge '+(item.active?'active':'')+'">'+(item.active?'Active':'Draft')+'</span> '+
     (item.protected?'<span class="at537-badge protected">Protected</span>':'')+
    '</div></div>'+
    '<p>'+esc(item.primaryType+' · '+item.outcome+(item.secondaryPurpose?' · '+item.secondaryPurpose:''))+'<br>'+
     esc(item.allIndustries?'All Industries':uniq(item.industries).join(', ')||'No industries')+
    '</p></div>'
  }).join('')
 }

 function templateCenter(x){
  var t=selectedTemplate();
  var industries=approvedIndustries();
  var h=templateHash(t);
  var previewOk=t.previewHash===h;
  var testOk=t.testHash===h;
  return'<div class="at537-layout">'+
   '<section class="at537-panel"><div class="at537-panel-head"><div>'+
    '<div class="at537-panel-title">Email templates</div>'+
    '<div class="at537-panel-copy">One active template per call type, outcome, secondary purpose, and industry. All Industries is the fallback.</div>'+
   '</div><button class="at537-btn primary" onclick="_at537NewTemplate()">＋ New</button></div>'+
   '<div class="at537-panel-body"><div class="at537-list">'+managerTemplateList(x,t)+'</div></div></section>'+
   '<section class="at537-panel"><div class="at537-panel-head"><div>'+
    '<div class="at537-panel-title">'+(t.id?'Edit template':'Create template')+'</div>'+
    '<div class="at537-panel-copy">A current merged preview and successful Microsoft test are required before activation.</div>'+
   '</div><div><span class="at537-badge '+(previewOk?'active':'')+'">Preview '+(previewOk?'✓':'required')+'</span> '+
    '<span class="at537-badge '+(testOk?'active':'')+'">Test '+(testOk?'✓':'required')+'</span></div></div>'+
   '<div class="at537-panel-body"><div class="at537-form">'+
    '<div class="at537-grid2"><div class="at537-field"><label>Template name</label><input id="at537-t-name" value="'+esc(t.name)+'"></div>'+
    '<div class="at537-field"><label>Email subject</label><input id="at537-t-subject" value="'+esc(t.subject)+'"></div></div>'+
    '<div class="at537-grid3"><div class="at537-field"><label>Primary call type</label><select id="at537-t-primary">'+htmlOptions(PRIMARY_TYPES,t.primaryType)+'</select></div>'+
    '<div class="at537-field"><label>Call outcome</label><select id="at537-t-outcome">'+htmlOptions(OUTCOMES,t.outcome)+'</select></div>'+
    '<div class="at537-field"><label>Secondary purpose</label><select id="at537-t-secondary">'+htmlOptions(SECONDARY,t.secondaryPurpose)+'</select></div></div>'+
    '<div class="at537-field"><label>Industry matching</label><div class="at537-chip-grid">'+
     '<label class="at537-chip '+(t.allIndustries?'on':'')+'"><input id="at537-t-all" type="checkbox" '+(t.allIndustries?'checked':'')+'> All Industries fallback</label>'+
     industries.map(function(ind){
      var on=uniq(t.industries).some(function(n){return norm(n)===norm(ind.name)});
      return'<label class="at537-chip '+(on?'on':'')+'"><input class="at537-t-ind" type="checkbox" value="'+esc(ind.name)+'" '+(on?'checked':'')+'> '+esc(ind.name)+'</label>'
     }).join('')+
    '</div></div>'+
    '<div class="at537-field"><label>Preview and test data</label><select id="at537-preview-account">'+previewAccountOptions()+'</select>'+
     '<div class="at537-panel-copy">Use built-in sample data or a real company/rep record. Test emails still go only to the manager address.</div></div>'+
    '<div class="at537-field"><label>Rich email body</label><div class="at537-toolbar">'+
     '<button class="at537-tool" onclick="_at537Cmd(\'bold\')"><b>B</b></button>'+
     '<button class="at537-tool" onclick="_at537Cmd(\'italic\')"><i>I</i></button>'+
     '<button class="at537-tool" onclick="_at537Cmd(\'underline\')"><u>U</u></button>'+
     '<button class="at537-tool" onclick="_at537Cmd(\'insertUnorderedList\')">•</button>'+
     '<button class="at537-btn" onclick="_at537InsertLink()">Insert link</button>'+
     '<button class="at537-btn" onclick="_at537InsertButton()">Branded button</button>'+
     '<button class="at537-btn" onclick="_at537InsertMerge()">Merge field</button>'+
    '</div><div id="at537-t-body" class="at537-editor" contenteditable="true">'+t.bodyHtml+'</div></div>'+
    '<div class="at537-grid3"><div class="at537-field"><label>Priority</label><input id="at537-t-priority" type="number" value="'+Number(t.priority||0)+'"></div>'+
    '<div class="at537-field"><label>Protection</label><select id="at537-t-protected"><option value="No" '+(!t.protected?'selected':'')+'>Standard</option><option value="Yes" '+(t.protected?'selected':'')+'>Protected</option></select></div>'+
    '<div class="at537-field"><label>Status</label><input disabled value="'+(t.active?'Active':'Draft / Inactive')+'"></div></div>'+
    '<div class="at537-field"><label>Approved default attachments</label><input id="at537-t-attachments" type="file" multiple onchange="_at537TemplateFiles(event)">'+
     '<div class="at537-chip-grid">'+arr(t.attachments).map(function(a,i){
      return'<span class="at537-chip">📎 '+esc(a.name)+' <button onclick="_at537RemoveTemplateAttachment('+i+')" style="border:0;background:transparent;color:#ff9cad;cursor:pointer">×</button></span>'
     }).join('')+'</div></div>'+
    '<div class="at537-note">Merge fields: {{contact_first_name}}, {{contact_full_name}}, {{contact_title}}, {{company_name}}, {{company_industry_tags}}, {{rep_first_name}}, {{rep_full_name}}, {{rep_title}}, {{rep_phone}}, {{rep_email}}, {{rep_calendar_link}}, {{next_action}}, {{next_date}}, {{call_date}}, {{call_type}}, {{call_outcome}}, {{secondary_purpose}}.</div>'+
    '<div class="at537-actions">'+
     '<button class="at537-btn primary" onclick="_at537SaveTemplate()">Save draft</button>'+
     '<button class="at537-btn" onclick="_at537PreviewTemplate()">Merged preview</button>'+
     '<button class="at537-btn green" onclick="_at537TestTemplate()">Send Microsoft test</button>'+
     '<button class="at537-btn '+(t.active?'warn':'green')+'" onclick="_at537ToggleActive()">'+(t.active?'Deactivate':'Activate')+'</button>'+
     (t.id?'<button class="at537-btn" onclick="_at537DuplicateTemplate()">Duplicate</button>'+
      (t.protected?'<button class="at537-btn" onclick="_at537RequestTemplateEdit()">Request admin edit</button>':'')+
      '<button class="at537-btn danger" onclick="_at537DeleteTemplate()">Delete</button>':'')+
    '</div>'+
   '</div></div></section>'+
  '</div>'
 }

 function collectTemplate(){
  var old=selectedTemplate();
  var body=document.getElementById('at537-t-body');
  var t=Object.assign({},old,{
   id:old.id||makeId('template'),
   name:val('at537-t-name'),
   subject:val('at537-t-subject'),
   bodyHtml:body?body.innerHTML:'',
   primaryType:val('at537-t-primary'),
   outcome:val('at537-t-outcome'),
   secondaryPurpose:val('at537-t-secondary'),
   allIndustries:checked('at537-t-all'),
   industries:uniq([].slice.call(document.querySelectorAll('.at537-t-ind:checked')).map(function(e){return e.value})),
   priority:Number(val('at537-t-priority'))||0,
   protected:val('at537-t-protected')==='Yes',
   updatedAt:now()
  });
  if(!old.id)t.createdAt=now();
  var oldHash=old.id?templateHash(old):'';
  if(oldHash&&oldHash!==templateHash(t)){
   t.previewHash='';
   t.testHash='';
   t.active=false
  }
  return t
 }

 function replaceTemplate(x,t){
  var i=x.templates.findIndex(function(item){return item.id===t.id});
  if(i>=0)x.templates[i]=t;
  else x.templates.unshift(t)
 }

 function sampleContext(t){
  var x=state();
  return{
   company:'Sample Construction Company',
   contact:{name:'Jordan Customer',title:'Operations Manager'},
   draft:{
    callType:t.primaryType,
    outcome:t.outcome,
    secondaryPurpose:t.secondaryPurpose,
    nextAction:'Reconnect next Tuesday',
    nextDate:'July 21, 2026'
   },
   rep:'Robert Bobalik',
   profile:{
    industryTags:t.allIndustries?['Construction']:t.industries,
    repTitle:'Sales Manager',
    repPhone:'(262) 555-0100',
    repEmail:x.microsoft.managerEmail||'manager@triplecrownproducts.com',
    repCalendarLink:'https://example.com/calendar'
   }
  }
 }

 function previewAccounts(){
  var results=[],seen={},s=crm();
  Object.keys(s.reps||{}).forEach(function(rep){
   var accounts=s.reps[rep]&&s.reps[rep].accounts||{};
   Object.keys(accounts).forEach(function(key){
    var a=accounts[key],company=field(a&&a.profile,['name'],key);
    var token=norm(rep+'|'+company);
    if(!seen[token]){seen[token]=1;results.push({rep:rep,company:company})}
   })
  });
  return results.sort(function(a,b){
   return a.company.localeCompare(b.company)||a.rep.localeCompare(b.rep)
  })
 }

 function previewAccountOptions(){
  return'<option value="">Built-in sample data</option>'+previewAccounts().map(function(item){
   var value=encodeURIComponent(item.rep)+'|||'+encodeURIComponent(item.company);
   return'<option value="'+value+'">'+esc(item.company)+' · '+esc(item.rep)+'</option>'
  }).join('')
 }

 function managerPreviewContext(t){
  var selected=val('at537-preview-account');
  if(!selected)return sampleContext(t);
  var parts=selected.split('|||');
  var rep=decodeURIComponent(parts[0]||''),company=decodeURIComponent(parts[1]||'');
  var b=account(company,rep,false);
  if(!b.data)return sampleContext(t);
  var contact=b.data.contacts.filter(function(c){return clean(c.email)})[0]||b.data.contacts[0]||{name:'Customer'};
  return{
   company:company,
   contact:contact,
   draft:{
    callType:t.primaryType,
    outcome:t.outcome,
    secondaryPurpose:t.secondaryPurpose,
    nextAction:'Follow the recorded next customer action',
    nextDate:new Date(Date.now()+3*86400000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})
   },
   rep:rep,
   profile:Object.assign({},b.data.profile||{},{
    industryTags:uniq(b.data.profile&&b.data.profile.industryTags),
    repTitle:'Sales Specialist',
    repPhone:'',
    repEmail:state().microsoft.managerEmail||'',
    repCalendarLink:''
   })
  }
 }

 function industryCenter(x){
  return'<section class="at537-panel"><div class="at537-panel-head"><div>'+
   '<div class="at537-panel-title">Approved industry tag library</div>'+
   '<div class="at537-panel-copy">Reps assign approved tags to companies. Pending requests never influence template matching.</div>'+
  '</div><button class="at537-btn primary" onclick="_at537AddIndustry()">＋ Add tag</button></div>'+
  '<div class="at537-panel-body"><div class="at537-list">'+x.industries.sort(function(a,b){return a.name.localeCompare(b.name)}).map(function(ind){
   return'<div class="at537-row"><div class="at537-row-top"><strong>'+esc(ind.name)+'</strong>'+
    '<span class="at537-badge '+(ind.active!==false?'active':'')+'">'+(ind.active!==false?'Approved':'Inactive')+'</span></div>'+
    '<p>Created '+new Date(ind.createdAt||Date.now()).toLocaleDateString()+'</p>'+
    '<div class="at537-actions" style="margin-top:8px"><button class="at537-btn" onclick="_at537ToggleIndustry(\''+ind.id+'\')">'+(ind.active!==false?'Deactivate':'Activate')+'</button></div></div>'
  }).join('')+'</div></div></section>'
 }

 function requestCenter(x){
  var pending=x.requests.filter(function(r){return r.status==='Pending'});
  return'<section class="at537-panel"><div class="at537-panel-head"><div>'+
   '<div class="at537-panel-title">Pending industry requests</div>'+
   '<div class="at537-panel-copy">Approval creates the master tag and automatically assigns it to the company that requested it.</div>'+
  '</div><span class="at537-badge '+(pending.length?'protected':'active')+'">'+pending.length+' pending</span></div>'+
  '<div class="at537-panel-body"><div class="at537-list">'+
   (pending.length?pending.map(function(q){
    return'<div class="at537-row"><div class="at537-row-top"><strong>'+esc(q.name)+'</strong><span class="at537-badge protected">Pending</span></div>'+
     '<p>'+esc(q.company)+' · '+esc(q.rep)+' · '+new Date(q.requestedAt).toLocaleString()+'</p>'+
     '<div class="at537-actions" style="margin-top:8px"><button class="at537-btn green" onclick="_at537ApproveRequest(\''+q.id+'\')">Approve & assign</button>'+
     '<button class="at537-btn danger" onclick="_at537RejectRequest(\''+q.id+'\')">Reject</button></div></div>'
   }).join(''):'<div class="at537-row"><strong>No pending requests</strong><p>Rep-submitted tags will appear here.</p></div>')+
  '</div></div></section>'
 }

 function brandingCenter(x){
  var b=x.branding||{};
  return'<section class="at537-panel"><div class="at537-panel-head"><div>'+
   '<div class="at537-panel-title">Company-branded footer</div>'+
   '<div class="at537-panel-copy">Reps may edit their personal signature details for one message. This company footer remains locked.</div>'+
  '</div></div><div class="at537-panel-body">'+
   '<div class="at537-grid2"><div class="at537-field"><label>Company name</label><input id="at537-b-company" value="'+esc(b.companyName||'')+'"></div>'+
   '<div class="at537-field"><label>Tagline</label><input id="at537-b-tagline" value="'+esc(b.tagline||'')+'"></div></div>'+
   '<div class="at537-grid2"><div class="at537-field"><label>Address</label><input id="at537-b-address" value="'+esc(b.address||'')+'"></div>'+
   '<div class="at537-field"><label>Website</label><input id="at537-b-website" value="'+esc(b.website||'')+'"></div></div>'+
   '<div class="at537-field"><label>Locked footer HTML / rich text</label><textarea id="at537-b-footer">'+esc(b.footerHtml||'')+'</textarea></div>'+
   '<div class="at537-field"><label>Legal / disclaimer</label><textarea id="at537-b-disclaimer">'+esc(b.disclaimer||'')+'</textarea></div>'+
   '<div class="at537-field"><label>Approved logo</label><input type="file" accept="image/*" onchange="_at537BrandLogo(event)"></div>'+
   '<div class="at537-note">'+footerHtml()+'</div>'+
   '<button class="at537-btn primary" onclick="_at537SaveBranding()">Save locked footer</button>'+
  '</div></section>'
 }

 function microsoftCenter(x){
  var m=x.microsoft||{};
  var status=window.TCP537&&TCP537.microsoftStatus?TCP537.microsoftStatus('manager'):{connected:false};
  return'<section class="at537-panel"><div class="at537-panel-head"><div>'+
   '<div class="at537-panel-title">Microsoft 365 organization connection</div>'+
   '<div class="at537-panel-copy">One Triple Crown Entra application. Each rep authorizes their own existing work Outlook mailbox from My Profile.</div>'+
  '</div><span class="at537-badge '+(status.connected?'active':'')+'">'+(status.connected?'Manager connected':'Not connected')+'</span></div>'+
  '<div class="at537-panel-body">'+
   '<div class="at537-grid2"><div class="at537-field"><label>Microsoft tenant ID</label><input id="at537-ms-tenant" value="'+esc(m.tenantId||'')+'"></div>'+
   '<div class="at537-field"><label>Application / client ID</label><input id="at537-ms-client" value="'+esc(m.clientId||'')+'"></div></div>'+
   '<div class="at537-grid2"><div class="at537-field"><label>SPA redirect URI</label><input id="at537-ms-redirect" value="'+esc(m.redirectUri||(location.origin+location.pathname))+'"></div>'+
   '<div class="at537-field"><label>Allowed work email domain</label><input id="at537-ms-domain" value="'+esc(m.allowedDomain||'triplecrownproducts.com')+'"></div></div>'+
   '<div class="at537-field"><label>Manager test email address</label><input id="at537-ms-manager" value="'+esc(m.managerEmail||'')+'"></div>'+
   '<div class="at537-note">Required delegated scopes: User.Read, Mail.ReadWrite, and Mail.Send. Register the redirect URI as a Single-page application URL. The tracker does not store Outlook passwords or a client secret.</div>'+
   '<div class="at537-actions"><button class="at537-btn primary" onclick="_at537SaveMicrosoft()">Save Microsoft settings</button>'+
    '<button class="at537-btn '+(status.connected?'danger':'green')+'" onclick="'+(status.connected?"TCP537.disconnectMicrosoft('manager')":"TCP537.connectMicrosoft('manager')")+'">'+(status.connected?'Disconnect manager test mailbox':'Connect manager test mailbox')+'</button></div>'+
   (status.connected?'<div class="at537-note">Connected: '+esc(status.name)+' · '+esc(status.address)+'</div>':'')+
  '</div></section>'
 }

 function auditCenter(x){
  return'<section class="at537-panel"><div class="at537-panel-head"><div>'+
   '<div class="at537-panel-title">Automation audit history</div>'+
   '<div class="at537-panel-copy">Publishing, testing, protection, tag approvals, template overrides, and system changes remain traceable.</div>'+
  '</div><span class="at537-badge">'+x.audit.length+' events</span></div>'+
  '<div class="at537-panel-body"><div class="at537-audit">'+
   (x.audit.length?x.audit.map(function(a){
    return'<div class="at537-audit-row"><strong>'+esc(a.action)+'</strong><span>'+esc(a.detail||'')+' · '+new Date(a.at).toLocaleString()+' · '+esc(a.actor||'Manager/Admin')+'</span></div>'
   }).join(''):'<div class="at537-audit-row"><strong>No audit events yet</strong></div>')+
  '</div></div></section>'
 }

 function managerTab(x){
  if(window._at537Tab==='templates')return templateCenter(x);
  if(window._at537Tab==='industries')return industryCenter(x);
  if(window._at537Tab==='requests')return requestCenter(x);
  if(window._at537Tab==='branding')return brandingCenter(x);
  if(window._at537Tab==='microsoft')return microsoftCenter(x);
  return auditCenter(x)
 }

 function renderManager(){
  var host=document.getElementById('pg-automations');
  if(!host)return;
  var x=state();
  var active=x.templates.filter(function(t){return t.active}).length;
  var pending=x.requests.filter(function(r){return r.status==='Pending'}).length;
  var ms=window.TCP537&&TCP537.microsoftStatus?TCP537.microsoftStatus('manager'):{connected:false};
  host.innerHTML=
   '<section class="at537-hero"><div><div class="at537-kick">AUTOMATION & TEMPLATES CENTER · BUILD v537</div>'+
    '<h1>Call outcomes become consistent customer follow-up.</h1>'+
    '<p>Create approved industries, match a call outcome to one email, test it through Microsoft 365, and control the locked company footer from one manager/admin workspace.</p>'+
   '</div><div class="at537-hero-card"><span>System readiness</span><strong>'+active+' active templates</strong>'+
    '<p>'+x.industries.length+' approved industries · '+pending+' pending requests · Microsoft '+(ms.connected?'connected':'not connected')+'</p></div></section>'+
   '<div class="at537-tabs">'+[
    ['templates','Email Templates'],['industries','Industry Library'],['requests','Pending Requests'],
    ['branding','Branding & Footer'],['microsoft','Microsoft 365'],['audit','Audit History']
   ].map(function(tab){
    return'<button class="at537-tab '+(window._at537Tab===tab[0]?'on':'')+'" onclick="_at537SetTab(\''+tab[0]+'\')">'+tab[1]+'</button>'
   }).join('')+'</div>'+
   '<div id="at537-content">'+managerTab(x)+'</div>'
 }

 window._at537SetTab=function(tab){window._at537Tab=tab;renderManager()};
 window._at537SelectTemplate=function(id){window._at537SelectedTemplate=id;renderManager()};
 window._at537NewTemplate=function(){window._at537SelectedTemplate='';renderManager()};
 window._at537Cmd=function(cmd){document.execCommand(cmd,false,null);var e=document.getElementById('at537-t-body');if(e)e.focus()};
 window._at537InsertMerge=function(){var f=prompt('Merge field','{{contact_first_name}}');if(f)document.execCommand('insertText',false,f)};
 window._at537InsertLink=function(){var url=prompt('Link URL');if(url)document.execCommand('createLink',false,url)};
 window._at537InsertButton=function(){
  var label=prompt('Button label','Learn more'),url=prompt('Button URL','https://');
  if(!label||!url)return;
  var b=state().branding||{};
  document.execCommand('insertHTML',false,'<a href="'+esc(url)+'" style="display:inline-block;padding:10px 16px;border-radius:6px;background:'+(b.buttonBackground||'#00AFEF')+';color:'+(b.buttonText||'#ffffff')+';text-decoration:none;font-weight:700">'+esc(label)+'</a>')
 };

 window._at537SaveTemplate=function(){
  var x=state(),t=collectTemplate();
  if(!t.name||!t.subject||!t.primaryType||!t.outcome){
   alert('Complete the template name, subject, primary call type, and outcome.');return
  }
  if(!t.allIndustries&&!t.industries.length){
   alert('Select at least one industry or All Industries.');return
  }
  replaceTemplate(x,t);
  window._at537SelectedTemplate=t.id;
  saveState(x,'Template saved',t.name);
  renderManager()
 };

 window._at537PreviewTemplate=function(){
  var x=state(),t=collectTemplate(),context=managerPreviewContext(t);
  t.previewHash=templateHash(t);
  replaceTemplate(x,t);
  window._at537SelectedTemplate=t.id;
  saveState(x,'Template preview completed',t.name);
  var preview='<div style="font:14px/1.6 Segoe UI,Arial;color:#1e293b"><div style="padding:8px;background:#fff4cf"><strong>TEST PREVIEW · NOT SENT</strong></div>'+
   '<h2>'+esc(mergeFields(t.subject,context))+'</h2><hr>'+
   mergeFields(t.bodyHtml,context)+
   '<div style="margin-top:20px">'+footerHtml()+'</div></div>';
  window._at537PreviewData={title:t.name,html:preview};
  var w=window.open('','tcpTemplatePreview');
  if(w){
   w.document.open();
   w.document.write('<!doctype html><meta charset="utf-8"><title>'+esc(t.name)+'</title><body style="padding:36px;max-width:850px;margin:auto">'+preview+'</body>');
   w.document.close()
  }
  renderManager()
 };

 window._at537TestTemplate=async function(){
  var x=state(),t=collectTemplate(),h=templateHash(t);
  if(t.previewHash!==h){alert('Run the merged preview after the latest edits first.');return}
  if(!clean(x.microsoft.managerEmail)){alert('Set the manager test email in Microsoft 365 settings.');return}
  if(!window.TCP537||!TCP537.sendTemplateTest){alert('Microsoft email integration is still loading.');return}
  try{
   await TCP537.sendTemplateTest(t,managerPreviewContext(t),x.microsoft.managerEmail);
   t.testHash=h;
   replaceTemplate(x,t);
   window._at537SelectedTemplate=t.id;
   saveState(x,'Template test sent',t.name+' → '+x.microsoft.managerEmail);
   alert('Microsoft test email sent successfully.');
   renderManager()
  }catch(e){alert(e.message)}
 };

 window._at537ToggleActive=function(){
  var x=state(),t=collectTemplate(),h=templateHash(t);
  if(t.active)t.active=false;
  else{
   if(t.previewHash!==h||t.testHash!==h){
    alert('A current merged preview and successful Microsoft test are required before activation.');return
   }
   var conflict=templateConflict(x,t);
   if(conflict){
    alert('Activation conflict with "'+conflict.name+'". Remove the overlapping industry, deactivate the other template, or edit the existing template.');
    return
   }
   t.active=true
  }
  replaceTemplate(x,t);
  window._at537SelectedTemplate=t.id;
  saveState(x,t.active?'Template activated':'Template deactivated',t.name);
  renderManager()
 };

 window._at537DuplicateTemplate=function(){
  var x=state(),t=collectTemplate();
  t.id=makeId('template');
  t.name='Copy of '+t.name;
  t.active=false;
  t.protected=false;
  t.previewHash='';
  t.testHash='';
  t.createdAt=now();
  x.templates.unshift(t);
  window._at537SelectedTemplate=t.id;
  saveState(x,'Protected/standard template duplicated',t.name);
  renderManager()
 };

 window._at537RequestTemplateEdit=function(){
  var x=state(),t=collectTemplate(),note=clean(prompt('Describe the requested edit to this protected template.'));
  if(!note)return;
  x.editRequests.unshift({
   id:makeId('edit-request'),templateId:t.id,templateName:t.name,note:note,
   status:'Pending',requestedBy:'Manager/Admin',requestedAt:now()
  });
  saveState(x,'Protected template edit requested',t.name+' · '+note);
  alert('Edit request recorded in the audit history.');
  renderManager()
 };

 window._at537DeleteTemplate=function(){
  var x=state(),t=selectedTemplate();
  if(t.protected&&!confirm('This template is protected. Delete it as manager/admin anyway?'))return;
  if(!confirm('Delete '+t.name+'?'))return;
  x.templates=x.templates.filter(function(item){return item.id!==t.id});
  window._at537SelectedTemplate='';
  saveState(x,'Template deleted',t.name);
  renderManager()
 };

 window._at537TemplateFiles=function(event){
  var files=arr(event.target.files),x=state(),t=collectTemplate(),remaining=files.length;
  if(!remaining)return;
  files.forEach(function(file){
   if(file.size>3*1024*1024){
    alert(file.name+' exceeds the 3 MB direct-template attachment limit.');
    if(--remaining===0){replaceTemplate(x,t);saveState(x,'Template attachments updated',t.name);renderManager()}
    return
   }
   var reader=new FileReader();
   reader.onload=function(){
    t.attachments=arr(t.attachments);
    t.attachments.push({
     id:makeId('attachment'),name:file.name,type:file.type||'application/octet-stream',
     size:file.size,dataUrl:reader.result,contentBytes:String(reader.result).split(',')[1]||'',
     source:'manager-template'
    });
    t.previewHash='';t.testHash='';t.active=false;
    if(--remaining===0){
     replaceTemplate(x,t);
     window._at537SelectedTemplate=t.id;
     saveState(x,'Template attachments updated',t.name);
     renderManager()
    }
   };
   reader.readAsDataURL(file)
  })
 };

 window._at537RemoveTemplateAttachment=function(index){
  var x=state(),t=collectTemplate();
  t.attachments=arr(t.attachments);
  t.attachments.splice(index,1);
  t.previewHash='';t.testHash='';t.active=false;
  replaceTemplate(x,t);
  window._at537SelectedTemplate=t.id;
  saveState(x,'Template attachment removed',t.name);
  renderManager()
 };

 window._at537AddIndustry=function(){
  var name=clean(prompt('Approved industry tag name'));
  if(!name)return;
  var x=state();
  if(x.industries.some(function(i){return norm(i.name)===norm(name)})){
   alert('That tag already exists.');return
  }
  x.industries.push({id:makeId('industry'),name:name,active:true,createdAt:now(),source:'manager'});
  saveState(x,'Industry tag created',name);
  renderManager()
 };

 window._at537ToggleIndustry=function(id){
  var x=state(),item=x.industries.filter(function(i){return i.id===id})[0];
  if(!item)return;
  item.active=item.active===false;
  saveState(x,'Industry tag '+(item.active?'activated':'deactivated'),item.name);
  renderManager()
 };

 window._at537ApproveRequest=function(id){
  var x=state(),q=x.requests.filter(function(r){return r.id===id})[0];
  if(!q)return;
  var industry=x.industries.filter(function(i){return norm(i.name)===norm(q.name)})[0];
  if(!industry){
   industry={id:makeId('industry'),name:q.name,active:true,createdAt:now(),source:'approved-request'};
   x.industries.push(industry)
  }else industry.active=true;
  q.status='Approved';q.reviewedAt=now();q.reviewedBy='Manager/Admin';
  var tags=companyTags(q.company,q.rep);tags.push(industry.name);setCompanyTags(q.company,tags,q.rep);
  addActivity(q.company,{
   id:makeId('activity'),source:'industry-approval',type:'Industry Tag Approved',
   subject:industry.name+' approved and assigned',
   detail:'Approved by Manager/Admin from the rep request.',
   date:now(),createdAt:now(),updatedAt:now()
  },q.rep);
  saveState(x,'Industry request approved',q.name+' · '+q.company+' · '+q.rep);
  renderManager()
 };

 window._at537RejectRequest=function(id){
  var x=state(),q=x.requests.filter(function(r){return r.id===id})[0];
  if(!q)return;
  q.status='Rejected';q.reviewedAt=now();q.reviewedBy='Manager/Admin';
  saveState(x,'Industry request rejected',q.name+' · '+q.company);
  renderManager()
 };

 window._at537BrandLogo=function(event){
  var file=event.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(){
   var x=state();x.branding.logoData=reader.result;
   x.templates.forEach(function(t){t.active=false;t.previewHash='';t.testHash=''});
   saveState(x,'Company email logo updated',file.name+' · template tests invalidated');
   renderManager()
  };
  reader.readAsDataURL(file)
 };

 window._at537SaveBranding=function(){
  var x=state();
  x.branding=Object.assign({},x.branding,{
   companyName:val('at537-b-company'),
   tagline:val('at537-b-tagline'),
   address:val('at537-b-address'),
   website:val('at537-b-website'),
   footerHtml:val('at537-b-footer'),
   disclaimer:val('at537-b-disclaimer')
  });
  x.templates.forEach(function(t){t.active=false;t.previewHash='';t.testHash=''});
  saveState(x,'Locked company footer updated','Template tests invalidated');
  alert('Footer saved. Templates must be previewed and tested again before activation.');
  renderManager()
 };

 window._at537SaveMicrosoft=function(){
  var x=state();
  x.microsoft={
   tenantId:val('at537-ms-tenant'),
   clientId:val('at537-ms-client'),
   redirectUri:val('at537-ms-redirect'),
   allowedDomain:val('at537-ms-domain'),
   managerEmail:val('at537-ms-manager')
  };
  saveState(x,'Microsoft 365 settings updated',x.microsoft.allowedDomain);
  renderManager()
 };

 window._at537SetTemplateTestHash=function(templateId,hash){
  var x=state(),t=x.templates.filter(function(item){return item.id===templateId})[0];
  if(t){t.testHash=hash;saveState(x,'Template test recorded',t.name)}
 };

 function ensureManagerPage(){
  if(!document.getElementById('pg-automations')){
   var page=document.createElement('div');
   page.id='pg-automations';
   page.className='page';
   var admin=document.getElementById('pg-admin');
   if(admin&&admin.parentNode)admin.parentNode.insertBefore(page,admin);
   else document.body.appendChild(page)
  }

  var tabBar=document.getElementById('tabBar');
  if(tabBar&&!tabBar.querySelector('[data-at537-top]')){
   var topButton=document.createElement('button');
   topButton.className='tab';
   topButton.dataset.at537Top='1';
   topButton.innerHTML='⚡ Automation & Templates';
   topButton.onclick=function(){gt('automations',topButton)};
   var adminButton=tabBar.querySelector('button[onclick*="admin"]');
   tabBar.insertBefore(topButton,adminButton||null)
  }

  var system=document.querySelector('#tabBar .nav-group[data-group="system"] .nav-group-items');
  if(system&&!system.querySelector('[data-at537-nav]')){
   var navButton=document.createElement('button');
   navButton.className='tab nav-item';
   navButton.dataset.at537Nav='1';
   navButton.dataset.navLabel='Automation & Templates';
   navButton.dataset.navIcon='⚡';
   navButton.innerHTML='<span class="nav-icon">⚡</span><span class="nav-label">Automation & Templates</span>';
   navButton.onclick=function(){gt('automations',navButton)};
   system.insertBefore(navButton,system.firstChild)
  }
 }

 var gtBase=window.gt;
 window.gt=function(page,button){
  if(page==='automations'){
   ensureManagerPage();
   document.querySelectorAll('.page').forEach(function(e){e.classList.remove('active')});
   document.querySelectorAll('.tab').forEach(function(e){e.classList.remove('active')});
   var target=document.getElementById('pg-automations');
   if(target)target.classList.add('active');
   if(button)button.classList.add('active');
   renderManager();
   return
  }
  return typeof gtBase==='function'?gtBase.apply(this,arguments):undefined
 };

 window.TCP537=Object.assign(window.TCP537||{},{
  PRIMARY_TYPES:PRIMARY_TYPES,
  SECONDARY:SECONDARY,
  OUTCOMES:OUTCOMES,
  arr:arr,clean:clean,norm:norm,esc:esc,val:val,checked:checked,now:now,makeId:makeId,
  read:read,write:write,field:field,uniq:uniq,currentRep:currentRep,
  state:state,saveState:saveState,account:account,saveAccount:saveAccount,addActivity:addActivity,
  approvedIndustries:approvedIndustries,companyTags:companyTags,setCompanyTags:setCompanyTags,
  templateHash:templateHash,templateConflict:templateConflict,findTemplate:findTemplate,
  mergeFields:mergeFields,footerHtml:footerHtml,sampleContext:sampleContext,managerPreviewContext:managerPreviewContext,previewAccounts:previewAccounts,
  renderManager:renderManager,installIndustryCard:installIndustryCard,bindOutcome:bindOutcome
 });

 window._at537MatchTemplate=findTemplate;
 window._at537RenderManager=renderManager;
 window._at537DiagnosticsCore=function(){
  var x=state();
  return{
   templates:x.templates.length,
   activeTemplates:x.templates.filter(function(t){return t.active}).length,
   industries:x.industries.length,
   pendingRequests:x.requests.filter(function(r){return r.status==='Pending'}).length
  }
 };

 var afterBase=window._rp2After;
 window._rp2After=function(){
  var result=typeof afterBase==='function'?afterBase.apply(this,arguments):undefined;
  setTimeout(function(){bindOutcome();installIndustryCard()},0);
  return result
 };

 var goBase=window._rp2Go;
 window._rp2Go=function(){
  var result=goBase.apply(this,arguments);
  setTimeout(function(){bindOutcome();installIndustryCard()},50);
  return result
 };

 ensureManagerPage();
 setTimeout(function(){ensureManagerPage();bindOutcome();installIndustryCard()},0);
 setTimeout(function(){ensureManagerPage();bindOutcome();installIndustryCard()},600);
})();
