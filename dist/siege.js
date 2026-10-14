import {CARDS,FOUNDING_CARDS,STARTER_DECK,canQueueCard,chainSlotCount} from './chain-engine.js';
import {MAX_MINIONS,MAX_LANE_MINIONS,MAX_BONES,liveMinions} from './swarm-engine.js';
import {MUTATIONS,handSize,upgradeableCards,trainableUnits,cardPower} from './shop-engine.js';
import {ESSENCE_CAPACITY,ESSENCE_BY_ENEMY,ESSENCE_TRAITS,hungerCost,redrawLimit} from './assimilation-engine.js';
import {newSiege,restoreSiege,RAIDS,SPECIES,moveUnit,endTurn,devour,gnaw,reinforce,buyUpgrade,chooseEssence,queueCommand,unqueueCommand,redrawCommand,previewChain,previewRituals,targetChain,setSummonLane} from './siege-engine.js';
const $=id=>document.getElementById(id),KEY='mimicry-siege-v7';
let state;try{state=restoreSiege(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('mimicry-siege-v6')||localStorage.getItem('mimicry-siege-v5')||localStorage.getItem('mimicry-siege-v4')||localStorage.getItem('mimicry-siege-v3')||localStorage.getItem('mimicry-siege-v2')))}catch{}state??=newSiege();
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
  const isCard=offer.id==='card',isMonster=offer.id==='monster',isRare=offer.id==='rare',isTribal=offer.id==='tribal';
  const rare=isRare?CARDS[offer.cardType]:null;
  const name=isCard?'Enhance a command':isMonster?'Train a defender':isRare?rare.name:isTribal?'Tribal Recruitment':mutation.name;
  const icon=isCard?'⚔':isMonster?'⬟':isRare?'✦':isTribal?'☠':'◈';
  const desc=isCard?'Choose an eligible command: +2 base power per level, maximum twice.':
    isMonster?'Choose a surviving defender: +2 attack and +4 maximum HP.':
    isRare?rare.description:isTribal?'Choose a Goblin or Skeleton card; duplicate recruits can form mobs.':mutation.description;
  const choices=isCard?cards:units;
  const selector=(isCard||isMonster)&&!offer.sold?`<label class="shop-select">${isCard?'Command to improve':'Defender to train'}<select data-shop-target>${choices.map(x=>`<option value="${x.id}">${isCard?`${CARDS[x.type].name} ${x.level?`+${x.level}`:''} · power ${cardPower(state,x)}`:`${x.name} · Lv${x.level} · ${x.attack} ATK`}</option>`).join('')}</select></label>`:isTribal&&!offer.sold?`<label class='shop-select'>Choose a tribal card<select data-shop-target>${offer.options.map(type=>`<option value='${type}'>${CARDS[type].tribe.toUpperCase()} · ${CARDS[type].name}</option>`).join('')}</select></label>`:'';
  const cannotBuy=offer.sold||state.gold<offer.cost||((isCard||isMonster)&&!choices.length)||
    ((isRare||isTribal)&&state.deck.acquired.length>=8);
  const typeLabel=isCard?'CARD ENHANCEMENT':isMonster?'ARMY TRAINING':
    isRare?`${rare.rarity.toUpperCase()} · ${rare.suit.toUpperCase()} ${rare.rank||'★'}`:isTribal?'GOBLIN OR SKELETON':'MIMIC MUTATION';
  const extra=isRare?`<div class="shop-card-detail"><span>ONE NEW COMMAND</span><strong>${rare.kind.toUpperCase()} ${rare.power?'· '+rare.power+' POWER':''}</strong><small>In your next draw · ${STARTER_DECK.length+FOUNDING_CARDS.length+state.deck.acquired.length} currently owned</small></div>`:isTribal?`<div class='shop-card-detail'><span>CHOOSE YOUR SWARM</span>${offer.options.map(type=>`<small>${CARDS[type].name}: ${CARDS[type].description}</small>`).join('')}</div>`:'';
  return `<article class="shop-offer ${isRare?'shop-rare '+rare.rarity:''} ${isTribal?'shop-tribal':''} ${offer.sold?'shop-sold':''}" data-shop-offer="${offer.id}"><div class="shop-icon">${icon}</div><div class="shop-type">${typeLabel}</div><h3>${name}</h3><p>${desc}</p>${extra}${selector}<button data-buy="${offer.id}" ${cannotBuy?'disabled':''}>${offer.sold?'PURCHASED':`BUY · ${offer.cost} GOLD`}</button></article>`;
 }).join('');
 return `<section class="quartermaster"><div class="shop-head"><div><span class="eyebrow">THE GOBLIN QUARTERMASTER</span><h3>Wares from the fallen</h3><p>Buy tribal recruits, new tactics, and rare commands—or save for a later raid.</p></div><strong>◈ ${state.gold} GOLD</strong></div><div class="shop-grid">${offers}</div><div class="shop-footer"><span class="eyebrow">FREE RAID REINFORCEMENT</span><p>Keep any unspent gold. Choose one free reward below when you are ready for the next raid.</p></div></section>`;
}

function essenceSlotsHTML(){
 const owned=state.essences.map(id=>ESSENCE_TRAITS[id]);
 return `<div class="essence-slots"><span class="eyebrow">ASSIMILATED TRAITS · ${owned.length}/${ESSENCE_CAPACITY}</span><div class="essence-equipped">${owned.map(t=>`<span class="essence-chip" title="${t.description}">✦ ${t.name}<small>${t.enemy}</small></span>`).join('')||'<span class="essence-empty">No stolen traits yet — Devour a weakened adventurer to steal one.</span>'}</div></div>`;
}
function essenceHTML(){
 const prey=state.pendingEssence;
 if(!prey)return '';
 const options=ESSENCE_BY_ENEMY[prey.enemyType];
 const full=state.essences.length>=ESSENCE_CAPACITY;
 const replacement=full?`<label class="essence-replace-label" for="essence-replace">Your Mimic has only three trait slots. Choose which ability will be replaced:<select id="essence-replace">${state.essences.map(id=>`<option value="${id}">${ESSENCE_TRAITS[id].name} · ${ESSENCE_TRAITS[id].description}</option>`).join('')}</select></label>`:'';
 return `<section class="assimilation-choice">
  <div class="essence-prey"><span class="essence-skull">◈</span><div><span class="eyebrow">NEW PREY ABSORBED</span><h3>${prey.enemyType} · Stolen Essence</h3><p>Choose one inherited ability. Powers stay with the Mimic until deliberately replaced.</p></div></div>
  ${essenceSlotsHTML()}
  ${replacement}
  <div class="essence-options">${options.map(id=>{const t=ESSENCE_TRAITS[id],owned=state.essences.includes(id);return `<article class="essence-choice ${owned?'essence-owned':''}">
    <span class="essence-school">${t.school.toUpperCase()} · ${t.enemy.toUpperCase()}</span><h3>${t.name}</h3><p>${t.description}</p>
    <button data-choose-essence="${id}" ${owned?'disabled':''}>${owned?'ALREADY ABSORBED':full?'REPLACE & ABSORB':'ABSORB TRAIT'}</button>
   </article>`}).join('')}</div>
  <button class="essence-skip" data-skip-essence>Let this essence fade and continue →</button>
 </section>`;
}
function render(){
 $('bones').textContent=`${state.bones}/${MAX_BONES}`;$('swarm-count').textContent=`${liveMinions(state).length}/${MAX_MINIONS}`;
 $('raid').textContent=`${state.raid+1} / ${RAIDS.length}`;$('raidname').textContent=RAIDS[state.raid].name;$('turn').textContent=state.turn;$('integrity').textContent=`${state.integrity} / ${state.maxIntegrity}`;$('hunger').textContent=`${state.hunger} / 100`;$('gold').textContent=state.gold;
 $('lanes').innerHTML=[0,1,2].map(lane=>`<div class="lane"><div class="lane-name">LANE ${lane+1}</div><div class="combatants">${[
 ...state.units.filter(u=>u.lane===lane&&u.alive).map(u=>`<div class="combatant ally">${sprite(u.species,u.id)}<b>${u.name} <span>Lv${u.level}</span></b>${hpBar(u.hp,u.maxHp)}${u.armor?`<small>⬟ ${u.armor} armor</small>`:''}</div>`),
 ...liveMinions(state,null,lane).map(u=>`<div class="combatant ally swarm-minion ${u.species}">${sprite(u.species,u.id)}<b>${u.name}</b>${hpBar(u.hp,u.maxHp)}<small>SUMMON · ${u.attack} ATK</small></div>`)
 ].join('')||'<div class="empty">No defenders</div>'}<div class="lane-arrow">⚔</div>${state.enemies.filter(e=>e.lane===lane&&e.alive).map(e=>`<div class="combatant invader"><div class="foe">${e.name==='Mage'?'✧':e.name==='Archer'?'➶':'⚔'}</div><b>${e.name}</b>${hpBar(e.hp,e.maxHp)}<small>${e.attack} attack</small></div>`).join('')||'<div class="empty">Lane clear</div>'}</div></div>`).join('');
 const chain=previewChain(state);const rituals=previewRituals(state);
 $('commands').innerHTML=`<div class="chain-stats"><b>HAND ${state.deck.hand.length}/${handSize(state)} · CHAIN ${chainSlotCount(state.deck.chain)}/5 SLOTS</b><span>Redraws: ${state.deck.discardsLeft}/${redrawLimit(state)} · Draw pile: ${state.deck.draw.length} · Deck: ${STARTER_DECK.length+FOUNDING_CARDS.length+state.deck.acquired.length}</span></div><label class="chain-target">Summon lane <select id="summon-lane">${[0,1,2].map(lane=>`<option value="${lane}" ${state.summonLane===lane?'selected':''}>Lane ${lane+1} · ${liveMinions(state,null,lane).length}/${MAX_LANE_MINIONS} minions</option>`).join('')}</select></label><label class="chain-target">Command focus &amp; Devour target <select id="chain-target"><option value="">Auto: weakest invader</option>${state.enemies.filter(e=>e.alive).map(e=>`<option value="${e.id}" ${state.chainTargetId===e.id?'selected':''}>${e.name} · Lane ${e.lane+1} · ${e.hp} HP</option>`).join('')}</select></label><div class="chain-rituals">${rituals.map(x=>`<span>✦ ${x.ritual.name} (${x.start+1}–${x.end+1})</span>`).join('')||'Rituals need 3 separate slots; a stacked mob counts as one'}</div><div class="chain-slots">${chain.map((step,i)=>`<button class="chain-card ${step.linked?'linked':''}" data-unqueue="${step.cards.at(-1).id}" title="Remove one card from this slot; recruit stacks share one slot."><small>${i+1}. ${step.def.suit.toUpperCase()} ${step.def.rank||'★'} ${step.count>1?'· ×'+step.count+' STACK':''}</small><b>${step.def.name}${step.card.level?` +${step.card.level}`:''}</b><span>${step.count===3?'HORDE · 3 MINIONS':step.count===2?'MOB · 2 MINIONS':step.linked?'⛓ +'+Math.round((step.boost-1)*100)+'%':'Base effect'}</span></button>`).join('')||'<span class="chain-hint">Click cards below in order. Duplicate recruits stack automatically (up to 3 per slot).</span>'}</div><div class="card-hand">${state.deck.hand.map(c=>{const d=CARDS[c.type];return `<div class="hand-card ${d.suit} ${d.rarity||'common'} ${d.tribe?'tribal '+d.tribe:''}"><small>${d.tribe?d.tribe.toUpperCase()+' · ':''}${d.rarity?d.rarity.toUpperCase()+' · ':''}${d.suit.toUpperCase()} · ${d.rank||'★'}</small><b>${d.name}${c.level?` +${c.level}`:''}</b><span>${d.kind} · ${cardPower(state,c)}${d.cost?` · ${d.cost} Hunger${state.hunger<d.cost?' (insufficient)':''}`:''}</span>${d.description?`<small class="rare-description">${d.description}</small>`:''}<button data-queue="${c.id}" ${state.phase!=='battle'||!!state.pendingEssence||!canQueueCard(state.deck,c.id)?'disabled':''}>${d.kind==='summon'&&state.deck.chain.at(-1)?.type===c.type?'Stack into formation':'Add to chain'}</button><button class="discard" data-redraw="${c.id}" ${state.phase!=='battle'||state.deck.discardsLeft===0?'disabled':''}>Discard ↻</button></div>`}).join('')}</div>`;
 const living=state.units.filter(u=>u.alive);
 $('roster').innerHTML=state.units.map(u=>`<article class="roster-card ${u.alive?'':'dead'}">${sprite(u.species,`roster-${u.id}`)}<div><b>${u.name}</b><small>${SPECIES[u.species].role} · Lv ${u.level} · ${u.alive?`${u.xp}/${u.level*2} XP`:'FALLEN'}</small>${hpBar(u.hp,u.maxHp)}<small>${u.attack} attack · ${u.kills} kills</small></div><label>Lane <select data-move="${u.id}" ${state.phase!=='battle'||!u.alive?'disabled':''}>${[0,1,2].map(l=>`<option value="${l}" ${l===u.lane?'selected':''}>${l+1}</option>`).join('')}</select></label></article>`).join('');
 const king=state.enemies.find(e=>e.alive&&e.id===state.chainTargetId)||state.enemies.filter(e=>e.alive).sort((a,b)=>a.hp-b.hp)[0];
 const finishingBite=king&&king.hp+(king.armor||0)<=25;
 const gnawCapture=king&&king.hp+(king.armor||0)<=8;
 $('gnaw').textContent=king?`GNAW ${king.name.toUpperCase()} · ${gnawCapture?'ESSENCE READY':'8 DAMAGE'}`:'GNAW · 20 HUNGER';
 $('gnaw').title=king?`Costs 20 Hunger. Deals up to 8 damage to ${king.name}. ${gnawCapture?'A killing Gnaw captures its essence.':'Soften the enemy before trying to capture it.'}`:'Requires a living enemy.';
 $('devour').textContent=king?`DEVOUR ${king.name.toUpperCase()} · ${finishingBite?'ESSENCE READY':'WEAKEN PREY'}`:'DEVOUR · 100 HUNGER';
 $('devour').title=king?`Costs 100 Hunger. Deals up to 25 damage to ${king.name}. ${finishingBite?'A killing bite would capture its essence.':'Lower its HP and armor before attempting a capture.'}`:'Requires a living enemy.';
 $('king-essences').innerHTML=essenceSlotsHTML();
 $('log').innerHTML=state.log.map(x=>`<p>${x.replaceAll('&','&amp;').replaceAll('<','&lt;')}</p>`).join('');$('turn-button').disabled=state.phase!=='battle'||!!state.pendingEssence;$('gnaw').disabled=state.phase!=='battle'||!!state.pendingEssence||state.hunger<20;$('devour').disabled=state.phase!=='battle'||!!state.pendingEssence||state.hunger<100;
 const pending=Boolean(state.pendingEssence);
 $('overlay').hidden=state.phase==='battle'&&!pending;
 $('overlaytag').textContent=pending?'THE KING MIMIC EVOLVES':state.phase==='reward'?'RAID REPELLED':state.phase==='won'?'VICTORY':'DEFEAT';
 $('overlaytitle').textContent=pending?'Choose what to become':state.phase==='reward'?'Reinforce your dungeon':state.phase==='won'?'The throne is yours.':'Your kingdom has fallen.';
 $('overlaycopy').textContent=pending?'Your killing bite captured an adventurer’s essence. Choose one trait or let it go. This choice cannot be undone until you capture another.':state.phase==='reward'?'Spend gold on upgrades, then take one free reinforcement to face the next raid. Fallen defenders stay fallen.':state.phase==='won'?'You survived five raids with your persistent army.':'Try another strategy, rearrange your lanes, and protect your veterans.';
 $('rewards').innerHTML=pending?essenceHTML():state.phase==='reward'?`${shopHTML()}<button data-reward="rest">Rest: heal living units +8, restore 5 integrity</button><button data-reward="train">Train: level up weakest survivor</button>${living.length<5?'<button data-reward="recruit">Recruit: add a new monster</button>':''}`:'<button data-reset>Start a new siege</button>';
 document.querySelectorAll('[data-sprite]').forEach(el=>{const species=el.dataset.sprite;animate(el,species,species==='king-mimic'&&state.phase==='lost'?'death':state.units.find(u=>el.dataset.unit===u.id||el.dataset.unit===`roster-${u.id}`)?.alive===false?'death':'idle');});animate($('king-sprite'),'king-mimic',state.phase==='lost'?'death':'idle');save();
}
let busy=false;
function replay(events){if(!events.length)return;busy=true;const actions=events.filter(x=>x.state!=='damage'||x.id==='king-mimic').slice(0,14);let i=0;const play=()=>{if(i>=actions.length){busy=false;return;}const e=actions[i++];const u=[...state.units,...state.minions].find(x=>x.id===e.id);const species=u?.species||'king-mimic';document.querySelectorAll(`[data-unit="${e.id}"]`).forEach(el=>animate(el,species,e.state));if(e.id==='king-mimic')animate($('king-sprite'),'king-mimic',e.state);setTimeout(play,e.state==='death'?550:320);};play();}
$('commands').addEventListener('change',e=>{
 if(e.target.id==='chain-target'&&targetChain(state,e.target.value||null))render();
 if(e.target.id==='summon-lane'&&setSummonLane(state,Number(e.target.value)))render();
});
$('commands').addEventListener('click',e=>{if(busy||state.phase!=='battle')return;const b=e.target.closest('[data-queue],[data-unqueue],[data-redraw]');if(!b)return;if(b.dataset.queue)queueCommand(state,b.dataset.queue);else if(b.dataset.unqueue)unqueueCommand(state,b.dataset.unqueue);else if(b.dataset.redraw)redrawCommand(state,b.dataset.redraw);render();});
$('roster').addEventListener('change',e=>{if(e.target.matches('[data-move]')){moveUnit(state,e.target.dataset.move,Number(e.target.value));render();}});
$('turn-button').addEventListener('click',()=>{if(busy)return;endTurn(state);const events=[...state.animations];render();replay(events);});
$('devour').addEventListener('click',()=>{if(busy)return;if(devour(state)){const events=[...state.animations];render();replay(events);}});
$('gnaw').addEventListener('click',()=>{if(busy)return;if(gnaw(state)){const events=[...state.animations];render();replay(events);}});
$('rewards').addEventListener('click',e=>{if(busy)return;const b=e.target.closest('button');if(!b)return;
 if(b.dataset.chooseEssence){const replaceId=$('essence-replace')?.value||null;if(chooseEssence(state,b.dataset.chooseEssence,replaceId))render();return;}
 if(b.hasAttribute('data-skip-essence')){if(chooseEssence(state,'skip'))render();return;}if(b.dataset.buy){const card=b.closest('[data-shop-offer]');const targetId=card?.querySelector('[data-shop-target]')?.value||null;if(buyUpgrade(state,b.dataset.buy,targetId))render();return;}if(b.hasAttribute('data-reset')){state=newSiege();render();return;}if(b.dataset.reward&&reinforce(state,b.dataset.reward))render();});
$('new').addEventListener('click',()=>{if(confirm('Abandon this siege and start a new one?')){state=newSiege();render();}});
render();
