/* TribeAwaken — the circle. Posts to Web3Forms; no page reload.
   The key below is a public form id, safe in client-side code. */
(function () {
  "use strict";
  var KEY = "057975c1-1a1a-465e-9b5e-3fb6692b2106";
  var INBOX = "wisdom@ancestralwatch.com";

  document.querySelectorAll("form[data-join]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var btn = form.querySelector('button[type="submit"]');
      var note = form.parentNode.querySelector(".join__note");
      var email = (input.value || "").trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.focus();
        input.classList.add("bad");
        setTimeout(function () { input.classList.remove("bad"); }, 1200);
        return;
      }

      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";

      var body = new FormData();
      body.append("access_key", KEY);
      body.append("email", email);
      body.append("subject", "The circle — " + email);
      body.append("from_name", "TribeAwaken");
      body.append("wants", form.getAttribute("data-join") || "the Stone Breath");
      body.append("page", location.pathname);

      fetch("https://api.web3forms.com/submit", { method: "POST", body: body })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r || !r.success) throw new Error("rejected");
          form.innerHTML = '<p class="join__done">You are in. Watch your inbox — ' +
            'and check the spam folder once, so it lands right next time.</p>';
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = label;
          if (note) {
            note.innerHTML = 'That did not send. Write to <a href="mailto:' + INBOX +
              '">' + INBOX + '</a> and Tony will send it by hand.';
            note.classList.add("bad");
          }
        });
    });
  });
})();
