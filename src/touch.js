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
 // Capture is taken on pointerdown; dropping without releasing it would keep routing later moves
 // from that pointer to the zone even after the stick is gone.
 function drop(){if(stickId!==null&&zone.hasPointerCapture(stickId))zone.releasePointerCapture(stickId);stickId=null;origin=null;vector=null;base.hidden=true;knob.style.transform='';}
 zone.addEventListener('pointerdown',e=>{
  if(stickId!==null)return;
  stickId=e.pointerId;origin={x:e.clientX,y:e.clientY};zone.setPointerCapture(stickId);
  base.style.left=origin.x+'px';base.style.top=origin.y+'px';base.hidden=false;place(e);e.preventDefault();
 });
 zone.addEventListener('pointermove',e=>{if(e.pointerId===stickId){place(e);e.preventDefault();}});
 zone.addEventListener('pointerup',e=>{if(e.pointerId===stickId)drop();});
 zone.addEventListener('pointercancel',e=>{if(e.pointerId===stickId)drop();});
 const buttons=[];
 for(const [id,key] of [['btn-thrust','up'],['btn-fire','shoot']]){
  const el=document.getElementById(id);let held=null;
  // One pointer per button, mirroring the stick zone: a second finger landing on a held button
  // must not let the first pointerup clear an input the second finger is still asking for.
  // pointerdown, never click: click latency is felt on the fire button.
  el.addEventListener('pointerdown',e=>{if(held!==null)return;held=e.pointerId;input[key]=true;el.classList.add('down');el.setPointerCapture(e.pointerId);e.preventDefault();});
  const lift=e=>{if(e.pointerId!==held)return;held=null;input[key]=false;el.classList.remove('down');};
  el.addEventListener('pointerup',lift);el.addEventListener('pointercancel',lift);
  el.addEventListener('contextmenu',e=>e.preventDefault());
  buttons.push(()=>{held=null;input[key]=false;el.classList.remove('down');});
 }
 // The .down class lives here, so any external input reset must come through release() or the
 // button keeps rendering lit while the ship coasts.
 function release(){drop();for(const reset of buttons)reset();}
 return {aim:()=>vector,release,setVisible(on){root.hidden=!on;if(!on)release();}};
}
