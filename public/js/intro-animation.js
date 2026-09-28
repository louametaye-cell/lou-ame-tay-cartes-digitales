/**
 * ==============================================================================
 * FICHIER : js/intro-animation.js
 * ANIMATION D'INTRODUCTION CINÉMATIQUE WOW (2.5 SECONDES) — LOU AME TAY
 * ==============================================================================
 */

// Animation d'intro cinématique — jouée 1 fois par session
export function jouerIntro(commercial) {
  if (!commercial) return;
  if (sessionStorage.getItem('intro_jouee')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const intro = document.createElement('div');
  intro.id = 'intro-cinematic';
  intro.innerHTML = `
    <div class="intro-logo">
      <img src="images/logo.png" alt="Lou Ame Tay" onerror="this.src='images/logo.svg'">
    </div>
    <div class="intro-nom">${escapeHtml(commercial.prenom)} ${escapeHtml(commercial.nom)}</div>
    <div class="intro-poste">${escapeHtml(commercial.poste || 'Conseiller Terrain CHR')}</div>
  `;
  document.body.appendChild(intro);

  // Haptic feedback
  try {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  } catch (e) {
    // Non supporté sur certains navigateurs desktop
  }

  // Fermer après 2.5s
  setTimeout(() => {
    intro.classList.add('intro-sortie');
    setTimeout(() => intro.remove(), 500);
  }, 2500);

  sessionStorage.setItem('intro_jouee', 'true');
}

// Alias pour compatibilité
export const lancerAnimationIntro = jouerIntro;

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
