# PATTERN : Système de Notifications Flottantes (Toast Notifications)

> **Langage** : JavaScript (ESM) & CSS3  
> **Comportement** : Non-bloquant, auto-disparition, accessible (`role="status"`, `aria-live="polite"`)  

---

## 🎯 Objectif
Fournir un retour visuel discret et immédiat à l'utilisateur lors d'une action réussie (ex: "✓ Lien copié !", "✓ Contact enregistré") ou d'une erreur réseau, sans interrompre sa navigation ni utiliser de boîtes de dialogue bloquantes `alert()`.

---

## 💻 Structure CSS

```css
/* Conteneur de notification toast flottant */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: #112644;
  color: #FFFFFF;
  padding: 0.85rem 1.5rem;
  border-radius: 50px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, visibility 0.3s;
  pointer-events: none;
}

/* État affiché */
.toast-notification.visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

/* Variantes thématiques */
.toast-notification.toast-succes {
  border-color: #10B981;
  background: #064E3B;
  color: #ECFDF5;
}

.toast-notification.toast-erreur {
  border-color: #EF4444;
  background: #7F1D1D;
  color: #FEF2F2;
}

.toast-notification.toast-info {
  border-color: #C9A227;
  background: #0B1F3A;
  color: #F8FAFC;
}
```

---

## 🚀 Logique JavaScript Gestionnaire

```javascript
/**
 * Affiche une notification toast temporaire
 * @param {string} message - Texte de la notification
 * @param {'succes'|'erreur'|'info'} type - Type visuel
 * @param {number} dureeMs - Durée d'affichage en millisecondes (défaut: 3000ms)
 */
export function afficherToast(message, type = 'succes', dureeMs = 3000) {
  let toast = document.getElementById('toast-global');

  // Création dynamique si inexistant
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-global';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  // Préparation de l'icône selon le type
  let icone = '✓';
  if (type === 'erreur') icone = '⚠️';
  if (type === 'info') icone = 'ℹ️';

  toast.innerHTML = `<span class="toast-icone" aria-hidden="true">${icone}</span> <span>${message}</span>`;
  toast.className = `toast-notification visible toast-${type}`;

  // Réinitialisation du minuteur si un toast était déjà affiché
  if (toast._timer) clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, dureeMs);
}
```

---

## 🛠️ Exemple d'Appel en Pratique
```javascript
// Succès copie de lien
navigator.clipboard.writeText(window.location.href);
afficherToast('Lien de la carte copié dans le presse-papier !', 'succes');

// Erreur réseau
afficherToast('Impossible de contacter le serveur. Mode hors ligne actif.', 'erreur', 4000);
```
