// Copie dans app/public/models les fichiers utiles des packs Quaternius (CC0),
// en ne gardant que la texture de couleur (pas de normal map ni de rugosité)
// pour alléger le chargement.
// Usage : node prepare.mjs   (depuis assets/personnages)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(here, 'base', 'Universal Base Characters[Standard]');
const chars = path.join(base, 'Base Characters', 'Godot - UE');
const hair = path.join(base, 'Hairstyles', 'Rigged to Head Bone', 'glTF (Godot -Unreal)');
const out = path.join(here, '..', '..', 'app', 'public', 'models');
fs.mkdirSync(out, { recursive: true });

const used = new Set();
function convert(srcDir, file, name) {
  const j = JSON.parse(fs.readFileSync(path.join(srcDir, file), 'utf8'));
  for (const m of j.materials || []) {
    delete m.normalTexture; delete m.occlusionTexture;
    if (m.pbrMetallicRoughness) delete m.pbrMetallicRoughness.metallicRoughnessTexture;
  }
  // Ne garder que les images encore référencées
  const keepTex = new Set((j.materials || []).map((m) => m.pbrMetallicRoughness?.baseColorTexture?.index).filter((v) => v !== undefined));
  const keepImg = new Set([...keepTex].map((t) => j.textures[t].source));
  (j.images || []).forEach((im, i) => {
    if (!keepImg.has(i)) { im.uri = 'blank.png'; return; }
    const real = fs.existsSync(path.join(srcDir, im.uri)) ? im.uri : im.uri.replace('_png.png', '.png');
    fs.copyFileSync(path.join(srcDir, real), path.join(out, real)); used.add(real); im.uri = real;
  });
  for (const b of j.buffers) { fs.copyFileSync(path.join(srcDir, b.uri), path.join(out, name + '.bin')); b.uri = name + '.bin'; }
  fs.writeFileSync(path.join(out, name + '.gltf'), JSON.stringify(j));
  console.log(name, 'ok');
}
convert(chars, 'Superhero_Male_FullBody.gltf', 'homme');
convert(chars, 'Superhero_Female_FullBody.gltf', 'femme');
for (const [f, n] of [['Hair_Buzzed.gltf', 'cheveux-courts'], ['Hair_SimpleParted.gltf', 'cheveux-raie'], ['Hair_Buns.gltf', 'cheveux-chignons'], ['Hair_Long.gltf', 'cheveux-longs']]) convert(hair, f, n);
// Image vide de 1 pixel pour les références abandonnées
fs.writeFileSync(path.join(out, 'blank.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
fs.copyFileSync(path.join(here, 'animations', 'UAL1_Standard.glb'), path.join(out, 'animations.glb'));
fs.copyFileSync(path.join(here, 'animations', 'License.txt'), path.join(out, 'LICENCE-Quaternius-CC0.txt'));
console.log('images :', [...used].join(', '));
for (const f of fs.readdirSync(out)) console.log(String(fs.statSync(path.join(out, f)).size).padStart(9), f);
