import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newSiege} from '../dist/siege-engine.js';
import {createForestBattle,featuredInvader} from '../dist/siege/forest-renderer.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('only the original forest, hero and visitor sprite sheets load for combat',()=>{
 const loaded=[];
 const original={Image:globalThis.Image,document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 let frame;
 globalThis.Image=class{
  constructor(){this.complete=true;this.naturalWidth=960;this.naturalHeight=600;}
  set src(value){this._src=value;loaded.push(value);}
  get src(){return this._src;}
 };
 globalThis.document={hidden:false};
 globalThis.requestAnimationFrame=cb=>(frame=cb,1);
 globalThis.cancelAnimationFrame=()=>{};
 const draws=[];
 const ctx={
  drawImage:(img,...args)=>draws.push({type:'image',source:img.src,coords:args}),
  fillRect:(...args)=>draws.push({type:'rect',args}),
  fillText:()=>{},strokeText:()=>{},beginPath:()=>{},ellipse:()=>{},
  fill:()=>{},stroke:()=>{},moveTo:()=>{},lineTo:()=>{}
 };
 try{
  const battle=createForestBattle({getContext:()=>ctx},{reducedMotion:true});
  assert.deepEqual(loaded,[
   'assets/forest.png','assets/mimic.png','assets/visitors.png'
  ]);
  const base=newSiege(()=>0.5);
  battle.setState(base);
  frame(100);
  const noSummons=structuredClone(draws);
  assert.ok(noSummons.some(entry=>entry.source==='assets/mimic.png'));
  assert.ok(noSummons.some(entry=>entry.source==='assets/visitors.png'));
  assert.ok(noSummons.some(entry=>entry.source==='assets/forest.png'));
  const crowded=structuredClone(base);
  crowded.minions=[
   ...Array.from({length:6},(_,i)=>({
    id:'m'+(i+1),species:i%2?'skeleton':'goblin',
    name:i%2?'Skeleton':'Goblin',alive:true,hp:3,maxHp:3,
    lane:i%3,summoned:true
   }))
  ];
  for(const u of crowded.units){u.hp=u.maxHp;u.lane=(u.lane+1)%3;}
  draws.length=0;
  battle.setState(crowded);
  frame(200);
  // Adding six summons or moving veterans must not draw mini troops, boxes,
  // status blobs, sprites, or counters over the featured encounter.
  assert.deepEqual(draws,noSummons);
  assert.ok(draws.filter(d=>d.type==='image').every(d=>
   ['assets/forest.png','assets/mimic.png','assets/visitors.png'].includes(d.source)));
  assert.equal(featuredInvader(crowded).id,featuredInvader(base).id);
  battle.stop();
 }finally{
  for(const [name,value] of Object.entries(original)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});

test('secondary monster sprite loading and attack popups cannot return to the forest renderer',()=>{
 const renderer=source('dist/siege/forest-renderer.js');
 const app=source('dist/siege.js');
 const css=source('dist/siege/forest-game.css');
 for(const term of ["siege/sprites/","const allies=(state?.units","const minions=(state?.minions","particle('HIT'","particle(step.def.name"]){
  assert.equal(renderer.includes(term),false,'unwanted renderer detail: '+term);
 }
 assert.ok(renderer.includes("assets/mimic.png"));
 assert.ok(renderer.includes("assets/visitors.png"));
 assert.ok(renderer.includes("triggerCard(steps[i])"));
 assert.ok(renderer.includes("e.state==='damage'"));
 assert.ok(!app.includes("background-image:url(./siege/sprites/"));
 assert.ok(!app.includes('class="unit-portrait"'));
 assert.ok(app.includes("minion.species+':'+minion.lane"));
 assert.ok(app.includes('group.count++'));
 assert.ok(app.includes('group.name'));
 assert.ok(css.includes('.ally-chip.summon-chip'));
 assert.ok(css.includes('#roster .roster-role'));
});

test('battlefield remains a display-only surface: summons and veterans still live in the Siege engine',()=>{
 const before=newSiege(()=>0.5);
 assert.equal(before.units.filter(u=>u.alive).length,4);
 assert.equal(before.minions.length,0);
 const copy=structuredClone(before);
 const current=featuredInvader(copy);
 assert.equal(current.name,featuredInvader(before).name);
 // This phase does not touch the engine, save schema, card data or summon caps.
 const renderer=source('dist/siege/forest-renderer.js');
 assert.ok(renderer.includes('function setState(s){state=s;'));
 assert.equal(renderer.includes('state.units.push'),false);
 assert.equal(renderer.includes('state.minions.push'),false);
 assert.deepEqual(copy,before);
});
