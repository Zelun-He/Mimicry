// Tier 1 is one cohesive forest expedition with five visual moments.
// Presentation only: do not change raid balance, enemies, or saved combat state.
import {CARDS,chainSlotCount} from '../chain-engine.js';

export const FOREST_SCENES=Object.freeze([
 Object.freeze({id:'sunbreak',name:'Sunbreak Clearing',eyebrow:'I · THE FIRST FOOTSTEPS',subtitle:'Warm light, rusted blades, and a chest that should not be here.',objective:'Try your first two-card chain. Weak villagers cannot be underestimated forever.',color:'#eec988'}),
 Object.freeze({id:'fernway',name:'Fernway Trail',eyebrow:'II · BOOTS ON THE PATH',subtitle:'Scouts follow the footprints, unaware the forest is watching.',objective:'Stack two matching recruit cards to build a mob in one chain slot.',color:'#b8db9b'}),
 Object.freeze({id:'briar',name:'Briar Hollow',eyebrow:'III · THORNS IN THE MIST',subtitle:'Briars tighten around the old trail. Shields glitter between the roots.',objective:'Use armor, poison and summoned minions to blunt the militia.',color:'#e5b389'}),
 Object.freeze({id:'wispwood',name:'Wispwood Grove',eyebrow:'IV · THE GATHERING DARK',subtitle:'Fireflies gather above abandoned trinkets. Some treasure has teeth.',objective:'Set your focus and choose a finishing Gnaw for a stolen trait.',color:'#c5dafa'}),
 Object.freeze({id:'watchgate',name:'The Old Watchgate',eyebrow:'V · NO TREASURE LEAVES',subtitle:'Beyond the last pines, the Watchman arrives to reclaim the forest.',objective:'Build your strongest formation and protect the King Mimic.',color:'#f5c78b'})
]);
export const sceneForRaid=raid=>FOREST_SCENES[Math.min(FOREST_SCENES.length-1,Math.max(0,Number.isInteger(raid)?raid:0))];

export function nextActionTip(s){
 if(s.pendingEssence)return {tag:'STOLEN ESSENCE',title:'A new power is yours.',text:'Choose one of the adventurer’s two traits or let it fade. You can equip at most three.'};
 if(s.phase==='reward')return {tag:'REWARD • UNLOCK',title:'Every raid changes your deck.',text:'Buy a creature card or enhance a command with gold. Then pick one free reinforcement.'};
 if(s.phase==='won')return {tag:'TIER I COMPLETE',title:'The forest belongs to the Mimic.',text:'Your first expedition is complete. A different card draw can lead to a very different victory.'};
 if(s.phase==='lost')return {tag:'TRY ANOTHER BUILD',title:'Even fallen monsters teach you something.',text:'Try keeping defenders behind a temporary swarm, and spend gold on one reliable combo.'};
 if(s.raid===0&&s.turn===1&&s.deck.chain.length===0){
  const recruits=s.deck.hand.filter(c=>CARDS[c.type]?.kind==='summon');
  return {tag:'FIRST TURN • 1 OF 3',title:'Build a tiny ambush.',text:recruits.length>=2?'Add a summon card or a strike. Identical recruits stack to save chain slots.':'Pick a card below. Matching suits or rising ranks unlock stronger linked attacks.'};
 }
 if(s.raid===0&&s.turn===1&&chainSlotCount(s.deck.chain)<2){
  return {tag:'FIRST TURN • 2 OF 3',title:'Link a second command.',text:'Cards sharing a school, equal rank, or one higher rank link together. Green borders mean the chain connects.'};
 }
 if(s.raid===0&&s.turn===1){
  return {tag:'FIRST TURN • 3 OF 3',title:'Set your trap in motion.',text:'Choose a summon lane or focus target, then resolve. Your summons will attack alongside permanent defenders.'};
 }
 if(s.hunger>=20&&s.enemies.some(e=>e.alive&&e.hp+(e.armor||0)<=8)){
  return {tag:'DISCOVERY • DEVOUR',title:'A finishing bite is ready.',text:'Focus the weakened enemy, then use Gnaw for 20 Hunger. A killing bite offers one of two traits.'};
 }
 if(s.raid===0&&s.hunger>=20){
  return {tag:'DISCOVERY • HUNGER',title:'The Mimic is getting hungry.',text:'Gnaw costs 20 Hunger and deals 8 damage. Only a killing bite absorbs a trait.'};
 }
 if(s.deck.chain.length===0&&s.deck.hand.some(c=>CARDS[c.type]?.kind==='summon')){
  return {tag:'TRIBAL TACTIC',title:'Numbers make weak cards dangerous.',text:'Queue matching recruits next to each other to stack their summons into a single chain slot.'};
 }
 return {tag:sceneForRaid(s.raid).eyebrow,title:'Defend your treasure.',text:sceneForRaid(s.raid).objective};
}
export function stageProgress(raid){
 const r=Math.min(4,Math.max(0,raid));
 return FOREST_SCENES.map((scene,i)=>({name:scene.name,completed:i<r,current:i===r,upcoming:i>r}));
}
