#!/usr/bin/env python3
"""Builds a translated article page from its English original.

Tony, 10/4: his key articles have to be carried across, "always interpreted",
because a reader who clicked a card in the Spanish edition was landing on an
English page. This clones the English page so the layout, the share block and
the subscribe form stay identical, swaps in the translated prose and head, and
cross-links every edition with hreflang.

  python3 _tools/build-translation.py <slug> <lang> <body.html> <meta.json>
"""
import os, re, sys, json, html as H

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
LABEL = {'en':'Read in English','es':'Leer en espa&ntilde;ol',
         'ja':'日本語で読む','lt':'Skaityti lietuvi&#353;kai'}
SHARE = {'es':'Comp&aacute;rtalo','ja':'共有する','lt':'Pasidalinkite'}
COPY  = {'es':'Copiar el enlace','ja':'リンクをコピー','lt':'Kopijuoti nuorodą'}

def plain(s): return H.unescape(re.sub(r'<[^>]+>', '', s))

def build(slug, lang, body, meta, allpaths):
    src = os.path.join(ROOT, "journal", slug, "index.html")
    s = open(src, encoding="utf-8").read()
    path = meta["path"]
    url  = f"https://tribeawaken.com/{path}/"

    s = re.sub(r'<html lang="[a-z-]+"', f'<html lang="{lang}"', s, 1)
    s = re.sub(r'<title>.*?</title>', f'<title>{meta["title"]} &mdash; TribeAwaken</title>', s, 1, re.S)
    for pat, val in (
        (r'<meta name="description" content="[^"]*"',
         f'<meta name="description" content="{plain(meta["dek"])}"'),
        (r'<link rel="canonical" href="[^"]*"', f'<link rel="canonical" href="{url}"'),
        (r'<meta property="og:title" content="[^"]*"',
         f'<meta property="og:title" content="{plain(meta["title"])}"'),
        (r'<meta property="og:description" content="[^"]*"',
         f'<meta property="og:description" content="{plain(meta["dek"])}"'),
        (r'<meta property="og:url" content="[^"]*"', f'<meta property="og:url" content="{url}"')):
        s = re.sub(pat, val, s, 1)
    # the original's own alternates belong to the original
    s = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">', '', s)
    hl = '\n'.join(f'<link rel="alternate" hreflang="{l}" href="https://tribeawaken.com/{p}/">'
                   for l, p in allpaths.items())
    hl += f'\n<link rel="alternate" hreflang="x-default" href="https://tribeawaken.com/journal/{slug}/">'
    s = s.replace('</head>', hl + '\n</head>', 1)

    others = ' '.join(f'<a href="/{p}/" lang="{l}">{LABEL[l]} &rarr;</a>'
                      for l, p in allpaths.items() if l != lang)
    head = (f'<p class="art__alt" style="font-size:.9rem;margin:0 0 1rem;display:flex;gap:1.1rem;flex-wrap:wrap;">{others}</p>'
            f'<div class="wrap"><p class="eyebrow" style="color:var(--clay-lt)">{meta["pillar"]}</p>'
            f'<h1 style="font-family:var(--font-display);font-size:var(--step-4);line-height:1.08;">{meta["title"]}</h1>'
            f'<p class="lead">{meta["dek"]}</p>')
    m = re.search(r'<p class="art__alt".*?<p class="lead">.*?</p>', s, re.S) \
        or re.search(r'<div class="wrap"><p class="eyebrow".*?<p class="lead">.*?</p>', s, re.S)
    if not m: raise SystemExit(f"  {slug}: could not find the head block")
    s = s[:m.start()] + head + s[m.end():]

    if 'datetxt' in meta:
        s = re.sub(r'(<p class="artdate"><time datetime="[^"]*">)[^<]*(</time></p>)',
                   lambda x: x.group(1) + meta["datetxt"] + x.group(2), s, 1)

    s = re.sub(r'(<div class="article__body">).*?(?=<div class="share">)',
               lambda x: x.group(1) + "\n" + body + "\n", s, 1, re.S)
    if lang in SHARE:
        s = re.sub(r'(<div class="share">\s*<p>)[^<]*(</p>)',
                   lambda x: x.group(1) + SHARE[lang] + x.group(2), s, 1)
        s = s.replace('>Copy the link<', '>' + COPY[lang] + '<')
    for pat, key in ((r'<p class="sub__eyebrow">[^<]*</p>', 'sub_eyebrow'),
                     (r'<p class="sub__head">.*?</p>',      'sub_head'),
                     (r'<p class="sub__say">.*?</p>',       'sub_say'),
                     (r'<p class="sub__fine">.*?</p>',      'sub_fine')):
        if key in meta:
            cls = key.replace('sub_', 'sub__')
            s = re.sub(pat, f'<p class="{cls}">{meta[key]}</p>', s, 1, re.S)
    if 'sub_btn' in meta:
        s = re.sub(r'(<button class="btn btn--primary" type="submit">).*?(</button>)',
                   lambda x: x.group(1) + meta['sub_btn'] + x.group(2), s, 1, re.S)
    if 'note' in meta:
        s = re.sub(r'<p class="artnote artnote--stamp">[^<]*</p>',
                   f'<p class="artnote artnote--stamp">{meta["note"]}</p>', s, 1)
    s = s.replace('organisational', 'organizational').replace('centre of the work', 'center of the work')

    out = os.path.join(ROOT, path)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(s)
    return len(s)

if __name__ == "__main__":
    slug, lang, bodyf, metaf = sys.argv[1:5]
    meta = json.load(open(metaf, encoding="utf-8"))
    n = build(slug, lang, open(bodyf, encoding="utf-8").read(),
              meta[lang], {k: v["path"] for k, v in meta.items()})
    print(f"  /{meta[lang]['path']}/  {n:,} bytes")
