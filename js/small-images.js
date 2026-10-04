/* PHONES GET THE SMALL FILE — deterministically.
   srcset was not enough: an iPhone reports devicePixelRatio 2 or 3, so
   "100vw" asks for 750-1125 device pixels and the browser correctly takes
   the 1800px file. Decoded, the homepage needed about 309 MB and iOS Safari
   dropped the tab — the site appeared not to open, then "went out" on scroll.

   On a screen 820px or narrower we simply point every image at its -900w
   sibling and remove the srcset so nothing can upgrade it. A desktop is
   untouched and still gets the full-size photographs. */
(function () {
  if (window.innerWidth > 820) return;
  var RX = /^(\/assets\/img\/.+)\.(jpg|jpeg|png)(\?.*)?$/i;
  function shrink(img) {
    if (img.dataset.small === '1') return;
    var src = img.getAttribute('src') || '';
    var m = src.match(RX);
    if (!m) { img.dataset.small = '1'; return; }
    var small = m[1] + '-900w.jpg';
    var ss = img.getAttribute('srcset') || '';
    if (ss.indexOf('-900w') > -1 || /-900w/.test(src)) {
      img.removeAttribute('srcset'); img.removeAttribute('sizes');
      if (!/-900w/.test(src)) img.setAttribute('src', small);
      img.dataset.small = '1'; return;
    }
    // only swap when we know the sibling exists: the srcset named it, or the
    // file is one of the large sets we generated
    if (/-(1800px|2000x|1400px|1600px)|\/v2\/|\/ta\/|\/land\/|\/world\/|\/garden\/|\/family\/|\/1440\/|\/gallery\/|\/focus\/|\/roper\//.test(src)) {
      img.removeAttribute('srcset'); img.removeAttribute('sizes');
      img.setAttribute('src', small);
      img.addEventListener('error', function () {
        if (img.dataset.reverted) return;
        img.dataset.reverted = '1';
        img.setAttribute('src', src);          // the sibling was not there
      }, { once: true });
    }
    img.dataset.small = '1';
  }
  function sweep(root) { (root || document).querySelectorAll('img').forEach(shrink); }
  sweep();
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { sweep(); });
  // the rotating bands inject their images later
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      m.addedNodes && m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IMG') shrink(n); else sweep(n);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
