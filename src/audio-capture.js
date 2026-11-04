/** Owns one microphone stream and one complete recording across pauses. */
export class AudioCapture {
 constructor(platform={}) {this.platform=platform;this.state='idle';this.generation=0;this.chunks=[];}
 async start() {
  if(this.state==='paused') {this.stream.getTracks().forEach(t=>{t.enabled=true;});this.recorder.resume();this.state='recording';return;}
  if(this.state!=='idle')return;
  const generation=++this.generation;
  this.state='requesting';
  try {
   const getMedia=this.platform.getUserMedia||((options)=>navigator.mediaDevices.getUserMedia(options));
   const Recorder=this.platform.MediaRecorder||globalThis.MediaRecorder;
   if(!Recorder)throw new Error('Audio recording is not supported by this browser. Try Chrome, Edge or Safari.');
   const stream=await getMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
   if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
   this.stream=stream;
   const mimeType=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>Recorder.isTypeSupported(type));
   this.recorder=new Recorder(stream,mimeType?{mimeType}:undefined);this.chunks=[];
   this.recorder.ondataavailable=event=>{if(event.data?.size)this.chunks.push(event.data);};
   this.recorder.onerror=()=>{this.platform.onError?.('Audio recording stopped unexpectedly. Finish to save the audio collected so far.');};
   this.recorder.start(1000);this.state='recording';
   this.startMeter();
  }catch(error){if(generation===this.generation){this.release();this.state='idle';}throw error;}
 }
 pause(){if(this.state!=='recording')return;this.recorder.pause();this.stream.getTracks().forEach(t=>{t.enabled=false;});this.state='paused';this.platform.onLevel?.(0);}
 finish(){
  if(this.finishing)return this.finishing;
  if(!this.recorder||this.recorder.state==='inactive'){this.release();this.state='idle';return Promise.resolve(new Blob());}
  this.state='finishing';
  this.finishing=new Promise(resolve=>{this.recorder.onstop=()=>{const blob=new Blob(this.chunks,{type:this.recorder.mimeType||'audio/webm'});this.release();this.state='idle';resolve(blob);};this.recorder.stop();this.release();}).finally(()=>{this.finishing=null;});
  return this.finishing;
 }
 startMeter(){
  const Context=this.platform.AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Context||!this.platform.onLevel)return;
  try{this.context=new Context();const analyser=this.context.createAnalyser();analyser.fftSize=256;this.context.createMediaStreamSource(this.stream).connect(analyser);const buffer=new Uint8Array(analyser.fftSize);this.meter=setInterval(()=>{if(this.state!=='recording')return;analyser.getByteTimeDomainData(buffer);const rms=Math.sqrt(buffer.reduce((sum,n)=>sum+((n-128)/128)**2,0)/buffer.length);this.platform.onLevel(Math.min(1,rms*5));},90);}catch{/* Meter is optional; recording remains usable. */}
 }
 release(){this.stream?.getTracks().forEach(t=>t.stop());if(this.meter)clearInterval(this.meter);this.context?.close().catch(()=>{});this.context=null;this.platform.onLevel?.(0);}
 dispose(){this.generation++;if(this.recorder?.state!=='inactive'&&this.recorder){this.recorder.ondataavailable=null;this.recorder.onstop=null;this.recorder.stop();}this.release();this.state='idle';}
}
