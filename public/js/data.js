/**
 * ==========================================================================
 * FICHIER : js/data.js
 * DONNÉES RÉELLES DE L'ENTREPRISE ET DES COMMERCIAUX — LOU AME TAY
 * ==========================================================================
 * Solution SaaS 100% sénégalaise pour la restauration & l'hôtellerie :
 * Commande à table par QR Code, Écran Cuisine (KDS), Gestion des ruptures.
 */

export const entreprise = {
  nom: "Lou Ame Tay",
  slogan: "La transition digitale de la restauration et de l'hôtellerie au Sénégal.",
  description: "Lou Ame Tay est une solution SaaS 100% sénégalaise conçue pour moderniser les établissements de restauration et d'hôtellerie. Elle permet aux clients de consulter le menu et de passer commande directement depuis leur table en scannant un QR code, sans aucune application à télécharger.",
  siteWeb: "https://www.louametay.com",
  logo: "images/logo.svg",
  images: [
    "images/deploiement1.jpg",
    "images/deploiement2.jpg",
    "images/deploiement3.jpg"
  ],
  presence: {
    bureaux: "Basée à Thiès (Quartier Dixième) et Dakar (Point E).",
    zoneIntervention: "Intervention terrain sur l'axe Thiès — Dakar — Mbour.",
    support: "Support technique & opérationnel WhatsApp 7j/7 de 08h00 à 22h00."
  },
  contact: {
    whatsapp: "221762312003",
    whatsappAffichage: "+221 76 231 20 03",
    telephone: "+221771303678",
    telephoneAffichage: "+221 77 130 36 78",
    email: "contact@louametay.com",
    youtube: "https://youtube.com/@louametaye?si=wdfwRr2F-x0ho5PY",
    youtubeChannelId: "UCmaFo8BlqLgMj87mqbG3jkw"
  },
  paiements: ["Wave", "Orange Money", "Carte bancaire"],
  fonctionnalites: [
    {
      titre: "Menu Digital & Commande à Table",
      desc: "Les clients scannent le QR code placé sur la table, parcourent le menu illustré et valident leur commande en quelques secondes."
    },
    {
      titre: "Écran Cuisine (KDS)",
      desc: "Transmission instantanée des bons en cuisine avec gestion intelligente des temps de préparation et des priorités."
    },
    {
      titre: "Tableau de Bord & Statistiques",
      desc: "Suivi en temps réel des ventes quotidiennes, du chiffre d'affaires, des plats vedettes et des heures de pointe."
    },
    {
      titre: "Gestion Immédiate des Ruptures",
      desc: "Désactivation d'un plat ou d'une boisson en rupture en un clic depuis le smartphone du gérant pour éviter les déceptions."
    }
  ],
  avantages: [
    { titre: "0 papier & menus toujours à jour", desc: "Finies les réimpressions de cartes coûteuses et abîmées." },
    { titre: "-90% d'erreurs de commande", desc: "Le client choisit exactement ses préférences et garnitures." },
    { titre: "+25% sur le panier moyen", desc: "Photos appétissantes, suggestions de boissons et desserts automatiques." },
    { titre: "Zéro application à télécharger", desc: "Fonctionne instantanément dans n'importe quel navigateur mobile." }
  ],
  offres: [
    {
      id: "tambali",
      nom: "Formule Tàmbali",
      prix: "15 000 FCFA / mois",
      badge: "Démarrage rapide",
      cible: "Établissements avec caisse déjà existante",
      details: [
        "Menu interactif QR Code illimité",
        "Prise de commande mobile par le client",
        "Mise à jour instantanée des prix et plats",
        "Paiement par Wave & Orange Money",
        "Support technique WhatsApp 7j/7"
      ]
    },
    {
      id: "niofar",
      nom: "Formule Nio Far",
      prix: "25 000 FCFA / mois",
      badge: "Populaire",
      cible: "Petits maquis, cafés, fast-foods et glaciers",
      details: [
        "Tout ce qui est inclus dans Tàmbali",
        "Gestion des commandes serveurs sur smartphone",
        "Gestion en direct des ruptures d'ingrédients",
        "Statistiques des ventes par jour et par semaine",
        "Assistance et formation de l'équipe sur place"
      ]
    },
    {
      id: "xeweul",
      nom: "Formule Xéweul",
      prix: "35 000 FCFA / mois",
      badge: "Recommandée ⭐",
      populaire: true,
      cible: "Restaurants établis, lounges & complexes hôteliers",
      details: [
        "Solution complète clé en main",
        "Écran Cuisine (KDS) interactif en temps réel",
        "Interface multilingue (Français, Wolof, Anglais)",
        "Gestion des tables, réservations & livraisons",
        "Rapports financiers détaillés exportables Excel",
        "Gestionnaire de compte Lou Ame Tay dédié"
      ]
    },
    {
      id: "surmesure",
      nom: "Sur Mesure",
      prix: "Sur devis personnalisé",
      badge: "Grands Comptes",
      cible: "Chaînes de restauration, multi-sites, franchises & resorts",
      details: [
        "Déploiement multi-établissements centralisé",
        "Intégration API à vos systèmes ERP/Caisse existants",
        "Supports QR en plexiglas ou bois gravé premium",
        "Formation continue de tout votre personnel de salle",
        "Support d'astreinte 24h/24 et 7j/7 prioritaire"
      ]
    }
  ],
  fraisInstallation: {
    montant: "50 000 FCFA",
    desc: "Frais uniques de mise en service : numérisation complète de votre carte, shooting photo assistance, configuration de vos tables et livraison des chevalets/stickers QR codes résistants à l'eau."
  },
  horairesSupport: "Support 7j/7 de 08h00 à 20h00 (Interventions d'urgence 22h00)"
};

export const commerciaux = [];

if (typeof window !== 'undefined') {
  window.entreprise = entreprise;
  window.commerciaux = commerciaux;
}


