import {multipleFields,multipleRatio,extractiveCompany} from './comparables.mjs';
// Source reconciliation is separate from valuation. Sources are never averaged.
export const evidenceFields=['revenue','ebit','netIncome','bookEquity','ebitda','debt','cash','minority','preferred','assets','liabilities','ocf','da','totalEquity','temporarySyirkah','netInterestIncome','capexPpe','capexIntangibles','participantFunds','depreciation','amortization','grossProfit','pretaxProfit','financeCosts','financeIncome','capex','reportedBorrowings','providerDaInput'];
const evidenceFlows=new Set(['revenue','ebit','netIncome','ebitda','ocf','da','netInterestIncome','capexPpe','capexIntangibles','depreciation','amortization','grossProfit','pretaxProfit','financeCosts','financeIncome','capex','providerDaInput']);
export const evidenceDefinitions={netIncome:'parent_profit',bookEquity:'parent_equity',cash:'cash_equivalents'};
const evidenceDefinition=k=>evidenceDefinitions[k]||k;
export function evidenceBundle(catalog,ticker){const b=catalog?.companies?.[ticker];if(!b)return {};if(catalog.schema!=='RALVEN-EVIDENCE-PACKED-1')return b;return {...b,observations:(b.observations||[]).map(a=>({...b.sources[a[8]],field:a[0],value:a[1],currency:a[2],unit:a[3],period:a[4],duration:a[5],definition:a[6],locator:a[7],start:a[9]||null,...(a[10]?{calculation:a[10]}:{})})),sources:undefined};}
export function packEvidenceCatalog(catalog){return {...catalog,schema:'RALVEN-EVIDENCE-PACKED-1',companies:Object.fromEntries(Object.entries(catalog.companies).map(([ticker,b])=>{const sources=[],keys=new Map(),observations=(b.observations||[]).map(o=>{const source=Object.fromEntries(['sourceId','sourceGroup','sourceType','url','publishedAt','retrievedAt'].map(k=>[k,o[k]??null])),key=JSON.stringify(source);if(!keys.has(key)){keys.set(key,sources.length);sources.push(source);}return [o.field,o.value,o.currency,o.unit,o.period,o.duration,o.definition,o.locator,keys.get(key),o.start||null,...(o.calculation?[o.calculation]:[])];});return [ticker,{...b,sources,observations}];}))};}
export function normalizedObservation(o,c){
 if(!Number.isFinite(o.value))return null;const scale=o.unit==='units'?1e-9:o.unit==='millions'?.001:o.unit==='bn'?1:null;if(scale===null)return null;
 const valuationFx=(c.valuationFx||[]).find(f=>f.currency===o.currency&&f.date<=c.valuationDate&&Date.parse(c.valuationDate)-Date.parse(f.date)<=7*86400000);
 const fx=o.currency==='IDR'?1:valuationFx?.rate||(c.fx||[]).find(f=>f.currency===o.currency&&f.date<=o.period&&Date.parse(o.period)-Date.parse(f.date)<14*86400000)?.rate;
 return fx>0?o.value*scale*fx:null;
}
export function comparativeScaleIssues(observations,c){
 const groups=new Map(),signals=new Map();
 for(const o of observations){if(o.sourceType!=='primary'||o.sourceId==='idx-ttm'||!o.url||!['assets','liabilities','bookEquity','totalEquity','cash'].includes(o.field)||o.duration)continue;const value=normalizedObservation(o,c);if(!(value>0))continue;const key=o.field+'|'+o.period;const group=groups.get(key)||[];group.push({...o,normalized:value});groups.set(key,group);}
 for(const group of groups.values())for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const a=group[i],b=group[j];if(a.url===b.url)continue;const ratio=Math.max(a.normalized,b.normalized)/Math.min(a.normalized,b.normalized),power=[3,6,9].find(p=>Math.abs(Math.log10(ratio)-p)<.005);if(!power)continue;const urls=[a.url,b.url].sort(),key=urls.join('|')+'|'+a.period+'|'+power;const issue=signals.get(key)||{period:a.period,factor:10**power,sources:urls,fields:[]};if(!issue.fields.includes(a.field))issue.fields.push(a.field);signals.set(key,issue);}
 return [...signals.values()].filter(x=>x.fields.length>=3);
}
export function trailingEvidence(observations,annualPeriod){
 const primary=observations.filter(o=>o.sourceType==='primary'),latest=primary.filter(o=>o.duration>0&&o.duration<350&&o.period>annualPeriod).map(o=>o.period).sort().at(-1);if(!latest)return [];
 const priorYtd=(Number(latest.slice(0,4))-1)+latest.slice(4),result=[];
 for(const field of [...evidenceFlows,'interestIncome','interestExpense']){
  const current=primary.find(o=>o.field===field&&o.period===latest&&o.duration>0&&o.duration<350);if(!current||!current.start||Date.parse(current.start)-Date.parse(annualPeriod)!==86400000)continue;
  const annual=primary.find(o=>o.field===field&&o.period===annualPeriod&&o.duration>=350&&o.duration<=380&&o.currency===current.currency&&o.definition===current.definition),prior=primary.find(o=>o.field===field&&o.period===priorYtd&&Math.abs(o.duration-current.duration)<=1&&o.start?.slice(5)===current.start?.slice(5)&&o.currency===current.currency&&o.definition===current.definition);
  if(!annual||!prior||annual.unit!==current.unit||prior.unit!==current.unit)continue;
  result.push({...current,value:annual.value+current.value-prior.value,start:new Date(Date.parse(priorYtd)+86400000).toISOString().slice(0,10),duration:365,sourceId:'idx-ttm',locator:'TTM = annual + current YTD - prior comparable YTD',components:[annual,current,prior].map(o=>({period:o.period,value:o.value,url:o.url,locator:o.locator})),publishedAt:current.publishedAt,calculation:{kind:'ttm',formula:'Prior annual + current YTD - prior comparable YTD',components:[{tag:annual.locator,value:annual.value,sign:1},{tag:current.locator,value:current.value,sign:1},{tag:prior.locator,value:prior.value,sign:-1}],review:[annual,current,prior].some(o=>o.calculation&&o.calculation.kind!=='ttm')}});
 }
 return result;
}
export function prepareEvidence(subject,bundle={}, {trailing=true}={}){
 const c={...subject},legacy=subject.providerSnapshot?{...subject.providerSnapshot}:Object.fromEntries(evidenceFields.map(k=>[k,subject[k]??null]));c.providerSnapshotDerivations={...(subject.providerSnapshotDerivations||{})};if(!subject.providerSnapshot&&subject.mode==='live'&&subject.periodBasis!=='TTM'&&subject.revenue>0){for(const [field,ratio] of [['providerDaInput','daRatio'],['capex','capexRatio']])if(!Number.isFinite(legacy[field])&&Number.isFinite(subject[ratio])){legacy[field]=Math.abs(subject[ratio]*subject.revenue);c.providerSnapshotDerivations[field]='Archived '+ratio+' ('+subject[ratio]+') × original annual revenue ('+subject.revenue+' IDR bn)';}}c.providerSnapshot=legacy;c.providerPeriod=subject.providerPeriod||subject.period||[...(bundle.observations||[]),...(subject.observations||[])].filter(o=>o.sourceType==='primary'&&o.duration>=350&&o.duration<=380&&(!o.publishedAt||o.publishedAt<=c.valuationDate)).map(o=>o.period).sort().at(-1)||null;if(!c.period)c.period=c.providerPeriod;
 c.fx=[...(subject.fx||[]),...(bundle.fx||[]).filter(f=>!(subject.fx||[]).some(x=>x.currency===f.currency&&x.date===f.date))];
 const inherited=(subject.observations||[]).filter(o=>o.sourceId!=='yahoo-finance'&&o.sourceId!=='manual-input');
 const base=evidenceFields.filter(k=>Number.isFinite(legacy[k])).map(field=>({field,value:legacy[field],currency:'IDR',unit:'bn',period:c.providerPeriod,duration:evidenceFlows.has(field)?365:0,definition:evidenceDefinition(field),sourceId:c.mode==='import'?'manual-input':'yahoo-finance',sourceGroup:c.mode==='import'?'manual':'yahoo',sourceType:c.mode==='import'?'manual':'aggregator',url:c.mode==='import'?'':`https://finance.yahoo.com/quote/${c.ticker}.JK/financials/`,locator:c.mode==='import'?'User supplied input':c.providerSnapshotDerivations[field]||'Annual provider field',retrievedAt:c.updatedAt}));
 const external=(bundle.observations||[]).filter(o=>!o.publishedAt||o.publishedAt<=c.valuationDate),seen=new Set();
 for(const o of base){const native=subject.providerNative?.[o.field+'|'+o.period];if(c.mode==='live'&&native&&native.currency&&Number.isFinite(native.value)){o.value=o.field==='capex'?Math.abs(native.value):native.value;o.currency=native.currency;o.unit='units';o.locator='Native annual provider field; valuation conversion disclosed separately';}}
 c.observations=[...base,...inherited.filter(o=>o.sourceId!=='idx-ttm'),...external].filter(o=>{if(o.period>c.valuationDate||o.publishedAt&&o.publishedAt>c.valuationDate)return false;const key=[o.sourceId,o.url,o.locator,o.field,o.period,o.duration,o.definition,o.value].join('|');if(seen.has(key))return false;seen.add(key);return true;});
 for(const income of [...c.observations].filter(o=>o.sourceType==='primary'&&o.field==='interestIncome')){const expense=c.observations.find(o=>o.sourceType==='primary'&&o.field==='interestExpense'&&o.period===income.period&&o.duration===income.duration&&o.currency===income.currency&&o.unit===income.unit);if(expense&&!c.observations.some(o=>o.sourceType==='primary'&&o.field==='netInterestIncome'&&o.period===income.period&&o.duration===income.duration))c.observations.push({...income,field:'netInterestIncome',definition:'netInterestIncome',value:income.value-expense.value,locator:'Reported interest income less reported interest expense'});}
 c.sourceScaleIssues=comparativeScaleIssues(c.observations,c);
 const latestAnnual=c.observations.filter(o=>o.sourceType==='primary'&&o.duration>=350&&o.duration<=380).map(o=>o.period).sort().at(-1),annualPeriod=latestAnnual>c.providerPeriod?latestAnnual:c.providerPeriod;c.annualPeriod=annualPeriod;if(c.periodBasis!=='TTM'||!trailing)c.period=annualPeriod;
 const ttm=trailingEvidence(c.observations,annualPeriod),bank=/financial|bank|insurance/i.test(c.sector||'');
 if(trailing&&ttm.some(o=>o.field==='netIncome'&&normalizedObservation(o,c)!==null)&&(bank||ttm.some(o=>o.field==='revenue'&&normalizedObservation(o,c)!==null))){
  c.annualPeriod=annualPeriod;c.period=ttm[0].period;c.periodBasis='TTM';c.observations.push(...ttm);
  // Annual provider numbers cannot be relabeled as TTM or current balances.
  for(const k of evidenceFields)c[k]=null;
  if(bank){const income=ttm.find(o=>o.field==='interestIncome'),expense=ttm.find(o=>o.field==='interestExpense');if(income&&expense&&income.currency===expense.currency){const nii={...income,field:'netInterestIncome',definition:'netInterestIncome',value:income.value-expense.value,locator:'TTM interest income less TTM interest expense'};c.observations.push(nii,{...nii,field:'revenue',definition:'revenue',locator:'Bank NII used as revenue proxy; DDM uses parent profit'});}}
 }
 c.sourceAttempts=bundle.attempts||c.sourceAttempts||[];c.filingLinks=bundle.filings||c.filingLinks||[];
 for(const field of evidenceFields)c[field]=null;
 const rows=[];for(const field of evidenceFields){
  const flow=evidenceFlows.has(field),all=c.observations.filter(o=>o.field===field),same=all.filter(o=>o.period===c.period&&(!flow||o.duration>=350&&o.duration<=380)&&o.definition===evidenceDefinition(field)).map(o=>({...o,normalized:normalizedObservation(o,c)})).filter(o=>o.normalized!==null);
  const ranked=same.toSorted((a,b)=>(a.sourceType==='primary'?0:1)-(b.sourceType==='primary'?0:1)),selected=ranked[0],origins=new Set(same.map(o=>o.sourceGroup));
  const alternatives=all.filter(o=>o.period===c.period&&o.definition!==evidenceDefinition(field)).map(o=>({...o,normalized:normalizedObservation(o,c)}));
  const deviation=selected&&same.length>1?Math.max(...same.map(o=>Math.abs(o.normalized-selected.normalized)/Math.max(Math.abs(selected.normalized),Math.abs(o.normalized),1e-6))):0;
  const conflict=deviation>.01,definitionConflict=!!selected&&alternatives.some(o=>o.normalized!==null&&Math.abs(o.normalized-selected.normalized)/Math.max(Math.abs(selected.normalized),Math.abs(o.normalized),1e-6)>.01);
  const status=conflict?'CONFLICT':definitionConflict?'DEFINITION':!selected?'MISSING':origins.size>=2?'CORROBORATED':selected.sourceType==='primary'?'PRIMARY':'SINGLE SOURCE';
  if(selected)c[field]=selected.normalized;
  rows.push({field,selected:c[field]??null,sourceId:selected?.sourceId||null,status,deviation,origins:origins.size,primary:same.some(o=>o.sourceType==='primary'),derived:!!selected?.calculation,calculation:selected?.calculation||null,observations:[...same,...alternatives]});
 }
 // Build a complete annual register for every available primary reporting year,
 // preserving older provider-only years and never relabelling YTD as annual.
 const annualPeriods=[...new Set([...(c.history||[]).filter(h=>h.basis!=='TTM'&&!(c.periodBasis==='TTM'&&h.period===c.period)).map(h=>h.period||h.year+'-12-31'),...c.observations.filter(o=>o.sourceType==='primary'&&o.sourceId!=='idx-ttm'&&o.duration>=350&&o.duration<=380).map(o=>o.period)])].sort();
 c.history=annualPeriods.map(period=>{const next={...(c.history||[]).find(h=>(h.period||h.year+'-12-31')===period),year:Number(period.slice(0,4)),period,basis:'ANNUAL'};for(const field of evidenceFields){const candidates=c.observations.filter(o=>o.field===field&&o.period===period&&o.definition===evidenceDefinition(field)&&(!evidenceFlows.has(field)||o.duration>=350&&o.duration<=380)).toSorted((a,b)=>(a.sourceType==='primary'?0:1)-(b.sourceType==='primary'?0:1));const o=candidates.find(o=>normalizedObservation(o,c)!==null);if(o)next[field]=normalizedObservation(o,c);}return next;});
 rows.forEach(row=>Object.assign(row,fieldAvailability(row,c)));
 const dep=rows.find(x=>x.field==='da');if(dep?.primary&&dep.selected>=0&&c.revenue>0)c.daRatio=dep.selected/c.revenue;
 if(c.periodBasis==='TTM'){
  c.capexRatio=Number.isFinite(c.capex)&&c.revenue>0?Math.abs(c.capex)/c.revenue:null;c.daRatio=dep?.primary&&c.revenue>0?dep.selected/c.revenue:null;
  if(bank){c.debt=0;c.cash=0;c.minority=0;c.preferred=0;c.ebitda=c.netIncome;if(!Number.isFinite(c.ebit))c.ebit=c.netIncome;}
  c.history=[...c.history.filter(h=>h.basis!=='TTM'),{year:Number(c.period.slice(0,4)),period:c.period,basis:'TTM',...Object.fromEntries(rows.map(row=>[row.field,row.selected]))}];
 }
 c.evidence={rows,policy:'Primary compatible facts take precedence; >1% discrepancies remain unresolved. Annual, YTD, instant and EBITDA definitions are kept separate. Mirrored issuer filings count as one origin.',reconciledAt:new Date().toISOString()};
 if(trailing&&c.periodBasis==='TTM')c.evidence.annualRows=prepareEvidence({...subject,providerSnapshot:legacy,providerSnapshotDerivations:c.providerSnapshotDerivations,providerPeriod:c.providerPeriod,period:annualPeriod,periodBasis:'ANNUAL'},bundle,{trailing:false}).evidence.rows;
 const interim=c.observations.filter(o=>o.period>annualPeriod&&o.duration>0&&o.duration<350);c.latestInterim=interim.length?{period:interim.map(o=>o.period).sort().at(-1),observations:interim}:null;
 const bs=Object.fromEntries(rows.filter(x=>['assets','liabilities','totalEquity','temporarySyirkah','participantFunds'].includes(x.field)&&x.primary).map(x=>[x.field,x.selected]));
 c.balanceCheck=reconcileBalance(bs,c.period);
 return c;
}
export function fieldAvailability(row,c){
 const bank=/financial|bank|insurance/i.test(c.sector||''),field=row.field;
 if(field==='netInterestIncome'&&!bank)return {displayStatus:'NOT APPLICABLE',availability:'not-applicable',reason:'Banking operating metric; not applicable to this issuer.'};
 if(['temporarySyirkah','participantFunds'].includes(field)&&!bank&&!Number.isFinite(row.selected))return {displayStatus:'NOT APPLICABLE',availability:'not-applicable',reason:'Financial-sector fund balance; not applicable to this non-financial issuer.'};
 if(c.sourceScaleIssues?.length)return {displayStatus:'UNIT CONFLICT',availability:'scale-conflict',reason:'Comparable primary statements differ by a common scaling factor. Valuation is withheld; no automatic rescaling is applied.'};
 if(Number.isFinite(row.selected))return {displayStatus:row.derived&&row.status==='PRIMARY'?'DERIVED':row.status,availability:row.derived?'derived':'available',reason:row.calculation?.note||(['CONFLICT','DEFINITION'].includes(row.status)?'Source figures or definitions disagree; the discrepancy is retained.':'Compatible value available for the selected reporting basis.')};
 if(field==='debt'&&Number.isFinite(c.reportedBorrowings))return {displayStatus:'PARTIAL',availability:'partial',partialValue:c.reportedBorrowings,reason:'Disclosed borrowings are available, but other financial liabilities may contain additional financing or leases. A complete total debt figure is withheld pending classification.'};
 const alternatives=c.observations.filter(o=>o.field===field&&Number.isFinite(o.value));
 if(alternatives.some(o=>o.period===c.period&&normalizedObservation(o,c)===null))return {displayStatus:'FX / UNITS',availability:'conversion',reason:'A source figure exists, but compatible currency conversion or units are unavailable.'};
 if(c.periodBasis==='TTM'&&alternatives.some(o=>o.duration>=350&&o.duration<=380))return {displayStatus:'ANNUAL ONLY',availability:'annual-only',reason:'Annual data exists. A compatible annual + current YTD - prior YTD series is unavailable; the annual value is retained below.'};
 if(field==='da'&&c.observations.some(o=>['depreciation','amortization','providerDaInput'].includes(o.field)&&o.period===c.period))return {displayStatus:'PARTIAL',availability:'partial',reason:'A depreciation/amortization component exists, but full D&A cannot be reconstructed without the other component.'};
 return {displayStatus:'NOT EXTRACTED',availability:'missing',reason:'No compatible consolidated fact was extracted for this period. The filing may contain additional information in notes or PDFs.'};
}
// Participating funds can be a separate balance-sheet line, a subtotal of
// another fund line, or already included in liabilities. Test the disclosed
// presentation candidates, retain the chosen labels, and never plug a residual.
export function reconcileBalance(bs,period){
 if(!['assets','liabilities','totalEquity'].every(k=>Number.isFinite(bs[k])))return null;
 const base=bs.assets-bs.liabilities-bs.totalEquity,variants=[{presentation:[],residual:base}];
 for(const key of ['temporarySyirkah','participantFunds'])if(Number.isFinite(bs[key])&&bs[key]!==0)for(const v of [...variants])variants.push({presentation:[...v.presentation,key],residual:v.residual-bs[key]});
 const chosen=variants.toSorted((a,b)=>Math.abs(a.residual)-Math.abs(b.residual)||a.presentation.length-b.presentation.length)[0];
 return {...chosen,tolerance:Math.max(.001,Math.abs(bs.assets)*.001),period,alternatives:variants,policy:'Compare disclosed presentation candidates; fund subtotals are not counted twice. No balancing plug or valuation-input adjustment.'};
}
export function evidenceAssessment(c,r){
 const reasons=[],checks=[],demo=c.mode==='demo';
 const add=(code,en,id,blocking=false)=>{reasons.push(en);checks.push({level:blocking?'error':'warning',code,en,id,blocking});};
 if(demo)return {status:'SYNTHETIC',actionable:false,checks:[],reasons:['Synthetic classroom data'],verified:0,total:0};
 if(c.sourceScaleIssues?.length)add('SOURCE_SCALE','WAIT: comparative primary statement amounts disagree by a common scale factor. Reconcile reporting units before valuation; no automatic rescaling.','TUNGGU: angka laporan primer pembanding berbeda faktor skala. Rekonsiliasi satuan sebelum valuasi; tanpa pengubahan skala otomatis.',true);
 if(c.corporateActionIssue&&!r.valid)add('CORPORATE_ACTION','WAIT: unresolved corporate-action adjustment in price history. Refresh an adjusted series before using the price signal.','TUNGGU: penyesuaian aksi korporasi riwayat harga belum selesai.',true);
 const age=(Date.parse(c.valuationDate)-Date.parse(c.priceDate))/86400000;
 if(!(c.price>0)||!Number.isFinite(age)||age<0||age>7)add('CURRENT_QUOTE','WAIT: obtain a valid market quote dated within seven calendar days. The old last-trade price is not a current executable reference.','TUNGGU: perlukan harga valid maksimal tujuh hari. Harga transaksi lama bukan referensi kini.',true);
 if(c.currency!=='IDR'||c.units!=='IDR bn / shares bn')add('INPUT_UNITS','WAIT: reconcile currency and financial/share units.','TUNGGU: rekonsiliasi mata uang dan satuan keuangan/saham.',true);
 if(c.quoteDisagreement>.01)add('MARKET_CONFLICT','WAIT: same-date exchange and provider closing prices differ by more than 1%.','TUNGGU: harga penutupan BEI dan penyedia pada tanggal sama berbeda lebih dari 1%.',true);
 if(!r.valid&&r.engine!=='technical')add('METHOD_UNAVAILABLE','WAIT: no eligible fundamental method or complete technical signal. Refresh or import the missing inputs listed under Model Integrity.','TUNGGU: belum ada metode fundamental atau sinyal teknikal lengkap. Perbarui atau impor input di Integritas Model.',true);
 if(r.engine==='technical'){
  add('PRICE_ONLY','Technical signal only: 50-session trend, 63-session momentum and RSI(14). No intrinsic fair value or valuation upside is claimed.','Sinyal teknikal saja: tren 50 sesi, momentum 63 sesi dan RSI(14). Tanpa nilai intrinsik atau potensi valuasi.');
  if(!(c.technicals?.observations>=64&&c.technicals.sma50>0&&Number.isFinite(c.technicals.momentum)&&Number.isFinite(c.technicals.rsi)))add('TECHNICAL_HISTORY','WAIT: at least 64 valid closes and complete technical indicators are required.','TUNGGU: perlu minimal 64 penutupan valid dan indikator lengkap.',true);
  if(c.bookEquity<0&&r.recommendation==='BUY')add('DISTRESS_BUY','WAIT: negative book equity prevents an automatic technical BUY. A positive price trend does not resolve capital impairment.','TUNGGU: ekuitas negatif mencegah BUY teknikal otomatis. Tren harga positif tidak mengatasi penurunan modal.',true);
  return {status:'PRICE ONLY',actionable:!checks.some(x=>x.blocking),checks,reasons,verified:0,total:0};
 }
 if(c.bookEquity<0)add('NEGATIVE_EQUITY','Negative parent equity: capital impairment risk. A model-implied valuation does not resolve solvency or recapitalisation risk.','Ekuitas induk negatif: risiko penurunan modal. Estimasi valuasi tidak menyelesaikan risiko solvabilitas atau rekapitalisasi.');
 if(c.netIncome>0&&Number.isFinite(c.ebit)&&c.ebit<=0)add('EARNINGS_QUALITY','Parent earnings are positive while operating profit is nonpositive. Check investment income, disposals and other nonrecurring gains.','Laba induk positif sementara laba operasi tidak positif. Periksa pendapatan investasi, pelepasan aset dan laba nonberulang.');
 const rows=c.evidence?.rows||[],find=k=>rows.find(x=>x.field===k),bank=/financial|bank|insurance/i.test(c.sector||'');
 const neededSet=new Set(r.weight>0?(bank||r.engine==='residual'?['netIncome','bookEquity']:['revenue','ebit','debt','cash','minority','preferred']):[]);
 for(const leg of r.relative?.legs||[])if(leg.price>0){neededSet.add(multipleFields[leg.metric]);if(leg.metric.startsWith('ev'))for(const k of ['debt','cash','minority','preferred'])neededSet.add(k);}
 const needed=[...neededSet],verified=needed.filter(k=>['PRIMARY','CORROBORATED'].includes(find(k)?.status)).length;
 const derivedUsed=needed.filter(k=>find(k)?.derived&&(find(k).calculation.kind!=='ttm'||find(k).calculation.review));if(derivedUsed.length)add('DERIVED_INPUTS','Used inputs reconstructed from reported components: '+derivedUsed.join(', ')+'. Inspect formulas, reconciliation controls and definition notes.','Input terpakai direkonstruksi dari komponen laporan: '+derivedUsed.join(', ')+'. Periksa rumus, rekonsiliasi, dan catatan definisi.');
 const conflicts=needed.filter(k=>['CONFLICT','DEFINITION'].includes(find(k)?.status));
 if(conflicts.length)add('SOURCE_CONFLICT','WAIT: reconcile material source/definition differences in used inputs: '+conflicts.join(', ')+'.','TUNGGU: rekonsiliasi perbedaan sumber/definisi pada input yang digunakan: '+conflicts.join(', ')+'.',true);
 if(verified<needed.length)add('EVIDENCE_GAP',`${verified}/${needed.length} used inputs have primary/corroborating evidence. The valuation signal is conditional on the remaining supplied/provider figures.`,`${verified}/${needed.length} input terpakai memiliki bukti primer/pendukung. Sinyal valuasi bersyarat pada angka pengguna/penyedia lainnya.`);
 for(const leg of (r.relative?.legs||[]).filter(x=>x.price>0)){
  const used=(r.relative.peers||[]).filter(p=>multipleRatio(p,leg.metric)!==null),count=used.filter(p=>['PRIMARY','CORROBORATED'].includes(p.evidence?.rows?.find(x=>x.field===multipleFields[leg.metric])?.status)).length;
  if(count<3)add('PEER_EVIDENCE',`${leg.metric}: ${count}/${leg.count} peer denominators have primary/corroborating evidence; remaining provider figures reduce assurance.`,`${leg.metric}: ${count}/${leg.count} penyebut pembanding memiliki bukti primer/pendukung; sisanya mengurangi kepastian.`);
  if(used.some(p=>p.period!==c.period))add('PEER_PERIOD',`${leg.metric}: trailing-year/closing-balance end dates differ by up to 100 days; individual dates are disclosed.`,`${leg.metric}: akhir periode tahunan/TTM/saldo berbeda maksimal 100 hari; tanggal tiap emiten ditampilkan.`);
 }
 if(c.subIndustry&&r.relative?.price>0&&!(r.relative.peers||[]).some(p=>p.subIndustry===c.subIndustry))add('PEER_BUSINESS','Industry peers are used because no same-subindustry peer qualified. This is a broad comparable screen, not analyst-approved business equivalence.','Pembanding industri digunakan karena tidak ada subindustri sama yang layak. Kesetaraan bisnis belum disetujui analis.');
 if(r.engine==='residual')add('ROE_FADE','Residual-income estimate assumes clean-surplus accounting and a five-year competitive-return fade. Check book asset quality, OCI and payout; accounting book equity is not NAV.','Estimasi residual income mengasumsikan akuntansi surplus bersih dan penurunan imbal hasil selama lima tahun. Periksa kualitas aset buku, OCI dan dividen; ekuitas buku bukan NAV.');
 if(r.weight===0&&(r.relative?.legs||[]).every(x=>!x.metric.startsWith('ev'))&&['debt','cash','minority','preferred'].some(k=>['CONFLICT','DEFINITION'].includes(find(k)?.status)))add('EXCLUDED_BRIDGE_CONFLICT','DCF and EV multiples are excluded because capital-claim figures disagree. The active P/E or P/B calculation does not use those disputed claims.','DCF dan kelipatan EV dikecualikan karena klaim modal berbeda. Perhitungan P/E atau P/B aktif tidak memakai klaim yang diperselisihkan.');
 if(c.fx?.some(f=>f.currency!=='IDR'))add('FX_CONVENTION',c.valuationFx?.length?'Foreign facts use valuation-date spot for comparable pricing. Forecasts are nominal IDR under a fixed-spot FX scenario; historical-period closing conversions remain source references, not an audited restatement.':'Valuation-date FX is unavailable. Fiscal-date conversion remains a dated approximation; refresh current FX before treating cross-currency multiples as comparable.','Angka valas memerlukan konvensi kurs valuasi dan proyeksi yang konsisten.');
 if(c.industry?.includes('Holding'))add('HOLDING_NAV','Holding-company multiples do not replace attributable NAV/SOTP; use the sector tool and verify parent claims.','Kelipatan holding tidak menggantikan NAV/SOTP.');
 if(extractiveCompany(c))add('COMMODITY_CYCLE','Commodity-cycle risk: trailing peer pricing is indicative. Generic perpetual DCF is excluded; reserves, mine life, expansion and normalized commodity prices are not modelled.','Risiko siklus komoditas: harga relatif historis bersifat indikatif. DCF perpetuitas generik dikecualikan; cadangan, umur tambang, ekspansi dan normalisasi harga belum dimodelkan.');
 if(!bank&&(r.relative?.legs||[]).some(x=>x.metric==='pb'&&x.price>0))add('ASSET_BOOK','Asset-heavy P/B fallback. Book equity is an accounting denominator, not appraised NAV or liquidation value; asset quality and persistent losses matter.','Fallback P/B usaha padat aset. Ekuitas buku bukan NAV hasil penilaian atau nilai likuidasi; kualitas aset dan rugi berulang berpengaruh.');
 if(!bank&&c.capexRatio>.35)add('EXPANSION_CAPEX','Expansion capex exceeds 35% of revenue. Generic perpetual DCF is excluded; relative pricing remains eligible.','Capex ekspansi melebihi 35% pendapatan. DCF perpetuitas generik dikecualikan; valuasi relatif tetap dapat digunakan.');
 if(c.balanceCheck&&Math.abs(c.balanceCheck.residual)>c.balanceCheck.tolerance)add('BALANCE_SHEET','WAIT: primary assets, liabilities and equity do not reconcile within 0.1% of assets.','TUNGGU: aset, liabilitas dan ekuitas primer tidak seimbang dalam toleransi 0,1% aset.',true);
 if(c.latestInterim&&c.periodBasis!=='TTM')add('NEWER_FILING',`Newer interim filing ${c.latestInterim.period} is available; current annual base is ${c.period}. No unsupported quarterly annualization.`,`Laporan interim ${c.latestInterim.period} tersedia; basis tahunan kini ${c.period}. Tidak ada annualisasi kuartal tanpa dukungan.`);
 if((c.sourceAttempts||[]).some(x=>['failed','partial'].includes(x.status)))add('REFRESH_INCOMPLETE','At least one source update failed or was incomplete. Cached evidence retains its original dates.','Sebagian pembaruan sumber gagal atau belum lengkap. Bukti cache tetap memakai tanggal aslinya.');
 const blocked=checks.some(x=>x.blocking),conditional=checks.some(x=>!x.blocking);
 return {status:conflicts.length?'CONFLICT':blocked?'BLOCKED':conditional?'CONDITIONAL':'RECONCILED',actionable:r.valid===true&&!blocked,checks,reasons,verified,total:needed.length};
}
