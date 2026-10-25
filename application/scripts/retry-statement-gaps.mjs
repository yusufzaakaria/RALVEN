import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evidenceBundle,packEvidenceCatalog} from '../src/evidence.mjs';
import {fetchIdxFiling,unzipInstance} from '../src/filings.mjs';
import {historicalFx} from '../src/market.mjs';
const packed=JSON.parse(await fs.readFile('public/data/evidence.json'));
const evidence={...packed,schema:'RALVEN-EVIDENCE-1',companies:Object.fromEntries(Object.keys(packed.companies).map(t=>[t,evidenceBundle(packed,t)]))};
const universe=JSON.parse(await fs.readFile('public/data/universe.json'));
const subjects=universe.issuers.filter(i=>!evidence.companies[i.ticker]?.observations?.some(o=>o.sourceType==='primary'));
const audit={startedAt:new Date().toISOString(),scope:'Retry annual filing lookup for missing-primary issuers in 2024, 2025 and 2026; non-calendar fiscal years included',results:[]};
let cursor=0;
async function worker(){while(cursor<subjects.length){const {ticker}=subjects[cursor++],bundle=evidence.companies[ticker]||{observations:[],filings:[],attempts:[],fx:[]},result={ticker,attempts:[],recovered:0};
 for(const year of [2025,2026,2024]){try{const d=await fetchIdxFiling(ticker,year,'audit');result.attempts.push({year,status:d.status,message:d.message||'Consolidated facts retrieved'});if(d.status!=='available')continue;
  const response=await fetch(d.url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error('Cache download HTTP '+response.status);const xml=await unzipInstance(await response.arrayBuffer());const legacy='../qa/xbrl-v4/'+ticker+'-Audit.xml',name=legacy.replace(/\.xml$/,'-'+createHash('sha256').update(d.url).digest('hex').slice(0,16)+'.xml');await fs.writeFile(name,xml);
  bundle.observations=[...(bundle.observations||[]).filter(o=>o.url!==d.url),...d.observations];bundle.filings=[...(bundle.filings||[]).filter(f=>f.url!==d.url),{url:d.url,publishedAt:d.publishedAt,periods:d.periods,reportPeriod:d.reportPeriod}];bundle.retrievedAt=new Date().toISOString();result.recovered++;
  for(const o of d.observations){if(o.currency==='IDR'||bundle.fx?.some(f=>f.currency===o.currency&&f.date<=o.period&&Date.parse(o.period)-Date.parse(f.date)<14*86400000))continue;try{(bundle.fx??=[]).push(await historicalFx(o.currency,o.period));}catch(e){result.attempts.push({year,status:'FX unavailable',message:e.message});}}
 }catch(e){result.attempts.push({year,status:'failed',message:e.message});}}
 bundle.attempts=[...(bundle.attempts||[]).filter(a=>a.source!=='IDX annual gap retry'),{source:'IDX annual gap retry',status:result.recovered?'available':result.attempts.some(a=>a.status==='failed')?'failed':'unavailable',message:result.attempts.map(a=>a.year+': '+a.status+' '+(a.message||'')).join('; '),at:new Date().toISOString()}];evidence.companies[ticker]=bundle;audit.results.push(result);console.log(JSON.stringify(result));
}}
await Promise.all(Array.from({length:3},worker));evidence.updatedAt=new Date().toISOString();audit.completedAt=evidence.updatedAt;audit.recoveredIssuers=audit.results.filter(r=>r.recovered).length;await fs.writeFile('public/data/evidence.json',JSON.stringify(packEvidenceCatalog(evidence)));await fs.writeFile('../qa/statement-gap-retry42.json',JSON.stringify(audit,null,2));console.log(JSON.stringify({issuers:subjects.length,recovered:audit.recoveredIssuers}));
