
(function(){
  var STORE='tcp_sales_slides_ai_suggestions_v428';
  var originalInit=null, originalRender=null, originalGenerate=null;
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function money(v){return '$'+Math.round(Number(v||0)).toLocaleString();}
  function num(v){return Number(v||0)||0;}
  function qtrs(){return (typeof QTRS!=='undefined'&&QTRS&&QTRS.length)?QTRS:['Q1','Q2','Q3','Q4'];}
  function reps(){try{return (typeof activeReps==='function'?activeReps():(S.reps||[])).filter(function(r){return r&&r.name;});}catch(e){return (S&&S.reps)||[];}}
  function weekContext(){
    var y=parseInt((document.getElementById('smYear')||{}).value,10)||(typeof getYr==='function'?getYr():new Date().getFullYear());
    var q=(document.getElementById('smQuarter')||{}).value||(typeof getQ==='function'?getQ():'Q1');
    var wn=parseInt((document.getElementById('smWeek')||{}).value,10)||(typeof getWN==='function'?getWN():1);
    var list=[];qtrs().forEach(function(qq){try{list=list.concat(gwq(y,qq));}catch(e){}});
    var idx=list.findIndex(function(w){return Number(w.num)===Number(wn)&&(!q||w.key.indexOf('_'+q+'_')>-1);});
    if(idx<0)idx=list.findIndex(function(w){return Number(w.num)===Number(wn);});
    var selected=list[idx]||{num:wn,key:y+'_'+q+'_Wk_'+wn,label:'Wk '+wn,start:new Date(y,0,1),end:new Date(y,0,7)};
    var prev=list[idx-1]||selected;
    return {year:y,quarter:q,selected:selected,week:prev};
  }
  function inRange(dateStr,w){if(!dateStr||!w||!w.start||!w.end)return false;var d=new Date(String(dateStr).slice(0,10)+'T12:00:00');var s=new Date(w.start);s.setHours(0,0,0,0);var e=new Date(w.end);e.setHours(23,59,59,999);return d>=s&&d<=e;}
  function weekMetrics(){
    var ctx=weekContext(), w=ctx.week, rows=[], salesTotal=0,calls=0,orders=0;
    reps().forEach(function(r){var key=r.name+'|'+w.key;var d={};try{d=(typeof gd==='function'?gd(key):(S.data&&S.data[key])||{});}catch(e){d=(S.data&&S.data[key])||{};}var rev=num(d.revenue), ca=num(d.calls), ord=num(d.orders);if(rev||ca||ord)rows.push({name:r.name,revenue:rev,calls:ca,orders:ord});salesTotal+=rev;calls+=ca;orders+=ord;});
    rows.sort(function(a,b){return b.revenue-a.revenue;});
    var art=(S.artErrors||[]).filter(function(a){return a&&a.weekKey===w.key;});
    var cms=(S.cms||[]).filter(function(c){return c&&c.weekKey===w.key;});
    var repFaultCms=cms.filter(function(c){return String(c.fault||'').toLowerCase()==='rep';});
    var cmCost=repFaultCms.reduce(function(s,c){return s+num(c.amount);},0);
    var daily=(S.dailySales||[]).filter(function(d){return inRange(d.date,w);});
    var dailyTotal=daily.reduce(function(s,d){return s+num(d.dailySales||d.totalDay);},0);
    if(!salesTotal&&dailyTotal)salesTotal=dailyTotal;
    var bestDay=daily.slice().sort(function(a,b){return num(b.dailySales||b.totalDay)-num(a.dailySales||a.totalDay);})[0]||null;
    return {ctx:ctx,week:w,rows:rows,salesTotal:salesTotal,calls:calls,orders:orders,art:art,cms:cms,repFaultCms:repFaultCms,cmCost:cmCost,daily:daily,bestDay:bestDay};
  }
  function topIssue(list,field){var counts={};list.forEach(function(x){var k=String(x&&x[field]||'Other').replace(/_/g,' ');counts[k]=(counts[k]||0)+1;});var best=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];})[0]||'No repeat issue';return {name:best,count:counts[best]||0};}
  function seasonalCopy(w){var m=(w&&w.start)?w.start.getMonth():new Date().getMonth();
    if(m===0||m===1)return {focus:'Q1 Pipeline Reset',tip:'Use the start of the year to reactivate dormant accounts, confirm budget timing, and turn “checking in” calls into calendar-driven reorder conversations.'};
    if(m>=2&&m<=4)return {focus:'Spring Event Push',tip:'Lean into spring events, school programs, golf outings, team gear, and early summer planning. The team should lead with deadline protection and bundle suggestions.'};
    if(m>=5&&m<=7)return {focus:'Late Summer / Back-to-School Push',tip:'This is a strong window for reorder reminders, staff apparel, school-year planning, and event supplies. Reps should create urgency around production capacity and delivery dates.'};
    if(m>=8&&m<=10)return {focus:'Fall + Holiday Ordering',tip:'Push holiday gifts, employee appreciation, year-end client touches, and inventory planning. The key is getting customers committed before production timelines tighten.'};
    return {focus:'Year-End Closeout',tip:'Use year-end budgets, holiday deadlines, and “use it before you lose it” timing to create urgency. Ask for reorder decisions and lock in next-quarter follow-up dates.'};
  }
  function suggestionObjects(){var m=weekMetrics(), w=m.week, issue=topIssue(m.art,'type'), topRep=m.rows[0]||null, seas=seasonalCopy(w);var qualityTitle,qualityText;
    if(m.art.length||m.repFaultCms.length){
      var driver=m.art.length>=m.repFaultCms.length?'art / order-entry accuracy':'credit memo prevention';
      qualityTitle='Trend Watch — '+(m.art.length?issue.name.replace(/\b\w/g,function(c){return c.toUpperCase();}):'Credit Memo Prevention');
      qualityText='Talking points:\n• Last week logged '+m.art.length+' art error'+(m.art.length===1?'':'s')+' and '+m.repFaultCms.length+' rep-fault credit memo'+(m.repFaultCms.length===1?'':'s')+'.\n• The main quality theme is '+driver+'.\n• Keep the discussion focused on preventable handoff misses, not blame.\n\nManager takeaway:\nClean order entry and proof review protect revenue after the sale.\n\nTeam exercise:\nBefore submitting one custom order today, each rep checks logo, color, quantity, ship date, proof notes, and customer approval trail.';
    }else{
      qualityTitle='Quality Win — Keep the Clean Handoff';
      qualityText='Talking points:\n• No art errors or rep-fault credit memos were logged for the pull week.\n• The goal is to identify what worked and turn it into a repeatable habit.\n• Clean handoffs protect margin and reduce production drag.\n\nManager takeaway:\nRecognize quality behavior while the team is doing it right.\n\nTeam exercise:\nEach rep names one step they used last week to prevent order mistakes, then repeats it on today\'s first custom order.';
    }
    var trainingTitle=m.calls<Math.max(20,reps().length*8)?'Sales Training — Stronger Follow-Up Reasons':'Sales Training — Convert Momentum Into Repeatable Plays';
    var trainingText=m.calls<Math.max(20,reps().length*8)?
      'Talking points:\n• Activity appears light for the pull week, so follow-up quality matters.\n• Weak follow-ups sound like “just checking in.” Strong follow-ups give the customer a reason to act.\n• Tie every outreach to a past order, deadline, seasonal need, or open quote.\n\nManager takeaway:\nEvery follow-up should create a business reason to respond.\n\nTeam exercise:\nRewrite this: “Just checking in to see if you need anything.” Better: “You ordered event shirts around this time last year — do you want me to price a reorder before production fills up?”':
      'Talking points:\n• The team logged '+m.calls+' calls and '+m.orders+' orders for the pull week.\n• The strongest habits should be made visible so more reps can copy them.\n• Ask what worked: opener, product angle, objection response, or close.\n\nManager takeaway:\nCoach the behavior behind the number, not only the result.\n\nTeam exercise:\nOne top performer shares the exact opener or follow-up line that moved a customer forward last week.';
    var seasonTitle='Seasonal Talking Point — '+seas.focus;
    var seasonText='Talking points:\n• '+seas.tip+'\n• Use timing to create urgency instead of relying only on discounts.\n• Make the ask specific: reorder, quote approval, art proof, ship date, or next follow-up.\n\nManager takeaway:\nSeasonality gives reps a reason to call with purpose.\n\nTeam exercise:\nEach rep picks five accounts from the same period last year and sends a season-specific reorder or promo follow-up.';
    if(topRep&&topRep.revenue>0){trainingText+='\n\nCallout:\nTop sales example: '+topRep.name+' led the week at '+money(topRep.revenue)+'. Ask what created that win and make it repeatable.';}
    return [
      {type:'Error Trend / Quality',title:qualityTitle,text:qualityText,checked:true},
      {type:'Seasonal Talking Point',title:seasonTitle,text:seasonText,checked:true},
      {type:'Sales Training Tip',title:trainingTitle,text:trainingText,checked:true}
    ];}
  function saved(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(e){return {};}}
  function saveCards(){var data={cards:[]};document.querySelectorAll('#smAiGrid .sm-ai-card').forEach(function(card){var idx=card.getAttribute('data-idx');data.cards.push({idx:idx,checked:!!(card.querySelector('.sm-ai-check')||{}).checked,title:(card.querySelector('.sm-ai-card-title')||{}).value||'',text:(card.querySelector('.sm-ai-card-text')||{}).value||''});});try{localStorage.setItem(STORE,JSON.stringify(data));}catch(e){}}
  function ensurePanel(){var stack=document.querySelector('#pg-slides .sm-main-stack');if(!stack||document.getElementById('smAiPanel'))return;var panel=document.createElement('section');panel.className='sm-panel sm-ai-panel';panel.id='smAiPanel';panel.innerHTML='<div class="sm-panel-head"><div><div class="sm-kicker">AI suggested slides</div><div class="sm-title">Manager Suggested Slides</div><p class="sm-help">Rule-based suggestions from the previous week. Check the slides you want, edit the wording, and they will fill the custom slide slots when you generate.</p></div><span class="sm-pill purple">Optional</span></div><div class="sm-ai-note"><strong>How this works:</strong> checked cards become the back custom slides in the PPTX. Use the copy button when you want Chat/Claude to polish the language before the meeting.</div><div class="sm-ai-controls"><button class="sm-btn" type="button" onclick="smAiRefreshSuggestions()">Refresh suggestions</button><button class="sm-btn" type="button" onclick="smAiApplySuggestions()">Apply checked to custom slides</button><button class="sm-btn" type="button" onclick="smAiCopyPrompt()">Copy to Chat/Claude</button></div><div id="smAiGrid" class="sm-ai-grid"></div><div class="sm-ai-mini">Tip: leave a card unchecked if you do not want that topic in the deck. You can still manually type your own custom slides below.</div>';
    var panels=stack.querySelectorAll('.sm-panel');if(panels.length>1)stack.insertBefore(panel,panels[1]);else stack.appendChild(panel);}
  function renderCards(force){ensurePanel();var grid=document.getElementById('smAiGrid');if(!grid)return;if(grid.dataset.built&&!force)return;var base=suggestionObjects();var sv=saved();if(sv.cards&&sv.cards.length&&!force){sv.cards.forEach(function(c,i){if(base[i]){base[i].checked=c.checked;base[i].title=c.title||base[i].title;base[i].text=c.text||base[i].text;}});}grid.dataset.built='1';grid.innerHTML=base.map(function(c,i){return '<div class="sm-ai-card" data-idx="'+i+'"><div class="sm-ai-top"><div><div class="sm-ai-type">'+esc(c.type)+'</div><div class="sm-ai-title">Slide '+(i+1)+'</div></div><label class="sm-ai-include"><input class="sm-ai-check" type="checkbox" '+(c.checked?'checked':'')+' onchange="smAiSaveCards()"> Include</label></div><label>Title</label><input class="sm-ai-card-title" type="text" value="'+esc(c.title)+'" oninput="smAiSaveCards()"><label>Talking points / takeaway / exercise</label><textarea class="sm-ai-card-text" oninput="smAiSaveCards()">'+esc(c.text)+'</textarea></div>';}).join('');saveCards();}
  function includedCards(){var arr=[];document.querySelectorAll('#smAiGrid .sm-ai-card').forEach(function(card){var chk=card.querySelector('.sm-ai-check');if(!chk||!chk.checked)return;arr.push({title:(card.querySelector('.sm-ai-card-title')||{}).value||'',text:(card.querySelector('.sm-ai-card-text')||{}).value||''});});return arr.slice(0,3);}
  function applyCards(){ensurePanel();renderCards(false);var cards=includedCards();if(!cards.length)return false;for(var i=1;i<=3;i++){var c=cards[i-1]||{title:'',text:''};var t=document.getElementById('smCustomTitle'+i),x=document.getElementById('smCustomText'+i);if(t)t.value=c.title||'';if(x)x.value=c.text||'';}saveCards();if(typeof originalRender==='function')originalRender();return true;}
  function promptText(){var m=weekMetrics(), cards=includedCards(), lines=[];lines.push('Sales meeting slide polish request');lines.push('Meeting week selected: '+((m.ctx.selected&&m.ctx.selected.label)||''));lines.push('Data pull week: '+((m.week&&m.week.label)||''));lines.push('Sales: '+money(m.salesTotal)+' | Orders: '+m.orders+' | Calls: '+m.calls);lines.push('Art errors: '+m.art.length+' | Rep-fault credit memos: '+m.repFaultCms.length+' / '+money(m.cmCost));lines.push('Top reps: '+(m.rows.slice(0,3).map(function(r){return r.name+' '+money(r.revenue);}).join(', ')||'No positive rep sales found'));lines.push('');lines.push('Please polish these optional meeting slides for managers. Keep them concise, direct, and action-oriented. Include talking points, manager takeaway, and a short team exercise.');cards.forEach(function(c,i){lines.push('\nSlide '+(i+1)+': '+c.title);lines.push(c.text);});return lines.join('\n');}
  function copyPrompt(){var txt=promptText();if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){try{var st=document.getElementById('smStatus');if(st){st.textContent='Copied AI slide prompt for Chat/Claude.';st.style.color='#A7FFC0';}}catch(e){}});}else{prompt(txt);} }
  function install(){if(window.__smAiSuggestionsInstalled)return;window.__smAiSuggestionsInstalled=true;originalInit=window.initSlidesPage;originalRender=window.smRenderPreview;originalGenerate=window.smGeneratePptx;window.initSlidesPage=function(){if(typeof originalInit==='function')originalInit();ensurePanel();renderCards(false);};window.smRenderPreview=function(){if(typeof originalRender==='function')originalRender();ensurePanel();document.getElementById('smAiGrid')&&(document.getElementById('smAiGrid').dataset.built='');renderCards(true);};window.smGeneratePptx=function(){applyCards();if(typeof originalGenerate==='function')return originalGenerate();};window.smAiRefreshSuggestions=function(){try{localStorage.removeItem(STORE);}catch(e){}var g=document.getElementById('smAiGrid');if(g)g.dataset.built='';renderCards(true);};window.smAiApplySuggestions=function(){applyCards();var st=document.getElementById('smStatus');if(st){st.textContent='Applied checked suggested slides to the custom slide slots.';st.style.color='#A7FFC0';}};window.smAiCopyPrompt=copyPrompt;window.smAiSaveCards=saveCards;}
  install();
  document.addEventListener('DOMContentLoaded',function(){try{if(document.getElementById('pg-slides')&&document.getElementById('pg-slides').classList.contains('active')&&window.initSlidesPage)window.initSlidesPage();}catch(e){console.warn(e);}});
})();
