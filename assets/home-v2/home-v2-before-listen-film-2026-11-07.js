/* TRIBEAWAKEN HOME v2 — page script — 2026-11-06
   Runs on top of the Ancestral Peaks engine (window.AP). Adds: the morning mist, the sun shower, the TribeAwaken bar,
   the living mosaic, the drifting journal rows, the breath ring, and render mode for the frame renderer. */
(function(){
'use strict';
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const html = document.documentElement;
const V = '/assets/home-v2/video/', I = '/assets/home-v2/img/', AU = '/assets/home-v2/audio/';
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- a canvas that runs only while its section is on screen, and seeks under the renderer ---------- */
function field(canvas, draw, scale){
  if (!canvas) return null;
  const ctx = canvas.getContext('2d'); let w = 0, h = 0, raf = 0, on = false, t0 = performance.now();
  const S = scale || 0.5;
  function resize(){ const r = canvas.getBoundingClientRect(); w = Math.max(2, Math.round(r.width * S)); h = Math.max(2, Math.round(r.height * S)); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; } }
  function frame(t){ resize(); ctx.clearRect(0, 0, w, h); draw(ctx, w, h, t); }
  function loop(){ frame((performance.now() - t0) / 1000); raf = requestAnimationFrame(loop); }
  const api = { seek(t){ frame(t); }, start(){ if (on || !AP.motion) return; on = true; raf = requestAnimationFrame(loop); }, stop(){ on = false; cancelAnimationFrame(raf); } };
  if (AP.motion && 'IntersectionObserver' in window) {
    const host = canvas.closest('section') || canvas.parentElement;
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? api.start() : api.stop()), { rootMargin: '10% 0px' }).observe(host);
  } else frame(6);
  addEventListener('resize', () => frame(AP.motion ? (performance.now() - t0) / 1000 : 6));
  AP.registerSeek(t => api.seek(t));
  return api;
}

/* the morning mist: soft banks of light drifting across, pooling low, and the sun warming the top right */
function mistDraw(seed, strength, cool){
  const R = rng(seed), N = 13, blobs = [];
  for (let i = 0; i < N; i++) blobs.push({ x: R(), y: 0.35 + R() * 0.7, r: 0.2 + R() * 0.32, v: (0.012 + R() * 0.02) * (R() < 0.5 ? -1 : 1), a: 0.07 + R() * 0.11, ph: R() * 6.28, bob: 0.02 + R() * 0.04 });
  return function(ctx, w, h, t){
    ctx.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const r = b.r * w, span = w + 2 * r;
      let x = ((b.x * span + b.v * w * t) % span + span) % span - r;
      const y = b.y * h + Math.sin(t * 0.09 + b.ph) * b.bob * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const a = b.a * strength * (0.85 + 0.15 * Math.sin(t * 0.13 + b.ph));
      const c0 = cool ? '228,238,246' : '255,251,242', c1 = cool ? '220,232,242' : '255,248,232';   // cool: the blue-grey mist before the sun is up
      g.addColorStop(0, `rgba(${c0},${a})`); g.addColorStop(0.55, `rgba(${c1},${a * 0.45})`); g.addColorStop(1, `rgba(${c1},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, 6.2832); ctx.fill();
    }
    // the mist pooling along the ground
    const pool = ctx.createLinearGradient(0, h * 0.55, 0, h);
    const pa = (0.16 + 0.05 * Math.sin(t * 0.07)) * strength;
    const pc = cool ? '226,236,244' : '255,250,240';
    pool.addColorStop(0, `rgba(${pc},0)`); pool.addColorStop(1, `rgba(${pc},${pa})`);
    ctx.fillStyle = pool; ctx.fillRect(0, h * 0.55, w, h * 0.45);
    ctx.globalCompositeOperation = 'source-over';
  };
}

/* a sun shower: a few bright drops falling through the light, rings where they land */
function rainDraw(seed, count){
  const R = rng(seed), drops = [];
  for (let i = 0; i < count; i++) drops.push({ x: R(), v: 0.9 + R() * 0.5, l: 0.035 + R() * 0.035, p: R() * 10, s: 0.6 + R() * 0.36, a: 0.22 + R() * 0.25 });
  return function(ctx, w, h, t){
    const slant = 0.07;
    ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, w / 900);
    for (const d of drops) {
      const cyc = 1.3 / d.v, u = (((t + d.p) / cyc) % 1 + 1) % 1;       // 0..1 through one fall
      const y = (u * 1.3 - 0.15) * h, x = d.x * w + (y / h) * slant * w;
      const uh = (d.s + 0.15) / 1.3;                                   // where it meets the water
      if (u < uh) {
        const L = d.l * h, fade = u < 0.1 ? u / 0.1 : 1;
        const g = ctx.createLinearGradient(x, y - L, x + slant * L, y);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${d.a * fade})`);
        ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(x - slant * L, y - L); ctx.lineTo(x, y); ctx.stroke();
      } else if (u < uh + 0.22) {
        const k = (u - uh) / 0.22, sy = d.s * h, sx = d.x * w + d.s * slant * w, r = (0.01 + k * 0.05) * w;
        ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.55 * d.a * 2})`; ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.32, 0, 0, 6.2832); ctx.stroke();
        if (k < 0.35) { ctx.fillStyle = `rgba(255,255,255,${(0.35 - k) * 1.2})`; ctx.beginPath(); ctx.arc(sx, sy - k * 0.02 * h, w / 700 * (1 - k), 0, 6.2832); ctx.fill(); }
      }
    }
  };
}

/* morning dew: glints of light on the leaves and drops catching the sun, soft bokeh drifting up through the beams */
function dewDraw(seed, nGlint, nBokeh, low){
  const R = rng(seed), G = [], B = [];
  for (let i = 0; i < nGlint; i++) G.push({ x: R(), y: (low ? 0.22 : 0.05) + R() * (low ? 0.78 : 0.95), per: 1.6 + R() * 3.4, ph: R() * 6.283, s: 0.5 + R() * 1.1, warm: R() });
  for (let i = 0; i < nBokeh; i++) B.push({ x: R(), y: R(), r: 0.012 + R() * 0.03, v: 0.006 + R() * 0.012, ph: R() * 6.283, a: 0.1 + R() * 0.16 });
  return function(ctx, w, h, t){
    ctx.globalCompositeOperation = 'lighter';
    for (const b of B) {
      const y = (((b.y - t * b.v) % 1) + 1) % 1 * h, x = (b.x + 0.02 * Math.sin(t * 0.3 + b.ph)) * w, r = b.r * w;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const a = b.a * (0.7 + 0.3 * Math.sin(t * 0.7 + b.ph));
      g.addColorStop(0, `rgba(255,232,170,${a})`); g.addColorStop(0.72, `rgba(255,226,150,${a * 0.75})`); g.addColorStop(0.9, `rgba(255,240,200,${a * 0.95})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
    ctx.lineCap = 'round';
    for (const p of G) {
      const k = Math.max(0, Math.sin(t * 6.283 / p.per + p.ph)); const b = Math.pow(k, 10); if (b < 0.02) continue;
      const x = p.x * w, y = p.y * h, s = p.s * w / 180, col = p.warm > .6 ? '255,236,190' : '255,252,240';
      const g = ctx.createRadialGradient(x, y, 0, x, y, s * 3.2);
      g.addColorStop(0, `rgba(${col},${0.95 * b})`); g.addColorStop(0.35, `rgba(${col},${0.35 * b})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 3.2, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = `rgba(${col},${0.85 * b})`; ctx.lineWidth = Math.max(0.6, s * 0.35);
      const L = s * 4.5 * (0.6 + 0.4 * b);
      ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
      ctx.strokeStyle = `rgba(${col},${0.35 * b})`; ctx.lineWidth = Math.max(0.5, s * 0.25);
      ctx.beginPath(); ctx.moveTo(x - L * .5, y - L * .5); ctx.lineTo(x + L * .5, y + L * .5); ctx.moveTo(x + L * .5, y - L * .5); ctx.lineTo(x - L * .5, y + L * .5); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  };
}

/* ---------- the content lists ---------- */
const JOURNAL = [
  ['a-home-calm-enough-to-teach-in', 'A Home Calm Enough to Teach In', 'Human Resilience', 'baltic-oak'],
  ['what-a-far-messenger-is', 'What a Far Messenger Is', 'The Books · The Doctorate', 'japan-enso'],
  ['the-ancestral-code-for-living-to-100', 'The Ancestral Code for Living to 100', 'Health & Longevity', 'dine-dawn'],
  ['why-i-call-the-sheep-camp-a-retreat', 'Why I Call the Sheep Camp a Retreat', 'Human Resilience', 'baltic-sun'],
  ['the-council-fire-arrives-with-a-family-on-its-cover', 'The Council Fire Arrives With a Family on Its Cover', 'Community Resilience', 'dine-dawn'],
  ['little-piles-of-rock', 'Little Piles of Rock', 'Human Resilience', 'dine-mountains'],
  ['a-joke-at-the-dry-spring', 'A Joke at the Dry Spring', 'Human Resilience', 'japan-bridge'],
  ['long-term-resilience-ancient-culture', 'Building Long-Term Resilience With an Ancient Culture', 'Human Resilience', 'baltic-juosta'],
  ['stone-breath-has-gone-out-to-the-world', 'Stone Breath Has Gone Out to the World', 'The Books', 'japan-bridge'],
  ['tibet-the-unbroken-thread', 'Tibet, and the Unbroken Thread', 'Global · One Operating System', 'baltic-oak'],
  ['they-tried-to-erase-a-whole-people', 'They Tried to Erase a Whole People. Now They Raise the Happiest Young Souls on Earth.', 'The Story', 'four-capitals'],
  ['what-the-cottonwood-sings-roots-workshop', 'What the Cottonwood Sings: A Poet’s Afternoon in the Roots Workshop', 'Reflections', 'dine-mountains'],
  ['one-in-a-trillion', 'One in a Trillion', 'Reflections', 'baltic-juosta'],
  ['the-water-remembers-sacred-lake', 'The Water Remembers: My Grandfather’s Song at the Sacred Lake', 'Reflections', 'japan-enso'],
  ['ai-robotics-repair-warming-world', 'The Machines That Could Help Us Come Home: AI, Robotics, and the Repair of a Warming World', 'Regeneration', 'japan-enso'],
  ['the-silent-theft', 'The Silent Theft: How the World Wastes Its Most Precious Resource, and How We Can Reclaim It', 'Regeneration', 'baltic-sun'],
  ['the-final-council-post-extraction-future', 'The Final Council: Building a Post-Extraction Future for Economics and Technology', 'Regeneration', 'dine-hogan'],
  ['seeds-of-the-ancestors', 'Seeds of the Ancestors: Remembering Our Food, Our Stories, and Ourselves', 'Food Systems & Agriculture', 'four-capitals'],
  ['monster-slayer-blueprint-turning-waste-into-renewal', 'The Monster-Slayer’s Blueprint: Turning the Age of Waste into an Age of Renewal', 'Regeneration', 'japan-bridge'],
  ['weaving-a-new-dream-what-is-the-world-dreaming-through-you', 'Weaving a New Dream: What Is the World Dreaming Through You?', 'Movement', 'dine-mountains'],
  ['the-man-who-raced-hills-into-his-70s', 'The Man Who Raced Hills Into His 70s: What Longevity Really Asks of Us', 'Health & Longevity', 'four-capitals'],
  ['wealth-wisdom-from-sheepherders-of-the-planet', 'Wealth Wisdom from the Sheepherders of the Planet', 'Health & Longevity', 'dine-hogan'],
  ['roots-of-resilience-wisdom-week-rancho-la-puerta', 'Roots of Resilience: What the Fire Taught Us at Wisdom Week', 'Retreats', 'four-capitals'],
  ['ancient-farming-hedge-against-climate-change', 'The Old Farmers Are Right: Ancient Agriculture as a Hedge Against a Warming World', 'Food Systems & Agriculture', 'japan-bridge'],
  ['honoring-my-father-on-fathers-day', 'Shizhé’é: A Father’s Day Letter to the Man Who Chose Me', 'The Story', 'dine-mountains'],
  ['honorable-trade-oldest-economies-planet-in-transition', 'Honorable Trade: What the World’s Oldest Economies Teach a Planet in Transition', 'Regeneration', 'baltic-juosta'],
  ['30000-years-tribal-trade-americas', '30,000 Years, and a Formula That Still Works', 'From the journal', 'japan-bridge']
];
const PHOTOS = [
  ['tony-fog-on-the-road-through-the-eucalyptus-900', 'Fog on the road through the eucalyptus'], ['mexico-dancers-900', 'Dancers in Mexico'], ['tony-the-city-from-the-water-900', 'The city from the water'],
  ['world-circle-in-a-courtyard-800', 'A circle in a courtyard, India'], ['tony-mist-in-the-pines-900', 'Mist in the pines'], ['world-rice-terraces-morning-mist-800', 'Rice terraces in the morning mist'],
  ['tony-the-bridge-at-sunset-900', 'The bridge at sunset'], ['world-farmer-with-baskets-800', 'A farmer and his baskets'], ['tony-a-city-at-night-900', 'A city at night'],
  ['tony-a-tea-garden-pond-900', 'A tea garden pond'], ['tony-redwoods-looking-up-900', 'Redwoods, looking up'], ['tony-gulls-on-a-foggy-beach-900', 'Gulls on a foggy beach'],
  ['tony-a-stone-bridge-and-its-reflection-900', 'A stone bridge and its reflection'], ['tony-a-ferry-in-the-low-sun-900', 'A ferry in the low sun'], ['tony-under-the-pier-900', 'Under the pier'],
  ['tony-dusk-over-the-hills-of-the-city-900', 'Dusk over the hills of the city'], ['tony-a-quiet-marina-900', 'A quiet marina'], ['tony-first-sun-across-the-park-900', 'First sun across the park'],
  ['crown-dancers-fire-900', 'Crown dancers at the fire'], ['feather-parade-900', 'A parade of feathers'], ['world-hands-planting-a-seedling-800', 'Hands planting a seedling'],
  ['gathering-on-the-grass-900', 'A gathering on the grass'], ['world-rice-terraces-morning-light-800', 'Rice terraces in morning light'], ['friends-redrocks-900', 'Friends among the red rocks'],
  ['world-young-people-on-the-steps-800', 'Young people on the steps'], ['horseshoe-bend-seated-900', 'On the rim at Horseshoe Bend'], ['world-farmers-market-800', 'A farmers market'],
  ['teton-river-900', 'The Teton Range over the river'], ['world-solar-roofs-rainbow-800', 'Solar roofs under a rainbow'], ['redwoods-and-creek-900', 'Redwoods and a creek, Santa Cruz Mountains'],
  ['lawn-council-900', 'A council on the lawn'], ['aw-japan-stone-bridge-900', 'Children on the stone bridge'], ['aw-peaks-meadow-900', 'The Peaks over the meadow'],
  ['aw-rowing-900', 'Two rowers on a misty lake at dawn'], ['aw-stone-dawn-900', 'A pebble held up to the dawn'], ['aw-slickrock-group-900', 'A rider in the pines'],
  ['aw-canyon-sunset-forest-900', 'Sunset over the rim'], ['aw-bench-talk-900', 'A talk on the bench, among the ferns'], ['aw-juniper-ancient-900', 'An ancient juniper'],
  ['aw-horseshoe-bend-standing-900', 'Standing on the rim at Horseshoe Bend'], ['aw-creek-stones-superior-900', 'The creek and its stones near Superior, Arizona'], ['aw-peaks-pines-900', 'The Peaks over the pines'],
  ['river-peaks-900', 'The river and the Peaks'], ['corn-sunset-900', 'Corn at sunset']
];
const CLIPS = [
  ['tony-sunset-through-the-trees-over-the-bay', 'Sunset through the trees, over the bay'], ['the-pacific-voyage', 'The Pacific voyage. From the films for the books.'],
  ['tony-waves-on-a-gray-morning', 'Waves on a gray morning'], ['the-andes-relay', 'The Andes relay. From the films for the books.'], ['tony-surf-and-the-shore', 'Surf and the shore'],
  ['the-desert-runner', 'The desert runner. From the films for the books.'], ['the-elder-runner-on-the-mesa', 'The elder runner on the mesa. From the films for the books.'],
  ['runs-east-at-first-light', 'Keh Yazh runs east at first light. From the films for the books.'], ['family-runs-then-the-waterfall', 'A family runs toward you, then the waterfall.']
];

/* ---------- the bar: menu and sound ---------- */
function bar(){
  const host = $('#bar'), burger = $('.ap-burger', host), menu = $('#apMenu');
  const setOpen = o => { burger.setAttribute('aria-expanded', String(o)); menu.classList.toggle('open', o); menu.setAttribute('aria-hidden', String(!o)); host.classList.toggle('menu-open', o); if (AP.lenis) { o ? AP.lenis.stop() : AP.lenis.start(); } document.body.style.overflow = o ? 'hidden' : ''; };
  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  const onScroll = () => host.classList.toggle('solid', (window.scrollY || html.scrollTop) > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('.ap-sound, .soundbtn').forEach(b => { b.addEventListener('click', () => AP.sound.toggle()); AP.sound._buttons.push(b); });
  addEventListener('ap:sound', e => { const sb = $('#soundBtn'); if (sb) sb.lastElementChild.textContent = e.detail.on ? 'Sound off' : 'Sound on'; });
}

/* ---------- the living mosaic ---------- */
function mosaic(){
  const host = $('#mosaic'); if (!host) return;
  const LAYOUT = [['w', '', '', 'w'], ['', 'cta', 'w', '', ''], ['', '', 'w', 'cta2', '']];
  let pi = 0, ci = 0; const tiles = [];
  LAYOUT.forEach((row, r) => {
    const mr = document.createElement('div'); mr.className = 'mrow'; mr.dataset.drift = r % 2 ? '36' : '-36';
    row.forEach((kind, c) => {
      if (kind === 'cta' || kind === 'cta2') {
        const a = document.createElement('a'); a.className = 'tile cta';
        if (kind === 'cta') { a.href = 'https://www.youtube.com/playlist?list=PLjB4J2ZBlei6CgzNuXQzLxH9MG9pImafZ'; a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><div><b>Come and see.</b><span>Videos of our communities, for anyone who wants to see or experience them.</span></div>'; }
        else { a.href = 'https://www.youtube.com/watch?v=8kGuXxsbKYU'; a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><div><b>The invitation, on film.</b><span>A minute from the redwoods.</span></div>'; }
        a.target = '_blank'; a.rel = 'noopener'; mr.appendChild(a); return;
      }
      const t = document.createElement('div'); t.className = 'tile' + (kind === 'w' ? ' wide' : '');
      const useClip = kind === 'w' && ci < CLIPS.length;
      if (useClip) { const [v, cap] = CLIPS[ci++]; const l = document.createElement('div'); l.className = 'ap-loop'; l.dataset.src = `${V}${v}.mp4`; l.dataset.poster = `${V}${v}-poster.jpg`; t.appendChild(l); const s = document.createElement('span'); s.className = 'cap'; s.textContent = cap; t.appendChild(s); }
      else {
        const [p, cap] = PHOTOS[pi++ % PHOTOS.length];
        const a = document.createElement('img'); a.className = 'a'; a.src = `${I}${p}.jpg`; a.alt = cap; a.loading = AP.render ? 'eager' : 'lazy';
        const b = document.createElement('img'); b.className = 'b'; b.alt = ''; b.loading = AP.render ? 'eager' : 'lazy';
        const s = document.createElement('span'); s.className = 'cap'; s.textContent = cap;
        t.append(a, b, s); tiles.push(t);
      }
      mr.appendChild(t);
    });
    host.appendChild(mr);
  });
  function seek(t){
    tiles.forEach((tile, i) => {
      const period = 9 + (i % 5) * 1.7, phase = (i * 2.3) % period, k = Math.floor((t + phase) / period);
      if (tile._k === k) return; tile._k = k;
      const front = k % 2 === 0, hidden = front ? tile.querySelector('img.b') : tile.querySelector('img.a');
      const [p, cap] = PHOTOS[(i * 7 + k * 13 + 3) % PHOTOS.length];
      if (!hidden.src.endsWith(p + '.jpg')) { hidden.src = `${I}${p}.jpg`; hidden.alt = cap; }
      tile.querySelector('.cap').textContent = cap;
      tile.classList.toggle('flip', !front);
    });
  }
  const t0 = performance.now();
  if (AP.motion) (function loop(){ seek((performance.now() - t0) / 1000); requestAnimationFrame(loop); })(); else seek(0);
  AP.registerSeek(seek);
}

/* ---------- the journal rows drift past each other ---------- */
function journalRows(){
  const host = $('#jrows'); if (!host) return;
  const rows = [JOURNAL.slice(0, 14), JOURNAL.slice(14)];
  const els = rows.map((list, r) => {
    const row = document.createElement('div'); row.className = 'jrow';
    const card = ([slug, title, pillar, art]) => `<a class="jcard" href="/journal/${slug}/"><img src="/assets/art/${art}.svg" alt="" loading="lazy"><i>${pillar}</i><b>${title}</b></a>`;
    row.innerHTML = list.map(card).join('') + list.map(card).join('');
    host.appendChild(row); return row;
  });
  let half = [0, 0], hover = false;
  const measure = () => els.forEach((row, i) => { half[i] = row.scrollWidth / 2; });
  measure(); addEventListener('resize', measure); document.fonts && document.fonts.ready.then(measure);
  host.addEventListener('pointerenter', () => hover = true); host.addEventListener('pointerleave', () => hover = false);
  let acc = 0, last = performance.now();
  function place(t){ els.forEach((row, i) => { const H = half[i] || 1, sp = (i ? 22 : 30); let x = (t * sp) % H; if (i) x = H - x; row.style.transform = `translate3d(${-x}px,0,0)`; }); }
  if (AP.motion) (function loop(now){ if (!hover) acc += (now - last) / 1000; last = now; place(acc); requestAnimationFrame(loop); })(performance.now()); else place(8);
  AP.registerSeek(place);
}

/* ---------- the shot name follows the cut ---------- */
function shotNames(cut){
  const names = cut.shots.map(s => s.dataset.name), el = $('#shotName'), glow = $('.arrive .glow');
  const tick = () => { let best = 0, bo = 0; cut.shots.forEach((s, i) => { const o = parseFloat(s.style.opacity || 0); if (o > bo) { bo = o; best = i; } }); if (el.textContent !== names[best]) el.textContent = names[best]; if (glow) glow.classList.toggle('two', best === 1); };
  (function loop(){ tick(); if (AP.motion) requestAnimationFrame(loop); })();
  AP.registerSeek(() => tick());   // render mode: the name and the backdrop follow the seeked cut
}

/* ---------- wire it all ---------- */
AP.sound.register('creek',  AU + 'bed-creek-oak-creek-48s.mp3');          // his real Oak Creek water
AP.sound.register('garden', AU + 'first-light-in-the-garden-piano-flute-waterfall-166s.mp3');     // original piano and flute over the real sound of the waterfall he built
AP.sound.register('rain',   AU + 'bed-rain-soft-46s.mp3');                // a soft sun shower, kept for later
/* on a laptop the film fills the screen, so it plays the wide cut of the same two scenes */
const wide = matchMedia('(min-width:981px)').matches;
if (wide) $$('[data-src-wide]').forEach(el => { el.dataset.src = el.dataset.srcWide; if (el.dataset.posterWide) el.dataset.poster = el.dataset.posterWide; });
mosaic(); journalRows();
AP.init();
/* the opening always sounds like the garden. At load the scene watcher can land on a later band,
   so near the top the Sound button starts the garden music (piano and flute over the waterfall). */
const atTop = () => scrollY < innerHeight * 0.8;
const gardenFirst = () => { if (atTop()) { document.documentElement.dataset.scene = 'garden'; AP.sound.scene = 'garden'; } };
gardenFirst(); addEventListener('load', gardenFirst);
AP.sound.toggle = function(){ if (AP.sound.on) AP.sound.stop(); else { gardenFirst(); AP.sound.start(); } };
bar();
const cut = $('#cut')._cut; shotNames(cut);
/* the film always opens on the first light and the mist (Tony, 11/7: "always start from the beginning where there is light and mist").
   The timeline waits until the opening clip is actually playing, starts it from its first frame,
   starts the waterfall from its first frame as it fades in, and every loop opens on the light again. */
(function openOnTheLight(){
  if (!AP.motion || AP.render) return;
  const v0 = cut.shots[0].querySelector('video'), v1 = cut.shots[1].querySelector('video'), lp0 = cut.shots[0].querySelector('.ap-loop')._loop;
  if (!v0 || !lp0) return;
  const fade = Number(cut.el.dataset.fade) || 1.8, d0 = Number(cut.shots[0].dataset.dur) || 6;
  cut.stop(); cut.seek(0);
  v0.preload = 'auto'; lp0.load();
  let t0 = 0, prev = 0, began = false;
  const rewind = v => { try { v.currentTime = 0; } catch (e) {} };
  function run(now){
    const tt = ((now - t0) / 1000) % cut.DUR;
    if (prev < d0 - fade && tt >= d0 - fade && v1) rewind(v1);          // the waterfall begins at its start
    if (prev < cut.DUR - fade && tt >= cut.DUR - fade) rewind(v0);      // the light returns from its first frame
    prev = tt; cut.seek(tt); requestAnimationFrame(run);
  }
  function begin(){ if (began) return; began = true; rewind(v0); t0 = performance.now(); requestAnimationFrame(run); }
  v0.addEventListener('playing', begin, { once: true });
  setTimeout(begin, 7000);   // on a slow connection the opening still shows its first frame, then runs
})();
const phone = matchMedia('(max-width:980px)').matches;
field($('#mist'), mistDraw(11, 1.5, true), 0.4);
field($('#mist3'), mistDraw(17, 1.7, true), 0.5);
/* no sparkles: just the mist (Tony, 11/7: "i dont want flickering stars... i just wanted to have mist") */
/* the weather down the page: mist at the seams, dew on the leaves, warm light and beams */
$$('[data-wx]').forEach((el, i) => {
  const kinds = el.dataset.wx.split(' '), wx = document.createElement('div'); wx.className = 'wx';
  if (kinds.includes('warm')) { const w = document.createElement('div'); w.className = 'warm'; wx.appendChild(w); }
  if (kinds.includes('beams')) { const bm = document.createElement('div'); bm.className = 'beams'; wx.appendChild(bm); }
  let mc;
  if (kinds.includes('mist')) { mc = document.createElement('canvas'); mc.className = 'mistc'; wx.appendChild(mc); }
  el.prepend(wx);
  if (mc) field(mc, mistDraw(31 + i * 3, Number(el.dataset.mist || 0.7)), 0.35);
});
field($('#mist2'), mistDraw(23, 0.8), 0.4);
const gsap = AP.gsap, ST = AP.ST;
if (gsap && ST && AP.motion) {
  gsap.to('#cutwrap', { scale: 1.08, yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: AP.render ? true : 0.5 } });
  if (!wide) gsap.to('#portrait', { yPercent: phone ? 14 : -10, scale: phone ? 1.06 : 1.03, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: AP.render ? true : 0.6 } });
  gsap.to('.arrive .copy', { yPercent: phone ? 0 : 7, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: AP.render ? true : 0.6 } });
  $$('.mrow').forEach(r => gsap.fromTo(r, { x: -Number(r.dataset.drift) }, { x: Number(r.dataset.drift), ease: 'none', scrollTrigger: { trigger: '#global', start: 'top bottom', end: 'bottom top', scrub: AP.render ? true : 0.6 } }));
}

/* the breath ring: one round with the creek under it */
(function breath(){
  const host = $('#ring'); if (!host || !AP.breathRing) return;
  const done = $('#breathDone'), btn = $('#beginBreath');
  const ring = AP.breathRing(host, { rounds: 1, legend: true, tones: true, rest: ['Breathe', 'with the water'],
    onStart(){ btn.textContent = 'Breathing…'; btn.disabled = true; done.textContent = ''; },
    onFinish(){ btn.textContent = 'Once more'; btn.disabled = false; done.textContent = 'Did your shoulders drop? The whole practice is three minutes, and it is free below.'; } });
  btn.addEventListener('click', () => { ring.start(); AP.scrollTo('#listen', { offset: 0 }); });
})();

/* render mode: window.DURATION + window.seek(t) for render.js */
window.DURATION = 52;
window.seek = async t => { await AP.seekPage(t, { hold: 8, end: 48 }); return true; };
})();

/* ---------- 11/7: the section dock: jump to any part of the page, and see where you are ---------- */
(function(){
  const dock = document.getElementById('secDock'); if (!dock) return;
  const toggle = dock.querySelector('.sec-toggle'), links = [...dock.querySelectorAll('a')];
  links.forEach(a => { const t = document.createElement('span'); t.className = 't'; t.textContent = a.textContent; a.textContent = ''; a.appendChild(t); a.setAttribute('aria-label', t.textContent); });
  const setOpen = o => { dock.classList.toggle('open', o); toggle.setAttribute('aria-expanded', String(o)); };
  toggle.addEventListener('click', () => setOpen(!dock.classList.contains('open')));
  links.forEach(a => a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); setOpen(false);
    const off = -((document.getElementById('bar') || {}).offsetHeight || 0);
    if (AP.lenis) AP.lenis.scrollTo(el, { offset: off, duration: 1.4 }); else el.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
  }));
  document.addEventListener('click', e => { if (!dock.contains(e.target)) setOpen(false); });
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { links.forEach(l => l.classList.remove('on')); const l = map.get(en.target.id); if (l) l.classList.add('on'); } }), { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
})();

/* Magazine & Journal: one item in the bar, opening on hover, focus or tap */
(function navDrop(){
  const d = document.querySelector('.nav-drop'); if (!d) return;
  const b = d.querySelector('button'), set = o => { d.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); };
  b.addEventListener('click', e => { e.stopPropagation(); set(!d.classList.contains('open')); });
  document.addEventListener('click', e => { if (!d.contains(e.target)) set(false); });
  d.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); } });
})();

/* the section dock stays out of the opening screen */
(function dockAfterOpening(){
  const f = () => document.documentElement.classList.toggle('at-top', scrollY < innerHeight * 0.7);
  f(); addEventListener('scroll', f, { passive: true }); addEventListener('resize', f);
})();
