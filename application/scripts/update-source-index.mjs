import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const index=JSON.parse(await fs.readFile('public/data/statement-index.json')),u=JSON.parse(await fs.readFile('public/data/universe.json'));
let bytes=0,gzipBytes=0,issuers=0,notes=0,characters=0,omitted=0;
for(const {ticker}of u.issuers){const raw=await fs.readFile('public/data/statements/'+ticker+'.json'),data=JSON.parse(raw);bytes+=raw.length;gzipBytes+=gzipSync(raw,{level:9}).length;let count=0;for(const r of data.reports){count+=(r.notes||[]).length;notes+=(r.notes||[]).length;characters+=(r.notes||[]).reduce((s,n)=>s+n.text.length,0);omitted+=r.noteCoverage?.omitted||0;}if(count)issuers++;}
Object.assign(index.totals,{bytes,gzipBytes});index.noteCoverage={...index.noteCoverage,issuers,notes,characters,omitted,scope:'Selected consolidated financing, capital and depreciation text excerpts; not automatic financial inputs or complete PDF/notes coverage.'};await fs.writeFile('public/data/statement-index.json',JSON.stringify(index));console.log(JSON.stringify({bytes,gzipBytes,notes,issuers}));
