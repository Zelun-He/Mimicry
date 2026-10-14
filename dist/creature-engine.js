// Creature families for the existing First Siege. No new currencies or floors.
import {liveMinions,summonMinions} from './swarm-engine.js';

export const MAX_WEB=3;
export const CREATURES=Object.freeze({
 spider:Object.freeze({name:'Venom Spider',trait:'Webweaver',mechanic:'Webs reduce invader attack and spiders poison trapped prey.'}),
 'slime-bud':Object.freeze({name:'Slime Droplet',trait:'Mitosis',mechanic:'A surviving Slime can split into a Tiny Slime once per turn.'}),
 mimicling:Object.freeze({name:'Mimicling',trait:'False Treasure',mechanic:'Baby Mimics lure the strongest outside foe and feed Hunger by attacking.'})
});

export function webPrey(s,lane,amount=1){
 if(!Number.isInteger(lane)||lane<0||lane>2)return null;
 const enemy=s.enemies.find(e=>e.alive&&e.lane===lane);
 if(!enemy)return null;
 enemy.web=Math.min(MAX_WEB,Math.max(0,enemy.web||0)+Math.max(0,amount));
 return enemy;
}

export function webPenalty(enemy){
 return Math.min(6,Math.max(0,enemy.web||0)*2);
}

// A Web slows exactly one enemy retaliation before losing one stack.
export function consumeWeb(enemy){
 const spent=Math.min(MAX_WEB,Math.max(0,enemy.web||0));
 enemy.web=Math.max(0,spent-1);
 return Math.min(6,spent*2);
}

export function lurePrey(s,lane){
 if(!Number.isInteger(lane)||lane<0||lane>2||s.lastLureTurn===s.turn)return null;
 const outside=s.enemies.filter(e=>e.alive&&e.lane!==lane)
   .sort((a,b)=>b.attack-a.attack||b.hp-a.hp||a.id.localeCompare(b.id));
 const target=outside[0];
 if(!target)return null;
 target.lane=lane;
 s.lastLureTurn=s.turn;
 return target;
}

export function splitSlime(s,minion){
 if(!minion||minion.species!=='slime-bud'||!minion.alive||minion.hp<=0||
   minion.splitTurn===s.turn)return 0;
 const created=summonMinions(s,'slimelet',1,false,minion.lane);
 if(created)minion.splitTurn=s.turn;
 return created;
}

// Fusion is deliberate: the large Ooze never splits, and consuming its
// parents creates no Bone, gold, kill count, or chain activation.
export function fuseSlimes(s,lane){
 const parents=liveMinions(s,null,lane)
   .filter(m=>m.species==='slime-bud'||m.species==='slimelet').slice(0,2);
 if(parents.length<2)return null;
 parents.forEach(m=>{m.hp=0;m.alive=false;});
 const created=summonMinions(s,'slime-giant',1,false,lane);
 if(!created){
  parents.forEach(m=>{m.hp=1;m.alive=true;});
  return null;
 }
 s.minions=s.minions.filter(m=>m.alive);
 return {parents,giant:liveMinions(s,'slime-giant',lane).at(-1)};
}

export function mimiclingFeed(s,minion){
 if(minion?.species!=='mimicling'||!minion.alive||minion.fedTurn===s.turn)return 0;
 minion.fedTurn=s.turn;
 const before=s.hunger;
 s.hunger=Math.min(100,s.hunger+5);
 return s.hunger-before;
}

export function validCreatureState(s){
 if(!Number.isInteger(s.lastLureTurn)||s.lastLureTurn< -1||s.lastLureTurn>s.turn)return false;
 if(!Array.isArray(s.enemies))return false;
 return s.enemies.every(e=>e&&Number.isInteger(e.web)&&e.web>=0&&e.web<=MAX_WEB&&
    Number.isInteger(e.lane)&&e.lane>=0&&e.lane<=2);
}
