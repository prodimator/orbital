import {proximityRate} from './scoring.js';
export const LIMIT = 900;
export const DT = 1 / 120;
export const THRUST = 68;
export const TURN = 2.8;
// Gameplay attraction is independent of the prescribed planetary orbit speeds.
export const GRAVITY_STRENGTH = 2;
export const STAR_RADIUS_MIN = 40;
export const STAR_RADIUS_MAX = 70;
const colors = [0x6fe0cb, 0xc19df5, 0xe6ad78, 0x78b8f2];
function orbit(b, t) {
  if (!b.orbit) return;
  const a = b.phase + b.omega * t;
  b.x = Math.cos(a) * b.orbit; b.y = Math.sin(a) * b.orbit;
}
export function createRun(random = Math.random) {
  const bodies = [{name:'HELIOS',x:0,y:0,r:40,mu:180000*GRAVITY_STRENGTH,color:0xffc674}];
  const count = 2 + Math.floor(random() * 3);
  for (let i=0;i<count;i++) {
    const r = 15 + random()*14, distance = 175 + i*145;
    const b = {name:['VERDANT','VESPER','EMBER','BOREAL'][i],r,mu:r*r*15*GRAVITY_STRENGTH,color:colors[i],orbit:distance,phase:random()*Math.PI*2,omega:Math.sqrt(180000/distance**3)};
    orbit(b,0); bodies.push(b);
  }
  const home = bodies[1+Math.floor(random()*count)];
  const starRadius=STAR_RADIUS_MIN+random()*(STAR_RADIUS_MAX-STAR_RADIUS_MIN);
  // Keep the existing planet/launch distribution; vary stellar attraction independently.
  bodies[0].r=starRadius;
  bodies[0].mu*= (starRadius/40)**2;
  const angle = Math.atan2(home.y,home.x);
  const ship = {x:home.x+Math.cos(angle)*(home.r+13),y:home.y+Math.sin(angle)*(home.r+13),vx:-home.y*home.omega+Math.cos(angle)*18,vy:home.x*home.omega+Math.sin(angle)*18,angle,r:3.5};
  return {bodies,ship,home:home.name,time:0,flyingPoints:0,score:0,alive:true,reason:'',accumulator:0};
}
export function gravity(ship,bodies) {
  let x=0,y=0;
  for(const b of bodies){const dx=b.x-ship.x,dy=b.y-ship.y,d2=Math.max(dx*dx+dy*dy,16),f=b.mu/(d2*Math.sqrt(d2));x+=dx*f;y+=dy*f;}
  return {x,y};
}
export function sweptHit(a,b,r) {
  const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;
  const t=d?Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/d)):0;
  return (a.x+t*dx)**2+(a.y+t*dy)**2<=r*r;
}
export function step(s,input,dt=DT) {
  if(!s.alive)return;
  const p=s.ship,old={x:p.x,y:p.y},previous=s.bodies.map(b=>({x:b.x,y:b.y}));
  p.angle+=((input.left?1:0)-(input.right?1:0))*TURN*dt;
  const g=gravity(p,s.bodies);
  p.vx+=(g.x+(input.up?Math.cos(p.angle)*THRUST:0))*dt;
  p.vy+=(g.y+(input.up?Math.sin(p.angle)*THRUST:0))*dt;
  p.x+=p.vx*dt;p.y+=p.vy*dt;s.time+=dt;
  s.bodies.forEach((b,i)=>{orbit(b,s.time);if(sweptHit({x:old.x-previous[i].x,y:old.y-previous[i].y},{x:p.x-b.x,y:p.y-b.y},p.r+b.r)){s.alive=false;s.reason=`Impact with ${b.name}`;}});
  if(Math.hypot(p.x,p.y)>LIMIT){s.alive=false;s.reason='Lost beyond the flight perimeter';}
  // A fatal step earns its elapsed time, but no close-pass bonus for impact.
  if(s.alive)s.flyingPoints+=proximityRate(p,s.bodies)*dt;
  s.score=s.time+s.flyingPoints;
}
export function advance(s,input,elapsed){
  s.accumulator+=Math.min(elapsed,.1);
  while(s.accumulator+1e-12>=DT){step(s,input);s.accumulator-=DT;}
}
