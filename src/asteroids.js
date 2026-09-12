// State-owned randomness keeps fixed-step replays and cloned simulations deterministic.
function random(s){s.asteroidSeed=(Math.imul(s.asteroidSeed,1664525)+1013904223)>>>0;return s.asteroidSeed/4294967296;}
export function spawnAsteroid(s){
 const angle=random(s)*Math.PI*2,offset=(random(s)-.5)*.95,speed=65+random(s)*95;
 const heading=angle+Math.PI+offset;
 return {id:s.asteroidId++,x:Math.cos(angle)*980,y:Math.sin(angle)*980,vx:Math.cos(heading)*speed,vy:Math.sin(heading)*speed,r:5+random(s)*6,age:0};
}
export function updateAsteroids(s,dt,oldShip,oldBodies,gravity,sweptHit){
 s.nextAsteroid-=dt;
 if(s.nextAsteroid<=0){if(s.asteroids.length<18)s.asteroids.push(spawnAsteroid(s));s.nextAsteroid=3+random(s)*4;}
 s.asteroids=s.asteroids.filter(a=>{
   const old={x:a.x,y:a.y},g=gravity(a,s.bodies);
   a.oldX=old.x;a.oldY=old.y;
   a.vx+=g.x*dt;a.vy+=g.y*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.age+=dt;
   const impact=s.bodies.some((b,i)=>sweptHit({x:old.x-oldBodies[i].x,y:old.y-oldBodies[i].y},{x:a.x-b.x,y:a.y-b.y},a.r+b.r));
   if(impact)return false;
   if(s.alive&&sweptHit({x:old.x-oldShip.x,y:old.y-oldShip.y},{x:a.x-s.ship.x,y:a.y-s.ship.y},a.r+s.ship.r)){s.alive=false;s.reason='Impact with an asteroid';}
   return a.age<60&&Math.hypot(a.x,a.y)<1250;
 });
}
