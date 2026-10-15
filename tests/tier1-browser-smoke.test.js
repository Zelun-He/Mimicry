import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreBattle} from '../dist/demons-engine.js';

test('poker UI boots, selects cards, redraws, attacks and saves a valid battle',async()=>{
 const nodes=new Map(),saved=new Map();
 class Node{
  constructor(id){this.id=id;this.innerHTML='';this.textContent='';this.hidden=false;this.disabled=false;this.style={};this.listeners={};this.dataset={};}
  addEventListener(type,fn){this.listeners[type]=fn;}
  click(){this.listeners.click?.({target:this});}
  showModal(){this.open=true;}
  close(){this.open=false;}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id);};
 const original={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage};
 globalThis.document={getElementById:get,querySelector:()=>null};
 globalThis.window={addEventListener:()=>{}};
 globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,v)=>saved.set(key,v)};
 try{
  await import('../dist/demons.js?test=poker-ui-smoke');
  assert.equal((get('hand').innerHTML.match(/class="poker-card /g)||[]).length,8);
  assert.equal(get('your-hp').textContent,'100 / 100');
  assert.equal(get('clock').textContent,3);
  assert.equal(get('attack').disabled,true);
  assert.ok(saved.has('mimicry-demons-v1'));
  let state=restoreBattle(JSON.parse(saved.get('mimicry-demons-v1')));
  assert.ok(state);
  const first=state.hand[0].id;
  get('hand').listeners.click({target:{closest:()=>({dataset:{card:first}})}});
  assert.equal(get('attack').disabled,false);
  assert.ok(get('preview-name').textContent.length>0);
  get('discard').click();
  state=restoreBattle(JSON.parse(saved.get('mimicry-demons-v1')));
  assert.ok(state);assert.equal(state.discardsLeft,2);assert.equal(state.enemyClock,3);
  const second=state.hand[0].id;
  get('hand').listeners.click({target:{closest:()=>({dataset:{card:second}})}});
  get('attack').click();
  state=restoreBattle(JSON.parse(saved.get('mimicry-demons-v1')));
  assert.ok(state);assert.equal(state.round,2);assert.equal(state.hand.length,8);
  assert.ok(state.lastAttack?.damage>0);
 }finally{
  for(const [key,value] of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;
 }
});
