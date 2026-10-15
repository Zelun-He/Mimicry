// Mimicry: original poker-combat rules inspired by The Demon's Hand.
export const SUITS=['fang','shell','bloom','venom'];
export const SUIT_NAMES={fang:'Fang',shell:'Shell',bloom:'Bloom',venom:'Venom'};
export const RANK_NAMES={11:'Scout',12:'Seer',13:'Knight',14:'Crown'};
export const BASE_DAMAGE={solo:10,dyad:20,'dyad-set':40,triad:80,march:100,horde:125,warhost:175,tetrad:400,'marching-horde':600,'mimics-hand':2000};
export const HAND_LABELS={solo:'Solo',dyad:'Dyad','dyad-set':'Dyad Set',triad:'Triad',march:'March',horde:'Horde',warhost:'Grand Warhost',tetrad:'Tetrad','marching-horde':'Marching Horde','mimics-hand':'The Mimic’s Hand'};
export const ENCOUNTERS=[
 {name:'Lost Forager',role:'Wandering Peasant',hp:135,attack:11,clock:3,trait:'Unprepared',scene:'fernway'},
 {name:'Greenwood Scout',role:'Forest Pathfinder',hp:230,attack:16,clock:3,trait:'Quickfoot',scene:'sunbreak'},
 {name:'Roadside Militia',role:'Armored Patrol',hp:350,attack:22,clock:2,trait:'Ironclad',scene:'briar'},
 {name:'Lantern Witch',role:'Wandering Arcanist',hp:525,attack:29,clock:2,trait:'Hexed',scene:'wispwood'},
 {name:'Old Road Watchman',role:'Forest Guardian',hp:800,attack:37,clock:2,trait:'Unyielding',scene:'watchgate'}
];
export const SIGILS=[
 {id:'teeth',name:'Sharpened Teeth',cost:20,desc:'+15 damage on every attack.'},
 {id:'twin',name:'Twin Fangs',cost:25,desc:'Pairs and two pairs gain +35 damage.'},
 {id:'venom',name:'Venomous Bite',cost:24,desc:'Venom cards add +5 value to damage.'},
 {id:'satchel',name:'Deep Pockets',cost:32,desc:'Increase hand size by 1.'},
 {id:'patience',name:'Patient Hunter',cost:32,desc:'Enemies take one extra attack before retaliating.'},
 {id:'carapace',name:'Splintered Shell',cost:28,desc:'Reduce incoming damage by 7.'},
 {id:'hunger',name:'Hungry Chest',cost:23,desc:'Gain 8 extra gold per victory.'},
 {id:'reroll',name:'Second Chance',cost:28,desc:'Gain one extra discard per encounter.'},
 {id:'royal',name:'Crown Eater',cost:37,desc:'Straights and flushes deal 35% more damage.'}
];
export function deck52(){return SUITS.flatMap(suit=>Array.from({length:13},(_,i)=>({id:suit+'-'+(i+2),suit,rank:i+2})))}
export function shuffle(cards,rng=Math.random){const a=[...cards];for(let i=a.length-1;i>0;i--){const r=rng();if(!Number.isFinite(r)||r<0||r>=1)throw Error('Invalid RNG');const j=Math.floor(r*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}
export function evaluateHand(cards,sigils=[]){
 if(!cards.length||cards.length>5||new Set(cards.map(x=>x.id)).size!==cards.length) return null;
 const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);
 const counts=Object.values(ranks.reduce((o,n)=>(o[n]=(o[n]||0)+1,o),{})).sort((a,b)=>b-a);
 const flush=cards.length===5&&cards.every(c=>c.suit===cards[0].suit);
 const straight=cards.length===5&&(ranks.every((n,i)=>i===0||n===ranks[i-1]+1)||(ranks.join(',')==='2,3,4,5,14'));
 let type='solo';
 if(cards.length===5&&flush&&ranks.join(',')==='10,11,12,13,14')type='mimics-hand';
 else if(straight&&flush)type='marching-horde';
 else if(counts[0]===4)type='tetrad';
 else if(counts[0]===3&&counts[1]===2)type='warhost';
 else if(flush)type='horde';
 else if(straight)type='march';
 else if(counts[0]===3)type='triad';
 else if(counts[0]===2&&counts[1]===2)type='dyad-set';
 else if(counts[0]===2)type='dyad';
 // Incomplete selections with unmatched cards get only their best valid group.
 const core=type==='solo'?Math.max(...ranks):cards.reduce((n,c)=>n+c.rank,0);
 const bonus=sigils.includes('teeth')?15:0;
 const twin=sigils.includes('twin')&&['dyad','dyad-set'].includes(type)?35:0;
 const venom=sigils.includes('venom')?cards.filter(c=>c.suit==='venom').length*5:0;
 const royal=sigils.includes('royal')&&['march','horde','marching-horde','mimics-hand'].includes(type)?1.35:1;
 const damage=Math.floor((BASE_DAMAGE[type]+core+bonus+twin+venom)*royal);
 return {type,label:HAND_LABELS[type],damage,base:BASE_DAMAGE[type],value:core};
}
export function deal(state,n,rng=Math.random){
 while(state.hand.length<n){
  if(!state.deck.length){if(!state.discard.length)break;state.deck=shuffle(state.discard,rng);state.discard=[];}
  state.hand.push(state.deck.pop());
 }
}
export function newBattle(rng=Math.random){
 const s={version:1,encounter:0,phase:'battle',maxHp:100,hp:100,gold:0,sigils:[],deck:shuffle(deck52(),rng),hand:[],discard:[],selected:[],discardsLeft:3,enemyClock:3,enemyHp:ENCOUNTERS[0].hp,round:1,log:'A lost traveler approaches the chest.',lastAttack:null};
 deal(s,8,rng);return s;
}
export function handLimit(s){return 8+(s.sigils.includes('satchel')?1:0)}
export function discardLimit(s){return 3+(s.sigils.includes('reroll')?1:0)}
export function enemyClockMax(s){return ENCOUNTERS[s.encounter].clock+(s.sigils.includes('patience')?1:0)}
export function toggleCard(s,id){
 if(s.phase!=='battle')return false;
 if(s.selected.includes(id)){s.selected=s.selected.filter(x=>x!==id);return true}
 if(s.selected.length>=5||!s.hand.some(c=>c.id===id))return false;
 s.selected.push(id);return true;
}
export function selectedCards(s){return s.selected.map(id=>s.hand.find(c=>c.id===id)).filter(Boolean)}
export function discardSelected(s,rng=Math.random){
 if(s.phase!=='battle'||!s.selected.length||s.selected.length>5||s.discardsLeft<=0)return false;
 const selected=new Set(s.selected);
 s.discard.push(...s.hand.filter(c=>selected.has(c.id)));
 s.hand=s.hand.filter(c=>!selected.has(c.id));s.selected=[];
 s.discardsLeft--;deal(s,handLimit(s),rng);
 s.log='Discarded and redrew '+selected.size+' cards.';return true;
}
export function attack(s,rng=Math.random){
 if(s.phase!=='battle'||!s.selected.length)return null;
 const played=selectedCards(s),evald=evaluateHand(played,s.sigils);
 if(!evald)return null;
 const foe=ENCOUNTERS[s.encounter];
 let damage=evald.damage;
 if(foe.trait==='Ironclad'&&evald.type==='solo')damage=Math.max(1,damage-12);
 if(foe.trait==='Hexed'&&played.some(c=>c.suit==='bloom'))damage=Math.floor(damage*.85);
 if(foe.trait==='Unyielding'&&['dyad','solo'].includes(evald.type))damage=Math.floor(damage*.8);
 s.enemyHp=Math.max(0,s.enemyHp-damage);
 const removed=new Set(s.selected);
 s.discard.push(...s.hand.filter(c=>removed.has(c.id)));
 s.hand=s.hand.filter(c=>!removed.has(c.id));
 s.selected=[];s.lastAttack={...evald,damage};
 if(s.enemyHp<=0){
  s.phase=s.encounter===ENCOUNTERS.length-1?'won':'reward';
  s.gold+=25+s.encounter*12+(s.sigils.includes('hunger')?8:0);
  s.log=evald.label+' for '+damage+' damage! '+foe.name+' defeated.';
  return {damage,hit:0,won:true,hand:evald.label};
 }
 s.enemyClock--;
 let hit=0;
 if(s.enemyClock<=0){
  hit=Math.max(1,foe.attack-(s.sigils.includes('carapace')?7:0));
  s.hp=Math.max(0,s.hp-hit);
  s.enemyClock=enemyClockMax(s);
  if(s.hp<=0)s.phase='lost';
 }
 deal(s,handLimit(s),rng);
 s.round++;
 s.log=evald.label+' dealt '+damage+' damage.'+(hit?' '+foe.name+' retaliates for '+hit+'.':'');
 return {damage,hit,won:false,hand:evald.label};
}
export function buySigil(s,id){
 if(s.phase!=='reward'||s.sigils.includes(id)||s.sigils.length>=6)return false;
 const item=SIGILS.find(x=>x.id===id);
 if(!item||s.gold<item.cost)return false;
 s.gold-=item.cost;s.sigils.push(id);return true;
}
export function advance(s,rng=Math.random){
 if(s.phase!=='reward')return false;
 s.encounter++;const foe=ENCOUNTERS[s.encounter];
 s.deck=shuffle([...s.deck,...s.hand,...s.discard],rng);s.hand=[];s.discard=[];s.selected=[];
 s.discardsLeft=discardLimit(s);s.enemyClock=enemyClockMax(s);s.enemyHp=foe.hp;s.round=1;s.phase='battle';s.lastAttack=null;
 deal(s,handLimit(s),rng);s.log=foe.name+' enters the clearing.';return true;
}
export function rest(s){
 if(s.phase!=='reward')return false;
 s.hp=Math.min(s.maxHp,s.hp+22);return true;
}
export function restoreBattle(raw){
 if(!raw||raw.version!==1||!['battle','reward','won','lost'].includes(raw.phase))return null;
 if(!Number.isInteger(raw.encounter)||raw.encounter<0||raw.encounter>=ENCOUNTERS.length)return null;
 if(!Number.isInteger(raw.hp)||raw.hp<0||raw.hp>100||!Number.isInteger(raw.gold)||raw.gold<0)return null;
 if(!Array.isArray(raw.sigils)||new Set(raw.sigils).size!==raw.sigils.length||raw.sigils.length>6||raw.sigils.some(id=>!SIGILS.some(s=>s.id===id)))return null;
 if(![raw.deck,raw.hand,raw.discard,raw.selected].every(Array.isArray))return null;
 const cards=[...raw.deck,...raw.hand,...raw.discard];const expected=deck52();
 if(cards.length!==52||new Set(cards.map(x=>x.id)).size!==52||cards.some(c=>!expected.some(e=>e.id===c.id&&e.suit===c.suit&&e.rank===c.rank)))return null;
 if(raw.hand.length>handLimit(raw)||raw.selected.length>5||new Set(raw.selected).size!==raw.selected.length||raw.selected.some(id=>!raw.hand.some(c=>c.id===id)))return null;
 if(!Number.isInteger(raw.discardsLeft)||raw.discardsLeft<0||raw.discardsLeft>discardLimit(raw))return null;
 if(!Number.isInteger(raw.enemyClock)||raw.enemyClock<0||raw.enemyClock>enemyClockMax(raw))return null;
 if(!Number.isInteger(raw.enemyHp)||raw.enemyHp<0||raw.enemyHp>ENCOUNTERS[raw.encounter].hp)return null;
 return raw;
}
