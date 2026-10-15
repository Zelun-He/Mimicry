import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {VISITOR_COLUMNS,VISITOR_FOOT_ROWS,visitorFormation}
 from '../dist/siege/forest-renderer.js';

// Decode only the PNG alpha channel, including standard PNG row filters.
// Pixel-level coverage catches a severed sword even when dimensions/tests pass.
function pngAlpha(){
 const data=readFileSync(new URL('../dist/assets/visitors.png',import.meta.url));
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
 assert.equal(data[24],8,'8-bit per channel');
 assert.equal(data[25],6,'RGBA PNG');
 const compressed=[];
 for(let p=8;p<data.length;){
  const len=data.readUInt32BE(p),tag=data.toString('ascii',p+4,p+8);
  if(tag==='IDAT')compressed.push(data.subarray(p+8,p+8+len));
  p+=len+12;
  if(tag==='IEND')break;
 }
 const raw=inflateSync(Buffer.concat(compressed));
 const previous=new Uint8Array(width);
 const alpha=new Uint8Array(width*height);
 for(let y=0;y<height;y++){
  const off=y*(1+width*4),filter=raw[off];
  assert.ok(filter<=4,'recognized PNG filter');
  const current=alpha.subarray(y*width,(y+1)*width);
  for(let x=0;x<width;x++){
   const left=x?current[x-1]:0,above=previous[x],upperLeft=x?previous[x-1]:0;
   let predictor=0;
   if(filter===1)predictor=left;
   else if(filter===2)predictor=above;
   else if(filter===3)predictor=(left+above)>>1;
   else if(filter===4){
    const p=left+above-upperLeft;
    const a=Math.abs(p-left),b=Math.abs(p-above),c=Math.abs(p-upperLeft);
    predictor=a<=b&&a<=c?left:b<=c?above:upperLeft;
   }
   current[x]=(raw[off+1+x*4+3]+predictor)&255;
  }
  previous.set(current);
 }
 return {alpha,width,height};
}

test('visitor atlas consists of five complete 482×724, transparent, grounded cells',()=>{
 const {width,height,alpha}=pngAlpha();
 assert.equal(width,2410);
 assert.equal(height,724);
 assert.equal(VISITOR_COLUMNS,5);
 assert.deepEqual(VISITOR_FOOT_ROWS,[713,713,713,713,713]);
 const expected=[
  [44,23,437,714],[24,47,458,714],[37,55,444,714],
  [6,58,476,714],[24,33,458,714]
 ];
 for(let i=0;i<5;i++){
  let minX=482,maxX=-1,minY=724,maxY=-1;
  for(let y=0;y<height;y++){
   for(let x=0;x<482;x++){
    if(!alpha[y*width+i*482+x])continue;
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);
    minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   }
  }
  assert.deepEqual([minX,minY,maxX+1,maxY+1],expected[i],
   'character '+i+' must not leak into a neighbor or float above the others');
 }
});

test('novice sword tip stays attached to the novice, not the neighboring Wanderer',()=>{
 const {alpha,width}=pngAlpha(),fw=width/5;
 let swordTipPixels=0;
 for(let y=306;y<390;y++){
  for(let x=0;x<31;x++){
   if(alpha[y*width+3*fw+x])swordTipPixels++;
  }
 }
 assert.ok(swordTipPixels>500,'restored leftmost novice sword blade must remain visible');
 // The missing fragment previously occupied the rightmost source columns
 // of visitor #3 (Wanderer). Those columns must now be fully transparent.
 for(let y=250;y<400;y++){
  for(let x=445;x<482;x++){
   assert.equal(alpha[y*width+2*fw+x],0,
    'severed sword piece has leaked back onto the Wanderer frame');
  }
 }
});

test('all 3-foe squads remain same size, uncut and selectable',()=>{
 const enemies=[
  {id:'a',name:'Guard',lane:0,alive:true,hp:20},
  {id:'b',name:'Archer',lane:1,alive:true,hp:20},
  {id:'c',name:'Sapper',lane:2,alive:true,hp:20}
 ];
 const f=visitorFormation(enemies,2410,724);
 assert.equal(f.length,3);
 assert.ok(f.every(actor=>actor.sw===482&&actor.sh===724));
 assert.equal(new Set(f.map(actor=>actor.h)).size,1);
 assert.equal(new Set(f.map(actor=>actor.w)).size,1);
 assert.ok(f.every((actor,i)=>i===0||actor.x>=f[i-1].x+f[i-1].w));
});
