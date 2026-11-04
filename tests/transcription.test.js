import test from 'node:test';
import assert from 'node:assert/strict';
import {TranscriptionEvents,pcm16} from '../src/realtime-transcription.js';
import {transcriptionConfig,relayEvent} from '../server/transcription.js';
test('transcription has its own model and language config, uses far-field input, no spoken AI output',()=>{
 const session=transcriptionConfig('en',{}).session;
 assert.equal(session.type,'transcription');assert.equal(session.audio.input.transcription.model,'gpt-live-transcribe');
 assert.deepEqual(session.audio.input.transcription.languages,['en']);assert.equal(session.audio.input.turn_detection,null);
 assert.equal(session.audio.input.noise_reduction.type,'far_field');
 assert.throws(()=>transcriptionConfig('invalid',{}));
});
test('completed turns arriving out of order appear once in committed order, including empty turns',()=>{
 const finals=[],events=new TranscriptionEvents({onFinal:(text,time)=>finals.push({text,time})});
 events.expect(2);events.expect(8);events.accept({type:'input_audio_buffer.committed',item_id:'a'});events.accept({type:'input_audio_buffer.committed',item_id:'b',previous_item_id:'a'});
 events.accept({type:'conversation.item.input_audio_transcription.completed',item_id:'b',transcript:'N is columns.'});assert.equal(finals.length,0);
 events.accept({type:'conversation.item.input_audio_transcription.completed',item_id:'a',transcript:'M is rows.'});
 events.accept({type:'conversation.item.input_audio_transcription.completed',item_id:'a',transcript:'M is rows.'});
 assert.deepEqual(finals,[{text:'M is rows.',time:2},{text:'N is columns.',time:8}]);assert.equal(events.pending,0);
});
test('final received before commit metadata is preserved, empty turns do not block later captions',()=>{
 const finals=[],events=new TranscriptionEvents({onFinal:t=>finals.push(t)});events.expect(0);events.expect(1);
 events.accept({type:'conversation.item.input_audio_transcription.completed',item_id:'a',transcript:''});events.accept({type:'input_audio_buffer.committed',item_id:'a'});
 events.accept({type:'input_audio_buffer.committed',item_id:'b'});events.accept({type:'conversation.item.input_audio_transcription.completed',item_id:'b',transcript:'Hello'});
 assert.deepEqual(finals,['Hello']);assert.equal(events.pending,0);
});
test('relay never forwards upstream session secrets or raw error details',()=>{
 assert.equal(relayEvent({type:'session.created',session:{secret:'private'}}),null);
 const error=relayEvent({type:'error',error:{message:'private key',code:'bad'}});assert.ok(error);assert.doesNotMatch(JSON.stringify(error),/private key/);
});
test('PCM encoder clamps and correctly encodes quiet audio without gating',()=>{
 const values=new Float32Array([-2,-1,0,.001,1,2]);const encoded=pcm16(values);const view=new DataView(encoded);
 assert.equal(view.getInt16(0,true),-32768);assert.equal(view.getInt16(6,true),33);assert.equal(view.getInt16(10,true),32767);
});

import {EventEmitter} from 'node:events';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {attachTranscription} from '../server/transcription.js';
import {RealtimeTranscription} from '../src/realtime-transcription.js';
const receive=socket=>new Promise((resolve,reject)=>{socket.once('message',data=>resolve(JSON.parse(data.toString())));socket.once('error',reject);});
test('local websocket relay configures upstream, forwards PCM and commit, closes upstream, and keeps keys server-side',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let upstream,committed,closedUpstream;const upstreamClosed=new Promise(resolve=>{closedUpstream=resolve;});const commitReceived=new Promise(resolve=>{committed=resolve;});const sent=[];const wss=attachTranscription(server,{env:{OPENAI_API_KEY:'test-only-not-real'},createUpstream:key=>{assert.equal(key,'test-only-not-real');upstream=new EventEmitter();upstream.readyState=0;upstream.bufferedAmount=0;upstream.send=text=>{const d=JSON.parse(text);sent.push(d);if(d.type==='input_audio_buffer.commit')committed();if(d.type==='session.update')queueMicrotask(()=>upstream.emit('message',Buffer.from(JSON.stringify({type:'session.updated'}))));};upstream.close=()=>{upstream.readyState=3;closedUpstream();};queueMicrotask(()=>{upstream.readyState=1;upstream.emit('open');});return upstream;}});
 const client=new WebSocket(`ws://127.0.0.1:${server.address().port}/api/transcribe?language=en`,{origin:'http://127.0.0.1:5173'});
 try{const ready=await receive(client);assert.equal(ready.type,'ready');assert.doesNotMatch(JSON.stringify(ready),/test-only/);
  client.send(Buffer.alloc(4800));client.send(JSON.stringify({type:'commit'}));await commitReceived;
  assert.equal(sent[1].type,'input_audio_buffer.append');assert.equal(sent[1].audio.length,6400);assert.equal(sent[2].type,'input_audio_buffer.commit');
  const event=receive(client);upstream.emit('message',Buffer.from(JSON.stringify({type:'conversation.item.input_audio_transcription.completed',item_id:'a',transcript:'Hello'})));assert.equal((await event).transcript,'Hello');
  await new Promise(r=>{client.once('close',r);client.close();});await upstreamClosed;assert.equal(upstream.readyState,3);
 }finally{client.terminate();wss.close();await new Promise(r=>server.close(r));}
});
test('untrusted websocket origins cannot open a provider connection',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let calls=0;const wss=attachTranscription(server,{createUpstream:()=>{calls++;throw Error('must not run')}});
 const client=new WebSocket(`ws://127.0.0.1:${server.address().port}/api/transcribe?language=en`,{origin:'https://untrusted.example'});
 try{await new Promise(r=>client.once('error',r));assert.equal(calls,0);}finally{client.terminate();wss.close();await new Promise(r=>server.close(r));}
});
test('short final audio is padded, committed, drained before disconnect, with no microphone track ownership',async()=>{
 const finals=[];const client=new RealtimeTranscription({onFinal:(text,time)=>finals.push({text,time})});const sent=[];
 client.ready=true;client.socket={readyState:1,bufferedAmount:0,send:data=>{sent.push(data);if(typeof data==='string'){queueMicrotask(()=>{client.events.accept({type:'input_audio_buffer.committed',item_id:'tail'});client.events.accept({type:'conversation.item.input_audio_transcription.completed',item_id:'tail',transcript:'Last words'});client.maybeDrained();});}},close(){this.readyState=3;}};client.offset=7;
 client.sendAudio(new Float32Array(1200),.001);await client.stop();
 assert.equal(sent.filter(x=>x instanceof ArrayBuffer).reduce((n,x)=>n+x.byteLength,0),4800);assert.deepEqual(finals,[{text:'Last words',time:7}]);assert.equal(client.closed,true);assert.equal(client.socket.readyState,3);
});
test('connection startup buffers quiet audio and sends every sample once ready',()=>{
 const client=new RealtimeTranscription();client.socket={readyState:1,bufferedAmount:0,send:()=>{},close:()=>{}};
 client.sendAudio(new Float32Array(2400).fill(.001),.001);assert.equal(client.queue.length,1);assert.equal(client.total,0);
 client.ready=true;for(const chunk of client.queue)client.sendAudio(chunk.audio,chunk.rms);assert.equal(client.total,.1);client.dispose();
});

import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('audio worklet downmixes/resamples 48k stereo, preserves quiet samples and flushes final tail',()=>{
 let Processor;const messages=[];class Base{constructor(){this.port={postMessage:value=>messages.push(value)}}}
 vm.runInNewContext(readFileSync(new URL('../public/pcm-worklet.js',import.meta.url),'utf8'),{AudioWorkletProcessor:Base,sampleRate:48000,registerProcessor:(_,value)=>{Processor=value;}});
 const worklet=new Processor(),output=new Float32Array(4800).fill(1);
 worklet.process([[new Float32Array(4800).fill(.001),new Float32Array(4800).fill(.003)]],[[output]]);
 assert.equal(messages[0].audio.length,2400);assert.ok(Math.abs(messages[0].audio[0]-.002)<.000001);assert.ok(output.every(x=>x===0));
 worklet.process([[new Float32Array(960).fill(.001)]],[[new Float32Array(960)]]);worklet.port.onmessage({data:'flush'});
 assert.equal(messages[1].audio.length,480);assert.equal(messages[2].flushed,true);
});
test('pause during asynchronous worklet setup never connects a new audio source',async()=>{
 let socket,resolveModule,created=0,closed=0;
 class Socket{constructor(){socket=this;this.readyState=1;}send(){}close(){this.readyState=3;}}
 class Context{constructor(){this.audioWorklet={addModule:()=>new Promise(r=>{resolveModule=r})};}close(){closed++;return Promise.resolve();}createMediaStreamSource(){created++;return {connect(){},disconnect(){}};}}
 class Worklet{constructor(){created++;}}
 const client=new RealtimeTranscription({platform:{url:'ws://test',WebSocket:Socket,AudioContext:Context,AudioWorkletNode:Worklet}});
 const starting=client.start({},'en');const stopping=client.stop();resolveModule();await starting;
 socket.onmessage({data:JSON.stringify({type:'ready'})});await stopping;
 assert.equal(created,0);assert.ok(closed>=1);assert.equal(client.closed,true);
});
test('missing transcription key produces an actionable message without opening upstream',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let calls=0;const wss=attachTranscription(server,{env:{},createUpstream:()=>{calls++;throw Error('must not connect')}});const client=new WebSocket(`ws://127.0.0.1:${server.address().port}/api/transcribe?language=en`);
 try{const event=await receive(client);assert.equal(event.type,'error');assert.match(event.message,/not configured/);assert.equal(calls,0);}finally{client.terminate();wss.close();await new Promise(r=>server.close(r));}
});
