import {evaluate,financial} from './engine.mjs';
import {methodProfile} from './method-registry.mjs';
import {extractiveCompany} from './comparables.mjs';

// Availability is distinct from source assurance and final actionability.
// Residual income is intrinsic, but must not be labelled cash-flow DCF.
export function methodAssessment(c,a,r){
 const profile=methodProfile(c),base=evaluate(c,a,{grid:false});
 const rows=c.evidence?.rows||[],find=field=>rows.find(row=>row.field===field);
 const required=financial(c)?['netIncome','bookEquity']:['revenue','ebit','debt','cash','minority','preferred'];
 const reasons=(base.checks||[]).filter(x=>x.level==='error').map(({code,en,id})=>({code,en,id}));
 const add=(code,en,id)=>reasons.push({code,en,id});
 if(c.sourceScaleIssues?.length)add('SOURCE_SCALE','Reconcile primary reporting units.','Rekonsiliasi satuan laporan primer.');
 if(profile.family==='holding')add('SECTOR_SOTP','Provide attributable asset DCF/SOTP and parent capital claims.','Lengkapi DCF/SOTP aset yang dapat diatribusikan serta klaim induk.');
 if(extractiveCompany(c))add('SECTOR_RESOURCE','Provide reserves, saleable production, mine life, commodity assumptions, funding and closure cash flows.','Lengkapi cadangan, produksi, umur tambang, asumsi komoditas, pendanaan, dan arus kas penutupan.');
 if(!financial(c)&&c.capexRatio>.35)add('EXPANSION_SCHEDULE','Review expansion and maintenance capex, recovery and financing before using generic FCFF.','Tinjau capex ekspansi/pemeliharaan, pemulihan, dan pendanaan sebelum memakai FCFF generik.');
 if(!financial(c)&&required.some(key=>['CONFLICT','DEFINITION'].includes(find(key)?.status)))add('CLAIM_CONFLICT','Reconcile used operating inputs and capital claims.','Rekonsiliasi input operasi dan klaim modal terpakai.');
 if(base.valid&&!base.eligible)add('CASH_FLOW_ELIGIBILITY','Review cash-flow recovery, terminal profitability and financing. Current generic model has no supported intrinsic value.','Tinjau pemulihan arus kas, profitabilitas terminal, dan pendanaan. Model generik belum memiliki nilai intrinsik yang didukung.');
 const cashFlowAvailable=base.valid&&base.eligible&&!reasons.length;
 const intrinsicAvailable=r.weight>0&&r.eligible&&Number.isFinite(r.engine==='residual'?r.residual?.price:r.dcf?.price);
 const relativeAvailable=r.relative?.price>0;
 const status=available=>!available?'BLOCKED':c.mode==='demo'||r.quality?.status!=='RECONCILED'?'CONDITIONAL':'AVAILABLE';
 const gaps=required.filter(field=>!Number.isFinite(c[field])).map(field=>({field,availability:find(field)?.availability||'missing',reason:find(field)?.availabilityReason||find(field)?.reason||'No compatible selected-period value',sources:(find(field)?.observations||[]).map(o=>({url:o.url,period:o.period,locator:o.locator})).slice(0,3)}));
 return {schema:'RALVEN-METHODS-1',family:profile.family,period:c.period,periodBasis:c.periodBasis||'ANNUAL',coverage:intrinsicAvailable&&relativeAvailable?'BOTH':intrinsicAvailable?'INTRINSIC_ONLY':relativeAvailable?'RELATIVE_ONLY':'INCOMPLETE',courseComparison:cashFlowAvailable&&relativeAvailable?'DCF_AND_RELATIVE':intrinsicAvailable&&relativeAvailable?'ALTERNATIVE_INTRINSIC_AND_RELATIVE':'INCOMPLETE',intrinsic:{model:r.engine==='residual'?'Residual income':financial(c)?'DDM':'FCFF DCF',status:status(intrinsicAvailable),value:intrinsicAvailable?(r.engine==='residual'?r.residual.price:r.dcf.price):null,weight:intrinsicAvailable?r.weight:0,category:r.engine==='residual'?'ACCOUNTING_INTRINSIC':'CASH_FLOW_DCF'},cashFlowDcf:{model:financial(c)?'DDM':'FCFF DCF',status:status(cashFlowAvailable),value:cashFlowAvailable?base.dcf.price:null,requiredInputs:required,gaps,reasons},relative:{model:(r.relative?.legs||[]).filter(x=>x.price>0).map(x=>x.metric.toUpperCase()).join(' / ')||'Comparable-company valuation',status:status(relativeAvailable),value:relativeAvailable?r.relative.price:null,weight:relativeAvailable?1-r.weight:0,reasons:relativeAvailable?[]:[{code:'ELIGIBLE_PEERS',en:'At least three comparable observations per usable multiple and a valid subject denominator are required.',id:'Perlu minimal tiga observasi pembanding per kelipatan serta penyebut emiten yang valid.'}]},actionable:c.mode==='demo'?r.valid:r.quality?.actionable===true,policy:'Assess intrinsic and relative eligibility independently. Method availability does not certify evidence or assumptions. Residual income does not replace a required cash-flow DCF. Missing inputs are never set to zero.'};
}
