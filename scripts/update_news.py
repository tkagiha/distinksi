# -*- coding: utf-8 -*-
# 毎朝実行：Antaraの実ニュースを取得し、出典リンク＋画像＋日本語訳＋音声で
# extra.js の REALNEWS / REALNEWS_WEEK を更新（過去7日分を保持）。
import json, re, os, html, time, datetime, urllib.request, urllib.parse
from gtts import gTTS

BASE = os.getcwd()
AUD = os.path.join(BASE, "audio", "realnews")
os.makedirs(AUD, exist_ok=True)
EJS = os.path.join(BASE, "extra.js")
NJS = os.path.join(BASE, "news.js")
UA = {"User-Agent": "Mozilla/5.0 (compatible; ArtikulaBot/1.0)"}
EMO = ["📰","🗞️","🌏","🏛️","⚽","💰","🎬","🌦️","🚉","🔬","🎓","🕌"]

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")

def translate(text):
    try:
        u = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=ja&dt=t&q=" + urllib.parse.quote(text)
        d = json.loads(fetch(u))
        return "".join(seg[0] for seg in d[0]).strip()
    except Exception:
        return text

def parse_arr(src, name):
    m = re.search(r"window\." + name + r"\s*=\s*(\[.*?\]);\s*(?:window\.|$)", src, re.S)
    return json.loads(m.group(1)) if m else []

def main():
    # インドネシア国内の出来事を扱うフィードのみ（dunia/international は使わない）
    FEEDS = ["nasional", "megapolitan", "politik", "hukum"]
    PER_FEED = 3          # 1フィードあたり上限（同じ話題の連続を防ぐ）
    picked, seen = [], set()

    def g_of(it, tag):
        m = re.search(r"<" + tag + r">(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</" + tag + r">", it, re.S)
        return html.unescape(m.group(1).strip()) if m else ""

    def harvest(feed, cap):
        n = 0
        try:
            rss = fetch("https://www.antaranews.com/rss/%s.xml" % feed)
        except Exception:
            return
        for it in re.findall(r"<item>(.*?)</item>", rss, re.S):
            if n >= cap or len(picked) >= 10:
                return
            title, link = g_of(it, "title"), g_of(it, "link")
            im = re.search(r'<enclosure[^>]*url="([^"]+)"', it)
            img = im.group(1) if im else ""
            if title and link and img and link not in seen:
                seen.add(link)
                picked.append((title, link, img))
                n += 1

    for f in FEEDS:
        harvest(f, PER_FEED)
    if len(picked) < 10:                 # 不足分は国内フィードから補充
        harvest("nasional", 10)
    if len(picked) < 10:
        for f in FEEDS:
            harvest(f, 10)
            if len(picked) >= 10:
                break
    if not picked:
        print("no items fetched; abort"); return

    today = (datetime.datetime.utcnow()+datetime.timedelta(hours=7)).date().isoformat()  # WIB (GMT+7)
    REAL = []
    for i, (title, link, img) in enumerate(picked):
        ja = translate(title)
        fn = "realnews/%s_r%02d.mp3" % (today, i)
        path = os.path.join(BASE, "audio", fn)
        if not os.path.exists(path):
            for _ in range(3):
                try:
                    gTTS(title, lang="id", slow=False).save(path); break
                except Exception:
                    time.sleep(2)
        REAL.append({"title": ja[:24], "id": title, "ja": ja, "emoji": EMO[i % len(EMO)],
                     "img": img, "svg": "", "url": link, "audio": "audio/" + fn})

    et = open(NJS, encoding="utf-8").read() if os.path.exists(NJS) else ""
    week = parse_arr(et, "REALNEWS_WEEK")
    week = [w for w in week if w.get("date") != today]
    week.insert(0, {"date": today, "real": True, "items": REAL})
    week = week[:7]

    out = "window.REALNEWS = %s;\n" % json.dumps(REAL, ensure_ascii=False)
    out += "window.REALNEWS_WEEK = %s;\n" % json.dumps(week, ensure_ascii=False)
    out += 'window.NEWS_UPDATED = "%s";\n' % today
    open(NJS, "w", encoding="utf-8").write(out)

    # 参照されていない実ニュース音声を削除
    refs = set()
    for w in week:
        for it in w["items"]:
            a = it.get("audio", "")
            if a.startswith("audio/realnews/"):
                refs.add(os.path.basename(a))
    for f in os.listdir(AUD):
        if f not in refs:
            try: os.remove(os.path.join(AUD, f))
            except Exception: pass
    print("updated:", len(REAL), "articles; week days:", len(week))

if __name__ == "__main__":
    main()
