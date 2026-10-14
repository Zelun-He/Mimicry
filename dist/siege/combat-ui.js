// Compact, readable combat view. The siege and chain engines remain authoritative.
import {CARDS,chainSlotCount} from '../chain-engine.js';
import {liveMinions,MAX_LANE_MINIONS} from '../swarm-engine.js';
import {previewCardLink} from './link-feedback.js';
export const SCHOOL_MARKS=Object.freeze({"fang":"◆","shell":"⬡","bloom":"✦","venom":"◇","hunger":"♛"});

export function escapeHTML(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}

export function renderCompactHand(s,{artFor,cardRule,discardMode=false}){
 return s.deck.hand.map(card=>{
  const def=CARDS[card.type],link=previewCardLink(s.deck,card);
  const locked=s.phase!=='battle'||Boolean(s.pendingEssence);
  const legal=!locked&&link.legal,canDiscard=!locked&&s.deck.discardsLeft>0;
  const mode=discardMode?'discard':'queue';
  const action=discardMode?canDiscard:legal;
  const linkText=locked?'WAIT':discardMode?'DISCARD':link.short;
  const id=escapeHTML(card.id),name=escapeHTML(def.name),rule=escapeHTML(cardRule(card.type));
  return `<button type="button" class="hand-card ${def.suit} ${def.rarity||'common'} ${def.tribe?'tribal '+def.tribe:''} ${legal?'playable':'unplayable'} ${link.kind==='stack'&&legal?'stackable':''} ${discardMode?'discard-target':''}" data-card-id="${id}" data-school="${def.suit}" data-link-kind="${locked?'unavailable':link.kind}" ${action?`data-${mode==='queue'?'queue':'redraw'}="${id}"`:''} aria-disabled="${!action}" aria-label="${name}, ${def.suit} rank ${def.rank||'wild'}. ${rule}. ${discardMode?'Discard this card':link.label}.">
  <span class="hand-card__crown"><span class="hand-card__crest">${SCHOOL_MARKS[def.suit]} <span>${def.suit.toUpperCase()}</span></span><strong class="hand-card__rank">${def.rank||'★'}</strong></span>
  <span class="hand-card__illustration">${artFor(card.type)}<span class="card-school-fx" aria-hidden="true"></span></span>
  <span class="hand-card__name">${name}${card.level?' +'+card.level:''}</span>
  <span class="hand-card__effect">${rule}</span>
  <span class="hand-card__link-hint ${legal?'is-valid':'is-invalid'}"><span>${discardMode?'↻':link.symbol}</span><strong>${linkText}</strong></span>
 </button>`;
 }).join('');
}

export function renderCompactChain(s,chain,kinds,{lastQueuedId=null}={}){
 const parts=chain.map((step,i)=>{
  const card=CARDS[step.card.type],reason=kinds[i];
  const label=step.count>1?`×${step.count} ${step.count===3?'HORDE':'MOB'}`:reason.short;
  const id=escapeHTML(step.cards.at(-1).id);
  return `<button type="button" class="chain-card ${card.suit} link-${reason.kind} ${step.count>1?'chain-card--stack':''} ${step.cards.some(c=>c.id===lastQueuedId)?'just-queued':''}" data-unqueue="${id}" title="Remove ${escapeHTML(card.name)}. ${escapeHTML(reason.explanation)}" aria-label="Remove ${escapeHTML(card.name)} from slot ${i+1}">
   <span class="chain-card__identity"><b>${SCHOOL_MARKS[card.suit]}</b><strong>${card.rank||'★'}</strong></span>
   <span class="chain-card__name">${escapeHTML(card.name)}</span>
   <span class="chain-card__link-tag">${escapeHTML(label)}</span>
   <span class="chain-card__remove" aria-hidden="true">×</span>
  </button>`;
 });
 for(let i=parts.length;i<5;i++){
  const first=i===chain.length;
  parts.push(`<div class="chain-next-slot" ${first?'id="chain-next-slot"':''} aria-label="Empty chain slot ${i+1}">
   <span class="chain-next-slot__crest">${first?'＋':'·'}</span><small>${i+1}</small></div>`);
 }
 return parts.join('');
}

export function renderCompactCommands(s,{artFor,cardRule,handSize,chain,kinds,rituals,lastQueuedId,discardMode}){
 const slots=chainSlotCount(s.deck.chain),remaining=s.deck.discardsLeft;
 const options=s.enemies.filter(e=>e.alive).map(e=>`<option value="${escapeHTML(e.id)}" ${s.chainTargetId===e.id?'selected':''}>${escapeHTML(e.name)} · ${e.hp} HP · L${e.lane+1}</option>`).join('');
 const laneOptions=[0,1,2].map(l=>`<option value="${l}" ${s.summonLane===l?'selected':''}>Lane ${l+1} · ${liveMinions(s,null,l).length}/${MAX_LANE_MINIONS}</option>`).join('');
 const rit=rituals.length?`<div class="chain-rituals" aria-label="Active rituals">${rituals.map(r=>`<span>✦ ${escapeHTML(r.ritual.name)}</span>`).join('')}</div>`:'';
 return `<div class="combat-options">
   <div class="combat-options__stats"><strong>COMBO <span>${slots}/5</span></strong><small>${remaining} redraw${remaining===1?'':'s'} left · ${s.deck.hand.length}/${handSize} cards in hand</small></div>
   <label>FOCUS ENEMY<select id="chain-target"><option value="">Auto · weakest</option>${options}</select></label>
   <label>SUMMON TO<select id="summon-lane">${laneOptions}</select></label>
  </div>
  <div class="chain-section">
   <div class="chain-section__heading"><strong>YOUR COMBO</strong><span>Click a queued card to undo</span></div>
   <div class="chain-slots" id="chain-slots">${renderCompactChain(s,chain,kinds,{lastQueuedId})}</div>
   ${rit}
  </div>
  <div class="hand-heading"><strong>YOUR HAND <span>${s.deck.hand.length} CARDS</span></strong>
   <small>${discardMode?'DISCARD MODE · Click a card to redraw':'Click a card to add it to your combo'}</small></div>
  <div class="card-hand ${discardMode?'is-discarding':''}" aria-label="Your playable cards">${renderCompactHand(s,{artFor,cardRule,discardMode})}</div>
  <div class="link-readout" id="link-readout" data-link-state="opening" aria-live="polite" aria-atomic="true">
   <span class="link-readout__sigil" id="link-preview-symbol">◇</span>
   <div class="link-readout__copy"><strong id="link-preview-title">MAKE YOUR MOVE</strong>
    <span id="link-preview-description">Match a symbol, match a number, or play the next higher number.</span></div>
  </div>`;
}

export function renderCompactLanes(s,{sprite,hpBar}){
 return [0,1,2].map(lane=>{
  const allies=[...s.units.filter(u=>u.alive&&u.lane===lane),...liveMinions(s,null,lane)];
  const enemies=s.enemies.filter(e=>e.alive&&e.lane===lane);
  const friend=allies.length?allies.map(u=>`<div class="combatant ally ${u.summoned?'swarm-minion '+u.species:''}" title="${escapeHTML(u.name)} · ${u.hp}/${u.maxHp} HP">
   ${sprite(u.species,u.id)}<span class="combatant__meta"><b>${escapeHTML(u.name)}</b>${hpBar(u.hp,u.maxHp)}</span></div>`).join(''):'<span class="lane-empty">No defenders</span>';
  const foe=enemies.length?enemies.map(e=>`<button type="button" class="combatant invader ${s.chainTargetId===e.id?'focused':''}" data-focus-enemy="${escapeHTML(e.id)}" aria-label="Focus ${escapeHTML(e.name)}, ${e.hp} of ${e.maxHp} HP, lane ${lane+1}">
   <span class="foe">${e.name==='Mage'?'✧':e.name==='Archer'?'➶':'⚔'}</span><span class="combatant__meta"><b>${escapeHTML(e.name)}</b>${hpBar(e.hp,e.maxHp)}<small>${e.attack} ATK${e.web?' · '+e.web+' WEB':''}</small></span></button>`).join(''):'<span class="lane-empty">Clear</span>';
  return `<div class="lane ${enemies.some(e=>e.id===s.chainTargetId)?'lane--focused':''}">
   <div class="lane-name"><span>LANE ${lane+1}</span><small>${enemies.length} INVADER${enemies.length===1?'':'S'}</small></div>
   <div class="combatants"><div class="lane-side lane-side--ally">${friend}</div><span class="lane-arrow" aria-hidden="true">⚔</span><div class="lane-side lane-side--enemy">${foe}</div></div>
  </div>`;
 }).join('');
}
