import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evidenceBundle,packEvidenceCatalog} from '../src/evidence.mjs';
import {parseIdxInstance,unzipInstance} from '../src/filings.mjs';
const packed=JSON.parse(await fs.readFile('public/data/evidence.json'));
const evidence={...packed,schema:'RALVEN-EVIDENCE-1',companies:Object.fromEntries(Object.keys(packed.companies).map(t=>[t,evidenceBundle(packed,t)]))};
const args=process.argv.slice(2),subjects=Object.keys(evidence.companies).filter(t=>args.includes('--retry')?evidence.companies[t].attempts.some(a=>a.source==='IDX expanded mapping'&&a.status==='failed'):!args.length||args.includes(t));
let cursor=0,done=0,success=0,failed=0,writing=Promise.resolve();
const cache='../qa/xbrl-v4';await fs.mkdir(cache,{recursive:true});
async function save(){evidence.updatedAt=new Date().toISOString();const snapshot=JSON.stringify(packEvidenceCatalog(evidence));writing=writing.then(()=>fs.writeFile('public/data/evidence.json',snapshot));await writing;}
async function worker(){while(cursor<subjects.length){const ticker=subjects[cursor++],b=evidence.companies[ticker];b.attempts=b.attempts.filter(a=>a.source!=='IDX expanded mapping');
 const files=[...new Map((b.filings||[]).filter(f=>f.url).map(f=>[f.url,f])).values()];
 for(const f of files){try{
  const legacyName=cache+'/'+ticker+'-'+(f.reportPeriod||(/TW[123]/i.exec(f.url)?.[0]||'Audit'))+'.xml',name=legacyName.replace(/\.xml$/, '-'+createHash('sha256').update(f.url).digest('hex').slice(0,16)+'.xml');let xml;
  try{xml=await fs.readFile(name,'utf8');}catch{try{const candidate=await fs.readFile(legacyName,'utf8'),periods=parseIdxInstance(candidate,{ticker,url:f.url,publishedAt:f.publishedAt}).periods;if(!f.periods?.length||periods[0]!==[...f.periods].sort().at(-1))throw Error('Legacy cache belongs to a different report period');xml=candidate;await fs.writeFile(name,xml);}catch{let lastError;for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(f.url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error('HTTP '+response.status);xml=await unzipInstance(await response.arrayBuffer());lastError=null;break;}catch(e){lastError=e;await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}}if(lastError)throw lastError;await fs.writeFile(name,xml);}}
  const d=parseIdxInstance(xml,{ticker,url:f.url,publishedAt:f.publishedAt,retrievedAt:b.observations.find(o=>o.url===f.url&&o.retrievedAt)?.retrievedAt||b.retrievedAt});
  b.observations=[...b.observations.filter(o=>o.sourceId!=='idx-xbrl'||o.url!==f.url),...d.observations];success++;
 }catch(e){failed++;b.attempts.push({source:'IDX expanded mapping',status:'failed',message:e.message,at:new Date().toISOString()});}}
 done++;if(done%50===0){await save();console.log(JSON.stringify({done,total:subjects.length,files:success,failed}));}
}}
await Promise.all(Array.from({length:4},worker));await save();console.log(JSON.stringify({done,files:success,failed}));
