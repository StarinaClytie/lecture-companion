import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRequest} from '../server/validation.js';
import {buildTutorRequest} from '../server/tutor-prompt.js';
import {lectureTranscript} from '../src/lecture-question.js';
test('unselected question includes early definitions and latest finalized captions, independently of filtering',()=>{
 const rows=[{id:'a',time:0,text:'M is the number of rows; N is the number of columns.'},...Array.from({length:50},(_,i)=>({id:String(i),time:i+5,text:'Later caption '+i}))];
 const transcript=lectureTranscript(rows);
 const data=validateRequest({scope:'lecture',transcript,question:'What do M and N represent?',nativeLanguage:'zh'});
 const request=buildTutorRequest(data);
 assert.match(request.input[0].content,/M is the number of rows/);assert.match(request.input[0].content,/Later caption 49/);
 assert.match(request.instructions,/3 short sentences/);assert.match(request.instructions,/not defined/i);
 const next=lectureTranscript([...rows,{time:100,text:'N now refers to sample size.'}]);assert.match(next,/N now refers/);
 assert.doesNotMatch(lectureTranscript([{time:0,text:'New classroom'}]),/M is/);
});
test('lecture mode requires a real question and rejects oversized transcripts without silently trimming early definitions',()=>{
 assert.throws(()=>validateRequest({scope:'lecture',transcript:'Lecture text',question:''}));
 assert.throws(()=>validateRequest({scope:'lecture',transcript:'x'.repeat(200001),question:'M?'}));
 assert.equal(validateRequest({scope:'lecture',transcript:'x'.repeat(30000),question:'M?'}).transcript.length,30000);
 assert.throws(()=>validateRequest({scope:'unknown',sentence:'valid'}));
});
test('selected explanations keep focused passage and prior context rather than switching to whole lecture',()=>{
 const request=buildTutorRequest(validateRequest({sentence:'M times N',context:'M is rows.',focus:'N'}));
 assert.match(request.input[0].content,/Selected passage/);assert.match(request.input[0].content,/M is rows/);assert.match(request.input[0].content,/N/);
});
