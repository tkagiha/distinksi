# -*- coding: utf-8 -*-
"""例文音声を生成する。
   対象は cards.js の ex[2] が audio/ex/ を指すものだけ。
   会話・ドライバー等から流用した既存 mp3（audio/s*, audio/d*, audio/w*）には触れない。"""
import json, os, sys, time, hashlib
from gtts import gTTS

BASE = os.getcwd()
CJS = os.path.join(BASE, "cards.js")
OUT = os.path.join(BASE, "audio", "ex")
os.makedirs(OUT, exist_ok=True)

src = open(CJS, encoding="utf-8").read()
cards = json.loads(src[src.index("["):src.rindex("]") + 1])

todo = []
for c in cards:
    ex = c.get("ex")
    if not ex or not ex[2].startswith("audio/ex/"):
        continue
    # ファイル名は本文のハッシュ。文を書き換えれば名前も変わるのでズレない。
    want = "audio/ex/" + hashlib.sha1(ex[0].encode("utf-8")).hexdigest()[:10] + ".mp3"
    if ex[2] != want:
        ex[2] = want
    todo.append(c)

print("例文音声の対象: %d 本" % len(todo))
made = skipped = failed = 0
for i, c in enumerate(todo):
    path = os.path.join(BASE, c["ex"][2])
    if os.path.exists(path) and os.path.getsize(path) > 500:
        skipped += 1
        continue
    ok = False
    for attempt in range(4):
        try:
            gTTS(c["ex"][0], lang="id", slow=False).save(path)
            ok = os.path.getsize(path) > 500
            if ok:
                break
        except Exception:
            time.sleep(2 + attempt * 3)
    if ok:
        made += 1
    else:
        failed += 1
        c["ex"][2] = ""        # 作れなければ空にして、アプリ側の読み上げに任せる
        print("WARN: 生成できず: %s" % c["ex"][0][:40])
    if (i + 1) % 50 == 0:
        print("  ... %d/%d (新規 %d / 既存 %d / 失敗 %d)" % (i + 1, len(todo), made, skipped, failed))
    time.sleep(0.25)

open(CJS, "w", encoding="utf-8").write("window.CARDS = " + json.dumps(cards, ensure_ascii=False) + ";\n")

# 参照されなくなった例文音声を掃除
refs = {os.path.basename(c["ex"][2]) for c in cards if c.get("ex") and c["ex"][2].startswith("audio/ex/")}
removed = 0
for f in os.listdir(OUT):
    if f not in refs:
        try:
            os.remove(os.path.join(OUT, f)); removed += 1
        except Exception:
            pass
print("完了: 新規 %d / 既存 %d / 失敗 %d / 不要削除 %d" % (made, skipped, failed, removed))
if failed and made == 0:
    sys.exit("ERROR: 1件も生成できませんでした")
