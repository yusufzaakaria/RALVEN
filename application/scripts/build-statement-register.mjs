// Preserve every numeric, non-dimensional consolidated XBRL fact separately
// from normalized model inputs. A nil disclosure is retained as unreported.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {parseIdxInstance} from '../src/filings.mjs';
import {evidenceBundle} from '../src/evidence.mjs';
const packed=JSON.parse(await fs.readFile('public/data/evidence.json'));
const directory=JSON.parse(await fs.readFile('public/data/universe.json'));
const output='public/data/statements';await fs.mkdir(output,{recursive:true});
const incremental=process.argv.includes('--incremental');
const summary=incremental?JSON.parse(await fs.readFile('public/data/statement-index.json')):{schema:'RALVEN-STATEMENTS-1',updatedAt:new Date().toISOString(),scope:'All numeric non-dimensional consolidated facts in available cached IDX instances; nil values retained as unreported. Not a complete PDF/notes or segment extraction.',companies:{}};
const taxonomy=incremental?JSON.parse(await fs.readFile('public/data/statement-taxonomy.json')):[],taxonomyMap=new Map(taxonomy.map((t,i)=>[t,i]));
let bytes=0,gzipBytes=0,files=0,facts=0,nil=0;
for(const issuer of directory.issuers){
 const ticker=issuer.ticker,b=evidenceBundle(packed,ticker),reports=[],errors=[];
 if(incremental&&summary.companies[ticker]?.reports===[...new Set((b.filings||[]).map(f=>f.url))].length)continue;
 for(const f of [...new Map((b.filings||[]).filter(f=>f.url).map(f=>[f.url,f])).values()]){
  try{
   const legacy='../qa/xbrl-v4/'+ticker+'-'+(f.reportPeriod||(/TW[123]/i.exec(f.url)?.[0]||'Audit'))+'.xml',hashed=legacy.replace(/\.xml$/,'-'+createHash('sha256').update(f.url).digest('hex').slice(0,16)+'.xml');
   let xml;try{xml=await fs.readFile(hashed,'utf8');}catch{xml=await fs.readFile(legacy,'utf8');}
   const parsed=parseIdxInstance(xml,{ticker,url:f.url,publishedAt:f.publishedAt,retrievedAt:b.observations?.find(o=>o.url===f.url)?.retrievedAt||b.retrievedAt,includeStatements:true});
   if(f.periods?.length&&parsed.periods[0]!==[...f.periods].sort().at(-1))throw Error('Cache does not match original filing period');
   const columns=[],columnMap=new Map(),rows=[],unreportedColumns={},seen=new Set();
   for(const fact of [...parsed.statement.facts,...parsed.statement.unreported]){
    if(!taxonomyMap.has(fact.tag)){taxonomyMap.set(fact.tag,taxonomy.length);taxonomy.push(fact.tag);}
    const ck=[fact.context,fact.period,fact.start,fact.unit].join('|');if(!columnMap.has(ck)){columnMap.set(ck,columns.length);columns.push({context:fact.context,period:fact.period,start:fact.start,unit:fact.unit});}
    const row=[taxonomyMap.get(fact.tag),columnMap.get(ck),fact.value],key=JSON.stringify(row);if(seen.has(key))continue;seen.add(key);if(fact.value===null)(unreportedColumns[row[1]]??=[]).push(row[0]);else rows.push(row);
   }
   const numeric=rows.length,unreported=Object.values(unreportedColumns).reduce((s,ids)=>s+ids.length,0);facts+=numeric;nil+=unreported;files++;
   reports.push({url:f.url,publishedAt:f.publishedAt||null,retrievedAt:parsed.retrievedAt,periods:parsed.periods,columns,rows,nil:unreportedColumns,capitalSchedule:parsed.statement.capitalSchedule,notes:parsed.statement.notes||[],noteCoverage:parsed.statement.noteCoverage,numeric,unreported});
  }catch(e){errors.push({url:f.url,message:e.message});}
 }
 const content=JSON.stringify({ticker,reports,errors,scope:summary.scope}),size=Buffer.byteLength(content);bytes+=size;gzipBytes+=gzipSync(content,{level:9}).length;
 await fs.writeFile(output+'/'+ticker+'.json',content);
 summary.companies[ticker]={reports:reports.length,numeric:reports.reduce((s,r)=>s+r.numeric,0),unreported:reports.reduce((s,r)=>s+r.unreported,0),errors,periods:[...new Set(reports.flatMap(r=>r.periods))].sort().reverse()};
 if(Object.keys(summary.companies).length%100===0)console.log(JSON.stringify({issuers:Object.keys(summary.companies).length,files,facts}));
}
bytes=0;gzipBytes=0;files=0;facts=0;nil=0;
for(const issuer of directory.issuers){const raw=await fs.readFile(output+'/'+issuer.ticker+'.json');bytes+=raw.length;gzipBytes+=gzipSync(raw,{level:9}).length;const record=JSON.parse(raw);for(const report of record.reports){files++;facts+=report.numeric;nil+=report.unreported;}}
summary.updatedAt=new Date().toISOString();summary.totals={issuers:directory.issuers.length,withReports:Object.values(summary.companies).filter(c=>c.reports>0).length,files,facts,unreported:nil,bytes,gzipBytes};
await fs.writeFile('public/data/statement-taxonomy.json',JSON.stringify(taxonomy));await fs.writeFile('public/data/statement-index.json',JSON.stringify(summary));console.log(JSON.stringify(summary.totals));
