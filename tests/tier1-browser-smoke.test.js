import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreBattle} from '../dist/demons-engine.js';

test('restored Forest Edge canvas supports poker selection, redraw, attack, and saves',async()=>{
 const nodes=new Map(),saved=new Map();
 class Node {
  constructor(id){this.id=id;this.innerHTML='';this.textContent='';this.hidden=false;this.disabled=false;
   this.style={};this.listeners={};this.dataset={};}
  addEventListener(type,fn){this.listeners[type]=fn;}
  click(){this.listeners.click?.({target:this});}
  getContext(){return {imageSmoothingEnabled:false};}
  showModal(){this.open=true;}
  close(){this.open=false;}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id);};
 const original={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,
  Image:globalThis.Image,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 globalThis.document={getElementById:get,querySelector:()=>null,hidden:false};
 globalThis.window={matchMedia:()=>({matches:true}),addEventListener:()=>{}};
 globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
 globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;}set src(v){this._src=v;}};
 globalThis.requestAnimationFrame=()=>1;
 globalThis.cancelAnimationFrame=()=>{};
 try{
  await import('../dist/forest-poker.js?test=restored-forest-poker-smoke');
  assert.equal((get('hand').innerHTML.match(/class="card premium-card poker-card /g)||[]).length,8);
  assert.equal((get('chain').innerHTML.match(/class="chain-slot poker-slot"/g)||[]).length,5);
  assert.ok(get('route').innerHTML.includes('Lost Forager'));
  assert.equal(get('your-hp').textContent,'100 / 100 HP');
  assert.equal(get('clock').textContent,'3');
  assert.equal(get('attack').disabled,true);
  assert.ok(saved.has('mimicry-demons-v1'));
  let state=restoreBattle(JSON.parse(saved.get('mimicry-demons-v1')));
  assert.ok(state);
  const first=state.hand[0].id;
  get('hand').listeners.click({target:{closest:()=>({dataset:{card:first}})}});
  assert.equal(get('attack').disabled,false);
  assert.ok(get('chain').innerHTML.includes('data-unselect'));
  get('redraw').click();
  state=restoreBattle(JSON.parse(saved.get('mimicry-demons-v1')));
  assert.ok(state);
  assert.equal(state.discardsLeft,2);
  assert.equal(state.enemyClock,3);
  const second=state.hand[0].id;
  get('hand').listeners.click({target:{closest:()=>({dataset:{card:second}})}});
  get('attack').click();
  state=restoreBattle(JSON.parse(saved.get('mimicry-demons-v1')));
  assert.ok(state);
  assert.equal(state.round,2);
  assert.equal(state.hand.length,8);
  assert.ok(state.lastAttack?.damage>0);
  get('how').click();
  assert.equal(get('help').open,true);
  get('close-help').click();
  assert.equal(get('help').open,false);
 }finally{
  for(const [name,value] of Object.entries(original)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});
