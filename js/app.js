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
let zoneFiltreCourante = 'tous';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialisation de l'internationalisation
  await initialiserI18n();

  // 2. Initialisation du menu burger mobile
  initialiserMenuBurger();

  // 3. Initialisation immédiate des filtres et écouteurs
  initialiserRechercheEtFiltres();
  initialiserPiedDePage();

  // 4. Initialisation des sections statiques / entreprise
  initialiserEntreprise();
  initialiserOffresAccueil();

  // 5. Chargement des données des conseillers
  await chargerCommerciauxDepuisSupabase();
});

/**
 * Initialise le comportement du menu burger mobile (< 768px)
 */
function initialiserMenuBurger() {
  const btnBurger = document.getElementById('btn-burger');
  const tiroir = document.getElementById('menu-tiroir-mobile');
  if (!btnBurger || !tiroir) return;

  btnBurger.addEventListener('click', () => {
    const estOuvert = btnBurger.classList.toggle('ouvert');
    tiroir.classList.toggle('ouvert', estOuvert);
    btnBurger.setAttribute('aria-expanded', String(estOuvert));
    tiroir.setAttribute('aria-hidden', String(!estOuvert));
  });

  // Fermer automatiquement le tiroir lors d'un clic sur un lien
  tiroir.querySelectorAll('.tiroir-lien, .btn').forEach(lien => {
    lien.addEventListener('click', () => {
      btnBurger.classList.remove('ouvert');
      tiroir.classList.remove('ouvert');
      btnBurger.setAttribute('aria-expanded', 'false');
      tiroir.setAttribute('aria-hidden', 'true');
    });
  });
}

/**
 * Affiche le loader avec 4 cartes skeleton shimmer animées
 */
function afficherLoaderSkeleton() {
  const annuaire = document.getElementById('annuaire');
  if (!annuaire) return;

  annuaire.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; margin-bottom: 1.25rem;">
      <div class="spinner-chargement" style="width: 32px; height: 32px; margin: 0 auto 0.75rem; border-color: rgba(11, 31, 58, 0.15); border-top-color: var(--marine-fonce);"></div>
      <p style="color: var(--gris-texte-muet); font-size: 0.95rem; font-weight: 500;">Chargement de l'équipe des conseillers terrain...</p>
    </div>
    <div class="grille-skeleton" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; width: 100%;">
      ${[1, 2, 3, 4].map(() => `
        <div class="carte-skeleton">
          <div class="skeleton-hero skeleton-shimmer"></div>
          <div class="skeleton-pied">
            <div class="skeleton-ligne moyen skeleton-shimmer"></div>
            <div class="skeleton-ligne court skeleton-shimmer"></div>
            <div class="skeleton-btn skeleton-shimmer"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Affiche un message d'erreur si la connexion à Supabase échoue et qu'aucune donnée n'est disponible
 */
function afficherErreurConnexion() {
  const annuaire = document.getElementById('annuaire');
  const compteur = document.getElementById('compteur-resultats');
  if (!annuaire) return;

  annuaire.innerHTML = `
    <div class="erreur-connexion-cadre">
      <div class="erreur-icone-alerte">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <h3 style="font-family: var(--police-titre); font-size: 1.2rem; color: #B91C1C; margin-bottom: 0.5rem; font-weight: 700;">
        Impossible de charger les conseillers
      </h3>
      <p style="color: #64748B; font-size: 0.92rem; margin-bottom: 1.25rem; line-height: 1.5;">
        Impossible de contacter la base de données. Vérifiez votre connexion internet ou réessayez.
      </p>
      <button type="button" id="btn-reessayer-chargement" class="btn btn-primaire" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
          <path d="M8 16H3v5"></path>
        </svg>
        <span>Réessayer</span>
      </button>
    </div>
  `;

  if (compteur) compteur.textContent = '';

  const btnReessayer = document.getElementById('btn-reessayer-chargement');
  if (btnReessayer) {
    btnReessayer.addEventListener('click', async () => {
      await chargerCommerciauxDepuisSupabase();
    });
  }
}

/**
 * Charge les commerciaux avec loader skeleton, fallback robuste et synchronisation
 */
async function chargerCommerciauxDepuisSupabase() {
  const annuaire = document.getElementById('annuaire');

  // Si aucune donnée n'est encore chargée, afficher le skeleton loader
  if (listeCommerciauxActifs.length === 0) {
    afficherLoaderSkeleton();
  }

  let chargementReussi = false;

  // 1. Chargement direct depuis Supabase (source de vérité unique)
  if (estSupabaseConfigure()) {
    try {
      const { data, error } = await supabase
        .from('commerciaux')
        .select('*')
        .eq('actif', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // La requête Supabase est un succès : que la base contienne 0 ou N commerciaux, c'est la vérité
      listeCommerciauxActifs = Array.isArray(data) ? data : [];
      chargementReussi = true;
      appliquerFiltres();
      return;
    } catch (err) {
      console.warn('Erreur chargement Supabase :', err);
    }
  }

  // 2. Repli de secours local UNIQUEMENT en cas d'erreur réseau/panne et si données locales non-vides
  if (typeof commerciaux !== 'undefined' && Array.isArray(commerciaux) && commerciaux.length > 0) {
    listeCommerciauxActifs = commerciaux.filter(c => c.actif !== false);
    chargementReussi = true;
    appliquerFiltres();
    return;
  }

  // 3. Si échec de connexion à Supabase
  if (!chargementReussi) {
    afficherErreurConnexion();
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
    const iconesMap = {
      "Menu Digital & Commande à Table": `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
      "Écran Cuisine (KDS)": `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
      "Tableau de Bord & Statistiques": `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`,
      "Gestion Immédiate des Ruptures": `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    };

    entreprise.fonctionnalites.forEach(f => {
      const item = document.createElement('div');
      item.style.background = '#F8FAFC';
      item.style.padding = '1.25rem';
      item.style.borderRadius = 'var(--arrondi-md)';
      item.style.border = '1px solid var(--gris-bordure)';
      const iconeSvg = iconesMap[f.titre] || `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(201, 162, 39, 0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${iconeSvg}
          </div>
          <h4 style="font-family: var(--police-titre); font-size: 1rem; color: var(--marine-fonce); font-weight: 700; margin: 0;">
            ${f.titre}
          </h4>
        </div>
        <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin: 0;">${f.desc}</p>
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

  const whatsappNum = (entreprise.contact && entreprise.contact.whatsapp) ? String(entreprise.contact.whatsapp).replace(/\D/g, '') : '221774587474';

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
      <a href="https://wa.me/${whatsappNum}?text=${encodeURIComponent(`Bonjour Lou Ame Tay, je souhaite choisir la formule ${o.nom} (${o.prix}) pour mon établissement.`)}" target="_blank" rel="noopener noreferrer" class="btn btn-primaire btn-choisir-offre" style="width: 100%; text-align: center; justify-content: center; font-weight: 800; display: inline-flex; align-items: center; gap: 8px;">
        <span>🚀 Choisir cette formule</span>
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
    const estVideTotal = listeCommerciauxActifs.length === 0;
    annuaire.innerHTML = `
      <div class="aucun-resultat" style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: #FFFFFF; border-radius: var(--arrondi-lg); border: 1px solid var(--gris-bordure); box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
        <div style="width: 64px; height: 64px; background: rgba(201, 162, 39, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3 style="font-family: var(--police-titre); font-size: 1.35rem; color: var(--marine-fonce); margin-bottom: 0.5rem; font-weight: 700;">
          ${estVideTotal ? 'Aucun conseiller commercial publié' : 'Aucun conseiller commercial trouvé'}
        </h3>
        <p style="color: var(--gris-texte-muet); max-width: 520px; margin: 0 auto 1.5rem; font-size: 0.95rem; line-height: 1.6;">
          ${estVideTotal 
            ? "L'équipe commerciale terrain est en cours de déploiement. Les nouvelles cartes de visite digitales officielles apparaîtront ici dès leur publication depuis l'espace d'administration." 
            : "Essayez d'autres mots-clés ou réinitialisez le filtre de catégorie pour afficher les résultats."}
        </p>
        ${!estVideTotal ? `
        <button type="button" id="btn-reinit-filtres" class="btn btn-contour btn-sm">
          Réinitialiser les filtres
        </button>` : ''}
      </div>
    `;

    const btnReinit = document.getElementById('btn-reinit-filtres');
    if (btnReinit) {
      btnReinit.addEventListener('click', () => {
        const champ = document.getElementById('recherche');
        if (champ) champ.value = '';
        zoneFiltreCourante = 'tous';
        categorieFiltreCourante = 'Tous';
        document.querySelectorAll('.filtre-btn, .filtre-badge, .btn-filtre-cat').forEach(b => {
          const estTous = (b.getAttribute('data-zone') === 'tous') || (b.getAttribute('data-categorie') === 'Tous');
          b.classList.toggle('active', estTous);
          b.classList.toggle('actif', estTous);
          b.setAttribute('aria-pressed', String(estTous));
        });
        appliquerFiltres();
      });
    }

    if (compteur) {
      compteur.textContent = estVideTotal ? '0 conseiller terrain publié' : '0 conseiller trouvé';
    }
    return;
  }

  if (compteur) {
    compteur.textContent = `${liste.length} conseiller${liste.length > 1 ? 's' : ''} terrain disponible${liste.length > 1 ? 's' : ''}`;
    // Réinitialise l'animation CSS d'apparition
    compteur.style.animation = 'none';
    void compteur.offsetWidth;
    compteur.style.animation = 'fadeInSlideUp 0.35s ease-out forwards';
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
            <span class="vignette-badge-logo">✦ Lou Ame Tay</span>
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
        <div class="vignette-zone" style="display: flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${zoneTexte}</span>
        </div>

        <p class="vignette-bio-texte">${bioTexte}</p>

        <a href="${urlCarte}" class="btn btn-primaire" style="width: 100%;">
          Ouvrir la carte digitale ➔
        </a>

        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.25rem;">
          ${commercial.telephone ? `
            <a href="tel:${commercial.telephone.replace(/\s+/g, '')}" class="btn btn-contour" style="padding: 0.4rem 0.75rem; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;" title="Appeler">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>Appeler</span>
            </a>
          ` : ''}
          ${commercial.whatsapp ? `
            <a href="https://wa.me/${commercial.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${commercial.prenom}, je vous contacte depuis le site Lou Ame Tay.`)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondaire" style="padding: 0.4rem 0.75rem; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;" title="WhatsApp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp</span>
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
 * Filtre les commerciaux selon le texte, la zone géographique et la catégorie
 */
function appliquerFiltres() {
  const champ = document.getElementById('recherche');
  const btnEffacer = document.getElementById('btn-effacer-recherche');
  const requete = champ ? normaliserTexte(champ.value) : '';

  if (btnEffacer) {
    btnEffacer.style.display = requete.length > 0 ? 'block' : 'none';
  }

  const resultats = listeCommerciauxActifs.filter(c => {
    // 1. Filtre par Zone Géographique
    if (zoneFiltreCourante && zoneFiltreCourante !== 'tous') {
      const zoneTxt = normaliserTexte(`${c.zone || ''} ${c.secteur || ''} ${c.ville || ''}`);
      if (zoneFiltreCourante === 'dakar' && !zoneTxt.includes('dakar') && !zoneTxt.includes('almadies') && !zoneTxt.includes('plateau') && !zoneTxt.includes('yoff') && !zoneTxt.includes('vdn')) {
        return false;
      }
      if (zoneFiltreCourante === 'thies' && !zoneTxt.includes('thies') && !zoneTxt.includes('standing')) {
        return false;
      }
      if (zoneFiltreCourante === 'saly' && !zoneTxt.includes('saly') && !zoneTxt.includes('mbour') && !zoneTxt.includes('petite')) {
        return false;
      }
      if (zoneFiltreCourante === 'saint-louis' && !zoneTxt.includes('saint') && !zoneTxt.includes('louis') && !zoneTxt.includes('fleuve')) {
        return false;
      }
    }

    // Rétrocompatibilité : Filtre par Catégorie si spécifié
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
 * Écouteurs pour la recherche textuelle et les boutons de filtres géographiques & catégories
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

  // Écouteurs sur les boutons de filtres (classe .filtre-btn, .filtre-badge et rétrocompatibilité)
  const boutonsFiltres = document.querySelectorAll('.filtre-btn, .filtre-badge, .btn-filtre-cat');
  boutonsFiltres.forEach(btn => {
    btn.addEventListener('click', () => {
      boutonsFiltres.forEach(b => {
        b.classList.remove('active', 'actif');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active', 'actif');
      btn.setAttribute('aria-pressed', 'true');

      if (btn.hasAttribute('data-zone')) {
        zoneFiltreCourante = btn.getAttribute('data-zone') || 'tous';
      }
      if (btn.hasAttribute('data-categorie')) {
        categorieFiltreCourante = btn.getAttribute('data-categorie') || 'Tous';
      }
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
