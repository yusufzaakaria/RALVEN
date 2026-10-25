import {recoveryReview} from './recovery.mjs';
import {intrinsic,financial,relativeAt} from './engine.mjs';
import {residualIncome} from './residual.mjs';
export function methodRanges(c,a,r){
 if(!r.valid||!(r.fair>0))return [];
 const rows=[];
 if(r.weight>0&&r.engine==='core'){
  const stress=sign=>{const b={...a,growth:a.growth+sign*.03,margin:a.margin+sign*.025,rf:a.rf-sign*.01};if(a.paths)b.paths=a.paths.map(p=>({...p,...(Number.isFinite(p.growth)?{growth:p.growth+sign*.03}:{}),...(Number.isFinite(p.margin)&&!financial(c)?{margin:p.margin+sign*.025}:{})}));const d=intrinsic(c,b);return c.recoveryPlan&&!recoveryReview(c,b,d.rows).eligible?null:d.price;};
  const values=[stress(-1),r.dcf.price,stress(1)].filter(v=>Number.isFinite(v)&&v>=0);if(values.length===3)rows.push({name:financial(c)?'DDM':'FCFF',low:Math.min(...values),base:r.dcf.price,high:Math.max(...values),basis:'Growth +/-3pp, corporate margin +/-2.5pp, risk-free rate -/+1pp; fixed terminal inputs.'});
 }
 if(r.engine==='residual'){const values=[-.2,0,.2].map(shock=>residualIncome(c,a,{ke:r.residual.ke-shock*.05,initialRoe:r.residual.initialRoe*(1+shock)})?.price);if(values.every(v=>Number.isFinite(v)&&v>=0))rows.push({name:'Residual income',low:Math.min(...values),base:r.residual.price,high:Math.max(...values),basis:'Starting ROE -/+20%, cost of equity +/-1pp; selected payout and fade fixed.'});}
 if(r.relative?.price>0&&r.weight<1)rows.push({name:'Relative',low:relativeAt(c,r.relative,.8),base:r.relative.price,high:relativeAt(c,r.relative,1.2),basis:'Eligible peer medians +/-20%; fixed financial denominators and capital claims.'});
 rows.push({name:'Weighted estimate',low:r.low,base:r.fair,high:r.high,basis:'Active weighted bear/base/bull scenarios.'});return rows.filter(x=>[x.low,x.base,x.high].every(Number.isFinite));
}
