/* THE FOUR MAJOR ROTATING SECTIONS — the stage engine.
   One component drives all four theaters (The Work / The Journal / The Books /
   The Life).  Implements the motion law exactly:
     · auto-rotates, staggered 6-11s per stage, FIRST turn fast
     · real 3D turns on SCENES (never a tilted grid)
     · ANY click, touch or keyboard focus permanently stops that stage and
       shows "paused — yours"; the dots then drive it
     · stages rest while offscreen (IntersectionObserver) and while the tab
       is hidden
     · prefers-reduced-motion: auto-rotation OFF entirely, dots only
   Without JS every scene simply stacks and reads as a normal page. */
(function () {
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Stage(root, ordinal) {
    var deck   = root.querySelector('.stage__deck');
    var scenes = Array.prototype.slice.call(root.querySelectorAll(':scope > .stage__deck > .scene'));
    var dots   = Array.prototype.slice.call(root.querySelectorAll('.stage__dot'));
    if (!deck || scenes.length === 0) return;

    var i = 0, held = false, visible = true, timer = null, swapping = false;

    /* the deck takes the ACTIVE scene's height, so a short scene never leaves
       a void beneath it. Grid stacking still guarantees it can never collapse
       to nothing: if a measurement is not ready we simply leave it to the grid. */
    function measure(el) {
      var h = el.scrollHeight || el.getBoundingClientRect().height;
      return h > 40 ? h : 0;
    }
    function fit() {
      var h = measure(scenes[i]);
      if (h) deck.style.height = h + 'px';
    }
    function refit() { if (!swapping) fit(); }


    function show(n) {
      if (n === i || swapping) return;
      swapping = true;
      var out = scenes[i], into = scenes[n];

      into.classList.add('is-on');
      var h = measure(into);
      if (h) deck.style.height = h + 'px';

      out.classList.remove('is-on');
      out.classList.add('is-out');
      setTimeout(function () { out.classList.remove('is-out'); swapping = false; }, 700);

      i = n;
      dots.forEach(function (d, k) {
        d.classList.toggle('is-on', k === n);
        d.setAttribute('aria-selected', k === n ? 'true' : 'false');
      });
      scenes.forEach(function (s, k) { s.setAttribute('aria-hidden', k === n ? 'false' : 'true'); });
    }

    function next() { show((i + 1) % scenes.length); }

    /* the visitor takes the wheel — permanently, per the law */
    function hold() {
      if (held) return;
      held = true;
      root.classList.add('is-held');
      clearInterval(timer); timer = null;
    }
    ['click', 'touchstart', 'focusin', 'keydown'].forEach(function (ev) {
      root.addEventListener(ev, hold, { passive: true });
    });
    dots.forEach(function (d, n) {
      d.addEventListener('click', function (e) { e.preventDefault(); hold(); show(n); });
    });

    /* initial state */
    scenes.forEach(function (s, k) {
      s.classList.toggle('is-on', k === 0);
      s.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
    });
    dots.forEach(function (d, k) {
      d.classList.toggle('is-on', k === 0);
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-selected', k === 0 ? 'true' : 'false');
    });

    requestAnimationFrame(fit);
    addEventListener('resize', refit);
    addEventListener('load', refit);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(refit);
      scenes.forEach(function (s) { ro.observe(s); });
    }
    root.querySelectorAll('img').forEach(function (im) {
      if (!im.complete) im.addEventListener('load', refit, { once: true });
    });
    setTimeout(refit, 1800);   // after the other engines have filled their bands

    if (REDUCE || scenes.length < 2) return;          // auto-rotation off

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; },
        { threshold: 0.15 }).observe(root);
    }

    var every = 6000 + ordinal * 1400 + Math.floor(Math.random() * 1600);   // 6-11s, staggered
    var first = 2600 + ordinal * 700;                                        // FIRST turn fast
    setTimeout(function () {
      if (held) return;
      if (visible && !document.hidden) next();
      timer = setInterval(function () {
        if (!held && visible && !document.hidden) next();
      }, every);
    }, first);
  }


  /* ── the four fires each keep a rotating deep dive ──────────────────
     Same law as the stages: turns on its own, any click hands it over. */
  function dives(){
    var hosts = document.querySelectorAll('[data-dive]');
    if (!hosts.length) return;
    fetch('/js/rotations.json', {cache:'no-cache'})
      .then(function(r){ return r.json(); })
      .then(function(R){
        var D = R.deepDives || {};
        hosts.forEach(function (host, k) {
          var list = D[host.getAttribute('data-dive')] || [];
          if (!list.length) return;
          var pool = list.slice();
          for (var i=pool.length-1;i>0;i--){var j2=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j2];pool[j2]=t;}
          var at = 0, held = false, timer = null;
          function esc(t){var d=document.createElement('div');d.textContent=t||'';return d.innerHTML;}
          function paint(){
            var d = pool[at];
            host.innerHTML = '<a href="'+d.href+'">' +
              '<span class="dk">Deep dive</span>' +
              '<span class="dt">'+esc(d.t)+'</span>' +
              '<span class="ds">'+esc(d.k)+'</span></a>';
          }
          paint();
          function hold(){ if(held) return; held=true; host.classList.add('is-held'); clearInterval(timer); }
          ['click','touchstart','focusin'].forEach(function(ev){ host.addEventListener(ev, hold, {passive:true}); });
          if (REDUCE || pool.length < 2) return;
          var vis = true;
          if (window.IntersectionObserver)
            new IntersectionObserver(function(e){ vis = e[0].isIntersecting; }, {threshold:.2}).observe(host);
          setTimeout(function(){
            if (held) return;
            timer = setInterval(function(){
              if (held || !vis || document.hidden) return;
              at = (at + 1) % pool.length; paint();
            }, 7000 + k*900);
          }, 2200 + k*600);
        });
      }).catch(function(){});
  }
  dives();


  function srcsetFor(o, key){
    var full=o[key], small=o[key+'_900'];
    if(!small) return 'src="'+full+'"';
    return 'src="'+full+'" srcset="'+small+' 900w, '+full+' 1800w" sizes="(max-width:820px) 100vw, 900px"';
  }

  function boot() {
    document.documentElement.classList.add('stages-on');
    document.querySelectorAll('.stage').forEach(function (s, n) { Stage(s, n); });
    document.documentElement.dataset.stages = document.querySelectorAll('.stage').length;
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
