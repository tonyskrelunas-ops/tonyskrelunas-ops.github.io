/* Read counter — derives its key from the URL, so any NEW article works with no edit.
   Counts live at abacus.jasoncameron.dev (free, no account). */
(function () {
  var m = location.pathname.match(/^\/journal\/([^\/]+)\/?$/);
  if (!m) return;                       // only journal articles
  var slug = m[1];
  if (slug === 'all') return;

  var anchor = document.querySelector('.artdate') ||
               document.querySelector('.artnote') ||
               document.querySelector('.article__body');
  if (!anchor) return;

  var el = document.createElement('p');
  el.className = 'artdate artdate--reads';
  el.innerHTML = '<span data-n></span> reads';
  el.hidden = true;
  anchor.parentNode.insertBefore(el, anchor.nextSibling);

  fetch('https://abacus.jasoncameron.dev/hit/tribeawaken/' + slug)
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (j && typeof j.value === 'number') {
        el.querySelector('[data-n]').textContent = j.value.toLocaleString();
        el.hidden = false;
      }
    })
    .catch(function () {});
})();
