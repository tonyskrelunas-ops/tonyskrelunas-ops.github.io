#!/bin/sh
# Does the content survive the reveal script never running? That was the
# fault on 161 pages: .rv sat at opacity:0 forever and whole sections, and
# some footers, were simply absent for the reader.
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for p in "$@"; do
  n=$(echo "$p" | tr -d '/'); n=${n:-home}
  "$CHROME" --headless=new --disable-gpu --disable-javascript --hide-scrollbars \
    --window-size=1280,4000 --virtual-time-budget=6000 \
    --screenshot="/tmp/nojs-$n.png" "http://127.0.0.1:8899$p" >/dev/null 2>&1
  python3 - "$n" <<'PY'
import sys
from PIL import Image, ImageStat
n=sys.argv[1]
im=Image.open(f"/tmp/nojs-{n}.png").convert('RGB')
sd=sum(ImageStat.Stat(im).stddev)/3
print(f"  /{n}  with scripts off: tonal spread {sd:.0f}  {'ok, content is there' if sd>18 else 'FLAT — content may be missing'}")
PY
done
