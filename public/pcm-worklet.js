// Mono 24kHz PCM source. All samples are sent, including quiet speech.
class CaptionPCM extends AudioWorkletProcessor {
 constructor(){super();this.samples=[];this.sum=0;this.weight=0;this.energy=0;this.port.onmessage=event=>{if(event.data==='flush'){this.flush();this.port.postMessage({flushed:true});}};}
 flush(){if(!this.samples.length)return;const audio=Float32Array.from(this.samples);const rms=Math.sqrt(this.energy/this.samples.length);this.port.postMessage({audio,rms},[audio.buffer]);this.samples=[];this.energy=0;}
 process(inputs,outputs){for(const channel of outputs[0]||[])channel.fill(0);const channels=inputs[0];if(!channels?.length)return true;const ratio=sampleRate/24000;
  for(let i=0;i<channels[0].length;i++){let mono=0;for(const channel of channels)mono+=channel[i]/channels.length;let remaining=1;while(remaining>1e-8){const take=Math.min(remaining,ratio-this.weight);this.sum+=mono*take;this.weight+=take;remaining-=take;if(this.weight>=ratio-1e-8){const value=this.sum/ratio;this.samples.push(value);this.energy+=value*value;this.sum=0;this.weight=0;if(this.samples.length>=2400)this.flush();}}}return true;
 }
}
registerProcessor('caption-pcm',CaptionPCM);
