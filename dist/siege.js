import {newSiege,restoreSiege,RAIDS,SPECIES,COMMANDS,selectCommand,moveUnit,endTurn,devour,reinforce} from './siege-engine.js';
const $=id=>document.getElementById(id),KEY='mimicry-siege-v2';
let state;try{state=restoreSiege(JSON.parse(localStorage.getItem(KEY)))}catch{}state??=newSiege();
const manifest=await fetch('./siege/animations.json').then(r=>r.json());
const names=['king-mimic',...Object.keys(SPECIES)];
const animations=new Map();
function animate(el,species,action='idle'){
 if(!el)return;const key=`${species}.${action}`,entry=manifest.animations[key];if(!entry)return;
 let running=animations.get(el);if(running){clearInterval(running.timer);animations.delete(el);}
 let index=0;const set=()=>{el.style.backgroundImage=`url('./siege/${entry.file}')`;el.style.backgroundPosition=`-${index*64}px -${entry.row*64}px`;};set();
 const ms=action==='idle'?190:125;
 const timer=setInterval(()=>{index++;if(index>=entry.frames.length){if(entry.loop)index=0;else{clearInterval(timer);animations.delete(el);if(action!=='death')animate(el,species,'idle');return;}}set();},ms);
 animations.set(el,{timer});
}
function save(){localStorage.setItem(KEY,JSON.stringify({...state,animations:[]}));}
function sprite(species,id){return `<div class="sprite" data-sprite="${species}" data-unit="${id}"></div>`;}
function hpBar(hp,max){return `<div class="hp"><div style="width:${Math.round(hp/max*100)}%"></div></div><small>${hp}/${max} HP</small>`;}
function render(){
 $('raid').textContent=`${state.raid+1} / ${RAIDS.length}`;$('raidname').textContent=RAIDS[state.raid].name;$('turn').textContent=state.turn;$('integrity').textContent=`${state.integrity} / 30`;$('hunger').textContent=`${state.hunger} / 100`;$('gold').textContent=state.gold;
 $('lanes').innerHTML=[0,1,2].map(lane=>`<div class="lane"><div class="lane-name">LANE ${lane+1}</div><div class="combatants">${state.units.filter(u=>u.lane===lane&&u.alive).map(u=>`<div class="combatant ally">${sprite(u.species,u.id)}<b>${u.name} <span>Lv${u.level}</span></b>${hpBar(u.hp,u.maxHp)}${u.armor?`<small>⬟ ${u.armor} armor</small>`:''}</div>`).join('')||'<div class="empty">No defenders</div>'}<div class="lane-arrow">⚔</div>${state.enemies.filter(e=>e.lane===lane&&e.alive).map(e=>`<div class="combatant invader"><div class="foe">${e.name==='Mage'?'✧':e.name==='Archer'?'➶':'⚔'}</div><b>${e.name}</b>${hpBar(e.hp,e.maxHp)}<small>${e.attack} attack</small></div>`).join('')||'<div class="empty">Lane clear</div>'}</div></div>`).join('');
 $('commands').innerHTML=Object.entries(COMMANDS).map(([id,c])=>`<button class="command ${state.selected?.command===id?'active':''}" data-command="${id}" ${state.phase!=='battle'?'disabled':''}><span>${c.symbol}</span><b>${c.name}</b><small>${c.detail}</small></button>`).join('');
 const living=state.units.filter(u=>u.alive);$('target').innerHTML=living.map(u=>`<option value="${u.id}">${u.name} · Lv ${u.level} · Lane ${u.lane+1}</option>`).join('');if(state.selected?.targetId&&living.some(u=>u.id===state.selected.targetId))$('target').value=state.selected.targetId;
 $('roster').innerHTML=state.units.map(u=>`<article class="roster-card ${u.alive?'':'dead'}">${sprite(u.species,`roster-${u.id}`)}<div><b>${u.name}</b><small>${SPECIES[u.species].role} · Lv ${u.level} · ${u.alive?`${u.xp}/${u.level*2} XP`:'FALLEN'}</small>${hpBar(u.hp,u.maxHp)}<small>${u.attack} attack · ${u.kills} kills</small></div><label>Lane <select data-move="${u.id}" ${state.phase!=='battle'||!u.alive?'disabled':''}>${[0,1,2].map(l=>`<option value="${l}" ${l===u.lane?'selected':''}>${l+1}</option>`).join('')}</select></label></article>`).join('');
 $('log').innerHTML=state.log.map(x=>`<p>${x.replaceAll('&','&amp;').replaceAll('<','&lt;')}</p>`).join('');$('turn-button').disabled=state.phase!=='battle';$('devour').disabled=state.phase!=='battle'||state.hunger<100;
 $('overlay').hidden=state.phase==='battle';$('overlaytag').textContent=state.phase==='reward'?'RAID REPELLED':state.phase==='won'?'VICTORY':'DEFEAT';$('overlaytitle').textContent=state.phase==='reward'?'Reinforce your dungeon':state.phase==='won'?'The throne is yours.':'Your kingdom has fallen.';$('overlaycopy').textContent=state.phase==='reward'?'Choose one upgrade. Fallen monsters cannot be revived by resting.':state.phase==='won'?'You survived five raids with your persistent army.':'Try another strategy, rearrange your lanes, and protect your veterans.';
 $('rewards').innerHTML=state.phase==='reward'?`<button data-reward="rest">Rest: heal living units +8, restore 5 integrity</button><button data-reward="train">Train: level up weakest survivor</button>${living.length<5?'<button data-reward="recruit">Recruit: add a new monster</button>':''}`:'<button data-reset>Start a new siege</button>';
 document.querySelectorAll('[data-sprite]').forEach(el=>{const species=el.dataset.sprite;animate(el,species,species==='king-mimic'&&state.phase==='lost'?'death':state.units.find(u=>el.dataset.unit===u.id||el.dataset.unit===`roster-${u.id}`)?.alive===false?'death':'idle');});animate($('king-sprite'),'king-mimic',state.phase==='lost'?'death':'idle');save();
}
let busy=false;
function replay(events){if(!events.length)return;busy=true;const actions=events.filter(x=>x.state!=='damage'||x.id==='king-mimic').slice(0,14);let i=0;const play=()=>{if(i>=actions.length){busy=false;return;}const e=actions[i++];const u=state.units.find(x=>x.id===e.id);const species=u?.species||'king-mimic';document.querySelectorAll(`[data-unit="${e.id}"]`).forEach(el=>animate(el,species,e.state));if(e.id==='king-mimic')animate($('king-sprite'),'king-mimic',e.state);setTimeout(play,e.state==='death'?550:320);};play();}
$('commands').addEventListener('click',e=>{const b=e.target.closest('[data-command]');if(!b||busy)return;selectCommand(state,b.dataset.command,$('target').value||null);render();});
$('target').addEventListener('change',()=>{if(state.selected)selectCommand(state,state.selected.command,$('target').value);save();});
$('roster').addEventListener('change',e=>{if(e.target.matches('[data-move]')){moveUnit(state,e.target.dataset.move,Number(e.target.value));render();}});
$('turn-button').addEventListener('click',()=>{if(busy)return;endTurn(state);const events=[...state.animations];render();replay(events);});
$('devour').addEventListener('click',()=>{if(busy)return;if(devour(state)){const events=[...state.animations];render();replay(events);}});
$('rewards').addEventListener('click',e=>{if(busy)return;const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-reset')){state=newSiege();render();return;}if(b.dataset.reward&&reinforce(state,b.dataset.reward))render();});
$('new').addEventListener('click',()=>{if(confirm('Abandon this siege and start a new one?')){state=newSiege();render();}});
render();
