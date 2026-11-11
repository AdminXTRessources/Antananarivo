// Convertit l'extrait OpenStreetMap en repère de la visite et écrit app/src/streets.json.
// Repère : origine au début de l'avenue de l'Indépendance côté gare, z le long de
// l'axe gare -> marché (z = distance - 285), x perpendiculaire (positif à gauche
// en regardant vers le marché, c'est-à-dire au nord-est).
// Usage : node convert.mjs analakely.json ../../app/src/streets.json
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
const LAT0 = -18.9075, LON0 = 47.5245;
const mx = (lon) => (lon - LON0) * 111320 * Math.cos(LAT0 * Math.PI / 180);
const my = (lat) => (lat - LAT0) * 110574;
const A = [-305.5, 407], B = [59, -10];
const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
const u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [-u[1], u[0]];
const model = (lon, lat) => {
  const ex = mx(lon) - A[0], ey = my(lat) - A[1];
  return [Math.round((ex * n[0] + ey * n[1]) * 10) / 10, Math.round((ex * u[0] + ey * u[1] - 285) * 10) / 10];
};
console.log('longueur avenue', L.toFixed(0), 'u', u.map((v) => v.toFixed(3)));
const CLASS = { primary: 'p', primary_link: 'p', secondary: 's', secondary_link: 's', tertiary: 't', tertiary_link: 't', residential: 'r', unclassified: 'r', living_street: 'r', pedestrian: 'f', steps: 'x' };
const streets = [];
const inB = ([x, z]) => x > -440 && x < 440 && z > -480 && z < 760;
for (const e of d.elements) {
  const t = e.tags || {};
  const c = CLASS[t.highway];
  if (!c || !e.geometry) continue;
  const pts = e.geometry.map((p) => model(p.lon, p.lat));
  if (!pts.some(inB)) continue;
  streets.push({ c, n: t.name || '', pts });
}
fs.writeFileSync(out, JSON.stringify(streets));
console.log('rues', streets.length, 'octets', fs.statSync(out).size);

// Repères utiles pour ajuster le plan
const T = (e) => e.tags || {};
const box = (re) => {
  for (const e of d.elements) {
    if (!e.geometry || !(re.test(T(e).name || ''))) continue;
    const p = e.geometry.map((q) => model(q.lon, q.lat));
    const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]);
    console.log((T(e).name || '').slice(0, 34).padEnd(34), `x[${Math.min(...xs).toFixed(0)},${Math.max(...xs).toFixed(0)}] z[${Math.min(...zs).toFixed(0)},${Math.max(...zs).toFixed(0)}]`, T(e).highway || T(e).building || T(e).amenity || T(e).leisure || '');
  }
};
for (const re of [/Orange Digital/, /H[ôo]tel de Ville/, /Pavillon Analakely/, /^Analakely$/, /Ambohitsorohitra/, /Ambohijatovo/, /Glacier/, /Fahaleovantena/, /26 Jona/]) box(re);
console.log('\nJonctions sur l\'avenue (|x| < 60, -285 < z < 290) :');
const seen = new Set();
for (const s of streets) {
  if (/Fahaleovantena|26 Jona/.test(s.n) || s.c === 'f') continue;
  for (const p of [s.pts[0], s.pts.at(-1)]) {
    if (Math.abs(p[0]) < 60 && p[1] > -300 && p[1] < 620) {
      const k = `${s.c} ${s.n || '-'} x=${p[0].toFixed(0)} z=${p[1].toFixed(0)}`;
      if (!seen.has(k)) { seen.add(k); console.log(' ', k); }
    }
  }
}
console.log('\nEscaliers longs :');
for (const s of streets) if (s.c === 'x') {
  let len = 0; for (let i = 1; i < s.pts.length; i++) len += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
  if (len > 60) console.log(' ', (s.n || '-').padEnd(26), `(${s.pts[0].map((v) => v.toFixed(0))}) -> (${s.pts.at(-1).map((v) => v.toFixed(0))}) long=${len.toFixed(0)}`);
}
