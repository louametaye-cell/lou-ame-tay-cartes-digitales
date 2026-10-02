/**
 * ==============================================================================
 * FICHIER : nextjs-app/lib/utils/whatsapp-pitch.ts
 * COPILOT PROSPECTION WHATSAPP B2B CHR SÉNÉGAL (NEXT.JS / TYPESCRIPT)
 * ==============================================================================
 */

export interface PitchParams {
  nomRestaurant: string;
  nomGerant?: string;
  nomCommercial?: string;
  telCommercial?: string;
  matricule?: string;
}

export interface ModelePitch {
  id: string;
  nom: string;
  cibles: string;
  icone: string;
  accroche: string;
  genererTexte: (params: PitchParams) => string;
}

export const MODELES_PITCH_SENEGAL: ModelePitch[] = [
  {
    id: 'LOUNGE_PRESTIGE',
    nom: '🍸 Lounge, Bar & Restaurant Gastronomique',
    cibles: 'Almadies, Plateau, Point E, Ngor, Saly Prestige',
    icone: '🍸',
    accroche: 'Standing haut de gamme & Commande VIP sur table',
    genererTexte: ({ nomRestaurant, nomGerant, nomCommercial, telCommercial, matricule }) => {
      const salutation = nomGerant ? `Bonjour M./Mme ${nomGerant}` : 'Bonjour cher gérant';
      return `As-salamu alaykum, ${salutation}.

C'est ${nomCommercial || 'un conseiller Lou Ame Tay'}, nous venons d'échanger au sujet de votre prestigieux établissement *${nomRestaurant || 'votre restaurant'}*.

Comme convenu, découvrez la version digitale exclusive que nous proposons aux grandes tables de Dakar :
👉 *Démonstration interactive sur votre téléphone :*
https://louametay.online/carte?demo=true&source=wa&com=${matricule || 'LAT2026'}

✨ *Les avantages clés pour votre standing :*
• Supports QR codes gravés sur bois noble ou plexiglas luxe posés sur chaque table.
• Vos clients commandent leurs cocktails et plats sans attendre le serveur.
• Paiement direct Wave & Orange Money à table, sans manipulation d'espèces.

Je reste à votre entière disposition au ${telCommercial || '+221 77 458 74 74'} pour configurer votre essai personnalisé dès cette semaine.

Excellente journée et plein succès à toute votre équipe ! 🌟`;
    }
  },
  {
    id: 'FAST_FOOD_SNACK',
    nom: '🍔 Fast-Food, Snack Urbain & Pizzeria',
    cibles: 'Dakar Plateau, Mermoz, Liberté 6, Thiès Centre',
    icone: '⚡',
    accroche: 'Zéro file d’attente à midi & Vitesse de service',
    genererTexte: ({ nomRestaurant, nomGerant, nomCommercial, telCommercial, matricule }) => {
      const salutation = nomGerant ? `Bonjour M./Mme ${nomGerant}` : 'Bonjour cher gérant';
      return `Bonjour ${salutation} de *${nomRestaurant || 'votre établissement'}*,

Ici ${nomCommercial || 'le conseiller Lou Ame Tay'}. Merci pour notre échange rapide ce midi !

Aux heures de pointe (12h-14h et le soir), chaque seconde compte. Notre solution vous permet de servir 30% de clients en plus sans embaucher :
👉 *Voyez comment vos clients commandent en 10 secondes :*
https://louametay.online/carte?demo=true&type=fastfood&com=${matricule || 'LAT2026'}

🚀 *Pourquoi nos snacks partenaires l'ont adopté :*
• Commande immédiate au comptoir ou sur table par simple scan QR.
• La commande part directement sur l'écran en cuisine (zéro papier égaré).
• Encaissement ultra-rapide Wave / Orange Money / Espèces.

On peut installer votre borne digitale en moins de 24 heures !
Appelez-moi directement au ${telCommercial || '+221 77 458 74 74'}. 🍔🍟`;
    }
  },
  {
    id: 'DIBITERIE_TRADITIONNEL',
    nom: '🥩 Dibiterie, Grillades & Restaurant Sénégalais',
    cibles: 'Spécialités Agneau, Thiéboudienne, Yassa, Mafé — Partout au Sénégal',
    icone: '🔥',
    accroche: 'Contrôle des portions, zéro plat brûlé & additions exactes',
    genererTexte: ({ nomRestaurant, nomGerant, nomCommercial, telCommercial, matricule }) => {
      const salutation = nomGerant ? `Borom ${nomRestaurant}` : 'Cher partenaire';
      return `As-salamu alaykum ${salutation},

C'est ${nomCommercial || 'votre conseiller Lou Ame Tay'}. Merci beaucoup pour l'accueil chaleureux aujourd'hui chez *${nomRestaurant || 'vous'}*.

Dans la grillade et la restauration rapide sénégalaise, les erreurs de commande et les disputes sur les additions font perdre de l'argent :
👉 *Regardez la simplicité de la commande sur téléphone :*
https://louametay.online/carte?demo=true&type=grill&com=${matricule || 'LAT2026'}

🔥 *Ce que Lou Ame Tay règle immédiatement :*
• Vos clients voient exactement le prix du kilo / demi-kilo de viande et des accompagnements (alloco, oignons, frites).
• Le grillardin reçoit les commandes clairement sans crier en cuisine.
• L'addition est calculée au franc près : fini les pertes de caisse en fin de soirée.

Je repasse vous faire la démonstration complète quand vous le souhaitez.
Contact direct : ${telCommercial || '+221 77 458 74 74'}. Diërëdieuf ! 🙏`;
    }
  },
  {
    id: 'HOTEL_CAMPEMENT',
    nom: '🏖️ Hôtel, Résidence & Campement Écotouristique',
    cibles: 'Saly Portudal, Somone, Toubab Dialaw, Sine Saloum, Saint-Louis',
    icone: '🌊',
    accroche: 'Commande sur transats, piscine & chambres (Multilingue)',
    genererTexte: ({ nomRestaurant, nomGerant, nomCommercial, telCommercial, matricule }) => {
      const salutation = nomGerant ? `Bonjour M./Mme ${nomGerant}` : 'Bonjour cher Directeur';
      return `Bonjour ${salutation} de *${nomRestaurant || 'votre établissement'}*,

C'est ${nomCommercial || 'votre conseiller digital Lou Ame Tay'}.

Pour vos clients au bord de la piscine, sur les transats de plage ou en chambre, le confort du digital fait toute la différence :
👉 *Découvrez l'expérience client sans se déplacer :*
https://louametay.online/carte?demo=true&type=resort&com=${matricule || 'LAT2026'}

🌴 *Idéal pour les séjours & la détente :*
• Vos résidents scannent le QR code posé sur leur transat ou table basse et commandent leurs rafraîchissements.
• La carte s'affiche automatiquement en Français, Anglais et Wolof.
• Paiement direct Wave, Orange Money ou facturation sur la chambre.

Je serais ravi d'équiper vos espaces extérieurs avant le week-end.
Restons en contact au ${telCommercial || '+221 77 458 74 74'} ! 🏖️🍹`;
    }
  }
];

export function formaterTelephoneSenegal(telephone: string): string {
  if (!telephone) return '';
  let clean = telephone.replace(/[^0-9]/g, '');

  if (clean.startsWith('00221')) clean = clean.substring(2);
  else if (clean.startsWith('221') && clean.length === 12) {
    // Correct
  } else if (clean.length === 9) {
    clean = `221${clean}`;
  }

  return clean;
}

export function genererLienWhatsApp(telephone: string, messageTexte: string): string {
  const telFormate = formaterTelephoneSenegal(telephone);
  const texteEncode = encodeURIComponent(messageTexte.trim());

  if (telFormate) {
    return `https://wa.me/${telFormate}?text=${texteEncode}`;
  }
  return `https://wa.me/?text=${texteEncode}`;
}
