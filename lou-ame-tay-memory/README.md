# 📚 PACK DE COMPÉTENCES & BASE DE CONNAISSANCE LOU AME TAY (v2.0.0)

> **Projet** : Lou Ame Tay (Cartes de Visite Digitales & SaaS CHR Sénégal)  
> **Date de consolidation** : 29 Septembre 2026  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Licence** : Propriétaire — Réutilisable sur projets partenaires & agents IA  

---

## 🧭 Vue d'Ensemble & Objectif

Ce pack condense **l'intégralité du savoir-faire technique, architectural, méthodologique et commercial** accumulé lors du développement, du déploiement et du durcissement de la plateforme **Lou Ame Tay**.

Il est conçu pour être **instantanément exploitable** par :
1. **Des agents IA (Google Gemini, Antigravity)** pour onboarder sur le projet en 30 secondes ou répliquer l'architecture sur d'autres projets SaaS B2B.
2. **Des développeurs web & ingénieurs** souhaitant déployer des architectures serverless ultra-légères sur hébergement mutualisé Apache / LWS avec Supabase.
3. **Des fondateurs de startups et commerciaux** opérant dans le secteur CHR et FinTech en Afrique de l'Ouest (Sénégal / zone UEMOA).

---

## 🗂️ Arborescence des Dossiers

```
lou-ame-tay-memory/
├── README.md                          # Le présent index général
│
├── SKILLS/                            # 12 Compétences Techniques & Métier Réutilisables
│   ├── 01_architecture_saas.md        # Architecture Frontend Vanilla + Supabase BaaS + LWS
│   ├── 02_supabase_patterns.md        # Schémas relationnels, UUID v4, Storage & Realtime
│   ├── 03_lws_deployment.md           # Configuration Apache .htaccess, SSL, cache & réécriture
│   ├── 04_pwa_offline.md              # PWA, Service Worker, Manifest & stratégie offline
│   ├── 05_i18n_multi_langue.md        # Internationalisation FR / Wolof / EN déclarative
│   ├── 06_cartes_digitales.md         # Design haute conversion QRCodeChimp mobile-first
│   ├── 07_qr_code_export.md           # Export QR Code PNG 1000px HD et PDF 85x55mm 300 DPI
│   ├── 08_admin_dashboard.md          # Back-office CRUD temps réel & compression d'image client
│   ├── 09_analytics_leads.md          # Tracking de scans, lead scoring (0-100) & alertes WhatsApp
│   ├── 10_securite_rls.md             # Cloisonnement Row Level Security & durcissement OWASP
│   ├── 11_multi_agents_workflow.md    # Méthodologie d'orchestration multi-agents & tests Playwright
│   └── 12_business_chr_senegal.md     # Spécificités du marché CHR au Sénégal, Wave, OM & FCFA
│
├── MEMOIRE/                           # 7 Mémoires & Documentation Détaillée
│   ├── 00_contexte_projet.md          # Genèse, problème résolu, mission & équipe
│   ├── 01_historique_decisions.md     # Tableau chronologique de toutes les décisions d'architecture
│   ├── 02_bugs_resolus.md             # Registre des 20+ bugs rencontrés et résolus avec leurs fixes
│   ├── 03_prompts_valides.md          # Formulations de prompts ayant produit des résultats parfaits
│   ├── 04_charte_graphique.md         # Design System, palette #0B1F3A / #C9A227 et composants UI
│   ├── 05_personas_utilisateurs.md    # Profils détaillés (CEO Babacar, Commercial Mamadou, Gérant Diop)
│   └── 06_roadmap_produit.md          # Bilan des Sprints 1, 2, 3 et jalons futurs (Sprints 4, 5, 6)
│
├── PATTERNS/                          # 9 Patterns de Code Prêts à Copier/Coller
│   ├── supabase_client.md             # Client Supabase singleton ESM avec détection d'environnement
│   ├── rls_policies.md                # Règles SQL RLS pour lecture publique sélective et écriture admin
│   ├── qr_export_png.md               # Rastérisation HD 1000px avec qrcodejs et html2canvas
│   ├── pdf_generation.md              # Composition de carte de visite recto/verso via jsPDF
│   ├── vcard_generation.md            # Générateur de fichier contact vCard 3.0 conforme RFC 2426
│   ├── pwa_service_worker.md          # Service worker avec Stale-While-Revalidate et purge de cache
│   ├── i18n_implementation.md         # Moteur de traduction déclaratif via attributs data-i18n
│   ├── modal_component.md             # Composant modal accessible avec gestion Échap et focus
│   └── toast_notifications.md         # Système de notification toast flottant non-bloquant
│
├── PROMPTS/                           # 6 Prompts Types Réutilisables
│   ├── prompt_nouveau_projet_saas.md  # Template pour lancer un nouveau projet SaaS découplé
│   ├── prompt_ajout_fonctionnalite.md # Structure pour ajouter une feature (DB ➔ Logic ➔ UI ➔ Test)
│   ├── prompt_bug_fix.md              # Protocole de diagnostic chirurgical et non-régression
│   ├── prompt_audit_securite.md       # Checklist d'audit RLS, fuites de données et bucket
│   ├── prompt_audit_pre_deploiement.md# Checklist de 10 points avant envoi en production LWS
│   └── prompt_formation_equipe.md     # Conception de modules de formation pour conseillers terrain
│
├── BUSINESS/                          # 6 Actifs Stratégiques & Commerciaux
│   ├── marche_chr_senegal.md          # Étude de marché chiffrée (Dakar, Thiès, Saly, pénétration mobile)
│   ├── concurrents_analyse.md         # Matrice concurrentielle face aux solutions étrangères et imprimeurs
│   ├── modele_economique.md           # Détail des formules Tàmbali, Nio Far, Xéweul et projections MRR
│   ├── plan_90_jours.md               # Plan d'action Go-To-Market trimestriel détaillé
│   ├── kpis_direction.md              # Cockpit d'indicateurs de pilotage financier, vente et technique
│   └── formation_commerciaux.md       # Manuel d'onboarding terrain sur 2 jours avec traitement des objections
│
└── EXPORT/                            # Fichiers de Partage & Import Rapide
    ├── GEMINI_KNOWLEDGE_BASE.md       # Document condensé unique (< 50 000 car.) pour prompt Gemini
    ├── skills_index.json              # Index structuré machine-readable au format JSON
    └── skills_pack.zip                # Archive ZIP complète prête à être partagée
```

---

## 🚀 Comment Utiliser ce Pack ?

### 1. Pour un Agent Google Gemini
Copiez simplement l'intégralité du fichier [`EXPORT/GEMINI_KNOWLEDGE_BASE.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/EXPORT/GEMINI_KNOWLEDGE_BASE.md) dans votre invite de départ. En moins de 30 secondes, l'agent aura assimilé la totalité des patterns d'architecture, des structures de données, des formules de prix et de la méthodologie de travail.

### 2. Pour l'Agent Antigravity CLI
Le fichier [`EXPORT/skills_index.json`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/EXPORT/skills_index.json) permet à Antigravity de charger dynamiquement les compétences requises selon la tâche en cours en pointant vers les fichiers de `SKILLS/` ou `PATTERNS/`.

### 3. Pour Partage Externe
Téléchargez directement le fichier [`EXPORT/skills_pack.zip`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/EXPORT/skills_pack.zip) qui contient l'arborescence complète zippée.
