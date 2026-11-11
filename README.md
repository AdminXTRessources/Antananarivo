# Antananarivo 1950 / 2050 — visite virtuelle d'Analakely

Visite 3D temps réel du quartier d'Analakely (Antananarivo, Madagascar), à deux époques : 1950 et 2050 (ville piétonne). Navigation en drone au clavier, à la souris ou au tactile ; modes Manuel, Découverte et Aléatoire.

## Lancer en local

```bash
cd app
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

## Organisation

- `app/` : l'application (Three.js + Vite). `src/world.js` construit le quartier, `src/people.js` et `src/actors.js` les personnages, `src/tour.js` les lieux et la visite guidée.
- `data/osm/` : extrait OpenStreetMap et script de conversion vers `app/src/streets.json`.
- `assets/personnages/` : préparation des modèles de personnages.
- `PLAN.md` : plan du projet et décisions.

## Crédits

- Plan des rues : © contributeurs OpenStreetMap (ODbL).
- Personnages et animations : Quaternius (CC0).
- Façades de la gare, des arcades et des pavillons : images générées avec Higgsfield.
