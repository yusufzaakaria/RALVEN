import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extractCapitalSchedule,capitalScheduleScope} from '../src/capital-schedule.mjs';
import {packEvidenceCatalog,evidenceBundle} from '../src/evidence.mjs';
const packed=JSON.parse(await fs.readFile('public/data/evidence.json')),universe=JSON.parse(await fs.readFile('public/data/universe.json'));
const evidence={...packed,schema:'RALVEN-EVIDENCE-1',companies:Object.fromEntries(Object.keys(packed.companies).map(t=>[t,evidenceBundle(packed,t)]))};
const audit={schema:'RALVEN-CAPITAL-AUDIT-1',startedAt:new Date().toISOString(),scope:capitalScheduleScope,files:0,rows:0,observations:0,issuers:0,results:[],errors:[]};
for(const {ticker}of universe.issuers){
 const file='public/data/statements/'+ticker+'.json',data=JSON.parse(await fs.readFile(file)),bundle=evidence.companies[ticker];let count=0;
 for(const report of data.reports){try{
  const legacy='../qa/xbrl-v4/'+ticker+'-'+(/TW[123]/i.exec(report.url)?.[0]||'Audit')+'.xml',hashed=legacy.replace(/\.xml$/,'-'+createHash('sha256').update(report.url).digest('hex').slice(0,16)+'.xml');let xml;try{xml=await fs.readFile(hashed,'utf8');}catch{xml=await fs.readFile(legacy,'utf8');}
  const current=xml.match(/<(?:[\w-]+:)?context\b[^>]*id=["']CurrentYearInstant["'][^>]*>([\s\S]*?)<\/(?:[\w-]+:)?context>/)?.[1],period=current?.match(/<(?:[\w-]+:)?instant[^>]*>([^<]+)</)?.[1];
  if(!period||period!==report.periods?.[0])throw Error('Cached capital source period mismatch');
  const result=extractCapitalSchedule(xml,{ticker,url:report.url,publishedAt:report.publishedAt,retrievedAt:report.retrievedAt});report.capitalSchedule={rows:result.rows,scope:result.scope};
  if(bundle)bundle.observations=[...bundle.observations.filter(o=>o.sourceId!=='idx-capital-schedule'||o.url!==report.url),...result.observations];
  audit.files++;audit.rows+=result.rows.length;audit.observations+=result.observations.length;count+=result.observations.length;
  audit.results.push({ticker,url:report.url,period,observations:result.observations.length,periods:result.observations.map(o=>o.period),supported:result.rows.filter(x=>x.status==='SUPPORTED ZERO').length,review:result.rows.filter(x=>x.status==='REVIEW').length,conflicts:result.rows.filter(x=>x.status==='CONFLICT').length});
 }catch(error){audit.errors.push({ticker,url:report.url,error:error.message});}}
 if(count)audit.issuers++;await fs.writeFile(file,JSON.stringify(data));
 if(audit.files%200<2)console.log(JSON.stringify({files:audit.files,observations:audit.observations,issuers:audit.issuers}));
}
audit.completedAt=new Date().toISOString();evidence.updatedAt=audit.completedAt;
await fs.writeFile('public/data/evidence.json',JSON.stringify(packEvidenceCatalog(evidence)));
await fs.writeFile('public/data/capital-audit.json',JSON.stringify(audit));
await fs.writeFile('../qa/capital54-audit.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify({...audit,results:undefined}));
await import('./update-source-index.mjs');
