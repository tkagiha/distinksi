"use strict";
const WORDS=window.WORDS||[],SCENES=window.SCENES||[],NEWS=window.NEWS||[],DRIVER=window.DRIVER||[],JAPAN=window.JAPAN||[],
  NUMBERS=window.NUMBERS||[],GLOSS=window.GLOSS||{},WORDAUDIO=window.WORDAUDIO||{},PERIBAHASA=window.PERIBAHASA||[],TRAVEL=window.TRAVEL||[],PACKS=window.PACKS||[];
let REGISTER=window.REGISTER||[],MONTHS=window.MONTHS||[],PREFIX=window.PREFIX||[],SUFFIX=window.SUFFIX||[],CONFIX=window.CONFIX||[],GRAMMAR=window.GRAMMAR||[],CULTURE=window.CULTURE||[],REALNEWS=window.REALNEWS||[],NEWS_UPDATED=window.NEWS_UPDATED||"",HISTORY=window.HISTORY||[],GEO=window.GEO||[],DAILY=window.DAILY||[],_extraP=null;
function _syncExtra(){REGISTER=window.REGISTER||[];MONTHS=window.MONTHS||[];PREFIX=window.PREFIX||[];SUFFIX=window.SUFFIX||[];CONFIX=window.CONFIX||[];GRAMMAR=window.GRAMMAR||[];CULTURE=window.CULTURE||[];REALNEWS=window.REALNEWS||[];NEWS_UPDATED=window.NEWS_UPDATED||"";HISTORY=window.HISTORY||[];GEO=window.GEO||[];DAILY=window.DAILY||[];}
function ensureExtra(cb){if(window.CULTURE&&window.CULTURE.length){_syncExtra();return cb();}if(!_extraP){_extraP=new Promise(function(res){var s=document.createElement("script");s.src="extra.js?v=w3";s.onload=function(){res();};s.onerror=function(){res();};document.head.appendChild(s);});}_extraP.then(function(){_syncExtra();cb();});}
let CARDS=window.CARDS||[],_cardsP=null;
function ensureCards(cb){if(window.CARDS&&window.CARDS.length){CARDS=window.CARDS;return cb();}if(!_cardsP){_cardsP=new Promise(function(res){var s=document.createElement("script");s.src="cards.js?v=w4";s.onload=function(){CARDS=window.CARDS||[];if(typeof applyPacks==="function")applyPacks();if(typeof applyJelajah==="function")applyJelajah();res();};s.onerror=function(){res();};document.head.appendChild(s);});}_cardsP.then(cb);}
const SPK=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a9 9 0 0 1 0 14"></path></svg>`;
const esc=s=>(s+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const $=id=>document.getElementById(id);
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

/* 辞書 */
const SUF=["nya","lah","kah","ku","mu","kan"];
const PRE=["memper","diper","meng","meny","mem","men","peng","peny","pem","pen","ber","ter","di","me","pe","se","ke"];
const norm=t=>t.toLowerCase().replace(/[.,!?;:"“”'()）（]/g,"").trim();
function look(n){if(GLOSS[n])return GLOSS[n];
  for(const s of SUF){const st=n.slice(0,-s.length);if(n.endsWith(s)&&st.length>=3&&GLOSS[st])return GLOSS[st];}
  /* 接頭辞つきの形（dilarang / ditutup / berhenti など）を語幹から引く */
  for(const p of PRE){if(n.length-p.length>=4&&n.indexOf(p)===0){
    const st=n.slice(p.length);
    if(GLOSS[st])return GLOSS[st];
    for(const s of ["kan","an","i"]){const st2=st.slice(0,-s.length);
      if(st.endsWith(s)&&st2.length>=4&&GLOSS[st2])return GLOSS[st2];}
  }}
  return null;}
function wrapWords(t){return t.split(/(\s+)/).map(p=>{if(/^\s*$/.test(p))return p;const nn=norm(p),m=look(nn);return nn?(m?`<span class="tok known" data-m="${esc(m)}" data-w="${esc(nn)}">${esc(p)}</span>`:`<span class="tok tapable" data-w="${esc(nn)}">${esc(p)}</span>`):`<span class="tok">${esc(p)}</span>`;}).join("");}
const spkBtn=(a,t)=>`<button class="spk" data-audio="${esc(a)}" data-text="${esc(t)}">${SPK}</button>`;

/* 音声（速度・リピート対応） */
let SPEED=LS("dks_speed",1),REPEAT=LS("dks_repeat",false);
let idVoice=null,_rateMul=1;
function idVoices(){if(!("speechSynthesis"in window))return [];
  var vs=speechSynthesis.getVoices()||[];
  return vs.filter(function(v){return v.lang&&v.lang.toLowerCase().replace("_","-").indexOf("id")===0;});}
function pickVoice(){if(!("speechSynthesis"in window))return;
  var vs=idVoices(),saved=LS("dks_voice","");
  if(saved){var f=vs.filter(function(v){return v.voiceURI===saved||v.name===saved;})[0];if(f){idVoice=f;return;}}
  var isId=function(v){return v.lang.toLowerCase().replace("_","-")==="id-id";};
  idVoice=vs.filter(function(v){return isId(v)&&v.localService===false;})[0]
       || vs.filter(isId)[0]
       || vs[0] || null;}
function ttsHasVoice(){return ("speechSynthesis"in window)&&!!idVoice;}
function speakSlow(t,b){_rateMul=0.75;play("",t,b);setTimeout(function(){_rateMul=1;},60);}
if("speechSynthesis"in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
let curAudio=null,curBtn=null;
function clearPlaying(){if(curBtn){curBtn.classList.remove("playing");curBtn=null;}}
function stopAll(){if(curAudio){try{curAudio.pause();}catch(e){}curAudio=null;}if("speechSynthesis"in window)speechSynthesis.cancel();clearPlaying();}
function synthFb(text,btn){if(!("speechSynthesis"in window)){if(curBtn===btn)clearPlaying();return;}const u=new SpeechSynthesisUtterance(text);u.lang="id-ID";if(idVoice)u.voice=idVoice;u.rate=.9*SPEED*_rateMul;u.onend=u.onerror=()=>{if(curBtn===btn)clearPlaying();};speechSynthesis.speak(u);}
function onlineTTS(text,btn){if(navigator.onLine===false){synthFb(text,btn);return;}const a=new Audio("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q="+encodeURIComponent(text));a.playbackRate=SPEED*_rateMul;curAudio=a;let fell=false;const fb=()=>{if(fell)return;fell=true;if(curAudio===a)curAudio=null;synthFb(text,btn);};a.onended=()=>{if(curAudio===a)curAudio=null;if(curBtn===btn)clearPlaying();};a.onerror=fb;a.play().catch(fb);}
function play(src,text,btn){stopAll();curBtn=btn;if(btn)btn.classList.add("playing");if(!src){onlineTTS(text,btn);return;}const a=new Audio(src);a.playbackRate=SPEED*_rateMul;curAudio=a;let done=false,fell=false;const fb=()=>{if(fell)return;fell=true;if(curAudio===a)curAudio=null;onlineTTS(text,btn);};a.onended=()=>{if(REPEAT&&!done){done=true;a.currentTime=0;a.play();return;}if(curAudio===a)curAudio=null;if(curBtn===btn)clearPlaying();};a.onerror=fb;a.play().catch(fb);}
function playList(srcs,btn){stopAll();curBtn=btn;if(btn)btn.classList.add("playing");let i=0;function nx(){if(i>=srcs.length){if(curBtn===btn)clearPlaying();return;}const a=new Audio(srcs[i]);a.playbackRate=SPEED;curAudio=a;let adv=false;const go=()=>{if(adv)return;adv=true;i++;nx();};a.onended=go;a.onerror=go;a.play().catch(go);}nx();}
const wordsToSrcs=ws=>ws.map(w=>"audio/w/"+w+".mp3");
function playSeq(words,btn){playList(wordsToSrcs(words),btn);}

/* 委譲 */
const pop=$("pop");let popTmr=null;
var _trCache={};
function translateWord(w){if(_trCache[w]!=null)return Promise.resolve(_trCache[w]);return fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=ja&dt=t&q="+encodeURIComponent(w)).then(function(r){return r.json();}).then(function(d){var t=(d&&d[0])?d[0].map(function(s){return s[0];}).join(""):"";_trCache[w]=t;return t;}).catch(function(){return"";});}
function showPop(el){const w=el.getAttribute("data-w");const m=el.getAttribute("data-m")||look(w);const r=el.getBoundingClientRect();pop.dataset.w=w;
  function place(txt){pop.innerHTML='<span class="pw">'+esc(w)+'</span>'+txt;pop.style.left=(r.left+r.width/2)+"px";pop.style.top=(r.top-8)+"px";pop.classList.add("on");clearTimeout(popTmr);popTmr=setTimeout(function(){pop.classList.remove("on");},2800);}
  play(WORDAUDIO[w]||("audio/w/"+w.replace(/\//g,"_")+".mp3"),w,null);
  if(m){place(esc(m));return;}
  place("…");
  translateWord(w).then(function(tr){if(tr)GLOSS[w]=tr;
    if(pop.dataset.w===w&&pop.classList.contains("on"))
      place(esc(tr||(navigator.onLine===false?"オフラインのため訳せません":"辞書にない語です")));});}
/* 単一の委譲クリックハンドラ（音声・辞書・カルーセル・ホーム遷移・ブックマーク・意味表示） */
document.addEventListener("click",e=>{
  const pb=e.target.closest("[data-audio]");if(pb){e.stopPropagation();play(pb.dataset.audio,pb.dataset.text||"",pb);return;}
  const pc=e.target.closest("[data-pat]");
  if(pc){e.stopPropagation();var pid=pc.dataset.pat;openTarget("learn:l-pat");
    setTimeout(function(){var t=document.querySelector('[data-patcard="'+pid+'"]');
      if(t){t.scrollIntoView({behavior:"smooth",block:"center"});t.classList.add("hi");
        setTimeout(function(){t.classList.remove("hi");},1600);}},220);
    return;}
  const bk=e.target.closest("[data-book]");if(bk){e.stopPropagation();try{toggleBook(JSON.parse(bk.getAttribute("data-book")));if($("bookOv").classList.contains("on"))renderBookmarks();}catch(_){}return;}
  const nav=e.target.closest("[data-nav]");if(nav){const[k,d]=nav.dataset.nav.split(":");if(CAR[k])CAR[k].step(+d);return;}
  const gt=e.target.closest("[data-goto]");if(gt){if(gt.dataset.qmode)_pendQ=gt.dataset.qmode;openTarget(gt.dataset.goto);return;}
  const tok=e.target.closest(".tok[data-w]");if(tok){e.stopPropagation();showPop(tok);return;}
  const rev=e.target.closest("[data-reveal]");if(rev&&(document.body.classList.contains("hidden")||document.body.classList.contains("roleplay"))){rev.classList.toggle("show");return;}
  pop.classList.remove("on");
});

/* 遅延カルーセル */
function lazyCarousel(track,count,renderFn,countEl,prevSel,nextSel,onIndex){
  let order=Array.from({length:count},(_,i)=>i);
  const slides=[];for(let i=0;i<count;i++){const d=document.createElement("div");d.className="slide";d.dataset.filled="0";track.appendChild(d);slides.push(d);}
  function fill(i){if(i<0||i>=count)return;const s=slides[i];if(s.dataset.filled==="1")return;s.innerHTML=renderFn(order[i]);s.dataset.filled="1";}
  const idx=()=>{const cw=track.clientWidth;return cw?Math.round(track.scrollLeft/cw):0;};
  const prev=document.querySelector(prevSel),next=document.querySelector(nextSel);
  function update(){const i=idx();fill(i);fill(i-1);fill(i+1);if(countEl)countEl.textContent=(i+1)+" / "+count;if(prev)prev.disabled=i<=0;if(next)next.disabled=i>=count-1;if(onIndex)onIndex(order[i],i);}
  let tmr;track.addEventListener("scroll",()=>{clearTimeout(tmr);tmr=setTimeout(update,90);});
  window.addEventListener("resize",()=>{clearTimeout(tmr);tmr=setTimeout(update,150);});
  function reflow(){slides.forEach(s=>{s.dataset.filled="0";s.innerHTML="";});track.scrollTo({left:0});fill(0);fill(1);update();}
  fill(0);fill(1);update();
  return {go:i=>track.scrollTo({left:track.clientWidth*i,behavior:"smooth"}),
    goReal:r=>{const s=order.indexOf(r);if(s>=0)track.scrollTo({left:track.clientWidth*s,behavior:"smooth"});},
    step:d=>track.scrollBy({left:track.clientWidth*d,behavior:"smooth"}),update,cur:idx,curReal:()=>order[idx()],
    shuffle:()=>{for(let k=count-1;k>0;k--){const j=Math.random()*(k+1)|0;[order[k],order[j]]=[order[j],order[k]];}reflow();},
    reset:()=>{order=Array.from({length:count},(_,i)=>i);reflow();}};
}
const CAR={};

/* ===== メインタブ ルーター ===== */
const SECTIONS=[
  {id:"learn",label:"学ぶ",icon:"i-book",tabs:[["learn","ことば"],["num","数字"]]},
  {id:"practice",label:"練習",icon:"i-target",tabs:[["practice","練習"],["speak","話す"]]},
  {id:"home",label:"ホーム",icon:"i-home",tabs:[["home","ホーム"]]},
  {id:"read",label:"読む",icon:"i-read",tabs:[["news","ニュース"],["reads","読み物"],["talk","会話"]]},
  {id:"more",label:"調べる",icon:"i-search",tabs:[["dict","辞書"],["scan","街を知る"]]}
];
const TABS=SECTIONS.flatMap(s=>s.tabs);
function sectionOf(v){return SECTIONS.find(s=>s.tabs.some(t=>t[0]===v));}
$("botNav").innerHTML=SECTIONS.map(s=>s.id==="home"
  ?`<button class="bnav bfab" data-sec="home" aria-label="ホーム"><span class="fabb"><svg class="bic"><use href="#i-home"/></svg></span><span>ホーム</span></button>`
  :`<button class="bnav" data-sec="${s.id}" aria-label="${s.label}"><svg class="bic"><use href="#${s.icon}"/></svg><span>${s.label}</span></button>`).join("");
const INIT={};
function showView(v,dir){
  document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active",el.dataset.view===v));
  const sec=sectionOf(v);
  [...$("botNav").children].forEach(b=>b.classList.toggle("on",!!sec&&b.dataset.sec===sec.id));
  const mt=$("mainTabs"),bar=mt.closest(".maintabs");
  if(sec&&sec.tabs.length>1){mt.innerHTML=sec.tabs.map(([tv,tl])=>`<button data-tab="${tv}" class="${tv===v?'active':''}">${tl}</button>`).join("");if(bar)bar.style.display="";}
  else{mt.innerHTML="";if(bar)bar.style.display="none";}
  if(!INIT[v]){INIT[v]=1;initView(v);}
  if(v==="home")ensureCards(buildStats);
  if(v==="dict")buildDict();
  if(v==="speak")ensureCards(buildSpeak);
  window.scrollTo({top:0,behavior:"instant"in window?"instant":"auto"});
  const av=document.querySelector('.view[data-view="'+v+'"]');
  if(av){av.classList.remove("enter","enter-l","enter-r");void av.offsetWidth;av.classList.add(dir==="l"?"enter-l":dir==="r"?"enter-r":"enter");}
}
$("mainTabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)showView(b.dataset.tab);});
$("botNav").addEventListener("click",e=>{const b=e.target.closest("[data-sec]");if(!b)return;const s=SECTIONS.find(x=>x.id===b.dataset.sec);if(s)showView(s.tabs[0][0]);});
(function(){var ms=$("moreSet");if(ms)ms.onclick=function(){var b=$("btnSettings");if(b)b.click();};var mb=$("moreBook");if(mb)mb.onclick=function(){var b=$("btnBook");if(b)b.click();};})();
showView("home");
document.querySelectorAll(".subtabs[data-sub]").forEach(st=>{
  st.addEventListener("click",e=>{const b=e.target.closest("[data-pane]");if(!b)return;const box=b.closest(".view");
    st.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));
    box.querySelectorAll(".pane").forEach(p=>p.classList.toggle("active",p.id===b.dataset.pane));
    initPane(b.dataset.pane);});
});

/* ===== 各ビュー初期化 ===== */
function initView(v){
  if(v==="learn"){buildWords();initPane("l-words");}
  if(v==="practice"){ensureCards(function(){buildFlash();initPane("p-flash");});}
  if(v==="talk"){buildScenes();initPane("t-scene");}
  if(v==="news"){ensureExtra(buildRealNews);}
  if(v==="num"){buildNumbers();initPane("a-list");}
  if(v==="reads"){ensureExtra(function(){buildNews();initPane("r-info");});}
  if(v==="scan"){buildScan();}
}
const PANEI={};
function initPane(id){
  if(PANEI[id])return;PANEI[id]=1;
  if(id==="l-packs")ensureCards(function(){buildIslandPacks();});
  if(id==="l-gaul")buildGaul();
  if(id==="l-pat")ensureCards(buildPat);
  if(id==="t-surv")buildSurv();
  if(id==="l-gram")ensureExtra(buildGrammar);
  if(id==="l-prefix")ensureExtra(buildPrefix);
  if(id==="l-suffix")ensureExtra(buildSuffix);
  if(id==="l-confix")ensureExtra(buildConfix);
  if(id==="l-reg")ensureExtra(buildRegister);
  if(id==="t-driver")buildDriver();
  if(id==="t-travel")buildTravel();
  if(id==="t-pack")buildPacks();
  if(id==="t-sim")buildSim();
  if(id==="t-say")buildSay();
  if(id==="p-quiz")buildQuiz();
  if(id==="p-daily")buildDaily();
  if(id==="p-fill")buildFill();
  if(id==="p-stats")ensureCards(buildStats);
  if(id==="a-time")buildTime();
  if(id==="a-date")ensureExtra(buildDate);
  if(id==="a-listen")ensureExtra(buildNumQuiz);
  if(id==="r-daily")ensureExtra(buildLife);
  if(id==="r-geo")ensureExtra(buildGeo);
  if(id==="r-hist")ensureExtra(buildHistory);
  if(id==="r-cult")ensureExtra(buildCulture);
  if(id==="r-japan")buildJapan();
}

/* 単語 */
function buildWords(){if(CAR.w)return;CAR.w=lazyCarousel($("wTrack"),WORDS.length,i=>{const d=WORDS[i],num=String(i+1).padStart(3,"0");
  return `<div class="card" data-reveal><div class="tag"><span class="num">Artikula #${num}</span></div>
   <div class="headline">${spkBtn(d.audio,d.word)}<span class="word">${esc(d.word)}</span></div><div class="fkata" style="text-align:left;margin:1px 0 2px">${idKata(d.word)}</div><div class="gloss">${esc(d.gloss)}</div><div class="taphint">タップで意味 →</div>
   <div class="reveal"><div class="meaning">${esc(d.meaning)}</div><div class="examples">${d.ex.map(e=>`<div class="ex"><div class="id">${spkBtn(e[2],e[0])}<span class="t">${wrapWords(e[0])}</span></div><div class="ja">${esc(e[1])}</div></div>`).join("")}</div>
   <div class="note"><div class="lbl">Catatan・語源メモ</div><p>${esc(d.note)}</p></div></div></div>`;
},$("wCount"),'[data-nav="w:-1"]','[data-nav="w:1"]');const wsb=$("wShuffle");if(wsb)wsb.onclick=()=>CAR.w.shuffle();}

/* ===== 未解放の共通表示 ===== */
function lockCard(opt){/* opt: {sil, title, cond, cls} — グレーのシルエット＋金の鍵＋解放条件1行 */
  return '<div class="lockbox '+(opt.cls||"")+'">'+(opt.sil||"")
   +'<svg class="icn lkkey"><use href="#i-lock"/></svg>'
   +'<div class="lkttl">'+esc(opt.title)+'</div><div class="lkmask">？？？</div>'
   +'<div class="lkcond">'+opt.cond+'</div></div>';}
/* ===== Bahasa Gaul ===== */
const GTONE={chat:["チャット限定","gt-chat"],casual:["くだけた会話","gt-casual"]};
function buildGaul(){var el=$("l-gaul");if(!el||el.dataset.done)return;el.dataset.done=1;
  var G=window.GAUL||[];
  el.innerHTML='<div class="packintro">WhatsApp や SNS で毎日飛び交う言葉です。フォーマル度に注意して使い分けてください。</div>'
   +'<div class="gaullist">'+G.map(function(g){var t=GTONE[g.tone]||GTONE.chat;
     return '<div class="gaulrow">'
      +'<div class="gtop">'+spkBtn("",g.s)+'<span class="gs">'+esc(g.s)+'</span><span class="gtone '+t[1]+'">'+t[0]+'</span></div>'
      +'<div class="gf">＝ '+esc(g.f)+'</div><div class="gja">'+esc(g.ja)+'</div>'
      +'<div class="gchat"><div class="gbub">'+spkBtn("",g.ex)+'<span class="t">'+wrapWords(g.ex)+'</span></div><div class="gexja">'+esc(g.exja)+'</div></div>'
      +'<div class="gnote">'+esc(g.note)+'</div></div>';}).join("")+'</div>';}
/* ===== サバイバルシート ===== */
function buildSurv(){var el=$("t-surv");if(!el||el.dataset.done)return;el.dataset.done=1;
  var S=window.SURVIVAL||[];
  el.innerHTML='<div class="packintro">現地で焦ったときに、上から順に読めるようにしています。文はすべて音声で再生できます（オフラインでも動作）。</div>'
   +S.map(function(s){return '<div class="survsec"><div class="survhead"><svg class="icn"><use href="#'+s.icon+'"/></svg><div><b>'+esc(s.title)+'</b><span>'+esc(s.sub)+'</span></div></div>'
    +s.items.map(function(it){return '<div class="survrow">'+spkBtn("",it.id)
      +'<div class="sbody"><div class="id"><span class="t">'+wrapWords(it.id)+'</span></div><div class="ja">'+esc(it.ja)+'</div>'
      +(it.note?'<div class="snote">'+esc(it.note)+'</div>':'')+'</div>'
      +'<button class="sbook" data-book=\'{"id":'+JSON.stringify(it.id)+',"ja":'+JSON.stringify(it.ja)+',"audio":""}\' aria-label="この表現を覚えたリストに保存">★</button></div>';}).join("")
    +'</div>';}).join("");
  refreshBookBtns();}
/* ===== 島パック一覧 ===== */
var _packView=null;
function packThreshold(id){var dots=_archBuild(),mx=-1,ci=-1;
  for(var i=0;i<ARCH_CLUSTERS.length;i++)if(ARCH_CLUSTERS[i].id===id)ci=i;
  dots.forEach(function(d){if(d.ci===ci&&d.rank>mx)mx=d.rank;});return mx+1;}
function packSilhouette(id){var dots=_archBuild(),ci=-1;
  for(var i=0;i<ARCH_CLUSTERS.length;i++)if(ARCH_CLUSTERS[i].id===id)ci=i;
  var ds=dots.filter(function(d){return d.ci===ci;});
  if(!ds.length)return "";
  var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  ds.forEach(function(d){x0=Math.min(x0,d.x);x1=Math.max(x1,d.x);y0=Math.min(y0,d.y);y1=Math.max(y1,d.y);});
  var pad=6,vb=(x0-pad)+" "+(y0-pad)+" "+((x1-x0)+pad*2)+" "+((y1-y0)+pad*2);
  return '<svg class="psil" viewBox="'+vb+'" aria-hidden="true">'+ds.map(function(d){
    return '<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+'" r="1.8"/>';}).join("")+'</svg>';}
function buildIslandPacks(force){var el=$("l-packs");if(!el)return;
  if(_packView){renderPackDetail(_packView);return;}
  var known=Object.values(LS("dks_status",{})).filter(function(v){return v==="known";}).length;
  el.innerHTML='<div class="packintro">島の点を全部ともすと、その島の語彙パックが開きます。</div><div class="packgrid">'+
   IPACKS.map(function(p){var open=packOpen(p.id),th=packThreshold(p.id);
     if(open)return '<button class="packcard on" data-pack="'+p.id+'" aria-label="'+esc(p.island)+'語彙パックを開く">'
       +packSilhouette(p.id)+'<div class="pkname">'+esc(p.island)+'</div><div class="pktheme">'+esc(p.theme)+'</div>'
       +'<div class="pkmeta">'+p.words.length+'語 ・ 解放済み</div></button>';
     return '<div class="packcard lock" aria-label="'+esc(p.island)+'語彙パック（未解放）">'
       +lockCard({sil:packSilhouette(p.id),title:p.island,
         cond:esc(p.island)+' を全点灯で解放 ・ あと <b>'+Math.max(0,th-known)+'</b> 語'})
       +'</div>';}).join("")+'</div>';
  el.querySelectorAll("[data-pack]").forEach(function(b){b.onclick=function(){_packView=b.dataset.pack;renderPackDetail(_packView);};});}
function renderPackDetail(id){var p=packOf(id),el=$("l-packs");if(!p||!el)return;
  el.innerHTML='<div class="packhead"><button class="chip" id="pkBack" aria-label="パック一覧に戻る">← 一覧</button>'
   +'<div><div class="pkhname">'+esc(p.island)+'</div><div class="pkhtheme">'+esc(p.theme)+' ・ '+p.words.length+'語</div></div></div>'
   +'<div class="packlist">'+p.words.map(function(d,i){
     return '<div class="card packw" data-reveal><div class="tag"><span class="num">'+esc(p.island)+' #'+String(i+1).padStart(2,"0")+'</span></div>'
      +'<div class="headline">'+spkBtn(d.audio,d.word)+'<span class="word">'+esc(d.word)+'</span></div>'
      +'<div class="fkata" style="text-align:left;margin:1px 0 2px">'+idKata(d.word)+'</div>'
      +'<div class="gloss">'+esc(d.gloss)+'</div><div class="taphint">タップで意味 →</div>'
      +'<div class="reveal"><div class="meaning">'+esc(d.meaning)+'</div><div class="examples">'
      +d.ex.map(function(e){return '<div class="ex"><div class="id">'+spkBtn(e[2],e[0])+'<span class="t">'+wrapWords(e[0])+'</span></div><div class="ja">'+esc(e[1])+'</div></div>';}).join("")
      +'</div><div class="note"><div class="lbl">Catatan・語源メモ</div><p>'+esc(d.note)+'</p></div></div></div>';}).join("")+'</div>';
  $("pkBack").onclick=function(){_packView=null;buildIslandPacks();};}
/* 接頭辞 */
function buildAffix(arr,id){$(id).innerHTML=arr.map(p=>`<div class="lesson panelcard"><div class="lp">${esc(p.p)}</div><div class="lt2">${esc(p.t)}</div><div class="ln">${esc(p.note)}</div>
  ${p.ex.map(e=>`<div class="lex">${spkBtn(e[2],e[0])}<span class="w">${esc(e[0])}</span><span class="m">${esc(e[1])}</span></div>`).join("")}</div>`).join("");}
function buildGrammar(){buildAffix(GRAMMAR,"l-gram");}
function buildPrefix(){buildAffix(PREFIX,"l-prefix");}
function buildSuffix(){buildAffix(SUFFIX,"l-suffix");}
function buildConfix(){buildAffix(CONFIX,"l-confix");}

/* 敬語⇔口語 */
function buildRegister(){$("l-reg").innerHTML=`<div class="listcard panelcard"><div style="display:flex;font-size:10px;color:var(--sub);letter-spacing:1px;padding:8px 0 4px"><div style="flex:1">丁寧</div><div style="width:24px"></div><div style="flex:1">くだけた</div><div style="min-width:70px"></div></div>`+
  REGISTER.map(r=>`<div class="regrow"><div class="regcol">${spkBtn(r[3],r[0])}<span class="w">${esc(r[0])}</span></div><span class="regarrow">→</span><div class="regcol">${spkBtn(r[4],r[1])}<span class="w">${esc(r[1])}</span></div><span class="regja">${esc(r[2])}</span></div>`).join("")+`</div>`;}

/* 会話 */
function buildScenes(){if(CAR.s)return;const sSel=$("sSelect");sSel.innerHTML=SCENES.map((sc,i)=>`<option value="${i}">${String(i+1).padStart(2,"0")}. ${esc(sc.name)}</option>`).join("");sSel.onchange=()=>CAR.s.goReal(+sSel.value);
  CAR.s=lazyCarousel($("sTrack"),SCENES.length,i=>{const sc=SCENES[i],h=(i*37)%360;
   return `<div class="scene"><div class="sbanner" style="background:linear-gradient(135deg,hsl(${h},60%,86%),hsl(${(h+40)%360},62%,78%))"><span class="semoji">${sc.emoji||"💬"}</span></div>
    <div class="stitle">${esc(sc.name)}</div><div class="ssub">${esc(sc.en)}</div>
    ${sc.lines.map(l=>`<div class="line ${l[0]}" data-reveal><div class="who">${esc(l[1].slice(0,2))}</div><div class="body"><div class="id">${spkBtn(l[4],l[2])}<span class="t">${wrapWords(l[2])}</span></div><div class="ja ja-hide">${esc(l[3])}</div></div></div>`).join("")}</div>`;
  },$("sCount"),'[data-nav="s:-1"]','[data-nav="s:1"]',(real)=>{if(sSel.value!=real)sSel.value=real;});
  $("scenePlayAll").onclick=()=>{const sc=SCENES[CAR.s.curReal()];playList(sc.lines.map(l=>l[4]),$("scenePlayAll"));};
  const ssb=$("sShuffle");if(ssb)ssb.onclick=()=>CAR.s.shuffle();
}
/* ドライバー */
function buildDriver(){if(CAR.d)return;const dTabs=$("dTabs");dTabs.innerHTML=DRIVER.map((g,i)=>`<button data-dtab="${i}" class="${i===0?'active':''}">${esc(g.cat)}</button>`).join("");
  dTabs.addEventListener("click",e=>{const b=e.target.closest("[data-dtab]");if(b)CAR.d.goReal(+b.dataset.dtab);});
  CAR.d=lazyCarousel($("dTrack"),DRIVER.length,i=>{const g=DRIVER[i];
   return `<div class="dcard"><div class="dtitle">${esc(g.cat)}</div><div class="dsub">${esc(g.en)}</div>
    ${g.items.map(it=>`<div class="dline" data-reveal><div class="dq"><div class="id"><span class="qmark">Q</span>${spkBtn(it[2],it[0])}<span class="t">${wrapWords(it[0])}</span></div><div class="ja ja-hide">${esc(it[1])}</div></div>
     <div class="dans">${it[3].map((a,k)=>`<div class="arow"><span class="amark">A${k+1}</span>${spkBtn(a[2],a[0])}<span class="t">${wrapWords(a[0])}</span></div><div class="ja ja-hide">${esc(a[1])}</div>`).join("")}</div></div>`).join("")}</div>`;
  },$("dCount"),'[data-nav="d:-1"]','[data-nav="d:1"]',(real)=>{[...dTabs.children].forEach((t,k)=>t.classList.toggle("active",k===real));});
  const dsb=$("dShuffle");if(dsb)dsb.onclick=()=>CAR.d.shuffle();
}
/* ニュース */
function buildTravel(){if($("travelWrap").dataset.done)return;$("travelWrap").dataset.done=1;$("travelWrap").innerHTML=TRAVEL.map(function(g){return '<div class="dcard" style="margin-bottom:14px"><div class="dtitle">'+g.emoji+' '+esc(g.cat)+'</div><div class="dsub">'+esc(g.en)+'</div>'+g.items.map(function(it){return '<div class="dline"><div class="id">'+spkBtn(it[2],it[0])+'<span class="t">'+wrapWords(it[0])+'</span></div><div class="ja" style="margin:3px 0 0 42px;font-size:13px;color:var(--sub)">'+esc(it[1])+'</div></div>';}).join("")+'</div>';}).join("");}
/* ===== 話す（発音チェック・録音） ===== */
var spDeck=[],spI=0,spFilter="weak",_spInit=false;
function spCur(){return spDeck.length?spDeck[spI]:null;}
function spBuild(){var st=LS("dks_status",{}),tn=todayNum(),sr=LS("dks_srs",{});
  var pool=CARDS.filter(function(c){return c.w&&c.ja;});
  if(spFilter==="weak")spDeck=pool.filter(function(c){return st[c.w]==="weak";});
  else if(spFilter==="due")spDeck=pool.filter(function(c){return sr[c.w]&&sr[c.w].due<=tn&&st[c.w]!=="known";});
  else if(spFilter==="known")spDeck=pool.filter(function(c){return st[c.w]==="known";});
  else spDeck=pool.slice();
  if(!spDeck.length)spDeck=pool.slice(0,200);
  for(var i=spDeck.length-1;i>0;i--){var j=Math.random()*(i+1)|0;var t=spDeck[i];spDeck[i]=spDeck[j];spDeck[j]=t;}
  spI=0;spDraw();}
function spDraw(){var c=spCur(),out=$("fCheckOut");
  if(out)out.innerHTML="";
  var pr=$("fPlayRec");if(pr)pr.disabled=true;
  if(!c){$("spWord").textContent="該当なし";$("spJa").textContent="";$("spCount").textContent="0 / 0";return;}
  $("spWord").textContent=c.w;$("spJa").textContent=c.ja;
  $("spCount").textContent=(spI+1)+" / "+spDeck.length;
  var P=LS("dks_pron",{})[c.w];
  if(P&&out)out.innerHTML='<span class="pheard">これまでの最高 '+(P.best||0)+'%（'+(P.tries||0)+'回）</span>';}
function buildSpeak(){
  if(!_spInit){_spInit=true;
    var f=$("spFil");
    f.innerHTML=[["weak","苦手"],["due","復習"],["known","覚えた"],["all","すべて"]].map(function(x){
      return '<button data-spf="'+x[0]+'"'+(x[0]===spFilter?' class="active"':'')+'>'+x[1]+'</button>';}).join("");
    f.addEventListener("click",function(e){var b=e.target.closest("[data-spf]");if(!b)return;
      [].forEach.call(f.children,function(x){x.classList.toggle("active",x===b);});spFilter=b.dataset.spf;spBuild();});
    $("spPlay").innerHTML=SPK;
    $("spPlay").onclick=function(){var c=spCur();if(c)play(c.audio,c.w,$("spPlay"));};
    $("spSlow").onclick=function(){var c=spCur();if(c)speakSlow(c.w,$("spPlay"));};
    $("spPrev").onclick=function(){if(spDeck.length){spI=(spI-1+spDeck.length)%spDeck.length;spDraw();}};
    $("spNext").onclick=function(){if(spDeck.length){spI=(spI+1)%spDeck.length;spDraw();}};
  }
  spBuild();}
/* ===== 言いたいこと（日本語→インドネシア語→その場面の会話へ） ===== */
function jaToId(text){return fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=id&dt=t&q="+encodeURIComponent(text))
  .then(function(r){return r.json();})
  .then(function(j){return (j&&j[0]?j[0].map(function(x){return x[0];}).join(""):"").trim();})
  .catch(function(){return "";});}
function sayMatch(idText){var toks=(idText||"").toLowerCase().replace(/[^a-z ]/g,"").split(/\s+/).filter(function(w){return w.length>2;});
  if(!toks.length)return [];
  return SCENES.map(function(s,i){var txt=s.lines.map(function(l){return l[2];}).join(" ").toLowerCase();
      var hit=0;toks.forEach(function(t){if(txt.indexOf(t)>=0)hit++;});
      return {i:i,s:s,score:hit/toks.length};})
    .filter(function(x){return x.score>0.15;})
    .sort(function(a,b){return b.score-a.score;}).slice(0,3);}
function buildSay(){var w=$("sayWrap");if(!w||w.dataset.done)return;w.dataset.done=1;
  w.innerHTML='<div class="simcard panelcard"><input class="sayin" id="sayIn" placeholder="例：水をください／いくらですか？"><button class="simmic" id="sayGo" style="margin-top:10px"><svg class="icn"><use href="#i-search"/></svg> インドネシア語にする</button><div id="sayOut"></div></div>';
  $("sayGo").onclick=sayRun;
  $("sayIn").addEventListener("keydown",function(e){if(e.key==="Enter")sayRun();});}
function sayRun(){var q=($("sayIn").value||"").trim(),out=$("sayOut");
  if(!q){out.innerHTML="";return;}
  out.innerHTML='<div class="sayload">翻訳中…</div>';
  jaToId(q).then(function(id){
    if(!id){out.innerHTML='<div class="sayload">翻訳できませんでした。通信環境をご確認ください。</div>';return;}
    var html='<div class="saycard"><div class="sayid">'+spkBtn("",id)+'<span class="t">'+wrapWords(id)+'</span></div><div class="sayja">'+esc(q)+'</div></div>';
    var ms=sayMatch(id);
    if(ms.length){html+='<div class="saysec">この表現が出てくる場面</div>'+ms.map(function(m){
      return '<div class="sayscene" data-simscene="'+m.i+'"><span class="ss-e">'+(m.s.emoji||"💬")+'</span><span class="ss-n">'+esc(m.s.name)+'</span><span class="ss-go">この場面で会話する →</span></div>';}).join("");}
    else html+='<div class="saysec">近い場面は見つかりませんでした。上の文はタップで意味・発音が確認できます。</div>';
    out.innerHTML=html;});}
(function(){document.addEventListener("click",function(e){
  var b=e.target.closest("[data-simscene]");if(!b)return;
  var i=+b.dataset.simscene;
  openTarget("talk:t-sim");
  setTimeout(function(){buildSim();_simS.si=i;var sel=$("simSel");if(sel)sel.value=String(i);simStart();},120);});})();
/* ===== なりきり会話（声で応答） ===== */
var _simS={si:0,li:0,busy:false};
function buildSim(){var w=$("simWrap");if(!w)return;
  if(!w.dataset.done){w.dataset.done=1;
    w.innerHTML='<select class="simsel" id="simSel">'+SCENES.map(function(s,i){return '<option value="'+i+'">'+(s.emoji||"")+" "+esc(s.name)+'</option>';}).join("")+'</select><div class="simcard panelcard"><div class="simlog" id="simLog"></div><div class="simturn" id="simTurn"></div><div class="simbtns"><button class="simmic" id="simMic"><svg class="icn"><use href="#i-mic"/></svg> 話す</button><button class="simskip" id="simSkip">スキップ</button></div><div class="simfb" id="simFb"></div></div>';
    $("simSel").onchange=function(){_simS.si=+this.value;simStart();};
    $("simMic").onclick=simSpeak;
    $("simSkip").onclick=function(){simAdvance(true);};
  }
  simStart();}
function simStart(){_simS.li=0;_simS.busy=false;$("simLog").innerHTML="";$("simFb").textContent="";simStep();}
function simLine(){var s=SCENES[_simS.si];return s&&s.lines?s.lines[_simS.li]:null;}
function simPush(l,me){var log=$("simLog");
  log.insertAdjacentHTML("beforeend",'<div class="simrow '+(me?"me":"you")+'"><div class="simbub">'+esc(l[2])+'<div class="simja">'+esc(l[3])+'</div></div></div>');
  log.scrollTop=log.scrollHeight;}
function simStep(){var s=SCENES[_simS.si];if(!s)return;
  var l=simLine();
  if(!l){$("simTurn").innerHTML="会話終了！ お疲れさまでした 🎉";$("simMic").disabled=true;$("simSkip").textContent="最初から";$("simSkip").onclick=simStart;return;}
  if(l[0]==="a"){ // 相手のセリフ：読み上げて次へ
    simPush(l,false);play(l[4],l[2],null);
    $("simTurn").textContent="相手が話しています…";
    _simS.li++;setTimeout(simStep,1400);return;}
  // あなたの番
  $("simMic").disabled=false;$("simSkip").textContent="スキップ";$("simSkip").onclick=function(){simAdvance(true);};
  $("simTurn").innerHTML='あなたの番：<span class="simtar">'+esc(l[2])+'</span><br>（'+esc(l[3])+'）';}
function simAdvance(skip){var l=simLine();if(!l)return;
  if(skip){simPush(l,true);play(l[4],l[2],null);}
  _simS.li++;$("simFb").textContent="";setTimeout(simStep,700);}
function simSpeak(){var l=simLine();if(!l||_simS.busy)return;
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$("simFb").textContent="この端末では音声認識に非対応です（Chrome/Edge推奨）。スキップで進めます。";return;}
  var rec=new SR();rec.lang="id-ID";rec.interimResults=false;rec.maxAlternatives=4;
  var btn=$("simMic");btn.classList.add("rec");_simS.busy=true;$("simFb").textContent="🎤 どうぞ話してください…";
  rec.onresult=function(e){var best=0,heard="";
    for(var i=0;i<e.results[0].length;i++){var alt=e.results[0][i].transcript;var sc=_sim(alt,l[2]);if(sc>best){best=sc;heard=alt;}}
    var pct=Math.round(best*100);
    if(pct>=60){$("simFb").innerHTML='<span class="pscore good">'+pct+'%</span> Bagus! 通じました';simPush(l,true);_simS.li++;setTimeout(simStep,900);}
    else{$("simFb").innerHTML='<span class="pscore low">'+pct+'%</span> 認識: '+esc(heard||"—")+' — もう一度どうぞ';}
  };
  rec.onerror=function(e){$("simFb").textContent=(e.error==="not-allowed")?"マイクの許可が必要です。":"認識できませんでした。もう一度どうぞ。";};
  rec.onend=function(){btn.classList.remove("rec");_simS.busy=false;};
  try{rec.start();}catch(_){btn.classList.remove("rec");_simS.busy=false;}}
function buildPacks(){if($("packWrap").dataset.done)return;$("packWrap").dataset.done=1;$("packWrap").innerHTML=PACKS.map(function(g){return '<div class="dcard" style="margin-bottom:14px"><div class="dtitle">'+g.emoji+' '+esc(g.cat)+'</div><div class="dsub">'+esc(g.en)+'</div>'+g.items.map(function(it){return '<div class="dline"><div class="id">'+spkBtn(it[2],it[0])+'<span class="t">'+wrapWords(it[0])+'</span></div><div class="ja" style="margin:3px 0 0 42px;font-size:13px;color:var(--sub)">'+esc(it[1])+'</div></div>';}).join("")+'</div>';}).join("");}
function buildNews(){if(CAR.n)return;const nSel=$("nSelect");nSel.innerHTML=NEWS.map((nw,i)=>`<option value="${i}">${String(i+1).padStart(2,"0")}. ${esc(nw.title)}</option>`).join("");nSel.onchange=()=>CAR.n.goReal(+nSel.value);
  CAR.n=lazyCarousel($("nTrack"),NEWS.length,i=>{const nw=NEWS[i];
   return `<div class="newscard" data-reveal><div class="ntag">Berita #${String(i+1).padStart(2,"0")}</div><div class="ntitle">${esc(nw.title)}</div>
    <div class="nbody">${spkBtn(nw.audio,nw.id)}<div class="t">${wrapWords(nw.id)}</div></div><div class="nja ja-hide">${esc(nw.ja)}</div>
    <div class="kata">${nw.kata.map(k=>`<span class="chip"><b>${esc(k[0])}</b>${esc(k[1])}</span>`).join("")}</div></div>`;
  },$("nCount"),'[data-nav="n:-1"]','[data-nav="n:1"]',(real)=>{if(nSel.value!=real)nSel.value=real;});
  const nsb=$("nShuffle");if(nsb)nsb.onclick=()=>CAR.n.shuffle();
}
/* 実ニュース */
function rnCard(r){return `<div class="rncard panelcard" data-reveal>
   <div class="rnbanner${r.img?"":" emoji"}">${r.img?`<img class="rnbg" src="${esc(r.img)}" aria-hidden="true" onerror="this.remove()"><img class="rnimg" src="${esc(r.img)}" data-fb="${esc(r.svg||"")}" loading="lazy" onerror="if(this.dataset.fb&&!this.dataset.fbd){this.dataset.fbd=1;this.src=this.dataset.fb;var b=this.parentNode.querySelector('.rnbg');if(b)b.remove();}else{this.onerror=null;this.remove();}">`:`<span class="rnemoji">${r.emoji||"📰"}</span>`}</div>
   <div class="rninner"><div class="rt">${esc(r.title)}</div>
    <div class="rbody">${spkBtn(r.audio,r.id)}<div class="t">${wrapWords(r.id)}</div></div>
    <div class="rja ja-hide">${esc(r.ja)}</div>
    ${r.url?`<a class="rlink" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">記事を開く ↗</a>`:""}</div></div>`;}
function fmtNewsDate(s){const p=(s||"").split("-");return p.length===3?(+p[1])+"/"+(+p[2]):s;}
function renderNewsDay(day){$("rnDate").textContent="📅 "+day.date+(day.real?" のニュース":" のニュース（学習用）");$("rnWrap").innerHTML=day.items.map(rnCard).join("")+newsWordsCard(day);}
/* ニュースから単語学習：その日の記事に出る未習語を抽出 */
function newsWordsOf(day){var seen={},out=[];
  (day.items||[]).forEach(function(it){
    (it.id||"").split(/\s+/).forEach(function(p){
      var n=norm(p);
      if(!n||n.length<4||seen[n])return; seen[n]=1;
      if(status[n]==="known")return;
      var m=look(n); if(!m)return;
      out.push([n,m]);
    });
  });
  return out.slice(0,14);}
function newsWordsCard(day){var ws=newsWordsOf(day);
  if(!ws.length)return '<div class="nwcard panelcard"><h4>今日のニュースの新出語</h4><div class="nwempty">この日の語はすべて「覚えた」になっています。お見事！</div></div>';
  return '<div class="nwcard panelcard"><h4>ニュースの新出語（'+ws.length+'語）</h4><div class="nwhint">タップで発音・意味／「＋復習」で苦手リストに入れて練習できます</div><div class="nwlist">'+
    ws.map(function(x){return '<div class="nwrow"><span class="nww" data-audio="" data-text="'+esc(x[0])+'">'+esc(x[0])+'</span><span class="nwm">'+esc(x[1])+'</span><button class="nwadd" data-nw="'+esc(x[0])+'">＋復習</button></div>';}).join("")+
    '</div><button class="nwall" id="nwAll">すべて復習に追加</button></div>';}
(function(){document.addEventListener("click",function(e){
  var b=e.target.closest("[data-nw]");
  if(b){var w=b.dataset.nw;status[w]="weak";SV("dks_status",status);b.textContent="追加済み";b.classList.add("done");b.disabled=true;if(typeof renderHomeStats==="function")renderHomeStats();return;}
  if(e.target.closest("#nwAll")){var btns=document.querySelectorAll("[data-nw]");btns.forEach(function(x){if(!x.disabled){status[x.dataset.nw]="weak";x.textContent="追加済み";x.classList.add("done");x.disabled=true;}});SV("dks_status",status);if(typeof renderHomeStats==="function")renderHomeStats();var ab=$("nwAll");if(ab){ab.textContent="復習リストに追加しました";ab.disabled=true;}}
});})();
function buildRealNews(){if($("rnWrap").dataset.done)return;$("rnWrap").dataset.done=1;
  const week=(window.REALNEWS_WEEK&&window.REALNEWS_WEEK.length)?window.REALNEWS_WEEK:[{date:NEWS_UPDATED,real:true,items:REALNEWS}];
  const bar=$("rnDates");
  bar.innerHTML=week.map((d,i)=>`<button class="datechip ${i===0?"active":""}" data-di="${i}">${i===0?"今日 ":""}${fmtNewsDate(d.date)}</button>`).join("");
  bar.addEventListener("click",e=>{const b=e.target.closest("[data-di]");if(!b)return;[...bar.children].forEach(x=>x.classList.toggle("active",x===b));renderNewsDay(week[+b.dataset.di]);});
  renderNewsDay(week[0]);}
/* 日本 */
function buildJapan(){if($("jCard").dataset.done)return;$("jCard").dataset.done=1;$("jCard").innerHTML=JAPAN.map(x=>`<div class="litem" data-reveal><div class="id">${spkBtn(x[2],x[0])}<span class="t">${wrapWords(x[0])}</span></div><div class="ja ja-hide">${esc(x[1])}</div></div>`).join("");}
/* 歴史 */
function buildHistory(){if($("histWrap").dataset.done)return;$("histWrap").dataset.done=1;$("histWrap").innerHTML=HISTORY.map((h,i)=>`<div class="cult panelcard" data-reveal><h3>${i+1}. ${esc(h.title)}</h3><p>${esc(h.body)}</p><div class="lex" style="margin-top:10px;border-top:1px solid var(--line2);padding-top:11px">${spkBtn(h.audio,h.id)}<span class="t">${wrapWords(h.id)}</span></div><div style="font-size:12.5px;color:var(--sub);margin:5px 0 0 42px">${esc(h.ja)}</div></div>`).join("");}

/* 地理 */
let GEOORD=[];
function renderGeo(){const el=$("geoTrack");el.innerHTML=GEOORD.map(i=>{const g=GEO[i];return `<div class="slide"><div class="card geocard" data-reveal><div class="geobanner" style="--g1:#b58a4c;--g2:#8a6224"><span class="geoemoji">${g.emoji}</span></div><div class="georegion">${esc(g.region)}</div><div class="headline"><span class="word">${esc(g.name)}</span></div><div class="gloss">${esc(g.body)}</div><div class="lex" style="margin-top:12px;border-top:1px solid var(--line2);padding-top:12px">${spkBtn(g.audio,g.id)}<span class="t">${wrapWords(g.id)}</span></div><div style="font-size:12.5px;color:var(--sub);margin:5px 0 0 42px">${esc(g.ja)}</div></div></div>`;}).join("");}
function geoNav(i){$("geoCount").textContent=(i+1)+" / "+GEO.length;}
function buildGeo(){GEOORD=GEO.map((_,i)=>i);if(!CAR.geo){renderGeo();}else{renderGeo();}
  if(!CAR.geo){CAR.geo={step:d=>{const t=$("geoTrack");t.scrollBy({left:t.clientWidth*d,behavior:"smooth"});}};
  const t=$("geoTrack");let tmr;t.addEventListener("scroll",()=>{clearTimeout(tmr);tmr=setTimeout(()=>geoNav(Math.round(t.scrollLeft/t.clientWidth)),90);});geoNav(0);
  $("geoShuffle").addEventListener("click",()=>{for(let i=GEOORD.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[GEOORD[i],GEOORD[j]]=[GEOORD[j],GEOORD[i]];}renderGeo();$("geoTrack").scrollTo({left:0});geoNav(0);});}}

/* 辞書 */
let DICTARR=null;
let MYWORDS=LS("dks_mywords",{});
(function(){Object.keys(MYWORDS).forEach(function(w){if(!GLOSS[w])GLOSS[w]=MYWORDS[w];});})();
function addMyWord(w,ja){if(!w||!ja)return false;MYWORDS[w]=ja;SV("dks_mywords",MYWORDS);GLOSS[w]=ja;DICTARR=null;return true;}
function buildDict(){
  if(!DICTARR){DICTARR=Object.keys(GLOSS).filter(k=>k&&GLOSS[k]).sort().map(k=>[k,GLOSS[k]]);}
  const inp=$("dictIn");
  function render(){const q=(inp.value||"").trim().toLowerCase();
    let arr=DICTARR;
    if(q)arr=DICTARR.filter(([w,m])=>w.includes(q)||m.toLowerCase().includes(q));
    $("dictCount").textContent=arr.length+" 語"+(arr.length>400?"（先頭400件を表示）":"");
    $("dictWrap").innerHTML=arr.slice(0,400).map(([w,m])=>{const au=(WORDAUDIO[w]||("audio/w/"+w.replace(/\//g,"_")+".mp3"));return `<div class="dictrow">${spkBtn(au,w)}<div class="dw"><b>${esc(w)}</b><span>${esc(m)}</span></div><button class="bkbtn" data-book='${esc(JSON.stringify({id:w,ja:m,audio:au}))}' aria-label="ブックマーク">★</button></div>`;}).join("");
    refreshBookBtns&&refreshBookBtns();
  }
  if(!inp.dataset.b){inp.dataset.b=1;inp.addEventListener("input",render);}
  render();
}

/* 文化 */
function buildCulture(){if($("cultWrap").dataset.done)return;$("cultWrap").dataset.done=1;$("cultWrap").innerHTML=CULTURE.map((c,i)=>`<div class="cult panelcard"><h3>${i+1}. ${esc(c.title)}</h3><p>${esc(c.body)}</p><div class="lex" style="margin-top:10px;border-top:1px solid var(--line2);padding-top:11px">${spkBtn(c.audio,c.id)}<span class="t">${wrapWords(c.id)}</span></div><div style="font-size:12.5px;color:var(--sub);margin:5px 0 0 42px">${esc(c.ja)}</div></div>`).join("");}

/* 日常 */
function buildLife(){if($("dailyWrap").dataset.done)return;$("dailyWrap").dataset.done=1;$("dailyWrap").innerHTML=DAILY.map((d,i)=>`<div class="cult panelcard"><h3><span style="margin-right:7px">${d.emoji||"🏙️"}</span>${i+1}. ${esc(d.title)}</h3><p>${esc(d.body)}</p><div class="lex" style="margin-top:10px;border-top:1px solid var(--line2);padding-top:11px">${spkBtn(d.audio,d.id)}<span class="t">${wrapWords(d.id)}</span></div><div style="font-size:12.5px;color:var(--sub);margin:5px 0 0 42px">${esc(d.ja)}</div></div>`).join("");}

/* 数字 */
const dnum=v=>v>=1000000?(v/1000000)+"jt":v>=1000?(v/1000)+"rb":(""+v);
const S1=["","satu","dua","tiga","empat","lima","enam","tujuh","delapan","sembilan"];
function seg(x){let r="";if(x>=100){r+=((x/100|0)===1?"seratus":S1[x/100|0]+" ratus");x%=100;if(x)r+=" ";}if(x>=20){r+=S1[x/10|0]+" puluh";if(x%10)r+=" "+S1[x%10];}else if(x>=12){r+=S1[x-10]+" belas";}else if(x>=10){r+=(x===10?"sepuluh":"sebelas");}else if(x>0){r+=S1[x];}return r.trim();}
function toIndo(n){n=Math.floor(n);if(n===0)return "nol";let r="";const jt=n/1000000|0;n%=1000000;const rb=n/1000|0;n%=1000;if(jt)r+=(jt===1?"satu juta":seg(jt)+" juta");if(rb){if(r)r+=" ";r+=(rb===1?"seribu":seg(rb)+" ribu");}if(n){if(r)r+=" ";r+=seg(n);}return r.trim();}
function numBlocks(n){const o=[];const jt=n/1000000|0;let m=n%1000000;const rb=m/1000|0;m%=1000;const rt=m/100|0;const pl=(m%100)/10|0;const st=m%10;
  if(jt)o.push(`<span class="blk b-juta">${jt} juta</span>`);if(rb)o.push(`<span class="blk b-ribu">${rb} ribu</span>`);if(rt)o.push(`<span class="blk b-ratus">${rt} ratus</span>`);if(pl)o.push(`<span class="blk b-puluh">${pl} puluh</span>`);if(st)o.push(`<span class="blk b-satuan">${st} satuan</span>`);return o.join("");}
function buildNumbers(){if($("numGrid").dataset.done)return;$("numGrid").dataset.done=1;
  $("numGrid").innerHTML=NUMBERS.map(n=>`<button class="numcell" data-audio="${esc(n[2])}" data-text="${esc(n[1])}"><div class="big">${dnum(n[0])}</div><div class="wd">${esc(n[1])}</div></button>`).join("");
  const ni=$("numInput");
  function calc(play){let v=parseInt(ni.value.replace(/[^0-9]/g,""),10);if(isNaN(v)||v<0){$("numOut").textContent="0〜9,999,999 を入力";$("numBlocks").innerHTML="";return;}if(v>9999999)v=9999999;const r=toIndo(v);$("numOut").textContent=r;$("numBlocks").innerHTML=numBlocks(v);if(play)playSeq(r.split(" "),$("numGo"));}
  ni.addEventListener("input",()=>{let d=ni.value.replace(/[^0-9]/g,"");if(d.length>7)d=d.slice(0,7);ni.value=d?parseInt(d,10).toLocaleString("en-US"):"";calc(false);});
  $("numGo").onclick=()=>calc(true);ni.addEventListener("keydown",e=>{if(e.key==="Enter")calc(true);});
  const pad=$("numPad");if(pad){pad.addEventListener("click",e=>{const b=e.target.closest("button[data-k]");if(!b)return;const k=b.dataset.k;let d=ni.value.replace(/[^0-9]/g,"");if(k==="c")d="";else if(k==="b")d=d.slice(0,-1);else d=d+k;if(d.length>7)d=d.slice(0,7);ni.value=d?parseInt(d,10).toLocaleString("en-US"):"";calc(false);});}
}
function buildTime(){const per=h=>h<11?"pagi":h<15?"siang":h<19?"sore":"malam";const ITEM=40;
  const wH=$("wH"),wM=$("wM");if(wH.dataset.done)return;wH.dataset.done=1;
  function fill(col,max){col.innerHTML='<div class="wpad"></div>'+Array.from({length:max},(_,i)=>'<div class="witem">'+String(i).padStart(2,"0")+'</div>').join("")+'<div class="wpad"></div>';}
  fill(wH,24);fill(wM,60);
  function sel(col){return Math.round(col.scrollTop/ITEM);}
  function hi(col){const idx=sel(col);const its=col.querySelectorAll(".witem");for(let i=0;i<its.length;i++)its[i].classList.toggle("on",i===idx);return idx;}
  function reading(){const h=(sel(wH)%24+24)%24,m=(sel(wM)%60+60)%60;const h12=h%12===0?12:h%12;let words=["jam"].concat(toIndo(h12).split(" "));if(m>0){words=words.concat(["lewat"]).concat(toIndo(m).split(" ")).concat(["menit"]);}words.push(per(h));return words;}
  function upd(play){hi(wH);hi(wM);const words=reading();$("tOut").textContent=words.join(" ");if(play)playSeq(words,$("tGo"));}
  let t1,t2;wH.addEventListener("scroll",()=>{hi(wH);clearTimeout(t1);t1=setTimeout(()=>upd(false),130);});
  wM.addEventListener("scroll",()=>{hi(wM);clearTimeout(t2);t2=setTimeout(()=>upd(false),130);});
  $("tGo").onclick=()=>upd(true);
  const now=new Date();wH.scrollTop=now.getHours()*ITEM;wM.scrollTop=now.getMinutes()*ITEM;setTimeout(()=>upd(false),60);}
function buildDate(){const dp=$("dPick");if(dp.dataset.done)return;dp.dataset.done=1;
  function run(play){const v=dp.value;let dt;if(v){const p=v.split("-");dt=new Date(+p[0],+p[1]-1,+p[2]);}else dt=new Date();const d=dt.getDate(),mo=MONTHS[dt.getMonth()];const words=["tanggal"].concat(toIndo(d).split(" "));$("dOut").textContent=(words.join(" ")+" "+mo[1]);if(play)playList(wordsToSrcs(words).concat([mo[2]]),$("dGo"));}
  dp.addEventListener("change",()=>run(false));$("dGo").onclick=()=>run(true);
  const t=new Date();dp.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0");run(false);}

/* ===== フラッシュカード + SRS ===== */
let status=LS("dks_status",{}),srs=LS("dks_srs",{}),fLevel="all",fSrc="all",fSt="all",deck=[],fi=0,fFlip=false;
const SRSIV={1:1,2:2,3:4,4:8,5:16,6:35};
function todayNum(){var d=new Date();d.setHours(0,0,0,0);return Math.floor(d.getTime()/86400000);}
function srsDue(w){return !!(srs[w]&&srs[w].due<=todayNum());}
function buildFlash(){let _cardSwiped=false,_cx0=null,_cy0=null;
  const lv=$("lvChips"),sc=$("srcChips"),st=$("stChips");
  const mk=(box,arr,cb)=>{box.innerHTML="";arr.forEach(([v,l])=>{const b=document.createElement("button");b.textContent=l;if(v==="all")b.classList.add("active");b.dataset.v=v;b.onclick=()=>{[...box.children].forEach(x=>x.classList.remove("active"));b.classList.add("active");cb(v);};box.appendChild(b);});};
  mk(lv,[["all","すべて"],["1","初級"],["2","中級"],["3","上級"]],v=>{fLevel=v;rebuild();});
  mk(sc,[["all","すべて"],["自分","自分の単語"],["単語","単語"],["会話","会話"],["ニュース","ニュース"],["ドライバー","ドライバー"],["日本","日本"],["島パック","島パック"]],v=>{fSrc=v;rebuild();});
  mk(st,[["all","すべて"],["due","復習"],["new","未学習"],["weak","苦手"],["known","覚えた"]],v=>{fSt=v;rebuild();});
  $("fSpk").innerHTML=SPK;
  $("fcard").addEventListener("click",e=>{if(_cardSwiped){_cardSwiped=false;return;}if(e.target.closest("[data-audio]")||e.target.closest(".tok.known"))return;if(deck.length){fFlip=!fFlip;draw(false);}});
  $("fcard").addEventListener("touchstart",e=>{if(e.touches.length!==1){_cx0=null;return;}_cx0=e.touches[0].clientX;_cy0=e.touches[0].clientY;},{passive:true});
  $("fcard").addEventListener("touchend",e=>{if(_cx0==null||!deck.length)return;const t=e.changedTouches[0],dx=t.clientX-_cx0,dy=t.clientY-_cy0;_cx0=null;const ax=Math.abs(dx),ay=Math.abs(dy);if(ax<45&&ay<45)return;_cardSwiped=true;setTimeout(function(){_cardSwiped=false;},450);if(ax>ay){fi=((dx<0?fi+1:fi-1)+deck.length)%deck.length;fFlip=false;draw(true);}else{mark(dy<0?"known":"weak");}},{passive:true});
  $("fPrev").onclick=()=>{if(deck.length){fi=(fi-1+deck.length)%deck.length;fFlip=false;draw(true);}};
  $("fNext").onclick=()=>{if(deck.length){fi=(fi+1)%deck.length;fFlip=false;draw(true);}};
  $("fShuffle").onclick=()=>{for(let i=deck.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[deck[i],deck[j]]=[deck[j],deck[i]];}fi=0;fFlip=false;draw(true);};
  $("fSpk").onclick=e=>{e.stopPropagation();if(deck.length)play(deck[fi].audio,deck[fi].w,$("fSpk"));};
  $("srsWeak").onclick=()=>mark("weak");$("srsKnown").onclick=()=>mark("known");
  rebuild();
}
function myCards(){var out=[],seen={};
  Object.keys(MYWORDS).forEach(function(w){if(!w||seen[w])return;seen[w]=1;
    out.push({w:w,ja:MYWORDS[w],audio:"audio/w/"+w.replace(/\//g,"_")+".mp3",lv:2,src:["自分"],ex:null});});
  var bk=LS("dks_book",{});
  Object.keys(bk).forEach(function(k){var b=bk[k];if(!b||!b.id||seen[b.id])return;seen[b.id]=1;
    out.push({w:b.id,ja:b.ja||"",audio:b.audio||"",lv:2,src:["自分"],ex:null});});
  return out;}
function rebuild(){var pool=(fSrc==="自分")?myCards():CARDS;
  deck=pool.filter(c=>(fLevel==="all"||c.lv===+fLevel)&&(fSrc==="all"||fSrc==="自分"||c.src.includes(fSrc))&&(fSt==="all"||(fSt==="due"?srsDue(c.w):fSt==="new"?!status[c.w]:status[c.w]===fSt)));fi=0;fFlip=false;draw(false);}
function draw(auto){const fw=$("fword"),fm=$("fmean"),ft=$("ftags"),fx=$("fex"),fc=$("fCount");
  if(!deck.length){ft.innerHTML="";fw.textContent="該当なし";fm.textContent="";fx.innerHTML="";fc.textContent="0 / 0";return;}
  const c=deck[fi];const stt=status[c.w];const stb=stt?`<span class="badge bst">${stt==='weak'?'苦手':'覚えた'}</span>`:"";
  ft.innerHTML=`<span class="badge lv${c.lv}">${({1:"初級",2:"中級",3:"上級"})[c.lv]}</span>`+c.src.map(s=>`<span class="badge bsrc">${esc(s)}</span>`).join("")+stb;
  const fk=$("fkata");
  if(fFlip){fw.textContent=c.ja;fm.textContent=c.w;if(fk)fk.textContent="";fx.innerHTML=c.ex?`${patChip(c)}<div class="fexline">${spkBtn(c.ex[2],c.ex[0])}<span class="t">${wrapWords(c.ex[0])}</span></div><div class="fexja">${esc(c.ex[1])}</div>`:"";}
  else{fw.textContent=c.w;fm.textContent="";if(fk)fk.textContent=idKata(c.w);fx.innerHTML="";}
  fc.textContent=(fi+1)+" / "+deck.length;
  if($("fBook"))$("fBook").classList.toggle("on",isBooked(c.w));
  if(auto&&!fFlip){play(c.audio,c.w,$("fSpk"));if(typeof bumpActivity==="function")bumpActivity();}
}
function srsUpdate(w,s){if(!w)return;status[w]=s;SV("dks_status",status);const tn=todayNum();
  if(s==="known"){const lvl=Math.min(6,((srs[w]&&srs[w].lvl)||0)+1);srs[w]={lvl:lvl,due:tn+SRSIV[lvl]};}
  else{srs[w]={lvl:1,due:tn+1};}
  SV("dks_srs",srs);}
function mark(s){if(!deck.length)return;const w=deck[fi].w;srsUpdate(w,s);const wasFiltered=fSt!=="all";fi=(fi+1)%deck.length;fFlip=false;if(wasFiltered)rebuild();else draw(true);}
/* 群島プログレス（記録タブ） */
const ARCHPTS=[[0.8,5.5,0],[10.7,6.6,0],[4.9,11.1,0],[10.1,11.0,0],[16.0,12.7,0],[23.9,11.4,0],[27.2,12.7,0],[11.4,18.0,0],[17.6,16.5,0],[22.1,16.9,0],[27.6,16.3,0],[32.2,16.1,0],[17.5,22.2,0],[21.5,22.1,0],[28.4,23.0,0],[34.4,23.5,0],[39.7,21.2,0],[258.3,21.5,2],[261.6,23.7,2],[268.6,23.4,2],[274.1,23.6,2],[20.9,27.0,0],[38.1,28.9,0],[43.6,28.1,0],[161.1,27.5,2],[256.0,28.2,2],[264.6,26.9,2],[267.8,28.3,2],[274.4,28.5,2],[281.0,27.0,2],[374.4,27.2,4],[28.1,32.7,0],[34.8,32.3,0],[40.2,32.5,0],[43.2,32.6,0],[51.2,35.1,0],[54.4,33.6,0],[141.3,33.6,0],[263.9,33.4,2],[273.1,32.7,2],[279.6,32.1,2],[375.0,33.5,4],[33.4,39.6,0],[39.7,38.8,0],[46.2,40.3,0],[49.0,40.2,0],[57.3,40.1,0],[60.4,40.3,0],[139.8,40.4,0],[251.6,39.1,2],[257.7,40.1,2],[262.3,39.0,2],[268.6,39.4,2],[275.4,38.5,2],[11.2,43.4,0],[16.4,45.0,0],[33.2,45.3,0],[39.6,44.5,0],[44.4,45.7,0],[51.8,45.7,0],[56.2,44.1,0],[60.2,46.3,0],[135.4,46.0,0],[175.0,43.9,2],[250.9,43.3,2],[259.2,44.4,2],[261.9,45.2,2],[269.7,43.7,2],[274.7,44.3,2],[284.1,46.4,2],[375.7,44.5,4],[415.3,45.5,5],[27.2,49.4,0],[43.5,49.7,0],[51.7,49.0,0],[56.7,49.7,0],[63.1,48.9,0],[68.2,49.9,0],[71.6,48.8,0],[83.0,50.2,0],[180.4,49.7,2],[246.4,50.5,2],[252.1,48.9,2],[262.2,49.1,2],[268.0,51.4,2],[272.9,49.1,2],[280.6,49.4,2],[291.4,50.5,2],[374.4,49.9,4],[404.7,51.8,4],[408.0,50.2,5],[414.8,50.0,5],[43.7,54.6,0],[51.6,55.8,0],[54.6,55.6,0],[65.9,55.1,0],[74.3,56.8,0],[77.3,55.5,0],[90.0,57.1,0],[213.9,57.1,2],[223.8,57.3,2],[242.1,56.9,2],[246.5,57.6,2],[252.1,56.1,2],[258.2,55.6,2],[262.7,56.3,2],[268.3,57.4,2],[275.0,56.1,2],[285.3,56.2,2],[370.0,56.3,4],[414.4,56.2,5],[28.1,61.2,0],[33.3,60.2,0],[49.4,60.9,0],[55.2,60.1,0],[62.1,61.1,0],[66.1,62.3,0],[71.5,60.9,0],[83.8,62.7,0],[90.6,60.5,0],[94.7,62.3,0],[100.4,63.1,0],[105.5,63.0,0],[173.2,60.3,2],[178.2,62.7,2],[184.2,62.1,2],[211.6,62.3,2],[217.7,61.3,2],[225.3,62.5,2],[230.8,62.8,2],[246.9,61.1,2],[251.7,62.1,2],[258.2,60.8,2],[269.2,60.6,2],[273.2,62.9,2],[284.1,60.1,2],[319.9,60.8,4],[324.6,62.2,4],[363.1,62.9,4],[370.4,60.3,4],[399.0,62.2,4],[404.0,62.7,4],[409.2,61.4,5],[413.0,62.2,5],[33.4,66.2,0],[50.8,68.6,0],[56.5,66.4,0],[60.8,66.0,0],[65.7,68.1,0],[73.9,66.5,0],[77.4,67.6,0],[88.5,68.1,0],[100.2,66.2,0],[107.4,66.6,0],[111.6,67.4,0],[117.2,68.3,0],[122.4,65.7,0],[172.3,65.7,2],[179.0,66.2,2],[191.5,68.3,2],[200.9,67.7,2],[207.2,66.9,2],[212.3,67.0,2],[218.9,68.2,2],[225.3,66.1,2],[228.9,67.0,2],[235.4,66.7,2],[245.8,67.1,2],[253.5,68.5,2],[258.8,68.7,2],[264.7,67.6,2],[269.8,65.8,2],[275.0,67.5,2],[279.4,67.4,2],[291.7,66.6,2],[308.6,67.0,4],[312.3,67.7,4],[318.8,67.5,4],[324.5,67.3,4],[330.6,66.9,4],[342.8,67.4,4],[346.0,68.4,4],[352.0,65.9,4],[358.5,66.4,4],[364.0,67.4,4],[397.8,67.9,4],[404.0,66.0,5],[410.4,67.9,5],[413.1,68.3,5],[50.3,71.7,0],[57.1,72.5,0],[62.8,73.2,0],[65.8,72.3,0],[71.9,74.1,0],[78.7,71.3,0],[82.9,72.4,0],[89.5,73.0,0],[99.2,73.1,0],[116.1,71.7,0],[174.5,74.0,2],[180.6,73.4,2],[184.2,73.6,2],[191.2,72.8,2],[196.4,72.3,2],[201.8,72.5,2],[205.8,72.3,2],[212.2,74.4,2],[218.3,72.4,2],[229.1,71.6,2],[233.6,74.0,2],[240.7,72.6,2],[250.9,71.4,2],[257.0,72.2,2],[263.9,73.0,2],[275.7,73.1,2],[278.7,71.8,2],[309.3,72.1,4],[312.8,71.3,4],[325.5,71.9,4],[330.1,71.8,4],[353.1,71.5,4],[363.5,71.6,4],[398.2,72.3,4],[413.9,72.8,5],[432.6,73.0,5],[43.5,79.1,0],[60.2,78.6,0],[66.9,79.7,0],[74.2,78.8,0],[83.2,78.2,0],[88.7,77.5,0],[105.5,78.6,0],[118.8,77.7,0],[124.0,79.4,0],[174.8,80.0,2],[178.6,76.9,2],[183.6,79.9,2],[188.8,79.7,2],[194.9,79.2,2],[200.3,77.3,2],[207.8,77.1,2],[212.3,79.7,2],[219.1,79.6,2],[225.5,76.9,2],[228.8,79.3,2],[235.8,76.9,2],[240.8,77.5,2],[246.2,77.1,2],[250.5,80.0,2],[262.0,78.4,2],[267.6,78.2,2],[273.4,79.0,2],[278.9,79.2,2],[309.2,79.1,4],[396.8,78.8,4],[402.8,77.6,5],[426.2,77.8,5],[436.2,79.9,5],[440.8,79.2,5],[40.0,82.9,0],[61.2,82.5,0],[66.2,84.2,0],[71.4,83.0,0],[83.4,83.2,0],[90.7,82.7,0],[95.6,85.1,0],[99.8,83.8,0],[111.6,82.5,0],[117.4,83.6,0],[180.5,84.8,2],[183.3,84.3,2],[190.3,83.9,2],[197.1,83.7,2],[201.5,85.2,2],[207.0,84.0,2],[212.8,85.0,2],[218.9,84.8,2],[223.7,82.5,2],[236.1,84.9,2],[239.6,83.1,2],[245.0,85.0,2],[250.7,82.7,2],[258.4,84.2,2],[261.8,84.6,2],[269.5,83.9,2],[273.0,84.6,2],[307.3,83.2,4],[329.0,83.4,4],[346.2,82.6,4],[396.9,84.9,4],[402.5,84.7,5],[409.8,84.3,5],[438.0,82.6,5],[449.4,84.2,5],[454.6,84.0,5],[459.8,84.6,5],[464.1,83.1,5],[471.5,82.9,6],[497.6,85.3,6],[46.2,88.3,0],[66.5,90.9,0],[79.8,88.1,0],[84.3,91.1,0],[89.1,91.0,0],[95.7,88.2,0],[100.3,89.4,0],[105.6,90.4,0],[111.0,90.5,0],[117.0,88.2,0],[180.4,89.5,2],[183.7,88.3,2],[191.6,88.4,2],[196.0,89.7,2],[200.4,89.5,2],[206.1,89.7,2],[212.8,89.2,2],[217.4,89.3,2],[223.1,88.4,2],[228.8,90.8,2],[235.2,90.8,2],[239.2,91.0,2],[246.4,90.5,2],[252.2,90.2,2],[256.7,90.4,2],[262.1,88.8,2],[267.3,89.3,2],[301.6,89.9,4],[309.5,88.1,4],[314.0,90.2,4],[325.8,89.5,4],[331.7,88.0,4],[337.4,89.3,4],[341.3,88.3,4],[346.4,90.3,4],[438.1,90.4,5],[443.5,90.6,5],[448.3,89.4,5],[454.6,90.5,5],[460.4,89.0,5],[466.3,89.7,6],[471.8,88.4,6],[477.5,90.5,6],[480.8,90.7,6],[492.7,88.8,6],[504.6,90.3,6],[509.3,90.5,6],[74.3,95.2,0],[80.0,94.2,0],[85.1,94.1,0],[89.7,93.6,0],[94.2,96.6,0],[105.6,94.7,0],[110.7,95.4,0],[130.1,95.7,0],[133.0,95.6,0],[172.2,96.3,2],[184.6,96.0,2],[196.8,93.7,2],[201.0,94.0,2],[208.6,96.5,2],[211.7,95.5,2],[218.6,93.7,2],[230.1,94.5,2],[236.0,94.5,2],[240.9,94.9,2],[247.9,95.7,2],[253.0,95.8,2],[257.2,96.7,2],[263.9,95.8,2],[301.8,93.8,4],[307.4,94.8,4],[315.1,96.7,4],[318.2,94.6,4],[326.2,94.2,4],[329.8,95.0,4],[334.7,94.4,4],[341.3,94.8,4],[348.7,94.5,4],[351.9,96.5,4],[364.4,96.1,4],[397.7,94.5,4],[403.6,94.4,5],[429.8,95.4,5],[437.6,95.8,5],[446.8,94.6,5],[454.1,96.7,5],[465.7,94.9,6],[471.8,96.0,6],[475.5,94.9,6],[482.6,94.7,6],[498.9,96.5,6],[526.1,95.4,6],[531.3,96.3,6],[538.5,96.3,6],[73.0,101.8,0],[76.9,101.8,0],[82.8,99.9,0],[90.0,100.3,0],[94.7,101.0,0],[105.5,101.9,0],[113.0,100.9,0],[116.1,101.7,0],[121.7,100.8,0],[128.6,99.4,0],[134.8,101.5,0],[185.5,100.7,2],[189.9,99.8,2],[195.7,100.1,2],[200.6,101.6,2],[207.3,100.6,2],[211.8,101.5,2],[217.4,100.0,2],[224.2,101.4,2],[231.1,101.6,2],[236.6,102.1,2],[241.5,101.5,2],[245.0,99.9,2],[250.4,102.0,2],[258.3,101.2,2],[262.4,100.3,2],[301.3,101.7,4],[307.9,102.4,4],[314.9,101.7,4],[319.1,101.8,4],[323.6,99.5,4],[347.9,102.2,4],[354.3,100.6,4],[365.0,101.9,4],[368.4,99.2,4],[429.9,101.1,5],[435.6,99.8,5],[459.9,99.4,5],[464.7,100.5,5],[471.0,101.5,6],[475.2,101.3,6],[482.2,100.7,6],[486.1,102.1,6],[510.5,101.8,6],[519.3,99.5,6],[530.5,99.4,6],[536.8,102.2,6],[542.3,101.4,6],[84.5,105.5,0],[89.4,105.2,0],[96.7,106.5,0],[100.3,105.1,0],[107.1,107.5,0],[113.1,105.1,0],[117.2,105.8,0],[124.0,105.3,0],[129.1,107.9,0],[135.3,104.8,0],[138.6,105.2,0],[162.9,107.7,1],[185.4,107.5,2],[195.0,107.8,2],[201.4,107.1,2],[206.4,105.8,2],[212.3,105.8,2],[217.1,106.2,2],[225.5,106.9,2],[231.0,107.2,2],[236.3,108.0,2],[241.6,105.7,2],[245.6,106.1,2],[250.5,105.5,2],[262.7,107.3,2],[298.3,105.3,4],[302.5,106.9,4],[308.1,107.8,4],[313.3,107.7,4],[319.8,107.9,4],[323.5,105.5,4],[329.7,107.7,4],[382.3,106.9,4],[471.5,107.4,6],[476.5,105.7,6],[480.0,105.4,6],[488.5,105.3,6],[493.3,106.7,6],[511.1,106.0,6],[519.9,105.0,6],[524.8,107.5,6],[530.8,107.9,6],[537.2,107.1,6],[548.0,106.0,6],[554.5,105.2,6],[66.0,110.6,0],[79.8,112.2,0],[82.6,111.1,0],[96.4,113.5,0],[101.9,110.8,0],[111.2,110.9,0],[118.8,111.1,0],[121.9,111.2,0],[130.2,111.9,0],[135.1,110.6,0],[139.8,111.4,0],[144.7,112.5,0],[158.3,111.9,1],[161.4,110.4,1],[190.7,112.5,2],[194.9,113.0,2],[203.0,112.8,2],[208.3,111.6,2],[214.1,111.0,2],[217.5,112.3,2],[225.3,110.7,2],[228.7,110.5,2],[235.0,110.8,2],[239.8,112.8,2],[251.7,112.6,2],[256.0,113.4,2],[262.3,111.9,2],[292.8,111.9,2],[295.9,113.5,2],[301.8,111.7,4],[307.5,112.5,4],[312.1,111.6,4],[323.2,112.3,4],[329.6,111.9,4],[386.9,113.2,4],[413.7,111.3,5],[421.5,113.2,5],[425.3,112.1,5],[432.3,113.0,5],[460.7,111.0,5],[463.4,113.3,5],[470.6,111.0,6],[476.6,111.2,6],[480.8,111.6,6],[487.3,112.6,6],[491.4,112.8,6],[504.6,113.0,6],[508.0,111.9,6],[515.8,112.7,6],[521.3,111.0,6],[527.9,112.9,6],[531.1,111.8,6],[539.1,111.1,6],[542.9,113.5,6],[550.1,111.1,6],[555.2,111.6,6],[560.5,112.9,6],[564.4,111.1,6],[71.8,118.5,0],[85.0,117.9,0],[90.7,118.8,0],[110.6,116.0,0],[116.6,118.2,0],[121.6,116.7,0],[128.0,118.3,0],[136.0,116.1,0],[156.2,117.3,1],[162.3,116.8,1],[166.6,116.3,1],[213.4,117.2,2],[219.1,116.7,2],[228.3,117.9,2],[234.2,118.3,2],[241.8,118.5,2],[252.5,117.8,2],[256.4,116.6,2],[263.5,116.3,2],[297.2,118.2,4],[302.8,118.9,4],[307.1,117.0,4],[325.7,118.6,4],[331.1,119.1,4],[336.9,117.0,4],[341.0,118.3,4],[345.8,117.9,4],[387.1,117.7,4],[396.2,117.2,5],[403.1,116.8,5],[409.3,116.7,5],[413.8,117.5,5],[420.7,118.5,5],[425.2,117.4,5],[432.6,119.0,5],[437.2,116.3,5],[442.3,118.0,5],[465.2,117.0,5],[469.0,118.4,6],[476.9,117.4,6],[480.3,117.3,6],[485.9,119.1,6],[491.4,116.9,6],[502.7,116.2,6],[508.5,117.7,6],[516.3,116.5,6],[519.8,118.4,6],[526.2,117.1,6],[530.8,116.8,6],[539.1,116.4,6],[542.4,118.4,6],[550.1,118.9,6],[565.5,118.3,6],[89.2,122.7,0],[94.8,122.0,0],[99.9,124.5,0],[106.1,123.6,0],[113.2,124.0,0],[116.8,124.5,0],[124.2,124.8,0],[135.4,122.4,0],[247.4,124.7,2],[251.4,123.6,2],[258.9,123.1,2],[302.0,122.8,4],[309.5,123.8,4],[312.4,124.5,4],[324.6,123.9,4],[330.2,121.9,4],[392.0,123.7,4],[409.7,122.2,5],[443.7,124.7,5],[448.0,124.6,5],[481.5,121.9,6],[485.6,122.7,6],[493.5,124.0,6],[504.1,122.2,6],[509.9,124.5,6],[514.2,123.5,6],[521.5,124.0,6],[527.1,123.9,6],[531.3,124.3,6],[539.0,121.8,6],[544.6,123.0,6],[555.3,123.8,6],[558.9,123.1,6],[566.0,124.8,6],[94.1,130.0,0],[101.0,127.2,0],[111.5,129.2,0],[118.9,128.5,0],[123.0,128.2,0],[129.0,129.3,0],[135.2,130.2,0],[303.2,129.9,4],[307.6,127.5,4],[336.7,129.2,4],[340.4,127.7,4],[346.2,129.1,4],[498.0,128.1,6],[505.3,129.7,6],[510.5,129.8,6],[516.8,129.4,6],[520.2,129.6,6],[525.6,129.2,6],[530.9,129.9,6],[537.6,128.1,6],[544.6,127.5,6],[550.2,129.6,6],[553.3,129.6,6],[560.2,130.1,6],[565.9,128.6,6],[102.4,134.5,0],[107.2,133.2,0],[112.4,134.0,0],[116.8,135.4,0],[121.7,134.3,0],[135.7,132.9,0],[256.5,133.2,2],[295.6,134.7,3],[308.2,133.8,3],[312.1,133.5,3],[325.2,134.6,4],[331.8,135.0,4],[342.0,134.5,4],[348.4,134.9,4],[452.9,135.6,5],[510.1,133.3,6],[520.3,135.7,6],[525.6,133.3,6],[530.9,133.3,6],[542.1,134.4,6],[549.0,134.6,6],[554.1,134.5,6],[558.4,133.0,6],[565.4,133.6,6],[110.6,140.0,0],[117.1,138.7,0],[128.8,138.9,0],[134.9,139.8,1],[303.6,140.4,3],[306.9,141.2,3],[314.3,138.8,3],[329.9,141.2,3],[342.9,140.9,4],[348.4,140.3,4],[469.5,140.9,6],[526.4,139.6,6],[531.3,140.0,6],[538.3,141.3,6],[544.3,141.2,6],[548.6,139.7,6],[553.8,141.5,6],[559.0,138.9,6],[564.9,141.4,6],[117.0,145.3,0],[122.8,146.9,0],[127.6,147.2,1],[133.6,146.7,1],[301.9,145.3,3],[309.5,145.2,3],[313.3,144.5,3],[341.2,146.3,3],[459.6,144.1,5],[482.6,145.7,6],[485.7,146.8,6],[530.9,144.9,6],[536.9,146.9,6],[550.4,145.4,6],[566.3,144.7,6],[129.2,151.1,1],[134.0,151.5,1],[139.1,151.0,1],[150.4,152.3,1],[485.7,151.0,6],[537.2,150.2,6],[542.9,151.2,6],[548.5,150.0,6],[554.5,150.6,6],[561.5,150.8,6],[565.4,150.3,6],[133.6,156.0,1],[141.1,155.4,1],[146.4,155.5,1],[152.6,156.5,1],[157.1,158.0,1],[195.3,157.3,1],[200.3,157.8,1],[481.9,156.8,6],[486.4,156.1,6],[536.6,157.5,6],[543.4,157.7,6],[549.2,157.1,6],[555.8,157.8,6],[560.2,156.2,6],[136.0,161.4,1],[139.5,160.8,1],[144.3,161.0,1],[151.0,163.5,1],[157.4,163.9,1],[163.5,162.7,1],[168.3,160.8,1],[173.2,161.6,1],[179.6,161.0,1],[194.7,163.1,1],[202.6,162.7,1],[206.0,162.7,1],[214.0,164.0,1],[219.2,160.9,1],[225.2,162.9,1],[228.9,163.7,1],[236.2,163.7,1],[252.8,162.8,1],[257.1,162.5,1],[454.6,161.5,5],[483.2,161.8,6],[488.3,163.7,6],[541.9,161.7,6],[555.4,161.3,6],[558.7,161.9,6],[566.8,161.3,6],[146.1,167.4,1],[156.6,167.9,1],[163.7,169.3,1],[169.4,167.9,1],[175.1,166.8,1],[180.5,168.4,1],[186.0,167.7,1],[192.0,166.5,1],[197.1,169.0,1],[201.2,169.1,1],[206.3,168.8,1],[212.7,167.7,1],[217.4,169.0,1],[224.7,166.7,1],[273.9,167.7,3],[331.3,167.8,3],[441.1,167.5,5],[447.1,169.1,5],[452.0,167.8,5],[538.5,167.1,6],[543.1,166.4,6],[548.0,168.5,6],[555.2,168.4,6],[559.8,168.7,6],[566.1,167.1,6],[184.0,173.7,1],[191.5,173.1,1],[196.0,174.1,1],[200.6,174.0,1],[207.0,175.1,1],[216.9,172.9,1],[222.8,172.5,1],[229.7,172.6,1],[236.1,172.3,1],[241.2,174.8,1],[280.1,175.0,3],[365.5,175.0,3],[381.1,172.1,3],[387.8,173.4,3],[426.9,174.1,5],[431.5,172.4,5],[446.6,175.2,5],[531.7,172.1,6],[538.9,173.5,6],[544.4,174.2,6],[549.5,174.4,6],[553.8,174.3,6],[559.1,173.8,6],[565.9,174.5,6],[202.0,177.9,1],[207.5,178.9,1],[219.1,178.0,1],[223.1,178.7,1],[229.8,178.6,1],[235.0,180.2,1],[245.9,180.6,1],[253.4,178.6,1],[262.9,179.6,3],[280.2,178.1,3],[285.0,179.6,3],[292.5,179.2,3],[296.0,179.5,3],[301.7,180.1,3],[306.9,178.4,3],[313.4,180.5,3],[318.1,178.2,3],[329.9,178.9,3],[341.5,178.9,3],[348.1,180.5,3],[352.6,180.5,3],[357.6,180.7,3],[364.1,179.8,3],[369.2,178.5,3],[409.5,179.0,5],[413.0,178.4,5],[526.9,179.8,6],[531.3,178.5,6],[541.7,179.6,6],[559.2,178.1,6],[239.5,183.8,1],[247.9,183.3,1],[253.0,184.9,1],[257.8,184.9,1],[262.9,185.0,3],[267.5,186.1,3],[273.1,183.6,3],[280.6,185.3,3],[286.6,185.4,3],[292.6,183.4,3],[295.2,184.0,3],[303.3,183.7,3],[308.1,185.7,3],[312.5,184.9,3],[320.5,185.6,3],[324.5,184.7,3],[369.7,186.3,3],[301.3,190.1,3],[358.8,190.2,3],[363.0,190.3,3],[369.8,191.7,3],[565.7,188.9,6],[296.0,195.2,3],[301.8,195.7,3],[307.6,195.4,3],[312.1,197.1,3],[358.8,196.6,3],[364.4,196.4,3],[369.2,194.6,3],[308.3,201.5,3],[313.5,200.5,3],[354.1,200.4,3],[358.4,203.1,3],[347.2,205.9,3],[346.0,211.7,3]];
const ARCH_CLUSTERS=[
 {id:"sumatra",name:"Sumatra",cx:78,cy:95,region:"スマトラ"},
 {id:"jawa",name:"Jawa",cx:190,cy:182,region:"ジャワ"},
 {id:"kalimantan",name:"Kalimantan",cx:240,cy:80,region:"カリマンタン"},
 {id:"bali",name:"Bali\u30fbNusa Tenggara",cx:335,cy:188,region:"バリ・ヌサトゥンガラ"},
 {id:"sulawesi",name:"Sulawesi",cx:360,cy:98,region:"スラウェシ"},
 {id:"maluku",name:"Maluku",cx:432,cy:112,region:"マルク"},
 {id:"papua",name:"Papua",cx:500,cy:108,region:"パプア"}
];
/* GEO と同順。地図(568x226)は正距円筒: x=2.4+(lon-95.2)*12.36, y=6.5+(5.9-lat)*12.15 */
const GEOPT=[[23.4, 25.9], [50.6, 46.6], [69.1, 86.7], [81.5, 72.1], [116.7, 67.2], [93.9, 97.6], [113.6, 117.1], [137.1, 106.1], [90.2, 121.9], [124.8, 137.7], [146.4, 153.5], [155.7, 162.0], [137.1, 155.9], [187.8, 165.7], [189.9, 173.0], [217.5, 171.7], [249.0, 180.2], [275.6, 182.7], [327.5, 186.3], [185.3, 78.2], [228.6, 100.1], [249.6, 113.4], [265.7, 74.5], [266.9, 38.1], [365.8, 63.6], [339.8, 69.7], [316.3, 95.2], [299.0, 109.8], [308.9, 130.4], [337.4, 128.0], [423.9, 120.7], [406.6, 63.6], [541.3, 117.1], [472.1, 97.6], [551.2, 168.1], [510.4, 125.6], [542.5, 128.0], [448.6, 90.3], null, null, null, null, null, null, null, null, null, null, null, null];
const CITIES=[[55,52],[108,128],[150,160],[166,168],[228,168],[278,182],[208,92],[288,98],[360,140],[376,60],[542,96]];
/* ===== 言い回し（例文に繰り返し出る型） ===== */
const PATTERNS=[
 {id:"tolong",  rx:/\btolong\b/i,                 p:"tolong 〜",       ja:"〜してください",       note:"依頼の基本形。動詞の前に置くだけで丁寧になります。"},
 {id:"jangan",  rx:/\bjangan\b/i,                 p:"jangan 〜",       ja:"〜しないで",           note:"禁止。jangan lupa（忘れないで）は頻出。"},
 {id:"bisa",    rx:/\bbisa\b[^.!?]*\?/i,          p:"bisa 〜?",        ja:"〜できますか",         note:"可否をたずねる。Bisa tolong …? でより丁寧に。"},
 {id:"boleh",   rx:/\bboleh\b/i,                  p:"boleh 〜",        ja:"〜してもいい",         note:"許可。Boleh minta …? で「〜をもらえますか」。"},
 {id:"mau",     rx:/\bmau\b/i,                    p:"mau 〜",          ja:"〜したい・欲しい",     note:"願望。Saya mau … は注文でも使えます。"},
 {id:"sudahblm",rx:/\b(sudah|belum)\b/i,          p:"sudah / belum",   ja:"もう〜／まだ〜ない",   note:"時制の代わり。返事も sudah / belum で返します。"},
 {id:"sedang",  rx:/\b(sedang|lagi)\s+\w/i,       p:"sedang 〜",       ja:"〜している最中",       note:"進行。口語では lagi をよく使います。"},
 {id:"harus",   rx:/\b(harus|mesti|perlu)\b/i,    p:"harus 〜",        ja:"〜しなければ",         note:"義務・必要。perlu は「必要がある」。"},
 {id:"kalau",   rx:/\b(kalau|jika)\b/i,           p:"kalau 〜",        ja:"もし〜なら",           note:"条件。会話では kalau が圧倒的です。"},
 {id:"supaya",  rx:/\b(supaya|agar|biar)\b/i,     p:"supaya 〜",       ja:"〜するように",         note:"目的。口語では biar。"},
 {id:"karena",  rx:/\b(karena|sebab)\b/i,         p:"karena 〜",       ja:"〜なので",             note:"理由。遅刻の説明で毎日使います。"},
 {id:"tapi",    rx:/\b(tapi|tetapi|namun)\b/i,    p:"tapi 〜",         ja:"でも〜",               note:"逆接。書き言葉は tetapi / namum ではなく namun。"},
 {id:"dulu",    rx:/\bdulu\b/i,                   p:"〜 dulu",         ja:"まず〜して",           note:"順番を示す。Tunggu dulu.（ちょっと待って）"},
 {id:"saja",    rx:/\b(saja|aja)\b/i,             p:"〜 saja",         ja:"〜だけ・〜でいい",     note:"限定・遠慮。口語は aja。"},
 {id:"lagi",    rx:/\blagi\b\s*[.!?]|\blagi\b$/i,p:"〜 lagi",         ja:"もう一度・また",       note:"文末の lagi は「また」。sekali lagi で「もう一度」。"},
 {id:"sekali",  rx:/\b(sekali|banget)\b/i,        p:"〜 sekali",       ja:"とても〜",             note:"強調は形容詞の後ろ。口語は banget。"},
 {id:"terlalu", rx:/\bterlalu\b/i,                p:"terlalu 〜",      ja:"〜すぎる",             note:"過剰。値段や辛さの交渉で使います。"},
 {id:"masih",   rx:/\bmasih\b/i,                  p:"masih 〜",        ja:"まだ〜",               note:"継続。Masih jauh?（まだ遠い？）"},
 {id:"pernah",  rx:/\bpernah\b/i,                 p:"pernah 〜",       ja:"〜したことがある",     note:"経験。belum pernah で「まだない」。"},
 {id:"akan",    rx:/\bakan\b/i,                   p:"akan 〜",         ja:"〜する予定",           note:"未来。会話では省くことも多い。"},
 {id:"ada",     rx:/\bada\b/i,                    p:"ada 〜",          ja:"〜がある／いる",       note:"存在。Ada …?（〜ありますか）は買い物の基本。"},
 {id:"berapa",  rx:/\bberapa\b/i,                 p:"berapa 〜?",      ja:"いくつ・いくら",       note:"数と値段。Berapa harganya? は最頻出。"},
 {id:"dimana",  rx:/\b(di mana|ke mana)\b/i,      p:"di mana?",        ja:"どこ",                 note:"場所。ke mana は「どこへ」。"},
 {id:"kapan",   rx:/\bkapan\b/i,                  p:"kapan?",          ja:"いつ",                 note:"時。Kapan berangkat?（いつ出発？）"},
 {id:"gimana",  rx:/\b(bagaimana|gimana)\b/i,     p:"bagaimana?",      ja:"どう",                 note:"方法・様子。口語は gimana。"},
 {id:"kena",    rx:/\bkena\b/i,                   p:"kena 〜",         ja:"〜を食らう・当たる",   note:"受け身的な口語。kena tilang（切符を切られる）。"},
 {id:"bikin",   rx:/\b(bikin|membuat)\b/i,        p:"bikin 〜",        ja:"〜させる・作る",       note:"使役の口語。bikin capek（疲れさせる）。"},
 {id:"pakai",   rx:/\b(pakai|pake)\b/i,           p:"pakai 〜",        ja:"〜入りで・〜を使って", note:"注文で頻出。pakai es（氷入りで）。"},
 {id:"nya",     rx:/\w{3,}nya\b/i,                p:"〜nya",           ja:"その〜",               note:"既出のものを指す。Harganya berapa?（その値段は？）"}
];
var _patIdx=null;
function patIndex(){if(_patIdx)return _patIdx;
  _patIdx={};PATTERNS.forEach(function(p){_patIdx[p.id]=[];});
  (CARDS||[]).forEach(function(c){if(!c.ex)return;
    PATTERNS.forEach(function(p){if(p.rx.test(c.ex[0]))_patIdx[p.id].push(c);});});
  return _patIdx;}
function patsOf(c){if(!c||!c.ex)return [];
  return PATTERNS.filter(function(p){return p.rx.test(c.ex[0]);});}
function patMain(c){var ps=patsOf(c);if(!ps.length)return null;
  var idx=patIndex();
  /* 汎用すぎる型は後回しにして、学びがいのある型を優先 */
  ps.sort(function(a,b){return idx[a.id].length-idx[b.id].length;});
  return ps[0];}
function patChip(c){var p=patMain(c);if(!p)return "";
  var n=patIndex()[p.id].length;
  return '<button class="patchip" data-pat="'+p.id+'" aria-label="この言い回しの例文をまとめて見る">'
    +'<span class="patp">'+esc(p.p)+'</span><span class="patja">'+esc(p.ja)+'</span>'
    +'<span class="patn">'+n+'例</span></button>';}
function buildPat(){var el=$("l-pat");if(!el)return;
  var idx=patIndex();
  var list=PATTERNS.slice().sort(function(a,b){return idx[b.id].length-idx[a.id].length;})
    .filter(function(p){return idx[p.id].length>0;});
  el.innerHTML='<div class="packintro">例文のなかで何度も出てくる「型」です。同じ型に何度も出会うほど、言い方が身につきます。</div>'
   +list.map(function(p){var cs=idx[p.id];
     return '<div class="patcard" data-patcard="'+p.id+'">'
      +'<div class="pathead"><div><div class="patp2">'+esc(p.p)+'</div><div class="patja2">'+esc(p.ja)+'</div></div>'
      +'<div class="patcount">'+cs.length+'<span>例文</span></div></div>'
      +'<div class="patnote">'+esc(p.note)+'</div>'
      +'<div class="patex" id="patex-'+p.id+'">'+cs.slice(0,3).map(patLine).join("")+'</div>'
      +(cs.length>3?'<button class="patmore" data-more="'+p.id+'">ほかの '+(cs.length-3)+' 例も見る</button>':'')
      +'</div>';}).join("");
  el.querySelectorAll("[data-more]").forEach(function(b){b.onclick=function(){
    var id=b.dataset.more,cs=patIndex()[id];
    $("patex-"+id).innerHTML=cs.map(patLine).join("");b.remove();};});}
function patLine(c){
  return '<div class="patln">'+spkBtn(c.ex[2]||c.audio||"",c.ex[0])
    +'<div><div class="t">'+wrapWords(c.ex[0])+'</div><div class="ja">'+esc(c.ex[1])+'</div>'
    +'<div class="patw">'+esc(c.w)+'</div></div></div>';}
/* ===== Jelajah — 群島の旅 ===== */
var JC=window.JCITIES||[];
function jlj(){var d=LS("dks_jelajah",{lastDate:"",visited:[],learned:{}});
  if(!d.visited)d.visited=[];if(!d.learned)d.learned={};return d;}
function cityOf(id){for(var i=0;i<JC.length;i++)if(JC[i].id===id)return JC[i];return null;}
function jljPick(){var d=jlj(),un=JC.filter(function(c){return d.visited.indexOf(c.id)<0;});
  var pool=un.length?un:JC;
  return {city:pool[Math.random()*pool.length|0],revisit:!un.length};}
function jljPins(){var d=jlj();return d.visited.map(function(id){var c=cityOf(id);return c?'<g class="jpin"><circle cx="'+c.x+'" cy="'+c.y+'" r="7" class="jpr"/><circle cx="'+c.x+'" cy="'+c.y+'" r="3.5" class="jpd"/></g>':"";}).join("");}
function buildJelajah(){var el=$("homeJelajah");if(!el||!JC.length)return;
  var d=jlj(),today=_d(0),done=d.lastDate===today;
  el.innerHTML='<div class="jcard"><div class="jhead"><div><div class="jlbl">Jelajah</div>'
   +'<div class="jttl">'+(done?"本日の旅は終了 — 明日また":"今日はどこへ行く？")+'</div>'
   +'<div class="jhint">'+(done?"上の地図の金のピンが、訪れた街です":"上の地図をピンが跳ねて、行き先を決めます")+'</div></div>'
   +'<div class="jcount">'+d.visited.length+' / '+JC.length+'</div></div>'
   +'<button class="jgo" id="jGo" aria-label="'+(done?"前回の街をもう一度見る":"今日の行き先を決める")+'">'
   +(done?"前回の街をもう一度見る":"行き先を決める")+'</button><div id="jResult"></div></div>';
  $("jGo").onclick=function(){
    var dd=jlj();
    if(dd.lastDate===_d(0)){var last=dd.visited[dd.visited.length-1];if(last)jljCard(cityOf(last));return;}
    jljSpin();};
  if(done){var last=d.visited[d.visited.length-1];if(last)jljCard(cityOf(last),true);}}
function jljSpin(){var btn=$("jGo"),hop=$("jHop");if(!hop||btn.disabled)return;
  var _m=document.querySelector("#homeArchFull .archmap");
  if(_m&&_m.getBoundingClientRect().top<0)_m.scrollIntoView({behavior:"smooth",block:"center"});
  btn.disabled=true;$("jResult").innerHTML="";
  var target=jljPick(),n=8+(Math.random()*3|0);   /* 8〜10回 */
  var seq=[];for(var i=0;i<n-1;i++)seq.push(JC[Math.random()*JC.length|0]);
  seq.push(target.city);
  var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  hop.style.opacity="1";
  if(rm){hop.setAttribute("transform","translate("+target.city.x+","+target.city.y+")");
    jljLand(target,btn);return;}
  var t=0;
  seq.forEach(function(c,i){
    t+=180+i*i*14;                                /* 間隔を漸増させて減速 */
    setTimeout(function(){
      hop.setAttribute("transform","translate("+c.x+","+c.y+")");
      hop.classList.remove("bounce");void hop.offsetWidth;hop.classList.add("bounce");
      if(navigator.vibrate&&i===seq.length-1)try{navigator.vibrate(18);}catch(e){}
    },t);});
  setTimeout(function(){jljLand(target,btn);},t+520);}
/* 地図上の一点で火花を散らす（既存の演出クラスを流用） */
function sparkAt(cx,cy,n){
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  var g=document.createElement("div");g.className="cel-glow";g.style.left=cx+"px";g.style.top=cy+"px";
  document.body.appendChild(g);setTimeout(function(){g.remove();},750);
  var r=document.createElement("div");r.className="cel-ring";r.style.left=cx+"px";r.style.top=cy+"px";
  document.body.appendChild(r);setTimeout(function(){r.remove();},850);
  for(var i=0;i<(n||18);i++){var s=document.createElement("div");s.className="spark";
    var gold=Math.random()<0.75;s.style.background=gold?"var(--gold)":"var(--hl)";
    if(gold)s.style.boxShadow="0 0 6px rgba(233,201,106,.9)";
    var sz=2.5+Math.random()*3.5;s.style.width=s.style.height=sz+"px";
    var ang=Math.random()*Math.PI*2,dist=28+Math.random()*54;
    s.style.left=cx+"px";s.style.top=cy+"px";
    s.style.setProperty("--dx",(Math.cos(ang)*dist).toFixed(1)+"px");
    s.style.setProperty("--dy",(Math.sin(ang)*dist).toFixed(1)+"px");
    s.style.animationDelay=(Math.random()*.07).toFixed(3)+"s";
    document.body.appendChild(s);setTimeout(function(e){return function(){e.remove();};}(s),1000);}}
/* 選ばれた街に紅白の国旗を突き立てる */
function jljFlag(c){
  var svg=document.querySelector("#homeArchFull .archmap");if(!svg)return;
  var old=svg.querySelector(".jflag");if(old)old.remove();
  var g=document.createElementNS("http://www.w3.org/2000/svg","g");
  g.setAttribute("class","jflag");g.setAttribute("transform","translate("+c.x+","+c.y+")");
  g.innerHTML='<line class="jfpole" x1="0" y1="0" x2="0" y2="-17"/>'
   +'<path class="jfcloth jfr" d="M0.7 -17 L13 -14.4 L13 -11.4 L0.7 -14"/>'
   +'<path class="jfcloth jfw" d="M0.7 -14 L13 -11.4 L13 -8.4 L0.7 -11"/>'
   +'<circle class="jfbase" cx="0" cy="0" r="2.6"/>'
   +'<text class="jfname" x="0" y="9">'+esc(c.nameId||c.name)+'</text>';
  svg.appendChild(g);
  requestAnimationFrame(function(){g.classList.add("on");});
  /* 画面座標に変換して、その一点で火花 */
  try{var pt=svg.createSVGPoint();pt.x=c.x;pt.y=c.y;
    var m=svg.getScreenCTM();if(m){var p=pt.matrixTransform(m);sparkAt(p.x,p.y,20);}}catch(e){}
  if(navigator.vibrate)try{navigator.vibrate([12,26,12]);}catch(e){}}
/* 当たりの瞬間: 地図の上に街の名前を一閃 */
function jljReveal(c){
  var host=$("homeArchFull");if(!host)return;
  var old=host.querySelector(".jreveal");if(old)old.remove();
  var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  var el=document.createElement("div");el.className="jreveal";
  el.innerHTML='<div class="jrv-flash"></div>'
   +'<div class="jrv-rays"></div>'
   +'<div class="jrv-box"><div class="jrv-rule"></div>'
   +'<div class="jrv-name">'+esc(c.nameId||c.name)+'</div>'
   +'<div class="jrv-kana">'+esc(c.name)+'</div>'
   +'<div class="jrv-sub">'+esc(c.regionId||"")+' ・ '+esc(c.region)+'</div><div class="jrv-rule"></div></div>';
  host.appendChild(el);
  requestAnimationFrame(function(){el.classList.add("on");});
  setTimeout(function(){el.classList.add("out");setTimeout(function(){el.remove();},420);},rm?1800:2800);}
function jljLand(target,btn){
  var d=jlj();d.lastDate=_d(0);
  if(d.visited.indexOf(target.city.id)<0)d.visited.push(target.city.id);
  SV("dks_jelajah",d);
  var hop=$("jHop");if(hop)hop.style.opacity="0";
  jljFlag(target.city);
  jljReveal(target.city);
  setTimeout(function(){jljCard(target.city,false,target.revisit);},1250);
  btn.disabled=false;btn.textContent="前回の街をもう一度見る";
  var af=$("homeArchFull");if(af){var _c=target.city;setTimeout(function(){af.innerHTML="";renderArch(af);jljFlag(_c);},3600);}
  if(d.visited.length===JC.length&&!LS("dks_jelajah_done",0)){SV("dks_jelajah_done",1);
    setTimeout(function(){titleCelebrate({name:"Penjelajah Nusantara",ja:"32の街をすべて訪ねた人"});},700);}
  else if(typeof bumpActivity==="function")bumpActivity();}
function jljCard(c,quiet,revisit){if(!c)return;
  var d=jlj(),learned=!!d.learned[c.id];
  $("jResult").innerHTML='<div class="jcity">'
   +'<div class="jcname"><svg class="jcflag" viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="0" width="18" height="6" fill="#ce1126"/><rect x="0" y="6" width="18" height="6" fill="#fff"/><rect x="0" y="0" width="18" height="12" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="0.6"/></svg>'
   +esc(c.nameId||c.name)+'<span class="jckana">'+esc(c.name)+'</span>'+(revisit?'<span class="jre">再訪</span>':'')
   +(learned?'<span class="jlearned">学習済</span>':'')+'</div>'
   +'<div class="jregion">'+esc(c.regionId||"")+' ・ '+esc(c.region)+'</div>'
   +'<div class="jsec"><div class="jslbl">挨拶</div><div class="jgreet">'+spkBtn("",c.greet.id)
   +'<div><b>'+esc(c.greet.id)+'</b><span class="jkana">'+esc(c.greet.kana)+'</span></div></div>'
   +'<div class="jnote">'+esc(c.greet.note)+'</div></div>'
   +'<div class="jsec"><div class="jslbl">名物</div><div class="jfood">'+spkBtn("",c.food.name)+'<b>'+esc(c.food.name)+'</b></div>'
   +'<div class="jnote">'+esc(c.food.note)+'</div></div>'
   +'<div class="jsec"><div class="jslbl">ことば</div><div class="jword">'+spkBtn("",c.word.id)+'<b>'+esc(c.word.id)+'</b><span>'+esc(c.word.ja)+'</span></div></div>'
   +'<div class="jsec"><div class="jslbl">この街</div><div class="jfact">'+esc(c.fact)+'</div></div>'
   +'<button class="jlearn'+(learned?" done":"")+'" id="jLearn" data-city="'+c.id+'"'+(learned?" disabled":"")+' aria-label="この街の言葉を学ぶ">'
   +(learned?"学習リストに追加済み":"この街の言葉を学ぶ（+"+c.pack.length+"語）")+'</button></div>';
  var b=$("jLearn");if(b)b.onclick=function(){jljLearn(c);};}
function jljLearn(c){var d=jlj();if(d.learned[c.id])return;
  d.learned[c.id]=true;SV("dks_jelajah",d);
  applyJCity(c);
  var b=$("jLearn");if(b){b.textContent="学習リストに追加済み";b.classList.add("done");b.disabled=true;}
  var n=$("jResult").querySelector(".jcname");
  if(n&&!n.querySelector(".jlearned"))n.insertAdjacentHTML("beforeend",'<span class="jlearned">学習済</span>');
  celebrate("◆ "+(c.nameId||c.name)+"（"+c.name+"）の言葉 "+c.pack.length+"語を追加しました");}
function applyJCity(c){if(!window.CARDS)return 0;
  var have={};window.CARDS.forEach(function(x){have[x.w.toLowerCase()]=1;});var n=0;
  c.pack.forEach(function(w){var k=w.word.toLowerCase();if(have[k])return;have[k]=1;n++;
    window.CARDS.push({w:w.word,ja:w.meaning,audio:"",lv:2,src:["旅"],ex:[w.ex[0][0],w.ex[0][1],""],city:c.id});});
  if(n)CARDS=window.CARDS;return n;}
function applyJelajah(){var d=jlj(),n=0;JC.forEach(function(c){if(d.learned[c.id])n+=applyJCity(c);});return n;}
/* ===== Kata Hari Ini（今日の一言） ===== */
function _hash(n){n=(n^61)^(n>>>16);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return n>>>0;}
function kataPick(){if(!CARDS.length)return null;
  var seed=todayNum(),st=LS("dks_status",{});
  var fresh=CARDS.filter(function(c){return c.ja&&!st[c.w];});
  if(fresh.length)return {c:fresh[_hash(seed)%fresh.length],mode:"new"};
  var tn=todayNum(),due=CARDS.filter(function(c){return c.ja&&srs[c.w]&&srs[c.w].due<=tn;});
  if(due.length)return {c:due[_hash(seed)%due.length],mode:"due"};
  return {c:CARDS[_hash(seed)%CARDS.length],mode:"review"};}
function buildKata(){var el=$("homeKata");if(!el)return;
  var p=kataPick();if(!p){el.innerHTML="";return;}
  var c=p.c,st=LS("dks_status",{}),known=st[c.w]==="known";
  var lbl=p.mode==="new"?"Kata Hari Ini ・ 今日の一言":(p.mode==="due"?"Kata Hari Ini ・ 今日の復習":"Kata Hari Ini");
  var ex=(c.ex&&c.ex[0])?'<div class="kex"><div class="id">'+spkBtn(c.ex[2]||"",c.ex[0])+'<span class="t">'+wrapWords(c.ex[0])+'</span></div><div class="ja">'+esc(c.ex[1])+'</div></div>':"";
  el.innerHTML='<div class="katacard"><div class="klbl">'+lbl+'</div>'
    +'<div class="khead">'+spkBtn(c.audio||"",c.w)+'<span class="kword">'+esc(c.w)+'</span></div>'
    +'<div class="kja">'+esc(c.ja)+'</div>'+ex
    +'<button class="kbtn'+(known?" done":"")+'" id="kataKnown"'+(known?" disabled":"")+' aria-label="この語を覚えたに追加">'+(known?"覚えた ✓":"覚えたに追加")+'</button></div>';
  var b=$("kataKnown");if(b)b.onclick=function(){srsUpdate(c.w,"known");b.textContent="覚えた ✓";b.classList.add("done");b.disabled=true;
    if(typeof bumpActivity==="function")bumpActivity();
    var af=$("homeArchFull");if(af){af.innerHTML="";renderArch(af);}};}
/* ===== 称号 ===== */
const TITLES=[
 {n:50,id:"pemula",name:"Pemula",ja:"はじまりの人"},
 {n:150,id:"penjelajah",name:"Penjelajah",ja:"島を渡る人"},
 {n:300,id:"pelaut",name:"Pelaut",ja:"海をゆく人"},
 {n:500,id:"nakhoda",name:"Nakhoda",ja:"船を率いる人"},
 {n:880,id:"nusantarawan",name:"Nusantarawan",ja:"群島を識る人"}
];
function knownCount(){return Object.values(LS("dks_status",{})).filter(function(v){return v==="known";}).length;}
function titleOf(k){var t=null;TITLES.forEach(function(x){if(k>=x.n)t=x;});return t;}
function nextTitle(k){for(var i=0;i<TITLES.length;i++)if(k<TITLES[i].n)return TITLES[i];return null;}
function checkTitle(){var k=knownCount(),t=titleOf(k);if(!t)return;
  if(LS("dks_title","")===t.id)return;
  var first=!LS("dks_title","");SV("dks_title",t.id);
  setTimeout(function(){titleCelebrate(t);},first&&k>=t.n?400:1200);}
function titleCelebrate(t){
  const rm=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  if(!rm){const cx=window.innerWidth/2,cy=Math.min(window.innerHeight*0.32,260);
    for(let i=0;i<40;i++){const f=document.createElement("div");f.className="foil"+(Math.random()<0.16?" red":"");
      f.style.left=(4+Math.random()*92)+"vw";f.style.setProperty("--fx",(Math.random()*80-40).toFixed(0)+"px");
      f.style.setProperty("--fr",(Math.random()*300-150).toFixed(0)+"deg");
      f.style.animationDelay=(Math.random()*.7).toFixed(2)+"s";
      f.style.animationDuration=(1.5+Math.random()*1.2).toFixed(2)+"s";
      document.body.appendChild(f);setTimeout(function(){f.remove();},3600);}
    const g=document.createElement("div");g.className="cel-glow";g.style.left=cx+"px";g.style.top=cy+"px";
    document.body.appendChild(g);setTimeout(function(){g.remove();},750);}
  const w=document.createElement("div");w.className="titlewrap";
  w.innerHTML='<div class="titlebox"><div class="tlbl">称号を授かりました</div><div class="tname">'+esc(t.name)+'</div><div class="tja">'+esc(t.ja)+'</div></div>';
  document.body.appendChild(w);requestAnimationFrame(function(){w.classList.add("on");});
  setTimeout(function(){w.classList.remove("on");setTimeout(function(){w.remove();},400);},2000);
  if(navigator.vibrate)try{navigator.vibrate([20,40,20,40,40]);}catch(e){}}
/* ===== 島＝語彙パック ===== */
var IPACKS=window.ISLANDPACKS||[];
function packOf(id){for(var i=0;i<IPACKS.length;i++)if(IPACKS[i].id===id)return IPACKS[i];return null;}
function packsOpen(){return LS("dks_packs",[]);}
function packOpen(id){return packsOpen().indexOf(id)>=0;}
function applyPacks(){if(!IPACKS.length||!window.CARDS)return;
  var have={};window.CARDS.forEach(function(c){have[c.w.toLowerCase()]=1;});
  var open=packsOpen(),added=0;
  IPACKS.forEach(function(p){if(open.indexOf(p.id)<0)return;
    p.words.forEach(function(w){var k=w.word.toLowerCase();if(have[k])return;have[k]=1;added++;
      window.CARDS.push({w:w.word,ja:w.meaning,audio:w.audio||"",lv:2,src:["島パック"],
        ex:[w.ex[0][0],w.ex[0][1],""],pack:p.id});});});
  if(added)CARDS=window.CARDS;
  return added;}
function unlockPack(id){var o=packsOpen();if(o.indexOf(id)>=0)return false;
  o.push(id);SV("dks_packs",o);
  if(window.CARDS)applyPacks();
  var p=packOf(id);
  if(p&&typeof celebrate==="function")celebrate("◆ "+p.island+"語彙パック解放 — "+p.theme+"の"+p.words.length+"語");
  if(typeof buildIslandPacks==="function"&&$("l-packs"))buildIslandPacks(true);
  return true;}
let _archDots=null,_archLit=null,_archLabelY={};
function _archBuild(){if(_archDots)return _archDots;var dots=ARCHPTS.map(function(p){return {x:p[0],y:p[1],ci:p[2]};});var order=dots.map(function(d,i){return i;}).sort(function(a,b){return dots[a].x-dots[b].x;});order.forEach(function(idx,rank){dots[idx].rank=rank;});var my={};dots.forEach(function(d){if(my[d.ci]==null||d.y>my[d.ci])my[d.ci]=d.y;});_archLabelY=my;_archDots=dots;return dots;}
function gotoGeoIndex(gi){openTarget("reads:r-geo");
  ensureExtra(function(){buildGeo();
    setTimeout(function(){var t=$("geoTrack");if(!t)return;var pos=0;
      for(var i=0;i<GEOORD.length;i++){if(GEOORD[i]===gi){pos=i;break;}}
      t.scrollTo({left:t.clientWidth*pos});if(typeof geoNav==="function")geoNav(pos);},160);});}
function gotoGeoRegion(region){openTarget("reads:r-geo");
  ensureExtra(function(){buildGeo();
    setTimeout(function(){var t=$("geoTrack");if(!t)return;var pos=0;
      for(var i=0;i<GEOORD.length;i++){var g=GEO[GEOORD[i]];if(g&&g.region===region){pos=i;break;}}
      t.scrollTo({left:t.clientWidth*pos});if(typeof geoNav==="function")geoNav(pos);},160);});}
(function(){document.addEventListener("click",function(e){
  var svg=e.target.closest(".archmap");if(!svg)return;
  try{
    var r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;
    var sc=Math.min(r.width/vb.width,r.height/vb.height);
    var ox=(r.width-vb.width*sc)/2,oy=(r.height-vb.height*sc)/2;
    var x=(e.clientX-r.left-ox)/sc,y=(e.clientY-r.top-oy)/sc;
    var gi=-1,gd=1e9;
    for(var k=0;k<GEOPT.length;k++){if(!GEOPT[k])continue;   /* 名所は対象外・州のみ */
      var dx=x-GEOPT[k][0],dy=y-GEOPT[k][1],d=dx*dx+dy*dy;
      if(d<gd){gd=d;gi=k;}}
    if(gi>=0&&gd<1600){gotoGeoIndex(gi);return;}   /* 40px以内 ≒ 実距離 約3.2度 */
    var best=null,bd=1e9;
    ARCH_CLUSTERS.forEach(function(c){var d=(x-c.cx)*(x-c.cx)+(y-c.cy)*(y-c.cy);if(d<bd){bd=d;best=c;}});
    if(best&&bd<9500&&best.region)gotoGeoRegion(best.region);
  }catch(_){}
});})();
function renderArch(el){const dots=_archBuild(),total=dots.length;
  const known=Object.values(LS("dks_status",{})).filter(v=>v==="known").length;
  const lit=Math.min(total,Math.min(total,known)),pct=Math.round(lit/total*100);
  const seen=LS("dks_arch_seen",0);
  const firstRender=(_archLit==null),prev=firstRender?Math.min(seen,lit):_archLit;
  const maxRank={};dots.forEach(d=>{if(maxRank[d.ci]==null||d.rank>maxRank[d.ci])maxRank[d.ci]=d.rank;});
  const complete=ci=>maxRank[ci]<lit;
  const circ=dots.map(d=>{const on=d.rank<lit,isNew=on&&d.rank>=prev;return '<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+'" r="1.7" class="ad'+(on?" on":"")+(isNew?" new":"")+'"/>';}).join("");
  var thX=-1;dots.forEach(function(d){if(d.rank===lit-1)thX=d.x;});
  const cities=CITIES.map(function(c){return '<circle cx="'+c[0]+'" cy="'+c[1]+'" r="4" class="citymk'+(lit>0&&c[0]<=thX?" on":"")+'"/>';}).join("");
  const labels=ARCH_CLUSTERS.map((c,ci)=>'<text x="'+c.cx+'" y="'+((_archLabelY[ci]||c.cy)+12).toFixed(0)+'" text-anchor="middle" class="alabel'+(complete(ci)?" done":"")+'">'+c.name+'</text>').join("");
  let footer;const inc=ARCH_CLUSTERS.map((c,ci)=>ci).filter(ci=>!complete(ci));
  if(inc.length===0){footer='\u5168\u7fa4\u5cf6\u70b9\u706f\uff01 <b>Nusantara</b> \u306f\u3042\u306a\u305f\u306e\u3082\u306e';}
  else{let best=inc[0],rem=1e9;inc.forEach(ci=>{const r=(maxRank[ci]+1)-known;if(r<rem){rem=r;best=ci;}});
    footer='\u6b21\u306e\u5cf6 <b>'+ARCH_CLUSTERS[best].name+'</b> \u5168\u70b9\u706f\u307e\u3067 \u3042\u3068 <b>'+Math.max(0,rem)+'</b> \u8a9e';}
  const _t=titleOf(known);
  el.insertAdjacentHTML("beforeend",'<div class="archcard"><div class="archtop"><h4>\u7fa4\u5cf6\u30d7\u30ed\u30b0\u30ec\u30b9</h4><button class="archshare" id="archShare" aria-label="\u7fa4\u5cf6\u30ab\u30fc\u30c9\u3092\u5171\u6709"><svg class="icn"><use href="#i-share"/></svg></button></div>'+(_t?'<div class="archtitle">'+esc(_t.name)+'<span>'+esc(_t.ja)+'</span></div>':'')+'<div class="archhead"><b>'+known+'</b>\u8a9e \u30fb '+pct+'% \u70b9\u706f</div><svg class="archmap" viewBox="0 0 568 226" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+circ+cities+labels+jljPins()+'<g id="jHop" class="jhop" style="opacity:0"><circle r="8" class="jhr"/><circle r="4" class="jhd"/></g></svg><div class="archfoot">'+footer+'</div><div class="archtap">地図をタップすると、その場所の州・名所が開きます</div></div>');
  const arch=LS("dks_arch",[]);let changed=false;
  ARCH_CLUSTERS.forEach((c,ci)=>{if(complete(ci)&&arch.indexOf(c.id)<0){arch.push(c.id);changed=true;
    if(!firstRender)setTimeout(()=>celebrate("\u25c6 "+c.name+" \u5168\u5cf6\u70b9\u706f \u2014 Selamat!"),200+ci*450);
    setTimeout(function(){unlockPack(c.id);},firstRender?0:900+ci*450);}
   else if(complete(ci)&&!packOpen(c.id)){unlockPack(c.id);}});
  if(changed)SV("dks_arch",arch);
  SV("dks_arch_seen",lit);
  var _sb=el.querySelector("#archShare");if(_sb)_sb.onclick=shareArch;
  checkTitle();
  _archLit=lit;}
let _archHomeLit=null;
function renderArchHome(){var el=$("homeArch");if(!el)return;var dots=_archBuild(),total=dots.length;
  var known=Object.values(LS("dks_status",{})).filter(function(v){return v==="known";}).length;
  var lit=Math.min(total,Math.min(total,known));
  var prev=(_archHomeLit==null)?lit:_archHomeLit;
  var maxRank={};dots.forEach(function(d){if(maxRank[d.ci]==null||d.rank>maxRank[d.ci])maxRank[d.ci]=d.rank;});
  var complete=function(ci){return maxRank[ci]<lit;};
  var circ=dots.map(function(d){var on=d.rank<lit,isNew=on&&d.rank>=prev;return '<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+'" r="1.7" class="ad'+(on?" on":"")+(isNew?" new":"")+'"/>';}).join("");
  var inc=ARCH_CLUSTERS.map(function(c,ci){return ci;}).filter(function(ci){return !complete(ci);});
  var foot;
  if(inc.length===0){foot='\u5168\u7fa4\u5cf6\u70b9\u706f\uff01 <b>Nusantara</b> \u306f\u3042\u306a\u305f\u306e\u3082\u306e';}
  else{var best=inc[0],rem=1e9;inc.forEach(function(ci){var r=(maxRank[ci]+1)-known;if(r<rem){rem=r;best=ci;}});
    foot='\u6b21\u306e\u5cf6 <b>'+ARCH_CLUSTERS[best].name+'</b> \u307e\u3067 \u3042\u3068 <b>'+Math.max(0,rem)+'</b> \u8a9e';}
  el.innerHTML='<div class="archhome" data-goto="practice:p-stats"><div class="ahhd"><span class="aht">Nusantara \u2014 \u3042\u306a\u305f\u306e\u7fa4\u5cf6</span><span class="ahc"><b>'+known+'</b>\u8a9e</span></div><svg class="archmap" viewBox="0 0 568 213" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+circ+'</svg><div class="ahft">'+foot+'</div></div>';
  _archHomeLit=lit;}
function buildStats(){const el=$("statsWrap");if(!el)return;const tn=todayNum();const total=CARDS.length;let known=0,weak=0,due=0;const lv={1:[0,0],2:[0,0],3:[0,0]};
  CARDS.forEach(c=>{const s=status[c.w];if(s==="known")known++;if(s==="weak")weak++;if(srs[c.w]&&srs[c.w].due<=tn)due++;const L=lv[c.lv];if(L){L[1]++;if(s==="known")L[0]++;}});
  const t=_d(0);const today=(ACT.date===t)?(ACT.today||0):0;const g=ACT.goal||10;const streak=(ACT.ci===t||ACT.ci===_d(1))?(ACT.streak||0):0;
  const bar=(x,y)=>`<div class="dbar"><span style="width:${y?Math.round(x/y*100):0}%"></span></div>`;
  const lvrow=(nm,i)=>`<div class="dashrow"><span class="dlab">${nm}</span>${bar(lv[i][0],lv[i][1])}<span class="dval">${lv[i][0]} / ${lv[i][1]}</span></div>`;
  el.innerHTML=`<div class="dashcard"><div class="dashbig"><div class="dstat"><b>${known}</b><span>覚えた</span></div><div class="dstat"><b>${due}</b><span>復習待ち</span></div><div class="dstat"><b>🔥${streak}</b><span>連続</span></div></div></div>
  <div class="dashcard"><h4>単語の習得 ${known} / ${total}</h4><div class="dashrow"><span class="dlab">全体</span>${bar(known,total)}<span class="dval">${total?Math.round(known/total*100):0}%</span></div>${lvrow("初級",1)}${lvrow("中級",2)}${lvrow("上級",3)}</div>
  <div class="dashcard"><h4>今日の学習</h4><div class="dashrow"><span class="dlab">目標</span>${bar(today,g)}<span class="dval">${today} / ${g}</span></div><div style="font-size:12.5px;color:var(--sub);margin-top:8px">苦手マーク ${weak}枚 ・ ${due>0?("復習が"+due+"枚たまっています → カードの「復習」で消化"):"復習待ちはありません 🎉"}</div></div>`;
  var _hm=ACT.hist||{},_cells="";for(var k=90;k>=0;k--){var ds=_d(k),cc=_hm[ds]||0,col=(!cc?"var(--line2)":cc<3?"rgba(201,155,52,.5)":cc<6?"rgba(201,155,52,.9)":"var(--hl)");_cells+='<div class="hmcell" title="'+ds+'\uff1a'+cc+'\u56de" style="background:'+col+'"></div>';}
  var _bd=[["\ud83d\udd25","7\u65e5\u9023\u7d9a",streak>=7],["\u26a1","30\u65e5\u9023\u7d9a",streak>=30],["\ud83d\udcda","50\u8a9e",known>=50],["\ud83c\udfc6","100\u8a9e",known>=100],["\ud83d\udcaf","200\u8a9e",known>=200],["\ud83c\udfaf","\u5fa9\u7fd2\u30bc\u30ed",due===0&&known>0],["\ud83c\udf05","\u521d\u6765\u5e97",!!ACT.ci],["\ud83d\uddfa\ufe0f","\u4e0a\u7d1a10",lv[3][0]>=10]];
  el.insertAdjacentHTML("beforeend",'<div class="dashcard"><h4>\u7d99\u7d9a\u306e\u8a18\u9332\uff08\u76f4\u8fd113\u9031\uff09</h4><div class="heatmap">'+_cells+'</div></div><div class="dashcard"><h4>\u5b9f\u7e3e\u30d0\u30c3\u30b8</h4><div class="badges">'+_bd.map(function(b){return '<div class="bdg '+(b[2]?"got":"")+'"><span class="be">'+b[0]+'</span><span class="bn">'+b[1]+'</span></div>';}).join("")+'</div></div>');
  var _qm={mean:"意味4択",listen:"聞き取り",arrange:"並べ替え",type:"書き取り",number:"数字",fill:"穴埋め"},_qr="";Object.keys(_qm).forEach(function(k){var s=quizStats[k];if(s&&s.t){var pct=Math.round(s.c/s.t*100);_qr+='<div class="dashrow"><span class="dlab" style="min-width:66px">'+_qm[k]+'</span><div class="dbar"><span style="width:'+pct+'%"></span></div><span class="dval">'+pct+'% ('+s.c+'/'+s.t+')</span></div>';}});
  if(_qr)el.insertAdjacentHTML("beforeend",'<div class="dashcard"><h4>クイズ正答率</h4>'+_qr+'</div>');
  var _WD=["日","月","火","水","木","金","土"],_wk="",_wt=0;
  for(var wi=6;wi>=0;wi--){var _ds=_d(wi),_c=(ACT.hist||{})[_ds]||0;_wt+=_c;var _h=_c?Math.max(10,Math.min(100,_c*12)):3;
    _wk+='<div class="wkbar" title="'+_ds+'：'+_c+'回"><span class="wkn">'+(_c||"")+'</span><div class="wkcol"><div class="wkfill" style="height:'+_h+'%"></div></div><span class="wkd">'+_WD[new Date(_ds+"T00:00:00").getDay()]+'</span></div>';}
  el.insertAdjacentHTML("beforeend",'<div class="dashcard"><h4>今週の学習（合計 '+_wt+' 回）</h4><div class="wkchart">'+_wk+'</div></div>');
  var _P=LS("dks_pron",{}),_pk=Object.keys(_P);
  if(_pk.length){var _sum=0;_pk.forEach(function(k){_sum+=(_P[k].best||0);});var _avg=Math.round(_sum/_pk.length);
    var _wkst=_pk.slice().sort(function(x,y){return (_P[x].best||0)-(_P[y].best||0);}).slice(0,3);
    var _pr='<div class="dashbig"><div class="dstat"><b>'+_avg+'%</b><span>平均スコア</span></div><div class="dstat"><b>'+_pk.length+'</b><span>練習した語</span></div></div>';
    if(_wkst.length)_pr+='<div style="font-size:12.5px;color:var(--sub);margin-top:8px">苦手な発音：'+_wkst.map(function(k){return esc(k)+'（'+(_P[k].best||0)+'%）';}).join(' ・ ')+'</div>';
    el.insertAdjacentHTML("beforeend",'<div class="dashcard"><h4>発音チェック</h4>'+_pr+'</div>');}
  var _jv=jlj().visited.length,_jt=(window.JCITIES||[]).length;
  if(_jt){var _jp=Math.round(_jv/_jt*100);
    el.insertAdjacentHTML("beforeend",'<div class="dashcard"><h4>訪れた街</h4>'
      +'<div class="dashbig"><div class="dstat"><b>'+_jv+' / '+_jt+'</b><span>Jelajah</span></div></div>'
      +'<div class="jbar"><span style="width:'+_jp+'%"></span></div>'
      +'<div class="jbarl">'+(_jv===_jt?"32の街をすべて訪ねました — <b>Penjelajah Nusantara</b>":"残り <b>"+(_jt-_jv)+"</b> の街")+'</div></div>');}
  var _tk=knownCount(),_tc=titleOf(_tk),_tn=nextTitle(_tk);
  var _road='<div class="troad">'+TITLES.map(function(t){
    var got=_tk>=t.n,cur=_tc&&_tc.id===t.id;
    return '<div class="tstep'+(got?" got":"")+(cur?" cur":"")+'"><div class="tdot"></div><div class="tinfo"><b>'+esc(t.name)+'</b><span>'+esc(t.ja)+' ・ '+t.n+'語</span></div></div>';}).join("")+'</div>';
  _road+='<div class="tnext">'+(_tn?('次の称号 <b>'+esc(_tn.name)+'</b> まで あと <b>'+(_tn.n-_tk)+'</b> 語'):'すべての称号を授かりました。Nusantara はあなたのもの。')+'</div>';
  el.insertAdjacentHTML("beforeend",'<div class="dashcard"><h4>称号の道のり</h4>'+_road+'</div>');
  var _af=$("homeArchFull");if(_af){_af.innerHTML="";renderArch(_af);}
  if(typeof buildJelajah==="function")buildJelajah();
  if(typeof buildKata==="function")buildKata();}

/* ===== 群島シェアカード ===== */
function _cssv(n,f){try{var v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return v||f;}catch(e){return f;}}
function shareArch(){
  const W=1080,H=1350,cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const g=cv.getContext("2d");
  /* 紅白構図はスプラッシュと同じ。ライト/ダークに関わらず固定色（旗の紅白） */
  const RED="#c1272d",RED2="#8f151d",WHITE="#ffffff",GOLD="#e9c96a",GOLD2="#d8ac4e",INK="#2b2422",SUB="#8a7f76";
  const BAND=Math.round(H*0.46);
  const grd=g.createRadialGradient(W/2,BAND*0.55,60,W/2,BAND*0.55,W*0.95);
  grd.addColorStop(0,"#d02a31");grd.addColorStop(.55,RED);grd.addColorStop(1,RED2);
  g.fillStyle=grd;g.fillRect(0,0,W,BAND);
  g.fillStyle=WHITE;g.fillRect(0,BAND,W,H-BAND);
  g.fillStyle=GOLD;g.fillRect(0,BAND-3,W,3);
  /* 紅の帯：ロゴと金の題字 */
  g.textAlign="center";
  const tg=g.createLinearGradient(0,BAND*0.34,0,BAND*0.58);
  tg.addColorStop(0,"#fff7e2");tg.addColorStop(.46,"#f7de99");tg.addColorStop(1,GOLD2);
  g.fillStyle=tg;g.font='600 116px Georgia,"Hiragino Mincho ProN",serif';
  g.fillText("Artikula",W/2,BAND*0.52);
  g.strokeStyle="rgba(255,224,140,.85)";g.lineWidth=2;
  g.beginPath();g.moveTo(W/2-70,BAND*0.60);g.lineTo(W/2+70,BAND*0.60);g.stroke();
  g.fillStyle="rgba(255,239,208,.85)";g.font='500 30px "Hiragino Kaku Gothic ProN",sans-serif';
  g.fillText("B A H A S A   I N D O N E S I A",W/2,BAND*0.70);
  /* 白の帯：群島ドットマップ */
  const dots=_archBuild(),total=dots.length,known=knownCount(),lit=Math.min(total,known);
  const maxRank={};dots.forEach(function(d){if(maxRank[d.ci]==null||d.rank>maxRank[d.ci])maxRank[d.ci]=d.rank;});
  const islands=ARCH_CLUSTERS.filter(function(c,ci){return maxRank[ci]<lit;}).length;
  const mw=W-120,mh=Math.round(mw*226/568),mx=60,my=BAND+70;
  const sx=mw/568,sy=mh/226;
  dots.forEach(function(d){const on=d.rank<lit;
    g.beginPath();g.arc(mx+d.x*sx,my+d.y*sy,on?3.2:2.4,0,Math.PI*2);
    g.fillStyle=on?GOLD2:"rgba(43,36,34,.16)";g.fill();});
  CITIES.forEach(function(c){g.beginPath();g.arc(mx+c[0]*sx,my+c[1]*sy,6,0,Math.PI*2);
    g.strokeStyle="rgba(193,39,45,.5)";g.lineWidth=2;g.stroke();});
  /* 訪れた街の金ピン */
  var _jv=jlj().visited,_jn=0;
  _jv.forEach(function(id){var c=cityOf(id);if(!c)return;_jn++;
    g.beginPath();g.arc(mx+c.x*sx,my+c.y*sy,9,0,Math.PI*2);
    g.strokeStyle="rgba(233,201,106,.75)";g.lineWidth=2.5;g.stroke();
    g.beginPath();g.arc(mx+c.x*sx,my+c.y*sy,4.5,0,Math.PI*2);g.fillStyle=GOLD2;g.fill();});
  /* 数値・称号・日付 */
  const t=titleOf(known),base=my+mh+86;
  g.fillStyle=INK;g.font='700 82px Georgia,"Hiragino Mincho ProN",serif';
  g.fillText(known+" 語 ・ "+islands+" 島点灯"+(_jn?" ・ "+_jn+" 街":""),W/2,base);
  if(t){g.fillStyle=GOLD2;g.font='600 46px Georgia,"Hiragino Mincho ProN",serif';
    g.fillText(t.name,W/2,base+72);
    g.fillStyle=SUB;g.font='400 26px "Hiragino Kaku Gothic ProN",sans-serif';
    g.fillText(t.ja,W/2,base+112);}
  var _a=LS("dks_act",{}),days=(_a.ci===_d(0)||_a.ci===_d(1))?(_a.streak||0):0;
  if(days){g.fillStyle=SUB;g.font='400 26px "Hiragino Kaku Gothic ProN",sans-serif';
    g.fillText(days+" 日連続",W/2,base+(t?156:72));}
  const d=new Date(),ds=d.getFullYear()+"."+String(d.getMonth()+1).padStart(2,"0")+"."+String(d.getDate()).padStart(2,"0");
  g.fillStyle="rgba(43,36,34,.42)";g.font='400 24px "Hiragino Kaku Gothic ProN",sans-serif';
  g.fillText(ds,W/2,H-58);
  cv.toBlob(function(b){if(!b)return;
    const file=new File([b],"artikula-nusantara.png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
      navigator.share({files:[file],title:"Artikula",text:known+"語 ・ "+islands+"島点灯"}).catch(function(){});
    }else{const u=URL.createObjectURL(b),link=document.createElement("a");
      link.href=u;link.download="artikula-nusantara.png";link.click();
      setTimeout(function(){URL.revokeObjectURL(u);},2000);
      if(typeof celebrate==="function")celebrate("画像を保存しました");}
  },"image/png");}
/* ===== クイズ ===== */
let qMode="mean",qScore=0,qTotal=0;
let quizStats=LS("dks_quizstats",{}),_pendQ=null;
function qStat(mode,ok){quizStats[mode]=quizStats[mode]||{c:0,t:0};quizStats[mode].t++;if(ok)quizStats[mode].c++;SV("dks_quizstats",quizStats);}
function buildQuiz(){$("p-quiz").innerHTML=`<div class="subtabs" id="qModes"><button data-q="mean" class="active">意味4択</button><button data-q="listen">聞き取り</button><button data-q="weak">苦手撲滅</button><button data-q="review">復習</button><button data-q="arrange">並べ替え</button><button data-q="type">書き取り</button></div><div id="qBody"></div>`;
  $("qModes").addEventListener("click",e=>{const b=e.target.closest("[data-q]");if(!b)return;[...$("qModes").children].forEach(x=>x.classList.toggle("active",x===b));qMode=b.dataset.q;qScore=0;qTotal=0;nextQ();});
  if(_pendQ){qMode=_pendQ;_pendQ=null;qScore=0;qTotal=0;[...$("qModes").children].forEach(x=>x.classList.toggle("active",x.dataset.q===qMode));}
  nextQ();
}
const rnd=a=>a[Math.random()*a.length|0];
const shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const withEx=()=>CARDS.filter(c=>c.ex);
function nextQ(){if(qMode==="arrange")return arrangeQ();if(qMode==="type")return typeQ();mcQ();}
function mcQ(){const listen=qMode==="listen",review=qMode==="review",weak=qMode==="weak";
  const full=CARDS.filter(c=>c.ja);let src=full;
  const tn=(typeof todayNum==="function")?todayNum():0;
  if(weak){const wp=full.filter(x=>status[x.w]==="weak");
    if(wp.length<5){$("qBody").innerHTML='<div class="quizbox panelcard">'+lockCard({cls:"qlock",title:"苦手撲滅",
      sil:'<svg class="icn qlockic" aria-hidden="true"><use href="#i-target"/></svg>',
      cond:'苦手が5語たまったら解放 ・ 現在 <b>'+wp.length+'</b> 語<br>カードの「✗ 苦手」やクイズの誤答でここに集まります'})+'</div>';return;}
    src=wp;}
  else if(review){const rp=full.filter(x=>status[x.w]==="weak"||(srs[x.w]&&srs[x.w].due<=tn&&status[x.w]!=="known"));if(rp.length)src=rp;}
  else if(listen){const lp=full.filter(x=>status[x.w]==="known"||(srs[x.w]&&srs[x.w].due<=tn));if(lp.length>=4)src=lp;}
  const c=rnd(src);const opts=shuf([c].concat(shuf(full.filter(x=>x.ja!==c.ja)).slice(0,3)));
  $("qBody").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">${listen?"音声を聞いて意味を選ぼう（文字は答えたら出ます）":weak?"苦手撲滅：この語の意味は？":review?"復習：この語の意味は？":"この単語の意味は？"}</div>
   <div class="qword">${listen?spkBtn(c.audio,c.w).replace('class="spk"','class="spk" style="width:52px;height:52px"'):esc(c.w)+" "+spkBtn(c.audio,c.w)}</div>
   <div class="qopts">${opts.map(o=>`<button data-ok="${o.ja===c.ja?1:0}" data-w="${esc(o.w)}" data-au="${esc(o.audio||"")}">${esc(o.ja)}</button>`).join("")}</div>
   <div class="qfb" id="qfb"></div><div class="qfoot"><span class="qscore">スコア ${qScore} / ${qTotal}</span><button class="qnext" id="qnext">次へ →</button></div></div>`;
  if(listen)setTimeout(()=>play(c.audio,c.w,null),200);
  const opt=$("qBody").querySelectorAll(".qopts button");
  opt.forEach(b=>b.addEventListener("click",()=>{if($("qBody").dataset.done)return;$("qBody").dataset.done=1;qTotal++;const ok=b.dataset.ok==="1";if(ok){qScore++;b.classList.add("correct");$("qfb").textContent=weak?"Benar! 苦手をひとつ克服 🎉":"Benar! 正解 🎉";$("qfb").style.color="#2e7d3c";if(weak&&typeof celebrate==="function"){const left=CARDS.filter(x=>status[x.w]==="weak").length;if(left===0)celebrate("🎉 苦手をすべて克服！ Hebat!");}}else{b.classList.add("wrong");opt.forEach(x=>{if(x.dataset.ok==="1")x.classList.add("correct");});$("qfb").textContent="Salah… 正解は「"+c.ja+"」";$("qfb").style.color="var(--hl)";}$("qBody").querySelector(".qscore").textContent="スコア "+qScore+" / "+qTotal;opt.forEach(x=>{x.classList.add("answered");x.insertAdjacentHTML("beforeend",'<span class="optword" data-audio="'+esc(x.dataset.au||"")+'" data-text="'+esc(x.dataset.w)+'">'+esc(x.dataset.w)+'</span>');});qStat(listen?"listen":(weak?"weak":"mean"),ok);if(typeof srsUpdate==="function")srsUpdate(c.w,ok?"known":"weak");if(typeof bumpActivity==="function")bumpActivity();if(typeof updBadge==="function")updBadge();}));
  $("qnext").onclick=()=>{$("qBody").dataset.done="";nextQ();};
}
function arrangeQ(){const pool=withEx().filter(c=>{const n=c.ex[0].split(" ").length;return n>=3&&n<=6;});const c=rnd(pool);const words=c.ex[0].replace(/[.?!,]/g,"").split(" ");const jum=shuf(words.slice());
  $("qBody").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">意味：${esc(c.ex[1])}</div><div class="qprompt" style="margin-top:4px">単語を正しい順に並べよう</div>
   <div class="slot" id="qslot"></div><div class="wpool" id="qpool">${jum.map((w,i)=>`<button class="wchip" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div>
   <div class="qfb" id="qfb"></div><div class="qfoot"><span class="qscore">スコア ${qScore} / ${qTotal}</span><button class="qnext" id="qnext">次へ →</button></div></div>`;
  const slot=$("qslot"),poolEl=$("qpool");let picked=[];
  poolEl.querySelectorAll(".wchip").forEach(b=>b.addEventListener("click",()=>{if($("qBody").dataset.done)return;picked.push(b.dataset.w);b.style.visibility="hidden";const s=document.createElement("button");s.className="wchip";s.textContent=b.dataset.w;s.onclick=()=>{s.remove();b.style.visibility="visible";picked=picked.filter((_,idx)=>slot.children[idx]!==s);};slot.appendChild(s);
    if(picked.length===words.length){$("qBody").dataset.done=1;qTotal++;const ok=picked.join(" ")===words.join(" ");if(ok){qScore++;$("qfb").textContent="Benar! 正解 🎉 → "+c.ex[0];$("qfb").style.color="#2e7d3c";}else{$("qfb").textContent="正解: "+c.ex[0];$("qfb").style.color="var(--hl)";}$("qBody").querySelector(".qscore").textContent="スコア "+qScore+" / "+qTotal;qStat("arrange",ok);play(c.ex[2],c.ex[0],null);}}));
  $("qnext").onclick=()=>{$("qBody").dataset.done="";nextQ();};
}
function typeQ(){const pool=CARDS.filter(c=>c.w&&c.ja);const c=rnd(pool);
  $("qBody").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">日本語をインドネシア語で入力しよう</div><div class="qword" style="font-size:22px">${esc(c.ja)}</div>
   <input class="searchin" id="qtype" placeholder="インドネシア語を入力" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="margin:6px 0 12px"><button class="qnext nqcheck" id="qtchk">確認する</button>
   <div class="qfb" id="qfb"></div><div class="qfoot"><span class="qscore">スコア ${qScore} / ${qTotal}</span><button class="qnext" id="qnext">次へ →</button></div></div>`;
  const inp=$("qtype");try{inp.focus();}catch(e){}let done=false;
  function chk(){if(done||!inp.value.trim())return;done=true;qTotal++;const ok=norm(inp.value)===norm(c.w);if(ok){qScore++;$("qfb").innerHTML="Benar! 🎉 <b>"+esc(c.w)+"</b>";$("qfb").style.color="#2e7d3c";}else{$("qfb").innerHTML="正解: <b>"+esc(c.w)+"</b>（"+esc(c.ja)+"）";$("qfb").style.color="var(--hl)";try{status[c.w]="weak";SV("dks_status",status);}catch(_){}}$("qBody").querySelector(".qscore").textContent="スコア "+qScore+" / "+qTotal;play(c.audio,c.w,null);qStat("type",ok);if(typeof bumpActivity==="function")bumpActivity();}
  $("qtchk").onclick=chk;inp.addEventListener("keydown",e=>{if(e.key==="Enter")chk();});
  $("qnext").onclick=()=>{$("qBody").dataset.done="";nextQ();};
}

/* ===== 今日の5語 ===== */
function buildDaily(){const seed=new Date();const key=seed.getFullYear()+"-"+(seed.getMonth()+1)+"-"+seed.getDate();let h=0;for(const ch of key)h=(h*31+ch.charCodeAt(0))>>>0;
  const pool=CARDS.filter(c=>c.lv<=2&&c.ex);const pick=[];const used={};for(let i=0;i<5&&pool.length;i++){h=(h*1103515245+12345)>>>0;let idx=h%pool.length;while(used[idx]){idx=(idx+1)%pool.length;}used[idx]=1;pick.push(pool[idx]);}
  $("p-daily").innerHTML=`<div style="font-size:13px;color:var(--sub);margin:6px 0 12px">📅 ${key} の5語 — 毎日入れ替わります</div>`+
   pick.map((c,i)=>`<div class="lesson panelcard" data-reveal><div style="display:flex;align-items:center;gap:10px"><span class="amark" style="background:var(--hl)">${i+1}</span>${spkBtn(c.audio,c.w)}<span class="lp" style="font-size:20px">${esc(c.w)}</span></div>
     <div class="lt2" style="margin-top:6px">${esc(c.ja)}</div>${c.ex?`<div class="lex" style="margin-top:6px">${spkBtn(c.ex[2],c.ex[0])}<span class="m">${wrapWords(c.ex[0])}｜${esc(c.ex[1])}</span></div>`:""}</div>`).join("");
}

/* ===== 穴埋め ===== */
function buildFill(){$("p-fill").innerHTML=`<div id="fillBody"></div>`;nextFill();}
let fScore=0,fTotal=0;
function nextFill(){const pool=[];SCENES.forEach(s=>s.lines.forEach(l=>{const w=l[2].replace(/[.?!,]/g,"").split(" ");if(w.length>=3&&w.length<=7)pool.push([l[2],l[3],l[4],w]);}));
  const it=rnd(pool);const words=it[3];let bi=1+((Math.random()*(words.length-1))|0);const answer=words[bi].replace(/[.?!,]/g,"");
  const disp=words.map((w,i)=>i===bi?`<span class="blankslot">?</span>`:wrapWords(w)).join(" ");
  const opts=shuf([answer].concat(shuf(SCENES.flatMap(s=>s.lines).flatMap(l=>l[2].replace(/[.?!,]/g,"").split(" ")).filter(w=>w.toLowerCase()!==answer.toLowerCase()&&w.length>1)).slice(0,3)));
  $("fillBody").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">空欄に入る単語は？</div><div class="fillsent">${disp}</div><div class="qprompt">${esc(it[1])}</div>
   <div class="qopts" style="margin-top:14px">${opts.map(o=>`<button data-ok="${o.toLowerCase()===answer.toLowerCase()?1:0}" data-w="${esc(o)}">${esc(o)}</button>`).join("")}</div>
   <div class="qfb" id="ffb"></div><div class="qfoot"><span class="qscore">スコア ${fScore} / ${fTotal}</span><button class="qnext" id="fnext">次へ →</button></div></div>`;
  const opt=$("fillBody").querySelectorAll(".qopts button");let done=false;
  opt.forEach(b=>b.addEventListener("click",()=>{if(done)return;done=true;fTotal++;const ok=b.dataset.ok==="1";if(ok){fScore++;b.classList.add("correct");$("ffb").textContent="Benar! 🎉";$("ffb").style.color="#2e7d3c";}else{b.classList.add("wrong");opt.forEach(x=>{if(x.dataset.ok==="1")x.classList.add("correct");});$("ffb").textContent="正解: "+answer;$("ffb").style.color="var(--hl)";}
    opt.forEach(x=>{x.classList.add("answered");const m=look(norm(x.dataset.w||""));x.insertAdjacentHTML("beforeend",`<span class="optmean">${m?esc(m):"—"}</span>`);});
    $("fillBody").querySelector(".qscore").textContent="スコア "+fScore+" / "+fTotal;qStat("fill",ok);play(it[2],it[0],null);}));
  $("fnext").onclick=nextFill;
}

/* ===== ホーム：アイコンタイル ===== */
const HOME=[["learn","学ぶ","📚","#e2566a","#c0392b"],["practice","練習","🎯","#3aa0d6","#1b6e9e"],["talk","会話","💬","#4bbf7b","#2e7d4f"],
 ["num","数字","🔢","#eb8a4e","#c25a1b"],["scan","街を知る","📷","#7a5cc0","#5a3f96"],["news","ニュース","📰","#d1495b","#9c2b3b"],["dict","辞書","📖","#5aa0b5","#2e7d8f"]];
const READS=[["reads:r-info","情報","📋","#6d8f3a","#4d6b22"],["reads:r-daily","日常","🏙️","#4a7c9e","#2e5875"],["reads:r-geo","地理","🗺️","#b58a4c","#8a6224"],["reads:r-hist","歴史","🏛️","#a5794a","#6e4a24"],
 ["reads:r-cult","文化","🇮🇩","#c0392b","#8a1f1f"],["reads:r-japan","日本","🗾","#c96b86","#9e3a57"]];
const tile=h=>{const flag=h[0]==="reads:r-cult";return `<div class="htile" data-goto="${h[0]}"><div class="ic ${flag?"flagic":""}" style="--g1:${h[3]};--g2:${h[4]}">${flag?"":h[2]}</div><div class="lb">${h[1]}</div></div>`;};
$("homeCards").innerHTML=`<div class="homegrid">${HOME.map(tile).join("")}</div>
 <div class="homegroup"><div class="ghead" data-goto="reads:r-info"><div class="gic">🗺️</div><div class="gtxt">読み物</div><div class="gsub">TAP →</div></div><div class="homegrid">${READS.map(tile).join("")}</div></div>`;
function balanceHomeGrid(){document.querySelectorAll("#homeCards .homegrid").forEach(function(g){var n=g.children.length;if(!n)return;var group=g.closest(".homegroup"),minW=group?82:100,gap=group?11:14;var cw=g.clientWidth||g.offsetWidth||360;var cnat=Math.max(1,Math.floor((cw+gap)/(minW+gap)));if(cnat>=n){g.style.gridTemplateColumns="repeat("+n+",1fr)";return;}var rows=Math.ceil(n/cnat),cols=Math.ceil(n/rows);g.style.gridTemplateColumns="repeat("+cols+",1fr)";});}
balanceHomeGrid();requestAnimationFrame(balanceHomeGrid);var _bhT;window.addEventListener("resize",function(){clearTimeout(_bhT);_bhT=setTimeout(balanceHomeGrid,150);});
function renderProverb(){var el=$("homeProverb");if(!el||!PERIBAHASA.length)return;var d=new Date();var idx=(d.getFullYear()*372+d.getMonth()*31+d.getDate())%PERIBAHASA.length;var p=PERIBAHASA[idx];el.innerHTML='<div class="proverb"><div class="pvlabel">\u4eca\u65e5\u306e\u3053\u3068\u308f\u3056 \u30fb Peribahasa</div><div class="pvid">'+spkBtn(p.audio,p.id)+'<span class="t">'+wrapWords(p.id)+'</span></div><div class="pvja">'+esc(p.ja)+'</div></div>';}
renderProverb();
function openTarget(g){const[v,pane]=g.split(":");showView(v);if(pane){const box=document.querySelector('.view[data-view="'+v+'"]');if(box){const st=box.querySelector('.subtabs[data-sub]');if(st)st.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x.dataset.pane===pane));box.querySelectorAll(".pane").forEach(p=>p.classList.toggle("active",p.id===pane));initPane(pane);}}}

/* ===== 検索 ===== */
let SIDX=null;
const SCAT=["辞書","自分の単語","単語","島パック","略語","サバイバル","例文","文法","接辞","会話","ドライバー","旅行","テーマ別","ニュース","読み物","文化","歴史","地理","日常","日本","数字"];
function buildIndex(){SIDX=[];
  const add=(id,ja,audio,src,go)=>{if(id&&ja)SIDX.push({id:String(id),ja:String(ja),audio:audio||"",src:src,go:go});};
  const wau=w=>"audio/w/"+String(w).replace(/\//g,"_")+".mp3";
  try{Object.keys(GLOSS).forEach(k=>{if(k&&GLOSS[k])add(k,GLOSS[k],wau(k),"辞書","more:dict");});}catch(e){}
  try{Object.keys(MYWORDS).forEach(w=>add(w,MYWORDS[w],wau(w),"自分の単語","more:dict"));}catch(e){}
  try{WORDS.forEach(w=>{add(w.word,w.meaning,w.audio,"単語","learn:l-words");(w.ex||[]).forEach(e=>add(e[0],e[1],e[2],"例文","learn:l-words"));});}catch(e){}
  try{GRAMMAR.forEach(g=>(g.ex||[]).forEach(e=>add(e[0],e[1],e[2],"文法","learn:l-gram")));}catch(e){}
  try{[[PREFIX,"learn:l-prefix"],[SUFFIX,"learn:l-suffix"],[CONFIX,"learn:l-confix"]].forEach(pair=>{
    (pair[0]||[]).forEach(g=>(g.ex||[]).forEach(e=>add(e[0],e[1],e[2],"接辞",pair[1])));});}catch(e){}
  try{SCENES.forEach(s=>s.lines.forEach(l=>add(l[2],l[3],l[4],"会話","talk:t-scene")));}catch(e){}
  try{DRIVER.forEach(g=>g.items.forEach(it=>{add(it[0],it[1],it[2],"ドライバー","talk:t-driver");(it[3]||[]).forEach(x=>add(x[0],x[1],x[2],"ドライバー","talk:t-driver"));}));}catch(e){}
  try{TRAVEL.forEach(g=>g.items.forEach(it=>add(it[0],it[1],it[2],"旅行","talk:t-travel")));}catch(e){}
  try{PACKS.forEach(g=>g.items.forEach(it=>add(it[0],it[1],it[2],"テーマ別","talk:t-pack")));}catch(e){}
  try{(window.GAUL||[]).forEach(g=>{add(g.s,g.ja+"（＝"+g.f+"）","","略語","learn:l-gaul");add(g.ex,g.exja,"","略語","learn:l-gaul");});}catch(e){}
  try{(window.SURVIVAL||[]).forEach(s=>s.items.forEach(it=>add(it.id,it.ja,"","サバイバル","talk:t-surv")));}catch(e){}
  try{(window.ISLANDPACKS||[]).forEach(p=>{if(!packOpen(p.id))return;
    p.words.forEach(w=>{add(w.word,w.meaning,w.audio,"島パック","learn:l-packs");
      (w.ex||[]).forEach(e=>add(e[0],e[1],e[2],"島パック","learn:l-packs"));});});}catch(e){}
  try{(window.REALNEWS||[]).forEach(n=>add(n.id,n.ja,n.audio,"ニュース","news"));}catch(e){}
  try{NEWS.forEach(n=>add(n.id,n.ja,n.audio,"読み物","reads:r-info"));}catch(e){}
  try{CULTURE.forEach(c=>add(c.id,c.ja,c.audio,"文化","reads:r-cult"));}catch(e){}
  try{HISTORY.forEach(x=>add(x.id,x.ja,x.audio,"歴史","reads:r-hist"));}catch(e){}
  try{GEO.forEach(g=>add(g.id,g.ja,g.audio,"地理","reads:r-geo"));}catch(e){}
  try{DAILY.forEach(d=>add(d.id,d.ja,d.audio,"日常","reads:r-daily"));}catch(e){}
  try{JAPAN.forEach(x=>add(x[0],x[1],x[2],"日本","reads:r-japan"));}catch(e){}
  try{NUMBERS.forEach(n=>add(n[1],String(n[0]),n[2],"数字","num"));}catch(e){}
}
function searchRender(){
  const q=($("searchIn").value||"").trim().toLowerCase();
  const box=$("searchRes");
  if(!q){box.innerHTML="";return;}
  if(!SIDX)buildIndex();
  const seen={},hit=[];
  for(let i=0;i<SIDX.length;i++){const r=SIDX[i];
    if(r.id.toLowerCase().indexOf(q)<0&&r.ja.toLowerCase().indexOf(q)<0)continue;
    const key=r.src+"|"+r.id;if(seen[key])continue;seen[key]=1;hit.push(r);}
  if(!hit.length){box.innerHTML='<div class="snone">見つかりませんでした</div>';return;}
  const by={};hit.forEach(r=>{(by[r.src]=by[r.src]||[]).push(r);});
  let html="",total=0;
  SCAT.forEach(cat=>{
    const arr=by[cat];if(!arr||!arr.length||total>=60)return;
    const show=arr.slice(0,8);total+=show.length;
    html+='<div class="scat">'+esc(cat)+'<span>'+arr.length+'</span></div>'+show.map(r=>
      '<div class="sres" data-goto="'+esc(r.go)+'">'+spkBtn(r.audio,r.id)+
      '<div class="t"><div>'+wrapWords(r.id)+'</div><div class="ja">'+esc(r.ja)+'</div></div>'+
      '<button class="bkbtn" data-book=\''+esc(JSON.stringify({id:r.id,ja:r.ja,audio:r.audio}))+'\' aria-label="ブックマーク">★</button></div>').join("");
    if(arr.length>show.length)html+='<div class="smore">ほか '+(arr.length-show.length)+' 件</div>';
  });
  box.innerHTML=html;
  if(typeof refreshBookBtns==="function")refreshBookBtns();
}
$("btnSearch").onclick=()=>{$("searchOv").classList.add("on");$("searchIn").focus();
  ensureExtra(function(){SIDX=null;var q=$("searchIn");if(q&&q.value.trim())searchRender();});};
var _sqT=null;
$("searchIn").addEventListener("input",()=>{clearTimeout(_sqT);_sqT=setTimeout(searchRender,200);});
$("searchRes").addEventListener("click",e=>{if(e.target.closest("[data-goto]"))$("searchOv").classList.remove("on");});

/* ===== 設定 ===== */
function applyFont(fs){document.body.classList.remove("fs-s","fs-m","fs-l");document.body.classList.add(fs);[...$("setFont").children].forEach(b=>b.classList.toggle("active",b.dataset.fs===fs));SV("dks_font",fs);}
function applyTheme(mode){var dark=mode==="dark"||(mode==="auto"&&window.matchMedia&&matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.setAttribute("data-theme",dark?"dark":"light");SV("dks_theme",mode);
  var _tc=document.querySelector('meta[name="theme-color"]');if(_tc)_tc.setAttribute("content",dark?"#721923":"#c1272d");var st=$("setTheme");if(st)[...st.children].forEach(function(b){b.classList.toggle("active",b.dataset.th===mode);});}
try{if(window.matchMedia)matchMedia("(prefers-color-scheme:dark)").addEventListener("change",function(){if(LS("dks_theme","auto")==="auto")applyTheme("auto");});}catch(e){}
$("btnSettings").onclick=()=>{$("setOv").classList.add("on");if(typeof bkInfo==="function")bkInfo();if(typeof buildVoiceUI==="function")buildVoiceUI();};
(function(){var nm=LS("dks_name","");var u=$("setUserName");if(u)u.textContent=nm||"ゲスト";var _nm=$("setName");if(_nm){_nm.value=nm;_nm.addEventListener("input",function(){var v=_nm.value.trim();SV("dks_name",v);if(u)u.textContent=v||"ゲスト";renderGreet();});}})();
var _stEl=$("setTheme");if(_stEl)_stEl.addEventListener("click",function(e){var b=e.target.closest("[data-th]");if(b)applyTheme(b.dataset.th);});
$("setFont").addEventListener("click",e=>{const b=e.target.closest("[data-fs]");if(b)applyFont(b.dataset.fs);});
$("setSpeed").addEventListener("click",e=>{const b=e.target.closest("[data-sp]");if(!b)return;SPEED=+b.dataset.sp;SV("dks_speed",SPEED);[...$("setSpeed").children].forEach(x=>x.classList.toggle("active",x===b));});
$("setRepeat").onclick=()=>{REPEAT=!REPEAT;SV("dks_repeat",REPEAT);$("setRepeat").classList.toggle("on",REPEAT);};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest(".overlay").classList.remove("on"));
document.querySelectorAll(".overlay").forEach(o=>o.addEventListener("click",e=>{if(e.target===o)o.classList.remove("on");}));

/* 起動時：設定復元 */
(function(){applyTheme(LS("dks_theme","auto"));const f=LS("dks_font","fs-m");applyFont(f);[...$("setSpeed").children].forEach(x=>x.classList.toggle("active",+x.dataset.sp===SPEED));$("setRepeat").classList.toggle("on",REPEAT);})();

/* 暗記モード（会話・単語で共有） */
function toggleHide(){const on=!document.body.classList.contains("hidden");document.body.classList.toggle("hidden",on);document.querySelectorAll("#switch,#switch2").forEach(s=>s.classList.toggle("on",on));document.querySelectorAll(".show").forEach(e=>e.classList.remove("show"));}
window.toggleHide=toggleHide;

/* ========== ブラッシュアップ機能 ========== */
function idKata(word){return (word||"").toLowerCase().split(/[\s\-]+/).filter(Boolean).map(katakanaWord).join("・");}
function katakanaWord(w){
  w=w.toLowerCase().replace(/[^a-z]/g,"");
  const R={"":{a:"ア",i:"イ",u:"ウ",e:"エ",o:"オ"},k:{a:"カ",i:"キ",u:"ク",e:"ケ",o:"コ"},g:{a:"ガ",i:"ギ",u:"グ",e:"ゲ",o:"ゴ"},s:{a:"サ",i:"シ",u:"ス",e:"セ",o:"ソ"},z:{a:"ザ",i:"ジ",u:"ズ",e:"ゼ",o:"ゾ"},t:{a:"タ",i:"ティ",u:"トゥ",e:"テ",o:"ト"},d:{a:"ダ",i:"ディ",u:"ドゥ",e:"デ",o:"ド"},n:{a:"ナ",i:"ニ",u:"ヌ",e:"ネ",o:"ノ"},h:{a:"ハ",i:"ヒ",u:"フ",e:"ヘ",o:"ホ"},b:{a:"バ",i:"ビ",u:"ブ",e:"ベ",o:"ボ"},p:{a:"パ",i:"ピ",u:"プ",e:"ペ",o:"ポ"},m:{a:"マ",i:"ミ",u:"ム",e:"メ",o:"モ"},y:{a:"ヤ",i:"イ",u:"ユ",e:"イェ",o:"ヨ"},r:{a:"ラ",i:"リ",u:"ル",e:"レ",o:"ロ"},l:{a:"ラ",i:"リ",u:"ル",e:"レ",o:"ロ"},w:{a:"ワ",i:"ウィ",u:"ウ",e:"ウェ",o:"ウォ"},j:{a:"ジャ",i:"ジ",u:"ジュ",e:"ジェ",o:"ジョ"},c:{a:"チャ",i:"チ",u:"チュ",e:"チェ",o:"チョ"},f:{a:"ファ",i:"フィ",u:"フ",e:"フェ",o:"フォ"},v:{a:"ヴァ",i:"ヴィ",u:"ヴ",e:"ヴェ",o:"ヴォ"},q:{a:"カ",i:"キ",u:"ク",e:"ケ",o:"コ"},ny:{a:"ニャ",i:"ニ",u:"ニュ",e:"ニェ",o:"ニョ"},ng:{a:"ンガ",i:"ンギ",u:"ング",e:"ンゲ",o:"ンゴ"},sy:{a:"シャ",i:"シ",u:"シュ",e:"シェ",o:"ショ"},kh:{a:"ハ",i:"ヒ",u:"フ",e:"ヘ",o:"ホ"}};
  const CODA={n:"ン",m:"ム",ng:"ン",k:"ク",t:"ット",s:"ス",r:"ル",l:"ル",p:"プ",h:"",g:"グ",b:"ブ",d:"ド",y:"イ",w:"ウ",c:"チ",j:"ジ"};
  const V="aiueo";let out="",i=0;const dg=s=>s==="ny"||s==="ng"||s==="sy"||s==="kh";
  while(i<w.length){const c=w[i];if(V.indexOf(c)>=0){out+=R[""][c];i++;continue;}let cons=c,adv=1;if(i+1<w.length&&dg(w.substr(i,2))){cons=w.substr(i,2);adv=2;}const nx=w[i+adv];if(nx&&V.indexOf(nx)>=0){const row=R[cons]||R[c]||R[""];out+=(row[nx]||row.a||"");i+=adv+1;}else{const cc=(CODA[cons]!==undefined)?CODA[cons]:(CODA[c]!==undefined?CODA[c]:"");out+=cc;i+=adv;}}
  return out||w;
}
let BOOK=LS("dks_book",{});
const isBooked=id=>!!BOOK[id];
function toggleBook(item){if(!item||!item.id)return;if(BOOK[item.id])delete BOOK[item.id];else BOOK[item.id]={id:item.id,ja:item.ja||"",audio:item.audio||""};SV("dks_book",BOOK);renderBookCount();refreshBookBtns();}
function renderBookCount(){const n=Object.keys(BOOK).length;if($("btnBook"))$("btnBook").textContent=n?("★"+n):"★";}
function refreshBookBtns(){document.querySelectorAll("[data-book]").forEach(b=>{try{b.classList.toggle("on",isBooked(JSON.parse(b.getAttribute("data-book")).id));}catch(e){}});if(typeof deck!=="undefined"&&deck.length&&$("fBook"))$("fBook").classList.toggle("on",isBooked(deck[fi].w));}
function renderBookmarks(){const arr=Object.values(BOOK);$("bookWrap").innerHTML=arr.length?arr.map(it=>`<div class="dictrow">${spkBtn(it.audio,it.id)}<div class="dw"><b>${esc(it.id)}</b><span>${esc(it.ja)}</span></div><button class="bkbtn on" data-book='${esc(JSON.stringify(it))}'>★</button></div>`).join(""):`<div style="color:var(--sub);font-size:13px;padding:10px 0">まだありません。辞書・検索・カードの ★ で保存できます。</div>`;}
$("btnBook").onclick=()=>{renderBookmarks();$("bookOv").classList.add("on");};
renderBookCount();

let ACT=LS("dks_act",{date:"",streak:0,today:0,goal:10});
const _d=x=>{const d=new Date(Date.now()-x*86400000);return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();};
function bumpActivity(){const t=_d(0);if(ACT.date!==t){ACT.date=t;ACT.today=0;}ACT.today=(ACT.today||0)+1;ACT.hist=ACT.hist||{};ACT.hist[t]=(ACT.hist[t]||0)+1;SV("dks_act",ACT);renderHomeStats();updBadge();}
function _salam(){var hh=new Date().getHours();return hh<11?"Selamat pagi":hh<15?"Selamat siang":hh<19?"Selamat sore":"Selamat malam";}
function renderGreet(){var el=$("homeGreet");if(!el)return;var nm=LS("dks_name","");el.innerHTML=_salam()+(nm?", <b>"+esc(nm)+"</b>":"")+" \u2014 \u4eca\u65e5\u3082\u4e00\u5cf6\u305a\u3064\u3002";}
function renderHomeStats(){const el=$("homeStats");if(!el)return;const t=_d(0);const today=(ACT.date===t)?(ACT.today||0):0;const g=ACT.goal||10;const pct=Math.min(100,Math.round(today/g*100));const streak=(ACT.ci===t||ACT.ci===_d(1))?(ACT.streak||0):0;const done=ACT.ci===t;
  el.innerHTML=`<div class="statcard"><div class="stfire">🔥 <b>${streak}</b> 日連続</div><div class="stgoal"><div class="stbar"><span style="width:${pct}%"></span></div><div class="stlbl">今日の学習 ${today} / ${g}${today>=g?" 🎉達成!":""}</div></div><button class="cibtn ${done?"done":""}" id="ciBtn" aria-label="${done?"チェックイン済み":"チェックイン"}">${done?'<svg class="cichk" viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6"/></svg>':"チェックイン"}</button></div>`;
  const cb=$("ciBtn");if(cb)cb.onclick=checkIn;renderArchHome();renderGreet();homeCTA();bkNudge();streakRisk();updBadge();}
function homeCTA(){var el=$("homeCta");if(!el)return;var tn=todayNum(),st=LS("dks_status",{}),sr=LS("dks_srs",{}),due=0,weak=0;
  Object.keys(sr).forEach(function(w){if(sr[w]&&sr[w].due<=tn&&st[w]!=="known")due++;});
  Object.keys(st).forEach(function(w){if(st[w]==="weak")weak++;});
  var n=due+weak;
  if(n>0){el.innerHTML='<svg class="icn"><use href="#i-target"/></svg> 復習する（'+n+'語）';el.dataset.goto="practice:p-quiz";el.dataset.qmode="review";}
  else{el.innerHTML='<svg class="icn"><use href="#i-play"/></svg> 今日の5語をはじめる';el.dataset.goto="practice:p-daily";delete el.dataset.qmode;}}
var _ciN=0,_ciT=null;
var _catBusy=false;
function catScream(){if(_catBusy)return;_catBusy=true;
  var ov=document.createElement("div");ov.className="catov";
  ov.innerHTML='<div class="catemo">😺</div><div class="cattxt">ﾐ゛ｬｧｧｧﾖ゛ｫｫｫｫｰ</div>';
  var stop=function(e){e.preventDefault();e.stopPropagation();};
  ov.addEventListener("click",stop,true);ov.addEventListener("touchstart",stop,{capture:true,passive:false});
  document.body.appendChild(ov);
  celebrate("🐱 ﾐ゛ｬｧｧｧﾖ゛ｫｫｫｫｰ");
  if(navigator.vibrate)try{navigator.vibrate([30,40,30,40,140]);}catch(e){}
  setTimeout(function(){if(ov.parentNode)ov.remove();_catBusy=false;},1950);}
function checkIn(){const t=_d(0);const first=ACT.ci!==t;if(first){ACT.streak=(ACT.ci===_d(1))?((ACT.streak||0)+1):1;ACT.ci=t;SV("dks_act",ACT);}renderHomeStats();
  _ciN++;clearTimeout(_ciT);_ciT=setTimeout(function(){_ciN=0;},2500);
  if(_ciN>=10){_ciN=0;catScream();return;}
  celebrate(first?("🔥 "+ACT.streak+" 日連続！ チェックイン完了"):"🎉 今日ももう一度！ その調子！");}
function celebrate(msg){
  const rm=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  if(!rm){const cx=window.innerWidth/2,cy=Math.min(window.innerHeight*0.32,260);
    const glow=document.createElement("div");glow.className="cel-glow";glow.style.left=cx+"px";glow.style.top=cy+"px";document.body.appendChild(glow);setTimeout(()=>glow.remove(),750);
    const ring=document.createElement("div");ring.className="cel-ring";ring.style.left=cx+"px";ring.style.top=cy+"px";document.body.appendChild(ring);setTimeout(()=>ring.remove(),850);
    for(let i=0;i<32;i++){const s=document.createElement("div");s.className="spark";const gold=Math.random()<0.7;s.style.background=gold?"var(--gold)":"var(--hl)";if(gold)s.style.boxShadow="0 0 6px rgba(233,201,106,.9)";const sz=3+Math.random()*4;s.style.width=s.style.height=sz+"px";const ang=Math.random()*Math.PI*2,dist=55+Math.random()*95;s.style.left=cx+"px";s.style.top=cy+"px";s.style.setProperty("--dx",(Math.cos(ang)*dist).toFixed(1)+"px");s.style.setProperty("--dy",(Math.sin(ang)*dist).toFixed(1)+"px");s.style.animationDelay=(Math.random()*.08).toFixed(3)+"s";document.body.appendChild(s);setTimeout(()=>s.remove(),1000);}
    for(let i=0;i<26;i++){const f=document.createElement("div");f.className="foil"+(Math.random()<0.19?" red":"");f.style.left=(6+Math.random()*88)+"vw";f.style.setProperty("--fx",(Math.random()*70-35).toFixed(0)+"px");f.style.setProperty("--fr",(Math.random()*260-130).toFixed(0)+"deg");f.style.animationDelay=(Math.random()*.55).toFixed(2)+"s";f.style.animationDuration=(1.4+Math.random()*1.1).toFixed(2)+"s";document.body.appendChild(f);setTimeout(()=>f.remove(),3300);}}
  const tst=document.createElement("div");tst.className="celtoast";tst.textContent=msg;document.body.appendChild(tst);
  requestAnimationFrame(()=>tst.classList.add("show"));setTimeout(()=>{tst.classList.remove("show");setTimeout(()=>tst.remove(),350);},1900);
  if(navigator.vibrate)try{navigator.vibrate([15,30,15,30,25]);}catch(e){}
}
renderHomeStats();

let mediaRec=null,recURL=null,recState=0;
async function toggleRec(){const btn=$("fRec");if(recState){try{mediaRec.stop();}catch(e){}return;}
  if(!navigator.mediaDevices||!window.MediaRecorder){alert("この端末では録音に対応していません。");return;}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true});const mr=new MediaRecorder(st);const ch=[];mr.ondataavailable=e=>ch.push(e.data);mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());if(recURL)URL.revokeObjectURL(recURL);recURL=URL.createObjectURL(new Blob(ch));$("fPlayRec").disabled=false;recState=0;btn.classList.remove("rec");btn.innerHTML='<svg class="icn"><use href="#i-mic"/></svg> 録音';};mediaRec=mr;mr.start();recState=1;btn.classList.add("rec");btn.textContent="■ 停止";}
  catch(e){alert("マイクを使用できません。権限をご確認ください。");}
}
function playRec(){if(recURL){new Audio(recURL).play();}}
function _sim(a,b){a=(a||"").toLowerCase().replace(/[^a-z ]/g,"").trim();b=(b||"").toLowerCase().replace(/[^a-z ]/g,"").trim();if(!a||!b)return 0;var m=a.length,n=b.length,dp=[];for(var i=0;i<=m;i++){dp[i]=[i];for(var j=1;j<=n;j++)dp[i][j]=i===0?j:0;}for(var i2=1;i2<=m;i2++)for(var j2=1;j2<=n;j2++)dp[i2][j2]=Math.min(dp[i2-1][j2]+1,dp[i2][j2-1]+1,dp[i2-1][j2-1]+(a[i2-1]===b[j2-1]?0:1));return Math.max(0,1-dp[m][n]/Math.max(m,n));}
function checkPron(){var c=spCur();if(!c)return;var out=$("fCheckOut");var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){out.textContent="この端末では音声認識に非対応です（Chrome/Edge推奨）。";return;}var target=c.w;var rec=new SR();rec.lang="id-ID";rec.interimResults=false;rec.maxAlternatives=4;var btn=$("fCheck");btn.classList.add("rec");out.textContent="🎤 発音してください…";
  rec.onresult=function(e){var best=0,heard="";for(var i=0;i<e.results[0].length;i++){var alt=e.results[0][i].transcript;var s=_sim(alt,target);if(s>best){best=s;heard=alt;}}var pct=Math.round(best*100);try{var _P=LS("dks_pron",{});var _e=_P[target]||{best:0,tries:0};_e.tries++;_e.last=pct;if(pct>(_e.best||0))_e.best=pct;_P[target]=_e;SV("dks_pron",_P);}catch(_){}var msg,cls;if(pct>=80){msg="Bagus! よくできました";cls="good";if(pct>=92)celebrate("🎉 発音バッチリ！ Sempurna!");}else if(pct>=55){msg="惜しい！もう一度";cls="mid";}else{msg="もう一度ゆっくり言ってみましょう";cls="low";}out.innerHTML='<span class="pscore '+cls+'">'+pct+'%</span> '+msg+'<div class="pheard">認識: '+esc(heard||"—")+' ／ お手本: '+esc(target)+'</div>';};
  rec.onerror=function(e){out.textContent=(e.error==="not-allowed"||e.error==="service-not-allowed")?"マイクの許可が必要です。":"認識できませんでした。もう一度お試しください。";btn.classList.remove("rec");};
  rec.onend=function(){btn.classList.remove("rec");};
  try{rec.start();}catch(e){out.textContent="開始できませんでした。";btn.classList.remove("rec");}}
function _wrapText(ctx,text,cx,y,maxW,lh){var words=(text||"").split(" "),line="",lines=[];for(var i=0;i<words.length;i++){var t=line?line+" "+words[i]:words[i];if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=words[i];}else line=t;}if(line)lines.push(line);var yy=y-(lines.length-1)*lh/2;for(var j=0;j<lines.length;j++)ctx.fillText(lines[j],cx,yy+j*lh);}
function shareCard(){if(!deck.length)return;const c=deck[fi];const W=800,H=800;const cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#d5384a");g.addColorStop(0.55,"#c1272d");g.addColorStop(1,"#9c1622");x.fillStyle=g;x.fillRect(0,0,W,H);
  x.textAlign="center";x.fillStyle="#ffe6a3";x.font="600 36px Georgia,serif";x.fillText("Artikula",W/2,108);
  x.fillStyle="rgba(255,224,140,.85)";x.fillRect(W/2-55,138,110,4);
  x.fillStyle="#ffffff";x.font="800 90px Georgia,serif";_wrapText(x,c.w,W/2,320,W-110,96);
  x.fillStyle="#ffd76a";x.font="700 48px sans-serif";_wrapText(x,c.ja,W/2,470,W-150,60);
  if(c.ex){x.fillStyle="rgba(255,255,255,.92)";x.font="italic 30px Georgia,serif";_wrapText(x,c.ex[0],W/2,600,W-150,42);x.fillStyle="rgba(255,255,255,.72)";x.font="26px sans-serif";_wrapText(x,c.ex[1],W/2,682,W-150,36);}
  x.fillStyle="rgba(255,255,255,.6)";x.font="22px sans-serif";x.fillText("tkagiha.github.io/distinksi",W/2,762);
  cv.toBlob(function(blob){if(!blob)return;var file=new File([blob],"artikula-"+c.w+".png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],text:c.w+"（"+c.ja+"）Artikula"}).catch(function(){});}else{var a2=document.createElement("a");a2.href=URL.createObjectURL(blob);a2.download=file.name;document.body.appendChild(a2);a2.click();a2.remove();setTimeout(function(){URL.revokeObjectURL(a2.href);},1500);}},"image/png");}

function allAudio(){const s=new Set();const add=p=>{if(p)s.add(p);};
  WORDS.forEach(w=>{add(w.audio);w.ex.forEach(e=>add(e[2]));});
  SCENES.forEach(x=>x.lines.forEach(l=>add(l[4])));NEWS.forEach(n=>add(n.audio));
  DRIVER.forEach(g=>g.items.forEach(it=>{add(it[2]);it[3].forEach(a=>add(a[2]));}));
  JAPAN.forEach(x=>add(x[2]));NUMBERS.forEach(x=>add(x[2]));
  (window.CULTURE||[]).forEach(c=>add(c.audio));(HISTORY||[]).forEach(h=>add(h.audio));
  Object.keys(GLOSS).forEach(function(w){add("audio/w/"+w.replace(/\//g,"_")+".mp3");});
  return [...s].filter(p=>p&&p.indexOf("http")!==0);}
async function prefetchAll(){const list=allAudio();const lbl=$("prefLbl"),btn=$("btnPrefetch");btn.disabled=true;let done=0,fail=0,i=0;const N=list.length;
  async function worker(){while(i<N){const idx=i++;try{const r=await fetch(list[idx]);if(!r.ok)fail++;}catch(e){fail++;}done++;if(done%15===0||done===N)lbl.textContent=done+" / "+N+" 保存中…";}}
  lbl.textContent="0 / "+N;await Promise.all([worker(),worker(),worker(),worker(),worker(),worker()]);
  lbl.textContent="完了！ "+(N-fail)+" / "+N+" 保存"+(fail?("（未取得 "+fail+"）"):"");btn.disabled=false;}
if($("btnPrefetch"))$("btnPrefetch").onclick=prefetchAll;
/* ===== 学習データのバックアップ / 復元 ===== */
function bkNudge(){var el=$("bkNudge");if(!el)return;
  var b=LS("dks_bkup",{}),known=Object.values(LS("dks_status",{})).filter(function(v){return v==="known";}).length,mw=Object.keys(LS("dks_mywords",{})).length;
  if(known+mw<10){el.innerHTML="";return;}
  if(b.snooze&&Date.now()<b.snooze){el.innerHTML="";return;}
  var days=b.last?Math.floor((Date.now()-b.last)/86400000):null;
  if(days!==null&&days<14){el.innerHTML="";return;}
  var msg=(days===null)?"まだ一度もバックアップしていません。":("最後のバックアップから "+days+" 日たちました。");
  el.innerHTML='<div class="bknudge"><div class="bkn-t">'+msg+'</div><div class="bkn-s">学習データはこの端末の中だけにあります。ブラウザのデータを消すと、覚えた '+known+'語・登録した '+mw+'語がすべて失われます。書き出してクラウドに置いておけば、機種変更でも戻せます。</div><div class="bkn-b"><button class="bkn-go" id="bknGo">今すぐ書き出す</button><button class="bkn-later" id="bknLater">あとで</button></div></div>';
  var g=$("bknGo");if(g)g.onclick=function(){backupData();};
  var l=$("bknLater");if(l)l.onclick=function(){var bb=LS("dks_bkup",{});bb.snooze=Date.now()+7*86400000;SV("dks_bkup",bb);el.innerHTML="";};}
function bkInfo(){var el=$("bkLbl");if(!el)return;
  var known=_knownOf(LS("dks_status",{})),act=LS("dks_act",{}),mw=Object.keys(LS("dks_mywords",{})).length,b=LS("dks_bkup",{});
  var n=0;try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("dks_")===0)n++;}}catch(e){}
  var last="まだ書き出していません";
  if(b.last){var d=new Date(b.last);var days=Math.floor((Date.now()-b.last)/86400000);
    last="最終バックアップ "+d.getFullYear()+"/"+(d.getMonth()+1)+"/"+d.getDate()+"（"+(days===0?"今日":days+"日前")+"）";}
  var base="覚えた "+known+"語 ・ 連続 "+(act.streak||0)+"日 ・ 登録した単語 "+mw+"語 ・ 保存項目 "+n+"件\n"+last;
  el.textContent=base;
  bkBadge();
  (async function(){try{
    if(navigator.storage&&navigator.storage.persisted){
      var p=await navigator.storage.persisted();
      if(!p&&navigator.storage.persist){try{p=await navigator.storage.persist();}catch(_){}}
      el.textContent=base+"\n自動削除の防止: "+(p?"有効":"未許可")+"（手動削除では消えます）";
    }}catch(e){}})();}
function buildVoiceUI(){var sel=$("setVoice"),note=$("voiceNote");if(!sel)return;
  var vs=idVoices();
  if(!vs.length){sel.innerHTML='<option>利用できる音声なし</option>';sel.disabled=true;
    if(note)note.textContent="この端末にインドネシア語の読み上げ音声がありません。録音済み音声とオンライン読み上げで再生するため、学習に支障はありません。";
    return;}
  sel.disabled=false;
  var saved=LS("dks_voice","");
  sel.innerHTML=vs.map(function(v){var id=v.voiceURI||v.name;
    return '<option value="'+esc(id)+'"'+((saved&&saved===id)||(!saved&&idVoice&&(idVoice.voiceURI||idVoice.name)===id)?" selected":"")+'>'+esc(v.name)+(v.localService===false?"（クラウド）":"")+'</option>';}).join("");
  if(note)note.textContent="クラウド音声のほうが自然です。端末により選べる音声は異なります。";
  sel.onchange=function(){SV("dks_voice",sel.value);pickVoice();};
  var t=$("setVoiceTest");if(t)t.onclick=function(){_rateMul=1;if("speechSynthesis"in window){var u=new SpeechSynthesisUtterance("Selamat pagi, apa kabar?");u.lang="id-ID";if(idVoice)u.voice=idVoice;u.rate=.9*SPEED;speechSynthesis.speak(u);}};}
if("speechSynthesis"in window){try{speechSynthesis.addEventListener("voiceschanged",function(){pickVoice();buildVoiceUI();});}catch(e){}}
function ensurePersist(){try{if(navigator.storage&&navigator.storage.persist&&navigator.storage.persisted){navigator.storage.persisted().then(function(p){if(!p)navigator.storage.persist().catch(function(){});});}}catch(e){}}
ensurePersist();
function _knownOf(obj){try{return Object.values(obj||{}).filter(function(v){return v==="known";}).length;}catch(e){return 0;}}
function backupData(){try{
    var data={};
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("dks_")===0)data[k]=localStorage.getItem(k);}
    var now=new Date();
    var payload={version:1,app:"Artikula",exportedAt:now.toISOString(),data:data};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    var url=URL.createObjectURL(blob),el=document.createElement("a");
    var ymd=now.getFullYear()+String(now.getMonth()+1).padStart(2,"0")+String(now.getDate()).padStart(2,"0");
    el.href=url;el.download="artikula-backup-"+ymd+".json";
    document.body.appendChild(el);el.click();
    setTimeout(function(){URL.revokeObjectURL(url);el.remove();},600);
    SV("dks_bkup",{last:Date.now()});
    if(typeof bkNudge==="function")bkNudge();
    if(typeof bkBadge==="function")bkBadge();
    bkInfo();
    var lbl=$("bkLbl");if(lbl)lbl.textContent="バックアップを書き出しました。クラウド（Googleドライブ等）に保管してください。";
  }catch(e){alert("書き出しに失敗しました。");}}
function restoreData(file){var r=new FileReader();
  r.onload=function(){
    var p;
    try{p=JSON.parse(r.result);}
    catch(e){alert("読み込めませんでした。\nこのファイルはJSONとして壊れています。");return;}
    var ver=p&&(p.version||p.v);
    var d=p&&p.data;
    if(!ver||!d||typeof d!=="object"||Array.isArray(d)){
      alert("Artikula のバックアップファイルではありません。\n（version と data を含むJSONを選んでください）");return;}
    var keys=Object.keys(d).filter(function(k){return k.indexOf("dks_")===0;});
    if(!keys.length){alert("このファイルに学習データが入っていません。");return;}
    var cur=_knownOf(LS("dks_status",{}));
    var bk=0;
    try{var s=d.dks_status;bk=_knownOf(typeof s==="string"?JSON.parse(s):s);}catch(e){}
    if(!confirm("現在の記録 "+cur+"語 を、バックアップの "+bk+"語 で上書きします。よろしいですか？\n\n現在のデータはすべて置き換えられます（この操作は取り消せません）。"))return;
    try{
      var del=[];
      for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("dks_")===0)del.push(k);}
      del.forEach(function(k){localStorage.removeItem(k);});
      keys.forEach(function(k){localStorage.setItem(k,typeof d[k]==="string"?d[k]:JSON.stringify(d[k]));});
    }catch(e){alert("復元中にエラーが発生しました。データは変更されていない可能性があります。");return;}
    alert("復元しました（"+bk+"語）。アプリを再読み込みします。");location.reload();
  };
  r.onerror=function(){alert("ファイルを読めませんでした。");};
  r.readAsText(file);}
function dueCount(){try{var tn=todayNum(),sr=LS("dks_srs",{}),st=LS("dks_status",{}),n=0;
  Object.keys(sr).forEach(function(w){if(sr[w]&&sr[w].due<=tn&&st[w]!=="known")n++;});return n;}catch(e){return 0;}}
function updBadge(){try{
    if(!navigator.setAppBadge)return;
    var n=dueCount();
    if(n>0)navigator.setAppBadge(n).catch(function(){});
    else if(navigator.clearAppBadge)navigator.clearAppBadge().catch(function(){});
  }catch(e){}}
function streakRisk(){var el=$("skRisk");if(!el)return;
  var t=_d(0),y=_d(1),st=(ACT.streak||0);
  var studiedToday=(ACT.date===t&&(ACT.today||0)>0)||ACT.ci===t;
  var studiedYest=(ACT.hist&&ACT.hist[y]>0)||ACT.ci===y;
  if(st<2||studiedToday||!studiedYest){el.innerHTML="";return;}
  el.innerHTML='<div class="skrisk"><svg class="icn skic"><use href="#i-target"/></svg><div class="sktx"><b>連続'+st+'日が今日で途切れます</b><span>5語だけでも大丈夫です。</span></div><button class="skgo" id="skGo">5語やる</button></div>';
  var g=$("skGo");if(g)g.onclick=function(){openTarget("practice:p-daily");};}
function bkBadge(){var el=$("btnSettings");if(!el)return;
  var b=LS("dks_bkup",{}),known=_knownOf(LS("dks_status",{}));
  var days=b.last?Math.floor((Date.now()-b.last)/86400000):null;
  el.classList.toggle("hasdot",known>=10&&(days===null||days>=60));}
(function(){var b=$("btnBackup");if(b)b.onclick=backupData;
  var rb=$("btnRestore"),rf=$("restoreFile");
  if(rb&&rf){rb.onclick=function(){rf.click();};rf.onchange=function(e){var f=e.target.files&&e.target.files[0];if(f)restoreData(f);e.target.value="";};}
  bkInfo();})();

let nqScore=0,nqTotal=0,nqCur=null,nqVal="",nqDone=false;
/* ===== 数字 聞き取り実戦 ===== */
var NQCAT="basic",NQSET=[],NQI=0,NQMISS=[],NQOK=0;const NQLEN=10;
const NQDIG=["kosong","satu","dua","tiga","empat","lima","enam","tujuh","delapan","sembilan"];
function nqRnd(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function nqGen(){
  if(NQCAT==="basic"){const n=NUMBERS[Math.random()*NUMBERS.length|0];
    return {ans:String(n[0]),text:n[1],audio:n[2],hint:"数字",show:function(v){return v?parseInt(v,10).toLocaleString():"0";},len:12,disp:n[0].toLocaleString()};}
  if(NQCAT==="price"){const unit=[500,1000,5000][nqRnd(0,2)];const v=nqRnd(2,120)*unit;const t=toIndo(v)+" rupiah";
    return {ans:String(v),text:t,audio:"",hint:"値段（Rp）",show:function(x){return "Rp "+(x?parseInt(x,10).toLocaleString():"0");},len:9,disp:"Rp "+v.toLocaleString()};}
  if(NQCAT==="phone"){const n=nqRnd(9,11);let d="08";for(var i=0;i<n;i++)d+=nqRnd(0,9);
    const t=d.split("").map(function(c){return NQDIG[+c];}).join(" ");
    return {ans:d,text:t,audio:"",hint:"電話番号（数字のまま）",show:function(x){return x||"—";},len:13,disp:d};}
  if(Math.random()<.5||!(MONTHS&&MONTHS.length)){const h=nqRnd(1,12),ms=[0,5,10,15,20,30,40,45,50],m=ms[nqRnd(0,ms.length-1)];
    const h24=h<7?h+12:h;const per=h24<11?"pagi":h24<15?"siang":h24<19?"sore":"malam";
    let w=["jam"].concat(toIndo(h).split(" "));if(m>0)w=w.concat(["lewat"]).concat(toIndo(m).split(" ")).concat(["menit"]);w.push(per);
    const ans=String(h).padStart(2,"0")+String(m).padStart(2,"0");
    return {ans:ans,text:w.join(" "),audio:"",hint:"時刻（HHMM の4桁）",len:4,
      show:function(x){x=(x||"").padEnd(4,"_");return x.slice(0,2)+":"+x.slice(2);},
      disp:ans.slice(0,2)+":"+ans.slice(2)};}
  const mo=nqRnd(1,12),dmax=[31,28,31,30,31,30,31,31,30,31,30,31][mo-1],d=nqRnd(1,dmax);
  const t=["tanggal"].concat(toIndo(d).split(" ")).join(" ")+" "+MONTHS[mo-1][1];
  const ans=String(d).padStart(2,"0")+String(mo).padStart(2,"0");
  return {ans:ans,text:t,audio:"",hint:"日付（DDMM の4桁）",len:4,
    show:function(x){x=(x||"").padEnd(4,"_");return x.slice(0,2)+"/"+x.slice(2);},
    disp:ans.slice(0,2)+"/"+ans.slice(2)};}
function buildNumQuiz(){$("a-listen").innerHTML=`<div class="quizbox panelcard">
  <div class="subtabs" id="nqCat" role="tablist" aria-label="出題カテゴリ">${[["basic","基本"],["price","価格"],["phone","電話番号"],["dt","日付・時刻"]].map(x=>`<button data-nc="${x[0]}"${x[0]===NQCAT?' class="active"':''}>${x[1]}</button>`).join("")}</div>
  <div class="qprompt" id="nqHint">音声を聞いて数字を入力しよう</div>
  <div class="nqbar"><span class="nqprog" id="nqProg">1 / ${NQLEN}</span></div>
  <div style="text-align:center;margin:10px 0 14px;display:flex;gap:10px;justify-content:center;align-items:center">
    <button class="spk" id="nqPlay" style="width:54px;height:54px" aria-label="再生"></button>
    <button class="chip nqslow" id="nqSlow" aria-label="ゆっくり再生">ゆっくり</button></div>
  <div class="nqdisp" id="nqDisp">0</div>
  <div class="nqpad" id="nqPad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="nkey" data-k="${n}">${n}</button>`).join("")}<button class="nkey nkfn" data-k="back">⌫</button><button class="nkey" data-k="0">0</button><button class="nkey nkfn" data-k="clear">C</button></div>
  <button class="qnext nqcheck" id="nqCheck">確認する</button>
  <div class="qfb" id="nqfb"></div>
  <div class="qfoot"><span class="qscore" id="nqScoreL">スコア ${nqScore} / ${nqTotal}</span><button class="qnext" id="nqNext">次へ →</button></div></div>`;
  $("nqPlay").innerHTML=SPK;$("nqNext").onclick=nqQuestion;$("nqCheck").onclick=nqSubmit;
  $("nqSlow").onclick=function(){if(nqCur)speakSlow(nqCur.text,$("nqPlay"));};
  $("nqCat").addEventListener("click",function(e){var b=e.target.closest("[data-nc]");if(!b)return;
    [].forEach.call($("nqCat").children,function(x){x.classList.toggle("active",x===b);});
    NQCAT=b.dataset.nc;nqReset();});
  $("nqPad").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(b)nqInput(b.dataset.k);});
  document.addEventListener("keydown",e=>{const num=document.querySelector('.view[data-view="num"]');if(!num||!num.classList.contains("active")||!$("a-listen").classList.contains("active"))return;if(e.key>="0"&&e.key<="9")nqInput(e.key);else if(e.key==="Backspace"){e.preventDefault();nqInput("back");}else if(e.key==="Enter")nqSubmit();});
  nqReset();}
function nqReset(){NQI=0;NQMISS=[];NQOK=0;nqQuestion();}
function nqInput(k){if(nqDone||!nqCur)return;const mx=nqCur.len||12;
  if(k==="back")nqVal=nqVal.slice(0,-1);else if(k==="clear")nqVal="";
  else if(nqVal.length<mx){nqVal=(nqVal===""&&k==="0"&&NQCAT!=="phone"&&nqCur.len!==4)?"":nqVal+k;}
  $("nqDisp").textContent=nqCur.show(nqVal);}
function nqQuestion(){
  if(NQI>=NQLEN)return nqResult();
  nqCur=nqGen();nqVal="";nqDone=false;$("nqfb").textContent="";
  $("nqHint").textContent="音声を聞いて入力しよう — "+nqCur.hint;
  $("nqProg").textContent=(NQI+1)+" / "+NQLEN;
  const d=$("nqDisp");d.className="nqdisp";d.textContent=nqCur.show("");
  const p=()=>{_rateMul=1;play(nqCur.audio,nqCur.text,$("nqPlay"));};$("nqPlay").onclick=p;setTimeout(p,250);}
function nqSubmit(){if(nqDone||!nqCur)return;
  if(nqVal===""){$("nqfb").textContent="数字を入力してください";$("nqfb").style.color="var(--sub)";return;}
  nqDone=true;nqTotal++;NQI++;
  const ok=(nqCur.len===4||NQCAT==="phone")?(nqVal===nqCur.ans):(parseInt(nqVal,10)===parseInt(nqCur.ans,10));
  const d=$("nqDisp");
  if(ok){nqScore++;NQOK++;d.classList.add("ok");$("nqfb").textContent="Benar! 🎉 "+nqCur.text;$("nqfb").style.color="#2e7d3c";}
  else{d.classList.add("ng");NQMISS.push({a:nqCur.disp,t:nqCur.text});
    $("nqfb").innerHTML="正解: <b>"+esc(nqCur.disp)+"</b>（"+esc(nqCur.text)+"）";$("nqfb").style.color="var(--hl)";}
  $("nqScoreL").textContent="スコア "+nqScore+" / "+nqTotal;
  $("nqNext").textContent=(NQI>=NQLEN)?"結果を見る →":"次へ →";
  qStat("number",ok);bumpActivity();}
function nqResult(){const pct=Math.round(NQOK/NQLEN*100);
  const miss=NQMISS.length?'<div class="nqmisst">聞き逃した数字</div><ul class="nqmiss">'+NQMISS.map(function(m){return '<li><b>'+esc(m.a)+'</b><span>'+esc(m.t)+'</span></li>';}).join("")+'</ul>':'<div class="nqperf">全問正解！ Luar biasa 🎉</div>';
  $("a-listen").querySelector(".quizbox").innerHTML='<div class="qprompt">10問おわり</div><div class="nqpct">'+pct+'<small>%</small></div><div class="nqsub">'+NQOK+' / '+NQLEN+' 正解</div>'+miss+'<button class="qnext" id="nqAgain">もう一度（10問）</button>';
  $("nqAgain").onclick=function(){buildNumQuiz();};
  if(pct===100&&typeof celebrate==="function")celebrate("🎉 10問全問正解！");}

$("rolePlay").onclick=()=>{const on=document.body.classList.toggle("roleplay");$("rolePlay").classList.toggle("on",on);document.querySelectorAll(".line.show").forEach(e=>e.classList.remove("show"));};
$("fBook").onclick=()=>{if(deck.length){const c=deck[fi];toggleBook({id:c.w,ja:c.ja,audio:c.audio});$("fBook").classList.toggle("on",isBooked(c.w));}};
$("fShare").onclick=shareCard;
(function(){var r=$("fRec");if(r)r.onclick=toggleRec;var p=$("fPlayRec");if(p)p.onclick=playRec;var c=$("fCheck");if(c)c.onclick=checkPron;})();

/* 起動スプラッシュ演出 */
function newsPopup(){try{
  var upd=window.NEWS_UPDATED||NEWS_UPDATED||"";if(!upd)return;
  if(LS("dks_newsseen","")===upd)return;
  var ov=$("newsOv");if(!ov)return;
  SV("dks_newsseen",upd);
  var hh=new Date().getHours();
  var g=hh<11?"おはようございます":hh<18?"こんにちは":"こんばんは";
  var nm=LS("dks_name","");
  $("nsGreet").textContent=g+(nm?"、"+nm:"")+"！";
  $("nsDate").textContent=fmtNewsDate(upd)+" の最新ニュース";
  var items=window.REALNEWS||[];
  $("nsHead").innerHTML=items.length?('<div class="nsh1">'+esc(items[0].ja||items[0].id)+'</div>'+(items.length>1?'<div class="nsh2">ほか '+(items.length-1)+' 本</div>':"")):"";
  ov.classList.add("on");
  $("nsGo").onclick=function(){ov.classList.remove("on");openTarget("news");};
  $("nsClose").onclick=function(){ov.classList.remove("on");};
}catch(e){}}
(function(){const sp=$("splash");if(!sp)return;
  var seen=false;try{seen=!!sessionStorage.getItem("dks_splash");}catch(e){seen=false;}
  if(seen){sp.remove();newsPopup();return;}
  try{sessionStorage.setItem("dks_splash","1");}catch(e){}
  let gone=false;function done(){if(gone)return;gone=true;sp.classList.add("hide");setTimeout(()=>{if(sp.parentNode)sp.remove();newsPopup();},600);}
  sp.addEventListener("click",done);setTimeout(done,2750);})();

/* タブ間スワイプ（左右で移動） */
(function(){let x0=null,y0=null,ok=false;
  document.addEventListener("touchstart",e=>{if(e.touches.length!==1){x0=null;ok=false;return;}const t=e.target;
    if(t.closest(".track")||t.closest("input")||t.closest("select")||t.closest("textarea")||t.closest(".overlay")||t.closest(".splash")||t.closest(".datebar")||t.closest(".numpad")||t.closest(".wheelcol")||t.closest(".fcard")){x0=null;ok=false;return;}
    x0=e.touches[0].clientX;y0=e.touches[0].clientY;ok=true;},{passive:true});
  document.addEventListener("touchend",e=>{if(!ok||x0==null)return;ok=false;const t=e.changedTouches[0];const dx=t.clientX-x0,dy=t.clientY-y0;
    if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.6){const av=document.querySelector('.view.active');if(!av)return;const cur=TABS.findIndex(t=>t[0]===av.dataset.view);if(cur<0)return;const ni=cur+(dx<0?1:-1);if(ni<0||ni>=TABS.length)return;showView(TABS[ni][0],dx<0?"l":"r");}
  },{passive:true});})();

/* PWA */
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
let _tessP=null;
function scanBusy(on,label,pct){
  var w=$("cropWrap"),st=$("scanStatus"),go=$("scanGo");
  if(w)w.classList.toggle("scanning",!!on);
  if(go)[].forEach.call(go.querySelectorAll("button"),function(b){b.disabled=!!on;});
  if(!st)return;
  if(!on){st.classList.remove("busy");return;}
  st.classList.add("busy");
  var p=Math.max(0,Math.min(100,Math.round(pct||0)));
  st.innerHTML='<div class="scanbar"><span style="width:'+p+'%"></span></div>'
    +'<div class="scanlbl"><svg class="icn scanspin"><use href="#i-camera"/></svg>'
    +'<span>'+esc(label||"読み取り中…")+'</span><b>'+p+'%</b></div>';}
function ensureTesseract(cb){if(window.Tesseract)return cb();if(_tessP){_tessP.then(cb);return;}_tessP=new Promise(function(res,rej){var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});_tessP.then(cb).catch(function(){var st=$("scanStatus");if(st)st.textContent="読み取りエンジンの読み込みに失敗しました。通信環境をご確認ください。";});}
var _scanInit=false;
function buildScan(){if(_scanInit)return;_scanInit=true;
  $("scanPick").onclick=function(){$("scanFile").click();};
  var g=$("scanPickGal");if(g)g.onclick=function(){$("scanFileGal").click();};
  $("scanFile").onchange=function(e){scanHandle(e.target.files&&e.target.files[0]);e.target.value="";};
  if($("scanFileGal"))$("scanFileGal").onchange=function(e){scanHandle(e.target.files&&e.target.files[0]);e.target.value="";};
  var cr=$("btnCropRead");if(cr)cr.onclick=function(){if(!_cropBM){$("scanStatus").textContent="先に写真を選んでください。";return;}
    var bm=_cropBM,sx=Math.max(0,_crop.x*bm.width),sy=Math.max(0,_crop.y*bm.height);
    var sw=Math.min(bm.width-sx,_crop.w*bm.width),sh=Math.min(bm.height-sy,_crop.h*bm.height);
    if(sw<12||sh<12){$("scanStatus").textContent="枠が小さすぎます。もう少し広げてください。";return;}
    scanBusy(true,"文字を探しています…",2);runOCR(_scale(bm,sx,sy,sw,sh));};
  var fr=$("btnFullRead");if(fr)fr.onclick=function(){if(!_cropBM)return;scanBusy(true,"文字を探しています…",2);runOCR(_scale(_cropBM,0,0,_cropBM.width,_cropBM.height));};}
function _enhance(c){var x=c.getContext("2d"),cw=c.width,ch=c.height;
  try{var d=x.getImageData(0,0,cw,ch),p=d.data,i,v;
    var hist=new Array(256),n=p.length/4;for(i=0;i<256;i++)hist[i]=0;
    for(i=0;i<p.length;i+=4){v=(0.299*p[i]+0.587*p[i+1]+0.114*p[i+2])|0;p[i]=p[i+1]=p[i+2]=v;hist[v]++;}
    var lo=0,hi=255,acc=0,cut=n*0.02;
    for(i=0;i<256;i++){acc+=hist[i];if(acc>=cut){lo=i;break;}}
    acc=0;for(i=255;i>=0;i--){acc+=hist[i];if(acc>=cut){hi=i;break;}}
    var rng=Math.max(1,hi-lo);
    for(i=0;i<p.length;i+=4){v=(p[i]-lo)*255/rng;v=v<0?0:v>255?255:v;p[i]=p[i+1]=p[i+2]=v;}
    x.putImageData(d,0,0);}catch(_){}
  return c;}
function _scale(bm,sx,sy,sw,sh){var L=Math.max(sw,sh),s=L<1600?1600/L:(L>2600?2600/L:1);
  var cw=Math.max(1,Math.round(sw*s)),ch=Math.max(1,Math.round(sh*s));
  var c=document.createElement("canvas");c.width=cw;c.height=ch;
  var x=c.getContext("2d");try{x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";}catch(_){}
  x.drawImage(bm,sx,sy,sw,sh,0,0,cw,ch);return _enhance(c);}
var _cropBM=null,_crop={x:.1,y:.12,w:.8,h:.5};
function layoutCrop(){var p=$("scanPrev"),b=$("cropBox");if(!p||!b)return;var W=p.clientWidth,H=p.clientHeight;if(!W||!H)return;
  b.style.left=(_crop.x*W)+"px";b.style.top=(_crop.y*H)+"px";b.style.width=(_crop.w*W)+"px";b.style.height=(_crop.h*H)+"px";}
function showCrop(bm,url){_cropBM=bm;_crop={x:.08,y:.12,w:.84,h:.5};
  var p=$("scanPrev");p.onload=function(){layoutCrop();};p.src=url;
  $("cropWrap").hidden=false;$("scanGo").hidden=false;
  $("scanStatus").textContent="看板の文字部分を枠で囲って「この範囲を読む」を押してください。";
  setTimeout(layoutCrop,60);}
(function(){var b=$("cropBox");if(!b)return;var st=null;
  function dim(){var p=$("scanPrev");return{W:p.clientWidth||1,H:p.clientHeight||1};}
  b.addEventListener("pointerdown",function(e){var hh=e.target.closest("[data-h]");
    st={h:hh?hh.dataset.h:null,x:e.clientX,y:e.clientY,c:{x:_crop.x,y:_crop.y,w:_crop.w,h:_crop.h}};
    try{b.setPointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();e.stopPropagation();});
  document.addEventListener("pointermove",function(e){if(!st)return;var d=dim();
    var dx=(e.clientX-st.x)/d.W,dy=(e.clientY-st.y)/d.H,c=st.c,n={x:c.x,y:c.y,w:c.w,h:c.h},M=0.07;
    if(!st.h){n.x=Math.min(1-c.w,Math.max(0,c.x+dx));n.y=Math.min(1-c.h,Math.max(0,c.y+dy));}
    else{
      if(st.h.indexOf("l")>=0){var nx=Math.max(0,Math.min(c.x+c.w-M,c.x+dx));n.w=c.w+(c.x-nx);n.x=nx;}
      if(st.h.indexOf("r")>=0){n.w=Math.max(M,Math.min(1-c.x,c.w+dx));}
      if(st.h.indexOf("t")>=0){var ny=Math.max(0,Math.min(c.y+c.h-M,c.y+dy));n.h=c.h+(c.y-ny);n.y=ny;}
      if(st.h.indexOf("b")>=0){n.h=Math.max(M,Math.min(1-c.y,c.h+dy));}
    }
    _crop=n;layoutCrop();e.preventDefault();},{passive:false});
  document.addEventListener("pointerup",function(){st=null;});
  window.addEventListener("resize",function(){layoutCrop();});})();
function runOCR(input){$("scanResult").innerHTML="";
  ensureTesseract(function(){(async function(){var wk,pass=0;try{
      var psms=["11","6","3"];
      wk=await Tesseract.createWorker("ind",1,{langPath:"https://tessdata.projectnaptha.com/4.0.0_best",
        logger:function(m){
          var base=pass/psms.length*100, span=100/psms.length;
          if(m.status==="recognizing text")scanBusy(true,"文字を読んでいます（"+(pass+1)+"/"+psms.length+"）",base+(m.progress||0)*span);
          else if(m.status&&m.status.indexOf("loading")===0)scanBusy(true,"読み取りエンジンを準備中…",Math.max(2,(m.progress||0)*8));
          else if(m.status==="initializing api"||m.status==="initialized api")scanBusy(true,"エンジンを起動しています…",8);
        }});
      var best=null;
      for(pass=0;pass<psms.length;pass++){
        await wk.setParameters({preserve_interword_spaces:"1",tessedit_pageseg_mode:psms[pass]});
        var r=await wk.recognize(input);var d=r.data,txt=((d&&d.text)||"").trim();
        var len=txt.replace(/\s/g,"").length;if(!len)continue;
        var score=(d.confidence||0)*Math.min(1,len/10);
        if(!best||score>best.score)best={score:score,data:d};
        if(best.data.confidence>=85&&len>=12)break;
      }
      await wk.terminate();
      if(!best){renderScan("");return;}
      var lines=((best.data.lines)||[]).filter(function(L){return (L.confidence||0)>=55&&((L.text||"").trim().length>1);}).map(function(L){return L.text.trim();});
      renderScan(lines.length?lines.join("\n"):((best.data.text||"").trim()));
    }catch(err){try{if(wk)await wk.terminate();}catch(_){}scanBusy(false);$("scanStatus").textContent="読み取りに失敗しました。もう一度お試しください。";}})();});}
function scanHandle(f){if(!f)return;var url=URL.createObjectURL(f);$("scanResult").innerHTML="";
  if(window.createImageBitmap){createImageBitmap(f).then(function(bm){showCrop(bm,url);}).catch(function(){scanBusy(true,"文字を探しています…",2);runOCR(f);});}
  else{scanBusy(true,"文字を探しています…",2);runOCR(f);}}
function renderScan(text){var st=$("scanStatus"),res=$("scanResult");scanBusy(false);
  if(!text){st.textContent="文字が見つかりませんでした。枠を看板の文字だけに絞る／もっと近づいて撮ると読めることがあります。";res.innerHTML="";return;}
  st.textContent="読み取り完了 ✓ 単語をタップで意味・発音";
  var lines=text.split(/\n+/).map(function(l){return l.trim();}).filter(function(l){return l.length>0;});
  res.innerHTML=lines.map(function(l){return '<div class="scanline panelcard"><div class="scanid">'+spkBtn("",l)+'<span class="t">'+wrapWords(l)+'</span></div><div class="scanja">翻訳中…</div></div>';}).join("")+scanWordsCard(lines);
  var jaEls=res.querySelectorAll(".scanja");
  lines.forEach(function(l,i){translateWord(l).then(function(tr){
    if(!jaEls[i])return;
    if(tr){jaEls[i].textContent=tr;return;}
    var loc=l.split(/\s+/).map(function(x){var m=look(norm(x));return m?x+"＝"+m:null;}).filter(Boolean);
    jaEls[i].textContent=loc.length?("辞書から: "+loc.join(" / ")):(navigator.onLine===false?"オフラインのため文の訳は出せません（単語をタップすると辞書で引けます）":"訳を取得できませんでした（単語をタップすると辞書で引けます）");});});
  scanWordsInit(lines);}
/* 読み取った単語を辞書に登録 */
function scanWordsOf(lines){var seen={},out=[];
  lines.join(" ").split(/\s+/).forEach(function(p){var n=norm(p);
    if(!n||n.length<3||seen[n])return;if(!/^[a-z]+$/.test(n))return;seen[n]=1;
    out.push([n,look(n)||""]);});
  return out.slice(0,20);}
function scanWordsCard(lines){var ws=scanWordsOf(lines);if(!ws.length)return "";
  return '<div class="nwcard panelcard"><h4>見つかった単語（'+ws.length+'）</h4><div class="nwhint">意味を確認して「＋辞書」を押すと、自分の辞書に登録され検索できるようになります</div><div class="nwlist" id="swList">'+
    ws.map(function(x,i){return '<div class="nwrow"><span class="nww" data-audio="" data-text="'+esc(x[0])+'">'+esc(x[0])+'</span><span class="nwm" id="swm'+i+'">'+(x[1]?esc(x[1]):"…")+'</span><button class="nwadd" data-sw="'+esc(x[0])+'" data-i="'+i+'">＋辞書</button></div>';}).join("")+
    '</div></div>';}
function scanWordsInit(lines){var ws=scanWordsOf(lines);
  ws.forEach(function(x,i){if(x[1])return;var el=$("swm"+i);if(!el)return;
    translateWord(x[0]).then(function(tr){if(!el)return;
      var m=tr||look(norm(x[0]));
      el.textContent=m||(navigator.onLine===false?"オフラインのため訳せません":"辞書にない語です");});});}
(function(){document.addEventListener("click",function(e){
  var b=e.target.closest("[data-sw]");if(!b)return;
  var w=b.dataset.sw,i=b.dataset.i,el=$("swm"+i);
  var ja=(el&&el.textContent||"").trim();
  if(!ja||ja==="…"||ja.indexOf("辞書にない")===0||ja.indexOf("オフライン")===0){b.textContent="訳待ち";return;}
  if(addMyWord(w,ja)){b.textContent="登録済み";b.classList.add("done");b.disabled=true;
    var st=$("scanStatus");if(st)st.textContent="「"+w+"」を辞書に登録しました（調べる→辞書 で検索できます）";}
});})();
let deferredPrompt=null;const btnInstall=$("btnInstall");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;if(btnInstall)btnInstall.hidden=false;});
if(btnInstall)btnInstall.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;btnInstall.hidden=true;});
window.addEventListener("appinstalled",()=>{if(btnInstall)btnInstall.hidden=true;});
/* build: tabs+practice+tools v2 */
