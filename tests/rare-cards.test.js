import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,SHOP_CARD_TYPES,STARTER_DECK,FOUNDING_CARDS,validateDeck} from '../dist/chain-engine.js';
import {deckCards} from '../dist/shop-engine.js';
import {newSiege,RAIDS,endTurn,reinforce,buyUpgrade,restoreSiege,queueCommand,redrawCommand} from '../dist/siege-engine.js';

const baseRng=()=>0.5;
function earnShop(s,rng=baseRng){
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 let turns=0;
 while(s.phase==='battle'&&turns++<12)endTurn(s,rng);
 assert.equal(s.phase,'reward');
}
function purchase(type){
 const index=SHOP_CARD_TYPES.indexOf(type);
 assert.ok(index>=0);
 const rng=()=> (index+0.1)/SHOP_CARD_TYPES.length;
 const s=newSiege(rng);
 // Rare-card unit tests isolate card arithmetic from replayable Forest Edge
 // party selection. The original second-raid Scout statline is their fixture.
 s.encounterPlan=Array(RAIDS.length).fill(0);
 earnShop(s,rng);
 const offer=s.shopOffers[3];
 assert.equal(offer.id,'rare');
 assert.equal(offer.cardType,type);
 s.gold=100;
 assert.equal(buyUpgrade(s,'rare'),true);
 assert.equal(s.deck.acquired.length,1);
 assert.equal(reinforce(s,'rest'),true);
 return s;
}
function prepare(s,types){
 const all=deckCards(s);
 const hand=types.map(type=>{
  const index=all.findIndex(c=>c.type===type);
  assert.notEqual(index,-1,'card '+type+' must exist');
  return all.splice(index,1)[0];
 });
 s.deck.draw=all;s.deck.discard=[];s.deck.hand=hand;s.deck.chain=[];
 s.units.forEach(u=>u.lane=1);
 assert.ok(validateDeck(s.deck,11,false,2,true,true));
 return [...hand]; // Independent copy: queueCard mutates the deck's hand array.
}

test('four unique rare card designs are shop-only; original eight-card hand and five-card chain remain',()=>{
 const s=newSiege(baseRng);
 assert.ok(s.deck.hand.length>=5&&s.deck.hand.length<=10);
 assert.equal(s.deck.acquired.length,0);
 assert.equal(deckCards(s).length,STARTER_DECK.length+FOUNDING_CARDS.length);
 assert.equal(SHOP_CARD_TYPES.length,4);
 assert.equal(new Set(SHOP_CARD_TYPES).size,4);
 for(const type of SHOP_CARD_TYPES){
  assert.equal(STARTER_DECK.includes(type),false);
  assert.ok(CARDS[type].description);
  assert.ok(CARDS[type].price>0);
 }
 earnShop(s);
 assert.deepEqual(s.shopOffers.map(o=>o.id).slice(0,3),['card','monster',s.shopOffers[2].id]);
 assert.equal(s.shopOffers[3].id,'rare');
});

test('buying a rare card spends gold once and it appears in the first next-raid hand',()=>{
 const s=newSiege(()=>0.1);earnShop(s,()=>0.1);
 assert.equal(s.shopOffers[3].cardType,'sacrifice');
 const price=s.shopOffers[3].cost;
 s.gold=price;
 assert.equal(buyUpgrade(s,'rare'),true);
 assert.equal(s.gold,0);
 assert.equal(buyUpgrade(s,'rare'),false);
 assert.equal(s.deck.acquired[0],'sacrifice');
 assert.equal(deckCards(s).find(c=>c.id==='p0').type,'sacrifice');
 assert.ok(validateDeck(s.deck,11,false,2,true,true));
 assert.equal(reinforce(s,'rest'),true);
 assert.ok(s.deck.hand.some(c=>c.id==='p0'));
 assert.ok(s.deck.hand.length>=5&&s.deck.hand.length<=10);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('unaffordable rare cards never modify inventory, gold, or sale status',()=>{
 const s=newSiege(baseRng);earnShop(s);
 s.gold=0;
 const original=structuredClone(s.deck);
 assert.equal(buyUpgrade(s,'rare'),false);
 assert.equal(s.gold,0);
 assert.deepEqual(s.deck,original);
 assert.equal(s.shopOffers[3].sold,false);
});

test('purchased cards remain conserved through redraws, turn resolution and a save round-trip',()=>{
 const s=purchase('harvest');
 assert.equal(deckCards(s).length,29);
 assert.equal(redrawCommand(s,s.deck.hand[0].id,baseRng),true);
 assert.ok(validateDeck(s.deck,11,false,2,true,true));
 endTurn(s,baseRng);
 assert.ok(validateDeck(s.deck,11,false,2,true,true));
 assert.equal(deckCards(s).length,29);
 const restored=restoreSiege(structuredClone(s));
 assert.ok(restored);
 assert.equal(restored.deck.acquired[0],'harvest');
 assert.equal(deckCards(restored).filter(c=>c.id==='p0').length,1);
});

test('sacrificial strike spends defender health but never kills its donor',()=>{
 const s=purchase('sacrifice');
 const hand=prepare(s,['sacrifice']);
 const donor=s.units.find(u=>u.species==='slime');
 const sporeling=s.units.find(u=>u.species==='sporeling');
 sporeling.lane=0;sporeling.attack=0; // Prevent passive same-lane healing from masking the health payment.
 const hp=donor.hp;
 assert.equal(queueCommand(s,hand[0].id),true);
 endTurn(s,baseRng);
 assert.equal(donor.hp,hp-7);
 assert.equal(s.enemies[0].hp,1);
 assert.equal(donor.alive,true);
 assert.ok(s.log.some(line=>line.includes('sacrifices 7 HP')));
});

test('sacrificial strike fizzles if every surviving defender is at 1 HP',()=>{
 const s=purchase('sacrifice');
 const hand=prepare(s,['sacrifice']);
 s.units.forEach(u=>u.hp=1);
 assert.equal(queueCommand(s,hand[0].id),true);
 const before=s.enemies[0].hp;
 endTurn(s,baseRng);
 assert.equal(s.enemies[0].hp,before);
 assert.ok(s.log.some(line=>line.includes('no defender can pay')));
});

test('bone tithe consumes at most its stated armor budget and deals twice the spent armor',()=>{
 const s=purchase('tithe');
 const hand=prepare(s,['tithe']);
 s.units[0].armor=4;s.units[1].armor=4;
 assert.equal(queueCommand(s,hand[0].id),true);
 endTurn(s,baseRng);
 assert.equal(s.units.reduce((sum,u)=>sum+u.armor,0),2);
 assert.equal(s.enemies[0].hp,12);
});

test('bone tithe cannot create free damage when defenders have no armor',()=>{
 const s=purchase('tithe');
 const hand=prepare(s,['tithe']);
 assert.equal(queueCommand(s,hand[0].id),true);
 const original=s.enemies[0].hp;
 endTurn(s,baseRng);
 assert.equal(s.enemies[0].hp,original);
 assert.ok(s.log.some(line=>line.includes('no armor')));
});

test('spore harvest converts poison into team healing and consumes the stacks',()=>{
 const s=purchase('harvest');
 const hand=prepare(s,['harvest']);
 s.enemies[0].poison=4;
 s.units.forEach(u=>u.hp=u.maxHp-6);
 const before=s.units.map(u=>u.hp);
 assert.equal(queueCommand(s,hand[0].id),true);
 endTurn(s,baseRng);
 s.units.forEach((u,i)=>assert.equal(u.hp,Math.min(u.maxHp,before[i]+9)));
 assert.equal(s.enemies[0].poison,0); // 4 - 3 consumed - 1 end-of-turn tick
 assert.ok(s.log.some(line=>line.includes('spends 3 poison')));
});

test('mirror fang repeats a compatible previous command once, for twenty hunger',()=>{
 const s=purchase('mirror');
 const hand=prepare(s,['strike','mirror']);
 s.hunger=100;
 for(const c of hand)assert.equal(queueCommand(s,c.id),true);
 assert.equal(s.deck.chain.length,hand.length);
 endTurn(s,baseRng);
 assert.equal(s.enemies[0].hp,16,JSON.stringify({log:s.log,hunger:s.hunger,enemies:s.enemies})); // strike 4+2 affinity; copied base 4/2
 assert.equal(s.hunger,80);
 assert.ok(s.log.some(line=>line.includes('repeats a strike')));
 assert.equal(s.deck.chain.length,0);
});

test('mirror fang cannot copy itself or a Hunger Feast, and costs no hunger when it fizzles',()=>{
 const s=purchase('mirror');
 const hand=prepare(s,['feast','mirror']);
 s.hunger=100;
 for(const c of hand)assert.equal(queueCommand(s,c.id),true);
 endTurn(s,baseRng);
 assert.equal(s.hunger,60); // Feast costs 40, mirror refuses Hunger recursion
 assert.ok(s.log.some(line=>line.includes('Mirror Fang fizzles')),JSON.stringify(s.log));
});

test('mirror fang cannot cast for free if hunger is insufficient',()=>{
 const s=purchase('mirror');
 const hand=prepare(s,['strike','mirror']);
 s.hunger=0;
 for(const c of hand)assert.equal(queueCommand(s,c.id),true);
 endTurn(s,baseRng);
 assert.equal(s.hunger,0);
 assert.equal(s.enemies[0].hp,18); // only the first strike
 assert.ok(s.log.some(line=>line.includes('requires 20 Hunger')),JSON.stringify(s.log));
});

test('save validation rejects counterfeit purchased card type, duplicate id or bogus acquisition',()=>{
 const s=purchase('tithe');
 let bad=structuredClone(s);
 deckCards(bad).find(c=>c.id==='p0').type='mirror';
 assert.equal(restoreSiege(bad),null);
 bad=structuredClone(s);
 bad.deck.acquired[0]='not-a-card';
 assert.equal(restoreSiege(bad),null);
 bad=structuredClone(s);
 bad.deck.acquired.push('harvest');
 assert.equal(restoreSiege(bad),null);
 bad=structuredClone(s);
 bad.deck.hand.find(c=>c.id!=='p0').id='p0';
 assert.equal(restoreSiege(bad),null);
});

test('save validation rejects acquired cards impossible for current raid',()=>{
 const s=purchase('harvest');
 s.raid=0; // impossible: no shopping occurs before raid 1
 assert.equal(restoreSiege(structuredClone(s)),null);
});

test('v4 reward saves migrate without losing selected shop stock, gold or upgrades',()=>{
 const s=newSiege(baseRng);earnShop(s);
 const type=s.shopOffers[2].id;
 for(const pile of ['draw','discard','hand','chain'])s.deck[pile]=s.deck[pile].filter(c=>!c.id.startsWith('f'));
 s.deck.tribal=false;delete s.deck.exotic;
 s.version=4;
 s.shopOffers.pop();s.shopOffers.pop();s.shopOffers.pop();
 delete s.deck.acquired;
 const restored=restoreSiege(structuredClone(s));
 assert.ok(restored);
 assert.equal(restored.version,11);
 assert.equal(restored.shopOffers.length,6);
 assert.equal(restored.shopOffers[2].id,type);
 assert.equal(restored.shopOffers[3].id,'rare');
 assert.deepEqual(restored.deck.acquired,[]);
 assert.ok(validateDeck(restored.deck,11,false,2,true,true));
});

test('v4 battle saves migrate without changing the original deck or hand',()=>{
 const s=newSiege(baseRng);
 for(const pile of ['draw','discard','hand','chain'])s.deck[pile]=s.deck[pile].filter(c=>!c.id.startsWith('f'));
 const ids=s.deck.hand.map(c=>c.id);
 s.deck.tribal=false;delete s.deck.exotic;
 s.version=4;delete s.deck.acquired;
 const restored=restoreSiege(structuredClone(s));
 assert.ok(restored);
 assert.equal(restored.version,11);
 assert.deepEqual(restored.deck.acquired,[]);
 assert.deepEqual(restored.deck.hand.map(c=>c.id),ids);
 assert.equal(restored.shopOffers.length,0);
});

test('rare shop receipts and prices must be consistent with the acquired card',()=>{
 const s=newSiege(()=>0.1);earnShop(s,()=>0.1);
 s.gold=100;assert.equal(buyUpgrade(s,'rare'),true);
 let forged=structuredClone(s);
 forged.shopOffers[3].cardType='mirror';
 assert.equal(restoreSiege(forged),null);
 forged=structuredClone(s);
 forged.shopOffers[3].cost=0;
 assert.equal(restoreSiege(forged),null);
 forged=structuredClone(s);
 forged.shopOffers[3].sold=false;
 assert.equal(restoreSiege(forged),null);
});

test('rare shop avoids cards already purchased while other rare commands are available',()=>{
 const s=purchase('sacrifice');
 earnShop(s,()=>0.1);
 assert.equal(s.raid,1);
 assert.equal(s.shopOffers[3].id,'rare');
 assert.equal(s.shopOffers[3].cardType,'tithe');
 assert.equal(s.deck.acquired.includes(s.shopOffers[3].cardType),false);
 assert.ok(restoreSiege(structuredClone(s)));
});
