import {residualIncome} from './residual.mjs';
import {methodProfile} from './method-registry.mjs';
import {comparablePeer,multipleFields,multipleCaps,multipleRatio,bridgeComplete,extractiveCompany,assetHeavyCompany} from './comparables.mjs';
import {prepareEvidence,evidenceAssessment} from './evidence.mjs';
import {evaluate,defaults,median,financial,capital,relativeAt} from './engine.mjs';
export function selectPeers(c,pool=c.peers||[]){
 const seen=new Set(),scale=Math.max(1,c.price*c.shares);
 const score=p=>(p.subIndustry&&p.subIndustry===c.subIndustry?0:10)+Math.abs(Date.parse(c.period)-Date.parse(p.period))/86400000/100+Math.abs(Math.log(Math.max(1,p.price*p.shares)/scale));
 return pool.filter(p=>{if(seen.has(p.ticker)||(c.excludedPeerTickers||[]).includes(p.ticker)||!comparablePeer(c,p))return false;seen.add(p.ticker);return true;}).sort((x,y)=>score(x)-score(y)).slice(0,12);
}
export function assumptions(c){return {...defaults,margin:c.ebit>0&&c.revenue>0?Math.min(.95,c.ebit/c.revenue):.15,da:Number.isFinite(c.daRatio)?c.daRatio:c.ebitda>c.ebit&&c.revenue>0?(c.ebitda-c.ebit)/c.revenue:.03,capex:Number.isFinite(c.capexRatio)?c.capexRatio:.055};}
function calculateCompany(subject,a=assumptions(subject),{grid=true}={}){
 const c={...subject,peers:selectPeers(subject)};
 const base=evaluate(c,a,{grid});base.basis='FUNDAMENTAL';base.engine='core';
 if(c.sourceScaleIssues?.length)return {...base,valid:false,basis:'UNRATED',engine:'unavailable',fair:null,low:null,high:null,upside:null,weight:0,eligible:false,dcf:null,relative:{peers:[],legs:[],price:null},scenarios:{bear:null,base:null,bull:null},sensitivity:[],rationale:'Primary comparative statements have inconsistent scale factors. Valuation is withheld until the original reporting units are reconciled.'};
 const disputedBridge=!financial(c)&&['debt','cash','minority','preferred'].some(k=>['CONFLICT','DEFINITION'].includes(c.evidence?.rows?.find(x=>x.field===k)?.status));
 const relativeOnly=methodProfile(c).family==='holding'||disputedBridge||extractiveCompany(c)||(!financial(c)&&c.capexRatio>.35);
 if(base.valid&&!relativeOnly){base.rationale=`${financial(c)?'Financial services use DDM at cost of equity; no corporate net-debt bridge.':base.stable?'Stable positive operating cash flow supports greater intrinsic weight.':'Unproven cash-flow stability reduces intrinsic emphasis when peers qualify.'} Actual eligible weights: ${Math.round(base.weight*100)}% intrinsic / ${Math.round((1-base.weight)*100)}% industry relative. ${!base.eligible?'Intrinsic method excluded: forecast cash flow or equity value is not positive.':base.relative.price===null?'Relative method excluded: fewer than three eligible peers per multiple.':''}`;return base;}
 const age=(Date.parse(c.valuationDate)-Date.parse(c.priceDate))/86400000,reportAge=(Date.parse(c.valuationDate)-Date.parse(c.period))/86400000;
 const hard=!(c.price>0)||!Number.isFinite(age)||age<0||age>7||c.currency!=='IDR'||c.units!=='IDR bn / shares bn';
 const assumptionErrors=base.checks.filter(x=>x.level==='error'&&(x.code.startsWith('ASSUMPTION_')||/^Y[1-5]_/.test(x.code)||x.code==='DRIVER_PATH'||['BOUNDS','GROWTH','REINVESTMENT','FUTURE_DATA'].includes(x.code)));
 if(assumptionErrors.length)return {...base,basis:'UNRATED',engine:'unavailable',fair:null,low:null,high:null,upside:null,relative:{peers:[],legs:[],price:null},scenarios:{bear:null,base:null,bull:null},sensitivity:[],rationale:assumptionErrors.map(x=>x.en).join(' ')};
 const checks=[...base.checks];let legs=[];
 // Partial financial coverage can still support a matched-industry relative model.
 if(!hard&&c.shares>0&&reportAge>=0&&reportAge<=550){
  const peers=c.peers.filter(p=>p.currency==='IDR'&&comparablePeer(c,p)&&p.price>0&&p.shares>0&&p.ticker!==c.ticker);
  // Direct equity multiples do not require a corporate EV bridge.
  // P/B is an asset-heavy/financial fallback, never a fabricated NAV or DCF.
  const specs=financial(c)?['pb','pe']:c.netIncome>0?['pe',...(bridgeComplete(c)&&c.ebitda>0?['evEbitda']:[])]:bridgeComplete(c)&&c.revenue>0?['evSales']:assetHeavyCompany(c)&&c.bookEquity>0?['pb']:[];
  for(const metric of specs.filter(metric=>!disputedBridge||!metric.startsWith('ev'))){const key=multipleFields[metric],used=peers.filter(p=>multipleRatio(p,metric)!==null&&(metric!=='pb'||financial(c)||c.netIncome>0||Number.isFinite(p.netIncome)&&p.netIncome<=0)),values=used.map(p=>multipleRatio(p,metric)),mult=median(values);let price=null;
   if(values.length>=3&&c[key]>0){price=metric.startsWith('ev')?(mult*c[key]+c.cash-c.debt-c.minority-c.preferred)/c.shares:mult*c[key]/c.shares;}
   if(price>0)legs.push({metric,multiple:mult,count:values.length,price,peerTickers:used.map(p=>p.ticker)});
  }
  if(legs.length){const fair=legs.reduce((s,x)=>s+x.price,0)/legs.length,upside=fair/c.price-1;
   const methodNote=methodProfile(c).family==='holding'?'Investment holding: generic DDM excluded. Trailing equity multiples are a conditional reference; use the NAV/SOTP tool with attributable assets and parent claims. ':disputedBridge?'DCF and EV multiples excluded: unresolved capital-claim discrepancies. Direct equity pricing uses undisputed earnings/book inputs. ':extractiveCompany(c)?'Commodity producer: use relative pricing; generic perpetual DCF excluded. Trailing earnings are cycle-sensitive, not normalized resource NAV. ':relativeOnly?'Expansion capex prevents a generic perpetual DCF; use eligible equity/enterprise multiples. ':'';
   const caveat=legs.some(x=>x.metric==='pb')&&!financial(c)?' Asset-heavy P/B fallback: accounting equity is not liquidation value; loss-making peers are used, and asset quality requires caution.':'';
   return {...base,valid:true,engine:'relative',basis:'FUNDAMENTAL',fair,low:relativeAt(c,{legs},.8),high:relativeAt(c,{legs},1.2),upside,weight:0,eligible:false,relative:{peers:peers.filter(p=>legs.some(x=>x.peerTickers.includes(p.ticker))),legs,price:fair},scenarios:{bear:relativeAt(c,{legs},.8),base:fair,bull:relativeAt(c,{legs},1.2)},sensitivity:[],checks:checks.map(x=>x.level==='error'?{...x,level:'warning',scope:'excluded DCF'}:x),recommendation:upside>=a.buy?'BUY':upside<=a.sell?'SELL':'HOLD',rationale:methodNote+'100% industry-relative pricing with at least three eligible observations per multiple. Bear/bull: peer multiples -20%/+20%, with EV-to-equity claims reconciled.'+caveat};
  }

 }
 // When a profitable issuer has too few usable peers, use an equity model
 // supported by parent earnings and book equity rather than guessed EV claims.
 const positiveYears=(c.history||[]).filter(h=>h.basis!=='TTM'&&h.netIncome>0).length;
 if(!hard&&reportAge>=0&&reportAge<=550&&!extractiveCompany(c)&&c.netIncome>0&&c.bookEquity>0&&positiveYears>=2){
  const ri=residualIncome(c,a);if(ri?.price>0){
   const bear=residualIncome(c,a,{initialRoe:ri.initialRoe*.8,ke:ri.ke+.01})?.price,bull=residualIncome(c,a,{initialRoe:ri.initialRoe*1.2,ke:Math.max(.001,ri.ke-.01)})?.price,fair=ri.price,upside=fair/c.price-1;
   return {...base,valid:true,engine:'residual',basis:'FUNDAMENTAL',residual:ri,dcf:null,relative:{peers:c.peers,legs:[],price:null},weight:1,eligible:true,fair,upside,low:Math.min(fair,bear??fair,bull??fair),high:Math.max(fair,bear??fair,bull??fair),scenarios:{bear,base:fair,bull},sensitivity:[],checks:checks.map(x=>x.level==='error'?{...x,level:'warning',scope:'excluded DCF'}:x),recommendation:upside>=a.buy?'BUY':upside<=a.sell?'SELL':'HOLD',rationale:'Residual-income equity model: current parent book equity plus discounted excess earnings. Observed ROE fades linearly to cost of equity over five years; terminal residual income is zero. Clean-surplus book growth follows retained earnings at the selected payout ratio. Used because a complete FCFF model and three eligible industry peers are unavailable. At least two positive annual earnings observations required. This is an analyst fade assumption, not an issuer forecast.'};
  }
 }
 const t=c.technicals;
 if(!hard&&!c.corporateActionIssue&&t?.observations>=64&&t.sma50>0&&Number.isFinite(t.momentum)&&Number.isFinite(t.rsi)){
  const up=c.price>t.sma50&&t.momentum>.05&&t.rsi<75,down=c.price<t.sma50&&t.momentum<-.05;
  return {...base,valid:false,engine:'technical',basis:'TECHNICAL',recommendation:up?'BUY':down?'SELL':'HOLD',fair:null,low:null,high:null,upside:null,weight:0,eligible:false,relative:{peers:[],legs:[],price:null},scenarios:{bear:null,base:null,bull:null},sensitivity:[],checks:checks.map(x=>x.level==='error'?{...x,level:'warning',scope:'excluded fundamental model'}:x),rationale:'Price-only signal; no fundamental fair value. BUY: price > 50-session average, 63-session momentum > 5%, RSI(14) < 75. SELL: price < 50-session average and momentum < -5%. Otherwise HOLD. At least 64 observations and a quote no older than seven days are required.'};
 }
 return {...base,basis:'UNRATED',engine:'unavailable',recommendation:'REVIEW',fair:null,low:null,high:null,upside:null,relative:{peers:[],legs:[],price:null},scenarios:{bear:null,base:null,bull:null},sensitivity:[],rationale:hard?'A current, valid IDR market quote is missing or stale. No actionable rating is issued.':'Insufficient eligible financial or price history. Import verified statements or refresh the feed before issuing a rating.'};
}
export function analyzeCompany(subject,a=assumptions(subject),options={}){
 const c=subject.mode==='demo'?subject:subject.evidence?subject:prepareEvidence(subject);
 c.peers=selectPeers(c).map(p=>p.mode==='demo'||p.evidence?p:prepareEvidence(p));
 const result=calculateCompany(c,a,options),quality=evidenceAssessment(c,result);
 result.quality=quality;result.checks=[...(result.checks||[]),...quality.checks];
 result.modelRecommendation=result.recommendation;
 const allowed=c.mode==='demo'?result.valid||result.engine==='technical':quality.actionable;
 if(!allowed){result.recommendation='WAIT';result.basis='UNRATED';}
 else if(c.mode!=='demo'&&result.valid&&quality.status!=='RECONCILED')result.basis='INDICATIVE';
 result.decision={action:result.recommendation,kind:result.engine==='technical'?'TECHNICAL':result.valid?'VALUATION':'DATA',status:!allowed?'BLOCKED':result.engine==='technical'?'PRICE SIGNAL':result.basis==='INDICATIVE'?'CONDITIONAL':'MODEL ESTIMATE',confidence:!allowed?'UNAVAILABLE':result.engine==='technical'||result.basis==='INDICATIVE'?'LOW':'MEDIUM',signal:result.modelRecommendation==='REVIEW'?null:result.modelRecommendation,reasons:quality.reasons,requirements:quality.checks.filter(x=>x.blocking).map(x=>({code:x.code,en:x.en,id:x.id}))};
 if(quality.reasons.length)result.rationale+=(allowed?' Limitations: ':' Decision withheld: ')+quality.reasons.join(' ');
 return result;
}
export function coverageRows(universe,catalog){const pool=catalog.companies||[],facts=new Map(pool.map(c=>[c.ticker,c]));return universe.issuers.map(p=>{
 const raw=facts.get(p.ticker);if(!raw)return {...p,recommendation:'WAIT',basis:'UNRATED',decisionKind:'DATA',decisionStatus:'BLOCKED',confidence:'UNAVAILABLE',reason:'No usable provider record. Refresh sources or import verified statements and a current quote.',requirements:['PROVIDER_UNAVAILABLE']};
 const c={...raw,valuationDate:new Date().toISOString().slice(0,10),peers:selectPeers(raw,pool)},r=analyzeCompany(c,assumptions(c),{grid:false});
 return {...p,price:c.price,volume:c.volume,snapshotId:c.snapshotId,priceDate:c.priceDate,period:c.period,fair:r.fair,upside:r.upside,recommendation:r.recommendation,basis:r.basis,decisionKind:r.decision.kind,decisionStatus:r.decision.status,confidence:r.decision.confidence,sourceStatus:r.quality?.status,verifiedInputs:r.quality?.verified,requiredInputs:r.quality?.total,periodBasis:c.periodBasis||'ANNUAL',method:r.engine,reason:r.rationale,requirements:r.decision.requirements.map(x=>x.code),updatedAt:c.updatedAt};
 });}
