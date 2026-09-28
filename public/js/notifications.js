/**
 * ==============================================================================
 * FICHIER : js/notifications.js
 * NOTIFICATIONS COMMERCIALES ET ALERTES WHATSAPP AUTOMATIQUES
 * ==============================================================================
 * - notifierCommercial(lead, commercial) : déclenche l'alerte temps réel
 * - genereLienWhatsAppConseiller(lead, commercial) : formate le message prêt à envoyer
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';

/**
 * Notifie le commercial d'un nouveau lead via Edge Function ou WhatsApp direct
 * @param {Object} lead - { restaurant_nom, prospect_nom, telephone, ville, formule, message, score }
 * @param {Object} commercial - { prenom, nom, whatsapp }
 */
export async function notifierCommercial(lead, commercial) {
  // 1. Construction du message de notification officiel
  const scoreTxt = lead.score ? `${lead.score}/100` : 'Non calculé';
  const telProspect = lead.telephone ? lead.telephone.replace(/\D/g, '') : '';
  const lienWAProspect = telProspect ? `https://wa.me/${telProspect}` : '';

  const messageFormat = 
    `🔔 *NOUVEAU LEAD LOU AME TAY !*\n\n` +
    `🍽️ *Établissement :* ${lead.restaurant_nom || 'Non précisé'}\n` +
    `👤 *Prospect :* ${lead.prospect_nom} (${lead.telephone})\n` +
    `📍 *Zone :* ${lead.ville || 'Sénégal'}\n` +
    `📋 *Formule :* ${lead.formule || 'Non définie'}\n` +
    `⚡ *Score d'urgence :* ${scoreTxt}\n` +
    (lead.message ? `💬 *Besoin :* "${lead.message}"\n` : '') +
    (lienWAProspect ? `\n📲 *Contacter le prospect :* ${lienWAProspect}` : '');

  // 2. Appel asynchrone à l'Edge Function Supabase 'notify-whatsapp' si configurée
  if (estSupabaseConfigure()) {
    try {
      await supabase.functions.invoke('notify-whatsapp', {
        body: {
          lead,
          commercial,
          message: messageFormat
        }
      });
    } catch (err) {
      console.debug('Notification Edge Function en attente de déploiement :', err);
    }
  }

  // 3. Retourne l'URL WhatsApp web directe pour le commercial
  const telCommercial = (commercial.whatsapp || '221762312003').replace(/\D/g, '');
  return `https://wa.me/${telCommercial}?text=${encodeURIComponent(messageFormat)}`;
}

/**
 * Génère le lien WhatsApp client -> commercial pour la soumission d'une demande
 */
export function genererLienWhatsAppClient(lead, commercial) {
  const telCommercial = (commercial.whatsapp || '221762312003').replace(/\D/g, '');
  const texte = 
    `Bonjour ${commercial.prenom},\n\n` +
    `Je souhaite des informations sur Lou Ame Tay pour mon établissement :\n` +
    `• Restaurant : ${lead.restaurant_nom}\n` +
    `• Responsable : ${lead.prospect_nom} (${lead.telephone})\n` +
    `• Localisation : ${lead.ville}\n` +
    `• Formule souhaitée : ${lead.formule}\n` +
    (lead.message ? `• Remarque : ${lead.message}\n` : '') +
    `\nPouvez-vous me recontacter pour une démonstration ?`;

  return `https://wa.me/${telCommercial}?text=${encodeURIComponent(texte)}`;
}
