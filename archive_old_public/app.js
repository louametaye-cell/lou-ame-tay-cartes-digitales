/**
 * ==========================================================================
 * FICHIER : js/app.js
 * LOGIQUE DE LA PAGE D'ACCUEIL (INDEX.HTML) — LOU AME TAY
 * ==========================================================================
 * Gère l'affichage dynamique de la liste des commerciaux terrain,
 * le filtre de recherche en direct et les offres SaaS CHR.
 */

document.addEventListener('DOMContentLoaded', () => {
  initialiserEntreprise();
  initialiserOffresAccueil();
  initialiserCommerciaux();
  initialiserRecherche();
  initialiserPiedDePage();
});

/**
 * Affiche les informations de l'entreprise Lou Ame Tay, fonctionnalités et galerie
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

  // Rendu des 4 fonctionnalités phares
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

  // Rendu de la galerie de photos
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
 * Affiche la grille des formules (Tàmbali, Nio Far, Xéweul, Sur Mesure) sur l'accueil
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
 * Rendu de la grille des cartes commerciales avec aperçu portrait 4:5
 * @param {Array} liste - Liste des commerciaux filtrés
 */
function rendreGrilleCommerciaux(liste) {
  const annuaire = document.getElementById('annuaire');
  const compteur = document.getElementById('compteur-resultats');
  if (!annuaire) return;

  annuaire.innerHTML = '';

  if (!liste || liste.length === 0) {
    annuaire.innerHTML = `
      <div class="aucun-resultat">
        <h3 style="font-family: var(--police-titre); font-size: 1.3rem; color: var(--marine-fonce); margin-bottom: 0.5rem;">
          Aucun conseiller commercial trouvé
        </h3>
        <p style="color: var(--gris-texte-muet);">
          Vérifiez l'orthographe du prénom, nom, zone (Dakar, Thiès, Mbour) ou poste.
        </p>
      </div>
    `;
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

    carte.innerHTML = `
      <!-- Vignette photo portrait 4:5 avec dégradé et nom superposé -->
      <a href="${urlCarte}" class="carte-vignette-hero" title="Ouvrir la carte de ${commercial.prenom} ${commercial.nom}">
        <img 
          src="${commercial.photo || 'images/commercial1.jpg'}" 
          alt="${commercial.prenom} ${commercial.nom}" 
          class="carte-vignette-img"
          loading="lazy"
          onerror="this.onerror=null; this.src='images/commercial1.svg';"
        >
        <div class="carte-vignette-overlay">
          <span class="vignette-badge-logo">✦ Lou Ame Tay 🍽️</span>
          <h3 class="vignette-nom">${commercial.prenom} ${commercial.nom}</h3>
          <p class="vignette-poste">${commercial.poste}</p>
        </div>
      </a>

      <!-- Pied de carte avec zone d'intervention et actions -->
      <div class="carte-vignette-pied">
        <div class="vignette-zone">
          <span>📍</span>
          <span>${commercial.zone || 'Dakar — Thiès — Mbour'}</span>
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
 * Initialise l'annuaire au chargement
 */
function initialiserCommerciaux() {
  if (typeof commerciaux !== 'undefined' && Array.isArray(commerciaux)) {
    rendreGrilleCommerciaux(commerciaux);
  }
}

/**
 * Filtre les commerciaux en temps réel
 */
function initialiserRecherche() {
  const champ = document.getElementById('recherche');
  const btnEffacer = document.getElementById('btn-effacer-recherche');

  if (!champ || typeof commerciaux === 'undefined') return;

  const normaliser = (str) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const filtrer = () => {
    const requete = normaliser(champ.value);

    if (btnEffacer) {
      btnEffacer.style.display = requete.length > 0 ? 'block' : 'none';
    }

    if (!requete) {
      rendreGrilleCommerciaux(commerciaux);
      return;
    }

    const resultats = commerciaux.filter(c => {
      const nomComplet = normaliser(`${c.prenom} ${c.nom}`);
      const poste = normaliser(c.poste);
      const zone = normaliser(c.zone);
      const email = normaliser(c.email);
      const tel = normaliser(c.telephone);
      return (
        nomComplet.includes(requete) ||
        poste.includes(requete) ||
        zone.includes(requete) ||
        email.includes(requete) ||
        tel.includes(requete)
      );
    });

    rendreGrilleCommerciaux(resultats);
  };

  champ.addEventListener('input', filtrer);

  if (btnEffacer) {
    btnEffacer.addEventListener('click', () => {
      champ.value = '';
      champ.focus();
      filtrer();
    });
  }
}

/**
 * Année courante dynamique
 */
function initialiserPiedDePage() {
  const elAnnee = document.getElementById('annee');
  if (elAnnee) {
    elAnnee.textContent = new Date().getFullYear();
  }
}
