/* ABUNDANCE MINDSET MAGAZINE — two things the reader needs.

   1. SHARE. Tony, 10/4: "things that are shareable.. that we can link to."
      Every card gets its own control. His own pieces share their page on this
      site; a found story shares the publisher's link, because the reader
      should land where the work actually lives.

   2. REGISTER, at seven minutes. Tony, 10/4: "make sure we capture emails and
      folks register — once they read about 7 mins." So it is time ON the page,
      counted only while the tab is actually in front of someone, and it is
      asked once. A reader who closes it is not asked again on this device.

   Honest about what happens next: the address goes to Tony. There is no list
   software behind this and no automatic reply, so the panel never promises an
   email is already on its way.  */
(function () {
  var LANG = (document.documentElement.lang || 'en').slice(0, 2);

  var T = {
    en: { share: 'Share', copied: 'Link copied',
          k: 'Seven minutes in',
          h: 'Would you like the edition sent to you?',
          p: 'You have been reading a while — thank you. A new edition turns here every morning. Leave an address and Tony will send it out to you.',
          ph: 'you@example.com', go: 'Send it to me', no: 'Not now',
          fine: 'It goes straight to Tony — no list software, no automatic reply, nothing sold on. The magazine stays free to read here either way.',
          done: 'Thank you — that reached Tony.' },
    es: { share: 'Compartir', copied: 'Enlace copiado',
          k: 'Siete minutos leyendo',
          h: '¿Quiere que le enviemos la edición?',
          p: 'Lleva un rato leyendo — gracias. Aquí cambia la edición cada mañana. Deje su correo y Tony se la enviará.',
          ph: 'usted@ejemplo.com', go: 'Envíenmela', no: 'Ahora no',
          fine: 'Llega directamente a Tony — sin programa de listas, sin respuesta automática, sin vender nada a nadie. La revista sigue siendo gratuita aquí.',
          done: 'Gracias — le llegó a Tony.' },
    ja: { share: '共有', copied: 'リンクをコピーしました',
          k: '読み始めて七分',
          h: '最新号をお届けしましょうか。',
          p: 'しばらくお読みいただきありがとうございます。ここでは毎朝新しい号に入れ替わります。アドレスをご記入いただければ、トニーがお送りします。',
          ph: 'you@example.com', go: '送ってほしい', no: '今はしない',
          fine: 'トニー本人に直接届きます。配信ソフトも自動返信もなく、誰にも売りません。ここではこれからも無料でお読みいただけます。',
          done: 'ありがとうございます — トニーに届きました。' },
    lt: { share: 'Pasidalinti', copied: 'Nuoroda nukopijuota',
          k: 'Septynios minutės skaitant',
          h: 'Ar norėtumėte gauti leidimą paštu?',
          p: 'Skaitote jau kurį laiką — ačiū. Čia kiekvieną rytą pasikeičia leidimas. Palikite adresą ir Tony jį atsiųs.',
          ph: 'jus@pavyzdys.lt', go: 'Atsiųskite man', no: 'Ne dabar',
          fine: 'Tai keliauja tiesiai pas Tony — jokios rašymų programos, jokio automatinio atsakymo, niekam neparduodama. Žurnalas čia lieka nemokamas.',
          done: 'Ačiū — Tony tai gavo.' },
  };
  var t = T[LANG] || T.en;

  /* ── 1. a share control on every card ─────────────────────────────────── */
  var SVG = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" ' +
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/>' +
            '<path d="M8.4 10.8 15.6 6.4M8.4 13.2l7.2 4.4"/></svg>';

  function abs(href) {
    var a = document.createElement('a'); a.href = href; return a.href;
  }

  function kit(card) {
    if (card.parentNode && card.parentNode.classList.contains('amm__w')) return;
    var w = document.createElement('div');
    w.className = 'amm__w';
    card.parentNode.insertBefore(w, card);
    w.appendChild(card);

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'amm__share';
    b.innerHTML = SVG + '<span>' + t.share + '</span>';
    b.setAttribute('aria-label', t.share);
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var url = abs(card.getAttribute('href'));
      var ttl = (card.querySelector('b') || card).textContent.trim();
      if (navigator.share) {
        navigator.share({ title: ttl, url: url }).catch(function () {});
        return;
      }
      var ok = function () {
        var s = b.querySelector('span'); var was = s.textContent;
        s.textContent = t.copied; b.classList.add('is-done');
        setTimeout(function () { s.textContent = was; b.classList.remove('is-done'); }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok, function () { window.prompt(t.share, url); });
      } else { window.prompt(t.share, url); }
    });
    w.appendChild(b);
  }

  function sweep() {
    var cards = document.querySelectorAll('.amm__c, .amm__f');
    for (var i = 0; i < cards.length; i++) kit(cards[i]);
  }
  sweep();
  // the feed renders after a fetch, so watch for the cards arriving
  var hosts = document.querySelectorAll('[data-mag-mine], [data-found]');
  for (var i = 0; i < hosts.length; i++) {
    new MutationObserver(sweep).observe(hosts[i], { childList: true });
  }

  /* ── 2. the seven-minute invitation ───────────────────────────────────── */
  var KEY = 'amm.register.v1';
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}

  var SEVEN = 7 * 60 * 1000;
  var read = 0, last = Date.now(), timer = null, shown = false;

  function remember(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function tick() {
    if (document.hidden) { last = Date.now(); return; }
    var now = Date.now();
    read += now - last; last = now;
    if (read >= SEVEN && !shown) { shown = true; clearInterval(timer); open(); }
  }

  function open() {
    var p = document.createElement('aside');
    p.className = 'amm-reg';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', t.h);
    p.innerHTML =
      '<div class="amm-reg__in">' +
        '<button class="amm-reg__x" type="button" aria-label="' + t.no + '">×</button>' +
        '<p class="amm-reg__k">' + t.k + '</p>' +
        '<h2 class="amm-reg__h">' + t.h + '</h2>' +
        '<p class="amm-reg__p">' + t.p + '</p>' +
        '<form class="amm-reg__f" action="https://api.web3forms.com/submit" method="POST">' +
          '<input type="hidden" name="access_key" value="057975c1-1a1a-465e-9b5e-3fb6692b2106">' +
          '<input type="hidden" name="subject" value="Abundance Mindset Magazine — a reader registered (7 min)">' +
          '<input type="hidden" name="from_name" value="TribeAwaken Magazine">' +
          '<input type="hidden" name="edition" value="' + LANG + '">' +
          '<input type="hidden" name="page" value="' + location.pathname + '">' +
          '<input type="hidden" name="redirect" value="https://tribeawaken.com/thanks/">' +
          '<input type="checkbox" name="botcheck" class="sr-only" style="display:none" tabindex="-1" autocomplete="off">' +
          '<label class="sr-only" for="amm-reg-email">' + t.ph + '</label>' +
          '<input id="amm-reg-email" type="email" name="email" required autocomplete="email" ' +
                 'placeholder="' + t.ph + '" spellcheck="false">' +
          '<button class="amm-reg__go" type="submit">' + t.go + '</button>' +
        '</form>' +
        '<p class="amm-reg__fine">' + t.fine + '</p>' +
      '</div>';
    document.body.appendChild(p);
    requestAnimationFrame(function () { p.classList.add('is-in'); });

    p.querySelector('.amm-reg__x').addEventListener('click', function () {
      p.classList.remove('is-in');
      remember('dismissed');
      setTimeout(function () { p.remove(); }, 420);
    });
    p.querySelector('.amm-reg__f').addEventListener('submit', function () {
      remember('registered');
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && p.isConnected) {
        p.classList.remove('is-in'); remember('dismissed');
        setTimeout(function () { p.remove(); }, 420);
        document.removeEventListener('keydown', esc);
      }
    });
  }

  document.addEventListener('visibilitychange', function () { last = Date.now(); });
  timer = setInterval(tick, 5000);
})();
