#!/usr/bin/env python3
"""
check-pages.py — look at the pages before anybody else has to.

Every fault this site had today was the same kind: a change that was correct
in the file and wrong on the page, and nothing in between that looked.

  * white paper laid over his photographs to win a contrast number
  * light text set on light bands, so the words simply vanished
  * a form whose stylesheet the page never loaded
  * a magazine block whose class no stylesheet had ever defined
  * content that stayed at opacity:0 forever if one script failed
  * a Spanish homepage linked from two languages and never built

None of it would survive someone opening the page. This does that, with
numbers, against a local copy of the site before it goes out.

It reports, it does not fix. Run it before pushing, and it runs on Mondays
beside check-forms.py.

    python3 _tools/check-pages.py
    python3 _tools/check-pages.py --pages /  /magazine/  /contact/
"""

import argparse
import http.server
import json
import os
import re
import socketserver
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
def _find_chrome():
    """His Mac and the Monday runner keep Chrome in different places."""
    import shutil
    for c in (os.environ.get("CHROME_PATH"),
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              "chromium-browser", "chromium", "google-chrome",
              "google-chrome-stable"):
        if not c:
            continue
        if os.path.exists(c):
            return c
        found = shutil.which(c)
        if found:
            return found
    return ""


CHROME = _find_chrome()

# the pages worth guarding: one of each kind, not all 161
PAGES = [
    "/", "/journal/", "/magazine/", "/magazine/es/", "/magazine/lt/",
    "/human-resilience/", "/community-resilience/", "/healing/",
    "/contact/", "/teams/", "/teaching/", "/workshop/", "/start-here/",
    "/listen/", "/es/", "/ja/", "/lt/", "/india/",
    "/journal/the-first-fire/",
]

# a page that uses these must load that stylesheet, or it renders raw
NEEDS = [
    ('class="enq', "engage.css", "the enquiry form"),
    ("amm__f", "engage.css", "the magazine's found-news items"),
    ("amm__w", "engage.css", "the share wrappers"),
]

# the browser-side audit. same-origin, so it can read the frame.
PROBE = r"""
<!doctype html><meta charset=utf-8><title>probe</title><pre id=out>...</pre>
<script>
var PAGES = __PAGES__, W = __W__, results = [], i = 0;

function lum(c){
  var m = (c||"").match(/[\d.]+/g); if(!m) return null;
  var a = m.slice(0,3).map(function(v){ v=v/255;
    return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
}
// walk up for the first background that actually covers
function bgOf(el, win){
  var e = el;
  while (e && e.nodeType === 1){
    var cs = win.getComputedStyle(e);
    // A gradient or a photograph is a background no single number describes.
    // "Culture in motion" is white on a green gradient and was being reported
    // as white on cream. Say nothing rather than say something false.
    if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
    var b = cs.backgroundColor;
    var m = (b||"").match(/[\d.]+/g);
    if (m && (m.length < 4 || parseFloat(m[3]) > 0.55)) return b;
    e = e.parentElement;
  }
  return "rgb(255,255,255)";
}
function visible(el, win){
  var s = win.getComputedStyle(el);
  if (s.display === "none" || s.visibility === "hidden") return false;
  if (parseFloat(s.opacity) < 0.08) return false;
  var r = el.getBoundingClientRect();
  return r.width > 2 && r.height > 2;
}

function audit(doc, win, page){
  var out = { page: page, unreadable: [], overflow: [], hidden_rv: 0,
              rv_total: 0, footer: 0, images_broken: [], js_ran: false };
  var jsRan = doc.documentElement.classList.contains("rv-on");
  out.js_ran = jsRan;

  // 1. text nobody can read against what is actually behind it
  var SEL = "p,li,h1,h2,h3,h4,h5,span,b,strong,em,i,a,label,td,th,figcaption,summary,button";
  doc.querySelectorAll(SEL).forEach(function(el){
    if (el.querySelector(SEL)) return;              // leaves only
    var t = (el.textContent||"").trim();
    if (t.length < 3) return;
    if (!visible(el, win)) return;
    var cs = win.getComputedStyle(el);
    var bgc = bgOf(el, win);
    if (bgc === null) return;      // sits on a picture or a gradient
    var fg = lum(cs.color), bg = lum(bgc);
    if (fg === null || bg === null) return;
    // text over a photograph gets a shadow; that is a deliberate scrim
    if (cs.textShadow && cs.textShadow !== "none") return;
    var cr = (Math.max(fg,bg) + 0.05) / (Math.min(fg,bg) + 0.05);
    if (cr < 2.2){
      out.unreadable.push({ text: t.slice(0,54), ratio: Math.round(cr*100)/100,
                            color: cs.color, bg: bgc,
                            tag: el.tagName.toLowerCase() });
    }
  });

  // 2. anything pushed past the screen that is not a deliberate scroller
  doc.querySelectorAll("body *").forEach(function(el){
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.right <= W + 1.5) return;
    if (el.closest(".gal,.stage__menu,.stage__dots,.shelf,table")) return;
    var s = win.getComputedStyle(el);
    if (s.overflowX === "auto" || s.overflowX === "scroll") return;
    // A full-bleed photograph is deliberately wider than its band and is
    // cropped by an ancestor that hides the overflow. That is a crop, not a
    // fault. Only report what can actually escape and be lost.
    var a = el.parentElement, clipped = false;
    while (a && a.nodeType === 1 && a !== doc.body){
      var as = win.getComputedStyle(a);
      if (as.overflowX === "auto" || as.overflowX === "scroll") return;
      if (as.overflow === "hidden" || as.overflowX === "hidden" || as.overflow === "clip"){
        clipped = true; break;
      }
      a = a.parentElement;
    }
    if (clipped) return;
    out.overflow.push({ tag: el.tagName.toLowerCase(),
                        cls: String(el.className||"").slice(0,40),
                        over: Math.round(r.right - W) });
  });

  // 3. content still waiting on an animation that may never come
  doc.querySelectorAll(".rv").forEach(function(el){
    // The stages show one scene at a time, so every other scene is hidden on
    // purpose. Only count a block as stuck if nothing above it is
    // deliberately put away -- otherwise the homepage reports 32 of 35
    // invisible and the real thing hides in the noise.
    var a = el.parentElement, byDesign = false;
    while (a && a.nodeType === 1 && a !== doc.body){
      var s2 = win.getComputedStyle(a);
      if (s2.display === "none" || s2.visibility === "hidden" ||
          parseFloat(s2.opacity) < 0.1 || a.hasAttribute("hidden")){ byDesign = true; break; }
      a = a.parentElement;
    }
    if (byDesign) return;
    out.rv_total++;
    // With the reveal script running, a block below the fold is meant to be
    // waiting -- that is the animation, not a fault, and GSAP will not answer
    // a scripted scroll inside this frame. The fault worth catching is the
    // one that hit 161 pages: the script does not run and the content never
    // appears. That is what the fail-safe is for, and it is checked below.
    if (jsRan) return;
    if (parseFloat(win.getComputedStyle(el).opacity) < 0.1) out.hidden_rv++;
  });

  // 4. a page that lost its footer
  var f = doc.querySelector("footer,.ftr");
  out.footer = f ? Math.round(f.getBoundingClientRect().height) : 0;

  // 5. pictures that did not load
  doc.querySelectorAll("img").forEach(function(im){
    if (im.complete && im.naturalWidth === 0 && im.getAttribute("src"))
      out.images_broken.push(im.getAttribute("src").slice(0,70));
  });
  return out;
}

(function next(){
  if (i >= PAGES.length){
    document.getElementById("out").textContent = "__JSON__" + JSON.stringify(results);
    return;
  }
  var page = PAGES[i++];
  var f = document.createElement("iframe");
  f.style.cssText = "width:" + W + "px;height:900px;border:0;position:absolute;left:-9999px";
  f.src = page;
  document.body.appendChild(f);
  var done = false;
  function finish(){
    if (done) return; done = true;
    try { results.push(audit(f.contentDocument, f.contentWindow, page)); }
    catch (e) { results.push({ page: page, error: String(e).slice(0,120) }); }
    f.remove(); next();
  }
  f.onload = function(){
    // Walk the frame down its own height so the reveal observer fires, the
    // way a reader scrolling would. Without this every .rv block reads as
    // permanently invisible and the check cries wolf on every page.
    try {
      var w = f.contentWindow, d2 = f.contentDocument;
      var h = d2.documentElement.scrollHeight, step = 700, y = 0;
      var walk = setInterval(function(){
        y += step; w.scrollTo(0, y);
        if (y >= h) { clearInterval(walk); w.scrollTo(0, 0); setTimeout(finish, 900); }
      }, 24);
      setTimeout(function(){ clearInterval(walk); finish(); }, 7000);
    } catch (e) { setTimeout(finish, 2100); }
  };
  setTimeout(finish, 9000);
})();
</script>
"""


def serve(directory):
    class Q(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(directory), **k)

        def log_message(self, *a):
            pass

        # Chrome drops a connection whenever a probe iframe is removed. That
        # is normal here and must not drown the report in tracebacks.
        def handle_one_request(self):
            try:
                super().handle_one_request()
            except (BrokenPipeError, ConnectionResetError):
                self.close_connection = True

    class Quiet(socketserver.TCPServer):
        allow_reuse_address = True

        def handle_error(self, request, client_address):
            pass                      # same reason as above

    srv = Quiet(("127.0.0.1", 0), Q)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


BATCH = 1          # one page per browser.
                   # A batch is only as good as its slowest page, and /listen/
                   # carries YouTube embeds that never resolve in headless, so
                   # every page sharing its browser reported "did not finish"
                   # -- three good pages failing because of one. One each.


def _probe_batch(port, pages, width, n):
    html = (PROBE.replace("__PAGES__", json.dumps(pages))
                 .replace("__W__", str(width)))
    probe = ROOT / ("_probe%d.html" % n)
    probe.write_text(html, encoding="utf-8")
    try:
        out = subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
             # keep the probe on his own site; a third-party embed that never
             # answers must not decide whether his pages get checked
             "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost",
             # each page may take up to nine seconds now that the probe walks it
             # down before measuring; a tighter budget made Chrome dump the DOM
             # mid-probe and three pages reported "did not finish" every time
             "--virtual-time-budget=%d" % (6000 + 13000 * len(pages)),
             "--dump-dom", "http://127.0.0.1:%d/%s" % (port, probe.name)],
            capture_output=True, text=True, timeout=240).stdout
    except subprocess.TimeoutExpired:
        return [{"page": p, "error": "the browser did not finish"} for p in pages]
    finally:
        probe.unlink(missing_ok=True)
    m = re.search(r"__JSON__(\[.*?\])</pre>", out, re.S)
    if not m:
        return [{"page": p, "error": "no readings came back"} for p in pages]
    return json.loads(m.group(1).replace("&quot;", '"').replace("&amp;", "&")
                                 .replace("&lt;", "<").replace("&gt;", ">"))


def run_probe(port, pages, width):
    res = []
    for n, i in enumerate(range(0, len(pages), BATCH)):
        res.extend(_probe_batch(port, pages[i:i + BATCH], width, n))
    return res


def check_stylesheets(pages):
    """A page that uses a component must load the file that styles it."""
    faults = []
    for p in pages:
        f = ROOT / p.strip("/") / "index.html" if p != "/" else ROOT / "index.html"
        if not f.exists():
            faults.append((p, "PAGE DOES NOT EXIST", ""))
            continue
        s = f.read_text(encoding="utf-8", errors="ignore")
        for marker, sheet, what in NEEDS:
            if marker in s and sheet not in s:
                faults.append((p, "missing " + sheet, what))
    return faults


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", nargs="*", default=PAGES)
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--mobile", action="store_true", help="also check at 390px")
    args = ap.parse_args()

    if not CHROME:
        print("No Chrome or Chromium found. Set CHROME_PATH to one.")
        return 2

    srv, port = serve(ROOT)
    problems = 0
    try:
        print("1 — the stylesheet a page needs")
        sf = check_stylesheets(args.pages)
        if sf:
            for p, what, why in sf:
                print("   FAULT %-26s %s   %s" % (p, what, why))
            problems += len(sf)
        else:
            print("   ok    every page loads what its own components need")

        widths = [args.width] + ([390] if args.mobile else [])
        for w in widths:
            print("\n2 — the pages themselves at %dpx" % w)
            res = run_probe(port, args.pages, w)
            if res is None:
                print("   could not read the probe output")
                return 2
            for r in res:
                p = r["page"]
                if r.get("error"):
                    print("   FAULT %-26s %s" % (p, r["error"])); problems += 1; continue
                bits = []
                if r["unreadable"]:
                    bits.append("%d unreadable" % len(r["unreadable"]))
                if r["overflow"]:
                    worst = max(x["over"] for x in r["overflow"])
                    bits.append("%d past the edge (worst %dpx)" % (len(r["overflow"]), worst))
                if r["hidden_rv"]:
                    bits.append("%d/%d still invisible" % (r["hidden_rv"], r["rv_total"]))
                if not r["footer"]:
                    bits.append("no footer")
                if r["images_broken"]:
                    bits.append("%d broken image(s)" % len(r["images_broken"]))
                if bits:
                    problems += 1
                    print("   FAULT %-26s %s" % (p, "; ".join(bits)))
                    for u in r["unreadable"][:3]:
                        print("           %.2f:1  %s on %s  “%s”"
                              % (u["ratio"], u["color"], u["bg"], u["text"]))
                    for o in r["overflow"][:3]:
                        print("           %s.%s over by %dpx" % (o["tag"], o["cls"], o["over"]))
                    for b in r["images_broken"][:3]:
                        print("           broken: %s" % b)
                else:
                    print("   ok    %-26s %d blocks shown, footer %dpx"
                          % (p, r["rv_total"], r["footer"]))
    finally:
        srv.shutdown()

    print()
    if problems:
        print("%d page(s) need a look before this goes out." % problems)
        return 1
    print("Every page checked reads, fits, shows its content and keeps its footer.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
