#!/usr/bin/env python3
"""
photo-library.py — catalogue every photograph in Dropbox without moving any of them.

Tony, 19 October 2026: "organize every pic... all of them in drop box."

There are about 57,600 images in there. This never moves, renames, deletes or
rewrites a single original. It reads them, records what it finds, writes small
thumbnails and contact sheets into one new folder, and leaves everything else
exactly where it was. If the catalogue is wrong you delete the catalogue.

    python3 _tools/photo-library.py              # build, resuming where it stopped
    python3 _tools/photo-library.py --scan-only  # just count and index, no images

Output, all inside Dropbox/PHOTO-LIBRARY/:
    index.json              every image: path, date, size, dimensions, folder
    BROWSE.html             open this; year and month, with the sheets inline
    thumbs/<year>/<month>/  240px thumbnails
    sheets/<year>-<month>-<n>.jpg   contact sheets, 40 to a sheet, numbered
    progress.json           so a long run can be stopped and resumed

Dates come from EXIF DateTimeOriginal where present, and fall back to the file's
own modification time, which is recorded as a guess rather than a fact.
"""

import argparse
import datetime
import multiprocessing as mp
import glob
import io
import json
import os
import sys

from PIL import Image, ImageDraw
try:
    from PIL import ExifTags
    DATE_TAGS = {k for k, v in ExifTags.TAGS.items()
                 if v in ("DateTimeOriginal", "DateTimeDigitized", "DateTime")}
except Exception:
    DATE_TAGS = set()

HOME = os.path.expanduser("~")
SRC = os.path.join(HOME, "Library/CloudStorage/Dropbox")
OUT = os.path.join(SRC, "PHOTO-LIBRARY")
EXT = (".jpg", ".jpeg", ".png", ".heic", ".heif", ".tif", ".tiff", ".webp")
SKIP = ("PHOTO-LIBRARY", ".dropbox.cache", "/.git/", "node_modules")
THUMB, PER_SHEET, COLS = 240, 40, 8


def find_images():
    for root, dirs, files in os.walk(SRC):
        if any(s in root for s in SKIP):
            dirs[:] = []
            continue
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in files:
            if f.startswith("."):
                continue
            if f.lower().endswith(EXT):
                yield os.path.join(root, f)


def taken(path, im=None):
    """EXIF date if there is one, otherwise the file's own mtime, flagged as a guess."""
    try:
        ex = (im or Image.open(path))._getexif()
        if ex:
            for t in DATE_TAGS:
                v = ex.get(t)
                if v and isinstance(v, str) and len(v) >= 10:
                    return v[:10].replace(":", "-"), True
    except Exception:
        pass
    try:
        return datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat(), False
    except Exception:
        return "0000-00-00", False


def _one(job):
    """One image, in a worker process. Reads the original; never writes to it."""
    p, scan_only = job
    try:
        im = Image.open(p)
        w, h = im.size
        when, exact = taken(p, im)
        rec = {"src": p, "date": when, "date_exact": exact, "w": w, "h": h,
               "bytes": os.path.getsize(p),
               "folder": os.path.relpath(os.path.dirname(p), SRC)}
        if not scan_only:
            y, mo = (when[:4], when[5:7]) if when[0] != "0" else ("undated", "00")
            td = os.path.join(OUT, "thumbs", y, mo)
            os.makedirs(td, exist_ok=True)
            tp = os.path.join(td, "%s.jpg" % abs(hash(p)))
            if not os.path.exists(tp):
                im.draft("RGB", (THUMB * 2, THUMB * 2))
                t = im.convert("RGB")
                t.thumbnail((THUMB, THUMB), Image.LANCZOS)
                t.save(tp, quality=82, optimize=True)
            rec["thumb"] = os.path.relpath(tp, OUT)
        return rec
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scan-only", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="stop after N new images")
    ap.add_argument("--workers", type=int, default=50, help="parallel workers")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    prog_path = os.path.join(OUT, "progress.json")
    index_path = os.path.join(OUT, "index.json")
    done = {}
    if os.path.exists(index_path):
        try:
            done = {r["src"]: r for r in json.load(open(index_path))}
            print("  resuming: %d already catalogued" % len(done))
        except Exception:
            done = {}

    print("  walking Dropbox...")
    paths = list(find_images())
    print("  %d images found" % len(paths))

    todo = [p for p in paths if p not in done]
    if args.limit:
        todo = todo[:args.limit]
    print("  %d to catalogue, %d workers" % (len(todo), args.workers), flush=True)

    new, failed = [], 0
    if todo:
        with mp.Pool(args.workers) as pool:
            for i, rec in enumerate(pool.imap_unordered(
                    _one, ((p, args.scan_only) for p in todo), chunksize=8), 1):
                if rec is None:
                    failed += 1
                else:
                    new.append(rec)
                if i % 500 == 0:
                    print("  ...%d of %d" % (i, len(todo)), flush=True)
                    json.dump(list(done.values()) + new, open(index_path, "w"))
                    json.dump({"done": len(done) + len(new), "total": len(paths)},
                              open(prog_path, "w"))

    records = list(done.values()) + new
    json.dump(records, open(index_path, "w"))
    print("\n  catalogued %d new, %d total, %d unreadable" % (len(new), len(records), failed))

    # ---- contact sheets, by month
    if not args.scan_only:
        by = {}
        for r in records:
            if "thumb" not in r:
                continue
            key = r["date"][:7] if r["date"][0] != "0" else "undated"
            by.setdefault(key, []).append(r)
        os.makedirs(os.path.join(OUT, "sheets"), exist_ok=True)
        made = 0
        for key in sorted(by):
            rs = sorted(by[key], key=lambda r: r["date"])
            for i in range(0, len(rs), PER_SHEET):
                chunk = rs[i:i + PER_SHEET]
                name = "%s-%02d.jpg" % (key, i // PER_SHEET + 1)
                sp = os.path.join(OUT, "sheets", name)
                if os.path.exists(sp):
                    continue
                rows = (len(chunk) + COLS - 1) // COLS
                cw = ch = THUMB + 8
                sheet = Image.new("RGB", (COLS * cw, rows * (ch + 14)), (255, 255, 255))
                d = ImageDraw.Draw(sheet)
                for j, r in enumerate(chunk):
                    try:
                        t = Image.open(os.path.join(OUT, r["thumb"])).convert("RGB")
                    except Exception:
                        continue
                    x, y = (j % COLS) * cw, (j // COLS) * (ch + 14)
                    sheet.paste(t, (x + 4 + (THUMB - t.width) // 2,
                                    y + 14 + (THUMB - t.height) // 2))
                    d.text((x + 5, y + 2), "%d" % (i + j + 1), fill=(170, 0, 0))
                sheet.save(sp, quality=84, optimize=True)
                made += 1
        print("  %d new contact sheets" % made)

        # ---- one page to open
        months = sorted(by, reverse=True)
        h = ['<!doctype html><meta charset="utf-8"><title>Photo library</title>',
             '<style>body{margin:0;padding:30px 20px 80px;background:#efeee9;color:#3b3020;',
             'font-family:-apple-system,"Segoe UI",Roboto,sans-serif}',
             '.w{max-width:1100px;margin:0 auto}h1{font:700 28px/1.2 Palatino,Georgia,serif;margin:0 0 4px}',
             '.sub{color:#6d6350;margin:0 0 28px}h2{font:700 17px/1 Palatino,Georgia,serif;',
             'margin:34px 0 10px;border-top:1px solid #e2d9c4;padding-top:14px}',
             '.n{font-weight:400;color:#8a7f66;font-size:14px}img{width:100%;height:auto;',
             'display:block;margin:0 0 10px;border:1px solid #e2d9c4;background:#fff}</style>',
             '<div class="w"><h1>Photo library</h1>',
             '<p class="sub">%d photographs, catalogued in place. Nothing was moved. '
             'Originals are listed in index.json.</p>' % len(records)]
        for mkey in months:
            sheets = sorted(glob.glob(os.path.join(OUT, "sheets", "%s-*.jpg" % mkey)))
            if not sheets:
                continue
            h.append('<h2>%s <span class="n">&middot; %d photographs</span></h2>'
                     % (mkey, len(by[mkey])))
            for sp in sheets:
                h.append('<img loading="lazy" src="sheets/%s">' % os.path.basename(sp))
        h.append("</div>")
        io.open(os.path.join(OUT, "BROWSE.html"), "w", encoding="utf-8").write("\n".join(h))
        print("  wrote BROWSE.html")

    print("\n  Everything is in %s" % OUT)
    print("  No original was moved, renamed or changed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
