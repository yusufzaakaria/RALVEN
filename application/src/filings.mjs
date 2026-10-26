import {extractFilingNotes} from './filing-notes.mjs';
// Conservative IDX XBRL adapter. Facts already use full currency units: the
// presentation rounding label must NEVER be applied a second time.
const filingRoot='https://www.idx.id';
const xmlText=s=>String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'");
const xmlAttr=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1],xmlText(m[2])]));
export async function unzipInstance(buffer){
 const bytes=new Uint8Array(buffer),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('IDX attachment is not a ZIP archive');let p=v.getUint32(end+16,true);const n=v.getUint16(end+10,true);
 if(n>200)throw Error('IDX archive has too many entries');
 for(let i=0;i<n;i++){
  if(v.getUint32(p,true)!==0x02014b50)throw Error('Invalid ZIP directory');
  const method=v.getUint16(p+10,true),size=v.getUint32(p+20,true),unpacked=v.getUint32(p+24,true),nl=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),offset=v.getUint32(p+42,true),name=new TextDecoder().decode(bytes.slice(p+46,p+46+nl));p+=46+nl+extra+comment;
  if(!/(^|\/)instance[^/]*\.(xbrl|xml)$/i.test(name))continue;
  if(unpacked>8e6||size>3e6)throw Error('IDX instance exceeds extraction limit');
  if(v.getUint32(offset,true)!==0x04034b50)throw Error('Invalid ZIP entry');
  const start=offset+30+v.getUint16(offset+26,true)+v.getUint16(offset+28,true),packed=bytes.slice(start,start+size);
  if(method===0)return new TextDecoder().decode(packed);
  if(method!==8)throw Error('Unsupported ZIP compression');
  const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const output=await new Response(stream).arrayBuffer();if(output.byteLength!==unpacked)throw Error('ZIP size mismatch');return new TextDecoder().decode(output);
 }
 throw Error('No supported XBRL instance in IDX archive');
}
export function parseIdxInstance(xml,{ticker,url,publishedAt,retrievedAt=new Date().toISOString(),includeStatements=false}={}){
 if(xml.length>8e6||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Unsupported XBRL document');
 const contexts=new Map(),units=new Map(),facts=[],reported=[];
 const tag=(s,n)=>s.match(new RegExp('<(?:[\\w-]+:)?'+n+'(?:\\s[^>]*)?>([^<]+)</(?:[\\w-]+:)?'+n+'>'))?.[1];
 for(const m of xml.matchAll(/<(?:[\w-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?context>/g)){const a=xmlAttr(m[1]),body=m[2];contexts.set(a.id,{end:tag(body,'instant')||tag(body,'endDate'),start:tag(body,'startDate'),dimension:/<(?:[\w-]+:)?(?:segment|scenario|explicitMember|typedMember)\b/.test(body)});}
 for(const m of xml.matchAll(/<(?:[\w-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?unit>/g)){const a=xmlAttr(m[1]);if(!/<(?:[\w-]+:)?divide\b/.test(m[2]))units.set(a.id,tag(m[2],'measure')?.split(':').at(-1));}
 for(const m of xml.matchAll(/<([\w-]+):([\w-]+)\b([^>]*\bcontextRef\s*=[^>]*)>([^<]*)<\/\1:\2>/g)){const a=xmlAttr(m[3]),ct=contexts.get(a.contextRef),text=m[4].trim();if(!ct||ct.dimension)continue;const f={tag:m[2],context:a.contextRef,period:ct.end,start:ct.start,currency:units.get(a.unitRef),index:m.index,rounding:Number.isFinite(Number(a.decimals))?10**-Number(a.decimals):0};reported.push({...f,nil:a['xsi:nil']==='true'});if(!text||a['xsi:nil']==='true'||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text))continue;const value=Number(text);if(Number.isFinite(value))facts.push({...f,value});}
 for(const m of xml.matchAll(/<([\w-]+):([\w-]+)\b([^>]*\bcontextRef\s*=[^>]*)\/>/g)){const a=xmlAttr(m[3]),ct=contexts.get(a.contextRef);if(ct&&!ct.dimension&&a['xsi:nil']==='true')reported.push({tag:m[2],context:a.contextRef,period:ct.end,start:ct.start,currency:units.get(a.unitRef),nil:true,index:m.index});}
 const mapping={revenue:['SalesAndRevenue'],netIncome:['ProfitLossAttributableToParentEntity'],bookEquity:['EquityAttributableToEquityOwnersOfParentEntity'],assets:['Assets'],liabilities:['Liabilities'],totalEquity:['Equity'],minority:['NonControllingInterests'],cash:['CashAndCashEquivalents'],ocf:['NetCashFlowsReceivedFromUsedInOperatingActivities'],ebit:['ProfitFromOperation','ProfitLossFromOperatingActivities','OperatingProfitLoss','ProfitLossFromOperations','OperatingIncome'],da:['DepreciationAndAmortisationExpenses'],netInterestIncome:['NetInterestIncome'],temporarySyirkah:['TemporarySyirkahFunds'],participantFunds:['AccumulatedTabarrusFunds'],preferred:['PreferredStocks'],debt:['TotalInterestBearingDebt','TotalBorrowings'],capexPpe:['PaymentsForAcquisitionOfPropertyPlantAndEquipment','PaymentsForAcquisitionOfPropertyAndEquipment'],capexIntangibles:['PaymentsForAcquisitionOfIntangibleAssets']};
 mapping.interestIncome=['InterestIncome'];mapping.interestExpense=['InterestExpenses'];
 Object.assign(mapping,{depreciation:['Depreciation','DepreciationExpenses'],amortization:['Amortization','Amortisation','AmortisationExpenses','AmortizationExpenses'],grossProfit:['GrossProfit'],pretaxProfit:['ProfitLossBeforeIncomeTax','ProfitLossBeforeTax'],financeCosts:['InterestAndFinanceCosts','FinanceCosts'],financeIncome:['FinanceIncome'],leaseDebt:['LeaseLiabilities','FinanceLeaseLiabilities'],capex:['CapitalExpenditure','PaymentsForAcquisitionOfPropertyPlantAndEquipmentAndIntangibleAssets']});
 mapping.da.push('DepreciationAndAmortizationExpenses','DepreciationAndAmortisation','DepreciationAndAmortization');
 const observations=[];
 for(const [field,names]of Object.entries(mapping))for(const period of [...new Set(facts.map(f=>f.period))]){
  const durationFields=['revenue','netIncome','ocf','ebit','da','netInterestIncome','interestIncome','interestExpense','capexPpe','capexIntangibles','depreciation','amortization','grossProfit','pretaxProfit','financeCosts','financeIncome','capex'];let candidates=[];
  for(const name of names){candidates=facts.filter(f=>f.tag===name&&f.period===period&&(/^[A-Z]{3}$/.test(f.currency||''))&&(durationFields.includes(field)?!!f.start:!f.start));if(candidates.length)break;}
  const byScope=new Map();for(const f of candidates){const duration=f.start?Math.round((Date.parse(f.period)-Date.parse(f.start))/86400000)+1:0,key=f.currency+'|'+duration;const previous=byScope.get(key);if(previous&&previous.value!==f.value)throw Error('Ambiguous consolidated XBRL fact: '+field);byScope.set(key,{...f,duration});}
  for(const f of byScope.values())observations.push({field,value:f.value,currency:f.currency,unit:'units',period:f.period,start:f.start||null,duration:f.duration,definition:field==='netIncome'?'parent_profit':field==='bookEquity'?'parent_equity':field==='cash'?'cash_equivalents':field,sourceId:'idx-xbrl',sourceGroup:'issuer:'+ticker,sourceType:'primary',url,locator:f.tag+' / '+f.context,publishedAt:publishedAt?.slice(0,10)||null,retrievedAt});
 }
 // Every derived fact keeps its native components and a reproducible equation.
 const append=(field,anchor,value,calculation)=>{if(observations.some(o=>o.field===field&&o.period===anchor.period&&o.start===(anchor.start||null)&&o.currency===anchor.currency))return;observations.push({field,value,currency:anchor.currency,unit:'units',period:anchor.period,start:anchor.start||null,duration:anchor.start?Math.round((Date.parse(anchor.period)-Date.parse(anchor.start))/86400000)+1:0,definition:field,sourceId:'idx-xbrl',sourceGroup:'issuer:'+ticker,sourceType:'primary',url,locator:'Derived: '+calculation.formula+' / '+anchor.context,publishedAt:publishedAt?.slice(0,10)||null,retrievedAt,calculation});};
 const scopes=[...new Set(facts.filter(f=>/^[A-Z]{3}$/.test(f.currency||'')).map(f=>f.context+'|'+f.currency))];
 for(const scope of scopes){const [context,currency]=scope.split('|'),xs=facts.filter(f=>f.context===context&&f.currency===currency),one=name=>xs.find(f=>f.tag===name),component=(f,sign=1)=>({tag:f.tag,value:f.value,sign}),anchor=xs[0];if(!anchor)continue;
  if(anchor.start){
   const dep=one('Depreciation')||one('DepreciationExpenses'),am=one('Amortization')||one('Amortisation')||one('AmortisationExpenses')||one('AmortizationExpenses');
   if(dep&&am&&dep.value>=0&&am.value>=0)append('da',anchor,dep.value+am.value,{kind:'sum',formula:dep.tag+' + '+am.tag,components:[component(dep),component(am)]});
   const ppe=observations.find(o=>o.field==='capexPpe'&&o.period===anchor.period&&o.start===anchor.start&&o.currency===currency),intangibles=observations.find(o=>o.field==='capexIntangibles'&&o.period===anchor.period&&o.start===anchor.start&&o.currency===currency);
   if(ppe&&intangibles)append('capex',anchor,Math.abs(ppe.value)+Math.abs(intangibles.value),{kind:'sum-absolute',formula:'abs(PPE purchases) + abs(intangible purchases)',components:[{tag:ppe.locator,value:ppe.value,sign:1},{tag:intangibles.locator,value:intangibles.value,sign:1}]});
   // Reconstruct the FACE income statement and require agreement with reported
   // PBT. Unknown numeric lines stop derivation. Nil never becomes a fact/zero.
   const pbt=one('ProfitLossBeforeIncomeTax')||one('ProfitLossBeforeTax'),base=one('GrossProfit')||one('SalesAndRevenue');
   if(pbt&&base&&pbt.index>base.index){const lines=xs.filter(f=>f.index>base.index&&f.index<pbt.index),ops=[component(base)],nonops=[];let supported=true;
    for(const f of lines){let sign,nonop=false;
     if(/^(FinanceIncome|InterestIncome|DividendsIncome|InvestmentIncome|ShareOfProfitLossOfAssociatesAccountedForUsingEquityMethod|ShareOfProfitLossOfJointVenturesAccountedForUsingEquityMethod|GainsLossesOnChangesInForeignExchangeRates)$/.test(f.tag)){sign=1;nonop=true;}
     else if(/^(InterestAndFinanceCosts|FinanceCosts|FinalTaxExpenses)$/.test(f.tag)){sign=-1;nonop=true;}
     else if(/(?:Expenses|Costs)$/.test(f.tag)||f.tag==='CostOfSalesAndRevenue'||f.tag==='AdditionReversalOfImpairmentLossRecognisedInProfitOrLoss')sign=-1;
     else if(/(?:Income|GainsLosses)$/.test(f.tag)||/^GainsLossesOn/.test(f.tag))sign=1;
     else {supported=false;break;}
     (nonop?nonops:ops).push(component(f,sign));
    }
    const value=ops.reduce((s,f)=>s+f.value*f.sign,0),reconstructed=value+nonops.reduce((s,f)=>s+f.value*f.sign,0),tolerance=Math.max(1,[base,pbt,...lines].reduce((s,f)=>s+(f.rounding||0)/2,0)),residual=reconstructed-pbt.value;
    if(supported&&lines.length&&Math.abs(residual)<=tolerance)append('ebit',anchor,value,{kind:'operating-reconciliation',formula:'Operating income = reported PBT - net financing / associate / FX items',components:[component(pbt),...nonops.map(f=>({...f,sign:-f.sign}))],control:{reported:pbt.value,reconstructed,residual,tolerance},note:'Includes other operating income/expenses shown before PBT; recurring earnings require analyst review.'});
   }
  }else{
   // Use mutually exclusive face-statement lines. BankLoans/BondsPayable note
   // subtotals are intentionally excluded to prevent counting maturities twice.
   const names=['ShortTermBankLoans','ShortTermBorrowings','ShortTermNonBankLoans','CurrentMaturitiesOfBankLoans','CurrentMaturitiesOfNon-BankFinancialInstitutionsLoan','CurrentMaturitiesOfSecuredLoans','CurrentMaturitiesOfUnsecuredLoans','CurrentMaturitiesOfStepLoans','CurrentMaturitiesOfLoansFromGovernmentOfTheRepublicOfIndonesia','CurrentMaturitiesOfSubordinatedLoans','CurrentMaturitiesOfFinanceLeaseLiabilities','CurrentMaturitiesOfBondsPayable','CurrentMaturitiesOfSubordinatedBonds','CurrentMaturitiesOfOtherBorrowings','LongTermBankLoans','LongTermNon-BankFinancialInstitutionsLoan','LongTermStepLoans','LongTermSecuredLoans','LongTermUnsecuredLoans','LongTermLoansFromGovernmentOfTheRepublicOfIndonesia','LongTermSubordinatedLoans','LongTermFinanceLeaseLiabilities','LongTermBondsPayable','LongTermSubordinatedBonds','LongTermOtherBorrowings','ConvertibleBonds'];
   const template=['ShortTermBankLoans','CurrentMaturitiesOfBankLoans','LongTermBankLoans','LongTermBondsPayable','LongTermOtherBorrowings'];
   const declarations=reported.filter(f=>f.context===context),parts=xs.filter(f=>names.includes(f.tag));
   const current=one('CurrentLiabilities'),noncurrent=one('NonCurrentLiabilities'),total=one('Liabilities'),controls=current&&noncurrent&&total,liabilityTolerance=controls?Math.max(1,(current.rounding+noncurrent.rounding+total.rounding)/2):0;
   if(template.every(t=>declarations.some(f=>f.tag===t))&&parts.length&&parts.every(f=>f.value>=0)&&controls&&Math.abs(current.value+noncurrent.value-total.value)<=liabilityTolerance){
    // Separate current/non-current lease tags take precedence over a lease total.
    const leaseSets=[['CurrentLeaseLiabilities','NonCurrentLeaseLiabilities'],['CurrentFinanceLeaseLiabilities','NonCurrentFinanceLeaseLiabilities']];
    for(const pair of leaseSets){const a=one(pair[0]),b=one(pair[1]);if(a&&b){if(!parts.some(f=>/FinanceLeaseLiabilities/.test(f.tag)))parts.push(a,b);break;}}
    if(parts.reduce((sum,f)=>sum+f.value,0)>total.value+liabilityTolerance)continue;
    const unclassified=xs.filter(f=>['OtherCurrentFinancialLiabilities','OtherNonCurrentFinancialLiabilities'].includes(f.tag)&&f.value>0);const debtCalculation={kind:'borrowing-components',formula:'Sum of disclosed short-term borrowings + current maturities + non-current borrowings (including reported leases)',components:parts.map(f=>component(f)),control:{reported:total.value,reconstructed:current.value+noncurrent.value,residual:current.value+noncurrent.value-total.value,tolerance:liabilityTolerance},note:'Face-statement borrowing components only; note subtotals excluded. Nil components remain unreported, not certified zero; verify untagged funding and lease disclosures.',unclassified:unclassified.map(f=>component(f))};append('reportedBorrowings',anchor,parts.reduce((s,f)=>s+f.value,0),debtCalculation);if(!unclassified.length)append('debt',anchor,parts.reduce((s,f)=>s+f.value,0),debtCalculation);
   }
  }
 }
 // EBITDA needs operating income AND full D&A in the same reporting scope.
 for(const op of observations.filter(o=>o.field==='ebit')){
  const dep=observations.find(o=>o.field==='da'&&o.period===op.period&&o.duration===op.duration&&o.currency===op.currency&&o.start===op.start);
  if(dep)observations.push({...op,field:'ebitda',definition:'ebitda',value:op.value+dep.value,locator:'Derived: operating income + full D&A',calculation:{kind:'sum',formula:'EBIT + full D&A',components:[{tag:op.locator,value:op.value,sign:1},{tag:dep.locator,value:dep.value,sign:1}]}});
 }
 if(observations.length<3)throw Error('Too few supported consolidated XBRL fields');
 // Detach regex slices: cached observations must not retain entire XML documents.
 const selectedNotes=includeStatements?extractFilingNotes(xml):null;
 const statement=includeStatements?{notes:selectedNotes?.notes||[],noteCoverage:selectedNotes?{matching:selectedNotes.matching,omitted:selectedNotes.omitted,characters:selectedNotes.characters,scope:selectedNotes.scope}:null,facts:facts.map(f=>({tag:f.tag,context:f.context,period:f.period,start:f.start||null,unit:f.currency||'unknown',value:f.value})),unreported:reported.filter(f=>f.nil).map(f=>({tag:f.tag,context:f.context,period:f.period,start:f.start||null,unit:f.currency||'unknown',value:null}))}:undefined;
 return JSON.parse(JSON.stringify({ticker,observations,periods:[...new Set(observations.map(o=>o.period))].sort().reverse(),retrievedAt,url,publishedAt,...(statement?{statement}:{})}));
}
export function idxReportUrl(ticker,year,period='audit'){return `${filingRoot}/primary/ListedCompany/GetFinancialReport?indexFrom=1&pageSize=5&year=${year}&reportType=rdf&EmitenType=s&periode=${period}&kodeEmiten=${ticker}`;}
async function filingFetch(url){const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='www.idx.id')throw Error('IDX attachment host rejected');const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('IDX HTTP '+r.status);return r;}
export async function fetchIdxFiling(ticker,year,period='audit',{includeStatements=false}={}){
 if(period===''){
  const errors=[];for(const quarter of ['tw3','tw2','tw1']){try{const d=await fetchIdxFiling(ticker,year,quarter,{includeStatements});if(d.status==='available'&&(!d.publishedAt||d.publishedAt.slice(0,10)<=new Date().toISOString().slice(0,10)))return {...d,freshnessIssue:errors.length?errors.join('; '):null};}catch(e){errors.push(e.message);}}
  if(errors.length)throw Error('Latest interim lookup incomplete: '+errors.join('; '));
  return {ticker,observations:[],status:'unavailable',message:'No available current-year quarterly XBRL filing'};
 }
 const query=idxReportUrl(ticker,year,period),payload=await(await filingFetch(query)).json();
 const rows=(payload.Results||[]).filter(x=>x.KodeEmiten===ticker);if(!rows.length)return {ticker,observations:[],status:'unavailable',query,message:'No IDX filing returned for this period'};
 const row=rows.sort((a,b)=>String(b.File_Modified).localeCompare(String(a.File_Modified)))[0],attachment=row.Attachments?.find(a=>/^instance(?:[-\w]*)?\.zip$/i.test(a.File_Name||''));
 if(!attachment)return {ticker,observations:[],status:'unmapped',query,message:'Filing found; supported instance ZIP unavailable',publishedAt:row.File_Modified};
 const url=new URL(attachment.File_Path,filingRoot).href,r=await filingFetch(url);if(Number(r.headers.get('content-length'))>3e6)throw Error('IDX ZIP exceeds download limit');const buffer=await r.arrayBuffer();if(buffer.byteLength>3e6)throw Error('IDX ZIP exceeds download limit');
 return {...parseIdxInstance(await unzipInstance(buffer),{ticker,url,publishedAt:row.File_Modified,includeStatements}),status:'available',query,reportPeriod:row.Report_Period,reportYear:row.Report_Year};
}
