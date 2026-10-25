import {methodProfile} from './method-registry.mjs';
// Comparable screens are shared by the browser, API and exported audit.
export const multipleFields={pe:'netIncome',pb:'bookEquity',evSales:'revenue',evEbitda:'ebitda'};
export const multipleCaps={pe:100,pb:20,evSales:30,evEbitda:100};
const day=86400000;
export function bridgeComplete(c){return ['debt','cash','minority','preferred'].every(k=>Number.isFinite(c[k])&&c[k]>=0);}
export function comparablePeriod(c,p){
 const delta=Math.abs(Date.parse(c.period)-Date.parse(p.period))/day;
 const cBasis=c.periodBasis||'ANNUAL',pBasis=p.periodBasis||'ANNUAL';
 return Number.isFinite(delta)&&delta<=100&&['ANNUAL','TTM'].includes(cBasis)&&['ANNUAL','TTM'].includes(pBasis);
}
export function comparablePeer(c,p){
 const quoteAge=(Date.parse(c.valuationDate)-Date.parse(p.priceDate))/day;
 return !p.sourceScaleIssues?.length&&p.ticker!==c.ticker&&p.sector===c.sector&&(!c.industry||!p.industry||p.industry===c.industry)&&p.currency==='IDR'&&(!p.units||p.units===c.units)&&p.price>0&&p.shares>0&&p.period<=c.valuationDate&&quoteAge>=0&&quoteAge<=7&&comparablePeriod(c,p);
}
export function multipleRatio(p,metric){
 const used=[multipleFields[metric],...(metric.startsWith('ev')?['debt','cash','minority','preferred']:[])];if(p.evidence?.rows?.some(x=>used.includes(x.field)&&['CONFLICT','DEFINITION'].includes(x.status)))return null;
 if(!(p.price>0&&p.shares>0&&p[multipleFields[metric]]>0))return null;
 const numerator=p.price*p.shares+(metric.startsWith('ev')?(bridgeComplete(p)?p.debt-p.cash+p.minority+p.preferred:NaN):0);
 const value=numerator/p[multipleFields[metric]];
 return Number.isFinite(value)&&value>0&&value<multipleCaps[metric]?value:null;
}
export const extractiveCompany=c=>methodProfile(c).family==='extractive';
export const assetHeavyCompany=c=>/real estate|real estat|properti|transport|industrials|perindustrian|infrastructure|infrastruktur|basic materials|barang baku|energy|energi|hotel|resor|konstruksi|perkebunan|pelayaran/i.test((c.sector||'')+' '+(c.idxSector||'')+' '+(c.industry||'')+' '+(c.subIndustry||''));
