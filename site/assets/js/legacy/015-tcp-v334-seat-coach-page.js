
(function(){
  function seatCoachPage(){
    var pg=document.getElementById('pg-coach');
    var wrap=document.querySelector('body > .wrap') || document.querySelector('.wrap');
    if(pg && wrap && pg.parentNode !== wrap){ wrap.appendChild(pg); }
    if(document.body) document.body.classList.add('coach-seated');
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(seatCoachPage,0); setTimeout(seatCoachPage,120); });
  } else {
    setTimeout(seatCoachPage,0); setTimeout(seatCoachPage,120);
  }
  window.addEventListener('load', function(){ setTimeout(seatCoachPage,200); });
})();
