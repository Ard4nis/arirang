(function(){
'use strict';
// Videoidentiteter er hentet fra navngivne offentlige undervisningslister:
// https://www.tigerstkd.org/p/vid.html (Kukkiwon Textbook - basic motion chapters)
// https://trudelfamilytkd.blogspot.com/2023/05/ (Kukkiwon technique link list)
// Vi betegner ikke genudgivne/eksternt listede videoer som officielt uploadet.
const collections={
 stances:{id:'Q0YVXFVnU8Y',title:'Seogi · grundlæggende stande',source:'Kukkiwon-lærebog · samlet video',match:'collection'},
 blocks:{id:'eqVRbE_Zfv0',title:'Makki · blokeringer',source:'Kukkiwon-lærebog · samlet video',match:'collection'},
 punches:{id:'aQRgKBQ2_e8',title:'Jireugi · slag fra hoften',source:'Kukkiwon-lærebog · samlet video',match:'collection'},
 strikes:{id:'5jgGW-C4i_o',title:'Chigi · andre håndslag',source:'Kukkiwon-lærebog · samlet video',match:'collection'},
 kicks:{id:'9_BJ18wiSY0',title:'Chagi · spark',source:'Kukkiwon-lærebog · samlet video',match:'collection'},
 other:{id:'sNDJHpdmfrg',title:'Øvrige grundteknikker',source:'Kukkiwon-lærebog · samlet video',match:'collection'}
};
const precise={
 'arae makki':{id:'AbC5OcJPpDI',title:'Arae makki · lav blokering'},
 'eolgeul makki':{id:'Teezxvqt2r0',title:'Eolgul makki · høj blokering'},
 'naeryo chagi':{id:'4PpbrVAxX2A',title:'Naeryo chagi · nedadgående spark'},
 'ap chagi':{id:'hnmAAO6lzEw',title:'Ap chagi · frontspark'},
 'yeop chagi':{id:'hYh3I2nWhXQ',title:'Yeop chagi · sidespark'},
 'momtong jireugi':{id:'mRjcPML_V0g',title:'Momtong jireugi · midtersektion slag'}
};
function category(i){
 if(i.type==='stances')return 'stances';
 if(i.type==='kicks')return 'kicks';
 if(i.type!=='hands')return null;
 if(/makki|makgi/i.test(i.name)||/blokering/i.test(i.desc||''))return 'blocks';
 if(/jireugi/i.test(i.name))return 'punches';
 if(/chigi/i.test(i.name))return 'strikes';
 return 'other';
}
let added=0,specific=0;
for(const item of ALL){
 if(!['stances','hands','kicks'].includes(item.type)||item.video)continue;
 const key=item.name.toLocaleLowerCase('da-DK').trim();
 const single=precise[key];
 const ref=single?{
  ...single,source:'Kukkiwon-materiale · ekstern videoliste',match:'specific',
  note:'Videoen er linket under dette tekniknavn af en taekwondoklub; Arirangs udførelse skal stadig kontrolleres med instruktøren.'
 }:collections[category(item)];
 if(!ref)continue;
 const v=single?ref:{...ref,note:'En samlevideo med flere teknikker i denne kategori, ikke en isoleret eller tidsmarkeret demonstration af netop denne teknik. Find den relevante passage i videoen.'};
 item.video=v;
 if(IDX[item.id])IDX[item.id].video=v;
 if(SYLLABUS[item.kup]?.items){const original=SYLLABUS[item.kup].items.find(x=>x.id===item.id);if(original&&!original.video)original.video=v;}
 added++;if(single)specific++;
}
const oldBadge=videoBadge;
videoBadge=function(v){
 if(v?.match==='collection')return pill('Kukkiwon · referencesamling','grey');
 if(v?.match==='specific')return pill('Navngiven teknikvideo · ekstern kilde','warn');
 return oldBadge(v);
};
const oldVideos=videosPage;
videosPage=function(){
 const pool=(ui.videoFilter==='all'?ALL:selectedItems()).filter(x=>x.video||me().videos[x.id]);
 const uniq=new Map();
 for(const item of pool){
  const v=videoSource(item);
  if(!v?.id)continue;
  const key=v.id;
  if(!uniq.has(key))uniq.set(key,{video:v,item,names:[]});
  uniq.get(key).names.push(item.name);
 }
 const entries=[...uniq.values()].sort((a,b)=>{
   const rank=x=>x.video.match==='exact'?0:x.video.match==='confirmed'?1:x.video.match==='specific'?2:x.video.match==='related'?3:x.video.match==='reference'?4:5;
   return rank(a)-rank(b)||a.item.kup-b.item.kup;
 });
 const filters='<div class="actionrow"><button class="btn small '+(ui.videoFilter==='plan'?'':'secondary')+'" data-video-filter="plan">I min træning</button><button class="btn small '+(ui.videoFilter==='all'?'':'secondary')+'" data-video-filter="all">Hele biblioteket</button></div>';
 return '<div class="section-head"><div><h2>🎬 Videobibliotek</h2><p class="lead">Navngivne teknikvideoer, Kukkiwons formsamlinger og grundteknikvideoer. Kilde og præcision er markeret ved hver video.</p></div>'+filters+'</div>'+
 (entries.length?entries.map(e=>'<div class="panel"><div class="rowbetween"><h3>'+cleanText(e.video.title||e.item.name)+'</h3>'+videoBadge(e.video)+'</div><div class="small muted">'+e.names.length+' tilknyttede teknik-/pensumpunkter: '+cleanText([...new Set(e.names)].slice(0,8).join(', '))+(e.names.length>8?' …':'')+'</div>'+videoHTML(e.item)+'</div>').join(''):'<div class="panel"><p>Ingen videoer fundet i din plan. Vælg hele biblioteket.</p></div>')+
 '<div class="note soft">En referencesamling kan indeholde mange teknikker. Videoer fra andre klubber og genudgivelser er ikke det samme som en bekræftet Arirang-demonstration. Undersøg altid bevægelsen med klubbens instruktør.</div>';
};
window.arirangVideoStats={attached:added,specific,collections:Object.values(collections).length,source:'Kukkiwon links via clubs'};
})();
