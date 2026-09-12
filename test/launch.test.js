import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step} from '../src/physics.js';
test('landed ship follows moving home with zero score until launch',()=>{
 const s=createRun(()=>.3),home=s.bodies.find(b=>b.name===s.home),x=home.x;
 for(let i=0;i<600;i++)step(s,{});
 assert.notEqual(home.x,x);assert.equal(s.time,0);assert.equal(s.score,0);
 assert.equal(s.phase,'landed');assert.ok(s.alive);
 assert.ok(Math.abs(Math.hypot(s.ship.x-home.x,s.ship.y-home.y)-home.r-s.ship.r)<1e-8);
 step(s,{up:true});assert.equal(s.phase,'flying');assert.equal(s.time,0);
 assert.ok(Math.hypot(s.ship.x-home.x,s.ship.y-home.y)>home.r+s.ship.r);
 step(s,{up:true});assert.ok(s.alive);assert.ok(s.time>0);assert.ok(s.score>0);
});
