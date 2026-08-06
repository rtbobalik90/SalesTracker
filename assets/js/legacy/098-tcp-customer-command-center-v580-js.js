
(function(){
 'use strict';
 if(window.TCP_CUSTOMER_COMMAND_CENTER_V580)return;
 var CURRENT=window._rp2CustomersV2;
 var RAW=window.TCP_CUSTOMER_COMMAND_CENTER_V576&&window.TCP_CUSTOMER_COMMAND_CENTER_V576.base;
 if(typeof CURRENT!=='function')return;

 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
 function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
 function text(el){return el?clean(el.textContent):''}
 function parse(markup){var t=document.createElement('template');t.innerHTML=String(markup||'').trim();return t.content}
 function stringify(frag){var box=document.createElement('div');box.appendChild(frag.cloneNode(true));return box.innerHTML}
 function rawFor(tab,salesView){
  if(typeof RAW!=='function')return'';
  var oldTab=window._rp2CompanyProfileTab,oldSales=window._cw6SalesView;
  try{window._rp2CompanyProfileTab=tab;if(salesView)window._cw6SalesView=salesView;return RAW()}
  catch(e){console.warn('[v580 raw customer read]',e);return''}
  finally{window._rp2CompanyProfileTab=oldTab;window._cw6SalesView=oldSales}
 }
 function sectionRecords(markup,heading){
  var frag=parse(markup),heads=Array.prototype.slice.call(frag.querySelectorAll('.cw4-section-head'));
  var head=heads.filter(function(h){return text(h.querySelector('.cw4-section-title')).toLowerCase().indexOf(String(heading).toLowerCase())>=0})[0];
  if(!head)return[];
  var rows=[],node=head.nextElementSibling;
  while(node&&!node.classList.contains('cw4-section-head')){
   var cards=[];
   if(node.matches&&node.matches('.cw4-record'))cards.push(node);
   if(node.querySelectorAll)cards=cards.concat(Array.prototype.slice.call(node.querySelectorAll('.cw4-record')));
   cards.forEach(function(card){
    rows.push({source:text(card.querySelector('.cw4-record-source'))||'Activity',title:text(card.querySelector('.cw4-record-title'))||'Customer activity',date:text(card.querySelector('.cw4-record-value'))||'',copy:text(card.querySelector('.cw4-record-copy'))||''})
   });
   node=node.nextElementSibling;
  }
  return rows;
 }
 function productRows(){
  var frag=parse(rawFor('products'));
  return Array.prototype.slice.call(frag.querySelectorAll('.cw6-product-card')).map(function(card){
   return {name:text(card.querySelector('.cw6-product-name'))||'Purchased product',meta:text(card.querySelector('.cw6-product-meta')),status:text(card.querySelector('.cw4-pill'))}
  }).filter(function(x){return x.name}).slice(0,6)
 }
 function typeOf(row){
  var s=(row.source+' '+row.title+' '+row.copy).toLowerCase();
  if(/\b(email|e-mail)\b/.test(s))return'email';
  if(/\b(text|sms|message)\b/.test(s))return'text';
  if(/\b(call|phone|voicemail|dial)\b/.test(s))return'call';
  if(/\b(note|meeting|visit|conversation|activity)\b/.test(s))return'note';
  return'note';
 }
 function industryFrom(frag){
  try{var _n=text(frag.querySelector('.cux8-name'))||window._cw4CompanyName||'';var _o=window._cx586Get?_cx586Get(_n,'industry'):'';if(_o)return _o;}catch(e){}
  var facts=Array.prototype.slice.call(frag.querySelectorAll('.cux8-fact'));
  var hit=facts.filter(function(f){return /industry/i.test(text(f.querySelector('span')))})[0];
  return hit?text(hit.querySelector('strong')):''
 }
 function fallbackProducts(industry){
  var i=String(industry||'').toLowerCase(),rows;
  if(/construct|contract|landscap|trade|electric|plumb|hvac/.test(i))rows=['Hi-vis safety apparel','Durable workwear','Crew drinkware'];
  else if(/health|medical|clinic|dental/.test(i))rows=['Branded polos','Staff recognition items','Patient-facing giveaways'];
  else if(/manufactur|industrial|warehouse|logistic|transport/.test(i))rows=['Uniform programs','Safety recognition','New-hire kits'];
  else if(/school|education|college|university/.test(i))rows=['Staff apparel','Event merchandise','Student recognition'];
  else if(/hospitality|restaurant|hotel|bar/.test(i))rows=['Uniform apparel','Guest promotions','Event drinkware'];
  else rows=['Branded apparel','Employee recognition','Event and outreach items'];
  return rows.map(function(name){return{name:name,meta:'Recommended starting point',status:'Review'}})
 }
 function promotion(){
  try{
   var p=typeof window._call540PromotionSnapshot==='function'?window._call540PromotionSnapshot():null;
   if(p)return{title:clean(p.title||p.promotionTitle)||'Current monthly promotion',body:clean(p.body||p.promotionBody),offer:clean(p.offer||p.promotionOffer),cta:clean(p.cta||p.promotionCta)}
  }catch(e){}
  return{title:'No current promotion loaded',body:'A manager-configured monthly promotion will appear here when available.',offer:'',cta:''}
 }
 function buildPayload(frag){
  var rows=sectionRecords(rawFor('relationships'),'Communication history');
  var accountNotes=sectionRecords(rawFor('files'),'Account notes');
  accountNotes.forEach(function(r){r.source=r.source||'Account note'});
  var grouped={note:accountNotes.slice(),call:[],email:[],text:[]};
  rows.forEach(function(r){grouped[typeOf(r)].push(r)});
  var products=productRows(),industry=industryFrom(frag);
  if(!products.length)products=fallbackProducts(industry);
  return{name:text(frag.querySelector('.cux8-name'))||window._cw4CompanyName||'Customer',rows:rows,grouped:grouped,products:products,promo:promotion(),industry:industry}
 }
 function summaryText(p){
  if(!p.rows.length)return'No customer conversations are recorded yet. Add the first call, email, meeting, note, or text so the account brief can identify themes and commitments.';
  var counts=[];
  if(p.grouped.call.length)counts.push(p.grouped.call.length+' call'+(p.grouped.call.length===1?'':'s'));
  if(p.grouped.email.length)counts.push(p.grouped.email.length+' email'+(p.grouped.email.length===1?'':'s'));
  if(p.grouped.text.length)counts.push(p.grouped.text.length+' text'+(p.grouped.text.length===1?'':'s'));
  if(p.grouped.note.length)counts.push(p.grouped.note.length+' note'+(p.grouped.note.length===1?'':'s'));
  var latest=p.rows[0],themes=p.rows.slice(0,3).map(function(r){return r.title}).filter(Boolean).join('; ');
  return p.rows.length+' recorded conversation'+(p.rows.length===1?'':'s')+' across '+(counts.join(', ')||'the account timeline')+'. Most recent: '+latest.title+(latest.date?' ('+latest.date+')':'')+'.'+(themes?' Recent themes include '+themes+'.':'')
 }
 function summaryBody(p){
  var productHtml=p.products.slice(0,4).map(function(x){return'<span class="cux10-chip">'+esc(x.name)+'</span>'}).join('');
  var promo=p.promo,hasPromo=promo.title&&promo.title!=='No current promotion loaded';
  return '<div class="cux10-summary-grid">'
   +'<section class="cux10-summary-card"><div class="cux10-card-kick">AI conversation summary</div><div class="cux10-card-title">What the record says right now</div><div class="cux10-card-copy">'+esc(summaryText(p))+'</div><div class="cux10-disclaimer">Drafted from loaded account records. The rep should verify context before using it with the customer.</div></section>'
   +'<section class="cux10-summary-card"><div class="cux10-card-kick">Recommended products</div><div class="cux10-card-title">Best starting points for the next conversation</div><div class="cux10-list">'+productHtml+'</div><div class="cux10-disclaimer">'+(p.products.length?'Prior purchases are shown first; otherwise recommendations use the recorded industry.':'No product or industry evidence is loaded yet.')+'</div></section>'
   +'<section class="cux10-summary-card promo"><div class="cux10-card-kick">Current promotion · '+(hasPromo?'Review for fit':'Not configured')+'</div><div class="cux10-card-title">'+esc(promo.title)+'</div><div class="cux10-card-copy">'+esc(promo.body||'Use the customer’s current needs and timing to determine whether this promotion is relevant.')+'</div>'+(promo.offer?'<div class="cux10-promo-offer">'+esc(promo.offer)+'</div>':'')+(promo.cta?'<div class="cux10-disclaimer">Suggested close: '+esc(promo.cta)+'</div>':'')+'</section>'
   +'</div>'
 }
 function logBody(rows,label){
  if(!rows.length)return'<div class="cux10-empty"><div><strong>No '+esc(label.toLowerCase())+' recorded</strong>Use Add Note or Log Activity to begin building the customer communication history.</div></div>';
  return'<div class="cux10-log">'+rows.map(function(r){return'<article class="cux10-log-row"><div class="cux10-log-meta">'+esc(r.source)+'<br>'+esc(r.date||'Date not recorded')+'</div><div><div class="cux10-log-title">'+esc(r.title)+'</div>'+(r.copy?'<div class="cux10-log-copy">'+esc(r.copy)+'</div>':'')+'</div></article>'}).join('')+'</div>'
 }
 function bodyFor(tab,p){
  if(tab==='notes')return logBody(p.grouped.note,'Notes and meetings');
  if(tab==='calls')return logBody(p.grouped.call,'Calls');
  if(tab==='emails')return logBody(p.grouped.email,'Emails');
  if(tab==='texts')return logBody(p.grouped.text,'Texts');
  return summaryBody(p)
 }
 function tabButton(key,label,count,active){return'<button class="cux10-tab '+(active===key?'on':'')+'" data-cux10-tab="'+key+'" onclick="_cux10SetTab(\''+key+'\')">'+label+(typeof count==='number'?'<b>'+count+'</b>':'')+'</button>'}
 function panel(p){
  var tab=window._cux10NotesTab||'summary';
  return '<aside class="cux10-notes"><div class="cux10-head"><div><div class="cux10-kicker">Account memory</div><div class="cux10-title">Notes & communications</div><div class="cux10-copy">Conversation intelligence and channel-specific history for this customer.</div></div><button class="cux10-add" onclick="_cux8Action(\'note\')">＋ Add Note</button></div>'
   +'<div class="cux10-tabs">'+tabButton('summary','AI Summary',null,tab)+tabButton('notes','Notes',p.grouped.note.length,tab)+tabButton('calls','Calls',p.grouped.call.length,tab)+tabButton('emails','Emails',p.grouped.email.length,tab)+tabButton('texts','Texts',p.grouped.text.length,tab)+'</div>'
   +'<div class="cux10-body" id="cux10-notes-body">'+bodyFor(tab,p)+'</div></aside>'
 }
 function render(){
  var markup=CURRENT();
  if(String(markup).indexOf('cux8-overview')<0)return markup;
  var frag=parse(markup),overview=frag.querySelector('.cux8-overview');
  if(!overview||overview.querySelector('.cux10-notes'))return markup;
  var payload=buildPayload(frag);window._cux10NotePayload=payload;
  var t=document.createElement('template');t.innerHTML=panel(payload);overview.appendChild(t.content.firstElementChild);
  return stringify(frag)
 }
 window._cux10SetTab=function(tab){
  window._cux10NotesTab=tab;
  var p=window._cux10NotePayload,body=document.getElementById('cux10-notes-body');
  if(!p||!body)return;
  body.innerHTML=bodyFor(tab,p);body.scrollTop=0;
  Array.prototype.slice.call(document.querySelectorAll('[data-cux10-tab]')).forEach(function(btn){btn.classList.toggle('on',btn.getAttribute('data-cux10-tab')===tab)})
 };
 window._rp2CustomersV2=render;
 window._rp2CompanyProfileV3=render;
 window.TCP_CUSTOMER_COMMAND_CENTER_V580={version:'v580',base:'v579',render:render,focus:'three-column customer overview and communications desk'};
})();
