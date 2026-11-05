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
test('lecture capture preserves distant speech, supports an explicit microphone, and reports actual device settings',async()=>{
 const p=platform();p.stream.getAudioTracks=()=>[{...p.track,label:'Built-in microphone',getSettings:()=>({echoCancellation:false,noiseSuppression:false})}];let constraints,actual;
 const audio=new AudioCapture({getUserMedia:async value=>{constraints=value;return p.stream;},MediaRecorder:Recorder,onDevice:value=>{actual=value}});
 await audio.start({profile:'lecture',deviceId:'chosen-mic'});
 assert.equal(constraints.audio.echoCancellation,false);assert.equal(constraints.audio.noiseSuppression,false);assert.equal(constraints.audio.autoGainControl,false);
 assert.deepEqual(constraints.audio.deviceId,{exact:'chosen-mic'});assert.equal(actual.label,'Built-in microphone');await audio.finish();
});
test('close microphone profile explicitly opts into communication processing',async()=>{
 const p=platform();let constraints;const audio=new AudioCapture({getUserMedia:async value=>{constraints=value;return p.stream;},MediaRecorder:Recorder});await audio.start({profile:'close'});assert.equal(constraints.audio.echoCancellation,true);assert.equal(constraints.audio.noiseSuppression,true);await audio.finish();
});
