// Original, editable pixel-fantasy card illustrations for Forest Edge.
// Each card shares a premium engraved frame, but has its own deterministic motif.
// No external fonts, images, runtime fetching, or image generation dependencies.
import {CARDS} from '../chain-engine.js';

export const SUIT_STYLES=Object.freeze({
 fang:{name:'FANG',symbol:'◆',ink:'#e0a5a0',dark:'#512c31',middle:'#9e5155',light:'#f8c7a0'},
 shell:{name:'SHELL',symbol:'⬡',ink:'#9ecad7',dark:'#283a52',middle:'#54738b',light:'#d1f2de'},
 bloom:{name:'BLOOM',symbol:'✦',ink:'#a6ddb3',dark:'#25493c',middle:'#538d5c',light:'#e1eb94'},
 venom:{name:'VENOM',symbol:'◇',ink:'#ceafe0',dark:'#473252',middle:'#8563a6',light:'#a7e7bd'},
 hunger:{name:'HUNGER',symbol:'♛',ink:'#edc989',dark:'#493525',middle:'#98713a',light:'#ffe6a3'}
});

export const CARD_LORE=Object.freeze({
 strike:'A brave little cut.',blood:'Every wound tells a story.',
 ambush:'The trees know where to hide.',execute:'One decisive moment.',
 frenzy:'Let the whole forest hear.',fortify:'Hold the line.',
 guard:'A shield made from memories.',thorns:'Even roots can wound.',
 counter:'The forest strikes back.',mend:'Little things mend slowly.',
 roots:'Give them time to stumble.',regrow:'What dies may yet bloom.',
 symbiosis:'The colony shares its strength.',bite:'A small dose of trouble.',
 corrode:'Nothing survives the slow drip.',contagion:'One bite becomes many.',
 detonate:'Now watch it bloom.',decree:'The King is hungry.',
 feast:'The chest opens. They vanish.',sacrifice:'Pay in blood, collect in fear.',
 tithe:'Even armor has a price.',harvest:'Rot feeds the garden.',
 mirror:'Twice the teeth, half the mercy.',
 'goblin-recruit':'One goblin is a nuisance. Three are a problem.',
 'skeleton-recruit':'Bones refuse to rest.',
 'pack-attack':'The gang knows its signal.',
 'loot-fallen':'Finders keepers.',
 'bone-march':'March until you fall apart.',
 'bone-wall':'A wall from fallen friends.',
 'rattle-dead':'The grave still owes us.',
 'spider-summon':'A careful step is everything.',
 'silken-prison':'Every thread has a purpose.',
 'slime-summon':'Please do not step on it.',
 'gel-fusion':'Two become something worse.',
 'mimicling-summon':'An innocent-looking treasure.',
 'family-dinner':'Dinner is a family matter.'
});

const starterText={
 strike:'Deal 4 damage to the focused adventurer.',
 blood:'Deal 5 damage. Build a Fang chain.',
 ambush:'Deal 7 damage. Links amplify the strike.',
 execute:'Deal 7 damage, plus 8 if the enemy is at half health.',
 frenzy:'Give surviving defenders additional attack this turn.',
 fortify:'Grant 7 armor to the weakest defender.',
 guard:'Grant 9 armor to a defender.',
 thorns:'Gain armor and strike back with half of it.',
 counter:'Deal damage based on the defender’s current armor.',
 mend:'Restore 7 HP to the most injured defender.',
 roots:'Weaken the focused adventurer.',
 regrow:'Restore 10 HP to the most injured defender.',
 symbiosis:'Heal all living defenders.',
 bite:'Inflict 3 poison stacks on the target.',
 corrode:'Strip enemy armor and inflict poison.',
 contagion:'Spread poison from the focused enemy to others.',
 detonate:'Detonate enemy poison for a burst of damage.',
 decree:'Spend 30 Hunger to rally your defenders.',
 feast:'Spend 40 Hunger for a powerful bite.'
};
export function cardRule(type){
 const card=CARDS[type];
 if(!card)return '';
 return card.description||starterText[type]||'Play this command in your chain.';
}

const R=(x,y,w,h,c,o=1)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"'+(o!==1?' opacity="'+o+'"':'')+'/>';
const P=(d,fill,stroke='',width=1)=>'<path d="'+d+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="miter"':'')+'/>';
const ellipse=(cx,cy,rx,ry,fill,opacity=1)=>'<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" opacity="'+opacity+'"/>';
const group=(tx,ty,body,scale=1)=>'<g transform="translate('+tx+' '+ty+') scale('+scale+')">'+body+'</g>';

function sword(a){
 return '<g transform="rotate(-24 0 0)">'+
  P('M-7 7L-7 -42L0 -58L7 -42L7 7Z',a.light,a.dark,2)+
  R(-3,-44,6,38,'#fff3dd',.55)+R(-19,3,38,9,a.middle)+
  R(-5,9,10,22,a.dark)+R(-8,30,16,8,a.ink)+'</g>';
}
function shield(a){
 return P('M0 -53L42 -35L38 16Q30 45 0 57Q-30 45 -38 16L-42 -35Z',a.dark,a.ink,4)+
 P('M0 -41L31 -28L28 14Q22 34 0 45Q-22 34 -28 14L-31 -28Z',a.middle)+
 R(-4,-39,8,76,a.ink,.7)+R(-26,-3,52,7,a.ink,.6);
}
function thorn(a){
 let str=shield(a);
 for(const [x,y,flip] of [[-30,-13,-1],[30,-13,1],[-24,18,-1],[24,18,1]])
  str+=P('M'+x+' '+y+'l'+(flip*19)+' -10l'+(-flip*7)+' 23Z',a.light,a.dark,2);
 return str;
}
function bloom(a){
 let str=R(-4,-5,8,55,'#4e895c');
 for(let i=0;i<7;i++){
  const t=i*Math.PI*2/7,x=Math.round(Math.cos(t)*30),y=Math.round(Math.sin(t)*27-16);
  str+=ellipse(x,y,16,13,i%2?a.light:a.ink,.93);
 }
 return str+ellipse(0,-16,17,16,'#ffd883')+
 R(-9,18,17,6,a.middle)+P('M-5 28Q-40 0 -40 30Q-17 34 -5 38Z','#70b783');
}
function vines(a){
 let str=P('M-41 44Q-5 20 -18 -12Q-38 -36 -7 -48','none',a.ink,8);
 str+=P('M-7 36Q17 22 15 -8Q11 -35 42 -44','none',a.light,7);
 for(const [x,y,r] of [[-15,-13,-30],[6,3,23],[23,-22,42]]){
  str+=P('M'+x+' '+y+'q'+r+' -30 '+Math.round(r*.9)+' 4q-'+Math.round(r*.7)+' 12 -'+Math.round(r*.9)+' -4Z',a.middle);
 }
 return str;
}
function skull(a){
 return ellipse(0,-16,34,31,'#efe4c7')+R(-25,2,50,20,'#eee4cc')+
  R(-27,-17,16,14,a.dark)+R(11,-17,16,14,a.dark)+
  P('M0 -2l-7 9h14Z',a.dark)+
  R(-20,19,8,10,a.dark)+R(-5,19,9,10,a.dark)+R(12,19,8,10,a.dark);
}
function goblin(a){
 return P('M-24 -40L-44 -20L-32 1L-28 31L30 31L32 -3L43 -20L27 -41L16 -30L-14 -30Z','#72ab5f',a.dark,2)+
 R(-26,-7,52,27,'#4d813f')+
 R(-20,-9,13,10,'#edc59b')+R(7,-9,13,10,'#edc59b')+
 R(-13,-7,8,7,a.dark)+R(9,-7,8,7,a.dark)+
 P('M-12 21L1 29L16 21Z','#e1d3a5')+
 R(-26,31,52,15,a.dark)+R(-15,31,30,7,a.middle);
}
function spider(a){
 let str=ellipse(0,8,30,27,a.dark)+ellipse(0,-23,22,20,a.middle);
 for(const side of [-1,1])for(const h of [-26,-5,17]){
  str+=P('M'+(side*17)+' '+h+'L'+(side*50)+' '+(h-18)+'L'+(side*55)+' '+(h+3),'none',a.ink,6);
 }
 return str+R(-12,-31,8,8,'#efda77')+R(5,-31,8,8,'#efda77')+R(-8,20,17,8,a.light);
}
function slime(a){
 return P('M-42 39Q-47 -20 -17 -35Q12 -56 34 -19Q49 0 42 39Z',a.middle,a.ink,5)+
 ellipse(-10,-3,8,11,a.dark)+ellipse(17,-3,8,11,a.dark)+
 R(-11,22,27,6,a.dark)+ellipse(-22,-29,11,7,a.light,.9);
}
function chest(a){
 return R(-45,-28,90,66,a.dark)+R(-41,-24,82,45,'#9c6738')+
 R(-44,-45,88,26,'#c9954e')+R(-34,-39,68,10,a.light)+
 R(-36,17,72,13,'#5b2e28')+R(-30,23,9,9,'#fff1d6')+
 R(-10,23,9,9,'#fff1d6')+R(10,23,9,9,'#fff1d6')+
 R(29,23,8,9,'#fff1d6')+
 R(-7,-26,14,31,a.ink)+R(-4,-15,8,8,'#281a19');
}
function vial(a){
 return R(-10,-44,20,17,'#f1ddba')+R(-16,-52,32,8,'#b89f88')+
 P('M-18 -29L-38 15Q-48 37 -25 45L25 45Q49 35 37 14L18 -29Z',a.middle,a.light,3)+
 P('M-30 19L28 19L35 32Q28 40 14 40L-14 40Q-30 38 -30 19Z','#a5d77e')+
 ellipse(-12,24,5,4,'#e7f6b2')+ellipse(9,29,4,5,'#e7f6b2');
}
function coins(a){
 let out='';
 for(const [x,y] of [[-26,18],[2,29],[26,6],[-5,-10]]){
  out+=ellipse(x,y,22,13,a.light)+ellipse(x,y-5,22,10,a.ink)+ellipse(x,y-5,14,5,'#ead08b');
 }
 return out;
}
function crown(a){
 return P('M-43 -22L-40 34L40 34L43 -22L23 2L0 -45L-23 2Z',a.light,a.dark,4)+
 R(-42,29,84,14,a.middle)+R(-26,8,10,11,'#fff4c9')+R(-5,-9,10,11,'#fff4c9')+R(16,8,10,11,'#fff4c9');
}
function mirror(a){
 return ellipse(0,-3,38,49,a.middle)+ellipse(0,-3,29,39,'#93a2b2')+
 P('M-15 -28L-2 -23L-28 14Z','#e0eef7')+
 R(-6,45,12,17,a.ink)+R(-24,57,48,7,a.light);
}
function web(a){
 let str=ellipse(0,0,47,47,'none',1);
 for(const d of ['M0 -48V48','M-48 0H48','M-34 -34L34 34','M34 -34L-34 34']){
  str+=P(d,'none',a.ink,3);
 }
 for(const r of [14,29,43])str+=ellipse(0,0,r,r,'none',.5).replace('/>',' stroke="'+a.light+'" stroke-width="2"/>');
 return str+ellipse(0,0,7,7,a.light);
}
function glyph(type,def,a){
 if(def.tribe==='goblin')return type==='loot-fallen'?coins(a):type==='pack-attack'?group(-19,0,goblin(a),.7)+group(29,10,goblin(a),.55):goblin(a);
 if(def.tribe==='skeleton')return type==='bone-wall'?shield(a)+group(-28,0,skull(a),.34):type==='rattle-dead'?group(-20,10,skull(a),.75)+group(30,22,skull(a),.5):skull(a);
 if(def.tribe==='spider')return type==='silken-prison'?web(a)+group(6,12,spider(a),.45):spider(a);
 if(def.tribe==='slime-bud')return type==='gel-fusion'?group(-23,16,slime(a),.7)+group(24,6,slime(a),.73):slime(a);
 if(def.tribe==='mimicling')return type==='family-dinner'?group(-27,15,chest(a),.68)+group(25,7,chest(a),.7):chest(a);
 if(type==='mirror')return mirror(a);
 if(type==='tithe')return shield(a)+group(24,32,coins(a),.38);
 if(type==='harvest')return bloom(a)+group(25,23,vial(a),.48);
 if(type==='sacrifice')return sword(a)+group(28,18,vial(a),.44);
 if(type==='decree')return crown(a);
 if(type==='feast')return chest(a);
 switch(def.kind){
  case 'strike':case 'execute':case 'frenzy':return type==='frenzy'?group(-21,6,sword(a),.75)+group(28,4,sword(a),.75):sword(a);
  case 'armor':return shield(a);
  case 'thorns':case 'counter':return thorn(a);
  case 'heal':case 'teamheal':return bloom(a);
  case 'weaken':return vines(a);
  case 'poison':case 'corrode':return vial(a);
  case 'spread':return group(-20,5,vial(a),.65)+group(28,6,vial(a),.66);
  case 'detonate':return vial(a)+P('M-28 -30L-49 -47L-37 -22Z M33 12L52 19L29 23Z',a.light);
  default:return crown(a);
 }
}
export function cardArt(type){
 const def=CARDS[type];if(!def)return '';
 const a=SUIT_STYLES[def.suit];
 const index=Object.keys(CARDS).indexOf(type);
 const shade=index%4*5;
 let texture='';
 for(let i=0;i<13;i++){
  const x=(i*43+index*17)%194,y=(i*29+index*11)%115;
  texture+=R(x,y,(i%3+1)*5,(i%2+1)*4,i%2?a.light:a.ink,.2);
 }
 const corner=R(8,9,22,3,a.ink,.75)+R(8,9,3,22,a.ink,.75)+
 R(170,9,22,3,a.ink,.75)+R(189,9,3,22,a.ink,.75)+
 R(8,115,22,3,a.ink,.75)+R(8,93,3,25,a.ink,.75)+
 R(170,115,22,3,a.ink,.75)+R(189,93,3,25,a.ink,.75);
 const forest=R(0,0,200,126,a.dark)+
 '<path d="M0 88L25 65L39 77L58 49L81 73L99 36L138 77L158 54L181 79L200 65V126H0Z" fill="'+a.middle+'" opacity=".58"/>'+
 R(0,96,200,30,'#172824',.57)+
 R(21,33,8,77,'#172824',.43)+R(164,18,11,95,'#172824',.43)+
 P('M3 35L27 3L54 43Z',a.middle)+P('M140 19L170 -5L198 23Z',a.middle);
 const stars=[0,1,2,3,4,5].map((i)=>R((19+i*37+index*7)%184+5,(i*17+index*5)%74+7,3,3,a.light,.48)).join('');
 return '<svg class="card-art" viewBox="0 0 200 126" role="img" aria-label="Illustration of '+def.name+'" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">'+
 '<rect width="200" height="126" fill="'+a.dark+'"/>'+forest+texture+stars+
 ellipse(100,69,57,49,a.light,.07)+ellipse(100,73,47,42,a.ink,.12)+
 '<g class="art-figure">'+group(100,68,glyph(type,def,a),.91)+'</g>'+
 R(5,5,190,116,'none')+corner+
 '<rect x="3" y="3" width="194" height="120" fill="none" stroke="'+a.ink+'" stroke-width="2"/>'+
 '</svg>';
}
