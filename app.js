"use strict";
const WORDS=window.WORDS||[],SCENES=window.SCENES||[],NEWS=window.NEWS||[],DRIVER=window.DRIVER||[],JAPAN=window.JAPAN||[],
  NUMBERS=window.NUMBERS||[],GLOSS=window.GLOSS||{},WORDAUDIO=window.WORDAUDIO||{};
let REGISTER=window.REGISTER||[],MONTHS=window.MONTHS||[],PREFIX=window.PREFIX||[],CULTURE=window.CULTURE||[],REALNEWS=window.REALNEWS||[],NEWS_UPDATED=window.NEWS_UPDATED||"",HISTORY=window.HISTORY||[],GEO=window.GEO||[],DAILY=window.DAILY||[],_extraP=null;
function _syncExtra(){REGISTER=window.REGISTER||[];MONTHS=window.MONTHS||[];PREFIX=window.PREFIX||[];CULTURE=window.CULTURE||[];REALNEWS=window.REALNEWS||[];NEWS_UPDATED=window.NEWS_UPDATED||"";HISTORY=window.HISTORY||[];GEO=window.GEO||[];DAILY=window.DAILY||[];}
function ensureExtra(cb){if(window.CULTURE&&window.CULTURE.length){_syncExtra();return cb();}if(!_extraP){_extraP=new Promise(function(res){var s=document.createElement("script");s.src="extra.js?v=w1";s.onload=function(){res();};s.onerror=function(){res();};document.head.appendChild(s);});}_extraP.then(function(){_syncExtra();cb();});}
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
function look(n){if(GLOSS[n])return GLOSS[n];for(const s of SUF){if(n.endsWith(s)&&GLOSS[n.slice(0,-s.length)])return GLOSS[n.slice(0,-s.length)];}return null;}
function wrapWords(t){return t.split(/(\s+)/).map(p=>{if(/^\s*$/.test(p))return p;const nn=norm(p),m=look(nn);return m?`<span class="tok known" data-m="${esc(m)}" data-w="${esc(nn)}">${esc(p)}</span>`:`<span class="tok">${esc(p)}</span>`;}).join("");}
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
function onlineTTS(text,btn){const a=new Audio("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q="+encodeURIComponent(text));a.playbackRate=SPEED;curAudio=a;a.onended=()=>{if(curAudio===a)curAudio=null;if(curBtn===btn)clearPlaying();};a.onerror=()=>{if(curAudio===a)curAudio=null;synthFb(text,btn);};a.play().catch(()=>{if(curAudio===a)curAudio=null;synthFb(text,btn);});}
function play(src,text,btn){stopAll();curBtn=btn;if(btn)btn.classList.add("playing");if(!src){onlineTTS(text,btn);return;}const a=new Audio(src);a.playbackRate=SPEED;curAudio=a;let done=false;a.onended=()=>{if(REPEAT&&!done){done=true;a.currentTime=0;a.play();return;}if(curAudio===a)curAudio=null;if(curBtn===btn)clearPlaying();};a.onerror=()=>{if(curAudio===a)curAudio=null;onlineTTS(text,btn);};a.play().catch(()=>{if(curAudio===a)curAudio=null;onlineTTS(text,btn);});}
function playList(srcs,btn){stopAll();curBtn=btn;if(btn)btn.classList.add("playing");let i=0;function nx(){if(i>=srcs.length){if(curBtn===btn)clearPlaying();return;}const a=new Audio(srcs[i]);a.playbackRate=SPEED;curAudio=a;a.onended=()=>{i++;nx();};a.onerror=()=>{i++;nx();};a.play().catch(()=>{i++;nx();});}nx();}
const wordsToSrcs=ws=>ws.map(w=>"audio/w/"+w+".mp3");
function playSeq(words,btn){playList(wordsToSrcs(words),btn);}

/* 委譲 */
const pop=$("pop");let popTmr=null;
function showPop(el){const w=el.getAttribute("data-w"),m=el.getAttribute("data-m");pop.innerHTML=`<span class="pw">${esc(w)}</span>${esc(m)}`;const r=el.getBoundingClientRect();pop.style.left=(r.left+r.width/2)+"px";pop.style.top=(r.top-8)+"px";pop.classList.add("on");clearTimeout(popTmr);popTmr=setTimeout(()=>pop.classList.remove("on"),2600);play(WORDAUDIO[w]||("audio/w/"+w.replace(/\//g,"_")+".mp3"),w,null);}
/* 単一の委譲クリックハンドラ（音声・辞書・カルーセル・ホーム遷移・ブックマーク・意味表示） */
document.addEventListener("click",e=>{
  const pb=e.target.closest("[data-audio]");if(pb){e.stopPropagation();play(pb.dataset.audio,pb.dataset.text||"",pb);return;}
  const bk=e.target.closest("[data-book]");if(bk){e.stopPropagation();try{toggleBook(JSON.parse(bk.getAttribute("data-book")));if($("bookOv").classList.contains("on"))renderBookmarks();}catch(_){}return;}
  const nav=e.target.closest("[data-nav]");if(nav){const[k,d]=nav.dataset.nav.split(":");if(CAR[k])CAR[k].step(+d);return;}
  const gt=e.target.closest("[data-goto]");if(gt){openTarget(gt.dataset.goto);return;}
  const tok=e.target.closest(".tok.known");if(tok){e.stopPropagation();showPop(tok);return;}
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
const TABS=[["home","ホーム"],["learn","学ぶ"],["practice","練習"],["talk","会話"],["num","数字"],["news","ニュース"],["reads","読み物"],["dict","辞書"]];
$("mainTabs").innerHTML=TABS.map(([v,l])=>`<button data-tab="${v}" class="${v==='home'?'active':''}">${l}</button>`).join("");
const INIT={};
function showView(v,dir){
  document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active",el.dataset.view===v));
  [...$("mainTabs").children].forEach(b=>b.classList.toggle("active",b.dataset.tab===v));
  if(!INIT[v]){INIT[v]=1;initView(v);}
  window.scrollTo({top:0,behavior:"instant"in window?"instant":"auto"});
  const av=document.querySelector('.view[data-view="'+v+'"]');
  if(av){av.classList.remove("enter","enter-l","enter-r");void av.offsetWidth;av.classList.add(dir==="l"?"enter-l":dir==="r"?"enter-r":"enter");}
}
$("mainTabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)showView(b.dataset.tab);});
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
  if(v==="dict"){buildDict();}
}
const PANEI={};
function initPane(id){
  if(PANEI[id])return;PANEI[id]=1;
  if(id==="l-prefix")ensureExtra(buildPrefix);
  if(id==="l-reg")ensureExtra(buildRegister);
  if(id==="t-driver")buildDriver();
  if(id==="p-quiz")buildQuiz();
  if(id==="p-daily")buildDaily();
  if(id==="p-fill")buildFill();
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
function buildPrefix(){$("l-prefix").innerHTML=PREFIX.map(p=>`<div class="lesson panelcard"><div class="lp">${esc(p.p)}</div><div class="lt2">${esc(p.t)}</div><div class="ln">${esc(p.note)}</div>
  ${p.ex.map(e=>`<div class="lex">${spkBtn(e[2],e[0])}<span class="w">${esc(e[0])}</span><span class="m">${esc(e[1])}</span></div>`).join("")}</div>`).join("");}

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
function renderNewsDay(day){$("rnDate").textContent="📅 "+day.date+(day.real?" のニュース":" のニュース（学習用）");$("rnWrap").innerHTML=day.items.map(rnCard).join("");}
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
let GEOORD=GEO.map((_,i)=>i);
function renderGeo(){const el=$("geoTrack");el.innerHTML=GEOORD.map(i=>{const g=GEO[i];return `<div class="slide"><div class="card geocard" data-reveal><div class="geobanner" style="--g1:#b58a4c;--g2:#8a6224"><span class="geoemoji">${g.emoji}</span></div><div class="georegion">${esc(g.region)}</div><div class="headline"><span class="word">${esc(g.name)}</span></div><div class="gloss">${esc(g.body)}</div><div class="lex" style="margin-top:12px;border-top:1px solid var(--line2);padding-top:12px">${spkBtn(g.audio,g.id)}<span class="t">${wrapWords(g.id)}</span></div><div style="font-size:12.5px;color:var(--sub);margin:5px 0 0 42px">${esc(g.ja)}</div></div></div>`;}).join("");}
function geoNav(i){$("geoCount").textContent=(i+1)+" / "+GEO.length;}
function buildGeo(){if(!CAR.geo){renderGeo();CAR.geo={step:d=>{const t=$("geoTrack");t.scrollBy({left:t.clientWidth*d,behavior:"smooth"});}};
  const t=$("geoTrack");let tmr;t.addEventListener("scroll",()=>{clearTimeout(tmr);tmr=setTimeout(()=>geoNav(Math.round(t.scrollLeft/t.clientWidth)),90);});geoNav(0);
  $("geoShuffle").addEventListener("click",()=>{for(let i=GEOORD.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[GEOORD[i],GEOORD[j]]=[GEOORD[j],GEOORD[i]];}renderGeo();$("geoTrack").scrollTo({left:0});geoNav(0);});}}

/* 辞書 */
let DICTARR=null;
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
  const ni=$("numInput");ni.addEventListener("input",()=>{let d=ni.value.replace(/[^0-9]/g,"");if(d.length>7)d=d.slice(0,7);ni.value=d?parseInt(d,10).toLocaleString("en-US"):"";});
  function run(){let v=parseInt(ni.value.replace(/[^0-9]/g,""),10);if(isNaN(v)||v<0){$("numOut").textContent="0〜9,999,999 を入力";$("numBlocks").innerHTML="";return;}if(v>9999999)v=9999999;const r=toIndo(v);$("numOut").textContent=r;$("numBlocks").innerHTML=numBlocks(v);playSeq(r.split(" "),$("numGo"));}
  $("numGo").onclick=run;ni.addEventListener("keydown",e=>{if(e.key==="Enter")run();});
}
function buildTime(){const per=h=>h<11?"pagi":h<15?"siang":h<19?"sore":"malam";
  function run(){let h=parseInt($("tH").value,10),m=parseInt($("tM").value,10);if(isNaN(h))h=0;if(isNaN(m))m=0;h=(h%24+24)%24;m=(m%60+60)%60;const h12=h%12===0?12:h%12;let words=["jam"].concat(toIndo(h12).split(" "));if(m>0){words=words.concat(["lewat"]).concat(toIndo(m).split(" ")).concat(["menit"]);}words.push(per(h));$("tOut").textContent=words.join(" ");playSeq(words,$("tGo"));}
  $("tGo").onclick=run;}
function buildDate(){const dM=$("dM");dM.innerHTML=MONTHS.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join("");
  function run(){let d=parseInt($("dD").value,10);if(isNaN(d)||d<1)d=1;if(d>31)d=31;const mi=+dM.value;const mo=MONTHS[mi-1];const words=["tanggal"].concat(toIndo(d).split(" "));$("dOut").textContent=(words.join(" ")+" "+mo[1]);playList(wordsToSrcs(words).concat([mo[2]]),$("dGo"));}
  $("dGo").onclick=run;}

/* ===== フラッシュカード + SRS ===== */
let status=LS("dks_status",{}),fLevel="all",fSrc="all",fSt="all",deck=[],fi=0,fFlip=false;
function buildFlash(){
  const lv=$("lvChips"),sc=$("srcChips"),st=$("stChips");
  const mk=(box,arr,cb)=>{box.innerHTML="";arr.forEach(([v,l])=>{const b=document.createElement("button");b.textContent=l;if(v==="all")b.classList.add("active");b.dataset.v=v;b.onclick=()=>{[...box.children].forEach(x=>x.classList.remove("active"));b.classList.add("active");cb(v);};box.appendChild(b);});};
  mk(lv,[["all","すべて"],["1","初級"],["2","中級"],["3","上級"]],v=>{fLevel=v;rebuild();});
  mk(sc,[["all","すべて"],["単語","単語"],["会話","会話"],["ニュース","ニュース"],["ドライバー","ドライバー"],["日本","日本"]],v=>{fSrc=v;rebuild();});
  mk(st,[["all","すべて"],["new","未学習"],["weak","苦手"],["known","覚えた"]],v=>{fSt=v;rebuild();});
  $("fSpk").innerHTML=SPK;
  $("fcard").addEventListener("click",e=>{if(e.target.closest("[data-audio]")||e.target.closest(".tok.known"))return;if(deck.length){fFlip=!fFlip;draw(false);}});
  $("fPrev").onclick=()=>{if(deck.length){fi=(fi-1+deck.length)%deck.length;fFlip=false;draw(true);}};
  $("fNext").onclick=()=>{if(deck.length){fi=(fi+1)%deck.length;fFlip=false;draw(true);}};
  $("fShuffle").onclick=()=>{for(let i=deck.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[deck[i],deck[j]]=[deck[j],deck[i]];}fi=0;fFlip=false;draw(true);};
  $("fSpk").onclick=e=>{e.stopPropagation();if(deck.length)play(deck[fi].audio,deck[fi].w,$("fSpk"));};
  $("srsWeak").onclick=()=>mark("weak");$("srsKnown").onclick=()=>mark("known");
  rebuild();
}
function rebuild(){deck=CARDS.filter(c=>(fLevel==="all"||c.lv===+fLevel)&&(fSrc==="all"||c.src.includes(fSrc))&&(fSt==="all"||(fSt==="new"?!status[c.w]:status[c.w]===fSt)));fi=0;fFlip=false;draw(false);}
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
function mark(s){if(!deck.length)return;status[deck[fi].w]=s;SV("dks_status",status);const wasFiltered=fSt!=="all";fi=(fi+1)%deck.length;fFlip=false;if(wasFiltered)rebuild();else draw(true);}

/* ===== クイズ ===== */
let qMode="mean",qScore=0,qTotal=0;
function buildQuiz(){$("p-quiz").innerHTML=`<div class="subtabs" id="qModes"><button data-q="mean" class="active">意味4択</button><button data-q="listen">聞き取り</button><button data-q="arrange">並べ替え</button></div><div id="qBody"></div>`;
  $("qModes").addEventListener("click",e=>{const b=e.target.closest("[data-q]");if(!b)return;[...$("qModes").children].forEach(x=>x.classList.toggle("active",x===b));qMode=b.dataset.q;qScore=0;qTotal=0;nextQ();});
  nextQ();
}
const rnd=a=>a[Math.random()*a.length|0];
const shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const withEx=()=>CARDS.filter(c=>c.ex);
function nextQ(){if(qMode==="arrange")return arrangeQ();mcQ();}
function mcQ(){const pool=CARDS.filter(c=>c.ja&&c.audio);const c=rnd(pool);const opts=shuf([c].concat(shuf(pool.filter(x=>x.ja!==c.ja)).slice(0,3)));
  const listen=qMode==="listen";
  $("qBody").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">${listen?"音声を聞いて意味を選ぼう":"この単語の意味は？"}</div>
   <div class="qword">${listen?spkBtn(c.audio,c.w).replace('class="spk"','class="spk" style="width:52px;height:52px"'):esc(c.w)+" "+spkBtn(c.audio,c.w)}</div>
   <div class="qopts">${opts.map(o=>`<button data-ok="${o.ja===c.ja?1:0}">${esc(o.ja)}</button>`).join("")}</div>
   <div class="qfb" id="qfb"></div><div class="qfoot"><span class="qscore">スコア ${qScore} / ${qTotal}</span><button class="qnext" id="qnext">次へ →</button></div></div>`;
  if(listen)setTimeout(()=>play(c.audio,c.w,null),200);
  const opt=$("qBody").querySelectorAll(".qopts button");
  opt.forEach(b=>b.addEventListener("click",()=>{if($("qBody").dataset.done)return;$("qBody").dataset.done=1;qTotal++;const ok=b.dataset.ok==="1";if(ok){qScore++;b.classList.add("correct");$("qfb").textContent="Benar! 正解 🎉";$("qfb").style.color="#2e7d3c";}else{b.classList.add("wrong");opt.forEach(x=>{if(x.dataset.ok==="1")x.classList.add("correct");});$("qfb").textContent="Salah… 正解は「"+c.ja+"」";$("qfb").style.color="var(--hl)";try{status[c.w]="weak";SV("dks_status",status);}catch(_){}}$("qBody").querySelector(".qscore").textContent="スコア "+qScore+" / "+qTotal;if(typeof bumpActivity==="function")bumpActivity();}));
  $("qnext").onclick=()=>{$("qBody").dataset.done="";nextQ();};
}
function arrangeQ(){const pool=withEx().filter(c=>{const n=c.ex[0].split(" ").length;return n>=3&&n<=6;});const c=rnd(pool);const words=c.ex[0].replace(/[.?!,]/g,"").split(" ");const jum=shuf(words.slice());
  $("qBody").innerHTML=`<div class="quizbox panelcard"><div class="qprompt">意味：${esc(c.ex[1])}</div><div class="qprompt" style="margin-top:4px">単語を正しい順に並べよう</div>
   <div class="slot" id="qslot"></div><div class="wpool" id="qpool">${jum.map((w,i)=>`<button class="wchip" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div>
   <div class="qfb" id="qfb"></div><div class="qfoot"><span class="qscore">スコア ${qScore} / ${qTotal}</span><button class="qnext" id="qnext">次へ →</button></div></div>`;
  const slot=$("qslot"),poolEl=$("qpool");let picked=[];
  poolEl.querySelectorAll(".wchip").forEach(b=>b.addEventListener("click",()=>{if($("qBody").dataset.done)return;picked.push(b.dataset.w);b.style.visibility="hidden";const s=document.createElement("button");s.className="wchip";s.textContent=b.dataset.w;s.onclick=()=>{s.remove();b.style.visibility="visible";picked=picked.filter((_,idx)=>slot.children[idx]!==s);};slot.appendChild(s);
    if(picked.length===words.length){$("qBody").dataset.done=1;qTotal++;const ok=picked.join(" ")===words.join(" ");if(ok){qScore++;$("qfb").textContent="Benar! 正解 🎉 → "+c.ex[0];$("qfb").style.color="#2e7d3c";}else{$("qfb").textContent="正解: "+c.ex[0];$("qfb").style.color="var(--hl)";}$("qBody").querySelector(".qscore").textContent="スコア "+qScore+" / "+qTotal;play(c.ex[2],c.ex[0],null);}}));
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
    $("fillBody").querySelector(".qscore").textContent="スコア "+fScore+" / "+fTotal;play(it[2],it[0],null);}));
  $("fnext").onclick=nextFill;
}

/* ===== ホーム：アイコンタイル ===== */
const HOME=[["learn","学ぶ","📚","#e2566a","#c0392b"],["practice","練習","🎯","#3aa0d6","#1b6e9e"],["talk","会話","💬","#4bbf7b","#2e7d4f"],
 ["num","数字","🔢","#eb8a4e","#c25a1b"],["news","ニュース","📰","#d1495b","#9c2b3b"],["dict","辞書","📖","#5aa0b5","#2e7d8f"]];
const READS=[["reads:r-info","情報","📋","#6d8f3a","#4d6b22"],["reads:r-daily","日常","🏙️","#4a7c9e","#2e5875"],["reads:r-geo","地理","🗺️","#b58a4c","#8a6224"],["reads:r-hist","歴史","🏛️","#a5794a","#6e4a24"],
 ["reads:r-cult","文化","🇮🇩","#c0392b","#8a1f1f"],["reads:r-japan","日本","🗾","#c96b86","#9e3a57"]];
const tile=h=>{const flag=h[0]==="reads:r-cult";return `<div class="htile" data-goto="${h[0]}"><div class="ic ${flag?"flagic":""}" style="--g1:${h[3]};--g2:${h[4]}">${flag?"":h[2]}</div><div class="lb">${h[1]}</div></div>`;};
$("homeCards").innerHTML=`<div class="homegrid">${HOME.map(tile).join("")}</div>
 <div class="homegroup"><div class="ghead" data-goto="reads:r-info"><div class="gic">🗺️</div><div class="gtxt">読み物</div><div class="gsub">TAP →</div></div><div class="homegrid">${READS.map(tile).join("")}</div></div>`;
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
function applyDark(on){document.documentElement.setAttribute("data-theme",on?"dark":"light");$("setDark").classList.toggle("on",on);SV("dks_dark",on);}
$("btnSettings").onclick=()=>$("setOv").classList.add("on");
$("setDark").onclick=()=>applyDark(document.documentElement.getAttribute("data-theme")!=="dark");
$("setFont").addEventListener("click",e=>{const b=e.target.closest("[data-fs]");if(b)applyFont(b.dataset.fs);});
$("setSpeed").addEventListener("click",e=>{const b=e.target.closest("[data-sp]");if(!b)return;SPEED=+b.dataset.sp;SV("dks_speed",SPEED);[...$("setSpeed").children].forEach(x=>x.classList.toggle("active",x===b));});
$("setRepeat").onclick=()=>{REPEAT=!REPEAT;SV("dks_repeat",REPEAT);$("setRepeat").classList.toggle("on",REPEAT);};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest(".overlay").classList.remove("on"));
document.querySelectorAll(".overlay").forEach(o=>o.addEventListener("click",e=>{if(e.target===o)o.classList.remove("on");}));

/* 起動時：設定復元 */
(function(){const d=LS("dks_dark",false);applyDark(d);const f=LS("dks_font","fs-m");applyFont(f);[...$("setSpeed").children].forEach(x=>x.classList.toggle("active",+x.dataset.sp===SPEED));$("setRepeat").classList.toggle("on",REPEAT);})();

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
function bumpActivity(){const t=_d(0);if(ACT.date!==t){ACT.date=t;ACT.today=0;}ACT.today=(ACT.today||0)+1;SV("dks_act",ACT);renderHomeStats();}
function renderHomeStats(){const el=$("homeStats");if(!el)return;const t=_d(0);const today=(ACT.date===t)?(ACT.today||0):0;const g=ACT.goal||10;const pct=Math.min(100,Math.round(today/g*100));const streak=(ACT.ci===t||ACT.ci===_d(1))?(ACT.streak||0):0;const done=ACT.ci===t;
  el.innerHTML=`<div class="statcard"><div class="stfire">🔥 <b>${streak}</b> 日連続</div><div class="stgoal"><div class="stbar"><span style="width:${pct}%"></span></div><div class="stlbl">今日の学習 ${today} / ${g}${today>=g?" 🎉達成!":""}</div></div><button class="cibtn ${done?"done":""}" id="ciBtn" aria-label="${done?"チェックイン済み":"チェックイン"}">${done?'<svg class="cichk" viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6"/></svg>':"チェックイン"}</button></div>`;
  const cb=$("ciBtn");if(cb)cb.onclick=checkIn;}
function checkIn(){const t=_d(0);const first=ACT.ci!==t;if(first){ACT.streak=(ACT.ci===_d(1))?((ACT.streak||0)+1):1;ACT.ci=t;SV("dks_act",ACT);}renderHomeStats();celebrate(first?("🔥 "+ACT.streak+" 日連続！ チェックイン完了"):"🎉 今日ももう一度！ その調子！");}
function celebrate(msg){
  const colors=["#c0392b","#e0a92b","#2e86c1","#3f9d63","#8e44ad","#e2566a","#ffd36b","#16a085"];
  const emo=["🎉","✨","⭐","🔥","💥","🎊","🌟"];
  for(let i=0;i<64;i++){const p=document.createElement("div");
    if(i%5===0){p.className="confetti emoji";p.textContent=emo[i%emo.length];}
    else{p.className="confetti";p.style.background=colors[i%colors.length];}
    p.style.left=(6+Math.random()*88)+"vw";p.style.setProperty("--x",(Math.random()*340-170)+"px");p.style.setProperty("--r",(Math.random()*1200-600)+"deg");
    p.style.animationDelay=(Math.random()*.28)+"s";p.style.animationDuration=(1.2+Math.random()*1)+"s";
    document.body.appendChild(p);setTimeout(()=>p.remove(),2400);}
  const fl=document.createElement("div");fl.className="celflash";document.body.appendChild(fl);setTimeout(()=>fl.remove(),560);
  const pop=document.createElement("div");pop.className="celpop";pop.textContent="🎉";document.body.appendChild(pop);setTimeout(()=>pop.remove(),950);
  const tst=document.createElement("div");tst.className="celtoast";tst.textContent=msg;document.body.appendChild(tst);
  requestAnimationFrame(()=>tst.classList.add("show"));setTimeout(()=>{tst.classList.remove("show");setTimeout(()=>tst.remove(),350);},1900);
  if(navigator.vibrate)try{navigator.vibrate([15,30,15,30,25]);}catch(e){}
}
renderHomeStats();

let mediaRec=null,recURL=null,recState=0;
async function toggleRec(){const btn=$("fRec");if(recState){try{mediaRec.stop();}catch(e){}return;}
  if(!navigator.mediaDevices||!window.MediaRecorder){alert("この端末では録音に対応していません。");return;}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true});const mr=new MediaRecorder(st);const ch=[];mr.ondataavailable=e=>ch.push(e.data);mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());if(recURL)URL.revokeObjectURL(recURL);recURL=URL.createObjectURL(new Blob(ch));$("fPlayRec").disabled=false;recState=0;btn.classList.remove("rec");btn.textContent="🎙️ 録音";};mediaRec=mr;mr.start();recState=1;btn.classList.add("rec");btn.textContent="■ 停止";}
  catch(e){alert("マイクを使用できません。権限をご確認ください。");}
}
function playRec(){if(recURL){new Audio(recURL).play();}}
function shareCard(){if(!deck.length)return;const c=deck[fi];const text=c.w+"（"+c.ja+"）— インドネシア語学習 Artikula";if(navigator.share){navigator.share({text:text}).catch(()=>{});}else if(navigator.clipboard){navigator.clipboard.writeText(text).then(()=>alert("コピーしました")).catch(()=>{});}else alert(text);}

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
function nqSubmit(){if(nqDone)return;if(nqVal===""){$("nqfb").textContent="数字を入力してください";$("nqfb").style.color="var(--sub)";return;}nqDone=true;nqTotal++;const ok=parseInt(nqVal,10)===nqCur[0],d=$("nqDisp");if(ok){nqScore++;d.classList.add("ok");$("nqfb").textContent="Benar! 🎉 "+nqCur[1];$("nqfb").style.color="#2e7d3c";}else{d.classList.add("ng");$("nqfb").innerHTML="正解: <b>"+nqCur[0].toLocaleString()+"</b>（"+esc(nqCur[1])+"）";$("nqfb").style.color="var(--hl)";}$("nqScoreL").textContent="スコア "+nqScore+" / "+nqTotal;bumpActivity();}

$("rolePlay").onclick=()=>{const on=document.body.classList.toggle("roleplay");$("rolePlay").classList.toggle("on",on);document.querySelectorAll(".line.show").forEach(e=>e.classList.remove("show"));};
$("fBook").onclick=()=>{if(deck.length){const c=deck[fi];toggleBook({id:c.w,ja:c.ja,audio:c.audio});$("fBook").classList.toggle("on",isBooked(c.w));}};
$("fRec").onclick=toggleRec;$("fPlayRec").onclick=playRec;$("fShare").onclick=shareCard;

/* 起動スプラッシュ演出 */
(function(){const sp=$("splash");if(!sp)return;let gone=false;function done(){if(gone)return;gone=true;sp.classList.add("hide");setTimeout(()=>{if(sp.parentNode)sp.remove();},600);}
  sp.addEventListener("click",done);setTimeout(done,3050);})();

/* タブ間スワイプ（左右で移動） */
(function(){let x0=null,y0=null,ok=false;
  document.addEventListener("touchstart",e=>{if(e.touches.length!==1){x0=null;ok=false;return;}const t=e.target;
    if(t.closest(".track")||t.closest("input")||t.closest("select")||t.closest("textarea")||t.closest(".overlay")||t.closest(".splash")||t.closest(".datebar")||t.closest(".numpad")){x0=null;ok=false;return;}
    x0=e.touches[0].clientX;y0=e.touches[0].clientY;ok=true;},{passive:true});
  document.addEventListener("touchend",e=>{if(!ok||x0==null)return;ok=false;const t=e.changedTouches[0];const dx=t.clientX-x0,dy=t.clientY-y0;
    if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.6){const cur=TABS.findIndex(([v])=>{const el=document.querySelector('.view[data-view="'+v+'"]');return el&&el.classList.contains("active");});if(cur<0)return;const ni=cur+(dx<0?1:-1);if(ni<0||ni>=TABS.length)return;showView(TABS[ni][0],dx<0?"l":"r");}
  },{passive:true});})();

/* PWA */
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
let deferredPrompt=null;const installBtn=$("installBtn");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;if(installBtn)installBtn.hidden=false;});
if(installBtn)installBtn.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true;});
/* build: tabs+practice+tools v2 */
