# PATTERN : Système d'Internationalisation (i18n) Déclaratif sans Librairie

> **Langage** : JavaScript (ESM)  
> **Fichier** : `js/i18n.js`  
> **Fonctionnalités** : Détection auto, mémorisation localStorage, interpolation de clés, traduction d'attributs  

---

## 🎯 Objectif
Fournir un moteur de traduction multilingue léger (< 150 lignes de code) capable de traduire instantanément une page HTML grâce à des attributs déclaratifs `data-i18n="section.cle"` posés sur les éléments du DOM, avec gestion d'un dictionnaire de repli par défaut (fallback).

---

## 💻 Code Réutilisable (`js/i18n.js`)

```javascript
/**
 * MOTEUR I18N VANILLA JS — LOU AME TAY
 */

export const LANGUES_DISPONIBLES = ['fr', 'wo', 'en'];
export const LANGUE_DEFAUT = 'fr';

let langueActuelle = LANGUE_DEFAUT;
let dictionnaireCourant = {};

/**
 * Initialise le système de traduction au démarrage de la page
 */
export async function initialiserSystemeI18n() {
  const langueMemoire = localStorage.getItem('louametay_lang');
  const langueNavigateur = navigator.language ? navigator.language.slice(0, 2).toLowerCase() : 'fr';

  if (langueMemoire && LANGUES_DISPONIBLES.includes(langueMemoire)) {
    langueActuelle = langueMemoire;
  } else if (LANGUES_DISPONIBLES.includes(langueNavigateur)) {
    langueActuelle = langueNavigateur;
  } else {
    langueActuelle = LANGUE_DEFAUT;
  }

  await chargerFichierLangue(langueActuelle);
  traduireDOM();
  lierBoutonsSelecteur();
}

/**
 * Charge le dictionnaire JSON correspondant à la langue
 */
async function chargerFichierLangue(codeLangue) {
  try {
    const reponse = await fetch(`locales/${codeLangue}.json`);
    if (!reponse.ok) throw new Error(`Fichier locales/${codeLangue}.json introuvable.`);
    dictionnaireCourant = await reponse.json();
  } catch (err) {
    console.warn(`[i18n] Échec chargement (${codeLangue}), utilisation du fallback :`, err);
    dictionnaireCourant = {};
  }
}

/**
 * Résout une clé imbriquée type 'carte.boutons.appel' dans le dictionnaire
 */
export function traduire(cle, fallback = '') {
  const chemins = cle.split('.');
  let curseur = dictionnaireCourant;

  for (const segment of chemins) {
    if (curseur && typeof curseur === 'object' && segment in curseur) {
      curseur = curseur[segment];
    } else {
      return fallback || cle;
    }
  }

  return curseur;
}

/**
 * Parcourt le DOM et applique les traductions sur tous les éléments balisés
 */
export function traduireDOM() {
  // Traduction du texte contenu
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const cle = el.getAttribute('data-i18n');
    const texte = traduire(cle);
    if (texte) el.textContent = texte;
  });

  // Traduction des placeholders de formulaires
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const cle = el.getAttribute('data-i18n-placeholder');
    const texte = traduire(cle);
    if (texte) el.setAttribute('placeholder', texte);
  });

  // Traduction des attributs title
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const cle = el.getAttribute('data-i18n-title');
    const texte = traduire(cle);
    if (texte) el.setAttribute('title', texte);
  });

  // Mise à jour de l'attribut lang sur <html>
  document.documentElement.lang = langueActuelle;
}

/**
 * Change la langue active et rafraîchit l'interface
 */
export async function basculerLangue(nouvelleLangue) {
  if (!LANGUES_DISPONIBLES.includes(nouvelleLangue)) return;
  langueActuelle = nouvelleLangue;
  localStorage.setItem('louametay_lang', nouvelleLangue);
  await chargerFichierLangue(nouvelleLangue);
  traduireDOM();

  // Mise à jour visuelle des boutons du sélecteur
  document.querySelectorAll('.btn-choix-langue').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === nouvelleLangue);
  });
}

function lierBoutonsSelecteur() {
  document.querySelectorAll('.btn-choix-langue').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      basculerLangue(lang);
    });
  });
}
```

---

## 🛠️ Exemple HTML
```html
<nav class="selecteur-langues">
  <button class="btn-choix-langue active" data-lang="fr">FR</button>
  <button class="btn-choix-langue" data-lang="wo">Wolof</button>
  <button class="btn-choix-langue" data-lang="en">EN</button>
</nav>

<h2 data-i18n="carte.titre_offres">Nos Formules</h2>
<input type="text" data-i18n-placeholder="formulaire.placeholder_nom" placeholder="Votre nom">
```
