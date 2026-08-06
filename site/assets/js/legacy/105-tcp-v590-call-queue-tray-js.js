
(function(){
  'use strict';
  var state=window._ps90QueueState||(window._ps90QueueState={open:false,limit:7});
  var scheduled=false;

  function arr(value){
    if(Array.isArray(value))return value;
    if(!value)return[];
    try{
      if(typeof value.length==='number'&&typeof value!=='string')return Array.prototype.slice.call(value);
      return Object.keys(value).map(function(key){return value[key]}).filter(Boolean)
    }catch(error){return[]}
  }
  function clean(value){return String(value==null?'':value).trim()}
  function norm(value){return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function field(object,names,def){
    for(var i=0;i<names.length;i++){
      var value=object&&object[names[i]];
      if(value!=null&&clean(value)!=='')return value
    }
    return def==null?'':def
  }
  function data(){
    try{return window.TCP_CALL_V540&&typeof window.TCP_CALL_V540.currentData==='function'?window.TCP_CALL_V540.currentData():null}catch(error){return null}
  }
  function queue(){var current=data();return arr(current&&current.g&&current.g.calls)}
  function currentCompany(){var current=data();return clean(current&&current.company)}
  function customerRecord(company){
    var candidates=[];
    try{candidates=candidates.concat(arr(S&&S.customers),arr(S&&S.customerRecords),arr(S&&S.companies))}catch(error){}
    return candidates.filter(function(customer){
      return norm(field(customer,['name','customer','company','companyName'],''))===norm(company)
    })[0]||null
  }
  function locationText(item){
    var record=customerRecord(clean(item&&item.customer));
    var profile=record&&record.profile||record||{};
    var city=field(profile,['city','locationCity'],''),stateName=field(profile,['state','province','locationState'],''),location=field(profile,['location','address','address1'],'');
    if(city||stateName)return[city,stateName].filter(Boolean).join(', ');
    if(location)return clean(location).split(/\n|\r/)[0];
    return clean(item&&item.contact)||clean(item&&item.source)||clean(item&&item.reason)||'Customer account'
  }
  function relativeDate(value){
    if(!value)return'';
    try{
      var date=/^\d{4}-\d{2}-\d{2}$/.test(String(value))?new Date(String(value)+'T12:00:00'):new Date(value);
      if(isNaN(date.getTime()))return'';
      var days=Math.max(0,Math.floor((Date.now()-date.getTime())/86400000));
      if(days===0)return'today';
      if(days===1)return'1d ago';
      if(days<7)return days+'d ago';
      if(days<35)return Math.floor(days/7)+'w ago';
      if(days<365)return Math.floor(days/30)+'mo ago';
      return Math.floor(days/365)+'y ago'
    }catch(error){return''}
  }
  function lastContactText(item){
    var record=customerRecord(clean(item&&item.customer));
    var profile=record&&record.profile||record||{};
    var last=field(record||{},['lastContactDate','lastContactAt','lastCallDate'],'')||field(profile,['lastContactDate','lastContactAt','lastCallDate'],'')||field(item||{},['lastContactDate','lastContactAt','lastCallDate'],'');
    var relative=relativeDate(last);
    if(relative)return'Last call '+relative;
    var due=field(item||{},['due','dueDate'],'');
    var dueRelative=relativeDate(due);
    return dueRelative?'Due '+dueRelative:'No recent call history'
  }
  function signature(){
    var list=queue();
    return [list.length,currentCompany(),state.limit].concat(list.map(function(item){return clean(item&&item.customer)+'~'+clean(item&&item.due)+'~'+clean(item&&item.reason)})).join('|')
  }
  function card(item,index){
    var company=clean(item&&item.customer)||'Unnamed customer';
    var active=norm(company)===norm(currentCompany());
    var button=document.createElement('button');
    button.type='button';
    button.className='ps90-customer-card'+(active?' current':'');
    button.setAttribute('data-company',company);
    button.innerHTML='<span class="ps90-card-name"></span><span class="ps90-card-location"></span><span class="ps90-card-last"></span><span class="ps90-card-check">✓</span>';
    button.querySelector('.ps90-card-name').textContent=company;
    button.querySelector('.ps90-card-location').textContent=locationText(item);
    button.querySelector('.ps90-card-last').textContent=lastContactText(item);
    button.addEventListener('click',function(event){
      event.preventDefault();
      event.stopPropagation();
      var selected=button.getAttribute('data-company')||'';
      state.open=false;
      if(selected&&typeof window._call540SelectCompany==='function'){
        window._call540SelectCompany(encodeURIComponent(selected));
      }
      setTimeout(schedule,0)
    });
    return button
  }
  function updateScrollButtons(tray){
    var track=tray&&tray.querySelector('.ps90-track');
    var previous=tray&&tray.querySelector('[data-dir="-1"]');
    var next=tray&&tray.querySelector('[data-dir="1"]');
    if(!track||!previous||!next)return;
    var max=Math.max(0,track.scrollWidth-track.clientWidth-1);
    previous.disabled=track.scrollLeft<=1;
    next.disabled=track.scrollLeft>=max
  }
  function rebuild(tray){
    var list=queue();
    if(state.limit<7)state.limit=7;
    if(list.length&&state.limit>list.length)state.limit=list.length;
    var shown=Math.min(state.limit,list.length);
    tray.innerHTML='';

    var title=document.createElement('div');
    title.className='ps90-queue-title';
    title.textContent='Select a customer';

    var row=document.createElement('div');
    row.className='ps90-queue-row';
    var previous=document.createElement('button');
    previous.type='button';
    previous.className='ps90-scroll-btn';
    previous.setAttribute('data-dir','-1');
    previous.setAttribute('aria-label','Scroll customer queue left');
    previous.textContent='‹';
    var track=document.createElement('div');
    track.className='ps90-track';
    var next=document.createElement('button');
    next.type='button';
    next.className='ps90-scroll-btn';
    next.setAttribute('data-dir','1');
    next.setAttribute('aria-label','Scroll customer queue right');
    next.textContent='›';

    if(list.length){
      list.slice(0,shown).forEach(function(item,index){track.appendChild(card(item,index))});
      if(shown<list.length){
        var more=document.createElement('button');
        more.type='button';
        more.className='ps90-load-card';
        more.innerHTML='<b>＋</b><span>Load 5 more</span><small>'+shown+' of '+list.length+' shown</small>';
        more.addEventListener('click',function(event){
          event.preventDefault();event.stopPropagation();
          state.limit=Math.min(list.length,state.limit+5);
          rebuild(tray);
          requestAnimationFrame(function(){track.scrollTo({left:track.scrollWidth,behavior:'smooth'})})
        });
        track.appendChild(more)
      }
    }else{
      var empty=document.createElement('div');
      empty.className='ps90-empty';
      empty.textContent='No customers are currently loaded in today\'s call queue.';
      track.appendChild(empty)
    }

    function scroll(direction){
      var amount=Math.max(240,Math.round(track.clientWidth*.72));
      track.scrollBy({left:direction*amount,behavior:'smooth'})
    }
    previous.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();scroll(-1)});
    next.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();scroll(1)});
    track.addEventListener('scroll',function(){updateScrollButtons(tray)},{passive:true});
    track.addEventListener('wheel',function(event){
      if(track.scrollWidth<=track.clientWidth)return;
      var delta=Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX;
      if(!delta)return;
      track.scrollLeft+=delta;
      event.preventDefault()
    },{passive:false});

    row.appendChild(previous);row.appendChild(track);row.appendChild(next);
    tray.appendChild(title);tray.appendChild(row);
    tray.setAttribute('data-ps90-signature',signature());
    requestAnimationFrame(function(){updateScrollButtons(tray)})
  }
  function applyState(command,toggle,tray){
    toggle.setAttribute('aria-expanded',state.open?'true':'false');
    toggle.setAttribute('aria-label',state.open?'Close customer queue':'Open customer queue');
    tray.classList.toggle('open',state.open);
    command.classList.toggle('ps90-queue-open',state.open)
  }
  function enhance(){
    scheduled=false;
    var shell=document.querySelector('#rp-overlay .ps62-shell');
    var command=shell&&shell.querySelector('.ps62-command');
    if(!shell||!command)return;

    var toggle=command.querySelector('.ps90-queue-toggle');
    if(!toggle){
      toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='ps90-queue-toggle';
      toggle.innerHTML='<span class="ps90-chevrons" aria-hidden="true"><i></i><i></i></span>';
      command.appendChild(toggle)
    }
    var tray=shell.querySelector(':scope > .ps90-queue-tray');
    if(!tray){
      tray=document.createElement('section');
      tray.className='ps90-queue-tray';
      tray.setAttribute('aria-label',"Today's customer call queue");
      command.insertAdjacentElement('afterend',tray)
    }
    if(toggle.getAttribute('data-ps90-bound')!=='1'){
      toggle.setAttribute('data-ps90-bound','1');
      toggle.addEventListener('click',function(event){
        event.preventDefault();event.stopPropagation();
        state.open=!state.open;
        applyState(command,toggle,tray);
        if(state.open)requestAnimationFrame(function(){updateScrollButtons(tray)})
      })
    }
    if(tray.getAttribute('data-ps90-signature')!==signature())rebuild(tray);
    applyState(command,toggle,tray)
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
  function arm(){
    var host=document.getElementById('rp-overlay');
    if(!host)return;
    new MutationObserver(schedule).observe(host,{childList:true,subtree:true});
    schedule()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arm,{once:true});else arm();
  setTimeout(schedule,250);
  setTimeout(schedule,900)
})();
