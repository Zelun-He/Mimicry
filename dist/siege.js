import {CARDS,linkCards} from './chain-engine.js';
import {MUTATIONS,handSize,upgradeableCards,trainableUnits,cardPower} from './shop-engine.js';
import {newSiege,restoreSiege,RAIDS,SPECIES,moveUnit,endTurn,devour,reinforce,buyUpgrade,queueCommand,unqueueCommand,redrawCommand,previewChain,previewRituals,targetChain} from './siege-engine.js';
const $=id=>document.getElementById(id),KEY='mimicry-siege-v4';
let state;try{state=restoreSiege(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('mimicry-siege-v3')||localStorage.getItem('mimicry-siege-v2')))}catch{}state??=newSiege();
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
function shopHTML(){
 const cards=upgradeableCards(state).sort((a,b)=>CARDS[a.type].name.localeCompare(CARDS[b.type].name));
 const units=trainableUnits(state);
 const offers=state.shopOffers.map(offer=>{
  const mutation=MUTATIONS[offer.id];
  const isCard=offer.id==='card',isMonster=offer.id==='monster';
  const name=isCard?'Enhance a command':isMonster?'Train a defender':mutation.name;
  const icon=isCard?'⚔':isMonster?'⬟':'✦';
  const desc=isCard?'Choose any eligible card: +2 base power per level (maximum +2 levels).':isMonster?'Choose a surviving defender: +2 attack and +4 max HP (maximum twice each).':mutation.description;
  const choices=isCard?cards:units;
  const selector=(isCard||isMonster)&&!offer.sold?`<label class="shop-select">${isCard?'Card to improve':'Defender to train'}<select data-shop-target>${choices.map(x=>`<option value="${x.id}">${isCard?`${CARDS[x.type].name} ${x.level?`+${x.level}`:''} · power ${cardPower(state,x)}`:`${x.name} · Lv${x.level} · ${x.attack} ATK`}</option>`).join('')}</select></label>`:'';
  const cannotBuy=offer.sold||state.gold<offer.cost||((isCard||isMonster)&&!choices.length);
  return `<article class="shop-offer ${offer.sold?'shop-sold':''}" data-shop-offer="${offer.id}"><div class="shop-icon">${icon}</div><div class="shop-type">${isCard?'COMMAND ENHANCEMENT':isMonster?'ARMY TRAINING':'KING MIMIC MUTATION'}</div><h3>${name}</h3><p>${desc}</p>${selector}<button data-buy="${offer.id}" ${cannotBuy?'disabled':''}>${offer.sold?'PURCHASED':`BUY · ${offer.cost} GOLD`}</button></article>`;
 }).join('');
 return `<section class="quartermaster"><div class="shop-head"><div><span class="eyebrow">THE GOBLIN QUARTERMASTER</span><h3>Wares from the fallen</h3><p>Spend your raid gold or save it for the next shop. Each item is available once this visit.</p></div><strong>◈ ${state.gold} GOLD</strong></div><div class="shop-grid">${offers}</div><div class="shop-footer"><span class="eyebrow">FREE RAID REINFORCEMENT</span><p>Once you're finished shopping, choose one reward to begin the next raid.</p></div></section>`;
}
function render(){
 $('raid').textContent=`${state.raid+1} / ${RAIDS.length}`;$('raidname').textContent=RAIDS[state.raid].name;$('turn').textContent=state.turn;$('integrity').textContent=`${state.integrity} / 30`;$('hunger').textContent=`${state.hunger} / 100`;$('gold').textContent=state.gold;
 $('lanes').innerHTML=[0,1,2].map(lane=>`<div class="lane"><div class="lane-name">LANE ${lane+1}</div><div class="combatants">${state.units.filter(u=>u.lane===lane&&u.alive).map(u=>`<div class="combatant ally">${sprite(u.species,u.id)}<b>${u.name} <span>Lv${u.level}</span></b>${hpBar(u.hp,u.maxHp)}${u.armor?`<small>⬟ ${u.armor} armor</small>`:''}</div>`).join('')||'<div class="empty">No defenders</div>'}<div class="lane-arrow">⚔</div>${state.enemies.filter(e=>e.lane===lane&&e.alive).map(e=>`<div class="combatant invader"><div class="foe">${e.name==='Mage'?'✧':e.name==='Archer'?'➶':'⚔'}</div><b>${e.name}</b>${hpBar(e.hp,e.maxHp)}<small>${e.attack} attack</small></div>`).join('')||'<div class="empty">Lane clear</div>'}</div></div>`).join('');
 const chain=previewChain(state);const rituals=previewRituals(state);
 $('commands').innerHTML=`<div class="chain-stats"><b>HAND ${state.deck.hand.length}/${handSize(state)} · CHAIN ${state.deck.chain.length}/5</b><span>Redraws: ${state.deck.discardsLeft} · Draw pile: ${state.deck.draw.length}</span></div><label class="chain-target">Command focus <select id="chain-target"><option value="">Auto: weakest invader</option>${state.enemies.filter(e=>e.alive).map(e=>`<option value="${e.id}" ${state.chainTargetId===e.id?'selected':''}>${e.name} · Lane ${e.lane+1} · ${e.hp} HP</option>`).join('')}</select></label><div class="chain-rituals">${rituals.map(x=>`<span>✦ ${x.ritual.name} (${x.start+1}–${x.end+1})</span>`).join('')||'Rituals: 3-card suit patterns unlock bonus effects'}</div><div class="chain-slots">${chain.map((step,i)=>`<button class="chain-card ${step.linked?'linked':''}" data-unqueue="${step.card.id}" title="Remove from chain (later cards may return to your hand)"><small>${i+1}. ${step.def.suit.toUpperCase()} ${step.def.rank||'★'}</small><b>${step.def.name}${step.card.level?` +${step.card.level}`:''}</b><span>${step.linked?'⛓ +'+Math.round((step.boost-1)*100)+'%':'Base effect'}</span></button>`).join('')||'<span class="chain-hint">Click cards below in the order you want them played.</span>'}</div><div class="card-hand">${state.deck.hand.map(c=>{const d=CARDS[c.type];return `<div class="hand-card ${d.suit}"><small>${d.suit.toUpperCase()} · ${d.rank||'★'}</small><b>${d.name}${c.level?` +${c.level}`:''}</b><span>${d.kind} · ${cardPower(state,c)}${d.cost?` · ${d.cost} Hunger${state.hunger<d.cost?' (insufficient)':''}`:''}</span><button data-queue="${c.id}" ${state.phase!=='battle'||state.deck.chain.length>=5||(state.deck.chain.length&&!linkCards(state.deck.chain.at(-1),c))?'disabled':''}>Add to chain</button><button class="discard" data-redraw="${c.id}" ${state.phase!=='battle'||state.deck.discardsLeft===0?'disabled':''}>Discard ↻</button></div>`}).join('')}</div>`;
 const living=state.units.filter(u=>u.alive);
 $('roster').innerHTML=state.units.map(u=>`<article class="roster-card ${u.alive?'':'dead'}">${sprite(u.species,`roster-${u.id}`)}<div><b>${u.name}</b><small>${SPECIES[u.species].role} · Lv ${u.level} · ${u.alive?`${u.xp}/${u.level*2} XP`:'FALLEN'}</small>${hpBar(u.hp,u.maxHp)}<small>${u.attack} attack · ${u.kills} kills</small></div><label>Lane <select data-move="${u.id}" ${state.phase!=='battle'||!u.alive?'disabled':''}>${[0,1,2].map(l=>`<option value="${l}" ${l===u.lane?'selected':''}>${l+1}</option>`).join('')}</select></label></article>`).join('');
 $('log').innerHTML=state.log.map(x=>`<p>${x.replaceAll('&','&amp;').replaceAll('<','&lt;')}</p>`).join('');$('turn-button').disabled=state.phase!=='battle';$('devour').disabled=state.phase!=='battle'||state.hunger<100;
 $('overlay').hidden=state.phase==='battle';$('overlaytag').textContent=state.phase==='reward'?'RAID REPELLED':state.phase==='won'?'VICTORY':'DEFEAT';$('overlaytitle').textContent=state.phase==='reward'?'Reinforce your dungeon':state.phase==='won'?'The throne is yours.':'Your kingdom has fallen.';$('overlaycopy').textContent=state.phase==='reward'?'Spend gold on upgrades, then take one free reinforcement to face the next raid. Fallen defenders stay fallen.':state.phase==='won'?'You survived five raids with your persistent army.':'Try another strategy, rearrange your lanes, and protect your veterans.';
 $('rewards').innerHTML=state.phase==='reward'?`${shopHTML()}<button data-reward="rest">Rest: heal living units +8, restore 5 integrity</button><button data-reward="train">Train: level up weakest survivor</button>${living.length<5?'<button data-reward="recruit">Recruit: add a new monster</button>':''}`:'<button data-reset>Start a new siege</button>';
 document.querySelectorAll('[data-sprite]').forEach(el=>{const species=el.dataset.sprite;animate(el,species,species==='king-mimic'&&state.phase==='lost'?'death':state.units.find(u=>el.dataset.unit===u.id||el.dataset.unit===`roster-${u.id}`)?.alive===false?'death':'idle');});animate($('king-sprite'),'king-mimic',state.phase==='lost'?'death':'idle');save();
}
let busy=false;
function replay(events){if(!events.length)return;busy=true;const actions=events.filter(x=>x.state!=='damage'||x.id==='king-mimic').slice(0,14);let i=0;const play=()=>{if(i>=actions.length){busy=false;return;}const e=actions[i++];const u=state.units.find(x=>x.id===e.id);const species=u?.species||'king-mimic';document.querySelectorAll(`[data-unit="${e.id}"]`).forEach(el=>animate(el,species,e.state));if(e.id==='king-mimic')animate($('king-sprite'),'king-mimic',e.state);setTimeout(play,e.state==='death'?550:320);};play();}
$('commands').addEventListener('change',e=>{if(e.target.id==='chain-target'){targetChain(state,e.target.value||null);save();}});
$('commands').addEventListener('click',e=>{if(busy||state.phase!=='battle')return;const b=e.target.closest('[data-queue],[data-unqueue],[data-redraw]');if(!b)return;if(b.dataset.queue)queueCommand(state,b.dataset.queue);else if(b.dataset.unqueue)unqueueCommand(state,b.dataset.unqueue);else if(b.dataset.redraw)redrawCommand(state,b.dataset.redraw);render();});
$('roster').addEventListener('change',e=>{if(e.target.matches('[data-move]')){moveUnit(state,e.target.dataset.move,Number(e.target.value));render();}});
$('turn-button').addEventListener('click',()=>{if(busy)return;endTurn(state);const events=[...state.animations];render();replay(events);});
$('devour').addEventListener('click',()=>{if(busy)return;if(devour(state)){const events=[...state.animations];render();replay(events);}});
$('rewards').addEventListener('click',e=>{if(busy)return;const b=e.target.closest('button');if(!b)return;if(b.dataset.buy){const card=b.closest('[data-shop-offer]');const targetId=card?.querySelector('[data-shop-target]')?.value||null;if(buyUpgrade(state,b.dataset.buy,targetId))render();return;}if(b.hasAttribute('data-reset')){state=newSiege();render();return;}if(b.dataset.reward&&reinforce(state,b.dataset.reward))render();});
$('new').addEventListener('click',()=>{if(confirm('Abandon this siege and start a new one?')){state=newSiege();render();}});
render();
