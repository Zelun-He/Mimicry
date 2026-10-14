// Read-only link feedback for the Forest Edge card interface.
// The chain engine is the source of truth. Never infer a legal move from colors.
import {CARDS,MAX_CHAIN,MAX_STACK,chainGroups,canQueueCard,linkCards,analyzeChain} from '../chain-engine.js';

export const LINK_KINDS=Object.freeze({
 opening:Object.freeze({label:'START A CHAIN',short:'START',symbol:'◇',explanation:'The first card begins your command chain.'}),
 stack:Object.freeze({label:'FORMATION STACK',short:'STACK +1',symbol:'▣',explanation:'Matching recruits merge into one tactical slot.'}),
 wild:Object.freeze({label:'WILD LINK',short:'WILD',symbol:'♛',explanation:'A Hunger card can bridge two schools.'}),
 sequence:Object.freeze({label:'RISING SEQUENCE',short:'SEQUENCE +1',symbol:'↗',explanation:'This rank is exactly one higher than the previous card.'}),
 rank:Object.freeze({label:'RANK MATCH',short:'MATCHED RANK',symbol:'=',explanation:'Both cards show the same number, even across schools.'}),
 suit:Object.freeze({label:'SUIT LINK',short:'SAME SCHOOL',symbol:'✦',explanation:'Both cards belong to the same school.'}),
 mismatch:Object.freeze({label:'NO MATCH',short:'NO LINK',symbol:'×',explanation:'Match the previous school, the same number, or the next higher number.'}),
 full:Object.freeze({label:'CHAIN FULL',short:'5 SLOTS FULL',symbol:'■',explanation:'Five tactical slots are occupied. Remove a card before adding another.'}),
 unavailable:Object.freeze({label:'NOT AVAILABLE',short:'UNAVAILABLE',symbol:'—',explanation:'This card is not available in your hand.'})
});

export function linkReason(previous,next){
 const x=CARDS[previous?.type],y=CARDS[next?.type];
 if(!y)return 'unavailable';
 if(!x)return 'opening';
 if(!linkCards(previous,next))return 'mismatch';
 if(x.suit==='hunger'||y.suit==='hunger')return 'wild';
 if(y.rank===x.rank+1)return 'sequence';
 if(y.rank===x.rank)return 'rank';
 return 'suit';
}

// The preview is presentation only. It must never change deck, queue or RNG.
export function previewCardLink(deck,cardOrId){
 const card=typeof cardOrId==='string'?
  deck?.hand?.find(c=>c.id===cardOrId):cardOrId;
 if(!deck||!Array.isArray(deck.hand)||!Array.isArray(deck.chain)||
    !card||!deck.hand.some(c=>c.id===card.id&&c.type===card.type)){
  return {legal:false,kind:'unavailable',...LINK_KINDS.unavailable,slots:0,count:0,boost:1};
 }
 const groups=chainGroups(deck.chain);
 const tail=deck.chain.at(-1);
 const tailGroup=groups.at(-1);
 const stacking=Boolean(tail&&CARDS[card.type]?.kind==='summon'&&
   tail.type===card.type&&tailGroup?.count<MAX_STACK);
 const permitted=canQueueCard(deck,card.id);
 let kind=stacking?'stack':linkReason(tail,card);
 if(!permitted){
  kind=chainGroups([...deck.chain,card]).length>MAX_CHAIN?'full':kind==='unavailable'?'unavailable':'mismatch';
 }
 const info=LINK_KINDS[kind];
 const potential=permitted?analyzeChain([...deck.chain,card]):[];
 const last=potential.at(-1);
 return {
  legal:permitted,kind,label:info.label,short:info.short,symbol:info.symbol,
  explanation:info.explanation,
  slots:chainGroups([...deck.chain,card]).length,
  count:stacking?tailGroup.count+1:1,
  boost:permitted?last?.boost??1:1,
  resonance:permitted?Boolean(last?.resonance):false
 };
}

export function queuedLinkKinds(cards){
 const groups=chainGroups(cards||[]);
 return groups.map((group,i)=>{
  const previous=groups[i-1]?.card;
  return {kind:linkReason(previous,group.card),count:group.count,
   ...LINK_KINDS[linkReason(previous,group.card)]};
 });
}
