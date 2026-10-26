import test from 'node:test';
import assert from 'node:assert/strict';
import {statementCapitalWorkbook,registerStatementSnapshot,capitalScheduleMarkup} from '../public/statement-ui.js';
test('Closing capital Excel checks preserve nulls, formulas and the original filing context',async()=>{
 const original=globalThis.fetch,check={label:'Consolidated equity',face:1000,schedule:1000,residual:0,tolerance:1,passed:true},row={period:'2025-12-31',currency:'IDR',value:0,status:'SUPPORTED ZERO',reason:'Explicit closing balance',context:'preferredClosing',checks:[check,{...check,label:'Missing parent',face:null,residual:null,passed:false}]},report={url:'https://www.idx.id/filing.zip',periods:['2025-12-31'],tags:[],columns:[],rows:[],nil:{},capitalSchedule:{rows:[row]}};
 try{globalThis.fetch=async url=>Response.json(String(url).includes('taxonomy')?[]:{ticker:'CPQA',reports:[]});registerStatementSnapshot('CPQA',{reports:[report]},'capital-test');const sheet=await statementCapitalWorkbook('CPQA');assert.equal(sheet[3][0],report.url);assert.equal(sheet[3][3],0);assert.deepEqual(sheet[3][9],{formula:'I4-H4',value:0});assert.equal(sheet[4][9],null);assert.equal(sheet[4][7],null);assert.equal(sheet[3][12],'preferredClosing');}finally{globalThis.fetch=original;}
});
test('Source schedule rendering escapes issuer text and retains explicit review status',()=>{
 const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),h={tr:a=>a,fmt:v=>v===null?'—':String(v),esc,table:()=>'<table>checks</table>'};
 const html=capitalScheduleMarkup({capitalSchedule:{rows:[{period:'2025-12-31',currency:'IDR',value:null,status:'REVIEW',tag:'closing',context:'<img src=x onerror=alert(1)>',reason:'Review scope',checks:[]}]}},h);assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);assert.match(html,/REVIEW/);assert.match(html,/balance.*—/);
});
