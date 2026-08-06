
(function(){
 'use strict';

 var CRM='tcp_rp_company_crm_v510';
 var UI_STORE='tcp_call_workspace_v540';
 var EMAIL_STORE='tcp_call_email_v540';
 var INTEGRATION_STORE='tcp_call_integrations_v540';

 window._call540Tab=window._call540Tab||'prep';
 window._call540PrepTab=window._call540PrepTab||'products';
 window._call540EmailOpen=window._call540EmailOpen||false;
 window._call540DialState=window._call540DialState||{
  status:'ready',attemptActivityId:'',number:'',startedAt:'',lastOutcome:''
 };

 function n(v){return Number(v)||0}
 function arr(v){
  if(Array.isArray(v))return v;
  if(!v)return[];
  try{
   if(typeof v.length==='number'&&typeof v!=='string')return Array.prototype.slice.call(v);
   if(typeof v==='object')return Object.keys(v).map(function(k){return v[k]}).filter(function(x){return x!=null})
  }catch(e){}
  return[]
 }
 function clean(v){return String(v==null?'':v).trim()}
 function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function esc(v){
  var s=String(v==null?'':v);
  return typeof _rp2Esc==='function'?_rp2Esc(s):s.replace(/[&<>"]/g,function(c){
   return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  })
 }
 function read(key,def){try{var x=JSON.parse(localStorage.getItem(key)||'null');return x==null?def:x}catch(e){return def}}
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
 function field(o,names,def){
  for(var i=0;i<names.length;i++){
   var value=o&&o[names[i]];
   if(value!=null&&String(value).trim()!=='')return value
  }
  return def==null?'':def
 }
 function dateObj(v){
  if(!v)return null;
  var d=new Date(String(v).length===10?String(v)+'T12:00:00':v);
  return isNaN(d.getTime())?null:d
 }
 function iso(v){var d=dateObj(v);return d?d.toISOString().slice(0,10):''}
 function fmt(v){var d=dateObj(v);return d?d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
 function money(v){return typeof _rp2$==='function'?_rp2$(n(v)):'$'+n(v).toLocaleString()}
 function makeId(prefix){return(prefix||'id')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
 function currentRep(){return window._rp2&&_rp2.rep||''}
 function companyName(){return clean(window._call532&&window._call532.company||'')}
 function desktop(){
  try{if(typeof window._rp2DesktopBuild==='function')return window._rp2DesktopBuild()}catch(e){}
  return{customers:{},calls:[],quotes:[],opps:[],business:{lanes:{overdue:[]}}}
 }
 function customerFromDesktop(g,company){
  return(g.customers||{})[norm(company)]||{
   name:company,profile:{},contacts:[],orders:[],activities:[],products:{},categories:{}
  }
 }
 function crm(){
  var s=read(CRM,null);
  if(!s||s.version!==1||!s.reps)s={version:1,reps:{}};
  s.reps[currentRep()]=s.reps[currentRep()]||{accounts:{}};
  return s
 }
 function account(company,create){
  var s=crm(),rep=s.reps[currentRep()],key=norm(company),a=rep.accounts[key];
  if(!a&&create){
   a={profile:{name:company,owner:currentRep(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},contacts:[],activities:[],opportunities:[],quotes:[],notes:[],files:[]};
   rep.accounts[key]=a
  }
  if(a){
   a.profile=a.profile||{name:company,owner:currentRep()};
   a.contacts=arr(a.contacts);a.activities=arr(a.activities);a.opportunities=arr(a.opportunities);
   a.quotes=arr(a.quotes);a.notes=arr(a.notes);a.files=arr(a.files)
  }
  return{s:s,rep:rep,key:key,data:a}
 }
 function saveAccount(bundle){
  if(!bundle||!bundle.data)return;
  bundle.data.profile.updatedAt=new Date().toISOString();
  localStorage.setItem(CRM,JSON.stringify(bundle.s));
  try{window._cw4DirectoryCache=null;window._cw4ProfileCache={}}catch(e){}
 }
 function addActivity(company,activity){
  var b=account(company,true);
  b.data.activities.push(activity);
  saveAccount(b);
  return activity
 }
 function selectedContact(company){
  var g=desktop(),c=customerFromDesktop(g,company),b=account(company,false);
  var contacts=arr(c.contacts).concat(b.data?arr(b.data.contacts):[]);
  var idv=clean((document.getElementById('cl1-contact')||{}).value||window._call532.draft&&window._call532.draft.contactId||'');
  return contacts.filter(function(contact){return String(field(contact,['id','contactId'],'')||'')===String(idv)})[0]||
   c.primary||contacts[0]||null
 }
 function dedupe(list,keyFn){
  var seen={},out=[];
  arr(list).forEach(function(item){
   var key=norm(keyFn(item));
   if(!key||seen[key])return;
   seen[key]=1;out.push(item)
  });
  return out
 }
 function hash(value){
  var s=String(value==null?'':value),h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return(h>>>0).toString(36)
 }
 function inferType(name){
  name=norm(name);
  if(/cap|hat|beanie|headwear/.test(name))return'Headwear';
  if(/hood|sweat/.test(name))return'Sweatshirts';
  if(/jacket|coat|vest|outerwear/.test(name))return'Outerwear';
  if(/polo/.test(name))return'Polos';
  if(/tee|t shirt|shirt/.test(name))return'T-Shirts';
  if(/hi vis|safety/.test(name))return'Safety';
  if(/pant|short/.test(name))return'Bottoms';
  if(/mug|tumbler|bottle|drink/.test(name))return'Drinkware';
  if(/bag|tote|backpack/.test(name))return'Bags';
  return'Other'
 }
 function inferBrand(name){
  var known=['Carhartt','Nike','Adidas','Richardson','Gildan','Port Authority','Bella + Canvas','Bella Canvas','The North Face','Columbia','Under Armour','TravisMathew','YETI','Comfort Colors'];
  for(var i=0;i<known.length;i++)if(norm(name).indexOf(norm(known[i]))>=0)return known[i];
  return'Not recorded'
 }
 function lineItems(company,c){
  var Sx=window.S||{},rows=arr(Sx.orderLineItems),target=norm(company),rep=currentRep();
  var profile=c&&c.profile||{},customerId=clean(field(profile,['customerNumber','custId','customerId','accountId'],'')||field(c||{},['customerNumber','custId','customerId','accountId'],''));
  if(!customerId){
   var imported=arr(Sx.customers).filter(function(customer){
    var name=field(customer,['name','customer','company'],'');
    var owner=field(customer,['rep','salesRep','owner'],'');
    return norm(name)===target&&(!owner||!rep||norm(owner)===norm(rep))
   })[0];
   if(imported)customerId=clean(field(imported,['customerNumber','custId','customerId','accountId'],'')||'')
  }
  function idKey(value){return clean(value).replace(/\.0$/,'').replace(/^0+(?=\d)/,'')}
  var wantedId=idKey(customerId);
  return rows.filter(function(row){
   if(!row)return false;
   var rowRep=clean(field(row,['rep','salesRep','owner'],'')||'');
   if(rowRep&&rep&&norm(rowRep)!==norm(rep))return false;
   var rowId=idKey(field(row,['accountId','customerNumber','custId','customerId'],''));
   if(wantedId&&rowId&&rowId===wantedId)return true;
   var companyValue=field(row,['company','companyName','customer','customerName','accountName','AccountName','shipToName','billToName'],'');
   return norm(companyValue)===target
  })
 }
 function ordersFor(company,c){
  var Sx=window.S||{},rows=[];
  arr(c.orders).forEach(function(order){rows.push(order)});
  arr(Sx.orders).forEach(function(order){
   var name=field(order,['company','companyName','customer','customerName','accountName'],'');
   if(norm(name)===norm(company))rows.push(order)
  });
  return dedupe(rows,function(order){
   return field(order,['orderNum','orderNumber','so','salesOrder','invoiceNumber','id'],'')+'|'+field(order,['orderDate','date','placedAt','createdAt'],'')
  }).map(function(order,index){
   var orderNumber=field(order,['orderNum','orderNumber','so','salesOrder','number'],'Order '+(index+1));
   return{
    id:'order_'+hash(orderNumber+'|'+field(order,['invoiceNumber','invoice'],'')+'|'+index),
    raw:order,
    orderNumber:String(orderNumber),
    invoice:String(field(order,['invoiceNumber','invoice'],'')||''),
    date:field(order,['orderDate','date','placedAt','createdAt','invoiceDate'],''),
    total:n(field(order,['total','amount','netRevenue','revenue','sales'],0)),
    units:n(field(order,['units','quantity','qty'],0)),
    status:String(field(order,['status','orderStatus','kind'],'Completed')),
    products:arr(field(order,['products','items','lineItems'],[]))
   }
  }).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))})
 }
 function productsFor(company,c){
  var rows=lineItems(company,c),map={};
  function addProduct(row,sourceOrder){
   if(!row)return;
   var lineClass=clean(field(row,['lineClass','class'],'')||'').toLowerCase();
   if(lineClass&&lineClass!=='product')return;
   var name=clean(field(row,['productName','product','itemDescription','productDescription','description','styleDescription','itemName','name','sku','style'],''));
   if(!name||/setup|set-up|shipping|freight|discount|tax|screen charge|embroidery charge|digitiz|run charge|art charge/i.test(name))return;
   var style=clean(field(row,['style','styleNumber','sku','itemNumber','productCode'],''));
   var brand=clean(field(row,['brand','manufacturer','vendor','productBrand'],'')||inferBrand(name));
   var type=clean(field(row,['productType','productCategory','category','categoryName','itemCategory'],'')||inferType(name));
   var decoration=clean(field(row,['decorationMethod','decorationType','decoration','imprintMethod','logoMethod','method'],'')||'Not recorded');
   var key=norm(name+'|'+style+'|'+brand+'|'+decoration);
   if(!map[key])map[key]={
    id:'product_'+hash(key),name:name,style:style,brand:brand,type:type,decoration:decoration,
    units:0,revenue:0,lastDate:'',orders:{}
   };
   map[key].units+=n(field(row,['quantityOrdered','quantity','qty','units'],0));
   map[key].revenue+=n(field(row,['extendedSalesRevenue','netRevenue','revenue','amount','total'],0));
   var date=field(row,['orderDate','invoiceDate','date','createdAt'],'');
   if(String(date)>String(map[key].lastDate))map[key].lastDate=date;
   var orderNo=sourceOrder||field(row,['orderNumber','orderNum','so','salesOrder','invoiceNumber'],'');
   if(orderNo)map[key].orders[String(orderNo)]=1
  }
  rows.forEach(function(row){addProduct(row,'')});
  if(!Object.keys(map).length){
   var target=norm(company),profile=c&&c.profile||{},customerId=clean(field(profile,['customerNumber','custId','customerId','accountId'],'')||field(c||{},['customerNumber','custId','customerId','accountId'],''));
   arr(window.S&&S.orders).forEach(function(order){
    if(!order)return;
    var orderCompany=field(order,['customer','company','companyName','customerName','accountName'],'');
    var orderId=clean(field(order,['accountId','customerNumber','custId','customerId'],'')||'');
    if(norm(orderCompany)!==target&&!(customerId&&orderId&&String(customerId)===String(orderId)))return;
    var orderNo=field(order,['orderNum','orderNumber','so','salesOrder','invoiceNumber','number'],'');
    arr(field(order,['topProducts','products','items','lineItems'],[])).forEach(function(item){addProduct(item,orderNo)})
   })
  }
  var result=Object.keys(map).map(function(key){
   var p=map[key];p.orderCount=Object.keys(p.orders).length;return p
  }).sort(function(a,b){return b.units-a.units||String(b.lastDate||'').localeCompare(String(a.lastDate||''))||a.name.localeCompare(b.name)});
  if(!result.length){
   Object.keys(c.products||{}).forEach(function(name){
    result.push({
     id:'product_'+hash(name),name:name,style:'',brand:inferBrand(name),type:inferType(name),
     decoration:'Not recorded',units:n(c.products[name]),revenue:0,lastDate:'',orderCount:0
    })
   })
  }
  return result
 }
 function documentsFor(company,c){
  var Sx=window.S||{},b=account(company,false),rows=[];
  if(b.data)rows=rows.concat(arr(b.data.files));
  rows=rows.concat(arr(c.documents),arr(c.files),arr(c.artwork),arr(Sx.documents));
  return rows.filter(function(doc){
   var companyValue=field(doc,['company','companyName','customer','customerName','accountName'],'');
   if(companyValue&&norm(companyValue)!==norm(company))return false;
   var type=[field(doc,['type','documentType','category'],''),
    field(doc,['title','name','fileName'],''),
    field(doc,['coid','artId','artworkId'],''),
    field(doc,['decorationMethod','decoration'],'')].join(' ');
   return /art|logo|proof|coid|embroid|screen|decoration|brand standard/i.test(type)
  })
 }
 function artworkFor(company,c){
  return dedupe(documentsFor(company,c),function(doc){
   return field(doc,['id','documentId','coid','artId','artworkId','fileName','name','title'],'')
  }).map(function(doc,index){
   var title=clean(field(doc,['title','name','fileName','logoName'],'Artwork '+(index+1)));
   var decoration=clean(field(doc,['decorationMethod','decoration','method','imprintMethod'],'Not recorded'));
   return{
    id:'art_'+hash(field(doc,['id','documentId'],'')+'|'+title+'|'+index),
    raw:doc,title:title,
    image:field(doc,['dataUrl','imageData','thumbnail','thumbnailUrl','previewUrl','url'],''),
    logoSize:clean(field(doc,['logoSize','size','dimensions','artSize'],'Not recorded')),
    coid:clean(field(doc,['coid','artId','artworkId','colorOptionId'],'Not recorded')),
    decoration:decoration,
    colors:clean(field(doc,['colorCount','colors','numberOfColors','screenPrintColors'],'Not recorded')),
    stitches:clean(field(doc,['stitchCount','stitches','embroideryStitches'],'Not recorded')),
    status:clean(field(doc,['approvalStatus','status'],'Active'))
   }
  })
 }
 function importantDatesFor(company,c,orders){
  var rows=[],profile=c.profile||{},b=account(company,false);
  if(b.data)profile=Object.assign({},profile,b.data.profile||{});
  function add(title,date,type,detail){
   title=clean(title);if(!title)return;
   rows.push({id:'date_'+hash(title+'|'+date+'|'+rows.length),title:title,date:date||'',type:type||'Customer milestone',detail:detail||''})
  }
  ['importantDates','companyEvents','events','annualPrograms','milestones','reorderPeriods'].forEach(function(key){
   arr(profile[key]).forEach(function(item){
    if(typeof item==='string')add(item,'',key,'');
    else add(field(item,['title','name','event','program'],'Customer date'),field(item,['date','startDate','dueDate','month'],''),
     field(item,['type','category'],key),field(item,['detail','description','notes'],''))
   })
  });
  [
   ['Company anniversary',field(profile,['anniversaryDate','companyAnniversary'],'')],
   ['Contract renewal',field(profile,['renewalDate','contractRenewal'],'')],
   ['Fiscal year end',field(profile,['fiscalYearEnd'],'')],
   ['Customer appreciation event',field(profile,['customerEventDate'],'')]
  ].forEach(function(pair){if(pair[1])add(pair[0],pair[1],'Company milestone','Recorded on the company profile.')});

  var months=new Array(12).fill(0);
  orders.forEach(function(order){var d=dateObj(order.date);if(d)months[d.getMonth()]++});
  var peak=months.map(function(count,index){return{count:count,index:index}}).sort(function(a,b){return b.count-a.count})[0];
  if(peak&&peak.count){
   var monthName=new Date(2026,peak.index,1).toLocaleDateString('en-US',{month:'long'});
   add('Expected reorder period · '+monthName,'','Seasonal order pattern',peak.count+' loaded order'+(peak.count===1?'':'s')+' historically placed in '+monthName+'.')
  }
  return dedupe(rows,function(row){return row.title+'|'+row.date})
 }
 function selectionStore(){
  var store=read(UI_STORE,{version:1,reps:{}});
  store.reps=store.reps||{};
  store.reps[currentRep()]=store.reps[currentRep()]||{companies:{}};
  return store
 }
 function companyUi(company){
  var store=selectionStore(),rep=store.reps[currentRep()];
  rep.companies[norm(company)]=rep.companies[norm(company)]||{
   products:[],artwork:[],orders:[],dates:[],talkingPoints:[],
   productType:'All',productBrand:'All',productDecoration:'All',productSort:'units',productLimit:'10',
   artDecoration:'All',artSort:'name'
  };
  var data=rep.companies[norm(company)];
  if(data.productLimit==null||data.productLimit==='')data.productLimit='10';
  if(!data.productSort)data.productSort='units';
  return{store:store,data:data}
 }
 function saveCompanyUi(company,data){
  var store=selectionStore();
  store.reps[currentRep()].companies[norm(company)]=data;
  write(UI_STORE,store)
 }
 function selectedIds(kind){return arr(companyUi(companyName()).data[kind])}
 function isSelected(kind,id){return selectedIds(kind).indexOf(id)>=0}
 function toggleSelection(kind,id){
  var company=companyName(),bundle=companyUi(company),list=arr(bundle.data[kind]),index=list.indexOf(id);
  if(index>=0)list.splice(index,1);else list.push(id);
  bundle.data[kind]=list;saveCompanyUi(company,bundle.data)
 }
 function monthlyDefaults(month){
  var rows=[
   ['New-Year Uniform Reset','Refresh employee uniforms, onboarding kits, and core branded apparel before first-quarter hiring.','Program refresh and inventory review'],
   ['Spring Event Readiness','Plan spring trade shows, crews, recruiting events, and customer appreciation apparel.','Event apparel and promotional planning'],
   ['Spring Workwear Upgrade','Prepare crews for changing weather with layered workwear, caps, and safety apparel.','Layering and workwear review'],
   ['Summer Program Planning','Lock in summer uniforms, event apparel, and outdoor promotional products before peak season.','Early summer program planning'],
   ['Employee Appreciation','Build employee appreciation, company picnic, and warm-weather uniform programs.','Apparel and branded giveaway ideas'],
   ['Heat & Hydration','Review breathable workwear, caps, safety options, and branded drinkware for summer teams.','Summer workwear and hydration'],
   ['Midyear Reorder Review','Use first-half order history to identify uniform, headwear, and program replenishment needs.','Reorder and program review'],
   ['Fall Crew Readiness','Prepare fall layers, outerwear, recruiting apparel, and updated employee gear.','Fall apparel planning'],
   ['Holiday Planning Window','Start holiday gifts, customer appreciation, and year-end employee programs before production fills.','Holiday program planning'],
   ['Cold-Weather Workwear','Review jackets, hoodies, beanies, safety layers, and winter uniform needs.','Cold-weather apparel'],
   ['Year-End Recognition','Finalize employee recognition, customer gifts, awards, and holiday apparel.','Recognition and gift programs'],
   ['Next-Year Program Setup','Plan next year’s uniform, onboarding, safety, and promotional calendar while current needs are fresh.','Annual program planning']
  ];
  var row=rows[month]||rows[0];
  return{title:row[0],body:row[1],offer:row[2],cta:'Would it help if I put together a focused recommendation or reorder review?'}
 }
 function integrationSettings(){
  var s=read(INTEGRATION_STORE,null)||{};
  var defaults=monthlyDefaults(new Date().getMonth());
  return{
   phoneProvider:s.phoneProvider||'Not connected',
   emailProvider:s.emailProvider||'Local activity-only composer',
   promotionTitle:s.promotionTitle||defaults.title,
   promotionBody:s.promotionBody||defaults.body,
   promotionOffer:s.promotionOffer||defaults.offer,
   promotionCta:s.promotionCta||defaults.cta
  }
 }
 function promotion(){return integrationSettings()}
 function currentData(){
  var company=companyName(),g=desktop(),c=customerFromDesktop(g,company);
  var orders=ordersFor(company,c);
  return{
   company:company,g:g,c:c,orders:orders,
   products:productsFor(company,c),
   artwork:artworkFor(company,c),
   dates:importantDatesFor(company,c,orders),
   account:account(company,false)
  }
 }
 function selectionSnapshot(){
  var data=currentData(),ui=companyUi(data.company).data;
  function rows(list,ids){return list.filter(function(item){return ids.indexOf(item.id)>=0})}
  return{
   products:rows(data.products,arr(ui.products)),
   artwork:rows(data.artwork,arr(ui.artwork)),
   orders:rows(data.orders,arr(ui.orders)),
   dates:rows(data.dates,arr(ui.dates))
  }
 }
 function selectedProductText(){
  return selectionSnapshot().products.map(function(item){return item.name}).join(', ')
 }
 function talkingPoints(){
  return arr(companyUi(companyName()).data.talkingPoints)
 }
 function generateTalkingPoints(){
  var data=currentData(),selected=selectionSnapshot(),promo=promotion(),points=[];
  selected.products.slice(0,4).forEach(function(p){
   points.push('Reconnect '+p.name+(p.style?' ('+p.style+')':'')+' to '+promo.offer.toLowerCase()+'. They purchased '+Math.round(p.units).toLocaleString()+' units in the loaded history'+(p.lastDate?' and last bought it '+fmt(p.lastDate):'')+'.')
  });
  selected.artwork.slice(0,3).forEach(function(a){
   points.push('Use the existing '+a.decoration+' artwork'+(a.coid!=='Not recorded'?' (COID '+a.coid+')':'')+' to reduce setup friction while discussing '+promo.title+'. Confirm whether the logo, size, and decoration are still approved.')
  });
  selected.orders.slice(0,3).forEach(function(o){
   var d=dateObj(o.date),month=d?d.toLocaleDateString('en-US',{month:'long'}):'the prior buying period';
   points.push('Reference order '+o.orderNumber+' from '+month+' and ask what changed in headcount, quantities, products, or timing before preparing a reorder recommendation.')
  });
  selected.dates.slice(0,3).forEach(function(event){
   points.push('Plan backward from '+event.title+(event.date?' on '+fmt(event.date):'')+'. Connect the timeline to '+promo.offer.toLowerCase()+' and confirm the customer’s real in-hands date.')
  });
  if(!points.length){
   var top=data.products[0],last=data.orders[0];
   if(top)points.push('Lead with their highest-volume product, '+top.name+', and ask whether another team, season, or replenishment cycle is approaching.');
   if(last)points.push('Use order '+last.orderNumber+' as the account-history anchor and verify whether the same products, artwork, quantities, and timing still apply.');
   points.push('Introduce this month’s '+promo.title+' focus: '+promo.body)
  }
  points.push(promo.cta);
  var bundle=companyUi(data.company);bundle.data.talkingPoints=points;saveCompanyUi(data.company,bundle.data);
  return points
 }
 function queueItem(g,company){
  return arr(g.calls).filter(function(item){return norm(item.customer)===norm(company)})[0]||null
 }
 function industryTags(data){
  var tags=[];
  if(data.account.data)tags=arr(data.account.data.profile.industryTags);
  if(!tags.length)tags=arr(data.c.profile&&data.c.profile.industryTags);
  var single=field(data.account.data&&data.account.data.profile||data.c.profile||{},['industry','companyIndustry'],'');
  if(single)tags.push(single);
  return dedupe(tags,function(x){return String(x)})
 }
 function primaryContact(data){
  var contacts=arr(data.c.contacts).concat(data.account.data?arr(data.account.data.contacts):[]);
  return data.c.primary||contacts[0]||null
 }
 function contacts(data){
  return dedupe(arr(data.c.contacts).concat(data.account.data?arr(data.account.data.contacts):[]),function(c){
   return field(c,['id','contactId','email','name'],'')
  })
 }
 function stageTitle(){
  return window._call540Tab==='conversation'?'Conduct the conversation':
   window._call540Tab==='complete'?'Complete and commit':'Prepare for Call'
 }
 function queueHtml(data){
  var g=data.g;
  if(!arr(g.calls).length)return'<div class="cl2-empty"><strong>No ranked calls</strong>Open a company directly or create a dated customer action.</div>';
  return arr(g.calls).map(function(item){
   return'<article class="cl2-qcard '+(norm(item.customer)===norm(data.company)?'on':'')+'" onclick="_call540SelectCompany(\''+encodeURIComponent(item.customer)+'\')">'+
    '<div class="cl2-qtop"><div class="cl2-qname">'+esc(item.customer)+'</div><div class="cl2-qrank">#'+esc(item.rank||'—')+'</div></div>'+
    '<div class="cl2-qreason"><strong>'+esc(item.reason||'Customer call')+'</strong><br>'+esc(item.copy||'')+'</div>'+
    '<div class="cl2-qmeta">'+esc(item.contact||'Primary contact not recorded')+' · '+esc(item.source||'Call queue')+'</div>'+
   '</article>'
  }).join('')
 }
 function contactOptions(data,selected){
  return contacts(data).map(function(contact){
   var idv=String(field(contact,['id','contactId'],'')||'');
   var label=[field(contact,['name'],'Contact'),field(contact,['title','buyingRole'],''),field(contact,['phone','mobile'],'')].filter(Boolean).join(' · ');
   return'<option value="'+esc(idv)+'" '+(String(selected||'')===idv?'selected':'')+'>'+esc(label)+'</option>'
  }).join('')
 }
 function dialerHtml(data){
  var d=window._call532.draft||{},contact=selectedContact(data.company)||primaryContact(data);
  var selected=d.contactId||field(contact,['id','contactId'],'');
  var phone=window._call540DialState.number||field(contact||{},['phone','mobile','phoneNumber'],'')||field(data.c.profile||{},['phone'],'');
  var status=window._call540DialState.status||'ready';
  return'<aside class="cl2-panel cl2-dialer"><div class="cl2-panel-head"><div><div class="cl2-kick">EMBEDDED CUSTOMER DIALER</div><div class="cl2-panel-title">Call from the workspace</div><div class="cl2-panel-copy">Local call simulation is active until a provider is connected in Admin.</div></div></div>'+
   '<div class="cl2-body"><div class="cl2-dialer-display"><div class="cl2-dialer-status"><i class="cl2-live-dot '+esc(status)+'"></i>'+esc(status==='connected'?'Connected':status==='dialing'?'Dialing':'Ready')+'</div>'+
    '<input id="call540-phone" class="cl2-phone-number" value="'+esc(phone)+'" placeholder="Enter phone number" oninput="_call540PhoneChanged()">'+
    '<div id="call540-dial-timer" class="cl2-dialer-timer">'+duration540(callSeconds())+'</div></div>'+
   '<div class="cl2-dialer-contact"><label>Contact</label><select id="cl1-contact" onchange="_call540ContactChanged()"><option value="">No specific contact</option>'+contactOptions(data,selected)+'</select>'+
    '<label>Call subject</label><input id="cl1-subject" value="'+esc(d.subject||queueItem(data.g,data.company)&&queueItem(data.g,data.company).reason||('Customer call · '+data.company))+'" oninput="_call532Draft()"></div>'+
   '<div class="cl2-keypad">'+[
    ['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],
    ['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0','+'],['#','']
   ].map(function(key){return'<button class="cl2-key" onclick="_call540Key(\''+key[0].replace("'","\\'")+'\')">'+key[0]+'<span>'+key[1]+'</span></button>'}).join('')+'</div>'+
   '<div class="cl2-dial-actions"><button class="cl2-dial-btn call" onclick="_call540StartDial()">☎ '+(window._call532.stage==='active'?'Call active':'Start call')+'</button>'+
    '<button class="cl2-dial-btn end" onclick="_call540EndDial(\'Attempt ended\')">End</button></div>'+
   '<div class="cl2-outcome-buttons"><button onclick="_call540EndDial(\'Connected\')">Connected</button><button onclick="_call540EndDial(\'Left voicemail\')">Voicemail</button><button onclick="_call540EndDial(\'No answer\')">No answer</button></div>'+
   '<div class="cl2-dial-quick"><button class="cl2-mini-btn" onclick="_call540OpenEmail()">✉ Email</button><button class="cl2-mini-btn" onclick="_call532OpenCustomer()">Company profile</button></div>'+
   '<div class="cl2-provider"><strong>'+esc(integrationSettings().phoneProvider)+'</strong><br>No live carrier call is placed in v540. Dialing, timing, attempt outcomes, and company activity logging operate inside the tracker.</div></div></aside>'
 }
 function duration540(seconds){
  seconds=Math.max(0,Math.floor(n(seconds)));var minutes=Math.floor(seconds/60);
  return String(minutes).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')
 }
 function callSeconds(){
  try{
   var base=n(window._call532.elapsed);
   if(window._call532.stage==='active'&&!window._call532.paused&&window._call532.startedAt){
    var start=dateObj(window._call532.startedAt);if(start)base+=Math.max(0,Math.floor((Date.now()-start.getTime())/1000))
   }
   return base
  }catch(e){return 0}
 }
 function seasonalHtml(orders){
  var months=new Array(12).fill(0);
  orders.forEach(function(order){var d=dateObj(order.date);if(d)months[d.getMonth()]++});
  var max=Math.max.apply(Math,months.concat([1])),top=months.map(function(value,index){return{value:value,index:index}}).sort(function(a,b){return b.value-a.value}).slice(0,3).filter(function(x){return x.value});
  var labels=['J','F','M','A','M','J','J','A','S','O','N','D'];
  var summary=top.length?top.map(function(x){return new Date(2026,x.index,1).toLocaleDateString('en-US',{month:'long'})}).join(', '):'No repeat seasonal pattern yet';
  return'<div class="cl2-season"><div class="cl2-season-title"><span>Year-over-year purchasing rhythm</span><span>'+esc(summary)+'</span></div>'+
   '<div class="cl2-month-bars">'+months.map(function(value,index){
    var hot=top.some(function(x){return x.index===index});
    return'<div class="cl2-month '+(hot?'hot':'')+'"><i style="height:'+Math.max(4,Math.round(value/max*48))+'px"></i><span>'+labels[index]+'</span></div>'
   }).join('')+'</div></div>'
 }
 function uniqueOptions(list,key){
  var values={All:1};list.forEach(function(item){values[clean(item[key]||'Not recorded')]=1});
  return Object.keys(values).sort(function(a,b){return a==='All'?-1:b==='All'?1:a.localeCompare(b)})
 }
 function optionHtml(values,selected){
  return values.map(function(value){return'<option '+(String(selected)===String(value)?'selected':'')+'>'+esc(value)+'</option>'}).join('')
 }
 function labeledOptionHtml(values,selected){
  return values.map(function(item){
   var value=Array.isArray(item)?item[0]:item,label=Array.isArray(item)?item[1]:item;
   return'<option value="'+esc(value)+'" '+(String(selected)===String(value)?'selected':'')+'>'+esc(label)+'</option>'
  }).join('')
 }
 function productSortLabel(key){
  var labels={units:'Most units purchased',revenue:'Highest revenue',orders:'Most orders',recent:'Most recently purchased',average:'Highest units per order',name:'Product name A–Z',category:'Product category A–Z'};
  return labels[key]||labels.units
 }
 function sortProducts(items,key){
  return arr(items).slice().sort(function(a,b){
   if(key==='revenue')return n(b.revenue)-n(a.revenue)||n(b.units)-n(a.units);
   if(key==='orders')return n(b.orderCount)-n(a.orderCount)||n(b.units)-n(a.units);
   if(key==='recent')return String(b.lastDate||'').localeCompare(String(a.lastDate||''))||n(b.units)-n(a.units);
   if(key==='average')return (n(b.units)/Math.max(1,n(b.orderCount)))-(n(a.units)/Math.max(1,n(a.orderCount)))||n(b.units)-n(a.units);
   if(key==='name')return clean(a.name).localeCompare(clean(b.name));
   if(key==='category')return clean(a.type).localeCompare(clean(b.type))||clean(a.name).localeCompare(clean(b.name));
   return n(b.units)-n(a.units)||n(b.revenue)-n(a.revenue)
  })
 }
 function filteredProducts(data,ui){
  return sortProducts(arr(data.products).filter(function(p){
   return(ui.productType==='All'||p.type===ui.productType)&&
    (ui.productBrand==='All'||p.brand===ui.productBrand)&&
    (ui.productDecoration==='All'||p.decoration===ui.productDecoration)
  }),ui.productSort||'units')
 }
 function visibleProducts(data,ui){
  var rows=filteredProducts(data,ui),limit=String(ui.productLimit||'10');
  return limit==='All'?rows:rows.slice(0,Math.max(1,parseInt(limit,10)||10))
 }
 function productPanel(data,ui){
  var products=filteredProducts(data,ui),visible=visibleProducts(data,ui),shown=visible.length,total=products.length;
  var sortOptions=[['units','Most units purchased'],['revenue','Highest revenue'],['orders','Most orders'],['recent','Most recently purchased'],['average','Highest units per order'],['name','Product name A–Z'],['category','Product category A–Z']];
  var limitOptions=[['10','10 products'],['25','25 products'],['50','50 products'],['100','100 products'],['All','All products']];
  return'<div class="cl2-product-controls">'+
   '<label><span>Product type</span><select onchange="_call540Filter(\'productType\',this.value)">'+optionHtml(uniqueOptions(data.products,'type'),ui.productType)+'</select></label>'+ 
   '<label><span>Brand</span><select onchange="_call540Filter(\'productBrand\',this.value)">'+optionHtml(uniqueOptions(data.products,'brand'),ui.productBrand)+'</select></label>'+ 
   '<label><span>Decoration</span><select onchange="_call540Filter(\'productDecoration\',this.value)">'+optionHtml(uniqueOptions(data.products,'decoration'),ui.productDecoration)+'</select></label>'+ 
   '<label><span>Show</span><select onchange="_call540Filter(\'productLimit\',this.value)">'+labeledOptionHtml(limitOptions,ui.productLimit||'10')+'</select></label>'+ 
   '<label><span>Sort by</span><select onchange="_call540Filter(\'productSort\',this.value)">'+labeledOptionHtml(sortOptions,ui.productSort||'units')+'</select></label></div>'+ 
   '<div class="cl2-product-toolbar"><div class="cl2-list-actions"><button class="cl2-mini-btn primary" onclick="_call540SelectAll(\'products\')">Select all shown</button><button class="cl2-mini-btn" onclick="_call540Clear(\'products\')">Clear products</button></div>'+ 
   '<div class="cl2-product-count">Showing <strong>'+shown+'</strong> of <strong>'+total+'</strong> products · '+esc(productSortLabel(ui.productSort||'units'))+'</div></div>'+ 
   (visible.length?'<div class="cl2-record-grid">'+visible.map(function(p){
    var on=isSelected('products',p.id);
    return'<article class="cl2-record '+(on?'on':'')+'" onclick="_call540Toggle(\'products\',\''+p.id+'\')"><input class="cl2-record-check" type="checkbox" '+(on?'checked':'')+' onclick="event.preventDefault()">'+
     '<div class="cl2-record-kicker">'+esc(p.type)+' · '+esc(p.brand)+'</div><div class="cl2-record-title">'+esc(p.name)+'</div>'+ 
     '<div class="cl2-record-meta">'+esc([p.style,p.decoration,p.lastDate&&('Last '+fmt(p.lastDate))].filter(Boolean).join(' · ')||'Product detail from loaded history')+'</div>'+ 
     '<div class="cl2-record-stats"><span>'+Math.round(p.units).toLocaleString()+' units</span><span>'+p.orderCount+' orders</span>'+(p.revenue?'<span>'+money(p.revenue)+'</span>':'')+'</div></article>'
   }).join('')+'</div>':(data.company?'<div class="cl2-empty"><strong>No purchased products are matched to this customer</strong>Product cards use the monthly line-item report. Confirm the customer AccountID mapping, then refresh the portal. Weekly summary spreadsheets do not contain product detail.</div>':'<div class="cl2-empty"><strong>Choose a customer to load product history</strong>The product list is customer-specific and appears after a customer is selected.</div>'))
 }
 function artworkPanel(data,ui){
  var artwork=data.artwork.filter(function(a){return ui.artDecoration==='All'||a.decoration===ui.artDecoration}).sort(function(a,b){
   return ui.artSort==='decoration'?a.decoration.localeCompare(b.decoration):a.title.localeCompare(b.title)
  });
  var methods=uniqueOptions(data.artwork,'decoration').filter(function(x){return x!=='All'});
  return'<div class="cl2-filter-row" style="grid-template-columns:1fr 1fr"><select onchange="_call540Filter(\'artDecoration\',this.value)">'+optionHtml(['All'].concat(methods),ui.artDecoration)+'</select>'+
   '<select onchange="_call540Filter(\'artSort\',this.value)">'+optionHtml(['name','decoration'],ui.artSort)+'</select></div>'+
   '<div class="cl2-list-actions"><button class="cl2-mini-btn primary" onclick="_call540SelectAll(\'artwork\')">Select all artwork</button><button class="cl2-mini-btn" onclick="_call540Clear(\'artwork\')">Clear artwork</button>'+
    methods.map(function(method){return'<button class="cl2-mini-btn" onclick="_call540SelectArtworkMethod(\''+encodeURIComponent(method)+'\')">'+esc(method)+'</button>'}).join('')+'</div>'+
   (artwork.length?'<div class="cl2-record-grid">'+artwork.map(function(a){
    var on=isSelected('artwork',a.id),image=a.image?'<img src="'+esc(a.image)+'" alt="'+esc(a.title)+'">':'Actual logo or proof image<br>will appear here';
    return'<article class="cl2-record '+(on?'on':'')+'" onclick="_call540Toggle(\'artwork\',\''+a.id+'\')"><input class="cl2-record-check" type="checkbox" '+(on?'checked':'')+' onclick="event.preventDefault()">'+
     '<div class="cl2-art-record"><div class="cl2-art-image">'+image+'</div><div><div class="cl2-record-kicker">'+esc(a.decoration)+'</div><div class="cl2-record-title">'+esc(a.title)+'</div>'+
      '<div class="cl2-record-meta">Logo size: '+esc(a.logoSize)+'<br>COID: '+esc(a.coid)+'</div>'+
      '<div class="cl2-record-stats"><span>Colors '+esc(a.colors)+'</span><span>Stitches '+esc(a.stitches)+'</span><span>'+esc(a.status)+'</span></div></div></div></article>'
   }).join('')+'</div>':'<div class="cl2-empty"><strong>No artwork is connected to this company</strong>The framework is ready for actual logo images, logo size, COID, decoration method, screen-print colors, and embroidery stitch count. Example images are never copied into customer records.</div>')
 }
 function ordersPanel(data){
  return seasonalHtml(data.orders)+
   '<div class="cl2-list-actions"><button class="cl2-mini-btn primary" onclick="_call540SelectAll(\'orders\')">Select all orders</button><button class="cl2-mini-btn" onclick="_call540Clear(\'orders\')">Clear orders</button></div>'+
   (data.orders.length?'<div class="cl2-record-grid">'+data.orders.map(function(o){
    var on=isSelected('orders',o.id);
    return'<article class="cl2-record '+(on?'on':'')+'" onclick="_call540Toggle(\'orders\',\''+o.id+'\')"><input class="cl2-record-check" type="checkbox" '+(on?'checked':'')+' onclick="event.preventDefault()">'+
     '<div class="cl2-record-kicker">'+esc(o.status)+'</div><div class="cl2-record-title">'+esc(o.orderNumber)+(o.invoice?' · Invoice '+esc(o.invoice):'')+'</div>'+
     '<div class="cl2-record-meta">'+fmt(o.date)+' · '+money(o.total)+'</div><div class="cl2-record-stats"><span>'+Math.round(o.units).toLocaleString()+' units</span></div></article>'
   }).join('')+'</div>':'<div class="cl2-empty"><strong>No previous orders are loaded</strong>Order history will populate from connected company orders and imported sales records.</div>')
 }
 function datesPanel(data){
  return'<div class="cl2-list-actions"><button class="cl2-mini-btn primary" onclick="_call540SelectAll(\'dates\')">Select all dates</button><button class="cl2-mini-btn" onclick="_call540Clear(\'dates\')">Clear dates</button></div>'+
   (data.dates.length?'<div class="cl2-record-grid">'+data.dates.map(function(event){
    var on=isSelected('dates',event.id);
    return'<article class="cl2-record '+(on?'on':'')+'" onclick="_call540Toggle(\'dates\',\''+event.id+'\')"><input class="cl2-record-check" type="checkbox" '+(on?'checked':'')+' onclick="event.preventDefault()">'+
     '<div class="cl2-record-kicker">'+esc(event.type)+'</div><div class="cl2-record-title">'+esc(event.title)+'</div>'+
     '<div class="cl2-record-meta">'+esc(event.date?fmt(event.date):'Recurring / timing-based signal')+(event.detail?'<br>'+esc(event.detail):'')+'</div></article>'
   }).join('')+'</div>':'<div class="cl2-empty"><strong>No important dates are recorded</strong>Add company events, annual programs, milestones, and reorder periods on the Company Profile.</div>')
 }
 function prepHtml(data){
  var bundle=companyUi(data.company),ui=bundle.data,snapshot=selectionSnapshot(),count=snapshot.products.length+snapshot.artwork.length+snapshot.orders.length+snapshot.dates.length;
  var body=window._call540PrepTab==='artwork'?artworkPanel(data,ui):
   window._call540PrepTab==='orders'?ordersPanel(data):
   window._call540PrepTab==='dates'?datesPanel(data):productPanel(data,ui);
  return'<div class="cl2-section"><div class="cl2-section-title">Prepare for Call</div><div class="cl2-section-copy">Select any combination of products, artwork, orders, and customer dates. Select all, a few, or none.</div>'+
   '<div class="cl2-prep-toolbar"><div class="cl2-prep-tabs">'+[
    ['products','Products Purchased'],['artwork','Artwork'],['orders','Orders'],['dates','Important Dates']
   ].map(function(tab){return'<button class="cl2-prep-tab '+(window._call540PrepTab===tab[0]?'on':'')+'" onclick="_call540PrepTabGo(\''+tab[0]+'\')">'+tab[1]+'</button>'}).join('')+'</div>'+
   '<div class="cl2-selection-summary">'+count+' selected · '+snapshot.products.length+' products · '+snapshot.artwork.length+' artwork · '+snapshot.orders.length+' orders · '+snapshot.dates.length+' dates</div></div>'+
   body+'<div class="cl2-ai-actions"><p>Generated talking points connect the selected evidence to the manager-configured monthly promotion.</p>'+
    '<button class="cl2-mini-btn primary" onclick="_call540GenerateTalkingPoints()">✦ Generate talking points</button></div></div>'+
   carryFields('prep')
 }
 function classificationHtml(data){
  var d=window._call532.draft||{},queue=queueItem(data.g,data.company),types=window.TCP537&&TCP537.PRIMARY_TYPES||[
   'Account Updating Call','Product Opportunity Call','Reorder Call','Quote Follow-Up','Sample Follow-Up','Order Follow-Up','New Lead / Prospecting Call','Dormant Account Re-engagement','Web Order Follow-Up','Trade Show Follow-Up','Service Recovery Call','Relationship Check-In','Payment / Accounting Follow-Up','Other'
  ],secondary=window.TCP537&&TCP537.SECONDARY||['','Product Opportunity','Reorder Discussion','Quote Follow-Up','Sample Follow-Up','Service Issue','Order Discussion','Relationship Check-In','Other'];
  var type=d.callType||(/account\s*updat|updating\s*account/i.test([queue&&queue.reason,queue&&queue.source].join(' '))?'Account Updating Call':'');
  if(type&&!d.callType){d.callType=type;window._call532.draft=d}
  function options(list,value,blank){
   return(blank?'<option value="">'+blank+'</option>':'')+list.map(function(x){return'<option value="'+esc(x)+'" '+(String(value||'')===String(x)?'selected':'')+'>'+esc(x||'None')+'</option>'}).join('')
  }
  var tags=industryTags(data);
  return'<div class="cl2-section"><div class="cl2-section-title">Call classification</div><div class="cl2-section-copy">Call purpose controls reporting and automation. Company industry is reference information and can only be changed on the Company Profile.</div>'+
   '<div class="cl2-grid-2"><div class="cl2-field"><label>Primary call type *</label><select id="cl1-call-type" onchange="_call537TypeChanged();_call532Draft()">'+options(types,type,'Choose call type')+'</select></div>'+
    '<div class="cl2-field"><label>Secondary purpose</label><select id="cl1-secondary-purpose" onchange="_call532Draft()">'+options(secondary,d.secondaryPurpose||'','')+'</select></div></div>'+
   '<div id="cl2-account-update-fields" style="'+(type==='Account Updating Call'?'':'display:none')+'"><label class="cl2-checkline" style="margin-top:9px"><input id="cl1-account-update-complete" type="checkbox" '+(d.accountUpdateCompleted?'checked':'')+' onchange="_call532Draft()"> <span><strong style="display:block;color:#fff">Count this as the completed account update</strong>Connected conversations and voicemail default to checked. No answer defaults to unchecked.</span></label></div>'+
   '<div class="cl2-readonly"><label>Company industry · read only during calls</label><div class="cl2-industry-chips">'+
    (tags.length?tags.map(function(tag){return'<span>'+esc(tag)+'</span>'}).join(''):'<span>Not assigned</span>')+
    '</div><div class="cl2-section-copy">Open the Company Profile to add or change the permanent industry assignment.</div></div></div>'
 }
 function call592AssistHtml(data,d){
  var points=talkingPoints(),promo=promotion(),products=arr(data.products).slice(0,3),tags=industryTags(data);
  var working=clean(d.transcript||d.notes||'');
  var summary=working?working.slice(0,520)+(working.length>520?'…':''):'No live transcript is connected yet. During a live integration, this area will summarize needs, commitments, objections, decision roles, and follow-up items as the conversation develops.';
  var sayNext=points[0]||promo.promotionCta||'Confirm the customer’s priority, timing, audience, and approval path before recommending a product.';
  var productText=products.length?products.map(function(item){return item.name}).join(' · '):'Customer-specific products will appear from purchase history. General and industry-ranked recommendations require the management product intelligence feed.';
  return'<div class="cl592-call-top">'+
   '<section class="cl592-ai-card"><div class="cl592-card-head"><div><span>AI CALL NOTES</span><strong>Working conversation summary</strong></div><button class="cl2-mini-btn primary" onclick="_call540GenerateTalkingPoints()">Refresh guidance</button></div><p>'+esc(summary)+'</p><small>Account-data guidance is available now. Live transcript summarization requires the audio integration described in Live Assist.</small></section>'+
   '<section class="cl592-ai-card"><div class="cl592-card-head"><div><span>SUGGESTED TALKING POINTS</span><strong>Keep these visible during the call</strong></div></div><div class="cl592-points">'+
    (points.length?points.slice(0,4).map(function(point){return'<div><i>→</i><span>'+esc(point)+'</span></div>'}).join(''):'<div><i>→</i><span>Select customer records in Prepare, then generate talking points.</span></div>')+
   '</div></section>'+
   '<section class="cl592-live-card"><div class="cl592-live-head"><div><span class="cl592-live-status"><i></i>LIVE ASSIST · NOT CONNECTED</span><strong>Real-time coaching workspace</strong></div><button class="cl2-mini-btn" onclick="_call592LiveAssistInfo()">Integration details</button></div><div class="cl592-live-grid">'+
    '<article><span>WHAT TO SAY NEXT</span><strong>'+esc(sayNext)+'</strong></article>'+
    '<article><span>PRODUCT DIRECTION</span><strong>'+esc(productText)+'</strong><small>'+(tags.length?'Industry: '+esc(tags.join(', ')):'Industry not assigned')+'</small></article>'+
    '<article><span>OBJECTION PLAYBOOK</span><strong>Ask which constraint matters most: budget, timing, product fit, artwork, inventory, or approval. Management-authored responses will populate here after the playbook is connected.</strong></article>'+
   '</div></section></div>'
 }
 function conversationHtml(data){
  var d=window._call532.draft||{},selectedText=selectedProductText();
  return call592AssistHtml(data,d)+
   '<div class="cl2-section cl592-note-section"><div class="cl2-section-title">Conversation notes</div><div class="cl2-section-copy">Capture what the customer says beneath the AI guidance. Notes remain editable throughout the call.</div>'+
    '<div class="cl2-grid-2"><div class="cl2-field"><label>Key notes</label><textarea id="cl1-notes" placeholder="Customer goals, needs, timing, decision makers, commitments, and next steps">'+esc(d.notes||'')+'</textarea></div>'+
     '<div class="cl2-field"><label>Live transcript / detailed notes</label><textarea id="cl1-transcript" placeholder="A live transcript can populate here after audio integration. Until then, type or paste detailed notes.">'+esc(d.transcript||'')+'</textarea></div></div>'+
    '<div class="cl2-grid-2"><div class="cl2-field"><label>Products or programs discussed</label><textarea id="cl1-products" placeholder="Products, quantities, programs, timing, or use case">'+esc(d.products||selectedText)+'</textarea></div>'+
     '<div class="cl2-field"><label>Objections / decision barriers</label><textarea id="cl1-objections" placeholder="Price, timing, artwork, inventory, approval, competition, or other barrier">'+esc(d.objections||'')+'</textarea></div></div>'+
    '<div class="cl2-list-actions"><button class="cl2-mini-btn primary" onclick="_call532Draft()">Save conversation notes</button><button class="cl2-mini-btn" onclick="_call540OpenEmail()">Write follow-up email</button></div></div>'+
   carryFields('conversation')
 }
 function completeHtml(data){
  var d=window._call532.draft||{},done=window._call532.completed;
  if(done){
   var a=done.activity||{};
   return'<div class="cl2-success"><strong>Call completed and saved to '+esc(data.company)+'</strong><p>The activity is now available in the Company Profile Activity History.'+(done.follow?' A dated Today’s Business task was created.':'')+(done.opportunity?' An opportunity was created.':'')+'</p>'+
    '<div class="cl2-list-actions"><button class="cl2-mini-btn primary" onclick="_call532Next()">Next call</button><button class="cl2-mini-btn" onclick="_call532OpenCustomer()">Open company</button><button class="cl2-mini-btn" onclick="_call540OpenEmail()">Email customer</button><button class="cl2-mini-btn" onclick="_call532ResetCurrent()">Log another call</button></div></div>'+
    '<div class="cl2-section"><div class="cl2-section-title">Saved call information and post-call tools</div><div class="cl2-saved-summary">'+
     savedRow('Outcome',a.outcome||'Completed')+savedRow('Call type',a.callType||'Not recorded')+savedRow('Duration',duration540(a.durationSeconds||0))+
     savedRow('Next commitment',[a.nextStep,a.nextDate&&fmt(a.nextDate)].filter(Boolean).join(' · ')||'No dated next commitment')+
     savedRow('Products discussed',a.productsDiscussed||'Not recorded')+savedRow('Conversation notes',a.detail||'No notes')+
    '</div></div>'
  }
  return'<div class="cl2-complete-top cl592-complete-intro"><div><strong>Complete the call when the outcome, classification, and next commitment are ready.</strong><span>Review the call classification here, finish the handoff fields, then save the completed call from the footer.</span></div></div>'+
   classificationHtml(data)+
   '<div class="cl2-section"><div class="cl2-section-title">Outcome and next commitment</div><div class="cl2-section-copy">A next action and date are required unless the outcome closes the follow-up loop.</div>'+
    '<div class="cl2-grid-2"><div class="cl2-field"><label>Call outcome *</label><select id="cl1-outcome"><option value="">Choose outcome</option>'+[
     'Connected – follow-up required','Connected – quote discussed','Order expected','Sample requested','Left voicemail','No answer','Wrong contact','Not interested','Completed – no follow-up'
    ].map(function(x){return'<option '+(d.outcome===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div>'+
     '<div class="cl2-field"><label>Customer sentiment</label><select id="cl1-sentiment">'+['Unknown','Positive','Neutral','Concerned','Frustrated'].map(function(x){return'<option '+((d.sentiment||'Unknown')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div></div>'+
    '<div class="cl2-grid-2"><div class="cl2-field"><label>Next action</label><input id="cl1-next-action" value="'+esc(d.nextAction||'')+'" placeholder="What must happen next?"></div>'+
     '<div class="cl2-field"><label>Next action date</label><input id="cl1-next-date" type="date" value="'+esc(d.nextDate||'')+'"></div></div>'+
    '<label class="cl2-checkline" style="margin-top:9px"><input id="cl1-create-followup" type="checkbox" '+(d.createFollowUp!==false?'checked':'')+'> Create the dated follow-up in Today’s Business.</label></div>'+
   '<div class="cl2-section"><div class="cl2-section-title">Sales handoff</div><div class="cl2-section-copy">Create an opportunity only for qualified future business. Deal Desk prepares a quote but does not send it.</div>'+
    '<div class="cl2-grid-2"><label class="cl2-checkline"><input id="cl1-create-opportunity" type="checkbox" '+(d.createOpportunity?'checked':'')+'> Create an opportunity from this call.</label>'+
     '<label class="cl2-checkline"><input id="cl1-quote-handoff" type="checkbox" '+(d.quoteHandoff?'checked':'')+'> Open a prepared Deal Desk quote after saving.</label></div>'+
    '<div class="cl2-grid-3"><div class="cl2-field"><label>Opportunity title</label><input id="cl1-opportunity-title" value="'+esc(d.opportunityTitle||'')+'" placeholder="Program or business need"></div>'+
     '<div class="cl2-field"><label>Estimated value</label><input id="cl1-opportunity-value" type="number" min="0" step="1" value="'+esc(d.opportunityValue||'')+'"></div>'+
     '<div class="cl2-field"><label>Stage</label><select id="cl1-opportunity-stage">'+['New Opportunity','Discovery','Product Selection','Quote in Progress','Quote Sent','Customer Review'].map(function(x){return'<option '+((d.opportunityStage||'Discovery')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div></div>'+
    '<div class="cl2-field" style="margin-top:8px"><label>Expected close date</label><input id="cl1-opportunity-close" type="date" value="'+esc(d.opportunityClose||'')+'"></div></div>'+
   carryFields('complete')
 }
 function savedRow(label,value){
  return'<div class="cl2-saved-row"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>'
 }
 function hidden(idv,value,type,checkedValue){
  if(type==='checkbox')return'<input type="checkbox" id="'+idv+'" style="display:none" '+(checkedValue?'checked':'')+'>';
  return'<input type="hidden" id="'+idv+'" value="'+esc(value||'')+'">'
 }
 function carryFields(tab){
  var d=window._call532.draft||{},html='';
  if(tab!=='conversation'){
   html+=hidden('cl1-notes',d.notes)+hidden('cl1-transcript',d.transcript)+hidden('cl1-products',d.products||selectedProductText())+hidden('cl1-objections',d.objections)
  }
  if(tab!=='complete'){
   html+=hidden('cl1-outcome',d.outcome)+hidden('cl1-sentiment',d.sentiment||'Unknown')+hidden('cl1-next-action',d.nextAction)+hidden('cl1-next-date',d.nextDate)+
    hidden('cl1-create-followup','', 'checkbox',d.createFollowUp!==false)+hidden('cl1-create-opportunity','', 'checkbox',d.createOpportunity)+
    hidden('cl1-opportunity-title',d.opportunityTitle)+hidden('cl1-opportunity-value',d.opportunityValue)+hidden('cl1-opportunity-stage',d.opportunityStage||'Discovery')+
    hidden('cl1-opportunity-close',d.opportunityClose)+hidden('cl1-quote-handoff','', 'checkbox',d.quoteHandoff)
  }
  if(tab==='prep'){
   html+=hidden('cl1-call-type',d.callType)+hidden('cl1-secondary-purpose',d.secondaryPurpose)+hidden('cl1-account-update-complete','', 'checkbox',d.accountUpdateCompleted)
  }
  return'<div style="display:none">'+html+'</div>'
 }
 function centerHtml(data){
  var d=window._call532.draft||{},contact=selectedContact(data.company)||primaryContact(data),queue=queueItem(data.g,data.company);
  var body=window._call540Tab==='conversation'?conversationHtml(data):window._call540Tab==='complete'?completeHtml(data):prepHtml(data);
  return'<main class="cl2-panel"><div class="cl2-active-head"><div class="cl2-active-row"><div><div class="cl2-kick">ACTIVE CUSTOMER</div>'+
   '<div class="cl2-active-name">'+esc(data.company||'No company selected')+'</div><div class="cl2-active-sub">'+esc([
    field(contact||{},['name'],''),queue&&queue.reason,industryTags(data).join(', ')
   ].filter(Boolean).join(' · ')||'Prepare the customer conversation.')+'</div></div>'+
   '<div class="cl2-pill '+(window._call532.stage==='active'?'green':'cyan')+'">'+(window._call532.stage==='active'?'Call active · '+duration540(callSeconds()):'Prepare first')+'</div></div>'+
   '<div class="cl2-workflow-tabs"><button class="cl2-wtab '+(window._call540Tab==='prep'?'on':'')+'" onclick="_call540GoTab(\'prep\')">Prepare for Call</button>'+
    '<button class="cl2-wtab '+(window._call540Tab==='conversation'?'on':'')+'" onclick="_call540GoTab(\'conversation\')">Conversation</button>'+
    '<button class="cl2-wtab '+(window._call540Tab==='complete'?'on':'')+'" onclick="_call540GoTab(\'complete\')">Complete Call</button></div></div>'+
   '<div class="cl2-center-body">'+body+'</div></main>'
 }
 function contextHtml(data){
  var promo=promotion(),points=talkingPoints(),primary=primaryContact(data),quotes=arr(data.g.quotes).filter(function(q){return norm(q.company)===norm(data.company)}),
   opps=arr(data.g.opps).filter(function(o){return norm(o.company)===norm(data.company)}),last=data.orders[0],tags=industryTags(data),top=data.products[0];
  return'<aside class="cl2-panel cl2-right"><div class="cl2-panel-head"><div><div class="cl2-kick">CUSTOMER CONTEXT</div><div class="cl2-panel-title">Promotion, talking points, and account facts</div><div class="cl2-panel-copy">Recorded customer evidence remains visible while preparing and conducting the call.</div></div><button class="cl2-mini-btn primary" onclick="_call532OpenCustomer()">Full profile</button></div>'+
   '<div class="cl2-body cl2-scroll"><div class="cl2-promo"><span>Current monthly promotion</span><strong>'+esc(promo.promotionTitle)+'</strong><p>'+esc(promo.promotionBody)+'</p><p class="cl2-promo-offer">'+esc(promo.promotionOffer)+'</p></div>'+
   '<div class="cl2-talk"><div class="cl2-talk-head"><strong>Generated talking points</strong><button class="cl2-mini-btn primary" onclick="_call540GenerateTalkingPoints()">Regenerate</button></div>'+
    '<div class="cl2-talk-list">'+(points.length?points.map(function(point){return'<div class="cl2-talk-item">• '+esc(point)+'</div>'}).join(''):'<div class="cl2-talk-item">Select relevant records in Prepare for Call, then generate customer-specific talking points.</div>')+'</div></div>'+
   '<div class="cl2-context-card"><span>Company industry · profile owned</span><strong>'+esc(tags.join(', ')||'Not assigned')+'</strong><p>Industry is read-only here and can only be changed on the Company Profile.</p></div>'+
   '<div class="cl2-context-card"><span>Primary relationship</span><strong>'+esc(field(primary||{},['name'],'Not recorded'))+'</strong><p>'+esc([
    field(primary||{},['title','buyingRole'],''),field(primary||{},['phone','mobile'],''),field(primary||{},['email'],'')
   ].filter(Boolean).join(' · ')||'Add contact details on the Company Profile.')+'</p></div>'+
   '<div class="cl2-context-card"><span>Recent account context</span><strong>Last contact '+fmt(field(data.c,['lastContactDate'],'')||field(data.account.data&&data.account.data.profile||{},['lastContactAt'],''))+'</strong>'+
    '<div class="cl2-context-list"><div class="cl2-context-row"><strong>Last order</strong><span>'+(last?esc(last.orderNumber)+' · '+fmt(last.date)+' · '+money(last.total):'No completed order record')+'</span></div>'+
     '<div class="cl2-context-row"><strong>Open quotes</strong><span>'+(quotes[0]?esc(field(quotes[0],['number','quoteNumber'],'Quote')+' · '+money(field(quotes[0],['amount','total'],0))):'No active quote')+'</span></div>'+
     '<div class="cl2-context-row"><strong>Open opportunities</strong><span>'+(opps[0]?esc(field(opps[0],['title'],'Opportunity')+' · '+money(field(opps[0],['amount'],0))):'No active opportunity')+'</span></div></div></div>'+
   '<div class="cl2-context-card"><span>Top purchase signal</span><strong>'+esc(top&&top.name||'No detailed product history')+'</strong><p>'+(top?Math.round(top.units).toLocaleString()+' loaded units · '+esc(top.decoration):'Upload line-item history to build product context.')+'</p></div></div></aside>'
 }
 function render(){
  var data=currentData(),g=data.g,completedToday=0,callStore=read('tcp_rp_call_workspace_v532',null);
  try{arr(callStore&&callStore.reps&&callStore.reps[currentRep()]&&callStore.reps[currentRep()].history).forEach(function(h){if(iso(h.createdAt)===iso(new Date()))completedToday++})}catch(e){}
  var queue=queueItem(g,data.company),title=stageTitle();
  var hero='<section class="cl2-hero"><div class="cl2-hero-top"><div><div class="cl2-kick">CALL WORKSPACE 2.0 · EMBEDDED CUSTOMER CONVERSATION OPERATING SYSTEM · BUILD v540</div>'+
   '<div class="cl2-hero-title">'+esc(data.company||'Choose a company')+'</div><div class="cl2-hero-copy">Prepare from purchase history, artwork, prior orders, and important dates. Conduct the call and email entirely inside the tracker, then preserve every attempt and completion in Company Activity History.</div>'+
   '<div class="cl2-pills"><span class="cl2-pill cyan">'+arr(g.calls).length+' ranked calls</span><span class="cl2-pill green">'+completedToday+' completed today</span><span class="cl2-pill orange">'+(g.business&&g.business.lanes&&g.business.lanes.overdue?g.business.lanes.overdue.length:0)+' overdue actions</span><span class="cl2-pill">'+esc(queue&&queue.source||'Direct company call')+'</span></div></div>'+
   '<div class="cl2-hero-status"><span>Current workflow</span><strong>'+esc(title)+'</strong><p>'+esc(queue?queue.reason+' · '+queue.copy:'Open a queue customer or continue from the Company Profile.')+'</p></div></div>'+
   '<div class="cl2-queue-wrap"><div class="cl2-queue-head"><strong>Ranked Call Queue</strong><span>Scroll horizontally · selecting a company always opens Prepare for Call</span></div><div class="cl2-queue">'+queueHtml(data)+'</div></div></section>';
  return'<div class="cl2-shell">'+hero+'<div class="cl2-workbench">'+dialerHtml(data)+centerHtml(data)+contextHtml(data)+'</div></div>'
 }
 function rerender(){
  if(window._rp2&&_rp2.page==='call'){
   var page=document.getElementById('rp2-page');if(page)page.innerHTML=render();
   drawTimers()
  }
  renderEmail()
 }
 function drawTimers(){
  try{
   if(typeof window._rp2CallDraw==='function')window._rp2CallDraw()
  }catch(e){}
  var timer=document.getElementById('call540-dial-timer');
  if(timer)timer.textContent=duration540(callSeconds())
 }
 function logAttempt(status){
  var data=currentData(),contact=selectedContact(data.company),stamp=new Date().toISOString();
  if(window._call540DialState.attemptActivityId){
   var b=account(data.company,true),activity=b.data.activities.filter(function(a){return a.id===window._call540DialState.attemptActivityId})[0];
   if(activity){
    activity.outcome=status;activity.callStatus='attempted';activity.updatedAt=stamp;activity.durationSeconds=callSeconds();
    activity.detail='Embedded dialer attempt · '+status;saveAccount(b);return activity
   }
  }
  var activity={
   id:makeId('attempt'),source:'embedded-dialer-v540',type:'Call Attempt',subject:'Call attempt · '+data.company,
   detail:'Embedded dialer attempt started inside the tracker.',outcome:status||'Dialing',callStatus:'attempted',
   date:stamp,createdAt:stamp,updatedAt:stamp,durationSeconds:callSeconds(),
   contactId:field(contact||{},['id','contactId'],''),contactName:field(contact||{},['name'],''),
   phone:clean((document.getElementById('call540-phone')||{}).value||'')
  };
  addActivity(data.company,activity);
  window._call540DialState.attemptActivityId=activity.id;
  return activity
 }
 function emailState(){
  var store=read(EMAIL_STORE,{version:1,reps:{}});
  store.reps=store.reps||{};store.reps[currentRep()]=store.reps[currentRep()]||{drafts:{}};
  return store
 }
 function currentEmailDraft(){
  var store=emailState(),key=norm(companyName()),draft=store.reps[currentRep()].drafts[key];
  if(!draft){
   var data=currentData(),contact=selectedContact(data.company)||primaryContact(data),promo=promotion();
   draft={
    company:data.company,to:field(contact||{},['email'],'')||'',cc:'',subject:'',
    body:'Hi '+(field(contact||{},['name'],'')?clean(field(contact,['name'],'')).split(/\s+/)[0]:'there')+',\n\nThank you for your time. I wanted to follow up regarding '+promo.promotionTitle.toLowerCase()+'.\n\n'+promo.promotionCta+'\n\nThank you,\n'+currentRep(),
    updatedAt:new Date().toISOString()
   };
   store.reps[currentRep()].drafts[key]=draft;write(EMAIL_STORE,store)
  }
  return draft
 }
 function saveEmailFromDom(){
  var store=emailState(),key=norm(companyName()),draft=currentEmailDraft(),body=document.getElementById('ce540-body');
  draft.to=clean((document.getElementById('ce540-to')||{}).value||draft.to);
  draft.cc=clean((document.getElementById('ce540-cc')||{}).value||draft.cc);
  draft.subject=clean((document.getElementById('ce540-subject')||{}).value||draft.subject);
  draft.body=body?body.innerText:draft.body;draft.updatedAt=new Date().toISOString();
  store.reps[currentRep()].drafts[key]=draft;write(EMAIL_STORE,store);return draft
 }
 function renderEmail(){
  var host=document.getElementById('ce540-host');
  if(!host){host=document.createElement('div');host.id='ce540-host';(document.getElementById('rp-overlay')||document.body).appendChild(host)}
  if(!window._call540EmailOpen){host.innerHTML='';return}
  var draft=currentEmailDraft();
  host.innerHTML='<div class="ce540-wrap" onclick="if(event.target===this)_call540CloseEmail()"><section class="ce540-card"><header class="ce540-head"><div><strong>Email '+esc(draft.company)+'</strong><span>Activity-only local composer · no external message is transmitted</span></div><button class="ce540-close" onclick="_call540CloseEmail()">×</button></header>'+
   '<div class="ce540-fields"><div class="ce540-line"><label>To</label><input id="ce540-to" value="'+esc(draft.to)+'" placeholder="customer@example.com"></div>'+
    '<div class="ce540-line"><label>Cc</label><input id="ce540-cc" value="'+esc(draft.cc)+'"></div>'+
    '<div class="ce540-line"><label>Subject</label><input id="ce540-subject" value="'+esc(draft.subject)+'" placeholder="Email subject"></div></div>'+
   '<div id="ce540-body" class="ce540-body" contenteditable="true">'+esc(draft.body).replace(/\n/g,'<br>')+'</div>'+
   '<footer class="ce540-foot"><span>Send records the email in Company Activity History. No email leaves the tracker in v540.</span><div class="ce540-actions"><button class="ce540-btn" onclick="_call540SaveEmail()">Save draft</button><button class="ce540-btn" onclick="_call540CloseEmail()">Cancel</button><button class="ce540-btn send" onclick="_call540SendEmail()">Send</button></div></footer></section></div>'
 }
 function adminPanel(){
  var s=integrationSettings();
  return'<section id="tcp540-integrations-admin" class="tcp540-admin"><h3>Call, Email & Monthly Promotion</h3><p>v540 uses an embedded simulated dialer and activity-only email composer. Configure the customer-facing monthly promotion now; live phone and email providers can be connected in a later integration phase.</p>'+
   '<div class="tcp540-admin-grid"><div class="tcp540-admin-field"><label>Phone provider</label><select id="tcp540-phone-provider">'+[
    'Not connected','Microsoft Teams Phone','RingCentral','Dialpad','Aircall','Other'
   ].map(function(x){return'<option '+(s.phoneProvider===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div>'+
   '<div class="tcp540-admin-field"><label>Email provider</label><select id="tcp540-email-provider">'+[
    'Local activity-only composer','Microsoft 365','Other'
   ].map(function(x){return'<option '+(s.emailProvider===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div>'+
   '<div class="tcp540-admin-field"><label>Monthly promotion title</label><input id="tcp540-promo-title" value="'+esc(s.promotionTitle)+'"></div>'+
   '<div class="tcp540-admin-field"><label>Promotion focus / offer</label><input id="tcp540-promo-offer" value="'+esc(s.promotionOffer)+'"></div>'+
   '<div class="tcp540-admin-field" style="grid-column:1/-1"><label>Promotion description</label><textarea id="tcp540-promo-body">'+esc(s.promotionBody)+'</textarea></div>'+
   '<div class="tcp540-admin-field" style="grid-column:1/-1"><label>Suggested closing question</label><input id="tcp540-promo-cta" value="'+esc(s.promotionCta)+'"></div></div>'+
   '<div class="tcp540-admin-actions"><button class="sbtn" onclick="_call540SaveAdmin()">Save communication settings</button><span class="status">Provider selections are planning placeholders; no external credentials are stored here.</span></div></section>'
 }
 function ensureAdmin(){
  var page=document.getElementById('pg-admin');if(!page||document.getElementById('tcp540-integrations-admin'))return;
  page.insertAdjacentHTML('afterbegin',adminPanel())
 }

 window._call540SelectCompany=function(encoded){
  try{if(typeof window._call532Draft==='function')window._call532Draft()}catch(e){}
  window._call532.company=decodeURIComponent(encoded||'');
  window._call532.stage='prep';window._call532.elapsed=0;window._call532.startedAt='';window._call532.paused=false;window._call532.completed=null;
  window._call540Tab='prep';window._call540PrepTab='products';
  window._call540DialState={status:'ready',attemptActivityId:'',number:'',startedAt:'',lastOutcome:''};
  var store=read('tcp_rp_call_workspace_v532',null);
  try{window._call532.draft=store&&store.reps&&store.reps[currentRep()]&&store.reps[currentRep()].drafts[norm(window._call532.company)]||{}}catch(e){window._call532.draft={}}
  rerender()
 };
 window._call540GoTab=function(tab){
  try{if(typeof window._call532Draft==='function')window._call532Draft()}catch(e){}
  window._call540Tab=tab;rerender()
 };
 window._call540PrepTabGo=function(tab){window._call540PrepTab=tab;rerender()};
 window._call540Toggle=function(kind,id){toggleSelection(kind,id);rerender()};
 window._call540Clear=function(kind){var b=companyUi(companyName());b.data[kind]=[];saveCompanyUi(companyName(),b.data);rerender()};
 window._call540SelectAll=function(kind){
  var data=currentData(),b=companyUi(data.company),items=kind==='products'?data.products:kind==='artwork'?data.artwork:kind==='orders'?data.orders:data.dates;
  if(kind==='products'){
   items=visibleProducts(data,b.data)
  }
  if(kind==='artwork')items=items.filter(function(a){return b.data.artDecoration==='All'||a.decoration===b.data.artDecoration});
  b.data[kind]=items.map(function(item){return item.id});saveCompanyUi(data.company,b.data);rerender()
 };
 window._call540SelectArtworkMethod=function(encoded){
  var method=decodeURIComponent(encoded),data=currentData(),b=companyUi(data.company),ids=arr(b.data.artwork);
  data.artwork.filter(function(a){return a.decoration===method}).forEach(function(a){if(ids.indexOf(a.id)<0)ids.push(a.id)});
  b.data.artwork=ids;saveCompanyUi(data.company,b.data);rerender()
 };
 window._call540Filter=function(key,value){var b=companyUi(companyName());b.data[key]=value;saveCompanyUi(companyName(),b.data);rerender()};
 window._call540GenerateTalkingPoints=function(){generateTalkingPoints();rerender()};
 window._call540SelectionSnapshot=selectionSnapshot;
 window._call540TalkingPointSnapshot=talkingPoints;
 window._call540PromotionSnapshot=function(){var p=promotion();return{title:p.promotionTitle,body:p.promotionBody,offer:p.promotionOffer,cta:p.promotionCta}};
 window._call540PhoneChanged=function(){window._call540DialState.number=clean((document.getElementById('call540-phone')||{}).value||'')};
 window._call540Key=function(key){
  var input=document.getElementById('call540-phone');if(!input)return;
  input.value=(input.value||'')+key;window._call540DialState.number=input.value
 };
 window._call540ContactChanged=function(){
  var data=currentData(),contact=selectedContact(data.company),phone=field(contact||{},['phone','mobile','phoneNumber'],'');
  window._call540DialState.number=phone;
  try{window._call532Draft()}catch(e){}
  rerender()
 };
 window._call540DialFocus=function(){
  window._call540Tab='conversation';rerender();
  setTimeout(function(){var input=document.getElementById('call540-phone');if(input)input.focus()},30)
 };
 window._call540StartDial=function(){
  var phone=clean((document.getElementById('call540-phone')||{}).value||'');
  if(!phone){alert('Enter or select a phone number first.');return}
  window._call540DialState.number=phone;window._call540DialState.status='dialing';window._call540DialState.startedAt=new Date().toISOString();
  if(window._call532.stage!=='active'){
   window._call532.stage='active';window._call532.startedAt=new Date().toISOString();window._call532.paused=false
  }
  logAttempt('Dialing');
  window._call540Tab='conversation';
  setTimeout(function(){window._call540DialState.status='connected';rerender()},350)
 };
 window._call540EndDial=function(outcome){
  window._call540DialState.lastOutcome=outcome;window._call540DialState.status='ready';
  logAttempt(outcome);
  var select=document.getElementById('cl1-outcome');
  var mapped=outcome==='Connected'?'Connected – follow-up required':outcome;
  if(select){select.value=mapped;try{window._call537OutcomeChanged()}catch(e){}}
  if(window._call532.stage==='active'){
   window._call532.elapsed=callSeconds();window._call532.startedAt='';window._call532.paused=true
  }
  window._call540Tab='complete';rerender()
 };
 window._call540CompleteCall=function(){
  try{window._call532Draft()}catch(e){}
  return window._call532Complete()
 };
 window._call540OpenEmail=function(){
  window._call540EmailOpen=true;renderEmail()
 };
 window._call540CloseEmail=function(){
  try{saveEmailFromDom()}catch(e){}
  window._call540EmailOpen=false;renderEmail()
 };
 window._call540SaveEmail=function(){
  saveEmailFromDom();alert('Email draft saved inside the tracker.')
 };
 window._call540SendEmail=function(){
  var draft=saveEmailFromDom();
  if(!draft.to){alert('Enter at least one recipient.');return}
  if(!draft.subject){alert('Enter an email subject.');return}
  var stamp=new Date().toISOString(),contact=selectedContact(draft.company);
  addActivity(draft.company,{
   id:makeId('email'),source:'embedded-email-v540',type:'Email',subject:draft.subject,
   detail:draft.body,bodyText:draft.body,to:draft.to,cc:draft.cc,status:'Simulated sent',
   deliveryStatus:'activity-only-no-external-transmission',date:stamp,createdAt:stamp,updatedAt:stamp,
   contactId:field(contact||{},['id','contactId'],''),contactName:field(contact||{},['name'],'')
  });
  var store=emailState();delete store.reps[currentRep()].drafts[norm(draft.company)];write(EMAIL_STORE,store);
  window._call540EmailOpen=false;renderEmail();
  alert('Email recorded in '+draft.company+' Activity History. No external email was transmitted.')
 };
 window._call540SaveAdmin=function(){
  var value={
   phoneProvider:clean((document.getElementById('tcp540-phone-provider')||{}).value||'Not connected'),
   emailProvider:clean((document.getElementById('tcp540-email-provider')||{}).value||'Local activity-only composer'),
   promotionTitle:clean((document.getElementById('tcp540-promo-title')||{}).value||''),
   promotionOffer:clean((document.getElementById('tcp540-promo-offer')||{}).value||''),
   promotionBody:clean((document.getElementById('tcp540-promo-body')||{}).value||''),
   promotionCta:clean((document.getElementById('tcp540-promo-cta')||{}).value||'')
  };
  write(INTEGRATION_STORE,value);alert('Call, email, and monthly promotion settings saved.')
 };

 /* Industry is always read from the Company Profile during calls. */
 window._call537CollectIndustries=function(){return industryTags(currentData())};
 window._call537ClassificationHtml=function(ctx,d){return classificationHtml(currentData())};
 window._call537FloatingClassification=function(x,d){
  var data=currentData(),tags=industryTags(data),type=d.callType||'';
  return'<section class="fc1-section cl2-floating"><div class="fc1-section-title">Call classification</div><div class="fc1-grid-2"><div class="fc1-field"><label>Primary call type</label><select id="cl1-call-type" onchange="_call537TypeChanged();_call534Sync()"><option value="">Choose call type</option>'+
   (window.TCP537&&TCP537.PRIMARY_TYPES||[]).map(function(item){return'<option '+(item===type?'selected':'')+'>'+esc(item)+'</option>'}).join('')+'</select></div>'+
   '<div class="fc1-field"><label>Secondary purpose</label><select id="cl1-secondary-purpose" onchange="_call534Sync()">'+
   (window.TCP537&&TCP537.SECONDARY||['']).map(function(item){return'<option value="'+esc(item)+'" '+(item===(d.secondaryPurpose||'')?'selected':'')+'>'+esc(item||'None')+'</option>'}).join('')+'</select></div></div>'+
   '<div class="cl2-readonly"><label>Company industry · read only</label><div class="cl2-industry-chips">'+(tags.length?tags.map(function(tag){return'<span>'+esc(tag)+'</span>'}).join(''):'<span>Not assigned</span>')+'</div></div>'+
   '<div id="cl2-account-update-fields" style="'+(type==='Account Updating Call'?'':'display:none')+'"><label class="fc1-check"><input id="cl1-account-update-complete" type="checkbox" '+(d.accountUpdateCompleted?'checked':'')+' onchange="_call534Sync()"> Count this as the completed account update.</label></div></section>'
 };

 /* Qualifying voicemail automation now uses the local embedded composer. */
 window._at537AfterCall=function(payload){
  var d=payload.draft||{};
  if(d.callType!=='Account Updating Call'||d.outcome!=='Left voicemail')return;
  var template=typeof window._at537MatchTemplate==='function'?window._at537MatchTemplate(d.callType,d.outcome,d.secondaryPurpose,industryTags(currentData())):null;
  window._call540EmailOpen=true;
  var store=emailState(),key=norm(payload.company),contact=payload.contact||selectedContact(payload.company),draft=currentEmailDraft();
  if(template){
   var context={company:payload.company,contact:contact||{},draft:d,rep:currentRep(),profile:Object.assign({},payload.company&&account(payload.company,false).data&&account(payload.company,false).data.profile||{})};
   draft.subject=window.TCP537&&TCP537.mergeFields?TCP537.mergeFields(template.subject,context):template.subject;
   var html=window.TCP537&&TCP537.mergeFields?TCP537.mergeFields(template.bodyHtml,context):template.bodyHtml;
   var temp=document.createElement('div');temp.innerHTML=html;draft.body=temp.innerText||temp.textContent||html
  }
  draft.to=field(contact||{},['email'],'')||draft.to;draft.updatedAt=new Date().toISOString();
  store.reps[currentRep()].drafts[key]=draft;write(EMAIL_STORE,store);renderEmail()
 };

 /* Existing entry points always begin in Prepare for Call. */
 var oldStart=window._call532Start;
 window._call532Start=function(encoded){
  var company=decodeURIComponent(encoded||'');
  window._call540Tab='prep';window._call540PrepTab='products';
  window._call540DialState={status:'ready',attemptActivityId:'',number:'',startedAt:'',lastOutcome:''};
  return oldStart.call(this,encodeURIComponent(company))
 };
 var oldSelect=window._call532Select;
 window._call532Select=function(encoded){
  window._call540Tab='prep';window._call540PrepTab='products';
  window._call540DialState={status:'ready',attemptActivityId:'',number:'',startedAt:'',lastOutcome:''};
  return oldSelect.apply(this,arguments)
 };
 var oldReset=window._call532ResetCurrent;
 window._call532ResetCurrent=function(){
  window._call540Tab='prep';window._call540PrepTab='products';
  window._call540DialState={status:'ready',attemptActivityId:'',number:'',startedAt:'',lastOutcome:''};
  var result=oldReset.apply(this,arguments);setTimeout(rerender,0);return result
 };
 var oldNext=window._call532Next;
 window._call532Next=function(){
  window._call540Tab='prep';window._call540PrepTab='products';
  window._call540DialState={status:'ready',attemptActivityId:'',number:'',startedAt:'',lastOutcome:''};
  return oldNext.apply(this,arguments)
 };
 window._call532Phone=window._call540DialFocus;
 window._call532Email=window._call540OpenEmail;

 /* Replace the visible Call Workspace. */
 window._rp2CallV1=function(){
  try{return render()}catch(e){
   console.error('[Call Workspace v540]',e);
   return'<div class="cl2-shell"><div class="cl2-hero"><div class="cl2-kick">CALL WORKSPACE 2.0 · BUILD v540 · RECOVERY MODE</div><div class="cl2-hero-title">The embedded workspace hit a compatibility issue</div><div class="cl2-hero-copy">'+esc(e&&e.message||String(e))+'</div></div></div>'
  }
 };
 window._rp2CallDiagnostics=function(){
  var data=currentData(),snapshot=selectionSnapshot();
  return{
   version:'v540',company:data.company,workflow:window._call540Tab,callStage:window._call532.stage,
   queue:arr(data.g.calls).length,products:data.products.length,artwork:data.artwork.length,
   orders:data.orders.length,importantDates:data.dates.length,selections:{
    products:snapshot.products.length,artwork:snapshot.artwork.length,orders:snapshot.orders.length,dates:snapshot.dates.length
   },industryEditableDuringCall:false,embeddedDialer:true,embeddedEmail:true
  }
 };

 /* Keep timer, right panel, and admin injection fresh. */
 var oldAfter=window._rp2After;
 window._rp2After=function(){
  var result=typeof oldAfter==='function'?oldAfter.apply(this,arguments):undefined;
  if(window._rp2&&_rp2.page==='call')setTimeout(function(){drawTimers();renderEmail()},0);
  setTimeout(ensureAdmin,50);return result
 };
 var oldGo=window.gt;
 if(typeof oldGo==='function'){
  window.gt=function(){
   var result=oldGo.apply(this,arguments);setTimeout(ensureAdmin,80);return result
  }
 }
 setInterval(function(){
  if(window._rp2&&_rp2.page==='call'){
   var timer=document.getElementById('call540-dial-timer');if(timer)timer.textContent=duration540(callSeconds())
  }
 },1000);
 setTimeout(function(){ensureAdmin();if(window._rp2&&_rp2.page==='call')rerender()},0);
 setTimeout(ensureAdmin,800);

 window.TCP_CALL_V540={
  currentData:currentData,productsFor:productsFor,artworkFor:artworkFor,ordersFor:ordersFor,
  importantDatesFor:importantDatesFor,selectionSnapshot:selectionSnapshot,generateTalkingPoints:generateTalkingPoints,
  promotion:promotion,addActivity:addActivity,render:render,diagnostics:window._rp2CallDiagnostics
 };
})();
