
(function(){
 'use strict';
 var lane=window._tb607Lane||'all',sort=window._tb607Sort||'priority';
 function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
 function n(v){var x=Number(v);return isFinite(x)?x:0}
 function money(v){return '$'+Math.round(n(v)).toLocaleString()}
 function clean(v){return String(v==null?'':v).trim()}
 function parseDate(v){if(!v)return null;var d;try{d=new Date(String(v).length===10?String(v)+'T12:00:00':v)}catch(e){return null}return isNaN(d.getTime())?null:d}
 function dayKey(v){var d=parseDate(v);if(!d)return'';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function todayKey(){return dayKey(new Date())}
 function dueState(t){
   if(clean(t.status).toLowerCase()==='completed')return'completed';
   var d=parseDate(t.dueDate),now=new Date();now.setHours(12,0,0,0);if(!d)return'upcoming';d.setHours(12,0,0,0);
   if(d<now)return'overdue';if(d.getTime()===now.getTime())return'today';return'upcoming'
 }
 function dueLabel(t){
   if(typeof window._rp2ActionTaskDueLabelV607==='function'){try{return window._rp2ActionTaskDueLabelV607(t)}catch(e){}}
   var s=dueState(t),d=parseDate(t.dueDate);if(s==='completed')return'Completed';if(s==='overdue')return'Overdue · '+(d?d.toLocaleDateString():'');if(s==='today')return'Due today';return d?'Due '+d.toLocaleDateString():'Upcoming'
 }
 function ownership(t){
   var z=(clean(t.category)+' '+clean(t.title)+' '+clean(t.why)+' '+clean(t.action)+' '+clean(t.measure)+' '+clean(t.status)).toLowerCase();
   if(/waiting on customer|customer review|customer approval|customer response|customer decision|customer feedback|awaiting customer|proof approval|artwork approval|deposit|payment from customer|size list|address list/.test(z))return'customer';
   if(/waiting internally|internal review|production|accounting|art department|vendor|supplier|inventory|purchasing|management approval|credit review|shipping|operations/.test(z))return'internal';
   return''
 }
 function tone(t){var s=dueState(t);if(s==='overdue')return'#FB7185';if(s==='today')return'#FBBF24';if(ownership(t)==='customer')return'#9B6BFF';if(ownership(t)==='internal')return'#4C9DFF';if(s==='completed')return'#47D16C';return'#00AFEF'}
 function build(){
   if(typeof window._rp2ActionBuildV607==='function')return window._rp2ActionBuildV607();
   var rows=typeof window._tb605Model==='function'?window._tb605Model((window._rp2&&_rp2.rep)||''):[];
   return{tasks:rows,open:rows,todayOpen:[],overdue:[],future:rows,completed:[],completions:[],ctx:{mode:'live',selectedWeek:{label:'Current week'}},liveActionable:true}
 }
 function models(g){
   var open=(g.open||g.tasks||[]).filter(function(t){return dueState(t)!=='completed'}),completed=(g.completed||[]).slice();
   var overdue=open.filter(function(t){return dueState(t)==='overdue'}),today=open.filter(function(t){return dueState(t)==='today'}),upcoming=open.filter(function(t){return dueState(t)==='upcoming'}),customer=open.filter(function(t){return ownership(t)==='customer'}),internal=open.filter(function(t){return ownership(t)==='internal'});
   return{all:open,overdue:overdue,today:today,customer:customer,internal:internal,upcoming:upcoming,completed:completed}
 }
 function doneToday(g){
   var key=todayKey(),count=0;(g.completions||[]).forEach(function(e){if(dayKey(e.at||e.completedAt)===key)count++});
   if(!count)(g.completed||[]).forEach(function(t){if(dayKey(t.completedAt)===key)count++});return count
 }
 function valueOf(t){return n(t.value||t.opportunityValue||0)}
 function sorter(a,b){
   if(sort==='due'){var ad=parseDate(a.dueDate),bd=parseDate(b.dueDate);return (ad?ad.getTime():9e15)-(bd?bd.getTime():9e15)||n(b.score)-n(a.score)}
   if(sort==='customer')return clean(a.customer).localeCompare(clean(b.customer))||n(b.score)-n(a.score)
   if(sort==='category')return clean(a.category).localeCompare(clean(b.category))||n(b.score)-n(a.score)
   if(sort==='value')return valueOf(b)-valueOf(a)||n(b.score)-n(a.score);
   var weight={overdue:4,today:3,upcoming:2,completed:1};return (weight[dueState(b)]-weight[dueState(a)])||n(b.score)-n(a.score)||valueOf(b)-valueOf(a)
 }
 function tag(text,cls){return'<span class="tb607-tag '+(cls||'')+'">'+esc(text)+'</span>'}
 function openAction(t,label){
   var page=clean(t.page)||'action',company=clean(t.customer),onclick='';
   if(company&&page==='customers'&&typeof window._tb605OpenCo==='function')onclick="_tb605OpenCo('"+encodeURIComponent(company)+"')";
   else onclick="_rp2Go('"+esc(page)+"')";
   return'<button class="tb607-mini" onclick="'+onclick+'">'+(label||'Open')+'</button>'
 }
 function actionButtons(t,compact,g){
   var historical=g.ctx&&g.ctx.mode==='historical',id=encodeURIComponent(t.id||''),buttons='';
   if(dueState(t)!=='completed'){
     buttons+='<button class="tb607-mini primary" '+(historical?'disabled':'')+' onclick="_rp2ActionComplete(\''+id+'\')">Complete</button>';
     if(!compact)buttons+='<button class="tb607-mini" '+(historical?'disabled':'')+' onclick="_rp2ActionSnooze(\''+id+'\',1)">Tomorrow</button>';
     buttons+=openAction(t,'Open');
   }else buttons+=openAction(t,'Open');
   return buttons
 }
 function taskCard(t,i,g){
   var state=dueState(t),own=ownership(t),search=(clean(t.title)+' '+clean(t.customer)+' '+clean(t.orderNum)+' '+clean(t.category)+' '+clean(t.why)).toLowerCase();
   var cls=state==='overdue'?'risk':state==='today'?'warn':state==='completed'?'good':'';
   return'<article class="tb607-task" data-tb607="1" data-search="'+esc(search)+'" style="--tone:'+tone(t)+'">'
    +'<div class="tb607-task-num">'+(state==='completed'?'✓':(i+1))+'</div>'
    +'<div class="tb607-task-main"><div class="tb607-task-badges">'+tag(t.category||'Action')+tag(t.source==='manager'?'Manager assignment':t.source==='manual'?'Personal task':'Smart priority')+tag(dueLabel(t),cls)+(own?tag(own==='customer'?'Waiting on customer':'Waiting internally',own==='customer'?'':''):'')+'</div>'
    +'<div class="tb607-task-title">'+esc(t.title||'Customer action')+'</div><div class="tb607-task-why">'+esc(t.why||t.notes||'Complete the next promised action.')+'</div><div class="tb607-task-do"><b>Next move:</b> '+esc(t.action||'Complete the task and record the outcome.')+'</div></div>'
    +'<div class="tb607-task-meta"><div><span>Customer</span><strong>'+esc(t.customer||'—')+'</strong></div><div><span>Order</span><strong>'+esc(t.orderNum||'—')+'</strong></div><div><span>Impact</span><strong>'+(valueOf(t)?money(valueOf(t)):'—')+'</strong></div></div>'
    +'<div class="tb607-task-actions">'+actionButtons(t,false,g)+'</div></article>'
 }
 function watchRow(t,color){return'<div class="tb607-watch"><i style="--dot:'+color+'"></i><div><strong>'+esc(t.title||'Action')+'</strong><span>'+esc((t.customer?t.customer+' · ':'')+dueLabel(t))+'</span></div><em>'+esc(t.category||'')+'</em></div>'}
 function render(){
   var g=build(),m=models(g),active=m[lane]||m.all,done=doneToday(g),due=m.overdue.length+m.today.length,total=due+done,pct=total?Math.round(done/total*100):100;
   active=active.slice().sort(sorter);var first=(m.overdue.concat(m.today,m.all)).filter(function(t,index,self){return self.indexOf(t)===index})[0]||active[0]||null;
   var rep=clean(window._rp2&&_rp2.rep)||'Rep',date=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
   var counts={all:m.all.length,overdue:m.overdue.length,today:m.today.length,customer:m.customer.length,internal:m.internal.length,upcoming:m.upcoming.length,completed:m.completed.length};
   var hero='<header class="tb607-hero"><div class="tb607-hero-main"><div class="tb607-kick">TODAY\'S BUSINESS · PROMISE & EXECUTION CENTER · BUILD v607</div><h1 class="tb607-title">What needs to move today?</h1><div class="tb607-sub">See every commitment in one place, separate work you own from work waiting on someone else, and close the loop without turning the page into a calendar. The schedule concept belongs in Daily Sales & Calls; this page is for execution.</div><div class="tb607-date"><b>'+esc(date)+'</b><span>·</span><span>'+esc(rep)+'</span><span>·</span><span>'+m.all.length+' open commitments</span></div><div class="tb607-hero-actions"><button class="tb607-btn primary" onclick="_rp2ActionNew()">＋ Add task</button><button class="tb607-btn" onclick="_rp2ActionCopyPlan()">Copy today\'s plan</button><button class="tb607-btn" onclick="_rp2RefreshCloud(this,false)">Refresh data</button><button class="tb607-btn good" onclick="_rp2Go(\'daily\')">Open Daily Sales & Calls</button></div></div>'
    +'<div class="tb607-hero-side"><div class="tb607-progress-ring" style="--pct:'+pct+'"><strong>'+pct+'%</strong><span>cleared</span></div><div class="tb607-progress-copy"><b>'+done+' closed today</b><p>'+(due?due+' due or overdue commitments remain. Clear the oldest promise first, then work the highest-impact customer action.':'The due queue is clear. Pull forward the best upcoming customer or growth action.')+'</p><small>'+counts.customer+' waiting on customers · '+counts.internal+' waiting internally</small></div></div></header>';
   function kpi(label,val,sub,glow){return'<div class="tb607-kpi" style="--glow:'+glow+'"><div class="tb607-kpi-label">'+label+'</div><div class="tb607-kpi-value">'+val+'</div><div class="tb607-kpi-sub">'+sub+'</div></div>'}
   var kpis='<div class="tb607-kpis">'+kpi('Do now',counts.overdue+counts.today,'Due today or already late','rgba(250,135,61,.24)')+kpi('Overdue',counts.overdue,'Oldest promises first','rgba(251,113,133,.24)')+kpi('Waiting customer',counts.customer,'Customer owns the next move','rgba(155,107,255,.22)')+kpi('Waiting internally',counts.internal,'TCP or vendor action needed','rgba(76,157,255,.22)')+kpi('Upcoming',counts.upcoming,'Future dated commitments','rgba(0,175,239,.20)')+kpi('Completed',done,'Closed today','rgba(71,209,108,.22)')+'</div>';
   var defs=[['all','Open',counts.all],['overdue','Overdue',counts.overdue],['today','Due Today',counts.today],['customer','Waiting Customer',counts.customer],['internal','Waiting Internal',counts.internal],['upcoming','Upcoming',counts.upcoming],['completed','Completed',counts.completed]];
   var lanes='<div class="tb607-lanes">'+defs.map(function(x){return'<button class="tb607-lane '+(lane===x[0]?'on':'')+'" onclick="_tb607SetLane(\''+x[0]+'\')">'+x[1]+'<b>'+x[2]+'</b></button>'}).join('')+'</div>';
   var focus=first&&lane!=='completed'?'<div class="tb607-focus"><div class="tb607-focus-rank">1</div><div><div class="tb607-focus-label">Next best action</div><div class="tb607-focus-title">'+esc(first.title||'Customer action')+'</div><div class="tb607-focus-copy">'+esc(first.action||first.why||'Complete the next promised action and record the result.')+'</div></div><div class="tb607-focus-actions">'+actionButtons(first,true,g)+'</div></div>':'';
   var tools='<div class="tb607-tools"><input id="tb607-search" type="search" placeholder="Search customer, task, order, or category…" oninput="_tb607Search()"><select onchange="_tb607Sort(this.value)"><option value="priority" '+(sort==='priority'?'selected':'')+'>Sort: Priority</option><option value="due" '+(sort==='due'?'selected':'')+'>Sort: Due date</option><option value="value" '+(sort==='value'?'selected':'')+'>Sort: Highest impact</option><option value="customer" '+(sort==='customer'?'selected':'')+'>Sort: Customer A–Z</option><option value="category" '+(sort==='category'?'selected':'')+'>Sort: Category</option></select></div>';
   var list=active.length?'<div id="tb607-list" class="tb607-list">'+active.slice(0,80).map(function(t,i){return taskCard(t,i,g)}).join('')+'</div>':'<div class="tb607-empty"><strong>This lane is clear</strong>No commitments currently match this view.</div>';
   var main='<section class="tb607-panel"><div class="tb607-panel-head"><div><div class="tb607-section-kick">WORK QUEUE</div><div class="tb607-section-title">Promises, priorities, and next steps</div><div class="tb607-section-copy">The queue uses the mature Action Center model: manager assignments, personal tasks, order and quality risks, customer opportunities, production checks, and dated follow-ups.</div></div><span id="tb607-visible-count" class="tb607-count">'+active.length+'</span></div>'+lanes+tools+focus+list+'</section>';
   var cust=m.customer.slice().sort(sorter),internal=m.internal.slice().sort(sorter),upcoming=m.upcoming.slice().sort(sorter);
   var side='<aside class="tb607-panel"><div class="tb607-panel-head"><div><div class="tb607-section-kick">COMMITMENT RADAR</div><div class="tb607-section-title">Who owns the next move?</div><div class="tb607-section-copy">Keep blocked work visible without letting it compete with actions the rep can execute now.</div></div></div><div class="tb607-side">'
    +'<div class="tb607-side-card"><div class="tb607-side-title">Next move <span>Do this first</span></div>'+(first?'<div class="tb607-next"><div class="tb607-next-label">'+esc(dueLabel(first))+'</div><strong>'+esc(first.title||'Customer action')+'</strong><p>'+esc(first.action||first.why||'Complete the next promised action.')+'</p><div class="tb607-task-actions">'+actionButtons(first,true,g)+'</div></div>':'<div class="tb607-empty"><strong>Nothing urgent</strong>Pull forward an upcoming action or create a personal task.</div>')+'</div>'
    +'<div class="tb607-side-card"><div class="tb607-side-title">Waiting on others <span>'+cust.length+' customer · '+internal.length+' internal</span></div><div class="tb607-watch-list">'+(cust.length?cust.slice(0,3).map(function(t){return watchRow(t,'#9B6BFF')}).join(''):'')+(internal.length?internal.slice(0,3).map(function(t){return watchRow(t,'#4C9DFF')}).join(''):'')+(!cust.length&&!internal.length?'<div class="tb607-empty"><strong>No blocked work identified</strong>Nothing is currently classified as waiting on a customer or internal team.</div>':'')+'</div></div>'
    +'<div class="tb607-side-card"><div class="tb607-side-title">Upcoming commitments <span>Next five</span></div><div class="tb607-watch-list">'+(upcoming.length?upcoming.slice(0,5).map(function(t){return watchRow(t,'#00AFEF')}).join(''):'<div class="tb607-empty"><strong>No future commitments</strong>Add a dated task when the next promise is made.</div>')+'</div></div>'
    +'<div class="tb607-side-card"><div class="tb607-side-title">Quick actions <span>Keep momentum</span></div><div class="tb607-side-actions"><button class="tb607-btn primary" onclick="_rp2ActionNew()">Add task</button><button class="tb607-btn" onclick="_rp2Go(\'call\')">Call Workspace</button><button class="tb607-btn" onclick="_rp2Go(\'dealdesk\')">Quotes</button><button class="tb607-btn good" onclick="_rp2Go(\'daily\')">Daily Sales & Calls</button></div></div>'
    +'<div class="tb607-footnote">Waiting lanes are inferred from task language such as customer approval, proof feedback, production, accounting, vendor, or internal review. The task detail remains the source of truth.</div></div></aside>';
   var modal='';if(typeof window._rp2ActionModalHTMLV607==='function'){try{modal=window._rp2ActionModalHTMLV607(g)||''}catch(e){}}
   return'<div class="tb607-shell">'+hero+kpis+'<div class="tb607-layout">'+main+side+'</div></div>'+modal
 }
 function rerender(){var page=document.getElementById('rp2-page');if(page)page.innerHTML=render();var main=document.querySelector('#rp-overlay .rp2-main');if(main&&main.scrollTop>160)main.scrollTop=0}
 window._tb607SetLane=function(v){lane=window._tb607Lane=v||'all';rerender()};
 window._tb607Sort=function(v){sort=window._tb607Sort=v||'priority';rerender()};
 window._tb607Search=function(){var q=clean((document.getElementById('tb607-search')||{}).value).toLowerCase(),cards=[].slice.call(document.querySelectorAll('[data-tb607="1"]')),shown=0;cards.forEach(function(c){var ok=!q||clean(c.getAttribute('data-search')).indexOf(q)>=0;c.style.display=ok?'grid':'none';if(ok)shown++});var count=document.getElementById('tb607-visible-count');if(count)count.textContent=shown};
 function install(){window._rp2ActionV2=function(){try{return render()}catch(e){console.error('[Today\'s Business v607]',e);return'<div class="tb607-shell"><div class="tb607-panel"><div class="tb607-section-title">Today\'s Business could not render</div><div class="tb607-section-copy">'+esc(e&&e.message||String(e))+'</div></div></div>'}}}
 install();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,480)});else setTimeout(install,480);
 window.addEventListener('load',function(){setTimeout(install,650)});
 window.TCP_TODAYS_BUSINESS_V607={version:'v607',concept:'promise and execution center',render:render};
})();
