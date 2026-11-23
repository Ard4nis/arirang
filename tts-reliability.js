(function(){
'use strict';
const previousPlayable=playableTheory;
function voiceReady(x){
 if(!previousPlayable(x))return false;
 try{return Boolean((HANGUL_TERMS[x.name]&&voicesFor('ko'))||voicesFor('da'));}catch{return false;}
}
playableTheory=voiceReady;
const previousStart=startQuiz;
startQuiz=function(mode='standard'){
 if(mode==='listening'&&!quizSource().some(voiceReady)){
  speechStatus('Lyttequiz kræver en installeret koreansk eller dansk TTS-stemme. Vælg almindelig teoriprøve, eller installér en stemme og tryk Opdater stemmer.');
  return;
 }
 previousStart(mode);
 if(mode==='listening'&&ui.quiz)ui.quiz.heard=false;
};
try{
 window.speechSynthesis?.addEventListener('voiceschanged',()=>{
  if(page==='quiz'&&!ui.quiz)render();
 });
}catch{}
const css=document.createElement('style');
css.textContent='.tts-inline-warning{background:#fff6e7;color:#56391a;padding:10px;border-radius:9px;border:1px solid #ead6b2}';
document.head.append(css);
document.addEventListener('click',event=>{
 const b=event.target.closest('button');
 if(!b)return;
 if(b.dataset.switchTextQuiz!==undefined&&ui.quiz?.mode==='listening'){
  cancelSpeech();ui.quiz.mode='standard';ui.quiz.heard=true;render();
 }
});
window.arirangTTSReady=()=>quizSource().some(voiceReady);
})();
