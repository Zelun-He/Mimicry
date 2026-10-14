// The original Forest Edge sprite-sheet encounter, adapted to Siege combat.
// Visual only; combat resolution is owned exclusively by siege-engine.js.
export const SCHOOL_COLOR=Object.freeze({
 fang:'#e88570',shell:'#b7e6ee',bloom:'#bcdf83',venom:'#c8a7ee',hunger:'#f8cf81'
});
const INDEX=Object.freeze({
 Farmhand:0,Forager:1,Scout:1,Guard:3,Archer:2,
 Rogue:2,Mage:3,Watchman:4
});
export function visitorSpriteIndex(name,raid=0){
 return INDEX[name]??Math.min(4,Math.max(0,raid));
}
export function livingInvaders(s){return (s?.enemies||[]).filter(e=>e.alive&&e.hp>0);}
export function featuredInvader(s){
 const foes=livingInvaders(s);
 return foes.find(e=>e.id===s.chainTargetId)||
  [...foes].sort((a,b)=>a.hp-b.hp)[0]||null;
}
export function damageSummary(previous,current){
 const byId=new Map((current?.enemies||[]).map(e=>[e.id,e]));
 return (previous?.enemies||[]).map(e=>({
   id:e.id,name:e.name,damage:Math.max(0,e.hp-(byId.get(e.id)?.hp??e.hp))
 })).filter(e=>e.damage>0);
}
export function createForestBattle(canvas,{reducedMotion=false}={}){
 const ctx=canvas.getContext('2d');
 if(!ctx)return {setState(){},setCaption(){},async replay(){},hitTarget(){return null;},stop(){}};
 ctx.imageSmoothingEnabled=false;
 const images=new Map(),drawBoxes=[];
 for(const [key,path] of Object.entries({
  forest:'assets/forest.png',mimic:'assets/mimic.png',visitors:'assets/visitors.png',
  goblin:'siege/sprites/goblin.png',slime:'siege/sprites/slime.png',
  skeleton:'siege/sprites/skeleton.png',sporeling:'siege/sprites/sporeling.png'
 })){
  const img=new Image();img.src=path;images.set(key,img);
 }
 let state=null,pose=0,poseUntil=0,heroShake=0,foeShake=0,flash=null;
 let last=0,running=true,raf=0,viewRaid=0;
 const particles=[];
 const ready=key=>{const img=images.get(key);return img?.complete&&img.naturalWidth>0?img:null;};
 const sprite=(key,sx,sy,sw,sh,x,y,w,h)=>{
  const img=ready(key);if(img)ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
 };
 const paintText=(text,x,y,color,size=18)=>{
  ctx.textAlign='center';ctx.font='900 '+size+'px monospace';
  ctx.lineWidth=4;ctx.strokeStyle='#162a20';ctx.strokeText(text,x,y);
  ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.textAlign='start';
 };
 function particle(text,color,x=650,y=220){
  particles.push({text,color,x,y,born:performance.now()});
 }
 function setState(s){state=s;viewRaid=s?.raid||0;}
 function hitTarget(x,y){
  const box=drawBoxes.findLast(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
  return box?.id||null;
 }
 function draw(time){
  if(!running)return;
  raf=requestAnimationFrame(draw);
  if(time-last<33||document.hidden)return;
  last=time;
  ctx.fillStyle='#72945e';ctx.fillRect(0,0,960,420);
  const bg=ready('forest');
  if(bg){
   const sourceHeight=bg.naturalWidth*420/960;
   ctx.drawImage(bg,0,120,bg.naturalWidth,Math.min(sourceHeight,bg.naturalHeight-120),0,0,960,420);
  }
  // A single familiar Forest Edge background; dusk creeps in as the raids escalate.
  const twilight=[0,.025,.075,.13,.20][Math.min(viewRaid,4)];
  if(twilight){ctx.fillStyle='rgba(23,40,58,'+twilight+')';ctx.fillRect(0,0,960,420);}
  const bob=reducedMotion?0:Math.sin(time/640)*2.2;
  if(time>poseUntil)pose=0;
  ctx.fillStyle='#1f402a4f';
  ctx.beginPath();ctx.ellipse(301,321,73,11,0,0,Math.PI*2);ctx.fill();
  const hero=ready('mimic');
  const heroX=160+(!reducedMotion&&time<heroShake?Math.sin(time/22)*5:0);
  if(hero){
   const sw=hero.naturalWidth/2,sh=hero.naturalHeight/2;
   sprite('mimic',pose%2*sw,Math.floor(pose/2)*sh,sw,sh,heroX,145+bob,280,187);
  }else{ctx.fillStyle='#745744';ctx.fillRect(225,215,150,91);}
  const enemies=livingInvaders(state),focus=featuredInvader(state);
  drawBoxes.length=0;
  const rest=enemies.filter(e=>e!==focus);
  // Prioritize the selected foe at full size, with smaller companions behind.
  rest.forEach((e,i)=>{
   const x=777+i*77,y=190+i*18,w=86,h=131;
   const atlas=ready('visitors');
   if(atlas){const sw=atlas.naturalWidth/5;sprite('visitors',visitorSpriteIndex(e.name,viewRaid)*sw,0,sw,atlas.naturalHeight,x,y+bob,w,h);}
   else{ctx.fillStyle='#ba997c';ctx.fillRect(x+30,y+40,30,70);}
   drawBoxes.push({id:e.id,x,y,w,h});
   if(e.poison>0)paintText('☣',x+w/2,y+2,'#e3a5ec',15);
  });
  if(focus){
   const x=608,y=137,w=136,h=197,atlas=ready('visitors');
   const fx=!reducedMotion&&time<foeShake?Math.sin(time/18)*5:0;
   ctx.fillStyle='#2b382853';ctx.beginPath();ctx.ellipse(x+69,326,45,9,0,0,Math.PI*2);ctx.fill();
   if(atlas){const sw=atlas.naturalWidth/5;sprite('visitors',visitorSpriteIndex(focus.name,viewRaid)*sw,0,sw,atlas.naturalHeight,x+fx,y+bob,w,h);}
   else{ctx.fillStyle='#c3a085';ctx.fillRect(x+48,y+65,36,95);}
   drawBoxes.push({id:focus.id,x,y,w,h});
   ctx.fillStyle='#ffdf8b';ctx.fillRect(x+30,343,76,2);
   if(focus.poison>0)paintText('☣ '+focus.poison,x+70,y-15,'#d5a4e6',15);
   if(focus.web>0)paintText('⌘ '+focus.web,x+70,y-30,'#c2e5d9',12);
  }
  // Show veteran monster sprites in the same pixel-art plane, without crowding
  // the focal King Mimic vs visitor composition.
  const allies=(state?.units||[]).filter(u=>u.alive);
  allies.slice(0,4).forEach((u,i)=>{
   const img=ready(u.species),x=325+i*54,y=292+((i%2)*8);
   if(img){sprite(u.species,0,0,64,64,x,y,55,55);}
   else{ctx.fillStyle='#557249';ctx.fillRect(x+12,y+15,26,28);}
  });
  const minions=(state?.minions||[]).filter(u=>u.alive);
  if(minions.length){
   const types=[...new Set(minions.map(m=>m.species))].slice(0,3);
   types.forEach((species,i)=>{
    const img=ready(species==='slime-bud'||species==='slimelet'||species==='slime-giant'?'slime':species);
    const x=350+i*54,y=350;
    if(img)ctx.drawImage(img,0,0,64,64,x,y,43,43);
    else{ctx.fillStyle='#77a77a';ctx.beginPath();ctx.arc(x+22,y+22,17,0,7);ctx.fill();}
   });
   paintText('×'+minions.length,517,382,'#f2dd9d',13);
  }
  if(flash&&time-flash.born<380){
   const age=(time-flash.born)/380;
   ctx.strokeStyle=flash.color;ctx.lineWidth=7*(1-age);
   ctx.globalAlpha=1-age;
   ctx.beginPath();ctx.moveTo(510,168+age*42);ctx.lineTo(704,282-age*45);ctx.stroke();
   ctx.globalAlpha=1;
  }
  if(!reducedMotion)for(let i=0;i<7;i++){
   ctx.fillStyle='#e6f0b6';ctx.globalAlpha=.18+Math.sin(time/530+i)*.14;
   ctx.fillRect((time/46+i*157)%960,170+i*26%190,2,2);
  }
  ctx.globalAlpha=1;
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i],age=time-p.born;
   if(age>1000){particles.splice(i,1);continue;}
   ctx.globalAlpha=1-age/1000;
   paintText(p.text,p.x,p.y-age/25,p.color,16);
  }
  ctx.globalAlpha=1;
 }
 raf=requestAnimationFrame(draw);
 function triggerCard(step){
  const color=SCHOOL_COLOR[step.def.suit]||'#ffe1ac';
  pose=2;poseUntil=performance.now()+230;foeShake=performance.now()+170;
  flash={color,born:performance.now()};
  particle(step.def.name.toUpperCase(),color);
 }
 function triggerHit(event){
  if(event.state==='damage'&&event.id.startsWith('e')){foeShake=performance.now()+145;particle('HIT','#fff1c0');}
  else if(event.id==='king-mimic'&&event.state==='damage'){heroShake=performance.now()+210;pose=3;poseUntil=performance.now()+240;}
  else if(event.state==='attack'){pose=1;poseUntil=performance.now()+160;}
 }
 async function replay(steps,events,next,{onStep=()=>{},onFinish=()=>{}}={}){
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,reducedMotion?5:ms));
  for(let i=0;i<steps.length;i++){
   triggerCard(steps[i]);onStep(steps[i],i);
   await pause(255);
  }
  for(const ev of events.filter(e=>e.state==='attack'||e.state==='damage').slice(0,12)){
   triggerHit(ev);await pause(105);
  }
  setState(next);onFinish();
 }
 function stop(){running=false;cancelAnimationFrame(raf);}
 return {setState,hitTarget,replay,triggerCard,particle,stop};
}
