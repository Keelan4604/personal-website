/* =====================================================================
   Hero scene: a procedural launch vehicle on a pad, daylight.
   Scroll ignites it and flies it out of frame; the scene fades before
   the About section reaches the top.

   Written for frame budget, not for maximum effect:
   - no EffectComposer, no bloom. Direct render, one pass.
   - smoke motion lives in the vertex shader. The CPU never touches a
     particle position, so there is no per-frame buffer upload.
   - no procedural planet. The earlier version ran 5-octave 3D noise per
     pixel over a full-screen sphere, which was most of the cost.
   - renders only while the hero is on screen, and only when the scroll
     position or clock actually changed something visible.
   - measures its own frame time and steps resolution down, then off.
   ===================================================================== */

import * as THREE from 'three';

const mount = document.getElementById('scene');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = window.matchMedia('(max-width: 820px)').matches;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (!mount || !supportsWebGL() || small) {
  document.documentElement.classList.add('no-webgl');
} else {
  init();
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 900);

  /* ---------- lights: one hemi, one key, one rim, one engine ---------- */
  scene.add(new THREE.HemisphereLight(0xdcecff, 0x9aa8bd, 1.45));
  const key = new THREE.DirectionalLight(0xfff6e8, 2.0);
  key.position.set(16, 24, 18);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb7e8, 1.1);
  rim.position.set(-18, 6, -16);
  scene.add(rim);
  const engineLight = new THREE.PointLight(0xff8a2a, 0, 40, 2);
  scene.add(engineLight);

  /* ---------- materials ---------- */
  const steel = new THREE.MeshStandardMaterial({ color: 0xeef2f8, metalness: 0.72, roughness: 0.34 });
  const tiles = new THREE.MeshStandardMaterial({ color: 0x59637a, metalness: 0.4, roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x6d7896, metalness: 0.6, roughness: 0.5 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x39404f, metalness: 0.85, roughness: 0.32 });

  /* ---------- vehicle ---------- */
  const rocket = new THREE.Group();
  scene.add(rocket);

  // one lathe profile: skirt, barrel, tangent-ogive nose
  const profile = [new THREE.Vector2(0.74, 0), new THREE.Vector2(1.0, 0.26)];
  for (let y = 0.26; y <= 8; y += 0.6) profile.push(new THREE.Vector2(1.0, y));
  const noseH = 4.1;
  for (let i = 1; i <= 14; i++) {
    const t = i / 14;
    const r = Math.sqrt(Math.max(1 - t * t, 0)) * 0.93 + (1 - t) * 0.07;
    profile.push(new THREE.Vector2(Math.max(r, 0.001), 8 + t * noseH));
  }
  profile.push(new THREE.Vector2(0, 8 + noseH));
  rocket.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 56), steel));

  // heat-shield band down one side
  const barrel = [new THREE.Vector2(1.012, 0.3)];
  for (let y = 0.3; y <= 7.9; y += 0.8) barrel.push(new THREE.Vector2(1.012, y));
  const tileGeo = new THREE.LatheGeometry(barrel, 24, Math.PI * 0.92, Math.PI * 0.8);
  rocket.add(new THREE.Mesh(tileGeo, tiles));

  // weld rings, for scale
  const seamGeo = new THREE.TorusGeometry(1.008, 0.013, 6, 48);
  for (let y = 1.25; y < 8; y += 1.15) {
    const s = new THREE.Mesh(seamGeo, dark);
    s.rotation.x = Math.PI / 2;
    s.position.y = y;
    rocket.add(s);
  }

  // flaps
  function flap(w, h, thick, y, side, forward) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, forward ? h * 0.28 : h * 0.1);
    shape.lineTo(w, h);
    shape.lineTo(0, h);
    shape.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
    const m = new THREE.Mesh(geo, tiles);
    m.position.set(side * 0.97, y, -thick / 2);
    if (side < 0) { m.rotation.y = Math.PI; m.position.z = thick / 2; }
    return m;
  }
  rocket.add(flap(1.25, 2.2, 0.12, 1.0, 1, false));
  rocket.add(flap(1.25, 2.2, 0.12, 1.0, -1, false));
  rocket.add(flap(0.7, 1.35, 0.1, 8.8, 1, true));
  rocket.add(flap(0.7, 1.35, 0.1, 8.8, -1, true));

  // engines: shared geometry, 7 instances placed by hand
  const nozzleGeo = new THREE.CylinderGeometry(0.2, 0.33, 0.58, 16, 1, true);
  const bells = [[0, 0]];
  for (let i = 0; i < 6; i++) bells.push([Math.cos((i / 6) * Math.PI * 2) * 0.55, Math.sin((i / 6) * Math.PI * 2) * 0.55]);
  bells.forEach(([x, z]) => {
    const n = new THREE.Mesh(nozzleGeo, nozzleMat);
    n.position.set(x, -0.3, z);
    rocket.add(n);
  });

  /* ---------- flame: one cone, normal blending so it reads on a pale sky ---------- */
  const flameMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uPower; varying vec2 vUv;
      void main(){
        float y = vUv.y;                       // 1 at the throat, 0 at the tip
        float flick = 0.86 + 0.14 * sin(uTime * 34.0 + y * 22.0) * sin(uTime * 19.0 + 2.0);
        vec3 hot  = vec3(1.00, 0.97, 0.86);
        vec3 mid  = vec3(1.00, 0.62, 0.16);
        vec3 tip  = vec3(0.93, 0.32, 0.10);
        vec3 col = mix(tip, mid, smoothstep(0.0, 0.55, y));
        col = mix(col, hot, smoothstep(0.6, 1.0, y));
        float edge = smoothstep(0.0, 0.14, y) * smoothstep(1.02, 0.72, y * 0.85 + 0.2);
        gl_FragColor = vec4(col, edge * flick * uPower * 0.95);
      }`
  });
  const flame = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.06, 7.5, 20, 1, true), flameMat);
  flame.position.y = -3.9;
  flame.rotation.x = Math.PI;
  rocket.add(flame);

  /* ---------- smoke: position computed on the GPU from a seed + clock ---------- */
  const N = 420;
  const smokeGeo = new THREE.BufferGeometry();
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) seeds[i] = i / N + (Math.random() - 0.5) / N;
  // a dummy position attribute keeps three.js happy about the draw range
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  smokeGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  smokeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -6, 0), 24);

  const smokeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uPR: { value: dpr }, uSpread: { value: 1.6 } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime; uniform float uPower; uniform float uPR; uniform float uSpread;
      varying float vLife; varying float vSeed;
      void main(){
        float rate = 0.30 + aSeed * 0.34;
        float life = fract(uTime * rate + aSeed * 11.37);
        vLife = life; vSeed = aSeed;
        float ang = aSeed * 79.7;
        float rad = 0.22 + life * uSpread;
        vec3 p;
        p.x = cos(ang) * rad + sin(uTime * 1.4 + aSeed * 23.0) * life * 0.7;
        p.y = -0.55 - life * life * 13.0;
        p.z = sin(ang) * rad + cos(uTime * 1.1 + aSeed * 31.0) * life * 0.7;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (9.0 + aSeed * 15.0) * (1.0 + life * 3.4) * uPR * (52.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uPower; varying float vLife; varying float vSeed;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float r = dot(d, d) * 4.0;                 // squared falloff, no sqrt
        float soft = smoothstep(1.0, 0.05, r);
        vec3 ember = vec3(1.0, 0.74, 0.38);
        vec3 smoke = vec3(0.87, 0.88, 0.92);
        vec3 col = mix(ember, smoke, smoothstep(0.02, 0.3, vLife));
        float a = soft * uPower * (1.0 - vLife) * 0.8;
        gl_FragColor = vec4(col, a);
      }`
  });
  const smoke = new THREE.Points(smokeGeo, smokeMat);
  rocket.add(smoke);

  /* ---------- exhaust column left behind, world space ---------- */
  const trailMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uPower; varying vec2 vUv;
      void main(){
        float y = vUv.y;
        float billow = 0.72 + 0.28 * sin(y * 26.0 + uTime * 0.7) * sin(y * 9.0 - uTime * 0.4);
        float fade = smoothstep(0.0, 0.35, y) * smoothstep(1.0, 0.55, y * 0.6 + 0.3);
        float side = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
        gl_FragColor = vec4(vec3(0.90, 0.91, 0.94), fade * billow * side * uPower * 0.6);
      }`
  });
  const trail = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.6, 1, 18, 1, true), trailMat);
  trail.visible = false;
  scene.add(trail);

  /* ---------- pad ---------- */
  const pad = new THREE.Group();
  const padDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(4.0, 4.4, 0.34, 40),
    new THREE.MeshStandardMaterial({ color: 0xdfe5ee, metalness: 0.2, roughness: 0.85 })
  );
  padDisc.position.y = -0.92;
  pad.add(padDisc);
  [2.2, 3.1, 3.9].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.03, r, 56),
      new THREE.MeshBasicMaterial({ color: 0x0e8fa8, transparent: true, opacity: 0.4 - i * 0.1, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.73;
    pad.add(ring);
  });
  const armGeo = new THREE.BoxGeometry(0.15, 0.15, 1.3);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const arm = new THREE.Mesh(armGeo, dark);
    arm.position.set(Math.cos(a) * 1.6, -0.56, Math.sin(a) * 1.6);
    arm.rotation.y = -a;
    pad.add(arm);
  }
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 13.5, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xb9c2d2, metalness: 0.4, roughness: 0.7 })
  );
  tower.position.set(-3.5, 5.9, -1.3);
  pad.add(tower);
  const grid = new THREE.GridHelper(140, 56, 0x7f93b5, 0x9fb0cc);
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  grid.position.y = -1.1;
  pad.add(grid);
  scene.add(pad);

  /* ---------- scroll state ---------- */
  const st = { p: 0, target: 0, mx: 0, smx: 0, my: 0, smy: 0, fade: 1 };
  const flightSpan = () => Math.max(window.innerHeight * 1.05, 700);
  const camFollow = 0.5;   // camera rises at half the vehicle's rate, so it climbs out of frame
  const heroOffsetX = () => (window.innerWidth > 1280 ? 6.2 : window.innerWidth > 1080 ? 5.2 : 3.4);
  const heroDist = () => (window.innerWidth > 1280 ? 27 : window.innerWidth > 1080 ? 33 : 40);
  const lookShift = () => (window.innerWidth > 1080 ? 4.0 : 2.0);

  addEventListener('scroll', () => { st.target = clamp(scrollY / flightSpan(), 0, 1); }, { passive: true });
  addEventListener('pointermove', (e) => {
    st.mx = (e.clientX / innerWidth - 0.5) * 2;
    st.my = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  /* ---------- adaptive quality ---------- */
  let slowFrames = 0, level = 0;   // 0 full, 1 reduced, 2 off
  function degrade() {
    if (level === 0) {
      level = 1;
      dpr = 1;
      renderer.setPixelRatio(1);
      smokeMat.uniforms.uPR.value = 1;
      smokeGeo.setDrawRange(0, Math.floor(N * 0.5));
    } else if (level === 1) {
      level = 2;
      mount.style.opacity = '0';
      document.documentElement.classList.add('no-webgl');
    }
  }

  const clock = new THREE.Clock();
  let running = true;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (level === 2) return;

    const t0 = performance.now();
    const t = clock.getElapsedTime();

    // fade out before the About section arrives
    const fadeStart = flightSpan() * 0.5;
    const fadeEnd = flightSpan() * 0.84;
    const f = 1 - clamp((scrollY - fadeStart) / (fadeEnd - fadeStart), 0, 1);
    if (Math.abs(f - st.fade) > 0.004) { st.fade = f; mount.style.opacity = f.toFixed(3); }
    if (f <= 0.002) return;   // hero is off screen: skip the whole render

    st.p += (st.target - st.p) * 0.085;
    st.smx += (st.mx - st.smx) * 0.05;
    st.smy += (st.my - st.smy) * 0.05;

    const p = reduced ? 0 : st.p;
    const ignition = seg(p, 0.05, 0.20);
    const lift = smooth(seg(p, 0.15, 0.92));
    const power = ignition;

    const alt = Math.pow(lift, 1.55) * 150;
    const offX = heroOffsetX();
    rocket.position.set(offX + Math.pow(lift, 2) * 1.4, alt + (p < 0.08 ? Math.sin(t * 0.9) * 0.02 : 0), 0);
    rocket.rotation.z = -Math.pow(lift, 1.5) * 0.34;
    rocket.rotation.y = t * 0.07 + lift * 0.9;

    pad.position.x = offX;
    pad.visible = lift < 0.99;

    // trail from the pad up to the engines
    if (power > 0.02 && alt > 1.2) {
      const h = alt + 0.4;
      trail.visible = true;
      trail.position.set(offX, h * 0.5 - 0.9, 0);
      trail.scale.set(1, h, 1);
      trailMat.uniforms.uTime.value = t;
      trailMat.uniforms.uPower.value = power * (1 - lift * 0.25);
    } else {
      trail.visible = false;
    }

    // camera follows with a slow orbit and a little mouse lean
    const dist = mix(heroDist(), 62, lift);
    const orbit = lift * 0.95 + st.smx * 0.1;
    const camY = alt * camFollow;
    camera.position.set(
      rocket.position.x + Math.sin(orbit) * dist * 0.5 + 13 * (1 - lift),
      camY + mix(5.2, 13, lift) + st.smy * -1.1,
      Math.cos(orbit) * dist
    );
    camera.lookAt(rocket.position.x - lookShift() * (1 - lift), camY + mix(5, 7, lift), 0);

    flameMat.uniforms.uTime.value = t;
    flameMat.uniforms.uPower.value = power;
    smokeMat.uniforms.uTime.value = t;
    smokeMat.uniforms.uPower.value = power;
    smokeMat.uniforms.uSpread.value = 1.4 + lift * 1.6;
    flame.scale.set(1 + power * 0.2, 0.45 + power * 0.85 + lift * 0.5, 1 + power * 0.2);

    engineLight.intensity = power * 90;
    engineLight.position.set(rocket.position.x, rocket.position.y - 2.2, 0);

    renderer.render(scene, camera);

    // frame-time watchdog: two thirds of a second of bad frames steps down
    if (performance.now() - t0 > 12) { if (++slowFrames > 40) { slowFrames = 0; degrade(); } }
    else if (slowFrames > 0) { slowFrames--; }
  }

  /* ---------- HUD, driven off the same state ---------- */
  const hudAlt = document.getElementById('hud-alt');
  const hudVel = document.getElementById('hud-vel');
  const hudThr = document.getElementById('hud-thr');
  if (hudAlt) {
    setInterval(() => {
      if (st.fade <= 0.01) return;
      const p = st.p;
      const lift = smooth(seg(p, 0.15, 0.92));
      const ign = seg(p, 0.05, 0.20);
      hudAlt.textContent = (Math.pow(lift, 1.55) * 118).toFixed(1).padStart(5, ' ') + ' km';
      hudVel.textContent = (Math.pow(lift, 1.3) * 2400 + ign * 30).toFixed(0).padStart(4, ' ') + ' m/s';
      hudThr.textContent = (ign * 100).toFixed(0).padStart(3, ' ') + ' %';
    }, 160);
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (innerWidth <= 820) {
      running = false;
      mount.style.opacity = '0';
      document.documentElement.classList.add('no-webgl');
    } else if (!running && level !== 2) {
      document.documentElement.classList.remove('no-webgl');
      running = true; mount.style.opacity = '1'; clock.getDelta(); frame();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; }
    else if (level !== 2 && innerWidth > 820) { running = true; clock.getDelta(); frame(); }
  });

  frame();
}
