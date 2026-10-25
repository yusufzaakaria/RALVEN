import {evidenceBundle,packEvidenceCatalog} from '../src/evidence.mjs';
import fs from 'node:fs/promises';
import {historicalFx} from '../src/market.mjs';
import {fetchIdxFiling} from '../src/filings.mjs';
const args=process.argv.slice(2),all=args.includes('--all'),retry=args.includes('--retry-latest'),latest=args.includes('--latest')||retry,year=2025;
const catalog=JSON.parse(await fs.readFile('public/data/catalog.json','utf8'));let evidence={schema:'RALVEN-EVIDENCE-1',companies:{}};
try{evidence=JSON.parse(await fs.readFile('public/data/evidence.json','utf8'));}catch{}
if(evidence.schema==='RALVEN-EVIDENCE-PACKED-1')evidence={...evidence,schema:'RALVEN-EVIDENCE-1',companies:Object.fromEntries(Object.keys(evidence.companies).map(t=>[t,evidenceBundle(evidence,t)]))};
const subjects=retry?catalog.companies.filter(c=>evidence.companies[c.ticker]?.attempts.some(a=>a.source==='IDX latest filing'&&['failed','partial'].includes(a.status))):all||latest?catalog.companies:catalog.companies.filter(c=>args.includes(c.ticker));let cursor=0,done=0;
async function save(){evidence.updatedAt=new Date().toISOString();await fs.writeFile('public/data/evidence.json',JSON.stringify(packEvidenceCatalog(evidence)));}
async function worker(){while(cursor<subjects.length){const c=subjects[cursor++],previous=evidence.companies[c.ticker]||{observations:[],filings:[],attempts:[]};if(all&&!latest&&previous.attempts.some(x=>x.source==='IDX annual XBRL'&&x.status==='available')){done++;continue;}
 if(retry)await new Promise(resolve=>setTimeout(resolve,400));const attempts=[],fresh=[];for(const [label,y,period]of [...(!latest?[['IDX annual XBRL',Number(c.period?.slice(0,4))||year,'audit']]:[]),...(!all||latest?[['IDX latest filing',new Date().getUTCFullYear(),'']]:[])]){
  try{const d=await fetchIdxFiling(c.ticker,y,period);attempts.push({source:label,status:d.freshnessIssue?'partial':d.status,message:d.freshnessIssue||d.message||'Consolidated XBRL extracted',at:new Date().toISOString()});if(d.status==='available')fresh.push(d);}catch(err){attempts.push({source:label,status:'failed',message:err.message,at:new Date().toISOString()});}
 }
 const fx=[...(previous.fx||[])];for(const o of fresh.flatMap(d=>d.observations)){if(o.currency==='IDR'||[...(c.fx||[]),...fx].some(f=>f.currency===o.currency&&f.date<=o.period&&Date.parse(o.period)-Date.parse(f.date)<14*86400000))continue;try{fx.push(await historicalFx(o.currency,o.period));}catch(e){attempts.push({source:'FX '+o.currency+' '+o.period,status:'failed',message:e.message,at:new Date().toISOString()});}}
 evidence.companies[c.ticker]={fx,retrievedAt:new Date().toISOString(),observations:[...(previous.observations||[]).filter(o=>latest||o.sourceId!=='idx-xbrl'),...fresh.flatMap(d=>d.observations)],filings:[...(latest?previous.filings:[]),...fresh.map(({url,publishedAt,periods,reportPeriod})=>({url,publishedAt,periods,reportPeriod}))],attempts:[...(latest?previous.attempts.filter(a=>a.source!=='IDX latest filing'):[]),...attempts]};done++;
 if(done%20===0){await save();console.log(`${done}/${subjects.length} processed`);}
 }}
await Promise.all(Array.from({length:all?3:2},worker));await save();
console.log(JSON.stringify({processed:subjects.length,available:Object.values(evidence.companies).filter(x=>x.observations.some(o=>o.sourceId==='idx-xbrl')).length,failures:Object.values(evidence.companies).filter(x=>x.attempts.some(a=>a.status==='failed')).length}));
