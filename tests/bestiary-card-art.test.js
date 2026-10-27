import test from 'node:test';
import assert from 'node:assert/strict';
import {deck52} from '../dist/demons-engine.js';
import {BESTIARY_FACTIONS,bestiaryIdentity,renderBestiaryPortrait} from '../dist/siege/bestiary-deck-art.js';

test('every standard playing card has an original bestiary creature portrait',()=>{
 const cards=deck52();
 assert.equal(cards.length,52);
 const rendered=cards.map(card=>renderBestiaryPortrait(card));
 assert.equal(rendered.length,52);
 for(let i=0;i<cards.length;i++){
  const c=cards[i],art=rendered[i],identity=bestiaryIdentity(c.suit,c.rank);
  assert.ok(identity,c.id);
  assert.ok(art.includes('bestiary-scene--'+c.suit),c.id);
  assert.ok(art.includes('data-bestiary-species='),c.id);
  assert.ok(art.includes('bestiary-hero'),c.id);
  assert.ok(art.includes('bestiary-environment'),c.id);
  assert.ok(!/<(?:img|script|style)\b/i.test(art),c.id);
  assert.ok(!/potion|vial|flower|rose|bloom|<text\b/i.test(art),c.id);
 }
 assert.equal(new Set(rendered).size,52,'each rank gets a distinct scene');
});

test('suits have a coherent creature identity and rank-based progression',()=>{
 assert.deepEqual(Object.keys(BESTIARY_FACTIONS),['spades','clubs','hearts','diamonds']);
 for(const suit of Object.keys(BESTIARY_FACTIONS)){
  assert.equal(BESTIARY_FACTIONS[suit].species.length,13);
  assert.equal(bestiaryIdentity(suit,2).tier,'scout');
  assert.equal(bestiaryIdentity(suit,5).tier,'warband');
  assert.equal(bestiaryIdentity(suit,8).tier,'veteran');
  assert.equal(bestiaryIdentity(suit,11).tier,'royal');
  assert.equal(bestiaryIdentity(suit,14).tier,'royal');
  assert.ok(renderBestiaryPortrait({suit,rank:11}).includes('bestiary-crest'));
  assert.ok(renderBestiaryPortrait({suit,rank:4}).includes('bestiary-sprite')||
    renderBestiaryPortrait({suit,rank:4}).includes('creature-art__illustration'));
 }
});

test('bestiary art rejects invalid ranks and suits and remains independent of combat',()=>{
 assert.equal(bestiaryIdentity('hearts',1),null);
 assert.equal(bestiaryIdentity('joker',14),null);
 assert.equal(bestiaryIdentity('diamonds',NaN),null);
 assert.equal(renderBestiaryPortrait({suit:'spades',rank:15}),'');
 assert.equal(renderBestiaryPortrait({suit:'joker',rank:9}),'');
 assert.equal(renderBestiaryPortrait(null),'');
});
