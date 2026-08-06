
(function(){
 var PROFILE_PAGES=['profile','reviews','dash','forecast','goals','achievements','year','reports'];
 window._rp2DesktopMode=window._rp2DesktopMode||'home';

 function n(v){return Number(v)||0}
 function arr(v){
  if(Array.isArray(v))return v;if(!v)return[];
  try{if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(Boolean)}catch(e){}
  return[]
 }
 function clean(v){return String(v==null?'':v).trim()}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function esc(v){return typeof _rp2Esc==='function'?_rp2Esc(String(v==null?'':v)):String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function dt(v){if(!v)return null;try{var d=v instanceof Date?new Date(v.getTime()):new Date(String(v).length===10?String(v)+'T12:00:00':v);return isNaN(d.getTime())?null:d}catch(e){return null}}
 function fmt(v){var d=dt(v);return d?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Date not recorded'}
 function installNav(){
  if(typeof RP2_NAV==='undefined')return;
  RP2_NAV=[
   {g:'My Day',items:[
    ['home','Desktop','🏠'],
    ['call','Call Workspace','☎'],
    ['action','Today’s Business','✅'],
    ['daily','Daily Sales & Calls','📅']
   ]},
   {g:'Companies & Sales',items:[
    ['customers','Companies','🏢'],
    ['dealdesk','Quotes','📄'],
    ['orders','Orders','📦'],
    ['leads','Leads & Prospecting','🎯'],
    ['outreach','Outreach Campaigns','📣']
   ]},
   {g:'My Profile',items:[
    ['profile','My Profile','👤'],
    ['reviews','Reviews & Recognition','⭐'],
    ['dash','Dashboard','📊'],
    ['forecast','Forecast','📈'],
    ['goals','Goals & Growth','🎯'],
    ['achievements','Achievements','🏆'],
    ['year','Year Overview','🗓'],
    ['reports','Reports','📑']
   ]},
   {g:'Resources',items:[
    ['products','Products & Catalogs','👕'],
    ['production','Production','🏭'],
    ['learning','Learning & Playbook','📚'],
    ['ai','AI Coach','✨']
   ]}
  ]
 }
 function rerender(){
  var page=document.getElementById('rp2-page');
  if(page)page.innerHTML=window._rp2Page();
  var main=document.querySelector('#rp-overlay .rp2-main');if(main)main.scrollTop=0;
  setTimeout(function(){try{window._rp2After()}catch(e){}},0)
 }
 function profileCommand(){
  var cards=[
   ['⭐','Reviews','Customer voice and what stands out','reviews'],
   ['📊','Dashboard','Current performance command view','dash'],
   ['📈','Forecast','Pace, projection, and required weekly result','forecast'],
   ['🎯','Goals','Quarter goals and growth plan','goals'],
   ['🏆','Achievements','Badges, records, and milestones','achievements'],
   ['🗓','Year Overview','Annual performance history','year']
  ];
  return'<div class="mph3-command"><div class="mph3-command-intro"><div class="mph3-command-kick">MY PROFILE HUB 3.0 · BUILD v536</div><div class="mph3-command-title">Your complete performance home</div><div class="mph3-command-copy">Profile identity, customer recognition, goals, achievements, dashboard, forecast, and annual history now live together instead of competing for separate navigation space.</div></div>'+cards.slice(0,3).map(function(x){return'<button class="mph3-command-card" onclick="_rp2Go(\''+x[3]+'\')"><span>'+x[0]+'</span><div><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div></button>'}).join('')+'</div>'
   +'<div class="mph3-command" style="grid-template-columns:repeat(3,minmax(170px,1fr));margin-top:-6px">'+cards.slice(3).map(function(x){return'<button class="mph3-command-card" onclick="_rp2Go(\''+x[3]+'\')"><span>'+x[0]+'</span><div><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div></button>'}).join('')+'</div>'
 }
 function assignedReviews(){
  var R=S&&S.reviews||{},rf=R.repFix||{},dec=R.decisions||{},rep=_rp2.rep;
  return arr(R.rows).filter(function(r){
   if(!r)return false;
   var id=r.id!=null?r.id:'',assigned=rf[id]!==undefined?rf[id]:r.rep;
   return dec[id]!=='removed'&&assigned===rep
  }).sort(function(a,b){return (dt(b.ts)?dt(b.ts).getTime():0)-(dt(a.ts)?dt(a.ts).getTime():0)})
 }
 function reviewTheme(msg){
  var s=String(msg||'').toLowerCase(),defs=[
   ['Communication',['communicat','kept me informed','explained','responsive','response','email','called back']],
   ['Service',['service','helpful','friendly','professional','easy to work','great to work']],
   ['Problem solving',['problem','resolved','solution','fixed','went above','handled']],
   ['Speed & follow-through',['quick','fast','timely','on time','follow through','follow-up','prompt']],
   ['Product & quality',['quality','looked great','turned out','product','apparel','shirts','hats','jackets']],
   ['Trust & partnership',['trust','reliable','partner','recommend','always','dependable']]
  ];
  var found=[];defs.forEach(function(d){if(d[1].some(function(w){return s.indexOf(w)>=0}))found.push(d[0])});
  return found
 }
 function reviewPreview(){
  var rows=assignedReviews(),rated=rows.filter(function(r){return n(r.stars)>0}),avg=rated.length?rated.reduce(function(s,r){return s+n(r.stars)},0)/rated.length:0,five=rows.filter(function(r){return n(r.stars)>=5}).length,themes={},name=String(_rp2.rep||'').split(/\s+/)[0].toLowerCase(),mentions=0;
  rows.forEach(function(r){
   reviewTheme(r.msg).forEach(function(t){themes[t]=(themes[t]||0)+1});
   if(name&&String(r.msg||'').toLowerCase().indexOf(name)>=0)mentions++
  });
  var top=Object.keys(themes).map(function(k){return{name:k,count:themes[k]}}).sort(function(a,b){return b.count-a.count||a.name.localeCompare(b.name)}),latest=rows.slice(0,3);
  var standout=top[0]?top[0].name:(rows.length?'Customer recognition is building':'Customer voice is still forming');
  var standoutCopy=top[0]?('Customers most often recognize '+top[0].name.toLowerCase()+'. This theme appears in '+top[0].count+' assigned review'+(top[0].count===1?'':'s')+'.'):(rows.length?'The current reviews do not repeat one visible praise theme yet. Open the full review history to read the original customer language.':'Assigned customer reviews will appear here after they are added and approved.');
  return'<section class="mph3-review"><div class="mph3-review-head"><div><div class="mph3-review-kick">REVIEWS & RECOGNITION</div><div class="mph3-review-title">What customers say—and what stands out</div><div class="mph3-review-copy">This restores the customer-voice section directly to My Profile while preserving the full lifetime review intelligence page.</div></div><button class="mph3-review-btn" onclick="_rp2Go(\'reviews\')">Open full reviews →</button></div>'
   +'<div class="mph3-review-kpis"><div class="mph3-review-kpi"><span>Assigned reviews</span><strong>'+rows.length+'</strong><small>Active customer reviews connected to your profile</small></div><div class="mph3-review-kpi"><span>Average rating</span><strong>'+(rated.length?avg.toFixed(1)+' ★':'—')+'</strong><small>'+rated.length+' rated review'+(rated.length===1?'':'s')+'</small></div><div class="mph3-review-kpi"><span>Five-star reviews</span><strong>'+five+'</strong><small>'+((rows.length&&five)?Math.round(five/rows.length*100)+'% of active reviews':'No five-star baseline yet')+'</small></div><div class="mph3-review-kpi"><span>Named recognition</span><strong>'+mentions+'</strong><small>Reviews clearly mentioning your first name</small></div></div>'
   +'<div class="mph3-review-grid"><div class="mph3-standout"><div class="mph3-label">What stands out</div><div class="mph3-standout-title">'+esc(standout)+'</div><div class="mph3-standout-copy">'+esc(standoutCopy)+'</div><div class="mph3-theme-list">'+(top.length?top.slice(0,5).map(function(t){return'<div class="mph3-theme"><strong>'+esc(t.name)+'</strong><span>'+t.count+'×</span></div>'}).join(''):'<div class="mph3-theme"><strong>No repeated praise theme yet</strong><span>—</span></div>')+'</div></div><div class="mph3-latest"><div class="mph3-label">Recent customer voice</div><div class="mph3-review-cards">'+(latest.length?latest.map(function(r){var stars=n(r.stars),msg=clean(r.msg)||'No written comment was provided.';return'<div class="mph3-review-card"><div class="mph3-review-stars">'+(stars?'★'.repeat(Math.min(5,Math.max(1,stars))):'Customer review')+'</div><div class="mph3-review-msg">'+esc(msg.length>220?msg.slice(0,219)+'…':msg)+'</div><div class="mph3-review-meta">'+esc(r.type||r.platform||'Review')+' · '+fmt(r.ts)+'</div></div>'}).join(''):'<div class="mph3-review-card"><div class="mph3-review-msg">No customer reviews are currently assigned to this profile.</div></div>')+'</div></div></div></section>'
 }
 function desktopNotificationPage(baseNotifications){
  return'<div class="dnt3-backbar"><div><strong>Desktop → Notifications</strong><span>Notifications are part of the daily command center rather than a separate navigation destination.</span></div><button class="dnt3-back" onclick="_rp2DesktopHome()">← Back to Desktop</button></div>'+baseNotifications()
 }

 installNav();

 var baseProfile=window._rp2ProfileV2;
 if(typeof baseProfile==='function'){
  window._rp2ProfileV2=function(){
   var html=baseProfile();
   return profileCommand()+html+(window._rp2ProfileTab==='overview'?reviewPreview():'')
  }
 }

 var baseNotifications=window._rp2NotificationsV2;
 if(typeof baseNotifications==='function'){
  window._rp2NotificationsV2=function(){return desktopNotificationPage(baseNotifications)}
 }

 var baseHome=window._rp2HomeV3;
 if(typeof baseHome==='function'){
  window._rp2HomeV3=function(){
   if(window._rp2DesktopMode==='notifications'&&typeof window._rp2NotificationsV2==='function')return window._rp2NotificationsV2();
   return baseHome()
  }
 }

 window._rp2OpenDesktopNotifications=function(){
  window._rp2DesktopMode='notifications';
  if(_rp2.page!=='home')return goBase.call(window,'home');
  rerender()
 };
 window._rp2DesktopHome=function(){
  window._rp2DesktopMode='home';
  if(_rp2.page!=='home')return goBase.call(window,'home');
  rerender()
 };

 var centerBase=window._cw4OpenCenter;
 if(typeof centerBase==='function'){
  window._cw4OpenCenter=function(page,encoded){
   if(page==='contacts'){
    if(typeof window._cw4SetTab==='function')window._cw4SetTab('relationships');
    return
   }
   if(page==='pipeline'){
    if(typeof window._cw4SetTab==='function')window._cw4SetTab('sales');
    return
   }
   return centerBase.apply(this,arguments)
  }
 }

 var goBase=window._rp2Go;
 window._rp2Go=function(p){
  if(p==='notifications'){
   window._rp2DesktopMode='notifications';
   return goBase.call(this,'home')
  }
  if(p==='contacts'||p==='pipeline'){
   window._rp2DesktopMode='home';
   return goBase.call(this,'customers')
  }
  if(p==='home')window._rp2DesktopMode='home';
  return goBase.apply(this,arguments)
 };

 window._rp2ArchitectureV536=function(){
  return{
   groups:RP2_NAV.map(function(g){return{group:g.g,pages:g.items.map(function(x){return x[0]})}}),
   contactsInCompanies:!RP2_NAV.some(function(g){return g.items.some(function(x){return x[0]==='contacts'})}),
   opportunitiesInCompanies:!RP2_NAV.some(function(g){return g.items.some(function(x){return x[0]==='pipeline'})}),
   notificationsInDesktop:!RP2_NAV.some(function(g){return g.items.some(function(x){return x[0]==='notifications'})}),
   profilePages:PROFILE_PAGES.slice()
  }
 };

 setTimeout(function(){
  try{
   installNav();
   var overlay=document.getElementById('rp-overlay');
   if(overlay&&_rp2&&_rp2.rep)goBase.call(window,_rp2.page||'home')
  }catch(e){}
 },0)
})();
