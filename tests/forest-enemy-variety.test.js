import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RAIDS,newSiege,reinforce,endTurn,gnaw,chooseEssence,restoreSiege,targetChain} from '../dist/siege-engine.js';
import {ESSENCE_BY_ENEMY} from '../dist/assimilation-engine.js';
import {visitorFormation,visitorSpriteIndex} from '../dist/siege/forest-renderer.js';
import {FOREST_ENEMY_ROLES,FOREST_ALTERNATES,encounterOptions,validEncounterPlan,
 generateEncounterPlan,enemyTemplatesFor,enemyAttackBonus,enemyIntent,authoredRaidsForPlan}
 from '../dist/forest-enemies.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const signature=template=>template.map(e=>e.name+':'+e.hp+':'+e.attack+':'+e.lane).join('|');

test('four distinctly telegraphed Tier I archetypes use bounded mechanics, not hard immunities',()=>{
 assert.deepEqual(Object.keys(FOREST_ENEMY_ROLES),['Lantern Bearer','Herbalist','Poacher','Sapper']);
 const roles=Object.values(FOREST_ENEMY_ROLES);
 assert.deepEqual(roles.map(r=>r.hook),['rally','heal','poach','sunder']);
 assert.equal(new Set(roles.map(r=>r.icon)).size,4);
 for(const role of roles){
  assert.ok(role.description.length>35);
  assert.ok(Number.isInteger(role.portrait)&&role.portrait>=0&&role.portrait<5);
 }
});

test('the five original Forest Edge raids remain an available, untouched canonical path',()=>{
 assert.deepEqual(RAIDS.map(r=>r.enemies.map(e=>e.name)),[
  ['Farmhand','Forager'],['Scout','Scout'],['Guard','Guard','Archer'],
  ['Rogue','Mage'],['Watchman','Guard','Guard']
 ]);
 const old=RAIDS.map((r,i)=>signature(encounterOptions(RAIDS,i)[0]));
 assert.deepEqual(old,RAIDS.map(r=>signature(r.enemies)));
 assert.deepEqual(generateEncounterPlan(RAIDS,()=>0.5),[0,0,0,0,0]);
 assert.deepEqual(generateEncounterPlan(RAIDS,()=>0),[0,0,0,0,0]);
 assert.equal(FOREST_ALTERNATES[0].length,0,'the onboarding encounter is always recognizable');
});

test('authored alternatives make all later raids replayable without inflating the boss',()=>{
 const plan=generateEncounterPlan(RAIDS,()=>0.8);
 assert.deepEqual(plan,[0,1,1,1,1]);
 assert.ok(validEncounterPlan(RAIDS,plan));
 assert.equal(validEncounterPlan(RAIDS,[0,1,1,1,99]),false);
 assert.equal(validEncounterPlan(RAIDS,[1,1,1,1,1]),false);
 assert.equal(validEncounterPlan(RAIDS,[0,1,1,1]),false);
 for(let i=1;i<RAIDS.length;i++){
  const options=encounterOptions(RAIDS,i);
  assert.ok(options.length>=2,'raid '+i+' has a distinct alternate');
  assert.equal(new Set(options.map(signature)).size,options.length);
  for(const encounter of options){
   assert.ok(encounter.length>=2&&encounter.length<=3,'readable squad composition');
   assert.ok(encounter.every(e=>e.hp>=15&&e.hp<=72&&e.attack>=2&&e.attack<=9));
   assert.equal(new Set(encounter.map(e=>e.lane)).size,encounter.length,'one foe per lane');
  }
 }
 assert.equal(enemyTemplatesFor(RAIDS,4,plan)[0].name,'Watchman');
 assert.deepEqual(authoredRaidsForPlan(RAIDS,plan)[0].enemies,RAIDS[0].enemies);
});

test('preselected encounter path survives reinforcement, midbattle saves and reload',()=>{
 const s=newSiege(()=>0.8),plan=[...s.encounterPlan];
 assert.deepEqual(plan,[0,1,1,1,1]);
 assert.equal(restoreSiege(structuredClone(s))?.turn,1);
 for(let i=1;i<RAIDS.length;i++){
  s.phase='reward';
  assert.equal(reinforce(s,'rest'),true);
  assert.equal(s.raid,i);
  assert.deepEqual(s.enemies.map(e=>e.name),enemyTemplatesFor(RAIDS,i,plan).map(e=>e.name));
  assert.ok(restoreSiege(structuredClone(s)),'restoring raid '+i+' must keep the selected cast');
 }
 assert.deepEqual(s.encounterPlan,plan);
});

test('old v8 saved games with no encounter plan still load their original parties',()=>{
 const legacy=newSiege(()=>0.5);
 delete legacy.encounterPlan;
 const loaded=restoreSiege(structuredClone(legacy));
 assert.ok(loaded);
 assert.deepEqual(loaded.encounterPlan,[0,0,0,0,0]);
 assert.deepEqual(loaded.enemies.map(e=>e.name),['Farmhand','Forager']);
 const forged=structuredClone(newSiege(()=>0.8));
 forged.encounterPlan[1]=100;
 assert.equal(restoreSiege(forged),null);
 const swapped=structuredClone(newSiege(()=>0.8));
 swapped.enemies[0].name='Poacher';
 assert.equal(restoreSiege(swapped),null);
});

test('Lantern Bearer rally improves allied attacks by just one, never its own',()=>{
 const foes=[
  {id:'e0',name:'Lantern Bearer',alive:true,hp:20,attack:3,lane:2},
  {id:'e1',name:'Scout',alive:true,hp:24,attack:5,lane:0}
 ];
 assert.equal(enemyAttackBonus(foes[0],null,foes),0);
 assert.equal(enemyAttackBonus(foes[1],null,foes),1);
 assert.match(enemyIntent(foes[0],foes),/SIGNAL.*\+1 attack/);
 assert.match(enemyIntent(foes[1],foes),/6 damage/);
 foes[0].alive=false;foes[0].hp=0;
 assert.equal(enemyAttackBonus(foes[1],null,foes),0);
 assert.match(enemyIntent(foes[1],foes),/5 damage/);
});

test('Poacher and Sapper counter one strategy without rendering it useless',()=>{
 const alive=[{id:'e1',name:'Poacher',alive:true,hp:30,attack:5},
  {id:'e2',name:'Sapper',alive:true,hp:28,attack:5}];
 const mob={summoned:true,armor:0},veteran={summoned:false,armor:0};
 const armored={summoned:false,armor:6};
 assert.equal(enemyAttackBonus(alive[0],mob,alive),2);
 assert.equal(enemyAttackBonus(alive[0],veteran,alive),0);
 assert.equal(enemyAttackBonus(alive[1],armored,alive),2);
 assert.equal(enemyAttackBonus(alive[1],veteran,alive),0);
 assert.match(enemyIntent({...alive[0],lane:0,weaken:0},alive),/\+2 vs summons/);
 assert.match(enemyIntent({...alive[1],lane:1,weaken:0},alive),/\+2 vs armor/);
});

test('Herbalist actually heals living wounded adventurers after the allied phase',()=>{
 const s=newSiege(()=>0.5);
 s.raid=2;s.encounterPlan=[0,0,1,0,0];
 s.enemies=enemyTemplatesFor(RAIDS,2,s.encounterPlan).map((e,i)=>({
  ...e,id:'e2-'+i,maxHp:e.hp,hp:e.hp,alive:true,poison:0,weaken:0,web:0
 }));
 for(const u of s.units)u.attack=0; // Isolate the new support effect.
 s.enemies[0].hp-=8;
 const before=s.enemies[0].hp;
 assert.equal(endTurn(s,()=>0.5),true);
 assert.equal(s.enemies[0].hp,before+3);
 assert.ok(s.log.some(t=>t.includes('Herbalist mends Guard for 3 HP')));
 assert.ok(restoreSiege(structuredClone(s)));
});

test('new visitors are valid Devour prey and essence provenance follows the authored party',()=>{
 const s=newSiege(()=>0.8);
 s.phase='reward';assert.equal(reinforce(s,'rest'),true);
 assert.equal(s.enemies[1].name,'Lantern Bearer');
 for(const type of Object.keys(FOREST_ENEMY_ROLES)){
  assert.equal(ESSENCE_BY_ENEMY[type].length,2);
 }
 s.enemies[1].hp=8;
 s.hunger=20;
 assert.equal(targetChain(s,s.enemies[1].id),true);
 assert.equal(gnaw(s,()=>0.5),true);
 assert.equal(s.pendingEssence.enemyType,'Lantern Bearer');
 assert.equal(chooseEssence(s,'opening-gambit'),true);
 assert.ok(restoreSiege(structuredClone(s)));
 const forged=structuredClone(s);
 forged.encounterPlan[1]=0; // Original Scouts could never yield this prey.
 assert.equal(restoreSiege(forged),null);
});

test('new roles use the existing five original visitor portraits at identical scale',()=>{
 const plan=generateEncounterPlan(RAIDS,()=>0.8);
 for(let raid=1;raid<RAIDS.length;raid++){
  const foes=enemyTemplatesFor(RAIDS,raid,plan).map((e,i)=>({
   ...e,alive:true,id:'e'+raid+'-'+i
  }));
  const actors=visitorFormation(foes,2172,724);
  assert.equal(actors.length,foes.length);
  for(const actor of actors){
   assert.ok(visitorSpriteIndex(actor.enemy.name)>=0);
   assert.ok(visitorSpriteIndex(actor.enemy.name)<5);
   assert.equal(actor.h,actors[0].h);
   assert.ok(Math.abs(actor.w-actors[0].w)<1e-10);
  }
 }
 const ui=read('dist/siege.js');
 assert.ok(ui.includes('FOREST_ENEMY_ROLES'));
 assert.ok(ui.includes('enemyIntent(focus,state.enemies)'));
 const css=read('dist/siege/forest-game.css');
 assert.ok(css.includes('.target-btn.special-enemy'));
});
