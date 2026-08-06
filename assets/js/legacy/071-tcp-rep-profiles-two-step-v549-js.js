
(function(){
 'use strict';

 var view='roster';
 var page=document.getElementById('pg-profiles');
 var baseRenderProfiles=window.renderProfiles;
 var baseSelectRep=window.selectRep;
 var baseRenderProfileDetail=window.renderProfileDetail;

 function esc(v){
  var s=String(v==null?'':v);
  return typeof esc_html==='function'?esc_html(s):s.replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function activeRepsSafe(){
  try{return activeReps()}catch(e){
   return (window.S&&S.reps||[]).filter(function(rep){return rep&&!rep.retired})
  }
 }
 function validSelected(){
  return !!selectedRep&&activeRepsSafe().some(function(rep){return rep.name===selectedRep})
 }
 function roleFor(rep){
  try{return roleDef(repRole(rep)).name||'Sales Specialist'}catch(e){return'Sales Specialist'}
 }
 function pageTop(){
  try{
   var content=document.querySelector('.content')||document.scrollingElement||document.documentElement;
   if(content&&typeof content.scrollTo==='function')content.scrollTo({top:0,behavior:'smooth'});
   else window.scrollTo({top:0,behavior:'smooth'})
  }catch(e){}
 }
 function updateHero(){
  if(!page)return;
  var title=page.querySelector('.rep-intel-hero h1');
  var copy=page.querySelector('.rep-intel-hero-copy>p');
  var kick=page.querySelector('.rep-intel-kicker');
  var line=document.getElementById('repIntelContextLine');

  if(view==='profile'&&validSelected()){
   var rep=activeRepsSafe().find(function(row){return row.name===selectedRep});
   if(kick)kick.innerHTML='<span class="rep-intel-live-dot"></span> Individual rep intelligence';
   if(title)title.textContent=selectedRep+' Profile';
   if(copy)copy.textContent='Performance, goals, work hours, calls, quality, coaching, history, personal details, and manager actions for this rep.';
   if(line){
    var context='';
    try{context=getQ()+' '+getYr()+' · '+getM()+' · '+((typeof repIntelSelectedWeek==='function'&&repIntelSelectedWeek())||{}).label}catch(e){}
    if(!context){
     try{context=getQ()+' '+getYr()+' · '+getM()+' · Week '+getWN()}catch(e){context='Individual profile'}
    }
    line.innerHTML='<span style="color:#8DE3FF;font-weight:950;">'+esc(roleFor(rep))+'</span><span style="opacity:.35;">•</span><span>'+esc(context)+'</span>'
   }
  }else{
   var reps=activeRepsSafe();
   if(kick)kick.innerHTML='<span class="rep-intel-live-dot"></span> Sales rep directory';
   if(title)title.textContent='Sales Rep Profiles';
   if(copy)copy.textContent='Choose a sales rep to open their individual performance, coaching, quality, history, and profile workspace.';
   if(line)line.innerHTML='<span style="color:#8DE3FF;font-weight:950;">'+reps.length+' active reps</span><span style="opacity:.35;">•</span><span>Click any rep card to open the full profile</span>';
   if(!page.querySelector('.v549-roster-instruction')){
    var heroCopy=page.querySelector('.rep-intel-hero-copy');
    if(heroCopy)heroCopy.insertAdjacentHTML('beforeend','<div class="v549-roster-instruction"><i>→</i><span>Select a rep below. The reporting controls and profile details open on the next screen.</span></div>')
   }
  }
 }
 function injectBack(){
  var detail=document.getElementById('profileDetail');
  if(!detail||!validSelected())return;
  var old=detail.querySelector('.v549-profile-nav');if(old)old.remove();
  var rep=activeRepsSafe().find(function(row){return row.name===selectedRep});
  detail.insertAdjacentHTML(
   'afterbegin',
   '<div class="v549-profile-nav">'+
    '<button class="v549-profile-back" onclick="_v549BackToRepList()">← Back to Rep List</button>'+
    '<div class="v549-profile-nav-copy"><strong>'+esc(selectedRep)+'</strong><span>'+esc(roleFor(rep))+' · individual profile workspace</span></div>'+
   '</div>'
  )
 }
 function applyView(options){
  options=options||{};
  if(!page)return;
  if(view==='profile'&&!validSelected())view='roster';
  page.dataset.repView=view;

  if(view==='roster'){
   var detail=document.getElementById('profileDetail');
   var customer=document.getElementById('custIntelPanel');
   if(detail)detail.innerHTML='';
   if(customer)customer.innerHTML='';
   try{renderProfileAlerts()}catch(e){}
   try{renderProfileCards()}catch(e){}
  }else{
   injectBack()
  }

  updateHero();
  if(options.scroll!==false)pageTop()
 }
 function openProfile(name){
  if(!name)return;
  selectedRep=name;
  view='profile';
  if(typeof baseSelectRep==='function')baseSelectRep(name);
  else{
   try{renderProfileCards()}catch(e){}
   var index=(S.reps||[]).findIndex(function(rep){return rep&&rep.name===name});
   if(index>=0&&typeof baseRenderProfileDetail==='function')baseRenderProfileDetail(index)
  }
  applyView()
 }

 window.renderProfiles=function(){
  if(typeof baseRenderProfiles==='function')baseRenderProfiles();
  applyView({scroll:false})
 };

 window.selectRep=function(name){
  openProfile(name)
 };

 window.renderProfileDetail=function(index){
  if(typeof baseRenderProfileDetail==='function')baseRenderProfileDetail(index);
  if(view==='profile')setTimeout(injectBack,0)
 };

 window.repIntelSelectRep=function(name){
  openProfile(name)
 };

 window._v549BackToRepList=function(){
  view='roster';
  applyView()
 };

 window._v549OpenRepProfile=function(name){
  openProfile(name)
 };

 window._v549RepProfileView=function(){
  return view
 };

 /* A direct sidebar click must always begin at the roster.
    Cross-page links that select a rep first still open the requested profile. */
 document.addEventListener('click',function(event){
  var button=event.target&&event.target.closest?event.target.closest('button,.tab'):null;
  if(!button)return;
  if(/^\s*(?:👤\s*)?Rep Profiles\s*$/i.test(button.textContent||'')){
   view='roster'
  }
 },true);

 /* Re-renders caused by edits should remain inside the current profile. */
 var observer=new MutationObserver(function(records){
  if(view!=='profile')return;
  var detail=document.getElementById('profileDetail');
  if(detail&&detail.children.length&&!detail.querySelector('.v549-profile-nav'))injectBack()
 });
 var detail=document.getElementById('profileDetail');
 if(detail)observer.observe(detail,{childList:true});

 window.TCP_REP_PROFILES_V549={
  version:'v549',
  openProfile:openProfile,
  back:function(){window._v549BackToRepList()},
  getView:function(){return view},
  applyView:applyView
 };

 view='roster';
 applyView({scroll:false});
})();
