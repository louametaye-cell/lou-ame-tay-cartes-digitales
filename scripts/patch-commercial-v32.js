import fs from 'fs';

console.log('🚀 Application des correctifs commerciaux (Google Agenda, Micro, Maps, Aissatou, Toggle)...');

// 1. MISE À JOUR DE commercial.html
const commHtmlPath = 'commercial.html';
let commHtml = fs.readFileSync(commHtmlPath, 'utf8');

// Remplacement police Poppins par Montserrat / inherit
commHtml = commHtml.replaceAll("font-family: 'Poppins', sans-serif;", "font-family: inherit;");
commHtml = commHtml.replaceAll("font-family: 'Poppins'", "font-family: 'Montserrat'");

// Remplacement du bouton toggle de disponibilité par le composant moderne
const toggleAncien = `<button type="button" class="statut-toggle on" id="statut-toggle" onclick="toggleDisponibilite()">
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
            <span class="toggle-label">En ligne</span>
          </button>`;

const toggleNouveau = `<div class="statut-toggle-switch on" id="statut-toggle" onclick="toggleDisponibilite()" role="switch" aria-checked="true" title="Changer votre disponibilité">
            <span class="switch-pill"><span class="switch-knob"></span></span>
            <span class="switch-text" id="statut-toggle-text">En ligne</span>
          </div>`;

if (commHtml.includes(toggleAncien)) {
  commHtml = commHtml.replace(toggleAncien, toggleNouveau);
  console.log('✅ Toggle switch moderne inséré dans commercial.html');
}

// Menu déroulant Options / Suggestions pour Aissatou
const exemplesAncien = `<!-- Bouton toggle Suggestions -->
        <button type="button" class="btn-suggestions" onclick="toggleSuggestions()">
          💡 Suggestions
        </button>

        <div class="aissatou-exemples masque" id="aissatou-exemples" style="margin-bottom: 12px;">`;

const exemplesNouveau = `<!-- Menu déroulant Options & Suggestions Aissatou -->
        <details class="aissatou-options-dropdown" style="margin-bottom: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 6px 12px;">
          <summary style="font-size: 0.8rem; font-weight: 700; color: #0B1F3A; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
            <span>💡 Options & Exemples de requêtes CHR</span>
            <span style="font-size: 0.72rem; color: #64748B;">Ouvrir / Fermer</span>
          </summary>
          <div class="aissatou-exemples" id="aissatou-exemples" style="margin-top: 10px; display: block;">`;

if (commHtml.includes('<!-- Bouton toggle Suggestions -->')) {
  commHtml = commHtml.replace(exemplesAncien, exemplesNouveau);
  // Fermer la balise </details>
  commHtml = commHtml.replace('</div>\n        </div>\n\n        <!-- Zone de chat', '</div>\n        </div>\n        </details>\n\n        <!-- Zone de chat');
  console.log('✅ Menu déroulant Options Aissatou configuré dans commercial.html');
}

fs.writeFileSync(commHtmlPath, commHtml, 'utf8');

// 2. MISE À JOUR DE js/commercial.js
const commJsPath = 'js/commercial.js';
let commJs = fs.readFileSync(commJsPath, 'utf8');

// 2.1 Correction de l'accès Micro Aissatou (libération immédiate du stream audio de test)
const microAncien = `    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          reconnaissanceVocaleAissatou.start();
          estEnregistrementAissatou = true;
          btnMicro?.classList.add('recording');
          afficherToast("🎤 Parlez maintenant...");
        })
        .catch((err) => {
          console.error("Micro refusé:", err);
          afficherToast("⚠️ Micro refusé. Vérifiez les autorisations.");
        });`;

const microNouveau = `    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Forçage HTTPS si hors localhost
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        window.location.href = window.location.href.replace('http:', 'https:');
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // CRITIQUE : Libérer le stream de test pour éviter le conflit avec SpeechRecognition
          if (stream && stream.getTracks) {
            stream.getTracks().forEach(t => t.stop());
          }
          reconnaissanceVocaleAissatou.start();
          estEnregistrementAissatou = true;
          btnMicro?.classList.add('recording');
          afficherToast("🎤 Parlez maintenant...");
        })
        .catch((err) => {
          console.error("Micro refusé:", err);
          afficherToast("⚠️ Micro refusé. Vérifiez les autorisations.");
        });`;

if (commJs.includes(microAncien)) {
  commJs = commJs.replace(microAncien, microNouveau);
  console.log('✅ Libération de ressource micro et forçage HTTPS ajoutés dans js/commercial.js');
}

// 2.2 Navigation Google Maps sécurisée avec bouton "Retour à l'application"
const mapsAncien = `export function ouvrirMaps(adresse) {
  if (!adresse) {
    afficherToast('⚠️ Aucune adresse');
    return;
  }
  const mapsUrl = \`https://www.google.com/maps/dir/?api=1&destination=\${encodeURIComponent(adresse)}\`;
  sessionStorage.setItem('maps_retour', 'true');
  window.location.href = mapsUrl;
}

export function ouvrirMapsUrl(url) {
  if (!url) {
    afficherToast('⚠️ Aucun itinéraire disponible');
    return;
  }
  sessionStorage.setItem('maps_retour', 'true');
  window.location.href = url;
}`;

const mapsNouveau = `export function afficherBandeauRetourMaps() {
  let bandeau = document.getElementById('bandeau-retour-maps');
  if (!bandeau) {
    bandeau = document.createElement('div');
    bandeau.id = 'bandeau-retour-maps';
    bandeau.className = 'bandeau-retour-app-maps';
    bandeau.innerHTML = \`
      <div class="bandeau-retour-maps-content">
        <span class="maps-dot-live"></span>
        <div style="flex: 1; font-size: 0.82rem; font-weight: 700; color: #FFFFFF;">
          🗺️ Itinéraire Google Maps actif
          <div style="font-size: 0.72rem; font-weight: 400; opacity: 0.85;">Votre session CRM Lou Ame Tay reste ouverte</div>
        </div>
        <button type="button" id="btn-revenir-app-maps" class="btn-revenir-crm">
          ⬅️ Retour à l'application
        </button>
      </div>
    \`;
    document.body.appendChild(bandeau);
    bandeau.querySelector('#btn-revenir-app-maps')?.addEventListener('click', () => {
      bandeau.classList.remove('active');
    });
  }
  bandeau.classList.add('active');
}

export function ouvrirMaps(adresse) {
  if (!adresse) {
    afficherToast('⚠️ Aucune adresse');
    return;
  }
  const mapsUrl = \`https://www.google.com/maps/dir/?api=1&destination=\${encodeURIComponent(adresse)}\`;
  afficherBandeauRetourMaps();
  window.open(mapsUrl, '_blank');
}

export function ouvrirMapsUrl(url) {
  if (!url) {
    afficherToast('⚠️ Aucun itinéraire disponible');
    return;
  }
  afficherBandeauRetourMaps();
  window.open(url, '_blank');
}`;

if (commJs.includes(mapsAncien)) {
  commJs = commJs.replace(mapsAncien, mapsNouveau);
  console.log('✅ Guidage Google Maps sécurisé avec bandeau retour configuré dans js/commercial.js');
}

// 2.3 Synchronisation Google Agenda avec alerte 30 min (.ics et TEMPLATE)
const gcalAncien = `      // FIX 4 — Proposition d'ajout à Google Agenda
      try {
        const rdvGoogle = {
          restaurant_nom: resto,
          date_rdv: dateRdv,
          telephone: tel,
          adresse: adresse,
          ville: ville
        };
        const debut = new Date(rdvGoogle.date_rdv);
        const fin = new Date(debut.getTime() + 3600000);
        const fmt = d => d.toISOString().replace(/[-:]|\\.\\d{3}/g, '');
        const urlGoogleCal = \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent('RDV ' + rdvGoogle.restaurant_nom)}&dates=\${fmt(debut)}/\${fmt(fin)}&details=\${encodeURIComponent('Tél: ' + rdvGoogle.telephone)}&location=\${encodeURIComponent(rdvGoogle.adresse || rdvGoogle.ville)}\`;
        if (confirm('Ajouter à Google Agenda ?')) window.open(urlGoogleCal, '_blank');
      } catch (calErr) {
        console.warn('Erreur génération Google Agenda:', calErr);
      }`;

const gcalNouveau = `      // Synchronisation Google Agenda avec alerte 30 minutes (.ics + Template)
      try {
        const debut = new Date(dateRdv);
        const fin = new Date(debut.getTime() + 3600000);
        const fmt = d => d.toISOString().replace(/[-:]|\\.\\d{3}/g, '');
        const detailsRdv = \`RDV Démonstration Lou Ame Tay avec \${contact} (Tél: \${tel}).\\nFormule visée: Menu digital QR & Écran KDS.\\nNotification/Alerte programmée 30 minutes avant le RDV.\`;
        const urlGoogleCal = \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent('RDV Lou Ame Tay — ' + resto)}&dates=\${fmt(debut)}/\${fmt(fin)}&details=\${encodeURIComponent(detailsRdv)}&location=\${encodeURIComponent(adresse || ville)}&add=30\`;
        
        // Fichier standard .ics avec alerte VALARM à -30 minutes
        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Lou Ame Tay SASU//CRM Commercial//FR',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          \`UID:rdv-\${Date.now()}@louametay.online\`,
          \`DTSTAMP:\${fmt(new Date())}\`,
          \`DTSTART:\${fmt(debut)}\`,
          \`DTEND:\${fmt(fin)}\`,
          \`SUMMARY:RDV CHR — \${resto}\`,
          \`DESCRIPTION:\${detailsRdv.replace(/\\n/g, '\\\\n')}\`,
          \`LOCATION:\${adresse || ville}\`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT30M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Rappel RDV Lou Ame Tay dans 30 minutes',
          'END:VALARM',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\\r\\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
        const lienIcs = document.createElement('a');
        lienIcs.href = URL.createObjectURL(blob);
        lienIcs.download = \`RDV_\${resto.replace(/\\s+/g, '_')}.ics\`;
        document.body.appendChild(lienIcs);
        lienIcs.click();
        document.body.removeChild(lienIcs);
        URL.revokeObjectURL(lienIcs.href);

        window.open(urlGoogleCal, '_blank');
        afficherToast('📅 Événement Google Agenda généré avec alerte 30 min !');
      } catch (calErr) {
        console.warn('Erreur génération Google Agenda:', calErr);
      }`;

if (commJs.includes(gcalAncien)) {
  commJs = commJs.replace(gcalAncien, gcalNouveau);
  console.log('✅ Google Agenda avec alerte 30 min et fichier .ics mis à jour dans js/commercial.js');
}

// 2.4 Toggle switch disponibilité label update
commJs = commJs.replace(
  "const label = btn.querySelector('.toggle-label');\n  if (label) label.textContent = estOn ? 'En ligne' : 'Hors ligne';",
  "const label = document.getElementById('statut-toggle-text') || btn.querySelector('.switch-text, .toggle-label');\n  if (label) label.textContent = estOn ? 'En ligne' : 'Hors ligne';\n  btn.setAttribute('aria-checked', estOn ? 'true' : 'false');"
);

fs.writeFileSync(commJsPath, commJs, 'utf8');
console.log('🎉 Tous les correctifs commerciaux ont été appliqués avec succès !');
