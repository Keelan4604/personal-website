// ---- Year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Theme Toggle ----
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const themeIcon = themeBtn?.querySelector('.theme-icon');

if (localStorage.getItem('theme') === 'light') root.classList.add('light');
updateThemeIcon();

themeBtn?.addEventListener('click', () => {
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
});

function updateThemeIcon() {
  if (!themeIcon) return;
  themeIcon.innerHTML = root.classList.contains('light') ? '&#9728;' : '&#9790;';
}

// ---- Mobile Menu ----
const mobileMenu = document.getElementById('mobileMenu');
const navLinks = document.getElementById('navLinks');

mobileMenu?.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
  navLinks.classList.toggle('open');
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

// ---- Sticky Nav ----
const topbar = document.getElementById('topbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    topbar.classList.add('scrolled');
  } else {
    topbar.classList.remove('scrolled');
  }
}, { passive: true });

// ---- Active Nav ----
const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
if (navAnchors.length) {
  const byId = Object.fromEntries(navAnchors.map(a => [a.getAttribute('href').slice(1), a]));
  const sects = Object.keys(byId).map(id => document.getElementById(id)).filter(Boolean);
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAnchors.forEach(l => l.classList.remove('active'));
        byId[e.target.id]?.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0.01 });
  sects.forEach(s => navObserver.observe(s));
}

// ---- Cursor Glow (dark mode only) ----
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorGlow.classList.add('active');
});

document.addEventListener('mouseleave', () => {
  cursorGlow.classList.remove('active');
});

function animateGlow() {
  glowX += (mouseX - glowX) * 0.08;
  glowY += (mouseY - glowY) * 0.08;
  cursorGlow.style.left = glowX + 'px';
  cursorGlow.style.top = glowY + 'px';
  requestAnimationFrame(animateGlow);
}
animateGlow();

// ---- Scroll Reveal ----
function installReveal() {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.anim-reveal').forEach(el => revealObserver.observe(el));
}
installReveal();

// ---- Stat Counter Animation ----
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.animated) return;
      el.dataset.animated = 'true';

      const target = parseInt(el.dataset.count, 10);
      const duration = 1800;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));
}
animateCounters();

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ---- Typing effect for terminal ----
function animateTerminal() {
  const lines = document.querySelectorAll('.terminal-line');
  if (!lines.length) return;

  const terminalObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const parent = entry.target;
      if (parent.dataset.animated) return;
      parent.dataset.animated = 'true';

      const allLines = parent.querySelectorAll('.terminal-line');
      allLines.forEach((line, i) => {
        line.style.opacity = '0';
        line.style.transform = 'translateY(8px)';
        setTimeout(() => {
          line.style.transition = 'opacity 0.4s, transform 0.4s';
          line.style.opacity = '1';
          line.style.transform = 'none';
        }, i * 400);
      });
    });
  }, { threshold: 0.3 });

  const terminalDisplay = document.querySelector('.terminal-display');
  if (terminalDisplay) terminalObserver.observe(terminalDisplay);
}
animateTerminal();
