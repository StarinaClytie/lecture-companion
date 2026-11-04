import {spawn} from 'node:child_process';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const children=[spawn(process.execPath,['--env-file-if-exists=.env','server/index.js'],{cwd:root,stdio:'inherit'}),spawn(process.execPath,[join(root,'node_modules','vite','bin','vite.js'),'--host','127.0.0.1','--strictPort'],{cwd:root,stdio:'inherit'})];
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),500).unref();}
for(const child of children){child.on('error',error=>{console.error(error.message);stop(1)});child.on('exit',code=>stop(code||0));}
process.on('SIGTERM',()=>stop());process.on('SIGINT',()=>stop());
