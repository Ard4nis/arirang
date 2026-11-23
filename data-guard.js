(function(){
'use strict';
const SCHEMA_VERSION=2;
const MAX_FILE_BYTES=2*1024*1024;
const validVideo=/^[A-Za-z0-9_-]{11}$/;
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const safeString=(x,n=120)=>typeof x==='string'?x.trim().slice(0,n):'';
const safeIds=(ids,max=1000)=>Array.isArray(ids)?[...new Set(ids.filter(id=>typeof id==='string'&&IDX[id]))].slice(0,max):[];
function safeMap(input,test,max=1000){
 const result={};let count=0;
 for(const [key,value] of Object.entries(obj(input))){
  if(++count>max)break;
  if(test(key,value))result[key]=value;
 }
 return result;
}
function sanitizeCombination(c){
 if(!c||typeof c!=='object'||Array.isArray(c))return null;
 const ids=Array.isArray(c.ids)?c.ids.filter(id=>typeof id==='string'&&IDX[id]).slice(0,20):[];
 if(!ids.length)return null;
 const validKinds=['free','one','three'];
 const stages=Array.isArray(c.stages)?c.stages.slice(0,30).map(s=>({
  role:safeString(s?.role,80)||'Trin',
  ...(IDX[s?.id]?{id:s.id}:{}),
  ...(!IDX[s?.id]&&s?.text?{text:safeString(s.text,240)}:{})
 })).filter(s=>s.id||s.text):undefined;
 return {
  id:safeString(c.id,80)||('c'+Math.random().toString(36).slice(2)),
  name:safeString(c.name,80)||'Min kombination',
  kind:validKinds.includes(c.kind)?c.kind:'free',
  ids,reviewed:c.reviewed===true,
  ...(stages?.length?{stages}:{}),
  ...(typeof c.category==='string'&&['kick','takedown','hands'].includes(c.category)?{category:c.category}:{})
 };
}
function sanitizeProfile(p,{strict=false}={}){
 if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('En elevprofil er ikke et gyldigt objekt.');
 const kup=Number(p.kup);
 if(strict&&!KUPS.includes(kup))throw new Error('En elevprofil har en ugyldig kup-grad.');
 const grade=KUPS.includes(kup)?kup:6;
 const validStates=[0,1,2];
 const rawCombos=Array.isArray(p.savedCombinations)?p.savedCombinations.slice(0,150):[];
 const combos=rawCombos.map(sanitizeCombination).filter(Boolean);
 const draft=obj(p.combinationDraft);
 const activeRaw=obj(p.dailyActive);
 const activePlan=Array.isArray(activeRaw.plan)?activeRaw.plan.slice(0,10).filter(x=>x&&typeof x==='object').map(x=>({
  type:['theory','technique','forms','combo','repetition','intro'].includes(x.type)?x.type:'technique',
  title:safeString(x.title,100)||'Øvelse',
  description:safeString(x.description,260),
  minutes:Math.max(1,Math.min(30,Number(x.minutes)||3)),
  ids:Array.isArray(x.ids)?x.ids.filter(id=>IDX[id]).slice(0,16):[],
  ...(safeString(x.comboId,80)?{comboId:safeString(x.comboId,80)}:{})
 })):[];
 const active=activePlan.length&&/^\d{4}-\d{2}-\d{2}$/.test(activeRaw.date||'')?{
  date:activeRaw.date,
  minutes:[8,15,25].includes(activeRaw.minutes)?activeRaw.minutes:15,
  plan:activePlan,
  current:Math.max(0,Math.min(activePlan.length-1,Number(activeRaw.current)||0)),
  done:Array.isArray(activeRaw.done)?activeRaw.done.slice(0,activePlan.length).map(v=>v===true):[]
 }:null;
 const history=Array.isArray(p.dailyHistory)?p.dailyHistory.slice(-90).filter(h=>h&&typeof h==='object'&&typeof h.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(h.date)).map(h=>({
   date:h.date,minutes:Math.max(1,Math.min(60,Number(h.minutes)||15)),
   completed:h.completed===true,completedAt:safeString(h.completedAt,40),
   exercises:Math.max(0,Math.min(20,Number(h.exercises)||0))
 })):[];
 return {
  id:safeString(p.id,80)||('p'+Math.random().toString(36).slice(2)),
  name:safeString(p.name,40)||'Elev',
  kup:grade,
  mode:p.mode==='custom'?'custom':'grade',
  includeGrade:p.includeGrade!==false,
  extraIds:safeIds(p.extraIds,350),
  mastery:safeMap(p.mastery,(key,v)=>IDX[key]&&validStates.includes(v)),
  known:safeMap(p.known,(key,v)=>IDX[key]?.type==='theory'&&typeof v==='boolean'),
  checks:safeMap(p.checks,(key,v)=>{
   if(typeof v!=='boolean')return false;
   const match=key.match(/^(.+):(\d+)$/);if(!match)return false;
   const item=IDX[match[1]];return item&&Number(match[2])<(item.count||1)&&Number(match[2])>=0;
  }),
  videos:safeMap(p.videos,(key,v)=>IDX[key]&&typeof v==='string'&&validVideo.test(v),500),
  savedCombinations:combos,
  practiceProgress:safeMap(p.practiceProgress,(key,v)=>{const m=key.match(/^(.+):(\d+)$/);return m&&IDX[m[1]]&&Number(m[2])<(IDX[m[1]].count||1)&&['todo','practised','confident','reviewed'].includes(v);}),
  combinationDraft:{name:safeString(draft.name,80),kind:['free','one','three'].includes(draft.kind)?draft.kind:'free',ids:Array.isArray(draft.ids)?draft.ids.filter(id=>IDX[id]).slice(0,20):[]},
  dailyHistory:history,
  dailyActive:active
 };
}
normalizeProfile=function(p){return sanitizeProfile(p);};
try{
 if(db&&Array.isArray(db.profiles)&&db.profiles.length){
   db.profiles=db.profiles.slice(0,100).map(p=>sanitizeProfile(p)).filter(Boolean);
   if(!db.profiles.some(p=>p.id===db.active))db.active=db.profiles[0].id;
   db.schemaVersion=SCHEMA_VERSION;
   save();
 }
}catch(e){console.warn('Local profile validation:',e);}
document.addEventListener('change',async event=>{
 const input=event.target;
 if(!input.matches('[data-import]'))return;
 // Capture-phase handles imports before the legacy handler.
 event.stopImmediatePropagation();
 const file=input.files?.[0];
 if(!file)return;
 try{
   if(file.size>MAX_FILE_BYTES)throw new Error('Sikkerhedskopien er for stor (maks. 2 MB).');
   const raw=JSON.parse(await file.text());
   if(!raw||typeof raw!=='object'||!Array.isArray(raw.profiles)||!raw.profiles.length||raw.profiles.length>100)
     throw new Error('Filen indeholder ikke en gyldig samling elevprofiler.');
   const normalized=raw.profiles.map(p=>sanitizeProfile(p,{strict:true}));
   const ids=normalized.map(p=>p.id);
   if(new Set(ids).size!==ids.length)throw new Error('Sikkerhedskopien har dublerede elev-id’er.');
   if(!confirm('Importér '+normalized.length+' elevprofil(er)? Dette erstatter eksisterende lokale profiler og fremskridt.'))return;
   db={schemaVersion:SCHEMA_VERSION,profiles:normalized,active:ids.includes(raw.active)?raw.active:ids[0]};
   save();navigate('home');
 }catch(error){
   alert('Importen blev afvist: '+(error?.message||'Ugyldig fil')+' Ingen eksisterende data er overskrevet.');
 }finally{input.value='';}
},true);
window.arirangProfileSchemaVersion=SCHEMA_VERSION;
})();
