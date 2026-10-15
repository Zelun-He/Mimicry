// Mimicry 0.8 — devour/assimilation rules. Stateless traits, a capped three-slot
// stomach, and a provenance ledger keep replacement and save migration predictable.
export const ESSENCE_CAPACITY=3;
export const ESSENCE_TRAITS=Object.freeze({
 'straw-ward':{name:'Straw Ward',enemy:'Farmhand',school:'shell',description:'The first empty-lane breach each turn deals 3 less integrity damage.'},
 'copper-purse':{name:'Copper Purse',enemy:'Farmhand',school:'fang',description:'Earn +2 gold each time an invader dies.'},
 'herbal-gut':{name:'Herbal Gut',enemy:'Forager',school:'bloom',description:'Bloom healing commands restore +2 HP to each affected defender.'},
 'wild-pockets':{name:'Wild Pockets',enemy:'Forager',school:'bloom',description:'Gain a third discard/redraw each turn.'},
 'opening-gambit':{name:'Opening Gambit',enemy:'Scout',school:'fang',description:'The first command in your chain gains +2 base power.'},
 'trail-rations':{name:'Trail Rations',enemy:'Scout',school:'bloom',description:'Restore 3 dungeon integrity when a raid is repelled.'},
 'shield-drill':{name:'Shield Drill',enemy:'Guard',school:'shell',description:'Shell armor commands grant +3 additional armor.'},
 'iron-reflex':{name:'Iron Reflex',enemy:'Guard',school:'shell',description:'Prevent 3 damage from the first invader attack against a defender each turn.'},
 'deadeye':{name:'Deadeye',enemy:'Archer',school:'fang',description:'The first Fang strike or execution in a chain deals +3 damage.'},
 'barbed-quiver':{name:'Barbed Quiver',enemy:'Archer',school:'venom',description:'The first Venom poison application in a chain adds +2 poison.'},
 'sticky-fingers':{name:'Sticky Fingers',enemy:'Rogue',school:'fang',description:'Earn +2 additional gold per slain invader.'},
 'cruel-precision':{name:'Cruel Precision',enemy:'Rogue',school:'fang',description:'Executions deal +6 damage to enemies at half HP or below.'},
 'witchfire':{name:'Witchfire',enemy:'Mage',school:'venom',description:'Venom poison and Corrode commands apply +2 more poison.'},
 'mana-gullet':{name:'Mana Gullet',enemy:'Mage',school:'hunger',description:'Hunger commands cost 10 less Hunger (minimum 0).'},
 'royal-discipline':{name:'Royal Discipline',enemy:'Watchman',school:'fang',description:'After a chain of 3+ cards, surviving defenders deal +2 on their automatic attacks.'},
 'unyielding-heart':{name:'Unyielding Heart',enemy:'Watchman',school:'shell',description:'At the start of each new raid, all surviving defenders gain 4 armor.'}
});
export const ESSENCE_BY_ENEMY=Object.freeze({
 Farmhand:['straw-ward','copper-purse'],
 Forager:['herbal-gut','wild-pockets'],
 Scout:['opening-gambit','trail-rations'],
 Guard:['shield-drill','iron-reflex'],
 Archer:['deadeye','barbed-quiver'],
 Rogue:['sticky-fingers','cruel-precision'],
 Mage:['witchfire','mana-gullet'],
 Watchman:['royal-discipline','unyielding-heart'],
 // Forest Edge visitors reuse two established essence families so all
 // alternate foes can be Devoured without adding unbalanced new passives.
 'Lantern Bearer':['opening-gambit','trail-rations'],
 Herbalist:['herbal-gut','wild-pockets'],
 Poacher:['deadeye','barbed-quiver'],
 Sapper:['shield-drill','iron-reflex']
});
export const hasEssence=(s,id)=>Array.isArray(s.essences)&&s.essences.includes(id);
export const redrawLimit=s=>2+(hasEssence(s,'wild-pockets')?1:0);
export const killGold=s=>5+(hasEssence(s,'copper-purse')?2:0)+(hasEssence(s,'sticky-fingers')?2:0);
export const hungerCost=(s,cost)=>Math.max(0,cost-(hasEssence(s,'mana-gullet')?10:0));
export const combatLocked=s=>Boolean(s.pendingEssence);

export function captureEssence(s,enemy){
 const possibilities=ESSENCE_BY_ENEMY[enemy?.name];
 if(!possibilities||s.pendingEssence||enemy.alive||
    s.essenceHistory.some(entry=>entry.enemyId===enemy.id)||
    possibilities.every(id=>hasEssence(s,id)))return false;
 s.pendingEssence={enemyId:enemy.id,enemyType:enemy.name};
 return true;
}

// The only valid actions during capture are: choose an offered trait, explicitly
// replace one of the three equipped traits, or discard the captured essence.
export function chooseEssence(s,traitId,replaceId=null){
 const pending=s.pendingEssence;
 if(!pending)return false;
 if(traitId==='skip'){
  if(replaceId!==null)return false;
  s.pendingEssence=null;
  s.log.unshift('The King Mimic lets the stolen essence fade.');s.log=s.log.slice(0,16);
  return true;
 }
 if(!ESSENCE_BY_ENEMY[pending.enemyType]?.includes(traitId)||
    hasEssence(s,traitId))return false;
 const full=s.essences.length>=ESSENCE_CAPACITY;
 if(full?(!s.essences.includes(replaceId)||replaceId===traitId):replaceId!==null)return false;
 const previouslyExtra=hasEssence(s,'wild-pockets');
 if(full)s.essences.splice(s.essences.indexOf(replaceId),1);
 s.essences.push(traitId);
 s.essenceHistory.push({traitId,enemyId:pending.enemyId,raid:s.raid,replaced:full?replaceId:null});
 s.pendingEssence=null;
 const nowExtra=hasEssence(s,'wild-pockets');
 if(s.phase==='battle'&&!previouslyExtra&&nowExtra)s.deck.discardsLeft=Math.min(3,s.deck.discardsLeft+1);
 if(previouslyExtra&&!nowExtra)s.deck.discardsLeft=Math.min(2,s.deck.discardsLeft);
 s.log.unshift(`Assimilated ${ESSENCE_TRAITS[traitId].name}${full?' in place of '+ESSENCE_TRAITS[replaceId].name:''}!`);
 s.log=s.log.slice(0,16);
 return true;
}

// A local save is not tamper-proof, but replaying the provenance ledger prevents
// duplicates, fabricated monster origins, fourth slots, and stale pending prey.
export function validAssimilation(s,raids){
 if(!Array.isArray(s.essences)||s.essences.length>ESSENCE_CAPACITY||
    new Set(s.essences).size!==s.essences.length||
    s.essences.some(id=>!Object.hasOwn(ESSENCE_TRAITS,id)))return false;
 if(!Array.isArray(s.essenceHistory)||s.essenceHistory.length>12)return false;
 const reconstructed=[],consumed=new Set();
 let lastRaid=-1;
 for(const entry of s.essenceHistory){
  if(!entry||typeof entry.traitId!=='string'||typeof entry.enemyId!=='string'||
     !Number.isInteger(entry.raid)||entry.raid<0||entry.raid>s.raid||
     entry.raid<lastRaid||consumed.has(entry.enemyId))return false;
  const raid=raids[entry.raid];
  const origin=raid?.enemies.find((enemy,i)=>`e${entry.raid}-${i}`===entry.enemyId);
  if(!origin||!ESSENCE_BY_ENEMY[origin.name]?.includes(entry.traitId)||
     reconstructed.includes(entry.traitId))return false;
  if(reconstructed.length===ESSENCE_CAPACITY){
   const i=reconstructed.indexOf(entry.replaced);
   if(i<0)return false;
   reconstructed.splice(i,1);
  }else if(entry.replaced!==null)return false;
  reconstructed.push(entry.traitId);
  consumed.add(entry.enemyId);
  lastRaid=entry.raid;
 }
 if(reconstructed.length!==s.essences.length||
    reconstructed.some((id,i)=>id!==s.essences[i]))return false;
 const pending=s.pendingEssence;
 if(pending!==null){
  if(!pending||typeof pending.enemyId!=='string'||typeof pending.enemyType!=='string'||
     consumed.has(pending.enemyId)||!ESSENCE_BY_ENEMY[pending.enemyType]||
     ESSENCE_BY_ENEMY[pending.enemyType].every(id=>s.essences.includes(id))||
     !['battle','reward','won'].includes(s.phase))return false;
  const foe=s.enemies.find(e=>e.id===pending.enemyId);
  if(!foe||foe.name!==pending.enemyType||foe.alive||foe.hp!==0)return false;
 }
 return true;
}
