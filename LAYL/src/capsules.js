// LAYL Capsule Bay — a fully local, zero-dependency collectible-card prototype.
// Original supplied card artwork is kept as cropped front/back assets.
const cardList = [
  {id:'hazza', name:'Hazza Al Mansoori', category:'astronauts', label:'Astronaut'},
  {id:'sultan', name:'Sultan Al Neyadi', category:'astronauts', label:'Astronaut'},
  {id:'mike', name:'Mike Massimino', category:'astronauts', label:'Astronaut'},
  {id:'neil', name:'Neil Armstrong', category:'astronauts', label:'Astronaut'},
  {id:'yuri', name:'Yuri Gagarin', category:'astronauts', label:'Cosmonaut'},
  {id:'valentina', name:'Valentina Tereshkova', category:'astronauts', label:'Cosmonaut'},
  {id:'lunar_rover', name:'Lunar Rover', category:'equipment', label:'Equipment'},
  {id:'space_helmet', name:'Space Helmet', category:'equipment', label:'Equipment'},
  {id:'satellite_dish', name:'Satellite Dish', category:'equipment', label:'Equipment'},
  {id:'oxygen_pack', name:'Oxygen Pack', category:'equipment', label:'Equipment'},
  {id:'heart_monitor', name:'Heart Rate Monitor', category:'equipment', label:'Equipment'},
  {id:'medical_scanner', name:'Medical Scanner', category:'equipment', label:'Equipment'},
  {id:'space_basil', name:'Space Basil', category:'plants', label:'Plant'},
  {id:'dwarf_star', name:'Dwarf Star', category:'stars', label:'Star'},
  {id:'asteroid', name:'Asteroid', category:'cosmic', label:'Cosmic'}
];
const byId = Object.fromEntries(cardList.map(c => [c.id,c]));
const categoryMeta = {
  all:{title:'All cards',icon:'✦'},
  astronauts:{title:'Astronauts',icon:'◉'}, equipment:{title:'Equipment',icon:'⚙'},
  plants:{title:'Plants',icon:'☘'}, stars:{title:'Stars',icon:'★'}, cosmic:{title:'Cosmic',icon:'✧'}
};
const price = 100;
const STORAGE_KEY = 'layl_capsules_v05';
const TEAR_TAPS = 3;
function starterSave() { return {credits:240, owned:{}, packs:0}; }
function readSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!raw || typeof raw !== 'object') return starterSave();
    const owned = Object.fromEntries(Object.entries(raw.owned || {}).filter(([key,val])=>byId[key] && Number.isInteger(val) && val>0));
    return {credits:Math.max(0,Math.min(999999,Number(raw.credits)||0)),owned,packs:Math.max(0, Number(raw.packs)||0)};
  } catch { return starterSave(); }
}
const getImg=(id,face='front') => `assets/cards/${id}-${face}.webp`;
const packImg=face => `assets/packs/cosmic-${face}.webp`;
function pickUnique(pool, count, owned) {
  const fresh = pool.filter(id => !(owned[id] > 0));
  const other = pool.filter(id => owned[id] > 0);
  const shuffle = a => {
    const result = [...a];
    for (let i=result.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
    return result;
  };
  return [...shuffle(fresh), ...shuffle(other)].slice(0,count);
}
function buildPack(save) {
  const equipment = cardList.filter(c => c.category === 'equipment').map(c=>c.id);
  const discoveries = cardList.filter(c => ['plants','stars','cosmic'].includes(c.category)).map(c=>c.id);
  const astronauts = cardList.filter(c => c.category === 'astronauts').map(c=>c.id);
  const ids = [...pickUnique(equipment,2,save.owned),...pickUnique(discoveries,2,save.owned),...pickUnique(astronauts,1,save.owned)];
  return ids.map(id=>({id,newCard:!save.owned[id]}));
}
const htmlSafe = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function initCapsuleBay({onExit,playSound=()=>{}}={}) {
  const root = document.getElementById('capsuleBay');
  const scene = document.getElementById('app');
  const headerCredits = document.getElementById('capsuleCredits');
  const count = document.getElementById('capsuleCount');
  const grid = document.getElementById('capsuleGrid');
  const tabs = document.getElementById('capsuleFilters');
  const prevBtn = document.getElementById('capsulePrev');
  const nextBtn = document.getElementById('capsuleNext');
  const pageLabel = document.getElementById('capsulePage');
  const buyButton = document.getElementById('capsuleBuy');
  const openingScreen = document.getElementById('capsuleOpening');
  const detailScreen = document.getElementById('capsuleDetail');
  const feedback = document.getElementById('capsuleFeedback');
  const collectionView = document.getElementById('capsuleMainView');
  const ownerOverlay = document.getElementById('capsuleOwnerOverlay');
  const ownerPin = document.getElementById('capsuleOwnerPin');
  const ownerStatus = document.getElementById('capsuleOwnerStatus');
  let save = readSave();
  let filter = 'all';
  let page = 0;
  let opening = null;
  let detailId = null;
  let packTimer = null;
  let feedbackTimer = null;
  let flipTimer = null;
  const PAGE_SIZE=10;
  function persist() {try {localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch {/* browser disabled storage */}}
  function alertUser(message) {
    feedback.textContent=message;
    feedback.classList.add('is-visible');
    clearTimeout(feedbackTimer);
    feedbackTimer=setTimeout(()=>feedback.classList.remove('is-visible'),3500);
  }
  function renderHeader() {
    headerCredits.textContent = save.credits.toLocaleString();
    count.textContent = `Unlocked: ${Object.keys(save.owned).filter(id=>save.owned[id]>0).length} / ${cardList.length}`;
    buyButton.disabled = save.credits < price;
    document.getElementById('capsuleOwnedCount').textContent = Object.keys(save.owned).length;
  }
  function visibleCards() {
    const available = cardList.filter(c=>filter==='all'||c.category===filter);
    return available.sort((a,b)=>Number(Boolean(save.owned[b.id]))-Number(Boolean(save.owned[a.id])));
  }
  function renderCards() {
    const visible = visibleCards();
    const nPages = Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
    page = Math.min(page,nPages-1);
    const set = visible.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
    grid.innerHTML = set.map(c => {
      const unlocked=Boolean(save.owned[c.id]);
      return unlocked ? `
      <button class="capsule-card capsule-card--owned" type="button" data-card="${c.id}" aria-label="Open ${htmlSafe(c.name)} information card">
        <img src="${getImg(c.id)}" alt="${htmlSafe(c.name)} collectible card" loading="lazy" draggable="false" />
        ${save.owned[c.id]>1 ? `<span class="capsule-duplicate" aria-label="${save.owned[c.id]} copies">×${save.owned[c.id]}</span>`:''}
      </button>` : `<div class="capsule-card capsule-card--locked" aria-label="Locked ${htmlSafe(c.label)} card">
        <span class="capsule-lock-icon" aria-hidden="true">♙</span><span class="capsule-lock-symbol" aria-hidden="true">🔒</span><small>???</small>
      </div>`;
    }).join('');
    if (!set.length) grid.innerHTML='<p class="capsule-no-cards">No cards in this section yet.</p>';
    pageLabel.textContent = `${page+1} / ${nPages}`;
    prevBtn.disabled=page===0;
    nextBtn.disabled=page>=nPages-1;
    [...tabs.querySelectorAll('[data-filter]')].forEach(el=>{const yes=el.dataset.filter===filter;el.classList.toggle('is-active',yes);el.setAttribute('aria-pressed',String(yes));});
  }
  function refresh() {renderHeader();renderCards();}
  function open() {
    save=readSave(); // Mission rewards are saved independently and become visible on the next visit.
    root.hidden=false;
    scene.classList.add('capsule-active');
    document.getElementById('mainMenu').inert = true;
    refresh();
    document.getElementById('capsuleBack').focus();
    root.scrollTop=0;
  }
  function close() {
    if (opening || detailId) {closeSpecial(); return;}
    root.hidden=true;
    scene.classList.remove('capsule-active');
    document.getElementById('mainMenu').inert = false;
    if (onExit) onExit();
  }
  function closeSpecial() {
    clearTimeout(packTimer);
    clearTimeout(flipTimer);
    opening=null;
    detailId=null;
    openingScreen.hidden=true;
    detailScreen.hidden=true;
    collectionView.inert=false;
    document.getElementById('capsuleBuy').focus();
    refresh();
  }
  function showPackStage() {
    openingScreen.hidden=false;
    detailScreen.hidden=true;
    collectionView.inert=true;
    openingScreen.innerHTML = `
    <div class="capsule-open__header"><span>✧ COSMIC DISCOVERY ✧</span><button type="button" class="capsule-icon-button" data-cancel-opening aria-label="Return to shop">✕</button></div>
    <div class="capsule-open__inner">
      <h2>Let's open your pack!</h2>
      <p id="capsuleOpeningInstructions">Turning your pack around…</p>
      <button type="button" class="capsule-tear" data-tear aria-label="Tap pack to open: 3 taps remaining" disabled>
        <span class="capsule-pack-3d" id="capsulePack3d"><img class="capsule-pack-front" src="${packImg('front')}" alt="Front of Cosmic Discovery pack" draggable="false"/><img class="capsule-pack-back" src="${packImg('back')}" alt="Back of Cosmic Discovery pack" draggable="false"/><span class="capsule-tear-mark" aria-hidden="true"></span></span>
      </button>
      <div class="capsule-tap-counter" id="capsuleTapCounter" aria-live="polite">FLIPPING TO BACK OF PACK</div>
      <p class="capsule-open__helper">Tap the pack itself to tear the wrapper!</p>
    </div>`;
    // Keep front visible for one moment, then animate the pack to its back.
    flipTimer=setTimeout(()=>{
      if (!opening) return;
      document.getElementById('capsulePack3d')?.classList.add('is-back');
    },170);
    packTimer=setTimeout(()=>{
      if (!opening) return;
      const button=openingScreen.querySelector('[data-tear]');
      if (!button) return;
      button.disabled=false;
      document.getElementById('capsuleOpeningInstructions').textContent='Tap the BACK of your pack 3 times to open it!';
      document.getElementById('capsuleTapCounter').textContent='✦ 3 CLICKS LEFT · 0 / 3 ✦';
      button.focus();
    },1120);
  }
  function buy() {
    if (save.credits < price) {alertUser('Not enough stars. Use Demo +100 to keep testing this prototype.');return;}
    if (opening) return;
    opening = {cards:buildPack(save),taps:0};
    save.credits-=price;
    save.packs++;
    // Save rewards at purchase so a page refresh will never eat purchased cards.
    for (const card of opening.cards) save.owned[card.id]=(save.owned[card.id]||0)+1;
    persist();
    playSound();
    refresh();
    showPackStage();
  }
  function tearPack() {
    if (!opening || opening.taps>=TEAR_TAPS) return;
    opening.taps++;
    playSound();
    const pack=document.querySelector('#capsulePack3d');
    if (pack) {pack.style.setProperty('--tap-count',opening.taps);pack.classList.add('is-torn');}
    const remaining=TEAR_TAPS-opening.taps;
    document.getElementById('capsuleTapCounter').textContent=remaining
      ? `✦ ${remaining} CLICK${remaining===1?'':'S'} LEFT · ${opening.taps} / ${TEAR_TAPS} ✦`
      : '✨ PACK OPENED! ✨';
    const button=openingScreen.querySelector('[data-tear]');
    button.setAttribute('aria-label', remaining?`Tap pack to open: ${remaining} taps remaining`:'Pack opened');
    if (!remaining) {
      button.disabled=true;
      openingScreen.classList.add('capsule-opening-flash');
      packTimer=setTimeout(()=>{openingScreen.classList.remove('capsule-opening-flash');opening.revealIndex=0;showReveal();},690);
    }
  }
  function flipElement(el) {
    el.classList.toggle('is-flipped');
    el.setAttribute('aria-pressed',String(el.classList.contains('is-flipped')));
    playSound();
  }
  function flipMarkup(card,extraClass='') {
    const c=byId[card.id];
    return `<button class="capsule-flip ${extraClass}" type="button" data-flip aria-pressed="false" aria-label="Flip ${htmlSafe(c.name)} to see its facts">
      <span class="capsule-flip__inner"><span class="capsule-flip__face capsule-flip__front"><img src="${getImg(c.id)}" alt="${htmlSafe(c.name)} front" draggable="false"/></span><span class="capsule-flip__face capsule-flip__back"><img src="${getImg(c.id,'back')}" alt="${htmlSafe(c.name)} science facts" draggable="false"/></span></span>
    </button>`;
  }
  function showReveal() {
    if (!opening) return;
    const index=opening.revealIndex;
    const card=opening.cards[index];
    const c=byId[card.id];
    const isLast=index===opening.cards.length-1;
    const category=isLast?'✦ SPECIAL ASTRONAUT REVEAL ✦':index<2?'⚙ SPACE EQUIPMENT':'✧ SPACE DISCOVERY';
    openingScreen.innerHTML=`
      <div class="capsule-open__header"><span>✦ COSMIC DISCOVERY ✦</span><button type="button" class="capsule-icon-button" data-cancel-opening aria-label="Finish opening and return to shop">✕</button></div>
      <div class="capsule-reveal-single ${isLast?'capsule-reveal-single--astronaut':''}">
        <div class="capsule-progress" aria-label="Card ${index+1} of ${opening.cards.length}">${opening.cards.map((_,i)=>`<span class="${i===index?'is-current':i<index?'is-done':''}">${i<index?'✓':i+1}</span>`).join('')}</div>
        <p class="capsule-reveal-category">${category}</p>
        <h2>${isLast?'Astronaut discovered!':`Card ${index+1} of 5`}</h2>
        <div class="capsule-reveal-single__card">${flipMarkup(card,'capsule-flip--reveal')}</div>
        <div class="capsule-pull__status ${card.newCard?'capsule-pull__status--new':''}">${card.newCard?'✦ NEW UNLOCK!':'DUPLICATE CARD'}</div>
        <div class="capsule-reveal-name">${htmlSafe(c.name)}</div>
        <p class="capsule-reveal-help">Tap the card to flip it and read the facts.</p>
        <button type="button" class="capsule-button capsule-button--gold capsule-reveal-next" ${isLast?'data-cancel-opening':'data-reveal-next'}>${isLast?'✓ Finish & View Collection':'Next Card →'}</button>
        <small class="capsule-reveal-saved">All five cards are saved automatically, even if you exit early.</small>
      </div>`;
    openingScreen.querySelector('[data-flip]')?.focus();
  }
  function nextCard() {
    if (!opening || opening.revealIndex >= opening.cards.length-1) return;
    opening.revealIndex++;
    playSound();
    showReveal();
  }
  function openDetail(id) {
    if (!save.owned[id]) return;
    const c=byId[id];
    detailId=id;
    detailScreen.hidden=false;
    collectionView.inert=true;
    detailScreen.innerHTML=`
    <div class="capsule-detail__scrim" data-close-detail></div>
    <section class="capsule-detail__panel" role="dialog" aria-modal="true" aria-labelledby="capsuleDetailTitle">
      <div class="capsule-detail__top"><span class="capsule-detail__category">${htmlSafe(c.label)} • Collection</span><button class="capsule-icon-button" type="button" data-close-detail aria-label="Close card">✕</button></div>
      <h2 id="capsuleDetailTitle">${htmlSafe(c.name)}</h2>
      ${flipMarkup({id},'capsule-flip--large')}
      <p>Click or tap the card to flip it and read the facts.</p>
      <button class="capsule-button capsule-button--subtle" type="button" data-close-detail>Back to collection</button>
    </section>`;
    detailScreen.querySelector('[data-flip]')?.focus();
  }
  function closeDetail() {
    detailId=null;
    detailScreen.hidden=true;
    detailScreen.innerHTML='';
    collectionView.inert=false;
    document.querySelector('#capsuleGrid .capsule-card--owned')?.focus();
  }
  function openOwner() {
    if (opening || detailId) return;
    ownerOverlay.hidden=false;
    collectionView.inert=true;
    ownerStatus.textContent='';
    ownerPin.value='';
    ownerPin.focus();
  }
  function closeOwner() {
    ownerOverlay.hidden=true;
    collectionView.inert=false;
    ownerPin.value='';
    document.getElementById('capsuleOwnerOpen').focus();
  }
  async function ownerAction(action, button) {
    const pin=ownerPin.value.trim();
    if (!/^\d{6}$/.test(pin)) {ownerStatus.textContent='Enter the six-digit PIN from the VS Code terminal.';return;}
    if ((action==='clear'||action==='restart')&&!confirm(action==='clear'
      ? 'Clear ALL unlocked cards in this browser? Credits will stay as they are.'
      : 'Restart this browser’s entire capsule demo? All cards will be locked and Star Credits reset to 240.')) return;
    button.disabled=true;
    ownerStatus.textContent='Checking owner PIN…';
    try {
      const response=await fetch('/api/owner/authorize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin,action})});
      const result=await response.json();
      if (!response.ok || result.ok!==true) {ownerStatus.textContent=result.error || 'PIN not accepted.';return;}
      // This is a browser-local prototype; the owner-authorized action updates this browser's save.
      if (action==='clear') save.owned={};
      if (action==='restart') save=starterSave();
      if (action==='credit') save.credits+=100;
      persist();page=0;filter='all';refresh();
      ownerStatus.textContent=action==='credit'?'★ 100 test credits added.':'✓ Your collection has been cleared.';
      alertUser(action==='credit'?'100 test stars added.':'Owner reset completed — 0 unlocked cards.');
      ownerPin.value='';
    } catch {
      ownerStatus.textContent='Cannot contact the local server. Start with npm run dev.';
    } finally {button.disabled=false;}
  }
  ownerOverlay.addEventListener('click',event=>{
    const closeEl=event.target.closest('[data-owner-close]');
    if (closeEl) {closeOwner();return;}
    const actionButton=event.target.closest('[data-owner-action]');
    if (actionButton) ownerAction(actionButton.dataset.ownerAction,actionButton);
  });
  root.addEventListener('click',event=>{
    const el=event.target.closest('button');
    if (!el) {
      if (event.target.matches('[data-close-detail]')) closeDetail();
      return;
    }
    if (el.matches('[data-capsule-back]')) {close();return;}
    if (el.matches('[data-buy-pack]')) {buy();return;}
    if (el.matches('#capsuleOwnerOpen')) {openOwner();return;}
    if (el.matches('[data-filter]')) {filter=el.dataset.filter;page=0;renderCards();playSound();return;}
    if (el.matches('[data-page-prev]')) {page=Math.max(0,page-1);renderCards();return;}
    if (el.matches('[data-page-next]')) {page++;renderCards();return;}
    if (el.matches('[data-card]')) {openDetail(el.dataset.card);playSound();return;}
    if (el.matches('[data-tear]')) {tearPack();return;}
    if (el.matches('[data-reveal-next]')) {nextCard();return;}
    if (el.matches('[data-cancel-opening]')) {closeSpecial();return;}
    if (el.matches('[data-close-detail]')) {closeDetail();return;}
    if (el.matches('[data-flip]')) {flipElement(el);return;}
  });
  document.addEventListener('keydown',event=>{
    if (root.hidden || event.key!=='Escape') return;
    event.preventDefault();
    if (!ownerOverlay.hidden) {closeOwner();return;}
    if (detailId) closeDetail(); else if (opening) closeSpecial(); else close();
  });
  return {open,close};
}
