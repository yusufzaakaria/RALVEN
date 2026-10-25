import {sample} from '../src/data.mjs';
import {assumptions} from '../src/research.mjs';
export function recoveryFixture(){
 const c={...sample('TLKM'),revenue:1000,ebit:-50,netIncome:-40,ebitda:-20,debt:100,cash:600,minority:0,preferred:0,bookEquity:500,shares:1,price:500,history:[{year:2023,netIncome:-20,ocf:-10},{year:2024,netIncome:-30,ocf:-20},{year:2025,netIncome:-40,ocf:-30}]};
 c.peers=c.peers.map((p,i)=>({...p,price:200+i*20,shares:10,netIncome:100,ebitda:300,revenue:2000+i*100,debt:50,cash:20,minority:0,preferred:0}));
 const a=assumptions(c);a.paths=[[-.1,.12],[.02,.07],[.12,.05],[.18,.04],[.2,.04]].map(([margin,capex])=>({growth:.05,margin,tax:.22,da:.03,capex,nwc:.03}));
 c.recoveryPlan={reviewed:true,noExternalFinancing:true,source:'https://example.com/illustrative-recovery',rationale:'Synthetic reviewed cash-funded recovery fixture; not issuer guidance.',sourcePeriod:c.period,valuationDate:c.valuationDate,reviewedAt:c.valuationDate,availableCash:600,minimumCash:50,interestPayments:[5,5,5,5,5],principalPayments:[10,10,10,10,10],otherPayments:[1,1,1,1,1]};
 return {c,a};
}
