/* TribeAwaken home v5 (preview)
   1. the Japanese thread: ink mountains and cedars in drifting mist, drawn live on a canvas (nothing photographed, nothing generated elsewhere)
   2. no music made in the browser: recorded sources only */
(function(){
'use strict';
const sec = document.getElementById('japan'), cv = document.getElementById('ink');
if (!sec || !cv) return;
const AP = window.AP || {};
const still = (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) || AP.render || AP.flat || AP.motion === false;
/* phones and tablets: the ink canvas is hidden and never drawn. Blending it over the film crashed Safari on iPhone (11/10). */
const light = !!(window.matchMedia && matchMedia('(hover:none),(max-width:980px)').matches);

/* ---------- 1. the ink scene ---------- */
const ctx = cv.getContext('2d');
let W = 0, H = 0, visible = false, raf = 0;
function rng(seed){ let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const FAR = [128, 150, 162], NEAR = [8, 15, 20];
const LAYERS = [0, 1, 2, 3, 4, 5].map(i => {
  const r = rng(101 + i * 977), trees = [];
  if (i >= 1) { const n = 34 + i * 16; for (let k = 0; k < n; k++) trees.push({ x: r() * 1.8 - 0.4, h: (0.022 + r() * 0.034) * (0.55 + i * 0.2), lean: (r() - 0.5) * 0.1 }); }
  return { i, seed: 3.7 + i * 12.9, base: 0.40 + i * 0.105, amp: 0.15 - i * 0.012, par: 6 + i * 9, trees, col: mix(FAR, NEAR, Math.pow(i / 5, 0.85)) };
});
const MIST = (() => { const r = rng(4242), a = []; for (let k = 0; k < 13; k++) a.push({ x: r(), y: 0.34 + r() * 0.6, rx: 0.28 + r() * 0.34, ry: 0.035 + r() * 0.06, sp: (0.004 + r() * 0.009) * (r() < 0.5 ? -1 : 1), a: 0.07 + r() * 0.1, layer: Math.floor(r() * 6) }); return a; })();
function ridge(l, u){ const s = l.seed; return l.base - l.amp * (0.56 * Math.sin(u * 2.9 + s) + 0.27 * Math.sin(u * 6.7 + s * 1.7) + 0.11 * Math.sin(u * 15.3 + s * 2.3) + 0.05 * Math.sin(u * 37 + s * 0.6)); }
function size(){
  const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 1.5);
  W = Math.max(2, Math.round(r.width * d)); H = Math.max(2, Math.round(r.height * d)); cv.width = W; cv.height = H;
}
function draw(t, p){
  // sky: night blue above, pale mist at the horizon
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b151c'); g.addColorStop(0.42, '#273843'); g.addColorStop(0.78, '#7d939e'); g.addColorStop(1, '#a9b9bf');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // the pale sun behind the mist
  const sx = W * 0.72, sy = H * (0.25 - (p - 0.5) * 0.05), sr = Math.min(W, H) * 0.075;
  g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 6);
  g.addColorStop(0, 'rgba(240,236,220,.55)'); g.addColorStop(0.16, 'rgba(226,228,218,.2)'); g.addColorStop(1, 'rgba(226,228,218,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,240,226,.86)'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  for (const l of LAYERS) {
    const off = (p - 0.5) * l.par * 0.012, lift = (0.5 - p) * l.par * 0.0045 * H, c = l.col;
    ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, ridge(l, x / W * 1.5 + off) * H + lift);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // cedars along the ridge, a brush stroke each
    for (const tr of l.trees) {
      const u = tr.x - off * 0.66, x = u * W; if (x < -40 || x > W + 40) continue;
      const y = ridge(l, x / W * 1.5 + off) * H + lift, h = tr.h * H, w = h * 0.2;
      ctx.beginPath(); ctx.moveTo(x - w, y + h * 0.12); ctx.quadraticCurveTo(x - w * 0.3, y - h * 0.5, x + tr.lean * h, y - h); ctx.quadraticCurveTo(x + w * 0.3, y - h * 0.5, x + w, y + h * 0.12); ctx.closePath(); ctx.fill();
    }
    // mist lying in the valley behind the next ridge
    for (const m of MIST) {
      if (m.layer !== l.i) continue;
      const mx = (((m.x + t * m.sp + off * 0.4) % 1.6) + 1.6) % 1.6 - 0.3, cx = mx * W, cy = m.y * H + lift, rx = m.rx * W, ry = m.ry * H;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
      const mg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      mg.addColorStop(0, 'rgba(206,219,224,' + m.a + ')'); mg.addColorStop(1, 'rgba(206,219,224,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
}
function progress(){ const r = sec.getBoundingClientRect(), vh = window.innerHeight || 800; return Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height))); }
function frame(now){ raf = 0; if (!visible) return; draw(now / 1000, progress()); raf = requestAnimationFrame(frame); }
function kick(){ if (light) return; if (still) { draw(12, 0.5); return; } if (visible && !raf) raf = requestAnimationFrame(frame); }
if (!light) { size(); draw(12, 0.5); }
addEventListener('resize', () => { if (light) return; size(); if (still || !visible) draw(12, still ? 0.5 : progress()); });
if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); music('japan', visible); }, { rootMargin: '10% 0px' }).observe(sec);
else { visible = true; kick(); }

/* ---------- 2. the music ---------- */
/* Plucked strings made in the browser (Karplus-Strong), so nothing is downloaded and it is never the same twice.
   The Japanese thread: a koto in the in-sen scale on D.  Culture in motion: brighter strings in an open five-note scale over a slow heartbeat drum.
   It only sounds when the visitor has turned the site's sound on, and it stops when the section leaves the screen. */
const MODES = {
  japan: { notes: [146.83, 196.00, 220.00, 293.66, 311.13, 392.00, 440.00, 523.25, 587.33], gap: [2600, 4200], step: [0.28, 0.9], gain: 0.34, drum: false },
  world: { notes: [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33], gap: [3000, 3600], step: [0.4, 0.5], gain: 0.26, drum: true }
};
const bufs = {}, seen = {}; let timer = 0, mode = null, bus = null;
function pluck(c, f){
  if (bufs[f]) return bufs[f];
  const sr = c.sampleRate, n = Math.floor(sr * 4.2), b = c.createBuffer(1, n, sr), d = b.getChannelData(0), N = Math.round(sr / f), line = new Float32Array(N);
  let prev = 0; for (let i = 0; i < N; i++) { const w = Math.random() * 2 - 1; prev = prev * 0.45 + w * 0.55; line[i] = prev; }   // a soft pick
  let idx = 0; const damp = 0.9965 - Math.min(0.004, f / 200000);
  for (let i = 0; i < n; i++) { const nx = (idx + 1) % N, v = (line[idx] + line[nx]) * 0.5 * damp; d[i] = line[idx]; line[idx] = v; idx = nx; }
  for (let i = 0; i < 90; i++) d[i] *= i / 90;
  return (bufs[f] = b);
}
function ensureBus(S){
  if (bus) return bus; const c = S.ctx;
  bus = c.createGain(); bus.gain.value = 0.34;
  const dl = c.createDelay(1.2), fb = c.createGain(), lp = c.createBiquadFilter(), wet = c.createGain();
  dl.delayTime.value = 0.37; fb.gain.value = 0.34; lp.type = 'lowpass'; lp.frequency.value = 2400; wet.gain.value = 0.42;
  bus.connect(S.fx || c.destination); bus.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(S.fx || c.destination);
  return bus;
}
function thump(c, out, at, level){   // a frame drum: a low tone that falls, with a soft skin tap on top
  const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
  o.frequency.setValueAtTime(92, at); o.frequency.exponentialRampToValueAtTime(48, at + 0.22);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(level, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
  o.connect(g); g.connect(out); o.start(at); o.stop(at + 0.8);
}
function phrase(){
  timer = 0; const S = AP.sound, M = MODES[mode]; if (!M || !S || !S.on || !S.ctx) return;
  const c = S.ctx, out = ensureBus(S), duck = S._duck || 1; out.gain.setTargetAtTime(M.gain, c.currentTime, 0.4);
  let at = c.currentTime + 0.05;
  if (M.drum) { thump(c, out, at, 0.9 * duck); thump(c, out, at + 0.34, 0.55 * duck); at += 0.9; }
  const count = 1 + Math.floor(Math.random() * 3); let k = Math.floor(Math.random() * M.notes.length);
  for (let i = 0; i < count; i++) {
    const src = c.createBufferSource(), g = c.createGain(); src.buffer = pluck(c, M.notes[k]);
    g.gain.value = (0.5 + Math.random() * 0.4) * duck; src.connect(g); g.connect(out); src.start(at);
    at += M.step[0] + Math.random() * M.step[1]; k = Math.max(0, Math.min(M.notes.length - 1, k + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2))));
  }
  timer = setTimeout(phrase, M.gap[0] + Math.random() * M.gap[1]);
}
function retune(){ const next = seen.japan ? 'japan' : seen.world ? 'world' : null; if (next === mode) return; mode = next; if (timer) { clearTimeout(timer); timer = 0; } if (mode && !still) timer = setTimeout(phrase, 900); }
function music(name, on){ seen[name] = on; retune(); }
addEventListener('ap:sound', e => { if (e.detail && e.detail.on) { if (mode && !timer) timer = setTimeout(phrase, 1200); } else if (timer) { clearTimeout(timer); timer = 0; } });
const world = document.getElementById('global');
if (world && 'IntersectionObserver' in window) new IntersectionObserver(es => music('world', es[0].isIntersecting), { rootMargin: '-20% 0px' }).observe(world);
})();
