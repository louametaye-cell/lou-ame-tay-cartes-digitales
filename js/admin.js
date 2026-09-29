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
import { initialiserAdminV2, calculerEtAfficherKpisCEO, chargerParrainages } from './admin-v2.js';
import { rafraichirTailleCarte } from './map-admin.js';

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
  initialiserAvisAdmin();
  initialiserParametres();
  await chargerCommerciaux();
  await chargerLeads();
  await chargerAvisAdmin();
  await initialiserAdminV2(listeCommerciaux, listeLeads);
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
 * Compression intelligente de la photo côté client (navigateur) avant téléversement
 * Réduit automatiquement les photos de smartphone haute résolution (ex: 8-15 Mo) à moins de 1 Mo (< 1200px)
 * Utilise browser-image-compression via window.imageCompression
 * @param {File} fichier - Fichier image brut
 * @returns {Promise<File|Blob>} Fichier compressé ou fichier original si échec
 */
export async function compresserImage(fichier) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.85
  };

  if (typeof window !== 'undefined' && typeof window.imageCompression === 'function') {
    try {
      const tailleInitialeMo = (fichier.size / (1024 * 1024)).toFixed(2);
      console.log(`[Compression] Début compression pour ${fichier.name} (${tailleInitialeMo} Mo)...`);
      const fichierCompresse = await window.imageCompression(fichier, options);
      const tailleFinaleKo = (fichierCompresse.size / 1024).toFixed(1);
      console.log(`[Compression] Succès : ${tailleInitialeMo} Mo -> ${tailleFinaleKo} Ko (-${Math.round((1 - fichierCompresse.size / fichier.size) * 100)}%)`);
      return fichierCompresse;
    } catch (err) {
      console.error('[Compression] Erreur lors de la compression :', err);
      return fichier;
    }
  }

  console.warn('[Compression] Bibliothèque browser-image-compression non disponible dans window, envoi direct.');
  return fichier;
}

/**
 * 7. Téléversement de photo vers Supabase Storage (bucket 'photos')
 * Comprend :
 * - Validation stricte du type MIME (JPG, PNG, WebP)
 * - Validation de la taille brute (max 20 Mo)
 * - Compression automatique côté navigateur (cible < 1 Mo)
 * - Gestion d'erreur explicite et messages compréhensibles en français
 * @param {File} fichier - Fichier image sélectionné
 * @returns {Promise<string>} URL publique de l'image
 */
export async function uploadPhoto(fichier) {
  if (!fichier) return null;

  // 1. Validation du type MIME
  if (!fichier.type || !fichier.type.startsWith('image/')) {
    afficherToast('❌ Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
    throw new Error('Type de fichier non supporté. Veuillez sélectionner une image (JPG, PNG, WebP).');
  }

  // 2. Validation de la taille brute avant compression (max 20 Mo pour tolérer les photos smartphone récentes)
  const MAX_RAW_SIZE_MB = 20;
  const MAX_RAW_SIZE_BYTES = MAX_RAW_SIZE_MB * 1024 * 1024;
  if (fichier.size > MAX_RAW_SIZE_BYTES) {
    const tailleMo = (fichier.size / (1024 * 1024)).toFixed(1);
    afficherToast(`❌ Image trop volumineuse (${tailleMo} Mo). Veuillez choisir une photo de moins de ${MAX_RAW_SIZE_MB} Mo.`);
    throw new Error(`Image trop volumineuse (${tailleMo} Mo). La limite maximale avant compression est de ${MAX_RAW_SIZE_MB} Mo.`);
  }

  // 3. Compression intelligente côté client
  let fichierAEnvoyer = fichier;
  try {
    fichierAEnvoyer = await compresserImage(fichier);
  } catch (compErr) {
    console.warn('[Upload] Échec compression, poursuite avec le fichier original :', compErr);
  }

  // 4. Vérification de sécurité post-compression (< 5 Mo imposé par le bucket Supabase)
  const MAX_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;
  if (fichierAEnvoyer.size > MAX_STORAGE_LIMIT_BYTES) {
    const tailleMo = (fichierAEnvoyer.size / (1024 * 1024)).toFixed(1);
    afficherToast(`❌ Même après compression, l'image reste trop volumineuse (${tailleMo} Mo > 5 Mo).`);
    throw new Error(`La photo compressée (${tailleMo} Mo) dépasse le quota de 5 Mo autorisé par le serveur. Veuillez sélectionner une photo de résolution inférieure.`);
  }

  // 5. Téléversement vers Supabase Storage (bucket 'photos')
  try {
    const extension = fichier.name.split('.').pop() || 'jpg';
    const nomFichierNettoye = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const cheminStockage = `commerciaux/${nomFichierNettoye}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(cheminStockage, fichierAEnvoyer, {
        cacheControl: '3600',
        upsert: true,
        contentType: fichierAEnvoyer.type || fichier.type || 'image/jpeg'
      });

    if (error) {
      console.error('[Upload] Erreur Supabase Storage upload :', error);
      if (error.message && error.message.includes('exceeded the maximum allowed size')) {
        throw new Error("L'image dépasse la taille maximale autorisée par le bucket 'photos' (5 Mo). Veuillez réduire la résolution de l'image.");
      }
      if (error.statusCode === 403 || error.message?.includes('row-level security') || error.message?.includes('violates row-level security policy')) {
        throw new Error("Droits insuffisants pour téléverser dans 'photos'. Vérifiez que votre session administrateur est active et que la politique RLS INSERT est configurée.");
      }
      throw new Error(`Échec upload photo: ${error.message}. Vérifiez que le bucket 'photos' existe et est public.`);
    }

    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(cheminStockage);

    return urlData.publicUrl;
  } catch (err) {
    console.error('[Upload] Échec téléversement photo :', err);
    throw err;
  }
}

/**
 * Extraire l'ID YouTube depuis une URL complète ou un ID direct
 * @param {string} input - URL ou ID
 * @returns {string|null} ID à 11 caractères
 */
export function extraireYouTubeId(input) {
  if (!input) return null;
  const str = String(input).trim();
  // Format direct : "dQw4w9WgXcQ"
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  // Format URL : youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube-nocookie.com/embed/ID, shorts/ID
  const match = str.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Téléversement des 3 images du carrousel vers Supabase Storage
 * @param {string} commercialId - Identifiant du commercial
 * @returns {Promise<Array<{url: string, titre: string, legende: string}>>}
 */
export async function uploadCarrouselImages(commercialId) {
  const images = [];

  for (let i = 0; i < 3; i++) {
    const fileInput = document.querySelector(`.carrousel-file[data-index="${i}"]`);
    const titreInput = document.querySelector(`.carrousel-titre[data-index="${i}"]`);
    const urlInput = document.querySelector(`.carrousel-url[data-index="${i}"]`);

    const titre = (titreInput?.value || '').trim();

    // 1. Si un nouveau fichier est sélectionné : compression + upload
    if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        const file = await compresserImage(fileInput.files[0]);
        const ext = file.name ? (file.name.split('.').pop() || 'jpg') : 'jpg';
        const cleanCommId = String(commercialId || 'nouveau').replace(/[^a-zA-Z0-9_-]/g, '');
        const filePath = `carrousel/${cleanCommId}_slot${i}_${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'image/jpeg'
          });

        if (error) {
          console.error(`Erreur upload carrousel slot ${i} :`, error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        images.push({
          url: urlData.publicUrl,
          titre: titre || `Diapositive ${i + 1}`,
          legende: titre || ''
        });
      } catch (err) {
        console.error(`Exception carrousel upload slot ${i} :`, err);
      }
      continue;
    }

    // 2. Si une URL existante est conservée
    if (urlInput && urlInput.value.trim()) {
      images.push({
        url: urlInput.value.trim(),
        titre: titre || `Diapositive ${i + 1}`,
        legende: titre || ''
      });
    }
  }

  return images;
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
            <button type="button" class="btn-icone-action btn-voir" onclick="voirProfil('${c.id}')" data-id="${c.id}" aria-label="Voir le profil" title="Voir le profil">
              👁️
            </button>
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
          <button type="button" onclick="voirProfil('${c.id}')" class="btn btn-contour btn-xs" aria-label="Voir la carte" title="Voir la carte">
            Voir carte ↗
          </button>
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

  // Bouton Voir le profil 👁️
  conteneur.querySelectorAll('.btn-voir').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      if (id) {
        voirProfil(id);
      }
    });
  });
}

/**
 * Ouvre la carte du commercial dans un nouvel onglet avec son UUID réel
 * @param {string} id - UUID Supabase du commercial
 */
export function voirProfil(id) {
  if (!id) {
    console.error('ID manquant pour voirProfil');
    return;
  }
  window.open(`carte.html?id=${encodeURIComponent(id)}`, '_blank');
}
if (typeof window !== 'undefined') {
  window.voirProfil = voirProfil;
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

  // Aperçu et pré-validation de la photo lors de la sélection de fichier
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      if (!file.type || !file.type.startsWith('image/')) {
        afficherToast('❌ Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
        fileInput.value = '';
        nomFichierEl.textContent = 'Fichier non supporté';
        return;
      }
      const tailleMo = (file.size / (1024 * 1024)).toFixed(1);
      if (file.size > 20 * 1024 * 1024) {
        afficherToast(`❌ Fichier trop volumineux (${tailleMo} Mo). Limite : 20 Mo.`);
        fileInput.value = '';
        nomFichierEl.textContent = 'Fichier trop volumineux (> 20 Mo)';
        return;
      }
      nomFichierEl.textContent = `${file.name} (${tailleMo} Mo — sera optimisé)`;
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

  // Détection automatique de la position GPS
  document.getElementById('btn-geoloc-auto')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      afficherToast('❌ La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    afficherToast('📍 Recherche de la position GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latInput = document.getElementById('comm-latitude');
        const lngInput = document.getElementById('comm-longitude');
        if (latInput) latInput.value = pos.coords.latitude.toFixed(6);
        if (lngInput) lngInput.value = pos.coords.longitude.toFixed(6);
        afficherToast(`✓ Position GPS détectée : ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        console.error('Erreur GPS :', err);
        afficherToast('❌ Échec géolocalisation : ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // Prévisualisation en direct de la vidéo YouTube
  const videoInput = document.getElementById('comm-video-youtube-id');
  const previewVideoBloc = document.getElementById('comm-video-preview');
  const imgVideoPreview = document.getElementById('img-video-preview');

  const actualiserApercuVideo = () => {
    const raw = videoInput?.value.trim() || '';
    const ytId = extraireYouTubeId(raw);
    if (ytId && previewVideoBloc && imgVideoPreview) {
      imgVideoPreview.src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
      previewVideoBloc.style.display = 'block';
    } else if (previewVideoBloc) {
      previewVideoBloc.style.display = 'none';
    }
  };

  videoInput?.addEventListener('input', actualiserApercuVideo);
  videoInput?.addEventListener('paste', () => setTimeout(actualiserApercuVideo, 50));

  // Clic sur les suggestions rapides de vidéos officielles Lou Ame Tay
  document.querySelectorAll('.btn-suggestion-yt').forEach(btn => {
    btn.addEventListener('click', () => {
      const vidId = btn.getAttribute('data-id');
      const titre = btn.getAttribute('data-titre');
      const desc = btn.getAttribute('data-desc');
      if (videoInput) videoInput.value = vidId;
      const vTitre = document.getElementById('comm-video-titre');
      const vDesc = document.getElementById('comm-video-description');
      if (vTitre) vTitre.value = titre || '';
      if (vDesc) vDesc.value = desc || '';
      actualiserApercuVideo();
    });
  });

  // Prévisualisation et suppression des slots du carrousel d'images
  for (let i = 0; i < 3; i++) {
    const fileInputSlot = document.querySelector(`.carrousel-file[data-index="${i}"]`);
    const imgPrev = document.querySelector(`.carrousel-img-preview[data-index="${i}"]`);
    const txtPlaceholder = document.querySelector(`.carrousel-placeholder-txt[data-index="${i}"]`);
    const btnSupprSlot = document.querySelector(`.btn-suppr-slot-carrousel[data-index="${i}"]`);
    const urlInputSlot = document.querySelector(`.carrousel-url[data-index="${i}"]`);
    const titreInputSlot = document.querySelector(`.carrousel-titre[data-index="${i}"]`);

    fileInputSlot?.addEventListener('change', () => {
      const f = fileInputSlot.files[0];
      if (f) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (imgPrev) {
            imgPrev.src = e.target.result;
            imgPrev.style.display = 'block';
          }
          if (txtPlaceholder) txtPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(f);
      }
    });

    btnSupprSlot?.addEventListener('click', () => {
      if (fileInputSlot) fileInputSlot.value = '';
      if (urlInputSlot) urlInputSlot.value = '';
      if (titreInputSlot) titreInputSlot.value = '';
      if (imgPrev) {
        imgPrev.src = '';
        imgPrev.style.display = 'none';
      }
      if (txtPlaceholder) txtPlaceholder.style.display = 'block';
    });
  }

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
      // 1. Upload photo si nouveau fichier avec compression automatique
      let photoUrl = urlPhotoInput.value.trim() || 'images/commercial1.jpg';
      if (fileInput.files && fileInput.files[0]) {
        txtSave.textContent = 'Compression & envoi photo...';
        photoUrl = await uploadPhoto(fileInput.files[0]);
      }

      // 1b. Upload des images du carrousel
      txtSave.textContent = 'Téléversement carrousel...';
      const carrouselImages = await uploadCarrouselImages(id || 'nouveau');

      // 1c. Extraction de la vidéo YouTube
      const rawVideoVal = document.getElementById('comm-video-youtube-id')?.value.trim() || '';
      const videoYoutubeId = extraireYouTubeId(rawVideoVal);
      const videoTitre = document.getElementById('comm-video-titre')?.value.trim() || null;
      const videoDescription = document.getElementById('comm-video-description')?.value.trim() || null;

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
        adresse: document.getElementById('comm-adresse').value.trim() || null,
        latitude: document.getElementById('comm-latitude').value ? parseFloat(document.getElementById('comm-latitude').value) : null,
        longitude: document.getElementById('comm-longitude').value ? parseFloat(document.getElementById('comm-longitude').value) : null,
        maps_url: document.getElementById('comm-maps-url').value.trim() || null,
        photo_url: photoUrl,
        bio: document.getElementById('comm-bio').value.trim(),
        video_youtube_id: videoYoutubeId || null,
        video_titre: videoTitre,
        video_description: videoDescription,
        carrousel_images: carrouselImages,
        linkedin: document.getElementById('comm-linkedin').value.trim(),
        facebook: document.getElementById('comm-facebook').value.trim(),
        instagram: document.getElementById('comm-instagram').value.trim(),
        tiktok: document.getElementById('comm-tiktok').value.trim(),
        youtube: document.getElementById('comm-youtube')?.value.trim() || null,
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
  document.getElementById('comm-adresse').value = '';
  document.getElementById('comm-latitude').value = '';
  document.getElementById('comm-longitude').value = '';
  document.getElementById('comm-maps-url').value = '';

  // Vidéo
  const vInput = document.getElementById('comm-video-youtube-id');
  const vTitre = document.getElementById('comm-video-titre');
  const vDesc = document.getElementById('comm-video-description');
  const vPrev = document.getElementById('comm-video-preview');
  if (vInput) vInput.value = '';
  if (vTitre) vTitre.value = '';
  if (vDesc) vDesc.value = '';
  if (vPrev) vPrev.style.display = 'none';

  // Carrousel
  for (let i = 0; i < 3; i++) {
    const fInput = document.querySelector(`.carrousel-file[data-index="${i}"]`);
    const imgP = document.querySelector(`.carrousel-img-preview[data-index="${i}"]`);
    const txtP = document.querySelector(`.carrousel-placeholder-txt[data-index="${i}"]`);
    const tInput = document.querySelector(`.carrousel-titre[data-index="${i}"]`);
    const uInput = document.querySelector(`.carrousel-url[data-index="${i}"]`);
    if (fInput) fInput.value = '';
    if (uInput) uInput.value = '';
    if (tInput) tInput.value = '';
    if (imgP) { imgP.src = ''; imgP.style.display = 'none'; }
    if (txtP) txtP.style.display = 'block';
  }

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
  document.getElementById('comm-adresse').value = commercial.adresse || '';
  document.getElementById('comm-latitude').value = commercial.latitude || '';
  document.getElementById('comm-longitude').value = commercial.longitude || '';
  document.getElementById('comm-maps-url').value = commercial.maps_url || '';
  document.getElementById('comm-photo-url').value = commercial.photo_url || commercial.photo || '';
  document.getElementById('comm-bio').value = commercial.bio || '';

  // Média : Vidéo YouTube
  const vId = commercial.video_youtube_id || '';
  const vInput = document.getElementById('comm-video-youtube-id');
  const vTitre = document.getElementById('comm-video-titre');
  const vDesc = document.getElementById('comm-video-description');
  const vPrev = document.getElementById('comm-video-preview');
  const imgVPrev = document.getElementById('img-video-preview');

  if (vInput) vInput.value = vId;
  if (vTitre) vTitre.value = commercial.video_titre || '';
  if (vDesc) vDesc.value = commercial.video_description || '';
  if (vId && vPrev && imgVPrev) {
    imgVPrev.src = `https://img.youtube.com/vi/${vId}/mqdefault.jpg`;
    vPrev.style.display = 'block';
  } else if (vPrev) {
    vPrev.style.display = 'none';
  }

  // Média : Carrousel 3 images
  let carrouselImgs = commercial.carrousel_images || [];
  if (typeof carrouselImgs === 'string') {
    try { carrouselImgs = JSON.parse(carrouselImgs); } catch (e) { carrouselImgs = []; }
  }
  if (!Array.isArray(carrouselImgs)) carrouselImgs = [];

  for (let i = 0; i < 3; i++) {
    const fInput = document.querySelector(`.carrousel-file[data-index="${i}"]`);
    const imgP = document.querySelector(`.carrousel-img-preview[data-index="${i}"]`);
    const txtP = document.querySelector(`.carrousel-placeholder-txt[data-index="${i}"]`);
    const tInput = document.querySelector(`.carrousel-titre[data-index="${i}"]`);
    const uInput = document.querySelector(`.carrousel-url[data-index="${i}"]`);

    if (fInput) fInput.value = '';

    const item = carrouselImgs[i];
    if (item && item.url) {
      if (uInput) uInput.value = item.url;
      if (tInput) tInput.value = item.titre || item.legende || '';
      if (imgP) {
        imgP.src = item.url;
        imgP.style.display = 'block';
      }
      if (txtP) txtP.style.display = 'none';
    } else {
      if (uInput) uInput.value = '';
      if (tInput) tInput.value = '';
      if (imgP) {
        imgP.src = '';
        imgP.style.display = 'none';
      }
      if (txtP) txtP.style.display = 'block';
    }
  }

  document.getElementById('comm-linkedin').value = commercial.linkedin || '';
  document.getElementById('comm-facebook').value = commercial.facebook || '';
  document.getElementById('comm-instagram').value = commercial.instagram || '';
  document.getElementById('comm-tiktok').value = commercial.tiktok || '';
  const inputYt = document.getElementById('comm-youtube');
  if (inputYt) inputYt.value = commercial.youtube || (commercial.reseaux && commercial.reseaux.youtube) || 'https://youtube.com/@louametaye?si=wdfwRr2F-x0ho5PY';
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
    dashboard: '📊 Pilotage Stratégique & Tableau de bord',
    commerciaux: 'Gestion des commerciaux',
    leads: 'CRM — Leads & Devis Restauration',
    avis: '⭐ Modération des Avis Clients & Notations',
    parrainages: '📤 Suivi des Parrainages & Recommandations',
    analytics: 'Statistiques, Scans & Performance',
    exports: 'Exports & QR Codes',
    parametres: 'Paramètres & Base de données'
  };
  if (titrePage && titres[nomOnglet]) {
    titrePage.textContent = titres[nomOnglet];
  }

  if (nomOnglet === 'dashboard') {
    rafraichirTailleCarte();
  } else if (nomOnglet === 'leads') {
    chargerLeads();
  } else if (nomOnglet === 'avis') {
    chargerAvisAdmin();
  } else if (nomOnglet === 'parrainages') {
    chargerParrainages();
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
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <select class="select-statut-lead" data-id="${lead.id}" data-statut="${statutActuel}">
              <option value="nouveau" ${statutActuel === 'nouveau' ? 'selected' : ''}>Nouveau</option>
              <option value="contacté" ${statutActuel === 'contacté' ? 'selected' : ''}>Contacté / RDV</option>
              <option value="démo" ${statutActuel === 'démo' ? 'selected' : ''}>Démo en salle</option>
              <option value="converti" ${statutActuel === 'converti' ? 'selected' : ''}>Converti (Client)</option>
              <option value="perdu" ${statutActuel === 'perdu' ? 'selected' : ''}>Perdu</option>
            </select>
            ${statutActuel !== 'converti' ? `
              <button type="button" class="btn-convertir-rapide btn-convertir-lead-1clic" data-id="${lead.id}" title="Marquer ce prospect comme client converti">
                🎯 Marquer converti
              </button>
            ` : `
              <span style="font-size: 0.72rem; color: #15803D; font-weight: 700; text-align: center;">✓ Client Actif</span>
            `}
          </div>
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
        calculerEtAfficherKpisCEO();
        rendreTableauLeads(listeLeadsFiltree);
      } catch (err) {
        console.error('Erreur mise à jour statut lead :', err);
        afficherToast('Erreur : ' + err.message);
      }
    });
  });

  // Action rapide "Marquer comme converti"
  conteneur.querySelectorAll('.btn-convertir-lead-1clic').forEach(btn => {
    btn.addEventListener('click', async () => {
      const leadId = btn.getAttribute('data-id');
      try {
        const { error } = await supabase
          .from('leads')
          .update({ statut: 'converti' })
          .eq('id', leadId);

        if (error) throw error;

        const l = listeLeads.find(item => item.id === leadId);
        if (l) l.statut = 'converti';

        afficherToast("🎉 Bravo ! Lead marqué comme Converti. Le MRR a été recalculé !");
        calculerEtAfficherKpisCEO();
        rendreTableauLeads(listeLeadsFiltree);
      } catch (err) {
        console.error('Erreur conversion lead :', err);
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
        calculerEtAfficherKpisCEO();
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
  const filtreVille = document.getElementById('filtre-ville-leads');
  const filtrePeriode = document.getElementById('filtre-periode-leads');
  const btnActualiser = document.getElementById('btn-actualiser-leads');
  const btnExportCSV = document.getElementById('btn-export-leads-csv');

  function filtrer() {
    const requete = (champRecherche?.value || '').toLowerCase().trim();
    const statut = (filtreStatut?.value || 'tous').toLowerCase();
    const formule = (filtreFormule?.value || 'tous').toLowerCase();
    const ville = (filtreVille?.value || 'tous').toLowerCase();
    const periode = filtrePeriode?.value || 'tous';

    const maintenant = Date.now();
    const limite7j = maintenant - (7 * 24 * 3600 * 1000);
    const limite30j = maintenant - (30 * 24 * 3600 * 1000);

    listeLeadsFiltree = listeLeads.filter(l => {
      const texte = `${l.restaurant_nom || ''} ${l.prospect_nom || ''} ${l.telephone || ''} ${l.ville || ''}`.toLowerCase();
      const matchTexte = !requete || texte.includes(requete);
      const matchStatut = statut === 'tous' || (l.statut || '').toLowerCase() === statut;
      const matchFormule = formule === 'tous' || (l.formule || '').toLowerCase() === formule;
      const matchVille = ville === 'tous' || (l.ville || '').toLowerCase().includes(ville);

      let matchPeriode = true;
      if (l.created_at) {
        const timeLead = new Date(l.created_at).getTime();
        if (periode === '7j') matchPeriode = timeLead >= limite7j;
        else if (periode === '30j') matchPeriode = timeLead >= limite30j;
      }

      return matchTexte && matchStatut && matchFormule && matchVille && matchPeriode;
    });

    rendreTableauLeads(listeLeadsFiltree);
  }

  champRecherche?.addEventListener('input', filtrer);
  filtreStatut?.addEventListener('change', filtrer);
  filtreFormule?.addEventListener('change', filtrer);
  filtreVille?.addEventListener('change', filtrer);
  filtrePeriode?.addEventListener('change', filtrer);

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

// ==============================================================================
// 26. GESTION ET MODÉRATION DES AVIS CLIENTS (SUPABASE)
// ==============================================================================
let listeAvis = [];
let listeAvisFiltree = [];

/**
 * Initialisation des filtres et contrôles de la vue Avis
 */
export function initialiserAvisAdmin() {
  const champRecherche = document.getElementById('recherche-avis');
  const btnEffacer = document.getElementById('btn-effacer-recherche-avis');
  const filtreNote = document.getElementById('filtre-note-avis');
  const filtreStatut = document.getElementById('filtre-statut-avis');
  const btnExportCSV = document.getElementById('btn-exporter-avis-csv');

  function filtrer() {
    const requete = (champRecherche?.value || '').toLowerCase().trim();
    const note = filtreNote?.value || 'tous';
    const statut = filtreStatut?.value || 'tous';

    listeAvisFiltree = listeAvis.filter(a => {
      const nomComm = a.commerciaux ? `${a.commerciaux.prenom} ${a.commerciaux.nom}` : '';
      const texte = `${a.nom_visiteur || ''} ${a.restaurant_visiteur || ''} ${a.commentaire || ''} ${nomComm}`.toLowerCase();
      const matchTexte = !requete || texte.includes(requete);

      let matchNote = true;
      if (note === 'excellence') matchNote = a.note >= 8;
      else if (note === 'moyen') matchNote = a.note >= 5 && a.note < 8;
      else if (note === 'critique') matchNote = a.note < 5;

      const matchStatut = statut === 'tous' || a.statut === statut;

      return matchTexte && matchNote && matchStatut;
    });

    rendreTableauAvis(listeAvisFiltree);
  }

  champRecherche?.addEventListener('input', filtrer);
  filtreNote?.addEventListener('change', filtrer);
  filtreStatut?.addEventListener('change', filtrer);

  btnEffacer?.addEventListener('click', () => {
    if (champRecherche) champRecherche.value = '';
    filtrer();
  });

  btnExportCSV?.addEventListener('click', exporterAvisCSV);
}

/**
 * Charge tous les avis clients depuis Supabase
 */
export async function chargerAvisAdmin() {
  const tbody = document.getElementById('tbody-avis');
  if (!tbody) return;

  if (!estSupabaseConfigure()) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-chargement" style="color: #B45309;">
          ⚙️ Supabase non configuré pour la gestion des avis.
        </td>
      </tr>`;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('avis')
      .select('*, commerciaux(id, prenom, nom, poste)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    listeAvis = data || [];
    listeAvisFiltree = [...listeAvis];

    actualiserStatistiquesAvis(listeAvis);
    rendreTableauAvis(listeAvisFiltree);

  } catch (err) {
    console.error('Erreur chargement avis admin :', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-vide">
          <p style="color: #EF4444; padding: 1.5rem;">Erreur lors du chargement des avis : ${err.message}</p>
        </td>
      </tr>`;
  }
}

/**
 * Actualise les 4 cartes statistiques d'avis
 */
function actualiserStatistiquesAvis(liste) {
  const total = liste.length;
  const publies = liste.filter(a => a.statut === 'publie').length;
  const masques = liste.filter(a => a.statut === 'masque').length;

  let moyenne = '—';
  if (total > 0) {
    const sommeNotes = liste.reduce((acc, a) => acc + (Number(a.note) || 0), 0);
    moyenne = (sommeNotes / total).toFixed(1);
  }

  const elMoyenne = document.getElementById('stat-avis-moyenne');
  const elTotal = document.getElementById('stat-avis-total');
  const elPublies = document.getElementById('stat-avis-publies');
  const elMasques = document.getElementById('stat-avis-masques');
  const elBadgeAvis = document.getElementById('badge-compteur-avis');

  if (elMoyenne) elMoyenne.textContent = moyenne !== '—' ? `${moyenne}/10` : '—';
  if (elTotal) elTotal.textContent = total;
  if (elPublies) elPublies.textContent = publies;
  if (elMasques) elMasques.textContent = masques;
  if (elBadgeAvis) {
    elBadgeAvis.textContent = total;
    elBadgeAvis.style.display = total > 0 ? 'inline-block' : 'none';
  }
}

/**
 * Rendu du tableau des avis clients
 */
function rendreTableauAvis(liste) {
  const tbody = document.getElementById('tbody-avis');
  if (!tbody) return;

  if (liste.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-vide">
          <div style="padding: 2.5rem; text-align: center;">
            <p style="font-size: 1.05rem; color: #475569; margin-bottom: 0.5rem;">Aucun avis ne correspond à vos critères.</p>
            <span style="font-size: 0.85rem; color: #94A3B8;">Les notes données par les restaurateurs s'afficheront ici en direct.</span>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = liste.map(a => {
    const comm = a.commerciaux;
    const nomComm = comm ? `${comm.prenom} ${comm.nom}` : 'Conseiller';
    const posteComm = comm ? (comm.poste || '') : '';
    const dateStr = a.created_at ? new Date(a.created_at).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—';

    const estPublie = a.statut === 'publie';
    const noteCouleur = a.note >= 8 ? '#15803D' : (a.note >= 5 ? '#B45309' : '#DC2626');
    const noteFond = a.note >= 8 ? '#DCFCE7' : (a.note >= 5 ? '#FEF3C7' : '#FEE2E2');

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 0.82rem; color: #64748B;">
          ${dateStr}
        </td>
        <td>
          <strong>${escapeHtml(nomComm)}</strong>
          <span style="display: block; font-size: 0.78rem; color: #64748B;">${escapeHtml(posteComm)}</span>
        </td>
        <td>
          <strong>${escapeHtml(a.nom_visiteur || 'Client anonyme')}</strong>
          ${a.restaurant_visiteur ? `<span style="display: block; font-size: 0.78rem; color: #C9A227; font-weight: 600;">🍽️ ${escapeHtml(a.restaurant_visiteur)}</span>` : ''}
        </td>
        <td>
          <span style="display: inline-block; padding: 3px 9px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; background: ${noteFond}; color: ${noteCouleur};">
            ${a.note} / 10 ⭐
          </span>
        </td>
        <td style="max-width: 280px;">
          ${a.commentaire ? `<p style="margin: 0; font-size: 0.85rem; color: #334155; line-height: 1.4;">${escapeHtml(a.commentaire)}</p>` : '<span style="color: #94A3B8; font-style: italic; font-size: 0.8rem;">Aucun commentaire écrit</span>'}
        </td>
        <td>
          <span class="badge-statut-pill ${estPublie ? 'statut-vert' : 'statut-gris'}">
            ${estPublie ? '● Publié' : '○ Masqué'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button 
            type="button" 
            class="btn btn-contour btn-xs btn-moderer-avis" 
            data-id="${a.id}" 
            data-statut="${estPublie ? 'masque' : 'publie'}"
            title="${estPublie ? 'Masquer cet avis du public' : 'Rendre cet avis visible publiquement'}"
          >
            ${estPublie ? '👁️ Masquer' : '✓ Publier'}
          </button>
          <button 
            type="button" 
            class="btn btn-contour btn-xs btn-supprimer-avis" 
            data-id="${a.id}" 
            title="Supprimer définitivement cet avis"
            style="color: #DC2626; border-color: #FECACA; margin-left: 4px;"
          >
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-moderer-avis').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const nouveauStatut = btn.getAttribute('data-statut');
      await basculerStatutAvis(id, nouveauStatut);
    });
  });

  tbody.querySelectorAll('.btn-supprimer-avis').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Confirmez-vous la suppression définitive de cet avis client ?')) {
        await supprimerAvis(id);
      }
    });
  });
}

/**
 * Modère un avis (bascule statut 'publie' <-> 'masque')
 */
export async function basculerStatutAvis(id, nouveauStatut) {
  try {
    const { error } = await supabase
      .from('avis')
      .update({ statut: nouveauStatut })
      .eq('id', id);

    if (error) throw error;

    afficherToast(nouveauStatut === 'publie' ? '✓ Avis publié en ligne avec succès.' : 'Avis masqué du public.');
    await chargerAvisAdmin();

  } catch (err) {
    console.error('Erreur modération avis :', err);
    afficherToast('❌ Erreur modération : ' + err.message);
  }
}

/**
 * Supprime un avis de la base Supabase
 */
export async function supprimerAvis(id) {
  try {
    const { error } = await supabase
      .from('avis')
      .delete()
      .eq('id', id);

    if (error) throw error;

    afficherToast('✓ Avis supprimé de la base.');
    await chargerAvisAdmin();

  } catch (err) {
    console.error('Erreur suppression avis :', err);
    afficherToast('❌ Erreur suppression : ' + err.message);
  }
}

/**
 * Export des avis clients au format CSV
 */
function exporterAvisCSV() {
  if (listeAvis.length === 0) {
    afficherToast('⚠️ Aucun avis à exporter.');
    return;
  }

  const entetes = ['ID', 'Date', 'Conseiller', 'Poste', 'Visiteur', 'Restaurant', 'Note /10', 'Commentaire', 'Statut'];
  const lignes = listeAvis.map(a => {
    const comm = a.commerciaux;
    const nomComm = comm ? `${comm.prenom} ${comm.nom}` : '';
    const posteComm = comm ? (comm.poste || '') : '';
    const dateStr = a.created_at ? new Date(a.created_at).toISOString() : '';

    return [
      a.id,
      dateStr,
      `"${nomComm.replace(/"/g, '""')}"`,
      `"${posteComm.replace(/"/g, '""')}"`,
      `"${(a.nom_visiteur || '').replace(/"/g, '""')}"`,
      `"${(a.restaurant_visiteur || '').replace(/"/g, '""')}"`,
      a.note,
      `"${(a.commentaire || '').replace(/"/g, '""')}"`,
      a.statut
    ].join(';');
  });

  const contenuCSV = '\uFEFF' + [entetes.join(';'), ...lignes].join('\n');
  const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `louametay_avis_clients_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  afficherToast('✓ Export CSV des avis téléchargé avec succès.');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
