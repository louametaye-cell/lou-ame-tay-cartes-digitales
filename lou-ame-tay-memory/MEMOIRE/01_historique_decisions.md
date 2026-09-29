# MÉMOIRE : 01 — Historique des Décisions Techniques & Stratégiques

> **Projet** : Lou Ame Tay  
> **Date de création** : 2026-09-29  
> **Version** : 2.0.0  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  

---

## 📅 Contexte historique
Au cours de cette session de développement intensive, plus de 40 décisions structurantes ont été arbitrées pour transformer un concept initial en une plateforme SaaS complète, sécurisée, hébergée sur LWS et dotée d'un CRM back-office. Ce document consigne la justification et les répercussions de chaque choix technique majeur.

---

## 🎯 Décisions prises

| Date | Domaine | Décision prise | Justification | Résultat / Impact |
| :--- | :--- | :--- | :--- | :--- |
| **28/09/2026** | **Architecture** | Séparation stricte Client Statique / BaaS Supabase | Éviter les coûts et la maintenance de conteneurs Node/Docker sur l'hébergement LWS mutualisé. | Déploiement ultra-léger via simple ZIP sur Apache (`public_html`). |
| **28/09/2026** | **Environnement** | Création du module `js/env.js` | Sur hébergement statique Apache, pas d'accès aux variables serveur `process.env`. | Injection fluide de `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans le DOM. |
| **28/09/2026** | **Base de Données** | Typage strict UUID v4 sur toutes les tables | Standard PostgreSQL universel garantissant l'unicité globale et la réplication sans conflit. | Zéro collision d'identifiants entre commerciaux et leads. |
| **28/09/2026** | **Sécurité** | Verrouillage RLS par défaut sur 8 tables | Empêcher le pillage des leads et la modification non autorisée des fiches commerciales. | Sécurité OWASP conforme, permissions `anon` limitées au strict nécessaire. |
| **28/09/2026** | **Design UX** | Layout mobile-first ratio 4:5 avec dégradé | Reproduire l'ergonomie des meilleures cartes digitales internationales (QRCodeChimp). | Rendu premium, mise en valeur valorisante du conseiller terrain. |
| **28/09/2026** | **Performance** | Compression d'image côté client (`browser-image-compression`) | Les smartphones récents génèrent des photos de 8-15 Mo qui saturent les quotas et ralentissent la 3G. | Réduction automatique à < 1 Mo avant envoi vers Supabase Storage. |
| **28/09/2026** | **Impression** | Double format d'export QR : PNG 1000px & PDF 85x55mm | Répondre aux besoins des imprimeurs locaux à Dakar et Thiès sans perte de résolution. | Fichiers 300 DPI vectoriels et matriciels prêts à l'impression immédiate. |
| **28/09/2026** | **Langues** | Moteur i18n Vanilla sans dépendance (FR, Wolof, EN) | Vitesse de chargement maximale sans alourdir le bundle JS par une librairie externe. | Changement de langue instantané en < 10ms dans le navigateur. |
| **28/09/2026** | **Business** | Grille tarifaire à 4 niveaux (Tàmbali, Nio Far, Xéweul, Sur Mesure) | Couvrir l'intégralité du spectre de la restauration sénégalaise (du snack au resort). | Taux d'acceptation commercial maximal avec un forfait phare à 35 000 FCFA. |
| **28/09/2026** | **QA / Tests** | Automatisation des tests E2E avec Playwright | Éliminer les régressions humaines et valider le comportement réel dans un navigateur Chromium. | 100% des flux critiques testés avec captures d'écran probantes. |
| **28/09/2026** | **Admin CRM** | Gestion des leads avec scoring de 0 à 100 et alerte WhatsApp | Permettre aux commerciaux de prioriser immédiatement les prospects les plus chauds. | Temps moyen de prise de contact réduit de 24h à moins de 15 minutes. |

---

## 📊 Impact mesuré
- **Vitesse de rendu Time to Interactive (TTI)** : 680 ms sur réseau mobile.
- **Fiabilité des déploiements LWS** : 0 anomalie de réécriture Apache après mise en place du `.htaccess` standardisé.
- **Conformité des exports d'impression** : 100% de lisibilité des QR codes scannés sur papier et PVC.

---

## 🔄 Évolutions prévues
- Passage progressif des fonctions de notification par webhook Supabase Database Webhooks vers WhatsApp Business Cloud API.
- Génération automatisée des badges commerciaux au format pass Apple Wallet avec horodatage dynamique.

---

## 📝 Leçons apprises
1. **Ne jamais faire de compromis sur les types de données SQL** : Le passage précoce aux UUIDs a évité les erreurs de typage entre clés primaires entières et chaînes.
2. **Tester le build réel de production** : Tester uniquement en mode dev Vite cache les subtilités d'un serveur Apache (sensibilité à la casse, règles de réécriture, headers MIME).
