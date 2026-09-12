import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCompact, readOverride} from '../src/mode.js';

test('compact mode needs a coarse pointer and no hover',()=>{
 assert.equal(resolveCompact({coarse:true,hoverless:true,override:null}),true);
 assert.equal(resolveCompact({coarse:true,hoverless:false,override:null}),false);
 assert.equal(resolveCompact({coarse:false,hoverless:true,override:null}),false);
 assert.equal(resolveCompact({coarse:false,hoverless:false,override:null}),false);
});

test('an explicit override wins in both directions',()=>{
 assert.equal(resolveCompact({coarse:false,hoverless:false,override:true}),true);
 assert.equal(resolveCompact({coarse:true,hoverless:true,override:false}),false);
});

test('the touch override is read from the query string',()=>{
 assert.equal(readOverride('?touch=1'),true);
 assert.equal(readOverride('?touch=0'),false);
 assert.equal(readOverride(''),null);
 assert.equal(readOverride('?other=1'),null);
 assert.equal(readOverride('?touch=yes'),null,'only 1 and 0 are honoured');
});
