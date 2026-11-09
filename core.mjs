export const ORDERS = ['ABC','ACB','BAC','BCA','CAB','CBA'];
export const LIMITS = {encoding:6000,response:30000,transition:1000,session:29*60000};
export function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function shuffle(items,rng){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function arrange(items,seed){const rng=random(seed);for(let attempt=0;attempt<5000;attempt++){const out=shuffle(items,rng);if(out.every((v,i)=>i<3||!['task','size'].some(key=>out.slice(i-3,i+1).every(x=>x[key]===v[key]))))return out;}throw Error('Cannot balance this item list.');}
export function schedule(manifest,slot,seed){if(['three-graph-preview','advisor-two-graph-preview'].includes(manifest.design))return manifest.items.map((item,index)=>({...item,block:Math.floor(index/(manifest.design==='advisor-two-graph-preview'?2:3))}));const order=ORDERS[Math.floor(slot/3)%6];const rotation=slot%3;return [...order].flatMap((method,block)=>arrange(manifest.items.filter(item=>item.list===(('ABC'.indexOf(method)+rotation)%3)),seed+block*997).map(item=>({...item,method,block})));}
export function score(selected,target,timeout=false){if(timeout)return{correct:0,f1:0};const a=new Set(selected),b=new Set(target);const hits=[...a].filter(x=>b.has(x)).length;return{correct:Number(a.size===b.size&&hits===b.size),f1:a.size+b.size?2*hits/(a.size+b.size):0};}
export function validateManifest(m){
 if(['three-graph-preview','advisor-two-graph-preview'].includes(m?.design))return validateThreeGraphs(m);
 const errors=[];if(!m||!Array.isArray(m.items)||m.items.length!==24)return ['Exactly 24 scored items are required.'];
 if(new Set(m.items.map(x=>x.id)).size!==24)errors.push('Item IDs must be unique.');
 for(let list=0;list<3;list++)for(const task of ['path','tree'])for(const size of ['small','large'])if(m.items.filter(x=>x.list===list&&x.task===task&&x.size===size).length!==2)errors.push(`List ${list}: need two ${size} ${task} items.`);
 for(const item of [...m.items,...(m.practice||[])]){
  const ids=new Set(item.initial?.map(n=>n.id));const count=ids.size;
  if(count!==(item.initial||[]).length)errors.push(`${item.id}: duplicate node IDs.`);
  if(item.size==='small'&&(count<25||count>35)||item.size==='large'&&(count<55||count>70))errors.push(`${item.id}: node count outside size band.`);
  if(!item.target?.length||item.target.some(x=>!ids.has(x)))errors.push(`${item.id}: invalid target.`);
  if(item.task==='tree'&&item.target.includes(item.attachment))errors.push(`${item.id}: target includes attachment.`);
  for(const nodes of [item.initial,item.finalA,item.finalB])if(!nodes||nodes.length!==count||new Set(nodes.map(n=>n.id)).size!==count||nodes.some(n=>!ids.has(n.id)||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<12||n.x>948||n.y<12||n.y>528))errors.push(`${item.id}: invalid coordinates.`);
  if(!Array.isArray(item.edges)||item.edges.some(([a,b])=>!ids.has(a)||!ids.has(b)))errors.push(`${item.id}: invalid edges.`);
  if(item.original){
   for(const key of ['initial','finalA','finalB']){const a=item.original[key];if(!a||!/^media\/(originals|gui)\/|^data:image\/(svg\+xml|png);base64,/.test(a.url)||a.viewBox?.length!==4||a.viewBox.some(x=>!Number.isFinite(x))||a.viewBox[2]<=0||a.viewBox[3]<=0||a.hitboxes?.length!==count||a.hitboxes.some(n=>!ids.has(n.id)||!['x','y','width','height'].every(k=>Number.isFinite(n[k]))||n.width<=0||n.height<=0))errors.push(`${item.id}: invalid original ${key} image or click areas.`);}
   if(!m.demo&&!item.original.video)errors.push(`${item.id}: matching original video required for recruitment.`);
  }else if(!item.video||!/^\/?(media\/|https:\/\/)/.test(item.video))errors.push(`${item.id}: video URL required.`);
 }
 if(m.practice?.length!==4)errors.push('Four distinct practice items are required.');
 if(new Set([...(m.practice||[]),...m.items].map(x=>x.id)).size!==28)errors.push('Practice and scored item IDs must be distinct.');
 return errors;
}

export function validateThreeGraphs(m){
 const errors=[];const advisor=m.design==='advisor-two-graph-preview';const expectedGraphs=advisor?(m.pairedStudy?['small','wien','wien033','sydney','melb']:m.exampleAspects?['small','wien','wien033']:['small','wien']):['small','sydney','melb'];const methods=advisor?['A','C']:['A','B','C'];const count=expectedGraphs.length*methods.length;
 if(m.demo!==true)errors.push('This short repeated-graph design is preview only.');
 if(m.items?.length!==count||m.practice?.length!==0)return [`The preview needs ${count} questions and no practice items.`];
 if(new Set(m.items.map(x=>x.id)).size!==count)errors.push('Question IDs must be unique.');
 if(m.targetAspect!==1)errors.push('The common target AR must be 1.0.');
 const graphIds=new Set(m.items.map(x=>x.graphId));
 if(graphIds.size!==expectedGraphs.length||!expectedGraphs.every(x=>graphIds.has(x)))errors.push('Unexpected graphs in this preview.');
 for(const graphId of graphIds){
  const group=m.items.filter(x=>x.graphId===graphId);
  if(group.length!==methods.length||new Set(group.map(x=>x.method)).size!==methods.length||!methods.every(method=>group.some(x=>x.method===method)))errors.push(`${graphId}: incorrect method coverage.`);
  const reference=group[0];
  for(const item of group){
   if(item.targetAspect!==(m.exampleAspects?.[graphId]??m.targetAspect)||item.original?.arcolTargetAspect!==item.targetAspect||item.original?.darcolTargetAspect!==item.targetAspect)errors.push(`${item.id}: target AR differs across methods.`);
   if(JSON.stringify(item.edges)!==JSON.stringify(reference.edges)||JSON.stringify(item.target)!==JSON.stringify(reference.target)||item.original?.initial?.url!==reference.original?.initial?.url||item.original?.finalB?.url!==reference.original?.finalB?.url)errors.push(`${item.id}: graph, target or shared DARCOL endpoint differs.`);
   const ids=new Set(item.initial?.map(n=>n.id));
   if(ids.size!==item.initial?.length||!item.target?.length||item.target.some(id=>!ids.has(id)))errors.push(`${item.id}: invalid target mapping.`);
   if(item.edges?.some(([a,b])=>!ids.has(a)||!ids.has(b)))errors.push(`${item.id}: invalid graph edges.`);
   for(const key of ['initial','finalA','finalB']){const a=item.original?.[key];if(!a||!/^media\/gui\/|^data:image\/(png|svg\+xml);base64,/.test(a.url)||a.renderer!=='darcol.render.canvas.GraphCanvas'||a.viewBox?.length!==4||a.viewBox.some(x=>!Number.isFinite(x))||a.viewBox[2]<=0||a.viewBox[3]<=0||a.hitboxes?.length!==ids.size||new Set(a.hitboxes.map(n=>n.id)).size!==ids.size||a.hitboxes.some(n=>!ids.has(n.id)||!['x','y','width','height'].every(k=>Number.isFinite(n[k]))||n.width<=0||n.height<=0))errors.push(`${item.id}: invalid GUI screenshot mapping.`);}
   if(!item.original?.video||!Number.isFinite(item.original.videoDurationMs))errors.push(`${item.id}: matching native recording required.`);
   if(m.animationComparison==='darcol-vs-linear-arcol'){
    if(item.presentation!==(item.method==='A'?'linear':'darcol'))errors.push(`${item.id}: incorrect animation presentation.`);
    if(!item.original.arcolVideo||item.original.arcolAnimation!=='linear-screen-space'||item.original.arcolMotion?.easing!=='none')errors.push(`${item.id}: linear ARCOL recording required.`);
    if(Math.abs(item.original.arcolVideoDurationMs-item.original.videoDurationMs)>1)errors.push(`${item.id}: animation durations must match.`);
   }
  }
 }
 return errors;
}
