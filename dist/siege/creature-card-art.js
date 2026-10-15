// Tier I creature portraits, taken from the original user-created sprite board.
// The card hand is the home for monster art; the forest remains Mimic vs invader.
// Pure presentation: no combat, deck, save or random effects.
import {CARDS} from '../chain-engine.js';
import {cardArt} from './card-art.js';

export const CREATURE_FAMILIES=Object.freeze({
 goblin:Object.freeze({key:'goblin',name:'GOBLIN',group:'RAIDERS',atlasIndex:0}),
 skeleton:Object.freeze({key:'skeleton',name:'SKELETON',group:'UNDEAD',atlasIndex:1}),
 'slime-bud':Object.freeze({key:'slime',name:'SLIME',group:'OOZES',atlasIndex:2}),
 sporeling:Object.freeze({key:'sporeling',name:'SPORELING',group:'NATURE',atlasIndex:3}),
 'king-mimic':Object.freeze({key:'king-mimic',name:'KING MIMIC',group:'ROYAL',atlasIndex:4}),
 spider:Object.freeze({key:'spider',name:'SPIDER',group:'BEASTS',image:'exotic-spider.svg'}),
 mimicling:Object.freeze({key:'mimicling',name:'MIMICLING',group:'ROYAL',image:'exotic-mimicling.svg'})
});

// Current action cards that actually depict one of the established creatures.
// Ordinary commands keep their unique illustrated suit art.
const CHARACTER_COMMANDS=Object.freeze({
 harvest:'sporeling',
 symbiosis:'sporeling',
 tithe:'skeleton',
 decree:'king-mimic',
 feast:'king-mimic',
 mirror:'king-mimic'
});

export function creatureCardIdentity(type){
 const def=CARDS[type];
 if(!def)return null;
 const family=def.tribe||CHARACTER_COMMANDS[type];
 return family&&Object.hasOwn(CREATURE_FAMILIES,family)?CREATURE_FAMILIES[family]:null;
}

export function creatureCardArt(type){
 const card=CARDS[type],family=creatureCardIdentity(type);
 if(!card||!family)return cardArt(type);
 const picture=family.image?
  '<img class="creature-art__illustration" src="./siege/'+family.image+'" alt="" loading="lazy" decoding="async">':
  '<span class="creature-art__sprite creature-art__sprite--'+family.key+'" aria-hidden="true"></span>';
 return '<span class="creature-art creature-art--'+family.key+'" role="img" aria-label="'+
  card.name+' — '+family.name+' portrait">'+
  '<span class="creature-art__texture" aria-hidden="true"></span>'+
  '<span class="creature-art__focus" aria-hidden="true">'+picture+'</span>'+
  '<span class="creature-art__family" aria-hidden="true">'+family.name+'</span>'+
  '<span class="creature-art__glimmer" aria-hidden="true"></span></span>';
}
