/* TribeAwaken — LIVE ROTATION ENGINE.
   Tony's motion law (10/3): "everything rotates automatically...
   until someone clicks.. world class 3D."
   - Each [data-live] band auto-advances on its own staggered cadence.
   - 3D perspective transitions (GSAP when present, CSS fallback).
   - Any click / touch / keyboard focus inside a band STOPS that band.
   - Bands rest while offscreen (IntersectionObserver).
   - prefers-reduced-motion: engine stays off entirely.
   LOSE NOTHING: rotates existing children only; no content removed. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var PERIODS = { gallery: 7000, shelf: 8000, latest: 9000, magazine: 8500, pull: 11000, fires: 10000 };
  var bands = [];

  function flipIn(el, dir) {
    if (window.gsap) {
      gsap.fromTo(el, { opacity: 0, rotateY: dir * 55, z: -120, transformPerspective: 1100 },
        { opacity: 1, rotateY: 0, z: 0, duration: .9, ease: 'power3.out' });
    } else {
      el.classList.remove('live-flip'); void el.offsetWidth; el.classList.add('live-flip');
    }
  }
  function flipSwap(el, mutate) {
    if (window.gsap) {
      gsap.to(el, { opacity: 0, rotateY: -45, z: -90, transformPerspective: 1100, duration: .45, ease: 'power2.in',
        onComplete: function () { mutate(); flipIn(el, 1); } });
    } else { mutate(); }
  }

  function makeBand(root, key, advance) {
    if (!root) return;
    var band = { root: root, key: key, advance: advance, timer: null, stopped: false, visible: false };
    root.setAttribute('data-live', key);
    var tag = document.createElement('span');
    tag.className = 'live-paused-tag'; tag.textContent = 'paused — yours';
    root.appendChild(tag);

    function tick() { if (!band.stopped && band.visible) band.advance(); }
    function start() {
      if (band.timer || band.stopped) return;
      band.timer = setInterval(tick, PERIODS[key] || 8000);
    }
    function stopForever() {
      band.stopped = true;
      if (band.timer) { clearInterval(band.timer); band.timer = null; }
      root.classList.add('is-paused');
    }
    ['pointerdown', 'keydown'].forEach(function (ev) {
      root.addEventListener(ev, stopForever, { passive: true });
    });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { band.visible = e.isIntersecting; });
    }, { threshold: .25 }).observe(root);

    // staggered start; FIRST turn comes fast so the motion is seen in action,
    // then the calm cadence takes over (Tony: "people get to see it in action")
    var firstKick = 2200 + bands.length * 900;
    setTimeout(function () {
      if (!band.stopped && band.visible) band.advance();
      start();
    }, firstKick);
    bands.push(band);
  }

  function rotateChildren(container) {
    var kids = container.children;
    if (kids.length < 2) return;
    var out = kids[0];
    if (window.gsap) {
      gsap.to(out, { opacity: 0, rotateY: -65, z: -100, transformPerspective: 1000, duration: .5, ease: 'power2.in',
        onComplete: function () {
          container.appendChild(out);
          gsap.set(out, { clearProps: 'all' });
          var incoming = container.children[0];
          gsap.fromTo(incoming, { opacity: 0, rotateY: 55, z: -110, transformPerspective: 1000 },
            { opacity: 1, rotateY: 0, z: 0, duration: .8, ease: 'power3.out', onComplete: function(){ gsap.set(incoming, { clearProps: 'transform,perspective' }); } });
        } });
    } else { container.appendChild(out); }
  }

  function init() {
    // 1 — the gallery strip: first figure moves to the end, next photo steps up
    var gal = document.querySelector('[data-gallery]');
    if (gal) makeBand(gal.closest('section') || gal, 'gallery', function () { rotateChildren(gal); });

    // 2 — the shelf: the covers reorder, one turn at a time
    var shelf = document.querySelector('[data-shelf]');
    if (shelf) makeBand(shelf.closest('section') || shelf, 'shelf', function () { rotateChildren(shelf); });

    // 3 — the LATEST stack: the three cards take turns leading
    var latest = document.querySelector('#latest .feat');
    if (latest) makeBand(latest.closest('section') || latest, 'latest', function () { rotateChildren(latest); });

    // 4 — the magazine: includes ALL the articles — harvested from the page itself
    var amm = document.querySelector('[data-magazine]');
    if (amm) {
      var seen = {}; var pool = [];
      document.querySelectorAll('a[href^="/journal/"]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (seen[href] || href === '/journal/') return;
        var t = (a.querySelector('h3,b') || a).textContent.trim().replace(/\s+/g,' ');
        var k = (a.querySelector('.jc__kick,.jrow__k,.feat__d,i') || {}).textContent || 'From the journal';
        if (!t || t.length < 6) return;
        seen[href] = 1;
        var ART = ['/assets/art/dine-dawn.svg','/assets/art/baltic-oak.svg','/assets/art/japan-bridge.svg',
          '/assets/art/four-capitals.svg','/assets/art/dine-mountains.svg','/assets/art/baltic-juosta.svg',
          '/assets/art/japan-crane.svg','/assets/art/baltic-stork.svg','/assets/art/japan-koi.svg',
          '/assets/art/baltic-sun.svg','/assets/art/japan-enso.svg','/assets/art/runner.svg'];
        pool.push('<a class="amm__c" href="' + href + '"><img class="amm__art" src="' + ART[pool.length % ART.length] + '" alt="">' +
          '<i>' + k.trim() + '</i><b>' + t + '</b></a>');
      });
      if (pool.length < 4) pool = (window.__AMM_POOL || []).slice();
      // the strip opens already harvested: five stacked briefs from the catalog
      function layFive(){ if (pool.length >= 5) amm.innerHTML = pool.slice(0,5).join(''); }
      layFive();
      setTimeout(layFive, 1600); // motion.js's async fill loses the race on purpose
      makeBand(amm.closest('section') || amm, 'magazine', function () {
        if (pool.length > amm.children.length) {
          var next = pool.shift(); pool.push(next);
          var first = amm.children[0];
          flipSwap(first, function () {
            first.outerHTML = next;
          });
          // re-grab: outerHTML replaced the node; order shift completes the turn
          amm.appendChild(amm.children[0]);
        } else { rotateChildren(amm); }
      });
    }

    // 5 — the statement pull-quote: crossfades through the pool
    var pull = document.querySelector('.state .pull');
    if (pull && window.__PULL_POOL && window.__PULL_POOL.length > 1) {
      var quotes = window.__PULL_POOL.slice(); var qi = 0;
      makeBand(document.querySelector('.state'), 'pull', function () {
        qi = (qi + 1) % quotes.length;
        var cite = document.querySelector('.state cite');
        flipSwap(pull, function () {
          pull.innerHTML = quotes[qi].q;
          if (cite) cite.textContent = quotes[qi].c;
        });
      });
    }

    // 6 — the Four Fires: ONE fire burns at a time; a real 3D turn to the next
    var fires = Array.prototype.slice.call(document.querySelectorAll('.four__row'));
    if (fires.length > 1) {
      var stage = document.querySelector('.four');
      var fi = 0;
      var dots = document.createElement('div'); dots.className = 'four__dots';
      fires.forEach(function (_, i) {
        var b = document.createElement('button');
        b.addEventListener('click', function () { show(i); });
        dots.appendChild(b);
      });
      stage.appendChild(dots);
      function show(i) {
        fi = i;
        fires.forEach(function (r, j) { r.classList.toggle('is-live', j === i); });
        Array.prototype.forEach.call(dots.children, function (d, j) { d.classList.toggle('on', j === i); });
        var row = fires[i];
        if (window.gsap) {
          gsap.fromTo(row, { opacity: 0, rotateY: 50, z: -140, transformPerspective: 1100 },
            { opacity: 1, rotateY: 0, z: 0, duration: .85, ease: 'power3.out', onComplete: function(){ gsap.set(row, { clearProps: 'transform,perspective' }); } });
        }
      }
      show(0);
      makeBand(stage, 'fires', function () { show((fi + 1) % fires.length); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 400); });
  } else { setTimeout(init, 400); }
})();
