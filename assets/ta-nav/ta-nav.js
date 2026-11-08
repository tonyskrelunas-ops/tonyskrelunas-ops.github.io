/* TribeAwaken site menu: the strip tucks away on scroll, Magazine & Journal opens on hover or tap, the full menu opens and closes */
(function () {
  var root = document.documentElement;
  function onScroll() { root.classList.toggle('tan-scrolled', (window.scrollY || root.scrollTop) > 160); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var drop = document.querySelector('.tan-drop');
  if (drop) {
    var b = drop.querySelector('button');
    var set = function (o) { drop.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); };
    b.addEventListener('click', function (e) { e.stopPropagation(); set(!drop.classList.contains('open')); });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) set(false); });
  }
  var burger = document.querySelector('.tan-burger'), menu = document.getElementById('tanMenu');
  if (burger && menu) {
    var setOpen = function (o) { root.classList.toggle('tan-menu-open', o); burger.setAttribute('aria-expanded', String(o)); menu.setAttribute('aria-hidden', String(!o)); };
    burger.addEventListener('click', function () { setOpen(!root.classList.contains('tan-menu-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }
})();
