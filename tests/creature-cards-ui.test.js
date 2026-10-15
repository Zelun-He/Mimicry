import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CARDS} from '../dist/chain-engine.js';
import {newSiege,queueCommand} from '../dist/siege-engine.js';
import {renderForestHand} from '../dist/siege/forest-hand.js';
import {cardArt} from '../dist/siege/card-art.js';
import {CREATURE_FAMILIES,creatureCardIdentity,creatureCardArt} from '../dist/siege/creature-card-art.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('original user-made sprite board survives as one tiny, indexed local atlas',()=>{
 const png=readFileSync(new URL('../dist/siege/creature-portraits.png',import.meta.url));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),400);
 assert.equal(png.readUInt32BE(20),69);
 assert.equal(png[25],3,'indexed PNG, not a huge resampled screenshot');
 assert.ok(png.length<10000,'one local atlas should stay under 10 KB');
 const gitBlob=Buffer.concat([Buffer.from('blob '+png.length+'\0'),png]);
 assert.equal(createHash('sha1').update(gitBlob).digest('hex'),'d244561af6fdcb30a93f2e1093c7cc32f2ecb9e5');
});

test('all seven creature families get a real portrait identity',()=>{
 const families=['goblin','skeleton','slime-bud','sporeling','king-mimic','spider','mimicling'];
 assert.deepEqual(Object.keys(CREATURE_FAMILIES),families);
 assert.equal(new Set(Object.values(CREATURE_FAMILIES).map(f=>f.name)).size,7);
 assert.deepEqual(
  Object.values(CREATURE_FAMILIES).filter(f=>f.atlasIndex!==undefined).map(f=>f.atlasIndex),
  [0,1,2,3,4]
 );
 assert.equal(CREATURE_FAMILIES.spider.image,'exotic-spider.svg');
 assert.equal(CREATURE_FAMILIES.mimicling.image,'exotic-mimicling.svg');
});

test('every recruit, tribe payoff and relevant royal action inherits its correct creature',()=>{
 for(const [type,card] of Object.entries(CARDS)){
  if(card.tribe){
   const identity=creatureCardIdentity(type);
   assert.ok(identity,type+' is missing its creature-family artwork');
   assert.equal(identity.key,card.tribe==='slime-bud'?'slime':card.tribe,type);
  }
 }
 for(const [type,family] of Object.entries({
  harvest:'sporeling',symbiosis:'sporeling',tithe:'skeleton',
  decree:'king-mimic',feast:'king-mimic',mirror:'king-mimic'
 })){
  assert.equal(creatureCardIdentity(type)?.key,family,type);
 }
 for(const type of ['strike','blood','fortify','bite','regrow']){
  assert.equal(creatureCardIdentity(type),null);
  assert.equal(creatureCardArt(type),cardArt(type),'ordinary action art must stay intact');
 }
});

test('creature art uses the sprite board while Spider and Mimicling keep their authored SVGs',()=>{
 const withAtlas=['goblin-recruit','skeleton-recruit','slime-summon','harvest','decree'];
 for(const type of withAtlas){
  const html=creatureCardArt(type);
  assert.ok(html.includes('creature-art__sprite'),type);
  assert.ok(html.includes('creature-art__sprite--'),type);
  assert.ok(!html.includes('<svg'),type);
  assert.ok(html.includes('role="img"'),type);
  assert.ok(html.includes('creature-art__family'),type);
  assert.ok(!html.includes('http:'),type);
  assert.ok(!html.includes('https:'),type);
 }
 for(const [type,file] of [['spider-summon','exotic-spider.svg'],['family-dinner','exotic-mimicling.svg']]){
  const html=creatureCardArt(type);
  assert.ok(html.includes('<svg'),type);
  assert.ok(html.includes('class="creature-art__illustration"'),type);
  assert.ok(html.includes('viewBox="0 0 16 16"'),type);
  assert.ok(!html.includes('<img'),type);
  assert.ok(!html.includes('src="./siege/'),type);
  assert.ok(!html.includes('creature-art__sprite--'),type);
  assert.ok(read('dist/siege/'+file).includes('<svg'),file);
 }
 assert.equal(creatureCardArt('invalid'),'');
});

test('full opening-style hand remains eight playable buttons and includes creature tags and portraits',()=>{
 const state=newSiege(()=>0.5);
 const types=['goblin-recruit','skeleton-recruit','slime-summon','spider-summon',
   'mimicling-summon','pack-attack','bone-march','strike'];
 state.deck.hand=types.map((type,i)=>({id:'c'+i,type}));
 state.deck.chain=[];
 const html=renderForestHand(state);
 assert.equal((html.match(/class="card /g)||[]).length,8);
 assert.equal((html.match(/data-card-id=/g)||[]).length,8);
 assert.equal((html.match(/creature-art__family/g)||[]).length,7);
 assert.equal((html.match(/class="card-portrait"/g)||[]).length,8);
 for(const family of ['goblin','skeleton','slime','spider','mimicling']){
  assert.ok(html.includes('tribe-'+family),family);
  assert.ok(html.includes('data-tribe="'+family+'"'),family);
 }
 assert.ok(html.includes('data-rarity="uncommon"'));
 assert.ok(html.includes('data-rarity="common"'));
 assert.ok(html.includes('<svg'),'non-creature cards still carry unique illustrations');
 assert.ok(!html.includes('card-play'),'one card surface remains one play action');
});

test('creature art and previews do not alter saved combat or card-link behavior',()=>{
 const state=newSiege(()=>0.5);
 state.deck.hand=[{id:'f0',type:'goblin-recruit'},{id:'f1',type:'goblin-recruit'}];
 const snapshot=structuredClone(state);
 assert.ok(renderForestHand(state).includes('tribe-goblin'));
 assert.deepEqual(state,snapshot);
 assert.equal(queueCommand(state,'f0'),true);
 assert.equal(queueCommand(state,'f1'),true);
 assert.equal(state.deck.chain.length,2);
 assert.equal(state.deck.hand.length,0);
 assert.ok(renderForestHand(state).includes('class="card')===false);
});

test('current battle imports poker assets rather than legacy creature/card modules',()=>{
 const html=read('dist/index.html');
 assert.equal(html,read('dist/siege.html'));
 assert.ok(html.includes('href="demons.css"'));
 assert.ok(html.includes('src="demons.js"'));
 assert.ok(!html.includes('href="siege/creature-cards.css"'));
 assert.ok(!html.includes('src="siege.js"'));
 assert.ok(read('dist/demons.js').includes('toggleCard(state'));
});

test('tribe framing respects link readability, keyboard use and reduced motion',()=>{
 const css=read('dist/siege/creature-cards.css');
 assert.ok(css.includes('background-image:url("./creature-portraits.png")'));
 for(const name of ['goblin','skeleton','slime','sporeling','king-mimic','spider','mimicling']){
  assert.ok(css.includes('.creature-art--'+name),name);
  assert.ok(css.includes('.card.tribe-'+name),name);
 }
 for(const selector of ['.creature-art__sprite--goblin','.creature-art__sprite--skeleton','.creature-art__sprite--slime',
  '.creature-art__sprite--sporeling','.creature-art__sprite--king-mimic',
  '.card.tribe-card:is(:hover,:focus-visible)','.card.tribe-card.card-inactive']){
  assert.ok(css.includes(selector),selector);
 }
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(!css.includes('animation:infinite'));
 const base=read('dist/siege/forest-game.css');
 assert.ok(base.includes('height:228px;min-height:228px'));
 assert.ok(base.includes('height:94px'));
});
