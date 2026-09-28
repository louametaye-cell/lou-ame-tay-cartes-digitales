/**
 * ==========================================================================
 * FICHIER : js/admin.js
 * LOGIQUE DU TABLEAU DE BORD D'ADMINISTRATION (ADMIN.HTML) — LOU AME TAY
 * ==========================================================================
 * Gère :
 * 1. L'authentification Supabase Auth (protection d'accès & déconnexion)
 * 2. Le CRUD complet (Création, Lecture, Modification, Suppression)
 * 3. Le basculement Actif/Inactif en 1 clic
 * 4. L'upload de photo vers le bucket Storage public 'photos'
 * 5. L'ouverture du formulaire modal (+ Nouveau commercial / Modifier)
 * 6. Les exports PNG HD, PDF A4 85x55mm et CSV
 */

import { supabase, estSupabaseConfigure, enregistrerConfigurationSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-client.js';
import { telechargerQRCodePNG, ouvrirModalPreviewQR, telechargerToutesCartesPDF, exporterDonneesCSV } from './qrcode-export.js';
import { getPrioriteLead } from './lead-scoring.js';
import { commerciaux as commerciauxSecours } from './data.js';

// Variables d'état local
let listeCommerciaux = [];
let listeFiltree = [];
let listeLeads = [];
let listeLeadsFiltree = [];
let commercialEnSuppression = null;
let commercialActuelQR = null;
let chartActiviteInstance = null;
let chartZonesInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  await verifierAuthentification();
  initialiserInterface();
  initialiserNavigationOnglets();
  initialiserModalCommercial();
  initialiserFiltresEtRecherche();
  initialiserLeadsCRM();
  initialiserParametres();
  await chargerCommerciaux();
  await chargerLeads();
});

/**
 * 1. Vérification de la session active Supabase Auth ou Démo Locale
 * Redirige vers login.html si non authentifié
 */
async function verifierAuthentification() {
  const isDemo = sessionStorage.getItem('LOUAMETAY_DEMO_SESSION') === 'true';
  if (isDemo) {
    const elEmail = document.getElementById('admin-user-email');
    if (elEmail) {
      elEmail.textContent = sessionStorage.getItem('LOUAMETAY_DEMO_USER_EMAIL') || 'demo-admin@louametay.com (Mode Démo)';
    }
    return;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      window.location.href = 'login.html';
      return;
    }

    // Affichage de l'email admin
    const elEmail = document.getElementById('admin-user-email');
    if (elEmail && session.user && session.user.email) {
      elEmail.textContent = session.user.email;
    }

    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = 'login.html';
      }
    });

  } catch (err) {
    console.error('Erreur vérification session :', err);
    window.location.href = 'login.html';
  }
}

/**
 * 2. Chargement de tous les commerciaux depuis Supabase
 * SELECT * FROM commerciaux ORDER BY created_at DESC
 */
export async function chargerCommerciaux() {
  const tbodyDashboard = document.getElementById('tbody-dashboard-recents');
  const tbodyCommerciaux = document.getElementById('tbody-commerciaux');

  if (!estSupabaseConfigure()) {
    afficherBanniereAlerte(true);
    if (tbodyDashboard) {
      tbodyDashboard.innerHTML = `
        <tr>
          <td colspan="5" class="table-chargement" style="color: #B45309;">
            ⚙️ Supabase non configuré. Renseignez vos identifiants dans l'onglet <strong>Paramètres & BD</strong>.
          </td>
        </tr>`;
    }
    if (tbodyCommerciaux) {
      tbodyCommerciaux.innerHTML = `
        <tr>
          <td colspan="6" class="table-chargement" style="color: #B45309;">
            ⚙️ En attente de la configuration de votre projet Supabase.
          </td>
        </tr>`;
    }
    return;
  }

  afficherBanniereAlerte(false);

  try {
    const { data, error } = await supabase
      .from('commerciaux')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    listeCommerciaux = data || [];
    listeFiltree = [...listeCommerciaux];

    actualiserStatistiques(listeCommerciaux);
    rendreTableauDashboard(listeCommerciaux.slice(0, 5));
    rendreTableauCommerciaux(listeFiltree);
    rendreGalerieExports(listeCommerciaux);

  } catch (err) {
    console.error('Erreur chargement commerciaux :', err);
    afficherToast('Erreur chargement Supabase : ' + (err.message || err));
  }
}

/**
 * 3. Création d'un commercial (INSERT INTO commerciaux)
 */
export async function creerCommercial(donnees) {
  const { data, error } = await supabase
    .from('commerciaux')
    .insert([donnees])
    .select();

  if (error) throw error;
  return data ? data[0] : null;
}

/**
 * 4. Modification d'un commercial (UPDATE commerciaux SET ... WHERE id = ?)
 */
export async function modifierCommercial(id, donnees) {
  const donneesMiseAJour = {
    ...donnees,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('commerciaux')
    .update(donneesMiseAJour)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data ? data[0] : null;
}

/**
 * 5. Suppression d'un commercial (DELETE FROM commerciaux WHERE id = ?)
 */
export async function supprimerCommercial(id) {
  const { error } = await supabase
    .from('commerciaux')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * 6. Bascule Actif / Inactif en 1 clic
 * UPDATE commerciaux SET actif = ? WHERE id = ?
 */
export async function toggleActif(id, nouvelEtat) {
  try {
    const { error } = await supabase
      .from('commerciaux')
      .update({ actif: nouvelEtat, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // Mise à jour de l'état local immédiate
    const commercial = listeCommerciaux.find(c => c.id === id);
    if (commercial) {
      commercial.actif = nouvelEtat;
      actualiserStatistiques(listeCommerciaux);
      afficherToast(nouvelEtat ? `✓ Carte de ${commercial.prenom} activée.` : `Carte de ${commercial.prenom} désactivée.`);
    }
  } catch (err) {
    console.error('Erreur bascule statut :', err);
    afficherToast('Erreur lors du changement de statut : ' + err.message);
    await chargerCommerciaux();
  }
}

/**
 * 7. Téléversement de photo vers Supabase Storage (bucket 'photos')
 * @param {File} fichier - Fichier image sélectionné
 * @returns {Promise<string>} URL publique de l'image
 */
export async function uploadPhoto(fichier) {
  if (!fichier) return null;

  const extension = fichier.name.split('.').pop() || 'jpg';
  const nomFichierNettoye = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
  const cheminStockage = `commerciaux/${nomFichierNettoye}`;

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(cheminStockage, fichier, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Erreur Supabase Storage :', error);
    throw new Error(`Échec upload photo: ${error.message}. Vérifiez que le bucket 'photos' existe et est public.`);
  }

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(cheminStockage);

  return urlData.publicUrl;
}

/**
 * 8. Rendu du tableau complet des commerciaux
 */
function rendreTableauCommerciaux(liste) {
  const tbody = document.getElementById('tbody-commerciaux');
  if (!tbody) return;

  if (liste.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="table-vide">
          <div style="padding: 2.5rem; text-align: center;">
            <p style="font-size: 1.05rem; color: #475569; margin-bottom: 0.75rem;">Aucun conseiller commercial ne correspond à votre recherche.</p>
            <button type="button" class="btn btn-primaire btn-sm" id="btn-creer-vide">
              + Ajouter un commercial
            </button>
          </div>
        </td>
      </tr>`;
    document.getElementById('btn-creer-vide')?.addEventListener('click', ouvrirModalNouveau);
    return;
  }

  tbody.innerHTML = liste.map(c => {
    const photoSrc = c.photo_url || c.photo || 'images/commercial1.jpg';
    const lienCarte = `carte.html?id=${encodeURIComponent(c.id)}`;
    const estActif = c.actif !== false;

    return `
      <tr class="ligne-commercial ${estActif ? '' : 'ligne-inactive'}">
        <!-- Photo & Nom -->
        <td>
          <div class="col-commercial-identite">
            <img 
              src="${photoSrc}" 
              alt="${c.prenom} ${c.nom}" 
              class="avatar-table-mini"
              onerror="this.onerror=null; this.src='images/commercial1.svg';"
            >
            <div>
              <strong class="table-nom-commercial">${c.prenom} ${c.nom}</strong>
              <span class="table-id-muet">ID: ${String(c.id).substring(0, 8)}...</span>
            </div>
          </div>
        </td>

        <!-- Poste & Catégorie -->
        <td>
          <div class="table-poste-txt">${c.poste || 'Conseiller Terrain'}</div>
          <span class="badge-categorie badge-${(c.categorie || 'Vente').toLowerCase().replace(/\s+/g, '')}">${c.categorie || 'Vente'}</span>
        </td>

        <!-- Contact -->
        <td>
          <div class="table-contact-lignes">
            ${c.telephone ? `<span>📞 ${c.telephone}</span>` : ''}
            ${c.whatsapp ? `<span style="color: #166534;">💬 +${c.whatsapp.replace(/\D/g, '')}</span>` : ''}
            ${c.email ? `<span style="color: #64748B; font-size: 0.8rem;">✉️ ${c.email}</span>` : ''}
          </div>
        </td>

        <!-- Statut 1-clic -->
        <td>
          <div class="switch-table-wrapper">
            <label class="switch-table">
              <input type="checkbox" class="chk-toggle-actif" data-id="${c.id}" ${estActif ? 'checked' : ''}>
              <span class="switch-table-curseur"></span>
            </label>
            <span class="statut-libelle ${estActif ? 'texte-actif' : 'texte-inactif'}">
              ${estActif ? 'Active' : 'Désactivée'}
            </span>
          </div>
        </td>

        <!-- QR Code -->
        <td>
          <button type="button" class="btn-qr-action btn-ouvrir-qr" data-id="${c.id}" title="Aperçu et export PNG 1000px">
            <span class="icone-qr-btn">▦</span>
            <span>QR Code</span>
          </button>
        </td>

        <!-- Actions -->
        <td style="text-align: right;">
          <div class="table-actions-cell">
            <a href="${lienCarte}" target="_blank" class="btn-icone-action btn-voir" title="Voir la carte publique">
              👁️
            </a>
            <button type="button" class="btn-icone-action btn-editer" data-id="${c.id}" title="Modifier">
              ✏️
            </button>
            <button type="button" class="btn-icone-action btn-supprimer" data-id="${c.id}" title="Supprimer">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  attacherEvenementsTable(tbody);
}

/**
 * 9. Rendu du tableau récents du Dashboard
 */
function rendreTableauDashboard(liste) {
  const tbody = document.getElementById('tbody-dashboard-recents');
  if (!tbody) return;

  if (liste.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748B; padding: 1.5rem;">Aucune carte enregistrée.</td></tr>`;
    return;
  }

  tbody.innerHTML = liste.map(c => {
    const photoSrc = c.photo_url || c.photo || 'images/commercial1.jpg';
    const estActif = c.actif !== false;

    return `
      <tr>
        <td>
          <div class="col-commercial-identite">
            <img src="${photoSrc}" alt="" class="avatar-table-mini" onerror="this.onerror=null; this.src='images/commercial1.svg';">
            <div>
              <strong>${c.prenom} ${c.nom}</strong>
              <span style="display: block; font-size: 0.8rem; color: #64748B;">${c.poste || ''}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge-categorie badge-${(c.categorie || 'Vente').toLowerCase().replace(/\s+/g, '')}">${c.categorie || 'Vente'}</span>
        </td>
        <td>${c.telephone || c.whatsapp || '-'}</td>
        <td>
          <span class="badge-statut-pill ${estActif ? 'statut-vert' : 'statut-gris'}">
            ${estActif ? '● Active' : '○ Inactive'}
          </span>
        </td>
        <td style="text-align: right;">
          <a href="carte.html?id=${encodeURIComponent(c.id)}" target="_blank" class="btn btn-contour btn-xs">
            Voir carte ↗
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 10. Actualise les compteurs statistiques
 */
function actualiserStatistiques(liste) {
  const total = liste.length;
  const actifs = liste.filter(c => c.actif !== false).length;
  const inactifs = total - actifs;

  const elTotal = document.getElementById('stat-total');
  const elActifs = document.getElementById('stat-actifs');
  const elInactifs = document.getElementById('stat-inactifs');
  const elBadgeTotal = document.getElementById('badge-compteur-total');

  if (elTotal) elTotal.textContent = total;
  if (elActifs) elActifs.textContent = actifs;
  if (elInactifs) elInactifs.textContent = inactifs;
  if (elBadgeTotal) elBadgeTotal.textContent = total;
}

/**
 * 11. Attache les écouteurs sur le tableau
 */
function attacherEvenementsTable(conteneur) {
  // Bascule Actif / Inactif
  conteneur.querySelectorAll('.chk-toggle-actif').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const nouvelEtat = e.target.checked;
      await toggleActif(id, nouvelEtat);
    });
  });

  // Bouton QR Code
  conteneur.querySelectorAll('.btn-ouvrir-qr').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const commercial = listeCommerciaux.find(c => String(c.id) === String(id));
      if (commercial) {
        commercialActuelQR = commercial;
        ouvrirModalPreviewQR(commercial);
      }
    });
  });

  // Bouton Modifier
  conteneur.querySelectorAll('.btn-editer').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      remplirFormulairePourEdition(id);
    });
  });

  // Bouton Supprimer
  conteneur.querySelectorAll('.btn-supprimer').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const commercial = listeCommerciaux.find(c => String(c.id) === String(id));
      if (commercial) {
        commercialEnSuppression = commercial;
        ouvrirModalSuppression(commercial);
      }
    });
  });
}

/**
 * 12. Gestion du Modal Commercial (Nouveau & Modification)
 */
function initialiserModalCommercial() {
  const modal = document.getElementById('modal-commercial');
  const form = document.getElementById('form-commercial');
  const btnFermer = document.getElementById('btn-fermer-modal-commercial');
  const btnAnnuler = document.getElementById('btn-annuler-modal-commercial');
  const fileInput = document.getElementById('comm-photo-file');
  const nomFichierEl = document.getElementById('comm-photo-nom-fichier');
  const imgApercu = document.getElementById('img-apercu-commercial');
  const urlPhotoInput = document.getElementById('comm-photo-url');

  const fermer = () => modal.classList.remove('active');

  btnFermer?.addEventListener('click', fermer);
  btnAnnuler?.addEventListener('click', fermer);

  // Fermeture si clic hors contenu ou Échap
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) fermer();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) fermer();
  });

  // Aperçu de la photo lors de la sélection de fichier
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      nomFichierEl.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (imgApercu) imgApercu.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Aperçu si l'URL directe est modifiée
  urlPhotoInput?.addEventListener('input', () => {
    if (urlPhotoInput.value.trim() && imgApercu) {
      imgApercu.src = urlPhotoInput.value.trim();
    }
  });

  // Soumission du formulaire (Création ou Mise à jour)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('commercial-id').value;
    const btnSave = document.getElementById('btn-enregistrer-commercial');
    const txtSave = document.getElementById('btn-save-texte');
    const spinner = document.getElementById('btn-save-spinner');

    btnSave.disabled = true;
    txtSave.textContent = 'Enregistrement...';
    spinner.style.display = 'inline-block';

    try {
      // 1. Upload photo si nouveau fichier
      let photoUrl = urlPhotoInput.value.trim() || 'images/commercial1.jpg';
      if (fileInput.files && fileInput.files[0]) {
        txtSave.textContent = 'Envoi photo...';
        photoUrl = await uploadPhoto(fileInput.files[0]);
      }

      // 2. Assemblage des données
      const donnees = {
        prenom: document.getElementById('comm-prenom').value.trim(),
        nom: document.getElementById('comm-nom').value.trim(),
        poste: document.getElementById('comm-poste').value.trim(),
        categorie: document.getElementById('comm-categorie').value,
        telephone: document.getElementById('comm-telephone').value.trim(),
        whatsapp: document.getElementById('comm-whatsapp').value.trim().replace(/\D/g, ''),
        email: document.getElementById('comm-email').value.trim(),
        zone: document.getElementById('comm-zone').value.trim() || 'Dakar — Thiès — Mbour',
        disponibilite: document.getElementById('comm-disponibilite').value.trim() || 'Disponible pour démo en salle',
        photo_url: photoUrl,
        bio: document.getElementById('comm-bio').value.trim(),
        linkedin: document.getElementById('comm-linkedin').value.trim(),
        facebook: document.getElementById('comm-facebook').value.trim(),
        instagram: document.getElementById('comm-instagram').value.trim(),
        tiktok: document.getElementById('comm-tiktok').value.trim(),
        actif: document.getElementById('comm-actif').checked
      };

      if (id) {
        // Mode modification
        await modifierCommercial(id, donnees);
        afficherToast(`✓ Carte de ${donnees.prenom} ${donnees.nom} mise à jour avec succès.`);
      } else {
        // Mode création
        await creerCommercial(donnees);
        afficherToast(`✓ Nouveau conseiller ${donnees.prenom} ${donnees.nom} ajouté avec succès.`);
      }

      fermer();
      await chargerCommerciaux();

    } catch (err) {
      console.error('Erreur sauvegarde commercial :', err);
      afficherToast('Erreur : ' + (err.message || err));
    } finally {
      btnSave.disabled = false;
      txtSave.textContent = 'Enregistrer le commercial';
      spinner.style.display = 'none';
    }
  });
}

/**
 * 13. Ouvre le modal en mode création
 */
export function ouvrirModalNouveau() {
  const modal = document.getElementById('modal-commercial');
  const form = document.getElementById('form-commercial');
  const titre = document.getElementById('modal-commercial-titre');
  const btnTxt = document.getElementById('btn-save-texte');
  const imgApercu = document.getElementById('img-apercu-commercial');
  const nomFichierEl = document.getElementById('comm-photo-nom-fichier');

  if (form) form.reset();
  document.getElementById('commercial-id').value = '';
  document.getElementById('comm-actif').checked = true;
  document.getElementById('comm-zone').value = 'Axe Thiès — Dakar — Mbour';
  document.getElementById('comm-disponibilite').value = 'Disponible aujourd\'hui pour démo en salle';

  if (titre) titre.textContent = '+ Nouveau Conseiller Commercial';
  if (btnTxt) btnTxt.textContent = 'Créer le conseiller';
  if (imgApercu) imgApercu.src = 'images/commercial1.jpg';
  if (nomFichierEl) nomFichierEl.textContent = 'Aucun nouveau fichier sélectionné';

  if (modal) modal.classList.add('active');
}

/**
 * 14. Ouvre le modal en mode édition
 */
function remplirFormulairePourEdition(id) {
  const commercial = listeCommerciaux.find(c => String(c.id) === String(id));
  if (!commercial) return;

  const modal = document.getElementById('modal-commercial');
  const titre = document.getElementById('modal-commercial-titre');
  const btnTxt = document.getElementById('btn-save-texte');
  const imgApercu = document.getElementById('img-apercu-commercial');
  const nomFichierEl = document.getElementById('comm-photo-nom-fichier');

  document.getElementById('commercial-id').value = commercial.id;
  document.getElementById('comm-prenom').value = commercial.prenom || '';
  document.getElementById('comm-nom').value = commercial.nom || '';
  document.getElementById('comm-poste').value = commercial.poste || '';
  document.getElementById('comm-categorie').value = commercial.categorie || 'Vente';
  document.getElementById('comm-telephone').value = commercial.telephone || '';
  document.getElementById('comm-whatsapp').value = commercial.whatsapp || '';
  document.getElementById('comm-email').value = commercial.email || '';
  document.getElementById('comm-zone').value = commercial.zone || '';
  document.getElementById('comm-disponibilite').value = commercial.disponibilite || '';
  document.getElementById('comm-photo-url').value = commercial.photo_url || commercial.photo || '';
  document.getElementById('comm-bio').value = commercial.bio || '';
  document.getElementById('comm-linkedin').value = commercial.linkedin || '';
  document.getElementById('comm-facebook').value = commercial.facebook || '';
  document.getElementById('comm-instagram').value = commercial.instagram || '';
  document.getElementById('comm-tiktok').value = commercial.tiktok || '';
  document.getElementById('comm-actif').checked = commercial.actif !== false;

  const photoSrc = commercial.photo_url || commercial.photo || 'images/commercial1.jpg';
  if (imgApercu) imgApercu.src = photoSrc;
  if (nomFichierEl) nomFichierEl.textContent = 'Conserver la photo actuelle';

  if (titre) titre.textContent = `Modifier la carte : ${commercial.prenom} ${commercial.nom}`;
  if (btnTxt) btnTxt.textContent = 'Enregistrer les modifications';

  if (modal) modal.classList.add('active');
}

/**
 * 15. Filtres et Recherche dynamique
 */
function initialiserFiltresEtRecherche() {
  const champRecherche = document.getElementById('recherche-admin');
  const btnEffacer = document.getElementById('btn-effacer-recherche-admin');
  const filtreCat = document.getElementById('filtre-categorie-admin');
  const filtreStatut = document.getElementById('filtre-statut-admin');

  function filtrer() {
    const requete = (champRecherche?.value || '').toLowerCase().trim();
    const cat = filtreCat?.value || 'tous';
    const statut = filtreStatut?.value || 'tous';

    listeFiltree = listeCommerciaux.filter(c => {
      // Filtre texte
      const texte = `${c.prenom} ${c.nom} ${c.poste || ''} ${c.telephone || ''} ${c.zone || ''}`.toLowerCase();
      const matchTexte = !requete || texte.includes(requete);

      // Filtre catégorie
      const matchCat = cat === 'tous' || (c.categorie && c.categorie.toLowerCase() === cat.toLowerCase());

      // Filtre statut
      const estActif = c.actif !== false;
      const matchStatut = statut === 'tous' || (statut === 'actifs' && estActif) || (statut === 'inactifs' && !estActif);

      return matchTexte && matchCat && matchStatut;
    });

    rendreTableauCommerciaux(listeFiltree);
  }

  champRecherche?.addEventListener('input', filtrer);
  filtreCat?.addEventListener('change', filtrer);
  filtreStatut?.addEventListener('change', filtrer);

  btnEffacer?.addEventListener('click', () => {
    if (champRecherche) champRecherche.value = '';
    filtrer();
  });
}

/**
 * 16. Navigation par onglets de la Sidebar
 */
function initialiserNavigationOnglets() {
  document.querySelectorAll('.nav-onglet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const onglet = btn.getAttribute('data-onglet');
      basculerOnglet(onglet);
    });
  });

  document.getElementById('action-creer-rapide')?.addEventListener('click', ouvrirModalNouveau);
  document.getElementById('btn-ouvrir-modal-nouveau')?.addEventListener('click', ouvrirModalNouveau);
  document.getElementById('btn-nouveau-tableau')?.addEventListener('click', ouvrirModalNouveau);

  document.getElementById('action-tester-annuaire')?.addEventListener('click', () => {
    window.open('index.html', '_blank');
  });

  document.getElementById('action-telecharger-pdf-tous')?.addEventListener('click', () => {
    telechargerToutesCartesPDF(listeCommerciaux);
  });

  document.getElementById('btn-export-pdf-global')?.addEventListener('click', () => {
    telechargerToutesCartesPDF(listeCommerciaux);
  });

  document.getElementById('btn-export-csv-global')?.addEventListener('click', () => {
    exporterDonneesCSV(listeCommerciaux);
  });

  document.getElementById('btn-actualiser-dashboard')?.addEventListener('click', () => {
    chargerCommerciaux();
  });
}

function basculerOnglet(nomOnglet) {
  document.querySelectorAll('.nav-onglet-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-vue').forEach(v => v.classList.remove('active'));

  const btnActif = document.querySelector(`.nav-onglet-btn[data-onglet="${nomOnglet}"]`);
  if (btnActif) btnActif.classList.add('active');

  const vue = document.getElementById(`vue-${nomOnglet}`);
  if (vue) vue.classList.add('active');

  const titrePage = document.getElementById('topbar-titre-page');
  const titres = {
    dashboard: 'Tableau de bord',
    commerciaux: 'Gestion des commerciaux',
    leads: 'CRM — Leads & Devis Restauration',
    analytics: 'Statistiques, Scans & Performance',
    exports: 'Exports & QR Codes',
    parametres: 'Paramètres & Base de données'
  };
  if (titrePage && titres[nomOnglet]) {
    titrePage.textContent = titres[nomOnglet];
  }

  if (nomOnglet === 'leads') {
    chargerLeads();
  } else if (nomOnglet === 'analytics') {
    chargerAnalytics();
  }

  document.getElementById('admin-sidebar')?.classList.remove('ouverte');
}

/**
 * 17. Interactions d'interface (Modales & Déconnexion)
 */
function initialiserInterface() {
  const btnBurger = document.getElementById('btn-toggle-sidebar');
  const btnFermerSidebar = document.getElementById('btn-fermer-sidebar-mobile');
  const sidebar = document.getElementById('admin-sidebar');

  btnBurger?.addEventListener('click', () => sidebar?.classList.toggle('ouverte'));
  btnFermerSidebar?.addEventListener('click', () => sidebar?.classList.remove('ouverte'));

  // Déconnexion
  document.getElementById('btn-deconnexion')?.addEventListener('click', async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    } catch (err) {
      console.error('Erreur déconnexion :', err);
      window.location.href = 'login.html';
    }
  });

  // Modal de suppression
  const modalSuppr = document.getElementById('modal-suppression');
  const btnAnnulerSuppr = document.getElementById('btn-annuler-suppression');
  const btnValiderSuppr = document.getElementById('btn-valider-suppression');

  btnAnnulerSuppr?.addEventListener('click', () => modalSuppr?.classList.remove('active'));

  btnValiderSuppr?.addEventListener('click', async () => {
    if (commercialEnSuppression) {
      try {
        btnValiderSuppr.disabled = true;
        await supprimerCommercial(commercialEnSuppression.id);
        afficherToast(`✓ Carte de ${commercialEnSuppression.prenom} ${commercialEnSuppression.nom} supprimée.`);
        modalSuppr?.classList.remove('active');
        commercialEnSuppression = null;
        await chargerCommerciaux();
      } catch (err) {
        afficherToast('Erreur suppression : ' + err.message);
      } finally {
        btnValiderSuppr.disabled = false;
      }
    }
  });

  // Modal QR Code Preview & Téléchargement PNG 1000px
  const btnFermerModalQR = document.getElementById('btn-fermer-modal-qr');
  const modalQR = document.getElementById('modal-qr-preview');
  const btnTelechargerPNG1000 = document.getElementById('btn-telecharger-png-1000');

  btnFermerModalQR?.addEventListener('click', () => modalQR?.classList.remove('active'));

  btnTelechargerPNG1000?.addEventListener('click', async () => {
    if (commercialActuelQR) {
      btnTelechargerPNG1000.disabled = true;
      btnTelechargerPNG1000.textContent = 'Génération HD en cours...';
      try {
        await telechargerQRCodePNG(commercialActuelQR);
        afficherToast('✓ QR Code HD téléchargé avec succès !');
      } catch (e) {
        afficherToast('Erreur lors de la capture : ' + e.message);
      } finally {
        btnTelechargerPNG1000.disabled = false;
        btnTelechargerPNG1000.textContent = '📥 Télécharger en PNG Haute Définition (1000x1000px)';
      }
    }
  });
}

function ouvrirModalSuppression(commercial) {
  const modal = document.getElementById('modal-suppression');
  const msg = document.getElementById('msg-confirmation-suppr');
  if (msg) {
    msg.innerHTML = `Êtes-vous sûr de vouloir supprimer définitivement la carte de <strong>${commercial.prenom} ${commercial.nom}</strong> (${commercial.poste || 'Conseiller'}) ? Cette action supprimera sa carte et son QR code de façon irréversible.`;
  }
  if (modal) modal.classList.add('active');
}

/**
 * 18. Rendu de la galerie des QR Codes dans l'onglet Exports
 */
function rendreGalerieExports(liste) {
  const conteneur = document.getElementById('grille-exports-qrcodes');
  if (!conteneur) return;

  if (liste.length === 0) {
    conteneur.innerHTML = `<p style="color: #64748B; padding: 1.5rem;">Aucun commercial à exporter.</p>`;
    return;
  }

  conteneur.innerHTML = liste.map(c => `
    <div class="carte-qr-export-item">
      <div class="qr-item-haut">
        <strong style="font-size: 1rem; color: #0B1F3A;">${c.prenom} ${c.nom}</strong>
        <span style="font-size: 0.8rem; color: #64748B;">${c.poste || 'Conseiller'}</span>
      </div>
      <div id="mini-qr-${c.id}" class="mini-qr-bloc"></div>
      <div class="qr-item-actions" style="width: 100%;">
        <button type="button" class="btn btn-primaire btn-sm btn-dl-quick-png" data-id="${c.id}" style="width: 100%;">
          📥 Télécharger PNG HD
        </button>
      </div>
    </div>
  `).join('');

  liste.forEach(c => {
    const el = document.getElementById(`mini-qr-${c.id}`);
    if (el && typeof QRCode !== 'undefined') {
      const urlCarte = `${window.location.origin}/carte.html?id=${encodeURIComponent(c.id)}`;
      try {
        new QRCode(el, {
          text: urlCarte,
          width: 120,
          height: 120,
          colorDark: "#0B1F3A",
          colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {}
    }
  });

  conteneur.querySelectorAll('.btn-dl-quick-png').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const commercial = liste.find(c => String(c.id) === String(id));
      if (commercial) {
        commercialActuelQR = commercial;
        ouvrirModalPreviewQR(commercial);
        await telechargerQRCodePNG(commercial);
      }
    });
  });
}

/**
 * 19. Gestion des paramètres & Sécurité
 */
function initialiserParametres() {
  const formSupabase = document.getElementById('form-parametres-supabase');
  const inputUrl = document.getElementById('param-supabase-url');
  const inputKey = document.getElementById('param-supabase-key');
  const btnTester = document.getElementById('btn-tester-connexion-supabase');
  const statutTest = document.getElementById('statut-test-connexion');
  const formMdp = document.getElementById('form-changer-mdp');
  const btnBanniereRegler = document.getElementById('btn-regler-cles-banniere');
  const btnCopierSQL = document.getElementById('btn-copier-sql');

  if (inputUrl && SUPABASE_URL && !SUPABASE_URL.includes('votre-projet')) {
    inputUrl.value = SUPABASE_URL;
  }
  if (inputKey && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('eyJhbGciOi')) {
    inputKey.value = SUPABASE_ANON_KEY;
  }

  btnBanniereRegler?.addEventListener('click', () => {
    basculerOnglet('parametres');
  });

  formSupabase?.addEventListener('submit', (e) => {
    e.preventDefault();
    enregistrerConfigurationSupabase(inputUrl.value.trim(), inputKey.value.trim());
  });

  btnTester?.addEventListener('click', async () => {
    if (!statutTest) return;
    statutTest.style.display = 'block';
    statutTest.className = 'statut-test-bloc info';
    statutTest.textContent = 'Test de connexion à la table commerciaux...';

    try {
      const { error } = await supabase.from('commerciaux').select('count', { count: 'exact', head: true });
      if (error) throw error;
      statutTest.className = 'statut-test-bloc succes';
      statutTest.textContent = '✓ Connexion établie avec succès ! La table « commerciaux » est prête.';
    } catch (err) {
      statutTest.className = 'statut-test-bloc erreur';
      statutTest.textContent = '✕ Erreur de connexion : ' + err.message;
    }
  });

  btnCopierSQL?.addEventListener('click', () => {
    const code = document.getElementById('bloc-code-sql')?.textContent;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        afficherToast('✓ Script SQL copié dans le presse-papier !');
      });
    }
  });

  formMdp?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mdp = document.getElementById('nouveau-mdp').value;
    const confirmation = document.getElementById('confirmer-nouveau-mdp').value;
    const btnSoumettreMdp = document.getElementById('btn-soumettre-changer-mdp');

    if (mdp !== confirmation) {
      afficherToast('Les deux mots de passe ne correspondent pas.');
      return;
    }

    btnSoumettreMdp.disabled = true;
    btnSoumettreMdp.textContent = 'Mise à jour...';

    try {
      const { error } = await supabase.auth.updateUser({ password: mdp });
      if (error) throw error;
      afficherToast('✓ Mot de passe administrateur modifié avec succès !');
      formMdp.reset();
    } catch (err) {
      afficherToast('Erreur : ' + err.message);
    } finally {
      btnSoumettreMdp.disabled = false;
      btnSoumettreMdp.textContent = 'Mettre à jour le mot de passe';
    }
  });
}

function afficherBanniereAlerte(afficher) {
  const banniere = document.getElementById('banniere-alerte-admin');
  if (banniere) banniere.style.display = afficher ? 'flex' : 'none';
}

function afficherToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}

/**
 * ==============================================================================
 * 20. CRM LEADS & GESTION DES PROSPECTS RESTAURATION
 * ==============================================================================
 */
export async function chargerLeads() {
  const tbody = document.getElementById('tbody-leads');
  const badgeLeads = document.getElementById('badge-compteur-leads');

  if (!estSupabaseConfigure()) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-chargement" style="color: #B45309;">Supabase non configuré.</td></tr>`;
    }
    return;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        commerciaux (prenom, nom, telephone, whatsapp)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    listeLeads = data || [];
    listeLeadsFiltree = [...listeLeads];

    if (badgeLeads) badgeLeads.textContent = listeLeads.length;
    const statLeadsEl = document.getElementById('stat-analytics-leads');
    if (statLeadsEl) statLeadsEl.textContent = listeLeads.length;

    rendreTableauLeads(listeLeadsFiltree);
  } catch (err) {
    console.error('Erreur chargement leads :', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-chargement" style="color: #DC2626;">Erreur : ${err.message}</td></tr>`;
    }
  }
}

function rendreTableauLeads(liste) {
  const tbody = document.getElementById('tbody-leads');
  if (!tbody) return;

  if (liste.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-vide">
          <div style="padding: 2.5rem; text-align: center;">
            <p style="font-size: 1.05rem; color: #475569; margin-bottom: 0.5rem;">Aucune demande de devis enregistrée.</p>
            <p style="font-size: 0.85rem; color: #94A3B8;">Les demandes soumises sur les cartes de visite apparaîtront ici automatiquement.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = liste.map(lead => {
    const dateStr = lead.created_at ? new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
    const priorite = getPrioriteLead(lead.score || 0);
    const telNet = (lead.telephone || '').replace(/\D/g, '');
    const nomCommercial = lead.commerciaux ? `${lead.commerciaux.prenom} ${lead.commerciaux.nom}` : 'Attribution directe';
    const statutActuel = (lead.statut || 'nouveau').toLowerCase();

    const msgRelance = encodeURIComponent(
      `Bonjour ${lead.prospect_nom}, je suis le conseiller Lou Ame Tay suite à votre demande pour ${lead.restaurant_nom}. Comment puis-je vous aider pour votre transition digitale ?`
    );

    return `
      <tr>
        <!-- Restaurant & Prospect -->
        <td>
          <div>
            <strong style="color: var(--marine-fonce); font-size: 0.95rem;">${lead.restaurant_nom || 'Établissement inconnu'}</strong>
            <div style="font-size: 0.82rem; color: #64748B;">👤 ${lead.prospect_nom}</div>
            <span style="font-size: 0.72rem; color: #94A3B8;">📅 ${dateStr}</span>
          </div>
        </td>

        <!-- Coordonnées -->
        <td>
          <div>
            <a href="tel:${lead.telephone}" style="color: var(--marine-fonce); font-weight: 600; text-decoration: none; display: block; font-size: 0.88rem;">
              📞 ${lead.telephone}
            </a>
            <span style="font-size: 0.8rem; color: #64748B;">📍 ${lead.ville || 'Sénégal'}</span>
          </div>
        </td>

        <!-- Formule & Besoin -->
        <td>
          <div>
            <span class="badge-statut-pill statut-vert" style="font-size: 0.75rem;">
              ${lead.formule || 'Non précisée'}
            </span>
            ${lead.message ? `<div style="font-size: 0.78rem; color: #64748B; margin-top: 0.25rem; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${lead.message}">"${lead.message}"</div>` : ''}
          </div>
        </td>

        <!-- Score & Priorité -->
        <td>
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--marine-fonce);">
              ${lead.score || 0}<span style="font-size: 0.75rem; color: #94A3B8;">/100</span>
            </div>
            <span class="badge-score-lead badge-${priorite.classe}">
              ${priorite.icone} ${priorite.libelle.split(' ')[1] || 'Standard'}
            </span>
          </div>
        </td>

        <!-- Commercial Affilié -->
        <td>
          <span style="font-size: 0.85rem; font-weight: 600; color: #334155;">
            ${nomCommercial}
          </span>
        </td>

        <!-- Statut 1-clic -->
        <td>
          <select class="select-statut-lead" data-id="${lead.id}" data-statut="${statutActuel}">
            <option value="nouveau" ${statutActuel === 'nouveau' ? 'selected' : ''}>Nouveau</option>
            <option value="contacté" ${statutActuel === 'contacté' ? 'selected' : ''}>Contacté</option>
            <option value="converti" ${statutActuel === 'converti' ? 'selected' : ''}>Converti</option>
            <option value="perdu" ${statutActuel === 'perdu' ? 'selected' : ''}>Perdu</option>
          </select>
        </td>

        <!-- Actions -->
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center;">
            <a href="https://wa.me/${telNet}?text=${msgRelance}" target="_blank" rel="noopener noreferrer" class="btn-wa-direct-lead" title="Contacter sur WhatsApp">
              💬 WhatsApp
            </a>
            <button type="button" class="btn-icone-action btn-supprimer-lead" data-id="${lead.id}" title="Supprimer ce lead">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  attacherEvenementsLeads(tbody);
}

function attacherEvenementsLeads(conteneur) {
  // Changement de statut en direct
  conteneur.querySelectorAll('.select-statut-lead').forEach(select => {
    select.addEventListener('change', async (e) => {
      const leadId = e.target.getAttribute('data-id');
      const nouveauStatut = e.target.value;

      try {
        const { error } = await supabase
          .from('leads')
          .update({ statut: nouveauStatut })
          .eq('id', leadId);

        if (error) throw error;

        e.target.setAttribute('data-statut', nouveauStatut);
        const l = listeLeads.find(item => item.id === leadId);
        if (l) l.statut = nouveauStatut;

        afficherToast(`✓ Statut mis à jour : ${nouveauStatut.toUpperCase()}`);
      } catch (err) {
        console.error('Erreur mise à jour statut lead :', err);
        afficherToast('Erreur : ' + err.message);
      }
    });
  });

  // Suppression de lead
  conteneur.querySelectorAll('.btn-supprimer-lead').forEach(btn => {
    btn.addEventListener('click', async () => {
      const leadId = btn.getAttribute('data-id');
      if (!confirm("Voulez-vous vraiment supprimer ce lead ?")) return;

      try {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', leadId);

        if (error) throw error;

        afficherToast("✓ Lead supprimé avec succès.");
        await chargerLeads();
      } catch (err) {
        afficherToast("Erreur suppression : " + err.message);
      }
    });
  });
}

function initialiserLeadsCRM() {
  const champRecherche = document.getElementById('recherche-leads-admin');
  const btnEffacer = document.getElementById('btn-effacer-recherche-leads');
  const filtreStatut = document.getElementById('filtre-statut-leads');
  const filtreFormule = document.getElementById('filtre-formule-leads');
  const btnActualiser = document.getElementById('btn-actualiser-leads');
  const btnExportCSV = document.getElementById('btn-export-leads-csv');

  function filtrer() {
    const requete = (champRecherche?.value || '').toLowerCase().trim();
    const statut = (filtreStatut?.value || 'tous').toLowerCase();
    const formule = (filtreFormule?.value || 'tous').toLowerCase();

    listeLeadsFiltree = listeLeads.filter(l => {
      const texte = `${l.restaurant_nom || ''} ${l.prospect_nom || ''} ${l.telephone || ''} ${l.ville || ''}`.toLowerCase();
      const matchTexte = !requete || texte.includes(requete);
      const matchStatut = statut === 'tous' || (l.statut || '').toLowerCase() === statut;
      const matchFormule = formule === 'tous' || (l.formule || '').toLowerCase() === formule;
      return matchTexte && matchStatut && matchFormule;
    });

    rendreTableauLeads(listeLeadsFiltree);
  }

  champRecherche?.addEventListener('input', filtrer);
  filtreStatut?.addEventListener('change', filtrer);
  filtreFormule?.addEventListener('change', filtrer);

  btnEffacer?.addEventListener('click', () => {
    if (champRecherche) champRecherche.value = '';
    filtrer();
  });

  btnActualiser?.addEventListener('click', chargerLeads);
  btnExportCSV?.addEventListener('click', exporterLeadsCSV);
}

function exporterLeadsCSV() {
  if (listeLeads.length === 0) {
    afficherToast("Aucun lead à exporter.");
    return;
  }

  const entetes = ['Date', 'Restaurant', 'Prospect', 'Telephone', 'Ville', 'Formule', 'Score', 'Statut', 'Commercial'];
  const lignes = listeLeads.map(l => {
    const nomCommercial = l.commerciaux ? `${l.commerciaux.prenom} ${l.commerciaux.nom}` : '';
    return [
      `"${l.created_at || ''}"`,
      `"${(l.restaurant_nom || '').replace(/"/g, '""')}"`,
      `"${(l.prospect_nom || '').replace(/"/g, '""')}"`,
      `"${l.telephone || ''}"`,
      `"${(l.ville || '').replace(/"/g, '""')}"`,
      `"${(l.formule || '').replace(/"/g, '""')}"`,
      l.score || 0,
      `"${l.statut || 'nouveau'}"`,
      `"${nomCommercial.replace(/"/g, '""')}"`
    ].join(',');
  });

  const contenuCSV = '\uFEFF' + [entetes.join(','), ...lignes].join('\r\n');
  const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(blob);
  lien.download = `LouAmeTay_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  afficherToast("✓ Fichier CSV des leads téléchargé !");
}

/**
 * ==============================================================================
 * 21. ANALYTICS, STATISTIQUES & SUIVI DES SCANS QR
 * ==============================================================================
 */
export async function chargerAnalytics() {
  if (!estSupabaseConfigure()) return;

  try {
    // 1. Total Scans
    const { count: totalScans } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true });

    // 2. Total Leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // 3. Stats journalières
    const { data: dailyStats } = await supabase
      .from('analytics_daily')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    // 4. Derniers scans avec commerciaux
    const { data: derniersScans } = await supabase
      .from('scans')
      .select(`
        *,
        commerciaux (prenom, nom)
      `)
      .order('scanned_at', { ascending: false })
      .limit(10);

    // Calcul clics WhatsApp
    let totalWA = 0;
    if (dailyStats && dailyStats.length > 0) {
      totalWA = dailyStats.reduce((acc, curr) => acc + (curr.nb_whatsapp || 0), 0);
    }

    const nbScans = totalScans || 0;
    const nbLeads = totalLeads || 0;
    const tauxConversion = nbScans > 0 ? ((nbLeads / nbScans) * 100).toFixed(1) : 0;

    const elScans = document.getElementById('stat-analytics-scans');
    const elLeads = document.getElementById('stat-analytics-leads');
    const elWA = document.getElementById('stat-analytics-wa');
    const elConv = document.getElementById('stat-analytics-conversion');

    if (elScans) elScans.textContent = nbScans;
    if (elLeads) elLeads.textContent = nbLeads;
    if (elWA) elWA.textContent = totalWA;
    if (elConv) elConv.textContent = `${tauxConversion}%`;

    rendreTableauScans(derniersScans || []);
    initialiserGraphiques(dailyStats || []);

  } catch (err) {
    console.error('Erreur chargement analytics :', err);
  }
}

function rendreTableauScans(scans) {
  const tbody = document.getElementById('tbody-scans-recents');
  if (!tbody) return;

  if (scans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748B; padding: 1.5rem;">Aucun scan enregistré pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = scans.map(s => {
    const dateStr = s.scanned_at ? new Date(s.scanned_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
    const nomComm = s.commerciaux ? `${s.commerciaux.prenom} ${s.commerciaux.nom}` : 'Général';
    const loc = `${s.ville || 'Dakar'}, ${s.pays || 'Sénégal'}`;

    return `
      <tr>
        <td style="font-size: 0.85rem; color: #334155;">${dateStr}</td>
        <td><strong>${nomComm}</strong></td>
        <td>📍 ${loc}</td>
        <td style="font-size: 0.8rem; color: #64748B;">${s.referrer || 'Scan Direct'}</td>
        <td style="text-align: right;">
          <span class="badge-statut-pill statut-vert">Enregistré</span>
        </td>
      </tr>
    `;
  }).join('');
}

function initialiserGraphiques(dailyStats) {
  if (typeof Chart === 'undefined') return;

  // 1. Graphique d'activité
  const canvasActivite = document.getElementById('chart-analytics-activite');
  if (canvasActivite) {
    const ctx = canvasActivite.getContext('2d');
    if (chartActiviteInstance) chartActiviteInstance.destroy();

    const labels = [];
    const donneesScans = [];
    const donneesLeads = [];

    const aujourdhui = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(aujourdhui.getDate() - i);
      const cleDate = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));

      const statJour = dailyStats.filter(s => s.date === cleDate);
      const scansJour = statJour.reduce((acc, c) => acc + (c.nb_scans || 0), 0);
      const leadsJour = statJour.reduce((acc, c) => acc + (c.nb_leads || 0), 0);

      donneesScans.push(scansJour);
      donneesLeads.push(leadsJour);
    }

    chartActiviteInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Scans QR',
            data: donneesScans,
            backgroundColor: '#0B1F3A',
            borderRadius: 6
          },
          {
            label: 'Leads Capturés',
            data: donneesLeads,
            backgroundColor: '#C9A227',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // 2. Graphique Répartition des Villes
  const canvasZones = document.getElementById('chart-analytics-zones');
  if (canvasZones) {
    const ctx = canvasZones.getContext('2d');
    if (chartZonesInstance) chartZonesInstance.destroy();

    chartZonesInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Dakar', 'Thiès', 'Mbour / Saly', 'Autres'],
        datasets: [{
          data: [55, 25, 15, 5],
          backgroundColor: ['#0B1F3A', '#C9A227', '#22C55E', '#94A3B8'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}
