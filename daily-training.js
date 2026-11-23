(function(){
'use strict';
const options=[8,15,25];
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const uniqueByName=xs=>[...new Map(xs.map(x=>[x.type+':'+x.name.toLowerCase(),x])).values()];
const shuffled=xs=>[...xs].sort(()=>Math.random()-.5);
function profile(){const p=me();p.dailyHistory=p.dailyHistory||[];return p;}
function prioritize(xs){
 const p=profile();
 return shuffled(xs).sort((a,b)=>(p.mastery[a.id]??0)-(p.mastery[b.id]??0));
}
function generateDaily(minutes){
 const pool=selectedItems();
 const terms=prioritize(pool.filter(x=>x.type==='theory'&&isQuizWord(x)&&!me().known[x.id]));
 const fallbackTerms=pool.filter(isQuizWord);
 const words=uniqueByName([...terms,...fallbackTerms]).slice(0,minutes<=8?3:minutes<=15?5:8);
 const techniques=prioritize(uniqueByName(pool.filter(x=>['stances','hands','kicks'].includes(x.type)))).slice(0,minutes<=8?2:minutes<=15?3:5);
 const forms=prioritize(pool.filter(x=>x.type==='forms'));
 const form=forms[0]||null;
 const reviewed=(profile().savedCombinations||[]).filter(c=>c.reviewed&&c.ids?.every(id=>IDX[id]));
 const combo=reviewed.length?shuffled(reviewed)[0]:null;
 const durations=minutes===8?[2,3,3,0]:minutes===25?[5,8,7,5]:[3,5,4,3];
 const list=[];
 if(words.length)list.push({type:'theory',minutes:durations[0],title:'🧠 Koreansk teori',ids:words.map(x=>x.id),description:'Læs ordene, vend kortene mentalt og prøv at sige betydningen uden hjælp.'});
 if(techniques.length)list.push({type:'technique',minutes:durations[1],title:'🥋 Tekniktræning',ids:techniques.map(x=>x.id),description:'Udfør hver teknik langsomt og kontrolleret. Fokusér på balance, stand og teknik.'});
 if(form)list.push({type:'forms',minutes:durations[2],title:'🎯 Poomse eller hyung',ids:[form.id],description:'Gå formen langsomt igennem. Brug videoen ved behov. Gentag de steder, som er svære.'});
 if(combo&&durations[3])list.push({type:'combo',minutes:durations[3],title:'🥊 Gennemgået kombination',comboId:combo.id,ids:combo.ids.slice(0,20),description:'Gennemgå i luften, uden partnerkontakt. Kun kombinationer tidligere markeret som gennemgået med træner er med.'});
 else if(durations[3]&&techniques.length)list.push({type:'repetition',minutes:durations[3],title:'🔁 Gentagelse og balance',ids:techniques.slice(0,2).map(x=>x.id),description:'Gentag de to første teknikker fra passet, langsomt og med ro på balancen.'});
 if(!list.length)list.push({type:'intro',minutes,title:'📚 Vælg dit pensum',ids:[],description:'Din plan mangler teknik- og teoriøvelser. Åbn pensum og vælg en kup-grad.'});
 const total=list.reduce((a,x)=>a+x.minutes,0);
 if(total<minutes)list[list.length-1].minutes+=minutes-total;
 return list;
}
function active(){
 const p=profile(),a=p.dailyActive;
 return a&&a.date===today()&&Array.isArray(a.plan)?a:null;
}
function start(minutes){
 const p=profile(),v=options.includes(minutes)?minutes:15;
 p.dailyActive={date:today(),minutes:v,plan:generateDaily(v),current:0,done:[]};
 save();render();
}
function getHistory(days=7){
 const end=new Date();end.setDate(end.getDate()-days+1);
 return profile().dailyHistory.filter(x=>x.completed&&new Date(x.date+'T12:00:00')>=end);
}
function stepBody(x){
 const p=profile();
 if(x.type==='theory'){
  return '<div class="daily-tech-grid">'+x.ids.map(id=>{const i=IDX[id];return !i?'':'<div class="daily-tech"><strong>'+cleanText(i.name)+'</strong><span class="small muted">'+cleanText(i.desc)+'</span><button class="btn small ghost" data-speak-item="'+id+'" data-speak-type="ko">🔊 Hør ordet</button></div>';}).join('')+'</div>';
 }
 if(x.type==='combo'){
  const combo=(p.savedCombinations||[]).find(c=>c.id===x.comboId);
  if(!combo)return '<p>Den valgte kombination er ikke længere tilgængelig.</p>';
  return '<h3>'+cleanText(combo.name)+'</h3>'+combo.ids.map((id,n)=>{const i=IDX[id];return i?'<div class="daily-tech"><b>'+(n+1)+'. '+cleanText(i.name)+'</b><span class="small muted">'+cleanText(i.desc)+'</span></div>':'';}).join('');
 }
 return '<div class="daily-tech-grid">'+x.ids.map(id=>{const i=IDX[id];if(!i)return '';const video=i.video?.id?'<a class="small" href="https://www.youtube.com/watch?v='+i.video.id+'" target="_blank" rel="noopener noreferrer">Se videoreference ↗</a>':'';return '<div class="daily-tech"><strong>'+cleanText(i.name)+'</strong><span class="small muted">'+cleanText(i.desc)+'</span>'+video+'</div>';}).join('')+'</div>';
}
function pageDaily(){
 const a=active(),h=getHistory(7);
 if(!a){
  return '<section class="section-head"><h2>🌟 Dagens træning</h2><p class="lead">Et kort træningspas, der fokuserer på de teknikker og teoriord, du ikke har markeret som behersket.</p></section><div class="panel">'+
    '<h3>Hvor længe vil du træne?</h3><div class="actionrow">'+options.map(n=>'<button class="btn" data-daily-start="'+n+'">'+n+' minutter</button>').join('')+'</div><p class="small muted">Du får et varieret pas fra din aktive kup-grad eller personlige plan. Du kan altid gå ud og fortsætte senere samme dag.</p></div>'+
    '<div class="panel"><h3>Seneste 7 dage</h3><p>'+h.length+' gennemførte træningspas.</p></div>';
 }
 const step=a.plan[Math.min(a.current,a.plan.length-1)], completed=a.done.filter(Boolean).length;
 if(a.plan.every((_,i)=>a.done[i]===true)){
   return '<div class="panel daily-finish"><h2>🎉 Flot træning!</h2><p>Du har gennemført alle '+a.plan.length+' dele af dagens '+a.minutes+' minutters træningspas.</p><button class="btn" data-daily-finish>Gem dagens træning</button></div>';
 }
 return '<section class="section-head"><h2>🌟 Dagens træning</h2><p class="lead">'+a.minutes+' minutter · '+completed+' af '+a.plan.length+' aktiviteter gennemført</p></section>'+
 '<div class="panel"><div class="daily-track">'+a.plan.map((x,n)=>'<button class="daily-dot '+(a.done[n]?'done':'')+' '+(n===a.current?'current':'')+'" data-daily-jump="'+n+'" title="Gå til '+cleanText(x.title)+'">'+(a.done[n]?'✓':n+1)+'</button>').join('')+'</div>'+
 '<p class="small muted">Trin '+(a.current+1)+' af '+a.plan.length+' · ca. '+step.minutes+' min.</p><h2>'+step.title+'</h2><p>'+cleanText(step.description)+'</p>'+stepBody(step)+
 '<div class="actionrow"><button class="btn secondary" data-daily-prev '+(!a.current?'disabled':'')+'>← Forrige</button><button class="btn" data-daily-done>'+ (a.done[a.current]?'Gå videre →':'✓ Færdig med denne del')+'</button></div>'+
 '<p class="small muted">Træningspasset registrerer gennemførte aktiviteter – det ændrer ikke automatisk din mestringsstatus.</p></div><button class="btn ghost small" data-daily-reset>Start et nyt pas</button>';
}
function hub(){
 const p=profile(),saved=p.savedCombinations?.length||0;
 const routes=[['library','📚 Teknikbibliotek','Find teknikker med danske forklaringer og videoreferencer.'],['combinations','🧩 Kombinationsbygger','Sammensæt og gem dine egne øvelser. '+saved+' gemte.'],['generator','🎲 Træningsgenerator','Få forslag til tekniktræning og skridtkampe.'],['builder','🗂️ Min studieplan','Vælg pensum på tværs af kup.'],['training','🥋 Pensumtræning','Marker fremgang på teknik og øvelser.'],['videos','🎬 Videoer','Se relevante demonstrationer og kilder.']];
 return '<section class="section-head"><h2>🥋 Træningsværktøjer</h2><p class="lead">Alt det, du bruger mellem taekwondotræningerne.</p></section><div class="grid two">'+routes.map(([route,title,desc])=>'<div class="panel"><h3>'+title+'</h3><p class="muted">'+desc+'</p><button class="btn secondary" data-page="'+route+'">Åbn →</button></div>').join('')+'</div>';
}
window.arirangPracticePages={...(window.arirangPracticePages||{}),daily:pageDaily,practice:hub};
const originalHome=homePage;
homePage=function(){
 return '<div class="panel daily-home-cta"><div><h2>🌟 Dagens træning</h2><p>Et overskueligt træningspas på 8, 15 eller 25 minutter — tilpasset din kup-grad.</p></div><button class="btn" data-page="daily">'+(active()?'Fortsæt træningen':'Start dagens træning')+' →</button></div>'+originalHome();
};
const css=document.createElement('style');
css.textContent='.daily-home-cta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:linear-gradient(120deg,#e8f4ff,#fff)}.daily-track{display:flex;gap:10px;justify-content:center;margin:14px 0 18px}.daily-dot{min-width:40px;height:40px;border-radius:50%;border:2px solid #bdd0e6;background:white;color:#2453b4;font-weight:800}.daily-dot.current{border-color:#2b63bd;background:#e2edff}.daily-dot.done{background:#e2f6ea;border-color:#57b681;color:#126331}.daily-tech-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:9px;margin:15px 0}.daily-tech{display:flex;flex-direction:column;gap:7px;padding:12px;border:1px solid #dae4f1;border-radius:10px;background:#fff}.daily-finish{text-align:center;padding:36px 18px}';
document.head.append(css);
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 const d=b.dataset, a=active();
 if(d.dailyStart!==undefined){start(Number(d.dailyStart));return;}
 if(d.dailyReset!==undefined){if(confirm('Starte et nyt træningspas? Det nuværende pas erstattes.'))start(a?.minutes||15);return;}
 if(d.dailyFinish!==undefined){if(a){const p=profile();p.dailyHistory.push({date:a.date,completed:true,completedAt:new Date().toISOString(),minutes:a.minutes,exercises:a.plan.length});p.dailyHistory=p.dailyHistory.slice(-90);p.dailyActive=null;save();render();}return;}
 if(!a)return;
 if(d.dailyJump!==undefined){a.current=Math.max(0,Math.min(a.plan.length-1,Number(d.dailyJump)));save();render();return;}
 if(d.dailyPrev!==undefined){a.current=Math.max(0,a.current-1);save();render();return;}
 if(d.dailyDone!==undefined){a.done[a.current]=true;if(a.current<a.plan.length-1)a.current++;save();render();return;}
});
})();
