import test from 'node:test';
import assert from 'node:assert/strict';
import {
 SUITS,SUIT_SYMBOLS,deck52,evaluateHand,newBattle,attack,toggleCard,
 discardSelected,restoreBattle,advance,buySigil,ENCOUNTERS,sortHand,
 deckOverview,rest,cardValue,criticalChance,deal
} from '../dist/demons-engine.js';
const c=(r,s,critical=false)=>({id:s+'-'+r,suit:s,rank:r,critical});
const fixed=()=>0.42;
test('standard deck is precisely 52 unique 2–A cards and four traditional suits',()=>{
 assert.deepEqual(SUITS,['hearts','diamonds','clubs','spades']);
 assert.deepEqual(SUIT_SYMBOLS,{hearts:'♥',diamonds:'♦',clubs:'♣',spades:'♠'});
 const cards=deck52();
 assert.equal(cards.length,52);
 assert.equal(new Set(cards.map(x=>x.id)).size,52);
 for(const suit of SUITS)assert.deepEqual(cards.filter(x=>x.suit===suit).map(x=>x.rank),Array.from({length:13},(_,i)=>i+2));
});
test('all ten hand ranks resolve using real poker rank and suit rules',()=>{
 const cases=[
 ['solo',[c(2,'hearts')]],
 ['dyad',[c(2,'hearts'),c(2,'spades')]],
 ['dyad-set',[c(2,'hearts'),c(2,'spades'),c(3,'hearts'),c(3,'spades')]],
 ['triad',[c(2,'hearts'),c(2,'spades'),c(2,'clubs')]],
 ['march',[c(2,'hearts'),c(3,'spades'),c(4,'clubs'),c(5,'hearts'),c(6,'diamonds')]],
 ['horde',[c(2,'spades'),c(5,'spades'),c(7,'spades'),c(9,'spades'),c(11,'spades')]],
 ['warhost',[c(2,'hearts'),c(2,'spades'),c(2,'clubs'),c(3,'hearts'),c(3,'spades')]],
 ['tetrad',[c(2,'hearts'),c(2,'spades'),c(2,'clubs'),c(2,'diamonds'),c(6,'hearts')]],
 ['marching-horde',[c(3,'spades'),c(4,'spades'),c(5,'spades'),c(6,'spades'),c(7,'spades')]],
 ['mimics-hand',[c(10,'spades'),c(11,'spades'),c(12,'spades'),c(13,'spades'),c(14,'spades')]]
 ];
 let before=0;
 for(const [type,cards] of cases){
  const score=evaluateHand(cards);
  assert.equal(score.type,type);
  assert.ok(score.damage>before,score.label);before=score.damage;
 }
});
test('unused selected cards are discarded without contributing to damage',()=>{
 const selected=[c(8,'hearts'),c(8,'clubs'),c(10,'diamonds'),c(12,'spades'),c(14,'hearts')];
 const score=evaluateHand(selected);
 assert.equal(score.type,'dyad');
 assert.deepEqual(new Set(score.contributingIds),new Set(['hearts-8','clubs-8']));
 assert.equal(score.value,16);
 assert.equal(score.damage,36);
 assert.equal(score.unusedIds.length,3);
 const junk=evaluateHand([c(2,'hearts'),c(6,'spades'),c(8,'diamonds'),c(11,'clubs'),c(14,'hearts')]);
 assert.equal(junk.type,'solo');
 assert.equal(junk.contributingIds.length,1);
 assert.equal(junk.value,11);assert.equal(junk.damage,21);
});
test('Ace can be low in A2345, court cards add ten each, Ace eleven',()=>{
 const wheel=evaluateHand([c(14,'spades'),c(2,'hearts'),c(3,'diamonds'),c(4,'clubs'),c(5,'spades')]);
 assert.equal(wheel.type,'march');
 assert.equal(cardValue(c(11,'spades')),10);
 assert.equal(cardValue(c(12,'spades')),10);
 assert.equal(cardValue(c(13,'spades')),10);
 assert.equal(cardValue(c(14,'spades')),11);
});
test('critical multipliers apply only to scoring cards, after sigil bonuses',()=>{
 const cards=[c(8,'hearts',true),c(8,'clubs'),c(5,'diamonds',true)];
 const a=evaluateHand(cards),b=evaluateHand(cards,['teeth']);
 assert.equal(a.criticalCount,1);
 assert.equal(a.damage,Math.floor((20+16)*1.25));
 assert.equal(b.damage,Math.floor((20+16+15)*1.25));
 const single=evaluateHand([c(14,'spades',true)]);
 assert.equal(single.criticalCount,1);
});
test('draw creates critical cards deterministically and preserves 52-card inventory',()=>{
 const s=newBattle(fixed);
 assert.equal(s.hand.length,8);
 assert.equal(s.hand.some(c=>c.critical),false);
 const all=[...s.hand,...s.deck,...s.discard];
 assert.equal(all.length,52);
 assert.equal(new Set(all.map(c=>c.id)).size,52);
 const crit=newBattle(()=>0);
 assert.ok(crit.hand.every(c=>c.critical));
 assert.equal(criticalChance(crit),0.05);
 crit.sigils.push('luck');
 assert.equal(criticalChance(crit),0.15);
});
test('attack consumes selected cards, redraws same number, tracks enemy countdown',()=>{
 const s=newBattle(fixed);const card=s.hand[0].id;
 toggleCard(s,card);const result=attack(s,fixed);
 assert.ok(result);assert.equal(s.selected.length,0);
 assert.equal(s.hand.length,8);
 assert.equal(s.enemyClock,2);
 assert.equal([...s.hand,...s.deck,...s.discard].length,52);
 assert.ok(restoreBattle(structuredClone(s)));
});
test('discard exchanges at most five, never advances countdown and is capped at three',()=>{
 const s=newBattle(fixed),clock=s.enemyClock;
 for(let i=0;i<3;i++){toggleCard(s,s.hand[0].id);assert.equal(discardSelected(s,fixed),true);}
 toggleCard(s,s.hand[0].id);assert.equal(discardSelected(s,fixed),false);
 assert.equal(s.enemyClock,clock);assert.equal(s.discardsLeft,0);
});
test('sorting changes order and clears selected cards; deck overview accounts for 52',()=>{
 const s=newBattle(fixed);
 toggleCard(s,s.hand[0].id);
 assert.ok(sortHand(s,'suit'));assert.equal(s.selected.length,0);assert.equal(s.sortMode,'suit');
 const ranks=deckOverview(s);
 const total=Object.values(ranks).reduce((n,pile)=>n+Object.values(pile).reduce((m,suit)=>m+Object.values(suit).reduce((a,b)=>a+b,0),0),0);
 assert.equal(total,52);
 assert.ok(sortHand(s,'rank'));assert.equal(s.sortMode,'rank');
});
test('win rewards sigils, permits a single rest and resets state for the next encounter',()=>{
 const s=newBattle(fixed);
 s.hp=40;s.enemyHp=1;toggleCard(s,s.hand[0].id);attack(s,fixed);
 assert.equal(s.phase,'reward');assert.equal(buySigil(s,'royal'),false);
 assert.equal(buySigil(s,'teeth'),true);assert.equal(buySigil(s,'teeth'),false);
 assert.equal(rest(s),true);assert.equal(s.hp,62);assert.equal(rest(s),false);
 assert.ok(restoreBattle(structuredClone(s)));
 assert.equal(advance(s,fixed),true);assert.equal(s.encounter,1);
 assert.equal(s.enemyHp,ENCOUNTERS[1].hp);assert.equal(s.rested,false);
 assert.ok(restoreBattle(structuredClone(s)));
});
test('old fantasy-suit poker saves migrate to classic deck without losing cards',()=>{
 const s=newBattle(fixed),map={hearts:'bloom',diamonds:'venom',clubs:'shell',spades:'fang'};
 s.selected=[s.hand[0].id];
 const legacy=structuredClone(s);legacy.version=1;
 for(const pile of ['hand','deck','discard'])legacy[pile]=legacy[pile].map(card=>({
  ...card,id:map[card.suit]+'-'+card.rank,suit:map[card.suit]
 }));
 legacy.selected=legacy.selected.map(id=>map[id.split('-')[0]]+'-'+id.split('-')[1]);
 delete legacy.sortMode;delete legacy.rested;
 const result=restoreBattle(legacy);
 assert.ok(result);assert.equal(result.version,2);
 assert.equal(result.selected.length,1);
 assert.equal([...result.hand,...result.deck,...result.discard].length,52);
});
test('restore validation rejects fabricated cards, duplicate IDs, bad critical markers',()=>{
 const s=newBattle(fixed);
 for(const mutate of [
  bad=>{bad.hand[0].rank=100;},
  bad=>{bad.hand[0].id=bad.hand[1].id;},
  bad=>{bad.hand[0].critical='yes';},
  bad=>{bad.selected=[bad.deck[0].id];},
  bad=>{bad.rested='wrong';}
 ]){
  const bad=structuredClone(s);mutate(bad);assert.equal(restoreBattle(bad),null);
 }
});
