import {initCapsuleBay} from './capsules.js';
import {initMission,missionSnapshot} from './mission.js';
// LAYL — intro-menu logic. The gameplay simulation will be added later.
const mainMenu = document.getElementById('mainMenu');
const buttons = [...mainMenu.querySelectorAll('button[data-page]')];
const overlay = document.getElementById('panelOverlay');
const backdrop = document.getElementById('panelBackdrop');
const panel = overlay.querySelector('.panel');
const closeButton = document.getElementById('panelClose');
const title = document.getElementById('panelTitle');
const eyebrow = document.getElementById('panelEyebrow');
const content = document.getElementById('panelContent');
let priorFocus = buttons[0];
let audioContext;
let capsuleBay;
let mission;
const missionBridge = document.getElementById('missionBridge');
const bridgeFrame = document.getElementById('missionBridgeFrame');
function showBridge(){ missionBridge.hidden=false; mainMenu.inert=true; bridgeFrame.focus(); if(bridgeFrame.contentWindow) bridgeFrame.contentWindow.postMessage({type:'layl-enter-mission'},location.origin); }
function hideBridge(){ missionBridge.hidden=true; mainMenu.inert=false; document.querySelector('[data-page="start"]')?.focus(); }
window.addEventListener('message',event=>{if(event.origin!==location.origin)return;if(event.source!==bridgeFrame.contentWindow)return;if(event.data?.type==='layl-return-menu')hideBridge();});

function getSavedSettings() {
  try {
    return JSON.parse(localStorage.getItem('laylSettings') || '{}');
  } catch { return {}; }
}
const settings = { sound: false, reduceMotion: false, ...getSavedSettings() };
function saveSettings() {
  try { localStorage.setItem('laylSettings', JSON.stringify(settings)); } catch { /* private browsing */ }
}
function applySettings() {
  document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
}
applySettings();

function chirp() {
  if (!settings.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(680, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(920, audioContext.currentTime + 0.1);
    envelope.gain.setValueAtTime(0.0001, audioContext.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.025, audioContext.currentTime + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.13);
    oscillator.connect(envelope); envelope.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + 0.14);
  } catch { /* no audio support */ }
}

const pages = {
  start: {
    eyebrow: '01 / YOUR MISSION',
    title: 'Mission Briefing',
    html: `
      <div class="mission-tag"><span class="mission-tag__light"></span> THREE PLAYABLE TRAINING STAGES</div>
      <p class="panel__lead">Welcome to Lunar Base Alpha, Flight Surgeon. Your mission is to keep the crew healthy while making decisions in a lunar outpost.</p>
      <div class="mission-stats">
        <div><strong>01</strong><span>LUNAR OUTPOST</span></div>
        <div><strong>03</strong><span>CREW MEMBERS</span></div>
        <div><strong>04</strong><span>BASE SYSTEMS</span></div>
      </div>
      <p class="panel__muted">Select START to explore all three playable mission stages: Crew Rescue, Crystal Supply, and Emergency Command.</p>
      <button class="panel__primary" type="button" data-close>Back to main menu <span aria-hidden="true">→</span></button>
    `
  },
  guide: {
    eyebrow: '02 / FIELD MANUAL',
    title: 'Guide',
    html: `
      <p class="panel__lead">You are the flight surgeon at a lunar outpost. Your job is to protect astronaut health without forgetting the systems that keep everyone alive.</p>
      <div class="info-list">
        <div class="info-list__item"><span class="info-list__num">01</span><div><strong>Monitor the crew</strong><p>Watch simulated heart rate, oxygen levels, and temperature. Investigate warning signs.</p></div></div>
        <div class="info-list__item"><span class="info-list__num">02</span><div><strong>Manage the outpost</strong><p>Refill at least two emergency oxygen tanks when a crewmate needs help.</p></div></div>
        <div class="info-list__item"><span class="info-list__num">03</span><div><strong>Explore and research</strong><p>Use the Crystal Dome merge puzzle to collect fictional research materials and prepare a supply.</p></div></div>
        <div class="info-list__item"><span class="info-list__num">04</span><div><strong>Respond to emergencies</strong><p>Assess the situation and choose safe actions. Stage 03 tests crew-safety decisions through three emergency scenarios. Crystal-made medicine is fictional gameplay, not real medical science.</p></div></div>
      </div>
      <p class="panel__muted">Controls: WASD or arrow keys to walk; click a station label to enter immediately. Choose STAGES to test all three missions.</p>
    `
  },
  characters: {
    eyebrow: '03 / THE CREW',
    title: 'Characters',
    html: `
      <div class="character-card"><div class="character-card__symbol">✦</div><div><span class="character-card__tag">YOUR GUIDE</span><h2>Layl the Falcon</h2><p>An Emirati astronaut falcon and friendly mission companion. Look for Layl during tutorials, discoveries, and emergencies.</p></div></div>
      <div class="character-card character-card--quiet"><div class="character-card__symbol">✚</div><div><span class="character-card__tag">PLAYABLE ROLE</span><h2>The Flight Surgeon</h2><p>That's you. Monitor astronaut health, make careful decisions, and support the mission.</p></div></div>
      <p class="panel__muted">Visit the playable mission to help Amina and explore the lunar base.</p>
    `
  },
  achievements: {
    eyebrow: '04 / MISSION RECORDS',
    title: 'Achievements',
    html: `
      <p class="panel__lead">Your mission records will live here as the simulation develops.</p>
      <div class="achievement-list">
        <div class="achievement"><span>◇</span><div><strong>First Checkup</strong><small>Complete your first crew health assessment</small></div><em>PLANNED</em></div>
        <div class="achievement"><span>◇</span><div><strong>Greenhouse Guardian</strong><small>Keep your research crops healthy</small></div><em>PLANNED</em></div>
        <div class="achievement"><span>◇</span><div><strong>Power Saver</strong><small>Resolve a mission without wasting resources</small></div><em>PLANNED</em></div>
      </div>
      <p class="panel__muted">Achievements cannot be earned in this intro-only build.</p>
    `
  },
  settings: {
    eyebrow: '05 / PREFERENCES',
    title: 'Settings',
    html: `
      <p class="panel__lead">Choose menu preferences and fullscreen display. Your choices are saved in this browser.</p>
      <div class="settings-list">
        <label class="setting-row"><span><strong>Menu sound effects</strong><small>Soft confirmation tones on menu actions</small></span><input type="checkbox" id="soundToggle" /></label>
        <label class="setting-row"><span><strong>Reduce motion</strong><small>Disable animated star twinkles and transitions</small></span><input type="checkbox" id="motionToggle" /></label>
      </div>
      <button class="panel__primary" type="button" id="fullscreenButton">Toggle fullscreen <span aria-hidden="true">↗</span></button>
      <p class="panel__muted">Some browsers or devices do not support fullscreen mode.</p>
      <div class="credits-block" style="margin-top:18px"><span>OWNER / RESET EVERYTHING</span><p>Owner-only reset works while running the local Node server. It is unavailable on public GitHub Pages deployments.</p><input id="ownerResetPin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="Owner PIN from terminal" style="width:100%;padding:12px;margin:12px 0;border-radius:8px;background:#102941;color:white;border:1px solid #668baa"><button class="panel__primary" type="button" id="ownerResetAll">Reset all local progress</button><p id="ownerResetMessage" aria-live="polite" class="panel__muted"></p></div>
    `
  },
  credits: {
    eyebrow: '06 / TEAM & SCIENCE SOURCES',
    title: 'Credits & Research',
    html: `
      <div class="credits-block"><span>WHY LAYL?</span><p><strong>Layl</strong> means <strong>night</strong> (ليل) in Arabic. Three sisters chose the name as a tribute to their mother, <strong>Layla</strong>.</p></div>
      <p class="panel__lead">Made by <strong>Team Layl</strong> for the <strong>2026 NASA Space Apps Challenge</strong>. Our mission is to turn complex space health and survival decisions into an engaging, educational game.</p>
      <div class="credits-block"><span>TEAM VISION</span><p>Space medicine, interactive learning, and mission engineering meet in a third-person lunar adventure. Our astronaut falcon represents curiosity, courage, and our UAE roots.</p></div>
      <div class="credits-heading"><span class="credits-heading__line"></span><span>SOURCES USED BY TEAM LAYL</span><span class="credits-heading__line"></span></div>
      <p class="panel__muted reference-intro">These five NASA and ESA resources were consulted by our team while developing the concept. Each link opens its original source.</p>
      <section class="reference-section" aria-labelledby="usedSources">
        <h2 id="usedSources">✦ &nbsp; Our research sources</h2>
        <div class="reference-list">
          <a class="reference-card" href="https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/" target="_blank" rel="noopener noreferrer"><span><strong>NASA — Spacewalk Spacesuit Basics</strong><small>How spacesuits support breathing, temperature control, and safe spacewalks.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/" target="_blank" rel="noopener noreferrer"><span><strong>NASA — Environmental Control & Life Support (ECLSS)</strong><small>How crews manage oxygen, remove carbon dioxide, and recycle water.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.esa.int/articles/about-us/directorates/human-and-robotic-exploration/parabolic-flights" target="_blank" rel="noopener noreferrer"><span><strong>ESA — Parabolic Flights</strong><small>Reduced-gravity aircraft flights used for astronaut training and scientific tests.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/reference/5-0-training/" target="_blank" rel="noopener noreferrer"><span><strong>NASA — 5.0 Training</strong><small>Medical training requirements for crewmembers, flight surgeons, and mission support teams.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/missions/station/faq-the-real-story-about-astronaut-health-care-in-space/" target="_blank" rel="noopener noreferrer"><span><strong>NASA — The Real Story About Astronaut Health Care in Space</strong><small>How space crews stay healthy, get medical support, exercise, and handle emergencies.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
        </div>
      </section>
      <div class="credits-heading"><span class="credits-heading__line"></span><span>ADDITIONAL SCIENTIFIC READING</span><span class="credits-heading__line"></span></div>
      <p class="panel__muted reference-intro">More official resources suggested to help build future gameplay. These are recommendations, not claimed as sources already used by the team.</p>
      <section class="reference-section" aria-labelledby="extraSources">
        <h2 id="extraSources">✚ &nbsp; Space medicine, vitals & the outpost</h2>
        <div class="reference-list">
          <a class="reference-card" href="https://www.nasa.gov/directorates/esdmd/hhp/flight-surgeons/" target="_blank" rel="noopener noreferrer"><span><strong>NASA Flight Surgeons</strong><small>Specialist physicians supporting astronaut crews and Mission Control.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/reference/jsc-medical-pharmacology/" target="_blank" rel="noopener noreferrer"><span><strong>NASA Medical & Pharmacology</strong><small>Space medicine and medical planning.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/human-health-performance/exploration-medical-technologies/" target="_blank" rel="noopener noreferrer"><span><strong>Exploration Medical Technologies</strong><small>Medical monitoring and diagnostic technologies for exploration.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/missions/station/cardiovascular-health-in-microgravity/" target="_blank" rel="noopener noreferrer"><span><strong>Cardiovascular Health in Microgravity</strong><small>How spaceflight affects the heart and circulation.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/" target="_blank" rel="noopener noreferrer"><span><strong>Growing Plants in Space</strong><small>Research on cultivating crops beyond Earth.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.nasa.gov/hrp/" target="_blank" rel="noopener noreferrer"><span><strong>NASA Human Research Program</strong><small>Health, performance, and risks during spaceflight.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
          <a class="reference-card" href="https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/" target="_blank" rel="noopener noreferrer"><span><strong>Build a Junior Astronaut Mission Trainer</strong><small>NASA Space Apps 2026 challenge brief used to define the game goal.</small></span><span class="reference-card__arrow" aria-hidden="true">↗</span></a>
        </div>
      </section>

      <div class="research-disclaimer"><strong>Research ≠ endorsement.</strong><p>LAYL is an independent educational prototype, not an official NASA product or NASA-approved medical trainer. Astronaut readings and events are simulated. Crystal-based medicine crafting is fictional gameplay, not a real medication or medical treatment.</p></div>
    `
  }
};

function openPanel(page) {
  if (page === 'start') { priorFocus = document.activeElement; chirp(); showBridge(); return; }
  if (page === 'capsules') { priorFocus = document.activeElement; chirp(); capsuleBay.open(); return; }
  const pageData = pages[page];
  if (!pageData) return;
  priorFocus = document.activeElement;
  chirp();
  eyebrow.textContent = pageData.eyebrow;
  title.textContent = pageData.title;
  content.innerHTML = pageData.html;
  if(page==='achievements'){
    let saved=null;
    try { saved=JSON.parse(localStorage.getItem('layl-stages-v3')||'null'); } catch {}
    const done=Array.isArray(saved?.done)?saved.done:[false,false,false];
    const cards=[
      ['Crew Rescuer',!!done[0],'Complete Stage 01: Crew Rescue'],
      ['Crystal Specialist',!!done[1],'Complete Stage 02: Crystal Supply'],
      ['Emergency Commander',!!done[2],'Complete Stage 03: Emergency Command'],
      ['Lunar Academy Graduate',done.every(Boolean),'Finish all three training stages']
    ];
    content.innerHTML=`<p class="panel__lead">Your three-stage mission achievements on this device.</p><div class="achievement-list">${cards.map(([name,done,detail])=>`<div class="achievement"><span>${done?'✦':'◇'}</span><div><strong>${name}</strong><small>${detail}</small></div><em>${done?'UNLOCKED':'LOCKED'}</em></div>`).join('')}</div>`;
  }
  overlay.hidden = false;
  panel.classList.toggle('panel--credits', page === 'credits');
  panel.scrollTop = 0;
  mainMenu.setAttribute('inert', '');
  closeButton.focus();
  if (page === 'settings') setupSettings();
}
function closePanel() {
  if (overlay.hidden) return;
  chirp();
  overlay.hidden = true;
  mainMenu.removeAttribute('inert');
  if (priorFocus instanceof HTMLElement) priorFocus.focus();
}
function setupSettings() {
  const soundToggle = document.getElementById('soundToggle');
  const motionToggle = document.getElementById('motionToggle');
  soundToggle.checked = settings.sound;
  motionToggle.checked = settings.reduceMotion;
  soundToggle.addEventListener('change', () => {
    settings.sound = soundToggle.checked;
    saveSettings(); chirp();
  });
  motionToggle.addEventListener('change', () => {
    settings.reduceMotion = motionToggle.checked;
    saveSettings(); applySettings();
  });
  document.getElementById('ownerResetAll')?.addEventListener('click',async ()=>{
    const status=document.getElementById('ownerResetMessage');
    const pin=document.getElementById('ownerResetPin').value.trim();
    if(!/^\d{6}$/.test(pin)){status.textContent='Enter the six-digit PIN from your terminal.';return;}
    if(!confirm('Reset ALL local LAYL progress, including mission and card collection?'))return;
    try{ const response=await fetch('/api/owner/authorize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin,action:'reset_all'})});
      const data=await response.json();if(!response.ok||!data.ok){status.textContent=data.error||'PIN not accepted.';return;}
      for(const k of Object.keys(localStorage)){if(k.startsWith('layl'))localStorage.removeItem(k);}
      bridgeFrame.src='mission/index.html';
      status.textContent='Progress reset successfully. Reloading the collection...';
      setTimeout(()=>window.location.reload(),450);
    }catch {status.textContent='Cannot contact the owner server. Use npm run dev.';}
  });
  document.getElementById('fullscreenButton').addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { alert('Fullscreen is not available in this browser.'); }
  });
}

mainMenu.addEventListener('click', event => {
  const button = event.target.closest('button[data-page]');
  if (button) openPanel(button.dataset.page);
});
mainMenu.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const index = buttons.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
    (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next].focus();
});
closeButton.addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);
content.addEventListener('click', event => {
  if (event.target.closest('[data-close]')) closePanel();
});
document.addEventListener('keydown', event => {
  if (overlay.hidden) return;
  if (event.key === 'Escape') { event.preventDefault(); closePanel(); }
  if (event.key !== 'Tab') return;
  const focusables = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]')];
  const first = focusables[0], last = focusables.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

// The Capsule Bay is integrated into the original menu, not a separate website.
mission = initMission({onExit:()=>{ mainMenu.inert = false; if(priorFocus instanceof HTMLElement)priorFocus.focus(); },playSound:chirp});
capsuleBay = initCapsuleBay({onExit:()=>{if (priorFocus instanceof HTMLElement) priorFocus.focus();},playSound:chirp});
