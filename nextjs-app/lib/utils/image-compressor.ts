/**
 * ==============================================================================
 * FICHIER : nextjs-app/lib/utils/image-compressor.ts
 * COMPRESSEUR CLIENT NEXT.JS / TYPESCRIPT « DATA-SAVER SÉNÉGAL »
 * ==============================================================================
 * Réduction des images sous 130 Ko en WebP / JPEG pour préserver les pass internet
 * et garantir des uploads fiables sur Supabase Storage en réseau 3G/4G faible.
 */

export interface CompressionOptions {
  maxDimension?: number;
  maxPoidsKo?: number;
  qualiteInitiale?: number;
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  base64: string;
  sizeKo: number;
  originalSizeKo: number;
  gainPercent: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxDimension: 1200,
  maxPoidsKo: 130,
  qualiteInitiale: 0.78
};

function supporteWebp(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  } catch {
    return false;
  }
}

function chargerImage(fichier: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error('Erreur décodage image: ' + err));
      img.src = e.target?.result as string;
    };
    lecteur.onerror = (err) => reject(err);
    lecteur.readAsDataURL(fichier);
  });
}

function canvasVersBlob(canvas: HTMLCanvasElement, type: string, qualite: number): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, type, qualite);
  });
}

function blobVersBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function compresserImageClient(
  fichierSource: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const tailleOriginaleKo = Math.round(fichierSource.size / 1024);

  if (tailleOriginaleKo <= 90 && fichierSource.type.includes('image')) {
    const base64Direct = await blobVersBase64(fichierSource);
    return {
      file: fichierSource as File,
      blob: fichierSource,
      base64: base64Direct,
      sizeKo: tailleOriginaleKo,
      originalSizeKo: tailleOriginaleKo,
      gainPercent: 0
    };
  }

  const img = await chargerImage(fichierSource);
  let { width, height } = img;

  if (width > config.maxDimension || height > config.maxDimension) {
    const ratio = Math.min(config.maxDimension / width, config.maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
  }

  const mimeType = supporteWebp() ? 'image/webp' : 'image/jpeg';
  const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';

  let qualite = config.qualiteInitiale;
  let blob = await canvasVersBlob(canvas, mimeType, qualite);
  let tentative = 0;

  while (blob.size / 1024 > config.maxPoidsKo && qualite > 0.45 && tentative < 3) {
    qualite -= 0.12;
    blob = await canvasVersBlob(canvas, mimeType, qualite);
    tentative++;
  }

  const tailleFinaleKo = Math.round(blob.size / 1024);
  const nomBase = (fichierSource as File).name
    ? (fichierSource as File).name.replace(/\.[^/.]+$/, '')
    : 'capture_terrain';

  const fichierCompresse = new File([blob], `${nomBase}_lat_opti${extension}`, {
    type: mimeType,
    lastModified: Date.now()
  });

  const base64Final = await blobVersBase64(blob);
  const gainPercent = Math.max(0, Math.round(((tailleOriginaleKo - tailleFinaleKo) / (tailleOriginaleKo || 1)) * 100));

  return {
    file: fichierCompresse,
    blob,
    base64: base64Final,
    sizeKo: tailleFinaleKo,
    originalSizeKo: tailleOriginaleKo,
    gainPercent
  };
}
