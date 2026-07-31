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

  // Email capture -> Netlify Forms (AJAX). Wired once the domain is live.
  function encode(d){return Object.keys(d).map(function(k){return encodeURIComponent(k)+"="+encodeURIComponent(d[k]);}).join("&");}
  document.querySelectorAll("form[data-capture]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.parentElement.querySelector(".capture__note");
      var input = form.querySelector('input[type="email"]');
      var email = input ? input.value.trim() : "";
      if (!email) return;
      fetch("/", {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body: encode({"form-name":"tribe-signup","email":email,"source":window.location.pathname,"bot-field":""})})
        .then(function(r){ if(!r.ok) throw 0; form.reset();
          if(note){note.textContent="You're in. Watch your inbox for the free Stone Breath.";note.style.color="var(--amber)";}})
        .catch(function(){ if(note){note.textContent="Something went wrong — email wisdom@tribeawaken.com and we'll add you.";note.style.color="var(--amber)";}});
    });
  });

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
