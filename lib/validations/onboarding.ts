import { z } from 'zod';

export const step1Schema = z.object({
  secondaryEmail: z.string().email('Email secondaire invalide').optional().or(z.literal('')),
  secondaryPhone: z.string().min(9, 'Numéro secondaire requis (9 chiffres)').max(15),
  payoutOperator: z.enum(['WAVE', 'ORANGE_MONEY'], { required_error: 'Sélectionnez Wave ou Orange Money' }),
  payoutPhone: z.string().min(9, 'Numéro Mobile Money requis (ex: 77 458 74 74)'),
  payoutAccountName: z.string().min(3, 'Le nom du compte doit correspondre à votre CNI'),
  cniNumber: z.string().min(10, 'Numéro CNI / CEDEAO valide requis'),
  cniFrontUrl: z.string().min(1, 'La photo CNI Recto est requise'),
  cniBackUrl: z.string().min(1, 'La photo CNI Verso est requise'),
  emergencyName: z.string().min(3, 'Nom du contact d’urgence requis'),
  emergencyRelation: z.string().min(2, 'Lien de parenté requis (ex: Parent, Conjoint)'),
  emergencyPhone: z.string().min(9, 'Numéro d’urgence requis (9 chiffres)'),
  transportMode: z.enum(['MOTO_SCOOTER', 'VEHICULE_PERSO', 'TRANSPORT_COMMUN'], {
    required_error: 'Veuillez sélectionner votre moyen de déplacement'
  }),
  assignedTerritory: z.string().min(2, 'Veuillez sélectionner votre zone d’affectation'),
});

export const step2Schema = z.object({
  avatarUrl: z.string().min(1, 'La photo professionnelle est obligatoire'),
  jobTitle: z.string().min(3, 'Titre professionnel requis (ex: Conseiller Digital CHR)'),
  linkedinUrl: z.string().url('URL LinkedIn invalide').optional().or(z.literal('')),
  whatsappDirectUrl: z.string().optional(),
});

export const step3Schema = z.object({
  signatureDataUrl: z.string().min(100, 'Signature tactile obligatoire'),
  agreed: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter l’ensemble des clauses contractuelles pour continuer.' }),
  }),
});

export type Step1Input = z.infer<typeof step1Schema>;
export type Step2Input = z.infer<typeof step2Schema>;
export type Step3Input = z.infer<typeof step3Schema>;
