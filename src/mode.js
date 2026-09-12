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
export function watchTouch(onChange){
 let lastTouch=0;
 addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){lastTouch=performance.now();onChange(true);}},{capture:true});
 addEventListener('mousemove',()=>{if(performance.now()-lastTouch>1000)onChange(false);},{capture:true});
}
