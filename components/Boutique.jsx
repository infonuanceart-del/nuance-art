'use client';

/**
 * État boutique côté client : panier, favoris, petites notifications.
 * Persisté dans localStorage (chaque visiteur garde son panier d'une visite
 * à l'autre) et exposé à toute l'application via un contexte React.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CLE_PANIER = 'nuance.panier.v1';
const CLE_FAVORIS = 'nuance.favoris.v1';

const Contexte = createContext(null);

function lireLocal(cle, defaut) {
  if (typeof window === 'undefined') return defaut;
  try {
    const v = JSON.parse(window.localStorage.getItem(cle) || 'null');
    return v ?? defaut;
  } catch {
    return defaut;
  }
}

export function BoutiqueProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [favoris, setFavoris] = useState([]);
  const [pret, setPret] = useState(false);
  const [toast, setToast] = useState(null);

  // Hydratation après le premier rendu : le HTML serveur et client restent identiques.
  useEffect(() => {
    setArticles(lireLocal(CLE_PANIER, []));
    setFavoris(lireLocal(CLE_FAVORIS, []));
    setPret(true);
  }, []);

  useEffect(() => {
    if (pret) window.localStorage.setItem(CLE_PANIER, JSON.stringify(articles));
  }, [articles, pret]);

  useEffect(() => {
    if (pret) window.localStorage.setItem(CLE_FAVORIS, JSON.stringify(favoris));
  }, [favoris, pret]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const ajouter = useCallback((article) => {
    const id = `${article.slug}|${article.taille?.ref || 'x'}|${article.cadre || 'aucun'}`;
    setArticles((liste) => {
      const i = liste.findIndex((a) => a.id === id);
      if (i >= 0) {
        const copie = [...liste];
        copie[i] = { ...copie[i], qte: copie[i].qte + (article.qte || 1) };
        return copie;
      }
      return [...liste, { ...article, id, qte: article.qte || 1 }];
    });
    setToast({ type: 'panier', titre: article.titre, image: article.thumb || article.image });
  }, []);

  const retirer = useCallback((id) => setArticles((l) => l.filter((a) => a.id !== id)), []);

  const changerQte = useCallback((id, qte) => {
    setArticles((l) =>
      l.flatMap((a) => (a.id !== id ? [a] : qte < 1 ? [] : [{ ...a, qte }])),
    );
  }, []);

  const vider = useCallback(() => setArticles([]), []);

  const basculerFavori = useCallback((slug) => {
    setFavoris((l) => {
      const dedans = l.includes(slug);
      setToast({ type: 'favori', titre: dedans ? 'Retiré des favoris' : 'Ajouté aux favoris' });
      return dedans ? l.filter((s) => s !== slug) : [...l, slug];
    });
  }, []);

  const valeur = useMemo(() => {
    const nombre = articles.reduce((n, a) => n + a.qte, 0);
    const sousTotal = articles.reduce((n, a) => n + a.prixUnit * a.qte, 0);
    return {
      articles, favoris, pret, nombre, sousTotal, toast,
      ajouter, retirer, changerQte, vider, basculerFavori, setToast,
    };
  }, [articles, favoris, pret, toast, ajouter, retirer, changerQte, vider, basculerFavori]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useBoutique() {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useBoutique doit être utilisé dans <BoutiqueProvider>');
  return ctx;
}
