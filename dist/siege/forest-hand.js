// Adapt newer Siege cards to the original bright parchment attack-chain table.
import {CARDS} from '../chain-engine.js';
import {cardArt,cardRule,SUIT_STYLES} from './card-art.js';
import {creatureCardArt,creatureCardIdentity} from './creature-card-art.js';
import {previewChain} from '../siege-engine.js';
import {previewCardLink,queuedLinkKinds} from './link-feedback.js';
import {cardPower} from '../shop-engine.js';
import {presentationFor,payoffReady,cardFullRules} from './card-presentation.js';
import {cardFaceClass,renderCardFace} from './card-face.js';
export function escapeHTML(value){return String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}

export function renderForestHand(s,{artFor,ruleFor,discardMode=false}={}){
 const locked=s.phase!=='battle'||Boolean(s.pendingEssence);
 return s.deck.hand.map(card=>{
  const def=CARDS[card.type],link=previewCardLink(s.deck,card);
  const canPlay=!locked&&link.legal;
  const canDiscard=!locked&&s.deck.discardsLeft>0;
  const active=discardMode?canDiscard:canPlay;
  const family=creatureCardIdentity(card.type);
  const identity=presentationFor(card.type),isReady=canPlay&&payoffReady(s,card.type);
  const id=escapeHTML(card.id),name=escapeHTML(def.name),rank=def.rank||'★';
  // On an empty chain, roles explain cards instead of repeating "START" ×8.
  // With a chain, show the exact link reason where it is relevant.
  const linkText=locked?'WAIT':discardMode?'REDRAW':
   s.deck.chain.length?(canPlay?link.short:'NO LINK'):'';
  const summary=escapeHTML((ruleFor||cardRule)(card.type));
  const accessible=escapeHTML([
   def.name,identity.role,def.suit+' link rank '+rank,
   family?family.name+' creature':'',cardFullRules(card.type),summary,
   canPlay?link.label:link.explanation,
   isReady?'Synergy ready.':''
  ].filter(Boolean).join('. '));
  return '<button type="button" class="card '+def.suit+' '+(active?'playable':'card-inactive')+
   ' '+cardFaceClass(card.type)+(canPlay&&link.kind==='stack'?' is-stack':'')+
   (discardMode?' is-discarding':'')+(isReady?' is-combo-ready':'')+
   '" data-card-id="'+id+'" data-school="'+def.suit+'" data-link-kind="'+link.kind+
   '" data-rarity="'+(def.rarity||'common')+'" data-role="'+identity.role.toLowerCase()+'"'+
   (family?' data-tribe="'+family.key+'"':'')+
   ' aria-disabled="'+(!active)+'" aria-label="'+accessible+'">'+
   renderCardFace(card.type,{artFor,level:card.level||0,linkText,ready:isReady})+
   '</button>';
 }).join('');
}
lass="card-effect">'+rule+'</span><span class="card-link">'+
   (locked?'WAIT':link.symbol+' '+link.short)+'</span></button>';
 }).join('');
}

export function renderForestChain(s){
 const steps=previewChain(s),kinds=queuedLinkKinds(s.deck.chain),slots=[];
 for(let i=0;i<5;i++){
  const step=steps[i];
  if(!step){slots.push('<div class="chain-slot" aria-label="Empty chain slot '+(i+1)+'">'+(i+1)+'</div>');continue;}
  const mark=SUIT_STYLES[step.def.suit].symbol,label=step.count>1?(step.count===3?'HORDE ×3':'MOB ×2'):kinds[i].short;
  slots.push('<button type="button" class="chain-slot filled '+step.def.suit+(step.linked?' linked':'')+
   '" style="--suit:'+SUIT_STYLES[step.def.suit].ink+'" data-unqueue="'+escapeHTML(step.cards.at(-1).id)+
   '" data-chain-index="'+i+'" aria-label="Remove '+escapeHTML(step.def.name)+' from chain slot '+(i+1)+
   '" title="'+escapeHTML(kinds[i].explanation)+
   '"><span class="order">'+(i+1)+'</span><span class="chain-crest">'+mark+'</span>'+
   '<span class="chain-number">'+(step.def.rank||'★')+'</span>'+
   '<span class="chain-name">'+escapeHTML(step.def.name)+'</span>'+
   '<span class="chain-tag">'+escapeHTML(label)+'</span>'+
   '<span class="chain-remove" aria-hidden="true">×</span></button>');
 }
 return slots.join('');
}

export function predictBaseEffects(s){
 const plan=previewChain(s);
 const totals={power:0,armor:0,heal:0,poison:0,return:0};
 for(const step of plan){
  const power=cardPower(s,step.card);
  const kind=step.def.kind;
  if(['strike','execute','counter','thorns','detonate','sacrifice','tithe','mirror'].includes(kind))totals.power+=power;
  if(['armor','thorns'].includes(kind))totals.armor+=power;
  if(['heal','teamheal'].includes(kind))totals.heal+=power;
  if(['poison','corrode'].includes(kind))totals.poison+=power;
 }
 totals.return=s.enemies.filter(e=>e.alive).reduce((sum,e)=>sum+Math.max(0,e.attack-(e.weaken||0)),0);
 return totals;
}

export function renderForestPrediction(s){
 const base=predictBaseEffects(s);
 return [
  ['power','POWER','Before buffs, armor and specialist bonuses'],
  ['armor','ARMOR','Base armor from queued cards, before affinity'],
  ['heal','HEAL','Base healing from queued cards'],
  ['poison','POISON','Base poison from queued cards'],
  ['return','INCOMING','Maximum raw attack from living enemies before blockers']
 ].map(([key,label,title])=>'<span title="'+title+'"><b>'+base[key]+'</b> '+label.toLowerCase()+'</span>').join('');
}
