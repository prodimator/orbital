// iOS Safari implements neither the Fullscreen nor the Screen Orientation lock API, so on iOS
// the rotate card is the whole mechanism rather than a fallback. Both calls are wrapped:
// rejection is a normal, expected outcome, not an error worth surfacing.
export function createOrientationGate({onBlock}){
 const card=document.getElementById('rotate'),query=matchMedia('(orientation: portrait)');
 function apply(){card.hidden=!query.matches;if(query.matches)onBlock();}
 query.addEventListener('change',apply);apply();
}
export async function requestLandscape(){
 try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch{}
 try{await screen.orientation?.lock?.('landscape');}catch{}
}
