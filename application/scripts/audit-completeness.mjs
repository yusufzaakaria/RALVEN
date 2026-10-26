import {createSnapshotService} from '../src/snapshot-service.mjs';
import {release} from '../src/release.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {prepareEvidence,evidenceBundle} from '../src/evidence.mjs';
import {analyzeCompany,assumptions,selectPeers} from '../src/research.mjs';
import {sensitivityMatrix,valuationTornado} from '../src/sensitivity.mjs';
import {simulate} from '../src/simulation.mjs';
const read=async name=>JSON.parse(await fs.readFile('public/data/'+name+'.json'));
const [raw,evidence,universe,statements]=await Promise.all(['catalog','evidence','universe','statement-index'].map(read));
const service=createSnapshotService(async key=>key.startsWith('/data/evidence/')?evidenceBundle(evidence,key.split('/').at(-1).slice(0,4)):JSON.parse(await fs.readFile('public'+key,'utf8'))),rows=[],failures=[];
for(const profile of universe.issuers){
 const c=await service.getCompany(profile.ticker).catch(()=>null),source=statements.companies[profile.ticker];
 if(!c){rows.push({ticker:profile.ticker,statementReports:source?.reports||0,modelAvailable:0,modelApplicable:0,missing:['provider record'],sensitivity:false,tornado:false,reason:'No supported provider record'});continue;}
 const a=assumptions(c),r=analyzeCompany(c,a,{grid:false}),matrix=sensitivityMatrix(c,a,r),drivers=valuationTornado(c,a,r),applicable=c.evidence.rows.filter(x=>x.availability!=='not-applicable'),available=applicable.filter(x=>Number.isFinite(x.selected)&&!['CONFLICT','DEFINITION'].includes(x.status)&&x.availability!=='scale-conflict');
 const simulation=matrix.available?simulate(c,a,r,{count:100,seed:42}):null;
 if(matrix.available){
  try{assert.ok(Math.abs(matrix.values[2][2]-r.fair)<Math.max(1e-6,Math.abs(r.fair)*1e-9));assert.equal(matrix.values.length,5);assert.ok(matrix.values.every(row=>row.length===5));assert.ok(drivers.length>=2);assert.ok(drivers.every(d=>Number.isFinite(d.low)||Number.isFinite(d.high)));assert.ok(drivers.every(d=>Number.isFinite(d.impact)));assert.ok(simulation?.accepted>0);assert.equal(simulation.accepted+simulation.rejected,100);assert.equal(simulation.histogram.reduce((s,b)=>s+b.count,0),simulation.accepted);}catch(e){failures.push({ticker:c.ticker,message:e.message});}
 }
 rows.push({ticker:c.ticker,name:c.name,period:c.period,basis:c.periodBasis||'ANNUAL',method:r.engine,recommendation:r.recommendation,statementReports:source?.reports||0,sourceNumericFacts:source?.numeric||0,modelAvailable:available.length,modelApplicable:applicable.length,missing:applicable.filter(x=>!available.includes(x)).map(x=>({field:x.field,status:x.displayStatus,reason:x.reason})),sensitivity:matrix.available,tornado:drivers.length>0,monteCarlo:!!simulation,driverCount:drivers.length,reason:matrix.available?matrix.description:matrix.reason,requirements:r.decision.requirements});
}
const summary={engine:release.engine,updatedAt:new Date().toISOString(),issuers:rows.length,sourceArchive:statements.totals,modelFieldsComplete:rows.filter(x=>x.modelApplicable>0&&x.modelAvailable===x.modelApplicable).length,eligibleSensitivity:rows.filter(x=>x.sensitivity).length,eligibleTornado:rows.filter(x=>x.tornado).length,eligibleMonteCarlo:rows.filter(x=>x.monteCarlo).length,chartUnavailable:rows.filter(x=>!x.sensitivity).length,methodCounts:rows.reduce((s,r)=>(s[r.method||'unavailable']=(s[r.method||'unavailable']||0)+1,s),{}),failures};
await fs.writeFile('public/data/completeness.json',JSON.stringify({summary,issuers:rows}));await fs.writeFile('../qa/completeness42.json',JSON.stringify({summary,issuers:rows},null,2));
const keys=['ticker','period','basis','method','recommendation','statementReports','sourceNumericFacts','modelAvailable','modelApplicable','sensitivity','tornado','driverCount','missing','reason'];await fs.writeFile('public/data/completeness.csv','\ufeff'+[keys,...rows.map(r=>keys.map(k=>typeof r[k]==='object'?JSON.stringify(r[k]):r[k]??''))].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'));
console.log(JSON.stringify(summary));if(failures.length)process.exitCode=1;
