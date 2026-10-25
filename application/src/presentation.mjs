import {financial} from './engine.mjs';
import {rollingPeriods} from './release.mjs';
import {analysisUnavailable} from './sensitivity.mjs';

export function pageAssumptions(c,r,page='all'){
 if(!r.valid||['technical','unavailable'].includes(r.engine))return [];
 const intrinsic=r.engine==='core'&&r.eligible&&r.weight>0;
 const operating=r.engine==='residual'?['payout']:intrinsic?(financial(c)?['growth','payout']:['growth','margin','tax','da','capex','nwc']):['growth'];
 const valuation=r.engine==='residual'?['rf','beta','erp','buy','sell']:intrinsic?['rf','beta','erp',...(!financial(c)?['kd']:[]),'g',financial(c)?'terminalRoe':'roic','buy','sell']:['buy','sell'];
 return page==='forecast'?operating:page==='valuation'?valuation:[...new Set([...operating,...valuation])];
}
export function valuationPresentation(c,r){
 const reason=analysisUnavailable(c,r);if(reason)return {available:false,reason,methods:[],bridge:[]};
 const methods=[],bridge=[];
 if(r.weight>0&&r.engine==='residual')methods.push({key:'residual',name:'Residual income',value:r.residual.price,weight:r.weight});
 else if(r.weight>0&&r.eligible)methods.push({key:'intrinsic',name:financial(c)?'DDM':'DCF · FCFF',value:r.dcf.price,weight:r.weight});
 if(r.relative?.price>0&&r.weight<1)methods.push({key:'relative',name:'Relative valuation',value:r.relative.price,weight:1-r.weight});
 for(const row of methods)row.contribution=row.value*row.weight;
 if(r.engine==='residual')bridge.push({key:'book',value:r.residual.bookValue},{key:'pvExcess',value:r.residual.pvExcess},{key:'equity',value:r.residual.equity,total:true});
 else if(r.weight>0&&r.eligible){
  bridge.push({key:'pvForecast',value:r.dcf.pvForecast},{key:'pvTerminal',value:r.dcf.pvTerminal});
  if(!financial(c))bridge.push({key:'enterprise',value:r.dcf.enterprise,total:true},{key:'cash',value:c.cash},{key:'debt',value:-c.debt},{key:'minority',value:-c.minority},{key:'preferred',value:-c.preferred});
  bridge.push({key:'equity',value:r.dcf.equity,total:true});
 }else{
  const leg=r.relative.legs.find(x=>x.price>0&&x.metric.startsWith('ev'));
  if(leg){const key=leg.metric==='evSales'?'revenue':'ebitda';bridge.push({key:'enterprise',value:leg.multiple*c[key],total:true},{key:'cash',value:c.cash},{key:'debt',value:-c.debt},{key:'minority',value:-c.minority},{key:'preferred',value:-c.preferred},{key:'equity',value:leg.price*c.shares,total:true});}
 }
 return {available:true,methods,bridge,bridgeMethod:r.engine==='residual'?'Residual income':r.weight>0&&r.eligible?(financial(c)?'DDM':'DCF · FCFF'):r.relative.legs.find(x=>x.price>0&&x.metric.startsWith('ev'))?.metric||null};
}
export function forecastPresentation(c,a,r){
 const reason=analysisUnavailable(c,r);if(reason)return {available:false,reason,rows:[],metrics:[],linked:false};
 if(r.engine==='residual')return {available:true,type:'residual',linked:true,rows:r.residual.rows,metrics:['netIncome','dividend','closingBook','roe','excess'],baseline:{netIncome:c.netIncome,closingBook:c.bookEquity,roe:r.residual.initialRoe},controls:pageAssumptions(c,r,'forecast')};
 if(r.engine==='core'&&r.eligible&&r.weight>0)return financial(c)?{available:true,type:'ddm',linked:true,rows:r.dcf.rows.map(row=>({...row,retainedEarnings:row.netIncome-row.dividend})),metrics:['netIncome','dividend','retainedEarnings'],baseline:{netIncome:c.netIncome},controls:pageAssumptions(c,r,'forecast')}:{available:true,type:'fcff',linked:true,rows:r.dcf.rows.map(row=>({...row,margin:row.ebit/row.revenue})),metrics:['revenue','ebit','fcff','capex','margin'],baseline:{revenue:c.revenue,ebit:c.ebit,margin:c.revenue>0?c.ebit/c.revenue:null},controls:pageAssumptions(c,r,'forecast')};
 // A forward planning stress must never be described as an input to a trailing
 // multiple valuation. No generic FCFF or dividend stream is fabricated here.
 const metrics=[...new Set((r.relative?.legs||[]).filter(leg=>leg.price>0).map(leg=>({pe:'netIncome',pb:'bookEquity',evEbitda:'ebitda',evSales:'revenue'}[leg.metric])))];
 const factors=[];for(let i=0,factor=1;i<5;i++){factor*=1+(a.paths?.[i]?.growth??a.growth);factors.push(factor);}const rows=factors.map((factor,i)=>({year:i+1,...rollingPeriods(c.valuationDate)[i],...Object.fromEntries(metrics.map(key=>[key,c[key]*factor]))}));
 return {available:metrics.length>0,type:'planning',linked:false,rows,metrics,baseline:Object.fromEntries(metrics.map(key=>[key,c[key]])),controls:['growth']};
}
export function cashFlowBridge(forecast){
 const row=forecast.rows.at(-1);if(!row)return [];
 if(forecast.type==='fcff')return [{key:'nopat',value:row.nopat},{key:'da',value:row.da},{key:'capex',value:-row.capex},{key:'dnwc',value:-row.dnwc},{key:'fcff',value:row.fcff,total:true}];
 if(forecast.type==='ddm')return [{key:'netIncome',value:row.netIncome},{key:'retainedEarnings',value:-row.retainedEarnings},{key:'dividend',value:row.dividend,total:true}];
 if(forecast.type==='residual')return [{key:'openingBook',value:row.openingBook},{key:'netIncome',value:row.netIncome},{key:'dividend',value:-row.dividend},{key:'closingBook',value:row.closingBook,total:true}];
 return [];
}
