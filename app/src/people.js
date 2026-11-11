// Personnages provisoires (silhouettes instanciées). Ils seront remplacés par
// les modèles animés générés, sans changer les parcours définis ici.
import * as THREE from 'three';
import { groundHeight, STAIRS } from './world.js';

const W = STAIRS.west, E = STAIRS.east;
// [x1, z1, x2, z2, largeur, poids] — positions calées sur le plan réel
const COMMON = [
  [-10.6, -280, -10.6, 262, 0.8, 1.5],       // bords du jardin central (plus d'allée au milieu)
  [10.6, -280, 10.6, 262, 0.8, 1.5],
  [-34, -278, -34, 238, 1.2, 3],             // galerie de droite
  [34, -278, 34, -70, 1.2, 2],               // galerie de gauche, avant la Mairie
  [34, 28, 34, 280, 1.2, 2],                 // galerie de gauche, après la Mairie
  [1, 300, 1, 605, 4, 3],                    // avenue du 26 Juin
  [48, 350, 48, 585, 2.5, 3],                // allées du marché
  [72, 350, 72, 585, 1.5, 1.5],
  [92, 350, 92, 585, 1.5, 1.5],
  [112, 350, 112, 585, 1.5, 1.5],
  [6, 394, 186, 315, 3, 2],                  // allée en biais entre les deux escaliers
  [W.x0, W.z0, W.x1, W.z1, 3, 5],
  [E.x0, E.z0, E.x1, E.z1, 3, 3],
  [-138, 463, -185, 474, 5, 1],              // jardin d'Antaninarenina
  [-24, -334, 24, -334, 5, 1.5],             // parvis de la gare
  [146, 326, 146, 586, 1.4, 3],              // allées entre les étals du marché
  [162, 326, 162, 586, 1.4, 3],
  [0, 650, 0, 735, 12, 1],
];
const PATHS = {
  1950: [...COMMON, [-29.8, -278, -29.8, 238, 0.8, 2], [29.8, 28, 29.8, 280, 0.8, 2], [16, 330, 172, 330, 5, 2]],
  2050: [...COMMON, [-19, -278, -19, 240, 7, 4], [19, -278, 19, 240, 7, 4]],
};

const SKIN = [0x8d5a3b, 0x7a4a2e, 0xa06b47, 0x6b4028, 0x94603f];
const TOURIST_SKIN = [0xe3b594, 0xd9a988, 0xf0cba8];

// `spots` : personnages immobiles fournis par le décor (clients assis en
// terrasse ou sur un banc, marchands debout derrière leur étal).
export function createPeople(era, walkers, spots = []) {
  const count = walkers + spots.length;
  const group = new THREE.Group();
  const paths = PATHS[era];
  const totalWeight = paths.reduce((s, p) => s + p[5] * Math.hypot(p[2] - p[0], p[3] - p[1]), 0);
  const pickPath = () => {
    let r = Math.random() * totalWeight;
    for (const p of paths) { r -= p[5] * Math.hypot(p[2] - p[0], p[3] - p[1]); if (r <= 0) return p; }
    return paths[0];
  };

  const mat = () => new THREE.MeshLambertMaterial({ color: 0xffffff });
  const bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.22, 0.95, 3, 8), mat(), count);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 10, 8), mat(), count);
  const hats = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 10), mat(), count);
  for (const m of [bodies, heads, hats]) { m.castShadow = true; m.frustumCulled = false; group.add(m); }

  const col = new THREE.Color();
  const people = [];
  for (let i = 0; i < count; i++) {
    const spot = i >= walkers ? spots[i - walkers] : null;
    const p = spot ? [spot.x, spot.z, spot.x, spot.z + 1, 0, 0] : pickPath();
    const len = Math.hypot(p[2] - p[0], p[3] - p[1]);
    const idle = spot ? true : Math.random() < 0.14;
    const tourist = era === 2050 && Math.random() < 0.1;
    const colonial = era === 1950 && Math.random() < 0.05;
    const woman = Math.random() < 0.5;
    let cloth, hat = null;
    if (era === 1950) {
      if (colonial) { cloth = 0xd9cdb0; hat = 0xe9e2cf; }
      else if (woman) { cloth = 0xf2efe6; }                       // lamba blanc
      else { cloth = Math.random() < 0.7 ? 0x1d1d22 : 0x8b8370; hat = Math.random() < 0.75 ? (cloth === 0x1d1d22 ? 0x151517 : 0xd9c89a) : null; }
    } else {
      const tones = [0xf2efe6, 0xc9774a, 0x2f8f86, 0xd9b25c, 0x4b6cb7, 0xb23a2b, 0xe7e2d6, 0x6a9a5b, 0x8a6fc4];
      cloth = tones[(Math.random() * tones.length) | 0];
      if (tourist || Math.random() < 0.3) hat = 0xdcc99a;        // chapeau de paille
    }
    const skin = (tourist || colonial ? TOURIST_SKIN : SKIN)[(Math.random() * (tourist || colonial ? 3 : 5)) | 0];
    bodies.setColorAt(i, col.set(cloth));
    heads.setColorAt(i, col.set(skin));
    hats.setColorAt(i, col.set(hat ?? 0x000000));
    people.push({
      p, len, t: Math.random(), dir: Math.random() < 0.5 ? 1 : -1,
      off: (Math.random() - 0.5) * 2 * p[4], speed: idle ? 0 : 0.8 + Math.random() * 0.7,
      phase: Math.random() * 6.28, scale: 0.92 + Math.random() * 0.14, hat: hat !== null,
      // Pour le personnage animé qui remplace la silhouette quand le drone est proche
      era, woman, tourist: tourist || colonial, cloth, hatColor: hat, actor: null, x: 0, y: 0, z: 0, ry: 0,
      spot, pose: spot ? spot.pose : 'walk',
    });
    if (spot) { const q = people[people.length - 1]; q.t = 0; q.off = 0; q.dir = 1; }
  }

  const d = new THREE.Object3D();
  let time = 0;
  function update(dt) {
    time += dt;
    for (let i = 0; i < count; i++) {
      const q = people[i], p = q.p;
      q.t += (q.dir * q.speed * dt) / q.len;
      if (q.t > 1) { q.t = 1; q.dir = -1; } else if (q.t < 0) { q.t = 0; q.dir = 1; }
      const ux = (p[2] - p[0]) / q.len, uz = (p[3] - p[1]) / q.len;
      const x = p[0] + (p[2] - p[0]) * q.t - uz * q.off;
      const z = p[1] + (p[3] - p[1]) * q.t + ux * q.off;
      const y = Math.max(0, groundHeight(x, z)) + (q.speed ? Math.abs(Math.sin(time * 7 * q.speed + q.phase)) * 0.04 : 0);
      const ry = q.spot ? q.spot.ry : Math.atan2(ux * q.dir, uz * q.dir);
      const sit = q.pose === 'sit' ? 0.42 : 0;                    // assis : le corps descend à hauteur de siège
      q.x = x; q.z = z; q.ry = ry;
      q.y = (q.actor ? Math.max(0, groundHeight(x, z)) : y) - sit;   // le modèle animé a sa propre démarche
      d.rotation.set(0, ry, 0);
      d.scale.setScalar(q.actor ? 0 : q.scale);                   // silhouette masquée si un modèle animé la remplace
      d.position.set(x, y - sit * 0.8 + 0.72 * q.scale, z); d.updateMatrix(); bodies.setMatrixAt(i, d.matrix);
      d.position.set(x, y - sit * 0.8 + 1.52 * q.scale, z); d.updateMatrix(); heads.setMatrixAt(i, d.matrix);
      d.position.set(x, y - sit * 0.8 + 1.66 * q.scale, z);
      if (!q.hat) d.scale.setScalar(0);
      d.updateMatrix(); hats.setMatrixAt(i, d.matrix);
    }
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = hats.instanceMatrix.needsUpdate = true;
  }
  for (const m of [bodies, heads, hats]) m.instanceColor.needsUpdate = true;
  update(0);

  return {
    group, update, list: people,
    dispose() { for (const m of [bodies, heads, hats]) { m.geometry.dispose(); m.material.dispose(); } },
  };
}
