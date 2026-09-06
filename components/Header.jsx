'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBoutique } from './Boutique';
import { THEMES, FORMATS, COULEURS, PIECES } from '@/lib/taxonomie';
import { dh } from '@/lib/prix';
import {
  IcoChevron, IcoCroix, IcoLoupe, IcoMenu, IcoPanier, IcoCoeur, IcoPinceau,
} from './Icones';

const MENUS = [
  {
    cle: 'themes',
    titre: 'Thèmes',
    colonnes: [
      { titre: 'Par univers', liens: THEMES.map((t) => ({ href: `/collections/${t.slug}`, nom: t.nom })) },
    ],
    deux: true,
  },
  {
    cle: 'formats',
    titre: 'Formats & couleurs',
    colonnes: [
      { titre: 'Format', liens: FORMATS.map((f) => ({ href: `/tableaux?format=${f.slug}`, nom: f.nom, note: f.desc })) },
      { titre: 'Couleur dominante', liens: COULEURS.map((c) => ({ href: `/tableaux?couleur=${c.slug}`, nom: c.nom, hex: c.hex })), deux: true },
    ],
  },
  {
    cle: 'pieces',
    titre: 'Par pièce',
    colonnes: [
      { titre: 'Où l’accrocher', liens: PIECES.map((p) => ({ href: `/tableaux?piece=${p.slug}`, nom: p.nom })) },
    ],
    deux: true,
  },
];

export default function Header({ vedette, indexRecherche = [] }) {
  const chemin = usePathname();
  const { nombre, favoris } = useBoutique();
  const [ouvert, setOuvert] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [accordeon, setAccordeon] = useState(null);
  const [recherche, setRecherche] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const champ = useRef(null);
  const fermeture = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Chaque navigation referme tout ce qui est ouvert.
  useEffect(() => {
    setDrawer(false);
    setOuvert(null);
    setRecherche(false);
  }, [chemin]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', drawer);
    return () => document.body.classList.remove('no-scroll');
  }, [drawer]);

  useEffect(() => {
    if (recherche) champ.current?.focus();
  }, [recherche]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setOuvert(null); setDrawer(false); setRecherche(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const resultats = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return indexRecherche
      .filter((p) => (p.titre + ' ' + p.artiste + ' ' + p.theme).toLowerCase().includes(t))
      .slice(0, 6);
  }, [q, indexRecherche]);

  // Ouverture/fermeture du méga-menu avec une petite temporisation, pour que la
  // souris puisse traverser l'espace entre le lien et le panneau.
  const survol = (cle) => {
    clearTimeout(fermeture.current);
    setOuvert(cle);
  };
  const quitte = () => {
    clearTimeout(fermeture.current);
    fermeture.current = setTimeout(() => setOuvert(null), 160);
  };

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span className="topbar-side">Livraison 48 h au Maroc</span>
          <span>
            <b>Ventes flash</b> — jusqu’à -40 % sur une sélection.{' '}
            <Link href="/promotions">J’en profite</Link>
          </span>
          <span className="topbar-side">Paiement à la livraison</span>
        </div>
      </div>

      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap header-in">
          <Link href="/" className="logo" aria-label="Nuance Art, accueil">
            <b>Nuance<span>Art</span></b>
            <em>Casablanca</em>
          </Link>

          <nav className="nav" aria-label="Navigation principale">
            {MENUS.map((m) => (
              <div
                key={m.cle}
                className={`nav-item${ouvert === m.cle ? ' open' : ''}`}
                onMouseEnter={() => survol(m.cle)}
                onMouseLeave={quitte}
              >
                <button
                  className="nav-link"
                  aria-expanded={ouvert === m.cle}
                  onClick={() => setOuvert(ouvert === m.cle ? null : m.cle)}
                >
                  {m.titre}
                  <IcoChevron size={14} className="chev" />
                </button>

                <div className="mega" role="group" aria-label={m.titre}>
                  {m.colonnes.map((col) => (
                    <div className="mega-col" key={col.titre} style={m.deux ? { gridColumn: 'span 2' } : undefined}>
                      <h4>{col.titre}</h4>
                      <div className={`mega-list${col.deux || m.deux ? ' two' : ''}`}>
                        {col.liens.map((l) => (
                          <Link key={l.href} href={l.href}>
                            <span>
                              {l.hex && <span className="dot-color" style={{ background: l.hex }} />}
                              {l.nom}
                            </span>
                            {l.note && <i>{l.note}</i>}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Link href="/studio" className="mega-promo">
                    {vedette && <img src={vedette.thumb} alt="" />}
                    <div>
                      <strong>Essayez sur votre mur</strong>
                      <span>Photo de votre pièce, taille réelle, en 10 secondes.</span>
                    </div>
                  </Link>
                </div>
              </div>
            ))}

            <Link href="/tableaux" className="nav-link">Toutes les œuvres</Link>
            <Link href="/studio" className="nav-link">Studio</Link>
            <Link href="/promotions" className="nav-link accent">Promotions</Link>
          </nav>

          <div className="header-actions">
            <button className="icon-btn" onClick={() => setRecherche((v) => !v)} aria-label="Rechercher">
              <IcoLoupe />
            </button>
            <Link href="/favoris" className="icon-btn" aria-label="Mes favoris">
              <IcoCoeur />
              {favoris.length > 0 && <span className="count">{favoris.length}</span>}
            </Link>
            <Link href="/panier" className="icon-btn" aria-label="Mon panier">
              <IcoPanier />
              {nombre > 0 && <span className="count">{nombre}</span>}
            </Link>
            <Link href="/studio" className="btn btn-primary btn-sm header-cta">
              <IcoPinceau size={16} /> Tester chez moi
            </Link>
            <button className="icon-btn burger" onClick={() => setDrawer(true)} aria-label="Ouvrir le menu">
              <IcoMenu />
            </button>
          </div>
        </div>

        <div className={`search-pop${recherche ? ' open' : ''}`}>
          <div className="wrap">
            <div className="search-in">
              <IcoLoupe size={22} />
              <input
                ref={champ}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Chercher une œuvre, un artiste, un thème…"
                aria-label="Rechercher une œuvre"
              />
              <button className="icon-btn" onClick={() => setRecherche(false)} aria-label="Fermer la recherche">
                <IcoCroix />
              </button>
            </div>
            {q.trim().length >= 2 && (
              <div className="search-res">
                {resultats.length === 0 && <p className="small muted" style={{ padding: '0.5rem' }}>Aucune œuvre pour « {q} ».</p>}
                {resultats.map((p) => (
                  <Link key={p.slug} href={`/tableaux/${p.slug}`}>
                    <img src={p.thumb} alt="" />
                    <span style={{ flex: 1 }}>
                      <b style={{ display: 'block', fontSize: '0.9rem' }}>{p.titre}</b>
                      <span className="tiny muted">{p.artiste}</span>
                    </span>
                    <span className="small">dès {dh(p.prixMin)}</span>
                  </Link>
                ))}
                <Link href={`/tableaux?q=${encodeURIComponent(q)}`} className="link-arrow" style={{ margin: '0.5rem' }}>
                  Voir tous les résultats
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- menu mobile --- */}
      <div className={`drawer${drawer ? ' open' : ''}`} aria-hidden={!drawer}>
        <div className="drawer-bg" onClick={() => setDrawer(false)} />
        <div className="drawer-panel">
          <div className="drawer-head">
            <span className="logo"><b>Nuance<span>Art</span></b></span>
            <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Fermer le menu">
              <IcoCroix />
            </button>
          </div>
          <div className="drawer-body">
            {MENUS.map((m) => (
              <div className={`acc-item${accordeon === m.cle ? ' open' : ''}`} key={m.cle}>
                <button className="acc-btn" onClick={() => setAccordeon(accordeon === m.cle ? null : m.cle)}>
                  {m.titre} <IcoChevron size={16} className="chev" />
                </button>
                <div className="acc-panel">
                  <div>
                    <div>
                      {m.colonnes.flatMap((c) => c.liens).map((l) => (
                        <Link key={l.href + l.nom} href={l.href}>{l.nom}</Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="acc-item"><Link className="acc-btn" href="/tableaux">Toutes les œuvres</Link></div>
            <div className="acc-item"><Link className="acc-btn" href="/studio">Studio — voir chez moi</Link></div>
            <div className="acc-item"><Link className="acc-btn" href="/promotions" style={{ color: 'var(--clay)' }}>Promotions</Link></div>
            <div className="acc-item"><Link className="acc-btn" href="/a-propos">L’atelier</Link></div>
            <div className="acc-item"><Link className="acc-btn" href="/contact">Contact</Link></div>

            <Link href="/studio" className="btn btn-primary btn-block mt-3">
              <IcoPinceau size={16} /> Tester sur mon mur
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
