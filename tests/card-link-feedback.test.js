import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,MAX_CHAIN,MAX_STACK,linkCards,canQueueCard,analyzeChain,chainSlotCount} from '../dist/chain-engine.js';
import {LINK_KINDS,linkReason,previewCardLink,queuedLinkKinds} from '../dist/siege/link-feedback.js';

const c=(type,id=type)=>({id,type});
const deck=(chain,hand)=>({chain:[...chain],hand:[...hand]});
test('all visual link types have understandable, distinct labels and symbols',()=>{
 const expected=['opening','stack','wild','sequence','rank','suit','mismatch','full','unavailable'];
 assert.deepEqual(Object.keys(LINK_KINDS),expected);
 for(const kind of expected){
  const info=LINK_KINDS[kind];
  assert.ok(info.label.length>=4);
  assert.ok(info.short.length>=3);
  assert.ok(info.explanation.length>20);
  assert.ok(info.symbol.length>=1);
 }
});

test('the UI follows the real linking engine: suit, rank, sequence, and hunger wildcard',()=>{
 const cases=[
  ['strike','execute','suit'], // Fang 1 -> Fang 4
  ['blood','guard','rank'], // Fang 2 -> Shell 2
  ['blood','regrow','sequence'], // Fang 2 -> Bloom 3
  ['strike','blood','sequence'], // same suit AND +1, show the more informative sequence
  ['strike','decree','wild'],
  ['decree','detonate','wild'],
  ['strike','detonate','mismatch']
 ];
 for(const [a,b,expected] of cases){
  const x=c(a),y=c(b);
  assert.equal(linkReason(x,y),expected,`${a} to ${b}`);
  assert.equal(linkCards(x,y),expected!=='mismatch',`${a} -> ${b} must agree with game engine`);
  const d=deck([x],[y]);
  const result=previewCardLink(d,y);
  assert.equal(result.kind,expected);
  assert.equal(result.legal,canQueueCard(d,y.id));
  assert.equal(result.slots,2);
 }
});

test('an opening card previews as a chain start and does not invent a link bonus',()=>{
 const d=deck([],[c('strike')]);
 const result=previewCardLink(d,'strike');
 assert.equal(result.legal,true);
 assert.equal(result.kind,'opening');
 assert.equal(result.slots,1);
 assert.equal(result.boost,1);
 assert.equal(result.count,1);
});

test('consecutive duplicate recruits stack into one slot, twice only',()=>{
 const first=c('goblin-recruit','f0');
 const second=c('goblin-recruit','f1');
 const third=c('goblin-recruit','p0');
 const fourth=c('goblin-recruit','p1');
 let d=deck([first],[second]);
 assert.equal(previewCardLink(d,second).kind,'stack');
 assert.equal(previewCardLink(d,second).count,2);
 assert.equal(previewCardLink(d,second).slots,1);
 d=deck([first,second],[third]);
 assert.equal(previewCardLink(d,third).kind,'stack');
 assert.equal(previewCardLink(d,third).count,MAX_STACK);
 assert.equal(previewCardLink(d,third).slots,1);
 d=deck([first,second,third],[fourth]);
 assert.equal(previewCardLink(d,fourth).kind,'rank'); // After a full stack, same rank takes precedence over same suit.
 assert.equal(previewCardLink(d,fourth).slots,2);
 assert.equal(previewCardLink(d,fourth).count,1);
});

test('stacking remains legal in a full five-slot chain but a new slot is forbidden',()=>{
 const chain=[c('strike','1'),c('blood','2'),c('ambush','3'),c('execute','4'),c('goblin-recruit','5')];
 const next=c('goblin-recruit','6');
 const d=deck(chain,[next]);
 assert.equal(chainSlotCount(d.chain),MAX_CHAIN);
 assert.equal(previewCardLink(d,next).kind,'stack');
 assert.equal(previewCardLink(d,next).legal,true);
 const full=deck([...chain,c('goblin-recruit','7'),c('goblin-recruit','8')],[c('goblin-recruit','9')]);
 assert.equal(chainSlotCount(full.chain),MAX_CHAIN);
 assert.equal(previewCardLink(full,full.hand[0]).legal,false);
 assert.equal(previewCardLink(full,full.hand[0]).kind,'full');
});

test('full chain is clearly reported as full rather than a bad suit match',()=>{
 const d=deck([c('strike'),c('blood'),c('ambush'),c('execute'),c('frenzy')],[c('goblin-recruit')]);
 const result=previewCardLink(d,'goblin-recruit');
 assert.equal(result.legal,false);
 assert.equal(result.kind,'full');
 assert.equal(result.label,'CHAIN FULL');
});

test('queued link badges use one tag per tactical slot, not each physical card',()=>{
 const chain=[c('strike','a'),c('fortify','b'),c('guard','c'),c('decree','d')];
 const reasons=queuedLinkKinds(chain);
 assert.deepEqual(reasons.map(x=>x.kind),['opening','rank','sequence','wild']);
 const duo=[c('goblin-recruit','f0'),c('goblin-recruit','f1'),c('pack-attack','p0')];
 assert.equal(queuedLinkKinds(duo).length,2);
 assert.equal(queuedLinkKinds(duo)[0].count,2);
 assert.equal(queuedLinkKinds(duo)[1].kind,'sequence');
});

test('preview is pure and invalid, fabricated or no-longer-in-hand cards are never playable',()=>{
 const d=deck([c('strike')],[c('fortify'),c('detonate')]);
 const snap=structuredClone(d);
 assert.equal(previewCardLink(d,'not-a-card').kind,'unavailable');
 assert.equal(previewCardLink(d,c('strike')).kind,'unavailable');
 assert.equal(previewCardLink(d,'detonate').kind,'mismatch');
 assert.equal(previewCardLink(d,'fortify').kind,'rank');
 assert.deepEqual(d,snap);
});

test('all supported rank and school links stay in agreement with chain-engine',()=>{
 const defs=Object.keys(CARDS);
 for(const from of defs)for(const to of defs){
  const x=c(from,'a'),y=c(to,'b');
  const d=deck([x],[y]);
  const info=previewCardLink(d,y);
  assert.equal(info.legal,linkCards(x,y),`disagreed on ${from} -> ${to}`);
  assert.equal(info.kind==='mismatch',!linkCards(x,y));
  assert.equal(info.slots,from===to&&CARDS[from].kind==='summon'?1:2);
 }
});

test('link bonus preview uses real analysis and changes no card power',()=>{
 const d=deck([c('strike','a'),c('blood','b')],[c('ambush','c')]);
 const result=previewCardLink(d,'c');
 const chain=analyzeChain([...d.chain,...d.hand]);
 assert.equal(result.boost,chain.at(-1).boost);
 assert.equal(result.resonance,chain.at(-1).resonance);
 assert.equal(result.kind,'sequence');
 assert.equal(result.legal,true);
});
