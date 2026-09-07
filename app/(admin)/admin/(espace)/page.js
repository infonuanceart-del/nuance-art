'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { appeler } from '@/lib/api';
import { dh } from '@/lib/prix';
import { NOM_STATUT } from '@/lib/produit';
import { nomTheme, nomFormat } from '@/lib/taxonomie';
import { useDonnees, EtatChargement } from '@/components/admin/useDonnees';
import { Courbe, BornesCourbe, Barres } from '@/components/admin/Graphique';
import {
  PERIODES, decouper, totaux, evolution, serie, parStatut,
  ventesParOeuvre, ventesParTheme, parVille, jamaisVendues, etatCatalogue, repartition,
} from '@/lib/tableauBord';

const TON = { nouvelle: 'warn', confirmee: '', expediee: '', livree: 'ok', annulee: 'no' };

/** Ecart affiche a cote d'un KPI. Muet quand la periode precedente est vide. */
function Ecart({ valeur }) {
  if (valeur === null || !Number.isFinite(valeur)) return null;
  const arrondi = Math.round(valeur);
  if (arrondi === 0) return <i className="kpi-ecart stable">stable</i>;
  const hausse = arrondi > 0;
  return (
    <i className={`kpi-ecart ${hausse ? 'hausse' : 'baisse'}`}>
      {hausse ? '▲' : '▼'} {Math.abs(arrondi)} %
    </i>
  );
}

function Carte({ titre, lien, lienNom, children }) {
  return (
    <section className="carte">
      <div className="carte-tete">
        <h2 className="d4">{titre}</h2>
        {lien && <Link href={lien} className="link-arrow">{lienNom}</Link>}
      </div>
      {children}
    </section>
  );
}

export default function PageTableauDeBord() {
  const [periode, setPeriode] = useState('30j');

  const { donnees, erreur, chargement } = useDonnees(async () => {
    const [p, c] = await Promise.all([
      appeler('/api/produits', { avecJeton: true }),
      appeler('/api/commandes', { avecJeton: true }),
    ]);
    return { produits: p.produits, commandes: c.commandes };
  });

  const produits = donnees?.produits || [];
  const commandes = donnees?.commandes || [];
  const jours = PERIODES.find((p) => p.cle === periode)?.jours ?? null;

  /**
   * Tout le calcul tient dans un memo : il se refait quand les donnees
   * arrivent ou quand on change de periode, jamais a chaque frappe. L'instant
   * de reference est fige ici plutot que lu dans chaque fonction, pour que les
   * totaux et la courbe parlent bien de la meme seconde.
   */
  const vue = useMemo(() => {
    if (!donnees) return null;
    const maintenant = Date.now();

    const { courante, precedente } = decouper(commandes, jours, maintenant);
    const a = totaux(courante);
    const b = totaux(precedente);
    const meilleures = ventesParOeuvre(courante, produits);

    return {
      a,
      ecarts: {
        ca: evolution(a.ca, b.ca),
        nb: evolution(a.nb, b.nb),
        panier: evolution(a.panier, b.panier),
        articles: evolution(a.articles, b.articles),
      },
      points: serie(courante, jours, maintenant),
      statuts: parStatut(courante).filter((s) => s.nb > 0),
      meilleures: meilleures.slice(0, 6),
      themes: ventesParTheme(courante, produits).slice(0, 6),
      villes: parVille(courante).slice(0, 6),
      recentes: courante.slice(0, 8),
      catalogue: etatCatalogue(produits),
      parCategorie: repartition(produits, 'theme'),
      parFormat: repartition(produits, 'format'),
      dormantes: jamaisVendues(produits, commandes),
      comparable: precedente.length > 0,
    };
  }, [donnees, commandes, produits, jours]);

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Nuance Art</p>
          <h1 className="d3">Tableau de bord</h1>
        </div>
        <div className="row">
          <div className="seg" role="group" aria-label="Periode analysee">
            {PERIODES.map((p) => (
              <button
                key={p.cle}
                type="button"
                className={periode === p.cle ? 'on' : ''}
                aria-pressed={periode === p.cle}
                onClick={() => setPeriode(p.cle)}
              >
                {p.nom}
              </button>
            ))}
          </div>
          <Link href="/admin/produits/editer" className="btn btn-primary btn-sm">
            Ajouter une œuvre
          </Link>
        </div>
      </div>

      <EtatChargement chargement={chargement} erreur={erreur} />

      {vue && (
        <>
          {vue.a.aTraiter > 0 && (
            <Link href="/admin/commandes" className="admin-rappel">
              <b>{vue.a.aTraiter}</b>
              <span>
                {vue.a.aTraiter > 1 ? 'commandes attendent' : 'commande attend'} d’être
                confirmée{vue.a.aTraiter > 1 ? 's' : ''}.
              </span>
              <em>Les traiter</em>
            </Link>
          )}

          <div className="kpis">
            <div className="kpi">
              <span>Chiffre d’affaires</span>
              <b>{dh(vue.a.ca)}</b>
              <Ecart valeur={vue.ecarts.ca} />
            </div>
            <div className="kpi">
              <span>Commandes</span>
              <b>{vue.a.nb}</b>
              <Ecart valeur={vue.ecarts.nb} />
            </div>
            <div className="kpi">
              <span>Panier moyen</span>
              <b>{vue.a.nbValides ? dh(vue.a.panier) : '—'}</b>
              <Ecart valeur={vue.ecarts.panier} />
            </div>
            <div className="kpi">
              <span>Œuvres vendues</span>
              <b>{vue.a.articles}</b>
              <Ecart valeur={vue.ecarts.articles} />
            </div>
          </div>

          {jours && !vue.comparable && (
            <p className="tiny admin-note">
              Aucune commande sur la période précédente : les évolutions restent
              masquées tant qu’il n’y a rien à comparer.
            </p>
          )}

          <Carte titre="Chiffre d’affaires par jour">
            {vue.a.ca === 0 ? (
              <p className="admin-vide">
                Aucune vente sur cette période. Le graphique se remplira dès la
                première commande validée.
              </p>
            ) : (
              <>
                <Courbe points={vue.points} format={dh} />
                <BornesCourbe points={vue.points} />
              </>
            )}
          </Carte>

          <div className="grille-2">
            <Carte titre="Ventes par thème">
              <Barres
                lignes={vue.themes.map((t) => ({
                  cle: t.theme,
                  nom: t.theme === 'inconnu' ? 'Œuvre retirée' : nomTheme(t.theme),
                  valeur: t.ca,
                }))}
                format={dh}
                vide="Aucune vente sur cette période."
              />
            </Carte>

            <Carte titre="Où partent les colis">
              <Barres
                lignes={vue.villes.map((v) => ({
                  cle: v.ville,
                  nom: v.ville,
                  valeur: v.ca,
                }))}
                format={dh}
                vide="Aucune livraison sur cette période."
              />
            </Carte>
          </div>

          <div className="grille-2">
            <Carte titre="Meilleures ventes" lien="/admin/produits" lienNom="Toutes les œuvres">
              {vue.meilleures.length === 0 ? (
                <p className="admin-vide">Aucune vente sur cette période.</p>
              ) : (
                <ul className="classement">
                  {vue.meilleures.map((o, i) => (
                    <li key={o.slug}>
                      <span className="classement-rang">{i + 1}</span>
                      {o.image && <img src={o.image} alt="" loading="lazy" />}
                      <div>
                        {o.present ? (
                          <Link href={`/admin/produits/editer?slug=${o.slug}`}>{o.titre}</Link>
                        ) : (
                          <b>{o.titre}</b>
                        )}
                        <span className="tiny">
                          {o.qte} vendue{o.qte > 1 ? 's' : ''}
                          {!o.present && ' · retirée du catalogue'}
                        </span>
                      </div>
                      <b>{dh(o.ca)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>

            <Carte titre="Suivi des commandes" lien="/admin/commandes" lienNom="Toutes les commandes">
              <Barres
                lignes={vue.statuts.map((s) => ({
                  cle: s.statut,
                  nom: NOM_STATUT[s.statut] || s.statut,
                  valeur: s.nb,
                }))}
                vide="Aucune commande sur cette période."
              />

              <div className="carte-pied">
                <span><b>{vue.catalogue.enLigne}</b> œuvres en ligne</span>
                <span><b>{vue.catalogue.enPromo}</b> en promotion</span>
                {vue.catalogue.horsLigne > 0 && (
                  <span><b>{vue.catalogue.horsLigne}</b> hors ligne</span>
                )}
              </div>
            </Carte>
          </div>

          <Carte titre="Ce que vend la boutique" lien="/admin/produits" lienNom="Gérer les œuvres">
            <p className="carte-intro">
              État du catalogue, indépendant de la période choisie —
              {' '}{vue.catalogue.enLigne} œuvre{vue.catalogue.enLigne > 1 ? 's' : ''} en ligne
              {vue.catalogue.horsLigne > 0 && `, ${vue.catalogue.horsLigne} hors ligne`}
              {vue.catalogue.prixMin > 0 && `, de ${dh(vue.catalogue.prixMin)} à ${dh(vue.catalogue.prixMax)}`}.
            </p>

            <div className="grille-2">
              <div>
                <h3 className="lab">Par catégorie</h3>
                <Barres
                  lignes={vue.parCategorie.map((r) => ({
                    cle: r.cle, nom: nomTheme(r.cle), valeur: r.nb,
                  }))}
                  vide="Aucune œuvre au catalogue."
                />
              </div>

              <div>
                <h3 className="lab">Par format</h3>
                <Barres
                  lignes={vue.parFormat.map((r) => ({
                    cle: r.cle, nom: nomFormat(r.cle), valeur: r.nb,
                  }))}
                  vide="—"
                />
              </div>
            </div>

            <div className="carte-pied">
              <span><b>{vue.catalogue.enPromo}</b> en promotion</span>
              <span><b>{vue.catalogue.bestsellers}</b> mises en avant</span>
              <span><b>{vue.catalogue.nouveautes}</b> nouveautés</span>
              {vue.dormantes.length > 0 && (
                <span><b>{vue.dormantes.length}</b> jamais vendues</span>
              )}
            </div>
          </Carte>

          <Carte titre="Dernières commandes" lien="/admin/commandes" lienNom="Toutes les commandes">
            <div className="table-wrap plat">
              {vue.recentes.length === 0 ? (
                <p className="admin-vide">
                  Aucune commande sur cette période. Elles apparaîtront ici dès la
                  première validation de panier sur la boutique.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Client</th>
                      <th className="hide-sm">Articles</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th className="hide-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vue.recentes.map((c) => (
                      <tr key={c.ref}>
                        <td><b>{c.ref}</b></td>
                        <td>
                          {c.client?.nom}
                          <br />
                          <span className="tiny" style={{ color: 'var(--muted)' }}>{c.client?.ville}</span>
                        </td>
                        <td className="hide-sm">{(c.articles || []).reduce((s, a) => s + a.qte, 0)}</td>
                        <td>{dh(c.total)}</td>
                        <td><span className={`tag ${TON[c.statut] || ''}`}>{NOM_STATUT[c.statut] || c.statut}</span></td>
                        <td className="hide-sm tiny">
                          {new Date(c.createdAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Carte>

          {vue.dormantes.length > 0 && (
            <Carte titre="Jamais vendues" lien="/admin/promotions" lienNom="Mettre en avant">
              <p className="carte-intro">
                {vue.dormantes.length} œuvre{vue.dormantes.length > 1 ? 's' : ''} en ligne
                n’{vue.dormantes.length > 1 ? 'ont' : 'a'} jamais été commandée
                {vue.dormantes.length > 1 ? 's' : ''}, toutes périodes confondues.
              </p>
              <div className="admin-vignettes">
                {vue.dormantes.slice(0, 8).map((p) => (
                  <Link key={p.slug} href={`/admin/produits/editer?slug=${p.slug}`} className="admin-vignette">
                    <img src={p.thumb} alt="" loading="lazy" />
                    <div>
                      <b>{p.titre}</b>
                      <span className="tiny">{nomTheme(p.theme)} · {dh(p.prixMin)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Carte>
          )}
        </>
      )}
    </>
  );
}
