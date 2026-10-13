const fs=require('fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,serverTimestamp,runTransaction}=require('firebase/firestore');
(async()=>{
 if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Local emulator required; refuse production access');
 const env=await initializeTestEnvironment({projectId:'demo-shift-stability',firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});
 const owner=env.authenticatedContext('alice').firestore(),other=env.authenticatedContext('bob').firestore(),guest=env.unauthenticatedContext().firestore();
 const valid=()=>({data:{schedule:{team:'B'},overrides:{},notes:{'2026-10-13':'測試記事'}},schema:1,updatedAt:serverTimestamp()});
 let count=0;const test=async(name,f)=>{await f();count++;console.log('PASS '+name)};
 try{
 await test('owner create',()=>assertSucceeds(setDoc(doc(owner,'users/alice'),valid())));
 await test('owner get',()=>assertSucceeds(getDoc(doc(owner,'users/alice'))));
 await test('owner update',()=>assertSucceeds(updateDoc(doc(owner,'users/alice'),{'data.notes.2026-10-14':'新記事',updatedAt:serverTimestamp()})));
 await test('owner transaction supports app sync',()=>assertSucceeds(runTransaction(owner,async tx=>{const r=doc(owner,'users/alice');await tx.get(r);tx.set(r,valid())})));
 await test('unauthenticated read denied',()=>assertFails(getDoc(doc(guest,'users/alice'))));
 await test('unauthenticated write denied',()=>assertFails(setDoc(doc(guest,'users/alice'),valid())));
 await test('other user read denied',()=>assertFails(getDoc(doc(other,'users/alice'))));
 await test('other user write denied',()=>assertFails(setDoc(doc(other,'users/alice'),valid())));
 await test('owner list denied',()=>assertFails(getDocs(collection(owner,'users'))));
 await test('owner delete denied',()=>assertFails(deleteDoc(doc(owner,'users/alice'))));
 await test('subcollection write denied',()=>assertFails(setDoc(doc(owner,'users/alice/notes/test'),{note:'test'})));
 await test('subcollection read denied',()=>assertFails(getDoc(doc(owner,'users/alice/notes/test'))));
 await test('unknown collection denied',()=>assertFails(setDoc(doc(owner,'other/alice'),valid())));
 await test('missing field denied',()=>{const x=valid();delete x.data.notes;return assertFails(setDoc(doc(owner,'users/alice'),x))});
 await test('unexpected top-level field denied',()=>assertFails(setDoc(doc(owner,'users/alice'),{...valid(),extra:true})));
 await test('unexpected backup field denied',()=>{const x=valid();x.data.extra=true;return assertFails(setDoc(doc(owner,'users/alice'),x))});
 await test('wrong schema denied',()=>assertFails(setDoc(doc(owner,'users/alice'),{...valid(),schema:2})));
 await test('string timestamp denied',()=>assertFails(setDoc(doc(owner,'users/alice'),{...valid(),updatedAt:'2026-10-13'})));
 await test('array notes denied',()=>{const x=valid();x.data.notes=[];return assertFails(setDoc(doc(owner,'users/alice'),x))});
 await test('array overrides denied',()=>{const x=valid();x.data.overrides=[];return assertFails(setDoc(doc(owner,'users/alice'),x))});
 await test('array schedule denied',()=>{const x=valid();x.data.schedule=[];return assertFails(setDoc(doc(owner,'users/alice'),x))});
 await test('null schedule supported',()=>{const x=valid();x.data.schedule=null;return assertSucceeds(setDoc(doc(owner,'users/alice'),x))});
 console.log(count+' local Firestore rules checks passed. Rules not deployed.');
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
