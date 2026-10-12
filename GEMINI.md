# GEMINI, AISSATOU RAG & CRM 2.0 FIELD ARCHITECTURE — LOU AME TAY
**DAW Digital Arts Work — by MG** | *Référentiel Maître pour tous les Agents IA du Projet*

Ce document spécifie les standards d'ingénierie, les contraintes de base de données, la suite d'intelligence Aissatou et les directives opérationnelles de la plateforme **Lou Ame Tay** ([louametay.online](https://louametay.online)).

---

## 👩🏾‍💼 Identité & Profil d'Aissatou
- **Nom** : Aissatou
- **Titre** : Directrice RH, Développement & Stratégie CHR
- **Organisation** : Lou Ame Tay SASU (DAW Digital Arts Work — by MG)
- **Diplômes & Formations** :
  - Master 2 RH & Management des Organisations
  - Licence Hôtellerie-Restauration & Tourisme
  - Certificat Marketing Digital & Growth
  - Certificat Gestion Comptable & Fiscalité Sénégal
  - Certificat Assistant(e) de Direction
- **Langues** : Français (courant), Wolof (natif), Anglais (professionnel).
- **Style relationnel** : Chaleureux, bienveillant, ancré dans la Téranga sénégalaise, vouvoiement de rigueur, orienté action et impact commercial.

---

## 📚 Base de Connaissances RAG (10 Fiches Markdown)

L'ensemble des connaissances officielles d'Aissatou est indexé dans le répertoire `/knowledge` (et son miroir `/public/knowledge/`) :

| Fiche | Fichier | Thématique couverte |
|---|---|---|
| **Fiche 00** | `01_aissatou_personnalite.md` | Identité, background académique, valeurs et règles de réponse |
| **Fiche 01** | `02_marche_chr.md` | Chiffres clés Sénégal (4500 restau, 80% axe Thiès-Dakar-Mbour, 7/10 menu QR à Dakar) |
| **Fiche 02** | `03_concurrents.md` | Analyse Mafalia, ScaniFood, Spoon Africa, Taarih, Flipdish & différenciation LAT |
| **Fiche 03** | `04_personas.md` | 4 Personas B2B (Gastronomique Almadies, Maquis Thiès, Fast-food VDN, Resort Saly) |
| **Fiche 04** | `05_pitchs.md` | Modèles 30s, 2 min, 15 min & scripts spécialisés par segment |
| **Fiche 05** | `06_objections.md` | 10 parades aux objections terrain (Prix, temps, informatique, panne réseau, associés) |
| **Fiche 06** | `07_dakar.md` | Cartographie Dakar Plateau, Almadies, Point E, VDN & Top 20 prospects prioritaires |
| **Fiche 07** | `08_thies_saly.md` | Siège historique Thiès, Avenue de Caen, Petite Côte & Top 15 prospects prioritaires |
| **Fiche 08** | `09_saint_louis_casamance.md` | Île de Saint-Louis UNESCO, Ziguinchor, Cap Skirring & écolodges |
| **Fiche 10** | `10_aissatou_ceo.md` | **Exécutif & CEO** : Marges B2B (85%-92%), KPIs terrain, arbitrage primes Wave, expansion Abidjan |

---

## 🛑 Contraintes PostgreSQL & Pièges de Base de Données

1. **Table `leads` — Contrainte `leads_statut_check` :**
   - **Interdit :** Majuscules (`'NOUVEAU'`).
   - **Obligatoire :** Toujours en minuscules : `statut: 'nouveau'`.
   - **Bypass RLS :** Toujours router par l'API Serverless `/api/leads.js` qui utilise la clé `SUPABASE_SERVICE_ROLE_KEY` côté serveur.

2. **Table `annonces_equipe` — Contrainte `annonces_equipe_type_check` :**
   - **Obligatoire :** Toujours insérer `type: 'info'`.
   - **Ciblage :** Encodé dans le titre : `[@ALL] Titre` ou `[@UUID_COMMERCIAL] Titre`.

---

## 👥 Répertoire des Commerciaux Actifs (Authentification PIN)

- **Babacar Gueye** : Tél `771303678` | PIN `1111` | Thiès, Dakar, Mbour
- **Cheikh Ahmadou Bamba MBODJ** : Tél `771492973` | PIN `1234` | Axe Thiès — Dakar — Mbour
- **Arona Sow** : Tél `770000001` | PIN `2001` | Dakar Plateau & Almadies
- **Fatou Diop** : Tél `770000002` | PIN `2002` | Petite Côte & Saly

---

## 🎧 Fonctionnalités Clés & Expérience Utilisateur

1. **Voice-to-CRM Dialogué :**
   - Dictée vocale ➔ TTS voix Aissatou ➔ Confirmation OUI/NON.
2. **Mode « 🎧 Sous écoute IA » :**
   - Reconnaissance discrète pendant les entretiens restaurateurs dans l'onglet RDV ➔ Synthèse objections ➔ Création prospect 1-clic.
3. **Navigation Google Maps :**
   - Même onglet (`window.location.href`) + session retour pour ne pas perdre l'application.
4. **Pass Porte-Cartes :**
   - 1 seul bouton : 📇 **vCard (.vcf)** universel iPhone & Android.
5. **Messagerie Interne :**
   - Badge rouge des non-lus en direct dans l'onglet Messages et more-sheet mobile.
6. **Typographie :**
   - Police **Montserrat** universelle.

---

## ⚙️ Compétence Skill Système Associée

Le référentiel exhaustif d'ingénierie et d'exploitation est enregistré dans la compétence système :
`louametay-field-crm-v2-master` (`C:\Users\DELL\.gemini\config\skills\louametay-field-crm-v2-master\SKILL.md`).
Tous les agents travaillant sur ce projet doivent charger et respecter ce référentiel.
