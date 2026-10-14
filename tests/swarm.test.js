import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,FOUNDING_CARDS,STARTER_DECK,TRIBAL_SHOP_TYPES,
 makeDeck,drawCards,queueCard,unqueueCard,canQueueCard,chainGroups,chainSlotCount,
 analyzeChain,findRituals,validateDeck} from '../dist/chain-engine.js';
import {newSiege,restoreSiege,endTurn,reinforce,queueCommand,unqueueCommand,
 buyUpgrade,setSummonLane} from '../dist/siege-engine.js';
import {deckCards,createShop} from '../dist/shop-engine.js';
import {MAX_MINIONS,MAX_LANE_MINIONS,MAX_BONES,liveMinions,
 summonMinions,earnBone,validSwarmState} from '../dist/swarm-engine.js';

const rng=()=>0.5;
const inventory=s=>[...s.deck.draw,...s.deck.discard,...s.deck.hand,...s.deck.chain];
function prepare(s,types){
 const available=inventory(s),hand=[];
 for(const type of types){
  const index=available.findIndex(c=>c.type===type);
  assert.ok(index>=0,'missing '+type);
  hand.push(available.splice(index,1)[0]);
 }
 s.deck.draw=available;s.deck.discard=[];s.deck.hand=hand;s.deck.chain=[];
 return [...hand];
}
function buyShop(s){
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 let n=0;while(s.phase==='battle'&&n++<12)endTurn(s,rng);
 assert.equal(s.phase,'reward');return s;
}
function injectCard(s,type){
 assert.ok(TRIBAL_SHOP_TYPES.includes(type));
 const id='p'+s.deck.acquired.length;
 s.deck.acquired.push(type);s.deck.acquiredAt.push(s.raid);
 const card={id,type};s.deck.hand.push(card);return card;
}

test('starting Siege has two copies each of Goblin and Skeleton recruit and eight cards in hand',()=>{
 const s=newSiege(rng);
 assert.equal(s.version,8);
 assert.equal(s.deck.tribal,true);
 assert.equal(FOUNDING_CARDS.length,4);
 assert.equal(inventory(s).length,STARTER_DECK.length+FOUNDING_CARDS.length);
 assert.equal(inventory(s).filter(c=>c.type==='goblin-recruit').length,2);
 assert.equal(inventory(s).filter(c=>c.type==='skeleton-recruit').length,2);
 assert.equal(s.deck.hand.length,8);
 assert.ok(validateDeck(s.deck,8,false,2,true,true));
 assert.ok(restoreSiege(structuredClone(s)));
});

test('duplicate recruit cards stack within a single slot and never count twice toward a ritual',()=>{
 const d=makeDeck(rng,true);
 d.acquired.push('goblin-recruit');d.acquiredAt.push(0);
 d.draw.push({id:'p0',type:'goblin-recruit'});
 const all=[...d.draw],ids=['f0','f1','p0'];
 d.hand=ids.map(id=>all.find(c=>c.id===id));d.draw=all.filter(c=>!ids.includes(c.id));
 ids.forEach(id=>assert.equal(queueCard(d,id),true));
 assert.equal(d.chain.length,3);
 assert.equal(chainSlotCount(d.chain),1);
 assert.equal(analyzeChain(d.chain).length,1);
 assert.equal(analyzeChain(d.chain)[0].count,3);
 assert.equal(findRituals(d.chain).length,0);
 assert.ok(validateDeck(d,8,false,2,true));
 assert.equal(unqueueCard(d,'p0'),true);
 assert.equal(chainSlotCount(d.chain),1);
 assert.equal(analyzeChain(d.chain)[0].count,2);
 assert.ok(validateDeck(d,8,false,2,true));
});

test('a fourth identical recruit begins a new stack, not an unlimited horde',()=>{
 const cards=['f0','f1','p0','p1'].map(id=>({id,type:'goblin-recruit'}));
 assert.deepEqual(chainGroups(cards).map(g=>g.count),[3,1]);
 assert.equal(chainSlotCount(cards),2);
});

test('six physical cards may legally occupy five chain slots',()=>{
 const s=newSiege(rng);
 const hand=prepare(s,['goblin-recruit','goblin-recruit','strike','blood','ambush','execute']);
 hand.forEach(c=>assert.equal(queueCommand(s,c.id),true));
 assert.equal(s.deck.chain.length,6);
 assert.equal(chainSlotCount(s.deck.chain),5);
 assert.ok(validateDeck(s.deck,8,false,2,true,true));
 assert.ok(restoreSiege(structuredClone(s)));
});

test('stacking cannot bypass the five-slot limit with unrelated commands',()=>{
 const s=newSiege(rng);
 const hand=prepare(s,['strike','blood','ambush','execute','frenzy','goblin-recruit']);
 hand.slice(0,5).forEach(c=>assert.equal(queueCommand(s,c.id),true));
 assert.equal(canQueueCard(s.deck,hand[5].id),false);
 assert.equal(queueCommand(s,hand[5].id),false);
});

test('queued summon cards create a real, disposable Goblin mob that attacks the chosen lane',()=>{
 const s=newSiege(rng);const hand=prepare(s,['goblin-recruit','goblin-recruit']);
 s.units.forEach(u=>u.lane=2);
 assert.equal(setSummonLane(s,0),true);
 hand.forEach(c=>assert.equal(queueCommand(s,c.id),true));
 endTurn(s,rng);
 assert.equal(liveMinions(s,'goblin',0).length,2);
 assert.equal(s.enemies[0].hp,12); // Both Goblins hit for 2 +1 Pack Tactics.
 assert.equal(s.units.length,4);
 assert.ok(s.minions.every(m=>m.summoned&&m.id.startsWith('m')));
 assert.ok(restoreSiege(structuredClone(s)));
});

test('summoned Goblins absorb enemy retaliation before permanent defenders',()=>{
 const s=newSiege(rng);const hand=prepare(s,['goblin-recruit']);
 assert.equal(setSummonLane(s,0),true);
 const defender=s.units.find(u=>u.species==='skeleton'),oldHp=defender.hp;
 assert.equal(queueCommand(s,hand[0].id),true);
 endTurn(s,rng);
 assert.equal(defender.hp,oldHp);
 assert.equal(liveMinions(s,'goblin',0).length,1);
 assert.equal(liveMinions(s,'goblin',0)[0].hp,1);
});

test('fallen summoned Skeletons produce Bones and cannot kill permanent veteran Skeletons',()=>{
 const s=newSiege(rng);const hand=prepare(s,['skeleton-recruit']);
 assert.equal(setSummonLane(s,0),true);
 const veteran=s.units.find(u=>u.species==='skeleton'),veteranHp=veteran.hp;
 assert.equal(queueCommand(s,hand[0].id),true);
 endTurn(s,rng);
 assert.equal(s.bones,1);
 assert.equal(liveMinions(s,'skeleton',0).length,0);
 assert.equal(veteran.hp,veteranHp);
 assert.equal(veteran.alive,true);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('swarm caps are six total, three per lane, and extra summons cannot overflow',()=>{
 const s=newSiege(rng);
 assert.equal(summonMinions(s,'goblin',6),3);
 assert.equal(summonMinions(s,'skeleton',2),0);
 s.summonLane=0;assert.equal(summonMinions(s,'skeleton',6),3);
 assert.equal(liveMinions(s).length,MAX_MINIONS);
 assert.equal(liveMinions(s,null,1).length,MAX_LANE_MINIONS);
 s.summonLane=2;assert.equal(summonMinions(s,'goblin',4),0);
 assert.ok(validSwarmState(s));
});

test('Bones are capped at six and a revived Skeleton cannot refund Bones on its creation turn',()=>{
 const s=newSiege(rng);
 s.bones=MAX_BONES;
 assert.equal(earnBone(s,{summoned:true,species:'skeleton',boneReadyTurn:s.turn}),false);
 assert.equal(s.bones,MAX_BONES);
 s.bones=2;s.summonLane=0;
 const n=summonMinions(s,'skeleton',1,true);
 assert.equal(n,1);
 assert.equal(s.minions[0].boneReadyTurn,2);
 s.bones-=2;
 assert.equal(earnBone(s,s.minions[0]),false);
 assert.equal(s.bones,0);
 s.turn++;
 assert.equal(earnBone(s,s.minions[0]),true);
 assert.equal(s.bones,1);
});

test('Goblin Pack Attack grants immediate extra strikes but no unbounded loops',()=>{
 const s=newSiege(rng);const pack=injectCard(s,'pack-attack');
 const recruits=prepare(s,['goblin-recruit','goblin-recruit','pack-attack']);
 s.units.forEach(u=>u.lane=2);
 assert.equal(setSummonLane(s,0),true);
 recruits.forEach(c=>assert.equal(queueCommand(s,c.id),true));
 endTurn(s,rng);
 assert.equal(s.enemies[0].hp,4); // 2 pack strikes for 4 each, 2 normal strikes for 3 each
 assert.equal(s.deck.chain.length,0);
});

test('Loot the Fallen pays 3 gold only with an active Goblin and only once per turn',()=>{
 const s=newSiege(rng);injectCard(s,'loot-fallen');
 const hand=prepare(s,['goblin-recruit','loot-fallen']);
 s.units.forEach(u=>u.lane=2);
 hand.forEach(c=>assert.equal(queueCommand(s,c.id),true));
 endTurn(s,rng);
 assert.equal(s.gold,3);
 assert.equal(s.lootClaimedTurn,1);
});

test('Rattle the Dead consumes 2 Bones and cannot create a Bone the same turn it revives',()=>{
 const s=newSiege(rng);injectCard(s,'rattle-dead');
 const hand=prepare(s,['rattle-dead']);
 s.bones=2;s.summonLane=0;
 s.units.forEach(u=>u.lane=2);
 assert.equal(queueCommand(s,hand[0].id),true);
 endTurn(s,rng);
 assert.equal(s.bones,0);
 assert.equal(liveMinions(s,'skeleton').length,0);
});

test('Ossuary Wall spends Bones for armor only in the selected lane',()=>{
 const s=newSiege(rng);injectCard(s,'bone-wall');
 const hand=prepare(s,['bone-wall']);
 s.bones=3;s.summonLane=1;
 s.units.forEach(u=>u.lane=1);
 assert.equal(queueCommand(s,hand[0].id),true);
 endTurn(s,rng);
 assert.equal(s.bones,0);
 assert.ok(s.units.some(u=>u.armor===9));
 assert.ok(s.units.every(u=>u.armor>=0));
});

test('the Quartermaster offers one Goblin and one Skeleton choice for 12 gold',()=>{
 const s=buyShop(newSiege(rng)),offer=s.shopOffers[4];
 assert.equal(s.shopOffers.length,6);
 assert.equal(offer.id,'tribal');assert.equal(offer.cost,12);
 assert.equal(CARDS[offer.options[0]].tribe,'goblin');
 assert.equal(CARDS[offer.options[1]].tribe,'skeleton');
 assert.equal(buyUpgrade(s,'tribal','not-a-card'),false);
 assert.equal(buyUpgrade(s,'tribal',offer.options[0]),true);
 assert.equal(buyUpgrade(s,'tribal',offer.options[1]),false);
 assert.equal(offer.sold,true);
 assert.equal(s.deck.acquired.length,1);
 assert.equal(deckCards(s).length,STARTER_DECK.length+FOUNDING_CARDS.length+1);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('rare and tribal cards can both be bought once in the same shop and kept on reload',()=>{
 const s=buyShop(newSiege(rng));
 s.gold=100;
 assert.equal(buyUpgrade(s,'rare'),true);
 assert.equal(buyUpgrade(s,'tribal',s.shopOffers[4].options[1]),true);
 assert.deepEqual(s.deck.acquiredAt,[0,0]);
 assert.deepEqual(s.deck.acquired.map((type,i)=>'p'+i),['p0','p1']);
 assert.ok(validateDeck(s.deck,8,false,2,true,true));
 assert.ok(restoreSiege(structuredClone(s)));
 assert.equal(reinforce(s,'rest'),true);
 assert.equal(s.deck.acquired.length,2);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('all summoned minions and Bones clear at the end of a raid, while permanent defenders stay',()=>{
 const s=newSiege(rng);
 s.minions.push({id:'m1',species:'skeleton',name:'Raised Skeleton',lane:1,maxHp:3,hp:3,attack:2,armor:0,alive:true,summoned:true,boneReadyTurn:1});
 s.nextMinionId=2;s.bones=4;
 s.units.forEach(u=>{u.attack=80;u.hp=u.maxHp;});
 endTurn(s,rng);
 assert.equal(s.phase,'reward');
 assert.deepEqual(s.minions,[]);assert.equal(s.bones,0);
 assert.equal(s.units.length,4);
 assert.ok(restoreSiege(structuredClone(s)));
});

test('versions 2 through 6 migrate to a 28-card founding deck without losing purchased cards',()=>{
 const orig=newSiege(rng);
 const legacy=structuredClone(orig);
 legacy.version=6;
 for(const key of ['draw','discard','hand','chain'])legacy.deck[key]=legacy.deck[key].filter(c=>!c.id.startsWith('f'));
 legacy.deck.tribal=false;delete legacy.deck.exotic;
 const restored=restoreSiege(legacy);
 assert.ok(restored);
 assert.equal(restored.version,8);
 assert.equal(deckCards(restored).length,28);
 assert.ok(validateDeck(restored.deck,8,false,2,true,true));
 assert.equal(restored.minions.length,0);
 assert.equal(restored.bones,0);
});

test('save validation rejects fabricated minions, extra Bones, bogus population or malformed acquisitions',()=>{
 const s=newSiege(rng);
 const scenarios=[
  v=>v.bones=7,
  v=>v.summonLane=-1,
  v=>v.nextMinionId=0,
  v=>v.minions=[{id:'m1',species:'dragon',alive:true}],
  v=>v.minions=Array.from({length:7},(_,i)=>({id:'m'+(i+1),species:'goblin',name:'Goblin Recruit',lane:1,maxHp:4,hp:4,attack:2,armor:0,alive:true,summoned:true,boneReadyTurn:1})),
  v=>v.deck.draw[0].type='goblin-recruit',
  v=>v.deck.draw.pop(),
  v=>v.deck.acquired=['goblin-recruit','goblin-recruit'],
  v=>v.deck.tribal=false
 ];
 for(const edit of scenarios){
  const bad=structuredClone(s);edit(bad);
  assert.equal(restoreSiege(bad),null);
 }
});

test('v6 reward saves gain exactly one tribal offer without losing rare stock',()=>{
 const s=buyShop(newSiege(rng));
 const rare=structuredClone(s.shopOffers[3]);
 s.version=6;s.shopOffers.pop();s.shopOffers.pop();delete s.deck.exotic;
 for(const pile of ['draw','discard','hand','chain'])s.deck[pile]=s.deck[pile].filter(c=>!c.id.startsWith('f'));
 s.deck.tribal=false;
 const result=restoreSiege(structuredClone(s));
 assert.ok(result);
 assert.equal(result.shopOffers.length,6);
 assert.deepEqual(result.shopOffers[3],rare);
 assert.equal(result.shopOffers[4].id,'tribal');
 assert.equal(result.gold,s.gold);
 assert.ok(validateDeck(result.deck,8,false,2,true,true));
});
test('Bone March scales attacks with stored Bones, not unlimited resources',()=>{
 const s=newSiege(rng);injectCard(s,'bone-march');
 const hand=prepare(s,['skeleton-recruit','bone-march']);
 s.units.forEach(u=>u.lane=2);
 s.summonLane=0;s.bones=2;
 hand.forEach(card=>assert.equal(queueCommand(s,card.id),true));
 endTurn(s,rng);
 assert.equal(s.enemies[0].hp,12); // Bone March 4, normal Skeleton attack 2
 assert.equal(s.bones,3); // Skeleton dies and leaves one Bone
 assert.equal(liveMinions(s,'skeleton').length,0);
});
test('capped formations never produce ghost minions even after queuing three recruits',()=>{
 const s=newSiege(rng);
 s.summonLane=0;
 assert.equal(summonMinions(s,'skeleton',2),2);
 const hand=prepare(s,['goblin-recruit','goblin-recruit']);
 hand.forEach(c=>assert.equal(queueCommand(s,c.id),true));
 endTurn(s,rng);
 assert.ok(liveMinions(s,null,0).length<=3);
 assert.ok(liveMinions(s).length<=6);
 assert.ok(validSwarmState(s));
 assert.ok(restoreSiege(structuredClone(s)));
});
