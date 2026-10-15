import test from 'node:test';
import assert from 'node:assert/strict';
import {newSiege} from '../dist/siege-engine.js';
import {
 createForestBattle,idleSwayAngle,IDLE_SWAY_RADIANS,VISITOR_GROUND_Y,
 visitorFormation,VISITOR_FOOT_ROWS,MIMIC_FOOT_ROWS
} from '../dist/siege/forest-renderer.js';

test('idle sway stays tiny, deterministic, and entirely disabled for reduced motion',()=>{
 assert.ok(IDLE_SWAY_RADIANS>0&&IDLE_SWAY_RADIANS<=0.012);
 assert.equal(idleSwayAngle(0,0),0);
 assert.ok(Math.abs(idleSwayAngle(Math.PI*300,0)-IDLE_SWAY_RADIANS)<1e-12);
 assert.ok(Math.abs(idleSwayAngle(Math.PI*900,0)+IDLE_SWAY_RADIANS)<1e-12);
 for(const t of [0,123,947,2500,10000]){
  const v=idleSwayAngle(t,0.2);
  assert.ok(Math.abs(v)<=IDLE_SWAY_RADIANS);
  assert.equal(v,idleSwayAngle(t,0.2));
  assert.equal(idleSwayAngle(t,0.2,true),0);
 }
 assert.equal(idleSwayAngle(NaN),0);
 assert.equal(idleSwayAngle(Infinity),0);
});

function setupScene(reducedMotion){
 const saved={
  Image:globalThis.Image,document:globalThis.document,
  requestAnimationFrame:globalThis.requestAnimationFrame,
  cancelAnimationFrame:globalThis.cancelAnimationFrame
 };
 const events=[];let tick;
 globalThis.Image=class{
  constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024;}
  set src(path){
   this._src=path;
   if(path==='assets/visitors.png'){this.naturalWidth=2172;this.naturalHeight=724;}
  }
  get src(){return this._src;}
 };
 globalThis.document={hidden:false};
 globalThis.requestAnimationFrame=fn=>(tick=fn,1);
 globalThis.cancelAnimationFrame=()=>{};
 const capture=op=>(...args)=>events.push({op,args});
 const ctx={
  drawImage:(img,...args)=>events.push({op:'drawImage',path:img.src,args}),
  save:capture('save'),restore:capture('restore'),translate:capture('translate'),
  rotate:capture('rotate'),fillRect:()=>{},beginPath:()=>{},ellipse:()=>{},
  fill:()=>{},stroke:()=>{},moveTo:()=>{},lineTo:()=>{},
  fillText:()=>{},strokeText:()=>{}
 };
 const state=newSiege(()=>0.5);
 const copy=structuredClone(state);
 const battle=createForestBattle({getContext:()=>ctx},{reducedMotion});
 battle.setState(state);
 return {state,copy,battle,events,tick:time=>tick(time),restore(){
  battle.stop();
  for(const [key,value] of Object.entries(saved)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }};
}

test('Mimic and all enemies sway independently without translating boots off their ground line',()=>{
 const env=setupScene(false);
 try{
  const draws=[];
  for(const time of [1000,1750,2500]){
   env.events.length=0;
   env.tick(time);
   const actors=env.events.filter(e=>e.op==='drawImage'&&
    ['assets/mimic.png','assets/visitors.png'].includes(e.path));
   const rotations=env.events.filter(e=>e.op==='rotate').map(e=>e.args[0]);
   const translations=env.events.filter(e=>e.op==='translate');
   const saves=env.events.filter(e=>e.op==='save');
   const restores=env.events.filter(e=>e.op==='restore');
   assert.equal(actors.length,3,'two visitors and the Mimic, no extra sprites');
   assert.equal(rotations.length,3);
   assert.equal(saves.length,3);
   assert.equal(restores.length,3);
   assert.equal(translations.length,6);
   assert.ok(rotations.every(a=>Math.abs(a)<=IDLE_SWAY_RADIANS));
   for(let i=0;i<translations.length;i+=2){
    const pivot=translations[i].args,undo=translations[i+1].args;
    assert.equal(pivot[1],VISITOR_GROUND_Y,'rotation anchor exactly on the ground');
    assert.deepEqual(undo,[-pivot[0],-pivot[1]],'inverse transform cancels without drift');
   }
   const hero=actors.find(e=>e.path==='assets/mimic.png');
   const visitors=actors.filter(e=>e.path==='assets/visitors.png');
   const footprints=visitorFormation(env.state.enemies,2172,724);
   for(const [i,visitor] of visitors.entries()){
    const g=footprints[i];
    assert.deepEqual(visitor.args,[g.sx,0,g.sw,g.sh,g.x,g.y,g.w,g.h]);
    const y=visitor.args[5]+visitor.args[7]*VISITOR_FOOT_ROWS[g.index]/724;
    assert.ok(Math.abs(y-VISITOR_GROUND_Y)<=0.5,'visitor boots remain on baseline');
    assert.equal(env.battle.hitTarget(g.cx,g.y+g.h/2),g.id,'hit target does not drift');
   }
   const frame=Math.round(hero.args[0]/768)+2*Math.round(hero.args[1]/512);
   const foot=hero.args[5]+hero.args[7]*MIMIC_FOOT_ROWS[frame]/512;
   assert.ok(Math.abs(foot-VISITOR_GROUND_Y)<=0.5,'Mimic claws remain grounded');
   draws.push({rectangles:actors.map(e=>e.args.slice(4)),rotations});
  }
  assert.deepEqual(draws[0].rectangles,draws[1].rectangles,
    'idle motion never changes width, height, sprite X or Y');
  assert.deepEqual(draws[1].rectangles,draws[2].rectangles);
  assert.notDeepEqual(draws[0].rotations,draws[1].rotations,
    'visible idle motion is actually animated');
  assert.ok(Math.abs(draws[0].rotations[1]-draws[0].rotations[2])>0.001,
    'visitors are not marching in mechanical sync');
  assert.deepEqual(env.state,env.copy,'renderer never touches the combat save');
 }finally{env.restore();}
});

test('reduced-motion drawing uses original untransformed sprites and remains interactive',()=>{
 const env=setupScene(true);
 try{
  env.tick(1000);env.tick(1700);
  assert.equal(env.events.filter(e=>['save','restore','rotate','translate'].includes(e.op)).length,0);
  assert.equal(env.events.filter(e=>e.op==='drawImage'&&e.path==='assets/visitors.png').length,4);
  assert.equal(env.events.filter(e=>e.op==='drawImage'&&e.path==='assets/mimic.png').length,2);
  const actor=visitorFormation(env.state.enemies,2172,724)[0];
  assert.equal(env.battle.hitTarget(actor.cx,actor.y+actor.h/2),actor.id);
  assert.deepEqual(env.state,env.copy);
 }finally{env.restore();}
});
