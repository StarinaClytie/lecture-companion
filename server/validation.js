import {languages} from '../src/languages.js';
export function validateRequest(body) {
 if(!body||typeof body!=='object')throw new Error('Invalid question.');
 const scope=body.scope||'selection',transcript=body.transcript||'';
 if(!['selection','lecture'].includes(scope))throw new Error('Invalid question scope.');
 if(scope==='lecture'){
  if(typeof transcript!=='string'||!transcript.trim()||transcript.length>200000)throw new Error('Whole-lecture questions support up to 200,000 characters. Select a passage for a focused question instead.');
  if(typeof body.question!=='string'||!body.question.trim())throw new Error('Enter a question about the lecture.');
 }else if(typeof body.sentence!=='string'||!body.sentence.trim()||body.sentence.length>24000)throw new Error('Choose a passage of 1–24,000 characters.');
 const {sentence='',context='',question='',history=[],nativeLanguage='zh',focus=''}=body;
 if(typeof context!=='string'||context.length>16000||typeof question!=='string'||question.length>2000||!Array.isArray(history)||history.length>12) throw new Error('The question or context is too long. Start a new question.');
 if(history.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>6000)) throw new Error('Invalid conversation history.');
 if(typeof focus!=='string'||focus.length>2000)throw new Error('Highlighted text must be at most 2,000 characters.');
 if(!languages.some(l=>l.id===nativeLanguage))throw new Error('Choose a supported native language.');
 return {sentence:scope==='selection'?sentence.trim():'',context,question:question.trim(),history,nativeLanguage,focus,scope,transcript:scope==='lecture'?transcript:''};
}
