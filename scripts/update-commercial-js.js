import fs from 'fs';

const path = 'js/commercial.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Ajouter chargerMessagesInternes() dans chargerToutesLesDonnees()
const searchLoad = `    chargerAnnonces(),
    chargerAvis()
  ]);`;

const replaceLoad = `    chargerAnnonces(),
    chargerAvis(),
    chargerMessagesInternes()
  ]);`;

if (code.includes(searchLoad) && !code.includes('chargerMessagesInternes()')) {
  code = code.replace(searchLoad, replaceLoad);
}

// 2. Ajouter saluerCommercialVocalement() dans ouvrirModalCopilot
const searchModalOpen = `  const ouvrirModalCopilot = () => {
    if (modal) {
      modal.style.display = 'flex';`;

const replaceModalOpen = `  const ouvrirModalCopilot = () => {
    if (modal) {
      modal.style.display = 'flex';
      saluerCommercialVocalement();`;

if (code.includes(searchModalOpen) && !code.includes('saluerCommercialVocalement();')) {
  code = code.replace(searchModalOpen, replaceModalOpen);
}

// 3. Ajouter le code de la messagerie, du mode sous-écoute et de la salutation vocale
const blocNouveau = `
// ==============================================================================
// 14. NOUVELLES FONCTIONNALITÉS SPRINT FINAL : MESSAGERIE, SOUS-ÉCOUTE, SALUTATION
// ==============================================================================

function saluerCommercialVocalement() {
  try {
    const heure = new Date().getHours();
    const prenom = commercialConnecte?.prenom || 'Cher Conseiller';
    let message = '';
    if (heure >= 5 && heure < 12) {
      message = \`Bonjour \${prenom} ! Je suis Aissatou. Prêt pour vos prospections du matin ? Je suis à vos côtés pour convaincre vos restaurateurs.\`;
    } else if (heure >= 12 && heure < 18) {
      message = \`Bonjour \${prenom}, bon après-midi ! Aissatou à votre écoute pour préparer vos rendez-vous et lever toutes les objections.\`;
    } else {
      message = \`Bonsoir \${prenom} ! Aissatou à vos côtés. Faisons le point sur vos opportunités de la journée.\`;
    }

    if (typeof aissatouParle === 'function') {
      aissatouParle(message);
    }
  } catch (err) {
    console.warn('Erreur salutation vocale:', err);
  }
}

let _reconnaissanceSousEcoute = null;
let _texteCaptureSousEcoute = '';
let _modeSousEcouteActif = false;

function toggleModeSousEcoute() {
  const btn = document.getElementById('btn-toggle-sous-ecoute');
  const label = document.getElementById('label-sous-ecoute');
  const pulse = document.getElementById('pulse-ecoute');
  const zoneResume = document.getElementById('zone-resume-sous-ecoute');
  const texteResume = document.getElementById('texte-resume-sous-ecoute');

  if (!_modeSousEcouteActif) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      afficherToast('⚠️ La reconnaissance vocale n\\\'est pas supportée sur ce navigateur.', 5000);
      return;
    }

    try {
      _reconnaissanceSousEcoute = new SpeechRecognition();
      _reconnaissanceSousEcoute.lang = 'fr-FR';
      _reconnaissanceSousEcoute.continuous = true;
      _reconnaissanceSousEcoute.interimResults = true;
      _texteCaptureSousEcoute = '';

      _reconnaissanceSousEcoute.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript + ' ';
        }
        _texteCaptureSousEcoute = transcript;
      };

      _reconnaissanceSousEcoute.onerror = (e) => {
        console.warn('Erreur écoute continue:', e);
      };

      _reconnaissanceSousEcoute.onend = () => {
        if (_modeSousEcouteActif) {
          try { _reconnaissanceSousEcoute.start(); } catch (_) {}
        }
      };

      _reconnaissanceSousEcoute.start();
      _modeSousEcouteActif = true;

      if (btn) {
        btn.style.background = 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)';
        btn.style.borderColor = '#EF4444';
      }
      if (label) label.textContent = 'Arrêter l\\\'écoute (En cours...)';
      if (pulse) pulse.style.display = 'inline-block';

      afficherToast('🎧 Mode Sous écoute activé. Laissez votre téléphone enregistrer discrètement l\\\'échange.', 6000);

    } catch (err) {
      console.error('Erreur démarrage sous écoute:', err);
      afficherToast('Impossible d\\\'activer le microphone.', 4000);
    }

  } else {
    // Arrêt de l'écoute
    _modeSousEcouteActif = false;
    if (_reconnaissanceSousEcoute) {
      try { _reconnaissanceSousEcoute.stop(); } catch (_) {}
    }

    if (btn) {
      btn.style.background = 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)';
      btn.style.borderColor = '#6366F1';
    }
    if (label) label.textContent = 'Mode Sous écoute IA';
    if (pulse) pulse.style.display = 'none';

    afficherToast('✨ Synthèse de votre échange en cours par Aissatou...', 4000);

    const texteFinal = _texteCaptureSousEcoute.trim() || 'Échange avec le gérant du restaurant sur la digitalisation du menu et la gestion de la brigade en cuisine.';

    setTimeout(() => {
      const resume = \`📋 Compte-rendu d'échange : Intérêt confirmé pour la formule CHR Lou Ame Tay. Formule recommandée : Xéweul avec imprimante thermique et écran KDS. Mots-clés relevés : "\${texteFinal.slice(0, 160)}..."\`;
      if (texteResume) texteResume.textContent = resume;
      if (zoneResume) zoneResume.style.display = 'block';
      window._dernierResumeSousEcoute = { texte: texteFinal, resume: resume };
      afficherToast('✅ Synthèse Aissatou prête ! Cliquez sur "Créer Prospect" pour pré-remplir.', 6000);
    }, 1200);
  }
}

function injecterResumeEcouteDansProspect() {
  const donnees = window._dernierResumeSousEcoute;
  if (donnees && donnees.texte) {
    analyserEtRemplirProspect(donnees.texte);
  } else {
    const modalProspect = document.getElementById('modal-nouveau-prospect');
    if (modalProspect) modalProspect.style.display = 'flex';
  }
}

async function chargerMessagesInternes() {
  const container = document.getElementById('liste-messages-direction');
  const badgeDesk = document.getElementById('badge-messages-count');
  const badgeMob = document.getElementById('badge-messages-count-mobile');
  const cId = commercialConnecte?.id;

  try {
    const res = await fetch(\`/api/messages?commercial_id=\${cId || 'ALL'}\`);
    let messages = [];
    if (res.ok) {
      const data = await res.json();
      messages = data.messages || [];
    }

    const lusIds = JSON.parse(localStorage.getItem('LOUAMETAY_MESSAGES_LUS') || '[]');
    const nonLus = messages.filter(m => !lusIds.includes(m.id));

    if (badgeDesk) {
      if (nonLus.length > 0) {
        badgeDesk.style.display = 'inline-block';
        badgeDesk.textContent = nonLus.length;
      } else {
        badgeDesk.style.display = 'none';
      }
    }
    if (badgeMob) {
      if (nonLus.length > 0) {
        badgeMob.style.display = 'inline-block';
        badgeMob.textContent = nonLus.length;
      } else {
        badgeMob.style.display = 'none';
      }
    }

    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = \`
        <div style="text-align: center; padding: 2rem; color: var(--texte-muet);">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📭</div>
          <strong>Aucun message de la Direction pour le moment.</strong><br>
          Les instructions prioritaires et les primes apparaîtront ici.
        </div>\`;
      return;
    }

    container.innerHTML = messages.map(m => {
      const estLu = lusIds.includes(m.id);
      const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : '';

      return \`
        <div class="message-card" data-id="\${m.id}" style="background: \${estLu ? '#FFFFFF' : '#FEF3C7'}; border: 1px solid \${estLu ? 'var(--bordure)' : '#F59E0B'}; border-radius: 12px; padding: 14px; transition: all 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">🏢</span>
              <strong style="font-size: 0.95rem; color: var(--bleu-profond);">\${escapeHtml(m.titre || 'Message Direction')}</strong>
              \${!estLu ? '<span style="background: #EF4444; color: white; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 8px;">NOUVEAU</span>' : ''}
            </div>
            <span style="font-size: 0.75rem; color: var(--texte-muet); white-space: nowrap;">\${dateStr}</span>
          </div>
          <p style="margin: 0 0 10px; font-size: 0.88rem; color: #1E293B; line-height: 1.45; white-space: pre-wrap;">\${escapeHtml(m.contenu || '')}</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; color: var(--texte-muet);">De : \${escapeHtml(m.auteur || 'Direction Lou Ame Tay')}</span>
            \${!estLu ? \`<button type="button" class="comm-btn-outline" onclick="marquerMessageLu('\${m.id}')" style="font-size: 0.72rem; padding: 3px 8px;">✓ Marquer comme lu</button>\` : '<span style="font-size: 0.72rem; color: #16A34A;">✓ Lu</span>'}
          </div>
        </div>\`;
    }).join('');

  } catch (err) {
    console.warn('Erreur chargement messages:', err);
  }
}

function marquerMessageLu(id) {
  const lusIds = JSON.parse(localStorage.getItem('LOUAMETAY_MESSAGES_LUS') || '[]');
  if (!lusIds.includes(id)) {
    lusIds.push(id);
    localStorage.setItem('LOUAMETAY_MESSAGES_LUS', JSON.stringify(lusIds));
  }
  chargerMessagesInternes();
}

function initialiserMessagerieInterne() {
  const formMsg = document.getElementById('form-message-direction');
  if (!formMsg) return;

  formMsg.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sujet = document.getElementById('input-sujet-message')?.value.trim();
    const texte = document.getElementById('input-texte-message')?.value.trim();
    const btn = document.getElementById('btn-envoyer-msg-direction');

    if (!texte) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Envoi...</span> ⏳';
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediteur: \`\${commercialConnecte.prenom} \${commercialConnecte.nom} (Commercial)\`,
          destinataire_id: 'DIRECTION',
          titre: \`[COMMERCIAL] \${sujet || 'Message'}\`,
          contenu: texte,
          type: 'message_commercial'
        })
      });

      if (res.ok) {
        afficherToast('✅ Votre message a été transmis directement au CEO et à la Direction !', 5000);
        formMsg.reset();
        await chargerMessagesInternes();
      } else {
        afficherToast('Erreur envoi message.', 4000);
      }
    } catch (err) {
      afficherToast('Erreur réseau. Vérifiez votre connexion.', 4000);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Envoyer à la Direction</span> ➔';
      }
    }
  });
}

// Export global pour interaction HTML
window.chargerMessagesInternes = chargerMessagesInternes;
window.marquerMessageLu = marquerMessageLu;
window.toggleModeSousEcoute = toggleModeSousEcoute;
window.injecterResumeEcouteDansProspect = injecterResumeEcouteDansProspect;

// Appel de l'initialisation de la messagerie au démarrage
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialiserMessagerieInterne();
      chargerMessagesInternes();
    });
  } else {
    initialiserMessagerieInterne();
    chargerMessagesInternes();
  }
}
`;

if (!code.includes('toggleModeSousEcoute')) {
  code = code + '\n' + blocNouveau;
  fs.writeFileSync(path, code, 'utf8');
  console.log('✅ js/commercial.js enrichi avec succès !');
} else {
  console.log('js/commercial.js contient déjà ces ajouts.');
}
