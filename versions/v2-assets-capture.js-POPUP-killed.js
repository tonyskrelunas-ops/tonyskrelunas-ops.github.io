/* ============================================================
   THE ASK
   A reader who stays a minute is interested. Ask once, quietly.
   If they don't, that's fine — ask again four minutes later, and
   then never again on this device.

   Where the address goes:
     Paste your key into KEY below and submissions arrive in your
     inbox silently, with no account and no dashboard to log into.
     Get one free at web3forms.com — you type in your email and
     they mail you the key. No password, no signup.
     Until a key is set, the panel hands off to the reader's own
     mail app, addressed to you, so nothing is ever lost.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "";                                   /* ← paste the key here */
  var ENDPOINT = "https://api.web3forms.com/submit";
  var INBOX = "wisdom@ancestralwatch.com";

  var FIRST = 60;     /* seconds before the first ask   */
  var SECOND = 300;   /* seconds before the second ask  */
  var STORE = "ta_ask_v1";

  /* --- has this person already been asked, or already joined? --- */
  function state() {
    try { return JSON.parse(localStorage.getItem(STORE) || "{}"); }
    catch (e) { return {}; }
  }
  function remember(patch) {
    try {
      var s = state();
      for (var k in patch) s[k] = patch[k];
      localStorage.setItem(STORE, JSON.stringify(s));
    } catch (e) {}
  }

  var st = state();
  if (st.joined || st.asks >= 2) return;

  /* --- only count time the tab is actually in front of them --- */
  var seconds = 0, timer = null;
  function tick() { if (!document.hidden) seconds++; }
  timer = setInterval(tick, 1000);

  /* --- the panel --- */
  var panel, shown = false;

  function build() {
    panel = document.createElement("div");
    panel.className = "ask";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Take the free practice");
    panel.innerHTML =
      '<button class="ask__x" aria-label="Close">&times;</button>' +
      '<p class="ask__k">Free &middot; no charge, ever</p>' +
      '<h3 class="ask__h">Take the Stone Breath with you.</h3>' +
      '<p class="ask__p">A three-minute practice for settling the nervous system, ' +
      'built on an old running-and-breath technique. I will send you the printable card, ' +
      'and then a short letter most Fridays. Leave whenever you like.</p>' +
      '<form class="ask__f" novalidate>' +
        '<label class="sr-only" for="ask-email">Your email</label>' +
        '<input id="ask-email" class="ask__in" type="email" name="email" required ' +
               'autocomplete="email" placeholder="you@example.com" spellcheck="false">' +
        '<button class="btn btn--primary ask__go" type="submit">Send it</button>' +
      '</form>' +
      '<p class="ask__note">Straight to me. No list broker, no reselling, one click to stop.</p>';
    document.body.appendChild(panel);

    panel.querySelector(".ask__x").addEventListener("click", function () {
      close(false);
    });
    panel.querySelector(".ask__f").addEventListener("submit", submit);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel && panel.classList.contains("in")) close(false);
    });
  }

  function open() {
    if (shown) return;
    shown = true;
    if (!panel) build();
    requestAnimationFrame(function () { panel.classList.add("in"); });
    remember({ asks: (state().asks || 0) + 1, last: seconds });
  }

  function close(joined) {
    if (!panel) return;
    panel.classList.remove("in");
    shown = false;
    if (joined) { remember({ joined: 1 }); clearInterval(timer); }
    setTimeout(function () { if (panel && !shown) panel.remove(); panel = null; }, 400);
  }

  function done(msg) {
    if (!panel) return;
    panel.innerHTML = '<p class="ask__k">Sent</p>' +
      '<h3 class="ask__h">' + msg + '</h3>' +
      '<p class="ask__p">Check your inbox &mdash; and your spam folder, once, so it lands right next time.</p>';
    setTimeout(function () { close(true); }, 3600);
  }

  function submit(e) {
    e.preventDefault();
    var input = panel.querySelector(".ask__in");
    var go = panel.querySelector(".ask__go");
    var email = (input.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      input.focus();
      input.classList.add("bad");
      setTimeout(function () { input.classList.remove("bad"); }, 1200);
      return;
    }

    /* no key yet — hand off to their own mail, addressed to you */
    if (!KEY) {
      remember({ joined: 1 });
      window.location.href = "mailto:" + INBOX +
        "?subject=" + encodeURIComponent("Send me the Stone Breath card") +
        "&body=" + encodeURIComponent("Please send the printable card to " + email + ".\n\n");
      done("Opening your mail.");
      return;
    }

    go.disabled = true;
    go.textContent = "Sending…";

    var body = new FormData();
    body.append("access_key", KEY);
    body.append("email", email);
    body.append("subject", "Stone Breath card — " + email);
    body.append("from_name", "TribeAwaken");
    body.append("page", location.pathname);
    body.append("read_seconds", String(seconds));

    fetch(ENDPOINT, { method: "POST", body: body })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && r.success) { done("It is on its way."); }
        else { throw new Error("rejected"); }
      })
      .catch(function () {
        go.disabled = false;
        go.textContent = "Send it";
        var n = panel.querySelector(".ask__note");
        n.innerHTML = 'That did not go through. Write to ' +
          '<a href="mailto:' + INBOX + '">' + INBOX + '</a> and I will send it by hand.';
        n.classList.add("bad");
      });
  }

  /* --- the two asks --- */
  var watcher = setInterval(function () {
    var s = state();
    if (s.joined) { clearInterval(watcher); clearInterval(timer); return; }
    var asks = s.asks || 0;
    if (asks === 0 && seconds >= FIRST) open();
    else if (asks === 1 && !shown && seconds >= SECOND) open();
    else if (asks >= 2 && !shown) { clearInterval(watcher); clearInterval(timer); }
  }, 1000);
})();
