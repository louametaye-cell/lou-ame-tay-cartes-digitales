const fs = require('fs');

const path = 'js/commercial.js';
let content = fs.readFileSync(path, 'utf8');

const search = `      try {
        const { error } = await supabase
          .from('leads')
          .insert([{
            commercial_id: commercialConnecte.id,
            restaurant_nom: resto,
            prospect_nom: nom,
            telephone: tel,
            ville: ville,
            formule: formule,
            message: message,
            source: 'Terrain — Espace Commercial',
            statut: 'NOUVEAU',
            score: 75
          }]);

        if (error) throw error;`;

const replacement = `      const payloadProspect = {
        commercial_id: commercialConnecte?.id || null,
        restaurant_nom: resto,
        prospect_nom: nom,
        telephone: tel,
        ville: ville,
        formule: formule,
        message: message,
        source: 'Terrain — Espace Commercial',
        statut: 'nouveau',
        score: 75
      };

      let enregistre = false;
      let erreurMessage = '';

      // TENTATIVE 1 : Route Serverless /api/leads
      try {
        const resApi = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadProspect)
        });
        if (resApi.ok) {
          enregistre = true;
        } else {
          const errData = await resApi.json().catch(() => ({}));
          erreurMessage = errData.error || ('HTTP ' + resApi.status);
        }
      } catch (errApi) {
        console.warn('API /api/leads non accessible, tentative directe...', errApi);
      }

      // TENTATIVE 2 : Insertion directe Supabase si l'API est absente
      if (!enregistre) {
        try {
          const { error: errDirect } = await supabase
            .from('leads')
            .insert([payloadProspect]);
          if (!errDirect) {
            enregistre = true;
          } else {
            erreurMessage = errDirect.message || erreurMessage;
          }
        } catch (errSub) {
          erreurMessage = errSub.message || erreurMessage;
        }
      }

      // TENTATIVE 3 : Mode Hors-Ligne local si coupure totale
      if (!enregistre) {
        try {
          const leadsHorsLigne = JSON.parse(localStorage.getItem('LOUAMETAY_LEADS_OFFLINE') || '[]');
          leadsHorsLigne.push({ ...payloadProspect, id: 'offline_' + Date.now(), created_at: new Date().toISOString() });
          localStorage.setItem('LOUAMETAY_LEADS_OFFLINE', JSON.stringify(leadsHorsLigne));
          enregistre = true;
          afficherToast('📱 Mode Hors-Ligne : Prospect sauvegardé dans votre téléphone. Il sera synchronisé dès le retour du réseau !', 8000);
        } catch (errLocal) {}
      }

      try {
        if (!enregistre) throw new Error(erreurMessage || 'Erreur enregistrement prospect');`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedSearch = search.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedSearch)) {
  const updated = normalizedContent.replace(normalizedSearch, replacement);
  fs.writeFileSync(path, updated, 'utf8');
  console.log('✅ Fix prospect appliqué avec succès dans js/commercial.js');
} else {
  console.error('❌ Motif de recherche non trouvé');
}
