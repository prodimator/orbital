// Compact mode is a LAYOUT decision, resolved from input-capability media queries at load.
// Device sniffing is deliberately avoided: iPadOS Safari reports itself as macOS, and
// navigator.userAgentData.mobile exists only in Chromium.
export function resolveCompact({coarse,hoverless,override}){return override===null||override===undefined?coarse&&hoverless:override;}
export function readOverride(search){const value=new URLSearchParams(search).get('touch');return value==='1'?true:value==='0'?false:null;}
export function watchCompact(override,onChange){
 const coarse=matchMedia('(pointer: coarse)'),hoverless=matchMedia('(hover: none)');
 const apply=()=>onChange(resolveCompact({coarse:coarse.matches,hoverless:hoverless.matches,override}));
 coarse.addEventListener('change',apply);hoverless.addEventListener('change',apply);apply();
}
// Control visibility is an INPUT decision, observed rather than predicted. Browsers emit
// compatibility mouse events after a touch, so a recent touch suppresses the mouse path.
// The clock must refresh on move and up, not only on down: the thumbstick is held for the whole
// flight, and the trailing compatibility mousemove arrives after touchend. Anchoring the window
// to pointerdown alone would let it lapse mid-hold and hide the controls on every stick release.
// Anything that is not a mouse counts as touch: the stick zone and the buttons accept pen
// pointers, so a stylus user would otherwise never refresh the clock and the trailing
// compatibility mousemove would hide the controls mid-flight.
export function watchTouch(onChange){
 let lastTouch=0;
 const refresh=e=>{if(e.pointerType!=='mouse')lastTouch=performance.now();};
 addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'){lastTouch=performance.now();onChange(true);}},{capture:true});
 addEventListener('pointermove',refresh,{capture:true});
 addEventListener('pointerup',refresh,{capture:true});
 addEventListener('mousemove',()=>{if(performance.now()-lastTouch>1000)onChange(false);},{capture:true});
}
