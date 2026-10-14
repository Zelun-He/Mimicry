import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newSiege,queueCommand} from '../dist/siege-engine.js';
import {analyzeChain,chainSlotCount} from '../dist/chain-engine.js';
import {cardArt,cardRule} from '../dist/siege/card-art.js';
import {queuedLinkKinds} from '../dist/siege/link-feedback.js';
import {renderCompactHand,renderCompactChain,renderCompactCommands,renderCompactLanes,SCHOOL_MARKS} from '../dist/siege/combat-ui.js';

const rng=()=>0.5;
const artFor=type=>cardArt(type);
const hpBar=(hp,max)=>`<div class="hp"><div style="width:${Math.round(hp/max*100)}%"></div></div><small>${hp}/${max} HP</small>`;
const sprite=(species,id)=>`<span class="sprite" data-unit="${id}">${species}</span>`;
const render=s=>renderCompactCommands(s,{artFor,cardRule,handSize:8,chain:analyzeChain(s.deck.chain),kinds:queuedLinkKinds(s.deck.chain),rituals:[],lastQueuedId:null,discardMode:false});

test('all eight opening cards display in one hand instead of quarter-width nested columns',()=>{
 const s=newSiege(rng),html=render(s);
 assert.equal((html.match(/class="hand-card /g)||[]).length,8);
 assert.equal((html.match(/data-card-id=/g)||[]).length,8);
 assert.equal((html.match(/class="card-hand /g)||[]).length,1);
 assert.ok(html.indexOf('class="card-hand')>html.indexOf('class="chain-slots'));
 assert.ok(html.includes('YOUR HAND'));
 assert.ok(html.includes('MAKE YOUR MOVE'));
 assert.equal(html.includes('card-play'),false);
 const css=readFileSync(new URL('../dist/siege/combat-clarity.css',import.meta.url),'utf8');
 assert.ok(css.includes('.commands,.controls .commands{display:flex!important'));
 assert.ok(css.includes('grid-template-columns:repeat(8,minmax(0,1fr))'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('@media(max-width:1200px)'));
 assert.ok(css.includes('@media(max-width:480px)'));
});

test('cards have large category/rank headers, clickable surfaces and readable text',()=>{
 const s=newSiege(rng),html=renderCompactHand(s,{artFor,cardRule});
 assert.equal((html.match(/<button type="button" class="hand-card/g)||[]).length,8);
 assert.equal((html.match(/hand-card__rank/g)||[]).length,8);
 assert.equal((html.match(/hand-card__illustration/g)||[]).length,8);
 assert.equal((html.match(/hand-card__name/g)||[]).length,8);
 assert.equal((html.match(/hand-card__effect/g)||[]).length,8);
 assert.equal((html.match(/hand-card__link-hint/g)||[]).length,8);
 assert.ok(!html.includes('data-redraw'));
 for(const school of ['fang','shell','bloom','venom','hunger'])assert.ok(SCHOOL_MARKS[school]);
});

test('discard mode replaces click actions without ever allowing accidental queueing',()=>{
 const s=newSiege(rng);
 const html=renderCompactHand(s,{artFor,cardRule,discardMode:true});
 assert.equal((html.match(/data-redraw=/g)||[]).length,8);
 assert.equal(html.includes('data-queue='),false);
 assert.equal((html.match(/class="hand-card /g)||[]).length,8);
 assert.ok(html.includes('DISCARD'));
});

test('queued cards consume small fixed slots; empty chain never expands to giant cards',()=>{
 const s=newSiege(rng);
 let html=renderCompactChain(s,analyzeChain(s.deck.chain),queuedLinkKinds(s.deck.chain));
 assert.equal((html.match(/class="chain-next-slot"/g)||[]).length,5);
 assert.equal(html.includes('data-unqueue'),false);
 const card=s.deck.hand[0];
 assert.equal(queueCommand(s,card.id),true);
 html=renderCompactChain(s,analyzeChain(s.deck.chain),queuedLinkKinds(s.deck.chain),{lastQueuedId:card.id});
 assert.equal((html.match(/class="chain-card /g)||[]).length,1);
 assert.equal((html.match(/class="chain-next-slot"/g)||[]).length,4);
 assert.ok(html.includes('data-unqueue='));
 assert.ok(html.includes('just-queued'));
 assert.equal(chainSlotCount(s.deck.chain),1);
});

test('three lanes are horizontal targets and each enemy is clickable and has readable HP',()=>{
 const s=newSiege(rng),html=renderCompactLanes(s,{sprite,hpBar});
 assert.equal((html.match(/class="lane /g)||[]).length,3);
 assert.equal((html.match(/data-focus-enemy=/g)||[]).length,s.enemies.filter(e=>e.alive).length);
 assert.ok(html.includes('LANE 1')&&html.includes('LANE 2')&&html.includes('LANE 3'));
 assert.ok(html.includes('INVADER'));
 assert.ok(html.includes('class="hp"'));
 assert.ok(html.includes('aria-label="Focus'));
});

test('new page keeps every battle input and all secondary panels available',()=>{
 const html=readFileSync(new URL('../dist/siege.html',import.meta.url),'utf8');
 assert.ok(html.includes('siege/combat-clarity.css'));
 for(const id of ['combat-controls','discard-mode','turn-button','commands','lanes','gnaw','devour','king-essences','roster','creature-bestiary','log','new','overlay']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.equal((html.match(/<details /g)||[]).length,3);
 assert.equal((html.match(/<\/details>/g)||[]).length,3);
 assert.ok(html.includes('CLICK AN ENEMY TO FOCUS'));
 assert.ok(html.includes('id="combat-feedback"'));
 assert.ok(html.includes('THE MIMIC\'S HAND'));
 assert.ok(html.indexOf('id="arena-scene"')<html.indexOf('id="combat-controls"'));
 assert.ok(html.indexOf('id="combat-controls"')<html.indexOf('CREATURE CODEX'));
});

test('responsive layout replaces historical four-column commands and supports reduced motion',()=>{
 const css=readFileSync(new URL('../dist/siege/combat-clarity.css',import.meta.url),'utf8');
 const old=readFileSync(new URL('../dist/siege.css',import.meta.url),'utf8');
 assert.ok(old.includes('.commands{display:grid;grid-template-columns:repeat(4,1fr)'));
 assert.ok(css.includes('.commands,.controls .commands{display:flex!important'));
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))')); // battlefield
 assert.ok(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))')); // combo
 assert.ok(css.includes('grid-template-columns:repeat(8,minmax(0,1fr))')); // hand
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});
