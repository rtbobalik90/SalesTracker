
(function(){
 var KEY='tcp_rp_floating_call_console_v534';
 var tickHandle=null,drag=null;

 function n(v){return Number(v)||0}
 function arr(v){return Array.isArray(v)?v:[]}
 function clean(v){return String(v==null?'':v).replace(/^\s+|\s+$/g,'')}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/g,'')}
 function esc(v){return typeof _rp2Esc==='function'?_rp2Esc(String(v==null?'':v)):String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function field(o,names,def){for(var i=0;i<names.length;i++){var v=o&&o[names[i]];if(v!=null&&String(v).trim()!=='')return v}return def==null?'':def}
 function dt(v){if(!v)return null;var d=v instanceof Date?new Date(v.getTime()):new Date(v);return isNaN(d.getTime())?null:d}
 function duration(sec){sec=Math.max(0,Math.floor(n(sec)));var m=Math.floor(sec/60),s=sec%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
 function readState(){
  try{
   var s=JSON.parse(localStorage.getItem(KEY)||'null');
   if(!s||s.version!==1)s={version:1,detached:false,minimized:false,parked:false,left:null,top:null};
   if(s.parked==null)s.parked=false;
   if(s.minimized){s.parked=true;s.minimized=false}
   return s
  }catch(e){return{version:1,detached:false,minimized:false,parked:false,left:null,top:null}}
 }
 function writeState(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
 function page(){return window._rp2&&window._rp2.page||''}
 function call(){return window._call532||{}}
 function activeSeconds(){
  var c=call(),base=n(c.elapsed);
  if(c.stage==='active'&&!c.paused&&c.startedAt){
   var start=dt(c.startedAt);if(start)base+=Math.max(0,Math.floor((Date.now()-start.getTime())/1000))
  }
  return base
 }
 function desktop(){
  try{return typeof window._rp2DesktopBuild==='function'?window._rp2DesktopBuild():{customers:{},calls:[]}}
  catch(e){return{customers:{},calls:[]}}
 }
 function ctx(){
  var g=desktop(),company=clean(call().company),c=(g.customers||{})[norm(company)]||{name:company,contacts:[],profile:{}},queue=arr(g.calls).filter(function(x){return norm(x.customer)===norm(company)})[0]||null;
  var contacts=arr(c.contacts),primary=c.primary||contacts[0]||null,draft=call().draft||{};
  return{g:g,company:company,c:c,queue:queue,contacts:contacts,primary:primary,draft:draft}
 }
 function selectedContact(x){
  var idv=String(x.draft.contactId||field(x.primary||{},['id','contactId'],'')||'');
  return x.contacts.filter(function(c){return String(field(c,['id','contactId'],'')||'')===idv})[0]||x.primary||x.contacts[0]||null
 }
 function optionHtml(x){
  var selected=String(x.draft.contactId||field(x.primary||{},['id','contactId'],'')||'');
  return'<option value="">No specific contact</option>'+x.contacts.map(function(c){
   var idv=String(field(c,['id','contactId'],'')||''),label=clean(field(c,['name'],'Contact'))+' · '+clean(field(c,['title','buyingRole'],'Role not recorded'));
   return'<option value="'+esc(idv)+'" '+(idv===selected?'selected':'')+'>'+esc(label)+'</option>'
  }).join('')
 }
 function hidden(idv,value,type,checkedValue){
  if(type==='checkbox')return'<input id="'+idv+'" type="checkbox" style="display:none" '+(checkedValue?'checked':'')+'>';
  return'<input id="'+idv+'" type="hidden" value="'+esc(value||'')+'">'
 }
 function completionHtml(x){
  var done=call().completed||{};
  return'<div class="fc1-success"><strong>Call saved to '+esc(x.company)+'</strong><p>The customer activity was saved.'+(done.follow?' A follow-up was added to Today’s Business.':'')+(done.opportunity?' An opportunity was created.':'')+(done.quoteHandoff?' Deal Desk is opening.':'')+'</p><div class="fc1-quick" style="margin-top:11px"><button class="fc1-btn primary" onclick="_call532Next()">Next call</button><button class="fc1-btn" onclick="_call534Dock()">Full workspace</button><button class="fc1-btn" onclick="_call532ResetCurrent()">Another call</button></div></div>'
 }
 function bodyHtml(x){
  var c=call(),d=x.draft||{},contact=selectedContact(x),stage=c.stage||'prep';
  if(stage==='complete')return completionHtml(x);
  return(typeof window._call537FloatingClassification==='function'?window._call537FloatingClassification(x,d):'')+'<div class="fc1-quick"><button class="fc1-btn primary" onclick="_call532Phone()">Open phone</button><button class="fc1-btn" onclick="_call532Email()">Open email</button><button class="fc1-btn purple" onclick="_call532OpenCustomer()">Full profile</button></div>'
   +'<section class="fc1-section"><div class="fc1-section-title">Active conversation</div><div class="fc1-section-copy">The draft remains connected to the full Call Workspace while you browse the tracker.</div><div class="fc1-field" style="margin-top:9px"><label>Contact</label><select id="cl1-contact" onchange="_call534Sync()">'+optionHtml(x)+'</select></div><div class="fc1-field" style="margin-top:8px"><label>Conversation notes</label><textarea id="cl1-notes" oninput="_call534Sync()" placeholder="What did the customer say? What did you learn?">'+esc(d.notes||'')+'</textarea></div></section>'
   +'<section class="fc1-section"><div class="fc1-section-title">Outcome and next step</div><div class="fc1-grid-2"><div class="fc1-field"><label>Outcome</label><select id="cl1-outcome" onchange="_call534Sync()"><option value="">Choose outcome</option>'+['Connected – follow-up required','Connected – quote discussed','Order expected','Sample requested','Left voicemail','No answer','Wrong contact','Not interested','Completed – no follow-up'].map(function(v){return'<option '+(d.outcome===v?'selected':'')+'>'+v+'</option>'}).join('')+'</select></div><div class="fc1-field"><label>Sentiment</label><select id="cl1-sentiment" onchange="_call534Sync()">'+['Unknown','Positive','Neutral','Concerned','Frustrated'].map(function(v){return'<option '+((d.sentiment||'Unknown')===v?'selected':'')+'>'+v+'</option>'}).join('')+'</select></div></div><div class="fc1-grid-2"><div class="fc1-field"><label>Next action</label><input id="cl1-next-action" value="'+esc(d.nextAction||'')+'" oninput="_call534Sync()" placeholder="What happens next?"></div><div class="fc1-field"><label>Next date</label><input id="cl1-next-date" type="date" value="'+esc(d.nextDate||'')+'" onchange="_call534Sync()"></div></div><label class="fc1-check"><input id="cl1-create-followup" type="checkbox" '+(d.createFollowUp!==false?'checked':'')+' onchange="_call534Sync()"> Add the dated action to Today’s Business.</label></section>'
   +hidden('cl1-subject',d.subject||(x.queue&&x.queue.reason)||('Customer call · '+x.company))
   +hidden('cl1-transcript',d.transcript||'')
   +hidden('cl1-products',d.products||'')
   +hidden('cl1-objections',d.objections||'')
   +hidden('cl1-create-opportunity','', 'checkbox',!!d.createOpportunity)
   +hidden('cl1-opportunity-title',d.opportunityTitle||'')
   +hidden('cl1-opportunity-value',d.opportunityValue||'')
   +hidden('cl1-opportunity-stage',d.opportunityStage||'Discovery')
   +hidden('cl1-opportunity-close',d.opportunityClose||'')
   +hidden('cl1-quote-handoff','', 'checkbox',!!d.quoteHandoff)
 }
 function html(){
  var s=readState(),x=ctx(),c=call(),contact=selectedContact(x),min=s.minimized?' minimized':'',complete=c.stage==='complete'?' complete':'';
  var status=c.stage==='complete'?'Saved':c.paused?'Paused':'Live',reason=x.queue?x.queue.reason:'Active customer call';
  if(s.parked){
   return'<button type="button" class="fc2-parked '+(c.paused?'paused':'')+(c.stage==='complete'?' complete':'')+'" id="fc1-console" onclick="_call534RestoreParked()" title="Restore active call"><span class="fc2-phone">☎</span><span class="fc2-copy"><b>'+esc(x.company||'Active call')+'</b><small>'+esc(status+' · '+field(contact||{},['name'],'Contact not selected'))+'</small></span><strong id="fc1-timer">'+duration(activeSeconds())+'</strong><span class="fc2-expand">↗</span></button>'
  }
  return'<div class="fc1-console'+min+complete+'" id="fc1-console"><header class="fc1-head" id="fc1-drag"><div class="fc1-head-left"><div class="fc1-phone">☎</div><div style="min-width:0"><div class="fc1-kick">FLOATING CALL CONSOLE · v534</div><div class="fc1-company">'+esc(x.company||'Active call')+'</div><div class="fc1-contact">'+esc(field(contact||{},['name'],'Contact not selected'))+'</div></div></div><div class="fc1-head-actions"><button class="fc1-icon-btn" onclick="_call534Dock()" title="Return to full Call Workspace">↗</button><button class="fc1-icon-btn" onclick="_call534ToggleMin()" title="Park call at the bottom">⌄</button></div></header><div class="fc1-mini-bar"><div class="fc1-status"><span class="fc1-live '+(c.paused?'paused':'')+'"><i></i>'+status+'</span><span class="fc1-reason">'+esc(reason)+'</span></div><div class="fc1-timer"><span>Call timer</span><strong id="fc1-timer">'+duration(activeSeconds())+'</strong></div></div><div class="fc1-body">'+bodyHtml(x)+'</div><footer class="fc1-footer"><div class="fc1-footer-copy"><strong>Keep working anywhere</strong>Drag this console by its header.</div><div class="fc1-footer-actions">'+(c.stage==='active'?'<button class="fc1-btn warn" onclick="_call532Pause()">'+(c.paused?'Resume':'Pause')+'</button>':'')+(c.stage!=='complete'?'<button class="fc1-btn" onclick="_call534Sync()">Save</button><button class="fc1-btn primary" onclick="_call532Complete()">Complete</button>':'')+'</div></footer><div class="fc1-drag-hint">Moveable inside the tracker · park it at the bottom without ending the call</div></div>'
 }
 function shouldShow(){
  var s=readState(),c=call();
  return !!(s.detached&&page()!=='call'&&clean(c.company)&&(c.stage==='active'||c.stage==='prep'||c.stage==='complete'))
 }
 function host(){
  var overlay=document.getElementById('rp-overlay');if(!overlay)return null;
  var h=document.getElementById('fc1-host');
  if(!h){h=document.createElement('div');h.id='fc1-host';h.className='fc1-host';overlay.appendChild(h)}
  return h
 }
 function applyPosition(){
  var el=document.getElementById('fc1-console'),s=readState();if(!el)return;
  if(el.classList&&el.classList.contains('fc2-parked'))return;
  var width=el.offsetWidth||500,height=el.offsetHeight||500,maxX=Math.max(8,window.innerWidth-width-8),maxY=Math.max(8,window.innerHeight-height-8);
  var left=s.left==null?maxX-16:Math.max(8,Math.min(maxX,n(s.left)));
  var top=s.top==null?Math.max(98,maxY-16):Math.max(8,Math.min(maxY,n(s.top)));
  el.style.left=left+'px';el.style.top=top+'px';el.style.bottom='auto'
 }
 function bindDrag(){
  var head=document.getElementById('fc1-drag'),el=document.getElementById('fc1-console');if(!head||!el)return;
  head.onpointerdown=function(e){
   if(e.target&&e.target.closest&&e.target.closest('button'))return;
   drag={x:e.clientX,y:e.clientY,left:parseFloat(el.style.left)||el.offsetLeft,top:parseFloat(el.style.top)||el.offsetTop};
   try{head.setPointerCapture(e.pointerId)}catch(_){}
  };
  head.onpointermove=function(e){
   if(!drag)return;
   var maxX=Math.max(8,window.innerWidth-(el.offsetWidth||500)-8),maxY=Math.max(8,window.innerHeight-(el.offsetHeight||500)-8);
   var left=Math.max(8,Math.min(maxX,drag.left+e.clientX-drag.x)),top=Math.max(8,Math.min(maxY,drag.top+e.clientY-drag.y));
   el.style.left=left+'px';el.style.top=top+'px'
  };
  head.onpointerup=head.onpointercancel=function(){
   if(!drag)return;
   var s=readState();s.left=parseFloat(el.style.left)||0;s.top=parseFloat(el.style.top)||0;writeState(s);drag=null
  }
 }
 function render(){
  var h=host();if(!h)return;
  if(!shouldShow()){h.innerHTML='';stopTick();return}
  h.innerHTML=html();applyPosition();bindDrag();startTick()
 }
 function startTick(){
  stopTick();
  tickHandle=setInterval(function(){var e=document.getElementById('fc1-timer');if(e)e.textContent=duration(activeSeconds())},1000)
 }
 function stopTick(){if(tickHandle){clearInterval(tickHandle);tickHandle=null}}
 function installFloatNotice(){
  if(page()!=='call')return;
  var target=document.querySelector('#rp-overlay .cl1-active-head .cl1-card-actions')||document.querySelector('#rp-overlay .cl1-timer .cl1-card-actions');
  if(!target||document.getElementById('call534-float-note'))return;
  var b=document.createElement('button');b.type='button';b.id='call534-float-note';b.className='cl1-mini';b.textContent='Floats while browsing';b.title='An active call automatically becomes a moveable console when you leave Call Workspace.';b.onclick=function(){alert('Leave Call Workspace or open the customer profile. The active call will automatically become a moveable floating console.');};
  target.appendChild(b)
 }
 function detachIfNeeded(nextPage){
  var c=call(),s=readState();
  if(page()==='call'&&nextPage!=='call'&&clean(c.company)&&(c.stage==='active'||c.stage==='prep')){
   try{if(typeof window._call532Draft==='function')window._call532Draft()}catch(e){}
   s.detached=true;writeState(s)
  }
  if(nextPage==='call'){s.detached=false;writeState(s)}
 }
 window._call534Html=html;
 window._call534Render=render;
 window._call534Sync=function(){try{if(typeof window._call532Draft==='function')window._call532Draft()}catch(e){};setTimeout(render,0)};
 window._call534ToggleMin=function(){var s=readState();s.parked=true;s.minimized=false;writeState(s);render()};
 window._call534RestoreParked=function(){var s=readState();s.parked=false;s.minimized=false;writeState(s);render()};
 window._call534Dock=function(){var s=readState();s.detached=false;s.parked=false;s.minimized=false;writeState(s);render();_rp2Go('call')};
 window._call534SetDetached=function(v){var s=readState();s.detached=!!v;writeState(s);render()};
 window._call534Diagnostics=function(){var s=readState();return{detached:s.detached,minimized:s.minimized,parked:s.parked,page:page(),stage:call().stage||'',company:call().company||'',visible:shouldShow(),left:s.left,top:s.top}};

 var baseGo=window._rp2Go;
 window._rp2Go=function(p){
  detachIfNeeded(p);
  var r=typeof baseGo==='function'?baseGo.apply(this,arguments):undefined;
  setTimeout(function(){render();installFloatNotice()},0);
  setTimeout(function(){render();installFloatNotice()},70);
  return r
 };
 var baseAfter=window._rp2After;
 window._rp2After=function(){
  var r=typeof baseAfter==='function'?baseAfter.apply(this,arguments):undefined;
  setTimeout(function(){render();installFloatNotice()},0);
  return r
 };
 var basePause=window._call532Pause;
 window._call532Pause=function(){var r=basePause.apply(this,arguments);setTimeout(render,0);return r};
 var baseComplete=window._call532Complete;
 window._call532Complete=function(){var r=baseComplete.apply(this,arguments);setTimeout(render,0);return r};
 var baseReset=window._call532ResetCurrent;
 window._call532ResetCurrent=function(){var r=baseReset.apply(this,arguments);setTimeout(render,0);return r};
 var baseNext=window._call532Next;
 window._call532Next=function(){var r=baseNext.apply(this,arguments);setTimeout(render,0);return r};

 window.addEventListener('resize',function(){if(shouldShow())applyPosition()});
 setTimeout(function(){render();installFloatNotice()},0);
 setTimeout(function(){render();installFloatNotice()},500);
})();
