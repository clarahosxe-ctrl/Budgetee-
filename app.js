/* =========================================================
   Utilitaires
========================================================= */
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (s,n) => { const d = parse(s); d.setDate(d.getDate()+n); return iso(d); };
const addMonths = (s,n) => {
  const d = parse(s), day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth()+n);
  const dim = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  d.setDate(Math.min(day,dim)); return iso(d);
};
const diffDays = (a,b) => Math.round((parse(a)-parse(b))/86400000);
const monthStart = s => s.slice(0,8)+'01';
const monthEnd = s => { const d = parse(s); return iso(new Date(d.getFullYear(), d.getMonth()+1, 0)); };
const weekStart = s => { const d = parse(s); const off = (d.getDay()+6)%7; d.setDate(d.getDate()-off); return iso(d); };
const uid = () => Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TODAY = iso(new Date());

/* =========================================================
   Langue et monnaie
========================================================= */
const LANGS = {fr:'Français', en:'English'};
const CURRENCIES = ['EUR','USD','GBP','CHF','CAD','AUD','JPY','MAD','TND','DZD','XOF','XAF','BRL','MXN','INR','CNY','SEK','NOK','DKK','PLN'];
let LOCALE = 'fr-FR', CUR = 'EUR', DEC = ',', nf = null;

function applyPrefs(){
  const s = db ? db.settings : {lang:'fr',currency:'EUR'};
  LANG = LANGS[s.lang] ? s.lang : 'fr';
  CUR = s.currency || 'EUR';
  LOCALE = LANG==='fr' ? 'fr-FR' : (CUR==='USD'||CUR==='CAD'||CUR==='AUD' ? 'en-US' : 'en-GB');
  try{ nf = new Intl.NumberFormat(LOCALE,{style:'currency',currency:CUR,minimumFractionDigits:0,maximumFractionDigits:(CUR==='JPY'||CUR==='XOF'||CUR==='XAF')?0:2}); }
  catch(e){ CUR = 'EUR'; nf = new Intl.NumberFormat(LOCALE,{style:'currency',currency:'EUR',minimumFractionDigits:0,maximumFractionDigits:2}); }
  DEC = (1.1).toLocaleString(LOCALE).charAt(1);
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  const fab = $('#fab'); if(fab) fab.setAttribute('aria-label', t('Ajouter'));
  document.title = 'Daylance';
  applyTheme();
}
const curSymbol = () => { try{ return nf.formatToParts(0).find(p=>p.type==='currency').value; }catch(e){ return CUR; } };
const fmt = n => nf.format(Math.round(n*100)/100);
const fmtS = n => (n>0?'+':n<0?'−':'') + fmt(Math.abs(n));
const compact = n => { const a = Math.abs(n); const s = a>=1000 ? (a/1000).toFixed(a>=10000?0:1).replace('.0','').replace('.',DEC)+'k' : String(Math.round(a)); return (n>0?'+':n<0?'−':'')+s; };
const longDate = s => parse(s).toLocaleDateString(LOCALE,{weekday:'long',day:'numeric',month:'long'});
const weekdays = () => [0,1,2,3,4,5,6].map(i => new Date(2024,0,1+i).toLocaleDateString(LOCALE,{weekday:'short'}).replace('.',''));
// accepte « 12,5 », « 12.5 », « 1 000,5 », « 1,000.50 », « −3 »
const num = v => {
  let s = String(v??'').replace(/[\s  ]/g,'').replace(/[−–]/g,'-');
  const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
  if(c>=0 && d>=0) s = c>d ? s.replace(/\./g,'').replace(',','.') : s.replace(/,/g,'');
  else s = s.replace(',','.');
  const n = parseFloat(s); return isNaN(n)?0:n;
};
const inV = n => (n||n===0) && n!=='' ? String(n).replace('.',DEC) : '';

/* =========================================================
   Apparence : classique ou « Liquid Glass » (réglable)
========================================================= */
const DEFAULT_THEME = {mode:'classic', scheme:'light', aura:true, bg:'ocean', blur:22, transparency:50, shine:60};
const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
const hexA = (h,a) => { const n = parseInt(h.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; };
const GBG = (c1,c2,c3,base) => `radial-gradient(60% 42% at 12% 10%, ${c1} 0%, transparent 70%), radial-gradient(55% 42% at 92% 34%, ${c2} 0%, transparent 70%), radial-gradient(65% 50% at 28% 96%, ${c3} 0%, transparent 70%), ${base}`;
const BGS = {
  ocean:   {name:'Océan',             base:'#EAF4FF', c:['#7DD3FC','#5EEAD4','#A5B4FC'], dbase:'#08101F', dc:['#0EA5E9','#14B8A6','#6366F1']},
  sunset:  {name:'Coucher de soleil', base:'#FFF3EA', c:['#FDBA74','#FDA4AF','#FCD34D'], dbase:'#1A0E0C', dc:['#F97316','#E11D48','#F59E0B']},
  mint:    {name:'Menthe',            base:'#EDFFF5', c:['#86EFAC','#5EEAD4','#BEF264'], dbase:'#07150F', dc:['#10B981','#14B8A6','#84CC16']},
  aurora:  {name:'Aurore',            base:'#F5F0FF', c:['#C4B5FD','#F9A8D4','#7DD3FC'], dbase:'#0E0A1E', dc:['#8B5CF6','#EC4899','#38BDF8']},
  rose:    {name:'Rose',              base:'#FFF0F5', c:['#FDA4AF','#FBCFE8','#FDE68A'], dbase:'#1A0A12', dc:['#F43F5E','#EC4899','#F59E0B']},
  graphite:{name:'Graphite',          base:'#EEF1F5', c:['#CBD5E1','#94A3B8','#E2E8F0'], dbase:'#0B0C10', dc:['#64748B','#475569','#94A3B8']},
};
// fond du thème Liquid Glass : halos colorés (« auras ») ou fond uni teinté
function glassBg(bg,dark,aura){
  if(!aura) return dark ? bg.dbase : bg.base;
  return dark ? GBG(hexA(bg.dc[0],.6),hexA(bg.dc[1],.5),hexA(bg.dc[2],.55),bg.dbase) : GBG(bg.c[0],bg.c[1],bg.c[2],bg.base);
}
if(darkMQ) (darkMQ.addEventListener ? darkMQ.addEventListener('change',()=>applyTheme()) : darkMQ.addListener(()=>applyTheme()));
function applyTheme(){
  const th = Object.assign({}, DEFAULT_THEME, db && db.settings.theme);
  const bg = BGS[th.bg] || BGS.ocean, r = document.documentElement.style, glass = th.mode==='glass';
  const dark = th.scheme==='dark' || (th.scheme==='auto' && darkMQ && darkMQ.matches);
  document.body.classList.toggle('glass', glass);
  document.body.classList.toggle('dark', !!dark);
  r.setProperty('--g-blur', th.blur+'px');
  r.setProperty('--g-a', (dark ? 0.26 - th.transparency/100*0.2 : 0.92 - th.transparency/100*0.74).toFixed(3));
  r.setProperty('--g-shine', (0.25 + th.shine/100*0.7).toFixed(3));
  r.setProperty('--g-bg', glassBg(bg,dark,th.aura!==false));
  r.setProperty('--g-base', dark ? bg.dbase : bg.base);
  const m = document.querySelector('meta[name=theme-color]'); if(m) m.content = glass ? (dark?bg.dbase:bg.base) : dark ? '#14141B' : '#FAFAFB';
}

/* =========================================================
   Données
========================================================= */
const KEY = 'budget-mobile-v1';
const COLORS = ['#5B8DEF','#0EA5E9','#06B6D4','#14B8A6','#12A66B','#84CC16','#FFC93C','#F59E0B','#FF8A4C','#FB7185','#FF5FA2','#8B5CF6'];

const DEFAULT_CATS = [
  {id:'logement',name:'Logement',emoji:'🏠',color:'#14B8A6',type:'expense'},
  {id:'courses',name:'Courses',emoji:'🛒',color:'#F59E0B',type:'expense'},
  {id:'transport',name:'Transport',emoji:'🚗',color:'#5B8DEF',type:'expense'},
  {id:'credits',name:'Crédits',emoji:'💳',color:'#0EA5E9',type:'expense'},
  {id:'abos',name:'Abonnements',emoji:'📺',color:'#84CC16',type:'expense'},
  {id:'animaux',name:'Animaux',emoji:'🐶',color:'#FF8A4C',type:'expense'},
  {id:'sante',name:'Santé',emoji:'💊',color:'#FB7185',type:'expense'},
  {id:'loisirs',name:'Loisirs',emoji:'🎉',color:'#FF5FA2',type:'expense'},
  {id:'voyages',name:'Voyages',emoji:'✈️',color:'#06B6D4',type:'expense'},
  {id:'cadeaux',name:'Cadeaux',emoji:'🎁',color:'#FFC93C',type:'expense'},
  {id:'epargne',name:'Épargne',emoji:'🐷',color:'#FF5FA2',type:'expense'},
  {id:'frais',name:'Frais',emoji:'🏦',color:'#A29EBA',type:'expense'},
  {id:'autre',name:'Autre',emoji:'✨',color:'#A29EBA',type:'expense'},
  {id:'salaire',name:'Salaire',emoji:'💼',color:'#12A66B',type:'income'},
  {id:'aides',name:'Aides',emoji:'🤝',color:'#34D399',type:'income'},
  {id:'virement',name:'Virement',emoji:'💸',color:'#12A66B',type:'income'},
  {id:'remb',name:'Remboursement',emoji:'↩️',color:'#34D399',type:'income'},
  {id:'autre-in',name:'Autre revenu',emoji:'🌟',color:'#12A66B',type:'income'},
];

// Petit exemple neutre pour découvrir l'appli
function exampleTx(){
  const m0 = monthStart(TODAY), T = [];
  const add = (type,label,amount,date,cat,rec=null,extra={}) => T.push({id:uid(),type,label,amount,date,cat,note:'',rec,ex:{},...extra});
  const monthly = {unit:'month',interval:1,end:'never'};
  add('income',t('Salaire'),2000,addMonths(m0,0).slice(0,8)+'28','salaire',monthly);
  add('expense',t('Loyer'),700,m0.slice(0,8)+'05','logement',monthly);
  add('expense',t('Courses'),70,m0.slice(0,8)+'02','courses',{unit:'week',interval:1,end:'never'});
  add('expense',t('Abonnement téléphone'),20,m0.slice(0,8)+'12','abos',monthly);
  add('expense',t('Épargne'),100,m0.slice(0,8)+'29','epargne',monthly);
  add('expense',t('Week-end'),150,addMonths(m0,1).slice(0,8)+'15','voyages');
  return T;
}

let db = null;
function detectPrefs(){
  const l = (navigator.language||'fr').toLowerCase();
  if(l.startsWith('fr')) return {lang:'fr',currency:'EUR'};
  if(l==='en-us') return {lang:'en',currency:'USD'};
  if(l==='en-gb') return {lang:'en',currency:'GBP'};
  if(l==='en-ca') return {lang:'en',currency:'CAD'};
  if(l==='en-au') return {lang:'en',currency:'AUD'};
  return {lang:'en',currency:'EUR'};
}
function freshDb(keepPrefs){
  const p = keepPrefs && db ? {lang:db.settings.lang,currency:db.settings.currency} : detectPrefs();
  return {v:1, cats:JSON.parse(JSON.stringify(DEFAULT_CATS)), tx:[], goals:[], updatedAt:Date.now(),
    settings:{startBalance:0, startDate:monthStart(TODAY), lang:p.lang, currency:p.currency, tutorialDone:false, theme:keepPrefs&&db?{...db.settings.theme}:{...DEFAULT_THEME}, home:keepPrefs&&db?JSON.parse(JSON.stringify(db.settings.home)):mergeHome(), name:keepPrefs&&db?db.settings.name:'', upcomingDays:keepPrefs&&db?db.settings.upcomingDays:2, newsSeen:NEWS_VERSION}};
}
function normalize(d){
  d.settings = d.settings || {};
  d.settings.lang = d.settings.lang || 'fr';
  d.settings.currency = d.settings.currency || 'EUR';
  if(d.settings.tutorialDone===undefined) d.settings.tutorialDone = true; // données existantes : pas de tutoriel imposé
  if(d.settings.startBalance===undefined) d.settings.startBalance = 0;
  if(!d.settings.startDate) d.settings.startDate = monthStart(TODAY);
  d.settings.theme = Object.assign({}, DEFAULT_THEME, d.settings.theme);
  d.settings.home = mergeHome(d.settings.home);
  d.settings.name = d.settings.name || '';
  d.settings.upcomingDays = Math.min(60,Math.max(1,parseInt(d.settings.upcomingDays)||2));
  d.goals = Array.isArray(d.goals) ? d.goals : [];
  d.updatedAt = d.updatedAt || 0;
  return d;
}
function load(){
  let raw = null;
  try{ raw = localStorage.getItem(KEY); }catch(e){}
  if(raw){
    try{ const d = JSON.parse(raw); if(!d.tx||!d.cats||!d.settings) throw 0; db = normalize(d); applyPrefs(); return; }
    catch(e){ try{ localStorage.setItem(KEY+'-corrompu-'+Date.now(), raw); }catch(_){} } // on garde une copie avant de repartir de zéro
  }
  db = freshDb(false); applyPrefs(); save();
}
function save(){
  db.updatedAt = Date.now();
  try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){}
  if(typeof Cloud!=='undefined' && Cloud.schedulePush) Cloud.schedulePush();
}
// remplace toutes les données sans les marquer comme « modifiées maintenant » (synchronisation)
function replaceDb(d,keepStamp){
  db = normalize(d);
  if(!keepStamp) db.updatedAt = Date.now();
  try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){}
  applyPrefs(); ui.cursor = TODAY; render();
}

/* =========================================================
   Récurrence
========================================================= */
const PRESETS = {
  none:{label:'Aucune'},
  day:{label:'Tous les jours',unit:'day',interval:1},
  week:{label:'Toutes les semaines',unit:'week',interval:1},
  biweek:{label:'Toutes les 2 semaines',unit:'week',interval:2},
  month:{label:'Tous les mois',unit:'month',interval:1},
  quarter:{label:'Tous les 3 mois',unit:'month',interval:3},
  year:{label:'Tous les ans',unit:'year',interval:1},
  custom:{label:'Personnalisée…'},
};
const UNIT_LABEL = {day:'jour(s)',week:'semaine(s)',month:'mois',year:'an(s)'};
const UNIT_PLURAL = {day:'jours',week:'semaines',month:'mois',year:'ans'};
function kindOf(rec){
  if(!rec) return 'none';
  for(const k of ['day','week','biweek','month','quarter','year'])
    if(PRESETS[k].unit===rec.unit && PRESETS[k].interval===rec.interval) return k;
  return 'custom';
}
function recLabel(rec){
  const k = kindOf(rec);
  if(k==='custom') return t('Tous les {n} {u}',{n:rec.interval,u:t(UNIT_PLURAL[rec.unit])});
  return t(PRESETS[k].label);
}
function nth(start, rec, i){
  const n = rec.interval*i;
  if(rec.unit==='day') return addDays(start,n);
  if(rec.unit==='week') return addDays(start,7*n);
  if(rec.unit==='month') return addMonths(start,n);
  return addMonths(start,12*n);
}
function expand(tx, from, to){
  const out = [];
  const items = tx.items && tx.items.length ? tx.items : null;
  const mk = (d,recurring) => {
    const base = {key:tx.id+'@'+d, gkey:tx.id+'@'+d, id:tx.id, date:d, type:tx.type, label:tx.label, amount:tx.amount, cat:tx.cat, note:tx.note||'', recurring, rec:tx.rec, items};
    if(items && tx.show==='detail') return items.map(it => ({...base, key:base.key+'#'+it.id, label:it.label||tx.label, amount:it.amount, group:tx.label}));
    return [base];
  };
  if(!tx.rec){ if(tx.date>=from && tx.date<=to) out.push(...mk(tx.date,false)); return out; }
  const r = tx.rec;
  for(let i=0;i<4000;i++){
    const d = nth(tx.date,r,i);
    if(d>to) break;
    if(r.end==='count' && i>=r.count) break;
    if(r.end==='date' && d>r.until) break;
    if(d>=from && !(tx.ex && tx.ex[d])) out.push(...mk(d,true));
  }
  return out;
}
function occurrences(from,to){
  let all = [];
  db.tx.forEach(x => { all = all.concat(expand(x,from,to)); });
  return all;
}
function netOf(list){ return list.reduce((s,o)=> s + (o.type==='income'?o.amount:-o.amount), 0); }
function sumType(list,type){ return list.filter(o=>o.type===type).reduce((s,o)=>s+o.amount,0); }
function balanceAt(date){
  const s = db.settings;
  const pts = [{date:addDays(s.startDate,-1), value:s.startBalance}].concat(s.anchors||[]);
  let a = null;
  pts.forEach(p => { if(p.date<=date && (!a || p.date>=a.date)) a = p; });
  if(!a) return s.startBalance;
  const from = addDays(a.date,1);
  return a.value + (date<from ? 0 : netOf(occurrences(from,date)));
}
function setAnchor(date,value){
  db.settings.anchors = (db.settings.anchors||[]).filter(x=>x.date!==date);
  if(value!==null) db.settings.anchors.push({date,value:Math.round(value*100)/100});
  save();
}
const catOf = (id,type) => db.cats.find(c=>c.id===id) || {id:'autre',name:'Autre',emoji:'✨',color:'#A29EBA',type};
const catName = c => t(c.name);
const sortOcc = list => list.slice().sort((a,b)=> (a.type===b.type? a.label.localeCompare(b.label,LOCALE) : a.type==='income'?-1:1));

/* =========================================================
   État de l'interface
========================================================= */
const ui = { tab:'home', view:'month', cursor: TODAY };
try{ const v = localStorage.getItem(KEY+'-view'); if(v==='week'||v==='month') ui.view = v; }catch(e){}

function toast(msg){
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(()=>el.classList.remove('show'),2200);
}

/* =========================================================
   Rendu : éléments communs
========================================================= */
function itemHtml(o){
  const c = catOf(o.cat,o.type);
  const inc = o.type==='income';
  return `<button class="item" data-act="open" data-id="${o.id}" data-date="${o.date}">
    <span class="ico" style="background:${c.color}22">${c.emoji}</span>
    <span class="meta"><b>${esc(o.label)}</b><small>${esc(catName(c))}${o.group?` · ${esc(o.group)}`:''}${o.items&&!o.group?`<span class="rec-badge">${t('{n} postes',{n:o.items.length})}</span>`:''}${o.recurring?`<span class="rec-badge">↻ ${esc(recLabel(o.rec))}</span>`:''}</small></span>
    <span class="amt num ${inc?'in':'out'}">${inc?'+':'−'}${fmt(o.amount)}</span>
  </button>`;
}

function heroHtml(from,to,period){
  const list = occurrences(from,to);
  const inc = sumType(list,'income'), exp = sumType(list,'expense');
  const day = ui.cursor, bal = balanceAt(day);
  const label = day===TODAY ? t("Solde aujourd'hui") : t('Solde au {d}',{d:longDate(day)});
  return `<div class="hero">
    <div class="lbl">${label}</div>
    <div class="big num ${bal<0?'neg-bal':''}">${fmt(bal)}</div>
    ${day===TODAY?`<button class="hero-edit" data-act="bal-open" aria-label="${t('Corriger le solde')}">✎ ${t('Corriger')}</button>`:''}
    <div class="pills">
      <div class="pill in"><small>${period==='week'?t('Entrées de la semaine'):t('Entrées du mois')}</small><b class="num">+${fmt(inc)}</b></div>
      <div class="pill out"><small>${period==='week'?t('Dépenses de la semaine'):t('Dépenses du mois')}</small><b class="num">−${fmt(exp)}</b></div>
    </div>
  </div>`;
}

function openBalance(){
  const cur = balanceAt(TODAY), has = (db.settings.anchors||[]).some(x=>x.date===TODAY);
  openSheet(1,`
    <div class="sheet-head"><h3>${t('Corriger mon solde')}</h3><button class="x" data-close="1">✕</button></div>
    <div class="note" style="margin-top:-6px">${t("Indique le solde réel de ton compte aujourd'hui. Les jours suivants se recalculent à partir de ce montant.")}</div>
    <div class="amount-wrap"><input id="b-val" type="text" inputmode="decimal" placeholder="0" value="${inV(cur)}"><span>${esc(curSymbol())}</span></div>
    <div style="text-align:center;margin:-6px 0 14px"><button type="button" class="sign-btn" data-act="bal-sign" style="width:auto;padding:0 18px;min-height:40px;font-size:14px;order:0">± ${t('Passer en négatif / positif')}</button></div>
    <button class="btn violet" data-act="bal-save">${t('Enregistrer')}</button>
    ${has?`<button class="btn ghost" style="margin-top:10px" data-act="bal-reset">${t('Supprimer ma correction')}</button>`:''}
  `);
  setTimeout(()=>{ try{ $('#b-val').focus(); $('#b-val').select(); }catch(e){} },280);
}

/* =========================================================
   Rendu : calendrier (mois / semaine)
========================================================= */
function renderCal(){
  const cur = parse(ui.cursor);
  let title;
  if(ui.view==='month'){
    title = cur.toLocaleDateString(LOCALE,{month:'long',year:'numeric'});
  }else{
    const a = weekStart(ui.cursor), b = addDays(a,6);
    const da = parse(a), db_ = parse(b);
    const sm = d => d.toLocaleDateString(LOCALE,{month:'short'});
    title = da.getMonth()===db_.getMonth()
      ? `${da.getDate()} – ${db_.getDate()} ${sm(db_)}`
      : `${da.getDate()} ${sm(da)} – ${db_.getDate()} ${sm(db_)}`;
  }
  const inPeriod = ui.view==='month' ? monthStart(ui.cursor)===monthStart(TODAY) : weekStart(ui.cursor)===weekStart(TODAY);

  let html = `<div class="top">
    <div class="ttl">
      <button class="round" data-act="prev" aria-label="${t('Précédent')}">‹</button>
      <h1>${title}</h1>
      <button class="round" data-act="next" aria-label="${t('Suivant')}">›</button>
    </div>
    <div class="seg">
      <button data-act="view" data-v="month" class="${ui.view==='month'?'on':''}">${t('Mois')}</button>
      <button data-act="view" data-v="week" class="${ui.view==='week'?'on':''}">${t('Semaine')}</button>
    </div>
  </div>`;
  if(!inPeriod) html += `<div style="text-align:center;margin:-4px 0 12px"><button class="today-btn" data-act="today">↩ ${t("Revenir à aujourd'hui")}</button></div>`;

  html += ui.view==='month' ? monthHtml() : weekHtml();
  $('#app').innerHTML = html;
}

function monthHtml(){
  const from = monthStart(ui.cursor), to = monthEnd(ui.cursor);
  const occ = occurrences(from,to);
  const byDate = {};
  occ.forEach(o => (byDate[o.date] = byDate[o.date]||[]).push(o));
  const first = parse(from);
  const lead = (first.getDay()+6)%7;
  const dim = parse(to).getDate();

  let h = heroHtml(from,to,'month');
  h += `<div class="card"><div class="wd">${weekdays().map(w=>`<span>${w}</span>`).join('')}</div><div class="grid">`;
  for(let i=0;i<lead;i++) h += `<div class="day blank"></div>`;
  for(let d=1; d<=dim; d++){
    const date = `${from.slice(0,8)}${pad(d)}`;
    const list = byDate[date] || [];
    const net = netOf(list);
    const hasIn = list.some(o=>o.type==='income');
    const sorted = sortOcc(list);
    const dots = sorted.slice(0,3).map(o => `<i style="background:${o.type==='income'?'var(--green)':catOf(o.cat,o.type).color}"></i>`).join('');
    h += `<button class="day ${date===TODAY?'today':''} ${date===ui.cursor?'sel':''} ${hasIn?'has-in':''}" data-act="day" data-date="${date}">
      <span class="n">${d}</span>
      <span class="dots">${dots}</span>
      <span class="net num ${net>0?'pos':'neg'}">${list.length?compact(net):''}</span>
    </button>`;
  }
  h += `</div></div>`;
  h += dayBlock(ui.cursor, true);
  return h;
}

function dayBlock(date,head){
  const list = sortOcc(occurrences(date,date));
  const net = netOf(list);
  let h = '';
  if(head) h += `<div class="sec-title"><h2>${longDate(date)}</h2>${list.length?`<span class="num ${net>=0?'pos':'neg'}">${fmtS(net)}</span>`:''}</div>`;
  if(!list.length){
    h += `<div class="empty">${db.tx.length ? t('Rien de prévu ce jour') : t('Rien pour le moment. Touche + pour ajouter ta première ligne.')}</div>`;
  }else h += list.map(itemHtml).join('');
  h += `<button class="add-inline" data-act="add" data-date="${date}">+ ${t('Ajouter ce jour-là')}</button>`;
  return h;
}

function weekHtml(){
  const a = weekStart(ui.cursor), b = addDays(a,6);
  const occ = occurrences(a,b);
  let h = heroHtml(a,b,'week');
  for(let i=0;i<7;i++){
    const date = addDays(a,i);
    const list = sortOcc(occ.filter(o=>o.date===date));
    const net = netOf(list);
    const d = parse(date);
    h += `<div class="wk-day">
      <div class="wk-head ${date===TODAY?'today':''}">
        <h3>${d.toLocaleDateString(LOCALE,{weekday:'long',day:'numeric',month:'short'})}${date===TODAY?' · '+t("aujourd'hui"):''}</h3>
        ${list.length?`<span class="net num ${net>=0?'pos':'neg'}">${fmtS(net)}</span>`:''}
        <button class="wk-add" data-act="add" data-date="${date}" aria-label="${t('Ajouter')}">+</button>
      </div>
      ${list.length? list.map(itemHtml).join('') : `<div class="wk-empty">${t('Rien de prévu')}</div>`}
    </div>`;
  }
  return h;
}

/* =========================================================
   Rendu : répartition
========================================================= */
function groupsPanel(occ){
  const seen = {}, groups = [];
  occ.filter(o=>o.items).forEach(o=>{ if(!seen[o.gkey]){ seen[o.gkey]=1; const x = db.tx.find(y=>y.id===o.id); groups.push({t:x,date:o.date,items:o.items}); } });
  if(!groups.length) return `<div class="panel"><h2>${t('Détail des charges')}</h2><div class="note" style="margin-bottom:0">${t('Aucune ligne détaillée ce mois-ci. Ouvre une ligne et ajoute des postes dans « Détail ».')}</div></div>`;
  return groups.map(g=>{ const c = catOf(g.t.cat,g.t.type); const tot = g.items.reduce((s,i)=>s+i.amount,0);
    return `<div class="panel"><h2 style="display:flex;justify-content:space-between;gap:8px"><span>${c.emoji} ${esc(g.t.label)}</span><span class="num">${fmt(tot)}</span></h2>
      ${g.items.map(i=>`<div class="bar-row"><div class="bar-top"><span class="nm">${esc(i.label||t('Sans nom'))}</span><span class="pc">${Math.round(i.amount/tot*100)}%</span><span class="num">${fmt(i.amount)}</span></div><div class="bar"><i style="width:${Math.max(3,i.amount/tot*100)}%;background:${c.color}"></i></div></div>`).join('')}
      <button class="add-inline" style="margin:6px 0 0" data-act="open" data-id="${g.t.id}" data-date="${g.date}">${t('Modifier le détail')}</button></div>`; }).join('');
}
function renderStats(){
  const from = monthStart(ui.cursor), to = monthEnd(ui.cursor);
  const occ = occurrences(from,to);
  const cur = parse(from);
  const title = cur.toLocaleDateString(LOCALE,{month:'long',year:'numeric'});
  const inc = sumType(occ,'income'), exp = sumType(occ,'expense');

  const group = type => {
    const g = {};
    occ.filter(o=>o.type===type).forEach(o => { g[o.cat] = (g[o.cat]||0)+o.amount; });
    const total = Object.values(g).reduce((s,v)=>s+v,0);
    return Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([id,v])=>({c:catOf(id,type),v,p:total?v/total:0}));
  };
  const bars = (rows,green) => rows.length ? rows.map(r => `
    <div class="bar-row">
      <div class="bar-top"><span class="ico" style="background:${r.c.color}22">${r.c.emoji}</span><span class="nm">${esc(catName(r.c))}</span><span class="pc">${Math.round(r.p*100)}%</span><span class="num">${fmt(r.v)}</span></div>
      <div class="bar"><i style="width:${Math.max(3,r.p*100)}%;background:${green?'var(--green)':r.c.color}"></i></div>
    </div>`).join('') : `<div class="empty" style="margin:0">${t('Aucune donnée ce mois-ci')}</div>`;

  // projection du solde sur 12 mois
  const pts = [];
  for(let i=0;i<12;i++){
    const d = addMonths(from,i);
    pts.push({label:parse(d).toLocaleDateString(LOCALE,{month:'short'}).replace('.',''), v:balanceAt(monthEnd(d))});
  }
  const W=320,H=130,P=8;
  const min = Math.min(0,...pts.map(p=>p.v)), max = Math.max(0,...pts.map(p=>p.v));
  const span = (max-min)||1;
  const X = i => P + i*(W-2*P)/(pts.length-1);
  const Y = v => H-18 - (v-min)/span*(H-34);
  const line = pts.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${X(pts.length-1)},${Y(min)} L${X(0)},${Y(min)} Z`;
  const lowest = pts.reduce((m,p)=>p.v<m.v?p:m,pts[0]);

  $('#app').innerHTML = `
    <div class="top"><div class="ttl">
      <button class="round" data-act="prev" aria-label="${t('Précédent')}">‹</button>
      <h1>${title}</h1>
      <button class="round" data-act="next" aria-label="${t('Suivant')}">›</button>
    </div></div>
    <div class="mini-sum">
      <div style="background:var(--green-soft);color:var(--green)"><small>${t('Entrées')}</small><b class="num">+${fmt(inc)}</b></div>
      <div style="background:var(--pink-soft);color:#D9387F"><small>${t('Dépenses')}</small><b class="num">−${fmt(exp)}</b></div>
      <div style="background:var(--yellow-soft);color:#8A6500"><small>${t('Reste')}</small><b class="num">${fmtS(inc-exp)}</b></div>
    </div>
    <div class="panel"><h2>${t('Dépenses par catégorie')}</h2>${bars(group('expense'),false)}</div>
    ${groupsPanel(occ)}
    <div class="panel"><h2>${t('Entrées par catégorie')}</h2>${bars(group('income'),true)}</div>
    <div class="panel">
      <h2>${t('Solde sur 12 mois')}</h2>
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ink)" stop-opacity=".12"/><stop offset="1" style="stop-color:var(--ink)" stop-opacity="0"/></linearGradient></defs>
        ${min<0?`<line x1="${P}" x2="${W-P}" y1="${Y(0)}" y2="${Y(0)}" stroke="#FF5FA2" stroke-width="1" stroke-dasharray="4 4"/>`:''}
        <path d="${area}" fill="url(#g)"/>
        <path d="${line}" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.v)}" r="3" style="fill:${p.v<0?'#FF5FA2':'var(--ink)'}"/>`).join('')}
        ${pts.map((p,i)=> i%2===0?`<text x="${X(i)}" y="${H-2}" font-size="9" fill="#A29EBA" text-anchor="middle">${p.label}</text>`:'').join('')}
      </svg>
      <div class="note" style="margin-bottom:0">${t('Point le plus bas :')} <b class="num" style="color:${lowest.v<0?'#D9387F':'var(--green)'}">${fmt(lowest.v)}</b> (${lowest.label})</div>
    </div>`;
}



/* =========================================================
   Nouveautés (bandeau en haut de l'accueil)
========================================================= */
const NEWS_VERSION = '2026-10-14';
const NEWS = [
  {txt:"L'application s'appelle désormais Daylance."},
  {txt:'Nouveau logo de l\'application.'},
  {txt:'Liquid Glass aussi en mode sombre, avec ou sans « auras » lumineuses (Réglages → Apparence).'},
  {txt:'Mode sombre pour le thème classique : clair, sombre ou automatique.'},
  {txt:'Nouvelle page Accueil personnalisable : reste à vivre, alertes, crédits, objectifs d\'épargne.'},
  {txt:'Section « Mon compte » : retrouve tes données sur tous tes appareils avec ton e-mail.'},
  {txt:'Tutoriel de démarrage mis à jour avec toutes les fonctionnalités.'},
];
function newsHtml(){
  if(db.settings.newsSeen===NEWS_VERSION) return '';
  return `<div class="news" role="status">
    <div class="news-top"><b>✨ ${t('Nouveautés')}</b><button class="news-x" data-act="news-close" aria-label="${t('Fermer')}">✕</button></div>
    <ul>${NEWS.slice(0,4).map(n=>`<li>${t(n.txt)}</li>`).join('')}</ul>
    <button class="linkbtn" data-act="news-open">${t('Tout voir')}</button>
  </div>`;
}
function openNews(){
  openSheet(1,`<div class="sheet-head"><h3>✨ ${t('Nouveautés')}</h3><button class="x" data-close="1">✕</button></div>
    <div class="note" style="margin-top:-6px">${t("Les dernières évolutions de l'application.")}</div>
    <ul class="news-list">${NEWS.map(n=>`<li>${t(n.txt)}</li>`).join('')}</ul>
    <button class="btn violet" data-close="1">${t('Compris')}</button>`);
}

/* =========================================================
   Accueil (cartes personnalisables)
========================================================= */
const HOME_WIDGETS = [
  {id:'hello',    name:'Bonjour et solde'},
  {id:'runway',   name:'Reste à vivre'},
  {id:'upcoming', name:'Prochains mouvements'},
  {id:'alerts',   name:'Alertes'},
  {id:'credits',  name:'Suivi des crédits'},
  {id:'goals',    name:"Objectifs d'épargne"},
  {id:'charts',   name:'Mini-graphiques'},
];
function mergeHome(cur){
  const ids = HOME_WIDGETS.map(w=>w.id), out = [];
  (cur||[]).forEach(c => { if(ids.includes(c.id) && !out.find(o=>o.id===c.id)) out.push({id:c.id,on:c.on!==false}); });
  ids.forEach(id => { if(!out.find(o=>o.id===id)) out.push({id,on:true}); });
  return out;
}
const shortDate = s => parse(s).toLocaleDateString(LOCALE,{day:'numeric',month:'short'}).replace(/\.$/,'');
const dayLabel = d => d===TODAY ? t("Aujourd'hui") : d===addDays(TODAY,1) ? t('Demain') : longDate(d);

// dates d'une ligne qui se répète (hors occurrences supprimées) + état d'avancement
function seriesInfo(x){
  const r = x.rec; if(!r) return null;
  const dates = [];
  for(let i=0;i<4000;i++){
    const d = nth(x.date,r,i);
    if(r.end==='count' && i>=r.count) break;
    if(r.end==='date' && d>r.until) break;
    if(r.end==='never' && d>addMonths(TODAY,1200)) break;
    if(!(x.ex && x.ex[d])) dates.push(d);
    if(r.end==='never' && d>TODAY && dates.filter(y=>y>TODAY).length>=2) break;
  }
  const paid = dates.filter(d=>d<=TODAY).length, rest = dates.filter(d=>d>TODAY);
  return {x, total:r.end==='never'?null:dates.length, paid, remaining:r.end==='never'?null:rest.length, next:rest[0]||null, last:r.end==='never'?null:dates[dates.length-1]};
}
function creditsInfo(){
  return db.tx.filter(x=>x.cat==='credits' && x.type==='expense' && x.rec).map(seriesInfo)
    .filter(i=>i && (i.remaining===null || i.remaining>0)).sort((a,b)=>(a.last||'9999').localeCompare(b.last||'9999'));
}

function wHello(){
  const h = new Date().getHours();
  const g = h<5 ? t('Bonsoir') : h<12 ? t('Bonjour') : h<18 ? t('Bon après-midi') : t('Bonsoir');
  const bal = balanceAt(TODAY);
  return `<h1 class="page" style="margin-bottom:2px">${g}${db.settings.name?' '+esc(db.settings.name):''}</h1>
    <div class="note" style="margin:0 2px 12px;text-transform:capitalize">${longDate(TODAY)}</div>
    <div class="hero">
      <div class="lbl">${t("Solde aujourd'hui")}</div>
      <div class="big num ${bal<0?'neg-bal':''}">${fmt(bal)}</div>
      <button class="hero-edit" data-act="bal-open" aria-label="${t('Corriger le solde')}">✎ ${t('Corriger')}</button>
      <div class="quick">
        <button class="qbtn out" data-act="quick" data-type="expense">− ${t('Dépense')}</button>
        <button class="qbtn in" data-act="quick" data-type="income">+ ${t('Entrée')}</button>
      </div>
    </div>`;
}
function wRunway(){
  const end = monthEnd(TODAY), proj = balanceAt(end), left = Math.max(1,diffDays(end,TODAY));
  return `<div class="panel"><h2>${t('Reste à vivre')}</h2>
    <div class="kpi num ${proj<0?'neg-bal':''}">${fmt(proj)}</div>
    <div class="sub">${proj>=0
      ? t("soit {x} par jour jusqu'au {d}",{x:'<b>'+fmt(proj/left)+'</b>',d:shortDate(end)})
      : t('Tu seras à découvert au {d}. Pense à réduire tes dépenses.',{d:shortDate(end)})}</div>
    <div class="sub" style="color:var(--ink-3)">${t('Solde prévu au {d}, avec toutes tes lignes déjà prévues.',{d:shortDate(end)})}</div>
  </div>`;
}
function wUpcoming(){
  const n = db.settings.upcomingDays || 2;
  const occ = occurrences(TODAY,addDays(TODAY,n-1)).sort((a,b)=>a.date.localeCompare(b.date) || (a.type===b.type?0:a.type==='income'?-1:1));
  const range = n===1 ? t("Aujourd'hui seulement") : n===2 ? t("Aujourd'hui et demain") : t("Aujourd'hui et les {n} jours suivants",{n:n-1});
  let body;
  if(!occ.length) body = `<div class="sub">${t('Rien de prévu sur cette période.')}</div>`;
  else{
    const days = {}; occ.forEach(o=>(days[o.date]=days[o.date]||[]).push(o));
    body = Object.keys(days).map((d,i)=>`<div class="up-head ${i?'':'first'}"><span style="text-transform:capitalize">${dayLabel(d)}</span><span class="num ${netOf(days[d])>=0?'pos':'neg'}">${fmtS(netOf(days[d]))}</span></div>${days[d].map(itemHtml).join('')}`).join('');
  }
  return `<div class="panel"><h2>${t('Prochains mouvements')}</h2>
    <div class="up-ctl"><span>${range}</span>
      <span class="stepper"><button data-act="up-days" data-d="-1" ${n<=1?'disabled':''} aria-label="${t('Moins de jours')}">−</button><b class="num">${n} ${n>1?t('jours'):t('jour')}</b><button data-act="up-days" data-d="1" ${n>=60?'disabled':''} aria-label="${t('Plus de jours')}">+</button></span></div>
    ${body}
    <button class="add-inline" style="margin:8px 0 0" data-act="goto-cal">${t('Voir le calendrier')}</button></div>`;
}
function wAlerts(){
  const H = 60, base = balanceAt(TODAY), occ = occurrences(addDays(TODAY,1),addDays(TODAY,H));
  const by = {}; occ.forEach(o=>(by[o.date]=by[o.date]||[]).push(o));
  let run = base, low = {v:base,d:TODAY}, firstNeg = null;
  for(let i=1;i<=H;i++){ const d = addDays(TODAY,i); run += netOf(by[d]||[]); if(run<low.v) low = {v:run,d}; if(run<0 && !firstNeg && base>=0) firstNeg = d; }
  const items = [];
  if(base<0) items.push(['bad',t("Ton solde est négatif aujourd'hui ({x}).",{x:fmt(base)})]);
  else if(firstNeg) items.push(['bad',t('Ton solde passera sous zéro le {d} (jusqu\'à {x}).',{d:longDate(firstNeg),x:fmt(low.v)})]);
  else if(low.d!==TODAY && low.v<base) items.push(['info',t('Point le plus bas dans les {n} jours : {x} le {d}.',{n:H,x:fmt(low.v),d:longDate(low.d)})]);
  const monthExp = sumType(occurrences(monthStart(TODAY),monthEnd(TODAY)),'expense');
  const near = occ.filter(o=>o.type==='expense' && o.date<=addDays(TODAY,14) && monthExp>0 && o.amount>=0.25*monthExp).sort((a,b)=>b.amount-a.amount)[0];
  if(near) items.push(['warn',t('Gros paiement le {d} : {l} ({x}).',{d:longDate(near.date),l:esc(near.label),x:fmt(near.amount)})]);
  creditsInfo().filter(i=>i.last && i.last>TODAY && i.last<=addDays(TODAY,H)).forEach(i=>items.push(['good',t('Dernière mensualité de « {l} » le {d}.',{l:esc(i.x.label),d:longDate(i.last)})]));
  if(!items.length) items.push(['good',t('Rien à signaler pour les 60 prochains jours.')]);
  const mark = {bad:'!',warn:'!',info:'i',good:'✓'};
  return `<div class="panel"><h2>${t('Alertes')}</h2>${items.map(([k,m])=>`<div class="alert"><i class="${k}">${mark[k]}</i><span>${m}</span></div>`).join('')}</div>`;
}
function wCredits(){
  const list = creditsInfo();
  let body;
  if(!list.length) body = `<div class="sub">${t("Aucun crédit en cours. Les lignes qui se répètent dans la catégorie « Crédits » apparaissent ici.")}</div>`;
  else{
    const due = list.reduce((s,i)=>s+(i.remaining||0)*i.x.amount,0);
    body = `<div class="sub" style="margin:-4px 0 10px">${t('Mensualités restantes à payer : {x}',{x:'<b>'+fmt(due)+'</b>'})}</div>` + list.map(i=>{
      const p = i.total ? Math.min(1,i.paid/i.total) : 0;
      return `<button class="credit" data-act="open" data-id="${i.x.id}" data-date="${i.next||i.x.date}">
        <span class="row-top"><b>${esc(i.x.label)}</b><span class="num">${fmt(i.x.amount)} / ${t('mois')}</span></span>
        ${i.total?`<span class="bar"><i style="width:${Math.max(3,p*100)}%;background:var(--green)"></i></span>
        <small>${t('{a} / {b} mensualités payées',{a:i.paid,b:i.total})} · ${t('fin le {d}',{d:shortDate(i.last)+' '+parse(i.last).getFullYear()})}</small>`:`<small>${t('Sans date de fin')}</small>`}
      </button>`; }).join('');
  }
  return `<div class="panel"><h2>${t('Suivi des crédits')}</h2>${body}</div>`;
}
function wGoals(){
  const cards = db.goals.map(g=>{
    const p = g.target>0 ? Math.min(1,g.saved/g.target) : 0, rest = Math.max(0,g.target-g.saved), done = rest<=0;
    let hint = '';
    if(done) hint = t('Objectif atteint !');
    else if(g.date && g.date>TODAY){ const m = Math.max(1,Math.ceil(diffDays(g.date,TODAY)/30.4)); hint = t('≈ {x} par mois jusqu\'au {d}',{x:fmt(rest/m),d:shortDate(g.date)+' '+parse(g.date).getFullYear()}); }
    else hint = t('Il manque {x}',{x:fmt(rest)});
    return `<div class="goal">
      <button class="goal-main" data-act="goal-edit" data-id="${g.id}">
        <span class="ico" style="background:var(--yellow-soft)">${esc(g.emoji||'🎯')}</span>
        <span class="meta"><b>${esc(g.name)}</b><small class="num">${fmt(g.saved)} / ${fmt(g.target)} · ${Math.round(p*100)}%</small>
          <span class="bar" style="margin-top:6px"><i style="width:${Math.max(p?3:0,p*100)}%;background:${done?'var(--green)':'var(--yellow)'}"></i></span>
          <small>${hint}</small></span>
      </button>
      <button class="wk-add" data-act="goal-add" data-id="${g.id}" aria-label="${t('Ajouter une somme')}">+</button>
    </div>`; }).join('');
  return `<div class="panel"><h2>${t("Objectifs d'épargne")}</h2>
    ${cards || `<div class="sub">${t("Aucun objectif pour l'instant. Crée-en un : voyage, achat, coussin de sécurité…")}</div>`}
    <button class="add-inline" style="margin:10px 0 0" data-act="goal-new">+ ${t('Nouvel objectif')}</button></div>`;
}
function donutSvg(rows,size,sw){
  const R = (size-sw)/2, C = 2*Math.PI*R, c = size/2; let off = 0;
  const arcs = rows.map(r=>{ const len = Math.max(0.1,r.p*C-1.6); const a = `<circle cx="${c}" cy="${c}" r="${R}" stroke="${r.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`; off += r.p*C; return a; }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none" style="flex:none"><g transform="rotate(-90 ${c} ${c})">${arcs}</g></svg>`;
}
function wCharts(){
  // courbe du solde sur 30 jours
  const N = 30, base = balanceAt(TODAY), by = {};
  occurrences(addDays(TODAY,1),addDays(TODAY,N-1)).forEach(o=>(by[o.date]=by[o.date]||[]).push(o));
  const pts = [base]; for(let i=1;i<N;i++) pts.push(pts[i-1]+netOf(by[addDays(TODAY,i)]||[]));
  const W=320,H=76,P=6, min = Math.min(0,...pts), max = Math.max(0,...pts), span = (max-min)||1;
  const X = i => P + i*(W-2*P)/(N-1), Y = v => H-6 - (v-min)/span*(H-14);
  const line = pts.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const spark = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible">
    ${min<0?`<line x1="${P}" x2="${W-P}" y1="${Y(0)}" y2="${Y(0)}" stroke="#FF5FA2" stroke-width="1" stroke-dasharray="4 4"/>`:''}
    <path d="${line} L${X(N-1)},${Y(min)} L${X(0)},${Y(min)} Z" style="fill:var(--ink)" fill-opacity=".08"/>
    <path d="${line}" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${X(0)}" cy="${Y(base)}" r="3.5" fill="#FF5FA2"/></svg>`;
  // anneau des dépenses du mois
  const occ = occurrences(monthStart(TODAY),monthEnd(TODAY)).filter(o=>o.type==='expense'), g = {};
  occ.forEach(o=>{ g[o.cat] = (g[o.cat]||0)+o.amount; });
  const total = Object.values(g).reduce((a,b)=>a+b,0);
  let rows = Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([id,v])=>({c:catOf(id,'expense'),v,p:total?v/total:0}));
  if(rows.length>5){ const rest = rows.slice(4).reduce((a,r)=>a+r.v,0); rows = rows.slice(0,4).concat([{c:{name:'Autre',emoji:'✨',color:'#A29EBA'},v:rest,p:total?rest/total:0}]); }
  rows.forEach(r=>r.color = r.c.color);
  const donut = rows.length ? `<div style="display:flex;align-items:center;gap:14px">${donutSvg(rows,104,18)}
    <div style="flex:1;min-width:0">${rows.map(r=>`<div class="leg"><i style="background:${r.color}"></i><span class="nm">${esc(catName(r.c))}</span><b class="num">${Math.round(r.p*100)}%</b></div>`).join('')}</div></div>`
    : `<div class="sub">${t('Aucune dépense ce mois-ci.')}</div>`;
  return `<div class="panel"><h2>${t('Solde sur 30 jours')}</h2>${spark}</div>
    <div class="panel"><h2>${t('Dépenses du mois')}</h2>${donut}</div>`;
}
const WIDGET_FN = {hello:wHello, runway:wRunway, upcoming:wUpcoming, alerts:wAlerts, credits:wCredits, goals:wGoals, charts:wCharts};
function renderHome(){
  let h = newsHtml() + db.settings.home.filter(x=>x.on).map(x=>WIDGET_FN[x.id]()).join('');
  if(!h) h = `<h1 class="page">${t('Accueil')}</h1><div class="empty">${t("Toutes les cartes sont masquées. Touche « Personnaliser l'accueil » pour les réafficher.")}</div>`;
  $('#app').innerHTML = h + `<button class="add-inline" data-act="home-cfg">⚙ ${t("Personnaliser l'accueil")}</button>`;
}
function openHomeCfg(){
  const keep = $('#sh1').scrollTop, list = db.settings.home;
  openSheet(1,`<div class="sheet-head"><h3>${t("Personnaliser l'accueil")}</h3><button class="x" data-close="1">✕</button></div>
    <div class="note" style="margin-top:-6px">${t("Affiche ou masque les cartes, et change leur ordre avec les flèches.")}</div>
    ${list.map((w,i)=>`<div class="cfg-row">
      <button class="tg ${w.on?'on':''}" data-act="home-toggle" data-id="${w.id}" aria-label="${t('Afficher')}"></button>
      <span class="meta"><b>${t(HOME_WIDGETS.find(x=>x.id===w.id).name)}</b></span>
      <button class="mv" data-act="home-move" data-id="${w.id}" data-dir="-1" ${i===0?'disabled':''} aria-label="${t('Monter')}">▲</button>
      <button class="mv" data-act="home-move" data-id="${w.id}" data-dir="1" ${i===list.length-1?'disabled':''} aria-label="${t('Descendre')}">▼</button></div>`).join('')}
    <button class="btn violet" data-close="1" style="margin-top:14px">${t('Terminé')}</button>`);
  $('#sh1').scrollTop = keep;
}

/* ---------- objectifs d'épargne ---------- */
let GF = null;
function openGoal(id){
  const ex = id && db.goals.find(g=>g.id===id);
  GF = ex ? {...ex} : {id:null,name:'',emoji:'🎯',target:'',saved:0,date:''};
  openSheet(1,`<div class="sheet-head"><h3>${ex?t("Modifier l'objectif"):t('Nouvel objectif')}</h3><button class="x" data-close="1">✕</button></div>
    <div class="row2">
      <label class="field" style="flex:0 0 84px"><span>${t('Emoji')}</span><input id="g-emoji" type="text" maxlength="4" value="${esc(GF.emoji)}" style="text-align:center;font-size:24px"></label>
      <label class="field"><span>${t('Nom')}</span><input id="g-name" type="text" value="${esc(GF.name)}" placeholder="${t('Ex. Voyage Mexique')}" autocomplete="off"></label>
    </div>
    <div class="row2">
      <label class="field"><span>${t('Objectif')} (${esc(curSymbol())})</span><input id="g-target" type="text" inputmode="decimal" placeholder="0" value="${inV(GF.target)}"></label>
      <label class="field"><span>${t('Déjà épargné')} (${esc(curSymbol())})</span><input id="g-saved" type="text" inputmode="decimal" placeholder="0" value="${inV(GF.saved)}"></label>
    </div>
    <label class="field"><span>${t('Date visée (facultatif)')}</span><input id="g-date" type="date" value="${GF.date||''}"></label>
    <button class="btn violet" data-act="goal-save">${t('Enregistrer')}</button>
    ${ex?`<button class="btn del" style="margin-top:10px" data-act="goal-del">${t("Supprimer l'objectif")}</button>`:''}`);
}
function openGoalAdd(id){
  const g = db.goals.find(x=>x.id===id); if(!g) return;
  GF = {id};
  openSheet(1,`<div class="sheet-head"><h3>${esc(g.emoji||'🎯')} ${esc(g.name)}</h3><button class="x" data-close="1">✕</button></div>
    <div class="note" style="margin-top:-6px">${t('Ajoute la somme que tu viens de mettre de côté. Tu peux aussi retirer un montant (négatif).')}</div>
    <div class="amount-wrap"><input id="ga-val" type="text" inputmode="decimal" placeholder="0"><span>${esc(curSymbol())}</span></div>
    <div style="text-align:center;margin:-6px 0 14px"><button type="button" class="sign-btn" data-act="gadd-sign" style="width:auto;padding:0 18px;min-height:40px;font-size:14px;order:0">± ${t('Passer en négatif / positif')}</button></div>
    <button class="btn green" data-act="gadd-save">${t('Ajouter')}</button>`);
  setTimeout(()=>{ try{ $('#ga-val').focus(); }catch(e){} },280);
}

/* =========================================================
   Rendu : réglages
========================================================= */
function accountPanel(){
  const on = typeof Cloud!=='undefined' && Cloud.enabled;
  const u = on ? Cloud.user : null;
  if(!u) return `<div class="panel">
      <h2>${t('Mon compte')}</h2>
      <div class="note">${t("Crée un compte avec ton e-mail pour retrouver tes données sur n'importe quel appareil, même si tu perds ou changes de téléphone.")}</div>
      ${on?'':`<div class="note soon">${t("Bientôt disponible : les comptes ne sont pas encore activés sur cette version. En attendant, tes données restent sur cet appareil.")}</div>`}
      <button class="btn violet" data-act="auth-open" data-mode="signup">${t('Créer un compte')}</button>
      <button class="btn ghost" data-act="auth-open" data-mode="signin" style="margin-top:8px">${t('Se connecter')}</button>
    </div>`;
  const st = Cloud.error ? `<span class="neg" style="color:var(--danger)">${t('Erreur de synchronisation')}</span>` : Cloud.syncing ? t('Synchronisation…') : (Cloud.lastSync ? t('Sauvegardé en ligne à {h}',{h:new Date(Cloud.lastSync).toLocaleTimeString(LOCALE,{hour:'2-digit',minute:'2-digit'})}) : t('Connecté'));
  return `<div class="panel">
      <h2>${t('Mon compte')}</h2>
      <div class="acct"><span class="acct-ico">👤</span><span class="meta"><b>${esc(u.email||'')}</b><small>${st}</small></span></div>
      ${u.email && !u.emailVerified?`<div class="note" style="margin:10px 0 0">${t("Ton e-mail n'est pas encore confirmé. Ouvre le message que nous t'avons envoyé (pense aux spams).")} <button class="linkbtn" data-act="auth-verify">${t('Renvoyer le message')}</button></div>`:''}
      <button class="btn ghost" data-act="auth-sync" style="margin-top:12px">↻ ${t('Sauvegarder maintenant')}</button>
      <button class="btn ghost" data-act="auth-out" style="margin-top:8px">${t('Se déconnecter')}</button>
      <button class="linkbtn danger" data-act="auth-delete" style="margin:12px auto 0;display:block">${t('Supprimer mon compte en ligne')}</button>
    </div>`;
}
function prefsSelects(){
  return `<div class="row2">
    <label class="field"><span>${t('Langue')}</span><select data-pref="lang">${Object.entries(LANGS).map(([k,n])=>`<option value="${k}" ${k===db.settings.lang?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="field"><span>${t('Monnaie')}</span><select data-pref="currency">${CURRENCIES.map(c=>{ let n=c; try{ n = c+' — '+new Intl.DisplayNames(LOCALE,{type:'currency'}).of(c); }catch(e){} return `<option value="${c}" ${c===db.settings.currency?'selected':''}>${esc(n)}</option>`; }).join('')}</select></label>
  </div>`;
}
function themePanel(){
  const th = db.settings.theme, glass = th.mode==='glass';
  const dark = document.body.classList.contains('dark');
  const slider = (k,label,max) => `<label class="slider"><span>${label}<b id="v-${k}">${th[k]}</b></span><input type="range" min="0" max="${max}" value="${th[k]}" data-theme-range="${k}"></label>`;
  return `<div class="panel">
    <h2>${t('Apparence')}</h2>
    <div class="type-seg neutral">
      <button data-theme-mode="classic" class="${glass?'':'on'}">${t('Classique')}</button>
      <button data-theme-mode="glass" class="${glass?'on':''}">${t('Liquid Glass')}</button>
    </div>
    <span class="lbl2">${t('Mode')}</span>
    <div class="type-seg neutral" style="margin-bottom:8px">
      ${[['light','Clair'],['dark','Sombre'],['auto','Automatique']].map(([k,l])=>`<button data-theme-scheme="${k}" class="${th.scheme===k?'on':''}">${t(l)}</button>`).join('')}
    </div>
    <div class="note" style="margin-bottom:${glass?14:0}px">${t('Automatique suit le réglage de ton téléphone.')}</div>
    ${glass?`
    <span class="lbl2">${t('Fond')}</span>
    <div class="bgs">${Object.entries(BGS).map(([k,b])=>`<button class="bgsw ${k===th.bg?'on':''}" data-bg="${k}" style="background:${glassBg(b,dark,th.aura!==false)}" aria-label="${t(b.name)}"><i>${t(b.name)}</i></button>`).join('')}</div>
    <div class="cfg-row" style="border-top:1px solid var(--line);margin-top:-2px">
      <button class="tg ${th.aura!==false?'on':''}" data-theme-aura="1" aria-label="${t('Auras lumineuses')}"></button>
      <span class="meta"><b>${t('Auras lumineuses')}</b><small style="display:block;color:var(--ink-2);font-size:12px">${t('Halos de couleur derrière le verre. Désactivés : fond uni.')}</small></span>
    </div>
    ${slider('transparency',t('Transparence'),100)}
    ${slider('blur',t('Flou'),40)}
    ${slider('shine',t('Reflets'),100)}
    <button class="btn ghost" data-act="theme-reset" style="margin-top:4px">${t("Réinitialiser l'apparence")}</button>`:''}
  </div>`;
}
function renderSettings(){
  const catRow = c => `<button class="set-item" data-act="cat-edit" data-id="${c.id}">
    <span class="ico" style="background:${c.color}22;width:36px;height:36px;font-size:17px;border-radius:12px">${c.emoji}</span>
    <span class="meta"><b>${esc(catName(c))}</b></span><span style="color:var(--ink-3)">›</span></button>`;
  const cloud = typeof Cloud!=='undefined' && Cloud.enabled;
  $('#app').innerHTML = `
    <h1 class="page">${t('Réglages')}</h1>
    ${accountPanel()}
    <div class="panel">
      <h2>${t("Page d'accueil")}</h2>
      <label class="field"><span>${t('Ton prénom (facultatif)')}</span><input id="s-name" type="text" value="${esc(db.settings.name)}" autocomplete="given-name" placeholder="${t('Pour te dire bonjour')}"></label>
      <button class="btn ghost" data-act="home-cfg">${t("Personnaliser l'accueil")}</button>
    </div>
    ${themePanel()}
    <div class="panel">
      <h2>${t('Langue et monnaie')}</h2>
      ${prefsSelects()}
      <div class="note" style="margin-bottom:0">${t('Changer la monnaie modifie seulement le symbole : les montants ne sont pas convertis.')}</div>
    </div>
    <div class="panel">
      <h2>${t('Catégories de dépenses')}</h2>
      ${db.cats.filter(c=>c.type==='expense').map(catRow).join('')}
      <button class="add-inline" style="margin:12px 0 0" data-act="cat-new" data-type="expense">+ ${t('Nouvelle catégorie de dépense')}</button>
    </div>
    <div class="panel">
      <h2>${t("Catégories d'entrées")}</h2>
      ${db.cats.filter(c=>c.type==='income').map(catRow).join('')}
      <button class="add-inline" style="margin:12px 0 0;color:var(--green);background:var(--green-soft)" data-act="cat-new" data-type="income">+ ${t("Nouvelle catégorie d'entrée")}</button>
    </div>
    <div class="panel">
      <h2>${t('Sauvegarde')}</h2>
      <div class="note">${cloud ? t('Avec un compte, tes données sont sauvegardées en ligne. Tu peux aussi exporter un fichier de secours.') : t("Tes données restent sur cet appareil. Exporte-les régulièrement pour ne rien perdre, ou pour les passer d'un appareil à l'autre.")}</div>
      <button class="btn ghost" data-act="export">⬇ ${t('Exporter une sauvegarde')}</button>
      <button class="btn ghost" data-act="import" style="margin-top:8px">⬆ ${t('Importer une sauvegarde')}</button>
      <input type="file" id="file-in" accept=".json,application/json" class="hidden">
    </div>
    <div class="panel">
      <h2>${t('Aide')}</h2>
      <button class="btn ghost" data-act="news-open">✨ ${t('Nouveautés')}</button>
      <button class="btn ghost" data-act="tuto-open" style="margin-top:8px">🎓 ${t('Revoir le tutoriel')}</button>
    </div>
    <div class="panel">
      <h2>${t('Zone sensible')}</h2>
      <button class="btn yellow" data-act="reset-demo">${t("Charger un exemple")}</button>
      <button class="btn del" data-act="reset-empty" style="margin-top:8px">${t('Tout effacer et repartir de zéro')}</button>
    </div>`;
  $('#file-in').addEventListener('change',e=>{ const f = e.target.files[0]; if(f) importFile(f); e.target.value=''; });
  $('#s-name').addEventListener('change',e=>{ db.settings.name = e.target.value.trim(); save(); });
}

function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===ui.tab));
  $('#fab').classList.toggle('hidden', ui.tab==='set' || ui.tab==='home');
  const sc = $('#app').scrollTop;
  if(ui.tab==='home') renderHome(); else if(ui.tab==='cal') renderCal(); else if(ui.tab==='stats') renderStats(); else renderSettings();
  $('#app').scrollTop = sc;
}

/* =========================================================
   Feuilles (sheets)
========================================================= */
function openSheet(n,html){ $('#sh'+n).innerHTML = `<div class="grab"></div>`+html; $('#ov'+n).classList.add('open'); $('#sh'+n).scrollTop = 0; }
function closeSheet(n){ $('#ov'+n).classList.remove('open'); }
['1','2'].forEach(n => $('#ov'+n).addEventListener('click',e=>{ if(e.target.id==='ov'+n && !$('#ov'+n).dataset.locked) closeSheet(n); }));

function choose(title,sub,options,cb,opts){
  const locked = opts && opts.locked;
  $('#ov2').dataset.locked = locked ? '1' : '';
  if(!locked) delete $('#ov2').dataset.locked;
  openSheet(2,`<div class="sheet-head"><h3>${title}</h3>${locked?'':'<button class="x" data-close="2">✕</button>'}</div>
    ${sub?`<div class="note" style="margin-top:-6px">${sub}</div>`:''}
    ${options.map((o,i)=>`<button class="choice ${o.danger?'danger':''}" data-choice="${i}">${o.label}${o.sub?`<small>${o.sub}</small>`:''}</button>`).join('')}`);
  choose._cb = (i)=>{ delete $('#ov2').dataset.locked; closeSheet(2); cb(options[i].v); };
}
const ask = (title,sub,options,opts) => new Promise(res => choose(title,sub,options,res,opts));

let F = null; // formulaire en cours
function openForm(init){
  F = Object.assign({mode:'new', type:'expense', amount:'', label:'', cat:null, date:ui.cursor, note:'', rec:null, id:null, origDate:null, wasRecurring:false, title:null, items:[], show:'group'}, init);
  F.items = (F.items||[]).map(i=>({...i}));
  if(!F.cat) F.cat = db.cats.find(c=>c.type===F.type).id;
  const kind = kindOf(F.rec);
  const r = F.rec || {unit:'month',interval:1,end:'never',count:12,until:addMonths(F.date,12)};
  const isEdit = F.mode==='edit';
  const ph = type => type==='income' ? t('Ex. Salaire, prime…') : t('Ex. Courses, loyer…');
  F._ph = ph;
  openSheet(1,`
    <div class="sheet-head"><h3>${F.title|| (isEdit?t('Modifier'):t('Nouvelle ligne'))}</h3><button class="x" data-close="1">✕</button></div>
    <div class="type-seg" id="f-type">
      <button data-v="expense" class="out ${F.type==='expense'?'on':''}">${t('Dépense')}</button>
      <button data-v="income" class="in ${F.type==='income'?'on':''}">${t("Entrée d'argent")}</button>
    </div>
    <div class="amount-wrap"><input id="f-amount" class="${F.type==='income'?'in':'out'}" type="text" inputmode="decimal" placeholder="0" value="${inV(F.amount)}"><span>${esc(curSymbol())}</span></div>
    <div class="items-box">
      <span class="lbl2">${t('Détail (facultatif)')}</span>
      <div class="note" style="margin:-2px 0 8px">${t('Découpe cette ligne en plusieurs postes (ex. charges perso). Le montant devient la somme des postes.')}</div>
      <div id="f-items"></div>
      <button class="add-inline" style="margin:2px 0 4px" data-act="item-add">+ ${t('Ajouter un poste')}</button>
      <label class="field ${F.items.length?'':'hidden'}" id="f-show-w" style="margin:8px 0 0"><span>${t('Affichage dans le calendrier')}</span>
        <select id="f-show"><option value="group" ${F.show!=='detail'?'selected':''}>${t('Groupé — une seule ligne')}</option><option value="detail" ${F.show==='detail'?'selected':''}>${t('Au détail — une ligne par poste')}</option></select>
      </label>
    </div>
    <label class="field"><span>${t('Libellé')}</span><input id="f-label" type="text" placeholder="${ph(F.type)}" value="${esc(F.label)}" autocomplete="off"></label>
    <span class="lbl2">${t('Catégorie')}</span><div class="chips" id="f-cats"></div>
    <label class="field"><span>${t('Date')}</span><input id="f-date" type="date" value="${F.date}"></label>
    <label class="field"><span>${t('Répétition')}</span>
      <select id="f-rec">${Object.entries(PRESETS).map(([k,p])=>`<option value="${k}" ${k===kind?'selected':''}>${t(p.label)}</option>`).join('')}</select>
    </label>
    <div id="f-custom" class="${kind==='custom'?'':'hidden'}">
      <div class="row2">
        <label class="field"><span>${t('Tous les')}</span><input id="f-int" type="number" min="1" inputmode="numeric" value="${r.interval}"></label>
        <label class="field"><span>${t('Unité')}</span><select id="f-unit">${Object.entries(UNIT_LABEL).map(([k,l])=>`<option value="${k}" ${k===r.unit?'selected':''}>${t(l)}</option>`).join('')}</select></label>
      </div>
    </div>
    <div id="f-end-wrap" class="${kind==='none'?'hidden':''}">
      <div class="row2">
        <label class="field"><span>${t('Fin de la répétition')}</span>
          <select id="f-end">
            <option value="never" ${r.end==='never'?'selected':''}>${t('Jamais')}</option>
            <option value="date" ${r.end==='date'?'selected':''}>${t('À une date')}</option>
            <option value="count" ${r.end==='count'?'selected':''}>${t('Après X fois')}</option>
          </select>
        </label>
        <label class="field ${r.end==='date'?'':'hidden'}" id="f-until-w"><span>${t("Jusqu'au")}</span><input id="f-until" type="date" value="${r.until||addMonths(F.date,12)}"></label>
        <label class="field ${r.end==='count'?'':'hidden'}" id="f-count-w"><span>${t('Nombre de fois')}</span><input id="f-count" type="number" min="1" inputmode="numeric" value="${r.count||12}"></label>
      </div>
    </div>
    <label class="field"><span>${t('Note (facultatif)')}</span><input id="f-note" type="text" value="${esc(F.note)}" autocomplete="off"></label>
    <button class="btn ${F.type==='income'?'green':'violet'}" id="f-save" data-act="save">${isEdit?t('Enregistrer'):t('Ajouter')}</button>
    ${isEdit?`<div class="acts" style="margin-top:10px"><button class="btn ghost" data-act="dup">⧉ ${t('Dupliquer')}</button><button class="btn del" data-act="del">🗑 ${t('Supprimer')}</button></div>`:''}
  `);
  drawCats(); drawItems();
  $('#f-items').addEventListener('input',e=>{
    const i = e.target.dataset.i; if(i===undefined) return;
    if(e.target.dataset.f==='label') F.items[i].label = e.target.value; else F.items[i].amount = Math.abs(num(e.target.value));
    syncTotal();
  });
  $('#f-type').addEventListener('click',e=>{
    const b = e.target.closest('button'); if(!b) return;
    F.type = b.dataset.v;
    document.querySelectorAll('#f-type button').forEach(x=>x.classList.toggle('on',x===b));
    if(!db.cats.find(c=>c.id===F.cat&&c.type===F.type)) F.cat = db.cats.find(c=>c.type===F.type).id;
    $('#f-amount').className = F.type==='income'?'in':'out';
    $('#f-save').className = 'btn '+(F.type==='income'?'green':'violet');
    $('#f-label').placeholder = ph(F.type);
    drawCats();
  });
  $('#f-rec').addEventListener('change',e=>{
    const v = e.target.value;
    $('#f-custom').classList.toggle('hidden',v!=='custom');
    $('#f-end-wrap').classList.toggle('hidden',v==='none');
  });
  $('#f-end').addEventListener('change',e=>{
    $('#f-until-w').classList.toggle('hidden',e.target.value!=='date');
    $('#f-count-w').classList.toggle('hidden',e.target.value!=='count');
  });
  if(F.mode==='new') setTimeout(()=>{ try{$('#f-amount').focus();}catch(e){} },280);
}
function itemsTotal(){ return Math.round(F.items.reduce((s,i)=>s+(i.amount||0),0)*100)/100; }
function syncTotal(){
  const a = $('#f-amount'); if(!a) return;
  a.readOnly = F.items.length>0;
  if(F.items.length) a.value = inV(itemsTotal());
}
function drawItems(){
  $('#f-items').innerHTML = F.items.map((it,i)=>`<div class="item-row">
    <input class="inp" data-i="${i}" data-f="label" type="text" placeholder="${t('Poste (ex. Téléphone)')}" value="${esc(it.label)}" autocomplete="off">
    <input class="inp amt-in" data-i="${i}" data-f="amount" type="text" inputmode="decimal" placeholder="0" value="${inV(it.amount||'')}">
    <button class="x" data-act="item-del" data-i="${i}" aria-label="${t('Retirer')}">✕</button></div>`).join('');
  $('#f-show-w').classList.toggle('hidden',!F.items.length);
  syncTotal();
}
function drawCats(){
  $('#f-cats').innerHTML = db.cats.filter(c=>c.type===F.type).map(c =>
    `<button class="chip ${c.id===F.cat?'on':''}" data-cat="${c.id}" style="${c.id===F.cat?`color:${c.color};background:${c.color}1f`:''}">${c.emoji} ${esc(catName(c))}</button>`).join('');
}
function readForm(){
  const items = F.items.filter(i=>i.amount>0).map(i=>({id:i.id,label:i.label.trim(),amount:i.amount}));
  const amount = items.length ? Math.round(items.reduce((s,i)=>s+i.amount,0)*100)/100 : Math.abs(num($('#f-amount').value));
  if(!amount){ toast(t('Entre un montant')); $('#f-amount').focus(); return null; }
  const date = $('#f-date').value; if(!date){ toast(t('Choisis une date')); return null; }
  const kind = $('#f-rec').value;
  let rec = null;
  if(kind!=='none'){
    let unit,interval;
    if(kind==='custom'){ unit = $('#f-unit').value; interval = Math.max(1,parseInt($('#f-int').value)||1); }
    else { unit = PRESETS[kind].unit; interval = PRESETS[kind].interval; }
    rec = {unit,interval,end:$('#f-end').value};
    if(rec.end==='date'){ rec.until = $('#f-until').value || addMonths(date,12); }
    if(rec.end==='count'){ rec.count = Math.max(1,parseInt($('#f-count').value)||1); }
  }
  const label = $('#f-label').value.trim() || catName(catOf(F.cat,F.type));
  return {type:F.type, amount, label, cat:F.cat, date, note:$('#f-note').value.trim(), rec, items:items.length?items:null, show:items.length?$('#f-show').value:'group'};
}

function saveForm(){
  const v = readForm(); if(!v) return;
  if(F.mode!=='edit'){
    db.tx.push({id:uid(), ...v, ex:{}});
    finish(F.mode==='dup'?t('Dupliqué ✓'):t('Ajouté ✓'), v.date);
    return;
  }
  const x = db.tx.find(y=>y.id===F.id); if(!x){ closeSheet(1); return; }
  if(!F.wasRecurring){
    Object.assign(x,v); x.ex = {};
    finish(t('Modifié ✓'), v.date); return;
  }
  choose(t('Modifier la récurrence'),t('Cette ligne se répète. Que veux-tu modifier ?'),[
    {v:'this', label:t('Cette occurrence seulement'), sub:longDate(F.origDate)},
    {v:'next', label:t('Celle-ci et les suivantes'), sub:t('Les occurrences passées restent inchangées')},
    {v:'all', label:t('Toutes les occurrences'), sub:t('Passées et futures')},
  ], scope => {
    if(scope==='this'){
      x.ex[F.origDate] = {del:true};
      db.tx.push({id:uid(), ...v, rec:null, ex:{}});
    }else if(scope==='next'){
      endSeriesBefore(x,F.origDate);
      db.tx.push({id:uid(), ...v, ex:{}});
    }else{
      const delta = diffDays(v.date,F.origDate);
      Object.assign(x, v, {date: delta? addDays(x.date,delta) : x.date});
    }
    finish(t('Modifié ✓'), v.date);
  });
}
function endSeriesBefore(x,date){
  if(date<=x.date){ db.tx = db.tx.filter(y=>y!==x); return; }
  x.rec = Object.assign({}, x.rec, {end:'date', until:addDays(date,-1)});
  delete x.rec.count;
}
function finish(msg,date){
  save(); closeSheet(1); closeSheet(2);
  if(date) ui.cursor = date;
  render(); toast(msg);
}
function deleteOcc(id,date){
  const x = db.tx.find(y=>y.id===id); if(!x) return;
  if(!x.rec){
    choose(t('Supprimer cette ligne ?'),t('« {l} » sera définitivement supprimée.',{l:esc(x.label)}),[{v:'ok',label:t('Supprimer'),danger:true},{v:'no',label:t('Annuler')}],
      a=>{ if(a==='ok'){ db.tx = db.tx.filter(y=>y!==x); closeSheet(1); save(); render(); toast(t('Supprimé')); } });
    return;
  }
  choose(t('Supprimer une récurrence'),t('Que veux-tu supprimer ?'),[
    {v:'this',label:t('Cette occurrence seulement'),sub:longDate(date),danger:true},
    {v:'next',label:t('Celle-ci et les suivantes'),danger:true},
    {v:'all',label:t('Toute la série'),danger:true},
    {v:'no',label:t('Annuler')},
  ], scope => {
    if(scope==='no') return;
    if(scope==='this') x.ex[date] = {del:true};
    else if(scope==='next') endSeriesBefore(x,date);
    else db.tx = db.tx.filter(y=>y!==x);
    closeSheet(1); save(); render(); toast(t('Supprimé'));
  });
}

function openOcc(id,date){
  const o = occurrences(date,date).find(x=>x.id===id); if(!o) return;
  const x = db.tx.find(y=>y.id===id);
  openForm({mode:'edit', id, origDate:date, wasRecurring:o.recurring, type:x.type, amount:x.amount, label:x.label, cat:x.cat, date, note:x.note||'', rec:x.rec, items:x.items||[], show:x.show||'group'});
}

/* ---------- catégories ---------- */
let CF = null;
function openCat(id,type){
  const ex = id && db.cats.find(c=>c.id===id);
  CF = ex ? {...ex, name:catName(ex), isNew:false} : {id:null,name:'',emoji:type==='income'?'💰':'🏷️',color:type==='income'?'#12A66B':'#5B8DEF',type,isNew:true};
  openSheet(1,`
    <div class="sheet-head"><h3>${CF.isNew?t('Nouvelle catégorie'):t('Modifier la catégorie')}</h3><button class="x" data-close="1">✕</button></div>
    <div class="row2">
      <label class="field" style="flex:0 0 84px"><span>${t('Emoji')}</span><input id="c-emoji" type="text" maxlength="4" value="${esc(CF.emoji)}" style="text-align:center;font-size:24px"></label>
      <label class="field"><span>${t('Nom')}</span><input id="c-name" type="text" value="${esc(CF.name)}" placeholder="${t('Ex. Resto, Prime…')}" autocomplete="off"></label>
    </div>
    <span class="lbl2">${t('Couleur')}</span>
    <div class="swatches" id="c-sw">${COLORS.map(c=>`<button class="sw ${c===CF.color?'on':''}" data-col="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
    <button class="btn ${CF.type==='income'?'green':'violet'}" data-act="cat-save">${t('Enregistrer')}</button>
    ${CF.isNew?'':`<button class="btn del" style="margin-top:10px" data-act="cat-del">${t('Supprimer cette catégorie')}</button>`}
  `);
}

/* ---------- sauvegarde fichier ---------- */
function exportData(){
  const copy = JSON.parse(JSON.stringify(db)); delete copy.cloudUid;
  const blob = new Blob([JSON.stringify(copy,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `daylance-sauvegarde-${TODAY}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function importFile(f){
  const r = new FileReader();
  r.onload = e => {
    try{
      const d = JSON.parse(e.target.result);
      if(!d.tx||!d.cats||!d.settings) throw 0;
      choose(t('Remplacer tes données ?'),t('Les données actuelles seront remplacées par la sauvegarde.'),[{v:'ok',label:t('Importer'),danger:true},{v:'no',label:t('Annuler')}],a=>{
        if(a==='ok'){ const keep = db && db.cloudUid; d.cloudUid = keep || d.cloudUid; replaceDb(d,false); save(); toast(t('Sauvegarde importée ✓')); }
      });
    }catch(err){ toast(t('Fichier invalide')); }
  };
  r.readAsText(f);
}

/* =========================================================
   Tutoriel de démarrage
========================================================= */
let tutoStep = 0;
function tutoSteps(){
  const cloud = typeof Cloud!=='undefined' && Cloud.enabled;
  return [
    {logo:true, h:t('Bienvenue sur Daylance !'), p:t("Cette appli te montre, jour après jour, l'argent qui rentre et qui sort de ton compte. Choisis d'abord ta langue et ta monnaie."), prefs:true},
    {e:'🏠', h:t('Ton accueil'), p:t("La page Accueil résume ta journée : ton solde, ce qu'il te reste à vivre, tes prochains mouvements (tu règles le nombre de jours) et des alertes. Tu choisis les cartes et leur ordre avec « Personnaliser l'accueil ».")},
    {e:'🎯', h:t('Crédits et objectifs'), p:t("Suis tes crédits (mensualités restantes, date de fin) et crée des objectifs d'épargne avec une barre de progression. Touche + sur un objectif pour y ajouter une somme.")},
    {e:'📅', h:t('Ton calendrier'), p:t("Chaque jour affiche tes entrées (en vert) et tes dépenses. Touche un jour pour voir le détail. Glisse vers la gauche ou la droite pour changer de mois.")},
    {e:'💰', h:t('Ton solde'), p:t("En haut, ton solde au jour choisi : il se recalcule tout seul. Aujourd'hui, touche « ✎ Corriger » pour y mettre le vrai solde de ton compte (même négatif).")},
    {e:'➕', h:t('Ajouter une ligne'), p:t("Touche le bouton + : montant, libellé, catégorie, date. Choisis une répétition (tous les mois, toutes les semaines…) pour un loyer, un salaire ou un abonnement.")},
    {e:'✏️', h:t('Modifier ou supprimer'), p:t("Touche une ligne pour la modifier, la dupliquer ou la supprimer. Pour une ligne qui se répète, tu choisis : cette fois seulement, celle-ci et les suivantes, ou toutes.")},
    {e:'🧾', h:t("Détailler une ligne"), p:t("Dans une ligne, ajoute des « postes » (téléphone, assurance…) : le total se calcule. Affiche-les groupés ou un par un dans le calendrier.")},
    {e:'📊', h:t('Répartition'), p:t("L'onglet Répartition montre où part ton argent par catégorie, le détail de tes lignes et l'évolution de ton solde sur 12 mois.")},
    {e:'🎨', h:t('Apparence'), p:t("Dans Réglages → Apparence : mode clair, sombre ou automatique, ou thème Liquid Glass en verre translucide (avec ou sans auras lumineuses). Tu règles la transparence, le flou et les reflets.")},
    {e:'🔒', h:t('Tes données'), p: cloud ? t("Tes données restent sur ton téléphone. Crée un compte avec ton e-mail pour les retrouver sur n'importe quel appareil, même si tu perds ton téléphone.") : t("Tes données restent sur ton téléphone. Pense à exporter une sauvegarde de temps en temps dans Réglages. Les comptes en ligne arrivent bientôt."), cta: cloud},
  ];
}
function showTuto(step){
  const S = tutoSteps(); tutoStep = Math.max(0,Math.min(S.length-1,step));
  const s = S[tutoStep], last = tutoStep===S.length-1;
  const el = $('#tuto'); el.classList.add('open');
  el.innerHTML = `
    <div class="tuto-top"><span class="tuto-count">${tutoStep+1} / ${S.length}</span><button class="linkbtn" data-act="tuto-skip">${t('Passer')}</button></div>
    <div class="tuto-body">
      ${s.logo?`<img class="tuto-logo" src="icons/icon-192.png" alt="Daylance">`:`<div class="tuto-emoji">${s.e}</div>`}
      <h2>${s.h}</h2>
      <p>${s.p}</p>
      ${s.prefs?`<div class="tuto-prefs">${prefsSelects()}</div>`:''}
    </div>
    <div class="tuto-dots">${S.map((_,i)=>`<i class="${i===tutoStep?'on':''}"></i>`).join('')}</div>
    <div class="tuto-nav">
      ${tutoStep>0?`<button class="btn ghost" data-act="tuto-prev">${t('Retour')}</button>`:''}
      ${last&&s.cta?`<button class="btn ghost" data-act="tuto-account">${t('Créer un compte')}</button>`:''}
      <button class="btn violet" data-act="tuto-next">${last?t("C'est parti !"):t('Suivant')}</button>
    </div>`;
}
function endTuto(){
  $('#tuto').classList.remove('open');
  if(!db.settings.tutorialDone){ db.settings.tutorialDone = true; save(); }
  render();
}

/* =========================================================
   Compte (interface) — la logique réseau est dans cloud.js
========================================================= */
function openAuth(mode){
  const up = mode==='signup', off = !(typeof Cloud!=='undefined' && Cloud.enabled);
  openSheet(1,`
    <div class="sheet-head"><h3>${up?t('Créer un compte'):t('Se connecter')}</h3><button class="x" data-close="1">✕</button></div>
    <div class="note" style="margin-top:-6px">${up?t("Ton e-mail sert à retrouver tes données et à réinitialiser ton mot de passe. Tes données actuelles seront sauvegardées dans ce compte."):t('Connecte-toi pour retrouver tes données.')}</div>
    ${off?`<div class="form-err" style="background:var(--yellow-soft);color:var(--ink)">${t("Les comptes ne sont pas encore activés sur cette version de l'appli. Tes données restent sur cet appareil : pense à exporter une sauvegarde dans Réglages.")}</div>`:''}
    <label class="field"><span>${t('E-mail')}</span><input id="a-mail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="nom@exemple.com" ${off?'disabled':''}></label>
    <label class="field"><span>${t('Mot de passe')}</span><input id="a-pass" type="password" autocomplete="${up?'new-password':'current-password'}" placeholder="${up?t('6 caractères minimum'):''}" ${off?'disabled':''}></label>
    <div id="a-err" class="form-err hidden"></div>
    <button class="btn violet" id="a-go" data-act="auth-go" data-mode="${mode}" ${off?'disabled':''}>${up?t('Créer mon compte'):t('Se connecter')}</button>
    ${up?'':`<button class="linkbtn" style="margin:12px auto 0;display:block" data-act="auth-reset">${t('Mot de passe oublié ?')}</button>`}
    <button class="linkbtn" style="margin:12px auto 0;display:block" data-act="auth-open" data-mode="${up?'signin':'signup'}">${up?t('J\'ai déjà un compte'):t('Pas encore de compte ? Créer un compte')}</button>
  `);
}
async function doAuth(mode){
  const mail = $('#a-mail').value.trim(), pass = $('#a-pass').value, err = $('#a-err'), btn = $('#a-go');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); btn.disabled = false; };
  if(!/^\S+@\S+\.\S+$/.test(mail)) return fail(t('Entre une adresse e-mail valide.'));
  if(pass.length<6) return fail(t('Le mot de passe doit faire au moins 6 caractères.'));
  btn.disabled = true; err.classList.add('hidden');
  try{
    if(mode==='signup') await Cloud.signUp(mail,pass); else await Cloud.signIn(mail,pass);
    closeSheet(1); render(); toast(mode==='signup'?t('Compte créé ✓'):t('Connecté ✓'));
  }catch(e){ fail(Cloud.errorText(e)); }
}

/* =========================================================
   Événements
========================================================= */
document.addEventListener('click',e=>{
  const closeBtn = e.target.closest('[data-close]');
  if(closeBtn){ closeSheet(closeBtn.dataset.close); return; }

  const ch = e.target.closest('[data-choice]');
  if(ch){ choose._cb(+ch.dataset.choice); return; }

  const catChip = e.target.closest('[data-cat]');
  if(catChip && F){ F.cat = catChip.dataset.cat; drawCats(); return; }

  const sw = e.target.closest('[data-col]');
  if(sw && CF){ CF.color = sw.dataset.col; document.querySelectorAll('#c-sw .sw').forEach(x=>x.classList.toggle('on',x===sw)); return; }

  const tm = e.target.closest('[data-theme-mode]');
  if(tm){ db.settings.theme.mode = tm.dataset.themeMode; applyTheme(); save(); render(); return; }
  const ta = e.target.closest('[data-theme-aura]');
  if(ta){ db.settings.theme.aura = db.settings.theme.aura===false; applyTheme(); save(); render(); return; }
  const ts = e.target.closest('[data-theme-scheme]');
  if(ts){ db.settings.theme.scheme = ts.dataset.themeScheme; applyTheme(); save(); render(); return; }
  const tb = e.target.closest('[data-bg]');
  if(tb){ db.settings.theme.bg = tb.dataset.bg; applyTheme(); save(); render(); return; }

  const nav = e.target.closest('#nav button');
  if(nav){ ui.tab = nav.dataset.tab; render(); $('#app').scrollTop = 0; return; }
  if(e.target.closest('#fab')){ openForm({mode:'new', date:ui.cursor}); return; }

  const el = e.target.closest('[data-act]'); if(!el) return;
  const a = el.dataset.act;
  switch(a){
    case 'prev': case 'next': {
      const k = a==='next'?1:-1;
      ui.cursor = (ui.tab==='cal' && ui.view==='week') ? addDays(ui.cursor,7*k) : addMonths(ui.cursor,k);
      render(); $('#app').scrollTop = 0; break; }
    case 'view': ui.view = el.dataset.v; try{localStorage.setItem(KEY+'-view',ui.view);}catch(e){} render(); break;
    case 'today': ui.cursor = TODAY; render(); break;
    case 'day': ui.cursor = el.dataset.date; render(); setTimeout(()=>{ const x = document.querySelector('.sec-title'); if(x) x.scrollIntoView({behavior:'smooth',block:'nearest'}); },30); break;
    case 'add': openForm({mode:'new', date:el.dataset.date}); break;
    case 'open': openOcc(el.dataset.id, el.dataset.date); break;
    case 'save': saveForm(); break;
    case 'del': deleteOcc(F.id,F.origDate); break;
    case 'dup': {
      const v = readForm() || null;
      const base = v || {type:F.type,amount:F.amount,label:F.label,cat:F.cat,date:F.date,note:F.note,items:F.items,show:F.show};
      openForm({mode:'dup', title:t('Dupliquer'), type:base.type, amount:base.amount, label:base.label, cat:base.cat, date:base.date, note:base.note, rec:null, items:base.items||[], show:base.show||'group'});
      toast(t('Copie prête — ajuste la date et enregistre'));
      break; }
    case 'item-add': F.items.push({id:uid(),label:'',amount:0}); drawItems(); { const r = document.querySelectorAll('#f-items .item-row input[data-f=label]'); r[r.length-1].focus(); } break;
    case 'item-del': F.items.splice(+el.dataset.i,1); drawItems(); break;
    case 'bal-open': openBalance(); break;
    case 'bal-sign': { const i = $('#b-val'); i.value = inV(-num(i.value)); i.focus(); break; }
    case 'bal-save': setAnchor(TODAY, num($('#b-val').value)); closeSheet(1); render(); toast(t('Solde mis à jour ✓')); break;
    case 'bal-reset': setAnchor(TODAY, null); closeSheet(1); render(); toast(t('Correction supprimée')); break;
    case 'cat-new': openCat(null, el.dataset.type); break;
    case 'cat-edit': openCat(el.dataset.id); break;
    case 'cat-save': {
      const name = $('#c-name').value.trim(); if(!name){ toast(t('Donne un nom')); return; }
      CF.name = name; CF.emoji = $('#c-emoji').value.trim() || '🏷️';
      if(CF.isNew){ db.cats.push({id:'c-'+uid(),name:CF.name,emoji:CF.emoji,color:CF.color,type:CF.type}); }
      else { const c = db.cats.find(x=>x.id===CF.id); Object.assign(c,{name:CF.name,emoji:CF.emoji,color:CF.color}); }
      save(); closeSheet(1); render(); toast(t('Catégorie enregistrée ✓')); break; }
    case 'cat-del': {
      const same = db.cats.filter(c=>c.type===CF.type);
      if(same.length<=1){ toast(t('Garde au moins une catégorie')); return; }
      const fallback = same.find(c=>c.id!==CF.id).id;
      choose(t('Supprimer cette catégorie ?'),t('Les lignes concernées passeront dans « {c} ».',{c:esc(catName(catOf(fallback)))}),[{v:'ok',label:t('Supprimer'),danger:true},{v:'no',label:t('Annuler')}],x=>{
        if(x==='ok'){ db.tx.forEach(y=>{ if(y.cat===CF.id) y.cat = fallback; }); db.cats = db.cats.filter(c=>c.id!==CF.id); save(); closeSheet(1); render(); toast(t('Catégorie supprimée')); }
      }); break; }
    case 'export': exportData(); break;
    case 'import': $('#file-in').click(); break;
    case 'reset-demo': choose(t('Charger un exemple ?'),t("Tout ce que tu as saisi sera remplacé par quelques lignes d'exemple. Tu pourras ensuite tout modifier ou effacer."),[{v:'ok',label:t('Charger l\'exemple'),danger:true},{v:'no',label:t('Annuler')}],x=>{ if(x==='ok'){ const d = freshDb(true); d.settings.tutorialDone = true; d.tx = exampleTx(); d.cloudUid = db.cloudUid; replaceDb(d,false); save(); toast(t('Exemple chargé')); } }); break;
    case 'reset-empty': choose(t('Tout effacer ?'),t('Toutes tes lignes seront supprimées. Pense à exporter une sauvegarde avant.'),[{v:'ok',label:t('Tout effacer'),danger:true},{v:'no',label:t('Annuler')}],x=>{ if(x==='ok'){ const d = freshDb(true); d.settings.tutorialDone = true; d.cloudUid = db.cloudUid; replaceDb(d,false); save(); toast(t('Application vidée')); } }); break;
    case 'theme-reset': { const m = db.settings.theme.mode, sc = db.settings.theme.scheme; db.settings.theme = {...DEFAULT_THEME, mode:m, scheme:sc}; applyTheme(); save(); render(); break; }
    case 'up-days': db.settings.upcomingDays = Math.min(60,Math.max(1,(db.settings.upcomingDays||2)+(+el.dataset.d))); save(); render(); break;
    case 'news-close': db.settings.newsSeen = NEWS_VERSION; save(); render(); break;
    case 'news-open': openNews(); break;
    case 'quick': openForm({mode:'new', type:el.dataset.type, date:TODAY}); break;
    case 'goto-cal': ui.tab = 'cal'; ui.cursor = TODAY; render(); $('#app').scrollTop = 0; break;
    case 'home-cfg': openHomeCfg(); break;
    case 'home-toggle': { const w = db.settings.home.find(x=>x.id===el.dataset.id); w.on = !w.on; save(); openHomeCfg(); render(); break; }
    case 'home-move': { const l = db.settings.home, i = l.findIndex(x=>x.id===el.dataset.id), j = i+(+el.dataset.dir); if(j>=0 && j<l.length){ [l[i],l[j]] = [l[j],l[i]]; save(); openHomeCfg(); render(); } break; }
    case 'goal-new': openGoal(null); break;
    case 'goal-edit': openGoal(el.dataset.id); break;
    case 'goal-add': openGoalAdd(el.dataset.id); break;
    case 'goal-save': {
      const name = $('#g-name').value.trim(), target = Math.abs(num($('#g-target').value));
      if(!name){ toast(t('Donne un nom')); return; }
      if(!target){ toast(t('Entre un montant')); return; }
      const v = {name, emoji:$('#g-emoji').value.trim()||'🎯', target, saved:num($('#g-saved').value), date:$('#g-date').value||''};
      if(GF.id) Object.assign(db.goals.find(g=>g.id===GF.id), v); else db.goals.push({id:uid(), ...v});
      save(); closeSheet(1); render(); toast(t('Objectif enregistré ✓')); break; }
    case 'goal-del': choose(t("Supprimer l'objectif ?"),'',[{v:'ok',label:t('Supprimer'),danger:true},{v:'no',label:t('Annuler')}],x=>{ if(x==='ok'){ db.goals = db.goals.filter(g=>g.id!==GF.id); save(); closeSheet(1); render(); toast(t('Supprimé')); } }); break;
    case 'gadd-sign': { const i = $('#ga-val'); i.value = inV(-num(i.value)); i.focus(); break; }
    case 'gadd-save': { const v = num($('#ga-val').value); if(!v){ toast(t('Entre un montant')); return; } const g = db.goals.find(x=>x.id===GF.id); g.saved = Math.round((g.saved+v)*100)/100; save(); closeSheet(1); render(); toast(t('Objectif mis à jour ✓')); break; }
    case 'tuto-open': showTuto(0); break;
    case 'tuto-next': if(tutoStep>=tutoSteps().length-1) endTuto(); else showTuto(tutoStep+1); break;
    case 'tuto-account': endTuto(); ui.tab = 'set'; render(); openAuth('signup'); break;
    case 'tuto-prev': showTuto(tutoStep-1); break;
    case 'tuto-skip': endTuto(); break;
    case 'auth-open': openAuth(el.dataset.mode); break;
    case 'auth-go': doAuth(el.dataset.mode); break;
    case 'auth-reset': {
      const mail = $('#a-mail').value.trim(); const err = $('#a-err');
      if(!/^\S+@\S+\.\S+$/.test(mail)){ err.textContent = t("Entre ton adresse e-mail ci-dessus, puis touche « Mot de passe oublié ? »."); err.classList.remove('hidden'); break; }
      Cloud.reset(mail).then(()=>{ closeSheet(1); toast(t('E-mail de réinitialisation envoyé')); }).catch(x=>{ err.textContent = Cloud.errorText(x); err.classList.remove('hidden'); });
      break; }
    case 'auth-verify': Cloud.verify().then(()=>toast(t('Message envoyé'))).catch(x=>toast(Cloud.errorText(x))); break;
    case 'auth-sync': Cloud.pushNow().then(()=>{ render(); toast(t('Sauvegardé ✓')); }).catch(x=>toast(Cloud.errorText(x))); break;
    case 'auth-out': choose(t('Se déconnecter'),t("Sur un téléphone que tu partages, efface les données de l'appareil. Elles resteront dans ton compte."),[
        {v:'keep',label:t('Se déconnecter et garder les données ici')},
        {v:'wipe',label:t("Se déconnecter et effacer les données de l'appareil"),danger:true},
        {v:'no',label:t('Annuler')}],
        async x=>{ if(x==='no') return; await Cloud.signOut(); if(x==='wipe'){ const d = freshDb(true); d.settings.tutorialDone = true; replaceDb(d,true); try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(_){} } render(); toast(t('Déconnecté')); }); break;
    case 'auth-delete': choose(t('Supprimer mon compte en ligne ?'),t("Ton compte et la sauvegarde en ligne seront supprimés. Les données de cet appareil restent."),[{v:'ok',label:t('Supprimer mon compte'),danger:true},{v:'no',label:t('Annuler')}],
        x=>{ if(x==='ok') Cloud.deleteAccount().then(()=>{ render(); toast(t('Compte supprimé')); }).catch(err=>toast(Cloud.errorText(err))); }); break;
  }
});
// réglages de langue / monnaie (liste déroulante)
document.addEventListener('change',e=>{
  const p = e.target.closest('[data-pref]'); if(!p) return;
  db.settings[p.dataset.pref] = p.value; save(); applyPrefs();
  if($('#tuto').classList.contains('open')) showTuto(tutoStep);
  render();
});
// curseurs d'apparence : aperçu en direct, enregistrement au relâchement
document.addEventListener('input',e=>{
  const r = e.target.closest('[data-theme-range]'); if(!r) return;
  const k = r.dataset.themeRange; db.settings.theme[k] = +r.value; applyTheme();
  const v = $('#v-'+k); if(v) v.textContent = r.value;
});
document.addEventListener('change',e=>{ if(e.target.closest('[data-theme-range]')) save(); });
document.addEventListener('keydown',e=>{
  if(e.key==='Enter' && e.target.closest('#a-mail,#a-pass')){ e.preventDefault(); const b = $('#a-go'); if(b) b.click(); }
});

/* Balayage horizontal : mois / semaine précédente-suivante */
(function(){
  let sx=0, sy=0, t0=0;
  const app = $('#app');
  app.addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; t0=Date.now(); },{passive:true});
  app.addEventListener('touchend',e=>{
    if(ui.tab==='set' || ui.tab==='home') return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if(Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*2 && Date.now()-t0<600 && !$('#ov1').classList.contains('open')){
      const k = dx<0?1:-1;
      ui.cursor = (ui.tab==='cal' && ui.view==='week') ? addDays(ui.cursor,7*k) : addMonths(ui.cursor,k);
      render();
    }
  },{passive:true});
})();

load();
render();
if(!db.settings.tutorialDone) showTuto(0);

/* Mises à jour automatiques : nouvelle version détectée → rechargement */
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  const had = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!had || reloaded) return;
    reloaded = true;
    if(!document.querySelector('.overlay.open') && !$('#tuto').classList.contains('open')) location.reload();
  });
  navigator.serviceWorker.register('sw.js').then(reg=>{
    const check = ()=>reg.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') check(); });
    setInterval(check, 30*60*1000);
  }).catch(()=>{});
}
