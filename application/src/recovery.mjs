import {methodProfile} from './method-registry.mjs';

export const recoveryDrivers=['growth','margin','tax','da','capex','nwc'];
export const recoveryPayments=['interestPayments','principalPayments','otherPayments'];
const dateValid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
// Preserve the original positive-EBIT calculation exactly. A loss does not
// generate an immediate cash tax receipt. Tax-loss utilization is not assumed.
export const operatingNopat=(ebit,tax)=>ebit>=0?ebit*(1-tax):ebit;
export function recoveryReview(c,a,cashFlows=[]){
 const p=c.recoveryPlan;
 if(!p)return {active:false,eligible:false,reasons:[],rows:[]};
 const reasons=[],add=(code,en,id)=>reasons.push({code,en,id});
 if(methodProfile(c).family!=='operating')add('RECOVERY_SCOPE','Cash-funded recovery is supported only for operating companies. Use an appropriate sector model.','Pemulihan dengan kas hanya didukung untuk perusahaan operasional. Gunakan model sektoral yang sesuai.');
 if(p.reviewed!==true)add('RECOVERY_REVIEW','Confirm an analyst review of the source evidence, annual forecasts and all cash obligations.','Konfirmasi tinjauan analis atas bukti sumber, proyeksi tahunan, dan seluruh kewajiban kas.');
 if(p.noExternalFinancing!==true)add('RECOVERY_FINANCING','This model requires no new borrowing or equity issuance. A financing/dilution model is required otherwise.','Model ini mensyaratkan tanpa utang atau penerbitan saham baru. Selain itu diperlukan model pendanaan/dilusi.');
 if(!/^https?:\/\/[^\s]+$/i.test(p.source||'')||typeof p.rationale!=='string'||p.rationale.trim().length<20)add('RECOVERY_SOURCE','Provide a source URL and at least 20 characters explaining recovery, liquidity and debt-service assumptions.','Isi URL sumber dan penjelasan minimal 20 karakter tentang asumsi pemulihan, likuiditas, dan pembayaran utang.');
 if(p.sourcePeriod!==c.period||p.valuationDate!==c.valuationDate)add('RECOVERY_BASIS','Review is tied to a different financial period or valuation date. Review again on this basis.','Tinjauan terkait periode laporan atau tanggal valuasi lain. Tinjau ulang pada basis ini.');
 if(!dateValid(p.reviewedAt)||p.reviewedAt>c.valuationDate||p.reviewedAt<c.period)add('RECOVERY_DATE','Provide a valid review date between the financial period end and valuation date.','Isi tanggal tinjauan valid antara akhir periode laporan dan tanggal valuasi.');
 if(p.sourceSnapshot&&p.sourceSnapshot!==c.snapshotId)add('RECOVERY_SNAPSHOT','The source snapshot changed after this review. Reconfirm the plan against the new evidence.','Snapshot sumber berubah setelah tinjauan. Konfirmasi ulang rencana terhadap bukti baru.');
 const cashValid=Number.isFinite(p.availableCash)&&Number.isFinite(p.minimumCash)&&p.availableCash>=0&&p.minimumCash>=0&&p.minimumCash<=p.availableCash&&Number.isFinite(c.cash)&&p.availableCash<=c.cash;
 if(!cashValid)add('RECOVERY_CASH','Available unrestricted cash and minimum reserve must be explicit, nonnegative and no greater than the reported cash balance.','Kas bebas pembatasan dan cadangan minimum harus eksplisit, tidak negatif, dan tidak melebihi saldo kas dilaporkan.');
 const paymentsValid=recoveryPayments.every(key=>Array.isArray(p[key])&&p[key].length===5&&p[key].every(v=>Number.isFinite(v)&&v>=0));
 if(!paymentsValid)add('RECOVERY_PAYMENTS','Enter five explicit annual after-tax interest, principal and other cash-obligation amounts. Blanks are not zero.','Isi lima nilai tahunan eksplisit untuk bunga setelah pajak, pokok, dan kewajiban kas lain. Data kosong bukan nol.');
 const pathsValid=Array.isArray(a.paths)&&a.paths.length===5&&a.paths.every(path=>path&&recoveryDrivers.every(key=>Number.isFinite(path[key]))&&path.growth>-.5&&path.growth<1&&path.margin>-1&&path.margin<1&&path.tax>=0&&path.tax<1&&path.da>=0&&path.capex>=0&&path.nwc>=0&&path.nwc<=1);
 if(!pathsValid)add('RECOVERY_PATHS','Provide all six operating drivers for each of five years. Shared defaults do not establish a recovery path.','Isi seluruh enam pendorong operasi untuk masing-masing lima tahun. Asumsi umum tidak membuktikan jalur pemulihan.');
 if(paymentsValid&&(!Number.isFinite(c.debt)||p.principalPayments.reduce((s,v)=>s+v,0)>c.debt+1e-9))add('RECOVERY_PRINCIPAL','Scheduled principal exceeds existing disclosed financing debt; reconcile debt or provide a separate refinancing model.','Pokok terjadwal melebihi utang pendanaan yang dilaporkan; rekonsiliasi utang atau gunakan model pembiayaan ulang terpisah.');
 if(paymentsValid&&c.debt===0&&p.interestPayments.some(v=>v>0))add('RECOVERY_INTEREST','Debt is zero but financing interest is positive. Reconcile the funding obligations.','Utang nol tetapi bunga pendanaan positif. Rekonsiliasi kewajiban pendanaan.');
 const completeFlows=cashFlows.length===5&&cashFlows.every(row=>Number.isFinite(row.fcff)&&Number.isFinite(row.ebit));
 if(!completeFlows)add('RECOVERY_FORECAST','A complete compatible FCFF projection is required before evaluating liquidity.','Proyeksi FCFF lengkap dan sepadan diperlukan sebelum mengevaluasi likuiditas.');
 else if(!cashFlows.slice(-2).every(row=>row.fcff>0&&row.ebit>0))add('RECOVERY_TERMINAL','Both final forecast years must have positive FCFF and operating profit before applying a stable terminal model.','Kedua tahun proyeksi terakhir harus memiliki FCFF dan laba operasi positif sebelum memakai terminal stabil.');
 const rows=[];
 if(cashValid&&paymentsValid&&completeFlows){let cash=p.availableCash;for(let i=0;i<5;i++){const openingCash=cash,fcff=cashFlows[i].fcff,interest=p.interestPayments[i],principal=p.principalPayments[i],other=p.otherPayments[i];cash+=fcff-interest-principal-other;rows.push({year:i+1,openingCash,fcff,interest,principal,other,closingCash:cash,reserve:p.minimumCash,headroom:cash-p.minimumCash});}if(rows.some(row=>row.headroom< -1e-9))add('RECOVERY_LIQUIDITY','Existing unrestricted cash does not cover forecast deficits, financing payments and the minimum reserve.','Kas bebas pembatasan belum menutup defisit proyeksi, pembayaran pendanaan, dan cadangan minimum.');}
 return {active:true,eligible:reasons.length===0,reasons,rows,minimumHeadroom:rows.length?Math.min(...rows.map(row=>row.headroom)):null,minimumClosingCash:rows.length?Math.min(...rows.map(row=>row.closingCash)):null,source:p.source,reviewedAt:p.reviewedAt,policy:'Annual cash-funded operating recovery; no new financing or dilution. FCFF is discounted before financing payments. Financing obligations enter only the liquidity check, not a second equity-value deduction. No automatic tax benefit for losses. Existing constant WACC and capital-claim valuation assumptions require review; intra-year cash peaks are not modelled.'};
}
