
/* ===== TB605: Today's Business — triage + work queue (overrides _rp2ActionV2) ===== */
(function(){
  var K='tcp_rp_tb605';
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function ov(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{};}catch(e){return {};}}
  function ovSave(o){try{localStorage.setItem(K,JSON.stringify(o));}catch(e){}}
  function ymd(d){function p(x){return (x<10?'0':'')+x;}return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
  function todayYmd(){return ymd(new Date());}
  function daysSince(iso){
    if(!iso)return null;
    var t=new Date(String(iso).slice(0,10)+'T12:00:00').getTime();
    if(!t||isNaN(t))return null;
    return Math.floor((Date.now()-t)/864e5);
  }
  function hidden(key){
    var o=ov();
    if(o.done&&o.done[key])return true;
    if(o.snooze&&o.snooze[key]&&o.snooze[key]>=todayYmd())return true;
    return false;
  }
  window._tb605Done=function(key,kind,id){
    var o=ov();o.done=o.done||{};o.done[key]=Date.now();
    // prune >30d
    Object.keys(o.done).forEach(function(k){if(Date.now()-o.done[k]>30*864e5)delete o.done[k];});
    ovSave(o);
    if(kind==='fu'){ // write completion back to the action center store so both pages agree
      try{
        var st=JSON.parse(localStorage.getItem('tcp_rp_action_center_v504')||'null');
        if(st){
          var hit=false;
          Object.keys(st).forEach(function(k){
            if(!Array.isArray(st[k]))return;
            st[k].forEach(function(x){
              if(x&&typeof x==='object'&&String(x.id)===String(id)){x.status='done';x.completedAt=new Date().toISOString();hit=true;}
            });
          });
          if(hit)localStorage.setItem('tcp_rp_action_center_v504',JSON.stringify(st));
        }
      }catch(e){}
    }
    try{_rp2Go('action');}catch(e){}
  };
  window._tb605Snooze=function(key){
    var o=ov();o.snooze=o.snooze||{};
    var t=new Date();t.setDate(t.getDate()+1);
    o.snooze[key]=ymd(t);
    Object.keys(o.snooze).forEach(function(k){if(o.snooze[k]<todayYmd())delete o.snooze[k];});
    ovSave(o);
    try{_rp2Go('action');}catch(e){}
  };
  function repOrders(rep){
    try{return (S.orders||[]).filter(function(o){return o&&o.rep===rep&&o.orderDate;});}catch(e){return [];}
  }
  window._tb605Model=function(rep){
    var items=[];
    // 1 — ART ERRORS (severity 1)
    try{
      (S.artErrors||[]).forEach(function(a){
        if(!a||a.rep!==rep)return;
        var d=daysSince(a.dateISO||a.date&&new Date(a.date).toISOString());
        if(d==null){try{d=daysSince(new Date(a.date).toISOString().slice(0,10));}catch(e){d=0;}}
        if(d!=null&&d>45)return; // stale
        items.push({kind:'art',sev:1,id:a.id,key:'art:'+a.id,
          title:(a.so?('SO '+a.so+' \u00b7 '):'')+(a.type||'Art error'),
          meta:a.desc||'',company:'',over:Math.max(0,d==null?0:d)});
      });
    }catch(e){}
    // 2 — FOLLOW-UPS (severity 2) from action center store
    try{
      var st=JSON.parse(localStorage.getItem('tcp_rp_action_center_v504')||'null')||{};
      Object.keys(st).forEach(function(k){
        if(!Array.isArray(st[k]))return;
        st[k].forEach(function(x){
          if(!x||typeof x!=='object')return;
          var status=String(x.status||x.state||'').toLowerCase();
          if(status&&status!=='open'&&status!=='pending')return;
          var comp=x.company||x.customer||'';
          var title=x.title||x.label||x.note||x.desc||x.action||'Follow-up';
          if(!comp&&(!x.due&&!x.dueDate))return;
          var due=x.due||x.dueDate||x.date||x.when||'';
          var overD=due?daysSince(String(due).slice(0,10)):0;
          items.push({kind:'fu',sev:2,id:x.id,key:'fu:'+x.id,
            title:String(title).slice(0,90),meta:due?('due '+String(due).slice(0,10)):'',
            company:comp,over:Math.max(0,overD==null?0:overD)});
        });
      });
    }catch(e){}
    // 3 — ORDERS NEEDING ATTENTION (severity 3)
    try{
      var ATT={'Action Required':1,'Approval Needed':1,'Pending Customer':1,'Pending Internal':1};
      repOrders(rep).forEach(function(o){
        var d=daysSince(o.orderDate)||0;
        var flag=ATT[o.status]?o.status:((o.status==='Open'||o.status==='Pending'||o.status==='Draft')&&d>14?('Open '+d+'d'):null);
        if(!flag)return;
        items.push({kind:'ord',sev:3,id:o.id||o.orderNum,key:'ord:'+(o.id||o.orderNum),
          title:(o.orderNum?('#'+o.orderNum+' \u00b7 '):'')+(o.customer||''),
          meta:flag+(o.total?(' \u00b7 $'+Math.round(Number(o.total)||0).toLocaleString()):''),
          company:o.customer||'',over:Math.max(0,ATT[o.status]?d:d-14)});
      });
    }catch(e){}
    // 4 — REORDERS DUE (severity 4) — bulk cadence per customer
    try{
      var by={};
      repOrders(rep).forEach(function(o){
        var nm=String(o.customer||'').trim();if(!nm)return;
        (by[nm]=by[nm]||[]).push(String(o.orderDate).slice(0,10));
      });
      Object.keys(by).forEach(function(nm){
        var ds=by[nm].sort();if(ds.length<2)return;
        var gaps=[];for(var i=1;i<ds.length;i++){var g=(new Date(ds[i])-new Date(ds[i-1]))/864e5;if(g>0&&g<400)gaps.push(g);}
        if(!gaps.length)return;
        var cad=Math.round(gaps.reduce(function(s,v){return s+v;},0)/gaps.length);
        var since=daysSince(ds[ds.length-1]);
        if(since==null||since<cad)return;
        items.push({kind:'re',sev:4,id:nm,key:'re:'+nm.toLowerCase(),
          title:nm,meta:'usually every ~'+cad+'d \u00b7 last order '+since+'d ago',
          company:nm,over:since-cad});
      });
    }catch(e){}
    items=items.filter(function(it){return !hidden(it.key);});
    items.sort(function(a,b){return (a.sev-b.sev)||(b.over-a.over);});
    return items;
  };
  function actionsFor(it){
    var enc=encodeURIComponent(it.company||'');
    var a='';
    var openCo=it.company?('<button class="tb605-act" onclick="_tb605OpenCo(\''+enc+'\')">Open customer</button>'):'';
    if(it.kind==='art')a=openCo;
    if(it.kind==='fu')a=openCo;
    if(it.kind==='ord')a='<button class="tb605-act" onclick="_rp2Go(\'orders\')">Open orders</button>'+openCo;
    if(it.kind==='re')a='<button class="tb605-act tb605-hot" onclick="_cw4StartQuote(\''+enc+'\')">Start quote</button>'+openCo;
    return a
      +'<button class="tb605-act tb605-ok" title="Done" onclick="_tb605Done(\''+esc(it.key)+'\',\''+it.kind+'\',\''+esc(String(it.id))+'\')">\u2713</button>'
      +'<button class="tb605-act" title="Snooze until tomorrow" onclick="_tb605Snooze(\''+esc(it.key)+'\')">\uD83D\uDCA4</button>';
  }
  window._tb605OpenCo=function(enc){
    try{
      if(typeof window._cw4OpenCompany==='function'){_rp2Go('customers');setTimeout(function(){window._cw4OpenCompany(enc);},120);return;}
    }catch(e){}
    _rp2Go('customers');
  };
  var KINDMETA={art:{i:'\uD83C\uDFA8',l:'Art errors',c:'#FB7185'},fu:{i:'\u2705',l:'Follow-ups',c:'#FBBF24'},ord:{i:'\uD83D\uDCE6',l:'Orders',c:'#4C9DFF'},re:{i:'\uD83D\uDD01',l:'Reorders',c:'#47D16C'}};
  var SLOTS=[
    {id:'triage',time:'8:00',h:8,title:'Morning triage',sub:'Blockers and anything burning \u2014 clear these first',icon:'\uD83D\uDD25',c:'#FB7185'},
    {id:'calls',time:'9:00',h:9,title:'Prime calling block',sub:'Open follow-ups \u2014 best connect rates before lunch',icon:'\uD83D\uDCDE',c:'#FBBF24'},
    {id:'orders',time:'11:00',h:11,title:'Orders desk',sub:'Orders waiting on action or approval',icon:'\uD83D\uDCE6',c:'#4C9DFF'},
    {id:'reorders',time:'1:00',h:13,title:'Reorder outreach',sub:'Customers past their buying rhythm \u2014 easy wins',icon:'\uD83D\uDD01',c:'#47D16C'},
    {id:'wrap',time:'4:30',h:16.5,title:'Wrap up',sub:'Close the loop on today',icon:'\uD83C\uDFC1',c:'#9B6BFF'}
  ];
  function slotFor(it){
    if(it.kind==='art'||it.over>=3)return 'triage';
    if(it.kind==='fu')return 'calls';
    if(it.kind==='ord')return 'orders';
    if(it.kind==='re')return 'reorders';
    return 'calls';
  }
  window._tb605Slot=slotFor;
  function agendaCard(it){
    var m=KINDMETA[it.kind];
    var flame=it.over>=3?'<span class="tb6-flame">\uD83D\uDD25 '+it.over+'d</span>':(it.over>0?'<span class="tb6-late">'+it.over+'d late</span>':'');
    return '<div class="tb6-item" style="--k:'+m.c+';">'
      +'<span class="tb6-item-ic">'+m.i+'</span>'
      +'<div class="tb6-item-main"><strong>'+esc(it.title)+'</strong>'
      +'<span>'+esc(it.company&&it.kind!=='re'?(it.company+(it.meta?' \u00b7 ':'')):'')+esc(it.meta)+'</span></div>'
      +flame
      +'<div class="tb6-item-acts">'+actionsFor(it)+'</div>'
      +'</div>';
  }
  var _origActionV2=null;
  function tbPage(){
    var rep=(window._rp2&&_rp2.rep)||'';
    var items=_tb605Model(rep);
    var o=ov();
    var doneToday=0;
    try{Object.keys(o.done||{}).forEach(function(k){if(new Date(o.done[k]).toDateString()===new Date().toDateString())doneToday++;});}catch(e){}
    var total=items.length+doneToday;
    var pct=total?Math.round(doneToday/total*100):100;
    var hr=new Date().getHours();
    var greet=hr<12?'Good morning':(hr<17?'Good afternoon':'Good evening');
    var dstr=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
    var hot=items.filter(function(it){return it.over>=3;}).length;
    var html='<div class="tb6-greet">'
      +'<div class="tb6-greet-l"><div class="tb6-hi">'+greet+', '+esc(String(rep).split(' ')[0])+' \uD83D\uDC4B</div><div class="tb6-date">'+dstr+' \u00b7 '+items.length+' on the plan'+(hot?' \u00b7 <b class="tb6-hotcount">\uD83D\uDD25 '+hot+' burning</b>':'')+'</div></div>'
      +'<div class="tb6-greet-r"><div class="tb6-progress"><div class="tb6-progress-fill" style="width:'+pct+'%;"></div></div><span class="tb6-progress-n">'+doneToday+' of '+total+' cleared</span></div>'
      +'</div>';
    var nowH=hr+new Date().getMinutes()/60;
    var nowPlaced=false;
    html+='<div class="tb6-timeline">';
    SLOTS.forEach(function(sl,si){
      var list=sl.id==='wrap'?[]:items.filter(function(it){return slotFor(it)===sl.id;});
      if(!nowPlaced&&nowH<sl.h){html+='<div class="tb6-now"><span class="tb6-now-dot"></span><span class="tb6-now-lbl">NOW</span><span class="tb6-now-line"></span></div>';nowPlaced=true;}
      var body='';
      if(sl.id==='wrap'){
        body='<div class="tb6-wrapline">'+(items.length===0
          ?'\uD83C\uDF89 Everything cleared \u2014 plan tomorrow from a clean slate.'
          :(items.length+' item'+(items.length>1?'s':'')+' still open \u2014 knock out what you can, snooze the rest.'))
          +(doneToday?'<span class="tb6-cleared">\u2713 '+doneToday+' cleared today</span>':'')+'</div>';
      }else{
        body=list.length?list.map(agendaCard).join(''):'<div class="tb6-empty">\u2728 Nothing scheduled here \u2014 clear runway.</div>';
      }
      html+='<div class="tb6-slot'+(list.length?'':' tb6-slot-clear')+'" style="--s:'+sl.c+';">'
        +'<div class="tb6-time"><span class="tb6-time-t">'+sl.time+'</span><span class="tb6-dot"></span></div>'
        +'<div class="tb6-block">'
        +'<div class="tb6-block-h"><span class="tb6-block-ic">'+sl.icon+'</span><div><strong>'+sl.title+'</strong><em>'+sl.sub+'</em></div>'+(list.length?'<span class="tb6-cnt">'+list.length+'</span>':'')+'</div>'
        +body
        +'</div></div>';
    });
    if(!nowPlaced)html+='<div class="tb6-now"><span class="tb6-now-dot"></span><span class="tb6-now-lbl">NOW</span><span class="tb6-now-line"></span></div>';
    html+='</div>';
    return html;
  }
  function arm(){
    if(typeof window._rp2ActionV2==='function'&&window._rp2ActionV2!==tbWrapped){_origActionV2=window._rp2ActionV2;}
    window._rp2ActionV2=tbWrapped;
  }
  function tbWrapped(){
    try{return tbPage();}catch(e){console.warn('[tb605 fallback]',e);try{return _origActionV2?_origActionV2():'';}catch(_e){return '';}}
  }
  if(document.readyState==='complete')arm();
  else window.addEventListener('load',function(){setTimeout(arm,300);});
  arm();
})();