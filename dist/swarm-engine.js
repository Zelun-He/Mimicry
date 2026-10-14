// Tribal battle helpers. Goblins cooperate; disposable Skeletons leave Bones.
// Minions do not replace or level up the run's persistent veteran defenders.
export const MAX_MINIONS=6,MAX_LANE_MINIONS=3,MAX_BONES=6;
export const MINION_STATS=Object.freeze({
 goblin:Object.freeze({name:'Goblin Recruit',hp:4,attack:2}),
 skeleton:Object.freeze({name:'Raised Skeleton',hp:3,attack:2})
});
export function liveMinions(s,species=null,lane=null){
 return (s.minions||[]).filter(m=>m.alive&&m.hp>0&&
   (species===null||m.species===species)&&(lane===null||m.lane===lane));
}
export function lanePopulation(s,lane){return liveMinions(s,null,lane).length;}
export function summonMinions(s,species,count=1,fromBones=false){
 if(!Object.hasOwn(MINION_STATS,species)||!Number.isInteger(count)||count<0)return 0;
 let created=0;
 for(let i=0;i<count;i++){
  if(liveMinions(s).length>=MAX_MINIONS||
     lanePopulation(s,s.summonLane)>=MAX_LANE_MINIONS)break;
  const def=MINION_STATS[species];
  s.minions.push({id:`m${s.nextMinionId++}`,species,name:def.name,
   lane:s.summonLane,maxHp:def.hp,hp:def.hp,attack:def.attack,
   armor:0,alive:true,summoned:true,
   boneReadyTurn:s.turn+(fromBones?1:0)});
  created++;
 }
 return created;
}
export function earnBone(s,minion){
 if(minion?.summoned===true&&minion.species==='skeleton'&&
    minion.boneReadyTurn<=s.turn&&s.bones<MAX_BONES){
  s.bones++;
  return true;
 }
 return false;
}
export function goblinPackBonus(s,lane){
 return liveMinions(s,'goblin',lane).length>=2?1:0;
}
export function goblinScavenge(s,killer){
 return killer?.summoned===true&&killer.species==='goblin'&&
   liveMinions(s,'goblin').length>=3?1:0;
}
export function clearMinions(s){s.minions=[];s.bones=0;s.lootClaimedTurn=-1;}
export function validSwarmState(s){
 if(!Number.isInteger(s.summonLane)||s.summonLane<0||s.summonLane>2||
    !Number.isInteger(s.bones)||s.bones<0||s.bones>MAX_BONES||
    !Number.isInteger(s.nextMinionId)||s.nextMinionId<1||
    !Number.isInteger(s.lootClaimedTurn)||s.lootClaimedTurn< -1||s.lootClaimedTurn>s.turn||
    !Array.isArray(s.minions)||s.minions.length>MAX_MINIONS)return false;
 const ids=new Set();
 for(const m of s.minions){
  if(!m||m.summoned!==true||!m.alive||m.hp<=0||
     !Object.hasOwn(MINION_STATS,m.species)||
     typeof m.id!=='string'||!/^m[1-9][0-9]*$/.test(m.id)||
     Number(m.id.slice(1))>=s.nextMinionId||ids.has(m.id)||
     !Number.isInteger(m.lane)||m.lane<0||m.lane>2||
     !Number.isInteger(m.hp)||m.hp>MINION_STATS[m.species].hp||
     m.maxHp!==MINION_STATS[m.species].hp||m.attack!==MINION_STATS[m.species].attack||
     m.armor!==0||!Number.isInteger(m.boneReadyTurn)||
     m.boneReadyTurn<1||m.boneReadyTurn>s.turn+1)return false;
  ids.add(m.id);
 }
 return [0,1,2].every(lane=>lanePopulation(s,lane)<=MAX_LANE_MINIONS);
}
