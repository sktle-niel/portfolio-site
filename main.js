/* ============================================================
   Niel Patrick Penlas — portfolio behavior
   No inline handlers (CSP-safe). All user text written via
   textContent / encodeURIComponent — never innerHTML.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Enable transitions only after first paint ---------- */
  requestAnimationFrame(function () { root.classList.add('theme-ready'); });

  /* ---------- Theme (light / dark / system) ---------- */
  var mql = window.matchMedia('(prefers-color-scheme: dark)');

  function storedPref() {
    try { return localStorage.getItem('theme') || 'system'; } catch (e) { return 'system'; }
  }
  function applyTheme(pref) {
    var dark = pref === 'dark' || (pref === 'system' && mql.matches);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    var btns = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-theme-set') === pref ? 'true' : 'false');
    }
  }
  function reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function setTheme(pref, x, y) {
    // Circular reveal from the click point when the runtime supports View Transitions.
    if (!document.startViewTransition || reducedMotion() || x == null) {
      try { localStorage.setItem('theme', pref); } catch (e) {}
      applyTheme(pref);
      return;
    }
    root.classList.add('vt');
    var vt = document.startViewTransition(function () {
      try { localStorage.setItem('theme', pref); } catch (e) {}
      applyTheme(pref);
    });
    vt.ready.then(function () {
      var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.documentElement.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 540, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
    vt.finished.finally(function () { root.classList.remove('vt'); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-theme-set]') : null;
    if (t) setTheme(t.getAttribute('data-theme-set'), e.clientX, e.clientY);
  });
  mql.addEventListener('change', function () { if (storedPref() === 'system') applyTheme('system'); });
  applyTheme(storedPref());

  /* ---------- Mobile overlay menu ---------- */
  var overlay = document.getElementById('overlay');
  var openBtn = document.getElementById('menuOpen');
  var closeBtn = document.getElementById('menuClose');
  var lastFocus = null;

  function openMenu() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('open'); });
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var first = overlay.querySelector('a, button');
    if (first) first.focus();
  }
  function closeMenu() {
    overlay.classList.remove('open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { overlay.hidden = true; }, 260);
    if (lastFocus) lastFocus.focus();
  }
  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closeMenu();
  });

  /* ---------- Entrance reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, idx) {
        if (en.isIntersecting) {
          var el = en.target;
          var delay = Math.min(idx * 70, 330);
          setTimeout(function () { el.classList.add('in'); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('in'); });
  }

  /* ---------- Scroll-spy active nav ---------- */
  var navLinks = document.querySelectorAll('.side-nav a');
  var sections = [];
  navLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) sections.push({ a: a, sec: sec });
  });
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          sections.forEach(function (s) {
            s.a.setAttribute('aria-current', s.sec === en.target ? 'true' : 'false');
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s.sec); });
  }

  /* ---------- Clean routing: pretty paths, no .html, no # ---------- */
  var ROUTES = { '/': 'top', '/about': 'about', '/experience': 'experience', '/projects': 'projects', '/skills': 'skills', '/contact': 'contact' };
  function idForPath(path) { path = path.replace(/\/+$/, '') || '/'; return ROUTES[path]; }
  function pathForId(id) { for (var p in ROUTES) { if (ROUTES[p] === id) return p; } return '/'; }
  function setActive(id) {
    navLinks.forEach(function (a) {
      var t = a.getAttribute('href');
      t = (t === '/' ? 'top' : t.replace(/^\//, ''));
      a.setAttribute('aria-current', t === id ? 'true' : 'false');
    });
  }
  function goTo(id, smooth) {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    } else {
      var el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }
    setActive(id);
  }

  // Strip index.html / trailing filename from the entry URL.
  try {
    if (/index\.html$/.test(location.pathname)) {
      history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.search);
    }
  } catch (e) {}
  // Restore a deep-link path captured by 404.html (static-host fallback).
  try {
    var rr = sessionStorage.getItem('route_redirect');
    if (rr) {
      sessionStorage.removeItem('route_redirect');
      if (idForPath(new URL(rr, location.origin).pathname)) history.replaceState(null, '', rr);
    }
  } catch (e) {}

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || a.target === '_blank') return; // leave #skip-link & new-tab links alone
    var u;
    try { u = new URL(a.href, location.origin); } catch (_) { return; }
    if (u.origin !== location.origin) return;
    var id = idForPath(u.pathname);
    if (!id) return;
    e.preventDefault();
    if (overlay && overlay.classList.contains('open')) closeMenu();
    var p = pathForId(id);
    try { if (location.pathname.replace(/\/+$/, '') + '/' !== p + '/' ) history.pushState({ id: id }, '', p); } catch (_) {}
    goTo(id, true);
  });
  window.addEventListener('popstate', function () { goTo(idForPath(location.pathname) || 'top', false); });
  // Honor a section deep-link on first load.
  (function () { var id0 = idForPath(location.pathname); if (id0 && id0 !== 'top') setTimeout(function () { goTo(id0, false); }, 60); })();

  /* ---------- Email reveal (anti-harvest) ---------- */
  var emailLink = document.getElementById('emailLink');
  if (emailLink) {
    var cval = emailLink.querySelector('.cval');
    var addr = cval.getAttribute('data-u') + '@' + cval.getAttribute('data-d');
    emailLink.addEventListener('click', function (e) {
      e.preventDefault();
      cval.textContent = addr;
      emailLink.setAttribute('href', 'mailto:' + addr);
      // Second click follows the mailto normally.
      emailLink.addEventListener('click', function () {}, { once: true });
    });
  }

  /* ---------- Phone reveal (anti-harvest) ---------- */
  var phoneLink = document.getElementById('phoneLink');
  if (phoneLink) {
    var pval = phoneLink.querySelector('.pval');
    var raw = pval.getAttribute('data-p');            // 639929120414
    var nat = raw.slice(2);                            // 9929120414
    var pretty = '0' + nat.slice(0, 3) + ' ' + nat.slice(3, 6) + ' ' + nat.slice(6);
    phoneLink.addEventListener('click', function (e) {
      e.preventDefault();
      pval.textContent = pretty;
      phoneLink.setAttribute('href', 'tel:+' + raw);
      phoneLink.addEventListener('click', function () {}, { once: true });
    });
  }

  /* ---------- Contact form: validation + anti-spam ---------- */
  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');
  var submitBtn = document.getElementById('submitBtn');
  var loadTime = Date.now();
  var MIN_FILL_MS = 3000;          // reject submissions faster than a human could type
  var RATE_MAX = 3;                // max messages
  var RATE_WINDOW = 60 * 60 * 1000; // per hour
  var RATE_KEY = 'cf_sends';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(name, msg) {
    var field = document.getElementById('f-' + name);
    var out = form.querySelector('.field-error[data-for="' + name + '"]');
    if (out) out.textContent = msg || '';
    if (field) field.classList.toggle('invalid', !!msg);
  }
  function showStatus(msg, ok) {
    statusEl.textContent = '';
    var strong = document.createElement('b');
    strong.textContent = ok ? 'Ready. ' : 'Hold on. ';
    statusEl.appendChild(strong);
    statusEl.appendChild(document.createTextNode(msg));
    statusEl.classList.add('show');
    statusEl.classList.toggle('ok', !!ok);
  }

  function getSends() {
    try {
      var arr = JSON.parse(localStorage.getItem(RATE_KEY) || '[]');
      var now = Date.now();
      return arr.filter(function (t) { return now - t < RATE_WINDOW; });
    } catch (e) { return []; }
  }
  function recordSend() {
    try {
      var arr = getSends();
      arr.push(Date.now());
      localStorage.setItem(RATE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  // Live-clear errors as the user types.
  ['name', 'email', 'message'].forEach(function (n) {
    var el = document.getElementById(n);
    if (el) el.addEventListener('input', function () { setError(n, ''); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();
    var honey = form.company.value;

    // 1) Honeypot — silently drop bots.
    if (honey) { showStatus('Message not sent.', false); return; }

    // 2) Timing trap.
    if (Date.now() - loadTime < MIN_FILL_MS) {
      showStatus('That was a little too fast — take a second and try again.', false);
      return;
    }

    // 3) Rate limit.
    if (getSends().length >= RATE_MAX) {
      showStatus('You’ve composed a few already. Please try again later.', false);
      return;
    }

    // 4) Validation.
    var ok = true;
    if (name.length < 2) { setError('name', 'Please enter your name.'); ok = false; }
    else if (name.length > 80) { setError('name', 'That name is too long.'); ok = false; }
    if (!EMAIL_RE.test(email) || email.length > 120) { setError('email', 'Enter a valid email address.'); ok = false; }
    if (message.length < 10) { setError('message', 'Add a little more detail (10+ characters).'); ok = false; }
    else if (message.length > 2000) { setError('message', 'That message is too long.'); ok = false; }
    if (!ok) { showStatus('Check the highlighted fields.', false); return; }

    // 5) Compose mailto — strip CR/LF to prevent header injection; encode everything.
    var clean = function (s) { return s.replace(/[\r\n]+/g, ' ').trim(); };
    var to = 'niel.ladica07' + '@' + 'gmail.com';
    var subject = encodeURIComponent('Portfolio enquiry from ' + clean(name));
    var body = encodeURIComponent(
      'Name: ' + clean(name) + '\n' +
      'Email: ' + clean(email) + '\n\n' +
      message
    );
    var href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;

    // Loading state, then open the user's mail client.
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    recordSend();

    setTimeout(function () {
      window.location.href = href;
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      showStatus('Opening your mail app with the message drafted. If nothing happens, email ' + to + ' directly.', true);
      form.reset();
      loadTime = Date.now();
    }, 500);
  });
})();
