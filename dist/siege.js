import {CARDS,FOUNDING_CARDS,STARTER_DECK,chainSlotCount} from './chain-engine.js';
import {MAX_MINIONS,MAX_LANE_MINIONS,MAX_BONES,liveMinions} from './swarm-engine.js';
import {CREATURES} from './creature-engine.js';
import {cardArt,cardRule,SUIT_STYLES} from './siege/card-art.js';
import {creatureCardArt} from './siege/creature-card-art.js';
import {FOREST_ENEMY_ROLES,enemyIntent} from './forest-enemies.js';
import {previewCardLink} from './siege/link-feedback.js';
import {renderForestHand,renderForestChain,renderForestPrediction,escapeHTML} from './siege/forest-hand.js';
import {cardVisualIdentity,payoffReady} from './siege/card-presentation.js';
import {renderShopCardPreview} from './siege/card-face.js';
import {createForestBattle,featuredInvader,damageSummary} from './siege/forest-renderer.js';
import {strategyFocus} from './siege/strategic-draw.js';
import {MUTATIONS,handSize,upgradeableCards,trainableUnits,cardPower} from './shop-engine.js';
import {ESSENCE_CAPACITY,ESSENCE_BY_ENEMY,ESSENCE_TRAITS,redrawLimit} from './assimilation-engine.js';
import {newSiege,restoreSiege,RAIDS,SPECIES,moveUnit,endTurn,devour,gnaw,reinforce,buyUpgrade,chooseEssence,queueCommand,unqueueCommand,redrawCommand,previewChain,previewRituals,targetChain,setSummonLane} from './siege-engine.js';
const $=id=>document.getElementById(id),KEY='mimicry-siege-v11';
const artCache=new Map();
const artFor=type=>{if(!artCache.has(type))artCache.set(type,creatureCardArt(type));return artCache.get(type);};
let state;
try{
 for(const key of [KEY,'mimicry-siege-v10','mimicry-siege-v9','mimicry-siege-v8','mimicry-siege-v7','mimicry-siege-v6','mimicry-siege-v5','mimicry-siege-v4','mimicry-siege-v3','mimicry-siege-v2']){
  const raw=localStorage.getItem(key);
  if(!raw)continue;
  state=restoreSiege(JSON.parse(raw));
  if(state)break;
 }
}catch{}
state??=newSiege();
let discardMode=false,busy=false,sound=false,audio=null;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
const battle=createForestBattle($('world'),{reducedMotion});

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
    isRare?'A new '+cardVisualIdentity(offer.cardType).role.toLowerCase()+' for your next draw. Review its effect below.':isTribal?'Pick a Goblin or Skeleton card to strengthen your swarm.':isExotic?'Discover a Spider, Slime, or Mimicling command.':mutation.description;
  const choices=isCard?cards:units;
  const selector=(isCard||isMonster)&&!offer.sold?`<label class="shop-select">${isCard?'Command to improve':'Defender to train'}<select data-shop-target>${choices.map(x=>`<option value="${x.id}">${isCard?`${CARDS[x.type].name} ${x.level?`+${x.level}`:''} · power ${cardPower(state,x)}`:`${x.name} · Lv${x.level} · ${x.attack} ATK`}</option>`).join('')}</select></label>`:(isTribal||isExotic)&&!offer.sold?`<label class='shop-select'>Choose a creature card<select data-shop-target>${offer.options.map(type=>`<option value='${type}'>${CARDS[type].tribe.toUpperCase()} · ${CARDS[type].name}</option>`).join('')}</select></label>`:'';
  const cannotBuy=offer.sold||state.gold<offer.cost||((isCard||isMonster)&&!choices.length)||
    ((isRare||isTribal||isExotic)&&state.deck.acquired.length>=12);
  const typeLabel=isCard?'CARD ENHANCEMENT':isMonster?'ARMY TRAINING':
    isRare?`${rare.rarity.toUpperCase()} · ${rare.suit.toUpperCase()} ${rare.rank||'★'}`:isTribal?'GOBLIN OR SKELETON':isExotic?'SPIDER · SLIME · MIMICLING':'MIMIC MUTATION';
  const extra=isRare?`<div class="shop-card-detail"><span>ONE NEW COMMAND</span><small>Next draw · ${STARTER_DECK.length+FOUNDING_CARDS.length+state.deck.acquired.length} currently owned</small></div>`:
   (isTribal||isExotic)?`<div class="shop-card-detail"><span>CHOOSE YOUR COMMAND</span><small>Use the selector below to view each card's rules and role.</small></div>`:'';
  const previewType=isRare?offer.cardType:(isTribal||isExotic)?(offer.sold?offer.purchasedType:offer.options[0]):null;
  const preview=previewType?`<div class="shop-offer__card-preview">${renderShopCardPreview(previewType,{artFor})}</div><span class="shop-offer__selected-name">PREVIEW · ${CARDS[previewType].name}</span>`:'';
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

function save(){
 try{localStorage.setItem(KEY,JSON.stringify({...state,animations:[]}));$('save-status').textContent='Progress saved on this device';}
 catch{$('save-status').textContent='Session progress only';}
}

function caption(message){$('battle-caption').textContent=message;}

function attackFocus(){
 const chosen=featuredInvader(state);
 return chosen&&chosen.alive?chosen:null;
}

function renderRoute(){
 $('route').innerHTML=RAIDS.map((raid,i)=>{
  const label=['Farmhand','Scouts','Militia','Hunters','Watchman'][i];
  return '<div class="route-step'+(i===state.raid?' active':i<state.raid?' done':'')+'"'+(i===state.raid?' aria-current="step"':'')+'>'+
  '<b>'+(i<state.raid?'✓':i===4?'♜':i+1)+'</b><span>'+label+'</span></div>';
 }).join('');
}

function renderTargets(){
 const focused=attackFocus();
 $('targets').innerHTML='<button type="button" class="target-btn'+(!state.chainTargetId?' active':'')+
  '" data-target="" '+(state.phase!=='battle'?'disabled':'')+'><span>◎</span><span><b>Auto</b><small>Weakest foe</small></span></button>'+
 state.enemies.filter(e=>e.alive).map(e=>{
  const role=FOREST_ENEMY_ROLES[e.name];
  const hint=escapeHTML(role?.description||'Attacks the chosen lane.');
  return '<button type="button" class="target-btn'+(e.id===focused?.id?' active':'')+
   (role?' special-enemy':'')+'" data-target="'+escapeHTML(e.id)+'" '+
   (state.phase!=='battle'?'disabled':'')+' title="'+hint+'"'+
   ' aria-label="Focus '+escapeHTML(e.name)+'. '+hint+'"'+
   ' aria-pressed="'+(e.id===focused?.id)+'"><span class="target-emblem">'+
   (role?role.icon:'⚔')+'</span><span><b>'+escapeHTML(e.name)+
   '</b><small>'+escapeHTML(role?.role||('Lane '+(e.lane+1)))+
   ' · L'+(e.lane+1)+'</small></span><span class="target-hp">'+
   e.hp+' HP</span></button>';
 }).join('');
}

function renderDefenders(){
 // Cards are the monster portraits; only readable tactical status goes beneath
 // the original Mimic-versus-adventurer battle.
 const badges=state.units.filter(u=>u.alive).map(u=>
  '<span class="ally-chip veteran-chip" title="'+escapeHTML(u.name)+' · Level '+u.level+
  ' · Lane '+(u.lane+1)+' · '+u.hp+'/'+u.maxHp+' HP">'+
  '<b>'+escapeHTML(u.name)+'</b><small>'+u.hp+'/'+u.maxHp+' HP · L'+(u.lane+1)+'</small></span>');
 // Different lanes are deliberately different groups: the player needs to
 // know where a mob is defending even though it has no board sprite.
 const groups=new Map();
 for(const minion of liveMinions(state)){
  const key=minion.species+':'+minion.lane;
  const group=groups.get(key)||{name:minion.name,lane:minion.lane,count:0};
  group.count++;
  groups.set(key,group);
 }
 for(const group of groups.values()){
  badges.push('<span class="ally-chip summon-chip" title="'+
   escapeHTML(group.name)+' formation · '+group.count+' summons · Lane '+(group.lane+1)+'">'+
   '<b>'+escapeHTML(group.name)+' ×'+group.count+'</b><small>L'+(group.lane+1)+'</small></span>');
 }
 $('defenders').innerHTML=badges.join('')||'<span class="ally-chip">No defenders remaining</span>';
}

function renderRoster(){
 $('roster').innerHTML=state.units.map(u=>
  '<article class="roster-card '+(u.alive?'':'dead')+'">'+
  '<span class="roster-role" aria-hidden="true">'+escapeHTML(SPECIES[u.species].name[0])+'</span><div>'+
  '<b>'+escapeHTML(u.name)+'</b><small>'+escapeHTML(SPECIES[u.species].role)+' · Level '+u.level+
  ' · '+u.hp+'/'+u.maxHp+' HP</small><small>'+u.attack+' ATK · '+u.kills+
  ' kills</small></div><label>LANE <select data-move="'+escapeHTML(u.id)+'" '+(state.phase!=='battle'||!u.alive?'disabled':'')+'>'+
  [0,1,2].map(l=>'<option value="'+l+'" '+(l===u.lane?'selected':'')+'>Lane '+(l+1)+'</option>').join('')+
  '</select></label></article>').join('');
 $('creature-bestiary').innerHTML=Object.entries(CREATURES).map(([species,creature])=>{
  const image={spider:'exotic-spider.svg','slime-bud':'exotic-slime.svg',mimicling:'exotic-mimicling.svg'}[species];
  return '<article class="creature-profile"><img width="54" height="54" src="./siege/'+image+
  '" alt="'+escapeHTML(creature.name)+' portrait"><div><strong>'+escapeHTML(creature.name)+'</strong>'+
  '<p>'+escapeHTML(creature.mechanic)+'</p></div></article>';
 }).join('');
}

function renderOverlay(){
 const pending=Boolean(state.pendingEssence);
 const visible=pending||state.phase!=='battle';
 $('outcome').hidden=!visible||busy;
 if(!visible)return;
 $('outcome-tag').textContent=pending?'THE KING MIMIC EVOLVES':state.phase==='reward'?'RAID REPELLED':state.phase==='won'?'FOREST EDGE COMPLETE':'THE CHEST IS BROKEN';
 $('outcome-title').textContent=pending?'Devour a new trait':state.phase==='reward'?'The Goblin Quartermaster':state.phase==='won'?'The forest is yours.':'Your dungeon has fallen.';
 $('outcome-copy').textContent=pending?'Choose one trait from your captured adventurer, or let it fade. You may carry up to three.':
  state.phase==='reward'?'Spend your gold on cards, creatures or upgrades. Then choose one free reinforcement to continue.':
  state.phase==='won'?'You defended the chest through all five encounters. Your deck and army survived the Forest Edge.':
  'Try again, link compatible ranks, summon disposable defenders and prepare your Devour.';
 const alive=state.units.filter(u=>u.alive).length;
 $('rewards').innerHTML=pending?essenceHTML():state.phase==='reward'?
  shopHTML()+'<div class="free-reward"><span class="eyebrow">CHOOSE ONE FREE REINFORCEMENT</span>'+
  '<button data-reward="rest">♡ REST · +8 HP to survivors, +5 integrity</button>'+
  '<button data-reward="train">✦ TRAIN · level up the weakest defender</button>'+
  (alive<5?'<button data-reward="recruit">♟ RECRUIT · add a veteran monster</button>':'')+'</div>':
  '<button data-reset class="primary">START A NEW SIEGE ↗</button>';
}

function render(){
 const focus=attackFocus(),locked=state.phase!=='battle'||!!state.pendingEssence;
 if(locked||state.deck.discardsLeft===0)discardMode=false;
 $('gold').textContent=state.gold;
 $('hunger').textContent=state.hunger;
 $('bones').textContent=state.bones;
 $('essence-count').textContent=state.essences.length+'/'+ESSENCE_CAPACITY;
 $('your-hp').textContent=state.integrity+' / '+state.maxIntegrity+' INTEGRITY';
 $('your-health').style.width=(100*state.integrity/state.maxIntegrity)+'%';
 $('enemy-name').textContent=focus?focus.name:'Road clear';
 $('enemy-role').textContent=focus?'Invader · Lane '+(focus.lane+1):'No enemies standing';
 $('enemy-hp').textContent=focus?focus.hp+' / '+focus.maxHp+' HP':'0 / 0 HP';
 $('enemy-health').style.width=focus?(100*focus.hp/focus.maxHp)+'%':'0%';
 $('turn').textContent='TURN '+state.turn;
 $('intent').textContent=enemyIntent(focus,state.enemies);
 $('poison').textContent=focus&&focus.poison?focus.poison+' poison on this enemy':'';
 renderRoute();renderTargets();renderDefenders();
 $('chain').innerHTML=renderForestChain(state);
 $('preview').innerHTML=renderForestPrediction(state);
 $('hand').innerHTML=renderForestHand(state,{artFor,ruleFor:cardRule,discardMode});
 resetCardInspection();
 $('redraw-count').textContent=state.deck.discardsLeft;
 $('redraw').disabled=busy||locked||!state.deck.discardsLeft||!state.deck.hand.length;
 $('redraw').setAttribute('aria-pressed',String(discardMode));
 $('redraw').classList.toggle('is-active',discardMode);
 $('hand-hint').textContent=discardMode?'DISCARD MODE · Click one card to replace it':'Start with 5 · +1 each turn · +2 per takedown · keep unused cards';
 $('hand').classList.toggle('is-discarding',discardMode);
 $('attack').disabled=busy||locked;
 $('attack').innerHTML=state.deck.chain.length?'PLAY CHAIN <span>↗</span>':'END TURN <span>↗</span>';
 $('clear').disabled=busy||locked||!state.deck.chain.length;
 $('summon-lane').value=String(state.summonLane);
 const chosen=previewChain(state);
 const endBoost=chosen.at(-1)?.boost||1;
 $('link-description').innerHTML='<b>LINK:</b> same school · same number · next number +1 · Hunger wild'+
  (chosen.length?' · <b>'+chosen.length+'/5 slots</b> · last link ×'+endBoost.toFixed(2):'');
 const hungry=focus&&focus.hp+(focus.armor||0)<=8;
 const finish=focus&&focus.hp+(focus.armor||0)<=25;
 $('gnaw').disabled=busy||locked||state.hunger<20||!focus;
 $('devour').disabled=busy||locked||state.hunger<100||!focus;
 $('gnaw').textContent=hungry?'GNAW · CAPTURE':'GNAW · 20';
 $('devour').textContent=finish?'DEVOUR · CAPTURE':'DEVOUR · 100';
 $('gnaw').title='Spend 20 Hunger to deal 8 damage. A killing bite absorbs a trait.';
 $('devour').title='Spend 100 Hunger to deal 25 damage. A killing bite absorbs a trait.';
 $('relics').innerHTML=state.essences.length?state.essences.map(id=>
  '<span class="relic-pill" title="'+escapeHTML(ESSENCE_TRAITS[id].description)+'">✦ '+escapeHTML(ESSENCE_TRAITS[id].name)+'</span>').join(''):
  'No stolen traits yet. Finish an enemy with Gnaw or Devour.';
 $('log').innerHTML=state.log.map(line=>'<div>'+escapeHTML(line)+'</div>').join('');
 $('deck-count').textContent=state.deck.hand.length+'/'+handSize(state)+' held · '+state.deck.draw.length+' draw · '+state.deck.discard.length+' discard'+(state.drawCredits?' · '+state.drawCredits+' banked':'');
 const focusPlan=strategyFocus(state);
 const focusNames={fang:'FANG',shell:'SHELL',bloom:'BLOOM',venom:'VENOM',hunger:'HUNGER'};
 const focusStage=['WIDE POOL','EXPLORING','LEANING IN','FOCUSED','SPECIALIZED'][focusPlan.stage];
 $('hand-hint').textContent=discardMode?'DISCARD MODE · Click one card to replace it':
  'Draw style: '+focusStage+(focusPlan.primary&&focusPlan.stage?' · '+focusNames[focusPlan.primary]+(focusPlan.secondary?' / '+focusNames[focusPlan.secondary]:''):' · all schools');

 renderRoster();renderOverlay();
 if(!busy)battle.setState(state);
 save();
}

function tone(freq=420,seconds=.065){
 if(!sound)return;
 try{
  audio??=new AudioContext();audio.resume();
  const osc=audio.createOscillator(),gain=audio.createGain();
  osc.type='triangle';osc.frequency.value=freq;
  gain.gain.setValueAtTime(.028,audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+seconds);
  osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+seconds);
 }catch{}
}

function resetCardInspection(){
 $('card-inspector').innerHTML='<strong>Inspect a card</strong>'+
  '<span class="inspect-help">Hover, focus, or tap a card to see its exact action and link.</span>';
}
function showCardInspection(id){
 const card=state.deck.hand.find(c=>c.id===id);
 if(!card)return;
 const def=CARDS[card.type],view=cardVisualIdentity(card.type);
 const hint=previewCardLink(state.deck,card),synergy=payoffReady(state,card.type);
 const link=state.deck.chain.length?(hint.legal?hint.explanation:'Cannot link: '+hint.explanation):
  'Any card can open a new chain.';
 $('card-inspector').innerHTML='<strong>'+escapeHTML(def.name)+'</strong>'+
  '<span>'+escapeHTML(view.main+' '+view.detail)+'</span>'+
  '<span class="inspect-synergy">'+escapeHTML(link)+'</span>'+
  (synergy?'<span class="inspect-synergy">✦ SYNERGY READY</span>':'');
}
function handleCard(id){
 if(busy||state.phase!=='battle'||state.pendingEssence)return;
 if(discardMode){
  if(redrawCommand(state,id)){discardMode=false;caption('You drew a new command.');tone(310);render();}
  return;
 }
 if(queueCommand(state,id)){
  const card=state.deck.chain.at(-1),def=CARDS[card.type];
  tone(335+def.rank*30);
  caption(def.name+' joins your chain. Choose another match or play it.');
  render();
 }else{
  const hint=previewCardLink(state.deck,id);
  caption(hint.explanation);
 }
}

function handleChain(id){
 if(busy||state.phase!=='battle'||state.pendingEssence)return;
 if(unqueueCommand(state,id)){tone(240);caption('Card returned to your hand.');render();}
}

function clearChain(){
 if(busy||state.phase!=='battle'||state.pendingEssence)return;
 for(const card of [...state.deck.chain].reverse())unqueueCommand(state,card.id);
 caption('Chain cleared. Try another combination.');
 render();
}

function toggleDiscard(){
 if(busy||state.phase!=='battle'||state.pendingEssence||state.deck.discardsLeft===0)return;
 discardMode=!discardMode;
 caption(discardMode?'Discard mode: choose one card to replace.':'Discard canceled.');
 render();
}

function selectEnemy(id){
 if(busy||state.phase!=='battle'||state.pendingEssence)return;
 if(targetChain(state,id||null)){caption(id?'Enemy focused. Your commands will target that adventurer.':'Target set to the weakest invader.');render();}
}

async function play(){
 if(busy||state.phase!=='battle'||state.pendingEssence)return;
 busy=true;const before=structuredClone(state),steps=previewChain(state);
 battle.setState(before);
 $('attack').disabled=true;
 $('redraw').disabled=true;
 if(!endTurn(state)){busy=false;render();return;}
 save();
 const events=[...state.animations];
 await battle.replay(steps,events,state,{onStep(step,i){
  $('chain').querySelectorAll('.chain-slot').forEach((node,index)=>node.classList.toggle('animating',i===index));
  caption(step.def.name+' · '+step.def.suit.toUpperCase()+' · '+(step.linked?'LINKED!':'ATTACK!'));
  tone(360+i*65,.07);
 }});
 busy=false;
 const damages=damageSummary(before,state),total=damages.reduce((sum,e)=>sum+e.damage,0);
 caption(state.phase==='reward'?'The adventurers flee. The Quartermaster arrives.':
  state.phase==='won'?'You defended the Forest Edge!':
  state.phase==='lost'?'The chest is broken. Your monsters have fallen.':
  'Your chain and defenders dealt '+total+' damage. '+state.log[0]);
 render();
}

async function useBite(which){
 if(busy||state.phase!=='battle'||state.pendingEssence)return;
 const before=structuredClone(state),name=which==='gnaw'?'Gnaw':'Devour';
 if(!(which==='gnaw'?gnaw(state):devour(state)))return;
 busy=true;save();battle.setState(before);
 await battle.replay([{def:{name,suit:'hunger',rank:'★'},linked:false}],state.animations,state,
  {onStep(){caption('The King Mimic lunges: '+name+'!');tone(260,.11);}});
 busy=false;
 caption(state.pendingEssence?'An essence has been captured! Choose a trait.':state.log[0]);
 render();
}

function reset(){
 if(busy)return;
 state=newSiege();discardMode=false;
 $('confirm').close();
 caption('That chest definitely wasn’t here yesterday.');
 render();save();
}

function attachEvents(){
 $('hand').addEventListener('click',event=>{
  const button=event.target.closest('button[data-card-id]');
  if(button)handleCard(button.dataset.cardId);
 });
 $('hand').addEventListener('mouseover',event=>{
  const button=event.target.closest('button[data-card-id]');
  if(!button||button.contains(event.relatedTarget))return;
  const hint=previewCardLink(state.deck,button.dataset.cardId);
  $('link-description').textContent=hint.legal?hint.label+' · '+hint.explanation:hint.explanation;
  showCardInspection(button.dataset.cardId);
 });
 $('hand').addEventListener('focusin',event=>{
  const button=event.target.closest('button[data-card-id]');
  if(!button)return;
  const hint=previewCardLink(state.deck,button.dataset.cardId);
  $('link-description').textContent=hint.label+' · '+hint.explanation;
  showCardInspection(button.dataset.cardId);
 });
 $('hand').addEventListener('mouseout',event=>{
  const button=event.target.closest('button[data-card-id]');
  if(button&&!button.contains(event.relatedTarget)){
   $('link-description').textContent='LINK: same school · same number · rank +1 · Hunger wild';
   resetCardInspection();
  }
 });
 $('chain').addEventListener('click',event=>{
  const button=event.target.closest('button[data-unqueue]');
  if(button)handleChain(button.dataset.unqueue);
 });
 $('targets').addEventListener('click',event=>{
  const button=event.target.closest('[data-target]');if(button)selectEnemy(button.dataset.target);
 });
 $('world').addEventListener('click',event=>{
  const rect=$('world').getBoundingClientRect();
  const x=(event.clientX-rect.left)*960/rect.width,y=(event.clientY-rect.top)*420/rect.height;
  const id=battle.hitTarget(x,y);if(id)selectEnemy(id);
 });
 $('summon-lane').addEventListener('change',event=>{if(setSummonLane(state,Number(event.target.value))){caption('New summons will enter lane '+(state.summonLane+1)+'.');render();}});
 $('roster').addEventListener('change',event=>{
  const select=event.target.closest('[data-move]');
  if(select&&moveUnit(state,select.dataset.move,Number(select.value)))render();
 });
 $('attack').addEventListener('click',play);
 $('clear').addEventListener('click',clearChain);
 $('redraw').addEventListener('click',toggleDiscard);
 $('gnaw').addEventListener('click',()=>useBite('gnaw'));
 $('devour').addEventListener('click',()=>useBite('devour'));
 $('rewards').addEventListener('change',event=>{
  const select=event.target.closest('[data-shop-target]'),offer=select?.closest('[data-shop-offer]');
  if(!offer||!['tribal','exotic'].includes(offer.dataset.shopOffer))return;
  const art=offer.querySelector('.shop-offer__card-preview'),label=offer.querySelector('.shop-offer__selected-name');
  if(CARDS[select.value]&&art&&label){art.innerHTML=renderShopCardPreview(select.value,{artFor});label.textContent='PREVIEW · '+CARDS[select.value].name;}
 });
 $('rewards').addEventListener('click',event=>{
  if(busy)return;
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.chooseEssence){
   if(chooseEssence(state,button.dataset.chooseEssence,$('essence-replace')?.value||null))render();
  }else if(button.hasAttribute('data-skip-essence')){
   if(chooseEssence(state,'skip'))render();
  }else if(button.dataset.buy){
   const offer=button.closest('[data-shop-offer]');
   if(buyUpgrade(state,button.dataset.buy,offer?.querySelector('[data-shop-target]')?.value||null))render();
  }else if(button.dataset.reward){
   if(reinforce(state,button.dataset.reward)){caption('The next raid approaches.');render();}
  }else if(button.hasAttribute('data-reset')){state=newSiege();caption('The forest grows hungry again.');render();}
 });
 $('log-toggle').addEventListener('click',()=>{
  $('log').hidden=!$('log').hidden;
  $('log-toggle').textContent=$('log').hidden?'Battle log ▾':'Battle log ▴';
 });
 $('details-toggle').addEventListener('click',()=>{
  $('details-panel').hidden=!$('details-panel').hidden;
  $('details-toggle').textContent=$('details-panel').hidden?'Manage army & creatures ▾':'Hide army & creatures ▴';
 });
 $('sound').addEventListener('click',()=>{
  sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';
  $('sound').setAttribute('aria-pressed',String(sound));if(sound)tone();
 });
 $('how').addEventListener('click',()=>$('help').showModal());
 $('close-help').addEventListener('click',()=>$('help').close());
 $('restart').addEventListener('click',()=>{if(!busy)$('confirm').showModal();});
 $('cancel-restart').addEventListener('click',()=>$('confirm').close());
 $('confirm-restart').addEventListener('click',reset);
 document.addEventListener('keydown',event=>{
  const el=document.activeElement;
  if(busy||event.repeat||event.ctrlKey||event.altKey||event.metaKey||
    document.querySelector('dialog[open]')||
    ['INPUT','TEXTAREA','SELECT'].includes(el?.tagName))return;
  if(/^[1-8]$/.test(event.key)){
   event.preventDefault();const card=state.deck.hand[Number(event.key)-1];
   if(card)handleCard(card.id);
  }else if(event.key==='Enter'&&el===document.body){event.preventDefault();play();}
  else if(event.key.toLowerCase()==='r'&&el===document.body){event.preventDefault();toggleDiscard();}
  else if(event.key==='Escape'){event.preventDefault();clearChain();}
  else if(event.key==='?'){$('help').showModal();}
 });
}

attachEvents();
caption(state.log[0]||'That chest definitely wasn’t here yesterday.');
render();
