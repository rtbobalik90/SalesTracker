
(function(){
  'use strict';
  var state=window._ps88QueueState||(window._ps88QueueState={open:false,limit:5});
  var scheduled=false;

  function arr(value){
    if(Array.isArray(value))return value;
    if(!value)return[];
    try{return typeof value.length==='number'&&typeof value!=='string'?Array.prototype.slice.call(value):Object.keys(value).map(function(k){return value[k]}).filter(Boolean)}catch(e){return[]}
  }
  function clean(value){return String(value==null?'':value).trim()}
  function norm(value){return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function data(){
    try{return window.TCP_CALL_V540&&typeof window.TCP_CALL_V540.currentData==='function'?window.TCP_CALL_V540.currentData():null}catch(e){return null}
  }
  function queue(){var d=data();return arr(d&&d.g&&d.g.calls)}
  function currentCompany(){var d=data();return clean(d&&d.company)}
  function signature(){
    var rows=queue();
    return [state.open?'1':'0',state.limit,currentCompany(),rows.length].concat(rows.map(function(item){
      return [clean(item&&item.customer),clean(item&&item.rank),clean(item&&item.due),clean(item&&item.reason||item&&item.copy)].join('~')
    })).join('|');
  }
  function dueText(item){
    var value=item&&item.due;
    if(!value)return'Due today';
    try{
      var dt=/^\d{4}-\d{2}-\d{2}$/.test(String(value))?new Date(String(value)+'T12:00:00'):new Date(value);
      return isNaN(dt.getTime())?'Due today':dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    }catch(e){return'Due today'}
  }
  function itemButton(item,index,active){
    var button=document.createElement('button');
    button.type='button';
    button.className='ps88-queue-item'+(active?' current':'');
    button.setAttribute('data-company',clean(item&&item.customer));

    var rank=document.createElement('span');rank.className='ps88-rank';rank.textContent=clean(item&&item.rank)||String(index+1);
    var main=document.createElement('span');
    var name=document.createElement('span');name.className='ps88-qname';name.textContent=clean(item&&item.customer)||'Unnamed customer';
    var reason=document.createElement('span');reason.className='ps88-qreason';reason.textContent=clean(item&&item.reason||item&&item.copy)||'Customer call';
    main.appendChild(name);main.appendChild(reason);
    var due=document.createElement('span');due.className='ps88-qdue';due.textContent=dueText(item);
    button.appendChild(rank);button.appendChild(main);button.appendChild(due);
    button.addEventListener('click',function(){
      state.open=false;
      var company=button.getAttribute('data-company')||'';
      if(company&&typeof window._call540SelectCompany==='function')window._call540SelectCompany(encodeURIComponent(company));
      setTimeout(schedule,0);
    });
    return button;
  }
  function renderPanel(panel,toggle){
    var rows=queue(),company=currentCompany();
    if(state.limit<5)state.limit=5;
    if(state.limit>rows.length&&rows.length)state.limit=Math.max(5,rows.length);
    toggle.setAttribute('aria-expanded',state.open?'true':'false');
    toggle.querySelector('b').textContent=String(rows.length);
    panel.classList.toggle('open',state.open);
    panel.innerHTML='';

    var head=document.createElement('div');head.className='ps88-queue-head';
    var hleft=document.createElement('div');
    var kick=document.createElement('div');kick.className='ps88-queue-kick';kick.textContent="Today's call plan";
    var title=document.createElement('strong');title.textContent='Customers to call';
    hleft.appendChild(kick);hleft.appendChild(title);
    var total=document.createElement('span');total.textContent=rows.length+' queued';
    head.appendChild(hleft);head.appendChild(total);

    var list=document.createElement('div');list.className='ps88-queue-list';
    var shown=Math.min(state.limit,rows.length);
    if(rows.length){
      rows.slice(0,shown).forEach(function(item,index){list.appendChild(itemButton(item,index,norm(item&&item.customer)===norm(company)))});
    }else{
      var empty=document.createElement('div');empty.className='ps88-queue-empty';empty.textContent='No customers are currently loaded in today\'s call queue.';list.appendChild(empty);
    }

    var foot=document.createElement('div');foot.className='ps88-queue-foot';
    var showing=document.createElement('div');showing.className='ps88-showing';showing.textContent=rows.length?'Showing '+shown+' of '+rows.length+' customers':'Queue is empty';
    foot.appendChild(showing);
    if(shown<rows.length){
      var more=document.createElement('button');more.type='button';more.className='ps88-load-more';more.textContent='＋ Load 5 More';
      more.addEventListener('click',function(e){e.stopPropagation();state.limit+=5;renderPanel(panel,toggle)});
      foot.appendChild(more);
    }
    panel.appendChild(head);panel.appendChild(list);panel.appendChild(foot);
    panel.setAttribute('data-ps88-signature',signature());
  }
  function enhance(){
    scheduled=false;
    var shell=document.querySelector('#rp-overlay .ps62-shell');
    if(!shell)return;
    var old=shell.querySelector('.ps62-queue-strip');
    if(old)old.remove();
    var command=shell.querySelector('.ps62-command');
    var actions=command&&command.querySelector('.ps62-command-actions');
    if(!command||!actions)return;

    var toggle=actions.querySelector('.ps88-queue-toggle');
    var panel=command.querySelector('.ps88-queue-panel');
    if(!toggle){
      toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='ps88-queue-toggle';
      toggle.title="Open today's customer call queue";
      toggle.innerHTML='<span>Queue</span><b>0</b><span class="ps88-arrow">⌄</span>';
      actions.appendChild(toggle);
    }
    if(!panel){
      panel=document.createElement('div');
      panel.className='ps88-queue-panel';
      command.appendChild(panel);
    }
    if(toggle.getAttribute('data-ps88-bound')!=='1'){
      toggle.setAttribute('data-ps88-bound','1');
      toggle.addEventListener('click',function(e){
        e.stopPropagation();state.open=!state.open;renderPanel(panel,toggle);
      });
    }
    var sig=signature();
    if(panel.getAttribute('data-ps88-signature')!==sig)renderPanel(panel,toggle);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}

  if(!window._ps88QueueGlobalBound){
    window._ps88QueueGlobalBound=true;
    document.addEventListener('click',function(event){
      if(!state.open)return;
      var command=event.target&&event.target.closest&&event.target.closest('#rp-overlay .ps62-command');
      if(command)return;
      state.open=false;schedule();
    });
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&state.open){state.open=false;schedule()}});
  }

  function arm(){
    var host=document.getElementById('rp-overlay');
    if(host){
      new MutationObserver(schedule).observe(host,{childList:true,subtree:true});
      schedule();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arm,{once:true});else arm();
  setTimeout(schedule,250);
  setTimeout(schedule,1000);
})();
