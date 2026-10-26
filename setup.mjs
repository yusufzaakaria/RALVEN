import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
const repo=path.dirname(fileURLToPath(import.meta.url));
const zip=await fs.readFile(path.join(repo,'RALVEN_Application_5.4.0.zip'));
const expected='b9f47001381204d3a437b7ccec9114a0d768661dd1ca5e36ab5d2cbba6cc4886';
if(createHash('sha256').update(zip).digest('hex')!==expected)throw Error('The archive differs from the verified baseline. Review a new package before changing this checksum.');
const root=path.join(repo,'application');let end=-1;
for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--)if(zip.readUInt32LE(i)===0x06054b50){end=i;break;}
if(end<0)throw Error('ZIP directory unavailable.');
let cursor=zip.readUInt32LE(end+16),written=0;
for(let n=0;n<zip.readUInt16LE(end+10);n++){
 if(zip.readUInt32LE(cursor)!==0x02014b50)throw Error('Invalid ZIP directory.');
 const flags=zip.readUInt16LE(cursor+8),method=zip.readUInt16LE(cursor+10),packed=zip.readUInt32LE(cursor+20),unpacked=zip.readUInt32LE(cursor+24),nameLength=zip.readUInt16LE(cursor+28),extraLength=zip.readUInt16LE(cursor+30),commentLength=zip.readUInt16LE(cursor+32),local=zip.readUInt32LE(cursor+42),name=zip.subarray(cursor+46,cursor+46+nameLength).toString('utf8');
 cursor+=46+nameLength+extraLength+commentLength;
 if(name.startsWith('submission/')||name==='README.md')continue;
 if(flags&1||![0,8].includes(method)||unpacked>100*1024*1024)throw Error('Unsupported ZIP entry: '+name);
 const target=path.resolve(root,name);if(!target.startsWith(root+path.sep)||name.includes('\\')||path.isAbsolute(name))throw Error('Unsafe ZIP path.');
 if(name.endsWith('/')){await fs.mkdir(target,{recursive:true});continue;}
 if(zip.readUInt32LE(local)!==0x04034b50)throw Error('Invalid local ZIP entry.');
 const start=local+30+zip.readUInt16LE(local+26)+zip.readUInt16LE(local+28),body=zip.subarray(start,start+packed),data=method===8?inflateRawSync(body):body;
 if(data.length!==unpacked)throw Error('ZIP size mismatch: '+name);
 const existing=await fs.readFile(target).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 if(existing&&!existing.equals(data))throw Error('Preserving a modified file: '+target+'. Move it aside before running setup.');
 if(!existing){await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data);written++;}
}
console.log('RALVEN application archive verified. '+written+' files materialized in application/.');
console.log('Run: cd application && node server.mjs');
