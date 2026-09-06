'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { effacerJeton } from '@/lib/api';

/**
 * Chargement des donnees d'un ecran d'administration.
 *
 * Mutualise ce que les six ecrans repetaient : etat de chargement, message
 * d'erreur, rechargement apres une ecriture, et sortie propre quand le jeton
 * n'est plus accepte.
 */
export function useDonnees(charger) {
  const router = useRouter();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    setErreur('');
    try {
      setDonnees(await charger());
    } catch (e) {
      // 401 : jeton expire ou revoque. On sort plutot que d'afficher une
      // erreur que l'utilisateur ne peut pas resoudre depuis cet ecran.
      if (e.statut === 401) {
        effacerJeton();
        router.replace('/admin/connexion');
        return;
      }
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
    // charger est recree a chaque rendu par les appelants : on ne le suit pas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => { recharger(); }, [recharger]);

  return { donnees, erreur, chargement, recharger, setErreur };
}

/** Ecran d'attente et d'erreur, identique partout. */
export function EtatChargement({ chargement, erreur }) {
  if (chargement) {
    return <p className="admin-vide">Chargement…</p>;
  }
  if (erreur) {
    return <p className="alert err" role="alert">{erreur}</p>;
  }
  return null;
}
