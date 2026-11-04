export function pcm16(samples){const buffer=new ArrayBuffer(samples.length*2),view=new DataView(buffer);for(let i=0;i<samples.length;i++){const value=Math.max(-1,Math.min(1,samples[i]));view.setInt16(i*2,Math.round(value*(value<0?32768:32767)),true);}return buffer;}
export class TranscriptionEvents {
 constructor({onFinal=()=>{},onPartial=()=>{}}={}){this.onFinal=onFinal;this.onPartial=onPartial;this.times=[];this.items=new Map();this.order=[];this.done=new Set();}
 expect(time){this.times.push(time);}
 get pending(){return this.times.length+this.order.length;}
 accept(event){const id=event.item_id;if(!id||this.done.has(id))return;const item=this.items.get(id)||{text:''};this.items.set(id,item);
  if(event.type==='input_audio_buffer.committed'&&!this.order.includes(id)){item.time=this.times.shift()??0;this.order.push(id);}
  if(event.type==='conversation.item.input_audio_transcription.delta')item.text+=event.delta||'';
  if(event.type==='conversation.item.input_audio_transcription.completed'){item.text=event.transcript||'';item.complete=true;}
  while(this.order.length&&this.items.get(this.order[0])?.complete){const first=this.order.shift(),completed=this.items.get(first);this.done.add(first);this.items.delete(first);if(completed.text.trim())this.onFinal(completed.text.trim(),completed.time);}
  this.onPartial([...this.items.values()].filter(x=>!x.complete).map(x=>x.text).join(' '));
 }
}
export class RealtimeTranscription {
 constructor({onFinal,onPartial,onError=()=>{},onState=()=>{},platform={}}={}){this.events=new TranscriptionEvents({onFinal,onPartial});this.onPartial=onPartial||(()=>{});this.onError=onError;this.onState=onState;this.platform=platform;this.duration=0;this.total=0;this.quiet=0;this.speech=false;this.closed=false;this.draining=false;this.queue=[];this.queuedSamples=0;this.ready=false;}
 async start(stream,language,offset=0){
  this.offset=offset;this.onState('connecting');const Socket=this.platform.WebSocket||globalThis.WebSocket;
  const url=this.platform.url||`${location.protocol==='https:'?'wss':'ws'}://${location.host}/api/transcribe?language=${encodeURIComponent(language)}`;
  const socket=this.socket=new Socket(url);socket.binaryType='arraybuffer';
  try{
   this.connectionReady=new Promise((resolve,reject)=>{this.rejectStart=reject;const timeout=setTimeout(()=>reject(Error('Transcription connection timed out.')),22000);this.startTimeout=timeout;
    socket.onmessage=event=>{if(this.closed)return;let data;try{data=JSON.parse(event.data);}catch{return;}if(data.type==='ready'){clearTimeout(timeout);this.rejectStart=null;this.ready=true;for(const chunk of this.queue)this.sendAudio(chunk.audio,chunk.rms);this.queue=[];this.queuedSamples=0;resolve();}else if(data.type==='error'){this.fail(data.message);reject(Error(data.message));}else {this.events.accept(data);this.maybeDrained();}};
    socket.onerror=()=>{this.fail('OpenAI transcription connection failed. Recording continues.');};socket.onclose=()=>{if(!this.closed)this.fail('Transcription disconnected. Recording continues; retry captions.');};
   });
   this.connectionReady.catch(()=>{});
   if(this.closed)return;
   const Context=this.platform.AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;
   this.context=new Context({sampleRate:24000});await this.context.audioWorklet.addModule('/pcm-worklet.js');if(this.closed||this.draining){await this.context.close();return;}
   const Worklet=this.platform.AudioWorkletNode||globalThis.AudioWorkletNode;
   this.node=new Worklet(this.context,'caption-pcm');this.source=this.context.createMediaStreamSource(stream);
   this.node.port.onmessage=event=>{if(event.data.flushed){this.flushed?.();return;}this.sendAudio(event.data.audio,event.data.rms);};
   this.source.connect(this.node);this.node.connect(this.context.destination);await this.context.resume();await this.connectionReady;if(this.closed||this.draining)return;this.onState('connected');
  }catch(error){this.dispose();throw error;}
 }
 sendAudio(audio,rms){if(this.closed)return;if(!this.ready){this.queuedSamples+=audio.length;if(this.queuedSamples>240000){this.fail('Transcription connection took too long. Recording continues; retry captions.');return;}this.queue.push({audio,rms});return;}if(this.socket?.readyState!==1)return;if(this.socket.bufferedAmount>1024*1024){this.fail('Transcription connection is too slow. Recording continues.');return;}const seconds=audio.length/24000;this.socket.send(pcm16(audio));this.duration+=seconds;this.total+=seconds;if(rms>.002){this.speech=true;this.quiet=0;}else this.quiet+=seconds;
  if(!this.draining&&this.duration>=.1&&((this.speech&&this.quiet>=.9)||this.duration>=10))this.commit();
 }
 commit(){if(this.duration<.1||this.closed)return;this.events.expect(this.offset+this.total-this.duration);this.socket.send(JSON.stringify({type:'commit'}));this.duration=0;this.quiet=0;this.speech=false;}
 maybeDrained(){if(this.draining&&!this.events.pending)this.drained?.();}
 fail(message){if(this.closed)return;this.rejectStart?.(Error(message));this.rejectStart=null;this.onError(message);this.dispose();}
 async stop(){
  if(this.closed)return;this.draining=true;this.source?.disconnect();
  if(this.node)await new Promise(resolve=>{const timer=setTimeout(resolve,300);this.flushed=()=>{clearTimeout(timer);resolve();};this.node.port.postMessage('flush');});
  if(!this.ready&&!this.closed){try{await this.connectionReady;}catch{this.dispose();return;}}
  // Pad a short final tail to the provider's 100ms minimum; no captured audio is discarded.
  if(this.duration>0&&this.duration<.1){const padding=new Float32Array(Math.ceil((.1-this.duration)*24000));this.sendAudio(padding,0);}
  this.commit();
  if(this.events.pending&&!this.closed)await new Promise(resolve=>{const timer=setTimeout(()=>{this.onError('Some final captions did not arrive. Keep the audio download for those words.');resolve();},10000);this.drained=()=>{clearTimeout(timer);resolve();};this.maybeDrained();});
  this.dispose();
 }
 dispose(){if(this.closed)return;this.closed=true;clearTimeout(this.startTimeout);this.rejectStart?.(Error('Transcription cancelled.'));this.rejectStart=null;this.drained?.();this.flushed?.();this.source?.disconnect();this.node?.disconnect();this.context?.close().catch(()=>{});this.queue=[];this.socket?.close();this.onPartial('');this.onState('idle');}
}
