/**
 * ==============================================================================
 * FICHIER : js/app.js
 * LOGIQUE DE LA PAGE D'ACCUEIL (INDEX.HTML) — LOU AME TAY
 * ==============================================================================
 * Gère l'affichage dynamique de la liste des commerciaux terrain depuis Supabase,
 * le filtre par catégorie ('Direction', 'Vente', 'Support', 'Technique'),
 * la recherche textuelle en direct et le basculement trilingue (FR / Wolof / EN).
 * Requête principale : SELECT * FROM commerciaux WHERE actif = true
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';
import { initialiserI18n } from './i18n.js';
import { entreprise, commerciaux } from './data.js';
import './pwa-install.js';

// Cache local des commerciaux actifs chargés
let listeCommerciauxActifs = [];
let categorieFiltreCourante = 'Tous';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialisation de l'internationalisation
  await initialiserI18n();

  // 2. Initialisation des sections statiques / entreprise
  initialiserEntreprise();
  initialiserOffresAccueil();

  // 3. Chargement des données des conseillers
  await chargerCommerciauxDepuisSupabase();

  // 4. Initialisation des filtres et écouteurs
  initialiserRechercheEtFiltres();
  initialiserPiedDePage();
});

/**
 * Charge les commerciaux actifs avec affichage instantané (SWR) et synchronisation Supabase
 * SELECT * FROM commerciaux WHERE actif = true ORDER BY created_at DESC
 */
async function chargerCommerciauxDepuisSupabase() {
  const annuaire = document.getElementById('annuaire');

  // 1. Affichage INSTANTANÉ des données locales pour éliminer tout temps d'attente
  if (typeof commerciaux !== 'undefined' && Array.isArray(commerciaux) && commerciaux.length > 0) {
    listeCommerciauxActifs = commerciaux.filter(c => c.actif !== false);
    appliquerFiltres();
  } else if (annuaire) {
    annuaire.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem;">
        <div class="spinner-chargement" style="width: 32px; height: 32px; margin: 0 auto 1rem; border-color: rgba(11, 31, 58, 0.2); border-top-color: var(--marine-fonce);"></div>
        <p style="color: var(--gris-texte-muet); font-size: 0.95rem;">Chargement des conseillers terrain Lou Ame Tay...</p>
      </div>
    `;
  }

  // 2. Synchronisation en arrière-plan avec Supabase
  if (estSupabaseConfigure()) {
    try {
      const { data, error } = await supabase
        .from('commerciaux')
        .select('*')
        .eq('actif', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        listeCommerciauxActifs = data;
        appliquerFiltres();
      }
    } catch (err) {
      console.warn('Erreur synchronisation Supabase, maintien des données locales :', err);
    }
  }
}

/**
 * Rendu des informations de l'entreprise Lou Ame Tay, fonctionnalités et galerie
 */
function initialiserEntreprise() {
  if (typeof entreprise === 'undefined') return;

  const elNom = document.getElementById('nom-entreprise');
  const elSlogan = document.getElementById('slogan-entreprise');
  const elSloganSec = document.getElementById('slogan-section');
  const elDesc = document.getElementById('description-entreprise');
  const elLienSite = document.getElementById('lien-site');
  const elNavLien = document.getElementById('nav-lien-site');
  const elGalerie = document.getElementById('galerie');
  const elFonctionnalites = document.getElementById('grille-fonctionnalites');

  if (elNom && entreprise.nom) elNom.textContent = entreprise.nom;
  if (elSlogan && entreprise.slogan) elSlogan.textContent = entreprise.slogan;
  if (elSloganSec && entreprise.slogan) elSloganSec.textContent = entreprise.slogan;
  if (elDesc && entreprise.description) elDesc.textContent = entreprise.description;
  if (elLienSite && entreprise.siteWeb) elLienSite.href = entreprise.siteWeb;
  if (elNavLien && entreprise.siteWeb) elNavLien.href = entreprise.siteWeb;

  // 4 fonctionnalités phares
  if (elFonctionnalites && Array.isArray(entreprise.fonctionnalites)) {
    elFonctionnalites.innerHTML = '';
    entreprise.fonctionnalites.forEach(f => {
      const item = document.createElement('div');
      item.style.background = '#F8FAFC';
      item.style.padding = '1.25rem';
      item.style.borderRadius = 'var(--arrondi-md)';
      item.style.border = '1px solid var(--gris-bordure)';
      item.innerHTML = `
        <h4 style="font-family: var(--police-titre); font-size: 1rem; color: var(--marine-fonce); font-weight: 700; margin-bottom: 0.35rem;">
          ✨ ${f.titre}
        </h4>
        <p style="font-size: 0.88rem; color: #475569; line-height: 1.5;">${f.desc}</p>
      `;
      elFonctionnalites.appendChild(item);
    });
  }

  // Galerie de photos
  if (elGalerie && Array.isArray(entreprise.images)) {
    elGalerie.innerHTML = '';
    entreprise.images.forEach((imgSrc, index) => {
      const carteImg = document.createElement('div');
      carteImg.className = 'chimp-galerie-item';
      carteImg.style.aspectRatio = '16 / 10';
      carteImg.style.borderRadius = 'var(--arrondi-md)';
      carteImg.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
      carteImg.innerHTML = `
        <img 
          src="${imgSrc}" 
          alt="Déploiement Lou Ame Tay ${index + 1}" 
          style="width: 100%; height: 100%; object-fit: cover;"
          loading="lazy"
        >
      `;
      elGalerie.appendChild(carteImg);
    });
  }
}

/**
 * Affiche la grille des offres (Tàmbali, Nio Far, Xéweul, Sur Mesure)
 */
function initialiserOffresAccueil() {
  const conteneurOffres = document.getElementById('grille-offres-accueil');
  if (!conteneurOffres || typeof entreprise === 'undefined' || !Array.isArray(entreprise.offres)) return;

  conteneurOffres.innerHTML = '';

  entreprise.offres.forEach(o => {
    const card = document.createElement('div');
    card.className = `carte-offre-item ${o.populaire ? 'populaire' : ''}`;
    card.innerHTML = `
      <div class="carte-offre-haut">
        <h3 class="offre-nom">${o.nom}</h3>
        <span class="offre-badge">${o.badge}</span>
      </div>
      <div class="offre-prix">${o.prix}</div>
      <p class="offre-cible">${o.cible}</p>
      <ul class="offre-details-liste">
        ${o.details.map(d => `<li>${d}</li>`).join('')}
      </ul>
      <a href="https://wa.me/${entreprise.contact.whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite souscrire ou tester la ${o.nom}.`)}" target="_blank" rel="noopener noreferrer" class="btn btn-primaire btn-choisir-offre">
        Choisir cette formule ➔
      </a>
    `;
    conteneurOffres.appendChild(card);
  });
}

/**
 * Rendu de la grille des cartes commerciales
 * @param {Array} liste
 */
function rendreGrilleCommerciaux(liste) {
  const annuaire = document.getElementById('annuaire');
  const compteur = document.getElementById('compteur-resultats');
  if (!annuaire) return;

  annuaire.innerHTML = '';

  if (!liste || liste.length === 0) {
    annuaire.innerHTML = `
      <div class="aucun-resultat" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: #FFFFFF; border-radius: var(--arrondi-lg); border: 1px solid var(--gris-bordure);">
        <h3 style="font-family: var(--police-titre); font-size: 1.3rem; color: var(--marine-fonce); margin-bottom: 0.5rem;">
          Aucun conseiller commercial trouvé
        </h3>
        <p style="color: var(--gris-texte-muet); margin-bottom: 1rem;">
          Essayez d'autres mots-clés ou réinitialisez le filtre de catégorie.
        </p>
        <button type="button" id="btn-reinit-filtres" class="btn btn-contour btn-sm">
          Réinitialiser les filtres
        </button>
      </div>
    `;

    const btnReinit = document.getElementById('btn-reinit-filtres');
    if (btnReinit) {
      btnReinit.addEventListener('click', () => {
        const champ = document.getElementById('recherche');
        if (champ) champ.value = '';
        categorieFiltreCourante = 'Tous';
        document.querySelectorAll('.btn-filtre-cat').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-categorie') === 'Tous');
        });
        appliquerFiltres();
      });
    }

    if (compteur) compteur.textContent = '0 conseiller trouvé';
    return;
  }

  if (compteur) {
    compteur.textContent = `${liste.length} conseiller${liste.length > 1 ? 's' : ''} terrain disponible${liste.length > 1 ? 's' : ''}`;
  }

  liste.forEach(commercial => {
    const carte = document.createElement('article');
    carte.className = 'carte-commercial';
    carte.setAttribute('aria-label', `Carte de ${commercial.prenom} ${commercial.nom}`);

    const urlCarte = `carte.html?id=${encodeURIComponent(commercial.id)}`;
    const bioTexte = commercial.bio || "Conseiller terrain Lou Ame Tay pour la restauration et l'hôtellerie.";
    const photoSrc = commercial.photo_url || commercial.photo || 'images/commercial1.svg';
    const zoneTexte = commercial.zone || 'Axe Thiès — Dakar — Mbour';
    const catTexte = commercial.categorie || 'Vente';

    carte.innerHTML = `
      <!-- Vignette photo portrait 4:5 avec dégradé et nom superposé -->
      <a href="${urlCarte}" class="carte-vignette-hero" title="Ouvrir la carte de ${commercial.prenom} ${commercial.nom}">
        <img 
          src="${photoSrc}" 
          alt="${commercial.prenom} ${commercial.nom}" 
          class="carte-vignette-img"
          loading="lazy"
          onerror="this.onerror=null; this.src='images/commercial1.svg';"
        >
        <div class="carte-vignette-overlay">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span class="vignette-badge-logo">✦ Lou Ame Tay 🍽️</span>
            <span style="background: rgba(201, 162, 39, 0.9); color: #0B1F3A; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">
              ${catTexte}
            </span>
          </div>
          <h3 class="vignette-nom">${commercial.prenom} ${commercial.nom}</h3>
          <p class="vignette-poste">${commercial.poste || 'Conseiller Terrain'}</p>
        </div>
      </a>

      <!-- Pied de carte avec zone d'intervention et actions -->
      <div class="carte-vignette-pied">
        <div class="vignette-zone">
          <span>📍</span>
          <span>${zoneTexte}</span>
        </div>

        <p class="vignette-bio-texte">${bioTexte}</p>

        <a href="${urlCarte}" class="btn btn-primaire" style="width: 100%;">
          Ouvrir la carte digitale ➔
        </a>

        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.25rem;">
          ${commercial.telephone ? `
            <a href="tel:${commercial.telephone.replace(/\s+/g, '')}" class="btn btn-contour" style="padding: 0.4rem 0.75rem; font-size: 0.85rem;" title="Appeler">
              📞 Appeler
            </a>
          ` : ''}
          ${commercial.whatsapp ? `
            <a href="https://wa.me/${commercial.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${commercial.prenom}, je vous contacte depuis le site Lou Ame Tay.`)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondaire" style="padding: 0.4rem 0.75rem; font-size: 0.85rem;" title="WhatsApp">
              💬 WhatsApp
            </a>
          ` : ''}
        </div>
      </div>
    `;

    annuaire.appendChild(carte);
  });
}

/**
 * Normalise une chaîne de caractères pour recherche insensible aux accents et casse
 */
function normaliserTexte(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtre les commerciaux selon le texte et la catégorie sélectionnés
 */
function appliquerFiltres() {
  const champ = document.getElementById('recherche');
  const btnEffacer = document.getElementById('btn-effacer-recherche');
  const requete = champ ? normaliserTexte(champ.value) : '';

  if (btnEffacer) {
    btnEffacer.style.display = requete.length > 0 ? 'block' : 'none';
  }

  const resultats = listeCommerciauxActifs.filter(c => {
    // 1. Filtre par Catégorie
    if (categorieFiltreCourante !== 'Tous') {
      const cat = c.categorie || '';
      if (cat.toLowerCase() !== categorieFiltreCourante.toLowerCase()) {
        return false;
      }
    }

    // 2. Filtre textuel
    if (!requete) return true;

    const nomComplet = normaliserTexte(`${c.prenom} ${c.nom}`);
    const poste = normaliserTexte(c.poste);
    const zone = normaliserTexte(c.zone || 'Dakar Thiès Mbour');
    const email = normaliserTexte(c.email);
    const tel = normaliserTexte(c.telephone);

    return (
      nomComplet.includes(requete) ||
      poste.includes(requete) ||
      zone.includes(requete) ||
      email.includes(requete) ||
      tel.includes(requete)
    );
  });

  rendreGrilleCommerciaux(resultats);
}

/**
 * Écouteurs pour la recherche textuelle et les boutons de catégories
 */
function initialiserRechercheEtFiltres() {
  const champ = document.getElementById('recherche');
  const btnEffacer = document.getElementById('btn-effacer-recherche');

  if (champ) {
    champ.addEventListener('input', appliquerFiltres);
  }

  if (btnEffacer && champ) {
    btnEffacer.addEventListener('click', () => {
      champ.value = '';
      champ.focus();
      appliquerFiltres();
    });
  }

  // Écouteurs sur les boutons de catégories
  const boutonsCat = document.querySelectorAll('.btn-filtre-cat');
  boutonsCat.forEach(btn => {
    btn.addEventListener('click', () => {
      boutonsCat.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      categorieFiltreCourante = btn.getAttribute('data-categorie') || 'Tous';
      appliquerFiltres();
    });
  });
}

/**
 * Met à jour l'année dynamique dans le pied de page
 */
function initialiserPiedDePage() {
  const elAnnee = document.getElementById('annee');
  if (elAnnee) {
    elAnnee.textContent = new Date().getFullYear();
  }
}
