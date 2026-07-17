# -*- coding: utf-8 -*-
# 毎朝実行：Antaraの実ニュースを取得し、出典リンク＋画像＋日本語訳＋音声で
# extra.js の REALNEWS / REALNEWS_WEEK を更新（過去7日分を保持）。
import json, re, os, html, time, datetime, email.utils, urllib.request, urllib.parse
from gtts import gTTS
import hashlib

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
    # 2026-07 時点: nasional/megapolitan は廃止、metro/politik/hukum/ekonomi は更新が止まっている。
    # 実際に毎時更新されているのは terkini / top-news の2本だけ。
    FEEDS = ["terkini", "top-news"]
    MAX_AGE_H = 24            # 24時間以内に出た記事だけを扱う（＝その日の出来事）
    # 国内の出来事だけにする: 以下のいずれかが見出しにあることを条件にする
    INDO = ("indonesia", "jakarta", " ri ", "prabowo", "kpk", "dpr", "dpd", "mpr", "polri", "polda",
            "polres", "tni", "dki", "bali", "jawa", "sumatra", "sumatera", "sulawesi", "papua",
            "kalimantan", "maluku", "aceh", "medan", "surabaya", "bandung", "yogyakarta", "solo",
            "semarang", "makassar", "palembang", "padang", "lampung", "bekasi", "depok", "bogor",
            "tangerang", "banten", "riau", "jambi", "kemenhut", "kemenkeu", "kemendag", "kemkomdigi",
            "kementerian", "pemprov", "pemkot", "pemkab", "gubernur", "bupati", "wali kota",
            "rupiah", "bmkg", "bumn", "pertamina", "garuda", "nusantara", "ntt", "ntb", "karhutla")
    PER_FEED = 8          # 1フィードあたり上限（同じ話題の連続を防ぐ）
    # 人物プロフィール／経歴紹介系は除外（出来事のニュースだけにする）
    BLOCK = ("profil", "sosok", "riwayat", "biodata", "mengenal ", "siapa itu",
             "mengenang", "kilas balik", "deretan", "rekomendasi", "inilah",
             "tips", "cara ", "panduan", "simak", "ketahui", "ingin coba", "jenis ",
             "daftar ", "apa itu", "apakah ", "bolehkah", "bisakah", "benarkah",
             "apa alasan", "ini alasan", "ini fakta", "hikmah", "berikut ",
             "link live streaming", "jadwal dan link", "sinopsis", "zodiak", "ramalan")
    picked, seen = [], set()
    # 過去7日ぶんで既に配信済みのリンク・見出しを読み込み、重複を除く
    _old = open(NJS, encoding="utf-8").read() if os.path.exists(NJS) else ""
    used_links, used_titles = set(), set()
    for _d in parse_arr(_old, "REALNEWS_WEEK"):
        for _it in _d.get("items", []):
            if _it.get("url"): used_links.add(_it["url"])
            if _it.get("id"): used_titles.add(_it["id"].strip().lower())
    print("既配信の記事: %d 本（この分は除外する）" % len(used_titles))

    def g_of(it, tag):
        m = re.search(r"<" + tag + r">(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</" + tag + r">", it, re.S)
        return html.unescape(m.group(1).strip()) if m else ""

    STOP = set(("yang","dan","di","ke","dari","untuk","dengan","pada","ini","itu",
                "adalah","akan","bisa","dapat","tidak","ada","juga","atau","para",
                "saat","usai","soal","jadi","agar","hingga","dalam","atas","bagi"))
    def keys_of(title):
        ws = re.findall(r"[a-z]{4,}", title.lower())
        return set(w for w in ws if w not in STOP)
    picked_keys = []
    def too_similar(title):
        k = keys_of(title)
        if not k:
            return False
        for pk in picked_keys:
            inter = len(k & pk)
            if inter >= 3 or (pk and inter / max(1, min(len(k), len(pk))) >= 0.5):
                return True          # 同じ話題の焼き直し
        return False
    dead = []
    def harvest(feed, cap):
        n = 0
        try:
            rss = fetch("https://www.antaranews.com/rss/%s.xml" % feed)
        except Exception as e:
            print("WARN: feed '%s' unavailable (%s)" % (feed, e))
            if feed not in dead:
                dead.append(feed)
            return
        for it in re.findall(r"<item>(.*?)</item>", rss, re.S):
            if n >= cap or len(picked) >= 10:
                return
            title, link = g_of(it, "title"), g_of(it, "link")
            im = re.search(r'<enclosure[^>]*url="([^"]+)"', it)
            img = im.group(1) if im else ""
            if not (title and link and img) or link in seen:
                continue
            try:                                  # 24時間以内の記事だけ
                age = (datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7)))
                       - email.utils.parsedate_to_datetime(g_of(it, "pubDate"))).total_seconds() / 3600
            except Exception:
                continue
            if age > MAX_AGE_H:
                continue
            if not any(k in (" " + title.lower() + " ") for k in INDO):
                continue                          # 国内の手がかりがない＝海外ニュース
            if link in used_links or title.strip().lower() in used_titles:
                continue                      # 昨日までに配信済み
            if any(b in title.lower() for b in BLOCK):
                continue
            if too_similar(title):
                continue
            seen.add(link)
            picked_keys.append(keys_of(title))
            picked.append((title, link, img))
            n += 1

    for f in FEEDS:
        harvest(f, PER_FEED)
    if len(picked) < 10:                 # 不足分は同じフィードから補充
        for f in FEEDS:
            harvest(f, 50)
            if len(picked) >= 10:
                break
    if dead:
        print("WARN: dead feeds:", ", ".join(dead))
    if len(picked) < 10:
        print("WARN: only %d/10 articles collected" % len(picked))
    if not picked:
        raise SystemExit("ERROR: no items fetched — all feeds failed. Check RSS paths.")

    today = (datetime.datetime.utcnow()+datetime.timedelta(hours=7)).date().isoformat()  # WIB (GMT+7)
    REAL = []
    for i, (title, link, img) in enumerate(picked):
        ja = translate(title)
        h = hashlib.sha1(title.encode("utf-8")).hexdigest()[:10]
        fn = "realnews/%s_%s.mp3" % (today, h)
        path = os.path.join(BASE, "audio", fn)
        if not os.path.exists(path):
            for _ in range(3):
                try:
                    gTTS(title, lang="id", slow=False).save(path); break
                except Exception:
                    time.sleep(2)
        # 生成できなければ音声パスを空に（アプリ側の読み上げにフォールバックし、文とズレない）
        au = ("audio/" + fn) if os.path.exists(path) else ""
        REAL.append({"title": ja[:24], "id": title, "ja": ja, "emoji": EMO[i % len(EMO)],
                     "img": img, "svg": "", "url": link, "audio": au})

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
