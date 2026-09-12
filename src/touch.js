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
const STICK_RADIUS = 52;
export function createTouchControls({input}){
 const root=document.getElementById('touch'),zone=document.getElementById('stick-zone');
 const base=document.getElementById('stick-base'),knob=document.getElementById('stick-knob');
 let stickId=null,origin=null,vector=null;
 function place(e){
  vector=stickVector(origin,{x:e.clientX,y:e.clientY},STICK_RADIUS);
  knob.style.transform=`translate(${vector.x*STICK_RADIUS}px,${-vector.y*STICK_RADIUS}px)`;
 }
 function drop(){stickId=null;origin=null;vector=null;base.hidden=true;knob.style.transform='';}
 zone.addEventListener('pointerdown',e=>{
  if(stickId!==null)return;
  stickId=e.pointerId;origin={x:e.clientX,y:e.clientY};zone.setPointerCapture(stickId);
  base.style.left=origin.x+'px';base.style.top=origin.y+'px';base.hidden=false;place(e);e.preventDefault();
 });
 zone.addEventListener('pointermove',e=>{if(e.pointerId===stickId){place(e);e.preventDefault();}});
 zone.addEventListener('pointerup',e=>{if(e.pointerId===stickId)drop();});
 zone.addEventListener('pointercancel',e=>{if(e.pointerId===stickId)drop();});
 for(const [id,key] of [['btn-thrust','up'],['btn-fire','shoot']]){
  const el=document.getElementById(id);
  // pointerdown, never click: click latency is felt on the fire button.
  el.addEventListener('pointerdown',e=>{input[key]=true;el.classList.add('down');el.setPointerCapture(e.pointerId);e.preventDefault();});
  const release=()=>{input[key]=false;el.classList.remove('down');};
  el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
  el.addEventListener('contextmenu',e=>e.preventDefault());
 }
 return {aim:()=>vector,setVisible(on){root.hidden=!on;if(!on){drop();input.up=false;input.shoot=false;}}};
}
