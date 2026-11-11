// Quartier d'Analakely — géométrie construite par code.
// Plan calé sur OpenStreetMap (data/osm/convert.mjs). Repère : z le long de l'axe
// gare -> marché (l'avenue de l'Indépendance va de z = -285 à z = 269), x
// perpendiculaire, positif à gauche en regardant vers le marché (nord-est).
// Gare z ≈ -357 ; Mairie à gauche, z -56 à 18 ; avenue du 26 Juin de z 300 à 610 ;
// marché et pavillons à gauche, x 15 à 175, z 318 à 586 ; escalier
// d'Antaninarenina de (-12, 392) à (-134, 461) ; escalier d'Ambondrona de
// (194, 313) à (325, 252). Ambohijatovo est en réalité à z > 840 : il est
// rapproché ici (z 650 à 740).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import STREETS from './streets.json';

// Découpe utile de l'image du pavillon : [décalage x, décalage y, largeur, hauteur] en fractions.
const PAV_CROP = [0, 0, 1, 1];
const HALL_CROP = [0, 0, 2, 1]; // l'image est répétée deux fois sur la longueur de la halle
THREE.Cache.enabled = true;
const imageLoader = new THREE.TextureLoader();
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export const PLATEAU_H = 42;

// Entrées de tunnel : `at` = position du portail, `from` = début de la rampe d'accès.
// Ambohidahy est à sa position réelle. Ambanidia est en réalité bien plus loin
// (au-delà d'Ambohijatovo) : il est rapproché ici, comme le jardin.
export const TUNNELS = [
  { name: "Tunnel d'Ambohidahy", from: [-10, 676], at: [-80, 700] },
  { name: "Tunnel d'Ambanidia", from: [44, 648], at: [70, 742] },
];
function segDist(x, z, ax, az, bx, bz) {
  const t = clamp01(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2));
  return Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az));
}

// Grands escaliers, tracés d'après la carte : volées d'une vingtaine de marches
// séparées par des paliers plats.
export const STAIRS = {
  west: { x0: -12, z0: 392, x1: -134, z1: 461, total: PLATEAU_H },   // Antaninarenina
  east: { x0: 194, z0: 313, x1: 325, z1: 252, total: 36 },           // Ambondrona
};
for (const st of Object.values(STAIRS)) {
  st.run = Math.hypot(st.x1 - st.x0, st.z1 - st.z0);
  st.ux = (st.x1 - st.x0) / st.run; st.uz = (st.z1 - st.z0) / st.run;
}
// [distance le long de l'escalier, écart latéral] d'un point.
export function stairCoords(x, z, st) {
  const dx = x - st.x0, dz = z - st.z0;
  return [dx * st.ux + dz * st.uz, Math.abs(dx * st.uz - dz * st.ux)];
}
export const stairPoint = (st, d, lat = 0) => [st.x0 + st.ux * d - st.uz * lat, st.z0 + st.uz * d + st.ux * lat];
const LANDING = 4, FLIGHT = 20;
function stairLayout({ run, total }) {
  const flights = Math.max(1, Math.round(total / 0.25 / FLIGHT));
  const n = flights * FLIGHT, rise = total / n;
  const stepRun = (run - (flights - 1) * LANDING) / n;
  return { flights, rise, stepRun, period: FLIGHT * stepRun + LANDING };
}
// Hauteur de l'escalier à la distance d de son pied.
function stairHeight(d, st) {
  const L = stairLayout(st);
  if (d <= 0) return 0;
  const k = Math.floor(d / L.period), r = d - k * L.period;
  if (k >= L.flights) return st.total;
  return (k * FLIGHT + Math.min(FLIGHT, r / L.stepRun)) * L.rise;
}

export function groundHeight(x, z) {
  for (const st of [STAIRS.west, STAIRS.east]) {
    const [d, lat] = stairCoords(x, z, st);
    if (lat <= 6.2 && d >= 0 && d <= st.run) return stairHeight(d, st);
  }
  // Les collines n'existent qu'au sud, face aux pavillons et en haut des escaliers.
  // Derrière les arcades, la ville est plate.
  const west = clamp01((-x - 14) / 122) * PLATEAU_H * smooth(300, 350, z);
  const east = clamp01((x - 188) / 135) * 36 * smooth(170, 235, z);
  const south = smooth(625, 760, z) * 14;
  let h = Math.max(west, east, south);
  // Tranchées d'accès aux tunnels, creusées dans la colline
  for (const t of TUNNELS) h *= smooth(9, 20, segDist(x, z, t.from[0], t.from[1], t.at[0], t.at[1]));
  return h;
}

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

const PAL = {
  1950: {
    wall: '#dccdaa', wallDark: '#c9b88f', shutter: '#8a3226', band: '#b5683f', roof: 0x86563a,
    road: '#8f8272', roadLine: '#7d7163', lawn: 0x71894a, stone: 0xb9ab93, stoneDark: 0x9a8c76,
    hill: [0.52, 0.5, 0.33], earth: [0.6, 0.47, 0.36], town: [0.62, 0.57, 0.5],
    skyTop: 0x8fb0cf, skyHorizon: 0xe9dcc2, fog: 0xe3d8c2,
  },
  2050: {
    wall: '#f3e9d2', wallDark: '#e6d8b8', shutter: '#b23a2b', band: '#c9774a', roof: 0xa5633f,
    road: '#5a5a5c', roadLine: '#4b4b4d', lawn: 0x5fa04a, stone: 0xcdc1aa, stoneDark: 0xab9f89,
    hill: [0.36, 0.56, 0.3], earth: [0.66, 0.5, 0.38], town: [0.78, 0.74, 0.66],
    skyTop: 0x3f86d6, skyHorizon: 0xd6e8f5, fog: 0xd3e3f0,
  },
};

export const SKY = { 1950: PAL[1950], 2050: PAL[2050] };

// Tronçons d'immeubles à arcades, séparés par les rues transversales.
// Les coupures correspondent aux rues réelles qui débouchent sur l'avenue
// (z = -149, -64, -35, 20, 113, 245). À gauche, la Mairie occupe z -56 à 18.
const arc = (side, front, list) => list.map(([z0, z1]) => ({ side, front, z0, z1 }));
const ARCADES = [
  ...arc(1, 32, [[-279, -69], [27, 107], [119, 245], [257, 281]]),
  ...arc(-1, 32, [[-279, -155], [-143, -70], [-58, -41], [-29, 14], [26, 107], [119, 239]]),
  ...arc(-1, 10, [[251, 299]]),                 // angle de l'avenue (hôtel Le Glacier)
  ...arc(-1, 12, [[305, 371], [413, 599]]),     // côté droit de l'avenue du 26 Juin
];
// Parterres du jardin central, entre les rues transversales
const GARDEN = [[-279, -155], [-143, -70], [-58, 14], [26, 107], [119, 239]];
const BAY = 6;
const FRONT = 32;   // façade des arcades
const GALLERY = 4;  // profondeur de la galerie couverte
const DEPTH = 14;   // profondeur totale de l'immeuble

export function buildWorld(era, { mobile = false } = {}) {
  const P = PAL[era];
  const g = new THREE.Group();
  const boxes = [];   // collisions : {x0,x1,z0,z1,y0,y1}
  const movers = [];
  const R = rng(era === 1950 ? 11 : 7);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  const lam = (color, map) => new THREE.MeshLambertMaterial(map ? { color, map } : { color });
  const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; g.add(m); return m; };
  const box = (w, h, d, x, y, z, material, cast = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y + h / 2, z);
    return add(m, cast);
  };
  const solid = (x0, x1, z0, z1, y0, y1) => boxes.push({
    x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1,
  });
  // list : [{x,y,z,sx,sy,sz,ry,color}]
  const instanced = (geo, material, list, cast = true) => {
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, material, list.length);
    list.forEach((o, i) => {
      dummy.position.set(o.x, o.y, o.z);
      dummy.rotation.set(0, o.ry || 0, 0);
      dummy.scale.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (o.color !== undefined) m.setColorAt(i, col.set(o.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    return add(m, cast);
  };

  // ---------- Textures procédurales (remplacées plus tard par les images générées) ----------
  const facadeTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = P.wall; c.fillRect(0, 0, w, h);
    if (era === 1950) {
      for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(90,70,40,${0.03 + 0.05 * R()})`; c.fillRect(R() * w, R() * h, 4 + R() * 30, 20 + R() * 80); }
    }
    c.fillStyle = P.band; c.fillRect(0, h - 10, w, 10); c.fillRect(0, h / 2 - 5, w, 8);
    for (let f = 0; f < 2; f++) for (let k = 0; k < 2; k++) {
      const x = 64 + k * 128, y = 22 + f * 128;
      c.fillStyle = '#2b2622'; c.fillRect(x - 20, y, 40, 78);
      c.fillStyle = P.shutter; c.fillRect(x - 38, y, 17, 78); c.fillRect(x + 21, y, 17, 78);
      c.fillStyle = 'rgba(0,0,0,.25)';
      for (let s = 0; s < 9; s++) { c.fillRect(x - 38, y + 4 + s * 8, 17, 2); c.fillRect(x + 21, y + 4 + s * 8, 17, 2); }
      c.fillStyle = P.wallDark; c.fillRect(x - 42, y + 80, 84, 8);
    }
  });
  const shopTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = P.wallDark; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2a2420'; c.fillRect(14, 34, 100, 94);
    c.fillStyle = era === 1950 ? '#5d6b4d' : '#c9774a'; c.fillRect(8, 22, 112, 14);
    c.fillStyle = 'rgba(255,240,200,.18)'; c.fillRect(20, 44, 40, 60);
  });
  const pavilionTex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = P.wall; c.fillRect(0, 0, w, h);
    c.fillStyle = P.band; c.fillRect(0, 0, w, 12);
    for (let k = 0; k < 3; k++) {
      const x = 44 + k * 84;
      c.fillStyle = P.shutter;
      c.beginPath(); c.moveTo(x - 26, h); c.lineTo(x - 26, 54); c.arc(x, 54, 26, Math.PI, 0); c.lineTo(x + 26, h); c.fill();
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x - 1, 30, 2, h);
    }
  });
  const roadTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = P.road; c.fillRect(0, 0, w, h);
    if (era === 2050) {
      // Pavés de granit gris foncé, pose à joints décalés
      for (let r = 0; r < 8; r++) for (let k = -1; k < 4; k++) {
        const v = 104 + R() * 24 | 0;
        c.fillStyle = `rgb(${v + 2},${v + 1},${v})`;
        c.fillRect(k * 64 + (r % 2) * 32 + 1, r * 32 + 1, 62, 30);
      }
      for (let i = 0; i < 1200; i++) { c.fillStyle = `rgba(${R() > .5 ? '255,255,255' : '0,0,0'},${0.05 * R()})`; c.fillRect(R() * w, R() * h, 2, 2); }
    } else {
      for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${R() > .5 ? '60,50,40' : '200,185,160'},${0.05 + 0.08 * R()})`; c.fillRect(R() * w, R() * h, 2 + R() * 5, 2 + R() * 5); }
    }
  }, 16, 232);
  const cobbleTex = canvasTex(128, 128, (c, w, h) => {
    // Dalles de granit gris foncé
    c.fillStyle = '#4b4b4d'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let k = -1; k < 4; k++) {
      const v = 92 + R() * 26 | 0;
      c.fillStyle = `rgb(${v + 2},${v + 1},${v})`;
      c.fillRect(k * 32 + (r % 2) * 16 + 1, r * 32 + 1, 30, 30);
    }
    for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(${R() > .5 ? '255,255,255' : '0,0,0'},${0.05 * R()})`; c.fillRect(R() * w, R() * h, 2, 2); }
  }, 1, 4);

  // Dallage clair des allées piétonnes aménagées, et mobilier associé
  const pedTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#b9b3a6'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) for (let k = -1; k < 4; k++) {
      const v = 196 + R() * 24 | 0;
      c.fillStyle = `rgb(${v},${v - 5},${v - 16})`;
      c.fillRect(k * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14);
    }
    c.fillStyle = 'rgba(120,96,70,.5)'; c.fillRect(0, 0, 5, h); c.fillRect(w - 5, 0, 5, h);   // bordures
  });
  const lamps = [], benches = [];
  const M = {
    facade: lam(0xffffff, facadeTex), shop: lam(0xffffff, shopTex), pavilion: lam(0xffffff, pavilionTex),
    roof: lam(P.roof), stone: lam(P.stone), stoneDark: lam(P.stoneDark), wall: lam(new THREE.Color(P.wall)),
    road: lam(0xffffff, roadTex), lawn: lam(P.lawn), cobble: lam(0xffffff, cobbleTex),
    iron: lam(0x3f4a48), white: lam(0xf4f1e8), slate: lam(0x5b6168), water: lam(0x6fb6d6),
    teal: lam(0x2f8f86), wood: lam(0x8a6a48), dark: lam(0x24211e),
  };

  // Images générées : remplacent la texture dessinée par code dès qu'elles sont chargées.
  const useImage = (material, url, setup) => {
    imageLoader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      setup(t);
      material.map = t;
      material.color.set(era === 1950 ? 0xe6dcc6 : 0xffffff);
      material.needsUpdate = true;
    }, undefined, () => {});
  };
  // Façade : une travée (une fenêtre) des deux étages, découpée dans l'image.
  useImage(M.facade, '/textures/facade.png', (t) => { t.offset.set(395 / 1376, 0.479); t.repeat.set(290 / 1376, 0.521); });
  // Halles du marché (style 1) : texture dessinée, remplacée si une image existe.
  M.hall = lam(0xffffff, canvasTex(1024, 192, (c, w, h) => {
    c.fillStyle = P.wall; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2f4a57'; c.fillRect(0, 0, w, 40);
    for (let k = 0; k < 8; k++) { c.fillStyle = P.wallDark; c.fillRect(14 + k * 128, 6, 100, 28); }
    c.fillStyle = '#8f8a80'; c.fillRect(0, h - 22, w, 22);
    for (let k = 0; k < 8; k++) {
      const x = 22 + k * 128;
      c.fillStyle = P.shutter; c.fillRect(x, 52, 84, h - 74);
      c.fillStyle = '#f1ece0';
      for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) c.fillRect(x + 7 + i * 38, 58 + j * 27, 32, 22);
    }
  }));
  M.roofTile = lam(0xffffff, canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#' + new THREE.Color(P.roof).getHexString(); c.fillRect(0, 0, w, h);
    for (let r = 0; r < 16; r++) {
      c.fillStyle = `rgba(0,0,0,${0.10 + 0.08 * R()})`; c.fillRect(0, r * 8, w, 2);
      for (let k = 0; k < 16; k++) { c.fillStyle = `rgba(${R() > .5 ? '255,220,180' : '60,30,20'},${0.08 * R()})`; c.fillRect(k * 8 + (r % 2) * 4, r * 8, 8, 8); }
    }
  }, 3, 3));
  useImage(M.hall, '/textures/halle.png', (t) => { t.offset.set(HALL_CROP[0], HALL_CROP[1]); t.repeat.set(HALL_CROP[2], HALL_CROP[3]); });
  // Gare : mur d'une aile (portes à volets, frise) et balustrade, découpés dans la même image.
  M.gare = lam(P.stone); M.balustrade = lam(P.stone);
  useImage(M.gare, '/textures/gare.png', (t) => { t.offset.set(0.035, 0.07); t.repeat.set(0.931, 0.692); });
  useImage(M.balustrade, '/textures/gare.png', (t) => { t.offset.set(0.035, 0.762); t.repeat.set(0.931, 0.19); });
  useImage(M.pavilion, '/textures/pavillon.png', (t) => { t.offset.set(PAV_CROP[0], PAV_CROP[1]); t.repeat.set(PAV_CROP[2], PAV_CROP[3]); });

  // ---------- Terrain ----------
  {
    const geo = new THREE.PlaneGeometry(900, 1260, 180, 252);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, 140);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      let h = groundHeight(x, z);
      const paved = (Math.abs(x) <= 50 && z > -380 && z < 625) || (x > 0 && x < 182 && z > 308 && z < 598);
      if (paved && h < 0.01) h = -0.3;
      // Sous les escaliers, le terrain passe en dessous des marches
      for (const st of [STAIRS.west, STAIRS.east]) {
        const [d, lat] = stairCoords(x, z, st);
        if (lat < 9 && d > -3 && d < st.run + 3) h -= 2;
      }
      pos.setY(i, h);
      const n = 0.9 + 0.2 * R();
      const base = h < 0.5 ? P.town : (h > 6 ? P.hill : P.earth);
      colors[i * 3] = base[0] * n; colors[i * 3 + 1] = base[1] * n; colors[i * 3 + 2] = base[2] * n;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })), false, true);
  }

  // ---------- Sol de l'avenue, de l'esplanade et du parvis ----------
  {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 1000), M.road);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 122);
    add(ground, false, true);
    // Esplanade du marché, à gauche de l'avenue du 26 Juin
    const marketTex = roadTex.clone(); marketTex.repeat.set(22, 66); marketTex.needsUpdate = true;
    const market = new THREE.Mesh(new THREE.PlaneGeometry(132, 288), lam(0xffffff, marketTex));
    market.rotation.x = -Math.PI / 2;
    market.position.set(114, 0, 452);
    add(market, false, true);
  }

  // ---------- Immeubles à arcades ----------
  {
    const shape = new THREE.Shape();
    shape.moveTo(-BAY / 2, 0); shape.lineTo(BAY / 2, 0); shape.lineTo(BAY / 2, 5); shape.lineTo(-BAY / 2, 5); shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-2, 0); hole.lineTo(-2, 2.5); hole.absarc(0, 2.5, 2, Math.PI, 0, true); hole.lineTo(2, 0); hole.closePath();
    shape.holes.push(hole);
    const archGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: false, curveSegments: 10 });
    archGeo.translate(0, 0, -0.35);
    archGeo.rotateY(Math.PI / 2);

    const arches = [], uppers = [], shops = [];
    for (const { side, z0, z1: zEnd, front } of ARCADES) {
      const n = Math.max(1, Math.round((zEnd - z0) / BAY)), z1 = z0 + n * BAY;
      for (let i = 0; i < n; i++) {
        const z = z0 + (i + 0.5) * BAY;
        arches.push({ x: side * front, y: 0, z });
        uppers.push({ x: side * (front + DEPTH / 2), y: 5 + 3.5, z });
        shops.push({ x: side * (front + GALLERY + (DEPTH - GALLERY) / 2), y: 2.5, z, ry: side > 0 ? Math.PI : 0 });
      }
      // Toit à deux pentes
      const tri = new THREE.Shape();
      tri.moveTo(-DEPTH / 2 - 0.6, 0); tri.lineTo(DEPTH / 2 + 0.6, 0); tri.lineTo(0, 3.2); tri.closePath();
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: z1 - z0, bevelEnabled: false }), M.roof);
      roof.position.set(side * (front + DEPTH / 2), 12, z0);
      add(roof);
      solid(side * (front + GALLERY), side * (front + DEPTH), z0, z1, 0, 15.2);
      solid(side * (front - 0.4), side * (front + GALLERY), z0, z1, 5, 15.2);
    }
    // ---------- Mairie (hôtel de ville), en retrait derrière son parvis ----------
    {
      const mz = -19, fx = 51;   // emprise réelle : x 51 à 80, z -56 à 18
      box(16, 11, 60, fx + 8, 0, mz, M.wall);
      box(19, 15, 16, fx + 7.5, 0, mz, M.wall);
      const tri = new THREE.Shape();
      tri.moveTo(-8.8, 0); tri.lineTo(8.8, 0); tri.lineTo(0, 3.6); tri.closePath();
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 61, bevelEnabled: false }), M.roof);
      roof.position.set(fx + 8, 11, mz - 30.5); add(roof);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(14, 5, 4), M.roof);
      cap.rotation.y = Math.PI / 4; cap.position.set(fx + 7.5, 17.5, mz); add(cap);
      // Pavillons d'angle à toit pointu
      for (const dz of [-26, 26]) {
        box(18, 11.5, 12, fx + 7, 0, mz + dz, M.wall);
        const r2 = new THREE.Mesh(new THREE.ConeGeometry(11, 4.2, 4), M.roof);
        r2.rotation.y = Math.PI / 4; r2.position.set(fx + 7, 13.6, mz + dz); add(r2);
      }
      // Portique : quatre hautes colonnes blanches et fronton « LAPAN'NY TANANA »
      for (const dz of [-6, -2, 2, 6]) {
        const colm = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 10, 12), M.white);
        colm.position.set(fx - 3.6, 5, mz + dz); add(colm);
      }
      box(1.6, 1.3, 14.5, fx - 3.6, 10, mz, M.white);
      const gable = new THREE.Shape();
      gable.moveTo(-7.4, 0); gable.lineTo(7.4, 0); gable.lineTo(0, 3.2); gable.closePath();
      const gableGeo = new THREE.ExtrudeGeometry(gable, { depth: 5, bevelEnabled: false });
      gableGeo.rotateY(Math.PI / 2);
      const gm = new THREE.Mesh(gableGeo, M.roof); gm.position.set(fx - 4.4, 11.3, mz); add(gm);
      const signTex = canvasTex(512, 64, (c, w, h) => {
        c.fillStyle = '#f4f1e8'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#4a3a2c'; c.font = 'bold 40px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText("LAPAN'NY TANANA", w / 2, h / 2 + 2);
      });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 1.1), new THREE.MeshLambertMaterial({ map: signTex }));
      sign.rotation.y = -Math.PI / 2; sign.position.set(fx - 4.42, 10.65, mz); add(sign, false);
      // Bandeaux terre cuite, grille et palmiers du parvis
      const bandM = lam(new THREE.Color(P.band));
      for (const y of [5.5, 10.6]) box(0.2, 0.45, 60, fx - 0.08, y, mz, bandM, false);
      const posts = [];
      for (let z = mz - 31; z <= mz + 31; z += 2) if (Math.abs(z - mz) > 3) posts.push({ x: 33.5, y: 1.1, z });
      instanced(new THREE.BoxGeometry(0.08, 2.2, 0.08), M.iron, posts, false);
      for (const s of [-1, 1]) {
        for (const y of [0.4, 2]) box(0.06, 0.06, 28, 33.5, y, mz + s * 17, M.iron, false);
        solid(33.3, 33.7, mz + s * 3, mz + s * 31, 0, 2.4);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 7, 8), lam(0x7a6a55));
        trunk.position.set(38, 3.5, mz + s * 11); add(trunk);
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), lam(0x3f7a3a));
        crown.scale.set(1.3, 0.4, 1.3); crown.position.set(38, 7.3, mz + s * 11); add(crown);
      }
      // Loggia à arcades au rez-de-chaussée
      for (let i = 0; i < 10; i++) arches.push({ x: fx - 2.6, y: 0, z: mz - 27 + i * BAY });
      box(3.2, 0.5, 60, fx - 1.3, 5, mz, M.wall);
      for (let i = 0; i < 10; i++) {
        const z = mz - 27 + i * BAY;
        if (Math.abs(z - mz) > 8) box(0.2, 3, 2.2, fx - 0.05, 6.6, z, M.dark, false);
        box(0.2, 3.4, 2.4, fx - 0.05, 0.6, z, M.dark, false);
      }
      for (const dz of [-4, 0, 4]) box(0.2, 4.2, 2, fx - 1.95, 7.2, mz + dz, M.dark, false);
      for (const dz of [-17, 17]) box(8, 0.18, 18, fx - 8, 0, mz + dz, M.lawn, false);
      solid(fx, fx + 16, mz - 30, mz + 30, 0, 16);
      solid(fx - 2, fx, mz - 8, mz + 8, 5, 16);
    }
    instanced(archGeo, M.wall, arches);
    instanced(new THREE.BoxGeometry(DEPTH, 7, BAY), M.facade, uppers);
    instanced(new THREE.BoxGeometry(DEPTH - GALLERY, 5, BAY), M.shop, shops);
  }

  // ---------- Jardin central ----------
  const trees = [];
  {
    for (const [z0, z1] of GARDEN) {
      const len = z1 - z0, zc = (z0 + z1) / 2;
      box(18, 0.18, len, 0, 0, zc, M.lawn, false);     // une seule pelouse, sans allée au milieu
      for (const s of [-1, 1]) {
        // Platanes espacés, en quinconce d'un côté à l'autre
        for (let z = z0 + (s > 0 ? 8 : 19); z < z1 - 4; z += 22) {
          trees.push({ x: s * (5.8 + (R() - 0.5) * 1.6), z: z + (R() - 0.5) * 4, s: 0.85 + R() * 0.3 });
        }
      }
    }
    if (era === 2050) {
      // Rangées d'arbres et ombrières solaires sur les anciennes chaussées
      for (const s of [-1, 1]) {
        for (let z = -262 + (s > 0 ? 0 : 17); z < 236; z += 34) {
          if (Math.abs(((z + 250) % 60) - 0) < 9 || ((z + 250) % 60) > 51) continue; // pas sous les ombrières
          trees.push({ x: s * (19 + (R() - 0.5) * 3), z: z + (R() - 0.5) * 5, s: 0.9 + R() * 0.3 });
        }
        for (let z = -250; z < 235; z += 60) {
          box(8, 0.15, 12, s * 25, 3.6, z, M.slate);
          for (const dx of [-3.6, 3.6]) for (const dz of [-5.4, 5.4]) box(0.18, 3.6, 0.18, s * 25 + dx, 0, z + dz, M.wood, false);
        }
      }
      // Fontaines aux croisements
      for (const z of [-149, -64, 20, 113]) {
        const basin = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.2, 0.6, 24), M.stone);
        basin.position.set(0, 0.3, z); add(basin);
        const water = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.1, 24), M.water);
        water.position.set(0, 0.6, z); add(water, false);
        const jet = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 8), M.water);
        jet.position.set(0, 1.7, z); add(jet, false);
        solid(-4.2, 4.2, z - 4.2, z + 4.2, 0, 1);
      }
    } else {
      // Obélisque commémoratif au bout du jardin
      box(3, 1, 3, 0, 0, 246, M.stone); box(1.6, 6, 1.6, 0, 1, 246, M.stone);
      solid(-1.5, 1.5, 244.5, 247.5, 0, 7);
    }
  }

  // ---------- Gare de Soarano ----------
  {
    // La façade sud est l'image générée d'après la vraie gare (pavillon central
    // à horloge « TANANARIVE », clocheton, halls vitrés, pavillons d'angle).
    // Échelle : 0,036 m par pixel ; le fond blanc et les portes sont détourés.
    const S = 0.036, zs = -348, zn = -366, w = 26.6, hh = 10.3;   // emprise réelle : z -368 à -348
    const doors = [[0, 1.66], [-11.77, 1.22], [11.8, 1.22]];   // [centre x, demi-largeur]
    {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height), px = d.data, W = c.width, Hh = c.height;
        const white = (i) => px[i] > 232 && px[i + 1] > 232 && px[i + 2] > 232;
        const seen = new Uint8Array(W * Hh), stack = [];
        for (let x = 0; x < W; x++) stack.push(x, x + (Hh - 1) * W);
        for (let y = 0; y < Hh; y++) stack.push(y * W, y * W + W - 1);
        while (stack.length) {
          const p = stack.pop();
          if (seen[p]) continue; seen[p] = 1;
          if (!white(p * 4)) continue;
          px[p * 4 + 3] = 0;
          const x = p % W;
          if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1);
          if (p >= W) stack.push(p - W); if (p < W * (Hh - 1)) stack.push(p + W);
        }
        for (let y = 646; y < Hh; y++) for (let x = 0; x < W; x++) px[(y * W + x) * 4 + 3] = 0;
        // Ouvertures des portes : rectangle surmonté d'un demi-cercle
        for (const [cx, half, cy, bottom] of [[792, 44, 490, 645], [465, 32, 487, 632], [1120, 32, 487, 632]]) {
          for (let y = cy - half; y < bottom; y++) for (let x = cx - half; x <= cx + half; x++) {
            if (y < cy && (x - cx) ** 2 + (y - cy) ** 2 > half * half) continue;
            px[(y * W + x) * 4 + 3] = 0;
          }
        }
        ctx.putImageData(d, 0, 0);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        t.repeat.set(1, 626 / Hh); t.offset.set(0, (Hh - 646) / Hh);
        const facade = new THREE.Mesh(
          new THREE.PlaneGeometry(W * S, 626 * S),
          new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, color: era === 1950 ? 0xe6dcc6 : 0xffffff }),
        );
        facade.position.set(0, (626 * S) / 2, zs + 0.05);
        facade.receiveShadow = true;
        g.add(facade);
      };
      img.src = '/textures/gare-facade.png';
    }
    // Mur sud : collisions partout sauf aux trois portes
    {
      const edges = [-w, ...doors.sort((a, b) => a[0] - b[0]).flatMap(([cx, h]) => [cx - h, cx + h]), w];
      for (let i = 0; i < edges.length; i += 2) solid(edges[i], edges[i + 1], zs - 0.4, zs + 0.4, 0, 16);
      solid(-w, w, zs - 0.4, zs + 0.4, 6.5, 23);
    }
    for (const s of [-1, 1]) {
      box(19.6, hh, 1, s * 16.8, 0, zn, M.gare); solid(s * 7, s * w, zn - 0.5, zn + 0.5, 0, hh);
      box(1, hh, zs - zn, s * (w - 0.5), 0, (zs + zn) / 2, M.stone); solid(s * w - 1, s * w, zn, zs, 0, hh);
      box(0.9, 6, 1, s * 2.33, 0, zn, M.stone, false);
      box(8.3, 5.4, zs - zn - 0.4, s * 22.4, hh, (zs + zn) / 2 - 0.2, M.stone);   // étage des pavillons d'angle
    }
    box(14, 4.3, 1, 0, 6, zn, M.stone);
    box(9.6, 2, 5, 0, hh, zs - 2.7, M.stone);                                    // arrière du pavillon central
    box(2 * w, 0.6, zs - zn - 0.2, 0, hh - 0.6, (zs + zn) / 2 - 0.1, M.stoneDark);
    solid(-w, w, zn, zs, hh - 0.6, hh + 6);
    box(2 * w, 0.2, zs - zn, 0, 0, (zs + zn) / 2, M.stoneDark, false);       // sol du hall
    // Marquise et quais
    box(2 * w, 0.25, 10, 0, 5.2, zn - 5.5, M.iron);
    for (let x = -30; x <= 30; x += 10) box(0.25, 5.2, 0.25, x, 0, zn - 10, M.iron, false);
    box(2 * w + 20, 0.5, 9, 0, 0, zn - 5.5, M.stoneDark, false);
    for (const dz of [-13.2, -14.6, -18.2, -19.6]) box(240, 0.15, 0.12, 0, 0.05, zn + dz, M.iron, false);
    box(240, 0.1, 9, 0, 0, zn - 16.4, lam(0x6d655a), false);
    // Locomotive (en service en 1950, pièce de patrimoine en 2050)
    const lx = -12, lz = zn - 13.9;
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 6, 16), M.dark);
    boiler.rotation.z = Math.PI / 2; boiler.position.set(lx, 2.1, lz); add(boiler);
    box(2.6, 2.8, 2.4, lx + 4.2, 0.8, lz, M.dark); box(8.6, 0.6, 2.2, lx + 1.2, 0.4, lz, lam(0x8a2a22));
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.2, 10), M.dark);
    stack.position.set(lx - 2.2, 3.7, lz); add(stack, false);
    for (let k = 0; k < 3; k++) box(9, 3, 2.4, lx + 12 + k * 10, 0.6, lz, lam(era === 1950 ? 0x4d5a3e : 0x7a8a6a));
    solid(lx - 3.5, lx + 37, lz - 1.4, lz + 1.4, 0, 4);
  }

  // ---------- Pavillons du marché ----------
  const pavilionRects = [];
  {
    // Style 1 (devant, côté avenue) : halles allongées, toit à quatre pans avec
    // faîtage, bandeau d'enseignes, hautes fenêtres rectangulaires à cadres rouges.
    const hallRoof = new THREE.BufferGeometry();
    {
      const a = [-14.5, 0, -6.5], b = [14.5, 0, -6.5], c = [14.5, 0, 6.5], d = [-14.5, 0, 6.5], e = [-8, 4.2, 0], f = [8, 4.2, 0];
      const tris = [a, e, f, a, f, b, c, f, e, c, e, d, b, f, c, d, e, a];
      hallRoof.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
      hallRoof.computeVertexNormals();
    }
    // Les pavillons occupent le côté gauche de l'avenue du 26 Juin (x 23 à 136,
    // z 353 à 578). Une allée piétonne en biais relie les deux escaliers.
    const nearCrossPath = (x, z) => {
      const ax = 3, az = 395, bx = 190, bz = 313, t = clamp01(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2));
      return Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az));
    };
    const halls = [], hallRoofs = [];
    for (let z = 404; z <= 574; z += 34) {
      const x = 34;
      halls.push({ x, y: 2.5, z, ry: Math.PI / 2 });
      hallRoofs.push({ x, y: 5, z, ry: Math.PI / 2 });
      solid(x - 5, x + 5, z - 13, z + 13, 0, 9.4);
      pavilionRects.push([x - 6.5, x + 6.5, z - 14, z + 14]);
    }
    instanced(new THREE.BoxGeometry(26, 5, 10), M.hall, halls);
    instanced(hallRoof, M.roofTile, hallRoofs);

    // Style 2 (derrière) : petits pavillons carrés à toit pointu et auvent débordant.
    const walls = [], roofs = [], skirts = [];
    for (const x of [62, 82, 102, 122]) for (let z = 356; z <= 576; z += 20) {
      if (nearCrossPath(x, z) < 11) continue;
      walls.push({ x, y: 2.25, z });
      roofs.push({ x, y: 4.6 + 3.1, z, ry: Math.PI / 4 });
      skirts.push({ x, y: 4.35, z, ry: Math.PI / 4 });
      solid(x - 5, x + 5, z - 5, z + 5, 0, 10.5);
      pavilionRects.push([x - 6.5, x + 6.5, z - 6.5, z + 6.5]);
    }
    instanced(new THREE.BoxGeometry(10, 4.5, 10), M.pavilion, walls);
    instanced(new THREE.ConeGeometry(7.6, 6.2, 4), M.roofTile, roofs);
    const skirtMat = new THREE.MeshLambertMaterial({ color: P.roof, side: THREE.DoubleSide });
    instanced(new THREE.CylinderGeometry(7.2, 9.6, 1.1, 4, 1, true), skirtMat, skirts);
  }

  // ---------- Grands escaliers ----------
  {
    // Larges marches de pierre basses, bordées d'immeubles à boutiques des deux
    // côtés, avec des étals et des parasols sur les marches (d'après photo).
    const steps = [], shopsS = [], uppersS = [], roofsS = [], stallTops = [], stallPoles = [], stallTables = [];
    const parasolTones = era === 1950 ? [0xf4f1e8] : [0xd23b3b, 0x2f6fd0, 0xf2c230, 0xf4f1e8, 0x2f9f6a, 0xe0559a];
    const wallTones = era === 1950 ? [0xd9c9a6, 0xcdbb98, 0xc7a98a] : [0xf3e9d2, 0xf0d8c0, 0xf6efe0, 0xe9c7a8];
    const build = (st) => {
      const { run, total } = st, L = stairLayout(st);
      const ry = Math.atan2(-st.uz, st.ux);                      // oriente les marches selon le tracé réel
      for (let k = 0; k < L.flights; k++) {
        const d0 = k * L.period;
        for (let i = 0; i < FLIGHT; i++) {
          const [x, z] = stairPoint(st, d0 + (i + 0.5) * L.stepRun);
          steps.push({ x, y: (k * FLIGHT + i + 1) * L.rise - 1.5, z, sx: L.stepRun * 1.03, ry });
        }
        if (k < L.flights - 1) {
          for (let j = 0; j < LANDING; j++) {
            const [x, z] = stairPoint(st, d0 + FLIGHT * L.stepRun + j + 0.5);
            steps.push({ x, y: (k + 1) * FLIGHT * L.rise - 1.5, z, sx: 1.02, ry });
          }
        }
      }
      const slope = total / run;
      for (let d = 9; d < run - 4; d += 6) {
        const base = (d - 3) * slope;                            // pied de l'immeuble, côté bas
        for (const s of [-1, 1]) {
          if (R() < 0.08) continue;                              // ruelle
          const [x, z] = stairPoint(st, d, s * 11);
          const floors = 1 + ((R() * 2) | 0), tone = wallTones[(R() * wallTones.length) | 0];
          const hShop = 3.6 + 6 * slope;
          shopsS.push({ x, y: base + hShop / 2, z, sx: 6 / (DEPTH - GALLERY), sy: hShop / 5, sz: 10 / BAY, ry });
          for (let f = 0; f < floors; f++) uppersS.push({ x, y: base + hShop + 3.5 + f * 7, z, sx: 6 / DEPTH, sz: 10 / BAY, ry, color: tone });
          const top = base + hShop + floors * 7;
          roofsS.push({ x, y: top + 0.25, z, ry, color: R() < 0.5 ? P.roof : 0xb5532f });
          solid(x - 4.5, x + 4.5, z - 4.5, z + 4.5, base - 2, top + 1);
        }
        // Étals et parasols au bord des marches
        for (const s of [-1, 1]) if (R() < 0.6) {
          const [sx, sz] = stairPoint(st, d + (R() - 0.5) * 3, s * (3.6 + R() * 1.4));
          const y = Math.max(0, groundHeight(sx, sz));
          stallTops.push({ x: sx, y: y + 2.5, z: sz, color: parasolTones[(R() * parasolTones.length) | 0] });
          stallPoles.push({ x: sx, y: y + 1.2, z: sz });
          stallTables.push({ x: sx, y: y + 0.55, z: sz, ry });
        }
      }
    };
    build(STAIRS.west);
    build(STAIRS.east);
    instanced(new THREE.BoxGeometry(1, 3, 12), M.cobble, steps, false);
    instanced(new THREE.BoxGeometry(DEPTH - GALLERY, 5, BAY), M.shop, shopsS);
    instanced(new THREE.BoxGeometry(DEPTH, 7, BAY), M.facade, uppersS);
    instanced(new THREE.BoxGeometry(6.3, 0.5, 10.6), lam(0xffffff), roofsS);
    instanced(new THREE.ConeGeometry(1.5, 0.6, 8), lam(0xffffff), stallTops);
    instanced(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5), M.wood, stallPoles, false);
    instanced(new THREE.BoxGeometry(1.6, 0.9, 1.1), M.wood, stallTables);
  }

  // ---------- Antaninarenina : jardin et palais d'Ambohitsorohitra ----------
  {
    const y = PLATEAU_H;
    // Places du plateau : dallage piéton clair en 2050
    let pave = lam(new THREE.Color(P.road));
    if (era === 2050) { const tx = pedTex.clone(); tx.repeat.set(24, 24); tx.needsUpdate = true; pave = lam(0xffffff, tx); }
    // Jardin d'Antaninarenina, en haut de l'escalier
    box(64, 0.12, 52, -168, y, 470, pave, false);
    box(22, 0.15, 20, -172, y, 472, M.lawn, false);
    for (const [dx, dz] of [[-8, -7], [8, -7], [-8, 7], [8, 7], [0, 0]]) trees.push({ x: -172 + dx, z: 472 + dz, s: 1.15 });
    // Outils locaux : groupe orienté, toit à la Mansart, drapeau malgache
    const placed = (x, z, facing) => { const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = facing; g.add(grp); return grp; };
    const put = (grp, geo, material, x, yy, z, cast = true) => { const m = new THREE.Mesh(geo, material); m.position.set(x, yy, z); m.castShadow = cast; m.receiveShadow = true; grp.add(m); return m; };
    const pbox = (grp, w, h, d, x, yy, z, material, cast = true) => put(grp, new THREE.BoxGeometry(w, h, d), material, x, yy + h / 2, z, cast);
    const mansard = (w, d, h, inset) => {
      const a = w / 2, b = d / 2, c = a - inset, e = b - inset;
      const B = [[-a, 0, -b], [a, 0, -b], [a, 0, b], [-a, 0, b]], Tp = [[-c, h, -e], [c, h, -e], [c, h, e], [-c, h, e]];
      const v = [];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; v.push(...B[i], ...Tp[j], ...B[j], ...B[i], ...Tp[i], ...Tp[j]); }
      v.push(...Tp[0], ...Tp[2], ...Tp[1], ...Tp[0], ...Tp[3], ...Tp[2]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      geo.computeVertexNormals();
      return geo;
    };
    const slateMat = new THREE.MeshLambertMaterial({ color: 0x4a4f58, side: THREE.DoubleSide });
    const flagMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, map: canvasTex(96, 64, (c, w, h) => {
      c.fillStyle = '#fc3d32'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#007e3a'; c.fillRect(0, h / 2, w, h / 2);
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w / 3, h);
    }) });
    const flag = (grp, x, base, z, height) => {
      pbox(grp, 0.1, height, 0.1, x, base, z, M.white, false);
      put(grp, new THREE.PlaneGeometry(2.1, 1.4), flagMat, x + 1.1, base + height - 0.8, z, false);
    };

    // ---- Palais d'Ambohitsorohitra (emprise réelle x -385 à -350, z 544 à 587) ----
    // Brique rouge et pierre blanche, toit d'ardoise à la Mansart avec lucarnes,
    // pavillon central, grille, bassin à jets d'eau et deux bâtiments de brique.
    {
      const px = -367, pz = 565, P2 = placed(px, pz, Math.PI / 2);   // façade tournée vers le jardin (x croissant)
      box(96, 0.12, 100, px + 30, y, pz, pave, false);
      const brick = '#a43d2c', stoneW = '#ece5d6';
      const front = (bays, wide) => canvasTex(wide, 300, (c, w, h) => {
        c.fillStyle = brick; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(0,0,0,${0.04 + 0.05 * R()})`; c.fillRect(R() * w, R() * h, 14, 3); }
        const bw = w / bays;
        for (let k = 0; k < bays; k++) {
          const x = k * bw + bw * 0.2;
          c.fillStyle = stoneW; c.fillRect(x, 0, bw * 0.6, h);                        // travée de pierre blanche
          for (const [top, hh] of [[34, 92], [168, 96]]) {
            c.fillStyle = '#2c3038'; c.fillRect(x + bw * 0.13, top, bw * 0.34, hh);
            c.strokeStyle = '#f6f3ea'; c.lineWidth = 3; c.strokeRect(x + bw * 0.13, top, bw * 0.34, hh);
            c.beginPath(); c.moveTo(x + bw * 0.3, top); c.lineTo(x + bw * 0.3, top + hh); c.moveTo(x + bw * 0.13, top + hh * 0.35); c.lineTo(x + bw * 0.47, top + hh * 0.35); c.stroke();
          }
        }
        c.fillStyle = stoneW; c.fillRect(0, 0, w, 16); c.fillRect(0, 138, w, 14);     // corniche et bandeau d'étage
        c.fillStyle = '#b9b2a2'; c.fillRect(0, h - 20, w, 20);                        // soubassement
      });
      const brickM = lam(new THREE.Color(brick)), stoneM = lam(new THREE.Color(stoneW));
      const faced = (tex) => { const f = lam(0xffffff, tex); return [brickM, brickM, stoneM, stoneM, f, f]; };
      pbox(P2, 44, 12, 14, 0, 0, 0, faced(front(9, 1024)));                           // corps principal
      pbox(P2, 12, 13.5, 16, 0, 0, 0.6, faced(front(3, 512)));                        // pavillon central
      for (const s of [-1, 1]) pbox(P2, 8, 12.6, 15.4, s * 18.4, 0, 0.3, faced(front(2, 384)));
      put(P2, mansard(44.8, 14.8, 4.6, 3.2), slateMat, 0, 12, 0);
      put(P2, mansard(12.6, 16.6, 5.6, 3), slateMat, 0, 13.5, 0.6);
      for (const s of [-1, 1]) put(P2, mansard(8.6, 16, 5, 2.6), slateMat, s * 18.4, 12.6, 0.3);
      // Lucarnes de pierre et grande lucarne ornée du pavillon central
      for (const dx of [-13, -9, 9, 13]) { pbox(P2, 1.5, 2.2, 1.2, dx, 12.3, 6.4, stoneM); pbox(P2, 0.9, 1.3, 0.2, dx, 12.7, 7.05, M.dark, false); }
      pbox(P2, 4.6, 4.2, 1.4, 0, 13.6, 8, stoneM); pbox(P2, 2, 2.6, 0.2, 0, 14, 8.75, M.dark, false);
      pbox(P2, 3, 1, 1.4, 0, 17.8, 8, stoneM);
      flag(P2, 0, 19.1, 0.6, 5);
      // Perron
      pbox(P2, 9, 0.9, 3, 0, 0, 9.5, stoneM, false); pbox(P2, 2.2, 3.6, 0.2, 0, 0.9, 8.75, M.dark, false);
      // Grille, portail, guérites
      const posts = [];
      for (let x = -34; x <= 34; x += 1.5) if (Math.abs(x) > 3.5) posts.push({ x: px + 20, y: y + 1.3, z: pz + x });
      instanced(new THREE.BoxGeometry(0.08, 2.6, 0.08), M.iron, posts, false);
      for (const s of [-1, 1]) {
        for (const yy of [0.5, 2.3]) pbox(P2, 30.5, 0.07, 0.07, s * 18.8, yy, 20, M.iron, false);
        pbox(P2, 0.9, 3.4, 0.9, s * 3.6, 0, 20, stoneM);
        pbox(P2, 2, 2.4, 2, s * 7, 0, 17.5, lam(0xb8332b)); put(P2, new THREE.ConeGeometry(1.8, 1.2, 4), lam(0x2f8a4a), s * 7, 3, 17.5).rotation.y = Math.PI / 4;
        flag(P2, s * 11, 0, 21.5, 9);
        // Bâtiments de brique qui encadrent la place
        pbox(P2, 16, 10, 12, s * 34, 0, 34, lam(0xb5622f));
        put(P2, mansard(16.6, 12.6, 2.6, 4), M.roof, s * 34, 10, 34);
        for (const dx of [-5, 0, 5]) pbox(P2, 1.6, 2.6, 0.2, s * 34 + dx, 5.5, 40.05, M.white, false);
        solid(px + 28, px + 40, pz - s * 34 - 8, pz - s * 34 + 8, y, y + 13);
      }
      solid(px + 19.8, px + 20.2, pz - 34, pz - 3.5, y, y + 2.8); solid(px + 19.8, px + 20.2, pz + 3.5, pz + 34, y, y + 2.8);
      // Bassin à jets d'eau devant la grille
      pbox(P2, 22, 1.5, 10, 0, 0, 36, stoneM); pbox(P2, 20.6, 0.1, 8.6, 0, 1.5, 36, M.water, false);
      const jets = [];
      for (let k = -4; k <= 4; k++) jets.push({ x: px + 36, y: y + 2.5 + (k % 2 ? 0.5 : 0), z: pz + k * 2.2, sy: 1 + (k % 2 ? 0.5 : 0), color: era === 2050 && k % 2 ? 0xe58bd0 : 0xdff2fb });
      instanced(new THREE.ConeGeometry(0.35, 2, 6), lam(0xffffff), jets, false);
      solid(px + 31, px + 41, pz - 11, pz + 11, y, y + 1.8);
      solid(px - 8, px + 8.5, pz - 22.5, pz + 22.5, y, y + 19);
      for (const s of [-1, 1]) trees.push({ x: px + 52, z: pz + s * 30, s: 1.4 });
    }

    // ---- Hôtel Colbert, à droite du palais (position réelle) ----
    {
      const hx = -225, hz = 595, H = placed(hx, hz, Math.PI);          // façade tournée vers le jardin d'Antaninarenina
      const red = '#8a2a2b';
      const towerTex = canvasTex(512, 768, (c, w, h) => {
        c.fillStyle = red; c.fillRect(0, 0, w, h);
        c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2;
        for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(0, k * h / 8); c.lineTo(w, k * h / 8); c.stroke(); }
        for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(k * w / 6, 0); c.lineTo(k * w / 6, h); c.stroke(); }
        const glass = (x, y0, ww, hh) => {
          c.fillStyle = '#a9cfe6'; c.fillRect(x, y0, ww, hh);
          c.strokeStyle = '#f4f6f8'; c.lineWidth = 3;
          for (let yy = y0; yy <= y0 + hh; yy += 46) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + ww, yy); c.stroke(); }
          c.beginPath(); c.moveTo(x + ww / 2, y0); c.lineTo(x + ww / 2, y0 + hh); c.stroke(); c.strokeRect(x, y0, ww, hh);
        };
        glass(118, 150, 62, 500); glass(240, 150, 62, 500); glass(404, 120, 46, 470);     // bandes vitrées verticales
        for (const cx of [149, 271]) { c.fillStyle = '#a9cfe6'; c.beginPath(); c.ellipse(cx, 104, 30, 20, 0, 0, 6.3); c.fill(); c.strokeStyle = '#f4f6f8'; c.stroke(); }
        glass(110, 44, 60, 40); glass(232, 44, 60, 40);
        c.fillStyle = '#1e2226'; c.fillRect(150, 660, 190, 108);                         // entrée vitrée
        c.fillStyle = '#efe6d2'; c.beginPath(); c.ellipse(245, 664, 120, 46, 0, Math.PI, 0); c.fill();   // auvent
        c.fillStyle = '#8a2a2b'; c.font = 'bold 30px Georgia, serif'; c.textAlign = 'center';
        c.fillText('HOTEL', 245, 640); c.fillText('COLBERT', 245, 664);
      });
      const redM = lam(new THREE.Color(red));
      pbox(H, 18, 26, 14, 0, 0, 0, [redM, redM, M.slate, M.slate, lam(0xffffff, towerTex), redM]);
      pbox(H, 7, 0.3, 3, -0.4, 2.9, 8.4, lam(0xefe6d2));                                  // auvent
      // Aile basse à verrière
      pbox(H, 24, 7, 12, -21, 0, 0, lam(0xe9dcc2));
      const glassRoof = pbox(H, 24, 0.25, 7, -21, 8.6, 3.4, lam(0xa9cfe6)); glassRoof.rotation.x = 0.5;
      pbox(H, 24, 0.5, 2.6, -21, 3.2, 7.2, lam(0xf2ece0));
      // Bougainvillée sur la façade
      const blooms = [];
      for (let k = 0; k < 16; k++) blooms.push({ x: hx - 3.2 - R() * 3.4, y: y + 4 + R() * 17, z: hz - 7.3, sx: 0.7 + R(), sy: 0.8 + R() * 1.2, sz: 0.5, color: R() < 0.55 ? 0xc0398b : 0x3f7a3a });
      instanced(new THREE.IcosahedronGeometry(1, 1), lam(0xffffff), blooms, false);
      for (const s of [-1, 1]) flag(H, s * 6, 0, 9.5, 7);
      solid(hx - 9, hx + 33, hz - 7, hz + 7, y, y + 27);
    }

    // ---- Hôtel Le Louvre, à l'angle de la place (position réelle : x -219, z 482) ----
    // Immeuble d'angle blanc à pan coupé, quatre étages à balcons, grande marquise
    // sombre sur colonnes au rez-de-chaussée, enseigne « Le Louvre » (d'après photo).
    {
      const lx = -219, lz = 482, Lv = placed(lx, lz, Math.PI / 2);     // pan coupé tourné vers le jardin
      // Emprise : pan coupé de 9 m à l'avant, deux ailes qui s'écartent vers l'arrière
      const outline = (grow) => {
        const pts = [[-4.5 - grow, 14 + grow], [4.5 + grow, 14 + grow], [17 + grow, -10 - grow * 0.3], [-17 - grow, -10 - grow * 0.3]];
        const sh = new THREE.Shape();
        pts.forEach(([X, F], i) => (i ? sh.lineTo(X, -F) : sh.moveTo(X, -F)));
        sh.closePath();
        return sh;
      };
      const slab = (grow, h) => { const geo = new THREE.ExtrudeGeometry(outline(grow), { depth: h, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); return geo; };
      const bayTex = canvasTex(128, 128, (c, w, h) => {
        c.fillStyle = era === 1950 ? '#e6dfd0' : '#f3f0e9'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#cfc8b8'; c.fillRect(0, h - 8, w, 8);                       // bandeau d'étage
        c.fillStyle = '#39424c'; c.fillRect(40, 22, 48, 74);                       // porte-fenêtre
        c.strokeStyle = '#f7f5ef'; c.lineWidth = 4; c.strokeRect(40, 22, 48, 74);
        c.beginPath(); c.moveTo(64, 22); c.lineTo(64, 96); c.stroke();
        c.fillStyle = '#e3d9c4'; c.fillRect(28, 96, 72, 7);                        // dalle du balcon
        c.strokeStyle = '#4a4f55'; c.lineWidth = 2;
        for (let x = 30; x <= 98; x += 6) { c.beginPath(); c.moveTo(x, 78); c.lineTo(x, 96); c.stroke(); }
        c.beginPath(); c.moveTo(28, 78); c.lineTo(100, 78); c.stroke();
      }, 1 / 3, 1 / 3.4);
      const wallM = lam(0xffffff, bayTex), whiteM = lam(0xf3f0e9);
      put(Lv, slab(-0.6, 4.6), lam(0x232a30), 0, 0, 0);                            // rez-de-chaussée vitré
      put(Lv, slab(0, 13.6), [whiteM, wallM], 0, 4.6, 0);                          // quatre étages
      put(Lv, slab(0.5, 0.5), whiteM, 0, 18.2, 0);                                 // corniche
      put(Lv, slab(-2.2, 2.4), whiteM, 0, 18.7, 0);                                // attique
      put(Lv, slab(3.6, 0.45), lam(0x2b2f33), 0, 4.2, 0);                          // marquise
      for (const [X, F] of [[-7.4, 16.8], [0, 16.8], [7.4, 16.8], [12.4, 8], [17.4, -2], [-12.4, 8], [-17.4, -2]]) {
        put(Lv, new THREE.CylinderGeometry(0.28, 0.32, 4.2, 10), whiteM, X, 2.1, F);
      }
      const signTex = canvasTex(512, 96, (c, w, h) => {
        c.fillStyle = '#f3f0e9'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#23272b'; c.font = 'bold 62px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('Le Louvre', w / 2, h / 2 + 2);
      });
      put(Lv, new THREE.PlaneGeometry(7.4, 1.4), new THREE.MeshLambertMaterial({ map: signTex }), 0, 5.7, 14.06, false);
      flag(Lv, 0, 21.1, 11, 5);
      solid(lx - 10, lx + 2, lz - 17, lz + 17, y, y + 22);
      solid(lx + 2, lx + 14, lz - 10, lz + 10, y, y + 22);
    }
  }

  // ---------- Entrées de tunnel ----------
  {
    // Mur de soutènement en pierre percé d'une voûte, au bout d'une rampe.
    const W2 = 26, Hh = 13, shape = new THREE.Shape();
    shape.moveTo(-W2 / 2, 0); shape.lineTo(W2 / 2, 0); shape.lineTo(W2 / 2, Hh); shape.lineTo(-W2 / 2, Hh); shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-4.5, 0); hole.lineTo(-4.5, 3.4); hole.absarc(0, 3.4, 4.5, Math.PI, 0, true); hole.lineTo(4.5, 0); hole.closePath();
    shape.holes.push(hole);
    const wallGeo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false, curveSegments: 16 });
    const stoneTex = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = '#8f887a'; c.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) for (let k = -1; k < 8; k++) {
        const v = 132 + R() * 34 | 0; c.fillStyle = `rgb(${v + 6},${v},${v - 10})`;
        c.fillRect(k * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14);
      }
    }, 0.12, 0.12);
    const wallMat = lam(0xffffff, stoneTex), darkIn = new THREE.MeshBasicMaterial({ color: 0x0b0b0c });
    const roadMat = lam(era === 1950 ? 0x857a6c : 0x77777a);
    for (const t of TUNNELS) {
      const dx = t.at[0] - t.from[0], dz = t.at[1] - t.from[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
      const grp = new THREE.Group();
      grp.position.set(t.at[0], 0, t.at[1]);
      grp.rotation.y = Math.atan2(-ux, -uz);                     // le mur regarde vers la rampe
      const wall = new THREE.Mesh(wallGeo, wallMat); wall.position.z = -2; wall.castShadow = wall.receiveShadow = true; grp.add(wall);
      const inside = new THREE.Mesh(new THREE.BoxGeometry(9, 8, 14), darkIn); inside.position.set(0, 4, -9); grp.add(inside);
      const coping = new THREE.Mesh(new THREE.BoxGeometry(W2 + 1, 0.8, 2.6), M.stoneDark); coping.position.set(0, Hh + 0.4, -1); grp.add(coping);
      // Voûte en claveaux clairs autour de l'ouverture
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.45, 6, 20, Math.PI), M.stone); ring.position.set(0, 3.4, 0.05); grp.add(ring);
      for (const s of [-1, 1]) { const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.4, 0.5), M.stone); jamb.position.set(s * 4.9, 1.7, 0.1); grp.add(jamb); }
      g.add(grp);
      // Chaussée de la rampe
      // En 2050 : allée piétonne dallée, bordée de lampadaires, de bancs et de platanes
      let rampMat = roadMat;
      if (era === 2050) {
        const tx = pedTex.clone(); tx.repeat.set(3, (len + 6) / 3); tx.needsUpdate = true;
        rampMat = lam(0xffffff, tx);
        for (let d = 6; d < len - 4; d += 12) for (const s of [-1, 1]) {
          const lx = t.from[0] + ux * d - uz * 5.6 * s, lz = t.from[1] + uz * d + ux * 5.6 * s;
          lamps.push({ x: lx, y: Math.max(0, groundHeight(lx, lz)), z: lz });
          if ((d / 12) % 2 === (s > 0 ? 0 : 1)) {
            benches.push({ x: lx + uz * 0.9 * s + ux * 2.5, y: 0.45, z: lz - ux * 0.9 * s + uz * 2.5, ry: Math.atan2(-uz, ux) });
            trees.push({ x: lx - uz * 2.6 * s + ux * 6, z: lz + ux * 2.6 * s + uz * 6, s: 0.9 + R() * 0.25 });
          }
        }
      }
      const road = new THREE.Mesh(new THREE.PlaneGeometry(era === 2050 ? 10 : 9, len + 6), rampMat);
      road.rotation.x = -Math.PI / 2; road.rotation.z = Math.atan2(-ux, -uz);
      road.position.set((t.from[0] + t.at[0]) / 2, 0.12, (t.from[1] + t.at[1]) / 2);
      add(road, false, true);
      solid(t.at[0] - 9, t.at[0] + 9, t.at[1] - 9, t.at[1] + 9, 3.5, 40);     // on ne traverse pas la colline
      solid(t.at[0] + ux * 6 - 7, t.at[0] + ux * 6 + 7, t.at[1] + uz * 6 - 7, t.at[1] + uz * 6 + 7, 0, 40);
    }
  }

  // ---------- Jardin d'Ambohijatovo ----------
  for (let z = 660; z <= 735; z += 18) for (const x of [-30, -14, 14, 30]) {
    if (R() < 0.35) continue;
    trees.push({ x: x + (R() - 0.5) * 7, z: z + (R() - 0.5) * 7, s: 0.95 + R() * 0.35 });
  }

  // ---------- Église en brique sur la colline est ----------
  {
    const x = 300, z = 335, y = groundHeight(x, z);
    box(14, 12, 30, x, y, z, lam(0x9c4a36)); box(6, 26, 6, x, y, z - 17, lam(0x9c4a36));
    const spire = new THREE.Mesh(new THREE.ConeGeometry(4.4, 10, 4), lam(0x7b3527));
    spire.position.set(x, y + 31, z - 17); spire.rotation.y = Math.PI / 4; add(spire);
    solid(x - 7, x + 7, z - 20, z + 15, y - 5, y + 14);
  }

  // ---------- Décors de rue : terrasses, bancs, commerces, hôtels, marché ----------
  // `spots` : emplacements des personnages immobiles (clients assis, marchands
  // debout), repris par people.js.
  const spots = [];
  {
    const seats = [], backs = [], legs = [], tableTops = [], tableLegs = [], parasolTops = [], parasolPoles = [];
    const chair = (x, z, ry) => {        // la chaise regarde vers +z local
      const s = Math.sin(ry), c = Math.cos(ry);
      seats.push({ x, y: 0.45, z, ry });
      backs.push({ x: x - s * 0.2, y: 0.7, z: z - c * 0.2, ry });
      for (const o of [-0.18, 0.18]) legs.push({ x: x + s * o, y: 0.22, z: z + c * o, ry });
    };
    const sign = (text, w, h, x, y, z, ry, bg = '#2c3a33', fg = '#f4ecd8') => {
      const tex = canvasTex(512, Math.round(512 * h / w), (c, cw, ch) => {
        c.fillStyle = bg; c.fillRect(0, 0, cw, ch);
        c.strokeStyle = fg; c.lineWidth = 4; c.strokeRect(6, 6, cw - 12, ch - 12);
        c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
        let size = ch * 0.56; c.font = `bold ${size}px Georgia, serif`;
        while (c.measureText(text).width > cw - 40) { size -= 2; c.font = `bold ${size}px Georgia, serif`; }
        c.fillText(text, cw / 2, ch / 2 + 2);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.rotation.y = ry; add(m, false, false);
    };
    const parasol = (x, z, color, big = 1) => {
      parasolTops.push({ x, y: 2.45, z, sx: big, sz: big, color });
      parasolPoles.push({ x, y: 1.2, z });
    };

    // ---- Terrasses : tables rondes, deux chaises face à face, clients assis ----
    const terrace = (side, z0, z1, name, tone) => {
      const facade = side * 31.6;
      sign(name, 7.5, 1.1, facade, 5.9, (z0 + z1) / 2, side > 0 ? -Math.PI / 2 : Math.PI / 2);
      const x = era === 2050 ? side * 28.6 : side * 35.1;        // sur la chaussée piétonne en 2050, sous la galerie contre les boutiques en 1950
      for (let z = z0 + 1.5; z < z1 - 1; z += 3.3) {
        tableTops.push({ x, y: 0.74, z }); tableLegs.push({ x, y: 0.37, z });
        if (era === 2050) parasol(x, z, tone, 0.9);
        for (const s of [-1, 1]) {
          chair(x, z + s * 0.78, s > 0 ? Math.PI : 0);
          if (R() < 0.6) spots.push({ x, z: z + s * 0.78, ry: s > 0 ? Math.PI : 0, pose: 'sit' });
        }
      }
    };
    terrace(-1, -128, -100, "CAFÉ DE L'AVENUE", 0xefe6d2);
    terrace(1, 38, 66, 'GLACIER · SALON DE THÉ', 0xf2d9d0);
    terrace(-1, 50, 76, 'PÂTISSERIE COLBERT', 0xefe6d2);
    terrace(1, 150, 180, 'CAFÉ DU ZOMA', 0xe9d9b0);
    // Hôtel et glacier « Le Glacier », à l'angle de l'avenue
    sign('HÔTEL LE GLACIER', 9, 1.3, -9.6, 6.1, 275, Math.PI / 2, '#f4ecd8', '#5a2a22');
    for (let z = 256; z < 296; z += 3.3) {
      const x = -5.6;
      tableTops.push({ x, y: 0.74, z }); tableLegs.push({ x, y: 0.37, z }); parasol(x, z, 0xf4f1e8, 0.9);
      for (const s of [-1, 1]) { chair(x, z + s * 0.78, s > 0 ? Math.PI : 0); if (R() < 0.65) spots.push({ x, z: z + s * 0.78, ry: s > 0 ? Math.PI : 0, pose: 'sit' }); }
    }
    // Autres hôtels : enseigne, marquise et drapeaux
    for (const [name, x, z, ry] of [['SELECT HÔTEL', -11.6, 322, Math.PI / 2], ['HÔTEL DE FRANCE', 31.6, 222, -Math.PI / 2], ['HÔTEL DE LA GARE', -31.6, -262, Math.PI / 2]]) {
      sign(name, 8, 1.2, x, 6.2, z, ry, '#f4ecd8', '#22323c');
      const out = Math.sign(Math.sin(ry));
      box(2.4, 0.2, 5, x + out * 1.4, 4.3, z, lam(0x7a2e2a), false);
    }

    // ---- Bancs au bord du jardin central, certains occupés ----
    for (const [z0, z1] of GARDEN) for (let z = z0 + 14; z < z1 - 8; z += 26) for (const s of [-1, 1]) {
      const x = s * 10.1;
      benches.push({ x, y: 0.45, z, ry: Math.PI / 2 });
      for (const dz of [-0.5, 0.5]) if (R() < 0.35) spots.push({ x: x + s * 0.05, z: z + dz, ry: s * Math.PI / 2, pose: 'sit' });
    }

    // ---- Commerces ouverts sous les arcades : vitrine éclairée, étalage, enseigne suspendue ----
    const SHOPS = ['ÉPICERIE', 'TISSUS', 'LIBRAIRIE', 'ARTISANAT', 'BIJOUTERIE', 'VANILLE & ÉPICES', 'BOULANGERIE', 'PHOTO', 'CHAPELLERIE', 'PHARMACIE', 'VANNERIE', 'CAFÉ MOULU'];
    const goods = [], displays = [], lit = [];
    const goodTones = [0xc9774a, 0x2f8f86, 0xd9b25c, 0xb23a2b, 0xf2efe6, 0x6a9a5b, 0x8a6fc4, 0x4b6cb7];
    let shopNo = 0;
    for (const { side, z0, z1, front } of ARCADES) {
      if (front !== 32) continue;
      const n = Math.max(1, Math.round((z1 - z0) / BAY));
      for (let i = 0; i < n; i++) {
        if ((i + (side > 0 ? 1 : 0)) % 3 !== 0) continue;        // une travée sur trois
        const z = z0 + (i + 0.5) * BAY, wall = side * (front + GALLERY);
        lit.push({ x: wall - side * 0.06, y: 2.1, z, ry: side > 0 ? -Math.PI / 2 : Math.PI / 2 });
        const dx = wall - side * 0.9;
        displays.push({ x: dx, y: 0.45, z: z + 1.4 });
        for (let k = 0; k < 6; k++) goods.push({ x: dx + (R() - 0.5) * 0.5, y: 1 + R() * 0.12, z: z + 0.5 + k * 0.36, sy: 0.6 + R() * 0.9, color: goodTones[(R() * goodTones.length) | 0] });
        const name = SHOPS[shopNo++ % SHOPS.length];
        sign(name, 2.2, 0.55, side * (front + 1.6), 3.9, z - 2.2, 0, '#f4ecd8', '#3a2a20');
        if (R() < 0.7) spots.push({ x: wall - side * 1.7, z: z - 0.6, ry: side > 0 ? -Math.PI / 2 : Math.PI / 2, pose: 'stand' });
      }
    }
    instanced(new THREE.PlaneGeometry(4.2, 3.2), new THREE.MeshBasicMaterial({ color: era === 1950 ? 0xd9b98a : 0xffe2b0 }), lit, false);
    instanced(new THREE.BoxGeometry(0.9, 0.9, 2.4), M.wood, displays);
    instanced(new THREE.BoxGeometry(0.3, 0.3, 0.3), lam(0xffffff), goods, false);

    // ---- Marché, côté pavillons : étals sous parasols blancs ----
    // Maraîchers (cageots de légumes et de fruits), poissonniers (poisson sur
    // glace), bouchers (quartiers suspendus), épices et riz en sacs.
    const stallTables = [], crates = [], produce = [], ice = [], fish = [], meat = [], sacks = [], racks = [];
    const veg = [0x4f8f3a, 0xc23b2b, 0xe08a2b, 0xe6c93a, 0x7a3f8a, 0x8fb04a, 0xd95a3a, 0xf0e2b0];
    const stall = (x, z, face, kind) => {
      stallTables.push({ x, y: 0.42, z });
      parasol(x + face * 0.2, z, 0xf7f4ec, 1.15);                 // les célèbres parasols blancs
      solid(x - 0.6, x + 0.6, z - 1.15, z + 1.15, 0, 1);
      spots.push({ x: x - face * 0.95, z: z + (R() - 0.5) * 0.8, ry: face * Math.PI / 2, pose: 'stand' });
      if (kind === 'veg') {
        for (let k = 0; k < 6; k++) {
          const cx = x + (k % 2 ? 0.26 : -0.26), cz = z - 0.75 + ((k / 2) | 0) * 0.75;
          crates.push({ x: cx, y: 0.97, z: cz });
          produce.push({ x: cx, y: 1.12, z: cz, color: veg[(R() * veg.length) | 0] });
        }
      } else if (kind === 'fish') {
        ice.push({ x, y: 0.9, z });
        for (let k = 0; k < 9; k++) fish.push({ x: x + (R() - 0.5) * 0.7, y: 0.99, z: z - 0.9 + k * 0.22, ry: R() * 0.8 - 0.4, color: R() < 0.5 ? 0xb9c4cc : 0x8fa3b0 });
      } else if (kind === 'meat') {
        racks.push({ x, y: 1.95, z });
        for (let k = 0; k < 5; k++) meat.push({ x, y: 1.55 - R() * 0.15, z: z - 0.85 + k * 0.42, sy: 1 + R() * 0.6, color: R() < 0.5 ? 0x9c2b25 : 0xb5463c });
        for (let k = 0; k < 4; k++) meat.push({ x: x + (R() - 0.5) * 0.5, y: 0.93, z: z - 0.7 + k * 0.45, sx: 1.6, sy: 0.35, color: 0xa83a30 });
      } else {
        for (let k = 0; k < 5; k++) sacks.push({ x: x + (k % 2 ? 0.25 : -0.25), y: 1.08, z: z - 0.8 + k * 0.4, color: [0xe9dcc0, 0xc98a3a, 0x8a5a2a, 0xd9c36a, 0xb23a2b][k] });
      }
    };
    const kinds = ['veg', 'veg', 'fish', 'veg', 'meat', 'veg', 'spice', 'veg'];
    let stallNo = 0;
    for (const [x, face] of [[141, 1], [151, -1], [157, 1], [167, -1]]) {
      for (let z = 326; z < 588; z += 5.2) stall(x, z, face, kinds[stallNo++ % kinds.length]);
    }
    // Quelques étals entre les halles et les petits pavillons
    for (let z = 397; z < 586; z += 17) stall(44.5, z, 1, kinds[stallNo++ % kinds.length]);   // jamais devant un passage entre halles

    instanced(new THREE.BoxGeometry(1.1, 0.84, 2.2), M.wood, stallTables);
    instanced(new THREE.BoxGeometry(0.48, 0.26, 0.6), lam(0xb08a5a), crates, false);
    instanced(new THREE.BoxGeometry(0.42, 0.1, 0.54), lam(0xffffff), produce, false);
    instanced(new THREE.BoxGeometry(1, 0.14, 2.1), lam(0xeef4f7), ice, false);
    const fishGeo = new THREE.SphereGeometry(0.11, 8, 6); fishGeo.scale(2.6, 0.5, 1);
    instanced(fishGeo, lam(0xffffff), fish, false);
    instanced(new THREE.BoxGeometry(0.22, 0.42, 0.26), lam(0xffffff), meat, false);
    instanced(new THREE.BoxGeometry(0.06, 0.06, 2.2), M.iron, racks, false);
    instanced(new THREE.CylinderGeometry(0.2, 0.17, 0.44, 10), lam(0xffffff), sacks, false);

    // Mobilier commun
    instanced(new THREE.BoxGeometry(0.42, 0.05, 0.42), M.wood, seats, false);
    instanced(new THREE.BoxGeometry(0.42, 0.5, 0.04), M.wood, backs, false);
    instanced(new THREE.BoxGeometry(0.4, 0.44, 0.04), M.iron, legs, false);
    instanced(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 14), M.white, tableTops);
    instanced(new THREE.CylinderGeometry(0.04, 0.06, 0.74, 6), M.iron, tableLegs, false);
    instanced(new THREE.ConeGeometry(1.5, 0.55, 10), lam(0xffffff), parasolTops);
    instanced(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 5), M.wood, parasolPoles, false);
  }

  // ---------- Maisons de la ville et des collines ----------
  {
    const bodies = [], roofs = [];
    const tones = era === 1950
      ? [0xd9c9a6, 0xc7a98a, 0xa9654a, 0xcdbb98, 0xb98a6a]
      : [0xf0e4c8, 0xe7c3b0, 0xb5654a, 0xead9b8, 0xd9a58a, 0xf2efe6];
    // ---- Rues réelles (OpenStreetMap) : rubans posés sur le terrain ----
    const WIDTH = { p: 13, s: 10, t: 8, r: 6.5, f: 6, x: 5 };
    const X0 = -450, Z0 = -490, CELL = 4, NX = 225, NZ = 315;
    const occ = new Uint8Array(NX * NZ);                          // cellules occupées par une rue
    const mark = (x, z, r) => {
      for (let i = Math.floor((x - r - X0) / CELL); i <= (x + r - X0) / CELL; i++) for (let j = Math.floor((z - r - Z0) / CELL); j <= (z + r - Z0) / CELL; j++) {
        if (i >= 0 && j >= 0 && i < NX && j < NZ) occ[j * NX + i] = 1;
      }
    };
    const onStreet = (x, z) => { const i = Math.floor((x - X0) / CELL), j = Math.floor((z - Z0) / CELL); return i < 0 || j < 0 || i >= NX || j >= NZ || occ[j * NX + i] === 1; };
    const inPaved = (x, z) => (Math.abs(x) < 48 && z > -378 && z < 622) || (x > 0 && x < 180 && z > 308 && z < 596);
    const nearStairs = (x, z, m) => [STAIRS.west, STAIRS.east].some((st) => { const [d, lat] = stairCoords(x, z, st); return lat < m && d > -6 && d < st.run + 6; });
    const quads = [], quadsSteps = [], pedPos = [], pedUv = [];
    // En 2050, les rues qui mènent au palais et aux tunnels deviennent des allées
    // piétonnes aménagées : dallage clair, lampadaires, bancs et platanes.
    const pedZone = (x, z) => era === 2050 && ((x < -128 && z > 425 && z < 650) || (z > 598 && Math.abs(x) < 130));
    const inGarden = (x, z) => (x > -184 && x < -160 && z > 461 && z < 483) || (Math.abs(x) < 42 && z > 652 && z < 745);
    const inBuilt = (x, z) => (x > -392 && x < -318 && z > 525 && z < 606) || (x > -262 && x < -186 && z > 572 && z < 616) || (x > -238 && x < -198 && z > 458 && z < 506);
    for (const s of STREETS) {
      if (/^Tunnel/.test(s.n)) continue;                          // partie souterraine : pas de ruban en surface
      const hw = WIDTH[s.c] / 2;
      let run = 0, side = 1;
      for (let i = 1; i < s.pts.length; i++) {
        const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i];
        const len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        const nx = -(bz - az) / len * hw, nz = (bx - ax) / len * hw, parts = Math.max(1, Math.ceil(len / 10));
        for (let k = 0; k < parts; k++) {
          const t0 = k / parts, t1 = (k + 1) / parts;
          const p0x = ax + (bx - ax) * t0, p0z = az + (bz - az) * t0, p1x = ax + (bx - ax) * t1, p1z = az + (bz - az) * t1;
          const mxp = (p0x + p1x) / 2, mzp = (p0z + p1z) / 2;
          mark(mxp, mzp, hw + 2.5);
          const seg = len / parts, prev = run; run += seg;
          if (inPaved(mxp, mzp) || inGarden(mxp, mzp) || nearStairs(mxp, mzp, 8) || Math.abs(mxp) > 445 || mzp < -485 || mzp > 765) continue;
          const y0 = Math.max(0, groundHeight(p0x, p0z)) + 0.16, y1 = Math.max(0, groundHeight(p1x, p1z)) + 0.16;
          const ped = s.c !== 'x' && pedZone(mxp, mzp), k2 = ped ? (hw + 1) / hw : 1;
          const a = [p0x + nx * k2, y0, p0z + nz * k2], b = [p0x - nx * k2, y0, p0z - nz * k2], c2 = [p1x - nx * k2, y1, p1z - nz * k2], d2 = [p1x + nx * k2, y1, p1z + nz * k2];
          if (ped) {
            const U = (hw + 1) * 2 / 3, v0 = prev / 3, v1 = run / 3;
            pedPos.push(...a, ...c2, ...b, ...a, ...d2, ...c2);
            pedUv.push(0, v0, U, v1, U, v0, 0, v0, 0, v1, U, v1);
            // Mobilier : un lampadaire tous les 16 m en alternant les côtés, un banc et un platane sur deux
            if (Math.floor(run / 16) > Math.floor(prev / 16)) {
              side = -side;
              const ex = nx / hw, ez = nz / hw, off = hw + 1.8;
              const lx = p1x + ex * off * side, lz = p1z + ez * off * side;
              if (!inBuilt(lx, lz) && !onStreet(lx, lz)) {
                lamps.push({ x: lx, y: Math.max(0, groundHeight(lx, lz)), z: lz });
                if (Math.floor(run / 32) > Math.floor(prev / 32)) {
                  benches.push({ x: p1x + ex * (off - 0.7) * side, y: y1 + 0.3, z: p1z + ez * (off - 0.7) * side - 2 * ex, ry: Math.atan2(ex, -ez) });
                  const tx = p1x - ex * (off + 1.5) * side, tz = p1z - ez * (off + 1.5) * side;
                  if (!inBuilt(tx, tz) && !onStreet(tx, tz)) trees.push({ x: tx, z: tz, s: 0.95 + R() * 0.25 });
                }
              }
            }
          } else (s.c === 'x' ? quadsSteps : quads).push(...a, ...c2, ...b, ...a, ...d2, ...c2);
        }
      }
    }
    for (const [list, color] of [[quads, era === 1950 ? 0x857a6c : 0x77777a], [quadsSteps, 0x5c5c5e]]) {
      if (!list.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(list, 3));
      geo.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      add(new THREE.Mesh(geo, mat), false, true);
    }
    if (pedPos.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pedPos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(pedUv, 2));
      geo.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ map: pedTex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      add(new THREE.Mesh(geo, mat), false, true);
    }
    // Lampadaires à globe et bancs
    instanced(new THREE.CylinderGeometry(0.05, 0.08, 4.2, 6), M.iron, lamps.map((l) => ({ x: l.x, y: l.y + 2.1, z: l.z })), false);
    instanced(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d8 }), lamps.map((l) => ({ x: l.x, y: l.y + 4.4, z: l.z })), false);
    instanced(new THREE.BoxGeometry(1.9, 0.12, 0.55), M.wood, benches, false);
    instanced(new THREE.BoxGeometry(1.9, 0.3, 0.08), M.iron, benches.map((b) => ({ ...b, y: b.y - 0.2 })), false);

    // ---- Maisons : dans les îlots, jamais sur une rue ----
    // Ville basse et plate derrière les arcades (on n'en voit que les toits),
    // maisons plus hautes et dispersées sur les collines du sud.
    const fs = mobile ? 16 : 12;
    const reserved = (x, z) => inPaved(x, z)
      || (Math.abs(x) < 50 && z > -380 && z < 625)
      || (Math.abs(x) < 150 && z < -362)                          // emprise ferroviaire
      || (x > 44 && x < 92 && z > -62 && z < 24)                  // Mairie
      || (x > -205 && x < -130 && z > 440 && z < 502)             // jardin d'Antaninarenina
      || (x > -400 && x < -280 && z > 510 && z < 622)             // palais, grille, bassin
      || (x > -262 && x < -186 && z > 572 && z < 616)             // hôtel Colbert
      || (x > -238 && x < -196 && z > 456 && z < 508)             // hôtel Le Louvre
      || TUNNELS.some((t) => segDist(x, z, t.from[0], t.from[1], t.at[0], t.at[1]) < 24)
      || (Math.abs(x - 300) < 16 && Math.abs(z - 335) < 24)       // église
      || (Math.abs(x) < 62 && z > 640)                            // Ambohijatovo
      || nearStairs(x, z, 19);
    for (let gx = -438; gx <= 438; gx += fs) for (let gz = -476; gz <= 752; gz += fs) {
      const hill = groundHeight(gx, gz) > 1;
      if (hill ? R() > 0.8 : R() > 0.95) continue;
      const x = hill ? gx + (R() - 0.5) * 5 : gx, z = hill ? gz + (R() - 0.5) * 5 : gz;
      const w = hill ? 6.5 + R() * 3 : fs - 1.4, d = hill ? 6.5 + R() * 3 : fs - 1.4;
      if (reserved(x, z)) continue;
      if (onStreet(x, z) || onStreet(x - w / 2, z - d / 2) || onStreet(x + w / 2, z - d / 2) || onStreet(x - w / 2, z + d / 2) || onStreet(x + w / 2, z + d / 2)) continue;
      const y = Math.max(0, groundHeight(x, z));
      const h = hill ? (y > 4 ? 6 : 5) + R() * 5 : 4.2 + R() * 3.6;
      bodies.push({ x, y: y + h / 2 - (hill ? 1 : 0), z, sx: w, sy: h + (hill ? 2 : 0), sz: d, color: tones[(R() * tones.length) | 0] });
      roofs.push({ x, y: y + h + 1.15, z, sx: Math.max(w, d) * 0.75, sy: hill ? 2.6 : 2.2, sz: Math.max(w, d) * 0.75, ry: Math.PI / 4, color: R() < 0.15 ? 0x6d6f73 : P.roof });
      solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y - 3, y + h + 2.5);
    }
    instanced(new THREE.BoxGeometry(1, 1, 1), lam(0xffffff), bodies, !mobile);
    instanced(new THREE.ConeGeometry(1, 1, 4), lam(0xffffff), roofs, false);
  }

  // ---------- Arbres ----------
  {
    // Platanes : tronc clair élancé, quelques branches, houppier léger fait de
    // plusieurs petites masses de feuillage irrégulières. Trois silhouettes.
    const barkTex = canvasTex(64, 128, (c, w, h) => {
      c.fillStyle = '#b9b29a'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        c.fillStyle = ['#d9d3bd', '#8f9478', '#a39a80', '#c7c0a6', '#7d8468'][(R() * 5) | 0];
        c.beginPath(); c.ellipse(R() * w, R() * h, 3 + R() * 7, 5 + R() * 11, R() * 3, 0, 6.3); c.fill();
      }
    });
    const barkMat = lam(0xffffff, barkTex);
    const leafMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const greens = [[0.36, 0.52, 0.24], [0.42, 0.58, 0.27], [0.31, 0.47, 0.22], [0.47, 0.6, 0.3]];
    const makeTree = (seed) => {
      const T = rng(seed), wood = [], leaves = [];
      const trunk = new THREE.CylinderGeometry(0.11, 0.2, 4.4, 7); trunk.translate(0, 2.2, 0); wood.push(trunk);
      const n = 4 + ((T() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + T() * 0.8, reach = 0.9 + T() * 1.1, hy = 4.2 + T() * 1.6;
        const br = new THREE.CylinderGeometry(0.035, 0.075, reach * 1.5, 5);
        br.translate(0, reach * 0.75, 0); br.rotateZ(-0.75 - T() * 0.35); br.rotateY(a); br.translate(0, 3.5 + T() * 0.5, 0);
        wood.push(br);
        const blob = new THREE.IcosahedronGeometry(0.75 + T() * 0.5, 1);
        const p = blob.attributes.position;
        blob.scale(0.9 + T() * 0.4, 0.6 + T() * 0.25, 0.9 + T() * 0.4);
        blob.translate(Math.sin(a) * reach, hy, Math.cos(a) * reach);
        const tone = greens[(T() * greens.length) | 0], cols = new Float32Array(p.count * 3);
        for (let k = 0; k < p.count; k++) { const sh = 0.8 + 0.35 * T(); cols[k * 3] = tone[0] * sh; cols[k * 3 + 1] = tone[1] * sh; cols[k * 3 + 2] = tone[2] * sh; }
        blob.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        leaves.push(blob);
      }
      const top = new THREE.IcosahedronGeometry(0.9, 1); top.scale(1, 0.7, 1); top.translate(0, 6, 0);
      const tc = new Float32Array(top.attributes.position.count * 3);
      for (let k = 0; k < tc.length; k += 3) { const sh = 0.85 + 0.3 * T(); tc[k] = greens[1][0] * sh; tc[k + 1] = greens[1][1] * sh; tc[k + 2] = greens[1][2] * sh; }
      top.setAttribute('color', new THREE.BufferAttribute(tc, 3)); leaves.push(top);
      return { wood: mergeGeometries(wood), leaves: mergeGeometries(leaves) };
    };
    const variants = [makeTree(3), makeTree(17), makeTree(41)];
    const lists = variants.map(() => []);
    trees.forEach((t, i) => {
      const y = Math.max(0, groundHeight(t.x, t.z));
      lists[i % 3].push({ x: t.x, y, z: t.z, sx: t.s, sy: t.s * (0.92 + R() * 0.2), sz: t.s, ry: R() * 6.283 });
    });
    variants.forEach((v, i) => { instanced(v.wood, barkMat, lists[i]); instanced(v.leaves, leafMat, lists[i]); });
  }

  // ---------- 1950 : voitures et parasols du Zoma ----------
  if (era === 1950) {
    const carTones = [0x1b1b1d, 0x2a2c2e, 0x6d6f6a, 0xd8cfb8, 0x3d4a3a, 0x5a2e28];
    const cars = [];
    for (let i = 0; i < 8; i++) cars.push({ x: i % 2 ? 17 : -17, z: -260 + i * 55, dir: i % 2 ? -1 : 1, speed: 4 + R() * 3 });
    for (let z = -265; z < 235; z += 28) for (const s of [-1, 1]) if (R() < 0.7) cars.push({ x: s * 27.5, z: z + R() * 8, dir: s, speed: 0 });
    const bodyGeo = new THREE.BoxGeometry(1.7, 0.85, 4.3), cabGeo = new THREE.BoxGeometry(1.5, 0.75, 2.1);
    const bodyM = new THREE.InstancedMesh(bodyGeo, lam(0xffffff), cars.length);
    const cabM = new THREE.InstancedMesh(cabGeo, lam(0xffffff), cars.length);
    const place = (i) => {
      const c = cars[i];
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.position.set(c.x, 0.75, c.z); dummy.updateMatrix(); bodyM.setMatrixAt(i, dummy.matrix);
      dummy.position.set(c.x, 1.5, c.z - c.dir * 0.3); dummy.updateMatrix(); cabM.setMatrixAt(i, dummy.matrix);
    };
    cars.forEach((c, i) => { place(i); const tone = col.set(carTones[(R() * carTones.length) | 0]); bodyM.setColorAt(i, tone); cabM.setColorAt(i, tone); });
    add(bodyM); add(cabM);
    movers.push((dt) => {
      for (let i = 0; i < 8; i++) {
        const c = cars[i];
        c.z += c.dir * c.speed * dt;
        if (c.z > 240) c.z = -275; if (c.z < -275) c.z = 240;
        place(i);
      }
      bodyM.instanceMatrix.needsUpdate = true; cabM.instanceMatrix.needsUpdate = true;
    });

    const tops = [], poles = [];
    // Parasols du Zoma sur l'avenue ; ceux du marché sont posés avec les étals
    for (let i = 0; i < (mobile ? 40 : 70); i++) {
      const onAvenue = true;
      const x = onAvenue ? (R() < 0.5 ? -1 : 1) * (9.5 + R() * 1.5) : 14 + R() * 160;
      const z = onAvenue ? 60 + R() * 200 : 312 + R() * 280;
      if (pavilionRects.some(([a, b, c2, d]) => x > a && x < b && z > c2 && z < d)) continue;
      tops.push({ x, y: 2.5, z, sx: 0.85 + R() * 0.4, sz: 0.85 + R() * 0.4 });
      poles.push({ x, y: 1.2, z });
    }
    instanced(new THREE.ConeGeometry(1.7, 0.7, 10), M.white, tops);
    instanced(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5), M.wood, poles, false);
  }

  return {
    group: g,
    boxes,
    spots,
    update(dt) { for (const m of movers) m(dt); },
    dispose() {
      g.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        for (const m of [o.material].flat()) if (m) { if (m.map && m.map.dispose) m.map.dispose(); m.dispose(); }
      });
    },
  };
}
