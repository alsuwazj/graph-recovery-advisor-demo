export function originalGraph(asset,target=[],interactive=false,selected=new Set(),feedback=false){
 const [x,y,w,h]=asset.viewBox;
 const image=`<image href="${asset.url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
 const overlay=asset.hitboxes.map((n,i)=>{
  const on=selected.has(n.id),highlight=target.includes(n.id);
  const rect=`<rect class="original-hitbox ${on?'selected':''} ${highlight?'target':''} ${feedback?(highlight?'answer-correct':on?'answer-wrong':''):''}" x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}"/>`;
  return interactive?`<g class="selectable" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="Node ${i+1}" data-id="${n.id}">${rect}</g>`:(highlight||(feedback&&on))?rect:'';
 }).join('');
 return `<svg viewBox="${asset.viewBox.join(' ')}" role="group" aria-label="${interactive?'Select the remembered nodes':'Original project graph'}">${image}${overlay}</svg>`;
}
export async function openAssets(){return new Promise((resolve,reject)=>{const r=indexedDB.open('graph-study-originals',1);r.onupgradeneeded=()=>r.result.createObjectStore('config');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function loadOverrides(version="legacy"){try{const db=await openAssets();return await new Promise((resolve,reject)=>{const r=db.transaction('config').objectStore('config').get('overrides:'+version);r.onsuccess=()=>{db.close();resolve(r.result||{});};r.onerror=()=>reject(r.error);});}catch{return {};}}
export async function saveOverrides(value,version="legacy"){const db=await openAssets();return new Promise((resolve,reject)=>{const tx=db.transaction('config','readwrite');tx.objectStore('config').put(value,'overrides:'+version);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
export function applyOverrides(manifest,overrides){for(const item of [...manifest.items,...manifest.practice])if(overrides[item.id])item.original={...item.original,...overrides[item.id]};return manifest;}
