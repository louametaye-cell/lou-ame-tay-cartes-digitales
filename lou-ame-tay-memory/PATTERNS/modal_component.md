# PATTERN : Composant Modal Accessible & Ergonomique (Vanilla JS & CSS)

> **Langage** : HTML5, CSS3, JavaScript (ESM)  
> **Accessibilité** : Conforme WAI-ARIA (Gestion du focus, touche Échap, verrouillage du défilement)  

---

## 🎯 Objectif
Fournir un composant modal universel prêt à l'emploi (pour formulaires de contact, prévisualisation de QR code, prise de rendez-vous) :
- Empêche le défilement de la page sous-jacente (`body.modal-ouvert`).
- Se ferme en cliquant sur la croix `✕`, sur le fond semi-transparent extérieur ou en pressant la touche `Échap` (Escape).
- Conserve les animations d'entrée fluides (fade-in + scale-up).

---

## 💻 Structure HTML Sémantique

```html
<div id="modal-exemple" class="modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="modal-titre">
  <div class="modal-boite">
    <!-- En-tête du modal -->
    <div class="modal-entete">
      <h3 id="modal-titre" class="modal-titre">Titre du Modal</h3>
      <button type="button" class="btn-fermer-modal" aria-label="Fermer la boîte de dialogue">✕</button>
    </div>

    <!-- Corps du modal -->
    <div class="modal-corps">
      <p>Contenu principal du modal...</p>
    </div>

    <!-- Pied du modal (optionnel) -->
    <div class="modal-pied">
      <button type="button" class="btn btn-contour btn-annuler">Annuler</button>
      <button type="button" class="btn btn-primaire btn-valider">Valider</button>
    </div>
  </div>
</div>
```

---

## 🎨 Styles CSS Modernes

```css
/* Arrière-plan semi-transparent flouté */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(7, 19, 34, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* Boîte de dialogue centrale */
.modal-boite {
  background-color: #0B1F3A;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  transform: scale(0.95);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.modal-overlay.active .modal-boite {
  transform: scale(1);
}

.modal-entete {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-titre {
  font-size: 1.15rem;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
}

.btn-fermer-modal {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94A3B8;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.btn-fermer-modal:hover {
  color: #FFFFFF;
}

.modal-corps {
  padding: 1.5rem;
  color: #E2E8F0;
  font-size: 0.95rem;
}

.modal-pied {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(0, 0, 0, 0.15);
}

/* Blocage du défilement arrière */
body.modal-ouvert {
  overflow: hidden;
}
```

---

## 🚀 Logique JavaScript Gestionnaire

```javascript
/**
 * Initialise le comportement d'un modal
 * @param {string} modalId - ID de l'élément overlay
 * @returns {Object} - Méthodes ouvrir() et fermer()
 */
export function creerGestionnaireModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) throw new Error(`Modal #${modalId} introuvable`);

  const btnFermer = modal.querySelector('.btn-fermer-modal');
  const btnAnnuler = modal.querySelector('.btn-annuler');

  function ouvrir() {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-ouvert');

    // Écoute de la touche Échap
    document.addEventListener('keydown', onKeyDown);
  }

  function fermer() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-ouvert');

    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') fermer();
  }

  // Fermeture par clic sur l'arrière-plan flouté
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fermer();
  });

  btnFermer?.addEventListener('click', fermer);
  btnAnnuler?.addEventListener('click', fermer);

  return { ouvrir, fermer };
}
```
