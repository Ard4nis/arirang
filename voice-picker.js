(function installVoicePicker(){
  'use strict';
  const prefKey='arirang-tts-voices-v1';
  let prefs={};
  try{prefs=JSON.parse(localStorage.getItem(prefKey)||'{}')||{};}catch{}
  const originalVoicesFor=voicesFor, originalSettings=ttsSettings;
  const key=v=>[v.voiceURI||'',v.name||'',v.lang||''].join('|');
  const list=lang=>availableSpeechVoices().filter(v=>String(v.lang||'').toLowerCase().startsWith(lang));
  voicesFor=function(lang){
    const code=String(lang).slice(0,2).toLowerCase();
    if(['ko','da'].includes(code)){
      const chosen=list(code).find(v=>key(v)===prefs[code]);
      if(chosen)return chosen;
    }
    return originalVoicesFor(lang);
  };
  const options=lang=>{
    const found=list(lang);
    return `<option value="">Automatisk stemme</option>`+found.map(v=>`<option value="${cleanText(key(v))}" ${key(v)===prefs[lang]?'selected':''}>${cleanText(v.name)} (${cleanText(v.lang)})${v.default?' – standard':''}</option>`).join('');
  };
  function block(){
    return `<fieldset class="tt-voices"><legend>🔊 Vælg oplæsningsstemme</legend><div class="tt-voices-grid">
      <label>Koreansk stemme<select data-voice-choice="ko">${options('ko')}</select></label>
      <label>Dansk stemme<select data-voice-choice="da">${options('da')}</select></label>
      </div><p class="small muted" data-voice-count>${list('ko').length} koreanske og ${list('da').length} danske stemmer fundet på enheden.</p>
      <p class="small muted">Valget gemmes i denne browser. Mangler der koreanske stemmer, bruger portalen fortsat den danske udtalehjælp.</p>
      <button class="btn small secondary" data-refresh-voices>↻ Opdater stemmer</button></fieldset>`;
  }
  ttsSettings=function(){return block()+originalSettings();};
  const css=document.createElement('style');
  css.textContent='.tt-voices{border:1px solid #d1dced;background:#f5f8ff;border-radius:12px;padding:12px;margin:12px 0}.tt-voices legend{font-weight:700}.tt-voices-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.tt-voices-grid label{display:flex;flex-direction:column;gap:7px;font-size:14px;font-weight:600}.tt-voices-grid select{background:white;border:1px solid #c4d2e4;border-radius:8px;color:#15243a;padding:10px;width:100%}';
  document.head.appendChild(css);
  function refresh(){
    document.querySelectorAll('[data-voice-choice]').forEach(el=>{el.innerHTML=options(el.dataset.voiceChoice);});
    document.querySelectorAll('[data-voice-count]').forEach(el=>{el.textContent=`${list('ko').length} koreanske og ${list('da').length} danske stemmer fundet på enheden.`;});
  }
  document.addEventListener('change',e=>{
    const el=e.target;
    if(!el.matches('[data-voice-choice]'))return;
    prefs[el.dataset.voiceChoice]=el.value;
    try{localStorage.setItem(prefKey,JSON.stringify(prefs));}catch{}
  });
  document.addEventListener('click',e=>{if(e.target.closest('[data-refresh-voices]'))refresh();});
  try{window.speechSynthesis?.addEventListener('voiceschanged',refresh);}catch{}
})();
