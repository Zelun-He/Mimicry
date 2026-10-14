import test from 'node:test';
import assert from 'node:assert/strict';
import {newSiege,RAIDS,endTurn,reinforce,devour,targetChain,chooseEssence,restoreSiege,
 queueCommand,redrawCommand,moveUnit,buyUpgrade} from '../dist/siege-engine.js';
import {ESSENCE_CAPACITY,ESSENCE_BY_ENEMY,ESSENCE_TRAITS,hasEssence,killGold,redrawLimit,hungerCost} from '../dist/assimilation-engine.js';
import {validateDeck} from '../dist/chain-engine.js';

const rng=()=>0.5;
function capture(s,index=0){
 const foe=s.enemies[index];assert.ok(foe?.alive);
 foe.hp=Math.min(foe.hp,20);
 s.hunger=100;
 assert.equal(targetChain(s,foe.id),true);
 assert.equal(devour(s,rng),true);
 assert.equal(s.hunger,0);
 assert.equal(foe.alive,false);
 return foe;
}
function arrange(s,types){
 const available=[...s.deck.draw,...s.deck.discard,...s.deck.hand,...s.deck.chain];
 const hand=types.map(type=>{
  const i=available.findIndex(card=>card.type===type);
  assert.ok(i>=0,'missing '+type);
  return available.splice(i,1)[0];
 });
 s.deck.draw=available;s.deck.discard=[];s.deck.hand=hand;s.deck.chain=[];
 for(const card of [...hand])assert.equal(queueCommand(s,card.id),true);
}
function clearAndAdvance(s){
 for(const enemy of s.enemies){enemy.hp=0;enemy.alive=false;}
 assert.equal(endTurn(s,rng),true);
 assert.equal(s.phase,'reward');
 assert.equal(reinforce(s,'rest'),true);
}
function compareEffect(trait,types,configure=()=>{},read=s=>s.enemies[0].hp){
 const ordinary=newSiege(rng);
 arrange(ordinary,types);
 ordinary.units.forEach(u=>u.lane=2);
 configure(ordinary);
 const inherited=structuredClone(ordinary);
 inherited.essences=[trait];
 endTurn(ordinary,rng);endTurn(inherited,rng);
 return {ordinary:read(ordinary),inherited:read(inherited),ordinaryState:ordinary,inheritedState:inherited};
}
test('every invader archetype has exactly two distinct, described essence choices',()=>{
 assert.equal(ESSENCE_CAPACITY,3);
 assert.equal(Object.keys(ESSENCE_BY_ENEMY).length,8);
 assert.equal(Object.keys(ESSENCE_TRAITS).length,16);
 for(const raid of RAIDS)for(const enemy of raid.enemies){
  const choices=ESSENCE_BY_ENEMY[enemy.name];assert.equal(choices.length,2);
  assert.notEqual(choices[0],choices[1]);
  for(const id of choices){
   assert.equal(ESSENCE_TRAITS[id].enemy,enemy.name);
   assert.ok(ESSENCE_TRAITS[id].description.length>20);
  }
 }
});
test('Devour requires 100 Hunger; a nonlethal bite never captures essence',()=>{
 const s=newSiege(rng);
 assert.equal(devour(s,rng),false);
 s.hunger=100;s.enemies[0].armor=30;
 const hp=s.enemies[0].hp;
 assert.equal(devour(s,rng),true);
 assert.equal(s.enemies[0].hp,hp);
 assert.equal(s.pendingEssence,null);
 assert.deepEqual(s.essences,[]);
 assert.equal(s.hunger,0);
 assert.ok(restoreSiege(structuredClone(s)));
});
test('focus controls the precise prey and a lethal bite pauses combat for a two-choice capture',()=>{
 const s=newSiege(rng);
 const farmhand=s.enemies[0],forager=s.enemies[1];
 assert.equal(targetChain(s,forager.id),true);
 s.hunger=100;
 assert.equal(devour(s,rng),true);
 assert.equal(forager.alive,false);assert.equal(farmhand.alive,true);
 assert.deepEqual(s.pendingEssence,{enemyId:forager.id,enemyType:'Forager'});
 assert.equal(s.gold,5);
 assert.equal(endTurn(s,rng),false);
 assert.equal(devour(s,rng),false);
 assert.equal(moveUnit(s,'u1',2),false);
 assert.equal(targetChain(s,farmhand.id),false);
 assert.equal(queueCommand(s,s.deck.hand[0].id),false);
 assert.equal(redrawCommand(s,s.deck.hand[0].id,rng),false);
 assert.ok(restoreSiege(structuredClone(s)));
});
test('player can explicitly skip a captured trait and immediately resume combat',()=>{
 const s=newSiege(rng);capture(s);
 assert.equal(chooseEssence(s,'not-a-trait'),false);
 assert.equal(chooseEssence(s,'skip','something'),false);
 assert.equal(chooseEssence(s,'skip'),true);
 assert.equal(s.pendingEssence,null);
 assert.equal(s.essences.length,0);
 assert.equal(s.essenceHistory.length,0);
 assert.equal(moveUnit(s,'u1',2),true);
 assert.equal(chooseEssence(s,'skip'),false);
});
test('choosing either enemy-specific trait is free, persistent, and recorded once',()=>{
 const s=newSiege(rng);const prey=capture(s);
 const gold=s.gold;
 assert.equal(chooseEssence(s,'shield-drill'),false);
 assert.equal(chooseEssence(s,'straw-ward','copper-purse'),false);
 assert.equal(chooseEssence(s,'copper-purse'),true);
 assert.equal(s.gold,gold);
 assert.deepEqual(s.essences,['copper-purse']);
 assert.equal(s.essenceHistory.length,1);
 assert.deepEqual(s.essenceHistory[0],{traitId:'copper-purse',enemyId:prey.id,raid:0,replaced:null});
 assert.equal(chooseEssence(s,'straw-ward'),false);
 assert.ok(restoreSiege(structuredClone(s)));
});
test('the last devoured enemy creates the shop but captures must be resolved before purchases',()=>{
 const s=newSiege(rng);
 s.enemies[0].alive=false;s.enemies[0].hp=0;
 const prey=capture(s,1);
 assert.equal(prey.name,'Forager');
 assert.equal(s.phase,'reward');
 assert.equal(s.shopOffers.length,4);
 assert.equal(buyUpgrade(s,'card',s.deck.hand[0].id),false);
 assert.equal(reinforce(s,'rest'),false);
 assert.ok(restoreSiege(structuredClone(s)));
 assert.equal(chooseEssence(s,'herbal-gut'),true);
 assert.equal(s.pendingEssence,null);
 assert.equal(reinforce(s,'rest'),true);
 assert.equal(s.raid,1);
 assert.ok(restoreSiege(structuredClone(s)));
});
test('three slots require deliberate replacement; history replays all four captures',()=>{
 const s=newSiege(rng);
 capture(s,0);assert.equal(chooseEssence(s,'straw-ward'),true);
 clearAndAdvance(s); // Scouts
 capture(s,0);assert.equal(chooseEssence(s,'opening-gambit'),true);
 clearAndAdvance(s); // Guards
 capture(s,0);assert.equal(chooseEssence(s,'shield-drill'),true);
 assert.equal(s.essences.length,3);
 clearAndAdvance(s); // Rogue, Mage
 capture(s,0);
 assert.equal(chooseEssence(s,'sticky-fingers'),false);
 assert.equal(chooseEssence(s,'sticky-fingers','invalid'),false);
 assert.equal(chooseEssence(s,'sticky-fingers','opening-gambit'),true);
 assert.deepEqual(s.essences,['straw-ward','shield-drill','sticky-fingers']);
 assert.equal(s.essenceHistory.length,4);
 assert.equal(s.essenceHistory[3].replaced,'opening-gambit');
 assert.ok(restoreSiege(structuredClone(s)));
});
test('tampered inventory, history, duplicate origins, and pending prey are rejected by saves',()=>{
 const s=newSiege(rng);capture(s);assert.equal(chooseEssence(s,'straw-ward'),true);
 const scenarios=[
  v=>v.essences.push('copper-purse'),
  v=>v.essences.push('invalid-trait'),
  v=>v.essenceHistory[0].enemyId='e4-0',
  v=>v.essenceHistory[0].traitId='witchfire',
  v=>v.essenceHistory.push({...v.essenceHistory[0]}),
  v=>v.essenceHistory[0].replaced='copper-purse',
  v=>v.pendingEssence={enemyId:'e0-1',enemyType:'Forager'},
  v=>v.essences=['wild-pockets','herbal-gut','witchfire','deadeye']
 ];
 for(const tamper of scenarios){
  const v=structuredClone(s);tamper(v);
  assert.equal(restoreSiege(v),null);
 }
});
test('save migration from v5 preserves the deck, gold, and offers while initializing an empty stomach',()=>{
 const s=newSiege(rng);const ids=s.deck.hand.map(c=>c.id);
 s.version=5;delete s.essences;delete s.essenceHistory;delete s.pendingEssence;
 const restored=restoreSiege(structuredClone(s));
 assert.ok(restored);
 assert.equal(restored.version,6);
 assert.deepEqual(restored.deck.hand.map(c=>c.id),ids);
 assert.deepEqual(restored.essences,[]);
 assert.deepEqual(restored.essenceHistory,[]);
 assert.equal(restored.pendingEssence,null);
});
test('Straw Ward reduces only the first empty-lane breach per turn',()=>{
 const ordinary=newSiege(rng);ordinary.units.forEach(u=>u.lane=2);
 const inherited=structuredClone(ordinary);inherited.essences=['straw-ward'];
 endTurn(ordinary,rng);endTurn(inherited,rng);
 assert.equal(inherited.integrity-ordinary.integrity,3);
});
test('Copper Purse and Sticky Fingers both increase enemy kill gold',()=>{
 const s=newSiege(rng);s.essences=['copper-purse','sticky-fingers'];
 assert.equal(killGold(s),9);
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 endTurn(s,rng);
 assert.equal(s.gold,26); // 2 kills * 9, plus 8 raid-clear bonus.
});
test('Herbal Gut improves Bloom healing without adding damage',()=>{
 const result=compareEffect('herbal-gut',['mend'],s=>{s.units[0].hp=3;},s=>s.units[0].hp);
 assert.equal(result.inherited-result.ordinary,2);
});
test('Wild Pockets permits three redraws, then removal restores the ordinary limit',()=>{
 const s=newSiege(rng);
 capture(s,1);
 assert.equal(chooseEssence(s,'wild-pockets'),true);
 assert.equal(redrawLimit(s),3);
 assert.equal(s.deck.discardsLeft,3);
 for(let i=0;i<3;i++)assert.equal(redrawCommand(s,s.deck.hand[0].id,rng),true);
 assert.equal(redrawCommand(s,s.deck.hand[0].id,rng),false);
 assert.ok(validateDeck(s.deck,8,false,3));
 assert.ok(restoreSiege(structuredClone(s)));
});
test('Opening Gambit grants exactly two base power to the first chain card',()=>{
 const result=compareEffect('opening-gambit',['strike']);
 assert.equal(result.ordinary-result.inherited,2);
});
test('Trail Rations restores three integrity after clearing a raid',()=>{
 const s=newSiege(rng);s.essences=['trail-rations'];s.integrity=14;
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 endTurn(s,rng);
 assert.equal(s.phase,'reward');assert.equal(s.integrity,17);
});
test('Shield Drill increases armor cards by three while leaving chain link rules unchanged',()=>{
 const result=compareEffect('shield-drill',['fortify'],undefined,s=>s.units[0].armor);
 assert.equal(result.inherited-result.ordinary,3);
});
test('Iron Reflex reduces only the first invader hit against a defender',()=>{
 const ordinary=newSiege(rng);
 ordinary.units.forEach(u=>u.lane=2);ordinary.units[0].lane=0;
 const inherited=structuredClone(ordinary);inherited.essences=['iron-reflex'];
 endTurn(ordinary,rng);endTurn(inherited,rng);
 assert.equal(inherited.units[0].hp-ordinary.units[0].hp,3);
});
test('Deadeye adds three to the first Fang attack in each chain',()=>{
 const result=compareEffect('deadeye',['strike']);
 assert.equal(result.ordinary-result.inherited,3);
});
test('Barbed Quiver and Witchfire add separate, bounded venom applications',()=>{
 const ordinary=compareEffect('barbed-quiver',['bite'],()=>{},s=>s.enemies[0].poison);
 const withWitch=compareEffect('witchfire',['bite'],()=>{},s=>s.enemies[0].poison);
 assert.equal(ordinary.inherited-ordinary.ordinary,2);
 assert.equal(withWitch.inherited-withWitch.ordinary,2);
});
test('Cruel Precision adds six execution damage against a half-health target',()=>{
 const result=compareEffect('cruel-precision',['execute'],s=>{s.enemies[0].maxHp=72;s.enemies[0].hp=35;assert.equal(targetChain(s,s.enemies[0].id),true);});
 assert.equal(result.ordinary-result.inherited,6);
});
test('Mana Gullet reduces actual Hunger costs by ten, without negative costs',()=>{
 const s=newSiege(rng);
 assert.equal(hungerCost(s,40),40);
 s.essences=['mana-gullet'];
 assert.equal(hungerCost(s,40),30);
 assert.equal(hungerCost(s,5),0);
 arrange(s,['feast']);
 s.hunger=35;s.units.forEach(u=>u.lane=2);
 endTurn(s,rng);
 assert.equal(s.hunger,5);
 assert.ok(s.enemies[0].hp<18);
});
test('Royal Discipline empowers automatic defender attacks only after a three-card chain',()=>{
 const base=newSiege(rng);
 arrange(base,['mend','roots','regrow']);
 base.units.forEach(u=>u.lane=2);
 base.units[0].lane=1;
 const withTrait=structuredClone(base);withTrait.essences=['royal-discipline'];
 endTurn(base,rng);endTurn(withTrait,rng);
 assert.equal(base.enemies[1].hp-withTrait.enemies[1].hp,2);
});
test('Unyielding Heart starts later raids with four armor on each surviving defender',()=>{
 const s=newSiege(rng);s.essences=['unyielding-heart'];
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 endTurn(s,rng);
 assert.equal(reinforce(s,'rest'),true);
 assert.ok(s.units.filter(u=>u.alive).every(u=>u.armor===4));
});
test('ordinary monster kills and card attacks cannot trigger essence capture',()=>{
 const s=newSiege(rng);s.units.forEach(u=>u.attack=80);
 endTurn(s,rng);
 assert.equal(s.pendingEssence,null);
 assert.equal(s.essences.length,0);
});
