-- ==============================================================================
-- LOU AME TAY — FICHIER 4 : DONNEES INITIALES & DEMONSTRATION (04_seed.sql)
-- ==============================================================================
-- Insère les 4 conseillers terrain officiels, des leads d'exemple et des statistiques initiales

-- 1. Nettoyage préventif pour idempotence
DELETE FROM public.commerciaux WHERE email IN (
  'mamadou@louametay.com',
  'cheikh.ndiaye@louametay.com',
  'fatou.sow@louametay.com',
  'moussa.ba@louametay.com'
);

-- 2. Insertion des 4 commerciaux terrain
INSERT INTO public.commerciaux (
  id, prenom, nom, poste, categorie, telephone, email, whatsapp, photo_url, bio, zone,
  multi_cartes, linkedin, facebook, instagram, tiktok, langue_preferee, actif
)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Mamadou',
  'Diallo',
  'Directeur Commercial & Grands Comptes',
  'Direction',
  '+221771303678',
  'mamadou@louametay.com',
  '221762312003',
  'images/commercial1.jpg',
  'Spécialiste de la transformation digitale CHR au Sénégal. J''accompagne les propriétaires et gérants dans l''automatisation de la prise de commande à table, la réduction des temps d''attente et l''optimisation de leur marge.',
  'Dakar (Plateau, Almadies, Point E) & Thiès',
  '[{"titre": "Directeur Commercial", "division": "Siège"}, {"titre": "Chargé Grands Comptes", "division": "Hôtellerie"}]'::jsonb,
  'https://linkedin.com/in/mamadou-diallo-louametay',
  'https://facebook.com/louametay.officiel',
  'https://instagram.com/louametay_sn',
  'https://tiktok.com/@louametay_digital',
  'fr',
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  'Cheikh',
  'Ndiaye',
  'Responsable Déploiement Terrain & Formations',
  'Technique',
  '+221785123456',
  'cheikh.ndiaye@louametay.com',
  '221762312003',
  'images/commercial2.jpg',
  'Ingénieur d''affaires CHR. J''assure l''audit technique de votre établissement, l''installation des écrans cuisine (KDS) et la formation de votre brigade pour une adoption fluide en moins de 48h.',
  'Axe Dakar — Thiès — Mbour — Saly Portudal',
  '[{"titre": "Expert KDS", "division": "Technique"}]'::jsonb,
  'https://linkedin.com/in/cheikh-ndiaye-louametay',
  'https://facebook.com/louametay.officiel',
  'https://instagram.com/cheikh_louametay',
  'https://tiktok.com/@louametay_digital',
  'wo',
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  'Fatou',
  'Sow',
  'Conseillère Commerciale Restauration & Maquis',
  'Vente',
  '+221763407890',
  'fatou.sow@louametay.com',
  '221762312003',
  'images/commercial3.jpg',
  'Spécialiste des formules Tàmbali et Nio Far dédiées aux restaurants de quartier, glaciers, fast-foods et cafés. Je vous démontre comment augmenter votre panier moyen de +25% grâce au menu QR code et aux paiements Wave & Orange Money.',
  'Thiès (Dixième, Cité Lamy, Randoulène) & Dakar Banlieue',
  '[{"titre": "Conseillère Vente", "division": "Terrain"}]'::jsonb,
  'https://linkedin.com/in/fatou-sow-louametay',
  'https://facebook.com/louametay.officiel',
  'https://instagram.com/fatou_louametay',
  'https://tiktok.com/@fatousow_restau',
  'fr',
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  'Moussa',
  'Ba',
  'Chargé d''Affaires Hôtellerie & Support Client',
  'Support',
  '+221776543210',
  'moussa.ba@louametay.com',
  '221762312003',
  'images/commercial4.jpg',
  'Expert des solutions multisites pour resorts, hôtels de plage et complexes touristiques (commande en chambre, room-service QR, transats piscine et intégration caisse).',
  'Petite Côte, Saly, Somone, Toubab Dialaw & Dakar',
  '[{"titre": "Chargé Support", "division": "Hôtellerie"}]'::jsonb,
  'https://linkedin.com/in/moussa-ba-louametay',
  'https://facebook.com/louametay.officiel',
  'https://instagram.com/louametay_hotels',
  '',
  'fr',
  true
);

-- 3. Insertion de prospects (leads) de démonstration
INSERT INTO public.leads (commercial_id, restaurant_nom, prospect_nom, telephone, ville, formule, message, statut, score, source)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Le Teranga Lounge',
  'M. Babacar Fall',
  '+221775432109',
  'Dakar (Almadies)',
  'Xéweul',
  'Souhaite équiper 24 tables et installer 2 écrans cuisine avant la fin du mois.',
  'nouveau',
  85,
  'carte_qr'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Hôtel Club Safari',
  'Mme Aïda Diop',
  '+221781234567',
  'Saly Portudal',
  'Sur Mesure',
  'Intégration complexe avec le room service et les tables du restaurant de plage.',
  'contacté',
  95,
  'carte_qr'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Café Randoulène Express',
  'M. Ousmane Seck',
  '+221762345678',
  'Thiès',
  'Nio Far',
  'Besoin d''automatiser les commandes des serveurs aux heures de pointe du midi.',
  'converti',
  75,
  'carte_qr'
);

-- 4. Insertion d'analytics journalières pour les graphiques
INSERT INTO public.analytics_daily (date, commercial_id, nb_scans, nb_leads, nb_appels, nb_whatsapp, nb_partages)
VALUES
(CURRENT_DATE - INTERVAL '3 days', '11111111-1111-1111-1111-111111111111', 28, 3, 5, 8, 4),
(CURRENT_DATE - INTERVAL '2 days', '11111111-1111-1111-1111-111111111111', 34, 4, 7, 12, 6),
(CURRENT_DATE - INTERVAL '1 day',  '11111111-1111-1111-1111-111111111111', 42, 6, 9, 15, 9),
(CURRENT_DATE,                     '11111111-1111-1111-1111-111111111111', 19, 2, 4, 7, 3),

(CURRENT_DATE - INTERVAL '3 days', '22222222-2222-2222-2222-222222222222', 18, 2, 3, 5, 2),
(CURRENT_DATE - INTERVAL '2 days', '22222222-2222-2222-2222-222222222222', 25, 3, 6, 9, 5),
(CURRENT_DATE - INTERVAL '1 day',  '22222222-2222-2222-2222-222222222222', 31, 5, 8, 11, 7),
(CURRENT_DATE,                     '22222222-2222-2222-2222-222222222222', 14, 1, 3, 6, 2)
ON CONFLICT (commercial_id, date) DO NOTHING;
