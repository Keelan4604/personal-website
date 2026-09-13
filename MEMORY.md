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
| `index.html` | One page. Hero (name, degrees, links), stats, projects (5 featured + 6 short), compact experience list, education, skills, resume, contact with headshot. |
| `styles.css` | Design system. **Light theme** (2026-09-12): off-white ground, white cards with soft shadows, cyan / violet / orange accents, Space Grotesk + Inter + JetBrains Mono. |
| `main.js` | Lenis smooth scroll, GSAP hero reveal, typed role, reveals, counters, timeline progress, mobile menu. One rAF-coalesced scroll pass with cached offsets. |
| `scene.js` | Three.js hero: procedural launch vehicle on a pad in daylight. Scroll ignites it and it climbs out of frame; the scene fades out before the About section. ES module via importmap, CDN-hosted three 0.170. Off automatically without WebGL and on viewports under 820 px. |
| `assets/Keelan_ODoherty_Resume.pdf` | Copy of `Career/Job-Search/materials/ODoherty-Keelan-Resume-CURRENT.pdf`. **Re-copy whenever the resume changes.** `/resume` redirects here. |
| `assets/img/` | headshot (200px, only one on file), UA and UMich wordmarks, ORCA isometric render (background knocked out from `School/Classes/402/ORCA_v6/Images/isometric.png`), SRPS chamber-pressure plot (AEM 428), EcoPro D8T air-induction CAD render, `og.png` share card. |
| `_headers`, `_redirects` | Security headers, asset caching, `/resume` and old `/senior-project` redirects. |
| `favicon.svg` | Gradient rocket mark. |

## Light theme and the performance pass, 2026-09-12

The first version was dark and it ran badly, on Keelan's own desktop included. Both were fixed in
one pass. Measured after: **60 fps locked, zero frames over 20 ms, worst frame 18 ms** through a
continuous scroll of the hero launch and the work grid.

What was costing the frames, in rough order:

| Cause | Fix |
|---|---|
| `backdrop-filter` on every card, a dozen blurred surfaces repainting on scroll | Kept on the nav only. This was the single biggest win. |
| `UnrealBloomPass` + `EffectComposer`, three extra full-screen passes per frame | Removed. Direct render, one pass. The flame carries the glow in its own shader. |
| Procedural Earth: 5-octave 3D noise per pixel over a full-screen sphere | Removed the planet entirely. Daylight climb instead. |
| 1,400 particles with positions recomputed in JS and uploaded every frame | 420 points, motion computed in the vertex shader from a seed plus the clock. The CPU never touches a position. |
| 2,200-point starfield, atmosphere shell, full-page blur filters, grain overlay, cursor-follow rAF loop | All removed. |
| `offsetTop` and `getBoundingClientRect` read on every scroll event | One rAF-coalesced pass, offsets cached and re-measured on resize only. |

Also added: pixel ratio capped at 1.5, render skipped entirely once the hero is off screen, and a
frame-time watchdog that drops to 1x resolution and then disables the scene if frames run long.
**Do not reintroduce bloom, a noise-shader planet, or card-level backdrop-filter.**

## Content rules that apply here

- **Facts only, no voice copy (Keelan, 2026-09-13).** He called the first version a brick of
  text with cheesy, obviously-AI lines. Everything interpretive was cut: the typed role phrases,
  the About prose, the buzzword marquee, clever section headings, skill-group subtitles, the
  contact pitch, the loader text, the footer tagline. Headings are plain nouns. Cards are meta,
  title, one factual line, specs, up to three short bullets. Experience is a compact list with no
  bullets because the projects already carry that detail. Do not add any of it back.

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
