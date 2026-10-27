// Mimicry's original poker-combat rules, using a standard 52-card deck.
// Inspired by classic poker and The Demon's Hand's attack cadence; all
// characters, sigils, names and illustrations remain Mimicry's own.
export const SUITS=Object.freeze(['hearts','diamonds','clubs','spades']);
export const SUIT_NAMES=Object.freeze({hearts:'Hearts',diamonds:'Diamonds',clubs:'Clubs',spades:'Spades'});
export const SUIT_SYMBOLS=Object.freeze({hearts:'♥',diamonds:'♦',clubs:'♣',spades:'♠'});
export const SUIT_TO_SCHOOL=Object.freeze({hearts:'bloom',diamonds:'venom',clubs:'shell',spades:'fang'});
export const RANK_NAMES=Object.freeze({11:'Jack',12:'Queen',13:'King',14:'Ace'});
export const RANK_SYMBOLS=Object.freeze({11:'J',12:'Q',13:'K',14:'A'});
export const BASE_DAMAGE=Object.freeze({solo:10,dyad:20,'dyad-set':40,triad:80,march:100,horde:125,warhost:175,tetrad:400,'marching-horde':600,'mimics-hand':2000});
export const HAND_LABELS=Object.freeze({solo:'High Card',dyad:'Pair','dyad-set':'Two Pair',triad:'Three of a Kind',march:'Straight',horde:'Flush',warhost:'Full House',tetrad:'Four of a Kind','marching-horde':'Straight Flush','mimics-hand':"The Mimic's Hand"});
export const ENCOUNTERS=Object.freeze([
 {name:'Lost Forager',role:'Wandering Peasant',hp:135,attack:11,clock:3,trait:'Unprepared',effect:'No special modifier.',scene:'fernway'},
 {name:'Greenwood Scout',role:'Forest Pathfinder',hp:230,attack:16,clock:3,trait:'Quickfoot',effect:'Strikes every third played hand.',scene:'sunbreak'},
 {name:'Roadside Militia',role:'Armored Patrol',hp:350,attack:22,clock:2,trait:'Ironclad',effect:'High Card attacks lose 12 damage.',scene:'briar'},
 {name:'Lantern Witch',role:'Wandering Arcanist',hp:525,attack:29,clock:2,trait:'Hexed',effect:'Attacks scoring Hearts deal 15% less damage.',scene:'wispwood'},
 {name:'Old Road Watchman',role:'Forest Guardian',hp:800,attack:37,clock:2,trait:'Unyielding',effect:'High Card and Pair attacks deal 20% less damage.',scene:'watchgate'}
]);
export const SIGILS=Object.freeze([
 {id:'teeth',name:'Sharpened Teeth',cost:20,desc:'+15 damage on every attack.'},
 {id:'twin',name:'Twin Fangs',cost:25,desc:'Pairs and Two Pairs gain +35 damage.'},
 {id:'venom',name:'Venomous Bite',cost:24,desc:'Each scoring Diamond adds +5 damage.'},
 {id:'satchel',name:'Deep Pockets',cost:32,desc:'Increase hand size from 8 to 9.'},
 {id:'patience',name:'Patient Hunter',cost:32,desc:'Enemies wait one extra played hand before attacking.'},
 {id:'carapace',name:'Splintered Shell',cost:28,desc:'Reduce incoming damage by 7.'},
 {id:'hunger',name:'Hungry Chest',cost:23,desc:'Gain 8 additional gold on victory.'},
 {id:'reroll',name:'Second Chance',cost:28,desc:'Gain one extra redraw per encounter.'},
 {id:'royal',name:'Crown Eater',cost:37,desc:'Straights, Flushes and stronger suited sequences gain 35% damage.'},
 {id:'luck',name:'Lucky Clover',cost:29,desc:'Increase Critical Card chance from 5% to 15%.'},
 {id:'tempo',name:'Battle Rhythm',cost:27,desc:'Every attack after the first gains +10 damage this encounter.'},
 {id:'solitude',name:'Lone Fang',cost:19,desc:'High Card attacks gain +45 damage.'}
]);
const OLD_SUIT_MAP=Object.freeze({fang:'spades',shell:'clubs',bloom:'hearts',venom:'diamonds'});
export function deck52(){return SUITS.flatMap(suit=>Array.from({length:13},(_,i)=>({id:suit+'-'+(i+2),suit,rank:i+2})))}
export function shuffle(cards,rng=Math.random){
 const a=[...cards];
 for(let i=a.length-1;i>0;i--){
  const roll=rng();
  if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid RNG');
  const j=Math.floor(roll*(i+1));[a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
export function cardValue(card){return card.rank===14?11:card.rank>=11?10:card.rank;}
export function criticalChance(s){return 0.05+(s.sigils.includes('luck')?0.10:0);}
function straightRanks(cards){
 if(cards.length!==5)return false;
 const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);
 return ranks.join(',')==='2,3,4,5,14'||ranks.every((r,i)=>i===0||r===ranks[i-1]+1);
}
function rankGroups(cards){
 const groups=new Map();
 for(const card of cards){const v=groups.get(card.rank)||[];v.push(card);groups.set(card.rank,v);}
 return [...groups.entries()].map(([rank,cards])=>({rank,cards})).sort((a,b)=>b.cards.length-a.cards.length||b.rank-a.rank);
}
export function evaluateHand(cards,sigils=[],attackIndex=0){
 if(!Array.isArray(cards)||cards.length===0||cards.length>5||
  cards.some(c=>!SUITS.includes(c?.suit)||!Number.isInteger(c.rank)||c.rank<2||c.rank>14||c.id!==c.suit+'-'+c.rank)||
  new Set(cards.map(c=>c.id)).size!==cards.length)return null;
 const groups=rankGroups(cards),straight=straightRanks(cards);
 const flush=cards.length===5&&cards.every(c=>c.suit===cards[0].suit);
 const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b).join(',');
 let type='solo',scored=[];
 if(flush&&ranks==='10,11,12,13,14'){type='mimics-hand';scored=[...cards];}
 else if(straight&&flush){type='marching-horde';scored=[...cards];}
 else if(groups[0].cards.length===4){type='tetrad';scored=groups[0].cards;}
 else if(groups.length===2&&groups[0].cards.length===3&&groups[1].cards.length===2){type='warhost';scored=[...cards];}
 else if(flush){type='horde';scored=[...cards];}
 else if(straight){type='march';scored=[...cards];}
 else if(groups[0].cards.length===3){type='triad';scored=groups[0].cards;}
 else if(groups.filter(g=>g.cards.length===2).length===2){
  type='dyad-set';scored=groups.filter(g=>g.cards.length===2).flatMap(g=>g.cards);
 }
 else if(groups[0].cards.length===2){type='dyad';scored=groups[0].cards;}
 else {type='solo';scored=[cards.reduce((best,c)=>c.rank>best.rank?c:best)];}
 const contributing=new Set(scored.map(c=>c.id));
 const unused=cards.filter(c=>!contributing.has(c.id));
 const cardDamage=scored.reduce((sum,c)=>sum+cardValue(c),0);
 const bonus=(sigils.includes('teeth')?15:0)+
  (sigils.includes('twin')&&['dyad','dyad-set'].includes(type)?35:0)+
  (sigils.includes('venom')?scored.filter(c=>c.suit==='diamonds').length*5:0)+
  (sigils.includes('tempo')?attackIndex*10:0)+
  (sigils.includes('solitude')&&type==='solo'?45:0);
 const royal=sigils.includes('royal')&&['march','horde','marching-horde','mimics-hand'].includes(type)?1.35:1;
 const criticalCount=scored.filter(c=>c.critical===true).length;
 // Card values and sigils are resolved before multiplicative critical bonuses.
 const damage=Math.floor((BASE_DAMAGE[type]+cardDamage+bonus)*royal*1.25**criticalCount);
 return {type,label:HAND_LABELS[type],damage,base:BASE_DAMAGE[type],value:cardDamage,
  contributingIds:scored.map(c=>c.id),unusedIds:unused.map(c=>c.id),criticalCount};
}
export function deal(s,count,rng=Math.random){
 while(s.hand.length<count){
  if(!s.deck.length){
   if(!s.discard.length)break;
   s.deck=shuffle(s.discard.map(c=>({id:c.id,suit:c.suit,rank:c.rank})),rng);
   s.discard=[];
  }
  const roll=rng();
  if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid RNG');
  const source=s.deck.pop();
  s.hand.push({...source,critical:roll<criticalChance(s)});
 }
 return s.hand;
}
export function newBattle(rng=Math.random){
 const s={version:2,encounter:0,phase:'battle',maxHp:100,hp:100,gold:0,sigils:[],
  deck:shuffle(deck52(),rng),hand:[],discard:[],selected:[],discardsLeft:3,
  enemyClock:3,enemyHp:ENCOUNTERS[0].hp,round:1,log:'A lost traveler approaches the chest.',
  lastAttack:null,sortMode:'rank',rested:false};
 deal(s,8,rng);return s;
}
export function handLimit(s){return 8+(s.sigils.includes('satchel')?1:0);}
export function discardLimit(s){return 3+(s.sigils.includes('reroll')?1:0);}
export function enemyClockMax(s){return ENCOUNTERS[s.encounter].clock+(s.sigils.includes('patience')?1:0);}
export function toggleCard(s,id){
 if(s.phase!=='battle')return false;
 if(s.selected.includes(id)){s.selected=s.selected.filter(x=>x!==id);return true;}
 if(s.selected.length>=5||!s.hand.some(c=>c.id===id))return false;
 s.selected.push(id);return true;
}
export function selectedCards(s){return s.selected.map(id=>s.hand.find(c=>c.id===id)).filter(Boolean);}
export function sortHand(s,mode=s.sortMode==='rank'?'suit':'rank'){
 if(!['rank','suit'].includes(mode))return false;
 s.sortMode=mode;s.selected=[];
 const order=Object.fromEntries(SUITS.map((suit,i)=>[suit,i]));
 s.hand.sort((a,b)=>mode==='rank'?b.rank-a.rank||order[a.suit]-order[b.suit]:order[a.suit]-order[b.suit]||b.rank-a.rank);
 return true;
}
export function discardSelected(s,rng=Math.random){
 if(s.phase!=='battle'||!s.selected.length||s.selected.length>5||s.discardsLeft<=0)return false;
 const picked=new Set(s.selected);
 s.discard.push(...s.hand.filter(c=>picked.has(c.id)).map(c=>({id:c.id,suit:c.suit,rank:c.rank})));
 s.hand=s.hand.filter(c=>!picked.has(c.id));s.selected=[];
 s.discardsLeft--;deal(s,handLimit(s),rng);
 s.log='Redrew '+picked.size+' card'+(picked.size===1?'':'s')+'.';
 return true;
}
export function attack(s,rng=Math.random){
 if(s.phase!=='battle'||!s.selected.length)return null;
 const played=selectedCards(s),evaluation=evaluateHand(played,s.sigils,s.round-1);
 if(!evaluation)return null;
 const foe=ENCOUNTERS[s.encounter];
 let damage=evaluation.damage;
 if(foe.trait==='Ironclad'&&evaluation.type==='solo')damage=Math.max(1,damage-12);
 if(foe.trait==='Hexed'&&played.some(c=>evaluation.contributingIds.includes(c.id)&&c.suit==='hearts'))damage=Math.floor(damage*.85);
 if(foe.trait==='Unyielding'&&['dyad','solo'].includes(evaluation.type))damage=Math.floor(damage*.8);
 s.enemyHp=Math.max(0,s.enemyHp-damage);
 const removed=new Set(s.selected);
 s.discard.push(...s.hand.filter(c=>removed.has(c.id)).map(c=>({id:c.id,suit:c.suit,rank:c.rank})));
 s.hand=s.hand.filter(c=>!removed.has(c.id));s.selected=[];
 s.lastAttack={...evaluation,damage,playedIds:[...removed]};
 if(s.enemyHp<=0){
  s.phase=s.encounter===ENCOUNTERS.length-1?'won':'reward';
  s.gold+=25+s.encounter*12+(s.sigils.includes('hunger')?8:0);
  s.log=evaluation.label+'! '+damage+' damage defeats '+foe.name+'.';
  return {damage,hit:0,won:true,hand:evaluation.label};
 }
 s.enemyClock--;
 let hit=0;
 if(s.enemyClock<=0){
  hit=Math.max(1,foe.attack-(s.sigils.includes('carapace')?7:0));
  s.hp=Math.max(0,s.hp-hit);
  s.enemyClock=enemyClockMax(s);
  if(s.hp===0)s.phase='lost';
 }
 deal(s,handLimit(s),rng);
 s.round++;
 s.log=evaluation.label+' dealt '+damage+' damage.'+(evaluation.unusedIds.length?' '+evaluation.unusedIds.length+' unscored card'+(evaluation.unusedIds.length===1?'':'s')+' discarded.':'')+(hit?' '+foe.name+' retaliates for '+hit+'.':'');
 return {damage,hit,won:false,hand:evaluation.label};
}
export function buySigil(s,id){
 if(s.phase!=='reward'||s.sigils.includes(id)||s.sigils.length>=6)return false;
 const item=SIGILS.find(sig=>sig.id===id);
 if(!item||s.gold<item.cost)return false;
 s.gold-=item.cost;s.sigils.push(id);return true;
}
export function rest(s){
 if(s.phase!=='reward'||s.rested)return false;
 s.hp=Math.min(s.maxHp,s.hp+22);s.rested=true;return true;
}
export function advance(s,rng=Math.random){
 if(s.phase!=='reward'||s.encounter>=ENCOUNTERS.length-1)return false;
 s.encounter++;const foe=ENCOUNTERS[s.encounter];
 s.deck=shuffle([...s.deck,...s.hand,...s.discard].map(c=>({id:c.id,suit:c.suit,rank:c.rank})),rng);
 s.hand=[];s.discard=[];s.selected=[];s.rested=false;
 s.discardsLeft=discardLimit(s);s.enemyClock=enemyClockMax(s);
 s.enemyHp=foe.hp;s.round=1;s.phase='battle';s.lastAttack=null;
 deal(s,handLimit(s),rng);s.log=foe.name+' enters the clearing.';return true;
}
export function deckOverview(s){
 const makeCounts=pile=>Object.fromEntries(SUITS.map(suit=>[suit,
  Object.fromEntries(Array.from({length:13},(_,i)=>[i+2,pile.filter(c=>c.suit===suit&&c.rank===i+2).length]))]));
 return {remaining:makeCounts(s.deck),held:makeCounts(s.hand),used:makeCounts(s.discard)};
}
function upgradeLegacy(raw){
 if(raw.version!==1)return raw;
 const converted=structuredClone(raw);
 const card=c=>{const suit=OLD_SUIT_MAP[c.suit];return suit?{...c,suit,id:suit+'-'+c.rank,critical:false}:c;};
 converted.deck=converted.deck.map(card);converted.hand=converted.hand.map(card);
 converted.discard=converted.discard.map(card);
 converted.selected=converted.selected.map(id=>{const [suit,rank]=id.split('-');return OLD_SUIT_MAP[suit]+'-'+rank;});
 converted.version=2;converted.sortMode='rank';converted.rested=false;
 return converted;
}
export function restoreBattle(value){
 if(!value||![1,2].includes(value.version)||!['battle','reward','won','lost'].includes(value.phase))return null;
 // Check basic shape before migration to avoid throwing on malformed saves.
 if(![value.deck,value.hand,value.discard,value.selected,value.sigils].every(Array.isArray))return null;
 let s;
 try{s=upgradeLegacy(value);}catch{return null;}
 if(!Number.isInteger(s.encounter)||s.encounter<0||s.encounter>=ENCOUNTERS.length||
  !Number.isInteger(s.hp)||s.hp<0||s.hp>100||
  s.maxHp!==100||!Number.isInteger(s.gold)||s.gold<0||s.gold>1000000||
  !Number.isInteger(s.round)||s.round<1||s.round>10000||
  !['rank','suit'].includes(s.sortMode)||typeof s.rested!=='boolean')return null;
 if(new Set(s.sigils).size!==s.sigils.length||s.sigils.length>6||
  s.sigils.some(id=>!SIGILS.some(sig=>sig.id===id)))return null;
 const piles=[...s.deck,...s.hand,...s.discard];
 if(piles.length!==52||new Set(piles.map(c=>c.id)).size!==52||
  piles.some(c=>!c||!SUITS.includes(c.suit)||!Number.isInteger(c.rank)||c.rank<2||c.rank>14||
   c.id!==c.suit+'-'+c.rank||(c.critical!==undefined&&typeof c.critical!=='boolean')))return null;
 if(s.hand.length>handLimit(s)||s.selected.length>5||new Set(s.selected).size!==s.selected.length||
  s.selected.some(id=>!s.hand.some(c=>c.id===id)))return null;
 if(!Number.isInteger(s.discardsLeft)||s.discardsLeft<0||s.discardsLeft>discardLimit(s)||
  !Number.isInteger(s.enemyClock)||s.enemyClock<0||s.enemyClock>enemyClockMax(s)||
  !Number.isInteger(s.enemyHp)||s.enemyHp<0||s.enemyHp>ENCOUNTERS[s.encounter].hp)return null;
 return s;
}
