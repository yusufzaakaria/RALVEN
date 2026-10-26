// Refresh only supplemental statements. Quotes and original IDX filings retain
// their own dates; no recommendation or missing value is synthesized here.
import fs from 'node:fs/promises';
import {fetchPeriodicFacts} from '../src/market.mjs';
import {packEvidenceCatalog,evidenceBundle} from '../src/evidence.mjs';
import {valuationDateToday} from '../src/release.mjs';
const packed=JSON.parse(await fs.readFile('public/data/evidence.json')),universe=JSON.parse(await fs.readFile('public/data/universe.json'));
const evidence={...packed,schema:'RALVEN-EVIDENCE-1',companies:Object.fromEntries(Object.keys(packed.companies).map(t=>[t,evidenceBundle(packed,t)]))},args=process.argv.slice(2),subjects=universe.issuers.filter(x=>!args.length||args.includes(x.ticker));
const audit={scope:'Supplemental Yahoo-reported TTM flows and quarter-end balances; no current quote refresh or complete-filing claim.',valuationDate:valuationDateToday(),startedAt:new Date().toISOString(),results:[]};let cursor=0,writing=Promise.resolve();
async function save(){const snapshot=JSON.stringify(packEvidenceCatalog(evidence)),report=JSON.stringify(audit,null,2);writing=writing.then(async()=>{await fs.writeFile('public/data/evidence.json',snapshot);await fs.writeFile('../qa/periodic-refresh53.json',report);});await writing;}
async function worker(){while(cursor<subjects.length){const ticker=subjects[cursor++].ticker,b=evidence.companies[ticker]||{observations:[],filings:[],attempts:[],fx:[]};let row;
 try{const fetched=await fetchPeriodicFacts(ticker,{valuationDate:audit.valuationDate}),facts=fetched.observations;row={ticker,status:fetched.issues.length?'partial':facts.length?'available':'unavailable',observations:facts.length,periods:[...new Set(facts.map(x=>x.period))].sort().reverse(),issues:fetched.issues,at:new Date().toISOString()};if(facts.length)b.observations=[...(b.observations||[]).filter(x=>x.sourceId!=='yahoo-periodic'),...facts];}
 catch(error){row={ticker,status:'failed',observations:0,message:error.message,at:new Date().toISOString()};}
 b.attempts=[...(b.attempts||[]).filter(x=>x.source!=='Yahoo periodic statements'),{source:'Yahoo periodic statements',status:row.status,message:row.message||row.observations+' explicit dated observations. Original quote/filing dates unchanged; absence is not zero.',at:row.at}];evidence.companies[ticker]=b;audit.results.push(row);
 if(audit.results.length%25===0)console.log(JSON.stringify({completed:audit.results.length,total:subjects.length,available:audit.results.filter(x=>x.observations>0).length,failed:audit.results.filter(x=>x.status==='failed').length}));if(audit.results.length%100===0)await save();await new Promise(resolve=>setTimeout(resolve,250));
 }}
await Promise.all(Array.from({length:2},worker));audit.completedAt=new Date().toISOString();audit.summary={requested:subjects.length,available:audit.results.filter(x=>x.observations>0).length,observations:audit.results.reduce((s,x)=>s+x.observations,0),failed:audit.results.filter(x=>x.status==='failed').length,unavailable:audit.results.filter(x=>x.status==='unavailable').length};evidence.updatedAt=audit.completedAt;await save();console.log(JSON.stringify(audit.summary));
