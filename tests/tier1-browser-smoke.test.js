import test from 'node:test';
import assert from 'node:assert/strict';

// A dependency-free browser bootstrap smoke test. It executes the real Siege
// entry point, letting the real card/forest rendering run without a DOM library.
test('Tier 1 UI boots, illustrates its first hand, toggles tips and queues a card',async()=>{
 const nodes=new Map(),saved=new Map();
 class FakeNode{
  constructor(id){this.id=id;this.dataset={};this.listeners={};this.style={};this.innerHTML='';this.textContent='';this.hidden=false;this.disabled=false;}
  addEventListener(event,callback){this.listeners[event]=callback;}
  setAttribute(key,value){this[key]=value;}
  querySelector(){return null;}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new FakeNode(id));return nodes.get(id);};
 const original={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch,localStorage:globalThis.localStorage};
 globalThis.document={getElementById:get,querySelectorAll:()=>[]};
 globalThis.window={matchMedia:()=>({matches:true})};
 globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
 globalThis.fetch=async()=>({json:async()=>({animations:{}})});
 try{
  await import('../dist/siege.js?test=forest-boot');
  assert.equal(get('arena-scene').dataset.scene,'sunbreak');
  assert.equal(get('scene-title').textContent,'Sunbreak Clearing');
  assert.ok(get('forest-progress').innerHTML.includes('forest-progress__dot'));
  const hand=get('commands').innerHTML;
  assert.ok(hand.includes('hand-card__illustration'));
  assert.ok(hand.includes('card-art'));
  assert.ok(hand.includes('PLAY CARD'));
  assert.ok(hand.includes('role="group"'));
  assert.ok(hand.includes('card-play'));
  assert.equal(get('first-run-tip').hidden,false);
  assert.ok(get('tip-title').textContent.length>0);
  assert.equal(saved.has('mimicry-siege-v8'),true);
  assert.equal(typeof get('commands').listeners.keydown,'function');

  get('tips-toggle').listeners.click();
  assert.equal(get('first-run-tip').hidden,true);
  assert.equal(saved.get('mimicry-tier1-tips-hidden'),'yes');
  get('tips-toggle').listeners.click();
  assert.equal(get('first-run-tip').hidden,false);

  const match=get('commands').innerHTML.match(/data-queue="([^"]+)"/);
  assert.ok(match,'first hand must expose at least one playable card');
  get('commands').listeners.click({target:{closest:()=>({dataset:{queue:match[1]}})}});
  assert.ok(get('commands').innerHTML.includes('chain-card__portrait'));
  assert.ok(get('commands').innerHTML.includes('data-unqueue'));
  assert.ok(get('tip-kicker').textContent.includes('FIRST TURN'));
 }finally{
  for(const [key,value] of Object.entries(original)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});
