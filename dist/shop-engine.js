// Between-raid upgrades. The shop is data-only so save files and tests stay deterministic.
import {CARDS,HAND_SIZE,SHOP_CARD_TYPES,GOBLIN_SHOP_TYPES,SKELETON_SHOP_TYPES,TRIBAL_SHOP_TYPES} from './chain-engine.js';

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
 const rareRoll=rng();
 if(typeof rareRoll!=='number'||!Number.isFinite(rareRoll)||rareRoll<0||rareRoll>=1)throw Error('Invalid shop RNG');
 const unseen=SHOP_CARD_TYPES.filter(type=>!s.deck?.acquired?.includes(type));
 const selection=unseen.length?unseen:SHOP_CARD_TYPES;
 const rareType=selection[Math.floor(rareRoll*selection.length)];
 const gobRoll=rng(),skeletonRoll=rng();
 if(![gobRoll,skeletonRoll].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<1))throw Error('Invalid shop RNG');
 const goblin=GOBLIN_SHOP_TYPES[Math.floor(gobRoll*GOBLIN_SHOP_TYPES.length)];
 const skeleton=SKELETON_SHOP_TYPES[Math.floor(skeletonRoll*SKELETON_SHOP_TYPES.length)];
 return [
  {id:'card',cost:CARD_UPGRADE_COST,sold:false},
  {id:'monster',cost:MONSTER_UPGRADE_COST,sold:false},
  ...(mutation?[{id:mutation,cost:MUTATIONS[mutation].cost,sold:false}]:[]),
  {id:'rare',cardType:rareType,cost:CARDS[rareType].price,sold:false},
  {id:'tribal',options:[goblin,skeleton],cost:12,sold:false}
 ];
}

function record(s,message){s.log.unshift(message);s.log=s.log.slice(0,16);}
export function buyUpgrade(s,offerId,targetId=null){
 if(s.phase!=='reward'||s.pendingEssence||!Array.isArray(s.shopOffers))return false;
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
 }else if(offerId==='rare'){
  if(!SHOP_CARD_TYPES.includes(offer.cardType)||!Array.isArray(s.deck.acquired)||s.deck.acquired.length>=8)return false;
  const type=offer.cardType;
  apply=()=>{
   const next=s.deck.acquired.length;
   s.deck.acquired.push(type);
   s.deck.acquiredAt.push(s.raid);
   // Insert at the top of draw so the purchased card appears in the very next hand.
   s.deck.draw.push({id:`p${next}`,type});
  };
  description=`${CARDS[type].name} added to your deck.`;
 }else if(offerId==='tribal'){
  if(!Array.isArray(offer.options)||!offer.options.includes(targetId)||
     !TRIBAL_SHOP_TYPES.includes(targetId)||!Array.isArray(s.deck.acquired)||
     s.deck.acquired.length>=8||!s.deck.tribal)return false;
  const type=targetId;
  apply=()=>{
   const next=s.deck.acquired.length;
   s.deck.acquired.push(type);
   s.deck.acquiredAt.push(s.raid);
   s.deck.draw.push({id:`p${next}`,type});
   offer.purchasedType=type;
  };
  description=`${CARDS[type].name} recruited to your deck.`;
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

// legacy=true validates v4 (three-offer) saves before adding the new card offer.
// Historical shops: v4 had 3 offers, v5–v6 had 4, v7 has 5.
export function validShopState(s,legacy=false,withTribes=false){
 if(!Array.isArray(s.mutations)||new Set(s.mutations).size!==s.mutations.length||
    s.mutations.some(id=>!Object.hasOwn(MUTATIONS,id)))return false;
 if(!Array.isArray(s.shopOffers))return false;
 if(s.phase==='reward'){
  if(s.shopOffers.length!==(legacy?3:withTribes?5:4)||
     s.shopOffers[0]?.id!=='card'||s.shopOffers[1]?.id!=='monster')return false;
  if(!Object.hasOwn(MUTATIONS,s.shopOffers[2]?.id))return false;
  if(!legacy){
   const offer=s.shopOffers[3];
   if(offer?.id!=='rare'||!SHOP_CARD_TYPES.includes(offer.cardType))return false;
   const boughtRare=s.deck?.acquired?.some((type,i)=>
      SHOP_CARD_TYPES.includes(type)&&s.deck.acquiredAt[i]===s.raid);
   if(Boolean(offer.sold)!==Boolean(boughtRare)||
      (offer.sold&&s.deck.acquired.some((type,i)=>
        SHOP_CARD_TYPES.includes(type)&&s.deck.acquiredAt[i]===s.raid&&type!==offer.cardType)))return false;
  }
  if(withTribes){
   const offer=s.shopOffers[4];
   if(offer?.id!=='tribal'||offer.cost!==12||!Array.isArray(offer.options)||
      offer.options.length!==2||!GOBLIN_SHOP_TYPES.includes(offer.options[0])||
      !SKELETON_SHOP_TYPES.includes(offer.options[1]))return false;
   const bought=s.deck?.acquired?.find((type,i)=>
      TRIBAL_SHOP_TYPES.includes(type)&&s.deck.acquiredAt[i]===s.raid);
   if(Boolean(offer.sold)!==Boolean(bought)||
      (offer.sold?(offer.purchasedType!==bought||!offer.options.includes(bought)):
       offer.purchasedType!==undefined))return false;
  }
 }else if(s.shopOffers.length!==0)return false;
 for(const offer of s.shopOffers){
  if(!offer||typeof offer.id!=='string'||typeof offer.sold!=='boolean'||
     !Number.isInteger(offer.cost))return false;
  const expected=offer.id==='card'?CARD_UPGRADE_COST:
    offer.id==='monster'?MONSTER_UPGRADE_COST:
    offer.id==='rare'&&SHOP_CARD_TYPES.includes(offer.cardType)?CARDS[offer.cardType].price:
    offer.id==='tribal'&&withTribes?12:
    MUTATIONS[offer.id]?.cost;
  if(offer.cost!==expected)return false;
  if(Object.hasOwn(MUTATIONS,offer.id)&&offer.sold!==s.mutations.includes(offer.id))return false;
 }
 if(s.maxIntegrity!==(30+(s.mutations.includes('stolen-plating')?5:0)))return false;
 if(!Number.isInteger(s.integrity)||s.integrity<0||s.integrity>s.maxIntegrity)return false;
 if(!Array.isArray(s.units)||s.units.some(u=>!Number.isInteger(trainingLevel(u))||
    trainingLevel(u)<0||trainingLevel(u)>MAX_MONSTER_TRAINING))return false;
 if(s.shopOffers.some(o=>o.id==='card'&&o.sold&&deckCards(s).every(c=>cardLevel(c)===0)))return false;
 return true;
}
