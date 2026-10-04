/* A mini menu beside each stage, so a reader knows what is in the section.

   Tony, 10/4: "the 4 fires and the work and the life should have a mini menu
   on the side so someone knows what is in that section."

   The dots already carry every scene's name in their aria-label, so this
   writes those names out as a real list rather than asking anyone to hover a
   dot and guess. Clicking an entry goes to that scene and, per the motion
   law, hands the stage over for good.

   It builds itself from what is already on the page: nothing is hard-coded,
   so a scene added later appears here on its own. */
(function () {
  var stages = document.querySelectorAll('.stage');
  if (!stages.length) return;

  stages.forEach(function (stage) {
    var deck = stage.querySelector('.stage__deck');
    var dots = Array.prototype.slice.call(stage.querySelectorAll('.stage__dot'));
    if (!deck || dots.length < 2) return;
    if (stage.querySelector('.stage__menu')) return;

    var nav = document.createElement('nav');
    nav.className = 'stage__menu';
    nav.setAttribute('aria-label', 'In this section');

    var head = document.createElement('p');
    head.className = 'stage__menu-k';
    head.textContent = 'In this section';
    nav.appendChild(head);

    var ul = document.createElement('ul');
    dots.forEach(function (dot, n) {
      var name = dot.getAttribute('aria-label') || ('Scene ' + (n + 1));
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stage__menu-i';
      b.innerHTML = '<i>' + String(n + 1).padStart(2, '0') + '</i><span></span>';
      b.querySelector('span').textContent = name;
      b.addEventListener('click', function () { dot.click(); });
      li.appendChild(b);
      ul.appendChild(li);
      dot.__menuItem = b;
    });
    nav.appendChild(ul);

    /* the deck and the menu sit side by side */
    var wrap = document.createElement('div');
    wrap.className = 'stage__with-menu';
    deck.parentNode.insertBefore(wrap, deck);
    wrap.appendChild(nav);
    wrap.appendChild(deck);

    /* follow whichever scene the engine has on */
    function sync() {
      dots.forEach(function (d) {
        if (!d.__menuItem) return;
        var on = d.classList.contains('is-on');
        d.__menuItem.classList.toggle('is-on', on);
        d.__menuItem.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }
    sync();
    new MutationObserver(sync).observe(stage.querySelector('.stage__dots'),
      { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
})();
