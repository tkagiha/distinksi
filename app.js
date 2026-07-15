"use strict";
const WORDS=window.WORDS||[],SCENES=window.SCENES||[],NEWS=window.NEWS||[],DRIVER=window.DRIVER||[],JAPAN=window.JAPAN||[],
  NUMBERS=window.NUMBERS||[],GLOSS=window.GLOSS||{},WORDAUDIO=window.WORDAUDIO||{},PERIBAHASA=window.PERIBAHASA||[],TRAVEL=window.TRAVEL||[],PACKS=window.PACKS||[];
let REGISTER=window.REGISTER||[],MONTHS=window.MONTHS||[],PREFIX=window.PREFIX||[],SUFFIX=window.SUFFIX||[],CONFIX=window.CONFIX||[],CULTURE=window.CULTURE||[],REALNEWS=window.REALNEWS||[],NEWS_UPDATED=window.NEWS_UPDATED||"",HISTORY=window.HISTORY||[],GEO=window.GEO||[],DAILY=window.DAILY||[],_extraP=null;
function _syncExtra(){REGISTER=window.REGISTER||[];MONTHS=window.MONTHS||[];PREFIX=window.PREFIX||[];SUFFIX=window.SUFFIX||[];CONFIX=window.CONFIX||[];CULTURE=window.CULTURE||[];REALNEWS=window.REALNEWS||[];NEWS_UPDATED=window.NEWS_UPDATED||"";HISTORY=window.HISTORY||[];GEO=window.GEO||[];DAILY=window.DAILY||[];}
function ensureExtra(cb){if(window.CULTURE&&window.CULTURE.length){_syncExtra();return cb();}if(!_extraP){_extraP=new Promise(function(res){var s=document.createElement("script");s.src="extra.js?v=w3";s.onload=function(){res();};s.onerror=function(){res();};document.head.appendChild(s);});}_extraP.then(function(){_syncExtra();cb();});}
let CARDS=window.CARDS||[],_cardsP=null;
function ensureCards(cb){if(window.CARDS&&window.CARDS.length){CARDS=window.CARDS;return cb();}if(!_cardsP){_cardsP=new Promise(function(res){var s=document.createElement("script");s.src="cards.js?v=w1";s.onload=function(){CARDS=window.CARDS||[];res();};s.onerror=function(){res();};document.head.appendChild(s);});}_cardsP.then(cb);}
const SPK=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a9 9 0 0 1 0 14"></path></svg>`;
const esc=s=>(s+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const $=id=>document.getElementById(id);
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

/* 辞書 */
const SUF=["nya","lah","kah","ku","mu","kan"];
const norm=t=>t.toLowerCase().replace(/[.,!?;:"“”'()）（]/g,"").trim();
function look(n){if(GLOSS[n])return GLOSS[n];for(const s of SUF){const st=n.slice(0,-s.length);if(n.endsWith(s)&&st.length>=3&&GLOSS[st])return GLOSS[st];}return null;}
function wrapWords(t){return t.split(/(\s+)/).map(p=>{if(/^\s*$/.test(p))return p;const nn=norm(p),m=look(nn);return nn?(m?`<span class="tok known" data-m="${esc(m)}" data-w="${esc(nn)}">${esc(p)}</span>`:`<span class="tok tapable" data-w="${esc(nn)}">${esc(p)}</span>`):`<span class="tok">${esc(p)}</span>`;}).join("");}
const spkBtn=(a,t)=>`<button class="spk" data-audio="${esc(a)}" data-text="${esc(t)}">${SPK}</button>`;

/* 音声（速度・リピート対応） */
let SPEED=LS("dks_speed",1),REPEAT=LS("dks_repeat",false);
let idVoice=null;
function pickVoice(){if(!("speechSynthesis"in window))return;idVoice=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith("id"))||null;}
if("speechSynthesis"in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
let curAudio=null,curBtn=null;
function clearPlaying(){if(curBtn){curBtn.classList.remove("playing");curBtn=null;}}
function stopAll(){if(curAudio){try{curAudio.pause();}catch(e){}curAudio=null;}if("speechSynthesis"in window)speechSynthesis.cancel();clearPlaying();}
function synthFb(text,btn){if(!("speechSynthesis"in window))return;const u=new SpeechSynthesisUtterance(text);u.lang="id-ID";if(idVoice)u.voice=idVoice;u.rate=.9*SPEED;u.onend=u.onerror=()=>{if(curBtn===btn)clearPlaying();};speechSynthesis.speak(u);}
function onlineTTS(text,btn){const a=new Audio("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q="+encodeURIComponent(text));a.playbackRate=SPEED;curAudio=a;let fell=false;const fb=()=>{if(fell)return;fell=true;if(curAudio===a)curAudio=null;synthFb(text,btn);};a.onended=()=>{if(curAudio===a)curAudio=null;if(curBtn===btn)clearPlaying();};a.onerror=fb;a.play().catch(fb);}
function play(src,text,btn){stopAll();curBtn=btn;if(btn)btn.classList.add("playing");if(!src){onlineTTS(text,btn);return;}const a=new Audio(src);a.playbackRate=SPEED;curAudio=a;let done=false,fell=false;const fb=()=>{if(fell)return;fell=true;if(curAudio===a)curAudio=null;onlineTTS(text,btn);};a.onended=()=>{if(REPEAT&&!done){done=true;a.currentTime=0;a.play();return;}if(curAudio===a)curAudio=null;if(curBtn===btn)clearPlaying();};a.onerror=fb;a.play().catch(fb);}
function playList(srcs,btn){stopAll();curBtn=btn;if(btn)btn.classList.add("playing");let i=0;function nx(){if(i>=srcs.length){if(curBtn===btn)clearPlaying();return;}const a=new Audio(srcs[i]);a.playbackRate=SPEED;curAudio=a;let adv=false;const go=()=>{if(adv)return;adv=true;i++;nx();};a.onended=go;a.onerror=go;a.play().catch(go);}nx();}
const wordsToSrcs=ws=>ws.map(w=>"audio/w/"+w+".mp3");
function playSeq(words,btn){playList(wordsToSrcs(words),btn);}

/* 委譲 */
const pop=$("pop");let popTmr=null;
var _trCache={};
function translateWord(w){if(_trCache[w]!=null)return Promise.resolve(_trCache[w]);return fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=ja&dt=t&q="+encodeURIComponent(w)).then(function(r){return r.json();}).then(function(d){var t=(d&&d[0])?d[0].map(function(s){return s[0];}).join(""):"";_trCache[w]=t;return t;}).catch(function(){return"";});}
function showPop(el){const w=el.getAttribute("data-w");const m=el.getAttribute("data-m")||GLOSS[w];const r=el.getBoundingClientRect();pop.dataset.w=w;
  function place(txt){pop.innerHTML='<span class="pw">'+esc(w)+'</span>'+txt;pop.style.left=(r.left+r.width/2)+"px";pop.style.top=(r.top-8)+"px";pop.classList.add("on");clearTimeout(popTmr);popTmr=setTimeout(function(){pop.classList.remove("on");},2800);}
  play(WORDAUDIO[w]||("audio/w/"+w.replace(/\//g,"_")+".mp3"),w,null);
  if(m){place(esc(m));return;}
  place("…");
  translateWord(w).then(function(tr){if(tr)GLOSS[w]=tr;if(pop.dataset.w===w&&pop.classList.contains("on"))place(esc(tr||"（訳なし）"));});}
/* 単一の委譲クリックハンドラ（音声・辞書・カルーセル・ホーム遷移・ブックマーク・意味表示） */
document.addEventListener("click",e=>{
  const pb=e.target.closest("[data-audio]");if(pb){e.stopPropagation();play(pb.dataset.audio,pb.dataset.text||"",pb);return;}
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
  const idx=()=>Math.round(track.scrollLeft/track.clientWidth);
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
  {id:"practice",label:"練習",icon:"i-target",tabs:[["practice","練習"]]},
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
  if(v==="dict"){buildDict();}
}
const PANEI={};
function initPane(id){
  if(PANEI[id])return;PANEI[id]=1;
  if(id==="l-prefix")ensureExtra(buildPrefix);
  if(id==="l-suffix")ensureExtra(buildSuffix);
  if(id==="l-confix")ensureExtra(buildConfix);
  if(id==="l-reg")ensureExtra(buildRegister);
  if(id==="t-driver")buildDriver();
  if(id==="t-travel")buildTravel();
  if(id==="t-pack")buildPacks();
  if(id==="p-quiz")buildQuiz();
  if(id==="p-daily")buildDaily();
  if(id==="p-fill")buildFill();
  if(id==="p-stats")ensureCards(buildStats);
  if(id==="a-time")buildTime();
  if(id==="a-date")ensureExtra(buildDate);
  if(id==="a-listen")buildNumQuiz();
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

/* 接頭辞 */
function buildAffix(arr,id){$(id).innerHTML=arr.map(p=>`<div class="lesson panelcard"><div class="lp">${esc(p.p)}</div><div class="lt2">${esc(p.t)}</div><div class="ln">${esc(p.note)}</div>
  ${p.ex.map(e=>`<div class="lex">${spkBtn(e[2],e[0])}<span class="w">${esc(e[0])}</span><span class="m">${esc(e[1])}</span></div>`).join("")}</div>`).join("");}
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
  mk(sc,[["all","すべて"],["単語","単語"],["会話","会話"],["ニュース","ニュース"],["ドライバー","ドライバー"],["日本","日本"]],v=>{fSrc=v;rebuild();});
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
function rebuild(){deck=CARDS.filter(c=>(fLevel==="all"||c.lv===+fLevel)&&(fSrc==="all"||c.src.includes(fSrc))&&(fSt==="all"||(fSt==="due"?srsDue(c.w):fSt==="new"?!status[c.w]:status[c.w]===fSt)));fi=0;fFlip=false;draw(false);}
function draw(auto){const fw=$("fword"),fm=$("fmean"),ft=$("ftags"),fx=$("fex"),fc=$("fCount");
  if(!deck.length){ft.innerHTML="";fw.textContent="該当なし";fm.textContent="";fx.innerHTML="";fc.textContent="0 / 0";return;}
  const c=deck[fi];const stt=status[c.w];const stb=stt?`<span class="badge bst">${stt==='weak'?'苦手':'覚えた'}</span>`:"";
  ft.innerHTML=`<span class="badge lv${c.lv}">${({1:"初級",2:"中級",3:"上級"})[c.lv]}</span>`+c.src.map(s=>`<span class="badge bsrc">${esc(s)}</span>`).join("")+stb;
  const fk=$("fkata");
  if(fFlip){fw.textContent=c.ja;fm.textContent=c.w;if(fk)fk.textContent="";fx.innerHTML=c.ex?`<div class="fexline">${spkBtn(c.ex[2],c.ex[0])}<span class="t">${wrapWords(c.ex[0])}</span></div><div class="fexja">${esc(c.ex[1])}</div>`:"";}
  else{fw.textContent=c.w;fm.textContent="";if(fk)fk.textContent=idKata(c.w);fx.innerHTML="";}
  fc.textContent=(fi+1)+" / "+deck.length;
  if($("fBook"))$("fBook").classList.toggle("on",isBooked(c.w));
  if(auto&&!fFlip){play(c.audio,c.w,$("fSpk"));if(typeof bumpActivity==="function")bumpActivity();}
}
function mark(s){if(!deck.length)return;const w=deck[fi].w;status[w]=s;SV("dks_status",status);const tn=todayNum();if(s==="known"){const lvl=Math.min(6,((srs[w]&&srs[w].lvl)||0)+1);srs[w]={lvl:lvl,due:tn+SRSIV[lvl]};}else{srs[w]={lvl:1,due:tn+1};}SV("dks_srs",srs);const wasFiltered=fSt!=="all";fi=(fi+1)%deck.length;fFlip=false;if(wasFiltered)rebuild();else draw(true);}
/* 群島プログレス（記録タブ） */
const ARCHPTS=[[7.9,7.9,0],[9.9,14.9,0],[16.3,18.0,0],[25.5,14.4,0],[30.3,15.7,0],[14.2,23.6,0],[22.0,21.9,0],[31.1,22.8,0],[40.4,24.1,0],[256.0,23.5,2],[263.9,24.8,2],[273.2,24.5,2],[390.7,26.0,4],[25.7,33.4,0],[32.6,33.8,0],[41.9,32.2,0],[49.0,30.0,0],[255.0,30.9,2],[263.6,31.8,2],[274.0,33.5,2],[281.6,29.9,2],[30.8,39.6,0],[40.7,42.0,0],[46.4,39.5,0],[54.7,42.1,0],[134.5,37.8,0],[249.1,41.8,2],[255.3,39.0,2],[266.0,40.5,2],[271.0,41.0,2],[279.2,39.0,2],[41.9,47.4,0],[49.6,47.8,0],[54.9,49.2,0],[66.0,46.3,0],[72.4,48.5,0],[247.6,49.7,2],[255.8,46.5,2],[261.9,48.2,2],[272.6,49.8,2],[278.2,48.5,2],[287.4,48.0,2],[408.1,47.5,5],[414.3,46.9,5],[46.7,58.1,0],[56.0,58.0,0],[65.8,54.5,0],[73.3,57.9,0],[176.6,55.4,2],[249.1,54.0,2],[257.4,54.9,2],[264.6,58.1,2],[272.4,56.7,2],[279.2,53.8,2],[285.9,54.5,2],[366.4,57.9,4],[399.6,55.0,4],[405.9,56.6,5],[32.2,63.7,0],[58.0,62.8,0],[70.9,62.8,0],[81.1,66.0,0],[89.1,63.2,0],[97.7,63.2,0],[102.9,65.8,0],[112.6,64.8,0],[120.7,66.1,0],[152.3,63.2,0],[182.3,65.9,2],[208.8,64.6,2],[216.9,65.0,2],[222.1,64.4,2],[231.4,65.4,2],[241.4,65.7,2],[246.1,65.6,2],[257.8,66.0,2],[262.3,62.7,2],[270.3,62.0,2],[281.5,65.4,2],[288.6,65.4,2],[296.6,63.1,2],[313.1,62.7,4],[319.2,63.7,4],[325.9,62.9,4],[335.0,64.9,4],[343.4,63.2,4],[354.0,64.0,4],[361.5,64.5,4],[365.9,63.6,4],[401.6,62.2,4],[409.4,62.5,5],[413.8,62.7,5],[57.2,72.3,0],[62.4,71.8,0],[73.7,70.8,0],[78.6,71.1,0],[88.9,73.5,0],[94.5,70.5,0],[102.9,71.2,0],[174.3,70.7,2],[183.5,69.9,2],[200.9,72.0,2],[208.6,71.8,2],[214.4,72.5,2],[223.6,73.1,2],[233.8,71.7,2],[240.3,73.1,2],[247.7,70.8,2],[257.0,73.7,2],[265.2,72.9,2],[273.6,72.8,2],[305.2,72.9,4],[312.6,70.9,4],[319.7,71.8,4],[328.5,71.6,4],[353.2,71.5,4],[400.2,73.0,4],[417.4,72.1,5],[430.7,72.8,5],[39.5,78.9,0],[63.0,78.9,0],[71.1,79.9,0],[79.7,80.6,0],[97.9,81.6,0],[102.1,81.4,0],[113.8,81.2,0],[118.4,81.5,0],[177.8,81.3,2],[192.5,81.2,2],[200.7,81.7,2],[209.3,81.5,2],[214.7,80.8,2],[224.1,81.1,2],[231.7,81.7,2],[246.8,78.4,2],[256.0,78.1,2],[263.9,78.4,2],[272.0,80.0,2],[304.7,81.5,4],[333.9,80.5,4],[400.1,81.2,4],[406.7,79.7,5],[425.4,79.1,5],[433.4,79.6,5],[456.7,81.3,5],[48.3,86.9,0],[72.6,89.9,0],[78.0,88.3,0],[86.0,86.3,0],[97.4,88.3,0],[105.8,87.8,0],[109.9,87.5,0],[182.4,85.9,2],[193.0,86.9,2],[201.0,86.6,2],[206.0,89.2,2],[216.9,89.6,2],[225.0,86.2,2],[232.6,88.9,2],[239.8,89.9,2],[246.9,90.0,2],[257.0,85.9,2],[261.9,88.7,2],[273.4,86.2,2],[303.4,88.3,4],[311.7,88.8,4],[327.4,88.6,4],[336.6,87.6,4],[343.5,89.3,4],[424.4,89.7,5],[437.8,87.0,5],[447.7,88.4,5],[462.0,89.5,5],[473.4,89.6,6],[480.3,87.0,6],[489.5,89.4,6],[503.3,86.2,6],[512.2,89.3,6],[70.5,94.0,0],[82.2,95.4,0],[86.3,96.6,0],[97.3,94.5,0],[104.4,95.3,0],[112.1,93.9,0],[117.9,98.2,0],[129.6,95.9,0],[136.3,95.0,0],[174.7,94.6,2],[192.3,97.6,2],[199.8,98.0,2],[209.8,94.1,2],[216.4,95.5,2],[222.3,98.0,2],[240.6,98.0,2],[248.7,95.5,2],[255.8,94.5,2],[305.3,96.9,4],[312.6,98.1,4],[318.0,94.4,4],[336.8,95.1,4],[350.3,95.2,4],[406.8,97.9,5],[430.2,97.9,5],[447.8,95.3,5],[457.4,95.9,5],[464.6,94.4,5],[470.8,94.0,6],[480.9,96.2,6],[495.0,95.6,6],[502.5,95.0,6],[527.2,97.8,6],[534.3,98.1,6],[57.4,103.3,0],[73.5,104.1,0],[78.6,103.7,0],[89.8,102.8,0],[96.3,102.4,0],[102.6,105.2,0],[112.9,102.7,0],[118.1,102.2,0],[128.5,104.0,0],[135.0,102.7,0],[185.4,103.3,2],[193.5,105.6,2],[200.0,101.9,2],[209.8,103.9,2],[217.6,103.0,2],[222.6,105.5,2],[231.4,102.5,2],[239.4,104.4,2],[245.8,104.1,2],[255.8,104.1,2],[262.3,104.9,2],[273.4,105.6,2],[306.0,104.0,4],[312.1,104.1,4],[320.2,101.9,4],[349.9,102.2,4],[438.4,104.3,5],[473.5,104.1,6],[479.5,105.9,6],[489.2,103.3,6],[513.3,105.8,6],[521.4,105.5,6],[526.0,104.1,6],[538.0,105.9,6],[542.9,103.7,6],[64.2,113.9,0],[80.1,111.7,0],[90.0,111.1,0],[95.1,112.6,0],[102.3,112.4,0],[114.0,112.1,0],[119.0,111.9,0],[128.1,110.5,0],[134.3,110.4,0],[158.2,112.2,1],[191.8,112.2,2],[200.5,111.9,2],[207.2,110.9,2],[214.8,112.1,2],[223.5,112.4,2],[229.9,111.4,2],[248.2,112.0,2],[255.1,114.1,2],[263.1,113.2,2],[295.7,113.0,2],[302.3,110.8,4],[327.4,112.8,4],[336.5,113.5,4],[408.3,111.6,5],[417.2,113.6,5],[424.5,111.5,5],[455.5,111.2,5],[465.3,113.5,5],[472.0,111.8,6],[478.6,111.1,6],[486.4,112.3,6],[505.8,111.2,6],[513.5,113.5,6],[522.0,110.7,6],[527.7,113.8,6],[533.8,110.0,6],[544.3,112.0,6],[560.2,114.2,6],[71.7,120.5,0],[88.1,121.4,0],[94.6,119.2,0],[112.1,118.3,0],[121.7,120.8,0],[129.4,122.2,0],[248.1,122.2,2],[256.3,119.6,2],[262.3,118.5,2],[302.1,117.9,4],[313.2,119.2,4],[320.9,119.4,4],[326.5,119.0,4],[334.2,121.8,4],[344.4,119.3,4],[382.9,118.0,4],[393.9,121.6,5],[409.4,119.1,5],[416.5,122.0,5],[430.9,119.5,5],[441.0,118.8,5],[471.4,118.6,6],[482.1,119.1,6],[488.3,118.3,6],[496.1,119.5,6],[503.6,118.1,6],[510.3,121.4,6],[519.3,118.9,6],[526.6,119.0,6],[534.8,118.0,6],[544.7,119.3,6],[550.5,120.9,6],[558.2,119.0,6],[97.6,126.3,0],[111.0,129.2,0],[119.5,128.7,0],[128.3,127.2,0],[302.5,126.7,4],[311.1,127.5,4],[337.5,128.3,4],[345.0,126.9,4],[450.0,127.7,5],[472.6,127.8,6],[497.9,126.4,6],[505.2,126.0,6],[518.9,128.2,6],[536.2,126.9,6],[542.1,127.4,6],[551.6,126.7,6],[559.2,126.4,6],[102.1,135.0,0],[110.7,136.9,0],[119.8,134.3,0],[127.2,135.9,0],[135.4,134.5,0],[303.4,137.5,3],[310.9,134.0,3],[329.4,136.9,4],[337.8,138.0,4],[344.0,136.0,4],[514.0,136.5,6],[521.4,134.1,6],[528.8,136.5,6],[535.1,136.3,6],[546.0,135.9,6],[552.6,135.1,6],[559.3,137.7,6],[112.4,142.2,0],[119.6,142.1,0],[127.7,145.6,0],[304.5,142.2,3],[312.2,145.3,3],[334.6,143.8,3],[350.3,141.9,4],[455.9,142.5,5],[465.5,143.5,5],[486.8,145.7,6],[535.3,141.9,6],[543.8,146.1,6],[550.0,142.4,6],[560.8,143.0,6],[127.9,151.4,1],[134.9,150.8,1],[149.8,153.6,1],[313.0,154.0,3],[462.5,150.4,5],[481.4,151.7,6],[488.2,152.4,6],[543.8,151.0,6],[552.1,153.9,6],[558.4,149.8,6],[143.6,161.6,1],[150.1,160.3,1],[201.1,160.6,1],[207.1,162.2,1],[214.8,160.3,1],[222.5,161.6,1],[255.9,161.7,1],[295.4,161.2,3],[313.6,162.2,3],[489.8,159.3,6],[543.4,157.8,6],[552.8,160.7,6],[560.2,160.2,6],[150.8,168.6,1],[161.1,167.5,1],[168.9,167.5,1],[176.1,168.5,1],[184.8,167.2,1],[192.6,168.2,1],[198.8,168.5,1],[207.0,169.8,1],[215.9,169.0,1],[281.4,169.7,3],[329.3,168.1,3],[414.1,166.6,5],[448.6,169.6,5],[535.4,168.7,6],[543.2,166.1,6],[553.1,167.5,6],[560.1,168.0,6],[191.2,174.9,1],[201.6,176.2,1],[208.0,175.6,1],[225.6,177.3,1],[233.6,174.9,1],[248.2,175.4,1],[281.8,176.2,3],[296.1,175.6,3],[311.0,177.3,3],[343.8,177.7,3],[425.8,174.7,5],[441.3,178.0,5],[529.3,178.1,6],[535.5,173.9,6],[543.5,176.6,6],[550.8,176.2,6],[558.2,175.8,6],[249.6,183.9,1],[254.5,182.2,1],[265.7,182.3,3],[272.0,184.2,3],[278.3,183.9,3],[286.5,184.2,3],[296.0,183.4,3],[302.7,183.6,3],[310.7,182.4,3],[318.9,185.6,3],[328.0,185.7,3],[302.6,191.0,3],[361.5,190.5,3],[368.1,189.8,3],[310.3,199.2,3],[351.3,199.5,3],[361.3,199.3,3]];
const ARCH_CLUSTERS=[
 {id:"sumatra",name:"Sumatra",cx:78,cy:95},
 {id:"jawa",name:"Jawa",cx:190,cy:182},
 {id:"kalimantan",name:"Kalimantan",cx:240,cy:80},
 {id:"bali",name:"Bali\u30fbNusa Tenggara",cx:335,cy:188},
 {id:"sulawesi",name:"Sulawesi",cx:360,cy:98},
 {id:"maluku",name:"Maluku",cx:432,cy:112},
 {id:"papua",name:"Papua",cx:500,cy:108}
];
const CITIES=[[55,52],[108,128],[150,160],[166,168],[228,168],[278,182],[208,92],[288,98],[360,140],[376,60],[542,96]];
let _archDots=null,_archLit=null,_archLabelY={};
function _archBuild(){if(_archDots)return _archDots;var dots=ARCHPTS.map(function(p){return {x:p[0],y:p[1],ci:p[2]};});var order=dots.map(function(d,i){return i;}).sort(function(a,b){return dots[a].x-dots[b].x;});order.forEach(function(idx,rank){dots[idx].rank=rank;});var my={};dots.forEach(function(d){if(my[d.ci]==null||d.y>my[d.ci])my[d.ci]=d.y;});_archLabelY=my;_archDots=dots;return dots;}
function renderArch(el){const dots=_archBuild(),total=dots.length;
  const known=Object.values(LS("dks_status",{})).filter(v=>v==="known").length;
  const lit=Math.min(total,Math.floor(known/2)),pct=Math.round(lit/total*100);
  const firstRender=(_archLit==null),prev=firstRender?lit:_archLit;
  const maxRank={};dots.forEach(d=>{if(maxRank[d.ci]==null||d.rank>maxRank[d.ci])maxRank[d.ci]=d.rank;});
  const complete=ci=>maxRank[ci]<lit;
  const circ=dots.map(d=>{const on=d.rank<lit,isNew=on&&d.rank>=prev;return '<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+'" r="2.1" class="ad'+(on?" on":"")+(isNew?" new":"")+'"/>';}).join("");
  var thX=-1;dots.forEach(function(d){if(d.rank===lit-1)thX=d.x;});
  const cities=CITIES.map(function(c){return '<circle cx="'+c[0]+'" cy="'+c[1]+'" r="4" class="citymk'+(lit>0&&c[0]<=thX?" on":"")+'"/>';}).join("");
  const labels=ARCH_CLUSTERS.map((c,ci)=>'<text x="'+c.cx+'" y="'+((_archLabelY[ci]||c.cy)+12).toFixed(0)+'" text-anchor="middle" class="alabel'+(complete(ci)?" done":"")+'">'+c.name+'</text>').join("");
  let footer;const inc=ARCH_CLUSTERS.map((c,ci)=>ci).filter(ci=>!complete(ci));
  if(inc.length===0){footer='\u5168\u7fa4\u5cf6\u70b9\u706f\uff01 <b>Nusantara</b> \u306f\u3042\u306a\u305f\u306e\u3082\u306e';}
  else{let best=inc[0],rem=1e9;inc.forEach(ci=>{const r=(maxRank[ci]+1)*2-known;if(r<rem){rem=r;best=ci;}});
    footer='\u6b21\u306e\u5cf6 <b>'+ARCH_CLUSTERS[best].name+'</b> \u5168\u70b9\u706f\u307e\u3067 \u3042\u3068 <b>'+Math.max(0,rem)+'</b> \u8a9e';}
  el.insertAdjacentHTML("beforeend",'<div class="dashcard archcard"><h4>\u7fa4\u5cf6\u30d7\u30ed\u30b0\u30ec\u30b9</h4><div class="archhead"><b>'+known+'</b>\u8a9e \u30fb '+pct+'% \u70b9\u706f</div><svg class="archmap" viewBox="0 0 568 226" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+circ+cities+labels+'</svg><div class="archfoot">'+footer+'</div></div>');
  const arch=LS("dks_arch",[]);let changed=false;
  ARCH_CLUSTERS.forEach((c,ci)=>{if(complete(ci)&&arch.indexOf(c.id)<0){arch.push(c.id);changed=true;if(!firstRender)setTimeout(()=>celebrate("\u25c6 "+c.name+" \u5168\u5cf6\u70b9\u706f \u2014 Selamat!"),200+ci*450);}});
  if(changed)SV("dks_arch",arch);
  _archLit=lit;}
let _archHomeLit=null;
function renderArchHome(){var el=$("homeArch");if(!el)return;var dots=_archBuild(),total=dots.length;
  var known=Object.values(LS("dks_status",{})).filter(function(v){return v==="known";}).length;
  var lit=Math.min(total,Math.floor(known/2));
  var prev=(_archHomeLit==null)?lit:_archHomeLit;
  var maxRank={};dots.forEach(function(d){if(maxRank[d.ci]==null||d.rank>maxRank[d.ci])maxRank[d.ci]=d.rank;});
  var complete=function(ci){return maxRank[ci]<lit;};
  var circ=dots.map(function(d){var on=d.rank<lit,isNew=on&&d.rank>=prev;return '<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+'" r="2.1" class="ad'+(on?" on":"")+(isNew?" new":"")+'"/>';}).join("");
  var inc=ARCH_CLUSTERS.map(function(c,ci){return ci;}).filter(function(ci){return !complete(ci);});
  var foot;
  if(inc.length===0){foot='\u5168\u7fa4\u5cf6\u70b9\u706f\uff01 <b>Nusantara</b> \u306f\u3042\u306a\u305f\u306e\u3082\u306e';}
  else{var best=inc[0],rem=1e9;inc.forEach(function(ci){var r=(maxRank[ci]+1)*2-known;if(r<rem){rem=r;best=ci;}});
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
  var _af=$("homeArchFull");if(_af){_af.innerHTML="";renderArch(_af);}}

/* ===== クイズ ===== */
let qMode="mean",qScore=0,qTotal=0;
let quizStats=LS("dks_quizstats",{}),_pendQ=null;
function qStat(mode,ok){quizStats[mode]=quizStats[mode]||{c:0,t:0};quizStats[mode].t++;if(ok)quizStats[mode].c++;SV("dks_quizstats",quizStats);}
function buildQuiz(){$("p-quiz").innerHTML=`<div class="subtabs" id="qModes"><button data-q="mean" class="active">意味4択</button><button data-q="listen">聞き取り</button><button data-q="review">復習</button><button data-q="arrange">並べ替え</button><button data-q="type">書き取り</button></div><div id="qBody"></div>`;
  $("qModes").addEventListener("click",e=>{const b=e.target.closest("[data-q]");if(!b)return;[...$("qModes").children].forEach(x=>x.classList.toggle("active",x===b));qMode=b.dataset.q;qScore=0;qTotal=0;nextQ();});
  if(_pendQ){qMode=_pendQ;_pendQ=null;qScore=0;qTotal=0;[...$("qModes").children].forEach(x=>x.classList.toggle("active",x.dataset.q===qMode));}
  nextQ();
}
const rnd=a=>a[Math.random()*a.length|0];
const shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const withEx=()=>CARDS.filter(c=>c.ex);
function nextQ(){if(qMode==="arrange")return arrangeQ();if(qMode==="type")return typeQ();mcQ();}
function mcQ(){const listen=qMode==="listen",review=qMode==="review";const full=CARDS.filter(c=>c.ja&&c.audio);let src=full;if(review){const tn=(typeof todayNum==="function")?todayNum():0;const rp=full.filter(x=>status[x.w]==="weak"||(srs[x.w]&&srs[x.w].due<=tn));if(rp.length)src=rp;}const c=rnd(src);const opts=shuf([c].concat(shuf(full.filter(x=>x.ja!==c.ja)).slice(0,3)));
  $("qBody").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">${listen?"音声を聞いて意味を選ぼう":review?"復習：この語の意味は？":"この単語の意味は？"}</div>
   <div class="qword">${listen?spkBtn(c.audio,c.w).replace('class="spk"','class="spk" style="width:52px;height:52px"'):esc(c.w)+" "+spkBtn(c.audio,c.w)}</div>
   <div class="qopts">${opts.map(o=>`<button data-ok="${o.ja===c.ja?1:0}" data-w="${esc(o.w)}" data-au="${esc(o.audio||"")}">${esc(o.ja)}</button>`).join("")}</div>
   <div class="qfb" id="qfb"></div><div class="qfoot"><span class="qscore">スコア ${qScore} / ${qTotal}</span><button class="qnext" id="qnext">次へ →</button></div></div>`;
  if(listen)setTimeout(()=>play(c.audio,c.w,null),200);
  const opt=$("qBody").querySelectorAll(".qopts button");
  opt.forEach(b=>b.addEventListener("click",()=>{if($("qBody").dataset.done)return;$("qBody").dataset.done=1;qTotal++;const ok=b.dataset.ok==="1";if(ok){qScore++;b.classList.add("correct");$("qfb").textContent="Benar! 正解 🎉";$("qfb").style.color="#2e7d3c";}else{b.classList.add("wrong");opt.forEach(x=>{if(x.dataset.ok==="1")x.classList.add("correct");});$("qfb").textContent="Salah… 正解は「"+c.ja+"」";$("qfb").style.color="var(--hl)";try{status[c.w]="weak";SV("dks_status",status);}catch(_){}}$("qBody").querySelector(".qscore").textContent="スコア "+qScore+" / "+qTotal;opt.forEach(x=>{x.classList.add("answered");x.insertAdjacentHTML("beforeend",'<span class="optword" data-audio="'+esc(x.dataset.au||"")+'" data-text="'+esc(x.dataset.w)+'">'+esc(x.dataset.w)+'</span>');});qStat(listen?"listen":"mean",ok);if(typeof bumpActivity==="function")bumpActivity();}));
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
function buildIndex(){SIDX=[];const add=(id,ja,audio,src)=>SIDX.push({id,ja,audio,src});
  WORDS.forEach(w=>{add(w.word,w.meaning,w.audio,"単語");w.ex.forEach(e=>add(e[0],e[1],e[2],"例文"));});
  SCENES.forEach(s=>s.lines.forEach(l=>add(l[2],l[3],l[4],"会話")));
  NEWS.forEach(n=>add(n.id,n.ja,n.audio,"ニュース"));
  DRIVER.forEach(g=>g.items.forEach(it=>{add(it[0],it[1],it[2],"ドライバー");it[3].forEach(a=>add(a[0],a[1],a[2],"回答"));}));
  JAPAN.forEach(x=>add(x[0],x[1],x[2],"日本"));
}
$("btnSearch").onclick=()=>{$("searchOv").classList.add("on");$("searchIn").focus();};
$("searchIn").addEventListener("input",()=>{if(!SIDX)buildIndex();const q=$("searchIn").value.trim().toLowerCase();if(!q){$("searchRes").innerHTML="";return;}
  const res=SIDX.filter(r=>r.id.toLowerCase().includes(q)||r.ja.toLowerCase().includes(q)).slice(0,40);
  $("searchRes").innerHTML=res.length?res.map(r=>`<div class="sres">${spkBtn(r.audio,r.id)}<div class="t"><div class="src">${esc(r.src)}</div><div>${wrapWords(r.id)}</div><div class="ja">${esc(r.ja)}</div></div><button class="bkbtn" data-book='${esc(JSON.stringify({id:r.id,ja:r.ja,audio:r.audio}))}' aria-label="ブックマーク">★</button></div>`).join(""):`<div style="color:var(--sub);font-size:13px;padding:10px 0">一致なし</div>`;
  if(typeof refreshBookBtns==="function")refreshBookBtns();
});

/* ===== 設定 ===== */
function applyFont(fs){document.body.classList.remove("fs-s","fs-m","fs-l");document.body.classList.add(fs);[...$("setFont").children].forEach(b=>b.classList.toggle("active",b.dataset.fs===fs));SV("dks_font",fs);}
function applyTheme(mode){var dark=mode==="dark"||(mode==="auto"&&window.matchMedia&&matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.setAttribute("data-theme",dark?"dark":"light");SV("dks_theme",mode);var st=$("setTheme");if(st)[...st.children].forEach(function(b){b.classList.toggle("active",b.dataset.th===mode);});}
try{if(window.matchMedia)matchMedia("(prefers-color-scheme:dark)").addEventListener("change",function(){if(LS("dks_theme","auto")==="auto")applyTheme("auto");});}catch(e){}
$("btnSettings").onclick=()=>{$("setOv").classList.add("on");if(typeof bkInfo==="function")bkInfo();};
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
function bumpActivity(){const t=_d(0);if(ACT.date!==t){ACT.date=t;ACT.today=0;}ACT.today=(ACT.today||0)+1;ACT.hist=ACT.hist||{};ACT.hist[t]=(ACT.hist[t]||0)+1;SV("dks_act",ACT);renderHomeStats();}
function _salam(){var hh=new Date().getHours();return hh<11?"Selamat pagi":hh<15?"Selamat siang":hh<19?"Selamat sore":"Selamat malam";}
function renderGreet(){var el=$("homeGreet");if(!el)return;var nm=LS("dks_name","");el.innerHTML=_salam()+(nm?", <b>"+esc(nm)+"</b>":"")+" \u2014 \u4eca\u65e5\u3082\u4e00\u5cf6\u305a\u3064\u3002";}
function renderHomeStats(){const el=$("homeStats");if(!el)return;const t=_d(0);const today=(ACT.date===t)?(ACT.today||0):0;const g=ACT.goal||10;const pct=Math.min(100,Math.round(today/g*100));const streak=(ACT.ci===t||ACT.ci===_d(1))?(ACT.streak||0):0;const done=ACT.ci===t;
  el.innerHTML=`<div class="statcard"><div class="stfire">🔥 <b>${streak}</b> 日連続</div><div class="stgoal"><div class="stbar"><span style="width:${pct}%"></span></div><div class="stlbl">今日の学習 ${today} / ${g}${today>=g?" 🎉達成!":""}</div></div><button class="cibtn ${done?"done":""}" id="ciBtn" aria-label="${done?"チェックイン済み":"チェックイン"}">${done?'<svg class="cichk" viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6"/></svg>':"チェックイン"}</button></div>`;
  const cb=$("ciBtn");if(cb)cb.onclick=checkIn;renderArchHome();renderGreet();homeCTA();}
function homeCTA(){var el=$("homeCta");if(!el)return;var tn=todayNum(),st=LS("dks_status",{}),sr=LS("dks_srs",{}),due=0,weak=0;
  Object.keys(sr).forEach(function(w){if(sr[w]&&sr[w].due<=tn&&st[w]!=="known")due++;});
  Object.keys(st).forEach(function(w){if(st[w]==="weak")weak++;});
  var n=due+weak;
  if(n>0){el.innerHTML='<svg class="icn"><use href="#i-target"/></svg> 復習する（'+n+'語）';el.dataset.goto="practice:p-quiz";el.dataset.qmode="review";}
  else{el.innerHTML='<svg class="icn"><use href="#i-play"/></svg> 今日の5語をはじめる';el.dataset.goto="practice:p-daily";delete el.dataset.qmode;}}
function checkIn(){const t=_d(0);const first=ACT.ci!==t;if(first){ACT.streak=(ACT.ci===_d(1))?((ACT.streak||0)+1):1;ACT.ci=t;SV("dks_act",ACT);}renderHomeStats();celebrate(first?("🔥 "+ACT.streak+" 日連続！ チェックイン完了"):"🎉 今日ももう一度！ その調子！");}
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
function checkPron(){if(!deck.length)return;var out=$("fCheckOut");var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){out.textContent="この端末では音声認識に非対応です（Chrome/Edge推奨）。";return;}var target=deck[fi].w;var rec=new SR();rec.lang="id-ID";rec.interimResults=false;rec.maxAlternatives=4;var btn=$("fCheck");btn.classList.add("rec");out.textContent="🎤 発音してください…";
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
function bkInfo(){var el=$("bkLbl");if(!el)return;var known=Object.values(LS("dks_status",{})).filter(function(v){return v==="known";}).length;var a=LS("dks_act",{});var n=0;try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("dks_")===0)n++;}}catch(e){}
  el.textContent="覚えた "+known+"語 ・ 連続 "+(a.streak||0)+"日 ・ 保存項目 "+n+"件（この端末内のみ）";}
function backupData(){try{
    var data={};
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("dks_")===0)data[k]=localStorage.getItem(k);}
    var payload={app:"Artikula",v:1,exported:new Date().toISOString(),data:data};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    var url=URL.createObjectURL(blob),el=document.createElement("a");
    el.href=url;el.download="artikula-backup-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(el);el.click();
    setTimeout(function(){URL.revokeObjectURL(url);el.remove();},600);
    var lbl=$("bkLbl");if(lbl)lbl.textContent="バックアップを書き出しました。安全な場所に保管してください。";
  }catch(e){alert("書き出しに失敗しました。");}}
function restoreData(file){var r=new FileReader();
  r.onload=function(){try{
      var p=JSON.parse(r.result);var d=(p&&p.data&&typeof p.data==="object")?p.data:p;
      if(!d||typeof d!=="object")throw 0;
      var keys=Object.keys(d).filter(function(k){return k.indexOf("dks_")===0;});
      if(!keys.length)throw 0;
      if(!confirm("この端末の学習データを、バックアップの内容で置き換えます（"+keys.length+"項目）。よろしいですか？"))return;
      keys.forEach(function(k){localStorage.setItem(k,typeof d[k]==="string"?d[k]:JSON.stringify(d[k]));});
      alert("復元しました。アプリを再読み込みします。");location.reload();
    }catch(e){alert("このファイルは読み込めませんでした。Artikula のバックアップ(.json)を選んでください。");}};
  r.onerror=function(){alert("ファイルを読めませんでした。");};
  r.readAsText(file);}
(function(){var b=$("btnBackup");if(b)b.onclick=backupData;
  var rb=$("btnRestore"),rf=$("restoreFile");
  if(rb&&rf){rb.onclick=function(){rf.click();};rf.onchange=function(e){var f=e.target.files&&e.target.files[0];if(f)restoreData(f);e.target.value="";};}
  bkInfo();})();

let nqScore=0,nqTotal=0,nqCur=null,nqVal="",nqDone=false;
function buildNumQuiz(){$("a-listen").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">音声を聞いて数字を入力しよう</div>
  <div style="text-align:center;margin:10px 0 14px"><button class="spk" id="nqPlay" style="width:54px;height:54px"></button></div>
  <div class="nqdisp" id="nqDisp">0</div>
  <div class="nqpad" id="nqPad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="nkey" data-k="${n}">${n}</button>`).join("")}<button class="nkey nkfn" data-k="back">⌫</button><button class="nkey" data-k="0">0</button><button class="nkey nkfn" data-k="clear">C</button></div>
  <button class="qnext nqcheck" id="nqCheck">確認する</button>
  <div class="qfb" id="nqfb"></div>
  <div class="qfoot"><span class="qscore" id="nqScoreL">スコア ${nqScore} / ${nqTotal}</span><button class="qnext" id="nqNext">次へ →</button></div></div>`;
  $("nqPlay").innerHTML=SPK;$("nqNext").onclick=nqQuestion;$("nqCheck").onclick=nqSubmit;
  $("nqPad").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(b)nqInput(b.dataset.k);});
  document.addEventListener("keydown",e=>{const num=document.querySelector('.view[data-view="num"]');if(!num||!num.classList.contains("active")||!$("a-listen").classList.contains("active"))return;if(e.key>="0"&&e.key<="9")nqInput(e.key);else if(e.key==="Backspace"){e.preventDefault();nqInput("back");}else if(e.key==="Enter")nqSubmit();});
  nqQuestion();}
function nqFmt(v){return v?parseInt(v,10).toLocaleString():"0";}
function nqInput(k){if(nqDone)return;if(k==="back")nqVal=nqVal.slice(0,-1);else if(k==="clear")nqVal="";else if(nqVal.length<12){nqVal=(nqVal===""&&k==="0")?"":nqVal+k;}$("nqDisp").textContent=nqFmt(nqVal);}
function nqQuestion(){nqCur=NUMBERS[Math.random()*NUMBERS.length|0];nqVal="";nqDone=false;$("nqfb").textContent="";const d=$("nqDisp");d.className="nqdisp";d.textContent="0";const p=()=>play(nqCur[2],nqCur[1],$("nqPlay"));$("nqPlay").onclick=p;setTimeout(p,250);}
function nqSubmit(){if(nqDone)return;if(nqVal===""){$("nqfb").textContent="数字を入力してください";$("nqfb").style.color="var(--sub)";return;}nqDone=true;nqTotal++;const ok=parseInt(nqVal,10)===nqCur[0],d=$("nqDisp");if(ok){nqScore++;d.classList.add("ok");$("nqfb").textContent="Benar! 🎉 "+nqCur[1];$("nqfb").style.color="#2e7d3c";}else{d.classList.add("ng");$("nqfb").innerHTML="正解: <b>"+nqCur[0].toLocaleString()+"</b>（"+esc(nqCur[1])+"）";$("nqfb").style.color="var(--hl)";}$("nqScoreL").textContent="スコア "+nqScore+" / "+nqTotal;qStat("number",ok);bumpActivity();}

$("rolePlay").onclick=()=>{const on=document.body.classList.toggle("roleplay");$("rolePlay").classList.toggle("on",on);document.querySelectorAll(".line.show").forEach(e=>e.classList.remove("show"));};
$("fBook").onclick=()=>{if(deck.length){const c=deck[fi];toggleBook({id:c.w,ja:c.ja,audio:c.audio});$("fBook").classList.toggle("on",isBooked(c.w));}};
$("fRec").onclick=toggleRec;$("fPlayRec").onclick=playRec;$("fShare").onclick=shareCard;var _fc=$("fCheck");if(_fc)_fc.onclick=checkPron;

/* 起動スプラッシュ演出 */
(function(){const sp=$("splash");if(!sp)return;let gone=false;function done(){if(gone)return;gone=true;sp.classList.add("hide");setTimeout(()=>{if(sp.parentNode)sp.remove();},600);}
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
    $("scanStatus").textContent="読み取り中…";runOCR(_scale(bm,sx,sy,sw,sh));};
  var fr=$("btnFullRead");if(fr)fr.onclick=function(){if(!_cropBM)return;$("scanStatus").textContent="読み取り中…";runOCR(_scale(_cropBM,0,0,_cropBM.width,_cropBM.height));};}
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
        logger:function(m){var s=$("scanStatus");if(m.status==="recognizing text"&&s)s.textContent="読み取り中… "+(pass+1)+"/"+psms.length+"（"+Math.round((m.progress||0)*100)+"%）";}});
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
    }catch(err){try{if(wk)await wk.terminate();}catch(_){}$("scanStatus").textContent="読み取りに失敗しました。もう一度お試しください。";}})();});}
function scanHandle(f){if(!f)return;var url=URL.createObjectURL(f);$("scanResult").innerHTML="";
  if(window.createImageBitmap){createImageBitmap(f).then(function(bm){showCrop(bm,url);}).catch(function(){$("scanStatus").textContent="読み取り中…";runOCR(f);});}
  else{$("scanStatus").textContent="読み取り中…";runOCR(f);}}
function renderScan(text){var st=$("scanStatus"),res=$("scanResult");
  if(!text){st.textContent="文字が見つかりませんでした。枠を看板の文字だけに絞る／もっと近づいて撮ると読めることがあります。";res.innerHTML="";return;}
  st.textContent="読み取り完了 ✓ 単語をタップで意味・発音";
  var lines=text.split(/\n+/).map(function(l){return l.trim();}).filter(function(l){return l.length>0;});
  res.innerHTML=lines.map(function(l){return '<div class="scanline panelcard"><div class="scanid">'+spkBtn("",l)+'<span class="t">'+wrapWords(l)+'</span></div><div class="scanja">翻訳中…</div></div>';}).join("")+scanWordsCard(lines);
  var jaEls=res.querySelectorAll(".scanja");
  lines.forEach(function(l,i){translateWord(l).then(function(tr){if(jaEls[i])jaEls[i].textContent=tr||"（訳なし）";});});
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
    translateWord(x[0]).then(function(tr){if(el)el.textContent=tr||"（訳なし）";});});}
(function(){document.addEventListener("click",function(e){
  var b=e.target.closest("[data-sw]");if(!b)return;
  var w=b.dataset.sw,i=b.dataset.i,el=$("swm"+i);
  var ja=(el&&el.textContent||"").trim();
  if(!ja||ja==="…"||ja==="（訳なし）"){b.textContent="訳待ち";return;}
  if(addMyWord(w,ja)){b.textContent="登録済み";b.classList.add("done");b.disabled=true;
    var st=$("scanStatus");if(st)st.textContent="「"+w+"」を辞書に登録しました（調べる→辞書 で検索できます）";}
});})();
let deferredPrompt=null;const btnInstall=$("btnInstall");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;if(btnInstall)btnInstall.hidden=false;});
if(btnInstall)btnInstall.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;btnInstall.hidden=true;});
window.addEventListener("appinstalled",()=>{if(btnInstall)btnInstall.hidden=true;});
/* build: tabs+practice+tools v2 */
