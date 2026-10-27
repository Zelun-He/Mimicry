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
