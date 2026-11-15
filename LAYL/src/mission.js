/* LAYL Flight Surgeon — Mission 01: Lunar Base Alpha.
   Self-contained canvas scene with real keyboard movement and educational resource tradeoffs.
   All readings are illustrative game values, not medical measurements or NASA telemetry. */
const KEY='layl_mission_v06';
const CAPSULE_KEY='layl_capsules_v05';
const REWARD_KEY='layl_mission_v06_first_reward';
const WIDTH=1200, HEIGHT=730;
const ZONES=[
  {id:'medbay',name:'Medical Bay',x:235,y:328,short:'CREW CHECK',icon:'✚',hue:'#88dce7'},
  {id:'oxygen',name:'Life Support',x:515,y:328,short:'OXYGEN',icon:'O₂',hue:'#79cfff'},
  {id:'power',name:'Power Grid',x:905,y:329,short:'POWER',icon:'⚡',hue:'#f3cb82'},
  {id:'garden',name:'Greenhouse',x:287,y:574,short:'FOOD',icon:'✿',hue:'#81d5b1'},
  {id:'shield',name:'Storm Shelter',x:939,y:565,short:'SHIELDING',icon:'⬡',hue:'#baa2ff'}
];
function startState(){return {x:590,y:484,dir:'front',briefed:false,oxygen:64,power:76,water:74,food:73,radiation:58,hr:118,spo2:90,scan:false,stabilized:false,rewired:false,shield:false,crops:false,finished:false,failed:false,rewarded:false,steps:0,tanks:[100,60,25,0],tanksReady:false};}
function getState(){ try {const a=JSON.parse(localStorage.getItem(KEY));if(a&&typeof a==='object'&&typeof a.oxygen==='number'){const saved={...startState(),...a};saved.tanks=Array.isArray(a.tanks)&&a.tanks.length===4?a.tanks.map(n=>clamp(Number(n)||0,0,100)):[100,60,25,0];saved.tanksReady=saved.tanks.every(n=>n===100);return saved;}}catch{}return startState();}
function store(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
export function missionSnapshot(){return getState();}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function txt(ctx,text,x,y,size,color='#dfeeff',weight=700,align='center'){ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Avenir Next", "Segoe UI", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);}
function gradient(ctx,x0,y0,x1,y1,a,b){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function ellipse(ctx,x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function buildStars(){let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};return Array.from({length:130},()=>[rand()*WIDTH,rand()*164,rand()*1.8+.25,rand()]);}
const stars=buildStars();
function drawMap(ctx,t){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle=gradient(ctx,0,0,0,HEIGHT,'#091d3e','#7188a5');ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle=gradient(ctx,0,0,0,196,'#071a38','#223f65');ctx.fillRect(0,0,WIDTH,175);
  for(const [x,y,r,b] of stars){ctx.globalAlpha=.26+Math.sin(t*.00075+b*9)*.16+.25;ellipse(ctx,x,y,r,r,'#bcd9ff');}ctx.globalAlpha=1;
  ellipse(ctx,1080,71,59,59,'#1e4470');ellipse(ctx,1068,57,51,49,'#3c8cb8');ellipse(ctx,1075,68,52,47,'#236b9b');
  for(const [x,y,r] of [[1056,31,14],[1101,49,12],[1044,81,13],[1089,98,14]]){ellipse(ctx,x,y,r,r/2,'#7dd9da');}
  // Layered mountain horizon and moon terrain.
  ctx.fillStyle='#4e6684';ctx.beginPath();ctx.moveTo(0,174);for(let x=0;x<=1200;x+=45)ctx.lineTo(x,135+Math.sin(x*.014)*19+Math.sin(x*.077)*7);ctx.lineTo(1200,260);ctx.lineTo(0,260);ctx.fill();
  ctx.fillStyle='#8193a9';ctx.beginPath();ctx.moveTo(0,214);for(let x=0;x<=1200;x+=40)ctx.lineTo(x,183+Math.sin(x*.027+1.4)*21+Math.cos(x*.061)*8);ctx.lineTo(1200,730);ctx.lineTo(0,730);ctx.fill();
  ctx.fillStyle=gradient(ctx,0,170,0,730,'#7086a2','#adb9c6');ctx.fillRect(0,218,WIDTH,512);
  // Soft cratered dust, consistent map layout with no random redraw.
  for(let i=0;i<90;i++){
    const x=(i*173+41)%WIDTH, y=255+((i*91+27)%466), rx=8+(i%6)*7;
    ellipse(ctx,x,y,rx,rx*.35,'rgba(34,61,91,.11)');ellipse(ctx,x-2,y-2,rx*.65,rx*.2,'rgba(215,231,238,.19)');
  }
  // Main path and side spurs.
  ctx.lineCap='round';ctx.strokeStyle='rgba(48,65,90,.44)';ctx.lineWidth=104;ctx.beginPath();ctx.moveTo(80,381);ctx.lineTo(1125,381);ctx.stroke();
  ctx.strokeStyle='#bbcbd7';ctx.lineWidth=90;ctx.stroke();
  ctx.strokeStyle='#dce8eb';ctx.lineWidth=3;ctx.setLineDash([17,24]);ctx.stroke();ctx.setLineDash([]);
  for(const x of [235,515,905]){ctx.strokeStyle='#bdcfd9';ctx.lineWidth=64;ctx.beginPath();ctx.moveTo(x,382);ctx.lineTo(x,316);ctx.stroke();}
  for(const x of [287,939]){ctx.strokeStyle='#bbcad7';ctx.lineWidth=67;ctx.beginPath();ctx.moveTo(x,381);ctx.lineTo(x,579);ctx.stroke();}
  // Subtle path seams.
  ctx.strokeStyle='rgba(65,95,119,.27)';ctx.lineWidth=1;
  for(let x=80;x<1150;x+=67){ctx.beginPath();ctx.moveTo(x,337);ctx.lineTo(x,425);ctx.stroke();}
  drawMedbay(ctx);drawLifeSupport(ctx);drawPower(ctx);drawGreenhouse(ctx);drawShield(ctx);drawProps(ctx);
  // Interaction beacons and character are drawn dynamically over this cached background.
}
function building(ctx,x,y,w,h,title,accent,symbol){
  ctx.save();ctx.shadowColor='rgba(18,36,62,.34)';ctx.shadowBlur=18;ctx.shadowOffsetY=12;
  roundRect(ctx,x,y,w,h,27,gradient(ctx,x,y,x,y+h,'#dfe7ec','#91a9be'),'rgba(40,71,106,.65)');ctx.restore();
  roundRect(ctx,x+9,y+8,w-18,h-22,21,gradient(ctx,x,y,x,y+h,'#415d80','#1c3455'),'#9eb7d1');
  roundRect(ctx,x+28,y+23,w-56,39,12,'#162c4a','#7899b7');
  txt(ctx,symbol,x+52,y+42,24,accent);txt(ctx,title,x+w*.67,y+42,title.length>10?15:19,'#f2f6fc');
  for(let i=0;i<4;i++){roundRect(ctx,x+35+i*46,y+76,32,22,5,gradient(ctx,0,y+75,0,y+99,'#84c6da','#173e69'),'#badff1');}
  roundRect(ctx,x+w*.43,y+h-36,w*.19,31,5,'#cbdbe3','#768fa8');
  roundRect(ctx,x+w*.48,y+h-34,w*.08,29,2,accent);
  for(let i=0;i<2;i++)roundRect(ctx,x+15+i*(w-48),y+h-16,33,7,3,accent);
}
function drawMedbay(c){building(c,95,152,275,151,'MEDICAL BAY','#75dfd8','✚');roundRect(c,114,234,48,25,6,'#ecf7f7');txt(c,'✚',138,245,21,'#3b9ab9');}
function drawLifeSupport(c){building(c,407,147,222,151,'LIFE SUPPORT','#80cbfd','O₂');}
// The four emergency bottles on the outpost reflect the same state as the HUD.
function drawTankRack(c,tanks){
  for(let i=0;i<4;i++){
    const x=428+i*47,y=216,v=tanks[i];
    roundRect(c,x,y,38,49,8,'#183b60','#d5effa');
    roundRect(c,x+5,y+5,28,39,5,'#294d75');
    if(v>0){const h=31*v/100;roundRect(c,x+7,y+8+31-h,24,h,3,v===100?'#8cddc4':'#77c8fb');}
    txt(c,'O₂',x+19,y+24,12,'#f3f8ff');
    if(v===100)txt(c,'✓',x+30,y+8,14,'#f6de91');
  }
}
function drawPower(c){building(c,762,146,272,154,'POWER GRID','#f5cb78','⚡');roundRect(c,795,215,76,56,7,'#244767','#abd3db');for(let n=0;n<4;n++){c.strokeStyle='#70d4ff';c.lineWidth=3;c.beginPath();c.moveTo(807,227+n*11);c.lineTo(858,227+n*11);c.stroke();}}
function drawGreenhouse(c){c.save();c.shadowColor='rgba(33,53,79,.32)';c.shadowBlur=14;c.shadowOffsetY=10;roundRect(c,132,457,306,104,25,'#5e9a91','#d1eae2');c.restore();roundRect(c,145,468,278,80,24,'#2f555c','#d0dfcb');for(let j=0;j<3;j++){for(let i=0;i<5;i++){const x=170+i*48,y=488+j*21;ellipse(c,x,y,9,6,'#46956f');ellipse(c,x-5,y-3,7,4,'#98d8a1');}}for(let x=162;x<418;x+=55){c.strokeStyle='rgba(189,236,245,.65)';c.lineWidth=2;c.beginPath();c.moveTo(x,473);c.lineTo(x,546);c.stroke();}roundRect(c,172,435,226,28,9,'#173d54','#88d8c0');txt(c,'LUNAR GREENHOUSE',284,449,17,'#e6fbf2');}
function drawShield(c){c.save();c.shadowColor='rgba(22,42,78,.3)';c.shadowBlur=16;c.shadowOffsetY=10;roundRect(c,832,462,290,107,23,'#b3bace','#4b5d87');c.restore();roundRect(c,845,476,264,77,16,'#324264','#b5acd9');roundRect(c,882,429,189,33,11,'#283f63','#baa7f2');txt(c,'STORM SHELTER',976,445,18,'#f4edff');ellipse(c,982,516,55,24,'#6d6c9f');txt(c,'⬡',985,514,39,'#e4d6ff');}
function drawProps(c){
  // Solar panels and communications tower.
  for(let i=0;i<3;i++){roundRect(c,1040+i*42,261,39,54,4,'#17395b','#91bce8');for(let y=0;y<4;y++){c.strokeStyle='rgba(127,185,235,.7)';c.lineWidth=1;c.beginPath();c.moveTo(1041+i*42,270+y*12);c.lineTo(1078+i*42,270+y*12);c.stroke();}}
  c.strokeStyle='#253954';c.lineWidth=7;c.beginPath();c.moveTo(1101,260);c.lineTo(1101,202);c.stroke();ellipse(c,1101,197,28,9,'#dce8f0','#2e5e84');
  // Tiny lunar rover.
  roundRect(c,608,522,113,55,15,'#f3e0ba','#556e8b');roundRect(c,625,512,69,25,8,'#dae9f0','#7896ad');for(const x of [634,698]){ellipse(c,x,580,16,16,'#263d52');ellipse(c,x,580,8,8,'#9eb4c6');}txt(c,'LAYL • 01',664,550,13,'#274a68');
  // Small light poles.
  for(const [x,y] of [[85,388],[450,393],[756,390],[1136,393],[127,598],[774,614]]){roundRect(c,x-4,y-26,8,28,4,'#405874');ellipse(c,x,y-30,9,7,'#ffe6b3');}
}
export function initMission({onExit=()=>{},playSound=()=>{},onProgress=()=>{}}={}){
  const root=document.getElementById('missionGame'),canvas=document.getElementById('missionCanvas'),ctx=canvas.getContext('2d');
  const stats=document.getElementById('missionStats'),tankHud=document.getElementById('missionTanks'),tankCount=document.getElementById('missionTanksReady'),objectives=document.getElementById('missionObjectives'),log=document.getElementById('missionLog'),crew=document.getElementById('missionCrew');
  const nearEl=document.getElementById('missionNear'),modal=document.getElementById('missionModal'),modalTitle=document.getElementById('missionModalTitle'),modalBody=document.getElementById('missionModalBody'),actions=document.getElementById('missionModalActions');
  let state=getState(),raf=0,last=0,near=null,visible=false,held=new Set(),lastStore=0,selectedTank=1;
  // Cache the landscape once, instead of painting hundreds of shapes every animation frame.
  const background=document.createElement('canvas');background.width=WIDTH;background.height=HEIGHT;drawMap(background.getContext('2d'),0);
  const images={};for(const d of ['front','right','right_side','back_right','back','left']){const img=new Image();img.src=`assets/player/${d}.webp`;images[d]=img;}
  const safe=num=>Math.round(num);
  const statList=()=>[
    ['oxygen','O₂','Oxygen',state.oxygen,'#82cbff'],['power','⚡','Power',state.power,'#e6c780'],['water','◈','Water',state.water,'#83d8e8'],['food','✿','Food',state.food,'#8bd4a9'],['radiation','☢','Radiation',state.radiation,'#bd9df8']
  ];
  function render(){
    stats.innerHTML=statList().map(([k,icon,name,value,color])=>`<div class="mission-resource"><div class="mission-resource__meta"><span>${icon} ${name}</span><strong style="color:${color}">${safe(value)}${k==='radiation'?' risk':'%'}</strong></div><div class="mission-resource__track"><span style="background:${color};width:${clamp(value,0,100)}%"></span></div></div>`).join('');
    tankCount.textContent=`${state.tanks.filter(n=>n===100).length} / 4 ready`;
    tankHud.innerHTML=state.tanks.map((value,i)=>`<div class="mission-tank-small ${value===100?'is-full':''}" title="Tank ${i+1}: ${value}% full"><div class="mission-tank-small__vessel"><span style="height:${value}%"></span><b>O₂</b></div><small>${i+1} · ${value}%</small></div>`).join('');
    const tasks=[['scan','Check crew vitals'],['tanksReady','Fill 4 emergency O₂ tanks'],['stabilized','Restore crew oxygen'],['rewired','Rebalance power'],['shield','Activate storm shelter'],['crops','Protect food crops']];
    objectives.innerHTML=tasks.map(([k,name])=>`<div class="mission-task ${state[k]?'is-done':''}"><span>${state[k]?'✓':'○'}</span><span>${name}</span></div>`).join('');
    crew.innerHTML=`<div class="mission-crew__name"><span class="mission-crew__dot ${state.stabilized?'is-okay':''}"></span>Amina • EVA Specialist</div><div class="mission-crew__readings"><span>♥ ${state.hr} bpm</span><span>O₂ ${state.spo2}%</span></div><small>Simulated training readings, not real telemetry.</small>`;
    const count=tasks.filter(([k])=>state[k]).length;
    document.getElementById('missionProgress').textContent=`${count} / 6 tasks`;
    document.getElementById('missionNext').textContent=state.failed?'Mission failure — restart to try another strategy.':state.finished?'Mission complete — great work, Flight Surgeon!':(!state.scan?'Visit MEDICAL BAY to assess your crew.':!state.tanksReady?'Visit LIFE SUPPORT to fill all 4 emergency oxygen tanks.':!state.stabilized?'Visit LIFE SUPPORT to help Amina breathe safely.':!state.rewired?'Visit POWER GRID to protect limited energy.':!state.shield?'Visit STORM SHELTER before the solar storm.':'Visit GREENHOUSE to protect the food supply.');
    onProgress(state);
  }
  function setLog(s){log.textContent=s;}
  function persist(){store(state);}
  function show(title,body,choices){modalTitle.textContent=title;modalBody.innerHTML=body;actions.replaceChildren();for(const opt of choices){const b=document.createElement('button');b.className='mission-option'+(opt.primary?' mission-option--primary':'');b.textContent=opt.label;b.disabled=Boolean(opt.disabled);b.addEventListener('click',()=>{playSound();opt.run?.();});actions.appendChild(b);}modal.hidden=false;held.clear();}
  function hide(){modal.hidden=true;canvas.focus();}
  function notice(title,body){show(title,body,[{label:'Continue exploring →',primary:true,run:hide}]);}
  function science(text){return `<div class="mission-science"><strong>✦ WHY IT MATTERS</strong><p>${text}</p></div>`;}
  function acted(text){state.steps++;persist();render();setLog(text);if(!checkFail())checkComplete();}
  function checkFail(){
    if(state.oxygen>30&&state.power>=10&&state.water>=10&&state.food>15&&state.radiation<90)return false;
    state.failed=true;persist();render();show('⚠ MISSION FAILED',`<p>The outpost has reached an unsafe resource limit. On a real mission, crews must preserve life-support systems and act on warnings early.</p>${science('Try a different resource strategy. Making a mistake is part of training: compare what happened and decide what you will change.')}`,[
      {label:'Retry Mission',primary:true,run:()=>{state=startState();state.briefed=true;persist();render();hide();}},
      {label:'Return to Menu',run:exit}
    ]);return true;
  }
  function checkComplete(){
    if(state.scan&&state.tanksReady&&state.stabilized&&state.rewired&&state.shield&&state.crops&&state.oxygen>=75&&state.power>=18&&state.food>=65&&state.water>=25&&state.radiation<=25){
      state.finished=true;
      let awardedNow=false;
      if(!state.rewarded){state.rewarded=true;try{if(localStorage.getItem(REWARD_KEY)!=='claimed'){const cards=JSON.parse(localStorage.getItem(CAPSULE_KEY)||'{}');cards.credits=(Number(cards.credits)||240)+150;localStorage.setItem(CAPSULE_KEY,JSON.stringify(cards));localStorage.setItem(REWARD_KEY,'claimed');awardedNow=true;}}catch{}}
      persist();render();show('🌟 MISSION COMPLETE!',`<p>You protected Amina, balanced life-support power, prepared for the solar storm, and kept the food supply safe.</p><div class="mission-win">${awardedNow?'★ +150 Star Credits awarded for Capsule Bay!':'★ Mission reward already collected. Great replay!'}</div>${science('Engineering decisions are connected: oxygen recycling, power for shielding, and greenhouse growth all compete for resources. There is no unlimited supply on a lunar outpost.')}`,[{label:'Return to Moon Base',primary:true,run:hide},{label:'Main Menu',run:exit}]);
    }
  }
  function atMedbay(){
    if(!state.scan){show('✚ Crew health check',`<p>Amina is outside checking a lunar communications relay. Her heart rate appears high and her oxygen saturation is below our <em>fictional training target</em>.</p><div class="mission-readout"><span>♥ ${state.hr} bpm</span><span>O₂ ${state.spo2}%</span></div>${science('Flight surgeons help monitor astronaut health. A number alone does not diagnose an illness; readings must be considered together with symptoms and suit/environmental conditions.')}`,[{label:'Log the vitals',primary:true,run:()=>{state.scan=true;acted('Crew checked. Head to LIFE SUPPORT to restore oxygen.');notice('✓ Crew assessed','Your first mission finding is recorded. The life-support system needs attention.');}}]);}
    else notice('Crew medical report',`<div class="mission-readout"><span>♥ ${state.hr} bpm</span><span>O₂ ${state.spo2}%</span></div><p>${state.stabilized?'Amina is stable in this training scenario. Keep the other base systems safe.':'Amina still needs your help. Go to LIFE SUPPORT.'}</p>${science('Health monitoring tools and flight surgeons work together to interpret changes throughout a space mission.')}`);
  }
  // Refill a physical stock of four ready-to-go oxygen cylinders. All values and costs are game units.
  function tankCost(value){return Math.ceil((100-value)/25);}
  function oxygenPanel(animateIndex=-1,oldValue=0){
    const full=state.tanks.filter(v=>v===100).length;
    const price=state.tanks.map(tankCost);
    const allCost=price.reduce((a,b)=>a+b,0);
    const selected=state.tanks[selectedTank];
    const cost=price[selectedTank];
    const rows=state.tanks.map((pct,i)=>`<button type="button" class="oxygen-rack__slot ${i===selectedTank?'is-selected':''} ${pct===100?'is-ready':''}" data-oxygen-select="${i}" aria-pressed="${i===selectedTank}"><div class="oxygen-rack__vessel"><span class="oxygen-rack__liquid" style="height:${pct}%"></span><b>O₂</b></div><span>Tank ${i+1}</span><strong>${pct}%</strong><small>${pct===100?'✓ READY':'Needs refill'}</small></button>`).join('');
    show('O₂ · Emergency Tank Rack',
      `<p>Keep <b>four portable oxygen tanks</b> ready in case your crew needs an emergency supply.</p><div class="oxygen-rack" role="group" aria-label="Choose a tank to refill">${rows}</div><div class="oxygen-rack__cost"><span>Outpost oxygen: <b>${state.oxygen}%</b></span><span>Power: <b>${state.power}%</b></span></div><p class="oxygen-rack__fine">A tank refill uses <b>1 oxygen point + 1 power point</b> per 25% of missing capacity. These are simplified game resources, not physical units.</p>${science('A real lunar habitat needs oxygen supply, monitoring, and power. Portable tank refilling involves engineering controls and is not a way to diagnose or treat every medical emergency.')}`,
      [{label:cost?`Refill Tank ${selectedTank+1} → 100%  (−${cost} O₂ / −${cost} power)`:`✓ Tank ${selectedTank+1} is already full`,primary:true,disabled:!cost,run:()=>refillOne(selectedTank)},
       {label:allCost?`Refill ALL remaining tanks  (−${allCost} O₂ / −${allCost} power)`:'✓ All four tanks are ready',disabled:!allCost,run:()=>refillAll()},
       {label:'← Back to Life Support',run:atOxygen}]);
    modalBody.querySelectorAll('[data-oxygen-select]').forEach(el=>el.addEventListener('click',()=>{selectedTank=Number(el.dataset.oxygenSelect);oxygenPanel();}));
    if(animateIndex>=0){
      const chosen=modalBody.querySelector(`[data-oxygen-select="${animateIndex}"]`);
      if(chosen){const liquid=chosen.querySelector('.oxygen-rack__liquid');liquid.style.height=`${oldValue}%`;chosen.classList.add('is-filling');requestAnimationFrame(()=>requestAnimationFrame(()=>{if(chosen.isConnected)liquid.style.height='100%';}));setTimeout(()=>chosen.classList.remove('is-filling'),1150);}
    }
  }
  function refillOne(i){
    if(state.failed||state.finished)return;
    const old=state.tanks[i],cost=tankCost(old);
    if(cost===0){oxygenPanel();return;}
    // Keep the mission's safety margin: enough reserve must remain for critical life support.
    if(state.oxygen-cost<=30||state.power-cost<10){notice('⚠ Not enough safe reserves','The refill station cannot use oxygen or electricity needed to keep the base safe. Prepare other resources before filling more tanks.');return;}
    state.tanks[i]=100;state.oxygen-=cost;state.power-=cost;
    state.tanksReady=state.tanks.every(v=>v===100);
    acted(`Tank ${i+1} refilled. ${state.tanks.filter(v=>v===100).length}/4 ready · −${cost} O₂ and −${cost} power.`);
    if(!state.failed&&!state.finished)oxygenPanel(i,old);
  }
  function refillAll(){
    const allCost=state.tanks.reduce((sum,v)=>sum+tankCost(v),0);
    if(!allCost)return;
    if(state.oxygen-allCost<=30||state.power-allCost<10){notice('⚠ Not enough safe reserves',`All tanks would cost ${allCost} oxygen points and ${allCost} power points. Keep a safety margin for the habitat first.`);return;}
    state.tanks=[100,100,100,100];state.oxygen-=allCost;state.power-=allCost;state.tanksReady=true;
    acted(`All four emergency tanks filled · −${allCost} O₂ and −${allCost} power.`);
    if(!state.failed&&!state.finished){oxygenPanel();modalBody.querySelectorAll('.oxygen-rack__slot').forEach(el=>{el.classList.add('is-filling');setTimeout(()=>el.classList.remove('is-filling'),1000);});}
  }
  function lifeSupportDecision(){
    if(!state.scan){notice('Crew assessment needed','You can prepare emergency tanks anytime. To adjust Amina’s life support, first assess her readings at the MEDICAL BAY.');return;}
    if(state.stabilized){notice('Oxygen recycling online','Crew support is stable in this scenario. Portable emergency tanks are managed separately.');return;}
    show('O₂ Life-support decision',`<p>Amina is showing warning signs while the habitat oxygen reserve is <b>${state.oxygen}%</b>. Increasing crew oxygen support will consume power and water. This is separate from refilling portable tanks.</p>${science('Real spacecraft environmental control systems manage oxygen, carbon dioxide, and water. These numbers are simplified fictional resource units for learning trade-offs.')}`,[
      {label:'Increase oxygen support · +24 O₂ / −28 power / −8 water',primary:true,run:()=>{if(state.power<28||state.water<8){notice('Not enough resources','Restore power or water before running this system.');return;}state.oxygen=clamp(state.oxygen+24,0,100);state.power-=28;state.water-=8;state.hr=94;state.spo2=96;state.stabilized=true;acted('Amina’s simulated readings improved. Power is now limited!');if(!state.finished&&!state.failed)notice('✓ Oxygen restored','Amina’s oxygen and heart-rate indicators have improved. But life support consumed precious power. Visit POWER GRID next.');}},
      {label:'Conserve power instead · +6 power / −10 O₂',run:()=>{state.power=clamp(state.power+6,0,100);state.oxygen=clamp(state.oxygen-10,0,100);acted('Power saved, but oxygen reserves fell. Amina still needs help.');if(!state.failed)notice('⚠ Trade-off detected',`You gained energy but lowered the oxygen reserve to <b>${state.oxygen}%</b>. Return to LIFE SUPPORT and reconsider. ${science('A life-support system cannot be replaced by simply turning up or down a single fictional percentage; the game models a simplified engineering choice.')}`);}}
    ]);
  }
  function atOxygen(){
    const full=state.tanks.filter(v=>v===100).length;
    show('O₂ Life Support & Refill Station',
      `<p>There are <b>${full} of 4 emergency oxygen tanks</b> fully filled. Before an emergency, prepare supplies while keeping enough oxygen and power for the habitat.</p><div class="mission-readout"><span>Portable tanks: ${full}/4 ready</span><span>Base O₂: ${state.oxygen}%</span><span>Power: ${state.power}%</span></div>${science('Portable tanks are emergency supplies. The habitat atmosphere is controlled by separate environmental systems. Both depend on limited supplies and electricity.')}`,
      [{label:`🫧 Refill 4 emergency tanks (${full}/4 ready)`,primary:true,run:()=>{selectedTank=Math.max(0,state.tanks.findIndex(v=>v<100));oxygenPanel();}},
       {label:'🩺 Check crew oxygen support',run:lifeSupportDecision},
       {label:'Back to Moon Base',run:hide}]);
  }
  function atPower(){if(!state.stabilized){notice('Power grid online','The grid can redirect energy when needed. First find out why the medical crew needs support at LIFE SUPPORT.');return;}
    if(state.rewired){notice('Power allocation updated',`The emergency power plan is active. Current battery reserve: <b>${state.power}%</b>.`);return;}
    show('⚡ Power allocation',`<p>A solar storm is approaching. The storm shelter needs <b>42 power units</b>, but life support has already drawn heavily from the battery.</p><p>The greenhouse lamps use some of that same power.</p>${science('A realistic outpost must prioritize power between lighting crops, operating life support, and protecting the crew.')}`,[
      {label:'Dim greenhouse lamps · +30 power / −12 food',primary:true,run:()=>{state.power=clamp(state.power+30,0,100);state.food=clamp(state.food-12,0,100);state.rewired=true;acted('Power redirected to crew safety; crops need attention later.');notice('✓ Power redirected',`Emergency energy is ready, but dimming the greenhouse reduced food production. Next: activate the STORM SHELTER. ${science('Plants rely on light to grow. Reducing greenhouse lighting to save power can affect crop productivity.')}`);}},
      {label:'Keep lamps bright · no change',run:()=>notice('Power stays unchanged','With no new power available, the base may not be able to protect the crew. Return and consider reducing greenhouse lighting.')}
    ]);
  }
  function atShield(){if(!state.stabilized){notice('Storm alert','Your crew needs oxygen support first. Visit MEDICAL BAY and LIFE SUPPORT.');return;}
    if(state.shield){notice('Shelter protected',`Simulated radiation risk reduced to <b>${state.radiation}</b>. Crew safety systems are active.`);return;}
    show('⬡ Solar storm shelter',`<p>Radiation risk is <b>${state.radiation}</b> in this fictional scenario. Activating the shelter needs <b>42 power units</b> and leaves a reserve for the rest of the base.</p>${science('Space radiation is a real hazard. Shielding and designated shelters are important protection concepts, particularly during solar particle events.')}`,[
      {label:'Activate shielding · −42 power / −44 radiation risk',primary:true,run:()=>{if(!state.rewired||state.power-42<18){notice('⚠ Insufficient safe power reserve','First visit POWER GRID and reduce greenhouse lighting to make room for the shelter. We must protect life support too.');return;}state.power-=42;state.radiation=clamp(state.radiation-44,0,100);state.shield=true;acted('Shelter protected. Now help restore food production.');notice('✓ Shelter activated',`The crew has a protected place to wait out the simulated storm. Next, visit the GREENHOUSE. ${science('This is simplified risk management, not a real radiation dose calculation.')}`);}},
      {label:'Delay activation',run:()=>notice('Storm warning remains active','A shelter cannot protect the crew until it is activated. Revisit this station after preparing the power grid.')}
    ]);
  }
  function atGarden(){if(!state.rewired){notice('Greenhouse status','The hydroponic plants are healthy, but we may need to rebalance their lighting when the storm arrives.');return;}
    if(state.crops){notice('Greenhouse stabilized',`Crops are recovering. Food: <b>${state.food}%</b>; Water: <b>${state.water}%</b>.`);return;}
    show('✿ Recover food production',`<p>We dimmed the lights to free power for life support and shielding. Your plants now need careful water management to recover.</p>${science('Real space crop experiments need controlled light, nutrients, and water. Crystals do not create real medicines; our collectible crystals are fictional.')}`,[
      {label:'Restore hydroponic cycle · −8 power / −14 water / +24 food',primary:true,run:()=>{if(state.power<26||state.water<14){notice('Resource balance is too low','Keep enough power for life support. If the shelter has not been activated, do that first.');return;}state.power-=8;state.water-=14;state.food=clamp(state.food+24,0,100);state.crops=true;acted('Food production recovered; mission tasks complete.');if(!state.finished)notice('✓ Greenhouse recovered','The crops now have a viable balance of food-production resources. Check all six mission tasks!');}},
      {label:'Leave crops as they are',run:()=>notice('Food remains limited','You may leave for now, but plants still need care before the mission is complete.')}
    ]);
  }
  const stations={medbay:atMedbay,oxygen:atOxygen,power:atPower,garden:atGarden,shield:atShield};
  function interact(){if(!visible||!modal.hidden)return;near=nearZone();if(!near){setLog('Walk toward a glowing station marker using the arrow keys.');return;}playSound();stations[near.id]();}
  function nearZone(){let closest=null,dist=96;for(const z of ZONES){const d=Math.hypot(z.x-state.x,z.y-state.y);if(d<dist){dist=d;closest=z;}}return closest;}
  function tick(now){if(!visible)return;const dt=Math.min(.047,(now-last)/1000||.016);last=now;
    if(modal.hidden){let dx=0,dy=0;if(held.has('ArrowUp')||held.has('w'))dy--;if(held.has('ArrowDown')||held.has('s'))dy++;if(held.has('ArrowLeft')||held.has('a'))dx--;if(held.has('ArrowRight')||held.has('d'))dx++;
      if(dx||dy){const length=Math.hypot(dx,dy);dx/=length;dy/=length;state.x=clamp(state.x+dx*256*dt,34,1167);state.y=clamp(state.y+dy*256*dt,300,677);if(Math.abs(dx)>.2)state.dir=dx>0?'right_side':'left';else state.dir=dy<0?'back':'front';if(now-lastStore>1600){persist();lastStore=now;}}
    }
    near=nearZone();ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.drawImage(background,0,0);
    drawTankRack(ctx,state.tanks);
    for(const z of ZONES){const n=near?.id===z.id;ellipse(ctx,z.x,z.y+10,n?62:48,15,n?'rgba(247,204,120,.35)':'rgba(85,153,184,.17)');ellipse(ctx,z.x,z.y+8,19,7,n?'#fce3a2':'#aad2eb');txt(ctx,'✦',z.x,z.y-7,18,n?'#ffdb94':'#e3f5ff');}
    ellipse(ctx,state.x,state.y+19,33,11,'rgba(18,37,64,.34)');
    const img=images[state.dir]||images.front;if(img.complete&&img.naturalWidth){const height=105,width=height*img.naturalWidth/img.naturalHeight;ctx.drawImage(img,state.x-width/2,state.y-height+24,width,height);}else{ellipse(ctx,state.x,state.y-28,27,30,'#f4f1e4');}
    if(near && modal.hidden){nearEl.hidden=false;nearEl.textContent=`Press E — ${near.name}`;}else nearEl.hidden=true;
    raf=requestAnimationFrame(tick);
  }
  function open(){state=getState();visible=true;root.hidden=false;last=performance.now();render();setLog('Flight Surgeon Layl reporting for duty.');raf=requestAnimationFrame(tick);canvas.focus();
    if(!state.briefed){state.briefed=true;persist();show('🌙 Mission 01 · Lunar Base Alpha',`<p>Welcome, Flight Surgeon! A solar storm is approaching, and an astronaut outside the base has unusual health readings. Four emergency oxygen tanks need to be prepared, too.</p><p>Use the <b>arrow keys</b> to walk around. When you reach a glowing marker, press <b>E</b> to interact with the station.</p><div class="mission-readout"><span>↑ ↓ ← → Move</span><span>E Interact</span></div>${science('Your goal is to balance oxygen, power, radiation protection, food and water. Visit LIFE SUPPORT to refill the four tanks. Each refill consumes stored oxygen and power. Every important choice changes your resources.')}`,[{label:'Begin mission →',primary:true,run:hide}]);}}
  function exit(){persist();visible=false;cancelAnimationFrame(raf);held.clear();root.hidden=true;modal.hidden=true;onExit();}
  function reset(){if(!confirm('Restart Mission 01 and clear its progress? Your capsule cards will not be touched.'))return;state=startState();persist();render();setLog('Mission restarted. Walk to the MEDICAL BAY.');hide();}
  document.addEventListener('keydown',e=>{if(!visible)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','e','Escape'].includes(k))e.preventDefault();
    if(k==='Escape'){if(!modal.hidden)hide();else exit();return;}
    if(!modal.hidden)return;
    if(k==='e'||k===' '){if(!e.repeat)interact();return;}
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(k)){
      // Immediate response on the first press, plus continuous motion while held.
      if(!e.repeat){const left=['ArrowLeft','a'].includes(k),right=['ArrowRight','d'].includes(k),up=['ArrowUp','w'].includes(k),down=['ArrowDown','s'].includes(k);state.x=clamp(state.x+(right?25:left?-25:0),34,1167);state.y=clamp(state.y+(down?25:up?-25:0),300,677);state.dir=left?'left':right?'right_side':up?'back':'front';persist();}
      held.add(k);
    }
  });
  document.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;held.delete(k);});
  window.addEventListener('blur',()=>held.clear());
  root.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-direction]');if(b){e.preventDefault();held.add(b.dataset.direction);b.setPointerCapture(e.pointerId);}});
  for(const event of ['pointerup','pointercancel'])root.addEventListener(event,e=>{const b=e.target.closest('[data-direction]');if(b)held.delete(b.dataset.direction);});
  root.addEventListener('click',e=>{if(e.target.closest('[data-mission-exit]'))exit();if(e.target.closest('[data-mission-reset]'))reset();if(e.target.closest('[data-mission-interact]'))interact();});
  return {open,exit,reset};
}
