// Mimicry 0.2: deterministic, serializable persistent-army battle simulation.
export const SPECIES = Object.freeze({
  goblin:{name:'Goblin',hp:18,attack:6,role:'Raider',trait:'Scavenger'},
  slime:{name:'Slime',hp:28,attack:3,role:'Ooze',trait:'Acid splash'},
  skeleton:{name:'Skeleton',hp:23,attack:5,role:'Undead',trait:'Bone guard'},
  sporeling:{name:'Sporeling',hp:17,attack:3,role:'Nature',trait:'Healing spores'}
});
export const RAIDS=[
 {name:'Curious Villagers',enemies:[{name:'Farmhand',hp:18,attack:3,lane:0},{name:'Forager',hp:20,attack:3,lane:1}]},
 {name:'Forest Scouts',enemies:[{name:'Scout',hp:24,attack:5,lane:0},{name:'Scout',hp:24,attack:5,lane:2}]},
 {name:'Militia Patrol',enemies:[{name:'Guard',hp:32,attack:6,lane:0},{name:'Guard',hp:32,attack:6,lane:1},{name:'Archer',hp:22,attack:4,lane:2}]},
 {name:'Treasure Hunters',enemies:[{name:'Rogue',hp:34,attack:7,lane:0},{name:'Mage',hp:28,attack:8,lane:2}]},
 {name:'The Watchman',enemies:[{name:'Watchman',hp:72,attack:9,lane:1},{name:'Guard',hp:30,attack:5,lane:0},{name:'Guard',hp:30,attack:5,lane:2}]}
];
const COMMANDS={strike:{name:'Strike',symbol:'⚔',detail:'A defender attacks again'},fortify:{name:'Fortify',symbol:'⬟',detail:'Grant 7 armor to a defender'},mend:{name:'Mend',symbol:'✿',detail:'Heal a defender for 8'},frenzy:{name:'Frenzy',symbol:'✦',detail:'All defenders deal +3 this turn'}};
export {COMMANDS};
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function unit(species,id,lane){const def=SPECIES[species];return {id,species,name:def.name,level:1,xp:0,maxHp:def.hp,hp:def.hp,attack:def.attack,lane,armor:0,alive:true,kills:0};}
function enemiesFor(index){return RAIDS[index].enemies.map((e,i)=>({...e,id:`e${index}-${i}`,maxHp:e.hp,hp:e.hp,alive:true}));}
export function newSiege(){return {version:2,phase:'battle',raid:0,turn:1,integrity:30,maxIntegrity:30,hunger:0,gold:0,log:['The first raid approaches.'],units:[unit('goblin','u1',1),unit('slime','u2',1),unit('skeleton','u3',0),unit('sporeling','u4',2)],enemies:enemiesFor(0),selected:null,animations:[],nextId:5};}
const living=(a)=>a.filter(x=>x.alive&&x.hp>0);
function emit(s,id,state){s.animations.push({id,state});}
function note(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,16);}
function harm(s,target,amount){const absorbed=Math.min(target.armor||0,amount);target.armor=Math.max(0,(target.armor||0)-absorbed);const actual=Math.min(target.hp,Math.max(0,amount-absorbed));target.hp-=actual;emit(s,target.id,'damage');if(target.hp===0){target.alive=false;emit(s,target.id,'death');}return actual;}
function experience(s,u,amount){u.xp+=amount;while(u.xp>=u.level*2&&u.level<3){u.xp-=u.level*2;u.level++;u.maxHp+=5;u.attack+=2;u.hp=Math.min(u.maxHp,u.hp+7);note(s,`${u.name} reached level ${u.level}!`);}}
function targetInLane(s,lane){return living(s.enemies).find(e=>e.lane===lane);}
function attackUnit(s,u,bonus=0){const target=targetInLane(s,u.lane);if(!target)return;emit(s,u.id,'attack');const amount=u.attack+bonus;const dealt=harm(s,target,amount);note(s,`${u.name} hit ${target.name} for ${dealt}.`);if(!target.alive){u.kills++;experience(s,u,2);s.hunger=clamp(s.hunger+20,0,100);s.gold+=5;note(s,`${target.name} defeated. +5 gold, +20 Hunger.`);}}
export function previewSiege(s){return {active:living(s.units).length,enemies:living(s.enemies).length,integrity:s.integrity,raid:RAIDS[s.raid]?.name,command:s.selected};}
export function selectCommand(s,command,targetId=null){if(s.phase!=='battle'||!COMMANDS[command])return false;if(targetId!==null&&!living(s.units).some(u=>u.id===targetId))return false;s.selected={command,targetId};return true;}
export function moveUnit(s,id,lane){if(s.phase!=='battle'||!Number.isInteger(lane)||lane<0||lane>2)return false;const u=living(s.units).find(x=>x.id===id);if(!u)return false;u.lane=lane;note(s,`${u.name} moved to lane ${lane+1}.`);return true;}
export function endTurn(s){if(s.phase!=='battle')return false;s.animations=[];let frenzy=0;const cmd=s.selected;if(cmd){const u=living(s.units).find(x=>x.id===cmd.targetId)||living(s.units)[0];if(cmd.command==='strike'&&u)attackUnit(s,u,0);if(cmd.command==='fortify'&&u){u.armor+=7;note(s,`${u.name} gains 7 armor.`);}if(cmd.command==='mend'&&u){const healed=Math.min(8,u.maxHp-u.hp);u.hp+=healed;note(s,`${u.name} healed ${healed}.`);}if(cmd.command==='frenzy'){frenzy=3;note(s,'Frenzy empowers the defenders.');}}
 s.selected=null;
 // Persistent defenders act automatically, prioritizing the first invader in their lane.
 for(const u of living(s.units)){
   if(u.species==='sporeling'){const ally=living(s.units).filter(x=>x.lane===u.lane).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally&&ally.hp<ally.maxHp){ally.hp=Math.min(ally.maxHp,ally.hp+3);note(s,'Sporeling restores 3 health.');}}
   attackUnit(s,u,frenzy);
 }
 if(!living(s.enemies).length){s.phase=s.raid===RAIDS.length-1?'won':'reward';note(s,s.phase==='won'?'The dungeon survived every raid!':'Raid repelled. Choose a reinforcement.');return true;}
 for(const e of living(s.enemies)){
   const defender=living(s.units).filter(u=>u.lane===e.lane).sort((a,b)=>b.armor-a.armor)[0];
   if(defender){const actual=harm(s,defender,e.attack);note(s,`${e.name} strikes ${defender.name} for ${actual}.`);}else{s.integrity=clamp(s.integrity-e.attack,0,s.maxIntegrity);emit(s,'king-mimic','damage');note(s,`${e.name} breaches lane ${e.lane+1}! -${e.attack} integrity.`);}
 }
 if(s.integrity===0){s.phase='lost';emit(s,'king-mimic','death');note(s,'The dungeon has fallen.');}else s.turn++;
 return true;
}
export function devour(s){if(s.phase!=='battle'||s.hunger<100)return false;const foe=living(s.enemies).sort((a,b)=>a.hp-b.hp)[0];if(!foe)return false;s.animations=[];emit(s,'king-mimic','attack');harm(s,foe,25);s.hunger=0;note(s,`The King Mimic devours ${foe.name} for 25 damage!`);if(!foe.alive){s.gold+=5;if(!living(s.enemies).length){s.phase=s.raid===RAIDS.length-1?'won':'reward';note(s,'Raid repelled!');}}return true;}
export function reinforce(s,choice){if(s.phase!=='reward')return false;if(choice==='rest'){for(const u of living(s.units))u.hp=Math.min(u.maxHp,u.hp+8);s.integrity=Math.min(s.maxIntegrity,s.integrity+5);}else if(choice==='recruit'){const types=Object.keys(SPECIES);if(living(s.units).length>=5)return false;const species=types[s.raid%types.length];s.units.push(unit(species,`u${s.nextId++}`,s.raid%3));}else if(choice==='train'){const u=living(s.units).sort((a,b)=>a.level-b.level)[0];if(!u)return false;experience(s,u,u.level*2);}else return false;
 s.raid++;s.enemies=enemiesFor(s.raid);s.turn=1;s.phase='battle';s.selected=null;s.animations=[];for(const u of s.units)u.armor=0;note(s,`Raid ${s.raid+1}: ${RAIDS[s.raid].name}.`);return true;}
export function restoreSiege(v){if(!v||v.version!==2||!['battle','reward','won','lost'].includes(v.phase)||!Number.isInteger(v.raid)||v.raid<0||v.raid>=RAIDS.length||!Array.isArray(v.units)||v.units.length>12||!Array.isArray(v.enemies)||v.enemies.length>10||!Number.isInteger(v.integrity)||v.integrity<0||v.integrity>30||!Number.isInteger(v.hunger)||v.hunger<0||v.hunger>100||!Number.isInteger(v.turn)||v.turn<1||!Number.isInteger(v.nextId)||v.nextId<1)return null;
 const validUnit=u=>u&&typeof u.id==='string'&&SPECIES[u.species]&&Number.isInteger(u.lane)&&u.lane>=0&&u.lane<=2&&Number.isInteger(u.hp)&&Number.isInteger(u.maxHp)&&u.maxHp>=SPECIES[u.species].hp&&u.maxHp<=100&&u.hp>=0&&u.hp<=u.maxHp&&Number.isInteger(u.attack)&&u.attack>=0&&u.attack<=100&&Number.isInteger(u.level)&&u.level>=1&&u.level<=3&&Number.isInteger(u.xp)&&u.xp>=0&&u.xp<=100&&Number.isInteger(u.armor)&&u.armor>=0&&u.armor<=100&&u.alive===(u.hp>0);
 const expected=RAIDS[v.raid].enemies;if(!v.units.every(validUnit)||new Set(v.units.map(u=>u.id)).size!==v.units.length||v.enemies.length!==expected.length||!v.enemies.every((e,i)=>e&&e.id===`e${v.raid}-${i}`&&e.name===expected[i].name&&e.lane===expected[i].lane&&e.maxHp===expected[i].hp&&Number.isInteger(e.hp)&&e.hp>=0&&e.hp<=e.maxHp&&e.alive===(e.hp>0)&&(!e.armor||Number.isInteger(e.armor)))||!Number.isFinite(v.gold)||v.gold<0||!Array.isArray(v.log))return null;
 return {...v,selected:null,animations:[],log:v.log.filter(x=>typeof x==='string').slice(0,16)};
}
