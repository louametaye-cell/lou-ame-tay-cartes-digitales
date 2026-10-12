import fs from 'fs';

const path = 'admin.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Ajout des boutons dans sidebar-nav
const targetNav = `<button type="button" class="nav-onglet-btn" data-onglet="annonces">
        <span class="nav-icone" aria-hidden="true">📢</span>
        <span>Annonces Équipe</span>
      </button>`;

const newNavButtons = `<button type="button" class="nav-onglet-btn" data-onglet="annonces">
        <span class="nav-icone" aria-hidden="true">📢</span>
        <span>Annonces Équipe</span>
      </button>

      <!-- MESSAGERIE ÉQUIPE & COMMERCIAUX -->
      <button type="button" class="nav-onglet-btn" data-onglet="messages-direction">
        <span class="nav-icone" aria-hidden="true">💬</span>
        <span>Messagerie Équipe</span>
      </button>

      <!-- AISSATOU CEO STRATÉGIE -->
      <button type="button" class="nav-onglet-btn" data-onglet="aissatou-ceo" style="background: linear-gradient(135deg, rgba(11, 31, 58, 0.08) 0%, rgba(201, 162, 39, 0.12) 100%); border-left: 3px solid #C9A227; font-weight: 700;">
        <span class="nav-icone" aria-hidden="true">👩🏾‍💼</span>
        <span>Aissatou CEO</span>
      </button>`;

if (!html.includes('data-onglet="aissatou-ceo"')) {
  html = html.replace(targetNav, newNavButtons);
}

// 2. Ajout des sections dans le corps de admin.html
const targetSection = `    <!-- SECTION 12 : JOURNAL D'AUDIT, SÉCURITÉ & LOGS SYSTÈME -->
    <section id="vue-audit" class="admin-vue">`;

const newSections = `    <!-- SECTION : MESSAGERIE DIRECTION ↔ COMMERCIAUX -->
    <section id="vue-messages-direction" class="admin-vue">
      <div class="vue-entete">
        <div>
          <h2 class="vue-titre">💬 Messagerie Direction & Force de Vente</h2>
          <p class="vue-desc">Envoyez des instructions ciblées, annoncez des primes et échangez directement avec les conseillers terrain.</p>
        </div>
      </div>

      <div class="dashboard-grille-deux" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <!-- Formulaire d'envoi -->
        <div class="carte-stat" style="background: #FFFFFF; border: 1px solid var(--bordure, #E2E8F0); border-radius: 14px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem; color: #0B1F3A; font-size: 1.1rem; font-weight: 800;">✉️ Nouveau Message Direction</h3>
          <form id="form-admin-envoi-msg">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">Destinataire :</label>
              <select id="admin-select-destinataire-msg" class="champ-texte" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #CBD5E1;">
                <option value="ALL">📢 Toute l'Équipe Commerciale (Diffusion Générale)</option>
                <option value="1f6306c0-cd61-4d2f-96b4-130705f8af81">Babacar Gueye (Thiès, Dakar, Mbour)</option>
                <option value="d1d2955f-34f3-42f3-9601-7e4866ecd301">Cheikh Ahmadou Bamba MBODJ (Axe TDM)</option>
                <option value="9e505eb4-b2b3-48bb-b456-35c6d8faa428">Arona Sow (Dakar Plateau & Almadies)</option>
                <option value="f4e5f971-e137-4bbb-9b52-62fdc16be380">Fatou Diop (Petite Côte & Saly)</option>
              </select>
            </div>
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">Titre de l'instruction :</label>
              <input type="text" id="admin-titre-msg" class="champ-texte" placeholder="Ex: Prime exceptionnelle ce week-end / Suivi restaurant" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #CBD5E1;" required>
            </div>
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">Contenu du message :</label>
              <textarea id="admin-contenu-msg" class="champ-texte" rows="4" placeholder="Détaillez votre consigne commerciale ou votre encouragement..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #CBD5E1;" required></textarea>
            </div>
            <button type="submit" id="btn-admin-envoyer-msg" class="btn-principal" style="width: 100%; padding: 12px; background: #0B1F3A; color: #FFFFFF; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
              Envoyer l'instruction ➔
            </button>
          </form>
        </div>

        <!-- Historique des messages envoyés et reçus -->
        <div class="carte-stat" style="background: #FFFFFF; border: 1px solid var(--bordure, #E2E8F0); border-radius: 14px; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0; color: #0B1F3A; font-size: 1.1rem; font-weight: 800;">📋 Flux Récents Direction & Terrain</h3>
            <button type="button" onclick="chargerMessagesAdmin()" style="background: none; border: 1px solid #CBD5E1; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">🔄 Actualiser</button>
          </div>
          <div id="liste-messages-admin-flux" style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            <p style="text-align: center; color: #64748B; padding: 2rem;">Chargement des messages...</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION : AISSATOU CEO — CONSEILLÈRE STRATÉGIQUE EXÉCUTIVE -->
    <section id="vue-aissatou-ceo" class="admin-vue">
      <div class="vue-entete" style="background: linear-gradient(135deg, #0B1F3A 0%, #166534 100%); color: #FFFFFF; padding: 1.5rem; border-radius: 16px; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div style="position: relative; width: 64px; height: 64px; border-radius: 50%; overflow: hidden; border: 2px solid #C9A227; box-shadow: 0 4px 14px rgba(201, 162, 39, 0.4); flex-shrink: 0;">
            <img src="images/aissatou-avatar.png" alt="Aissatou" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';">
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h2 style="font-size: 1.4rem; font-weight: 800; margin: 0; color: #FFFFFF;">Aissatou — Conseillère Stratégique Direction & CEO</h2>
              <span style="background: #C9A227; color: #0B1F3A; font-weight: 800; font-size: 0.75rem; padding: 3px 10px; border-radius: 12px;">FICHE 10 EXÉCUTIVE ACTIVE</span>
            </div>
            <p style="margin: 4px 0 0; font-size: 0.88rem; color: #E2E8F0;">
              Analyse du marché CHR, pilotage des marges SaaS, arbitrage des commissions et plan d'expansion sous-régionale (DAW Digital Arts Work by MG).
            </p>
          </div>
        </div>
      </div>

      <div class="dashboard-grille-deux" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <!-- Dialogue RAG Stratégique -->
        <div class="carte-stat" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem; color: #0B1F3A; font-size: 1.1rem; font-weight: 800;">💬 Consultation Exécutive Aissatou</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input type="text" id="admin-question-aissatou" class="champ-texte" placeholder="Ex: Analyse la rentabilité de la formule Xéweul..." style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #CBD5E1;">
            <button type="button" id="btn-admin-consulter-aissatou" style="padding: 10px 18px; background: #16A34A; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">Consulter</button>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;">
            <button type="button" class="btn-prompt-rapide-ceo" data-q="Quels sont les leviers pour atteindre 50 restaurants signés ce mois ?" style="font-size: 0.75rem; background: #F1F5F9; border: 1px solid #CBD5E1; padding: 5px 8px; border-radius: 6px; cursor: pointer;">📈 Objectif 50 restaus</button>
            <button type="button" class="btn-prompt-rapide-ceo" data-q="Quelle est notre marge brute sur la formule Nio Far ?" style="font-size: 0.75rem; background: #F1F5F9; border: 1px solid #CBD5E1; padding: 5px 8px; border-radius: 6px; cursor: pointer;">💰 Marge Nio Far</button>
            <button type="button" class="btn-prompt-rapide-ceo" data-q="Quelles sont les opportunités à Abidjan pour la phase 2 ?" style="font-size: 0.75rem; background: #F1F5F9; border: 1px solid #CBD5E1; padding: 5px 8px; border-radius: 6px; cursor: pointer;">🌍 Expansion Abidjan</button>
          </div>
          <div id="admin-reponse-aissatou" style="display: none; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; line-height: 1.5; font-size: 0.9rem; color: #1E293B;">
          </div>
        </div>

        <!-- Synthèse Stratégique & Marges DAW -->
        <div class="carte-stat" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem; color: #0B1F3A; font-size: 1.1rem; font-weight: 800;">📊 Modèle Économique & Marges Brutes CHR</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="background: #F1F5F9; text-align: left;">
                <th style="padding: 8px;">Formule</th>
                <th style="padding: 8px;">Tarif Public</th>
                <th style="padding: 8px;">Marge DAW</th>
                <th style="padding: 8px;">Comm. (10%)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px; font-weight: 700;">TÀMBALI</td>
                <td style="padding: 8px;">15 000 F</td>
                <td style="padding: 8px; color: #16A34A; font-weight: 700;">85%</td>
                <td style="padding: 8px;">1 500 F</td>
              </tr>
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px; font-weight: 700;">XÉWEUL</td>
                <td style="padding: 8px;">35 000 F</td>
                <td style="padding: 8px; color: #16A34A; font-weight: 700;">88%</td>
                <td style="padding: 8px;">3 500 F</td>
              </tr>
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px; font-weight: 700;">NIO FAR</td>
                <td style="padding: 8px;">65 000 F</td>
                <td style="padding: 8px; color: #16A34A; font-weight: 700;">90%</td>
                <td style="padding: 8px;">6 500 F</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: 700;">BÈGG BÀMBA</td>
                <td style="padding: 8px;">120 000 F</td>
                <td style="padding: 8px; color: #16A34A; font-weight: 700;">92%</td>
                <td style="padding: 8px;">12 000 F</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 1rem; padding: 10px; background: #ECFDF5; border-radius: 8px; font-size: 0.8rem; color: #065F46;">
            💡 <strong>Règle DAF :</strong> Tout paiement validé avec preuve Wave débloque instantanément la commission du commercial.
          </div>
        </div>
      </div>
    </section>

` + targetSection;

if (!html.includes('id="vue-aissatou-ceo"')) {
  html = html.replace(targetSection, newSections);
}

fs.writeFileSync(path, html, 'utf8');
console.log('✅ admin.html mis à jour avec Messagerie & Aissatou CEO !');
