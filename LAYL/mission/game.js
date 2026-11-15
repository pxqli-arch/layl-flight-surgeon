(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const world=$('#world'), player=$('#player'), avatar=$('#avatar'), overlay=$('#overlay'), body=$('#modalBody');
const destinations={medical:{x:20,y:66},oxygen:{x:36,y:63},greenhouse:{x:85,y:66},command:{x:53,y:63}};
const state={caseType:sessionStorage.getItem('layl-med-case')|| (Math.random()<.5?'oxygen':'medicine'),x:51,y:84,target:null,near:null,dir:'back',keys:{},oxygen:100,health:100,crew:96,crewChecked:false,crewTreated:false,emergency:false,oxygenDone:false,tanks:[24,45,11,62],selected:0,crops:{lettuce:0,radish:0,tomato:0},cropCare:{lettuce:false,radish:false,tomato:false},science:0,quiz:0,quizOpen:false,finished:false,interacted:0};
sessionStorage.setItem('layl-med-case',state.caseType);
const initialState=JSON.parse(JSON.stringify(state));
const stageKey='layl-stages-v3';
const stageDefault=()=>({current:1,done:[false,false,false],started:[Date.now(),null,null],seconds:[0,0,0],stage3Index:0,stage3Correct:0,stage3Mistakes:0,stage3Tried:false,stage2Baseline:0});
let stages=stageDefault();
const pilotKey='layl-pilot-results-v3';
function pilotHistory(){try{return JSON.parse(localStorage.getItem(pilotKey)||'[]')}catch(e){return []}}
function recordPilotSession(){if(stages.recorded)return;const rows=pilotHistory();rows.push({date:new Date().toISOString(),stage1:stages.done[0],stage2:stages.done[1],stage3:stages.done[2],firstChoice:stages.stage3Correct,wrongChoices:stages.stage3Mistakes,score:stageScore(),seconds:stages.seconds.join('/')});try{localStorage.setItem(pilotKey,JSON.stringify(rows));stages.recorded=true;saveStages()}catch(e){}}
function downloadPilotCSV(){const rows=pilotHistory();const header=['date','stage1','stage2','stage3','firstChoice','wrongChoices','score','seconds'];const csv=[header.join(','),...rows.map(r=>header.map(k=>String(r[k]??'').replaceAll(',', ';')).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LAYL-pilot-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}

try{const savedStages=JSON.parse(localStorage.getItem(stageKey)||'null');if(savedStages&&Array.isArray(savedStages.done)&&savedStages.done.length===3){stages={...stageDefault(),...savedStages};stages.current=Math.max(1,Math.min(3,stages.current))}}catch(e){}
const saveStages=()=>{try{localStorage.setItem(stageKey,JSON.stringify(stages))}catch(e){}};
const stageNames=['CREW RESCUE','CRYSTAL SUPPLY','EMERGENCY COMMAND'];
function stageSet(n){stages.current=n;if(!stages.started[n-1])stages.started[n-1]=Date.now();saveStages();updateHUD();showStageBrief(n)}
function stageDone(n){if(stages.done[n-1])return;stages.done[n-1]=true;stages.seconds[n-1]=Math.max(1,Math.round((Date.now()-(stages.started[n-1]||Date.now()))/1000));saveStages();updateHUD();if(n===3)recordPilotSession()}
function stageScore(){const completed=stages.done.filter(Boolean).length;const quality=Math.min(3,stages.stage3Correct)/3;return Math.round((completed/3)*70+quality*30)}
function stageDashboard(){const completed=stages.done.filter(Boolean).length;const score=stageScore();modal('mission report','Mission Training · 3 Stages',`<div class="stage-dashboard"><p class="sub">Try all three stages. Completion and decisions are recorded locally in this browser, for prototype testing.</p><div class="stage-score"><b>${score}%</b><span>IN-GAME SUCCESS SCORE</span><small>70% completion + 30% first-choice emergency decisions</small></div><div class="stage-board">${stageNames.map((name,i)=>`<button class="stage-board-row ${stages.done[i]?'cleared':''}" data-select-stage="${i+1}"><span class="stage-number">0${i+1}</span><span><b>${name}</b><small>${stages.done[i]?'✓ Completed':i===2?'3 priority decisions':i===1?'Collect and craft crystal research supply':'Treat astronaut emergency'}</small></span><em>${stages.done[i]?'DONE':'PLAY →'}</em></button>`).join('')}</div><div class="stage-progress-summary">${completed}/3 stages completed · ${stages.stage3Correct}/3 correct first decisions · ${stages.stage3Mistakes} incorrect selections</div><div class="actions"><button class="secondary" id="stageReturn">BACK TO BASE</button><button class="secondary" id="stageCSV">EXPORT TEST RESULTS CSV</button><button class="secondary" id="stageNew">NEW TEST SESSION</button></div></div>`);$$('[data-select-stage]').forEach(b=>b.addEventListener('click',()=>stageSet(Number(b.dataset.selectStage))));$('#stageReturn')?.addEventListener('click',close);$('#stageCSV')?.addEventListener('click',downloadPilotCSV);$('#stageNew')?.addEventListener('click',()=>{if(confirm('Start a fresh test? This resets mission progress on this device but keeps exported-session history.')){stages=stageDefault();saveStages();crystalSeed();Object.assign(state,JSON.parse(JSON.stringify(initialState)));state.caseType=Math.random()<.5?'oxygen':'medicine';sessionStorage.setItem('layl-med-case',state.caseType);updateHUD();stageSet(1)}})}
function showStageBrief(n){
 const entries={1:['CREW RESCUE','Help Amina by preparing two oxygen tanks or crafting a fictional medicine, depending on the emergency.','GO TO MEDICAL BAY',()=>{close();go('medical')}],2:['CRYSTAL SUPPLY','Create one fresh research supply by merging crystals in the Crystal Dome. Complete the 2 Amethyst + 1 Solar + 1 Azure recipe.','ENTER CRYSTAL DOME',()=>{close();go('greenhouse')}],3:['EMERGENCY COMMAND','Three time-critical decisions. Choose the safest response first. No science quiz — this is an interactive mission.','BEGIN EMERGENCY',showEmergency]};const [heading,desc,action,cb]=entries[n];modal('mission briefing',`Stage 0${n} · ${heading}`,`<div class="stage-brief"><span class="stage-count">0${n} / 03</span><h3>${heading}</h3><p>${desc}</p><button id="launchStage" class="primary">${action} →</button><button id="allStages" class="secondary">STAGE SELECT</button></div>`);$('#launchStage')?.addEventListener('click',cb);$('#allStages')?.addEventListener('click',stageDashboard)}
const emergencies=[
 {title:'OXYGEN WARNING',message:'Amina reports difficulty breathing while the team is outside collecting samples.',choices:['Finish collecting the samples first','Stop work, contact Mission Control, and follow the oxygen emergency procedure','Turn up the heater to help her breathe'],correct:1,why:'Crew safety and communication come before collecting samples.'},
 {title:'TWO ALERTS AT ONCE',message:'An astronaut is unwell and the emergency supply cabinet is being inspected. What comes first?',choices:['Check the crewmate and follow the approved emergency plan','Ignore the crewmate until all routine work is finished','Try a random treatment from the storage locker'],correct:0,why:'Assess the crew member and follow approved procedures; do not guess treatments.'},
 {title:'MISSION RESUMPTION',message:'Your crewmate is now stable. The team wants to resume work.',choices:['Resume immediately without informing anyone','Hide the incident to save time','Confirm the crew is cleared, report to Mission Control, then resume'],correct:2,why:'Confirming recovery and reporting the event protects the crew.'}
];
function showEmergency(feedback=''){
 const idx=stages.stage3Index;
 if(idx>=emergencies.length){stageDone(3);return showFinalReport()}
 const q=emergencies[idx];modal('emergency command',`Stage 03 · Decision ${idx+1}/3`,`<div class="emergency-stage"><div class="emergency-pulse">⚠ CREW ALERT · PRIORITY LEVEL ${3-idx}</div><h3>${q.title}</h3><p>${q.message}</p><div class="emergency-options">${q.choices.map((choice,i)=>`<button data-urgent-choice="${i}" class="emergency-choice">${String.fromCharCode(65+i)} · ${choice}</button>`).join('')}</div><p class="emergency-hint">Choose the safest action. Mistakes can be corrected, but count in your results.</p>${feedback?`<p class="alert">${feedback}</p>`:''}</div>`);$$('[data-urgent-choice]').forEach(b=>b.addEventListener('click',()=>{const choice=Number(b.dataset.urgentChoice);if(choice===q.correct){if(!stages.stage3Tried)stages.stage3Correct++;stages.stage3Index++;stages.stage3Tried=false;saveStages();modal('emergency command','Crew Decision Logged',`<div class="stage-brief"><span class="stage-count">✓ APPROVED RESPONSE</span><h3>${q.title}</h3><p>${q.why}</p><button class="primary" id="emergencyNext">${stages.stage3Index===3?'VIEW MISSION RESULTS':'NEXT EMERGENCY'} →</button></div>`);$('#emergencyNext')?.addEventListener('click',()=>{if(stages.stage3Index===3){stageDone(3);showFinalReport()}else showEmergency()})}else{stages.stage3Tried=true;stages.stage3Mistakes++;saveStages();showEmergency('Try a safer choice. Think about your crew first!')}}))}
function showFinalReport(){const complete=stages.done.filter(Boolean).length;const score=stageScore();recordPilotSession();modal('mission report','LAYL · Mission Results',`<div class="stage-results"><div class="results-medal">${complete===3?'🏅':'🌟'}</div><h2>${complete===3?'ALL THREE STAGES COMPLETE!':'MISSION TRAINING PROGRESS'}</h2><div class="stage-score"><b>${score}%</b><span>IN-GAME SUCCESS SCORE</span></div><div class="results-grid"><div><b>${complete} / 3</b><span>STAGES CLEARED</span></div><div><b>${stages.stage3Correct} / 3</b><span>FIRST-TRY DECISIONS</span></div><div><b>${stages.stage3Mistakes}</b><span>CORRECTED MISTAKES</span></div></div><p class="sub">This is an in-game prototype score, not evidence of real-world astronaut readiness or measured learning impact. Pilot testing will compare results from real sessions.</p><button class="primary" id="resultsBack">RETURN TO LUNAR BASE</button><button class="secondary" id="resultsStages">STAGE SELECT</button><button class="secondary" id="resultsCSV">DOWNLOAD TEST RESULTS CSV</button></div>`);$('#resultsBack')?.addEventListener('click',close);$('#resultsStages')?.addEventListener('click',stageDashboard);$('#resultsCSV')?.addEventListener('click',downloadPilotCSV)}

const collection={owned:['Falcon Cadet'],pulls:0};
const initialCollection=JSON.parse(JSON.stringify(collection));
const OWNER_CODE='LAYL2026';
const avatarSrc={up:'back.webp',down:'front.webp',left:'left.webp',right:'right.webp'};let last=performance.now(),toastTimer,holdTimer,menu=null,saved=false;
function tell(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function chooseDir(d){if(state.dir!==d){state.dir=d;avatar.src='assets/player/'+avatarSrc[d]}}
function readyTanks(){return state.tanks.filter(v=>v>=100).length}
function updateAttention(){
 const current=stages.current===3?null:stages.current===2?'greenhouse':state.crewTreated?null:state.caseType==='medicine'?(crystalState.meds>0?'medical':'greenhouse'):(state.oxygenDone?'medical':'oxygen');
 $$('.hotspot').forEach(el=>{const key=el.dataset.go;el.classList.toggle('needs-attention',key===current);el.classList.toggle('completed',(key==='oxygen'&&state.oxygenDone)||(key==='medical'&&state.crewTreated));});
}
function updateHUD(){
 state.oxygen=clamp(state.oxygen,0,100);
 $('#oxygenBar').style.width=state.oxygen+'%';$('#oxygenText').textContent=Math.round(state.oxygen)+'%';
 $('#healthBar').style.width=state.health+'%';$('#healthText').textContent=Math.round(state.health)+'%';
 $('#crewStatus').textContent='AMINA · '+(state.crewTreated?'STABLE':'NEEDS HELP');
 $('#briefNote').textContent=stages.current===3?'Mission 03: crew safety and decision-making':stages.current===2?'Mission 02: prepare crystal research supply':state.crewTreated?'Amina is safe! Great work, Cadet.':state.caseType==='oxygen'?'Low oxygen: prepare two tanks, then visit Medical Bay.':'High temperature: craft a fictional medicine, then visit Medical Bay.';
 $('#objective small').textContent=`STAGE 0${stages.current} / 03 · ${stageNames[stages.current-1]}`;
 $('#objective strong').textContent=nextTask();updateAttention();
}
function allCrops(){return Object.values(state.cropCare).every(Boolean)}
function nextTask(){
 if(stages.current===3)return stages.done[2]?'03 · Emergency response complete':`03 · Emergency decisions (${stages.stage3Index}/3)`;
 if(stages.current===2)return stages.done[1]?'02 · Research supply ready':'02 · Craft 1 crystal research supply';
 if(state.crewTreated)return '01 · Crew rescued! Stage 2 is ready';
 if(state.caseType==='medicine')return crystalState.meds>0?'01 · Bring medicine to Medical Bay':'01 · Craft medicine in Crystal Dome';
 return state.oxygenDone?'01 · Help Amina in Medical Bay':`01 · Fill 2 oxygen tanks (${readyTanks()}/2)`;
}
function maybeEmergency(){if(state.caseType==='oxygen'&&state.oxygenDone&&!state.emergency){state.emergency=true;state.crew=73;tell('⚠ AMINA NEEDS OXYGEN · Go to Medical Bay!');updateHUD()}}
function maybeFinish(){if(state.crewTreated){state.finished=true;stageDone(1)}updateHUD()}
function openMainMenu(){state.target=null;state.keys={};$('#destination').classList.remove('visible');$('#intro').classList.remove('hidden');$('#groundHint').style.display='none'}
function startMission(){$('#intro').classList.add('hidden');$('#groundHint').style.display='';tell('Choose STAGES to select a training mission.');updateHUD();stageDashboard()}
function resetProgress(){try{localStorage.removeItem('layl-crystal-lab-v1.9');localStorage.removeItem(stageKey)}catch(e){}stages=stageDefault();crystalSeed();Object.assign(state,JSON.parse(JSON.stringify(initialState)));state.caseType=Math.random()<.5?'oxygen':'medicine';sessionStorage.setItem('layl-med-case',state.caseType);Object.assign(collection,JSON.parse(JSON.stringify(initialCollection)));avatar.src='assets/player/'+avatarSrc[state.dir];player.style.left=state.x+'%';player.style.top=state.y+'%';state.target=null;state.near=null;$('#destination').classList.remove('visible');overlay.classList.add('hidden');menu=null;updateHUD();openMainMenu();tell('Owner reset complete.')}
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;let mx=0,my=0;if(overlay.classList.contains('hidden')&&$('#intro').classList.contains('hidden')){if(state.keys.ArrowLeft||state.keys.a)mx--;if(state.keys.ArrowRight||state.keys.d)mx++;if(state.keys.ArrowUp||state.keys.w)my--;if(state.keys.ArrowDown||state.keys.s)my++;if(mx||my){state.target=null;$('#destination').classList.remove('visible');const n=Math.hypot(mx,my);mx/=n;my/=n;state.x+=mx*22*dt;state.y+=my*20*dt;chooseDir(Math.abs(mx)>Math.abs(my)?mx>0?'right':'left':my>0?'down':'up')}else if(state.target){const dx=state.target.x-state.x,dy=state.target.y-state.y,d=Math.hypot(dx,dy);if(d<.65){const enter=state.target.station;state.target=null;$('#destination').classList.remove('visible');if(enter)openStation(enter)}else{state.x+=dx/d*24*dt;state.y+=dy/d*21*dt;chooseDir(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')}}state.x=clamp(state.x,10,91);state.y=clamp(state.y,65,89);state.oxygen=Math.max(5,state.oxygen-dt*.018);player.style.left=state.x+'%';player.style.top=state.y+'%';player.style.width=(43+(state.y-65)*1.15)+'px';const closest=Object.keys(destinations).map(k=>({k,d:Math.hypot((state.x-destinations[k].x)*.7,state.y-destinations[k].y)})).sort((a,b)=>a.d-b.d)[0];state.near=closest?.d<10?closest.k:null;if(Math.round(t)%500<20)updateHUD()}requestAnimationFrame(frame)}
function go(station){
 // A station click is instant: move the avatar to its entrance and open it.
 state.target=null;state.keys={};
 state.x=destinations[station].x;state.y=destinations[station].y;
 player.style.left=state.x+'%';player.style.top=state.y+'%';
 chooseDir('up');$('#destination').classList.remove('visible');
 openStation(station);
}
function modal(name,title,html){
  $('.modal').classList.remove('crystal-modal');
  menu=name;
  const station={
    'medical bay':['medical','MEDICAL BAY','Protect your crew','Live crew status • Medical decisions'],
    'life support':['oxygen','LIFE SUPPORT','Every breath matters','Prepare your emergency reserves'],
    'crystal lab':['crystal','CRYSTAL LAB','Discover the Moon','Collect and combine crystal specimens'],
    'botanical dome':['greenhouse','CRYSTAL DOME','Collect & craft','Crystal discovery training game'],
    'mission control':['command','MISSION CONTROL','Your lunar shift','Return to your academy main menu'],
    'mission report':['command','MISSION REPORT','Mission accomplished','Your choices. Your learning. Your future.']
  }[name] || ['command','LAYL','Lunar Research','Learn through discovery'];
  const dialog=$('.modal');
  dialog.dataset.station=station[0];
  $('#modalEyebrow').textContent='LAYL / '+station[1];
  $('#modalTitle').textContent=title;
  body.innerHTML=`<div class="station-scene scene-${station[0]}" role="img" aria-label="Illustrated ${station[1].toLowerCase()} lunar base interior"><div class="scene-vignette"><span class="scene-kicker">◈ LAYL RESEARCH FACILITY</span><h2>${station[2]}</h2><p>${station[3]}</p></div></div><div class="station-content">${html}</div>`;
  overlay.classList.remove('hidden');
  state.keys={};
  $('#groundHint').style.display='none';
  $('#closeModal').focus();
}
function close(){endHold();overlay.classList.add('hidden');menu=null;$('#groundHint').style.display='';maybeFinish()}
function openStation(s){if(s==='medical')showMedical();if(s==='oxygen')showOxygen();if(s==='greenhouse')showCrystalLab();if(s==='command')showCommand()}
function showCommand(){
 modal('mission control','Return to Main Menu?',`<div class="command-return"><p class="sub" style="font-size:18px;color:#eaf5ff">Do you want to return to the main menu?</p><p class="sub">Your stage progress and current results will stay saved in this browser.</p><div class="actions"><button class="primary" id="confirmMainMenu">YES, MAIN MENU →</button><button class="secondary" id="stayInMission">NO, KEEP PLAYING</button></div></div>`);
 $('#confirmMainMenu')?.addEventListener('click',()=>{
   saveStages();
   close();
   if(window.parent!==window){window.parent.postMessage({type:'layl-return-menu'},location.origin)}
   else openMainMenu();
 });
 $('#stayInMission')?.addEventListener('click',close);
}

function showMedical(){
 const oxygenCase=state.caseType==='oxygen';
 const hasSupply=oxygenCase?readyTanks()>=2:crystalState.meds>=1;
 const healed=state.crewTreated;
 const image=`assets/medical/${oxygenCase?'oxygen':'medicine'}-${healed?'well':'low'}.webp`;
 const heading=healed?'AMINA IS FEELING BETTER!':oxygenCase?'AMINA NEEDS OXYGEN!':'AMINA HAS A HIGH TEMPERATURE!';
 const explanation=healed?'Great job! You helped your crewmate.':oxygenCase?'Fill any 2 oxygen tanks completely, then bring oxygen to Amina.':'Collect crystals in the Dome to craft 1 fictional medicine, then bring it to Amina.';
 const reading=oxygenCase?'OXYGEN LEVEL':'TEMPERATURE';
 const value=healed?(oxygenCase?'98%':'36.7°C'):(oxygenCase?'91%':'38.9°C');
 const action=oxygenCase?'GIVE OXYGEN TO AMINA':'GIVE MEDICINE TO AMINA';
 const route=oxygenCase?'oxygen':'greenhouse';
 const routeLabel=oxygenCase?'GO FILL OXYGEN TANKS':'GO TO CRYSTAL DOME';
 const readyText=oxygenCase?`${readyTanks()} / 2 tanks ready`:`${crystalState.meds} / 1 medicine ready`;
 modal('medical bay','Crew Medical Bay',`<div class="medbay-simple">
  <div class="medbay-image-wrap"><img class="medbay-patient" src="${image}" alt="Amina ${healed?'recovered and smiling':oxygenCase?'using an oxygen mask':'feeling dizzy with a high temperature'}"></div>
  <section class="medbay-control"><div class="medbay-status ${healed?'is-well':'is-sick'}">${healed?'✓ ALL BETTER':'! NEEDS HELP'}</div>
   <h3>${heading}</h3><p>${explanation}</p>
   <div class="medbay-reading"><span>${reading}</span><strong>${value}</strong></div>
   ${healed?`<div class="medbay-success">✓ TREATMENT COMPLETE! WELL DONE!</div><button class="medbay-main-button" id="nextStageMedical">NEXT · STAGE 02 →</button>`:
   `<div class="medbay-supply">${readyText}</div><button class="medbay-main-button" id="${hasSupply?'assistCrew':'goSupply'}">${hasSupply?action:routeLabel} →</button>`}
   <button class="medbay-back" id="leaveMedical">← BACK TO MOON BASE</button>
   <small class="medbay-disclaimer">Fictional training scenario. Real medical treatment requires professional judgment.</small>
  </section></div>`);
 $('#assistCrew')?.addEventListener('click',()=>{
   if(oxygenCase&&readyTanks()<2)return;
   if(!oxygenCase){if(crystalState.meds<1)return;crystalState.meds--;crystalSave()}
   state.crewChecked=true;state.crewTreated=true;state.crew=96;state.interacted++;
   tell(oxygenCase?'✓ Oxygen delivered! Amina is recovering.':'✓ Medicine delivered! Amina is recovering.');
   maybeFinish();
   showMedical();
 });
 $('#goSupply')?.addEventListener('click',()=>{close();go(route)});
 $('#leaveMedical')?.addEventListener('click',close);
 $('#nextStageMedical')?.addEventListener('click',()=>stageSet(2));
}
function showOxygen(){
 modal('life support','Fill the Oxygen Tanks',`<div class="oxygen-simple"><p class="oxygen-instruction">Choose a tank. Hold the button to fill it.</p><div class="tank-grid" id="tanks"></div><div class="oxygen-action"><button class="primary" id="holdRefill">HOLD TO FILL TANK 1</button></div><p class="oxygen-complete" id="oxygenComplete" role="status" aria-live="polite"></p></div>`);
 renderTanks();
 const btn=$('#holdRefill');
 btn.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();btn.setPointerCapture?.(e.pointerId);startHold()});
 ['pointerup','pointercancel','lostpointercapture'].forEach(k=>btn.addEventListener(k,endHold));
 btn.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();startHold()}});
 btn.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();endHold()}});
}
function renderTanks(){
 const el=$('#tanks');if(!el)return;
 const allReady=state.tanks.every(v=>v>=100);
 if(readyTanks()>=2&&!state.oxygenDone){state.oxygenDone=true;maybeEmergency();updateHUD()}
 el.innerHTML=state.tanks.map((v,i)=>`<button class="tank ${i===state.selected?'selected':''} ${v>=100?'ready':''}" data-tank="${i}" aria-label="Tank ${i+1}, ${Math.round(v)} percent full" aria-pressed="${i===state.selected}"><strong>TANK ${i+1}</strong><span class="tank-vial"><span class="tank-liquid" style="height:${v}%"></span></span><span class="tank-percent">${Math.round(v)}%</span>${v>=100?'<span class="tank-check">✓ READY</span>':''}</button>`).join('');
 $$('[data-tank]').forEach(e=>e.addEventListener('click',()=>{endHold();state.selected=Number(e.dataset.tank);renderTanks()}));
 const btn=$('#holdRefill');if(!btn)return;
 btn.disabled=allReady||state.tanks[state.selected]>=100;
 if(allReady){btn.textContent='✓ ALL FOUR TANKS FULL';$('#oxygenComplete').textContent='Great work! Return to the plaza and help Amina in Medical Bay.'}
 else{btn.textContent=state.tanks[state.selected]>=100?'✓ TANK FULL — SELECT ANOTHER':holdTimer?'FILLING… KEEP HOLDING':`HOLD TO FILL TANK ${state.selected+1}`;$('#oxygenComplete').textContent=state.oxygenDone?'✓ Two tanks ready! You can help Amina now, or fill more tanks.':''}
}
function startHold(){if(holdTimer||state.tanks[state.selected]>=100)return;
 holdTimer=setInterval(()=>{state.tanks[state.selected]=Math.min(100,state.tanks[state.selected]+2.5);renderTanks();if(state.tanks[state.selected]>=100){endHold();tell(`Tank ${state.selected+1} full!`)}},80);renderTanks()}
function endHold(){if(holdTimer){clearInterval(holdTimer);holdTimer=null}if($('#tanks'))renderTanks()}
// CRYSTAL LAB — independent optional collecting mini-game. Mission 01 oxygen rescue stays unchanged.
const crystalKinds=['blue','purple','gold'];
const crystalNames={blue:'Azure',purple:'Amethyst',gold:'Solar'};
const crystalGridSize=25;
const medicineRecipe={blue:1,purple:2,gold:1};
const crystalState={board:Array(crystalGridSize).fill(null),selected:null,collection:{blue:0,purple:0,gold:0},merges:0,discoveries:0,meds:0};
const crystalKey='layl-crystal-lab-v1.9';
function crystalSave(){try{localStorage.setItem(crystalKey,JSON.stringify({board:crystalState.board,collection:crystalState.collection,merges:crystalState.merges,discoveries:crystalState.discoveries,meds:crystalState.meds}))}catch(e){}}
function crystalLoad(){try{const s=JSON.parse(localStorage.getItem(crystalKey));if(s&&Array.isArray(s.board)&&s.board.length===25){crystalState.board=s.board.map(c=>(c&&crystalKinds.includes(c.kind)&&[1,2,3].includes(c.level))?c:null);for(const k of crystalKinds)crystalState.collection[k]=Math.max(0,Number(s.collection?.[k])||0);crystalState.merges=Math.max(0,Number(s.merges)||0);crystalState.discoveries=Math.max(0,Number(s.discoveries)||0);crystalState.meds=Math.max(0,Number(s.meds)||0);return}}catch(e){}crystalSeed()}
function crystalSeed(){crystalState.collection={blue:0,purple:0,gold:0};crystalState.merges=0;crystalState.discoveries=0;crystalState.board=Array(25).fill(null);for(const [index,kind] of [[1,'blue'],[4,'purple'],[8,'blue'],[11,'gold'],[16,'purple'],[20,'gold']])crystalState.board[index]={kind,level:1};crystalState.selected=null;crystalState.meds=0;crystalSave()}
function crystalIcon(c){return `assets/crystals/${c.kind}-${c.level}.png`}
function crystalBoardHTML(){return crystalState.board.map((c,i)=>`<button type="button" class="crystal-cell ${c?'has-crystal':''} ${crystalState.selected===i?'selected':''}" data-crystal-cell="${i}" draggable="${!!c}" aria-label="${c?crystalNames[c.kind]+' crystal tier '+c.level:'Empty square'} row ${Math.floor(i/5)+1}, column ${i%5+1}">${c?`<img draggable="false" src="${crystalIcon(c)}" alt=""><small>LV ${c.level}</small>`:''}</button>`).join('')}
function showCrystalLab(){
 crystalState.selected=null;
 modal('botanical dome','Crystal Dome · Merge & Craft',`<div class="crystal-game">
  <div class="crystal-heading"><div><span class="crystal-eyebrow">LAYL · CRYSTAL DOME</span><h3>Merge. Collect. Make Medicine!</h3><p>Move crystals into empty squares or match two of the same color and level. Every valid move reveals a new crystal!</p></div><div class="crystal-score">✦ <b id="crystalScore">${crystalState.merges}</b><small>MERGES</small></div></div>
  <div class="crystal-layout">
   <section class="crystal-board-wrap" aria-label="Crystal merging puzzle">
    <div class="crystal-board" id="crystalBoard">${crystalBoardHTML()}</div>
    <div class="crystal-board-foot"><span id="crystalFeedback" role="status" aria-live="polite">Choose a crystal and move it. Matching crystals merge!</span></div>
   </section>
   <aside class="crystal-sidebar">
    <div class="crystal-recipe"><div class="crystal-collection-title">🧪 MEDICINE RECIPE</div><p class="recipe-info">Collect these Level 3 crystals to craft <b>1 medicine</b>.</p>
      <div id="recipeRequirements" class="recipe-requirements"></div>
      <div class="recipe-total">Medicine crafted: <b id="medCount">${crystalState.meds}</b></div>
      <button type="button" class="crystal-craft-btn" id="crystalCraft" disabled>CRAFT MEDICINE</button>
    </div>
    <div class="crystal-guide"><div class="crystal-step">01 <span>Tap a crystal, then tap its new square</span></div><div class="crystal-step">02 <span>Match identical crystals to level up</span></div><div class="crystal-step">03 <span>Level 3 sparkles and is collected!</span></div></div>
    <div class="crystal-collection-title">CRYSTALS COLLECTED</div>
    <div class="crystal-collection">${crystalKinds.map(k=>`<div class="crystal-collect"><img src="assets/crystals/${k}-3.png" alt="${crystalNames[k]} crystal"><span>${crystalNames[k]}</span><b id="crystalCount-${k}">${crystalState.collection[k]}</b></div>`).join('')}</div>
    <div class="crystal-tip">A fictional crafting activity for children. These crystals do not make real medicines.</div>
    <button type="button" class="crystal-exit" id="crystalExit">← RETURN TO MOON BASE</button>
   </aside>
  </div></div>`);
 $('.modal').classList.add('crystal-modal');
 crystalBind();crystalRender();
 $('#crystalExit').addEventListener('click',close);
 $('#crystalCraft').addEventListener('click',crystalCraft);
}
function crystalRender(){
 const board=$('#crystalBoard');if(!board)return;
 board.innerHTML=crystalBoardHTML();$('#crystalScore').textContent=crystalState.merges;
 for(const k of crystalKinds){const el=$(`#crystalCount-${k}`);if(el)el.textContent=crystalState.collection[k]}
 const medEl=$('#medCount');if(medEl)medEl.textContent=crystalState.meds;
 const requirements=$('#recipeRequirements');
 if(requirements)requirements.innerHTML=[['purple','Amethyst'],['gold','Solar'],['blue','Azure']].map(([k,n])=>{
  const have=crystalState.collection[k],need=medicineRecipe[k];
  return `<div class="recipe-item ${have>=need?'recipe-ready':''}"><img src="assets/crystals/${k}-3.png" alt=""><div><strong>${n}</strong><small>${have} / ${need} collected</small></div><span>${have>=need?'✓':`${need}`}</span></div>`;
 }).join('');
 crystalBindCells();
 const craft=$('#crystalCraft');if(craft)craft.disabled=!crystalKinds.every(k=>crystalState.collection[k]>=medicineRecipe[k]);
}
function crystalCraft(){
 if(!crystalKinds.every(k=>crystalState.collection[k]>=medicineRecipe[k])){crystalMessage('Collect 2 pink, 1 orange and 1 blue Level 3 crystals first!');return}
 for(const k of crystalKinds)crystalState.collection[k]-=medicineRecipe[k];
 crystalState.meds++;crystalMessage('🧪 Medicine crafted! Fantastic work, Cadet!');crystalSave();crystalRender();updateHUD();if(stages.current===2&&!stages.done[1]){stageDone(2);showStage2Success()}else tell('✓ Medicine ready! Go to the Medical Bay if your crewmate needs it.');
}
function showStage2Success(){modal('mission report','Stage 02 · Research Supply Ready!',`<div class="stage-brief"><div class="results-medal">💎</div><span class="stage-count">✓ STAGE 02 COMPLETE</span><h3>Crystal supply prepared!</h3><p>Great job collecting and merging crystals. Your fictional research medicine is ready in the supply cabinet.</p><div class="actions"><button id="stage2Continue" class="primary">START STAGE 03 →</button><button id="stage2Base" class="secondary">BACK TO BASE</button></div></div>`);$('#stage2Continue')?.addEventListener('click',()=>stageSet(3));$('#stage2Base')?.addEventListener('click',close)}
function crystalCelebrate(index,kind){
 const square=document.querySelector(`[data-crystal-cell="${index}"]`);
 if(!square)return;
 square.classList.add('crystal-celebrate');
 square.innerHTML=`<span class="sparkle-burst" aria-hidden="true">✦ ✨ ✦</span><img src="assets/crystals/${kind}-3.png" alt=""><strong class="auto-collected">+1 COLLECTED!</strong>`;
 window.setTimeout(()=>{if(document.contains(square))square.classList.remove('crystal-celebrate');crystalRender()},700);
}
function crystalCollect(){crystalMessage('Level 3 crystals are automatically collected!')}
function crystalMessage(message){const el=$('#crystalFeedback');if(el)el.textContent=message}
function crystalAction(index){const c=crystalState.board[index];const chosen=crystalState.selected;if(chosen===null){if(c){crystalState.selected=index;crystalMessage('Now tap a matching crystal!')}else{crystalMessage('Choose a crystal first, or discover a new one.')}crystalRender();return}if(chosen===index){crystalState.selected=null;crystalMessage('Crystal deselected.');crystalRender();return}crystalMove(chosen,index)}
function crystalSpawnRandom(){
 const available=crystalState.board.map((c,i)=>c===null?i:-1).filter(i=>i>=0);
 if(!available.length)return false;
 const spot=available[Math.floor(Math.random()*available.length)];
 const kind=crystalKinds[Math.floor(Math.random()*crystalKinds.length)];
 crystalState.board[spot]={kind,level:1};crystalState.discoveries++;
 return true;
}
function crystalMove(from,to){
 const source=crystalState.board[from],dest=crystalState.board[to];crystalState.selected=null;
 if(!source||from===to){crystalRender();return}
 let earned=null;let action='';
 if(!dest){
  crystalState.board[to]=source;crystalState.board[from]=null;action='Crystal moved! A new crystal appeared.';
 }else if(dest.kind===source.kind&&dest.level===source.level){
  crystalState.board[from]=null;
  if(dest.level===2){
   // Level 3: sparkle, disappear from board, and add to collection automatically.
   crystalState.board[to]=null;crystalState.collection[dest.kind]++;
   earned=dest.kind;action=`✨ ${crystalNames[dest.kind]} Level 3 collected automatically!`;
  }else if(dest.level===3){
   crystalState.board[to]=null;crystalState.collection[dest.kind]+=2;
   earned=dest.kind;action=`✨ Two ${crystalNames[dest.kind]} Level 3 crystals collected!`;
  }else{
   crystalState.board[to]={kind:dest.kind,level:dest.level+1};
   action=`✨ MERGE! Level ${dest.level+1} ${crystalNames[dest.kind]} crystal!`;
  }
  crystalState.merges++;
 }else{
  crystalMessage('Not a match! Merge two crystals of the same color and level.');crystalRender();return;
 }
 const spawned=crystalSpawnRandom();
 if(!spawned)action+=' The board is full—make a merge to free space.';
 crystalSave();crystalRender();crystalMessage(action);
 if(earned)crystalCelebrate(to,earned);
}
function crystalBindCells(){document.querySelectorAll('[data-crystal-cell]').forEach(cell=>{const index=Number(cell.dataset.crystalCell);cell.addEventListener('click',()=>crystalAction(index));cell.addEventListener('dragstart',e=>{if(!crystalState.board[index]){e.preventDefault();return}e.dataTransfer.setData('text/plain',String(index));e.dataTransfer.effectAllowed='move'});cell.addEventListener('dragover',e=>e.preventDefault());cell.addEventListener('drop',e=>{e.preventDefault();const from=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(from)&&from>=0&&from<25&&from!==index)crystalMove(from,index)})})}
function crystalBind(){crystalBindCells()}
crystalLoad();

const cropNames={lettuce:'Red Romaine',radish:'Radishes',tomato:'Dwarf Tomatoes'};const cropIcons={lettuce:'🥬',radish:'🌱',tomato:'🍅'};
function showGreenhouse(){modal('botanical dome','Lunar Greenhouse',`<p class="sub">Space agriculture matters on long missions. Care for <strong>three research crops</strong> by adjusting their environment; watch the simulated growth response.</p><div class="crop-grid">${Object.keys(cropNames).map(k=>`<div class="crop"><span class="emoji">${cropIcons[k]}</span><strong>${cropNames[k]}</strong><small>${k==='lettuce'?'Leafy green · Veggie research':k==='radish'?'Root crop · Advanced Plant Habitat':'Fruit crop · VEG-05'}</small><div class="mini-track"><i style="width:${state.crops[k]}%"></i></div><button class="${state.cropCare[k]?'secondary':'primary'}" data-crop="${k}" ${state.cropCare[k]?'disabled':''}>${state.cropCare[k]?'✓ CARED FOR':'TEND CROP →'}</button></div>`).join('')}</div><div class="alert success" style="margin-top:16px">NASA CONNECTION · Astronauts have grown lettuce, radishes and dwarf tomatoes in orbit. Mission growth is accelerated for this game.</div><div class="actions"><button class="secondary" id="leaveGreenhouse">RETURN TO PLAZA</button></div>`);$$('[data-crop]').forEach(e=>e.addEventListener('click',()=>showCrop(e.dataset.crop)));$('#leaveGreenhouse').addEventListener('click',close)}
function showCrop(k){const selected={lettuce:{focus:'Water',correct:'water',msg:'Lettuce needs careful water management so its roots can absorb moisture without becoming waterlogged.'},radish:{focus:'Nutrients',correct:'nutrients',msg:'Radishes form edible roots. Their growing environment needs balanced water, nutrients and light.'},tomato:{focus:'Light',correct:'light',msg:'Tomatoes need sufficient light energy to support growth and eventually form fruit.'}}[k];modal('botanical dome',cropNames[k]+' · Crop Lab',`<p class="sub">The ${cropNames[k]} research pod needs your attention. Choose the best environmental adjustment for this training scenario.</p><div class="panel"><div class="row" style="justify-content:space-between"><span style="font-size:55px">${cropIcons[k]}</span><div style="text-align:right"><span class="pill">SIMULATED GROWTH</span><h3 style="font-size:28px;margin-top:9px">${state.crops[k]}%</h3></div></div><div class="mini-track"><i style="width:${state.crops[k]}%"></i></div></div><div class="alert">MISSION CONTROL: This pod's <strong>${selected.focus.toLowerCase()} supply</strong> needs adjustment.</div><div class="actions"><button class="secondary" data-choice="water">💧 ADD WATER</button><button class="secondary" data-choice="light">☀ ADJUST LIGHT</button><button class="secondary" data-choice="nutrients">⚗ ADD NUTRIENTS</button></div>`);$$('[data-choice]').forEach(el=>el.addEventListener('click',()=>{const correct=el.dataset.choice===selected.correct;state.crops[k]=correct?100:Math.min(100,state.crops[k]+15);if(correct){state.cropCare[k]=true;state.interacted++;tell('✓ '+cropNames[k]+' pod stabilized');maybeEmergency();maybeFinish()}else tell('Not quite — try another adjustment.');modal('botanical dome',correct?'Crop stabilized':'Try another approach',`<div class="alert ${correct?'success':''}">${correct?'✓':'✦'} ${correct?selected.msg:'The adjustment helped a little, but did not solve this pod’s primary issue.'}</div><div class="actions"><button class="primary" id="backCrops">${correct?'BACK TO GREENHOUSE':'TRY AGAIN'} →</button></div>`);$('#backCrops').addEventListener('click',()=>correct?showGreenhouse():showCrop(k))}))}
function showGuide(){modal('field guide','How to Play',`<p class="sub">Explore your Command Plaza. Press <strong>WASD / arrow keys</strong> to walk, click a glowing station marker to enter, or press STAGES to select a mission.</p><div class="mission-list"><div class="mission-item">O₂ Life Support <span>LOW OXYGEN EMERGENCIES</span></div><div class="mission-item">✚ Medical Bay <span>GIVE THE NEEDED SUPPLY</span></div><div class="mission-item">✧ Crystal Dome <span>MERGE & CRAFT MEDICINE</span></div><div class="mission-item">✦ Mission Control <span>RETURN TO MAIN MENU</span></div></div><div class="alert success">The game uses simplified, simulated science for learning, not real medical training or spacecraft operating instructions.</div>`)}
function showCredits(){modal('credits','Credits & Sources',`<div class="credits-top"><h3>Why the name LAYL?</h3><p class="sub">Layl means <strong>night</strong> in Arabic — inspired by the curiosity, wonder, and discovery that begin when children look up at the night sky.</p></div><div class="credits-list"><div class="credits-group"><h4>Project</h4><p>Created by Team Layl · Junior Astronaut Mission Trainer</p></div><div class="credits-group"><h4>Research & inspiration</h4><a href="https://www.nasa.gov/humans-in-space/flight-surgeons/" target="_blank">NASA Flight Surgeons</a><a href="https://www.nasa.gov/hrp/elements/smop/" target="_blank">NASA Medical & Pharmacology</a><a href="https://www.nasa.gov/directorates/stmd/space-tech-research-grants/exploration-medical-capability/" target="_blank">Exploration Medical Technologies</a><a href="https://www.nasa.gov/hrp/bodyinspace/" target="_blank">Cardiovascular Health / NASA Human Research Program</a><a href="https://www.nasa.gov/missions/station/growing-plants-in-space/" target="_blank">Growing Plants in Space</a><a href="https://www.spaceappschallenge.org/nasa-space-apps-2026/find-a-team/build-a-junior-astronaut-mission-trainer/" target="_blank">NASA Space Apps Challenge</a><a href="https://www.lego.com/en-us/aboutus/news/2019/july/lego-life-space" target="_blank">LEGO Group Space Study</a></div></div><div class="actions"><button class="secondary" id="closeCredits">BACK</button></div>`);$('#closeCredits').addEventListener('click',close)}
function showCharacters(){const pool=[{name:'Falcon Cadet',tier:'Starter',role:'Player mascot',desc:'Your default falcon astronaut for Mission 01.'},{name:'Amina EVA Specialist',tier:'Rare',role:'Crew rescue target',desc:'A vital teammate who needs oxygen support.'},{name:'Noor Botanist',tier:'Rare',role:'Botanical lead',desc:'Specialist in food systems and space crops.'},{name:'Rashid Flight Medic',tier:'Epic',role:'Medical response',desc:'Supports monitoring, vitals and crew care.'},{name:'Mira Systems Pilot',tier:'Epic',role:'Mission control',desc:'Balances systems and mission decisions.'},{name:'Orion Life Support Chief',tier:'Legendary',role:'Oxygen systems',desc:'Master of breathing systems and emergency prep.'}];const owned=new Set(collection.owned);const grid=pool.map(card=>`<div class="char-card ${owned.has(card.name)?'owned':'locked'}"><div class="char-tier">${owned.has(card.name)?card.tier:'LOCKED'}</div><strong>${card.name}</strong><small>${card.role}</small><p>${owned.has(card.name)?card.desc:'Open character capsules to unlock more crew members.'}</p></div>`).join('');modal('characters','Character Capsules',`<p class="sub">Build your crew through LAYL's gacha-style capsule system. Collect astronauts, support staff, and specialists as you grow your academy.</p><div class="actions"><button class="primary" id="openCapsule">OPEN STAR CAPSULE ✦</button><span class="pill">Owned: ${collection.owned.length}/${pool.length}</span></div><div class="character-grid">${grid}</div>`);$('#openCapsule').addEventListener('click',()=>{const missing=pool.filter(c=>!owned.has(c.name));const pick=(missing.length?missing:pool)[Math.floor(Math.random()*(missing.length?missing:pool).length)];if(!owned.has(pick.name)){collection.owned.push(pick.name)}collection.pulls++;modal('characters','Capsule Opened!',`<div class="alert success">✓ You unlocked <strong>${pick.name}</strong> · <strong>${pick.tier}</strong></div><div class="char-card owned single"><div class="char-tier">${pick.tier}</div><strong>${pick.name}</strong><small>${pick.role}</small><p>${pick.desc}</p></div><div class="actions"><button class="primary" id="backCharacters">BACK TO CHARACTERS →</button></div>`);$('#backCharacters').addEventListener('click',showCharacters)})}
function showAchievements(){const items=[['Crew Rescue',stages.done[0],'Help a crewmate in Stage 01.'],['Research Supply',stages.done[1],'Craft the Stage 02 research supply.'],['Emergency Commander',stages.done[2],'Complete the Stage 03 decision sequence.'],['Tank Master',state.tanks.every(v=>v>=100),'Refilled all four emergency oxygen tanks.'],['Crew Saver',state.crewTreated,'Delivered oxygen to Amina in Medical Bay.'],['Crystal Collector',crystalKinds.some(k=>crystalState.collection[k]>0),'Collected a master crystal in the Crystal Lab.']];modal('achievements','Achievements',`<p class="sub">Track your progress across the academy.</p><div class="mission-list">${items.map(([name,done,desc])=>`<div class="mission-item ${done?'done':''}"><div><strong>${done?'✓':'○'} ${name}</strong><div style="font-size:11px;color:#b6c9dc;margin-top:4px">${desc}</div></div><span>${done?'UNLOCKED':'LOCKED'}</span></div>`).join('')}</div>`)}
function showSettings(){modal('settings','Settings',`<p class="sub">Adjust your display and access owner tools.</p><div class="panel"><h3>Display</h3><p>Switch between browser view and full screen for a cleaner demo experience.</p><div class="actions"><button class="primary" id="toggleFullscreen">TOGGLE FULL SCREEN</button></div></div><div class="panel" style="margin-top:14px"><h3>Owner Reset</h3><p>Enter the owner code to restart everything, including mission progress and character capsule unlocks.</p><input id="ownerCode" class="owner-input" placeholder="Enter owner code" autocomplete="off"><div class="actions"><button class="secondary" id="resetOwner">RESET ALL DATA</button></div><p class="sub" style="margin-top:10px;font-size:11px">The owner code is required to reset all progress.</p></div>`);$('#toggleFullscreen').addEventListener('click',async()=>{if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.()}else{await document.exitFullscreen?.()}});$('#resetOwner').addEventListener('click',()=>{const value=$('#ownerCode').value.trim();if(value===OWNER_CODE){resetProgress()}else{tell('Incorrect owner code.')}})}
$('#stageBoardButton')?.addEventListener('click',stageDashboard);$$('.hotspot').forEach(el=>el.addEventListener('click',()=>{if($('#intro').classList.contains('hidden')&&overlay.classList.contains('hidden'))go(el.dataset.go)}));$('#closeModal').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});$('#begin').addEventListener('click',startMission);$('#menuGuide').addEventListener('click',showGuide);$('#menuCharacters').addEventListener('click',showCharacters);$('#menuAchievements').addEventListener('click',showAchievements);$('#menuSettings').addEventListener('click',showSettings);$('#menuCredits').addEventListener('click',showCredits);window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'&&!overlay.classList.contains('hidden'))close();state.keys[e.key.length===1?e.key.toLowerCase():e.key]=true});window.addEventListener('keyup',e=>{state.keys[e.key.length===1?e.key.toLowerCase():e.key]=false});window.addEventListener('blur',()=>{state.keys={};endHold()});if(window.parent!==window){$('#intro').classList.add('hidden');$('#groundHint').style.display='';}updateHUD();requestAnimationFrame(frame);
})();
