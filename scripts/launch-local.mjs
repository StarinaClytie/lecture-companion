import {spawn} from 'node:child_process';
import {openSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function probe(url){try{return await fetch(url,{signal:AbortSignal.timeout(1500)});}catch{return null;}}
async function ready(){const [page,api]=await Promise.all([probe('http://127.0.0.1:5173/'),probe('http://127.0.0.1:3001/api/status')]);return {page,api,ok:page?.ok&&api?.ok&&(await page.text()).includes('Lecture Companion')};}
try {
 let status=await ready();
 if(!status.ok){
  if(status.page||status.api)throw new Error('Ports 5173/3001 are partially running or occupied. Close the other service and try again.');
  if(!existsSync(join(root,'node_modules','vite')))throw new Error('Dependencies missing. Open the project folder in Terminal and run npm ci first.');
  const logs=join(homedir(),'Library','Logs','Lecture Companion');mkdirSync(logs,{recursive:true});
  const log=openSync(join(logs,'startup.log'),'a');
  const child=spawn(process.execPath,[join(root,'scripts','desktop-services.mjs')],{cwd:root,env:{...process.env,PATH:`${dirname(process.execPath)}:${process.env.PATH||'/usr/bin:/bin'}`},detached:true,stdio:['ignore',log,log]});
  child.unref();
  for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,500));if((await ready()).ok){status.ok=true;break;}}
  if(!status.ok){try{process.kill(-child.pid,'SIGTERM');}catch{}throw new Error(`Startup timed out. See ${logs}/startup.log`);}
 }
 console.log('Lecture Companion ready.');
}catch(error){console.error(error.message);process.exitCode=1;}
