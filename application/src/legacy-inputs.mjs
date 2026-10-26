// Historical package versions documented a zero-for-missing assumption. Those
// raw records remain inspectable, but are not certified source observations.
export function legacyInputRejections(c){
 if(c.mode==='demo')return [];
 const notes=[c.dataNotes,c.inferred,c.assumptions,c.source].flatMap(x=>Array.isArray(x)?x:typeof x==='string'?[x]:[]).filter(x=>typeof x==='string').flatMap(x=>x.split(/(?<=[.!?])\s+/));
 const result=[];
 for(const [field,pattern]of [['preferred',/preferred(?:[-\s]equity|[-\s]stock|[-\s]share)?/i],['minority',/minority(?:[-\s]interest)?/i]]){
  const reason=notes.find(n=>pattern.test(n)&&/(assum(?:ed|e|ption)[\s\S]*zero|zero[\s\S]*assum)/i.test(n));
  const native=c.providerNative?.[field+'|'+(c.providerPeriod||c.period)];
  if(reason&&!Number.isFinite(native?.value))result.push({field,value:c.inputRejections?.find(x=>x.field===field)?.value??c.providerSnapshot?.[field]??c[field]??null,period:c.providerPeriod||c.period,reason:'Legacy missing-input zero assumption rejected: '+reason});
 }
 return result;
}
