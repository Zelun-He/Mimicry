// Pure deterministic command-chain rules. No RNG or DOM dependencies.
export const HAND_SIZE=8,MAX_CHAIN=5,MAX_DISCARDS=2;
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
 mirror:{name:'Mirror Fang',suit:'hunger',rank:0,kind:'mirror',power:0,cost:20,rarity:'legendary',price:26,description:'Pay 20 Hunger to repeat the previous simple command at half strength.'}
});
export const SHOP_CARD_TYPES=Object.freeze(['sacrifice','tithe','harvest','mirror']);
export const STARTER_DECK=['strike','strike','blood','ambush','execute','frenzy','fortify','fortify','guard','thorns','counter','mend','mend','roots','regrow','symbiosis','bite','bite','corrode','contagion','detonate','decree','feast','strike'];
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));if(!Number.isInteger(j)||j<0||j>i)throw Error('Invalid RNG');[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeDeck(rng=Math.random){return {draw:shuffle(STARTER_DECK.map((id,i)=>({id:`c${i}`,type:id})),rng),discard:[],hand:[],chain:[],discardsLeft:MAX_DISCARDS,acquired:[],acquiredAt:[]};}
export function drawCards(deck,count=HAND_SIZE,rng=Math.random){while(deck.hand.length<count){if(!deck.draw.length){if(!deck.discard.length)break;deck.draw=shuffle(deck.discard,rng);deck.discard=[];}deck.hand.push(deck.draw.pop());}return deck.hand;}
export function queueCard(deck,id){if(deck.chain.length>=MAX_CHAIN)return false;const i=deck.hand.findIndex(c=>c.id===id);if(i<0)return false;if(deck.chain.length&&!linkCards(deck.chain.at(-1),deck.hand[i]))return false;deck.chain.push(deck.hand.splice(i,1)[0]);return true;}
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
export function analyzeChain(cards){if(cards.length>MAX_CHAIN)throw Error('Chain exceeds maximum');let streak=0;return cards.map((card,i)=>{const def=CARDS[card.type];if(!def)throw Error('Unknown card');const linked=i>0&&linkCards(cards[i-1],card);streak=linked?streak+1:0;const sameSuit=i>0&&CARDS[cards[i-1].type].suit===def.suit&&def.suit!=='hunger';return {card,def,linked,streak,boost:1+Math.min(3,streak)*0.25,resonance:sameSuit};});}
// Card IDs are stable across shuffles and save/restore: starter c0..c23, purchased p0..p3.
export function validateDeck(d,handSize=HAND_SIZE,allowLegacy=false,discardMax=MAX_DISCARDS){
 if(!d||!['draw','discard','hand','chain'].every(k=>Array.isArray(d[k]))||
    !Number.isInteger(d.discardsLeft)||d.discardsLeft<0||d.discardsLeft>discardMax||
    d.hand.length>handSize||d.chain.length>MAX_CHAIN)return false;
 const acquired=d.acquired===undefined&&allowLegacy?[]:d.acquired;
 const acquiredAt=d.acquiredAt===undefined&&allowLegacy?[]:d.acquiredAt;
 if(!Array.isArray(acquiredAt)||!Array.isArray(acquired)||acquiredAt.length!==acquired.length||
    acquiredAt.some((raid,i)=>!Number.isInteger(raid)||raid<0||raid>3||(i>0&&raid<=acquiredAt[i-1]))||
    acquired.length>4||
    !acquired.every(type=>SHOP_CARD_TYPES.includes(type)))return false;
 const expected=new Map(STARTER_DECK.map((type,i)=>[`c${i}`,type]));
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
 const suits=cards.map(c=>{const def=CARDS[c.type];if(!def)throw Error('Unknown card');return def.suit;});
 const matches=[];
 for(let i=0;i<=suits.length-3;i++)for(const ritual of RITUALS){
  if(ritual.pattern.every((s,j)=>s===suits[i+j]))matches.push({ritual,start:i,end:i+2});
 }
 return matches;
}
