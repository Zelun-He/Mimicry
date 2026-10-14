import {CARDS,FOUNDING_CARDS,STARTER_DECK,canQueueCard,chainSlotCount} from './chain-engine.js';
import {MAX_MINIONS,MAX_LANE_MINIONS,MAX_BONES,liveMinions} from './swarm-engine.js';
import {MAX_WEB,CREATURES} from './creature-engine.js';
import {cardArt,cardRule,CARD_LORE,SUIT_STYLES} from './siege/card-art.js';
import {FOREST_SCENES,sceneForRaid,nextActionTip,stageProgress} from './siege/tier1.js';
import {LINK_KINDS,previewCardLink,queuedLinkKinds} from './siege/link-feedback.js';
import {renderCompactCommands,renderCompactLanes} from './siege/combat-ui.js';
import {MUTATIONS,handSize,upgradeableCards,trainableUnits,cardPower} from './shop-engine.js';
import {ESSENCE_CAPACITY,ESSENCE_BY_ENEMY,ESSENCE_TRAITS,hungerCost,redrawLimit} from './assimilation-engine.js';
import {newSiege,restoreSiege,RAIDS,SPECIES,moveUnit,endTurn,devour,gnaw,reinforce,buyUpgrade,chooseEssence,queueCommand,unqueueCommand,redrawCommand,previewChain,previewRituals,targetChain,setSummonLane} from './siege-engine.js';
const $=id=>document.getElementById(id),KEY='mimicry-siege-v8';
const artCache=new Map();
const artFor=type=>{if(!artCache.has(type))artCache.set(type,cardArt(type));return artCache.get(type);};
let tipsHidden=false;try{tipsHidden=localStorage.getItem('mimicry-tier1-tips-hidden')==='yes';}catch{}
function setTipsHidden(value){tipsHidden=value;try{localStorage.setItem('mimicry-tier1-tips-hidden',value?'yes':'no');}catch{}}

let lastQueuedId=null;
let activePreviewId=null;
let discardMode=false;
let state;try{state=restoreSiege(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('mimicry-siege-v7')||localStorage.getItem('mimicry-siege-v6')||localStorage.getItem('mimicry-siege-v5')||localStorage.getItem('mimicry-siege-v4')||localStorage.getItem('mimicry-siege-v3')||localStorage.getItem('mimicry-siege-v2')))}catch{}state??=newSiege();
const manifest=await fetch('./siege/animations.json').then(r=>r.json());
const names=['king-mimic',...Object.keys(SPECIES)];
const animations=new Map();
function animate(el,species,action='idle'){
 if(!el)return;const key=`${species}.${action}`,entry=manifest.animations[key];if(!entry)return;
 let running=animations.get(el);if(running){clearInterval(running.timer);animations.delete(el);}
 let index=0;const set=()=>{el.style.backgroundImage=`url('./siege/${entry.file}')`;el.style.backgroundPosition=`-${index*64}px -${entry.row*64}px`;};set();
 const ms=action==='idle'?190:125;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const timer=setInterval(()=>{index++;if(index>=entry.frames.length){if(entry.loop)index=0;else{clearInterval(timer);animations.delete(el);if(action!=='death')animate(el,species,'idle');return;}}set();},ms);
 animations.set(el,{timer});
}
function clearSpriteAnimations(){
 for(const entry of animations.values())clearInterval(entry.timer);
 animations.clear();
}
function save(){localStorage.setItem(KEY,JSON.stringify({...state,animations:[]}));}
function sprite(species,id){
 const exotic=['spider','slime-bud','slimelet','slime-giant','mimicling'].includes(species);
 return `<div class="sprite ${exotic?'exotic-sprite '+species:''}" data-sprite="${species}" data-unit="${id}"></div>`;
}
function hpBar(hp,max){return `<div class="hp"><div style="width:${Math.round(hp/max*100)}%"></div></div><small>${hp}/${max} HP</small>`;}
function shopHTML(){
 const cards=upgradeableCards(state).sort((a,b)=>CARDS[a.type].name.localeCompare(CARDS[b.type].name));
 const units=trainableUnits(state);
 const offers=state.shopOffers.map(offer=>{
  const mutation=MUTATIONS[offer.id];
  const isCard=offer.id==='card',isMonster=offer.id==='monster',isRare=offer.id==='rare',isTribal=offer.id==='tribal',isExotic=offer.id==='exotic';
  const rare=isRare?CARDS[offer.cardType]:null;
  const name=isCard?'Enhance a command':isMonster?'Train a defender':isRare?rare.name:isTribal?'Tribal Recruitment':isExotic?'Creature Menagerie':mutation.name;
  const icon=isCard?'⚔':isMonster?'⬟':isRare?'✦':isTribal?'☠':isExotic?'✳':'◈';
  const desc=isCard?'Choose an eligible command: +2 base power per level, maximum twice.':
    isMonster?'Choose a surviving defender: +2 attack and +4 maximum HP.':
    isRare?rare.description:isTribal?'Choose a Goblin or Skeleton card; duplicate recruits can form mobs.':isExotic?'Choose one Spider, Slime, or Mimicling card. New creatures join your summon deck.':mutation.description;
  const choices=isCard?cards:units;
  const selector=(isCard||isMonster)&&!offer.sold?`<label class="shop-select">${isCard?'Command to improve':'Defender to train'}<select data-shop-target>${choices.map(x=>`<option value="${x.id}">${isCard?`${CARDS[x.type].name} ${x.level?`+${x.level}`:''} · power ${cardPower(state,x)}`:`${x.name} · Lv${x.level} · ${x.attack} ATK`}</option>`).join('')}</select></label>`:(isTribal||isExotic)&&!offer.sold?`<label class='shop-select'>Choose a creature card<select data-shop-target>${offer.options.map(type=>`<option value='${type}'>${CARDS[type].tribe.toUpperCase()} · ${CARDS[type].name}</option>`).join('')}</select></label>`:'';
  const cannotBuy=offer.sold||state.gold<offer.cost||((isCard||isMonster)&&!choices.length)||
    ((isRare||isTribal||isExotic)&&state.deck.acquired.length>=12);
  const typeLabel=isCard?'CARD ENHANCEMENT':isMonster?'ARMY TRAINING':
    isRare?`${rare.rarity.toUpperCase()} · ${rare.suit.toUpperCase()} ${rare.rank||'★'}`:isTribal?'GOBLIN OR SKELETON':isExotic?'SPIDER · SLIME · MIMICLING':'MIMIC MUTATION';
  const extra=isRare?`<div class="shop-card-detail"><span>ONE NEW COMMAND</span><strong>${rare.kind.toUpperCase()} ${rare.power?'· '+rare.power+' POWER':''}</strong><small>In your next draw · ${STARTER_DECK.length+FOUNDING_CARDS.length+state.deck.acquired.length} currently owned</small></div>`:(isTribal||isExotic)?`<div class='shop-card-detail'><span>${isExotic?'NEW MONSTER FAMILY':'CHOOSE YOUR SWARM'}</span>${offer.options.map(type=>`<small>${CARDS[type].name}: ${CARDS[type].description}</small>`).join('')}</div>`:'';
  const previewType=isRare?offer.cardType:(isTribal||isExotic)?(offer.sold?offer.purchasedType:offer.options[0]):null;
  const preview=previewType?`<div class="shop-offer__card-preview" aria-hidden="true">${artFor(previewType)}</div><span class="shop-offer__selected-name">${CARDS[previewType].name}</span>`:'';
  return `<article class="shop-offer ${isRare?'shop-rare '+rare.rarity:''} ${isTribal?'shop-tribal':''} ${isExotic?'shop-exotic':''} ${offer.sold?'shop-sold':''}" data-shop-offer="${offer.id}"><div class="shop-icon">${icon}</div><div class="shop-type">${typeLabel}</div><h3>${name}</h3><p>${desc}</p>${preview}${extra}${selector}<button data-buy="${offer.id}" ${cannotBuy?'disabled':''}>${offer.sold?'PURCHASED':`BUY · ${offer.cost} GOLD`}</button></article>`;
 }).join('');
 return `<section class="quartermaster"><div class="shop-head"><div><span class="eyebrow">THE GOBLIN QUARTERMASTER</span><h3>Wares from the fallen</h3><p>Build your ecosystem: Goblin/Skeleton swarms plus Spider, Slime, and Mimicling creatures.</p></div><strong>◈ ${state.gold} GOLD</strong></div><div class="shop-grid">${offers}</div><div class="shop-footer"><span class="eyebrow">FREE RAID REINFORCEMENT</span><p>Keep any unspent gold. Choose one free reward below when you are ready for the next raid.</p></div></section>`;
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
 clearSpriteAnimations();
 if(state.phase!=='battle'||state.pendingEssence||state.deck.discardsLeft===0)discardMode=false;
 activePreviewId=null;
 const scene=sceneForRaid(state.raid);
 $('arena-scene').dataset.scene=scene.id;
 $('scene-title').textContent=scene.name;
 $('scene-subtitle').textContent=scene.subtitle;
 $('scene-eyebrow').textContent=scene.eyebrow;
 $('forest-progress').innerHTML=stageProgress(state.raid).map((step,i)=>
  `<span class="forest-progress__dot ${step.current?'current':step.completed?'complete':''}" title="${step.name}" aria-label="${step.completed?'Completed':step.current?'Current':'Upcoming'} location ${i+1}: ${step.name}"></span>`).join('');
 const tip=nextActionTip(state);
 $('first-run-tip').hidden=tipsHidden||state.raid>0;
 if(!tipsHidden&&state.raid===0){
  $('tip-kicker').textContent=tip.tag;$('tip-title').textContent=tip.title;$('tip-copy').textContent=tip.text;
 }
 $('tips-toggle').textContent=tipsHidden?'Show hints':'Hide hints';
 $('tips-toggle').setAttribute('aria-pressed',String(!tipsHidden));
 $('bones').textContent=`${state.bones}/${MAX_BONES}`;$('swarm-count').textContent=`${liveMinions(state).length}/${MAX_MINIONS}`;
 $('raid').textContent=`${state.raid+1} / ${RAIDS.length}`;$('raidname').textContent=RAIDS[state.raid].name;$('turn').textContent=state.turn;$('integrity').textContent=`${state.integrity} / ${state.maxIntegrity}`;$('hunger').textContent=`${state.hunger} / 100`;$('gold').textContent=state.gold;
 $('lanes').innerHTML=renderCompactLanes(state,{sprite,hpBar});
 const chain=previewChain(state);const rituals=previewRituals(state);const kinds=queuedLinkKinds(state.deck.chain);
 $('commands').innerHTML=renderCompactCommands(state,{artFor,cardRule,handSize:handSize(state),chain,kinds,rituals,lastQueuedId,discardMode});
 $('discard-mode').disabled=state.phase!=='battle'||!!state.pendingEssence||state.deck.discardsLeft===0;
 $('discard-mode').setAttribute('aria-pressed',String(discardMode));
 $('discard-mode').textContent=discardMode?'CANCEL DISCARD':`DISCARD · ${state.deck.discardsLeft} LEFT`;
 $('turn-button').textContent='ATTACK →';
 $('combat-feedback').textContent=state.log[0]||'Choose your cards, then press Attack to defend the chest.';
 $('creature-bestiary').innerHTML=Object.entries(CREATURES).map(([species,creature])=>{
  const ids={spider:'spider-summon','slime-bud':'slime-summon',mimicling:'mimicling-summon'};
  const owned=state.deck.acquired.includes(ids[species]);
  const active=liveMinions(state,species).length;
  const art={spider:'exotic-spider.svg','slime-bud':'exotic-slime.svg',mimicling:'exotic-mimicling.svg'}[species];
  return `<article class="creature-profile ${owned?'discovered':''}"><img src="./siege/${art}" width="64" height="64" alt="${creature.name} pixel art"/><div><span class="eyebrow">${creature.trait.toUpperCase()} · ${owned?'DISCOVERED':'SHOP UNLOCK'}</span><h3>${creature.name}</h3><p>${creature.mechanic}</p><small>${active} active in this battle</small></div></article>`;
 }).join('');
 const living=state.units.filter(u=>u.alive);
 $('roster').innerHTML=state.units.map(u=>`<article class="roster-card ${u.alive?'':'dead'}">${sprite(u.species,`roster-${u.id}`)}<div><b>${u.name}</b><small>${SPECIES[u.species].role} · Lv ${u.level} · ${u.alive?`${u.xp}/${u.level*2} XP`:'FALLEN'}</small>${hpBar(u.hp,u.maxHp)}<small>${u.attack} attack · ${u.kills} kills</small></div><label>Lane <select data-move="${u.id}" ${state.phase!=='battle'||!u.alive?'disabled':''}>${[0,1,2].map(l=>`<option value="${l}" ${l===u.lane?'selected':''}>${l+1}</option>`).join('')}</select></label></article>`).join('');
 const king=state.enemies.find(e=>e.alive&&e.id===state.chainTargetId)||state.enemies.filter(e=>e.alive).sort((a,b)=>a.hp-b.hp)[0];
 const finishingBite=king&&king.hp+(king.armor||0)<=25;
 const gnawCapture=king&&king.hp+(king.armor||0)<=8;
 $('gnaw').textContent=king&&gnawCapture?'GNAW · STEAL TRAIT':'GNAW · 20';
 $('gnaw').title=king?`Costs 20 Hunger. Deals up to 8 damage to ${king.name}. ${gnawCapture?'A killing Gnaw captures its essence.':'Soften the enemy before trying to capture it.'}`:'Requires a living enemy.';
 $('devour').textContent=king&&finishingBite?'DEVOUR · STEAL TRAIT':'DEVOUR · 100';
 $('devour').title=king?`Costs 100 Hunger. Deals up to 25 damage to ${king.name}. ${finishingBite?'A killing bite would capture its essence.':'Lower its HP and armor before attempting a capture.'}`:'Requires a living enemy.';
 $('king-essences').innerHTML=state.essences.length?essenceSlotsHTML():'';
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
$('tips-toggle').addEventListener('click',()=>{setTipsHidden(!tipsHidden);render();});
// Preview without mutating or rebuilding the hand (important for pointer focus).
function showLinkPreview(id){
 const card=state.deck.hand.find(c=>c.id===id);
 if(!card)return;
 const feedback=previewCardLink(state.deck,card);
 const locked=state.phase!=='battle'||Boolean(state.pendingEssence);
 const kind=locked?'unavailable':feedback.kind;
 const info=locked?LINK_KINDS.unavailable:feedback;
 activePreviewId=id;
 const readout=$('link-readout'),ghost=$('chain-next-slot');
 if(readout){
  readout.dataset.linkState=kind;
  $('link-preview-symbol').textContent=info.symbol;
  $('link-preview-title').textContent=info.label;
  $('link-preview-description').textContent=locked?'Finish the current choice to continue building your chain.':
   feedback.legal?(kind==='stack'?`${card.type==='goblin-recruit'?'Goblin':'Creature'} formation grows to ×${feedback.count}, using just one chain slot.`:
    `${info.explanation} ${Math.round((feedback.boost-1)*100)}% chain power bonus · ${feedback.slots}/5 slots.`):info.explanation;
 }
 if(ghost){
  ghost.dataset.linkState=kind;
  ghost.innerHTML=feedback.legal?`<span class="chain-next-slot__crest">${info.symbol}</span><strong>${info.short}</strong><small>${kind==='stack'?'Formation ×'+feedback.count:'Slot '+feedback.slots+' of 5'}</small>`:
   '<span class="chain-next-slot__crest">×</span><strong>NO LINK</strong><small>Choose another card</small>';
 }
 const chainRail=$('chain-slots');
 if(chainRail){
  chainRail.dataset.previewKind=kind;
  chainRail.querySelectorAll?.('.chain-card')?.forEach(el=>el.classList.toggle('preview-anchor',el===chainRail.querySelector('.chain-card:last-of-type')&&feedback.legal));
 }
 const container=$('commands');
 container.querySelectorAll?.('.hand-card[data-card-id]')?.forEach(el=>{
  el.classList.toggle('is-previewed',el.dataset.cardId===id);
 });
}
function clearLinkPreview(){
 if(!activePreviewId)return;
 activePreviewId=null;
 const readout=$('link-readout'),ghost=$('chain-next-slot'),rail=$('chain-slots');
 if(readout){readout.dataset.linkState='opening';$('link-preview-symbol').textContent='◇';
  $('link-preview-title').textContent='MAKE YOUR MOVE';
  $('link-preview-description').textContent='Match a symbol, match a number, or play the next higher number.';
 }
 if(ghost){ghost.dataset.linkState='opening';
  ghost.innerHTML='<span class="chain-next-slot__crest">＋</span><strong>NEXT LINK</strong><small>Choose a card</small>';
 }
 if(rail){rail.dataset.previewKind='opening';
  rail.querySelectorAll?.('.chain-card')?.forEach(el=>el.classList.remove('preview-anchor'));
 }
 $('commands').querySelectorAll?.('.hand-card.is-previewed')?.forEach(el=>el.classList.remove('is-previewed'));
}
const cardFromEvent=e=>e.target?.closest?.('.hand-card[data-card-id]');
$('commands').addEventListener('pointerover',e=>{
 if(e.pointerType==='touch')return;
 const card=cardFromEvent(e);
 if(card&&!card.contains?.(e.relatedTarget))showLinkPreview(card.dataset.cardId);
});
$('commands').addEventListener('pointerout',e=>{
 if(e.pointerType==='touch')return;
 const card=cardFromEvent(e);
 if(card&&!card.contains?.(e.relatedTarget))clearLinkPreview();
});
$('commands').addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch')return;
 const card=cardFromEvent(e);
 if(card&&!e.target.closest?.('button'))showLinkPreview(card.dataset.cardId);
});
$('commands').addEventListener('focusin',e=>{
 const card=cardFromEvent(e);
 if(card)showLinkPreview(card.dataset.cardId);
});
$('commands').addEventListener('focusout',e=>{
 const card=cardFromEvent(e);
 if(card&&!card.contains?.(e.relatedTarget))clearLinkPreview();
});
// Cards are native buttons: Enter/Space selects just like a pointer.
$('commands').addEventListener('change',e=>{
 if(e.target.id==='chain-target'&&targetChain(state,e.target.value||null))render();
 if(e.target.id==='summon-lane'&&setSummonLane(state,Number(e.target.value)))render();
});
$('commands').addEventListener('click',e=>{
 if(busy||state.phase!=='battle')return;
 const button=e.target.closest?.('[data-queue],[data-unqueue],[data-redraw]');
 if(!button){const card=cardFromEvent(e);if(card)showLinkPreview(card.dataset.cardId);return;}
 let changed=false;
 if(button.dataset.queue){
  changed=queueCommand(state,button.dataset.queue);
  if(changed)lastQueuedId=button.dataset.queue;
 }else if(button.dataset.unqueue)changed=unqueueCommand(state,button.dataset.unqueue);
 else if(button.dataset.redraw){changed=redrawCommand(state,button.dataset.redraw);if(changed)discardMode=false;}
 if(changed){render();lastQueuedId=null;}
});
$('discard-mode').addEventListener('click',()=>{
 if(busy||state.phase!=='battle'||state.pendingEssence||state.deck.discardsLeft<=0)return;
 discardMode=!discardMode;render();
});
$('lanes').addEventListener('click',e=>{
 if(busy||state.phase!=='battle'||state.pendingEssence)return;
 const target=e.target.closest?.('[data-focus-enemy]');
 if(target&&targetChain(state,target.dataset.focusEnemy))render();
});
$('roster').addEventListener('change',e=>{if(e.target.matches('[data-move]')){moveUnit(state,e.target.dataset.move,Number(e.target.value));render();}});
$('turn-button').addEventListener('click',()=>{if(busy)return;endTurn(state);const events=[...state.animations];render();replay(events);});
$('devour').addEventListener('click',()=>{if(busy)return;if(devour(state)){const events=[...state.animations];render();replay(events);}});
$('gnaw').addEventListener('click',()=>{if(busy)return;if(gnaw(state)){const events=[...state.animations];render();replay(events);}});
$('rewards').addEventListener('change',e=>{
 const select=e.target.closest('[data-shop-target]'),card=select?.closest('[data-shop-offer]');
 if(!card||!['tribal','exotic'].includes(card.dataset.shopOffer))return;
 const type=select.value,preview=card.querySelector('.shop-offer__card-preview');
 const label=card.querySelector('.shop-offer__selected-name');
 if(CARDS[type]&&preview&&label){preview.innerHTML=artFor(type);label.textContent=CARDS[type].name;}
});
$('rewards').addEventListener('click',e=>{if(busy)return;const b=e.target.closest('button');if(!b)return;
 if(b.dataset.chooseEssence){const replaceId=$('essence-replace')?.value||null;if(chooseEssence(state,b.dataset.chooseEssence,replaceId))render();return;}
 if(b.hasAttribute('data-skip-essence')){if(chooseEssence(state,'skip'))render();return;}if(b.dataset.buy){const card=b.closest('[data-shop-offer]');const targetId=card?.querySelector('[data-shop-target]')?.value||null;if(buyUpgrade(state,b.dataset.buy,targetId))render();return;}if(b.hasAttribute('data-reset')){state=newSiege();render();return;}if(b.dataset.reward&&reinforce(state,b.dataset.reward))render();});
$('new').addEventListener('click',()=>{if(confirm('Abandon this siege and start a new one?')){state=newSiege();render();}});
render();
