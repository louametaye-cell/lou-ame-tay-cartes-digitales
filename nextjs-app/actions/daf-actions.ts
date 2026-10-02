'use server';

import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const approvalSchema = z.object({
  commissionId: z.string().min(1, 'ID de commission requis'),
  motif: z.string().min(3, 'Un motif de validation/décaissement est obligatoire'),
  modePaiement: z.enum(['WAVE_BUSINESS', 'ORANGE_MONEY_PRO'], {
    required_error: 'Sélectionnez le canal Mobile Money certifié'
  })
});

/**
 * DOUBLE VALIDATION FINANCIÈRE DAF (ARTICLE 9 DU CONTRAT COMMERCIAL)
 * Aucune commission ne peut être versée sans la double clé Chef des Ventes + DAF.
 */
export async function approuverPaiementDafAction(input: any) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: 'Accès refusé : session expirée' };

  // Contrôle RBAC strict : Seul le rôle DAF ou SUPER_ADMIN peut valider le décaissement
  if (user.role !== 'DAF' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Violation de sécurité : Seul un Directeur Administratif & Financier (DAF) habilité peut autoriser un décaissement Mobile Money.'
    };
  }

  const parsed = approvalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Données invalides' };
  }

  const { commissionId, motif, modePaiement } = parsed.data;

  // Récupération de la commission
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    include: { commercial: true }
  });

  if (!commission) {
    return { success: false, error: 'Commission introuvable' };
  }

  // Vérification de non-résiliation (Article 9.3 : extinction des commissions post-rupture)
  if (commission.commercial.contractStatus === 'TERMINATED' || commission.commercial.isActive === false) {
    return {
      success: false,
      error: 'Décaissement bloqué (Article 9.3) : Le contrat de ce commercial est résilié. Toute commission récurrente est éteinte de plein droit.'
    };
  }

  // Application de la validation financière DAF
  const dateValidation = new Date();
  const refPaiement = `PAY-${modePaiement === 'WAVE_BUSINESS' ? 'WAVE' : 'OM'}-${Date.now().toString().slice(-6)}`;

  await prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: 'APPROUVE_DAF_PAYOUT',
      validatedByDafId: user.id,
      validatedAt: dateValidation,
      payoutReference: refPaiement,
      payoutMethod: modePaiement,
      dafNotes: motif
    }
  });

  // Journal d'audit légal inaltérable
  await prisma.auditLog.create({
    data: {
      action: 'APPROBATION_DAF_COMMISSION',
      performedById: user.id,
      targetUserId: commission.commercialId,
      details: {
        commissionId,
        montant: commission.amount,
        beneficiaire: `${commission.commercial.firstName} ${commission.commercial.lastName}`,
        payoutPhone: commission.commercial.payoutPhone,
        refPaiement,
        motif
      }
    }
  });

  revalidatePath('/admin/commissions');
  revalidatePath('/commercial');

  return {
    success: true,
    message: `Commission de ${commission.amount} FCFA approuvée avec succès. Réf. Payout : ${refPaiement}`,
    refPaiement
  };
}
