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

/* MailerLite Universal */
(function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);},l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
ml('account','2560671');
