/**
 * ==============================================================================
 * FICHIER : js/i18n.js
 * SYSTÈME D'INTERNATIONALISATION BILINGUE / TRILINGUE (FR / WOLOF / EN)
 * ==============================================================================
 * Gère le basculement dynamique de la langue sans rechargement de la page :
 * - Français (fr) : langue de travail principale
 * - Wolof (wo) : langue vernaculaire majoritaire au Sénégal (en caractères latins)
 * - Anglais (en) : clientèle touristique et hôtelière internationale
 */

let langueCourante = localStorage.getItem('louametay_lang') || 'fr';
let dictionnaireTraductions = {};

/**
 * Charge les traductions et applique la langue courante
 */
export async function initialiserI18n() {
  await chargerDictionnaire(langueCourante);
  appliquerTraductions();
  mettreAJourSelecteurUI();

  // Écouteurs sur les boutons de changement de langue
  document.querySelectorAll('.btn-lang-switch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const codeLangue = btn.getAttribute('data-lang');
      if (codeLangue && codeLangue !== langueCourante) {
        setLangue(codeLangue);
      }
    });
  });
}

/**
 * Charge le fichier JSON de la langue demandée
 */
async function chargerDictionnaire(lang) {
  try {
    const res = await fetch(`/locales/${lang}.json`);
    if (res.ok) {
      dictionnaireTraductions[lang] = await res.json();
    } else {
      console.warn(`Traduction non trouvée pour ${lang}, repli sur FR`);
      if (lang !== 'fr' && !dictionnaireTraductions['fr']) {
        const resFr = await fetch('/locales/fr.json');
        dictionnaireTraductions['fr'] = await resFr.json();
      }
    }
  } catch (err) {
    console.warn(`Erreur chargement langue ${lang} :`, err);
  }
}

/**
 * Définit la langue et rafraîchit l'interface
 * @param {'fr'|'wo'|'en'} lang
 */
export async function setLangue(lang) {
  langueCourante = lang;
  localStorage.setItem('louametay_lang', lang);

  if (!dictionnaireTraductions[lang]) {
    await chargerDictionnaire(lang);
  }

  appliquerTraductions();
  mettreAJourSelecteurUI();
  document.documentElement.lang = lang;
}

/**
 * Parcourt le DOM et remplace les textes marqués par [data-i18n]
 */
export function appliquerTraductions() {
  const dict = dictionnaireTraductions[langueCourante] || dictionnaireTraductions['fr'] || {};

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const cle = el.getAttribute('data-i18n');
    const traduction = recupererValeurCle(dict, cle);
    if (traduction) {
      el.textContent = traduction;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const cle = el.getAttribute('data-i18n-placeholder');
    const traduction = recupererValeurCle(dict, cle);
    if (traduction) {
      el.placeholder = traduction;
    }
  });
}

/**
 * Récupère une valeur imbriquée ("carte.appel" -> dict.carte.appel)
 */
function recupererValeurCle(obj, chemin) {
  if (!chemin) return null;
  const parties = chemin.split('.');
  let courant = obj;
  for (const p of parties) {
    if (courant && typeof courant === 'object' && p in courant) {
      courant = courant[p];
    } else {
      return null;
    }
  }
  return courant;
}

/**
 * Met à jour le style actif sur les sélecteurs de langue dans le header
 */
function mettreAJourSelecteurUI() {
  document.querySelectorAll('.btn-lang-switch').forEach((btn) => {
    const lang = btn.getAttribute('data-lang');
    const estActif = (lang === langueCourante);
    btn.classList.toggle('active', estActif);
    btn.setAttribute('aria-pressed', String(estActif));
  });
}

export function getLangueCourante() {
  return langueCourante;
}
