/**
 * Purge du cache catalogue, appelee par l'API apres chaque ecriture.
 *
 * Sans elle, la vitrine attend l'expiration de FRAICHEUR — et comme Next sert
 * la version perimee au premier visiteur en ne regenerant qu'en arriere-plan,
 * l'attente reelle depasse largement le delai annonce sur un site peu visite.
 *
 * Cette route n'a de sens qu'en construction serveur. L'export statique ne
 * sait pas produire une route POST : scripts/build-statique.mjs ecarte donc
 * app/api/ le temps de l'export. Renommer ce fichier plutot que le deplacer
 * avait ete essaye — un `pageExtensions` personnalise fait echouer Vercel sur
 * un manifeste manquant (route_client-reference-manifest.js).
 */
import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { ETIQUETTE } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';

/** Comparaison a duree constante : un `===` laisse deviner le secret octet par octet. */
function memeSecret(donne, attendu) {
  const a = Buffer.from(donne);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(requete) {
  const attendu = process.env.REVALIDATION_SECRET || '';

  // Pas de secret configure : on refuse plutot que d'ouvrir la purge a tous.
  if (!attendu) {
    return Response.json(
      { erreur: 'REVALIDATION_SECRET absent de la vitrine.' },
      { status: 503 },
    );
  }

  if (!memeSecret(requete.headers.get('x-revalidation-secret') || '', attendu)) {
    return Response.json({ erreur: 'Secret invalide.' }, { status: 401 });
  }

  revalidateTag(ETIQUETTE);

  return Response.json({
    ok: true,
    purge: ETIQUETTE,
    heure: new Date().toISOString(),
  });
}
