import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {newSiege,queueCommand,unqueueCommand} from '../dist/siege-engine.js';
import {CARDS} from '../dist/chain-engine.js';
import {renderForestHand,renderForestChain,renderForestPrediction,predictBaseEffects,escapeHTML} from '../dist/siege/forest-hand.js';
import {visitorSpriteIndex,featuredInvader,livingInvaders,damageSummary,SCHOOL_COLOR} from '../dist/siege/forest-renderer.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const sample=()=>newSiege(()=>0.5);

test('index and siege URLs expose the poker battle and preserve classic prototype',()=>{
 const index=read('dist/index.html'),siege=read('dist/siege.html');
 assert.equal(index,siege);
 for(const id of ['hand','attack','discard','clock','enemy-name','enemy-health','shop','continue','overlay']){
  assert.ok(index.includes('id="'+id+'"'),id);
 }
 assert.ok(index.includes('href="demons.css"'));
 assert.ok(index.includes('src="demons.js"'));
 assert.ok(read('dist/classic.html').includes('src="main.js"'));
});

test('existing original pixel sprites and forest background remain included',()=>{
 for(const file of ['dist/assets/forest.png','dist/assets/mimic.png','dist/assets/visitors.png',
  'dist/siege/sprites/goblin.png','dist/siege/sprites/slime.png','dist/siege/sprites/skeleton.png','dist/siege/sprites/sporeling.png']){
  assert.ok(existsSync(resolve(root,file)),file);
 }
 const draw=read('dist/siege/forest-renderer.js');
 assert.ok(draw.includes('assets/forest.png'));
 assert.ok(draw.includes('assets/mimic.png'));
 assert.ok(draw.includes('assets/visitors.png'));
 assert.ok(draw.includes('ctx.drawImage'));
 assert.ok(draw.includes('requestAnimationFrame'));
 assert.ok(draw.includes('async function replay('));
 assert.ok(draw.includes('triggerCard(steps[i])'));
});

test('all eight cards remain visible with school/rank, card art and one-click interaction',()=>{
 const s=sample(),html=renderForestHand(s);
 assert.equal((html.match(/class="card /g)||[]).length,5);
 assert.equal((html.match(/data-card-id=/g)||[]).length,5);
 assert.equal((html.match(/card-rank/g)||[]).length,5);
 assert.equal((html.match(/card-symbol/g)||[]).length,5);
 assert.equal((html.match(/card-portrait/g)||[]).length,5);
 assert.equal((html.match(/card-name/g)||[]).length,5);
 assert.equal((html.match(/class="card-effect"/g)||[]).length,5);
 assert.equal((html.match(/card-link/g)||[]).length,5);
 assert.ok(html.includes('<svg'));
 assert.ok(html.includes('data-link-kind='));
 assert.ok(!html.includes('card-play'));
});

test('five original-looking chain slots stay compact and stacking uses just one slot',()=>{
 const s=sample();
 let html=renderForestChain(s);
 assert.equal((html.match(/class="chain-slot"/g)||[]).length,5);
 assert.equal((html.match(/data-unqueue/g)||[]).length,0);
 const card=s.deck.hand[0];
 assert.equal(queueCommand(s,card.id),true);
 html=renderForestChain(s);
 assert.equal((html.match(/class="chain-slot filled/g)||[]).length,1);
 assert.equal((html.match(/class="chain-slot"/g)||[]).length,4);
 assert.ok(html.includes('data-unqueue='));
 assert.ok(html.includes('chain-crest'));
 assert.ok(html.includes('chain-number'));
 assert.ok(html.includes(CARDS[card.type].rank?.toString()||'★'));
 assert.equal(unqueueCommand(s,card.id),true);
 assert.equal(s.deck.chain.length,0);
});

test('prediction panel expresses raw card power, armor, healing and poison separately',()=>{
 const s=sample();
 const empty=predictBaseEffects(s);
 assert.deepEqual(Object.keys(empty),['power','armor','heal','poison','return']);
 assert.equal(empty.power,0);
 assert.ok(empty.return>0);
 const html=renderForestPrediction(s);
 for(const key of ['power','armor','heal','poison','incoming'])assert.ok(html.includes(key));
 assert.equal(escapeHTML('<script>'), '&lt;script&gt;');
});

test('multiple actual Siege invaders retain individual identities and focus',()=>{
 const s=sample();
 assert.equal(livingInvaders(s).length,2);
 assert.equal(featuredInvader(s).name,'Farmhand');
 s.chainTargetId=s.enemies[1].id;
 assert.equal(featuredInvader(s).name,'Forager');
 assert.equal(visitorSpriteIndex('Farmhand'),0);
 assert.equal(visitorSpriteIndex('Forager'),1);
 assert.equal(visitorSpriteIndex('Watchman'),4);
 assert.equal(visitorSpriteIndex('Rogue'),2);
 assert.equal(new Set(Object.values(SCHOOL_COLOR)).size,5);
 const before=structuredClone(s);
 s.enemies[1].hp-=5;
 assert.deepEqual(damageSummary(before,s),[{id:s.enemies[1].id,name:'Forager',damage:5}]);
});

test('active poker hand uses accessible, responsive card styling',()=>{
 const css=read('dist/demons.css'),html=read('dist/index.html');
 assert.ok(css.includes('.poker-card'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(html.indexOf('class="battlefield"')<html.indexOf('id="hand"'));
});
