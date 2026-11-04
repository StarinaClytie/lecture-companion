import {WebSocket,WebSocketServer} from 'ws';
import {languages} from '../src/languages.js';
export function transcriptionConfig(language,env=process.env){
 if(!languages.some(l=>l.id===language))throw new Error('Unsupported lecture language.');
 return {type:'session.update',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},noise_reduction:{type:'far_field'},transcription:{model:env.OPENAI_TRANSCRIPTION_MODEL||'gpt-live-transcribe',languages:[language],delay:'medium'},turn_detection:null}}}};
}
export function relayEvent(event){
 if(event.type==='error'||event.type==='conversation.item.input_audio_transcription.failed')return {type:'error',message:'OpenAI transcription failed. Check model access, credits and connection. Recording is still available.'};
 if(!['input_audio_buffer.committed','conversation.item.input_audio_transcription.delta','conversation.item.input_audio_transcription.completed'].includes(event.type))return null;
 const out={type:event.type};for(const key of ['item_id','previous_item_id','delta','transcript'])if(typeof event[key]==='string')out[key]=event[key];return out;
}
export function attachTranscription(server,{env=process.env,createUpstream=(key)=>new WebSocket('wss://api.openai.com/v1/realtime?intent=transcription',{headers:{Authorization:`Bearer ${key}`},handshakeTimeout:15000})}={}){
 const wss=new WebSocketServer({noServer:true,maxPayload:128*1024});
 server.on('upgrade',(req,socket,head)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname!=='/api/transcribe'){socket.destroy();return;}
  try{if(req.headers.origin){const origin=new URL(req.headers.origin);if(!['http:','https:'].includes(origin.protocol)||!['localhost','127.0.0.1'].includes(origin.hostname))throw Error();}transcriptionConfig(url.searchParams.get('language'),env);}catch{socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}
  if(wss.clients.size>=4){socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,client=>wss.emit('connection',client,url.searchParams.get('language')));
 });
 wss.on('connection',(client,language)=>{
  let upstream,ready=false,bytes=0,closed=false;
  const send=event=>{if(client.readyState===WebSocket.OPEN)client.send(JSON.stringify(event));};
  const close=()=>{if(closed)return;closed=true;clearTimeout(deadline);clearTimeout(lifetime);clearInterval(heartbeat);if(upstream?.readyState===WebSocket.CONNECTING)upstream.terminate();else upstream?.close();};
  const fail=message=>{send({type:'error',message});client.close(1011);close();};
  const deadline=setTimeout(()=>fail('Transcription connection timed out. Recording continues; retry captions.'),20000);
  const lifetime=setTimeout(()=>fail('Transcription connection reached its time limit. Retry captions to continue this lecture.'),55*60*1000);
  let alive=true;
  const heartbeat=setInterval(()=>{if(!alive){client.terminate();close();return;}alive=false;client.ping();},30000);client.on('pong',()=>{alive=true;});
  client.on('close',close);client.on('error',close);
  const key=env.OPENAI_TRANSCRIPTION_API_KEY||env.OPENAI_API_KEY;
  if(!key){fail('OpenAI transcription is not configured. Set OPENAI_API_KEY or OPENAI_TRANSCRIPTION_API_KEY, or select Browser recognition in Settings.');return;}
  try{upstream=createUpstream(key);}catch{fail('Could not connect to OpenAI transcription. Recording continues.');return;}
  upstream.on('open',()=>{if(closed){upstream.close();return;}upstream.send(JSON.stringify(transcriptionConfig(language,env)));});
  upstream.on('message',raw=>{
   if(closed)return;let event;try{event=JSON.parse(raw.toString());}catch{fail('Invalid transcription response. Retry captions.');return;}
   if(event.type==='session.updated'){ready=true;clearTimeout(deadline);send({type:'ready',model:env.OPENAI_TRANSCRIPTION_MODEL||'gpt-live-transcribe'});return;}
   const safe=relayEvent(event);if(safe){send(safe);if(safe.type==='error'){client.close(1011);close();}}
  });
  upstream.on('error',()=>fail('OpenAI transcription connection failed. Check key, credits, model access and network.'));
  upstream.on('close',()=>{if(!closed)fail('OpenAI transcription disconnected. Recording continues; retry captions.');});
  client.on('message',(data,binary)=>{
   if(!ready||closed){if(!closed)fail('Transcription was not ready to receive audio. Retry captions.');return;}
   if(upstream.bufferedAmount>1024*1024){fail('Transcription cannot keep up with the connection. Recording continues.');return;}
   if(binary){if(data.length%2){fail('Invalid audio format.');return;}bytes+=data.length;if(bytes>24000*2*20){fail('Audio turn exceeded the buffering limit. Retry captions.');return;}upstream.send(JSON.stringify({type:'input_audio_buffer.append',audio:data.toString('base64')}));}
   else {let event;try{event=JSON.parse(data.toString());}catch{fail('Invalid transcription command.');return;}if(event.type==='commit'&&bytes>=4800){upstream.send(JSON.stringify({type:'input_audio_buffer.commit'}));bytes=0;}else if(event.type==='commit'&&bytes>0){fail('Audio turn was too short to transcribe.');}else if(event.type!=='commit'){fail('Unsupported transcription command.');}}
  });
 });
 return wss;
}
