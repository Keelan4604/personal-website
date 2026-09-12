/* =====================================================================
   Keelan O'Doherty - portfolio
   Interactions: smooth scroll, reveals, hero text, counters, nav,
   timeline progress, typed role.

   Scroll work is coalesced into one rAF-driven pass and section offsets
   are cached, so scrolling does not thrash layout. The previous version
   read offsetTop and getBoundingClientRect on every scroll event.
   ===================================================================== */

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- loader ---------- */
  const loader = document.getElementById('loader');
  const hideLoader = () => loader && loader.classList.add('done');
  window.addEventListener('load', () => setTimeout(hideLoader, 550));
  setTimeout(hideLoader, 2400);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  function scrollToEl(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -64, duration: 1.3 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  let offsets = [];
  function measure() {
    offsets = sections.map((s) => ({ el: s, top: s.getBoundingClientRect().top + window.scrollY }));
    if (timeline) tlBox = { top: timeline.getBoundingClientRect().top + window.scrollY, h: timeline.offsetHeight };
  }

  const timeline = document.querySelector('.timeline');
  const tlProgress = document.querySelector('.timeline .progress');
  let tlBox = null;

  let ticking = false;
  let navScrolled = false;
  let activeId = null;
  function onScrollFrame() {
    ticking = false;
    const y = window.scrollY;

    const s = y > 24;
    if (s !== navScrolled) { navScrolled = s; nav.classList.toggle('scrolled', s); }

    const probe = y + window.innerHeight * 0.35;
    let current = null;
    for (let i = 0; i < offsets.length; i++) if (offsets[i].top <= probe) current = offsets[i].el;
    const id = current ? current.id : null;
    if (id !== activeId) {
      activeId = id;
      links.forEach((l) => l.classList.toggle('active', id && l.getAttribute('href') === '#' + id));
    }

    if (tlProgress && tlBox) {
      const pct = Math.min(Math.max((y + window.innerHeight * 0.7 - tlBox.top) / tlBox.h, 0), 1);
      tlProgress.style.height = (pct * 100).toFixed(1) + '%';
    }
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); } }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', () => { measure(); requestTick(); });
  window.addEventListener('load', () => { measure(); requestTick(); });
  measure();
  requestTick();

  /* ---------- anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); scrollToEl(id); closeMenu(); }
    });
  });

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobile-menu');
  function closeMenu() {
    if (!menu) return;
    burger.classList.remove('open');
    menu.classList.remove('open');
    if (lenis) lenis.start();
  }
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = !menu.classList.contains('open');
      burger.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      if (lenis) open ? lenis.stop() : lenis.start();
    });
  }

  /* ---------- hero entrance ---------- */
  const heroLines = document.querySelectorAll('.hero h1 .line span');
  const heroBits = document.querySelectorAll('.hero-copy > *:not(h1)');
  if (window.gsap && !reduced) {
    gsap.set(heroLines, { yPercent: 110 });
    gsap.set(heroBits, { opacity: 0, y: 20 });
    gsap.timeline({ delay: 0.7, defaults: { ease: 'power4.out' } })
      .to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.1, clearProps: 'willChange' })
      .to(heroBits, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07 }, '-=0.65');
  }

  /* ---------- typed role ---------- */
  const typed = document.getElementById('typed');
  const roles = [
    'systems engineer in training',
    'lunar cargo module designer',
    'eVTOL test pilot',
    'propeller acoustics researcher',
    'builder of things that fly',
  ];
  if (typed && !reduced) {
    let ri = 0, ci = 0, del = false;
    (function tick() {
      const word = roles[ri];
      typed.textContent = word.slice(0, ci);
      let wait = del ? 32 : 60 + Math.random() * 40;
      if (!del && ci === word.length) { del = true; wait = 2000; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; wait = 400; }
      ci += del ? -1 : 1;
      setTimeout(tick, wait);
    })();
  } else if (typed) {
    typed.textContent = roles[0];
  }

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      cio.unobserve(el);
      const end = parseFloat(el.dataset.count);
      const start = performance.now();
      const dur = 1500;
      (function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(end * e).toLocaleString();
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  /* ---------- resume viewer fallback ---------- */
  const frame = document.getElementById('resume-frame');
  if (frame) {
    const ua = navigator.userAgent;
    const iosLike = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (iosLike) {
      frame.style.display = 'none';
      const fb = document.querySelector('.resume-fallback');
      if (fb) fb.style.display = 'block';
    }
  }

  /* ---------- year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
