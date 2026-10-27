import {
 SUITS,SUIT_NAMES,RANK_NAMES,ENCOUNTERS,SIGILS,newBattle,restoreBattle,
 toggleCard,selectedCards,evaluateHand,discardSelected,attack,buySigil,advance,
 rest,handLimit
} from './demons-engine.js';
import {createForestBattle} from './siege/forest-renderer.js';
import {creatureCardArt} from './siege/creature-card-art.js';
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
const HAND_GUIDE=['Pair · 2 matching ranks','Two Pair · 2 pairs','Three of a Kind · 3 matching','Straight · 5 in sequence','Flush · 5 of one school','Full House · 3 + 2','Four of a Kind · 4 matching','Straight Flush · 5 sequential, one school','The Mimic’s Hand · 10 through Crown, one school'];
let logOpen=false,guideOpen=false,restedAt=-1;
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
 const candidates=ART[card.suit];return candidates[(card.rank-2)%candidates.length];
}
function cardHTML(card){
 const type=artType(card),style=SUIT_STYLES[card.suit];
 const label=RANK_NAMES[card.rank]||String(card.rank),active=state.selected.includes(card.id);
 const selectedOrder=state.selected.indexOf(card.id)+1;
 const svg=creatureCardArt(type);
 return '<button type="button" class="card premium-card poker-card '+card.suit+
  ' card-'+({fang:'attack',shell:'defense',bloom:'recovery',venom:'finisher'}[card.suit])+' '+(active?'is-selected':'playable')+'" data-card="'+escape(card.id)+
  '" data-school="'+card.suit+'" aria-pressed="'+active+'" aria-label="'+escape(label)+' of '+escape(SUIT_NAMES[card.suit])+
  (active?', selected '+selectedOrder:'')+'">'+
  '<span class="card-top"><span class="card-rank">'+card.rank+'<small>RANK</small></span>'+
  '<span class="card-top-right"><span class="card-symbol">'+style.symbol+'<small>'+style.name+'</small></span></span></span>'+
  '<span class="card-identity"><span class="card-type">'+escape(SUIT_NAMES[card.suit])+' · '+escape(label)+'</span>'+
  '<span class="card-name">'+escape(SUIT_NAMES[card.suit])+' '+card.rank+'</span></span>'+
  '<span class="card-portrait">'+svg+'</span>'+
  '<span class="card-effect"><strong class="card-effect-primary">'+escape(label)+' of '+escape(SUIT_NAMES[card.suit])+'</strong>'+
  '<span class="card-effect-secondary">Combine ranks and schools for a stronger hand.</span></span>'+
  '<span class="card-keywords"><span class="card-keyword">POKER</span>'+
  '<span class="card-keyword">'+escape(SUIT_NAMES[card.suit].toUpperCase())+'</span></span>'+
  '<span class="card-link"><span class="card-role">'+(active?'SELECTED '+selectedOrder:'CHOOSE CARD')+'</span>'+
  '<span class="card-link-status">'+(active?'✓':style.symbol)+'</span></span></button>';
}
function renderSelected(){
 $('chain').innerHTML=Array.from({length:5},(_,i)=>{
  const c=selectedCards(state)[i];
  if(!c)return '<div class="chain-slot poker-slot" aria-label="Empty selection slot '+(i+1)+'">'+(i+1)+'</div>';
  return '<button type="button" class="chain-slot poker-slot filled '+c.suit+
   '" style="--suit:'+SUIT_STYLES[c.suit].ink+'" data-unselect="'+escape(c.id)+'" aria-label="Remove '+c.rank+
   ' of '+escape(SUIT_NAMES[c.suit])+'"><span class="order">'+(i+1)+'</span>'+
   '<span class="chain-symbol">'+SUIT_STYLES[c.suit].symbol+'</span><span class="chain-rank">'+c.rank+
   '</span><span class="chain-name">'+escape(SUIT_NAMES[c.suit])+'</span></button>';
 }).join('');
}
function renderReward(){
 const reward=state.phase==='reward',won=state.phase==='won',lost=state.phase==='lost';
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
  (reward?'<button type="button" class="secondary" data-rest'+(restedAt===state.encounter?' disabled':'')+'>Rest · +22 HP</button>'+
   '<button type="button" class="primary" data-next>Next encounter ↗</button>':
   '<button type="button" class="primary" data-restart>New run ↗</button>')+'</div>';
}
function render(){
 const foe=ENCOUNTERS[state.encounter];
 const selection=selectedCards(state),score=evaluateHand(selection,state.sigils);
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
 $('enemy-trait').textContent=foe.trait;
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
  '<span class="poker-preview-name"><strong>'+escape(score.label)+'</strong><small>'+selection.length+' selected</small></span>'+
  '<span class="poker-preview-damage">'+score.damage+' DAMAGE</span>':
  '<span class="poker-preview-name"><strong>Choose a hand</strong><small>Select up to 5 cards for an attack</small></span>';
 $('hand').innerHTML=state.hand.map(cardHTML).join('');
 $('hand-hint').textContent='8 cards · choose up to 5 · '+state.discardsLeft+' redraws remaining';
 $('deck-count').textContent=state.deck.length+' draw · '+state.discard.length+' used';
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
$('hand').addEventListener('pointerover',event=>{
 const el=event.target.closest('[data-card]');if(!el)return;
 const card=state.hand.find(c=>c.id===el.dataset.card);if(!card)return;
 $('card-inspector').innerHTML='<strong>'+escape(RANK_NAMES[card.rank]||card.rank)+' of '+
  escape(SUIT_NAMES[card.suit])+'</strong><span class="inspect-help">Rank '+card.rank+
  ' · '+escape(SUIT_NAMES[card.suit])+' school · choose matching numbers or five matching schools.</span>';
});
$('chain').addEventListener('click',event=>{const b=event.target.closest('[data-unselect]');if(b)cardClicked(b.dataset.unselect);});
$('clear').addEventListener('click',()=>{state.selected=[];render();});
$('redraw').addEventListener('click',()=>{if(discardSelected(state))render();});
$('attack').addEventListener('click',()=>{
 const cards=selectedCards(state);if(!cards.length)return;
 const outcome=attack(state);if(!outcome)return;
 forest.triggerCard({def:{suit:cards[0].suit}});
 render();
});
$('rewards').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.buy){if(buySigil(state,button.dataset.buy))render();return;}
 if(button.hasAttribute('data-rest')&&restedAt!==state.encounter){
  if(rest(state)){restedAt=state.encounter;state.log='The Mimic rests and recovers 22 HP.';render();}
 }
 if(button.hasAttribute('data-next')){if(advance(state)){restedAt=-1;render();}}
 if(button.hasAttribute('data-restart')){state=newBattle();restedAt=-1;render();}
});
$('how').addEventListener('click',()=>{$('help').showModal();});
$('close-help').addEventListener('click',()=>{$('help').close();});
$('restart').addEventListener('click',()=>{$('confirm').showModal();});
$('cancel-restart').addEventListener('click',()=>{$('confirm').close();});
$('confirm-restart').addEventListener('click',()=>{state=newBattle();restedAt=-1;$('confirm').close();render();});
$('details-toggle').addEventListener('click',()=>{guideOpen=!guideOpen;render();});
$('log-toggle').addEventListener('click',()=>{logOpen=!logOpen;render();});
window.addEventListener('keydown',event=>{
 if(event.target?.closest?.('input,textarea,select')||document.querySelector('dialog[open]'))return;
 const n=Number(event.key);
 if(Number.isInteger(n)&&n>=1&&n<=9&&state.hand[n-1])cardClicked(state.hand[n-1].id);
 else if(event.key==='Enter')$('attack').click();
 else if(event.key.toLowerCase()==='r')$('redraw').click();
 else if(event.key==='Escape'){state.selected=[];render();}
});
render();
