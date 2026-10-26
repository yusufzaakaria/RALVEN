// Supplemental provider records keep their own dates, definitions and origin.
// Only reported TTM flows and dated quarter-end balances are accepted. No
// annual carry-forward, four-times-quarter rule or zero-for-absence inference.
const balances={debt:['TotalDebt'],cash:['CashAndCashEquivalents'],minority:['MinorityInterest'],preferred:['PreferredStockEquity'],bookEquity:['StockholdersEquity'],commonEquity:['CommonStockEquity'],totalEquity:['TotalEquityGrossMinorityInterest'],assets:['TotalAssets'],liabilities:['TotalLiabilitiesNetMinorityInterest']};
const flows={revenue:['TotalRevenue','OperatingRevenue'],ebit:['OperatingIncome'],netIncome:['NetIncomeCommonStockholders'],ebitda:['EBITDA'],ocf:['OperatingCashFlow','CashFlowFromContinuingOperatingActivities'],da:['DepreciationAndAmortization'],depreciation:['ReconciledDepreciation'],capex:['CapitalExpenditure'],netInterestIncome:['NetInterestIncome']};
export const periodicTypes=[...new Set([...Object.values(balances).flat().map(k=>'quarterly'+k),...Object.values(flows).flat().map(k=>'trailing'+k)])];
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
function trailingStart(end){const [y,m,d]=end.split('-').map(Number),lastDay=new Date(Date.UTC(y-1,m,0)).getUTCDate();return new Date(Date.UTC(y-1,m-1,Math.min(d,lastDay))+86400000).toISOString().slice(0,10);}
export function periodicEvidence(payload,ticker,{valuationDate,retrievedAt=new Date().toISOString()}={}){
 const map=new Map(),issues=[],observations=[];
 for(const s of payload?.timeseries?.result||[]){const type=s.meta?.type?.[0];if(periodicTypes.includes(type))map.set(type,s[type]||[]);}
 for(const [kind,definitions]of [['quarterly',balances],['trailing',flows]])for(const [field,keys]of Object.entries(definitions)){
  const dates=[...new Set(keys.flatMap(key=>(map.get(kind+key)||[]).map(x=>x.asOfDate)).filter(validDate))];
  for(const period of dates){if(period>valuationDate)continue;let chosen;
   for(const key of keys){const type=kind+key,rows=(map.get(type)||[]).filter(x=>x.asOfDate===period&&Number.isFinite(x.reportedValue?.raw)&&/^[A-Z]{3}$/.test(x.currencyCode||'')&&(kind==='trailing'?x.periodType==='TTM':['3M','6M','9M'].includes(x.periodType)));if(!rows.length)continue;
    if(new Set(rows.map(x=>x.currencyCode+'|'+x.reportedValue.raw)).size>1){issues.push({field,period,type,reason:'Conflicting duplicate provider records; field omitted.'});chosen=null;break;}chosen={...rows[0],type};break;
   }
   if(!chosen)continue;const start=kind==='trailing'?trailingStart(period):null,duration=start?Math.round((Date.parse(period)-Date.parse(start))/86400000)+1:0,raw=chosen.reportedValue.raw,value=field==='capex'?Math.abs(raw):raw;
   const calculation=field==='capex'?{kind:'sign-convention',formula:raw<0?'-reported capital expenditure':'reported capital expenditure',components:[{tag:chosen.type,value:raw,sign:raw<0?-1:1}],note:'Provider capital expenditure sign normalized for the investment outflow convention; original reported amount is retained.'}:null;
   observations.push({field,value,currency:chosen.currencyCode,unit:'units',period,start,duration,definition:field==='netIncome'?'parent_profit':field==='bookEquity'?'parent_equity':field==='cash'?'cash_equivalents':field,sourceId:'yahoo-periodic',sourceGroup:'yahoo',sourceType:'aggregator',url:`https://finance.yahoo.com/quote/${ticker}.JK/${kind==='quarterly'?'balance-sheet':'financials'}/`,locator:chosen.type+' / '+chosen.periodType+' / '+period,publishedAt:null,retrievedAt,providerBasis:kind==='trailing'?'REPORTED_TTM':'CLOSING_BALANCE',...(calculation?{calculation}:{})});
  }
 }
 return {observations,issues,scope:'Provider-reported TTM flows and dated quarterly closing balances. Same origin as Yahoo annual data; publication times and issuer definitions require review. Missing values remain absent.'};
}
