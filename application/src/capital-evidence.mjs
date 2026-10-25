// Only reconstruct NCI from a complete, compatible consolidated equity
// reconciliation in one original filing. Nil/missing facts never certify zero.
export function capitalEvidence(observations){
 const result=[];
 const primary=observations.filter(o=>o.sourceType==='primary'&&o.sourceId!=='idx-ttm'&&o.url&&!o.duration&&Number.isFinite(o.value));
 for(const total of primary.filter(o=>o.field==='totalEquity')){
  const compatible=o=>o.url===total.url&&o.period===total.period&&o.currency===total.currency&&o.unit===total.unit&&o.sourceGroup===total.sourceGroup;
  if(primary.some(o=>o.field==='minority'&&compatible(o)))continue;
  const parents=primary.filter(o=>o.field==='bookEquity'&&o.definition==='parent_equity'&&compatible(o));
  if(!parents.length||new Set(parents.map(o=>o.value)).size!==1)continue;
  const totals=primary.filter(o=>o.field==='totalEquity'&&compatible(o));
  if(new Set(totals.map(o=>o.value)).size!==1)continue;
  const parent=parents[0],value=total.value-parent.value;
  if(!(value>=0))continue;
  result.push({...total,field:'minority',definition:'minority',value,locator:'Derived: consolidated total equity - parent-attributable equity',calculation:{kind:'equity-reconciliation',formula:'Consolidated total equity - parent-attributable equity',components:[{tag:total.locator,value:total.value,sign:1},{tag:parent.locator,value:parent.value,sign:-1}],control:{reported:total.value,reconstructed:parent.value+value,residual:0,tolerance:0},note:'Same original consolidated filing, date, currency and units. Exact equality supports zero NCI; missing preferred equity or debt is not inferred.'}});
 }
 return result.filter((o,i,all)=>all.findIndex(x=>x.url===o.url&&x.period===o.period&&x.currency===o.currency&&x.unit===o.unit)===i);
}
