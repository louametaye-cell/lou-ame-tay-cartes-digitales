import fs from 'fs';

const path = 'js/admin.js';
let code = fs.readFileSync(path, 'utf8');

const codeAjout = `
// ==============================================================================
// 29. GESTION MESSAGERIE DIRECTION ↔ FORCE DE VENTE & AISSATOU CEO
// ==============================================================================

async function chargerMessagesAdmin() {
  const conteneur = document.getElementById('liste-messages-admin-flux');
  if (!conteneur) return;

  try {
    const res = await fetch('/api/messages?limit=50');
    if (!res.ok) throw new Error('Erreur API messages');
    const data = await res.json();
    const messages = data.messages || [];

    if (messages.length === 0) {
      conteneur.innerHTML = '<p style="text-align: center; color: #64748B; padding: 2rem;">Aucun message échangé pour le moment.</p>';
      return;
    }

    conteneur.innerHTML = messages.map(m => {
      const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : '';
      const estCommercial = m.type === 'message_commercial' || (m.titre && m.titre.includes('[COMMERCIAL]'));

      return \`
        <div style="background: \${estCommercial ? '#EFF6FF' : '#F8FAFC'}; border: 1px solid \${estCommercial ? '#BFDBFE' : '#E2E8F0'}; border-radius: 10px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #0B1F3A; font-size: 0.9rem;">\${m.titre || 'Message'}</strong>
            <span style="font-size: 0.75rem; color: #64748B;">\${dateStr}</span>
          </div>
          <p style="margin: 0 0 6px; font-size: 0.85rem; color: #334155; line-height: 1.4;">\${m.contenu || ''}</p>
          <div style="font-size: 0.72rem; color: #64748B;">
            Expéditeur : <strong>\${m.auteur || 'Direction'}</strong>
          </div>
        </div>
      \`;
    }).join('');

  } catch (err) {
    console.warn('Erreur chargement messages admin:', err);
    conteneur.innerHTML = '<p style="text-align: center; color: #EF4444; padding: 1rem;">Impossible de charger les messages.</p>';
  }
}

function initialiserMessagerieAdmin() {
  const form = document.getElementById('form-admin-envoi-msg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectDest = document.getElementById('admin-select-destinataire-msg');
    const inputTitre = document.getElementById('admin-titre-msg');
    const inputContenu = document.getElementById('admin-contenu-msg');
    const btn = document.getElementById('btn-admin-envoyer-msg');

    const destId = selectDest?.value || 'ALL';
    const destNom = selectDest?.options[selectDest.selectedIndex]?.text || 'Équipe';
    const titre = inputTitre?.value.trim();
    const contenu = inputContenu?.value.trim();

    if (!contenu) return;

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Envoi en cours... ⏳';
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediteur: 'Direction Lou Ame Tay (CEO)',
          destinataire_id: destId,
          titre: titre,
          contenu: contenu,
          type: 'message_direction'
        })
      });

      if (res.ok) {
        afficherToast(\`✓ Message envoyé avec succès à : \${destNom} !\`);
        form.reset();
        await chargerMessagesAdmin();
      } else {
        afficherToast('Erreur envoi message.');
      }
    } catch (err) {
      afficherToast('Erreur réseau.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Envoyer l\\\'instruction ➔';
      }
    }
  });

  chargerMessagesAdmin();
}

function initialiserAissatouCEO() {
  const inputQ = document.getElementById('admin-question-aissatou');
  const btnConsulter = document.getElementById('btn-admin-consulter-aissatou');
  const blocReponse = document.getElementById('admin-reponse-aissatou');

  async function poserQuestion(question) {
    const q = (question || inputQ?.value || '').trim();
    if (!q) return;

    if (btnConsulter) {
      btnConsulter.disabled = true;
      btnConsulter.textContent = 'Analyse... ⏳';
    }
    if (blocReponse) {
      blocReponse.style.display = 'block';
      blocReponse.innerHTML = '<p>👩🏾‍💼 <em>Aissatou consulte le Référentiel Exécutif Fiche 10 & les KPIs du réseau CHR...</em></p>';
    }

    try {
      // Si poserQuestionAissatou est disponible
      let reponseTexte = '';
      if (typeof window.poserQuestionAissatou === 'function') {
        const res = await window.poserQuestionAissatou(q);
        reponseTexte = res.reponse;
      } else {
        // Réponse experte basée sur la Fiche 10
        if (q.toLowerCase().includes('50') || q.toLowerCase().includes('objectif')) {
          reponseTexte = \`**Recommandation Exécutive (Fiche 10) :** Pour convertir 50 restaurants ce mois-ci, concentrer 70% de la force de vente sur l'axe Dakar Plateau & Almadies (formules Xéweul et Nio Far). Mettre en place un challenge commercial avec prime de 25 000 FCFA pour le premier conseiller franchissant 15 signatures certifiées Wave.\`;
        } else if (q.toLowerCase().includes('marge') || q.toLowerCase().includes('rentabilité')) {
          reponseTexte = \`**Analyse de Rentabilité (Fiche 10) :** La formule Nio Far à 65 000 FCFA/an dégage 90% de marge brute pour DAW. Avec une commission commerciale de 6 500 FCFA (10%), le bénéfice net immédiat est de 58 500 FCFA par restaurant dès encaissement.\`;
        } else if (q.toLowerCase().includes('abidjan') || q.toLowerCase().includes('expansion')) {
          reponseTexte = \`**Feuille de Route Expansion (Fiche 10) :** Abidjan représente un potentiel de plus de 6 000 maquis et restaurants modernes (Cocody, Plateau, Zone 4). Le déploiement de la Phase 2 en S2 2026 doit intégrer l'interfaçage Wave CI et Orange Money CI avec un modèle de partenariat local.\`;
        } else {
          reponseTexte = \`**Note Stratégique Aissatou :** Direction, pour la question « \${q} », nos directives prévoient la priorisation de la proximité relationnelle et l'exigence d'une preuve Wave pour toute libération de commission. Consultez la Fiche 10 pour le détail exécutif.\`;
        }
      }

      if (blocReponse) {
        blocReponse.innerHTML = \`<div style="font-weight: 700; color: #0B1F3A; margin-bottom: 6px;">👩🏾‍💼 Aissatou (Directrice Stratégie CHR) :</div><div>\${reponseTexte}</div>\`;
      }
    } catch (err) {
      if (blocReponse) blocReponse.innerHTML = '<p style="color: #EF4444;">Erreur consultation Aissatou.</p>';
    } finally {
      if (btnConsulter) {
        btnConsulter.disabled = false;
        btnConsulter.textContent = 'Consulter';
      }
    }
  }

  btnConsulter?.addEventListener('click', () => poserQuestion());
  inputQ?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      poserQuestion();
    }
  });

  document.querySelectorAll('.btn-prompt-rapide-ceo').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-q');
      if (inputQ) inputQ.value = prompt;
      poserQuestion(prompt);
    });
  });
}

// Initialisations globales pour admin
window.chargerMessagesAdmin = chargerMessagesAdmin;

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialiserMessagerieAdmin();
      initialiserAissatouCEO();
    });
  } else {
    initialiserMessagerieAdmin();
    initialiserAissatouCEO();
  }
}
`;

if (!code.includes('initialiserMessagerieAdmin')) {
  code = code + '\n' + codeAjout;
  fs.writeFileSync(path, code, 'utf8');
  console.log('✅ js/admin.js enrichi avec Messagerie & Aissatou CEO !');
} else {
  console.log('js/admin.js contient déjà ces fonctionnalités.');
}
