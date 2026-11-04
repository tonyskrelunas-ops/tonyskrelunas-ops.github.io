/* Arrows and a small "other sections" menu beside each rotating stage.

   Tony, 11/4/2026: "on each section where the work is showcased rotating..
   add an arrow forward and backwards... and next to the arrow a small menu
   of other sections".

   The arrows step through the scenes by pressing the matching dot, so they
   follow the motion law already in stages.js: the first press hands the stage
   to the reader and it stops turning on its own. The menu is built from the
   stage titles on the page, so a new stage appears in it by itself. */
(function () {
  var stages = Array.prototype.slice.call(document.querySelectorAll('.stage'));
  if (!stages.length) return;
  var list = stages.map(function (s) {
    var t = s.querySelector('.stage__title');
    return { el: s, id: s.id, title: t ? t.textContent.trim() : '' };
  }).filter(function (x) { return x.id && x.title; });

  stages.forEach(function (stage) {
    var nav = stage.querySelector('.stage__nav');
    var dots = Array.prototype.slice.call(stage.querySelectorAll('.stage__dot'));
    if (!nav || dots.length < 2 || nav.querySelector('.stage__arrow')) return;

    function current() {
      for (var i = 0; i < dots.length; i++) if (dots[i].classList.contains('is-on')) return i;
      return 0;
    }
    function arrow(dir, label, glyph) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stage__arrow stage__arrow--' + (dir < 0 ? 'prev' : 'next');
      b.setAttribute('aria-label', label);
      b.innerHTML = '<span aria-hidden="true">' + glyph + '</span>';
      b.addEventListener('click', function () {
        var n = dots.length, i = (current() + dir + n) % n;
        dots[i].click();
      });
      return b;
    }
    var dotsWrap = nav.querySelector('.stage__dots');
    nav.insertBefore(arrow(-1, 'Previous', '‹'), dotsWrap);
    dotsWrap.parentNode.insertBefore(arrow(1, 'Next', '›'), dotsWrap.nextSibling);

    var others = list.filter(function (x) { return x.el !== stage; });
    if (!others.length) return;
    var menu = document.createElement('nav');
    menu.className = 'stage__others';
    menu.setAttribute('aria-label', 'Other sections');
    others.forEach(function (x) {
      var a = document.createElement('a');
      a.href = '#' + x.id;
      a.textContent = x.title;
      menu.appendChild(a);
    });
    nav.appendChild(menu);
  });
})();
