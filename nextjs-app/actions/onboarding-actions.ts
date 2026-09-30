'use server';

import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { step1Schema, step2Schema, step3Schema } from '@/lib/validations/onboarding';

// Action Étape 1 : Sauvegarde profil, Sécurité RH & KYC
export async function saveStep1Action(formData: any) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const parsed = step1Schema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Données invalides' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...parsed.data,
      onboardingStep: 2,
    },
  });

  return { success: true };
}

// Action Étape 2 : Sauvegarde Carte Digitale & Photo
export async function saveStep2Action(data: { avatarUrl: string; jobTitle: string; linkedinUrl?: string; whatsappDirectUrl?: string }) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const parsed = step2Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Données invalides' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      avatarUrl: parsed.data.avatarUrl,
      jobTitle: parsed.data.jobTitle,
      linkedinUrl: parsed.data.linkedinUrl || null,
      whatsappDirectUrl: parsed.data.whatsappDirectUrl || null,
      onboardingStep: 3,
    },
  });

  return { success: true };
}

// Action Étape 3 : Signature tactile et scellage du contrat LAT-COM-2026
export async function finalizeContractAction(data: { signatureDataUrl: string; agreed: boolean }) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const parsed = step3Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Signature tactile ou accord obligatoire' };
  }

  const headerList = headers();
  const clientIp = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || '127.0.0.1';
  const contractRef = `LAT-COM-2026-${user.id.slice(0, 4).toUpperCase()}`;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hasSignedContract: true,
      contractStatus: 'SIGNED',
      contractReference: contractRef,
      contractSignedAt: new Date(),
      contractSignatureUrl: parsed.data.signatureDataUrl,
      contractSignIp: clientIp,
      onboardingStep: 4, // Terminé & Homologué
    },
  });

  revalidatePath('/agent/dashboard');
  revalidatePath('/commercial');
  return { success: true, contractReference: contractRef };
}
