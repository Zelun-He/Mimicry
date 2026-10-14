import test from 'node:test';
import assert from 'node:assert/strict';
import {newSiege,endTurn,reinforce,buyUpgrade,restoreSiege,queueCommand,redrawCommand,devour} from '../dist/siege-engine.js';
import {MUTATIONS,handSize,deckCards,cardPower,upgradeableCards} from '../dist/shop-engine.js';
import {STARTER_DECK,validateDeck} from '../dist/chain-engine.js';
const rng=()=>0.5;
function winRaid(s){
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 let steps=0;
 while(s.phase==='battle'&&steps++<15)endTurn(s,rng);
 assert.equal(s.phase,'reward');
}
function takeMutationOffer(s){return s.shopOffers.find(o=>Object.hasOwn(MUTATIONS,o.id));}

test('victory grants raid-clear gold once and opens four shop offers',()=>{
 const s=newSiege(rng);
 assert.equal(s.deck.hand.length,8);
 winRaid(s);
 assert.equal(s.gold,18);
 assert.deepEqual(s.shopOffers.map(o=>o.id).slice(0,2),['card','monster']);
 assert.equal(s.shopOffers.length,4);
 const before=s.gold;
 assert.equal(endTurn(s,rng),false);
 assert.equal(devour(s,rng),false);
 assert.equal(s.gold,before);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('shopping never spends money before validating target, cost, or purchase limit',()=>{
 const s=newSiege(rng);winRaid(s);
 const card=upgradeableCards(s)[0];
 assert.equal(buyUpgrade(s,'card','does-not-exist'),false);
 assert.equal(buyUpgrade(s,'monster','does-not-exist'),false);
 assert.equal(buyUpgrade(s,'not-an-offer',card.id),false);
 assert.equal(s.gold,18);
 assert.equal(buyUpgrade(s,'card',card.id),true);
 assert.equal(s.gold,6);
 assert.equal(card.level,1);
 assert.equal(buyUpgrade(s,'card',card.id),false);
 assert.equal(buyUpgrade(s,'monster',s.units[0].id),false);
 assert.equal(s.gold,6);
 assert.ok(validateDeck(s.deck));
 assert.ok(restoreSiege(structuredClone(s)));
});

test('upgrading a command increases power without changing its rank, identity, or deck inventory',()=>{
 const s=newSiege(rng);winRaid(s);
 const c=upgradeableCards(s).find(x=>x.type==='strike');
 assert.ok(c);
 const oldPower=cardPower(s,c),oldId=c.id;
 assert.equal(buyUpgrade(s,'card',c.id),true);
 assert.equal(cardPower(s,c),oldPower+2);
 assert.equal(c.id,oldId);
 assert.equal(deckCards(s).length,STARTER_DECK.length);
 assert.equal(new Set(deckCards(s).map(x=>x.id)).size,STARTER_DECK.length);
 const t=restoreSiege(structuredClone(s));
 assert.ok(t);
 assert.equal(deckCards(t).find(x=>x.id===oldId).level,1);
});

test('training is targeted, permanent, and cannot revive a dead defender',()=>{
 const s=newSiege(rng);winRaid(s);
 const ally=s.units[0];const other=s.units[1];
 const a0=ally.attack,life0=ally.maxHp,otherAttack=other.attack;
 assert.equal(buyUpgrade(s,'monster',ally.id),true);
 assert.equal(ally.attack,a0+2);
 assert.equal(ally.maxHp,life0+4);
 assert.equal(ally.training,1);
 assert.equal(other.attack,otherAttack);
 assert.equal(buyUpgrade(s,'monster',other.id),false);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('mutation costs gold and persists across the next raid, including max integrity',()=>{
 const s=newSiege(()=>0.25);winRaid(s);
 const m=takeMutationOffer(s);
 assert.ok(m);
 s.gold=100;
 assert.equal(buyUpgrade(s,m.id),true);
 assert.equal(s.mutations.includes(m.id),true);
 assert.equal(buyUpgrade(s,m.id),false);
 if(m.id==='stolen-plating')assert.equal(s.maxIntegrity,35);
 const beforeGold=s.gold;
 assert.equal(reinforce(s,'rest'),true);
 assert.equal(s.gold,beforeGold);
 assert.deepEqual(s.shopOffers,[]);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('royal satchel increases hand to nine while chain cap remains five',()=>{
 const s=newSiege(()=>0.65);winRaid(s);
 const offer=takeMutationOffer(s);
 assert.equal(offer.id,'royal-satchel');
 s.gold=100;
 assert.equal(buyUpgrade(s,'royal-satchel'),true);
 assert.equal(handSize(s),9);
 assert.equal(reinforce(s,'rest'),true);
 assert.equal(s.deck.hand.length,9);
 assert.ok(validateDeck(s.deck,9));
 assert.equal(restoreSiege(structuredClone(s)).deck.hand.length,9);
 const first=s.deck.hand[0];
 assert.equal(redrawCommand(s,first.id,rng),true);
 assert.equal(s.deck.hand.length,9);
 assert.equal(s.deck.chain.length,0);
 assert.ok(validateDeck(s.deck,9));
});

test('saving version 3 games migrates safely to shop-capable version 5',()=>{
 const v3=newSiege(rng);
 v3.version=3;
 delete v3.mutations;delete v3.shopOffers;
 const result=restoreSiege(structuredClone(v3));
 assert.ok(result);
 assert.equal(result.version,5);
 assert.deepEqual(result.mutations,[]);
 assert.deepEqual(result.shopOffers,[]);
 assert.equal(result.deck.hand.length,8);
});

test('saving version 3 at a reward creates shop offers on migration',()=>{
 const s=newSiege(rng);winRaid(s);
 s.version=3;
 delete s.shopOffers;delete s.mutations;
 const result=restoreSiege(structuredClone(s));
 assert.ok(result);
 assert.equal(result.shopOffers.length,4);
 assert.equal(result.phase,'reward');
});

test('invalid saves cannot forge free mutations, exceed card levels, or increase gold with shop data',()=>{
 const s=newSiege(rng);winRaid(s);
 let forged=structuredClone(s);forged.mutations=['stolen-plating'];
 assert.equal(restoreSiege(forged),null);
 forged=structuredClone(s);deckCards(forged)[0].level=99;
 assert.equal(restoreSiege(forged),null);
 forged=structuredClone(s);forged.shopOffers[0].cost=0;
 assert.equal(restoreSiege(forged),null);
 forged=structuredClone(s);forged.gold=-50;
 assert.equal(restoreSiege(forged),null);
});

test('shop RNG is validated so invalid random values cannot create corrupt offers',()=>{
 const s=newSiege(rng);
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 assert.throws(()=>endTurn(s,()=>1),/Invalid shop RNG|Invalid RNG/);
 assert.equal(s.phase,'battle');
 assert.deepEqual(s.shopOffers,[]);
});

test('card enhancements change actual command damage by exactly two before chain bonuses',()=>{
 const base=newSiege(rng);
 const all=[...base.deck.draw,...base.deck.hand];
 const strike=all.find(c=>c.type==='strike');
 base.deck.hand=[strike];base.deck.draw=all.filter(c=>c!==strike);
 base.units.forEach(u=>u.lane=2);
 const upgraded=structuredClone(base);upgraded.deck.hand[0].level=1;
 assert.equal(queueCommand(base,strike.id),true);
 assert.equal(queueCommand(upgraded,strike.id),true);
 endTurn(base,rng);endTurn(upgraded,rng);
 assert.equal(base.enemies[0].hp-upgraded.enemies[0].hp,2);
});

test('forged fractional gold is rejected during load',()=>{
 const s=newSiege(rng);s.gold=1.5;
 assert.equal(restoreSiege(s),null);
});

test('an unsold mutation cannot be granted free by a forged shop receipt',()=>{
 const s=newSiege(rng);winRaid(s);
 const offer=takeMutationOffer(s);
 const forged=structuredClone(s);forged.shopOffers.find(o=>o.id===offer.id).sold=true;
 assert.equal(restoreSiege(forged),null);
});

test('malformed mutation fields are rejected without throwing during restore',()=>{
 const s=newSiege(rng);
 for(const malformed of [42,{},'iron-fangs',null]){
  const v=structuredClone(s);v.mutations=malformed;
  assert.doesNotThrow(()=>restoreSiege(v));
  assert.equal(restoreSiege(v),null);
 }
});
