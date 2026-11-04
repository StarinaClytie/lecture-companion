import {timestamp} from './lecture.js';
export function lectureTranscript(rows){return rows.map(r=>`[${timestamp(r.time)}] ${r.text}`).join('\n');}
