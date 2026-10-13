const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../app-v041.html','utf8');
const mod=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function safeAutoUpload'));
const code=mod.slice(mod.indexOf('const BASE='),mod.indexOf('onAuthStateChanged(auth,'));
const KEY='shift_assistant_app_preview_01',BASE='shift_assistant_sync_baseline_v2_test-user';
const clone=x=>JSON.parse(JSON.stringify(x)),original={schedule:{team:'B'},overrides:{},notes:{'2026-10-13':'原記事'}};
const modified=()=>{const x=clone(original);x.notes['2026-10-14']='手機新增';return x};
function harness({local=modified(),remote=original,baseline=original}={}){
 let now=0,id=0,readMode='normal',writeMode='normal',cloud=clone(remote),writes=0,reloads=0;
 const timers=new Map(),storage=new Map(),events={},messages=[];const nodes={};
 const node=n=>nodes[n]??={value:'',classList:{contains:()=>true}};
 storage.set(KEY,JSON.stringify(local));if(baseline)storage.set(BASE,JSON.stringify(baseline));
 const timer=(fn,ms)=>{const i=++id;timers.set(i,{due:now+ms,fn});return i};
 const snapshot=()=>{const data=clone(cloud);return {exists:()=>data!==null,data:()=>({data})}};
 const ctx=vm.createContext({TextEncoder,notes:{},selected:'2026-10-13',el:node,status:m=>messages.push(m),buttons:()=>{},current:{uid:'test-user'},auth:{currentUser:{uid:'test-user'}},authReady:true,busy:false,db:{},navigator:{onLine:true},localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},setTimeout:timer,clearTimeout:i=>timers.delete(i),location:{reload:()=>reloads++},window:{addEventListener:(n,f)=>events[n]=f},document:{addEventListener:()=>{},hidden:false},doc:()=>({}),serverTimestamp:()=>({mock:true}),getDocFromServer:()=>readMode==='hang'?new Promise(()=>{}):readMode==='reject'?Promise.reject(Error('network')):Promise.resolve(snapshot()),runTransaction:async(_,fn)=>{
  const mode=writeMode;let staged=null;await fn({get:async()=>snapshot(),set:(_,v)=>staged=clone(v.data)});
  if(mode==='reject')throw Error('network');
  if(mode==='hang-before')return new Promise(()=>{});
  if(mode==='late-commit')return new Promise(resolve=>timer(()=>{cloud=staged;writes++;resolve()},18000));
  cloud=staged;writes++;
  if(mode==='hang-after')return new Promise(()=>{});
 }});
 vm.runInContext(code,ctx);
 const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
 async function advance(ms){const end=now+ms;await flush();while(true){let entry=[...timers.entries()].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!entry)break;now=entry[1].due;timers.delete(entry[0]);entry[1].fn();await flush()}now=end;await flush()}
 return {ctx,messages,advance,flush,call:name=>ctx[name](),event:name=>events[name](),local:()=>JSON.parse(storage.get(KEY)),baseline:()=>JSON.parse(storage.get(BASE)||'null'),cloud:()=>clone(cloud),writeMode:m=>writeMode=m,readMode:m=>readMode=m,edit:x=>storage.set(KEY,JSON.stringify(x)),setCloud:x=>cloud=clone(x),writes:()=>writes,reloads:()=>reloads,flags:()=>vm.runInContext('({busy,conflict,pendingSync})',ctx)};
}
let count=0;async function test(name,f){await f();console.log('PASS '+name);count++}
(async()=>{
await test('read timeout retains all local data; scheduled retry recovers',async()=>{const h=harness();h.readMode('hang');const p=h.call('checkCloud');await h.advance(12000);await p;assert.deepEqual(h.local(),modified());assert.equal(h.flags().conflict,true);h.readMode('normal');await h.advance(12000);h.writeMode('normal');await h.advance(2200);assert.deepEqual(h.cloud(),modified());assert.equal(h.flags().conflict,false)});
await test('write failure before commit retries without losing notes',async()=>{const h=harness();h.writeMode('reject');await h.call('safeAutoUpload');assert.deepEqual(h.cloud(),original);assert.deepEqual(h.local(),modified());h.writeMode('normal');await h.advance(14200);assert.deepEqual(h.cloud(),modified());assert.equal(h.writes(),1)});
await test('commit succeeded but response timed out reconciles without duplicate write',async()=>{const h=harness();h.writeMode('hang-after');const p=h.call('safeAutoUpload');await h.advance(12000);await p;assert.deepEqual(h.cloud(),modified());assert.deepEqual(h.baseline(),original);h.writeMode('normal');await h.advance(12000);assert.deepEqual(h.baseline(),modified());assert.equal(h.writes(),1);assert.equal(h.flags().conflict,false)});
await test('new local edits after unacknowledged commit survive and sync',async()=>{const h=harness();h.writeMode('hang-after');const p=h.call('safeAutoUpload');await h.advance(12000);await p;const newer=modified();newer.notes['2026-10-15']='逾時後新增';h.edit(newer);h.writeMode('normal');await h.advance(12000);assert.deepEqual(h.local(),newer);assert.equal(h.reloads(),1);await h.call('checkCloud');await h.advance(2200);assert.deepEqual(h.cloud(),newer)});
await test('offline pauses upload and online event resumes safely',async()=>{const h=harness();h.ctx.navigator.onLine=false;await h.call('safeAutoUpload');assert.equal(h.writes(),0);assert.deepEqual(h.local(),modified());h.ctx.navigator.onLine=true;h.event('online');await h.flush();await h.advance(2200);assert.deepEqual(h.cloud(),modified())});
await test('another device same-note edit during outage blocks overwrite',async()=>{const h=harness();h.writeMode('reject');await h.call('safeAutoUpload');const other=clone(original);other.notes['2026-10-14']='另一裝置';h.setCloud(other);h.writeMode('normal');await h.advance(12000);assert.equal(h.flags().conflict,true);assert.deepEqual(h.local(),modified());assert.deepEqual(h.cloud(),other);assert.equal(h.writes(),0)});
await test('delayed commit after timeout is reconciled on retry',async()=>{const h=harness();h.writeMode('late-commit');const p=h.call('safeAutoUpload');await h.advance(12000);await p;assert.deepEqual(h.cloud(),original);await h.advance(6000);assert.deepEqual(h.cloud(),modified());await h.advance(6000);assert.deepEqual(h.baseline(),modified());assert.equal(h.writes(),1)});
await test('first backup committed without reply is discovered on retry',async()=>{const h=harness({remote:null,baseline:null});h.writeMode('hang-after');const p=h.call('checkCloud');await h.advance(12000);await p;h.writeMode('normal');await h.advance(12000);assert.deepEqual(h.baseline(),modified());assert.deepEqual(h.local(),modified());assert.equal(h.writes(),1)});
await test('offline while waiting for retry; online event still restores sync',async()=>{const h=harness();h.readMode('reject');await h.call('checkCloud');h.ctx.navigator.onLine=false;await h.advance(12000);assert.deepEqual(h.local(),modified());h.ctx.navigator.onLine=true;h.readMode('normal');h.event('online');await h.flush();await h.advance(2200);assert.deepEqual(h.cloud(),modified())});
console.log(`${count} timeout/recovery integration simulations passed. No Firebase network calls or user data writes.`);
})().catch(e=>{console.error(e);process.exitCode=1});
