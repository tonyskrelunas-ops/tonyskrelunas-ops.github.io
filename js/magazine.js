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
  function pretty(d) {
    if (!d) return '';
    var p = d.split('-'); if (p.length < 3) return d;
    var M = ['January','February','March','April','May','June','July',
             'August','September','October','November','December'];
    return M[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }

  fetch('/js/magazine-feed.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (F) {
      var mine = (F.mine || []).filter(function (a) { return a.date; });
      if (mine.length < 4) return;

      /* the lead — his newest piece */
      var lead = mine[0];
      var ls = document.querySelector('.lead-story');
      if (ls) {
        var h = ls.querySelector('h2 a') || ls.querySelector('h2');
        var k = ls.querySelector('.kick');
        var dek = ls.querySelector('.dek');
        var art = ls.querySelector('.lead-art');
        if (h) { h.textContent = lead.title; if (h.tagName === 'A') h.href = lead.href; }
        if (k) k.textContent = lead.pillar + ' · ' + pretty(lead.date);
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
                 '<i>' + esc(a.pillar) + ' · ' + pretty(a.date) + '</i>' +
                 '<b>' + esc(a.title) + '</b>' +
                 (a.dek ? '<span>' + esc(a.dek) + '</span>' : '') + '</a>';
        }).join('');
        grid.setAttribute('data-count', featured.length);
      }

      /* good news from the world — only renders once the daily job has run,
         so the page never shows an empty promise */
      var found = F.found || [];
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

      var stamp = document.querySelector('[data-edition]');
      if (stamp && F.generated) stamp.textContent = 'This edition · ' + pretty(F.generated.slice(0, 10));
      document.documentElement.classList.add('mag-ready');
    })
    .catch(function () { document.documentElement.classList.add('mag-ready'); });
})();
