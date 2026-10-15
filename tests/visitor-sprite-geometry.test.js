import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RAIDS,newSiege} from '../dist/siege-engine.js';
import {VISITOR_COLUMNS,VISITOR_HEIGHT,VISITOR_GROUND_Y,visitorFormation,
 visitorSpriteIndex,featuredInvader,createForestBattle} from '../dist/siege/forest-renderer.js';

const W=2172,H=724;
const fractions=[700,676,676,675,706].map(v=>v/H);
const fighters=index=>RAIDS[index].enemies.map((e,i)=>({
 ...e,id:'e'+index+'-'+i,alive:true,maxHp:e.hp
}));

test('the actual original visitor atlas has five full-height frames',()=>{
 const png=readFileSync(new URL('../dist/assets/visitors.png',import.meta.url));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),W);
 assert.equal(png.readUInt32BE(20),H);
 assert.equal(VISITOR_COLUMNS,5);
 assert.equal(VISITOR_HEIGHT,205);
});

test('all three Watchman attackers have EXACTLY equal on-screen scale and original aspect ratio',()=>{
 const actors=visitorFormation(fighters(4),W,H);
 assert.equal(actors.length,3);
 assert.deepEqual(actors.map(a=>a.enemy.name),['Guard','Watchman','Guard']);
 const expectedW=VISITOR_HEIGHT*(W/5)/H;
 for(const a of actors){
  assert.ok(Math.abs(a.w-expectedW)<1e-10,a.enemy.name);
  assert.equal(a.h,VISITOR_HEIGHT);
  assert.equal(a.sw,W/5);
  assert.equal(a.sh,H);
  assert.ok(Math.abs(a.w/a.h-a.sw/a.sh)<1e-12,'no independent x/y stretch');
  assert.ok(Math.abs(a.sx-a.index*a.sw)<1e-10);
  assert.equal(a.sy,0);
 }
 assert.equal(new Set(actors.map(a=>a.w.toFixed(8))).size,1);
 assert.equal(new Set(actors.map(a=>a.h)).size,1);
});

test('visible feet align on the SAME ground line despite transparent atlas padding',()=>{
 for(let raid=0;raid<RAIDS.length;raid++){
  const formation=visitorFormation(fighters(raid),W,H);
  for(const a of formation){
   const visibleFoot=a.y+a.h*fractions[a.index];
   assert.ok(Math.abs(visibleFoot-VISITOR_GROUND_Y)<=.5,
    `raid ${raid}: ${a.enemy.name} foot ${visibleFoot} off baseline`);
   assert.ok(a.y>=90,'heads stay inside the battlefield');
   assert.ok(a.y+a.h<=360,'characters never leave the drawable area');
  }
 }
});

test('all first five raids have a readable, non-overlapping squad at one scale',()=>{
 for(let raid=0;raid<RAIDS.length;raid++){
  const formation=visitorFormation(fighters(raid),W,H);
  assert.equal(formation.length,RAIDS[raid].enemies.length);
  assert.ok(formation.length>=1&&formation.length<=3);
  for(const [i,a] of formation.entries()){
   assert.ok(a.x>=500,`raid ${raid}: sprite ${i} collides with Mimic`);
   assert.ok(a.x+a.w<=955,`raid ${raid}: sprite ${i} clips right edge`);
   if(i){
    assert.ok(a.x>=formation[i-1].x+formation[i-1].w,
     `raid ${raid}: overlapping hitboxes ${i-1} and ${i}`);
   }
  }
 }
});

test('focus never changes sprite positions, source frames or scale',()=>{
 const s=newSiege(()=>0.5);
 s.raid=4;s.enemies=fighters(4);
 const before=visitorFormation(s.enemies,W,H);
 for(const target of s.enemies){
  s.chainTargetId=target.id;
  assert.equal(featuredInvader(s).id,target.id);
  assert.deepEqual(visitorFormation(s.enemies,W,H),before);
 }
 assert.equal(visitorSpriteIndex('Watchman'),4);
 assert.equal(visitorSpriteIndex('Guard'),3);
});

test('actual canvas draws three same-size visitor sprites and click regions match them',()=>{
 const saved={Image:globalThis.Image,document:globalThis.document,
 requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 let tick;
 globalThis.Image=class{
  constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024;}
  set src(value){
   this._src=value;
   if(value==='assets/visitors.png'){this.naturalWidth=W;this.naturalHeight=H;}
  }
  get src(){return this._src;}
 };
 globalThis.document={hidden:false};
 globalThis.requestAnimationFrame=fn=>(tick=fn,1);
 globalThis.cancelAnimationFrame=()=>{};
 const draws=[];
 const ctx={
  drawImage:(image,...args)=>draws.push({source:image.src,args}),
  fillRect:()=>{},beginPath:()=>{},ellipse:()=>{},fill:()=>{},
  stroke:()=>{},moveTo:()=>{},lineTo:()=>{},fillText:()=>{},strokeText:()=>{}
 };
 try{
  const s=newSiege(()=>0.5);s.raid=4;s.enemies=fighters(4);
  const battle=createForestBattle({getContext:()=>ctx},{reducedMotion:true});
  battle.setState(s);
  tick(100);
  const sprites=draws.filter(d=>d.source==='assets/visitors.png');
  assert.equal(sprites.length,3);
  const geometry=visitorFormation(s.enemies,W,H);
  for(const [i,draw] of sprites.entries()){
   const g=geometry[i];
   assert.equal(draw.args.length,8);
   assert.deepEqual(draw.args.slice(0,4),[g.sx,0,g.sw,H]);
   assert.deepEqual(draw.args.slice(4,8),[g.x,g.y,g.w,g.h]);
   assert.equal(battle.hitTarget(g.x+g.w/2,g.y+g.h/2),g.id);
  }
  const firstPositions=sprites.map(d=>d.args.slice(4));
  s.chainTargetId=s.enemies[2].id;
  draws.length=0;battle.setState(s);tick(200);
  const newPositions=draws.filter(d=>d.source==='assets/visitors.png').map(d=>d.args.slice(4));
  assert.deepEqual(newPositions,firstPositions,'focus changes ring, never actor geometry');
  battle.stop();
 }finally{
  for(const [key,value] of Object.entries(saved)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});

test('the responsive canvas keeps the original 960×420 ratio on every screen size',()=>{
 const css=readFileSync(new URL('../dist/siege/forest-game.css',import.meta.url),'utf8');
 const rule=css.match(/\.battle canvas\{[^}]+\}/)?.[0];
 assert.ok(rule);
 assert.ok(rule.includes('width:100%'));
 assert.ok(rule.includes('height:auto'));
 assert.ok(rule.includes('aspect-ratio:960/420'));
 assert.ok(rule.includes('max-height:none'));
 assert.ok(rule.includes('min-height:0'));
 assert.ok(rule.includes('object-fit:contain'));
 assert.ok(!css.includes('object-fit:fill'));
 assert.ok(!css.includes('max-height:540px'));
 assert.ok(!css.includes('min-height:265px'));
 assert.ok(!css.includes('min-height:280px'));
});

test('no old foreground/miniature enemy positions can regress the battle scene',()=>{
 const js=readFileSync(new URL('../dist/siege/forest-renderer.js',import.meta.url),'utf8');
 assert.ok(js.includes('visitorFormation('));
 assert.ok(js.includes('VISITOR_X_CENTERS'));
 assert.ok(!js.includes('w=86,h=131'));
 assert.ok(!js.includes('w=136,h=197'));
 assert.ok(!js.includes('const x=777+i*77'));
 assert.ok(!js.includes('const x=608,y=137'));
 assert.ok(!js.includes('siege/sprites/'));
});
