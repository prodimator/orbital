// iOS Safari implements neither the Fullscreen nor the Screen Orientation lock API, so on iOS
// the rotate card is the whole mechanism rather than a fallback. Both calls are wrapped:
// rejection is a normal, expected outcome, not an error worth surfacing.
// The media query is pure viewport shape, so a portrait DESKTOP window would match it too;
// `enabled` is re-evaluated on every apply so the caller can scope the gate to compact mode.
export function createOrientationGate({onBlock,enabled=()=>true}){
 const card=document.getElementById('rotate'),query=matchMedia('(orientation: portrait)');
 let blocked=false;
 function apply(){blocked=enabled()&&query.matches;card.hidden=!blocked;if(blocked)onBlock();}
 query.addEventListener('change',apply);apply();
 return {apply,blocked:()=>blocked};
}
export async function requestLandscape(){
 try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch{}
 try{await screen.orientation?.lock?.('landscape');}catch{}
}
