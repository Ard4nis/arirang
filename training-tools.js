(function(){
'use strict';
const validTypes=['stances','hands','kicks'];
const techniques=ALL.filter(x=>validTypes.includes(x.type));
const tags={all:'Alle',stances:'Stande',blocks:'Blokeringer',strikes:'Slag',kicks:'Spark'};
const state={scope:'upto',type:'all',search:'',amount:3,kind:'mixed',results:[],reviewed:true,fullSet:false,notice:''};
const H=cleanText;
const block=x=>x.type==='hands'&&(/makki|makgi/i.test(x.name)||/blokering|blokere/i.test(x.desc));
const group=x=>x.type==='hands'?(block(x)?'blocks':'strikes'):x.type;
const scopeMatch=(x,s)=>s==='all'||(s==='grade'?x.kup===me().kup:x.kup>=me().kup);
function getTech(s='upto',t='all'){
 const m=new Map;
 for(const x of techniques.filter(x=>scopeMatch(x,s)&&(t==='all'||group(x)===t))){
  const k=x.name.toLocaleLowerCase('da-DK')+'|'+x.type;
  if(!m.has(k))m.set(k,x);
 }
 return [...m.values()];
}
function settings(){const p=me();if(!p.savedCombinations)p.savedCombinations=[];if(!p.combinationDraft)p.combinationDraft={name:'',kind:'free',ids:[]};return p;}
function scopeSelect(){return '<label>Træningsniveau<select data-tool-scope>'+[['upto','Mit kup + tidligere'],['grade','Kun mit kup'],['all','Alle kup']].map(([v,n])=>'<option value="'+v+'" '+(v===state.scope?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';}
function typeSelect(){return '<label>Type<select data-tool-type>'+Object.entries(tags).map(([v,n])=>'<option value="'+v+'" '+(v===state.type?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';}
function button(txt,attr,kind='secondary'){return '<button class="btn small '+kind+'" '+attr+'>'+txt+'</button>';}
function alertBox(){return state.notice?'<p class="tool-notice" role="status">'+H(state.notice)+'</p>':'';}
function rows(items){return items.map(x=>'<div class="tool-row" data-tool-match="'+H((x.name+' '+x.desc).toLocaleLowerCase('da-DK'))+'"><div><strong>'+H(x.name)+'</strong><div class="small muted">'+H(x.desc)+' · '+x.kup+'. kup · '+H(tags[group(x)])+'</div></div>'+button('+ Tilføj','data-tool-add="'+H(x.id)+'"')+'</div>').join('');}
function choosePage(){
 const items=getTech(state.scope,state.type);
 return '<section class="section-head"><h2>📚 Teknikbibliotek</h2><p class="lead">Søg i Arirangs stande, blokeringer, slag og spark. Du kan tilføje dem direkte til en personlig kombination.</p></section><div class="panel"><div class="tool-filters">'+scopeSelect()+typeSelect()+'<label>Søg<input type="search" data-tool-search placeholder="Fx dollyo, blokkering" value="'+H(state.search)+'"></label></div><p class="small muted">'+items.length+' teknikker · identiske teknikker fra flere kup vises kun én gang.</p><div class="tool-list" id="toolList">'+rows(items)+'</div>'+button('🧩 Åbn kombinationsbygger','data-page="combinations"')+'</div>'+alertBox();
}
function steps(ids,edit){
 return ids.map((id,n)=>{const x=IDX[id];if(!x)return '';return '<div class="tool-step"><span class="tool-number">'+(n+1)+'</span><div style="flex:1"><strong>'+H(x.name)+'</strong><div class="small muted">'+H(x.desc)+'</div></div>'+(edit?button('↑','data-tool-up="'+n+'"')+button('↓','data-tool-down="'+n+'"')+button('×','data-tool-remove="'+n+'"'): '')+'</div>';}).join('');
}
function buildPage(){
 const p=settings(),d=p.combinationDraft,combos=p.savedCombinations;
 return '<section class="section-head"><h2>🧩 Kombinationsbygger</h2><p class="lead">Byg din egen teknikrækkefølge fra klubbens pensum og gem den til din elevprofil.</p></section><div class="grid two"><div class="panel"><h3>Min kombination</h3><label class="tool-field">Navn<input data-tool-title maxlength="80" placeholder="Min kombination" value="'+H(d.name)+'"></label><label class="tool-field">Type<select data-tool-kind>'+[['free','Fri tekniktræning'],['one','Et-skridtskamp (egen idé)'],['three','Tre-skridtskamp (egen idé)']].map(([v,n])=>'<option value="'+v+'" '+(d.kind===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label><h3>Teknikker ('+d.ids.length+')</h3>'+(d.ids.length?steps(d.ids,true):'<p class="muted">Tryk Tilføj ved teknikkerne i listen.</p>')+'<div class="actionrow">'+button('Gem kombination','data-tool-save','')+button('Ryd','data-tool-clear')+'</div><div class="note soft">Selvbyggede kombinationer er personlige træningsforslag, ikke officielle gradueringskombinationer. Få træneren til at gennemgå kampsekvenser og nedtagninger.</div></div><div class="panel"><h3>Vælg teknikker</h3><div class="tool-filters">'+scopeSelect()+typeSelect()+'<label>Søg<input type="search" data-tool-search value="'+H(state.search)+'" placeholder="Teknik eller betydning"></label></div><div class="tool-list" id="toolList">'+rows(getTech(state.scope,state.type))+'</div></div></div>'+alertBox()+'<div class="panel"><h3>Gemte kombinationer ('+combos.length+')</h3>'+(combos.length?combos.map(c=>'<details class="tool-saved"><summary>'+H(c.name)+' · '+c.ids.length+' teknikker '+(c.reviewed?'✓ Gennemgået med træner':'')+'</summary>'+stepInstructions(c)+'<div class="actionrow">'+button('Redigér kopi','data-tool-load="'+H(c.id)+'"')+button(c.reviewed?'Fortryd trænergennemgang':'Marker gennemgået med træner','data-tool-review="'+H(c.id)+'"')+button('Slet','data-tool-delete="'+H(c.id)+'"')+'</div></details>').join(''):'<p class="muted">Ingen gemte kombinationer endnu.</p>')+'</div>';
}
function saveCombo(ids,name,kind){
 const p=settings();if(!ids.length){state.notice='Vælg mindst én teknik.';return false;}
 p.savedCombinations.push({id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:String(name||'Min kombination').trim().slice(0,80)||'Min kombination',kind,ids:[...ids],reviewed:false});save();return true;
}
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function generate(){
 if(state.kind==='oneStep'||state.kind==='threeStep')return generateStep();
 const p=settings();
 if(state.kind==='saved'){
  const found=p.savedCombinations.filter(c=>c.ids.every(id=>IDX[id])&&(!state.reviewed||c.reviewed));
  return [...found].sort(()=>Math.random()-.5).slice(0,state.amount).map(c=>({...c}));
 }
 const pool=getTech(state.scope);
 const stands=pool.filter(x=>x.type==='stances'),blocks=pool.filter(block),strikes=pool.filter(x=>x.type==='hands'&&!block(x)),kicks=pool.filter(x=>x.type==='kicks');
 const ret=[],used=new Set;let loops=0;
 while(ret.length<state.amount&&loops++<150){
  let ids=[];
  if(state.kind==='kicks'){
   if(!kicks.length)break;
   const a=rnd(kicks),b=rnd(kicks.filter(x=>x.id!==a.id).length?kicks.filter(x=>x.id!==a.id):kicks);ids=[a.id,b.id];
  }else if(state.kind==='blocks'){
   if(!blocks.length||!strikes.length&&!kicks.length)break;
   ids=[...(stands.length?[rnd(stands).id]:[]),rnd(blocks).id,rnd([...strikes,...kicks]).id];
  }else{
   if(!stands.length||!strikes.length&&!kicks.length)break;
   ids=[rnd(stands).id,...(blocks.length&&Math.random()>.5?[rnd(blocks).id]:[]),rnd([...strikes,...kicks]).id];
  }
  const key=ids.join('-');if(used.has(key))continue;used.add(key);
  ret.push({name:'Forslag '+(ret.length+1),kind:'free',ids,reviewed:false});
 }
 return ret;
}
function generatorPage(){
 if(state.kind==='oneStep'||state.kind==='threeStep')return stepGeneratorPage();
 const kinds=stepKinds();
 return '<section class="section-head"><h2>🎲 Træningsgenerator</h2><p class="lead">Generér nye forslag ud fra teknikker fra dit kup og eventuelle tidligere grader.</p></section><div class="panel"><div class="tool-filters">'+scopeSelect()+'<label>Træningstype<select data-tool-gen-kind>'+kinds.map(([v,n])=>'<option value="'+v+'" '+(state.kind===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>Antal<select data-tool-amount>'+[1,3,5,10].map(n=>'<option value="'+n+'" '+(n===state.amount?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div>'+(state.kind==='saved'?'<label class="check"><input type="checkbox" data-tool-reviewed '+(state.reviewed?'checked':'')+'> Kun kombinationer gennemgået med træner</label>':'')+'<div class="actionrow">'+button('🎲 Lav træningsforslag','data-tool-generate','')+button('🧩 Byg selv','data-page="combinations"')+'</div><div class="note soft"><strong>Bemærk:</strong> Generatoren sammensætter øvelser til individuel tekniktræning, ikke officielle eller verificerede kampkombinationer. Teknikker med partner, greb eller nedtagninger skal øves med instruktør.</div></div>'+alertBox()+(state.results.length?'<div class="panel"><h3>Træningsforslag</h3>'+state.results.map((c,n)=>'<div class="tool-result"><strong>'+H(c.name)+'</strong>'+(c.stages?stepInstructions(c):steps(c.ids,false))+(state.kind==='saved'?'':button('Gem kombination','data-tool-save-result="'+n+'"'))+'</div>').join('')+'</div>':'');
}

function stepRequirement(){
 return SYLLABUS[me().kup].items.find(x=>x.type===(state.kind==='oneStep'?'oneStep':'threeStep'))||null;
}
function requirementCounts(item){
 const desc=item?.desc||'';
 const numberFor=word=>{
  const a=desc.match(new RegExp('(\\d+)\\s+(?:af\\s+dem\\s+|stk\\.?\\s+)?med\\s+'+word,'i'));
  return a?Number(a[1]):0;
 };
 return {total:item?.count||0,kicks:numberFor('spark'),takedowns:numberFor('nedtagning')};
}
function stepKinds(){
 return [['mixed','Blandet tekniktræning'],['blocks','Blokering + modangreb'],['kicks','Sparkekombination'],['oneStep','Et-skridtskamp'],['threeStep','Tre-skridtskamp'],['saved','Mine gemte kombinationer']];
}
function stepKindSelector(){
 return '<label>Træningstype<select data-tool-gen-kind>'+stepKinds().map(([v,n])=>'<option value="'+v+'" '+(state.kind===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';
}
function shuffleSteps(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function plannedCategories(quantity,requirements){
 const total=requirements.total||quantity;
 const kick=Math.min(quantity,Math.round(quantity*requirements.kicks/total));
 const takedown=Math.min(quantity-kick,Math.round(quantity*requirements.takedowns/total));
 return shuffleSteps([
  ...Array(kick).fill('kick'),
  ...Array(takedown).fill('takedown'),
  ...Array(quantity-kick-takedown).fill('hands')
 ]);
}
function safeStepKick(x){
 return x.type==='kicks'&&!/twi[eå]o|flyvende|jijjigki|goolleo|stampe|trampe|knæ|mooreup|doo baldang|seokeo|ieo|dreje kroppen/i.test(x.name+' '+x.desc);
}
function chooseStepItems(pool){
 const attack=pool.find(x=>x.name.toLocaleLowerCase('da-DK')==='momtong jireugi');
 const blocks=pool.filter(x=>block(x)&&/momtong|midter sektion/i.test(x.name+' '+x.desc));
 const strikes=pool.filter(x=>x.type==='hands'&&!block(x)&&/jireugi/i.test(x.name)&&!/hals|finger|knæ/i.test(x.desc));
 const kicks=pool.filter(safeStepKick);
 return {attack,blocks,strikes,kicks};
}
function generateStep(){
 const requirement=stepRequirement();
 if(!requirement)return [];
 const quantity=state.fullSet?Math.min(30,requirement.count):state.amount;
 const available=getTech(state.scope);
 const {attack,blocks,strikes,kicks}=chooseStepItems(available);
 if(!attack||!blocks.length||(!strikes.length&&!kicks.length)){
  state.notice='Mangler passende angrebs-, forsvars- eller modangrebsteknikker på det valgte niveau. Vælg "Mit kup + tidligere" og prøv igen.';
  return [];
 }
 const requirements=requirementCounts(requirement);
 const categories=plannedCategories(quantity,requirements);
 const results=[],used=new Set;
 for(let n=0;n<quantity;n++){
  const cat=categories[n],isThree=state.kind==='threeStep';
  let counter=null;
  if(cat==='kick'){counter=rnd(kicks);}
  else{counter=rnd(strikes);}
  if(!counter){counter=rnd([...strikes,...kicks]);}
  if(!counter)continue;
  const defences=isThree?Array.from({length:3},()=>rnd(blocks)):[rnd(blocks)];
  const stages=[];
  defences.forEach((defence,i)=>{
   stages.push({role:isThree?'Angreb '+(i+1)+' (skridt '+(i+1)+')':'Angreb (ét skridt)',id:attack.id});
   stages.push({role:isThree?'Forsvar '+(i+1):'Forsvar',id:defence.id});
  });
  stages.push({role:cat==='kick'?'Modangreb med spark':'Modangreb',id:counter.id});
  if(cat==='takedown')stages.push({role:'Nedtagning',text:'Vælg en nedtagning, som instruktøren har godkendt. Der genereres ikke tekniske instruktioner til nedtagninger.'});
  const ids=stages.filter(x=>x.id).map(x=>x.id);
  const key=cat+'|'+ids.join('|');
  if(used.has(key)){
    const alternative=blocks[(n+results.length)%blocks.length];
    if(alternative&&stages.length>1){
      const d=stages.find(x=>x.role.startsWith('Forsvar'));
      if(d)d.id=alternative.id;
    }
  }
  used.add(key);
  results.push({name:(isThree?'Tre-skridtskamp':'Et-skridtskamp')+' · forslag '+(n+1),kind:isThree?'three':'one',ids:stages.filter(x=>x.id).map(x=>x.id),stages,category:cat,reviewed:false});
 }
 return results;
}
function stepInstructions(combo){
 if(!combo.stages)return steps(combo.ids,false);
 return '<ol class="sparring-stages">'+combo.stages.map(x=>{
  const t=x.id?IDX[x.id]:null;
  return '<li><strong>'+H(x.role)+':</strong> '+(t?'<span>'+H(t.name)+'</span><div class="small muted">'+H(t.desc)+'</div>':'<span>'+H(x.text||'Vælges med træneren')+'</span>')+'</li>';
 }).join('')+'</ol>';
}
function stepGeneratorPage(){
 const requirement=stepRequirement();
 const cnt=requirementCounts(requirement);
 const amount=state.fullSet?cnt.total:state.amount;
 const isThree=state.kind==='threeStep';
 const exp=cnt.total?'Krav for '+me().kup+'. kup: '+cnt.total+' kombinationer, heraf '+cnt.kicks+' med spark og '+cnt.takedowns+' med nedtagning.':'Denne kup-grad har ikke et krav om '+(isThree?'tre':'et')+'-skridtskamp i det indlæste pensum.';
 return '<section class="section-head"><h2>🥊 '+(isThree?'Tre-skridtskamp':'Et-skridtskamp')+'</h2><p class="lead">Generér træningsopgaver med angreb, forsvar og modangreb, baseret på teknikker fra klubbens pensum.</p></section>'+
 '<div class="panel"><div class="tool-filters">'+scopeSelect()+stepKindSelector()+
 '<label>Antal forslag<select data-tool-amount '+(state.fullSet?'disabled':'')+'>'+[1,3,5,10].map(n=>'<option value="'+n+'" '+(n===state.amount?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div>'+
 '<p class="small muted">'+H(exp)+'</p>'+
 (requirement?'<label class="check"><input type="checkbox" data-tool-full '+(state.fullSet?'checked':'')+'> Generér et helt sæt efter kup-kravene ('+cnt.total+' forslag)</label>':'')+
 '<div class="actionrow">'+button('🎲 Generér '+amount+' forslag','data-tool-generate '+(!requirement?'disabled':''),'')+button('🧩 Byg selv','data-page="combinations"')+'</div>'+
 '<div class="note soft"><strong>Vigtigt:</strong> Disse er forslag til teknikøvelse i luften. Klubpensummet angiver antal, men ikke præcise sekvenser. Angreb og forsvar skal passe sammen efter trænerens instruktion. Træn ikke nedtagninger, låse eller partnerkontakt uden kvalificeret opsyn. Ingen forslag er officielle gradueringskombinationer.</div></div>'+
 alertBox()+(state.results.length?'<div class="panel"><h3>Træningsopgaver ('+state.results.length+')</h3>'+
 '<p class="small muted">Rækkefølgen er en øveskitse, som træneren skal kontrollere. Tjek både afstand og teknik, før den bruges med en partner.</p>'+
 state.results.map((c,n)=>'<div class="tool-result"><strong>'+H(c.name)+'</strong> '+pillStepCategory(c.category)+stepInstructions(c)+button('Gem til mine kombinationer','data-tool-save-step="'+n+'"')+'</div>').join('')+'</div>':'');
}
function pillStepCategory(category){
 return '<span class="tag grey">'+({kick:'Spark',takedown:'Nedtagning med træner',hands:'Håndteknik'}[category]||'Øvelse')+'</span>';
}

window.arirangPracticePages={library:choosePage,combinations:buildPage,generator:generatorPage};
const css=document.createElement('style');
css.textContent='.tool-filters{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0}.tool-filters label,.tool-field{display:flex;flex-direction:column;gap:5px;flex:1 1 160px;font-weight:650;font-size:14px}.tool-filters input,.tool-filters select,.tool-field input,.tool-field select{width:100%;padding:10px;border:1px solid #ced9e8;border-radius:9px;background:white;color:#15243a}.tool-field{margin:12px 0}.tool-list{max-height:620px;overflow:auto}.tool-row,.tool-step{display:flex;justify-content:space-between;align-items:center;gap:9px;border-bottom:1px solid #e1e8f1;padding:11px 2px}.tool-row[hidden]{display:none}.tool-row>div{flex:1}.tool-step .btn{margin:0}.tool-number{display:grid;place-content:center;width:27px;height:27px;background:#e2edff;border-radius:99px;color:#2453b4;font-weight:800}.tool-notice{padding:12px;background:#e3f0fd;border-radius:8px}.tool-saved,.tool-result{border:1px solid #dce4f1;border-radius:12px;padding:12px;margin:12px 0}.tool-saved summary{cursor:pointer}@media(max-width:600px){.tool-step{flex-wrap:wrap}.tool-row .btn{flex-shrink:0}}';
css.textContent+='.sparring-stages{padding-left:24px;margin:12px 0}.sparring-stages li{padding:7px 5px;border-bottom:1px solid #e3e9f0}.sparring-stages li:last-child{border-bottom:0}.sparring-stages .small{margin-top:3px}.tool-result .tag{margin-left:8px}';
document.head.append(css);
function filter(){
 document.querySelectorAll('#toolList .tool-row').forEach(el=>{el.hidden=!el.dataset.toolMatch.includes(state.search.toLocaleLowerCase('da-DK'));});
}
document.addEventListener('input',e=>{
 if(e.target.matches('[data-tool-search]')){state.search=e.target.value;filter();}
 if(e.target.matches('[data-tool-title]')){settings().combinationDraft.name=e.target.value;save();}
});
document.addEventListener('change',e=>{
 const x=e.target,d=x.dataset;
 if(d.toolScope!==undefined){state.scope=x.value;render();filter();}
 if(d.toolType!==undefined){state.type=x.value;render();filter();}
 if(d.toolKind!==undefined){settings().combinationDraft.kind=x.value;save();}
 if(d.toolGenKind!==undefined){state.kind=x.value;state.results=[];render();}
 if(d.toolFull!==undefined){state.fullSet=x.checked;state.results=[];render();}
 if(d.toolAmount!==undefined){state.amount=Math.max(1,Math.min(10,Number(x.value)));state.results=[];render();}
 if(d.toolReviewed!==undefined){state.reviewed=x.checked;state.results=[];render();}
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const d=b.dataset,p=settings(),draft=p.combinationDraft;
 if(d.toolAdd){draft.ids.push(d.toolAdd);state.notice='Teknik tilføjet. Åbn Kombinationsbyggeren for at se rækkefølgen.';save();if(page==='combinations'){render();filter();}else{const z=document.querySelector('.tool-notice');if(z)z.textContent=state.notice;}return;}
 if(d.toolRemove!==undefined){draft.ids.splice(Number(d.toolRemove),1);save();render();filter();return;}
 if(d.toolUp!==undefined||d.toolDown!==undefined){const i=Number(d.toolUp??d.toolDown),j=i+(d.toolUp!==undefined?-1:1);if(j>=0&&j<draft.ids.length){[draft.ids[i],draft.ids[j]]=[draft.ids[j],draft.ids[i]];save();render();filter();}return;}
 if(d.toolClear!==undefined){p.combinationDraft={name:'',kind:'free',ids:[]};save();render();filter();return;}
 if(d.toolSave!==undefined){if(saveCombo(draft.ids,draft.name,draft.kind)){p.combinationDraft={name:'',kind:'free',ids:[]};state.notice='Kombination gemt på din elevprofil.';save();}render();filter();return;}
 if(d.toolLoad){const c=p.savedCombinations.find(c=>c.id===d.toolLoad);if(c){p.combinationDraft={name:c.name+' (kopi)',kind:c.kind,ids:[...c.ids]};save();render();filter();}return;}
 if(d.toolReview){const c=p.savedCombinations.find(c=>c.id===d.toolReview);if(c){c.reviewed=!c.reviewed;save();render();filter();}return;}
 if(d.toolDelete){const c=p.savedCombinations.find(c=>c.id===d.toolDelete);if(c&&confirm('Slet kombinationen "'+c.name+'"?')){p.savedCombinations=p.savedCombinations.filter(c=>c.id!==d.toolDelete);save();render();filter();}return;}
 if(d.toolGenerate!==undefined){state.results=generate();state.notice=state.results.length?'':'Ingen forslag fundet. Vælg et bredere kup-interval, en anden træningstype, eller gem nogle kombinationer først.';render();return;}
 if(d.toolSaveStep!==undefined){const c=state.results[Number(d.toolSaveStep)];if(c&&saveCombo(c.ids,c.name,c.kind)){const saved=settings().savedCombinations.at(-1);saved.stages=c.stages.map(x=>({...x}));saved.category=c.category;save();state.notice='Træningsforslaget er gemt. Få instruktøren til at gennemgå det, før I øver med en partner.';render();}return;}
 if(d.toolSaveResult!==undefined){const c=state.results[Number(d.toolSaveResult)];if(c&&saveCombo(c.ids,'Træningsforslag '+new Date().toLocaleDateString('da-DK'),'free')){state.notice='Forslaget er gemt.';render();}return;}
});
})();