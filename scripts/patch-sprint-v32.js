import fs from 'fs';
import path from 'path';

console.log('🚀 Démarrage du patch Sprint Critique V32...');

// ==============================================================================
// 1. MISE À JOUR DE admin.html (Filtre par commercial sur la carte & police Montserrat)
// ==============================================================================
const adminHtmlPath = 'admin.html';
let adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// Remplacement police Poppins par inherit/Montserrat
adminHtml = adminHtml.replaceAll("font-family: 'Poppins', sans-serif;", "font-family: inherit;");
adminHtml = adminHtml.replaceAll("font-family: 'Poppins'", "font-family: 'Montserrat'");

// Injection du filtre commercial au-dessus de la carte si pas encore présent
if (!adminHtml.includes('id="filtre-commercial-carte"')) {
  const cadreHeaderPattern = /<div class="visuel-cadre-header">([\s\S]*?)<span class="badge-categorie badge-direction">Sénégal CHR<\/span>/;
  const match = adminHtml.match(cadreHeaderPattern);
  if (match) {
    const nouveauHeader = `<div class="visuel-cadre-header" style="flex-wrap: wrap; gap: 10px;">
              <div>
                <h4 class="visuel-cadre-titre" style="display: flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>Points Chauds de Prospection</span>
                </h4>
                <p class="visuel-cadre-soustitre">Dakar, Thiès, Saly/Mbour, St-Louis, Louga, Touba, Kaolack, Saloum, Casamance</p>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
                <div style="display: flex; align-items: center; gap: 6px; background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 4px 10px;">
                  <label for="filtre-commercial-carte" style="font-size: 0.75rem; font-weight: 700; color: #0B1F3A; display: flex; align-items: center; gap: 4px; margin: 0;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>Conseiller :</span>
                  </label>
                  <select id="filtre-commercial-carte" style="font-family: inherit; font-size: 0.78rem; font-weight: 600; color: #0B1F3A; background: transparent; border: none; outline: none; cursor: pointer;">
                    <option value="TOUS">🌍 Toute l'équipe (National)</option>
                    <option value="1f6306c0-cd61-4d2f-96b4-130705f8af81">Babacar Gueye (Thiès)</option>
                    <option value="d1d2955f-34f3-42f3-9601-7e4866ecd301">Cheikh A. Bamba MBODJ (Axe Thiès-Dakar-Mbour)</option>
                    <option value="9e505eb4-b2b3-48bb-b456-35c6d8faa428">Arona Sow (Dakar)</option>
                    <option value="f4e5f971-e137-4bbb-9b52-62fdc16be380">Fatou Diop (Petite Côte & Saly)</option>
                  </select>
                </div>
                <span class="badge-categorie badge-direction">Sénégal CHR</span>
              </div>`;
    adminHtml = adminHtml.replace(match[0], nouveauHeader);
    console.log('✅ Filtre par commercial ajouté dans admin.html');
  }
}
fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8');

// ==============================================================================
// 2. MISE À JOUR DE js/admin-v2.js (Prise en compte du filtre sur la carte)
// ==============================================================================
const adminJsPath = 'js/admin-v2.js';
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

if (!adminJs.includes('filtre-commercial-carte')) {
  adminJs = adminJs.replace(
    "initialiserCarteSenegalLeads('map-senegal-leads', leadsGlobal, rdvsGlobal);",
    `// Filtrage dynamique selon le commercial sélectionné
  const selectFiltre = document.getElementById('filtre-commercial-carte');
  const appliquerFiltreCarte = () => {
    const commId = selectFiltre ? selectFiltre.value : 'TOUS';
    const leadsFiltres = commId === 'TOUS' ? leadsGlobal : leadsGlobal.filter(l => l.commercial_id === commId);
    const rdvsFiltres = commId === 'TOUS' ? rdvsGlobal : rdvsGlobal.filter(r => r.commercial_id === commId);
    initialiserCarteSenegalLeads('map-senegal-leads', leadsFiltres, rdvsFiltres);
  };

  if (selectFiltre && !selectFiltre.dataset.initialise) {
    selectFiltre.dataset.initialise = 'true';
    selectFiltre.addEventListener('change', appliquerFiltreCarte);
  }

  appliquerFiltreCarte();`
  );
  fs.writeFileSync(adminJsPath, adminJs, 'utf8');
  console.log('✅ Écouteur de filtre carte ajouté dans js/admin-v2.js');
}

// ==============================================================================
// 3. MISE À JOUR DE js/wallet-pass.js (Téléchargement direct vCard sans page blanche)
// ==============================================================================
const walletPassPath = 'js/wallet-pass.js';
let walletPass = fs.readFileSync(walletPassPath, 'utf8');

// Remplacement de la redirection blanche par telechargerPassDigitalNFC
walletPass = walletPass.replace(
  /if \(plateforme === 'ios'\) {[\s\S]*?} else if \(plateforme === 'android'\) {[\s\S]*?} else {[\s\S]*?}/,
  `// Sur mobile iOS & Android, téléchargement direct de la vCard 4.0 enrichie (standard universel 0 page blanche)
  telechargerPassDigitalNFC(commercial);
  if (typeof afficherToast === 'function') {
    afficherToast('📇 Pass contact téléchargé ! Ajoutez-le directement à votre carnet.');
  }`
);
fs.writeFileSync(walletPassPath, walletPass, 'utf8');
console.log('✅ Téléchargement vCard sans page blanche configuré dans js/wallet-pass.js');

// ==============================================================================
// 4. MISE À JOUR DE carte.html & js/carte.js (Suppression définitive bouton retour équipe)
// ==============================================================================
const carteHtmlPath = 'carte.html';
let carteHtml = fs.readFileSync(carteHtmlPath, 'utf8');

// Remplacement des liens de retour vers index.html par le site officiel pour sanctuariser le client
carteHtml = carteHtml.replaceAll(
  '<a href="index.html" class="btn btn-primaire-vert" data-i18n="carte.retour">',
  '<a href="https://louametay.online" class="btn btn-primaire-vert" target="_blank" rel="noopener">'
);
carteHtml = carteHtml.replaceAll('← Voir les conseillers actuellement disponibles', 'Découvrir Lou Ame Tay Official');
carteHtml = carteHtml.replaceAll("← Retourner à l'accueil de l'équipe", 'Découvrir Lou Ame Tay Official');

fs.writeFileSync(carteHtmlPath, carteHtml, 'utf8');

const carteJsPath = 'js/carte.js';
let carteJs = fs.readFileSync(carteJsPath, 'utf8');
if (!carteJs.includes('// SANCTUARISATION : Suppression définitive de tout bouton retour')) {
  carteJs = carteJs.replace(
    "if (new URLSearchParams(location.search).get('src') === 'qr') {\n    document.querySelector('.btn-retour-flottant')?.remove();\n  }",
    `// SANCTUARISATION : Suppression définitive de tout bouton retour pour que le client reste sur la carte
  document.querySelectorAll('.btn-retour-flottant, a[href="index.html"]').forEach(btn => btn.remove());`
  );
  fs.writeFileSync(carteJsPath, carteJs, 'utf8');
  console.log('✅ Sanctuarisation carte.html appliquée (zéro retour équipe)');
}

// ==============================================================================
// 5. MISE À JOUR DE css/style.css (Tableaux responsive mobile Cards, Toggle Switch & Maps)
// ==============================================================================
const styleCssPath = 'css/style.css';
let styleCss = fs.readFileSync(styleCssPath, 'utf8');

// Nettoyer Poppins
styleCss = styleCss.replaceAll("font-family: 'Poppins', sans-serif;", "font-family: inherit;");
styleCss = styleCss.replaceAll("font-family: 'Poppins'", "font-family: 'Montserrat'");

const cssAdditions = `
/* ==============================================================================
   SPRINT CRITIQUE V32 — DESIGN SYSTEM, RESPONSIVE CARDS & TOGGLE SWITCH
   ============================================================================== */

/* 1. TABLEAUX EN CARDS EMPILÉES SUR MOBILE (< 768px) */
@media (max-width: 768px) {
  .panneau-table table,
  .comm-table {
    border: none !important;
    background: transparent !important;
  }

  .panneau-table thead,
  .comm-table thead {
    display: none !important;
  }

  .panneau-table tbody tr,
  .comm-table tbody tr {
    display: block !important;
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    border-radius: 12px !important;
    margin-bottom: 0.85rem !important;
    padding: 0.85rem !important;
    box-shadow: 0 2px 8px rgba(11, 31, 58, 0.05) !important;
  }

  .panneau-table tbody td,
  .comm-table tbody td {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 0.45rem 0 !important;
    border-bottom: 1px dashed #F1F5F9 !important;
    font-size: 0.84rem !important;
    text-align: right !important;
  }

  .panneau-table tbody td:last-child,
  .comm-table tbody td:last-child {
    border-bottom: none !important;
    padding-top: 0.6rem !important;
    justify-content: center !important;
  }

  .panneau-table tbody td::before,
  .comm-table tbody td::before {
    content: attr(data-label);
    font-weight: 700;
    color: #64748B;
    font-size: 0.72rem;
    text-transform: uppercase;
    text-align: left;
    margin-right: 8px;
  }
}

/* 2. TOGGLE SWITCH MODERNE ON/OFF (STATUT DISPONIBILITÉ COMMERCIAL) */
.statut-toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  padding: 4px 12px 4px 6px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
}

.statut-toggle-switch:hover {
  background: rgba(255, 255, 255, 0.18);
}

.switch-pill {
  width: 38px;
  height: 22px;
  background: #64748B;
  border-radius: 20px;
  position: relative;
  transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-knob {
  width: 18px;
  height: 18px;
  background: #FFFFFF;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.statut-toggle-switch.on .switch-pill {
  background: #22C55E !important;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
}

.statut-toggle-switch.on .switch-knob {
  transform: translateX(16px);
}

.switch-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.2px;
}

/* 3. BANDEAU DE RETOUR APPLICATION (NAVIGATION GOOGLE MAPS) */
.bandeau-retour-app-maps {
  position: fixed;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 500px;
  background: #0B1F3A;
  border: 1.5px solid #C9A227;
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(11, 31, 58, 0.35);
  z-index: 99999;
  transition: bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.bandeau-retour-app-maps.active {
  bottom: 20px;
}

.bandeau-retour-maps-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.maps-dot-live {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22C55E;
  box-shadow: 0 0 8px #22C55E;
  animation: pulseMaps 1.5s infinite;
}

@keyframes pulseMaps {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.btn-revenir-crm {
  background: #C9A227;
  color: #0B1F3A;
  font-weight: 800;
  font-size: 0.8rem;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-revenir-crm:hover {
  background: #E5BE3E;
}
`;

if (!styleCss.includes('SPRINT CRITIQUE V32')) {
  styleCss += '\n' + cssAdditions;
  fs.writeFileSync(styleCssPath, styleCss, 'utf8');
  console.log('✅ CSS Design System, Responsive Cards & Toggle Switch ajoutés dans style.css');
}

console.log('🎉 Patch Sprint V32 appliqué avec succès !');
