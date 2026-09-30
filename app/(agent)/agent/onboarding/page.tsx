'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveStep1Action, saveStep2Action, finalizeContractAction } from '@/actions/onboarding-actions';

interface WizardData {
  // Étape 1
  secondaryEmail: string;
  secondaryPhone: string;
  payoutOperator: 'WAVE' | 'ORANGE_MONEY';
  payoutPhone: string;
  payoutAccountName: string;
  cniNumber: string;
  cniFrontUrl: string;
  cniBackUrl: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  transportMode: 'MOTO_SCOOTER' | 'VEHICULE_PERSO' | 'TRANSPORT_COMMUN';
  assignedTerritory: string;

  // Étape 2
  avatarUrl: string;
  jobTitle: string;
  linkedinUrl: string;
  whatsappDirectUrl: string;

  // Étape 3
  signatureDataUrl: string;
  agreed: boolean;
}

const ZONES_TERRAIN = [
  'Dakar Plateau & Centre des Affaires',
  'Dakar Almadies, Ngor & Ouakam',
  'Dakar Yoff, VDN & Nord Foire',
  'Thiès Centre & Grand Standing',
  'Saly Portudal & Mbour Petite Côte',
  'Saint-Louis & Vallée du Fleuve',
  'Touba & Mbacké',
  'Casamance (Ziguinchor & Cap Skirring)',
  'Sine Saloum (Kaolack & Fatick)',
];

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // État global des données du formulaire Wizard
  const [formData, setFormData] = useState<WizardData>({
    secondaryEmail: '',
    secondaryPhone: '',
    payoutOperator: 'WAVE',
    payoutPhone: '',
    payoutAccountName: '',
    cniNumber: '',
    cniFrontUrl: '',
    cniBackUrl: '',
    emergencyName: '',
    emergencyRelation: 'Parent',
    emergencyPhone: '',
    transportMode: 'MOTO_SCOOTER',
    assignedTerritory: 'Dakar Plateau & Centre des Affaires',
    avatarUrl: '/images/commercial1.jpg',
    jobTitle: 'Conseiller Digital CHR',
    linkedinUrl: '',
    whatsappDirectUrl: '',
    signatureDataUrl: '',
    agreed: false,
  });

  // Gestion du Canvas tactile de signature pour l'étape 3
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contractScrollRef = useRef<HTMLDivElement | null>(null);

  // Ref des inputs photos Étape 2 (Caméra directe vs Galerie)
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Gestion du défilement du contrat à l'étape 3
  const handleContractScroll = () => {
    if (!contractScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contractScrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0B1F3A';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Upload d'image helper (Convertit en data URL ou upload Supabase)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'cniFrontUrl' | 'cniBackUrl' | 'avatarUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData(prev => ({ ...prev, [targetField]: result }));
    };
    reader.readAsDataURL(file);
  };

  // Validation Étape 1
  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.cniNumber || formData.cniNumber.length < 8) {
      setErrorMessage('Numéro de CNI valide obligatoire.');
      return;
    }
    if (!formData.payoutPhone || formData.payoutPhone.length < 9) {
      setErrorMessage('Numéro Mobile Money (Wave ou Orange Money) requis.');
      return;
    }
    if (!formData.payoutAccountName) {
      setErrorMessage('Nom du titulaire Mobile Money requis pour éviter les erreurs de virement.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveStep1Action(formData);
      if (res.success) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(res.error || 'Erreur lors de la validation.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation Étape 2
  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.avatarUrl) {
      setErrorMessage('Photo de profil requise pour votre carte digitale.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveStep2Action({
        avatarUrl: formData.avatarUrl,
        jobTitle: formData.jobTitle,
        linkedinUrl: formData.linkedinUrl,
        whatsappDirectUrl: formData.whatsappDirectUrl,
      });
      if (res.success) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(res.error || 'Erreur lors de la sauvegarde.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation Finale Étape 3 (Signature & Scellage)
  const submitStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      setErrorMessage('Veuillez apposer votre signature tactile avant de valider.');
      return;
    }

    if (!formData.agreed) {
      setErrorMessage('Veuillez cocher la case d’accord pour accepter les 9 articles du contrat.');
      return;
    }

    const signatureDataUrl = canvas.toDataURL('image/png');
    setIsSubmitting(true);

    try {
      const res = await finalizeContractAction({
        signatureDataUrl,
        agreed: formData.agreed,
      });

      if (res.success) {
        alert('🎉 Félicitations ! Votre compte commercial est désormais activé.');
        router.push('/commercial');
      } else {
        setErrorMessage(res.error || 'Erreur lors du scellage du contrat.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la finalisation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1F3A] py-8 px-4 flex flex-col items-center justify-center font-sans text-slate-800">
      
      {/* Conteneur Carte Principale */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* En-tête Lou Ame Tay */}
        <header className="bg-gradient-to-r from-[#0B1F3A] to-[#17375E] text-white p-6 text-center border-b-2 border-[#C9A227]">
          <span className="inline-block bg-[#C9A227]/20 border border-[#C9A227] text-[#F8E294] text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            Onboarding Conseiller Commercial • Droit Sénégalais
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Activation de votre Espace Commercial 🚀
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Complétez les 3 étapes obligatoires pour débloquer votre CRM, vos commissions et votre carte digitale.
          </p>

          {/* Stepper / Barre de Progression 3 Étapes */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
            
            {/* Étape 1 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentStep === 1 
                ? 'bg-[#C9A227] text-[#0B1F3A] shadow-md' 
                : currentStep > 1 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-700/60 text-slate-400'
            }`}>
              <span>{currentStep > 1 ? '✓' : '1'}</span>
              <span className="hidden sm:inline">Coordonnées & KYC</span>
            </div>

            <span className="text-slate-500 font-bold">➔</span>

            {/* Étape 2 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentStep === 2 
                ? 'bg-[#C9A227] text-[#0B1F3A] shadow-md' 
                : currentStep > 2 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-700/60 text-slate-400'
            }`}>
              <span>{currentStep > 2 ? '✓' : '2'}</span>
              <span className="hidden sm:inline">Ma Carte Digitale</span>
            </div>

            <span className="text-slate-500 font-bold">➔</span>

            {/* Étape 3 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentStep === 3 
                ? 'bg-[#C9A227] text-[#0B1F3A] shadow-md' 
                : 'bg-slate-700/60 text-slate-400'
            }`}>
              <span>3</span>
              <span className="hidden sm:inline">Contrat & Signature</span>
            </div>

          </div>
        </header>

        {/* Message d'erreur dynamique */}
        {errorMessage && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 m-4 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-extrabold text-sm">✕</button>
          </div>
        )}

        <div className="p-6 sm:p-8">
          
          {/* ====================================================================
              ÉTAPE 1 : COORDONNÉES, SÉCURITÉ RH & LOGISTIQUE TERRAIN
              ==================================================================== */}
          {currentStep === 1 && (
            <form onSubmit={submitStep1} className="space-y-6">
              
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                  <span>📱 1. Contacts de Secours & Ligne de Versement</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Définissez la ligne certifiée où seront versées vos commissions de 10% instantanées.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email secondaire / Récupération</label>
                  <input
                    type="email"
                    value={formData.secondaryEmail}
                    onChange={e => setFormData({ ...formData, secondaryEmail: e.target.value })}
                    placeholder="secours@gmail.com"
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone secondaire (Orange, Free, Expresso) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.secondaryPhone}
                    onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })}
                    placeholder="78 000 00 00"
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                  />
                </div>
              </div>

              {/* Ligne Mobile Money */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="text-xs font-bold text-slate-800">Ligne de versement des commissions directes :</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Opérateur</label>
                    <select
                      value={formData.payoutOperator}
                      onChange={e => setFormData({ ...formData, payoutOperator: e.target.value as any })}
                      className="w-full text-sm p-3 bg-white border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="WAVE">🌊 Wave</option>
                      <option value="ORANGE_MONEY">🍊 Orange Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Numéro Mobile Money *</label>
                    <input
                      type="tel"
                      required
                      value={formData.payoutPhone}
                      onChange={e => setFormData({ ...formData, payoutPhone: e.target.value })}
                      placeholder="77 458 74 74"
                      className="w-full text-sm p-3 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Titulaire exact du compte *</label>
                    <input
                      type="text"
                      required
                      value={formData.payoutAccountName}
                      onChange={e => setFormData({ ...formData, payoutAccountName: e.target.value })}
                      placeholder="Conforme à la CNI"
                      className="w-full text-sm p-3 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Conformité Légale & KYC */}
              <div className="border-b border-slate-200 pb-3 pt-2">
                <h2 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                  <span>🪪 2. Conformité Légale & Téléversement CNI (KYC)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Loi sénégalaise n° 2008-08 & 2008-12 : Certification d’identité obligatoire pour mandat commercial.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro officiel CNI / CEDEAO ou Passeport *</label>
                <input
                  type="text"
                  required
                  value={formData.cniNumber}
                  onChange={e => setFormData({ ...formData, cniNumber: e.target.value })}
                  placeholder="Ex: 1 756 1998 01429"
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CNI Recto */}
                <div className="border-2 border-dashed border-slate-300 p-4 rounded-xl text-center hover:bg-slate-50 transition-colors">
                  <span className="text-2xl block mb-1">📄</span>
                  <div className="text-xs font-bold text-slate-700">CNI Recto (Face avant)</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileChange(e, 'cniFrontUrl')}
                    className="mt-2 text-xs w-full"
                  />
                  {formData.cniFrontUrl && (
                    <img src={formData.cniFrontUrl} alt="CNI Recto" className="mt-2 h-20 mx-auto object-cover rounded shadow" />
                  )}
                </div>

                {/* CNI Verso */}
                <div className="border-2 border-dashed border-slate-300 p-4 rounded-xl text-center hover:bg-slate-50 transition-colors">
                  <span className="text-2xl block mb-1">📄</span>
                  <div className="text-xs font-bold text-slate-700">CNI Verso (Face arrière)</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileChange(e, 'cniBackUrl')}
                    className="mt-2 text-xs w-full"
                  />
                  {formData.cniBackUrl && (
                    <img src={formData.cniBackUrl} alt="CNI Verso" className="mt-2 h-20 mx-auto object-cover rounded shadow" />
                  )}
                </div>
              </div>

              {/* Contact d'urgence */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact d'urgence (Nom) *</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyName}
                    onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="Moussa Diop"
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lien de parenté *</label>
                  <select
                    value={formData.emergencyRelation}
                    onChange={e => setFormData({ ...formData, emergencyRelation: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Parent">Parent (Père/Mère)</option>
                    <option value="Conjoint">Conjoint(e)</option>
                    <option value="Frere_Soeur">Frère / Sœur</option>
                    <option value="Autre">Proche / Tuteur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone d'urgence *</label>
                  <input
                    type="tel"
                    required
                    value={formData.emergencyPhone}
                    onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="77 000 00 00"
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Logistique & Déplacement */}
              <div className="border-b border-slate-200 pb-3 pt-2">
                <h2 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                  <span>🛵 3. Logistique & Calibrage Terrain</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Paramétrage pour le calcul automatique des frais de déplacement et le ciblage des restaurants.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Moyen de locomotion déclaré *</label>
                  <select
                    value={formData.transportMode}
                    onChange={e => setFormData({ ...formData, transportMode: e.target.value as any })}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="MOTO_SCOOTER">🛵 Moto / Scooter (Recommandé)</option>
                    <option value="VEHICULE_PERSO">🚗 Véhicule Personnel</option>
                    <option value="TRANSPORT_COMMUN">🚌 Transports en Commun (Bus/Taxis)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zone prioritaire d'affectation *</label>
                  <select
                    value={formData.assignedTerritory}
                    onChange={e => setFormData({ ...formData, assignedTerritory: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {ZONES_TERRAIN.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bouton de progression */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0B1F3A] hover:bg-[#17375E] text-[#F8E294] font-black text-sm px-8 py-4 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                >
                  <span>{isSubmitting ? 'Enregistrement...' : 'CONTINUER VERS L’ÉTAPE 2 (CARTE DIGITALE) ➔'}</span>
                </button>
              </div>

            </form>
          )}

          {/* ====================================================================
              ÉTAPE 2 : CARTE DE VISITE DIGITALE CONNECTÉE
              ==================================================================== */}
          {currentStep === 2 && (
            <form onSubmit={submitStep2} className="space-y-6">
              
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                  <span>💳 Personnalisation de votre Carte de Visite Digitale</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Cette carte sera scannée par les gérants de restaurant pour commander et voir votre démo.
                </p>
              </div>

              {/* Double choix Photo : Caméra directe vs Galerie */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <label className="block text-xs font-black uppercase text-[#0B1F3A]">
                  Photo de profil professionnelle HD (Double choix) :
                </label>
                
                {/* Inputs invisibles */}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  ref={cameraInputRef}
                  onChange={e => handleImageFileChange(e, 'avatarUrl')}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryInputRef}
                  onChange={e => handleImageFileChange(e, 'avatarUrl')}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 bg-[#0B1F3A] text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow hover:bg-[#17375E] transition-all"
                  >
                    <span>📷</span>
                    <span>Prendre un selfie direct</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-slate-100 transition-all"
                  >
                    <span>🖼️</span>
                    <span>Choisir depuis la galerie</span>
                  </button>
                </div>
              </div>

              {/* Titre & Réseaux */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titre / Fonction commerciale affichée *</label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="Conseiller Digital CHR"
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lien profil LinkedIn (Optionnel)</label>
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/votre-nom"
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Aperçu interactif en direct de la carte Lou Ame Tay */}
              <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="text-xs font-black uppercase text-[#0B1F3A] mb-3 flex items-center gap-2">
                  <span>✨ Aperçu interactif en temps réel de votre carte :</span>
                </div>

                <div className="max-w-sm mx-auto bg-gradient-to-br from-[#0B1F3A] via-[#112D4E] to-[#17375E] rounded-2xl p-5 text-white shadow-xl border-2 border-[#C9A227] relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#C9A227] text-[#0B1F3A] text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">
                    Lou Ame Tay • Officiel
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={formData.avatarUrl || '/images/commercial1.jpg'}
                      alt="Aperçu photo"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#C9A227] shadow"
                    />
                    <div>
                      <div className="text-base font-extrabold text-white">M. le Conseiller</div>
                      <div className="text-xs font-bold text-[#F8E294]">{formData.jobTitle || 'Conseiller Digital CHR'}</div>
                      <div className="text-[11px] text-slate-300">📍 {formData.assignedTerritory}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Ligne certifiée : {formData.payoutPhone || '+221 77 000 00 00'}</span>
                    <span className="bg-emerald-600/30 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                      ● Actif
                    </span>
                  </div>
                </div>
              </div>

              {/* Boutons Retour / Suivant */}
              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-xl transition-all"
                >
                  ⬅ Étape précédente
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0B1F3A] hover:bg-[#17375E] text-[#F8E294] font-black text-sm px-8 py-3.5 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                >
                  <span>{isSubmitting ? 'Sauvegarde...' : 'CONTINUER VERS LE CONTRAT (ÉTAPE 3) ➔'}</span>
                </button>
              </div>

            </form>
          )}

          {/* ====================================================================
              ÉTAPE 3 : LECTURE DU CONTRAT & SIGNATURE TACTILE OBLIGATOIRE
              ==================================================================== */}
          {currentStep === 3 && (
            <form onSubmit={submitStep3} className="space-y-6">
              
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                    <span>📜 3. Lecture & Scellage du Contrat LAT-COM-2026</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sous l'empire des lois du Sénégal (COCC, Lois 2008-08 & 2008-12, Startup Act).
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  hasScrolledToBottom 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {hasScrolledToBottom ? '✅ Lecture complète validée' : '⚠️ Défilez jusqu’en bas pour signer'}
                </span>
              </div>

              {/* Cadre de lecture du texte contractuel intégral */}
              <div
                ref={contractScrollRef}
                onScroll={handleContractScroll}
                className="h-80 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-3 leading-relaxed shadow-inner"
              >
                <div className="text-center font-bold text-[#0B1F3A] border-b pb-2">
                  CONTRAT D'AGENT COMMERCIAL DE TERRAIN & DÉVELOPPEMENT B2B<br />
                  <span className="text-[#C9A227]">PLATEFORME SAAS CHR « LOU AME TAY »</span><br />
                  Réf. : LAT-COM-2026-[MATRICULE] • Direction Générale : M. Mbaye Babacar GUEYE
                </div>

                <div className="bg-white p-3 rounded border text-slate-800">
                  <strong>PARTIES CONTRACTANTES :</strong><br />
                  <strong>1. Le Mandant :</strong> LOU AME TAY SASU / Médias Graphisme Sénégal / DAW Digital Arts Work.<br />
                  <strong>2. Le Mandataire :</strong> Conseiller Commercial de Terrain.<br />
                  • CNI / CEDEAO : <strong>{formData.cniNumber || '[À renseigner]'}</strong><br />
                  • Ligne Mobile Money : <strong>{formData.payoutOperator} {formData.payoutPhone}</strong> ({formData.payoutAccountName})<br />
                  • Zone d'affectation : <strong>{formData.assignedTerritory}</strong><br />
                  • Locomotion : <strong>{formData.transportMode}</strong>
                </div>

                <p><strong>ARTICLE 1 : L'APPLICATION MOBILE TERRAIN OBLIGATOIRE (ERP/CRM 2.0 INTÉGRÉ)</strong><br />
                Tout le travail de prospection, de cotation, de suivi et de gestion contractuelle doit impérativement s'effectuer au sein de l'application officielle.</p>

                <p><strong>ARTICLE 2 : GÉOLOCALISATION GPS OBLIGATOIRE & POINTAGE « CHRONO AGENT »</strong><br />
                Pour garantir la certification des visites terrain et l'intégrité des commissions, l'Agent maintient le GPS actif durant ses tournées. Toute désactivation ou falsification constitue une faute lourde.</p>

                <p><strong>ARTICLE 3 : CARTE DE VISITE DIGITALE CONNECTÉE</strong><br />
                Dotation de la carte connectée Lou Ame Tay avec QR Code interactif et suivi analytique en direct.</p>

                <p><strong>ARTICLE 4 : RÉMUNÉRATION (ACQUISITION 10% À 25% & RÉCURRENCE 10%)</strong><br />
                Commissions d'acquisition variables de 10% à 25% sur contrats signés + commission de fidélisation continue de 10% sur les redevances mensuelles tant que le client demeure abonné.</p>

                <p><strong>ARTICLE 5 : PAIEMENT INSTANTANÉ PAR MOBILE MONEY (WAVE / ORANGE MONEY)</strong><br />
                Dès confirmation de l'encaissement par la DAF, versement immédiat sur la ligne Mobile Money certifiée déclarée.</p>

                <p><strong>ARTICLE 6 : NOTES DE FRAIS & TRANSPORTS</strong><br />
                Prise en charge et remboursement dématérialisé sur capture photo obligatoire du justificatif.</p>

                <p><strong>ARTICLE 7 : CONFIDENTIALITÉ ABSOLUE & CLAUSE PÉNALE (5 000 000 FCFA)</strong><br />
                Interdiction absolue d'exporter ou divulguer les algorithmes, codes, clients et données. Pénalité minimale de 5 000 000 FCFA en cas de violation avérée devant les tribunaux de Dakar/Thiès.</p>

                <p><strong>ARTICLE 8 : INTERDICTION FORMELLE DE MANIPULATION D'ESPÈCES</strong><br />
                Tous les règlements s'effectuent par les canaux officiels Wave/OM ou bancaires Lou Ame Tay SASU.</p>

                <p><strong>ARTICLE 9 : DURÉE, RÉSILIATION & EXTINCTION DES COMMISSIONS RÉCURRENTES</strong><br />
                Contrat de 6 mois renouvelable. En cas de résiliation, perte immédiate et irrévocable de tout droit aux commissions récurrentes futures.</p>

                <div className="bg-emerald-50 border border-emerald-300 p-2 rounded text-center text-emerald-800 font-bold">
                  ✓ Fin du texte contractuel — Apposez votre signature tactile ci-dessous.
                </div>
              </div>

              {/* Pad tactile de signature HTML5 Canvas */}
              <div className="border border-slate-300 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase text-[#0B1F3A]">
                    Signature tactile au doigt ou stylet *
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    🔄 Effacer et recommencer
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 touch-none cursor-crosshair block"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs pointer-events-none">
                      ✍️ Signez ici avec votre doigt ou stylet
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox d'engagement légal */}
              <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreed}
                  onChange={e => setFormData({ ...formData, agreed: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#0B1F3A]"
                />
                <span>
                  Je déclare avoir lu attentivement l'intégralité du contrat <strong>LAT-COM-2026</strong> et j'en accepte toutes les clauses sans réserve, notamment l'obligation formelle de géolocalisation GPS durant les tournées, l'interdiction stricte de maniement d'espèces, la clause pénale de 5 000 000 FCFA et l'extinction des commissions récurrentes à la résiliation.
                </span>
              </label>

              {/* Bouton de Scellage et Déverrouillage */}
              <div className="pt-2 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-xl transition-all"
                >
                  ⬅ Étape précédente
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasSignature || !formData.agreed}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 text-white font-black text-sm px-8 py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <span>{isSubmitting ? 'Scellage & Homologation...' : 'VALIDER ET ACTIVER MON COMPTE COMMERCIAL 🚀'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
