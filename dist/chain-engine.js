// Pure deterministic command-chain rules. No RNG or DOM dependencies.
export const HAND_SIZE=8,MAX_CHAIN=5,MAX_DISCARDS=2,MAX_STACK=3;
export const CARDS=Object.freeze({
 strike:{name:'Quick Strike',suit:'fang',rank:1,kind:'strike',power:4},
 blood:{name:'Bloodletting',suit:'fang',rank:2,kind:'strike',power:5},
 ambush:{name:'Ambush',suit:'fang',rank:3,kind:'strike',power:7},
 execute:{name:'Execute',suit:'fang',rank:4,kind:'execute',power:7},
 frenzy:{name:'Frenzy',suit:'fang',rank:5,kind:'frenzy',power:2},
 fortify:{name:'Fortify',suit:'shell',rank:1,kind:'armor',power:7},
 guard:{name:'Bone Wall',suit:'shell',rank:2,kind:'armor',power:9},
 thorns:{name:'Thorns',suit:'shell',rank:3,kind:'thorns',power:4},
 counter:{name:'Counterstrike',suit:'shell',rank:4,kind:'counter',power:0},
 mend:{name:'Mend',suit:'bloom',rank:1,kind:'heal',power:7},
 roots:{name:'Root Snare',suit:'bloom',rank:2,kind:'weaken',power:2},
 regrow:{name:'Regrowth',suit:'bloom',rank:3,kind:'heal',power:10},
 symbiosis:{name:'Symbiosis',suit:'bloom',rank:4,kind:'teamheal',power:4},
 bite:{name:'Toxic Bite',suit:'venom',rank:1,kind:'poison',power:3},
 corrode:{name:'Corrode',suit:'venom',rank:2,kind:'corrode',power:3},
 contagion:{name:'Contagion',suit:'venom',rank:3,kind:'spread',power:0},
 detonate:{name:'Detonate',suit:'venom',rank:4,kind:'detonate',power:2},
 decree:{name:'Royal Decree',suit:'hunger',rank:0,kind:'decree',power:0,cost:30},
 feast:{name:'Feast',suit:'hunger',rank:0,kind:'feast',power:12,cost:40},
 // Only obtainable through the Quartermaster; none appear in the starter deck.
 sacrifice:{name:'Sacrificial Strike',suit:'fang',rank:4,kind:'sacrifice',power:14,rarity:'rare',price:18,description:'Spend up to 25% of your healthiest defender’s HP (never lethal) to strike harder.'},
 tithe:{name:'Bone Tithe',suit:'shell',rank:3,kind:'tithe',power:6,rarity:'rare',price:19,description:'Consume up to 6 allied armor and deal 2 damage for each armor spent.'},
 harvest:{name:'Spore Harvest',suit:'bloom',rank:4,kind:'harvest',power:3,rarity:'rare',price:21,description:'Consume poison stacks from the focus target to heal all defenders.'},
 mirror:{name:'Mirror Fang',suit:'hunger',rank:0,kind:'mirror',power:0,cost:20,rarity:'legendary',price:26,description:'Pay 20 Hunger to repeat the previous simple command at half strength.'},
 // Tribal summoning is a second card affiliation, not a sixth suit.
 'goblin-recruit':{name:'Goblin Recruit',suit:'fang',rank:1,kind:'summon',tribe:'goblin',power:0,price:12,rarity:'common',description:'Summon 1 Goblin into the selected lane. Stack up to 3 copies into one chain slot.'},
 'skeleton-recruit':{name:'Raise Skeleton',suit:'shell',rank:1,kind:'summon',tribe:'skeleton',power:0,price:12,rarity:'common',description:'Raise 1 disposable Skeleton. It leaves a Bone if it falls.'},
 'pack-attack':{name:'Pack Attack',suit:'fang',rank:2,kind:'pack',tribe:'goblin',power:0,price:12,rarity:'uncommon',description:'Every active Goblin minion attacks in its lane immediately.'},
 'loot-fallen':{name:'Loot the Fallen',suit:'fang',rank:3,kind:'loot',tribe:'goblin',power:0,price:12,rarity:'uncommon',description:'If you command at least one Goblin minion, earn 3 gold once per turn.'},
 'bone-march':{name:'Bone March',suit:'shell',rank:2,kind:'march',tribe:'skeleton',power:0,price:12,rarity:'uncommon',description:'All summoned Skeletons attack again; each stored Bone adds 1 bonus damage, up to 3.'},
 'bone-wall':{name:'Ossuary Wall',suit:'shell',rank:3,kind:'bonewall',tribe:'skeleton',power:0,price:12,rarity:'uncommon',description:'Spend up to 3 Bones; grant 3 armor per Bone to permanent allies in the selected lane.'},
 'rattle-dead':{name:'Rattle the Dead',suit:'shell',rank:4,kind:'rattle',tribe:'skeleton',power:0,price:12,rarity:'uncommon',description:'Spend 2 Bones to raise 1 Skeleton; revived Skeletons cannot make a Bone until next turn.'},
 // Biome-neutral creature families: their mechanics function in the existing forest.
 'spider-summon':{name:'Spider Hatchling',suit:'venom',rank:1,kind:'summon',tribe:'spider',power:0,price:15,rarity:'common',description:'Summon a Spider into the chosen lane. It webs prey and poisons webbed enemies on hit. Stack up to 3.'},
 'silken-prison':{name:'Silken Prison',suit:'venom',rank:2,kind:'web-trap',tribe:'spider',power:0,price:15,rarity:'uncommon',description:'Add 2 Web to an enemy in the chosen lane; all your Spiders strike their lanes again.'},
 'slime-summon':{name:'Slime Droplet',suit:'bloom',rank:1,kind:'summon',tribe:'slime-bud',power:0,price:15,rarity:'common',description:'Summon a Slime. If it survives an enemy hit, it splits into a tiny Slime once per turn (subject to cap).'},
 'gel-fusion':{name:'Gel Fusion',suit:'bloom',rank:2,kind:'fuse',tribe:'slime-bud',power:0,price:15,rarity:'uncommon',description:'Fuse two tiny or ordinary summoned Slimes in the chosen lane into a powerful Giant Ooze.'},
 'mimicling-summon':{name:'False Treasure',suit:'hunger',rank:0,kind:'summon',tribe:'mimicling',power:0,price:15,rarity:'common',description:'Summon a baby Mimic. Once per turn it lures the strongest outside invader to its lane; its first hit earns +5 Hunger.'},
 'family-dinner':{name:'Family Dinner',suit:'hunger',rank:0,kind:'family',tribe:'mimicling',power:0,price:15,rarity:'uncommon',description:'Order every Mimicling to bite a second time. Their first hit per turn generates +5 Hunger.'}
});
export const SHOP_CARD_TYPES=Object.freeze(['sacrifice','tithe','harvest','mirror']);
export const GOBLIN_SHOP_TYPES=Object.freeze(['goblin-recruit','pack-attack','loot-fallen']);
export const SKELETON_SHOP_TYPES=Object.freeze(['skeleton-recruit','bone-march','bone-wall','rattle-dead']);
export const TRIBAL_SHOP_TYPES=Object.freeze([...GOBLIN_SHOP_TYPES,...SKELETON_SHOP_TYPES]);
export const EXOTIC_SHOP_GROUPS=Object.freeze([
 Object.freeze(['spider-summon','silken-prison']),
 Object.freeze(['slime-summon','gel-fusion']),
 Object.freeze(['mimicling-summon','family-dinner'])
]);
export const EXOTIC_SHOP_TYPES=Object.freeze(EXOTIC_SHOP_GROUPS.flat());
export const FOUNDING_CARDS=Object.freeze(['goblin-recruit','goblin-recruit','skeleton-recruit','skeleton-recruit']);
export const STARTER_DECK=['strike','strike','blood','ambush','execute','frenzy','fortify','fortify','guard','thorns','counter','mend','mend','roots','regrow','symbiosis','bite','bite','corrode','contagion','detonate','decree','feast','strike'];
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));if(!Number.isInteger(j)||j<0||j>i)throw Error('Invalid RNG');[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeDeck(rng=Math.random,withTribes=false){
 const base=STARTER_DECK.map((type,i)=>({id:`c${i}`,type}));
 if(withTribes)base.push(...FOUNDING_CARDS.map((type,i)=>({id:`f${i}`,type})));
 return {draw:shuffle(base,rng),discard:[],hand:[],chain:[],discardsLeft:MAX_DISCARDS,acquired:[],acquiredAt:[],tribal:withTribes};
}
export function chainGroups(cards){
 const groups=[];
 for(const card of cards){
  const previous=groups.at(-1);
  if(previous&&CARDS[card.type]?.kind==='summon'&&previous.card.type===card.type&&previous.cards.length<MAX_STACK){
   previous.cards.push(card);
  }else groups.push({card,cards:[card]});
 }
 return groups.map(group=>({...group,count:group.cards.length}));
}
export function chainSlotCount(cards){return chainGroups(cards).length;}
export function canQueueCard(deck,id){
 const next=deck.hand.find(c=>c.id===id);
 if(!next||deck.chain.length>=MAX_CHAIN*MAX_STACK)return false;
 if(deck.chain.length&&!linkCards(deck.chain.at(-1),next))return false;
 return chainSlotCount([...deck.chain,next])<=MAX_CHAIN;
}
export function drawCards(deck,count=HAND_SIZE,rng=Math.random){while(deck.hand.length<count){if(!deck.draw.length){if(!deck.discard.length)break;deck.draw=shuffle(deck.discard,rng);deck.discard=[];}deck.hand.push(deck.draw.pop());}return deck.hand;}
export function queueCard(deck,id){
 if(!canQueueCard(deck,id))return false;
 const i=deck.hand.findIndex(c=>c.id===id);
 deck.chain.push(deck.hand.splice(i,1)[0]);
 return true;
}
// Removing a middle card may break the bridge between its neighbours.
// Return the invalid suffix to hand rather than silently leaving an unusable chain.
export function unqueueCard(deck,id){
 const i=deck.chain.findIndex(c=>c.id===id);
 if(i<0)return false;
 deck.hand.push(deck.chain.splice(i,1)[0]);
 for(let j=Math.max(1,i);j<deck.chain.length;j++){
  if(!linkCards(deck.chain[j-1],deck.chain[j])){
   deck.hand.push(...deck.chain.splice(j));
   break;
  }
 }
 return true;
}
export function discardCard(deck,id,rng=Math.random,handSize=HAND_SIZE){if(deck.discardsLeft<=0)return false;const i=deck.hand.findIndex(c=>c.id===id);if(i<0)return false;deck.discard.push(deck.hand.splice(i,1)[0]);deck.discardsLeft--;drawCards(deck,handSize-deck.chain.length,rng);return true;}
export function linkCards(a,b){const x=CARDS[a.type],y=CARDS[b.type];return !!(x&&y&&(x.suit==='hunger'||y.suit==='hunger'||x.suit===y.suit||y.rank===x.rank||y.rank===x.rank+1));}
export function analyzeChain(cards){
 const groups=chainGroups(cards);
 if(groups.length>MAX_CHAIN)throw Error('Chain exceeds maximum');
 let streak=0;
 return groups.map(({card,cards:members,count},i)=>{
  const def=CARDS[card.type];if(!def)throw Error('Unknown card');
  const linked=i>0&&linkCards(groups[i-1].card,card);
  streak=linked?streak+1:0;
  const sameSuit=i>0&&CARDS[groups[i-1].card.type].suit===def.suit&&def.suit!=='hunger';
  return {card,cards:members,count,def,linked,streak,boost:1+Math.min(3,streak)*0.25,resonance:sameSuit};
 });
}
// Card IDs are stable across shuffles and save/restore: starter c0..c23, purchased p0..p3.
// Version 7 owns four fixed founding cards plus up to eight paid acquisitions.
// Earlier saves remain their original 24-card deck until migrated in siege-engine.
export function validateDeck(d,handSize=HAND_SIZE,allowLegacy=false,discardMax=MAX_DISCARDS,withTribes=false,withExotics=false){
 if(!d||!['draw','discard','hand','chain'].every(k=>Array.isArray(d[k]))||
    !Number.isInteger(d.discardsLeft)||d.discardsLeft<0||d.discardsLeft>discardMax||
    d.hand.length>handSize||chainSlotCount(d.chain)>MAX_CHAIN||
    d.chain.length>MAX_CHAIN*MAX_STACK)return false;
 if(withTribes?d.tribal!==true:d.tribal===true)return false;
 if(withExotics?d.exotic!==true:d.exotic===true)return false;
 const acquired=d.acquired===undefined&&allowLegacy?[]:d.acquired;
 const acquiredAt=d.acquiredAt===undefined&&allowLegacy?[]:d.acquiredAt;
 if(!Array.isArray(acquiredAt)||!Array.isArray(acquired)||acquiredAt.length!==acquired.length||
    acquired.length>(withExotics?12:withTribes?8:4))return false;
 const byRaid=new Map();
 for(let i=0;i<acquired.length;i++){
  const raid=acquiredAt[i],type=acquired[i];
  if(!Number.isInteger(raid)||raid<0||raid>3|| (i>0&&raid<(acquiredAt[i-1]))||
     !(SHOP_CARD_TYPES.includes(type)||(withTribes&&TRIBAL_SHOP_TYPES.includes(type))||(withExotics&&EXOTIC_SHOP_TYPES.includes(type))))return false;
  const family=SHOP_CARD_TYPES.includes(type)?'rare':TRIBAL_SHOP_TYPES.includes(type)?'tribal':'exotic';
  const used=byRaid.get(raid)||new Set();
  if(used.has(family)||(!withTribes&&used.size>0))return false;
  used.add(family);byRaid.set(raid,used);
 }
 const expected=new Map(STARTER_DECK.map((type,i)=>[`c${i}`,type]));
 if(withTribes)FOUNDING_CARDS.forEach((type,i)=>expected.set(`f${i}`,type));
 for(let i=0;i<acquired.length;i++)expected.set(`p${i}`,acquired[i]);
 const cards=[...d.draw,...d.discard,...d.hand,...d.chain];
 if(cards.length!==expected.size||new Set(cards.map(c=>c?.id)).size!==expected.size)return false;
 return cards.every(c=>c&&typeof c.id==='string'&&expected.has(c.id)&&expected.get(c.id)===c.type&&
   (c.level===undefined||(Number.isInteger(c.level)&&c.level>=0&&c.level<=2)))&&
   d.chain.every((c,i)=>i===0||linkCards(d.chain[i-1],c));
}


// Rituals are contiguous three-card patterns, evaluated once per chain window.
// The wildcard Hunger school never substitutes for a ritual school.
export const RITUALS=Object.freeze([
 {id:'bloodbath',name:'Bloodbath',pattern:['fang','fang','fang'],description:'Your raiders strike again.'},
 {id:'counteroffensive',name:'Counteroffensive',pattern:['shell','shell','fang'],description:'Convert your defenders’ armor into damage.'},
 {id:'toxic-garden',name:'Toxic Garden',pattern:['bloom','venom','venom'],description:'Poison the invaders and heal Nature allies.'},
 {id:'living-wall',name:'Living Wall',pattern:['bloom','shell','shell'],description:'Protect every surviving defender.'},
 {id:'plague',name:'Plague',pattern:['venom','venom','venom'],description:'Spread poison to every living invader.'}
]);
export function findRituals(cards){
 const suits=chainGroups(cards).map(({card})=>{const def=CARDS[card.type];if(!def)throw Error('Unknown card');return def.suit;});
 const matches=[];
 for(let i=0;i<=suits.length-3;i++)for(const ritual of RITUALS){
  if(ritual.pattern.every((s,j)=>s===suits[i+j]))matches.push({ritual,start:i,end:i+2});
 }
 return matches;
}
