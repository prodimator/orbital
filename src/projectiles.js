export const HEAT_PER_SHOT=10;
export const COOLING_RATE=12;
export const OVERHEAT_COOLING_RATE=25;
export const asteroidReward=radius=>Math.round(radius*radius*2);
export function updateProjectiles(s,input,dt,oldBodies,sweptHit){
 s.weaponHeat=Math.max(0,s.weaponHeat-(s.overheated?OVERHEAT_COOLING_RATE:COOLING_RATE)*dt);
 if(s.overheated&&s.weaponHeat<1e-8){s.weaponHeat=0;s.overheated=false;}
 s.shotCooldown=Math.max(0,s.shotCooldown-dt);
 if(input.shoot&&!s.overheated&&s.alive&&s.phase==='flying'&&s.shotCooldown<=0){
  const p=s.ship,c=Math.cos(p.angle),n=Math.sin(p.angle);
  s.projectiles.push({id:s.projectileId++,x:p.x+c*17,y:p.y+n*17,vx:p.vx+c*450,vy:p.vy+n*450,r:2,age:0});s.shotCooldown=.22;
  s.weaponHeat=Math.min(100,s.weaponHeat+HEAT_PER_SHOT);
  if(s.weaponHeat>=100)s.overheated=true;
 }
 s.projectiles=s.projectiles.filter(p=>{
  const old={x:p.x,y:p.y};p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;
  // Choose the first intersected object along the relative swept path.
  function hitTime(a,b,r){
   if(!sweptHit(a,b,r))return Infinity;
   const dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy,C=a.x*a.x+a.y*a.y-r*r;
   if(C<=0)return 0;if(!A)return Infinity;
   const B=2*(a.x*dx+a.y*dy);return Math.max(0,(-B-Math.sqrt(Math.max(0,B*B-4*A*C)))/(2*A));
  }
  let first=Infinity,target=null;
  for(let i=0;i<s.bodies.length;i++){
   const b=s.bodies[i],before=oldBodies[i];const t=hitTime({x:old.x-before.x,y:old.y-before.y},{x:p.x-b.x,y:p.y-b.y},p.r+b.r);
   if(t<first){first=t;target=null;}
  }
  for(const a of s.asteroids){
   const t=hitTime({x:old.x-(a.oldX??a.x),y:old.y-(a.oldY??a.y)},{x:p.x-a.x,y:p.y-a.y},p.r+a.r);
   if(t<first){first=t;target=a;}
  }
  if(first!==Infinity){if(target){s.asteroids=s.asteroids.filter(a=>a!==target);if(s.alive)s.shootingPoints+=asteroidReward(target.r);}return false;}
  return p.age<3&&Math.hypot(p.x,p.y)<1300;
 });
}
