import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,STARTER_DECK,FOUNDING_CARDS,EXOTIC_SHOP_GROUPS,EXOTIC_SHOP_TYPES,validateDeck,chainSlotCount} from '../dist/chain-engine.js';
import {newSiege,restoreSiege,endTurn,reinforce,queueCommand,buyUpgrade,setSummonLane} from '../dist/siege-engine.js';
import {createShop,deckCards} from '../dist/shop-engine.js';
import {MINION_STATS,MAX_MINIONS,liveMinions,summonMinions,validSwarmState} from '../dist/swarm-engine.js';
import {MAX_WEB,CREATURES,webPrey,webPenalty,consumeWeb,lurePrey,splitSlime,fuseSlimes,mimiclingFeed,validCreatureState} from '../dist/creature-engine.js';

const rng=()=>0.5;
const inventory=s=>deckCards(s);
function setupChain(s,types){
 const available=inventory(s),hand=[];
 for(const type of types){
  const i=available.findIndex(c=>c.type===type);
  assert.ok(i>=0,'missing card '+type);
  hand.push(available.splice(i,1)[0]);
 }
 s.deck.hand=hand;s.deck.draw=available;s.deck.discard=[];s.deck.chain=[];
 for(const card of [...hand])assert.equal(queueCommand(s,card.id),true,'queue '+card.type);
 return hand;
}
function grantCard(s,type){
 if(!EXOTIC_SHOP_TYPES.includes(type))throw Error('unsupported test card');
 const id='p'+s.deck.acquired.length;
 s.deck.acquired.push(type);s.deck.acquiredAt.push(s.raid);
 s.deck.draw.push({id,type});
 return id;
}
function winShop(s){
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 let turns=0;
 while(s.phase==='battle'&&turns++<12)endTurn(s,rng);
 assert.equal(s.phase,'reward');
 return s;
}
function purchased(type){
 const s=winShop(newSiege(rng));
 s.gold=100;
 assert.equal(buyUpgrade(s,'exotic',type),true);
 assert.equal(reinforce(s,'rest'),true);
 s.units.forEach(u=>{u.attack=0;u.lane=2;});
 s.enemies.forEach(e=>{e.web=0;e.poison=0;});
 return s;
}

test('all three new creature families have unique cards, sprites and positive stats',()=>{
 assert.equal(Object.keys(CREATURES).length,3);
 assert.equal(EXOTIC_SHOP_TYPES.length,6);
 assert.equal(new Set(EXOTIC_SHOP_TYPES).size,6);
 for(const [i,group] of EXOTIC_SHOP_GROUPS.entries()){
  assert.equal(group.length,2);
  for(const type of group){
   assert.ok(CARDS[type].name);
   assert.ok(CARDS[type].description.length>=25);
   assert.equal(CARDS[type].price,15);
   assert.ok(!STARTER_DECK.includes(type));
   assert.ok(!FOUNDING_CARDS.includes(type));
  }
 }
 for(const type of ['spider','slime-bud','slimelet','slime-giant','mimicling']){
  assert.ok(MINION_STATS[type].hp>=3);
  assert.ok(MINION_STATS[type].attack>=1);
 }
});

test('new runs keep eight-card hands, five chain slots, and all founding cards',()=>{
 const s=newSiege(rng);
 assert.equal(s.version,8);
 assert.equal(s.deck.hand.length,8);
 assert.equal(inventory(s).length,28);
 assert.equal(s.enemies.every(e=>e.web===0),true);
 assert.equal(s.lastLureTurn,-1);
 assert.ok(validateDeck(s.deck,8,false,2,true,true));
 assert.ok(validCreatureState(s));
 assert.ok(restoreSiege(structuredClone(s)));
});

test('the Quartermaster offers a real choice of Spider, Slime, and Mimicling families',()=>{
 const s=winShop(newSiege(rng));
 assert.equal(s.shopOffers.length,6);
 const offer=s.shopOffers[5];
 assert.equal(offer.id,'exotic');
 assert.equal(offer.cost,15);
 assert.deepEqual(offer.options,['spider-summon','slime-summon','mimicling-summon']);
 assert.equal(buyUpgrade(s,'exotic','wrong-card'),false);
 assert.equal(buyUpgrade(s,'exotic','silken-prison'),false);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('buying each creature spends gold only once and survives the next raid',()=>{
 for(const type of ['spider-summon','slime-summon','mimicling-summon']){
  const s=winShop(newSiege(rng));s.gold=30;
  assert.equal(buyUpgrade(s,'exotic',type),true);
  assert.equal(s.gold,15);
  assert.equal(buyUpgrade(s,'exotic',type),false);
  assert.equal(s.deck.acquired.at(-1),type);
  assert.equal(s.shopOffers[5].purchasedType,type);
  assert.ok(restoreSiege(structuredClone(s)));
  assert.equal(reinforce(s,'rest'),true);
  assert.equal(s.deck.hand.some(c=>c.type===type),true);
  assert.ok(restoreSiege(structuredClone(s)));
 }
});

test('new-family shop offer stays unaffordable without enough gold',()=>{
 const s=winShop(newSiege(rng));s.gold=14;
 const before=structuredClone(s.deck);
 assert.equal(buyUpgrade(s,'exotic','spider-summon'),false);
 assert.deepEqual(s.deck,before);
 assert.equal(s.shopOffers[5].sold,false);
});

test('shop can offer family tactic cards after their summon has been acquired',()=>{
 const s=winShop(newSiege(rng));s.gold=100;
 assert.equal(buyUpgrade(s,'exotic','spider-summon'),true);
 const offer=createShop(s,()=>0.75)[5];
 assert.equal(offer.options[0],'silken-prison');
 assert.equal(offer.options[1],'slime-summon');
 assert.equal(offer.options[2],'mimicling-summon');
 assert.ok(offer.options.every(type=>EXOTIC_SHOP_TYPES.includes(type)));
});

test('Spiders summon into the chosen lane, web enemies and poison trapped prey',()=>{
 const s=purchased('spider-summon');
 s.enemies[0].lane=0;s.summonLane=0;
 setupChain(s,['spider-summon']);
 const hp=s.enemies[0].hp;
 endTurn(s,rng);
 assert.equal(liveMinions(s,'spider',0).length,1);
 assert.equal(s.enemies[0].web,0); // one Web dampened retaliation and decayed
 assert.equal(s.enemies[0].hp,hp-3); // 2 hit plus 1 poison tick
 assert.equal(s.enemies[0].poison,0);
 assert.equal(liveMinions(s,'spider',0)[0].hp,1); // Scout attack 5 - Web 2
 assert.ok(restoreSiege(structuredClone(s)));
});

test('Webs cap at three stacks and reduce a single attack before decaying',()=>{
 const s=newSiege(rng);
 s.enemies[0].lane=0;
 assert.equal(webPrey(s,0,20).web,MAX_WEB);
 assert.equal(webPenalty(s.enemies[0]),6);
 assert.equal(consumeWeb(s.enemies[0]),6);
 assert.equal(s.enemies[0].web,2);
 assert.equal(consumeWeb(s.enemies[0]),4);
 assert.equal(consumeWeb(s.enemies[0]),2);
 assert.equal(s.enemies[0].web,0);
 assert.equal(consumeWeb(s.enemies[0]),0);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('Silken Prison adds Web and orders a bonus Spider attack',()=>{
 const s=purchased('spider-summon');
 grantCard(s,'silken-prison');
 s.enemies[0].lane=0;s.summonLane=0;
 setupChain(s,['spider-summon','silken-prison']);
 const hp=s.enemies[0].hp;
 endTurn(s,rng);
 assert.equal(s.enemies[0].hp<hp-4,true);
 assert.equal(s.enemies[0].web,2); // 1 from summoning +2 from trap, one consumed
 assert.equal(s.enemies[0].poison,1);
 assert.ok(s.log.some(line=>line.includes('Silken Prison')));
});

test('a Slime Droplet survives one hit and divides into a Tiny Slime',()=>{
 const s=purchased('slime-summon');
 s.enemies[0].lane=0;s.summonLane=0;
 setupChain(s,['slime-summon']);
 endTurn(s,rng);
 const bud=liveMinions(s,'slime-bud',0)[0];
 assert.ok(bud);
 assert.equal(bud.hp,1); // HP 6, minus Scout attack 5
 assert.equal(liveMinions(s,'slimelet',0).length,1);
 assert.equal(bud.splitTurn,1);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('Slimes split at most once per turn and never exceed the shared cap',()=>{
 const s=newSiege(rng);s.summonLane=0;
 assert.equal(summonMinions(s,'slime-bud',1),1);
 const bud=liveMinions(s,'slime-bud')[0];
 assert.equal(splitSlime(s,bud),1);
 assert.equal(splitSlime(s,bud),0);
 assert.equal(liveMinions(s,'slimelet').length,1);
 s.turn++;
 assert.equal(splitSlime(s,bud),1);
 assert.equal(liveMinions(s,null,0).length,3);
 s.turn++;
 assert.equal(splitSlime(s,bud),0);
 assert.ok(validSwarmState(s));
});

test('Slimes cannot split when the hit kills them or when the lane is full',()=>{
 const s=newSiege(rng);s.summonLane=0;
 summonMinions(s,'slime-bud',1);
 const bud=liveMinions(s,'slime-bud')[0];
 summonMinions(s,'goblin',2);
 assert.equal(splitSlime(s,bud),0);
 bud.alive=false;bud.hp=0;
 assert.equal(splitSlime(s,bud),0);
});

test('Gel Fusion consumes exactly two weak Slimes to create a strong giant',()=>{
 const s=newSiege(rng);s.summonLane=0;
 summonMinions(s,'slime-bud',1);
 summonMinions(s,'slimelet',1);
 const result=fuseSlimes(s,0);
 assert.ok(result);
 assert.equal(result.parents.length,2);
 assert.equal(liveMinions(s,'slime-bud').length,0);
 assert.equal(liveMinions(s,'slimelet').length,0);
 assert.equal(liveMinions(s,'slime-giant').length,1);
 assert.equal(result.giant.hp,10);
 assert.equal(result.giant.attack,5);
 assert.equal(s.bones,0);
 assert.ok(validSwarmState(s));
});

test('Gel Fusion command upgrades the battlefield only with two available Slimes',()=>{
 const s=purchased('slime-summon');
 grantCard(s,'gel-fusion');
 s.summonLane=0;s.enemies[0].lane=0;
 summonMinions(s,'slime-bud',1,false,0);
 setupChain(s,['slime-summon','gel-fusion']);
 endTurn(s,rng);
 assert.equal(liveMinions(s,'slime-giant',0).length,1);
 assert.ok(s.log.some(msg=>msg.includes('Gel Fusion')));
});

test('Mimiclings move the strongest outside adventurer into their lane, once per turn',()=>{
 const s=purchased('mimicling-summon');s.summonLane=1;
 s.enemies.forEach((e,i)=>{e.lane=i?2:0;});
 setupChain(s,['mimicling-summon']);
 endTurn(s,rng);
 assert.equal(s.lastLureTurn,1);
 assert.equal(s.enemies.some(e=>e.lane===1),true);
 assert.equal(lurePrey(s,1),null);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('Mimicling first hit yields five Hunger; repeated hits cannot farm unlimited Hunger',()=>{
 const s=purchased('mimicling-summon');s.hunger=0;
 grantCard(s,'family-dinner');
 s.summonLane=0;
 s.enemies[0].lane=0;
 s.enemies[0].hp=s.enemies[0].maxHp; 
 setupChain(s,['mimicling-summon','family-dinner']);
 endTurn(s,rng);
 assert.equal(s.hunger,5);
 assert.ok(s.log.some(x=>x.includes('Family Dinner')));
});

test('a Mimicling cannot earn extra Hunger twice on the same turn',()=>{
 const s=newSiege(rng);s.summonLane=0;
 summonMinions(s,'mimicling',1);
 const m=liveMinions(s,'mimicling')[0];
 assert.equal(mimiclingFeed(s,m),5);
 assert.equal(mimiclingFeed(s,m),0);
 assert.equal(s.hunger,5);
 s.turn++;
 assert.equal(mimiclingFeed(s,m),5);
 assert.equal(s.hunger,10);
});

test('Spider, Slime, and Mimicling summons all count toward the same six-body cap',()=>{
 const s=newSiege(rng);
 s.summonLane=0;
 summonMinions(s,'spider',3);
 s.summonLane=1;
 summonMinions(s,'slime-bud',2);
 summonMinions(s,'mimicling',1);
 s.summonLane=2;
 assert.equal(summonMinions(s,'mimicling',2),0);
 assert.equal(liveMinions(s).length,MAX_MINIONS);
 assert.ok(validSwarmState(s));
});

test('old version 7 reward saves migrate with an exotic offer and preserve purchases',()=>{
 const s=winShop(newSiege(rng));
 s.gold=100;
 assert.equal(buyUpgrade(s,'tribal',s.shopOffers[4].options[0]),true);
 const owned=structuredClone(s.deck.acquired);
 s.version=7;delete s.deck.exotic;delete s.lastLureTurn;
 s.shopOffers.pop();
 s.enemies.forEach(e=>delete e.web);
 const loaded=restoreSiege(structuredClone(s));
 assert.ok(loaded);
 assert.equal(loaded.version,8);
 assert.equal(loaded.shopOffers.length,6);
 assert.deepEqual(loaded.deck.acquired,owned);
 assert.equal(loaded.deck.exotic,true);
 assert.equal(loaded.shopOffers[5].id,'exotic');
 assert.ok(restoreSiege(structuredClone(loaded)));
});

test('tampered Web stacks, lure clocks, minion stats, and exotic receipts fail to restore',()=>{
 const s=winShop(newSiege(rng));
 s.gold=100;assert.equal(buyUpgrade(s,'exotic','spider-summon'),true);
 const bad=[
  v=>v.enemies[0].web=4,
  v=>v.enemies[0].web=-1,
  v=>v.enemies[0].lane=3,
  v=>v.lastLureTurn=999,
  v=>v.shopOffers[5].cost=0,
  v=>v.shopOffers[5].options[0]='goblin-recruit',
  v=>v.shopOffers[5].sold=false,
  v=>v.shopOffers[5].purchasedType='mimicling-summon',
  v=>v.deck.acquired[0]='slime-summon',
  v=>v.deck.draw.push({id:'p100',type:'spider-summon'})
 ];
 for(const mutate of bad){const v=structuredClone(s);mutate(v);assert.equal(restoreSiege(v),null);}
});

test('new creature minions, Spider webs and Slime splitting are reset between raids',()=>{
 const s=newSiege(rng);
 s.summonLane=0;
 summonMinions(s,'spider',1);
 summonMinions(s,'slime-bud',1);
 webPrey(s,0,3);
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 endTurn(s,rng);
 assert.equal(s.phase,'reward');
 assert.equal(liveMinions(s).length,0);
 assert.equal(reinforce(s,'rest'),true);
 assert.equal(s.lastLureTurn,-1);
 assert.equal(s.enemies.every(e=>e.web===0),true);
 assert.equal(s.minions.length,0);
 assert.ok(restoreSiege(structuredClone(s)));
});
