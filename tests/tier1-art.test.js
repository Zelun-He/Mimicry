import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {CARDS,chainSlotCount,STARTER_DECK,FOUNDING_CARDS} from '../dist/chain-engine.js';
import {RAIDS,newSiege,queueCommand,endTurn} from '../dist/siege-engine.js';
import {SUIT_STYLES,CARD_LORE,cardArt,cardRule} from '../dist/siege/card-art.js';
import {FOREST_SCENES,sceneForRaid,stageProgress,nextActionTip} from '../dist/siege/tier1.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');
test('Tier 1 has a named, authored forest scene for every real raid',()=>{
 assert.equal(FOREST_SCENES.length,RAIDS.length);
 assert.deepEqual(FOREST_SCENES.map(s=>s.id),['sunbreak','fernway','briar','wispwood','watchgate']);
 assert.equal(new Set(FOREST_SCENES.map(s=>s.name)).size,5);
 for(const [i,scene] of FOREST_SCENES.entries()){
  assert.equal(sceneForRaid(i),scene);
  assert.ok(scene.subtitle.length>=40);
  assert.ok(scene.objective.length>=35);
  assert.ok(/^#[0-9a-fA-F]{6}$/.test(scene.color));
 }
 assert.equal(sceneForRaid(-1).id,'sunbreak');
 assert.equal(sceneForRaid(999).id,'watchgate');
});
test('five large SVG scenes are locally hosted, distinct and pixel-crisp',()=>{
 const signatures=new Set();
 for(const scene of FOREST_SCENES){
  const file='dist/siege/scenes/'+scene.id+'.svg';
  assert.ok(existsSync(resolve(root,file)),file);
  const svg=read(file);
  assert.ok(svg.includes('viewBox="0 0 1152 420"'));
  assert.ok(svg.includes('shape-rendering="crispEdges"'));
  assert.ok((svg.match(/<rect\s/g)||[]).length>=300);
  assert.ok(svg.length<60000,'background should remain lightweight');
  assert.ok(!/<image[^>]*href=["']https?:/i.test(svg));
  assert.ok(!svg.includes('<script'));
  signatures.add(svg);
 }
 assert.equal(signatures.size,5);
});
test('all 36 command cards have unique original illustrated markup and readable descriptions',()=>{
 const entries=Object.entries(CARDS);
 assert.equal(entries.length,36);
 const images=new Set();
 for(const [type,card] of entries){
  const art=cardArt(type);
  assert.ok(art.includes('<svg')&&art.includes('</svg>'),type);
  assert.ok(art.includes('shape-rendering="crispEdges"'),type);
  assert.ok(art.includes('aria-label="Illustration of '+card.name+'"'),type);
  assert.ok(art.includes('class="art-figure"'),type);
  assert.ok(art.includes('viewBox="0 0 200 126"'),type);
  assert.ok(!art.includes('<script'),type);
  assert.ok(!art.includes('<foreignObject'),type);
  assert.ok(cardRule(type).length>=18,type);
  assert.ok(CARD_LORE[type].length>=12,type);
  images.add(art);
 }
 assert.equal(images.size,entries.length);
 assert.equal(cardArt('invalid-card'),"");
 assert.equal(cardRule('invalid-card'),"");
});
test('all five card schools use different color identities and symbols',()=>{
 assert.deepEqual(Object.keys(SUIT_STYLES).sort(),['bloom','fang','hunger','shell','venom'].sort());
 assert.equal(new Set(Object.values(SUIT_STYLES).map(s=>s.middle)).size,5);
 assert.equal(new Set(Object.values(SUIT_STYLES).map(s=>s.symbol)).size,5);
 assert.ok(STARTER_DECK.every(type=>CARD_LORE[type]));
 assert.ok(FOUNDING_CARDS.every(type=>CARD_LORE[type]));
});
test('forest progression tracks completed/current/upcoming locations precisely',()=>{
 let progress=stageProgress(0);
 assert.equal(progress.filter(x=>x.current).length,1);
 assert.equal(progress.filter(x=>x.complete).length,0);
 progress=stageProgress(3);
 assert.equal(progress.filter(x=>x.completed).length,3);
 assert.equal(progress.filter(x=>x.current).length,1);
 assert.equal(progress.filter(x=>x.upcoming).length,1);
 progress=stageProgress(4);
 assert.equal(progress.filter(x=>x.upcoming).length,0);
});
test('first-run tips react to player actions without locking game rules or altering state',()=>{
 const s=newSiege(()=>0.5);
 const before=structuredClone(s);
 const initial=nextActionTip(s);
 assert.equal(initial.tag,'FIRST TURN • 1 OF 3');
 assert.deepEqual(s,before);
 const candidate=s.deck.hand.find(c=>CARDS[c.type]?.kind==='summon')||s.deck.hand[0];
 assert.equal(queueCommand(s,candidate.id),true);
 const tip=nextActionTip(s);
 assert.equal(tip.tag,'FIRST TURN • 2 OF 3');
 assert.equal(s.deck.chain.length,1);
 endTurn(s,()=>0.5);
 assert.equal(s.turn>=1,true);
 assert.ok(nextActionTip(s).title.length>0);
});
test('Forest Edge visuals, canvas and original card art return to the active route',()=>{
 const html=read('dist/index.html'),app=read('dist/forest-poker.js');
 const css=read('dist/siege/forest-game.css'),renderer=read('dist/siege/forest-renderer.js');
 assert.ok(html.includes('href="style.css"'));
 assert.ok(html.includes('href="siege/forest-game.css"'));
 assert.ok(html.includes('href="siege/creature-cards.css"'));
 assert.ok(html.includes('id="world"'));
 assert.ok(html.includes('id="hand"'));
 assert.ok(html.includes('id="chain"'));
 assert.ok(html.includes('id="attack"'));
 assert.ok(html.includes('src="forest-poker.js"'));
 assert.ok(css.includes('.battle canvas'));
 assert.ok(renderer.includes('assets/forest.png'));
 assert.ok(renderer.includes('assets/mimic.png'));
 assert.ok(renderer.includes('assets/visitors.png'));
 assert.ok(app.includes('renderBestiaryPortrait(card)'));
 assert.ok(app.includes('createForestBattle'));
});
