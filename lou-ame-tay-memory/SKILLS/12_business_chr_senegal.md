# SKILL : Business & Marché CHR au Sénégal (Restauration, Hôtellerie & FinTech UEMOA)

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `business`, `senegal`, `chr`, `restaurant`, `wave`, `orange-money`, `fcfa`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence lorsque vous concevez, commercialisez ou déployez une solution SaaS, une application ou un service destiné aux professionnels de la restauration et de l'hôtellerie (Cafés, Hôtels, Restaurants - CHR) au Sénégal et dans la zone UEMOA :
- Pour adapter les prix, forfaits et modes de facturation en Francs CFA (XOF / FCFA) sans décimales.
- Pour intégrer les habitudes de paiement locales ultra-dominantes : Wave Mobile Money et Orange Money Sénégal.
- Pour structurer les offres selon la maturité technologique des établissements sénégalais (du maquis de quartier au grand complexe balnéaire de Saly).
- Pour formuler un argumentaire commercial percutant axé sur les douleurs réelles des restaurateurs locaux (coût des réimpressions de menus, ruptures d'ingrédients non signalées, lenteur du service aux heures de pointe, erreurs de commande).

---

## 📋 Prérequis
1. Compréhension de la géographie commerciale de l'axe stratégique : **Dakar** (Plateau, Almadies, Point E, Ngor), **Thiès** (Dixième, Cité Lamy, Randoulène), et **Mbour / Saly Portudal** (zone balnéaire et touristique).
2. Connaissance des devises : 1 EUR ≈ 655,957 FCFA. Tous les prix publics s'expriment en FCFA ronds.
3. Disponibilité du support technique WhatsApp 7j/7 (canal de communication n°1 au Sénégal).

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Structuration de la Grille Tarifaire Segmentée
Adapter les formules aux segments réels du marché sénégalais :
1. **Formule Tàmbali (15 000 FCFA / mois)** :
   - *Cible* : Petits snacks, dibiteries modernes, glaciers, établissements disposant déjà d'un encaissement traditionnel.
   - *Promesse* : Menu interactif QR Code illimité, mise à jour instantanée des prix, paiement Wave / Orange Money, support WhatsApp 7j/7.
2. **Formule Nio Far (25 000 FCFA / mois)** :
   - *Cible* : Fast-foods, maquis à forte affluence, salons de thé.
   - *Promesse* : Tout Tàmbali + prise de commande serveurs sur smartphone, gestion directe des ruptures d'ingrédients, statistiques de vente par jour.
3. **Formule Xéweul (35 000 FCFA / mois - Best-Seller ⭐)** :
   - *Cible* : Restaurants établis, lounges, terrasses et complexes hôteliers.
   - *Promesse* : Solution complète clé en main, Écran Cuisine (KDS) temps réel interactif, interface multilingue (Français, Wolof, Anglais), gestion des tables et rapports financiers exportables Excel.
4. **Formule Sur Mesure (Sur devis)** :
   - *Cible* : Chaînes de restauration, franchises internationales, resorts et hôtels 4/5 étoiles.
   - *Promesse* : Déploiement multi-sites centralisé, intégration API aux caisses existantes, supports chevalets en bois gravé ou plexiglas premium, astreinte 24/7.
5. **Frais d'installation uniques (50 000 FCFA)** :
   - Numérisation de la carte, shooting photo d'assistance, configuration des tables et livraison des stickers QR étanches résistants à l'eau.

### Étape 2 : L'Argumentaire de Vente Terrain (Bénéfices CHR)
1. **0 papier & menus toujours à jour** : Finies les cartes papier tachées de graisse ou coûteuses à réimprimer lors d'un changement de prix du poisson ou de la viande.
2. **-90% d'erreurs de commande** : Le client choisit lui-même ses garnitures et cuissons.
3. **+25% sur le panier moyen** : Les photos appétissantes des plats et les suggestions automatiques (boisson Bissap, dessert Thiakry) incitent à la consommation.
4. **Zéro application à télécharger** : Fonctionne instantanément dans Safari et Chrome sur n'importe quel smartphone avec un scan QR.

---

## 💻 Code / Configuration

### 1. Configuration des Offres et Devises dans l'Application (`js/data.js`)
```javascript
export const entreprise = {
  nom: "Lou Ame Tay 🍽️",
  slogan: "La transition digitale de la restauration et de l'hôtellerie au Sénégal.",
  monnaie: "FCFA",
  paiements: ["Wave", "Orange Money", "Espèces", "Carte Bancaire"],
  zoneIntervention: "Axe stratégique Dakar — Thiès — Mbour — Saly Portudal",
  support: "Support technique WhatsApp 7j/7 de 08h00 à 22h00 (+221 76 231 20 03)",
  offres: [
    {
      id: "tambali",
      nom: "Formule Tàmbali",
      prix_mensuel: 15000,
      prix_affichage: "15 000 FCFA / mois",
      badge: "Démarrage rapide",
      populaire: false
    },
    {
      id: "niofar",
      nom: "Formule Nio Far",
      prix_mensuel: 25000,
      prix_affichage: "25 000 FCFA / mois",
      badge: "Populaire",
      populaire: false
    },
    {
      id: "xeweul",
      nom: "Formule Xéweul",
      prix_mensuel: 35000,
      prix_affichage: "35 000 FCFA / mois",
      badge: "Recommandée ⭐",
      populaire: true
    },
    {
      id: "surmesure",
      nom: "Sur Mesure",
      prix_mensuel: null,
      prix_affichage: "Sur devis personnalisé",
      badge: "Grands Comptes",
      populaire: false
    }
  ]
};
```

---

## ⚠️ Pièges à éviter
1. **Facturer en Euros ou avec des virgules** : Les professionnels locaux raisonnent exclusivement en FCFA ronds. L'affichage d'un prix en euros ou avec des centimes décrédibilise immédiatement la démarche commerciale.
2. **Ignorer le KDS (Kitchen Display System)** : Dans la restauration sénégalaise, le goulet d'étranglement majeur se situe en cuisine (perte de bons de commande papier, querelles entre serveurs et cuisiniers). La mise en avant de l'écran cuisine tactile est l'argument n°1 de conversion de la formule Xéweul.
3. **Sous-estimer l'importance de la présence physique** : Au Sénégal, la vente B2B se conclut sur le terrain par le contact humain ("Teranga"). Les cartes digitales servent d'outil d'ouverture de porte et de suivi commercial après la visite du conseiller.

---

## ✅ Checklist de validation
- [ ] Tous les prix sont exprimés en FCFA avec séparateur de milliers (ex: 35 000 FCFA).
- [ ] Les boutons d'action mentionnent explicitement Wave et Orange Money.
- [ ] Le support client renvoie vers une ligne WhatsApp sénégalaise joignable en continu.
- [ ] Les témoignages clients citent des établissements réels ou représentatifs (Dakar Plateau, Almadies, Thiès Dixième, Saly).

---

## 🔗 Ressources liées
- [`09_analytics_leads.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/09_analytics_leads.md)
- [`11_multi_agents_workflow.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/11_multi_agents_workflow.md)
- [`BUSINESS/marche_chr_senegal.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/BUSINESS/marche_chr_senegal.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
L'ancrage culturel de Lou Ame Tay ("Lou Ame Tay ?" signifie en wolof *"Qu'est-ce qu'il y a aujourd'hui au menu ?"*) allié aux noms de formules chargés de sens positif (**Tàmbali** = *Le début / Commencer*, **Nio Far** = *On est ensemble*, **Xéweul** = *La bénédiction / L'abondance*) confère à la marque une adoption immédiate et chaleureuse auprès des restaurateurs de Dakar et Thiès, distançant nettement les logiciels génériques importés d'Europe.
