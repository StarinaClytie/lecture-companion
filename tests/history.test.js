import test from 'node:test';
import assert from 'node:assert/strict';
import {saveSession,loadHistory,migrateLegacy} from '../src/history.js';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}};
const session={id:'a',startedAt:'2026-11-04T12:00:00Z',rows:[{id:'r',time:2,text:'Hello'}],answers:{a:{short:'Explanation'}},conversations:{a:[{role:'user',content:'Why?'}]},elapsed:3};
test('empty sessions are excluded; repeated saves update one record and preserve other sessions',()=>{const s=storage();saveSession(s,{id:'empty',rows:[]});assert.deepEqual(loadHistory(s),[]);saveSession(s,session);saveSession(s,{...session,id:'b'});saveSession(s,{...session,elapsed:10});assert.equal(loadHistory(s).length,2);assert.equal(loadHistory(s).find(x=>x.id==='a').elapsed,10);assert.equal(loadHistory(s)[0].conversations.a[0].content,'Why?');});
test('audio is never serialized',()=>{const s=storage();saveSession(s,{...session,recordings:['audio'],blob:'audio'});assert.equal(loadHistory(s)[0].recordings,undefined);assert.equal(loadHistory(s)[0].blob,undefined);});
test('legacy migration is idempotent and keeps original data',()=>{const s=storage();s.setItem('lecture-companion-v2',JSON.stringify(session));migrateLegacy(s);migrateLegacy(s);assert.equal(loadHistory(s).length,1);assert.ok(s.getItem('lecture-companion-v2'));});
test('storage failures propagate so the UI can warn without deleting records',()=>{const s=storage();saveSession(s,session);s.setItem=()=>{throw new Error('Quota exceeded')};assert.throws(()=>saveSession(s,{...session,id:'b'}));assert.equal(loadHistory(s).length,1);});
