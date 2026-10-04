/* ABUNDANCE MINDSET MAGAZINE — the front page builds itself.
   Tribe Achieve's original idea: a positive search engine that found good
   news and featured Tony's own writing beside it.

   Reads /js/magazine-feed.json:
     mine[]  — his journal, newest first (built by _tools/build-magazine-feed.py)
     found[] — good news gathered from the world (refilled daily by the job)

   The front page always leads with FOUR of his articles: the three newest,
   plus one older piece that turns on every visit so the page is never the
   same twice. Nothing here is invented — every card is a real article with
   a real date. Without JS the page keeps the cards already in the HTML. */
(function () {
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  /* an edition shows his article in its own language when that version
     exists, and falls back to the English one when it does not */
  /* India reads in English, so the edition is named on <html> and the
     language attribute alone cannot identify it. */
  /* NOT data-edition: the page already uses [data-edition] for the dateline,
     and a selector that matched <html> had this script set textContent on the
     root element, which erases the whole document. */
  var EDITION = document.documentElement.getAttribute('data-mag-edition') ||
                (document.documentElement.lang || 'en').slice(0, 2);
  var LANG = (document.documentElement.lang || 'en').slice(0, 2);
  function inLang(a) {
    if (LANG === 'en' || !a.tr || !a.tr[LANG]) return a;
    var t = a.tr[LANG];
    return { href: t.href || a.href, title: t.title || a.title,
             dek: t.dek || a.dek, pillar: t.pillar || a.pillar,
             date: a.date, art: a.art, slug: a.slug, translated: true };
  }

  /* each edition writes the date in its own language — it was printing
     "September 17, 2026" inside the Spanish and Lithuanian magazines */
  var MONTHS = {
    en: ['January','February','March','April','May','June','July',
         'August','September','October','November','December'],
    es: ['enero','febrero','marzo','abril','mayo','junio','julio',
         'agosto','septiembre','octubre','noviembre','diciembre'],
    lt: ['sausio','vasario','kovo','balandžio','gegužės','birželio','liepos',
         'rugpjūčio','rugsėjo','spalio','lapkričio','gruodžio']
  };
  /* A reader in the Spanish edition clicked a card and landed on an English
     page. Until every piece is carried across, any card that is still in
     English says so before it is clicked. */
  var ENONLY = { es: 'en inglés', ja: '英語', lt: 'angliškai' };
  function tag(a) {
    return (LANG !== 'en' && !a.translated && ENONLY[LANG])
      ? ' <em class="amm__en">' + ENONLY[LANG] + '</em>' : '';
  }

  function pretty(d) {
    if (!d) return '';
    var p = d.split('-'); if (p.length < 3) return d;
    var y = p[0], mi = +p[1] - 1, day = +p[2];
    if (LANG === 'ja') return y + '年' + (mi + 1) + '月' + day + '日';
    if (LANG === 'es') return day + ' de ' + MONTHS.es[mi] + ' de ' + y;
    if (LANG === 'lt') return y + ' m. ' + MONTHS.lt[mi] + ' ' + day + ' d.';
    return MONTHS.en[mi] + ' ' + day + ', ' + y;
  }

  fetch('/js/magazine-feed.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (F) {
      var mine = (F.mine || []).filter(function (a) { return a.date; }).map(inLang);
      if (mine.length < 4) return;

      /* the lead — his newest piece */
      // in a non-English edition, lead with a piece that exists in that language
      if (LANG !== 'en') {
        var translatedFirst = mine.filter(function(a){return a.translated;});
        if (translatedFirst.length) {
          mine = translatedFirst.concat(mine.filter(function(a){return !a.translated;}));
        }
      }
      var lead = mine[0];
      var ls = document.querySelector('.lead-story');
      if (ls) {
        var h = ls.querySelector('h2 a') || ls.querySelector('h2');
        var k = ls.querySelector('.kick');
        var dek = ls.querySelector('.dek');
        var art = ls.querySelector('.lead-art');
        if (h) { h.textContent = lead.title; if (h.tagName === 'A') h.href = lead.href; }
        if (k) { k.innerHTML = esc(lead.pillar) + ' · ' + pretty(lead.date) + tag(lead); }
        if (dek && lead.dek) dek.textContent = lead.dek;
        if (art && lead.art) art.setAttribute('src', lead.art);
      }

      /* FOUR of his own on the front page: the next three newest, plus one
         older piece that rotates each visit */
      var featured = mine.slice(1, 4);
      var rest = mine.slice(4);
      if (rest.length) featured.push(pick(rest));

      var grid = document.querySelector('[data-mag-mine]');
      if (grid) {
        grid.innerHTML = featured.map(function (a) {
          return '<a class="amm__c" href="' + a.href + '">' +
                 (a.art ? '<img class="amm__art" src="' + a.art + '" alt="">' : '') +
                 '<i>' + esc(a.pillar) + ' · ' + pretty(a.date) + tag(a) + '</i>' +
                 '<b>' + esc(a.title) + '</b>' +
                 (a.dek ? '<span>' + esc(a.dek) + '</span>' : '') + '</a>';
        }).join('');
        grid.setAttribute('data-count', featured.length);
      }

      /* good news from the world — only renders once the daily job has run,
         so the page never shows an empty promise */
      var found = (EDITION !== 'en' && F['found_' + EDITION] && F['found_' + EDITION].length)
                  ? F['found_' + EDITION] : (F.found || []);
      var box = document.querySelector('[data-found]');
      if (box) {
        if (!found.length) { box.hidden = true; }
        else {
          box.hidden = false;
          box.innerHTML = found.slice(0, 6).map(function (g) {
            return '<a class="amm__f" href="' + g.url + '" target="_blank" rel="noopener">' +
                   '<i>' + esc(g.source || 'Found') + (g.date ? ' · ' + pretty(g.date) : '') + '</i>' +
                   '<b>' + esc(g.title) + '</b>' +
                   (g.dek ? '<span>' + esc(g.dek) + '</span>' : '') + '</a>';
          }).join('');
        }
      }

      var stamp = document.querySelector('body [data-edition]');
      var EDN = { en: 'This edition · ', es: 'Esta edición · ',
                  ja: 'この号 · ', lt: 'Šis leidimas · ' };
      if (stamp && F.generated) {
        stamp.textContent = (EDN[LANG] || EDN.en) + pretty(F.generated.slice(0, 10));
      }
      document.documentElement.classList.add('mag-ready');
    })
    .catch(function () { document.documentElement.classList.add('mag-ready'); });
})();
