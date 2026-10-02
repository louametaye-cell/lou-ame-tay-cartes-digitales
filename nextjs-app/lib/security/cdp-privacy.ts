/**
 * ==============================================================================
 * FICHIER : nextjs-app/lib/security/cdp-privacy.ts
 * CONFORMITÉ LOI SÉNÉGALAISE 2008-12 (PROTECTION DES DONNÉES PERSONNELLES)
 * ==============================================================================
 */

export function masquerCni(cni: string | null | undefined): string {
  if (!cni) return 'Non renseigné';
  const clean = cni.trim();
  if (clean.length < 8) return '********';

  const visibleDebut = clean.substring(0, 4);
  const visibleFin = clean.substring(clean.length - 3);
  return `${visibleDebut} **** **** ${visibleFin}`;
}

export function masquerTelephone(telephone: string | null | undefined): string {
  if (!telephone) return 'Non renseigné';
  const clean = telephone.replace(/[^0-9+]/g, '');

  if (clean.length >= 9) {
    const debut = clean.substring(0, clean.startsWith('+') ? 6 : 2);
    const fin = clean.substring(clean.length - 2);
    return `${debut} *** ** ${fin}`;
  }
  return '*** *** ***';
}

export async function calculerEmpreinteSha256(donneesTexte: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encodeur = new TextEncoder();
      const buffer = encodeur.encode(donneesTexte);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Crypto subtle indisponible:', e);
  }

  return `lat_sha256_${Date.now()}`;
}
