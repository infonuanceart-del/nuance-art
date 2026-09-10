/**
 * Previent la vitrine qu'elle doit oublier son catalogue en cache.
 *
 * La vitrine est rendue a l'avance et servie depuis un cache : sans ce signal,
 * une oeuvre creee ou supprimee ici n'apparait qu'a l'expiration du delai de
 * fraicheur, et meme plus tard puisque Next sert d'abord la version perimee.
 *
 * Deliberement silencieux et sans await cote appelant : la reponse a
 * l'administrateur ne doit jamais dependre de la vitrine. Au pire la purge
 * echoue et l'ancien delai reprend son role de filet.
 */
const VITRINE = (process.env.VITRINE_URL || '').replace(/\/$/, '');
const SECRET = process.env.REVALIDATION_SECRET || '';

let prevenu = false;

export function prevenirVitrine(motif = '') {
  if (!VITRINE || !SECRET) {
    // Un seul avertissement : sinon chaque ecriture pollue le journal.
    if (!prevenu) {
      console.warn(
        '[revalidation] VITRINE_URL ou REVALIDATION_SECRET absent : '
        + 'la vitrine ne sera pas prevenue, elle attendra son delai de fraicheur.',
      );
      prevenu = true;
    }
    return;
  }

  fetch(`${VITRINE}/api/revalidation`, {
    method: 'POST',
    headers: { 'x-revalidation-secret': SECRET },
    signal: AbortSignal.timeout(10_000),
  })
    .then((r) => {
      if (!r.ok) console.warn(`[revalidation] ${motif} : la vitrine a repondu ${r.status}`);
    })
    .catch((e) => console.warn(`[revalidation] ${motif} : ${e.message}`));
}
