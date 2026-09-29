# MÉMOIRE : 06 — Roadmap Produit : Bilan des Sprints & Jalons Futurs

> **Projet** : Lou Ame Tay  
> **Date de création** : 2026-09-29  
> **Version** : 2.0.0  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  

---

## 📅 Contexte historique
La feuille de route de Lou Ame Tay s'articule autour d'une montée en puissance graduelle : d'abord équiper les commerciaux d'outils de pointe (Sprints 1 à 3), puis déployer l'écosystème restaurant complet en salle et en cuisine.

---

## 🎯 Bilan des Sprints Réalisés (v2.0.0)

### ✅ Sprint 1 : Fonctionnalités Networking à Fort Impact
- **B3 — WhatsApp Intelligent** : Génération dynamique de messages contextualisés avec prénom du commercial, nom du prospect et formule consultée.
- **C3 — Témoignages & Preuves Sociales** : Section dynamique avec avis notés (0-10) et intégration de démo vidéo YouTube.
- **E1 — Parrainage Traçable (`?ref=UUID`)** : Détection automatique des filleuls avec attribution au commercial parrain.
- **E2 — Partage Multi-Canal** : Modal modal de partage rapide (QR, WhatsApp, SMS, Copie lien avec Toast).

### ✅ Sprint 2 : Kit Networking Complet & Exports Imprimeur
- **D1 — Téléchargement du Kit Networking ZIP** : Archive contenant vCard 3.0, QR Code PNG 1000px, Carte de visite PDF 85x55mm, signature email HTML et guide d'instructions.
- **D2 — Carte de Visite PDF 85x55mm** : Génération à la volée recto-verso 300 DPI prête pour l'imprimeur physique.
- **D3 — Signature Email HTML Table-Based** : Code HTML pur copiable en 1 clic compatible avec Gmail, Outlook et Apple Mail.

### ✅ Sprint 3 : Admin v2 (CRM Leads & Modération Avis)
- **Tableau de Bord CEO** : Compteurs en direct (Total commerciaux, cartes actives, leads, MRR estimé).
- **CRM Leads & Devis** : Suivi des opportunités avec calcul de score automatique (0-100), filtres et export CSV.
- **Modération des Avis** : Interface de publication/masquage des témoignages clients.
- **Correctif d'Équité Profil** : Bouton 👁️ ouvrant fidèlement chaque conseiller selon son UUID Supabase réel.

---

## 🚀 Jalons Futurs & Décisions Stratégiques

```
┌──────────────────────────────────────────────┐     ┌──────────────────────────────────────────────┐
│  SPRINT 4 : FINTECH SUR CARTE [DÉSACTIVÉ]    │ ──> │      SPRINT 5 : WALLET & NOUVEAUX PASS       │
│  - Zéro passerelle de paiement sur la carte  │     │  - Pass Apple Wallet (.pkpass) [DÉPLOYÉ]     │
│  - Règlements gérés par la Direction Admin.  │     │  - Pass Google Wallet [DÉPLOYÉ]              │
│    et Financière (DAF) Lou Ame Tay           │     │  - Puces NFC encodées NTAG213                │
└──────────────────────────────────────────────┘     └──────────────────────────────────────────────┘
                                                                    │
                                                                    ▼
                                                     ┌──────────────────────────────────────────────┐
                                                     │         SPRINT 6 : MULTI-TENANT KDS          │
                                                     │  - Back-office multi-restaurants             │
                                                     │  - Écran Cuisine KDS WebSocket               │
                                                     │  - Gestion stocks & commandes                │
                                                     └──────────────────────────────────────────────┘
```

### 🚫 Sprint 4 : Passerelle FinTech sur Carte — DÉSACTIVÉ PAR LA DIRECTION
- **Règle absolue** : Les cartes de visite digitales n'intègrent **aucune passerelle de paiement en ligne**.
- **Gestion Administrative** : Les encaissements d'abonnements, facturations et contrats restaurants sont gérés exclusivement en direct par la **Direction Administrative et Financière (DAF)** de Lou Ame Tay.
- **Rôle de la Carte** : Outil de mise en relation B2B, prise de rendez-vous, démo en salle et demande de devis.

### ✅ Sprint 5 : Wallet Pass & Cartes Connectées (Intégré v2.0.0)
1. **Apple Wallet & Google Pay Pass** : Bouton direct et modale multi-plateformes permettant au restaurateur d'ajouter le contact du commercial dans son porte-cartes mobile sans connexion.
2. **Edge Functions Supabase** : `generate-apple-pass` et `generate-google-pass` prêtes pour signature de production et simulation.
3. **Cartes Physiques PVC & Bois Gravé NFC** : Encodage de puces NFC NTAG213 pointant vers l'URL dynamique de la carte.

### 🔜 Sprint 6 : Portail Établissements & Déploiement KDS SaaS
1. **Espace Restaurateur Autonome** : Permettre à chaque gérant de restaurant de modifier sa carte des plats, ses photos et ses prix depuis son smartphone.
2. **Écran Cuisine KDS WebSocket** : Connexion temps réel entre les tables et l'écran de la brigade en cuisine via Supabase Realtime.

---

## 📊 Métriques Cibles à 12 Mois
- **Nombre de restaurants abonnés actifs** : 150 établissements (Axe Dakar - Thiès - Mbour).
- **MRR Cible** : 5 250 000 FCFA / mois (base moyenne Formule Xéweul).
- **Taux de rétention annuel** : > 90%.
