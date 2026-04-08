document.getElementById('year').textContent = new Date().getFullYear();

const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') root.classList.add('light');

document.getElementById('themeToggle')?.addEventListener('click', () => {
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
});

function installScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = `${pct}%`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function installActiveNav() {
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  if (!links.length) return;
  const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
  const sections = Object.keys(byId).map(id => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        byId[e.target.id]?.classList.add('active');
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 });
  sections.forEach(s => io.observe(s));
}

function installReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('show'));
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

const projectSummaries = {
  'sim7000A-cellular-GSM-connection': 'Arduino LTE CAT-M1 communication node for remote telemetry and command workflows.',
  'Arduino-Controller-for-Upfitter-Switches': 'Microcontroller-driven automotive switching and power-control architecture.',
  'Nextcloud': 'Self-hosted cloud stack with secure remote access and persistent storage services.',
  'Homebridge': 'Smart-home device bridge integrations and custom ecosystem configuration.',
  'Home-Assistant': 'Home automation orchestration with custom controls and system integration.',
  'Docker-Setup': 'Containerized infrastructure migration for modular service management.',
  'EcoPro-IT-Management': 'Operational IT automation and software integration for business workflows.',
  'Hackintosh-Project': 'System-level hardware/software integration and compatibility tuning.',
  '2004-AR230': 'Marine restoration and technical rebuild documentation.',
  'Jeep-Mods': 'Vehicle diagnostics and electrical/mechanical modification program.'
};

async function loadProjects() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;
  try {
    const res = await fetch('./data/projects.json', { cache: 'no-store' });
    const projects = await res.json();
    const excludedPatterns = [/personal\s*website\s*v?2/i, /website\s*v?2/i];
    const top = projects
      .filter(p => p?.name && !excludedPatterns.some(rx => rx.test(p.name)))
      .slice(0, 9);
    grid.innerHTML = top.map(p => `
      <article class="card reveal">
        <h3>${p.name}</h3>
        <p>${projectSummaries[p.name] || p.description || 'Technical implementation repository and project notes.'}</p>
        <a href="${p.url}" target="_blank" rel="noreferrer">Open Repository ↗</a>
      </article>
    `).join('');
    installReveal();
  } catch {
    grid.innerHTML = '<p class="muted">Could not load projects right now.</p>';
  }
}

installReveal();
installScrollProgress();
installActiveNav();
loadProjects();