# Antananarivo 2050 — Visite virtuelle · Plan V1 (Analakely)

Statut : **en attente de validation** — rien n'est encore développé.

## 1. Ce que j'ai vérifié

### Vos photos (Photo/Analakely, 13 images)
- Avenue de l'Indépendance : terre-plein central jardiné, deux rangées d'immeubles à arcades (rez-de-chaussée en arches, étages à volets rouges, toits de tuiles).
- Pavillons du marché : petites halles carrées, toits pyramidaux en tuiles brunes, murs clairs à baies cintrées.
- Gare de Soarano : façade en pierre, horloge, balustrade, frise de céramique verte et jaune, marquise métallique côté quais.
- Arrière-plan : collines couvertes de maisons, clocher en brique, escaliers de pierre (totohabato).

### Recherche historique (à compléter pendant le développement)
- Avenue créée pendant la colonisation (avenue Fallières, puis de la Libération, puis de l'Indépendance en 1960) ; aménagement architectural des années 1930 attribué à Collet du Cantelou.
- Gare de Soarano, grands escaliers, égouts, fontaines, électricité : grands travaux coloniaux. 140 000 habitants en 1940.
- Escaliers Analakely → Antaninarenina et Analakely → Ambondrona : une source les date de 1832 (Ranavalona Ire), une autre des travaux coloniaux. Les sources divergent ; les bulles d'information le diront tel quel.
- Zoma : marché du vendredi, des milliers de marchands, « forêt de parasols blancs », démantelé en 1997. Les pavillons en sont le vestige.
- Lamba blanc : attesté sur les scènes de marché de l'Imerina. Chapeaux et pousse-pousse des années 1950 : pas encore sourcés, à vérifier sur cartes postales d'archives.

### Connecteur Higgsfield — point bloquant à traiter
- Le connecteur de cette session est **en lecture seule** : il liste les modèles et vos générations existantes, mais **ne peut pas lancer de génération**.
- Le compte connecté affiche **plan « free », 10 crédits**, et aucun espace de travail sélectionné. Je ne vois donc pas l'offre illimitée.
- Modèles 3D disponibles au catalogue : image → 3D et texte → 3D (Meshy, Tripo, Hunyuan3D), avec textures PBR, squelette et animation de marche pour les personnages.
- Conséquence : je rédige les prompts, **vous lancez les générations dans Higgsfield**, puis je récupère les résultats par le connecteur et je les intègre.

## 2. Choix technique recommandé

**Application web 3D temps réel (Three.js + Vite), pas un Artifact.**
Un Artifact est limité à 16 Mo et ne peut pas évoluer vers le paiement, les comptes et la visite à plusieurs. Une application web se publie sur une vraie adresse et accueille la V2 sans réécriture.

- Géométrie du quartier construite par code à partir du plan réel (avenue, arcades, pavillons, gare, escaliers, collines) : légère, fluide, navigable partout.
- Higgsfield pour ce que le code fait mal : textures de façades, modèles 3D des bâtiments emblématiques (gare, pavillon, fontaine), personnages animés, ciel, images d'ambiance.
- Rendu visé : **semi-réaliste stylisé**, pas photoréaliste. Un rendu photoréaliste fluide dans un navigateur n'est pas atteignable dans ce délai.
- Fluidité : objectif 60 images/s sur un portable récent ; instanciation des éléments répétés, niveaux de détail, foule légère.

## 3. Périmètre V1

| Élément | Contenu |
|---|---|
| Zone | Gare de Soarano → avenue et jardin central → arcades des deux côtés → pavillons du marché → grands escaliers → Antaninarenina (palais d'Ambohitsorohitra, jardin) ; amorce d'Ambohijatovo et des rues adjacentes |
| Époque | 2050 et 1950, bascule en un clic |
| 1950 | Voitures d'époque, hommes en costume et chapeau, femmes en lamba blanc, parasols blancs du Zoma, ambiance coloniale documentée |
| 2050 | Entièrement piéton, aucun véhicule ; pavage, arbres, fontaines, ombrières solaires discrètes, éclairage doux, marché rénové ; architecture d'origine conservée |
| Drone | Flèches = avancer / tourner ; touches pour monter / descendre ; souris pour regarder ; de 1,7 m à la vue aérienne ; collisions douces |
| Accès | Intérieur de la gare, sous les arcades, allées des pavillons, allées du jardin, escaliers, rues adjacentes |
| Modes | Manuel · Visite découverte (parcours guidé) · Aléatoire |
| Vitesses | Normal · ×2 · ×3 |
| Personnages | Habitants malgaches (marchands, familles, passants en lamba) et quelques touristes, animés |
| Culture | Bulles d'information sur les lieux (histoire, usages), en français |

## 4. Étapes

1. **Avant le 16 nov. — génération Higgsfield** (priorité absolue) : liste de prompts prête à lancer, par ordre d'importance : personnages, gare, pavillon, textures de façades, mobilier 2050, ciels. Variantes 1950 si retenues.
2. **Socle 3D** : terrain et collines, plan du quartier, drone, modes, vitesses.
3. **Bâtiments** : arcades, pavillons, gare (intérieur compris), escaliers, Antaninarenina.
4. **Vie** : personnages, végétation, eau, lumière, sons d'ambiance.
5. **Visite découverte** et bulles d'information.
6. **Optimisation, tests, publication** sur une adresse web.

### État au 10 nov. 2026 et suite demandée

Fait : étapes 1 à 3 (5 images Higgsfield, crédits épuisés ; plan recalé sur OpenStreetMap ; arcades, gare, pavillons, escaliers à paliers, Mairie, palais, hôtel Colbert, tunnels), platanes, fontaines, allées piétonnes, 12 bulles d'information.

Ordre de la suite, fixé avec vous :

1. **Personnages** : remplacer les silhouettes par des personnages animés (modèles libres de droits habillés par code selon l'époque, ou à défaut personnages articulés dessinés par code), avec des comportements : marchands à leur étal, groupes, gens assis, enfants, porteurs.
2. **Décors** :
   - terrasses de café et de glacier (tables, chaises, parasols, clients assis) ;
   - bancs sur l'avenue et dans les jardins ;
   - quelques commerces ouverts sous les arcades (devantures, étalages, enseignes) ;
   - quelques hôtels (enseignes, entrées), en plus du Colbert ;
   - animation du marché côté pavillons : maraîchers, poissonnier, boucher, avec leurs étals et les célèbres parasols blancs.
3. **Vérifications** : rejouer la visite Découverte sur le nouveau plan, tester le tactile, relire les textes historiques, afficher le crédit OpenStreetMap.
4. **Ambiance** : sons de marché et de rue, lumière de fin de journée.
5. **Publication** sur le VPS.

Décisions encore ouvertes : garder ou retirer Ambohijatovo et le tunnel d'Ambanidia (rapprochés artificiellement) ; orientation des façades du palais et du Colbert ; parasols blancs du marché en 2050 aussi, ou seulement en 1950.

## 5. V2 (préparée, non développée)

- Paiement (abonnement ou achat par quartier), comptes utilisateurs.
- Nouveaux quartiers : Haute-Ville et Rova, Isoraka, lac Anosy, Tsaralalàna.
- Visite à plusieurs sur invitation, avec avatars et voix ou messages.
- Guide audio, bascule 1950 / 2050 sur chaque quartier, mode casque VR.

## 6. Décisions prises (10 nov. 2026)

1. **Époque** : 2050 et 1950 ensemble dès la V1, avec bascule. Même géométrie pour les deux ; changent les textures, le mobilier, les véhicules (1950 seulement), les personnages et la lumière.
2. **Higgsfield** : vous lancez les générations à partir de [PROMPTS-HIGGSFIELD.md](PROMPTS-HIGGSFIELD.md) ; je récupère les résultats par le connecteur.
3. **Appareils** : ordinateur (clavier, souris) et tactile (téléphone, tablette) avec manettes à l'écran et rendu allégé.
4. **Géographie** : plan réel, vérifié sur carte avant de tracer le quartier.
5. **Publication** : sur votre VPS, avec un nom de domaine gratuit à définir. Le VPS servira aussi au serveur de visite à plusieurs en V2.
