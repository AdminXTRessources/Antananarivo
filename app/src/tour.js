// Lieux remarquables et parcours de la visite découverte.
// Positions calées sur le plan réel (voir world.js).
// Textes vérifiés sur source le 11 nov. 2026 : avenue et Zoma (L'Express de
// Madagascar, Lonely Planet), gare (Structurae, Archnet), palais (Wikipedia,
// L'Express), hôtel de ville (Wikipedia, source unique). Restent sans source :
// l'origine des escaliers (les sources divergent, le texte le dit), les hôtels
// Colbert et Le Louvre (aucune date donnée), et tout ce qui décrit 2050.

export const POIS = {
  avenue: {
    name: "Avenue de l'Indépendance",
    center: [0, 0, -20], view: [0, 44, 210], radius: 80,
    text: {
      1950: "Tracée pendant la colonisation sous le nom d'avenue Fallières, puis avenue de la Libération. Le vendredi, le Zoma envahit la chaussée de ses parasols blancs.",
      2050: "L'ancienne avenue Fallières, appelée avenue de l'Indépendance depuis 1960, est devenue une promenade entièrement piétonne : chaussées plantées, arcades des années 1930 restaurées.",
    },
  },
  arcades: {
    name: 'Les arcades',
    center: [-34, 3, -110], view: [-22, 6, -72], radius: 22,
    text: {
      1950: "Immeubles à arcades des années 1930 : boutiques au rez-de-chaussée, logements à volets rouges à l'étage, toits de tuiles.",
      2050: "Sous les arcades, les boutiques et les cafés ont repris toute la galerie. On s'y promène à l'ombre d'un bout à l'autre de l'avenue.",
    },
  },
  mairie: {
    name: 'Mairie (hôtel de ville)',
    center: [58, 6, -19], view: [4, 12, 22], radius: 62,
    text: {
      1950: "Construit en 1935-1936 sur les plans de Collet de Cantelou, l'architecte de l'avenue, l'hôtel de ville de Tananarive abrite les services municipaux, en retrait derrière son parvis.",
      2050: "Construit en 1935-1936 sur les plans de Collet de Cantelou, l'hôtel de ville est détruit par un incendie le 13 mai 1972, pendant les manifestations contre le président Tsiranana. Le terrain reste vide plus de trente ans. La reconstruction, lancée en 2008 par l'architecte Mamy Rajaobelina, rend le bâtiment à la ville en 2010.",
    },
  },
  gare: {
    name: 'Gare de Soarano',
    center: [0, 6, -357], view: [0, 14, -300], radius: 60,
    text: {
      1950: "Bâtie de 1908 à 1910 sur les plans de l'architecte Georges Fouchard, la gare est le terminus du chemin de fer vers la côte est. Façade de pierre, horloge, frise de céramique et marquise métallique.",
      2050: "Bâtie de 1908 à 1910 sur les plans de l'architecte Georges Fouchard, la gare est conservée comme halle culturelle. Une locomotive à vapeur y est exposée sur l'ancien quai.",
    },
  },
  pavillons: {
    name: "Pavillons d'Analakely",
    center: [80, 4, 465], view: [20, 36, 330], radius: 95,
    text: {
      1950: "Les pavillons aux toits pointus abritent le marché quotidien, le long de l'avenue. Autour, le Zoma du vendredi rassemble des milliers de marchands venus de l'Imerina.",
      2050: "Les pavillons aux toits de tuiles pointus, derniers témoins du Zoma démantelé en 1997, accueillent toujours le marché le long de l'avenue du 26 Juin.",
    },
  },
  escaliers: {
    name: "Escaliers d'Antaninarenina",
    center: [-70, 22, 425], view: [-2, 12, 384], radius: 42,
    text: {
      1950: "Le grand escalier de pierre relie le marché à la ville moyenne. Les sources divergent sur son origine : époque de Ranavalona Ire ou grands travaux coloniaux.",
      2050: "Le grand escalier de pierre monte du marché vers Antaninarenina. De l'autre côté du marché, un second escalier grimpe vers Ambondrona.",
    },
  },
  antaninarenina: {
    name: 'Antaninarenina',
    center: [-170, 46, 470], view: [-120, 60, 505], radius: 50,
    text: {
      1950: "Le jardin d'Antaninarenina, en haut de l'escalier, ouvre sur le plateau, ses hôtels et le palais d'Ambohitsorohitra.",
      2050: "Le jardin d'Antaninarenina, en haut de l'escalier, ouvre sur le plateau, l'hôtel Colbert et le palais d'Ambohitsorohitra.",
    },
  },
  palais: {
    name: "Palais d'Ambohitsorohitra",
    center: [-355, 50, 565], view: [-292, 52, 600], radius: 62,
    text: {
      1950: "Inauguré le 14 juillet 1892, œuvre de l'architecte Jully, le palais loge le représentant de la France : brique rouge, pierre blanche et toit d'ardoise à la Mansart, derrière sa grille et son bassin.",
      2050: "Inauguré le 14 juillet 1892, œuvre de l'architecte Jully, le palais a logé le représentant de la France jusqu'en 1972 avant de devenir palais présidentiel : brique rouge, pierre blanche et toit d'ardoise.",
    },
  },
  louvre: {
    name: 'Hôtel Le Louvre',
    center: [-216, 50, 482], view: [-176, 48, 500], radius: 30,
    text: {
      1950: "À l'angle de la place d'Antaninarenina, l'hôtel du Louvre et son pan coupé. Le bâtiment montré ici est celui d'aujourd'hui.",
      2050: "À l'angle de la place d'Antaninarenina, l'hôtel Le Louvre : façade blanche à balcons, pan coupé et grande marquise sur colonnes.",
    },
  },
  colbert: {
    name: 'Hôtel Colbert',
    center: [-225, 52, 595], view: [-218, 50, 556], radius: 30,
    text: {
      1950: "L'hôtel Colbert est déjà l'une des adresses du plateau d'Antaninarenina. Le bâtiment montré ici est celui d'aujourd'hui.",
      2050: "L'hôtel Colbert, adresse historique d'Antaninarenina, avec sa façade rouge à bandes vitrées et sa bougainvillée.",
    },
  },
  tunnels: {
    name: 'Les tunnels',
    center: [-60, 6, 694], view: [-4, 10, 668], radius: 44,
    text: {
      1950: "Le tunnel d'Ambohidahy perce la colline vers Anosy. Le tunnel d'Ambanidia, plus loin en réalité, est rapproché dans cette visite.",
      2050: "Le tunnel d'Ambohidahy perce la colline vers Anosy. Le tunnel d'Ambanidia, plus loin en réalité, est rapproché dans cette visite.",
    },
  },
  ambondrona: {
    name: "Escaliers d'Ambondrona",
    center: [260, 18, 283], view: [186, 14, 304], radius: 60,
    text: {
      1950: "De l'autre côté du marché, cet escalier monte vers Ambondrona et les quartiers de la colline.",
      2050: "L'escalier d'Ambondrona prolonge, de l'autre côté du marché, celui d'Antaninarenina.",
    },
  },
  ambohijatovo: {
    name: "Vers le jardin d'Ambohijatovo",
    center: [0, 6, 700], view: [0, 36, 640], radius: 55,
    text: {
      1950: "L'avenue continue vers le jardin d'Ambohijatovo, en réalité plus loin que dans cette visite.",
      2050: "L'avenue du 26 Juin continue vers le jardin d'Ambohijatovo, en réalité plus loin que dans cette visite.",
    },
  },
};

// [x, hauteur au-dessus du sol, z, regardX, regardY, regardZ, lieu]
export const TOUR = [
  [0, 38, 330, 0, 4, 60, 'avenue'],
  [0, 14, 200, 0, 3, -60, 'avenue'],
  [6, 5, 40, 56, 8, -19, 'mairie'],
  [0, 2, 0, 0, 2, -150, 'avenue'],
  [-22, 2, -64, -33, 2.4, -110, 'arcades'],
  [-33.2, 2.2, -80, -33.2, 2.2, -140, 'arcades'],
  [-33.2, 2.2, -106, -33.2, 2.2, -170, 'arcades'],
  [-33.2, 2.2, -136, -30, 2.4, -200, 'arcades'],
  [-22, 2.4, -149, 0, 6, -330, 'arcades'],
  [0, 3, -300, 0, 8, -350, 'gare'],
  [0, 2.4, -342, 0, 3, -380, 'gare'],
  [0, 2.4, -357, -6, 2.6, -380, 'gare'],
  [0, 2.6, -371, -14, 2.4, -380, 'gare'],
  [22, 8, -374, 0, 4, -357, 'gare'],
  [50, 44, -330, 0, 0, -150, 'avenue'],
  [28, 32, 250, 70, 3, 440, 'pavillons'],
  [48, 2.4, 348, 48, 2.6, 460, 'pavillons'],
  [48, 2.4, 412, 48, 2.6, 520, 'pavillons'],
  [47, 2.5, 421, 10, 3, 421, 'pavillons'],          // passage entre deux halles
  [33, 2.6, 421, -40, 12, 418, 'pavillons'],
  [17, 3, 412, -60, 20, 425, 'escaliers'],
  [-16, 2.6, 394, -100, 36, 440, 'escaliers'],
  [-70, 3, 425, -150, 46, 468, 'escaliers'],
  [-130, 3, 459, -200, 46, 480, 'antaninarenina'],
  [-160, 3, 468, -225, 54, 590, 'antaninarenina'],
  [-190, 24, 510, -225, 54, 595, 'colbert'],        // au-dessus des toits du plateau
  [-214, 20, 548, -225, 54, 595, 'colbert'],
  [-290, 18, 598, -360, 50, 565, 'palais'],
  [-322, 4, 565, -367, 52, 565, 'palais'],
  [-250, 40, 520, 120, 10, 330, 'ambondrona'],
  [40, 48, 560, -40, 6, 690, 'tunnels'],
  [0, 8, 664, -78, 5, 700, 'tunnels'],
  [22, 8, 668, 68, 5, 738, 'tunnels'],
  [0, 3, 680, 0, 8, 745, 'ambohijatovo'],
  [0, 32, 600, 0, 4, 300, 'avenue'],
];
