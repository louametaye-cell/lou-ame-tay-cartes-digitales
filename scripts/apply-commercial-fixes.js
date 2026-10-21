import fs from 'fs';

console.log('Traitement normalisé de js/commercial.js...');
let code = fs.readFileSync('js/commercial.js', 'utf8');
const isCrlf = code.includes('\r\n');
code = code.replace(/\r\n/g, '\n');

// 1. Google Agenda avec alerte 30 min (.ics + TEMPLATE)
const gcalTarget = `      // FIX 4 — Proposition d'ajout à Google Agenda
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

const gcalReplacement = `      // Synchronisation Google Agenda avec alerte 30 minutes (.ics + Template)
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

if (code.includes(gcalTarget)) {
  code = code.replace(gcalTarget, gcalReplacement);
  console.log('✅ Google Agenda alerte 30 min injecté !');
} else {
  console.log('⚠️ Target Google Agenda non trouvée');
}

// 2. Micro Aissatou et libération de stream
const micTarget = `    // Demander la permission et démarrer
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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

const micReplacement = `    // Demander la permission et démarrer avec forçage HTTPS et libération de flux
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        window.location.href = window.location.href.replace('http:', 'https:');
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Libérer immédiatement les pistes audio pour éviter le conflit avec SpeechRecognition
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

if (code.includes(micTarget)) {
  code = code.replace(micTarget, micReplacement);
  console.log('✅ Libération stream micro Aissatou injectée !');
} else {
  console.log('⚠️ Target Micro Aissatou non trouvée');
}

// 3. Google Maps avec bandeau de retour
const mapsTarget = `// Fonctions de navigation Google Maps (même onglet + retour natif)
export function ouvrirMaps(adresse) {
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

const mapsReplacement = `// Fonctions de navigation Google Maps sécurisées avec bandeau retour
export function afficherBandeauRetourMaps() {
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

if (code.includes(mapsTarget)) {
  code = code.replace(mapsTarget, mapsReplacement);
  console.log('✅ Bandeau retour Google Maps injecté !');
} else {
  console.log('⚠️ Target Maps non trouvée');
}

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}
fs.writeFileSync('js/commercial.js', code, 'utf8');
console.log('🎉 js/commercial.js mis à jour avec succès !');
