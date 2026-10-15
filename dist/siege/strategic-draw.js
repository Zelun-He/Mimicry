// Draws become more specialized as the forest raid advances. Selection
// never creates or removes card instances: it only chooses the next card
// from a player's existing shuffled deck and recycles the discard pile.
import {CARDS,shuffle,linkCards} from '../chain-engine.js';

export const SCHOOLS=Object.freeze(['fang','shell','bloom','venom','hunger']);
export const RAID_FOCUS=Object.freeze([0,1.5,3,5,8]);
export function emptyStrategy(){return {schoolUse:Object.fromEntries(SCHOOLS.map(suit=>[suit,0])),typeUse:{}};}
export function strategyFocus(s){
 const schoolUse=s.schoolUse||{};
 const ordered=SCHOOLS.filter(suit=>(schoolUse[suit]||0)>0)
  .sort((a,b)=>(schoolUse[b]||0)-(schoolUse[a]||0)||SCHOOLS.indexOf(a)-SCHOOLS.indexOf(b));
 return {primary:ordered[0]||null,secondary:ordered[1]||null,
  stage:Math.max(0,Math.min(RAID_FOCUS.length-1,s.raid||0))};
}
export function recordPlayedChain(s,chain){
 if(!s.schoolUse||!s.typeUse)Object.assign(s,emptyStrategy());
 for(const card of chain){
  const def=CARDS[card.type];
  if(!def)continue;
  s.schoolUse[def.suit]=Math.min(9999,(s.schoolUse[def.suit]||0)+1);
  s.typeUse[card.type]=Math.min(9999,(s.typeUse[card.type]||0)+1);
 }
}
export function cardDrawWeight(s,card,focus=strategyFocus(s)){
 const def=CARDS[card.type];
 if(!def)return 0;
 const strength=RAID_FOCUS[focus.stage];
 if(!strength||!focus.primary){
  // At the forest entrance, spread the hand across different schools.
  const held=new Set([...s.deck.hand,...s.deck.chain].map(c=>CARDS[c.type]?.suit));
  return held.has(def.suit)?1:2;
 }
 let weight=1;
 if(def.suit===focus.primary)weight+=strength*2;
 else if(def.suit===focus.secondary)weight+=strength;
 // Repeat successful cards and favor valid follow-ups to proven commands.
 const uses=s.typeUse||{};
 if(uses[card.type])weight+=strength*Math.min(2,uses[card.type])*.5;
 const practiced=Object.keys(uses).filter(type=>uses[type]>0&&CARDS[type])
  .sort((a,b)=>uses[b]-uses[a]).slice(0,3);
 if(practiced.some(type=>linkCards({type},{type:card.type})))
  weight+=strength*.5;
 // Creature families follow the player's chosen summon engine.
 if(def.tribe&&practiced.some(type=>CARDS[type]?.tribe===def.tribe))
  weight+=strength;
 return weight;
}
export function drawSpecializedCards(s,count,rng=Math.random){
 const deck=s.deck;
 let drawn=0;
 const focus=strategyFocus(s);
 while(drawn<count){
  if(!deck.draw.length){
   if(!deck.discard.length)break;
   deck.draw=shuffle(deck.discard,rng);
   deck.discard=[];
  }
  const weights=deck.draw.map(card=>cardDrawWeight(s,card,focus));
  const total=weights.reduce((sum,weight)=>sum+weight,0);
  const roll=rng();
  if(typeof roll!=='number'||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid RNG');
  let target=roll*total,index=weights.length-1;
  for(let i=0;i<weights.length;i++){
   target-=weights[i];
   if(target<0){index=i;break;}
  }
  deck.hand.push(deck.draw.splice(index,1)[0]);
  drawn++;
 }
 return drawn;
}
