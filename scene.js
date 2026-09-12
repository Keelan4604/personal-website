/* =====================================================================
   Hero scene: procedural Starship-class launch vehicle in Three.js.
   Scroll-driven: sits on the pad, ignites, climbs through the atmosphere,
   coasts above the Earth's limb, then fades out as content takes over.
   ===================================================================== */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const mount = document.getElementById('scene');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 820px)').matches;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (!mount || !supportsWebGL()) {
  document.documentElement.classList.add('no-webgl');
} else {
  init();
}

function init() {
  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060d, 0.011);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 4000);
  camera.position.set(14, 6, 26);

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0x9fb8ff, 0x1a1030, 0.9);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(18, 22, 14);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x22d3ee, 2.4);
  rim.position.set(-20, 8, -14);
  scene.add(rim);
  const fill = new THREE.PointLight(0xa78bfa, 30, 80, 2);
  fill.position.set(-8, 4, 10);
  scene.add(fill);
  const engineLight = new THREE.PointLight(0xff7a1a, 0, 60, 2);
  engineLight.position.set(0, -1.5, 0);
  scene.add(engineLight);

  /* ---------- materials ---------- */
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.95, roughness: 0.32 });
  const tiles = new THREE.MeshStandardMaterial({ color: 0x12141c, metalness: 0.6, roughness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2f3d, metalness: 0.7, roughness: 0.5 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4d, metalness: 0.85, roughness: 0.35 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });

  /* ---------- vehicle ---------- */
  const rocket = new THREE.Group();
  scene.add(rocket);

  // Body + ogive nose as one lathe profile. Radius 1, body height 8, nose 4.
  const profile = [];
  profile.push(new THREE.Vector2(0.72, 0));
  profile.push(new THREE.Vector2(1.0, 0.25));
  for (let y = 0.25; y <= 8; y += 0.5) profile.push(new THREE.Vector2(1.0, y));
  const noseH = 4.2;
  for (let i = 1; i <= 18; i++) {
    const t = i / 18;
    // tangent ogive-ish curve
    const r = Math.sqrt(1 - t * t) * 0.92 + (1 - t) * 0.08;
    profile.push(new THREE.Vector2(Math.max(r, 0.001), 8 + t * noseH));
  }
  profile.push(new THREE.Vector2(0, 8 + noseH));
  const bodyGeo = new THREE.LatheGeometry(profile, 72);
  const body = new THREE.Mesh(bodyGeo, steel);
  rocket.add(body);

  // heat-shield tile band on one half
  const tileGeo = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p.x * 1.012, p.y)), 48, Math.PI * 0.55, Math.PI * 0.9);
  const tileMesh = new THREE.Mesh(tileGeo, tiles);
  rocket.add(tileMesh);

  // weld-ring seams for scale
  const seamGeo = new THREE.TorusGeometry(1.008, 0.012, 8, 72);
  for (let y = 1.2; y < 8; y += 1.15) {
    const s = new THREE.Mesh(seamGeo, dark);
    s.rotation.x = Math.PI / 2;
    s.position.y = y;
    rocket.add(s);
  }

  // flaps
  function flap(w, h, thick, y, side, forward) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, forward ? h * 0.25 : h * 0.1);
    shape.lineTo(w, h);
    shape.lineTo(0, h);
    shape.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
    const m = new THREE.Mesh(geo, tiles);
    m.position.set(side * 0.98, y, -thick / 2);
    if (side < 0) { m.rotation.y = Math.PI; m.position.z = thick / 2; }
    return m;
  }
  rocket.add(flap(1.6, 2.6, 0.12, 0.9, 1, false));
  rocket.add(flap(1.6, 2.6, 0.12, 0.9, -1, false));
  rocket.add(flap(0.9, 1.6, 0.1, 8.6, 1, true));
  rocket.add(flap(0.9, 1.6, 0.1, 8.6, -1, true));

  // engines
  const engines = new THREE.Group();
  const nozzleGeo = new THREE.CylinderGeometry(0.22, 0.34, 0.6, 24, 1, true);
  const throatGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 24);
  const engineGlowGeo = new THREE.CylinderGeometry(0.3, 0.02, 1.1, 20, 1, true);
  const enginePositions = [];
  const ringR = 0.55;
  enginePositions.push([0, 0]);
  for (let i = 0; i < 6; i++) enginePositions.push([Math.cos(i / 6 * Math.PI * 2) * ringR, Math.sin(i / 6 * Math.PI * 2) * ringR]);
  const engineGlows = [];
  enginePositions.forEach(([x, z]) => {
    const n = new THREE.Mesh(nozzleGeo, nozzleMat);
    n.position.set(x, -0.3, z);
    engines.add(n);
    const t = new THREE.Mesh(throatGeo, dark);
    t.position.set(x, 0.1, z);
    engines.add(t);
    const g = new THREE.Mesh(engineGlowGeo, glowMat.clone());
    g.position.set(x, -1.0, z);
    g.rotation.x = Math.PI;
    engines.add(g);
    engineGlows.push(g);
  });
  rocket.add(engines);

  // plume core (long additive cone) + halo sprite
  const plumeGeo = new THREE.CylinderGeometry(0.55, 0.05, 9, 28, 1, true);
  const plumeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vPos;
      void main(){ vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uPower; varying vec2 vUv; varying vec3 vPos;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float y = vUv.y;               // 1 at wide end (engine), 0 at tip
        float n = noise(vec2(vUv.x*6.0, y*4.0 - uTime*6.0));
        float n2 = noise(vec2(vUv.x*14.0+3.0, y*9.0 - uTime*11.0));
        float core = smoothstep(0.0, 0.9, y) * (0.55 + 0.45*n) ;
        float flick = 0.85 + 0.15*n2;
        vec3 c1 = vec3(1.0, 0.95, 0.75);
        vec3 c2 = vec3(1.0, 0.45, 0.08);
        vec3 c3 = vec3(0.55, 0.2, 0.9);
        vec3 col = mix(c3, c2, smoothstep(0.0, 0.5, y));
        col = mix(col, c1, smoothstep(0.55, 1.0, y));
        float a = core * flick * uPower;
        a *= smoothstep(0.0, 0.08, y);
        gl_FragColor = vec4(col * (1.2 + 0.8*uPower), a);
      }`
  });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.position.y = -4.6;
  plume.rotation.x = Math.PI;
  rocket.add(plume);

  // exhaust particles
  const pCount = isMobile ? 500 : 1400;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pLife = new Float32Array(pCount);
  const pSeed = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) { pLife[i] = Math.random(); pSeed[i] = Math.random(); }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aLife', new THREE.BufferAttribute(pLife, 1));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPower: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float aLife; attribute float aSeed; uniform float uPower; uniform float uPR;
      varying float vLife; varying float vSeed;
      void main(){ vLife = aLife; vSeed = aSeed;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float s = (1.0 - aLife) * (6.0 + aSeed*10.0) * uPR;
        gl_PointSize = s * (40.0 / -mv.z) * (0.4 + 0.6*uPower);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform float uPower; varying float vLife; varying float vSeed;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d);
        float a = smoothstep(0.5, 0.0, r) * (1.0 - vLife) * uPower;
        vec3 hot = vec3(1.0, 0.85, 0.5); vec3 cool = vec3(1.0, 0.35, 0.05); vec3 smoke = vec3(0.6, 0.55, 0.7);
        vec3 col = mix(hot, cool, smoothstep(0.0, 0.4, vLife)); col = mix(col, smoke, smoothstep(0.4, 1.0, vLife));
        gl_FragColor = vec4(col, a * 0.9); }`
  });
  const particles = new THREE.Points(pGeo, pMat);
  rocket.add(particles);

  /* ---------- pad ---------- */
  const pad = new THREE.Group();
  const padDisc = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.35, 64), new THREE.MeshStandardMaterial({ color: 0x1a1e2c, metalness: 0.4, roughness: 0.8 }));
  padDisc.position.y = -0.9;
  pad.add(padDisc);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 });
  [2.2, 3.1, 4.0].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.02, r, 96), ringMat.clone());
    ring.material.opacity = 0.5 - i * 0.12;
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.71;
    pad.add(ring);
  });
  // launch mount arms
  const armGeo = new THREE.BoxGeometry(0.16, 0.16, 1.4);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const arm = new THREE.Mesh(armGeo, dark);
    arm.position.set(Math.cos(a) * 1.6, -0.55, Math.sin(a) * 1.6);
    arm.rotation.y = -a;
    pad.add(arm);
  }
  // tower
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 14, 0.7), new THREE.MeshStandardMaterial({ color: 0x1f2333, metalness: 0.5, roughness: 0.7 }));
  tower.position.set(-3.6, 6.1, -1.2);
  pad.add(tower);
  const towerLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b3b }));
  towerLight.position.set(-3.6, 13.2, -1.2);
  pad.add(towerLight);
  // ground grid
  const grid = new THREE.GridHelper(120, 60, 0x22d3ee, 0x22d3ee);
  grid.material.transparent = true;
  grid.material.opacity = 0.05;
  grid.position.y = -1.08;
  pad.add(grid);
  const groundFog = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x05060d, transparent: true, opacity: 0.0 }));
  groundFog.rotation.x = -Math.PI / 2;
  groundFog.position.y = -1.1;
  pad.add(groundFog);
  scene.add(pad);

  /* ---------- stars ---------- */
  const starCount = isMobile ? 900 : 2200;
  const sGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(starCount * 3);
  const sSize = new Float32Array(starCount);
  const sHue = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const r = 220 + Math.random() * 500;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    sPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    sPos[i * 3 + 2] = r * Math.cos(ph);
    sSize[i] = 0.6 + Math.random() * 2.2;
    sHue[i] = Math.random();
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
  sGeo.setAttribute('aHue', new THREE.BufferAttribute(sHue, 1));
  const sMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uStretch: { value: 0 } },
    vertexShader: `
      attribute float aSize; attribute float aHue; uniform float uTime; uniform float uPR; uniform float uStretch;
      varying float vHue; varying float vTw;
      void main(){ vHue = aHue; vTw = 0.6 + 0.4*sin(uTime*(1.0+aHue*2.0) + aHue*40.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPR * (1.0 + uStretch*2.5);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying float vHue; varying float vTw;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d);
        float a = smoothstep(0.5, 0.05, r) * vTw;
        vec3 c = mix(vec3(0.75,0.85,1.0), vec3(1.0,0.85,0.7), step(0.8, vHue));
        c = mix(c, vec3(0.6,0.9,1.0), step(0.6, vHue) * (1.0-step(0.8,vHue)));
        gl_FragColor = vec4(c, a); }`
  });
  const stars = new THREE.Points(sGeo, sMat);
  scene.add(stars);

  /* ---------- earth ---------- */
  const earth = new THREE.Group();
  const earthR = 140;
  const earthMat = new THREE.ShaderMaterial({
    uniforms: { uLightDir: { value: new THREE.Vector3(0.6, 0.5, 0.6).normalize() }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vP = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `
      uniform vec3 uLightDir; uniform float uTime; varying vec3 vN; varying vec3 vP;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float noise(vec3 p){ vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.0-2.0*f);
        float n = mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        return n; }
      float fbm(vec3 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.1; a*=0.5;} return v; }
      void main(){
        vec3 n = normalize(vN);
        float land = smoothstep(0.48, 0.56, fbm(vP*0.03));
        vec3 ocean = vec3(0.05, 0.28, 0.75); vec3 ground = vec3(0.16, 0.45, 0.22);
        vec3 col = mix(ocean, ground, land);
        float cloud = smoothstep(0.55, 0.7, fbm(vP*0.05 + vec3(uTime*0.02, 0.0, 0.0)));
        col = mix(col, vec3(0.95), cloud*0.8);
        float diff = clamp(dot(n, uLightDir), 0.0, 1.0);
        float rimf = pow(1.0 - clamp(dot(n, vec3(0.0,0.0,1.0)), 0.0, 1.0), 3.0);
        col = col * (0.06 + diff*0.55) + vec3(0.3,0.6,1.0)*rimf*0.45;
        gl_FragColor = vec4(col, 1.0); }`
  });
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(earthR, 96, 96), earthMat);
  earth.add(earthMesh);
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(vec3(0.35,0.7,1.0)*f*0.8, f*0.6); }`
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(earthR * 1.045, 96, 96), atmoMat);
  earth.add(atmo);
  earth.position.set(60, -earthR - 30, -140);
  earth.visible = false;
  scene.add(earth);

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.85, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- scroll state ---------- */
  const state = { p: 0, target: 0, vel: 0, mx: 0, my: 0, smx: 0, smy: 0, fade: 1 };
  const flightSpan = () => Math.max(window.innerHeight * 2.2, 1200);

  window.addEventListener('scroll', () => {
    state.target = THREE.MathUtils.clamp(window.scrollY / flightSpan(), 0, 1);
  }, { passive: true });
  window.addEventListener('mousemove', (e) => {
    state.mx = (e.clientX / window.innerWidth - 0.5) * 2;
    state.my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function ease(a, b, t) { return a + (b - a) * THREE.MathUtils.smoothstep(t, 0, 1); }
  function seg(p, a, b) { return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1); }

  const heroOffsetX = () => (window.innerWidth > 1080 ? 5.5 : window.innerWidth > 820 ? 4.5 : 3.2);
  const heroDist = () => (window.innerWidth > 1080 ? 26 : window.innerWidth > 820 ? 34 : 40);
  const lookShift = () => (window.innerWidth > 1080 ? 4.2 : window.innerWidth > 820 ? 2.5 : 0);

  const clock = new THREE.Clock();
  let lastP = 0;

  function frame() {
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta() || 0.016, 0.05);

    // smooth scroll progress
    state.p += (state.target - state.p) * 0.08;
    state.vel = (state.p - lastP);
    lastP = state.p;
    state.smx += (state.mx - state.smx) * 0.05;
    state.smy += (state.my - state.smy) * 0.05;

    const p = reduced ? 0 : state.p;

    // choreography
    const ignition = seg(p, 0.06, 0.22);        // engines light
    const lift = seg(p, 0.16, 0.85);            // climb
    const coast = seg(p, 0.82, 1.0);            // engine cut + pitch
    const power = Math.min(ignition, 1 - coast * 0.9);

    const altitude = Math.pow(lift, 1.6) * 260;
    rocket.position.y = altitude + (p < 0.1 ? Math.sin(t * 0.8) * 0.03 : 0);
    rocket.position.x = heroOffsetX() + Math.pow(lift, 2) * 4;
    rocket.rotation.z = -Math.pow(lift, 1.4) * 0.55 - coast * 0.25;
    rocket.rotation.y = t * 0.08 + lift * 1.2;
    rocket.rotation.x = Math.sin(t * 0.5) * 0.01 * (1 - lift);

    // pad recedes
    pad.position.x = heroOffsetX();
    pad.visible = lift < 0.999;
    groundFog.material.opacity = lift * 0.9;

    // camera: track the rocket with lag, pull back as it climbs
    const camDist = ease(heroDist(), 60, lift) + coast * 12;
    const camY = rocket.position.y + ease(5.5, 16, lift) - coast * 6;
    const orbit = lift * 1.15 + coast * 0.4 + state.smx * 0.12;
    camera.position.x = rocket.position.x + Math.sin(orbit) * camDist * 0.55 + 14 * (1 - lift);
    camera.position.z = Math.cos(orbit) * camDist;
    camera.position.y = camY + state.smy * -1.2;
    camera.lookAt(rocket.position.x - lookShift() * (1 - lift), rocket.position.y + ease(5, 4, lift) + coast * 2, 0);

    // engines
    plumeMat.uniforms.uTime.value = t;
    plumeMat.uniforms.uPower.value = power;
    pMat.uniforms.uPower.value = power;
    engineLight.intensity = power * 260 * (0.85 + 0.15 * Math.sin(t * 60));
    engineLight.position.set(rocket.position.x, rocket.position.y - 2.5, 0);
    engineGlows.forEach((g, i) => { g.material.opacity = power * (0.55 + 0.35 * Math.sin(t * 40 + i)); });
    plume.scale.set(1 + power * 0.25, 0.4 + power * 1.0 + lift * 0.9, 1 + power * 0.25);

    // particles: advance along -y in rocket space with spread
    const pos = pGeo.attributes.position.array;
    const life = pGeo.attributes.aLife.array;
    for (let i = 0; i < pCount; i++) {
      life[i] += dt * (0.9 + pSeed[i] * 0.8) * (0.3 + power);
      if (life[i] > 1) {
        life[i] = 0;
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.6;
        pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -0.4; pos[i * 3 + 2] = Math.sin(a) * r;
      }
      const l = life[i];
      pos[i * 3 + 1] -= dt * (14 + pSeed[i] * 10) * (0.2 + power);
      pos[i * 3] += (pos[i * 3] > 0 ? 1 : -1) * dt * (0.4 + l * 2.2) * 0.9;
      pos[i * 3 + 2] += (pos[i * 3 + 2] > 0 ? 1 : -1) * dt * (0.4 + l * 2.2) * 0.9;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.aLife.needsUpdate = true;

    // stars: subtle drift + streak when moving fast
    sMat.uniforms.uTime.value = t;
    sMat.uniforms.uStretch.value = THREE.MathUtils.clamp(Math.abs(state.vel) * 60, 0, 1);
    stars.rotation.y = t * 0.004 + lift * 0.3;
    stars.rotation.x = -lift * 0.25;
    stars.position.y = rocket.position.y * 0.85;

    // earth reveals on climb
    earth.visible = lift > 0.25;
    earthMat.uniforms.uTime.value = t;
    earth.position.set(rocket.position.x + 110 - lift * 50, rocket.position.y - earthR - 70 + lift * 60, -220 + lift * 30);
    earth.rotation.y = t * 0.01;

    // bloom breathes with the engines
    bloom.strength = 0.45 + power * 0.55;

    // hide scene as content takes over
    const fadeStart = flightSpan() * (isMobile ? 0.5 : 0.62);
    const fadeEnd = flightSpan() * 0.98;
    const f = 1 - THREE.MathUtils.clamp((window.scrollY - fadeStart) / (fadeEnd - fadeStart), 0, 1);
    const base = isMobile ? 0.5 : 1;
    if (Math.abs(f - state.fade) > 0.002) { state.fade = f; mount.style.opacity = (f * base).toFixed(3); }

    if (f > 0.001) composer.render();
    requestAnimationFrame(frame);
  }

  // HUD hooks
  const hudAlt = document.getElementById('hud-alt');
  const hudVel = document.getElementById('hud-vel');
  const hudThr = document.getElementById('hud-thr');
  setInterval(() => {
    if (!hudAlt) return;
    const p = state.p;
    const lift = seg(p, 0.16, 0.85);
    const ignition = seg(p, 0.06, 0.22);
    const coast = seg(p, 0.82, 1.0);
    const alt = Math.pow(lift, 1.6) * 120;
    hudAlt.textContent = alt.toFixed(1).padStart(6, ' ') + ' km';
    hudVel.textContent = (Math.pow(lift, 1.3) * 2400 + ignition * 40).toFixed(0).padStart(5, ' ') + ' m/s';
    hudThr.textContent = (Math.min(ignition, 1 - coast * 0.9) * 100).toFixed(0).padStart(3, ' ') + ' %';
  }, 120);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) clock.getDelta(); });

  frame();
}
