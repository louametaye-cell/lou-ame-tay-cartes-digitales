/**
 * ==========================================================================
 * FICHIER : js/charts-admin.js
 * MODULE GRAPHIQUES POUR LE DASHBOARD CEO — LOU AME TAY
 * Charte : #0B1F3A (marine), #C9A227 (doré), #10B981 (vert), #FFFFFF
 * ==========================================================================
 */

let chartLeads30JInstance = null;

/**
 * Construit et actualise le graphique d'évolution des leads sur 30 jours
 * @param {string} canvasId - L'ID de l'élément canvas
 * @param {Array} leads - Liste des leads chargée depuis Supabase
 */
export function initialiserGraphiqueLeads30Jours(canvasId, leads = []) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js n\'est pas encore chargé.');
    return;
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (chartLeads30JInstance) {
    chartLeads30JInstance.destroy();
  }

  // Calcul des 30 derniers jours
  const labels = [];
  const counts = [];
  const aujourdhui = new Date();

  // Création du dictionnaire de dates 'YYYY-MM-DD'
  const statsParJour = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(aujourdhui.getDate() - i);
    const cle = d.toISOString().slice(0, 10);
    statsParJour[cle] = 0;
    // Format français '12 mai'
    labels.push(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
  }

  // Remplissage avec les données réelles
  leads.forEach(lead => {
    if (lead.created_at) {
      const dateLead = new Date(lead.created_at).toISOString().slice(0, 10);
      if (statsParJour[dateLead] !== undefined) {
        statsParJour[dateLead]++;
      }
    }
  });

  // Injection des valeurs ordonnées
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(aujourdhui.getDate() - i);
    const cle = d.toISOString().slice(0, 10);
    counts.push(statsParJour[cle]);
  }

  // Création du gradient de remplissage
  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(201, 162, 39, 0.45)');
  gradient.addColorStop(1, 'rgba(201, 162, 39, 0.02)');

  chartLeads30JInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Demandes de devis (Leads)',
        data: counts,
        borderColor: '#C9A227',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#0B1F3A',
        pointBorderColor: '#C9A227',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { family: 'Poppins', size: 11, weight: '600' },
            color: '#0B1F3A'
          }
        },
        tooltip: {
          backgroundColor: '#0B1F3A',
          titleFont: { family: 'Poppins', size: 12, weight: '700' },
          bodyFont: { family: 'Poppins', size: 12 },
          borderColor: '#C9A227',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} lead${ctx.parsed.y > 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxTicksLimit: 10,
            font: { family: 'Poppins', size: 10 },
            color: '#64748B'
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(...counts, 4),
          grid: { color: 'rgba(226, 232, 240, 0.6)' },
          ticks: {
            stepSize: 1,
            font: { family: 'Poppins', size: 10 },
            color: '#64748B'
          }
        }
      }
    }
  });

  return chartLeads30JInstance;
}
