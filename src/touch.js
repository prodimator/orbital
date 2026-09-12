export const DEADZONE = 0.06;
export const MIN_DEFLECTION = 0.25;
export function wrapAngle(a){return Math.atan2(Math.sin(a),Math.cos(a));}
// Screen Y grows downward; world Y grows up. dy is inverted once, here, and nowhere else.
export function stickVector(origin,point,radius){
 const dx=point.x-origin.x,dy=origin.y-point.y,distance=Math.hypot(dx,dy);
 if(!distance)return {angle:0,deflection:0,x:0,y:0};
 const deflection=Math.min(1,distance/radius);
 return {angle:Math.atan2(dy,dx),deflection,x:dx/distance*deflection,y:dy/distance*deflection};
}
// physics.js applies (left - right) * TURN * dt, so left increases the angle.
export function steerToward(current,target,deadzone=DEADZONE){
 const diff=wrapAngle(target-current);
 return {left:diff>deadzone,right:diff<-deadzone};
}
export function aimInput(stick,current){
 return stick&&stick.deflection>=MIN_DEFLECTION?steerToward(current,stick.angle):{left:false,right:false};
}
