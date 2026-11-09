import {shuffle,random} from './core.mjs';
export const preferenceQuestions=[
 ['pleasant','Which animation is more pleasant to watch?'],
 ['tracking','Which animation is easier to track and understand?'],
 ['effort','Which animation requires less mental effort?'],
 ['preference','Which animation do you prefer overall?']
];
export function pairedPlan(items,seed){
 const rng=random(seed);const frequencies=new Map();for(const item of items)frequencies.set(item.sourceGraph,(frequencies.get(item.sourceGraph)||0)+1);const largest=Math.max(...frequencies.values());const minimumAdjacent=Math.max(0,largest-(items.length-largest)-1);
 for(let attempt=0;attempt<20000;attempt++){
  const plan=shuffle(items,rng);
  if(plan.filter((x,i)=>i>0&&x.sourceGraph===plan[i-1].sourceGraph).length>minimumAdjacent)continue;
  if(plan.some((x,i)=>plan.some((y,j)=>i!==j&&x.graphId===y.graphId&&Math.abs(i-j)<3)))continue;
  if(plan.some((x,i)=>i>=3&&plan.slice(i-3,i+1).every(y=>y.method===x.method)))continue;
  const counts=new Map();return plan.map((x,index)=>{const viewing=(counts.get(x.graphId)||0)+1;counts.set(x.graphId,viewing);return {...x,block:0,presentationIndex:index,viewing};});
 }
 throw Error('Unable to arrange separated paired trials.');
}
export function comparisonPlan(items,seed){return shuffle(items.filter(x=>x.method==='A'),random(seed+7919)).map((x,i)=>({graphId:x.graphId,leftMethod:(i+(seed%2))%2?'A':'C'}));}
export function preferenceCsv(session){
 const cell=x=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const header=['session','transformation','left_method','right_method','pleasant','tracking_understanding','less_mental_effort','overall_preference','rating_seconds','completed_loops'];
 return [header,...(session.ratings||[]).map(r=>[session.id,r.graphId,r.leftMethod,r.rightMethod,r.pleasant,r.tracking,r.effort,r.preference,(r.durationMs/1000).toFixed(3),r.loops])].map(row=>row.map(cell).join(',')).join('\r\n');
}
export function preferenceSvg(session){
 const rows=(session.ratings||[]).filter(r=>!r.technicalInvalid);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 300" role="img" aria-label="Preference ratings normalized from ARCOL to DARCOL"><rect width="760" height="300" fill="white"/><g font-family="Arial,sans-serif" fill="#173337"><text x="24" y="28" font-size="18">Animation comparisons · one dot per example</text><text x="320" y="58" font-size="12">1 · ARCOL</text><text x="490" y="58" font-size="12">4 · Equal</text><text x="652" y="58" font-size="12">7 · DARCOL</text>${preferenceQuestions.map(([key],i)=>{const y=90+i*48;return `<text x="24" y="${y+4}" font-size="13">${['Pleasantness','Tracking / understanding','Less mental effort','Overall preference'][i]}</text><line x1="340" x2="700" y1="${y}" y2="${y}" stroke="#d0dbd5"/><line x1="520" x2="520" y1="${y-14}" y2="${y+14}" stroke="#b7c7bf"/>${rows.map((r,j)=>{const value=r.leftMethod==='A'?r[key]:8-r[key];return Number.isFinite(value)?`<circle cx="${340+(value-1)*60}" cy="${y+(j-(rows.length-1)/2)*4}" r="4" fill="#176e5d" fill-opacity=".7"/>`:'';}).join('')}`;}).join('')}<text x="24" y="288" font-size="11">Left/right assignments are normalized here; original responses and assignments remain in the exports.</text></g></svg>`;
}
