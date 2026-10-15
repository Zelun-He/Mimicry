// Forest Edge visitors: tactical archetypes, not tankier clones.
// The original five raids are kept as option 0 to preserve v2-v8 saves.
// Alternate parties share the original five-pose visitor atlas.
export const FOREST_ENEMY_ROLES=Object.freeze({
 'Lantern Bearer':Object.freeze({
  icon:'✧',role:'Support · Rally',
  description:'While alive, gives other invaders +1 attack.',
  hook:'rally',portrait:2
 }),
 Herbalist:Object.freeze({
  icon:'✿',role:'Support · Mend',
  description:'After your defenders attack, heals the most wounded living invader by up to 3 HP.',
  hook:'heal',portrait:1
 }),
 Poacher:Object.freeze({
  icon:'⌁',role:'Hunter · Anti-swarm',
  description:'Deals +2 damage when attacking a summoned creature; veterans still take normal damage.',
  hook:'poach',portrait:3
 }),
 Sapper:Object.freeze({
  icon:'⚒',role:'Breaker · Sunder',
  description:'Deals +2 damage to defenders who currently have armor; armor still blocks normally.',
  hook:'sunder',portrait:4
 })
});

const roleEnemy=(name,hp,attack,lane)=>Object.freeze({name,hp,attack,lane});
// Raid 1 remains a reliable tutorial; the Watchman remains the chapter boss.
// Later raids randomly draw one *authored* alternative; no stat inflation.
export const FOREST_ALTERNATES=Object.freeze([
 Object.freeze([]),
 Object.freeze([
  Object.freeze([roleEnemy('Scout',24,5,0),roleEnemy('Lantern Bearer',20,3,2)]),
  Object.freeze([roleEnemy('Poacher',22,4,0),roleEnemy('Scout',24,5,2)])
 ]),
 Object.freeze([
  Object.freeze([roleEnemy('Guard',32,6,0),roleEnemy('Herbalist',22,3,1),roleEnemy('Archer',22,4,2)]),
  Object.freeze([roleEnemy('Sapper',28,5,0),roleEnemy('Scout',24,5,1),roleEnemy('Archer',22,4,2)])
 ]),
 Object.freeze([
  Object.freeze([roleEnemy('Poacher',30,5,0),roleEnemy('Mage',28,8,2)]),
  Object.freeze([roleEnemy('Rogue',34,7,0),roleEnemy('Herbalist',24,3,2)])
 ]),
 Object.freeze([
  Object.freeze([roleEnemy('Watchman',72,9,1),roleEnemy('Lantern Bearer',20,3,0),roleEnemy('Guard',30,5,2)])
 ])
]);

export function encounterOptions(raids,index){
 return [raids[index].enemies,...FOREST_ALTERNATES[index]];
}
export function validEncounterPlan(raids,plan){
 return Array.isArray(plan)&&plan.length===raids.length&&
  plan.every((choice,index)=>Number.isInteger(choice)&&choice>=0&&
   choice<encounterOptions(raids,index).length)&&plan[0]===0;
}
export function generateEncounterPlan(raids,rng=Math.random){
 return raids.map((_,index)=>{
  if(index===0)return 0; // No surprises in the first tutorial fight.
  const choices=encounterOptions(raids,index);
  const raw=Number(rng());
  const roll=Number.isFinite(raw)?Math.min(.999999,Math.max(0,raw)):0;
  // With seeded 0 / 0.5 tests and legacy playthroughs, the canonical
  // original fight remains possible. Other runs gain surprising casts.
  if(roll<.65||choices.length===1)return 0;
  return 1+Math.min(choices.length-2,Math.floor((roll-.65)/.35*(choices.length-1)));
 });
}
export function enemyTemplatesFor(raids,index,plan){
 return encounterOptions(raids,index)[plan[index]];
}
export function authoredRaidsForPlan(raids,plan){
 return raids.map((raid,index)=>({...raid,enemies:enemyTemplatesFor(raids,index,plan)}));
}
export function enemyAttackBonus(enemy,defender,foes){
 const rally=(foes||[]).some(other=>other.alive&&other.hp>0&&
  other.name==='Lantern Bearer'&&other.id!==enemy.id)?1:0;
 return rally+(enemy.name==='Poacher'&&defender?.summoned?2:0)+
  (enemy.name==='Sapper'&&(defender?.armor||0)>0?2:0);
}
export function enemyIntent(enemy,foes=[]){
 if(!enemy)return 'No incoming attack';
 const base=Math.max(0,enemy.attack-(enemy.weaken||0));
 const attack=base+enemyAttackBonus(enemy,null,foes);
 const lane='Lane '+(enemy.lane+1);
 switch(enemy.name){
  case 'Lantern Bearer':return 'SIGNAL · Allies +1 attack · '+lane+' · '+attack+' damage';
  case 'Herbalist':return 'MEND · Heal weakest wounded ally +3 · '+lane+' · '+attack+' damage';
  case 'Poacher':return 'HUNT · '+lane+' · '+attack+' damage (+2 vs summons)';
  case 'Sapper':return 'SUNDER · '+lane+' · '+attack+' damage (+2 vs armor)';
  default:return 'Attack '+lane+' · '+attack+' damage';
 }
}
