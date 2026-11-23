'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const index=source('index.html');
const main=(index.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
const libraries=['video-catalog.js','voice-picker.js','tts-reliability.js','data-guard.js','progress-tools.js','training-tools.js','daily-training.js','readiness.js','combination-links.js'];
function startApp(voiceList=[
 {name:'Dansk',voiceURI:'da1',lang:'da-DK',default:true},
 {name:'Korean',voiceURI:'ko1',lang:'ko-KR',default:false}
]){
 const elements=new Map(),handlers={};
 const doc={
  head:{append(){},appendChild(){}},hidden:false,
  createElement(tag){return {tagName:tag,innerHTML:'',style:{},textContent:'',append(){},addEventListener(){}};},
  getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',classList:{toggle(){}},addEventListener(){}});return elements.get(id);},
  querySelectorAll(){return []},querySelector(){return null},
  addEventListener(name,cb,capture=false){(handlers[name]||(handlers[name]=[])).push({cb,capture});}
 };
 const speech={getVoices:()=>voiceList,addEventListener(){},cancel(){},resume(){},speaking:false,pending:false,paused:false,speak(){}};
 const win={speechSynthesis:speech,SpeechSynthesisUtterance:function(text){this.text=text;},scrollTo(){}};
 const storage=new Map();
 const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>{storage.set(key,value);}};
 let alerts=[];
 const fn=new Function('window','document','localStorage','SpeechSynthesisUtterance','confirm','alert','setTimeout','clearTimeout','Blob','URL',
  main+'\n'+libraries.map(source).join('\n')+
  '\nreturn {navigate,render,me,selectedItems,progressStats,quizPage,voiceCount:()=>availableSpeechVoices().length,stats:window.arirangVideoStats,profiles:()=>db.profiles};');
 const app=fn(win,doc,localStorage,win.SpeechSynthesisUtterance,()=>true,msg=>alerts.push(msg),setTimeout,clearTimeout,function(){},{});
 const click=async dataset=>{
  const e={target:{closest:()=>({dataset})}};
  for(const {cb} of handlers.click||[])await cb(e);
 };
 const change=async(dataset,value,attributes={})=>{
  const e={target:{dataset,value,...attributes,matches(sel){if(sel==='[data-import]')return dataset.import!==undefined;if(sel==='[data-practice-progress]')return dataset.practiceProgress!==undefined;return false;}},stopImmediatePropagation(){this.stopped=true;}};
  const list=handlers.change||[];
  for(const {cb,capture} of [...list].sort((a,b)=>Number(b.capture)-Number(a.capture))){
   await cb(e);if(e.stopped)break;
  }
 };
 return {...app,click,change,html:()=>doc.getElementById('app').innerHTML,alerts,storage};
}
test('All project scripts parse and the app loads',()=>{
 assert.match(index,/<html lang="da">/);
 for(const f of libraries)assert.ok(index.includes('./'+f),f+' not linked');
 for(const f of libraries)assert.doesNotThrow(()=>new Function(source(f)),f);
 assert.doesNotThrow(()=>new Function(main));
 const app=startApp();
 for(const page of ['home','daily','practice','library','combinations','generator','quiz','videos','readiness','profiles']){
  app.navigate(page);assert.ok(app.html().length>100,'empty view: '+page);
 }
});
test('Syllabus and additional video matches have correct provenance',()=>{
 const app=startApp();
 assert.ok(app.stats.attached>=85,'insufficient attached videos');
 assert.ok(app.stats.specific>=6);
 app.navigate('videos');
 assert.match(app.html(),/Kukkiwon/);
 assert.match(app.html(),/referencesamling/);
 const prohibited=['mnBjR5vhU0Y','QDK45OHohX8','GNKwWtOvcXo','TjCNNQCFpew','pq47HhRn1ro'];
 for(const id of prohibited)assert.ok(!source('video-catalog.js').includes(id));
});
test('Firefox with no installed voice cannot start listening quiz',async()=>{
 const app=startApp([]);
 app.navigate('quiz');
 assert.match(app.html(),/data-start-quiz="listening" disabled/);
 await app.click({startQuiz:'listening'});
 assert.doesNotMatch(app.html(),/🎧 Lyttequiz ·/);
});
test('One-step and three-step proposals work for every kup and the grade-only filter',async()=>{
 const app=startApp();app.navigate('generator');
 for(const kup of [9,8,7,6,5,4,3,2,1]){
  app.me().kup=kup;
  for(const scope of ['grade','upto']){
   await app.change({toolScope:scope},scope);
   for(const kind of ['oneStep','threeStep']){
    await app.change({toolGenKind:kind},kind);
    await app.change({toolFull:''},null,{checked:true});
    await app.click({toolGenerate:''});
    const requirement=JSON.parse(index.split('const SYLLABUS=')[1].split(";\n'use strict'")[0])[kup].items.find(x=>x.type===kind);
    const count=(app.html().match(/class="tool-result"/g)||[]).length;
    assert.equal(count,requirement?.count||0,scope+' '+kup+' '+kind);
   }
  }
 }
});
test('6. kup includes required kick and takedown categories',async()=>{
 const app=startApp();app.me().kup=6;app.navigate('generator');
 for(const [kind,total,kicks,takedowns] of [['oneStep',10,5,3],['threeStep',8,4,2]]){
  await app.change({toolGenKind:kind},kind);
  await app.change({toolFull:''},null,{checked:true});
  await app.click({toolGenerate:''});
  const content=app.html();
  assert.equal((content.match(/class="tool-result"/g)||[]).length,total);
  assert.equal((content.match(/<span class="tag grey">Spark<\/span>/g)||[]).length,kicks);
  assert.equal((content.match(/<span class="tag grey">Nedtagning med træner<\/span>/g)||[]).length,takedowns);
  assert.match(content,/Ingen forslag er officielle gradueringskombinationer/i);
 }
});
test('Guided daily session saves completed work without marking skills mastered',async()=>{
 const app=startApp();
 const p=app.me();const before=JSON.stringify(p.mastery);
 app.navigate('daily');
 await app.click({dailyStart:'15'});
 assert.ok(p.dailyActive?.plan?.length>0);
 let limit=10;
 while(!app.html().includes('data-daily-finish')&&limit-->0){await app.click({dailyDone:''});}
 assert.match(app.html(),/data-daily-finish/);
 await app.click({dailyFinish:''});
 assert.equal(p.dailyHistory.length,1);
 assert.deepEqual(p.mastery,JSON.parse(before));
});
test('Progress distinguishes practice and confidence',async()=>{
 const app=startApp();app.navigate('training');
 const key='k6-oneStep-0:0';
 await app.change({practiceProgress:key},'confident');
 assert.equal(app.me().practiceProgress[key],'confident');
 assert.equal(app.me().checks[key],true);
});
test('Malformed import rejects invalid kup without changing existing profile',async()=>{
 const app=startApp();
 const original=app.me().id;
 const bogus={profiles:[{id:'imported',name:'Invalid',kup:88}],active:'imported'};
 await app.change({import:''},null,{files:[{size:300,text:async()=>JSON.stringify(bogus)}]});
 assert.equal(app.me().id,original);
 assert.match(app.alerts.at(-1),/afvist/i);
});


test('A named sparring combination links to a graduation slot and keeps its status when moved',async()=>{
 const app=startApp();
 const p=app.me();
 p.savedCombinations=[
  {id:'one-a',name:'Mit et-skridtsforsvar',kind:'one',ids:['k6-stances-0','k6-hands-0'],reviewed:false},
  {id:'one-b',name:'Mit andet forsvar',kind:'one',ids:['k6-stances-0','k6-hands-1'],reviewed:false},
  {id:'three-a',name:'Mit tre-skridtsforsvar',kind:'three',ids:['k6-stances-0','k6-hands-0'],reviewed:false}
 ];
 const slot='k6-oneStep-0:0',next='k6-oneStep-0:1';
 p.practiceProgress={[slot]:'confident'};
 p.checks[slot]=true;
 app.navigate('readiness');
 assert.match(app.html(),/data-link-combo="k6-oneStep-0:0"/);
 assert.match(app.html(),/Kan selv: <b>1\/10<\/b>/);
 await app.change({linkCombo:slot},'one-a');
 assert.equal(p.combinationAssignments[slot],'one-a');
 assert.equal(p.practiceProgress[slot],'confident','old unnamed progress must remain intact');
 assert.match(app.html(),/Kan selv: <b>0\/10<\/b>/,'old generic mark must not be assigned to the named combo');
 await app.change({linkedProgress:slot},'practised');
 assert.equal(p.combinationProgress['one-a'],'practised');
 app.navigate('combinations');
 assert.match(app.html(),/Mit et-skridtsforsvar/);
 assert.match(app.html(),/6\. kup · et-skridtskamp 1/);
 assert.match(app.html(),/data-combo-global-progress="one-a"/);
 await app.change({comboGlobalProgress:'one-a'},'confident');
 assert.equal(p.combinationProgress['one-a'],'confident');
 app.navigate('readiness');
 assert.match(app.html(),/Kan selv: <b>1\/10<\/b>/);
 await app.change({linkCombo:next},'one-a');
 assert.equal(p.combinationAssignments[next],undefined,'a combo may not occupy two slots of the same requirement');
 await app.change({linkCombo:slot},'');
 await app.change({linkCombo:next},'one-a');
 assert.equal(p.combinationAssignments[next],'one-a');
 assert.equal(p.combinationProgress['one-a'],'confident','status follows the named combo');
 assert.match(app.html(),/Kan selv: <b>2\/10<\/b>/,'old unnamed status is restored after unlinking');
 await app.change({linkCombo:'k6-threeStep-0:0'},'one-a');
 assert.equal(p.combinationAssignments['k6-threeStep-0:0'],undefined,'one- and three-step kinds are distinct');
 app.navigate('combinations');
 await app.click({toolReview:'one-a'});
 assert.equal(p.combinationProgress['one-a'],'reviewed');
 assert.equal(p.savedCombinations.find(c=>c.id==='one-a').reviewed,true);
 await app.click({toolDelete:'one-a'});
 assert.equal(p.combinationAssignments[next],undefined);
 assert.equal(p.combinationProgress['one-a'],undefined);
 assert.ok(!p.savedCombinations.some(c=>c.id==='one-a'));
});

test('Import preserves valid combination links while filtering duplicate and mismatched assignments',async()=>{
 const app=startApp();
 const raw={
   active:'p-imported',
   profiles:[{
    id:'p-imported',name:'Importeret elev',kup:6,
    savedCombinations:[
     {id:'one-a',name:'Et-skridtskombination',kind:'one',ids:['k6-hands-0'],reviewed:false},
     {id:'three-a',name:'Tre-skridtskombination',kind:'three',ids:['k6-hands-0'],reviewed:false}
    ],
    combinationAssignments:{
      'k6-oneStep-0:0':'one-a',
      'k6-oneStep-0:1':'one-a',
      'k6-oneStep-0:2':'three-a',
      'k6-threeStep-0:0':'three-a',
      'k6-oneStep-0:99':'one-a'
    },
    combinationProgress:{'one-a':'confident','three-a':'reviewed','missing':'reviewed'}
   }]
 };
 await app.change({import:''},null,{files:[{size:1200,text:async()=>JSON.stringify(raw)}]});
 const p=app.me();
 assert.equal(p.id,'p-imported');
 assert.equal(p.combinationAssignments['k6-oneStep-0:0'],'one-a');
 assert.equal(p.combinationAssignments['k6-oneStep-0:1'],undefined);
 assert.equal(p.combinationAssignments['k6-oneStep-0:2'],undefined);
 assert.equal(p.combinationAssignments['k6-threeStep-0:0'],'three-a');
 assert.equal(p.combinationAssignments['k6-oneStep-0:99'],undefined);
 assert.equal(p.combinationProgress['one-a'],'confident');
 assert.equal(p.combinationProgress['three-a'],'reviewed');
 assert.equal(p.combinationProgress.missing,undefined);
 assert.equal(p.savedCombinations.find(c=>c.id==='three-a').reviewed,true);
 app.navigate('readiness');
 assert.match(app.html(),/Navngivne kombinationer: 1\/10/);
});
