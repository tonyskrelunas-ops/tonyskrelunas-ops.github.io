/* ============================================================
   TRIBEAWAKEN v2 — FORM ENGINE
   ============================================================

   ┌──────────────────────────────────────────────────────────┐
   │  ⚙️   THE ONE THING YOU EVER CHANGE                       │
   │                                                          │
   │  1. Go to  https://web3forms.com                         │
   │  2. Type   wisdom@ancestralwatch.com   in the one box.   │
   │     Press the button.                                    │
   │  3. They email you an Access Key. Paste it below,        │
   │     between the quotes.                                  │
   │  4. Save. Push. Done. Nothing to log into, ever.         │
   │                                                          │
   │  The key is safe in public HTML — it is an alias for     │
   │  the email address, not a password.                      │
   └──────────────────────────────────────────────────────────┘

   Changing provider later is this same block and nothing else:
   swap ENDPOINT + ACCESS_KEY and every form on the site follows.
   ============================================================ */

var MAIL = {

  /* ---- paste the key here ---- */
  ACCESS_KEY : "PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE",

  /* ---- where it posts ---- */
  ENDPOINT   : "https://api.web3forms.com/submit",

  /* ---- the inbox, shown to readers when something goes wrong ---- */
  INBOX      : "wisdom@ancestralwatch.com",

  /* ---- name the emails arrive under ---- */
  FROM_NAME  : "tonyskrelunas.com"
};

/* ============================================================
   Nothing below here needs editing.
   ============================================================

   MARKUP CONTRACT
   ---------------
   <div class="f-shell" data-mail-shell>
     <form class="f-form" data-mail-form data-subject="...">
       ...fields, each:
       <div class="f-field">
         <label class="f-label" for="x">…</label>
         <input class="f-input" id="x" name="x" required
                data-error="What to say when it's empty">
         <p class="f-err-msg" id="x-err"></p>
       </div>
       <div class="f-alert" role="alert">…fallback copy…</div>
     </form>
     <div class="f-done" role="status" aria-live="polite">…</div>
   </div>

   Every .f-field is wired automatically. No per-page JS.
   NO mailto is ever fired. NO page reload. NO redirect.
   ============================================================ */

(function () {
  "use strict";

  var KEY_IS_SET = MAIL.ACCESS_KEY && MAIL.ACCESS_KEY.indexOf("PASTE-") !== 0;
  var EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- helpers ---------- */

  function fieldOf(el) {
    return el.closest ? el.closest(".f-field") : null;
  }

  function clearError(el) {
    var f = fieldOf(el);
    if (!f) return;
    f.classList.remove("is-invalid");
    el.removeAttribute("aria-invalid");
    var msg = f.querySelector(".f-err-msg");
    if (msg) msg.textContent = "";
  }

  function showError(el, text) {
    var f = fieldOf(el);
    if (!f) return;
    f.classList.add("is-invalid");
    el.setAttribute("aria-invalid", "true");
    var msg = f.querySelector(".f-err-msg");
    if (msg) {
      msg.textContent = text;
      /* link them only if the markup didn't already — never clobber a hint id */
      var described = el.getAttribute("aria-describedby") || "";
      if (msg.id && described.indexOf(msg.id) === -1) {
        el.setAttribute("aria-describedby", (described + " " + msg.id).trim());
      }
    }
  }

  /* Validate one control. Returns true if it's fine. */
  function checkOne(el) {
    var val = (el.value || "").trim();

    if (el.hasAttribute("required") && !val) {
      showError(el, el.getAttribute("data-error") || "This one's needed.");
      return false;
    }
    if (el.type === "email" && val && !EMAIL_RE.test(val)) {
      showError(el, "That address looks incomplete — check it over?");
      return false;
    }
    clearError(el);
    return true;
  }

  /* Turn the form into a plain object. Unchecked boxes become "No"
     so the email that arrives reads as a sentence, not a gap. */
  function collect(form) {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (v, k) {
      if (data[k] === undefined) data[k] = v;
      else data[k] = data[k] + ", " + v;
    });
    form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      if (!cb.name || cb.name === "botcheck") return;
      if (!cb.checked && data[cb.name] === undefined) data[cb.name] = "No";
    });
    return data;
  }

  /* ---------- wire one form ---------- */

  function init(form) {
    var shell = form.closest("[data-mail-shell]") || form.closest(".f-shell");
    var btn   = form.querySelector('[type="submit"]');
    var alert = form.querySelector(".f-alert");
    var done  = shell ? shell.querySelector(".f-done") : null;
    var controls = form.querySelectorAll(".f-input, .f-textarea, .f-select");

    /* let the browser stay out of it — our messages are better */
    form.setAttribute("novalidate", "novalidate");

    /* hidden plumbing, added here so the HTML stays readable */
    function hidden(name, value) {
      if (form.querySelector('[name="' + name + '"]')) return;
      var i = document.createElement("input");
      i.type = "hidden"; i.name = name; i.value = value;
      form.appendChild(i);
    }
    hidden("access_key", MAIL.ACCESS_KEY);
    hidden("from_name", MAIL.FROM_NAME);
    hidden("subject", form.getAttribute("data-subject") || "A message from tonyskrelunas.com");

    /* honeypot — off-screen, tabindex -1, aria-hidden.
       Bots fill it; Web3Forms drops anything that arrives with it set. */
    if (!form.querySelector('[name="botcheck"]')) {
      var hp = document.createElement("div");
      hp.className = "f-hp";
      hp.setAttribute("aria-hidden", "true");
      hp.innerHTML =
        '<label>Leave this field empty' +
        '<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label>';
      form.appendChild(hp);
    }

    /* clear a field's error as soon as the reader fixes it */
    controls.forEach(function (el) {
      el.addEventListener("input", function () {
        if (fieldOf(el) && fieldOf(el).classList.contains("is-invalid")) checkOne(el);
      });
      el.addEventListener("blur", function () {
        if ((el.value || "").trim() || el.hasAttribute("required")) checkOne(el);
      });
    });

    /* preview the success state any time with ?sent=1 */
    if (shell && location.search.indexOf("sent=1") > -1) shell.classList.add("is-sent");

    form.addEventListener("submit", function (e) {
      e.preventDefault();                       // never a reload, never a redirect
      form.classList.remove("is-error");

      /* --- validate, focus the first thing that's wrong --- */
      var firstBad = null;
      controls.forEach(function (el) {
        if (!checkOne(el) && !firstBad) firstBad = el;
      });
      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      /* --- honeypot tripped: pretend all is well, send nothing --- */
      var bot = form.querySelector('[name="botcheck"]');
      if (bot && bot.checked) { finish(); return; }

      /* --- key not pasted in yet: say so honestly.
             We do NOT fire a mailto. The address is a link the
             reader can choose, never something Send does. --- */
      if (!KEY_IS_SET) {
        form.classList.add("is-error");
        if (alert) {
          alert.innerHTML =
            "This form isn't switched on yet. Send it straight to " +
            '<a href="mailto:' + MAIL.INBOX + '">' + MAIL.INBOX + "</a> " +
            "and it reaches exactly the same place.";
          alert.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      /* --- send --- */
      form.classList.add("is-sending");
      if (btn) btn.setAttribute("aria-busy", "true");

      fetch(MAIL.ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(collect(form))
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.success) throw new Error("rejected");
          finish();
        })
        .catch(function () {
          form.classList.remove("is-sending");
          form.classList.add("is-error");
          if (btn) btn.removeAttribute("aria-busy");
          if (alert) alert.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });

    function finish() {
      form.classList.remove("is-sending", "is-error");
      if (btn) btn.removeAttribute("aria-busy");
      if (shell) {
        shell.classList.add("is-sent");
        shell.scrollIntoView({ behavior: "smooth", block: "center" });
        if (done) {                       // move the reader's focus to the good news
          done.setAttribute("tabindex", "-1");
          done.focus({ preventScroll: true });
        }
      }
      form.reset();
    }
  }

  /* ---------- go ---------- */

  function boot() {
    document.querySelectorAll("form[data-mail-form]").forEach(init);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/* ============================================================
   REVEAL — shared with the rest of v2
   ============================================================ */
(function () {
  var els = document.querySelectorAll(".rv");
  if (!els.length) return;
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion:reduce)").matches) {
    els.forEach(function (e) { e.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: .05 });
  els.forEach(function (e) { io.observe(e); });

  function sweep() {
    els.forEach(function (e) {
      if (e.classList.contains("in")) return;
      if (e.getBoundingClientRect().top < (window.innerHeight || 0) * 1.02) {
        e.classList.add("in"); io.unobserve(e);
      }
    });
  }
  window.addEventListener("load", function () { sweep(); setTimeout(sweep, 260); });
  setTimeout(sweep, 1200);
})();
