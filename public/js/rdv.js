/**
 * ==============================================================================
 * FICHIER : js/rdv.js
 * SPRINT B2 : PRISE DE RENDEZ-VOUS EN LIGNE 7 JOURS & GOOGLE CALENDAR
 * ==============================================================================
 */

import { supabase } from './supabase-client.js';

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast-notification visible ${type === 'error' ? 'toast-erreur' : ''}`;
  setTimeout(() => {
    toast.className = 'toast-notification';
  }, 4000);
}

let dateSelectionneeRdv = null;

export async function ouvrirRdv(commercial) {
  const modal = document.getElementById('modal-rdv');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Générer les 7 prochains jours
  const joursContainer = document.getElementById('jours-rdv');
  const creneauxContainer = document.getElementById('creneaux-rdv');
  if (!joursContainer) return;

  joursContainer.innerHTML = '';
  if (creneauxContainer) creneauxContainer.innerHTML = '';

  const dispo = commercial.disponibilites || {
    lundi: ['09:30', '11:00', '14:30', '16:00'],
    mardi: ['09:30', '11:00', '14:30', '16:00'],
    mercredi: ['09:30', '11:00', '14:30', '16:00'],
    jeudi: ['09:30', '11:00', '14:30', '16:00'],
    vendredi: ['09:30', '11:00', '15:00'],
    samedi: ['10:00', '14:00']
  };

  const nomsJours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const jourNom = nomsJours[date.getDay()];
    const creneaux = dispo[jourNom] || [];
    if (creneaux.length === 0) continue;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-jour-rdv';
    btn.textContent = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    btn.onclick = () => {
      joursContainer.querySelectorAll('.btn-jour-rdv').forEach(b => b.classList.remove('actif'));
      btn.classList.add('actif');
      afficherCreneaux(date, creneaux, commercial.id);
    };
    joursContainer.appendChild(btn);

    // Sélectionner automatiquement le premier jour disponible
    if (i === 1) {
      btn.classList.add('actif');
      afficherCreneaux(date, creneaux, commercial.id);
    }
  }

  // Écouteur pour fermer le modal
  const btnFermer = document.getElementById('btn-fermer-modal-rdv');
  btnFermer?.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

export function afficherCreneaux(date, creneaux, commercialId) {
  dateSelectionneeRdv = new Date(date);
  const container = document.getElementById('creneaux-rdv');
  if (!container) return;

  container.innerHTML = '<p style="font-size: 13px; font-weight: 700; color: #0B1F3A; margin: 10px 0 6px;">Choisissez un créneau horaire :</p>';
  const grid = document.createElement('div');
  grid.className = 'grille-creneaux-boutons';

  creneaux.forEach(h => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-creneau-rdv';
    btn.textContent = h;
    btn.onclick = () => {
      grid.querySelectorAll('.btn-creneau-rdv').forEach(b => b.classList.remove('actif'));
      btn.classList.add('actif');
      confirmerRdv(dateSelectionneeRdv, h, commercialId);
    };
    grid.appendChild(btn);
  });

  container.appendChild(grid);
}

export async function confirmerRdv(date, heure, commercialId) {
  const form = document.getElementById('form-rdv');
  if (!form) return;

  // Si le formulaire n'a pas encore été validé par soumission, on stocke la sélection
  form.dataset.dateHeure = `${date.toISOString()}|${heure}`;
  showToast(`Créneau ${heure} sélectionné. Complétez vos coordonnées ci-dessous.`, 'success');
}

export async function finaliserRdvFormulaire(commercial) {
  const form = document.getElementById('form-rdv');
  if (!form) return;

  const dataHeureStr = form.dataset.dateHeure;
  const dateBase = dataHeureStr ? new Date(dataHeureStr.split('|')[0]) : new Date();
  const heure = dataHeureStr ? dataHeureStr.split('|')[1] : '10:00';

  const data = Object.fromEntries(new FormData(form));
  const [h, m] = heure.split(':');
  dateBase.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

  try {
    const { error } = await supabase.from('rendez_vous').insert({
      commercial_id: commercial.id,
      nom_prospect: data.nom,
      telephone_prospect: data.telephone,
      restaurant_prospect: data.restaurant || null,
      date_rdv: dateBase.toISOString(),
      type_rdv: data.type_rdv || 'demo'
    });

    if (error) {
      console.warn('Erreur insertion rendez_vous:', error);
    }

    // Lien Google Calendar pré-rempli
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent('RDV Démo Lou Ame Tay — ' + data.nom)}` +
      `&dates=${formatGCal(dateBase, 30)}` +
      `&details=${encodeURIComponent('Démonstration Lou Ame Tay avec ' + data.nom + ' (' + data.telephone + ')' + (data.restaurant ? ' — ' + data.restaurant : ''))}`;

    // Notification WhatsApp au commercial
    const msgWA = encodeURIComponent(
      `📅 NOUVEAU RENDEZ-VOUS DÉMO LOU AME TAY !\n\n` +
      `👤 Contact : ${data.nom}\n` +
      `📞 Téléphone : ${data.telephone}\n` +
      (data.restaurant ? `🏢 Établissement : ${data.restaurant}\n` : '') +
      `🗓️ Date : ${dateBase.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}\n` +
      `📌 Type : ${data.type_rdv || 'Démo'}`
    );
    window.open(`https://wa.me/221762312003?text=${msgWA}`, '_blank');

    setTimeout(() => {
      window.open(gcalUrl, '_blank');
    }, 400);

    showToast('✅ RDV confirmé ! Calendrier et WhatsApp ouverts.', 'success');
    document.getElementById('modal-rdv')?.classList.add('hidden');
    form.reset();
  } catch (err) {
    console.error('Erreur confirmation RDV:', err);
    showToast('❌ Erreur technique. Réessayez.', 'error');
  }
}

function formatGCal(date, dureeMinutes = 30) {
  const fin = new Date(date.getTime() + dureeMinutes * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  return `${formatDate(date)}/${formatDate(fin)}`;
}
