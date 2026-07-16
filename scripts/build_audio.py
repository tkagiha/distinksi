# -*- coding: utf-8 -*-
"""cards.js のうち音声を持たない語の mp3 を生成し、audio フィールドを埋める。
   すでにファイルがあるものは作り直さない（何度実行しても安全）。"""
import json, os, re, sys, time
from gtts import gTTS

BASE = os.getcwd()
CJS = os.path.join(BASE, "cards.js")
OUT = os.path.join(BASE, "audio", "w")
os.makedirs(OUT, exist_ok=True)

def slug(w):
    # アプリ側の規則に合わせる: "audio/w/" + word.replace("/", "_") + ".mp3"
    return w.replace("/", "_")

src = open(CJS, encoding="utf-8").read()
cards = json.loads(src[src.index("["):src.rindex("]") + 1])

todo = [c for c in cards if not c.get("audio")]
print("音声が必要なカード: %d 枚" % len(todo))

made = skipped = failed = 0
for i, c in enumerate(todo):
    name = slug(c["w"]) + ".mp3"
    path = os.path.join(OUT, name)
    rel = "audio/w/" + name
    if os.path.exists(path) and os.path.getsize(path) > 500:
        c["audio"] = rel; skipped += 1; continue
    ok = False
    for attempt in range(4):
        try:
            gTTS(c["w"], lang="id", slow=False).save(path)
            ok = os.path.getsize(path) > 500
            if ok: break
        except Exception as e:
            time.sleep(2 + attempt * 3)      # 混みあうことがあるので待って再試行
    if ok:
        c["audio"] = rel; made += 1
    else:
        failed += 1
        print("WARN: 生成できず: %s" % c["w"])
    if (i + 1) % 100 == 0:
        print("  ... %d/%d 済 (新規 %d / 既存 %d / 失敗 %d)" % (i + 1, len(todo), made, skipped, failed))
    time.sleep(0.25)                          # 連続アクセスを避ける

open(CJS, "w", encoding="utf-8").write("window.CARDS = " + json.dumps(cards, ensure_ascii=False) + ";\n")
left = len([c for c in cards if not c.get("audio")])
print("完了: 新規 %d / 既存流用 %d / 失敗 %d / 音声なしの残り %d 枚" % (made, skipped, failed, left))
if failed and made == 0:
    sys.exit("ERROR: 1件も生成できませんでした")
