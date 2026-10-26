import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extractFilingNotes} from '../src/filing-notes.mjs';
const u=JSON.parse(await fs.readFile('public/data/universe.json')),audit={startedAt:new Date().toISOString(),scope:'Selected financing, capital and depreciation notes extracted from compatible cached IDX instances; no text-to-financial-value conversion.',issuers:0,files:0,notes:0,omitted:0,characters:0,errors:[]};
for(const {ticker}of u.issuers){const file='public/data/statements/'+ticker+'.json',data=JSON.parse(await fs.readFile(file));let notes=0;
for(const report of data.reports){try{const legacy='../qa/xbrl-v4/'+ticker+'-'+(/TW[123]/i.exec(report.url)?.[0]||'Audit')+'.xml',hashed=legacy.replace(/\.xml$/,'-'+createHash('sha256').update(report.url).digest('hex').slice(0,16)+'.xml');let xml;try{xml=await fs.readFile(hashed,'utf8');}catch{xml=await fs.readFile(legacy,'utf8');}
const current=xml.match(/<(?:[\w-]+:)?context\b[^>]*id=["']CurrentYearInstant["'][^>]*>([\s\S]*?)<\/(?:[\w-]+:)?context>/)?.[1],period=current?.match(/<(?:[\w-]+:)?instant[^>]*>([^<]+)</)?.[1];if(period&&report.periods?.[0]&&period!==report.periods[0])throw Error('Cached note source period mismatch');
const r=extractFilingNotes(xml);report.notes=r.notes;report.noteCoverage={matching:r.matching,omitted:r.omitted,characters:r.characters,scope:r.scope};audit.files++;audit.notes+=r.notes.length;audit.omitted+=r.omitted;audit.characters+=r.characters;notes+=r.notes.length;
}catch(error){audit.errors.push({ticker,url:report.url,error:error.message});}}
if(notes)audit.issuers++;await fs.writeFile(file,JSON.stringify(data));if(audit.files%100===0)console.log(JSON.stringify({files:audit.files,issuers:audit.issuers,notes:audit.notes}));}
audit.completedAt=new Date().toISOString();await fs.writeFile('../qa/filing-notes53.json',JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));

await import('./update-source-index.mjs');
