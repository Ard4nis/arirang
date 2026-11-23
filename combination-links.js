(function(){
'use strict';
// Named one-/three-step combinations are linked to individual graduation slots.
// Historic unnamed practice marks remain intact until the student edits them.
const levels=[['todo','Ikke startet'],['practised','Øvet'],['confident','Kan selv'],['reviewed','Gennemgået med træner']];
const validLevels=new Set(levels.map(x=>x[0]));
const safe=x=>cleanText(String(x??''));
const kindFor=item=>item.type==='oneStep'?'one':item.type==='threeStep'?'three':null;
const slotKey=(item,index)=>item.id+':'+index;
function entryFor(key){
 const match=String(key||'').match(/^(k\d+-(?:oneStep|threeStep)-\d+):(\d+)$/);
 if(!match)return null;
 const item=IDX[match[1]],index=Number(match[2]);
 return item&&kindFor(item)&&Number.isInteger(index)&&index>=0&&index<(item.count||1)?{item,index,key}:null;
}
function state(){
 const p=me();
 if(!p.combinationAssignments||typeof p.combinationAssignments!=='object')p.combinationAssignments={};
 if(!p.combinationProgress||typeof p.combinationProgress!=='object')p.combinationProgress={};
 if(!Array.isArray(p.savedCombinations))p.savedCombinations=[];
 return p;
}
function comboById(item,id){
 if(!id)return null;
 return state().savedCombinations.find(c=>c.id===id&&c.kind===kindFor(item))||null;
}
function linked(item,index){
 const id=state().combinationAssignments[slotKey(item,index)];
 return comboById(item,id);
}
function legacyStatus(item,index){
 const p=state(),key=slotKey(item,index),status=p.practiceProgress?.[key];
 return validLevels.has(status)?status:(p.checks?.[key]?'practised':'todo');
}
function status(item,index){
 const combo=linked(item,index);
 if(!combo)return legacyStatus(item,index);
 const score=state().combinationProgress[combo.id];
 return validLevels.has(score)?score:(combo.reviewed?'reviewed':'todo');
}
function countAssigned(item){
 return Array.from({length:item.count||1},(_,i)=>linked(item,i)).filter(Boolean).length;
}
function optionsFor(item,index){
 const current=linked(item,index);
 const used=new Set(Array.from({length:item.count||1},(_,i)=>i!==index?linked(item,i)?.id:null).filter(Boolean));
 return '<option value="">— Vælg gemt kombination —</option>'+
  state().savedCombinations.filter(c=>c.kind===kindFor(item)&&(!used.has(c.id)||c.id===current?.id))
    .map(c=>'<option value="'+safe(c.id)+'" '+(c.id===current?.id?'selected':'')+'>'+safe(c.name)+'</option>').join('');
}
function statusPicker(key,score,assigned){
 const attr=assigned?'data-linked-progress':'data-practice-progress';
 return '<select '+attr+'="'+safe(key)+'" aria-label="Status for kombination">'+levels.map(([id,label])=>'<option value="'+id+'" '+(id===score?'selected':'')+'>'+label+'</option>').join('')+'</select>';
}
function renderPractice(item){
 if(!kindFor(item))return '';
 const n=item.count||1,assigned=countAssigned(item);
 const confident=Array.from({length:n},(_,i)=>status(item,i)).filter(s=>s==='confident'||s==='reviewed').length;
 const active=Array.from({length:n},(_,i)=>status(item,i)).filter(s=>s!=='todo').length;
 const rows=Array.from({length:n},(_,i)=>{
  const key=slotKey(item,i),combo=linked(item,i),value=status(item,i);
  return '<div class="linked-slot"><div class="linked-slot-head"><strong>Kombination '+(i+1)+'</strong>'+
    (combo?'<span class="tag">'+safe(combo.name)+'</span>':'<span class="small muted">Endnu ikke navngivet</span>')+'</div>'+
    '<label class="linked-field">Vælg gemt '+(item.type==='oneStep'?'et-':'tre-')+'skridtskamp<select data-link-combo="'+safe(key)+'" aria-label="Kombination '+(i+1)+'">'+optionsFor(item,i)+'</select></label>'+
    '<label class="linked-field">Træningsstatus'+statusPicker(key,value,Boolean(combo))+'</label>'+
    (combo?'<button class="btn small ghost" data-open-linked-combo="'+safe(combo.id)+'">Se kombination i byggeren</button>':
    (value!=='todo'?'<p class="small muted">Den tidligere registrering er bevaret. Den bliver ikke automatisk knyttet til en ny kombination.</p>':''))+
    '</div>';
 }).join('');
 return '<details class="linked-progress"><summary>Træning og mestring: '+confident+'/'+n+' kan selv · '+active+'/'+n+' øvet · '+assigned+'/'+n+' navngivet</summary>'+
  '<div class="linked-progress-body"><p class="small muted">Knyt en navngiven kombination til hver plads. Status følger den samme kombination, selv hvis du flytter den til en anden plads. Den kan kun bruges på én plads pr. krav.</p>'+
  rows+
  '<p class="small muted">Gennemgået med træner er en registrering, eleven selv foretager — ikke en officiel digital godkendelse. Øv partnerteknikker med trænerens vejledning.</p>'+
  '<button class="btn small secondary" data-page="combinations">🧩 Åbn kombinationsbygger</button></div></details>';
}
function assign(key,id){
 const entry=entryFor(key);if(!entry)return false;
 const p=state(),combo=comboById(entry.item,id);
 if(id&&!combo)return false;
 if(combo){
  for(let n=0;n<(entry.item.count||1);n++){
   if(n!==entry.index&&linked(entry.item,n)?.id===combo.id)return false;
  }
  p.combinationAssignments[key]=combo.id;
 }else delete p.combinationAssignments[key];
 save();return true;
}
function updateLinkedProgress(key,score){
 const entry=entryFor(key);
 if(!entry||!validLevels.has(score))return false;
 const combo=linked(entry.item,entry.index);if(!combo)return false;
 const p=state();p.combinationProgress[combo.id]=score;
 combo.reviewed=score==='reviewed';
 save();return true;
}
function trainerReview(combo,reviewed){
 if(!combo)return;
 const p=state();
 if(reviewed)p.combinationProgress[combo.id]='reviewed';
 else if(p.combinationProgress[combo.id]==='reviewed')p.combinationProgress[combo.id]='confident';
 combo.reviewed=reviewed;
 save();
}
function describe(comboId){
 const p=state(),names=[];
 for(const [key,id] of Object.entries(p.combinationAssignments)){
  if(id!==comboId)continue;
  const e=entryFor(key);
  if(e&&linked(e.item,e.index)){
   const kup=Number(e.item.id.match(/^k(\d+)-/)?.[1]);
   names.push(kup+'. kup · '+(e.item.type==='oneStep'?'et-':'tre-')+'skridtskamp '+(e.index+1));
  }
 }
 return names.join(' · ');
}
function assignFirst(comboId){
 const p=state(),combo=p.savedCombinations.find(c=>c.id===comboId);
 if(!combo||!['one','three'].includes(combo.kind))return {ok:false,message:'Kun gemte et- og tre-skridtskampe kan knyttes til gradueringskrav.'};
 const item=SYLLABUS[p.kup]?.items.find(x=>x.type===(combo.kind==='one'?'oneStep':'threeStep'));
 if(!item)return {ok:false,message:'Denne kup-grad har ikke det valgte skridtkampkrav.'};
 for(let i=0;i<(item.count||1);i++)if(linked(item,i)?.id===combo.id)return {ok:true,message:'Kombinationen er allerede knyttet til kravene.'};
 for(let i=0;i<(item.count||1);i++)if(!linked(item,i)){
  assign(slotKey(item,i),combo.id);
  return {ok:true,message:'Kombinationen er nu knyttet til plads '+(i+1)+' under '+p.kup+'. kup.'};
 }
 return {ok:false,message:'Alle pladser under denne kup-grad er optaget. Frigør en plads i gradueringsoversigten først.'};
}
function onDelete(comboId){
 const p=state();
 for(const [key,id] of Object.entries(p.combinationAssignments))if(id===comboId)delete p.combinationAssignments[key];
 delete p.combinationProgress[comboId];
 save();
}
window.arirangCombinationLinks={linked,status,countAssigned,renderPractice,assign,assignFirst,describe,onDelete,trainerReview};
const style=document.createElement('style');
style.textContent='.linked-progress{margin:12px 0}.linked-progress-body{padding:12px 0}.linked-slot{padding:12px;margin:9px 0;border:1px solid #dce6f4;border-radius:11px;background:#f9fbff}.linked-slot-head{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-bottom:9px}.linked-field{display:flex;flex-direction:column;gap:5px;margin:9px 0;font-size:13px;font-weight:700}.linked-field select{border:1px solid #b9cae2;border-radius:9px;padding:10px;background:#fff;color:#192941;width:100%;max-width:500px}.linked-slot .btn{margin-top:4px}.linked-overview-note{margin:7px 0;font-size:13px;color:#52667d}';
document.head.append(style);
document.addEventListener('change',event=>{
 const d=event.target?.dataset||{};
 if(d.linkCombo!==undefined){
  const ok=assign(d.linkCombo,event.target.value);
  if(!ok)alert('Den valgte kombination kan ikke bruges her. Den skal passe til skridtkamptypen og må ikke bruges på to pladser i samme krav.');
  render();return;
 }
 if(d.linkedProgress!==undefined){
  if(updateLinkedProgress(d.linkedProgress,event.target.value))render();
 }
});
document.addEventListener('click',event=>{
 const btn=event.target?.closest?.('button');
 if(!btn||!btn.dataset.openLinkedCombo)return;
 const combo=state().savedCombinations.find(c=>c.id===btn.dataset.openLinkedCombo);
 if(!combo)return;
 state().combinationDraft={name:combo.name+' (kopi)',kind:combo.kind,ids:[...combo.ids]};
 save();navigate('combinations');
});
})();