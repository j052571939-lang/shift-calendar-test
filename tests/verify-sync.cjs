const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.APP_FILE||__dirname+'/../app-v041.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const s of scripts)new vm.Script(s.replace(/^import .*;$/gm,''));
let checks=0;function test(name,f){f();checks++;console.log('PASS '+name)}
const syncScript=scripts.find(s=>s.includes('function safeThreeWayMerge'));
const core=syncScript.slice(syncScript.indexOf('function canonicalize'),syncScript.indexOf('function retryCloudCheck'));
const c=vm.createContext({TextEncoder,setTimeout:()=>0,clearTimeout:()=>{},el:()=>null});vm.runInContext(core,c);
const merge=(b,l,r)=>c.safeThreeWayMerge(JSON.stringify(b),JSON.stringify(l),JSON.stringify(r));
const base={schedule:{team:'B'},overrides:{},notes:{'2026-10-13':'原文'}};
const copy=x=>JSON.parse(JSON.stringify(x));
test('different dates merge',()=>{const l=copy(base),r=copy(base);l.notes['2026-10-14']='手機';r.notes['2026-10-15']='電腦';const m=merge(base,l,r);assert.equal(m.notes['2026-10-14'],'手機');assert.equal(m.notes['2026-10-15'],'電腦')});
test('same date conflict stops',()=>{const l=copy(base),r=copy(base);l.notes['2026-10-13']='手機';r.notes['2026-10-13']='電腦';assert.equal(merge(base,l,r),null)});
test('same date note and leave merge',()=>{const l=copy(base),r=copy(base);l.notes['2026-10-13']='新記事';r.overrides['2026-10-13']='leave';const m=merge(base,l,r);assert.equal(m.notes['2026-10-13'],'新記事');assert.equal(m.overrides['2026-10-13'],'leave')});
test('deletion and modification conflict',()=>{const l=copy(base),r=copy(base);delete l.notes['2026-10-13'];r.notes['2026-10-13']='修改';assert.equal(merge(base,l,r),null)});
test('deletion preserves other edits',()=>{const l=copy(base),r=copy(base);delete l.notes['2026-10-13'];r.notes['2026-10-15']='新增';const m=merge(base,l,r);assert.equal(m.notes['2026-10-13'],undefined);assert.equal(m.notes['2026-10-15'],'新增')});
test('conflicting schedule stops',()=>{const l=copy(base),r=copy(base);l.schedule.team='A';r.schedule.team='C';assert.equal(merge(base,l,r),null)});
test('identical simultaneous edits merge',()=>{const l=copy(base);l.notes['2026-10-13']='相同';assert.equal(merge(base,l,l).notes['2026-10-13'],'相同')});
const nodes={};function node(id){return nodes[id]??=( {value:'',textContent:'',classList:{hidden:false,contains(){return this.hidden},add(){this.hidden=true},remove(){this.hidden=false}}} )}
const ui=vm.createContext({TextEncoder,$:node,alert:()=>{},window:{dispatchEvent(){}},Event:function(){},saved:{team:'B'},selected:'2026-10-13',notes:{'2026-10-13':'舊記事'},overrides:{},persist:()=>true,render:()=>{},openDateSheet:()=>{}});
const integrated=scripts[0].includes('function commitNoteEdit');if(integrated){ui.noteEventKey=k=>'@event:'+k;ui.selectedNoteEvent=()=>null;ui.noteEventEditorValue=()=>({time:'',remind:false,lead:15});ui.noteEventEditorDirty=()=>false;ui.buildNoteEvent=()=>null;ui.checkNoteReminders=()=>{};ui.backupSnapshot=()=>JSON.stringify({schedule:ui.saved,overrides:ui.overrides,notes:ui.notes});vm.runInContext(scripts[0].slice(scripts[0].indexOf('function commitNoteEdit'),scripts[0].indexOf('function noteEventSummary')),ui)};const lines=scripts[0].split('\n');vm.runInContext(lines.find(s=>s.startsWith('function change('))+'\n'+lines.find(s=>s.startsWith('function closeDateSheet('))+'\n'+lines.find(s=>s.startsWith("$('confirmOvertime').onclick=")),ui);
for(const [label,action] of [['leave',()=>ui.change('leave')],['overtime',()=>node('confirmOvertime').onclick()],['close',()=>ui.closeDateSheet()]])test('unsaved note survives '+label,()=>{ui.notes={'2026-10-13':'舊記事'};node('sheetNote').value='尚未儲存的新記事';node('dateSheet').classList.hidden=false;node('overtimeShift').value='night';action();assert.equal(ui.notes['2026-10-13'],'尚未儲存的新記事')});
test('failed persistence rolls note and leave back',()=>{ui.notes={'2026-10-13':'原文'};ui.overrides={};ui.persist=()=>false;node('sheetNote').value='草稿';node('dateSheet').classList.hidden=false;assert.equal(ui.change('leave'),false);assert.equal(ui.notes['2026-10-13'],'原文');assert.equal(ui.overrides['2026-10-13'],undefined)});
console.log(checks+' isolated checks passed; Firebase live and iPhone UI not tested.');
