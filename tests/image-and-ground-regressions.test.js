import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {newSiege} from '../dist/siege-engine.js';
import {renderForestHand} from '../dist/siege/forest-hand.js';
import {EXOTIC_CARD_PORTRAITS} from '../dist/siege/exotic-inline-art.js';
import {creatureCardArt} from '../dist/siege/creature-card-art.js';
import {VISITOR_FOOT_ROWS,VISITOR_GROUND_Y,MIMIC_FOOT_ROWS,createForestBattle}
 from '../dist/siege/forest-renderer.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=path=>readFileSync(resolve(root,path),'utf8');

test('original spider and baby Mimic SVGs are embedded inline, never requested as nested images',()=>{
 for(const [key,name,type] of [
  ['spider','exotic-spider.svg','spider-summon'],
  ['mimicling','exotic-mimicling.svg','family-dinner']
 ]){
  const source=file('dist/siege/'+name);
  const inline=EXOTIC_CARD_PORTRAITS[key];
  assert.ok(source.startsWith('<svg xmlns='));
  assert.ok(source.endsWith('</svg>'));
  assert.ok(inline.includes('<svg class="creature-art__illustration"'));
  assert.ok(inline.includes('viewBox="0 0 16 16"'));
  assert.ok(inline.includes('focusable="false"'));
  assert.equal((inline.match(/<svg/g)||[]).length,1);
  assert.equal((inline.match(/<\/svg>/g)||[]).length,1);
  assert.equal((inline.match(/<rect/g)||[]).length,(source.match(/<rect/g)||[]).length);
  const card=creatureCardArt(type);
  assert.ok(card.includes(inline),type);
  assert.ok(!card.includes('<img'),type);
  assert.ok(!card.includes('src="./siege/'),type);
 }
});

test('every type of card renders with well-formed attributes; shop preview never needs a network SVG',()=>{
 const state=newSiege(()=>0.5);
 state.deck.hand=['spider-summon','mimicling-summon','goblin-recruit',
  'skeleton-recruit','slime-summon','decree','strike','pack-attack']
  .map((type,i)=>({id:'c'+i,type}));
 state.deck.chain=[];
 const html=renderForestHand(state);
 assert.equal((html.match(/<button type="button" class="card /g)||[]).length,8);
 const buttons=[...html.matchAll(/<button[^>]*>/g)].map(match=>match[0]);
 assert.equal(buttons.length,8);
 for(const button of buttons){
  assert.ok(button.includes('aria-disabled="'),button);
  assert.ok(button.includes('aria-label="'),button);
 }
 assert.ok(!html.includes('"" aria-disabled'),'malformed quote leaked into card tag');
 assert.ok(html.includes('data-tribe="spider" aria-disabled='));
 assert.ok(html.includes('data-tribe="mimicling" aria-disabled='));
 assert.ok(html.includes('data-tribe="goblin" aria-disabled='));
 assert.ok(html.includes('<svg class="creature-art__illustration"'));
 assert.ok(!html.includes('<img'));
 const js=file('dist/siege.js');
 assert.ok(js.includes('artCache.set(type,creatureCardArt(type))'));
 assert.ok(js.includes('renderShopCardPreview(previewType,{artFor})'));
});

test('source sprite atlas stays undistorted in both small cards and wide Quartermaster previews',()=>{
 const png=readFileSync(resolve(root,'dist/siege/creature-portraits.png'));
 assert.equal(png.readUInt32BE(16),400);
 assert.equal(png.readUInt32BE(20),69);
 const css=file('dist/siege/creature-cards.css');
 assert.ok(css.includes('aspect-ratio:80/69'), 'per-portrait original width/height');
 assert.ok(css.includes('height:min(100%,85px)'));
 assert.ok(css.includes('background-size:500% 100%'));
 assert.ok(css.includes('width:auto;max-width:none'));
 assert.ok(css.includes('max-width:none'),'wide card preview cannot stretch the atlas');
 assert.ok(css.includes('.shop-offer .shop-offer__selected-name'));
 for(const x of ['goblin','skeleton','slime','sporeling','king-mimic'])
  assert.ok(css.includes('creature-art__sprite--'+x),x);
 const card=creatureCardArt('goblin-recruit');
 assert.ok(card.includes('creature-art__sprite--goblin'));
 assert.ok(card.includes('creature-art__family'));
});

test('idle animation preserves sprite draw rectangles and the visible boot baseline',()=>{
 const saved={Image:globalThis.Image,document:globalThis.document,
  requestAnimationFrame:globalThis.requestAnimationFrame,
  cancelAnimationFrame:globalThis.cancelAnimationFrame};
 let tick;
 globalThis.Image=class{
  constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024;}
  set src(path){this._src=path;
   if(path==='assets/visitors.png'){this.naturalWidth=2410;this.naturalHeight=724;}
  }
  get src(){return this._src;}
 };
 globalThis.document={hidden:false};
 globalThis.requestAnimationFrame=fn=>(tick=fn,1);
 globalThis.cancelAnimationFrame=()=>{};
 const draws=[];
 const ctx={drawImage:(img,...args)=>draws.push({path:img.src,args}),
  fillRect:()=>{},beginPath:()=>{},ellipse:()=>{},fill:()=>{},
  stroke:()=>{},moveTo:()=>{},lineTo:()=>{},fillText:()=>{},strokeText:()=>{},
  save:()=>{},restore:()=>{},translate:()=>{},rotate:()=>{}};
 try{
  const s=newSiege(()=>0.5);
  const battle=createForestBattle({getContext:()=>ctx},{reducedMotion:false});
  battle.setState(s);
  tick(1000);
  const first=draws.filter(d=>d.path==='assets/visitors.png'||d.path==='assets/mimic.png');
  assert.ok(first.length>=3);
  for(const entry of first){
   const args=entry.args;
   const foot=entry.path==='assets/visitors.png'
    ? args[5]+args[7]*(VISITOR_FOOT_ROWS[Math.round(args[0]/(2410/5))]/724)
    : args[5]+args[7]*(MIMIC_FOOT_ROWS[0]/512);
   assert.ok(Math.abs(foot-VISITOR_GROUND_Y)<.51,`${entry.path} floats by ${foot-VISITOR_GROUND_Y}px`);
  }
  draws.length=0;tick(1900);
  const second=draws.filter(d=>d.path==='assets/visitors.png'||d.path==='assets/mimic.png');
  assert.deepEqual(second.map(d=>d.args.slice(4)),first.map(d=>d.args.slice(4)),
    'idle sway must not change draw rectangles, cause vertical bobbing, or move shadows');
  battle.stop();
 }finally{
  for(const [key,value] of Object.entries(saved)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});

test('the local game server serves SVG, PNG, HTML, CSS and JS with correct MIME types',async()=>{
 const selector=createServer();
 await new Promise((resolve,reject)=>selector.once('error',reject).listen(0,'127.0.0.1',resolve));
 const port=selector.address().port;
 await new Promise(resolve=>selector.close(resolve));
 const child=spawn(process.execPath,['scripts/serve.mjs'],{
  cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']
 });
 try{
  await Promise.race([
   once(child.stdout,'data'),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error('Server did not start')),5000))
  ]);
  const cases=[
   ['/siege/exotic-spider.svg','image/svg+xml','<svg'],
   ['/siege/exotic-mimicling.svg','image/svg+xml','<svg'],
   ['/siege/creature-portraits.png','image/png',null],
   ['/assets/visitors.png','image/png',null],
   ['/assets/mimic.png','image/png',null],
   ['/siege/creature-cards.css','text/css','aspect-ratio:80/69'],
   ['/siege/creature-card-art.js','text/javascript','EXOTIC_CARD_PORTRAITS'],
   ['/','text/html','demons.css']
  ];
  for(const [route,mime,marker] of cases){
   const response=await fetch('http://127.0.0.1:'+port+route);
   assert.equal(response.status,200,route);
   assert.equal(response.headers.get('content-type'),mime,route);
   if(marker)assert.ok((await response.text()).includes(marker),route);
  }
 }finally{
  child.kill();
  await once(child,'exit').catch(()=>{});
 }
});
