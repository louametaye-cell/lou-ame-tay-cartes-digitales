/**
 * ==============================================================================
 * FICHIER : js/pwa-install.js
 * GESTION DE L'INSTALLATION PWA SUR SMARTPHONES & NAVIGATEURS MOBILES
 * ==============================================================================
 */

let promptInstallationDifferee = null;

// Enregistrement automatique du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        console.debug('Service Worker Lou Ame Tay actif :', reg.scope);
      })
      .catch((err) => {
        console.debug('Enregistrement Service Worker reporté :', err);
      });
  });
}

// Détection de l'événement beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptInstallationDifferee = e;

  const btnPwa = document.getElementById('btn-pwa-install');
  if (btnPwa) {
    btnPwa.style.display = 'inline-flex';
    btnPwa.addEventListener('click', installerPWA);
  }
});

/**
 * Déclenche l'affichage du dialogue natif d'installation
 */
export async function installerPWA() {
  if (!promptInstallationDifferee) {
    alert("Pour installer cette carte sur votre écran d'accueil :\n1. Appuyez sur Partager (Safari) ou Menu ⋮ (Chrome)\n2. Sélectionnez 'Ajouter à l'écran d'accueil'");
    return;
  }

  promptInstallationDifferee.prompt();
  const { outcome } = await promptInstallationDifferee.userChoice;
  if (outcome === 'accepted') {
    const btnPwa = document.getElementById('btn-pwa-install');
    if (btnPwa) btnPwa.style.display = 'none';
  }
  promptInstallationDifferee = null;
}

window.addEventListener('appinstalled', () => {
  console.debug('Application Lou Ame Tay installée sur l\'écran d\'accueil');
  const btnPwa = document.getElementById('btn-pwa-install');
  if (btnPwa) btnPwa.style.display = 'none';
});
