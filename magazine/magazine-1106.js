/* ABUNDANCE MINDSET MAGAZINE — the broadsheet front page fills itself.
   6 November 2026.

   Reads the SAME /js/magazine-feed.json the morning engine writes
   (_tools/daily-magazine.sh → refresh-magazine-daily.py), and nothing else.
   The engine is not touched. js/magazine.js is not touched either: it still
   serves any edition page that has not moved to this layout, and this file
   keeps its rules exactly —

     lead      his newest piece (or the pinned one while _tools/pinned.json
               names a magazine_lead; a non-English edition leads with a piece
               that exists in its language)
     four      the next three newest, plus one older piece that turns each visit
     found     the edition's own gathered news; shown only once the engine has
               run, so the page never shows an empty promise

   What is new: the gathered news is laid out by lane, the way a newspaper has
   sections; every piece carries one of Tony's line drawings and the drawings
   draw themselves in as they arrive; the newest three found pieces sit beside
   the photograph; the dateline carries the weekday; the photograph turns with
   the day. Without JavaScript the page keeps what is printed in its HTML.

   NOT data-edition on <html>: magazine.js uses that attribute for the dateline,
   and a selector that matched <html> once erased a whole page.          */
(function () {
  'use strict';
  var ROOT = document.documentElement;
  var EDITION = ROOT.getAttribute('data-mag-edition') || (ROOT.lang || 'en').slice(0, 2);
  var LANG = (ROOT.lang || 'en').slice(0, 2);
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var esc = function (t) { var d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ── words, per edition ───────────────────────────────────────────────── */
  var T = {
    en: { lanes: { news: 'News', land: 'The land', animals: 'The animals', running: 'Running',
                   research: 'Research', culture: 'Culture' },
          edition: 'This edition', justin: 'Just in', journal: 'From the journal',
          pieces: function (n, m, k) {
            return n + ' piece' + (n === 1 ? '' : 's') + ' from ' + m + ' publication' + (m === 1 ? '' : 's') +
                   ', in ' + k + ' lane' + (k === 1 ? '' : 's'); },
          readit: 'Read it' },
    es: { lanes: { news: 'Noticias', land: 'La tierra', animals: 'Los animales', running: 'Correr',
                   research: 'Investigación', culture: 'Cultura' },
          edition: 'Esta edición', justin: 'Recién llegado', journal: 'Del diario',
          pieces: function (n, m) { return n + ' piezas · ' + m + ' fuentes'; }, readit: 'Léalo' },
    ja: { lanes: { news: 'ニュース', land: '土地', animals: '動物', running: '走る',
                   research: '研究', culture: '文化' },
          edition: 'この号', justin: '届いたばかり', journal: '日記から',
          pieces: function (n, m) { return n + '本 · ' + m + '媒体'; }, readit: '読む' },
    lt: { lanes: { news: 'Žinios', land: 'Žemė', animals: 'Gyvūnai', running: 'Bėgimas',
                   research: 'Tyrimai', culture: 'Kultūra' },
          edition: 'Ši laida', justin: 'Ką tik gauta', journal: 'Iš dienoraščio',
          pieces: function (n, m) { return n + ' tekstų · ' + m + ' šaltinių'; }, readit: 'Skaityti' }
  };
  var t = T[LANG] || T.en;
  var LANE_ORDER = ['news', 'land', 'animals', 'running', 'research', 'culture'];

  var MONTHS = {
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
    lt: ['sausio','vasario','kovo','balandžio','gegužės','birželio','liepos','rugpjūčio','rugsėjo','spalio','lapkričio','gruodžio']
  };
  var DAYS = {
    en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    es: ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],
    ja: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
    lt: ['sekmadienis','pirmadienis','antradienis','trečiadienis','ketvirtadienis','penktadienis','šeštadienis']
  };
  var ENONLY = { es: 'en inglés', ja: '英語', lt: 'angliškai' };

  /* his drawings, one lane at a time; the day turns the set so a lane does not
     wear the same drawing every morning, and within a day it is stable */
  var ART = {
    news:     ['dine-dawn','baltic-sun','fire-circle','baltic-moon','japan-cloud'],
    land:     ['baltic-oak','dine-hogan','japan-pine','baltic-tree-of-life','baltic-rue','japan-bamboo','baltic-hill-fort'],
    animals:  ['baltic-stork','japan-crane','japan-koi','baltic-horse','baltic-serpent'],
    running:  ['runner','dine-mountains','japan-fuji','breath'],
    research: ['four-capitals','japan-enso','breath','baltic-amber'],
    culture:  ['baltic-juosta','japan-bridge','dine-weaving','japan-torii','japan-pagoda','japan-stone-lantern','japan-maple','baltic-linen']
  };

  /* the front-page photograph: his own, each one checked by camera make
     against his cameras (iPhone XS Max, iPhone 12 Pro Max, Motorola XT1254) */
  var PHOTOS = [
    { f: 'real-sheep-under-butte-1800px', w: 1800, h: 1012,
      c: { en: 'The flock under the butte', es: 'El rebaño bajo el cerro', ja: 'ビュートの下の羊の群れ', lt: 'Avių banda po uola' } },
    { f: 'real-forest-road-1800px', w: 1350, h: 1800,
      c: { en: 'The forest road, morning', es: 'El camino del bosque, por la mañana', ja: '森の道、朝', lt: 'Miško kelias, rytas' } },
    { f: 'real-teton-river-1800px', w: 1800, h: 1012,
      c: { en: 'The river and the peaks', es: 'El río y los picos', ja: '川と峰々', lt: 'Upė ir viršūnės' } },
    { f: 'real-creek-logbridge-1800px', w: 1350, h: 1800,
      c: { en: 'A log across the creek, autumn', es: 'Un tronco sobre el arroyo, en otoño', ja: '小川に渡した丸太、秋', lt: 'Rąstas per upelį, ruduo' } },
    { f: 'real-marsh-pond-1800px', w: 1800, h: 1012,
      c: { en: 'A moose in the marsh pond, early', es: 'Un alce en la laguna del pantano, temprano', ja: '湿地の池のヘラジカ、早朝', lt: 'Briedis pelkės tvenkinyje, anksti rytą' } },
    { f: 'real-gold-trail-1800px', w: 1350, h: 1800,
      c: { en: 'The trail, late September', es: 'El sendero, a fines de septiembre', ja: '九月の終わりの小道', lt: 'Takas, rugsėjo pabaiga' } },
    { f: 'real-garden-stonebridge-1800px', w: 1350, h: 1800,
      c: { en: 'The stone bridge and the garden path', es: 'El puente de piedra y el camino del jardín', ja: '石の橋と庭の小道', lt: 'Akmeninis tiltas ir sodo takas' } },
    { f: 'real-chokecherries-metate-1800px', w: 1350, h: 1800,
      c: { en: 'Chokecherries in the grinding stone', es: 'Capulines en la piedra de moler', ja: 'すり石の中のチョークチェリー', lt: 'Laukinės vyšnios akmeninėje grūstuvėje' } }
  ];

  function inLang(a) {
    if (LANG === 'en' || !a.tr || !a.tr[LANG]) return a;
    var x = a.tr[LANG];
    return { href: x.href || a.href, title: x.title || a.title, dek: x.dek || a.dek,
             pillar: x.pillar || a.pillar, date: a.date, art: a.art, slug: a.slug, translated: true };
  }
  function tag(a) {
    return (LANG !== 'en' && !a.translated && ENONLY[LANG]) ? ' <em class="amm__en">' + ENONLY[LANG] + '</em>' : '';
  }
  function parts(d) {
    if (!d) return null;
    var p = d.split('-'); if (p.length < 3) return null;
    return { y: +p[0], m: +p[1] - 1, d: +p[2].slice(0, 2) };
  }
  function pretty(d) {
    var p = parts(d); if (!p) return d || '';
    if (LANG === 'ja') return p.y + '年' + (p.m + 1) + '月' + p.d + '日';
    if (LANG === 'es') return p.d + ' de ' + MONTHS.es[p.m] + ' de ' + p.y;
    if (LANG === 'lt') return p.y + ' m. ' + MONTHS.lt[p.m] + ' ' + p.d + ' d.';
    return MONTHS.en[p.m] + ' ' + p.d + ', ' + p.y;
  }
  function weekday(d) {
    var p = parts(d); if (!p) return '';
    var dt = new Date(p.y, p.m, p.d);
    return (DAYS[LANG] || DAYS.en)[dt.getDay()];
  }
  function dayOfYear(d) {
    var p = parts(d) || (function () { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() }; })();
    var a = new Date(p.y, p.m, p.d), b = new Date(p.y, 0, 1);
    return Math.round((a - b) / 86400000);
  }

  function artImg(src, cls) {
    return '<img class="' + (cls || 'amm__art') + '" src="' + src + '" alt="" width="54" height="54" loading="lazy">';
  }
  function cardMine(a) {
    return '<a class="amm__c" href="' + a.href + '">' +
           (a.art ? artImg(a.art) : '') +
           '<i>' + esc(a.pillar) + ' · ' + pretty(a.date) + tag(a) + '</i>' +
           '<b>' + esc(a.title) + '</b>' +
           (a.dek ? '<span>' + esc(a.dek) + '</span>' : '') + '</a>';
  }
  /* some publishers put their own footer at the front of the summary ("The
     post X appeared first on Y."); it is dropped from the display only, the
     feed itself is never touched */
  function dek(g) {
    var d = (g.dek || '')
      .replace(/\s*The post .{0,220}? appeared first on [^.…]{1,60}[.…]?\s*/g, ' ')
      .replace(/\s*The post\b.{0,220}$/, '')      /* the same footer, cut mid-way by the engine's clip */
      .replace(/\s{2,}/g, ' ').trim();
    if (d && !/[.!?…"”)]$/.test(d)) d += '…';
    return d;
  }
  function cardFound(g, art) {
    var d = dek(g);
    return '<a class="amm__f" href="' + g.url + '" target="_blank" rel="noopener">' +
           artImg('/assets/art/' + art + '.svg') +
           '<i>' + esc(g.source || 'Found') + (g.date ? ' · ' + pretty(g.date) : '') + '</i>' +
           '<b>' + esc(g.title) + '</b>' +
           (d ? '<span>' + esc(d) + '</span>' : '') + '</a>';
  }

  /* ── the drawings, inlined so the pen can be seen drawing them ────────── */
  var SVGS = {};
  function svgText(src) {
    var key = src.split('?')[0];
    if (!SVGS[key]) SVGS[key] = fetch(key).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; });
    return SVGS[key];
  }
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-drawn'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.2 }) : null;

  function prepare(svg) {
    if (REDUCE || !io) { svg.classList.add('is-drawn'); return; }
    var shapes = svg.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect');
    var i = 0, n = shapes.length;
    for (var k = 0; k < n; k++) {
      var s = shapes[k];
      var filled = s.getAttribute('fill') === 'currentColor' || s.getAttribute('stroke') === 'none';
      if (filled) { s.classList.add('df'); continue; }
      var L = 0;
      try { L = s.getTotalLength(); } catch (e) { L = 0; }
      if (!L) continue;
      s.classList.add('dr');
      s.style.strokeDasharray = L + ' ' + (L + 2);
      s.style.strokeDashoffset = L;
      s.style.transitionDelay = (Math.min(i, 22) * 0.045).toFixed(3) + 's';
      i++;
    }
    io.observe(svg);
  }
  function inlineOne(img) {
    var src = img.getAttribute('src'); if (!src || !/\.svg(\?|$)/.test(src)) return;
    svgText(src).then(function (txt) {
      if (!txt || !img.isConnected) return;
      var doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
      var svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') return;
      svg = document.importNode(svg, true);
      svg.removeAttribute('role'); svg.removeAttribute('aria-label');
      svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.setAttribute('class', (img.className || '') + ' spot');
      svg.removeAttribute('width'); svg.removeAttribute('height');
      img.parentNode.replaceChild(svg, img);
      prepare(svg);
    });
  }
  function inlineAll(root) {
    var imgs = (root || document).querySelectorAll('img.amm__art, img.lead__art');
    for (var i = 0; i < imgs.length; i++) inlineOne(imgs[i]);
  }

  /* ── the photograph of the day ────────────────────────────────────────── */
  function photo(dateStr) {
    var fig = $('[data-photo]'); if (!fig) return;
    var p = PHOTOS[dayOfYear(dateStr) % PHOTOS.length];
    var img = fig.querySelector('img'), cap = fig.querySelector('[data-cap]');
    if (!img) return;
    var base = '/assets/img/v2/' + p.f;
    img.setAttribute('src', base + '.jpg');
    img.setAttribute('srcset', base + '-900w.jpg 900w, ' + base + '.jpg 1800w');
    img.setAttribute('width', p.w); img.setAttribute('height', p.h);
    var c = p.c[LANG] || p.c.en;
    img.setAttribute('alt', c);
    if (cap) cap.textContent = c;
  }

  /* ── render ───────────────────────────────────────────────────────────── */
  function render(F) {
    var mine = (F.mine || []).filter(function (a) { return a.date; }).map(inLang);
    var stamp = F.generated ? F.generated.slice(0, 10) : '';

    /* the dateline */
    var dl = $('[data-dateline]');
    if (dl && stamp) dl.textContent = weekday(stamp) + ', ' + pretty(stamp);
    var ed = $('[data-edition-label]');
    if (ed && stamp) ed.textContent = t.edition + ' · ' + pretty(stamp);

    photo(stamp);

    if (mine.length >= 4) {
      if (LANG !== 'en') {
        var tf = mine.filter(function (a) { return a.translated; });
        if (tf.length) mine = tf.concat(mine.filter(function (a) { return !a.translated; }));
      }
      if (LANG === 'en' && F.lead) {
        var li = mine.findIndex(function (a) { return a.slug === F.lead; });
        if (li > 0) mine = [mine[li]].concat(mine.slice(0, li), mine.slice(li + 1));
      }
      var lead = mine[0];
      var ls = $('.lead');
      if (ls) {
        var h = ls.querySelector('h2 a') || ls.querySelector('h2');
        var k = ls.querySelector('.lead__kick');
        var dek = ls.querySelector('.lead__dek');
        var go = ls.querySelector('.lead__go a');
        var art = ls.querySelector('.lead__art');
        if (h) { h.textContent = lead.title; if (h.tagName === 'A') h.href = lead.href; }
        if (k) k.innerHTML = esc(lead.pillar) + ' · ' + pretty(lead.date) + tag(lead);
        if (dek && lead.dek) dek.textContent = lead.dek;
        if (go) go.href = lead.href;
        if (art && lead.art) {
          if (art.tagName === 'IMG') art.setAttribute('src', lead.art);
          else { var im = document.createElement('img'); im.className = 'lead__art'; im.alt = ''; im.src = lead.art; art.parentNode.replaceChild(im, art); }
        }
      }
      var featured = mine.slice(1, 4);
      var rest = mine.slice(4);
      if (rest.length) featured.push(pick(rest));
      var grid = $('[data-mag-mine]');
      if (grid) { grid.innerHTML = featured.map(cardMine).join(''); grid.setAttribute('data-count', featured.length); }
    }

    /* the world */
    var found = (EDITION !== 'en' && F['found_' + EDITION] && F['found_' + EDITION].length)
                ? F['found_' + EDITION] : (F.found || []);
    var world = $('[data-world]'), lanesBox = $('[data-found]'), justin = $('[data-justin]'), justinBox = $('[data-justin-list]');
    if (!found.length) {
      if (world) world.hidden = true;
      if (justin) justin.hidden = true;
    } else {
      var dated = found.filter(function (g) { return g.date; }).slice()
                       .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
      var fresh = dated.slice(0, 3);
      var freshUrls = {}; fresh.forEach(function (g) { freshUrls[g.url] = 1; });
      var rest2 = found.filter(function (g) { return !freshUrls[g.url]; });

      var day = dayOfYear(stamp);
      var counters = {};
      function artFor(lane) {
        var set = ART[lane] || ART.news;
        var n = counters[lane] = (counters[lane] || 0) + 1;
        return set[(day + n - 1) % set.length];
      }

      if (justin && justinBox) {
        if (fresh.length) {
          justinBox.innerHTML = fresh.map(function (g) { return cardFound(g, artFor(g.lane || 'news')); }).join('');
          justin.hidden = false;
        } else justin.hidden = true;
      }

      if (world && lanesBox) {
        var byLane = {};
        rest2.forEach(function (g) { var l = g.lane || 'news'; (byLane[l] = byLane[l] || []).push(g); });
        var order = LANE_ORDER.filter(function (l) { return byLane[l]; })
                    .concat(Object.keys(byLane).filter(function (l) { return LANE_ORDER.indexOf(l) < 0; }));
        var html = '';
        order.forEach(function (l) {
          var items = byLane[l];
          html += '<h3 class="sh" id="lane-' + esc(l) + '">' + esc(t.lanes[l] || l) + '<small>' + items.length + '</small></h3>';
          html += items.map(function (g) { return cardFound(g, artFor(l)); }).join('');
        });
        lanesBox.innerHTML = html;
        lanesBox.hidden = false;
        world.hidden = false;

        /* the directory's counts and lane links */
        var srcs = {}; found.forEach(function (g) { if (g.source) srcs[g.source] = 1; });
        var cnt = $('[data-count-found]');
        if (cnt) cnt.textContent = t.pieces(found.length, Object.keys(srcs).length, order.length);
        var dlanes = $('[data-dir-lanes]');
        if (dlanes) dlanes.innerHTML = order.map(function (l) {
          return '<a href="#lane-' + esc(l) + '">' + esc(t.lanes[l] || l) + '</a>';
        }).join('');
      }
    }

    inlineAll(document);
    ROOT.classList.add('mag-ready');
  }

  /* the printed HTML already has drawings; let them draw while the feed loads */
  inlineAll(document);

  fetch('/js/magazine-feed.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () { ROOT.classList.add('mag-ready'); });

  /* copy the magazine's address */
  var cb = $('[data-copy]');
  if (cb) cb.addEventListener('click', function () {
    var u = cb.getAttribute('data-copy');
    function done() { var d = $('[data-copied]'); if (d) { d.hidden = false; setTimeout(function () { d.hidden = true; }, 2600); } }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, done);
    else { var ta = document.createElement('textarea'); ta.value = u; document.body.appendChild(ta); ta.select();
           try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  });
})();
