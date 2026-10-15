import test from 'node:test';
import assert from 'node:assert/strict';
import {deck52,evaluateHand,newBattle,attack,toggleCard,discardSelected,restoreBattle,advance,buySigil,ENCOUNTERS} from '../dist/demons-engine.js';
const c=(r,s)=>({id:s+'-'+r,suit:s,rank:r});
const fixed=()=>0.42;
test('52 unique cards across four original schools',()=>{const deck=deck52();assert.equal(deck.length,52);assert.equal(new Set(deck.map(c=>c.id)).size,52)});
test('poker combinations resolve in ascending tiers',()=>{
 const cases=[
 ['solo',[c(2,'fang')]],
 ['dyad',[c(2,'fang'),c(2,'shell')]],
 ['dyad-set',[c(2,'fang'),c(2,'shell'),c(3,'fang'),c(3,'shell')]],
 ['triad',[c(2,'fang'),c(2,'shell'),c(2,'bloom')]],
 ['march',[c(2,'fang'),c(3,'shell'),c(4,'bloom'),c(5,'fang'),c(6,'venom')]],
 ['horde',[c(2,'fang'),c(5,'fang'),c(7,'fang'),c(9,'fang'),c(11,'fang')]],
 ['warhost',[c(2,'fang'),c(2,'shell'),c(2,'bloom'),c(3,'fang'),c(3,'shell')]],
 ['tetrad',[c(2,'fang'),c(2,'shell'),c(2,'bloom'),c(2,'venom'),c(6,'fang')]],
 ['marching-horde',[c(3,'fang'),c(4,'fang'),c(5,'fang'),c(6,'fang'),c(7,'fang')]],
 ['mimics-hand',[c(10,'fang'),c(11,'fang'),c(12,'fang'),c(13,'fang'),c(14,'fang')]]
 ];let before=0;for(const [kind,cards] of cases){const hand=evaluateHand(cards);assert.equal(hand.type,kind);assert.ok(hand.damage>before);before=hand.damage;}
});
test('attacks consume selection, draw replacements, preserve inventory',()=>{
 const s=newBattle(fixed);const first=s.hand[0].id;toggleCard(s,first);const dealt=attack(s,fixed);
 assert.ok(dealt);assert.equal(s.selected.length,0);assert.equal(s.hand.length,8);
 assert.equal([...s.hand,...s.deck,...s.discard].length,52);
 assert.ok(restoreBattle(structuredClone(s)));
});
test('discard is capped and does not advance retaliation',()=>{
 const s=newBattle(fixed);const clock=s.enemyClock;
 for(let i=0;i<3;i++){toggleCard(s,s.hand[0].id);assert.equal(discardSelected(s,fixed),true);}
 toggleCard(s,s.hand[0].id);assert.equal(discardSelected(s,fixed),false);
 assert.equal(s.enemyClock,clock);assert.equal(s.discardsLeft,0);
});
test('progression and upgrades preserve valid deck, shop cannot overspend',()=>{
 const s=newBattle(fixed);s.enemyHp=1;toggleCard(s,s.hand[0].id);attack(s,fixed);
 assert.equal(s.phase,'reward');assert.equal(buySigil(s,'royal'),false);
 assert.equal(buySigil(s,'teeth'),true);assert.equal(buySigil(s,'teeth'),false);
 assert.equal(advance(s,fixed),true);assert.equal(s.encounter,1);
 assert.equal(s.enemyHp,ENCOUNTERS[1].hp);assert.ok(restoreBattle(structuredClone(s)));
});
test('save validation rejects injected cards and invalid selection',()=>{
 const s=newBattle(fixed);const bad=structuredClone(s);bad.hand[0].rank=100;assert.equal(restoreBattle(bad),null);
 const dup=structuredClone(s);dup.hand[0].id=dup.hand[1].id;assert.equal(restoreBattle(dup),null);
});
