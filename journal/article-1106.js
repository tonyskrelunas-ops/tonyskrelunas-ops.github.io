/* More of his writing at the foot of an article. /journal/<slug>/ pages.
   Reads js/magazine-feed.json (rebuilt every morning) and lists the three
   newest pieces that share this article's pillar, never the article itself,
   so a new article needs no hand-edit to get its own list. With scripts off
   the block simply stays hidden; nothing a reader needs depends on it. */
(function () {
  var host = document.getElementById('keep-reading');
  if (!host || !window.fetch) return;
  var m = location.pathname.match(/^\/journal\/([^\/]+)\/?$/);
  if (!m) return;
  var me = m[1];
  var eb = document.querySelector('.art .eyebrow');
  var pillar = eb ? eb.textContent.trim() : '';
  fetch('/js/magazine-feed.json').then(function (r) { return r.json(); }).then(function (feed) {
    var mine = (feed.mine || []).filter(function (a) {
      return a.slug !== me && a.date && a.img && !/lamplight-desk|far-messengers-(mountain|shore)|savanna|council-band|canyon-family|land-healing/.test(a.img) && !/^Moved/.test(a.title);
    });
    var same = mine.filter(function (a) { return a.pillar === pillar; });
    var pick = (same.length >= 3 ? same : same.concat(mine.filter(function (a) { return same.indexOf(a) < 0; }))).slice(0, 3);
    if (!pick.length) return;
    var ul = host.querySelector('ul');
    pick.forEach(function (a) {
      var li = document.createElement('li');
      var d = a.date.split('-');
      var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      li.innerHTML = '<a href="' + a.href + '"><img src="' + a.img + '" alt="" loading="lazy" decoding="async">' +
        '<span><span class="d">' + MONTHS[+d[1] - 1] + ' ' + (+d[2]) + ', ' + d[0] + '</span><b></b><span class="s"></span></span></a>';
      li.querySelector('b').textContent = a.title;
      li.querySelector('.s').textContent = a.dek || '';
      ul.appendChild(li);
    });
    host.hidden = false;
  }).catch(function () {});
})();
