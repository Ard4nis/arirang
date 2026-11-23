(function(){
'use strict';
const names={forms:'Poomse og hyung',stances:'Stande',hands:'Håndteknikker',kicks:'Spark',theory:'Teori',oneStep:'Et-skridtskamp',threeStep:'Tre-skridtskamp',selfDefence:'Selvforsvar',sparring:'Kamp'};
function countPractice(item){
 const p=me(),n=item.count||1;
 let practised=0,confident=0,trainer=0;
 for(let i=0;i<n;i++){
  const key=item.id+':'+i;
  const status=(item.type==='oneStep'||item.type==='threeStep')&&window.arirangCombinationLinks?window.arirangCombinationLinks.status(item,i):(p.practiceProgress?.[key]||(p.checks?.[key]?'practised':'todo'));
  if(status!=='todo')practised++;
  if(status==='confident'||status==='reviewed')confident++;
  if(status==='reviewed')trainer++;
 }
 return {practised,confident,trainer,total:n};
}
function readinessStats(){
 const p=me(),items=SYLLABUS[p.kup]?.items||[];
 const sections=[];
 for(const type of ['forms','stances','hands','kicks','theory']){
  const subset=items.filter(x=>x.type===type);
  if(!subset.length)continue;
  const completed=subset.filter(x=>type==='theory'?Boolean(p.known[x.id]):p.mastery[x.id]===2).length;
  sections.push({type,label:names[type],completed,total:subset.length,kind:'tech'});
 }
 const practical=[];
 for(const type of ['oneStep','threeStep','selfDefence','sparring']){
  for(const item of items.filter(x=>x.type===type)){
   practical.push({type,label:names[type],description:item.desc,items:[item],stats:countPractice(item),kind:'practice'});
  }
 }
 return {sections,practical};
}
function readinessPage(){
 const grade=me().kup,stats=readinessStats();
 const card=s=>{
  const pct=Math.round(100*s.completed/s.total);
  return '<div class="readiness-item"><div class="rowbetween"><strong>'+s.label+'</strong><span>'+s.completed+' / '+s.total+'</span></div><div class="progress"><span style="width:'+pct+'%"></span></div></div>';
 };
 const practical=p=>'<div class="readiness-item"><strong>'+p.label+'</strong><p class="small muted">'+cleanText(p.description)+'</p><div class="readiness-counts"><span>Øvet: <b>'+p.stats.practised+'/'+p.stats.total+'</b></span><span>Kan selv: <b>'+p.stats.confident+'/'+p.stats.total+'</b></span><span>Gennemgået med træner: <b>'+p.stats.trainer+'/'+p.stats.total+'</b></span></div>'+((p.type==='oneStep'||p.type==='threeStep')&&window.arirangCombinationLinks?'<p class="linked-overview-note">Navngivne kombinationer: '+window.arirangCombinationLinks.countAssigned(p.items[0])+'/'+p.stats.total+'</p>'+window.arirangCombinationLinks.renderPractice(p.items[0]):'')+'</div>';
 const total=stats.sections.reduce((a,x)=>a+x.total,0),done=stats.sections.reduce((a,x)=>a+x.completed,0);
 return '<section class="section-head"><h2>🎯 Min gradueringsoversigt</h2><p class="lead">Status på pensummet for '+gradeLabel(grade)+', baseret på dine egne markeringer.</p></section>'+
 '<div class="panel"><h3>Teknikker, former og teori</h3><div class="metric">'+done+' / '+total+'</div><p class="muted">Punkter markeret som behersket eller lært</p>'+stats.sections.map(card).join('')+'</div>'+
 '<div class="panel"><h3>Praktiske krav</h3>'+(stats.practical.length?stats.practical.map(practical).join(''):'<p>Ingen særskilte praktiske krav registreret for denne kup.</p>')+
 '<div class="actionrow"><button class="btn" data-page="training">Opdatér min fremgang</button><button class="btn secondary" data-page="daily">Dagens træning</button></div></div>'+
 '<div class="note soft">Dette er en personlig tjekliste, ikke en gradueringstest. At sætte et flueben er ikke det samme som instruktørens godkendelse. Kravene fra klubbens pensum og trænerens vurdering har altid forrang.</div>';
}
window.arirangPracticePages.readiness=readinessPage;
const oldHub=window.arirangPracticePages.practice;
window.arirangPracticePages.practice=function(){
 return '<div class="panel readiness-cta"><div><h3>🎯 Gradueringsoversigt</h3><p class="muted">Se hvor langt du er med teknikker, teori, former og praktiske krav til næste kup.</p></div><button class="btn" data-page="readiness">Se min status →</button></div>'+oldHub();
};
const css=document.createElement('style');
css.textContent='.readiness-cta{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px}.readiness-item{padding:12px 0;border-bottom:1px solid #e1e8f1}.readiness-item:last-of-type{border-bottom:0}.readiness-item .progress{margin:8px 0}.readiness-counts{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}.readiness-counts span{padding:6px 8px;background:#f0f5fb;border-radius:8px;font-size:13px}';
document.head.append(css);
})();
