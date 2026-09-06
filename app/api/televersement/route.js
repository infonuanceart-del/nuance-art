import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { refuserSiNonAdmin } from '@/lib/auth';
import { slugifier } from '@/lib/produit';
import { cloudinaryActif, envoyerImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';

const DOSSIER = path.join(process.cwd(), 'public', 'media', 'art');
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'];
const POIDS_MAX = 25 * 1024 * 1024;

/**
 * Reçoit une image d'œuvre et renvoie les deux URL attendues par le site :
 * la grande version (1400 px) et la vignette (520 px), toutes deux en webp.
 *
 * Avec Cloudinary configuré, l'original part sur le CDN qui fabrique les deux
 * rendus à la demande. Sinon, sharp les écrit dans public/media/art, comme
 * scripts/build_catalogue.mjs pour le catalogue de démonstration — pratique en
 * local, mais à ne pas utiliser sur un hébergement au disque éphémère.
 */
export async function POST(req) {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;

  try {
    const form = await req.formData();
    const fichier = form.get('fichier');
    if (!fichier || typeof fichier.arrayBuffer !== 'function') {
      return NextResponse.json({ erreur: 'Aucun fichier reçu.' }, { status: 400 });
    }
    if (!TYPES.includes(fichier.type)) {
      return NextResponse.json({ erreur: 'Format non accepté (JPEG, PNG, WebP ou TIFF).' }, { status: 400 });
    }
    if (fichier.size > POIDS_MAX) {
      return NextResponse.json({ erreur: 'Image trop lourde (25 Mo maximum).' }, { status: 400 });
    }

    const entree = Buffer.from(await fichier.arrayBuffer());
    const base = slugifier(form.get('nom') || fichier.name.replace(/\.[^.]+$/, '')) || 'oeuvre';

    if (cloudinaryActif) {
      const envoi = await envoyerImage(entree, base);
      return NextResponse.json({ ok: true, stockage: 'cloudinary', ...envoi });
    }

    // ------------------------------------------------------- repli sur le disque
    const image = sharp(entree, { failOn: 'none' });
    const meta = await image.metadata();
    if (!meta.width || !meta.height) {
      return NextResponse.json({ erreur: 'Image illisible.' }, { status: 400 });
    }

    // Horodatage : deux œuvres au même titre ne peuvent pas s'écraser.
    const nom = `${base}-${Date.now().toString(36)}`;
    await fs.mkdir(DOSSIER, { recursive: true });

    await image
      .clone()
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(DOSSIER, `${nom}.webp`));

    await image
      .clone()
      .resize({ width: 520, height: 520, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 74 })
      .toFile(path.join(DOSSIER, `${nom}-thumb.webp`));

    return NextResponse.json({
      ok: true,
      stockage: 'disque',
      image: `/media/art/${nom}.webp`,
      thumb: `/media/art/${nom}-thumb.webp`,
      ratio: Number((meta.width / meta.height).toFixed(4)),
    });
  } catch (e) {
    console.error('[televersement]', e);
    return NextResponse.json({ erreur: 'Le traitement de l’image a échoué.' }, { status: 500 });
  }
}
