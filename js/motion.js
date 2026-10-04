/* TribeAwaken — daylight motion layer.
   Six rotating spots + GSAP/ScrollTrigger depth + Lenis smooth scroll.
   LOSE NOTHING: this only fills NEW bands and reorders existing ones.
   No existing content is removed. Without JS the page is the static site. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} return a; }
  function esc(t){ var d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

  fetch('/js/rotations.json').then(function(r){return r.json();}).then(function(R){
    var el;

    /* 1 — hero kicker */
    el = document.querySelector('.opening .eyebrow, .hero__kicker');
    if (el && R.heroKicker) el.textContent = pick(R.heroKicker);

    /* 2 — the statement band */
    el = document.querySelector('.state .pull');
    if (el && R.pull) {
      var q = pick(R.pull); el.innerHTML = q.q;
      var c = document.querySelector('.state cite'); if (c) c.textContent = q.c;
      window.__PULL_POOL = R.pull;
    }

    /* 3 — the gallery of his own photographs */
    el = document.querySelector('[data-gallery]');
    if (el && R.gallery) {
      el.innerHTML = shuffle(R.gallery).map(function (g) {
        var ss = g.src_900 ? ' srcset="' + g.src_900 + ' 900w, ' + g.src + ' 1800w" sizes="(max-width:820px) 100vw, 460px"' : '';
        return '<figure class="gal__fig"><img src="' + g.src + '"' + ss + ' alt="' + esc(g.cap) +
               '" loading="lazy" decoding="async"><figcaption>' + esc(g.cap) + '</figcaption></figure>';
      }).join('');
    }

    /* 4 — the shelf: four covers, order turns each visit */
    el = document.querySelector('[data-shelf]');
    if (el && R.shelf) {
      el.innerHTML = shuffle(R.shelf).map(function (b) {
        return '<a class="shelf__b" href="' + b.href + '"><img src="' + b.img + '" alt="' +
               esc(b.t) + '" loading="lazy" decoding="async"><span class="shelf__t">' + esc(b.t) +
               '</span><span class="shelf__k">' + esc(b.k) + '</span></a>';
      }).join('');
    }

    /* 5 — Abundance Mindset Magazine: three of the pool */
    el = document.querySelector('[data-magazine]');
    if (el && R.magazine) {
      window.__AMM_POOL = R.magazine.map(function(m){return '<a class="amm__c" href="'+m.href+'"><i>'+esc(m.kind)+'</i><b>'+esc(m.t)+'</b><span>'+esc(m.s)+'</span></a>';});
      el.innerHTML = shuffle(R.magazine).slice(0, el.getAttribute('data-magazine')==='all' ? R.magazine.length : 3).map(function (m) {
        return '<a class="amm__c" href="' + m.href + '">' + (m.art ? '<img class="amm__art" src="' + m.art + '" alt="">' : '') + '<i>' + esc(m.kind) + '</i><b>' +
               esc(m.t) + '</b><span>' + esc(m.s) + '</span></a>';
      }).join('');
    }

    /* 6 — the LATEST stack: same cards, order turns (nothing removed) */
    var stack = document.querySelector('#latest .feat');
    if (stack && stack.children.length > 1) {
      shuffle(Array.prototype.slice.call(stack.children)).forEach(function (n) { stack.appendChild(n); });
    }

    document.documentElement.classList.add('rot-ready');
  }).catch(function(){ document.documentElement.classList.add('rot-ready'); });

  /* ---------- the scroll experience ---------- */
  if (reduce || !window.gsap) { document.documentElement.classList.add('rv-on'); return; }
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* parallax retired — CSS Ken Burns drift animates the band photographs */

  gsap.utils.toArray('.rv').forEach(function (n) {
    gsap.set(n, { opacity: 0, y: 30 });
    gsap.to(n, { opacity: 1, y: 0, duration: .9, ease: 'power3.out',
      onComplete: function(){ gsap.set(n, { clearProps: 'transform,perspective,opacity' }); },
      scrollTrigger: { trigger: n, start: 'top 87%', once: true } });
  });

  ScrollTrigger.batch('.shelf__b, .gal__fig, .amm__c', {
    onEnter: function (els) {
      gsap.fromTo(els, { opacity: 0, y: 40, rotateY: -8, transformPerspective: 1100 },
        { opacity: 1, y: 0, rotateY: 0, duration: .95, ease: 'power3.out', stagger: .09,
          onComplete: function(){ gsap.set(els, { clearProps: 'transform,perspective,opacity' }); } });
    }, start: 'top 92%', once: true
  });

  document.documentElement.classList.add('rv-on');
})();
