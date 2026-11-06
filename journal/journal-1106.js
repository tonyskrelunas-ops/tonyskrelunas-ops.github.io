/* The Writing — reveal the streams as they come into view. /journal/ only.
   Without JavaScript nothing here is needed: the stylesheet only hides a
   block when <html class="jjs"> is present, which this page's head script
   sets, so a reader with scripts off sees every section at once. */
(function () {
  var els = document.querySelectorAll('.jr');
  if (!els.length) return;
  function all() { for (var i = 0; i < els.length; i++) els[i].classList.add('in'); }
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion:reduce)').matches) { all(); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.03 });
  for (var i = 0; i < els.length; i++) io.observe(els[i]);
  // whatever is already on screen when the page settles, and a safety net
  function sweep() {
    for (var i = 0; i < els.length; i++) {
      if (els[i].getBoundingClientRect().top < window.innerHeight * 1.05) els[i].classList.add('in');
    }
  }
  window.addEventListener('load', function () { sweep(); setTimeout(sweep, 300); });
  setTimeout(sweep, 1500);
  setTimeout(all, 8000);
})();
