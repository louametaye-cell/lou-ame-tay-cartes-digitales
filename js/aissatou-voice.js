/**
 * ==============================================================================
 * FICHIER : js/aissatou-voice.js
 * SERVICE VOCAL NATUREL AISSATOU V2 (TTS & STT INTERACTIF)
 * ==============================================================================
 * Conforme aux directives d'expérience conversationnelle :
 * 1. Interdiction des puces (-), tableaux (|) et gras (**) à l'oral.
 * 2. Synthèse fluide, courte (1 à 2 phrases max) avec marqueurs naturels ("Alors...", "Hmm...").
 * 3. Support des termes sénégalais et du Wolof en phonétique douce.
 * 4. Gestion immédiate des interruptions (Barge-in).
 * ==============================================================================
 */

let voixAissatou = null;
const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

/**
 * Nettoie le texte pour une élocution conversationnelle pure sans markdown
 * @param {string} texteBrut 
 * @returns {string} texteNettoye
 */
export function filtrerTextePourOral(texteBrut) {
  if (!texteBrut) return '';
  let s = String(texteBrut);

  // 1. Suppression du markdown lourd
  s = s.replace(/```[\s\S]*?```/g, ''); // Blocs de code
  s = s.replace(/`([^`]+)`/g, '$1');    // Code inline
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1'); // Gras
  s = s.replace(/\*([^*]+)\*/g, '$1');  // Italique
  s = s.replace(/^[-*•]\s+/gm, '');     // Puces de listes
  s = s.replace(/^\d+\.\s+/gm, '');     // Numérotation
  s = s.replace(/\|[^|\n]+\|/g, '');    // Tableaux
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Liens

  // 2. Remplacement des sigles pour une prononciation naturelle
  s = s.replace(/\bFCFA\b/gi, 'francs CFA');
  s = s.replace(/\bRDV\b/gi, 'rendez-vous');
  s = s.replace(/\bCHR\b/gi, 'C-H-R');
  s = s.replace(/\bKDS\b/gi, 'K-D-S');
  s = s.replace(/\bGPS\b/gi, 'G-P-S');
  s = s.replace(/\bCEO\b/gi, 'directeur général');
  s = s.replace(/\bIA\b/gi, 'intelligence artificielle');
  s = s.replace(/\bDAW\b/gi, 'Digital Arts Work');

  // 3. Limitation à 2 phrases orales maximum pour éviter les monologues
  const phrases = s.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (phrases.length > 2) {
    s = phrases.slice(0, 2).join(' ');
  }

  return s.trim();
}

/**
 * Charge la meilleure voix disponible
 */
export function initialiserVoixAissatou() {
  if (!synthesis) return;
  const chargerVoix = () => {
    const voix = synthesis.getVoices();
    voixAissatou = voix.find(v => v.lang === 'fr-FR' && (v.name.includes('Amélie') || v.name.includes('Denise') || v.name.includes('Céline') || v.name.includes('Hortense')))
                || voix.find(v => v.lang === 'fr-FR' && v.name.includes('Google'))
                || voix.find(v => v.lang === 'fr-FR')
                || voix.find(v => v.lang.startsWith('fr'))
                || voix[0];

    if (voixAissatou) {
      console.log('✅ Voix Aissatou chargée :', voixAissatou.name);
    }
  };

  chargerVoix();
  if (synthesis.onvoiceschanged !== undefined) {
    synthesis.onvoiceschanged = chargerVoix;
  }
}

/**
 * Aissatou parle avec mise à jour des états visuels
 * @param {string} texte 
 * @param {Object} options 
 */
export function aissatouParle(texte, options = {}) {
  return new Promise((resolve) => {
    if (!synthesis) {
      resolve();
      return;
    }

    // Interrompre toute parole en cours (Barge-in)
    synthesis.cancel();

    const texteOral = filtrerTextePourOral(texte);
    if (!texteOral) {
      resolve();
      return;
    }

    // Mise à jour de l'état visuel : Aissatou parle
    mettreAJourEtatVisuelAissatou('PARLE', '🎤 Aissatou parle...');

    const utterance = new SpeechSynthesisUtterance(texteOral);
    if (voixAissatou) {
      utterance.voice = voixAissatou;
    }
    utterance.lang = options.langue || 'fr-FR';
    utterance.rate = options.vitesse || 0.98;
    utterance.pitch = options.tonalite || 1.08;
    utterance.volume = 1.0;

    utterance.onend = () => {
      mettreAJourEtatVisuelAissatou('EN_ATTENTE', 'En attente...');
      resolve();
    };

    utterance.onerror = (err) => {
      console.warn('Erreur TTS Aissatou:', err);
      mettreAJourEtatVisuelAissatou('EN_ATTENTE', 'En attente...');
      resolve();
    };

    synthesis.speak(utterance);
  });
}

/**
 * Arrête immédiatement la parole d'Aissatou lors d'une interruption
 */
export function aissatouArreter() {
  if (synthesis) {
    synthesis.cancel();
  }
  mettreAJourEtatVisuelAissatou('EN_ATTENTE', 'En attente...');
}

/**
 * Met à jour les 4 états visuels de l'agent dans l'interface
 * @param {string} etat - 'ECOUTE', 'ANALYSE', 'CONFIRMATION', 'EXECUTE', 'PARLE', 'EN_ATTENTE'
 * @param {string} message 
 */
export function mettreAJourEtatVisuelAissatou(etat, message = '') {
  const statusEl = document.getElementById('aissatou-status');
  const avatarEl = document.getElementById('aissatou-avatar');
  const badgeEtat = document.getElementById('aissatou-badge-etat');

  if (statusEl) {
    statusEl.className = `aissatou-status ${etat.toLowerCase()}`;
    const txt = statusEl.querySelector('.status-text') || statusEl;
    if (message) txt.textContent = message;
  }

  if (avatarEl) {
    avatarEl.classList.remove('parle', 'ecoute', 'analyse', 'confirmation');
    if (etat === 'PARLE') avatarEl.classList.add('parle');
    if (etat === 'ECOUTE') avatarEl.classList.add('ecoute');
    if (etat === 'ANALYSE') avatarEl.classList.add('analyse');
  }

  if (badgeEtat) {
    switch (etat) {
      case 'ECOUTE':
        badgeEtat.style.background = 'rgba(34, 197, 94, 0.15)';
        badgeEtat.style.color = '#15803D';
        badgeEtat.innerHTML = '🟢 En écoute active...';
        break;
      case 'ANALYSE':
        badgeEtat.style.background = 'rgba(201, 162, 39, 0.15)';
        badgeEtat.style.color = '#B45309';
        badgeEtat.innerHTML = '🟡 En cours d\'analyse...';
        break;
      case 'CONFIRMATION':
        badgeEtat.style.background = 'rgba(249, 115, 22, 0.15)';
        badgeEtat.style.color = '#C2410C';
        badgeEtat.innerHTML = '🟠 En attente de confirmation...';
        break;
      case 'EXECUTE':
        badgeEtat.style.background = 'rgba(11, 31, 58, 0.12)';
        badgeEtat.style.color = '#0B1F3A';
        badgeEtat.innerHTML = '🔵 Action exécutée avec succès';
        break;
      default:
        badgeEtat.style.background = 'rgba(34, 197, 94, 0.15)';
        badgeEtat.style.color = '#15803D';
        badgeEtat.innerHTML = 'En ligne • Agent Autonome';
        break;
    }
  }
}

// Initialisation au chargement
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserVoixAissatou);
  } else {
    initialiserVoixAissatou();
  }
}
