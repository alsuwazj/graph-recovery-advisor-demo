export async function loadResponseService(){
 const r=await fetch('response-service.json',{cache:'no-store'});if(!r.ok)return null;
 const config=await r.json();if(config.enabled!==true)return null;
 const url=new URL(config.url);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Invalid response service configuration');return url.origin;
}
export async function allocateResponse(service,version){
 const r=await fetch(service+'/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({version,consent:true}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('Could not connect to the response service');const record=await r.json();
 if(!/^[a-f0-9-]{36}$/.test(record.id)||!Number.isInteger(record.seed)||!record.token)throw Error('Invalid response allocation');return record;
}
export async function sendResponse(service,snapshot){
 const token=snapshot.token;delete snapshot.token;
 const r=await fetch(service+'/api/session/'+snapshot.id,{method:'PUT',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(snapshot),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Response upload failed');
}
