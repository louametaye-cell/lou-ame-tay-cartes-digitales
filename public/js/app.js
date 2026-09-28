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
      <div class="erreur-icone-alerte">⚠️</div>
      <h3 style="font-family: var(--police-titre); font-size: 1.2rem; color: #B91C1C; margin-bottom: 0.5rem; font-weight: 700;">
        Impossible de charger les conseillers
      </h3>
      <p style="color: #64748B; font-size: 0.92rem; margin-bottom: 1.25rem; line-height: 1.5;">
        Impossible de contacter la base de données. Vérifiez votre connexion internet ou réessayez.
      </p>
      <button type="button" id="btn-reessayer-chargement" class="btn btn-primaire" style="margin: 0 auto;">
        🔄 Réessayer
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

  // 1. Tentative de chargement en direct depuis Supabase
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
        chargementReussi = true;
        appliquerFiltres();
        return;
      }
    } catch (err) {
      console.warn('Erreur chargement Supabase, repli sur le catalogue local :', err);
    }
  }

  // 2. Repli immédiat (fallback) sur data.js pour garantir que les 4 cartes sont TOUJOURS affichées
  if (typeof commerciaux !== 'undefined' && Array.isArray(commerciaux) && commerciaux.length > 0) {
    listeCommerciauxActifs = commerciaux.filter(c => c.actif !== false);
    chargementReussi = true;
    appliquerFiltres();
    return;
  }

  // 3. Si aucun commercial n'a pu être chargé
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
        document.querySelectorAll('.filtre-badge, .btn-filtre-cat').forEach(b => {
          const estTous = b.getAttribute('data-categorie') === 'Tous';
          b.classList.toggle('active', estTous);
          b.classList.toggle('actif', estTous);
          b.setAttribute('aria-pressed', String(estTous));
        });
        appliquerFiltres();
      });
    }

    if (compteur) {
      compteur.textContent = '0 conseiller trouvé';
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

  // Écouteurs sur les boutons de catégories (classe .filtre-badge et rétrocompatibilité)
  const boutonsCat = document.querySelectorAll('.filtre-badge, .btn-filtre-cat');
  boutonsCat.forEach(btn => {
    btn.addEventListener('click', () => {
      boutonsCat.forEach(b => {
        b.classList.remove('active', 'actif');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active', 'actif');
      btn.setAttribute('aria-pressed', 'true');
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
