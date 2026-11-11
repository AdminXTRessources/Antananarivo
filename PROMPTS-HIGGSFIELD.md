# Prompts Higgsfield — Analakely 1950 / 2050

À lancer **avant le 16 novembre**, dans l'ordre. Cochez au fur et à mesure ; je récupère les résultats par le connecteur.

## À savoir sur l'offre illimitée

D'après le catalogue, seuls certains **modèles d'image** portent la mention « illimité » : **Nano Banana Pro, Nano Banana 2, Nano Banana 2.1, GPT Image 2, Soul 2.0**. Les modèles **3D n'ont pas cette mention** : la conversion image → 3D consomme probablement des crédits. Générez donc toutes les images d'abord, et testez le coût d'une seule conversion 3D avant d'en lancer d'autres.

Modèle conseillé : **Nano Banana Pro en 2k** (4k pour les textures et les ciels).

## Mode d'emploi

- **Modèles 3D** (sections A à D) : en deux temps. D'abord une image avec le prompt, puis « Image to 3D » sur la meilleure image (Meshy 7 ou Tripo H3.1, textures et PBR activés).
- **Personnages** : pose « A-pose », puis Image to 3D avec *rigging* et *animation* activés, animation « Casual_Walk » (id 30). Une seconde version en « idle » (id 0) pour les marchands immobiles.
- **Textures** (section E) : image carrée, la plus haute résolution disponible.
- **Polygones** : 30 000 pour les bâtiments, 8 000 à 10 000 pour les personnages et objets (fluidité).
- Suffixe à ajouter à **tous les prompts d'objets 3D** :
  `single isolated subject, centered, full view, neutral grey background, soft even studio lighting, no shadows on ground, no text, no watermark`
- Vous pouvez joindre vos photos du dossier Photo/Analakely comme image de référence quand le modèle le permet.

## A. Personnages (priorité 1)

Suffixe personnages : `full body, standing A-pose, arms slightly away from body, front view, realistic proportions` + suffixe général.

**1950**
- [ ] A1 — `Malagasy Merina man, 1950s Antananarivo, dark three-piece suit, white shirt, black felt hat, leather shoes, dignified`
- [ ] A2 — `Malagasy Merina woman, 1950s Antananarivo, long pale dress, white cotton lamba shawl draped over shoulders, hair in traditional braided buns`
- [ ] A3 — `Malagasy market woman, 1950s, simple cotton dress, white lamba, woven straw basket carried on head`
- [ ] A4 — `Malagasy man, 1950s, light linen shirt and trousers, straw hat, barefoot, porter`
- [ ] A5 — `Malagasy child, 1950s, school uniform shorts and white shirt`
- [ ] A6 — `French colonial-era civilian man, 1950s, beige linen suit, pith helmet` (présence historique, discrète)

**2050**
- [ ] A7 — `Malagasy woman, year 2050, elegant contemporary dress in light fabric, modern white lamba scarf over shoulders, sandals`
- [ ] A8 — `Malagasy man, year 2050, casual linen shirt, light trousers, woven straw hat, tote bag`
- [ ] A9 — `Malagasy market vendor woman, 2050, colourful lambahoany wrap, apron, smiling`
- [ ] A10 — `Malagasy teenager, 2050, t-shirt, shorts, backpack`
- [ ] A11 — `Malagasy elderly man, 2050, light jacket, straw hat, walking cane`
- [ ] A12 — `European tourist woman, 2050, sun hat, light travel clothes, small camera, backpack`
- [ ] A13 — `Asian tourist man, 2050, cap, short-sleeve shirt, shorts, daypack`

## B. Bâtiments emblématiques (priorité 2)

- [ ] B1 — Gare de Soarano : `Soarano railway station Antananarivo, French colonial 1910 stone building, central clock pediment, roof balustrade with stone balls, green and yellow ceramic tile frieze, tall arched doors with teal shutters, wrought-iron glass canopy, symmetrical facade, three-quarter view`
- [ ] B2 — Pavillon du marché : `Analakely market pavilion Antananarivo, small square hall, steep pyramidal brown clay tile roof, cream walls, arched bays with red wooden doors, wide eaves, three-quarter view`
- [ ] B3 — Immeuble à arcades (un module) : `French colonial 1930s arcade building Antananarivo, ground floor round stone arches, two upper floors with red wooden shutters and small balconies, cream and terracotta walls, clay tile roof, straight front view, one repeating module`
- [ ] B4 — Palais d'Ambohitsorohitra : `Ambohitsorohitra palace Antananarivo, late 19th century French residence, pale stone and brick, mansard slate roof, central pavilion, tall windows, formal garden gate`
- [ ] B5 — Maison traditionnelle des collines : `traditional Merina highland house Antananarivo, two storeys, red brick, steep tiled roof, wooden veranda with columns, narrow and tall`
- [ ] B6 — Clocher en brique : `red brick neo-gothic church with tall square bell tower and pointed spire, Antananarivo hillside`

## C. Mobilier et objets 2050 (priorité 3)

- [ ] C1 — `elegant solar shade canopy for a pedestrian avenue, slim timber and steel structure, translucent photovoltaic roof, inspired by Malagasy woven patterns`
- [ ] C2 — `modern public bench in local stone and warm wood, minimalist`
- [ ] C3 — `slim contemporary street lamp, warm light, bronze finish, discreet solar panel`
- [ ] C4 — `circular stone fountain with low water jets, granite, public plaza`
- [ ] C5 — `market stall, wooden frame, white fabric parasol, baskets of tropical fruit, spices and vanilla`
- [ ] C6 — `ravinala traveller's palm tree, fan-shaped, full tree`
- [ ] C7 — `jacaranda tree in purple bloom, full tree`

## D. Objets 1950 (priorité 3)

- [ ] D1 — `1950 Citroën Traction Avant, black, side three-quarter view`
- [ ] D2 — `1950s Peugeot 203, pale grey`
- [ ] D3 — `1950s Renault 4CV, cream`
- [ ] D4 — `1950s Renault Goélette van, faded green`
- [ ] D5 — `rickshaw pousse-pousse, two large wheels, folding hood, 1950s Madagascar`
- [ ] D6 — `large white canvas market parasol on wooden pole, 1950s open-air market`
- [ ] D7 — `ox-drawn wooden cart with zebu, Madagascar`
- [ ] D8 — `1950s steam locomotive, narrow gauge, Madagascar railway, black with red details`
- [ ] D9 — `cast-iron colonial street lamp, 1930s French style`

## E. Textures répétables (priorité 2)

Suffixe textures : `seamless tileable texture, flat front view, even lighting, no perspective, no shadows, high detail`.

- [ ] E1 — `old granite cobblestone paving, irregular blocks, worn` (escaliers et rues, 1950)
- [ ] E2 — `modern light granite pedestrian paving, large clean slabs with fine joints` (2050)
- [ ] E3 — `cream lime-plastered wall, slightly weathered`
- [ ] E4 — `clean cream lime-plastered wall, freshly restored`
- [ ] E5 — `red fired brick wall, Madagascar highland style`
- [ ] E6 — `brown clay roof tiles, flat tiles in rows`
- [ ] E7 — `red wooden louvred shutters, painted, aged`
- [ ] E8 — `packed red laterite earth ground`
- [ ] E9 — `green and yellow geometric ceramic tile frieze, art nouveau`
- [ ] E10 — `short green lawn grass`

## F. Ciels et ambiance (priorité 4)

Format panoramique 2:1 si disponible.

- [ ] F1 — `360 equirectangular sky panorama, bright highland morning, deep blue sky, white cumulus clouds, no ground, no buildings`
- [ ] F2 — `360 equirectangular sky panorama, golden hour sunset, warm orange clouds, no ground`
- [ ] F3 — Image de couverture : `aerial view of Analakely, Antananarivo in 2050, fully pedestrian Avenue de l'Indépendance, central garden, colonial arcade buildings with red shutters, market pavilions with pointed tile roofs, Soarano station at the end, hills covered with houses, people strolling, no cars, realistic, warm light`
- [ ] F4 — Image de couverture 1950 : `Analakely, Tananarive in 1950, Avenue with colonial arcades, Zoma market with hundreds of white parasols, Malagasy people in white lambas and dark suits with hats, a few 1950s French cars, vintage colour photograph`
