import {rollingPeriods} from './release.mjs';
// Clean-surplus equity valuation. Excess ROE fades to cost of equity by year 5;
// residual income after year 5 is zero. This is not a perpetual commodity DCF.
export function residualIncome(c,a,{ke=a.rf+a.beta*a.erp,initialRoe}={}){
 const denominator=c.averageBookEquity>0?c.averageBookEquity:c.bookEquity;
 const roe=initialRoe??c.netIncome/denominator;
 if(!(c.bookEquity>0&&c.shares>0&&ke>0&&roe>0&&roe<1.5&&a.payout>0&&a.payout<=1))return null;
 let book=c.bookEquity,pvExcess=0;const rows=[];
 for(let year=1;year<=5;year++){
  const forecastRoe=roe+(ke-roe)*(year-1)/4,netIncome=book*forecastRoe,dividend=netIncome*(a.paths?.[year-1]?.payout??a.payout),charge=ke*book,excess=netIncome-charge,pv=excess/(1+ke)**year,closingBook=book+netIncome-dividend;
  rows.push({year,...rollingPeriods(c.valuationDate)[year-1],openingBook:book,roe:forecastRoe,netIncome,dividend,charge,excess,pv,closingBook});pvExcess+=pv;book=closingBook;
 }
 const equity=c.bookEquity+pvExcess;
 return {rows,ke,initialRoe:roe,denominator,denominatorBasis:c.averageBookEquity>0?'matched prior-year / closing average':'closing equity',bookValue:c.bookEquity,pvExcess,equity,price:equity/c.shares,terminalExcess:0,method:'Residual income · 5-year ROE fade'};
}
