// Narrow dimensional mapping: an explicit closing preferred-stock zero may
// supplement the face statement only after the same filing's totals agree.
// Opening balances, movements, nil, segments and positive nominal share capital
// cannot establish the value of a preferred claim.
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1],m[2]]));
const text=(s,tag)=>s.match(new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([^<]+)</(?:[\\w-]+:)?'+tag+'>'))?.[1];
const members=new Set(['PreferredStocksMember','CommonStocksMember','EquityAttributableToParentEntityMember','NonControllingInterestsMember']);
export const capitalScheduleScope='Selected closing equity schedule. Only explicit preferred-stock zero with matching consolidated, parent and common-stock totals may supplement the model. Positive nominal capital, opening balances, movements and nil do not establish a preferred claim value.';
export function extractCapitalSchedule(xml,{ticker,url,publishedAt,retrievedAt}={}){
 if(xml.length>8e6||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Unsupported XBRL document');
 const namespaces=attrs(xml.match(/<(?:[\w-]+:)?xbrl\b([^>]*)>/)?.[1]||''),resolve=q=>{const [prefix,local]=String(q||'').split(':');return {namespace:namespaces['xmlns:'+prefix],local};};
 const contexts=new Map(),units=new Map(),facts=[];
 for(const m of xml.matchAll(/<(?:[\w-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?context>/g)){
  const a=attrs(m[1]),body=m[2],period=text(body,'instant');if(!period||text(body,'startDate')||!/^\d{4}-\d{2}-\d{2}$/.test(period))continue;
  const dimensions=[...body.matchAll(/<(?:[\w-]+:)?explicitMember\b([^>]*)>([^<]+)<\/(?:[\w-]+:)?explicitMember>/g)].map(x=>({axis:resolve(attrs(x[1]).dimension),member:resolve(x[2].trim())}));
  const invalid=/<(?:[\w-]+:)?typedMember\b/.test(body)||dimensions.length>1||(!dimensions.length&&/<(?:[\w-]+:)?(?:segment|scenario)\b/.test(body));
  contexts.set(a.id,{period,entity:text(body,'identifier'),dimensions,invalid});
 }
 for(const m of xml.matchAll(/<(?:[\w-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?unit>/g)){
  if(/<(?:[\w-]+:)?divide\b/.test(m[2]))continue;const currency=text(m[2],'measure')?.split(':').at(-1);if(/^[A-Z]{3}$/.test(currency||''))units.set(attrs(m[1]).id,currency);
 }
 for(const m of xml.matchAll(/<([\w-]+):(EquityPositionEndOfThePeriod|Equity|EquityAttributableToEquityOwnersOfParentEntity|CommonStocks|PreferredStocks)\b([^>]*)>([^<]*)<\/\1:\2>/g)){
  const a=attrs(m[3]),ct=contexts.get(a.contextRef),namespace=namespaces['xmlns:'+m[1]],currency=units.get(a.unitRef),raw=m[4].trim();
  if(!ct||ct.invalid||!ct.entity||!currency||!/^https?:\/\/www\.idx\.co\.id\/xbrl\/taxonomy\/\d{4}-\d{2}-\d{2}\/cor$/.test(namespace||'')||Object.entries(a).some(([k,v])=>k.endsWith(':nil')&&['true','1'].includes(v))||!raw||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw))continue;
  const d=ct.dimensions[0];if(d&&(d.axis.namespace!==namespace||d.member.namespace!==namespace||d.axis.local!=='ComponentsOfEquityAxis'||!members.has(d.member.local)||m[2]!=='EquityPositionEndOfThePeriod'))continue;
  const value=Number(raw);if(!Number.isFinite(value))continue;
  facts.push({tag:m[2],context:a.contextRef,period:ct.period,entity:ct.entity,currency,member:d?.member.local||null,value,rounding:a.decimals!==undefined&&Number.isFinite(Number(a.decimals))?10**-Number(a.decimals):0});
 }
 const rows=[],observations=[],seen=new Set();
 for(const preferred of facts.filter(f=>f.tag==='EquityPositionEndOfThePeriod'&&f.member==='PreferredStocksMember')){
  const key=[preferred.period,preferred.currency,preferred.entity].join('|');if(seen.has(key))continue;seen.add(key);
  const scope=facts.filter(f=>f.period===preferred.period&&f.currency===preferred.currency&&f.entity===preferred.entity),one=(tag,member=null)=>{const xs=scope.filter(f=>f.tag===tag&&f.member===member);return xs.length&&new Set(xs.map(f=>f.value)).size===1?xs[0]:null;};
  const selected=one('EquityPositionEndOfThePeriod','PreferredStocksMember');
  const comparisons=[['Consolidated equity',one('Equity'),one('EquityPositionEndOfThePeriod')],['Parent equity',one('EquityAttributableToEquityOwnersOfParentEntity'),one('EquityPositionEndOfThePeriod','EquityAttributableToParentEntityMember')],['Common stock',one('CommonStocks'),one('EquityPositionEndOfThePeriod','CommonStocksMember')]];
  const checks=comparisons.map(([label,face,schedule])=>({label,faceTag:face?.tag||null,faceContext:face?.context||null,face:face?.value??null,scheduleTag:schedule?.tag||null,scheduleContext:schedule?.context||null,schedule:schedule?.value??null,residual:face&&schedule?schedule.value-face.value:null,tolerance:face&&schedule?Math.max(1,(face.rounding+schedule.rounding)/2):0,passed:!!face&&!!schedule&&Math.abs(schedule.value-face.value)<=Math.max(1,(face.rounding+schedule.rounding)/2)}));
  const facePreferred=scope.filter(f=>f.tag==='PreferredStocks'&&!f.member),conflictingFace=!!selected&&facePreferred.some(f=>f.value!==selected.value);
  const supported=!!selected&&selected.value===0&&checks.every(x=>x.passed),accepted=supported&&!conflictingFace;
  const reason=!selected?'Conflicting closing schedule values':selected.value!==0?'Positive or negative nominal stock balance requires claim-rights review':!checks.every(x=>x.passed)?'Closing schedule totals are missing or disagree with the face statement':conflictingFace?'Face preferred-stock balance conflicts with the closing schedule':'Explicit closing zero; consolidated, parent and common-stock totals agree';
  rows.push({period:preferred.period,currency:preferred.currency,context:preferred.context,member:preferred.member,tag:preferred.tag,value:selected?.value??null,reportedValues:[...new Set(scope.filter(f=>f.tag===preferred.tag&&f.member===preferred.member).map(f=>f.value))],status:accepted?'SUPPORTED ZERO':supported&&conflictingFace?'CONFLICT':'REVIEW',reason,checks});
  if(supported&&(!facePreferred.length||conflictingFace))observations.push({field:'preferred',value:0,currency:preferred.currency,unit:'units',period:preferred.period,start:null,duration:0,definition:'preferred',sourceId:'idx-capital-schedule',sourceGroup:'issuer:'+ticker,sourceType:'primary',url,locator:preferred.tag+' / '+preferred.context+' / ComponentsOfEquityAxis=PreferredStocksMember',publishedAt:publishedAt?.slice(0,10)||null,retrievedAt,calculation:{kind:'reported-closing-capital',formula:'Explicit preferred-stock closing balance',components:[{tag:preferred.tag+' / '+preferred.context,value:0,sign:1}],controls:checks,note:capitalScheduleScope}});
 }
 return {observations,rows,scope:capitalScheduleScope};
}
