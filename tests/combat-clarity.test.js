import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Forest Edge artwork and parchment styles are the main route again',()=>{
 const html=read('dist/index.html');
 assert.equal(html,read('dist/siege.html'));
 for(const stylesheet of ['style.css','siege/forest-game.css','siege/creature-cards.css','siege/card-system.css','siege/forest-poker.css']){
  assert.ok(html.includes('href="'+stylesheet+'"'),stylesheet);
 }
 assert.ok(html.includes('src="forest-poker.js"'));
 assert.ok(!html.includes('src="demons.js"'));
 assert.ok(!html.includes('href="demons.css"'));
});
test('restored layout hosts poker combat controls and shop',()=>{
 const html=read('dist/index.html'),app=read('dist/forest-poker.js');
 for(const id of ['world','your-hp','enemy-hp','clock','hand','chain','selected-count','preview','redraw','attack','rewards','outcome','relics','hand-guide','card-inspector']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.indexOf('class="battle"')<html.indexOf('class="table"'));
 for(const fn of ['toggleCard(state','discardSelected(state','attack(state','buySigil(state','advance(state','rest(state']){
  assert.ok(app.includes(fn),fn);
 }
 assert.ok(app.includes("KEY='mimicry-demons-v1'"));
 assert.ok(html.includes('href="classic.html"'));
});
test('grounded forest renderer remains the real animated combat canvas',()=>{
 const app=read('dist/forest-poker.js'),renderer=read('dist/siege/forest-renderer.js');
 assert.ok(app.includes("createForestBattle($('world')"));
 for(const path of ['forest.png','mimic.png','visitors.png'])assert.ok(renderer.includes(path));
 assert.ok(renderer.includes('idleSwayAngle'));
 assert.ok(renderer.includes('ctx.drawImage'));
});
test('old premium illustrated-card design is used with selected poker states',()=>{
 const base=read('dist/siege/card-system.css'),css=read('dist/siege/forest-poker.css');
 assert.ok(base.includes('.card.premium-card'));
 assert.ok(css.includes('.hand>.card.premium-card.poker-card.is-selected'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('poker cards are illustration-first with shared bestiary sprites and no spell art',()=>{
 const js=read('dist/forest-poker.js'),css=read('dist/siege/bestiary-deck.css');
 const start=js.indexOf('function cardHTML(card){'),end=js.indexOf('function renderSelected(){',start);
 const face=js.slice(start,end);
 for(const selector of ['playing-art','playing-index-top','playing-index-bottom','playing-critical','playing-selected']){
  assert.ok(face.includes(selector),selector);
 }
 for(const obsolete of ['card-effect-primary','card-effect-secondary','card-keywords','card-role','card-court','cardArt(type)','creatureCardArt(type)','artType(card)','vial','bloom']){
  assert.ok(!face.includes(obsolete),obsolete);
 }
 assert.ok(face.includes('renderBestiaryPortrait(card)'));
 assert.ok(face.includes('aria-pressed='));
 assert.ok(css.includes('bestiary-hero'));
 assert.ok(css.includes('image-rendering:pixelated'));
});

test('bestiary illustrations preserve original sprite aspect ratio at every rank',()=>{
 const css=read('dist/siege/bestiary-deck.css');
 const app=read('dist/forest-poker.js');
 assert.ok(css.includes('aspect-ratio:80 / 69'));
 assert.ok(css.includes('aspect-ratio:1'));
 assert.ok(css.includes('.bestiary-sprite--goblin'));
 assert.ok(css.includes('.bestiary-sprite--skeleton'));
 assert.ok(css.includes('.bestiary-sprite--slime'));
 assert.ok(css.includes('.bestiary-scene--diamonds'));
 assert.ok(app.includes('bestiaryIdentity(card.suit,card.rank)'));
 assert.ok(app.includes("addEventListener('focusin',inspectCard)"));
});
