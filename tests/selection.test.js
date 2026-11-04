import test from 'node:test';
import assert from 'node:assert/strict';
import {toggleSelection,selectionBundle} from '../src/selection.js';
const rows=Array.from({length:10},(_,i)=>({id:`r${i}`,text:`sentence ${i}`,time:i*10}));
test('click toggles membership and keeps transcript order',()=>{
 assert.deepEqual(toggleSelection(rows,['r4'],'r2'),['r2','r4']);
 assert.deepEqual(toggleSelection(rows,['r2','r4'],'r2'),['r4']);
});
test('shift selection includes both endpoints in either direction',()=>{
 assert.deepEqual(toggleSelection(rows,['r2'],'r5',{range:true,anchor:'r2'}),['r2','r3','r4','r5']);
 assert.deepEqual(toggleSelection(rows,['r5'],'r2',{range:true,anchor:'r5'}),['r2','r3','r4','r5']);
});
test('multi-passage bundle preserves order and uses only preceding context',()=>{
 const b=selectionBundle(rows,['r5','r4','r6']);
 assert.deepEqual(b.rows.map(r=>r.id),['r4','r5','r6']);assert.equal(b.text,'sentence 4\n\nsentence 5\n\nsentence 6');
 assert.deepEqual(b.context.map(r=>r.id),['r1','r2','r3']);assert.equal(b.start,40);assert.equal(b.end,60);
 assert.equal(selectionBundle(rows,['missing']).text,'');
});
test('bundle identity is stable when new captions arrive and independent of click order',()=>{
 assert.notEqual(selectionBundle(rows,['r4']).key,selectionBundle(rows,['r5']).key);
 assert.equal(selectionBundle(rows,['r5','r4']).key,selectionBundle([...rows,{id:'new',text:'future',time:200}],['r4','r5']).key);
});
test('noncontiguous selection does not silently include unselected passages',()=>{
 assert.equal(selectionBundle(rows,['r2','r5']).text,'sentence 2\n\nsentence 5');
});
