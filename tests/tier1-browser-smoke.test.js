import test from 'node:test';
import assert from 'node:assert/strict';

test('restored Forest Edge boots as actual Siege with sprites, card chaining and discard',async()=>{
 const nodes=new Map(),saved=new Map();
 class Node{
  constructor(id){
   this.id=id;this.innerHTML='';this.textContent='';this.hidden=false;
   this.disabled=false;this.dataset={};this.style={};this.listeners={};this.value='';
   this.attrs=new Map();
   this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};
  }
  addEventListener(type,fn){this.listeners[type]=fn;}
  setAttribute(name,value){this.attrs.set(name,value);}
  getBoundingClientRect(){return {left:0,top:0,width:960,height:420};}
  showModal(){this.open=true;}
  close(){this.open=false;}
  getContext(){return {imageSmoothingEnabled:false};}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id);};
 const original={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,
   Image:globalThis.Image,requestAnimationFrame:globalThis.requestAnimationFrame,
   cancelAnimationFrame:globalThis.cancelAnimationFrame};
 globalThis.document={getElementById:get,activeElement:{tagName:'BODY'},
   body:{tagName:'BODY'},hidden:false,querySelector:()=>null,addEventListener:(type,fn)=>{get('document').listeners[type]=fn;}};
 globalThis.document.activeElement=globalThis.document.body;
 globalThis.window={matchMedia:()=>({matches:true})};
 globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,v)=>saved.set(key,v)};
 globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this.src='';}};
 globalThis.requestAnimationFrame=()=>1;
 globalThis.cancelAnimationFrame=()=>{};
 try{
  get('details-panel').hidden=true;
  get('log').hidden=true;
  await import('../dist/siege.js?test=original-forest-restored');
  assert.equal(get('turn').textContent,'TURN 1');
  assert.ok(get('route').innerHTML.includes('Farmhand'));
  assert.ok(get('targets').innerHTML.includes('data-target'));
  assert.ok(get('defenders').innerHTML.includes('Goblin'));
  assert.ok(get('defenders').innerHTML.includes('HP · L'));
  assert.ok(!get('defenders').innerHTML.includes('sprite'));
  assert.ok(!get('defenders').innerHTML.includes('unit-portrait'));
  assert.ok(!get('roster').innerHTML.includes('unit-portrait'));
  assert.ok(get('roster').innerHTML.includes('roster-role'));
  assert.equal((get('hand').innerHTML.match(/class="card /g)||[]).length,8);
  assert.equal((get('chain').innerHTML.match(/class="chain-slot"/g)||[]).length,5);
  assert.equal(get('your-hp').textContent,'30 / 30 INTEGRITY');
  assert.ok(get('intent').textContent.includes('damage'));
  assert.ok(get('preview').innerHTML.includes('incoming'));
  assert.ok(saved.has('mimicry-siege-v8'));
  assert.equal(get('attack').disabled,false);
  assert.equal(get('redraw').disabled,false);
  assert.equal(typeof get('world').listeners.click,'function');
  assert.equal(typeof get('gnaw').listeners.click,'function');
  assert.equal(typeof get('devour').listeners.click,'function');
  const first=get('hand').innerHTML.match(/data-card-id="([^"]+)"/)?.[1];
  assert.ok(first);
  get('hand').listeners.click({target:{closest:()=>({dataset:{cardId:first}})}});
  assert.ok(get('chain').innerHTML.includes('data-unqueue'));
  assert.equal((get('chain').innerHTML.match(/class="chain-slot filled/g)||[]).length,1);
  const queuedId=get('chain').innerHTML.match(/data-unqueue="([^"]+)"/)?.[1];
  get('chain').listeners.click({target:{closest:()=>({dataset:{unqueue:queuedId}})}});
  assert.equal((get('chain').innerHTML.match(/class="chain-slot"/g)||[]).length,5);
  assert.ok(!get('chain').innerHTML.includes('data-unqueue'));
  const enemy=get('targets').innerHTML.match(/data-target="(e[^"]+)"/)?.[1];
  assert.ok(enemy);
  get('targets').listeners.click({target:{closest:()=>({dataset:{target:enemy}})}});
  assert.ok(get('targets').innerHTML.includes('active'));
  get('redraw').listeners.click();
  assert.equal(get('redraw').attrs.get('aria-pressed'),'true');
  const discardId=get('hand').innerHTML.match(/data-card-id="([^"]+)"/)?.[1];
  get('hand').listeners.click({target:{closest:()=>({dataset:{cardId:discardId}})}});
  assert.equal(get('redraw').attrs.get('aria-pressed'),'false');
  assert.equal(get('redraw-count').textContent,1);
  get('how').listeners.click();
  assert.equal(get('help').open,true);
  get('close-help').listeners.click();
  assert.equal(get('help').open,false);
  get('details-toggle').listeners.click();
  assert.equal(get('details-panel').hidden,false);
  get('details-toggle').listeners.click();
  assert.equal(get('details-panel').hidden,true);
  // Even with an empty chain, ending the turn must remain possible.
  const previous=get('turn').textContent;
  await get('attack').listeners.click();
  // The reducer is synchronous; animation is five ms under reduced motion.
  await new Promise(resolve=>setTimeout(resolve,110));
  assert.notEqual(get('turn').textContent,previous);
 }finally{
  for(const [name,value] of Object.entries(original)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});
