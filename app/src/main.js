import * as THREE from 'three';
import { buildWorld, groundHeight, SKY } from './world.js';
import { createPeople } from './people.js';
import { createActors } from './actors.js';
import { POIS, TOUR } from './tour.js';

const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 720;
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));   // point de départ ; ajusté ensuite par adaptQuality
renderer.shadowMap.enabled = !mobile;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;   // ombres recalculées une image sur deux (voir frame)

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, 1, 0.2, 4000);
camera.rotation.order = 'YXZ';

// ---------- Ciel et lumière ----------
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vDir; void main(){ float h = clamp(vDir.y,0.0,1.0); gl_FragColor = vec4(mix(horizon, top, pow(h,0.55)),1.0); }',
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 24, 12), skyMat);
scene.add(sky);
scene.fog = new THREE.Fog(0xffffff, 350, 1500);

const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dc, 2.2);
const SUN_DIR = new THREE.Vector3(0.45, 0.8, 0.35).normalize();
sun.castShadow = !mobile;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 1, far: 600 });
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
scene.add(sun, sun.target);

// ---------- État ----------
const state = {
  era: 2050, mode: 'manual', speed: 1,
  pos: new THREE.Vector3(0, 36, 335), yaw: 0, pitch: -0.28,
};
let world = null, people = null;
const actors = createActors(scene, mobile ? 8 : 14);   // personnages animés proches du drone

function setEra(era) {
  state.era = era;
  if (world) { scene.remove(world.group); world.dispose(); }
  if (people) { scene.remove(people.group); people.dispose(); }
  actors.reset();
  world = buildWorld(era, { mobile });
  people = createPeople(era, mobile ? 80 : 180, world.spots);
  scene.add(world.group, people.group);
  const s = SKY[era];
  skyMat.uniforms.top.value.set(s.skyTop);
  skyMat.uniforms.horizon.value.set(s.skyHorizon);
  scene.fog.color.set(s.fog);
  sun.color.set(era === 1950 ? 0xffe6bd : 0xfff4e2);
  canvas.style.filter = era === 1950 ? 'sepia(0.32) contrast(1.04) saturate(0.85)' : 'none';
  document.getElementById('eraLabel').textContent = era;
  setOn('era', 'era', era);
  shownPoi = undefined; // force le rafraîchissement de la bulle
}

// ---------- Commandes ----------
const keys = new Set();
const MOVE_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown', 'ShiftLeft', 'ShiftRight'];
addEventListener('keydown', (e) => {
  if (MOVE_KEYS.includes(e.code)) { e.preventDefault(); if (state.mode !== 'manual') setMode('manual'); }
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  if (state.mode !== 'manual') { if (Math.abs(dx) + Math.abs(dy) < 3) return; setMode('manual'); }
  state.yaw -= dx * 0.0042;
  state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0042, -1.45, 1.2);
});
const endDrag = (e) => { if (drag && drag.id === e.pointerId) drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// Manette tactile
const stick = { x: 0, y: 0, id: null };
const stickEl = document.getElementById('stick'), knob = document.getElementById('knob');
const moveStick = (e) => {
  const r = stickEl.getBoundingClientRect();
  let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  stick.x = x; stick.y = y;
  knob.style.transform = `translate(${x * 35}px, ${y * 35}px)`;
};
stickEl.addEventListener('pointerdown', (e) => { stick.id = e.pointerId; stickEl.setPointerCapture(e.pointerId); if (state.mode !== 'manual') setMode('manual'); moveStick(e); });
stickEl.addEventListener('pointermove', (e) => { if (stick.id === e.pointerId) moveStick(e); });
const endStick = (e) => { if (stick.id === e.pointerId) { stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; } };
stickEl.addEventListener('pointerup', endStick); stickEl.addEventListener('pointercancel', endStick);
let touchVert = 0;
for (const [id, v] of [['tUp', 1], ['tDown', -1]]) {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); touchVert = v; if (state.mode !== 'manual') setMode('manual'); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, () => { touchVert = 0; });
}

// ---------- Interface ----------
const setOn = (group, attr, value) => {
  document.querySelectorAll(`[data-group="${group}"] button`).forEach((b) => b.classList.toggle('on', b.dataset[attr] === String(value)));
};
document.querySelector('[data-group="era"]').addEventListener('click', (e) => {
  const v = e.target.dataset.era; if (!v) return;
  setEra(Number(v));
});
document.querySelector('[data-group="mode"]').addEventListener('click', (e) => { if (e.target.dataset.mode) setMode(e.target.dataset.mode); });
document.querySelector('[data-group="speed"]').addEventListener('click', (e) => {
  const v = e.target.dataset.speed; if (!v) return;
  state.speed = Number(v); setOn('speed', 'speed', v);
});
document.getElementById('btnWalk').addEventListener('click', () => {
  setMode('manual');
  glide = { y: groundHeight(state.pos.x, state.pos.z) + 1.7, pitch: 0 };
});
document.getElementById('btnAir').addEventListener('click', () => {
  setMode('manual');
  glide = { y: groundHeight(state.pos.x, state.pos.z) + 90, pitch: -0.6 };
});
let glide = null;

// ---------- Modes automatiques ----------
const up = (x, h, z) => new THREE.Vector3(x, Math.max(0, groundHeight(x, z)) + h, z);
const tourPos = new THREE.CatmullRomCurve3(TOUR.map((w) => up(w[0], w[1], w[2])), true, 'centripetal');
const tourLook = new THREE.CatmullRomCurve3(TOUR.map((w) => new THREE.Vector3(w[3], w[4], w[5])), true, 'centripetal');
const tourLength = tourPos.getLength();
let tourU = 0;
let flight = null; // vol du mode aléatoire
const tmpLook = new THREE.Vector3();

function lookTarget() {
  return camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(60).add(state.pos);
}
function nextRandomFlight(exclude) {
  const ids = Object.keys(POIS).filter((k) => k !== exclude);
  const id = ids[(Math.random() * ids.length) | 0], poi = POIS[id];
  const end = new THREE.Vector3(...poi.view);
  const start = state.pos.clone();
  const mid = start.clone().lerp(end, 0.5);
  mid.y = Math.max(start.y, end.y, groundHeight(mid.x, mid.z) + 30) + Math.min(60, start.distanceTo(end) * 0.15);
  const curve = new THREE.CatmullRomCurve3([start, mid, end], false, 'centripetal');
  flight = { id, curve, length: curve.getLength(), u: 0, from: lookTarget(), to: new THREE.Vector3(...poi.center), dwell: 0 };
  showPoi(null);
}
function setMode(mode) {
  state.mode = mode; setOn('mode', 'mode', mode); glide = null;
  if (mode === 'tour') {
    // Reprendre le parcours au point le plus proche
    let best = 0, bd = Infinity;
    for (let i = 0; i < 200; i++) { const d = tourPos.getPointAt(i / 200).distanceToSquared(state.pos); if (d < bd) { bd = d; best = i / 200; } }
    tourU = best;
    flight = { curve: new THREE.LineCurve3(state.pos.clone(), tourPos.getPointAt(best)), u: 0, from: lookTarget(), to: tourLook.getPointAt(best), join: true };
    flight.length = Math.max(1, flight.curve.getLength());
  } else if (mode === 'random') nextRandomFlight(null);
  else flight = null;
}
const ease = (t) => t * t * (3 - 2 * t);

// ---------- Collisions ----------
function collide(p) {
  const r = 0.7;
  for (const b of world.boxes) {
    if (p.x < b.x0 - r || p.x > b.x1 + r || p.z < b.z0 - r || p.z > b.z1 + r || p.y < b.y0 - 0.4 || p.y > b.y1 + 0.6) continue;
    const dx0 = p.x - (b.x0 - r), dx1 = b.x1 + r - p.x, dz0 = p.z - (b.z0 - r), dz1 = b.z1 + r - p.z;
    const dyTop = b.y1 + 0.6 - p.y, dyBot = b.y0 > 0.5 ? p.y - (b.y0 - 0.4) : Infinity;
    const m = Math.min(dx0, dx1, dz0, dz1, dyTop, dyBot);
    if (m === dyTop) p.y = b.y1 + 0.6;
    else if (m === dyBot) p.y = b.y0 - 0.4;
    else if (m === dx0) p.x = b.x0 - r;
    else if (m === dx1) p.x = b.x1 + r;
    else if (m === dz0) p.z = b.z0 - r;
    else p.z = b.z1 + r;
  }
}

// ---------- Bulle d'information ----------
const infoEl = document.getElementById('info'), infoTitle = document.getElementById('infoTitle'), infoText = document.getElementById('infoText');
let shownPoi = null;
function showPoi(id) {
  if (id === shownPoi) return;
  shownPoi = id;
  if (!id) { infoEl.hidden = true; return; }
  infoTitle.textContent = POIS[id].name;
  infoText.textContent = POIS[id].text[state.era];
  infoEl.hidden = false;
}
function nearestPoi() {
  let best = null, bd = Infinity;
  for (const [id, p] of Object.entries(POIS)) {
    const d = Math.hypot(state.pos.x - p.center[0], state.pos.z - p.center[2]);
    // Parmi les lieux à portée, le plus précis (plus petit rayon) l'emporte sur le plus général
    if (d < p.radius && p.radius < bd) { bd = p.radius; best = id; }
  }
  return best;
}

// ---------- Boucle ----------
function updateManual(dt) {
  const k = (c) => (keys.has(c) ? 1 : 0);
  const fwd = k('ArrowUp') - k('ArrowDown') - stick.y;
  const turn = k('ArrowRight') - k('ArrowLeft') + stick.x;
  const vert = k('Space') + k('PageUp') - k('ShiftLeft') - k('ShiftRight') - k('PageDown') + touchVert;
  if (fwd || turn || vert) glide = null;
  const ground = Math.max(0, groundHeight(state.pos.x, state.pos.z));
  const alt = state.pos.y - ground;
  const v = 5 * state.speed * (1 + Math.min(alt, 160) / 14);
  state.yaw -= turn * 1.5 * dt;
  state.pos.x -= Math.sin(state.yaw) * fwd * v * dt;
  state.pos.z -= Math.cos(state.yaw) * fwd * v * dt;
  state.pos.y += vert * (3.5 + alt * 0.35) * state.speed * dt;
  if (glide) {
    const a = 1 - Math.exp(-3 * dt);
    state.pos.y += (glide.y - state.pos.y) * a;
    state.pitch += (glide.pitch - state.pitch) * a;
    if (Math.abs(glide.y - state.pos.y) < 0.05) glide = null;
  }
  collide(state.pos);
  state.pos.x = THREE.MathUtils.clamp(state.pos.x, -430, 430);
  state.pos.z = THREE.MathUtils.clamp(state.pos.z, -470, 750);
  const g2 = Math.max(0, groundHeight(state.pos.x, state.pos.z));
  const wasWalking = alt < 2.2 && !vert && !glide;
  state.pos.y = wasWalking ? g2 + 1.7 : THREE.MathUtils.clamp(state.pos.y, g2 + 1.7, 260);
  camera.position.copy(state.pos);
  camera.rotation.set(state.pitch, state.yaw, 0);
}

function updateAuto(dt) {
  if (flight) {
    if (flight.dwell > 0) {
      flight.dwell -= dt * state.speed;
      if (flight.dwell <= 0) nextRandomFlight(flight.id);
    } else {
      flight.u = Math.min(1, flight.u + (16 * state.speed * dt) / flight.length);
      const e = ease(flight.u);
      state.pos.copy(flight.curve.getPointAt(e));
      tmpLook.copy(flight.from).lerp(flight.to, ease(Math.min(1, flight.u * 1.4)));
      camera.position.copy(state.pos); camera.lookAt(tmpLook);
      if (flight.u >= 1) {
        if (flight.join) flight = null;
        else { flight.dwell = 6; showPoi(flight.id); }
      }
    }
  } else if (state.mode === 'tour') {
    tourU = (tourU + (9 * state.speed * dt) / tourLength) % 1;
    state.pos.copy(tourPos.getPointAt(tourU));
    camera.position.copy(state.pos); camera.lookAt(tourLook.getPointAt(tourU));
    // Lieu du point de passage le plus proche
    let best = 0, bd = Infinity;
    for (let i = 0; i < TOUR.length; i++) { const w = TOUR[i]; const d = (w[0] - state.pos.x) ** 2 + (w[2] - state.pos.z) ** 2; if (d < bd) { bd = d; best = i; } }
    showPoi(TOUR[best][6]);
  }
  state.yaw = camera.rotation.y; state.pitch = camera.rotation.x;
}

const altEl = document.getElementById('alt');
const clock = new THREE.Clock();
let uiTimer = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  if (state.mode === 'manual') updateManual(dt); else updateAuto(dt);
  world.update(dt); people.update(dt);
  actors.sync(people.list, state.pos, dt);
  sky.position.copy(camera.position);
  sun.target.position.set(Math.round(state.pos.x / 20) * 20, 0, Math.round(state.pos.z / 20) * 20);
  sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 300);
  uiTimer -= dt;
  if (uiTimer <= 0) {
    uiTimer = 0.25;
    altEl.textContent = `Altitude ${Math.round(state.pos.y - Math.max(0, groundHeight(state.pos.x, state.pos.z)))} m`;
    if (state.mode === 'manual') showPoi(nearestPoi());
  }
  frameNo++;
  if (frameNo % 2 === 0) renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  adaptQuality(dt);
  requestAnimationFrame(frame);
}

// Résolution adaptative : la fluidité passe avant la finesse. Si l'affichage
// descend sous 42 images/s, on dessine moins de pixels ; s'il tient 58 images/s
// pendant trois secondes, on en redonne.
const MAX_RATIO = Math.min(devicePixelRatio, mobile ? 1.5 : 2), MIN_RATIO = 0.5;
let frameNo = 0, ratio = Math.min(MAX_RATIO, 1.25), qTime = 0, qFrames = 0, steady = 0;
function adaptQuality(dt) {
  qTime += dt; qFrames++;
  if (qTime < 1) return;
  const fps = qFrames / qTime; qTime = 0; qFrames = 0;
  let next = ratio;
  if (fps < 42) { next = Math.max(MIN_RATIO, ratio * (fps < 28 ? 0.75 : 0.88)); steady = 0; }
  else if (fps > 58) { if (++steady >= 3) { next = Math.min(MAX_RATIO, ratio * 1.1); steady = 0; } }
  else steady = 0;
  if (Math.abs(next - ratio) > 0.01) { ratio = next; renderer.setPixelRatio(ratio); renderer.setSize(innerWidth, innerHeight, false); }
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
setEra(2050);
frame();

// Accès de test depuis la console
window.__visite = { state, setEra, setMode, camera, actors, tourPos, renderer, get world() { return world; } };
