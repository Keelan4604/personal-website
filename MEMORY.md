---
title: keelanodoherty.org (portfolio site)
project: portfolio
type: hub
status: active
updated: 2026-09-12
---

# keelanodoherty.org

Keelan's personal portfolio. **This repo is what the live domain serves.** Cloudflare Pages is
git-connected to `github.com/Keelan4604/personal-website`, production branch `main`, no build
step, repo root is the site root. Push to `main` and it deploys.

The other repo, `Websites/keelan-portfolio/` (`Keelan4604/keelan-portfolio`), is an old OpenClaw
agent workspace that happens to contain a `portfolio-site/` folder. It was deployed once by direct
wrangler upload to a separate Pages project (`keelan-portfolio.pages.dev`) and has never backed
the domain. Do not edit it expecting the live site to change.

## Rebuild, 2026-09-12

Full rebuild from the March 2026 "Aerospace + AI builder" version. Goals Keelan gave: high
quality, brighter colors, a rocket animation like the F-35 reel he saw, resume viewable on the
page, everything he has done showcased against the jobs he is applying for (systems engineering,
integration and test, mission operations, TPM at space companies).

| File | What |
|---|---|
| `index.html` | One page. Hero, marquee, about, stats, work (5 featured + 6 minis), experience timeline, education, skills, resume, contact. |
| `styles.css` | Design system. Dark base, cyan / violet / orange accents, Space Grotesk + Inter + JetBrains Mono. |
| `main.js` | Lenis smooth scroll, GSAP hero reveal, typed role, reveals, counters, spotlight/tilt cards, magnetic buttons, timeline progress, mobile menu. |
| `scene.js` | Three.js hero: procedural Starship-class rocket on a pad. Scroll ignites it, it climbs, the Earth's limb appears, the scene fades out by the stats section. ES module via importmap, CDN-hosted three 0.170. Disabled automatically without WebGL. |
| `assets/Keelan_ODoherty_Resume.pdf` | Copy of `Career/Job-Search/materials/ODoherty-Keelan-Resume-CURRENT.pdf`. **Re-copy whenever the resume changes.** `/resume` redirects here. |
| `assets/img/` | headshot (200px, only one on file), UA and UMich wordmarks, ORCA isometric render (background knocked out from `School/Classes/402/ORCA_v6/Images/isometric.png`), SRPS chamber-pressure plot (AEM 428), EcoPro D8T air-induction CAD render, `og.png` share card. |
| `_headers`, `_redirects` | Security headers, asset caching, `/resume` and old `/senior-project` redirects. |
| `favicon.svg` | Gradient rocket mark. |

## Content rules that apply here

- Same writing rules as cover letters: no em dashes, no bold inside sentences, no
  negation-contrast, no AI mention anywhere on the site.
- **GPA on the site is 3.64**, matching the resume. The transcript on file says 3.612 and the
  number is unverified (see `Career/Job-Search/materials/MEMORY.md`). Change both together.
- **Graduation date is deliberately not stated.** UMich shows "Aug 2026 - present". He may stay
  to May 2028.
- Source of truth for every claim is the resume template
  (`Career/Job-Search/materials/templates/resume-template.html`) plus
  `School/Classes/space582/ng-cat-lit-project/MEMORY.md` for CAT-LIT and
  `Memory/core/career.md` for EcoPro. Keep numbers consistent with those (65+ watercraft,
  30+ rebuilds, 4 propeller geometries, 10,000 RPM, 8,000 kg / 2,000 kg).

## Preview

`portfolio` entry in `~/.claude/launch.json` (`npx serve` on port 4390). No build.

## Wanted next

- A real headshot. The only one on file is a 200 px LinkedIn crop.
- Photos: ORCA on the bench or in flight, the propeller test stand, a jet ski rebuild. The site
  has slots for them and currently uses CAD renders and SVG in their place.
- CAT-LIT: replace the SVG with real content once the team has a concept render, and add the
  AIAA paper if it happens.
