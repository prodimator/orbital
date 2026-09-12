import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,sweptHit} from '../src/physics.js';
import {updateProjectiles,asteroidReward} from '../src/projectiles.js';
test('shots require flight and respect cooldown',()=>{
 const s=createRun(()=>.4);step(s,{shoot:true});assert.equal(s.projectiles.length,0);
 step(s,{up:true});s.bodies=[];step(s,{shoot:true});assert.equal(s.projectiles.length,1);
 step(s,{shoot:true});assert.equal(s.projectiles.length,1);
 assert.ok(s.projectiles[0].vx*Math.cos(s.ship.angle)+s.projectiles[0].vy*Math.sin(s.ship.angle)>300);
});
test('projectile crossing destroys asteroid and awards size-based points once',()=>{
 const s=createRun();s.phase='flying';s.bodies=[];
 s.asteroids=[{id:1,x:0,y:0,oldX:0,oldY:0,r:8}];
 s.projectiles=[{id:1,x:-20,y:0,vx:400,vy:0,r:2,age:0}];
 updateProjectiles(s,{},.1,[],sweptHit);
 assert.equal(s.asteroids.length,0);assert.equal(s.projectiles.length,0);assert.equal(s.shootingPoints,asteroidReward(8));
 updateProjectiles(s,{},.1,[],sweptHit);assert.equal(s.shootingPoints,asteroidReward(8));
 assert.ok(asteroidReward(11)>asteroidReward(5));
});
