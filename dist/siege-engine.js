import {CARDS,FOUNDING_CARDS,makeDeck,drawCards,queueCard,unqueueCard,discardCard,analyzeChain,chainSlotCount,findRituals,validateDeck} from './chain-engine.js';
import {handSize,cardPower,killHunger,fangDamageBonus,createShop,buyUpgrade,validShopState} from './shop-engine.js';
import {ESSENCE_TRAITS,ESSENCE_BY_ENEMY,hasEssence,redrawLimit,killGold,hungerCost,combatLocked,captureEssence,chooseEssence,validAssimilation} from './assimilation-engine.js';
import {MAX_MINIONS,MAX_LANE_MINIONS,MAX_BONES,liveMinions,lanePopulation,summonMinions,earnBone,goblinPackBonus,goblinScavenge,clearMinions,validSwarmState} from './swarm-engine.js';
export {buyUpgrade} from './shop-engine.js';
export {chooseEssence} from './assimilation-engine.js';
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
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function unit(species,id,lane){const def=SPECIES[species];return {id,species,name:def.name,level:1,xp:0,maxHp:def.hp,hp:def.hp,attack:def.attack,lane,armor:0,alive:true,kills:0};}
function enemiesFor(index){return RAIDS[index].enemies.map((e,i)=>({...e,id:`e${index}-${i}`,maxHp:e.hp,hp:e.hp,alive:true,poison:0,weaken:0}));}
export function newSiege(rng=Math.random){const deck=makeDeck(rng,true);drawCards(deck,8,rng);return {version:7,deck,minions:[],bones:0,summonLane:1,nextMinionId:1,lootClaimedTurn:-1,mutations:[],shopOffers:[],essences:[],essenceHistory:[],pendingEssence:null,phase:'battle',raid:0,turn:1,integrity:30,maxIntegrity:30,hunger:0,gold:0,log:['The first raid approaches.'],units:[unit('goblin','u1',1),unit('slime','u2',1),unit('skeleton','u3',0),unit('sporeling','u4',2)],enemies:enemiesFor(0),selected:null,animations:[],nextId:5,chainTargetId:null};}
const living=(a)=>a.filter(x=>x.alive&&x.hp>0);
function emit(s,id,state){s.animations.push({id,state});}
function note(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,16);}
function harm(s,target,amount){const absorbed=Math.min(target.armor||0,amount);target.armor=Math.max(0,(target.armor||0)-absorbed);const actual=Math.min(target.hp,Math.max(0,amount-absorbed));target.hp-=actual;emit(s,target.id,'damage');if(target.hp===0&&target.alive){
  target.alive=false;emit(s,target.id,'death');
  if(target.summoned&&earnBone(s,target))note(s,`${target.name} fell and left a Bone! (${s.bones}/${MAX_BONES})`);
 }return actual;}
function experience(s,u,amount){u.xp+=amount;while(u.xp>=u.level*2&&u.level<3){u.xp-=u.level*2;u.level++;u.maxHp+=5;u.attack+=2;u.hp=Math.min(u.maxHp,u.hp+7);note(s,`${u.name} reached level ${u.level}!`);}}
function targetInLane(s,lane){return living(s.enemies).find(e=>e.lane===lane);}
function attackUnit(s,u,bonus=0){const target=targetInLane(s,u.lane);if(!target)return;emit(s,u.id,'attack');const amount=u.attack+bonus;const dealt=harm(s,target,amount);note(s,`${u.name} hit ${target.name} for ${dealt}.`);if(!target.alive){u.kills++;experience(s,u,2);s.hunger=clamp(s.hunger+killHunger(s),0,100);const bounty=killGold(s);s.gold+=bounty;note(s,`${target.name} defeated. +${bounty} gold, +${killHunger(s)} Hunger.`);}}
function attackMinion(s,minion,bonus=0){
 if(!minion.alive)return;
 const target=targetInLane(s,minion.lane);
 if(!target)return;
 emit(s,minion.id,'attack');
 const base=minion.attack+bonus+(minion.species==='goblin'?goblinPackBonus(s,minion.lane):0);
 const dealt=harm(s,target,Math.max(0,base));
 note(s,`${minion.name} strikes ${target.name} for ${dealt}.`);
 if(!target.alive){
  s.hunger=clamp(s.hunger+killHunger(s),0,100);
  const reward=killGold(s)+goblinScavenge(s,minion);
  s.gold+=reward;
  note(s,`${target.name} defeated by ${minion.name}. +${reward} gold, +${killHunger(s)} Hunger.`);
 }
}
function finishRaid(s,rng=Math.random){
 if(s.phase!=='battle')return;
 clearMinions(s);
 if(s.raid===RAIDS.length-1){s.phase='won';note(s,'The dungeon survived every raid!');return;}
 const offers=createShop(s,rng);
 if(hasEssence(s,'trail-rations')){const restored=Math.min(3,s.maxIntegrity-s.integrity);s.integrity+=restored;if(restored)note(s,`Trail Rations restore ${restored} dungeon integrity.`);}
 s.phase='reward';
 const clearBonus=8+s.raid*3;
 s.gold+=clearBonus;
 s.shopOffers=offers;
 note(s,`Raid repelled! +${clearBonus} gold. The Goblin Quartermaster has arrived.`);
}
export function queueCommand(s,id){return s.phase==='battle'&&!combatLocked(s)&&queueCard(s.deck,id);}
export function unqueueCommand(s,id){return s.phase==='battle'&&!combatLocked(s)&&unqueueCard(s.deck,id);}
export function redrawCommand(s,id,rng=Math.random){return s.phase==='battle'&&!combatLocked(s)&&discardCard(s.deck,id,rng,handSize(s));}
export function previewChain(s){return analyzeChain(s.deck.chain);}
export function previewRituals(s){return findRituals(s.deck.chain);}
export function setSummonLane(s,lane){
 if(s.phase!=='battle'||combatLocked(s)||!Number.isInteger(lane)||lane<0||lane>2)return false;
 s.summonLane=lane;return true;
}
export function targetChain(s,id){if(s.phase!=='battle'||combatLocked(s))return false;if(id!==null&&!living(s.enemies).some(e=>e.id===id))return false;s.chainTargetId=id;return true;}

export function previewSiege(s){return {active:living(s.units).length,enemies:living(s.enemies).length,integrity:s.integrity,raid:RAIDS[s.raid]?.name,command:s.selected};}
// Legacy one-order commands are retired. Version 2 saves migrate to the card deck.
export function moveUnit(s,id,lane){if(s.phase!=='battle'||combatLocked(s)||!Number.isInteger(lane)||lane<0||lane>2)return false;const u=living(s.units).find(x=>x.id===id);if(!u)return false;u.lane=lane;note(s,`${u.name} moved to lane ${lane+1}.`);return true;}
// Ordered commands resolve before defenders act. Every command has a bounded effect.
function resolveChain(s){
 let frenzy=0;
 const livingAllies=()=>living(s.units);
 const firstAlly=()=>livingAllies().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
 const firstFoe=()=>living(s.enemies).find(e=>e.id===s.chainTargetId)||living(s.enemies).sort((a,b)=>a.hp-b.hp)[0];
 const hit=(enemy,damage,attacker)=>{if(!enemy)return;const wasAlive=enemy.alive;harm(s,enemy,Math.max(0,Math.floor(damage)));if(wasAlive&&!enemy.alive){s.gold+=killGold(s);s.hunger=clamp(s.hunger+killHunger(s),0,100);if(attacker){attacker.kills++;experience(s,attacker,2);}}};
 let previous=null,firstFangAttack=true,firstVenomPoison=true;
 const rituals=findRituals(s.deck.chain);
 const triggerRitual=(r)=>{
  const allies=livingAllies(),foes=living(s.enemies);
  switch(r.id){
   case 'bloodbath':for(const u of allies.filter(u=>u.species==='goblin'))attackUnit(s,u,3);break;
   case 'counteroffensive':{const armor=allies.reduce((total,u)=>total+u.armor,0);hit(firstFoe(),Math.min(25,Math.floor(armor/2)),null);break;}
   case 'toxic-garden':for(const e of foes)e.poison=clamp((e.poison||0)+2,0,50);for(const u of allies.filter(u=>u.species==='sporeling'))u.hp=Math.min(u.maxHp,u.hp+5);break;
   case 'living-wall':for(const u of allies)u.armor=clamp(u.armor+4,0,100);break;
   case 'plague':for(const e of foes)e.poison=clamp((e.poison||0)+4,0,50);break;
  }
  note(s,`RITUAL: ${r.name}!`);
 };
 let index=0;
 for(const step of analyzeChain(s.deck.chain)){
  const {def,streak,resonance,count}=step;
  const multiplier=1+Math.min(streak,3)*0.25;
  const power=Math.floor((cardPower(s,step.card)+(index===0&&hasEssence(s,'opening-gambit')?2:0))*multiplier)+(resonance?1:0);
  const ally=firstAlly(),foe=firstFoe();
  if(!foe){break;}
  const cost=hungerCost(s,def.cost||0);
  if(cost&&s.hunger<cost){note(s,`${def.name} fizzles: requires ${cost} Hunger.`);previous=null;index++;continue;}
  const affinity={fang:'goblin',shell:'skeleton',bloom:'sporeling',venom:'slime'}[def.suit];
  const specialist=livingAllies().find(u=>u.species===affinity);
  switch(def.kind){
   case 'summon':{
    const formed=summonMinions(s,def.tribe,count,false);
    if(formed)note(s,`${def.tribe==='goblin'?'Goblin Mob':'Skeleton Pack'}: ${formed} recruited into lane ${s.summonLane+1}.`);
    if(formed<count)note(s,`Formation full: ${count-formed} recruit card(s) could not summon.`);
    break;
   }
   case 'pack':{
    const mob=[...liveMinions(s,'goblin')];
    for(const member of mob)attackMinion(s,member,1);
    note(s,mob.length?`Pack Attack! ${mob.length} Goblins strike again.`:'Pack Attack fizzles: summon Goblins first.');
    break;
   }
   case 'loot':{
    if(s.lootClaimedTurn!==s.turn&&liveMinions(s,'goblin').length){
     s.gold+=3;s.lootClaimedTurn=s.turn;
     note(s,'Scavenger gang recovers 3 gold!');
    }else note(s,'Loot the Fallen needs an active Goblin and can trigger once per turn.');
    break;
   }
   case 'march':{
    const army=[...liveMinions(s,'skeleton')];
    for(const member of army)attackMinion(s,member,Math.min(s.bones,3));
    note(s,army.length?`Bone March! ${army.length} Skeletons strike again.`:'Bone March fizzles: summon Skeletons first.');
    break;
   }
   case 'bonewall':{
    const consumed=Math.min(3,s.bones);
    const protectedAllies=livingAllies().filter(u=>u.lane===s.summonLane);
    if(consumed&&protectedAllies.length){
     s.bones-=consumed;
     for(const u of protectedAllies)u.armor=clamp(u.armor+consumed*3,0,100);
     note(s,`Ossuary Wall: spent ${consumed} Bones to fortify lane ${s.summonLane+1}.`);
    }else note(s,'Ossuary Wall needs Bones and a permanent ally in the selected lane.');
    break;
   }
   case 'rattle':{
    if(s.bones>=2){
     const raised=summonMinions(s,'skeleton',1,true);
     if(raised){s.bones-=2;note(s,`Rattle the Dead: 2 Bones raise a Skeleton in lane ${s.summonLane+1}.`);}
     else note(s,'Rattle the Dead fizzles: the selected lane is full.');
    }else note(s,'Rattle the Dead fizzles: requires 2 Bones.');
    break;
   }
   case 'strike':{
    const bonus=firstFangAttack&&hasEssence(s,'deadeye')?3:0;
    firstFangAttack=false;
    hit(foe,power+fangDamageBonus(s,step.card)+(specialist?2:0)+bonus,specialist);break;
   }
   case 'execute':{
    const weakened=foe.hp<=foe.maxHp/2;
    const bonus=firstFangAttack&&hasEssence(s,'deadeye')?3:0;
    firstFangAttack=false;
    hit(foe,power+fangDamageBonus(s,step.card)+(weakened?8:0)+(weakened&&hasEssence(s,'cruel-precision')?6:0)+(specialist?2:0)+bonus,specialist);break;
   }
   case 'frenzy':frenzy+=power;break;
   case 'armor':if(ally)ally.armor=clamp(ally.armor+power+(specialist?2:0)+(hasEssence(s,'shield-drill')?3:0),0,100);break;
   case 'thorns':if(ally){ally.armor=clamp(ally.armor+power+(hasEssence(s,'shield-drill')?3:0),0,100);hit(foe,Math.floor(ally.armor/2),specialist);}break;
   case 'counter':if(ally)hit(foe,ally.armor+(specialist?2:0),specialist);break;
   case 'heal':if(ally)ally.hp=Math.min(ally.maxHp,ally.hp+power+(specialist?2:0)+(hasEssence(s,'herbal-gut')?2:0));break;
   case 'teamheal':for(const u of livingAllies())u.hp=Math.min(u.maxHp,u.hp+power+(hasEssence(s,'herbal-gut')?2:0));break;
   case 'weaken':foe.weaken=clamp((foe.weaken||0)+power,0,foe.attack);break;
   case 'poison':{
    const barbed=firstVenomPoison&&hasEssence(s,'barbed-quiver')?2:0;
    firstVenomPoison=false;
    foe.poison=clamp((foe.poison||0)+power+(specialist?1:0)+(hasEssence(s,'witchfire')?2:0)+barbed,0,50);break;
   }
   case 'corrode':{
    const barbed=firstVenomPoison&&hasEssence(s,'barbed-quiver')?2:0;
    firstVenomPoison=false;
    foe.armor=Math.max(0,(foe.armor||0)-power);
    foe.poison=clamp((foe.poison||0)+power+(specialist?1:0)+(hasEssence(s,'witchfire')?2:0)+barbed,0,50);break;
   }
   case 'spread':for(const e of living(s.enemies))if(e!==foe)e.poison=clamp((e.poison||0)+Math.max(2,foe.poison),0,50);break;
   case 'detonate':hit(foe,(foe.poison||0)*power,specialist);foe.poison=0;break;
   case 'sacrifice':{
    // The strongest survivor pays the cost; never reduce a defender below 1 HP.
    const donor=livingAllies().filter(u=>u.hp>1).sort((a,b)=>b.hp-a.hp)[0];
    if(!donor){note(s,'Sacrificial Strike fizzles: no defender can pay the price.');break;}
    const cost=Math.min(donor.hp-1,Math.max(1,Math.ceil(donor.hp/4)));
    donor.hp-=cost;emit(s,donor.id,'damage');
    hit(foe,power+cost+(specialist?2:0)+(firstFangAttack&&hasEssence(s,'deadeye')?3:0),specialist);firstFangAttack=false;
    note(s,`${donor.name} sacrifices ${cost} HP to empower the strike.`);
    break;
   }
   case 'tithe':{
    let remaining=power,spent=0;
    for(const u of livingAllies().sort((a,b)=>b.armor-a.armor)){
     if(remaining<=0)break;
     const used=Math.min(remaining,u.armor);u.armor-=used;spent+=used;remaining-=used;
    }
    if(spent>0){hit(foe,spent*2,specialist);note(s,`Bone Tithe consumes ${spent} armor for ${spent*2} damage.`);}
    else note(s,'Bone Tithe fizzles: no armor to sacrifice.');
    break;
   }
   case 'harvest':{
    const consumed=Math.min(power,foe.poison||0);
    foe.poison-=consumed;
    if(consumed>0){for(const u of livingAllies())u.hp=Math.min(u.maxHp,u.hp+consumed*3);note(s,`Spore Harvest spends ${consumed} poison to heal every defender.`);}
    else note(s,'Spore Harvest fizzles: the target has no poison.');
    break;
   }
   case 'mirror':{
    // Explicit finite whitelist: no nested mirrors, Hunger recursion, or duplicate rituals.
    const repeatable=['strike','heal','armor','poison','teamheal','weaken'];
    if(!previous||!repeatable.includes(previous.kind)){
     note(s,'Mirror Fang fizzles: place it after Strike, Mend, Fortify, Poison, or a similar simple command.');
     break;
    }
    s.hunger-=cost;
    const copied=Math.max(1,Math.floor(previous.power/2));
    if(previous.kind==='strike')hit(foe,copied,null);
    else if(previous.kind==='poison')foe.poison=clamp((foe.poison||0)+copied,0,50);
    else if(previous.kind==='weaken')foe.weaken=clamp((foe.weaken||0)+copied,0,foe.attack);
    else if(previous.kind==='teamheal'){for(const u of livingAllies())u.hp=Math.min(u.maxHp,u.hp+copied);}
    else if(previous.kind==='heal'){if(ally)ally.hp=Math.min(ally.maxHp,ally.hp+copied);}
    else if(previous.kind==='armor'){if(ally)ally.armor=clamp(ally.armor+copied,0,100);}
    note(s,`Mirror Fang repeats a ${previous.kind} command at half strength.`);
    break;
   }
   case 'decree':if(s.hunger>=cost&&previous&&previous.kind!=='decree'&&previous.kind!=='feast'){s.hunger-=cost;const bonus=Math.min(12,previous.power);for(const u of livingAllies())attackUnit(s,u,bonus);}break;
   case 'feast':if(s.hunger>=cost){s.hunger-=cost;hit(foe,power,null);}break;
  }
  note(s,`${def.name}${step.linked?' [CHAIN]':''}${specialist?' [AFFINITY]':''} activated.`);
  previous={kind:def.kind,power};
  for(const match of rituals)if(match.end===index)triggerRitual(match.ritual);
  index++;
 }
 return frenzy;
}
export function endTurn(s,rng=Math.random){if(s.phase!=='battle'||combatLocked(s))return false;s.animations=[];let frenzy=0;
 const playedChainLength=chainSlotCount(s.deck.chain);
 if(s.deck){if(s.deck.chain.length)frenzy=resolveChain(s);s.deck.discard.push(...s.deck.chain,...s.deck.hand);s.deck.chain=[];s.deck.hand=[];s.deck.discardsLeft=redrawLimit(s);}
 s.chainTargetId=null;
s.selected=null;
 if(hasEssence(s,'royal-discipline')&&playedChainLength>=3)frenzy+=2;
 // Disposable summons attack before veterans, making swarm density matter.
 for(const minion of [...liveMinions(s)])attackMinion(s,minion,frenzy);
 // Persistent defenders act automatically, prioritizing the first invader in their lane.
 for(const u of living(s.units)){
   if(u.species==='sporeling'){const ally=living(s.units).filter(x=>x.lane===u.lane).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally&&ally.hp<ally.maxHp){ally.hp=Math.min(ally.maxHp,ally.hp+3);note(s,'Sporeling restores 3 health.');}}
   attackUnit(s,u,frenzy);
 }
 if(!living(s.enemies).length){finishRaid(s,rng);return true;}
 let defenderWard=hasEssence(s,'iron-reflex'),breachWard=hasEssence(s,'straw-ward');
 for(const e of living(s.enemies)){
   if(e.poison>0){harm(s,e,e.poison);e.poison=Math.max(0,e.poison-1);note(s,`${e.name} suffers poison.`);if(!e.alive){s.gold+=killGold(s);s.hunger=clamp(s.hunger+killHunger(s),0,100);const source=living(s.units).find(u=>u.species==='slime');if(source){source.kills++;experience(s,source,2);}continue;}}
   const defender=liveMinions(s,null,e.lane)[0]||
     living(s.units).filter(u=>u.lane===e.lane).sort((a,b)=>b.armor-a.armor)[0];
   if(defender){
    const prevented=!defender.summoned&&defenderWard?3:0;
    if(!defender.summoned)defenderWard=false;
    const actual=harm(s,defender,Math.max(0,e.attack-(e.weaken||0)-prevented));
    e.weaken=0;note(s,`${e.name} strikes ${defender.name} for ${actual}.`);
   }else{
    const prevented=breachWard?3:0;breachWard=false;
    const before=s.integrity;
    s.integrity=clamp(s.integrity-Math.max(0,e.attack-(e.weaken||0)-prevented),0,s.maxIntegrity);
    e.weaken=0;emit(s,'king-mimic','damage');
    note(s,`${e.name} breaches lane ${e.lane+1}! -${before-s.integrity} integrity.`);
   }
 }
 s.minions=liveMinions(s);
 if(s.integrity===0){s.phase='lost';emit(s,'king-mimic','death');note(s,'The dungeon has fallen.');return true;}
 if(!living(s.enemies).length){finishRaid(s,rng);return true;}
 s.turn++;if(s.deck)drawCards(s.deck,handSize(s),rng);
 return true;
}
// Two feeding modes reward different skills: Gnaw is cheap but demands
// precise setup; Devour is expensive but a reliable finisher.
function feed(s,cost,damage,verb,rng=Math.random){
 if(s.phase!=='battle'||combatLocked(s)||s.hunger<cost)return false;
 const foes=living(s.enemies);
 const foe=foes.find(e=>e.id===s.chainTargetId)||foes.sort((a,b)=>a.hp-b.hp)[0];
 if(!foe)return false;
 s.animations=[];emit(s,'king-mimic','attack');
 harm(s,foe,damage);
 s.hunger-=cost;
 note(s,`The King Mimic ${verb} ${foe.name} for ${damage} damage!`);
 if(!foe.alive){
  s.gold+=killGold(s);
  s.chainTargetId=null;
  if(captureEssence(s,foe))note(s,`The King Mimic swallowed ${foe.name}'s essence! Choose an inherited trait.`);
  else note(s,`The King Mimic consumed ${foe.name}, but learned nothing new.`);
  if(!living(s.enemies).length)finishRaid(s,rng);
 }
 return true;
}
export function gnaw(s,rng=Math.random){return feed(s,20,8,'gnaws',rng);}
export function devour(s,rng=Math.random){return feed(s,100,25,'devours',rng);}
export function reinforce(s,choice){if(s.phase!=='reward'||combatLocked(s))return false;if(choice==='rest'){for(const u of living(s.units))u.hp=Math.min(u.maxHp,u.hp+8);s.integrity=Math.min(s.maxIntegrity,s.integrity+5);}else if(choice==='recruit'){const types=Object.keys(SPECIES);if(living(s.units).length>=5)return false;const species=types[s.raid%types.length];s.units.push(unit(species,`u${s.nextId++}`,s.raid%3));}else if(choice==='train'){const u=living(s.units).sort((a,b)=>a.level-b.level)[0];if(!u)return false;experience(s,u,u.level*2);}else return false;
 s.raid++;s.shopOffers=[];s.enemies=enemiesFor(s.raid);clearMinions(s);s.summonLane=1;if(s.deck){s.deck.discard.push(...s.deck.hand,...s.deck.chain);s.deck.hand=[];s.deck.chain=[];s.deck.discardsLeft=redrawLimit(s);drawCards(s.deck,handSize(s));}s.turn=1;s.phase='battle';s.selected=null;s.chainTargetId=null;s.animations=[];for(const u of s.units)u.armor=u.alive&&hasEssence(s,'unyielding-heart')?4:0;note(s,`Raid ${s.raid+1}: ${RAIDS[s.raid].name}.`);return true;}
export function restoreSiege(v){
 if(!v||![2,3,4,5,6,7].includes(v.version)||!['battle','reward','won','lost'].includes(v.phase)||
    !Number.isInteger(v.raid)||v.raid<0||v.raid>=RAIDS.length||
    !Array.isArray(v.units)||v.units.length>12||
    !Array.isArray(v.enemies)||v.enemies.length>10||
    !Number.isInteger(v.integrity)||v.integrity<0||
    v.integrity>(v.version>=4?v.maxIntegrity:30)||
    !Number.isInteger(v.hunger)||v.hunger<0||v.hunger>100||
    !Number.isInteger(v.turn)||v.turn<1||
    !Number.isInteger(v.nextId)||v.nextId<1)return null;
 const validUnit=u=>u&&typeof u.id==='string'&&SPECIES[u.species]&&Number.isInteger(u.lane)&&u.lane>=0&&u.lane<=2&&Number.isInteger(u.hp)&&Number.isInteger(u.maxHp)&&u.maxHp>=SPECIES[u.species].hp&&u.maxHp<=100&&u.hp>=0&&u.hp<=u.maxHp&&Number.isInteger(u.attack)&&u.attack>=0&&u.attack<=100&&Number.isInteger(u.level)&&u.level>=1&&u.level<=3&&Number.isInteger(u.xp)&&u.xp>=0&&u.xp<=100&&Number.isInteger(u.armor)&&u.armor>=0&&u.armor<=100&&u.alive===(u.hp>0);
 const expected=RAIDS[v.raid].enemies;
 if(!v.units.every(validUnit)||new Set(v.units.map(u=>u.id)).size!==v.units.length||
    v.enemies.length!==expected.length||
    !v.enemies.every((e,i)=>e&&e.id===`e${v.raid}-${i}`&&e.name===expected[i].name&&
      e.lane===expected[i].lane&&e.maxHp===expected[i].hp&&
      Number.isInteger(e.hp)&&e.hp>=0&&e.hp<=e.maxHp&&e.alive===(e.hp>0)&&
      (!e.armor||Number.isInteger(e.armor)))||
    !Number.isInteger(v.gold)||v.gold<0||!Array.isArray(v.log))return null;
 // Validate old formats before migration; do not trust malformed mutation fields.
 if(v.version===4&&!validShopState(v,true))return null;
 if(v.version>=5&&!validShopState(v,false,v.version===7))return null;
 if(v.version>=6&&!validAssimilation(v,RAIDS))return null;
 if(v.version===7&&!validSwarmState(v))return null;
 if(v.version>=3&&!validateDeck(v.deck,v.version>=4?handSize(v):8,v.version<5,v.version>=6?redrawLimit(v):2,v.version===7))return null;
 if(v.version>=3&&v.chainTargetId!==undefined&&v.chainTargetId!==null&&
    (typeof v.chainTargetId!=='string'||!v.enemies.some(e=>e.id===v.chainTargetId&&e.alive)))return null;
 if(v.version>=5&&(v.deck.acquired.length>(v.raid+(v.phase==='reward'?1:0))*(v.version===7?2:1)||
    v.deck.acquiredAt.some(raid=>raid>=v.raid+(v.phase==='reward'?1:0))))return null;
 const deck=v.version>=3?{...v.deck,acquired:v.version>=5?v.deck.acquired:[],
   acquiredAt:v.version>=5?v.deck.acquiredAt:[]}:makeDeck(()=>0.5);
 if(v.version<7){
  deck.tribal=true;
  deck.draw.push(...FOUNDING_CARDS.map((type,i)=>({id:`f${i}`,type})));
 }
 if(v.version===2)drawCards(deck,8,()=>0.5);
 const mutations=v.version>=4?v.mutations:[];
 let shopOffers=v.version>=5?v.shopOffers:
   v.version===4?(v.phase==='reward'?[...v.shopOffers,createShop({mutations},()=>0.5)[3]]:v.shopOffers):
   (v.phase==='reward'?createShop({mutations},()=>0.5):[]);
 if(v.phase==='reward'&&v.version<7&&shopOffers.length<5){
  // Existing purchased upgrades, choice and price remain unchanged.
  const newOffer=createShop({...v,deck,mutations},()=>0.5)[4];
  shopOffers=[...shopOffers,newOffer];
 }
 return {...v,version:7,deck,mutations,shopOffers,
   minions:v.version===7?v.minions:[],bones:v.version===7?v.bones:0,
   summonLane:v.version===7?v.summonLane:1,
   nextMinionId:v.version===7?v.nextMinionId:1,
   lootClaimedTurn:v.version===7?v.lootClaimedTurn:-1,
   essences:v.version>=6?v.essences:[],essenceHistory:v.version>=6?v.essenceHistory:[],pendingEssence:v.version>=6?v.pendingEssence:null,
   chainTargetId:living(v.enemies).some(e=>e.id===v.chainTargetId)?v.chainTargetId:null,
   selected:null,animations:[],log:v.log.filter(x=>typeof x==='string').slice(0,16)};
}
