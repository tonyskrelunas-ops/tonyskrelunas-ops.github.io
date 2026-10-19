#!/usr/bin/env python3
"""
build-private-page.py — publish a page only Tony can read.

Why this exists. Tony, 19 October 2026: the research "is a webpage that only i
have access to and it grows.. its on website but is one only i can see.. so i
can review by my phone if needed.. also should have a tessa voice option for
every section."

The honest constraint: GitHub Pages is static hosting with no server-side
authentication. There is no login to put in front of a page. Hiding it behind
an unguessable path is obscurity, not protection — anyone who learns the URL
reads everything.

So the content is genuinely encrypted instead. The page ships ciphertext.
A passphrase he types derives a key with PBKDF2-SHA256 (310,000 iterations)
and decrypts AES-256-GCM in his browser. The ciphertext is public and useless
without the passphrase; the passphrase never leaves his device and is never in
the repository. Wrong passphrase fails the GCM tag and decrypts to nothing —
there is no partial read.

Every section also gets a Listen button, which uses the browser's own speech
synthesis and prefers the Tessa voice when the device has it. No audio files
are generated, so nothing readable is ever sitting in the repo.

    python3 _tools/build-private-page.py body.html --out watch/<path>/index.html
    python3 _tools/build-private-page.py body.html --out ... --passphrase-file ~/.fuel_passphrase

`body.html` is the inner HTML of the page — headings and prose, no <html> or
<head>. Sections are split on <h2> for the Listen buttons.
"""

import argparse
import base64
import hashlib
import io
import os
import re
import secrets
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ITER = 310_000


def die(m):
    sys.exit("  STOPPED: %s" % m)


def encrypt(plaintext, passphrase):
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", passphrase.encode(), salt, ITER, dklen=32)
    iv = secrets.token_bytes(12)
    ct = AESGCM(key).encrypt(iv, plaintext.encode(), None)
    b64 = lambda b: base64.b64encode(b).decode()
    return b64(salt), b64(iv), b64(ct)


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
<title>&nbsp;</title>
<style>
  :root{--cream:#FAF6EC;--paper:#efeee9;--ink:#3b3020;--gold:#B98D3E;--rule:#e2d9c4;
    --mute:#6d6350;--deep:#2f2a20;--flag:#8a2b1f}
  *{box-sizing:border-box}
  body{margin:0;padding:22px 14px 90px;background:var(--paper);color:var(--ink);
    font-family:"TeX Gyre Pagella",Palatino,"Palatino Linotype","Book Antiqua",Georgia,serif;
    -webkit-text-size-adjust:100%}
  .wrap{max-width:860px;margin:0 auto}
  #gate{max-width:420px;margin:14vh auto;text-align:center}
  #gate h1{font-size:1.1rem;font-weight:400;color:var(--mute);letter-spacing:.2em;
    text-transform:uppercase;margin:0 0 1.6rem}
  #pw{width:100%;padding:14px 16px;font-size:17px;border:1px solid var(--rule);
    background:var(--cream);color:var(--ink);border-radius:4px;font-family:inherit}
  #go{margin-top:12px;width:100%;padding:14px;font-size:16px;font-weight:700;border:0;
    border-radius:4px;background:var(--gold);color:#fff;cursor:pointer;font-family:inherit}
  #msg{margin-top:14px;font-size:14px;color:var(--flag);min-height:1.2em}
  .sheet{background:var(--cream);border:1px solid var(--rule);padding:clamp(22px,4vw,52px)}
  h1,h2,h3{color:var(--deep);letter-spacing:-.01em}
  .sheet h1{font-size:clamp(1.9rem,1.3rem+2.2vw,2.8rem);line-height:1.1;margin:0 0 .2rem}
  h2{font-size:clamp(1.25rem,1.1rem+1vw,1.7rem);line-height:1.22;margin:2.4rem 0 .5rem;
    border-top:1px solid var(--rule);padding-top:1.4rem}
  .sheet > h2:first-of-type{border-top:0;padding-top:0}
  h3{font-size:1.06rem;margin:1.6rem 0 .45rem}
  p,ul,ol{font-size:17px;line-height:1.68}
  p{margin:0 0 15px}
  ul,ol{padding-left:1.3rem}
  li{margin:0 0 .55rem}
  blockquote{margin:1.25rem 0;padding:.2rem 0 .2rem 1.25rem;border-left:3px solid var(--gold);
    font-style:italic;color:var(--deep)}
  .eyebrow{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;font-size:.72rem;
    letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin:0 0 .5rem}
  .sub{font-size:1.04rem;color:var(--mute);font-style:italic;margin:0 0 1.8rem}
  .q{background:#fff;border:1px solid var(--rule);border-left:3px solid var(--gold);
    padding:1rem 1.15rem;margin:1rem 0}
  .q p:last-child{margin:0}
  .orn{text-align:center;color:var(--gold);letter-spacing:.5em;margin:2.2rem 0 1.3rem;font-size:13px}
  .log{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;font-size:14.5px;line-height:1.62}
  .log .d{color:var(--gold);font-weight:700;letter-spacing:.06em}
  .src{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--mute);
    word-break:break-all}
  .flag{color:var(--flag);font-weight:700}
  a{color:#8a6420}
  .listen{display:inline-flex;align-items:center;gap:.4rem;margin:.1rem 0 .9rem;padding:6px 12px;
    font-family:-apple-system,"Segoe UI",Roboto,sans-serif;font-size:12.5px;font-weight:600;
    letter-spacing:.04em;border:1px solid var(--rule);background:#fff;color:var(--mute);
    border-radius:999px;cursor:pointer}
  .listen[data-on="1"]{background:var(--gold);color:#fff;border-color:var(--gold)}
  .bar{position:fixed;left:0;right:0;bottom:0;background:#2f2a20;color:#f3ead6;
    font-family:-apple-system,"Segoe UI",Roboto,sans-serif;font-size:12.5px;
    padding:9px 14px;display:none;align-items:center;justify-content:space-between;gap:10px}
  .bar button{background:none;border:1px solid rgba(243,234,214,.35);color:#f3ead6;
    border-radius:999px;padding:5px 12px;font:inherit;cursor:pointer}
  @media (max-width:560px){p,ul,ol{font-size:16px}body{padding:14px 10px 90px}}
</style>
</head>
<body>

<div id="gate">
  <h1>Private</h1>
  <input id="pw" type="password" inputmode="text" autocomplete="current-password"
         placeholder="Passphrase" autofocus>
  <button id="go" type="button">Open</button>
  <div id="msg"></div>
</div>

<div class="wrap"><div class="sheet" id="sheet" hidden></div></div>

<div class="bar" id="bar">
  <span id="barwhat">Reading</span>
  <span><button id="stop" type="button">Stop</button></span>
</div>

<script>
(function(){
  var D = {s:"__SALT__", i:"__IV__", c:"__CT__"};
  var b2a = function(b){return Uint8Array.from(atob(b), function(c){return c.charCodeAt(0)});};

  function show(html){
    var sheet = document.getElementById('sheet');
    sheet.innerHTML = html;
    document.getElementById('gate').remove();
    sheet.hidden = false;
    addListenButtons(sheet);
    document.title = (sheet.querySelector('h1') || {}).textContent || ' ';
  }

  async function unlock(pass, quiet){
    var msg = document.getElementById('msg');
    try{
      var km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass),
                                             'PBKDF2', false, ['deriveKey']);
      var key = await crypto.subtle.deriveKey(
        {name:'PBKDF2', salt:b2a(D.s), iterations:310000, hash:'SHA-256'},
        km, {name:'AES-GCM', length:256}, false, ['decrypt']);
      var pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:b2a(D.i)}, key, b2a(D.c));
      try{ sessionStorage.setItem('fa', pass); }catch(e){}
      show(new TextDecoder().decode(pt));
    }catch(e){
      try{ sessionStorage.removeItem('fa'); }catch(_){}
      if(!quiet && msg) msg.textContent = 'That is not it.';
    }
  }

  var go = document.getElementById('go'), pw = document.getElementById('pw');
  go.addEventListener('click', function(){ unlock(pw.value, false); });
  pw.addEventListener('keydown', function(e){ if(e.key === 'Enter') unlock(pw.value, false); });
  try{ var saved = sessionStorage.getItem('fa'); if(saved) unlock(saved, true); }catch(e){}

  // ---- Listen, per section. Browser speech synthesis, Tessa where the device has her.
  var synth = window.speechSynthesis, current = null;
  function pickVoice(){
    var v = synth.getVoices() || [];
    var byName = function(n){ return v.filter(function(x){ return x.name.indexOf(n) === 0; })[0]; };
    return byName('Tessa') || v.filter(function(x){ return /^en[-_]ZA/.test(x.lang); })[0]
        || byName('Moira') || byName('Samantha')
        || v.filter(function(x){ return /^en/.test(x.lang); })[0] || null;
  }
  if(synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;

  var bar = document.getElementById('bar'), barwhat = document.getElementById('barwhat');
  document.getElementById('stop').addEventListener('click', stopAll);
  function stopAll(){
    if(synth) synth.cancel();
    bar.style.display = 'none';
    [].forEach.call(document.querySelectorAll('.listen'), function(b){
      b.dataset.on = '0'; b.textContent = '\\u25B6 Listen';
    });
    current = null;
  }

  function speak(btn, title, text){
    if(current === btn){ stopAll(); return; }
    stopAll();
    if(!synth){ btn.textContent = 'No voice on this device'; return; }
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice(); if(v) u.voice = v;
    u.rate = 0.96; u.pitch = 1;
    u.onend = stopAll;
    current = btn; btn.dataset.on = '1'; btn.textContent = '\\u25A0 Stop';
    barwhat.textContent = 'Reading \\u2014 ' + title + (v ? ' \\u00b7 ' + v.name : '');
    bar.style.display = 'flex';
    synth.speak(u);
  }

  function addListenButtons(sheet){
    if(!('speechSynthesis' in window)) return;
    [].forEach.call(sheet.querySelectorAll('h2'), function(h){
      var title = h.textContent.trim(), parts = [title], n = h.nextElementSibling;
      while(n && n.tagName !== 'H2'){ parts.push(n.textContent); n = n.nextElementSibling; }
      var text = parts.join('. ').replace(/\\s+/g, ' ');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'listen'; b.dataset.on = '0';
      b.textContent = '\\u25B6 Listen';
      b.addEventListener('click', function(){ speak(b, title, text); });
      h.insertAdjacentElement('afterend', b);
    });
  }
})();
</script>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("body", help="inner HTML of the page")
    ap.add_argument("--out", required=True, help="path to write, relative to the repo root")
    ap.add_argument("--passphrase-file", default=os.path.expanduser("~/.fuel_passphrase"))
    args = ap.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.exists(args.body):
        die("body file not found: %s" % args.body)
    if not os.path.exists(args.passphrase_file):
        die("no passphrase file at %s — create it first, with one line and nothing else."
            % args.passphrase_file)

    passphrase = io.open(args.passphrase_file, encoding="utf-8").read().strip()
    if len(passphrase) < 10:
        die("that passphrase is too short to protect a public file. Use at least ten characters.")

    body = io.open(args.body, encoding="utf-8").read()
    if re.search(r"<\s*(html|head|body)\b", body, re.I):
        die("body.html must be the inner HTML only — no <html>, <head> or <body>.")

    salt, iv, ct = encrypt(body, passphrase)
    page = (PAGE.replace("__SALT__", salt).replace("__IV__", iv).replace("__CT__", ct))

    out = os.path.join(root, args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    io.open(out, "w", encoding="utf-8").write(page)

    sections = len(re.findall(r"<h2[\s>]", body, re.I))
    print("  wrote   %s" % args.out)
    print("  body    %d bytes of HTML, %d sections, each with a Listen button" % (len(body), sections))
    print("  cipher  AES-256-GCM, PBKDF2-SHA256 at %s iterations" % f"{ITER:,}")
    print("  page    %d bytes, carries ciphertext only — no plaintext anywhere in it" % len(page))
    print()
    print("  The passphrase is read from %s and is never written into the page" % args.passphrase_file)
    print("  or the repository. A wrong passphrase fails the GCM tag and yields nothing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
