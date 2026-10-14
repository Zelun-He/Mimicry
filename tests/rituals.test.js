import test from 'node:test';
import assert from 'node:assert/strict';
import {findRituals,analyzeChain,validateDeck,STARTER_DECK} from '../dist/chain-engine.js';
import {newSiege,targetChain,queueCommand,endTurn,restoreSiege,previewRituals} from '../dist/siege-engine.js';
const rng=()=>0.37;
const cards=(...types)=>types.map((type,i)=>({id:`test-${i}`,type}));
function arrange(s,types){
 const all=[...s.deck.draw,...s.deck.hand,...s.deck.discard,...s.deck.chain];
 s.deck.draw=[];s.deck.hand=[];s.deck.discard=[];s.deck.chain=[];
 for(const type of types){const index=all.findIndex(c=>c.type===type);assert.notEqual(index,-1);s.deck.hand.push(...all.splice(index,1));}
 s.deck.draw=all;
 for(const c of [...s.deck.hand])assert.equal(queueCommand(s,c.id),true);
 assert.ok(validateDeck(s.deck));
}
test('rituals only match exact contiguous school patterns',()=>{
 assert.deepEqual(findRituals(cards('strike','blood','ambush')).map(x=>x.ritual.id),['bloodbath']);
 assert.deepEqual(findRituals(cards('fortify','guard','execute')).map(x=>x.ritual.id),['counteroffensive']);
 assert.deepEqual(findRituals(cards('mend','bite','corrode')).map(x=>x.ritual.id),['toxic-garden']);
 assert.deepEqual(findRituals(cards('decree','bite','corrode')),[]);
 assert.deepEqual(findRituals(cards('strike','mend','blood','ambush')),[]);
});
test('overlapping windows each activate exactly once',()=>{
 const matches=findRituals(cards('strike','blood','ambush','execute'));
 assert.equal(matches.length,2);
 assert.deepEqual(matches.map(x=>x.start),[0,1]);
});
test('invalid targets are rejected and valid targets survive saving',()=>{
 const s=newSiege(rng);assert.equal(targetChain(s,'missing'),false);
 assert.equal(targetChain(s,s.enemies[1].id),true);
 const restored=restoreSiege(structuredClone(s));assert.equal(restored.chainTargetId,s.enemies[1].id);
 assert.equal(targetChain(s,null),true);assert.equal(s.chainTargetId,null);
});
test('living wall ritual grants armor to every living ally',()=>{
 const s=newSiege(rng);arrange(s,['mend','fortify','guard']);
 assert.deepEqual(previewRituals(s).map(x=>x.ritual.id),['living-wall']);
 endTurn(s,rng);
 assert.ok(s.units.find(u=>u.id==='u4').armor>=4); // Lane 3 is not attacked in raid 1
 assert.ok(s.log.some(x=>x.includes('RITUAL: Living Wall')));
 assert.ok(validateDeck(s.deck));
});
test('plague ritual applies poison to all living enemies',()=>{
 const s=newSiege(rng);arrange(s,['bite','corrode','contagion']);
 endTurn(s,rng);
 assert.ok(s.enemies.filter(e=>e.alive).every(e=>e.poison>0));
 assert.ok(s.log.some(x=>x.includes('RITUAL: Plague')));
});
test('focus target chooses a specific enemy over default weakest',()=>{
 const s=newSiege(rng);arrange(s,['strike']);
 const target=s.enemies[1],other=s.enemies[0];
 assert.equal(targetChain(s,target.id),true);
 const hp=target.hp,otherHp=other.hp;
 // Relocate defenders to an empty lane so automatic attacks cannot hit either invader.
 s.units.forEach(u=>u.lane=2);
 endTurn(s,rng);
 assert.ok(target.hp<hp);assert.equal(other.hp,otherHp);
 assert.equal(s.chainTargetId,null);
});
