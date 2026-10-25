import fs from 'node:fs/promises';
import {normalizeDirectory} from '../src/directory.mjs';
import {sectorFor} from '../src/market.mjs';
const directory=normalizeDirectory(JSON.parse(await fs.readFile('../qa/idx-directory-live-v5.json'))),profiles=new Map(directory.issuers.map(x=>[x.ticker,x])),catalog=JSON.parse(await fs.readFile('public/data/catalog.json'));
catalog.companies=catalog.companies.map(c=>{const p=profiles.get(c.ticker);return p?{...c,...p,sector:sectorFor(p),profileUpdatedAt:directory.updatedAt}:c;});
await fs.writeFile('public/data/universe.json',JSON.stringify(directory));await fs.writeFile('public/data/catalog.json',JSON.stringify(catalog));console.log('Synced '+directory.total+' current IDX profiles; financial/quote retrieval dates retained.');
