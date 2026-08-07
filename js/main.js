/* TribeAwaken — minimal progressive-enhancement JS. */
(function () {
  "use strict";
  var toggle = document.querySelector(".nav__toggle");
  var links = document.getElementById("primary-nav");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.getAttribute("data-open") === "true";
      links.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.textContent = open ? "☰" : "✕";
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 900) {
        links.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      }
    });
  }


  // Scroll reveal
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(".section > .wrap > *, .book-hook, .stat, .offer, .hero__inner > *");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en){ if(en.isIntersecting){en.target.classList.add("is-in");io.unobserve(en.target);} });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    targets.forEach(function (el,i){ el.classList.add("reveal"); if(i%3===1)el.classList.add("d1"); if(i%3===2)el.classList.add("d2"); io.observe(el); });
    setTimeout(function(){ document.querySelectorAll(".reveal:not(.is-in)").forEach(function(el){el.classList.add("is-in");}); }, 1600);
  }
})();

/* Mark the current page in the nav + language bar. */
(function () {
  "use strict";
  var path = location.pathname.replace(/index\.html$/, "");
  if (path.charAt(path.length - 1) !== "/") path += "/";
  document.querySelectorAll(".nav__links a[data-nav]").forEach(function (a) {
    var k = a.getAttribute("data-nav");
    var hit = (k === "home") ? (path === "/") : (path.indexOf(k) === 0);
    if (hit) a.setAttribute("aria-current", "page");
  });
  document.querySelectorAll(".global-bar a[data-lang]").forEach(function (a) {
    var k = a.getAttribute("data-lang");
    var hit = (k === "en")
      ? !/^\/(ja|lt|india)\//.test(path)
      : path.indexOf(k) === 0;
    if (hit) a.setAttribute("aria-current", "true");
  });
})();
