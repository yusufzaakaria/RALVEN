import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {evidenceBundle} from './src/evidence.mjs';
import {release} from './src/release.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));process.chdir(root);
const files={};
function add(url,raw,type){const compressed=/\.json$|\.csv$/.test(url),body=compressed?gzipSync(raw,{level:9}):raw;files[url]={body:body.toString('base64'),...(compressed?{encoding:'gzip'}:{}),type};}
async function collect(dir,prefix=''){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name),url=prefix+'/'+entry.name;if(entry.isDirectory()){await collect(p,url);continue;}if(url==='/data/evidence.json')continue;const type=entry.name.endsWith('.html')?'text/html; charset=utf-8':/\.m?js$/.test(entry.name)?'text/javascript; charset=utf-8':entry.name.endsWith('.css')?'text/css; charset=utf-8':entry.name.endsWith('.woff2')?'font/woff2':entry.name.endsWith('.png')?'image/png':entry.name.endsWith('.json')?'application/json':entry.name.endsWith('.csv')?'text/csv; charset=utf-8':'application/octet-stream';add(url,await fs.readFile(p),type);}}
await collect('public');await collect('src','/src');
const evidence=JSON.parse(await fs.readFile('public/data/evidence.json'));for(const ticker of Object.keys(evidence.companies))add('/data/evidence/'+ticker+'.json',Buffer.from(JSON.stringify(evidenceBundle(evidence,ticker))),'application/json');
add('/data/release.json',Buffer.from(JSON.stringify(release)),'application/json');
const provider=(await Promise.all(['src/release.mjs','src/directory.mjs','src/method-registry.mjs','src/prices.mjs','src/comparables.mjs','src/filing-notes.mjs','src/capital-schedule.mjs','src/filings.mjs','src/capital-evidence.mjs','src/legacy-inputs.mjs','src/evidence.mjs','src/periodic-provider.mjs','src/market.mjs','src/snapshot-service.mjs'].map(p=>fs.readFile(p,'utf8')))).join('\n').replace(/^import .*$/gm,'');
const worker=provider.replace(/export /g,'')+'\nconst assets='+JSON.stringify(files)+';\n'+await fs.readFile('worker/runtime.mjs','utf8');
await fs.mkdir('worker',{recursive:true});await fs.writeFile('worker/index.js',worker);await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});await fs.writeFile('dist/server/index.js',worker);await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built RALVEN '+release.engine+' / '+Object.keys(files).length+' assets / '+Math.round(Buffer.byteLength(worker)/1024)+' KB; per-issuer evidence loads on demand.');
