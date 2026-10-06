/* EMAIL CAPTURE — one system, tied to the site.

   Tony, 10/4/2026: "We are supposed to be able to capture emails in the
   system. How the heck am I gonna keep track of this? ... you have to develop
   an email capture system that's tied to the website."

   He was right. Before this, every form on the site posted to Web3Forms,
   which sends a notification email and keeps no list. A pile of notifications
   is not a list: nothing is deduped, nothing is counted, nothing can be
   exported, and the master CSV was a three-week-old export someone made by
   hand. The page also referenced this file and it did not exist — a 404 on
   every load.

   Now every form posts to a Netlify endpoint on Tony's own account:
       https://tribeawaken-capture.netlify.app
   which records each signup with its date, the page it came from and the
   edition the reader was in. That gives a dashboard, CSV export, spam
   filtering, and an API — and _tools/pull-subscribers.py reads that API every
   morning to keep ONE master list current, so nobody tracks anything by hand.

   This rewrites the forms at run time rather than editing eighty pages of
   markup, so a page added later is covered the moment it loads.  */
(function () {
  'use strict';
  var ENDPOINT = 'https://tribeawaken-capture.netlify.app/';
  /* Two piles, because they are two different things. A signup needs nothing
     back; an enquiry needs an answer. Tony reads the enquiries once a week,
     so they must not be buried in the signups. A form carrying a message is
     an enquiry; everything else is a signup. */
  var SIGNUP   = 'tribe-capture';
  var ENQUIRY  = 'tribe-enquiry';

  var LANG = (document.documentElement.getAttribute('data-mag-edition') ||
              (document.documentElement.lang || 'en').slice(0, 2));

  var SAID = {
    en: { ok:  'Thank you — that reached Tony.',
          sub: 'The magazine turns every morning; the letter comes once a week.',
          err: 'That did not go through. Try once more, or write to tony@tribeawaken.com.' },
    es: { ok:  'Gracias — le llegó a Tony.',
          sub: 'La revista cambia cada mañana; la carta llega una vez por semana.',
          err: 'No se envió. Inténtelo otra vez, o escriba a tony@tribeawaken.com.' },
    ja: { ok:  'ありがとうございます — トニーに届きました。',
          sub: '誌面は毎朝入れ替わり、お便りは週に一度届きます。',
          err: '送信できませんでした。もう一度お試しください。' },
    lt: { ok:  'Ačiū — Tony tai gavo.',
          sub: 'Žurnalas keičiasi kas rytą; laiškas ateina kartą per savaitę.',
          err: 'Nepavyko išsiųsti. Pabandykite dar kartą.' }
  };
  var T = SAID[LANG] || SAID.en;

  function done(form, ok) {
    var box = document.createElement('div');
    box.className = 'cap-done' + (ok ? '' : ' cap-done--err');
    box.setAttribute('role', 'status');
    box.innerHTML = '<b></b>' + (ok ? '<span></span>' : '');
    box.querySelector('b').textContent = ok ? T.ok : T.err;
    if (ok) box.querySelector('span').textContent = T.sub;
    form.parentNode.insertBefore(box, form);
    form.hidden = true;
  }

  function upgrade(form) {
    var action = (form.getAttribute('action') || '');
    if (!/web3forms/i.test(action)) return;
    if (form.__captured) return;
    form.__captured = true;

    // the source tells Tony where a reader signed up, which the old
    // notifications never did
    var src = form.className.replace(/\s+/g, '-') || 'form';

    form.setAttribute('action', ENDPOINT);
    form.setAttribute('method', 'POST');
    /* Web3Forms' own plumbing is meaningless to the new endpoint — but only
       the hidden plumbing. The contact form has a real `subject` dropdown the
       reader chooses from, and stripping by name alone deleted it off the
       page. Hidden inputs only. */
    ['access_key', 'subject', 'from_name', 'redirect'].forEach(function (n) {
      var el = form.querySelector('input[type="hidden"][name="' + n + '"]');
      if (el) el.parentNode.removeChild(el);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (form.querySelector('input[type=email]') || {}).value || '';
      if (!email) return;
      var btn = form.querySelector('button, input[type=submit]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }

      var isEnquiry = !!form.querySelector('[name="message"]');
      var body = new URLSearchParams();
      body.set('form-name', isEnquiry ? ENQUIRY : SIGNUP);
      body.set('email', email);
      body.set('source', src);
      body.set('edition', LANG);
      body.set('page', location.pathname);
      /* an enquiry carries more than an address. 6 October: the Contact page
         promised a form and had none, so every question on the site was a
         mailto to another business's inbox. */
      ['name', 'subject', 'message'].forEach(function (f) {
        var el = form.querySelector('[name="' + f + '"]');
        if (el && el.value) body.set(f, el.value);
      });
      var bot = form.querySelector('[name="botcheck"], [name="bot-field"]');
      body.set('bot-field', bot && bot.value ? bot.value : '');

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      }).then(function (r) {
        done(form, r.ok);
      }).catch(function () {
        done(form, false);
      });
    });
  }

  function sweep() {
    var fs = document.querySelectorAll('form');
    for (var i = 0; i < fs.length; i++) upgrade(fs[i]);
  }
  sweep();
  // the seven-minute panel builds its form later
  new MutationObserver(sweep).observe(document.documentElement,
    { childList: true, subtree: true });
})();
