import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('the old cramped dashboard is not imported by the main gameplay route',()=>{
 const index=read('dist/index.html'),siege=read('dist/siege.html');
 assert.equal(index,siege);
 assert.ok(!index.includes('href="siege/combat-clarity.css"'));
 assert.ok(!index.includes('href="siege/tier1.css"'));
 assert.ok(!index.includes('href="siege/link-effects.css"'));
 assert.ok(index.includes('href="style.css"'));
 assert.ok(index.includes('href="siege/forest-game.css"'));
 assert.ok(index.includes('src="siege.js"'));
});

test('the battle canvas and five-slot parchment attack chain are above the hand',()=>{
 const page=read('dist/siege.html');
 const battle=page.indexOf('<section class="battle"');
 const table=page.indexOf('<section class="table"');
 const chain=page.indexOf('id="chain"');
 const hand=page.indexOf('id="hand"');
 assert.ok(battle>=0&&table>battle);
 assert.ok(chain>table&&hand>chain);
 assert.ok(page.includes('<canvas id="world"'));
 assert.ok(page.includes('id="preview"'));
 assert.ok(page.includes('id="redraw"'));
 assert.ok(page.includes('id="attack"'));
 assert.ok(page.includes('class="identity enemy"'));
});

test('combat frame uses original forest pixel sprites instead of status-grid stand-ins',()=>{
 const renderer=read('dist/siege/forest-renderer.js');
 for(const sprite of ['forest.png','mimic.png','visitors.png'])assert.ok(renderer.includes(sprite));
 assert.ok(renderer.includes('const drawBoxes=[]'));
 assert.ok(renderer.includes('function hitTarget('));
 assert.ok(renderer.includes('triggerCard(steps[i])'));
 assert.ok(renderer.includes('ctx.drawImage'));
 assert.ok(renderer.includes('requestAnimationFrame'));
});

test('the compact original tableau preserves full-size cards and responsive hand scrolling',()=>{
 const base=read('dist/style.css');
 const css=read('dist/siege/forest-game.css');
 assert.ok(base.includes('.table{background:#ede7ce'));
 assert.ok(css.includes('grid-template-columns:repeat(8,minmax(0,1fr))'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('scroll-snap-type:x proximity'));
 assert.ok(css.includes('aspect-ratio:960/420'));
 assert.ok(css.includes('border-top:3px solid var(--suit)'));
 assert.ok(css.includes('.chain-slot{height:80px;min-height:80px'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('Mimicry-specific actions survive the art direction restoration',()=>{
 const page=read('dist/index.html'),app=read('dist/siege.js');
 for(const id of ['targets','defenders','gnaw','devour','summon-lane','roster','creature-bestiary','rewards','relics','hunger','bones']){
  assert.ok(page.includes('id="'+id+'"'),id);
 }
 for(const fn of ['targetChain(state','setSummonLane(state','moveUnit(state','endTurn(state','gnaw(state','devour(state','chooseEssence(state','reinforce(state','buyUpgrade(state','redrawCommand(state']){
  assert.ok(app.includes(fn),fn);
 }
 assert.ok(app.includes("KEY='mimicry-siege-v8'"));
 assert.ok(page.includes('href="classic.html"'));
 assert.ok(read('dist/classic.html').includes('src="main.js"'));
});
