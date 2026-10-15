// The original Forest Edge sprite-sheet encounter, adapted to Siege combat.
// Visual only; combat resolution is owned exclusively by siege-engine.js.
export const SCHOOL_COLOR=Object.freeze({
 fang:'#e88570',shell:'#b7e6ee',bloom:'#bcdf83',venom:'#c8a7ee',hunger:'#f8cf81'
});
const INDEX=Object.freeze({
 Farmhand:0,Forager:1,Scout:1,Guard:3,Archer:2,
 Rogue:2,Mage:3,Watchman:4,
 // New Tier I roles reuse original *complete* proportional visitor frames.
 // Roles are distinguished with target chips and intent, not tiny new sprites.
 'Lantern Bearer':2,Herbalist:1,Poacher:3,Sapper:4
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
// The atlas has five side-by-side full-height frames (2,172 × 724 px).
// Render all visitors with ONE uniform scale. Keep their original proportions
// rather than squeezing a tall sprite into a guessed width/height.
export const VISITOR_COLUMNS=5;
export const VISITOR_HEIGHT=205;
export const VISITOR_GROUND_Y=342;
// Last opaque pixel rows measured from the actual shipped RGBA images:
// five 434.4×724 visitor frames, then the 2×2 768×512 Mimic frames.
// Different bottom transparency must not be treated as visual height.
export const VISITOR_FOOT_ROWS=Object.freeze([700,676,676,675,706]);
export const MIMIC_FOOT_ROWS=Object.freeze([512,512,488,478]);
const VISITOR_X_CENTERS=Object.freeze({
 1:[688],
 2:[636,787],
 3:[584,722,860]
});

// Stable lane-order formation: changing focus only changes the highlight,
// never the characters' positions. All enemy sprites use identical scale.
export function visitorFormation(enemies,sourceWidth,sourceHeight){
 const units=[...(enemies||[])].filter(e=>e.alive&&e.hp>0)
  .sort((a,b)=>a.lane-b.lane||String(a.id).localeCompare(String(b.id)));
 const n=units.length;
 if(!n)return [];
 const frameW=sourceWidth/VISITOR_COLUMNS,frameH=sourceHeight;
 const height=VISITOR_HEIGHT,width=VISITOR_HEIGHT*frameW/frameH;
 // Current Tier I raids have at most three active invaders.
 // If future raids add more, spread them evenly through the same region.
 const centers=VISITOR_X_CENTERS[n]||
  Array.from({length:n},(_,i)=>555+(330*i/Math.max(n-1,1)));
 return units.map((enemy,i)=>{
  const index=visitorSpriteIndex(enemy.name);
  const x=Math.round(centers[i]-width/2);
  const y=Math.round(VISITOR_GROUND_Y-VISITOR_FOOT_ROWS[index]/frameH*height);
  return {
   id:enemy.id,enemy,index,
   sx:index*frameW,sy:0,sw:frameW,sh:frameH,
   x,y,w:width,h:height,
   groundY:VISITOR_GROUND_Y,
   cx:centers[i]
  };
 });
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
 // Only the original battle protagonists belong on the canvas.
 // Allies and summons are represented in the command cards and status chips.
 for(const [key,path] of Object.entries({
  forest:'assets/forest.png',mimic:'assets/mimic.png',visitors:'assets/visitors.png'
 })){
  const img=new Image();img.src=path;images.set(key,img);
 }
 let state=null,pose=0,poseUntil=0,heroShake=0,foeShake=0,flash=null;
 let last=0,running=true,raf=0,viewRaid=0;
 const ready=key=>{const img=images.get(key);return img?.complete&&img.naturalWidth>0?img:null;};
 const sprite=(key,sx,sy,sw,sh,x,y,w,h)=>{
  const img=ready(key);if(img)ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
 };
 const paintText=(text,x,y,color,size=18)=>{
  ctx.textAlign='center';ctx.font='900 '+size+'px monospace';
  ctx.lineWidth=4;ctx.strokeStyle='#162a20';ctx.strokeText(text,x,y);
  ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.textAlign='start';
 };
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
  if(time>poseUntil)pose=0;
  // No offset fake ground shadow. Source art has its own lighting;
  // additional detached ovals made boots and claws look airborne.
  const hero=ready('mimic');
  const heroX=160+(!reducedMotion&&time<heroShake?Math.sin(time/22)*5:0);
  if(hero){
   const sw=hero.naturalWidth/2,sh=hero.naturalHeight/2;
   const heroHeight=187,frame=pose%4;
   // Place the actual claws on the same grounded baseline in each pose.
   const heroY=Math.round(VISITOR_GROUND_Y-MIMIC_FOOT_ROWS[frame]/512*heroHeight);
   sprite('mimic',frame%2*sw,Math.floor(frame/2)*sh,sw,sh,heroX,heroY,280,heroHeight);
  }
  const focus=featuredInvader(state),atlas=ready('visitors');
  const sourceWidth=atlas?.naturalWidth||2172,sourceHeight=atlas?.naturalHeight||724;
  const formation=visitorFormation(livingInvaders(state),sourceWidth,sourceHeight);
  drawBoxes.length=0;
  // Every enemy is the same physical size. No foreground vs background scale.
  // A subtle selection ring and a pointer distinguish the current target.
  for(const actor of formation){
   const selected=actor.id===focus?.id;
   const shake=selected&&!reducedMotion&&time<foeShake?Math.sin(time/18)*5:0;
   const x=actor.x+shake,y=actor.y,w=actor.w,h=actor.h;
   if(selected){
    // Thin focus ring hugs boots directly on the shared ground line.
    // Never render detached dark shadow ovals below the characters.
    ctx.strokeStyle='#ffdf8b';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(actor.cx,VISITOR_GROUND_Y+1,40,6,0,0,Math.PI*2);ctx.stroke();
   }
   if(atlas)sprite('visitors',actor.sx,actor.sy,actor.sw,actor.sh,x,y,w,h);
   // Do not display stretched colored blocks before the atlas finishes loading.
   drawBoxes.push({id:actor.id,x,y,w,h});
   if(selected){
    ctx.fillStyle='#ffde89';
    ctx.beginPath();
    ctx.moveTo(actor.cx-6,y-12);
    ctx.lineTo(actor.cx+6,y-12);
    ctx.lineTo(actor.cx,y-5);
    ctx.fill();
   }
   if(actor.enemy.poison>0)paintText('☣ '+actor.enemy.poison,actor.cx,y-18,'#d5a4e6',13);
   if(actor.enemy.web>0)paintText('⌘ '+actor.enemy.web,actor.cx,y-34,'#c2e5d9',12);
  }
  // Creature strategy lives in the card hand and defender status row.
  // Do not paint veteran or summoned monster sprites on this battlefield.
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
 }
 raf=requestAnimationFrame(draw);
 function triggerCard(step){
  const color=SCHOOL_COLOR[step.def.suit]||'#ffe1ac';
  pose=2;poseUntil=performance.now()+230;foeShake=performance.now()+170;
  flash={color,born:performance.now()};
 }
 function triggerHit(event){
  if(event.state==='damage'&&event.id.startsWith('e'))foeShake=performance.now()+145;
  else if(event.id==='king-mimic'&&event.state==='damage'){heroShake=performance.now()+210;pose=3;poseUntil=performance.now()+240;}
 }
 async function replay(steps,events,next,{onStep=()=>{},onFinish=()=>{}}={}){
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,reducedMotion?5:ms));
  for(let i=0;i<steps.length;i++){
   triggerCard(steps[i]);onStep(steps[i],i);
   await pause(255);
  }
  // Only real damage events produce a subtle reaction. Allied attacks should
  // not make the King Mimic perform unrelated "extra" attack poses.
  for(const ev of events.filter(e=>e.state==='damage').slice(0,12)){
   triggerHit(ev);await pause(95);
  }
  setState(next);onFinish();
 }
 function stop(){running=false;cancelAnimationFrame(raf);}
 return {setState,hitTarget,replay,triggerCard,stop};
}
