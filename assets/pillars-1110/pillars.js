/* TRIBEAWAKEN — the two pillar front doors — page script — 2026-11-10
   Runs on the Ancestral Peaks engine (window.AP, engine/site.js). Adds only what the home page's shell needs:
   the bar and menu, the Magazine & Journal drop, the language strip, the section dock and the phone thumb bar,
   the sound beds, the wide/phone film swap, and a phone governor so that at most two films decode at once.
   Nothing is drawn over a film: no canvas, no mist, no particles. */
(function(){
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const html = document.documentElement;
if (!window.AP) return;

/* the sound beds: his real Oak Creek water, the garden at first light, a soft rain */
const AU = '/assets/home-v2/audio/';
AP.sound.register('creek',  AU + 'bed-creek-oak-creek-48s.mp3');
AP.sound.register('garden', AU + 'first-light-in-the-garden-piano-flute-waterfall-166s.mp3');
AP.sound.register('rain',   AU + 'bed-rain-soft-46s.mp3');

/* a laptop plays the wide cut of a scene; a phone plays the small copy made for it */
const phone = matchMedia('(max-width:980px), (pointer:coarse)').matches;
const wide = matchMedia('(min-width:981px)').matches;
if (wide) $$('[data-src-wide]').forEach(el => { el.dataset.src = el.dataset.srcWide; if (el.dataset.posterWide) el.dataset.poster = el.dataset.posterWide; });
else $$('[data-src-phone]').forEach(el => { el.dataset.src = el.dataset.srcPhone; if (el.dataset.posterPhone) el.dataset.poster = el.dataset.posterPhone; });

AP.init();

/* the bar: menu, solid on scroll, sound */
(function bar(){
  const host = $('#bar'); if (!host) return;
  const burger = $('.ap-burger', host), menu = $('#apMenu');
  if (burger && menu) {
    const setOpen = o => { burger.setAttribute('aria-expanded', String(o)); menu.classList.toggle('open', o); menu.setAttribute('aria-hidden', String(!o)); host.classList.toggle('menu-open', o); if (AP.lenis) { o ? AP.lenis.stop() : AP.lenis.start(); } document.body.style.overflow = o ? 'hidden' : ''; };
    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }
  const onScroll = () => host.classList.toggle('solid', (window.scrollY || html.scrollTop) > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('.ap-sound', host).forEach(b => { if (AP.sound._buttons.indexOf(b) < 0) { b.addEventListener('click', () => AP.sound.toggle()); AP.sound._buttons.push(b); } });
})();

/* Magazine & Journal: one item in the bar, opening on hover, focus or tap */
(function navDrop(){
  const d = $('.nav-drop'); if (!d) return;
  const b = $('button', d), set = o => { d.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); };
  b.addEventListener('click', e => { e.stopPropagation(); set(!d.classList.contains('open')); });
  document.addEventListener('click', e => { if (!d.contains(e.target)) set(false); });
  d.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); } });
})();

/* the Global language strip rides above the bar at the top, and tucks away once the reader scrolls */
(function strip(){
  const f = () => html.classList.toggle('past-strip', scrollY > 160);
  f(); addEventListener('scroll', f, { passive: true });
})();

/* the section dock: jump to any part of the page, and see where you are; out of the way on the first screen */
(function dock(){
  const dock = $('#secDock'); if (!dock) return;
  const toggle = $('.sec-toggle', dock), links = $$('ol a', dock);
  links.forEach(a => { const t = document.createElement('span'); t.className = 't'; t.textContent = a.textContent; a.textContent = ''; a.appendChild(t); a.setAttribute('aria-label', t.textContent); });
  const setOpen = o => { dock.classList.toggle('open', o); if (toggle) toggle.setAttribute('aria-expanded', String(o)); $$('.thumbbar button', dock).forEach(b => b.setAttribute('aria-expanded', String(o))); };
  if (toggle) toggle.addEventListener('click', () => setOpen(!dock.classList.contains('open')));
  const go = (h, e) => { const el = document.querySelector(h); if (!el) return; e.preventDefault(); setOpen(false); const bar = $('#bar'), off = bar ? -Math.max(bar.offsetHeight, bar.getBoundingClientRect().bottom) : 0; if (AP.lenis) AP.lenis.scrollTo(el, { offset: off, duration: 1.3 }); else el.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', h); };
  links.forEach(a => a.addEventListener('click', e => go(a.getAttribute('href'), e)));
  document.addEventListener('click', e => { if (!dock.contains(e.target)) setOpen(false); });
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { links.forEach(l => l.classList.remove('on')); const l = map.get(en.target.id); if (l) l.classList.add('on'); } }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
  const f = () => html.classList.toggle('at-top', scrollY < innerHeight * 0.7);
  f(); addEventListener('scroll', f, { passive: true }); addEventListener('resize', f);

  /* the thumb bar on the phone: three places on this page, and every section */
  if (!matchMedia('(max-width:980px)').matches || !dock.dataset.thumbs) return;
  const ico = {
    circle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="8.5" opacity=".55"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5h12v14H6a2 2 0 0 1-2-2z"/><path d="M16 8h4v9a2 2 0 0 1-2 2h-2"/><path d="M7 9h6M7 12h6M7 15h4"/></svg>',
    mark: '<svg viewBox="0 0 24 24"><path d="M4 19l5-11 4 7 2-3 5 7z"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4.5a1.5 1.5 0 0 1 3 0V11M13 10.5V6a1.5 1.5 0 0 1 3 0v7.5"/><path d="M16 13.5l2.2-2.2a1.4 1.4 0 0 1 2 2L15.5 18a6 6 0 0 1-8.5 0L4.6 15.6a1.4 1.4 0 0 1 2-2L7 15"/></svg>',
    all: '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg>'
  };
  const bar = document.createElement('div'); bar.className = 'thumbbar';
  dock.dataset.thumbs.split(',').forEach(item => {
    const [h, label, k] = item.split('|'); const a = document.createElement('a'); a.href = h; a.innerHTML = (ico[k] || ico.circle) + '<span></span>'; $('span', a).textContent = label;
    a.addEventListener('click', e => go(h, e)); bar.appendChild(a);
  });
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.innerHTML = ico.all + '<span></span>'; $('span', b).textContent = (toggle && toggle.textContent.trim()) || 'Sections';
  b.addEventListener('click', e => { e.stopPropagation(); setOpen(!dock.classList.contains('open')); });
  bar.appendChild(b); dock.appendChild(bar);
})();

/* the phone governor (11/10, after the home page closed Safari on an iPhone): at most two films decode at once.
   The two nearest the middle of the screen play; every other loop rests on its poster until it is nearer. */
(function governor(){
  if (!phone || !AP.motion) return;
  const MAX = 2;
  let t = 0;
  const run = () => {
    t = 0;
    const H = innerHeight, mid = H / 2;
    const near = AP.loops.map(l => { const r = l.el.getBoundingClientRect(); return { l, r, d: Math.abs((r.top + r.bottom) / 2 - mid), vis: r.bottom > -H * .25 && r.top < H * 1.25 && l.el.offsetParent !== null }; });
    const on = near.filter(x => x.vis).sort((a, b) => a.d - b.d).slice(0, MAX).map(x => x.l);
    near.forEach(x => { const v = x.l.video; if (on.indexOf(x.l) >= 0) { if (v.paused) x.l.play(); } else if (!v.paused) { v.pause(); } });
  };
  const ask = () => { if (!t) t = setTimeout(run, 220); };
  addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); addEventListener('ap:ready', ask);
  setInterval(run, 1500); run();
})();
})();
