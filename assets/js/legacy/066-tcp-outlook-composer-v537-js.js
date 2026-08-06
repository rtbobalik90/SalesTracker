
(function(){
 'use strict';

 var API=window.TCP537;
 if(!API)return;

 var EMAIL='tcp_email_composer_v537';
 var ACTION='tcp_rp_action_center_v504';
 var TOKENS='tcp_ms365_tokens_v537';
 var AUTH_PENDING='tcp_ms365_auth_pending_v537';

 window._em537ActiveId=window._em537ActiveId||'';
 window._em537Picker=window._em537Picker||null;

 var autosaveTimer=null;
 var reconcileTimer=null;

 function arr(v){return API.arr(v)}
 function clean(v){return API.clean(v)}
 function norm(v){return API.norm(v)}
 function esc(v){return API.esc(v)}
 function val(id){return API.val(id)}
 function now(){return API.now()}
 function makeId(p){return API.makeId(p)}
 function read(k,d){return API.read(k,d)}
 function write(k,v){return API.write(k,v)}
 function field(o,names,d){return API.field(o,names,d)}
 function uniq(v){return API.uniq(v)}
 function currentRep(){return API.currentRep()}
 function account(company,rep,create){return API.account(company,rep,create)}
 function saveAccount(bundle){return API.saveAccount(bundle)}
 function addActivity(company,activity,rep){return API.addActivity(company,activity,rep)}
 function companyTags(company,rep){return API.companyTags(company,rep)}

 function dateISO(value){
  var d=value?new Date(value):new Date();
  if(isNaN(d.getTime()))d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
 }

 function firstName(name){return clean(name).split(/\s+/)[0]||''}

 function repProfile(rep){
  var result={repTitle:'Sales Specialist',repPhone:'',repEmail:'',repCalendarLink:''};
  try{
   var stored=read('tcp_rp_profile_v2',{});
   var p=stored&&stored.reps&&stored.reps[rep]||stored&&stored[rep]||{};
   result.repTitle=p.title||p.jobTitle||result.repTitle;
   result.repPhone=p.phone||p.directPhone||'';
   result.repEmail=p.email||'';
   result.repCalendarLink=p.calendarLink||p.bookingLink||''
  }catch(e){}
  try{
   if(typeof S!=='undefined'&&S.repProfiles&&S.repProfiles[rep]){
    var s=S.repProfiles[rep];
    result.repTitle=s.title||result.repTitle;
    result.repPhone=s.phone||result.repPhone;
    result.repEmail=s.email||result.repEmail;
    result.repCalendarLink=s.calendarLink||result.repCalendarLink
   }
  }catch(e){}
  return result
 }

 function contactById(company,id){
  var b=account(company,currentRep(),false);
  return b.data&&b.data.contacts.filter(function(contact){
   return String(field(contact,['id','contactId'],'')||'')===String(id||'')
  })[0]||null
 }

 function validEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value))
 }

 function recipients(value){
  var list=Array.isArray(value)?value:String(value||'').split(/[;,]/);
  return uniq(list.map(clean).filter(validEmail))
 }

 function graphRecipients(list){
  return arr(list).map(function(address){
   return{emailAddress:{address:address}}
  })
 }

 function emailStore(){
  var x=read(EMAIL,{version:1,reps:{}});
  if(!x||x.version!==1)x={version:1,reps:{}};
  x.reps=x.reps||{};
  var rep=currentRep()||'manager';
  x.reps[rep]=x.reps[rep]||{drafts:{},events:[]};
  return{x:x,data:x.reps[rep],rep:rep}
 }

 function emailDraft(id){
  var b=emailStore();
  return b.data.drafts[id]||null
 }

 function saveEmailStore(bundle){
  write(EMAIL,bundle.x)
 }

 function putDraft(draft,event){
  var b=emailStore();
  draft.updatedAt=now();
  b.data.drafts[draft.id]=draft;
  if(event)b.data.events.push({type:event,draftId:draft.id,at:now()});
  if(b.data.events.length>700)b.data.events=b.data.events.slice(-700);
  saveEmailStore(b);
  return draft
 }

 function signatureHtml(draft){
  var rows=[
   draft.sigName?'<strong>'+esc(draft.sigName)+'</strong>':'',
   draft.sigTitle?esc(draft.sigTitle):'',
   draft.sigPhone?esc(draft.sigPhone):'',
   draft.sigEmail?'<a href="mailto:'+esc(draft.sigEmail)+'">'+esc(draft.sigEmail)+'</a>':'',
   draft.sigCalendar?'<a href="'+esc(draft.sigCalendar)+'">Schedule a call</a>':''
  ].filter(Boolean);
  return'<div>'+rows.join('<br>')+'</div>'
 }

 function fullBody(draft){
  return(draft.bodyHtml||'')+
   '<div style="margin-top:22px">'+signatureHtml(draft)+'</div>'+
   '<div style="margin-top:14px">'+(draft.footerHtml||API.footerHtml())+'</div>'
 }

 function templateContext(company,contact,callDraft){
  var b=account(company,currentRep(),true);
  return{
   company:company,
   contact:contact||{},
   draft:callDraft||{},
   rep:currentRep(),
   profile:Object.assign({},b.data.profile||{},repProfile(currentRep()))
  }
 }

 function createDraft(options){
  options=options||{};
  var company=options.company||window._cw4CompanyName||window._call532&&window._call532.company||'';
  var b=account(company,currentRep(),true);
  var contact=options.contact||contactById(company,options.contactId)||b.data.contacts[0]||{};
  var template=options.template||null;
  var callDraft=options.callDraft||{};
  var context=templateContext(company,contact,callDraft);
  var profile=repProfile(currentRep());
  var connected=window.TCP537.microsoftStatus('rep');
  var email=field(contact,['email'],'');
  var draft={
   id:makeId('email'),
   company:company,
   rep:currentRep(),
   contactId:field(contact,['id','contactId'],''),
   contactName:field(contact,['name'],''),
   to:email?[email]:[],
   cc:[],
   bcc:[],
   subject:template?API.mergeFields(template.subject,context):'',
   bodyHtml:template?API.mergeFields(template.bodyHtml,context):'<p></p>',
   sigName:currentRep(),
   sigTitle:profile.repTitle,
   sigPhone:profile.repPhone,
   sigEmail:profile.repEmail||connected.address||'',
   sigCalendar:profile.repCalendarLink,
   footerHtml:API.footerHtml(),
   attachments:template?arr(template.attachments).map(function(a){return Object.assign({},a)}):[],
   removedRemoteAttachmentIds:[],
   templateId:template&&template.id||'',
   templateName:template&&template.name||'',
   templateOverride:!!options.templateOverride,
   callActivityId:options.callActivityId||'',
   callType:callDraft.callType||'',
   outcome:callDraft.outcome||'',
   secondaryPurpose:callDraft.secondaryPurpose||'',
   status:'draft',
   createdAt:now(),
   updatedAt:now(),
   outlookMessageId:'',
   remoteModifiedAt:'',
   lastSyncedAt:'',
   localVersion:1,
   localDirty:true,
   conflict:null,
   taskId:'',
   newContactId:'',
   source:options.source||'manual'
  };
  putDraft(draft,'created');
  return draft
 }

 function taskStore(){
  var s=read(ACTION,null);
  if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};
  s.reps[currentRep()]=s.reps[currentRep()]||{manual:[],state:{},events:[]};
  var rep=s.reps[currentRep()];
  rep.manual=arr(rep.manual);
  rep.state=rep.state||{};
  rep.events=arr(rep.events);
  return{s:s,rep:rep}
 }

 function ensureDraftTask(draft){
  var b=taskStore();
  var key='email-draft:'+draft.id;
  var task=b.rep.manual.filter(function(t){return t.emailDraftKey===key})[0];
  if(!task){
   task={
    id:makeId('manual'),
    source:'email-composer',
    category:'email',
    tone:'warn',
    score:220,
    title:'Send voicemail follow-up email — '+draft.company,
    why:'The prepared Outlook follow-up was saved as a draft.',
    action:'Open the linked draft, review it, and send it today.',
    measure:'Microsoft confirms the message was sent.',
    dueDate:dateISO(),
    customer:draft.company,
    contactId:draft.contactId,
    contactName:draft.contactName,
    page:'emaildraft',
    emailDraftId:draft.id,
    emailDraftKey:key
   };
   b.rep.manual.push(task);
   b.rep.events.push({type:'create',taskId:task.id,title:task.title,customer:draft.company,at:now()});
   draft.taskId=task.id;
   write(ACTION,b.s);
   putDraft(draft,'task-created')
  }
  return task
 }

 function completeDraftTask(draft){
  if(!draft.taskId)return;
  var b=taskStore();
  b.rep.state[draft.taskId]=Object.assign({},b.rep.state[draft.taskId]||{},{
   status:'completed',
   completedAt:now(),
   result:'Email sent',
   note:'Microsoft 365 confirmed the linked message was sent.'
  });
  b.rep.events.push({type:'complete',taskId:draft.taskId,title:'Email sent',customer:draft.company,at:now()});
  write(ACTION,b.s)
 }

 function composerFromDom(draft){
  if(!draft)return draft;
  var body=document.getElementById('em537-body');
  draft.to=recipients(val('em537-to'));
  draft.cc=recipients(val('em537-cc'));
  draft.bcc=recipients(val('em537-bcc'));
  draft.subject=val('em537-subject');
  draft.bodyHtml=body?body.innerHTML:draft.bodyHtml;
  draft.sigName=val('em537-sig-name');
  draft.sigTitle=val('em537-sig-title');
  draft.sigPhone=val('em537-sig-phone');
  draft.sigEmail=val('em537-sig-email');
  draft.sigCalendar=val('em537-sig-calendar');
  draft.localVersion=(draft.localVersion||0)+1;
  draft.localDirty=true;
  return draft
 }

 /* Microsoft 365 OAuth 2.0 authorization code + PKCE */
 function tokenStore(){
  var x=read(TOKENS,{version:1,accounts:{}});
  if(!x||x.version!==1||!x.accounts)x={version:1,accounts:{}};
  return x
 }

 function tokenKey(mode){return mode==='manager'?'manager':'rep:'+currentRep()}
 function getToken(mode){return tokenStore().accounts[tokenKey(mode)]||null}

 function saveToken(mode,value){
  var x=tokenStore();
  x.accounts[tokenKey(mode)]=value;
  write(TOKENS,x)
 }

 function clearToken(mode){
  var x=tokenStore();
  delete x.accounts[tokenKey(mode)];
  write(TOKENS,x)
 }

 function b64url(bytes){
  var s='';
  bytes.forEach(function(byte){s+=String.fromCharCode(byte)});
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
 }

 async function sha256(value){
  var bytes=new TextEncoder().encode(value);
  var digest=await crypto.subtle.digest('SHA-256',bytes);
  return b64url(new Uint8Array(digest))
 }

 function randomVerifier(){
  var bytes=new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return b64url(bytes)
 }

 function msConfig(){return API.state().microsoft||{}}

 async function exchangeCode(config,code,verifier){
  var body=new URLSearchParams({
   client_id:config.clientId,
   scope:'openid profile offline_access User.Read Mail.ReadWrite Mail.Send',
   code:code,
   redirect_uri:config.redirectUri,
   grant_type:'authorization_code',
   code_verifier:verifier
  });
  var response=await fetch(
   'https://login.microsoftonline.com/'+encodeURIComponent(config.tenantId)+'/oauth2/v2.0/token',
   {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body}
  );
  var data=await response.json();
  if(!response.ok)throw new Error(data.error_description||data.error||'Microsoft token exchange failed.');
  return data
 }

 async function refreshToken(mode,current){
  var config=msConfig();
  if(!current||!current.refreshToken)throw new Error('Microsoft reconnect required.');
  var body=new URLSearchParams({
   client_id:config.clientId,
   scope:'openid profile offline_access User.Read Mail.ReadWrite Mail.Send',
   refresh_token:current.refreshToken,
   redirect_uri:config.redirectUri,
   grant_type:'refresh_token'
  });
  var response=await fetch(
   'https://login.microsoftonline.com/'+encodeURIComponent(config.tenantId)+'/oauth2/v2.0/token',
   {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body}
  );
  var data=await response.json();
  if(!response.ok)throw new Error(data.error_description||data.error||'Microsoft reconnect required.');
  var updated=Object.assign({},current,{
   accessToken:data.access_token,
   refreshToken:data.refresh_token||current.refreshToken,
   expiresAt:Date.now()+((data.expires_in||3600)-120)*1000,
   updatedAt:now()
  });
  saveToken(mode,updated);
  return updated
 }

 async function accessToken(mode){
  var current=getToken(mode);
  if(!current)throw new Error('Connect Microsoft 365 first.');
  if(Date.now()>Number(current.expiresAt||0))current=await refreshToken(mode,current);
  return current.accessToken
 }

 async function graph(mode,path,options){
  options=options||{};
  var token=await accessToken(mode);
  var headers=Object.assign({
   'Authorization':'Bearer '+token,
   'Content-Type':'application/json',
   'Prefer':'IdType="ImmutableId"'
  },options.headers||{});
  var url=path.indexOf('http')===0?path:'https://graph.microsoft.com/v1.0'+path;
  var response=await fetch(url,Object.assign({},options,{headers:headers}));

  if(response.status===401){
   var refreshed=await refreshToken(mode,getToken(mode));
   headers.Authorization='Bearer '+refreshed.accessToken;
   response=await fetch(url,Object.assign({},options,{headers:headers}))
  }

  if(!response.ok){
   var errorText=await response.text();
   throw new Error('Microsoft Graph '+response.status+': '+errorText.slice(0,280))
  }
  if(response.status===202||response.status===204)return null;
  var text=await response.text();
  return text?JSON.parse(text):null
 }

 async function finishConnection(mode,data){
  var value={
   accessToken:data.access_token,
   refreshToken:data.refresh_token||'',
   expiresAt:Date.now()+((data.expires_in||3600)-120)*1000,
   scope:data.scope||'',
   connectedAt:now(),
   updatedAt:now()
  };
  saveToken(mode,value);
  var me=await graph(mode,'/me?$select=id,displayName,mail,userPrincipalName');
  value.account=me;
  value.updatedAt=now();

  var allowed=clean(msConfig().allowedDomain).toLowerCase();
  var address=clean(me.mail||me.userPrincipalName).toLowerCase();
  if(allowed&&address.split('@')[1]!==allowed){
   clearToken(mode);
   throw new Error('Only '+allowed+' Microsoft accounts may connect.')
  }

  saveToken(mode,value);
  return value
 }

 async function handleAuthCallback(){
  var query=new URLSearchParams(location.search||'');
  var code=query.get('code');
  var stateId=query.get('state');
  var error=query.get('error');
  if(!code&&!error)return;

  var pending=read(AUTH_PENDING,null);
  try{
   if(error)throw new Error(query.get('error_description')||error);
   if(!pending||pending.state!==stateId)throw new Error('Microsoft sign-in state did not match.');
   var data=await exchangeCode(pending.config,code,pending.verifier);
   var connected=await finishConnection(pending.mode,data);
   write(AUTH_PENDING,null);
   history.replaceState({},document.title,pending.cleanUrl||location.pathname);

   if(window.opener&&window.opener!==window){
    window.opener.postMessage({
     type:'tcp-ms365-connected-v537',
     mode:pending.mode,
     account:connected.account
    },location.origin);
    window.close()
   }else{
    alert('Microsoft 365 connected.');
    refreshCurrent()
   }
  }catch(e){
   history.replaceState({},document.title,pending&&pending.cleanUrl||location.pathname);
   if(window.opener&&window.opener!==window){
    window.opener.postMessage({type:'tcp-ms365-error-v537',message:e.message},location.origin);
    window.close()
   }else alert(e.message)
  }
 }

 async function connectMicrosoft(mode){
  mode=mode||'rep';
  var config=msConfig();
  if(!clean(config.tenantId)||!clean(config.clientId)){
   alert('Configure the Microsoft tenant ID and application client ID in Automation & Templates first.');
   return
  }
  config.redirectUri=clean(config.redirectUri)||(location.origin+location.pathname);
  var verifier=randomVerifier();
  var challenge=await sha256(verifier);
  var stateId=makeId('state');
  var cleanUrl=location.origin+location.pathname;

  write(AUTH_PENDING,{
   state:stateId,
   verifier:verifier,
   mode:mode,
   config:config,
   cleanUrl:cleanUrl,
   at:now()
  });

  var url='https://login.microsoftonline.com/'+encodeURIComponent(config.tenantId)+'/oauth2/v2.0/authorize?'+
   new URLSearchParams({
    client_id:config.clientId,
    response_type:'code',
    redirect_uri:config.redirectUri,
    response_mode:'query',
    scope:'openid profile offline_access User.Read Mail.ReadWrite Mail.Send',
    code_challenge:challenge,
    code_challenge_method:'S256',
    state:stateId,
    prompt:'select_account'
   }).toString();

  var popup=window.open(url,'tcpMicrosoftConnect','width=620,height=760,resizable=yes,scrollbars=yes');
  if(!popup)location.href=url
 }

 function disconnectMicrosoft(mode){
  clearToken(mode||'rep');
  refreshCurrent()
 }

 function microsoftStatus(mode){
  var t=getToken(mode||'rep');
  return t?{
   connected:true,
   address:t.account&&t.account.mail||t.account&&t.account.userPrincipalName||'',
   name:t.account&&t.account.displayName||'',
   expiresAt:t.expiresAt
  }:{connected:false,address:'',name:''}
 }

 /* Outlook draft synchronization */
 async function listRemoteAttachments(draft,mode){
  if(!draft.outlookMessageId)return[];
  var result=await graph(mode,'/me/messages/'+encodeURIComponent(draft.outlookMessageId)+'/attachments?$select=id,name,contentType,size,isInline');
  return arr(result&&result.value).map(function(a){
   return{
    id:makeId('attachment'),
    name:a.name,
    type:a.contentType||'application/octet-stream',
    size:a.size||0,
    source:'outlook',
    remoteId:a.id,
    isInline:!!a.isInline
   }
  })
 }

 async function syncAttachments(draft,mode){
  if(!draft.outlookMessageId)return;

  var removed=arr(draft.removedRemoteAttachmentIds);
  for(var i=0;i<removed.length;i++){
   await graph(mode,
    '/me/messages/'+encodeURIComponent(draft.outlookMessageId)+'/attachments/'+encodeURIComponent(removed[i]),
    {method:'DELETE'}
   )
  }
  draft.removedRemoteAttachmentIds=[];

  var unsynced=arr(draft.attachments).filter(function(a){
   return !a.remoteId&&(a.contentBytes||a.dataUrl)
  });

  for(var j=0;j<unsynced.length;j++){
   var item=unsynced[j];
   var bytes=item.contentBytes||String(item.dataUrl||'').split(',')[1]||'';
   if(!bytes)continue;
   var created=await graph(mode,
    '/me/messages/'+encodeURIComponent(draft.outlookMessageId)+'/attachments',
    {
     method:'POST',
     body:JSON.stringify({
      '@odata.type':'#microsoft.graph.fileAttachment',
      name:item.name,
      contentType:item.type||'application/octet-stream',
      contentBytes:bytes
     })
    }
   );
   item.remoteId=created&&created.id||'';
   item.source=item.source||'tracker'
  }
 }

 function pullRecipients(list){
  return arr(list).map(function(r){return r.emailAddress&&r.emailAddress.address||''}).filter(Boolean)
 }

 async function remoteSync(draft,mode){
  mode=mode||'rep';
  if(!getToken(mode))return draft;

  var payload={
   subject:draft.subject,
   body:{contentType:'HTML',content:fullBody(draft)},
   toRecipients:graphRecipients(draft.to),
   ccRecipients:graphRecipients(draft.cc),
   bccRecipients:graphRecipients(draft.bcc)
  };

  if(!draft.outlookMessageId){
   var created=await graph(mode,'/me/messages',{method:'POST',body:JSON.stringify(payload)});
   draft.outlookMessageId=created.id;
   draft.remoteModifiedAt=created.lastModifiedDateTime||now();
   draft.outlookCreatedAt=now();
   await syncAttachments(draft,mode);
   draft.localDirty=false;
   draft.lastSyncedAt=now();
   putDraft(draft,'outlook-created');
   return draft
  }

  var remote=await graph(mode,
   '/me/messages/'+encodeURIComponent(draft.outlookMessageId)+
   '?$select=id,isDraft,lastModifiedDateTime,sentDateTime,subject,body,toRecipients,ccRecipients,bccRecipients'
  );

  if(remote&&!remote.isDraft)return markSent(draft,'outlook',remote);

  var remoteTime=new Date(remote.lastModifiedDateTime||0).getTime();
  var localTime=new Date(draft.updatedAt||0).getTime();
  var lastRemote=new Date(draft.remoteModifiedAt||0).getTime();

  if(remoteTime>lastRemote+1000&&draft.localDirty){
   if(remoteTime>localTime){
    draft.conflict={
     detectedAt:now(),
     winner:'Outlook',
     acknowledged:false,
     localSnapshot:{
      subject:draft.subject,bodyHtml:draft.bodyHtml,to:draft.to,cc:draft.cc,bcc:draft.bcc,
      attachments:draft.attachments,updatedAt:draft.updatedAt
     },
     remoteModifiedAt:remote.lastModifiedDateTime
    };
    draft.subject=remote.subject||'';
    draft.bodyHtml=remote.body&&remote.body.content||'';
    draft.to=pullRecipients(remote.toRecipients);
    draft.cc=pullRecipients(remote.ccRecipients);
    draft.bcc=pullRecipients(remote.bccRecipients);
    draft.attachments=await listRemoteAttachments(draft,mode);
    draft.localDirty=false;
    draft.remoteModifiedAt=remote.lastModifiedDateTime;
    putDraft(draft,'conflict-outlook-won');
    return draft
   }else{
    draft.conflict={
     detectedAt:now(),
     winner:'Tracker',
     acknowledged:false,
     remoteSnapshot:{
      subject:remote.subject,bodyHtml:remote.body&&remote.body.content||'',
      to:pullRecipients(remote.toRecipients),
      cc:pullRecipients(remote.ccRecipients),
      bcc:pullRecipients(remote.bccRecipients),
      updatedAt:remote.lastModifiedDateTime
     }
    }
   }
  }else if(remoteTime>localTime&&!draft.localDirty){
   draft.subject=remote.subject||'';
   draft.bodyHtml=remote.body&&remote.body.content||'';
   draft.to=pullRecipients(remote.toRecipients);
   draft.cc=pullRecipients(remote.ccRecipients);
   draft.bcc=pullRecipients(remote.bccRecipients);
   draft.attachments=await listRemoteAttachments(draft,mode);
   draft.remoteModifiedAt=remote.lastModifiedDateTime;
   draft.lastSyncedAt=now();
   putDraft(draft,'outlook-pulled');
   return draft
  }

  await graph(mode,'/me/messages/'+encodeURIComponent(draft.outlookMessageId),{
   method:'PATCH',
   body:JSON.stringify(payload)
  });
  await syncAttachments(draft,mode);
  draft.remoteModifiedAt=now();
  draft.lastSyncedAt=now();
  draft.localDirty=false;
  putDraft(draft,'outlook-updated');
  return draft
 }

 function markSent(draft,method,remote){
  if(draft.status==='sent')return draft;
  draft.status='sent';
  draft.sentAt=remote&&remote.sentDateTime||now();
  draft.sentMethod=method;
  draft.remoteFinal=remote||null;
  draft.localDirty=false;
  putDraft(draft,'sent');
  completeDraftTask(draft);

  addActivity(draft.company,{
   id:makeId('activity'),
   source:'outlook-email',
   type:'Email',
   subject:draft.subject,
   detail:'Sent through Microsoft 365 from '+currentRep()+'.',
   bodyHtml:draft.bodyHtml,
   to:draft.to,
   cc:draft.cc,
   bcc:draft.bcc,
   attachments:arr(draft.attachments).map(function(a){return a.name}),
   date:draft.sentAt,
   createdAt:draft.sentAt,
   updatedAt:draft.sentAt,
   contactId:draft.contactId,
   contactName:draft.contactName,
   templateId:draft.templateId,
   templateName:draft.templateName,
   callActivityId:draft.callActivityId,
   outlookMessageId:draft.outlookMessageId,
   sentMethod:method
  });

  if(draft.newContactId){
   setTimeout(function(){
    try{
     _rp2Go('customers');
     setTimeout(function(){_cw4OpenCompany(encodeURIComponent(draft.company),'relationships')},40)
    }catch(e){}
   },80)
  }
  return draft
 }

 async function sendDraft(draft){
  if(!draft.to.length)throw new Error('Add at least one valid To recipient.');
  if(!getToken('rep'))throw new Error('Connect Microsoft 365 from My Profile before sending.');
  if(draft.conflict&&!draft.conflict.acknowledged){
   throw new Error('A draft conflict must be acknowledged before sending.')
  }

  await remoteSync(draft,'rep');
  if(draft.status==='sent')return draft;

  await graph('rep','/me/messages/'+encodeURIComponent(draft.outlookMessageId)+'/send',{
   method:'POST',body:''
  });

  var remote=null;
  for(var attempt=0;attempt<5;attempt++){
   await new Promise(function(resolve){setTimeout(resolve,600+attempt*450)});
   try{
    remote=await graph('rep',
     '/me/messages/'+encodeURIComponent(draft.outlookMessageId)+
     '?$select=id,isDraft,sentDateTime,lastModifiedDateTime,subject,toRecipients,ccRecipients,bccRecipients,body'
    );
    if(remote&&!remote.isDraft)break
   }catch(e){}
  }
  return markSent(draft,'tracker',remote||{sentDateTime:now()})
 }

 async function sendTemplateTest(template,context,address){
  if(!getToken('manager')){
   connectMicrosoft('manager');
   throw new Error('Connect the manager test mailbox, then click Send Microsoft test again.')
  }
  var state=API.state();
  var message=await graph('manager','/me/messages',{
   method:'POST',
   body:JSON.stringify({
    subject:'[TEMPLATE TEST] '+API.mergeFields(template.subject,context),
    body:{
     contentType:'HTML',
     content:'<div style="padding:8px;background:#fff5d8"><strong>Template test only.</strong> No company activity or rep task was created.</div>'+
      API.mergeFields(template.bodyHtml,context)+
      '<div style="margin-top:18px">'+API.footerHtml()+'</div>'
    },
    toRecipients:graphRecipients([address])
   })
  });

  for(var i=0;i<arr(template.attachments).length;i++){
   var attachment=template.attachments[i];
   var bytes=attachment.contentBytes||String(attachment.dataUrl||'').split(',')[1]||'';
   if(!bytes)continue;
   await graph('manager','/me/messages/'+encodeURIComponent(message.id)+'/attachments',{
    method:'POST',
    body:JSON.stringify({
     '@odata.type':'#microsoft.graph.fileAttachment',
     name:attachment.name,
     contentType:attachment.type||'application/octet-stream',
     contentBytes:bytes
    })
   })
  }

  await graph('manager','/me/messages/'+encodeURIComponent(message.id)+'/send',{
   method:'POST',body:''
  });
  return true
 }

 /* Composer */
 function contactResolver(draft){
  if(draft.to.length)return'';
  var b=account(draft.company,currentRep(),true);
  var contacts=b.data.contacts.filter(function(c){return validEmail(c.email)});

  return'<div class="em537-missing"><strong>No email address is selected.</strong><br>'+
   'Select another company contact, add an email to the call contact, create a new contact, or save the draft without a recipient.'+
   '<div class="em537-contact-options">'+contacts.map(function(c){
    return'<div class="em537-contact-card" onclick="_em537UseContact(\''+encodeURIComponent(field(c,['id','contactId'],''))+'\')">'+
     '<strong>'+esc(c.name)+'</strong><span>'+esc(c.email)+'</span></div>'
   }).join('')+'</div>'+
   '<div class="em537-new-contact"><input id="em537-current-email" type="email" placeholder="Email for current contact">'+
    '<button class="em537-secondary" onclick="_em537UpdateContactEmail()">Add email to selected contact</button><span></span></div>'+
   '<div class="em537-new-contact"><input id="em537-new-name" placeholder="New contact name">'+
    '<input id="em537-new-title" placeholder="Title / role">'+
    '<input id="em537-new-email" type="email" placeholder="New contact email"></div>'+
   '<button class="em537-secondary" style="margin-top:8px" onclick="_em537CreateContact()">Create contact and address email</button>'+
  '</div>'
 }

 function composerHtml(draft){
  var connection=microsoftStatus('rep');
  var attachments=arr(draft.attachments);

  return'<div class="em537-wrap" onclick="if(event.target===this)_em537Close()">'+
   '<section class="em537-compose">'+
    '<header class="em537-head"><div><strong>New message · '+esc(draft.company)+'</strong>'+
     '<span>'+(draft.templateName?'Template: '+esc(draft.templateName):'Blank company email')+
      (connection.connected?' · Outlook connected':' · Outlook connection required to send')+'</span></div>'+
     '<div class="em537-head-actions"><button class="em537-icon" onclick="_em537Close()" title="Save draft and minimize">—</button>'+
      '<button class="em537-icon" onclick="_em537Close()" title="Save draft and close">×</button></div></header>'+
    (draft.conflict&&!draft.conflict.acknowledged?
     '<div class="em537-conflict"><strong>Draft conflict detected.</strong> '+esc(draft.conflict.winner)+
      ' had the newest saved version. The losing version remains in audit history. '+
      '<button class="em537-small" onclick="_em537AcknowledgeConflict()">Acknowledge</button></div>':'')+
    '<div class="em537-fields">'+
     '<div class="em537-line"><label>To</label><input id="em537-to" value="'+esc(draft.to.join('; '))+'" oninput="_em537Touch()">'+
      '<div class="em537-rec-actions"><button class="em537-small" onclick="_em537ToggleCc()">Cc/Bcc</button></div></div>'+
     '<div class="em537-line" id="em537-cc-line" style="'+((draft.cc.length||draft.bcc.length)?'':'display:none')+'"><label>Cc</label>'+
      '<input id="em537-cc" value="'+esc(draft.cc.join('; '))+'" oninput="_em537Touch()"><span></span></div>'+
     '<div class="em537-line" id="em537-bcc-line" style="'+((draft.cc.length||draft.bcc.length)?'':'display:none')+'"><label>Bcc</label>'+
      '<input id="em537-bcc" value="'+esc(draft.bcc.join('; '))+'" oninput="_em537Touch()"><span></span></div>'+
     '<div class="em537-line"><label>From</label><div class="em537-from">'+
      esc(connection.address||draft.sigEmail||currentRep()+' · Microsoft 365 not connected')+'</div><span></span></div>'+
     '<div class="em537-line"><label>Subject</label><input id="em537-subject" value="'+esc(draft.subject)+'" oninput="_em537Touch()"><span></span></div>'+
    '</div>'+
    '<div class="em537-toolbar">'+
     '<button class="em537-tool" onclick="_em537Cmd(\'bold\')"><b>B</b></button>'+
     '<button class="em537-tool" onclick="_em537Cmd(\'italic\')"><i>I</i></button>'+
     '<button class="em537-tool" onclick="_em537Cmd(\'underline\')"><u>U</u></button>'+
     '<button class="em537-tool" onclick="_em537Cmd(\'insertUnorderedList\')">• List</button>'+
     '<button class="em537-tool" onclick="_em537Link()">🔗</button>'+
     '<button class="em537-tool" onclick="_em537AddFiles()">📎</button>'+
    '</div>'+
    '<div class="em537-body-shell">'+contactResolver(draft)+
     '<div id="em537-body" class="em537-body" contenteditable="true" oninput="_em537Touch()">'+(draft.bodyHtml||'<p></p>')+'</div>'+
     '<div class="em537-signature"><strong style="font-size:10px;color:#475569">Rep signature · editable for this email</strong>'+
      '<div class="em537-sig-grid">'+
       '<input id="em537-sig-name" value="'+esc(draft.sigName)+'" placeholder="Name">'+
       '<input id="em537-sig-title" value="'+esc(draft.sigTitle)+'" placeholder="Title">'+
       '<input id="em537-sig-phone" value="'+esc(draft.sigPhone)+'" placeholder="Phone">'+
       '<input id="em537-sig-email" value="'+esc(draft.sigEmail)+'" placeholder="Email">'+
       '<input id="em537-sig-calendar" value="'+esc(draft.sigCalendar)+'" placeholder="Calendar link">'+
      '</div>'+
      '<div class="em537-footer-lock">'+draft.footerHtml+'</div>'+
     '</div>'+
    '</div>'+
    '<div class="em537-attachments">'+
     '<button class="em537-secondary" onclick="_em537AddFiles()">＋ Attach from device</button>'+
     '<button class="em537-secondary" onclick="_em537CompanyAttachments()">Company files</button>'+
     attachments.map(function(a,index){
      return'<span class="em537-attachment">📎 '+esc(a.name)+' <button onclick="_em537RemoveAttachment('+index+')">×</button></span>'
     }).join('')+
     '<input id="em537-file-input" type="file" multiple style="display:none" onchange="_em537FilesSelected(event)">'+
    '</div>'+
    '<footer class="em537-foot"><div class="em537-draft-status" id="em537-save-status">Autosaving to the tracker'+
     (connection.connected?' and Outlook Drafts':'')+'…</div>'+
     '<div class="em537-foot-actions">'+
      (!connection.connected?'<button class="em537-secondary" onclick="TCP537.connectMicrosoft(\'rep\')">Connect Outlook</button>':'')+
      '<button class="em537-secondary" onclick="_em537Close()">Save draft & close</button>'+
      '<button class="em537-send" onclick="_em537Send()">Send</button>'+
     '</div></footer>'+
   '</section>'+
  '</div>'
 }

 function renderComposer(){
  var host=document.getElementById('em537-host');
  if(!host){
   host=document.createElement('div');
   host.id='em537-host';
   (document.getElementById('rp-overlay')||document.body).appendChild(host)
  }
  var draft=emailDraft(window._em537ActiveId);
  host.innerHTML=draft&&draft.status!=='sent'?composerHtml(draft):'';
  if(draft&&draft.status!=='sent')startAutosave();
  else stopAutosave()
 }

 function startAutosave(){
  stopAutosave();
  autosaveTimer=setInterval(function(){
   var draft=emailDraft(window._em537ActiveId);
   if(!draft||draft.status==='sent')return;
   composerFromDom(draft);
   putDraft(draft,'autosave');
   var status=document.getElementById('em537-save-status');
   if(status)status.textContent='Saved '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
   if((draft.localVersion||0)%4===0)remoteSync(draft,'rep').catch(function(){})
  },2500)
 }

 function stopAutosave(){
  if(autosaveTimer){clearInterval(autosaveTimer);autosaveTimer=null}
 }

 function closeComposer(createTask){
  var draft=emailDraft(window._em537ActiveId);
  if(draft&&draft.status!=='sent'){
   composerFromDom(draft);
   putDraft(draft,'closed');
   if(createTask!==false)ensureDraftTask(draft);
   remoteSync(draft,'rep').catch(function(){})
  }
  window._em537ActiveId='';
  renderComposer();
  stopAutosave()
 }

 window._em537OpenDraft=function(encoded){
  var draft=emailDraft(decodeURIComponent(encoded||''));
  if(!draft){alert('Draft not found.');return}
  window._em537ActiveId=draft.id;
  renderComposer();
  remoteSync(draft,'rep').then(renderComposer).catch(function(){})
 };
 window._em537Touch=function(){var s=document.getElementById('em537-save-status');if(s)s.textContent='Saving…'};
 window._em537ToggleCc=function(){['em537-cc-line','em537-bcc-line'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display=''})};
 window._em537Cmd=function(command){document.execCommand(command,false,null);var body=document.getElementById('em537-body');if(body)body.focus();window._em537Touch()};
 window._em537Link=function(){var url=prompt('Link URL');if(url)document.execCommand('createLink',false,url)};
 window._em537Close=function(){closeComposer(true)};
 window._em537AcknowledgeConflict=function(){
  var draft=emailDraft(window._em537ActiveId);
  if(draft&&draft.conflict){draft.conflict.acknowledged=true;putDraft(draft,'conflict-acknowledged');renderComposer()}
 };

 window._em537UseContact=function(encoded){
  var draft=emailDraft(window._em537ActiveId);
  var contact=contactById(draft.company,decodeURIComponent(encoded));
  if(contact&&contact.email){
   draft.contactId=field(contact,['id','contactId'],'');
   draft.contactName=contact.name;
   draft.to=[contact.email];
   putDraft(draft,'recipient-selected');
   renderComposer()
  }
 };

 window._em537UpdateContactEmail=function(){
  var draft=emailDraft(window._em537ActiveId);
  var email=val('em537-current-email');
  if(!validEmail(email)){alert('Enter a valid email address.');return}
  var b=account(draft.company,currentRep(),true);
  var contact=b.data.contacts.filter(function(c){
   return String(field(c,['id','contactId'],'')||'')===String(draft.contactId||'')
  })[0];
  if(!contact){alert('The selected contact could not be found. Create a new contact instead.');return}
  contact.email=email;contact.updatedAt=now();
  saveAccount(b);
  draft.to=[email];
  putDraft(draft,'contact-email-added');
  renderComposer()
 };

 window._em537CreateContact=function(){
  var draft=emailDraft(window._em537ActiveId);
  var name=val('em537-new-name'),title=val('em537-new-title'),email=val('em537-new-email');
  if(!name||!validEmail(email)){alert('Enter the new contact name and a valid email address.');return}
  var b=account(draft.company,currentRep(),true);
  var contact={
   id:makeId('contact'),name:name,title:title,email:email,phone:'',
   buyingRole:'',decisionMaker:false,createdAt:now(),updatedAt:now(),source:'email-composer'
  };
  b.data.contacts.push(contact);
  saveAccount(b);
  draft.contactId=contact.id;
  draft.contactName=contact.name;
  draft.to=[email];
  draft.newContactId=contact.id;
  putDraft(draft,'contact-created');
  renderComposer()
 };

 window._em537AddFiles=function(){var input=document.getElementById('em537-file-input');if(input)input.click()};

 window._em537FilesSelected=function(event){
  var draft=emailDraft(window._em537ActiveId);
  var files=arr(event.target.files),remaining=files.length;
  if(!remaining)return;

  var currentBytes=arr(draft.attachments).reduce(function(sum,a){return sum+(Number(a.size)||0)},0);
  files.forEach(function(file){
   if(file.size>2*1024*1024||currentBytes+file.size>4*1024*1024){
    alert(file.name+' exceeds the v537 direct-upload limit. Use a smaller file or a company-hosted document.');
    if(--remaining===0)renderComposer();
    return
   }
   currentBytes+=file.size;
   var reader=new FileReader();
   reader.onload=function(){
    draft.attachments.push({
     id:makeId('attachment'),name:file.name,type:file.type||'application/octet-stream',
     size:file.size,dataUrl:reader.result,contentBytes:String(reader.result).split(',')[1]||'',
     source:'device'
    });
    putDraft(draft,'attachment-added');
    if(--remaining===0)renderComposer()
   };
   reader.readAsDataURL(file)
  })
 };

 window._em537RemoveAttachment=function(index){
  var draft=emailDraft(window._em537ActiveId);
  var removed=draft.attachments.splice(index,1)[0];
  if(removed&&removed.remoteId){
   draft.removedRemoteAttachmentIds=arr(draft.removedRemoteAttachmentIds);
   draft.removedRemoteAttachmentIds.push(removed.remoteId)
  }
  putDraft(draft,'attachment-removed');
  renderComposer()
 };

 window._em537CompanyAttachments=function(){
  var draft=emailDraft(window._em537ActiveId);
  var b=account(draft.company,currentRep(),true);
  var files=arr(b.data.files).filter(function(f){return f.dataUrl||f.contentBytes});
  window._em537Picker={type:'attachments',files:files};
  renderPicker()
 };

 window._em537Send=async function(){
  var draft=emailDraft(window._em537ActiveId);
  composerFromDom(draft);
  putDraft(draft,'send-requested');
  var button=document.querySelector('.em537-send');
  if(button){button.disabled=true;button.textContent='Sending…'}
  try{
   await sendDraft(draft);
   window._em537ActiveId='';
   renderComposer();
   alert('Email sent from your Outlook mailbox.')
  }catch(e){
   alert(e.message);
   renderComposer()
  }
 };

 function pickerHtml(){
  var picker=window._em537Picker;
  if(!picker)return'';

  if(picker.type==='start'){
   return'<div class="em537-picker" onclick="if(event.target===this)_em537ClosePicker()">'+
    '<div class="em537-picker-card"><div class="em537-picker-head"><div><strong>Email '+esc(picker.company)+'</strong>'+
     '<div style="margin-top:4px;color:#8f9db2;font-size:9px">Recommended industry matches appear first, followed by all active templates.</div></div>'+
     '<button class="em537-icon" onclick="_em537ClosePicker()">×</button></div>'+
     '<div class="em537-picker-body">'+
      '<div class="em537-template-option" onclick="_em537ChooseTemplate(\'\')"><strong>＋ Blank email</strong><span>Start with recipients, editable signature, and locked company footer.</span></div>'+
      arr(picker.templates).map(function(row){
       return'<div class="em537-template-option" onclick="_em537ChooseTemplate(\''+row.template.id+'\')">'+
        '<strong>'+esc(row.template.name)+(row.recommended?' · Recommended':'')+'</strong>'+
        '<span>'+esc(row.template.primaryType+' · '+row.template.outcome+(row.template.secondaryPurpose?' · '+row.template.secondaryPurpose:''))+'</span>'+
        (!row.recommended?'<div class="em537-warning">This template does not match the company’s approved industry tags. Continuing records an override.</div>':'')+
       '</div>'
      }).join('')+
     '</div></div></div>'
  }

  if(picker.type==='attachments'){
   return'<div class="em537-picker" onclick="if(event.target===this)_em537ClosePicker()">'+
    '<div class="em537-picker-card"><div class="em537-picker-head"><strong>Company files</strong>'+
     '<button class="em537-icon" onclick="_em537ClosePicker()">×</button></div>'+
     '<div class="em537-picker-body">'+
      (picker.files.length?picker.files.map(function(file,index){
       return'<div class="em537-template-option" onclick="_em537ChooseCompanyAttachment('+index+')">'+
        '<strong>📎 '+esc(file.name||file.fileName||'Company file')+'</strong>'+
        '<span>'+esc(file.type||file.mimeType||'Attached company file')+'</span></div>'
      }).join(''):'<div class="em537-template-option"><strong>No sendable company files</strong><span>Files must include stored file content to attach directly.</span></div>')+
     '</div></div></div>'
  }

  return''
 }

 function renderPicker(){
  var host=document.getElementById('em537-picker-host');
  if(!host){
   host=document.createElement('div');
   host.id='em537-picker-host';
   (document.getElementById('rp-overlay')||document.body).appendChild(host)
  }
  host.innerHTML=pickerHtml()
 }

 window._em537ClosePicker=function(){window._em537Picker=null;renderPicker()};

 window._em537ChooseTemplate=function(templateId){
  var picker=window._em537Picker;
  var state=API.state();
  var template=templateId?state.templates.filter(function(t){return t.id===templateId})[0]:null;
  var b=account(picker.company,currentRep(),true);
  var contact=b.data.contacts.filter(function(c){return validEmail(c.email)})[0]||b.data.contacts[0]||{};
  var tags=companyTags(picker.company);
  var recommended=!template||template.allIndustries||arr(template.industries).some(function(industry){
   return tags.some(function(tag){return norm(tag)===norm(industry)})
  });

  if(template&&!recommended&&!confirm('This template does not match the company’s approved industry tags. Continue and record the override?'))return;

  var draft=createDraft({
   company:picker.company,
   contact:contact,
   template:template,
   templateOverride:!!(template&&!recommended),
   source:'manual-company-email'
  });

  if(draft.templateOverride){
   API.saveState(state,'Template industry override',
    currentRep()+' · '+picker.company+' · '+template.name+
    ' · company tags: '+tags.join(', ')+' · template tags: '+arr(template.industries).join(', ')
   )
  }

  window._em537Picker=null;
  window._em537ActiveId=draft.id;
  renderPicker();
  renderComposer()
 };

 window._em537ChooseCompanyAttachment=function(index){
  var picker=window._em537Picker;
  var draft=emailDraft(window._em537ActiveId);
  var file=picker.files[index];
  if(file){
   draft.attachments.push({
    id:makeId('attachment'),
    name:file.name||file.fileName||'Company file',
    type:file.type||file.mimeType||'application/octet-stream',
    size:file.size||0,
    dataUrl:file.dataUrl||'',
    contentBytes:file.contentBytes||String(file.dataUrl||'').split(',')[1]||'',
    source:'company'
   });
   putDraft(draft,'company-attachment-added')
  }
  window._em537Picker=null;
  renderPicker();
  renderComposer()
 };

 window._em537Start=function(encoded){
  var company=decodeURIComponent(encoded||'');
  var state=API.state();
  var tags=companyTags(company);
  var rows=state.templates.filter(function(t){return t.active}).map(function(template){
   var recommended=template.allIndustries||arr(template.industries).some(function(industry){
    return tags.some(function(tag){return norm(tag)===norm(industry)})
   });
   return{template:template,recommended:recommended}
  }).sort(function(a,b){
   return Number(b.recommended)-Number(a.recommended)||a.template.name.localeCompare(b.template.name)
  });

  window._em537Picker={type:'start',company:company,templates:rows};
  renderPicker()
 };

 /* Post-call automation */
 window._at537AfterCall=function(payload){
  var callDraft=payload.draft||{};
  var company=payload.company;
  var contact=payload.contact||{};
  if(callDraft.callType!=='Account Updating Call'||callDraft.outcome!=='Left voicemail')return;

  var template=API.findTemplate(
   callDraft.callType,
   callDraft.outcome,
   callDraft.secondaryPurpose,
   companyTags(company)
  );

  if(!template){
   alert('Call saved. No active industry-specific or All Industries voicemail template is available. Create one in Automation & Templates.');
   return
  }

  var draft=createDraft({
   company:company,
   contact:contact,
   template:template,
   callDraft:callDraft,
   callActivityId:payload.activity&&payload.activity.id||'',
   source:'post-call-automation'
  });

  window._em537ActiveId=draft.id;
  renderComposer()
 };

 /* Replace mailto company action with the in-app composer. */
 window._cw5Email=function(encoded){window._em537Start(encoded)};

 /* My Profile Microsoft connection card */
 function installMicrosoftCard(){
  if(!window._rp2||_rp2.page!=='profile')return;
  var page=document.getElementById('rp2-page');
  if(!page||document.getElementById('ms537-profile-card'))return;

  var status=microsoftStatus('rep');
  var card=document.createElement('div');
  card.id='ms537-profile-card';
  card.className='ms537-card';
  card.innerHTML='<strong>Microsoft 365 Connection</strong>'+
   '<p>'+(status.connected?
    ('Connected as '+esc(status.address)+'. Outlook drafts and sent mail are linked to the tracker.'):
    'Connect your Triple Crown Outlook account once to send email, synchronize drafts, and reconcile messages sent directly from Outlook.')+
   '</p><button onclick="'+(status.connected?"TCP537.disconnectMicrosoft('rep')":"TCP537.connectMicrosoft('rep')")+'">'+
    (status.connected?'Disconnect Microsoft 365':'Connect Microsoft 365')+'</button>';
  page.insertBefore(card,page.firstChild)
 }

 /* Today’s Business draft task route */
 var businessBase=window._ud4OpenBusiness;
 window._ud4OpenBusiness=function(page,encoded){
  if(page==='emaildraft'){
   var company=decodeURIComponent(encoded||'');
   var b=emailStore();
   var draft=Object.keys(b.data.drafts).map(function(k){return b.data.drafts[k]}).filter(function(item){
    return item.status!=='sent'&&norm(item.company)===norm(company)
   }).sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt))})[0];
   if(draft){window._em537OpenDraft(encodeURIComponent(draft.id));return}
   alert('The linked email draft was not found.');
   return
  }
  return typeof businessBase==='function'?businessBase.apply(this,arguments):undefined
 };

 /* Outlook reconciliation */
 async function reconcile(){
  if(!currentRep()||!getToken('rep'))return;
  var b=emailStore();
  var drafts=Object.keys(b.data.drafts).map(function(k){return b.data.drafts[k]}).filter(function(d){
   return d.status!=='sent'&&d.outlookMessageId
  });

  for(var i=0;i<drafts.length;i++){
   try{
    var remote=await graph('rep',
     '/me/messages/'+encodeURIComponent(drafts[i].outlookMessageId)+
     '?$select=id,isDraft,sentDateTime,lastModifiedDateTime,subject,body,toRecipients,ccRecipients,bccRecipients'
    );
    if(remote&&!remote.isDraft)markSent(drafts[i],'outlook',remote);
    else await remoteSync(drafts[i],'rep')
   }catch(e){}
  }
 }

 function refreshCurrent(){
  try{
   var manager=document.getElementById('pg-automations');
   if(manager&&manager.classList.contains('active'))API.renderManager()
  }catch(e){}
  try{installMicrosoftCard();API.installIndustryCard();renderComposer()}catch(e){}
 }

 Object.assign(window.TCP537,{
  connectMicrosoft:connectMicrosoft,
  disconnectMicrosoft:disconnectMicrosoft,
  microsoftStatus:microsoftStatus,
  graph:graph,
  sendTemplateTest:sendTemplateTest,
  emailStore:emailStore,
  emailDraft:emailDraft,
  createDraft:createDraft,
  remoteSync:remoteSync,
  sendDraft:sendDraft,
  reconcile:reconcile
 });

 window._ms537Connect=connectMicrosoft;
 window._ms537Disconnect=disconnectMicrosoft;
 window._ms537Status=microsoftStatus;
 window._em537Reconcile=reconcile;

 window._at537Diagnostics=function(){
  var core=window._at537DiagnosticsCore();
  var b=emailStore();
  return Object.assign({},core,{
   drafts:Object.keys(b.data.drafts).length,
   managerConnected:microsoftStatus('manager').connected,
   repConnected:microsoftStatus('rep').connected
  })
 };

 var afterBase=window._rp2After;
 window._rp2After=function(){
  var result=typeof afterBase==='function'?afterBase.apply(this,arguments):undefined;
  setTimeout(function(){installMicrosoftCard();renderComposer()},0);
  return result
 };

 var goBase=window._rp2Go;
 window._rp2Go=function(){
  var result=goBase.apply(this,arguments);
  setTimeout(installMicrosoftCard,60);
  return result
 };

 window.addEventListener('message',function(event){
  if(event.origin!==location.origin||!event.data)return;
  if(event.data.type==='tcp-ms365-connected-v537'){
   alert('Microsoft 365 connected: '+(event.data.account&&event.data.account.mail||event.data.account&&event.data.account.userPrincipalName||''));
   refreshCurrent()
  }
  if(event.data.type==='tcp-ms365-error-v537')alert(event.data.message)
 });

 window.addEventListener('beforeunload',function(){
  var draft=emailDraft(window._em537ActiveId);
  if(draft&&draft.status!=='sent'){
   composerFromDom(draft);
   putDraft(draft,'before-unload');
   ensureDraftTask(draft)
  }
 });

 handleAuthCallback();
 setTimeout(refreshCurrent,0);
 setTimeout(refreshCurrent,600);
 setTimeout(reconcile,2500);
 reconcileTimer=setInterval(reconcile,120000);
})();
