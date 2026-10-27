import {
 SUITS,SUIT_NAMES,SUIT_SYMBOLS,SUIT_TO_SCHOOL,RANK_NAMES,RANK_SYMBOLS,ENCOUNTERS,SIGILS,newBattle,restoreBattle,
 toggleCard,selectedCards,evaluateHand,discardSelected,attack,buySigil,advance,sortHand,deckOverview,
 rest,handLimit
} from './demons-engine.js';
import {createForestBattle} from './siege/forest-renderer.js';
import {creatureCardArt,creatureCardIdentity} from './siege/creature-card-art.js';
import {SUIT_STYLES} from './siege/card-art.js';
import {escapeCardHTML} from './siege/card-face.js';

const $=id=>document.getElementById(id),KEY='mimicry-demons-v1';
let state;
try{state=restoreBattle(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{}
state??=newBattle();
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
const forest=createForestBattle($('world'),{reducedMotion:reduceMotion});
const ART={
 fang:['strike','blood','ambush','execute','frenzy','goblin-recruit','pack-attack','loot-fallen','sacrifice'],
 shell:['fortify','guard','thorns','counter','skeleton-recruit','bone-march','bone-wall','rattle-dead','tithe'],
 bloom:['mend','roots','regrow','symbiosis','harvest','slime-summon','gel-fusion'],
 venom:['bite','corrode','contagion','detonate','spider-summon','silken-prison']
};
const SPRITE_NAMES=['Farmhand','Scout','Guard','Mage','Watchman'];
const HAND_GUIDE=['High Card · only highest card scores','Pair · matching ranks · 2 scoring','Two Pair · 2 pairs · 4 scoring','Three of a Kind · 3 scoring','Straight · 5 sequential ranks','Flush · 5 of the same suit','Full House · three + two','Four of a Kind · 4 scoring','Straight Flush · 5 sequential cards of one suit','The Mimic’s Hand · 10, J, Q, K, A of one suit'];
let logOpen=false,guideOpen=false,deckViewOpen=false;
function escape(s){return escapeCardHTML(s);}
function sceneState(){
 const foe=ENCOUNTERS[state.encounter];
 return {raid:state.encounter,chainTargetId:null,enemies:[{
  id:'e'+state.encounter+'-0',name:SPRITE_NAMES[state.encounter],lane:1,
  hp:state.enemyHp,maxHp:foe.hp,alive:state.enemyHp>0,poison:0,web:0
 }]};
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state));$('save-status').textContent='Progress saved on this device';}
 catch{$('save-status').textContent='Progress saved for this session only';}
}
function artType(card){
 const school=SUIT_TO_SCHOOL[card.suit],candidates=ART[school];
 const court={11:{hearts:'symbiosis',diamonds:'spider-summon',clubs:'skeleton-recruit',spades:'goblin-recruit'},
  12:{hearts:'harvest',diamonds:'silken-prison',clubs:'tithe',spades:'ambush'},
  13:{hearts:'slime-summon',diamonds:'detonate',clubs:'bone-march',spades:'pack-attack'},
  14:{hearts:'feast',diamonds:'mirror',clubs:'decree',spades:'execute'}};
 return court[card.rank]?.[card.suit]||candidates[(card.rank-2)%candidates.length];
}
// The front of each card follows a real playing-card silhouette: two opposing
// corner indices surrounding a single large illustration. Tactical copy belongs
// in the hand preview/inspector, never repeated on the card itself.
function cardHTML(card){
 const type=artType(card),school=SUIT_TO_SCHOOL[card.suit],style=SUIT_STYLES[school];
 const rank=RANK_SYMBOLS[card.rank]||String(card.rank);
 const suit=SUIT_SYMBOLS[card.suit],label=RANK_NAMES[card.rank]||String(card.rank);
 const active=state.selected.includes(card.id),selectedOrder=state.selected.indexOf(card.id)+1;
 const score=evaluateHand(selectedCards(state),state.sigils,state.round-1);
 const unused=active&&score?.unusedIds.includes(card.id);
 const critical=card.critical===true;
 // Intrinsic card-art SVGs are wide; crop their decorative side margins
 // rather than letterboxing the illustration or stretching character sprites.
 const illustration=creatureCardArt(type).replace('<svg class="card-art"','<svg preserveAspectRatio="xMidYMid slice" class="card-art"');
 const illustratedCreature=Boolean(creatureCardIdentity(type));
 const category={spades:'attack',clubs:'defense',hearts:'recovery',diamonds:'finisher'}[card.suit];
 const index='<span class="playing-index" aria-hidden="true"><strong>'+rank+'</strong><span>'+suit+'</span></span>';
 return '<button type="button" class="card premium-card poker-card '+school+' suit-'+card.suit+
  ' card-'+category+(critical?' is-critical':'')+(active?' is-selected':' playable')+
  (unused?' is-unscored':'')+'" style="--suit:'+style.ink+';--school-ink:'+style.ink+
  '" data-card="'+escape(card.id)+'" data-school="'+school+'" data-suit="'+card.suit+
  '" aria-pressed="'+active+'" aria-label="'+escape(label)+' of '+escape(SUIT_NAMES[card.suit])+
  (critical?', critical card':'')+(unused?', unscored in selection':'')+(active?', selected '+selectedOrder:'')+'">'+
  '<span class="playing-art '+(illustratedCreature?'playing-art--creature':'playing-art--engraving')+'" aria-hidden="true">'+illustration+'</span>'+
  '<span class="playing-index-corner playing-index-top">'+index+'</span>'+
  '<span class="playing-index-corner playing-index-bottom">'+index+'</span>'+
  (critical?'<span class="playing-critical" aria-hidden="true" title="Critical card">✦</span>':'')+
  (active?'<span class="playing-selected" aria-hidden="true">'+selectedOrder+'</span>':'')+
  '</button>';
}
function renderSelected(){
 const picked=selectedCards(state);
 const score=evaluateHand(picked,state.sigils,state.round-1);
 $('chain').innerHTML=Array.from({length:5},(_,i)=>{
  const c=picked[i];
  if(!c)return '<div class="chain-slot poker-slot" aria-label="Empty selection slot '+(i+1)+'">'+(i+1)+'</div>';
  const school=SUIT_TO_SCHOOL[c.suit],symbol=SUIT_SYMBOLS[c.suit];
  const scored=score.contributingIds.includes(c.id);
  return '<button type="button" class="chain-slot poker-slot filled '+school+
   (scored?'':' poker-slot-unscored')+'" style="--suit:'+SUIT_STYLES[school].ink+
   '" data-unselect="'+escape(c.id)+'" aria-label="Remove '+c.rank+' of '+escape(SUIT_NAMES[c.suit])+
   '"><span class="order">'+(i+1)+'</span>'+
   '<span class="chain-symbol">'+symbol+'</span><span class="chain-rank">'+(RANK_SYMBOLS[c.rank]||c.rank)+
   '</span><span class="chain-name">'+(scored?'SCORES':'DISCARDED')+'</span></button>';
 }).join('');
}
function renderDeckOverview(){
 const counts=deckOverview(state);
 $('deck-overview').hidden=!deckViewOpen;
 $('deck-toggle').setAttribute('aria-expanded',String(deckViewOpen));
 if(!deckViewOpen)return;
 $('deck-overview').innerHTML='<span class="eyebrow">52-CARD DECK · DRAW / HAND / USED</span>'+
 SUITS.map(suit=>'<div class="deck-overview-row"><b>'+SUIT_SYMBOLS[suit]+' '+SUIT_NAMES[suit]+'</b>'+
  Array.from({length:13},(_,i)=>{const rank=i+2;
   const where=counts.held[suit][rank]?'IN HAND':counts.remaining[suit][rank]?'DRAW':'USED';
   return '<span class="deck-pip '+where.toLowerCase().replace(' ','-')+'" title="'+where+'">'+
    (RANK_SYMBOLS[rank]||rank)+SUIT_SYMBOLS[suit]+'</span>';
  }).join('')+'</div>').join('');
}
function renderReward(){
 const reward=state.phase==='reward',won=state.phase==='won';
 $('outcome').hidden=state.phase==='battle';
 if(state.phase==='battle')return;
 $('outcome-tag').textContent=reward?'FOREST RAID REPELLED':won?'THE FOREST IS YOURS':'THE CHEST HAS FALLEN';
 $('outcome-title').textContent=reward?'The Goblin Quartermaster':won?'Your dungeon survived every raid.':'Your mimic has been defeated.';
 $('outcome-copy').textContent=reward?'Choose sigils to improve your poker hands, recover your strength, then face the next visitor.':state.log;
 const offers=reward?SIGILS.map(s=>'<button type="button" class="poker-shop-item" data-buy="'+s.id+'"'+
  (state.sigils.includes(s.id)||state.gold<s.cost||state.sigils.length>=6?' disabled':'')+'>'+
  '<b>'+escape(s.name)+'</b><small>'+escape(s.desc)+'</small><strong>'+s.cost+' GOLD</strong></button>').join(''):'';
 $('rewards').innerHTML=offers+
  '<div class="poker-reward-actions" style="grid-column:1/-1">'+
  (reward?'<button type="button" class="secondary" data-rest'+(state.rested?' disabled':'')+'>Rest · +22 HP</button>'+
   '<button type="button" class="primary" data-next>Next encounter ↗</button>':
   '<button type="button" class="primary" data-restart>New run ↗</button>')+'</div>';
}
function render(){
 const foe=ENCOUNTERS[state.encounter];
 const selection=selectedCards(state),score=evaluateHand(selection,state.sigils,state.round-1);
 $('gold').textContent=String(state.gold);
 $('discard-count').textContent=String(state.discardsLeft);
 $('sigil-count').textContent=String(state.sigils.length);
 $('redraw-count').textContent=String(state.discardsLeft);
 $('turn').textContent='HAND '+state.round;
 $('clock').textContent=String(state.enemyClock);
 $('enemy-name').textContent=foe.name;
 $('enemy-role').textContent=foe.role;
 $('enemy-hp').textContent=state.enemyHp+' / '+foe.hp+' HP';
 $('enemy-health').style.width=100*state.enemyHp/foe.hp+'%';
 $('your-hp').textContent=state.hp+' / '+state.maxHp+' HP';
 $('your-health').style.width=100*state.hp/state.maxHp+'%';
 $('intent').textContent=foe.attack+' DAMAGE IN '+state.enemyClock+' HAND'+(state.enemyClock===1?'':'S');
 $('enemy-trait').textContent=foe.trait+' · '+foe.effect;
 $('battle-caption').textContent=state.log;
 $('route').innerHTML=ENCOUNTERS.map((x,i)=>'<div class="route-step'+
  (i===state.encounter?' active':i<state.encounter?' done':'')+'"><b>'+
  (i<state.encounter?'✓':i===ENCOUNTERS.length-1?'♜':i+1)+'</b><span>'+escape(x.name)+'</span></div>').join('');
 $('targets').innerHTML='<span class="ally-chip"><b>'+escape(foe.name)+'</b><small>'+state.enemyHp+' / '+foe.hp+' HP</small></span>'+
 '<span class="ally-chip"><b>Next strike</b><small>'+state.enemyClock+' played hands</small></span>';
 $('defenders').innerHTML='<span class="ally-chip veteran-chip"><b>Splinter</b><small>'+state.hp+' / '+state.maxHp+' HP</small></span>'+
 '<span class="ally-chip"><b>Selected</b><small>'+selection.length+' / 5 cards</small></span>'+
 '<span class="ally-chip"><b>Sigils</b><small>'+state.sigils.length+' collected</small></span>';
 $('selected-count').textContent=selection.length+' / 5 SELECTED';
 renderSelected();
 $('preview').innerHTML=score?
  '<span class="poker-preview-name"><strong>'+escape(score.label)+'</strong><small>'+score.contributingIds.length+' scoring · '+score.unusedIds.length+' discarded'+(score.criticalCount?' · '+score.criticalCount+' critical':'')+'</small></span>'+
  '<span class="poker-preview-damage">'+score.damage+' DAMAGE</span>':
  '<span class="poker-preview-name"><strong>Choose a hand</strong><small>Select up to 5 cards for an attack</small></span>';
 $('hand').innerHTML=state.hand.map(cardHTML).join('');
 $('hand-hint').textContent=handLimit(state)+' cards · choose up to 5 · '+state.discardsLeft+' redraws · Space attack · S discard · Q sort';
 $('deck-count').textContent=state.deck.length+' draw · '+state.discard.length+' used';
 $('sort').textContent='SORT: '+state.sortMode.toUpperCase();
 renderDeckOverview();
 $('clear').disabled=state.phase!=='battle'||!state.selected.length;
 $('redraw').disabled=state.phase!=='battle'||!selection.length||!state.discardsLeft;
 $('attack').disabled=state.phase!=='battle'||!selection.length;
 $('relics').innerHTML=state.sigils.length?state.sigils.map(id=>{
  const sigil=SIGILS.find(x=>x.id===id);
  return '<span class="relic-pill" title="'+escape(sigil.desc)+'">✦ '+escape(sigil.name)+'</span>';
 }).join(''):'No sigils collected. Defeat an invader to visit the Quartermaster.';
 $('hand-guide').innerHTML=HAND_GUIDE.map(label=>'<span>'+escape(label)+'</span>').join('');
 $('details-panel').hidden=!guideOpen;
 $('log').hidden=!logOpen;
 $('log').textContent='Last action: '+state.log;
 renderReward();
 forest.setState(sceneState());
 save();
}
function cardClicked(id){if(toggleCard(state,id))render();}
$('hand').addEventListener('click',event=>{
 const element=event.target.closest('[data-card]');
 if(element)cardClicked(element.dataset.card);
});
// The cards themselves are intentionally free of rules text; disclose details
// only through the existing inspector on hover OR keyboard focus.
function inspectCard(event){
 const el=event.target.closest?.('[data-card]');if(!el)return;
 const card=state.hand.find(c=>c.id===el.dataset.card);if(!card)return;
 $('card-inspector').innerHTML='<strong>'+(RANK_SYMBOLS[card.rank]||card.rank)+' '+SUIT_SYMBOLS[card.suit]+
  ' · '+escape(RANK_NAMES[card.rank]||card.rank)+' of '+escape(SUIT_NAMES[card.suit])+'</strong>'+
  (card.critical?'<span class="inspect-help">Critical card · +25% damage when it scores.</span>':
   '<span class="inspect-help">Select matching ranks or build a straight or flush.</span>');
}
$('hand').addEventListener('pointerover',inspectCard);
$('hand').addEventListener('focusin',inspectCard);
$('chain').addEventListener('click',event=>{const b=event.target.closest('[data-unselect]');if(b)cardClicked(b.dataset.unselect);});
$('clear').addEventListener('click',()=>{state.selected=[];render();});
$('sort').addEventListener('click',()=>{sortHand(state);render();});
$('deck-toggle').addEventListener('click',()=>{deckViewOpen=!deckViewOpen;render();});
$('redraw').addEventListener('click',()=>{if(discardSelected(state))render();});
$('attack').addEventListener('click',()=>{
 const cards=selectedCards(state);if(!cards.length)return;
 const outcome=attack(state);if(!outcome)return;
 forest.triggerCard({def:{suit:SUIT_TO_SCHOOL[cards[0].suit]}});
 render();
});
$('rewards').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.buy){if(buySigil(state,button.dataset.buy))render();return;}
 if(button.hasAttribute('data-rest')){
  if(rest(state)){state.log='The Mimic rests and recovers 22 HP.';render();}
 }
 if(button.hasAttribute('data-next')){if(advance(state))render();}
 if(button.hasAttribute('data-restart')){state=newBattle();render();}
});
$('how').addEventListener('click',()=>{$('help').showModal();});
$('close-help').addEventListener('click',()=>{$('help').close();});
$('restart').addEventListener('click',()=>{$('confirm').showModal();});
$('cancel-restart').addEventListener('click',()=>{$('confirm').close();});
$('confirm-restart').addEventListener('click',()=>{state=newBattle();$('confirm').close();render();});
$('details-toggle').addEventListener('click',()=>{guideOpen=!guideOpen;render();});
$('log-toggle').addEventListener('click',()=>{logOpen=!logOpen;render();});
window.addEventListener('keydown',event=>{
 if(event.target?.closest?.('input,textarea,select')||document.querySelector('dialog[open]'))return;
 const n=Number(event.key);
 if(Number.isInteger(n)&&n>=1&&n<=9&&state.hand[n-1])cardClicked(state.hand[n-1].id);
 else if(event.key==='Enter'||event.code==='Space'||event.key===' '){event.preventDefault?.();$('attack').click();}
 else if(event.key.toLowerCase()==='r'||event.key.toLowerCase()==='s')$('redraw').click();
 else if(event.key.toLowerCase()==='q')$('sort').click();
 else if(event.key==='Escape'){state.selected=[];render();}
});
render();
