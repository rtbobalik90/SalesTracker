
(function(){
 'use strict';

 function syncDashboardFrame(){
  var dashboard=document.getElementById('pg-dash');
  var active=!!(dashboard&&dashboard.classList.contains('active'));
  document.body.classList.toggle('ps58-dashboard-active',active);
  if(!active)return;

  /*
    A nav width change can happen without a dashboard render. Force the chart
    and responsive cards to measure the newly available width immediately.
  */
  requestAnimationFrame(function(){
   window.dispatchEvent(new Event('resize'));
   try{
    if(window.TCP_PROJECT_SIMPLIFY_DASHBOARD_V558&&
       typeof TCP_PROJECT_SIMPLIFY_DASHBOARD_V558.render==='function'&&
       !document.querySelector('#pg-dash .ps58-shell')){
      TCP_PROJECT_SIMPLIFY_DASHBOARD_V558.render()
    }
   }catch(error){
    console.warn('[v559 dashboard frame]',error)
   }
  })
 }

 var bodyObserver=new MutationObserver(function(mutations){
  var relevant=mutations.some(function(mutation){
   return mutation.type==='attributes'&&
    (mutation.target===document.body||mutation.target&&mutation.target.id==='pg-dash')
  });
  if(relevant)syncDashboardFrame()
 });

 if(document.body){
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']})
 }
 var dashboard=document.getElementById('pg-dash');
 if(dashboard){
  bodyObserver.observe(dashboard,{attributes:true,attributeFilter:['class']})
 }

 window.addEventListener('resize',function(){
  if(document.body.classList.contains('ps58-dashboard-active')){
   document.documentElement.style.setProperty(
    '--ps59-dashboard-width',
    Math.max(0,document.documentElement.clientWidth-
     (document.body.classList.contains('nav-rail')?78:248))+'px'
   )
  }
 });

 window.TCP_DASHBOARD_SCALE_FRAME_V559={
  version:'v559',
  sync:syncDashboardFrame,
  availableWidth:function(){
   return Math.max(0,document.documentElement.clientWidth-
    (document.body.classList.contains('nav-rail')?78:248))
  }
 };

 syncDashboardFrame();
 window.dispatchEvent(new Event('resize'))
})();
