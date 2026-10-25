import fs from 'node:fs/promises';
import {configureProvider,fetchFacts} from '../src/market.mjs';
const file=new URL('../public/data/catalog.json',import.meta.url),u=JSON.parse(await fs.readFile(new URL('../public/data/universe.json',import.meta.url),'utf8'));
configureProvider(u);let saved={companies:[],failures:[]};try{saved=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
const done=new Set([...saved.companies,...saved.failures].map(x=>x.ticker));const todo=u.issuers.filter(p=>!done.has(p.ticker));let cursor=0,completed=done.size;const startedAt=saved.startedAt||new Date().toISOString();
async function checkpoint(){await fs.writeFile(file,JSON.stringify({...saved,asOf:u.asOf,startedAt,updatedAt:new Date().toISOString(),directoryCount:u.total,completed,source:u.source}));}
await Promise.all(Array.from({length:3},async()=>{while(cursor<todo.length){const p=todo[cursor++];try{const c=await fetchFacts(p.ticker);delete c.prices;delete c.peers;saved.companies.push(c);}catch(e){saved.failures.push({ticker:p.ticker,error:e.message});}completed++;if(completed%20===0){await checkpoint();console.log(`${completed}/${u.total}: ${saved.companies.length} returned, ${saved.failures.length} failed`);}await new Promise(r=>setTimeout(r,450));}}));await checkpoint();console.log('Audit complete',completed);
