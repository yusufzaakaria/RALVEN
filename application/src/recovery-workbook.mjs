import {recoveryReview} from './recovery.mjs';

export function recoveryInputRows(c){const p=c.recoveryPlan||{};return [['CASH-FUNDED RECOVERY / IDR BN'],['Analyst review confirmed',p.reviewed?1:0],['No new borrowing or equity',p.noExternalFinancing?1:0],['Source URL',p.source||''],['Review rationale',p.rationale||''],['Source period',p.sourcePeriod||c.period||''],['Review date',p.reviewedAt||''],['Unrestricted available cash',p.availableCash??null],['Minimum cash reserve',p.minimumCash??null],['Year','Y1','Y2','Y3','Y4','Y5'],['After-tax interest',...Array.from({length:5},(_,i)=>p.interestPayments?.[i]??null)],['Principal cash payments',...Array.from({length:5},(_,i)=>p.principalPayments?.[i]??null)],['Other cash obligations',...Array.from({length:5},(_,i)=>p.otherPayments?.[i]??null)],['Valuation date',p.valuationDate||c.valuationDate||''],['Reference source snapshot',p.sourceSnapshot||p.referenceSnapshot||''],['Scope','Optional: leave review flag 0 unless intentionally enabling a reviewed cash-funded recovery. Replace all six yearly operating-driver links with reviewed literal values in Driver Paths. Blank obligations are not zero. No new financing or dilution. Reimport after source or review changes.']];}

// These are input/build schedules, not terminal audit sheets. Financing cash
// payments constrain liquidity and never reduce FCFF equity value twice.
export function recoverySheets(c,a,d,input){
 const p=c.recoveryPlan;if(!p)return {};
 const F=(formula,value)=>({formula,value}),review=recoveryReview(c,a,d?.rows||[]);
 const spec={'Recovery Inputs':recoveryInputRows(c)};
 if(!d?.rows?.length){spec['Recovery Inputs'].push(['Blocked requirements',review.reasons.map(x=>x.en).join(' ')]);return spec;}
 const rows=Array.from({length:18},()=>[]);rows[0]=['RECOVERY CASH BUDGET / NOT A SECOND VALUATION DEDUCTION'];rows[1]=['Year',1,2,3,4,5];
 const labels={3:'Opening cash',4:'FCFF before financing',5:'After-tax interest',6:'Principal payments',7:'Other cash obligations',8:'Closing cash',9:'Minimum cash reserve',10:'Cash headroom',12:'Minimum annual headroom',13:'Review and input constraints',14:'Recovery and funding eligible',16:'Scope',17:'Terminal policy',18:'Timing limitation'};for(const [row,label]of Object.entries(labels))rows[row-1][0]=label;
 for(let i=0;i<5;i++){const col=String.fromCharCode(66+i),prev=String.fromCharCode(65+i),v=review.rows[i]||{};const set=(row,formula,value)=>rows[row-1][i+1]=F(formula,value);set(3,i?prev+'8':"'Recovery Inputs'!$B$8",v.openingCash);set(4,`Forecast!${col}12`,v.fcff);for(const [row,source,key]of [[5,11,'interest'],[6,12,'principal'],[7,13,'other']])set(row,`'Recovery Inputs'!${col}${source}`,v[key]);set(8,`${col}3+${col}4-${col}5-${col}6-${col}7`,v.closingCash);set(9,"'Recovery Inputs'!$B$9",p.minimumCash);set(10,`${col}8-${col}9`,v.headroom);}
 rows[11][1]=F('MIN(B10:F10)',review.minimumHeadroom);
 const checks=["'Recovery Inputs'!B2=1","'Recovery Inputs'!B3=1","LEN('Recovery Inputs'!B4)>7",`OR(LEFT('Recovery Inputs'!B4,8)="https://",LEFT('Recovery Inputs'!B4,7)="http://")`,"LEN('Recovery Inputs'!B5)>=20",`'Recovery Inputs'!B6=${input('period')}`,`'Recovery Inputs'!B14=${input('valuationDate')}`,`DATEVALUE('Recovery Inputs'!B7)<=DATEVALUE(${input('valuationDate')})`,`DATEVALUE('Recovery Inputs'!B7)>=DATEVALUE(${input('period')})`,"COUNT('Driver Paths'!B2:F7)=30","COUNT('Recovery Inputs'!B8:B9)=2","'Recovery Inputs'!B8>=0",`'Recovery Inputs'!B8<=${input('cash')}`,"'Recovery Inputs'!B9>=0","'Recovery Inputs'!B9<='Recovery Inputs'!B8","COUNT('Recovery Inputs'!B11:F13)=15","MIN('Recovery Inputs'!B11:F13)>=0",`SUM('Recovery Inputs'!B12:F12)<=${input('debt')}+0.000000001`,`OR(${input('debt')}>0,SUM('Recovery Inputs'!B11:F11)=0)`];
 rows[12][1]=F(`IFERROR(AND(${checks.join(',')}),FALSE)`,review.reasons.every(x=>['RECOVERY_TERMINAL','RECOVERY_LIQUIDITY'].includes(x.code)));
 rows[13][1]=F('IFERROR(AND(B13,B12>=-0.000000001,Forecast!E12>0,Forecast!F12>0,Forecast!E6>0,Forecast!F6>0),FALSE)',review.eligible);
 rows[15][1]='Financing payments affect the liquidity budget only. FCFF is discounted before financing; the current debt bridge is applied once.';
 rows[16][1]='Both final forecast years require positive operating profit and FCFF. No immediate loss-tax credit is assumed.';
 rows[17][1]='Annual closing cash only; intra-year peaks, refinancing and new equity are not modelled. Constant WACC and original capital-claim values require review.';
 spec['Recovery Funding']=rows;return spec;
}
