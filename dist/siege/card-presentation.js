// Card presentation is deliberately separate from the deterministic Siege engine.
// Rank is the chain-link number, NOT a mana cost. Only Hunger cards spend a
// resource; buying a card has a separate shop gold price.
import {CARDS} from '../chain-engine.js';
import {CARD_LORE} from './card-art.js';

const define=(role,primary,secondary,keywords)=>Object.freeze({role,primary,secondary,keywords:Object.freeze(keywords)});
export const CARD_PRESENTATION=Object.freeze({
 strike:define('STRIKE','Deal 4 damage.','A simple Fang opener.',['ATTACK','FANG']),
 blood:define('LINKER','Deal 5 damage.','Chain into another Fang attack.',['ATTACK','CHAIN']),
 ambush:define('LINKER','Deal 7 damage.','Links can strengthen the hit.',['ATTACK','CHAIN']),
 execute:define('FINISHER','Deal 7 damage.','+8 against a half-health target.',['ATTACK','EXECUTE']),
 frenzy:define('ENGINE','Empower your defenders.','Add 2 attack this turn, before links.',['TEAM','ATTACK']),
 fortify:define('GUARD','Grant 7 Armor.','Protect the most wounded defender.',['ARMOR','DEFENSE']),
 guard:define('GUARD','Grant 9 Armor.','Reinforce the most wounded ally.',['ARMOR','DEFENSE']),
 thorns:define('COUNTER','Grant 4 Armor.','Strike for half the ally’s total Armor.',['ARMOR','COUNTER']),
 counter:define('PAYOFF','Strike with stored Armor.','Damage equals the weakest ally’s Armor.',['ARMOR','ATTACK']),
 mend:define('RECOVERY','Restore 7 HP.','Heal the most wounded defender.',['HEAL','SINGLE']),
 roots:define('CONTROL','Weaken target by 2.','Reduce its attack this battle.',['WEAKEN','CONTROL']),
 regrow:define('RECOVERY','Restore 10 HP.','Heal the most wounded defender.',['HEAL','SINGLE']),
 symbiosis:define('RECOVERY','Restore 4 HP to all allies.','The whole colony recovers.',['HEAL','TEAM']),
 bite:define('POISON','Inflict 3 Poison.','Wear down the focused invader.',['POISON','SETUP']),
 corrode:define('CONTROL','Strip 3 Armor.','Also inflict 3 Poison.',['ARMOR BREAK','POISON']),
 contagion:define('SPREAD','Spread target’s Poison.','Infect every other living invader.',['POISON','SPREAD']),
 detonate:define('FINISHER','Burst the target’s Poison.','Deal 2 damage per stack, then clear it.',['POISON','PAYOFF']),
 decree:define('COMMAND','Spend 30 Hunger.','All defenders echo the prior command’s power.',['HUNGER','TEAM']),
 feast:define('FINISHER','Spend 40 Hunger.','Deliver a 12-power Mimic bite.',['HUNGER','ATTACK']),
 sacrifice:define('FINISHER','Spend an ally’s HP.','Add that HP to a 14-power strike. Never lethal.',['SACRIFICE','ATTACK']),
 tithe:define('PAYOFF','Convert Armor to damage.','Spend up to 6 Armor; strike for twice that.',['ARMOR','PAYOFF']),
 harvest:define('PAYOFF','Harvest up to 3 Poison.','Heal all allies for 3 HP per stack.',['POISON','HEAL']),
 mirror:define('LEGENDARY','Spend 20 Hunger.','Repeat a preceding simple command at half strength.',['HUNGER','COPY']),
 'goblin-recruit':define('SUMMON','Summon 1 Goblin.','Stack up to 3 recruits in one slot.',['GOBLIN','MOB']),
 'skeleton-recruit':define('SUMMON','Raise 1 Skeleton.','Leaves a Bone when it falls.',['SKELETON','BONE']),
 'pack-attack':define('PAYOFF','Call a Goblin raid.','Every active Goblin attacks again.',['GOBLIN','SWARM']),
 'loot-fallen':define('ECONOMY','Scavenge 3 Gold.','Requires Goblins; once per turn.',['GOBLIN','GOLD']),
 'bone-march':define('PAYOFF','March the dead again.','Skeletons strike; stored Bones add damage.',['SKELETON','BONE']),
 'bone-wall':define('GUARD','Spend up to 3 Bones.','Give lane allies 3 Armor per Bone.',['SKELETON','ARMOR']),
 'rattle-dead':define('SUMMON','Spend 2 Bones.','Raise 1 Skeleton in the selected lane.',['SKELETON','REVIVE']),
 'spider-summon':define('SUMMON','Hatch 1 Spider.','Web nearby prey; stack up to 3.',['SPIDER','WEB']),
 'silken-prison':define('CONTROL','Apply 2 Web.','All active Spiders attack again.',['SPIDER','WEB']),
 'slime-summon':define('SUMMON','Summon 1 Slime.','Splits if it survives an enemy hit.',['SLIME','SPLIT']),
 'gel-fusion':define('PAYOFF','Merge 2 Slimes.','Form a Giant Ooze in the chosen lane.',['SLIME','FUSION']),
 'mimicling-summon':define('SUMMON','Summon a Mimicling.','Lures prey; its first hit earns 5 Hunger.',['MIMICLING','LURE']),
 'family-dinner':define('PAYOFF','Call a family feeding.','All Mimiclings bite again.',['MIMICLING','HUNGER'])
});
export const CARD_ROLES=Object.freeze([...new Set(Object.values(CARD_PRESENTATION).map(c=>c.role))]);
export function presentationFor(type){
 if(!Object.hasOwn(CARDS,type))return null;
 return CARD_PRESENTATION[type]||null;
}
export function cardFullRules(type){
 const card=CARDS[type],meta=presentationFor(type);
 if(!card||!meta)return '';
 return card.description||meta.primary+' '+meta.secondary;
}
export function cardFlavor(type){return CARD_LORE[type]||'';}
export function cardRarity(type){return CARDS[type]?.rarity||'common';}

// Pure visual signal; never used to gate legality, damage or resolution.
// A bright READY badge appears ONLY where a real combo/payoff prerequisite
// is currently visible. Otherwise the role and keywords remain informative.
export function payoffReady(state,type){
 if(!state||state.phase!=='battle'||state.pendingEssence)return false;
 const enemies=(state.enemies||[]).filter(e=>e.alive);
 const enemy=enemies.find(e=>e.id===state.chainTargetId)||[...enemies].sort((a,b)=>a.hp-b.hp)[0];
 const minions=(state.minions||[]).filter(u=>u.alive);
 const allies=(state.units||[]).filter(u=>u.alive);
 const present=species=>minions.some(u=>u.species===species);
 switch(type){
  case 'detonate':case 'contagion':case 'harvest':return !!enemy?.poison;
  case 'mirror':{
   const chain=state.deck?.chain||[];
   const last=chain.length?CARDS[chain.at(-1).type]:null;
   return state.hunger>=20&&!!last&&['strike','heal','armor','poison','teamheal','weaken'].includes(last.kind);
  }
  case 'feast':return state.hunger>=40;
  case 'decree':{
   const chain=state.deck?.chain||[];
   const last=chain.length?CARDS[chain.at(-1).type]:null;
   return state.hunger>=30&&!!last&&last.kind!=='decree'&&last.kind!=='feast';
  }
  case 'pack-attack':case 'loot-fallen':return present('goblin');
  case 'bone-march':return present('skeleton');
  case 'bone-wall':return state.bones>0&&allies.some(u=>u.lane===state.summonLane);
  case 'rattle-dead':return state.bones>=2;
  case 'family-dinner':return present('mimicling');
  case 'gel-fusion':return minions.filter(u=>u.lane===state.summonLane&&['slime-bud','slimelet'].includes(u.species)).length>=2;
  case 'silken-prison':return present('spider');
  case 'tithe':return allies.some(u=>u.armor>0);
  case 'sacrifice':return allies.some(u=>u.hp>1);
  default:return false;
 }
}
// Compact, readable metadata for card *faces* and Quartermaster previews.
// Includes meaningful tags instead of eight identical "START" ribbons.
export function cardVisualIdentity(type){
 const def=CARDS[type],meta=presentationFor(type);
 if(!def||!meta)return null;
 return Object.freeze({
  role:meta.role,roleClass:meta.role.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
  rarity:cardRarity(type),school:def.suit,tribe:def.tribe||null,
  main:meta.primary,detail:meta.secondary,keywords:meta.keywords,
  cost:def.cost||0,rank:def.rank||'★',flavor:cardFlavor(type)
 });
}
