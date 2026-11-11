// Personnages animés proches du drone.
// Modèles et animations : Quaternius, « Universal Base Characters » et « Universal
// Animation Library », licence CC0 (voir public/models/LICENCE-Quaternius-CC0.txt).
// Les corps de base sont habillés par code : les zones du corps sont repérées
// d'après les os qui les animent (buste, bras, jambes, pieds) puis recolorées et
// légèrement épaissies ; chapeau, lamba et jupe sont des pièces ajoutées.
// Seuls les personnages les plus proches sont animés ; les autres restent des
// silhouettes simples (voir people.js).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const TOP = /^(spine_0[123]|clavicle|upperarm)/, FORE = /^lowerarm/, BOTTOM = /^(pelvis|thigh|calf)/, SHOE = /^(foot|ball)/;
const HEIGHT = { m: 1.74, f: 1.63 };

// « Tailleur » : prépare, pour chaque sommet du corps de base,
//  - mask    : (haut, bas, chaussures, avant-bras), d'après les os dominants ;
//  - garment : le déplacement qui transforme le corps en vêtement. Les jambes et
//    les bras sont ramenés à un rayon de jambe de pantalon ou de manche autour
//    de l'os (plus de mollets ni de biceps dessinés), le buste est épaissi ;
//  - detail  : (plastron de chemise, ceinture, basque de veste).
// `unit` = taille du modèle en unités natives, rapportée à 1,80 m.
function tailor(mesh, unit) {
  const g = mesh.geometry, pos = g.attributes.position, nor = g.attributes.normal;
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = mesh.skeleton.bones;
  const cat = bones.map((b) => (TOP.test(b.name) ? 0 : BOTTOM.test(b.name) ? 1 : SHOE.test(b.name) ? 2 : FORE.test(b.name) ? 3 : 4));
  mesh.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  const bp = bones.map((b) => b.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv));
  const idx = (name) => bones.findIndex((b) => b.name === name);
  const limbs = {};
  for (const s of ['l', 'r']) {
    limbs[idx('thigh_' + s)] = { a: bp[idx('thigh_' + s)], b: bp[idx('calf_' + s)], r0: 0.128, r1: 0.108 };
    limbs[idx('calf_' + s)] = { a: bp[idx('calf_' + s)], b: bp[idx('foot_' + s)], r0: 0.108, r1: 0.094 };
    limbs[idx('upperarm_' + s)] = { a: bp[idx('upperarm_' + s)], b: bp[idx('lowerarm_' + s)], r0: 0.074, r1: 0.064 };
    limbs[idx('lowerarm_' + s)] = { a: bp[idx('lowerarm_' + s)], b: bp[idx('hand_' + s)], r0: 0.064, r1: 0.055 };
  }
  const pelvis = idx('pelvis'), yP = bp[pelvis].y, yNeck = bp[idx('neck_01')].y, zChest = bp[idx('spine_03')].z;
  const mask = new Float32Array(pos.count * 4), garment = new Float32Array(pos.count * 3), detail = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), d = new THREE.Vector3(), out = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const w = [0, 0, 0, 0, 0];
    let lead = -1, leadW = 0, torso = 0;
    p.fromBufferAttribute(pos, i); out.set(0, 0, 0);
    for (let k = 0; k < 4; k++) {
      const bi = si.getComponent(i, k), wt = sw.getComponent(i, k);
      if (wt <= 0) continue;
      w[cat[bi]] += wt;
      if (wt > leadW) { leadW = wt; lead = bi; }
      const L = limbs[bi];
      if (L) {
        ab.subVectors(L.b, L.a);
        const t = THREE.MathUtils.clamp(d.subVectors(p, L.a).dot(ab) / ab.lengthSq(), 0, 1);
        c.copy(L.a).addScaledVector(ab, t);
        const r = d.subVectors(p, c).length();
        const target = Math.max(r + 0.012 * unit, THREE.MathUtils.lerp(L.r0, L.r1, t) * unit);
        if (r > 1e-5) out.addScaledVector(d, ((target - r) / r) * wt);
      } else if (cat[bi] < 2) torso += wt;
    }
    out.x += nor.getX(i) * 0.03 * unit * torso; out.y += nor.getY(i) * 0.03 * unit * torso; out.z += nor.getZ(i) * 0.03 * unit * torso;
    garment[i * 3] = out.x; garment[i * 3 + 1] = out.y; garment[i * 3 + 2] = out.z;
    const best = w.indexOf(Math.max(...w));
    if (best < 4) mask[i * 4 + best] = 1;
    // Plastron en V sous le cou, ceinture à la taille, basque de veste sur les hanches
    if (best === 0 && p.z > zChest + 0.02 * unit && p.y < yNeck + 0.03 * unit && Math.abs(p.x) < Math.max(0, p.y - (yNeck - 0.21 * unit)) * 0.34) detail[i * 3] = 1;
    if (best === 1 && p.y > yP + 0.045 * unit) detail[i * 3 + 1] = 1;
    if (best === 1 && lead === pelvis && p.y > yP - 0.1 * unit) detail[i * 3 + 2] = 1;
  }
  g.setAttribute('mask', new THREE.BufferAttribute(mask, 4));
  g.setAttribute('garment', new THREE.BufferAttribute(garment, 3));
  g.setAttribute('detail', new THREE.BufferAttribute(detail, 3));
  g.userData.neck = new THREE.Vector3(yNeck, zChest, unit);   // repères du plastron, lus par le matériau
}

function bodyMaterial(map, neck) {
  const u = {
    uNeck: { value: neck },
    uTop: { value: new THREE.Color(0xffffff) }, uBottom: { value: new THREE.Color(0x333333) },
    uShoe: { value: new THREE.Color(0x1b1b1d) }, uSleeve: { value: 0 },
    uLoose: { value: 1 }, uJacket: { value: 0 }, uShirtOn: { value: 0 }, uBeltOn: { value: 0 },
    uShirt: { value: new THREE.Color(0xf4f1e8) }, uBelt: { value: new THREE.Color(0x2a211b) }, uSkin: { value: new THREE.Color(1, 1, 1) },
  };
  const m = new THREE.MeshLambertMaterial({ map });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    // Sur les zones habillées, la normale est ramenée vers l'horizontale : le tissu
    // prend la lumière comme un vêtement, sans dessiner la musculature du corps de base.
    sh.vertexShader = 'attribute vec4 mask;\nattribute vec3 garment;\nattribute vec3 detail;\nvarying vec4 vMask;\nvarying vec3 vDetail;\nvarying vec3 vObj;\nuniform float uSleeve;\nuniform float uLoose;\nuniform float uJacket;\n' + sh.vertexShader.replace(
      '#include <beginnormal_vertex>',
      '#include <beginnormal_vertex>\n  float cloth = mask.x + mask.y + mask.w * uSleeve;\n  vec3 rawNormal = objectNormal;\n  objectNormal = normalize(mix(objectNormal, normalize(vec3(objectNormal.x, 0.0, objectNormal.z) + 1e-4), 0.8 * cloth));',
    ).replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vMask = mask;\n  vDetail = detail;\n  vObj = position;\n  transformed += garment * cloth * uLoose + rawNormal * (0.006 * mask.z + 0.022 * detail.z * uJacket);',
    );
    sh.fragmentShader = 'varying vec4 vMask;\nvarying vec3 vDetail;\nvarying vec3 vObj;\nuniform vec3 uNeck;\nuniform vec3 uTop;\nuniform vec3 uBottom;\nuniform vec3 uShoe;\nuniform vec3 uShirt;\nuniform vec3 uBelt;\nuniform vec3 uSkin;\nuniform float uSleeve;\nuniform float uJacket;\nuniform float uShirtOn;\nuniform float uBeltOn;\n' + sh.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
  diffuseColor.rgb = min(diffuseColor.rgb * uSkin, vec3(1.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, uTop, step(0.5, vMask.x + vMask.w * uSleeve));
  diffuseColor.rgb = mix(diffuseColor.rgb, uBottom, step(0.5, vMask.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, uBelt, step(0.5, vDetail.y) * uBeltOn);
  diffuseColor.rgb = mix(diffuseColor.rgb, uTop, step(0.5, vDetail.z) * uJacket);
  // Plastron de chemise en V sous le cou, avec une cravate sombre au milieu
  float vUp = vObj.y - (uNeck.x - 0.2 * uNeck.z);
  float inV = step(abs(vObj.x), max(0.0, vUp) * 0.3) * step(uNeck.y + 0.02 * uNeck.z, vObj.z) * step(vObj.y, uNeck.x + 0.04 * uNeck.z) * step(0.5, vMask.x) * uShirtOn;
  diffuseColor.rgb = mix(diffuseColor.rgb, uShirt, inV);
  diffuseColor.rgb = mix(diffuseColor.rgb, uBelt, inV * step(abs(vObj.x), 0.014 * uNeck.z));
  diffuseColor.rgb = mix(diffuseColor.rgb, uShoe, step(0.5, vMask.z));`,
    );
  };
  m.customProgramCacheKey = () => 'actor-body';
  m.userData.u = u;
  return m;
}

// Les textures de cheveux sont en niveaux de gris : on les teinte en noir.
const hairCache = new Map();
function hairMat(src) {
  if (!hairCache.has(src)) hairCache.set(src, new THREE.MeshLambertMaterial({ map: src.map, color: 0x241c17, alphaTest: src.alphaTest || (src.transparent ? 0.4 : 0), side: THREE.DoubleSide }));
  return hairCache.get(src);
}

const quatOnly = (clip) => new THREE.AnimationClip(clip.name, clip.duration, clip.tracks.filter((t) => t.name.endsWith('.quaternion') && !t.name.startsWith('root.')));

export function createActors(scene, count) {
  const group = new THREE.Group();
  scene.add(group);
  const blobGeo = new THREE.CircleGeometry(0.34, 16);
  const blobMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
  let frameNo = 0;
  const actors = [];
  const api = { group, ready: false, sync, reset, actors };
  const loader = new GLTFLoader();
  const files = ['homme', 'femme', 'cheveux-courts', 'cheveux-raie', 'cheveux-chignons', 'cheveux-longs'].map((n) => loader.loadAsync(`/models/${n}.gltf`));

  Promise.all([loader.loadAsync('/models/animations.glb'), ...files]).then(([anim, man, woman, hShort, hParted, hBuns, hLong]) => {
    const clips = {};
    for (const c of anim.animations) clips[c.name] = quatOnly(c);
    const skinned = (gltf) => { let r = null; gltf.scene.traverse((o) => { if (o.isSkinnedMesh && !r) r = o; }); return r; };
    const hairs = { m: [skinned(hShort), skinned(hParted)], f: [skinned(hBuns), skinned(hLong)] };

    const template = (gltf, sex) => {
      gltf.scene.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
      let body = null;
      gltf.scene.traverse((o) => { if (o.isSkinnedMesh && /Superhero/.test(o.material.name)) body = o; });
      tailor(body, size.y / 1.8);
      return { scene: gltf.scene, bodyName: body.name, scale: HEIGHT[sex] / size.y, map: body.material.map };
    };
    const T = { m: template(man, 'm'), f: template(woman, 'f') };

    for (let i = 0; i < count; i++) {
      const sex = i % 2 ? 'f' : 'm', t = T[sex];
      const root = new THREE.Group(); root.visible = false; group.add(root);
      const model = SkeletonUtils.clone(t.scene);
      // Carrure affinée : les corps de base sont très athlétiques
      model.scale.set(t.scale * (sex === 'm' ? 0.84 : 0.9), t.scale, t.scale * 0.92);
      root.add(model);
      let body = null;
      model.traverse((o) => {
        if (!o.isSkinnedMesh) return;
        o.castShadow = false; o.frustumCulled = false;            // ombre portée remplacée par un disque sombre au sol (bien moins coûteux)
        if (o.name === t.bodyName) { body = o; o.material = bodyMaterial(t.map, o.geometry.userData.neck); }
        else if (/Hair/.test(o.material.name)) o.material = hairMat(o.material);   // sourcils, barbe
      });
      // Coiffures liées au même squelette
      const hair = hairs[sex].map((h) => {
        const m = new THREE.SkinnedMesh(h.geometry, hairMat(h.material));
        m.bind(body.skeleton, h.bindMatrix); m.frustumCulled = false;
        body.parent.add(m);
        return m;
      });
      const bone = (name) => body.skeleton.bones.find((b) => b.name === name);
      // Pièces ajoutées : chapeau, lamba, jupe
      const hatMat = new THREE.MeshLambertMaterial({ color: 0x151517 });
      const hat = new THREE.Group();
      hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.104, 0.11, 14), hatMat));
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.014, 18), hatMat); brim.position.y = -0.05; hat.add(brim);
      // Lamba : étoffe drapée sur les épaules, ouverte devant
      const lamba = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.235, 0.36, 18, 1, true, 0.45, Math.PI * 2 - 0.9), new THREE.MeshLambertMaterial({ color: 0xf4f1e8, side: THREE.DoubleSide }));
      const skirtMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      // Jupe longue et ample : assez large en bas pour couvrir la jambe qui avance
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.43, 0.88, 18, 1, true), skirtMat);
      for (const o of [hat, lamba, skirt]) root.add(o);
      const blob = new THREE.Mesh(blobGeo, blobMat); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; root.add(blob);
      const mixer = new THREE.AnimationMixer(model);
      const actions = {};
      for (const n of ['Walk_Loop', 'Walk_Formal_Loop', 'Idle_Loop', 'Idle_Talking_Loop', 'Sitting_Idle_Loop', 'Sitting_Talking_Loop']) actions[n] = mixer.clipAction(clips[n]);
      actors.push({ sex, root, model, body, hair, hat, hatMat, lamba, skirt, skirtMat, blob, mixer, actions, current: null, person: null, acc: 0, slot: i, head: bone('Head'), spine: bone('spine_03'), pelvis: bone('pelvis') });
    }
    api.ready = true;
  }).catch((e) => console.error('Personnages animés indisponibles :', e));

  function dress(a, q) {
    const u = a.body.material.userData.u;
    const neutral = [0x39424e, 0x6b5a45, 0xd9d2c0, 0x2f3338, 0x7a6a55];
    u.uTop.value.set(q.cloth);
    u.uBottom.value.set(q.era === 1950 || q.woman ? q.cloth : neutral[(q.phase * 7 | 0) % neutral.length]);
    u.uSleeve.value = q.era === 1950 || q.phase > 3 ? 1 : 0;
    u.uShoe.value.set(q.woman && q.era === 2050 ? 0x8a6a48 : 0x1b1b1d);
    const suit = q.era === 1950 && !q.woman;                     // costume : veste à basque, plastron de chemise
    u.uLoose.value = suit ? 1.18 : 1;
    u.uJacket.value = suit ? 1 : 0;
    u.uShirtOn.value = suit ? 1 : 0;
    u.uBeltOn.value = !q.woman && q.era === 2050 ? 1 : 0;
    if (q.tourist) u.uSkin.value.setRGB(1.95, 1.72, 1.62); else u.uSkin.value.setRGB(1, 1, 1);
    a.hat.visible = q.hatColor !== null; if (a.hat.visible) a.hatMat.color.set(q.hatColor);
    a.lamba.visible = q.woman && !q.tourist && (q.era === 1950 || q.phase < 2);
    a.skirt.visible = q.woman && q.pose !== 'sit'; a.skirtMat.color.set(q.cloth);   // assise : la robe est peinte sur les jambes
    const style = q.woman ? (q.era === 1950 || q.phase < 3 ? 0 : 1) : (q.phase < 3 ? 0 : 1);
    a.hair.forEach((h, i) => { h.visible = i === style; });
    const name = q.pose === 'sit' ? (q.phase > 3 ? 'Sitting_Talking_Loop' : 'Sitting_Idle_Loop')
      : q.speed ? (q.era === 1950 ? 'Walk_Formal_Loop' : 'Walk_Loop') : (q.phase > 3 ? 'Idle_Talking_Loop' : 'Idle_Loop');
    if (a.current) a.current.stop();
    a.current = a.actions[name]; a.current.reset(); a.current.time = q.phase; a.current.timeScale = q.speed ? q.speed / 1.15 : 1; a.current.play();
  }

  const v = new THREE.Vector3();
  let timer = 0;
  function sync(people, cam, dt) {
    if (!api.ready) return;
    timer -= dt;
    if (timer <= 0) {
      timer = 0.35;
      // Les plus proches du drone, dans la limite du nombre d'acteurs de chaque sexe
      const near = [];
      for (const q of people) { const d = (q.x - cam.x) ** 2 + (q.z - cam.z) ** 2 + (q.y - cam.y) ** 2; if (d < 55 * 55) near.push([d, q]); }
      near.sort((a, b) => a[0] - b[0]);
      const quota = { m: count / 2 | 0, f: count - (count / 2 | 0) }, keep = new Set();
      for (const [, q] of near) { const s = q.woman ? 'f' : 'm'; if (quota[s] > 0) { quota[s]--; keep.add(q); } }
      for (const a of actors) if (a.person && !keep.has(a.person)) { a.person.actor = null; a.person = null; a.root.visible = false; }
      for (const q of keep) if (!q.actor) {
        const a = actors.find((x) => !x.person && x.sex === (q.woman ? 'f' : 'm'));
        if (!a) continue;
        a.person = q; q.actor = a; a.root.visible = true; dress(a, q);
      }
    }
    frameNo++;
    for (const a of actors) {
      const q = a.person; if (!q) continue;
      a.root.position.set(q.x, q.y, q.z); a.root.rotation.y = q.ry; a.root.scale.setScalar(q.scale);
      a.blob.position.y = 0.03 + (q.pose === 'sit' ? 0.42 / q.scale : 0);
      // Au-delà de 18 m, l'animation n'est recalculée qu'une image sur trois
      a.acc += dt;
      const far = (q.x - cam.x) ** 2 + (q.z - cam.z) ** 2 > 18 * 18;
      if (far && (frameNo + a.slot) % 3) continue;
      a.mixer.update(a.acc); a.acc = 0;
      a.root.updateMatrixWorld(true);
      a.root.worldToLocal(a.head.getWorldPosition(v)); a.hat.position.set(v.x, v.y + 0.168, v.z + 0.015);
      a.root.worldToLocal(a.spine.getWorldPosition(v)); a.lamba.position.set(v.x, v.y - 0.03, v.z);
      a.root.worldToLocal(a.pelvis.getWorldPosition(v)); a.skirt.position.set(v.x, v.y - 0.4, v.z + 0.03);
    }
  }
  function reset() { for (const a of actors) { if (a.person) a.person.actor = null; a.person = null; a.root.visible = false; } timer = 0; }
  return api;
}
