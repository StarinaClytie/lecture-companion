import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {homedir,tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeIcon} from './desktop-icon.mjs';
export const shellQuote=s=>"'"+s.replaceAll("'","'\\''")+"'";
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(process.platform!=='darwin')throw new Error('Desktop app creation currently supports macOS only. Use npm run dev on other systems.');
const destination=resolve(process.argv[2]||join(homedir(),'Desktop','Lecture Companion.app'));
if(!destination.endsWith('.app'))throw new Error('Destination must end in .app');
const temp=mkdtempSync(join(tmpdir(),'lecture-icon-'));
try {
 // Recreate only our known generated app; preserve arbitrary existing destinations.
 if(existsSync(destination)&&!existsSync(join(destination,'Contents','Resources','lecture-launcher.json')))throw new Error('Destination already exists. Choose a new .app path.');
 const command=`${shellQuote(process.execPath)} ${shellQuote(join(root,'scripts','launch-local.mjs'))}`;
 const source=`on run\ntry\ndo shell script ${JSON.stringify(command)}\nopen location "http://127.0.0.1:5173/"\non error messageText\ndisplay dialog messageText buttons {"OK"} default button "OK" with title "Lecture Companion"\nend try\nend run\n`;
 const script=join(temp,'launcher.applescript');writeFileSync(script,source);
 mkdirSync(dirname(destination),{recursive:true});
 execFileSync('/usr/bin/osacompile',['-o',destination,script]);
 const resources=join(destination,'Contents','Resources');
 writeFileSync(join(resources,'lecture-launcher.json'),JSON.stringify({root,node:process.execPath}));
 const iconset=join(temp,'AppIcon.iconset');mkdirSync(iconset);
 const png=join(temp,'icon.png');writeFileSync(png,makeIcon(1024));
 for(const size of [16,32,128,256,512])for(const scale of [1,2])execFileSync('/usr/bin/sips',['-z',String(size*scale),String(size*scale),png,'--out',join(iconset,`icon_${size}x${size}${scale===2?'@2x':''}.png`)],{stdio:'ignore'});
 execFileSync('/usr/bin/iconutil',['-c','icns',iconset,'-o',join(resources,'LectureCompanion.icns')]);
 const plist=join(destination,'Contents','Info.plist');
 for(const [key,value] of Object.entries({CFBundleIconFile:'LectureCompanion.icns',CFBundleIdentifier:'local.lecturecompanion.desktop',CFBundleDisplayName:'Lecture Companion',CFBundleVersion:'1.0.1'}))execFileSync('/usr/bin/plutil',['-replace',key,'-string',value,plist]);
 execFileSync('/usr/bin/codesign',['--force','--sign','-',destination],{stdio:'pipe'});
 execFileSync('/usr/bin/codesign',['--verify',destination]);
 execFileSync('/usr/bin/touch',[destination]);
 const register='/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';
 if(existsSync(register))execFileSync(register,['-f',destination]);
 console.log(`Created ${destination}\nDouble-click to start. Re-run this command if you move the project or change Node installations.`);
} finally {rmSync(temp,{recursive:true,force:true});}
