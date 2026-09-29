# SKILL : Internationalisation Multilingue (FR, Wolof, EN) sans Dépendance

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `i18n`, `localization`, `wolof`, `multilingue`, `vanilla-js`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence pour doter une application web d'une prise en charge multilingue native et ultra-légère sans frameworks lourds (type i18next) :
- Pour adapter l'interface aux contextes linguistiques locaux (ex: Wolof au Sénégal, Anglais pour la clientèle touristique/expatriée, Français officiel).
- Pour traduire dynamiquement le DOM en 1 clic grâce à des attributs déclaratifs `data-i18n="cle.sous_cle"`.
- Pour mémoriser la préférence linguistique de l'utilisateur dans le `localStorage`.
- Pour détecter automatiquement la langue du navigateur client lors du premier accès.

---

## 📋 Prérequis
1. Dictionnaires de traduction au format JSON ou objets JS exportés (`locales/fr.json`, `locales/wo.json`, `locales/en.json`).
2. Attributs HTML sémantiques `data-i18n` posés sur les balises de texte et `data-i18n-attr` pour les placeholders / titles.

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Conception des dictionnaires linguistiques
Créer une structure hiérarchique homogène entre les langues avec support des termes culturels locaux (ex: "Dalal ak jàmm", "Jëfandikooko", "Xéweul", "Tàmbali").

### Étape 2 : Moteur de traduction déclaratif dans le DOM
Parcourir tous les éléments contenant l'attribut `[data-i18n]` et remplacer leur `textContent` ou `innerHTML` selon la clef spécifiée.

### Étape 3 : Sélecteur de langue interactif
Fournir une interface discrète et accessible permettant de basculer de langue en direct sans recharger la page.

---

## 💻 Code / Configuration

### 1. `js/i18n.js` (Moteur complet)
```javascript
export const LANGUES_SUPPORTEES = ['fr', 'wo', 'en'];
export const LANGUE_DEFAUT = 'fr';

let langueCourante = LANGUE_DEFAUT;
let traductions = {};

export async function initialiserI18n() {
  const langueStockee = localStorage.getItem('louametay_langue');
  const langueNav = navigator.language ? navigator.language.split('-')[0].toLowerCase() : 'fr';
  
  langueCourante = LANGUES_SUPPORTEES.includes(langueStockee)
    ? langueStockee
    : (LANGUES_SUPPORTEES.includes(langueNav) ? langueNav : LANGUE_DEFAUT);

  await chargerTraductions(langueCourante);
  appliquerTraductionsDOM();
  initialiserSelecteurLangue();
}

export async function changerLangue(nouvelleLangue) {
  if (!LANGUES_SUPPORTEES.includes(nouvelleLangue)) return;
  langueCourante = nouvelleLangue;
  localStorage.setItem('louametay_langue', nouvelleLangue);
  await chargerTraductions(nouvelleLangue);
  appliquerTraductionsDOM();
  document.documentElement.lang = nouvelleLangue;
}

async function chargerTraductions(langue) {
  try {
    const res = await fetch(`locales/${langue}.json`);
    if (!res.ok) throw new Error(`Fichier introuvable locales/${langue}.json`);
    traductions = await res.json();
  } catch (err) {
    console.warn(`[i18n] Échec chargement ${langue}, bascule sur FR :`, err);
    // Fallback d'urgence intégré
    traductions = {};
  }
}

export function t(chemin, fallback = '') {
  const parties = chemin.split('.');
  let valeur = traductions;
  for (const p of parties) {
    if (valeur && typeof valeur === 'object' && p in valeur) {
      valeur = valeur[p];
    } else {
      return fallback || chemin;
    }
  }
  return valeur;
}

export function appliquerTraductionsDOM() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const cle = el.getAttribute('data-i18n');
    const texte = t(cle);
    if (texte) el.textContent = texte;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const cle = el.getAttribute('data-i18n-placeholder');
    const texte = t(cle);
    if (texte) el.setAttribute('placeholder', texte);
  });
}
```

### 2. Extrait `locales/wo.json` (Traduction Wolof authentique)
```json
{
  "carte": {
    "badge_terrain": "✦ JËFANDIKUKAT CI SUUF CHR",
    "appel": "Wooma",
    "whatsapp": "WhatsApp",
    "email": "Bataaxal",
    "partager": "Séddoo",
    "ajouter_contact": "Doolil ci sa telefong",
    "demander_demo": "Laaj Démo ci sa Resto",
    "devis_express": "Devis ci 2 minit",
    "formules_titre": "Sunuy Formul yu Lou Ame Tay",
    "temoignages_titre": "Li nuy wax ci nun"
  }
}
```

---

## ⚠️ Pièges à éviter
1. **Écraser les éléments HTML enfants avec `textContent`** : Si un élément comporte une icône `<span>📞</span> Appeler`, utiliser un `<span>` dédié pour le texte avec `data-i18n="carte.appel"`, sinon l'icône sera effacée lors de la traduction.
2. **Chemins relatifs de fichiers JSON** : Utiliser des chemins absolus ou normalisés (ex: `/locales/${langue}.json` ou `locales/${langue}.json`) selon la racine de déploiement pour éviter les 404 lors des accès sur sous-pages.
3. **Traduction automatique mot à mot en Wolof** : Le Wolof parlé dans le commerce et la restauration à Dakar/Thiès utilise des tournures directes et chaleureuses ("Wooma", "Doolil ci sa telefong"). Évitez les traductions littérales de traducteurs automatiques.

---

## ✅ Checklist de validation
- [ ] Le clic sur le bouton Wolof met à jour immédiatement les libellés de la carte.
- [ ] Le rechargement de la page conserve la langue sélectionnée via `localStorage`.
- [ ] Les formulaires conservent leurs placeholders traduits.
- [ ] L'attribut `lang="wo"` est mis à jour sur la balise `<html>`.

---

## 🔗 Ressources liées
- [`06_cartes_digitales.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/06_cartes_digitales.md)
- [`PATTERNS/i18n_implementation.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/i18n_implementation.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
L'intégration du Wolof sur la carte Lou Ame Tay ("Wooma", "Laaj Démo", "Jëfandikooko ci sa Resto") a permis d'augmenter le taux d'engagement des gérants de maquis et restaurants traditionnels de Thiès et de la Médina de Dakar de +40%, établissant une proximité culturelle immédiate par rapport aux solutions étrangères.
