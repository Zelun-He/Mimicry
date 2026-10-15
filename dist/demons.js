import {SUITS,SUIT_NAMES,RANK_NAMES,ENCOUNTERS,SIGILS,BASE_DAMAGE,HAND_LABELS,newBattle,restoreBattle,toggleCard,selectedCards,evaluateHand,discardSelected,attack,buySigil,advance,rest,handLimit} from './demons-engine.js';
const $=id=>document.getElementById(id),KEY='mimicry-demons-v1';
let state;try{state=restoreBattle(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{}
state??=newBattle();
let busy=false;
const symbols={fang:'✦',shell:'◆',bloom:'☾',venom:'♠'};
const art={fang:'⚔',shell:'♜',bloom:'❀',venom:'☠'};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function cardHTML(card){
 const on=state.selected.includes(card.id),rank=RANK_NAMES[card.rank]||card.rank;
 return '<button class="poker-card '+card.suit+(on?' chosen':'')+'" data-card="'+card.id+'" aria-pressed="'+on+'" aria-label="'+rank+' of '+SUIT_NAMES[card.suit]+'"><span class="card-topline"><b>'+rank+'</b><em>'+symbols[card.suit]+'</em></span><span class="card-creature">'+art[card.suit]+'</span><span class="card-mid">'+SUIT_NAMES[card.suit]+'</span><span class="card-bottomline"><b>'+rank+'</b><em>'+symbols[card.suit]+'</em></span></button>';
}
function render(){
 const foe=ENCOUNTERS[state.encounter],selected=selectedCards(state),preview=evaluateHand(selected,state.sigils);
 $('stage').textContent='CHAPTER I · '+foe.name.toUpperCase();
 $('stage-sub').textContent=foe.role+' · '+foe.trait;
 $('turn').textContent='HAND '+state.round;
 $('enemy-name').textContent=foe.name;
 $('enemy-role').textContent=foe.role;
 $('enemy-hp').textContent=state.enemyHp+' / '+foe.hp;
 $('enemy-health').style.width=(100*state.enemyHp/foe.hp)+'%';
 $('your-hp').textContent=state.hp+' / '+state.maxHp;
 $('your-health').style.width=(100*state.hp/state.maxHp)+'%';
 $('gold').textContent=state.gold;
 $('clock').textContent=state.enemyClock;
 $('discard-count').textContent=state.discardsLeft;
 $('hand-count').textContent=state.hand.length+' / '+handLimit(state);
 $('hand').innerHTML=state.hand.map(cardHTML).join('');
 $('preview-name').textContent=preview?.label||'Choose up to five cards';
 $('preview-damage').textContent=preview?preview.damage+' DAMAGE':'Build a poker hand to attack';
 $('selected-count').textContent=selected.length+' / 5 SELECTED';
 $('discard').disabled=busy||state.phase!=='battle'||!selected.length||!state.discardsLeft;
 $('attack').disabled=busy||state.phase!=='battle'||!selected.length;
 $('message').textContent=state.log;
 $('sigils').innerHTML=state.sigils.length?state.sigils.map(id=>'<span class="owned-sigil">'+SIGILS.find(s=>s.id===id).name+'</span>').join(''):'No sigils yet · defeat an enemy to gain upgrades';
 $('deck-count').textContent=state.deck.length+' draw · '+state.discard.length+' used';
 $('encounter-track').innerHTML=ENCOUNTERS.map((enemy,i)=>'<span class="'+(i===state.encounter?'active':i<state.encounter?'complete':'')+'">'+(i+1)+' · '+enemy.name+'</span>').join('');
 const over=state.phase!=='battle';$('overlay').hidden=!over;
 if(over){
  $('outcome-label').textContent=state.phase==='reward'?'ENEMY DEFEATED':state.phase==='won'?'FOREST CONQUERED':'YOUR MIMIC HAS FALLEN';
  $('outcome-title').textContent=state.phase==='reward'?'A feast worth remembering.':state.phase==='won'?'The forest belongs to you.':'The road grows quiet.';
  $('outcome-desc').textContent=state.phase==='reward'?'Collect an upgrade, recover your strength, and face the next adventurer.':state.log;
  $('shop').innerHTML=state.phase==='reward'?SIGILS.map(x=>'<button class="shop-item" data-buy="'+x.id+'" '+(state.sigils.includes(x.id)||state.gold<x.cost?'disabled':'')+'><b>'+x.name+'</b><small>'+x.desc+'</small><strong>'+x.cost+' GOLD</strong></button>').join(''):'';
  $('rest').hidden=state.phase!=='reward';
  $('continue').hidden=state.phase!=='reward';
  $('again').hidden=state.phase==='reward';
 }
 save();
}
$('hand').addEventListener('click',e=>{const node=e.target.closest('[data-card]');if(node&&toggleCard(state,node.dataset.card))render();});
$('attack').addEventListener('click',()=>{attack(state);render();});
$('discard').addEventListener('click',()=>{discardSelected(state);render();});
$('shop').addEventListener('click',e=>{const n=e.target.closest('[data-buy]');if(n&&buySigil(state,n.dataset.buy))render();});
$('continue').addEventListener('click',()=>{advance(state);render();});
$('rest').addEventListener('click',()=>{if(rest(state)){state.log='Recovered 22 HP.';render();}});
$('again').addEventListener('click',()=>{state=newBattle();render();});
$('restart').addEventListener('click',()=>{if(confirm('Start a new Mimicry run?')){state=newBattle();render();}});
$('how').addEventListener('click',()=>{$('help').showModal();});
$('close-help').addEventListener('click',()=>{$('help').close();});
window.addEventListener('keydown',e=>{
 if(e.target?.tagName==='INPUT'||document.querySelector('dialog[open]'))return;
 const number=Number(e.key);if(number>=1&&number<=9&&state.hand[number-1]){toggleCard(state,state.hand[number-1].id);render();}
 if(e.key==='Enter'&&state.phase==='battle'){$('attack').click();}
 if(e.key.toLowerCase()==='r'&&state.phase==='battle'){$('discard').click();}
});
render();
