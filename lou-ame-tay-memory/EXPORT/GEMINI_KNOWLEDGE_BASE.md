# 🧠 LOU AME TAY — BASE DE CONNAISSANCE UNIFIÉE GEMINI

> **Version** : 2.0.0 | **Date** : 2026-09-29 | **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Type** : Document Maître Auto-Suffisant pour Import Immédiat dans Google Gemini / Antigravity CLI  
> **Taille certifiée** : < 50 000 caractères (chargement instantané en 1 prompt)

---

## 📌 Résumé exécutif

**Lou Ame Tay** (*"Qu'est-ce qu'il y a aujourd'hui ?"* en Wolof) est une plateforme SaaS B2B sénégalaise conçue pour moderniser la restauration et l'hôtellerie (secteur CHR) sur l'axe Dakar — Thiès — Petite Côte (Mbour / Saly).

La plateforme résout trois douleurs critiques des restaurateurs :
1. **L'usure et le coût récurrent des menus papier** lors des hausses de prix des denrées.
2. **Les lenteurs et erreurs de commande** aux heures de pointe entre serveurs et cuisiniers.
3. **La gestion archaïque des ruptures de stock** d'ingrédients en cours de service.

Elle propose un écosystème en 3 volets :
- **Cartes de Visite Digitales PWA** : Des cartes interactives haute conversion (ratio photo 4:5, style QRCodeChimp) attribuées à chaque conseiller commercial (Mamadou Diallo, Cheikh Ndiaye, Fatou Sow, Moussa Ba, Babacar Gueye). Chaque carte intègre le téléchargement de contact vCard 3.0 en 1 clic, un QR code dynamique, le simulateur ROI, la démo vidéo YouTube et la commande du Kit Networking.
- **Menu Digital QR Code & Écran Cuisine KDS** : Les clients scannent le chevalet de table, commandent en Wolof, Français ou Anglais, paient par Wave ou Orange Money, et le bon s'affiche en temps réel sur l'écran tactile en cuisine.
- **Espace Admin CRM (Supabase + LWS)** : Dashboard CEO temps réel, gestion CRUD des conseillers avec bascule actif/inactif 1-clic, pipeline CRM de leads avec scoring automatique (0-100) et alertes WhatsApp directes.

L'architecture technique est 100% découplée : Frontend statique ultra-rapide hébergé sur Apache (LWS cPanel) avec `.htaccess` optimisé et Service Worker offline, connecté directement à Supabase (PostgreSQL 15, RLS hermétique, Storage d'images compressées et Realtime). Coût d'infrastructure mensuel proche de 0€ pour une disponibilité de 99.9%.

---

## 🏗️ Architecture technique

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARCHITECTURE DÉCOUPLÉE LOU AME TAY                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ CLIENT (Navigateur Mobile / Desktop)                                        │
│ • HTML5 Sémantique + CSS3 Modern Tokens + JavaScript Vanilla (ESM Natif)    │
│ • Service Worker PWA (Cache Shell + Stale-While-Revalidate + Offline)       │
│ • qrcodejs (QR HD) + html2canvas (PNG 1000px) + jsPDF (PDF Imprimeur 85x55)│
├─────────────────────────────────────────────────────────────────────────────┤
│ HÉBERGEMENT STATIQUE (LWS cPanel / Apache)                                  │
│ • Fichiers statiques compilés dans dist/ (louametay.online)                 │
│ • .htaccess : HTTPS strict 301, URL Rewriting sans .html, Deflate Gzip      │
│ • Cache Control : no-cache sur service-worker.js, 1 an sur assets immuables │
│ • js/env.js : Injection isolée des clés publiques window.__ENV__            │
├─────────────────────────────────────────────────────────────────────────────┤
│ BACKEND-AS-A-SERVICE (Supabase Managed Cloud)                               │
│ • PostgreSQL 15 : UUID v4, contraintes CHECK, triggers horodatage          │
│ • Row Level Security (RLS) : Cloisonnement strict anon vs authenticated     │
│ • Supabase Storage : Bucket public 'photos' avec compression amont < 1 Mo   │
│ • PostgREST API : CRUD direct et filtres d'équivalence d'identifiants       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Skills clés (Synthèse des 12 compétences)

1. **Architecture SaaS Statique (`01_architecture_saas`)** : Découplage complet Frontend Vanilla ESM / Supabase BaaS, injection d'environnement par `js/env.js` pour hébergement Apache économique.
2. **Patterns Supabase (`02_supabase_patterns`)** : Schéma relationnel UUID v4, requêtes PostgREST typées, upload Storage public et gestion d'erreurs d'incompatibilité de type.
3. **Déploiement LWS (`03_lws_deployment`)** : Règles `.htaccess` pour Apache (HTTPS forcé, suppression extensions `.html`, headers de sécurité OWASP, exclusion de cache SW).
4. **PWA & Offline (`04_pwa_offline`)** : Web App Manifest, Service Worker avec stratégie hybride (Cache-First Shell + Network-First API) et fallback local `data.js`.
5. **Internationalisation i18n (`05_i18n_multi_langue`)** : Moteur déclaratif sans librairie (`data-i18n`), prise en compte du Wolof authentique, Français et Anglais, persistence localStorage.
6. **Cartes Digitales Haute Conversion (`06_cartes_digitales`)** : Ergonomie mobile style QRCodeChimp, Hero 4:5 avec dégradé sombre, boutons ronds tactiles et intégration vCard.
7. **Export QR Code HD & PDF (`07_qr_code_export`)** : qrcodejs tolérance H (30%) + html2canvas pour PNG 1000x1000px et jsPDF pour carte d'impression 85x55mm 300 DPI.
8. **Admin Dashboard CRUD (`08_admin_dashboard`)** : Back-office temps réel, bascule actif/inactif 1-clic, compression photo côté client (`browser-image-compression`), toasts flottants.
9. **Analytics & Lead Scoring (`09_analytics_leads`)** : Traçabilité des scans de cartes, calcul de score de maturité prospect (0-100) et déclenchement d'alertes WhatsApp immédiates.
10. **Sécurité RLS Hermétique (`10_securite_rls`)** : Moindre privilège SQL, interdiction formelle de lecture publique sur la table des leads, protection anti-aspiration de données.
11. **Workflow Multi-Agents (`11_multi_agents_workflow`)** : Cycle diagnostic chirurgical ➔ correctif ➔ validation Playwright E2E avec screenshots ➔ packaging de build.
12. **Marché CHR Sénégal (`12_business_chr_senegal`)** : FinTech Wave et Orange Money, grille tarifaire en FCFA sans décimales, formules Tàmbali, Nio Far, Xéweul et Sur Mesure.

---

## 🎯 Patterns réutilisables essentiels

### Pattern 1 : Singleton Supabase ESM (`js/supabase-client.js`)
```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const env = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};
export const SUPABASE_URL = env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
export function estSupabaseConfigure() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('VOTRE_'));
}
export const supabase = estSupabaseConfigure()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'louametay_auth_token' }
    })
  : null;
```

### Pattern 2 : Politiques RLS SQL Maîtresses
```sql
ALTER TABLE public.commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Lecture publique restreinte aux cartes actives
CREATE POLICY "Public_Commerciaux_Select" ON public.commerciaux FOR SELECT TO anon USING (actif = true);
CREATE POLICY "Admin_Commerciaux_All" ON public.commerciaux FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Leads : Insertion publique sans AUCUNE lecture publique
CREATE POLICY "Public_Leads_Insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin_Leads_All" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Pattern 3 : Résolution d'Équivalence d'UUID (`js/carte.js`)
```javascript
// Évite l'erreur PostgreSQL 400 sur ID numérique court ('1', '2'...)
const numVersUuid = {
  '1': '11111111-1111-1111-1111-111111111111',
  '2': '22222222-2222-2222-2222-222222222222',
  '3': '33333333-3333-3333-3333-333333333333',
  '4': '44444444-4444-4444-4444-444444444444'
};
const resolvedId = numVersUuid[commercialId] || commercialId;
const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedId);
```

### Pattern 4 : Compression Photo Client Amont (< 1 Mo)
```javascript
export async function compresserImage(file) {
  if (typeof window !== 'undefined' && window.imageCompression) {
    return await window.imageCompression(file, {
      maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.85
    });
  }
  return file;
}
```

### Pattern 5 : Génération vCard 3.0 Conforme
```javascript
export function telechargerVCard(c) {
  const vcf = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N;CHARSET=UTF-8:${c.nom};${c.prenom};;;`,
    `FN;CHARSET=UTF-8:${c.prenom} ${c.nom}`,
    `ORG;CHARSET=UTF-8:Lou Ame Tay 🍽️`,
    `TITLE;CHARSET=UTF-8:${c.poste}`,
    `TEL;TYPE=CELL,VOICE:${c.telephone.replace(/[^\d+]/g, '')}`,
    `EMAIL;TYPE=PREF,INTERNET:${c.email}`,
    `URL;TYPE=WORK:https://www.louametay.online`,
    `URL;TYPE=DIGITAL_CARD:https://www.louametay.online/carte.html?id=${c.id}`,
    'END:VCARD'
  ].join('\r\n');
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${c.prenom}_${c.nom}.vcf`;
  a.click();
}
```

### Pattern 6 : Carte PDF 85x55mm 300 DPI Recto/Verso (`jsPDF`)
```javascript
const { jsPDF } = window.jspdf;
const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 55] });
// Recto
doc.setFillColor(11, 31, 58); doc.rect(0, 0, 85, 55, 'F');
doc.setDrawColor(201, 162, 39); doc.rect(3, 3, 79, 49);
doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text(`${c.prenom} ${c.nom}`, 7, 22);
// Verso
doc.addPage([85, 55], 'landscape'); doc.setFillColor(255, 255, 255); doc.rect(0, 0, 85, 55, 'F');
doc.addImage(qrDataUrl, 'PNG', 28.5, 7.5, 28, 28);
doc.save(`Carte_Visite_${c.prenom}_${c.nom}_85x55mm.pdf`);
```

### Pattern 7 : Service Worker Cache Purge & Offline Fallback
```javascript
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(
      cles.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
```

### Pattern 8 : Moteur i18n Déclaratif
```javascript
export function traduireDOM() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const cle = el.getAttribute('data-i18n');
    const val = t(cle);
    if (val) el.textContent = val;
  });
}
```

### Pattern 9 : Toast Flottant Non-Bloquant
```javascript
export function afficherToast(msg, type = 'succes') {
  let t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast-notification visible toast-${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visible'), 3500);
}
```

### Pattern 10 : Apache `.htaccess` Anti-Cache SW
```apache
<FilesMatch "(service-worker\.js|manifest\.json|env\.js)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>
```

---

## 📋 Prompts types validés

1. **Prompt Initialisation** : Définit la stack statique, le schéma PostgreSQL UUID, les règles RLS et les livrables Playwright.
2. **Prompt Feature Sprint** : Décompose la feature en spécifications fonctionnelles, persistance, intégration UI et test E2E.
3. **Prompt Bug Fix** : Impose le diagnostic en 3 étapes (logs ➔ correctif chirurgical ➔ vérification Playwright).
4. **Prompt Audit Sécurité** : Checklist d'étanchéité SQL, injection d'anonymat `anon` et contrôle du bucket.
5. **Prompt Pré-Déploiement** : 10 points de contrôle d'intégrité avant génération du ZIP LWS.
6. **Prompt Formation Équipe** : Manuel pratique pour les commerciaux terrain à Dakar et Thiès.

---

## ⚠️ Pièges connus & Solutions immédiates

1. **Oubli de `<script src="js/env.js"></script>`** : Crash silencieux Supabase ➔ Vérifier présence dans tous les `.html`.
2. **UUID Supabase avec id entier** : Erreur 400 PostgreSQL ➔ Toujours utiliser des UUIDs v4 standardisés.
3. **Texte statique dans le HTML ("Mamadou Diallo")** : Affiche un mauvais nom si délai réseau ➔ Remplacer par un loader.
4. **Bouton 👁️ hardcodé** : Ouvre toujours le même commercial ➔ Mettre `onclick="voirProfil('${c.id}')"`.
5. **Cache Apache sur `service-worker.js`** : Bloque les mises à jour ➔ Exclure dans `.htaccess`.
6. **`networkidle` sur Vite** : Timeout de 30s dans Playwright ➔ Utiliser `waitUntil: 'domcontentloaded'`.
7. **Session login requise dans les tests** : Redirection automatique ➔ Injecter session démo via `page.addInitScript`.
8. **Upload photo > 10 Mo** : Erreur HTTP 413 ➔ Compression `browser-image-compression` côté client amont.
9. **CORS sur `html2canvas`** : Canvas souillé ➔ Configurer `useCORS: true` et en-têtes Storage.
10. **Table `leads` lisible par `anon`** : Fuite de données ➔ Pas de politique `SELECT` pour `anon` sur `leads`.
11. **Remplacement de texte écrasant les icônes i18n** : Isoler le texte dans un `<span>` dédié.
12. **Caractères accentués corrompus dans `.vcf`** : Spécifier `data:text/vcard;charset=utf-8`.
13. **Numéro WhatsApp invalide** : Nettoyer avec regex et forcer l'indicatif international `221`.
14. **Bascule Actif visuelle non persistée** : Ajouter le champ `actif: nouvelEtat` dans la charge utile de mise à jour.
15. **Défilement mobile sous le modal** : Poser la classe `modal-ouvert` avec `overflow: hidden` sur le `<body>`.

---

## 🚀 Workflows validés (Méthodologie Multi-Agents)

1. **Triptyque d'intervention** : Diagnostic préalable ➔ Édition chirurgicale (`replace_file_content`) ➔ Validation Playwright avec capture.
2. **Gestion par Artefacts** : Création d'une `task_list_sprintX.md` mise à jour à chaque étape, conclue par un rapport formel.
3. **Packaging continu** : Exécution de `npm run build:lws` après chaque sprint validé pour maintenir l'archive ZIP prête au déploiement.

---

## 📊 KPIs & Métriques de succès

- **Temps de chargement mobile (4G Sénégal)** : < 700 ms.
- **Taux de conversion au scan** : > 65% d'enregistrements de vCard.
- **Délai moyen de prise de contact commercial** : < 15 minutes grâce aux alertes WhatsApp directes.
- **Score PWA Lighthouse** : 100 / 100.
- **Marge brute d'exploitation estimée** : > 70%.

---

## 🔗 Ressources externes de référence

- Documentation PostgREST : `https://postgrest.org`
- Client Supabase JS : `https://supabase.com/docs/reference/javascript`
- Spécification vCard RFC 2426 : `https://tools.ietf.org/html/rfc2426`
- jsPDF UMD : `https://github.com/parallax/jsPDF`
- Documentation LWS Apache : `https://aide.lws.fr`

---

## 📅 Chronologie synthétique du projet

- **Sprint 1 (Networking)** : B3 WhatsApp Intelligent, C3 Témoignages & Vidéo YouTube, E1 Parrainage `?ref=`, E2 Partage Multi-Canal.
- **Sprint 2 (Kit Outils)** : D1 Téléchargement Kit ZIP, D2 Carte de visite PDF 85x55mm, D3 Signature email HTML.
- **Sprint 3 (Admin v2)** : Dashboard CEO en direct, CRM Leads avec scoring, modération d'avis, correctif d'équité profil commercial.
- **Sprint Clôture** : Archivage en 12 Skills, 7 Mémoires, 9 Patterns, 6 Prompts, 6 Business Assets et Base Gemini.
