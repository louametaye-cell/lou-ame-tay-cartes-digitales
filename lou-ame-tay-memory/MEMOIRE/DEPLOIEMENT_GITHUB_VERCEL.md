# 🚀 RÉFÉRENTIEL OFFICIEL DE DÉPLOIEMENT, GITHUB & PRODUCTION — LOU AME TAY

**Éditeur :** Lou Ame Tay SASU / Médias Graphisme Sénégal / DAW Digital Arts Work  
**Direction Générale :** M. Mbaye Babacar GUEYE, Fondateur & CEO  
**Date d'homologation :** 2 Octobre 2026  
**Statut :** 🟢 **EN PRODUCTION & SYNCHRONISÉ GITHUB**

---

## 🌐 1. Environnements & URLs Officielles

| Service | Rôle | URL / Identifiant |
| :--- | :--- | :--- |
| **Production Live (Vercel)** | Application Web & PWA Client | **[https://louametay.online](https://louametay.online)** |
| **Site Vitrine Officiel** | Présentation institutionnelle CHR | **[https://www.louametay.com](https://www.louametay.com)** |
| **Dépôt GitHub Officiel** | Source Code & Versioning | **[https://github.com/louametaye-cell/lou-ame-tay-cartes-digitales.git](https://github.com/louametaye-cell/lou-ame-tay-cartes-digitales.git)** |
| **Compte GitHub** | Organisation propriétaire | `louametaye-cell` (email : `louametaye@gmail.com`) |
| **Projet Vercel** | Déploiement Cloud Edge | `lou-ame-tay-cartes-digitales` (`prj_WW3i1srFjxE7YClIHBTZmxij86AF`) |
| **Équipe Vercel** | Team propriétaire | `mgartswork` (`team_QjZ2TXOLPhlYOT1tsMJnGN50`) |
| **Base de Données Cloud** | Supabase PostgreSQL 16 | `https://ugmdpjncplnlizhpongo.supabase.co` |
| **Siège Social & Maps** | Géolocalisation & Avis clients | `Q359+WC2, Thiès` (Quartier Fayou, Face Foot Salé) |

---

## 🌿 2. Gestion des Branches Git

Le projet dispose de deux branches principales synchronisées en miroir :
* **`master`** : Branche historique de développement et de livraison locale.
* **`main`** : Branche standard GitHub de référence pour l'intégration continue.

### Commande de synchronisation totale :
```bash
git push -u origin --all
git push origin --tags
```

---

## ⚡ 3. Déploiement en Production (Vercel 1-Clic)

Pour mettre à jour `https://louametay.online` :
```bash
# Compilation optimisée
npm run build

# Déploiement pré-compilé
npx vercel build --prod --yes
npx vercel deploy --prebuilt --prod --yes
```

---

## 🔒 4. Neutralité Stricte des Réseaux Sociaux Institutionnels

Les cartes de visite digitales de l'ensemble des conseillers commerciaux injectent **exclusivement** les 5 réseaux officiels Lou Ame Tay. Aucun réseau personnel n'est autorisé :
* **TikTok :** `https://www.tiktok.com/@louametay`
* **Facebook :** `https://www.facebook.com/louametay/`
* **Instagram :** `https://www.instagram.com/louametaye/`
* **LinkedIn :** `https://www.linkedin.com/company/lou-ame-tay`
* **YouTube Officiel :** `https://youtube.com/@louametaye?si=wdfwRr2F-x0ho5PY`
* **Bouton d'Abonnement Direct :** `https://youtube.com/@louametaye?sub_confirmation=1`
* **Vidéo Fallback :** `hZq2u-yPnAE`

---

## 🎯 5. Dictionnaire UX des Boutons d'Action

1. **Carte Digitale (`carte.html`) :**
   * `📅 Demander une démo (15 min)`
   * `🔄 Échanger mes coordonnées`
   * `📲 Enregistrer dans mon téléphone`
   * `⚡ Tester le menu QR dans mon restaurant`
   * `🚀 Recevoir ma démo gratuite sans engagement`
   * `⭐ Évaluer mon conseiller`

2. **Espace Conseiller (`commercial.html`) :**
   * `Prendre une photo professionnelle`
   * `Étape suivante : Ma Carte Digitale ➔`
   * `✍️ Signer mon contrat & Activer mon compte`
   * `✍️ Faire signer un restaurant (Wave/OM)`
   * `📄 Sceller la vente & Générer le Contrat PDF`
   * `+ Déclarer un frais de transport 🛵`
   * `📲 Demander mon virement (Wave / OM)`

3. **Administration (`admin.html`) :**
   * `+ Recruter un conseiller`
   * `+ Nouveau Prospect CHR`
   * `🖨️ Planche d'impression PDF (Cartes 85x55mm)`
   * `💳 Valider & Décaisser (Wave / OM)`
   * `💾 Appliquer le taux global à l'équipe`
