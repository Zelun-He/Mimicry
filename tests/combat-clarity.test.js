import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('index and siege route share the new poker battle, not removed chain UI',()=>{
 const html=read('dist/index.html');
 assert.equal(html,read('dist/siege.html'));
 assert.ok(html.includes('href="demons.css"'));
 assert.ok(html.includes('src="demons.js"'));
 assert.ok(!html.includes('src="siege.js"'));
 assert.ok(!html.includes('href="style.css"'));
});
test('poker page provides actionable cards, countdown, upgrades and end states',()=>{
 const page=read('dist/siege.html'),app=read('dist/demons.js');
 for(const id of ['enemy-hp','your-hp','clock','hand','selected-count','preview-name','preview-damage','discard','attack','shop','continue','rest','again','overlay']){
  assert.ok(page.includes('id="'+id+'"'),id);
 }
 for(const action of ['toggleCard(state','discardSelected(state','attack(state','buySigil(state','advance(state','rest(state']){
  assert.ok(app.includes(action),action);
 }
 assert.ok(page.indexOf('class="battlefield"')<page.indexOf('class="gameboard"'));
 assert.ok(app.includes("KEY='mimicry-demons-v1'"));
});
test('the archived forest renderer still keeps its pixel-sprite draw logic',()=>{
 const renderer=read('dist/siege/forest-renderer.js');
 for(const sprite of ['forest.png','mimic.png','visitors.png'])assert.ok(renderer.includes(sprite));
 assert.ok(renderer.includes('ctx.drawImage'));
});
test('active cards support focus, mobile scrolling, reduced motion',()=>{
 const css=read('dist/demons.css');
 assert.ok(css.includes('.poker-card.chosen'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('@media(max-width:500px)'));
});
