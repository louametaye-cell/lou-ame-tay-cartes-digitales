import fs from 'fs';

const path = 'commercial.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Bouton onglet Messages dans comm-tabs-nav
const tabAvisBtn = `<button type="button" class="comm-tab-btn" data-panel="panel-avis">
        <span>⭐ Avis Clients</span>
      </button>`;

const tabMessagesBtn = `<button type="button" class="comm-tab-btn" data-panel="panel-messages">
        <span>💬 Messages Direction</span>
        <span class="badge-count" id="badge-messages-count" style="display: none; background: #EF4444; color: white;">0</span>
      </button>`;

if (!html.includes('data-panel="panel-messages"')) {
  html = html.replace(tabAvisBtn, tabAvisBtn + '\n      ' + tabMessagesBtn);
}

// 2. Bouton dans le more-sheet de bottom-nav-mobile
const moreAvis = `<button type="button" class="more-sheet-item" data-panel="panel-avis">
          <span class="more-sheet-icon">⭐</span>
          <span class="more-sheet-label">Avis Clients</span>
        </button>`;

const moreMessages = `<button type="button" class="more-sheet-item" data-panel="panel-messages">
          <span class="more-sheet-icon">💬</span>
          <span class="more-sheet-label">Messages</span>
          <span class="badge-count" id="badge-messages-count-mobile" style="display: none; background: #EF4444; color: white; margin-left: auto;">0</span>
        </button>`;

if (!html.includes('id="badge-messages-count-mobile"')) {
  html = html.replace(moreAvis, moreAvis + '\n        ' + moreMessages);
}

// 3. Section panel-messages après panel-avis
const sectionAvisEnd = `      <!-- =====================================================================
           ONGLET 6 : AVIS & TÉMOIGNAGES CLIENTS
           ===================================================================== -->
      <section id="panel-avis" class="comm-panel">
        <div class="comm-card">
          <div class="comm-card-header">
            <h3 class="comm-card-title">⭐ Retours d'Expérience & Avis Reçus</h3>
            <div id="badge-note-globale" class="comm-badge vert" style="font-size: 0.95rem;">
              Note : 5.0 / 5
            </div>
          </div>

          <div id="liste-avis-commercial">
            <div style="text-align: center; padding: 2rem; color: var(--texte-muet);">
              Chargement des avis clients...
            </div>
          </div>
        </div>
      </section>`;

const sectionMessages = `      <!-- =====================================================================
           ONGLET : MESSAGERIE DIRECTION ↔ COMMERCIAUX
           ===================================================================== -->
      <section id="panel-messages" class="comm-panel">
        <div class="comm-card" style="border-top: 4px solid var(--bleu-profond); margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--bordure); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
            <div>
              <h3 style="font-size: 1.2rem; color: var(--bleu-profond); margin: 0; font-weight: 800;">
                💬 Messagerie Direction & Équipe
              </h3>
              <p style="margin: 3px 0 0; font-size: 0.82rem; color: var(--texte-muet);">
                Instructions prioritaires, primes de vente, validation d'acomptes et échanges directs avec le CEO
              </p>
            </div>
            <button type="button" class="comm-btn-outline" id="btn-rafraichir-messages" onclick="chargerMessagesInternes()" style="padding: 6px 12px; font-size: 0.8rem;">
              🔄 Actualiser
            </button>
          </div>

          <!-- Boîte de réception -->
          <div id="liste-messages-direction" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.5rem;">
            <div style="text-align: center; padding: 2rem; color: var(--texte-muet);">
              Chargement des messages... ⏳
            </div>
          </div>

          <!-- Formulaire d'envoi rapide à la Direction -->
          <div style="background: #F8FAFC; border: 1px solid var(--bordure); border-radius: 12px; padding: 1rem;">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--bleu-profond); margin: 0 0 0.5rem;">
              ✉️ Écrire à la Direction Lou Ame Tay
            </h4>
            <form id="form-message-direction">
              <input type="text" id="input-sujet-message" class="comm-input" placeholder="Sujet (ex: Question contrat, validation acompte Wave, question client...)" style="margin-bottom: 8px;" required>
              <textarea id="input-texte-message" class="comm-textarea" rows="3" placeholder="Votre message pour le CEO et la Direction..." style="margin-bottom: 8px; width: 100%; box-sizing: border-box;" required></textarea>
              <div style="display: flex; justify-content: flex-end;">
                <button type="submit" id="btn-envoyer-msg-direction" class="comm-btn-primary" style="background: #0B1F3A;">
                  <span>Envoyer à la Direction</span> ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>`;

if (!html.includes('id="panel-messages"')) {
  html = html.replace(sectionAvisEnd, sectionAvisEnd + '\n\n' + sectionMessages);
}

// 4. Avatar réel dans la modal Aissatou (lignes 3645)
const oldAvatar = `<div style="position: relative; width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #0B1F3A 0%, #16A34A 100%); display: flex; align-items: center; justify-content: center; font-size: 1.7rem; color: #fff; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);">
          👩🏾‍💼
          <span style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background: #22C55E; border: 2px solid #FFFFFF; border-radius: 50%;"></span>
        </div>`;

const newAvatar = `<div style="position: relative; width: 56px; height: 56px; border-radius: 50%; overflow: hidden; border: 2px solid #C9A227; box-shadow: 0 4px 14px rgba(201, 162, 39, 0.3); background: #0B1F3A; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <img src="images/aissatou-avatar.png" alt="Aissatou" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: linear-gradient(135deg, #0B1F3A 0%, #C9A227 100%); color: #F8E294; font-weight: 900; font-size: 1.4rem;">A</div>
          <span style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; background: #22C55E; border: 2px solid #FFFFFF; border-radius: 50%; z-index: 2;"></span>
        </div>`;

html = html.replace(oldAvatar, newAvatar);

// 5. Bouton mode sous écoute dans panel-rdv-gps
const btnArrive = `<button type="button" class="btn-arrive" onclick="pointerArriveeDirecte()">
          <span class="pulse-dot"></span>
          📍 Je suis arrivé
        </button>`;

const btnSousEcoute = `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          <button type="button" class="btn-arrive" onclick="pointerArriveeDirecte()" style="flex: 1; min-width: 160px; margin-bottom: 0;">
            <span class="pulse-dot"></span>
            📍 Je suis arrivé
          </button>
          <button type="button" class="btn-sous-ecoute" id="btn-toggle-sous-ecoute" onclick="toggleModeSousEcoute()" style="flex: 1; min-width: 180px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); color: #E0E7FF; border: 1px solid #6366F1; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">
            <span>🎧</span>
            <span id="label-sous-ecoute">Mode Sous écoute IA</span>
            <span class="pulse-ecoute" id="pulse-ecoute" style="display: none; width: 9px; height: 9px; background: #EF4444; border-radius: 50%; box-shadow: 0 0 8px #EF4444;"></span>
          </button>
        </div>
        <div id="zone-resume-sous-ecoute" style="display: none; background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 14px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #312E81; font-size: 0.88rem;">✨ Synthèse Aissatou de votre échange :</strong>
            <button type="button" onclick="injecterResumeEcouteDansProspect()" class="comm-btn-gold" style="font-size: 0.72rem; padding: 3px 8px;">📋 Créer Prospect</button>
          </div>
          <p id="texte-resume-sous-ecoute" style="margin: 0; font-size: 0.82rem; color: #1E1B4B; line-height: 1.4;"></p>
        </div>`;

html = html.replace(btnArrive, btnSousEcoute);

fs.writeFileSync(path, html, 'utf8');
console.log('✅ commercial.html mis à jour avec succès !');
