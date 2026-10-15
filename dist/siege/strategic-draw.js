// Balanced stage specialization. Draws always choose existing card instances.
import {CARDS,shuffle,linkCards} from '../chain-engine.js';

export const SCHOOLS=Object.freeze(['fang','shell','bloom','venom','hunger']);
// Chance that a regular turn draw uses a focused rather than unbiased selection.
export const RAID_FOCUS=Object.freeze([0,0.15,0.30,0.45,0.60]);
export const DRAW_MODES=Object.freeze(['mixed','focused','wild']);
export function emptyStrategy(){
 return {schoolUse:Object.fromEntries(SCHOOLS.map(suit=>[suit,0])),typeUse:{},recentChains:[]};
}
export function strategyFocus(s){
 const global=s.schoolUse||{};
 const recent=Object.fromEntries(SCHOOLS.map(suit=>[suit,0]));
 for(const chain of s.recentChains||[])for(const type of chain){
  const suit=CARDS[type]?.suit;
  if(suit)recent[suit]++;
 }
 const sumAll=SCHOOLS.reduce((v,suit)=>v+(global[suit]||0),0);
 const sumRecent=SCHOOLS.reduce((v,suit)=>v+recent[suit],0);
 const scores=Object.fromEntries(SCHOOLS.map(suit=>[suit,
   (sumRecent?0.6*recent[suit]/sumRecent:0)+
   (sumAll?0.4*(global[suit]||0)/sumAll:0)]));
 const order=SCHOOLS.filter(suit=>scores[suit]>0)
  .sort((a,b)=>scores[b]-scores[a]||SCHOOLS.indexOf(a)-SCHOOLS.indexOf(b));
 return {primary:order[0]||null,secondary:order[1]||null,scores,
  stage:Math.max(0,Math.min(RAID_FOCUS.length-1,s.raid||0))};
}
export function recordPlayedChain(s,chain){
 if(!s.schoolUse||!s.typeUse||!s.recentChains)Object.assign(s,emptyStrategy());
 const played=[];
 for(const card of chain){
  const def=CARDS[card.type];
  if(!def)continue;
  played.push(card.type);
  s.schoolUse[def.suit]=Math.min(9999,(s.schoolUse[def.suit]||0)+1);
  s.typeUse[card.type]=Math.min(9999,(s.typeUse[card.type]||0)+1);
 }
 s.recentChains.push(played);
 if(s.recentChains.length>5)s.recentChains.shift();
}
const living=a=>(a||[]).filter(u=>u.alive&&u.hp>0);
function setupReady(s,def){
 const hand=[...s.deck.hand,...s.deck.chain];
 const used=type=>hand.some(c=>c.type===type);
 const minions=living(s.minions);
 const foe=living(s.enemies).find(e=>e.id===s.chainTargetId)||living(s.enemies)[0];
 switch(def.kind){
  case 'detonate':case 'spread':case 'harvest':
   return (foe?.poison||0)>0||hand.some(c=>['poison','corrode'].includes(CARDS[c.type]?.kind));
  case 'pack':case 'loot':return minions.some(u=>u.species==='goblin')||used('goblin-recruit');
  case 'march':return minions.some(u=>u.species==='skeleton')||used('skeleton-recruit');
  case 'bonewall':case 'rattle':return s.bones>0||used('skeleton-recruit');
  case 'web-trap':return minions.some(u=>u.species==='spider')||used('spider-summon');
  case 'fuse':return minions.some(u=>['slime-bud','slimelet'].includes(u.species))||used('slime-summon');
  case 'family':return minions.some(u=>u.species==='mimicling')||used('mimicling-summon');
  case 'counter':case 'tithe':return living(s.units).some(u=>u.armor>0)||hand.some(c=>['armor','thorns'].includes(CARDS[c.type]?.kind));
  case 'feast':case 'decree':case 'mirror':return (s.hunger||0)>=def.cost||((s.hunger||0)>=def.cost/2);
  default:return true;
 }
}
export function cardDrawWeight(s,card,focus=strategyFocus(s),mode='focused'){
 const def=CARDS[card.type];
 if(!def)return 0;
 if(mode==='wild')return 1; // Every *owned instance* has an equal chance.
 const held=[...s.deck.hand,...s.deck.chain];
 const sameType=held.filter(c=>c.type===card.type).length;
 const heldSchools=new Set(held.map(c=>CARDS[c.type]?.suit));
 let weight=1;
 if(focus.primary){
  if(def.suit===focus.primary)weight+=1.8;
  else if(def.suit===focus.secondary)weight+=0.85;
  const types=s.typeUse||{};
  const practiced=Object.keys(types).filter(type=>types[type]>0&&CARDS[type])
   .sort((a,b)=>types[b]-types[a]).slice(0,4);
  if(practiced.some(type=>linkCards({type},{type:card.type})))weight+=0.40;
  if(def.tribe&&practiced.some(type=>CARDS[type]?.tribe===def.tribe))weight+=0.50;
 }else if(!heldSchools.has(def.suit))weight+=0.55;
 if(held.length&&linkCards(held.at(-1),card))weight+=0.30;
 if(['heal','teamheal'].includes(def.kind)&&living(s.units).some(u=>u.hp/u.maxHp<0.6))weight+=0.45;
 if(!setupReady(s,def))weight*=0.55;
 // Avoid repeating the same card while preserving legitimate minion stacks.
 weight*=Math.pow(def.kind==='summon'?0.82:0.58,Math.min(3,sameType));
 return Math.max(0.2,weight);
}
export function drawSpecializedCards(s,count,rng=Math.random,{mode='mixed'}={}){
 const deck=s.deck;
 let drawn=0;
 const focus=strategyFocus(s);
 while(drawn<count){
  if(!deck.draw.length){
   if(!deck.discard.length)break;
   deck.draw=shuffle(deck.discard,rng);deck.discard=[];
  }
  const chooseMode=()=>{
   if(mode!=='mixed')return mode;
   const roll=rng();
   if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid RNG');
   return focus.primary&&roll<RAID_FOCUS[focus.stage]?'focused':'wild';
  };
  const active=chooseMode();
  const weights=deck.draw.map(card=>cardDrawWeight(s,card,focus,active));
  const total=weights.reduce((sum,w)=>sum+w,0);
  const roll=rng();
  if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid RNG');
  let position=roll*total,index=weights.length-1;
  for(let i=0;i<weights.length;i++){position-=weights[i];if(position<0){index=i;break;}}
  deck.hand.push(deck.draw.splice(index,1)[0]);drawn++;
 }
 return drawn;
}
