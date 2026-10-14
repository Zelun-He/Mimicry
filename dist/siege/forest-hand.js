// Adapt newer Siege cards to the original bright parchment attack-chain table.
import {CARDS} from '../chain-engine.js';
import {cardArt,cardRule,SUIT_STYLES} from './card-art.js';
import {previewChain} from '../siege-engine.js';
import {previewCardLink,queuedLinkKinds} from './link-feedback.js';
import {cardPower} from '../shop-engine.js';
export function escapeHTML(value){return String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}

export function renderForestHand(s,{artFor,ruleFor}={}){
 const locked=s.phase!=='battle'||Boolean(s.pendingEssence);
 return s.deck.hand.map((card,i)=>{
  const def=CARDS[card.type],link=previewCardLink(s.deck,card);
  const playable=!locked&&link.legal;
  const htmlName=escapeHTML(def.name),id=escapeHTML(card.id),rank=def.rank||'★';
  const rule=escapeHTML((ruleFor||cardRule)(card.type));
  const mark=SUIT_STYLES[def.suit].symbol;
  return '<button type="button" class="card '+def.suit+' '+(playable?'playable':'card-inactive')+
   (link.kind==='stack'&&playable?' is-stack':'')+
   '" data-card-id="'+id+'" data-school="'+def.suit+'" data-link-kind="'+link.kind+
   '" aria-disabled="'+(!playable)+'" aria-label="'+htmlName+', '+def.suit+' rank '+rank+
   '. '+rule+'. '+(playable?link.label:link.explanation)+
   '"><span class="card-top"><span class="card-rank">'+rank+'</span><span class="card-symbol">'+mark+'</span></span>'+
   '<span class="card-portrait">'+(artFor||cardArt)(card.type)+'</span>'+
   '<span class="card-name">'+htmlName+(card.level?' +'+card.level:'')+'</span>'+
   '<span class="card-effect">'+rule+'</span><span class="card-link">'+
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
