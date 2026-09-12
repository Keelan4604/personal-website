/* =====================================================================
   Keelan O'Doherty - portfolio
   Interactions: smooth scroll, reveals, hero text, counters, tilt cards,
   nav, marquee, timeline progress, typed role, magnetic buttons.
   ===================================================================== */

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- loader ---------- */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader && loader.classList.add('done'), 650);
  });
  setTimeout(() => loader && loader.classList.add('done'), 2200);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  function scrollTo(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -64, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); scrollTo(id); closeMenu(); }
    });
  });

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = null;
    sections.forEach((s) => { if (s.offsetTop <= y) current = s; });
    links.forEach((l) => l.classList.toggle('active', current && l.getAttribute('href') === '#' + current.id));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobile-menu');
  function closeMenu() { burger.classList.remove('open'); menu.classList.remove('open'); if (lenis) lenis.start(); }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    burger.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ---------- hero text ---------- */
  const heroLines = document.querySelectorAll('.hero h1 .line span');
  const heroBits = document.querySelectorAll('.hero-copy > *:not(h1)');
  if (window.gsap) {
    gsap.set(heroLines, { yPercent: 110 });
    gsap.set(heroBits, { opacity: 0, y: 22 });
    const tl = gsap.timeline({ delay: 0.75, defaults: { ease: 'power4.out' } });
    tl.to(heroLines, { yPercent: 0, duration: 1.2, stagger: 0.12 })
      .to(heroBits, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, '-=0.7');
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
    function tick() {
      const word = roles[ri];
      typed.textContent = word.slice(0, ci);
      let wait = del ? 34 : 62 + Math.random() * 40;
      if (!del && ci === word.length) { del = true; wait = 2100; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; wait = 420; }
      ci += del ? -1 : 1;
      setTimeout(tick, wait);
    }
    setTimeout(tick, 1900);
  } else if (typed) { typed.textContent = roles[0]; }

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; cio.unobserve(el);
      const end = parseFloat(el.dataset.count); const dec = parseInt(el.dataset.dec || '0', 10);
      const start = performance.now(); const dur = 1600;
      function step(now) {
        const t = Math.min((now - start) / dur, 1); const e = 1 - Math.pow(1 - t, 4);
        el.textContent = (end * e).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  /* ---------- spotlight + tilt cards ---------- */
  document.querySelectorAll('.card, .stat, .mini, .skill-group, .edu').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', (x / r.width) * 100 + '%');
      card.style.setProperty('--my', (y / r.height) * 100 + '%');
      if (fine && !reduced && card.classList.contains('card')) {
        const rx = ((y / r.height) - 0.5) * -4; const ry = ((x / r.width) - 0.5) * 5;
        card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduced) {
    document.querySelectorAll('.btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- cursor glow ---------- */
  const glow = document.getElementById('cursor-glow');
  if (glow && fine && !reduced) {
    let tx = 0, ty = 0, gx = 0, gy = 0;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; glow.style.opacity = '1'; }, { passive: true });
    document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    (function loop() { gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12; glow.style.left = gx + 'px'; glow.style.top = gy + 'px'; requestAnimationFrame(loop); })();
  }

  /* ---------- timeline progress ---------- */
  const tl = document.querySelector('.timeline');
  const prog = document.querySelector('.timeline .progress');
  if (tl && prog) {
    function upd() {
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      const pct = Math.min(Math.max((vh * 0.7 - r.top) / r.height, 0), 1);
      prog.style.height = (pct * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- section parallax accents (gsap) ---------- */
  if (window.gsap && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on('scroll', ScrollTrigger.update); }
    gsap.utils.toArray('.card-visual img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('h2.title').forEach((h) => {
      gsap.from(h, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
  }

  /* ---------- resume iframe fallback ---------- */
  const frame = document.getElementById('resume-frame');
  if (frame) {
    const ua = navigator.userAgent;
    const iosLike = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (iosLike) { frame.style.display = 'none'; const fb = document.querySelector('.resume-fallback'); if (fb) fb.style.display = 'block'; }
  }

  /* ---------- year ---------- */
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
