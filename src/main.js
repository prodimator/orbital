import './style.css';
import {proximityRate} from './scoring.js';
import {createRun,advance,gravity} from './physics.js';
import {createView} from './view.js';
const $=id=>document.getElementById(id);
const input={left:false,right:false,up:false};
let state=createRun(),mode='ready',last=performance.now(),best=0;
try{best=Math.max(0,Number(localStorage.getItem('orbital-best-score-v1'))||0);}catch{}
const format=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`;
$('best').textContent=best.toFixed(1);
let view;
try{view=createView($('space'));view.reset(state);}catch(error){$('title').textContent='WebGL unavailable';$('description').textContent='This game needs a browser with WebGL enabled. Enable hardware acceleration and reload.';$('start').disabled=true;throw error;}
function clear(){Object.keys(input).forEach(k=>input[k]=false);}
function launch(){state=createRun();view.reset(state);clear();mode='playing';$('overlay').classList.add('hidden');$('pause').disabled=false;$('pause').textContent='Pause flight Ⅱ';$('planet-count').textContent=`${state.bodies.length-1} PLANETS / LAUNCHED FROM ${state.home}`;}
function pause(){if(mode!=='playing')return;mode='paused';clear();$('card-label').textContent='FLIGHT ON HOLD';$('title').textContent='Take a breath.';$('description').textContent='Your flight is paused. Resume when you’re ready to feel the pull again.';$('start').innerHTML='Resume flight <span>↗</span>';$('launch-note').textContent='TIME AND PHYSICS ARE PAUSED';$('overlay').classList.remove('hidden');$('pause').textContent='Resume flight ▷';}
function resume(){mode='playing';last=performance.now();$('overlay').classList.add('hidden');$('pause').textContent='Pause flight Ⅱ';}
$('start').onclick=()=>mode==='paused'?resume():launch();
$('pause').onclick=()=>mode==='paused'?resume():pause();
const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up'};
addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();if(mode==='playing')input[keys[e.key]]=true;}});
addEventListener('keyup',e=>{if(keys[e.key]){e.preventDefault();input[keys[e.key]]=false;}});
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function finish(){mode='ended';clear();if(state.score>best){best=state.score;try{localStorage.setItem('orbital-best-score-v1',String(best));}catch{}}$('best').textContent=best.toFixed(1);$('card-label').textContent='FLIGHT RECORDER / SIGNAL LOST';$('title').textContent='Gravity wins.';$('description').textContent=`${state.reason}. Total: ${state.score.toFixed(1)} points — ${state.time.toFixed(1)} survival + ${state.flyingPoints.toFixed(1)} flying. Flight time: ${state.time.toFixed(2)} seconds.`;$('start').innerHTML='Fly again <span>↗</span>';$('launch-note').textContent='NEW SYSTEM · NEW HOME PLANET';$('overlay').classList.remove('hidden');$('pause').disabled=true;}
function frame(now){const elapsed=(now-last)/1000;last=now;if(mode==='playing'){advance(state,input,elapsed);if(!state.alive)finish();}$('score').textContent=state.score.toFixed(1);$('flying').textContent=state.flyingPoints.toFixed(1);$('survival').textContent=state.time.toFixed(1);$('bonus').textContent=(mode==='playing'?proximityRate(state.ship,state.bodies):0).toFixed(1);const time=format(state.time);$('time').textContent=time.slice(0,-3);$('fraction').textContent=time.slice(-3);$('speed').textContent=Math.hypot(state.ship.vx,state.ship.vy).toFixed(1);const g=gravity(state.ship,state.bodies);$('gravity').textContent=Math.hypot(g.x,g.y).toFixed(1);$('flight-status').textContent=mode==='playing'?(input.up?'● THRUST ACTIVE':'● COASTING'):mode==='paused'?'Ⅱ FLIGHT PAUSED':mode==='ended'?'○ SIGNAL LOST':'● SYSTEM READY';view.draw(state,input.up,mode==='playing');requestAnimationFrame(frame);}
$('planet-count').textContent=`${state.bodies.length-1} ORBITING BODIES / SECTOR 001`;
requestAnimationFrame(frame);
