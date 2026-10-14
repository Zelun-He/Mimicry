// Between-raid upgrades. The shop is data-only so save files and tests stay deterministic.
import {CARDS,HAND_SIZE} from './chain-engine.js';

export const MUTATIONS=Object.freeze({
 'iron-fangs':{name:'Iron Fangs',cost:18,description:'Fang strikes and executions deal +2 damage.'},
 'stolen-plating':{name:'Stolen Plating',cost:18,description:'Increase dungeon maximum integrity by 5 and restore 5.'},
 'royal-satchel':{name:'Royal Satchel',cost:24,description:'Draw 9 command cards instead of 8 each turn.'},
 'hunger-siphon':{name:'Hunger Siphon',cost:22,description:'Gain 5 additional Hunger whenever an invader dies.'}
});
export const CARD_UPGRADE_COST=12;
export const MONSTER_UPGRADE_COST=14;
export const MAX_CARD_LEVEL=2;
export const MAX_MONSTER_TRAINING=2;

export function handSize(s){return HAND_SIZE+(s.mutations?.includes('royal-satchel')?1:0);}
export function cardLevel(card){return card.level??0;}
export function trainingLevel(unit){return unit.training??0;}
export function deckCards(s){return [...s.deck.draw,...s.deck.discard,...s.deck.hand,...s.deck.chain];}
export function upgradeableCards(s){return deckCards(s).filter(c=>CARDS[c.type]?.power>0&&cardLevel(c)<MAX_CARD_LEVEL);}
export function trainableUnits(s){return s.units.filter(u=>u.alive&&u.hp>0&&trainingLevel(u)<MAX_MONSTER_TRAINING);}
export function cardPower(s,card){return CARDS[card.type].power+2*cardLevel(card);}
export function killHunger(s){return 20+(s.mutations?.includes('hunger-siphon')?5:0);}
export function fangDamageBonus(s,card){return s.mutations?.includes('iron-fangs')&&CARDS[card.type].suit==='fang'&&['strike','execute'].includes(CARDS[card.type].kind)?2:0;}

export function createShop(s,rng=Math.random){
 const available=Object.keys(MUTATIONS).filter(id=>!s.mutations.includes(id));
 const raw=rng();
 if(typeof raw!=='number'||!Number.isFinite(raw)||raw<0||raw>=1)throw Error('Invalid shop RNG');
 const mutation=available[Math.floor(raw*available.length)];
 return [
  {id:'card',cost:CARD_UPGRADE_COST,sold:false},
  {id:'monster',cost:MONSTER_UPGRADE_COST,sold:false},
  ...(mutation?[{id:mutation,cost:MUTATIONS[mutation].cost,sold:false}]:[])
 ];
}

function record(s,message){s.log.unshift(message);s.log=s.log.slice(0,16);}
export function buyUpgrade(s,offerId,targetId=null){
 if(s.phase!=='reward'||!Array.isArray(s.shopOffers))return false;
 const offer=s.shopOffers.find(o=>o.id===offerId);
 if(!offer||offer.sold||!Number.isInteger(s.gold)||s.gold<offer.cost)return false;
 let apply,description;
 if(offerId==='card'){
  const target=upgradeableCards(s).find(c=>c.id===targetId);
  if(!target)return false;
  apply=()=>{target.level=cardLevel(target)+1;};
  description=`${CARDS[target.type].name} upgraded to +${cardLevel(target)+1}.`;
 }else if(offerId==='monster'){
  const target=trainableUnits(s).find(u=>u.id===targetId);
  if(!target)return false;
  apply=()=>{target.training=trainingLevel(target)+1;target.attack+=2;target.maxHp+=4;target.hp+=4;};
  description=`${target.name} trained: +2 attack, +4 HP.`;
 }else if(Object.hasOwn(MUTATIONS,offerId)&&!s.mutations.includes(offerId)){
  apply=()=>{s.mutations.push(offerId);if(offerId==='stolen-plating'){s.maxIntegrity+=5;s.integrity=Math.min(s.maxIntegrity,s.integrity+5);}};
  description=`King Mimic absorbed ${MUTATIONS[offerId].name}.`;
 }else return false;
 s.gold-=offer.cost;
 apply();
 offer.sold=true;
 record(s,`Purchased: ${description} -${offer.cost} gold.`);
 return true;
}

export function validShopState(s){
 if(!Array.isArray(s.mutations)||new Set(s.mutations).size!==s.mutations.length||s.mutations.some(id=>!Object.hasOwn(MUTATIONS,id)))return false;
 if(!Array.isArray(s.shopOffers))return false;
 if(s.phase==='reward'){
  if(s.shopOffers.length!==3||s.shopOffers[0]?.id!=='card'||s.shopOffers[1]?.id!=='monster')return false;
  const mutationOffer=s.shopOffers[2]?.id;
  if(!Object.hasOwn(MUTATIONS,mutationOffer))return false;
 }else if(s.shopOffers.length!==0)return false;
 if(s.shopOffers.some(o=>!o||typeof o.id!=='string'||typeof o.sold!=='boolean'||!Number.isInteger(o.cost)||o.cost!==(o.id==='card'?CARD_UPGRADE_COST:o.id==='monster'?MONSTER_UPGRADE_COST:MUTATIONS[o.id]?.cost)))return false;
 if(s.shopOffers.some(o=>Object.hasOwn(MUTATIONS,o.id)&&o.sold!==s.mutations.includes(o.id)))return false;
 if(s.maxIntegrity!==(30+(s.mutations.includes('stolen-plating')?5:0)))return false;
 if(!Number.isInteger(s.integrity)||s.integrity<0||s.integrity>s.maxIntegrity)return false;
 if(s.units.some(u=>!Number.isInteger(trainingLevel(u))||trainingLevel(u)<0||trainingLevel(u)>MAX_MONSTER_TRAINING))return false;
 if(s.shopOffers.some(o=>o.id==='card'&&o.sold&&deckCards(s).every(c=>cardLevel(c)===0)))return false;
 return true;
}
