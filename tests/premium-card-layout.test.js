import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARDS,chainGroups} from '../dist/chain-engine.js';
import {newSiege,queueCommand} from '../dist/siege-engine.js';
import {renderForestHand,renderForestChain} from '../dist/siege/forest-hand.js';
import {CARD_PRESENTATION,CARD_ROLES,presentationFor,cardVisualIdentity,cardFullRules,payoffReady} from '../dist/siege/card-presentation.js';
import {renderCardFace,cardFaceClass,renderShopCardPreview,cardInspectorText} from '../dist/siege/card-face.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('every playable card has an authored role, main effect, subtext and gameplay keywords',()=>{
 const names=Object.keys(CARDS);
 assert.equal(names.length,36);
 assert.deepEqual(Object.keys(CARD_PRESENTATION).sort(),names.sort());
 assert.ok(CARD_ROLES.includes('SUMMON'));
 assert.ok(CARD_ROLES.includes('FINISHER'));
 assert.ok(CARD_ROLES.includes('GUARD'));
 assert.ok(CARD_ROLES.includes('PAYOFF'));
 assert.ok(CARD_ROLES.includes('LEGENDARY'));
 for(const type of names){
  const card=CARDS[type],m=presentationFor(type),view=cardVisualIdentity(type);
  assert.ok(m&&view,type);
  assert.ok(m.primary.length>=9&&m.primary.length<85,type+' main');
  assert.ok(m.secondary.length>=9&&m.secondary.length<115,type+' detail');
  assert.ok(m.keywords.length===2&&m.keywords.every(k=>k.length>=3&&k.length<=15),type+' tags');
  assert.equal(view.rank,card.rank||'★');
  assert.equal(view.cost,card.cost||0);
  assert.equal(view.school,card.suit);
  assert.equal(view.role,m.role);
  assert.equal(view.rarity,card.rarity||'common');
  assert.ok(cardFullRules(type).length>=10);
 }
 assert.equal(presentationFor('__unknown'),null);
 assert.equal(cardVisualIdentity('__unknown'),null);
});

test('large card numeral is labeled LINK and never described as mana or cost',()=>{
 const name=renderCardFace('ambush');
 assert.ok(name.includes('card-rank'));
 assert.ok(name.includes('>3<small>LINK</small>'));
 assert.ok(name.includes('card-effect-primary'));
 assert.ok(name.includes('Deal 7 damage'));
 assert.ok(!name.includes('card-resource'));
 const feast=renderCardFace('feast');
 assert.ok(feast.includes('>★<small>WILD</small>'));
 assert.ok(feast.includes('◆ 40 HUNGER'));
 assert.ok(feast.includes('Spend 40 Hunger.'));
 const mirror=renderCardFace('mirror');
 assert.ok(mirror.includes('◆ 20 HUNGER'));
 assert.ok(mirror.includes('card-rarity'));
 assert.ok(mirror.includes('LEGENDARY'));
 const decree=renderCardFace('decree');
 assert.ok(decree.includes('◆ 30 HUNGER'));
 assert.ok(!name.includes('◆ 3 HUNGER'));
});

test('visual vocabulary separates attacks, guards, summons, engines and royal finishers',()=>{
 const types={
  ambush:'card-attack',fortify:'card-defense',mend:'card-recovery',
  'goblin-recruit':'card-summon','pack-attack':'card-engine',mirror:'card-finisher'
 };
 for(const [type,cls] of Object.entries(types)){
  assert.ok(cardFaceClass(type).includes(cls),type);
  assert.ok(cardFaceClass(type).includes('role-'),type);
 }
 assert.ok(cardFaceClass('goblin-recruit').includes('tribe-goblin'));
 assert.ok(cardFaceClass('skeleton-recruit').includes('tribe-skeleton'));
 assert.ok(cardFaceClass('spider-summon').includes('tribe-spider'));
 assert.ok(cardFaceClass('mirror').includes('rarity-legendary'));
});

test('eight-card opening view shows eight different roles, no universal START banner',()=>{
 const state=newSiege(()=>0.5);
 const types=['detonate','fortify','symbiosis','feast','skeleton-recruit','mend','ambush','guard'];
 state.deck.hand=types.map((type,i)=>({id:'t'+i,type}));
 state.deck.chain=[];
 const html=renderForestHand(state);
 assert.equal((html.match(/<button type="button" class="card /g)||[]).length,8);
 assert.equal((html.match(/class="card-name"/g)||[]).length,8);
 assert.equal((html.match(/class="card-effect"/g)||[]).length,8);
 assert.equal((html.match(/class="card-effect-primary"/g)||[]).length,8);
 assert.equal((html.match(/class="card-portrait"/g)||[]).length,8);
 assert.equal((html.match(/class="card-keywords"/g)||[]).length,8);
 assert.equal((html.match(/class="card-role"/g)||[]).length,8);
 assert.equal((html.match(/class="card-link"/g)||[]).length,8);
 assert.ok(html.includes('FINISHER'));
 assert.ok(html.includes('GUARD'));
 assert.ok(html.includes('RECOVERY'));
 assert.ok(html.includes('SUMMON'));
 assert.ok(html.includes('LINKER'));
 assert.ok(!html.includes('◇ START'));
 assert.ok(!html.includes('class="card-link-status">START'));
 assert.ok(!html.includes('PLAY CARD'));
 assert.ok(html.includes('data-card-id="t0"'));
 assert.ok(html.includes('data-rarity="common"'));
});

test('link states change only as the player builds the chain; role identity remains stable',()=>{
 const s=newSiege(()=>0.5);
 s.deck.hand=[{id:'t1',type:'strike'},{id:'t2',type:'blood'},
  {id:'t3',type:'fortify'},{id:'t4',type:'mirror'}];
 s.deck.chain=[];
 const before=renderForestHand(s);
 assert.ok(!before.includes('class="card-link-status"'));
 assert.equal(queueCommand(s,'t1'),true);
 const after=renderForestHand(s);
 assert.ok(after.includes('class="card-link-status"'));
 assert.ok(after.includes('NO LINK'));
 assert.ok(after.includes('data-link-kind='));
 assert.ok(after.includes('data-role="'));
 assert.equal(chainGroups(s.deck.chain).length,1);
 assert.ok(renderForestChain(s).includes('data-unqueue='));
});

test('discard uses a separate explicit state and enables a redrawn card even if it cannot link',()=>{
 const s=newSiege(()=>0.5);
 s.deck.hand=[{id:'a',type:'strike'},{id:'b',type:'fortify'},{id:'c',type:'mirror'}];
 s.deck.chain=[];
 assert.equal(queueCommand(s,'a'),true);
 const ordinary=renderForestHand(s);
 const redraw=renderForestHand(s,{discardMode:true});
 assert.ok(ordinary.includes('data-card-id="b"'));
 assert.ok(redraw.includes('is-discarding'));
 assert.equal((redraw.match(/aria-disabled="false"/g)||[]).length,2);
 assert.ok(redraw.includes('REDRAW'));
 assert.ok(!redraw.includes('class="card-link-status">START'));
 assert.equal(s.deck.discardsLeft,2);
});

test('the illustrated shop card preview reuses every rules section, not just a stretched image',()=>{
 const html=renderShopCardPreview('spider-summon');
 assert.ok(html.startsWith('<div class="card premium-card'));
 assert.ok(html.includes('shop-card-face'));
 assert.ok(html.includes('role="group"'));
 assert.ok(html.includes('card-effect-primary'));
 assert.ok(html.includes('card-rarity')===false);
 assert.ok(html.includes('class="card-keywords"'));
 assert.ok(html.includes('class="card-role"'));
 assert.ok(html.includes('creature-art--spider'));
 assert.ok(html.includes('<svg'));
 assert.ok(!html.includes('src="./siege/exotic-spider.svg"'));
 const rare=renderShopCardPreview('mirror');
 assert.ok(rare.includes('LEGENDARY'));
 assert.ok(rare.includes('HUNGER'));
 assert.ok(rare.includes('Spend 20 Hunger.'));
 assert.equal(renderShopCardPreview('missing'),'');
 assert.ok(cardInspectorText('ambush').includes('Deal 7 damage.'));
});

test('premium CSS is loaded after original school and creature styles, with responsive hand and reduced motion',()=>{
 const index=read('dist/index.html'),siege=read('dist/siege.html'),css=read('dist/siege/card-system.css');
 assert.equal(index,siege);
 assert.ok(index.includes('id="card-inspector"'));
 const start=index.indexOf('href="siege/creature-cards.css"');
 const end=index.indexOf('href="siege/card-system.css"');
 assert.ok(start>0&&end>start);
 assert.ok(css.includes('grid-template-columns:repeat(8,minmax(0,1fr))'));
 assert.ok(css.includes('max-width:166px'));
 assert.ok(css.includes('.shop-card-face.card'));
 assert.ok(css.includes('.card-inspector'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(!css.includes('animation:infinite'));
 const js=read('dist/siege.js');
 assert.ok(js.includes('renderShopCardPreview(previewType,{artFor})'));
 assert.ok(js.includes('renderShopCardPreview(select.value,{artFor})'));
 assert.ok(js.includes('renderForestHand(state,{artFor,ruleFor:cardRule,discardMode})'));
 assert.ok(js.includes('showCardInspection'));
});

test('combo-ready marker appears only with live, visible prerequisites and does not mutate state',()=>{
 const s=newSiege(()=>0.5),snapshot=structuredClone(s);
 assert.equal(payoffReady(s,'detonate'),false);
 assert.equal(payoffReady(s,'feast'),false);
 assert.equal(payoffReady(s,'pack-attack'),false);
 assert.equal(payoffReady(s,'mirror'),false);
 assert.deepEqual(s,snapshot);
 s.enemies[0].poison=3;
 assert.equal(payoffReady(s,'detonate'),true);
 assert.equal(payoffReady(s,'harvest'),true);
 assert.equal(payoffReady(s,'contagion'),true);
 s.hunger=50;
 assert.equal(payoffReady(s,'feast'),true);
 s.deck.hand=[{id:'c0',type:'detonate'}];
 assert.ok(renderForestHand(s).includes('class="card-ready-marker">COMBO READY'));
 s.pendingEssence={};
 assert.equal(payoffReady(s,'detonate'),false);
});

test('shop presentations never change deterministic card stats or current save shape',()=>{
 const s=newSiege(()=>0.5),before=structuredClone(s);
 for(const type of Object.keys(CARDS)){
  renderCardFace(type);
  renderShopCardPreview(type);
  cardInspectorText(type);
 }
 assert.deepEqual(s,before);
 assert.equal(s.version,8);
});
