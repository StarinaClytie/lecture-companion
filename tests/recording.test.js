import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioCapture} from '../src/audio-capture.js';
class Recorder {
 static isTypeSupported(){return true;}
 constructor(){this.state='inactive';this.mimeType='audio/webm';}
 start(){this.state='recording';}
 pause(){this.state='paused';}
 resume(){this.state='recording';}
 stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['recorded audio'])});this.onstop?.();}
}
function platform(){const track={enabled:true,stopped:false,stop(){this.stopped=true;}};return {track,stream:{getTracks:()=>[track]},Recorder};}
test('pause and resume retain one recording; finishing releases microphone and returns audio',async()=>{
 const p=platform();let requests=0;
 const audio=new AudioCapture({getUserMedia:async()=>{requests++;return p.stream;},MediaRecorder:p.Recorder});
 await audio.start();assert.equal(audio.state,'recording');audio.pause();assert.equal(p.track.enabled,false);await audio.start();assert.equal(requests,1);assert.equal(p.track.enabled,true);const blob=await audio.finish();assert.equal(await blob.text(),'recorded audio');assert.equal(p.track.stopped,true);assert.equal(audio.state,'idle');
});
test('permission denial leaves no recording active',async()=>{
 const audio=new AudioCapture({getUserMedia:async()=>{throw Object.assign(new Error('denied'),{name:'NotAllowedError'});},MediaRecorder:Recorder});
 await assert.rejects(audio.start(),{name:'NotAllowedError'});assert.equal(audio.state,'idle');
});
test('dispose stops recording and releases every microphone track',async()=>{
 const p=platform();const audio=new AudioCapture({getUserMedia:async()=>p.stream,MediaRecorder:Recorder});await audio.start();audio.dispose();assert.equal(p.track.stopped,true);assert.equal(audio.state,'idle');
});
test('a permission request resolved after disposal releases its stream without starting',async()=>{
 const p=platform();let grant;
 const audio=new AudioCapture({getUserMedia:()=>new Promise(resolve=>{grant=resolve;}),MediaRecorder:Recorder});const pending=audio.start();audio.dispose();grant(p.stream);await pending;assert.equal(p.track.stopped,true);assert.equal(audio.state,'idle');
});
test('separate recordings produce separate complete audio files',async()=>{
 const p=platform();const audio=new AudioCapture({getUserMedia:async()=>p.stream,MediaRecorder:Recorder});await audio.start();const first=await audio.finish();await audio.start();const second=await audio.finish();assert.notEqual(first,second);assert.equal(await second.text(),'recorded audio');
});
