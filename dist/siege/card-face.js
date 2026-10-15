// One shared visual anatomy for the hand and Quartermaster showcase.
// The markup is descriptive only. No card effects, cost or link legality live here.
import {CARDS} from '../chain-engine.js';
import {SUIT_STYLES} from './card-art.js';
import {creatureCardArt,creatureCardIdentity} from './creature-card-art.js';
import {cardVisualIdentity,cardFullRules,cardFlavor} from './card-presentation.js';

export function escapeCardHTML(value){
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
export function cardFaceClass(type){
 const view=cardVisualIdentity(type);
 if(!view)return '';
 const family=creatureCardIdentity(type);
 const kind=CARDS[type].kind;
 const category=kind==='summon'?'summon':
  ['strike','execute','sacrifice'].includes(kind)?'attack':
  ['armor','thorns','counter','bonewall'].includes(kind)?'defense':
  ['heal','teamheal','harvest'].includes(kind)?'recovery':
  ['detonate','feast','mirror'].includes(kind)?'finisher':
  ['pack','march','fuse','family','loot'].includes(kind)?'engine':'utility';
 return ['premium-card','card-'+category,'role-'+view.roleClass,'rarity-'+view.rarity,
   family?'tribe-card tribe-'+family.key:''].filter(Boolean).join(' ');
}
export function renderCardFace(type,{artFor=creatureCardArt,level=0,linkText='',ready=false,mode='hand'}={}){
 const card=CARDS[type],view=cardVisualIdentity(type);
 if(!card||!view)return '';
 const style=SUIT_STYLES[view.school],family=creatureCardIdentity(type);
 const role=escapeCardHTML(view.role),name=escapeCardHTML(card.name);
 const illustration=artFor(type);
 const school=escapeCardHTML(style.name);
 const rarity=view.rarity==='common'?'':view.rarity.toUpperCase();
 const rank=view.rank==='★'?'★':String(view.rank);
 const cost=view.cost?'<span class="card-resource">◆ '+view.cost+' HUNGER</span>':'';
 const keywords=view.keywords.map(keyword=>'<span class="card-keyword">'+escapeCardHTML(keyword)+'</span>').join('');
 const cue=linkText?'<span class="card-link-status">'+escapeCardHTML(linkText)+'</span>':'';
 const familyName=family?family.name:style.name;
 return '<span class="card-top">'+
   '<span class="card-rank" title="Chain rank, not a cost">'+rank+'<small>'+ (rank==='★'?'WILD':'LINK')+'</small></span>'+
   '<span class="card-top-right">'+
    (rarity?'<span class="card-rarity">'+rarity+'</span>':'')+
    '<span class="card-symbol" aria-label="'+school+' school">'+style.symbol+'<small>'+school+'</small></span>'+
   '</span></span>'+
  '<span class="card-identity"><span class="card-type">'+escapeCardHTML(familyName)+' · '+role+'</span>'+
   '<span class="card-name">'+name+(level?' +'+level:'')+'</span></span>'+
  '<span class="card-portrait">'+illustration+cost+
   (ready?'<span class="card-ready-marker">COMBO READY</span>':'')+'</span>'+
  '<span class="card-effect"><strong class="card-effect-primary">'+escapeCardHTML(view.main)+'</strong>'+
   '<span class="card-effect-secondary">'+escapeCardHTML(view.detail)+'</span></span>'+
  '<span class="card-keywords">'+keywords+'</span>'+
  '<span class="card-link"><span class="card-role">'+role+'</span>'+cue+'</span>';
}
export function renderShopCardPreview(type,{artFor=creatureCardArt}={}){
 const card=CARDS[type];
 if(!card)return '';
 const cls=cardFaceClass(type);
 return '<div class="card '+cls+' shop-card-face" data-preview-type="'+escapeCardHTML(type)+'"'+
  ' role="group" aria-label="Card preview: '+escapeCardHTML(card.name)+
  '. '+escapeCardHTML(cardFullRules(type))+'">'+
  renderCardFace(type,{artFor,mode:'shop'})+'</div>';
}
export function cardInspectorText(type,{link='',state=null}={}){
 const view=cardVisualIdentity(type);
 if(!view)return '';
 const cost=view.cost?' · '+view.cost+' Hunger':'';
 return [CARDS[type].name+' · '+view.role+' · '+view.school.toUpperCase()+ ' '+view.rank+cost,
  view.main+' '+view.detail,link,cardFlavor(type)].filter(Boolean).join(' — ');
}
