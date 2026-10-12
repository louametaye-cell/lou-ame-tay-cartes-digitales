// ═══ AISSATOU VOICE SERVICE ═══
// TTS (synthèse vocale) + confirmation dialoguée pour Lou Ame Tay

let voixAissatou = null;
const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

// Charger la meilleure voix française disponible
export function initialiserVoixAissatou() {
  if (!synthesis) return;
  const chargerVoix = () => {
    const voix = synthesis.getVoices();
    // Préférer une voix française féminine ou naturelle
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

// Aissatou parle avec toggle d'état visuel et animation avatar
export function aissatouParle(texte, options = {}) {
  return new Promise((resolve) => {
    if (!synthesis) {
      console.warn('⚠️ TTS non supporté par ce navigateur');
      resolve();
      return;
    }
    
    // Annuler toute parole en cours
    synthesis.cancel();

    // État visuel : Aissatou parle
    const status = document.getElementById('aissatou-status');
    const avatar = document.getElementById('aissatou-avatar');
    if (status) {
      status.className = 'aissatou-status parle';
      const textSpan = status.querySelector('.status-text');
      if (textSpan) textSpan.textContent = '🎤 Aissatou parle...';
    }
    if (avatar) avatar.classList.add('parle');
    
    const utterance = new SpeechSynthesisUtterance(texte);
    if (voixAissatou) {
      utterance.voice = voixAissatou;
    }
    utterance.lang = options.langue || 'fr-FR';
    utterance.rate = options.vitesse || 1.0;
    utterance.pitch = options.tonalite || 1.1;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      if (status) {
        status.className = 'aissatou-status ecoute';
        const textSpan = status.querySelector('.status-text');
        if (textSpan) textSpan.textContent = '🎧 À vous de parler...';
      }
      if (avatar) avatar.classList.remove('parle');
      resolve();
    };

    utterance.onerror = (err) => {
      console.error('TTS error:', err);
      if (status) {
        status.className = 'aissatou-status';
        const textSpan = status.querySelector('.status-text');
        if (textSpan) textSpan.textContent = 'En attente...';
      }
      if (avatar) avatar.classList.remove('parle');
      resolve();
    };
    
    synthesis.speak(utterance);
  });
}

// Stopper la voix
export function aissatouArreter() {
  if (synthesis) synthesis.cancel();
  const status = document.getElementById('aissatou-status');
  const avatar = document.getElementById('aissatou-avatar');
  if (status) {
    status.className = 'aissatou-status';
    const textSpan = status.querySelector('.status-text');
    if (textSpan) textSpan.textContent = 'En attente...';
  }
  if (avatar) avatar.classList.remove('parle');
}

// Initialiser automatiquement si dans le navigateur
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserVoixAissatou);
  } else {
    initialiserVoixAissatou();
  }
}
