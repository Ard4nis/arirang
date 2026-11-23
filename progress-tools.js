(function(){
'use strict';
// Practicing is not the same thing as mastering. Existing checkboxes are migrated
// visually into the new progress choices without discarding previous progress.
const statuses=[
 ['todo','Ikke startet'],
 ['practised','Øvet'],
 ['confident','Kan selv'],
 ['reviewed','Gennemgået med træner']
];
function practiceStatus(p,key){
 const raw=p.practiceProgress?.[key];
 if(['todo','practised','confident','reviewed'].includes(raw))return raw;
 return p.checks?.[key]?'practised':'todo';
}
practiceHTML=function(item){
 if((item.type==='oneStep'||item.type==='threeStep')&&window.arirangCombinationLinks)return window.arirangCombinationLinks.renderPractice(item);
 const p=me(),n=item.count||1;
 const records=Array.from({length:n},(_,i)=>{
   const key=item.id+':'+i;
   return {key,status:practiceStatus(p,key),index:i};
 });
 const active=records.filter(r=>r.status!=='todo').length;
 const confident=records.filter(r=>r.status==='confident'||r.status==='reviewed').length;
 const labels={oneStep:'Kombination',threeStep:'Kombination',selfDefence:'Frigørelse',sparring:'Træningspas'};
 const label=labels[item.type]||'Øvelse';
 return '<details class="practice-progress"><summary>Træning og mestring: '+confident+'/'+n+' kan selv · '+active+'/'+n+' øvet</summary>'+
 records.map(r=>'<label class="practice-row"><span>'+label+' '+(r.index+1)+'</span><select data-practice-progress="'+cleanText(r.key)+'" aria-label="Status for '+cleanText(label)+' '+(r.index+1)+'">'+statuses.map(([id,name])=>'<option value="'+id+'" '+(id===r.status?'selected':'')+'>'+name+'</option>').join('')+'</select></label>').join('')+
 '<p class="small muted">Øvet betyder gennemført mindst én gang. Kan selv betyder, at eleven selv oplever at kunne teknikken. Gennemgået med træner vælges kun, når det faktisk er sket. Statussen er elevens egen registrering, ikke en officiel godkendelse.</p></details>';
};
const css=document.createElement('style');
css.textContent='.practice-progress{margin-top:12px}.practice-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid #e0e7f2}.practice-row span{font-weight:650}.practice-row select{border:1px solid #c5d2e5;background:white;color:#172740;border-radius:9px;padding:8px;max-width:65%;min-width:162px}@media(max-width:370px){.practice-row{flex-wrap:wrap}.practice-row select{max-width:100%}}';
document.head.append(css);
document.addEventListener('change',event=>{
 const el=event.target;
 if(!el.matches('[data-practice-progress]'))return;
 const p=me(),key=el.dataset.practiceProgress,score=el.value;
 if(!statuses.some(s=>s[0]===score))return;
 p.practiceProgress=p.practiceProgress||{};
 p.practiceProgress[key]=score;
 p.checks[key]=score!=='todo'; // keep legacy checkbox progress compatible.
 save();
 render();
});
})();
