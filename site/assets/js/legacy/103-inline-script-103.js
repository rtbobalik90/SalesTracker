
(function(){
  function lock(on){try{document.documentElement.classList.toggle('tcp-portal-open',!!on);}catch(e){}}
  try{
    if(/[?&]portal=/.test(location.search))lock(true);
    /* also observe the overlay for programmatic open/close */
    var mo=new MutationObserver(function(){
      var ov=document.getElementById('rp-overlay');
      lock(ov&&ov.style.display!=='none'&&ov.offsetParent!==null||(/[?&]portal=/.test(location.search)));
    });
    function arm(){var ov=document.getElementById('rp-overlay');if(ov)mo.observe(ov,{attributes:true,attributeFilter:['style']});}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arm,{once:true});else arm();
  }catch(e){}
})();
