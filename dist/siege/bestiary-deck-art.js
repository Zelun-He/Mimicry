// The Mimicry bestiary deck: one consistent original sprite direction for all
// fifty-two ordinary playing cards. A suit is a monster faction, never an
// incidental spell icon. Keep poker rules completely separate from this art.
import {EXOTIC_CARD_PORTRAITS} from './exotic-inline-art.js';

export const BESTIARY_FACTIONS=Object.freeze({
 spades:Object.freeze({name:'Raiders',species:['goblin','goblin','goblin','goblin','goblin','goblin','goblin','goblin','goblin','goblin','goblin','king-mimic','king-mimic'],dark:'#211d25',middle:'#59423b',light:'#c98257',spark:'#f5c17b'}),
 clubs:Object.freeze({name:'Undead',species:['skeleton','skeleton','skeleton','skeleton','skeleton','skeleton','skeleton','skeleton','skeleton','skeleton','skeleton','skeleton','king-mimic'],dark:'#182a35',middle:'#314e5a',light:'#81c0ce',spark:'#e3e6c6'}),
 hearts:Object.freeze({name:'Wildlings',species:['slime','slime','slime','slime','slime','sporeling','sporeling','sporeling','sporeling','sporeling','sporeling','sporeling','king-mimic'],dark:'#142d27',middle:'#32604e',light:'#6ebd89',spark:'#d9ed9f'}),
 diamonds:Object.freeze({name:'Nightbrood',species:['spider','spider','spider','spider','mimicling','mimicling','mimicling','spider','spider','spider','spider','mimicling','mimicling'],dark:'#241f37',middle:'#4c3b69',light:'#a77fc2',spark:'#f0bcdb'})
});

const rect=(x,y,w,h,color,opacity=1)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+color+'"'+(opacity===1?'':' opacity="'+opacity+'"')+'/>';
const line=(d,color,width=2)=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linejoin="miter"/>';
const square=(x,y,c)=>rect(x,y,2,2,c);
function scenery(suit,rank,palette){
 const n=rank-2;
 let background=rect(0,0,80,112,palette.dark)+
 rect(0,46,80,66,palette.middle,.32)+
 '<path d="M0 62L12 48L22 58L35 36L48 57L63 43L80 58V112H0Z" fill="'+palette.middle+'"/>'+
 rect(0,88,80,24,palette.dark,.86);
 // All factions share the same pixel grid and perspective, but occupy
 // different forest territory; no potions, decorative flower glyphs or
 // stretched icons are allowed in the bestiary.
 if(suit==='spades'){
  background+=rect(7,20,6,80,'#251e24')+rect(63,15,7,80,'#251e24')+
   rect(2,14,17,7,'#44302c')+rect(58,9,20,7,'#44302c')+
   rect(10,89,60,3,'#7d5145',.55);
 }else if(suit==='clubs'){
  background+=rect(8,29,10,59,'#526773',.6)+rect(4,26,18,6,'#7d959d',.65)+
   rect(63,36,11,52,'#546c74',.6)+rect(59,32,19,5,'#7e9195',.65)+
   rect(0,91,80,3,'#9badab',.3);
 }else if(suit==='hearts'){
  background+=rect(3,12,8,81,'#203c35')+rect(69,6,7,84,'#203c35')+
   rect(0,10,23,8,'#486c48')+rect(58,9,22,11,'#486c48')+
   rect(0,92,80,6,'#477b58',.65);
 }else {
  background+=line('M6 10L36 42M38 11L61 37M67 10L39 42M4 48L26 62','#9d83ba',1)+
   rect(0,91,80,5,'#62527d',.45)+
   rect(5,28,5,5,'#9f88bb',.7)+rect(69,23,4,4,'#9f88bb',.7);
 }
 for(let i=0;i<10;i++){
  const x=(i*19+n*11+7)%78,y=(i*13+n*7+15)%75;
  background+=square(x,y,i%3===0?palette.spark:palette.light);
 }
 if(rank>=11){
  background+=line('M13 25L13 14L22 14M58 14L67 14L67 25M13 77L13 87L22 87M58 87L67 87L67 77',palette.spark,2);
  background+=rect(36,10,8,3,palette.spark,.9)+rect(38,6,4,4,palette.spark,.9);
 }
 // Rank-dependent emblems make number cards visibly distinct without
 // overlaying text or borrowing gameplay significance from the decoration.
 const side=rank%3;
 for(let i=0;i<side+1;i++){
  background+=rect(5+i*6,99,4,5,palette.light,.55);
 }
 return background;
}
function props(suit,rank,p){
 const elite=rank>=9,royal=rank>=11;
 let parts='';
 if(suit==='spades'){
  parts+=rect(10,56,4,37,'#a78055')+rect(8,48,8,11,'#bcc8bc')+
   rect(5,65,15,4,p.spark);
  if(elite)parts+=rect(64,49,4,45,'#997452')+
   '<path d="M64 43H68L72 53H60Z" fill="#d4d8c4"/>';
 }else if(suit==='clubs'){
  parts+=rect(7,69,13,24,'#9cafa9')+rect(9,65,9,5,'#dce5d4')+
   rect(12,74,3,17,'#425e63');
  if(elite)parts+=rect(63,45,5,40,'#d7c3a0')+rect(57,43,18,9,'#b2c7ce');
 }else if(suit==='hearts'){
  parts+=rect(8,78,4,15,'#65835b')+rect(3,74,16,7,p.light)+
   rect(64,82,4,12,'#65835b')+rect(61,79,12,6,p.light);
  if(elite)parts+=rect(57,26,6,6,p.spark,.9)+rect(66,35,4,4,p.spark,.85);
 }else{
  parts+=line('M3 59L23 34M4 79L25 61M74 44L53 65',p.light,2);
  if(elite)parts+=rect(61,21,5,5,p.spark,.9)+rect(17,24,4,4,p.spark,.8);
 }
 if(royal){
  parts+=rect(20,95,40,3,p.spark,.75)+rect(29,98,22,2,p.light,.6);
 }
 return parts;
}
function sprite(species){
 if(species==='spider'||species==='mimicling'){
  return EXOTIC_CARD_PORTRAITS[species];
 }
 return '<span class="bestiary-sprite bestiary-sprite--'+species+'"></span>';
}
export function bestiaryIdentity(suit,rank){
 const f=BESTIARY_FACTIONS[suit];
 if(!f||!Number.isInteger(rank)||rank<2||rank>14)return null;
 return Object.freeze({suit,rank,faction:f.name,species:f.species[rank-2],
  tier:rank>=11?'royal':rank>=8?'veteran':rank>=5?'warband':'scout'});
}
export function renderBestiaryPortrait(card){
 const identity=bestiaryIdentity(card?.suit,card?.rank);
 if(!identity)return '';
 const {suit,rank,species,tier}=identity;
 const p=BESTIARY_FACTIONS[suit];
 const environment='<svg class="bestiary-environment" viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">'+
  scenery(suit,rank,p)+props(suit,rank,p)+'</svg>';
 const halo='<span class="bestiary-halo" aria-hidden="true"></span>';
 const companion=tier==='warband'||tier==='veteran'?
  '<span class="bestiary-companion" aria-hidden="true">'+sprite(p.species[Math.max(0,rank-4)])+'</span>':'';
 const hero='<span class="bestiary-hero" aria-hidden="true">'+sprite(species)+'</span>';
 const accent=tier==='royal'?
  '<svg class="bestiary-crest" viewBox="0 0 28 13" aria-hidden="true" shape-rendering="crispEdges">'+
  '<path d="M1 11V4L7 7L14 1L21 7L27 4V11Z" fill="'+p.spark+'" stroke="'+p.dark+'" stroke-width="1"/></svg>':'';
 return '<span class="bestiary-scene bestiary-scene--'+suit+' bestiary-tier--'+tier+
  '" role="img" aria-label="'+identity.faction+' '+species.replace('-', ' ')+' portrait" data-bestiary-species="'+species+'">'+
  environment+halo+companion+hero+accent+'</span>';
}
