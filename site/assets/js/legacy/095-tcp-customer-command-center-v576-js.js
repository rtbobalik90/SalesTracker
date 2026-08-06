
(function(){
 'use strict';
 if(window.TCP_CUSTOMER_COMMAND_CENTER_V576)return;
 var BASE=window._rp2CustomersV2;
 if(typeof BASE!=='function')return;

 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
 function text(el){return el?String(el.textContent||'').replace(/\s+/g,' ').trim():''}
 function html(el){return el?el.innerHTML:''}
 function parse(markup){var t=document.createElement('template');t.innerHTML=String(markup||'').trim();return t.content}
 function openAccount(){return !!(window._rp2CompanyOpenKey||window._cw4CompanyName)}
 function currentTab(){return String(window._rp2CompanyProfileTab||'overview').toLowerCase()}
 function currentName(doc){return text(doc.querySelector('.cw4-head-name'))||window._cw4CompanyName||'Customer'}
 function initials(name){return String(name||'CO').trim().split(/\s+/).slice(0,2).map(function(x){return x.charAt(0).toUpperCase()}).join('')||'CO'}
 function numberFrom(value){var m=String(value||'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0}

 function baseFor(tab,salesView){
  var oldTab=window._rp2CompanyProfileTab,oldSales=window._cw6SalesView;
  try{
   window._rp2CompanyProfileTab=tab;
   if(salesView)window._cw6SalesView=salesView;
   return BASE();
  }finally{
   window._rp2CompanyProfileTab=oldTab;
   window._cw6SalesView=oldSales;
  }
 }
 function outerModal(doc){var m=doc.querySelector('.cw4-modal-wrap');return m?m.outerHTML:''}
 function profileContent(doc){var c=doc.querySelector('.cw5-tab-content');return c?c.cloneNode(true):null}
 function removeFirstSectionHead(node){if(!node)return node;var first=node.querySelector('.cw4-section-head');if(first)first.remove();return node}
 function findCard(doc,title){
  var cards=Array.prototype.slice.call(doc.querySelectorAll('.cw4-card'));
  return cards.filter(function(card){return text(card.querySelector('.cw4-card-title')).toLowerCase().indexOf(String(title).toLowerCase())>=0})[0]||null;
 }
 function factsFrom(doc){
  var card=findCard(doc,'Stable customer context'),rows=card?card.querySelectorAll('.cw4-field-row'):[];
  return Array.prototype.slice.call(rows).map(function(r){return {label:text(r.querySelector('.cw4-field-label')),value:text(r.querySelector('.cw4-field-value'))}}).filter(function(x){return x.label}).slice(0,8)
 }
 function healthFrom(doc){
  return Array.prototype.slice.call(doc.querySelectorAll('.cw5-health-row')).map(function(r){return text(r.querySelector('strong'))+': '+text(r.querySelector('b'))}).filter(Boolean).slice(0,4)
 }
 function metricFrom(doc){
  return Array.prototype.slice.call(doc.querySelectorAll('.cw5-head-metric')).map(function(m){return {label:text(m.querySelector('span')),value:text(m.querySelector('strong'))}}).filter(function(x){return x.label||x.value})
 }
 function groupCount(doc,heading,selector){
  var heads=Array.prototype.slice.call(doc.querySelectorAll('.cw4-section-head')),target=heads.filter(function(h){return text(h.querySelector('.cw4-section-title')).toLowerCase().indexOf(heading.toLowerCase())>=0})[0];
  if(!target)return 0;
  var count=0,node=target.nextElementSibling;
  while(node&&!node.classList.contains('cw4-section-head')){count+=node.matches&&node.matches(selector)?1:node.querySelectorAll?node.querySelectorAll(selector).length:0;node=node.nextElementSibling}
  return count
 }
 function salesCount(doc){
  var btn=Array.prototype.slice.call(doc.querySelectorAll('.cw7-subnav button')).filter(function(b){return /command center/i.test(text(b))})[0];
  if(btn)return numberFrom(text(btn));
  return doc.querySelectorAll('.cw7-order-card').length
 }
 function recordValue(doc,sourceNeedle,titleNeedle){
  var cards=Array.prototype.slice.call(doc.querySelectorAll('.cw4-record'));
  var card=cards.filter(function(c){return text(c.querySelector('.cw4-record-source')).toLowerCase().indexOf(sourceNeedle.toLowerCase())>=0&&text(c.querySelector('.cw4-record-title')).toLowerCase().indexOf(titleNeedle.toLowerCase())>=0})[0];
  return card?numberFrom(text(card.querySelector('.cw4-record-value'))):0
 }
 function tile(icon,name,copy,count,section,color){
  return '<button class="cux8-tile" style="--tile:'+color+'" onclick="_cux8Open(\''+section+'\')"><span class="cux8-tile-icon">'+icon+'</span><span class="cux8-tile-name">'+esc(name)+'</span><span class="cux8-tile-copy">'+esc(copy)+'</span><span class="cux8-tile-meta"><b>'+Number(count||0).toLocaleString()+'</b> connected records</span></button>'
 }
 function actionButtons(){
  return '<div class="cux8-actions">'
   +'<button class="cux8-action primary" onclick="_cux8Action(\'call\')">☎ Call</button>'
   +'<button class="cux8-action" onclick="_cux8Action(\'email\')">✉ Email</button>'
   +'<button class="cux8-action" onclick="_cux8Action(\'note\')">＋ Add Note</button>'
   +'<button class="cux8-action orange" onclick="_cux8Action(\'quote\')">Create Quote</button>'
   +'<button class="cux8-action" onclick="_cux8Action(\'activity\')">Log Activity</button>'
   +'</div>'
 }
 function hero(doc,name,compact){
  var sub=text(doc.querySelector('.cw4-head-sub'));
  var contact=doc.querySelector('.cw5-contact-block');
  var contactName=text(contact&&contact.querySelector('strong'));
  var contactCopy=text(contact&&contact.querySelector('span'));
  var metrics=metricFrom(doc);
  window._cux8CurrentName=name;
  var metricHtml=metrics.map(function(m){return '<div class="cux8-metric"><span>'+esc(m.label)+'</span><strong>'+esc(m.value||'—')+'</strong></div>'}).join('');
  return '<section class="cux8-hero"><div class="cux8-hero-top"><div class="cux8-identity">'
   +'<button class="cux8-back" title="Back to companies" onclick="_cw4CloseCompany()">←</button>'
   +'<div class="cux8-avatar">'+esc(initials(name))+'</div><div style="min-width:0"><div class="cux8-name">'+esc(name)+'</div><div class="cux8-sub">'+esc(sub||'Customer account')+'</div>'
   +'<div class="cux8-contact"><strong>'+esc(contactName||'Primary contact not recorded')+'</strong>'+(contactCopy?'<span class="cux8-dot"></span><span>'+esc(contactCopy)+'</span>':'')+'</div></div></div>'
   +actionButtons()+'</div><div class="cux8-metrics">'+metricHtml+'</div></section>'
 }
 /* ===== CX586: Account Intelligence rebuild — editable facts + vitals tabs + health line ===== */
window._cx586Esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
window._cx586Get=function(name,field){try{var ov=(S.cx586ov||{})[String(name||'').toLowerCase().trim()];return ov?(ov[field]||''):'';}catch(e){return '';}};
window._cx586Set=function(name,field,val){try{S.cx586ov=S.cx586ov||{};var k=String(name||'').toLowerCase().trim();S.cx586ov[k]=S.cx586ov[k]||{};S.cx586ov[k][field]=String(val||'').trim();if(typeof markDirty==='function')markDirty();}catch(e){}};
window._cx586Orders=function(name){
  var nm=String(name||'').toLowerCase().trim();
  var rows=((typeof S!=='undefined'&&S.orders)||[]).filter(function(o){return String(o.customer||'').toLowerCase().trim()===nm&&o.orderDate;});
  rows.sort(function(a,b){return String(a.orderDate).localeCompare(String(b.orderDate));});
  return rows;
};
window._cx586Vitals=function(name){
  var rows=_cx586Orders(name);
  var last=rows.length?rows[rows.length-1]:null;
  var lastDate=last?String(last.orderDate):'';
  var lastTotal=last?(Number(last.total)||0):0;
  var daysLastOrder=lastDate?Math.floor((Date.now()-new Date(lastDate+'T12:00:00'))/864e5):null;
  var gaps=[];for(var i=1;i<rows.length;i++){var g=(new Date(rows[i].orderDate)-new Date(rows[i-1].orderDate))/864e5;if(g>0&&g<400)gaps.push(g);}
  var cad=gaps.length?Math.round(gaps.reduce(function(s,v){return s+v;},0)/gaps.length):null;
  var due=(cad!=null&&daysLastOrder!=null)?(daysLastOrder>=cad):false;
  var nums={};rows.forEach(function(o){if(o.orderNum)nums[String(o.orderNum).toLowerCase()]=1;if(o.base)nums[String(o.base).toLowerCase()]=1;});
  var nm=String(name||'').toLowerCase().trim(),prod={};
  ((typeof S!=='undefined'&&S.orderLineItems)||[]).forEach(function(li){
    if(!li||typeof li!=='object')return;
    var on=String(li.orderNum||li.order||li.orderNumber||li.base||'').toLowerCase();
    var cn=String(li.customer||li.customerName||li.accountName||li.account||'').toLowerCase().trim();
    if(!((on&&nums[on])||(cn&&cn===nm)))return;
    var p=String(li.product||li.productName||li.item||li.description||li.style||'').trim();
    if(!p)return;
    var amt=Number(li.total||li.amount||li.ext||li.extPrice||li.lineTotal||li.price||0)||0;
    prod[p]=(prod[p]||0)+amt;
  });
  var top=Object.keys(prod).map(function(p){return {p:p,amt:prod[p]};}).sort(function(a,b){return b.amt-a.amt;}).slice(0,3);
  var lastTouch=null,openFu=0;
  try{
    var ac=JSON.parse(localStorage.getItem('tcp_rp_action_center_v504')||'null')||{};
    var pools=[];Object.keys(ac).forEach(function(k){if(Array.isArray(ac[k]))pools.push(ac[k]);});
    pools.forEach(function(arr){arr.forEach(function(x){
      if(!x||typeof x!=='object')return;
      var comp=String(x.company||x.customer||'').toLowerCase().trim();
      if(!comp||comp!==nm)return;
      var d=x.date||x.when||x.dueDate||x.completedAt||x.createdAt||x.ts;
      if(d){var t=new Date(d).getTime();if(t&&t<=Date.now()&&(!lastTouch||t>lastTouch))lastTouch=t;}
      var st=String(x.status||x.state||'').toLowerCase();
      if(st==='open')openFu++;
    });});
  }catch(e){}
  var daysTouch=lastTouch!=null?Math.floor((Date.now()-lastTouch)/864e5):null;
  return {lastDate:lastDate,lastTotal:lastTotal,daysLastOrder:daysLastOrder,cad:cad,due:due,top:top,daysTouch:daysTouch,openFu:openFu,orderCount:rows.length};
};
window._cx586Health=function(v){
  if(v.daysLastOrder==null)return {txt:'No orders recorded yet',col:'#9AA0B3'};
  var st=v.daysLastOrder<60?['Active','#47D16C']:v.daysLastOrder<120?['Cooling','#FBBF24']:['Dormant','#FB7185'];
  return {txt:st[0]+' \u00b7 last order '+v.daysLastOrder+'d ago'+(v.due?' \u00b7 reorder due':''),col:st[1]};
};
window._cx586Tab=function(btn){
  var wrap=btn.closest('.cx586-wrap');if(!wrap)return;
  wrap.querySelectorAll('.cx586-tab').forEach(function(b){b.classList.toggle('on',b===btn);});
  wrap.querySelectorAll('.cx586-pane').forEach(function(p){p.classList.toggle('on',p.dataset.pane===btn.dataset.t);});
};
window._cx586Edit=function(icon,name,field){
  var row=icon.closest('.cux8-fact');if(!row)return;
  var strong=row.querySelector('strong');if(!strong)return;
  var cur=_cx586Get(name,field)||((strong.textContent||'').trim());
  if(/^not recorded$/i.test(cur))cur='';
  var inp=document.createElement('input');
  inp.type='text';inp.value=cur;inp.className='cx586-edit-in';
  inp.placeholder=field==='industry'?'e.g. Construction':'e.g. Waukesha, WI';
  strong.replaceWith(inp);inp.focus();try{inp.setSelectionRange(cur.length,cur.length);}catch(e){}
  var done=false;
  function save(){
    if(done)return;done=true;
    var val=inp.value.trim();
    _cx586Set(name,field,val);
    var ns=document.createElement('strong');
    ns.textContent=val||'Not recorded';
    inp.replaceWith(ns);
    var chip=document.getElementById('cx586-saved');
    if(chip){chip.style.opacity='1';setTimeout(function(){chip.style.opacity='0';},1800);}
  }
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')save();if(e.key==='Escape'){done=true;var ns=document.createElement('strong');ns.textContent=cur||'Not recorded';inp.replaceWith(ns);}});
  inp.addEventListener('blur',save);
};
window._cx586Brief=function(name,facts,health){
  var esc=_cx586Esc;
  function pick(re){var f=(facts||[]).filter(function(x){return re.test(String(x.label||''));})[0];return f?String(f.value||'').trim():'';}
  var factDefs=[
    {label:'Customer number',val:pick(/customer number|customer id|account number/i)},
    {label:'Industry',val:_cx586Get(name,'industry')||pick(/industry/i),edit:'industry'},
    {label:'Customer level',val:pick(/level|tier/i)},
    {label:'Location',val:_cx586Get(name,'location')||pick(/location|city|address/i),edit:'location'},
    {label:'Owner',val:pick(/owner/i)},
    {label:'Assignment status',val:pick(/assignment/i)}
  ];
  var factHtml=factDefs.map(function(f){
    var v=f.val||'Not recorded';
    return '<div class="cux8-fact'+(f.edit?' cx586-editable':'')+'"><span>'+esc(f.label)
      +(f.edit?'<button class="cx586-pencil" title="Edit '+esc(f.label.toLowerCase())+'" onclick="_cx586Edit(this,\''+esc(name).replace(/'/g,"\\'")+'\',\''+f.edit+'\')">&#9998;</button>':'')
      +'</span><strong>'+esc(v)+'</strong></div>';
  }).join('');
  var v=_cx586Vitals(name);
  function money(n){return '$'+Math.round(Number(n)||0).toLocaleString();}
  function vrow(l,val,sub){return '<div class="cx586-vrow"><span class="cx586-vl">'+l+'</span><span class="cx586-vv">'+val+(sub?' <em>'+sub+'</em>':'')+'</span></div>';}
  var topHtml=v.top.length?('<div class="cx586-chips">'+v.top.map(function(t){return '<span class="cx586-chip">'+esc(t.p)+' <b>'+money(t.amt)+'</b></span>';}).join('')+'</div>'):'<div class="cx586-vempty">No line-item history loaded yet.</div>';
  var vitalsHtml=''
    +vrow('Last order',v.lastDate?(money(v.lastTotal)):'&mdash;',v.lastDate?esc(v.lastDate)+(v.daysLastOrder!=null?' \u00b7 '+v.daysLastOrder+'d ago':''):'none recorded')
    +vrow('Last contact',v.daysTouch!=null?(v.daysTouch+'d ago'):'&mdash;',v.daysTouch==null?'no logged activity':'')
    +vrow('Buying cadence',v.cad!=null?('~every '+v.cad+'d'):'&mdash;',v.cad!=null?(v.due?'<b class="cx586-due">reorder due</b>':'next expected in ~'+Math.max(0,v.cad-(v.daysLastOrder||0))+'d'):(v.orderCount<2?'needs 2+ orders':''))
    +vrow('Open follow-ups',String(v.openFu),v.openFu>0?'in Action Center':'')
    +'<div class="cx586-vl" style="margin-top:9px;">Top products</div>'+topHtml;
  var h=_cx586Health(v);
  return ''
    +'<div class="cx586-wrap">'
    +'<div class="cx586-tabs"><button class="cx586-tab on" data-t="facts" onclick="_cx586Tab(this)">Facts</button><button class="cx586-tab" data-t="vitals" onclick="_cx586Tab(this)">Vitals</button><span id="cx586-saved" class="cx586-saved">\u2713 saved</span></div>'
    +'<div class="cx586-pane on" data-pane="facts"><div class="cux8-facts">'+factHtml+'</div></div>'
    +'<div class="cx586-pane" data-pane="vitals">'+vitalsHtml+'</div>'
    +'<div class="cx586-health-line" style="border-color:'+h.col+'55;"><span class="cx586-dot" style="background:'+h.col+';"></span>'+esc(h.txt)+'</div>'
    +'</div>';
};

 function buildOverview(markup){
  var doc=parse(markup),name=currentName(doc),modal=outerModal(doc);
  var nextTitle=text(doc.querySelector('.cw4-card.hot .cw4-nba-title'))||'Review the account and set the next customer action';
  var nextCopy=text(doc.querySelector('.cw4-card.hot .cw4-nba-copy'))||'Use the connected customer history to decide the next useful step.';
  var facts=factsFrom(doc),health=healthFrom(doc);

  var productDoc=parse(baseFor('products'));
  var salesDoc=parse(baseFor('sales','command'));
  var relationshipDoc=parse(baseFor('relationships'));
  var filesDoc=parse(baseFor('files'));
  var eventDoc=parse(baseFor('sales','calendar'));
  var productCount=productDoc.querySelectorAll('.cw6-product-card').length;
  var orderCount=salesCount(salesDoc);
  var contactCount=relationshipDoc.querySelectorAll('.cw4-contact').length;
  var activityCount=groupCount(relationshipDoc,'Communication history','.cw4-record');
  var artworkCount=recordValue(filesDoc,'Artwork','Artwork and logo records')||groupCount(filesDoc,'Artwork library','.cw4-record');
  var eventCount=eventDoc.querySelectorAll('.cw7-event').length;

  var factHtml=facts.length?facts.map(function(f){return '<div class="cux8-fact"><span>'+esc(f.label)+'</span><strong>'+esc(f.value||'Not recorded')+'</strong></div>'}).join(''):'<div class="cux8-fact"><span>Account details</span><strong>Complete the customer profile</strong></div>';
  var healthHtml=health.length?health.map(function(h){return '<span>'+esc(h)+'</span>'}).join(''):'<span>Account health will populate from connected records</span>';
  var modules=''
   +tile('👕','Products','Purchase history, buying patterns, reorder timing, and product opportunities.',productCount,'products','#47D16C')
   +tile('📦','Orders','Open commitments, completed order history, financial detail, and customer deadlines.',orderCount,'orders','#FA873D')
   +tile('👥','Contacts','Primary contacts, decision makers, buying roles, and relationship coverage.',contactCount,'contacts','#9B6BFF')
   +tile('🕘','Activity Timeline','Calls, emails, meetings, notes, promises, and future follow-up dates.',activityCount,'activity','#00AFEF')
   +tile('🎨','Artwork','Logos, proofs, approvals, decoration files, and customer account documents.',artworkCount,'artwork','#B36CFF')
   +tile('📅','Events','Order dates, customer deadlines, quote decisions, tasks, and upcoming opportunities.',eventCount,'events','#4C9DFF');

  return '<div class="cux8-shell"><div class="cux8-stage '+(window._cux8Direction==='back'?'back':'')+'">'+hero(doc,name)
   +'<div class="cux8-overview"><aside class="cux8-brief"><div class="cux8-kicker">Relationship Brief</div><div class="cux8-brief-title">Account intelligence</div><div class="cux8-brief-copy">The essentials a rep should understand before starting the next customer conversation.</div>'
   +'<div class="cux8-next"><span>Next best action</span><strong>'+esc(nextTitle)+'</strong><p>'+esc(nextCopy)+'</p></div>'
   +_cx586Brief(name,facts,health)
   +'<div class="cux8-brief-foot"><button class="cux8-action primary" onclick="_cux8Action(\'task\')">Create Next Action</button><button class="cux8-action" onclick="_cux8Open(\'service\')">Service & Approvals</button></div></aside>'
   +'<main class="cux8-modules">'+modules+'</main></div></div></div>'+modal
 }
 function filterRelationships(content,mode){
  if(!content)return content;
  var allowed=mode==='activity'?['upcoming relationship work','communication history']:['relationship map','coverage and cadence'];
  var children=Array.prototype.slice.call(content.children),keep=true,seenFirst=false;
  children.forEach(function(child){
   if(child.classList&&child.classList.contains('cw4-section-head')){
    var title=text(child.querySelector('.cw4-section-title')).toLowerCase();
    if(!seenFirst){seenFirst=true;child.remove();keep=true;return}
    keep=allowed.some(function(a){return title.indexOf(a)>=0});
    if(!keep)child.remove();
   }else if(seenFirst&&!keep){child.remove()}
  });
  return content
 }
 function sectionMeta(section){
  var map={
   products:{title:'Products',icon:'👕',copy:'Purchase history, reorder intelligence, product detail, and new category opportunities.',color:'#47D16C'},
   orders:{title:'Orders',icon:'📦',copy:'Open commitments, completed history, customer dates, and connected sales records.',color:'#FA873D'},
   contacts:{title:'Contacts',icon:'👥',copy:'People, buying roles, decision authority, and relationship coverage.',color:'#9B6BFF'},
   activity:{title:'Activity Timeline',icon:'🕘',copy:'Customer conversations, notes, outcomes, promises, and future follow-ups.',color:'#00AFEF'},
   artwork:{title:'Artwork & Files',icon:'🎨',copy:'Logos, proofs, approvals, decoration records, and account documents.',color:'#B36CFF'},
   events:{title:'Customer Events',icon:'📅',copy:'Order dates, quote decisions, opportunity steps, tasks, and reorder reminders.',color:'#4C9DFF'},
   service:{title:'Service & Approvals',icon:'🛡',copy:'Customer issues, promises, approvals, quality records, and customer voice.',color:'#F56B7B'}
  };return map[section]||map.products
 }
 /* ===== CXP588: Product Catalog — category tiles, banner views, order cart ===== */
window._cxp588Esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
window._cxp588Status=function(st){
  var m={overdue:{l:'Overdue',c:'#FB7185'},due:{l:'Due',c:'#FA873D'},upcoming:{l:'Coming up',c:'#4C9DFF'},later:{l:'OK',c:'#47D16C'},insufficient:{l:'\u2014',c:'#74849D'}};
  return m[st]||m.insufficient;
};
window._cxp588Money=function(n){n=Number(n)||0;return n>=1000000?('$'+(n/1000000).toFixed(1).replace(/\.0$/,'')+'M'):('$'+Math.round(n).toLocaleString());};
window._cxp588Icon=function(cat){
  var c=String(cat||'').toLowerCase();
  if(/polo/.test(c))return '\ud83d\udc55';
  if(/outer|jacket|vest|hood/.test(c))return '\ud83e\udde5';
  if(/head|hat|cap|beanie/.test(c))return '\ud83e\udde2';
  if(/t-?shirt|tee/.test(c))return '\ud83d\udc55';
  if(/drink|tumbler|mug|bottle/.test(c))return '\ud83e\udd64';
  if(/bag|tote|pack/.test(c))return '\ud83c\udf92';
  if(/pant|short|bottom/.test(c))return '\ud83d\udc56';
  if(/safety|hi-?vis/.test(c))return '\ud83e\uddba';
  return '\ud83d\udce6';
};
window._cxp588Sel=window._cxp588Sel||{};
window._cxp588SelFor=window._cxp588SelFor||'';
window._cxp588Cat=window._cxp588Cat||null;
window._cxp588CatStats=function(rows){
  var byCat={};
  rows.forEach(function(r){
    var c=r.cat||'Other';
    var b=byCat[c]=byCat[c]||{cat:c,n:0,units:0,rev:0,due:0,top:null,lastISO:''};
    b.n++;b.units+=r.units;b.rev+=r.rev;
    if(r.status==='overdue'||r.status==='due')b.due++;
    if(!b.top||r.rev>b.top.rev)b.top=r;
    if(r.last>b.lastISO)b.lastISO=r.last;
  });
  return Object.keys(byCat).map(function(k){return byCat[k];}).sort(function(a,b){return b.rev-a.rev;});
};
window._cxp588Toggle=function(cb){
  var k=cb.dataset.key;
  if(cb.checked)_cxp588Sel[k]={key:k,name:cb.dataset.name,sku:cb.dataset.sku,rev:cb.dataset.rev,lastqty:cb.dataset.lastqty,cat:cb.dataset.cat};
  else delete _cxp588Sel[k];
  _cxp588Bar();
};
window._cxp588Remove=function(k){
  delete _cxp588Sel[k];
  var cb=document.querySelector('.cxp588-cb[data-key="'+(window.CSS&&CSS.escape?CSS.escape(k):k)+'"]');
  if(cb)cb.checked=false;
  _cxp588Bar();_cxp588CartList();
};
window._cxp588Bar=function(){
  var bar=document.getElementById('cxp588-bar');if(!bar)return;
  var n=Object.keys(_cxp588Sel).length;
  bar.style.display=n?'flex':'none';
  var b=document.getElementById('cxp588-bar-btn');
  if(b)b.textContent='View order ('+n+')';
};
window._cxp588Clear=function(){
  window._cxp588Sel={};
  document.querySelectorAll('.cxp588-cb').forEach(function(cb){cb.checked=false;});
  _cxp588Bar();_cxp588CartList();
};
window._cxp588CartOpen=function(){
  var ov=document.getElementById('cxp588-cart');
  if(!ov){
    ov=document.createElement('div');ov.id='cxp588-cart';
    ov.innerHTML='<div class="cxp588-cart-panel"><div class="cxp588-cart-head"><span>Order selection</span><button class="cxp588-cart-x" onclick="_cxp588CartClose()">\u2715</button></div><div id="cxp588-cart-list"></div><div class="cxp588-cart-foot"><button class="cux8-action" onclick="_cxp588Clear()">Clear all</button><button class="cux8-action orange" onclick="_cxp588CartClose();_cxp588Quote()">Generate order</button></div></div>';
    ov.addEventListener('click',function(e){if(e.target===ov)_cxp588CartClose();});
    document.body.appendChild(ov);
  }
  ov.style.display='flex';
  _cxp588CartList();
};
window._cxp588CartClose=function(){var ov=document.getElementById('cxp588-cart');if(ov)ov.style.display='none';};
window._cxp588CartList=function(){
  var host=document.getElementById('cxp588-cart-list');if(!host)return;
  var esc=_cxp588Esc,keys=Object.keys(_cxp588Sel);
  host.innerHTML=keys.length?keys.map(function(k){
    var it=_cxp588Sel[k];
    return '<div class="cxp588-cart-row"><span class="cxp588-cart-ic">'+_cxp588Icon(it.cat)+'</span><div class="cxp588-cart-main"><strong>'+esc(it.name)+'</strong><span>'+esc(it.sku||'')+(it.lastqty&&Number(it.lastqty)>0?' \u00b7 last qty '+it.lastqty:'')+'</span></div><span class="cxp588-cart-rev">'+_cxp588Money(it.rev)+'</span><button class="cxp588-cart-rm" onclick="_cxp588Remove(\''+esc(k)+'\')">\u2715</button></div>';
  }).join(''):'<div class="cxp588-cart-empty">Nothing selected yet \u2014 browse the catalog and check products to add them.</div>';
};
window._cxp588PrefillText=function(name,items){
  var lines=['Reorder quote \u2014 '+name,''];
  items.forEach(function(it,i){
    lines.push((i+1)+'. '+it.name+(it.sku?' ('+it.sku+')':'')+(it.lastqty&&Number(it.lastqty)>0?' \u2014 last qty '+it.lastqty:'')+(it.rev&&Number(it.rev)>0?' \u00b7 '+_cxp588Money(it.rev)+' lifetime':''));
  });
  return lines.join('\n');
};
window._cxp588Quote=function(singleKey){
  var name=(window._cxp588Data&&_cxp588Data.name)||window._cux8CurrentName||window._cw4CompanyName||'';
  var items;
  if(singleKey&&window._cxp588Data){items=_cxp588Data.rows.filter(function(r){return r.key===singleKey;}).map(function(r){return {name:r.name,sku:r.sku,rev:r.rev,lastqty:r.lastqty};});}
  else items=Object.keys(_cxp588Sel).map(function(k){return _cxp588Sel[k];});
  if(!items.length)return;
  var txt=_cxp588PrefillText(name,items);
  if(typeof window._cw4StartQuote==='function')window._cw4StartQuote(encodeURIComponent(name));
  var tries=0;
  (function fill(){
    tries++;
    var t=document.getElementById('dd3-f-title'),d=document.getElementById('dd3-f-description');
    if(t||d){
      if(t&&!t.value)t.value='Reorder \u2014 '+name;
      if(d&&!d.value)d.value=txt;
      var n2=document.getElementById('dd3-f-notes');
      if(n2&&!n2.value&&!d)n2.value=txt;
      return;
    }
    if(tries<20)setTimeout(fill,120);
  })();
};
window._cxp588Rects=function(){
  var m={};
  document.querySelectorAll('.cxp588-card').forEach(function(card){
    var cb=card.querySelector('.cxp588-cb');
    if(!cb)return;
    var r=card.getBoundingClientRect();
    m[cb.dataset.key]={x:r.left,y:r.top};
  });
  return m;
};
window._cxp588Flip=function(prev){
  if(!prev)return;
  requestAnimationFrame(function(){
    var moved=[];
    document.querySelectorAll('.cxp588-card').forEach(function(card){
      var cb=card.querySelector('.cxp588-cb');
      if(!cb||!prev[cb.dataset.key])return;
      var r=card.getBoundingClientRect();
      var dx=prev[cb.dataset.key].x-r.left,dy=prev[cb.dataset.key].y-r.top;
      if(Math.abs(dx)<2&&Math.abs(dy)<2)return;
      card.style.transition='none';
      card.style.transform='translate('+dx+'px,'+dy+'px)';
      moved.push(card);
    });
    if(!moved.length)return;
    requestAnimationFrame(function(){
      moved.forEach(function(card){
        card.classList.add('cxp588-flip');
        card.style.transform='';
      });
      setTimeout(function(){moved.forEach(function(card){card.classList.remove('cxp588-flip');card.style.transition='';});},400);
    });
  });
};
window._cxp588SyncMaster=function(){
  try{document.documentElement.classList.toggle('cxp588-master',!!document.querySelector('.cux8-shell.cxp588-detail-open'));}catch(e){}
};
window._cxp588OpenWrap=(function(){
  var orig=null;
  return function(){
    if(orig)return;
    orig=window._cw5OpenProduct;
    if(typeof orig!=='function')return;
    window._cw5OpenProduct=function(encoded){
      var prev=null;
      try{if(window.innerWidth>=1100&&document.querySelector('.cxp588-card'))prev=_cxp588Rects();}catch(e){}
      orig(encoded);
      try{_cxp588SyncMaster();}catch(e){}
      try{if(prev)_cxp588Flip(prev);}catch(e){}
    };
  };
})();
window._cxp588CloseWrap=(function(){
  var orig=null;
  return function(){
    if(orig)return;
    orig=window._cw4CloseModal;
    if(typeof orig!=='function')return;
    window._cw4CloseModal=function(){
      try{
        var shell=document.querySelector('.cux8-shell.cxp588-detail-open');
        var panel=shell?document.querySelector('.cw6-detail-modal'):null;
        if(panel&&window.innerWidth>=1100){
          panel.classList.add('cxp588-slide-out');
          var done=false;
          var fin=function(){
            if(done)return;done=true;
            var prev=null;
            try{prev=_cxp588Rects();}catch(e){}
            orig();
            try{_cxp588SyncMaster();}catch(e){}
            try{if(prev)_cxp588Flip(prev);}catch(e){}
          };
          panel.addEventListener('transitionend',fin,{once:true});
          setTimeout(fin,340);
          return;
        }
      }catch(e){}
      orig();
    };
  };
})();
window._cxp588Remeasure=function(){
  try{window.dispatchEvent(new Event('resize'));}catch(e){}
};
window._cxp588NavWrap=(function(){
  var done=false;
  return function(){
    if(done)return;done=true;
    ['_cux8Back','_cux8Open'].forEach(function(fn){
      var o=window[fn];
      if(typeof o!=='function')return;
      window[fn]=function(){
        var r=o.apply(this,arguments);
        try{setTimeout(_cxp588Remeasure,380);setTimeout(_cxp588Remeasure,950);}catch(e){}
        return r;
      };
    });
  };
})();
window.addEventListener('load',function(){setTimeout(function(){try{_cxp588CloseWrap();_cxp588OpenWrap();_cxp588NavWrap();}catch(e){}},1500);setInterval(function(){try{_cxp588SyncMaster();}catch(e){}},900);});
window._cxp588OpenCat=function(enc){window._cxp588Cat=decodeURIComponent(enc);_cxp588Redraw();};
window._cxp588Back=function(){window._cxp588Cat=null;_cxp588Redraw();};
window._cxp588Redraw=function(){
  var host=document.querySelector('#rp-overlay .cux8-content');
  if(host&&window._cxp588Data){host.innerHTML=_cxp588Render();_cxp588Bar();}
};
window._cxp588Filter=function(){
  var q=((document.getElementById('cxp588-q')||{}).value||'').toLowerCase().trim();
  var st=((document.getElementById('cxp588-st')||{}).value||'all');
  var shown=0,total=0;
  document.querySelectorAll('.cxp588-card').forEach(function(r){
    total++;
    var okQ=!q||(r.dataset.search||'').indexOf(q)>=0;
    var okS=st==='all'||r.dataset.status===st||(st==='duenow'&&(r.dataset.status==='overdue'||r.dataset.status==='due'));
    var on=okQ&&okS;
    r.style.display=on?'':'none';
    if(on)shown++;
  });
  var ct=document.getElementById('cxp588-count');
  if(ct)ct.textContent=shown+' of '+total;
  var emp=document.getElementById('cxp588-nomatch');
  if(emp)emp.style.display=(total>0&&shown===0)?'block':'none';
};
window._cxp588SortRows=function(){
  var sel=document.getElementById('cxp588-sort');if(!sel)return;
  var mode=sel.value;
  var list=document.querySelector('.cxp588-grid');if(!list)return;
  var rows=Array.prototype.slice.call(list.querySelectorAll('.cxp588-card'));
  var ord={overdue:0,due:1,upcoming:2,later:3,insufficient:4};
  rows.sort(function(a,b){
    if(mode==='revenue')return (Number(b.dataset.rev)||0)-(Number(a.dataset.rev)||0);
    if(mode==='units')return (Number(b.dataset.units)||0)-(Number(a.dataset.units)||0);
    if(mode==='recent')return String(b.dataset.last||'').localeCompare(String(a.dataset.last||''));
    return (ord[a.dataset.status]-ord[b.dataset.status])||((Number(b.dataset.rev)||0)-(Number(a.dataset.rev)||0));
  });
  rows.forEach(function(r){list.appendChild(r);});
};
window._cxp588FilterRow=function(nAll){
  return '<div class="cxp588-filter"><input id="cxp588-q" class="cxp588-in" placeholder="Search products, SKU\u2026" oninput="_cxp588Filter()">'
    +'<select id="cxp588-st" class="cxp588-in" style="max-width:165px;flex:none;" onchange="_cxp588Filter()"><option value="all">All reorder states</option><option value="duenow">Due now</option><option value="overdue">Overdue</option><option value="due">Due</option><option value="upcoming">Coming up</option><option value="later">OK</option><option value="insufficient">No forecast</option></select>'
    +'<select id="cxp588-sort" class="cxp588-in" style="max-width:145px;flex:none;" onchange="_cxp588SortRows()"><option value="priority">Sort: priority</option><option value="revenue">Sort: revenue</option><option value="units">Sort: units</option><option value="recent">Sort: recent</option></select>'
    +'<span id="cxp588-count" class="cxp588-count">'+nAll+' of '+nAll+'</span></div>';
};
window._cxp588Render=function(){
  var esc=_cxp588Esc,D=window._cxp588Data,name=D.name,rows=D.rows;
  var bar='<div id="cxp588-bar" class="cxp588-bar"><span class="cxp588-bar-note">Order in progress</span><button id="cxp588-bar-btn" class="cux8-action orange" onclick="_cxp588CartOpen()">View order</button></div>';
  if(window._cxp588Cat){
    var cat=window._cxp588Cat;
    var inCat=rows.filter(function(r){return (r.cat||'Other')===cat;});
    if(!inCat.length){window._cxp588Cat=null;}
    else{
      var units=0,rev=0,due=0,top=null,lastISO='';
      inCat.forEach(function(r){units+=r.units;rev+=r.rev;if(r.status==='overdue'||r.status==='due')due++;if(!top||r.rev>top.rev)top=r;if(r.last>lastISO)lastISO=r.last;});
      var banner='<div class="cxp588-banner"><button class="cxp588-backbtn" onclick="_cxp588Back()">\u2190 All categories</button>'
        +'<div class="cxp588-banner-word">'+esc(cat)+'</div>'
        +'<div class="cxp588-banner-stats">'
        +'<div><span>Total sales</span><strong>'+_cxp588Money(rev)+'</strong></div>'
        +'<div><span>Units</span><strong>'+Math.round(units).toLocaleString()+'</strong></div>'
        +'<div><span>Products</span><strong>'+inCat.length+'</strong></div>'
        +'<div><span>Top SKU</span><strong class="cxp588-topsku">'+esc(top.sku||top.name)+'</strong><em>'+_cxp588Money(top.rev)+'</em></div>'
        +'<div><span>Due now</span><strong'+(due?' style="color:#FA873D;"':'')+'>'+due+'</strong></div>'
        +(lastISO?'<div><span>Last order</span><strong>'+esc(lastISO)+'</strong></div>':'')
        +'</div></div>';
      var cards=inCat.slice().sort(function(a,b){var ord={overdue:0,due:1,upcoming:2,later:3,insufficient:4};return (ord[a.status]-ord[b.status])||(b.rev-a.rev);}).map(function(r){
        var st=_cxp588Status(r.status);
        var checked=_cxp588Sel[r.key]?' checked':'';
        var img=r.img?'<img src="'+esc(r.img)+'" alt="" loading="lazy">':'<span class="cxp588-card-emoji">'+_cxp588Icon(r.cat)+'</span>';
        var dAgo='';
        if(r.last){var dd=Math.floor((Date.now()-new Date(r.last+'T12:00:00'))/864e5);if(dd>=0)dAgo=' \u00b7 '+dd+'d ago';}
        return '<div class="cxp588-card" data-status="'+r.status+'" data-search="'+esc(r.search)+'" data-rev="'+r.rev+'" data-units="'+r.units+'" data-last="'+esc(r.last)+'">'
          +'<label class="cxp588-card-check"><input type="checkbox" class="cxp588-cb"'+checked+' data-key="'+esc(r.key)+'" data-name="'+esc(r.name)+'" data-sku="'+esc(r.sku)+'" data-rev="'+r.rev+'" data-lastqty="'+r.lastqty+'" data-cat="'+esc(r.cat)+'" onchange="_cxp588Toggle(this)"></label>'
          +'<span class="cxp588-card-pill" style="border-color:'+st.c+'66;color:'+st.c+';">'+st.l+'</span>'
          +'<button class="cxp588-card-img" onclick="_cw5OpenProduct(\''+esc(r.key)+'\')">'+img+'</button>'
          +'<button class="cxp588-card-name" onclick="_cw5OpenProduct(\''+esc(r.key)+'\')">'+esc(r.name)+'</button>'
          +'<div class="cxp588-card-sku">'+esc(r.sku||r.brand||'')+'</div>'
          +'<div class="cxp588-card-kpis"><div><span>Qty</span><strong>'+Math.round(r.units).toLocaleString()+'</strong></div><div><span>Sales</span><strong>'+_cxp588Money(r.rev)+'</strong></div><div><span>Last</span><strong>'+(r.last?esc(r.last):'\u2014')+'</strong></div></div>'
          +(dAgo?'<div class="cxp588-card-ago">last ordered'+dAgo+'</div>':'')
          +'<button class="cxp588-card-quote" onclick="_cxp588Quote(\''+esc(r.key)+'\')">Quote this</button>'
          +'</div>';
      }).join('');
      return banner+_cxp588FilterRow(inCat.length)
        +'<div class="cxp588-grid">'+cards+'</div>'
        +'<div id="cxp588-nomatch" class="cxp588-empty" style="display:none;">No products match \u2014 clear the search or pick another reorder state.</div>'
        +bar;
    }
  }
  // LANDING: stats + category tiles + opportunities
  var dueNow=rows.filter(function(r){return r.status==='overdue'||r.status==='due';}).length;
  var lifetime=rows.reduce(function(s,r){return s+r.rev;},0);
  var cats=_cxp588CatStats(rows);
  var topCat=cats[0];
  function stat(l,v,s2,col){return '<div class="cxp588-stat"><span>'+l+'</span><strong'+(col?' style="color:'+col+';"':'')+'>'+v+'</strong>'+(s2?'<em>'+s2+'</em>':'')+'</div>';}
  var stats='<div class="cxp588-stats">'
    +stat('Products purchased',String(rows.length),rows.length?'':'no line items loaded')
    +stat('Reorder due now',String(dueNow),dueNow?'overdue or due':'',dueNow?'#FA873D':null)
    +stat('Lifetime product $',_cxp588Money(lifetime),'')
    +stat('Top category',topCat?esc(topCat.cat):'\u2014',topCat?_cxp588Money(topCat.rev):'')
    +'</div>';
  var enc=encodeURIComponent(name);
  var btns='<div class="cxp588-actions">'
    +'<button class="cux8-action primary" onclick="_cw4OpenCenter(\'products\',\''+enc+'\')">Open Product Studio</button>'
    +'<button class="cux8-action" onclick="_cw4OpenCenter(\'orders\',\''+enc+'\')">Open Orders</button>'
    +'<button class="cux8-action" onclick="_cw4InlineEdit(\'buying\')">Edit buying profile</button>'
    +'</div>';
  var _pal=['#47D16C','#FA873D','#9B6BFF','#4C9DFF','#00AFEF','#FBBF24','#FB7185','#34D399'];
  var tiles=cats.length?('<div class="cxp588-cath">Catalog \u00b7 shop by category</div><div class="cxp588-cats">'+cats.map(function(b,bi){
    var col=_pal[bi%_pal.length];
    return '<button class="cxp588-cat" style="--c:'+col+';" onclick="_cxp588OpenCat(\''+encodeURIComponent(b.cat)+'\')">'
      +(b.due?'<span class="cxp588-cat-due">'+b.due+' due</span>':'')
      +'<span class="cxp588-cat-ic">'+_cxp588Icon(b.cat)+'</span>'
      +'<strong>'+esc(b.cat)+'</strong>'
      +'<span class="cxp588-cat-copy">'+(b.top?('Top: '+esc(b.top.sku||b.top.name)):'')+'</span>'
      +'<span class="cxp588-cat-meta"><b>'+b.n+'</b><i>product'+(b.n>1?'s':'')+' \u00b7 '+_cxp588Money(b.rev)+'</i><span class="cxp588-cat-arrow">\u2192</span></span>'
      +'</button>';
  }).join('')+'</div>')
  :('<div class="cxp588-empty"><strong>No purchase history loaded for '+esc(name)+' yet.</strong><br>The industry opportunities below are the starting points \u2014 each category shows what similar '+(function(){var iv=(window._cx586Get&&_cx586Get(name,'industry'))||'';return iv?esc(iv.toLowerCase())+' customers':'customers in their industry';})()+' typically buy.</div>');
  var opp=D.chips?('<div class="cxp588-opp-h">Opportunities \u00b7 what they don\u2019t buy yet</div><div class="cxp588-chips">'+D.chips+'</div>'):'';
  return stats+btns+tiles+opp+bar;
};
window._cxp588Body=function(content,name){
  try{
    var esc=_cxp588Esc;
    var cards=content?content.querySelectorAll('.cw6-product-card[data-p588name]'):[];
    var rowsData=[];
    Array.prototype.slice.call(cards).forEach(function(a){
      rowsData.push({
        key:a.getAttribute('data-p588key')||'',name:a.getAttribute('data-p588name')||'',sku:a.getAttribute('data-p588sku')||'',
        brand:a.getAttribute('data-p588brand')||'',cat:a.getAttribute('data-p588cat')||'',sub:a.getAttribute('data-p588sub')||'',
        status:a.getAttribute('data-status')||'insufficient',units:Number(a.getAttribute('data-p588units'))||0,
        rev:Number(a.getAttribute('data-p588rev'))||0,orders:Number(a.getAttribute('data-p588orders'))||0,
        lastqty:Number(a.getAttribute('data-p588lastqty'))||0,last:a.getAttribute('data-p588last')||'',
        gap:a.getAttribute('data-p588gap')||'',img:a.getAttribute('data-p588img')||'',dec:a.getAttribute('data-p588dec')||'',
        search:a.getAttribute('data-search')||''
      });
    });
    var chips='';
    try{
      var gcards=content?content.querySelectorAll('.cw6-growth'):[];
      chips=Array.prototype.slice.call(gcards).map(function(g){
        var cat=(g.querySelector('strong')||{}).textContent||'';
        var why=(g.querySelector('p')||{}).textContent||'';
        var btn=g.querySelector('button');
        var oc=btn?btn.getAttribute('onclick'):'';
        var covered=g.classList.contains('covered');
        return '<button class="cxp588-chip'+(covered?' covered':'')+'"'+(oc?' onclick="'+esc(oc)+'"':'')+' title="'+esc(why)+'">'
          +'<b>'+esc(cat)+'</b><span>'+(covered?esc(why):('No purchases in this category yet \u2014 '+esc(why).toLowerCase()))+'</span></button>';
      }).join('');
    }catch(e){}
    if(window._cxp588SelFor!==name){window._cxp588Sel={};window._cxp588SelFor=name;window._cxp588Cat=null;}
    window._cxp588Data={name:name,rows:rowsData,chips:chips};
    if(window._cxp588Cat&&!rowsData.some(function(r){return (r.cat||'Other')===window._cxp588Cat;}))window._cxp588Cat=null;
    setTimeout(_cxp588Bar,60);
    return _cxp588Render();
  }catch(e){console.warn('[cxp588]',e);return '';}
};

 function buildSection(markup,section){
  var doc=parse(markup),name=currentName(doc),modal=outerModal(doc),content=profileContent(doc),meta=sectionMeta(section);
  if(section==='contacts'||section==='activity')content=filterRelationships(content,section);
  else content=removeFirstSectionHead(content);
  var body=content?content.innerHTML:'<div class="cw4-empty"><strong>No section content is available</strong></div>';
  window._cux8CurrentName=name;
  if(section==='products'){
    var _ps=window._cw5ProductSearch,_pst=window._cw5ProductStatus;
    try{
      window._cxp588All=true;window._cw5ProductSearch='';window._cw5ProductStatus='all';
      var _doc2=parse(baseFor('products'));
      var _c2=profileContent(_doc2);_c2=removeFirstSectionHead(_c2);
      var _nb=_cxp588Body(_c2,name);
      if(_nb)body=_nb;
    }catch(_pe){console.warn('[cxp588 fallback]',_pe);}
    finally{window._cxp588All=false;window._cw5ProductSearch=_ps;window._cw5ProductStatus=_pst;}
  }
  var _dOpen=(section==='products'&&modal&&modal.indexOf('cw6-detail-modal')>=0)?' cxp588-detail-open':'';
  return '<div class="cux8-shell'+_dOpen+'"><div class="cux8-stage '+(window._cux8Direction==='back'?'back':'')+'">'
   +'<section class="cux8-section-head" style="--section:'+meta.color+'"><div class="cux8-section-id"><button class="cux8-back" title="Back to customer overview" onclick="_cux8Back()">←</button><div class="cux8-section-icon">'+meta.icon+'</div><div><div class="cux8-section-company">'+esc(name)+' · Customer Command Center</div><div class="cux8-section-title">'+esc(meta.title)+'</div><div class="cux8-section-copy">'+esc(meta.copy)+'</div></div></div><div class="cux8-section-actions"><button class="cux8-action primary" onclick="_cux8Action(\'call\')">☎ Call</button><button class="cux8-action" onclick="_cux8Action(\'activity\')">Log Activity</button><button class="cux8-action orange" onclick="_cux8Action(\'quote\')">Create Quote</button></div></section>'
   +'<div class="cux8-content">'+body+'</div></div></div>'+modal
 }
 function renderEnhanced(){
  var markup=BASE();
  if(!openAccount())return markup;
  var tab=currentTab(),section=window._cux8Section||'overview';
  if(tab==='overview'||section==='overview')return buildOverview(markup);
  if(tab==='products')section='products';
  else if(tab==='files')section='artwork';
  else if(tab==='service')section='service';
  else if(tab==='sales')section=(window._cw6SalesView==='calendar'?'events':'orders');
  else if(tab==='relationships'&&section!=='activity')section='contacts';
  window._cux8Section=section;
  return buildSection(markup,section)
 }

 window._cux8Open=function(section){
  window._cux8Direction='forward';window._cux8Section=section;
  var tab=section;
  if(section==='orders'){window._cw6SalesView='command';tab='sales'}
  else if(section==='events'){window._cw6SalesView='calendar';tab='sales'}
  else if(section==='contacts'||section==='activity')tab='relationships';
  else if(section==='artwork')tab='files';
  if(typeof window._cw4SetTab==='function')window._cw4SetTab(tab)
 };
 window._cux8Back=function(){window._cux8Direction='back';window._cux8Section='overview';if(typeof window._cw4SetTab==='function')window._cw4SetTab('overview')};
 window._cux8Action=function(action){
  var name=window._cux8CurrentName||window._cw4CompanyName||'';
  var encoded=encodeURIComponent(name);
  if(action==='call'&&typeof window._cw5Call==='function')return window._cw5Call(encoded);
  if(action==='email'&&typeof window._cw5Email==='function')return window._cw5Email(encoded);
  if(action==='quote'&&typeof window._cw4StartQuote==='function')return window._cw4StartQuote(encoded);
  if(action==='task'&&typeof window._cw4OpenModal==='function')return window._cw4OpenModal('task');
  if((action==='activity'||action==='note')&&typeof window._cw4OpenModal==='function'){
   window._cw4OpenModal('activity');
   if(action==='note')setTimeout(function(){var e=document.getElementById('cw4-f-type');if(e)e.value='Note'},40);
  }
 };

 window._rp2CustomersV2=renderEnhanced;
 window._rp2CompanyProfileV3=renderEnhanced;
 window.TCP_CUSTOMER_COMMAND_CENTER_V576={version:'v576',base:BASE,render:renderEnhanced};
})();
