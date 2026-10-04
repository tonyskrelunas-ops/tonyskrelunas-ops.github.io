/* A tap is not a scroll.

   Tony, 10/4: "the major sections do not rotate on phone." They rotated once
   and then froze, on every phone, every time.

   The motion law is that a band keeps turning until the visitor CLICKS it.
   Both engines implemented "clicks" with touchstart (stages) and pointerdown
   (the live bands) — and on a phone those fire the instant a finger lands to
   scroll the page. So the first scroll past a section stopped it for good.

   window.taphold(el, fn) calls fn only for a deliberate tap: the finger goes
   down and comes up within 500ms, having moved less than 10px. A scroll, a
   fling and a long press on an image all pass through untouched. Mouse clicks
   and keyboard use still count, because those are always deliberate.  */
(function () {
  var MOVE = 10, TIME = 500;
  window.taphold = function (el, fn) {
    var x = 0, y = 0, t = 0, tracking = false;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;      // a mouse down is a click
      tracking = true; x = e.clientX; y = e.clientY; t = Date.now();
    }, { passive: true });
    el.addEventListener('pointerup', function (e) {
      if (!tracking) return;
      tracking = false;
      if (Date.now() - t > TIME) return;
      if (Math.abs(e.clientX - x) > MOVE || Math.abs(e.clientY - y) > MOVE) return;
      fn(e);
    }, { passive: true });
    el.addEventListener('pointercancel', function () { tracking = false; }, { passive: true });
    el.addEventListener('click', function (e) { fn(e); }, { passive: true });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') fn(e);
    }, { passive: true });
  };
})();
