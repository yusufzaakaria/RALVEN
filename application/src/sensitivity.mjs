import {capital,financial,intrinsic,relativeAt} from './engine.mjs';
import {residualIncome} from './residual.mjs';

const steps=[-.2,-.1,0,.1,.2];
export function analysisUnavailable(c,r){
 if(c.sourceScaleIssues?.length)return 'Source reporting units conflict. Reconcile the original statements before calculating valuation sensitivity.';
 if(r.engine==='technical')return 'This is a price-only signal. Financial statements or eligible peers are insufficient for a fundamental fair value; a valuation sensitivity chart would be unsupported.';
 if(!r.valid||!(r.fair>0))return r.rationale||'No eligible valuation method or supported fair value.';
 if(c.mode!=='demo'&&!r.quality?.actionable)return (r.decision?.requirements||[]).map(x=>x.en).join(' ')||'Required source checks have not passed.';
 return null;
}
function relativeSubject(c,r,factor){const next={...c};for(const leg of r.relative.legs.filter(x=>x.price>0)){const key={pe:'netIncome',pb:'bookEquity',evSales:'revenue',evEbitda:'ebitda'}[leg.metric];next[key]=c[key]*factor;}return next;}
export function sensitivityValue(c,a,r,{multiple=1,denominator=1,ke,roe,payout,book=1,rate,g,parameter,delta=0}={}){
 const rel=r.relative?.price>0?relativeAt(relativeSubject(c,r,denominator),r.relative,multiple):0;
 if(r.engine==='residual'){const next={...a,payout:payout??a.payout};if(payout!==undefined&&next.paths)next.paths=next.paths.map(path=>({...path,payout}));const ri=residualIncome({...c,bookEquity:c.bookEquity*book},next,{ke:ke??r.residual.ke,initialRoe:roe??r.residual.initialRoe});return ri? r.weight*ri.price+(1-r.weight)*rel:null;}
 if(r.engine==='relative'||!(r.weight>0&&r.eligible))return rel;
 const b={...a,...(g===undefined?{}:{g}),...(parameter?{[parameter]:a[parameter]+delta}:{})};
 if(parameter&&b.paths)b.paths=b.paths.map(path=>({...path,...(Number.isFinite(path[parameter])?{[parameter]:path[parameter]+delta}:{})}));
 if(rate!==undefined){const cp=capital(c,b),weight=financial(c)?1:cp.marketCap/(cp.marketCap+c.debt);if(!(weight>0))return null;b.rf+=(rate-cp.wacc)/weight;}
 if(!(b.rf>=0&&b.g>=0&&b.g<(financial(c)?b.terminalRoe:b.roic)&&capital(c,b).wacc>b.g+.005&&b.margin>0&&b.margin<1&&b.growth>-.5&&b.growth<1&&b.capex>=0&&b.payout>0&&b.payout<=1))return null;
 const d=intrinsic(c,b);return Number.isFinite(d.price)?r.weight*Math.max(0,d.price)+(1-r.weight)*rel:null;
}
export function sensitivityMatrix(c,a,r){
 const reason=analysisUnavailable(c,r);if(reason)return {available:false,reason};
 let kind,rowLabel,columnLabel,rowValues,columnValues,values,description;
 if(r.engine==='residual'){
  kind='residual';rowLabel='Cost of equity';columnLabel='Starting ROE';rowValues=[-.01,-.005,0,.005,.01].map(d=>r.residual.ke+d);columnValues=steps.map(d=>r.residual.initialRoe*(1+d));values=rowValues.map(ke=>columnValues.map(roe=>sensitivityValue(c,a,r,{ke,roe})));description='Blended IDR/share. Residual-income Ke and starting ROE vary; method weights and relative value are fixed. Five-year ROE fade and no terminal excess earnings.';
 }else if(r.engine==='relative'||!(r.weight>0&&r.eligible)){
  kind='relative';rowLabel='Subject denominators';columnLabel='Peer multiples';rowValues=steps.map(x=>1+x);columnValues=[...rowValues];values=rowValues.map(denominator=>columnValues.map(multiple=>sensitivityValue(c,a,r,{denominator,multiple})));description='Relative fair value in IDR/share. Eligible earnings, book value, sales or EBITDA denominators and peer multiples are scaled together. Capital claims and shares are fixed; the EV-to-equity bridge is recalculated. These are analyst stresses, not forecast changes.';
 }else{
  kind='intrinsic';rowLabel=financial(c)?'Cost of equity':'WACC';columnLabel='Terminal growth';rowValues=[-.01,-.005,0,.005,.01].map(d=>r.dcf.wacc+d);columnValues=[-.01,-.005,0,.005,.01].map(d=>a.g+d);values=rowValues.map(rate=>columnValues.map(g=>sensitivityValue(c,a,r,{rate,g})));description='Blended fair value in IDR/share. Intrinsic discount rate and terminal growth vary; method weights and relative value are fixed. Unsupported combinations are omitted.';
 }
 return {available:true,kind,rowLabel,columnLabel,rowValues,columnValues,values,base:r.fair,description};
}
export function valuationTornado(c,a,r){
 if(analysisUnavailable(c,r))return [];
 const specs=[];
 if(r.engine==='residual'){
  specs.push(['initialRoe','Starting ROE','ROE awal','±20%',s=>({roe:r.residual.initialRoe*(1+s*.2)})],['ke','Cost of equity','Biaya ekuitas','±1pp',s=>({ke:r.residual.ke+s*.01})],['payout','Dividend payout','Rasio dividen','±5pp',s=>({payout:Math.min(1,Math.max(.001,a.payout+s*.05))})],['book','Opening book equity','Ekuitas buku awal','±10%',s=>({book:1+s*.1})]);
 }else if(r.engine==='relative'||!(r.weight>0&&r.eligible)){
  specs.push(['multiple','Peer multiples','Kelipatan pembanding','±20%',s=>({multiple:1+s*.2})],['denominator','Subject denominators','Penyebut emiten','±20%',s=>({denominator:1+s*.2})]);
 }else{
  for(const [key,shock,en,id]of [['growth',.02,financial(c)?'Earnings growth':'Revenue growth',financial(c)?'Pertumbuhan laba':'Pertumbuhan pendapatan'],...(financial(c)?[['payout',.05,'Dividend payout','Rasio dividen'],['terminalRoe',.02,'Terminal ROE','ROE terminal']]:[['margin',.02,'Operating margin','Margin operasi'],['capex',.02,'Capex / revenue','Capex / pendapatan'],['roic',.02,'Terminal ROIC','ROIC terminal']]),['rf',.01,'Risk-free rate','Tingkat bebas risiko'],['g',.005,'Terminal growth','Pertumbuhan terminal']])specs.push([key,en,id,`±${shock*100}pp`,s=>({parameter:key,delta:s*shock})]);
  if(r.weight<1&&r.relative?.price>0)specs.push(['multiple','Peer multiples','Kelipatan pembanding','±20%',s=>({multiple:1+s*.2})]);
 }
 if(r.engine==='residual'&&r.weight<1&&r.relative?.price>0)specs.push(['multiple','Peer multiples','Kelipatan pembanding','±20%',s=>({multiple:1+s*.2})],['denominator','Relative denominators','Penyebut relatif','±20%',s=>({denominator:1+s*.2})]);
 const rows=specs.map(([key,en,id,shock,params])=>{const [low,high]=[-1,1].map(s=>sensitivityValue(c,a,r,params(s)));return {key,en,id,shock,low,high,impact:Math.max(0,...[low,high].filter(Number.isFinite).map(v=>Math.abs(v-r.fair)))};});
 if(r.relative?.legs?.some(x=>x.price>0&&x.metric.startsWith('ev'))&&r.weight<1)for(const [key,en,id]of [['debt','Financing debt','Utang pendanaan'],['cash','Cash','Kas'],['minority','Non-controlling claims','Klaim nonpengendali'],['preferred','Preferred claims','Klaim preferen']])if(c[key]>0){const [low,high]=[-1,1].map(s=>sensitivityValue({...c,[key]:c[key]*(1+s*.1)},a,r));rows.push({key,en,id,shock:'±10%',low,high,impact:Math.max(Math.abs(low-r.fair),Math.abs(high-r.fair))});}
 return rows.filter(x=>Number.isFinite(x.low)||Number.isFinite(x.high)).sort((a,b)=>b.impact-a.impact);
}
