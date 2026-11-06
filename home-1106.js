/* TRIBEAWAKEN HOME — 6 November 2026.
   Everything on this page reads as a plain document with this file off.
   With it on: the reveal, the morning mist and the rain on the glass (canvas,
   drawn in code), the spoken lines in the masked voice, the culture strip,
   the magazine briefs and the newest three from the live feed
   (/js/magazine-feed.json, which the 5 AM engine rewrites), the rotating
   gallery of his photographs (/js/rotations.json), the footage loops, the
   Stone Breath count, the audio players and the Council Fire film.
   Any band that turns stops for good on a deliberate tap (window.taphold). */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  html.classList.add('h6js');
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(t) { var d = doc.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function hold(el, fn) { if (window.taphold) window.taphold(el, fn); else el.addEventListener('click', fn, { passive: true }); }
  function onScreen(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { threshold: .15 }).observe(el);
  }

  /* ---------- reveal ---------- */
  (function () {
    var els = $$('.rv');
    if (!('IntersectionObserver' in window) || REDUCE) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    els.forEach(function (e) { io.observe(e); });
    function sweep() { els.forEach(function (e) { if (!e.classList.contains('in') && e.getBoundingClientRect().top < innerHeight * 1.02) { e.classList.add('in'); io.unobserve(e); } }); }
    addEventListener('load', function () { sweep(); setTimeout(sweep, 300); });
    setTimeout(sweep, 1500);
  })();

  /* ---------- menu (the shared burger) ---------- */
  (function () {
    var b = $('#burger'), m = $('#menu'), c = $('#menuClose');
    if (!b || !m) return;
    function open() { m.classList.add('open'); b.setAttribute('aria-expanded', 'true'); doc.body.classList.add('locked'); }
    function shut() { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); doc.body.classList.remove('locked'); }
    b.addEventListener('click', function () { m.classList.contains('open') ? shut() : open(); });
    if (c) c.addEventListener('click', shut);
    m.addEventListener('click', function (e) { if (e.target.tagName === 'A') shut(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  })();

  /* ---------- the morning mist: soft white drifting over the opening, light breaking through from the right ---------- */
  (function () {
    var c = $('canvas.h6-mist'); if (!c || !c.getContext) return;
    var ctx = c.getContext('2d'), W = 0, H = 0, dpr = 1, blobs = [], raf = null, t0 = performance.now(), visible = true;
    function size() {
      dpr = Math.min(1.5, devicePixelRatio || 1);
      var r = c.getBoundingClientRect(); W = Math.max(2, r.width | 0); H = Math.max(2, r.height | 0);
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      blobs = [];
      for (var i = 0; i < 14; i++) blobs.push({ x: Math.random(), y: .35 + Math.random() * .75, r: .18 + Math.random() * .28, s: .004 + Math.random() * .008, a: .18 + Math.random() * .22, p: Math.random() * 6.28 });
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      // the sun, low and to the right, before the mist burns off
      var g = ctx.createRadialGradient(W * .92, H * .08, 0, W * .92, H * .08, Math.max(W, H) * .9);
      g.addColorStop(0, 'rgba(255,236,170,.55)'); g.addColorStop(.35, 'rgba(255,244,214,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // three shafts of light, barely there, turning slowly
      ctx.save(); ctx.translate(W * .95, -H * .05);
      for (var k = 0; k < 3; k++) {
        var ang = 2.35 + k * .17 + Math.sin(t * .00008 + k) * .05;
        ctx.save(); ctx.rotate(ang);
        var lg = ctx.createLinearGradient(0, 0, Math.max(W, H) * 1.3, 0);
        lg.addColorStop(0, 'rgba(255,248,220,.16)'); lg.addColorStop(1, 'rgba(255,248,220,0)');
        ctx.fillStyle = lg; ctx.fillRect(0, -40 - k * 30, Math.max(W, H) * 1.3, 90 + k * 60); ctx.restore();
      }
      ctx.restore();
      // the mist itself, drifting left to right and lifting
      blobs.forEach(function (b) {
        var x = ((b.x + t * b.s * .00002) % 1.3 - .15) * W, y = (b.y + Math.sin(t * .00012 + b.p) * .025) * H, r = b.r * Math.max(W, H);
        var mg = ctx.createRadialGradient(x, y, 0, x, y, r);
        mg.addColorStop(0, 'rgba(255,255,255,' + b.a + ')'); mg.addColorStop(.55, 'rgba(255,255,255,' + (b.a * .45) + ')'); mg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      });
    }
    function loop(now) { if (visible && !doc.hidden) draw(now - t0); raf = requestAnimationFrame(loop); }
    size(); seed(); addEventListener('resize', size);
    if (REDUCE) { draw(40000); return; }
    onScreen(c, function (v) { visible = v; });
    raf = requestAnimationFrame(loop);
  })();

  /* ---------- rain on the glass, in sunlight: drops that gather, slide, and catch the light ---------- */
  (function () {
    var c = $('canvas.h6-rain'); if (!c || !c.getContext) return;
    var ctx = c.getContext('2d'), W = 0, H = 0, dpr = 1, drops = [], raf = null, visible = true, last = 0;
    function size() {
      dpr = Math.min(1.5, devicePixelRatio || 1);
      var r = c.getBoundingClientRect(); W = Math.max(2, r.width | 0); H = Math.max(2, r.height | 0);
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mk(top) { return { x: Math.random() * W, y: top ? -10 : Math.random() * H, r: 1.6 + Math.random() * 3.4, v: 0, life: 0, hold: 60 + Math.random() * 400 }; }
    function seed() { drops = []; for (var i = 0; i < Math.min(70, (W * H) / 9000); i++) drops.push(mk(false)); }
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      drops.forEach(function (d, i) {
        d.life += dt;
        if (d.life > d.hold) { d.v = Math.min(d.v + .06 * dt / 16, 1.6 + d.r * .35); d.y += d.v * dt / 16; d.x += Math.sin(d.y * .05) * .15; }
        if (d.y > H + 10) drops[i] = mk(true);
        // the trail it leaves
        if (d.v > .2) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = d.r * .6; ctx.beginPath(); ctx.moveTo(d.x, d.y - d.v * 9); ctx.lineTo(d.x, d.y); ctx.stroke(); }
        // the drop: a dark rim, a bright window, a point of sun
        var g = ctx.createRadialGradient(d.x - d.r * .3, d.y - d.r * .3, 0, d.x, d.y, d.r);
        g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(.6, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(60,70,60,.35)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,245,200,.9)'; ctx.beginPath(); ctx.arc(d.x + d.r * .35, d.y - d.r * .35, d.r * .22, 0, 6.283); ctx.fill();
      });
    }
    function loop(now) { var dt = Math.min(50, now - (last || now)); last = now; if (visible && !doc.hidden) draw(dt); raf = requestAnimationFrame(loop); }
    size(); seed(); addEventListener('resize', function () { size(); seed(); });
    if (REDUCE) { draw(16); return; }
    onScreen(c, function (v) { visible = v; });
    raf = requestAnimationFrame(loop);
  })();

  /* ---------- the spoken lines (masked voice): one plays at a time; the ring fills; the long one shows its time ---------- */
  var ALL_AUDIO = [];
  function pauseOthers(a) { ALL_AUDIO.forEach(function (o) { if (o !== a && !o.paused) o.pause(); }); }
  function fmt(s) { if (!isFinite(s) || s < 0) s = 0; var m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; }
  (function () {
    $$('.h6-say[data-src]').forEach(function (el) {
      var a = new Audio(); a.preload = 'none'; a.src = el.getAttribute('data-src'); ALL_AUDIO.push(a);
      var btn = $('.h6-say__btn', el), fg = $('.fg', el), time = $('.h6-say__time', el), fill = $('.h6-say__fill', el), bar = $('.h6-say__bar', el);
      var dur = Number(el.getAttribute('data-dur')) || 0;
      if (time && dur) time.textContent = fmt(dur) + (el.hasAttribute('data-masked') ? ' · spoken in a masked voice' : '');
      btn.addEventListener('click', function () { if (a.paused) { pauseOthers(a); a.play(); } else a.pause(); });
      a.addEventListener('play', function () { el.classList.add('is-playing'); btn.setAttribute('aria-label', 'Pause'); });
      a.addEventListener('pause', function () { el.classList.remove('is-playing'); btn.setAttribute('aria-label', 'Play'); });
      a.addEventListener('ended', function () { el.classList.remove('is-playing'); if (fg) fg.style.strokeDashoffset = 160; if (fill) fill.style.width = '0'; });
      a.addEventListener('timeupdate', function () {
        var p = a.duration ? a.currentTime / a.duration : 0;
        if (fg) fg.style.strokeDashoffset = 160 - 160 * p;
        if (fill) fill.style.width = (p * 100) + '%';
        if (time && a.duration) time.textContent = fmt(a.currentTime) + ' / ' + fmt(a.duration);
      });
      if (bar) bar.addEventListener('click', function (e) {
        var r = bar.getBoundingClientRect(), x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        if (a.duration) a.currentTime = x * a.duration;
      });
    });
  })();

  /* ---------- the two audio players that were already here (the song, the word before you begin) ---------- */
  (function () {
    $$('[data-audio]').forEach(function (card) {
      var a = $('audio', card), btn = $('.ap__play', card), bar = $('.ap__bar', card), fill = $('.ap__fill', card), time = $('.ap__time', card);
      if (!a || !btn) return;
      ALL_AUDIO.push(a);
      btn.addEventListener('click', function () { if (a.paused) { pauseOthers(a); a.play(); } else a.pause(); });
      a.addEventListener('play', function () { card.classList.add('playing'); btn.setAttribute('aria-label', 'Pause'); });
      a.addEventListener('pause', function () { card.classList.remove('playing'); btn.setAttribute('aria-label', 'Play'); });
      a.addEventListener('ended', function () { card.classList.remove('playing'); fill.style.width = '0'; });
      a.addEventListener('loadedmetadata', function () { time.textContent = '0:00 / ' + fmt(a.duration); });
      a.addEventListener('timeupdate', function () {
        var p = a.duration ? (a.currentTime / a.duration) * 100 : 0; fill.style.width = p + '%';
        bar.setAttribute('aria-valuenow', Math.round(p)); time.textContent = fmt(a.currentTime) + (a.duration ? ' / ' + fmt(a.duration) : '');
      });
      function seek(e) { var r = bar.getBoundingClientRect(), x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); if (a.duration) a.currentTime = x * a.duration; }
      bar.addEventListener('click', seek);
      bar.addEventListener('keydown', function (e) {
        if (!a.duration) return;
        if (e.key === 'ArrowRight') { a.currentTime = Math.min(a.duration, a.currentTime + 5); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { a.currentTime = Math.max(0, a.currentTime - 5); e.preventDefault(); }
      });
    });
  })();

  /* ---------- the culture strip: doubled so it marches without a seam; a tap holds it ---------- */
  (function () {
    var s = $('.h6-strip'), t = $('.h6-strip__track'); if (!s || !t) return;
    t.innerHTML += t.innerHTML;
    $$('img', t).slice(Math.floor(t.children.length / 2)).forEach(function (im) { im.setAttribute('aria-hidden', 'true'); im.alt = ''; });
    hold(s, function () { s.classList.toggle('is-paused'); });
  })();

  /* ---------- the magazine: today's briefs from the live feed; one turns at a time; a tap stops it ---------- */
  (function () {
    var box = $('[data-h6-briefs]'), mag = $('.h6-mag'), date = $('[data-h6-magdate]'); if (!box) return;
    fetch('/js/magazine-feed.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (F) {
      var pool = [];
      (F.found || []).forEach(function (it) {
        if (!it.title || !it.url) return;
        pool.push({ k: it.source || 'Found this morning', t: it.title, s: it.dek || '', h: it.url, m: it.lane ? it.lane : '' });
      });
      var mine = (F.mine || []).slice().sort(function (a, b) { return (b.date || '') < (a.date || '') ? -1 : 1; }).slice(0, 6);
      mine.forEach(function (it, i) { pool.splice(Math.min(pool.length, 2 + i * 3), 0, { k: 'From the journal', t: it.title, s: it.dek || '', h: it.href, m: it.pillar || '' }); });
      if (pool.length < 5) return;
      if (date && F.generated) {
        var d = new Date(F.generated); if (!isNaN(d)) date.innerHTML = esc(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) + '<br>edition';
      }
      function brief(it) {
        return '<a class="h6-brief" href="' + esc(it.h) + '"><i>' + esc(it.k) + '</i><b>' + esc(it.t) + '</b>' + (it.s ? '<span>' + esc(it.s.length > 150 ? it.s.slice(0, 148).replace(/\s+\S*$/, '') + '…' : it.s) + '</span>' : '') + (it.m ? '<em>' + esc(it.m) + '</em>' : '') + '</a>';
      }
      var idx = 5;
      box.innerHTML = pool.slice(0, 5).map(brief).join('');
      if (REDUCE) return;
      var stopped = false, visible = false, timer = null;
      onScreen(box, function (v) { visible = v; });
      function turn() {
        if (stopped || !visible || doc.hidden) return;
        var first = box.children[0]; if (!first) return;
        first.classList.add('is-out');
        setTimeout(function () {
          var next = pool[idx % pool.length]; idx++;
          first.remove();
          box.insertAdjacentHTML('beforeend', brief(next));
          box.lastElementChild.classList.add('is-in');
        }, 430);
      }
      timer = setInterval(turn, 8500);
      hold(mag || box, function () { stopped = true; clearInterval(timer); (mag || box).classList.add('is-paused'); });
    }).catch(function () {});
  })();

  /* ---------- the newest three: from the same feed the journal reads, so the 5 AM engine keeps this current ---------- */
  (function () {
    var box = $('[data-h6-latest]'); if (!box) return;
    fetch('/js/magazine-feed.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (F) {
      var mine = (F.mine || []).filter(function (x) { return x.href && x.title; })
        .sort(function (a, b) { return (b.date || '') < (a.date || '') ? -1 : 1; }).slice(0, 3);
      if (mine.length < 3) return;
      box.innerHTML = mine.map(function (it) {
        var d = it.date ? new Date(it.date + 'T12:00:00') : null;
        return '<a href="' + esc(it.href) + '"><span class="im"><img src="' + esc(it.img || '') + '" alt="" loading="lazy" decoding="async"></span>' +
          (d && !isNaN(d) ? '<time datetime="' + esc(it.date) + '">' + esc(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) + '</time>' : '') +
          '<b>' + esc(it.title) + '</b>' + (it.dek ? '<span class="k">' + esc(it.dek) + '</span>' : '') + '</a>';
      }).join('');
    }).catch(function () {});
  })();

  /* ---------- the gallery of his photographs: the full set from rotations.json, turning one step at a time ---------- */
  (function () {
    var gal = $('.h6-gal'), strip = $('.h6-gal__strip'); if (!gal || !strip) return;
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function go(items) {
      if (items && items.length >= 6) {
        strip.innerHTML = shuffle(items.filter(function (g) { return !/elder-sky|elder-hands|hands-braiding/.test(g.src); })).map(function (g) {
          return '<figure><img src="' + esc(g.src) + '" alt="' + esc(g.cap) + '" loading="lazy" decoding="async"><figcaption>' + esc(g.cap) + '</figcaption></figure>';
        }).join('');
      }
      if (REDUCE) return;
      var stopped = false, visible = false;
      onScreen(gal, function (v) { visible = v; });
      setInterval(function () {
        if (stopped || !visible || doc.hidden || strip.children.length < 2) return;
        var first = strip.children[0], w = first.getBoundingClientRect().width + 10;
        strip.style.transform = 'translateX(' + (-w) + 'px)';
        setTimeout(function () { strip.style.transition = 'none'; strip.appendChild(first); strip.style.transform = 'none'; void strip.offsetWidth; strip.style.transition = ''; }, 920);
      }, 7000);
      hold(gal, function () { stopped = true; gal.classList.add('is-paused'); });
    }
    fetch('/js/rotations.json').then(function (r) { return r.json(); }).then(function (R) { go(R.gallery); }).catch(function () { go(null); });
  })();

  /* ---------- footage loops: load only when near, play muted, rest when away ---------- */
  (function () {
    var vids = $$('video[data-src]'); if (!vids.length) return;
    vids.forEach(function (v) {
      v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', '');
      onScreen(v, function (on) {
        if (on) { if (!v.src) { v.src = v.getAttribute('data-src'); v.load(); } if (!REDUCE) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!v.paused) v.pause();
      });
    });
  })();

  /* ---------- the Stone Breath: in 4, hold 4, out 6, hold 4. Five rounds. ---------- */
  (function () {
    var btn = $('#bStart'), word = $('#bWord'), phase = $('#bPhase'), count = $('#bCount'), fill = $('#bFill');
    if (!btn) return;
    var STEPS = [['Breathe in', 4, 1], ['Hold', 4, 1], ['Breathe out', 6, .62], ['Hold', 4, .62]];
    var LINES = ['choose your stone — feel the ages it took to come smooth', 'give thanks to the water that carried it',
      'let your jaw drop, let your shoulders drop', 'the fear may stand there — give it no chair to sit in', 'receive what those before you are holding out'];
    var running = false, timer = null;
    function reset() { running = false; clearInterval(timer); word.textContent = 'Ready'; phase.textContent = 'hold a stone, or imagine one'; count.textContent = ''; fill.style.transition = 'transform .8s ease'; fill.style.transform = 'scale(.62)'; btn.textContent = 'Begin'; }
    function run() {
      var round = 0, step = 0, left = STEPS[0][1];
      running = true; btn.textContent = 'Stop'; phase.textContent = LINES[0];
      function apply() { var st = STEPS[step]; word.textContent = st[0]; count.textContent = left; fill.style.transition = 'transform ' + st[1] + 's linear'; fill.style.transform = 'scale(' + st[2] + ')'; }
      apply();
      timer = setInterval(function () {
        left--; if (left > 0) { count.textContent = left; return; }
        step++;
        if (step >= STEPS.length) {
          step = 0; round++;
          if (round >= 5) { clearInterval(timer); running = false; word.textContent = 'Return it'; phase.textContent = 'put the stone back in the water, with thanks'; count.textContent = ''; fill.style.transition = 'transform 1.6s ease'; fill.style.transform = 'scale(.62)'; btn.textContent = 'Again'; return; }
          phase.textContent = LINES[round];
        }
        left = STEPS[step][1]; apply();
      }, 1000);
    }
    btn.addEventListener('click', function () { running ? reset() : run(); });
  })();

  /* ---------- the Council Fire film ---------- */
  (function () {
    var f = $('#cfilm'); if (!f) return;
    var v = $('video', f), c = $('.cfilm__cover', f);
    c.addEventListener('click', function () { f.classList.add('is-playing'); v.setAttribute('controls', ''); pauseOthers(null); v.play(); });
  })();
})();
