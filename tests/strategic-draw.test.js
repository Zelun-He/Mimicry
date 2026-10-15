import test from 'node:test';
import assert from 'node:assert/strict';
import {newSiege,endTurn,restoreSiege} from '../dist/siege-engine.js';
import {recordPlayedChain,strategyFocus,cardDrawWeight,drawSpecializedCards} from '../dist/siege/strategic-draw.js';

const rng=()=>0.42;
const inventory=s=>[...s.deck.hand,...s.deck.chain,...s.deck.draw,...s.deck.discard];
test('opening five cards cover attack, defense, recovery, poison, and summon',()=>{
 const s=newSiege(rng);
 assert.equal(s.deck.hand.length,5);
 const types=s.deck.hand.map(x=>x.type);
 assert.ok(types.some(x=>['strike','blood','ambush','execute'].includes(x)));
 assert.ok(types.some(x=>['fortify','guard','thorns'].includes(x)));
 assert.ok(types.some(x=>['mend','regrow','symbiosis','roots'].includes(x)));
 assert.ok(types.some(x=>['bite','corrode'].includes(x)));
 assert.ok(types.some(x=>x.endsWith('-recruit')));
});
test('early draws retain breadth; late stages prefer practiced cards and their links',()=>{
 const s=newSiege(rng);
 s.schoolUse.fang=12;s.schoolUse.venom=7;
 s.typeUse.strike=5;
 s.raid=0;
 const strike={id:'c0',type:'strike'},mend={id:'c11',type:'mend'};
 assert.equal(strategyFocus(s).primary,'fang');
 assert.ok(cardDrawWeight(s,strike)<=cardDrawWeight(s,mend)*2);
 s.raid=4;
 assert.ok(cardDrawWeight(s,strike)>cardDrawWeight(s,mend));
 assert.ok(cardDrawWeight(s,strike)<cardDrawWeight(s,mend)*5);
});
test('weighted draws preserve inventory, never duplicate IDs, and reproduce with seeded randomness',()=>{
 const a=newSiege(rng),b=newSiege(rng);
 for(const s of [a,b]){
  s.raid=4;s.schoolUse.fang=20;s.schoolUse.venom=10;s.typeUse.strike=8;
  drawSpecializedCards(s,4,rng);
 }
 assert.deepEqual(a.deck,b.deck);
 assert.equal(inventory(a).length,28);
 assert.equal(new Set(inventory(a).map(x=>x.id)).size,28);
});
test('recorded chain develops a strategy and survives save roundtrip',()=>{
 const s=newSiege(rng);
 recordPlayedChain(s,[{type:'strike'},{type:'bite'},{type:'strike'}]);
 assert.equal(s.schoolUse.fang,2);
 assert.equal(s.typeUse.strike,2);
 const roundtrip=restoreSiege(structuredClone(s));
 assert.ok(roundtrip);
 assert.equal(roundtrip.schoolUse.fang,2);
 assert.equal(roundtrip.typeUse.bite,1);
});
test('passing carries unused cards forward and adds exactly one card',()=>{
 const s=newSiege(rng);
 const originals=s.deck.hand.map(x=>x.id);
 endTurn(s,rng);
 if(s.phase==='battle'){
  assert.equal(s.deck.hand.length,6);
  for(const id of originals)assert.ok(s.deck.hand.some(c=>c.id===id));
 }
});
