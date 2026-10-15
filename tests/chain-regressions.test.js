import test from 'node:test';
import assert from 'node:assert/strict';
import {newSiege,endTurn,restoreSiege,targetChain} from '../dist/siege-engine.js';
import {STARTER_DECK,FOUNDING_CARDS} from '../dist/chain-engine.js';
const rng=()=>0.5;
test('passing with no queued commands still cycles hand and preserves cards',()=>{
 const s=newSiege(rng);
 const initial=s.deck.hand.map(c=>c.id);
 endTurn(s,rng);
 assert.equal(s.deck.chain.length,0);
 assert.equal(s.deck.hand.length,6);
 assert.equal(s.deck.discardsLeft,2);
 assert.ok(initial.every(id=>s.deck.hand.some(c=>c.id===id)));
 assert.equal([...s.deck.draw,...s.deck.discard,...s.deck.hand,...s.deck.chain].length,STARTER_DECK.length+FOUNDING_CARDS.length);
});
test('restoring a save rejects stale target ids',()=>{
 const s=newSiege(rng);s.chainTargetId='not-a-real-enemy';
 assert.equal(restoreSiege(structuredClone(s)),null);
});
test('targeting cannot select a dead enemy',()=>{
 const s=newSiege(rng);s.enemies[0].hp=0;s.enemies[0].alive=false;
 assert.equal(targetChain(s,s.enemies[0].id),false);
});
